var {{className}}Base = require('./base/{{className}}Base');

function {{className}}() {
    {{className}}Base.call(this);
}
{{className}}.prototype = Object.create({{className}}Base.prototype);
{{className}}.prototype.constructor = {{className}};

module.exports = {{className}};