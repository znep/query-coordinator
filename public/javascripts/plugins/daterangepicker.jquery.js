/**
 * --------------------------------------------------------------------
 * jQuery-Plugin "daterangepicker.jQuery.js"
 * by Scott Jehl, scott@filamentgroup.com
 * http://www.filamentgroup.com
 * reference article: http://www.filamentgroup.com/lab/update_date_range_picker_with_jquery_ui/
 * demo page: http://www.filamentgroup.com/examples/daterangepicker/
 *
 * Copyright (c) 2008 Filament Group, Inc
 * Dual licensed under the MIT (filamentgroup.com/examples/mit-license.txt) and GPL (filamentgroup.com/examples/gpl-license.txt) licenses.
 *
 * Dependencies: jquery, jquery UI datepicker, date.js library (included at bottom), jQuery UI CSS Framework
 * Changelog:
 *  10.23.2008 initial Version
 *  11.12.2008 changed dateFormat option to allow custom date formatting (credit: http://alexgoldstone.com/)
 *  01.04.09 updated markup to new jQuery UI CSS Framework
 *  01.19.2008 changed presets hash to support different text
 * --------------------------------------------------------------------
 * Socrata changelog:
 *  03.21.2011 made it so that month of.. and year uf.. queries will autoaccept selection on accept
 *  08.25.2014 take initial dates from settings, handle text/previous/previousText on ranges, format with range name
 *  05.31.2016 fix formatting breaking when dates are blank by default
 */
