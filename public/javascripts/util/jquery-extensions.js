$.fn.dimensions = function() {
  // For reference, this results in a 15% increase in profiled idle time than what is in use:
  //var el = this[0];
  //return {
  //  width: Math.min(el.clientWidth, el.scrollWidth, el.offsetWidth),
  //  height: Math.min(el.clientHeight, el.scrollHeight, el.offsetHeight)
  //};
  // Might be worth looking into next time we make a perf pass.
  return {width: this.width(), height: this.height()};
};

// Yields an RX observable sequence of this selection's dimensions.
$.fn.observeDimensions = function() {
  var self = this;
  var dimensionsSubject = new Rx.BehaviorSubject(self.dimensions());

  self.resize(function() {
    // We must check to see if the dimensions really did change,
    // as jQuery.resize-plugin has a bug in versions of IE which require polling for size changes.
    var oldDimensions = dimensionsSubject.value;
    var newDimensions = self.dimensions();
    if (oldDimensions.width !== newDimensions.width || oldDimensions.height !== newDimensions.height) {
      dimensionsSubject.onNext(newDimensions);
    }
  });

  return dimensionsSubject;
};

$.isPresent = function(argument) {
  return !_.isEmpty(argument);
};

$.commaify = function(value) {
  value = value + '';
  var pos = value.indexOf('.');

  if (pos == -1) {
    pos = value.length;
  }
  pos -= 3;
  while (pos > 0 && value.charAt(pos - 1) >= '0' && value.charAt(pos - 1) <= '9') {
    value = value.substring(0, pos) + ',' + value.substring(pos);
    pos -= 3;
  }

  return value;
};

$.toFixedHumaneNumber = function(val, precision) {
  var symbol = ['K', 'M', 'B', 'T'];
  var step = 1000;
  var divider = Math.pow(step, symbol.length);
  var absVal = Math.abs(val);
  var result;

  val = parseFloat(val);

  for (var i = symbol.length - 1; i >= 0; i--) {
    if (absVal >= divider) {
      result = (absVal / divider).toFixed(precision);
      if (val < 0) {
        result = -result;
      }
      return result + symbol[i];
    }

    divider = divider / step;
  }

  result = val.toFixed(precision);
  return result === 0 ? 0 : result;
};

$.toHumaneNumber = function(val) {
  if (typeof val != 'number') {
    throw new Error("Invalid input");
  }
  var maxLetters = 4;
  var symbol = ['K', 'M', 'B', 'T', 'P', 'E', 'Z', 'Y'];
  var step = 1000;
  var divider = Math.pow(step, symbol.length);
  val = parseFloat(val);
  var absVal = Math.abs(val);
  var result;
  var beforeLength = val.toFixed(0).length;

  if (beforeLength <= maxLetters) {
    var parts = val.toString().split('.');
    var afterLength = (parts[1] || '').length;
    var maxAfterLength = maxLetters - beforeLength;
    if (afterLength > maxAfterLength) {
      afterLength = maxAfterLength;
    }
    return $.commaify(val.toFixed(afterLength));
  }

  for (var i = symbol.length - 1; i >= 0; i--) {
    if (absVal >= divider) {
      var count = (absVal / divider).toFixed(0).length;
      var precision = maxLetters - count - 1;
      if (precision < 0) {
        precision = 0;
      }
      result = (absVal / divider).toFixed(precision);
      if (val < 0) {
        result = -result;
      }
      if (_.isFinite(result)) {
        return $.commaify(result) + symbol[i];
      } else {
        return result.toString();
      }
    }
    divider = divider / step;
  }
};

String.prototype.format = function() {
  var self = this;
  var i = arguments.length;

  while (i--) {
    self = self.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
  }

  return self;
};

