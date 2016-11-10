(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("velocity-animate"), require("tether-shepherd"), require("lodash"), require("classnames"), require("react"), require("jquery"), require("socrata-utils"), require("dotdotdot"), require("dompurify"), require("react-dom"));
	else if(typeof define === 'function' && define.amd)
		define(["velocity-animate", "tether-shepherd", "lodash", "classnames", "react", "jquery", "socrata-utils", "dotdotdot", "dompurify", "react-dom"], factory);
	else if(typeof exports === 'object')
		exports["styleguide"] = factory(require("velocity-animate"), require("tether-shepherd"), require("lodash"), require("classnames"), require("react"), require("jquery"), require("socrata-utils"), require("dotdotdot"), require("dompurify"), require("react-dom"));
	else
		root["styleguide"] = factory(root["velocity-animate"], root["tether-shepherd"], root["lodash"], root["classnames"], root["react"], root["jquery"], root["socrata-utils"], root["dotdotdot"], root["dompurify"], root["react-dom"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_3__, __WEBPACK_EXTERNAL_MODULE_10__, __WEBPACK_EXTERNAL_MODULE_12__, __WEBPACK_EXTERNAL_MODULE_13__, __WEBPACK_EXTERNAL_MODULE_14__, __WEBPACK_EXTERNAL_MODULE_19__, __WEBPACK_EXTERNAL_MODULE_20__, __WEBPACK_EXTERNAL_MODULE_23__, __WEBPACK_EXTERNAL_MODULE_25__, __WEBPACK_EXTERNAL_MODULE_29__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _Dropdown = __webpack_require__(1);
	
	var _Dropdown2 = _interopRequireDefault(_Dropdown);
	
	var _Flannel = __webpack_require__(2);
	
	var _Flannel2 = _interopRequireDefault(_Flannel);
	
	var _Flyout = __webpack_require__(4);
	
	var _Flyout2 = _interopRequireDefault(_Flyout);
	
	var _Menu = __webpack_require__(5);
	
	var _Menu2 = _interopRequireDefault(_Menu);
	
	var _Modal = __webpack_require__(6);
	
	var _Modal2 = _interopRequireDefault(_Modal);
	
	var _Tabs = __webpack_require__(7);
	
	var _Tabs2 = _interopRequireDefault(_Tabs);
	
	var _Toggle = __webpack_require__(8);
	
	var _Toggle2 = _interopRequireDefault(_Toggle);
	
	var _Tour = __webpack_require__(9);
	
	var _Tour2 = _interopRequireDefault(_Tour);
	
	var _ColorPicker = __webpack_require__(11);
	
	var _ColorPicker2 = _interopRequireDefault(_ColorPicker);
	
	var _Dropdown3 = __webpack_require__(18);
	
	var _Dropdown4 = _interopRequireDefault(_Dropdown3);
	
	var _Picklist = __webpack_require__(21);
	
	var _Picklist2 = _interopRequireDefault(_Picklist);
	
	var _ViewCard = __webpack_require__(22);
	
	var _ViewCard2 = _interopRequireDefault(_ViewCard);
	
	var _ExternalViewCard = __webpack_require__(26);
	
	var _ExternalViewCard2 = _interopRequireDefault(_ExternalViewCard);
	
	var _FilterBar = __webpack_require__(27);
	
	var _FilterBar2 = _interopRequireDefault(_FilterBar);
	
	var _InfoPane = __webpack_require__(48);
	
	var _InfoPane2 = _interopRequireDefault(_InfoPane);
	
	var _Slider = __webpack_require__(34);
	
	var _Slider2 = _interopRequireDefault(_Slider);
	
	var _Modal3 = __webpack_require__(50);
	
	var _Modal4 = _interopRequireDefault(_Modal3);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	module.exports = {
	  attachTo: function attachTo(element) {
	    Object.keys(this.factories).forEach(function (factory) {
	      new this.factories[factory](element); // eslint-disable-line no-new
	    }, this);
	  },
	
	  factories: {
	    DropdownFactory: _Dropdown2.default,
	    FlannelFactory: _Flannel2.default,
	    FlyoutFactory: _Flyout2.default,
	    MenuFactory: _Menu2.default,
	    ModalFactory: _Modal2.default,
	    TabsFactory: _Tabs2.default,
	    ToggleFactory: _Toggle2.default,
	    TourFactory: _Tour2.default
	  },
	
	  ColorPicker: _ColorPicker2.default,
	  Dropdown: _Dropdown4.default,
	  Picklist: _Picklist2.default,
	  ViewCard: _ViewCard2.default,
	  ExternalViewCard: _ExternalViewCard2.default,
	  FilterBar: _FilterBar2.default,
	  InfoPane: _InfoPane2.default,
	  Slider: _Slider2.default,
	  Modal: _Modal4.default,
	  ModalHeader: _Modal3.ModalHeader,
	  ModalContent: _Modal3.ModalContent,
	  ModalFooter: _Modal3.ModalFooter
	};

/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';
	
	var Dropdown = function Dropdown(element) {
	  this.dd = element;
	  this.orientation = this.dd.getAttribute('data-orientation') || 'bottom';
	  this.selectable = this.dd.hasAttribute('data-selectable');
	
	  this.dd.classList.add('dropdown-orientation-' + this.orientation);
	
	  this.placeholder = this.dd.querySelector('span');
	  this.opts = Array.prototype.slice.call(this.dd.querySelectorAll('.dropdown-options > li'));
	
	  this.dd.dataset.value = '';
	  this.dd.dataset.index = -1;
	
	  this.initEvents();
	};
	
	Dropdown.prototype = {
	  initEvents: function initEvents() {
	    var obj = this;
	    // Reposition dropdown if it's near the edge of the window to avoid
	    // the dropdown making the window larger than we wanted
	    positionDropdown();
	
	    obj.dd.addEventListener('click', function () {
	      positionDropdown();
	      obj.dd.classList.toggle('active');
	      return false;
	    });
	
	    if (obj.selectable) {
	      obj.opts.forEach(function (opt) {
	        opt.addEventListener('click', function (event) {
	          event.preventDefault();
	
	          var node = opt.previousElementSibling;
	          var index = 0;
	
	          while (node !== null) {
	            index++;
	            node = node.previousElementSibling;
	          }
	
	          obj.dd.dataset.value = opt.textContent;
	          obj.dd.dataset.index = index;
	
	          obj.placeholder.innerHTML = opt.innerText.trim();
	
	          return false;
	        });
	      });
	    }
	
	    document.addEventListener('click', function (event) {
	      var node = event.target;
	      while (node.parentElement && !node.classList.contains('dropdown')) {
	        node = node.parentElement;
	      }
	
	      if (node !== obj.dd) {
	        obj.dd.classList.remove('active');
	      }
	    });
	
	    window.addEventListener('resize', function () {
	      positionDropdown();
	    });
	
	    function positionDropdown() {
	      var optionsElement = obj.dd.querySelector('.dropdown-options');
	      var optionsElementWidth = optionsElement.offsetWidth;
	      var windowWidth = document.body.offsetWidth;
	
	      // Get left to check if the dropdown options are hanging off the side of the page
	      var node = optionsElement;
	      var left = 0;
	
	      do {
	        left += node.offsetLeft;
	        node = node.offsetParent;
	      } while (node !== null);
	
	      // Update dropdown options position if needed
	      if (optionsElementWidth + left >= windowWidth || optionsElement.style.left) {
	        var dropdownWidth = obj.dd.getBoundingClientRect().width;
	        var leftOffset = -(optionsElementWidth - dropdownWidth);
	        optionsElement.style.left = leftOffset + 'px';
	      }
	    }
	  }
	};
	
	module.exports = function DropdownFactory(element) {
	  this.dropdowns = Array.prototype.slice.call(element.querySelectorAll('[data-dropdown]'));
	  this.dropdowns.forEach(function (dropdown) {
	    new Dropdown(dropdown); // eslint-disable-line no-new
	  });
	};

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var velocity = __webpack_require__(3);
	
	module.exports = function FlannelFactory() {
	  var mobileBreakpoint = 420;
	  var animationDuration = 300;
	  var animationEasing = [0.645, 0.045, 0.355, 1];
	  var hoverables = Array.prototype.slice.apply(document.querySelectorAll('[data-flannel]'));
	  var lastFocusedItem = null;
	
	  function hideFlannel(flannel, hoverable) {
	    if (window.innerWidth <= mobileBreakpoint) {
	      velocity(flannel, {
	        left: window.innerWidth
	      }, {
	        duration: animationDuration,
	        easing: animationEasing,
	        complete: function complete() {
	          flannel.classList.add('flannel-hidden');
	          hoverable.classList.remove('active');
	        }
	      });
	    } else {
	      flannel.classList.add('flannel-hidden');
	      hoverable.classList.remove('active');
	    }
	
	    // Always remove modal-open because there's no harm
	    // and we will avoid an unscrollable state.
	    document.body.classList.remove('modal-open');
	
	    var elementToFocus = flannel.children[0] || flannel;
	    elementToFocus.removeAttribute('tabindex');
	    elementToFocus.style.outline = '';
	
	    // Return focus to the last previously focused on element
	    if (lastFocusedItem) {
	      lastFocusedItem.focus();
	      lastFocusedItem = null;
	    }
	  }
	
	  function positionFlannel(flannel, hoverable) {
	    var arrowHeight = 16;
	    var left = 0;
	    var top = 0;
	    var flannelWidth = flannel.getBoundingClientRect().width;
	    var bodyWidth = document.body.offsetWidth; // Without scrollbar
	    var windowWidth = window.innerWidth; // With scrollbar
	
	    if (windowWidth <= mobileBreakpoint) {
	      if (!flannel.classList.contains('flannel-hidden')) {
	        document.body.classList.add('modal-open');
	      } else {
	        document.body.classList.remove('modal-open');
	      }
	
	      flannel.style.left = 0;
	      flannel.style.top = 0;
	      return;
	    }
	
	    var hoverableDimensions = hoverable.getBoundingClientRect();
	
	    left = hoverableDimensions.left + hoverable.offsetWidth / 2;
	    top = hoverableDimensions.top + hoverable.offsetHeight + arrowHeight;
	
	    if (left + flannelWidth > bodyWidth && windowWidth > mobileBreakpoint) {
	      flannel.classList.remove('flannel-right');
	      flannel.classList.add('flannel-left');
	      left -= flannelWidth;
	    } else {
	      flannel.classList.remove('flannel-left');
	      flannel.classList.add('flannel-right');
	    }
	
	    flannel.style.left = left + 'px';
	    flannel.style.top = top + 'px';
	
	    document.body.classList.remove('modal-open');
	  }
	
	  hoverables.forEach(function (hoverable) {
	    var flannelId = hoverable.getAttribute('data-flannel');
	    var flannel = document.querySelector('#' + flannelId);
	    var dismissals = Array.prototype.slice.apply(flannel.querySelectorAll('[data-flannel-dismiss]'));
	
	    dismissals.forEach(function (dismissal) {
	      dismissal.addEventListener('click', function () {
	        hideFlannel(flannel, hoverable);
	      });
	    });
	
	    hoverable.addEventListener('click', function (event) {
	      var windowWidth = window.innerWidth;
	      event.preventDefault();
	      event.stopPropagation();
	
	      if (windowWidth > mobileBreakpoint) {
	        flannel.classList.toggle('flannel-hidden');
	        positionFlannel(flannel, hoverable);
	      } else {
	        flannel.classList.remove('flannel-hidden');
	        flannel.style.left = windowWidth + 'px';
	        flannel.style.top = 0;
	        document.body.classList.add('modal-open');
	
	        velocity(flannel, {
	          left: 0
	        }, {
	          duration: animationDuration,
	          easing: animationEasing
	        });
	      }
	
	      // Store last focused on element
	      lastFocusedItem = document.querySelector(':focus');
	
	      // Shift focus to the flannel
	      var elementToFocus = flannel.children[0] || flannel;
	      elementToFocus.setAttribute('tabindex', '0');
	      elementToFocus.focus();
	      elementToFocus.style.outline = 'none';
	    });
	
	    var boundPositionFlannel = positionFlannel.bind(null, flannel, hoverable);
	    window.addEventListener('scroll', boundPositionFlannel);
	    window.addEventListener('wheel', boundPositionFlannel);
	
	    document.body.addEventListener('click', function (event) {
	      var node = event.target;
	
	      if (node === hoverable || flannel.classList.contains('flannel-hidden')) {
	        return;
	      }
	
	      while (node.parentElement) {
	        if (node.id === flannelId) {
	          return;
	        }
	        node = node.parentElement;
	      }
	
	      hideFlannel(flannel, hoverable);
	    });
	
	    document.body.addEventListener('keyup', function (event) {
	      var key = event.which || event.keyCode;
	
	      // ESC
	      if (key === 27) {
	        hideFlannel(flannel, hoverable);
	      }
	    });
	
	    window.addEventListener('resize', function () {
	      if (!flannel.classList.contains('flannel-hidden')) {
	        positionFlannel(flannel, hoverable);
	      }
	    });
	  });
	};

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_3__;

/***/ },
/* 4 */
/***/ function(module, exports) {

	'use strict';
	
	module.exports = function FlyoutFactory(element) {
	  var hoverables = Array.prototype.slice.apply(element.querySelectorAll('[data-flyout]'));
	
	  hoverables.forEach(function (hoverable) {
	    var flyout = element.querySelector('#' + hoverable.getAttribute('data-flyout'));
	    var show = function show() {
	      flyout.classList.remove('flyout-hidden');
	    };
	
	    var reposition = function reposition() {
	      var left = 0;
	      var top = 0;
	      var arrowHeight = 16;
	      var flyoutWidth = flyout.offsetWidth;
	      var windowWidth = document.body.offsetWidth;
	      var hoverableDimensions = hoverable.getBoundingClientRect();
	
	      left = hoverableDimensions.left + hoverable.offsetWidth / 2;
	      top = hoverableDimensions.top + hoverable.offsetHeight + arrowHeight;
	
	      if (left + flyoutWidth > windowWidth) {
	        flyout.classList.remove('flyout-right');
	        flyout.classList.add('flyout-left');
	        left -= flyoutWidth;
	      } else {
	        flyout.classList.remove('flyout-left');
	        flyout.classList.add('flyout-right');
	      }
	
	      flyout.style.left = left + 'px';
	      flyout.style.top = top + 'px';
	    };
	
	    window.addEventListener('scroll', reposition);
	    window.addEventListener('wheel', reposition);
	
	    hoverable.addEventListener('mouseover', function () {
	      show();
	      reposition();
	    });
	
	    hoverable.addEventListener('mouseout', function () {
	      flyout.classList.add('flyout-hidden');
	    });
	  });
	};

/***/ },
/* 5 */
/***/ function(module, exports) {

	'use strict';
	
	module.exports = function MenuFactory(element) {
	  var menus = Array.prototype.slice.call(element.querySelectorAll('.menu'));
	  var toggles = Array.prototype.slice.call(element.querySelectorAll('[data-menu-toggle]'));
	
	  toggles.forEach(function (toggle) {
	    toggle.addEventListener('click', function () {
	      var menu = element.querySelector('#' + toggle.getAttribute('data-menu-toggle'));
	      menu.classList.toggle('active');
	    });
	  });
	
	  menus.forEach(function (menu) {
	    var dismissals = Array.prototype.slice.call(menu.querySelectorAll('[data-menu-dismiss]'));
	
	    dismissals.forEach(function (dismissal) {
	      dismissal.addEventListener('click', function () {
	        menu.classList.remove('active');
	        document.querySelector('[data-menu-toggle="' + menu.id + '"]').classList.remove('active');
	      });
	    });
	  });
	};

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var velocity = __webpack_require__(3);
	
	var mobileBreakpoint = 420;
	var animationDuration = 300;
	var animationEasing = [0.645, 0.045, 0.355, 1];
	
	var ModalFactory = module.exports = function (element) {
	  this.root = element;
	  this.dismissals = Array.prototype.slice.apply(element.querySelectorAll('[data-modal-dismiss]'));
	  this.openers = Array.prototype.slice.apply(element.querySelectorAll('[data-modal]'));
	  this.lastFocusedItem = null;
	  this.attachEvents();
	};
	
	ModalFactory.prototype = {
	  attachEvents: function attachEvents() {
	    this.dismissals.forEach(function (dismissal) {
	      dismissal.addEventListener('click', this.dismiss.bind(this));
	    }, this);
	
	    this.openers.forEach(function (opener) {
	      opener.addEventListener('click', this.open.bind(this));
	    }, this);
	
	    document.addEventListener('keyup', function (event) {
	      var key = event.which || event.keyCode;
	
	      // ESC
	      if (key === 27) {
	        var modals = Array.prototype.slice.call(document.querySelectorAll('.modal:not(.modal-hidden)'));
	
	        modals.forEach(function (modal) {
	          // All legacy modals instantiated by this factory will have this
	          // attribute; this check allows us to use the same classes in our
	          // newer React component without accidentally inheriting behavior,
	          // in the event that both legacy and React modals are simultaneously
	          // in use. See open() for the line that sets this data attribute.
	          if (modal.getAttribute('data-legacy-modal')) {
	            modal.classList.add('modal-hidden');
	            document.body.classList.remove('modal-open');
	            this.restoreFocus(modal);
	          }
	        }.bind(this));
	      }
	    }.bind(this));
	
	    window.addEventListener('resize', function () {
	      var modals = Array.prototype.slice.call(document.querySelectorAll('.modal:not(.modal-hidden)'));
	
	      modals.forEach(function (modal) {
	        this.reposition(modal.querySelector('.modal-container'));
	      }.bind(this));
	    }.bind(this));
	  },
	
	  open: function open(event) {
	    var modal = event.target.getAttribute('data-modal');
	    modal = this.root.querySelector('#' + modal);
	    modal.classList.remove('modal-hidden');
	    modal.setAttribute('data-legacy-modal', true);
	
	    document.body.classList.add('modal-open');
	
	    var windowWidth = window.innerWidth;
	    var modalContainer = modal.querySelector('.modal-container');
	
	    if (windowWidth <= mobileBreakpoint) {
	      modalContainer.style.left = windowWidth + 'px';
	
	      velocity(modalContainer, {
	        left: 0
	      }, {
	        duration: animationDuration,
	        easing: animationEasing
	      });
	    }
	
	    // Store last focused on element
	    this.lastFocusedItem = document.querySelector(':focus');
	
	    // Shift focus to the modal
	    var elementToFocus = modalContainer.children[0] || modalContainer;
	    elementToFocus.setAttribute('tabindex', '0');
	    elementToFocus.focus();
	    elementToFocus.style.outline = 'none';
	
	    this.reposition(modalContainer);
	  },
	
	  dismiss: function dismiss(event) {
	    var self = this;
	    var target = event.target;
	
	    var closeable = target === event.currentTarget && target.classList.contains('modal-overlay');
	    var modal;
	
	    // Find the modal and figure out if it's closeable.
	    do {
	      if (target.hasAttribute('data-modal-dismiss') && !target.classList.contains('modal')) {
	        closeable = true;
	      } else if (target.classList.contains('modal')) {
	        modal = target;
	        break;
	      }
	
	      target = target.parentNode;
	    } while (target !== self.root);
	
	    if (!modal) {
	      return;
	    }
	
	    function hideModal() {
	      if (closeable) {
	        document.body.classList.remove('modal-open');
	        modal.classList.add('modal-hidden');
	
	        self.restoreFocus(modal);
	      }
	    }
	
	    var windowWidth = window.innerWidth;
	    var modalContainer = modal.querySelector('.modal-container');
	
	    if (windowWidth <= mobileBreakpoint && closeable) {
	      velocity(modalContainer, {
	        left: windowWidth
	      }, {
	        duration: animationDuration,
	        easing: animationEasing,
	        complete: hideModal
	      });
	    } else {
	      hideModal();
	    }
	  },
	
	  restoreFocus: function restoreFocus(modal) {
	    var elementToFocus = modal.querySelector('.modal-container').children[0] || modal;
	    elementToFocus.removeAttribute('tabindex');
	    elementToFocus.style.outline = '';
	
	    // Return focus to the last previously focused on element
	    if (this.lastFocusedItem) {
	      this.lastFocusedItem.focus();
	      this.lastFocusedItem = null;
	    }
	  },
	
	  reposition: function reposition(modal) {
	    if (modal.classList.contains('modal-hidden')) {
	      return;
	    }
	
	    if (!modal.getAttribute('data-legacy-modal')) {
	      return;
	    }
	
	    var windowWidth = window.innerWidth;
	
	    if (windowWidth > mobileBreakpoint) {
	      modal.style.margin = '';
	    } else {
	      modal.style.margin = 0;
	    }
	  }
	};

/***/ },
/* 7 */
/***/ function(module, exports) {

	'use strict';
	
	module.exports = function TabsFactory(element) {
	  var tabSections = Array.prototype.slice.call(element.querySelectorAll('[data-tabs]'));
	
	  tabSections.forEach(function (section) {
	    var tabLinks = Array.prototype.slice.call(section.querySelectorAll('[data-tab-id]'));
	    var tabContents = Array.prototype.slice.call(section.querySelectorAll('[data-tab-content]'));
	
	    tabLinks.forEach(function (link) {
	      link.addEventListener('click', function (event) {
	        event.preventDefault();
	        var tabId = event.currentTarget.dataset.tabId;
	
	        tabLinks.forEach(function (tabLink) {
	          tabLink.classList.remove('current');
	        });
	
	        tabContents.forEach(function (content) {
	          content.classList.remove('current');
	        });
	
	        link.classList.add('current');
	        section.querySelector('#' + tabId).classList.add('current');
	      });
	    });
	  });
	};

/***/ },
/* 8 */
/***/ function(module, exports) {

	'use strict';
	
	var ToggleFactory = module.exports = function (element) {
	  var toggles = Array.prototype.slice.apply(element.querySelectorAll('[data-toggle]'));
	  this.element = element;
	
	  toggles.forEach(function (toggle) {
	    toggle.addEventListener('click', this.toggle.bind(this));
	  }, this);
	};
	
	ToggleFactory.prototype = {
	  toggle: function toggle(event) {
	    var target = event.target;
	
	    do {
	      if (target.hasAttribute('data-toggle')) {
	        return target.classList.toggle('active');
	      }
	
	      target = target.parentNode;
	    } while (target !== this.element);
	  }
	};

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var Shepherd = __webpack_require__(10);
	
	// CustomEvent polyfill for IE10/11 (from frontend-utils)
	var CustomEvent = function CustomEvent(eventName, params) {
	  var eventParams = { bubbles: false, cancelable: false, detail: undefined };
	
	  for (var key in params) {
	    if (params.hasOwnProperty(key)) {
	      eventParams[key] = params[key];
	    }
	  }
	
	  var customEvent = document.createEvent('CustomEvent');
	
	  customEvent.initCustomEvent(eventName, eventParams.bubbles, eventParams.cancelable, eventParams.detail);
	
	  return customEvent;
	};
	
	var TourFactory = module.exports = function (element) {
	  this.root = element;
	  this.tourElements = Array.prototype.slice.apply(element.querySelectorAll('[data-tour]'));
	
	  if (this.tourElements.length > 0) {
	    this.tours = {};
	    this.currentTourName = null;
	
	    this.openers = Array.prototype.slice.apply(element.querySelectorAll('[data-tour-opener]'));
	
	    var tourOverlayElement = document.createElement('div');
	
	    tourOverlayElement.classList.add('tour-overlay');
	    tourOverlayElement.classList.add('overlay-hidden');
	
	    this.tourOverlay = document.body.appendChild(tourOverlayElement);
	
	    this.initialize();
	
	    // Open all tours without openers immediately
	    if (this.openers.length < this.tourElements.length) {
	      var that = this;
	      var openerNames = that.openers.map(function (opener) {
	        return opener.getAttribute('data-tour-opener');
	      });
	
	      that.tourElements.forEach(function (tourElement) {
	        var tourName = tourElement.getAttribute('data-tour-name');
	        if (!openerNames.includes(tourName)) {
	          that.openTour(tourName);
	        }
	      });
	    }
	  }
	};
	
	TourFactory.prototype = {
	  initialize: function initialize() {
	    var that = this;
	
	    that.tourElements.forEach(function (tourElement) {
	      that.initializeTour(tourElement);
	    });
	
	    that.attachEvents();
	  },
	  initializeTour: function initializeTour(tourElement) {
	    var that = this;
	    var tourName = tourElement.getAttribute('data-tour-name');
	
	    var tour = new Shepherd.Tour({
	      defaults: {
	        showCancelLink: true,
	        buttons: [{
	          text: tourElement.getAttribute('data-tour-skip'),
	          classes: 'btn-default',
	          action: function action() {
	            that.closeTour(tourName);
	          }
	        }, {
	          text: tourElement.getAttribute('data-tour-next'),
	          classes: 'btn-primary',
	          action: function action() {
	            that.clickNext(tourName);
	          }
	        }]
	      }
	    });
	
	    that.tours[tourName] = {
	      tour: tour,
	      name: tourName
	    };
	    that.addSteps(tour, tourElement);
	  },
	  addSteps: function addSteps(tour, tourElement) {
	    var that = this;
	
	    var steps = Array.prototype.slice.apply(tourElement.querySelectorAll('[data-tour-step]'));
	    var sortedSteps = steps.sort(function (a, b) {
	      var stepA = parseInt(a.getAttribute('data-step-number'), 10);
	      var stepB = parseInt(b.getAttribute('data-step-number'), 10);
	
	      if (stepA > stepB) {
	        return 1;
	      } else if (stepA < stepB) {
	        return -1;
	      } else {
	        return 0;
	      }
	    });
	
	    sortedSteps.forEach(function (step, index) {
	      var stepConfig = {
	        title: step.getAttribute('data-title') || '',
	        text: step.innerHTML
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
	        };
	      }
	
	      if (sortedSteps.length - 1 === index) {
	        stepConfig.buttons = [{
	          text: tourElement.getAttribute('data-tour-done'),
	          classes: 'btn-primary',
	          action: function action() {
	            var tourName = tourElement.getAttribute('data-tour-name');
	            that.clickDone(tourName);
	          }
	        }];
	      }
	
	      tour.addStep(stepConfig);
	
	      tour.on('active', function () {
	        that.tourOverlay.classList.remove('overlay-hidden');
	      });
	
	      tour.on('inactive', function () {
	        that.tourOverlay.classList.add('overlay-hidden');
	      });
	    });
	  },
	  attachEvents: function attachEvents() {
	    var that = this;
	
	    that.openers.forEach(function (opener) {
	      var clickHandler = that.openTour.bind(that, opener.getAttribute('data-tour-opener'));
	      opener.addEventListener('click', clickHandler);
	    }, that);
	
	    document.addEventListener('keyup', function (event) {
	      var key = event.which || event.keyCode;
	
	      if (that.currentTourName === null) {
	        return;
	      }
	
	      // ESC
	      if (key === 27) {
	        that.closeTour(that.currentTourName);
	      }
	    });
	
	    that.tourOverlay.addEventListener('click', function () {
	      that.closeTour(that.currentTourName);
	    });
	  },
	  openTour: function openTour(tourName) {
	    var tourObject = this.tours[tourName];
	
	    this.currentTourName = tourObject.name;
	
	    tourObject.tour.start();
	    this.tourOverlay.classList.remove('overlay-hidden');
	  },
	  clickDone: function clickDone(tourName) {
	    var tourObject = this.tours[tourName];
	    var payload = {
	      currentStep: tourObject.tour.getCurrentStep().id.replace('step-', ''),
	      tourName: tourObject.name
	    };
	    var event = new CustomEvent('SOCRATA_STYLEGUIDE_TOUR_COMPLETE', { 'detail': payload });
	
	    document.dispatchEvent(event);
	    tourObject.tour.complete();
	  },
	  clickNext: function clickNext(tourName) {
	    var tourObject = this.tours[tourName];
	    var payload = {
	      currentStep: tourObject.tour.getCurrentStep().id.replace('step-', ''),
	      tourName: tourObject.name
	    };
	
	    document.dispatchEvent(new CustomEvent('SOCRATA_STYLEGUIDE_TOUR_NEXT', { 'detail': payload }));
	    tourObject.tour.next();
	  },
	  closeTour: function closeTour(tourName) {
	    var tourObject = this.tours[tourName];
	    var payload = {
	      currentStep: tourObject.tour.getCurrentStep().id.replace('step-', ''),
	      tourName: tourObject.name
	    };
	    var event = new CustomEvent('SOCRATA_STYLEGUIDE_TOUR_CLOSED', { 'detail': payload });
	
	    document.dispatchEvent(event);
	    tourObject.tour.cancel();
	  }
	};

/***/ },
/* 10 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_10__;

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.ColorPicker = undefined;
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _classnames = __webpack_require__(13);
	
	var _classnames2 = _interopRequireDefault(_classnames);
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _I18n = __webpack_require__(15);
	
	var _keycodes = __webpack_require__(17);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var ColorPicker = exports.ColorPicker = _react2.default.createClass({
	  displayName: 'ColorPicker',
	
	  propTypes: {
	    id: _react2.default.PropTypes.string,
	    value: _react2.default.PropTypes.oneOfType([_react2.default.PropTypes.string, _react2.default.PropTypes.array, _react2.default.PropTypes.object]),
	    palette: _react2.default.PropTypes.array,
	    handleColorChange: _react2.default.PropTypes.func,
	    bucketRevealDirection: _react2.default.PropTypes.string
	  },
	
	  getDefaultProps: function getDefaultProps() {
	    return {
	      type: 'single',
	      value: '#204490',
	      palette: ['#204490', '#9A2600', '#B26B00', '#006A01', '#6B176C', '#006A8B', '#9B2D52', '#457800', '#2F62CF', '#DE3700', '#FF9A00', '#009802', '#9A229B', '#0098C8', '#DF4176', '#64AC00', '#6D91DD', '#E7734D', '#FFB84D', '#4DB74E', '#B864B9', '#4DB7D8', '#E87A9F', '#92C54D'],
	      handleColorChange: _lodash2.default.noop
	    };
	  },
	  getInitialState: function getInitialState() {
	    return {
	      selectedColor: this.props.value,
	      showingBuckets: false
	    };
	  },
	  componentDidUpdate: function componentDidUpdate(prevProps, prevState) {
	    if (!prevState.showingBuckets && this.state.showingBuckets) {
	      this.colorBucketsRef.focus();
	    }
	  },
	  onClickColorFrame: function onClickColorFrame() {
	    this.setState({
	      showingBuckets: !this.state.showingBuckets
	    });
	  },
	  onClickBucket: function onClickBucket(selectedColor) {
	    this.setState({
	      showingBuckets: false,
	      selectedColor: selectedColor
	    });
	
	    this.props.handleColorChange(selectedColor);
	    this.colorPickerRef.focus();
	  },
	  onClose: function onClose() {
	    this.setState({
	      showingBuckets: false
	    });
	  },
	  onChangeInputColor: function onChangeInputColor(e) {
	    var selectedColor = e.target.value;
	    var isValidColor = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(selectedColor);
	
	    if (isValidColor) {
	      this.props.handleColorChange(selectedColor);
	    }
	
	    this.setState({ selectedColor: selectedColor });
	  },
	  onKeyDownColorPicker: function onKeyDownColorPicker(event) {
	    (0, _keycodes.isolateEventByKeys)(event, [_keycodes.DOWN]);
	  },
	  onKeyUpColorPicker: function onKeyUpColorPicker(event) {
	    var keyCode = event.keyCode;
	
	    (0, _keycodes.isolateEventByKeys)(event, [_keycodes.DOWN, _keycodes.ESCAPE]);
	
	    if (keyCode === _keycodes.DOWN) {
	      this.setState({ showingBuckets: true });
	    } else if (keyCode === _keycodes.ESCAPE) {
	      this.onClose();
	    }
	  },
	  onKeyUpColorBucket: function onKeyUpColorBucket(color, event) {
	    var keyCode = event.keyCode;
	
	    (0, _keycodes.isolateEventByKeys)(event, [_keycodes.ENTER, _keycodes.SPACE, _keycodes.ESCAPE]);
	
	    if (keyCode === _keycodes.ENTER || keyCode === _keycodes.SPACE) {
	      this.onClickBucket(color);
	    } else if (keyCode === _keycodes.ESCAPE) {
	      this.onClose();
	    }
	  },
	  onKeyDownColorBucket: function onKeyDownColorBucket(event) {
	    (0, _keycodes.isolateEventByKeys)(event, [_keycodes.ENTER, _keycodes.SPACE]);
	  },
	  onKeyUpHexInput: function onKeyUpHexInput(event) {
	    var keyCode = event.keyCode;
	
	    (0, _keycodes.isolateEventByKeys)(event, [_keycodes.ENTER, _keycodes.ESCAPE]);
	
	    if (keyCode === _keycodes.ENTER) {
	      this.onChangeInputColor(event);
	      this.setState({ showingBuckets: false });
	      this.colorPickerRef.focus();
	    } else if (keyCode === _keycodes.ESCAPE) {
	      this.onClose();
	    }
	  },
	  renderColorBucket: function renderColorBucket(color, key) {
	    var isSelectedColor = color === this.state.selectedColor;
	    var attributes = {
	      key: key,
	      id: color,
	      tabIndex: 0,
	      role: 'option',
	      onClick: this.onClickBucket.bind(this, color),
	      onKeyUp: this.onKeyUpColorBucket.bind(this, color),
	      onKeyDown: this.onKeyDownColorBucket,
	      style: { backgroundColor: color },
	      'aria-selected': isSelectedColor,
	      'aria-label': (0, _I18n.translate)('color_picker.pickable_color') + ' ' + color,
	      className: (0, _classnames2.default)('color-bucket', {
	        'selected-color': isSelectedColor
	      })
	    };
	
	    return _react2.default.createElement('div', attributes);
	  },
	  renderColorBuckets: function renderColorBuckets() {
	    var _this = this;
	
	    var _props = this.props;
	    var palette = _props.palette;
	    var bucketRevealDirection = _props.bucketRevealDirection;
	    var _state = this.state;
	    var selectedColor = _state.selectedColor;
	    var showingBuckets = _state.showingBuckets;
	
	    var colorBuckets = _lodash2.default.map(palette, this.renderColorBucket);
	    var bucketContainerClassName = (0, _classnames2.default)('color-buckets-container', {
	      'hidden': !showingBuckets,
	      'reveal-from-top': bucketRevealDirection === 'top'
	    });
	
	    var colorBucketsAttributes = {
	      className: 'color-buckets color-' + palette.length,
	      ref: function ref(_ref) {
	        return _this.colorBucketsRef = _ref;
	      },
	      role: 'listbox',
	      tabIndex: 0,
	      'aria-activedescendant': selectedColor
	    };
	    var hexInputAttributes = {
	      type: 'text',
	      value: selectedColor,
	      onChange: this.onChangeInputColor,
	      onKeyUp: this.onKeyUpHexInput
	    };
	
	    return _react2.default.createElement(
	      'div',
	      { className: bucketContainerClassName },
	      _react2.default.createElement(
	        'div',
	        colorBucketsAttributes,
	        colorBuckets
	      ),
	      _react2.default.createElement('input', hexInputAttributes)
	    );
	  },
	  renderColorFrame: function renderColorFrame() {
	    var _this2 = this;
	
	    var selectedColor = this.state.selectedColor;
	
	    var openColorPicker = (0, _I18n.translate)('color_picker.open_color_picker');
	    var withCurrentSelection = (0, _I18n.translate)('color_picker.with_currently_selected_color');
	    var label = selectedColor ? openColorPicker + ' ' + withCurrentSelection + ' ' + selectedColor : openColorPicker;
	    var colorFrameAttributes = {
	      className: 'color-frame',
	      onClick: this.onClickColorFrame,
	      role: 'button',
	      tabIndex: 0,
	      onKeyUp: this.onKeyUpColorPicker,
	      onKeyDown: this.onKeyDownColorPicker,
	      ref: function ref(_ref2) {
	        return _this2.colorPickerRef = _ref2;
	      },
	      'aria-label': label
	    };
	
	    var selectedColorFrameAttributes = {
	      className: 'selected-color-frame',
	      style: { backgroundColor: selectedColor }
	    };
	
	    return _react2.default.createElement(
	      'div',
	      colorFrameAttributes,
	      _react2.default.createElement('div', selectedColorFrameAttributes),
	      _react2.default.createElement(
	        'div',
	        { className: 'caret', role: 'presentation' },
	        _react2.default.createElement('span', { className: 'icon-arrow-down' })
	      )
	    );
	  },
	  renderColorPickerOverlay: function renderColorPickerOverlay() {
	    var colorOverlayClassName = (0, _classnames2.default)('color-picker-overlay', {
	      'hidden': !this.state.showingBuckets
	    });
	
	    return _react2.default.createElement('div', { className: colorOverlayClassName, onClick: this.onClose, role: 'button' });
	  },
	  render: function render() {
	    var colorPickerAttributes = {
	      className: 'color-picker',
	      id: this.props.id
	    };
	
	    return _react2.default.createElement(
	      'div',
	      colorPickerAttributes,
	      this.renderColorPickerOverlay(),
	      this.renderColorFrame(),
	      this.renderColorBuckets()
	    );
	  }
	});
	
	exports.default = ColorPicker;

/***/ },
/* 12 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_12__;

/***/ },
/* 13 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_13__;

/***/ },
/* 14 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_14__;

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.translateGroup = exports.translate = exports.setLocale = undefined;
	
	var _lodash = __webpack_require__(12);
	
	var _en = __webpack_require__(16);
	
	var _en2 = _interopRequireDefault(_en);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var locale = 'en';
	var locales = { en: _en2.default };
	
	var setLocale = exports.setLocale = function setLocale(key) {
	  key = (0, _lodash.isString)(key) ? key.toLowerCase() : null;
	
	  if ((0, _lodash.has)(locales, key)) {
	    locale = key;
	  } else {
	    throw new Error('I18n: The locale ' + key + ' is not available.');
	  }
	};
	
	var translate = exports.translate = function translate(key) {
	  key = (0, _lodash.isString)(key) ? key.toLowerCase() : null;
	  var translation = (0, _lodash.get)(locales[locale], key, null);
	
	  if ((0, _lodash.isString)(translation)) {
	    return translation;
	  } else if ((0, _lodash.isNull)(key)) {
	    throw new Error('I18n: translate requires a String.');
	  } else if ((0, _lodash.isPlainObject)(translation)) {
	    throw new Error('I18n: Access to a group of translations is not allowed. Use translateGroup instead.');
	  } else {
	    throw new Error('I18n: Translation missing for ' + key + '.');
	  }
	};
	
	var translateGroup = exports.translateGroup = function translateGroup(key) {
	  key = (0, _lodash.isString)(key) ? key.toLowerCase() : null;
	  var translationGroup = (0, _lodash.get)(locales[locale], key, null);
	
	  if ((0, _lodash.isPlainObject)(translationGroup)) {
	    return translationGroup;
	  } else if ((0, _lodash.isNull)(key)) {
	    throw new Error('I18n: translateGroup requires a String.');
	  } else if ((0, _lodash.isString)(translationGroup)) {
	    throw new Error('I18n: Access to a direct translation is not allowed. Use translate instead.');
	  } else {
	    throw new Error('I18n: Translations missing for ' + key);
	  }
	};

/***/ },
/* 16 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = {
	  color_picker: {
	    open_color_picker: 'Open Color Picker',
	    pickable_color: 'Pickable color',
	    with_currently_selected_color: 'with currently selected color'
	  },
	  filter_bar: {
	    add_filter: 'Add Filter',
	    all: 'All',
	    apply: 'Apply',
	    cancel: 'Cancel',
	    clear: 'Clear',
	    configure_filter: 'Configure Filter',
	    filter: 'Filter:',
	    from: 'From',
	    to: 'To',
	    no_options_found: 'No options found',
	    range_filter: {
	      range_label: 'From {0} to {1}',
	      greater_label: 'Greater than {0}',
	      less_label: 'Less than {0}'
	    },
	    range: 'Range',
	    remove_filter: 'Remove Filter',
	    search: 'Search options'
	  },
	  info_pane: {
	    less: 'Less',
	    more: 'More',
	    official: 'Official',
	    private_notice: 'This view is private'
	  },
	  modal: {
	    aria_close: 'Close modal'
	  },
	  view_card: {
	    external_content: 'External Content'
	  }
	};

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.isolateEventByKeys = exports.SPACE = exports.ESCAPE = exports.ENTER = exports.DOWN = exports.UP = undefined;
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var UP = exports.UP = 38;
	var DOWN = exports.DOWN = 40;
	var ENTER = exports.ENTER = 13;
	var ESCAPE = exports.ESCAPE = 27;
	var SPACE = exports.SPACE = 32;
	
	/**
	 * Don't bubble up or run default keystrokes
	 * if the last-pressed key is within the array of keys.
	 */
	var isolateEventByKeys = exports.isolateEventByKeys = function isolateEventByKeys(event, keys) {
	  if (_lodash2.default.includes(keys, event.keyCode)) {
	    event.stopPropagation();
	    event.preventDefault();
	  }
	};
	
	exports.default = {
	  UP: UP,
	  DOWN: DOWN,
	  ENTER: ENTER,
	  ESCAPE: ESCAPE
	};

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _jquery = __webpack_require__(19);
	
	var _jquery2 = _interopRequireDefault(_jquery);
	
	var _classnames = __webpack_require__(13);
	
	var _classnames2 = _interopRequireDefault(_classnames);
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _socrataUtils = __webpack_require__(20);
	
	var _socrataUtils2 = _interopRequireDefault(_socrataUtils);
	
	var _Picklist = __webpack_require__(21);
	
	var _Picklist2 = _interopRequireDefault(_Picklist);
	
	var _keycodes = __webpack_require__(17);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	exports.default = _react2.default.createClass({
	  displayName: 'Dropdown',
	
	  propTypes: {
	    disabled: _react2.default.PropTypes.bool,
	    displayTrueWidthOptions: _react2.default.PropTypes.bool,
	    id: _react2.default.PropTypes.string,
	    onSelection: _react2.default.PropTypes.func,
	    options: _react2.default.PropTypes.arrayOf(_react2.default.PropTypes.object),
	    placeholder: _react2.default.PropTypes.oneOfType([_react2.default.PropTypes.string, _react2.default.PropTypes.func]),
	    value: _react2.default.PropTypes.string
	  },
	
	  getDefaultProps: function getDefaultProps() {
	    return {
	      disabled: false,
	      options: [],
	      placeholder: null,
	      onSelection: function onSelection() {}
	    };
	  },
	  getInitialState: function getInitialState() {
	    return {
	      selectedOption: this.getSelectedOption(this.props),
	      focused: false,
	      opened: false,
	      mousedDownOnOptions: false,
	      keyupOnOptions: false
	    };
	  },
	  componentDidMount: function componentDidMount() {
	    this.toggleScrollEvents(true);
	    this.toggleIsolateScrolling(true);
	    this.toggleDocumentMouseDown(true);
	  },
	  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
	    this.setState({
	      selectedOption: this.getSelectedOption(nextProps)
	    });
	  },
	  componentWillUpdate: function componentWillUpdate() {
	    this.positionPicklist();
	  },
	  componentDidUpdate: function componentDidUpdate() {
	    if (this.state.opened) {
	      this.picklistRef.picklist.focus();
	    }
	  },
	  componentWillUnmount: function componentWillUnmount() {
	    this.toggleScrollEvents(false);
	    this.toggleIsolateScrolling(false);
	    this.toggleDocumentMouseDown(false);
	  },
	
	
	  /**
	   * Safari and IE blur when the scrollbar is clicked to initiate
	   * a scrolling action. This event handler prevents any clicks within the
	   * dropdown from kicking off a blur.
	   */
	  onMouseDown: function onMouseDown(event) {
	    var mousedDownOnOptions = event.target === this.optionsRef;
	
	    if (mousedDownOnOptions) {
	      event.preventDefault();
	    }
	
	    this.setState({ mousedDownOnOptions: mousedDownOnOptions });
	  },
	
	
	  /**
	   * Looks up the DOM tree from the target and determine if the
	   * options container is an ancestor. If not, close up the options
	   * container because the user is scrolling outside of component.
	   */
	  onAnyScroll: function onAnyScroll(event) {
	    if (event) {
	      var list = (0, _jquery2.default)(event.target).closest('.dropdown-options-list');
	      var nonrelated = list.length === 0;
	
	      if (nonrelated) {
	        this.setState({ opened: false });
	      }
	    }
	  },
	  onKeyUpDropdown: function onKeyUpDropdown(event) {
	    var keyCode = event.keyCode;
	
	
	    (0, _keycodes.isolateEventByKeys)(event, [_keycodes.ENTER, _keycodes.DOWN, _keycodes.SPACE]);
	
	    if (keyCode === _keycodes.ENTER || keyCode === _keycodes.SPACE) {
	      this.setState({ focused: true, opened: false });
	    }
	  },
	  onMouseUpDropdown: function onMouseUpDropdown() {
	    this.setState({ focused: true, opened: false });
	  },
	  onClickPlaceholder: function onClickPlaceholder() {
	    this.onAnyScroll();
	    this.setState({ opened: !this.state.opened });
	  },
	  onFocusPlaceholder: function onFocusPlaceholder() {
	    this.setState({ focused: true });
	  },
	
	
	  /**
	   * The state variable mousedDownOnOptions determines
	   * whether or not the blur we received should be
	   * responded to. Mousedown is set to off regardless of
	   * how we respond to ready for the next blur.
	   */
	  onBlurPlaceholder: function onBlurPlaceholder() {
	    if (!this.state.mousedDownOnOptions) {
	      this.optionsRef.scrollTop = 0;
	      this.setState({ focused: false });
	    } else if (!this.state.opened) {
	      this.placeholderRef.focus();
	    }
	
	    this.setState({ mousedDownOnOptions: false });
	  },
	  onKeyDownPlaceholder: function onKeyDownPlaceholder(event) {
	    (0, _keycodes.isolateEventByKeys)(event, [_keycodes.ESCAPE, _keycodes.DOWN, _keycodes.SPACE]);
	  },
	  onKeyUpPlaceholder: function onKeyUpPlaceholder(event) {
	    var keyCode = event.keyCode;
	
	
	    (0, _keycodes.isolateEventByKeys)(event, [_keycodes.ESCAPE, _keycodes.DOWN, _keycodes.SPACE]);
	
	    if (keyCode === _keycodes.ESCAPE) {
	      this.onBlurPlaceholder();
	    } else if (keyCode === _keycodes.DOWN || keyCode === _keycodes.SPACE) {
	      this.openPicklist();
	    }
	  },
	  onFocusPicklist: function onFocusPicklist() {
	    this.setState({ focused: false });
	  },
	  onBlurPicklist: function onBlurPicklist() {
	    this.setState({ focused: true, opened: false });
	    this.placeholderRef.focus();
	  },
	  onClickOption: function onClickOption(selectedOption) {
	    this.props.onSelection(selectedOption);
	    this.setState({ selectedOption: selectedOption });
	  },
	  getSelectedOption: function getSelectedOption(props) {
	    var value = props.value;
	    var options = props.options;
	
	    return _lodash2.default.find(options, { value: value }) || null;
	  },
	  openPicklist: function openPicklist() {
	    var options = this.props.options;
	
	    var selectedOption = this.state.selectedOption || _lodash2.default.first(options);
	
	    this.setState({
	      opened: true,
	      selectedOption: selectedOption
	    });
	  },
	  positionPicklist: function positionPicklist() {
	    var hasOptions = this.optionsRef && this.optionsRef.querySelectorAll('.picklist-option').length > 0;
	
	    if (hasOptions) {
	      var displayTrueWidthOptions = this.props.displayTrueWidthOptions;
	
	      var containerDimensions = this.dropdownRef.getBoundingClientRect();
	      var browserWindowHeight = window.document.documentElement.clientHeight - 10;
	
	      // Calculate Position
	
	      var optionsTop = this.dropdownRef.clientHeight + containerDimensions.top - containerDimensions.height;
	
	      this.optionsRef.style.top = optionsTop + 'px';
	      this.optionsRef.style.left = containerDimensions.left + 'px';
	
	      // Calculate Height
	
	      var dimensions = this.optionsRef.getBoundingClientRect();
	      var scrollHeight = this.optionsRef.scrollHeight;
	      var exceedsBrowserWindowHeight = browserWindowHeight < dimensions.top + scrollHeight;
	      var optionHeight = this.optionsRef.querySelector('.picklist-option').clientHeight;
	      var determinedHeight = browserWindowHeight - dimensions.top;
	
	      if (exceedsBrowserWindowHeight) {
	        this.optionsRef.style.height = Math.max(determinedHeight, optionHeight) + 'px';
	        this.picklistRef.picklist.style.height = Math.max(determinedHeight, optionHeight) + 'px';
	      } else if (this.optionsRef.style.height !== 'auto') {
	        this.optionsRef.style.height = 'auto';
	        this.picklistRef.picklist.style.height = 'auto';
	      }
	
	      if (!displayTrueWidthOptions) {
	        this.optionsRef.style.width = containerDimensions.width + 'px';
	      }
	    }
	  },
	  toggleDocumentMouseDown: function toggleDocumentMouseDown(onOrOff) {
	    document[onOrOff ? 'addEventListener' : 'removeEventListener']('mousedown', this.onMouseDown);
	  },
	
	
	  /**
	   * When scrolling the options, we don't want the outer containers
	   * to accidentally scroll once the start or end of the options is
	   * reached.
	   */
	  toggleIsolateScrolling: function toggleIsolateScrolling(onOrOff) {
	    _socrataUtils2.default.isolateScrolling((0, _jquery2.default)(this.optionsRef), onOrOff);
	  },
	
	
	  /**
	   * Places scrolling event listeners on all ancestors that are scrollable.
	   *
	   * This is done to properly hide the dropdown when the user
	   * scrolls an inner container.
	   *
	   * This functions as a toggle that will add or remove the event listeners
	   * depending on a boolean value passed as the first parameter.
	   */
	  toggleScrollEvents: function toggleScrollEvents(onOrOff) {
	    var _this = this;
	
	    var action = onOrOff ? 'addEventListener' : 'removeEventListener';
	    var toggleEvents = function toggleEvents(element) {
	      element[action]('scroll', _this.onAnyScroll);
	      element[action]('wheel', _this.onAnyScroll);
	    };
	
	    var setEventsOnEveryParent = function setEventsOnEveryParent(node) {
	      var parent = node.parentNode;
	
	      while (parent !== null && parent instanceof HTMLElement) {
	        var overflowY = window.getComputedStyle(parent).overflowY;
	        var isScrollable = overflowY === 'scroll' || overflowY === 'auto';
	        var hasScrollableArea = parent.scrollHeight > parent.clientHeight;
	
	        if (isScrollable && hasScrollableArea) {
	          toggleEvents(parent);
	        }
	
	        parent = parent.parentNode;
	      }
	    };
	
	    // Rummage through all the ancestors
	    // and apply/remove the event handlers.
	    setEventsOnEveryParent(this.dropdownRef);
	
	    // Apply/remove scrolling events on the window as well.
	    toggleEvents(window);
	  },
	  renderPlaceholder: function renderPlaceholder() {
	    var _this2 = this;
	
	    var placeholder = this.props.placeholder;
	    var selectedOption = this.state.selectedOption;
	
	    var caret = _react2.default.createElement('div', { className: 'dropdown-caret', key: 'caret' });
	    var placeholderText = function placeholderText(text) {
	      return _react2.default.createElement(
	        'span',
	        { key: 'placeholder' },
	        text
	      );
	    };
	    var placeholderIsFunction = typeof placeholder === 'function';
	    var placeholderIsString = typeof placeholder === 'string';
	
	    var attributes = {
	      onFocus: this.onFocusPlaceholder,
	      onBlur: this.onBlurPlaceholder,
	      onClick: this.onClickPlaceholder,
	      onKeyUp: this.onKeyUpPlaceholder,
	      onKeyDown: this.onKeyDownPlaceholder,
	      tabIndex: '0',
	      ref: function ref(_ref) {
	        return _this2.placeholderRef = _ref;
	      },
	      className: (0, _classnames2.default)({
	        'dropdown-placeholder': !placeholderIsFunction,
	        'dropdown-selected': !!selectedOption
	      })
	    };
	
	    if (placeholderIsFunction) {
	      placeholder = placeholder();
	    } else if (selectedOption) {
	      placeholder = [placeholderText(selectedOption.title), caret];
	    } else if (placeholderIsString) {
	      placeholder = [placeholderText(placeholder), caret];
	    } else if (placeholder === null) {
	      placeholder = [placeholderText('Select...'), caret];
	    }
	
	    return _react2.default.createElement(
	      'div',
	      attributes,
	      placeholder
	    );
	  },
	  render: function render() {
	    var _this3 = this;
	
	    var _props = this.props;
	    var disabled = _props.disabled;
	    var options = _props.options;
	    var id = _props.id;
	    var _state = this.state;
	    var focused = _state.focused;
	    var opened = _state.opened;
	    var selectedOption = _state.selectedOption;
	
	    var value = _lodash2.default.get(selectedOption, 'value', null);
	
	    var dropdownAttributes = {
	      id: id,
	      ref: function ref(_ref2) {
	        return _this3.dropdownRef = _ref2;
	      },
	      onKeyUp: this.onKeyUpDropdown,
	      onMouseUp: this.onMouseUpDropdown,
	      className: (0, _classnames2.default)('dropdown-container', {
	        'dropdown-focused': focused,
	        'dropdown-opened': opened,
	        'dropdown-disabled': disabled
	      })
	    };
	
	    var dropdownOptionsAttributes = {
	      ref: function ref(_ref3) {
	        return _this3.optionsRef = _ref3;
	      },
	      className: (0, _classnames2.default)('dropdown-options-list', {
	        'dropdown-invisible': !opened
	      })
	    };
	
	    var picklistAttributes = {
	      options: options,
	      disabled: disabled,
	      value: value,
	      ref: function ref(_ref4) {
	        return _this3.picklistRef = _ref4;
	      },
	      onSelection: this.onClickOption,
	      onFocus: this.onFocusPicklist,
	      onBlur: this.onBlurPicklist
	    };
	
	    var placeholder = this.renderPlaceholder();
	
	    return _react2.default.createElement(
	      'div',
	      dropdownAttributes,
	      placeholder,
	      _react2.default.createElement(
	        'div',
	        dropdownOptionsAttributes,
	        _react2.default.createElement(_Picklist2.default, picklistAttributes)
	      )
	    );
	  }
	});

