get: function () { return this._data['{{name}}']; },
set: function (value) { value = +value; this._data['{{name}}'] = isNaN(value) ? undefined : value; }