String.prototype.capitaliseEachWord = function() {
  return this.split(' ').map(function(word) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
};

/* Adapted from http://blog.mastykarz.nl/measuring-the-length-of-a-string-in-pixels-using-javascript/ */
String.prototype.visualSize = function(fontSize) {
  var $ruler = $('#ruler');
  var dimensions;

  if ($ruler.length < 1) {
    $('body').append('<span class="ruler" id="ruler"></span>');
    $ruler = $('#ruler');
  }
  if (!fontSize) {
    fontSize = '';
  }
  $ruler.css('font-size', fontSize);
  $ruler.text(this + '');
  debugger
  dimensions = { width: $ruler.width(), height: $ruler.height() };
  
  $ruler.remove();

  return dimensions;
};

// This function updated by Chris Laidlaw to use
// native DOM methods rather than uncached jQuery
// objects since it sits in the hot path and the
// native DOM methods improved performance by 50%.

String.prototype.visualSize = function(fontSize) {

  var span = document.getElementById('ruler');
  var dimensions;

  if (span === null) {
    span = document.createElement('span');
    span.className = 'ruler';
    span.id = 'ruler';
    span.setAttribute('aria-hidden', 'true');
    span.appendChild(document.createTextNode(this));
    document.getElementsByTagName('body')[0].appendChild(span);
  } else {
    span.lastChild.textContent = this;
  }
  
  if (fontSize) {
    span.style.fontSize = fontSize;
  }

  dimensions = { width: span.offsetWidth, height: span.offsetHeight };

  return dimensions;
};

String.prototype.visualHeight = function(fontSize) {
  return this.visualSize(fontSize).height;
};

String.prototype.visualLength = function(fontSize) {
  return this.visualSize(fontSize).width;
};

$.relativeToPx = function(rems) {
  var $div = $(document.createElement('div')).css('width', rems).appendTo(document.body);
  var width = $div.width();

  $div.remove();

  return width;
};

$.isBlank = function(value) {
  return _.isUndefined(value) || _.isNull(value) || value === '';
};

$.capitalizeWithDefault = function(value, placeHolder) {
  placeHolder = placeHolder || '(Blank)';
  return $.isBlank(value) ? placeHolder : value.capitaliseEachWord();
};
/*
 * flyout is an internal Socrata utility for creating flyouts.
 * It's a jQuery extension that uses a delegate for handling mouseover events.
 * Usage is in the form of $head.flyout(options)
 *
 * All options can be passed directly or as a function that returns them.
 * The callback should be in the form of:
 *  function($target, $head, options, $flyout) { return <obj>; }
 *
 * Options:
 *  selector: The jQuery delegate selector. Since this is a jQuery selector you
 *    can pass in compound queries such as ".labels .label, .bar-group".
 *
 *  parent: Where the flyouts should attach to.
 *    By default they attach to the selected target.
 *
 *  style: The style and positioning behavior.
 *    "chart" is the new style used for column chart and timeline chart.
 *    "table" is an older style used for the table card
 *
 *  direction: This is the direction from the target that the flyout appears.
 *    "top" means the flyout is above the target.
 *    The special "horizontal" when combined with the "table" style will
 *      position it on either side space allowing.
 *
 *  positionOn: An element to position the flyout relative to.
 *
 *  onOpen: A callback on open.
 *
 *  onClose: A callback on close.
 *
 *  margin: This is the number of pixels the flyout will stay from the edge of
 *    the "overflow: hidden" container.
 *
 *  interact: Whether you can mouse into the flyout and select text.
 *
 *  arrowMargin: The number of pixels the arrow will stay away from the edge of
 *    the flyout.
 *
 *  inset: This is an object with "horizontal" & "vertical" properties.
 *    They decide how Far the tooltip will inset into the target element.
 *
 *  debugNeverClosePopups: Debug bool to leave popups in existance after mouseout.
 *    This makes it easier to debug CSS.
 */
$.fn.flyout = function(options) {
  var defaults = {
    direction: 'top',
    margin: 0,
    interact: false,
    style: 'chart',
    arrowMargin: 0,
    inset: {
      horizontal: 4,
      vertical: 2
    }
  };
  if (options.style == 'table') {
    defaults.arrowMargin = 10;
    defaults.margin = 5;
  }
  options = _.extend(defaults, options);
  var self = this;
  var inFlyout = false, inTarget = false, flyout;
  var renderFlyout = function(target) {
    var $target = $(target);
    var parentElem = $(options.parent || $target);
    $('.flyout').remove();
    flyout = $('<div class="flyout"><div class="flyout-arrow"></div></div>');
    flyout.addClass('flyout-' + options.style);
    flyout.data('target', target);
    var getVal = function(data) {
      if (_.isFunction(data)) {
        return data($target, self, options, flyout);
      } else {
        return data;
      }
    };
    var $positionOn;
    if (_.isUndefined(options.positionOn)) {
      $positionOn = $target;
    } else {
      $positionOn = $(getVal(options.positionOn));
    }
    if (!getVal(options.interact)) flyout.addClass('nointeract');
    if (options.title) {
      flyout.append('<div class="flyout-title">{0}</div>'.
        format(getVal(options.title)));
    }
    if (options.table) {
      var html = '';
        _.each(getVal(options.table), function(parts) {
          html += '<div class="flyout-row">';
          _.each(parts, function(part) {
            html += '<span class="flyout-cell">{0}</span>'.format(part);
          });
          html += '</div>';
        });
      flyout.append(html);
    }
    if (options.html) {
      flyout.append(getVal(options.html));
    }

    if (flyout.text().length > 0) {
      parentElem.append(flyout);
    }
    var container = $positionOn.parent();
    while(container.css('overflow') == 'visible' && container[0] != document.body) {
      container = container.parent();
    }
    if (_.isEmpty(container)) {
      return;
    }
    var containerRightEdge = $('body').outerWidth();
    var containerLeftEdge = 0;
    if (container[0] != document.body) {
      containerLeftEdge = container.offset().left;
      containerRightEdge = container.offset().left + container.outerWidth() - options.margin;
    }
    var direction = getVal(options.direction);
    var pos = $positionOn.offset(), top, left;
    var targetLeftEdge = pos.left;
    var targetSize = {};
    if (typeof $positionOn[0].getBoundingClientRect === 'function') {
      targetSize.height = $positionOn[0].getBoundingClientRect().height;
      targetSize.width = $positionOn[0].getBoundingClientRect().width;
    } else if (typeof $positionOn[0].getBBox === 'function') {
      targetSize.height = $positionOn[0].getBBox().height;
      targetSize.width = $positionOn[0].getBBox().width;
    } else {
      targetSize.height = $positionOn.outerHeight() || parseInt($positionOn.attr('height'));
      targetSize.width = $positionOn.outerWidth() || parseInt($positionOn.attr('width'));
    }
    // TODO decide what to do here. Either show the tooltip at the zero point or thrown an error, but don't log
//    if (!targetSize.width || !targetSize.height) {
//      console.error("[$.fn.flyout] target has height: "+targetSize.height+", width: "+targetSize.width+". No flyout possible.");
//    }
    var targetRightEdge = pos.left + targetSize.width;
    var targetWidth = targetRightEdge - targetLeftEdge;
    if (direction == 'horizontal') {
      if (targetRightEdge + flyout.outerWidth() > containerRightEdge &&
          targetLeftEdge - flyout.outerWidth() > containerLeftEdge) {
        direction = 'left';
      } else {
        direction = 'right';
      }
    }
    flyout.addClass(direction);
    if (options.style == 'table') {
      if (direction == "top") {
        top = pos.top - flyout.outerHeight() + options.inset.vertical;
        left = pos.left + targetWidth/2 - flyout.outerWidth()/2;
      } else if (direction == "bottom") {
        top = pos.top + targetSize.height - options.inset.vertical;
        left = pos.left + targetWidth/2 - flyout.outerWidth()/2;
      } else if (direction == "right") {
        top = pos.top + targetSize.height/2 - flyout.outerHeight()/2;
        left = pos.left + targetSize.width - options.inset.horizontal;
      } else if (direction == "left") {
        top = pos.top + targetSize.height/2 - flyout.outerHeight()/2;
        left = pos.left - flyout.outerWidth() + options.inset.horizontal;
      }
      var offright = left + flyout.outerWidth() > containerRightEdge - options.margin;
      var offleft = left < containerLeftEdge + options.margin;
      if (offright) {
        left = containerRightEdge - flyout.outerWidth() - options.margin;
      }
      if (offleft) {
        left = containerLeftEdge + options.margin;
      }
      if (targetLeftEdge < containerLeftEdge) targetLeftEdge = containerLeftEdge;
      if (targetRightEdge > containerRightEdge) targetRightEdge = containerRightEdge;
      if (direction == 'top' || direction == 'bottom') {
        var center = (targetLeftEdge + targetRightEdge) / 2;
        var arrow_pos = center - left;
        if (arrow_pos <= options.arrowMargin) arrow_pos = options.arrowMargin;
        else if (arrow_pos >= flyout.outerWidth() - options.arrowMargin) arrow_pos = flyout.outerWidth() - options.arrowMargin;
        flyout.find('.flyout-arrow').css('left', arrow_pos);
      }
    } else if (options.style == 'chart') {
      if (direction == 'top') {
        top = pos.top - flyout.outerHeight() + options.inset.vertical -
          parseInt(flyout.find('.flyout-arrow').css('margin-top'));
        var orientationIsLeft = targetRightEdge + flyout.outerWidth() / 2 + options.margin < containerRightEdge;
        left = pos.left + targetSize.width / 2;
        var arrowLeft = left;
        var flyoutArrow = flyout.find('.flyout-arrow');
        if (containerRightEdge - flyout.outerWidth() < left) {
          left = containerRightEdge - flyout.outerWidth();
        }
        if (!orientationIsLeft) {
          // MAGIC NUMBER: 2px for border
          arrowLeft -= flyoutArrow.outerWidth(true) + 2;
        }
        flyoutArrow.addClass(orientationIsLeft ? 'left' : 'right').
          css('left', arrowLeft - left);
      }
    }
    flyout.offset({ top: top, left: left });
    getVal(options.onOpen);
    inFlyout = false;
    inTarget = true;
    flyout.on('mouseover, mouseenter', function(e) {
      inFlyout = true;
    }).bind('mouseleave', function(e) {
      if (!$(e.target).parents().hasClass('dragged')) {
        if(!options.debugNeverClosePopups) {
          closeFlyout();
        }
      }
    });
  };
  var closeFlyout = function() {
    if (flyout) {
      if (_.isFunction(options.onClose)) {
        options.onClose();
      }
      flyout.remove();
    } else {
      console.warn('Attempted to close nonexistent flyout.');
    }
  };

  // This was added by Tristan Rice in a commit that made some passing
  // reference to timeline chart bug. Not sure what it is and I don't
  // see any problem with it despite the fact that the flyout.is(':visible')
  // call is horribly unperformant, so I'm commenting this out at the moment.
  // --Chris Laidlaw, 9/9/14
  //
  //$(window).scroll(function(e) {
  //  if ($.isPresent(flyout) && flyout.is(':visible') && ( inFlyout || inTarget )) {
  //    renderFlyout(flyout.data('target'));
  //  }
  //});

  // This was added to hopefully plug a memory leak when a flyout is created
  // multiple times in a render loop.
  self.undelegate(options.selector, 'mouseover');
  self.undelegate(options.selector, 'mouseleave');


  self.delegate(options.selector, 'mouseover', function(e) {
    if (!$(e.target).parents().hasClass('dragged')) {
      renderFlyout(this);
      e.stopPropagation();
    }
  }).delegate(options.selector, 'mouseleave', function(e) {
    if (!$(e.target).parents().hasClass('dragged')) {
      if(!options.debugNeverClosePopups){
        inTarget = false;
        if (options.interact) {
          _.defer(function() {
            if(!inFlyout && !inTarget) {
              closeFlyout();
            }
          });
        } else {
          closeFlyout();
        }
      }
      e.stopPropagation();
    }
  });

  var previousFlyout = $('.flyout');
  if (_.isPresent(previousFlyout)) {
    var target = previousFlyout.data('target');
    if ($(target).is(options.selector) && _.isPresent(self.find(target))) {
      renderFlyout(target);
    }
  }
  return this;
};

$.easing.socraticEase = function(t) {
  // Just a bunch of disparate functions manually determined and spliced together.
  // Approximates a particular bezier curve.
  // TODO: Magic numbers!
  if (t < 0.304659) {
    return Math.pow(3 * t, 4);
  } else if (t < 0.46) {
    return 0.89 - Math.pow(t - 1.182,8);
  } else {
    return 1 - 0.4 * Math.pow(1.25 * t - 1.25, 2);
  }
};