/***/ },
/* 19 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_19__;

/***/ },
/* 20 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_20__;

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.Picklist = undefined;
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _classnames = __webpack_require__(13);
	
	var _classnames2 = _interopRequireDefault(_classnames);
	
	var _keycodes = __webpack_require__(17);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var Picklist = exports.Picklist = _react2.default.createClass({
	  displayName: 'Picklist',
	
	  propTypes: {
	    // A top-level HTML id attribute for easier selection.
	    id: _react2.default.PropTypes.string,
	    // Disables option selection.
	    disabled: _react2.default.PropTypes.bool,
	    // Sets the initial value when provided.
	    value: _react2.default.PropTypes.string,
	    options: _react2.default.PropTypes.arrayOf(_react2.default.PropTypes.shape({
	      // Used to render the option title.
	      title: _react2.default.PropTypes.string,
	      // Used for value comparisons during selection.
	      value: _react2.default.PropTypes.string,
	      // Used to visually group similar options.
	      // This value is UI text and should be human-friendly.
	      group: _react2.default.PropTypes.string,
	      // Receives the relevant option and
	      // must return a DOM-renderable value.
	      render: _react2.default.PropTypes.func
	    })),
	    // Calls a function after user selection.
	    onSelection: _react2.default.PropTypes.func,
	    onFocus: _react2.default.PropTypes.func,
	    onBlur: _react2.default.PropTypes.func
	  },
	
	  getDefaultProps: function getDefaultProps() {
	    return {
	      disabled: false,
	      options: [],
	      onSelection: _lodash2.default.noop,
	      onFocus: _lodash2.default.noop,
	      onBlur: _lodash2.default.noop,
	      value: null
	    };
	  },
	  getInitialState: function getInitialState() {
	    return {
	      selectedIndex: -1,
	      selectedOption: null,
	      focused: false
	    };
	  },
	  componentWillMount: function componentWillMount() {
	    this.setSelectedOptionBasedOnValue(this.props);
	  },
	  componentDidMount: function componentDidMount() {
	    if (this.state.selectedOption) {
	      var options = this.picklist.querySelectorAll('.picklist-option');
	      var option = this.picklist.querySelector('.picklist-option-selected');
	      var index = _lodash2.default.indexOf(options, option);
	
	      this.setScrollPositionToOption(index);
	      this.setNavigationPointer(index);
	    }
	  },
	  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
	    if (nextProps.value !== this.props.value) {
	      this.setSelectedOptionBasedOnValue(nextProps);
	    }
	  },
	  onClickOption: function onClickOption(selectedOption, event) {
	    var optionElements = this.picklist.querySelectorAll('.picklist-option');
	    var index = _lodash2.default.indexOf(optionElements, event.target);
	
	    event.stopPropagation();
	
	    this.picklist.focus();
	    this.setNavigationPointer(index);
	    this.setSelectedOption(selectedOption);
	  },
	  onKeyUpSelection: function onKeyUpSelection(event) {
	    var disabled = this.props.disabled;
	
	
	    if (disabled) {
	      return;
	    }
	
	    switch (event.keyCode) {
	      case _keycodes.UP:
	        this.move('up');
	        break;
	      case _keycodes.DOWN:
	        this.move('down');
	        break;
	      default:
	        break;
	    }
	  },
	  onKeyUpBlur: function onKeyUpBlur(event) {
	    if (event.keyCode === _keycodes.ESCAPE) {
	      this.picklist.blur();
	    }
	  },
	  onKeyUp: function onKeyUp(event) {
	    (0, _keycodes.isolateEventByKeys)(event, [_keycodes.UP, _keycodes.DOWN, _keycodes.ESCAPE]);
	
	    this.onKeyUpSelection(event);
	    this.onKeyUpBlur(event);
	  },
	  onKeyDown: function onKeyDown(event) {
	    (0, _keycodes.isolateEventByKeys)(event, [_keycodes.UP, _keycodes.DOWN, _keycodes.ESCAPE]);
	  },
	  onMouseDownOption: function onMouseDownOption(event) {
	    event.preventDefault();
	  },
	  onFocus: function onFocus() {
	    this.props.onFocus();
	    this.setState({ focused: true });
	  },
	  onBlur: function onBlur() {
	    this.props.onBlur();
	    this.setState({ focused: false });
	  },
	  setNavigationPointer: function setNavigationPointer(selectedIndex) {
	    this.setState({ selectedIndex: selectedIndex });
	  },
	  setSelectedOptionBasedOnValue: function setSelectedOptionBasedOnValue(props) {
	    var options = props.options;
	    var value = props.value;
	
	    var selectedOptionIndex = _lodash2.default.findIndex(options, { value: value });
	
	    this.setState({
	      selectedOption: props.options[selectedOptionIndex],
	      selectedIndex: selectedOptionIndex
	    });
	  },
	  setSelectedOption: function setSelectedOption(selectedOption) {
	    this.setState({ selectedOption: selectedOption });
	    this.props.onSelection(selectedOption);
	  },
	  setScrollPositionToOption: function setScrollPositionToOption(picklistOptionIndex) {
	    var picklist = this.picklist;
	    var picklistOptions = this.picklist.querySelectorAll('.picklist-option');
	    var picklistOption = picklistOptions[picklistOptionIndex];
	    var picklistTop = picklist.getBoundingClientRect().top - picklist.scrollTop;
	    var picklistCenter = picklist.clientHeight / 2;
	    var picklistOptionTop = picklistOption.getBoundingClientRect().top;
	
	    this.picklist.scrollTop = picklistOptionTop - picklistTop - picklistCenter;
	  },
	  blur: function blur() {
	    this.picklist.blur();
	  },
	  move: function move(upOrDown) {
	    var newIndex = void 0;
	    var newSelectedOption = void 0;
	
	    var _state = this.state;
	    var selectedOption = _state.selectedOption;
	    var selectedIndex = _state.selectedIndex;
	    var options = this.props.options;
	
	
	    var movingUp = upOrDown === 'up';
	
	    var indexOffset = movingUp ? -1 : 1;
	    var candidateOption = options[selectedIndex + indexOffset];
	    var unselectedStartPosition = movingUp ? 'last' : 'first';
	
	    if (selectedIndex !== -1 && _lodash2.default.isPlainObject(candidateOption)) {
	      newIndex = selectedIndex + indexOffset;
	      newSelectedOption = candidateOption;
	    } else if (selectedIndex === -1) {
	      newIndex = 0;
	      newSelectedOption = _lodash2.default[unselectedStartPosition](options);
	    } else {
	      newIndex = selectedIndex;
	      newSelectedOption = selectedOption;
	    }
	
	    this.setNavigationPointer(newIndex);
	    this.setSelectedOption(newSelectedOption);
	    this.setScrollPositionToOption(newIndex);
	  },
	  renderOption: function renderOption(option, index) {
	    var selectedOption = this.state.selectedOption;
	
	    var hasRenderFunction = _lodash2.default.isFunction(option.render);
	    var onClickOptionBound = this.onClickOption.bind(this, option);
	    var isSelected = _lodash2.default.isEqual(selectedOption, option);
	    var classes = (0, _classnames2.default)('picklist-option', {
	      'picklist-option-selected': isSelected
	    });
	
	    var attributes = {
	      className: classes,
	      onClick: onClickOptionBound,
	      onMouseDown: this.onMouseDownOption,
	      key: index,
	      role: 'option',
	      id: option.value + '-' + index,
	      'aria-selected': isSelected
	    };
	
	    var content = hasRenderFunction ? option.render(option) : _react2.default.createElement(
	      'span',
	      { className: 'picklist-title', key: index },
	      option.title
	    );
	
	    return _react2.default.createElement(
	      'div',
	      attributes,
	      content
	    );
	  },
	  render: function render() {
	    var _this = this;
	
	    var renderedOptions = [];
	    var _props = this.props;
	    var disabled = _props.disabled;
	    var options = _props.options;
	    var id = _props.id;
	    var _state2 = this.state;
	    var focused = _state2.focused;
	    var selectedOption = _state2.selectedOption;
	    var selectedIndex = _state2.selectedIndex;
	
	    var activeDescendant = selectedOption ? selectedOption.value + '-' + selectedIndex : '';
	    var attributes = {
	      id: id,
	      tabIndex: 0,
	      ref: function ref(_ref) {
	        return _this.picklist = _ref;
	      },
	      className: (0, _classnames2.default)('picklist', {
	        'picklist-disabled': disabled,
	        'picklist-focused': focused
	      }),
	      onKeyUp: this.onKeyUp,
	      role: 'listbox',
	      'aria-activedescendant': activeDescendant,
	      'aria-disabled': disabled
	    };
	
	    if (!disabled) {
	      _lodash2.default.merge(attributes, {
	        onKeyDown: this.onKeyDown,
	        onFocus: this.onFocus,
	        onBlur: this.onBlur
	      });
	    }
	
	    var header = function header(group) {
	      return _react2.default.createElement(
	        'div',
	        { className: 'picklist-group-header', key: group + '-separator' },
	        group
	      );
	    };
	
	    var separator = function separator(group) {
	      return _react2.default.createElement('div', { className: 'picklist-separator', key: group + '-header' });
	    };
	
	    _lodash2.default.forEach(options, function (option, index) {
	      var group = option.group;
	
	      var previousOption = options[index - 1];
	      var differentGroup = previousOption && previousOption.group !== group;
	
	      if (differentGroup) {
	        renderedOptions.push(separator(group));
	        renderedOptions.push(header(group));
	      } else if (index === 0 && group) {
	        renderedOptions.push(header(group));
	      }
	
	      renderedOptions.push(_this.renderOption(option, index));
	    });
	
	    return _react2.default.createElement(
	      'div',
	      attributes,
	      renderedOptions
	    );
	  }
	});
	
	exports.default = Picklist;

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _jquery = __webpack_require__(19);
	
	var _jquery2 = _interopRequireDefault(_jquery);
	
	__webpack_require__(23);
	
	var _purify = __webpack_require__(24);
	
	var _purify2 = _interopRequireDefault(_purify);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	/**
	 * ViewCard
	 * The ViewCard component renders a card used to present information about an asset (dataset, chart,
	 * map, Data Lens page, etc.). It is composed of four sections stacked vertically:
	 *   - The title bar, meant to contain a clickable link to the view, an icon representing the type
	 *     of the asset, and a padlock icon if the view is private.
	 *   - The metadata row, displaying the day at which the view was last updated and the number of
	 *     times it has been viewed.
	 *   - An image, typically a preview of the view.
	 *   - A description.
	 * The title and description are automatically ellipsified using dotdotdot. Buttons, spinners, or
	 * other elements may be rendered as an overlay centered over the main content by specifying them
	 * as children of the component.
	 */
	exports.default = _react2.default.createClass({
	  displayName: 'ViewCard',
	
	  propTypes: {
	
	    /**
	     * The children of a ViewCard are rendered as an overlay centered on top of the main content.
	     * This is typically used to render buttons in the context of an asset selector, but could also
	     * be used for a loading spinner. Render the component without children to avoid rendering the
	     * overlay.
	     */
	    children: _react.PropTypes.node,
	
	    /**
	     * The description prop renders a description in the lower area of the ViewCard. The description
	     * will automatically be ellipsified using dotdotdot if it is longer than 3 lines of text.  If
	     * this prop is omitted, the description area will render blank.
	     */
	    description: _react.PropTypes.string,
	
	    /**
	     * The icon prop specifies an icon that will be rendered in the upper-left corner of the
	     * element.  A large version of the icon will also be used as a fallback if the imageUrl prop
	     * is not specified.  For a list of icons, see
	     * http://socrata.github.io/styleguide/elements.html#icons.
	     */
	    icon: _react.PropTypes.string,
	
	    /**
	     * The imageUrl prop specifies the URL of an image that will be rendered in the center of the
	     * card using an <img> tag. The contents of the alt tag of the image will be the name prop. The
	     * image will take up the full width of the ViewCard and will be centered vertically inside the
	     * available area.
	     */
	    imageUrl: _react.PropTypes.string,
	
	    /**
	     * If the isPrivate prop is set to true, a yellow private icon will be rendered to the left of
	     * the ViewCard's title.
	     */
	    isPrivate: _react.PropTypes.bool,
	
	    /**
	     * The linkProps prop, if specified, should contain an object of attributes that will be merged
	     * into the anchor tag that surrounds both the header and the image.  A common use case is
	     * applying the target="_blank" attribute to open the link to the view in a new tab.
	     */
	    linkProps: _react.PropTypes.object,
	
	    /**
	     * The metadataLeft prop is a piece of text that will be rendered on the left side of the
	     * metadata row.
	     */
	    metadataLeft: _react.PropTypes.string,
	
	    /**
	     * The metadataRight prop is a piece of text that will be rendered on the right side of the
	     * metadata row.
	     */
	    metadataRight: _react.PropTypes.string,
	
	    /**
	     * The name prop contains the string that will be rendered at the top of the card. It is
	     * rendered as a header and links to the url prop. The header is ellipsified using
	     * dotdotdot if it exceeds two lines in length.
	     */
	    name: _react.PropTypes.string,
	
	    /**
	     * The onClick prop is a handler called when either the title or image are clicked. It is passed
	     * the raw pooled event instance from React.
	     */
	    onClick: _react.PropTypes.func,
	
	    /**
	     * The url prop contains a link to the view. It may be specified as either an absolute URL or a
	     * relative URL.
	     */
	    url: _react.PropTypes.string
	  },
	
	  componentDidMount: function componentDidMount() {
	    this.$name = (0, _jquery2.default)(this.name);
	    this.$description = (0, _jquery2.default)(this.description);
	    this.ellipsify();
	  },
	  componentWillUpdate: function componentWillUpdate(newProps) {
	    if (this.shouldEllipsify(this.props, newProps)) {
	      this.$name.trigger('destroy.dot');
	      this.$description.trigger('destroy.dot');
	    }
	  },
	  componentDidUpdate: function componentDidUpdate(oldProps) {
	    if (this.shouldEllipsify(oldProps, this.props)) {
	      this.ellipsify();
	    }
	  },
	  shouldEllipsify: function shouldEllipsify(oldProps, newProps) {
	    return oldProps.name !== newProps.name || oldProps.description !== newProps.description;
	  },
	  ellipsify: function ellipsify() {
	    this.$name.dotdotdot({ height: 50, watch: true });
	    this.$description.dotdotdot({ height: 75, watch: true });
	  },
	  renderOverlay: function renderOverlay() {
	    if (_react2.default.Children.count(this.props.children) > 0) {
	      return _react2.default.createElement(
	        'div',
	        { className: 'view-card-overlay' },
	        this.props.children
	      );
	    }
	  },
	  render: function render() {
	    var _this = this;
	
	    var _props = this.props;
	    var description = _props.description;
	    var icon = _props.icon;
	    var imageUrl = _props.imageUrl;
	    var isPrivate = _props.isPrivate;
	    var linkProps = _props.linkProps;
	    var metadataLeft = _props.metadataLeft;
	    var metadataRight = _props.metadataRight;
	    var name = _props.name;
	    var onClick = _props.onClick;
	    var url = _props.url;
	
	
	    var privateIcon = isPrivate ? _react2.default.createElement('span', { className: 'icon icon-private' }) : null;
	
	    var image = _lodash2.default.isString(imageUrl) && !_lodash2.default.isEmpty(imageUrl) ? _react2.default.createElement('img', { src: imageUrl, alt: name }) : _react2.default.createElement('span', { className: icon + ' x-large-icon' });
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'result-card media view-card' },
	      _react2.default.createElement(
	        'div',
	        { className: 'entry-header' },
	        _react2.default.createElement(
	          'div',
	          { className: 'entry-title' },
	          _react2.default.createElement(
	            'h3',
	            { className: 'entry-name' },
	            privateIcon,
	            _react2.default.createElement(
	              'a',
	              _extends({}, linkProps, { href: url, onClick: onClick, ref: function ref(el) {
	                  return _this.name = el;
	                } }),
	              name
	            )
	          )
	        ),
	        _react2.default.createElement(
	          'div',
	          { 'aria-hidden': true, className: 'entry-view-type' },
	          _react2.default.createElement('span', { className: icon })
	        )
	      ),
	      _react2.default.createElement(
	        'div',
	        { className: 'entry-meta' },
	        _react2.default.createElement(
	          'div',
	          { className: 'first' },
	          _react2.default.createElement(
	            'span',
	            { className: 'date' },
	            metadataLeft
	          )
	        ),
	        _react2.default.createElement(
	          'div',
	          { className: 'second' },
	          _react2.default.createElement(
	            'span',
	            { className: 'date' },
	            metadataRight
	          )
	        )
	      ),
	      _react2.default.createElement(
	        'div',
	        { className: 'entry-content' },
	        _react2.default.createElement(
	          'div',
	          { className: 'entry-main' },
	          _react2.default.createElement(
	            'a',
	            _extends({}, linkProps, { href: url, onClick: onClick }),
	            _react2.default.createElement(
	              'div',
	              { className: 'img-wrapper' },
	              image
	            )
	          ),
	          _react2.default.createElement(
	            'div',
	            { className: 'entry-description', ref: function ref(el) {
	                return _this.description = el;
	              } },
	            _react2.default.createElement('div', { dangerouslySetInnerHTML: { __html: (0, _purify2.default)(description) } })
	          )
	        )
	      ),
	      this.renderOverlay()
	    );
	  }
	});

