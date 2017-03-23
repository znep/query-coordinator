(function() {
  window.polyfills = {};

  function Map(values) {
    var self = this;
    this._values = [];
    if (_.isArray(values)) {
      this._values = _.map(values, function(item) {
        return { key: item[0], value: item[1] };
      });
    }
    Object.defineProperty(this, 'size', {
      get: function() { return self._values.length; }
    });
  }

  Map.prototype.has = function(key) {
    return _.some(this._values, function(item) {
      if (_.isNaN(key)) {
        return _.isNaN(item.key);
      } else {
        return item.key === key;
      }
    });
  };

  Map.prototype.set = function(key, value) {
    this._values = _.reject(this._values, function(item) {
      if (_.isNaN(key)) {
        return _.isNaN(item.key);
      } else {
        return item.key === key;
      }
    });
    this._values.push({ key: key, value: value });
  };

  Map.prototype.get = function(key) {
    var foundItem = _.find(this._values, function(item) {
      if (_.isNaN(key)) {
        return _.isNaN(item.key);
      } else {
        return item.key === key;
      }
    });
    if (foundItem) {
      return foundItem.value;
    }
  };

  Map.prototype['delete'] = function(key) {
    var returnValue = this.has(key);
    this._values = _.reject(this._values, function(item) {
      if (_.isNaN(key)) {
        return _.isNaN(item.key);
      } else {
        return item.key === key;
      }
    });
    return returnValue;
  };

  Map.prototype.clear = function() {
    this._values = [];
  };

  Map.prototype.forEach = function(fn) {
    var self = this;
    _.each(this._values, function(item) {
      fn(item.value, item.key, self);
    })
  };

  window.polyfills['Map'] = Map;
  if (typeof window.Map == 'undefined') {
    window.Map = Map;
  }

})();
