get: function () { return this._data['{{name}}']; },
set: function (value) { value = parseInt(value, 10); this._data['{{name}}'] = isNaN(value) ? undefined : value; }