/***/ },
/* 23 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_23__;

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = purify;
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _dompurify = __webpack_require__(25);
	
	var _dompurify2 = _interopRequireDefault(_dompurify);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function purify(source) {
	  if (!_lodash2.default.isString(source) || _lodash2.default.isEmpty(source)) {
	    return source;
	  }
	
	  var allowedTags = ['a', 'b', 'br', 'div', 'em', 'i', 'p', 'span', 'strong', 'sub', 'sup', 'u'];
	  var allowedAttr = ['href', 'target', 'rel'];
	
	  return _dompurify2.default.sanitize(source, {
	    ALLOWED_TAGS: allowedTags,
	    ALLOWED_ATTR: allowedAttr
	  });
	}

/***/ },
/* 25 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_25__;

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _ViewCard = __webpack_require__(22);
	
	var _ViewCard2 = _interopRequireDefault(_ViewCard);
	
	var _I18n = __webpack_require__(15);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var ExternalViewCard = function ExternalViewCard(props) {
	  var linkProps = _lodash2.default.defaults({}, props.linkProps, {
	    target: '_blank',
	    rel: 'nofollow external'
	  });
	
	  return _react2.default.createElement(
	    _ViewCard2.default,
	    _extends({
	      icon: 'icon-external-square',
	      metadataLeft: (0, _I18n.translate)('view_card.external_content')
	    }, props, {
	      linkProps: linkProps }),
	    props.children
	  );
	};
	
	ExternalViewCard.propTypes = _ViewCard2.default.propTypes;
	
	exports.default = ExternalViewCard;

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.FilterBar = undefined;
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _AddFilter = __webpack_require__(28);
	
	var _AddFilter2 = _interopRequireDefault(_AddFilter);
	
	var _FilterItem = __webpack_require__(32);
	
	var _FilterItem2 = _interopRequireDefault(_FilterItem);
	
	var _filters = __webpack_require__(47);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	/**
	 * FilterBar
	 * The FilterBar component renders a set of controls that are intended to allow users to apply
	 * customized sets of filters to datasets and visualizations.  Eventually, if the user accessing the
	 * component has an admin or publisher role, the FilterBar will expose additional functionality,
	 * allowing the user to create new filters and add restrictions on how they are used.
	 */
	var FilterBar = exports.FilterBar = _react2.default.createClass({
	  displayName: 'FilterBar',
	
	  propTypes: {
	
	    /**
	     * The columns prop is an array of column objects.  Each column object must contain:
	     *   - fieldName (string), the internal column name to query against.
	     *   - name (string), the human-readable name of the column.
	     *   - dataTypeName (string), the name of a data type.
	     * If the dataTypeName is "number", additional fields must be present:
	     *   - rangeMin (number), the minimum value present in the column.
	     *   - rangeMax (number), the maximum value present in the column.
	     * This list will be used to construct the list of filters available for use.  Eventually,
	     * publishers and administrators are able to add at most one filter for each column.
	     */
	    columns: _react.PropTypes.arrayOf(_react.PropTypes.object),
	
	    /**
	     * The filters prop is an array of filter objects that will be rendered.  Each filter object
	     * is structured as follows:
	     *   - parameters (object), an object identical in structure to the elements of the "filters"
	     *     array used in vifs.
	     *   - isLocked (boolean), whether or not users are restricted from changing the filter's value.
	     *   - isHidden (boolean), whether or not the filter is visible to non-roled users.
	     *   - isRequired (boolean), whether or not the filter is required to have a value set.
	     *   - allowMultiple (boolean), whether or not multiple values are able to be selected for the
	     *     filter.
	     * The set of rendered controls will always reflect the contents of this array.
	     */
	    filters: _react.PropTypes.arrayOf(_react.PropTypes.object),
	
	    /**
	     * The onUpdate prop is an optional function that will be called whenever the set of filters
	     * has changed.  This may happen when a filter is added, a filter is removed, or the parameters
	     * of a filter have changed.  The function is passed the new set of filters.  The consumer of
	     * this component is expected to respond to the event by applying its own desired processing
	     * (if any), and rerendering this component with the new updated "filters" prop.
	     */
	    onUpdate: _react.PropTypes.func,
	
	    /**
	     * The fetchSuggestions prop is an optional function that is expected to return an array of
	     * suggestions for a search term.  The function is passed the column to be searched on, which
	     * is identical to one of the column objects in the "columns" prop, and a string representing
	     * the current user input.  The function should return an array of suggestions as strings or
	     * a Promise that resolves to such a value.
	     */
	    fetchSuggestions: _react.PropTypes.func
	  },
	
	  getDefaultProps: function getDefaultProps() {
	    return {
	      onUpdate: _lodash2.default.noop,
	      fetchSuggestions: _lodash2.default.constant(Promise.resolve([])),
	      filters: []
	    };
	  },
	  onFilterAdd: function onFilterAdd(filter) {
	    var _props = this.props;
	    var filters = _props.filters;
	    var onUpdate = _props.onUpdate;
	
	
	    filters.unshift(filter);
	
	    onUpdate(filters);
	  },
	  onFilterRemove: function onFilterRemove(index) {
	    var _props2 = this.props;
	    var filters = _props2.filters;
	    var onUpdate = _props2.onUpdate;
	
	
	    filters.splice(index, 1);
	
	    onUpdate(filters);
	  },
	  onFilterUpdate: function onFilterUpdate(filter, index) {
	    var _props3 = this.props;
	    var filters = _props3.filters;
	    var onUpdate = _props3.onUpdate;
	
	
	    filters.splice(index, 1, filter);
	
	    onUpdate(filters);
	  },
	  renderAddFilter: function renderAddFilter() {
	    var _this = this;
	
	    var _props4 = this.props;
	    var columns = _props4.columns;
	    var filters = _props4.filters;
	
	
	    var availableColumns = _lodash2.default.reject(columns, function (column) {
	      return _lodash2.default.find(filters, ['parameters.columnName', column.fieldName]);
	    });
	
	    var props = {
	      columns: availableColumns,
	      onClickColumn: function onClickColumn(column) {
	        var filter = (0, _filters.getDefaultFilterForColumn)(column);
	        _this.onFilterAdd(filter);
	      }
	    };
	
	    return _react2.default.createElement(_AddFilter2.default, props);
	  },
	  renderFilters: function renderFilters() {
	    var _this2 = this;
	
	    var _props5 = this.props;
	    var filters = _props5.filters;
	    var columns = _props5.columns;
	    var fetchSuggestions = _props5.fetchSuggestions;
	
	
	    return _lodash2.default.map(filters, function (filter, i) {
	      var column = _lodash2.default.find(columns, { fieldName: filter.parameters.columnName });
	      var props = {
	        column: column,
	        filter: filter,
	        fetchSuggestions: fetchSuggestions,
	        onUpdate: _lodash2.default.partialRight(_this2.onFilterUpdate, i),
	        onRemove: _lodash2.default.partial(_this2.onFilterRemove, i)
	      };
	
	      return _react2.default.createElement(_FilterItem2.default, _extends({ key: i }, props));
	    });
	  },
	  render: function render() {
	    return _react2.default.createElement(
	      'div',
	      { className: 'filter-bar-container' },
	      this.renderAddFilter(),
	      this.renderFilters()
	    );
	  }
	});
	
	exports.default = FilterBar;

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.AddFilter = undefined;
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _reactDom = __webpack_require__(29);
	
	var _reactDom2 = _interopRequireDefault(_reactDom);
	
	var _SearchablePicklist = __webpack_require__(30);
	
	var _SearchablePicklist2 = _interopRequireDefault(_SearchablePicklist);
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _icons = __webpack_require__(31);
	
	var _I18n = __webpack_require__(15);
	
	var _keycodes = __webpack_require__(17);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var AddFilter = exports.AddFilter = _react2.default.createClass({
	  displayName: 'AddFilter',
	
	  propTypes: {
	    columns: _react.PropTypes.arrayOf(_react.PropTypes.object),
	    onClickColumn: _react.PropTypes.func.isRequired
	  },
	
	  getInitialState: function getInitialState() {
	    return {
	      isChoosingColumn: false,
	      searchTerm: ''
	    };
	  },
	  componentDidMount: function componentDidMount() {
	    var _this = this;
	
	    this.bodyClickHandler = document.body.addEventListener('click', function (event) {
	      var el = _reactDom2.default.findDOMNode(_this);
	      if (_this.state.isChoosingColumn && !el.contains(event.target)) {
	        _this.toggleColumnPicklist(event);
	      }
	    });
	
	    this.bodyEscapeHandler = document.body.addEventListener('keyup', function (event) {
	      if (_this.state.isChoosingColumn && event.keyCode === _keycodes.ESCAPE) {
	        _this.toggleColumnPicklist();
	        _this.addFilterButton.focus();
	      }
	    });
	  },
	  componentWillUnmount: function componentWillUnmount() {
	    document.body.removeEventListener('click', this.bodyClickHandler);
	    document.body.removeEventListener('keyup', this.bodyEscapeHandler);
	  },
	  onChangeSearchTerm: function onChangeSearchTerm(searchTerm) {
	    this.setState({ searchTerm: searchTerm });
	  },
	  onClickColumn: function onClickColumn(column) {
	    this.props.onClickColumn(column);
	    this.toggleColumnPicklist();
	  },
	  toggleColumnPicklist: function toggleColumnPicklist(event) {
	    if (event) {
	      event.preventDefault();
	    }
	
	    this.setState({ isChoosingColumn: !this.state.isChoosingColumn });
	  },
	  renderColumnContainer: function renderColumnContainer() {
	    var _this2 = this;
	
	    var columns = this.props.columns;
	    var _state = this.state;
	    var isChoosingColumn = _state.isChoosingColumn;
	    var searchTerm = _state.searchTerm;
	
	
	    if (!isChoosingColumn) {
	      return;
	    }
	
	    var picklistOptions = _lodash2.default.chain(columns).filter(function (column) {
	      return _lodash2.default.toLower(column.name).match(_lodash2.default.toLower(searchTerm));
	    }).map(function (column) {
	      return {
	        value: column.fieldName,
	        title: column.name,
	        render: function render(option) {
	          return _react2.default.createElement(
	            'div',
	            { className: 'filter-bar-column-option' },
	            _react2.default.createElement('span', { className: (0, _icons.getIconForDataType)(column.dataTypeName), role: 'presentation' }),
	            option.title
	          );
	        }
	      };
	    }).value();
	
	    var picklistProps = {
	      options: picklistOptions,
	      onChangeSearchTerm: this.onChangeSearchTerm,
	      onSelection: function onSelection(option) {
	        var column = _lodash2.default.find(columns, ['fieldName', option.value]);
	        _this2.onClickColumn(column);
	      },
	      value: searchTerm
	    };
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'column-container' },
	      _react2.default.createElement(_SearchablePicklist2.default, picklistProps)
	    );
	  },
	  render: function render() {
	    var _this3 = this;
	
	    var button = _react2.default.createElement(
	      'div',
	      {
	        className: 'add-filter-button',
	        ref: function ref(el) {
	          return _this3.addFilterButton = el;
	        },
	        onClick: this.toggleColumnPicklist,
	        onKeyPress: this.toggleColumnPicklist,
	        role: 'button',
	        tabIndex: '0' },
	      (0, _I18n.translate)('filter_bar.add_filter'),
	      _react2.default.createElement('span', { className: 'icon-add', role: 'presentation' })
	    );
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'add-filter' },
	      button,
	      this.renderColumnContainer()
	    );
	  }
	});
	
	exports.default = AddFilter;

