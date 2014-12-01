/*
 DO NOT MODIFY this file as it will be overridden
 ADD PROPERTIES in inherited class only
*/
var ModelBase = require('./ModelBase');
{{requires}}

function {{className}}Base() {
    self = this;
    if (self._enums) {
        Object.keys(self._enums).forEach(function(enumName) {
            self._enums[enumName].forEach(function(enumValue) {
                self[enumName] = self[enumName] || {};
                self[enumName][enumValue] = enumValue;
            });
        });
    }
}
var self;

{{className}}Base.prototype = Object.create(ModelBase.prototype);
{{className}}Base.prototype.constructor = {{className}}Base;
{{className}}Base.prototype._types = {{typeList}};
{{className}}Base.prototype._enums = {{enumList}};
{{className}}Base.prototype._data = {};

{{#properties}}
Object.defineProperty({{../className}}Base.prototype, '{{name}}', {
configurable:true, enumerable:true,
{{definition}}
});
{{/properties}}

module.exports = {{className}}Base;