jQuery.fn.daterangepicker = function(settings) {
  var rangeInput = jQuery(this);

  var KEY_CODES = {
    TAB_KEY: 9,
    ENTER_KEY: 13,
    ESCAPE_KEY: 27,
    UP_ARROW: 38,
    DOWN_ARROW: 40
  };

  //defaults
  var options = jQuery.extend({
    presetRanges: [
      {text: 'Today', dateStart: 'today', dateEnd: 'today'},
      {
        text: 'Week to Date', dateStart: function() {
        return Date.parse('today').moveToDayOfWeek(0, -1);
      }, dateEnd: 'today'
      },
      {
        text: 'Month to Date', dateStart: function() {
        return Date.parse('today').moveToFirstDayOfMonth();
      }, dateEnd: 'today'
      },
      {
        text: 'Year to Date', dateStart: function() {
        var x = Date.parse('today');
        x.setMonth(0);
        x.setDate(1);
        return x;
      }, dateEnd: 'today'
      },
      //extras:
      {
        text: 'Last Month', dateStart: function() {
        return Date.parse('1 month ago').moveToFirstDayOfMonth();
      }, dateEnd: function() {
        return Date.parse('1 month ago').moveToLastDayOfMonth();
      }
      }
    ],
    //presetRanges: array of objects for each menu preset.
    //Each obj must have text, dateStart, dateEnd. dateStart, dateEnd accept date.js string or a function which returns a date object
    presets: {
      specificDate: 'Specific Date',
      dateRange: 'Date Range',
      theWeekOf: 'The Week Of...',
      theMonthOf: 'The Month Of...',
      theYearOf: 'The Year Of...'
    },
    rangeStartTitle: 'Start date',
    rangeEndTitle: 'End date',
    nextLinkText: 'Next',
    prevLinkText: 'Prev',
    doneButtonText: 'Done',
    initialRange: {text: 'today', dateStart: 'today', dateEnd: 'today'},
    earliestDate: Date.parse('-15years'), //earliest date allowed
    latestDate: Date.parse('+15years'), //latest date allowed
    rangeSplitter: '-', //string to use between dates in single input
    dateFormat: 'm/d/yy', // date formatting. Available formats: http://docs.jquery.com/UI/Datepicker/%24.datepicker.formatDate
    closeOnSelect: true, //if a complete selection is made, close the menu
    arrows: false,
    posX: rangeInput.offset().left, // x position
    posY: rangeInput.offset().top + rangeInput.outerHeight(), // y position
    appendTo: 'body',
    onClose: function() {
    },
    onOpen: function() {
    },
    onChange: function() {
    },
    datepickerOptions: null //object containing native UI datepicker API options
  }, settings);


  //custom datepicker options, extended by options
  var datepickerOptions = {
    onSelect: function() {
      var startDate = rp.find('.range-start').datepicker('getDate');
      if (rp.find('.ui-daterangepicker-specificDate').is('.ui-state-active')) {
        rp.find('.range-end').datepicker('setDate', startDate);
      }
      else if (rp.find('.ui-daterangepicker-theWeekOf').is('.ui-state-active')) {
        rp.find('.range-start').datepicker('setDate', startDate.moveToDayOfWeek(0, -1));
        rp.find('.range-end').datepicker('setDate', startDate.moveToDayOfWeek(6));
      }
      else if (rp.find('.ui-daterangepicker-theMonthOf').is('.ui-state-active')) {
        rp.find('.range-start').datepicker('setDate', startDate.moveToFirstDayOfMonth());
        rp.find('.range-end').datepicker('setDate', startDate.moveToLastDayOfMonth());
      }
      else if (rp.find('.ui-daterangepicker-theYearOf').is('.ui-state-active')) {
        rp.find('.range-start').datepicker('setDate', startDate.set({
          day: 1,
          month: 0
        }));
        rp.find('.range-end').datepicker('setDate', startDate.set({
          day: 31,
          month: 11
        }));
      }
      else if (rp.find('.ui-daterangepicker-dateRange').is('.ui-state-active')) {
        doneBtn.hide();
        rpPickers.show();
        rp.find('.title-start').text(options.rangeStartTitle);
        rp.find('.title-end').text(options.rangeEndTitle);
        rp.find('.range-start').restoreDateFromData().show(400);
        rp.find('.range-end').restoreDateFromData().show(400);
        setTimeout(function() {
          doneBtn.fadeIn();
        }, 400);
      }

      updateInput();

      //if closeOnSelect is true
      if (options.closeOnSelect) {
        if (!rp.find('li.ui-state-active').is('.ui-daterangepicker-dateRange') && !rp.is(':animated')) {
          hideRP();
        }
      }
      options.onChange();
    },
    defaultDate: +0
  };

  // Interpret a date given as either a Date.js parseable string,
  // a function returning a Date, or null/undefined.
  var interpretDate = function(date) {
    switch (typeof date) {
      case 'string':
        return Date.parse(date);
      case 'function':
        return date();
      default:
        return null;
    }
  };


  //change event fires both when a calendar is updated or a change event on the input is triggered
  rangeInput.change(options.onChange);


  //datepicker options from options
  options.datepickerOptions = (settings) ? jQuery.extend(datepickerOptions, settings.datepickerOptions) : datepickerOptions;

  //build picker and
  var rp = jQuery('<div/>', {
    'class': [
      'ui-daterangepicker',
      'ui-widget',
      'ui-helper-clearfix',
      'ui-widget-content',
      'ui-corner-all'
      ].join(' ')
  });
  var ul = jQuery('<ul class="ui-widget-content"></ul>').appendTo(rp);
  jQuery.each(options.presetRanges, function() {
    jQuery('<li/>', {
      'class': [
        'ui-daterangepicker-' + this.text.replace(/ /g, ''),
        'ui-corner-all'
      ].join(' '),
      html: '<a href="#">' + this.text + '</a>',
      data: this
    }).appendTo(ul);
  });
  var x = 0;
  jQuery.each(options.presets, function(key, value) {
    jQuery('<li/>', {
      'class': [
        'ui-daterangepicker-' + key,
        'preset_' + x,
        'ui-helper-clearfix ui-corner-all'
      ].join(' '),
      html: '<span class="ui-icon ui-icon-triangle-1-e"></span><a href="#">' + value + '</a>'
    }).appendTo(ul);
    x++;
  });

  var $menuItems = ul.find('li');
  $menuItems.on('focus', function() {
    $menuItems.removeClass('ui-state-focus');
    $(this).addClass('ui-state-focus');
  });

  $menuItems.hover(
    function() {
      jQuery(this).addClass('ui-state-hover');
      $menuItems.filter('.ui-state-focus').removeClass('ui-state-focus');
    },
    function() {
      jQuery(this).removeClass('ui-state-hover');
    })
    .click(function() {
      $menuItems.filter('.ui-state-active').removeClass('ui-state-active');
      $menuItems.filter('.ui-state-focus').removeClass('ui-state-focus');
      jQuery(this).addClass('ui-state-active').clickActions(rp, rpPickers, doneBtn);
      return false;
    });
  var rangeText = options.initialRange.text;
  var rangePreviousText = options.initialRange.previousText;
  var rangePrevious = interpretDate(options.initialRange.datePrevious);

  //function to format a date string
  function fDate(date) {
    if (date && !date.getDate()) {
      return '';
    }
    var dateFormat = options.dateFormat;
    return jQuery.datepicker.formatDate(dateFormat, date);
  }

  // Set the textual value and jQuery data of the input element.
  var updateInput = function() {
    var rangeStart = rp.find('.range-start').datepicker('getDate');
    var rangeA = fDate(rangeStart);
    var rangeEnd = rp.find('.range-end').datepicker('getDate');
    var rangeB = fDate(rangeEnd);

    //send back to input or inputs
    if (rangeInput.length == 2) {
      rangeInput.eq(0).val(rangeA);
      rangeInput.eq(1).val(rangeB);
    }
    else {
      var rangeValue = (rangeA != rangeB) ? rangeA + ' ' + options.rangeSplitter + ' ' + rangeB : rangeA;
      if (rangeText && blist.feature_flags['embetter_analytics_page']) {
        rangeInput.val(rangeText + ' (' + rangeValue + ')');
      }
      else {
        rangeInput.val(rangeValue);
      }
      rangeInput.data('range-start', rangeStart);
      rangeInput.data('range-end', rangeEnd);
      rangeInput.data('range-text', rangeText);
      rangeInput.data('range-previousText', rangePreviousText);
      rangeInput.data('range-previous', rangePrevious);
    }
  };

  jQuery.fn.restoreDateFromData = function() {
    if (jQuery(this).data('saveDate')) {
      jQuery(this).datepicker('setDate', jQuery(this).data('saveDate')).removeData('saveDate');
    }
    return this;
  };

  jQuery.fn.saveDateToData = function() {
    if (!jQuery(this).data('saveDate')) {
      jQuery(this).data('saveDate', jQuery(this).datepicker('getDate'));
    }
    return this;
  };

  //show, hide, or toggle rangepicker
  function showRP() {
    if (rp.data('state') == 'closed') {
      rp.data('state', 'open');
      rp.fadeIn(300);
      options.onOpen();
    }
  }

  function hideRP() {
    if (rp.data('state') == 'open') {
      rp.data('state', 'closed');
      rp.fadeOut(300);
      options.onClose();
    }
  }

  function toggleRP() {
    if (rp.data('state') == 'open') {
      hideRP();
    }
    else {
      showRP();
    }
  }

  rp.data('state', 'closed');

  //preset menu click events
  jQuery.fn.clickActions = function(rp, rpPickers, doneBtn) {

    doneBtn.data('daterangepicker-autoacceptrange', false);

    rangeText = "";
    rangePreviousText = "";
    rangePrevious = null;
    if (jQuery(this).is('.ui-daterangepicker-specificDate')) {
      doneBtn.hide();
      rpPickers.show();
      rp.find('.title-start').text(options.presets.specificDate);
      rp.find('.range-start')
        .datepicker('option', 'changeYear', false)
        .datepicker('option', 'changeMonth', false)
        .restoreDateFromData().show(400);
      rp.find('.range-end').hide(400);
      setTimeout(function() {
        doneBtn.fadeIn();
      }, 400);
    }
    else if (jQuery(this).is('.ui-daterangepicker-theWeekOf')) {
      doneBtn.hide();
      rpPickers.show();
      rp.find('.title-start').text(options.presets.theWeekOf);
      rp.find('.range-start')
        .datepicker('option', 'changeYear', false)
        .datepicker('option', 'changeMonth', false)
        .restoreDateFromData().show(400);
      rp.find('.range-end').hide(400);
      setTimeout(function() {
        doneBtn.fadeIn();
      }, 400);
    }
    else if (jQuery(this).is('.ui-daterangepicker-theMonthOf')) {
      doneBtn.hide()
        .data('daterangepicker-autoacceptrange', true);
      rpPickers.show();
      rp.find('.title-start').text(options.presets.theMonthOf);
      rp.find('.range-start')
        .datepicker('option', 'changeYear', false)
        .datepicker('option', 'changeMonth', true)
        .restoreDateFromData().show(400);
      rp.find('.range-end').hide(400);
      setTimeout(function() {
        doneBtn.fadeIn();
      }, 400);
    }
    else if (jQuery(this).is('.ui-daterangepicker-theYearOf')) {
      doneBtn.hide()
        .data('daterangepicker-autoacceptrange', true);
      rpPickers.show();
      rp.find('.title-start').text(options.presets.theYearOf);
      rp.find('.range-start')
        .datepicker('option', 'changeYear', true)
        .datepicker('option', 'changeMonth', false)
        .restoreDateFromData().show(400);
      rp.find('.range-end').hide(400);
      setTimeout(function() {
        doneBtn.fadeIn();
      }, 400);
    }
    else if (jQuery(this).is('.ui-daterangepicker-dateRange')) {
      doneBtn.hide();
      rpPickers.show();
      rp.find('.title-start').text(options.rangeStartTitle);
      rp.find('.title-end').text(options.rangeEndTitle);
      rp.find('.range-start').restoreDateFromData().show(400);
      rp.find('.range-end').restoreDateFromData().show(400);
      setTimeout(function() {
        doneBtn.fadeIn();
      }, 400);
    }
    else {
      //custom date range
      doneBtn.hide();
      rp.find('.range-start, .range-end').hide(400, function() {
        rpPickers.hide();
      });
      var dateStart = interpretDate(jQuery(this).data('dateStart'));
      var dateEnd = interpretDate(jQuery(this).data('dateEnd'));
      rangeText = jQuery(this).data('text');
      rangePreviousText = jQuery(this).data('previousText');
      rangePrevious = interpretDate(jQuery(this).data('datePrevious'));
      rp.find('.range-start').datepicker('setDate', dateStart).find('.ui-datepicker-current-day').trigger('click');
      rp.find('.range-end').datepicker('setDate', dateEnd).find('.ui-datepicker-current-day').trigger('click');
    }

    return false;
  };


  //picker divs
  var rpPickers = jQuery('<div class="ranges ui-widget-header ui-corner-all ui-helper-clearfix"><div class="range-start"><span class="title-start">Start Date</span></div><div class="range-end"><span class="title-end">End Date</span></div></div>').appendTo(rp);
  rpPickers.find('.range-start, .range-end').datepicker(options.datepickerOptions);
  rpPickers.find('.range-start').datepicker('setDate', interpretDate(options.initialRange.dateStart));
  rpPickers.find('.range-end').datepicker('setDate', interpretDate(options.initialRange.dateEnd));
  var doneBtn = jQuery('<button class="btnDone ui-state-default ui-corner-all">' + options.doneButtonText + '</button>')
    .click(function() {
      if ($(this).data('daterangepicker-autoacceptrange') === true) {
        rp.find('.ui-datepicker-calendar:visible td:not(.ui-datepicker-unselectable):first').trigger('click');
      }
      else {
        rp.find('.ui-datepicker-current-day').trigger('click');
      }
      hideRP();
    })
    .hover(
      function() {
        jQuery(this).addClass('ui-state-hover');
      },
      function() {
        jQuery(this).removeClass('ui-state-hover');
      }
    )
    .appendTo(rpPickers);


  updateInput();

  //inputs toggle rangepicker visibility
  jQuery(this).click(function() {
    toggleRP();
    return false;
  });

  /* On tabbing into the input, change to a keyboard accessible range picker
     of two text inputs with keyboard accessible jQuery UI datepickers attached

     Clicking outside of the datepickers, or tabbing out of them, will use the
     currently selected values, and revert back to the drop-down style range
     picker.
   */
  var $input = jQuery(this);
  var $tabbableItems = jQuery(':tabbable');
  var inputTabIndex = $tabbableItems.index($input);
  var $elementBeforeInputInTabOrder = $tabbableItems.eq(inputTabIndex - 1);
  var $elementAfterInputInTabOrder = $tabbableItems.eq(inputTabIndex + 1);
  var $accessibleInputs = jQuery([
    '<div>',
      '<label for="start-date">Start Date</label><input id="start-date" type="text">',
      '<label for="end-date">End Date</label><input id="end-date" type="text">',
    '</div>'
  ].join('')).hide().insertAfter($input);
  var $startDate = $accessibleInputs.find('#start-date').
    on('keydown', function(event) {
      if (event.shiftKey && event.which === KEY_CODES.TAB_KEY) {
        event.preventDefault();
        hideAccessibleInputs();
        $elementBeforeInputInTabOrder.focus();
      }
    }).
    datepicker($.extend({}, options.datepickerOptions, {
      onSelect: function(newValue) {
        rpPickers.find('.range-start').datepicker('setDate', newValue);
        updateInput();
      }
    }));

  var $endDate = $accessibleInputs.find('#end-date').
    on('keydown', function(event) {
      if (event.which === KEY_CODES.TAB_KEY && !event.shiftKey) {
        event.preventDefault();
        hideAccessibleInputs();
        $elementAfterInputInTabOrder.focus();
      }
    }).
  datepicker($.extend({}, options.datepickerOptions, {
    onSelect: function(newValue) {
      rpPickers.find('.range-end').datepicker('setDate', newValue);
      updateInput();
    }
  }));

  var onDocumentClick = function(event) {
    if ($(event.target).closest($accessibleInputs).length > 0) {
      return;
    }
    hideAccessibleInputs();
  };

  var showAccessibleInputs = function() {
    hideRP();
    $input.hide();
    $startDate.datepicker('setDate', rpPickers.find('.range-start').datepicker('getDate'));
    $endDate.datepicker('setDate', rpPickers.find('.range-end').datepicker('getDate'));
    $accessibleInputs.show();
    $startDate.focus();
    jQuery(document).on('click', onDocumentClick);
  };

  var hideAccessibleInputs = function() {
    jQuery(document).off('click', onDocumentClick);
    $input.show();
    $accessibleInputs.hide();
    options.onClose(); // because that's what the metrics page listens for :facepalm:
  };


  $input.on('keyup', function(event) {
    if (event.which === KEY_CODES.TAB_KEY && $input.is(':focus')) {
      showAccessibleInputs();
    }
  });

  //hide em all
  rpPickers.css('display', 'none').find('.range-start, .range-end, .btnDone').css('display', 'none');

  //inject rp
  jQuery(options.appendTo).append(rp);

  //wrap and position
  rp.wrap('<div class="ui-daterangepickercontain"></div>');
  if (options.rightAlign) {
    rp.parent().css('right', options.rightAlign);
  }
  else if (options.posX) {
    rp.parent().css('left', options.posX);
  }
  if (options.posY) {
    rp.parent().css('top', options.posY);
  }

  //add arrows (only available on one input)
  if (options.arrows && rangeInput.size() == 1) {
    var prevLink = jQuery('<a href="#" class="ui-daterangepicker-prev ui-corner-all" title="' + options.prevLinkText + '"><span class="ui-icon ui-icon-circle-triangle-w">' + options.prevLinkText + '</span></a>');
    var nextLink = jQuery('<a href="#" class="ui-daterangepicker-next ui-corner-all" title="' + options.nextLinkText + '"><span class="ui-icon ui-icon-circle-triangle-e">' + options.nextLinkText + '</span></a>');
    jQuery(this)
      .addClass('ui-rangepicker-input ui-widget-content')
      .wrap('<div class="ui-daterangepicker-arrows ui-widget ui-widget-header ui-helper-clearfix ui-corner-all"></div>')
      .before(prevLink)
      .before(nextLink)
      .parent().find('a').click(function() {
        var dateA = rpPickers.find('.range-start').datepicker('getDate');
        var dateB = rpPickers.find('.range-end').datepicker('getDate');
        var diff = Math.abs(new TimeSpan(dateA - dateB).getTotalMilliseconds()) + 86400000; //difference plus one day
        if (jQuery(this).is('.ui-daterangepicker-prev')) {
          diff = -diff;
        }

        rpPickers.find('.range-start, .range-end ').each(function() {
          var thisDate = jQuery(this).datepicker("getDate");
          if (thisDate == null) {
            return false;
          }
          jQuery(this).datepicker("setDate", thisDate.add({milliseconds: diff})).find('.ui-datepicker-current-day').trigger('click');
        });

        return false;
      })
      .hover(
        function() {
          jQuery(this).addClass('ui-state-hover');
        },
        function() {
          jQuery(this).removeClass('ui-state-hover');
        })
    ;
  }


  jQuery(document).click(function() {
    if (rp.is(':visible')) {
      hideRP();
    }
  });

  rp.click(function() {
    return false;
  }).hide();
  return this;
};


