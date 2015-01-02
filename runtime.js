var _ = require('lodash');

var helper = require('./lib/helper');
var s = require('./lib/string');

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

        if (!(className in classCache)) {
            throw new Error('Can not find class "{0}". Please ensure it has been registered.'.f(className));
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
                
            case 'string:date':
            case 'string:time':
            case 'string:date-time':
                if (typeof from === 'string') {
                    return helper.ymd2Date(from);
                }

                return from;
            default:
                return self.json2ModelRecursive(from, type);
        }
    },

    json2ModelRecursive: function (object, className) {
        var self = this;
        var typeClass = self.get(className);

        // Aware of publicID
        var instance;

        if (object.hasOwnProperty('publicID')) {
            if (!(object.publicID in self.instanceCache)) {
                self.instanceCache[object.publicID] = new (typeClass)();
            }

            instance = self.instanceCache[object.publicID];
        } else {
            instance = new (typeClass)();
        }

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

    json2Model: function (object, className) {
        var self = this;

        self.instanceCache = {};
        return self.json2ModelRecursive(object, className);
    },

    model2Json: function (object) {
        var self = this;
        var result, property, types;

        if (object instanceof ModelBase) {
            // Check required fields
            var missingProperties = self.findMissingProperties(object, classCache[object.constructor.name]);
            if (missingProperties !== false) {
                throw new Error('Properties "{0}" missing in {1}@{2}'.f(missingProperties.join(','), object.constructor.name, JSON.stringify(object)));
            }


            // Read type list
            types = self.get(object.constructor.name)._types;
            result = _.clone(object._data);
        } else {
            result = object;
        }

        // Process all properties
        for (property in result) {
            if (result.hasOwnProperty(property)) {
                if (types && types[property].endsWith('[]')) {
                    // Process arrays
                    result[property] = _.transform(result[property], function (r, item) {
                        r.push(self.model2Json(item))
                    });
                } else if (result[property] instanceof ModelBase) {
                    // Process model
                    result[property] = self.model2Json(result[property]);
                } else if (types) {
                    // Process simple objects
                    switch (types[property]) {
                        case 'string:date':
                        case 'string:time':
                        case 'string:date-time':
                            if (typeof result[property] !== 'string') {
                                result[property] = helper.date2Ymd(result[property]);
                            }
                    }
                }
            }
        }

        return result;
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
