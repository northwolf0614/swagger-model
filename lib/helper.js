var s = require('./string');

module.exports = {
    getClassName: function (t) {
        var segs = s.camelCase(t).split('.');
        return segs[segs.length - 1].replace('DTO', '');
    },

    getPropertyName: function (t) {
        return s.camelCaseLower(t);
    },

    getEnumName: function (t) {
        return s.camelToDash(t).replace(/-/g, '_').toUpperCase();
    }
};
