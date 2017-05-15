(function($) {
  $.fn.userPicker = function(options) {
    // Check if object was already created
    var userPicker = $(this[0]).data('userPicker');
    if (!userPicker) {
      userPicker = new UserPickerObj(options, this[0]);
    }
    return userPicker;
  };

  var UserPickerObj = function(options, dom) {
    this.settings = $.extend({}, UserPickerObj.defaults, options);
    this.currentDom = dom;
    this.init();
  };

  $.extend(UserPickerObj, {
    defaults: {
      chooseCallback: function() {},
      filterCallback: function() {
        return true;
      },
      limit: 10,
      fetchDomainUsers: false,
      valueFunction: function(dataItem) {
        return dataItem.id;
      }
    },

    prototype: {
      init: function() {
        var pickerObj = this;
        var $domObj = pickerObj.$dom();
        $domObj.data('userPicker', pickerObj);

        // Turn of default browser autocomplete
        $domObj.attr('autocomplete', 'off');
        $domObj.closest('form').attr('autocomplete', 'off');

        $domObj.awesomecomplete({
          attachTo: pickerObj.settings.attachTo || $domObj.offsetParent(),
          forcePosition: true,
          suggestionListClass: 'autocomplete userPicker',
          typingDelay: 500,
          dataMethod: function(value, $item, callback) {
            loadUsers(pickerObj, value, callback);
          },
          renderFunction: doRender,
          onComplete: function(dataItem) {
            handleComplete(pickerObj, dataItem);
          },
          valueFunction: pickerObj.settings.valueFunction
        });
      },

      $dom: function() {
        if (!this._$dom) {
          this._$dom = $(this.currentDom);
        }
        return this._$dom;
      }
    }
  });

  var fetchUsers = function(params) {
    return $.ajax({
      url: '/cetera/users',
      data: params,
      success: function(results) { return results || []; }
    });
  };

  var loadUsers = function(pickerObj, value, callback) {
    // Trim value, shortcut if blank
    value = $.trim(value);
    if ($.isBlank(value)) {
      callback([]);
      return;
    }

    var m = value.match(/\w{4}-\w{4}$/);
    if (!$.isBlank(m)) {
      User.createFromUserId(m[0], function(u) {
        callback([]);
        if (pickerObj.settings.filterCallback(u)) {
          handleComplete(pickerObj, u);
        }
      },
      function() {
        callback([]);
      });
    } else {
      var params = {
        limit: pickerObj.settings.limit,
        q: value
      };
      if (pickerObj.settings.fetchDomainUsers) {
        var domainUserParams = $.extend({domain: window.location.host}, params);
        var superAdminParams = $.extend({flags: 'admin'}, params);
        var domainUsersRequest = fetchUsers(domainUserParams);
        var superAdminsRequest = fetchUsers(superAdminParams);
        $.when(domainUsersRequest, superAdminsRequest).done(function(domainUsers, superAdmins) {
          callback(_.chain(domainUsers[0].concat(superAdmins[0])).map(function(u) {
            return new User(u);
          }).filter(pickerObj.settings.filterCallback).indexBy('id').values().value());
        });
      } else {
        var usersRequest = fetchUsers(params);
        $.when(usersRequest).done(function(users) {
          callback(_.chain(users).map(function(u) {
            return new User(u);
          }).filter(pickerObj.settings.filterCallback).value());
        });
      }
    }
  };

  var doRender = function(dataItem) {
    return '<p class="title">' + dataItem.displayName + '</p>' +
      '<p class="matchRow"><span class="matchedField">Email:</span> ' +
      dataItem.email + '</p>';
  };

  var handleComplete = function(pickerObj, dataItem) {
    pickerObj.settings.chooseCallback(dataItem);
  };

})(jQuery);
