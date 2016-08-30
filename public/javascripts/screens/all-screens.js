$(function() {
  var csrfCookieName = 'socrata-csrf-token';

  blist.util.enforceLodashFunctions();

  // generic events
  $.live('a[rel$=external]', 'focus', function() {
    this.target = '_blank';
  });
  $.live('a[rel$=external]', 'mouseover', function() {
    this.target = '_blank';
  });

  // blist.iframeHack is for CORE-1660, in order to allow opening catalog links in the same window.
  // This makes it possible to make the default behavior same-window and have modifier keys
  // properly open a new window/tab.
  blist.iframeHack = {
    modifierKeys: [16, 17, 18, 91, 93],
    pressed: {}
  };

  $('body').on('keydown', function(evt) {
    if (_.include(blist.iframeHack.modifierKeys, evt.which)) {
      blist.iframeHack.pressed[evt.which] = true;
    }
  });
  $('body').on('keyup', function(evt) {
    if (_.include(blist.iframeHack.modifierKeys, evt.which)) {
      blist.iframeHack.pressed[evt.which] = false;
    }
  });
  blist.iframeHack.isModified = function() {
    return _.any(_.values(blist.iframeHack.pressed));
  };

  $.live('a[rel$=video]', 'click', function(event) {
    event.preventDefault();

    window.open($(this).attr('href'), '', 'width=650,height=550,location=no,menubar=no,scrollbars=no,status=no,toolbar=no');
  });

  // custom validation
  $.validator.addMethod('customUrl', function(value, element) {
    if (this.optional(element)) {
      return true;
    }

    var regEx = blist.util.patterns.customUrl;

    if (!/^(https?|ftp):\/\//i.test(value)) {
      if (regEx.test('http://' + value)) {
        $(element).val('http://' + value);
        return true;
      }
    } else {
      return regEx.test(value);
    }
    return false;
  });

  $.validator.addMethod('secureUrl', function(value, element) {
    if (this.optional(element)) {
      return true;
    }

    return /^https/.test(value);
  });

  $.validator.addMethod('customHttpMaybeSUrl', function(value, element) {
    var regex = blist.util.patterns.customHttpMaybeSUrl;
    return this.optional(element) || regex.test(value);
  });

  $.validator.addMethod('coordinateReferenceSystem', function(value, element) {
    if (this.optional(element)) {
      return true;
    }

    // Just check that it's an EPSG code in the format EPSG:<number>.
    return /^EPSG:\d+$/i.test(value);
  });

  // drop in translated default validation messages
  var messages = {};
  _.each($.validator.messages, function(__, key) {
    var message = $.tNull('core.validation.' + key);
    if (message) {
      messages[key] = message;
    }
  });
  _.each(['maxlength', 'minlength', 'rangelength', 'range', 'max', 'min'],
    function(key) {
      messages[key] = $.validator.format(messages[key]);
    });
  $.extend($.validator.messages, messages);

  var loggedInCookie = $.cookies.get('logged_in');
  if (loggedInCookie && loggedInCookie == 'true') {
    $('#siteHeader').addClass('loggedIn').find('.siteUserNav').addClass('loggedInNav');
  }

  /* User Flashes
   *
   * Types:
   * - Old Browser Warning
   * - Maintenance Message
   * - Custom Informational Message
   *
   * Structure:
   * - Condition
   * - Acknowledgement (?)
   * - Message
   * - Classes
   */

  blist.namespace.fetch('blist.configuration');
  if (window === window.top) {
    // Construct User Flashes

    var browserIsOld = function(cookie) {
      if (cookie) {
        return false;
      }

      return $.browser.msie && $.browser.majorVersion < 9 ||
        $.browser.safari && $.browser.majorVersion < 6 ||
        // Chrome & Firefox update regularly, so this is not technically current - 1
        $.browser.chrome && $.browser.majorVersion < 28 ||
        $.browser.mozilla && $.browser.majorVersion < 24;
    };
    var oldBrowserMessage = [{
      _: 'div',
      contents: $.t('core.browser_support.message_html', {
        link_text: $.tag2({
          _: 'a',
          target: '_blank',
          href: 'http://support.socrata.com/entries/23245818-Socrata-Browser-Support',
          contents: $.t('core.browser_support.link_text')
        }, false)
      })
    }];
    var oldBrowserUserFlash = {
      shouldDisplay: browserIsOld,
      acknowledgementCookie: 'browser_ack',
      message: oldBrowserMessage,
      htmlClasses: ['error']
    };

    var userFlashes = [oldBrowserUserFlash];

    if (blist.configuration.maintenance_messages) {
      userFlashes = userFlashes.concat(blist.configuration.maintenance_messages);
    }

    var $noticeContainer = $('#noticeContainer');
    var closeIcon = {
      _: 'a',
      href: '#',
      className: 'close',
      contents: {
        _: 'span',
        className: 'icon',
        contents: 'close'
      }
    };

    _.each(userFlashes, function(flash) {
      var cookie = $.cookies.get(flash.acknowledgementCookie);
      if (!!flash.shouldDisplay(cookie) === false) {
        return;
      }

      // Construct the flash.
      // Please make sure to define htmlClasses as an array and not as a string.
      var $flash = $.tag2({
        _: 'div',
        className: flash.htmlClasses.concat('flash').join(' '),
        contents: [closeIcon].concat(flash.message)
      });

      $noticeContainer.append($flash);
      $flash.find('a.close').click(function(event) {
        event.preventDefault();
        $flash.fadeOut();
        if (flash.acknowlegementCookie) {
          $.cookies.set(flash.acknowledgementCookie, true);
        } else if (_.isFunction(flash.acknowledge)) {
          flash.acknowledge();
        }
      });
    });
  }

  var csrfTokenFromMeta = $('meta[name="csrf-token"]').attr('content');

  if (!$.isBlank(csrfTokenFromMeta)) {
    // for core server support
    $.cookies.set(csrfCookieName, csrfTokenFromMeta, {
      secure: true
    });
  }

  blist.configuration.appToken = 'U29jcmF0YS0td2VraWNrYXNz0';
  $.ajaxSetup({
    beforeSend: function(xhrObj) {
      xhrObj.setRequestHeader('X-App-Token', blist.configuration.appToken);
      xhrObj.setRequestHeader('X-CSRF-Token', $.cookies.get(csrfCookieName));
    }
  });

  // Timestamp for mixpanel logging
  blist.pageOpened = Math.round(new Date().getTime() / 1000);

  // Fix dates for local timezone
  $('.dateReplace').each(function() {
    var $d = $(this);
    var fmt;
    switch ($d.data('dateformat')) {
      case 'date_time':
        fmt = 'M d, Y g:ia';
        break;
      case 'long_date':
        fmt = 'F d, Y';
        break;
      case 'date':
      default:
        fmt = 'M d, Y';
        break;
    }
    $d.text(new Date($d.data('rawdatetime') * 1000).format(fmt));
  });
  // Newer, better version
  moment.lang(blist.locale);
  $('.dateLocalize').each(function() {
    var $d = $(this);
    // In order to use PDT rather than -07:00, we need the moment-timezone library.
    $d.text(moment($d.data('rawdatetime') * 1000).format('LLLL UTCZ'));
  });
  // Special clean-up for maintenance message
  var $mDates = $('.maintenanceNotice .dateLocalize');
  if (moment($mDates.eq(0).data('rawdatetime') * 1000).isSame($mDates.eq(1).data('rawdatetime') * 1000, 'day')) {
    var $date = $mDates.eq(1);
    $date.text(moment($date.data('rawdatetime') * 1000).format('LT'));
  }
  blist.configuration.shortDateFormat = 'llll'; // "Tue, Apr 1 2014 11:37 AM"
  blist.configuration.longDateFormat = 'LLLL'; // "Tuesday, April 1 2014 11:37 AM"

  var onCurrentUser = [];
  var onCurrentUserComplete = [];
  var currentUserDone = false;

  var dispatchCurrentUser = function(callbacks, user) {
    for (var i = 0; i < callbacks.length; i++) {
      var successCallback = callbacks[i];
      if (_.isFunction(successCallback)) {
        successCallback(user);
      }
    }
  };

  var getCurrentUser = function() {
    $.socrataServer.makeRequest({
      type: 'GET',
      url: '/api/users/current.json',
      cache: false,
      headers: {
        'Cache-Control': 'nocache'
      },
      success: function(user) {
        currentUserDone = true;
        user = new User(user);
        blist.currentUser = user;
        blist.currentUserId = user.id;
        var callbacks = onCurrentUser.concat(onCurrentUserComplete);
        dispatchCurrentUser(callbacks, user);
      },
      error: function() {
        // We dispatch an undefined user to anything waiting for this
        // process to complete
        currentUserDone = true;
        dispatchCurrentUser(onCurrentUserComplete);
      }
    });
  };

  // kick off the process of setting the current user
  loggedInCookie = $.cookies.get('logged_in');
  if (loggedInCookie && loggedInCookie == 'true' && blist.currentUser === undefined) {
    getCurrentUser();
  } else {
    currentUserDone = true;
    dispatchCurrentUser(onCurrentUserComplete, blist.currentUser);
  }

  //  Callback mechanism for when the request for the
  //  current user is slow
  blist.configuration.onCurrentUser = function(successCallback) {
    if (blist.currentUser !== undefined) {
      successCallback(blist.currentUser);
    } else {
      onCurrentUser.push(successCallback);
    }
  };

  //  Callback mechanism for when the current user has been checked
  //  or if there is no login cookie to check
  blist.configuration.onCurrentUserComplete = function(callback) {
    if (currentUserDone) {
      callback(blist.currentUser);
    } else {
      onCurrentUserComplete.push(callback);
    }
  };

  blist.configuration.onCurrentUser(
    function(user) {
      $('.accountLink .text .currentUser').text(user.displayName);
      $('.accountLink').removeClass('hide');
      $('.accountLikeLink').removeClass('hide');
      $('.signOutLink').removeClass('hide');
      $('.signInLink').addClass('hide');
      $('.signUpLink').addClass('hide');
      if (user !== undefined && user.rights && user.rights.length > 0) {
        $('.adminLink').removeClass('hide');
      }
      $('.myGoalsLink').toggleClass('hide', _.isUndefined(user) || !user.hasRight(blist.rights.user.EDIT_GOALS));
    });

  // GovStat account links are setup in main.html; originally before any current
  // user is available. We look to see if the govstat cb is defined and execute
  // them afterwards instead.
  blist.configuration.onCurrentUserComplete(
    function(user) {
      if (blist.configuration.govstat_links_cb !== undefined) {
        blist.configuration.govstat_links_cb(user);
      }
    });

  blist.namespace.fetch('blist.nextgen');
  _.each(window.location.href.match(/\w+=nextgen/g),
    function(prop) {
      blist.nextgen[prop.slice(0, prop.indexOf('='))] = true;
    });

});
