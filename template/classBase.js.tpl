/*
 DO NOT MODIFY this file as it will be overridden
 ADD PROPERTIES in inherited class only
*/
var ModelBase = require('./ModelBase');
{{requires}}

function {{className}}Base() { self = this; }
var self;

{{className}}Base.prototype = Object.create(ModelBase.prototype);
{{className}}Base.prototype.constructor = {{className}}Base;
{{className}}Base.prototype._types = {{typeList}};
{{#enums}}
{{../className}}Base.{{name}} = {{enumList}};
{{/enums}}
{{className}}Base.prototype._data = {};

{{#properties}}
Object.defineProperty({{../className}}Base.prototype, '{{name}}', {
configurable:true, enumerable:true,
{{definition}}
});
{{/properties}}

module.exports = {{className}}Base;