/***/ },
/* 29 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_29__;

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.SearchablePicklist = undefined;
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _I18n = __webpack_require__(15);
	
	var _Picklist = __webpack_require__(21);
	
	var _Picklist2 = _interopRequireDefault(_Picklist);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var SearchablePicklist = exports.SearchablePicklist = _react2.default.createClass({
	  displayName: 'SearchablePicklist',
	
	  propTypes: {
	    isLoading: _react.PropTypes.bool,
	    options: _react.PropTypes.arrayOf(_react.PropTypes.object),
	    value: _react.PropTypes.string,
	    onChangeSearchTerm: _react.PropTypes.func.isRequired,
	    onSelection: _react.PropTypes.func.isRequired
	  },
	
	  componentDidMount: function componentDidMount() {
	    if (this.search) {
	      this.search.focus();
	    }
	  },
	  onChangeSearchTerm: function onChangeSearchTerm(event) {
	    this.props.onChangeSearchTerm(event.target.value);
	  },
	  renderPicklist: function renderPicklist() {
	    var _props = this.props;
	    var isLoading = _props.isLoading;
	    var options = _props.options;
	    var value = _props.value;
	    var onSelection = _props.onSelection;
	
	    var hasNoOptions = _lodash2.default.isEmpty(options);
	    var visibleOptions = options;
	
	    if (isLoading) {
	      return _react2.default.createElement('div', { className: 'spinner spinner-default' });
	    }
	
	    if (hasNoOptions) {
	      visibleOptions = [{ title: (0, _I18n.translate)('filter_bar.no_options_found') }];
	    }
	
	    var picklistProps = {
	      options: visibleOptions,
	      value: value,
	      disabled: hasNoOptions,
	      onSelection: onSelection
	    };
	
	    return _react2.default.createElement(_Picklist2.default, picklistProps);
	  },
	  renderSearch: function renderSearch() {
	    var _this = this;
	
	    var value = this.props.value;
	
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'searchable-picklist-input-container' },
	      _react2.default.createElement('span', { className: 'icon-search', role: 'presentation' }),
	      _react2.default.createElement('input', {
	        className: 'searchable-picklist-input',
	        type: 'text',
	        'aria-label': (0, _I18n.translate)('filter_bar.search'),
	        value: value || '',
	        ref: function ref(el) {
	          return _this.search = el;
	        },
	        onChange: this.onChangeSearchTerm })
	    );
	  },
	  render: function render() {
	    return _react2.default.createElement(
	      'div',
	      { className: 'searchable-picklist' },
	      this.renderSearch(),
	      this.renderPicklist()
	    );
	  }
	});
	
	exports.default = SearchablePicklist;

/***/ },
/* 31 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.getIconForDataType = getIconForDataType;
	var dataTypes = {
	  blob: 'icon-data',
	  calendar_date: 'icon-date',
	  checkbox: 'icon-check',
	  dataset_link: 'icon-link',
	  date: 'icon-date',
	  document: 'icon-copy-document',
	  drop_down_list: 'icon-list-2',
	  email: 'icon-email',
	  flag: 'icon-region',
	  geospatial: 'icon-geo',
	  html: 'icon-clear-formatting',
	  line: 'icon-geo',
	  link: 'icon-link',
	  list: 'icon-list-numbered',
	  location: 'icon-map',
	  money: 'icon-number',
	  multiline: 'icon-geo',
	  multipoint: 'icon-geo',
	  multipolygon: 'icon-geo',
	  nested_table: 'icon-table',
	  number: 'icon-number',
	  object: 'icon-data',
	  percent: 'icon-number',
	  photo: 'icon-chart',
	  point: 'icon-map',
	  polygon: 'icon-geo',
	  stars: null,
	  text: 'icon-text',
	  url: 'icon-link'
	};
	
	function getIconForDataType(dataType) {
	  if (dataTypes[dataType]) {
	    return dataTypes[dataType];
	  }
	
	  console.warn('Unknown icon for data type "' + dataType + '"');
	}

/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.FilterItem = undefined;
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _reactDom = __webpack_require__(29);
	
	var _reactDom2 = _interopRequireDefault(_reactDom);
	
	var _NumberFilter = __webpack_require__(33);
	
	var _NumberFilter2 = _interopRequireDefault(_NumberFilter);
	
	var _TextFilter = __webpack_require__(45);
	
	var _TextFilter2 = _interopRequireDefault(_TextFilter);
	
	var _FilterConfig = __webpack_require__(46);
	
	var _FilterConfig2 = _interopRequireDefault(_FilterConfig);
	
	var _I18n = __webpack_require__(15);
	
	var _filters = __webpack_require__(47);
	
	var _keycodes = __webpack_require__(17);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var FilterItem = exports.FilterItem = _react2.default.createClass({
	  displayName: 'FilterItem',
	
	  propTypes: {
	    filter: _react.PropTypes.shape({
	      parameters: _react.PropTypes.shape({
	        'function': _react.PropTypes.string.isRequired,
	        columnName: _react.PropTypes.string.isRequired,
	        arguments: _react.PropTypes.object.isRequired
	      }),
	      isLocked: _react.PropTypes.boolean,
	      isHidden: _react.PropTypes.boolean,
	      isRequired: _react.PropTypes.boolean,
	      allowMultiple: _react.PropTypes.boolean
	    }).isRequired,
	    column: _react.PropTypes.shape({
	      dataTypeName: _react.PropTypes.oneOf(['number', 'text']),
	      name: _react.PropTypes.string.isRequired
	    }).isRequired,
	    fetchSuggestions: _react.PropTypes.func,
	    onUpdate: _react.PropTypes.func.isRequired,
	    onRemove: _react.PropTypes.func.isRequired
	  },
	
	  getInitialState: function getInitialState() {
	    return {
	      isControlOpen: false,
	      isConfigOpen: false
	    };
	  },
	  componentDidMount: function componentDidMount() {
	    var _this = this;
	
	    this.bodyClickHandler = function (event) {
	      // Avoid closing flannels if the click is inside any of these refs.
	      var flannelElements = [_this.filterControl, _this.filterConfig, _this.filterControlToggle, _this.filterConfigToggle];
	
	      // Are there any flannelElements that contain event.target?
	      var isInsideFlannels = _lodash2.default.chain(flannelElements).compact().map(_reactDom2.default.findDOMNode).invokeMap('contains', event.target).some().value();
	
	      // If none of the flannelElements contain event.target, close all the flannels.
	      if (!isInsideFlannels) {
	        _this.closeAll();
	      }
	    };
	
	    this.bodyEscapeHandler = function (event) {
	      if (event.keyCode === _keycodes.ESCAPE) {
	        _this.closeAll();
	        _this.toggleText.focus();
	      }
	    };
	
	    document.body.addEventListener('click', this.bodyClickHandler);
	    document.body.addEventListener('keyup', this.bodyEscapeHandler);
	  },
	  componentWillUnmount: function componentWillUnmount() {
	    document.body.removeEventListener('click', this.bodyClickHandler);
	    document.body.removeEventListener('keyup', this.bodyEscapeHandler);
	  },
	  onCancel: function onCancel() {
	    this.toggleControl();
	  },
	  onUpdate: function onUpdate(newFilter) {
	    this.props.onUpdate(newFilter);
	    this.closeAll();
	  },
	  onRemove: function onRemove(filter) {
	    this.props.onRemove(filter);
	    this.closeAll();
	  },
	  toggleControl: function toggleControl() {
	    this.setState({
	      isControlOpen: !this.state.isControlOpen,
	      isConfigOpen: false
	    });
	  },
	  toggleConfig: function toggleConfig() {
	    this.setState({
	      isControlOpen: false,
	      isConfigOpen: !this.state.isConfigOpen
	    });
	  },
	  closeAll: function closeAll() {
	    this.setState({
	      isControlOpen: false,
	      isConfigOpen: false
	    });
	  },
	  renderFilterControl: function renderFilterControl() {
	    var _props = this.props;
	    var filter = _props.filter;
	    var column = _props.column;
	    var fetchSuggestions = _props.fetchSuggestions;
	    var isControlOpen = this.state.isControlOpen;
	
	
	    if (!isControlOpen) {
	      return null;
	    }
	
	    var filterProps = {
	      filter: filter,
	      column: column,
	      fetchSuggestions: fetchSuggestions,
	      onCancel: this.onCancel,
	      onUpdate: this.onUpdate,
	      ref: _lodash2.default.partial(_lodash2.default.set, this, 'filterControl')
	    };
	
	    switch (column.dataTypeName) {
	      case 'number':
	        return _react2.default.createElement(_NumberFilter2.default, filterProps);
	      case 'text':
	        return _react2.default.createElement(_TextFilter2.default, filterProps);
	      default:
	        return null;
	    }
	  },
	  renderFilterConfig: function renderFilterConfig() {
	    var filter = this.props.filter;
	    var isConfigOpen = this.state.isConfigOpen;
	
	
	    if (!isConfigOpen) {
	      return null;
	    }
	
	    var configProps = {
	      filter: filter,
	      onRemove: this.onRemove,
	      ref: _lodash2.default.partial(_lodash2.default.set, this, 'filterConfig')
	    };
	
	    return _react2.default.createElement(_FilterConfig2.default, configProps);
	  },
	  render: function render() {
	    var _this2 = this;
	
	    var _props2 = this.props;
	    var filter = _props2.filter;
	    var column = _props2.column;
	
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'filter-bar-filter' },
	      _react2.default.createElement(
	        'div',
	        { className: 'filter-title' },
	        column.name
	      ),
	      _react2.default.createElement(
	        'div',
	        { className: 'filter-control-container' },
	        _react2.default.createElement(
	          'div',
	          {
	            className: 'filter-control-toggle',
	            'aria-label': (0, _I18n.translate)('filter_bar.filter') + ' ' + column.name,
	            tabIndex: '0',
	            onClick: this.toggleControl,
	            onKeyPress: this.toggleControl,
	            ref: function ref(el) {
	              return _this2.filterControlToggle = el;
	            } },
	          (0, _filters.getToggleTextForFilter)(filter, column),
	          _react2.default.createElement('span', { className: 'icon-chevron-down', role: 'presentation' })
	        ),
	        this.renderFilterControl()
	      ),
	      _react2.default.createElement(
	        'div',
	        { className: 'filter-config-container' },
	        _react2.default.createElement(
	          'div',
	          {
	            className: 'filter-config-toggle',
	            'aria-label': (0, _I18n.translate)('filter_bar.configure_filter'),
	            tabIndex: '0',
	            onClick: this.toggleConfig,
	            onKeyPress: this.toggleConfig,
	            ref: function ref(el) {
	              return _this2.filterConfigToggle = el;
	            } },
	          _react2.default.createElement('span', { className: 'icon-kebab', role: 'presentation' })
	        ),
	        this.renderFilterConfig()
	      )
	    );
	  }
	});
	
	exports.default = FilterItem;

/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.NumberFilter = undefined;
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _Slider = __webpack_require__(34);
	
	var _Slider2 = _interopRequireDefault(_Slider);
	
	var _FilterFooter = __webpack_require__(44);
	
	var _FilterFooter2 = _interopRequireDefault(_FilterFooter);
	
	var _I18n = __webpack_require__(15);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
	
	var NumberFilter = exports.NumberFilter = _react2.default.createClass({
	  displayName: 'NumberFilter',
	
	  propTypes: {
	    filter: _react.PropTypes.object.isRequired,
	    column: _react.PropTypes.object.isRequired,
	    onCancel: _react.PropTypes.func.isRequired,
	    onUpdate: _react.PropTypes.func.isRequired
	  },
	
	  getInitialState: function getInitialState() {
	    var filter = this.props.filter;
	
	
	    return {
	      value: _lodash2.default.get(filter, 'parameters.arguments', {})
	    };
	  },
	  componentDidMount: function componentDidMount() {
	    if (this.firstInput) {
	      this.firstInput.focus();
	    }
	  },
	  onInputChange: function onInputChange(_ref) {
	    var target = _ref.target;
	    var value = this.state.value;
	
	
	    var newValue = _lodash2.default.merge({}, value, _defineProperty({}, target.id, _lodash2.default.toNumber(target.value)));
	
	    this.updateValueState(newValue);
	  },
	  onSliderChange: function onSliderChange(newValue) {
	    this.updateValueState(newValue);
	  },
	  getStepInterval: function getStepInterval() {
	    var _props$column = this.props.column;
	    var rangeMin = _props$column.rangeMin;
	    var rangeMax = _props$column.rangeMax;
	
	
	    return (rangeMax - rangeMin) / 20;
	  },
	  isValidValue: function isValidValue(value) {
	    var _props$column2 = this.props.column;
	    var rangeMin = _props$column2.rangeMin;
	    var rangeMax = _props$column2.rangeMax;
	
	
	    return _lodash2.default.isFinite(value) && value >= rangeMin && value <= rangeMax;
	  },
	  isValidRange: function isValidRange(value) {
	    var isValidRange = value.start <= value.end;
	    var isStartValid = this.isValidValue(value.start);
	    var isEndValid = this.isValidValue(value.end);
	
	    return isValidRange && isStartValid && isEndValid;
	  },
	  updateValueState: function updateValueState(newValue) {
	    if (this.isValidRange(newValue)) {
	      this.setState({
	        value: newValue
	      });
	    }
	  },
	  shouldDisableApply: function shouldDisableApply() {
	    var filter = this.props.filter;
	    var value = this.state.value;
	
	
	    var initialValue = filter.parameters.arguments;
	
	    return _lodash2.default.isEqual(initialValue, value);
	  },
	  clearFilter: function clearFilter() {
	    var column = this.props.column;
	    var rangeMin = column.rangeMin;
	    var rangeMax = column.rangeMax;
	
	
	    this.updateValueState({
	      start: rangeMin,
	      end: rangeMax
	    });
	  },
	  updateFilter: function updateFilter() {
	    var _props = this.props;
	    var filter = _props.filter;
	    var onUpdate = _props.onUpdate;
	    var value = this.state.value;
	
	
	    var newFilter = _lodash2.default.merge({}, filter, {
	      parameters: {
	        arguments: value
	      }
	    });
	
	    onUpdate(newFilter);
	  },
	  renderInputFields: function renderInputFields() {
	    var _this = this;
	
	    var value = this.state.value;
	
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'range-text-inputs-container input-group' },
	      _react2.default.createElement('input', {
	        id: 'start',
	        className: 'range-input text-input',
	        type: 'number',
	        value: value.start,
	        onChange: this.onInputChange,
	        'aria-label': (0, _I18n.translate)('filter_bar.from'),
	        placeholder: (0, _I18n.translate)('filter_bar.from'),
	        ref: function ref(el) {
	          return _this.firstInput = el;
	        } }),
	      _react2.default.createElement(
	        'span',
	        { className: 'range-separator' },
	        '-'
	      ),
	      _react2.default.createElement('input', {
	        id: 'end',
	        className: 'range-input text-input',
	        type: 'number',
	        value: value.end,
	        onChange: this.onInputChange,
	        'aria-label': (0, _I18n.translate)('filter_bar.to'),
	        placeholder: (0, _I18n.translate)('filter_bar.to') })
	    );
	  },
	  renderSlider: function renderSlider() {
	    var column = this.props.column;
	    var rangeMin = column.rangeMin;
	    var rangeMax = column.rangeMax;
	    var value = this.state.value;
	
	
	    var sliderProps = {
	      rangeMin: rangeMin,
	      rangeMax: rangeMax,
	      value: value,
	      step: this.getStepInterval(),
	      onChange: this.onSliderChange
	    };
	
	    return _react2.default.createElement(_Slider2.default, sliderProps);
	  },
	  render: function render() {
	    var onCancel = this.props.onCancel;
	
	
	    var filterFooterProps = {
	      disableApplyFilter: this.shouldDisableApply(),
	      onClickApply: this.updateFilter,
	      onClickCancel: onCancel,
	      onClickClear: this.clearFilter
	    };
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'filter-controls number-filter' },
	      _react2.default.createElement(
	        'div',
	        { className: 'range-filter-container' },
	        _react2.default.createElement(
	          'div',
	          { className: 'filter-control-title' },
	          (0, _I18n.translate)('filter_bar.range')
	        ),
	        this.renderSlider(),
	        this.renderInputFields()
	      ),
	      _react2.default.createElement(_FilterFooter2.default, filterFooterProps)
	    );
	  }
	});
	
	exports.default = NumberFilter;

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.Slider = undefined;
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _reactInputRange = __webpack_require__(35);
	
	var _reactInputRange2 = _interopRequireDefault(_reactInputRange);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var Slider = exports.Slider = _react2.default.createClass({
	  displayName: 'Slider',
	
	  propTypes: {
	
	    /**
	     * The minimum value selectable.
	     */
	    rangeMin: _react.PropTypes.number.isRequired,
	
	    /**
	     * The maximum value selectable.
	     */
	    rangeMax: _react.PropTypes.number.isRequired,
	
	    /**
	     * The increment that the user can move the handle(s).
	     */
	    step: _react.PropTypes.number,
	
	    /**
	     * The value the slider should show. It comes in two flavors:
	     * - The object flavor lets you select two values with the
	     *   same slider. Renders two handles. (See the shape.)
	     * - The number flavor is a single selection and only renders
	     *   one handle.
	     */
	    value: _react.PropTypes.oneOfType([_react.PropTypes.number, _react.PropTypes.shape({
	      start: _react.PropTypes.number,
	      end: _react.PropTypes.number
	    })]),
	
	    /**
	     * The change event is fired when the slider is dragged
	     * or keyboard-navigated. The callback's value depends
	     * on how props.value was set. If it was an object, you'll
	     * get an object. If it was a number, you'll get a number.
	     */
	    onChange: _react.PropTypes.func.isRequired
	  },
	
	  getDefaultProps: function getDefaultProps() {
	    return {
	      step: 5
	    };
	  },
	  onChange: function onChange(inputRangeComponent, value) {
	    var newValue = _lodash2.default.isPlainObject(value) ? { start: value.min, end: value.max } : value;
	
	    this.props.onChange(newValue);
	  },
	  formatAccessibleLabel: function formatAccessibleLabel(label) {
	    return _react2.default.createElement(
	      'span',
	      { className: 'hidden' },
	      label
	    );
	  },
	  render: function render() {
	    var displayableValue = void 0;
	    var _props = this.props;
	    var rangeMin = _props.rangeMin;
	    var rangeMax = _props.rangeMax;
	    var step = _props.step;
	    var value = _props.value;
	
	
	    if (_lodash2.default.isPlainObject(value)) {
	      displayableValue = {
	        min: _lodash2.default.get(value, 'start', rangeMin),
	        max: _lodash2.default.get(value, 'end', rangeMax)
	      };
	    } else if (_lodash2.default.isNumber(value)) {
	      displayableValue = _lodash2.default.clamp(value, rangeMin, rangeMax);
	    } else {
	      displayableValue = rangeMax;
	    }
	
	    var inputRangeProps = {
	      minValue: rangeMin,
	      maxValue: rangeMax,
	      step: step,
	      value: displayableValue,
	      onChange: this.onChange,
	      formatLabel: this.formatAccessibleLabel
	    };
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'input-range-slider' },
	      _react2.default.createElement(_reactInputRange2.default, inputRangeProps)
	    );
	  }
	});
	
	exports.default = Slider;