/**
 * @version: 1.0 Alpha-1
 * @author: Coolite Inc. http://www.coolite.com/
 * @date: 2008-04-13
 * @copyright: Copyright (c) 2006-2008, Coolite Inc. (http://www.coolite.com/). All rights reserved.
 * @license: Licensed under The MIT License. See license.txt and http://www.datejs.com/license/.
 * @website: http://www.datejs.com/
 */

/* 
 * TimeSpan(milliseconds);
 * TimeSpan(days, hours, minutes, seconds);
 * TimeSpan(days, hours, minutes, seconds, milliseconds);
 */
var TimeSpan = function(days, hours, minutes, seconds, milliseconds) {
  var attrs = "days hours minutes seconds milliseconds".split(/\s+/);

  var gFn = function(attr) {
    return function() {
      return this[attr];
    };
  };

  var sFn = function(attr) {
    return function(val) {
      this[attr] = val;
      return this;
    };
  };

  for (var i = 0; i < attrs.length; i++) {
    var $a = attrs[i], $b = $a.slice(0, 1).toUpperCase() + $a.slice(1);
    TimeSpan.prototype[$a] = 0;
    TimeSpan.prototype["get" + $b] = gFn($a);
    TimeSpan.prototype["set" + $b] = sFn($a);
  }

  if (arguments.length == 4) {
    this.setDays(days);
    this.setHours(hours);
    this.setMinutes(minutes);
    this.setSeconds(seconds);
  } else if (arguments.length == 5) {
    this.setDays(days);
    this.setHours(hours);
    this.setMinutes(minutes);
    this.setSeconds(seconds);
    this.setMilliseconds(milliseconds);
  } else if (arguments.length == 1 && typeof days == "number") {
    var orient = (days < 0) ? -1 : +1;
    this.setMilliseconds(Math.abs(days));

    this.setDays(Math.floor(this.getMilliseconds() / 86400000) * orient);
    this.setMilliseconds(this.getMilliseconds() % 86400000);

    this.setHours(Math.floor(this.getMilliseconds() / 3600000) * orient);
    this.setMilliseconds(this.getMilliseconds() % 3600000);

    this.setMinutes(Math.floor(this.getMilliseconds() / 60000) * orient);
    this.setMilliseconds(this.getMilliseconds() % 60000);

    this.setSeconds(Math.floor(this.getMilliseconds() / 1000) * orient);
    this.setMilliseconds(this.getMilliseconds() % 1000);

    this.setMilliseconds(this.getMilliseconds() * orient);
  }

  this.getTotalMilliseconds = function() {
    return (this.getDays() * 86400000) + (this.getHours() * 3600000) + (this.getMinutes() * 60000) + (this.getSeconds() * 1000);
  };

  this.compareTo = function(time) {
    var t1 = new Date(1970, 1, 1, this.getHours(), this.getMinutes(), this.getSeconds()), t2;
    if (time === null) {
      t2 = new Date(1970, 1, 1, 0, 0, 0);
    }
    else {
      t2 = new Date(1970, 1, 1, time.getHours(), time.getMinutes(), time.getSeconds());
    }
    return (t1 < t2) ? -1 : (t1 > t2) ? 1 : 0;
  };

  this.equals = function(time) {
    return (this.compareTo(time) === 0);
  };

  this.add = function(time) {
    return (time === null) ? this : this.addSeconds(time.getTotalMilliseconds() / 1000);
  };

  this.subtract = function(time) {
    return (time === null) ? this : this.addSeconds(-time.getTotalMilliseconds() / 1000);
  };

  this.addDays = function(n) {
    return new TimeSpan(this.getTotalMilliseconds() + (n * 86400000));
  };

  this.addHours = function(n) {
    return new TimeSpan(this.getTotalMilliseconds() + (n * 3600000));
  };

  this.addMinutes = function(n) {
    return new TimeSpan(this.getTotalMilliseconds() + (n * 60000));
  };

  this.addSeconds = function(n) {
    return new TimeSpan(this.getTotalMilliseconds() + (n * 1000));
  };

  this.addMilliseconds = function(n) {
    return new TimeSpan(this.getTotalMilliseconds() + n);
  };

  this.get12HourHour = function() {
    return (this.getHours() > 12) ? this.getHours() - 12 : (this.getHours() === 0) ? 12 : this.getHours();
  };

  this.getDesignator = function() {
    return (this.getHours() < 12) ? Date.CultureInfo.amDesignator : Date.CultureInfo.pmDesignator;
  };

  this.toString = function(format) {
    this._toString = function() {
      if (this.getDays() !== null && this.getDays() > 0) {
        return this.getDays() + "." + this.getHours() + ":" + this.p(this.getMinutes()) + ":" + this.p(this.getSeconds());
      }
      else {
        return this.getHours() + ":" + this.p(this.getMinutes()) + ":" + this.p(this.getSeconds());
      }
    };

    this.p = function(s) {
      return (s.toString().length < 2) ? "0" + s : s;
    };

    var me = this;

    return format ? format.replace(/dd?|HH?|hh?|mm?|ss?|tt?/g,
      function(format) {
        switch (format) {
          case "d":
            return me.getDays();
          case "dd":
            return me.p(me.getDays());
          case "H":
            return me.getHours();
          case "HH":
            return me.p(me.getHours());
          case "h":
            return me.get12HourHour();
          case "hh":
            return me.p(me.get12HourHour());
          case "m":
            return me.getMinutes();
          case "mm":
            return me.p(me.getMinutes());
          case "s":
            return me.getSeconds();
          case "ss":
            return me.p(me.getSeconds());
          case "t":
            return ((me.getHours() < 12) ? Date.CultureInfo.amDesignator : Date.CultureInfo.pmDesignator).substring(0, 1);
          case "tt":
            return (me.getHours() < 12) ? Date.CultureInfo.amDesignator : Date.CultureInfo.pmDesignator;
        }
      }
    ) : this._toString();
  };
  return this;
};

