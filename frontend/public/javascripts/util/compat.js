(function($) {
  // Add extra feature detection

  // border-radius, as seen on http://www.cssnewbie.com/test-for-border-radius-support/
  $.support.borderRadius = false;
  _.each(['BorderRadius', 'MozBorderRadius', 'WebkitBorderRadius', 'OBorderRadius', 'KhtmlBorderRadius'], function(p) {
    if (document.body.style[p] !== undefined) {
      $.support.borderRadius = true;
    }
  });

  // linear gradient, as seen on http://github.com/westonruter/css-gradients-via-canvas/blob/master/css-gradients-via-canvas.js
  $.support.linearGradient = false;
  var div = document.createElement('div');
  div.style.cssText = [
    'background-image:-webkit-gradient(linear, 0% 0%, 0% 100%, from(red), to(blue));',
    'background-image:-moz-linear-gradient(top left, bottom right, from(red), to(blue));', /*Firefox 3.6 Alpha*/
    'background-image:-moz-linear-gradient(left, red, blue);' /*Firefox 3.6*/
  ].join('');

  $.support.svg = window.SVGAngle ||
    document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#BasicStructure', '1.1');

  if (div.style.backgroundImage) {
    $.support.linearGradient = true;
  }

  // Add device detection
  $.device = $.device || {};

  var device = _.get($, 'ua.device.model', '').toLowerCase();
  $.device.ipad = device === 'ipad';
  $.device.iphone = _.includes(['ipod', 'iphone'], device);
  $.device.android = _.get($, 'ua.os.name', '').toLowerCase() === 'android';
  $.device.mobile = _.get($, 'ua.device.type', '').toLowerCase() === 'mobile';

  // prototype defs to delegate Array native functions to underscore for d3+ie8- benefit.
  // since underscore has already loaded and cached its native function refs, this is
  // okay. if util ever gets loaded before underscore, we're boned. but that doesn't seem
  // possible anyway.

  if (!_.isFunction(Array.prototype.map)) {
    Array.prototype.map = function(callback, thisArg) { // eslint-disable-line no-extend-native
      return _.map(thisArg || this, callback);
    };
  }
  if (!_.isFunction(Array.prototype.forEach)) {
    Array.prototype.forEach = function(callback, thisArg) { // eslint-disable-line no-extend-native
      return _.each(thisArg || this, callback);
    };
  }
  if (!_.isFunction(Array.prototype.every)) {
    Array.prototype.every = function(callback, thisArg) { // eslint-disable-line no-extend-native
      return _.all(thisArg || this, callback);
    };
  }

  // prototype defs to make CSSStyleDeclaration sane in ie8-
  if (typeof CSSStyleDeclaration !== 'undefined') {
    if (!_.isFunction(CSSStyleDeclaration.prototype.getProperty)) {
      CSSStyleDeclaration.prototype.getProperty = function(a) {
        return this.getAttribute(a);
      };
    }
    if (!_.isFunction(CSSStyleDeclaration.prototype.setProperty)) {
      CSSStyleDeclaration.prototype.setProperty = function(a, b) {
        return this.setAttribute(a, b);
      };
    }
    if (!_.isFunction(CSSStyleDeclaration.prototype.removeProperty)) {
      CSSStyleDeclaration.prototype.removeProperty = function(a) {
        return this.removeAttribute(a);
      };
    }
  } else {
    // ruh oh.
  }

  // support getComputedStyle in IE
  // from: http://snipplr.com/view/13523/
  if (!window.getComputedStyle) {
    window.getComputedStyle = function(el) {
      this.el = el;
      this.getPropertyValue = function(prop) {
        var re = /(\-([a-z]){1})/g;
        if (prop == 'float') prop = 'styleFloat';
        if (re.test(prop)) {
          prop = prop.replace(re, function() {
            return arguments[2].toUpperCase();
          });
        }
        return el.currentStyle[prop] ? el.currentStyle[prop] : null;
      };
      return this;
    };
  }

  // support Object.create in IE
  // from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
  if (!Object.create) {
    Object.create = (function() {
      var F = function() {};

      return function(o) {
        if (arguments.length != 1) {
          throw new Error('Object.create implementation only accepts one parameter.');
        }
        F.prototype = o;
        return new F();
      };
    })();
  }

})(jQuery);

$(function() {
  var browserName = _.get($, 'ua.browser.name', '').toLowerCase();

  $.browser.chrome = browserName === 'chrome';
  $.browser.safari = browserName === 'safari';
  $.browser.msie = browserName === 'ie';
  $.browser.edge = browserName === 'edge';
  $.browser.mozilla = browserName === 'firefox';
  $.browser.version = _.get($, 'ua.browser.version');
  $.browser.majorVersion = parseInt(_.get($, 'ua.browser.major'));

  // Infinite Exasperation?
  if ($.browser.msie) {
    // add version classes
    $('html').addClass('ie ie' + $.browser.majorVersion);

    // add button elems
    $('a.button').each(function() {
      $.tag({
        tagName: 'span',
        'class': 'left'
      }).prependTo($(this));
    });
  }

  // Apply feature detected classes if applicable
  if ($.support.borderRadius === false) {
    $('html').addClass('noBorderRadius');
  }
  if ($.support.linearGradient === false) {
    $('html').addClass('noLinearGradient');
  }
  if (($.support.borderRadius === false) && ($.support.linearGradient === false)) {
    $('html').addClass('noCss3');
  }
});