var base64 = require('base64');
var _ = require('lodash');

var helper = require('./lib/helper');

function getValue(type, from, disableCache) {
    switch (type) {
        case 'number':
        case 'number:double':
        case 'integer:int32':
        case 'integer:int64':
        case 'string':
        case 'boolean':
        case 'Object':
            return from;

        case 'string:date':
            if (typeof from === 'string') {
                return helper.ymd2Date(from);
            }

            return from;

        case 'string:yearmonth':
            if (typeof from === 'string') {
                return helper.ym2Date(from);
            }

            return from;

        case 'string:time':
        case 'string:date-time':
        case 'string:datetime':
            if (typeof from === 'string') {
                return new Date(from);
            }

            return from;

        default:
            return json2ModelRecursive.call(this, from, type, disableCache);
    }
}

function json2ModelRecursive(object, className,disableCache) {
    if (object === undefined || object === null || typeof object.hasOwnProperty !== 'function') {
        return object;
    }

    var self = this;
    var typeClass = self.get(className);

    // Check if the type is abstract
    if (typeClass._abstract && typeClass._subTypeProperty && !_.isEmpty(object)) {
        // Determine the subtype using the property in "subTypeProperty"
        var subTypeProperty = typeClass._subTypeProperty;
        var subTypes = typeClass._subTypes;

        if (!self.subTypeCache[typeClass]) {
            _.each(subTypes, function (subType) {
                // Not all sub type are loaded
                if (self.isRegistered(subType)) {
                    var subTypeClass = self.get(subType);
                    var propertyValue = subTypeClass[subTypeProperty];

                    self.subTypeCache[className] = self.subTypeCache[className] || {};
                    self.subTypeCache[className][propertyValue] = subTypeClass;
                }
            });
        }

        if (!object.hasOwnProperty(subTypeProperty)) {
            throw new Error('Can not determine subtype for abstract class "{0}" because the property "{1}" was missing'.f(className, subTypeProperty));
        } else if (!self.subTypeCache[className].hasOwnProperty(object[subTypeProperty])) {
            throw new Error('Can not determine subtype for abstract class "{0}" by value "{1}" in property "{2}"'.f(className, object[subTypeProperty], subTypeProperty));
        }

        typeClass = self.subTypeCache[className][object[subTypeProperty]];
        className = typeClass.name;
    }

    // Aware of object id
    var instance;

    if (object.hasOwnProperty(self.objectIDName) && !disableCache) {
        var instanceObjectID = object[self.objectIDName];

        // If object id is JWT based
        if (self.jwtBasedObjectID) {
            // Split JWT
            var objectIDSegments = instanceObjectID.split('.');

            if (objectIDSegments.length === 3) {
                // Parse JWT to get subject Id
                instanceObjectID = JSON.parse(base64.atob(objectIDSegments[1])).sub;
            }
        }

        var instanceObjectIDCacheKey = instanceObjectID + '@' + className;

        if (!(instanceObjectIDCacheKey in self.instanceCache)) {
            self.instanceCache[instanceObjectIDCacheKey] = new (typeClass)();
        }

        instance = self.instanceCache[instanceObjectIDCacheKey];
    } else {
        instance = new (typeClass)();
    }

    for (var key in object) {
        // Angular will add $$hashKey to object we skip them.
        if (key !== '$$hashKey' && object.hasOwnProperty(key)) {
            var type = typeClass._types[key];

            if (!type) {
                throw new Error('Can not find type for property {0}@{1}'.f(key, className));
            }

            if (type.endsWith('[]')) {
                // Process array
                _.each(object[key], function (value) {
                    instance._data[key] = instance._data[key] || [];
                    instance._data[key].push(getValue.call(self, type.replace('[]', ''), value, disableCache));
                });
            } else {
                instance._data[key] = getValue.call(self, type, object[key],disableCache);
            }
        }
    }

    // Check required fields
    var missingProperties = findMissingProperties.call(self, instance, typeClass);
    if (missingProperties !== false) {
        throw new Error('Properties "{0}" missing in {1}@{2}'.f(missingProperties.join(','), className, JSON.stringify(instance)));
    }

    return instance;
}

