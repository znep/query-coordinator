// Contains extensions to both jQuery as well as Javascript built-in types.

$.fn.dimensions = function() {
  return {width: this.width(), height: this.height() };
};

// Yields an RX observable sequence of this selection's dimensions.
$.fn.observeDimensions = function() {
  var self = this;
  var dimensionsSubject = new Rx.BehaviorSubject(self.dimensions());

  self.resize(function() {
    dimensionsSubject.onNext(self.dimensions());
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
  options = _.extend({
    direction: 'bottom',
    margin: 5,
    interact: false,
    arrowMargin: 10,
    inset: {
      horizontal: 4,
      vertical: 2
    }
  }, options);
  var self = this;
  var inflyout = false, intarget = false, flyout;
  var renderFlyout = function(target) {
    var $target = $(target);
    var parentElem = $(options.parent || $target);
    $('.flyout').remove();
    flyout = $('<div class="flyout"><div class="flyout-arrow"></div></div>');
    flyout.data('target', $target);
    var getVal = function(data) {
      if (_.isFunction(data)) {
        return data($target, self, options, flyout);
      } else {
        return data;
      }
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
    var container = $target.parent();
    while(container.css('overflow') == 'visible' && container[0] != document.body) {
      container = container.parent();
    }
    var containerRightEdge = window.innerWidth;
    var containerLeftEdge = 0;
    if (container[0] != document.body) {
      containerLeftEdge = container.offset().left;
      containerRightEdge = container.offset().left + container.outerWidth();
    }
    var direction = getVal(options.direction);
    var pos = $target.offset(), top, left;
    var targetLeftEdge = pos.left;
    // TODO: Fix SVG handling & zero width elements
    var targetRightEdge = pos.left + ($target.outerWidth() || $target[0].getBBox().width);
    var targetWidth = targetRightEdge - targetLeftEdge
    if (direction == 'horizontal') {
      if (targetRightEdge + flyout.outerWidth() + options.margin > containerRightEdge) {
        direction = 'left';
      } else {
        direction = 'right';
      }
    }
    flyout.addClass(direction);
    if (direction == "top") {
      top = pos.top - flyout.outerHeight() + options.inset.vertical;
      left = pos.left + targetWidth/2 - flyout.outerWidth()/2;
    } else if (direction == "bottom") {
      top = pos.top + $target.outerHeight() - options.inset.vertical;
      left = pos.left + targetWidth/2 - flyout.outerWidth()/2;
    } else if (direction == "right") {
      top = pos.top + $target.outerHeight()/2 - flyout.outerHeight()/2;
      left = pos.left + $target.outerWidth() - options.inset.horizontal;
    } else if (direction == "left") {
      top = pos.top + $target.outerHeight()/2 - flyout.outerHeight()/2;
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
    flyout.offset({ top: top, left: left });
    inflyout = false;
    intarget = true;
    flyout.on('mouseover, mouseenter', function(e) {
      inflyout = true;
    }).bind('mouseleave', function(e) {
      if(!options.debugNeverClosePopups) flyout.remove();
    });
  }
  $(window).scroll(function(e) {
    var $flyout = $('.flyout');
    if (!_.isEmpty($flyout) && ( inflyout || intarget )) {
      renderFlyout($flyout.data('target'));
    }
  });
  self.delegate(options.selector, 'mouseenter', function(e) {
    renderFlyout(e.currentTarget);
  }).delegate(options.selector, 'mouseleave', function(e) {
    if(!options.debugNeverClosePopups){
      intarget = false;
      _.defer(function() {
        if(!inflyout && !intarget) {
          flyout.remove();
        }
      });
    }
  });
  return this;
}
