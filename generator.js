var handlebars = require('handlebars');
var helper = require('./lib/helper');
var path = require('path');
var fs = require('fs-extra');
var _ = require('lodash');


var classBaseTpl = {};
var classTpl = {};
var typeTpls = {};

module.exports = {
    generate: function (swagger, outPath) {
        var templatePath = path.resolve(__dirname, 'template');
        var basePath = path.join(outPath, 'base');
        var helperPath = path.join(outPath, 'helper');

        // Remove and make out folder
        fs.removeSync(basePath);

        // Make folders
        fs.mkdirpSync(basePath);
        fs.mkdirpSync(helperPath);

        // Copy model base
        fs.copySync(path.join(templatePath, 'ModelBase.js'), path.join(basePath, 'ModelBase.js'));
        fs.copySync(path.join(templatePath, 'extend.js'), path.join(helperPath, 'extend.js'));

        // Compile template
        classBaseTpl = handlebars.compile(fs.readFileSync(path.join(templatePath, 'classBase.js.tpl')).toString(), {noEscape: true});
        classTpl = handlebars.compile(fs.readFileSync(path.join(templatePath, 'class.js.tpl')).toString(), {noEscape: true});
        typeTpls = _.transform(fs.readdirSync(path.join(templatePath, 'types')), function (result, fileName) {
            var filePath = path.join(templatePath, 'types', fileName);
            var type = fileName.replace('.tpl', '');

            result[type] = handlebars.compile(fs.readFileSync(filePath).toString(), {noEscape: true});
        });


        _.each(swagger.definitions, function (classDef, fullClassName) {
            var data = {}, dependencies = [];

            data.className = helper.getClassName(fullClassName);

            data.properties = [];

            var types = {}, enums = {};
            _.each(classDef.properties, function (propertyDef, name) {
                var property = {};

                property.name = helper.getPropertyName(name);

                // Add enum
                if (propertyDef.enum) {
                    enums[name] = propertyDef.enum;
                }

                // If the property definition has referenceData
                // We generate an empty property then in runtime
                // retrieve the references and put into it
                if (propertyDef.referenceData) {
                    enums[name] = [];
                }

                if (!propertyDef.type) {
                    // Reference type
                    property.type = helper.getClassName(propertyDef.$ref);
                    dependencies.push(property.type);
                    types[name] = property.type;
                } else {
                    if (propertyDef.type === 'array') {
                        // Array type
                        var itemsDef = propertyDef.items;
                        if (itemsDef.$ref) {
                            types[name] = helper.getClassName(itemsDef.$ref);
                        } else if (itemsDef.enum) {
                            // Array can be array of enum
                            types[name] = 'string';
                            enums[name] = itemsDef.enum;
                        } else {
                            types[name] = ((itemsDef.format) ? '{0}:{1}' : '{0}').f(itemsDef.type, itemsDef.format);
                        }
                        types[name] = types[name] + '[]';

                    } else {
                        // Simple type
                        types[name] = ((propertyDef.format) ? '{0}:{1}' : '{0}').f(propertyDef.type, propertyDef.format);
                    }
                }

                // Build property
                if (propertyDef.format && propertyDef.format in typeTpls) {
                    property.definition = typeTpls[propertyDef.format](property);

                } else if (propertyDef.type && propertyDef.type in typeTpls) {
                    property.definition = typeTpls[propertyDef.type](property);

                } else {
                    property.definition = typeTpls['reference'](property);
                }

                data.properties.push(property);
            });

            // Build type list
            data.typeList = JSON.stringify(types) || '{}';

            // Build dependency
            data.requires = _.map(_.unique(dependencies), function (dependency) {
                return "var {0} = require('../{0}');".f(dependency);
            }).join('\n');

            // Build enums
            data.enums = [];
            _.each(enums, function (enumList, name) {
                var enumDict = {};

                // enum can be either a string
                // or object { code: 'string', name: 'string', priority: integer }
                _.each(enumList, function (enumListItem) {
                    if (_.isString(enumListItem)) {
                        enumDict[enumListItem] = enumListItem;
                    } else {
                        enumDict[enumListItem.code] = enumListItem.code;
                    }
                });

                data.enums.push({ name: helper.getEnumName(name), enumList: JSON.stringify(enumDict) || '{}' });
            });

            // Build required list
            data.requiredList = JSON.stringify(classDef.required) || '[]';

            fs.writeFileSync(path.join(basePath, data.className + 'Base.js'), classBaseTpl(data));

            // Create Class file if not exist
            var classFilePath = path.join(outPath, data.className + '.js');
            if (!fs.existsSync(classFilePath)) {
                fs.writeFileSync(classFilePath, classTpl(data));
            }
        });
    }
};
