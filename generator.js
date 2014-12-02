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
            var type = fileName.replace('.js.tpl', '');

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

                if (propertyDef.enum) {
                    // Save enum if it has
                    enums[name] = propertyDef.enum;
                }

                if (!propertyDef.type) {
                    // Reference type
                    propertyDef.type = 'object';
                    property.type = helper.getClassName(propertyDef.$ref);
                    dependencies.push(property.type);
                    types[name] = property.type;
                } else {
                    if (propertyDef.type === 'array') {
                        // Array type
                        var itemsDef = propertyDef.items;
                        if (itemsDef.$ref) {
                            types[name] = helper.getClassName(itemsDef.$ref);
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
                property.definition = typeTpls[propertyDef.type](property);

                data.properties.push(property);
            });

            // Build type list
            var typeStatements = [];
            _.each(types, function (type, name) {
                typeStatements.push("'{0}':'{1}'".f(name, type));
            });
            data.typeList = "{{0}}".f(typeStatements.join(','));

            // Build dependency
            data.requires = _.map(_.unique(dependencies), function (dependency) {
                return "var {0} = require('../{0}');".f(dependency);
            }).join('\n');

            // Build enums
            data.enums = [];
            _.each(enums, function (enumList, name) {
                enumList = '{{0}}'.f(_.map(enumList, function (enumEntry) {
                    return "'{0}':'{0}'".f(enumEntry);
                }).join(','));

                data.enums.push({ name: helper.getEnumName(name), enumList: enumList });
            });

            // Build required list
            if (classDef.required) {
                data.requiredList = "[{0}]".f(_.map(classDef.required, function (requiredPropertyName) {
                    return "'{0}'".f(requiredPropertyName);
                }).join(','));
            } else {
                data.requiredList = '[]';
            }


            fs.writeFileSync(path.join(basePath, data.className + 'Base.js'), classBaseTpl(data));

            // Create Class file if not exist
            var classFilePath = path.join(outPath, data.className + '.js');
            if (!fs.existsSync(classFilePath)) {
                fs.writeFileSync(classFilePath, classTpl(data));
            }
        });
    }
};