/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module InputRange
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	var _InputRange = __webpack_require__(36);
	
	var _InputRange2 = _interopRequireDefault(_InputRange);
	
	/**
	 * An object describing the position of a point
	 * @typedef {Object} Point
	 * @property {number} x - x value
	 * @property {number} y - y value
	 */
	
	/**
	 * An object describing a range of values
	 * @typedef {Object} Range
	 * @property {number} min - Min value
	 * @property {number} max - Max value
	 */
	
	exports['default'] = _InputRange2['default'];
	module.exports = exports['default'];

/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module InputRange
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _Slider = __webpack_require__(37);
	
	var _Slider2 = _interopRequireDefault(_Slider);
	
	var _Track = __webpack_require__(40);
	
	var _Track2 = _interopRequireDefault(_Track);
	
	var _Label = __webpack_require__(38);
	
	var _Label2 = _interopRequireDefault(_Label);
	
	var _defaultClassNames = __webpack_require__(41);
	
	var _defaultClassNames2 = _interopRequireDefault(_defaultClassNames);
	
	var _valueTransformer = __webpack_require__(42);
	
	var _valueTransformer2 = _interopRequireDefault(_valueTransformer);
	
	var _util = __webpack_require__(39);
	
	var _propTypes = __webpack_require__(43);
	
	/**
	 * A map for storing internal members
	 * @const {WeakMap}
	 */
	var internals = new WeakMap();
	
	/**
	 * An object storing keyboard key codes
	 * @const {Object.<string, number>}
	 */
	var KeyCode = {
	  DOWN_ARROW: 40,
	  LEFT_ARROW: 37,
	  RIGHT_ARROW: 39,
	  UP_ARROW: 38
	};
	
	/**
	 * Check if values are within the max and min range of inputRange
	 * @private
	 * @param {InputRange} inputRange - React component
	 * @param {Range} values - Min/max value of sliders
	 * @return {boolean} True if within range
	 */
	function isWithinRange(inputRange, values) {
	  var props = inputRange.props;
	
	  if (inputRange.isMultiValue) {
	    return values.min >= props.minValue && values.max <= props.maxValue && values.min < values.max;
	  }
	
	  return values.max >= props.minValue && values.max <= props.maxValue;
	}
	
	/**
	 * Check if the difference between values and the current values of inputRange
	 * is greater or equal to its step amount
	 * @private
	 * @param {InputRange} inputRange - React component
	 * @param {Range} values - Min/max value of sliders
	 * @return {boolean} True if difference is greater or equal to step amount
	 */
	function hasStepDifference(inputRange, values) {
	  var props = inputRange.props;
	
	  var currentValues = _valueTransformer2['default'].valuesFromProps(inputRange);
	
	  return (0, _util.length)(values.min, currentValues.min) >= props.step || (0, _util.length)(values.max, currentValues.max) >= props.step;
	}
	
	/**
	 * Check if inputRange should update with new values
	 * @private
	 * @param {InputRange} inputRange - React component
	 * @param {Range} values - Min/max value of sliders
	 * @return {boolean} True if inputRange should update
	 */
	function shouldUpdate(inputRange, values) {
	  return isWithinRange(inputRange, values) && hasStepDifference(inputRange, values);
	}
	
	/**
	 * Get the owner document of inputRange
	 * @private
	 * @param {InputRange} inputRange - React component
	 * @return {Document} Document
	 */
	function getDocument(inputRange) {
	  var ownerDocument = inputRange.refs.inputRange.ownerDocument;
	
	  return ownerDocument;
	}
	
	/**
	 * Get the class name(s) of inputRange based on its props
	 * @private
	 * @param {InputRange} inputRange - React component
	 * @return {string} A list of class names delimited with spaces
	 */
	function getComponentClassName(inputRange) {
	  var props = inputRange.props;
	
	  if (!props.disabled) {
	    return props.classNames.component;
	  }
	
	  return props.classNames.component + ' is-disabled';
	}
	
	/**
	 * Get the key name of a slider
	 * @private
	 * @param {InputRange} inputRange - React component
	 * @param {Slider} slider - React component
	 * @return {string} Key name
	 */
	function getKeyFromSlider(inputRange, slider) {
	  if (slider === inputRange.refs.sliderMin) {
	    return 'min';
	  }
	
	  return 'max';
	}
	
	/**
	 * Get all slider keys of inputRange
	 * @private
	 * @param {InputRange} inputRange - React component
	 * @return {Array.<string>} Key names
	 */
	function getKeys(inputRange) {
	  if (inputRange.isMultiValue) {
	    return ['min', 'max'];
	  }
	
	  return ['max'];
	}
	
	/**
	 * Get the key name of a slider that's the closest to a point
	 * @private
	 * @param {InputRange} inputRange - React component
	 * @param {Point} position - x/y
	 * @return {string} Key name
	 */
	function getKeyByPosition(inputRange, position) {
	  var values = _valueTransformer2['default'].valuesFromProps(inputRange);
	  var positions = _valueTransformer2['default'].positionsFromValues(inputRange, values);
	
	  if (inputRange.isMultiValue) {
	    var distanceToMin = (0, _util.distanceTo)(position, positions.min);
	    var distanceToMax = (0, _util.distanceTo)(position, positions.max);
	
	    if (distanceToMin < distanceToMax) {
	      return 'min';
	    }
	  }
	
	  return 'max';
	}
	
	/**
	 * Get an array of slider HTML for rendering
	 * @private
	 * @param {InputRange} inputRange - React component
	 * @return {Array.<string>} Array of HTML
	 */
	function renderSliders(inputRange) {
	  var classNames = inputRange.props.classNames;
	
	  var sliders = [];
	  var keys = getKeys(inputRange);
	  var values = _valueTransformer2['default'].valuesFromProps(inputRange);
	  var percentages = _valueTransformer2['default'].percentagesFromValues(inputRange, values);
	
	  var _iteratorNormalCompletion = true;
	  var _didIteratorError = false;
	  var _iteratorError = undefined;
	
	  try {
	    for (var _iterator = keys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	      var key = _step.value;
	
	      var value = values[key];
	      var percentage = percentages[key];
	      var ref = 'slider' + (0, _util.captialize)(key);
	
	      var _inputRange$props = inputRange.props;
	      var maxValue = _inputRange$props.maxValue;
	      var minValue = _inputRange$props.minValue;
	
	      if (key === 'min') {
	        maxValue = values.max;
	      } else {
	        minValue = values.min;
	      }
	
	      var slider = _react2['default'].createElement(_Slider2['default'], {
	        ariaLabelledby: inputRange.props.ariaLabelledby,
	        ariaControls: inputRange.props.ariaControls,
	        classNames: classNames,
	        formatLabel: inputRange.formatLabel,
	        key: key,
	        maxValue: maxValue,
	        minValue: minValue,
	        onSliderKeyDown: inputRange.handleSliderKeyDown,
	        onSliderMouseMove: inputRange.handleSliderMouseMove,
	        percentage: percentage,
	        ref: ref,
	        type: key,
	        value: value });
	
	      sliders.push(slider);
	    }
	  } catch (err) {
	    _didIteratorError = true;
	    _iteratorError = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion && _iterator['return']) {
	        _iterator['return']();
	      }
	    } finally {
	      if (_didIteratorError) {
	        throw _iteratorError;
	      }
	    }
	  }
	
	  return sliders;
	}
	
	/**
	 * Get an array of hidden input HTML for rendering
	 * @private
	 * @param {InputRange} inputRange - React component
	 * @return {Array.<string>} Array of HTML
	 */
	function renderHiddenInputs(inputRange) {
	  var inputs = [];
	  var keys = getKeys(inputRange);
	
	  var _iteratorNormalCompletion2 = true;
	  var _didIteratorError2 = false;
	  var _iteratorError2 = undefined;
	
	  try {
	    for (var _iterator2 = keys[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	      var key = _step2.value;
	
	      var _name = inputRange.isMultiValue ? '' + inputRange.props.name + (0, _util.captialize)(key) : inputRange.props.name;
	
	      var input = _react2['default'].createElement('input', { type: 'hidden', name: _name });
	    }
	  } catch (err) {
	    _didIteratorError2 = true;
	    _iteratorError2 = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion2 && _iterator2['return']) {
	        _iterator2['return']();
	      }
	    } finally {
	      if (_didIteratorError2) {
	        throw _iteratorError2;
	      }
	    }
	  }
	
	  return inputs;
	}
	
	/**
	 * InputRange React component
	 * @class
	 * @extends React.Component
	 * @param {Object} props - React component props
	 */
	
	var InputRange = (function (_React$Component) {
	  _inherits(InputRange, _React$Component);
	
	  function InputRange(props) {
	    _classCallCheck(this, InputRange);
	
	    _get(Object.getPrototypeOf(InputRange.prototype), 'constructor', this).call(this, props);
	
	    // Private
	    internals.set(this, {});
	
	    // Auto-bind
	    (0, _util.autobind)(['formatLabel', 'handleInteractionEnd', 'handleInteractionStart', 'handleKeyDown', 'handleKeyUp', 'handleMouseDown', 'handleMouseUp', 'handleSliderKeyDown', 'handleSliderMouseMove', 'handleTouchStart', 'handleTouchEnd', 'handleTrackMouseDown'], this);
	  }
	
	  /**
	   * Accepted propTypes of InputRange
	   * @static {Object}
	   * @property {Function} ariaLabelledby
	   * @property {Function} ariaControls
	   * @property {Function} classNames
	   * @property {Function} defaultValue
	   * @property {Function} disabled
	   * @property {Function} formatLabel
	   * @property {Function} labelPrefix
	   * @property {Function} labelSuffix
	   * @property {Function} maxValue
	   * @property {Function} minValue
	   * @property {Function} name
	   * @property {Function} onChange
	   * @property {Function} onChangeComplete
	   * @property {Function} step
	   * @property {Function} value
	   */
	
	  /**
	   * Return the clientRect of the component's track
	   * @member {ClientRect}
	   */
	
	  _createClass(InputRange, [{
	    key: 'updatePosition',
	
	    /**
	     * Update the position of a slider by key
	     * @param {string} key - min/max
	     * @param {Point} position x/y
	     */
	    value: function updatePosition(key, position) {
	      var values = _valueTransformer2['default'].valuesFromProps(this);
	      var positions = _valueTransformer2['default'].positionsFromValues(this, values);
	
	      positions[key] = position;
	
	      this.updatePositions(positions);
	    }
	
	    /**
	     * Update the position of sliders
	     * @param {Object} positions
	     * @param {Point} positions.min
	     * @param {Point} positions.max
	     */
	  }, {
	    key: 'updatePositions',
	    value: function updatePositions(positions) {
	      var values = {
	        min: _valueTransformer2['default'].valueFromPosition(this, positions.min),
	        max: _valueTransformer2['default'].valueFromPosition(this, positions.max)
	      };
	
	      var transformedValues = {
	        min: _valueTransformer2['default'].stepValueFromValue(this, values.min),
	        max: _valueTransformer2['default'].stepValueFromValue(this, values.max)
	      };
	
	      this.updateValues(transformedValues);
	    }
	
	    /**
	     * Update the value of a slider by key
	     * @param {string} key - max/min
	     * @param {number} value - New value
	     */
	  }, {
	    key: 'updateValue',
	    value: function updateValue(key, value) {
	      var values = _valueTransformer2['default'].valuesFromProps(this);
	
	      values[key] = value;
	
	      this.updateValues(values);
	    }
	
	    /**
	     * Update the values of all sliders
	     * @param {Object|number} values - Object if multi-value, number if single-value
	     */
	  }, {
	    key: 'updateValues',
	    value: function updateValues(values) {
	      if (!shouldUpdate(this, values)) {
	        return;
	      }
	
	      if (this.isMultiValue) {
	        this.props.onChange(this, values);
	      } else {
	        this.props.onChange(this, values.max);
	      }
	    }
	
	    /**
	     * Increment the value of a slider by key name
	     * @param {string} key - max/min
	     */
	  }, {
	    key: 'incrementValue',
	    value: function incrementValue(key) {
	      var values = _valueTransformer2['default'].valuesFromProps(this);
	      var value = values[key] + this.props.step;
	
	      this.updateValue(key, value);
	    }
	
	    /**
	     * Decrement the value of a slider by key name
	     * @param {string} key - max/min
	     */
	  }, {
	    key: 'decrementValue',
	    value: function decrementValue(key) {
	      var values = _valueTransformer2['default'].valuesFromProps(this);
	      var value = values[key] - this.props.step;
	
	      this.updateValue(key, value);
	    }
	
	    /**
	     * Format label
	     * @param {number} labelValue - Label value
	     * @return {string} Formatted label value
	     */
	  }, {
	    key: 'formatLabel',
	    value: function formatLabel(labelValue) {
	      var _props = this.props;
	      var formatLabel = _props.formatLabel;
	      var labelPrefix = _props.labelPrefix;
	      var labelSuffix = _props.labelSuffix;
	
	      if (formatLabel) {
	        return formatLabel(labelValue, { labelPrefix: labelPrefix, labelSuffix: labelSuffix });
	      }
	
	      return '' + labelPrefix + labelValue + labelSuffix;
	    }
	
	    /**
	     * Handle any mousemove event received by the slider
	     * @param {SyntheticEvent} event - User event
	     * @param {Slider} slider - React component
	     */
	  }, {
	    key: 'handleSliderMouseMove',
	    value: function handleSliderMouseMove(event, slider) {
	      if (this.props.disabled) {
	        return;
	      }
	
	      var key = getKeyFromSlider(this, slider);
	      var position = _valueTransformer2['default'].positionFromEvent(this, event);
	
	      this.updatePosition(key, position);
	    }
	
	    /**
	     * Handle any keydown event received by the slider
	     * @param {SyntheticEvent} event - User event
	     * @param {Slider} slider - React component
	     */
	  }, {
	    key: 'handleSliderKeyDown',
	    value: function handleSliderKeyDown(event, slider) {
	      if (this.props.disabled) {
	        return;
	      }
	
	      var key = getKeyFromSlider(this, slider);
	
	      switch (event.keyCode) {
	        case KeyCode.LEFT_ARROW:
	        case KeyCode.DOWN_ARROW:
	          event.preventDefault();
	          this.decrementValue(key);
	          break;
	
	        case KeyCode.RIGHT_ARROW:
	        case KeyCode.UP_ARROW:
	          event.preventDefault();
	          this.incrementValue(key);
	          break;
	
	        default:
	          break;
	      }
	    }
	
	    /**
	     * Handle any mousedown event received by the track
	     * @param {SyntheticEvent} event - User event
	     * @param {Slider} slider - React component
	     * @param {Point} position - Mousedown position
	     */
	  }, {
	    key: 'handleTrackMouseDown',
	    value: function handleTrackMouseDown(event, track, position) {
	      if (this.props.disabled) {
	        return;
	      }
	
	      event.preventDefault();
	
	      var key = getKeyByPosition(this, position);
	
	      this.updatePosition(key, position);
	    }
	
	    /**
	     * Handle the start of any user-triggered event
	     * @param {SyntheticEvent} event - User event
	     */
	  }, {
	    key: 'handleInteractionStart',
	    value: function handleInteractionStart() {
	      var _this = internals.get(this);
	
	      if (!this.props.onChangeComplete || (0, _util.isDefined)(_this.startValue)) {
	        return;
	      }
	
	      _this.startValue = this.props.value || this.props.defaultValue;
	    }
	
	    /**
	     * Handle the end of any user-triggered event
	     * @param {SyntheticEvent} event - User event
	     */
	  }, {
	    key: 'handleInteractionEnd',
	    value: function handleInteractionEnd() {
	      var _this = internals.get(this);
	
	      if (!this.props.onChangeComplete || !(0, _util.isDefined)(_this.startValue)) {
	        return;
	      }
	
	      if (_this.startValue !== this.props.value) {
	        this.props.onChangeComplete(this, this.props.value);
	      }
	
	      _this.startValue = null;
	    }
	
	    /**
	     * Handle any keydown event received by the component
	     * @param {SyntheticEvent} event - User event
	     */
	  }, {
	    key: 'handleKeyDown',
	    value: function handleKeyDown(event) {
	      this.handleInteractionStart(event);
	    }
	
	    /**
	     * Handle any keyup event received by the component
	     * @param {SyntheticEvent} event - User event
	     */
	  }, {
	    key: 'handleKeyUp',
	    value: function handleKeyUp(event) {
	      this.handleInteractionEnd(event);
	    }
	
	    /**
	     * Handle any mousedown event received by the component
	     * @param {SyntheticEvent} event - User event
	     */
	  }, {
	    key: 'handleMouseDown',
	    value: function handleMouseDown(event) {
	      var document = getDocument(this);
	
	      this.handleInteractionStart(event);
	
	      document.addEventListener('mouseup', this.handleMouseUp);
	    }
	
	    /**
	     * Handle any mouseup event received by the component
	     * @param {SyntheticEvent} event - User event
	     */
	  }, {
	    key: 'handleMouseUp',
	    value: function handleMouseUp(event) {
	      var document = getDocument(this);
	
	      this.handleInteractionEnd(event);
	
	      document.removeEventListener('mouseup', this.handleMouseUp);
	    }
	
	    /**
	     * Handle any touchstart event received by the component
	     * @param {SyntheticEvent} event - User event
	     */
	  }, {
	    key: 'handleTouchStart',
	    value: function handleTouchStart(event) {
	      var document = getDocument(this);
	
	      this.handleInteractionStart(event);
	
	      document.addEventListener('touchend', this.handleTouchEnd);
	    }
	
	    /**
	     * Handle any touchend event received by the component
	     * @param {SyntheticEvent} event - User event
	     */
	  }, {
	    key: 'handleTouchEnd',
	    value: function handleTouchEnd(event) {
	      var document = getDocument(this);
	
	      this.handleInteractionEnd(event);
	
	      document.removeEventListener('touchend', this.handleTouchEnd);
	    }
	
	    /**
	     * Render method of the component
	     * @return {string} Component JSX
	     */
	  }, {
	    key: 'render',
	    value: function render() {
	      var classNames = this.props.classNames;
	
	      var componentClassName = getComponentClassName(this);
	      var values = _valueTransformer2['default'].valuesFromProps(this);
	      var percentages = _valueTransformer2['default'].percentagesFromValues(this, values);
	
	      return _react2['default'].createElement(
	        'div',
	        {
	          'aria-disabled': this.props.disabled,
	          ref: 'inputRange',
	          className: componentClassName,
	          onKeyDown: this.handleKeyDown,
	          onKeyUp: this.handleKeyUp,
	          onMouseDown: this.handleMouseDown,
	          onTouchStart: this.handleTouchStart },
	        _react2['default'].createElement(
	          _Label2['default'],
	          {
	            className: classNames.labelMin,
	            containerClassName: classNames.labelContainer,
	            formatLabel: this.formatLabel },
	          this.props.minValue
	        ),
	        _react2['default'].createElement(
	          _Track2['default'],
	          {
	            classNames: classNames,
	            ref: 'track',
	            percentages: percentages,
	            onTrackMouseDown: this.handleTrackMouseDown },
	          renderSliders(this)
	        ),
	        _react2['default'].createElement(
	          _Label2['default'],
	          {
	            className: classNames.labelMax,
	            containerClassName: classNames.labelContainer,
	            formatLabel: this.formatLabel },
	          this.props.maxValue
	        ),
	        renderHiddenInputs(this)
	      );
	    }
	  }, {
	    key: 'trackClientRect',
	    get: function get() {
	      var track = this.refs.track;
	
	      if (track) {
	        return track.clientRect;
	      }
	
	      return {
	        height: 0,
	        left: 0,
	        top: 0,
	        width: 0
	      };
	    }
	
	    /**
	     * Return true if the component accepts a range of values
	     * @member {boolean}
	     */
	  }, {
	    key: 'isMultiValue',
	    get: function get() {
	      return (0, _util.isObject)(this.props.value) || (0, _util.isObject)(this.props.defaultValue);
	    }
	  }]);
	
	  return InputRange;
	})(_react2['default'].Component);
	
	exports['default'] = InputRange;
	InputRange.propTypes = {
	  ariaLabelledby: _react2['default'].PropTypes.string,
	  ariaControls: _react2['default'].PropTypes.string,
	  classNames: _react2['default'].PropTypes.objectOf(_react2['default'].PropTypes.string),
	  defaultValue: _propTypes.maxMinValuePropType,
	  disabled: _react2['default'].PropTypes.bool,
	  formatLabel: _react2['default'].PropTypes.func,
	  labelPrefix: _react2['default'].PropTypes.string,
	  labelSuffix: _react2['default'].PropTypes.string,
	  maxValue: _propTypes.maxMinValuePropType,
	  minValue: _propTypes.maxMinValuePropType,
	  name: _react2['default'].PropTypes.string,
	  onChange: _react2['default'].PropTypes.func.isRequired,
	  onChangeComplete: _react2['default'].PropTypes.func,
	  step: _react2['default'].PropTypes.number,
	  value: _propTypes.maxMinValuePropType
	};
	
	/**
	 * Default props of InputRange
	 * @static {Object}
	 * @property {Object.<string, string>} defaultClassNames
	 * @property {Range|number} defaultValue
	 * @property {boolean} disabled
	 * @property {string} labelPrefix
	 * @property {string} labelSuffix
	 * @property {number} maxValue
	 * @property {number} minValue
	 * @property {number} step
	 * @property {Range|number} value
	 */
	InputRange.defaultProps = {
	  classNames: _defaultClassNames2['default'],
	  defaultValue: 0,
	  disabled: false,
	  labelPrefix: '',
	  labelSuffix: '',
	  maxValue: 10,
	  minValue: 0,
	  step: 1,
	  value: null
	};
	module.exports = exports['default'];

