var s = require('./string');

var genericRegExp = /^([^<]+)<(.*)>$/;

module.exports = {
    getClassName: function (t) {
        if (t.indexOf('<') !== -1) {
            return this.getGenericClassName(t);
        }

        var segs = s.camelCase(t).split('.');
        return segs[segs.length - 1].replace('DTO', '');
    },

    getPropertyName: function (t) {
        return s.camelCaseLower(t);
    },

    getEnumName: function (t) {
        return s.camelToDash(t).replace(/-/g, '_').toUpperCase();
    },

    getGenericClassName: function (t) {
        var m = genericRegExp.exec(t);
        var className = this.getClassName(m[1]);
        var type = m[2];

        return className + this.getClassName(type);
    }
};
