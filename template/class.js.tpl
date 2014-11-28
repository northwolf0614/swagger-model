var ModelBase = require('./ModelBase');
{{requires}}

function {{className}}() { self = this }
var self;

{{className}}.prototype = Object.create(ModelBase.prototype);
{{className}}.prototype._types = {{typeList}};
{{className}}.prototype._data = {};

{{#properties}}
Object.defineProperty({{../className}}.prototype, '{{name}}', {
configurable:true, enumerable:true,
{{definition}}
});
{{/properties}}

module.exports = {{className}};