/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module InputRange/Slider
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _Label = __webpack_require__(38);
	
	var _Label2 = _interopRequireDefault(_Label);
	
	var _util = __webpack_require__(39);
	
	/**
	 * Get the owner document of slider
	 * @private
	 * @param {Slider} slider - React component
	 * @return {Document} Document
	 */
	function getDocument(slider) {
	  var ownerDocument = slider.refs.slider.ownerDocument;
	
	  return ownerDocument;
	}
	
	/**
	 * Get the style of slider based on its props
	 * @private
	 * @param {Slider} slider - React component
	 * @return {Object} CSS styles
	 */
	function getStyle(slider) {
	  var perc = (slider.props.percentage || 0) * 100;
	  var style = {
	    position: 'absolute',
	    left: perc + '%'
	  };
	
	  return style;
	}
	
	/**
	 * Slider React component
	 * @class
	 * @extends React.Component
	 * @param {Object} props - React component props
	 */
	
	var Slider = (function (_React$Component) {
	  _inherits(Slider, _React$Component);
	
	  function Slider(props) {
	    _classCallCheck(this, Slider);
	
	    _get(Object.getPrototypeOf(Slider.prototype), 'constructor', this).call(this, props);
	
	    // Auto-bind
	    (0, _util.autobind)(['handleClick', 'handleMouseDown', 'handleMouseUp', 'handleMouseMove', 'handleTouchStart', 'handleTouchEnd', 'handleTouchMove', 'handleKeyDown'], this);
	  }
	
	  /**
	   * Accepted propTypes of Slider
	   * @static {Object}
	   * @property {Function} ariaLabelledby
	   * @property {Function} ariaControls
	   * @property {Function} className
	   * @property {Function} formatLabel
	   * @property {Function} maxValue
	   * @property {Function} minValue
	   * @property {Function} onSliderKeyDown
	   * @property {Function} onSliderMouseMove
	   * @property {Function} percentage
	   * @property {Function} type
	   * @property {Function} value
	   */
	
	  /**
	   * Handle any click event received by the component
	   * @param {SyntheticEvent} event - User event
	   */
	
	  _createClass(Slider, [{
	    key: 'handleClick',
	    value: function handleClick(event) {
	      event.preventDefault();
	    }
	
	    /**
	     * Handle any mousedown event received by the component
	     * @param {SyntheticEvent} event - User event
	     */
	  }, {
	    key: 'handleMouseDown',
	    value: function handleMouseDown() {
	      var document = getDocument(this);
	
	      // Event
	      document.addEventListener('mousemove', this.handleMouseMove);
	      document.addEventListener('mouseup', this.handleMouseUp);
	    }
	
	    /**
	     * Handle any mouseup event received by the component
	     * @param {SyntheticEvent} event - User event
	     */
	  }, {
	    key: 'handleMouseUp',
	    value: function handleMouseUp() {
	      var document = getDocument(this);
	
	      // Event
	      document.removeEventListener('mousemove', this.handleMouseMove);
	      document.removeEventListener('mouseup', this.handleMouseUp);
	    }
	
	    /**
	     * Handle any mousemove event received by the component
	     * @param {SyntheticEvent} event - User event
	     */
	  }, {
	    key: 'handleMouseMove',
	    value: function handleMouseMove(event) {
	      this.props.onSliderMouseMove(event, this);
	    }
	
	    /**
	     * Handle any touchstart event received by the component
	     * @param {SyntheticEvent} event - User event
	     */
	  }, {
	    key: 'handleTouchStart',
	    value: function handleTouchStart(event) {
	      var document = getDocument(this);
	
	      event.preventDefault();
	
	      document.addEventListener('touchmove', this.handleTouchMove);
	      document.addEventListener('touchend', this.handleTouchEnd);
	    }
	
	    /**
	     * Handle any touchmove event received by the component
	     * @param {SyntheticEvent} event - User event
	     */
	  }, {
	    key: 'handleTouchMove',
	    value: function handleTouchMove(event) {
	      this.props.onSliderMouseMove(event, this);
	    }
	
	    /**
	     * Handle any touchend event received by the component
	     * @param {SyntheticEvent} event - User event
	     */
	  }, {
	    key: 'handleTouchEnd',
	    value: function handleTouchEnd(event) {
	      var document = getDocument(this);
	
	      event.preventDefault();
	
	      document.removeEventListener('touchmove', this.handleTouchMove);
	      document.removeEventListener('touchend', this.handleTouchEnd);
	    }
	
	    /**
	     * Handle any keydown event received by the component
	     * @param {SyntheticEvent} event - User event
	     */
	  }, {
	    key: 'handleKeyDown',
	    value: function handleKeyDown(event) {
	      this.props.onSliderKeyDown(event, this);
	    }
	
	    /**
	     * Render method of the component
	     * @return {string} Component JSX
	     */
	  }, {
	    key: 'render',
	    value: function render() {
	      var classNames = this.props.classNames;
	      var style = getStyle(this);
	
	      return _react2['default'].createElement(
	        'span',
	        {
	          className: classNames.sliderContainer,
	          ref: 'slider',
	          style: style },
	        _react2['default'].createElement(
	          _Label2['default'],
	          {
	            className: classNames.labelValue,
	            containerClassName: classNames.labelContainer,
	            formatLabel: this.props.formatLabel },
	          this.props.value
	        ),
	        _react2['default'].createElement('a', {
	          'aria-labelledby': this.props.ariaLabelledby,
	          'aria-controls': this.props.ariaControls,
	          'aria-valuemax': this.props.maxValue,
	          'aria-valuemin': this.props.minValue,
	          'aria-valuenow': this.props.value,
	          className: classNames.slider,
	          draggable: 'false',
	          href: '#',
	          onClick: this.handleClick,
	          onKeyDown: this.handleKeyDown,
	          onMouseDown: this.handleMouseDown,
	          onTouchStart: this.handleTouchStart,
	          role: 'slider' })
	      );
	    }
	  }]);
	
	  return Slider;
	})(_react2['default'].Component);
	
	exports['default'] = Slider;
	Slider.propTypes = {
	  ariaLabelledby: _react2['default'].PropTypes.string,
	  ariaControls: _react2['default'].PropTypes.string,
	  classNames: _react2['default'].PropTypes.objectOf(_react2['default'].PropTypes.string),
	  formatLabel: _react2['default'].PropTypes.func,
	  maxValue: _react2['default'].PropTypes.number,
	  minValue: _react2['default'].PropTypes.number,
	  onSliderKeyDown: _react2['default'].PropTypes.func.isRequired,
	  onSliderMouseMove: _react2['default'].PropTypes.func.isRequired,
	  percentage: _react2['default'].PropTypes.number.isRequired,
	  type: _react2['default'].PropTypes.string.isRequired,
	  value: _react2['default'].PropTypes.number.isRequired
	};
	module.exports = exports['default'];

