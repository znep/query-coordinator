/*!
 * Socrata Styleguide v0.5.0
 * Copyright 2015-2016 Socrata, Inc.
 * Licensed under MIT
 */

(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["styleguide"] = factory();
	else
		root["styleguide"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  Dropdown: __webpack_require__(1),
	  FlannelFactory: __webpack_require__(2),
	  FlyoutFactory: __webpack_require__(3),
	  MenuFactory: __webpack_require__(4),
	  ModalFactory: __webpack_require__(5),
	  ToggleFactory: __webpack_require__(6),
	  TourFactory: __webpack_require__(7)
	};


/***/ },
/* 1 */
/***/ function(module, exports) {

	var Dropdown = module.exports = function(element) {
	  this.dd = element;
	  this.orientation = element.getAttribute('data-orientation') || 'bottom';
	  this.dd.classList.add('dropdown-orientation-' + this.orientation);

	  this.placeholder = this.dd.querySelector('span');
	  this.opts = Array.prototype.slice.call(this.dd.querySelectorAll('.dropdown-options > li'));
	  this.val = '';
	  this.index = -1;

	  this.initEvents();
	}

	Dropdown.prototype = {
	  initEvents: function() {
	    var obj = this;

	    obj.dd.addEventListener('click', function(event) {
	      event.stopPropagation();
	      obj.dd.classList.toggle('active');
	      return false;
	    });

	    obj.opts.forEach(function(opt) {
	      opt.addEventListener('click', function(event) {
	        event.preventDefault();

	        var node = opt;
	        var index = 0;

	        while ((node = node.previousElementSibling) !== null) {
	          index++;
	        }

	        obj.val = opt.textContent;
	        obj.index = index;

	        return false;
	      });
	    });
	  }
	}


/***/ },
/* 2 */
/***/ function(module, exports) {

	var FlannelFactory = module.exports = function(element) {
	  var padding = 10;
	  var hoverables = Array.prototype.slice.apply(document.querySelectorAll('[data-flannel]'));

	  hoverables.forEach(function(hoverable) {
	    var flannel = document.querySelector('#' + hoverable.getAttribute('data-flannel'));
	    var dismissals = Array.prototype.slice.apply(flannel.querySelectorAll('[data-flannel-dismiss]'));

	    dismissals.forEach(function(dismissal) {
	      dismissal.addEventListener('click', function() {
	        flannel.classList.add('flannel-hidden');
	        hoverable.classList.remove('active');
	      });
	    });

	    hoverable.addEventListener('click', function() {
	      flannel.classList.toggle('flannel-hidden');
	      var node = hoverable;
	      var left = 0;
	      var top = 0;

	      do {
	        left += node.offsetLeft;
	        top += node.offsetTop;
	      } while ((node = node.offsetParent) !== null);

	      left = left + hoverable.offsetWidth / 2;
	      top = top + hoverable.offsetHeight + padding;

	      flannel.style.left = left + 'px';
	      flannel.style.top = top + 'px';
	    });

	    document.body.addEventListener('click', function(event) {
	      debugger;
	    });
	  });
	}


/***/ },
/* 3 */
/***/ function(module, exports) {

	var FlyoutFactory = module.exports = function(element) {
	  var padding = 10;
	  var hoverables = Array.prototype.slice.apply(document.querySelectorAll('[data-flyout]'));

	  hoverables.forEach(function(hoverable) {
	    var flyout = document.querySelector('#' + hoverable.getAttribute('data-flyout'));

	    hoverable.addEventListener('mouseover', function() {
	      flyout.classList.remove('flyout-hidden');
	      var node = hoverable;
	      var left = 0;
	      var top = 0;

	      do {
	        left += node.offsetLeft;
	        top += node.offsetTop;
	      } while ((node = node.offsetParent) !== null);

	      left = left + hoverable.offsetWidth / 2;
	      top = top + hoverable.offsetHeight + padding;

	      flyout.style.left = left + 'px';
	      flyout.style.top = top + 'px';
	    });

	    hoverable.addEventListener('mouseout', function() {
	      flyout.classList.add('flyout-hidden');
	    });
	  });

	}


/***/ },
/* 4 */
/***/ function(module, exports) {

	var MenuFactory = module.exports = function(element) {
	  var menus = Array.prototype.slice.call(element.querySelectorAll('.menu'));
	  var toggles = Array.prototype.slice.call(element.querySelectorAll('[data-menu-toggle]'));

	  toggles.forEach(function(toggle) {
	    toggle.addEventListener('click', function() {
	      var menu = element.querySelector('#' + toggle.getAttribute('data-menu-toggle'));
	      menu.classList.toggle('active');
	    });
	  });

	  menus.forEach(function(menu) {
	    var dismissals = Array.prototype.slice.call(menu.querySelectorAll('[data-menu-dismiss]'));

	    dismissals.forEach(function(dismissal) {
	      dismissal.addEventListener('click', function() {
	        menu.classList.remove('active');
	        document.querySelector('[data-menu-toggle="' + menu.id + '"]').classList.remove('active');
	      });
	    });
	  });
	}


/***/ },
/* 5 */
/***/ function(module, exports) {

	var ModalFactory = module.exports = function(element) {
	  this.root = element;
	  this.dismissals = Array.prototype.slice.apply(element.querySelectorAll('[data-modal-dismiss]'));
	  this.openers = Array.prototype.slice.apply(element.querySelectorAll('[data-modal]'));
	  this.attachEvents();
	}

	ModalFactory.prototype = {
	  attachEvents: function() {
	    this.dismissals.forEach(function (dismissal) {
	      dismissal.addEventListener('click', this.dismiss.bind(this));
	    }, this);

	    this.openers.forEach(function (opener) {
	      opener.addEventListener('click', this.open.bind(this));
	    }, this);

	    document.addEventListener('keyup', function(event) {
	      var key = event.which || event.keyCode;

	      // ESC
	      if (key === 27) {
	        var modals = Array.prototype.slice.call(document.querySelectorAll('.modal:not(.modal-hidden)'));
	        modals.forEach(function(modal) {
	          modal.classList.add('modal-hidden');
	        });
	      }
	    });
	  },
	  open: function(event) {
	    var modal = event.target.getAttribute('data-modal');
	    modal = this.root.querySelector('#' + modal);
	    modal.classList.remove('modal-hidden');
	  },
	  dismiss: function(event) {
	    var target = event.target;
	    var closeable = target === event.currentTarget &&
	      target.classList.contains('modal-overlay');

	    do {
	      if (target.hasAttribute('data-modal-dismiss') &&
	          !target.classList.contains('modal')) {
	        closeable = true;
	      } else if (target.classList.contains('modal') && closeable) {
	        return target.classList.add('modal-hidden');
	      } else if (target.classList.contains('modal')){
	        return;
	      }
	    } while((target = target.parentNode) !== this.root);
	  }
	};


/***/ },
/* 6 */
/***/ function(module, exports) {

	var ToggleFactory = module.exports = function(element) {
	  var toggles = Array.prototype.slice.apply(element.querySelectorAll('[data-toggle]'));
	  this.element = element;

	  toggles.forEach(function(toggle) {
	    toggle.addEventListener('click', this.toggle.bind(this));
	  }, this);
	}

	ToggleFactory.prototype = {
	  toggle: function(event) {
	    var target = event.target;

	    do {
	      if (target.hasAttribute('data-toggle')) {
	        return target.classList.toggle('active')
	      }
	    } while((target = target.parentNode) !== this.element)
	  }
	}


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var Shepherd = __webpack_require__(8);

	// CustomEvent polyfill for IE10/11 (from frontend-utils)
	var CustomEvent = function(eventName, params) {
	  var eventParams = { bubbles: false, cancelable: false, detail: undefined };

	  for (var key in params) {
	    if (params.hasOwnProperty(key)) {
	      eventParams[key] = params[key];
	    }
	  }

	  var customEvent = document.createEvent('CustomEvent');

	  customEvent.initCustomEvent(
	    eventName,
	    eventParams.bubbles,
	    eventParams.cancelable,
	    eventParams.detail
	  );

	  return customEvent;
	};

	var TourFactory = module.exports = function(element) {
	  this.root = element;
	  this.tourElements = Array.prototype.slice.apply(element.querySelectorAll('[data-tour]'));

	  if (this.tourElements.length > 0) {
	    this.tours = {};
	    this.currentTourName = null;

	    this.openers = Array.prototype.slice.apply(element.querySelectorAll('[data-tour-opener]'));

	    var tourOverlayElement = document.createElement('div');
	    tourOverlayElement.classList.add('tour-overlay', 'overlay-hidden');
	    this.tourOverlay = element.body.appendChild(tourOverlayElement);

	    this.initialize();

	    // Open all tours without openers immediately
	    if (this.openers.length < this.tourElements.length) {
	      var that = this;
	      var openerNames = that.openers.map(function(opener) { return opener.getAttribute('data-tour-opener'); });

	      that.tourElements.forEach(function(tourElement) {
	        var tourName = tourElement.getAttribute('data-tour-name');
	        if (!openerNames.includes(tourName)) {
	          that.openTour(tourName);
	        }
	      });
	    }
	  }
	}

	TourFactory.prototype = {
	  initialize: function() {
	    var that = this;

	    that.tourElements.forEach(function(tourElement) {
	      that.initializeTour(tourElement);
	    });

	    that.attachEvents();
	  },
	  initializeTour: function(tourElement) {
	    var that = this;
	    var tourName = tourElement.getAttribute('data-tour-name');

	    var tour = new Shepherd.Tour({
	      defaults: {
	        showCancelLink: true,
	        buttons: [
	          {
	            text: tourElement.getAttribute('data-tour-skip'),
	            classes: 'btn-default',
	            action: function() {
	              that.closeTour(tourName);
	            }
	          },
	          {
	            text: tourElement.getAttribute('data-tour-next'),
	            classes: 'btn-primary',
	            action: function() {
	              that.clickNext(tourName);
	            }
	          }
	        ]
	      }
	    });

	    that.tours[tourName] = {
	      tour: tour,
	      name: tourName
	    };
	    that.addSteps(tour, tourElement);
	  },
	  addSteps: function(tour, tourElement) {
	    var that = this;

	    var steps = Array.prototype.slice.apply(tourElement.querySelectorAll('[data-tour-step]'));
	    var sortedSteps = steps.sort(function(a, b) {
	      var stepA = parseInt(a.getAttribute('data-step-number'));
	      var stepB = parseInt(b.getAttribute('data-step-number'));

	      if (stepA > stepB) {
	        return 1;
	      } else if (stepA < stepB) {
	        return -1;
	      } else {
	        return 0;
	      }
	    });

	    sortedSteps.forEach(function(step, index) {
	      var stepConfig = {
	        title: step.getAttribute('data-title') || '',
	        text: step.innerHTML,
	      };

	      var classes = step.getAttribute('data-classes') || '';

	      var attachToElement = step.getAttribute('data-attach-to-element');
	      var attachToPosition = step.getAttribute('data-attach-to-position');
	      var positionOffset = {
	        left: '0 25px',
	        right: '0 -25px',
	        top: '25px 0',
	        bottom: '-25px 0'
	      }[attachToPosition];

	      if (classes) {
	        stepConfig.classes = classes.split(' ');
	      }

	      if (attachToElement && attachToPosition && positionOffset) {
	        stepConfig.attachTo = {
	          element: attachToElement,
	          on: attachToPosition
	        };

	        stepConfig.tetherOptions = {
	          offset: positionOffset
	        }
	      }

	      if (sortedSteps.length - 1 === index) {
	        stepConfig.buttons = [
	          {
	            text: tourElement.getAttribute('data-tour-done'),
	            classes: 'btn-primary',
	            action: tour.complete
	          }
	        ];
	      }

	      tour.addStep(stepConfig);

	      tour.on('active', function() {
	        that.tourOverlay.classList.remove('overlay-hidden');
	      });

	      tour.on('inactive', function() {
	        that.tourOverlay.classList.add('overlay-hidden');
	      });
	    });
	  },
	  attachEvents: function() {
	    var that = this;

	    that.openers.forEach(function (opener) {
	      opener.addEventListener('click', that.openTour.bind(that, opener.getAttribute('data-tour-opener')));
	    }, that);

	    document.addEventListener('keyup', function(event) {
	      var key = event.which || event.keyCode;

	      // ESC
	      if (key === 27) {
	        that.closeTour(that.currentTourName);
	      }
	    });

	    that.tourOverlay.addEventListener('click', function() {
	      that.closeTour(that.currentTourName);
	    });
	  },
	  openTour: function(tourName) {
	    var tourObject = this.tours[tourName];
	    this.currentTourName = tourObject.name;

	    tourObject.tour.start();
	    this.tourOverlay.classList.remove('tour-overlay-hidden');
	  },
	  clickNext: function(tourName) {
	    var tourObject = this.tours[tourName];
	    var payload = {
	      currentStep: tourObject.tour.getCurrentStep().id.replace('step-', ''),
	      tourName: tourObject.name
	    };

	    document.dispatchEvent(new CustomEvent('next', { 'detail': payload }));
	    tourObject.tour.next();
	  },
	  closeTour: function(tourName) {
	    var tourObject = this.tours[tourName];
	    var payload = {
	      currentStep: tourObject.tour.getCurrentStep().id.replace('step-', ''),
	      tourName: tourObject.name
	    };

	    document.dispatchEvent(new CustomEvent('cancel', { 'detail': payload }));
	    tourObject.tour.cancel();
	  }
	};


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*! tether-shepherd 1.2.0 */

	(function(root, factory) {
	  if (true) {
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(9)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else if (typeof exports === 'object') {
	    module.exports = factory(require('tether'));
	  } else {
	    root.Shepherd = factory(root.Tether);
	  }
	}(this, function(Tether) {

	/* global Tether */

	'use strict';

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	var _get = function get(_x5, _x6, _x7) { var _again = true; _function: while (_again) { var object = _x5, property = _x6, receiver = _x7; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x5 = parent; _x6 = property; _x7 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var _Tether$Utils = Tether.Utils;
	var Evented = _Tether$Utils.Evented;
	var addClass = _Tether$Utils.addClass;
	var extend = _Tether$Utils.extend;
	var hasClass = _Tether$Utils.hasClass;
	var removeClass = _Tether$Utils.removeClass;
	var uniqueId = _Tether$Utils.uniqueId;

	var Shepherd = new Evented();

	var ATTACHMENT = {
	  'top': 'bottom center',
	  'left': 'middle right',
	  'right': 'middle left',
	  'bottom': 'top center',
	  'center': 'middle center'
	};

	function createFromHTML(html) {
	  var el = document.createElement('div');
	  el.innerHTML = html;
	  return el.children[0];
	}

	function matchesSelector(el, sel) {
	  var matches = undefined;
	  if (typeof el.matches !== 'undefined') {
	    matches = el.matches;
	  } else if (typeof el.matchesSelector !== 'undefined') {
	    matches = el.matchesSelector;
	  } else if (typeof el.msMatchesSelector !== 'undefined') {
	    matches = el.msMatchesSelector;
	  } else if (typeof el.webkitMatchesSelector !== 'undefined') {
	    matches = el.webkitMatchesSelector;
	  } else if (typeof el.mozMatchesSelector !== 'undefined') {
	    matches = el.mozMatchesSelector;
	  } else if (typeof el.oMatchesSelector !== 'undefined') {
	    matches = el.oMatchesSelector;
	  }
	  return matches.call(el, sel);
	}

	function parseShorthand(obj, props) {
	  if (obj === null || typeof obj === 'undefined') {
	    return obj;
	  } else if (typeof obj === 'object') {
	    return obj;
	  }

	  var vals = obj.split(' ');
	  var valsLen = vals.length;
	  var propsLen = props.length;
	  if (valsLen > propsLen) {
	    vals[0] = vals.slice(0, valsLen - propsLen + 1).join(' ');
	    vals.splice(1, (valsLen, propsLen));
	  }

	  var out = {};
	  for (var i = 0; i < propsLen; ++i) {
	    var prop = props[i];
	    out[prop] = vals[i];
	  }

	  return out;
	}

	var Step = (function (_Evented) {
	  _inherits(Step, _Evented);

	  function Step(tour, options) {
	    _classCallCheck(this, Step);

	    _get(Object.getPrototypeOf(Step.prototype), 'constructor', this).call(this, tour, options);
	    this.tour = tour;
	    this.bindMethods();
	    this.setOptions(options);
	    return this;
	  }

	  _createClass(Step, [{
	    key: 'bindMethods',
	    value: function bindMethods() {
	      var _this = this;

	      var methods = ['_show', 'show', 'hide', 'isOpen', 'cancel', 'complete', 'scrollTo', 'destroy'];
	      methods.map(function (method) {
	        _this[method] = _this[method].bind(_this);
	      });
	    }
	  }, {
	    key: 'setOptions',
	    value: function setOptions() {
	      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	      this.options = options;
	      this.destroy();

	      this.id = this.options.id || this.id || 'step-' + uniqueId();

	      var when = this.options.when;
	      if (when) {
	        for (var _event in when) {
	          if (({}).hasOwnProperty.call(when, _event)) {
	            var handler = when[_event];
	            this.on(_event, handler, this);
	          }
	        }
	      }

	      if (!this.options.buttons) {
	        this.options.buttons = [{
	          text: 'Next',
	          action: this.tour.next
	        }];
	      }
	    }
	  }, {
	    key: 'getTour',
	    value: function getTour() {
	      return this.tour;
	    }
	  }, {
	    key: 'bindAdvance',
	    value: function bindAdvance() {
	      var _this2 = this;

	      // An empty selector matches the step element

	      var _parseShorthand = parseShorthand(this.options.advanceOn, ['selector', 'event']);

	      var event = _parseShorthand.event;
	      var selector = _parseShorthand.selector;

	      var handler = function handler(e) {
	        if (!_this2.isOpen()) {
	          return;
	        }

	        if (typeof selector !== 'undefined') {
	          if (matchesSelector(e.target, selector)) {
	            _this2.tour.next();
	          }
	        } else {
	          if (_this2.el && e.target === _this2.el) {
	            _this2.tour.next();
	          }
	        }
	      };

	      // TODO: this should also bind/unbind on show/hide
	      document.body.addEventListener(event, handler);
	      this.on('destroy', function () {
	        return document.body.removeEventListener(event, handler);
	      });
	    }
	  }, {
	    key: 'getAttachTo',
	    value: function getAttachTo() {
	      var opts = parseShorthand(this.options.attachTo, ['element', 'on']) || {};
	      var selector = opts.element;

	      if (typeof selector === 'string') {
	        opts.element = document.querySelector(selector);

	        if (!opts.element) {
	          throw new Error('The element for this Shepherd step was not found ' + selector);
	        }
	      }

	      return opts;
	    }
	  }, {
	    key: 'setupTether',
	    value: function setupTether() {
	      if (typeof Tether === 'undefined') {
	        throw new Error("Using the attachment feature of Shepherd requires the Tether library");
	      }

	      var opts = this.getAttachTo();
	      var attachment = ATTACHMENT[opts.on || 'right'];
	      if (typeof opts.element === 'undefined') {
	        opts.element = 'viewport';
	        attachment = 'middle center';
	      }

	      var tetherOpts = {
	        classPrefix: 'shepherd',
	        element: this.el,
	        constraints: [{
	          to: 'window',
	          pin: true,
	          attachment: 'together'
	        }],
	        target: opts.element,
	        offset: opts.offset || '0 0',
	        attachment: attachment
	      };

	      if (this.tether) {
	        this.tether.destroy();
	      }

	      this.tether = new Tether(extend(tetherOpts, this.options.tetherOptions));
	    }
	  }, {
	    key: 'show',
	    value: function show() {
	      var _this3 = this;

	      if (typeof this.options.beforeShowPromise !== 'undefined') {
	        var beforeShowPromise = this.options.beforeShowPromise();
	        if (typeof beforeShowPromise !== 'undefined') {
	          return beforeShowPromise.then(function () {
	            return _this3._show();
	          });
	        }
	      }
	      this._show();
	    }
	  }, {
	    key: '_show',
	    value: function _show() {
	      var _this4 = this;

	      this.trigger('before-show');

	      if (!this.el) {
	        this.render();
	      }

	      addClass(this.el, 'shepherd-open');

	      document.body.setAttribute('data-shepherd-step', this.id);

	      this.setupTether();

	      if (this.options.scrollTo) {
	        setTimeout(function () {
	          _this4.scrollTo();
	        });
	      }

	      this.trigger('show');
	    }
	  }, {
	    key: 'hide',
	    value: function hide() {
	      this.trigger('before-hide');

	      removeClass(this.el, 'shepherd-open');

	      document.body.removeAttribute('data-shepherd-step');

	      if (this.tether) {
	        this.tether.destroy();
	      }
	      this.tether = null;

	      this.trigger('hide');
	    }
	  }, {
	    key: 'isOpen',
	    value: function isOpen() {
	      return hasClass(this.el, 'shepherd-open');
	    }
	  }, {
	    key: 'cancel',
	    value: function cancel() {
	      this.tour.cancel();
	      this.trigger('cancel');
	    }
	  }, {
	    key: 'complete',
	    value: function complete() {
	      this.tour.complete();
	      this.trigger('complete');
	    }
	  }, {
	    key: 'scrollTo',
	    value: function scrollTo() {
	      var _getAttachTo = this.getAttachTo();

	      var element = _getAttachTo.element;

	      if (typeof this.options.scrollToHandler !== 'undefined') {
	        this.options.scrollToHandler(element);
	      } else if (typeof element !== 'undefined') {
	        element.scrollIntoView();
	      }
	    }
	  }, {
	    key: 'destroy',
	    value: function destroy() {
	      if (typeof this.el !== 'undefined') {
	        document.body.removeChild(this.el);
	        delete this.el;
	      }

	      if (this.tether) {
	        this.tether.destroy();
	      }
	      this.tether = null;

	      this.trigger('destroy');
	    }
	  }, {
	    key: 'render',
	    value: function render() {
	      var _this5 = this;

	      if (typeof this.el !== 'undefined') {
	        this.destroy();
	      }

	      this.el = createFromHTML('<div class=\'shepherd-step ' + (this.options.classes || '') + '\' data-id=\'' + this.id + '\' ' + (this.options.idAttribute ? 'id="' + this.options.idAttribute + '"' : '') + '></div>');

	      var content = document.createElement('div');
	      content.className = 'shepherd-content';
	      this.el.appendChild(content);

	      var header = document.createElement('header');
	      content.appendChild(header);

	      if (typeof this.options.title !== 'undefined') {
	        header.innerHTML += '<h3 class=\'shepherd-title\'>' + this.options.title + '</h3>';
	        this.el.className += ' shepherd-has-title';
	      }

	      if (this.options.showCancelLink) {
	        var link = createFromHTML("<a href class='shepherd-cancel-link'>✕</a>");
	        header.appendChild(link);

	        this.el.className += ' shepherd-has-cancel-link';

	        this.bindCancelLink(link);
	      }

	      if (typeof this.options.text !== 'undefined') {
	        (function () {
	          var text = createFromHTML("<div class='shepherd-text'></div>");
	          var paragraphs = _this5.options.text;

	          if (typeof paragraphs === 'function') {
	            paragraphs = paragraphs.call(_this5, text);
	          }

	          if (paragraphs instanceof HTMLElement) {
	            text.appendChild(paragraphs);
	          } else {
	            if (typeof paragraphs === 'string') {
	              paragraphs = [paragraphs];
	            }

	            paragraphs.map(function (paragraph) {
	              text.innerHTML += '<p>' + paragraph + '</p>';
	            });
	          }

	          content.appendChild(text);
	        })();
	      }

	      var footer = document.createElement('footer');

	      if (this.options.buttons) {
	        (function () {
	          var buttons = createFromHTML("<ul class='shepherd-buttons'></ul>");

	          _this5.options.buttons.map(function (cfg) {
	            var button = createFromHTML('<li><a class=\'shepherd-button ' + (cfg.classes || '') + '\'>' + cfg.text + '</a>');
	            buttons.appendChild(button);
	            _this5.bindButtonEvents(cfg, button.querySelector('a'));
	          });

	          footer.appendChild(buttons);
	        })();
	      }

	      content.appendChild(footer);

	      document.body.appendChild(this.el);

	      this.setupTether();

	      if (this.options.advanceOn) {
	        this.bindAdvance();
	      }
	    }
	  }, {
	    key: 'bindCancelLink',
	    value: function bindCancelLink(link) {
	      var _this6 = this;

	      link.addEventListener('click', function (e) {
	        e.preventDefault();
	        _this6.cancel();
	      });
	    }
	  }, {
	    key: 'bindButtonEvents',
	    value: function bindButtonEvents(cfg, el) {
	      var _this7 = this;

	      cfg.events = cfg.events || {};
	      if (typeof cfg.action !== 'undefined') {
	        // Including both a click event and an action is not supported
	        cfg.events.click = cfg.action;
	      }

	      for (var _event2 in cfg.events) {
	        if (({}).hasOwnProperty.call(cfg.events, _event2)) {
	          var handler = cfg.events[_event2];
	          if (typeof handler === 'string') {
	            (function () {
	              var page = handler;
	              handler = function () {
	                return _this7.tour.show(page);
	              };
	            })();
	          }
	          el.addEventListener(_event2, handler);
	        }
	      }

	      this.on('destroy', function () {
	        for (var _event3 in cfg.events) {
	          if (({}).hasOwnProperty.call(cfg.events, _event3)) {
	            var handler = cfg.events[_event3];
	            el.removeEventListener(_event3, handler);
	          }
	        }
	      });
	    }
	  }]);

	  return Step;
	})(Evented);

	var Tour = (function (_Evented2) {
	  _inherits(Tour, _Evented2);

	  function Tour() {
	    var _this8 = this;

	    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	    _classCallCheck(this, Tour);

	    _get(Object.getPrototypeOf(Tour.prototype), 'constructor', this).call(this, options);
	    this.bindMethods();
	    this.options = options;
	    this.steps = this.options.steps || [];

	    // Pass these events onto the global Shepherd object
	    var events = ['complete', 'cancel', 'hide', 'start', 'show', 'active', 'inactive'];
	    events.map(function (event) {
	      (function (e) {
	        _this8.on(e, function (opts) {
	          opts = opts || {};
	          opts.tour = _this8;
	          Shepherd.trigger(e, opts);
	        });
	      })(event);
	    });

	    return this;
	  }

	  _createClass(Tour, [{
	    key: 'bindMethods',
	    value: function bindMethods() {
	      var _this9 = this;

	      var methods = ['next', 'back', 'cancel', 'complete', 'hide'];
	      methods.map(function (method) {
	        _this9[method] = _this9[method].bind(_this9);
	      });
	    }
	  }, {
	    key: 'addStep',
	    value: function addStep(name, step) {
	      if (typeof step === 'undefined') {
	        step = name;
	      }

	      if (!(step instanceof Step)) {
	        if (typeof name === 'string' || typeof name === 'number') {
	          step.id = name.toString();
	        }
	        step = extend({}, this.options.defaults, step);
	        step = new Step(this, step);
	      } else {
	        step.tour = this;
	      }

	      this.steps.push(step);
	      return this;
	    }
	  }, {
	    key: 'getById',
	    value: function getById(id) {
	      for (var i = 0; i < this.steps.length; ++i) {
	        var step = this.steps[i];
	        if (step.id === id) {
	          return step;
	        }
	      }
	    }
	  }, {
	    key: 'getCurrentStep',
	    value: function getCurrentStep() {
	      return this.currentStep;
	    }
	  }, {
	    key: 'next',
	    value: function next() {
	      var index = this.steps.indexOf(this.currentStep);

	      if (index === this.steps.length - 1) {
	        this.hide(index);
	        this.trigger('complete');
	        this.done();
	      } else {
	        this.show(index + 1, true);
	      }
	    }
	  }, {
	    key: 'back',
	    value: function back() {
	      var index = this.steps.indexOf(this.currentStep);
	      this.show(index - 1, false);
	    }
	  }, {
	    key: 'cancel',
	    value: function cancel() {
	      if (typeof this.currentStep !== 'undefined') {
	        this.currentStep.hide();
	      }
	      this.trigger('cancel');
	      this.done();
	    }
	  }, {
	    key: 'complete',
	    value: function complete() {
	      if (typeof this.currentStep !== 'undefined') {
	        this.currentStep.hide();
	      }
	      this.trigger('complete');
	      this.done();
	    }
	  }, {
	    key: 'hide',
	    value: function hide() {
	      if (typeof this.currentStep !== 'undefined') {
	        this.currentStep.hide();
	      }
	      this.trigger('hide');
	      this.done();
	    }
	  }, {
	    key: 'done',
	    value: function done() {
	      Shepherd.activeTour = null;
	      removeClass(document.body, 'shepherd-active');
	      this.trigger('inactive', { tour: this });
	    }
	  }, {
	    key: 'show',
	    value: function show() {
	      var key = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
	      var forward = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

	      if (this.currentStep) {
	        this.currentStep.hide();
	      } else {
	        addClass(document.body, 'shepherd-active');
	        this.trigger('active', { tour: this });
	      }

	      Shepherd.activeTour = this;

	      var next = undefined;

	      if (typeof key === 'string') {
	        next = this.getById(key);
	      } else {
	        next = this.steps[key];
	      }

	      if (next) {
	        if (typeof next.options.showOn !== 'undefined' && !next.options.showOn()) {
	          var index = this.steps.indexOf(next);
	          var nextIndex = forward ? index + 1 : index - 1;
	          this.show(nextIndex, forward);
	        } else {
	          this.trigger('show', {
	            step: next,
	            previous: this.currentStep
	          });

	          this.currentStep = next;
	          next.show();
	        }
	      }
	    }
	  }, {
	    key: 'start',
	    value: function start() {
	      this.trigger('start');

	      this.currentStep = null;
	      this.next();
	    }
	  }]);

	  return Tour;
	})(Evented);

	extend(Shepherd, { Tour: Tour, Step: Step, Evented: Evented });
	return Shepherd;

	}));


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;/*! tether 1.2.0 */

	(function(root, factory) {
	  if (true) {
	    !(__WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else if (typeof exports === 'object') {
	    module.exports = factory(require, exports, module);
	  } else {
	    root.Tether = factory();
	  }
	}(this, function(require, exports, module) {

	'use strict';

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	var TetherBase = undefined;
	if (typeof TetherBase === 'undefined') {
	  TetherBase = { modules: [] };
	}

	function getScrollParent(el) {
	  // In firefox if the el is inside an iframe with display: none; window.getComputedStyle() will return null;
	  // https://bugzilla.mozilla.org/show_bug.cgi?id=548397
	  var computedStyle = getComputedStyle(el) || {};
	  var position = computedStyle.position;

	  if (position === 'fixed') {
	    return el;
	  }

	  var parent = el;
	  while (parent = parent.parentNode) {
	    var style = undefined;
	    try {
	      style = getComputedStyle(parent);
	    } catch (err) {}

	    if (typeof style === 'undefined' || style === null) {
	      return parent;
	    }

	    var _style = style;
	    var overflow = _style.overflow;
	    var overflowX = _style.overflowX;
	    var overflowY = _style.overflowY;

	    if (/(auto|scroll)/.test(overflow + overflowY + overflowX)) {
	      if (position !== 'absolute' || ['relative', 'absolute', 'fixed'].indexOf(style.position) >= 0) {
	        return parent;
	      }
	    }
	  }

	  return document.body;
	}

	var uniqueId = (function () {
	  var id = 0;
	  return function () {
	    return ++id;
	  };
	})();

	var zeroPosCache = {};
	var getOrigin = function getOrigin(doc) {
	  // getBoundingClientRect is unfortunately too accurate.  It introduces a pixel or two of
	  // jitter as the user scrolls that messes with our ability to detect if two positions
	  // are equivilant or not.  We place an element at the top left of the page that will
	  // get the same jitter, so we can cancel the two out.
	  var node = doc._tetherZeroElement;
	  if (typeof node === 'undefined') {
	    node = doc.createElement('div');
	    node.setAttribute('data-tether-id', uniqueId());
	    extend(node.style, {
	      top: 0,
	      left: 0,
	      position: 'absolute'
	    });

	    doc.body.appendChild(node);

	    doc._tetherZeroElement = node;
	  }

	  var id = node.getAttribute('data-tether-id');
	  if (typeof zeroPosCache[id] === 'undefined') {
	    zeroPosCache[id] = {};

	    var rect = node.getBoundingClientRect();
	    for (var k in rect) {
	      // Can't use extend, as on IE9, elements don't resolve to be hasOwnProperty
	      zeroPosCache[id][k] = rect[k];
	    }

	    // Clear the cache when this position call is done
	    defer(function () {
	      delete zeroPosCache[id];
	    });
	  }

	  return zeroPosCache[id];
	};

	function getBounds(el) {
	  var doc = undefined;
	  if (el === document) {
	    doc = document;
	    el = document.documentElement;
	  } else {
	    doc = el.ownerDocument;
	  }

	  var docEl = doc.documentElement;

	  var box = {};
	  // The original object returned by getBoundingClientRect is immutable, so we clone it
	  // We can't use extend because the properties are not considered part of the object by hasOwnProperty in IE9
	  var rect = el.getBoundingClientRect();
	  for (var k in rect) {
	    box[k] = rect[k];
	  }

	  var origin = getOrigin(doc);

	  box.top -= origin.top;
	  box.left -= origin.left;

	  if (typeof box.width === 'undefined') {
	    box.width = document.body.scrollWidth - box.left - box.right;
	  }
	  if (typeof box.height === 'undefined') {
	    box.height = document.body.scrollHeight - box.top - box.bottom;
	  }

	  box.top = box.top - docEl.clientTop;
	  box.left = box.left - docEl.clientLeft;
	  box.right = doc.body.clientWidth - box.width - box.left;
	  box.bottom = doc.body.clientHeight - box.height - box.top;

	  return box;
	}

	function getOffsetParent(el) {
	  return el.offsetParent || document.documentElement;
	}

	function getScrollBarSize() {
	  var inner = document.createElement('div');
	  inner.style.width = '100%';
	  inner.style.height = '200px';

	  var outer = document.createElement('div');
	  extend(outer.style, {
	    position: 'absolute',
	    top: 0,
	    left: 0,
	    pointerEvents: 'none',
	    visibility: 'hidden',
	    width: '200px',
	    height: '150px',
	    overflow: 'hidden'
	  });

	  outer.appendChild(inner);

	  document.body.appendChild(outer);

	  var widthContained = inner.offsetWidth;
	  outer.style.overflow = 'scroll';
	  var widthScroll = inner.offsetWidth;

	  if (widthContained === widthScroll) {
	    widthScroll = outer.clientWidth;
	  }

	  document.body.removeChild(outer);

	  var width = widthContained - widthScroll;

	  return { width: width, height: width };
	}

	function extend() {
	  var out = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	  var args = [];

	  Array.prototype.push.apply(args, arguments);

	  args.slice(1).forEach(function (obj) {
	    if (obj) {
	      for (var key in obj) {
	        if (({}).hasOwnProperty.call(obj, key)) {
	          out[key] = obj[key];
	        }
	      }
	    }
	  });

	  return out;
	}

	function removeClass(el, name) {
	  if (typeof el.classList !== 'undefined') {
	    name.split(' ').forEach(function (cls) {
	      if (cls.trim()) {
	        el.classList.remove(cls);
	      }
	    });
	  } else {
	    var regex = new RegExp('(^| )' + name.split(' ').join('|') + '( |$)', 'gi');
	    var className = getClassName(el).replace(regex, ' ');
	    setClassName(el, className);
	  }
	}

	function addClass(el, name) {
	  if (typeof el.classList !== 'undefined') {
	    name.split(' ').forEach(function (cls) {
	      if (cls.trim()) {
	        el.classList.add(cls);
	      }
	    });
	  } else {
	    removeClass(el, name);
	    var cls = getClassName(el) + (' ' + name);
	    setClassName(el, cls);
	  }
	}

	function hasClass(el, name) {
	  if (typeof el.classList !== 'undefined') {
	    return el.classList.contains(name);
	  }
	  var className = getClassName(el);
	  return new RegExp('(^| )' + name + '( |$)', 'gi').test(className);
	}

	function getClassName(el) {
	  if (el.className instanceof SVGAnimatedString) {
	    return el.className.baseVal;
	  }
	  return el.className;
	}

	function setClassName(el, className) {
	  el.setAttribute('class', className);
	}

	function updateClasses(el, add, all) {
	  // Of the set of 'all' classes, we need the 'add' classes, and only the
	  // 'add' classes to be set.
	  all.forEach(function (cls) {
	    if (add.indexOf(cls) === -1 && hasClass(el, cls)) {
	      removeClass(el, cls);
	    }
	  });

	  add.forEach(function (cls) {
	    if (!hasClass(el, cls)) {
	      addClass(el, cls);
	    }
	  });
	}

	var deferred = [];

	var defer = function defer(fn) {
	  deferred.push(fn);
	};

	var flush = function flush() {
	  var fn = undefined;
	  while (fn = deferred.pop()) {
	    fn();
	  }
	};

	var Evented = (function () {
	  function Evented() {
	    _classCallCheck(this, Evented);
	  }

	  _createClass(Evented, [{
	    key: 'on',
	    value: function on(event, handler, ctx) {
	      var once = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

	      if (typeof this.bindings === 'undefined') {
	        this.bindings = {};
	      }
	      if (typeof this.bindings[event] === 'undefined') {
	        this.bindings[event] = [];
	      }
	      this.bindings[event].push({ handler: handler, ctx: ctx, once: once });
	    }
	  }, {
	    key: 'once',
	    value: function once(event, handler, ctx) {
	      this.on(event, handler, ctx, true);
	    }
	  }, {
	    key: 'off',
	    value: function off(event, handler) {
	      if (typeof this.bindings !== 'undefined' && typeof this.bindings[event] !== 'undefined') {
	        return;
	      }

	      if (typeof handler === 'undefined') {
	        delete this.bindings[event];
	      } else {
	        var i = 0;
	        while (i < this.bindings[event].length) {
	          if (this.bindings[event][i].handler === handler) {
	            this.bindings[event].splice(i, 1);
	          } else {
	            ++i;
	          }
	        }
	      }
	    }
	  }, {
	    key: 'trigger',
	    value: function trigger(event) {
	      if (typeof this.bindings !== 'undefined' && this.bindings[event]) {
	        var i = 0;

	        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
	          args[_key - 1] = arguments[_key];
	        }

	        while (i < this.bindings[event].length) {
	          var _bindings$event$i = this.bindings[event][i];
	          var handler = _bindings$event$i.handler;
	          var ctx = _bindings$event$i.ctx;
	          var once = _bindings$event$i.once;

	          var context = ctx;
	          if (typeof context === 'undefined') {
	            context = this;
	          }

	          handler.apply(context, args);

	          if (once) {
	            this.bindings[event].splice(i, 1);
	          } else {
	            ++i;
	          }
	        }
	      }
	    }
	  }]);

	  return Evented;
	})();

	TetherBase.Utils = {
	  getScrollParent: getScrollParent,
	  getBounds: getBounds,
	  getOffsetParent: getOffsetParent,
	  extend: extend,
	  addClass: addClass,
	  removeClass: removeClass,
	  hasClass: hasClass,
	  updateClasses: updateClasses,
	  defer: defer,
	  flush: flush,
	  uniqueId: uniqueId,
	  Evented: Evented,
	  getScrollBarSize: getScrollBarSize
	};
	/* globals TetherBase, performance */

	'use strict';

	var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	if (typeof TetherBase === 'undefined') {
	  throw new Error('You must include the utils.js file before tether.js');
	}

	var _TetherBase$Utils = TetherBase.Utils;
	var getScrollParent = _TetherBase$Utils.getScrollParent;
	var getBounds = _TetherBase$Utils.getBounds;
	var getOffsetParent = _TetherBase$Utils.getOffsetParent;
	var extend = _TetherBase$Utils.extend;
	var addClass = _TetherBase$Utils.addClass;
	var removeClass = _TetherBase$Utils.removeClass;
	var updateClasses = _TetherBase$Utils.updateClasses;
	var defer = _TetherBase$Utils.defer;
	var flush = _TetherBase$Utils.flush;
	var getScrollBarSize = _TetherBase$Utils.getScrollBarSize;

	function within(a, b) {
	  var diff = arguments.length <= 2 || arguments[2] === undefined ? 1 : arguments[2];

	  return a + diff >= b && b >= a - diff;
	}

	var transformKey = (function () {
	  if (typeof document === 'undefined') {
	    return '';
	  }
	  var el = document.createElement('div');

	  var transforms = ['transform', 'webkitTransform', 'OTransform', 'MozTransform', 'msTransform'];
	  for (var i = 0; i < transforms.length; ++i) {
	    var key = transforms[i];
	    if (el.style[key] !== undefined) {
	      return key;
	    }
	  }
	})();

	var tethers = [];

	var position = function position() {
	  tethers.forEach(function (tether) {
	    tether.position(false);
	  });
	  flush();
	};

	function now() {
	  if (typeof performance !== 'undefined' && typeof performance.now !== 'undefined') {
	    return performance.now();
	  }
	  return +new Date();
	}

	(function () {
	  var lastCall = null;
	  var lastDuration = null;
	  var pendingTimeout = null;

	  var tick = function tick() {
	    if (typeof lastDuration !== 'undefined' && lastDuration > 16) {
	      // We voluntarily throttle ourselves if we can't manage 60fps
	      lastDuration = Math.min(lastDuration - 16, 250);

	      // Just in case this is the last event, remember to position just once more
	      pendingTimeout = setTimeout(tick, 250);
	      return;
	    }

	    if (typeof lastCall !== 'undefined' && now() - lastCall < 10) {
	      // Some browsers call events a little too frequently, refuse to run more than is reasonable
	      return;
	    }

	    if (typeof pendingTimeout !== 'undefined') {
	      clearTimeout(pendingTimeout);
	      pendingTimeout = null;
	    }

	    lastCall = now();
	    position();
	    lastDuration = now() - lastCall;
	  };

	  if (typeof window !== 'undefined') {
	    ['resize', 'scroll', 'touchmove'].forEach(function (event) {
	      window.addEventListener(event, tick);
	    });
	  }
	})();

	var MIRROR_LR = {
	  center: 'center',
	  left: 'right',
	  right: 'left'
	};

	var MIRROR_TB = {
	  middle: 'middle',
	  top: 'bottom',
	  bottom: 'top'
	};

	var OFFSET_MAP = {
	  top: 0,
	  left: 0,
	  middle: '50%',
	  center: '50%',
	  bottom: '100%',
	  right: '100%'
	};

	var autoToFixedAttachment = function autoToFixedAttachment(attachment, relativeToAttachment) {
	  var left = attachment.left;
	  var top = attachment.top;

	  if (left === 'auto') {
	    left = MIRROR_LR[relativeToAttachment.left];
	  }

	  if (top === 'auto') {
	    top = MIRROR_TB[relativeToAttachment.top];
	  }

	  return { left: left, top: top };
	};

	var attachmentToOffset = function attachmentToOffset(attachment) {
	  var left = attachment.left;
	  var top = attachment.top;

	  if (typeof OFFSET_MAP[attachment.left] !== 'undefined') {
	    left = OFFSET_MAP[attachment.left];
	  }

	  if (typeof OFFSET_MAP[attachment.top] !== 'undefined') {
	    top = OFFSET_MAP[attachment.top];
	  }

	  return { left: left, top: top };
	};

	function addOffset() {
	  var out = { top: 0, left: 0 };

	  for (var _len = arguments.length, offsets = Array(_len), _key = 0; _key < _len; _key++) {
	    offsets[_key] = arguments[_key];
	  }

	  offsets.forEach(function (_ref) {
	    var top = _ref.top;
	    var left = _ref.left;

	    if (typeof top === 'string') {
	      top = parseFloat(top, 10);
	    }
	    if (typeof left === 'string') {
	      left = parseFloat(left, 10);
	    }

	    out.top += top;
	    out.left += left;
	  });

	  return out;
	}

	function offsetToPx(offset, size) {
	  if (typeof offset.left === 'string' && offset.left.indexOf('%') !== -1) {
	    offset.left = parseFloat(offset.left, 10) / 100 * size.width;
	  }
	  if (typeof offset.top === 'string' && offset.top.indexOf('%') !== -1) {
	    offset.top = parseFloat(offset.top, 10) / 100 * size.height;
	  }

	  return offset;
	}

	var parseOffset = function parseOffset(value) {
	  var _value$split = value.split(' ');

	  var _value$split2 = _slicedToArray(_value$split, 2);

	  var top = _value$split2[0];
	  var left = _value$split2[1];

	  return { top: top, left: left };
	};
	var parseAttachment = parseOffset;

	var TetherClass = (function () {
	  function TetherClass(options) {
	    var _this = this;

	    _classCallCheck(this, TetherClass);

	    this.position = this.position.bind(this);

	    tethers.push(this);

	    this.history = [];

	    this.setOptions(options, false);

	    TetherBase.modules.forEach(function (module) {
	      if (typeof module.initialize !== 'undefined') {
	        module.initialize.call(_this);
	      }
	    });

	    this.position();
	  }

	  _createClass(TetherClass, [{
	    key: 'getClass',
	    value: function getClass() {
	      var key = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
	      var classes = this.options.classes;

	      if (typeof classes !== 'undefined' && classes[key]) {
	        return this.options.classes[key];
	      } else if (this.options.classPrefix) {
	        return this.options.classPrefix + '-' + key;
	      } else {
	        return key;
	      }
	    }
	  }, {
	    key: 'setOptions',
	    value: function setOptions(options) {
	      var _this2 = this;

	      var pos = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

	      var defaults = {
	        offset: '0 0',
	        targetOffset: '0 0',
	        targetAttachment: 'auto auto',
	        classPrefix: 'tether'
	      };

	      this.options = extend(defaults, options);

	      var _options = this.options;
	      var element = _options.element;
	      var target = _options.target;
	      var targetModifier = _options.targetModifier;

	      this.element = element;
	      this.target = target;
	      this.targetModifier = targetModifier;

	      if (this.target === 'viewport') {
	        this.target = document.body;
	        this.targetModifier = 'visible';
	      } else if (this.target === 'scroll-handle') {
	        this.target = document.body;
	        this.targetModifier = 'scroll-handle';
	      }

	      ['element', 'target'].forEach(function (key) {
	        if (typeof _this2[key] === 'undefined') {
	          throw new Error('Tether Error: Both element and target must be defined');
	        }

	        if (typeof _this2[key].jquery !== 'undefined') {
	          _this2[key] = _this2[key][0];
	        } else if (typeof _this2[key] === 'string') {
	          _this2[key] = document.querySelector(_this2[key]);
	        }
	      });

	      addClass(this.element, this.getClass('element'));
	      if (!(this.options.addTargetClasses === false)) {
	        addClass(this.target, this.getClass('target'));
	      }

	      if (!this.options.attachment) {
	        throw new Error('Tether Error: You must provide an attachment');
	      }

	      this.targetAttachment = parseAttachment(this.options.targetAttachment);
	      this.attachment = parseAttachment(this.options.attachment);
	      this.offset = parseOffset(this.options.offset);
	      this.targetOffset = parseOffset(this.options.targetOffset);

	      if (typeof this.scrollParent !== 'undefined') {
	        this.disable();
	      }

	      if (this.targetModifier === 'scroll-handle') {
	        this.scrollParent = this.target;
	      } else {
	        this.scrollParent = getScrollParent(this.target);
	      }

	      if (!(this.options.enabled === false)) {
	        this.enable(pos);
	      }
	    }
	  }, {
	    key: 'getTargetBounds',
	    value: function getTargetBounds() {
	      if (typeof this.targetModifier !== 'undefined') {
	        if (this.targetModifier === 'visible') {
	          if (this.target === document.body) {
	            return { top: pageYOffset, left: pageXOffset, height: innerHeight, width: innerWidth };
	          } else {
	            var bounds = getBounds(this.target);

	            var out = {
	              height: bounds.height,
	              width: bounds.width,
	              top: bounds.top,
	              left: bounds.left
	            };

	            out.height = Math.min(out.height, bounds.height - (pageYOffset - bounds.top));
	            out.height = Math.min(out.height, bounds.height - (bounds.top + bounds.height - (pageYOffset + innerHeight)));
	            out.height = Math.min(innerHeight, out.height);
	            out.height -= 2;

	            out.width = Math.min(out.width, bounds.width - (pageXOffset - bounds.left));
	            out.width = Math.min(out.width, bounds.width - (bounds.left + bounds.width - (pageXOffset + innerWidth)));
	            out.width = Math.min(innerWidth, out.width);
	            out.width -= 2;

	            if (out.top < pageYOffset) {
	              out.top = pageYOffset;
	            }
	            if (out.left < pageXOffset) {
	              out.left = pageXOffset;
	            }

	            return out;
	          }
	        } else if (this.targetModifier === 'scroll-handle') {
	          var bounds = undefined;
	          var target = this.target;
	          if (target === document.body) {
	            target = document.documentElement;

	            bounds = {
	              left: pageXOffset,
	              top: pageYOffset,
	              height: innerHeight,
	              width: innerWidth
	            };
	          } else {
	            bounds = getBounds(target);
	          }

	          var style = getComputedStyle(target);

	          var hasBottomScroll = target.scrollWidth > target.clientWidth || [style.overflow, style.overflowX].indexOf('scroll') >= 0 || this.target !== document.body;

	          var scrollBottom = 0;
	          if (hasBottomScroll) {
	            scrollBottom = 15;
	          }

	          var height = bounds.height - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth) - scrollBottom;

	          var out = {
	            width: 15,
	            height: height * 0.975 * (height / target.scrollHeight),
	            left: bounds.left + bounds.width - parseFloat(style.borderLeftWidth) - 15
	          };

	          var fitAdj = 0;
	          if (height < 408 && this.target === document.body) {
	            fitAdj = -0.00011 * Math.pow(height, 2) - 0.00727 * height + 22.58;
	          }

	          if (this.target !== document.body) {
	            out.height = Math.max(out.height, 24);
	          }

	          var scrollPercentage = this.target.scrollTop / (target.scrollHeight - height);
	          out.top = scrollPercentage * (height - out.height - fitAdj) + bounds.top + parseFloat(style.borderTopWidth);

	          if (this.target === document.body) {
	            out.height = Math.max(out.height, 24);
	          }

	          return out;
	        }
	      } else {
	        return getBounds(this.target);
	      }
	    }
	  }, {
	    key: 'clearCache',
	    value: function clearCache() {
	      this._cache = {};
	    }
	  }, {
	    key: 'cache',
	    value: function cache(k, getter) {
	      // More than one module will often need the same DOM info, so
	      // we keep a cache which is cleared on each position call
	      if (typeof this._cache === 'undefined') {
	        this._cache = {};
	      }

	      if (typeof this._cache[k] === 'undefined') {
	        this._cache[k] = getter.call(this);
	      }

	      return this._cache[k];
	    }
	  }, {
	    key: 'enable',
	    value: function enable() {
	      var pos = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

	      if (!(this.options.addTargetClasses === false)) {
	        addClass(this.target, this.getClass('enabled'));
	      }
	      addClass(this.element, this.getClass('enabled'));
	      this.enabled = true;

	      if (this.scrollParent !== document) {
	        this.scrollParent.addEventListener('scroll', this.position);
	      }

	      if (pos) {
	        this.position();
	      }
	    }
	  }, {
	    key: 'disable',
	    value: function disable() {
	      removeClass(this.target, this.getClass('enabled'));
	      removeClass(this.element, this.getClass('enabled'));
	      this.enabled = false;

	      if (typeof this.scrollParent !== 'undefined') {
	        this.scrollParent.removeEventListener('scroll', this.position);
	      }
	    }
	  }, {
	    key: 'destroy',
	    value: function destroy() {
	      var _this3 = this;

	      this.disable();

	      tethers.forEach(function (tether, i) {
	        if (tether === _this3) {
	          tethers.splice(i, 1);
	          return;
	        }
	      });
	    }
	  }, {
	    key: 'updateAttachClasses',
	    value: function updateAttachClasses(elementAttach, targetAttach) {
	      var _this4 = this;

	      elementAttach = elementAttach || this.attachment;
	      targetAttach = targetAttach || this.targetAttachment;
	      var sides = ['left', 'top', 'bottom', 'right', 'middle', 'center'];

	      if (typeof this._addAttachClasses !== 'undefined' && this._addAttachClasses.length) {
	        // updateAttachClasses can be called more than once in a position call, so
	        // we need to clean up after ourselves such that when the last defer gets
	        // ran it doesn't add any extra classes from previous calls.
	        this._addAttachClasses.splice(0, this._addAttachClasses.length);
	      }

	      if (typeof this._addAttachClasses === 'undefined') {
	        this._addAttachClasses = [];
	      }
	      var add = this._addAttachClasses;

	      if (elementAttach.top) {
	        add.push(this.getClass('element-attached') + '-' + elementAttach.top);
	      }
	      if (elementAttach.left) {
	        add.push(this.getClass('element-attached') + '-' + elementAttach.left);
	      }
	      if (targetAttach.top) {
	        add.push(this.getClass('target-attached') + '-' + targetAttach.top);
	      }
	      if (targetAttach.left) {
	        add.push(this.getClass('target-attached') + '-' + targetAttach.left);
	      }

	      var all = [];
	      sides.forEach(function (side) {
	        all.push(_this4.getClass('element-attached') + '-' + side);
	        all.push(_this4.getClass('target-attached') + '-' + side);
	      });

	      defer(function () {
	        if (!(typeof _this4._addAttachClasses !== 'undefined')) {
	          return;
	        }

	        updateClasses(_this4.element, _this4._addAttachClasses, all);
	        if (!(_this4.options.addTargetClasses === false)) {
	          updateClasses(_this4.target, _this4._addAttachClasses, all);
	        }

	        delete _this4._addAttachClasses;
	      });
	    }
	  }, {
	    key: 'position',
	    value: function position() {
	      var _this5 = this;

	      var flushChanges = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

	      // flushChanges commits the changes immediately, leave true unless you are positioning multiple
	      // tethers (in which case call Tether.Utils.flush yourself when you're done)

	      if (!this.enabled) {
	        return;
	      }

	      this.clearCache();

	      // Turn 'auto' attachments into the appropriate corner or edge
	      var targetAttachment = autoToFixedAttachment(this.targetAttachment, this.attachment);

	      this.updateAttachClasses(this.attachment, targetAttachment);

	      var elementPos = this.cache('element-bounds', function () {
	        return getBounds(_this5.element);
	      });

	      var width = elementPos.width;
	      var height = elementPos.height;

	      if (width === 0 && height === 0 && typeof this.lastSize !== 'undefined') {
	        var _lastSize = this.lastSize;

	        // We cache the height and width to make it possible to position elements that are
	        // getting hidden.
	        width = _lastSize.width;
	        height = _lastSize.height;
	      } else {
	        this.lastSize = { width: width, height: height };
	      }

	      var targetPos = this.cache('target-bounds', function () {
	        return _this5.getTargetBounds();
	      });
	      var targetSize = targetPos;

	      // Get an actual px offset from the attachment
	      var offset = offsetToPx(attachmentToOffset(this.attachment), { width: width, height: height });
	      var targetOffset = offsetToPx(attachmentToOffset(targetAttachment), targetSize);

	      var manualOffset = offsetToPx(this.offset, { width: width, height: height });
	      var manualTargetOffset = offsetToPx(this.targetOffset, targetSize);

	      // Add the manually provided offset
	      offset = addOffset(offset, manualOffset);
	      targetOffset = addOffset(targetOffset, manualTargetOffset);

	      // It's now our goal to make (element position + offset) == (target position + target offset)
	      var left = targetPos.left + targetOffset.left - offset.left;
	      var top = targetPos.top + targetOffset.top - offset.top;

	      for (var i = 0; i < TetherBase.modules.length; ++i) {
	        var _module2 = TetherBase.modules[i];
	        var ret = _module2.position.call(this, {
	          left: left,
	          top: top,
	          targetAttachment: targetAttachment,
	          targetPos: targetPos,
	          elementPos: elementPos,
	          offset: offset,
	          targetOffset: targetOffset,
	          manualOffset: manualOffset,
	          manualTargetOffset: manualTargetOffset,
	          scrollbarSize: scrollbarSize,
	          attachment: this.attachment
	        });

	        if (ret === false) {
	          return false;
	        } else if (typeof ret === 'undefined' || typeof ret !== 'object') {
	          continue;
	        } else {
	          top = ret.top;
	          left = ret.left;
	        }
	      }

	      // We describe the position three different ways to give the optimizer
	      // a chance to decide the best possible way to position the element
	      // with the fewest repaints.
	      var next = {
	        // It's position relative to the page (absolute positioning when
	        // the element is a child of the body)
	        page: {
	          top: top,
	          left: left
	        },

	        // It's position relative to the viewport (fixed positioning)
	        viewport: {
	          top: top - pageYOffset,
	          bottom: pageYOffset - top - height + innerHeight,
	          left: left - pageXOffset,
	          right: pageXOffset - left - width + innerWidth
	        }
	      };

	      var scrollbarSize = undefined;
	      if (document.body.scrollWidth > window.innerWidth) {
	        scrollbarSize = this.cache('scrollbar-size', getScrollBarSize);
	        next.viewport.bottom -= scrollbarSize.height;
	      }

	      if (document.body.scrollHeight > window.innerHeight) {
	        scrollbarSize = this.cache('scrollbar-size', getScrollBarSize);
	        next.viewport.right -= scrollbarSize.width;
	      }

	      if (['', 'static'].indexOf(document.body.style.position) === -1 || ['', 'static'].indexOf(document.body.parentElement.style.position) === -1) {
	        // Absolute positioning in the body will be relative to the page, not the 'initial containing block'
	        next.page.bottom = document.body.scrollHeight - top - height;
	        next.page.right = document.body.scrollWidth - left - width;
	      }

	      if (typeof this.options.optimizations !== 'undefined' && this.options.optimizations.moveElement !== false && !(typeof this.targetModifier !== 'undefined')) {
	        (function () {
	          var offsetParent = _this5.cache('target-offsetparent', function () {
	            return getOffsetParent(_this5.target);
	          });
	          var offsetPosition = _this5.cache('target-offsetparent-bounds', function () {
	            return getBounds(offsetParent);
	          });
	          var offsetParentStyle = getComputedStyle(offsetParent);
	          var offsetParentSize = offsetPosition;

	          var offsetBorder = {};
	          ['Top', 'Left', 'Bottom', 'Right'].forEach(function (side) {
	            offsetBorder[side.toLowerCase()] = parseFloat(offsetParentStyle['border' + side + 'Width']);
	          });

	          offsetPosition.right = document.body.scrollWidth - offsetPosition.left - offsetParentSize.width + offsetBorder.right;
	          offsetPosition.bottom = document.body.scrollHeight - offsetPosition.top - offsetParentSize.height + offsetBorder.bottom;

	          if (next.page.top >= offsetPosition.top + offsetBorder.top && next.page.bottom >= offsetPosition.bottom) {
	            if (next.page.left >= offsetPosition.left + offsetBorder.left && next.page.right >= offsetPosition.right) {
	              // We're within the visible part of the target's scroll parent
	              var scrollTop = offsetParent.scrollTop;
	              var scrollLeft = offsetParent.scrollLeft;

	              // It's position relative to the target's offset parent (absolute positioning when
	              // the element is moved to be a child of the target's offset parent).
	              next.offset = {
	                top: next.page.top - offsetPosition.top + scrollTop - offsetBorder.top,
	                left: next.page.left - offsetPosition.left + scrollLeft - offsetBorder.left
	              };
	            }
	          }
	        })();
	      }

	      // We could also travel up the DOM and try each containing context, rather than only
	      // looking at the body, but we're gonna get diminishing returns.

	      this.move(next);

	      this.history.unshift(next);

	      if (this.history.length > 3) {
	        this.history.pop();
	      }

	      if (flushChanges) {
	        flush();
	      }

	      return true;
	    }

	    // THE ISSUE
	  }, {
	    key: 'move',
	    value: function move(pos) {
	      var _this6 = this;

	      if (!(typeof this.element.parentNode !== 'undefined')) {
	        return;
	      }

	      var same = {};

	      for (var type in pos) {
	        same[type] = {};

	        for (var key in pos[type]) {
	          var found = false;

	          for (var i = 0; i < this.history.length; ++i) {
	            var point = this.history[i];
	            if (typeof point[type] !== 'undefined' && !within(point[type][key], pos[type][key])) {
	              found = true;
	              break;
	            }
	          }

	          if (!found) {
	            same[type][key] = true;
	          }
	        }
	      }

	      var css = { top: '', left: '', right: '', bottom: '' };

	      var transcribe = function transcribe(_same, _pos) {
	        var hasOptimizations = typeof _this6.options.optimizations !== 'undefined';
	        var gpu = hasOptimizations ? _this6.options.optimizations.gpu : null;
	        if (gpu !== false) {
	          var yPos = undefined,
	              xPos = undefined;
	          if (_same.top) {
	            css.top = 0;
	            yPos = _pos.top;
	          } else {
	            css.bottom = 0;
	            yPos = -_pos.bottom;
	          }

	          if (_same.left) {
	            css.left = 0;
	            xPos = _pos.left;
	          } else {
	            css.right = 0;
	            xPos = -_pos.right;
	          }

	          css[transformKey] = 'translateX(' + Math.round(xPos) + 'px) translateY(' + Math.round(yPos) + 'px)';

	          if (transformKey !== 'msTransform') {
	            // The Z transform will keep this in the GPU (faster, and prevents artifacts),
	            // but IE9 doesn't support 3d transforms and will choke.
	            css[transformKey] += " translateZ(0)";
	          }
	        } else {
	          if (_same.top) {
	            css.top = _pos.top + 'px';
	          } else {
	            css.bottom = _pos.bottom + 'px';
	          }

	          if (_same.left) {
	            css.left = _pos.left + 'px';
	          } else {
	            css.right = _pos.right + 'px';
	          }
	        }
	      };

	      var moved = false;
	      if ((same.page.top || same.page.bottom) && (same.page.left || same.page.right)) {
	        css.position = 'absolute';
	        transcribe(same.page, pos.page);
	      } else if ((same.viewport.top || same.viewport.bottom) && (same.viewport.left || same.viewport.right)) {
	        css.position = 'fixed';
	        transcribe(same.viewport, pos.viewport);
	      } else if (typeof same.offset !== 'undefined' && same.offset.top && same.offset.left) {
	        (function () {
	          css.position = 'absolute';
	          var offsetParent = _this6.cache('target-offsetparent', function () {
	            return getOffsetParent(_this6.target);
	          });

	          if (getOffsetParent(_this6.element) !== offsetParent) {
	            defer(function () {
	              _this6.element.parentNode.removeChild(_this6.element);
	              offsetParent.appendChild(_this6.element);
	            });
	          }

	          transcribe(same.offset, pos.offset);
	          moved = true;
	        })();
	      } else {
	        css.position = 'absolute';
	        transcribe({ top: true, left: true }, pos.page);
	      }

	      if (!moved) {
	        var offsetParentIsBody = true;
	        var currentNode = this.element.parentNode;
	        while (currentNode && currentNode.tagName !== 'BODY') {
	          if (getComputedStyle(currentNode).position !== 'static') {
	            offsetParentIsBody = false;
	            break;
	          }

	          currentNode = currentNode.parentNode;
	        }

	        if (!offsetParentIsBody) {
	          this.element.parentNode.removeChild(this.element);
	          document.body.appendChild(this.element);
	        }
	      }

	      // Any css change will trigger a repaint, so let's avoid one if nothing changed
	      var writeCSS = {};
	      var write = false;
	      for (var key in css) {
	        var val = css[key];
	        var elVal = this.element.style[key];

	        if (elVal !== '' && val !== '' && ['top', 'left', 'bottom', 'right'].indexOf(key) >= 0) {
	          elVal = parseFloat(elVal);
	          val = parseFloat(val);
	        }

	        if (elVal !== val) {
	          write = true;
	          writeCSS[key] = val;
	        }
	      }

	      if (write) {
	        defer(function () {
	          extend(_this6.element.style, writeCSS);
	        });
	      }
	    }
	  }]);

	  return TetherClass;
	})();

	TetherClass.modules = [];

	TetherBase.position = position;

	var Tether = extend(TetherClass, TetherBase);
	/* globals TetherBase */

	'use strict';

	var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

	var _TetherBase$Utils = TetherBase.Utils;
	var getBounds = _TetherBase$Utils.getBounds;
	var extend = _TetherBase$Utils.extend;
	var updateClasses = _TetherBase$Utils.updateClasses;
	var defer = _TetherBase$Utils.defer;

	var BOUNDS_FORMAT = ['left', 'top', 'right', 'bottom'];

	function getBoundingRect(tether, to) {
	  if (to === 'scrollParent') {
	    to = tether.scrollParent;
	  } else if (to === 'window') {
	    to = [pageXOffset, pageYOffset, innerWidth + pageXOffset, innerHeight + pageYOffset];
	  }

	  if (to === document) {
	    to = to.documentElement;
	  }

	  if (typeof to.nodeType !== 'undefined') {
	    (function () {
	      var size = getBounds(to);
	      var pos = size;
	      var style = getComputedStyle(to);

	      to = [pos.left, pos.top, size.width + pos.left, size.height + pos.top];

	      BOUNDS_FORMAT.forEach(function (side, i) {
	        side = side[0].toUpperCase() + side.substr(1);
	        if (side === 'Top' || side === 'Left') {
	          to[i] += parseFloat(style['border' + side + 'Width']);
	        } else {
	          to[i] -= parseFloat(style['border' + side + 'Width']);
	        }
	      });
	    })();
	  }

	  return to;
	}

	TetherBase.modules.push({
	  position: function position(_ref) {
	    var _this = this;

	    var top = _ref.top;
	    var left = _ref.left;
	    var targetAttachment = _ref.targetAttachment;

	    if (!this.options.constraints) {
	      return true;
	    }

	    var _cache = this.cache('element-bounds', function () {
	      return getBounds(_this.element);
	    });

	    var height = _cache.height;
	    var width = _cache.width;

	    if (width === 0 && height === 0 && typeof this.lastSize !== 'undefined') {
	      var _lastSize = this.lastSize;

	      // Handle the item getting hidden as a result of our positioning without glitching
	      // the classes in and out
	      width = _lastSize.width;
	      height = _lastSize.height;
	    }

	    var targetSize = this.cache('target-bounds', function () {
	      return _this.getTargetBounds();
	    });

	    var targetHeight = targetSize.height;
	    var targetWidth = targetSize.width;

	    var allClasses = [this.getClass('pinned'), this.getClass('out-of-bounds')];

	    this.options.constraints.forEach(function (constraint) {
	      var outOfBoundsClass = constraint.outOfBoundsClass;
	      var pinnedClass = constraint.pinnedClass;

	      if (outOfBoundsClass) {
	        allClasses.push(outOfBoundsClass);
	      }
	      if (pinnedClass) {
	        allClasses.push(pinnedClass);
	      }
	    });

	    allClasses.forEach(function (cls) {
	      ['left', 'top', 'right', 'bottom'].forEach(function (side) {
	        allClasses.push(cls + '-' + side);
	      });
	    });

	    var addClasses = [];

	    var tAttachment = extend({}, targetAttachment);
	    var eAttachment = extend({}, this.attachment);

	    this.options.constraints.forEach(function (constraint) {
	      var to = constraint.to;
	      var attachment = constraint.attachment;
	      var pin = constraint.pin;

	      if (typeof attachment === 'undefined') {
	        attachment = '';
	      }

	      var changeAttachX = undefined,
	          changeAttachY = undefined;
	      if (attachment.indexOf(' ') >= 0) {
	        var _attachment$split = attachment.split(' ');

	        var _attachment$split2 = _slicedToArray(_attachment$split, 2);

	        changeAttachY = _attachment$split2[0];
	        changeAttachX = _attachment$split2[1];
	      } else {
	        changeAttachX = changeAttachY = attachment;
	      }

	      var bounds = getBoundingRect(_this, to);

	      if (changeAttachY === 'target' || changeAttachY === 'both') {
	        if (top < bounds[1] && tAttachment.top === 'top') {
	          top += targetHeight;
	          tAttachment.top = 'bottom';
	        }

	        if (top + height > bounds[3] && tAttachment.top === 'bottom') {
	          top -= targetHeight;
	          tAttachment.top = 'top';
	        }
	      }

	      if (changeAttachY === 'together') {
	        if (top < bounds[1] && tAttachment.top === 'top') {
	          if (eAttachment.top === 'bottom') {
	            top += targetHeight;
	            tAttachment.top = 'bottom';

	            top += height;
	            eAttachment.top = 'top';
	          } else if (eAttachment.top === 'top') {
	            top += targetHeight;
	            tAttachment.top = 'bottom';

	            top -= height;
	            eAttachment.top = 'bottom';
	          }
	        }

	        if (top + height > bounds[3] && tAttachment.top === 'bottom') {
	          if (eAttachment.top === 'top') {
	            top -= targetHeight;
	            tAttachment.top = 'top';

	            top -= height;
	            eAttachment.top = 'bottom';
	          } else if (eAttachment.top === 'bottom') {
	            top -= targetHeight;
	            tAttachment.top = 'top';

	            top += height;
	            eAttachment.top = 'top';
	          }
	        }

	        if (tAttachment.top === 'middle') {
	          if (top + height > bounds[3] && eAttachment.top === 'top') {
	            top -= height;
	            eAttachment.top = 'bottom';
	          } else if (top < bounds[1] && eAttachment.top === 'bottom') {
	            top += height;
	            eAttachment.top = 'top';
	          }
	        }
	      }

	      if (changeAttachX === 'target' || changeAttachX === 'both') {
	        if (left < bounds[0] && tAttachment.left === 'left') {
	          left += targetWidth;
	          tAttachment.left = 'right';
	        }

	        if (left + width > bounds[2] && tAttachment.left === 'right') {
	          left -= targetWidth;
	          tAttachment.left = 'left';
	        }
	      }

	      if (changeAttachX === 'together') {
	        if (left < bounds[0] && tAttachment.left === 'left') {
	          if (eAttachment.left === 'right') {
	            left += targetWidth;
	            tAttachment.left = 'right';

	            left += width;
	            eAttachment.left = 'left';
	          } else if (eAttachment.left === 'left') {
	            left += targetWidth;
	            tAttachment.left = 'right';

	            left -= width;
	            eAttachment.left = 'right';
	          }
	        } else if (left + width > bounds[2] && tAttachment.left === 'right') {
	          if (eAttachment.left === 'left') {
	            left -= targetWidth;
	            tAttachment.left = 'left';

	            left -= width;
	            eAttachment.left = 'right';
	          } else if (eAttachment.left === 'right') {
	            left -= targetWidth;
	            tAttachment.left = 'left';

	            left += width;
	            eAttachment.left = 'left';
	          }
	        } else if (tAttachment.left === 'center') {
	          if (left + width > bounds[2] && eAttachment.left === 'left') {
	            left -= width;
	            eAttachment.left = 'right';
	          } else if (left < bounds[0] && eAttachment.left === 'right') {
	            left += width;
	            eAttachment.left = 'left';
	          }
	        }
	      }

	      if (changeAttachY === 'element' || changeAttachY === 'both') {
	        if (top < bounds[1] && eAttachment.top === 'bottom') {
	          top += height;
	          eAttachment.top = 'top';
	        }

	        if (top + height > bounds[3] && eAttachment.top === 'top') {
	          top -= height;
	          eAttachment.top = 'bottom';
	        }
	      }

	      if (changeAttachX === 'element' || changeAttachX === 'both') {
	        if (left < bounds[0]) {
	          if (eAttachment.left === 'right') {
	            left += width;
	            eAttachment.left = 'left';
	          } else if (eAttachment.left === 'center') {
	            left += width / 2;
	            eAttachment.left = 'left';
	          }
	        }

	        if (left + width > bounds[2]) {
	          if (eAttachment.left === 'left') {
	            left -= width;
	            eAttachment.left = 'right';
	          } else if (eAttachment.left === 'center') {
	            left -= width / 2;
	            eAttachment.left = 'right';
	          }
	        }
	      }

	      if (typeof pin === 'string') {
	        pin = pin.split(',').map(function (p) {
	          return p.trim();
	        });
	      } else if (pin === true) {
	        pin = ['top', 'left', 'right', 'bottom'];
	      }

	      pin = pin || [];

	      var pinned = [];
	      var oob = [];

	      if (top < bounds[1]) {
	        if (pin.indexOf('top') >= 0) {
	          top = bounds[1];
	          pinned.push('top');
	        } else {
	          oob.push('top');
	        }
	      }

	      if (top + height > bounds[3]) {
	        if (pin.indexOf('bottom') >= 0) {
	          top = bounds[3] - height;
	          pinned.push('bottom');
	        } else {
	          oob.push('bottom');
	        }
	      }

	      if (left < bounds[0]) {
	        if (pin.indexOf('left') >= 0) {
	          left = bounds[0];
	          pinned.push('left');
	        } else {
	          oob.push('left');
	        }
	      }

	      if (left + width > bounds[2]) {
	        if (pin.indexOf('right') >= 0) {
	          left = bounds[2] - width;
	          pinned.push('right');
	        } else {
	          oob.push('right');
	        }
	      }

	      if (pinned.length) {
	        (function () {
	          var pinnedClass = undefined;
	          if (typeof _this.options.pinnedClass !== 'undefined') {
	            pinnedClass = _this.options.pinnedClass;
	          } else {
	            pinnedClass = _this.getClass('pinned');
	          }

	          addClasses.push(pinnedClass);
	          pinned.forEach(function (side) {
	            addClasses.push(pinnedClass + '-' + side);
	          });
	        })();
	      }

	      if (oob.length) {
	        (function () {
	          var oobClass = undefined;
	          if (typeof _this.options.outOfBoundsClass !== 'undefined') {
	            oobClass = _this.options.outOfBoundsClass;
	          } else {
	            oobClass = _this.getClass('out-of-bounds');
	          }

	          addClasses.push(oobClass);
	          oob.forEach(function (side) {
	            addClasses.push(oobClass + '-' + side);
	          });
	        })();
	      }

	      if (pinned.indexOf('left') >= 0 || pinned.indexOf('right') >= 0) {
	        eAttachment.left = tAttachment.left = false;
	      }
	      if (pinned.indexOf('top') >= 0 || pinned.indexOf('bottom') >= 0) {
	        eAttachment.top = tAttachment.top = false;
	      }

	      if (tAttachment.top !== targetAttachment.top || tAttachment.left !== targetAttachment.left || eAttachment.top !== _this.attachment.top || eAttachment.left !== _this.attachment.left) {
	        _this.updateAttachClasses(eAttachment, tAttachment);
	      }
	    });

	    defer(function () {
	      if (!(_this.options.addTargetClasses === false)) {
	        updateClasses(_this.target, addClasses, allClasses);
	      }
	      updateClasses(_this.element, addClasses, allClasses);
	    });

	    return { top: top, left: left };
	  }
	});
	/* globals TetherBase */

	'use strict';

	var _TetherBase$Utils = TetherBase.Utils;
	var getBounds = _TetherBase$Utils.getBounds;
	var updateClasses = _TetherBase$Utils.updateClasses;
	var defer = _TetherBase$Utils.defer;

	TetherBase.modules.push({
	  position: function position(_ref) {
	    var _this = this;

	    var top = _ref.top;
	    var left = _ref.left;

	    var _cache = this.cache('element-bounds', function () {
	      return getBounds(_this.element);
	    });

	    var height = _cache.height;
	    var width = _cache.width;

	    var targetPos = this.getTargetBounds();

	    var bottom = top + height;
	    var right = left + width;

	    var abutted = [];
	    if (top <= targetPos.bottom && bottom >= targetPos.top) {
	      ['left', 'right'].forEach(function (side) {
	        var targetPosSide = targetPos[side];
	        if (targetPosSide === left || targetPosSide === right) {
	          abutted.push(side);
	        }
	      });
	    }

	    if (left <= targetPos.right && right >= targetPos.left) {
	      ['top', 'bottom'].forEach(function (side) {
	        var targetPosSide = targetPos[side];
	        if (targetPosSide === top || targetPosSide === bottom) {
	          abutted.push(side);
	        }
	      });
	    }

	    var allClasses = [];
	    var addClasses = [];

	    var sides = ['left', 'top', 'right', 'bottom'];
	    allClasses.push(this.getClass('abutted'));
	    sides.forEach(function (side) {
	      allClasses.push(_this.getClass('abutted') + '-' + side);
	    });

	    if (abutted.length) {
	      addClasses.push(this.getClass('abutted'));
	    }

	    abutted.forEach(function (side) {
	      addClasses.push(_this.getClass('abutted') + '-' + side);
	    });

	    defer(function () {
	      if (!(_this.options.addTargetClasses === false)) {
	        updateClasses(_this.target, addClasses, allClasses);
	      }
	      updateClasses(_this.element, addClasses, allClasses);
	    });

	    return true;
	  }
	});
	/* globals TetherBase */

	'use strict';

	var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

	TetherBase.modules.push({
	  position: function position(_ref) {
	    var top = _ref.top;
	    var left = _ref.left;

	    if (!this.options.shift) {
	      return;
	    }

	    var shift = this.options.shift;
	    if (typeof this.options.shift === 'function') {
	      shift = this.options.shift.call(this, { top: top, left: left });
	    }

	    var shiftTop = undefined,
	        shiftLeft = undefined;
	    if (typeof shift === 'string') {
	      shift = shift.split(' ');
	      shift[1] = shift[1] || shift[0];

	      var _shift = shift;

	      var _shift2 = _slicedToArray(_shift, 2);

	      shiftTop = _shift2[0];
	      shiftLeft = _shift2[1];

	      shiftTop = parseFloat(shiftTop, 10);
	      shiftLeft = parseFloat(shiftLeft, 10);
	    } else {
	      shiftTop = shift.top;
	      shiftLeft = shift.left;
	    }

	    top += shiftTop;
	    left += shiftLeft;

	    return { top: top, left: left };
	  }
	});
	return Tether;

	}));


/***/ }
/******/ ])
});
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJzdHlsZWd1aWRlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcInN0eWxlZ3VpZGVcIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wic3R5bGVndWlkZVwiXSA9IGZhY3RvcnkoKTtcbn0pKHRoaXMsIGZ1bmN0aW9uKCkge1xucmV0dXJuIC8qKioqKiovIChmdW5jdGlvbihtb2R1bGVzKSB7IC8vIHdlYnBhY2tCb290c3RyYXBcbi8qKioqKiovIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuLyoqKioqKi8gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4vKioqKioqLyBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4vKioqKioqLyBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuLyoqKioqKi8gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuLyoqKioqKi8gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuLyoqKioqKi8gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbi8qKioqKiovIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuLyoqKioqKi8gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbi8qKioqKiovIFx0XHRcdGV4cG9ydHM6IHt9LFxuLyoqKioqKi8gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuLyoqKioqKi8gXHRcdFx0bG9hZGVkOiBmYWxzZVxuLyoqKioqKi8gXHRcdH07XG5cbi8qKioqKiovIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbi8qKioqKiovIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuLyoqKioqKi8gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbi8qKioqKiovIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuLyoqKioqKi8gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4vKioqKioqLyBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuLyoqKioqKi8gXHR9XG5cblxuLyoqKioqKi8gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4vKioqKioqLyBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbi8qKioqKiovIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuLyoqKioqKi8gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8qKioqKiovIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG4vKioqKioqLyB9KVxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKioqKiovIChbXG4vKiAwICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHRtb2R1bGUuZXhwb3J0cyA9IHtcblx0ICBEcm9wZG93bjogX193ZWJwYWNrX3JlcXVpcmVfXygxKSxcblx0ICBGbGFubmVsRmFjdG9yeTogX193ZWJwYWNrX3JlcXVpcmVfXygyKSxcblx0ICBGbHlvdXRGYWN0b3J5OiBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpLFxuXHQgIE1lbnVGYWN0b3J5OiBfX3dlYnBhY2tfcmVxdWlyZV9fKDQpLFxuXHQgIE1vZGFsRmFjdG9yeTogX193ZWJwYWNrX3JlcXVpcmVfXyg1KSxcblx0ICBUb2dnbGVGYWN0b3J5OiBfX3dlYnBhY2tfcmVxdWlyZV9fKDYpLFxuXHQgIFRvdXJGYWN0b3J5OiBfX3dlYnBhY2tfcmVxdWlyZV9fKDcpXG5cdH07XG5cblxuLyoqKi8gfSxcbi8qIDEgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdHZhciBEcm9wZG93biA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWxlbWVudCkge1xuXHQgIHRoaXMuZGQgPSBlbGVtZW50O1xuXHQgIHRoaXMub3JpZW50YXRpb24gPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcmllbnRhdGlvbicpIHx8ICdib3R0b20nO1xuXHQgIHRoaXMuZGQuY2xhc3NMaXN0LmFkZCgnZHJvcGRvd24tb3JpZW50YXRpb24tJyArIHRoaXMub3JpZW50YXRpb24pO1xuXG5cdCAgdGhpcy5wbGFjZWhvbGRlciA9IHRoaXMuZGQucXVlcnlTZWxlY3Rvcignc3BhbicpO1xuXHQgIHRoaXMub3B0cyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuZGQucXVlcnlTZWxlY3RvckFsbCgnLmRyb3Bkb3duLW9wdGlvbnMgPiBsaScpKTtcblx0ICB0aGlzLnZhbCA9ICcnO1xuXHQgIHRoaXMuaW5kZXggPSAtMTtcblxuXHQgIHRoaXMuaW5pdEV2ZW50cygpO1xuXHR9XG5cblx0RHJvcGRvd24ucHJvdG90eXBlID0ge1xuXHQgIGluaXRFdmVudHM6IGZ1bmN0aW9uKCkge1xuXHQgICAgdmFyIG9iaiA9IHRoaXM7XG5cblx0ICAgIG9iai5kZC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cdCAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXHQgICAgICBvYmouZGQuY2xhc3NMaXN0LnRvZ2dsZSgnYWN0aXZlJyk7XG5cdCAgICAgIHJldHVybiBmYWxzZTtcblx0ICAgIH0pO1xuXG5cdCAgICBvYmoub3B0cy5mb3JFYWNoKGZ1bmN0aW9uKG9wdCkge1xuXHQgICAgICBvcHQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuXHQgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0ICAgICAgICB2YXIgbm9kZSA9IG9wdDtcblx0ICAgICAgICB2YXIgaW5kZXggPSAwO1xuXG5cdCAgICAgICAgd2hpbGUgKChub2RlID0gbm9kZS5wcmV2aW91c0VsZW1lbnRTaWJsaW5nKSAhPT0gbnVsbCkge1xuXHQgICAgICAgICAgaW5kZXgrKztcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBvYmoudmFsID0gb3B0LnRleHRDb250ZW50O1xuXHQgICAgICAgIG9iai5pbmRleCA9IGluZGV4O1xuXG5cdCAgICAgICAgcmV0dXJuIGZhbHNlO1xuXHQgICAgICB9KTtcblx0ICAgIH0pO1xuXHQgIH1cblx0fVxuXG5cbi8qKiovIH0sXG4vKiAyICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHR2YXIgRmxhbm5lbEZhY3RvcnkgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICB2YXIgcGFkZGluZyA9IDEwO1xuXHQgIHZhciBob3ZlcmFibGVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLWZsYW5uZWxdJykpO1xuXG5cdCAgaG92ZXJhYmxlcy5mb3JFYWNoKGZ1bmN0aW9uKGhvdmVyYWJsZSkge1xuXHQgICAgdmFyIGZsYW5uZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjJyArIGhvdmVyYWJsZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtZmxhbm5lbCcpKTtcblx0ICAgIHZhciBkaXNtaXNzYWxzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGZsYW5uZWwucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtZmxhbm5lbC1kaXNtaXNzXScpKTtcblxuXHQgICAgZGlzbWlzc2Fscy5mb3JFYWNoKGZ1bmN0aW9uKGRpc21pc3NhbCkge1xuXHQgICAgICBkaXNtaXNzYWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0ICAgICAgICBmbGFubmVsLmNsYXNzTGlzdC5hZGQoJ2ZsYW5uZWwtaGlkZGVuJyk7XG5cdCAgICAgICAgaG92ZXJhYmxlLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuXHQgICAgICB9KTtcblx0ICAgIH0pO1xuXG5cdCAgICBob3ZlcmFibGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0ICAgICAgZmxhbm5lbC5jbGFzc0xpc3QudG9nZ2xlKCdmbGFubmVsLWhpZGRlbicpO1xuXHQgICAgICB2YXIgbm9kZSA9IGhvdmVyYWJsZTtcblx0ICAgICAgdmFyIGxlZnQgPSAwO1xuXHQgICAgICB2YXIgdG9wID0gMDtcblxuXHQgICAgICBkbyB7XG5cdCAgICAgICAgbGVmdCArPSBub2RlLm9mZnNldExlZnQ7XG5cdCAgICAgICAgdG9wICs9IG5vZGUub2Zmc2V0VG9wO1xuXHQgICAgICB9IHdoaWxlICgobm9kZSA9IG5vZGUub2Zmc2V0UGFyZW50KSAhPT0gbnVsbCk7XG5cblx0ICAgICAgbGVmdCA9IGxlZnQgKyBob3ZlcmFibGUub2Zmc2V0V2lkdGggLyAyO1xuXHQgICAgICB0b3AgPSB0b3AgKyBob3ZlcmFibGUub2Zmc2V0SGVpZ2h0ICsgcGFkZGluZztcblxuXHQgICAgICBmbGFubmVsLnN0eWxlLmxlZnQgPSBsZWZ0ICsgJ3B4Jztcblx0ICAgICAgZmxhbm5lbC5zdHlsZS50b3AgPSB0b3AgKyAncHgnO1xuXHQgICAgfSk7XG5cblx0ICAgIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuXHQgICAgICBkZWJ1Z2dlcjtcblx0ICAgIH0pO1xuXHQgIH0pO1xuXHR9XG5cblxuLyoqKi8gfSxcbi8qIDMgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdHZhciBGbHlvdXRGYWN0b3J5ID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgdmFyIHBhZGRpbmcgPSAxMDtcblx0ICB2YXIgaG92ZXJhYmxlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1mbHlvdXRdJykpO1xuXG5cdCAgaG92ZXJhYmxlcy5mb3JFYWNoKGZ1bmN0aW9uKGhvdmVyYWJsZSkge1xuXHQgICAgdmFyIGZseW91dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnICsgaG92ZXJhYmxlLmdldEF0dHJpYnV0ZSgnZGF0YS1mbHlvdXQnKSk7XG5cblx0ICAgIGhvdmVyYWJsZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW92ZXInLCBmdW5jdGlvbigpIHtcblx0ICAgICAgZmx5b3V0LmNsYXNzTGlzdC5yZW1vdmUoJ2ZseW91dC1oaWRkZW4nKTtcblx0ICAgICAgdmFyIG5vZGUgPSBob3ZlcmFibGU7XG5cdCAgICAgIHZhciBsZWZ0ID0gMDtcblx0ICAgICAgdmFyIHRvcCA9IDA7XG5cblx0ICAgICAgZG8ge1xuXHQgICAgICAgIGxlZnQgKz0gbm9kZS5vZmZzZXRMZWZ0O1xuXHQgICAgICAgIHRvcCArPSBub2RlLm9mZnNldFRvcDtcblx0ICAgICAgfSB3aGlsZSAoKG5vZGUgPSBub2RlLm9mZnNldFBhcmVudCkgIT09IG51bGwpO1xuXG5cdCAgICAgIGxlZnQgPSBsZWZ0ICsgaG92ZXJhYmxlLm9mZnNldFdpZHRoIC8gMjtcblx0ICAgICAgdG9wID0gdG9wICsgaG92ZXJhYmxlLm9mZnNldEhlaWdodCArIHBhZGRpbmc7XG5cblx0ICAgICAgZmx5b3V0LnN0eWxlLmxlZnQgPSBsZWZ0ICsgJ3B4Jztcblx0ICAgICAgZmx5b3V0LnN0eWxlLnRvcCA9IHRvcCArICdweCc7XG5cdCAgICB9KTtcblxuXHQgICAgaG92ZXJhYmxlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3V0JywgZnVuY3Rpb24oKSB7XG5cdCAgICAgIGZseW91dC5jbGFzc0xpc3QuYWRkKCdmbHlvdXQtaGlkZGVuJyk7XG5cdCAgICB9KTtcblx0ICB9KTtcblxuXHR9XG5cblxuLyoqKi8gfSxcbi8qIDQgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdHZhciBNZW51RmFjdG9yeSA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWxlbWVudCkge1xuXHQgIHZhciBtZW51cyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLm1lbnUnKSk7XG5cdCAgdmFyIHRvZ2dsZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW1lbnUtdG9nZ2xlXScpKTtcblxuXHQgIHRvZ2dsZXMuZm9yRWFjaChmdW5jdGlvbih0b2dnbGUpIHtcblx0ICAgIHRvZ2dsZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHQgICAgICB2YXIgbWVudSA9IGVsZW1lbnQucXVlcnlTZWxlY3RvcignIycgKyB0b2dnbGUuZ2V0QXR0cmlidXRlKCdkYXRhLW1lbnUtdG9nZ2xlJykpO1xuXHQgICAgICBtZW51LmNsYXNzTGlzdC50b2dnbGUoJ2FjdGl2ZScpO1xuXHQgICAgfSk7XG5cdCAgfSk7XG5cblx0ICBtZW51cy5mb3JFYWNoKGZ1bmN0aW9uKG1lbnUpIHtcblx0ICAgIHZhciBkaXNtaXNzYWxzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwobWVudS5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1tZW51LWRpc21pc3NdJykpO1xuXG5cdCAgICBkaXNtaXNzYWxzLmZvckVhY2goZnVuY3Rpb24oZGlzbWlzc2FsKSB7XG5cdCAgICAgIGRpc21pc3NhbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIG1lbnUuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG5cdCAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignW2RhdGEtbWVudS10b2dnbGU9XCInICsgbWVudS5pZCArICdcIl0nKS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcblx0ICAgICAgfSk7XG5cdCAgICB9KTtcblx0ICB9KTtcblx0fVxuXG5cbi8qKiovIH0sXG4vKiA1ICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHR2YXIgTW9kYWxGYWN0b3J5ID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgdGhpcy5yb290ID0gZWxlbWVudDtcblx0ICB0aGlzLmRpc21pc3NhbHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkoZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1tb2RhbC1kaXNtaXNzXScpKTtcblx0ICB0aGlzLm9wZW5lcnMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkoZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1tb2RhbF0nKSk7XG5cdCAgdGhpcy5hdHRhY2hFdmVudHMoKTtcblx0fVxuXG5cdE1vZGFsRmFjdG9yeS5wcm90b3R5cGUgPSB7XG5cdCAgYXR0YWNoRXZlbnRzOiBmdW5jdGlvbigpIHtcblx0ICAgIHRoaXMuZGlzbWlzc2Fscy5mb3JFYWNoKGZ1bmN0aW9uIChkaXNtaXNzYWwpIHtcblx0ICAgICAgZGlzbWlzc2FsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5kaXNtaXNzLmJpbmQodGhpcykpO1xuXHQgICAgfSwgdGhpcyk7XG5cblx0ICAgIHRoaXMub3BlbmVycy5mb3JFYWNoKGZ1bmN0aW9uIChvcGVuZXIpIHtcblx0ICAgICAgb3BlbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5vcGVuLmJpbmQodGhpcykpO1xuXHQgICAgfSwgdGhpcyk7XG5cblx0ICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZnVuY3Rpb24oZXZlbnQpIHtcblx0ICAgICAgdmFyIGtleSA9IGV2ZW50LndoaWNoIHx8IGV2ZW50LmtleUNvZGU7XG5cblx0ICAgICAgLy8gRVNDXG5cdCAgICAgIGlmIChrZXkgPT09IDI3KSB7XG5cdCAgICAgICAgdmFyIG1vZGFscyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5tb2RhbDpub3QoLm1vZGFsLWhpZGRlbiknKSk7XG5cdCAgICAgICAgbW9kYWxzLmZvckVhY2goZnVuY3Rpb24obW9kYWwpIHtcblx0ICAgICAgICAgIG1vZGFsLmNsYXNzTGlzdC5hZGQoJ21vZGFsLWhpZGRlbicpO1xuXHQgICAgICAgIH0pO1xuXHQgICAgICB9XG5cdCAgICB9KTtcblx0ICB9LFxuXHQgIG9wZW46IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdCAgICB2YXIgbW9kYWwgPSBldmVudC50YXJnZXQuZ2V0QXR0cmlidXRlKCdkYXRhLW1vZGFsJyk7XG5cdCAgICBtb2RhbCA9IHRoaXMucm9vdC5xdWVyeVNlbGVjdG9yKCcjJyArIG1vZGFsKTtcblx0ICAgIG1vZGFsLmNsYXNzTGlzdC5yZW1vdmUoJ21vZGFsLWhpZGRlbicpO1xuXHQgIH0sXG5cdCAgZGlzbWlzczogZnVuY3Rpb24oZXZlbnQpIHtcblx0ICAgIHZhciB0YXJnZXQgPSBldmVudC50YXJnZXQ7XG5cdCAgICB2YXIgY2xvc2VhYmxlID0gdGFyZ2V0ID09PSBldmVudC5jdXJyZW50VGFyZ2V0ICYmXG5cdCAgICAgIHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ21vZGFsLW92ZXJsYXknKTtcblxuXHQgICAgZG8ge1xuXHQgICAgICBpZiAodGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnZGF0YS1tb2RhbC1kaXNtaXNzJykgJiZcblx0ICAgICAgICAgICF0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdtb2RhbCcpKSB7XG5cdCAgICAgICAgY2xvc2VhYmxlID0gdHJ1ZTtcblx0ICAgICAgfSBlbHNlIGlmICh0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdtb2RhbCcpICYmIGNsb3NlYWJsZSkge1xuXHQgICAgICAgIHJldHVybiB0YXJnZXQuY2xhc3NMaXN0LmFkZCgnbW9kYWwtaGlkZGVuJyk7XG5cdCAgICAgIH0gZWxzZSBpZiAodGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnbW9kYWwnKSl7XG5cdCAgICAgICAgcmV0dXJuO1xuXHQgICAgICB9XG5cdCAgICB9IHdoaWxlKCh0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZSkgIT09IHRoaXMucm9vdCk7XG5cdCAgfVxuXHR9O1xuXG5cbi8qKiovIH0sXG4vKiA2ICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHR2YXIgVG9nZ2xlRmFjdG9yeSA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWxlbWVudCkge1xuXHQgIHZhciB0b2dnbGVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtdG9nZ2xlXScpKTtcblx0ICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuXG5cdCAgdG9nZ2xlcy5mb3JFYWNoKGZ1bmN0aW9uKHRvZ2dsZSkge1xuXHQgICAgdG9nZ2xlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy50b2dnbGUuYmluZCh0aGlzKSk7XG5cdCAgfSwgdGhpcyk7XG5cdH1cblxuXHRUb2dnbGVGYWN0b3J5LnByb3RvdHlwZSA9IHtcblx0ICB0b2dnbGU6IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdCAgICB2YXIgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xuXG5cdCAgICBkbyB7XG5cdCAgICAgIGlmICh0YXJnZXQuaGFzQXR0cmlidXRlKCdkYXRhLXRvZ2dsZScpKSB7XG5cdCAgICAgICAgcmV0dXJuIHRhcmdldC5jbGFzc0xpc3QudG9nZ2xlKCdhY3RpdmUnKVxuXHQgICAgICB9XG5cdCAgICB9IHdoaWxlKCh0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZSkgIT09IHRoaXMuZWxlbWVudClcblx0ICB9XG5cdH1cblxuXG4vKioqLyB9LFxuLyogNyAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0dmFyIFNoZXBoZXJkID0gX193ZWJwYWNrX3JlcXVpcmVfXyg4KTtcblxuXHQvLyBDdXN0b21FdmVudCBwb2x5ZmlsbCBmb3IgSUUxMC8xMSAoZnJvbSBmcm9udGVuZC11dGlscylcblx0dmFyIEN1c3RvbUV2ZW50ID0gZnVuY3Rpb24oZXZlbnROYW1lLCBwYXJhbXMpIHtcblx0ICB2YXIgZXZlbnRQYXJhbXMgPSB7IGJ1YmJsZXM6IGZhbHNlLCBjYW5jZWxhYmxlOiBmYWxzZSwgZGV0YWlsOiB1bmRlZmluZWQgfTtcblxuXHQgIGZvciAodmFyIGtleSBpbiBwYXJhbXMpIHtcblx0ICAgIGlmIChwYXJhbXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXHQgICAgICBldmVudFBhcmFtc1trZXldID0gcGFyYW1zW2tleV07XG5cdCAgICB9XG5cdCAgfVxuXG5cdCAgdmFyIGN1c3RvbUV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XG5cblx0ICBjdXN0b21FdmVudC5pbml0Q3VzdG9tRXZlbnQoXG5cdCAgICBldmVudE5hbWUsXG5cdCAgICBldmVudFBhcmFtcy5idWJibGVzLFxuXHQgICAgZXZlbnRQYXJhbXMuY2FuY2VsYWJsZSxcblx0ICAgIGV2ZW50UGFyYW1zLmRldGFpbFxuXHQgICk7XG5cblx0ICByZXR1cm4gY3VzdG9tRXZlbnQ7XG5cdH07XG5cblx0dmFyIFRvdXJGYWN0b3J5ID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgdGhpcy5yb290ID0gZWxlbWVudDtcblx0ICB0aGlzLnRvdXJFbGVtZW50cyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXRvdXJdJykpO1xuXG5cdCAgaWYgKHRoaXMudG91ckVsZW1lbnRzLmxlbmd0aCA+IDApIHtcblx0ICAgIHRoaXMudG91cnMgPSB7fTtcblx0ICAgIHRoaXMuY3VycmVudFRvdXJOYW1lID0gbnVsbDtcblxuXHQgICAgdGhpcy5vcGVuZXJzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtdG91ci1vcGVuZXJdJykpO1xuXG5cdCAgICB2YXIgdG91ck92ZXJsYXlFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdCAgICB0b3VyT3ZlcmxheUVsZW1lbnQuY2xhc3NMaXN0LmFkZCgndG91ci1vdmVybGF5JywgJ292ZXJsYXktaGlkZGVuJyk7XG5cdCAgICB0aGlzLnRvdXJPdmVybGF5ID0gZWxlbWVudC5ib2R5LmFwcGVuZENoaWxkKHRvdXJPdmVybGF5RWxlbWVudCk7XG5cblx0ICAgIHRoaXMuaW5pdGlhbGl6ZSgpO1xuXG5cdCAgICAvLyBPcGVuIGFsbCB0b3VycyB3aXRob3V0IG9wZW5lcnMgaW1tZWRpYXRlbHlcblx0ICAgIGlmICh0aGlzLm9wZW5lcnMubGVuZ3RoIDwgdGhpcy50b3VyRWxlbWVudHMubGVuZ3RoKSB7XG5cdCAgICAgIHZhciB0aGF0ID0gdGhpcztcblx0ICAgICAgdmFyIG9wZW5lck5hbWVzID0gdGhhdC5vcGVuZXJzLm1hcChmdW5jdGlvbihvcGVuZXIpIHsgcmV0dXJuIG9wZW5lci5nZXRBdHRyaWJ1dGUoJ2RhdGEtdG91ci1vcGVuZXInKTsgfSk7XG5cblx0ICAgICAgdGhhdC50b3VyRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbih0b3VyRWxlbWVudCkge1xuXHQgICAgICAgIHZhciB0b3VyTmFtZSA9IHRvdXJFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS10b3VyLW5hbWUnKTtcblx0ICAgICAgICBpZiAoIW9wZW5lck5hbWVzLmluY2x1ZGVzKHRvdXJOYW1lKSkge1xuXHQgICAgICAgICAgdGhhdC5vcGVuVG91cih0b3VyTmFtZSk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9KTtcblx0ICAgIH1cblx0ICB9XG5cdH1cblxuXHRUb3VyRmFjdG9yeS5wcm90b3R5cGUgPSB7XG5cdCAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7XG5cdCAgICB2YXIgdGhhdCA9IHRoaXM7XG5cblx0ICAgIHRoYXQudG91ckVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24odG91ckVsZW1lbnQpIHtcblx0ICAgICAgdGhhdC5pbml0aWFsaXplVG91cih0b3VyRWxlbWVudCk7XG5cdCAgICB9KTtcblxuXHQgICAgdGhhdC5hdHRhY2hFdmVudHMoKTtcblx0ICB9LFxuXHQgIGluaXRpYWxpemVUb3VyOiBmdW5jdGlvbih0b3VyRWxlbWVudCkge1xuXHQgICAgdmFyIHRoYXQgPSB0aGlzO1xuXHQgICAgdmFyIHRvdXJOYW1lID0gdG91ckVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXRvdXItbmFtZScpO1xuXG5cdCAgICB2YXIgdG91ciA9IG5ldyBTaGVwaGVyZC5Ub3VyKHtcblx0ICAgICAgZGVmYXVsdHM6IHtcblx0ICAgICAgICBzaG93Q2FuY2VsTGluazogdHJ1ZSxcblx0ICAgICAgICBidXR0b25zOiBbXG5cdCAgICAgICAgICB7XG5cdCAgICAgICAgICAgIHRleHQ6IHRvdXJFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS10b3VyLXNraXAnKSxcblx0ICAgICAgICAgICAgY2xhc3NlczogJ2J0bi1kZWZhdWx0Jyxcblx0ICAgICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgICB0aGF0LmNsb3NlVG91cih0b3VyTmFtZSk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgIH0sXG5cdCAgICAgICAgICB7XG5cdCAgICAgICAgICAgIHRleHQ6IHRvdXJFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS10b3VyLW5leHQnKSxcblx0ICAgICAgICAgICAgY2xhc3NlczogJ2J0bi1wcmltYXJ5Jyxcblx0ICAgICAgICAgICAgYWN0aW9uOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgICB0aGF0LmNsaWNrTmV4dCh0b3VyTmFtZSk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgIH1cblx0ICAgICAgICBdXG5cdCAgICAgIH1cblx0ICAgIH0pO1xuXG5cdCAgICB0aGF0LnRvdXJzW3RvdXJOYW1lXSA9IHtcblx0ICAgICAgdG91cjogdG91cixcblx0ICAgICAgbmFtZTogdG91ck5hbWVcblx0ICAgIH07XG5cdCAgICB0aGF0LmFkZFN0ZXBzKHRvdXIsIHRvdXJFbGVtZW50KTtcblx0ICB9LFxuXHQgIGFkZFN0ZXBzOiBmdW5jdGlvbih0b3VyLCB0b3VyRWxlbWVudCkge1xuXHQgICAgdmFyIHRoYXQgPSB0aGlzO1xuXG5cdCAgICB2YXIgc3RlcHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkodG91ckVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtdG91ci1zdGVwXScpKTtcblx0ICAgIHZhciBzb3J0ZWRTdGVwcyA9IHN0ZXBzLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuXHQgICAgICB2YXIgc3RlcEEgPSBwYXJzZUludChhLmdldEF0dHJpYnV0ZSgnZGF0YS1zdGVwLW51bWJlcicpKTtcblx0ICAgICAgdmFyIHN0ZXBCID0gcGFyc2VJbnQoYi5nZXRBdHRyaWJ1dGUoJ2RhdGEtc3RlcC1udW1iZXInKSk7XG5cblx0ICAgICAgaWYgKHN0ZXBBID4gc3RlcEIpIHtcblx0ICAgICAgICByZXR1cm4gMTtcblx0ICAgICAgfSBlbHNlIGlmIChzdGVwQSA8IHN0ZXBCKSB7XG5cdCAgICAgICAgcmV0dXJuIC0xO1xuXHQgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIHJldHVybiAwO1xuXHQgICAgICB9XG5cdCAgICB9KTtcblxuXHQgICAgc29ydGVkU3RlcHMuZm9yRWFjaChmdW5jdGlvbihzdGVwLCBpbmRleCkge1xuXHQgICAgICB2YXIgc3RlcENvbmZpZyA9IHtcblx0ICAgICAgICB0aXRsZTogc3RlcC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdGl0bGUnKSB8fCAnJyxcblx0ICAgICAgICB0ZXh0OiBzdGVwLmlubmVySFRNTCxcblx0ICAgICAgfTtcblxuXHQgICAgICB2YXIgY2xhc3NlcyA9IHN0ZXAuZ2V0QXR0cmlidXRlKCdkYXRhLWNsYXNzZXMnKSB8fCAnJztcblxuXHQgICAgICB2YXIgYXR0YWNoVG9FbGVtZW50ID0gc3RlcC5nZXRBdHRyaWJ1dGUoJ2RhdGEtYXR0YWNoLXRvLWVsZW1lbnQnKTtcblx0ICAgICAgdmFyIGF0dGFjaFRvUG9zaXRpb24gPSBzdGVwLmdldEF0dHJpYnV0ZSgnZGF0YS1hdHRhY2gtdG8tcG9zaXRpb24nKTtcblx0ICAgICAgdmFyIHBvc2l0aW9uT2Zmc2V0ID0ge1xuXHQgICAgICAgIGxlZnQ6ICcwIDI1cHgnLFxuXHQgICAgICAgIHJpZ2h0OiAnMCAtMjVweCcsXG5cdCAgICAgICAgdG9wOiAnMjVweCAwJyxcblx0ICAgICAgICBib3R0b206ICctMjVweCAwJ1xuXHQgICAgICB9W2F0dGFjaFRvUG9zaXRpb25dO1xuXG5cdCAgICAgIGlmIChjbGFzc2VzKSB7XG5cdCAgICAgICAgc3RlcENvbmZpZy5jbGFzc2VzID0gY2xhc3Nlcy5zcGxpdCgnICcpO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKGF0dGFjaFRvRWxlbWVudCAmJiBhdHRhY2hUb1Bvc2l0aW9uICYmIHBvc2l0aW9uT2Zmc2V0KSB7XG5cdCAgICAgICAgc3RlcENvbmZpZy5hdHRhY2hUbyA9IHtcblx0ICAgICAgICAgIGVsZW1lbnQ6IGF0dGFjaFRvRWxlbWVudCxcblx0ICAgICAgICAgIG9uOiBhdHRhY2hUb1Bvc2l0aW9uXG5cdCAgICAgICAgfTtcblxuXHQgICAgICAgIHN0ZXBDb25maWcudGV0aGVyT3B0aW9ucyA9IHtcblx0ICAgICAgICAgIG9mZnNldDogcG9zaXRpb25PZmZzZXRcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAoc29ydGVkU3RlcHMubGVuZ3RoIC0gMSA9PT0gaW5kZXgpIHtcblx0ICAgICAgICBzdGVwQ29uZmlnLmJ1dHRvbnMgPSBbXG5cdCAgICAgICAgICB7XG5cdCAgICAgICAgICAgIHRleHQ6IHRvdXJFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS10b3VyLWRvbmUnKSxcblx0ICAgICAgICAgICAgY2xhc3NlczogJ2J0bi1wcmltYXJ5Jyxcblx0ICAgICAgICAgICAgYWN0aW9uOiB0b3VyLmNvbXBsZXRlXG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgXTtcblx0ICAgICAgfVxuXG5cdCAgICAgIHRvdXIuYWRkU3RlcChzdGVwQ29uZmlnKTtcblxuXHQgICAgICB0b3VyLm9uKCdhY3RpdmUnLCBmdW5jdGlvbigpIHtcblx0ICAgICAgICB0aGF0LnRvdXJPdmVybGF5LmNsYXNzTGlzdC5yZW1vdmUoJ292ZXJsYXktaGlkZGVuJyk7XG5cdCAgICAgIH0pO1xuXG5cdCAgICAgIHRvdXIub24oJ2luYWN0aXZlJywgZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgdGhhdC50b3VyT3ZlcmxheS5jbGFzc0xpc3QuYWRkKCdvdmVybGF5LWhpZGRlbicpO1xuXHQgICAgICB9KTtcblx0ICAgIH0pO1xuXHQgIH0sXG5cdCAgYXR0YWNoRXZlbnRzOiBmdW5jdGlvbigpIHtcblx0ICAgIHZhciB0aGF0ID0gdGhpcztcblxuXHQgICAgdGhhdC5vcGVuZXJzLmZvckVhY2goZnVuY3Rpb24gKG9wZW5lcikge1xuXHQgICAgICBvcGVuZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGF0Lm9wZW5Ub3VyLmJpbmQodGhhdCwgb3BlbmVyLmdldEF0dHJpYnV0ZSgnZGF0YS10b3VyLW9wZW5lcicpKSk7XG5cdCAgICB9LCB0aGF0KTtcblxuXHQgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBmdW5jdGlvbihldmVudCkge1xuXHQgICAgICB2YXIga2V5ID0gZXZlbnQud2hpY2ggfHwgZXZlbnQua2V5Q29kZTtcblxuXHQgICAgICAvLyBFU0Ncblx0ICAgICAgaWYgKGtleSA9PT0gMjcpIHtcblx0ICAgICAgICB0aGF0LmNsb3NlVG91cih0aGF0LmN1cnJlbnRUb3VyTmFtZSk7XG5cdCAgICAgIH1cblx0ICAgIH0pO1xuXG5cdCAgICB0aGF0LnRvdXJPdmVybGF5LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdCAgICAgIHRoYXQuY2xvc2VUb3VyKHRoYXQuY3VycmVudFRvdXJOYW1lKTtcblx0ICAgIH0pO1xuXHQgIH0sXG5cdCAgb3BlblRvdXI6IGZ1bmN0aW9uKHRvdXJOYW1lKSB7XG5cdCAgICB2YXIgdG91ck9iamVjdCA9IHRoaXMudG91cnNbdG91ck5hbWVdO1xuXHQgICAgdGhpcy5jdXJyZW50VG91ck5hbWUgPSB0b3VyT2JqZWN0Lm5hbWU7XG5cblx0ICAgIHRvdXJPYmplY3QudG91ci5zdGFydCgpO1xuXHQgICAgdGhpcy50b3VyT3ZlcmxheS5jbGFzc0xpc3QucmVtb3ZlKCd0b3VyLW92ZXJsYXktaGlkZGVuJyk7XG5cdCAgfSxcblx0ICBjbGlja05leHQ6IGZ1bmN0aW9uKHRvdXJOYW1lKSB7XG5cdCAgICB2YXIgdG91ck9iamVjdCA9IHRoaXMudG91cnNbdG91ck5hbWVdO1xuXHQgICAgdmFyIHBheWxvYWQgPSB7XG5cdCAgICAgIGN1cnJlbnRTdGVwOiB0b3VyT2JqZWN0LnRvdXIuZ2V0Q3VycmVudFN0ZXAoKS5pZC5yZXBsYWNlKCdzdGVwLScsICcnKSxcblx0ICAgICAgdG91ck5hbWU6IHRvdXJPYmplY3QubmFtZVxuXHQgICAgfTtcblxuXHQgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ25leHQnLCB7ICdkZXRhaWwnOiBwYXlsb2FkIH0pKTtcblx0ICAgIHRvdXJPYmplY3QudG91ci5uZXh0KCk7XG5cdCAgfSxcblx0ICBjbG9zZVRvdXI6IGZ1bmN0aW9uKHRvdXJOYW1lKSB7XG5cdCAgICB2YXIgdG91ck9iamVjdCA9IHRoaXMudG91cnNbdG91ck5hbWVdO1xuXHQgICAgdmFyIHBheWxvYWQgPSB7XG5cdCAgICAgIGN1cnJlbnRTdGVwOiB0b3VyT2JqZWN0LnRvdXIuZ2V0Q3VycmVudFN0ZXAoKS5pZC5yZXBsYWNlKCdzdGVwLScsICcnKSxcblx0ICAgICAgdG91ck5hbWU6IHRvdXJPYmplY3QubmFtZVxuXHQgICAgfTtcblxuXHQgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ2NhbmNlbCcsIHsgJ2RldGFpbCc6IHBheWxvYWQgfSkpO1xuXHQgICAgdG91ck9iamVjdC50b3VyLmNhbmNlbCgpO1xuXHQgIH1cblx0fTtcblxuXG4vKioqLyB9LFxuLyogOCAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0dmFyIF9fV0VCUEFDS19BTURfREVGSU5FX0ZBQ1RPUllfXywgX19XRUJQQUNLX0FNRF9ERUZJTkVfQVJSQVlfXywgX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX187LyohIHRldGhlci1zaGVwaGVyZCAxLjIuMCAqL1xuXG5cdChmdW5jdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdCAgaWYgKHRydWUpIHtcblx0ICAgICEoX19XRUJQQUNLX0FNRF9ERUZJTkVfQVJSQVlfXyA9IFtfX3dlYnBhY2tfcmVxdWlyZV9fKDkpXSwgX19XRUJQQUNLX0FNRF9ERUZJTkVfRkFDVE9SWV9fID0gKGZhY3RvcnkpLCBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXyA9ICh0eXBlb2YgX19XRUJQQUNLX0FNRF9ERUZJTkVfRkFDVE9SWV9fID09PSAnZnVuY3Rpb24nID8gKF9fV0VCUEFDS19BTURfREVGSU5FX0ZBQ1RPUllfXy5hcHBseShleHBvcnRzLCBfX1dFQlBBQ0tfQU1EX0RFRklORV9BUlJBWV9fKSkgOiBfX1dFQlBBQ0tfQU1EX0RFRklORV9GQUNUT1JZX18pLCBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXyAhPT0gdW5kZWZpbmVkICYmIChtb2R1bGUuZXhwb3J0cyA9IF9fV0VCUEFDS19BTURfREVGSU5FX1JFU1VMVF9fKSk7XG5cdCAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCd0ZXRoZXInKSk7XG5cdCAgfSBlbHNlIHtcblx0ICAgIHJvb3QuU2hlcGhlcmQgPSBmYWN0b3J5KHJvb3QuVGV0aGVyKTtcblx0ICB9XG5cdH0odGhpcywgZnVuY3Rpb24oVGV0aGVyKSB7XG5cblx0LyogZ2xvYmFsIFRldGhlciAqL1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmICgndmFsdWUnIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5cdHZhciBfZ2V0ID0gZnVuY3Rpb24gZ2V0KF94NSwgX3g2LCBfeDcpIHsgdmFyIF9hZ2FpbiA9IHRydWU7IF9mdW5jdGlvbjogd2hpbGUgKF9hZ2FpbikgeyB2YXIgb2JqZWN0ID0gX3g1LCBwcm9wZXJ0eSA9IF94NiwgcmVjZWl2ZXIgPSBfeDc7IGRlc2MgPSBwYXJlbnQgPSBnZXR0ZXIgPSB1bmRlZmluZWQ7IF9hZ2FpbiA9IGZhbHNlOyBpZiAob2JqZWN0ID09PSBudWxsKSBvYmplY3QgPSBGdW5jdGlvbi5wcm90b3R5cGU7IHZhciBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmplY3QsIHByb3BlcnR5KTsgaWYgKGRlc2MgPT09IHVuZGVmaW5lZCkgeyB2YXIgcGFyZW50ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iamVjdCk7IGlmIChwYXJlbnQgPT09IG51bGwpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfSBlbHNlIHsgX3g1ID0gcGFyZW50OyBfeDYgPSBwcm9wZXJ0eTsgX3g3ID0gcmVjZWl2ZXI7IF9hZ2FpbiA9IHRydWU7IGNvbnRpbnVlIF9mdW5jdGlvbjsgfSB9IGVsc2UgaWYgKCd2YWx1ZScgaW4gZGVzYykgeyByZXR1cm4gZGVzYy52YWx1ZTsgfSBlbHNlIHsgdmFyIGdldHRlciA9IGRlc2MuZ2V0OyBpZiAoZ2V0dGVyID09PSB1bmRlZmluZWQpIHsgcmV0dXJuIHVuZGVmaW5lZDsgfSByZXR1cm4gZ2V0dGVyLmNhbGwocmVjZWl2ZXIpOyB9IH0gfTtcblxuXHRmdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxuXHRmdW5jdGlvbiBfaW5oZXJpdHMoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIHsgaWYgKHR5cGVvZiBzdXBlckNsYXNzICE9PSAnZnVuY3Rpb24nICYmIHN1cGVyQ2xhc3MgIT09IG51bGwpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignU3VwZXIgZXhwcmVzc2lvbiBtdXN0IGVpdGhlciBiZSBudWxsIG9yIGEgZnVuY3Rpb24sIG5vdCAnICsgdHlwZW9mIHN1cGVyQ2xhc3MpOyB9IHN1YkNsYXNzLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDbGFzcyAmJiBzdXBlckNsYXNzLnByb3RvdHlwZSwgeyBjb25zdHJ1Y3RvcjogeyB2YWx1ZTogc3ViQ2xhc3MsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSwgY29uZmlndXJhYmxlOiB0cnVlIH0gfSk7IGlmIChzdXBlckNsYXNzKSBPYmplY3Quc2V0UHJvdG90eXBlT2YgPyBPYmplY3Quc2V0UHJvdG90eXBlT2Yoc3ViQ2xhc3MsIHN1cGVyQ2xhc3MpIDogc3ViQ2xhc3MuX19wcm90b19fID0gc3VwZXJDbGFzczsgfVxuXG5cdHZhciBfVGV0aGVyJFV0aWxzID0gVGV0aGVyLlV0aWxzO1xuXHR2YXIgRXZlbnRlZCA9IF9UZXRoZXIkVXRpbHMuRXZlbnRlZDtcblx0dmFyIGFkZENsYXNzID0gX1RldGhlciRVdGlscy5hZGRDbGFzcztcblx0dmFyIGV4dGVuZCA9IF9UZXRoZXIkVXRpbHMuZXh0ZW5kO1xuXHR2YXIgaGFzQ2xhc3MgPSBfVGV0aGVyJFV0aWxzLmhhc0NsYXNzO1xuXHR2YXIgcmVtb3ZlQ2xhc3MgPSBfVGV0aGVyJFV0aWxzLnJlbW92ZUNsYXNzO1xuXHR2YXIgdW5pcXVlSWQgPSBfVGV0aGVyJFV0aWxzLnVuaXF1ZUlkO1xuXG5cdHZhciBTaGVwaGVyZCA9IG5ldyBFdmVudGVkKCk7XG5cblx0dmFyIEFUVEFDSE1FTlQgPSB7XG5cdCAgJ3RvcCc6ICdib3R0b20gY2VudGVyJyxcblx0ICAnbGVmdCc6ICdtaWRkbGUgcmlnaHQnLFxuXHQgICdyaWdodCc6ICdtaWRkbGUgbGVmdCcsXG5cdCAgJ2JvdHRvbSc6ICd0b3AgY2VudGVyJyxcblx0ICAnY2VudGVyJzogJ21pZGRsZSBjZW50ZXInXG5cdH07XG5cblx0ZnVuY3Rpb24gY3JlYXRlRnJvbUhUTUwoaHRtbCkge1xuXHQgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHQgIGVsLmlubmVySFRNTCA9IGh0bWw7XG5cdCAgcmV0dXJuIGVsLmNoaWxkcmVuWzBdO1xuXHR9XG5cblx0ZnVuY3Rpb24gbWF0Y2hlc1NlbGVjdG9yKGVsLCBzZWwpIHtcblx0ICB2YXIgbWF0Y2hlcyA9IHVuZGVmaW5lZDtcblx0ICBpZiAodHlwZW9mIGVsLm1hdGNoZXMgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICBtYXRjaGVzID0gZWwubWF0Y2hlcztcblx0ICB9IGVsc2UgaWYgKHR5cGVvZiBlbC5tYXRjaGVzU2VsZWN0b3IgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICBtYXRjaGVzID0gZWwubWF0Y2hlc1NlbGVjdG9yO1xuXHQgIH0gZWxzZSBpZiAodHlwZW9mIGVsLm1zTWF0Y2hlc1NlbGVjdG9yICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgbWF0Y2hlcyA9IGVsLm1zTWF0Y2hlc1NlbGVjdG9yO1xuXHQgIH0gZWxzZSBpZiAodHlwZW9mIGVsLndlYmtpdE1hdGNoZXNTZWxlY3RvciAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIG1hdGNoZXMgPSBlbC53ZWJraXRNYXRjaGVzU2VsZWN0b3I7XG5cdCAgfSBlbHNlIGlmICh0eXBlb2YgZWwubW96TWF0Y2hlc1NlbGVjdG9yICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgbWF0Y2hlcyA9IGVsLm1vek1hdGNoZXNTZWxlY3Rvcjtcblx0ICB9IGVsc2UgaWYgKHR5cGVvZiBlbC5vTWF0Y2hlc1NlbGVjdG9yICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgbWF0Y2hlcyA9IGVsLm9NYXRjaGVzU2VsZWN0b3I7XG5cdCAgfVxuXHQgIHJldHVybiBtYXRjaGVzLmNhbGwoZWwsIHNlbCk7XG5cdH1cblxuXHRmdW5jdGlvbiBwYXJzZVNob3J0aGFuZChvYmosIHByb3BzKSB7XG5cdCAgaWYgKG9iaiA9PT0gbnVsbCB8fCB0eXBlb2Ygb2JqID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgcmV0dXJuIG9iajtcblx0ICB9IGVsc2UgaWYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnKSB7XG5cdCAgICByZXR1cm4gb2JqO1xuXHQgIH1cblxuXHQgIHZhciB2YWxzID0gb2JqLnNwbGl0KCcgJyk7XG5cdCAgdmFyIHZhbHNMZW4gPSB2YWxzLmxlbmd0aDtcblx0ICB2YXIgcHJvcHNMZW4gPSBwcm9wcy5sZW5ndGg7XG5cdCAgaWYgKHZhbHNMZW4gPiBwcm9wc0xlbikge1xuXHQgICAgdmFsc1swXSA9IHZhbHMuc2xpY2UoMCwgdmFsc0xlbiAtIHByb3BzTGVuICsgMSkuam9pbignICcpO1xuXHQgICAgdmFscy5zcGxpY2UoMSwgKHZhbHNMZW4sIHByb3BzTGVuKSk7XG5cdCAgfVxuXG5cdCAgdmFyIG91dCA9IHt9O1xuXHQgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHNMZW47ICsraSkge1xuXHQgICAgdmFyIHByb3AgPSBwcm9wc1tpXTtcblx0ICAgIG91dFtwcm9wXSA9IHZhbHNbaV07XG5cdCAgfVxuXG5cdCAgcmV0dXJuIG91dDtcblx0fVxuXG5cdHZhciBTdGVwID0gKGZ1bmN0aW9uIChfRXZlbnRlZCkge1xuXHQgIF9pbmhlcml0cyhTdGVwLCBfRXZlbnRlZCk7XG5cblx0ICBmdW5jdGlvbiBTdGVwKHRvdXIsIG9wdGlvbnMpIHtcblx0ICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBTdGVwKTtcblxuXHQgICAgX2dldChPYmplY3QuZ2V0UHJvdG90eXBlT2YoU3RlcC5wcm90b3R5cGUpLCAnY29uc3RydWN0b3InLCB0aGlzKS5jYWxsKHRoaXMsIHRvdXIsIG9wdGlvbnMpO1xuXHQgICAgdGhpcy50b3VyID0gdG91cjtcblx0ICAgIHRoaXMuYmluZE1ldGhvZHMoKTtcblx0ICAgIHRoaXMuc2V0T3B0aW9ucyhvcHRpb25zKTtcblx0ICAgIHJldHVybiB0aGlzO1xuXHQgIH1cblxuXHQgIF9jcmVhdGVDbGFzcyhTdGVwLCBbe1xuXHQgICAga2V5OiAnYmluZE1ldGhvZHMnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGJpbmRNZXRob2RzKCkge1xuXHQgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG5cdCAgICAgIHZhciBtZXRob2RzID0gWydfc2hvdycsICdzaG93JywgJ2hpZGUnLCAnaXNPcGVuJywgJ2NhbmNlbCcsICdjb21wbGV0ZScsICdzY3JvbGxUbycsICdkZXN0cm95J107XG5cdCAgICAgIG1ldGhvZHMubWFwKGZ1bmN0aW9uIChtZXRob2QpIHtcblx0ICAgICAgICBfdGhpc1ttZXRob2RdID0gX3RoaXNbbWV0aG9kXS5iaW5kKF90aGlzKTtcblx0ICAgICAgfSk7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnc2V0T3B0aW9ucycsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gc2V0T3B0aW9ucygpIHtcblx0ICAgICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB7fSA6IGFyZ3VtZW50c1swXTtcblxuXHQgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXHQgICAgICB0aGlzLmRlc3Ryb3koKTtcblxuXHQgICAgICB0aGlzLmlkID0gdGhpcy5vcHRpb25zLmlkIHx8IHRoaXMuaWQgfHwgJ3N0ZXAtJyArIHVuaXF1ZUlkKCk7XG5cblx0ICAgICAgdmFyIHdoZW4gPSB0aGlzLm9wdGlvbnMud2hlbjtcblx0ICAgICAgaWYgKHdoZW4pIHtcblx0ICAgICAgICBmb3IgKHZhciBfZXZlbnQgaW4gd2hlbikge1xuXHQgICAgICAgICAgaWYgKCh7fSkuaGFzT3duUHJvcGVydHkuY2FsbCh3aGVuLCBfZXZlbnQpKSB7XG5cdCAgICAgICAgICAgIHZhciBoYW5kbGVyID0gd2hlbltfZXZlbnRdO1xuXHQgICAgICAgICAgICB0aGlzLm9uKF9ldmVudCwgaGFuZGxlciwgdGhpcyk7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuYnV0dG9ucykge1xuXHQgICAgICAgIHRoaXMub3B0aW9ucy5idXR0b25zID0gW3tcblx0ICAgICAgICAgIHRleHQ6ICdOZXh0Jyxcblx0ICAgICAgICAgIGFjdGlvbjogdGhpcy50b3VyLm5leHRcblx0ICAgICAgICB9XTtcblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2dldFRvdXInLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGdldFRvdXIoKSB7XG5cdCAgICAgIHJldHVybiB0aGlzLnRvdXI7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnYmluZEFkdmFuY2UnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGJpbmRBZHZhbmNlKCkge1xuXHQgICAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuXHQgICAgICAvLyBBbiBlbXB0eSBzZWxlY3RvciBtYXRjaGVzIHRoZSBzdGVwIGVsZW1lbnRcblxuXHQgICAgICB2YXIgX3BhcnNlU2hvcnRoYW5kID0gcGFyc2VTaG9ydGhhbmQodGhpcy5vcHRpb25zLmFkdmFuY2VPbiwgWydzZWxlY3RvcicsICdldmVudCddKTtcblxuXHQgICAgICB2YXIgZXZlbnQgPSBfcGFyc2VTaG9ydGhhbmQuZXZlbnQ7XG5cdCAgICAgIHZhciBzZWxlY3RvciA9IF9wYXJzZVNob3J0aGFuZC5zZWxlY3RvcjtcblxuXHQgICAgICB2YXIgaGFuZGxlciA9IGZ1bmN0aW9uIGhhbmRsZXIoZSkge1xuXHQgICAgICAgIGlmICghX3RoaXMyLmlzT3BlbigpKSB7XG5cdCAgICAgICAgICByZXR1cm47XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKHR5cGVvZiBzZWxlY3RvciAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICAgIGlmIChtYXRjaGVzU2VsZWN0b3IoZS50YXJnZXQsIHNlbGVjdG9yKSkge1xuXHQgICAgICAgICAgICBfdGhpczIudG91ci5uZXh0KCk7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgIGlmIChfdGhpczIuZWwgJiYgZS50YXJnZXQgPT09IF90aGlzMi5lbCkge1xuXHQgICAgICAgICAgICBfdGhpczIudG91ci5uZXh0KCk7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICB9O1xuXG5cdCAgICAgIC8vIFRPRE86IHRoaXMgc2hvdWxkIGFsc28gYmluZC91bmJpbmQgb24gc2hvdy9oaWRlXG5cdCAgICAgIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlcik7XG5cdCAgICAgIHRoaXMub24oJ2Rlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgcmV0dXJuIGRvY3VtZW50LmJvZHkucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlcik7XG5cdCAgICAgIH0pO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2dldEF0dGFjaFRvJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRBdHRhY2hUbygpIHtcblx0ICAgICAgdmFyIG9wdHMgPSBwYXJzZVNob3J0aGFuZCh0aGlzLm9wdGlvbnMuYXR0YWNoVG8sIFsnZWxlbWVudCcsICdvbiddKSB8fCB7fTtcblx0ICAgICAgdmFyIHNlbGVjdG9yID0gb3B0cy5lbGVtZW50O1xuXG5cdCAgICAgIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgb3B0cy5lbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG5cblx0ICAgICAgICBpZiAoIW9wdHMuZWxlbWVudCkge1xuXHQgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUaGUgZWxlbWVudCBmb3IgdGhpcyBTaGVwaGVyZCBzdGVwIHdhcyBub3QgZm91bmQgJyArIHNlbGVjdG9yKTtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICByZXR1cm4gb3B0cztcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdzZXR1cFRldGhlcicsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gc2V0dXBUZXRoZXIoKSB7XG5cdCAgICAgIGlmICh0eXBlb2YgVGV0aGVyID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVzaW5nIHRoZSBhdHRhY2htZW50IGZlYXR1cmUgb2YgU2hlcGhlcmQgcmVxdWlyZXMgdGhlIFRldGhlciBsaWJyYXJ5XCIpO1xuXHQgICAgICB9XG5cblx0ICAgICAgdmFyIG9wdHMgPSB0aGlzLmdldEF0dGFjaFRvKCk7XG5cdCAgICAgIHZhciBhdHRhY2htZW50ID0gQVRUQUNITUVOVFtvcHRzLm9uIHx8ICdyaWdodCddO1xuXHQgICAgICBpZiAodHlwZW9mIG9wdHMuZWxlbWVudCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICBvcHRzLmVsZW1lbnQgPSAndmlld3BvcnQnO1xuXHQgICAgICAgIGF0dGFjaG1lbnQgPSAnbWlkZGxlIGNlbnRlcic7XG5cdCAgICAgIH1cblxuXHQgICAgICB2YXIgdGV0aGVyT3B0cyA9IHtcblx0ICAgICAgICBjbGFzc1ByZWZpeDogJ3NoZXBoZXJkJyxcblx0ICAgICAgICBlbGVtZW50OiB0aGlzLmVsLFxuXHQgICAgICAgIGNvbnN0cmFpbnRzOiBbe1xuXHQgICAgICAgICAgdG86ICd3aW5kb3cnLFxuXHQgICAgICAgICAgcGluOiB0cnVlLFxuXHQgICAgICAgICAgYXR0YWNobWVudDogJ3RvZ2V0aGVyJ1xuXHQgICAgICAgIH1dLFxuXHQgICAgICAgIHRhcmdldDogb3B0cy5lbGVtZW50LFxuXHQgICAgICAgIG9mZnNldDogb3B0cy5vZmZzZXQgfHwgJzAgMCcsXG5cdCAgICAgICAgYXR0YWNobWVudDogYXR0YWNobWVudFxuXHQgICAgICB9O1xuXG5cdCAgICAgIGlmICh0aGlzLnRldGhlcikge1xuXHQgICAgICAgIHRoaXMudGV0aGVyLmRlc3Ryb3koKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIHRoaXMudGV0aGVyID0gbmV3IFRldGhlcihleHRlbmQodGV0aGVyT3B0cywgdGhpcy5vcHRpb25zLnRldGhlck9wdGlvbnMpKTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdzaG93Jyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBzaG93KCkge1xuXHQgICAgICB2YXIgX3RoaXMzID0gdGhpcztcblxuXHQgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5iZWZvcmVTaG93UHJvbWlzZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICB2YXIgYmVmb3JlU2hvd1Byb21pc2UgPSB0aGlzLm9wdGlvbnMuYmVmb3JlU2hvd1Byb21pc2UoKTtcblx0ICAgICAgICBpZiAodHlwZW9mIGJlZm9yZVNob3dQcm9taXNlICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgICAgcmV0dXJuIGJlZm9yZVNob3dQcm9taXNlLnRoZW4oZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICByZXR1cm4gX3RoaXMzLl9zaG93KCk7XG5cdCAgICAgICAgICB9KTtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblx0ICAgICAgdGhpcy5fc2hvdygpO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ19zaG93Jyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBfc2hvdygpIHtcblx0ICAgICAgdmFyIF90aGlzNCA9IHRoaXM7XG5cblx0ICAgICAgdGhpcy50cmlnZ2VyKCdiZWZvcmUtc2hvdycpO1xuXG5cdCAgICAgIGlmICghdGhpcy5lbCkge1xuXHQgICAgICAgIHRoaXMucmVuZGVyKCk7XG5cdCAgICAgIH1cblxuXHQgICAgICBhZGRDbGFzcyh0aGlzLmVsLCAnc2hlcGhlcmQtb3BlbicpO1xuXG5cdCAgICAgIGRvY3VtZW50LmJvZHkuc2V0QXR0cmlidXRlKCdkYXRhLXNoZXBoZXJkLXN0ZXAnLCB0aGlzLmlkKTtcblxuXHQgICAgICB0aGlzLnNldHVwVGV0aGVyKCk7XG5cblx0ICAgICAgaWYgKHRoaXMub3B0aW9ucy5zY3JvbGxUbykge1xuXHQgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgX3RoaXM0LnNjcm9sbFRvKCk7XG5cdCAgICAgICAgfSk7XG5cdCAgICAgIH1cblxuXHQgICAgICB0aGlzLnRyaWdnZXIoJ3Nob3cnKTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdoaWRlJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBoaWRlKCkge1xuXHQgICAgICB0aGlzLnRyaWdnZXIoJ2JlZm9yZS1oaWRlJyk7XG5cblx0ICAgICAgcmVtb3ZlQ2xhc3ModGhpcy5lbCwgJ3NoZXBoZXJkLW9wZW4nKTtcblxuXHQgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1zaGVwaGVyZC1zdGVwJyk7XG5cblx0ICAgICAgaWYgKHRoaXMudGV0aGVyKSB7XG5cdCAgICAgICAgdGhpcy50ZXRoZXIuZGVzdHJveSgpO1xuXHQgICAgICB9XG5cdCAgICAgIHRoaXMudGV0aGVyID0gbnVsbDtcblxuXHQgICAgICB0aGlzLnRyaWdnZXIoJ2hpZGUnKTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdpc09wZW4nLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGlzT3BlbigpIHtcblx0ICAgICAgcmV0dXJuIGhhc0NsYXNzKHRoaXMuZWwsICdzaGVwaGVyZC1vcGVuJyk7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnY2FuY2VsJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBjYW5jZWwoKSB7XG5cdCAgICAgIHRoaXMudG91ci5jYW5jZWwoKTtcblx0ICAgICAgdGhpcy50cmlnZ2VyKCdjYW5jZWwnKTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdjb21wbGV0ZScsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gY29tcGxldGUoKSB7XG5cdCAgICAgIHRoaXMudG91ci5jb21wbGV0ZSgpO1xuXHQgICAgICB0aGlzLnRyaWdnZXIoJ2NvbXBsZXRlJyk7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnc2Nyb2xsVG8nLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIHNjcm9sbFRvKCkge1xuXHQgICAgICB2YXIgX2dldEF0dGFjaFRvID0gdGhpcy5nZXRBdHRhY2hUbygpO1xuXG5cdCAgICAgIHZhciBlbGVtZW50ID0gX2dldEF0dGFjaFRvLmVsZW1lbnQ7XG5cblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMuc2Nyb2xsVG9IYW5kbGVyICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIHRoaXMub3B0aW9ucy5zY3JvbGxUb0hhbmRsZXIoZWxlbWVudCk7XG5cdCAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGVsZW1lbnQgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgZWxlbWVudC5zY3JvbGxJbnRvVmlldygpO1xuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnZGVzdHJveScsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gZGVzdHJveSgpIHtcblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLmVsICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQodGhpcy5lbCk7XG5cdCAgICAgICAgZGVsZXRlIHRoaXMuZWw7XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAodGhpcy50ZXRoZXIpIHtcblx0ICAgICAgICB0aGlzLnRldGhlci5kZXN0cm95KCk7XG5cdCAgICAgIH1cblx0ICAgICAgdGhpcy50ZXRoZXIgPSBudWxsO1xuXG5cdCAgICAgIHRoaXMudHJpZ2dlcignZGVzdHJveScpO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ3JlbmRlcicsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gcmVuZGVyKCkge1xuXHQgICAgICB2YXIgX3RoaXM1ID0gdGhpcztcblxuXHQgICAgICBpZiAodHlwZW9mIHRoaXMuZWwgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgdGhpcy5kZXN0cm95KCk7XG5cdCAgICAgIH1cblxuXHQgICAgICB0aGlzLmVsID0gY3JlYXRlRnJvbUhUTUwoJzxkaXYgY2xhc3M9XFwnc2hlcGhlcmQtc3RlcCAnICsgKHRoaXMub3B0aW9ucy5jbGFzc2VzIHx8ICcnKSArICdcXCcgZGF0YS1pZD1cXCcnICsgdGhpcy5pZCArICdcXCcgJyArICh0aGlzLm9wdGlvbnMuaWRBdHRyaWJ1dGUgPyAnaWQ9XCInICsgdGhpcy5vcHRpb25zLmlkQXR0cmlidXRlICsgJ1wiJyA6ICcnKSArICc+PC9kaXY+Jyk7XG5cblx0ICAgICAgdmFyIGNvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0ICAgICAgY29udGVudC5jbGFzc05hbWUgPSAnc2hlcGhlcmQtY29udGVudCc7XG5cdCAgICAgIHRoaXMuZWwuYXBwZW5kQ2hpbGQoY29udGVudCk7XG5cblx0ICAgICAgdmFyIGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2hlYWRlcicpO1xuXHQgICAgICBjb250ZW50LmFwcGVuZENoaWxkKGhlYWRlcik7XG5cblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMudGl0bGUgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgaGVhZGVyLmlubmVySFRNTCArPSAnPGgzIGNsYXNzPVxcJ3NoZXBoZXJkLXRpdGxlXFwnPicgKyB0aGlzLm9wdGlvbnMudGl0bGUgKyAnPC9oMz4nO1xuXHQgICAgICAgIHRoaXMuZWwuY2xhc3NOYW1lICs9ICcgc2hlcGhlcmQtaGFzLXRpdGxlJztcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2hvd0NhbmNlbExpbmspIHtcblx0ICAgICAgICB2YXIgbGluayA9IGNyZWF0ZUZyb21IVE1MKFwiPGEgaHJlZiBjbGFzcz0nc2hlcGhlcmQtY2FuY2VsLWxpbmsnPuKclTwvYT5cIik7XG5cdCAgICAgICAgaGVhZGVyLmFwcGVuZENoaWxkKGxpbmspO1xuXG5cdCAgICAgICAgdGhpcy5lbC5jbGFzc05hbWUgKz0gJyBzaGVwaGVyZC1oYXMtY2FuY2VsLWxpbmsnO1xuXG5cdCAgICAgICAgdGhpcy5iaW5kQ2FuY2VsTGluayhsaW5rKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLnRleHQgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgIHZhciB0ZXh0ID0gY3JlYXRlRnJvbUhUTUwoXCI8ZGl2IGNsYXNzPSdzaGVwaGVyZC10ZXh0Jz48L2Rpdj5cIik7XG5cdCAgICAgICAgICB2YXIgcGFyYWdyYXBocyA9IF90aGlzNS5vcHRpb25zLnRleHQ7XG5cblx0ICAgICAgICAgIGlmICh0eXBlb2YgcGFyYWdyYXBocyA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICAgICAgICBwYXJhZ3JhcGhzID0gcGFyYWdyYXBocy5jYWxsKF90aGlzNSwgdGV4dCk7XG5cdCAgICAgICAgICB9XG5cblx0ICAgICAgICAgIGlmIChwYXJhZ3JhcGhzIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgdGV4dC5hcHBlbmRDaGlsZChwYXJhZ3JhcGhzKTtcblx0ICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIGlmICh0eXBlb2YgcGFyYWdyYXBocyA9PT0gJ3N0cmluZycpIHtcblx0ICAgICAgICAgICAgICBwYXJhZ3JhcGhzID0gW3BhcmFncmFwaHNdO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgcGFyYWdyYXBocy5tYXAoZnVuY3Rpb24gKHBhcmFncmFwaCkge1xuXHQgICAgICAgICAgICAgIHRleHQuaW5uZXJIVE1MICs9ICc8cD4nICsgcGFyYWdyYXBoICsgJzwvcD4nO1xuXHQgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgY29udGVudC5hcHBlbmRDaGlsZCh0ZXh0KTtcblx0ICAgICAgICB9KSgpO1xuXHQgICAgICB9XG5cblx0ICAgICAgdmFyIGZvb3RlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2Zvb3RlcicpO1xuXG5cdCAgICAgIGlmICh0aGlzLm9wdGlvbnMuYnV0dG9ucykge1xuXHQgICAgICAgIChmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICB2YXIgYnV0dG9ucyA9IGNyZWF0ZUZyb21IVE1MKFwiPHVsIGNsYXNzPSdzaGVwaGVyZC1idXR0b25zJz48L3VsPlwiKTtcblxuXHQgICAgICAgICAgX3RoaXM1Lm9wdGlvbnMuYnV0dG9ucy5tYXAoZnVuY3Rpb24gKGNmZykge1xuXHQgICAgICAgICAgICB2YXIgYnV0dG9uID0gY3JlYXRlRnJvbUhUTUwoJzxsaT48YSBjbGFzcz1cXCdzaGVwaGVyZC1idXR0b24gJyArIChjZmcuY2xhc3NlcyB8fCAnJykgKyAnXFwnPicgKyBjZmcudGV4dCArICc8L2E+Jyk7XG5cdCAgICAgICAgICAgIGJ1dHRvbnMuYXBwZW5kQ2hpbGQoYnV0dG9uKTtcblx0ICAgICAgICAgICAgX3RoaXM1LmJpbmRCdXR0b25FdmVudHMoY2ZnLCBidXR0b24ucXVlcnlTZWxlY3RvcignYScpKTtcblx0ICAgICAgICAgIH0pO1xuXG5cdCAgICAgICAgICBmb290ZXIuYXBwZW5kQ2hpbGQoYnV0dG9ucyk7XG5cdCAgICAgICAgfSkoKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGNvbnRlbnQuYXBwZW5kQ2hpbGQoZm9vdGVyKTtcblxuXHQgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuZWwpO1xuXG5cdCAgICAgIHRoaXMuc2V0dXBUZXRoZXIoKTtcblxuXHQgICAgICBpZiAodGhpcy5vcHRpb25zLmFkdmFuY2VPbikge1xuXHQgICAgICAgIHRoaXMuYmluZEFkdmFuY2UoKTtcblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2JpbmRDYW5jZWxMaW5rJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBiaW5kQ2FuY2VsTGluayhsaW5rKSB7XG5cdCAgICAgIHZhciBfdGhpczYgPSB0aGlzO1xuXG5cdCAgICAgIGxpbmsuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xuXHQgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblx0ICAgICAgICBfdGhpczYuY2FuY2VsKCk7XG5cdCAgICAgIH0pO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2JpbmRCdXR0b25FdmVudHMnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGJpbmRCdXR0b25FdmVudHMoY2ZnLCBlbCkge1xuXHQgICAgICB2YXIgX3RoaXM3ID0gdGhpcztcblxuXHQgICAgICBjZmcuZXZlbnRzID0gY2ZnLmV2ZW50cyB8fCB7fTtcblx0ICAgICAgaWYgKHR5cGVvZiBjZmcuYWN0aW9uICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIC8vIEluY2x1ZGluZyBib3RoIGEgY2xpY2sgZXZlbnQgYW5kIGFuIGFjdGlvbiBpcyBub3Qgc3VwcG9ydGVkXG5cdCAgICAgICAgY2ZnLmV2ZW50cy5jbGljayA9IGNmZy5hY3Rpb247XG5cdCAgICAgIH1cblxuXHQgICAgICBmb3IgKHZhciBfZXZlbnQyIGluIGNmZy5ldmVudHMpIHtcblx0ICAgICAgICBpZiAoKHt9KS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGNmZy5ldmVudHMsIF9ldmVudDIpKSB7XG5cdCAgICAgICAgICB2YXIgaGFuZGxlciA9IGNmZy5ldmVudHNbX2V2ZW50Ml07XG5cdCAgICAgICAgICBpZiAodHlwZW9mIGhhbmRsZXIgPT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgICAgIChmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgdmFyIHBhZ2UgPSBoYW5kbGVyO1xuXHQgICAgICAgICAgICAgIGhhbmRsZXIgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXM3LnRvdXIuc2hvdyhwYWdlKTtcblx0ICAgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgICB9KSgpO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcihfZXZlbnQyLCBoYW5kbGVyKTtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICB0aGlzLm9uKCdkZXN0cm95JywgZnVuY3Rpb24gKCkge1xuXHQgICAgICAgIGZvciAodmFyIF9ldmVudDMgaW4gY2ZnLmV2ZW50cykge1xuXHQgICAgICAgICAgaWYgKCh7fSkuaGFzT3duUHJvcGVydHkuY2FsbChjZmcuZXZlbnRzLCBfZXZlbnQzKSkge1xuXHQgICAgICAgICAgICB2YXIgaGFuZGxlciA9IGNmZy5ldmVudHNbX2V2ZW50M107XG5cdCAgICAgICAgICAgIGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoX2V2ZW50MywgaGFuZGxlcik7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICB9KTtcblx0ICAgIH1cblx0ICB9XSk7XG5cblx0ICByZXR1cm4gU3RlcDtcblx0fSkoRXZlbnRlZCk7XG5cblx0dmFyIFRvdXIgPSAoZnVuY3Rpb24gKF9FdmVudGVkMikge1xuXHQgIF9pbmhlcml0cyhUb3VyLCBfRXZlbnRlZDIpO1xuXG5cdCAgZnVuY3Rpb24gVG91cigpIHtcblx0ICAgIHZhciBfdGhpczggPSB0aGlzO1xuXG5cdCAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzBdO1xuXG5cdCAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgVG91cik7XG5cblx0ICAgIF9nZXQoT2JqZWN0LmdldFByb3RvdHlwZU9mKFRvdXIucHJvdG90eXBlKSwgJ2NvbnN0cnVjdG9yJywgdGhpcykuY2FsbCh0aGlzLCBvcHRpb25zKTtcblx0ICAgIHRoaXMuYmluZE1ldGhvZHMoKTtcblx0ICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cdCAgICB0aGlzLnN0ZXBzID0gdGhpcy5vcHRpb25zLnN0ZXBzIHx8IFtdO1xuXG5cdCAgICAvLyBQYXNzIHRoZXNlIGV2ZW50cyBvbnRvIHRoZSBnbG9iYWwgU2hlcGhlcmQgb2JqZWN0XG5cdCAgICB2YXIgZXZlbnRzID0gWydjb21wbGV0ZScsICdjYW5jZWwnLCAnaGlkZScsICdzdGFydCcsICdzaG93JywgJ2FjdGl2ZScsICdpbmFjdGl2ZSddO1xuXHQgICAgZXZlbnRzLm1hcChmdW5jdGlvbiAoZXZlbnQpIHtcblx0ICAgICAgKGZ1bmN0aW9uIChlKSB7XG5cdCAgICAgICAgX3RoaXM4Lm9uKGUsIGZ1bmN0aW9uIChvcHRzKSB7XG5cdCAgICAgICAgICBvcHRzID0gb3B0cyB8fCB7fTtcblx0ICAgICAgICAgIG9wdHMudG91ciA9IF90aGlzODtcblx0ICAgICAgICAgIFNoZXBoZXJkLnRyaWdnZXIoZSwgb3B0cyk7XG5cdCAgICAgICAgfSk7XG5cdCAgICAgIH0pKGV2ZW50KTtcblx0ICAgIH0pO1xuXG5cdCAgICByZXR1cm4gdGhpcztcblx0ICB9XG5cblx0ICBfY3JlYXRlQ2xhc3MoVG91ciwgW3tcblx0ICAgIGtleTogJ2JpbmRNZXRob2RzJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBiaW5kTWV0aG9kcygpIHtcblx0ICAgICAgdmFyIF90aGlzOSA9IHRoaXM7XG5cblx0ICAgICAgdmFyIG1ldGhvZHMgPSBbJ25leHQnLCAnYmFjaycsICdjYW5jZWwnLCAnY29tcGxldGUnLCAnaGlkZSddO1xuXHQgICAgICBtZXRob2RzLm1hcChmdW5jdGlvbiAobWV0aG9kKSB7XG5cdCAgICAgICAgX3RoaXM5W21ldGhvZF0gPSBfdGhpczlbbWV0aG9kXS5iaW5kKF90aGlzOSk7XG5cdCAgICAgIH0pO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2FkZFN0ZXAnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGFkZFN0ZXAobmFtZSwgc3RlcCkge1xuXHQgICAgICBpZiAodHlwZW9mIHN0ZXAgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgc3RlcCA9IG5hbWU7XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAoIShzdGVwIGluc3RhbmNlb2YgU3RlcCkpIHtcblx0ICAgICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBuYW1lID09PSAnbnVtYmVyJykge1xuXHQgICAgICAgICAgc3RlcC5pZCA9IG5hbWUudG9TdHJpbmcoKTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgc3RlcCA9IGV4dGVuZCh7fSwgdGhpcy5vcHRpb25zLmRlZmF1bHRzLCBzdGVwKTtcblx0ICAgICAgICBzdGVwID0gbmV3IFN0ZXAodGhpcywgc3RlcCk7XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgc3RlcC50b3VyID0gdGhpcztcblx0ICAgICAgfVxuXG5cdCAgICAgIHRoaXMuc3RlcHMucHVzaChzdGVwKTtcblx0ICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnZ2V0QnlJZCcsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0QnlJZChpZCkge1xuXHQgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuc3RlcHMubGVuZ3RoOyArK2kpIHtcblx0ICAgICAgICB2YXIgc3RlcCA9IHRoaXMuc3RlcHNbaV07XG5cdCAgICAgICAgaWYgKHN0ZXAuaWQgPT09IGlkKSB7XG5cdCAgICAgICAgICByZXR1cm4gc3RlcDtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdnZXRDdXJyZW50U3RlcCcsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0Q3VycmVudFN0ZXAoKSB7XG5cdCAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRTdGVwO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ25leHQnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIG5leHQoKSB7XG5cdCAgICAgIHZhciBpbmRleCA9IHRoaXMuc3RlcHMuaW5kZXhPZih0aGlzLmN1cnJlbnRTdGVwKTtcblxuXHQgICAgICBpZiAoaW5kZXggPT09IHRoaXMuc3RlcHMubGVuZ3RoIC0gMSkge1xuXHQgICAgICAgIHRoaXMuaGlkZShpbmRleCk7XG5cdCAgICAgICAgdGhpcy50cmlnZ2VyKCdjb21wbGV0ZScpO1xuXHQgICAgICAgIHRoaXMuZG9uZSgpO1xuXHQgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIHRoaXMuc2hvdyhpbmRleCArIDEsIHRydWUpO1xuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnYmFjaycsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gYmFjaygpIHtcblx0ICAgICAgdmFyIGluZGV4ID0gdGhpcy5zdGVwcy5pbmRleE9mKHRoaXMuY3VycmVudFN0ZXApO1xuXHQgICAgICB0aGlzLnNob3coaW5kZXggLSAxLCBmYWxzZSk7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnY2FuY2VsJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBjYW5jZWwoKSB7XG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5jdXJyZW50U3RlcCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICB0aGlzLmN1cnJlbnRTdGVwLmhpZGUoKTtcblx0ICAgICAgfVxuXHQgICAgICB0aGlzLnRyaWdnZXIoJ2NhbmNlbCcpO1xuXHQgICAgICB0aGlzLmRvbmUoKTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdjb21wbGV0ZScsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gY29tcGxldGUoKSB7XG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5jdXJyZW50U3RlcCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICB0aGlzLmN1cnJlbnRTdGVwLmhpZGUoKTtcblx0ICAgICAgfVxuXHQgICAgICB0aGlzLnRyaWdnZXIoJ2NvbXBsZXRlJyk7XG5cdCAgICAgIHRoaXMuZG9uZSgpO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2hpZGUnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGhpZGUoKSB7XG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5jdXJyZW50U3RlcCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICB0aGlzLmN1cnJlbnRTdGVwLmhpZGUoKTtcblx0ICAgICAgfVxuXHQgICAgICB0aGlzLnRyaWdnZXIoJ2hpZGUnKTtcblx0ICAgICAgdGhpcy5kb25lKCk7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnZG9uZScsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gZG9uZSgpIHtcblx0ICAgICAgU2hlcGhlcmQuYWN0aXZlVG91ciA9IG51bGw7XG5cdCAgICAgIHJlbW92ZUNsYXNzKGRvY3VtZW50LmJvZHksICdzaGVwaGVyZC1hY3RpdmUnKTtcblx0ICAgICAgdGhpcy50cmlnZ2VyKCdpbmFjdGl2ZScsIHsgdG91cjogdGhpcyB9KTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdzaG93Jyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBzaG93KCkge1xuXHQgICAgICB2YXIga2V5ID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gMCA6IGFyZ3VtZW50c1swXTtcblx0ICAgICAgdmFyIGZvcndhcmQgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDEgfHwgYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyB0cnVlIDogYXJndW1lbnRzWzFdO1xuXG5cdCAgICAgIGlmICh0aGlzLmN1cnJlbnRTdGVwKSB7XG5cdCAgICAgICAgdGhpcy5jdXJyZW50U3RlcC5oaWRlKCk7XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgYWRkQ2xhc3MoZG9jdW1lbnQuYm9keSwgJ3NoZXBoZXJkLWFjdGl2ZScpO1xuXHQgICAgICAgIHRoaXMudHJpZ2dlcignYWN0aXZlJywgeyB0b3VyOiB0aGlzIH0pO1xuXHQgICAgICB9XG5cblx0ICAgICAgU2hlcGhlcmQuYWN0aXZlVG91ciA9IHRoaXM7XG5cblx0ICAgICAgdmFyIG5leHQgPSB1bmRlZmluZWQ7XG5cblx0ICAgICAgaWYgKHR5cGVvZiBrZXkgPT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgbmV4dCA9IHRoaXMuZ2V0QnlJZChrZXkpO1xuXHQgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIG5leHQgPSB0aGlzLnN0ZXBzW2tleV07XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAobmV4dCkge1xuXHQgICAgICAgIGlmICh0eXBlb2YgbmV4dC5vcHRpb25zLnNob3dPbiAhPT0gJ3VuZGVmaW5lZCcgJiYgIW5leHQub3B0aW9ucy5zaG93T24oKSkge1xuXHQgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5zdGVwcy5pbmRleE9mKG5leHQpO1xuXHQgICAgICAgICAgdmFyIG5leHRJbmRleCA9IGZvcndhcmQgPyBpbmRleCArIDEgOiBpbmRleCAtIDE7XG5cdCAgICAgICAgICB0aGlzLnNob3cobmV4dEluZGV4LCBmb3J3YXJkKTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgdGhpcy50cmlnZ2VyKCdzaG93Jywge1xuXHQgICAgICAgICAgICBzdGVwOiBuZXh0LFxuXHQgICAgICAgICAgICBwcmV2aW91czogdGhpcy5jdXJyZW50U3RlcFxuXHQgICAgICAgICAgfSk7XG5cblx0ICAgICAgICAgIHRoaXMuY3VycmVudFN0ZXAgPSBuZXh0O1xuXHQgICAgICAgICAgbmV4dC5zaG93KCk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnc3RhcnQnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIHN0YXJ0KCkge1xuXHQgICAgICB0aGlzLnRyaWdnZXIoJ3N0YXJ0Jyk7XG5cblx0ICAgICAgdGhpcy5jdXJyZW50U3RlcCA9IG51bGw7XG5cdCAgICAgIHRoaXMubmV4dCgpO1xuXHQgICAgfVxuXHQgIH1dKTtcblxuXHQgIHJldHVybiBUb3VyO1xuXHR9KShFdmVudGVkKTtcblxuXHRleHRlbmQoU2hlcGhlcmQsIHsgVG91cjogVG91ciwgU3RlcDogU3RlcCwgRXZlbnRlZDogRXZlbnRlZCB9KTtcblx0cmV0dXJuIFNoZXBoZXJkO1xuXG5cdH0pKTtcblxuXG4vKioqLyB9LFxuLyogOSAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0dmFyIF9fV0VCUEFDS19BTURfREVGSU5FX0ZBQ1RPUllfXywgX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX187LyohIHRldGhlciAxLjIuMCAqL1xuXG5cdChmdW5jdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdCAgaWYgKHRydWUpIHtcblx0ICAgICEoX19XRUJQQUNLX0FNRF9ERUZJTkVfRkFDVE9SWV9fID0gKGZhY3RvcnkpLCBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXyA9ICh0eXBlb2YgX19XRUJQQUNLX0FNRF9ERUZJTkVfRkFDVE9SWV9fID09PSAnZnVuY3Rpb24nID8gKF9fV0VCUEFDS19BTURfREVGSU5FX0ZBQ1RPUllfXy5jYWxsKGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18sIGV4cG9ydHMsIG1vZHVsZSkpIDogX19XRUJQQUNLX0FNRF9ERUZJTkVfRkFDVE9SWV9fKSwgX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX18gIT09IHVuZGVmaW5lZCAmJiAobW9kdWxlLmV4cG9ydHMgPSBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXykpO1xuXHQgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKTtcblx0ICB9IGVsc2Uge1xuXHQgICAgcm9vdC5UZXRoZXIgPSBmYWN0b3J5KCk7XG5cdCAgfVxuXHR9KHRoaXMsIGZ1bmN0aW9uKHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSkge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmICgndmFsdWUnIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5cdGZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG5cdHZhciBUZXRoZXJCYXNlID0gdW5kZWZpbmVkO1xuXHRpZiAodHlwZW9mIFRldGhlckJhc2UgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgVGV0aGVyQmFzZSA9IHsgbW9kdWxlczogW10gfTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldFNjcm9sbFBhcmVudChlbCkge1xuXHQgIC8vIEluIGZpcmVmb3ggaWYgdGhlIGVsIGlzIGluc2lkZSBhbiBpZnJhbWUgd2l0aCBkaXNwbGF5OiBub25lOyB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSgpIHdpbGwgcmV0dXJuIG51bGw7XG5cdCAgLy8gaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NTQ4Mzk3XG5cdCAgdmFyIGNvbXB1dGVkU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsKSB8fCB7fTtcblx0ICB2YXIgcG9zaXRpb24gPSBjb21wdXRlZFN0eWxlLnBvc2l0aW9uO1xuXG5cdCAgaWYgKHBvc2l0aW9uID09PSAnZml4ZWQnKSB7XG5cdCAgICByZXR1cm4gZWw7XG5cdCAgfVxuXG5cdCAgdmFyIHBhcmVudCA9IGVsO1xuXHQgIHdoaWxlIChwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZSkge1xuXHQgICAgdmFyIHN0eWxlID0gdW5kZWZpbmVkO1xuXHQgICAgdHJ5IHtcblx0ICAgICAgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHBhcmVudCk7XG5cdCAgICB9IGNhdGNoIChlcnIpIHt9XG5cblx0ICAgIGlmICh0eXBlb2Ygc3R5bGUgPT09ICd1bmRlZmluZWQnIHx8IHN0eWxlID09PSBudWxsKSB7XG5cdCAgICAgIHJldHVybiBwYXJlbnQ7XG5cdCAgICB9XG5cblx0ICAgIHZhciBfc3R5bGUgPSBzdHlsZTtcblx0ICAgIHZhciBvdmVyZmxvdyA9IF9zdHlsZS5vdmVyZmxvdztcblx0ICAgIHZhciBvdmVyZmxvd1ggPSBfc3R5bGUub3ZlcmZsb3dYO1xuXHQgICAgdmFyIG92ZXJmbG93WSA9IF9zdHlsZS5vdmVyZmxvd1k7XG5cblx0ICAgIGlmICgvKGF1dG98c2Nyb2xsKS8udGVzdChvdmVyZmxvdyArIG92ZXJmbG93WSArIG92ZXJmbG93WCkpIHtcblx0ICAgICAgaWYgKHBvc2l0aW9uICE9PSAnYWJzb2x1dGUnIHx8IFsncmVsYXRpdmUnLCAnYWJzb2x1dGUnLCAnZml4ZWQnXS5pbmRleE9mKHN0eWxlLnBvc2l0aW9uKSA+PSAwKSB7XG5cdCAgICAgICAgcmV0dXJuIHBhcmVudDtcblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH1cblxuXHQgIHJldHVybiBkb2N1bWVudC5ib2R5O1xuXHR9XG5cblx0dmFyIHVuaXF1ZUlkID0gKGZ1bmN0aW9uICgpIHtcblx0ICB2YXIgaWQgPSAwO1xuXHQgIHJldHVybiBmdW5jdGlvbiAoKSB7XG5cdCAgICByZXR1cm4gKytpZDtcblx0ICB9O1xuXHR9KSgpO1xuXG5cdHZhciB6ZXJvUG9zQ2FjaGUgPSB7fTtcblx0dmFyIGdldE9yaWdpbiA9IGZ1bmN0aW9uIGdldE9yaWdpbihkb2MpIHtcblx0ICAvLyBnZXRCb3VuZGluZ0NsaWVudFJlY3QgaXMgdW5mb3J0dW5hdGVseSB0b28gYWNjdXJhdGUuICBJdCBpbnRyb2R1Y2VzIGEgcGl4ZWwgb3IgdHdvIG9mXG5cdCAgLy8gaml0dGVyIGFzIHRoZSB1c2VyIHNjcm9sbHMgdGhhdCBtZXNzZXMgd2l0aCBvdXIgYWJpbGl0eSB0byBkZXRlY3QgaWYgdHdvIHBvc2l0aW9uc1xuXHQgIC8vIGFyZSBlcXVpdmlsYW50IG9yIG5vdC4gIFdlIHBsYWNlIGFuIGVsZW1lbnQgYXQgdGhlIHRvcCBsZWZ0IG9mIHRoZSBwYWdlIHRoYXQgd2lsbFxuXHQgIC8vIGdldCB0aGUgc2FtZSBqaXR0ZXIsIHNvIHdlIGNhbiBjYW5jZWwgdGhlIHR3byBvdXQuXG5cdCAgdmFyIG5vZGUgPSBkb2MuX3RldGhlclplcm9FbGVtZW50O1xuXHQgIGlmICh0eXBlb2Ygbm9kZSA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIG5vZGUgPSBkb2MuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdCAgICBub2RlLnNldEF0dHJpYnV0ZSgnZGF0YS10ZXRoZXItaWQnLCB1bmlxdWVJZCgpKTtcblx0ICAgIGV4dGVuZChub2RlLnN0eWxlLCB7XG5cdCAgICAgIHRvcDogMCxcblx0ICAgICAgbGVmdDogMCxcblx0ICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcblx0ICAgIH0pO1xuXG5cdCAgICBkb2MuYm9keS5hcHBlbmRDaGlsZChub2RlKTtcblxuXHQgICAgZG9jLl90ZXRoZXJaZXJvRWxlbWVudCA9IG5vZGU7XG5cdCAgfVxuXG5cdCAgdmFyIGlkID0gbm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtdGV0aGVyLWlkJyk7XG5cdCAgaWYgKHR5cGVvZiB6ZXJvUG9zQ2FjaGVbaWRdID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgemVyb1Bvc0NhY2hlW2lkXSA9IHt9O1xuXG5cdCAgICB2YXIgcmVjdCA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdCAgICBmb3IgKHZhciBrIGluIHJlY3QpIHtcblx0ICAgICAgLy8gQ2FuJ3QgdXNlIGV4dGVuZCwgYXMgb24gSUU5LCBlbGVtZW50cyBkb24ndCByZXNvbHZlIHRvIGJlIGhhc093blByb3BlcnR5XG5cdCAgICAgIHplcm9Qb3NDYWNoZVtpZF1ba10gPSByZWN0W2tdO1xuXHQgICAgfVxuXG5cdCAgICAvLyBDbGVhciB0aGUgY2FjaGUgd2hlbiB0aGlzIHBvc2l0aW9uIGNhbGwgaXMgZG9uZVxuXHQgICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuXHQgICAgICBkZWxldGUgemVyb1Bvc0NhY2hlW2lkXTtcblx0ICAgIH0pO1xuXHQgIH1cblxuXHQgIHJldHVybiB6ZXJvUG9zQ2FjaGVbaWRdO1xuXHR9O1xuXG5cdGZ1bmN0aW9uIGdldEJvdW5kcyhlbCkge1xuXHQgIHZhciBkb2MgPSB1bmRlZmluZWQ7XG5cdCAgaWYgKGVsID09PSBkb2N1bWVudCkge1xuXHQgICAgZG9jID0gZG9jdW1lbnQ7XG5cdCAgICBlbCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblx0ICB9IGVsc2Uge1xuXHQgICAgZG9jID0gZWwub3duZXJEb2N1bWVudDtcblx0ICB9XG5cblx0ICB2YXIgZG9jRWwgPSBkb2MuZG9jdW1lbnRFbGVtZW50O1xuXG5cdCAgdmFyIGJveCA9IHt9O1xuXHQgIC8vIFRoZSBvcmlnaW5hbCBvYmplY3QgcmV0dXJuZWQgYnkgZ2V0Qm91bmRpbmdDbGllbnRSZWN0IGlzIGltbXV0YWJsZSwgc28gd2UgY2xvbmUgaXRcblx0ICAvLyBXZSBjYW4ndCB1c2UgZXh0ZW5kIGJlY2F1c2UgdGhlIHByb3BlcnRpZXMgYXJlIG5vdCBjb25zaWRlcmVkIHBhcnQgb2YgdGhlIG9iamVjdCBieSBoYXNPd25Qcm9wZXJ0eSBpbiBJRTlcblx0ICB2YXIgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHQgIGZvciAodmFyIGsgaW4gcmVjdCkge1xuXHQgICAgYm94W2tdID0gcmVjdFtrXTtcblx0ICB9XG5cblx0ICB2YXIgb3JpZ2luID0gZ2V0T3JpZ2luKGRvYyk7XG5cblx0ICBib3gudG9wIC09IG9yaWdpbi50b3A7XG5cdCAgYm94LmxlZnQgLT0gb3JpZ2luLmxlZnQ7XG5cblx0ICBpZiAodHlwZW9mIGJveC53aWR0aCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIGJveC53aWR0aCA9IGRvY3VtZW50LmJvZHkuc2Nyb2xsV2lkdGggLSBib3gubGVmdCAtIGJveC5yaWdodDtcblx0ICB9XG5cdCAgaWYgKHR5cGVvZiBib3guaGVpZ2h0ID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgYm94LmhlaWdodCA9IGRvY3VtZW50LmJvZHkuc2Nyb2xsSGVpZ2h0IC0gYm94LnRvcCAtIGJveC5ib3R0b207XG5cdCAgfVxuXG5cdCAgYm94LnRvcCA9IGJveC50b3AgLSBkb2NFbC5jbGllbnRUb3A7XG5cdCAgYm94LmxlZnQgPSBib3gubGVmdCAtIGRvY0VsLmNsaWVudExlZnQ7XG5cdCAgYm94LnJpZ2h0ID0gZG9jLmJvZHkuY2xpZW50V2lkdGggLSBib3gud2lkdGggLSBib3gubGVmdDtcblx0ICBib3guYm90dG9tID0gZG9jLmJvZHkuY2xpZW50SGVpZ2h0IC0gYm94LmhlaWdodCAtIGJveC50b3A7XG5cblx0ICByZXR1cm4gYm94O1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0T2Zmc2V0UGFyZW50KGVsKSB7XG5cdCAgcmV0dXJuIGVsLm9mZnNldFBhcmVudCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRTY3JvbGxCYXJTaXplKCkge1xuXHQgIHZhciBpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHQgIGlubmVyLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuXHQgIGlubmVyLnN0eWxlLmhlaWdodCA9ICcyMDBweCc7XG5cblx0ICB2YXIgb3V0ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0ICBleHRlbmQob3V0ZXIuc3R5bGUsIHtcblx0ICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuXHQgICAgdG9wOiAwLFxuXHQgICAgbGVmdDogMCxcblx0ICAgIHBvaW50ZXJFdmVudHM6ICdub25lJyxcblx0ICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nLFxuXHQgICAgd2lkdGg6ICcyMDBweCcsXG5cdCAgICBoZWlnaHQ6ICcxNTBweCcsXG5cdCAgICBvdmVyZmxvdzogJ2hpZGRlbidcblx0ICB9KTtcblxuXHQgIG91dGVyLmFwcGVuZENoaWxkKGlubmVyKTtcblxuXHQgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQob3V0ZXIpO1xuXG5cdCAgdmFyIHdpZHRoQ29udGFpbmVkID0gaW5uZXIub2Zmc2V0V2lkdGg7XG5cdCAgb3V0ZXIuc3R5bGUub3ZlcmZsb3cgPSAnc2Nyb2xsJztcblx0ICB2YXIgd2lkdGhTY3JvbGwgPSBpbm5lci5vZmZzZXRXaWR0aDtcblxuXHQgIGlmICh3aWR0aENvbnRhaW5lZCA9PT0gd2lkdGhTY3JvbGwpIHtcblx0ICAgIHdpZHRoU2Nyb2xsID0gb3V0ZXIuY2xpZW50V2lkdGg7XG5cdCAgfVxuXG5cdCAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChvdXRlcik7XG5cblx0ICB2YXIgd2lkdGggPSB3aWR0aENvbnRhaW5lZCAtIHdpZHRoU2Nyb2xsO1xuXG5cdCAgcmV0dXJuIHsgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IHdpZHRoIH07XG5cdH1cblxuXHRmdW5jdGlvbiBleHRlbmQoKSB7XG5cdCAgdmFyIG91dCA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzBdO1xuXG5cdCAgdmFyIGFyZ3MgPSBbXTtcblxuXHQgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG5cblx0ICBhcmdzLnNsaWNlKDEpLmZvckVhY2goZnVuY3Rpb24gKG9iaikge1xuXHQgICAgaWYgKG9iaikge1xuXHQgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG5cdCAgICAgICAgaWYgKCh7fSkuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHtcblx0ICAgICAgICAgIG91dFtrZXldID0gb2JqW2tleV07XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfSk7XG5cblx0ICByZXR1cm4gb3V0O1xuXHR9XG5cblx0ZnVuY3Rpb24gcmVtb3ZlQ2xhc3MoZWwsIG5hbWUpIHtcblx0ICBpZiAodHlwZW9mIGVsLmNsYXNzTGlzdCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIG5hbWUuc3BsaXQoJyAnKS5mb3JFYWNoKGZ1bmN0aW9uIChjbHMpIHtcblx0ICAgICAgaWYgKGNscy50cmltKCkpIHtcblx0ICAgICAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKGNscyk7XG5cdCAgICAgIH1cblx0ICAgIH0pO1xuXHQgIH0gZWxzZSB7XG5cdCAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKCcoXnwgKScgKyBuYW1lLnNwbGl0KCcgJykuam9pbignfCcpICsgJyggfCQpJywgJ2dpJyk7XG5cdCAgICB2YXIgY2xhc3NOYW1lID0gZ2V0Q2xhc3NOYW1lKGVsKS5yZXBsYWNlKHJlZ2V4LCAnICcpO1xuXHQgICAgc2V0Q2xhc3NOYW1lKGVsLCBjbGFzc05hbWUpO1xuXHQgIH1cblx0fVxuXG5cdGZ1bmN0aW9uIGFkZENsYXNzKGVsLCBuYW1lKSB7XG5cdCAgaWYgKHR5cGVvZiBlbC5jbGFzc0xpc3QgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICBuYW1lLnNwbGl0KCcgJykuZm9yRWFjaChmdW5jdGlvbiAoY2xzKSB7XG5cdCAgICAgIGlmIChjbHMudHJpbSgpKSB7XG5cdCAgICAgICAgZWwuY2xhc3NMaXN0LmFkZChjbHMpO1xuXHQgICAgICB9XG5cdCAgICB9KTtcblx0ICB9IGVsc2Uge1xuXHQgICAgcmVtb3ZlQ2xhc3MoZWwsIG5hbWUpO1xuXHQgICAgdmFyIGNscyA9IGdldENsYXNzTmFtZShlbCkgKyAoJyAnICsgbmFtZSk7XG5cdCAgICBzZXRDbGFzc05hbWUoZWwsIGNscyk7XG5cdCAgfVxuXHR9XG5cblx0ZnVuY3Rpb24gaGFzQ2xhc3MoZWwsIG5hbWUpIHtcblx0ICBpZiAodHlwZW9mIGVsLmNsYXNzTGlzdCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIHJldHVybiBlbC5jbGFzc0xpc3QuY29udGFpbnMobmFtZSk7XG5cdCAgfVxuXHQgIHZhciBjbGFzc05hbWUgPSBnZXRDbGFzc05hbWUoZWwpO1xuXHQgIHJldHVybiBuZXcgUmVnRXhwKCcoXnwgKScgKyBuYW1lICsgJyggfCQpJywgJ2dpJykudGVzdChjbGFzc05hbWUpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0Q2xhc3NOYW1lKGVsKSB7XG5cdCAgaWYgKGVsLmNsYXNzTmFtZSBpbnN0YW5jZW9mIFNWR0FuaW1hdGVkU3RyaW5nKSB7XG5cdCAgICByZXR1cm4gZWwuY2xhc3NOYW1lLmJhc2VWYWw7XG5cdCAgfVxuXHQgIHJldHVybiBlbC5jbGFzc05hbWU7XG5cdH1cblxuXHRmdW5jdGlvbiBzZXRDbGFzc05hbWUoZWwsIGNsYXNzTmFtZSkge1xuXHQgIGVsLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCBjbGFzc05hbWUpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdXBkYXRlQ2xhc3NlcyhlbCwgYWRkLCBhbGwpIHtcblx0ICAvLyBPZiB0aGUgc2V0IG9mICdhbGwnIGNsYXNzZXMsIHdlIG5lZWQgdGhlICdhZGQnIGNsYXNzZXMsIGFuZCBvbmx5IHRoZVxuXHQgIC8vICdhZGQnIGNsYXNzZXMgdG8gYmUgc2V0LlxuXHQgIGFsbC5mb3JFYWNoKGZ1bmN0aW9uIChjbHMpIHtcblx0ICAgIGlmIChhZGQuaW5kZXhPZihjbHMpID09PSAtMSAmJiBoYXNDbGFzcyhlbCwgY2xzKSkge1xuXHQgICAgICByZW1vdmVDbGFzcyhlbCwgY2xzKTtcblx0ICAgIH1cblx0ICB9KTtcblxuXHQgIGFkZC5mb3JFYWNoKGZ1bmN0aW9uIChjbHMpIHtcblx0ICAgIGlmICghaGFzQ2xhc3MoZWwsIGNscykpIHtcblx0ICAgICAgYWRkQ2xhc3MoZWwsIGNscyk7XG5cdCAgICB9XG5cdCAgfSk7XG5cdH1cblxuXHR2YXIgZGVmZXJyZWQgPSBbXTtcblxuXHR2YXIgZGVmZXIgPSBmdW5jdGlvbiBkZWZlcihmbikge1xuXHQgIGRlZmVycmVkLnB1c2goZm4pO1xuXHR9O1xuXG5cdHZhciBmbHVzaCA9IGZ1bmN0aW9uIGZsdXNoKCkge1xuXHQgIHZhciBmbiA9IHVuZGVmaW5lZDtcblx0ICB3aGlsZSAoZm4gPSBkZWZlcnJlZC5wb3AoKSkge1xuXHQgICAgZm4oKTtcblx0ICB9XG5cdH07XG5cblx0dmFyIEV2ZW50ZWQgPSAoZnVuY3Rpb24gKCkge1xuXHQgIGZ1bmN0aW9uIEV2ZW50ZWQoKSB7XG5cdCAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRXZlbnRlZCk7XG5cdCAgfVxuXG5cdCAgX2NyZWF0ZUNsYXNzKEV2ZW50ZWQsIFt7XG5cdCAgICBrZXk6ICdvbicsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gb24oZXZlbnQsIGhhbmRsZXIsIGN0eCkge1xuXHQgICAgICB2YXIgb25jZSA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMyB8fCBhcmd1bWVudHNbM10gPT09IHVuZGVmaW5lZCA/IGZhbHNlIDogYXJndW1lbnRzWzNdO1xuXG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5iaW5kaW5ncyA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICB0aGlzLmJpbmRpbmdzID0ge307XG5cdCAgICAgIH1cblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLmJpbmRpbmdzW2V2ZW50XSA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICB0aGlzLmJpbmRpbmdzW2V2ZW50XSA9IFtdO1xuXHQgICAgICB9XG5cdCAgICAgIHRoaXMuYmluZGluZ3NbZXZlbnRdLnB1c2goeyBoYW5kbGVyOiBoYW5kbGVyLCBjdHg6IGN0eCwgb25jZTogb25jZSB9KTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdvbmNlJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBvbmNlKGV2ZW50LCBoYW5kbGVyLCBjdHgpIHtcblx0ICAgICAgdGhpcy5vbihldmVudCwgaGFuZGxlciwgY3R4LCB0cnVlKTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdvZmYnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIG9mZihldmVudCwgaGFuZGxlcikge1xuXHQgICAgICBpZiAodHlwZW9mIHRoaXMuYmluZGluZ3MgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiB0aGlzLmJpbmRpbmdzW2V2ZW50XSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICByZXR1cm47XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAodHlwZW9mIGhhbmRsZXIgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgZGVsZXRlIHRoaXMuYmluZGluZ3NbZXZlbnRdO1xuXHQgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIHZhciBpID0gMDtcblx0ICAgICAgICB3aGlsZSAoaSA8IHRoaXMuYmluZGluZ3NbZXZlbnRdLmxlbmd0aCkge1xuXHQgICAgICAgICAgaWYgKHRoaXMuYmluZGluZ3NbZXZlbnRdW2ldLmhhbmRsZXIgPT09IGhhbmRsZXIpIHtcblx0ICAgICAgICAgICAgdGhpcy5iaW5kaW5nc1tldmVudF0uc3BsaWNlKGksIDEpO1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgKytpO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ3RyaWdnZXInLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIHRyaWdnZXIoZXZlbnQpIHtcblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLmJpbmRpbmdzICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLmJpbmRpbmdzW2V2ZW50XSkge1xuXHQgICAgICAgIHZhciBpID0gMDtcblxuXHQgICAgICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gQXJyYXkoX2xlbiA+IDEgPyBfbGVuIC0gMSA6IDApLCBfa2V5ID0gMTsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuXHQgICAgICAgICAgYXJnc1tfa2V5IC0gMV0gPSBhcmd1bWVudHNbX2tleV07XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgd2hpbGUgKGkgPCB0aGlzLmJpbmRpbmdzW2V2ZW50XS5sZW5ndGgpIHtcblx0ICAgICAgICAgIHZhciBfYmluZGluZ3MkZXZlbnQkaSA9IHRoaXMuYmluZGluZ3NbZXZlbnRdW2ldO1xuXHQgICAgICAgICAgdmFyIGhhbmRsZXIgPSBfYmluZGluZ3MkZXZlbnQkaS5oYW5kbGVyO1xuXHQgICAgICAgICAgdmFyIGN0eCA9IF9iaW5kaW5ncyRldmVudCRpLmN0eDtcblx0ICAgICAgICAgIHZhciBvbmNlID0gX2JpbmRpbmdzJGV2ZW50JGkub25jZTtcblxuXHQgICAgICAgICAgdmFyIGNvbnRleHQgPSBjdHg7XG5cdCAgICAgICAgICBpZiAodHlwZW9mIGNvbnRleHQgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgICAgIGNvbnRleHQgPSB0aGlzO1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBoYW5kbGVyLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXG5cdCAgICAgICAgICBpZiAob25jZSkge1xuXHQgICAgICAgICAgICB0aGlzLmJpbmRpbmdzW2V2ZW50XS5zcGxpY2UoaSwgMSk7XG5cdCAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICArK2k7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfV0pO1xuXG5cdCAgcmV0dXJuIEV2ZW50ZWQ7XG5cdH0pKCk7XG5cblx0VGV0aGVyQmFzZS5VdGlscyA9IHtcblx0ICBnZXRTY3JvbGxQYXJlbnQ6IGdldFNjcm9sbFBhcmVudCxcblx0ICBnZXRCb3VuZHM6IGdldEJvdW5kcyxcblx0ICBnZXRPZmZzZXRQYXJlbnQ6IGdldE9mZnNldFBhcmVudCxcblx0ICBleHRlbmQ6IGV4dGVuZCxcblx0ICBhZGRDbGFzczogYWRkQ2xhc3MsXG5cdCAgcmVtb3ZlQ2xhc3M6IHJlbW92ZUNsYXNzLFxuXHQgIGhhc0NsYXNzOiBoYXNDbGFzcyxcblx0ICB1cGRhdGVDbGFzc2VzOiB1cGRhdGVDbGFzc2VzLFxuXHQgIGRlZmVyOiBkZWZlcixcblx0ICBmbHVzaDogZmx1c2gsXG5cdCAgdW5pcXVlSWQ6IHVuaXF1ZUlkLFxuXHQgIEV2ZW50ZWQ6IEV2ZW50ZWQsXG5cdCAgZ2V0U2Nyb2xsQmFyU2l6ZTogZ2V0U2Nyb2xsQmFyU2l6ZVxuXHR9O1xuXHQvKiBnbG9iYWxzIFRldGhlckJhc2UsIHBlcmZvcm1hbmNlICovXG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBfc2xpY2VkVG9BcnJheSA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIHNsaWNlSXRlcmF0b3IoYXJyLCBpKSB7IHZhciBfYXJyID0gW107IHZhciBfbiA9IHRydWU7IHZhciBfZCA9IGZhbHNlOyB2YXIgX2UgPSB1bmRlZmluZWQ7IHRyeSB7IGZvciAodmFyIF9pID0gYXJyW1N5bWJvbC5pdGVyYXRvcl0oKSwgX3M7ICEoX24gPSAoX3MgPSBfaS5uZXh0KCkpLmRvbmUpOyBfbiA9IHRydWUpIHsgX2Fyci5wdXNoKF9zLnZhbHVlKTsgaWYgKGkgJiYgX2Fyci5sZW5ndGggPT09IGkpIGJyZWFrOyB9IH0gY2F0Y2ggKGVycikgeyBfZCA9IHRydWU7IF9lID0gZXJyOyB9IGZpbmFsbHkgeyB0cnkgeyBpZiAoIV9uICYmIF9pWydyZXR1cm4nXSkgX2lbJ3JldHVybiddKCk7IH0gZmluYWxseSB7IGlmIChfZCkgdGhyb3cgX2U7IH0gfSByZXR1cm4gX2FycjsgfSByZXR1cm4gZnVuY3Rpb24gKGFyciwgaSkgeyBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7IHJldHVybiBhcnI7IH0gZWxzZSBpZiAoU3ltYm9sLml0ZXJhdG9yIGluIE9iamVjdChhcnIpKSB7IHJldHVybiBzbGljZUl0ZXJhdG9yKGFyciwgaSk7IH0gZWxzZSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgYXR0ZW1wdCB0byBkZXN0cnVjdHVyZSBub24taXRlcmFibGUgaW5zdGFuY2UnKTsgfSB9OyB9KSgpO1xuXG5cdHZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKCd2YWx1ZScgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cblx0ZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cblx0aWYgKHR5cGVvZiBUZXRoZXJCYXNlID09PSAndW5kZWZpbmVkJykge1xuXHQgIHRocm93IG5ldyBFcnJvcignWW91IG11c3QgaW5jbHVkZSB0aGUgdXRpbHMuanMgZmlsZSBiZWZvcmUgdGV0aGVyLmpzJyk7XG5cdH1cblxuXHR2YXIgX1RldGhlckJhc2UkVXRpbHMgPSBUZXRoZXJCYXNlLlV0aWxzO1xuXHR2YXIgZ2V0U2Nyb2xsUGFyZW50ID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0U2Nyb2xsUGFyZW50O1xuXHR2YXIgZ2V0Qm91bmRzID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0Qm91bmRzO1xuXHR2YXIgZ2V0T2Zmc2V0UGFyZW50ID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0T2Zmc2V0UGFyZW50O1xuXHR2YXIgZXh0ZW5kID0gX1RldGhlckJhc2UkVXRpbHMuZXh0ZW5kO1xuXHR2YXIgYWRkQ2xhc3MgPSBfVGV0aGVyQmFzZSRVdGlscy5hZGRDbGFzcztcblx0dmFyIHJlbW92ZUNsYXNzID0gX1RldGhlckJhc2UkVXRpbHMucmVtb3ZlQ2xhc3M7XG5cdHZhciB1cGRhdGVDbGFzc2VzID0gX1RldGhlckJhc2UkVXRpbHMudXBkYXRlQ2xhc3Nlcztcblx0dmFyIGRlZmVyID0gX1RldGhlckJhc2UkVXRpbHMuZGVmZXI7XG5cdHZhciBmbHVzaCA9IF9UZXRoZXJCYXNlJFV0aWxzLmZsdXNoO1xuXHR2YXIgZ2V0U2Nyb2xsQmFyU2l6ZSA9IF9UZXRoZXJCYXNlJFV0aWxzLmdldFNjcm9sbEJhclNpemU7XG5cblx0ZnVuY3Rpb24gd2l0aGluKGEsIGIpIHtcblx0ICB2YXIgZGlmZiA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMiB8fCBhcmd1bWVudHNbMl0gPT09IHVuZGVmaW5lZCA/IDEgOiBhcmd1bWVudHNbMl07XG5cblx0ICByZXR1cm4gYSArIGRpZmYgPj0gYiAmJiBiID49IGEgLSBkaWZmO1xuXHR9XG5cblx0dmFyIHRyYW5zZm9ybUtleSA9IChmdW5jdGlvbiAoKSB7XG5cdCAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIHJldHVybiAnJztcblx0ICB9XG5cdCAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cblx0ICB2YXIgdHJhbnNmb3JtcyA9IFsndHJhbnNmb3JtJywgJ3dlYmtpdFRyYW5zZm9ybScsICdPVHJhbnNmb3JtJywgJ01velRyYW5zZm9ybScsICdtc1RyYW5zZm9ybSddO1xuXHQgIGZvciAodmFyIGkgPSAwOyBpIDwgdHJhbnNmb3Jtcy5sZW5ndGg7ICsraSkge1xuXHQgICAgdmFyIGtleSA9IHRyYW5zZm9ybXNbaV07XG5cdCAgICBpZiAoZWwuc3R5bGVba2V5XSAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgIHJldHVybiBrZXk7XG5cdCAgICB9XG5cdCAgfVxuXHR9KSgpO1xuXG5cdHZhciB0ZXRoZXJzID0gW107XG5cblx0dmFyIHBvc2l0aW9uID0gZnVuY3Rpb24gcG9zaXRpb24oKSB7XG5cdCAgdGV0aGVycy5mb3JFYWNoKGZ1bmN0aW9uICh0ZXRoZXIpIHtcblx0ICAgIHRldGhlci5wb3NpdGlvbihmYWxzZSk7XG5cdCAgfSk7XG5cdCAgZmx1c2goKTtcblx0fTtcblxuXHRmdW5jdGlvbiBub3coKSB7XG5cdCAgaWYgKHR5cGVvZiBwZXJmb3JtYW5jZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHBlcmZvcm1hbmNlLm5vdyAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIHJldHVybiBwZXJmb3JtYW5jZS5ub3coKTtcblx0ICB9XG5cdCAgcmV0dXJuICtuZXcgRGF0ZSgpO1xuXHR9XG5cblx0KGZ1bmN0aW9uICgpIHtcblx0ICB2YXIgbGFzdENhbGwgPSBudWxsO1xuXHQgIHZhciBsYXN0RHVyYXRpb24gPSBudWxsO1xuXHQgIHZhciBwZW5kaW5nVGltZW91dCA9IG51bGw7XG5cblx0ICB2YXIgdGljayA9IGZ1bmN0aW9uIHRpY2soKSB7XG5cdCAgICBpZiAodHlwZW9mIGxhc3REdXJhdGlvbiAhPT0gJ3VuZGVmaW5lZCcgJiYgbGFzdER1cmF0aW9uID4gMTYpIHtcblx0ICAgICAgLy8gV2Ugdm9sdW50YXJpbHkgdGhyb3R0bGUgb3Vyc2VsdmVzIGlmIHdlIGNhbid0IG1hbmFnZSA2MGZwc1xuXHQgICAgICBsYXN0RHVyYXRpb24gPSBNYXRoLm1pbihsYXN0RHVyYXRpb24gLSAxNiwgMjUwKTtcblxuXHQgICAgICAvLyBKdXN0IGluIGNhc2UgdGhpcyBpcyB0aGUgbGFzdCBldmVudCwgcmVtZW1iZXIgdG8gcG9zaXRpb24ganVzdCBvbmNlIG1vcmVcblx0ICAgICAgcGVuZGluZ1RpbWVvdXQgPSBzZXRUaW1lb3V0KHRpY2ssIDI1MCk7XG5cdCAgICAgIHJldHVybjtcblx0ICAgIH1cblxuXHQgICAgaWYgKHR5cGVvZiBsYXN0Q2FsbCAhPT0gJ3VuZGVmaW5lZCcgJiYgbm93KCkgLSBsYXN0Q2FsbCA8IDEwKSB7XG5cdCAgICAgIC8vIFNvbWUgYnJvd3NlcnMgY2FsbCBldmVudHMgYSBsaXR0bGUgdG9vIGZyZXF1ZW50bHksIHJlZnVzZSB0byBydW4gbW9yZSB0aGFuIGlzIHJlYXNvbmFibGVcblx0ICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXG5cdCAgICBpZiAodHlwZW9mIHBlbmRpbmdUaW1lb3V0ICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICBjbGVhclRpbWVvdXQocGVuZGluZ1RpbWVvdXQpO1xuXHQgICAgICBwZW5kaW5nVGltZW91dCA9IG51bGw7XG5cdCAgICB9XG5cblx0ICAgIGxhc3RDYWxsID0gbm93KCk7XG5cdCAgICBwb3NpdGlvbigpO1xuXHQgICAgbGFzdER1cmF0aW9uID0gbm93KCkgLSBsYXN0Q2FsbDtcblx0ICB9O1xuXG5cdCAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICBbJ3Jlc2l6ZScsICdzY3JvbGwnLCAndG91Y2htb3ZlJ10uZm9yRWFjaChmdW5jdGlvbiAoZXZlbnQpIHtcblx0ICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIHRpY2spO1xuXHQgICAgfSk7XG5cdCAgfVxuXHR9KSgpO1xuXG5cdHZhciBNSVJST1JfTFIgPSB7XG5cdCAgY2VudGVyOiAnY2VudGVyJyxcblx0ICBsZWZ0OiAncmlnaHQnLFxuXHQgIHJpZ2h0OiAnbGVmdCdcblx0fTtcblxuXHR2YXIgTUlSUk9SX1RCID0ge1xuXHQgIG1pZGRsZTogJ21pZGRsZScsXG5cdCAgdG9wOiAnYm90dG9tJyxcblx0ICBib3R0b206ICd0b3AnXG5cdH07XG5cblx0dmFyIE9GRlNFVF9NQVAgPSB7XG5cdCAgdG9wOiAwLFxuXHQgIGxlZnQ6IDAsXG5cdCAgbWlkZGxlOiAnNTAlJyxcblx0ICBjZW50ZXI6ICc1MCUnLFxuXHQgIGJvdHRvbTogJzEwMCUnLFxuXHQgIHJpZ2h0OiAnMTAwJSdcblx0fTtcblxuXHR2YXIgYXV0b1RvRml4ZWRBdHRhY2htZW50ID0gZnVuY3Rpb24gYXV0b1RvRml4ZWRBdHRhY2htZW50KGF0dGFjaG1lbnQsIHJlbGF0aXZlVG9BdHRhY2htZW50KSB7XG5cdCAgdmFyIGxlZnQgPSBhdHRhY2htZW50LmxlZnQ7XG5cdCAgdmFyIHRvcCA9IGF0dGFjaG1lbnQudG9wO1xuXG5cdCAgaWYgKGxlZnQgPT09ICdhdXRvJykge1xuXHQgICAgbGVmdCA9IE1JUlJPUl9MUltyZWxhdGl2ZVRvQXR0YWNobWVudC5sZWZ0XTtcblx0ICB9XG5cblx0ICBpZiAodG9wID09PSAnYXV0bycpIHtcblx0ICAgIHRvcCA9IE1JUlJPUl9UQltyZWxhdGl2ZVRvQXR0YWNobWVudC50b3BdO1xuXHQgIH1cblxuXHQgIHJldHVybiB7IGxlZnQ6IGxlZnQsIHRvcDogdG9wIH07XG5cdH07XG5cblx0dmFyIGF0dGFjaG1lbnRUb09mZnNldCA9IGZ1bmN0aW9uIGF0dGFjaG1lbnRUb09mZnNldChhdHRhY2htZW50KSB7XG5cdCAgdmFyIGxlZnQgPSBhdHRhY2htZW50LmxlZnQ7XG5cdCAgdmFyIHRvcCA9IGF0dGFjaG1lbnQudG9wO1xuXG5cdCAgaWYgKHR5cGVvZiBPRkZTRVRfTUFQW2F0dGFjaG1lbnQubGVmdF0gIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICBsZWZ0ID0gT0ZGU0VUX01BUFthdHRhY2htZW50LmxlZnRdO1xuXHQgIH1cblxuXHQgIGlmICh0eXBlb2YgT0ZGU0VUX01BUFthdHRhY2htZW50LnRvcF0gIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICB0b3AgPSBPRkZTRVRfTUFQW2F0dGFjaG1lbnQudG9wXTtcblx0ICB9XG5cblx0ICByZXR1cm4geyBsZWZ0OiBsZWZ0LCB0b3A6IHRvcCB9O1xuXHR9O1xuXG5cdGZ1bmN0aW9uIGFkZE9mZnNldCgpIHtcblx0ICB2YXIgb3V0ID0geyB0b3A6IDAsIGxlZnQ6IDAgfTtcblxuXHQgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBvZmZzZXRzID0gQXJyYXkoX2xlbiksIF9rZXkgPSAwOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG5cdCAgICBvZmZzZXRzW19rZXldID0gYXJndW1lbnRzW19rZXldO1xuXHQgIH1cblxuXHQgIG9mZnNldHMuZm9yRWFjaChmdW5jdGlvbiAoX3JlZikge1xuXHQgICAgdmFyIHRvcCA9IF9yZWYudG9wO1xuXHQgICAgdmFyIGxlZnQgPSBfcmVmLmxlZnQ7XG5cblx0ICAgIGlmICh0eXBlb2YgdG9wID09PSAnc3RyaW5nJykge1xuXHQgICAgICB0b3AgPSBwYXJzZUZsb2F0KHRvcCwgMTApO1xuXHQgICAgfVxuXHQgICAgaWYgKHR5cGVvZiBsZWZ0ID09PSAnc3RyaW5nJykge1xuXHQgICAgICBsZWZ0ID0gcGFyc2VGbG9hdChsZWZ0LCAxMCk7XG5cdCAgICB9XG5cblx0ICAgIG91dC50b3AgKz0gdG9wO1xuXHQgICAgb3V0LmxlZnQgKz0gbGVmdDtcblx0ICB9KTtcblxuXHQgIHJldHVybiBvdXQ7XG5cdH1cblxuXHRmdW5jdGlvbiBvZmZzZXRUb1B4KG9mZnNldCwgc2l6ZSkge1xuXHQgIGlmICh0eXBlb2Ygb2Zmc2V0LmxlZnQgPT09ICdzdHJpbmcnICYmIG9mZnNldC5sZWZ0LmluZGV4T2YoJyUnKSAhPT0gLTEpIHtcblx0ICAgIG9mZnNldC5sZWZ0ID0gcGFyc2VGbG9hdChvZmZzZXQubGVmdCwgMTApIC8gMTAwICogc2l6ZS53aWR0aDtcblx0ICB9XG5cdCAgaWYgKHR5cGVvZiBvZmZzZXQudG9wID09PSAnc3RyaW5nJyAmJiBvZmZzZXQudG9wLmluZGV4T2YoJyUnKSAhPT0gLTEpIHtcblx0ICAgIG9mZnNldC50b3AgPSBwYXJzZUZsb2F0KG9mZnNldC50b3AsIDEwKSAvIDEwMCAqIHNpemUuaGVpZ2h0O1xuXHQgIH1cblxuXHQgIHJldHVybiBvZmZzZXQ7XG5cdH1cblxuXHR2YXIgcGFyc2VPZmZzZXQgPSBmdW5jdGlvbiBwYXJzZU9mZnNldCh2YWx1ZSkge1xuXHQgIHZhciBfdmFsdWUkc3BsaXQgPSB2YWx1ZS5zcGxpdCgnICcpO1xuXG5cdCAgdmFyIF92YWx1ZSRzcGxpdDIgPSBfc2xpY2VkVG9BcnJheShfdmFsdWUkc3BsaXQsIDIpO1xuXG5cdCAgdmFyIHRvcCA9IF92YWx1ZSRzcGxpdDJbMF07XG5cdCAgdmFyIGxlZnQgPSBfdmFsdWUkc3BsaXQyWzFdO1xuXG5cdCAgcmV0dXJuIHsgdG9wOiB0b3AsIGxlZnQ6IGxlZnQgfTtcblx0fTtcblx0dmFyIHBhcnNlQXR0YWNobWVudCA9IHBhcnNlT2Zmc2V0O1xuXG5cdHZhciBUZXRoZXJDbGFzcyA9IChmdW5jdGlvbiAoKSB7XG5cdCAgZnVuY3Rpb24gVGV0aGVyQ2xhc3Mob3B0aW9ucykge1xuXHQgICAgdmFyIF90aGlzID0gdGhpcztcblxuXHQgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFRldGhlckNsYXNzKTtcblxuXHQgICAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uYmluZCh0aGlzKTtcblxuXHQgICAgdGV0aGVycy5wdXNoKHRoaXMpO1xuXG5cdCAgICB0aGlzLmhpc3RvcnkgPSBbXTtcblxuXHQgICAgdGhpcy5zZXRPcHRpb25zKG9wdGlvbnMsIGZhbHNlKTtcblxuXHQgICAgVGV0aGVyQmFzZS5tb2R1bGVzLmZvckVhY2goZnVuY3Rpb24gKG1vZHVsZSkge1xuXHQgICAgICBpZiAodHlwZW9mIG1vZHVsZS5pbml0aWFsaXplICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIG1vZHVsZS5pbml0aWFsaXplLmNhbGwoX3RoaXMpO1xuXHQgICAgICB9XG5cdCAgICB9KTtcblxuXHQgICAgdGhpcy5wb3NpdGlvbigpO1xuXHQgIH1cblxuXHQgIF9jcmVhdGVDbGFzcyhUZXRoZXJDbGFzcywgW3tcblx0ICAgIGtleTogJ2dldENsYXNzJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRDbGFzcygpIHtcblx0ICAgICAgdmFyIGtleSA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/ICcnIDogYXJndW1lbnRzWzBdO1xuXHQgICAgICB2YXIgY2xhc3NlcyA9IHRoaXMub3B0aW9ucy5jbGFzc2VzO1xuXG5cdCAgICAgIGlmICh0eXBlb2YgY2xhc3NlcyAhPT0gJ3VuZGVmaW5lZCcgJiYgY2xhc3Nlc1trZXldKSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5jbGFzc2VzW2tleV07XG5cdCAgICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmNsYXNzUHJlZml4KSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5jbGFzc1ByZWZpeCArICctJyArIGtleTtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICByZXR1cm4ga2V5O1xuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnc2V0T3B0aW9ucycsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gc2V0T3B0aW9ucyhvcHRpb25zKSB7XG5cdCAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuXG5cdCAgICAgIHZhciBwb3MgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDEgfHwgYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyB0cnVlIDogYXJndW1lbnRzWzFdO1xuXG5cdCAgICAgIHZhciBkZWZhdWx0cyA9IHtcblx0ICAgICAgICBvZmZzZXQ6ICcwIDAnLFxuXHQgICAgICAgIHRhcmdldE9mZnNldDogJzAgMCcsXG5cdCAgICAgICAgdGFyZ2V0QXR0YWNobWVudDogJ2F1dG8gYXV0bycsXG5cdCAgICAgICAgY2xhc3NQcmVmaXg6ICd0ZXRoZXInXG5cdCAgICAgIH07XG5cblx0ICAgICAgdGhpcy5vcHRpb25zID0gZXh0ZW5kKGRlZmF1bHRzLCBvcHRpb25zKTtcblxuXHQgICAgICB2YXIgX29wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG5cdCAgICAgIHZhciBlbGVtZW50ID0gX29wdGlvbnMuZWxlbWVudDtcblx0ICAgICAgdmFyIHRhcmdldCA9IF9vcHRpb25zLnRhcmdldDtcblx0ICAgICAgdmFyIHRhcmdldE1vZGlmaWVyID0gX29wdGlvbnMudGFyZ2V0TW9kaWZpZXI7XG5cblx0ICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcblx0ICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG5cdCAgICAgIHRoaXMudGFyZ2V0TW9kaWZpZXIgPSB0YXJnZXRNb2RpZmllcjtcblxuXHQgICAgICBpZiAodGhpcy50YXJnZXQgPT09ICd2aWV3cG9ydCcpIHtcblx0ICAgICAgICB0aGlzLnRhcmdldCA9IGRvY3VtZW50LmJvZHk7XG5cdCAgICAgICAgdGhpcy50YXJnZXRNb2RpZmllciA9ICd2aXNpYmxlJztcblx0ICAgICAgfSBlbHNlIGlmICh0aGlzLnRhcmdldCA9PT0gJ3Njcm9sbC1oYW5kbGUnKSB7XG5cdCAgICAgICAgdGhpcy50YXJnZXQgPSBkb2N1bWVudC5ib2R5O1xuXHQgICAgICAgIHRoaXMudGFyZ2V0TW9kaWZpZXIgPSAnc2Nyb2xsLWhhbmRsZSc7XG5cdCAgICAgIH1cblxuXHQgICAgICBbJ2VsZW1lbnQnLCAndGFyZ2V0J10uZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG5cdCAgICAgICAgaWYgKHR5cGVvZiBfdGhpczJba2V5XSA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGV0aGVyIEVycm9yOiBCb3RoIGVsZW1lbnQgYW5kIHRhcmdldCBtdXN0IGJlIGRlZmluZWQnKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAodHlwZW9mIF90aGlzMltrZXldLmpxdWVyeSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICAgIF90aGlzMltrZXldID0gX3RoaXMyW2tleV1bMF07XG5cdCAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgX3RoaXMyW2tleV0gPT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgICBfdGhpczJba2V5XSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoX3RoaXMyW2tleV0pO1xuXHQgICAgICAgIH1cblx0ICAgICAgfSk7XG5cblx0ICAgICAgYWRkQ2xhc3ModGhpcy5lbGVtZW50LCB0aGlzLmdldENsYXNzKCdlbGVtZW50JykpO1xuXHQgICAgICBpZiAoISh0aGlzLm9wdGlvbnMuYWRkVGFyZ2V0Q2xhc3NlcyA9PT0gZmFsc2UpKSB7XG5cdCAgICAgICAgYWRkQ2xhc3ModGhpcy50YXJnZXQsIHRoaXMuZ2V0Q2xhc3MoJ3RhcmdldCcpKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICghdGhpcy5vcHRpb25zLmF0dGFjaG1lbnQpIHtcblx0ICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RldGhlciBFcnJvcjogWW91IG11c3QgcHJvdmlkZSBhbiBhdHRhY2htZW50Jyk7XG5cdCAgICAgIH1cblxuXHQgICAgICB0aGlzLnRhcmdldEF0dGFjaG1lbnQgPSBwYXJzZUF0dGFjaG1lbnQodGhpcy5vcHRpb25zLnRhcmdldEF0dGFjaG1lbnQpO1xuXHQgICAgICB0aGlzLmF0dGFjaG1lbnQgPSBwYXJzZUF0dGFjaG1lbnQodGhpcy5vcHRpb25zLmF0dGFjaG1lbnQpO1xuXHQgICAgICB0aGlzLm9mZnNldCA9IHBhcnNlT2Zmc2V0KHRoaXMub3B0aW9ucy5vZmZzZXQpO1xuXHQgICAgICB0aGlzLnRhcmdldE9mZnNldCA9IHBhcnNlT2Zmc2V0KHRoaXMub3B0aW9ucy50YXJnZXRPZmZzZXQpO1xuXG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5zY3JvbGxQYXJlbnQgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgdGhpcy5kaXNhYmxlKCk7XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAodGhpcy50YXJnZXRNb2RpZmllciA9PT0gJ3Njcm9sbC1oYW5kbGUnKSB7XG5cdCAgICAgICAgdGhpcy5zY3JvbGxQYXJlbnQgPSB0aGlzLnRhcmdldDtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICB0aGlzLnNjcm9sbFBhcmVudCA9IGdldFNjcm9sbFBhcmVudCh0aGlzLnRhcmdldCk7XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAoISh0aGlzLm9wdGlvbnMuZW5hYmxlZCA9PT0gZmFsc2UpKSB7XG5cdCAgICAgICAgdGhpcy5lbmFibGUocG9zKTtcblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2dldFRhcmdldEJvdW5kcycsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0VGFyZ2V0Qm91bmRzKCkge1xuXHQgICAgICBpZiAodHlwZW9mIHRoaXMudGFyZ2V0TW9kaWZpZXIgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgaWYgKHRoaXMudGFyZ2V0TW9kaWZpZXIgPT09ICd2aXNpYmxlJykge1xuXHQgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0ID09PSBkb2N1bWVudC5ib2R5KSB7XG5cdCAgICAgICAgICAgIHJldHVybiB7IHRvcDogcGFnZVlPZmZzZXQsIGxlZnQ6IHBhZ2VYT2Zmc2V0LCBoZWlnaHQ6IGlubmVySGVpZ2h0LCB3aWR0aDogaW5uZXJXaWR0aCB9O1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgdmFyIGJvdW5kcyA9IGdldEJvdW5kcyh0aGlzLnRhcmdldCk7XG5cblx0ICAgICAgICAgICAgdmFyIG91dCA9IHtcblx0ICAgICAgICAgICAgICBoZWlnaHQ6IGJvdW5kcy5oZWlnaHQsXG5cdCAgICAgICAgICAgICAgd2lkdGg6IGJvdW5kcy53aWR0aCxcblx0ICAgICAgICAgICAgICB0b3A6IGJvdW5kcy50b3AsXG5cdCAgICAgICAgICAgICAgbGVmdDogYm91bmRzLmxlZnRcblx0ICAgICAgICAgICAgfTtcblxuXHQgICAgICAgICAgICBvdXQuaGVpZ2h0ID0gTWF0aC5taW4ob3V0LmhlaWdodCwgYm91bmRzLmhlaWdodCAtIChwYWdlWU9mZnNldCAtIGJvdW5kcy50b3ApKTtcblx0ICAgICAgICAgICAgb3V0LmhlaWdodCA9IE1hdGgubWluKG91dC5oZWlnaHQsIGJvdW5kcy5oZWlnaHQgLSAoYm91bmRzLnRvcCArIGJvdW5kcy5oZWlnaHQgLSAocGFnZVlPZmZzZXQgKyBpbm5lckhlaWdodCkpKTtcblx0ICAgICAgICAgICAgb3V0LmhlaWdodCA9IE1hdGgubWluKGlubmVySGVpZ2h0LCBvdXQuaGVpZ2h0KTtcblx0ICAgICAgICAgICAgb3V0LmhlaWdodCAtPSAyO1xuXG5cdCAgICAgICAgICAgIG91dC53aWR0aCA9IE1hdGgubWluKG91dC53aWR0aCwgYm91bmRzLndpZHRoIC0gKHBhZ2VYT2Zmc2V0IC0gYm91bmRzLmxlZnQpKTtcblx0ICAgICAgICAgICAgb3V0LndpZHRoID0gTWF0aC5taW4ob3V0LndpZHRoLCBib3VuZHMud2lkdGggLSAoYm91bmRzLmxlZnQgKyBib3VuZHMud2lkdGggLSAocGFnZVhPZmZzZXQgKyBpbm5lcldpZHRoKSkpO1xuXHQgICAgICAgICAgICBvdXQud2lkdGggPSBNYXRoLm1pbihpbm5lcldpZHRoLCBvdXQud2lkdGgpO1xuXHQgICAgICAgICAgICBvdXQud2lkdGggLT0gMjtcblxuXHQgICAgICAgICAgICBpZiAob3V0LnRvcCA8IHBhZ2VZT2Zmc2V0KSB7XG5cdCAgICAgICAgICAgICAgb3V0LnRvcCA9IHBhZ2VZT2Zmc2V0O1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGlmIChvdXQubGVmdCA8IHBhZ2VYT2Zmc2V0KSB7XG5cdCAgICAgICAgICAgICAgb3V0LmxlZnQgPSBwYWdlWE9mZnNldDtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHJldHVybiBvdXQ7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfSBlbHNlIGlmICh0aGlzLnRhcmdldE1vZGlmaWVyID09PSAnc2Nyb2xsLWhhbmRsZScpIHtcblx0ICAgICAgICAgIHZhciBib3VuZHMgPSB1bmRlZmluZWQ7XG5cdCAgICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy50YXJnZXQ7XG5cdCAgICAgICAgICBpZiAodGFyZ2V0ID09PSBkb2N1bWVudC5ib2R5KSB7XG5cdCAgICAgICAgICAgIHRhcmdldCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblxuXHQgICAgICAgICAgICBib3VuZHMgPSB7XG5cdCAgICAgICAgICAgICAgbGVmdDogcGFnZVhPZmZzZXQsXG5cdCAgICAgICAgICAgICAgdG9wOiBwYWdlWU9mZnNldCxcblx0ICAgICAgICAgICAgICBoZWlnaHQ6IGlubmVySGVpZ2h0LFxuXHQgICAgICAgICAgICAgIHdpZHRoOiBpbm5lcldpZHRoXG5cdCAgICAgICAgICAgIH07XG5cdCAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICBib3VuZHMgPSBnZXRCb3VuZHModGFyZ2V0KTtcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgdmFyIHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZSh0YXJnZXQpO1xuXG5cdCAgICAgICAgICB2YXIgaGFzQm90dG9tU2Nyb2xsID0gdGFyZ2V0LnNjcm9sbFdpZHRoID4gdGFyZ2V0LmNsaWVudFdpZHRoIHx8IFtzdHlsZS5vdmVyZmxvdywgc3R5bGUub3ZlcmZsb3dYXS5pbmRleE9mKCdzY3JvbGwnKSA+PSAwIHx8IHRoaXMudGFyZ2V0ICE9PSBkb2N1bWVudC5ib2R5O1xuXG5cdCAgICAgICAgICB2YXIgc2Nyb2xsQm90dG9tID0gMDtcblx0ICAgICAgICAgIGlmIChoYXNCb3R0b21TY3JvbGwpIHtcblx0ICAgICAgICAgICAgc2Nyb2xsQm90dG9tID0gMTU7XG5cdCAgICAgICAgICB9XG5cblx0ICAgICAgICAgIHZhciBoZWlnaHQgPSBib3VuZHMuaGVpZ2h0IC0gcGFyc2VGbG9hdChzdHlsZS5ib3JkZXJUb3BXaWR0aCkgLSBwYXJzZUZsb2F0KHN0eWxlLmJvcmRlckJvdHRvbVdpZHRoKSAtIHNjcm9sbEJvdHRvbTtcblxuXHQgICAgICAgICAgdmFyIG91dCA9IHtcblx0ICAgICAgICAgICAgd2lkdGg6IDE1LFxuXHQgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCAqIDAuOTc1ICogKGhlaWdodCAvIHRhcmdldC5zY3JvbGxIZWlnaHQpLFxuXHQgICAgICAgICAgICBsZWZ0OiBib3VuZHMubGVmdCArIGJvdW5kcy53aWR0aCAtIHBhcnNlRmxvYXQoc3R5bGUuYm9yZGVyTGVmdFdpZHRoKSAtIDE1XG5cdCAgICAgICAgICB9O1xuXG5cdCAgICAgICAgICB2YXIgZml0QWRqID0gMDtcblx0ICAgICAgICAgIGlmIChoZWlnaHQgPCA0MDggJiYgdGhpcy50YXJnZXQgPT09IGRvY3VtZW50LmJvZHkpIHtcblx0ICAgICAgICAgICAgZml0QWRqID0gLTAuMDAwMTEgKiBNYXRoLnBvdyhoZWlnaHQsIDIpIC0gMC4wMDcyNyAqIGhlaWdodCArIDIyLjU4O1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBpZiAodGhpcy50YXJnZXQgIT09IGRvY3VtZW50LmJvZHkpIHtcblx0ICAgICAgICAgICAgb3V0LmhlaWdodCA9IE1hdGgubWF4KG91dC5oZWlnaHQsIDI0KTtcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgdmFyIHNjcm9sbFBlcmNlbnRhZ2UgPSB0aGlzLnRhcmdldC5zY3JvbGxUb3AgLyAodGFyZ2V0LnNjcm9sbEhlaWdodCAtIGhlaWdodCk7XG5cdCAgICAgICAgICBvdXQudG9wID0gc2Nyb2xsUGVyY2VudGFnZSAqIChoZWlnaHQgLSBvdXQuaGVpZ2h0IC0gZml0QWRqKSArIGJvdW5kcy50b3AgKyBwYXJzZUZsb2F0KHN0eWxlLmJvcmRlclRvcFdpZHRoKTtcblxuXHQgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0ID09PSBkb2N1bWVudC5ib2R5KSB7XG5cdCAgICAgICAgICAgIG91dC5oZWlnaHQgPSBNYXRoLm1heChvdXQuaGVpZ2h0LCAyNCk7XG5cdCAgICAgICAgICB9XG5cblx0ICAgICAgICAgIHJldHVybiBvdXQ7XG5cdCAgICAgICAgfVxuXHQgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIHJldHVybiBnZXRCb3VuZHModGhpcy50YXJnZXQpO1xuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnY2xlYXJDYWNoZScsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gY2xlYXJDYWNoZSgpIHtcblx0ICAgICAgdGhpcy5fY2FjaGUgPSB7fTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdjYWNoZScsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gY2FjaGUoaywgZ2V0dGVyKSB7XG5cdCAgICAgIC8vIE1vcmUgdGhhbiBvbmUgbW9kdWxlIHdpbGwgb2Z0ZW4gbmVlZCB0aGUgc2FtZSBET00gaW5mbywgc29cblx0ICAgICAgLy8gd2Uga2VlcCBhIGNhY2hlIHdoaWNoIGlzIGNsZWFyZWQgb24gZWFjaCBwb3NpdGlvbiBjYWxsXG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5fY2FjaGUgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgdGhpcy5fY2FjaGUgPSB7fTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5fY2FjaGVba10gPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgdGhpcy5fY2FjaGVba10gPSBnZXR0ZXIuY2FsbCh0aGlzKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIHJldHVybiB0aGlzLl9jYWNoZVtrXTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdlbmFibGUnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGVuYWJsZSgpIHtcblx0ICAgICAgdmFyIHBvcyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHRydWUgOiBhcmd1bWVudHNbMF07XG5cblx0ICAgICAgaWYgKCEodGhpcy5vcHRpb25zLmFkZFRhcmdldENsYXNzZXMgPT09IGZhbHNlKSkge1xuXHQgICAgICAgIGFkZENsYXNzKHRoaXMudGFyZ2V0LCB0aGlzLmdldENsYXNzKCdlbmFibGVkJykpO1xuXHQgICAgICB9XG5cdCAgICAgIGFkZENsYXNzKHRoaXMuZWxlbWVudCwgdGhpcy5nZXRDbGFzcygnZW5hYmxlZCcpKTtcblx0ICAgICAgdGhpcy5lbmFibGVkID0gdHJ1ZTtcblxuXHQgICAgICBpZiAodGhpcy5zY3JvbGxQYXJlbnQgIT09IGRvY3VtZW50KSB7XG5cdCAgICAgICAgdGhpcy5zY3JvbGxQYXJlbnQuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgdGhpcy5wb3NpdGlvbik7XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAocG9zKSB7XG5cdCAgICAgICAgdGhpcy5wb3NpdGlvbigpO1xuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnZGlzYWJsZScsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gZGlzYWJsZSgpIHtcblx0ICAgICAgcmVtb3ZlQ2xhc3ModGhpcy50YXJnZXQsIHRoaXMuZ2V0Q2xhc3MoJ2VuYWJsZWQnKSk7XG5cdCAgICAgIHJlbW92ZUNsYXNzKHRoaXMuZWxlbWVudCwgdGhpcy5nZXRDbGFzcygnZW5hYmxlZCcpKTtcblx0ICAgICAgdGhpcy5lbmFibGVkID0gZmFsc2U7XG5cblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLnNjcm9sbFBhcmVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICB0aGlzLnNjcm9sbFBhcmVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aGlzLnBvc2l0aW9uKTtcblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2Rlc3Ryb3knLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG5cdCAgICAgIHZhciBfdGhpczMgPSB0aGlzO1xuXG5cdCAgICAgIHRoaXMuZGlzYWJsZSgpO1xuXG5cdCAgICAgIHRldGhlcnMuZm9yRWFjaChmdW5jdGlvbiAodGV0aGVyLCBpKSB7XG5cdCAgICAgICAgaWYgKHRldGhlciA9PT0gX3RoaXMzKSB7XG5cdCAgICAgICAgICB0ZXRoZXJzLnNwbGljZShpLCAxKTtcblx0ICAgICAgICAgIHJldHVybjtcblx0ICAgICAgICB9XG5cdCAgICAgIH0pO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ3VwZGF0ZUF0dGFjaENsYXNzZXMnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIHVwZGF0ZUF0dGFjaENsYXNzZXMoZWxlbWVudEF0dGFjaCwgdGFyZ2V0QXR0YWNoKSB7XG5cdCAgICAgIHZhciBfdGhpczQgPSB0aGlzO1xuXG5cdCAgICAgIGVsZW1lbnRBdHRhY2ggPSBlbGVtZW50QXR0YWNoIHx8IHRoaXMuYXR0YWNobWVudDtcblx0ICAgICAgdGFyZ2V0QXR0YWNoID0gdGFyZ2V0QXR0YWNoIHx8IHRoaXMudGFyZ2V0QXR0YWNobWVudDtcblx0ICAgICAgdmFyIHNpZGVzID0gWydsZWZ0JywgJ3RvcCcsICdib3R0b20nLCAncmlnaHQnLCAnbWlkZGxlJywgJ2NlbnRlciddO1xuXG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5fYWRkQXR0YWNoQ2xhc3NlcyAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5fYWRkQXR0YWNoQ2xhc3Nlcy5sZW5ndGgpIHtcblx0ICAgICAgICAvLyB1cGRhdGVBdHRhY2hDbGFzc2VzIGNhbiBiZSBjYWxsZWQgbW9yZSB0aGFuIG9uY2UgaW4gYSBwb3NpdGlvbiBjYWxsLCBzb1xuXHQgICAgICAgIC8vIHdlIG5lZWQgdG8gY2xlYW4gdXAgYWZ0ZXIgb3Vyc2VsdmVzIHN1Y2ggdGhhdCB3aGVuIHRoZSBsYXN0IGRlZmVyIGdldHNcblx0ICAgICAgICAvLyByYW4gaXQgZG9lc24ndCBhZGQgYW55IGV4dHJhIGNsYXNzZXMgZnJvbSBwcmV2aW91cyBjYWxscy5cblx0ICAgICAgICB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzLnNwbGljZSgwLCB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzLmxlbmd0aCk7XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAodHlwZW9mIHRoaXMuX2FkZEF0dGFjaENsYXNzZXMgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgdGhpcy5fYWRkQXR0YWNoQ2xhc3NlcyA9IFtdO1xuXHQgICAgICB9XG5cdCAgICAgIHZhciBhZGQgPSB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzO1xuXG5cdCAgICAgIGlmIChlbGVtZW50QXR0YWNoLnRvcCkge1xuXHQgICAgICAgIGFkZC5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ2VsZW1lbnQtYXR0YWNoZWQnKSArICctJyArIGVsZW1lbnRBdHRhY2gudG9wKTtcblx0ICAgICAgfVxuXHQgICAgICBpZiAoZWxlbWVudEF0dGFjaC5sZWZ0KSB7XG5cdCAgICAgICAgYWRkLnB1c2godGhpcy5nZXRDbGFzcygnZWxlbWVudC1hdHRhY2hlZCcpICsgJy0nICsgZWxlbWVudEF0dGFjaC5sZWZ0KTtcblx0ICAgICAgfVxuXHQgICAgICBpZiAodGFyZ2V0QXR0YWNoLnRvcCkge1xuXHQgICAgICAgIGFkZC5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ3RhcmdldC1hdHRhY2hlZCcpICsgJy0nICsgdGFyZ2V0QXR0YWNoLnRvcCk7XG5cdCAgICAgIH1cblx0ICAgICAgaWYgKHRhcmdldEF0dGFjaC5sZWZ0KSB7XG5cdCAgICAgICAgYWRkLnB1c2godGhpcy5nZXRDbGFzcygndGFyZ2V0LWF0dGFjaGVkJykgKyAnLScgKyB0YXJnZXRBdHRhY2gubGVmdCk7XG5cdCAgICAgIH1cblxuXHQgICAgICB2YXIgYWxsID0gW107XG5cdCAgICAgIHNpZGVzLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcblx0ICAgICAgICBhbGwucHVzaChfdGhpczQuZ2V0Q2xhc3MoJ2VsZW1lbnQtYXR0YWNoZWQnKSArICctJyArIHNpZGUpO1xuXHQgICAgICAgIGFsbC5wdXNoKF90aGlzNC5nZXRDbGFzcygndGFyZ2V0LWF0dGFjaGVkJykgKyAnLScgKyBzaWRlKTtcblx0ICAgICAgfSk7XG5cblx0ICAgICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuXHQgICAgICAgIGlmICghKHR5cGVvZiBfdGhpczQuX2FkZEF0dGFjaENsYXNzZXMgIT09ICd1bmRlZmluZWQnKSkge1xuXHQgICAgICAgICAgcmV0dXJuO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXM0LmVsZW1lbnQsIF90aGlzNC5fYWRkQXR0YWNoQ2xhc3NlcywgYWxsKTtcblx0ICAgICAgICBpZiAoIShfdGhpczQub3B0aW9ucy5hZGRUYXJnZXRDbGFzc2VzID09PSBmYWxzZSkpIHtcblx0ICAgICAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXM0LnRhcmdldCwgX3RoaXM0Ll9hZGRBdHRhY2hDbGFzc2VzLCBhbGwpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGRlbGV0ZSBfdGhpczQuX2FkZEF0dGFjaENsYXNzZXM7XG5cdCAgICAgIH0pO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ3Bvc2l0aW9uJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBwb3NpdGlvbigpIHtcblx0ICAgICAgdmFyIF90aGlzNSA9IHRoaXM7XG5cblx0ICAgICAgdmFyIGZsdXNoQ2hhbmdlcyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHRydWUgOiBhcmd1bWVudHNbMF07XG5cblx0ICAgICAgLy8gZmx1c2hDaGFuZ2VzIGNvbW1pdHMgdGhlIGNoYW5nZXMgaW1tZWRpYXRlbHksIGxlYXZlIHRydWUgdW5sZXNzIHlvdSBhcmUgcG9zaXRpb25pbmcgbXVsdGlwbGVcblx0ICAgICAgLy8gdGV0aGVycyAoaW4gd2hpY2ggY2FzZSBjYWxsIFRldGhlci5VdGlscy5mbHVzaCB5b3Vyc2VsZiB3aGVuIHlvdSdyZSBkb25lKVxuXG5cdCAgICAgIGlmICghdGhpcy5lbmFibGVkKSB7XG5cdCAgICAgICAgcmV0dXJuO1xuXHQgICAgICB9XG5cblx0ICAgICAgdGhpcy5jbGVhckNhY2hlKCk7XG5cblx0ICAgICAgLy8gVHVybiAnYXV0bycgYXR0YWNobWVudHMgaW50byB0aGUgYXBwcm9wcmlhdGUgY29ybmVyIG9yIGVkZ2Vcblx0ICAgICAgdmFyIHRhcmdldEF0dGFjaG1lbnQgPSBhdXRvVG9GaXhlZEF0dGFjaG1lbnQodGhpcy50YXJnZXRBdHRhY2htZW50LCB0aGlzLmF0dGFjaG1lbnQpO1xuXG5cdCAgICAgIHRoaXMudXBkYXRlQXR0YWNoQ2xhc3Nlcyh0aGlzLmF0dGFjaG1lbnQsIHRhcmdldEF0dGFjaG1lbnQpO1xuXG5cdCAgICAgIHZhciBlbGVtZW50UG9zID0gdGhpcy5jYWNoZSgnZWxlbWVudC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgcmV0dXJuIGdldEJvdW5kcyhfdGhpczUuZWxlbWVudCk7XG5cdCAgICAgIH0pO1xuXG5cdCAgICAgIHZhciB3aWR0aCA9IGVsZW1lbnRQb3Mud2lkdGg7XG5cdCAgICAgIHZhciBoZWlnaHQgPSBlbGVtZW50UG9zLmhlaWdodDtcblxuXHQgICAgICBpZiAod2lkdGggPT09IDAgJiYgaGVpZ2h0ID09PSAwICYmIHR5cGVvZiB0aGlzLmxhc3RTaXplICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIHZhciBfbGFzdFNpemUgPSB0aGlzLmxhc3RTaXplO1xuXG5cdCAgICAgICAgLy8gV2UgY2FjaGUgdGhlIGhlaWdodCBhbmQgd2lkdGggdG8gbWFrZSBpdCBwb3NzaWJsZSB0byBwb3NpdGlvbiBlbGVtZW50cyB0aGF0IGFyZVxuXHQgICAgICAgIC8vIGdldHRpbmcgaGlkZGVuLlxuXHQgICAgICAgIHdpZHRoID0gX2xhc3RTaXplLndpZHRoO1xuXHQgICAgICAgIGhlaWdodCA9IF9sYXN0U2l6ZS5oZWlnaHQ7XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgdGhpcy5sYXN0U2l6ZSA9IHsgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodCB9O1xuXHQgICAgICB9XG5cblx0ICAgICAgdmFyIHRhcmdldFBvcyA9IHRoaXMuY2FjaGUoJ3RhcmdldC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgcmV0dXJuIF90aGlzNS5nZXRUYXJnZXRCb3VuZHMoKTtcblx0ICAgICAgfSk7XG5cdCAgICAgIHZhciB0YXJnZXRTaXplID0gdGFyZ2V0UG9zO1xuXG5cdCAgICAgIC8vIEdldCBhbiBhY3R1YWwgcHggb2Zmc2V0IGZyb20gdGhlIGF0dGFjaG1lbnRcblx0ICAgICAgdmFyIG9mZnNldCA9IG9mZnNldFRvUHgoYXR0YWNobWVudFRvT2Zmc2V0KHRoaXMuYXR0YWNobWVudCksIHsgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodCB9KTtcblx0ICAgICAgdmFyIHRhcmdldE9mZnNldCA9IG9mZnNldFRvUHgoYXR0YWNobWVudFRvT2Zmc2V0KHRhcmdldEF0dGFjaG1lbnQpLCB0YXJnZXRTaXplKTtcblxuXHQgICAgICB2YXIgbWFudWFsT2Zmc2V0ID0gb2Zmc2V0VG9QeCh0aGlzLm9mZnNldCwgeyB3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0IH0pO1xuXHQgICAgICB2YXIgbWFudWFsVGFyZ2V0T2Zmc2V0ID0gb2Zmc2V0VG9QeCh0aGlzLnRhcmdldE9mZnNldCwgdGFyZ2V0U2l6ZSk7XG5cblx0ICAgICAgLy8gQWRkIHRoZSBtYW51YWxseSBwcm92aWRlZCBvZmZzZXRcblx0ICAgICAgb2Zmc2V0ID0gYWRkT2Zmc2V0KG9mZnNldCwgbWFudWFsT2Zmc2V0KTtcblx0ICAgICAgdGFyZ2V0T2Zmc2V0ID0gYWRkT2Zmc2V0KHRhcmdldE9mZnNldCwgbWFudWFsVGFyZ2V0T2Zmc2V0KTtcblxuXHQgICAgICAvLyBJdCdzIG5vdyBvdXIgZ29hbCB0byBtYWtlIChlbGVtZW50IHBvc2l0aW9uICsgb2Zmc2V0KSA9PSAodGFyZ2V0IHBvc2l0aW9uICsgdGFyZ2V0IG9mZnNldClcblx0ICAgICAgdmFyIGxlZnQgPSB0YXJnZXRQb3MubGVmdCArIHRhcmdldE9mZnNldC5sZWZ0IC0gb2Zmc2V0LmxlZnQ7XG5cdCAgICAgIHZhciB0b3AgPSB0YXJnZXRQb3MudG9wICsgdGFyZ2V0T2Zmc2V0LnRvcCAtIG9mZnNldC50b3A7XG5cblx0ICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBUZXRoZXJCYXNlLm1vZHVsZXMubGVuZ3RoOyArK2kpIHtcblx0ICAgICAgICB2YXIgX21vZHVsZTIgPSBUZXRoZXJCYXNlLm1vZHVsZXNbaV07XG5cdCAgICAgICAgdmFyIHJldCA9IF9tb2R1bGUyLnBvc2l0aW9uLmNhbGwodGhpcywge1xuXHQgICAgICAgICAgbGVmdDogbGVmdCxcblx0ICAgICAgICAgIHRvcDogdG9wLFxuXHQgICAgICAgICAgdGFyZ2V0QXR0YWNobWVudDogdGFyZ2V0QXR0YWNobWVudCxcblx0ICAgICAgICAgIHRhcmdldFBvczogdGFyZ2V0UG9zLFxuXHQgICAgICAgICAgZWxlbWVudFBvczogZWxlbWVudFBvcyxcblx0ICAgICAgICAgIG9mZnNldDogb2Zmc2V0LFxuXHQgICAgICAgICAgdGFyZ2V0T2Zmc2V0OiB0YXJnZXRPZmZzZXQsXG5cdCAgICAgICAgICBtYW51YWxPZmZzZXQ6IG1hbnVhbE9mZnNldCxcblx0ICAgICAgICAgIG1hbnVhbFRhcmdldE9mZnNldDogbWFudWFsVGFyZ2V0T2Zmc2V0LFxuXHQgICAgICAgICAgc2Nyb2xsYmFyU2l6ZTogc2Nyb2xsYmFyU2l6ZSxcblx0ICAgICAgICAgIGF0dGFjaG1lbnQ6IHRoaXMuYXR0YWNobWVudFxuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgaWYgKHJldCA9PT0gZmFsc2UpIHtcblx0ICAgICAgICAgIHJldHVybiBmYWxzZTtcblx0ICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiByZXQgPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiByZXQgIT09ICdvYmplY3QnKSB7XG5cdCAgICAgICAgICBjb250aW51ZTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgdG9wID0gcmV0LnRvcDtcblx0ICAgICAgICAgIGxlZnQgPSByZXQubGVmdDtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICAvLyBXZSBkZXNjcmliZSB0aGUgcG9zaXRpb24gdGhyZWUgZGlmZmVyZW50IHdheXMgdG8gZ2l2ZSB0aGUgb3B0aW1pemVyXG5cdCAgICAgIC8vIGEgY2hhbmNlIHRvIGRlY2lkZSB0aGUgYmVzdCBwb3NzaWJsZSB3YXkgdG8gcG9zaXRpb24gdGhlIGVsZW1lbnRcblx0ICAgICAgLy8gd2l0aCB0aGUgZmV3ZXN0IHJlcGFpbnRzLlxuXHQgICAgICB2YXIgbmV4dCA9IHtcblx0ICAgICAgICAvLyBJdCdzIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSBwYWdlIChhYnNvbHV0ZSBwb3NpdGlvbmluZyB3aGVuXG5cdCAgICAgICAgLy8gdGhlIGVsZW1lbnQgaXMgYSBjaGlsZCBvZiB0aGUgYm9keSlcblx0ICAgICAgICBwYWdlOiB7XG5cdCAgICAgICAgICB0b3A6IHRvcCxcblx0ICAgICAgICAgIGxlZnQ6IGxlZnRcblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgLy8gSXQncyBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQgKGZpeGVkIHBvc2l0aW9uaW5nKVxuXHQgICAgICAgIHZpZXdwb3J0OiB7XG5cdCAgICAgICAgICB0b3A6IHRvcCAtIHBhZ2VZT2Zmc2V0LFxuXHQgICAgICAgICAgYm90dG9tOiBwYWdlWU9mZnNldCAtIHRvcCAtIGhlaWdodCArIGlubmVySGVpZ2h0LFxuXHQgICAgICAgICAgbGVmdDogbGVmdCAtIHBhZ2VYT2Zmc2V0LFxuXHQgICAgICAgICAgcmlnaHQ6IHBhZ2VYT2Zmc2V0IC0gbGVmdCAtIHdpZHRoICsgaW5uZXJXaWR0aFxuXHQgICAgICAgIH1cblx0ICAgICAgfTtcblxuXHQgICAgICB2YXIgc2Nyb2xsYmFyU2l6ZSA9IHVuZGVmaW5lZDtcblx0ICAgICAgaWYgKGRvY3VtZW50LmJvZHkuc2Nyb2xsV2lkdGggPiB3aW5kb3cuaW5uZXJXaWR0aCkge1xuXHQgICAgICAgIHNjcm9sbGJhclNpemUgPSB0aGlzLmNhY2hlKCdzY3JvbGxiYXItc2l6ZScsIGdldFNjcm9sbEJhclNpemUpO1xuXHQgICAgICAgIG5leHQudmlld3BvcnQuYm90dG9tIC09IHNjcm9sbGJhclNpemUuaGVpZ2h0O1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKGRvY3VtZW50LmJvZHkuc2Nyb2xsSGVpZ2h0ID4gd2luZG93LmlubmVySGVpZ2h0KSB7XG5cdCAgICAgICAgc2Nyb2xsYmFyU2l6ZSA9IHRoaXMuY2FjaGUoJ3Njcm9sbGJhci1zaXplJywgZ2V0U2Nyb2xsQmFyU2l6ZSk7XG5cdCAgICAgICAgbmV4dC52aWV3cG9ydC5yaWdodCAtPSBzY3JvbGxiYXJTaXplLndpZHRoO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKFsnJywgJ3N0YXRpYyddLmluZGV4T2YoZG9jdW1lbnQuYm9keS5zdHlsZS5wb3NpdGlvbikgPT09IC0xIHx8IFsnJywgJ3N0YXRpYyddLmluZGV4T2YoZG9jdW1lbnQuYm9keS5wYXJlbnRFbGVtZW50LnN0eWxlLnBvc2l0aW9uKSA9PT0gLTEpIHtcblx0ICAgICAgICAvLyBBYnNvbHV0ZSBwb3NpdGlvbmluZyBpbiB0aGUgYm9keSB3aWxsIGJlIHJlbGF0aXZlIHRvIHRoZSBwYWdlLCBub3QgdGhlICdpbml0aWFsIGNvbnRhaW5pbmcgYmxvY2snXG5cdCAgICAgICAgbmV4dC5wYWdlLmJvdHRvbSA9IGRvY3VtZW50LmJvZHkuc2Nyb2xsSGVpZ2h0IC0gdG9wIC0gaGVpZ2h0O1xuXHQgICAgICAgIG5leHQucGFnZS5yaWdodCA9IGRvY3VtZW50LmJvZHkuc2Nyb2xsV2lkdGggLSBsZWZ0IC0gd2lkdGg7XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5vcHRpbWl6YXRpb25zICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLm9wdGlvbnMub3B0aW1pemF0aW9ucy5tb3ZlRWxlbWVudCAhPT0gZmFsc2UgJiYgISh0eXBlb2YgdGhpcy50YXJnZXRNb2RpZmllciAhPT0gJ3VuZGVmaW5lZCcpKSB7XG5cdCAgICAgICAgKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnQgPSBfdGhpczUuY2FjaGUoJ3RhcmdldC1vZmZzZXRwYXJlbnQnLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBnZXRPZmZzZXRQYXJlbnQoX3RoaXM1LnRhcmdldCk7XG5cdCAgICAgICAgICB9KTtcblx0ICAgICAgICAgIHZhciBvZmZzZXRQb3NpdGlvbiA9IF90aGlzNS5jYWNoZSgndGFyZ2V0LW9mZnNldHBhcmVudC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBnZXRCb3VuZHMob2Zmc2V0UGFyZW50KTtcblx0ICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgdmFyIG9mZnNldFBhcmVudFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShvZmZzZXRQYXJlbnQpO1xuXHQgICAgICAgICAgdmFyIG9mZnNldFBhcmVudFNpemUgPSBvZmZzZXRQb3NpdGlvbjtcblxuXHQgICAgICAgICAgdmFyIG9mZnNldEJvcmRlciA9IHt9O1xuXHQgICAgICAgICAgWydUb3AnLCAnTGVmdCcsICdCb3R0b20nLCAnUmlnaHQnXS5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG5cdCAgICAgICAgICAgIG9mZnNldEJvcmRlcltzaWRlLnRvTG93ZXJDYXNlKCldID0gcGFyc2VGbG9hdChvZmZzZXRQYXJlbnRTdHlsZVsnYm9yZGVyJyArIHNpZGUgKyAnV2lkdGgnXSk7XG5cdCAgICAgICAgICB9KTtcblxuXHQgICAgICAgICAgb2Zmc2V0UG9zaXRpb24ucmlnaHQgPSBkb2N1bWVudC5ib2R5LnNjcm9sbFdpZHRoIC0gb2Zmc2V0UG9zaXRpb24ubGVmdCAtIG9mZnNldFBhcmVudFNpemUud2lkdGggKyBvZmZzZXRCb3JkZXIucmlnaHQ7XG5cdCAgICAgICAgICBvZmZzZXRQb3NpdGlvbi5ib3R0b20gPSBkb2N1bWVudC5ib2R5LnNjcm9sbEhlaWdodCAtIG9mZnNldFBvc2l0aW9uLnRvcCAtIG9mZnNldFBhcmVudFNpemUuaGVpZ2h0ICsgb2Zmc2V0Qm9yZGVyLmJvdHRvbTtcblxuXHQgICAgICAgICAgaWYgKG5leHQucGFnZS50b3AgPj0gb2Zmc2V0UG9zaXRpb24udG9wICsgb2Zmc2V0Qm9yZGVyLnRvcCAmJiBuZXh0LnBhZ2UuYm90dG9tID49IG9mZnNldFBvc2l0aW9uLmJvdHRvbSkge1xuXHQgICAgICAgICAgICBpZiAobmV4dC5wYWdlLmxlZnQgPj0gb2Zmc2V0UG9zaXRpb24ubGVmdCArIG9mZnNldEJvcmRlci5sZWZ0ICYmIG5leHQucGFnZS5yaWdodCA+PSBvZmZzZXRQb3NpdGlvbi5yaWdodCkge1xuXHQgICAgICAgICAgICAgIC8vIFdlJ3JlIHdpdGhpbiB0aGUgdmlzaWJsZSBwYXJ0IG9mIHRoZSB0YXJnZXQncyBzY3JvbGwgcGFyZW50XG5cdCAgICAgICAgICAgICAgdmFyIHNjcm9sbFRvcCA9IG9mZnNldFBhcmVudC5zY3JvbGxUb3A7XG5cdCAgICAgICAgICAgICAgdmFyIHNjcm9sbExlZnQgPSBvZmZzZXRQYXJlbnQuc2Nyb2xsTGVmdDtcblxuXHQgICAgICAgICAgICAgIC8vIEl0J3MgcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIHRhcmdldCdzIG9mZnNldCBwYXJlbnQgKGFic29sdXRlIHBvc2l0aW9uaW5nIHdoZW5cblx0ICAgICAgICAgICAgICAvLyB0aGUgZWxlbWVudCBpcyBtb3ZlZCB0byBiZSBhIGNoaWxkIG9mIHRoZSB0YXJnZXQncyBvZmZzZXQgcGFyZW50KS5cblx0ICAgICAgICAgICAgICBuZXh0Lm9mZnNldCA9IHtcblx0ICAgICAgICAgICAgICAgIHRvcDogbmV4dC5wYWdlLnRvcCAtIG9mZnNldFBvc2l0aW9uLnRvcCArIHNjcm9sbFRvcCAtIG9mZnNldEJvcmRlci50b3AsXG5cdCAgICAgICAgICAgICAgICBsZWZ0OiBuZXh0LnBhZ2UubGVmdCAtIG9mZnNldFBvc2l0aW9uLmxlZnQgKyBzY3JvbGxMZWZ0IC0gb2Zmc2V0Qm9yZGVyLmxlZnRcblx0ICAgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfSkoKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIC8vIFdlIGNvdWxkIGFsc28gdHJhdmVsIHVwIHRoZSBET00gYW5kIHRyeSBlYWNoIGNvbnRhaW5pbmcgY29udGV4dCwgcmF0aGVyIHRoYW4gb25seVxuXHQgICAgICAvLyBsb29raW5nIGF0IHRoZSBib2R5LCBidXQgd2UncmUgZ29ubmEgZ2V0IGRpbWluaXNoaW5nIHJldHVybnMuXG5cblx0ICAgICAgdGhpcy5tb3ZlKG5leHQpO1xuXG5cdCAgICAgIHRoaXMuaGlzdG9yeS51bnNoaWZ0KG5leHQpO1xuXG5cdCAgICAgIGlmICh0aGlzLmhpc3RvcnkubGVuZ3RoID4gMykge1xuXHQgICAgICAgIHRoaXMuaGlzdG9yeS5wb3AoKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmIChmbHVzaENoYW5nZXMpIHtcblx0ICAgICAgICBmbHVzaCgpO1xuXHQgICAgICB9XG5cblx0ICAgICAgcmV0dXJuIHRydWU7XG5cdCAgICB9XG5cblx0ICAgIC8vIFRIRSBJU1NVRVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ21vdmUnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIG1vdmUocG9zKSB7XG5cdCAgICAgIHZhciBfdGhpczYgPSB0aGlzO1xuXG5cdCAgICAgIGlmICghKHR5cGVvZiB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZSAhPT0gJ3VuZGVmaW5lZCcpKSB7XG5cdCAgICAgICAgcmV0dXJuO1xuXHQgICAgICB9XG5cblx0ICAgICAgdmFyIHNhbWUgPSB7fTtcblxuXHQgICAgICBmb3IgKHZhciB0eXBlIGluIHBvcykge1xuXHQgICAgICAgIHNhbWVbdHlwZV0gPSB7fTtcblxuXHQgICAgICAgIGZvciAodmFyIGtleSBpbiBwb3NbdHlwZV0pIHtcblx0ICAgICAgICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuXG5cdCAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaGlzdG9yeS5sZW5ndGg7ICsraSkge1xuXHQgICAgICAgICAgICB2YXIgcG9pbnQgPSB0aGlzLmhpc3RvcnlbaV07XG5cdCAgICAgICAgICAgIGlmICh0eXBlb2YgcG9pbnRbdHlwZV0gIT09ICd1bmRlZmluZWQnICYmICF3aXRoaW4ocG9pbnRbdHlwZV1ba2V5XSwgcG9zW3R5cGVdW2tleV0pKSB7XG5cdCAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuXHQgICAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICB9XG5cblx0ICAgICAgICAgIGlmICghZm91bmQpIHtcblx0ICAgICAgICAgICAgc2FtZVt0eXBlXVtrZXldID0gdHJ1ZTtcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICB2YXIgY3NzID0geyB0b3A6ICcnLCBsZWZ0OiAnJywgcmlnaHQ6ICcnLCBib3R0b206ICcnIH07XG5cblx0ICAgICAgdmFyIHRyYW5zY3JpYmUgPSBmdW5jdGlvbiB0cmFuc2NyaWJlKF9zYW1lLCBfcG9zKSB7XG5cdCAgICAgICAgdmFyIGhhc09wdGltaXphdGlvbnMgPSB0eXBlb2YgX3RoaXM2Lm9wdGlvbnMub3B0aW1pemF0aW9ucyAhPT0gJ3VuZGVmaW5lZCc7XG5cdCAgICAgICAgdmFyIGdwdSA9IGhhc09wdGltaXphdGlvbnMgPyBfdGhpczYub3B0aW9ucy5vcHRpbWl6YXRpb25zLmdwdSA6IG51bGw7XG5cdCAgICAgICAgaWYgKGdwdSAhPT0gZmFsc2UpIHtcblx0ICAgICAgICAgIHZhciB5UG9zID0gdW5kZWZpbmVkLFxuXHQgICAgICAgICAgICAgIHhQb3MgPSB1bmRlZmluZWQ7XG5cdCAgICAgICAgICBpZiAoX3NhbWUudG9wKSB7XG5cdCAgICAgICAgICAgIGNzcy50b3AgPSAwO1xuXHQgICAgICAgICAgICB5UG9zID0gX3Bvcy50b3A7XG5cdCAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICBjc3MuYm90dG9tID0gMDtcblx0ICAgICAgICAgICAgeVBvcyA9IC1fcG9zLmJvdHRvbTtcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgaWYgKF9zYW1lLmxlZnQpIHtcblx0ICAgICAgICAgICAgY3NzLmxlZnQgPSAwO1xuXHQgICAgICAgICAgICB4UG9zID0gX3Bvcy5sZWZ0O1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgY3NzLnJpZ2h0ID0gMDtcblx0ICAgICAgICAgICAgeFBvcyA9IC1fcG9zLnJpZ2h0O1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBjc3NbdHJhbnNmb3JtS2V5XSA9ICd0cmFuc2xhdGVYKCcgKyBNYXRoLnJvdW5kKHhQb3MpICsgJ3B4KSB0cmFuc2xhdGVZKCcgKyBNYXRoLnJvdW5kKHlQb3MpICsgJ3B4KSc7XG5cblx0ICAgICAgICAgIGlmICh0cmFuc2Zvcm1LZXkgIT09ICdtc1RyYW5zZm9ybScpIHtcblx0ICAgICAgICAgICAgLy8gVGhlIFogdHJhbnNmb3JtIHdpbGwga2VlcCB0aGlzIGluIHRoZSBHUFUgKGZhc3RlciwgYW5kIHByZXZlbnRzIGFydGlmYWN0cyksXG5cdCAgICAgICAgICAgIC8vIGJ1dCBJRTkgZG9lc24ndCBzdXBwb3J0IDNkIHRyYW5zZm9ybXMgYW5kIHdpbGwgY2hva2UuXG5cdCAgICAgICAgICAgIGNzc1t0cmFuc2Zvcm1LZXldICs9IFwiIHRyYW5zbGF0ZVooMClcIjtcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgaWYgKF9zYW1lLnRvcCkge1xuXHQgICAgICAgICAgICBjc3MudG9wID0gX3Bvcy50b3AgKyAncHgnO1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgY3NzLmJvdHRvbSA9IF9wb3MuYm90dG9tICsgJ3B4Jztcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgaWYgKF9zYW1lLmxlZnQpIHtcblx0ICAgICAgICAgICAgY3NzLmxlZnQgPSBfcG9zLmxlZnQgKyAncHgnO1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgY3NzLnJpZ2h0ID0gX3Bvcy5yaWdodCArICdweCc7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICB9O1xuXG5cdCAgICAgIHZhciBtb3ZlZCA9IGZhbHNlO1xuXHQgICAgICBpZiAoKHNhbWUucGFnZS50b3AgfHwgc2FtZS5wYWdlLmJvdHRvbSkgJiYgKHNhbWUucGFnZS5sZWZ0IHx8IHNhbWUucGFnZS5yaWdodCkpIHtcblx0ICAgICAgICBjc3MucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHQgICAgICAgIHRyYW5zY3JpYmUoc2FtZS5wYWdlLCBwb3MucGFnZSk7XG5cdCAgICAgIH0gZWxzZSBpZiAoKHNhbWUudmlld3BvcnQudG9wIHx8IHNhbWUudmlld3BvcnQuYm90dG9tKSAmJiAoc2FtZS52aWV3cG9ydC5sZWZ0IHx8IHNhbWUudmlld3BvcnQucmlnaHQpKSB7XG5cdCAgICAgICAgY3NzLnBvc2l0aW9uID0gJ2ZpeGVkJztcblx0ICAgICAgICB0cmFuc2NyaWJlKHNhbWUudmlld3BvcnQsIHBvcy52aWV3cG9ydCk7XG5cdCAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHNhbWUub2Zmc2V0ICE9PSAndW5kZWZpbmVkJyAmJiBzYW1lLm9mZnNldC50b3AgJiYgc2FtZS5vZmZzZXQubGVmdCkge1xuXHQgICAgICAgIChmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICBjc3MucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHQgICAgICAgICAgdmFyIG9mZnNldFBhcmVudCA9IF90aGlzNi5jYWNoZSgndGFyZ2V0LW9mZnNldHBhcmVudCcsIGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGdldE9mZnNldFBhcmVudChfdGhpczYudGFyZ2V0KTtcblx0ICAgICAgICAgIH0pO1xuXG5cdCAgICAgICAgICBpZiAoZ2V0T2Zmc2V0UGFyZW50KF90aGlzNi5lbGVtZW50KSAhPT0gb2Zmc2V0UGFyZW50KSB7XG5cdCAgICAgICAgICAgIGRlZmVyKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICBfdGhpczYuZWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKF90aGlzNi5lbGVtZW50KTtcblx0ICAgICAgICAgICAgICBvZmZzZXRQYXJlbnQuYXBwZW5kQ2hpbGQoX3RoaXM2LmVsZW1lbnQpO1xuXHQgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgdHJhbnNjcmliZShzYW1lLm9mZnNldCwgcG9zLm9mZnNldCk7XG5cdCAgICAgICAgICBtb3ZlZCA9IHRydWU7XG5cdCAgICAgICAgfSkoKTtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICBjc3MucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHQgICAgICAgIHRyYW5zY3JpYmUoeyB0b3A6IHRydWUsIGxlZnQ6IHRydWUgfSwgcG9zLnBhZ2UpO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKCFtb3ZlZCkge1xuXHQgICAgICAgIHZhciBvZmZzZXRQYXJlbnRJc0JvZHkgPSB0cnVlO1xuXHQgICAgICAgIHZhciBjdXJyZW50Tm9kZSA9IHRoaXMuZWxlbWVudC5wYXJlbnROb2RlO1xuXHQgICAgICAgIHdoaWxlIChjdXJyZW50Tm9kZSAmJiBjdXJyZW50Tm9kZS50YWdOYW1lICE9PSAnQk9EWScpIHtcblx0ICAgICAgICAgIGlmIChnZXRDb21wdXRlZFN0eWxlKGN1cnJlbnROb2RlKS5wb3NpdGlvbiAhPT0gJ3N0YXRpYycpIHtcblx0ICAgICAgICAgICAgb2Zmc2V0UGFyZW50SXNCb2R5ID0gZmFsc2U7XG5cdCAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBjdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlLnBhcmVudE5vZGU7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKCFvZmZzZXRQYXJlbnRJc0JvZHkpIHtcblx0ICAgICAgICAgIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuZWxlbWVudCk7XG5cdCAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuZWxlbWVudCk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgLy8gQW55IGNzcyBjaGFuZ2Ugd2lsbCB0cmlnZ2VyIGEgcmVwYWludCwgc28gbGV0J3MgYXZvaWQgb25lIGlmIG5vdGhpbmcgY2hhbmdlZFxuXHQgICAgICB2YXIgd3JpdGVDU1MgPSB7fTtcblx0ICAgICAgdmFyIHdyaXRlID0gZmFsc2U7XG5cdCAgICAgIGZvciAodmFyIGtleSBpbiBjc3MpIHtcblx0ICAgICAgICB2YXIgdmFsID0gY3NzW2tleV07XG5cdCAgICAgICAgdmFyIGVsVmFsID0gdGhpcy5lbGVtZW50LnN0eWxlW2tleV07XG5cblx0ICAgICAgICBpZiAoZWxWYWwgIT09ICcnICYmIHZhbCAhPT0gJycgJiYgWyd0b3AnLCAnbGVmdCcsICdib3R0b20nLCAncmlnaHQnXS5pbmRleE9mKGtleSkgPj0gMCkge1xuXHQgICAgICAgICAgZWxWYWwgPSBwYXJzZUZsb2F0KGVsVmFsKTtcblx0ICAgICAgICAgIHZhbCA9IHBhcnNlRmxvYXQodmFsKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAoZWxWYWwgIT09IHZhbCkge1xuXHQgICAgICAgICAgd3JpdGUgPSB0cnVlO1xuXHQgICAgICAgICAgd3JpdGVDU1Nba2V5XSA9IHZhbDtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAod3JpdGUpIHtcblx0ICAgICAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICBleHRlbmQoX3RoaXM2LmVsZW1lbnQuc3R5bGUsIHdyaXRlQ1NTKTtcblx0ICAgICAgICB9KTtcblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH1dKTtcblxuXHQgIHJldHVybiBUZXRoZXJDbGFzcztcblx0fSkoKTtcblxuXHRUZXRoZXJDbGFzcy5tb2R1bGVzID0gW107XG5cblx0VGV0aGVyQmFzZS5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuXG5cdHZhciBUZXRoZXIgPSBleHRlbmQoVGV0aGVyQ2xhc3MsIFRldGhlckJhc2UpO1xuXHQvKiBnbG9iYWxzIFRldGhlckJhc2UgKi9cblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIF9zbGljZWRUb0FycmF5ID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gc2xpY2VJdGVyYXRvcihhcnIsIGkpIHsgdmFyIF9hcnIgPSBbXTsgdmFyIF9uID0gdHJ1ZTsgdmFyIF9kID0gZmFsc2U7IHZhciBfZSA9IHVuZGVmaW5lZDsgdHJ5IHsgZm9yICh2YXIgX2kgPSBhcnJbU3ltYm9sLml0ZXJhdG9yXSgpLCBfczsgIShfbiA9IChfcyA9IF9pLm5leHQoKSkuZG9uZSk7IF9uID0gdHJ1ZSkgeyBfYXJyLnB1c2goX3MudmFsdWUpOyBpZiAoaSAmJiBfYXJyLmxlbmd0aCA9PT0gaSkgYnJlYWs7IH0gfSBjYXRjaCAoZXJyKSB7IF9kID0gdHJ1ZTsgX2UgPSBlcnI7IH0gZmluYWxseSB7IHRyeSB7IGlmICghX24gJiYgX2lbJ3JldHVybiddKSBfaVsncmV0dXJuJ10oKTsgfSBmaW5hbGx5IHsgaWYgKF9kKSB0aHJvdyBfZTsgfSB9IHJldHVybiBfYXJyOyB9IHJldHVybiBmdW5jdGlvbiAoYXJyLCBpKSB7IGlmIChBcnJheS5pc0FycmF5KGFycikpIHsgcmV0dXJuIGFycjsgfSBlbHNlIGlmIChTeW1ib2wuaXRlcmF0b3IgaW4gT2JqZWN0KGFycikpIHsgcmV0dXJuIHNsaWNlSXRlcmF0b3IoYXJyLCBpKTsgfSBlbHNlIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBhdHRlbXB0IHRvIGRlc3RydWN0dXJlIG5vbi1pdGVyYWJsZSBpbnN0YW5jZScpOyB9IH07IH0pKCk7XG5cblx0dmFyIF9UZXRoZXJCYXNlJFV0aWxzID0gVGV0aGVyQmFzZS5VdGlscztcblx0dmFyIGdldEJvdW5kcyA9IF9UZXRoZXJCYXNlJFV0aWxzLmdldEJvdW5kcztcblx0dmFyIGV4dGVuZCA9IF9UZXRoZXJCYXNlJFV0aWxzLmV4dGVuZDtcblx0dmFyIHVwZGF0ZUNsYXNzZXMgPSBfVGV0aGVyQmFzZSRVdGlscy51cGRhdGVDbGFzc2VzO1xuXHR2YXIgZGVmZXIgPSBfVGV0aGVyQmFzZSRVdGlscy5kZWZlcjtcblxuXHR2YXIgQk9VTkRTX0ZPUk1BVCA9IFsnbGVmdCcsICd0b3AnLCAncmlnaHQnLCAnYm90dG9tJ107XG5cblx0ZnVuY3Rpb24gZ2V0Qm91bmRpbmdSZWN0KHRldGhlciwgdG8pIHtcblx0ICBpZiAodG8gPT09ICdzY3JvbGxQYXJlbnQnKSB7XG5cdCAgICB0byA9IHRldGhlci5zY3JvbGxQYXJlbnQ7XG5cdCAgfSBlbHNlIGlmICh0byA9PT0gJ3dpbmRvdycpIHtcblx0ICAgIHRvID0gW3BhZ2VYT2Zmc2V0LCBwYWdlWU9mZnNldCwgaW5uZXJXaWR0aCArIHBhZ2VYT2Zmc2V0LCBpbm5lckhlaWdodCArIHBhZ2VZT2Zmc2V0XTtcblx0ICB9XG5cblx0ICBpZiAodG8gPT09IGRvY3VtZW50KSB7XG5cdCAgICB0byA9IHRvLmRvY3VtZW50RWxlbWVudDtcblx0ICB9XG5cblx0ICBpZiAodHlwZW9mIHRvLm5vZGVUeXBlICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgdmFyIHNpemUgPSBnZXRCb3VuZHModG8pO1xuXHQgICAgICB2YXIgcG9zID0gc2l6ZTtcblx0ICAgICAgdmFyIHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZSh0byk7XG5cblx0ICAgICAgdG8gPSBbcG9zLmxlZnQsIHBvcy50b3AsIHNpemUud2lkdGggKyBwb3MubGVmdCwgc2l6ZS5oZWlnaHQgKyBwb3MudG9wXTtcblxuXHQgICAgICBCT1VORFNfRk9STUFULmZvckVhY2goZnVuY3Rpb24gKHNpZGUsIGkpIHtcblx0ICAgICAgICBzaWRlID0gc2lkZVswXS50b1VwcGVyQ2FzZSgpICsgc2lkZS5zdWJzdHIoMSk7XG5cdCAgICAgICAgaWYgKHNpZGUgPT09ICdUb3AnIHx8IHNpZGUgPT09ICdMZWZ0Jykge1xuXHQgICAgICAgICAgdG9baV0gKz0gcGFyc2VGbG9hdChzdHlsZVsnYm9yZGVyJyArIHNpZGUgKyAnV2lkdGgnXSk7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgIHRvW2ldIC09IHBhcnNlRmxvYXQoc3R5bGVbJ2JvcmRlcicgKyBzaWRlICsgJ1dpZHRoJ10pO1xuXHQgICAgICAgIH1cblx0ICAgICAgfSk7XG5cdCAgICB9KSgpO1xuXHQgIH1cblxuXHQgIHJldHVybiB0bztcblx0fVxuXG5cdFRldGhlckJhc2UubW9kdWxlcy5wdXNoKHtcblx0ICBwb3NpdGlvbjogZnVuY3Rpb24gcG9zaXRpb24oX3JlZikge1xuXHQgICAgdmFyIF90aGlzID0gdGhpcztcblxuXHQgICAgdmFyIHRvcCA9IF9yZWYudG9wO1xuXHQgICAgdmFyIGxlZnQgPSBfcmVmLmxlZnQ7XG5cdCAgICB2YXIgdGFyZ2V0QXR0YWNobWVudCA9IF9yZWYudGFyZ2V0QXR0YWNobWVudDtcblxuXHQgICAgaWYgKCF0aGlzLm9wdGlvbnMuY29uc3RyYWludHMpIHtcblx0ICAgICAgcmV0dXJuIHRydWU7XG5cdCAgICB9XG5cblx0ICAgIHZhciBfY2FjaGUgPSB0aGlzLmNhY2hlKCdlbGVtZW50LWJvdW5kcycsIGZ1bmN0aW9uICgpIHtcblx0ICAgICAgcmV0dXJuIGdldEJvdW5kcyhfdGhpcy5lbGVtZW50KTtcblx0ICAgIH0pO1xuXG5cdCAgICB2YXIgaGVpZ2h0ID0gX2NhY2hlLmhlaWdodDtcblx0ICAgIHZhciB3aWR0aCA9IF9jYWNoZS53aWR0aDtcblxuXHQgICAgaWYgKHdpZHRoID09PSAwICYmIGhlaWdodCA9PT0gMCAmJiB0eXBlb2YgdGhpcy5sYXN0U2l6ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgdmFyIF9sYXN0U2l6ZSA9IHRoaXMubGFzdFNpemU7XG5cblx0ICAgICAgLy8gSGFuZGxlIHRoZSBpdGVtIGdldHRpbmcgaGlkZGVuIGFzIGEgcmVzdWx0IG9mIG91ciBwb3NpdGlvbmluZyB3aXRob3V0IGdsaXRjaGluZ1xuXHQgICAgICAvLyB0aGUgY2xhc3NlcyBpbiBhbmQgb3V0XG5cdCAgICAgIHdpZHRoID0gX2xhc3RTaXplLndpZHRoO1xuXHQgICAgICBoZWlnaHQgPSBfbGFzdFNpemUuaGVpZ2h0O1xuXHQgICAgfVxuXG5cdCAgICB2YXIgdGFyZ2V0U2l6ZSA9IHRoaXMuY2FjaGUoJ3RhcmdldC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgIHJldHVybiBfdGhpcy5nZXRUYXJnZXRCb3VuZHMoKTtcblx0ICAgIH0pO1xuXG5cdCAgICB2YXIgdGFyZ2V0SGVpZ2h0ID0gdGFyZ2V0U2l6ZS5oZWlnaHQ7XG5cdCAgICB2YXIgdGFyZ2V0V2lkdGggPSB0YXJnZXRTaXplLndpZHRoO1xuXG5cdCAgICB2YXIgYWxsQ2xhc3NlcyA9IFt0aGlzLmdldENsYXNzKCdwaW5uZWQnKSwgdGhpcy5nZXRDbGFzcygnb3V0LW9mLWJvdW5kcycpXTtcblxuXHQgICAgdGhpcy5vcHRpb25zLmNvbnN0cmFpbnRzLmZvckVhY2goZnVuY3Rpb24gKGNvbnN0cmFpbnQpIHtcblx0ICAgICAgdmFyIG91dE9mQm91bmRzQ2xhc3MgPSBjb25zdHJhaW50Lm91dE9mQm91bmRzQ2xhc3M7XG5cdCAgICAgIHZhciBwaW5uZWRDbGFzcyA9IGNvbnN0cmFpbnQucGlubmVkQ2xhc3M7XG5cblx0ICAgICAgaWYgKG91dE9mQm91bmRzQ2xhc3MpIHtcblx0ICAgICAgICBhbGxDbGFzc2VzLnB1c2gob3V0T2ZCb3VuZHNDbGFzcyk7XG5cdCAgICAgIH1cblx0ICAgICAgaWYgKHBpbm5lZENsYXNzKSB7XG5cdCAgICAgICAgYWxsQ2xhc3Nlcy5wdXNoKHBpbm5lZENsYXNzKTtcblx0ICAgICAgfVxuXHQgICAgfSk7XG5cblx0ICAgIGFsbENsYXNzZXMuZm9yRWFjaChmdW5jdGlvbiAoY2xzKSB7XG5cdCAgICAgIFsnbGVmdCcsICd0b3AnLCAncmlnaHQnLCAnYm90dG9tJ10uZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuXHQgICAgICAgIGFsbENsYXNzZXMucHVzaChjbHMgKyAnLScgKyBzaWRlKTtcblx0ICAgICAgfSk7XG5cdCAgICB9KTtcblxuXHQgICAgdmFyIGFkZENsYXNzZXMgPSBbXTtcblxuXHQgICAgdmFyIHRBdHRhY2htZW50ID0gZXh0ZW5kKHt9LCB0YXJnZXRBdHRhY2htZW50KTtcblx0ICAgIHZhciBlQXR0YWNobWVudCA9IGV4dGVuZCh7fSwgdGhpcy5hdHRhY2htZW50KTtcblxuXHQgICAgdGhpcy5vcHRpb25zLmNvbnN0cmFpbnRzLmZvckVhY2goZnVuY3Rpb24gKGNvbnN0cmFpbnQpIHtcblx0ICAgICAgdmFyIHRvID0gY29uc3RyYWludC50bztcblx0ICAgICAgdmFyIGF0dGFjaG1lbnQgPSBjb25zdHJhaW50LmF0dGFjaG1lbnQ7XG5cdCAgICAgIHZhciBwaW4gPSBjb25zdHJhaW50LnBpbjtcblxuXHQgICAgICBpZiAodHlwZW9mIGF0dGFjaG1lbnQgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgYXR0YWNobWVudCA9ICcnO1xuXHQgICAgICB9XG5cblx0ICAgICAgdmFyIGNoYW5nZUF0dGFjaFggPSB1bmRlZmluZWQsXG5cdCAgICAgICAgICBjaGFuZ2VBdHRhY2hZID0gdW5kZWZpbmVkO1xuXHQgICAgICBpZiAoYXR0YWNobWVudC5pbmRleE9mKCcgJykgPj0gMCkge1xuXHQgICAgICAgIHZhciBfYXR0YWNobWVudCRzcGxpdCA9IGF0dGFjaG1lbnQuc3BsaXQoJyAnKTtcblxuXHQgICAgICAgIHZhciBfYXR0YWNobWVudCRzcGxpdDIgPSBfc2xpY2VkVG9BcnJheShfYXR0YWNobWVudCRzcGxpdCwgMik7XG5cblx0ICAgICAgICBjaGFuZ2VBdHRhY2hZID0gX2F0dGFjaG1lbnQkc3BsaXQyWzBdO1xuXHQgICAgICAgIGNoYW5nZUF0dGFjaFggPSBfYXR0YWNobWVudCRzcGxpdDJbMV07XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgY2hhbmdlQXR0YWNoWCA9IGNoYW5nZUF0dGFjaFkgPSBhdHRhY2htZW50O1xuXHQgICAgICB9XG5cblx0ICAgICAgdmFyIGJvdW5kcyA9IGdldEJvdW5kaW5nUmVjdChfdGhpcywgdG8pO1xuXG5cdCAgICAgIGlmIChjaGFuZ2VBdHRhY2hZID09PSAndGFyZ2V0JyB8fCBjaGFuZ2VBdHRhY2hZID09PSAnYm90aCcpIHtcblx0ICAgICAgICBpZiAodG9wIDwgYm91bmRzWzFdICYmIHRBdHRhY2htZW50LnRvcCA9PT0gJ3RvcCcpIHtcblx0ICAgICAgICAgIHRvcCArPSB0YXJnZXRIZWlnaHQ7XG5cdCAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAodG9wICsgaGVpZ2h0ID4gYm91bmRzWzNdICYmIHRBdHRhY2htZW50LnRvcCA9PT0gJ2JvdHRvbScpIHtcblx0ICAgICAgICAgIHRvcCAtPSB0YXJnZXRIZWlnaHQ7XG5cdCAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAndG9wJztcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAoY2hhbmdlQXR0YWNoWSA9PT0gJ3RvZ2V0aGVyJykge1xuXHQgICAgICAgIGlmICh0b3AgPCBib3VuZHNbMV0gJiYgdEF0dGFjaG1lbnQudG9wID09PSAndG9wJykge1xuXHQgICAgICAgICAgaWYgKGVBdHRhY2htZW50LnRvcCA9PT0gJ2JvdHRvbScpIHtcblx0ICAgICAgICAgICAgdG9wICs9IHRhcmdldEhlaWdodDtcblx0ICAgICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG5cblx0ICAgICAgICAgICAgdG9wICs9IGhlaWdodDtcblx0ICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG5cdCAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LnRvcCA9PT0gJ3RvcCcpIHtcblx0ICAgICAgICAgICAgdG9wICs9IHRhcmdldEhlaWdodDtcblx0ICAgICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG5cblx0ICAgICAgICAgICAgdG9wIC09IGhlaWdodDtcblx0ICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSAmJiB0QXR0YWNobWVudC50b3AgPT09ICdib3R0b20nKSB7XG5cdCAgICAgICAgICBpZiAoZUF0dGFjaG1lbnQudG9wID09PSAndG9wJykge1xuXHQgICAgICAgICAgICB0b3AgLT0gdGFyZ2V0SGVpZ2h0O1xuXHQgICAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAndG9wJztcblxuXHQgICAgICAgICAgICB0b3AgLT0gaGVpZ2h0O1xuXHQgICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcblx0ICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQudG9wID09PSAnYm90dG9tJykge1xuXHQgICAgICAgICAgICB0b3AgLT0gdGFyZ2V0SGVpZ2h0O1xuXHQgICAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAndG9wJztcblxuXHQgICAgICAgICAgICB0b3AgKz0gaGVpZ2h0O1xuXHQgICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAndG9wJztcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAodEF0dGFjaG1lbnQudG9wID09PSAnbWlkZGxlJykge1xuXHQgICAgICAgICAgaWYgKHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSAmJiBlQXR0YWNobWVudC50b3AgPT09ICd0b3AnKSB7XG5cdCAgICAgICAgICAgIHRvcCAtPSBoZWlnaHQ7XG5cdCAgICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuXHQgICAgICAgICAgfSBlbHNlIGlmICh0b3AgPCBib3VuZHNbMV0gJiYgZUF0dGFjaG1lbnQudG9wID09PSAnYm90dG9tJykge1xuXHQgICAgICAgICAgICB0b3AgKz0gaGVpZ2h0O1xuXHQgICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAndG9wJztcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAoY2hhbmdlQXR0YWNoWCA9PT0gJ3RhcmdldCcgfHwgY2hhbmdlQXR0YWNoWCA9PT0gJ2JvdGgnKSB7XG5cdCAgICAgICAgaWYgKGxlZnQgPCBib3VuZHNbMF0gJiYgdEF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG5cdCAgICAgICAgICBsZWZ0ICs9IHRhcmdldFdpZHRoO1xuXHQgICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKGxlZnQgKyB3aWR0aCA+IGJvdW5kc1syXSAmJiB0QXR0YWNobWVudC5sZWZ0ID09PSAncmlnaHQnKSB7XG5cdCAgICAgICAgICBsZWZ0IC09IHRhcmdldFdpZHRoO1xuXHQgICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0Jztcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAoY2hhbmdlQXR0YWNoWCA9PT0gJ3RvZ2V0aGVyJykge1xuXHQgICAgICAgIGlmIChsZWZ0IDwgYm91bmRzWzBdICYmIHRBdHRhY2htZW50LmxlZnQgPT09ICdsZWZ0Jykge1xuXHQgICAgICAgICAgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcblx0ICAgICAgICAgICAgbGVmdCArPSB0YXJnZXRXaWR0aDtcblx0ICAgICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG5cblx0ICAgICAgICAgICAgbGVmdCArPSB3aWR0aDtcblx0ICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0Jztcblx0ICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG5cdCAgICAgICAgICAgIGxlZnQgKz0gdGFyZ2V0V2lkdGg7XG5cdCAgICAgICAgICAgIHRBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuXG5cdCAgICAgICAgICAgIGxlZnQgLT0gd2lkdGg7XG5cdCAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH0gZWxzZSBpZiAobGVmdCArIHdpZHRoID4gYm91bmRzWzJdICYmIHRBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcblx0ICAgICAgICAgIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAnbGVmdCcpIHtcblx0ICAgICAgICAgICAgbGVmdCAtPSB0YXJnZXRXaWR0aDtcblx0ICAgICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcblxuXHQgICAgICAgICAgICBsZWZ0IC09IHdpZHRoO1xuXHQgICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0Jztcblx0ICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ3JpZ2h0Jykge1xuXHQgICAgICAgICAgICBsZWZ0IC09IHRhcmdldFdpZHRoO1xuXHQgICAgICAgICAgICB0QXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuXG5cdCAgICAgICAgICAgIGxlZnQgKz0gd2lkdGg7XG5cdCAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfSBlbHNlIGlmICh0QXR0YWNobWVudC5sZWZ0ID09PSAnY2VudGVyJykge1xuXHQgICAgICAgICAgaWYgKGxlZnQgKyB3aWR0aCA+IGJvdW5kc1syXSAmJiBlQXR0YWNobWVudC5sZWZ0ID09PSAnbGVmdCcpIHtcblx0ICAgICAgICAgICAgbGVmdCAtPSB3aWR0aDtcblx0ICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG5cdCAgICAgICAgICB9IGVsc2UgaWYgKGxlZnQgPCBib3VuZHNbMF0gJiYgZUF0dGFjaG1lbnQubGVmdCA9PT0gJ3JpZ2h0Jykge1xuXHQgICAgICAgICAgICBsZWZ0ICs9IHdpZHRoO1xuXHQgICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXG5cdCAgICAgIGlmIChjaGFuZ2VBdHRhY2hZID09PSAnZWxlbWVudCcgfHwgY2hhbmdlQXR0YWNoWSA9PT0gJ2JvdGgnKSB7XG5cdCAgICAgICAgaWYgKHRvcCA8IGJvdW5kc1sxXSAmJiBlQXR0YWNobWVudC50b3AgPT09ICdib3R0b20nKSB7XG5cdCAgICAgICAgICB0b3AgKz0gaGVpZ2h0O1xuXHQgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSAmJiBlQXR0YWNobWVudC50b3AgPT09ICd0b3AnKSB7XG5cdCAgICAgICAgICB0b3AgLT0gaGVpZ2h0O1xuXHQgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKGNoYW5nZUF0dGFjaFggPT09ICdlbGVtZW50JyB8fCBjaGFuZ2VBdHRhY2hYID09PSAnYm90aCcpIHtcblx0ICAgICAgICBpZiAobGVmdCA8IGJvdW5kc1swXSkge1xuXHQgICAgICAgICAgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcblx0ICAgICAgICAgICAgbGVmdCArPSB3aWR0aDtcblx0ICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0Jztcblx0ICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2NlbnRlcicpIHtcblx0ICAgICAgICAgICAgbGVmdCArPSB3aWR0aCAvIDI7XG5cdCAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKGxlZnQgKyB3aWR0aCA+IGJvdW5kc1syXSkge1xuXHQgICAgICAgICAgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdsZWZ0Jykge1xuXHQgICAgICAgICAgICBsZWZ0IC09IHdpZHRoO1xuXHQgICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0Jztcblx0ICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2NlbnRlcicpIHtcblx0ICAgICAgICAgICAgbGVmdCAtPSB3aWR0aCAvIDI7XG5cdCAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICh0eXBlb2YgcGluID09PSAnc3RyaW5nJykge1xuXHQgICAgICAgIHBpbiA9IHBpbi5zcGxpdCgnLCcpLm1hcChmdW5jdGlvbiAocCkge1xuXHQgICAgICAgICAgcmV0dXJuIHAudHJpbSgpO1xuXHQgICAgICAgIH0pO1xuXHQgICAgICB9IGVsc2UgaWYgKHBpbiA9PT0gdHJ1ZSkge1xuXHQgICAgICAgIHBpbiA9IFsndG9wJywgJ2xlZnQnLCAncmlnaHQnLCAnYm90dG9tJ107XG5cdCAgICAgIH1cblxuXHQgICAgICBwaW4gPSBwaW4gfHwgW107XG5cblx0ICAgICAgdmFyIHBpbm5lZCA9IFtdO1xuXHQgICAgICB2YXIgb29iID0gW107XG5cblx0ICAgICAgaWYgKHRvcCA8IGJvdW5kc1sxXSkge1xuXHQgICAgICAgIGlmIChwaW4uaW5kZXhPZigndG9wJykgPj0gMCkge1xuXHQgICAgICAgICAgdG9wID0gYm91bmRzWzFdO1xuXHQgICAgICAgICAgcGlubmVkLnB1c2goJ3RvcCcpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICBvb2IucHVzaCgndG9wJyk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSkge1xuXHQgICAgICAgIGlmIChwaW4uaW5kZXhPZignYm90dG9tJykgPj0gMCkge1xuXHQgICAgICAgICAgdG9wID0gYm91bmRzWzNdIC0gaGVpZ2h0O1xuXHQgICAgICAgICAgcGlubmVkLnB1c2goJ2JvdHRvbScpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICBvb2IucHVzaCgnYm90dG9tJyk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKGxlZnQgPCBib3VuZHNbMF0pIHtcblx0ICAgICAgICBpZiAocGluLmluZGV4T2YoJ2xlZnQnKSA+PSAwKSB7XG5cdCAgICAgICAgICBsZWZ0ID0gYm91bmRzWzBdO1xuXHQgICAgICAgICAgcGlubmVkLnB1c2goJ2xlZnQnKTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgb29iLnB1c2goJ2xlZnQnKTtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAobGVmdCArIHdpZHRoID4gYm91bmRzWzJdKSB7XG5cdCAgICAgICAgaWYgKHBpbi5pbmRleE9mKCdyaWdodCcpID49IDApIHtcblx0ICAgICAgICAgIGxlZnQgPSBib3VuZHNbMl0gLSB3aWR0aDtcblx0ICAgICAgICAgIHBpbm5lZC5wdXNoKCdyaWdodCcpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICBvb2IucHVzaCgncmlnaHQnKTtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAocGlubmVkLmxlbmd0aCkge1xuXHQgICAgICAgIChmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICB2YXIgcGlubmVkQ2xhc3MgPSB1bmRlZmluZWQ7XG5cdCAgICAgICAgICBpZiAodHlwZW9mIF90aGlzLm9wdGlvbnMucGlubmVkQ2xhc3MgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgICAgIHBpbm5lZENsYXNzID0gX3RoaXMub3B0aW9ucy5waW5uZWRDbGFzcztcblx0ICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHBpbm5lZENsYXNzID0gX3RoaXMuZ2V0Q2xhc3MoJ3Bpbm5lZCcpO1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBhZGRDbGFzc2VzLnB1c2gocGlubmVkQ2xhc3MpO1xuXHQgICAgICAgICAgcGlubmVkLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcblx0ICAgICAgICAgICAgYWRkQ2xhc3Nlcy5wdXNoKHBpbm5lZENsYXNzICsgJy0nICsgc2lkZSk7XG5cdCAgICAgICAgICB9KTtcblx0ICAgICAgICB9KSgpO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKG9vYi5sZW5ndGgpIHtcblx0ICAgICAgICAoZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgdmFyIG9vYkNsYXNzID0gdW5kZWZpbmVkO1xuXHQgICAgICAgICAgaWYgKHR5cGVvZiBfdGhpcy5vcHRpb25zLm91dE9mQm91bmRzQ2xhc3MgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgICAgIG9vYkNsYXNzID0gX3RoaXMub3B0aW9ucy5vdXRPZkJvdW5kc0NsYXNzO1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgb29iQ2xhc3MgPSBfdGhpcy5nZXRDbGFzcygnb3V0LW9mLWJvdW5kcycpO1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBhZGRDbGFzc2VzLnB1c2gob29iQ2xhc3MpO1xuXHQgICAgICAgICAgb29iLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcblx0ICAgICAgICAgICAgYWRkQ2xhc3Nlcy5wdXNoKG9vYkNsYXNzICsgJy0nICsgc2lkZSk7XG5cdCAgICAgICAgICB9KTtcblx0ICAgICAgICB9KSgpO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKHBpbm5lZC5pbmRleE9mKCdsZWZ0JykgPj0gMCB8fCBwaW5uZWQuaW5kZXhPZigncmlnaHQnKSA+PSAwKSB7XG5cdCAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9IHRBdHRhY2htZW50LmxlZnQgPSBmYWxzZTtcblx0ICAgICAgfVxuXHQgICAgICBpZiAocGlubmVkLmluZGV4T2YoJ3RvcCcpID49IDAgfHwgcGlubmVkLmluZGV4T2YoJ2JvdHRvbScpID49IDApIHtcblx0ICAgICAgICBlQXR0YWNobWVudC50b3AgPSB0QXR0YWNobWVudC50b3AgPSBmYWxzZTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICh0QXR0YWNobWVudC50b3AgIT09IHRhcmdldEF0dGFjaG1lbnQudG9wIHx8IHRBdHRhY2htZW50LmxlZnQgIT09IHRhcmdldEF0dGFjaG1lbnQubGVmdCB8fCBlQXR0YWNobWVudC50b3AgIT09IF90aGlzLmF0dGFjaG1lbnQudG9wIHx8IGVBdHRhY2htZW50LmxlZnQgIT09IF90aGlzLmF0dGFjaG1lbnQubGVmdCkge1xuXHQgICAgICAgIF90aGlzLnVwZGF0ZUF0dGFjaENsYXNzZXMoZUF0dGFjaG1lbnQsIHRBdHRhY2htZW50KTtcblx0ICAgICAgfVxuXHQgICAgfSk7XG5cblx0ICAgIGRlZmVyKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgaWYgKCEoX3RoaXMub3B0aW9ucy5hZGRUYXJnZXRDbGFzc2VzID09PSBmYWxzZSkpIHtcblx0ICAgICAgICB1cGRhdGVDbGFzc2VzKF90aGlzLnRhcmdldCwgYWRkQ2xhc3NlcywgYWxsQ2xhc3Nlcyk7XG5cdCAgICAgIH1cblx0ICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpcy5lbGVtZW50LCBhZGRDbGFzc2VzLCBhbGxDbGFzc2VzKTtcblx0ICAgIH0pO1xuXG5cdCAgICByZXR1cm4geyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9O1xuXHQgIH1cblx0fSk7XG5cdC8qIGdsb2JhbHMgVGV0aGVyQmFzZSAqL1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgX1RldGhlckJhc2UkVXRpbHMgPSBUZXRoZXJCYXNlLlV0aWxzO1xuXHR2YXIgZ2V0Qm91bmRzID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0Qm91bmRzO1xuXHR2YXIgdXBkYXRlQ2xhc3NlcyA9IF9UZXRoZXJCYXNlJFV0aWxzLnVwZGF0ZUNsYXNzZXM7XG5cdHZhciBkZWZlciA9IF9UZXRoZXJCYXNlJFV0aWxzLmRlZmVyO1xuXG5cdFRldGhlckJhc2UubW9kdWxlcy5wdXNoKHtcblx0ICBwb3NpdGlvbjogZnVuY3Rpb24gcG9zaXRpb24oX3JlZikge1xuXHQgICAgdmFyIF90aGlzID0gdGhpcztcblxuXHQgICAgdmFyIHRvcCA9IF9yZWYudG9wO1xuXHQgICAgdmFyIGxlZnQgPSBfcmVmLmxlZnQ7XG5cblx0ICAgIHZhciBfY2FjaGUgPSB0aGlzLmNhY2hlKCdlbGVtZW50LWJvdW5kcycsIGZ1bmN0aW9uICgpIHtcblx0ICAgICAgcmV0dXJuIGdldEJvdW5kcyhfdGhpcy5lbGVtZW50KTtcblx0ICAgIH0pO1xuXG5cdCAgICB2YXIgaGVpZ2h0ID0gX2NhY2hlLmhlaWdodDtcblx0ICAgIHZhciB3aWR0aCA9IF9jYWNoZS53aWR0aDtcblxuXHQgICAgdmFyIHRhcmdldFBvcyA9IHRoaXMuZ2V0VGFyZ2V0Qm91bmRzKCk7XG5cblx0ICAgIHZhciBib3R0b20gPSB0b3AgKyBoZWlnaHQ7XG5cdCAgICB2YXIgcmlnaHQgPSBsZWZ0ICsgd2lkdGg7XG5cblx0ICAgIHZhciBhYnV0dGVkID0gW107XG5cdCAgICBpZiAodG9wIDw9IHRhcmdldFBvcy5ib3R0b20gJiYgYm90dG9tID49IHRhcmdldFBvcy50b3ApIHtcblx0ICAgICAgWydsZWZ0JywgJ3JpZ2h0J10uZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuXHQgICAgICAgIHZhciB0YXJnZXRQb3NTaWRlID0gdGFyZ2V0UG9zW3NpZGVdO1xuXHQgICAgICAgIGlmICh0YXJnZXRQb3NTaWRlID09PSBsZWZ0IHx8IHRhcmdldFBvc1NpZGUgPT09IHJpZ2h0KSB7XG5cdCAgICAgICAgICBhYnV0dGVkLnB1c2goc2lkZSk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9KTtcblx0ICAgIH1cblxuXHQgICAgaWYgKGxlZnQgPD0gdGFyZ2V0UG9zLnJpZ2h0ICYmIHJpZ2h0ID49IHRhcmdldFBvcy5sZWZ0KSB7XG5cdCAgICAgIFsndG9wJywgJ2JvdHRvbSddLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcblx0ICAgICAgICB2YXIgdGFyZ2V0UG9zU2lkZSA9IHRhcmdldFBvc1tzaWRlXTtcblx0ICAgICAgICBpZiAodGFyZ2V0UG9zU2lkZSA9PT0gdG9wIHx8IHRhcmdldFBvc1NpZGUgPT09IGJvdHRvbSkge1xuXHQgICAgICAgICAgYWJ1dHRlZC5wdXNoKHNpZGUpO1xuXHQgICAgICAgIH1cblx0ICAgICAgfSk7XG5cdCAgICB9XG5cblx0ICAgIHZhciBhbGxDbGFzc2VzID0gW107XG5cdCAgICB2YXIgYWRkQ2xhc3NlcyA9IFtdO1xuXG5cdCAgICB2YXIgc2lkZXMgPSBbJ2xlZnQnLCAndG9wJywgJ3JpZ2h0JywgJ2JvdHRvbSddO1xuXHQgICAgYWxsQ2xhc3Nlcy5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ2FidXR0ZWQnKSk7XG5cdCAgICBzaWRlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG5cdCAgICAgIGFsbENsYXNzZXMucHVzaChfdGhpcy5nZXRDbGFzcygnYWJ1dHRlZCcpICsgJy0nICsgc2lkZSk7XG5cdCAgICB9KTtcblxuXHQgICAgaWYgKGFidXR0ZWQubGVuZ3RoKSB7XG5cdCAgICAgIGFkZENsYXNzZXMucHVzaCh0aGlzLmdldENsYXNzKCdhYnV0dGVkJykpO1xuXHQgICAgfVxuXG5cdCAgICBhYnV0dGVkLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcblx0ICAgICAgYWRkQ2xhc3Nlcy5wdXNoKF90aGlzLmdldENsYXNzKCdhYnV0dGVkJykgKyAnLScgKyBzaWRlKTtcblx0ICAgIH0pO1xuXG5cdCAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG5cdCAgICAgIGlmICghKF90aGlzLm9wdGlvbnMuYWRkVGFyZ2V0Q2xhc3NlcyA9PT0gZmFsc2UpKSB7XG5cdCAgICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpcy50YXJnZXQsIGFkZENsYXNzZXMsIGFsbENsYXNzZXMpO1xuXHQgICAgICB9XG5cdCAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXMuZWxlbWVudCwgYWRkQ2xhc3NlcywgYWxsQ2xhc3Nlcyk7XG5cdCAgICB9KTtcblxuXHQgICAgcmV0dXJuIHRydWU7XG5cdCAgfVxuXHR9KTtcblx0LyogZ2xvYmFscyBUZXRoZXJCYXNlICovXG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBfc2xpY2VkVG9BcnJheSA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIHNsaWNlSXRlcmF0b3IoYXJyLCBpKSB7IHZhciBfYXJyID0gW107IHZhciBfbiA9IHRydWU7IHZhciBfZCA9IGZhbHNlOyB2YXIgX2UgPSB1bmRlZmluZWQ7IHRyeSB7IGZvciAodmFyIF9pID0gYXJyW1N5bWJvbC5pdGVyYXRvcl0oKSwgX3M7ICEoX24gPSAoX3MgPSBfaS5uZXh0KCkpLmRvbmUpOyBfbiA9IHRydWUpIHsgX2Fyci5wdXNoKF9zLnZhbHVlKTsgaWYgKGkgJiYgX2Fyci5sZW5ndGggPT09IGkpIGJyZWFrOyB9IH0gY2F0Y2ggKGVycikgeyBfZCA9IHRydWU7IF9lID0gZXJyOyB9IGZpbmFsbHkgeyB0cnkgeyBpZiAoIV9uICYmIF9pWydyZXR1cm4nXSkgX2lbJ3JldHVybiddKCk7IH0gZmluYWxseSB7IGlmIChfZCkgdGhyb3cgX2U7IH0gfSByZXR1cm4gX2FycjsgfSByZXR1cm4gZnVuY3Rpb24gKGFyciwgaSkgeyBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7IHJldHVybiBhcnI7IH0gZWxzZSBpZiAoU3ltYm9sLml0ZXJhdG9yIGluIE9iamVjdChhcnIpKSB7IHJldHVybiBzbGljZUl0ZXJhdG9yKGFyciwgaSk7IH0gZWxzZSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgYXR0ZW1wdCB0byBkZXN0cnVjdHVyZSBub24taXRlcmFibGUgaW5zdGFuY2UnKTsgfSB9OyB9KSgpO1xuXG5cdFRldGhlckJhc2UubW9kdWxlcy5wdXNoKHtcblx0ICBwb3NpdGlvbjogZnVuY3Rpb24gcG9zaXRpb24oX3JlZikge1xuXHQgICAgdmFyIHRvcCA9IF9yZWYudG9wO1xuXHQgICAgdmFyIGxlZnQgPSBfcmVmLmxlZnQ7XG5cblx0ICAgIGlmICghdGhpcy5vcHRpb25zLnNoaWZ0KSB7XG5cdCAgICAgIHJldHVybjtcblx0ICAgIH1cblxuXHQgICAgdmFyIHNoaWZ0ID0gdGhpcy5vcHRpb25zLnNoaWZ0O1xuXHQgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMuc2hpZnQgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgc2hpZnQgPSB0aGlzLm9wdGlvbnMuc2hpZnQuY2FsbCh0aGlzLCB7IHRvcDogdG9wLCBsZWZ0OiBsZWZ0IH0pO1xuXHQgICAgfVxuXG5cdCAgICB2YXIgc2hpZnRUb3AgPSB1bmRlZmluZWQsXG5cdCAgICAgICAgc2hpZnRMZWZ0ID0gdW5kZWZpbmVkO1xuXHQgICAgaWYgKHR5cGVvZiBzaGlmdCA9PT0gJ3N0cmluZycpIHtcblx0ICAgICAgc2hpZnQgPSBzaGlmdC5zcGxpdCgnICcpO1xuXHQgICAgICBzaGlmdFsxXSA9IHNoaWZ0WzFdIHx8IHNoaWZ0WzBdO1xuXG5cdCAgICAgIHZhciBfc2hpZnQgPSBzaGlmdDtcblxuXHQgICAgICB2YXIgX3NoaWZ0MiA9IF9zbGljZWRUb0FycmF5KF9zaGlmdCwgMik7XG5cblx0ICAgICAgc2hpZnRUb3AgPSBfc2hpZnQyWzBdO1xuXHQgICAgICBzaGlmdExlZnQgPSBfc2hpZnQyWzFdO1xuXG5cdCAgICAgIHNoaWZ0VG9wID0gcGFyc2VGbG9hdChzaGlmdFRvcCwgMTApO1xuXHQgICAgICBzaGlmdExlZnQgPSBwYXJzZUZsb2F0KHNoaWZ0TGVmdCwgMTApO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgc2hpZnRUb3AgPSBzaGlmdC50b3A7XG5cdCAgICAgIHNoaWZ0TGVmdCA9IHNoaWZ0LmxlZnQ7XG5cdCAgICB9XG5cblx0ICAgIHRvcCArPSBzaGlmdFRvcDtcblx0ICAgIGxlZnQgKz0gc2hpZnRMZWZ0O1xuXG5cdCAgICByZXR1cm4geyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9O1xuXHQgIH1cblx0fSk7XG5cdHJldHVybiBUZXRoZXI7XG5cblx0fSkpO1xuXG5cbi8qKiovIH1cbi8qKioqKiovIF0pXG59KTtcbjsiXSwiZmlsZSI6InN0eWxlZ3VpZGUuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
