(function() {

  var Model = Class.extend({
    _init: function() {
      var that = this;
      var listeners = {};
      var modelEvents = [];
      var namespaces = {};
      that._events = {};

      var verifyEvent = function(evName) {
        if (!that._events[evName]) {
          throw 'Event ' + evName + ' not registered';
        }
      };

      // Obtains an event namespace on the current model.
      // Given:
      //  nsName: string name of the namespace.
      // Returns an object with the API:
      // {
      //   bind(evName, func, model): Same as bind() on the model.
      //   unbind(evName, func, model): Same as unbind() on the model.
      //   unbindAll(): Unbinds all events in the namespace.
      // }
      this.getEventNamespace = function(nsName) {
        if (_.isUndefined(namespaces[nsName])) {
          var nsEvents = [];
          var ns = {
            bind: function() {
              nsEvents.push(_.toArray(arguments));
              return that.bind.apply(that, arguments);
            },
            unbind: function() {
              return that.unbind.apply(that, arguments);
            },
            unbindAll: function() {
              _.each(nsEvents, function(args) {
                ns.unbind.apply(that, args);
              });
            }
          };

          namespaces[nsName] = ns;
        }

        return namespaces[nsName];
      };

      this.bind = function(evName, func, model) {
        verifyEvent(evName);
        listeners[evName] = listeners[evName] || [];
        if (!_.include(listeners[evName], func) && _.isFunction(func)) {
          listeners[evName].push(func);
          if (!$.isBlank(model)) {
            modelEvents.push({
              name: evName,
              func: func,
              model: model
            });
          }
        }
        return that;
      };

      this.once = function(evName, func) {
        var wrapper = function() {
          this.unbind(evName, wrapper);
          func.apply(this, arguments);
        };
        this.bind(evName, wrapper);
      };

      this.unbind = function(evName, func, model) {
        if (!$.isBlank(evName)) {
          verifyEvent(evName);
        }

        if (!$.isBlank(func)) {
          listeners[evName] = _.without(listeners[evName] || [], func);
        } else if (!$.isBlank(model)) {
          modelEvents = _.reject(modelEvents, function(obj) {
            if (obj.model === model && ($.isBlank(evName) || evName === obj.name)) {
              listeners[obj.name] = _.without(listeners[obj.name] || [], obj.func);
              return true;
            }
            return false;
          });
        } else if (!$.isBlank(evName)) {
          listeners[evName] = [];
        }
        return that;
      };

      this.trigger = function(evName, args) {
        verifyEvent(evName);
        // IE requires that if you pass something for args, it must be
        // an array; not null or undefined

        // In some cases (presumably when legacy visualizations are being
        // displayed in iframes) this code attempts to call _.each and _
        // is undefined. This likely happens in response to a `window.unload`
        // event, in which case we probably don't care, and if _ is undefined
        // we can't do anything except raise a TypeError anyway.
        if (_.hasOwnProperty('each')) {
          _.each(listeners[evName] || [], function(f) {
            f.apply(that, args || []);
          });
          return that;
        }
      };

      this.availableEvents = function() {
        return _.keys(that._events).sort();
      };
    },

    // Events must be registered before they can be used.  Hopefully this
    // will prevent bugs due to typos, or assuming an event is available
    // that is never fired
    registerEvent: function(evName) {
      var mObj = this;
      _.each($.makeArray(evName), function(e) {
        mObj._events[e] = true;
      });
      return mObj;
    },

    // Return a cleaned copy that has no functions, private keys, or anything
    // not valid outside the Model
    cleanCopy: function(allowedKeys) {
      var that = this;
      var cleanObj = function(val, key) {
        if (val instanceof Model) {
          return val.cleanCopy();
        } else if (_.isArray(val)) {
          // Flags are special, because they're not really an array in
          // that order doesn't matter. To keep them consistent, sort them
          if (key == 'flags') {
            return val.slice().sort();
          } else {
            return _.map(val, function(v) {
              return cleanObj(v);
            });
          }
        } else if ($.isPlainObject(val)) {
          var cleanedObject = {};
          _.each(val, function(v, k) {
            cleanedObject[k] = cleanObj(v, k);
          });
          return cleanedObject;
        } else {
          return val;
        }
      };

      if (_.isArray(allowedKeys)) {
        var ak = {};
        _.each(allowedKeys, function(a) {
          ak[a] = true;
        });
        allowedKeys = ak;
      }

      var obj = {};
      _.each(this, function(v, k) {
        if (!_.isFunction(v) && !k.startsWith('_') && that._validKeys[k] &&
          ($.isBlank(allowedKeys) || allowedKeys[k])) {
          obj[k] = cleanObj(v, k);
        }
      });
      return obj;
    },

    // EN-17875 - Make grid view Socrata Viz table respond to OBE/NBE read
    // queries using old query path
    //
    // We need to pass a JSON representation of the view along to the Table
    // renderer by including the equivalent output of the /api/views endpoint in
    // the vif with which we instantiate the Table.
    //
    // Unfortunately, the `.cleanCopy()` method on the Dataset model omits the
    // `renderTypeName` property (since it is not a valid property to send back
    // to Core Server--presumably we assign a renderTypeName when we persist the
    // updated view).
    //
    // Accordingly, and in the spirit of making as few changes to existing code
    // as possible, I am adding an additional method that does not omit the
    // renderTypeName property for the specific use case described above.
    //
    // This is the Base component of the work; there are also similar
    // implementations in the Dataset and Column models located in this project
    // at `platform-ui/frontend/public/javascripts/util/dataset/dataset.js` and
    // `platform-ui/frontend/public/javascripts/util/dataset/column.js`,
    // respectively.
    //
    // BECAUSE YOU ASKED, here is a slightly more verbose explanation for why we
    // need to do this (taken from github.com/socrata/platform-ui/pull/5232):
    //
    //   It's actually the Column object that has the renderTypeName property.
    //   But one gets the serialized columns by getting the serialized view (the
    //   dataset implementation of the function with the same name, which
    //   function on dataset basically maps the list of visible columns with the
    //   version of the cleanCopyIncludingRenderTypeName implemented in the
    //   column model, and both will attempt to call
    //   cleanCopyIncludingRenderTypeName on the base model because they both
    //   call self._super(), and it's the whole big mess of the inheritance
    //   stuff that we abused so badly circa 2011.
    //
    // USE AT YOUR OWN RISK etc. etc.
    cleanCopyIncludingRenderTypeName: function() {
      var that = this;
      var cleanObj = function(val, key) {
        if (val instanceof Model) {
          return val.cleanCopy();
        } else if (_.isArray(val)) {
          // Flags are special, because they're not really an array in
          // that order doesn't matter. To keep them consistent, sort them
          if (key == 'flags') {
            return val.slice().sort();
          } else {
            return _.map(val, function(v) {
              return cleanObj(v);
            });
          }
        } else if ($.isPlainObject(val)) {
          var cleanedObject = {};
          _.each(val, function(v, k) {
            cleanedObject[k] = cleanObj(v, k);
          });
          return cleanedObject;
        } else {
          return val;
        }
      };
      var validKeys = _.cloneDeep(that._validKeys);

      // Do not omit 'renderTypeName'
      validKeys.renderTypeName = true;

      var obj = {};
      _.each(this, function(v, k) {
        if (!_.isFunction(v) && !k.startsWith('_') && validKeys[k]) {
          obj[k] = cleanObj(v, k);
        }
      });
      return obj;
    },

    // Return a fully-instantiated copy
    clone: function(modelParents) {
      var that = this;

      var cloneObj = function(val, key, objParents) {
        objParents = (objParents || []).concat([val]);

        if (val instanceof Model) {
          return val.clone(modelParents);
        } else if (_.isArray(val)) {
          // Flags are special, because they're not really an array in
          // that order doesn't matter. To keep them consistent, sort them
          if (key == 'flags') {
            return val.slice().sort();
          } else {
            return _.map(val, function(v) {
              return cloneObj(v, undefined, objParents);
            });
          }
        } else if ($.isPlainObject(val)) {
          var clonedObject = {};
          _.each(val, function(v, k) {
            if (!_.include(objParents, v)) {
              clonedObject[k] = cloneObj(v, k, objParents);
            }
          });
          return clonedObject;
        } else {
          return val;
        }
      };

      modelParents = $.makeArray(modelParents);
      modelParents.push(that);

      var obj = {};
      _.each(this, function(v, k) {
        if (!_.isFunction(v) && !that._cloneExclude[k] && !_.include(modelParents, v)) {
          obj[k] = cloneObj(v, k);
        }
      });
      return new that.Class(obj);
    },

    _generateBaseUrl: function(aDomain, isShort) {
      var loc = document.location;
      var domain = $.isBlank(domain) ? loc.hostname : aDomain;
      if (isShort) {
        domain = domain.replace(/www\./, '');
      }
      var base = (isShort ? '' : (loc.protocol + '//')) + domain;

      if (loc.port && loc.port != 80) {
        base += ':' + loc.port;
      }

      return base;
    },

    _validKeys: {},
    _cloneExclude: {
      _super: true
    }
  });

  if (blist.inBrowser) {
    this.Model = Model;
  } else {
    module.exports = Model;
  }

})();
