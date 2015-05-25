var moment = require('moment-timezone');
require('./function');

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

    date2Ymd: function (date, jsonTimezone, modelTimezone) {
        if (!date) return date;

        if (typeof date === 'string') {
            if (modelTimezone) {
                date = moment.tz(date, modelTimezone);
            } else {
                date = moment(date).clone();
            }
        } else {
            date = moment(date).clone();
        }

        return (jsonTimezone ? date.tz(jsonTimezone) : date).format('YYYY-MM-DD');
    },

    ymd2Date: function (ymd) {
        if (!ymd) return ymd;

        return moment(ymd, 'YYYY-MM-DD').toDate();
    }
};