/**
 * Gets the time of day for this date instances.
 * @return {TimeSpan} TimeSpan
 */
Date.prototype.getTimeOfDay = function() {
  return new TimeSpan(0, this.getHours(), this.getMinutes(), this.getSeconds(), this.getMilliseconds());
};

/* 
 * TimePeriod(startDate, endDate);
 * TimePeriod(years, months, days, hours, minutes, seconds, milliseconds);
 */
var TimePeriod = function(years, months, days, hours, minutes, seconds, milliseconds) {
  var attrs = "years months days hours minutes seconds milliseconds".split(/\s+/);

  var gFn = function(attr) {
    return function() {
      return this[attr];
    };
  };

  var sFn = function(attr) {
    return function(val) {
      this[attr] = val;
      return this;
    };
  };

  for (var i = 0; i < attrs.length; i++) {
    var $a = attrs[i], $b = $a.slice(0, 1).toUpperCase() + $a.slice(1);
    TimePeriod.prototype[$a] = 0;
    TimePeriod.prototype["get" + $b] = gFn($a);
    TimePeriod.prototype["set" + $b] = sFn($a);
  }

  if (arguments.length == 7) {
    this.years = years;
    this.months = months;
    this.setDays(days);
    this.setHours(hours);
    this.setMinutes(minutes);
    this.setSeconds(seconds);
    this.setMilliseconds(milliseconds);
  } else if (arguments.length == 2 && arguments[0] instanceof Date && arguments[1] instanceof Date) {
    // startDate and endDate as arguments

    var d1 = years.clone();
    var d2 = months.clone();

    var temp = d1.clone();
    var orient = (d1 > d2) ? -1 : +1;

    this.years = d2.getFullYear() - d1.getFullYear();
    temp.addYears(this.years);

    if (orient == +1) {
      if (temp > d2) {
        if (this.years !== 0) {
          this.years--;
        }
      }
    } else {
      if (temp < d2) {
        if (this.years !== 0) {
          this.years++;
        }
      }
    }

    d1.addYears(this.years);

    if (orient == +1) {
      while (d1 < d2 && d1.clone().addDays(Date.getDaysInMonth(d1.getYear(), d1.getMonth())) < d2) {
        d1.addMonths(1);
        this.months++;
      }
    }
    else {
      while (d1 > d2 && d1.clone().addDays(-d1.getDaysInMonth()) > d2) {
        d1.addMonths(-1);
        this.months--;
      }
    }

    var diff = d2 - d1;

    if (diff !== 0) {
      var ts = new TimeSpan(diff);
      this.setDays(ts.getDays());
      this.setHours(ts.getHours());
      this.setMinutes(ts.getMinutes());
      this.setSeconds(ts.getSeconds());
      this.setMilliseconds(ts.getMilliseconds());
    }
  }
  return this;
};
