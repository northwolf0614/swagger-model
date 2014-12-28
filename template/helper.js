module.exports = {
    date2Ymd: function (date) {
        if (!date) return '';

        if (typeof date === 'string') {
            return date;
        }

        var yyyy = date.getFullYear().toString();
        var mm = (date.getMonth() + 1).toString();
        var dd = date.getDate().toString();

        return yyyy + '-' + (mm[1] ? mm : '0' + mm[0]) + '-' + (dd[1] ? dd : '0' + dd[0]);
    },

    ymd2Date: function (ymd) {
        if (!ymd) return undefined;

        var r = ymd.split('-');

        if (r.length !== 3) {
            return undefined;
        }

        return new Date(r[0], r[1] - 1, r[2]);
    }
};
