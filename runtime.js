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
    }
};
