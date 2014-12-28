get: function () { return helper.ymd2Date(this._data['{{name}}']); },
set: function (value) {  this._data['{{name}}'] = helper.date2Ymd(value); }