var moment = require('moment-timezone');
require('./function');

var s = require('./string');

var genericRegExp = /^([^<]+)<(.*)>$/;

function date2String(date, format, jsonTimezone, modelTimezone) {
    if (typeof date === 'string') {
        if (modelTimezone) {
            date = moment.tz(date, modelTimezone);
        } else {
            date = moment(date).clone();
        }
    } else {
        date = moment(date).clone();
    }

    return (jsonTimezone ? date.tz(jsonTimezone) : date).format(format);
}

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

        return date2String(date, 'YYYY-MM-DD', jsonTimezone, modelTimezone)
    },

    date2Ym: function (date, jsonTimezone, modelTimezone) {
        if (!date) return date;

        return date2String(date, 'YYYY-MM', jsonTimezone, modelTimezone)
    },
    date2Ymdhm: function (date, jsonTimezone, modelTimezone) {
        if (!date) return date;

        return date2String(date, 'YYYY-MM-DD-HH-mm', jsonTimezone, modelTimezone)
    },

    ymd2Date: function (ymd) {
        if (!ymd) return ymd;

        return moment(ymd, 'YYYY-MM-DD').toDate();
    },
    ymdhms2Date: function (ymd) {
        if (!ymd) return ymd;

        return moment(ymd,"YYYY-MM-DD-HH-mm-ss" ).toDate();

    },


    ym2Date: function (ymd) {
        if (!ymd) return ymd;

        return moment(ymd, 'YYYY-MM').toDate();
    }
};
