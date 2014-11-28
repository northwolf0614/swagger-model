var handlebars = require('handlebars');
var fs = require('fs-extra');
var _ = require('lodash');
var path = require('path');

var helper = require('./lib/helper');

var ModelBase = require('./out/ModelBase');

var classTpl = {};
var typeTpls = {};
var classCache = {};

var index = {
    loadClasses: function (folderPath) {
        _.each(fs.readdirSync(folderPath), function (fileName) {
            var filePath = path.join(folderPath, fileName);
            var className = fileName.replace('.js', '');

            // Include files
            classCache[className] = require(filePath);
        });
    },

    getValue: function (type, from) {
        var self = this;

        switch (type) {
            case 'number':
            case 'number:double':
            case 'integer:int32':
            case 'string':
            case 'boolean':
                return from;
            case 'string:date-time':
                return new Date(from);
            default:
                return self.json2Model(from, type);
        }
    },

    model2Json: function (object) {
        var self = this;
        var result, property;

        // Copy values
        if (Object.prototype.toString.call(object) === '[object Array]') {
            _.each(object, function (item) {
                result = result || [];
                result.push(self.model2Json(item))
            });
        } else {
            if (object instanceof ModelBase) {
                result = _.clone(object._data);
            } else {
                if (Object.prototype.toString.call(object) === '[object Date]') {
                    result = JSON.stringify(object).replace(/^"|"$/g, '');

                } else {
                    result = object;
                }
            }

           for (property in result) {
               if (result.hasOwnProperty(property) && (object instanceof ModelBase)) {
                   result[property] = self.model2Json(result[property]);
               }
           }
        }

        return result;
    },

    json2Model: function (object, className) {
        var self = this;
        var instance = new (classCache[className]);
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                var type = instance._types[key];

                if (type.endsWith('[]')) {
                    // Process array
                    _.each(object[key], function (value) {
                        instance[key].push(self.getValue(type.replace('[]', ''), value));
                    });
                } else {
                    instance[key] = self.getValue(type, object[key]);
                }
            }
        }

        return instance;
    },

    generate: function (swagger, templatePath, outPath) {
        // Remove and make out folder
        fs.removeSync(outPath);
        fs.mkdirpSync(outPath);

        // Copy model base
        fs.copySync(path.join(templatePath, 'ModelBase.js'), path.join(outPath, 'ModelBase.js'));

        // Compile template
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

            var types = {};
            _.each(classDef.properties, function (propertyDef, name) {
                var property = {};

                property.name = helper.getPropertyName(name);

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

            var typeStatement = [];
            _.each(types, function (type, name) {
                typeStatement.push("'{0}':'{1}'".f(name, type));
            });
            data.typeList = "{{0}}".f(typeStatement.join(','));

            data.requires = _.map(_.unique(dependencies), function (dependency) {
                return "var {0} = require('./{0}');".f(dependency);
            }).join('\n');

            fs.writeFileSync(path.join(outPath, data.className + '.js'), classTpl(data));
        });
    }
};

module.exports = index;
