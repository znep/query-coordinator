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
  var self = this;
  if(!options.direction) options.direction = 'bottom';

  self.delegate(options.selector, 'mouseenter', function(e) {
    var $target = $(e.currentTarget);
    var parentElem = $(options.parent || $target);
    var flyout = $('<div class="flyout"><div class="flyout-arrow"></div></div>');
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
      var html = '<table class="flyout-table"><tbody>';
        _.each(getVal(options.table), function(parts) {
          html += '<tr>';
          _.each(parts, function(html) {
            html += '<td>{0}</td>'.format(html);
          });
          html += '</tr>';
        });
      html += '</tbody></table>';
      flyout.append(html);
    }
    if (options.html) {
      flyout.append(getVal(options.html));
    }

    if (flyout.text().length > 0) {
      parentElem.append(flyout);
    }
    var direction = getVal(options.direction);
    flyout.addClass(direction);
    var pos = $target.offset(), top, left;
    if (direction == "bottom") {
      top = pos.top - flyout.outerHeight() + 2;
      left = pos.left + $target.outerWidth()/2 - flyout.outerWidth()/2;
    } else if (direction == "left") {
      top = pos.top + $target.outerHeight()/2 - flyout.outerHeight()/2;
      left = pos.left + $target.outerWidth() - 4;
    } else if (direction == "right") {
      top = pos.top + $target.outerHeight()/2 - flyout.outerHeight()/2;
      left = pos.left - flyout.outerWidth() + 4;
    }
    flyout.offset({ top: top, left: left });
  }).delegate(options.selector, 'mouseleave', function(e) {
    var parentElem = $(options.parent || e.currentTarget);
    parentElem.find('.flyout').remove();
  });
  return this;
}
