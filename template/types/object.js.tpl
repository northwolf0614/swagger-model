get: function () { return (this._data['{{name}}'] === undefined) ? this._data['{{name}}'] = new {{type}}() : this._data['{{name}}']; },
set: function (value) { this._data['{{name}}'] = value; }
