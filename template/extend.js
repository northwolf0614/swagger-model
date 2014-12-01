module.exports = function (sub, base) {
    sub.prototype = Object.create(base.prototype);
    sub.prototype.constructor = base;

    // Copy over static properties
    for (var property in base) {
        if (base.hasOwnProperty(property)) {
            sub[property] = base[property];
        }
    }
};