/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module InputRange/Label
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	/**
	 * Label React component
	 * @class
	 * @extends React.Component
	 * @param {Object} props - React component props
	 */
	
	var Label = (function (_React$Component) {
	  _inherits(Label, _React$Component);
	
	  function Label() {
	    _classCallCheck(this, Label);
	
	    _get(Object.getPrototypeOf(Label.prototype), 'constructor', this).apply(this, arguments);
	  }
	
	  /**
	   * Accepted propTypes of Label
	   * @static {Object}
	   * @property {Function} children
	   * @property {Function} className
	   * @property {Function} containerClassName
	   * @property {Function} formatLabel
	   */
	
	  _createClass(Label, [{
	    key: 'render',
	
	    /**
	     * Render method of the component
	     * @return {string} Component JSX
	     */
	    value: function render() {
	      var _props = this.props;
	      var className = _props.className;
	      var containerClassName = _props.containerClassName;
	
	      var labelValue = this.props.formatLabel ? this.props.formatLabel(this.props.children) : this.props.children;
	
	      return _react2['default'].createElement(
	        'span',
	        { className: className },
	        _react2['default'].createElement(
	          'span',
	          { className: containerClassName },
	          labelValue
	        )
	      );
	    }
	  }]);
	
	  return Label;
	})(_react2['default'].Component);
	
	exports['default'] = Label;
	Label.propTypes = {
	  children: _react2['default'].PropTypes.node,
	  className: _react2['default'].PropTypes.string,
	  containerClassName: _react2['default'].PropTypes.string,
	  formatLabel: _react2['default'].PropTypes.func
	};
	module.exports = exports['default'];

/***/ },
/* 39 */
/***/ function(module, exports) {

	/**
	 * @module InputRange/util
	 */
	
	/**
	 * @callback predicateFn
	 * @param {*} value
	 * @return {boolean}
	 */
	
	/**
	 * Clamp a value between a min and max value
	 * @static
	 * @param {number} value
	 * @param {number} min
	 * @param {number} max
	 * @return {number}
	 */
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	exports.clamp = clamp;
	exports.extend = extend;
	exports.includes = includes;
	exports.omit = omit;
	exports.captialize = captialize;
	exports.distanceTo = distanceTo;
	exports.length = length;
	exports.isNumber = isNumber;
	exports.isObject = isObject;
	exports.isDefined = isDefined;
	exports.isEmpty = isEmpty;
	exports.arrayOf = arrayOf;
	exports.objectOf = objectOf;
	exports.autobind = autobind;
	
	function clamp(value, min, max) {
	  return Math.min(Math.max(value, min), max);
	}
	
	/**
	 * Extend an Object
	 * @static
	 * @param {Object} object - Destination object
	 * @param {...Object} sources - Source objects
	 * @return {Object} Destination object, extended with members from sources
	 */
	
	function extend() {
	  return Object.assign.apply(Object, arguments);
	}
	
	/**
	 * Check if a value is included in an array
	 * @static
	 * @param {Array} array
	 * @param {number} value
	 * @return {boolean}
	 */
	
	function includes(array, value) {
	  return array.indexOf(value) > -1;
	}
	
	/**
	 * Return a new object without the specified keys
	 * @static
	 * @param {Object} obj
	 * @param {Array.<string>} omitKeys
	 * @return {Object}
	 */
	
	function omit(obj, omitKeys) {
	  var keys = Object.keys(obj);
	  var outputObj = {};
	
	  keys.forEach(function (key) {
	    if (!includes(omitKeys, key)) {
	      outputObj[key] = obj[key];
	    }
	  });
	
	  return outputObj;
	}
	
	/**
	 * Captialize a string
	 * @static
	 * @param {string} string
	 * @return {string}
	 */
	
	function captialize(string) {
	  return string.charAt(0).toUpperCase() + string.slice(1);
	}
	
	/**
	 * Calculate the distance between pointA and pointB
	 * @static
	 * @param {Point} pointA
	 * @param {Point} pointB
	 * @return {number} Distance
	 */
	
	function distanceTo(pointA, pointB) {
	  return Math.sqrt(Math.pow(pointB.x - pointA.x, 2) + Math.pow(pointB.y - pointA.y, 2));
	}
	
	/**
	 * Calculate the absolute difference between two numbers
	 * @static
	 * @param {number} numA
	 * @param {number} numB
	 * @return {number}
	 */
	
	function length(numA, numB) {
	  return Math.abs(numA - numB);
	}
	
	/**
	 * Check if a value is a number
	 * @static
	 * @param {*} value
	 * @return {Boolean}
	 */
	
	function isNumber(value) {
	  return typeof value === 'number';
	}
	
	/**
	 * Check if a value is an object
	 * @static
	 * @param {*} value
	 * @return {Boolean}
	 */
	
	function isObject(value) {
	  return value !== null && typeof value === 'object';
	}
	
	/**
	 * Check if a value is defined
	 * @static
	 * @param {*} value
	 * @return {Boolean}
	 */
	
	function isDefined(value) {
	  return value !== undefined && value !== null;
	}
	
	/**
	 * Check if an object is empty
	 * @static
	 * @param {Object|Array} obj
	 * @return {Boolean}
	 */
	
	function isEmpty(obj) {
	  if (!obj) {
	    return true;
	  }
	
	  if (Array.isArray(obj)) {
	    return obj.length === 0;
	  }
	
	  return Object.keys(obj).length === 0;
	}
	
	/**
	 * Check if all items in an array match a predicate
	 * @static
	 * @param {Array} array
	 * @param {predicateFn} predicate
	 * @return {Boolean}
	 */
	
	function arrayOf(array, predicate) {
	  if (!Array.isArray(array)) {
	    return false;
	  }
	
	  for (var i = 0, len = array.length; i < len; i++) {
	    if (!predicate(array[i])) {
	      return false;
	    }
	  }
	
	  return true;
	}
	
	/**
	 * Check if all items in an object match a predicate
	 * @static
	 * @param {Object} object
	 * @param {predicateFn} predicate
	 * @param {Array.<string>} keys
	 * @return {Boolean}
	 */
	
	function objectOf(object, predicate, keys) {
	  if (!isObject(object)) {
	    return false;
	  }
	
	  var props = keys || Object.keys(object);
	
	  for (var i = 0, len = props.length; i < len; i++) {
	    var prop = props[i];
	
	    if (!predicate(object[prop])) {
	      return false;
	    }
	  }
	
	  return true;
	}
	
	/**
	 * Bind all methods of an object to itself
	 * @static
	 * @param {Array.<Function>} methodNames
	 * @param {Object} instance
	 */
	
	function autobind(methodNames, instance) {
	  methodNames.forEach(function (methodName) {
	    instance[methodName] = instance[methodName].bind(instance);
	  });
	}

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module InputRange/Track
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }
	
	function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _util = __webpack_require__(39);
	
	/**
	 * Get the CSS styles for an active track
	 * @private
	 * @param {Track} track React component
	 * @return {Object} CSS styles
	 */
	function getActiveTrackStyle(track) {
	  var props = track.props;
	
	  var width = (props.percentages.max - props.percentages.min) * 100 + '%';
	  var left = props.percentages.min * 100 + '%';
	
	  var activeTrackStyle = {
	    left: left,
	    width: width
	  };
	
	  return activeTrackStyle;
	}
	
	/**
	 * Track React component
	 * @class
	 * @extends React.Component
	 * @param {Object} props - React component props
	 */
	
	var Track = (function (_React$Component) {
	  _inherits(Track, _React$Component);
	
	  function Track(props) {
	    _classCallCheck(this, Track);
	
	    _get(Object.getPrototypeOf(Track.prototype), 'constructor', this).call(this, props);
	
	    // Auto-bind
	    (0, _util.autobind)(['handleMouseDown', 'handleTouchStart'], this);
	  }
	
	  /**
	   * Accepted propTypes of Track
	   * @static {Object}
	   * @property {Function} children
	   * @property {Function} classNames
	   * @property {Function} onTrackMouseDown
	   * @property {Function} percentages
	   */
	
	  /**
	   * Return the clientRect of the component
	   * @member {ClientRect}
	   */
	
	  _createClass(Track, [{
	    key: 'handleMouseDown',
	
	    /**
	     * Handle any mousedown event received by the component
	     * @param {SyntheticEvent} event - User event
	     */
	    value: function handleMouseDown(event) {
	      var trackClientRect = this.clientRect;
	
	      var _ref = event.touches ? event.touches[0] : event;
	
	      var clientX = _ref.clientX;
	
	      var position = {
	        x: clientX - trackClientRect.left,
	        y: 0
	      };
	
	      this.props.onTrackMouseDown(event, this, position);
	    }
	
	    /**
	     * Handle any touchstart event received by the component
	     * @param {SyntheticEvent} event - User event
	     */
	  }, {
	    key: 'handleTouchStart',
	    value: function handleTouchStart(event) {
	      event.preventDefault();
	
	      this.handleMouseDown(event);
	    }
	
	    /**
	     * Render method of the component
	     * @return {string} Component JSX
	     */
	  }, {
	    key: 'render',
	    value: function render() {
	      var activeTrackStyle = getActiveTrackStyle(this);
	      var classNames = this.props.classNames;
	
	      return _react2['default'].createElement(
	        'div',
	        {
	          className: classNames.trackContainer,
	          onMouseDown: this.handleMouseDown,
	          onTouchStart: this.handleTouchStart,
	          ref: 'track' },
	        _react2['default'].createElement('div', {
	          style: activeTrackStyle,
	          className: classNames.trackActive }),
	        this.props.children
	      );
	    }
	  }, {
	    key: 'clientRect',
	    get: function get() {
	      var track = this.refs.track;
	
	      var clientRect = track.getBoundingClientRect();
	
	      return clientRect;
	    }
	  }]);
	
	  return Track;
	})(_react2['default'].Component);
	
	exports['default'] = Track;
	Track.propTypes = {
	  children: _react2['default'].PropTypes.node,
	  classNames: _react2['default'].PropTypes.objectOf(_react2['default'].PropTypes.string),
	  onTrackMouseDown: _react2['default'].PropTypes.func.isRequired,
	  percentages: _react2['default'].PropTypes.objectOf(_react2['default'].PropTypes.number).isRequired
	};
	module.exports = exports['default'];

/***/ },
/* 41 */
/***/ function(module, exports) {

	/**
	 * @module InputRange/defaultClassNames
	 */
	
	/**
	* An object containing class names
	* @const {Object}
	* @property {string} component
	* @property {string} labelContainer
	* @property {string} labelMax
	* @property {string} labelMin
	* @property {string} labelValue
	* @property {string} slider
	* @property {string} sliderContainer
	* @property {string} trackActive
	* @property {string} trackContainer
	*/
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	exports['default'] = {
	  component: 'InputRange',
	  labelContainer: 'InputRange-labelContainer',
	  labelMax: 'InputRange-label InputRange-label--max',
	  labelMin: 'InputRange-label InputRange-label--min',
	  labelValue: 'InputRange-label InputRange-label--value',
	  slider: 'InputRange-slider',
	  sliderContainer: 'InputRange-sliderContainer',
	  trackActive: 'InputRange-track InputRange-track--active',
	  trackContainer: 'InputRange-track InputRange-track--container'
	};
	module.exports = exports['default'];

/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module InputRange/valueTransformer
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	var _util = __webpack_require__(39);
	
	/**
	 * Convert position into percentage value
	 * @static
	 * @param {InputRange} inputRange
	 * @param {Point} position
	 * @return {number} Percentage value
	 */
	function percentageFromPosition(inputRange, position) {
	  var length = inputRange.trackClientRect.width;
	  var sizePerc = position.x / length;
	
	  return sizePerc || 0;
	}
	
	/**
	 * Convert position into model value
	 * @static
	 * @param {InputRange} inputRange
	 * @param {Point} position
	 * @return {number} Model value
	 */
	function valueFromPosition(inputRange, position) {
	  var sizePerc = percentageFromPosition(inputRange, position);
	  var valueDiff = inputRange.props.maxValue - inputRange.props.minValue;
	  var value = inputRange.props.minValue + valueDiff * sizePerc;
	
	  return value;
	}
	
	/**
	 * Extract values from props
	 * @static
	 * @param {InputRange} inputRange
	 * @param {Point} [props=inputRange.props]
	 * @return {Range} Range values
	 */
	function valuesFromProps(inputRange) {
	  var _ref = arguments.length <= 1 || arguments[1] === undefined ? inputRange : arguments[1];
	
	  var props = _ref.props;
	  return (function () {
	    if (inputRange.isMultiValue) {
	      var values = props.value;
	
	      if ((0, _util.isEmpty)(values) || !(0, _util.objectOf)(values, _util.isNumber)) {
	        values = props.defaultValue;
	      }
	
	      return Object.create(values);
	    }
	
	    var value = (0, _util.isNumber)(props.value) ? props.value : props.defaultValue;
	
	    return {
	      min: props.minValue,
	      max: value
	    };
	  })();
	}
	
	/**
	 * Convert value into percentage value
	 * @static
	 * @param {InputRange} inputRange
	 * @param {number} value
	 * @return {number} Percentage value
	 */
	function percentageFromValue(inputRange, value) {
	  var validValue = (0, _util.clamp)(value, inputRange.props.minValue, inputRange.props.maxValue);
	  var valueDiff = inputRange.props.maxValue - inputRange.props.minValue;
	  var valuePerc = (validValue - inputRange.props.minValue) / valueDiff;
	
	  return valuePerc || 0;
	}
	
	/**
	 * Convert values into percentage values
	 * @static
	 * @param {InputRange} inputRange
	 * @param {Range} values
	 * @return {Range} Percentage values
	 */
	function percentagesFromValues(inputRange, values) {
	  var percentages = {
	    min: percentageFromValue(inputRange, values.min),
	    max: percentageFromValue(inputRange, values.max)
	  };
	
	  return percentages;
	}
	
	/**
	 * Convert value into position
	 * @static
	 * @param {InputRange} inputRange
	 * @param {number} value
	 * @return {Point} Position
	 */
	function positionFromValue(inputRange, value) {
	  var length = inputRange.trackClientRect.width;
	  var valuePerc = percentageFromValue(inputRange, value);
	  var positionValue = valuePerc * length;
	
	  return {
	    x: positionValue,
	    y: 0
	  };
	}
	
	/**
	 * Convert a range of values into positions
	 * @static
	 * @param {InputRange} inputRange
	 * @param {Range} values
	 * @return {Object.<string, Point>}
	 */
	function positionsFromValues(inputRange, values) {
	  var positions = {
	    min: positionFromValue(inputRange, values.min),
	    max: positionFromValue(inputRange, values.max)
	  };
	
	  return positions;
	}
	
	/**
	 * Extract a position from an event
	 * @static
	 * @param {InputRange} inputRange
	 * @param {Event} event
	 * @return {Point}
	 */
	function positionFromEvent(inputRange, event) {
	  var trackClientRect = inputRange.trackClientRect;
	  var length = trackClientRect.width;
	
	  var _ref2 = event.touches ? event.touches[0] : event;
	
	  var clientX = _ref2.clientX;
	
	  var position = {
	    x: (0, _util.clamp)(clientX - trackClientRect.left, 0, length),
	    y: 0
	  };
	
	  return position;
	}
	
	/**
	 * Convert a value into a step value
	 * @static
	 * @param {InputRange} inputRange
	 * @param {number} value
	 * @return {number} Step value
	 */
	function stepValueFromValue(inputRange, value) {
	  return Math.round(value / inputRange.props.step) * inputRange.props.step;
	}
	
	exports['default'] = {
	  percentageFromPosition: percentageFromPosition,
	  percentageFromValue: percentageFromValue,
	  percentagesFromValues: percentagesFromValues,
	  positionFromEvent: positionFromEvent,
	  positionFromValue: positionFromValue,
	  positionsFromValues: positionsFromValues,
	  stepValueFromValue: stepValueFromValue,
	  valueFromPosition: valueFromPosition,
	  valuesFromProps: valuesFromProps
	};
	module.exports = exports['default'];

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module InputRange/maxMinValuePropType
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	exports.maxMinValuePropType = maxMinValuePropType;
	
	var _util = __webpack_require__(39);
	
	/**
	 * A prop type accepting a range of numeric values or a single numeric value
	 * @param {Object} props - React component props
	 * @return {?Error} Return Error if validation fails
	 */
	
	function maxMinValuePropType(props) {
	  var maxValue = props.maxValue;
	  var minValue = props.minValue;
	  var value = props.value;
	  var defaultValue = props.defaultValue;
	  var isValueNumber = (0, _util.isNumber)(value);
	  var isDefaultValueNumber = (0, _util.isNumber)(defaultValue);
	  var isValueNumberObject = (0, _util.objectOf)(value, _util.isNumber);
	  var isDefaultValueNumberObject = (0, _util.objectOf)(defaultValue, _util.isNumber);
	
	  if (value === undefined) {
	    return new Error('`value` must be defined');
	  }
	
	  if (!isValueNumber && !isDefaultValueNumber && !isValueNumberObject && !isDefaultValueNumberObject) {
	    return new Error('`value` or `defaultValue` must be a number or an array');
	  }
	
	  if (minValue >= maxValue) {
	    return new Error('`minValue` must be smaller than `maxValue`');
	  }
	
	  if (maxValue <= minValue) {
	    return new Error('`maxValue` must be larger than `minValue`');
	  }
	
	  if (value < minValue || value > maxValue) {
	    return new Error('`value` must be within `minValue` and `maxValue`');
	  }
	}

/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = FilterFooter;
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _I18n = __webpack_require__(15);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function FilterFooter(props) {
	  var disableApplyFilter = props.disableApplyFilter;
	  var onClickApply = props.onClickApply;
	  var onClickCancel = props.onClickCancel;
	  var onClickClear = props.onClickClear;
	
	
	  return _react2.default.createElement(
	    'div',
	    { className: 'filter-footer' },
	    _react2.default.createElement(
	      'button',
	      { className: 'btn btn-sm btn-transparent clear-btn', onClick: onClickClear },
	      _react2.default.createElement('span', { className: 'icon-close-2', role: 'presentation' }),
	      (0, _I18n.translate)('filter_bar.clear')
	    ),
	    _react2.default.createElement(
	      'div',
	      { className: 'apply-btn-container' },
	      _react2.default.createElement(
	        'button',
	        { className: 'btn btn-sm btn-transparent cancel-btn', onClick: onClickCancel },
	        (0, _I18n.translate)('filter_bar.cancel')
	      ),
	      _react2.default.createElement(
	        'button',
	        {
	          className: 'btn btn-sm btn-default apply-btn',
	          onClick: onClickApply,
	          disabled: disableApplyFilter },
	        (0, _I18n.translate)('filter_bar.apply')
	      )
	    )
	  );
	}
	
	FilterFooter.propTypes = {
	  disableApplyFilter: _react.PropTypes.bool,
	  onClickApply: _react.PropTypes.func.isRequired,
	  onClickCancel: _react.PropTypes.func.isRequired,
	  onClickClear: _react.PropTypes.func.isRequired
	};

/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.TextFilter = undefined;
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _SearchablePicklist = __webpack_require__(30);
	
	var _SearchablePicklist2 = _interopRequireDefault(_SearchablePicklist);
	
	var _FilterFooter = __webpack_require__(44);
	
	var _FilterFooter2 = _interopRequireDefault(_FilterFooter);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var TextFilter = exports.TextFilter = _react2.default.createClass({
	  displayName: 'TextFilter',
	
	  propTypes: {
	    filter: _react.PropTypes.object.isRequired,
	    column: _react.PropTypes.object.isRequired,
	    fetchSuggestions: _react.PropTypes.func,
	    onCancel: _react.PropTypes.func.isRequired,
	    onUpdate: _react.PropTypes.func.isRequired
	  },
	
	  getInitialState: function getInitialState() {
	    return {
	      isLoading: true,
	      value: _lodash2.default.get(this.props.filter, 'parameters.arguments.operand'),
	      suggestions: []
	    };
	  },
	  componentDidMount: function componentDidMount() {
	    var _this = this;
	
	    var _props = this.props;
	    var fetchSuggestions = _props.fetchSuggestions;
	    var column = _props.column;
	
	
	    this.isMounted = true;
	
	    fetchSuggestions(column, '').then(function (suggestions) {
	      if (_this.isMounted) {
	        _this.setState({
	          suggestions: suggestions,
	          isLoading: false
	        });
	      }
	    });
	  },
	  componentWillUnmount: function componentWillUnmount() {
	    this.isMounted = false;
	  },
	  onChangeSearchTerm: function onChangeSearchTerm(searchTerm) {
	    var _this2 = this;
	
	    var _props2 = this.props;
	    var fetchSuggestions = _props2.fetchSuggestions;
	    var column = _props2.column;
	
	
	    this.setState({
	      loading: true,
	      value: searchTerm
	    }, function () {
	      fetchSuggestions(column, searchTerm).then(function (suggestions) {
	        if (_this2.isMounted) {
	          _this2.setState({
	            suggestions: suggestions,
	            isLoading: false
	          });
	        }
	      });
	    });
	  },
	  onSelectSuggestion: function onSelectSuggestion(suggestion) {
	    this.setState({
	      value: suggestion.title
	    });
	  },
	  clearFilter: function clearFilter() {
	    this.setState({
	      value: null
	    });
	  },
	  updateFilter: function updateFilter() {
	    var _props3 = this.props;
	    var filter = _props3.filter;
	    var onUpdate = _props3.onUpdate;
	    var value = this.state.value;
	
	
	    var newFilter = _lodash2.default.merge({}, filter, {
	      parameters: {
	        arguments: {
	          operand: value
	        }
	      }
	    });
	
	    onUpdate(newFilter);
	  },
	  render: function render() {
	    var _props4 = this.props;
	    var filter = _props4.filter;
	    var onCancel = _props4.onCancel;
	    var _state = this.state;
	    var isLoading = _state.isLoading;
	    var value = _state.value;
	    var suggestions = _state.suggestions;
	
	
	    var picklistProps = {
	      isLoading: isLoading,
	      onSelection: this.onSelectSuggestion,
	      onChangeSearchTerm: this.onChangeSearchTerm,
	      options: _lodash2.default.map(suggestions, function (suggestion) {
	        return {
	          title: suggestion,
	          value: suggestion
	        };
	      }),
	      value: value
	    };
	
	    var filterFooterProps = {
	      disableApplyFilter: _lodash2.default.isEqual(value, _lodash2.default.get(filter, 'parameters.arguments.operand')),
	      onClickApply: this.updateFilter,
	      onClickCancel: onCancel,
	      onClickClear: this.clearFilter
	    };
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'filter-controls text-filter' },
	      _react2.default.createElement(
	        'div',
	        { className: 'column-container' },
	        _react2.default.createElement(_SearchablePicklist2.default, picklistProps)
	      ),
	      _react2.default.createElement(_FilterFooter2.default, filterFooterProps)
	    );
	  }
	});
	
	exports.default = TextFilter;

