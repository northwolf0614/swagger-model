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
        var basePath = outPath;
        var templatePath = path.resolve(__dirname, 'template');

        outPath = path.join(outPath, 'base');

        // Remove and make out folder
        fs.removeSync(outPath);
        fs.mkdirpSync(outPath);

        // Copy model base
        fs.copySync(path.join(templatePath, 'ModelBase.js'), path.join(outPath, 'ModelBase.js'));

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
            var typeStatement = [];
            _.each(types, function (type, name) {
                typeStatement.push("'{0}':'{1}'".f(name, type));
            });
            data.typeList = "{{0}}".f(typeStatement.join(','));

            // Build dependency
            data.requires = _.map(_.unique(dependencies), function (dependency) {
                return "var {0} = require('../{0}');".f(dependency);
            }).join('\n');

            // Build enums
            var enumList = [];
            _.each(enums, function (enumEntries, name) {
                var list = _.map(enumEntries, function (enumEntry) {
                    return "'{0}'".f(enumEntry);
                }).join(',');

                enumList.push("'{0}':[{1}]".f(helper.getEnumName(name), list));
            });
            data.enumList = '{{0}}'.f(enumList.join(','));


            fs.writeFileSync(path.join(outPath, data.className + 'Base.js'), classBaseTpl(data));

            // Create Class file if not exist
            var classFilePath = path.join(basePath, data.className + '.js');
            if (!fs.existsSync(classFilePath)) {
                fs.writeFileSync(classFilePath, classTpl(data));
            }
        });
    }
};
