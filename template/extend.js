var _ = require('lodash');

module.exports = function (sub, base) {
    sub.prototype = Object.create(base.prototype);
    sub.prototype.constructor = sub;

    // Copy over static properties
    for (var property in base) {
        if (base.hasOwnProperty(property)) {
            if (_.isArray(base[property])) {
                sub[property] = (sub[property] || []).concat(base[property]);
            } else if (_.isObject(base[property])) {
                sub[property] = _.merge(sub[property] || {}, base[property]);
            } else {
                sub[property] = base[property];
            }
        }
    }
};