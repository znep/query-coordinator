// Contains extensions to both jQuery as well as Javascript built-in types.

$.fn.dimensions = function() {
  return {width: this.width(), height: this.height() };
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

$.toHumaneNumber = function(val, precision) {
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
  return result == 0 ? 0 : result;
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
  dimensions = { width: $ruler.width(), height: $ruler.height() };
  $ruler.remove();

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

$.fn.flyout = function(options) {
  var defaults = {
    direction: 'bottom',
    margin: 0,
    interact: false,
    style: 'chart',
    arrowMargin: 0,
    inset: {
      horizontal: 4,
      vertical: 2
    }
  }
  if (options.style == 'table') {
    defaults.arrowMargin = 10;
    defaults.margin = 5;
  }
  options = _.extend(defaults, options);
  var self = this;
  var inflyout = false, intarget = false, flyout;
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
    }
    if (_.isUndefined(options.positionOn)) {
      var $positionOn = $target;
    } else {
      var $positionOn = $(getVal(options.positionOn));
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
    var containerRightEdge = window.innerWidth;
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
    if (!targetSize.width || !targetSize.height) {
      console.error("[$.fn.flyout] target has height: "+targetSize.height+", width: "+targetSize.width+". No flyout possible.");
    }
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
        var center = (targetLeftEdge + targetRightEdge)/2;
        var arrow_pos = center - left;
        if (arrow_pos <= options.arrowMargin) arrow_pos = options.arrowMargin;
        else if (arrow_pos >= flyout.outerWidth() - options.arrowMargin) arrow_pos = flyout.outerWidth() - options.arrowMargin;
        flyout.find('.flyout-arrow').css('left', arrow_pos);
      }
    } else if (options.style == 'chart') {
      if (direction == 'top') {
        top = pos.top - flyout.outerHeight() + options.inset.vertical -
          parseInt(flyout.find('.flyout-arrow').css('margin-top'));
        var orientationIsLeft = targetRightEdge + flyout.outerWidth() + options.margin < containerRightEdge;
        if (orientationIsLeft) {
          left = pos.left + targetSize.width/2;
        } else {
          left = pos.left + targetSize.width/2 - flyout.outerWidth();
        }
        flyout.find('.flyout-arrow').addClass(orientationIsLeft ? 'left' : 'right');
      }
    }
    flyout.offset({ top: top, left: left });
    inflyout = false;
    intarget = true;
    flyout.on('mouseover, mouseenter', function(e) {
      inflyout = true;
    }).bind('mouseleave', function(e) {
      if(!options.debugNeverClosePopups) flyout.remove();
    });
  };
  $(window).scroll(function(e) {
    var $flyout = $('.flyout');
    if (!_.isEmpty($flyout) && ( inflyout || intarget )) {
      renderFlyout($flyout.data('target'));
    }
  });
  self.delegate(options.selector, 'mouseenter', function(e) {
    renderFlyout(this);
  }).delegate(options.selector, 'mouseleave', function(e) {
    if(!options.debugNeverClosePopups){
      intarget = false;
      _.defer(function() {
        if(!inflyout && !intarget) {
          $('.flyout').remove();
        }
      });
    }
  });
  return this;
};

$.easing.socraticEase = function(t) {
  // Just a bunch of disparate functions manually determined and spliced together.
  // Approximates a particular bezier curve.
  if (t < 0.304659) {
    return Math.pow(3 * t, 4);
  } else if (t < 0.46) {
    return 0.89 - Math.pow(t - 1.182,8);
  } else {
    return 1 - 0.4 * Math.pow(1.25 * t - 1.25, 2);
  }
};