/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _I18n = __webpack_require__(15);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	// TODO This component can't be a stateless component because its parent attaches a ref to it.
	// Currently the component is simple enough that the linter thinks it should be a stateless
	// component, so we override that lint rule here.  Once this component becomes more complicated,
	// remove this comment and the eslint-disable-line commentwe use a lint override.
	exports.default = _react2.default.createClass({
	  displayName: 'FilterConfig',
	  // eslint-disable-line react/prefer-stateless-function
	  propTypes: {
	    onRemove: _react.PropTypes.func.isRequired
	  },
	
	  render: function render() {
	    return _react2.default.createElement(
	      'div',
	      { className: 'filter-config' },
	      _react2.default.createElement(
	        'div',
	        { className: 'filter-footer' },
	        _react2.default.createElement(
	          'button',
	          { className: 'btn btn-sm btn-transparent remove-btn', onClick: this.props.onRemove },
	          _react2.default.createElement('span', { className: 'icon-close-2' }),
	          (0, _I18n.translate)('filter_bar.remove_filter')
	        )
	      )
	    );
	  }
	});

/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.getDefaultFilterForColumn = getDefaultFilterForColumn;
	exports.getToggleTextForFilter = getToggleTextForFilter;
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _I18n = __webpack_require__(15);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function getDefaultFilterForColumn(column) {
	  var parameters = void 0;
	
	  switch (column.dataTypeName) {
	    case 'text':
	      parameters = {
	        'function': 'binaryOperator',
	        columnName: column.fieldName,
	        arguments: {
	          operator: '=',
	          operand: null
	        }
	      };
	      break;
	
	    case 'number':
	      parameters = {
	        'function': 'valueRange',
	        columnName: column.fieldName,
	        arguments: {
	          start: column.rangeMin,
	          end: column.rangeMax
	        }
	      };
	      break;
	
	    default:
	      return null;
	  }
	
	  return {
	    parameters: parameters,
	    isLocked: false,
	    isHidden: false,
	    isRequired: false,
	    allowMultiple: false
	  };
	}
	
	function getToggleTextForFilter(filter, column) {
	  switch (column.dataTypeName) {
	    case 'number':
	      var value = _lodash2.default.get(filter, 'parameters.arguments', {});
	
	      var hasMinValue = _lodash2.default.isFinite(value.start) && !_lodash2.default.isEqual(column.rangeMin, value.start);
	      var hasMaxValue = _lodash2.default.isFinite(value.end) && !_lodash2.default.isEqual(column.rangeMax, value.end);
	
	      if (hasMinValue && hasMaxValue) {
	        return (0, _I18n.translate)('filter_bar.range_filter.range_label').format(value.start, value.end);
	      } else if (hasMinValue) {
	        return (0, _I18n.translate)('filter_bar.range_filter.greater_label').format(value.start);
	      } else if (hasMaxValue) {
	        return (0, _I18n.translate)('filter_bar.range_filter.less_label').format(value.end);
	      } else {
	        return (0, _I18n.translate)('filter_bar.all');
	      }
	
	    case 'text':
	      return _lodash2.default.defaultTo(filter.parameters.arguments.operand, (0, _I18n.translate)('filter_bar.all'));
	
	    default:
	      return '';
	  }
	}

/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _collapsible = __webpack_require__(49);
	
	var _collapsible2 = _interopRequireDefault(_collapsible);
	
	var _purify = __webpack_require__(24);
	
	var _purify2 = _interopRequireDefault(_purify);
	
	var _I18n = __webpack_require__(15);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	/**
	 * The InfoPane is a component that is designed to render a hero element with useful information
	 * about a dataset.  The component prominently features the title of the asset, a description that
	 * is automatically ellipsified, various badges indicating the privacy, provenance, and category
	 * of the asset, several areas for custom metadata to be displayed, and an area meant to be used
	 * for buttons.
	 */
	var InfoPane = _react2.default.createClass({
	  displayName: 'InfoPane',
	
	  propTypes: {
	
	    /**
	     * An optional string representing the category of the asset.
	     */
	    category: _react.PropTypes.string,
	
	    /**
	     * A string containing the description of the asset.  It will be ellipsified using dotdotdot,
	     * and will have a control for expanding and collapsing the full description.  HTML is allowed
	     * in the description; it will be sanitized to prevent security vulnerabilities.
	     */
	    description: _react.PropTypes.string,
	
	    /**
	     * The number of lines to truncate the description to.  If unspecified, defaults to 4.
	     */
	    descriptionLines: _react.PropTypes.number,
	
	    /**
	     * The optional footer prop can be a string or an HTML element.  It is rendered below the
	     * description.  HTML is allowed in the footer; it will be sanitized to prevent security
	     * vulnerabilities.
	     */
	    footer: _react.PropTypes.node,
	
	    /**
	     * If the isOfficial prop is true, a badge indicating the asset's official status is displayed.
	     */
	    isOfficial: _react.PropTypes.bool,
	
	    /**
	     * If the isPrivate prop is true, a badge indicating the asset's visibility is displayed.
	     */
	    isPrivate: _react.PropTypes.bool,
	
	    /**
	     * The metadata prop is an object meant to contain two arbitrary pieces of metadata about the
	     * asset.  The two sections are named "first" and "second" and should be objects, each
	     * containing a "label" and "content" key.  They are rendered to the right of the description.
	     */
	    metadata: _react.PropTypes.shape({
	      first: _react.PropTypes.shape({
	        label: _react.PropTypes.node.isRequired,
	        content: _react.PropTypes.node.isRequired
	      }),
	      second: _react.PropTypes.shape({
	        label: _react.PropTypes.node.isRequired,
	        content: _react.PropTypes.node.isRequired
	      })
	    }),
	
	    /**
	     * The title of the asset, displayed in an h1 tag.
	     */
	    name: _react.PropTypes.string,
	
	    /**
	     * A function that is called when the full description is expanded.
	     */
	    onExpandDescription: _react.PropTypes.func,
	
	    /**
	     * An optional function that should return content to be rendered in the upper-right hand corner
	     * of the info pane.
	     */
	    renderButtons: _react.PropTypes.func
	  },
	
	  getDefaultProps: function getDefaultProps() {
	    return {
	      descriptionLines: 4,
	      onExpandDescription: _lodash2.default.noop
	    };
	  },
	  componentDidMount: function componentDidMount() {
	    if (this.metadataPane && this.description) {
	      var metadataHeight = this.metadataPane.getBoundingClientRect().height;
	      var descriptionHeight = this.description.getBoundingClientRect().height;
	
	      if (descriptionHeight < metadataHeight) {
	        this.description.style.height = metadataHeight + 'px';
	      }
	    }
	
	    var _props = this.props;
	    var descriptionLines = _props.descriptionLines;
	    var onExpandDescription = _props.onExpandDescription;
	
	    var descriptionLineHeight = 24;
	    var descriptionPadding = 11;
	
	    (0, _collapsible2.default)(this.description, {
	      height: descriptionLines * descriptionLineHeight + 2 * descriptionPadding,
	      expandedCallback: onExpandDescription
	    });
	  },
	  renderDescription: function renderDescription() {
	    var _this = this;
	
	    var description = this.props.description;
	
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'entry-description-container collapsible' },
	      _react2.default.createElement(
	        'div',
	        { className: 'entry-description', ref: function ref(el) {
	            return _this.description = el;
	          } },
	        _react2.default.createElement('div', { dangerouslySetInnerHTML: { __html: (0, _purify2.default)(description) } }),
	        _react2.default.createElement(
	          'button',
	          { className: 'collapse-toggle more' },
	          (0, _I18n.translate)('info_pane.more')
	        ),
	        _react2.default.createElement(
	          'button',
	          { className: 'collapse-toggle less' },
	          (0, _I18n.translate)('info_pane.less')
	        )
	      )
	    );
	  },
	  renderFooter: function renderFooter() {
	    var footer = this.props.footer;
	
	
	    if (!footer) {
	      return null;
	    }
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'entry-meta first' },
	      _react2.default.createElement('div', { className: 'entry-meta topics', dangerouslySetInnerHTML: { __html: (0, _purify2.default)(footer) } })
	    );
	  },
	  renderMetadata: function renderMetadata() {
	    var _this2 = this;
	
	    var metadata = this.props.metadata;
	
	
	    if (!metadata) {
	      return null;
	    }
	
	    var metadataLeft = metadata.first ? _react2.default.createElement(
	      'div',
	      { className: 'entry-meta updated' },
	      _react2.default.createElement(
	        'span',
	        { className: 'meta-title' },
	        metadata.first.label
	      ),
	      ' ',
	      _react2.default.createElement(
	        'span',
	        { className: 'date' },
	        metadata.first.content
	      )
	    ) : null;
	
	    var metadataRight = metadata.second ? _react2.default.createElement(
	      'div',
	      { className: 'entry-meta views' },
	      _react2.default.createElement(
	        'span',
	        { className: 'meta-title' },
	        metadata.second.label
	      ),
	      ' ',
	      _react2.default.createElement(
	        'span',
	        { className: 'date' },
	        metadata.second.content
	      )
	    ) : null;
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'entry-meta second', ref: function ref(el) {
	          return _this2.metadataPane = el;
	        } },
	      metadataLeft,
	      metadataRight
	    );
	  },
	  render: function render() {
	    var _props2 = this.props;
	    var category = _props2.category;
	    var isOfficial = _props2.isOfficial;
	    var isPrivate = _props2.isPrivate;
	    var name = _props2.name;
	    var renderButtons = _props2.renderButtons;
	
	
	    var privateIcon = isPrivate ? _react2.default.createElement('span', {
	      className: 'icon-private',
	      'aria-label': (0, _I18n.translate)('info_pane.private_notice'),
	      title: (0, _I18n.translate)('info_pane.private_notice') }) : null;
	
	    var categoryBadge = category ? _react2.default.createElement(
	      'span',
	      { className: 'tag-category' },
	      _lodash2.default.upperFirst(category)
	    ) : null;
	
	    var officialBadge = isOfficial ? _react2.default.createElement(
	      'span',
	      { className: 'tag-official' },
	      _react2.default.createElement('span', { 'aria-hidden': true, className: 'icon-official' }),
	      (0, _I18n.translate)('info_pane.official')
	    ) : null;
	
	    var buttons = renderButtons ? _react2.default.createElement(
	      'div',
	      { className: 'entry-actions' },
	      renderButtons(this.props)
	    ) : null;
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'info-pane result-card' },
	      _react2.default.createElement(
	        'div',
	        { className: 'container' },
	        _react2.default.createElement(
	          'div',
	          { className: 'entry-header dataset-landing-page-header' },
	          _react2.default.createElement(
	            'div',
	            { className: 'entry-title' },
	            _react2.default.createElement(
	              'h1',
	              { className: 'info-pane-name' },
	              privateIcon,
	              name
	            ),
	            officialBadge,
	            categoryBadge
	          ),
	          buttons
	        ),
	        _react2.default.createElement(
	          'div',
	          { className: 'entry-content' },
	          _react2.default.createElement(
	            'div',
	            { className: 'entry-main' },
	            this.renderDescription(),
	            this.renderFooter()
	          ),
	          this.renderMetadata()
	        )
	      )
	    );
	  }
	});
	
	exports.default = InfoPane;

/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _jquery = __webpack_require__(19);
	
	var _jquery2 = _interopRequireDefault(_jquery);
	
	__webpack_require__(23);
	
	__webpack_require__(3);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	module.exports = function (el, options) {
	  var $el = (0, _jquery2.default)(el);
	  var parent = el.parentElement;
	  var collapsedHeight = null;
	  var originalHeight = parent.getBoundingClientRect().height;
	  var expandedCallback = options.expandedCallback;
	
	  var dotdotdotOptions = {
	    after: '.collapse-toggle.more',
	    watch: true,
	    callback: function callback(isTruncated) {
	      var parentHeight = parent.getBoundingClientRect().height;
	      if (isTruncated && parentHeight !== originalHeight) {
	        parent.dataset.collapsed = true;
	        collapsedHeight = collapsedHeight || parentHeight;
	      } else {
	        var toggles = _lodash2.default.toArray(el.querySelectorAll('.collapse-toggle'));
	        toggles.forEach(function (toggle) {
	          toggle.style.display = 'none';
	        });
	      }
	    }
	  };
	
	  for (var prop in options) {
	    dotdotdotOptions[prop] = options[prop];
	  }
	
	  function collapse() {
	    $el.dotdotdot(dotdotdotOptions);
	  }
	
	  $el.find('.collapse-toggle').click(function (event) {
	    var velocityOptions = {
	      duration: 320,
	      easing: [0.645, 0.045, 0.355, 1]
	    };
	
	    event.preventDefault();
	
	    if (parent.dataset.collapsed) {
	      delete parent.dataset.collapsed;
	
	      // Reset dotdotdot
	      $el.trigger('destroy');
	      el.style.height = 'auto';
	
	      parent.style.height = collapsedHeight + 'px';
	
	      (0, _jquery2.default)(parent).velocity({
	        height: originalHeight
	      }, velocityOptions);
	
	      if (_lodash2.default.isFunction(expandedCallback)) {
	        expandedCallback();
	      }
	    } else {
	      velocityOptions.complete = collapse;
	
	      (0, _jquery2.default)(parent).velocity({
	        height: collapsedHeight
	      }, velocityOptions);
	    }
	  });
	
	  collapse();
	};

/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.ModalFooter = exports.ModalContent = exports.ModalHeader = exports.Modal = undefined;
	
	var _Header = __webpack_require__(51);
	
	Object.defineProperty(exports, 'ModalHeader', {
	  enumerable: true,
	  get: function get() {
	    return _interopRequireDefault(_Header).default;
	  }
	});
	
	var _Content = __webpack_require__(52);
	
	Object.defineProperty(exports, 'ModalContent', {
	  enumerable: true,
	  get: function get() {
	    return _interopRequireDefault(_Content).default;
	  }
	});
	
	var _Footer = __webpack_require__(53);
	
	Object.defineProperty(exports, 'ModalFooter', {
	  enumerable: true,
	  get: function get() {
	    return _interopRequireDefault(_Footer).default;
	  }
	});
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _classnames = __webpack_require__(13);
	
	var _classnames2 = _interopRequireDefault(_classnames);
	
	var _keycodes = __webpack_require__(17);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
	
	var MOBILE_BREAKPOINT = 420;
	
	var Modal = exports.Modal = _react2.default.createClass({
	  displayName: 'Modal',
	
	  propTypes: {
	    children: _react.PropTypes.arrayOf(_react.PropTypes.element),
	    className: _react.PropTypes.string,
	    fullScreen: _react.PropTypes.bool,
	    onDismiss: _react.PropTypes.func.isRequired,
	    overlay: _react.PropTypes.bool
	  },
	
	  getDefaultProps: function getDefaultProps() {
	    return {
	      className: null,
	      fullScreen: false,
	      overlay: true
	    };
	  },
	  getInitialState: function getInitialState() {
	    return this.computeState();
	  },
	  componentDidMount: function componentDidMount() {
	    window.addEventListener('resize', this.checkDimensions);
	    document.documentElement.classList.add('modal-open');
	  },
	  componentWillUnmount: function componentWillUnmount() {
	    window.removeEventListener('resize', this.checkDimensions);
	    document.documentElement.classList.remove('modal-open');
	  },
	  computeState: function computeState() {
	    return {
	      forceFullScreen: window.innerWidth <= MOBILE_BREAKPOINT
	    };
	  },
	  checkDimensions: function checkDimensions() {
	    this.setState(this.computeState());
	  },
	  tryEscDismiss: function tryEscDismiss(event) {
	    var onDismiss = this.props.onDismiss;
	
	    (0, _keycodes.isolateEventByKeys)(event, [_keycodes.ESCAPE]);
	
	    if (event.keyCode === _keycodes.ESCAPE) {
	      onDismiss();
	    }
	  },
	  tryOverlayClickDismiss: function tryOverlayClickDismiss(event) {
	    var onDismiss = this.props.onDismiss;
	
	
	    if (event.target === this.modalElement) {
	      onDismiss();
	    }
	  },
	  render: function render() {
	    var _this = this;
	
	    var _props = this.props;
	    var children = _props.children;
	    var className = _props.className;
	    var fullScreen = _props.fullScreen;
	    var overlay = _props.overlay;
	    var forceFullScreen = this.state.forceFullScreen;
	
	
	    var modalClasses = (0, _classnames2.default)(_defineProperty({
	      modal: true,
	      'modal-overlay': overlay !== false,
	      'modal-full': fullScreen || forceFullScreen
	    }, className, !!className));
	
	    return _react2.default.createElement(
	      'div',
	      {
	        ref: function ref(_ref) {
	          return _this.modalElement = _ref;
	        },
	        className: modalClasses,
	        role: 'dialog',
	        onKeyUp: this.tryEscDismiss,
	        onClick: this.tryOverlayClickDismiss },
	      _react2.default.createElement(
	        'div',
	        { className: 'modal-container' },
	        children
	      )
	    );
	  }
	});
	
	exports.default = Modal;

/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.Header = undefined;
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _classnames = __webpack_require__(13);
	
	var _classnames2 = _interopRequireDefault(_classnames);
	
	var _I18n = __webpack_require__(15);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
	
	var Header = exports.Header = function Header(props) {
	  var children = props.children;
	  var className = props.className;
	  var title = props.title;
	  var onDismiss = props.onDismiss;
	
	
	  var headerClasses = (0, _classnames2.default)(_defineProperty({
	    'modal-header': true
	  }, className, !!className));
	
	  return _react2.default.createElement(
	    'header',
	    { className: headerClasses },
	    _react2.default.createElement(
	      'h1',
	      { className: 'h5 modal-header-title' },
	      title
	    ),
	    children,
	    _react2.default.createElement(
	      'button',
	      {
	        type: 'button',
	        className: 'btn btn-transparent modal-header-dismiss',
	        onClick: onDismiss,
	        'aria-label': (0, _I18n.translate)('modal.aria_close') },
	      _react2.default.createElement('span', { className: 'icon-close-2' })
	    )
	  );
	};
	
	Header.propTypes = {
	  children: _react.PropTypes.node,
	  className: _react.PropTypes.string,
	  title: _react.PropTypes.string,
	  onDismiss: _react.PropTypes.func.isRequired
	};
	
	exports.default = Header;

/***/ },
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.Content = undefined;
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _classnames = __webpack_require__(13);
	
	var _classnames2 = _interopRequireDefault(_classnames);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
	
	var Content = exports.Content = function Content(props) {
	  var children = props.children;
	  var className = props.className;
	
	
	  var contentClasses = (0, _classnames2.default)(_defineProperty({
	    'modal-content': true
	  }, className, !!className));
	
	  return _react2.default.createElement(
	    'section',
	    { className: contentClasses },
	    children
	  );
	};
	
	Content.propTypes = {
	  children: _react.PropTypes.node,
	  className: _react.PropTypes.string
	};
	
	exports.default = Content;

/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.Footer = undefined;
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _classnames = __webpack_require__(13);
	
	var _classnames2 = _interopRequireDefault(_classnames);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
	
	var Footer = exports.Footer = function Footer(props) {
	  var children = props.children;
	  var className = props.className;
	
	
	  var footerClasses = (0, _classnames2.default)(_defineProperty({
	    'modal-footer': true
	  }, className, !!className));
	
	  return _react2.default.createElement(
	    'footer',
	    { className: footerClasses },
	    _react2.default.createElement(
	      'div',
	      { className: 'modal-footer-actions' },
	      children
	    )
	  );
	};
	
	Footer.propTypes = {
	  children: _react.PropTypes.node,
	  className: _react.PropTypes.string
	};
	
	exports.default = Footer;

/***/ }
/******/ ])
});
;
//# sourceMappingURL=socrata-components.js-02227453.map