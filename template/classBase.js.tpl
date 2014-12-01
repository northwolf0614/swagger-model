/*
 DO NOT MODIFY this file as it will be overridden
 ADD PROPERTIES in inherited class only
*/
var extend = require('../helper/extend');
var ModelBase = require('./ModelBase');
{{requires}}

function {{className}}Base() { this._data = {}; }
extend({{className}}Base, ModelBase);

{{className}}Base.prototype._types = {{typeList}};
{{#enums}}
{{../className}}Base.{{name}} = {{enumList}};
{{/enums}}

{{#properties}}
Object.defineProperty({{../className}}Base.prototype, '{{name}}', {
configurable:true, enumerable:true,
{{definition}}
});
{{/properties}}

module.exports = {{className}}Base;