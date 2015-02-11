get: function() { this._data['{{name}}'] = this._data['{{name}}'] || []; return this._data['{{name}}']; },
set: function (value) { if (value === undefined) this._data['{{name}}'].length = 0; }