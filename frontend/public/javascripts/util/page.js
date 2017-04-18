(function() {


  this.Page = ServerModel.extend({
    _init: function(v) {
      this._super();

      $.extend(this, v);
    },

    update: function(newItems) {
      if ($.subKeyDefined(newItems, 'path') && newItems.path != this.path) {
        this._pathDirty = true;
        this._oldPath = this.path;
      }
      $.extend(this, newItems);
    },

    save: function(successCallback, errorCallback) {
      var page = this;
      var type = 'PUT';

      var finalSuccess = function(resp) {
        var flags = {};
        if (page._pathDirty) {
          flags.oldPath = page._oldPath;
        }
        page.update(resp);
        page._pathDirty = false;
        delete page._oldPath;
        if (_.isFunction(successCallback)) {
          successCallback(page, flags);
        }
      };

      var realSave = function() {
        page.makeRequest({
          type: type,
          success: function(resp) {
            finalSuccess(resp);
          },
          error: errorCallback
        });
      };

      if (page._pathDirty) {
        // Check if overwrite
        Page.checkUnique(page.path, realSave, function() {
          if (_.isFunction(errorCallback)) {
            errorCallback({
              duplicatePath: true
            });
          }
        });
      } else {
        realSave();
      }
    },

    saveCopy: function(newProps, successCallback, errorCallback) {
      var newPage = $.extend(this.cleanCopy(), newProps);
      _.each(['uid', 'version', 'createdAt', 'updatedAt'], function(p) {
        delete newPage[p];
      });

      this.makeRequest({
        type: 'POST',
        data: JSON.stringify(newPage),
        success: function(resp) {
          if (_.isFunction(successCallback)) {
            successCallback(new Page(resp));
          }
        },
        error: errorCallback
      });
    },

    makeRequest: function(req) {
      if ($.isBlank(req.url)) {
        if (req.type == 'POST') {
          req.url = '/api/pages.json';
        } else if (req.type == 'PUT') {
          req.url = '/api/pages/' + this.uid + '.json';
        }
        req.data = req.data || JSON.stringify(this.cleanCopy());
      }
      this._super(req);
    },

    _validKeys: {
      uid: true,
      path: true,
      name: true,
      format: true,
      privateData: true,
      status: true,
      category: true,
      grouping: true,
      version: true,
      permission: true,
      content: true,
      data: true,
      metadata: true,
      cacheInfo: true
    }
  });

  Page.createFromId = function(newId, successCallback, errorCallback) {
    $.Tache.Get({ //eslint-disable-line new-cap
      url: '/api/pages/' + newId + '.json',
      success: function(page) {
        if (_.isArray(page)) {
          page = _.first(page);
        }
        if (_.isFunction(successCallback)) {
          successCallback(new Page(page));
        }
      },
      error: errorCallback
    });
  };

  Page.deleteById = function(newId, successCallback, errorCallback) {
    if (!$.isBlank(newId)) {
      $.socrataServer.makeRequest({
        type: 'DELETE',
        url: '/api/pages/' + newId + '.json',
        error: errorCallback,
        success: successCallback
      });
    } else {
      successCallback();
    }
  };

  Page.checkUnique = function(path, successCallback, errorCallback) {
    $.socrataServer.makeRequest({
      type: 'GET',
      cache: false,
      url: '/api/pages.json?method=isPathAvailable',
      params: {
        path: path
      },
      success: function(resp) {
        if (resp) {
          successCallback();
        } else {
          errorCallback();
        }
      }
    });
  };

  Page.uniquePath = function(title, prefix, successCallback) {
    if ($.isBlank(title)) {
      title = 'unnamed';
    }
    if ($.isBlank(prefix)) {
      prefix = '/';
    }
    if (!prefix.startsWith('/')) {
      prefix = '/' + prefix;
    }

    var p = prefix + $.urlSafe(title);
    var check = p;
    var i = 1;
    var doCheck = function() {
      Page.checkUnique(check, function() {
          successCallback(check);
        },
        function() {
          check = p + '-' + i;
          i++;
          doCheck();
        });
    };
    doCheck();
  };

})();
