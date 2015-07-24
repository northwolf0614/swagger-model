/*
DO NOT MODIFY this file as it will be overridden
ADD PROPERTIES in inherited class only
*/
var extend = require('../helper/extend');
{{#hasSuperClass}}var {{superClassName}} = require('../{{superClassName}}');{{/hasSuperClass}}
{{^hasSuperClass}}var ModelBase = require('./ModelBase');{{/hasSuperClass}}
{{requires}}
function {{className}}Base() {
{{superClassName}}.call(this);
{{staticsList}}
}
{{className}}Base._types = {{typeList}};
{{className}}Base._required = {{requiredList}};
{{className}}Base._readonly = {{readonlyList}};
extend({{className}}Base, {{superClassName}});
{{className}}Base._superType = "{{superClassName}}";
{{#isAbstract}}
{{className}}Base._abstract = true;
{{#subTypeProperty}}{{../className}}Base._subTypeProperty = {{../subTypeProperty}};{{/subTypeProperty}}
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
