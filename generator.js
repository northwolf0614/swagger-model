var handlebars = require('handlebars');
var helper = require('./lib/helper');
var path = require('path');
var fs = require('fs-extra');
var _ = require('lodash');


var classBaseTpl = {};
var classTpl = {};
var typeTpls = {};

module.exports = {
    generate: function (swagger, option) {
        var outPath, filters;

        if (_.isString(option)) {
            outPath = option;
            filters = [];
        } else {
            outPath = option.outPath;
            filters = option.filters;
        }

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


        var availableClasses = Object.keys(swagger.definitions);
        var hasIncludeFilter = filters.length && _.any(filters, function (filter) {
                return (filter[0] !== '!');
            });

        if (filters.length) {
            // Exclude all other class if we have include filter defined
            if (hasIncludeFilter) {
                availableClasses = _.filter(availableClasses, function (availableClass) {
                    return _.any(filters, function (filter) {
                        return (filter[0] !== '!') ? new RegExp(filter).test(availableClass) : false;
                    });
                });
            }

            availableClasses = _.filter(availableClasses, function (availableClass) {
                return !_.any(filters, function (filter) {
                    return (filter[0] === '!') ? new RegExp(filter.substr(1)).test(availableClass) : false;
                });
            });
        }

        _.each(swagger.definitions, function (classDef, fullClassName) {
            if (availableClasses.indexOf(fullClassName) === -1) {
                // Skip if not in available list
                return;
            }

            var data = {}, dependencies = [], statics = {};

            data.className = helper.getClassName(fullClassName);
            data.isAbstract = classDef.abstract;
            data.subTypeProperty = JSON.stringify(classDef.subTypeProperty);
            data.subTypes = JSON.stringify(_.map(classDef.subTypes, helper.getClassName));
            data.properties = [];
            data.statics = [];

            var types = {}, enums = {};
            _.each(classDef.properties, function (propertyDef, name) {
                var property = {};

                property.name = helper.getPropertyName(name);
                property.readonly = !!(propertyDef.readOnly || propertyDef.readonly);

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
                if (propertyDef.value) {
                    var defaultValue;

                    // If value is present means this is a static field
                    switch (propertyDef.type) {
                        case 'string':
                            defaultValue = propertyDef.value;
                            break;

                        case 'number':
                            defaultValue = +propertyDef.value;
                            break;

                        case 'boolean':
                            defaultValue = propertyDef.value === 'true';
                            break;

                        default:
                            throw new Error('Unsupported default value type "{0}" in {1}@{2}'.f(propertyDef.type, name, fullClassName));
                    }

                    property.readonly = true;
                    property.definition = typeTpls['string'](property);
                    statics[name] = defaultValue;

                } else if (propertyDef.format && propertyDef.format in typeTpls) {
                    property.definition = typeTpls[propertyDef.format](property);

                } else if (propertyDef.type && propertyDef.type in typeTpls) {
                    property.definition = typeTpls[propertyDef.type](property);

                } else if (property.type) {
                    // Reference type must have a class type
                    property.definition = typeTpls['reference'](property);

                } else {
                    throw new Error('Unsupported type "{0}" in {1}@{2}'.f(propertyDef.type, name, fullClassName));
                }

                data.properties.push(property);
            });


            // Build statics
            data.staticsList = JSON.stringify(statics) || '{}';
            _.each(statics, function (staticValue, staticName) {
                 data.statics.push({
                     name: staticName,
                     value: JSON.stringify(staticValue)
                 });
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
                var enumDict = {}, enumLabelDict = {}, enumPriorityDict = [], hasLabel = false;

                // enum can be either a string
                // or object { code: 'string', name: 'string', priority: integer }
                _.each(enumList, function (enumListItem) {
                    if (_.isString(enumListItem)) {
                        enumDict[enumListItem] = enumListItem;
                    } else {
                        hasLabel = true;

                        var code = enumListItem.code || enumListItem.value;
                        enumLabelDict[code] = enumListItem.name || enumListItem.label;
                        enumPriorityDict[code] = enumListItem.priority;
                        enumDict[code] = code;
                    }
                });

                if (hasLabel) {
                    enumPriorityDict = _.map(_.sortBy(enumList, 'priority'), function (enumListItem) {
                        return enumListItem.code || enumListItem.value;
                    });
                }

                data.enums.push({
                    name: helper.getEnumName(name),
                    enumList: JSON.stringify(enumDict) || '{}',
                    enumLabelList: JSON.stringify(enumLabelDict) || '{}',
                    enumPriorityList: JSON.stringify(enumPriorityDict) || '{}',
                    hasPriority: enumPriorityDict.length > 0,
                    hasLabel: hasLabel
                });
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
