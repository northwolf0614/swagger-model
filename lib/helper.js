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
    },

    date2Ymd: function (date) {
        if (!date) return date;

        if (typeof date === 'string') {
            return date;
        }

        var yyyy = date.getFullYear().toString();
        var mm = (date.getMonth() + 1).toString();
        var dd = date.getDate().toString();

        return yyyy + '-' + (mm[1] ? mm : '0' + mm[0]) + '-' + (dd[1] ? dd : '0' + dd[0]);
    },

    ymd2Date: function (ymd) {
        if (!ymd || typeof ymd !== 'string') return ymd;

        var r = ymd.split('-');

        if (r.length !== 3) {
            return ymd;
        }

        return new Date(r[0], r[1] - 1, r[2]);
    }
};
