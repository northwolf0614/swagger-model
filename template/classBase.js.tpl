/*
DO NOT MODIFY this file as it will be overridden
ADD PROPERTIES in inherited class only
*/
var extend = require('../helper/extend');
var ModelBase = require('./ModelBase');
{{requires}}

function {{className}}Base() {
this._data = {{staticsList}};
}
extend({{className}}Base, ModelBase);

{{className}}Base._types = {{typeList}};
{{className}}Base._required = {{requiredList}};
{{className}}Base._readonly = {{requiredList}};
{{#isAbstract}}
{{className}}Base._abstract = true;
{{className}}Base._subTypeProperty = {{subTypeProperty}};
{{className}}Base._subTypes = {{subTypes}};
{{/isAbstract}}
{{#statics}}
{{../className}}Base.{{name}} = {{value}};
{{/statics}}
{{#enums}}
{{../className}}Base.{{name}} = {{enumList}};
{{#hasLabel}}
{{../../className}}Base.{{name}}_LABELS = {{enumLabelList}};
{{/hasLabel}}
{{#hasPriority}}
{{../../className}}Base.{{name}}_PRIORITY = {{enumPriorityList}};
{{/hasPriority}}
{{/enums}}

{{#properties}}
Object.defineProperty({{../className}}Base.prototype, '{{name}}', {
configurable:true, enumerable:true,
{{definition}}
});
{{/properties}}

module.exports = {{className}}Base;
