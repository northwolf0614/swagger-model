var _ = require('lodash');

var classCache = {};
var ModelBase;

module.exports = {
    register: function (className, definition) {
        if (!definition) {
            definition = className;
            className = definition.name;
        }

        classCache[className] = definition;

        if (className === 'ModelBase') {
            ModelBase = definition;
        }

        return definition;
    },

    get: function (className) {
        if (className === undefined) {
            return classCache;
        }

        return classCache[className];
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

        // Check required fields
        if (object instanceof ModelBase) {
            var missingProperties = self.findMissingProperties(object, classCache[object.constructor.name]);
            if (missingProperties !== false) {
                throw new Error('Properties "{0}" missing in {1}@{2}'.f(missingProperties.join(','), object.constructor.name, JSON.stringify(object)));
            }
        }

        // Copy values
        if (Object.prototype.toString.call(object) === '[object Array]') {
            _.each(object, function (item) {
                result = result || [];
                result.push(self.model2Json(item))
            });
        } else {
            if (object instanceof ModelBase) {
                // Copy objects & model objects
                result = _.clone(object._data);
            } else {
                if (Object.prototype.toString.call(object) === '[object Date]') {
                    result = JSON.stringify(object).replace(/^"|"$/g, '');

                } else {
                    result = object;
                }
            }

            // Copy all model properties
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
        var typeClass = classCache[className];
        if (!typeClass) {
            throw new Error('Can not find class "{0}". Please ensure it has been registered.'.f(className));
        }

        var instance = new (typeClass)();
        for (var key in object) {
            // Angular will add $$hashKey to object we skip them.
            if (key !== '$$hashKey' && object.hasOwnProperty(key)) {
                var type = typeClass._types[key];

                if (!type) {
                    throw new Error('Can not find type for property "{0}" from class "{1}"'.f(key, className));
                }

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

        // Check required fields
        var missingProperties = self.findMissingProperties(instance, typeClass);
        if (missingProperties !== false) {
            throw new Error('Properties "{0}" missing in {1}@{2}'.f(missingProperties.join(','), className, JSON.stringify(instance)));
        }

        return instance;
    },

    findMissingProperties: function (instance, classDefinition) {
        var missingProperties = [];

        if (classDefinition._required) {
            _.each(classDefinition._required, function (requiredProperty) {
                if (!(requiredProperty in instance)) {
                    missingProperties.push(requiredProperty);
                }
            });
        }

        return missingProperties.length > 0 ? missingProperties : false;
    }
};
