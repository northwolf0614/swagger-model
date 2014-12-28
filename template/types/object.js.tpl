get: function () { return ('{{name}}' in this._data) ? this._data['{{name}}'] : this._data['{{name}}'] = new {{type}}() ; },
set: function (value) { this._data['{{name}}'] = value; }