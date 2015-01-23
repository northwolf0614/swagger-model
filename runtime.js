var _ = require('lodash');

var helper = require('./lib/helper');

var classCache = {};

module.exports = {
    register: function (className, definition) {
        if (!definition) {
            definition = className;
            className = definition.name;
        }

        classCache[className] = definition;

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
            var instanceObjectID = object.publicID + '@' + className;

            if (!(instanceObjectID in self.instanceCache)) {
                self.instanceCache[instanceObjectID] = new (typeClass)();
            }

            instance = self.instanceCache[instanceObjectID];
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

        if (self.isModel(object)) {
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
                    if (result[property] && result[property].length) {
                        result[property] = _.transform(result[property], function (r, item) {
                            var json = self.model2Json(item);

                            if (!_.isEmpty(json)) {
                                r.push(json);
                            }
                        });
                    } else {
                        delete result[property];
                    }
                } else if (self.isModel(result[property])) {
                    // Process model
                    var json = self.model2Json(result[property]);

                    if (_.isEmpty(json)) {
                        delete result[property];
                    } else {
                        result[property] = json;
                    }

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
    },

    clone: function (model) {
        var type = model.constructor.name;

        return this.json2Model(_.cloneDeep(this.model2Json(model)), type);
    },

    isModel: function (object) {
        return (object && object.isSwaggerModel);
    }
};
