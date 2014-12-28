module.exports = {
    date2Ymd: function (date) {
        if (typeof date === 'string') {
            return date;
        }

        var yyyy = date.getFullYear();
        var mm = date.getMonth() + 1;
        var dd = date.getDate();

        return String(10000 * yyyy + 100 * mm + dd);
    },

    ymd2Date: function (ymd) {
        var r = ymd.split('-');

        if (r.length !== 3) {
            return Number.Nan;
        }

        return new Date(r[0], r[1] - 1, r[2]);
    }
};