function model2JsonRecursive(object, options, className) {
    var self = this;
    var result, property, types;

    if (self.isModel(object)) {
        className = className || object.constructor.name;

        if (className !== object.constructor.name) {
            if (object instanceof self.classCache[className]) {
                className = object.constructor.name;
            }
        }

        // Check required fields
        var missingProperties = findMissingProperties.call(self, object, self.classCache[className]);
        if (missingProperties !== false) {
            throw new Error('Properties "{0}" missing in {1}@{2}'.f(missingProperties.join(','), className, JSON.stringify(object)));
        }

        result = _.clone(object._data);
    } else {
        result = object;
    }

    // If the object doesn't have property
    if (!_.isObject(result) && !_.isArray(result)) {
        return result;
    }

    // Load type list
    types = self.get(className)._types;

    // Process all properties
    for (property in result) {
        if (result.hasOwnProperty(property)) {
            // If field is not defined in type
            // Remove the data
            if (!types.hasOwnProperty(property)) {
                delete result[property];
                continue;
            }

            var propertyType = types[property];

            // We don't care Object arrays
            if (propertyType.endsWith('[]')) {
                // Process arrays
                if (result[property] && result[property].length) {
                    if (propertyType !== 'Object[]') {
                        result[property] = _.transform(result[property], function (r, item) {
                            var json = model2JsonRecursive.call(self, item, options, propertyType.replace('[]', ''));

                            if (!_.isEmpty(json)) {
                                r.push(json);
                            }
                        });
                    }
                } else {
                    // Remove empty array
                    delete result[property];
                }
            } else if (self.isModel(result[property])) {
                // Process model
                var json = model2JsonRecursive.call(self, result[property], options, propertyType);

                if (_.isEmpty(json)) {
                    delete result[property];
                } else {
                    result[property] = json;
                }

            } else {
                // Process simple objects
                switch (propertyType) {
                    case 'string:date':
                        if (typeof result[property] !== 'string') {
                            result[property] = helper.date2Ymd(result[property], options.jsonTimezone, options.modelTimezone);
                        }
                        break;

                    case 'string:yearmonth':
                        if (typeof result[property] !== 'string') {
                            result[property] = helper.date2Ym(result[property], options.jsonTimezone, options.modelTimezone);
                        }
                        break;

                    case 'string:time':
                    case 'string:date-time':
                    case 'string:datetime':
                        if (typeof result[property] !== 'string') {
                            result[property] = JSON.stringify(result[property]).replace(/"/g, '');
                        }
                        break;
                }
            }
        }
    }

    return result;
}

function findMissingProperties(instance, classDefinition) {
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

function Runtime(options) {
    this.classCache = {};
    this.subTypeCache = {};
    this.instanceCache = {};
    this.options = options || {};
}

Runtime.prototype.register = function (className, definition) {
    if (!definition) {
        definition = className;
        className = definition.name;
    }

    this.classCache[className] = definition;

    return definition;
};

Runtime.prototype.isRegistered = function (className) {
    return (className in this.classCache);
};

Runtime.prototype.get = function (className) {
    var self = this;

    if (className === undefined) {
        return self.classCache;
    }

    if (!(className in self.classCache)) {
        throw new Error('Can not find class "{0}". Please ensure it has been registered.'.f(className));
    }

    return self.classCache[className];
};

Runtime.prototype.json2Model = function (object, className, options) {
    if (!className) {
        throw new Error('Please specify root class name');
    }

    var self = this;

    options = options || {};
    self.instanceCache = {};
    self.objectIDName = self.objectIDName || options.objectID || 'publicID';
    self.jwtBasedObjectID = self.jwtBasedObjectID || !!options.jwtBasedObjectID;
    var disableCache = options.disableCache;

    return json2ModelRecursive.call(self, object, className,disableCache);
};

Runtime.prototype.model2Json = function (object, options) {
    var self = this;

    options = options || self.options;

    return model2JsonRecursive.call(self, object, options, options.rootClass);
};

Runtime.prototype.clone = function (model) {
    if (!this.isModel(model)) {
        return _.cloneDeep(model);
    }

    var type = model.constructor.name;

    return this.json2Model(_.cloneDeep(this.model2Json(model)), type);
};

Runtime.prototype.isModel = function (object) {
    return (object && object.isSwaggerModel);
};

Runtime.prototype.setOptions = function (options) {
    this.options = options;
    this.objectIDName = options.objectID || 'publicID';
    this.jwtBasedObjectID = !!options.jwtBasedObjectID;
};

module.exports = new Runtime();
