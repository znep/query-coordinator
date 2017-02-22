(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("velocity-animate"), require("tether-shepherd"), require("lodash"), require("classnames"), require("react"), require("jquery"), require("socrata-utils"), require("dotdotdot"), require("dompurify"), require("react-dom"), require("moment"));
	else if(typeof define === 'function' && define.amd)
		define(["velocity-animate", "tether-shepherd", "lodash", "classnames", "react", "jquery", "socrata-utils", "dotdotdot", "dompurify", "react-dom", "moment"], factory);
	else if(typeof exports === 'object')
		exports["styleguide"] = factory(require("velocity-animate"), require("tether-shepherd"), require("lodash"), require("classnames"), require("react"), require("jquery"), require("socrata-utils"), require("dotdotdot"), require("dompurify"), require("react-dom"), require("moment"));
	else
		root["styleguide"] = factory(root["velocity-animate"], root["tether-shepherd"], root["lodash"], root["classnames"], root["react"], root["jquery"], root["socrata-utils"], root["dotdotdot"], root["dompurify"], root["react-dom"], root["moment"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_3__, __WEBPACK_EXTERNAL_MODULE_10__, __WEBPACK_EXTERNAL_MODULE_12__, __WEBPACK_EXTERNAL_MODULE_13__, __WEBPACK_EXTERNAL_MODULE_14__, __WEBPACK_EXTERNAL_MODULE_19__, __WEBPACK_EXTERNAL_MODULE_20__, __WEBPACK_EXTERNAL_MODULE_23__, __WEBPACK_EXTERNAL_MODULE_25__, __WEBPACK_EXTERNAL_MODULE_151__, __WEBPACK_EXTERNAL_MODULE_158__) {
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
	
	var _EditBar = __webpack_require__(26);
	
	var _EditBar2 = _interopRequireDefault(_EditBar);
	
	var _ExternalViewCard = __webpack_require__(27);
	
	var _ExternalViewCard2 = _interopRequireDefault(_ExternalViewCard);
	
	var _FilterBar = __webpack_require__(28);
	
	var _FilterBar2 = _interopRequireDefault(_FilterBar);
	
	var _InfoPane = __webpack_require__(179);
	
	var _InfoPane2 = _interopRequireDefault(_InfoPane);
	
	var _Slider = __webpack_require__(165);
	
	var _Slider2 = _interopRequireDefault(_Slider);
	
	var _DateRangePicker = __webpack_require__(156);
	
	var _DateRangePicker2 = _interopRequireDefault(_DateRangePicker);
	
	var _SocrataIcon = __webpack_require__(29);
	
	var _SocrataIcon2 = _interopRequireDefault(_SocrataIcon);
	
	var _Modal3 = __webpack_require__(181);
	
	var _Modal4 = _interopRequireDefault(_Modal3);
	
	var _SideMenu = __webpack_require__(185);
	
	var _SideMenu2 = _interopRequireDefault(_SideMenu);
	
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
	  EditBar: _EditBar2.default,
	  ExternalViewCard: _ExternalViewCard2.default,
	  FilterBar: _FilterBar2.default,
	  InfoPane: _InfoPane2.default,
	  Slider: _Slider2.default,
	  DateRangePicker: _DateRangePicker2.default,
	  Modal: _Modal4.default,
	  ModalHeader: _Modal3.ModalHeader,
	  ModalContent: _Modal3.ModalContent,
	  ModalFooter: _Modal3.ModalFooter,
	  SocrataIcon: _SocrataIcon2.default,
	  SideMenu: _SideMenu2.default,
	  MenuListItem: _SideMenu.MenuListItem,
	  ExpandableMenuListItem: _SideMenu.ExpandableMenuListItem
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
	
	    var _props = this.props,
	        palette = _props.palette,
	        bucketRevealDirection = _props.bucketRevealDirection;
	    var _state = this.state,
	        selectedColor = _state.selectedColor,
	        showingBuckets = _state.showingBuckets;
	
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
	        _react2.default.createElement('span', { className: 'socrata-icon-arrow-down' })
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
	/* eslint-disable max-len */
	
	exports.default = {
	  color_picker: {
	    open_color_picker: 'Open Color Picker',
	    pickable_color: 'Pickable color',
	    with_currently_selected_color: 'with currently selected color'
	  },
	  filter_bar: {
	    add_filter: 'Add Filter',
	    apply: 'Apply',
	    cancel: 'Cancel',
	    clear: 'Clear',
	    config: {
	      hidden_label: 'Hidden',
	      hidden_description: 'Viewers can\'t see this filter, even when applied.',
	      viewers_can_edit_label: 'Viewers Can Edit',
	      viewers_can_edit_description: 'Viewers can see and change the values of this filter.'
	    },
	    configure_filter: 'Configure Filter',
	    filter: 'Filter:',
	    from: 'From',
	    less: 'Less',
	    more: 'More',
	    no_options_found: 'No top values match your input',
	    remove_filter: 'Remove Filter',
	    search: 'Search options',
	    text_filter: {
	      no_value: '(No value)',
	      selected_values: 'Selected Values',
	      suggested_values: 'Top Values',
	      is: 'is',
	      is_not: 'is not',
	      keyword_not_found: "Your input wasn't found in this column's data. Please try again with the exact value including case."
	    },
	    to: 'To'
	  },
	  info_pane: {
	    less: 'Less',
	    more: 'More',
	    official: 'Official',
	    community: 'Community',
	    private_notice: 'This view is private'
	  },
	  menu: {
	    aria_close: 'Close menu'
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
	exports.isolateEventByKeys = exports.isOneOfKeys = exports.SPACE = exports.ESCAPE = exports.ENTER = exports.DOWN = exports.UP = undefined;
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var UP = exports.UP = 38;
	var DOWN = exports.DOWN = 40;
	var ENTER = exports.ENTER = 13;
	var ESCAPE = exports.ESCAPE = 27;
	var SPACE = exports.SPACE = 32;
	
	/**
	 * Determine if the last-pressed key is within
	 * the array of keys
	 */
	var isOneOfKeys = exports.isOneOfKeys = function isOneOfKeys(event, keys) {
	  return _lodash2.default.includes(keys, event.keyCode);
	};
	
	/**
	 * Don't bubble up or run default keystrokes
	 * if the last-pressed key is within the array of keys.
	 */
	var isolateEventByKeys = exports.isolateEventByKeys = function isolateEventByKeys(event, keys) {
	  if (isOneOfKeys(event, keys)) {
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
	      onSelection: _lodash2.default.noop
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
	    (0, _keycodes.isolateEventByKeys)(event, [_keycodes.DOWN, _keycodes.SPACE]);
	  },
	  onKeyUpPlaceholder: function onKeyUpPlaceholder(event) {
	    (0, _keycodes.isolateEventByKeys)(event, [_keycodes.DOWN, _keycodes.SPACE]);
	
	    if ((0, _keycodes.isOneOfKeys)(event, [_keycodes.ESCAPE])) {
	      this.onBlurPlaceholder();
	    } else if ((0, _keycodes.isOneOfKeys)(event, [_keycodes.DOWN, _keycodes.SPACE])) {
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
	    this.setState({ selectedOption: selectedOption, focused: true, opened: false });
	  },
	  getSelectedOption: function getSelectedOption(props) {
	    var value = props.value,
	        options = props.options;
	
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
	      } else if (this.optionsRef.style.height !== 'auto') {
	        this.optionsRef.style.height = 'auto';
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
	      }),
	      role: 'button'
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
	
	    var _props = this.props,
	        disabled = _props.disabled,
	        options = _props.options,
	        id = _props.id;
	    var _state = this.state,
	        focused = _state.focused,
	        opened = _state.opened,
	        selectedOption = _state.selectedOption;
	
	    var value = _lodash2.default.get(selectedOption, 'value', null);
	
	    var dropdownAttributes = {
	      id: id,
	      ref: function ref(_ref2) {
	        return _this3.dropdownRef = _ref2;
	      },
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
	    // Calls a function after user navigation.
	    onChange: _react2.default.PropTypes.func,
	    onFocus: _react2.default.PropTypes.func,
	    onBlur: _react2.default.PropTypes.func
	  },
	
	  getDefaultProps: function getDefaultProps() {
	    return {
	      disabled: false,
	      options: [],
	      onSelection: _lodash2.default.noop,
	      onChange: _lodash2.default.noop,
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
	    var _props = this.props,
	        disabled = _props.disabled,
	        onSelection = _props.onSelection;
	
	
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
	      case _keycodes.ENTER:
	      case _keycodes.SPACE:
	        if (!_lodash2.default.isUndefined(this.state.selectedOption)) {
	          onSelection(this.state.selectedOption);
	        }
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
	    (0, _keycodes.isolateEventByKeys)(event, [_keycodes.UP, _keycodes.DOWN, _keycodes.ENTER, _keycodes.SPACE]);
	
	    this.onKeyUpSelection(event);
	    this.onKeyUpBlur(event);
	  },
	  onKeyDown: function onKeyDown(event) {
	    (0, _keycodes.isolateEventByKeys)(event, [_keycodes.UP, _keycodes.DOWN, _keycodes.ENTER, _keycodes.SPACE]);
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
	    var options = props.options,
	        value = props.value;
	
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
	  setChangedOption: function setChangedOption(selectedOption) {
	    this.setState({ selectedOption: selectedOption });
	    this.props.onChange(selectedOption);
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
	
	    var _state = this.state,
	        selectedOption = _state.selectedOption,
	        selectedIndex = _state.selectedIndex;
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
	    this.setChangedOption(newSelectedOption);
	    this.setScrollPositionToOption(newIndex);
	  },
	  renderOption: function renderOption(option, index) {
	    var selectedOption = this.state.selectedOption;
	
	    var hasRenderFunction = _lodash2.default.isFunction(option.render);
	    var onClickOptionBound = this.onClickOption.bind(this, option);
	    var isSelected = _lodash2.default.isEqual(selectedOption, option);
	    var optionClasses = (0, _classnames2.default)('picklist-option', {
	      'picklist-option-selected': isSelected
	    });
	
	    var attributes = {
	      className: optionClasses,
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
	    var _props2 = this.props,
	        disabled = _props2.disabled,
	        options = _props2.options,
	        id = _props2.id;
	    var _state2 = this.state,
	        focused = _state2.focused,
	        selectedOption = _state2.selectedOption,
	        selectedIndex = _state2.selectedIndex;
	
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
	
	    var _props = this.props,
	        description = _props.description,
	        icon = _props.icon,
	        imageUrl = _props.imageUrl,
	        isPrivate = _props.isPrivate,
	        linkProps = _props.linkProps,
	        metadataLeft = _props.metadataLeft,
	        metadataRight = _props.metadataRight,
	        name = _props.name,
	        onClick = _props.onClick,
	        url = _props.url;
	
	
	    var privateIcon = isPrivate ? _react2.default.createElement('span', { className: 'icon socrata-icon-private' }) : null;
	
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
	exports.EditBar = undefined;
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	/**
	 * The EditBar is a component designed to render a basic Edit Bar. It renders a simple black bar
	 * with a menu button (with its own click handler, to be used, for instance, to trigger opening a
	 * sidebar), an automatically ellipsified title, and an area to render custom elements.
	 */
	var EditBar = exports.EditBar = function EditBar(props) {
	  var name = props.name,
	      menuIcon = props.menuIcon,
	      menuLabel = props.menuLabel,
	      onClickMenu = props.onClickMenu,
	      children = props.children;
	
	
	  var menuClasses = 'btn-menu ' + (menuIcon || 'socrata-icon-cards');
	  var pageName = name ? _react2.default.createElement(
	    'span',
	    { className: 'page-name' },
	    name
	  ) : null;
	
	  return _react2.default.createElement(
	    'nav',
	    { className: 'edit-bar' },
	    _react2.default.createElement('button', { className: menuClasses, onClick: onClickMenu, 'aria-label': menuLabel }),
	    pageName,
	    children
	  );
	};
	
	EditBar.propTypes = {
	  /**
	   * The name displayed, bolded, next to the menu button.
	   */
	  name: _react.PropTypes.string,
	
	  /**
	   * The class of the icon to display in the menu button.
	   */
	  menuIcon: _react.PropTypes.string,
	
	  /**
	   * The aria label to use for the menu button.
	   */
	  menuLabel: _react.PropTypes.string,
	
	  /**
	   * The click handler for the menu button.
	   */
	  onClickMenu: _react.PropTypes.func,
	
	  /**
	   * Any children elements you'd like to render. Accessible as a prop or like this:
	   * <EditBar>
	   *   <OtherComponent />
	   * </EditBar>
	   */
	  children: _react.PropTypes.node
	};
	
	exports.default = EditBar;

/***/ },
/* 27 */
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
	      icon: 'socrata-icon-external-square',
	      metadataLeft: (0, _I18n.translate)('view_card.external_content')
	    }, props, {
	      linkProps: linkProps }),
	    props.children
	  );
	};
	
	ExternalViewCard.propTypes = _ViewCard2.default.propTypes;
	
	exports.default = ExternalViewCard;

/***/ },
/* 28 */
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
	
	var _classnames = __webpack_require__(13);
	
	var _classnames2 = _interopRequireDefault(_classnames);
	
	var _I18n = __webpack_require__(15);
	
	var _SocrataIcon = __webpack_require__(29);
	
	var _SocrataIcon2 = _interopRequireDefault(_SocrataIcon);
	
	var _AddFilter = __webpack_require__(150);
	
	var _AddFilter2 = _interopRequireDefault(_AddFilter);
	
	var _FilterItem = __webpack_require__(154);
	
	var _FilterItem2 = _interopRequireDefault(_FilterItem);
	
	var _filters = __webpack_require__(163);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	// These are approximately the dimensions set by our CSS
	var MAX_FILTER_WIDTH = 140;
	var FILTER_CONFIG_TOGGLE_WIDTH = 30;
	
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
	     * The filters prop is an array of filter objects that will be rendered.  Each filter object is
	     * structured according to the VIF specification.  The set of rendered controls will always
	     * reflect the contents of this array.
	     */
	    filters: _react.PropTypes.arrayOf(_react.PropTypes.object),
	
	    /**
	     * Whether to display the filter bar's settings, including the option to add new filters and
	     * individual filter settings. If this is set to true and none of the provided filters are
	     * visible, the FilterBar will not render anything. Defaults to true.
	     *
	     * NOTE: Even if 'isReadOnly' is set to true, the parameters of individual, non-hidden filters
	     * will still be changeable by users.
	     */
	    isReadOnly: _react.PropTypes.bool,
	
	    /**
	     * The onUpdate prop is an optional function that will be called whenever the set of filters has
	     * changed.  This may happen when a filter is added, a filter is removed, or the parameters of a
	     * filter have changed.  The function is passed the new set of filters.  The consumer of this
	     * component is expected to respond to the event by rerendering this component with the new
	     * updated "filters" prop.  Any filters that do not have any criteria applied will have a filter
	     * function of "noop".
	     */
	    onUpdate: _react.PropTypes.func,
	
	    /**
	     * This function is supplied a column and a String value.
	     *
	     * The downstream supplier decides whether or not the value is
	     * valid and returns a promise which eventually resolves with the response.
	     *
	     * If the value is not valid, the promise should be rejected. This will
	     * show an error to the user and request a retyping.
	     *
	     * If a function is not supplied, the UI will not allow arbitrary values.
	     */
	    isValidTextFilterColumnValue: _react.PropTypes.func
	  },
	
	  getDefaultProps: function getDefaultProps() {
	    return {
	      filters: [],
	      isReadOnly: true,
	      onUpdate: _lodash2.default.noop
	    };
	  },
	  getInitialState: function getInitialState() {
	    return {
	      isExpanded: false,
	      maxVisibleFilters: 0
	    };
	  },
	  componentDidMount: function componentDidMount() {
	    this.setMaxVisibleFilters();
	
	    window.addEventListener('resize', this.onWindowResize);
	  },
	  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
	    if (nextProps.isReadOnly !== this.props.isReadOnly) {
	      this.setState({
	        isExpanded: false
	      });
	    }
	  },
	  componentDidUpdate: function componentDidUpdate() {
	    this.setMaxVisibleFilters();
	  },
	  componentWillUnmount: function componentWillUnmount() {
	    window.removeEventListener('resize', this.onWindowResize);
	  },
	  onFilterAdd: function onFilterAdd(filter) {
	    var _props = this.props,
	        filters = _props.filters,
	        onUpdate = _props.onUpdate;
	    var maxVisibleFilters = this.state.maxVisibleFilters;
	
	    var newFilters = _lodash2.default.cloneDeep(filters);
	
	    newFilters.unshift(filter);
	    onUpdate(newFilters);
	
	    if (newFilters.length > maxVisibleFilters) {
	      this.setState({
	        isExpanded: true
	      });
	    }
	  },
	  onFilterRemove: function onFilterRemove(index) {
	    var _props2 = this.props,
	        filters = _props2.filters,
	        onUpdate = _props2.onUpdate;
	
	    var newFilters = _lodash2.default.cloneDeep(filters);
	
	    newFilters.splice(index, 1);
	    onUpdate(newFilters);
	  },
	  onFilterUpdate: function onFilterUpdate(filter, index) {
	    var _props3 = this.props,
	        filters = _props3.filters,
	        onUpdate = _props3.onUpdate;
	
	
	    filters.splice(index, 1, filter);
	
	    onUpdate(filters);
	  },
	  onToggleCollapsedFilters: function onToggleCollapsedFilters() {
	    this.setState({
	      isExpanded: !this.state.isExpanded
	    });
	  },
	  onWindowResize: function onWindowResize() {
	    this.setMaxVisibleFilters();
	  },
	  getContainerWidth: function getContainerWidth() {
	    if (!this.container) {
	      return 0;
	    }
	
	    var styles = window.getComputedStyle(this.container);
	    var containerPadding = _lodash2.default.parseInt(styles.paddingLeft) + _lodash2.default.parseInt(styles.paddingRight);
	
	    // Note that clientWidth does not include borders or margin. The FilterBar currently doesn't
	    // have borders, but this could potentially throw our calculations off in the future if a
	    // border is added.
	    return this.container.clientWidth - containerPadding;
	  },
	  getControlsWidth: function getControlsWidth() {
	    var addFilterWidth = this.addFilter ? this.addFilter.offsetWidth : 0;
	    var filterIconWidth = this.filterIcon ? this.filterIcon.offsetWidth : 0;
	    var collapsedFiltersToggleWidth = this.expandControl ? this.expandControl.offsetWidth : 0;
	
	    return addFilterWidth + filterIconWidth + collapsedFiltersToggleWidth;
	  },
	  getRenderableFilters: function getRenderableFilters() {
	    var _props4 = this.props,
	        isReadOnly = _props4.isReadOnly,
	        filters = _props4.filters;
	
	
	    return _lodash2.default.reject(filters, function (filter) {
	      return isReadOnly && filter.isHidden;
	    });
	  },
	  setMaxVisibleFilters: function setMaxVisibleFilters() {
	    var isReadOnly = this.props.isReadOnly;
	    var maxVisibleFilters = this.state.maxVisibleFilters;
	
	    var containerWidth = this.getContainerWidth();
	    var spaceLeftForFilters = containerWidth - this.getControlsWidth();
	    var filterWidth = isReadOnly ? MAX_FILTER_WIDTH : MAX_FILTER_WIDTH + FILTER_CONFIG_TOGGLE_WIDTH;
	    var newMaxVisibleFilters = _lodash2.default.floor(spaceLeftForFilters / filterWidth);
	
	    if (containerWidth > 0 && maxVisibleFilters !== newMaxVisibleFilters) {
	      this.setState({
	        maxVisibleFilters: newMaxVisibleFilters
	      });
	    }
	  },
	  renderAddFilter: function renderAddFilter() {
	    var _this = this;
	
	    var _props5 = this.props,
	        columns = _props5.columns,
	        filters = _props5.filters,
	        isReadOnly = _props5.isReadOnly;
	
	
	    var availableColumns = _lodash2.default.reject(columns, function (column) {
	      return _lodash2.default.find(filters, ['columnName', column.fieldName]);
	    });
	
	    var props = {
	      columns: availableColumns,
	      onClickColumn: function onClickColumn(column) {
	        _this.onFilterAdd((0, _filters.getDefaultFilterForColumn)(column));
	      }
	    };
	
	    // FIXME Put styles in the tests and make the span a div
	    return isReadOnly ? null : _react2.default.createElement(
	      'span',
	      { className: 'add-filter-container', ref: function ref(_ref) {
	          return _this.addFilter = _ref;
	        } },
	      _react2.default.createElement(_AddFilter2.default, props)
	    );
	  },
	  renderFilterIcon: function renderFilterIcon() {
	    var _this2 = this;
	
	    var isReadOnly = this.props.isReadOnly;
	
	
	    var icon = _react2.default.createElement(
	      'div',
	      { className: 'filter-icon', ref: function ref(_ref2) {
	          return _this2.filterIcon = _ref2;
	        } },
	      _react2.default.createElement(_SocrataIcon2.default, { name: 'filter' })
	    );
	
	    return isReadOnly ? icon : null;
	  },
	  renderExpandControl: function renderExpandControl() {
	    var _this3 = this;
	
	    var _state = this.state,
	        isExpanded = _state.isExpanded,
	        maxVisibleFilters = _state.maxVisibleFilters;
	
	    var renderableFilters = this.getRenderableFilters();
	
	    var text = isExpanded ? (0, _I18n.translate)('filter_bar.less') : (0, _I18n.translate)('filter_bar.more');
	    var classes = (0, _classnames2.default)('btn btn-transparent btn-expand-control', {
	      'is-hidden': _lodash2.default.size(renderableFilters) <= maxVisibleFilters
	    });
	
	    return _react2.default.createElement(
	      'button',
	      {
	        className: classes,
	        onClick: this.onToggleCollapsedFilters,
	        ref: function ref(_ref3) {
	          return _this3.expandControl = _ref3;
	        } },
	      text
	    );
	  },
	  renderVisibleFilters: function renderVisibleFilters(filterItems) {
	    var maxVisibleFilters = this.state.maxVisibleFilters;
	
	    var filters = _lodash2.default.take(filterItems, maxVisibleFilters);
	
	    return _lodash2.default.isEmpty(filters) ? null : _react2.default.createElement(
	      'div',
	      { className: 'visible-filters-container' },
	      filters
	    );
	  },
	  renderCollapsedFilters: function renderCollapsedFilters(filterItems) {
	    var maxVisibleFilters = this.state.maxVisibleFilters;
	
	    var filters = _lodash2.default.drop(filterItems, maxVisibleFilters);
	
	    return _lodash2.default.isEmpty(filters) ? null : _react2.default.createElement(
	      'div',
	      { className: 'collapsed-filters-container' },
	      filters
	    );
	  },
	  render: function render() {
	    var _this4 = this;
	
	    var _props6 = this.props,
	        columns = _props6.columns,
	        isReadOnly = _props6.isReadOnly,
	        isValidTextFilterColumnValue = _props6.isValidTextFilterColumnValue;
	    var isExpanded = this.state.isExpanded;
	
	    var renderableFilters = this.getRenderableFilters();
	
	    if (isReadOnly && _lodash2.default.isEmpty(renderableFilters)) {
	      return null;
	    }
	
	    var filterItems = _lodash2.default.map(renderableFilters, function (filter, index) {
	      var column = _lodash2.default.find(columns, { fieldName: filter.columnName });
	      var props = {
	        column: column,
	        filter: filter,
	        isReadOnly: isReadOnly,
	        onUpdate: _lodash2.default.partialRight(_this4.onFilterUpdate, index),
	        onRemove: _lodash2.default.partial(_this4.onFilterRemove, index),
	        isValidTextFilterColumnValue: isValidTextFilterColumnValue
	      };
	
	      return _react2.default.createElement(_FilterItem2.default, _extends({ key: index }, props));
	    });
	
	    var containerProps = {
	      className: (0, _classnames2.default)('filter-bar-container', {
	        'filter-bar-expanded': isExpanded
	      }),
	      ref: function ref(_ref4) {
	        return _this4.container = _ref4;
	      }
	    };
	
	    return _react2.default.createElement(
	      'div',
	      containerProps,
	      this.renderFilterIcon(),
	      this.renderAddFilter(),
	      this.renderVisibleFilters(filterItems),
	      this.renderCollapsedFilters(filterItems),
	      this.renderExpandControl()
	    );
	  }
	});
	
	exports.default = FilterBar;

/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.SocrataIcon = SocrataIcon;
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function SocrataIcon(_ref) {
	  var name = _ref.name;
	
	  var attributes = {
	    className: 'socrata-icon socrata-icon-' + name,
	    dangerouslySetInnerHTML: {
	      __html: __webpack_require__(30)("./" + name + '.svg') // eslint-disable-line global-require
	    }
	  };
	
	  return _react2.default.createElement('span', attributes);
	}
	
	SocrataIcon.propTypes = {
	  name: _react.PropTypes.string.isRequired
	};
	
	exports.default = SocrataIcon;

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	var map = {
		"./add-collaborator.svg": 31,
		"./add.svg": 32,
		"./arrow-down.svg": 33,
		"./arrow-left.svg": 34,
		"./arrow-next.svg": 35,
		"./arrow-prev.svg": 36,
		"./arrow-right.svg": 37,
		"./arrow-up.svg": 38,
		"./axis-scale.svg": 39,
		"./bar-chart-horz.svg": 40,
		"./bar-chart.svg": 41,
		"./bold2.svg": 42,
		"./boolean.svg": 43,
		"./cards.svg": 44,
		"./chart.svg": 45,
		"./check-2.svg": 46,
		"./check.svg": 47,
		"./checkmark-alt.svg": 48,
		"./checkmark3.svg": 49,
		"./chevron-down.svg": 50,
		"./chevron-up.svg": 51,
		"./clear-formatting.svg": 52,
		"./close-2.svg": 53,
		"./close-circle.svg": 54,
		"./close.svg": 55,
		"./collapse.svg": 56,
		"./color.svg": 57,
		"./column-info.svg": 58,
		"./community.svg": 59,
		"./copy-document.svg": 60,
		"./crop.svg": 61,
		"./cross2.svg": 62,
		"./data.svg": 63,
		"./dataset.svg": 64,
		"./date.svg": 65,
		"./distribution.svg": 66,
		"./download.svg": 67,
		"./droplet.svg": 68,
		"./edit.svg": 69,
		"./email.svg": 70,
		"./embed.svg": 71,
		"./expand.svg": 72,
		"./external-square.svg": 73,
		"./external.svg": 74,
		"./eye-blocked.svg": 75,
		"./eye.svg": 76,
		"./facebook.svg": 77,
		"./failed.svg": 78,
		"./featured.svg": 79,
		"./filter.svg": 80,
		"./flyout-options.svg": 81,
		"./geo.svg": 82,
		"./goal.svg": 83,
		"./google.svg": 84,
		"./gte.svg": 85,
		"./hamburger.svg": 86,
		"./image.svg": 87,
		"./info-inverse.svg": 88,
		"./info.svg": 89,
		"./italic2.svg": 90,
		"./kebab.svg": 91,
		"./layout-inline.svg": 92,
		"./layout-pop-out.svg": 93,
		"./line-chart.svg": 94,
		"./link.svg": 95,
		"./linked.svg": 96,
		"./list-numbered.svg": 97,
		"./list2.svg": 98,
		"./lte.svg": 99,
		"./map.svg": 100,
		"./move-vertical.svg": 101,
		"./move.svg": 102,
		"./number.svg": 103,
		"./official.svg": 104,
		"./official2.svg": 105,
		"./paragraph-center3.svg": 106,
		"./paragraph-left.svg": 107,
		"./paragraph-left3.svg": 108,
		"./paragraph-right3.svg": 109,
		"./pause.svg": 110,
		"./pie-chart.svg": 111,
		"./play.svg": 112,
		"./plus2.svg": 113,
		"./plus3.svg": 114,
		"./presentation.svg": 115,
		"./preview.svg": 116,
		"./print.svg": 117,
		"./private.svg": 118,
		"./processing.svg": 119,
		"./pulse.svg": 120,
		"./puzzle.svg": 121,
		"./question-inverse.svg": 122,
		"./question.svg": 123,
		"./quotes-left.svg": 124,
		"./redo.svg": 125,
		"./region.svg": 126,
		"./search.svg": 127,
		"./settings.svg": 128,
		"./share.svg": 129,
		"./sign-out.svg": 130,
		"./sort-asc.svg": 131,
		"./sort-az.svg": 132,
		"./sort-desc.svg": 133,
		"./sort-za.svg": 134,
		"./stories-icon.svg": 135,
		"./stories-menu.svg": 136,
		"./story.svg": 137,
		"./table.svg": 138,
		"./tag.svg": 139,
		"./text.svg": 140,
		"./twitter.svg": 141,
		"./undo.svg": 142,
		"./user.svg": 143,
		"./waiting.svg": 144,
		"./warning-alt.svg": 145,
		"./warning-alt2.svg": 146,
		"./warning.svg": 147,
		"./windows.svg": 148,
		"./yahoo.svg": 149
	};
	function webpackContext(req) {
		return __webpack_require__(webpackContextResolve(req));
	};
	function webpackContextResolve(req) {
		return map[req] || (function() { throw new Error("Cannot find module '" + req + "'.") }());
	};
	webpackContext.keys = function webpackContextKeys() {
		return Object.keys(map);
	};
	webpackContext.resolve = webpackContextResolve;
	module.exports = webpackContext;
	webpackContext.id = 30;


/***/ },
/* 31 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>add-collaborator</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"add-collaborator\" fill=\"#000000\">\n            <path d=\"M846.558265,729.983661 L735.444506,729.983661 L735.444506,840.793871 L679.887626,840.793871 L679.887626,729.983661 L568.773868,729.983661 L568.773868,674.578556 L679.887626,674.578556 L679.887626,563.768347 L735.444506,563.768347 L735.444506,674.578556 L846.558265,674.578556 L846.558265,729.983661 L846.558265,729.983661 Z M707.666066,452.958137 C569.662778,452.958137 457.660109,564.599423 457.660109,702.281109 C457.660109,839.962794 569.662778,951.60408 707.666066,951.60408 C845.780469,951.60408 957.672024,839.962794 957.672024,702.281109 C957.672024,564.599423 845.780469,452.958137 707.666066,452.958137 L707.666066,452.958137 L707.666066,452.958137 L707.666066,452.958137 L707.666066,452.958137 Z\" id=\"Shape\"></path>\n            <path d=\"M398.227168,791.569576 L120.44277,791.569576 L120.44277,717.659166 C139.554337,706.41193 173.49959,689.956614 200.111336,677.158034 C322.892039,617.652952 398.227168,577.927492 398.227168,513.76838 C398.227168,473.71049 373.726584,449.830889 354.059449,430.660723 C325.836554,403.124386 287.113409,365.448915 287.113409,237.186097 C287.113409,171.974289 375.004392,126.542103 453.784047,126.542103 C532.674816,126.542103 620.454686,171.974289 620.454686,237.186097 C620.454686,365.448915 581.842654,403.124386 553.61976,430.660723 C545.119557,438.860679 536.119343,448.279547 528.230266,459.028137 L603.509837,459.028137 C635.621714,426.228315 676.011565,372.540768 676.011565,237.186097 C676.011565,133.633957 557.842083,71.1924035 453.784047,71.1924035 C349.837126,71.1924035 231.556529,133.633957 231.556529,237.186097 C231.556529,461.465961 342.670288,462.020012 342.670288,513.76838 C342.670288,569.11808 89.1642473,653.88789 64.885891,691.563362 L64.885891,846.86387 L398.227168,846.86387 L398.227168,791.569576 L398.227168,791.569576 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 32 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>add</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"add\" fill=\"#000000\">\n            <polygon id=\"Shape\" points=\"587.971839 97.288 587.971839 437.15869 914.128448 437.15869 914.128448 583.839724 587.971839 583.839724 587.971839 927.288 435.328161 927.288 435.328161 583.839724 109.171552 583.839724 109.171552 437.15869 435.328161 437.15869 435.328161 97.288 587.971839 97.288\"></polygon>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 33 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>arrow-down</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"arrow-down\" fill=\"#000000\">\n            <polygon id=\"Shape\" points=\"972 310.5 914.5 253 512 655.5 109.5 253 52 310.5 511.998203 770.5\"></polygon>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 34 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>arrow-left</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"arrow-left\" fill=\"#000000\">\n            <polygon id=\"Shape\" points=\"711.619048 972 768.571429 914.5 369.904762 512 768.571429 109.5 711.619048 52 256 511.998203\"></polygon>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 35 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>arrow-next</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"arrow-next\" fill=\"#000000\">\n            <path d=\"M614.913659,855.770903 L916.342399,554.342163 C939.885867,530.800579 939.885867,492.628397 916.342399,469.084928 L614.913659,167.656188 C591.37019,144.114604 553.199892,144.114604 529.656424,167.656188 C506.112955,191.199657 506.112955,229.369955 529.656424,252.913424 L728.17174,451.42874 L150.285748,451.42874 C116.99106,451.42874 90,478.419799 90,511.714488 C90,545.009176 116.99106,572.000235 150.285748,572.000235 L728.17174,572.000235 L529.656424,770.515552 C517.885632,782.286344 512.000235,797.715728 512.000235,813.143227 C512.000235,828.570727 517.885632,844.00011 529.656424,855.770903 C553.199892,879.314371 591.37019,879.314371 614.913659,855.770903 L614.913659,855.770903 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 36 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>arrow-prev</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"arrow-prev\" fill=\"#000000\">\n            <path d=\"M409.086341,855.770903 L107.657601,554.342163 C84.1141329,530.800579 84.1141329,492.628397 107.657601,469.084928 L409.086341,167.656188 C432.62981,144.114604 470.800108,144.114604 494.343576,167.656188 C517.887045,191.199657 517.887045,229.369955 494.343576,252.913424 L295.82826,451.42874 L873.714252,451.42874 C907.00894,451.42874 934,478.419799 934,511.714488 C934,545.009176 907.00894,572.000235 873.714252,572.000235 L295.82826,572.000235 L494.343576,770.515552 C506.114368,782.286344 511.999765,797.715728 511.999765,813.143227 C511.999765,828.570727 506.114368,844.00011 494.343576,855.770903 C470.800108,879.314371 432.62981,879.314371 409.086341,855.770903 L409.086341,855.770903 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 37 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>arrow-right</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"arrow-right\" fill=\"#000000\">\n            <polygon id=\"Shape\" points=\"310.5 52 253 109.5 655.5 512 253 914.5 310.5 972 770.5 512.001797\"></polygon>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 38 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>arrow-up</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"arrow-up\" fill=\"#000000\">\n            <polygon id=\"Shape\" points=\"52 713 109.5 770.5 512 368 914.5 770.5 972 713 512.001797 253\"></polygon>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 39 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 40.3 (33839) - http://www.bohemiancoding.com/sketch -->\n    <title>axis-scale</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"axis-scale\" fill=\"#000000\">\n            <path d=\"M490.7887,575.74435 L723.94435,342.5887 L723.94435,438.4 L798.04435,438.4 L798.04435,216.1 L575.74435,216.1 L575.74435,290.2 L671.55565,290.2 L438.4,523.35565 L490.7887,575.74435 Z M142,883 L142,142 L290.2,142 L290.2,216.1 L216.1,216.1 L216.1,290.2 L290.2,290.2 L290.2,364.3 L216.1,364.3 L216.1,438.4 L290.2,438.4 L290.2,512.5 L216.1,512.5 L216.1,586.6 L290.2,586.6 L290.2,660.7 L216.1,660.7 L216.1,808.9 L364.3,808.9 L364.3,734.8 L438.4,734.8 L438.4,808.9 L512.5,808.9 L512.5,734.8 L586.6,734.8 L586.6,808.9 L660.7,808.9 L660.7,734.8 L734.8,734.8 L734.8,808.9 L808.9,808.9 L808.9,734.8 L883,734.8 L883,808.9 L883,883 L142,883 Z\" id=\"Combined-Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 40 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.8.3 (29802) - http://www.bohemiancoding.com/sketch -->\n    <title>bar-chart-horz</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"bar-chart-horz\" fill=\"#000000\">\n            <path d=\"M72,955 L72,735 L512,735 L512,955 L72,955 L72,955 L72,955 L72,955 Z M72,295 L72,75 L952,75 L952,295 L72,295 L72,295 L72,295 L72,295 Z M787,625 L72,625 L72,405 L787,405 L787,625 L787,625 L787,625 L787,625 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 41 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.8.3 (29802) - http://www.bohemiancoding.com/sketch -->\n    <title>bar-chart</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"bar-chart\" fill=\"#000000\">\n            <path d=\"M72,952 L292,952 L292,512 L72,512 L72,952 L72,952 L72,952 Z M402,952 L622,952 L622,72 L402,72 L402,952 L402,952 L402,952 Z M732,237 L732,952 L952,952 L952,237 L732,237 L732,237 L732,237 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 42 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>bold2</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"bold2\" fill=\"#000000\">\n            <path d=\"M707.304241,485.182522 C744.760391,440.690234 767.357143,383.288371 767.357143,320.714286 C767.357143,179.71183 652.643315,65 511.642857,65 L192,65 L192,960 L575.571429,960 C716.571886,960 831.285714,845.286172 831.285714,704.285714 C831.285714,611.43346 781.543292,529.984464 707.304241,485.182522 L707.304241,485.182522 Z M383.785714,192.857143 L485.172433,192.857143 C541.077969,192.857143 586.559152,250.213058 586.559152,320.714286 C586.559152,391.215513 541.077969,448.571429 485.172433,448.571429 L383.785714,448.571429 L383.785714,192.857143 L383.785714,192.857143 Z M542.608259,832.142857 L383.785714,832.142857 L383.785714,576.428571 L542.608259,576.428571 C600.993025,576.428571 648.489955,633.784487 648.489955,704.285714 C648.489955,774.786942 600.993025,832.142857 542.608259,832.142857 L542.608259,832.142857 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 43 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 42 (36781) - http://www.bohemiancoding.com/sketch -->\n    <title>boolean</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"boolean\" fill=\"#000000\">\n            <path d=\"M542.5,341 L937,341 L937,697 L542.5,697 L92,697 L92,341 L542.5,341 Z M542,391.73 L542,646.27 L880.7125,646.27 L880.7125,391.73 L542,391.73 Z\" id=\"Combined-Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 44 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>cards</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"cards\" fill=\"#000000\">\n            <path d=\"M541.375,982 L982,982 L982,541.375 L541.375,541.375 L541.375,982 L541.375,982 Z M761.6875,616.28125 C821.90625,616.28125 871.84375,666.21875 871.84375,726.4375 C871.84375,799.875 761.6875,910.03125 761.6875,910.03125 C761.6875,910.03125 651.53125,799.875 651.53125,726.4375 C651.53125,666.21875 701.46875,616.28125 761.6875,616.28125 L761.6875,616.28125 Z M816.03125,726.4375 C816.03125,756.450488 791.700488,780.78125 761.6875,780.78125 C731.674512,780.78125 707.34375,756.450488 707.34375,726.4375 C707.34375,696.424512 731.674512,672.09375 761.6875,672.09375 C791.700488,672.09375 816.03125,696.424512 816.03125,726.4375 L816.03125,726.4375 Z M42,42 L42,482.625 L982,482.625 L982,42 L42,42 L42,42 Z M369.53125,379.8125 L188.875,379.8125 L188.875,266.71875 L369.53125,266.71875 L369.53125,379.8125 L369.53125,379.8125 Z M601.59375,379.8125 L422.40625,379.8125 L422.40625,144.8125 L603.0625,144.8125 L603.0625,379.8125 L601.59375,379.8125 Z M835.125,379.8125 L654.46875,379.8125 L654.46875,210.90625 L835.125,210.90625 L835.125,379.8125 L835.125,379.8125 Z M42,982 L482.625,982 L482.625,541.375 L42,541.375 L42,982 L42,982 Z M262.3125,614.8125 L262.3125,761.6875 L366.59375,657.40625 C393.03125,683.84375 409.1875,720.5625 409.1875,761.6875 C409.1875,842.46875 343.09375,908.5625 262.3125,908.5625 C181.53125,908.5625 115.4375,842.46875 115.4375,761.6875 C115.4375,680.90625 181.53125,614.8125 262.3125,614.8125 L262.3125,614.8125 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 45 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>chart</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"chart\" fill=\"#000000\">\n            <path d=\"M159.5,42 L159.5,159.5 L42,159.5 L42,982 L864.5,982 L864.5,864.5 L982,864.5 L982,42 L159.5,42 L159.5,42 Z M277,864.5 L159.5,864.5 L159.5,277 L277,277 L277,864.5 L277,864.5 Z M512,864.5 L394.5,864.5 L394.5,629.5 L512,629.5 L512,864.5 L512,864.5 Z M747,864.5 L629.5,864.5 L629.5,453.25 L747,453.25 L747,864.5 L747,864.5 Z M923.25,805.75 L864.5,805.75 L864.5,159.5 L218.25,159.5 L218.25,100.75 L923.25,100.75 L923.25,805.75 L923.25,805.75 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 46 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>check-2</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"check-2\" fill=\"#000000\">\n            <polygon id=\"Shape\" points=\"390.45965 923.479912 61.0746094 536.388947 198.608632 418.435401 390.45965 645.022939 843.540587 117.009023 981.074609 234.868431 390.45965 923.479912\"></polygon>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 47 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>check</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"check\" fill=\"#000000\">\n            <path d=\"M411.058466,870.807246 C406.567741,873.900857 402.575984,876.196117 397.187114,876.196117 C391.798243,876.196117 387.806487,874.000651 383.315761,870.807246 L57.6882525,544.880356 C50.1039158,537.695195 50.1039158,524.721987 57.6882525,517.536826 L191.911053,383.314025 C199.096214,376.128864 212.069422,376.128864 219.254583,383.314025 L397.08732,561.945113 L804.745417,153.388871 C811.930578,146.20371 824.903786,146.20371 832.088947,153.388871 L966.311747,287.611672 C973.896084,294.796833 973.896084,307.77004 966.311747,314.955201 L411.058466,870.807246 L411.058466,870.807246 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 48 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\" >\n<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" viewBox=\"0 0 1024 1024\">\n  <g transform=\"matrix(1 0 0 -1 0 819)\">\n   <path fill=\"currentColor\"\nd=\"M510.5 -53.5c226.437 0 410 183.563 410 410c0 226.437 -183.563 410 -410 410c-226.437 0 -410 -183.563 -410 -410c0 -226.437 183.563 -410 410 -410zM718.346 577.269l54.6325 -54.8549l-364.217 -365.699l-182.108 182.85l54.6325 54.8549l127.476 -127.995z\" />\n  </g>\n\n</svg>\n"

/***/ },
/* 49 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>checkmark3</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"checkmark3\" fill=\"#000000\">\n            <polygon id=\"Shape\" points=\"880 159 358.666667 680.333333 144 465.666667 52 557.666667 358.666667 864.333333 972 251\"></polygon>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 50 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>chevron-down</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"chevron-down\" fill=\"#000000\">\n            <polygon id=\"Shape\" points=\"850.084727 221 512 559.084727 173.915273 221 52 343.065312 512 803.065312 972 343.065312\"></polygon>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 51 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>chevron-up</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"chevron-up\" fill=\"#000000\">\n            <polygon id=\"Shape\" points=\"173.915273 803.065312 512 464.980586 850.084727 803.065312 972 681 512 221 52 681\"></polygon>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 52 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>clear-formatting</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"clear-formatting\" fill=\"#000000\">\n            <path d=\"M78,848.125 L581.4375,848.125 L581.4375,960 L78,960 L78,848.125 Z M861.125,176.875 L596.680469,176.875 L436.066426,792.1875 L320.443613,792.1875 L481.055908,176.875 L245.8125,176.875 L245.8125,65 L861.125,65 L861.125,176.875 Z M890.644268,960 L777.21875,846.574482 L663.793232,960 L609.40625,905.613018 L722.831768,792.1875 L609.40625,678.761982 L663.793232,624.375 L777.21875,737.800518 L890.644268,624.375 L945.03125,678.761982 L831.605732,792.1875 L945.03125,905.613018 L890.644268,960 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 53 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>close-2</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"close-2\" fill=\"#000000\">\n            <polygon id=\"Shape\" points=\"972 111.485944 912.514056 52 512 452.514056 111.485944 52 52 111.485944 452.514056 512 52 912.514056 111.485944 972 512 571.485944 912.514056 972 972 912.514056 571.485944 512\"></polygon>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 54 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>close-circle</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"close-circle\" fill=\"#000000\">\n            <path d=\"M512,102 C285.601594,102 102,285.601594 102,512 C102,738.398406 285.601594,922 512,922 C738.398406,922 922,738.398406 922,512 C922,285.601594 738.398406,102 512,102 L512,102 Z M684.575697,745.994024 L512.081673,574.071713 L340.241036,746.565737 L278.005976,684.575697 L449.928287,512.081673 L277.434263,340.241036 L339.424303,278.005976 L511.918327,449.928287 L683.758964,277.434263 L745.994024,339.424303 L574.071713,511.918327 L746.565737,683.758964 L684.575697,745.994024 L684.575697,745.994024 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 55 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>close</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"close\" fill=\"#000000\">\n            <polygon id=\"Shape\" points=\"576.599519 512.185697 753.447731 334.785216 689.425963 271 512.656445 448.400481 335.255964 271.552269 271.470748 335.574037 448.871229 512.343555 272.023018 689.744036 336.044785 753.529252 512.814303 576.128771 690.214784 752.976982 754 688.955215\"></polygon>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 56 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>collapse</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"collapse\" fill=\"#000000\">\n            <path d=\"M454.5,910.1875 L454.5,569.5 L113.8125,569.5 L223.0625,678.75 L52,849.8125 L174.1875,972 L345.25,800.9375 L454.5,910.1875 Z M569.5,113.8125 L569.5,454.5 L910.1875,454.5 L800.9375,345.25 L972,174.1875 L849.8125,52 L678.75,223.0625 L569.5,113.8125 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 57 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 40.3 (33839) - http://www.bohemiancoding.com/sketch -->\n    <title>color</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"color\" fill=\"#000000\">\n            <path d=\"M511.689788,937.08 C353.429788,937.08 224.689788,808.34 224.689788,650.08 C224.689788,508.794 433.543788,199.08 511.689788,85.92 C590.245788,199.654 798.689788,508.917 798.689788,650.08 C798.689788,808.34 669.949788,937.08 511.689788,937.08 L511.689788,937.08 Z M511.689788,231.593 C421.325788,369.517 306.689788,570.786 306.689788,650.08 C306.689788,763.117 398.652788,855.08 511.689788,855.08 C624.726788,855.08 716.689788,763.117 716.689788,650.08 C716.689788,570.786 602.053788,369.476 511.689788,231.593 L511.689788,231.593 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 58 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 42 (36781) - http://www.bohemiancoding.com/sketch -->\n    <title>column-info</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"column-info\" fill=\"#000000\">\n            <polyline id=\"Line-Copy-2\" points=\"307 210.831009 307 155 107 155 107 210.831009 107 840.789245 107 896.620254 307 896.620254 307 840.789245\"></polyline>\n            <path d=\"M581,599.152845 L581,840.789245 L581,896.620254 L381,896.620254 L381,840.789245 L381,210.831009 L381,155 L510.005387,155 C469.865471,207.19857 446,272.562245 446,343.5 C446,449.701678 499.490652,543.409946 581,599.152845 Z\" id=\"Combined-Shape\"></path>\n            <path d=\"M855,636.658842 L855,840.789245 L855,896.620254 L655,896.620254 L655,840.789245 L655,636.317635 C686.511898,647.130594 720.320513,653 755.5,653 C790.307644,653 823.773242,647.254016 855,636.658842 Z\" id=\"Combined-Shape\"></path>\n            <path d=\"M754.591186,598.538119 C613.643001,598.538119 498.985669,480.702971 498.985669,335.848298 C498.985669,191.031153 613.643001,73.1584776 754.591186,73.1584776 C895.53937,73.1584776 1010.1967,191.031153 1010.1967,335.848298 C1010.1967,480.702971 895.53937,598.538119 754.591186,598.538119 Z M754.591186,148.212712 C653.919127,148.212712 572.015817,232.386036 572.015817,335.848298 C572.015817,439.310561 653.919127,523.483885 754.591186,523.483885 C855.263244,523.483885 937.166554,439.310561 937.166554,335.848298 C937.166554,232.386036 855.263244,148.212712 754.591186,148.212712 Z M718.076112,335.848298 L791.106259,335.848298 L791.106259,485.956768 L718.076112,485.956768 L718.076112,335.848298 Z M754.591186,298.321181 C734.424467,298.321181 718.076112,281.519719 718.076112,260.794064 C718.076112,240.068409 734.424467,223.266947 754.591186,223.266947 C774.757904,223.266947 791.106259,240.068409 791.106259,260.794064 C791.106259,281.519719 774.757904,298.321181 754.591186,298.321181 Z\" id=\"Combined-Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 59 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.8.3 (29802) - http://www.bohemiancoding.com/sketch -->\n    <title>community</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <path d=\"M266.409003,685.421718 C251.623991,707.728275 243.415516,732.393525 243.415516,758.33394 L788.457357,758.33394 C788.457357,732.393525 780.2489,707.728275 765.46391,685.421718 L871.0205,685.421722 L871.0205,627.558526 C861.97869,613.520986 767.564205,581.936523 767.564205,561.31398 C767.564205,542.03327 808.946914,541.82676 808.946914,458.262546 C808.946914,419.68006 764.895052,396.415025 726.181495,396.415025 C692.192191,396.415025 654.160261,414.310332 645.32111,444.739423 L645.32111,444.739423 L645.32111,486.788473 C649.740174,516.93343 661.029389,531.324229 670.418671,540.918374 L698.4553,540.918374 C695.51719,536.913621 692.164957,533.404236 688.999367,530.349045 C678.488024,520.089321 664.10759,506.051781 664.10759,458.262546 C664.10759,433.965283 696.800081,417.037568 726.181495,417.037568 C755.521752,417.037568 788.2554,433.965283 788.2554,458.262546 C788.2554,506.051781 773.83349,520.089321 763.322467,530.349045 C755.997771,537.491656 746.87301,546.388801 746.87301,561.31398 C746.87301,585.218971 774.930376,600.020308 820.658195,622.191194 C830.56909,626.959744 843.211671,633.090874 850.329305,637.281485 L850.329305,664.81967 L749.350929,664.81967 C707.997467,619.347938 637.395685,586.938708 554.867919,579.093267 L554.867919,541.758136 C597.752386,513.655289 632.731171,443.593988 632.731171,373.521515 C632.731171,261.007669 632.731171,169.797178 515.936452,169.797178 C399.141797,169.797178 399.141797,261.007669 399.141797,373.521515 C399.141797,443.593988 434.120519,513.655289 477.004986,541.758136 L477.004986,579.093267 C394.477339,586.938708 323.875515,619.347938 282.522005,664.81967 L182.44877,664.81967 L182.44877,637.281485 C189.566595,633.090874 202.208984,626.959744 212.120103,622.191194 C257.847858,600.020308 285.905257,585.218971 285.905257,561.31398 C285.905257,546.388801 276.780399,537.491656 269.455672,530.349045 C258.944489,520.089321 244.522643,506.051781 244.522643,458.262546 C244.522643,433.965283 277.25629,417.037568 306.596548,417.037568 C335.978153,417.037568 368.67042,433.965283 368.67042,458.262546 C368.67042,506.051781 354.289987,520.089321 343.778804,530.349045 C340.613022,533.404236 337.261044,536.913621 334.32287,540.918374 L362.359595,540.918374 C371.748728,531.324151 383.038081,516.933195 387.457093,486.787737 L387.457093,444.739749 L387.457093,444.739749 C378.618123,414.31046 340.586057,396.415025 306.596548,396.415025 C267.88315,396.415025 223.831352,419.68006 223.831352,458.262546 C223.831352,541.82676 265.213934,542.03327 265.213934,561.31398 C265.213934,581.936523 170.799576,613.520986 161.757479,627.558526 L161.757479,685.421722 L266.409,685.421722 Z M826.007667,211.151743 C995.981562,381.195562 995.981562,656.890791 826.007667,826.934577 C656.03441,996.979226 380.453583,996.979226 210.480358,826.934577 C40.506271,656.890791 40.506271,381.195562 210.480358,211.151743 C380.453583,41.1072863 656.03441,41.1072863 826.007667,211.151743 Z\" id=\"Combined-Shape\" fill=\"#000000\"></path>\n        <g id=\"community\"></g>\n    </g>\n</svg>"

/***/ },
/* 60 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>copy-document</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"copy-document\" fill=\"#000000\">\n            <path d=\"M292,72 L292,237.055 L127,237.055 L127,952 L732,952 L732,787.055 L897.055,787.055 L897.055,253.115 L715.94,72 L292,72 L292,72 Z M347,127 L677,127 L677,292.055 L842,292.055 L842,732.055 L347,732.055 L347,127 L347,127 Z M732,165.885 L803.115,237.055 L732,237.055 L732,165.885 L732,165.885 Z M182,292.055 L292,292.055 L292,787.055 L677,787.055 L677,897 L182,897 L182,292.055 L182,292.055 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 61 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.8.3 (29802) - http://www.bohemiancoding.com/sketch -->\n    <title>crop</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"crop\" fill=\"#221F20\">\n            <path d=\"M241.152297,58.5041479 L241.152297,230.893345 L48.236901,230.893345 L48.236901,319.094264 L241.152297,319.094264 L241.152297,793.11495 L694.657808,793.11495 L694.657808,965.504148 L782.847703,965.504148 L782.847703,793.11495 L975.763099,793.11495 L975.763099,704.925055 L782.847703,704.925055 L782.847703,289.164819 L906.225367,165.787155 L859.462675,119.01344 L747.582769,230.893345 L329.342192,230.893345 L329.342192,58.5041479 L241.152297,58.5041479 Z M329.342192,319.094264 L659.392874,319.094264 L329.342192,649.133923 L329.342192,319.094264 Z M694.657808,377.354714 L694.657808,704.925055 L367.09849,704.925055 L694.657808,377.354714 Z\" id=\"path\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 62 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>cross2</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"cross2\" fill=\"#000000\">\n            <polygon id=\"Shape\" points=\"811.343961 283.718961 740.281039 212.656039 512 440.935508 283.718961 212.656039 212.656039 283.717391 440.937078 512 212.656039 740.281039 283.718961 811.343961 512 583.062922 740.281039 811.343961 811.343961 740.279469 583.064492 512\"></polygon>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 63 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>data</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"data\" fill=\"#000000\">\n            <path d=\"M146.189797,397.061149 C174.501225,419.490978 210.787703,438.930163 252.955781,454.780575 C325.229673,481.895745 414.74961,498.045222 512.045222,498.045222 C609.340833,498.045222 698.860771,481.796057 771.134663,454.780575 C813.402428,438.930163 849.589218,419.39129 877.900646,397.061149 C900.330474,379.316663 917.676209,359.977166 929.040655,339.341724 C939.208844,320.999109 945.090443,301.659612 945.090443,281.622299 C945.190131,161.996547 751.396413,65 512.14491,65 C272.893406,65 79,161.996547 79,281.522611 C79,301.559924 84.8815995,320.899421 95.0497884,339.242036 C106.513923,359.877478 123.859657,379.316663 146.189797,397.061149 L146.189797,397.061149 Z M878.000334,512.5 C849.688906,534.929828 813.402428,554.369013 771.234351,570.219425 C698.960459,597.334596 609.440521,613.484072 512.14491,613.484072 C414.849298,613.484072 325.329361,597.234908 253.055469,570.219425 C210.787703,554.369013 174.600913,534.83014 146.289485,512.5 C123.859657,494.755513 106.513923,475.416017 95.1494765,454.780575 C84.9812876,473.12319 79.0996881,492.462687 79.0996881,512.5 C79.0996881,532.537313 84.9812876,551.87681 95.1494765,570.219425 C106.513923,590.854867 123.859657,610.294052 146.289485,627.938851 C223.049343,688.549231 358.027066,729.022611 512.14491,729.022611 C666.362442,729.022611 801.240477,688.549231 878.000334,627.938851 C900.430163,610.194364 917.676209,590.854867 929.140343,570.219425 C939.308532,551.87681 945.190131,532.537313 945.190131,512.5 C945.190131,492.462687 939.308532,473.12319 929.140343,454.780575 C917.676209,475.416017 900.330474,494.855202 878.000334,512.5 L878.000334,512.5 Z M512.14491,844.561149 C312.968033,844.561149 145.691357,777.271664 95.1494765,685.757964 C84.9812876,704.100579 79.0996881,723.440076 79.0996881,743.477389 C79.0996881,863.003453 272.993094,960 512.244598,960 C751.496102,960 945.389508,863.003453 945.389508,743.477389 C945.389508,723.440076 939.507908,704.100579 929.339719,685.757964 C878.498775,777.271664 711.222098,844.561149 512.14491,844.561149 L512.14491,844.561149 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 64 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>dataset</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"dataset\" fill=\"#000000\">\n            <path d=\"M511.101562,65 L695.695312,171.28125 L512.5,278.960938 L326.507812,171.28125 L511.101562,65 L511.101562,65 Z M245.398438,821.554688 L65,718.070313 L65,367.0625 L245.398438,470.546875 L245.398438,821.554688 L245.398438,821.554688 Z M88.7734375,309.726562 L266.375,206.242187 L450.96875,312.523437 L274.765625,417.40625 L88.7734375,309.726562 L88.7734375,309.726562 Z M480.335937,957.203125 L309.726562,857.914062 L309.726562,506.90625 L480.335937,606.195312 L480.335937,957.203125 L480.335937,957.203125 Z M513.898438,555.851563 L334.898438,452.367188 L512.5,348.882813 L691.5,452.367188 L513.898438,555.851563 L513.898438,555.851563 Z M720.867187,857.914063 L543.265625,960 L543.265625,608.992188 L719.46875,506.90625 L719.46875,857.914063 L720.867187,857.914063 Z M572.632813,313.921875 L755.828125,207.640625 L934.828125,311.125 L751.632813,417.40625 L572.632813,313.921875 L572.632813,313.921875 Z M960,718.070313 L785.195312,820.15625 L785.195312,469.148438 L960,367.0625 L960,718.070313 L960,718.070313 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 65 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>date</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"date\" fill=\"#000000\">\n            <path d=\"M969.047306,144.464779 L969.047306,960 L54,960 L54,144.464779 L220.004157,141.324655 L220.004157,78.3931912 C220.004157,78.3931912 243.16705,65 265.99898,65 C288.830912,65 311.649473,78.3931912 311.649473,78.3931912 L311.649473,141.324655 L711.397836,141.324655 L711.397836,78.3931912 C711.397836,78.3931912 737.745762,65 759.572572,65 C781.399385,65 803.043149,78.3931912 803.043149,78.3931912 L803.043149,141.324655 L969.047306,144.464779 L969.047306,144.464779 Z M106.289621,193.926227 L103.871539,309.994205 L913.803127,309.994205 L914.984051,193.926227 L803.043149,191.51506 L803.043149,213.098932 L711.397836,213.098932 L711.397836,191.51506 L311.649473,191.51506 L311.649473,213.098932 L220.004157,213.098932 L220.004157,191.51506 L106.289621,193.926227 L106.289621,193.926227 Z M336.152361,599.754403 L336.152361,376.820226 L107.135647,376.820226 L107.135647,599.754403 L336.152361,599.754403 L336.152361,599.754403 Z M397.015296,376.820226 L397.015296,599.754403 L626.032011,599.754403 L626.032011,376.820226 L397.015296,376.820226 L397.015296,376.820226 Z M681.522304,376.820226 L681.522304,599.754403 L910.539019,599.754403 L910.539019,376.820226 L681.522304,376.820226 L681.522304,376.820226 Z M336.152361,905.208504 L336.152361,654.407556 L107.135647,654.407556 L107.135647,877.341733 L135.762736,905.208504 L336.152361,905.208504 L336.152361,905.208504 Z M397.015296,905.208504 L626.032011,905.208504 L626.032011,654.407556 L397.015296,654.407556 L397.015296,905.208504 L397.015296,905.208504 Z M881.91193,899.851227 L910.539019,871.984457 L910.539019,649.05028 L681.522304,649.05028 L681.522304,899.851227 L881.91193,899.851227 L881.91193,899.851227 Z\" id=\"calendar\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 66 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>distribution</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"distribution\" fill=\"#000000\">\n            <path d=\"M31,906.12773 L992.374926,906.12773 L992.374926,960 L31,960 L31,906.12773 L31,906.12773 Z M31,678.693081 L31,529.621635 C114.163448,529.621635 160.203289,451.978754 226.155892,324.09653 C288.784956,202.653543 359.776014,65 511.68509,65 C663.550511,65 734.547263,202.356493 797.190563,323.537545 C863.127982,451.10279 909.167822,528.561557 992.370181,528.561557 L992.370181,677.633003 C812.409372,677.633003 730.543262,519.251472 664.760538,391.991818 C607.540054,281.291967 568.686346,214.071446 511.68509,214.071446 C454.731287,214.071446 415.873783,281.452355 358.638115,392.42458 C292.865829,519.9661 211.009209,678.693081 31,678.693081 L31,678.693081 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 67 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.8.3 (29802) - http://www.bohemiancoding.com/sketch -->\n    <title>download</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"download\" fill=\"#000000\">\n            <path d=\"M126.975334,943.508953 L126.975334,875.937576 L897.022187,875.937576 L897.022187,943.508953 L126.975334,943.508953 Z M511.99876,793.278875 L122.846396,385.123449 L392.055612,384.514058 L392.918709,65.0810429 L631.078812,65.0810429 L631.941909,384.514058 L901.151124,385.123449 L511.99876,793.278875 Z\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 68 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"381px\" height=\"513px\" viewBox=\"0 0 381 513\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <path d=\"M190.5,513 C295.710245,513 381,427.710245 381,322.5 C381,217.289755 201.257812,1.77635684e-15 190.5,0 C179.742188,-1.77635684e-15 0,217.289755 0,322.5 C0,427.710245 85.2897552,513 190.5,513 L190.5,513 Z M280.555891,228 C308.695378,251.108262 326.645336,286.169388 326.645336,325.422953 C326.645336,395.010831 270.233215,451.422953 200.645336,451.422953 C170.434205,451.422953 142.70645,440.790359 121,423.063103 C133.976144,427.193838 147.800421,429.422953 162.145336,429.422953 C236.97992,429.422953 297.645336,368.757536 297.645336,293.922953 C297.645336,269.993013 291.44208,247.511921 280.555891,228 L280.555891,228 L280.555891,228 Z\" id=\"droplet\" fill=\"#000000\"></path>\n    </g>\n</svg>"

/***/ },
/* 69 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>edit</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"edit\" fill=\"#000000\">\n            <path d=\"M322.077539,862.918621 L102,922.962484 L161.73235,702.801107 L601.558655,262.356708 L761.898913,422.474222 L322.076717,862.918621 L322.077539,862.918621 Z M822.015105,117.797567 C810.791608,107.264494 797.92671,101.99097 783.425343,102.000012 C768.914935,102.008231 756.391139,107.302303 745.862175,117.852637 L654.929242,208.907216 L815.2695,369.02473 L906.202433,277.965219 C916.731397,267.418995 922.00903,254.87876 921.999988,240.368352 C921.991769,225.871095 916.693588,213.014416 906.151473,201.803247 L822.015105,117.797567 L822.015105,117.797567 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 70 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>email</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"email\" fill=\"#000000\">\n            <path d=\"M982,216.919016 L512,570.433113 L42,216.919016 C42,200.654831 47.7372473,186.769108 59.2119142,175.261431 C70.6865807,163.753753 84.532471,158 100.75,158 L923.25,158 C939.467528,158 953.31342,163.753753 964.788087,175.261431 C976.262753,186.769108 982,200.654831 982,216.919016 L982,216.919016 L982,216.919016 Z M42,322.789124 L512,676.303221 L982,322.789124 L982,806.109177 C982,822.37336 976.262753,836.259086 964.788087,847.766764 C953.31342,859.274441 939.467528,865.028193 923.25,865.028193 L100.75,865.028193 C84.532471,865.028193 70.6865807,859.274441 59.2119142,847.766764 C47.7372473,836.259086 42,822.37336 42,806.109177 L42,322.789124 L42,322.789124 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 71 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 39.1 (31720) - http://www.bohemiancoding.com/sketch -->\n    <title>embed</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"embed\" fill=\"#221F20\">\n            <path d=\"M294.725501,738.731701 L69,503.619843 L294.725501,268.510721 L339.270045,314.904497 L158.086437,503.621211 L339.270045,692.337924 L294.725501,738.731701 Z M727.193102,738.639244 L682.311823,692.338471 L865.23744,503.621758 L682.311823,314.903676 L727.193102,268.604271 L955,503.623125 L727.193102,738.639244 Z M546.208884,150 L414.607596,864.266659 L463.719282,873.89664 L595.319244,159.629981 L546.208884,150 Z\" id=\"Combined-Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 72 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>expand</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"expand\" fill=\"#000000\">\n            <path d=\"M389.8125,512 L161.25,740.5625 L52,631.3125 L52,972 L392.6875,972 L283.4375,862.75 L512,634.1875 L389.8125,512 Z M972,52 L631.3125,52 L740.5625,161.25 L512,389.8125 L634.1875,512 L862.75,283.4375 L972,392.6875 L972,52 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 73 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>external-square</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"external-square\" fill=\"#000000\">\n            <path d=\"M824.243867,131.861635 L454.135678,502.435369 L520.937725,569.321444 L892.251256,197.540853 L892.251256,371.886792 L982,371.886792 L982,42 L665.517588,42 L665.517588,131.861635 L824.243867,131.861635 L824.243867,131.861635 Z M629.162555,174.427673 L42,174.427673 L42,982 L848.557789,982 L848.557789,392.126292 L759.98995,480.805537 L759.98995,893.320755 L131.748744,893.320755 L131.748744,264.289308 L539.413812,264.289308 L629.162555,174.427673 L629.162555,174.427673 Z\" id=\"Combined-Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 74 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>external</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"external\" fill=\"#000000\">\n            <path d=\"M972,513.609139 L688.923077,229 L688.923077,370.538462 C122.769231,370.538462 52,653.615385 52,795.153846 C122.673467,512.076923 688.923077,653.615385 688.923077,653.615385 L688.923077,795.153846 L972,513.609139 L972,513.609139 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 75 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.8.3 (29802) - http://www.bohemiancoding.com/sketch -->\n    <title>eye-blocked</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"eye-blocked\" fill=\"#000000\">\n            <path d=\"M213.035703,695.209063 C206.762812,691.320625 200.931953,687.575938 195.606016,684.050469 C156.216719,657.992188 119.968359,628.167656 93.538125,600.064531 C61.5501562,566.056875 46,537.364375 46,512.346484 C46,487.326797 61.5501562,458.634297 93.5345312,424.626641 C119.964766,396.525312 156.213125,366.698984 195.602422,340.640703 C254.378203,301.758125 372.860547,236.526172 505.998203,236.526172 C517.340078,236.526172 528.565156,237.032891 539.668047,237.924141 L478.209531,323.965703 C383.796328,331.819844 298.694531,377.336484 254.153594,405.486328 C184.48875,449.516953 143.618828,494.122578 133.71625,512.348281 C143.618828,530.573984 184.486953,575.179609 254.151797,619.208438 C257.025,621.023281 260.081484,622.917188 263.283516,624.863203 L213.035703,695.209063 L213.035703,695.209063 Z M918.461875,424.624844 C892.029844,396.523516 855.781484,366.697187 816.393984,340.638906 C787.06,321.232656 742.833516,295.282187 689.351328,274.141953 L792.531484,129.687578 L736.968516,90 L161.968516,895 L217.531484,934.689375 L343.470859,758.372812 C392.329687,775.673125 447.756094,788.165 506,788.165 C639.139453,788.165 757.618203,722.934844 816.393984,684.052266 C855.783281,657.993984 892.031641,628.167656 918.461875,600.068125 C950.448047,566.058672 965.998203,537.366172 966,512.341094 C965.998203,487.325 950.448047,458.6325 918.461875,424.624844 L918.461875,424.624844 Z M757.846406,619.204844 C708.973203,650.094922 611.264531,701.915 506,701.915 C467.669062,701.915 430.347969,695.038359 396.018672,684.806953 L448.194531,611.762187 C465.180391,621.662969 484.922656,627.346484 506,627.346484 C569.514141,627.346484 621,575.860625 621,512.346484 C621,477.629062 605.597187,446.534141 581.271094,425.455 L637.437812,346.82375 C688.012656,364.456484 730.548281,388.234531 757.846406,405.486328 C827.513047,449.516953 868.379375,494.120781 878.281953,512.346484 C868.379375,530.572187 827.51125,575.176016 757.846406,619.204844 L757.846406,619.204844 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 76 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.8.3 (29802) - http://www.bohemiancoding.com/sketch -->\n    <title>eye</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"eye\" fill=\"#000000\">\n            <g transform=\"translate(44.000000, 234.000000)\" id=\"Shape\">\n                <path d=\"M458,550 C325.439414,550 207.474,484.963844 148.953766,446.196906 C109.735727,420.216124 73.6449687,390.478502 47.3296484,362.460749 C15.4825469,328.552443 0,299.945277 0,275.001792 C0,250.056515 15.4825469,221.449349 47.3314375,187.541042 C73.6467578,159.52329 109.737516,129.785668 148.955555,103.804886 C207.474,65.0379479 325.441203,0 458,0 C590.558797,0 708.524211,65.0379479 767.044445,103.804886 C806.260695,129.785668 842.351453,159.52329 868.668562,187.541042 C900.515664,221.447557 915.998211,250.054723 916,274.994625 C915.998211,299.945277 900.515664,328.552443 868.668562,362.460749 C842.353242,390.478502 806.262484,420.214332 767.044445,446.195114 C708.524211,484.963844 590.560586,550 458,550 L458,550 Z M87.3366641,275 C97.1961875,293.171498 137.886625,337.644463 207.248578,381.542345 C255.911078,412.338762 353.19493,464.004723 458,464.004723 C562.806859,464.004723 660.090711,412.338762 708.751422,381.540554 C778.113375,337.642671 818.803812,293.171498 828.661547,275 C818.800234,256.828502 778.111586,212.357329 708.749633,168.457655 C660.088922,137.659446 562.80507,85.9934853 458,85.9934853 C353.19493,85.9934853 255.911078,137.659446 207.250367,168.457655 C137.888414,212.355537 97.1961875,256.828502 87.3366641,275 L87.3366641,275 Z M343.5,275 C343.5,211.676547 394.763797,160.34202 458,160.34202 C521.236203,160.34202 572.5,211.676547 572.5,275 C572.5,338.323453 521.236203,389.65798 458,389.65798 C394.763797,389.65798 343.5,338.323453 343.5,275 L343.5,275 Z\"></path>\n            </g>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 77 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\" >\n<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" viewBox=\"0 0 1024 1024\">\n  <g transform=\"matrix(1 0 0 -1 0 819)\">\n   <path fill=\"currentColor\"\nd=\"M910.098 830.545h-795.303c-26.7944 0.455136 -49.3393 -22.0838 -49.3393 -49.3393v-795.303c0 -27.2488 22.0838 -49.3393 49.3393 -49.3393h428.163v346.195h-116.502v134.921h116.502v99.4992c0 115.47 70.5253 178.345 173.531 178.345\nc49.3393 0 91.7482 -3.67449 104.105 -5.31578v-120.672l-71.4398 -0.033496c-56.0217 0 -66.8676 -26.6191 -66.8676 -65.6818v-86.1411h133.605l-17.3977 -134.921h-116.207v-346.195h227.811c27.2488 0 49.3393 22.0905 49.3393 49.3393v795.303\nc0 27.2555 -22.0905 49.3393 -49.3393 49.3393z\" />\n  </g>\n\n</svg>\n"

/***/ },
/* 78 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>failed</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"failed\" fill=\"#000000\">\n            <path d=\"M904.64375,750.68125 C904.64375,756.325 903.03125,759.55 899.80625,763.58125 L767.58125,895.80625 C763.55,899.03125 759.51875,900.64375 754.68125,900.64375 C749.0375,900.64375 745.00625,899.03125 740.975,895.80625 L512,666.83125 L283.025,895.80625 C278.99375,899.03125 274.9625,900.64375 269.31875,900.64375 C263.675,900.64375 260.45,899.03125 256.41875,895.80625 L124.19375,763.58125 C120.96875,759.55 119.35625,755.51875 119.35625,750.68125 C119.35625,745.0375 120.96875,741.00625 124.19375,736.975 L353.16875,508 L124.19375,279.025 C120.96875,274.99375 119.35625,270.9625 119.35625,265.31875 C119.35625,259.675 120.96875,256.45 124.19375,252.41875 L256.41875,120.19375 C260.45,116.96875 264.48125,115.35625 269.31875,115.35625 C274.9625,115.35625 278.99375,116.96875 283.025,120.19375 L512,349.16875 L740.975,120.19375 C745.00625,116.96875 749.0375,115.35625 754.68125,115.35625 C760.325,115.35625 763.55,116.96875 767.58125,120.19375 L899.80625,252.41875 C903.03125,256.45 904.64375,260.48125 904.64375,265.31875 C904.64375,270.9625 903.03125,274.99375 899.80625,279.025 L670.83125,508 L899.80625,736.975 C902.225,741.00625 904.64375,745.0375 904.64375,750.68125 L904.64375,750.68125 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 79 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 42 (36781) - http://www.bohemiancoding.com/sketch -->\n    <title>feature</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"feature\" fill=\"#000000\">\n            <path d=\"M899.375,60 L123.125,60 C99.40625,60 80,79.40625 80,103.125 L80,764.375 C80,788.09375 99.40625,807.5 123.125,807.5 L379.25875,807.5 L261.973125,924.785625 C249.342891,937.415859 249.342891,957.894844 261.973125,970.525078 C268.289141,976.841094 276.567344,980 284.84375,980 C293.120156,980 301.398359,976.841094 307.714375,970.526875 L470.74125,807.5 L482.5,807.5 L482.5,951.25 C482.5,967.128984 495.372813,980 511.25,980 C527.127188,980 540,967.128984 540,951.25 L540,807.5 L551.760547,807.5 L714.787422,970.526875 C721.101641,976.841094 729.379844,980 737.65625,980 C745.932656,980 754.210859,976.841094 760.526875,970.526875 C773.158906,957.896641 773.158906,937.417656 760.526875,924.787422 L643.239453,807.5 L899.375,807.5 C923.09375,807.5 942.5,788.09375 942.5,764.375 L942.5,103.125 C942.5,79.40625 923.09375,60 899.375,60 L899.375,60 Z M798.75,692.5 L223.75,692.5 C207.872813,692.5 195,679.628984 195,663.75 C195,647.871016 207.872813,635 223.75,635 L798.75,635 C814.628984,635 827.5,647.871016 827.5,663.75 C827.5,679.628984 814.628984,692.5 798.75,692.5 Z M298,573 L298,364 L403,364 L403,573 L298,573 Z M455,573 L455,155 L560,155 L560,573 L455,573 Z M612,233 L717,233 L717,573 L612,573 L612,233 Z\" id=\"Combined-Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 80 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>filter</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"filter\" fill=\"#000000\">\n            <polygon id=\"Shape\" points=\"623.544075 620.08646 597.180128 940.268318 426.820907 940.268318 400.451783 620.08646 72 83 952 83 623.543039 620.08646\"></polygon>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 81 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 40.3 (33839) - http://www.bohemiancoding.com/sketch -->\n    <title>flyout-options</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"flyout-options\" fill=\"#2C2C2C\">\n            <path d=\"M642.543012,662.710921 L642.543012,737.765156 L374.777976,737.765156 L277.392274,812.81939 L277.392274,737.765156 L167.847053,737.765156 L167.847053,400.0211 L386.937496,400.0211 L386.937496,324.966866 L167.847053,324.966866 C127.570927,324.966866 94.8169057,358.591163 94.8169057,400.0211 L94.8169057,737.765156 C94.8169057,779.157566 127.570927,812.81939 167.847053,812.81939 L204.362127,812.81939 L204.362127,962.927859 L399.097015,812.81939 L642.543012,812.81939 C682.819138,812.81939 715.573159,779.157566 715.573159,737.765156 L715.573159,662.710921 L642.543012,662.710921 Z M714.591186,586.538119 C573.643001,586.538119 458.985669,468.702971 458.985669,323.848298 C458.985669,179.031153 573.643001,61.1584776 714.591186,61.1584776 C855.53937,61.1584776 970.196702,179.031153 970.196702,323.848298 C970.196702,468.702971 855.53937,586.538119 714.591186,586.538119 Z M714.591186,136.212712 C613.919127,136.212712 532.015817,220.386036 532.015817,323.848298 C532.015817,427.310561 613.919127,511.483885 714.591186,511.483885 C815.263244,511.483885 897.166554,427.310561 897.166554,323.848298 C897.166554,220.386036 815.263244,136.212712 714.591186,136.212712 Z M678.076112,323.848298 L751.106259,323.848298 L751.106259,473.956768 L678.076112,473.956768 L678.076112,323.848298 Z M714.591186,286.321181 C734.757904,286.321181 751.106259,269.519719 751.106259,248.794064 C751.106259,228.068409 734.757904,211.266947 714.591186,211.266947 C694.424467,211.266947 678.076112,228.068409 678.076112,248.794064 C678.076112,269.519719 694.424467,286.321181 714.591186,286.321181 Z\" id=\"Combined-Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 82 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>geo</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"geo\" fill=\"#000000\">\n            <path d=\"M726.766133,876.02418 C660.979902,914.422813 589.384766,933.623047 512,933.623047 C434.600547,933.623047 363.01,914.42373 297.233867,876.02418 C231.447637,837.630137 179.3575,785.54 140.958867,719.74918 C102.560234,653.973047 83.36,582.3825 83.36,504.977539 C83.36,427.596445 102.559316,356.001309 140.958867,290.211406 C179.3575,224.435273 231.447637,172.335039 297.233867,133.936406 C363.01,95.5377734 434.600547,76.3430469 512,76.3430469 C589.385684,76.3430469 660.98082,95.5423633 726.766133,133.941914 C792.547773,172.340547 844.64709,224.440781 883.041133,290.216914 C921.439766,356.003145 940.64,427.598281 940.64,504.983047 C940.64,582.38709 921.440684,653.977637 883.041133,719.74918 C844.64709,785.53541 792.542266,837.625547 726.766133,876.02418 L726.766133,876.02418 Z M369.12,810.388496 C338.758184,744.30209 320.005,661.562812 312.861367,562.134863 L183.376367,562.134863 C192.306367,618.09791 213.136914,667.508496 245.886367,710.373047 C278.617461,753.23668 319.700234,786.58373 369.12,810.389414 L369.12,810.388496 Z M184.268633,447.83123 L313.753633,447.83123 C319.699316,353.775234 338.155996,272.803047 369.12,204.934863 C319.699316,228.153047 278.77168,260.456367 246.3325,301.825547 C213.874043,343.209414 193.198633,391.877363 184.268633,447.83123 L184.268633,447.83123 Z M479.851816,809.942363 C494.14,831.679863 504.855449,842.53668 512,842.53668 C519.144551,842.53668 529.86,831.679863 544.148184,809.942363 C558.436367,788.214043 573.015547,754.571406 587.905,709.028223 C602.780684,663.485039 612.016367,614.529766 615.588184,562.134863 L408.411816,562.134863 C411.983633,614.530684 421.205547,663.490547 436.095,709.028223 C450.966094,754.571406 465.563633,788.214043 479.851816,809.942363 L479.851816,809.942363 Z M614.695,447.83123 C612.311953,410.324863 607.687227,375.051914 600.853867,342.010547 C594.00123,308.96918 586.565684,281.888184 578.528867,260.747363 C570.492051,239.62123 561.853047,221.31418 552.632051,205.828047 C543.396367,190.351094 535.359551,179.193184 528.520684,172.335957 C521.668047,165.49709 516.154727,162.066641 512,162.066641 C507.825996,162.066641 502.313594,165.498008 495.479316,172.335957 C488.63127,179.188594 480.594453,190.351094 471.367949,205.828047 C462.132266,221.31418 453.507949,239.62123 445.471133,260.747363 C437.434316,281.883594 429.985,308.96918 423.146133,342.010547 C416.293496,375.051914 411.673359,410.324863 409.305,447.83123 L614.695,447.83123 L614.695,447.83123 Z M839.731367,447.83123 C830.805957,391.877363 810.112188,343.209414 777.6675,301.825547 C745.213633,260.456367 704.285996,228.153047 654.88,204.934863 C685.829316,272.803047 704.285996,353.774316 710.240859,447.83123 L839.730449,447.83123 L839.731367,447.83123 Z M654.88,810.388496 C704.285996,786.582813 745.36418,753.23668 778.113633,710.372129 C810.849316,667.508496 831.693633,618.096992 840.623633,562.133945 L711.138633,562.133945 C703.995,661.562813 685.241816,744.305762 654.88,810.387578 L654.88,810.388496 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 83 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.8.3 (29802) - http://www.bohemiancoding.com/sketch -->\n    <title>goal</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"goal\" fill=\"#2C2C2C\">\n            <polygon id=\"Combined-Shape\" points=\"869 458.321389 680.010307 269.149876 869 80 348.08209 80 225 80 225 944 354.895522 944 354.895522 458.321389\"></polygon>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 84 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 39.1 (31720) - http://www.bohemiancoding.com/sketch -->\n    <title>google</title>\n    <desc>Created with Sketch.</desc>\n    <defs>\n        <path d=\"M849.732558,446.863636 L808.395349,446.863636 L672.809302,446.863636 L510.767442,446.863636 L510.767442,584.215909 L705.87907,584.215909 C687.690698,671.475 611.630233,721.568182 510.767442,721.568182 C391.716279,721.568182 295.813953,627.845455 295.813953,511.5 C295.813953,395.154545 391.716279,301.431818 510.767442,301.431818 C562.025581,301.431818 608.323256,319.206818 644.7,348.293182 L750.523256,244.875 C686.037209,189.934091 603.362791,156 510.767442,156 C309.04186,156 147,314.359091 147,511.5 C147,708.640909 309.04186,867 510.767442,867 C692.651163,867 858,737.727273 858,511.5 C858,490.493182 854.693023,467.870455 849.732558,446.863636 L849.732558,446.863636 Z\" id=\"path-1\"></path>\n    </defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"google\">\n            <mask id=\"mask-2\" fill=\"white\">\n                <use xlink:href=\"#path-1\"></use>\n            </mask>\n            <use id=\"shape\" fill=\"#2C2C2C\" xlink:href=\"#path-1\"></use>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 85 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 40.1 (33804) - http://www.bohemiancoding.com/sketch -->\n    <title>gte</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"gte\" fill=\"#221F20\">\n            <path d=\"M807.659973,864.995169 L216,864.995169 L216,803.586665 L807.659973,803.586665 L807.659973,864.995169 Z M258.094619,148 L787.782303,403.342044 L787.782303,461.035334 L258.094619,716.377377 L258.094619,642.659758 L703.593532,433.256758 L703.593532,431.120619 L258.094619,221.71762 L258.094619,148 Z\" id=\"Combined-Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 86 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>hamburger</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"hamburger\" fill=\"#000000\">\n            <polygon id=\"Line\" points=\"100.768499 266.181964 923.249343 266.181964 981.378917 266.181964 981.378917 150 923.249343 150 100.768499 150 42.6389247 150 42.6389247 266.181964 100.768499 266.181964\"></polygon>\n            <polygon id=\"Line-Copy\" points=\"100.768499 568.73916 923.249343 568.73916 981.378917 568.73916 981.378917 452.557197 923.249343 452.557197 100.768499 452.557197 42.6389247 452.557197 42.6389247 568.73916 100.768499 568.73916\"></polygon>\n            <polygon id=\"Line-Copy-2\" points=\"100.768499 873.716814 923.249343 873.716814 981.378917 873.716814 981.378917 757.53485 923.249343 757.53485 100.768499 757.53485 42.6389247 757.53485 42.6389247 873.716814 100.768499 873.716814\"></polygon>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 87 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 40.3 (33839) - http://www.bohemiancoding.com/sketch -->\n    <title>image</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"image\" fill=\"#2F2F2F\">\n            <path d=\"M955.214149,160.439244 L955.214149,863.560756 L69.4990401,863.560756 L69.4990401,160.439244 L955.214149,160.439244 Z M137.630972,222.609633 L137.630972,803.860173 L887.082217,803.860173 L887.082217,222.609633 L137.630972,222.609633 Z M583.06676,581.998918 L634.531652,499.395605 L772.924638,720.824382 L219.352695,720.824382 L440.781472,333.324022 L583.06676,581.998918 Z M689.888846,444.03841 C670.859716,444.03841 654.569871,437.335067 641.018823,423.92818 C627.467776,410.521292 620.692353,394.159368 620.692353,374.841918 C620.692353,355.812787 627.467776,339.522942 641.018823,325.971895 C654.569871,312.420847 670.859716,305.645425 689.888846,305.645425 C708.917977,305.645425 725.207822,312.420847 738.758869,325.971895 C752.309917,339.522942 759.085339,355.812787 759.085339,374.841918 C759.085339,394.159368 752.309917,410.521292 738.758869,423.92818 C725.207822,437.335067 708.917977,444.03841 689.888846,444.03841 L689.888846,444.03841 Z\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 88 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>info-inverse</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"info-inverse\" fill=\"#04002B\">\n            <path d=\"M512,102 C285.539062,102 102,285.539062 102,512 C102,738.460937 285.539062,922 512,922 C738.460937,922 922,738.460937 922,512 C922,285.539062 738.460937,102 512,102 L512,102 Z M512,845.125 C327.980469,845.125 178.875,696.019531 178.875,512 C178.875,327.980469 327.980469,178.875 512,178.875 C696.019531,178.875 845.125,327.980469 845.125,512 C845.125,696.019531 696.019531,845.125 512,845.125 L512,845.125 Z\" id=\"Shape\"></path>\n            <path d=\"M571.257812,344.476562 C571.257812,376.097813 545.623203,401.732422 514.001953,401.732422 C482.380703,401.732422 456.746094,376.097813 456.746094,344.476562 C456.746094,312.855313 482.380703,287.220703 514.001953,287.220703 C545.623203,287.220703 571.257812,312.855313 571.257812,344.476562 L571.257812,344.476562 Z\" id=\"Shape\"></path>\n            <path d=\"M514.001953,432.242188 C488.777344,432.242188 468.357422,452.662109 468.357422,477.886719 L468.357422,718.441406 C468.357422,743.666016 488.777344,764.085938 514.001953,764.085938 C539.226562,764.085938 559.646484,743.666016 559.646484,718.441406 L559.646484,477.886719 C559.646484,452.742188 539.226562,432.242188 514.001953,432.242188 L514.001953,432.242188 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 89 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>info</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"info\" fill=\"#000000\">\n            <path d=\"M512,102 C285.539062,102 102,285.539062 102,512 C102,738.460938 285.539062,922 512,922 C738.460938,922 922,738.460938 922,512 C922,285.539062 738.460938,102 512,102 L512,102 Z M559.646484,718.441406 C559.646484,743.666016 539.226562,764.085937 514.001953,764.085937 C488.777344,764.085937 468.357422,743.666016 468.357422,718.441406 L468.357422,477.886719 C468.357422,452.662109 488.777344,432.242187 514.001953,432.242187 C539.226562,432.242187 559.646484,452.662109 559.646484,477.886719 L559.646484,718.441406 L559.646484,718.441406 Z M514.001953,401.732422 C482.371094,401.732422 456.746094,376.107422 456.746094,344.476562 C456.746094,312.845703 482.371094,287.220703 514.001953,287.220703 C545.632812,287.220703 571.257812,312.845703 571.257812,344.476562 C571.257812,376.107422 545.632812,401.732422 514.001953,401.732422 L514.001953,401.732422 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 90 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>italic2</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"italic2\" fill=\"#000000\">\n            <polygon id=\"Shape\" points=\"895.142857 65 895.142857 128.928571 767.285714 128.928571 447.642857 896.071429 575.5 896.071429 575.5 960 128 960 128 896.071429 255.857143 896.071429 575.5 128.928571 447.642857 128.928571 447.642857 65\"></polygon>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 91 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 40.3 (33839) - http://www.bohemiancoding.com/sketch -->\n    <title>kebab</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"kebab\" fill=\"#000000\">\n            <path d=\"M512,52 C575.729167,52 627,103.270833 627,167 C627,230.729167 575.729167,282 512,282 C448.270833,282 397,230.729167 397,167 C397,103.270833 448.270833,52 512,52 L512,52 Z M627,512 C627,575.729167 575.729167,627 512,627 C448.270833,627 397,575.729167 397,512 C397,448.270833 448.270833,397 512,397 C575.729167,397 627,448.270833 627,512 Z M512,742 C575.729167,742 627,793.270833 627,857 C627,920.729167 575.729167,972 512,972 C448.270833,972 397,920.729167 397,857 C397,793.270833 448.270833,742 512,742 L512,742 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 92 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 41.2 (35397) - http://www.bohemiancoding.com/sketch -->\n    <title>layout-inline</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"layout-inline\" fill=\"#000000\">\n            <path d=\"M212,319.231407 C212,318.674653 212.455393,318.223315 212.998753,318.223315 L802.001247,318.223315 C802.552843,318.223315 803,318.670716 803,319.231407 L803,703.661853 C803,704.218606 802.544607,704.669944 802.001247,704.669944 L212.998753,704.669944 C212.447157,704.669944 212,704.222543 212,703.661853 L212,319.231407 Z M212,801.281602 L803,801.281602 L803,897.893259 L212,897.893259 L212,801.281602 Z M212,125 L803,125 L803,221.611657 L212,221.611657 L212,125 Z\" id=\"Combined-Shape-Copy\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 93 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 41.2 (35397) - http://www.bohemiancoding.com/sketch -->\n    <title>layout-pop-out</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"layout-pop-out\" fill=\"#000000\">\n            <path d=\"M112,332.010258 C112,324.272945 118.265089,318.000614 125.991187,318.000614 L898.008813,318.000614 C905.735932,318.000614 912,324.272117 912,332.010258 L912,691.992196 C912,699.729509 905.734911,706.001841 898.008813,706.001841 L125.991187,706.001841 C118.264068,706.001841 112,699.730338 112,691.992196 L112,332.010258 Z M297.855988,803.002148 L729.592907,803.002148 L729.592907,900.002455 L297.855988,900.002455 L297.855988,803.002148 Z M297.66578,124 L729.402699,124 L729.402699,221.000307 L297.66578,221.000307 L297.66578,124 Z\" id=\"Combined-Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 94 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.8.3 (29802) - http://www.bohemiancoding.com/sketch -->\n    <title>line-chart</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"line-chart\">\n            <polygon id=\"Shape\" fill=\"#000000\" points=\"65 904.0625 960 904.0625 960 960 65 960\"></polygon>\n            <polygon id=\"Path-243\" fill=\"#2C2C2C\" points=\"386.046988 536.484375 585.384337 722.707949 960 294.117189 859.256763 197.911882 577.169403 516.66591 388.198396 344.825348 65 717.51812 160.48938 811.508057\"></polygon>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 95 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>link</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"link\" fill=\"#000000\">\n            <path d=\"M451.704132,616.084241 C440.521154,616.084241 429.341537,611.819418 420.810211,603.288092 C340.879227,523.355427 340.879227,393.295129 420.810211,313.362464 L582.127394,152.04528 C620.85024,113.324115 672.330586,92 727.089368,92 C781.84815,92 833.330177,113.324115 872.053022,152.0436 C951.982326,231.976265 951.982326,362.036563 872.053022,441.969228 L798.312585,515.709665 C781.249932,532.772318 753.589076,532.772318 736.524743,515.709665 C719.46377,498.648693 719.46377,470.984476 736.524743,453.921823 L810.26518,380.181386 C856.126311,334.318574 856.126311,259.694254 810.26518,213.831442 C788.048779,191.615041 758.50925,179.380141 727.089368,179.380141 C695.669486,179.380141 666.131637,191.615041 643.913556,213.833123 L482.596372,375.148626 C436.733561,421.011437 436.733561,495.637438 482.596372,541.50025 C499.659025,558.561222 499.657345,586.225439 482.596372,603.288092 C474.068407,611.817738 462.883749,616.084241 451.704132,616.084241 L451.704132,616.084241 Z M296.910212,932.193665 C242.14975,932.193665 190.667723,910.869549 151.948238,872.150065 C72.017254,792.2174 72.017254,662.157101 151.948238,582.224437 L225.686995,508.48568 C242.749648,491.424707 270.413864,491.424707 287.474837,508.48568 C304.53749,525.546653 304.53749,553.210869 287.474837,570.273522 L213.73608,644.012279 C167.873269,689.87509 167.873269,764.501092 213.73608,810.363903 C235.950801,832.578623 265.49033,844.813524 296.910212,844.813524 C328.330094,844.813524 357.867943,832.578623 380.087704,810.360542 L541.404888,649.045039 C587.266019,603.182228 587.266019,528.556226 541.404888,482.693415 C524.342235,465.630762 524.343915,437.968226 541.404888,420.905573 C558.46586,403.8446 586.130077,403.8446 603.19273,420.907253 C683.122034,500.838237 683.122034,630.898536 603.19441,710.831201 L441.875546,872.148384 C403.15102,910.87123 351.668994,932.193665 296.910212,932.193665 L296.910212,932.193665 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 96 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>linked</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"linked\" fill=\"#000000\">\n            <path d=\"M512.539063,63.6796875 C267.714844,63.6796875 69.25,262.144531 69.25,506.96875 C69.25,751.792969 267.714844,950.257812 512.539063,950.257812 C757.363281,950.257812 955.828125,751.792969 955.828125,506.96875 C955.828125,262.144531 757.363281,63.6796875 512.539063,63.6796875 L512.539063,63.6796875 Z M402.121094,759.25 C256.933594,759.25 138.878906,641.105469 138.878906,496.007813 C138.878906,350.910156 257.023438,232.765625 402.121094,232.765625 C429.703125,232.765625 456.386719,237.078125 481.363281,244.984375 C451.175781,261.246094 424.222656,282.71875 401.761719,308.324219 C298.441406,308.503906 214.4375,392.6875 214.4375,496.007813 C214.4375,599.417969 298.441406,683.511719 401.761719,683.691406 C424.222656,709.296875 451.175781,730.769531 481.363281,747.03125 C456.296875,755.027344 429.703125,759.25 402.121094,759.25 L402.121094,759.25 Z M615.769531,759.25 C577.765625,759.25 541.558594,750.085937 508.945313,736.609375 L508.945313,736.609375 C505.261719,735.710937 501.667969,733.195312 498.074219,731.398437 C497.984375,731.398437 497.894531,731.308594 497.804688,731.308594 C494.300781,729.511719 490.796875,727.714844 487.382813,725.738281 C487.203125,725.648437 487.113281,725.558594 486.933594,725.46875 C483.519531,723.582031 480.195313,721.605469 476.960938,719.539062 C476.78125,719.449219 476.601563,719.269531 476.421875,719.179687 C473.1875,717.113281 469.953125,715.046875 466.808594,712.890625 C466.628906,712.710937 466.359375,712.621094 466.179688,712.441406 C463.035156,710.285156 459.980469,708.039062 456.925781,705.792969 C456.746094,705.613281 456.476563,705.433594 456.296875,705.34375 C453.242188,703.007812 450.277344,700.671875 447.402344,698.246094 C447.222656,698.066406 447.042969,697.976562 446.863281,697.796875 C443.898438,695.371094 441.023438,692.855469 438.238281,690.25 C438.148438,690.160156 437.96875,690.070312 437.878906,689.890625 C435.003906,687.195312 432.128906,684.5 429.34375,681.714844 L429.34375,681.714844 C381.90625,634.097656 352.527344,568.421875 352.527344,496.007812 C352.527344,423.59375 381.90625,357.917969 429.34375,310.300781 L429.34375,310.300781 C432.128906,307.515625 434.914063,304.820312 437.878906,302.125 C437.96875,302.035156 438.148438,301.945312 438.238281,301.765625 C441.113281,299.160156 443.988281,296.644531 446.863281,294.21875 C447.042969,294.039062 447.222656,293.949219 447.402344,293.769531 C450.277344,291.34375 453.332031,289.007812 456.296875,286.671875 C456.476563,286.492187 456.746094,286.3125 456.925781,286.222656 C459.980469,283.886719 463.035156,281.730469 466.179688,279.574219 C466.359375,279.394531 466.628906,279.304687 466.808594,279.125 C469.953125,276.96875 473.097656,274.902344 476.421875,272.835937 C476.601563,272.746094 476.78125,272.566406 476.960938,272.476562 C480.195313,270.410156 483.519531,268.433594 486.933594,266.546875 C487.113281,266.457031 487.203125,266.367187 487.382813,266.277344 C490.796875,264.390625 494.300781,262.503906 497.804688,260.707031 C497.894531,260.707031 497.984375,260.886719 498.074219,260.886719 C501.667969,259.089844 505.261719,256.84375 508.945313,255.945312 L508.945313,255.945312 C541.648438,240.671875 577.765625,233.035156 615.769531,233.035156 C760.957031,233.035156 879.011719,351 879.011719,496.1875 C879.011719,641.375 760.957031,759.25 615.769531,759.25 L615.769531,759.25 Z M608.3125,312.277344 C599.238281,312.277344 590.34375,312.996094 581.628906,314.253906 C580.371094,314.433594 579.203125,314.613281 577.945313,314.882813 C576.597656,315.152344 575.25,315.332031 573.902344,315.601563 C572.105469,315.960938 570.398438,316.320313 568.601563,316.679688 C567.253906,316.949219 565.90625,317.308594 564.558594,317.578125 C563.300781,317.847656 562.042969,318.207031 560.785156,318.566406 C558.898438,319.105469 557.011719,319.554688 555.214844,320.183594 C553.957031,320.542969 552.609375,320.992188 551.351563,321.441406 C550.273438,321.800781 549.195313,322.160156 548.117188,322.519531 C546.140625,323.238281 544.074219,323.957031 542.097656,324.765625 C541.199219,325.125 540.210938,325.484375 539.3125,325.84375 C537.15625,326.742188 535,327.640625 532.84375,328.628906 C532.035156,328.988281 531.316406,329.347656 530.507813,329.707031 C529.160156,330.335938 527.722656,331.054688 526.375,331.683594 C525.746094,331.953125 525.117188,332.3125 524.488281,332.671875 C522.152344,333.839844 519.90625,335.097656 517.570313,336.355469 C517.03125,336.714844 516.402344,336.984375 515.863281,337.34375 C513.4375,338.78125 511.011719,340.21875 508.675781,341.746094 C508.316406,342.015625 507.957031,342.195313 507.597656,342.464844 C506.25,343.363281 504.8125,344.261719 503.464844,345.25 C455.578125,378.492188 424.222656,433.835938 424.222656,496.367188 C424.222656,558.898438 455.667969,614.242188 503.464844,647.484375 C504.8125,648.472656 506.160156,649.371094 507.597656,650.269531 C507.957031,650.539063 508.316406,650.71875 508.675781,650.898438 C511.011719,652.425781 513.4375,653.953125 515.863281,655.300781 C516.402344,655.660156 517.03125,655.929688 517.570313,656.289063 C519.816406,657.546875 522.152344,658.804688 524.488281,660.0625 C525.117188,660.332031 525.746094,660.691406 526.285156,660.960938 C527.632813,661.679688 529.070313,662.308594 530.417969,662.9375 C531.226563,663.296875 531.945313,663.65625 532.753906,664.015625 C534.910156,665.003906 537.066406,665.902344 539.222656,666.800781 C540.121094,667.160156 541.109375,667.519531 542.007813,667.878906 C543.984375,668.6875 546.050781,669.40625 548.027344,670.125 C549.105469,670.484375 550.183594,670.84375 551.261719,671.203125 C552.519531,671.652344 553.867188,672.011719 555.125,672.460938 C557.011719,673 558.808594,673.539063 560.695313,674.078125 C561.953125,674.4375 563.210938,674.707031 564.46875,675.066406 C565.816406,675.425781 567.164063,675.695313 568.511719,675.964844 C570.308594,676.324219 572.015625,676.683594 573.8125,677.042969 C575.160156,677.3125 576.507813,677.492188 577.855469,677.761719 C579.113281,677.941406 580.28125,678.210938 581.539063,678.390625 C590.253906,679.648438 599.148438,680.367188 608.222656,680.367188 C709.65625,680.367188 792.132813,597.890625 792.132813,496.457031 C792.222656,394.84375 709.746094,312.277344 608.3125,312.277344 L608.3125,312.277344 Z M599.148438,658.714844 C570.578125,657.097656 543.984375,648.113281 521.164063,633.558594 C558.988281,599.867187 582.976563,550.8125 582.976563,496.1875 C582.976563,441.652344 559.078125,392.597656 521.164063,358.816406 C543.984375,344.261719 570.578125,335.277344 599.148438,333.660156 C635.265625,378.042969 656.917969,434.644531 656.917969,496.1875 C656.917969,557.730469 635.175781,614.332031 599.148438,658.714844 L599.148438,658.714844 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 97 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>list-numbered</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"list-numbered\" fill=\"#000000\">\n            <path d=\"M400.625,792.1875 L960,792.1875 L960,904.0625 L400.625,904.0625 L400.625,792.1875 Z M400.625,456.5625 L960,456.5625 L960,568.4375 L400.625,568.4375 L400.625,456.5625 Z M400.625,120.9375 L960,120.9375 L960,232.8125 L400.625,232.8125 L400.625,120.9375 Z M232.8125,65 L232.8125,288.75 L176.875,288.75 L176.875,120.9375 L120.9375,120.9375 L120.9375,65 L232.8125,65 Z M176.875,524.736328 L176.875,568.4375 L288.75,568.4375 L288.75,624.375 L120.9375,624.375 L120.9375,496.767578 L232.8125,444.326172 L232.8125,400.625 L120.9375,400.625 L120.9375,344.6875 L288.75,344.6875 L288.75,472.294922 L176.875,524.736328 Z M288.75,680.3125 L288.75,960 L120.9375,960 L120.9375,904.0625 L232.8125,904.0625 L232.8125,848.125 L120.9375,848.125 L120.9375,792.1875 L232.8125,792.1875 L232.8125,736.25 L120.9375,736.25 L120.9375,680.3125 L288.75,680.3125 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 98 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>list2</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"list2\" fill=\"#000000\">\n            <path d=\"M400.625,120.9375 L960,120.9375 L960,232.8125 L400.625,232.8125 L400.625,120.9375 L400.625,120.9375 Z M400.625,456.5625 L960,456.5625 L960,568.4375 L400.625,568.4375 L400.625,456.5625 L400.625,456.5625 Z M400.625,792.1875 L960,792.1875 L960,904.0625 L400.625,904.0625 L400.625,792.1875 L400.625,792.1875 Z M65,176.875 C65,115.088535 115.088535,65 176.875,65 C238.661465,65 288.75,115.088535 288.75,176.875 C288.75,238.661465 238.661465,288.75 176.875,288.75 C115.088535,288.75 65,238.661465 65,176.875 L65,176.875 Z M65,512.5 C65,450.713535 115.088535,400.625 176.875,400.625 C238.661465,400.625 288.75,450.713535 288.75,512.5 C288.75,574.286465 238.661465,624.375 176.875,624.375 C115.088535,624.375 65,574.286465 65,512.5 L65,512.5 Z M65,848.125 C65,786.338535 115.088535,736.25 176.875,736.25 C238.661465,736.25 288.75,786.338535 288.75,848.125 C288.75,909.911465 238.661465,960 176.875,960 C115.088535,960 65,909.911465 65,848.125 L65,848.125 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 99 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 40.1 (33804) - http://www.bohemiancoding.com/sketch -->\n    <title>lte</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"lte\" fill=\"#221F20\">\n            <path d=\"M216.16802,865.229781 L807.827993,865.229781 L807.827993,803.821277 L216.16802,803.821277 L216.16802,865.229781 Z M765.733374,148.234612 L236.045691,403.576656 L236.045691,461.269946 L765.733374,716.61199 L765.733374,642.89437 L320.234461,433.49137 L320.234461,431.355232 L765.733374,221.952232 L765.733374,148.234612 Z\" id=\"Combined-Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 100 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>map</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"map\" fill=\"#000000\">\n            <path d=\"M721.875,558 C766.4375,484.6875 800.9375,407.0625 800.9375,340.9375 C800.9375,182.8125 673,53.4375 513.4375,53.4375 C355.3125,53.4375 225.9375,181.375 225.9375,340.9375 C225.9375,407.0625 260.4375,483.25 303.5625,555.125 L52,703.1875 L513.4375,969.125 L972,703.1875 L721.875,558 L721.875,558 Z M507.6875,250.375 C558,250.375 598.25,290.625 598.25,340.9375 C598.25,391.25 558,431.5 507.6875,431.5 C457.375,431.5 417.125,391.25 417.125,340.9375 C417.125,290.625 457.375,250.375 507.6875,250.375 L507.6875,250.375 Z M165.5625,703.1875 L309.3125,619.8125 L374,657.1875 C391.25,680.1875 408.5,701.75 424.3125,720.4375 L310.75,786.5625 L165.5625,703.1875 L165.5625,703.1875 Z M513.4375,903 L368.25,819.625 L463.125,765 C493.3125,798.0625 513.4375,819.625 513.4375,819.625 C513.4375,819.625 533.5625,799.5 563.75,766.4375 L657.1875,819.625 L513.4375,903 L513.4375,903 Z M601.125,721.875 C618.375,700.3125 638.5,677.3125 657.1875,651.4375 L711.8125,619.8125 L857,703.1875 L713.25,786.5625 L601.125,721.875 L601.125,721.875 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 101 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 39.1 (31720) - http://www.bohemiancoding.com/sketch -->\n    <title>move-vertical</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"move-vertical\" fill=\"#000000\">\n            <path d=\"M572.768907,514.298627 C572.768907,547.453841 546.095163,574.127585 512.939949,574.127585 C479.784734,574.127585 453.11099,547.453841 453.11099,514.298627 C453.11099,481.143413 479.784734,454.469669 512.939949,454.469669 C546.095163,454.469669 572.768907,481.143413 572.768907,514.298627 Z M510.94594,209.409553 C511.441819,208.863482 512.68206,208.863482 513.177939,209.409553 L641.889878,373.877729 C642.261878,374.423799 641.641757,374.970098 640.773879,374.970098 L383.226121,374.970098 C382.358243,374.970098 381.738122,374.345855 382.110122,373.877729 L510.94594,209.409553 Z M510.94594,815.585438 C511.441819,816.131508 512.68206,816.131508 513.177939,815.585438 L641.889878,651.117261 C642.261878,650.571191 641.641757,650.024892 640.773879,650.024892 L383.226121,650.024892 C382.358243,650.024892 381.738122,650.649136 382.110122,651.117261 L510.94594,815.585438 Z\" id=\"Combined-Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 102 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>move</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"move\" fill=\"#000000\">\n            <polygon id=\"Shape\" points=\"972 512 742 339.5 742 454.5 569.5 454.5 569.5 282 684.5 282 512 52 339.5 282 454.5 282 454.5 454.5 282 454.5 282 339.5 52 512 282 684.5 282 569.5 454.5 569.5 454.5 742 339.5 742 512 972 684.5 742 569.5 742 569.5 569.5 742 569.5 742 684.5\"></polygon>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 103 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>number</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"number\" fill=\"#000000\">\n            <path d=\"M951.875,417.125 L972,306.4375 L753.5,306.4375 L792.3125,86.5 L681.625,86.5 L641.375,307.875 L454.5,307.875 L493.3125,87.9375 L382.625,87.9375 L343.8125,307.875 L123.875,307.875 L103.75,418.5625 L322.25,418.5625 L289.1875,606.875 L72.125,606.875 L52,716.125 L270.5,716.125 L231.6875,936.0625 L342.375,936.0625 L382.625,716.125 L569.5,716.125 L530.6875,936.0625 L641.375,936.0625 L680.1875,716.125 L900.125,716.125 L920.25,605.4375 L700.3125,605.4375 L733.375,417.125 L951.875,417.125 L951.875,417.125 Z M622.6875,417.125 L589.625,605.4375 L401.3125,605.4375 L434.375,417.125 L622.6875,417.125 L622.6875,417.125 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 104 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>official</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"official\" fill=\"#000000\">\n            <path d=\"M512,110.046875 C290.023438,110.046875 110.046875,290.023438 110.046875,512 C110.046875,733.976563 290.023438,913.953125 512,913.953125 C733.976563,913.953125 913.953125,733.976563 913.953125,512 C913.953125,290.023438 733.976563,110.046875 512,110.046875 L512,110.046875 Z M416.433594,771.054687 L197.574219,513.804687 L288.957031,435.464844 L416.433594,585.992187 L717.570312,235.144531 L808.953125,313.484375 L416.433594,771.054687 L416.433594,771.054687 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 105 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\" >\n<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" viewBox=\"0 0 1024 1024\">\n  <g transform=\"matrix(1 0 0 -1 0 819)\">\n   <path fill=\"currentColor\"\nd=\"M514.252 707.8h46.5892v29.8172h-46.5892v8.22161h-13.9769v-77.2444c-9.55937 -2.87784 -16.9927 -12.4536 -18.8516 -24.4709c-55.6461 -14.8367 -97.4713 -70.6419 -99.6793 -138h-52.7438v-55.1659v-49.4654h-45v-69.7058v-115.829h-35.5446v-73.0669h525.519\nv73.0669h-35.0157v112.468h0.041354v73.0669h-51v47.4816v57.1497l-47.7722 3.9e-05c-2.33559 71.2501 -48.9984 129.573 -109.458 140.156c-2.19597 10.1946 -8.46139 18.3419 -16.5186 21.6304v39.8905zM680.747 328.425v-112.468h-40.3279v112.468h40.3279z\nM482.573 328.425v-112.468h-42.6721v112.468h42.6721zM540.786 328.425v-112.468h41.4217v112.468h-41.4217zM381.689 328.425v-112.468h-42.6894v112.468h42.6894zM531.767 447.974v-46.4816h-42.7341v46.4816h42.7341zM589.917 447.974v-46.4816h39.0833v46.4816h-39.0833\nzM430.883 447.974v-46.4816h-45.733v46.4816h45.733zM816.036 694.544c168.608 -168.607 168.608 -441.973 0 -610.58c-168.607 -168.608 -441.973 -168.608 -610.58 0c-168.608 168.607 -168.608 441.973 0 610.58c168.607 168.608 441.973 168.608 610.58 0z\" />\n  </g>\n\n</svg>\n"

/***/ },
/* 106 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>paragraph-center3</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"paragraph-center3\" fill=\"#000000\">\n            <path d=\"M65,120.9375 L960,120.9375 L960,232.8125 L65,232.8125 L65,120.9375 Z M232.8125,344.6875 L792.1875,344.6875 L792.1875,456.5625 L232.8125,456.5625 L232.8125,344.6875 Z M232.8125,792.1875 L792.1875,792.1875 L792.1875,904.0625 L232.8125,904.0625 L232.8125,792.1875 Z M65,568.4375 L960,568.4375 L960,680.3125 L65,680.3125 L65,568.4375 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 107 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>paragraph-left</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"paragraph-left\" fill=\"#000000\">\n            <path d=\"M65,120.9375 L960,120.9375 L960,232.8125 L65,232.8125 L65,120.9375 Z M65,344.6875 L624.375,344.6875 L624.375,456.5625 L65,456.5625 L65,344.6875 Z M65,792.1875 L624.375,792.1875 L624.375,904.0625 L65,904.0625 L65,792.1875 Z M65,568.4375 L960,568.4375 L960,680.3125 L65,680.3125 L65,568.4375 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 108 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<!-- Generated by IcoMoon.io -->\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">\n<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"1024\" height=\"1024\" viewBox=\"0 0 1024 1024\">\n<g id=\"icomoon-ignore\">\n</g>\n<path d=\"M0 64h1024v128h-1024zM0 320h640v128h-640zM0 832h640v128h-640zM0 576h1024v128h-1024z\"></path>\n</svg>\n"

/***/ },
/* 109 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>paragraph-right3</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"paragraph-right3\" fill=\"#000000\">\n            <path d=\"M65,120.9375 L960,120.9375 L960,232.8125 L65,232.8125 L65,120.9375 Z M400.625,344.6875 L960,344.6875 L960,456.5625 L400.625,456.5625 L400.625,344.6875 Z M400.625,792.1875 L960,792.1875 L960,904.0625 L400.625,904.0625 L400.625,792.1875 Z M65,568.4375 L960,568.4375 L960,680.3125 L65,680.3125 L65,568.4375 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 110 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.8.3 (29802) - http://www.bohemiancoding.com/sketch -->\n    <title>pause</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"pause\" fill=\"#000000\">\n            <path d=\"M226.731958,131.528042 L419.753916,131.528042 L419.753916,892.576084 L226.731958,892.576084 L226.731958,131.528042 L226.731958,131.528042 Z M596.44,131.528042 L789.461958,131.528042 L789.461958,892.576084 L596.44,892.576084 L596.44,131.528042 L596.44,131.528042 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 111 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 39.1 (31720) - http://www.bohemiancoding.com/sketch -->\n    <title>pie-chart</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"pie-chart\" fill=\"#221F20\">\n            <path d=\"M472.540989,149.811209 C263.221451,151.502547 94.0390856,327.690486 94.0390856,544.795329 C94.0390856,762.950221 264.860485,939.799748 475.579308,939.799748 C686.29813,939.799748 857.11953,762.950221 857.11953,544.795329 L472.540989,544.795329 L472.540989,149.811209 Z M548.4403,84.5164354 L548.4403,476.374395 L929.960914,476.374395 C928.327228,259.669088 758.144865,84.5164354 548.4403,84.5164354 Z M591.220962,131.557402 C621.666533,135.512161 651.288576,143.717871 679.701174,156.094256 C719.870433,173.591713 756.000484,198.663743 787.087765,230.613695 C818.16435,262.552574 842.64291,299.762006 859.842519,341.207625 C871.943207,370.367285 880.06975,400.79291 884.139261,432.084043 L591.220962,432.084043 L591.220962,131.557402 Z\" id=\"Combined-Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 112 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>play</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"play\" fill=\"#000000\">\n            <path d=\"M846.931958,495.793042 C849.02,496.986084 849.02,499.97 846.931958,501.163042 L218.045,810.833042 C215.956958,811.728042 213.868042,810.236084 213.868042,808.148042 L213.868042,188.51 C213.868042,186.421958 216.255,184.93 218.045,185.825 L846.931958,495.793042 L846.931958,495.793042 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 113 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>plus2</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"plus2\" fill=\"#000000\">\n            <path d=\"M932.03125,400.625 L624.375,400.625 L624.375,92.96875 C624.375,77.5230078 611.851992,65 596.40625,65 L428.59375,65 C413.148008,65 400.625,77.5230078 400.625,92.96875 L400.625,400.625 L92.96875,400.625 C77.5230078,400.625 65,413.148008 65,428.59375 L65,596.40625 C65,611.851992 77.5230078,624.375 92.96875,624.375 L400.625,624.375 L400.625,932.03125 C400.625,947.476992 413.148008,960 428.59375,960 L596.40625,960 C611.851992,960 624.375,947.476992 624.375,932.03125 L624.375,624.375 L932.03125,624.375 C947.476992,624.375 960,611.851992 960,596.40625 L960,428.59375 C960,413.148008 947.476992,400.625 932.03125,400.625 L932.03125,400.625 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 114 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>plus3</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"plus3\" fill=\"#000000\">\n            <polygon id=\"Shape\" points=\"904.0625 456.5625 568.4375 456.5625 568.4375 120.9375 456.5625 120.9375 456.5625 456.5625 120.9375 456.5625 120.9375 568.4375 456.5625 568.4375 456.5625 904.0625 568.4375 904.0625 568.4375 568.4375 904.0625 568.4375\"></polygon>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 115 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>presentation</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"presentation\" fill=\"#000000\">\n            <path d=\"M899.375,60 L123.125,60 C99.40625,60 80,79.40625 80,103.125 L80,764.375 C80,788.09375 99.40625,807.5 123.125,807.5 L379.25875,807.5 L261.973125,924.785625 C249.342891,937.415859 249.342891,957.894844 261.973125,970.525078 C268.289141,976.841094 276.567344,980 284.84375,980 C293.120156,980 301.398359,976.841094 307.714375,970.526875 L470.74125,807.5 L482.5,807.5 L482.5,951.25 C482.5,967.128984 495.372813,980 511.25,980 C527.127188,980 540,967.128984 540,951.25 L540,807.5 L551.760547,807.5 L714.787422,970.526875 C721.101641,976.841094 729.379844,980 737.65625,980 C745.932656,980 754.210859,976.841094 760.526875,970.526875 C773.158906,957.896641 773.158906,937.417656 760.526875,924.787422 L643.239453,807.5 L899.375,807.5 C923.09375,807.5 942.5,788.09375 942.5,764.375 L942.5,103.125 C942.5,79.40625 923.09375,60 899.375,60 L899.375,60 Z M425,232.5 L655,376.25 L425,520 L425,232.5 L425,232.5 Z M798.75,692.5 L223.75,692.5 C207.872813,692.5 195,679.628984 195,663.75 C195,647.871016 207.872813,635 223.75,635 L798.75,635 C814.628984,635 827.5,647.871016 827.5,663.75 C827.5,679.628984 814.628984,692.5 798.75,692.5 L798.75,692.5 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 116 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>preview</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"preview\" fill=\"#000000\">\n            <path d=\"M297,627 C297,627 349.849688,454.5 642,454.5 L642,627 L987,397 L642,167 L642,339.5 C412,339.5 297,482.955313 297,627 L297,627 Z M699.5,742 L182,742 L182,397 L295.091719,397 C304.160547,386.292422 313.879844,376.035859 324.280156,366.291406 C363.779063,329.284766 411.035078,301.018125 464.538828,282 L67,282 L67,857 L814.5,857 L814.5,615.658125 L699.5,692.325391 L699.5,742 L699.5,742 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 117 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\" >\n<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" viewBox=\"0 0 1024 1024\">\n  <g transform=\"matrix(1 0 0 -1 0 819)\">\n   <path fill=\"currentColor\"\nd=\"M267.001 629.57h489.998v132.43h-489.998v-132.43zM102 577.254v-380.824h164.86v-191.152h490.279v191.152h164.861v380.824h-820zM814.876 466v60.3169h58.3544v-60.3169h-58.3544zM335.671 58.6238v274.133h352.657v-274.133h-352.657z\" />\n  </g>\n\n</svg>\n"

/***/ },
/* 118 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>private</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"private\" fill=\"#000000\">\n            <path d=\"M797.274453,454.5 C812.836866,454.5 826.276927,460.178956 837.595042,471.537037 C848.913159,482.895119 854.572131,496.382639 854.572131,512 L854.572131,914.5 C854.572131,930.117361 848.913159,943.604881 837.595042,954.962963 C826.276927,966.321044 812.836866,972 797.274453,972 L224.297678,972 C208.735269,972 195.295207,966.321044 183.97709,954.962963 C172.658972,943.604881 167,930.117361 167,914.5 L167,512 C167,496.382639 172.658972,482.895119 183.97709,471.537037 C195.295207,460.178956 208.735269,454.5 224.297678,454.5 L281.595356,454.5 L281.595356,282 C281.595356,218.820673 304.054404,164.693127 348.97318,119.615741 C393.891956,74.5383549 447.829045,52 510.786066,52 C573.74309,52 627.680179,74.5383549 672.598951,119.615741 C717.517727,164.693127 739.976778,218.820673 739.976778,282 L739.976778,454.5 L797.274453,454.5 L797.274453,454.5 Z M396.190709,282 L396.190709,454.5 L625.381422,454.5 L625.381422,282 C625.381422,250.055395 614.240318,222.90289 591.957778,200.541667 C569.675234,178.180443 542.618267,167 510.786066,167 C478.953864,167 451.896897,178.180443 429.614357,200.541667 C407.331813,222.90289 396.190709,250.055395 396.190709,282 L396.190709,282 L396.190709,282 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 119 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>processing</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"processing\" fill=\"#000000\">\n            <path d=\"M307.875,574.53125 L198.625,574.53125 C163.40625,574.53125 136.09375,546.5 136.09375,512 C136.09375,477.5 164.125,449.46875 198.625,449.46875 L307.875,449.46875 C343.09375,449.46875 370.40625,477.5 370.40625,512 C370.40625,546.5 343.09375,574.53125 307.875,574.53125 L307.875,574.53125 Z M323.6875,411.375 L245.34375,334.46875 C220.90625,310.03125 220.90625,271.21875 245.34375,246.78125 C270.5,221.625 309.3125,221.625 333.75,246.78125 L411.375,323.6875 C436.53125,348.125 436.53125,386.9375 411.375,411.375 C387.65625,437.25 348.125,437.25 323.6875,411.375 L323.6875,411.375 Z M334.46875,778.65625 C310.03125,803.09375 271.21875,803.09375 246.0625,778.65625 C221.625,753.5 221.625,714.6875 246.0625,690.25 L323.6875,612.625 C348.125,587.46875 386.9375,587.46875 411.375,612.625 C436.53125,637.0625 436.53125,675.875 411.375,700.3125 L334.46875,778.65625 L334.46875,778.65625 Z M574.53125,307.875 C574.53125,343.09375 546.5,370.40625 512,370.40625 C477.5,370.40625 449.46875,342.375 449.46875,307.875 L449.46875,198.625 C449.46875,163.40625 477.5,136.09375 512,136.09375 C546.5,136.09375 574.53125,164.125 574.53125,198.625 L574.53125,307.875 L574.53125,307.875 Z M574.53125,825.375 C574.53125,860.59375 546.5,887.90625 512,887.90625 C477.5,887.90625 449.46875,859.875 449.46875,825.375 L449.46875,716.125 C449.46875,680.90625 477.5,653.59375 512,653.59375 C546.5,653.59375 574.53125,681.625 574.53125,716.125 L574.53125,825.375 L574.53125,825.375 Z M700.3125,411.375 C675.875,436.53125 637.0625,436.53125 612.625,411.375 C587.46875,386.9375 587.46875,348.125 612.625,323.6875 L689.53125,246.0625 C713.96875,220.90625 752.78125,220.90625 777.21875,246.0625 C802.375,270.5 802.375,309.3125 777.21875,333.75 L700.3125,411.375 L700.3125,411.375 Z M689.53125,778.65625 L612.625,700.3125 C587.46875,675.875 587.46875,637.0625 612.625,612.625 C637.0625,587.46875 675.875,587.46875 700.3125,612.625 L777.9375,689.53125 C803.09375,713.96875 803.09375,752.78125 777.9375,777.9375 C753.5,803.09375 713.96875,803.09375 689.53125,778.65625 L689.53125,778.65625 Z M825.375,574.53125 L716.125,574.53125 C680.90625,574.53125 653.59375,546.5 653.59375,512 C653.59375,477.5 681.625,449.46875 716.125,449.46875 L825.375,449.46875 C860.59375,449.46875 887.90625,477.5 887.90625,512 C887.90625,546.5 860.59375,574.53125 825.375,574.53125 L825.375,574.53125 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 120 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>pulse</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"pulse\" fill=\"#000000\">\n            <polygon id=\"Shape\" points=\"205.120136 670.699601 228.338386 608.591679 327.876301 972 508.548872 335.717743 611.309621 686.130937 963.283118 686.130937 963.283118 608.591663 666.933134 608.591679 508.548868 52 327.876301 702.45501 245.834533 377.766408 157.706329 593.160344 61 593.160327 61 670.699601 205.120136 670.699601\"></polygon>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 121 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>puzzle</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"puzzle\" fill=\"#000000\">\n            <path d=\"M191,924.304687 L191,346.878906 L374.820312,346.878906 C418.394531,346.878906 434.746094,322.351562 434.746094,293.78125 C434.746094,265.210937 400.695312,227.027344 400.695312,176.625 C400.695312,126.222656 441.574219,99 487.84375,99 C534.113281,99 587.300781,129.007812 587.300781,188.933594 C587.300781,248.859375 569.601562,244.816406 569.601562,280.214844 C569.601562,315.613281 596.824219,340.140625 628.179688,340.140625 C659.535156,340.140625 828.351562,326.484375 828.351562,326.484375 C828.351562,326.484375 833.832031,469.515625 833.832031,519.917969 C833.832031,570.320312 794.300781,568.972656 786.125,568.972656 C786.125,568.972656 727.546875,526.746094 668.96875,526.746094 C610.390625,526.746094 595.476562,600.148437 595.476562,617.847656 C595.476562,635.546875 596.824219,710.476562 670.40625,710.476562 C711.285156,710.476562 703.109375,703.648437 730.332031,703.648437 C757.554688,703.648437 768.425781,710.476562 778.039062,758.09375 C787.5625,805.800781 799.871094,924.214844 799.871094,924.214844 L191,924.214844 L191,924.304687 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 122 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>question-inverse</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"question-inverse\" fill=\"#000000\">\n            <path d=\"M563.25,717 C563.25,745.304414 540.304414,768.25 512,768.25 C483.695586,768.25 460.75,745.304414 460.75,717 C460.75,688.695586 483.695586,665.75 512,665.75 C540.304414,665.75 563.25,688.695586 563.25,717 L563.25,717 Z\" id=\"Shape\"></path>\n            <path d=\"M512,102 C285.563086,102 102,285.563086 102,512 C102,738.436914 285.563086,922 512,922 C738.436914,922 922,738.436914 922,512 C922,285.563086 738.436914,102 512,102 L512,102 Z M512,845.125 C328.020508,845.125 178.875,695.979492 178.875,512 C178.875,328.020508 328.020508,178.875 512,178.875 C695.979492,178.875 845.125,328.020508 845.125,512 C845.125,695.979492 695.979492,845.125 512,845.125 L512,845.125 Z\" id=\"Shape\"></path>\n            <path d=\"M512,614.700195 C490.771289,614.700195 473.5625,597.491406 473.5625,576.262695 L473.5625,550.637695 C473.5625,523.717031 483.943828,499.504609 504.418203,478.671484 C519.524141,463.301289 537.873242,451.773242 555.616953,440.624766 C592.10375,417.703203 608.09375,405.408008 608.09375,383.875 C608.09375,360.450547 594.576563,344.806484 583.235898,335.807305 C565.030938,321.361211 539.731055,313.40625 512,313.40625 C469.931758,313.40625 432.088438,341.499258 419.971016,381.724102 C413.846641,402.049531 392.406523,413.561563 372.079492,407.440391 C351.754063,401.316016 340.24043,379.875898 346.363203,359.548867 C356.863047,324.698867 378.713164,293.380313 407.888828,271.363633 C438.086289,248.576602 474.087813,236.53125 512,236.53125 C557.010313,236.53125 599.280352,250.402383 631.020117,275.590156 C665.809258,303.196289 684.96875,341.651406 684.96875,383.875 C684.96875,450.147656 633.84207,482.268594 596.512852,505.720273 C565.192695,525.395469 550.4375,536.24125 550.4375,550.637695 L550.4375,576.262695 C550.4375,597.491406 533.228711,614.700195 512,614.700195 L512,614.700195 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 123 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>question</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"question\" fill=\"#000000\">\n            <path d=\"M512,102 C285.563086,102 102,285.563086 102,512 C102,738.436914 285.563086,922 512,922 C738.436914,922 922,738.436914 922,512 C922,285.563086 738.436914,102 512,102 L512,102 Z M512,768.25 C483.695586,768.25 460.75,745.304414 460.75,717 C460.75,688.695586 483.695586,665.75 512,665.75 C540.304414,665.75 563.25,688.695586 563.25,717 C563.25,745.304414 540.304414,768.25 512,768.25 L512,768.25 Z M596.512852,505.720273 C565.192695,525.395469 550.4375,536.24125 550.4375,550.637695 L550.4375,576.262695 C550.4375,597.491406 533.228711,614.700195 512,614.700195 C490.771289,614.700195 473.5625,597.491406 473.5625,576.262695 L473.5625,550.637695 C473.5625,523.717031 483.943828,499.504609 504.418203,478.671484 C519.524141,463.301289 537.873242,451.773242 555.616953,440.624766 C592.10375,417.703203 608.09375,405.408008 608.09375,383.875 C608.09375,360.450547 594.576562,344.806484 583.235898,335.807305 C565.030937,321.361211 539.731055,313.40625 512,313.40625 C469.931758,313.40625 432.088437,341.499258 419.971016,381.724102 C413.846641,402.049531 392.406523,413.561563 372.079492,407.440391 C351.754062,401.316016 340.24043,379.875898 346.363203,359.548867 C356.863047,324.698867 378.713164,293.380313 407.888828,271.363633 C438.086289,248.576602 474.087812,236.53125 512,236.53125 C557.010312,236.53125 599.280352,250.402383 631.020117,275.590156 C665.809258,303.196289 684.96875,341.651406 684.96875,383.875 C684.96875,450.147656 633.84207,482.268594 596.512852,505.720273 L596.512852,505.720273 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 124 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>quotes-left</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"quotes-left\" fill=\"#000000\">\n            <path d=\"M261.463415,456.5625 C369.485112,456.5625 457.053659,544.218311 457.053659,652.34375 C457.053659,760.470937 369.485112,848.125 261.463415,848.125 C153.441717,848.125 65.8731707,760.470937 65.8731707,652.34375 L65,624.375 C65,408.120625 240.137093,232.8125 456.180488,232.8125 L456.180488,344.6875 C381.547093,344.6875 311.379093,373.780244 258.604654,426.606221 C248.446185,436.776357 239.174859,447.596768 230.811629,458.962568 C240.798956,457.389326 251.034263,456.5625 261.463415,456.5625 L261.463415,456.5625 Z M764.409756,456.5625 C872.429707,456.5625 960,544.218311 960,652.34375 C960,760.470937 872.429707,848.125 764.409756,848.125 C656.389805,848.125 568.819512,760.470937 568.819512,652.34375 L567.946341,624.375 C567.946341,408.120625 743.083434,232.8125 959.126829,232.8125 L959.126829,344.6875 C884.493434,344.6875 814.325434,373.780244 761.550995,426.606221 C751.39078,436.776357 742.119454,447.596768 733.756224,458.962568 C743.745298,457.389326 753.978859,456.5625 764.409756,456.5625 L764.409756,456.5625 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 125 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>redo</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"redo\" fill=\"#000000\">\n            <path d=\"M65,568.4375 C65,702.09666 123.601523,822.065117 216.511963,904.0625 L290.512031,820.15625 C220.829639,758.656465 176.875,668.684492 176.875,568.4375 C176.875,383.078105 327.14585,232.8125 512.5,232.8125 C605.183193,232.8125 689.085947,270.383271 749.823584,331.120908 L624.375,456.5625 L960,456.5625 L960,120.9375 L828.922705,252.021787 C747.940938,171.036523 636.074678,120.9375 512.5,120.9375 C265.352393,120.9375 65,321.289893 65,568.4375 L65,568.4375 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 126 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>region</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"region\" fill=\"#000000\">\n            <path d=\"M359.625,228.8125 L52,52 L52,795.1875 L359.625,972 L665.8125,795.1875 L972,972 L972,228.8125 L664.375,52 L359.625,228.8125 L359.625,228.8125 Z M358.1875,904.4375 L358.1875,661.5 L112.375,520.625 L113.8125,236 L361.0625,378.3125 L361.0625,522.0625 L586.75,391.25 L588.1875,772.1875 L358.1875,904.4375 L358.1875,904.4375 Z M834,215.875 L834,445.875 L665.8125,348.125 L665.8125,118.125 L834,215.875 L834,215.875 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 127 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>search</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"search\" fill=\"#000000\">\n            <path d=\"M709.327422,586.85332 C739.472695,535.59207 756.948203,475.44707 756.948203,411.515156 C756.948203,220.886484 602.290273,66.3741016 411.661602,66.3741016 C221.03293,66.3741016 66.375,221.032031 66.375,411.515156 C66.375,601.998281 221.03293,756.656211 411.661602,756.656211 C475.44707,756.656211 535.737617,739.180703 586.999766,709.03543 L835.589336,957.624102 L957.625898,835.587539 L709.32832,586.85332 L709.327422,586.85332 Z M411.661602,641.755039 C284.381758,641.755039 181.422617,538.795898 181.422617,411.516055 C181.422617,284.236211 284.381758,181.421719 411.661602,181.421719 C538.941445,181.421719 641.900586,284.380859 641.900586,411.516055 C641.900586,538.65125 538.941445,641.755039 411.661602,641.755039 L411.661602,641.755039 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 128 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>settings</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"settings\" fill=\"#000000\">\n            <path d=\"M857,512 C857,490.4375 854.125,468.875 851.25,447.3125 L972,339.5 L819.625,167 L731.9375,244.625 C701.75,218.75 665.8125,200.0625 627,185.6875 L627,52 L397,52 L397,187.125 C358.1875,200.0625 323.6875,220.1875 292.0625,246.0625 L204.375,168.4375 L52,339.5 L172.75,447.3125 C169.875,468.875 167,490.4375 167,512 C167,533.5625 169.875,555.125 172.75,576.6875 L52,684.5 L204.375,857 L292.0625,779.375 C322.25,805.25 358.1875,823.9375 397,838.3125 L397,972 L627,972 L627,836.875 C665.8125,823.9375 700.3125,803.8125 731.9375,777.9375 L819.625,855.5625 L972,684.5 L851.25,576.6875 C854.125,555.125 857,533.5625 857,512 L857,512 Z M512,684.5 C417.125,684.5 339.5,606.875 339.5,512 C339.5,417.125 417.125,339.5 512,339.5 C606.875,339.5 684.5,417.125 684.5,512 C684.5,606.875 606.875,684.5 512,684.5 L512,684.5 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 129 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>share</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"share\" fill=\"#000000\">\n            <path d=\"M828.25,684.5 C787.676563,684.5 751.05625,701.334922 724.918906,728.370703 L337.68875,534.755625 C338.869297,527.341719 339.5,519.746328 339.5,512 C339.5,504.253672 338.869297,496.658281 337.68875,489.246172 L724.918906,295.631094 C751.05625,322.665078 787.676563,339.5 828.25,339.5 C907.641328,339.5 972,275.141328 972,195.75 C972,116.358672 907.641328,52 828.25,52 C748.858672,52 684.5,116.358672 684.5,195.75 C684.5,203.496328 685.1325,211.091719 686.31125,218.503828 L299.081094,412.120703 C272.94375,385.086719 236.323438,368.25 195.75,368.25 C116.358672,368.25 52,432.610469 52,512 C52,591.393125 116.358672,655.75 195.75,655.75 C236.323438,655.75 272.94375,638.915078 299.081094,611.881094 L686.31125,805.496172 C685.1325,812.908281 684.5,820.503672 684.5,828.25 C684.5,907.643125 748.858672,972 828.25,972 C907.641328,972 972,907.643125 972,828.25 C972,748.860469 907.641328,684.5 828.25,684.5 L828.25,684.5 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 130 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 41 (35326) - http://www.bohemiancoding.com/sketch -->\n    <title>sign-out</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"sign-out\" fill=\"#000000\">\n            <path d=\"M743.75,897.916667 L319.791667,897.916667 C277.280208,897.916667 242.708333,863.344792 242.708333,820.833333 L242.708333,705.208333 L319.791667,705.208333 L319.791667,820.833333 L743.75,820.833333 L743.75,204.166667 L319.791667,204.166667 L319.791667,319.791667 L242.708333,319.791667 L242.708333,204.166667 C242.708333,161.69375 277.280208,127.083333 319.791667,127.083333 L743.75,127.083333 C786.261458,127.083333 820.833333,161.69375 820.833333,204.166667 L820.833333,820.833333 C820.833333,863.344792 786.261458,897.916667 743.75,897.916667 Z M501.207292,331.045833 L446.709375,385.620833 L535.239583,473.958333 L204.166667,473.958333 L204.166667,551.041667 L534.93125,551.041667 L446.670833,639.45625 L501.245833,693.877083 L682.622917,512.153125 L501.207292,331.045833 Z\" id=\"Combined-Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 131 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 39.1 (31720) - http://www.bohemiancoding.com/sketch -->\n    <title>sort-asc</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"sort-asc\" fill=\"#020302\">\n            <g id=\"Page-1\" transform=\"translate(122.000000, 127.000000)\">\n                <polygon id=\"Fill-1\" points=\"328.233054 323.216016 483.686871 167.762199 328.233054 12.3071503 328.233054 151.697194 24.8576203 151.697194 24.8576203 188.619752 328.233054 188.619752\"></polygon>\n                <polygon id=\"Fill-2\" points=\"558.447545 768.443366 779.309675 768.443366 779.309675 0 558.447545 0\"></polygon>\n                <polygon id=\"Fill-3\" points=\"277.554257 768.443366 498.415157 768.443366 498.415157 406.597369 277.554257 406.597369\"></polygon>\n                <polygon id=\"Fill-4\" points=\"0 768.443366 220.860899 768.443366 220.860899 577.028207 0 577.028207\"></polygon>\n            </g>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 132 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 39.1 (31720) - http://www.bohemiancoding.com/sketch -->\n    <title>sort-az</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"sort-az\" fill=\"#020302\">\n            <path d=\"M791.99991,148.866704 L791.99991,283.674933 L493.491947,283.674933 L493.491947,327.042547 L791.99991,327.042547 L791.99991,456.22166 L974.589131,302.544182 L791.99991,148.866704 Z M895.910449,740.063274 L888.668057,739.174237 L865.661538,807.590986 L865.50686,808.111397 C864.137889,813.413811 861.142632,817.098612 850.985937,817.847427 L850.75898,817.866219 C822.308379,820.661985 773.480782,820.962667 733.490059,820.99447 C788.254683,752.532908 896.362917,616.219823 926.311146,576.334628 L928.453506,573.482485 L927.683008,570.081018 C924.74413,557.082299 920.32497,542.425491 916.774608,530.649738 L915.000872,524.770535 L749.669071,524.770535 C715.514183,524.770535 693.143722,523.965343 683.59851,523.210746 L675.806796,522.596372 L674.343862,529.723116 C670.750132,547.200265 667.157848,564.875459 663.564118,582.552098 C659.97328,600.217173 656.383887,617.882248 652.793048,635.349278 L651.299757,642.611907 L658.972933,644.606818 C675.036298,648.78601 687.494368,651.379393 698.180148,652.768603 L705.718885,653.748711 L726.415356,584.226088 C727.625312,580.210247 728.233905,578.195099 737.456751,578.195099 L737.742977,578.190762 C759.752041,577.514227 809.264846,576.827573 839.457379,576.649766 C803.028583,625.153552 752.790093,690.16016 708.161927,747.907029 C685.015186,777.858149 663.152126,806.14829 644.907371,829.941209 L642.566965,832.992843 L643.575985,836.618376 C646.266222,846.28068 650.115821,856.469178 653.511505,865.456394 L656.592051,873.628298 L810.009324,873.628298 C846.24152,873.628298 874.696457,874.018606 891.698008,874.251346 C898.918715,874.349646 904.135839,874.421925 906.985092,874.421925 L914.121955,874.421925 L915.496709,867.925456 C919.873947,847.246332 924.541748,826.502157 929.056316,806.440298 C932.663056,790.415965 936.391225,773.845199 939.91123,757.567888 L941.440661,750.497522 L934.034918,748.311794 C920.274374,744.255476 907.446234,741.479949 895.910449,740.063274 Z M467.796491,609.618549 C426.83578,465.013576 384.480076,315.486379 348.528324,194.604936 L346.6852,188.403368 L346.179245,188.403368 C344.171324,181.538274 342.180751,174.778709 340.214752,168.165148 C323.188627,168.165148 305.352973,169.17995 296.435146,170.194752 C294.321697,177.020814 292.176446,184.007337 290.008065,191.108061 L289.827367,191.128299 L288.150486,196.540578 C263.082559,277.479002 234.704238,370.71359 204.6606,469.422617 C168.851961,587.071727 131.83192,708.701983 100.633258,808.584827 L50.2227435,811.966055 L50.2227435,820.077245 C50.2227435,827.455521 50.031926,834.97402 49.8295438,842.934869 C49.6242704,851.033048 49.4117691,859.407334 49.4117691,867.764273 L49.4117691,876.437796 L58.085292,876.437796 C68.92575,876.437796 80.4644266,876.197829 92.6796379,875.943405 C104.909305,875.688982 117.553856,875.42444 129.429354,875.42444 L245.476753,875.42444 L245.914766,867.212059 C246.738751,851.763069 246.738751,834.194849 246.738751,820.077245 L246.738751,811.757891 L176.389253,808.821903 C179.160443,798.892165 182.076192,788.483938 185.065667,777.805385 C194.764111,743.177791 205.679739,704.204762 214.736343,670.430064 L399.528638,669.462966 C407.811853,697.372917 417.082403,730.622867 426.052271,762.790072 C430.545156,778.908368 434.818312,794.234483 438.925225,808.748178 L375.319391,811.811377 L375.319391,820.077245 C375.319391,827.455521 375.128573,834.97402 374.927636,842.934869 C374.720917,851.033048 374.509862,859.407334 374.509862,867.764273 L374.509862,876.437796 L383.183385,876.437796 C398.891135,876.437796 415.508159,876.203611 433.099509,875.956416 C451.712889,875.69621 470.959436,875.42444 490.19731,875.42444 L574.626827,875.42444 L575.06484,867.212059 C575.888824,851.763069 575.888824,834.194849 575.888824,820.077245 L575.888824,811.921242 L524.410021,808.751069 C507.031172,748.130373 487.953758,680.783359 467.796491,609.618549 Z M233.179144,603.443001 C230.088478,603.443001 227.33608,602.192568 225.474164,599.922996 C222.243277,595.983771 223.223385,591.071666 223.808848,588.135679 L223.992437,587.401321 L270.586602,427.695744 C281.854954,388.725606 293.272201,349.39118 303.910277,313.754565 L305.62908,307.995346 L320.786061,307.995346 L322.428248,313.902015 C339.762284,376.273318 372.804069,495.628221 399.349386,594.223046 L402.103229,604.44913 L233.179144,603.443001 Z\" id=\"Combined-Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 133 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 39.1 (31720) - http://www.bohemiancoding.com/sketch -->\n    <title>sort-desc</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"sort-desc\" fill=\"#020302\">\n            <path d=\"M746.1752,279.850009 L442.526342,279.850009 L442.526342,316.809882 L746.1752,316.809882 L746.1752,451.542172 L901.770356,295.932482 L746.1752,140.320327 L746.1752,279.850009 Z M122,897.219971 L343.059956,897.219971 L343.059956,128 L122,128 L122,897.219971 Z M403.14645,897.219971 L624.206405,897.219971 L624.206405,535.008285 L403.14645,535.008285 L403.14645,897.219971 Z M680.95086,897.219971 L902.012047,897.219971 L902.012047,705.611364 L680.95086,705.611364 L680.95086,897.219971 Z\" id=\"Combined-Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 134 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 39.1 (31720) - http://www.bohemiancoding.com/sketch -->\n    <title>sort-za</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"sort-za\" fill=\"#221F20\">\n            <path d=\"M758.718083,308.288106 L506.537692,308.288106 L506.537692,342.560295 L758.718083,342.560295 L758.718083,465.247593 L928.247157,322.643869 L758.718083,180.040145 L758.718083,308.288106 Z M921.126221,863.408894 L924.401068,862.402148 L924.645396,858.989209 C925.398382,848.431947 925.395525,836.235332 924.64111,827.158914 L924.246756,822.43792 L868.828681,824.090125 L868.500053,820.031726 C868.457189,819.493367 868.424326,818.847908 868.421468,818.081067 C869.171597,786.362156 869.900293,696.754661 869.900293,662.658117 C869.900293,602.324783 842.539887,537.855939 765.748146,537.855939 C706.63658,537.855939 664.227878,571.472673 630.542101,604.359695 L627.21153,607.609841 L630.21776,611.162724 C638.061962,620.424783 647.60217,630.777841 656.397964,639.570085 L660.085739,643.255774 L663.614916,639.417288 C691.193931,609.426267 722.214966,592.224484 748.728084,592.224484 C765.22377,592.224484 776.971499,596.404263 785.702996,605.382148 C799.176736,619.235253 805.590693,646.066093 805.307787,687.405493 L805.279211,691.680949 L801.001334,691.660957 C787.767636,691.598125 773.713797,691.355363 759.228456,690.942669 L759.01842,690.939813 C701.61429,690.939813 666.322523,710.269328 646.837753,726.484357 C623.645204,745.785312 609.797115,771.687947 609.797115,795.774156 C609.797115,816.664484 620.531813,836.546637 640.022298,851.757778 C657.260969,865.212468 679.366189,873.245012 699.152439,873.245012 C725.912743,873.245012 752.794496,867.988515 804.051857,841.825983 L807.492448,840.068105 L809.595665,843.309683 C818.278583,856.678693 824.472502,865.895056 831.217945,871.962661 L832.643904,873.245012 L834.562804,873.245012 C867.902808,873.245012 910.151482,866.786133 921.126221,863.408894 Z M803.664648,795.342898 L725.068312,824.054424 L724.30961,824.054424 C698.089399,824.054424 680.473521,810.014251 680.473521,789.118211 C680.473521,753.755024 712.364705,733.474456 767.967098,733.474456 C784.401345,733.474456 794.844564,733.902858 799.608238,734.157044 L803.664648,734.375529 L803.664648,795.342898 Z M331.700279,869.19204 C402.943926,869.19204 460.845284,869.761815 491.950619,870.068837 L492.710749,870.077405 C504.667085,870.194502 512.567011,870.273042 516.471967,870.273042 L519.949706,870.273042 L520.666972,866.870099 C528.11825,831.511196 531.238785,794.143086 534.259303,758.005918 C536.702579,728.766028 539.227298,698.532245 544.036694,670.014928 L544.665373,666.293539 L541.049039,665.202541 C524.499058,660.213082 505.624392,656.218944 489.260157,654.245437 L485.959591,653.845594 L441.83631,767.073768 L441.629132,767.696379 C436.196771,787.254376 427.342396,791.429871 419.469617,793.804648 C383.056229,804.7846 344.446751,804.496143 216.494807,803.540806 L195.262595,803.383725 L199.393303,796.864869 C239.493037,733.604119 278.415427,652.023456 323.486013,557.562163 C374.016108,451.655385 431.288787,331.61847 500.700691,218.468837 L501.616562,216.977997 L501.222209,215.268671 C497.114361,197.424285 491.55055,174.610431 484.949418,156.413326 L483.924957,153.588727 L207.59471,153.585871 C190.481775,152.993247 184.616483,152.394912 180.734389,151.999354 C177.490975,151.668056 175.153432,151.428151 168.935222,151.428151 L165.270308,151.428151 L164.70021,155.048151 C159.516464,188.032277 156.758849,228.947559 154.088391,268.51623 C151.680835,304.274975 149.194694,341.180411 144.943965,371.432758 L144.416732,375.184135 L148.07736,376.166604 C158.783481,379.035472 169.893958,380.973279 180.638658,382.846825 C186.245334,383.823583 192.043471,384.834612 197.614427,385.955598 L201.433653,386.723867 L247.633005,234.198344 C248.603171,230.386991 248.474578,227.04688 247.211504,224.092332 L245.158295,219.287086 L250.276315,218.21608 C253.269686,217.589184 259.685072,217.272166 286.429658,217.272166 C302.67673,217.272166 315.621807,217.472088 330.610092,217.703425 L330.710109,221.988877 L330.777264,217.704853 C348.447437,217.977602 368.475157,218.28748 399.124699,218.343172 L406.677423,218.357452 L402.7939,224.830612 C353.382569,307.200963 302.956778,412.984932 254.191272,515.287417 C198.983233,631.103141 146.84572,740.481405 97.1672002,816.087283 L95.9998571,817.868009 L96.7114077,819.87436 C99.3804369,827.379969 102.096617,835.298273 104.72421,842.955251 L104.86995,843.382226 C107.014603,849.632616 109.219267,856.058652 111.411072,862.301902 L117.416387,860.168458 L117.416387,869.19204 L331.700279,869.19204 Z\" id=\"Combined-Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 135 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>stories-icon</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"stories-icon\" fill=\"#000000\">\n            <path d=\"M229.253633,568.426367 L794.747266,568.426367 L794.747266,624.852734 L229.253633,624.852734 L229.253633,568.426367 L229.253633,568.426367 Z M229.253633,681.586367 L794.747266,681.586367 L794.747266,738.012734 L229.253633,738.012734 L229.253633,681.586367 L229.253633,681.586367 Z M229.253633,455.573633 L512,455.573633 L512,512 L229.253633,512 L229.253633,455.573633 L229.253633,455.573633 Z M229.253633,342.413633 L512,342.413633 L512,398.84 L229.253633,398.84 L229.253633,342.413633 L229.253633,342.413633 Z M229.253633,229.253633 L512,229.253633 L512,285.68 L229.253633,285.68 L229.253633,229.253633 L229.253633,229.253633 Z M59.6663672,59.6663672 L59.6663672,964.332734 L964.332734,964.332734 L964.332734,59.6663672 L59.6663672,59.6663672 L59.6663672,59.6663672 Z M907.906367,907.906367 L116.092734,907.906367 L116.092734,116.092734 L907.599102,116.092734 L907.599102,907.906367 L907.906367,907.906367 Z M568.426367,229.253633 L794.44,229.253633 L794.44,512 L568.426367,512 L568.426367,229.253633 L568.426367,229.253633 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 136 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>stories-menu</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"stories-menu\" fill=\"#000000\">\n            <path d=\"M303.773633,478.746367 L720.227266,478.746367 L720.227266,520.452734 L303.773633,520.452734 L303.773633,478.746367 L303.773633,478.746367 Z M303.773633,562.16 L720.227266,562.16 L720.227266,603.866367 L303.773633,603.866367 L303.773633,562.16 L303.773633,562.16 Z M303.773633,395.64 L512,395.64 L512,437.346367 L303.773633,437.346367 L303.773633,395.64 L303.773633,395.64 Z M303.773633,312.226367 L512,312.226367 L512,353.932734 L303.773633,353.932734 L303.773633,312.226367 L303.773633,312.226367 Z M303.773633,228.813633 L512,228.813633 L512,270.52 L303.773633,270.52 L303.773633,228.813633 L303.773633,228.813633 Z M178.653633,104 L178.653633,770.386367 L845.04,770.386367 L845.04,104 L178.653633,104 L178.653633,104 Z M803.64,728.986367 L220.36,728.986367 L220.36,145.706367 L803.333633,145.706367 L803.64,728.986367 L803.64,728.986367 Z M553.706367,228.813633 L720.226367,228.813633 L720.226367,437.04 L553.706367,437.04 L553.706367,228.813633 L553.706367,228.813633 Z M263.293633,1004.06637 L205.64,853.186367 L204.72,853.186367 C205.946367,865.146367 206.253633,879.252734 206.253633,895.812734 L206.253633,1004.06637 L187.853633,1004.06637 L187.853633,833.866367 L217.6,833.866367 L271.573633,974.32 L272.493633,974.32 L326.773633,833.866367 L356.213633,833.866367 L356.213633,1004.06637 L336.28,1004.06637 L336.28,894.28 C336.28,881.706367 336.893633,867.906367 337.813633,853.186367 L336.893633,853.186367 L278.627266,1003.76 L263.293633,1003.76 L263.293633,1004.06637 Z M498.2,1004.06637 L403.133633,1004.06637 L403.133633,833.866367 L498.2,833.866367 L498.2,851.346367 L423.066367,851.346367 L423.066367,906.24 L493.6,906.24 L493.6,923.72 L423.066367,923.72 L423.066367,986.28 L498.2,986.28 L498.2,1004.06637 L498.2,1004.06637 Z M669.013633,1004.06637 L646.32,1004.06637 L553.093633,861.16 L552.173633,861.16 C553.4,878.026367 554.013633,893.36 554.013633,907.16 L554.013633,1004.06637 L535.613633,1004.06637 L535.613633,833.866367 L558,833.866367 L650.92,976.16 L651.84,976.16 C651.533633,974.013633 651.226367,967.266367 650.92,955.92 C650.306367,944.573633 650.306367,936.293633 650.306367,931.386367 L650.306367,833.866367 L668.706367,833.866367 L668.706367,1004.06637 L669.013633,1004.06637 Z M844.426367,833.866367 L844.426367,943.96 C844.426367,963.28 838.6,978.613633 826.946367,989.653633 C815.292734,1000.69363 799.04,1006.21363 778.492734,1006.21363 C757.945469,1006.21363 741.999102,1000.69363 730.959102,989.347266 C719.612734,978.307266 714.092734,962.667266 714.092734,943.347266 L714.092734,833.867266 L734.026367,833.867266 L734.026367,944.880898 C734.026367,958.987266 738.012734,970.027266 745.68,977.694531 C753.347266,985.361797 765,989.040898 780.026367,989.040898 C794.44,989.040898 805.48,985.360898 813.146367,977.694531 C820.812734,970.028164 824.8,958.988164 824.8,944.880898 L824.8,833.867266 L844.426367,833.867266 L844.426367,833.866367 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 137 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>story</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"story\" fill=\"#000000\">\n            <path d=\"M229.253633,568.426367 L794.747266,568.426367 L794.747266,624.852734 L229.253633,624.852734 L229.253633,568.426367 L229.253633,568.426367 Z M229.253633,681.586367 L794.747266,681.586367 L794.747266,738.012734 L229.253633,738.012734 L229.253633,681.586367 L229.253633,681.586367 Z M229.253633,455.573633 L512,455.573633 L512,512 L229.253633,512 L229.253633,455.573633 L229.253633,455.573633 Z M229.253633,342.413633 L512,342.413633 L512,398.84 L229.253633,398.84 L229.253633,342.413633 L229.253633,342.413633 Z M229.253633,229.253633 L512,229.253633 L512,285.68 L229.253633,285.68 L229.253633,229.253633 L229.253633,229.253633 Z M59.6663672,59.6663672 L59.6663672,964.332734 L964.332734,964.332734 L964.332734,59.6663672 L59.6663672,59.6663672 L59.6663672,59.6663672 Z M907.906367,907.906367 L116.092734,907.906367 L116.092734,116.092734 L907.599102,116.092734 L907.599102,907.906367 L907.906367,907.906367 Z M568.426367,229.253633 L794.44,229.253633 L794.44,512 L568.426367,512 L568.426367,229.253633 L568.426367,229.253633 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 138 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>table</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"table\" fill=\"#000000\">\n            <path d=\"M52,52 L52,972 L972,972 L972,52 L52,52 L52,52 Z M339.5,914.5 L109.5,914.5 L109.5,742 L339.5,742 L339.5,914.5 L339.5,914.5 Z M339.5,684.5 L109.5,684.5 L109.5,512 L339.5,512 L339.5,684.5 L339.5,684.5 Z M339.5,454.5 L109.5,454.5 L109.5,282 L339.5,282 L339.5,454.5 L339.5,454.5 Z M627,914.5 L397,914.5 L397,742 L627,742 L627,914.5 L627,914.5 Z M627,684.5 L397,684.5 L397,512 L627,512 L627,684.5 L627,684.5 Z M627,454.5 L397,454.5 L397,282 L627,282 L627,454.5 L627,454.5 Z M914.5,914.5 L684.5,914.5 L684.5,742 L914.5,742 L914.5,914.5 L914.5,914.5 Z M914.5,684.5 L684.5,684.5 L684.5,512 L914.5,512 L914.5,684.5 L914.5,684.5 Z M914.5,454.5 L684.5,454.5 L684.5,282 L914.5,282 L914.5,454.5 L914.5,454.5 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 139 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>tag</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"tag\" fill=\"#000000\">\n            <path d=\"M460.876095,52 L52,52 L52,460.876095 L563.123905,971.884856 L972,563.123905 L460.876095,52 L460.876095,52 Z M268.81602,359.204005 C218.958698,359.204005 178.428035,318.673342 178.428035,268.81602 C178.428035,218.958698 218.958698,178.428035 268.81602,178.428035 C318.673342,178.428035 359.204005,218.958698 359.204005,268.81602 C359.204005,318.673342 318.673342,359.204005 268.81602,359.204005 L268.81602,359.204005 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 140 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>text</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"text\" fill=\"#000000\">\n            <path d=\"M564.189252,858.752826 L753.944586,887.342207 L732.832053,971.052982 L510.556683,954.629229 L280.030147,971.052982 L263.527817,879.353694 L448.672946,858.752826 L448.672946,190.275963 L206.638782,156.318761 L214.889947,290.2156 L110.375194,290.2156 L109,52.9646268 C109,52.9646268 379.461299,70.5123107 514.691946,70.5123107 C647.624151,70.5123107 913.488558,52.9646268 913.488558,52.9646268 L912.113363,290.2156 L806.223417,290.2156 L814.47458,154.950115 L569.690028,184.801379 L564.189252,858.752826 L564.189252,858.752826 Z\" id=\"T\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 141 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\" >\n<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" viewBox=\"0 0 1024 1024\">\n  <g transform=\"matrix(1 0 0 -1 0 819)\">\n   <path fill=\"currentColor\"\nd=\"M972 669.451c-25.306 -37.8693 -57.3086 -71.1296 -94.184 -97.7539c0.363437 -8.09706 0.545155 -16.2413 0.545155 -24.4292c0 -249.541 -189.849 -537.288 -537.025 -537.288c-106.591 0 -205.806 31.2604 -289.336 84.839\nc14.7663 -1.74398 29.7917 -2.63618 45.0258 -2.63618c88.4296 0 169.816 30.1898 234.413 80.836c-82.5944 1.52514 -152.3 56.1206 -176.317 131.145c11.5223 -2.20523 23.3475 -3.38696 35.5091 -3.38696c17.2161 0 33.8905 2.30623 49.7303 6.62242\nc-86.3465 17.3456 -151.408 93.6701 -151.408 185.165c0 0.794556 0 1.58575 0.0134606 2.37357c25.4507 -14.1438 54.5525 -22.6381 85.4952 -23.6178c-50.6456 33.8629 -83.9707 91.6635 -83.9707 157.177c0 34.6069 9.30802 67.0457 25.555 94.936\nc93.0937 -114.248 232.172 -189.427 389.042 -197.302c-3.21709 13.8206 -4.88957 28.2337 -4.88957 43.034c0 104.285 84.5125 188.835 188.755 188.835c54.2867 0 103.341 -22.9344 137.773 -59.6355c42.9932 8.47077 83.3886 24.1868 119.857 45.825\nc-14.0933 -44.0945 -44.0196 -81.1019 -82.9915 -104.474c38.1811 4.56533 74.5584 14.7161 108.409 29.7352z\" />\n  </g>\n\n</svg>\n"

/***/ },
/* 142 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>undo</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"undo\" fill=\"#000000\">\n            <path d=\"M512.5,120.9375 C388.92707,120.9375 277.059062,171.036523 196.075547,252.021787 L65,120.9375 L65,456.5625 L400.625,456.5625 L275.174668,331.120908 C335.915801,270.383271 419.818555,232.8125 512.5,232.8125 C697.852402,232.8125 848.125,383.078105 848.125,568.4375 C848.125,668.684492 804.168613,758.656465 734.486221,820.15625 L808.486289,904.0625 C901.396729,822.065117 960,702.09666 960,568.4375 C960,321.289893 759.647607,120.9375 512.5,120.9375 L512.5,120.9375 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 143 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>user</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"user\" fill=\"#000000\">\n            <path d=\"M577.714286,679.110536 L577.714286,624.916786 C650.100625,584.124643 709.142857,482.427679 709.142857,380.714286 C709.142857,217.395804 709.142857,85 512,85 C314.857143,85 314.857143,217.395804 314.857143,380.714286 C314.857143,482.427679 373.899375,584.124643 446.285714,624.916786 L446.285714,679.110536 C223.368482,697.333929 52,806.863214 52,939.285714 L972,939.285714 C972,806.863214 800.631518,697.333929 577.714286,679.110536 L577.714286,679.110536 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 144 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>waiting</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"waiting\" fill=\"#000000\">\n            <path d=\"M167,397 C230.729167,397 282,448.270833 282,512 C282,575.729167 230.729167,627 167,627 C103.270833,627 52,575.729167 52,512 C52,448.270833 103.270833,397 167,397 L167,397 Z M512,397 C575.729167,397 627,448.270833 627,512 C627,575.729167 575.729167,627 512,627 C448.270833,627 397,575.729167 397,512 C397,448.270833 448.270833,397 512,397 L512,397 Z M857,397 C920.729167,397 972,448.270833 972,512 C972,575.729167 920.729167,627 857,627 C793.270833,627 742,575.729167 742,512 C742,448.270833 793.270833,397 857,397 L857,397 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 145 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 40.1 (33804) - http://www.bohemiancoding.com/sketch -->\n    <title>warning-alt</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"warning-alt\" fill=\"#2C2C2C\">\n            <path d=\"M512,952 C738.436747,952 922,768.436747 922,542 C922,315.563253 738.436747,132 512,132 C285.563253,132 102,315.563253 102,542 C102,768.436747 285.563253,952 512,952 Z M460.75,286.448864 L563.25,286.448864 L563.25,595.346591 L460.75,595.346591 L460.75,286.448864 Z M460.75,698.3125 L563.25,698.3125 L563.25,801.278409 L460.75,801.278409 L460.75,698.3125 Z\" id=\"Combined-Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 146 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 40.1 (33804) - http://www.bohemiancoding.com/sketch -->\n    <title>warning-alt2</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"warning-alt2\" fill=\"#2C2C2C\">\n            <path d=\"M412,81 L612,81 L612,601 L412,601 L412,81 Z M412,774.333333 L612,774.333333 L612,947.666667 L412,947.666667 L412,774.333333 Z\" id=\"Combined-Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 147 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 3.7.1 (28215) - http://www.bohemiancoding.com/sketch -->\n    <title>warning</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"warning\" fill=\"#000000\">\n            <path d=\"M931.363672,812.522852 C946.576016,842.331211 945.573359,870.170195 928.355703,898.032539 C910.470508,926.506719 884.950391,939.800898 851.798047,939.800898 L171.894687,939.800898 C138.770195,939.800898 113.24918,926.502227 95.3648828,898.032539 C78.8183594,870.842227 77.4796875,842.519883 91.3812109,812.040391 L431.349062,132.376914 C448.566719,99.2524219 475.421914,82.7984375 511.862539,82.7984375 C548.970703,82.7984375 575.494375,99.4366016 591.429062,132.561094 L931.36457,812.52375 L931.363672,812.522852 Z M461.156523,831.409805 C475.085,845.283477 491.994492,852.248164 511.862539,852.248164 C531.753047,852.248164 548.634687,845.283477 562.568555,831.409805 C576.442227,817.481328 583.406914,800.598789 583.406914,780.703789 C583.406914,760.808789 576.442227,743.931641 562.568555,729.997773 C548.640078,716.069297 531.757539,709.104609 511.862539,709.104609 C491.999883,709.104609 475.090391,716.069297 461.156523,729.997773 C447.255,743.92625 440.291211,760.808789 440.291211,780.703789 C440.291211,800.598789 447.255898,817.48043 461.156523,831.409805 L461.156523,831.409805 Z M456.8,314.2 L456.8,617.8 L567.2,617.8 L567.2,314.2 L456.8,314.2 L456.8,314.2 Z\" id=\"Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 148 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 39.1 (31720) - http://www.bohemiancoding.com/sketch -->\n    <title>windows</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"windows\" fill=\"#2C2C2C\">\n            <path d=\"M102,150 L487,150 L487,492 L102,492 L102,150 Z M523,150 L908,150 L908,492 L523,492 L523,150 Z M102,522 L487,522 L487,864 L102,864 L102,522 Z M523,522 L908,522 L908,864 L523,864 L523,522 Z\" id=\"microsoft\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 149 */
/***/ function(module, exports) {

	module.exports = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg width=\"1024px\" height=\"1024px\" viewBox=\"0 0 1024 1024\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n    <!-- Generator: Sketch 39.1 (31720) - http://www.bohemiancoding.com/sketch -->\n    <title>yahoo</title>\n    <desc>Created with Sketch.</desc>\n    <defs></defs>\n    <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\">\n        <g id=\"yahoo\" fill=\"#2C2C2C\">\n            <path d=\"M437.395519,279.03466 C438.671122,260.269079 440.03784,241.595038 442.68016,222.920996 L20,222.920996 L20,279.03466 C62.4593565,281.689303 103.734224,285.717037 146.284695,288.371681 C226.009882,385.861161 305.735068,483.350642 386.826972,582.121675 L386.826972,733.070176 C341.634181,737.09791 296.44139,739.752554 251.248598,743.780288 L251.248598,793.120035 L668.644117,793.120035 L668.644117,743.780288 C623.451326,741.034105 578.258535,739.752554 533.065743,738.379462 C534.432461,685.011981 535.708064,630.271409 537.074781,576.812389 C615.43325,507.33397 692.607231,437.947091 769.690097,368.468672 C809.507133,365.814029 849.415283,363.159386 890.599037,359.131651 L890.599037,293.680967 C772.332417,295.054058 655.341401,296.33561 537.074781,298.990253 L537.074781,353.822365 C580.900855,356.477008 624.818043,357.75856 668.644117,359.131651 C611.515327,408.562937 554.295421,456.621132 497.166631,506.052418 C438.671122,433.919356 380.175614,360.504742 321.680106,288.371681 C360.221539,284.343946 398.762972,281.689303 437.395519,279.03466 Z M973,424.000045 C931.579573,422.159591 890.684786,420.350331 849.789999,418.509876 C847.722482,505.447954 845.690008,592.82275 843.657533,679.760828 C863.071168,681.570089 883.010443,683.379349 902.424078,685.219803 C925.937704,597.845007 949.486374,510.906929 973,424.000045 Z M839.759498,785.625615 L902.336248,787.810844 L904.273806,732.326432 C881.680051,729.583015 859.085139,726.872683 836.459142,724.161266 C837.53773,744.968847 838.66358,765.314317 839.759498,785.625615 Z\" id=\"Combined-Shape\"></path>\n        </g>\n    </g>\n</svg>"

/***/ },
/* 150 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.AddFilter = undefined;
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _reactDom = __webpack_require__(151);
	
	var _reactDom2 = _interopRequireDefault(_reactDom);
	
	var _SearchablePicklist = __webpack_require__(152);
	
	var _SearchablePicklist2 = _interopRequireDefault(_SearchablePicklist);
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _icons = __webpack_require__(153);
	
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
	
	    this.bodyClickHandler = function (event) {
	      var el = _reactDom2.default.findDOMNode(_this);
	      if (_this.state.isChoosingColumn && !el.contains(event.target)) {
	        _this.toggleColumnPicklist(event);
	      }
	    };
	
	    this.bodyEscapeHandler = function (event) {
	      if (_this.state.isChoosingColumn && event.keyCode === _keycodes.ESCAPE) {
	        _this.toggleColumnPicklist();
	        _this.addFilterButton.focus();
	      }
	    };
	
	    document.body.addEventListener('click', this.bodyClickHandler);
	    document.body.addEventListener('keyup', this.bodyEscapeHandler);
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
	  onKeyDownAddFilterButton: function onKeyDownAddFilterButton(event) {
	    (0, _keycodes.isolateEventByKeys)(event, [_keycodes.ENTER, _keycodes.SPACE]);
	  },
	  onKeyUpAddFilterButton: function onKeyUpAddFilterButton(event) {
	    (0, _keycodes.isolateEventByKeys)(event, [_keycodes.ENTER, _keycodes.SPACE]);
	
	    if ((0, _keycodes.isOneOfKeys)(event, [_keycodes.ENTER, _keycodes.SPACE])) {
	      this.toggleColumnPicklist(event);
	    }
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
	    var _state = this.state,
	        isChoosingColumn = _state.isChoosingColumn,
	        searchTerm = _state.searchTerm;
	
	
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
	      onBlur: function onBlur() {
	        return _this2.setState({ isChoosingColumn: false });
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
	      'button',
	      {
	        className: 'btn btn-sm btn-alternate-2 btn-inverse btn-add-filter',
	        ref: function ref(el) {
	          return _this3.addFilterButton = el;
	        },
	        onClick: this.toggleColumnPicklist,
	        onKeyDown: this.onKeyDownAddFilterButton,
	        onKeyUp: this.onKeyUpAddFilterButton },
	      (0, _I18n.translate)('filter_bar.add_filter')
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
/* 151 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_151__;

/***/ },
/* 152 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.SearchablePicklist = undefined;
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _I18n = __webpack_require__(15);
	
	var _keycodes = __webpack_require__(17);
	
	var _SocrataIcon = __webpack_require__(29);
	
	var _SocrataIcon2 = _interopRequireDefault(_SocrataIcon);
	
	var _Picklist = __webpack_require__(21);
	
	var _Picklist2 = _interopRequireDefault(_Picklist);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var SearchablePicklist = exports.SearchablePicklist = _react2.default.createClass({
	  displayName: 'SearchablePicklist',
	
	  propTypes: {
	    options: _react.PropTypes.arrayOf(_react.PropTypes.object),
	    value: _react.PropTypes.oneOfType([_react.PropTypes.string, _react.PropTypes.object]),
	    selectedOptions: _react.PropTypes.arrayOf(_react.PropTypes.object),
	    onChangeSearchTerm: _react.PropTypes.func.isRequired,
	    onSelection: _react.PropTypes.func.isRequired,
	    onBlur: _react.PropTypes.func.isRequired,
	    onClickSelectedOption: _react.PropTypes.func,
	    canAddSearchTerm: _react.PropTypes.func
	  },
	
	  getInitialState: function getInitialState() {
	    return {
	      isValidating: false,
	      isError: false
	    };
	  },
	  componentDidMount: function componentDidMount() {
	    this.isMounted = true;
	
	    if (this.search) {
	      this.search.focus();
	    }
	  },
	  componentWillUnmount: function componentWillUnmount() {
	    this.isMounted = false;
	  },
	  onChangeSearchTerm: function onChangeSearchTerm(event) {
	    this.props.onChangeSearchTerm(event.target.value);
	    this.setState({ isError: false });
	  },
	  onClickSelectedOption: function onClickSelectedOption(selectedOption) {
	    this.props.onClickSelectedOption(selectedOption);
	  },
	  onKeyUpSearch: function onKeyUpSearch(event) {
	    var _this = this;
	
	    var canAddSearchTerm = this.props.canAddSearchTerm;
	
	
	    if (event.keyCode === _keycodes.ENTER && _lodash2.default.isFunction(canAddSearchTerm)) {
	      this.setState({ isValidating: true });
	
	      // This code runs asyncrhonously and potentially
	      // after the component is removed. Make sure we're still
	      // mounted.
	      canAddSearchTerm(event.target.value).then(function () {
	        if (_this.isMounted) {
	          _this.setState({ isValidating: false });
	        }
	      }).catch(function () {
	        if (_this.isMounted) {
	          _lodash2.default.defer(_this.focusAndSelectSearchInput);
	          _this.setState({ isError: true, isValidating: false });
	        }
	      });
	    }
	  },
	  focusAndSelectSearchInput: function focusAndSelectSearchInput() {
	    if (this.search) {
	      this.search.focus();
	      this.search.setSelectionRange(0, this.search.value.length);
	    }
	  },
	  renderSearch: function renderSearch() {
	    var _this2 = this;
	
	    var value = this.props.value;
	    var _state = this.state,
	        isValidating = _state.isValidating,
	        isError = _state.isError;
	
	    var loadingSpinner = isValidating ? _react2.default.createElement('span', { className: 'spinner-default' }) : null;
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'searchable-picklist-input-container' },
	      _react2.default.createElement(_SocrataIcon2.default, { name: 'search' }),
	      _react2.default.createElement('input', {
	        className: 'searchable-picklist-input',
	        type: 'text',
	        'aria-label': (0, _I18n.translate)('filter_bar.search'),
	        value: value || '',
	        ref: function ref(el) {
	          return _this2.search = el;
	        },
	        onKeyUp: this.onKeyUpSearch,
	        onChange: this.onChangeSearchTerm,
	        'aria-invalid': isError,
	        disabled: isValidating }),
	      loadingSpinner
	    );
	  },
	  renderSelectedOptionsPicklist: function renderSelectedOptionsPicklist() {
	    var _props = this.props,
	        selectedOptions = _props.selectedOptions,
	        onBlur = _props.onBlur,
	        value = _props.value;
	    var isValidating = this.state.isValidating;
	
	
	    if (_lodash2.default.isEmpty(selectedOptions)) {
	      return;
	    }
	
	    var picklistProps = {
	      options: selectedOptions.map(function (selectedOption) {
	        return _extends({
	          group: (0, _I18n.translate)('filter_bar.text_filter.selected_values')
	        }, selectedOption);
	      }),
	      onSelection: this.onClickSelectedOption,
	      onBlur: onBlur,
	      disabled: isValidating,
	      value: value
	    };
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'searchable-picklist-selected-options' },
	      _react2.default.createElement(_Picklist2.default, picklistProps)
	    );
	  },
	  renderPicklist: function renderPicklist() {
	    var _props2 = this.props,
	        options = _props2.options,
	        value = _props2.value,
	        onSelection = _props2.onSelection,
	        onBlur = _props2.onBlur;
	    var isValidating = this.state.isValidating;
	
	
	    if (_lodash2.default.isEmpty(options)) {
	      return _react2.default.createElement(
	        'div',
	        { className: 'alert warning' },
	        (0, _I18n.translate)('filter_bar.no_options_found')
	      );
	    }
	
	    var picklistProps = {
	      options: options,
	      value: value,
	      onSelection: onSelection,
	      onBlur: onBlur,
	      disabled: isValidating
	    };
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'searchable-picklist-suggested-options' },
	      _react2.default.createElement(_Picklist2.default, picklistProps)
	    );
	  },
	  renderError: function renderError() {
	    return this.state.isError ? _react2.default.createElement(
	      'div',
	      { className: 'alert warning' },
	      (0, _I18n.translate)('filter_bar.text_filter.keyword_not_found')
	    ) : null;
	  },
	  render: function render() {
	    return _react2.default.createElement(
	      'div',
	      { className: 'searchable-picklist' },
	      this.renderSearch(),
	      this.renderError(),
	      _react2.default.createElement(
	        'div',
	        { className: 'searchable-picklist-options' },
	        this.renderSelectedOptionsPicklist(),
	        this.renderPicklist()
	      )
	    );
	  }
	});
	
	exports.default = SearchablePicklist;

/***/ },
/* 153 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.getIconForDataType = getIconForDataType;
	var dataTypes = {
	  blob: 'socrata-icon-data',
	  calendar_date: 'socrata-icon-date',
	  checkbox: 'socrata-icon-check',
	  dataset_link: 'socrata-icon-link',
	  date: 'socrata-icon-date',
	  document: 'socrata-icon-copy-document',
	  drop_down_list: 'socrata-icon-list-2',
	  email: 'socrata-icon-email',
	  flag: 'socrata-icon-region',
	  geospatial: 'socrata-icon-geo',
	  html: 'socrata-icon-clear-formatting',
	  line: 'socrata-icon-geo',
	  link: 'socrata-icon-link',
	  list: 'socrata-icon-list-numbered',
	  location: 'socrata-icon-map',
	  money: 'socrata-icon-number',
	  multiline: 'socrata-icon-geo',
	  multipoint: 'socrata-icon-geo',
	  multipolygon: 'socrata-icon-geo',
	  nested_table: 'socrata-icon-table',
	  number: 'socrata-icon-number',
	  object: 'socrata-icon-data',
	  percent: 'socrata-icon-number',
	  photo: 'socrata-icon-chart',
	  point: 'socrata-icon-map',
	  polygon: 'socrata-icon-geo',
	  stars: null,
	  text: 'socrata-icon-text',
	  url: 'socrata-icon-link'
	};
	
	function getIconForDataType(dataType) {
	  if (dataTypes[dataType]) {
	    return dataTypes[dataType];
	  }
	
	  console.warn('Unknown icon for data type "' + dataType + '"');
	}

/***/ },
/* 154 */
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
	
	var _reactDom = __webpack_require__(151);
	
	var _reactDom2 = _interopRequireDefault(_reactDom);
	
	var _classnames = __webpack_require__(13);
	
	var _classnames2 = _interopRequireDefault(_classnames);
	
	var _CalendarDateFilter = __webpack_require__(155);
	
	var _CalendarDateFilter2 = _interopRequireDefault(_CalendarDateFilter);
	
	var _NumberFilter = __webpack_require__(164);
	
	var _NumberFilter2 = _interopRequireDefault(_NumberFilter);
	
	var _TextFilter = __webpack_require__(176);
	
	var _TextFilter2 = _interopRequireDefault(_TextFilter);
	
	var _FilterConfig = __webpack_require__(177);
	
	var _FilterConfig2 = _interopRequireDefault(_FilterConfig);
	
	var _SocrataIcon = __webpack_require__(29);
	
	var _SocrataIcon2 = _interopRequireDefault(_SocrataIcon);
	
	var _I18n = __webpack_require__(15);
	
	var _keycodes = __webpack_require__(17);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var FilterItem = exports.FilterItem = _react2.default.createClass({
	  displayName: 'FilterItem',
	
	  propTypes: {
	    filter: _react.PropTypes.shape({
	      'function': _react.PropTypes.string.isRequired,
	      columnName: _react.PropTypes.string.isRequired,
	      arguments: _react.PropTypes.oneOfType([_react.PropTypes.object, _react.PropTypes.arrayOf(_react.PropTypes.object)]),
	      isHidden: _react.PropTypes.boolean
	    }).isRequired,
	    column: _react.PropTypes.shape({
	      dataTypeName: _react.PropTypes.oneOf(['calendar_date', 'number', 'text']),
	      name: _react.PropTypes.string.isRequired
	    }).isRequired,
	    isReadOnly: _react.PropTypes.bool.isRequired,
	    onUpdate: _react.PropTypes.func.isRequired,
	    onRemove: _react.PropTypes.func.isRequired,
	    isValidTextFilterColumnValue: _react.PropTypes.func
	  },
	
	  getInitialState: function getInitialState() {
	    return {
	      isControlOpen: false,
	      isConfigOpen: false,
	      isLeftAligned: false
	    };
	  },
	  componentDidMount: function componentDidMount() {
	    var _this = this;
	
	    this.bodyClickHandler = function (event) {
	      // Avoid closing flannels if the click is inside any of these refs.
	      var flannelElements = [_this.filterControl, _this.filterConfig, _this.filterControlToggle, _this.filterConfigToggle];
	
	      // Are there any flannelElements that contain event.target?
	      var isInsideFlannels = _lodash2.default.chain(flannelElements).compact().map(_reactDom2.default.findDOMNode).invokeMap('contains', event.target).some().value();
	
	      /*
	        the third-party library used for DateRangePicker
	        adds the calendar element on the page body but not within the CalendarDateFilter div element.
	        As a result, clicking on the calendar is considered to be outside of the CalendarDateFilter div element and dismisses it.
	      */
	      var datePickerElement = document.querySelector('.react-datepicker__tether-element');
	      var isInsideDatePicker = datePickerElement && datePickerElement.contains(event.target);
	
	      // If none of the flannelElements contain event.target, close all the flannels.
	      if (!isInsideFlannels && !isInsideDatePicker) {
	        _this.closeAll();
	      }
	    };
	
	    this.bodyEscapeHandler = function (event) {
	      var _state = _this.state,
	          isControlOpen = _state.isControlOpen,
	          isConfigOpen = _state.isConfigOpen;
	
	
	      if (event.keyCode === _keycodes.ESCAPE) {
	        if (isControlOpen) {
	          _this.closeAll();
	          _this.filterControlToggle.focus();
	        } else if (isConfigOpen) {
	          _this.closeAll();
	          _this.filterConfigToggle.focus();
	        }
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
	    this.filterControlToggle.focus();
	  },
	  onKeyDownControl: function onKeyDownControl(event) {
	    if ((0, _keycodes.isOneOfKeys)(event, [_keycodes.ENTER, _keycodes.SPACE])) {
	      event.stopPropagation();
	      event.preventDefault();
	      this.toggleControl();
	    }
	  },
	  onKeyDownConfig: function onKeyDownConfig(event) {
	    if ((0, _keycodes.isOneOfKeys)(event, [_keycodes.ENTER, _keycodes.SPACE])) {
	      event.stopPropagation();
	      event.preventDefault();
	      this.toggleConfig();
	    }
	  },
	  onUpdate: function onUpdate(newFilter) {
	    this.props.onUpdate(newFilter);
	    this.closeAll();
	    this.filterControlToggle.focus();
	  },
	  onRemove: function onRemove(filter) {
	    this.props.onRemove(filter);
	    this.closeAll();
	  },
	  toggleControl: function toggleControl() {
	    this.setState({
	      isControlOpen: !this.state.isControlOpen,
	      isConfigOpen: false,
	      isLeftAligned: this.filterControlToggle.getBoundingClientRect().right < window.innerWidth / 2
	    });
	  },
	  toggleConfig: function toggleConfig() {
	    this.setState({
	      isControlOpen: false,
	      isConfigOpen: !this.state.isConfigOpen,
	      isLeftAligned: this.filterConfigToggle.getBoundingClientRect().right < window.innerWidth / 2
	    });
	  },
	  closeAll: function closeAll() {
	    this.setState({
	      isControlOpen: false,
	      isConfigOpen: false
	    });
	  },
	  renderFilterConfig: function renderFilterConfig() {
	    var _props = this.props,
	        filter = _props.filter,
	        onUpdate = _props.onUpdate;
	    var isConfigOpen = this.state.isConfigOpen;
	
	
	    if (!isConfigOpen) {
	      return null;
	    }
	
	    var configProps = {
	      filter: filter,
	      onRemove: this.onRemove,
	      onUpdate: onUpdate,
	      ref: _lodash2.default.partial(_lodash2.default.set, this, 'filterConfig')
	    };
	
	    return _react2.default.createElement(_FilterConfig2.default, configProps);
	  },
	  renderFilterConfigToggle: function renderFilterConfigToggle() {
	    var isReadOnly = this.props.isReadOnly;
	    var _state2 = this.state,
	        isLeftAligned = _state2.isLeftAligned,
	        isConfigOpen = _state2.isConfigOpen;
	
	
	    if (isReadOnly) {
	      return null;
	    }
	
	    var toggleProps = {
	      className: (0, _classnames2.default)('filter-config-toggle btn-default', {
	        left: isLeftAligned,
	        right: !isLeftAligned,
	        active: isConfigOpen
	      }),
	      'aria-label': (0, _I18n.translate)('filter_bar.configure_filter'),
	      tabIndex: '0',
	      role: 'button',
	      onClick: this.toggleConfig,
	      onKeyDown: this.onKeyDownConfig,
	      ref: _lodash2.default.partial(_lodash2.default.set, this, 'filterConfigToggle')
	    };
	
	    return _react2.default.createElement(
	      'div',
	      toggleProps,
	      _react2.default.createElement(
	        'span',
	        { className: 'kebab-icon' },
	        _react2.default.createElement(_SocrataIcon2.default, { name: 'kebab' })
	      )
	    );
	  },
	  renderFilterControl: function renderFilterControl() {
	    var _props2 = this.props,
	        filter = _props2.filter,
	        column = _props2.column,
	        isValidTextFilterColumnValue = _props2.isValidTextFilterColumnValue;
	    var isControlOpen = this.state.isControlOpen;
	
	
	    if (!isControlOpen) {
	      return null;
	    }
	
	    var filterProps = {
	      filter: filter,
	      column: column,
	      isValidTextFilterColumnValue: isValidTextFilterColumnValue,
	      onCancel: this.onCancel,
	      onUpdate: this.onUpdate,
	      ref: _lodash2.default.partial(_lodash2.default.set, this, 'filterControl')
	    };
	
	    switch (column.dataTypeName) {
	      case 'calendar_date':
	        return _react2.default.createElement(_CalendarDateFilter2.default, filterProps);
	      case 'number':
	        return _react2.default.createElement(_NumberFilter2.default, filterProps);
	      case 'text':
	        return _react2.default.createElement(_TextFilter2.default, filterProps);
	      default:
	        return null;
	    }
	  },
	  renderFilterControlToggle: function renderFilterControlToggle() {
	    var column = this.props.column;
	    var _state3 = this.state,
	        isLeftAligned = _state3.isLeftAligned,
	        isControlOpen = _state3.isControlOpen;
	
	
	    var toggleProps = {
	      className: (0, _classnames2.default)('filter-control-toggle btn-default', {
	        left: isLeftAligned,
	        right: !isLeftAligned,
	        active: isControlOpen
	      }),
	      'aria-label': (0, _I18n.translate)('filter_bar.filter') + ' ' + column.name,
	      tabIndex: '0',
	      role: 'button',
	      onClick: this.toggleControl,
	      onKeyDown: this.onKeyDownControl,
	      ref: _lodash2.default.partial(_lodash2.default.set, this, 'filterControlToggle')
	    };
	
	    return _react2.default.createElement(
	      'div',
	      toggleProps,
	      column.name,
	      _react2.default.createElement(
	        'span',
	        { className: 'arrow-down-icon' },
	        _react2.default.createElement(_SocrataIcon2.default, { name: 'arrow-down' })
	      )
	    );
	  },
	  render: function render() {
	    return _react2.default.createElement(
	      'div',
	      { className: 'filter-bar-filter' },
	      _react2.default.createElement(
	        'div',
	        { className: 'filter-control-container' },
	        this.renderFilterControlToggle(),
	        this.renderFilterControl()
	      ),
	      _react2.default.createElement(
	        'div',
	        { className: 'filter-config-container' },
	        this.renderFilterConfigToggle(),
	        this.renderFilterConfig()
	      )
	    );
	  }
	});
	
	exports.default = FilterItem;

/***/ },
/* 155 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.CalendarDateFilter = undefined;
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _DateRangePicker = __webpack_require__(156);
	
	var _DateRangePicker2 = _interopRequireDefault(_DateRangePicker);
	
	var _FilterHeader = __webpack_require__(161);
	
	var _FilterHeader2 = _interopRequireDefault(_FilterHeader);
	
	var _FilterFooter = __webpack_require__(162);
	
	var _FilterFooter2 = _interopRequireDefault(_FilterFooter);
	
	var _filters = __webpack_require__(163);
	
	var _moment = __webpack_require__(158);
	
	var _moment2 = _interopRequireDefault(_moment);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var CalendarDateFilter = exports.CalendarDateFilter = _react2.default.createClass({
	  displayName: 'CalendarDateFilter',
	
	
	  propTypes: {
	    filter: _react.PropTypes.object.isRequired,
	    column: _react.PropTypes.object.isRequired,
	    onCancel: _react.PropTypes.func.isRequired,
	    onUpdate: _react.PropTypes.func.isRequired
	  },
	
	  getInitialState: function getInitialState() {
	    var _props = this.props,
	        filter = _props.filter,
	        column = _props.column;
	
	    var values = _lodash2.default.defaultTo(filter.arguments, {
	      start: column.rangeMin,
	      end: column.rangeMax
	    });
	    var start = this.setDate(values.start);
	    var end = this.setDate(values.end);
	
	    return {
	      value: { start: start, end: end }
	    };
	  },
	  onDatePickerChange: function onDatePickerChange(newDateRange) {
	    this.updateValueState(newDateRange);
	  },
	  setDate: function setDate(date) {
	    return (0, _moment2.default)(date).isValid() ? date : (0, _moment2.default)().format();
	  },
	  isValidRange: function isValidRange(value) {
	    return (0, _moment2.default)(value.start).isBefore(value.end);
	  },
	  updateValueState: function updateValueState(newValue) {
	    var start = this.setDate(newValue.start);
	    var end = this.setDate(newValue.end);
	
	    if (this.isValidRange(newValue)) {
	      this.setState({
	        value: { start: start, end: end }
	      });
	    }
	  },
	  shouldDisableApply: function shouldDisableApply() {
	    var filter = this.props.filter;
	    var value = this.state.value;
	
	    var initialValue = filter.arguments;
	
	    return _lodash2.default.isEqual(initialValue, value);
	  },
	  clearFilter: function clearFilter() {
	    var column = this.props.column;
	    var rangeMin = column.rangeMin,
	        rangeMax = column.rangeMax;
	
	
	    this.updateValueState({
	      start: rangeMin,
	      end: rangeMax
	    });
	  },
	  updateFilter: function updateFilter() {
	    var _props2 = this.props,
	        filter = _props2.filter,
	        onUpdate = _props2.onUpdate,
	        column = _props2.column;
	    var value = this.state.value;
	
	
	    if (_lodash2.default.isEqual(_lodash2.default.at(value, 'start', 'end'), _lodash2.default.at(column, 'rangeMin', 'rangeMax'))) {
	      var isHidden = filter.isHidden;
	
	      onUpdate(_lodash2.default.merge({}, (0, _filters.getDefaultFilterForColumn)(column), { isHidden: isHidden }));
	    } else {
	      onUpdate(_lodash2.default.merge({}, filter, {
	        'function': 'timeRange',
	        arguments: value
	      }));
	    }
	  },
	  renderDateRangePicker: function renderDateRangePicker() {
	    var calendarDatePickerProps = {
	      value: this.state.value,
	      onChange: this.onDatePickerChange
	    };
	    return _react2.default.createElement(_DateRangePicker2.default, calendarDatePickerProps);
	  },
	  renderFilterFooter: function renderFilterFooter() {
	    var onCancel = this.props.onCancel;
	
	
	    var filterFooterProps = {
	      disableApplyFilter: this.shouldDisableApply(),
	      onClickApply: this.updateFilter,
	      onClickCancel: onCancel,
	      onClickClear: this.clearFilter
	    };
	
	    return _react2.default.createElement(_FilterFooter2.default, filterFooterProps);
	  },
	  render: function render() {
	    var column = this.props.column;
	
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'filter-controls calendar-date-filter' },
	      _react2.default.createElement(
	        'div',
	        { className: 'range-filter-container' },
	        _react2.default.createElement(_FilterHeader2.default, { name: column.name }),
	        this.renderDateRangePicker()
	      ),
	      this.renderFilterFooter()
	    );
	  }
	});
	
	exports.default = CalendarDateFilter;

/***/ },
/* 156 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.DateRangePicker = undefined;
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _reactDatepicker = __webpack_require__(157);
	
	var _reactDatepicker2 = _interopRequireDefault(_reactDatepicker);
	
	var _moment = __webpack_require__(158);
	
	var _moment2 = _interopRequireDefault(_moment);
	
	var _SocrataIcon = __webpack_require__(29);
	
	var _SocrataIcon2 = _interopRequireDefault(_SocrataIcon);
	
	var _dates = __webpack_require__(160);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var DateRangePicker = exports.DateRangePicker = _react2.default.createClass({
	  displayName: 'DateRangePicker',
	
	  propTypes: {
	    /**
	    * Contains two values:
	    * start: default value used as startDate
	    * end: default value used as endDate
	    */
	    value: _react.PropTypes.shape({
	      start: _react.PropTypes.string.isRequired,
	      end: _react.PropTypes.string.isRequired
	    }),
	
	    /**
	    * The onChange handler is fired when a date is selected in the calendar
	    */
	    onChange: _react.PropTypes.func.isRequired
	  },
	
	  onChangeStartDate: function onChangeStartDate(date) {
	    var _props = this.props,
	        value = _props.value,
	        onChange = _props.onChange;
	
	
	    var formattedDateRange = (0, _dates.formatToInclusiveSoqlDateRange)({
	      start: date || value.start,
	      end: value.end
	    });
	
	    onChange(formattedDateRange);
	  },
	  onChangeEndDate: function onChangeEndDate(date) {
	    var _props2 = this.props,
	        value = _props2.value,
	        onChange = _props2.onChange;
	
	
	    var formattedDateRange = (0, _dates.formatToInclusiveSoqlDateRange)({
	      start: value.start,
	      end: date || value.end
	    });
	    onChange(formattedDateRange);
	  },
	  renderDatePickerStart: function renderDatePickerStart(startDate, endDate) {
	    var props = {
	      className: 'text-input date-picker-input start',
	      selected: startDate,
	      dateFormatCalendar: 'MM-DD-YYYY',
	      selectsStart: true,
	      startDate: startDate,
	      endDate: endDate,
	      onChange: this.onChangeStartDate
	    };
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'date-range-picker-start' },
	      _react2.default.createElement(_SocrataIcon2.default, { name: 'date' }),
	      _react2.default.createElement(_reactDatepicker2.default, props)
	    );
	  },
	  renderDatePickerEnd: function renderDatePickerEnd(startDate, endDate) {
	    var props = {
	      className: 'text-input date-picker-input end',
	      selected: endDate,
	      dateFormatCalendar: 'MM-DD-YYYY',
	      selectsEnd: true,
	      startDate: startDate,
	      endDate: endDate,
	      onChange: this.onChangeEndDate
	    };
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'date-range-picker-end' },
	      _react2.default.createElement(_SocrataIcon2.default, { name: 'date' }),
	      _react2.default.createElement(_reactDatepicker2.default, props)
	    );
	  },
	  render: function render() {
	    // The third party library requires moment objects
	    var startDate = (0, _moment2.default)(this.props.value.start);
	    var endDate = (0, _moment2.default)(this.props.value.end);
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'date-range-picker' },
	      this.renderDatePickerStart(startDate, endDate),
	      _react2.default.createElement(
	        'span',
	        { className: 'range-separator' },
	        '-'
	      ),
	      this.renderDatePickerEnd(startDate, endDate)
	    );
	  }
	});
	
	exports.default = DateRangePicker;

/***/ },
/* 157 */
/***/ function(module, exports, __webpack_require__) {

	!function(e,t){ true?module.exports=t(__webpack_require__(158),__webpack_require__(14),__webpack_require__(159),__webpack_require__(151)):"function"==typeof define&&define.amd?define(["moment","react","react-onclickoutside","react-dom"],t):"object"==typeof exports?exports.DatePicker=t(require("moment"),require("react"),require("react-onclickoutside"),require("react-dom")):e.DatePicker=t(e.moment,e.React,e.onClickOutside,e.ReactDOM)}(this,function(e,t,n,r){return function(e){function t(r){if(n[r])return n[r].exports;var o=n[r]={exports:{},id:r,loaded:!1};return e[r].call(o.exports,o,o.exports,t),o.loaded=!0,o.exports}var n={};return t.m=e,t.c=n,t.p="",t(0)}([function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var a=n(1),i=r(a),s=n(5),u=r(s),p=n(3),l=r(p),c=n(136),f=r(c),d=n(146),h=r(d),y=n(124),m=r(y),g=n(4),v=n(2),b=r(v),D=n(125),w=r(D),_="react-datepicker-ignore-onclickoutside",x=(0,w.default)(u.default),T=l.default.createClass({displayName:"DatePicker",propTypes:{autoComplete:l.default.PropTypes.string,autoFocus:l.default.PropTypes.bool,className:l.default.PropTypes.string,customInput:l.default.PropTypes.element,dateFormat:l.default.PropTypes.oneOfType([l.default.PropTypes.string,l.default.PropTypes.array]),dateFormatCalendar:l.default.PropTypes.string,disabled:l.default.PropTypes.bool,dropdownMode:l.default.PropTypes.oneOf(["scroll","select"]).isRequired,endDate:l.default.PropTypes.object,excludeDates:l.default.PropTypes.array,filterDate:l.default.PropTypes.func,fixedHeight:l.default.PropTypes.bool,highlightDates:l.default.PropTypes.array,id:l.default.PropTypes.string,includeDates:l.default.PropTypes.array,inline:l.default.PropTypes.bool,isClearable:l.default.PropTypes.bool,locale:l.default.PropTypes.string,maxDate:l.default.PropTypes.object,minDate:l.default.PropTypes.object,monthsShown:l.default.PropTypes.number,name:l.default.PropTypes.string,onBlur:l.default.PropTypes.func,onChange:l.default.PropTypes.func.isRequired,onFocus:l.default.PropTypes.func,onMonthChange:l.default.PropTypes.func,openToDate:l.default.PropTypes.object,peekNextMonth:l.default.PropTypes.bool,placeholderText:l.default.PropTypes.string,popoverAttachment:l.default.PropTypes.string,popoverTargetAttachment:l.default.PropTypes.string,popoverTargetOffset:l.default.PropTypes.string,readOnly:l.default.PropTypes.bool,renderCalendarTo:l.default.PropTypes.any,required:l.default.PropTypes.bool,scrollableYearDropdown:l.default.PropTypes.bool,selected:l.default.PropTypes.object,selectsEnd:l.default.PropTypes.bool,selectsStart:l.default.PropTypes.bool,showMonthDropdown:l.default.PropTypes.bool,showWeekNumbers:l.default.PropTypes.bool,showYearDropdown:l.default.PropTypes.bool,forceShowMonthNavigation:l.default.PropTypes.bool,startDate:l.default.PropTypes.object,tabIndex:l.default.PropTypes.number,tetherConstraints:l.default.PropTypes.array,title:l.default.PropTypes.string,todayButton:l.default.PropTypes.string,utcOffset:l.default.PropTypes.number},getDefaultProps:function(){return{dateFormatCalendar:"MMMM YYYY",onChange:function(){},disabled:!1,dropdownMode:"scroll",onFocus:function(){},onBlur:function(){},onMonthChange:function(){},popoverAttachment:"top left",popoverTargetAttachment:"bottom left",popoverTargetOffset:"10px 0",tetherConstraints:[{to:"window",attachment:"together"}],utcOffset:b.default.utc().utcOffset(),monthsShown:1}},getInitialState:function(){return{open:!1,preventFocus:!1}},setFocus:function(){this.refs.input.focus()},setOpen:function(e){this.setState({open:e})},handleFocus:function(e){this.state.preventFocus||(this.props.onFocus(e),this.setOpen(!0))},cancelFocusInput:function(){clearTimeout(this.inputFocusTimeout),this.inputFocusTimeout=null},deferFocusInput:function(){var e=this;this.cancelFocusInput(),this.inputFocusTimeout=(0,f.default)(function(){return e.setFocus()})},handleDropdownFocus:function(){this.cancelFocusInput()},handleBlur:function(e){this.state.open?this.deferFocusInput():this.props.onBlur(e)},handleCalendarClickOutside:function(e){this.setOpen(!1)},handleSelect:function(e,t){var n=this;this.setState({preventFocus:!0},function(){return setTimeout(function(){return n.setState({preventFocus:!1})},50)}),this.setSelected(e,t),this.setOpen(!1)},setSelected:function(e,t){var n=e;(0,g.isSameDay)(this.props.selected,n)||(this.props.selected&&null!=n&&(n=(0,b.default)(n).set({hour:this.props.selected.hour(),minute:this.props.selected.minute(),second:this.props.selected.second()})),this.props.onChange(n,t))},onInputClick:function(){this.props.disabled||this.setOpen(!0)},onInputKeyDown:function(e){var t=this.props.selected?(0,b.default)(this.props.selected):(0,b.default)();"Enter"===e.key||"Escape"===e.key?(e.preventDefault(),this.setOpen(!1)):"Tab"===e.key?this.setOpen(!1):"ArrowLeft"===e.key?(e.preventDefault(),this.setSelected(t.subtract(1,"days"))):"ArrowRight"===e.key?(e.preventDefault(),this.setSelected(t.add(1,"days"))):"ArrowUp"===e.key?(e.preventDefault(),this.setSelected(t.subtract(1,"weeks"))):"ArrowDown"===e.key?(e.preventDefault(),this.setSelected(t.add(1,"weeks"))):"PageUp"===e.key?(e.preventDefault(),this.setSelected(t.subtract(1,"months"))):"PageDown"===e.key?(e.preventDefault(),this.setSelected(t.add(1,"months"))):"Home"===e.key?(e.preventDefault(),this.setSelected(t.subtract(1,"years"))):"End"===e.key&&(e.preventDefault(),this.setSelected(t.add(1,"years")))},onClearClick:function(e){e.preventDefault(),this.props.onChange(null,e)},renderCalendar:function(){return this.props.inline||this.state.open&&!this.props.disabled?l.default.createElement(x,{ref:"calendar",locale:this.props.locale,dateFormat:this.props.dateFormatCalendar,dropdownMode:this.props.dropdownMode,selected:this.props.selected,onSelect:this.handleSelect,openToDate:this.props.openToDate,minDate:this.props.minDate,maxDate:this.props.maxDate,selectsStart:this.props.selectsStart,selectsEnd:this.props.selectsEnd,startDate:this.props.startDate,endDate:this.props.endDate,excludeDates:this.props.excludeDates,filterDate:this.props.filterDate,onClickOutside:this.handleCalendarClickOutside,highlightDates:this.props.highlightDates,includeDates:this.props.includeDates,peekNextMonth:this.props.peekNextMonth,showMonthDropdown:this.props.showMonthDropdown,showWeekNumbers:this.props.showWeekNumbers,showYearDropdown:this.props.showYearDropdown,forceShowMonthNavigation:this.props.forceShowMonthNavigation,scrollableYearDropdown:this.props.scrollableYearDropdown,todayButton:this.props.todayButton,utcOffset:this.props.utcOffset,outsideClickIgnoreClass:_,fixedHeight:this.props.fixedHeight,monthsShown:this.props.monthsShown,onDropdownFocus:this.handleDropdownFocus,onMonthChange:this.props.onMonthChange}):null},renderDateInput:function(){var e=(0,m.default)(this.props.className,o({},_,this.state.open));return l.default.createElement(i.default,{ref:"input",id:this.props.id,name:this.props.name,autoFocus:this.props.autoFocus,date:this.props.selected,locale:this.props.locale,minDate:this.props.minDate,maxDate:this.props.maxDate,excludeDates:this.props.excludeDates,includeDates:this.props.includeDates,filterDate:this.props.filterDate,dateFormat:this.props.dateFormat,onFocus:this.handleFocus,onBlur:this.handleBlur,onClick:this.onInputClick,onKeyDown:this.onInputKeyDown,onChangeDate:this.setSelected,placeholder:this.props.placeholderText,disabled:this.props.disabled,autoComplete:this.props.autoComplete,className:e,title:this.props.title,readOnly:this.props.readOnly,required:this.props.required,tabIndex:this.props.tabIndex,customInput:this.props.customInput})},renderClearButton:function(){return this.props.isClearable&&null!=this.props.selected?l.default.createElement("a",{className:"react-datepicker__close-icon",href:"#",onClick:this.onClearClick}):null},render:function(){var e=this.renderCalendar();return this.props.inline?e:l.default.createElement(h.default,{classPrefix:"react-datepicker__tether",attachment:this.props.popoverAttachment,targetAttachment:this.props.popoverTargetAttachment,targetOffset:this.props.popoverTargetOffset,renderElementTo:this.props.renderCalendarTo,constraints:this.props.tetherConstraints},l.default.createElement("div",{className:"react-datepicker__input-container"},this.renderDateInput(),this.renderClearButton()),e)}});e.exports=T},function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}function o(e,t){var n={};for(var r in e)t.indexOf(r)>=0||Object.prototype.hasOwnProperty.call(e,r)&&(n[r]=e[r]);return n}var a=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},i=n(2),s=r(i),u=n(3),p=r(u),l=n(4),c=p.default.createClass({displayName:"DateInput",propTypes:{customInput:p.default.PropTypes.element,date:p.default.PropTypes.object,dateFormat:p.default.PropTypes.oneOfType([p.default.PropTypes.string,p.default.PropTypes.array]),disabled:p.default.PropTypes.bool,excludeDates:p.default.PropTypes.array,filterDate:p.default.PropTypes.func,includeDates:p.default.PropTypes.array,locale:p.default.PropTypes.string,maxDate:p.default.PropTypes.object,minDate:p.default.PropTypes.object,onBlur:p.default.PropTypes.func,onChange:p.default.PropTypes.func,onChangeDate:p.default.PropTypes.func},getDefaultProps:function(){return{dateFormat:"L"}},getInitialState:function(){return{value:this.safeDateFormat(this.props)}},componentWillReceiveProps:function(e){(0,l.isSameDay)(e.date,this.props.date)&&e.locale===this.props.locale&&e.dateFormat===this.props.dateFormat||this.setState({value:this.safeDateFormat(e)})},handleChange:function(e){this.props.onChange&&this.props.onChange(e),e.defaultPrevented||this.handleChangeDate(e.target.value)},handleChangeDate:function(e){if(this.props.onChangeDate){var t=(0,s.default)(e,this.props.dateFormat,this.props.locale||s.default.locale(),!0);t.isValid()&&!(0,l.isDayDisabled)(t,this.props)?this.props.onChangeDate(t):""===e&&this.props.onChangeDate(null)}this.setState({value:e})},safeDateFormat:function(e){return e.date&&e.date.clone().locale(e.locale||s.default.locale()).format(Array.isArray(e.dateFormat)?e.dateFormat[0]:e.dateFormat)||""},handleBlur:function(e){this.setState({value:this.safeDateFormat(this.props)}),this.props.onBlur&&this.props.onBlur(e)},focus:function(){this.refs.input.focus()},render:function(){var e=this.props,t=e.customInput,n=(e.date,e.locale,e.minDate,e.maxDate,e.excludeDates,e.includeDates,e.filterDate,e.dateFormat,e.onChangeDate,o(e,["customInput","date","locale","minDate","maxDate","excludeDates","includeDates","filterDate","dateFormat","onChangeDate"]));return t?p.default.cloneElement(t,a({},n,{ref:"input",value:this.state.value,onBlur:this.handleBlur,onChange:this.handleChange})):p.default.createElement("input",a({ref:"input",type:"text"},n,{value:this.state.value,onBlur:this.handleBlur,onChange:this.handleChange}))}});e.exports=c},function(t,n){t.exports=e},function(e,n){e.exports=t},function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}function o(e,t){return e&&t?e.isSame(t,"day"):!e&&!t}function a(e,t,n){var r=t.clone().startOf("day").subtract(1,"seconds"),o=n.clone().startOf("day").add(1,"seconds");return e.clone().startOf("day").isBetween(r,o)}function i(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},n=t.minDate,r=t.maxDate,a=t.excludeDates,i=t.includeDates,s=t.filterDate;return n&&e.isBefore(n,"day")||r&&e.isAfter(r,"day")||a&&a.some(function(t){return o(e,t)})||i&&!i.some(function(t){return o(e,t)})||s&&!s(e.clone())||!1}function s(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{},r=n.minDate,o=n.includeDates,a=e.clone().subtract(1,t);return r&&a.isBefore(r,t)||o&&o.every(function(e){return a.isBefore(e,t)})||!1}function u(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{},r=n.maxDate,o=n.includeDates,a=e.clone().add(1,t);return r&&a.isAfter(r,t)||o&&o.every(function(e){return a.isAfter(e,t)})||!1}function p(e){var t=e.minDate,n=e.includeDates;return n&&t?f.default.min(n.filter(function(e){return t.isSameOrBefore(e,"day")})):n?f.default.min(n):t}function l(e){var t=e.maxDate,n=e.includeDates;return n&&t?f.default.max(n.filter(function(e){return t.isSameOrAfter(e,"day")})):n?f.default.max(n):t}Object.defineProperty(t,"__esModule",{value:!0}),t.isSameDay=o,t.isDayInRange=a,t.isDayDisabled=i,t.allDaysDisabledBefore=s,t.allDaysDisabledAfter=u,t.getEffectiveMinDate=p,t.getEffectiveMaxDate=l;var c=n(2),f=r(c)},function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}var o=n(2),a=r(o),i=n(6),s=r(i),u=n(122),p=r(u),l=n(126),c=r(l),f=n(132),d=r(f),h=n(3),y=r(h),m=n(4),g=["react-datepicker__year-select","react-datepicker__month-select"],v=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=(e.className||"").split(/\s+/);return!!(0,s.default)(g,function(e){return t.indexOf(e)>=0})},b=y.default.createClass({displayName:"Calendar",propTypes:{dateFormat:y.default.PropTypes.oneOfType([y.default.PropTypes.string,y.default.PropTypes.array]).isRequired,dropdownMode:y.default.PropTypes.oneOf(["scroll","select"]).isRequired,endDate:y.default.PropTypes.object,excludeDates:y.default.PropTypes.array,filterDate:y.default.PropTypes.func,fixedHeight:y.default.PropTypes.bool,highlightDates:y.default.PropTypes.array,includeDates:y.default.PropTypes.array,locale:y.default.PropTypes.string,maxDate:y.default.PropTypes.object,minDate:y.default.PropTypes.object,monthsShown:y.default.PropTypes.number,onClickOutside:y.default.PropTypes.func.isRequired,onMonthChange:y.default.PropTypes.func,forceShowMonthNavigation:y.default.PropTypes.bool,onDropdownFocus:y.default.PropTypes.func,onSelect:y.default.PropTypes.func.isRequired,openToDate:y.default.PropTypes.object,peekNextMonth:y.default.PropTypes.bool,scrollableYearDropdown:y.default.PropTypes.bool,selected:y.default.PropTypes.object,selectsEnd:y.default.PropTypes.bool,selectsStart:y.default.PropTypes.bool,showMonthDropdown:y.default.PropTypes.bool,showWeekNumbers:y.default.PropTypes.bool,showYearDropdown:y.default.PropTypes.bool,startDate:y.default.PropTypes.object,todayButton:y.default.PropTypes.string,utcOffset:y.default.PropTypes.number},defaultProps:{onDropdownFocus:function(){}},getDefaultProps:function(){return{utcOffset:a.default.utc().utcOffset(),monthsShown:1,forceShowMonthNavigation:!1}},getInitialState:function(){return{date:this.localizeMoment(this.getDateInView()),selectingDate:null}},componentWillReceiveProps:function(e){e.selected&&!(0,m.isSameDay)(e.selected,this.props.selected)?this.setState({date:this.localizeMoment(e.selected)}):e.openToDate&&!(0,m.isSameDay)(e.openToDate,this.props.openToDate)&&this.setState({date:this.localizeMoment(e.openToDate)})},handleClickOutside:function(e){this.props.onClickOutside(e)},handleDropdownFocus:function(e){v(e.target)&&this.props.onDropdownFocus()},getDateInView:function(){var e=this.props,t=e.selected,n=e.openToDate,r=e.utcOffset,o=(0,m.getEffectiveMinDate)(this.props),i=(0,m.getEffectiveMaxDate)(this.props),s=a.default.utc().utcOffset(r);return t?t:o&&i&&n&&n.isBetween(o,i)?n:o&&n&&n.isAfter(o)?n:o&&o.isAfter(s)?o:i&&n&&n.isBefore(i)?n:i&&i.isBefore(s)?i:n?n:s},localizeMoment:function(e){return e.clone().locale(this.props.locale||a.default.locale())},increaseMonth:function(){var e=this;this.setState({date:this.state.date.clone().add(1,"month")},function(){return e.handleMonthChange(e.state.date)})},decreaseMonth:function(){var e=this;this.setState({date:this.state.date.clone().subtract(1,"month")},function(){return e.handleMonthChange(e.state.date)})},handleDayClick:function(e,t){this.props.onSelect(e,t)},handleDayMouseEnter:function(e){this.setState({selectingDate:e})},handleMonthMouseLeave:function(){this.setState({selectingDate:null})},handleMonthChange:function(e){this.props.onMonthChange&&this.props.onMonthChange(e)},changeYear:function(e){this.setState({date:this.state.date.clone().set("year",e)})},changeMonth:function(e){var t=this;this.setState({date:this.state.date.clone().set("month",e)},function(){return t.handleMonthChange(t.state.date)})},header:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.state.date,t=e.clone().startOf("week"),n=[];return this.props.showWeekNumbers&&n.push(y.default.createElement("div",{key:"W",className:"react-datepicker__day-name"},"#")),n.concat([0,1,2,3,4,5,6].map(function(e){var n=t.clone().add(e,"days");return y.default.createElement("div",{key:e,className:"react-datepicker__day-name"},n.localeData().weekdaysMin(n))}))},renderPreviousMonthButton:function(){if(this.props.forceShowMonthNavigation||!(0,m.allDaysDisabledBefore)(this.state.date,"month",this.props))return y.default.createElement("a",{className:"react-datepicker__navigation react-datepicker__navigation--previous",onClick:this.decreaseMonth})},renderNextMonthButton:function(){if(this.props.forceShowMonthNavigation||!(0,m.allDaysDisabledAfter)(this.state.date,"month",this.props))return y.default.createElement("a",{className:"react-datepicker__navigation react-datepicker__navigation--next",onClick:this.increaseMonth})},renderCurrentMonth:function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:this.state.date,t=["react-datepicker__current-month"];return this.props.showYearDropdown&&t.push("react-datepicker__current-month--hasYearDropdown"),this.props.showMonthDropdown&&t.push("react-datepicker__current-month--hasMonthDropdown"),y.default.createElement("div",{className:t.join(" ")},e.format(this.props.dateFormat))},renderYearDropdown:function(){var e=arguments.length>0&&void 0!==arguments[0]&&arguments[0];if(this.props.showYearDropdown&&!e)return y.default.createElement(p.default,{dropdownMode:this.props.dropdownMode,onChange:this.changeYear,minDate:this.props.minDate,maxDate:this.props.maxDate,year:this.state.date.year(),scrollableYearDropdown:this.props.scrollableYearDropdown})},renderMonthDropdown:function(){arguments.length>0&&void 0!==arguments[0]&&arguments[0];if(this.props.showMonthDropdown)return y.default.createElement(c.default,{dropdownMode:this.props.dropdownMode,locale:this.props.locale,onChange:this.changeMonth,month:this.state.date.month()})},renderTodayButton:function(){var e=this;if(this.props.todayButton)return y.default.createElement("div",{className:"react-datepicker__today-button",onClick:function(t){return e.props.onSelect(a.default.utc().utcOffset(e.props.utcOffset).startOf("date"),t)}},this.props.todayButton)},renderMonths:function(){for(var e=[],t=0;t<this.props.monthsShown;++t){var n=this.state.date.clone().add(t,"M"),r="month-"+t;e.push(y.default.createElement("div",{key:r,className:"react-datepicker__month-container"},y.default.createElement("div",{className:"react-datepicker__header"},this.renderCurrentMonth(n),y.default.createElement("div",{className:"react-datepicker__header__dropdown react-datepicker__header__dropdown--"+this.props.dropdownMode,onFocus:this.handleDropdownFocus},this.renderMonthDropdown(0!==t),this.renderYearDropdown(0!==t)),y.default.createElement("div",{className:"react-datepicker__day-names"},this.header(n))),y.default.createElement(d.default,{day:n,onDayClick:this.handleDayClick,onDayMouseEnter:this.handleDayMouseEnter,onMouseLeave:this.handleMonthMouseLeave,minDate:this.props.minDate,maxDate:this.props.maxDate,excludeDates:this.props.excludeDates,highlightDates:this.props.highlightDates,selectingDate:this.state.selectingDate,includeDates:this.props.includeDates,fixedHeight:this.props.fixedHeight,filterDate:this.props.filterDate,selected:this.props.selected,selectsStart:this.props.selectsStart,selectsEnd:this.props.selectsEnd,showWeekNumbers:this.props.showWeekNumbers,startDate:this.props.startDate,endDate:this.props.endDate,peekNextMonth:this.props.peekNextMonth,utcOffset:this.props.utcOffset})))}return e},render:function(){return y.default.createElement("div",{className:"react-datepicker"},y.default.createElement("div",{className:"react-datepicker__triangle"}),this.renderPreviousMonthButton(),this.renderNextMonthButton(),this.renderMonths(),this.renderTodayButton())}});e.exports=b},function(e,t,n){var r=n(7),o=n(117),a=r(o);e.exports=a},function(e,t,n){function r(e){return function(t,n,r){var s=Object(t);if(!a(t)){var u=o(n,3);t=i(t),n=function(e){return u(s[e],e,s)}}var p=e(t,n,r);return p>-1?s[u?t[p]:p]:void 0}}var o=n(8),a=n(88),i=n(68);e.exports=r},function(e,t,n){function r(e){return"function"==typeof e?e:null==e?i:"object"==typeof e?s(e)?a(e[0],e[1]):o(e):u(e)}var o=n(9),a=n(97),i=n(113),s=n(74),u=n(114);e.exports=r},function(e,t,n){function r(e){var t=a(e);return 1==t.length&&t[0][2]?i(t[0][0],t[0][1]):function(n){return n===e||o(n,e,t)}}var o=n(10),a=n(94),i=n(96);e.exports=r},function(e,t,n){function r(e,t,n,r){var u=n.length,p=u,l=!r;if(null==e)return!p;for(e=Object(e);u--;){var c=n[u];if(l&&c[2]?c[1]!==e[c[0]]:!(c[0]in e))return!1}for(;++u<p;){c=n[u];var f=c[0],d=e[f],h=c[1];if(l&&c[2]){if(void 0===d&&!(f in e))return!1}else{var y=new o;if(r)var m=r(d,h,f,e,t,y);if(!(void 0===m?a(h,d,r,i|s,y):m))return!1}}return!0}var o=n(11),a=n(55),i=1,s=2;e.exports=r},function(e,t,n){function r(e){var t=this.__data__=new o(e);this.size=t.size}var o=n(12),a=n(20),i=n(21),s=n(22),u=n(23),p=n(24);r.prototype.clear=a,r.prototype.delete=i,r.prototype.get=s,r.prototype.has=u,r.prototype.set=p,e.exports=r},function(e,t,n){function r(e){var t=-1,n=null==e?0:e.length;for(this.clear();++t<n;){var r=e[t];this.set(r[0],r[1])}}var o=n(13),a=n(14),i=n(17),s=n(18),u=n(19);r.prototype.clear=o,r.prototype.delete=a,r.prototype.get=i,r.prototype.has=s,r.prototype.set=u,e.exports=r},function(e,t){function n(){this.__data__=[],this.size=0}e.exports=n},function(e,t,n){function r(e){var t=this.__data__,n=o(t,e);if(n<0)return!1;var r=t.length-1;return n==r?t.pop():i.call(t,n,1),--this.size,!0}var o=n(15),a=Array.prototype,i=a.splice;e.exports=r},function(e,t,n){function r(e,t){for(var n=e.length;n--;)if(o(e[n][0],t))return n;return-1}var o=n(16);e.exports=r},function(e,t){function n(e,t){return e===t||e!==e&&t!==t}e.exports=n},function(e,t,n){function r(e){var t=this.__data__,n=o(t,e);return n<0?void 0:t[n][1]}var o=n(15);e.exports=r},function(e,t,n){function r(e){return o(this.__data__,e)>-1}var o=n(15);e.exports=r},function(e,t,n){function r(e,t){var n=this.__data__,r=o(n,e);return r<0?(++this.size,n.push([e,t])):n[r][1]=t,this}var o=n(15);e.exports=r},function(e,t,n){function r(){this.__data__=new o,this.size=0}var o=n(12);e.exports=r},function(e,t){function n(e){var t=this.__data__,n=t.delete(e);return this.size=t.size,n}e.exports=n},function(e,t){function n(e){return this.__data__.get(e)}e.exports=n},function(e,t){function n(e){return this.__data__.has(e)}e.exports=n},function(e,t,n){function r(e,t){var n=this.__data__;if(n instanceof o){var r=n.__data__;if(!a||r.length<s-1)return r.push([e,t]),this.size=++n.size,this;n=this.__data__=new i(r)}return n.set(e,t),this.size=n.size,this}var o=n(12),a=n(25),i=n(40),s=200;e.exports=r},function(e,t,n){var r=n(26),o=n(31),a=r(o,"Map");e.exports=a},function(e,t,n){function r(e,t){var n=a(e,t);return o(n)?n:void 0}var o=n(27),a=n(39);e.exports=r},function(e,t,n){function r(e){if(!i(e)||a(e))return!1;var t=o(e)?h:p;return t.test(s(e))}var o=n(28),a=n(36),i=n(35),s=n(38),u=/[\\^$.*+?()[\]{}|]/g,p=/^\[object .+?Constructor\]$/,l=Function.prototype,c=Object.prototype,f=l.toString,d=c.hasOwnProperty,h=RegExp("^"+f.call(d).replace(u,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$");e.exports=r},function(e,t,n){function r(e){if(!a(e))return!1;var t=o(e);return t==s||t==u||t==i||t==p}var o=n(29),a=n(35),i="[object AsyncFunction]",s="[object Function]",u="[object GeneratorFunction]",p="[object Proxy]";e.exports=r},function(e,t,n){function r(e){return null==e?void 0===e?u:s:(e=Object(e),p&&p in e?a(e):i(e))}var o=n(30),a=n(33),i=n(34),s="[object Null]",u="[object Undefined]",p=o?o.toStringTag:void 0;e.exports=r},function(e,t,n){var r=n(31),o=r.Symbol;e.exports=o},function(e,t,n){var r=n(32),o="object"==typeof self&&self&&self.Object===Object&&self,a=r||o||Function("return this")();e.exports=a},function(e,t){(function(t){var n="object"==typeof t&&t&&t.Object===Object&&t;e.exports=n}).call(t,function(){return this}())},function(e,t,n){function r(e){var t=i.call(e,u),n=e[u];try{e[u]=void 0;var r=!0}catch(e){}var o=s.call(e);return r&&(t?e[u]=n:delete e[u]),o}var o=n(30),a=Object.prototype,i=a.hasOwnProperty,s=a.toString,u=o?o.toStringTag:void 0;e.exports=r},function(e,t){function n(e){return o.call(e)}var r=Object.prototype,o=r.toString;e.exports=n},function(e,t){function n(e){var t=typeof e;return null!=e&&("object"==t||"function"==t)}e.exports=n},function(e,t,n){function r(e){return!!a&&a in e}var o=n(37),a=function(){var e=/[^.]+$/.exec(o&&o.keys&&o.keys.IE_PROTO||"");return e?"Symbol(src)_1."+e:""}();e.exports=r},function(e,t,n){var r=n(31),o=r["__core-js_shared__"];e.exports=o},function(e,t){function n(e){if(null!=e){try{return o.call(e)}catch(e){}try{return e+""}catch(e){}}return""}var r=Function.prototype,o=r.toString;e.exports=n},function(e,t){function n(e,t){return null==e?void 0:e[t]}e.exports=n},function(e,t,n){function r(e){var t=-1,n=null==e?0:e.length;for(this.clear();++t<n;){var r=e[t];this.set(r[0],r[1])}}var o=n(41),a=n(49),i=n(52),s=n(53),u=n(54);r.prototype.clear=o,r.prototype.delete=a,r.prototype.get=i,r.prototype.has=s,r.prototype.set=u,e.exports=r},function(e,t,n){function r(){this.size=0,this.__data__={hash:new o,map:new(i||a),string:new o}}var o=n(42),a=n(12),i=n(25);e.exports=r},function(e,t,n){function r(e){var t=-1,n=null==e?0:e.length;for(this.clear();++t<n;){var r=e[t];this.set(r[0],r[1])}}var o=n(43),a=n(45),i=n(46),s=n(47),u=n(48);r.prototype.clear=o,r.prototype.delete=a,r.prototype.get=i,r.prototype.has=s,r.prototype.set=u,e.exports=r},function(e,t,n){function r(){this.__data__=o?o(null):{},this.size=0}var o=n(44);e.exports=r},function(e,t,n){var r=n(26),o=r(Object,"create");e.exports=o},function(e,t){function n(e){var t=this.has(e)&&delete this.__data__[e];return this.size-=t?1:0,t}e.exports=n},function(e,t,n){function r(e){var t=this.__data__;if(o){var n=t[e];return n===a?void 0:n}return s.call(t,e)?t[e]:void 0}var o=n(44),a="__lodash_hash_undefined__",i=Object.prototype,s=i.hasOwnProperty;e.exports=r},function(e,t,n){function r(e){var t=this.__data__;return o?void 0!==t[e]:i.call(t,e)}var o=n(44),a=Object.prototype,i=a.hasOwnProperty;e.exports=r},function(e,t,n){function r(e,t){var n=this.__data__;return this.size+=this.has(e)?0:1,n[e]=o&&void 0===t?a:t,this}var o=n(44),a="__lodash_hash_undefined__";e.exports=r},function(e,t,n){function r(e){var t=o(this,e).delete(e);return this.size-=t?1:0,t}var o=n(50);e.exports=r},function(e,t,n){function r(e,t){var n=e.__data__;return o(t)?n["string"==typeof t?"string":"hash"]:n.map}var o=n(51);e.exports=r},function(e,t){function n(e){var t=typeof e;return"string"==t||"number"==t||"symbol"==t||"boolean"==t?"__proto__"!==e:null===e}e.exports=n},function(e,t,n){function r(e){return o(this,e).get(e)}var o=n(50);e.exports=r},function(e,t,n){function r(e){return o(this,e).has(e)}var o=n(50);e.exports=r},function(e,t,n){function r(e,t){var n=o(this,e),r=n.size;return n.set(e,t),this.size+=n.size==r?0:1,this}var o=n(50);e.exports=r},function(e,t,n){function r(e,t,n,s,u){return e===t||(null==e||null==t||!a(e)&&!i(t)?e!==e&&t!==t:o(e,t,r,n,s,u))}var o=n(56),a=n(35),i=n(73);e.exports=r},function(e,t,n){function r(e,t,n,r,m,v){var b=p(e),D=p(t),w=h,_=h;b||(w=u(e),w=w==d?y:w),D||(_=u(t),_=_==d?y:_);var x=w==y,T=_==y,P=w==_;if(P&&l(e)){if(!l(t))return!1;b=!0,x=!1}if(P&&!x)return v||(v=new o),b||c(e)?a(e,t,n,r,m,v):i(e,t,w,n,r,m,v);if(!(m&f)){var C=x&&g.call(e,"__wrapped__"),k=T&&g.call(t,"__wrapped__");if(C||k){var O=C?e.value():e,E=k?t.value():t;return v||(v=new o),n(O,E,r,m,v)}}return!!P&&(v||(v=new o),s(e,t,n,r,m,v))}var o=n(11),a=n(57),i=n(63),s=n(67),u=n(89),p=n(74),l=n(75),c=n(79),f=2,d="[object Arguments]",h="[object Array]",y="[object Object]",m=Object.prototype,g=m.hasOwnProperty;e.exports=r},function(e,t,n){function r(e,t,n,r,p,l){var c=p&u,f=e.length,d=t.length;if(f!=d&&!(c&&d>f))return!1;var h=l.get(e);if(h&&l.get(t))return h==t;var y=-1,m=!0,g=p&s?new o:void 0;for(l.set(e,t),l.set(t,e);++y<f;){var v=e[y],b=t[y];if(r)var D=c?r(b,v,y,t,e,l):r(v,b,y,e,t,l);if(void 0!==D){if(D)continue;m=!1;break}if(g){if(!a(t,function(e,t){if(!i(g,t)&&(v===e||n(v,e,r,p,l)))return g.push(t)})){m=!1;break}}else if(v!==b&&!n(v,b,r,p,l)){m=!1;break}}return l.delete(e),l.delete(t),m}var o=n(58),a=n(61),i=n(62),s=1,u=2;e.exports=r},function(e,t,n){function r(e){var t=-1,n=null==e?0:e.length;for(this.__data__=new o;++t<n;)this.add(e[t])}var o=n(40),a=n(59),i=n(60);r.prototype.add=r.prototype.push=a,r.prototype.has=i,e.exports=r},function(e,t){function n(e){return this.__data__.set(e,r),this}var r="__lodash_hash_undefined__";e.exports=n},function(e,t){function n(e){return this.__data__.has(e)}e.exports=n},function(e,t){function n(e,t){for(var n=-1,r=null==e?0:e.length;++n<r;)if(t(e[n],n,e))return!0;return!1}e.exports=n},function(e,t){function n(e,t){return e.has(t)}e.exports=n},function(e,t,n){function r(e,t,n,r,o,x,P){switch(n){case _:if(e.byteLength!=t.byteLength||e.byteOffset!=t.byteOffset)return!1;e=e.buffer,t=t.buffer;case w:return!(e.byteLength!=t.byteLength||!r(new a(e),new a(t)));case f:case d:case m:return i(+e,+t);case h:return e.name==t.name&&e.message==t.message;case g:case b:return e==t+"";case y:var C=u;case v:var k=x&c;if(C||(C=p),e.size!=t.size&&!k)return!1;var O=P.get(e);if(O)return O==t;x|=l,P.set(e,t);var E=s(C(e),C(t),r,o,x,P);return P.delete(e),E;case D:if(T)return T.call(e)==T.call(t)}return!1}var o=n(30),a=n(64),i=n(16),s=n(57),u=n(65),p=n(66),l=1,c=2,f="[object Boolean]",d="[object Date]",h="[object Error]",y="[object Map]",m="[object Number]",g="[object RegExp]",v="[object Set]",b="[object String]",D="[object Symbol]",w="[object ArrayBuffer]",_="[object DataView]",x=o?o.prototype:void 0,T=x?x.valueOf:void 0;e.exports=r},function(e,t,n){var r=n(31),o=r.Uint8Array;e.exports=o},function(e,t){function n(e){var t=-1,n=Array(e.size);return e.forEach(function(e,r){n[++t]=[r,e]}),n}e.exports=n},function(e,t){function n(e){var t=-1,n=Array(e.size);return e.forEach(function(e){n[++t]=e}),n}e.exports=n},function(e,t,n){function r(e,t,n,r,i,u){var p=i&a,l=o(e),c=l.length,f=o(t),d=f.length;if(c!=d&&!p)return!1;for(var h=c;h--;){var y=l[h];if(!(p?y in t:s.call(t,y)))return!1}var m=u.get(e);if(m&&u.get(t))return m==t;var g=!0;u.set(e,t),u.set(t,e);for(var v=p;++h<c;){y=l[h];var b=e[y],D=t[y];if(r)var w=p?r(D,b,y,t,e,u):r(b,D,y,e,t,u);if(!(void 0===w?b===D||n(b,D,r,i,u):w)){g=!1;break}v||(v="constructor"==y)}if(g&&!v){var _=e.constructor,x=t.constructor;_!=x&&"constructor"in e&&"constructor"in t&&!("function"==typeof _&&_ instanceof _&&"function"==typeof x&&x instanceof x)&&(g=!1)}return u.delete(e),u.delete(t),g}var o=n(68),a=2,i=Object.prototype,s=i.hasOwnProperty;e.exports=r},function(e,t,n){function r(e){return i(e)?o(e):a(e)}var o=n(69),a=n(84),i=n(88);e.exports=r},function(e,t,n){function r(e,t){var n=i(e),r=!n&&a(e),l=!n&&!r&&s(e),f=!n&&!r&&!l&&p(e),d=n||r||l||f,h=d?o(e.length,String):[],y=h.length;for(var m in e)!t&&!c.call(e,m)||d&&("length"==m||l&&("offset"==m||"parent"==m)||f&&("buffer"==m||"byteLength"==m||"byteOffset"==m)||u(m,y))||h.push(m);return h}var o=n(70),a=n(71),i=n(74),s=n(75),u=n(78),p=n(79),l=Object.prototype,c=l.hasOwnProperty;e.exports=r},function(e,t){function n(e,t){for(var n=-1,r=Array(e);++n<e;)r[n]=t(n);return r}e.exports=n},function(e,t,n){var r=n(72),o=n(73),a=Object.prototype,i=a.hasOwnProperty,s=a.propertyIsEnumerable,u=r(function(){return arguments}())?r:function(e){return o(e)&&i.call(e,"callee")&&!s.call(e,"callee")};e.exports=u},function(e,t,n){
	function r(e){return a(e)&&o(e)==i}var o=n(29),a=n(73),i="[object Arguments]";e.exports=r},function(e,t){function n(e){return null!=e&&"object"==typeof e}e.exports=n},function(e,t){var n=Array.isArray;e.exports=n},function(e,t,n){(function(e){var r=n(31),o=n(77),a="object"==typeof t&&t&&!t.nodeType&&t,i=a&&"object"==typeof e&&e&&!e.nodeType&&e,s=i&&i.exports===a,u=s?r.Buffer:void 0,p=u?u.isBuffer:void 0,l=p||o;e.exports=l}).call(t,n(76)(e))},function(e,t){e.exports=function(e){return e.webpackPolyfill||(e.deprecate=function(){},e.paths=[],e.children=[],e.webpackPolyfill=1),e}},function(e,t){function n(){return!1}e.exports=n},function(e,t){function n(e,t){return t=null==t?r:t,!!t&&("number"==typeof e||o.test(e))&&e>-1&&e%1==0&&e<t}var r=9007199254740991,o=/^(?:0|[1-9]\d*)$/;e.exports=n},function(e,t,n){var r=n(80),o=n(82),a=n(83),i=a&&a.isTypedArray,s=i?o(i):r;e.exports=s},function(e,t,n){function r(e){return i(e)&&a(e.length)&&!!S[o(e)]}var o=n(29),a=n(81),i=n(73),s="[object Arguments]",u="[object Array]",p="[object Boolean]",l="[object Date]",c="[object Error]",f="[object Function]",d="[object Map]",h="[object Number]",y="[object Object]",m="[object RegExp]",g="[object Set]",v="[object String]",b="[object WeakMap]",D="[object ArrayBuffer]",w="[object DataView]",_="[object Float32Array]",x="[object Float64Array]",T="[object Int8Array]",P="[object Int16Array]",C="[object Int32Array]",k="[object Uint8Array]",O="[object Uint8ClampedArray]",E="[object Uint16Array]",M="[object Uint32Array]",S={};S[_]=S[x]=S[T]=S[P]=S[C]=S[k]=S[O]=S[E]=S[M]=!0,S[s]=S[u]=S[D]=S[p]=S[w]=S[l]=S[c]=S[f]=S[d]=S[h]=S[y]=S[m]=S[g]=S[v]=S[b]=!1,e.exports=r},function(e,t){function n(e){return"number"==typeof e&&e>-1&&e%1==0&&e<=r}var r=9007199254740991;e.exports=n},function(e,t){function n(e){return function(t){return e(t)}}e.exports=n},function(e,t,n){(function(e){var r=n(32),o="object"==typeof t&&t&&!t.nodeType&&t,a=o&&"object"==typeof e&&e&&!e.nodeType&&e,i=a&&a.exports===o,s=i&&r.process,u=function(){try{return s&&s.binding("util")}catch(e){}}();e.exports=u}).call(t,n(76)(e))},function(e,t,n){function r(e){if(!o(e))return a(e);var t=[];for(var n in Object(e))s.call(e,n)&&"constructor"!=n&&t.push(n);return t}var o=n(85),a=n(86),i=Object.prototype,s=i.hasOwnProperty;e.exports=r},function(e,t){function n(e){var t=e&&e.constructor,n="function"==typeof t&&t.prototype||r;return e===n}var r=Object.prototype;e.exports=n},function(e,t,n){var r=n(87),o=r(Object.keys,Object);e.exports=o},function(e,t){function n(e,t){return function(n){return e(t(n))}}e.exports=n},function(e,t,n){function r(e){return null!=e&&a(e.length)&&!o(e)}var o=n(28),a=n(81);e.exports=r},function(e,t,n){var r=n(90),o=n(25),a=n(91),i=n(92),s=n(93),u=n(29),p=n(38),l="[object Map]",c="[object Object]",f="[object Promise]",d="[object Set]",h="[object WeakMap]",y="[object DataView]",m=p(r),g=p(o),v=p(a),b=p(i),D=p(s),w=u;(r&&w(new r(new ArrayBuffer(1)))!=y||o&&w(new o)!=l||a&&w(a.resolve())!=f||i&&w(new i)!=d||s&&w(new s)!=h)&&(w=function(e){var t=u(e),n=t==c?e.constructor:void 0,r=n?p(n):"";if(r)switch(r){case m:return y;case g:return l;case v:return f;case b:return d;case D:return h}return t}),e.exports=w},function(e,t,n){var r=n(26),o=n(31),a=r(o,"DataView");e.exports=a},function(e,t,n){var r=n(26),o=n(31),a=r(o,"Promise");e.exports=a},function(e,t,n){var r=n(26),o=n(31),a=r(o,"Set");e.exports=a},function(e,t,n){var r=n(26),o=n(31),a=r(o,"WeakMap");e.exports=a},function(e,t,n){function r(e){for(var t=a(e),n=t.length;n--;){var r=t[n],i=e[r];t[n]=[r,i,o(i)]}return t}var o=n(95),a=n(68);e.exports=r},function(e,t,n){function r(e){return e===e&&!o(e)}var o=n(35);e.exports=r},function(e,t){function n(e,t){return function(n){return null!=n&&(n[e]===t&&(void 0!==t||e in Object(n)))}}e.exports=n},function(e,t,n){function r(e,t){return s(e)&&u(t)?p(l(e),t):function(n){var r=a(n,e);return void 0===r&&r===t?i(n,e):o(t,r,void 0,c|f)}}var o=n(55),a=n(98),i=n(110),s=n(108),u=n(95),p=n(96),l=n(109),c=1,f=2;e.exports=r},function(e,t,n){function r(e,t,n){var r=null==e?void 0:o(e,t);return void 0===r?n:r}var o=n(99);e.exports=r},function(e,t,n){function r(e,t){t=a(t,e)?[t]:o(t);for(var n=0,r=t.length;null!=e&&n<r;)e=e[i(t[n++])];return n&&n==r?e:void 0}var o=n(100),a=n(108),i=n(109);e.exports=r},function(e,t,n){function r(e){return o(e)?e:a(e)}var o=n(74),a=n(101);e.exports=r},function(e,t,n){var r=n(102),o=n(104),a=/^\./,i=/[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g,s=/\\(\\)?/g,u=r(function(e){e=o(e);var t=[];return a.test(e)&&t.push(""),e.replace(i,function(e,n,r,o){t.push(r?o.replace(s,"$1"):n||e)}),t});e.exports=u},function(e,t,n){function r(e){var t=o(e,function(e){return n.size===a&&n.clear(),e}),n=t.cache;return t}var o=n(103),a=500;e.exports=r},function(e,t,n){function r(e,t){if("function"!=typeof e||null!=t&&"function"!=typeof t)throw new TypeError(a);var n=function(){var r=arguments,o=t?t.apply(this,r):r[0],a=n.cache;if(a.has(o))return a.get(o);var i=e.apply(this,r);return n.cache=a.set(o,i)||a,i};return n.cache=new(r.Cache||o),n}var o=n(40),a="Expected a function";r.Cache=o,e.exports=r},function(e,t,n){function r(e){return null==e?"":o(e)}var o=n(105);e.exports=r},function(e,t,n){function r(e){if("string"==typeof e)return e;if(i(e))return a(e,r)+"";if(s(e))return l?l.call(e):"";var t=e+"";return"0"==t&&1/e==-u?"-0":t}var o=n(30),a=n(106),i=n(74),s=n(107),u=1/0,p=o?o.prototype:void 0,l=p?p.toString:void 0;e.exports=r},function(e,t){function n(e,t){for(var n=-1,r=null==e?0:e.length,o=Array(r);++n<r;)o[n]=t(e[n],n,e);return o}e.exports=n},function(e,t,n){function r(e){return"symbol"==typeof e||a(e)&&o(e)==i}var o=n(29),a=n(73),i="[object Symbol]";e.exports=r},function(e,t,n){function r(e,t){if(o(e))return!1;var n=typeof e;return!("number"!=n&&"symbol"!=n&&"boolean"!=n&&null!=e&&!a(e))||(s.test(e)||!i.test(e)||null!=t&&e in Object(t))}var o=n(74),a=n(107),i=/\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,s=/^\w*$/;e.exports=r},function(e,t,n){function r(e){if("string"==typeof e||o(e))return e;var t=e+"";return"0"==t&&1/e==-a?"-0":t}var o=n(107),a=1/0;e.exports=r},function(e,t,n){function r(e,t){return null!=e&&a(e,t,o)}var o=n(111),a=n(112);e.exports=r},function(e,t){function n(e,t){return null!=e&&t in Object(e)}e.exports=n},function(e,t,n){function r(e,t,n){t=u(t,e)?[t]:o(t);for(var r=-1,c=t.length,f=!1;++r<c;){var d=l(t[r]);if(!(f=null!=e&&n(e,d)))break;e=e[d]}return f||++r!=c?f:(c=null==e?0:e.length,!!c&&p(c)&&s(d,c)&&(i(e)||a(e)))}var o=n(100),a=n(71),i=n(74),s=n(78),u=n(108),p=n(81),l=n(109);e.exports=r},function(e,t){function n(e){return e}e.exports=n},function(e,t,n){function r(e){return i(e)?o(s(e)):a(e)}var o=n(115),a=n(116),i=n(108),s=n(109);e.exports=r},function(e,t){function n(e){return function(t){return null==t?void 0:t[e]}}e.exports=n},function(e,t,n){function r(e){return function(t){return o(t,e)}}var o=n(99);e.exports=r},function(e,t,n){function r(e,t,n){var r=null==e?0:e.length;if(!r)return-1;var u=null==n?0:i(n);return u<0&&(u=s(r+u,0)),o(e,a(t,3),u)}var o=n(118),a=n(8),i=n(119),s=Math.max;e.exports=r},function(e,t){function n(e,t,n,r){for(var o=e.length,a=n+(r?1:-1);r?a--:++a<o;)if(t(e[a],a,e))return a;return-1}e.exports=n},function(e,t,n){function r(e){var t=o(e),n=t%1;return t===t?n?t-n:t:0}var o=n(120);e.exports=r},function(e,t,n){function r(e){if(!e)return 0===e?e:0;if(e=o(e),e===a||e===-a){var t=e<0?-1:1;return t*i}return e===e?e:0}var o=n(121),a=1/0,i=1.7976931348623157e308;e.exports=r},function(e,t,n){function r(e){if("number"==typeof e)return e;if(a(e))return i;if(o(e)){var t="function"==typeof e.valueOf?e.valueOf():e;e=o(t)?t+"":t}if("string"!=typeof e)return 0===e?e:+e;e=e.replace(s,"");var n=p.test(e);return n||l.test(e)?c(e.slice(2),n?2:8):u.test(e)?i:+e}var o=n(35),a=n(107),i=NaN,s=/^\s+|\s+$/g,u=/^[-+]0x[0-9a-f]+$/i,p=/^0b[01]+$/i,l=/^0o[0-7]+$/i,c=parseInt;e.exports=r},function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}var o=n(3),a=r(o),i=n(123),s=r(i),u=n(125),p=r(u),l=(0,p.default)(s.default),c=a.default.createClass({displayName:"YearDropdown",propTypes:{dropdownMode:a.default.PropTypes.oneOf(["scroll","select"]).isRequired,maxDate:a.default.PropTypes.object,minDate:a.default.PropTypes.object,onChange:a.default.PropTypes.func.isRequired,scrollableYearDropdown:a.default.PropTypes.bool,year:a.default.PropTypes.number.isRequired},getInitialState:function(){return{dropdownVisible:!1}},renderSelectOptions:function(){for(var e=this.props.minDate?this.props.minDate.year():1900,t=this.props.maxDate?this.props.maxDate.year():2100,n=[],r=e;r<=t;r++)n.push(a.default.createElement("option",{key:r,value:r},r));return n},onSelectChange:function(e){this.onChange(e.target.value)},renderSelectMode:function(){return a.default.createElement("select",{value:this.props.year,className:"react-datepicker__year-select",onChange:this.onSelectChange},this.renderSelectOptions())},renderReadView:function(e){return a.default.createElement("div",{key:"read",style:{visibility:e?"visible":"hidden"},className:"react-datepicker__year-read-view",onClick:this.toggleDropdown},a.default.createElement("span",{className:"react-datepicker__year-read-view--down-arrow"}),a.default.createElement("span",{className:"react-datepicker__year-read-view--selected-year"},this.props.year))},renderDropdown:function(){return a.default.createElement(l,{key:"dropdown",ref:"options",year:this.props.year,onChange:this.onChange,onCancel:this.toggleDropdown,scrollableYearDropdown:this.props.scrollableYearDropdown})},renderScrollMode:function(){var e=this.state.dropdownVisible,t=[this.renderReadView(!e)];return e&&t.unshift(this.renderDropdown()),t},onChange:function(e){this.toggleDropdown(),e!==this.props.year&&this.props.onChange(e)},toggleDropdown:function(){this.setState({dropdownVisible:!this.state.dropdownVisible})},render:function(){var e=void 0;switch(this.props.dropdownMode){case"scroll":e=this.renderScrollMode();break;case"select":e=this.renderSelectMode()}return a.default.createElement("div",{className:"react-datepicker__year-dropdown-container react-datepicker__year-dropdown-container--"+this.props.dropdownMode},e)}});e.exports=c},function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}function o(e,t){for(var n=[],r=0;r<t;r++)n.push(e-r);return n}var a=n(3),i=r(a),s=n(124),u=r(s),p=i.default.createClass({displayName:"YearDropdownOptions",propTypes:{onCancel:i.default.PropTypes.func.isRequired,onChange:i.default.PropTypes.func.isRequired,scrollableYearDropdown:i.default.PropTypes.bool,year:i.default.PropTypes.number.isRequired},getInitialState:function(){return{yearsList:this.props.scrollableYearDropdown?o(this.props.year,50):o(this.props.year,5)}},renderOptions:function(){var e=this,t=this.props.year,n=this.state.yearsList.map(function(n){return i.default.createElement("div",{className:"react-datepicker__year-option",key:n,ref:n,onClick:e.onChange.bind(e,n)},t===n?i.default.createElement("span",{className:"react-datepicker__year-option--selected"},"✓"):"",n)});return n.unshift(i.default.createElement("div",{className:"react-datepicker__year-option",ref:"upcoming",key:"upcoming",onClick:this.incrementYears},i.default.createElement("a",{className:"react-datepicker__navigation react-datepicker__navigation--years react-datepicker__navigation--years-upcoming"}))),n.push(i.default.createElement("div",{className:"react-datepicker__year-option",ref:"previous",key:"previous",onClick:this.decrementYears},i.default.createElement("a",{className:"react-datepicker__navigation react-datepicker__navigation--years react-datepicker__navigation--years-previous"}))),n},onChange:function(e){this.props.onChange(e)},handleClickOutside:function(){this.props.onCancel()},shiftYears:function(e){var t=this.state.yearsList.map(function(t){return t+e});this.setState({yearsList:t})},incrementYears:function(){return this.shiftYears(1)},decrementYears:function(){return this.shiftYears(-1)},render:function(){var e=(0,u.default)({"react-datepicker__year-dropdown":!0,"react-datepicker__year-dropdown--scrollable":this.props.scrollableYearDropdown});return i.default.createElement("div",{className:e},this.renderOptions())}});e.exports=p},function(e,t,n){var r,o;/*!
		  Copyright (c) 2016 Jed Watson.
		  Licensed under the MIT License (MIT), see
		  http://jedwatson.github.io/classnames
		*/
	!function(){"use strict";function n(){for(var e=[],t=0;t<arguments.length;t++){var r=arguments[t];if(r){var o=typeof r;if("string"===o||"number"===o)e.push(r);else if(Array.isArray(r))e.push(n.apply(null,r));else if("object"===o)for(var i in r)a.call(r,i)&&r[i]&&e.push(i)}}return e.join(" ")}var a={}.hasOwnProperty;"undefined"!=typeof e&&e.exports?e.exports=n:(r=[],o=function(){return n}.apply(t,r),!(void 0!==o&&(e.exports=o)))}()},function(e,t){e.exports=n},function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}var o=n(3),a=r(o),i=n(127),s=r(i),u=n(125),p=r(u),l=n(2),c=r(l),f=n(128),d=r(f),h=(0,p.default)(s.default),y=a.default.createClass({displayName:"MonthDropdown",propTypes:{dropdownMode:a.default.PropTypes.oneOf(["scroll","select"]).isRequired,locale:a.default.PropTypes.string,month:a.default.PropTypes.number.isRequired,onChange:a.default.PropTypes.func.isRequired},getInitialState:function(){return{dropdownVisible:!1}},renderSelectOptions:function(e){return e.map(function(e,t){return a.default.createElement("option",{key:t,value:t},e)})},renderSelectMode:function(e){var t=this;return a.default.createElement("select",{value:this.props.month,className:"react-datepicker__month-select",onChange:function(e){return t.onChange(e.target.value)}},this.renderSelectOptions(e))},renderReadView:function(e,t){return a.default.createElement("div",{key:"read",style:{visibility:e?"visible":"hidden"},className:"react-datepicker__month-read-view",onClick:this.toggleDropdown},a.default.createElement("span",{className:"react-datepicker__month-read-view--selected-month"},t[this.props.month]),a.default.createElement("span",{className:"react-datepicker__month-read-view--down-arrow"}))},renderDropdown:function(e){return a.default.createElement(h,{key:"dropdown",ref:"options",month:this.props.month,monthNames:e,onChange:this.onChange,onCancel:this.toggleDropdown})},renderScrollMode:function(e){var t=this.state.dropdownVisible,n=[this.renderReadView(!t,e)];return t&&n.unshift(this.renderDropdown(e)),n},onChange:function(e){this.toggleDropdown(),e!==this.props.month&&this.props.onChange(e)},toggleDropdown:function(){this.setState({dropdownVisible:!this.state.dropdownVisible})},render:function(){var e=c.default.localeData(this.props.locale),t=(0,d.default)(0,12).map(function(t){return e.months((0,c.default)({M:t}))}),n=void 0;switch(this.props.dropdownMode){case"scroll":n=this.renderScrollMode(t);break;case"select":n=this.renderSelectMode(t)}return a.default.createElement("div",{className:"react-datepicker__month-dropdown-container react-datepicker__month-dropdown-container--"+this.props.dropdownMode},n)}});e.exports=y},function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}var o=n(3),a=r(o),i=a.default.createClass({displayName:"MonthDropdownOptions",propTypes:{onCancel:a.default.PropTypes.func.isRequired,onChange:a.default.PropTypes.func.isRequired,month:a.default.PropTypes.number.isRequired,monthNames:a.default.PropTypes.arrayOf(a.default.PropTypes.string.isRequired).isRequired},renderOptions:function(){var e=this,t=this.props.month,n=this.props.monthNames.map(function(n,r){return a.default.createElement("div",{className:"react-datepicker__month-option",key:n,ref:n,onClick:e.onChange.bind(e,r)},t===r?a.default.createElement("span",{className:"react-datepicker__month-option--selected"},"✓"):"",n)});return n},onChange:function(e){this.props.onChange(e)},handleClickOutside:function(){this.props.onCancel()},render:function(){return a.default.createElement("div",{className:"react-datepicker__month-dropdown"},this.renderOptions())}});e.exports=i},function(e,t,n){var r=n(129),o=r();e.exports=o},function(e,t,n){function r(e){return function(t,n,r){return r&&"number"!=typeof r&&a(t,n,r)&&(n=r=void 0),t=i(t),void 0===n?(n=t,t=0):n=i(n),r=void 0===r?t<n?1:-1:i(r),o(t,n,r,e)}}var o=n(130),a=n(131),i=n(120);e.exports=r},function(e,t){function n(e,t,n,a){for(var i=-1,s=o(r((t-e)/(n||1)),0),u=Array(s);s--;)u[a?s:++i]=e,e+=n;return u}var r=Math.ceil,o=Math.max;e.exports=n},function(e,t,n){function r(e,t,n){if(!s(n))return!1;var r=typeof t;return!!("number"==r?a(n)&&i(t,n.length):"string"==r&&t in n)&&o(n[t],e)}var o=n(16),a=n(88),i=n(78),s=n(35);e.exports=r},function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}var o=n(3),a=r(o),i=n(124),s=r(i),u=n(133),p=r(u),l=6,c=a.default.createClass({displayName:"Month",propTypes:{day:a.default.PropTypes.object.isRequired,endDate:a.default.PropTypes.object,excludeDates:a.default.PropTypes.array,filterDate:a.default.PropTypes.func,fixedHeight:a.default.PropTypes.bool,highlightDates:a.default.PropTypes.array,includeDates:a.default.PropTypes.array,maxDate:a.default.PropTypes.object,minDate:a.default.PropTypes.object,onDayClick:a.default.PropTypes.func,onDayMouseEnter:a.default.PropTypes.func,onMouseLeave:a.default.PropTypes.func,peekNextMonth:a.default.PropTypes.bool,selected:a.default.PropTypes.object,selectingDate:a.default.PropTypes.object,selectsEnd:a.default.PropTypes.bool,selectsStart:a.default.PropTypes.bool,showWeekNumbers:a.default.PropTypes.bool,startDate:a.default.PropTypes.object,utcOffset:a.default.PropTypes.number},handleDayClick:function(e,t){this.props.onDayClick&&this.props.onDayClick(e,t)},handleDayMouseEnter:function(e){this.props.onDayMouseEnter&&this.props.onDayMouseEnter(e)},handleMouseLeave:function(){this.props.onMouseLeave&&this.props.onMouseLeave()},isWeekInMonth:function(e){var t=this.props.day,n=e.clone().add(6,"days");return e.isSame(t,"month")||n.isSame(t,"month")},renderWeeks:function(){for(var e=[],t=this.props.fixedHeight,n=this.props.day.clone().startOf("month").startOf("week"),r=0,o=!1;;){if(e.push(a.default.createElement(p.default,{key:r,day:n,month:this.props.day.month(),onDayClick:this.handleDayClick,onDayMouseEnter:this.handleDayMouseEnter,minDate:this.props.minDate,maxDate:this.props.maxDate,excludeDates:this.props.excludeDates,includeDates:this.props.includeDates,highlightDates:this.props.highlightDates,selectingDate:this.props.selectingDate,filterDate:this.props.filterDate,selected:this.props.selected,selectsStart:this.props.selectsStart,selectsEnd:this.props.selectsEnd,showWeekNumber:this.props.showWeekNumbers,startDate:this.props.startDate,endDate:this.props.endDate,utcOffset:this.props.utcOffset})),o)break;r++,n=n.clone().add(1,"weeks");var i=t&&r>=l,s=!t&&!this.isWeekInMonth(n);if(i||s){if(!this.props.peekNextMonth)break;o=!0}}return e},getClassNames:function(){var e=this.props,t=e.selectingDate,n=e.selectsStart,r=e.selectsEnd;return(0,s.default)("react-datepicker__month",{"react-datepicker__month--selecting-range":t&&(n||r)})},render:function(){return a.default.createElement("div",{className:this.getClassNames(),onMouseLeave:this.handleMouseLeave,role:"listbox"},this.renderWeeks())}});e.exports=c},function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}var o=n(3),a=r(o),i=n(134),s=r(i),u=n(135),p=r(u),l=a.default.createClass({displayName:"Week",propTypes:{day:a.default.PropTypes.object.isRequired,endDate:a.default.PropTypes.object,excludeDates:a.default.PropTypes.array,filterDate:a.default.PropTypes.func,highlightDates:a.default.PropTypes.array,includeDates:a.default.PropTypes.array,maxDate:a.default.PropTypes.object,minDate:a.default.PropTypes.object,month:a.default.PropTypes.number,onDayClick:a.default.PropTypes.func,onDayMouseEnter:a.default.PropTypes.func,selected:a.default.PropTypes.object,selectingDate:a.default.PropTypes.object,selectsEnd:a.default.PropTypes.bool,selectsStart:a.default.PropTypes.bool,showWeekNumber:a.default.PropTypes.bool,startDate:a.default.PropTypes.object,utcOffset:a.default.PropTypes.number},handleDayClick:function(e,t){this.props.onDayClick&&this.props.onDayClick(e,t)},handleDayMouseEnter:function(e){this.props.onDayMouseEnter&&this.props.onDayMouseEnter(e)},renderDays:function(){var e=this,t=this.props.day.clone().startOf("week"),n=[];return this.props.showWeekNumber&&n.push(a.default.createElement(p.default,{key:"W",weekNumber:parseInt(t.format("w"),10)})),n.concat([0,1,2,3,4,5,6].map(function(n){var r=t.clone().add(n,"days");return a.default.createElement(s.default,{key:n,day:r,month:e.props.month,onClick:e.handleDayClick.bind(e,r),onMouseEnter:e.handleDayMouseEnter.bind(e,r),minDate:e.props.minDate,maxDate:e.props.maxDate,excludeDates:e.props.excludeDates,includeDates:e.props.includeDates,highlightDates:e.props.highlightDates,selectingDate:e.props.selectingDate,filterDate:e.props.filterDate,selected:e.props.selected,selectsStart:e.props.selectsStart,selectsEnd:e.props.selectsEnd,startDate:e.props.startDate,endDate:e.props.endDate,utcOffset:e.props.utcOffset})}))},render:function(){return a.default.createElement("div",{className:"react-datepicker__week"},this.renderDays())}});e.exports=l},function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}var o=n(2),a=r(o),i=n(3),s=r(i),u=n(124),p=r(u),l=n(4),c=s.default.createClass({displayName:"Day",propTypes:{day:s.default.PropTypes.object.isRequired,endDate:s.default.PropTypes.object,highlightDates:s.default.PropTypes.array,month:s.default.PropTypes.number,onClick:s.default.PropTypes.func,onMouseEnter:s.default.PropTypes.func,selected:s.default.PropTypes.object,selectingDate:s.default.PropTypes.object,selectsEnd:s.default.PropTypes.bool,selectsStart:s.default.PropTypes.bool,startDate:s.default.PropTypes.object,utcOffset:s.default.PropTypes.number},getDefaultProps:function(){return{utcOffset:a.default.utc().utcOffset()}},handleClick:function(e){!this.isDisabled()&&this.props.onClick&&this.props.onClick(e)},handleMouseEnter:function(e){!this.isDisabled()&&this.props.onMouseEnter&&this.props.onMouseEnter(e)},isSameDay:function(e){return(0,l.isSameDay)(this.props.day,e)},isDisabled:function(){return(0,l.isDayDisabled)(this.props.day,this.props)},isHighlighted:function(){var e=this.props,t=e.day,n=e.highlightDates;return!!n&&n.some(function(e){return(0,l.isSameDay)(t,e)})},isInRange:function(){var e=this.props,t=e.day,n=e.startDate,r=e.endDate;return!(!n||!r)&&(0,l.isDayInRange)(t,n,r)},isInSelectingRange:function(){var e=this.props,t=e.day,n=e.selectsStart,r=e.selectsEnd,o=e.selectingDate,a=e.startDate,i=e.endDate;return!(!n&&!r||!o||this.isDisabled())&&(n&&i&&o.isSameOrBefore(i)?(0,l.isDayInRange)(t,o,i):!!(r&&a&&o.isSameOrAfter(a))&&(0,l.isDayInRange)(t,a,o))},isSelectingRangeStart:function(){if(!this.isInSelectingRange())return!1;var e=this.props,t=e.day,n=e.selectingDate,r=e.startDate,o=e.selectsStart;return o?(0,l.isSameDay)(t,n):(0,l.isSameDay)(t,r)},isSelectingRangeEnd:function(){if(!this.isInSelectingRange())return!1;var e=this.props,t=e.day,n=e.selectingDate,r=e.endDate,o=e.selectsEnd;return o?(0,l.isSameDay)(t,n):(0,l.isSameDay)(t,r)},isRangeStart:function(){var e=this.props,t=e.day,n=e.startDate,r=e.endDate;return!(!n||!r)&&(0,l.isSameDay)(n,t)},isRangeEnd:function(){var e=this.props,t=e.day,n=e.startDate,r=e.endDate;return!(!n||!r)&&(0,l.isSameDay)(r,t)},isWeekend:function(){var e=this.props.day.day();return 0===e||6===e},isOutsideMonth:function(){return void 0!==this.props.month&&this.props.month!==this.props.day.month()},getClassNames:function(){return(0,p.default)("react-datepicker__day",{"react-datepicker__day--disabled":this.isDisabled(),"react-datepicker__day--selected":this.isSameDay(this.props.selected),"react-datepicker__day--highlighted":this.isHighlighted(),"react-datepicker__day--range-start":this.isRangeStart(),"react-datepicker__day--range-end":this.isRangeEnd(),"react-datepicker__day--in-range":this.isInRange(),"react-datepicker__day--in-selecting-range":this.isInSelectingRange(),"react-datepicker__day--selecting-range-start":this.isSelectingRangeStart(),"react-datepicker__day--selecting-range-end":this.isSelectingRangeEnd(),"react-datepicker__day--today":this.isSameDay(a.default.utc().utcOffset(this.props.utcOffset)),"react-datepicker__day--weekend":this.isWeekend(),"react-datepicker__day--outside-month":this.isOutsideMonth()})},render:function(){return s.default.createElement("div",{className:this.getClassNames(),onClick:this.handleClick,onMouseEnter:this.handleMouseEnter,"aria-label":"day-"+this.props.day.date(),role:"option"},this.props.day.date())}});e.exports=c},function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}var o=n(3),a=r(o),i=a.default.createClass({displayName:"WeekNumber",propTypes:{weekNumber:a.default.PropTypes.number.isRequired},render:function(){return a.default.createElement("div",{className:"react-datepicker__week-number","aria-label":"week-"+this.props.weekNumber},this.props.weekNumber)}});e.exports=i},function(e,t,n){var r=n(137),o=n(138),a=o(function(e,t){return r(e,1,t)});e.exports=a},function(e,t){function n(e,t,n){if("function"!=typeof e)throw new TypeError(r);return setTimeout(function(){e.apply(void 0,n)},t)}var r="Expected a function";e.exports=n},function(e,t,n){function r(e,t){return i(a(e,t,o),e+"")}var o=n(113),a=n(139),i=n(141);e.exports=r},function(e,t,n){function r(e,t,n){return t=a(void 0===t?e.length-1:t,0),function(){for(var r=arguments,i=-1,s=a(r.length-t,0),u=Array(s);++i<s;)u[i]=r[t+i];i=-1;for(var p=Array(t+1);++i<t;)p[i]=r[i];return p[t]=n(u),o(e,this,p)}}var o=n(140),a=Math.max;e.exports=r},function(e,t){function n(e,t,n){switch(n.length){case 0:return e.call(t);case 1:return e.call(t,n[0]);case 2:return e.call(t,n[0],n[1]);case 3:return e.call(t,n[0],n[1],n[2])}return e.apply(t,n)}e.exports=n},function(e,t,n){var r=n(142),o=n(145),a=o(r);e.exports=a},function(e,t,n){var r=n(143),o=n(144),a=n(113),i=o?function(e,t){return o(e,"toString",{configurable:!0,enumerable:!1,value:r(t),writable:!0})}:a;e.exports=i},function(e,t){function n(e){return function(){return e}}e.exports=n},function(e,t,n){var r=n(26),o=function(){try{var e=r(Object,"defineProperty");return e({},"",{}),e}catch(e){}}();e.exports=o},function(e,t){function n(e){var t=0,n=0;return function(){var i=a(),s=o-(i-n);if(n=i,s>0){if(++t>=r)return arguments[0]}else t=0;return e.apply(void 0,arguments)}}var r=800,o=16,a=Date.now;e.exports=n},function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}function o(e,t){var n={};for(var r in e)t.indexOf(r)>=0||Object.prototype.hasOwnProperty.call(e,r)&&(n[r]=e[r]);return n}function a(e,t,n){var r=e.children,o=s.Children.count(r);return o<=0?new Error(n+" expects at least one child to use as the target element."):o>2?new Error("Only a max of two children allowed in "+n+"."):void 0}var i=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},s=n(3),u=r(s),p=n(147),l=r(p),c=n(148),f=r(c),d=["top left","top center","top right","middle left","middle center","middle right","bottom left","bottom center","bottom right"],h=u.default.createClass({displayName:"TetherComponent",propTypes:{attachment:s.PropTypes.oneOf(d).isRequired,children:a,className:s.PropTypes.string,classPrefix:s.PropTypes.string,classes:s.PropTypes.object,constraints:s.PropTypes.array,enabled:s.PropTypes.bool,id:s.PropTypes.string,offset:s.PropTypes.string,optimizations:s.PropTypes.object,renderElementTag:s.PropTypes.string,renderElementTo:s.PropTypes.any,style:s.PropTypes.object,targetAttachment:s.PropTypes.oneOf(d),targetModifier:s.PropTypes.string,targetOffset:s.PropTypes.string},getDefaultProps:function(){return{renderElementTag:"div",renderElementTo:null}},componentDidMount:function(){this._targetNode=l.default.findDOMNode(this),this._update()},componentDidUpdate:function(){this._update()},componentWillUnmount:function(){this._destroy()},disable:function(){this._tether.disable()},enable:function(){this._tether.enable()},position:function(){this._tether.position()},_destroy:function(){this._elementParentNode&&(l.default.unmountComponentAtNode(this._elementParentNode),this._elementParentNode.parentNode.removeChild(this._elementParentNode)),this._tether&&this._tether.destroy(),this._elementParentNode=null,this._tether=null},_update:function(){var e=this,t=this.props,n=t.children,r=t.renderElementTag,o=t.renderElementTo,a=n[1];if(!a)return void(this._tether&&this._destroy());if(!this._elementParentNode){this._elementParentNode=document.createElement(r);var i=o||document.body;i.appendChild(this._elementParentNode)}l.default.unstable_renderSubtreeIntoContainer(this,a,this._elementParentNode,function(){e._updateTether()})},_updateTether:function(){var e=this.props,t=(e.renderElementTag,e.renderElementTo,o(e,["renderElementTag","renderElementTo"])),n=i({target:this._targetNode,element:this._elementParentNode},t);this._tether?this._tether.setOptions(n):this._tether=new f.default(n),this._tether.position()},render:function(){var e=this.props.children,t=null;return s.Children.forEach(e,function(e,n){if(0===n)return t=e,!1}),t}});e.exports=h},function(e,t){e.exports=r},function(e,t,n){var r,o;/*! tether 1.3.7 */
	!function(a,i){r=i,o="function"==typeof r?r.call(t,n,t,e):r,!(void 0!==o&&(e.exports=o))}(this,function(e,t,n){"use strict";function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(e){var t=e.getBoundingClientRect(),n={};for(var r in t)n[r]=t[r];if(e.ownerDocument!==document){var a=e.ownerDocument.defaultView.frameElement;if(a){var i=o(a);n.top+=i.top,n.bottom+=i.top,n.left+=i.left,n.right+=i.left}}return n}function a(e){var t=getComputedStyle(e)||{},n=t.position,r=[];if("fixed"===n)return[e];for(var o=e;(o=o.parentNode)&&o&&1===o.nodeType;){var a=void 0;try{a=getComputedStyle(o)}catch(e){}if("undefined"==typeof a||null===a)return r.push(o),r;var i=a,s=i.overflow,u=i.overflowX,p=i.overflowY;/(auto|scroll)/.test(s+p+u)&&("absolute"!==n||["relative","absolute","fixed"].indexOf(a.position)>=0)&&r.push(o)}return r.push(e.ownerDocument.body),e.ownerDocument!==document&&r.push(e.ownerDocument.defaultView),r}function i(){P&&document.body.removeChild(P),P=null}function s(e){var t=void 0;e===document?(t=document,e=document.documentElement):t=e.ownerDocument;var n=t.documentElement,r=o(e),a=O();return r.top-=a.top,r.left-=a.left,"undefined"==typeof r.width&&(r.width=document.body.scrollWidth-r.left-r.right),"undefined"==typeof r.height&&(r.height=document.body.scrollHeight-r.top-r.bottom),r.top=r.top-n.clientTop,r.left=r.left-n.clientLeft,r.right=t.body.clientWidth-r.width-r.left,r.bottom=t.body.clientHeight-r.height-r.top,r}function u(e){return e.offsetParent||document.documentElement}function p(){if(E)return E;var e=document.createElement("div");e.style.width="100%",e.style.height="200px";var t=document.createElement("div");l(t.style,{position:"absolute",top:0,left:0,pointerEvents:"none",visibility:"hidden",width:"200px",height:"150px",overflow:"hidden"}),t.appendChild(e),document.body.appendChild(t);var n=e.offsetWidth;t.style.overflow="scroll";var r=e.offsetWidth;n===r&&(r=t.clientWidth),document.body.removeChild(t);var o=n-r;return E={width:o,height:o}}function l(){var e=arguments.length<=0||void 0===arguments[0]?{}:arguments[0],t=[];return Array.prototype.push.apply(t,arguments),t.slice(1).forEach(function(t){if(t)for(var n in t)({}).hasOwnProperty.call(t,n)&&(e[n]=t[n])}),e}function c(e,t){if("undefined"!=typeof e.classList)t.split(" ").forEach(function(t){t.trim()&&e.classList.remove(t)});else{var n=new RegExp("(^| )"+t.split(" ").join("|")+"( |$)","gi"),r=h(e).replace(n," ");y(e,r)}}function f(e,t){if("undefined"!=typeof e.classList)t.split(" ").forEach(function(t){t.trim()&&e.classList.add(t)});else{c(e,t);var n=h(e)+(" "+t);y(e,n)}}function d(e,t){if("undefined"!=typeof e.classList)return e.classList.contains(t);var n=h(e);return new RegExp("(^| )"+t+"( |$)","gi").test(n)}function h(e){return e.className instanceof e.ownerDocument.defaultView.SVGAnimatedString?e.className.baseVal:e.className}function y(e,t){e.setAttribute("class",t)}function m(e,t,n){n.forEach(function(n){t.indexOf(n)===-1&&d(e,n)&&c(e,n)}),t.forEach(function(t){d(e,t)||f(e,t)})}function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function g(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}function v(e,t){var n=arguments.length<=2||void 0===arguments[2]?1:arguments[2];return e+n>=t&&t>=e-n}function b(){return"undefined"!=typeof performance&&"undefined"!=typeof performance.now?performance.now():+new Date}function D(){for(var e={top:0,left:0},t=arguments.length,n=Array(t),r=0;r<t;r++)n[r]=arguments[r];return n.forEach(function(t){var n=t.top,r=t.left;"string"==typeof n&&(n=parseFloat(n,10)),"string"==typeof r&&(r=parseFloat(r,10)),e.top+=n,e.left+=r}),e}function w(e,t){return"string"==typeof e.left&&e.left.indexOf("%")!==-1&&(e.left=parseFloat(e.left,10)/100*t.width),"string"==typeof e.top&&e.top.indexOf("%")!==-1&&(e.top=parseFloat(e.top,10)/100*t.height),e}function _(e,t){return"scrollParent"===t?t=e.scrollParents[0]:"window"===t&&(t=[pageXOffset,pageYOffset,innerWidth+pageXOffset,innerHeight+pageYOffset]),t===document&&(t=t.documentElement),"undefined"!=typeof t.nodeType&&!function(){var e=t,n=s(t),r=n,o=getComputedStyle(t);if(t=[r.left,r.top,n.width+r.left,n.height+r.top],e.ownerDocument!==document){var a=e.ownerDocument.defaultView;t[0]+=a.pageXOffset,t[1]+=a.pageYOffset,t[2]+=a.pageXOffset,t[3]+=a.pageYOffset}K.forEach(function(e,n){e=e[0].toUpperCase()+e.substr(1),"Top"===e||"Left"===e?t[n]+=parseFloat(o["border"+e+"Width"]):t[n]-=parseFloat(o["border"+e+"Width"])})}(),t}var x=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),T=void 0;"undefined"==typeof T&&(T={modules:[]});var P=null,C=function(){var e=0;return function(){return++e}}(),k={},O=function(){var e=P;e||(e=document.createElement("div"),e.setAttribute("data-tether-id",C()),l(e.style,{top:0,left:0,position:"absolute"}),document.body.appendChild(e),P=e);var t=e.getAttribute("data-tether-id");return"undefined"==typeof k[t]&&(k[t]=o(e),S(function(){delete k[t]})),k[t]},E=null,M=[],S=function(e){M.push(e)},j=function(){for(var e=void 0;e=M.pop();)e()},N=function(){function e(){r(this,e)}return x(e,[{key:"on",value:function(e,t,n){var r=!(arguments.length<=3||void 0===arguments[3])&&arguments[3];"undefined"==typeof this.bindings&&(this.bindings={}),"undefined"==typeof this.bindings[e]&&(this.bindings[e]=[]),this.bindings[e].push({handler:t,ctx:n,once:r})}},{key:"once",value:function(e,t,n){this.on(e,t,n,!0)}},{key:"off",value:function(e,t){if("undefined"!=typeof this.bindings&&"undefined"!=typeof this.bindings[e])if("undefined"==typeof t)delete this.bindings[e];else for(var n=0;n<this.bindings[e].length;)this.bindings[e][n].handler===t?this.bindings[e].splice(n,1):++n}},{key:"trigger",value:function(e){if("undefined"!=typeof this.bindings&&this.bindings[e]){for(var t=0,n=arguments.length,r=Array(n>1?n-1:0),o=1;o<n;o++)r[o-1]=arguments[o];for(;t<this.bindings[e].length;){var a=this.bindings[e][t],i=a.handler,s=a.ctx,u=a.once,p=s;"undefined"==typeof p&&(p=this),i.apply(p,r),u?this.bindings[e].splice(t,1):++t}}}}]),e}();T.Utils={getActualBoundingClientRect:o,getScrollParents:a,getBounds:s,getOffsetParent:u,extend:l,addClass:f,removeClass:c,hasClass:d,updateClasses:m,defer:S,flush:j,uniqueId:C,Evented:N,getScrollBarSize:p,removeUtilElements:i};var A=function(){function e(e,t){var n=[],r=!0,o=!1,a=void 0;try{for(var i,s=e[Symbol.iterator]();!(r=(i=s.next()).done)&&(n.push(i.value),!t||n.length!==t);r=!0);}catch(e){o=!0,a=e}finally{try{!r&&s.return&&s.return()}finally{if(o)throw a}}return n}return function(t,n){if(Array.isArray(t))return t;if(Symbol.iterator in Object(t))return e(t,n);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),x=function(){function e(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),F=function(e,t,n){for(var r=!0;r;){var o=e,a=t,i=n;r=!1,null===o&&(o=Function.prototype);var s=Object.getOwnPropertyDescriptor(o,a);if(void 0!==s){if("value"in s)return s.value;var u=s.get;if(void 0===u)return;return u.call(i)}var p=Object.getPrototypeOf(o);if(null===p)return;e=p,t=a,n=i,r=!0,s=p=void 0}};if("undefined"==typeof T)throw new Error("You must include the utils.js file before tether.js");var B=T.Utils,a=B.getScrollParents,s=B.getBounds,u=B.getOffsetParent,l=B.extend,f=B.addClass,c=B.removeClass,m=B.updateClasses,S=B.defer,j=B.flush,p=B.getScrollBarSize,i=B.removeUtilElements,R=function(){if("undefined"==typeof document)return"";for(var e=document.createElement("div"),t=["transform","WebkitTransform","OTransform","MozTransform","msTransform"],n=0;n<t.length;++n){var r=t[n];if(void 0!==e.style[r])return r}}(),I=[],W=function(){I.forEach(function(e){e.position(!1)}),j()};!function(){var e=null,t=null,n=null,r=function r(){return"undefined"!=typeof t&&t>16?(t=Math.min(t-16,250),void(n=setTimeout(r,250))):void("undefined"!=typeof e&&b()-e<10||(null!=n&&(clearTimeout(n),n=null),e=b(),W(),t=b()-e))};"undefined"!=typeof window&&"undefined"!=typeof window.addEventListener&&["resize","scroll","touchmove"].forEach(function(e){window.addEventListener(e,r)})}();var Y={center:"center",left:"right",right:"left"},z={middle:"middle",top:"bottom",bottom:"top"},q={top:0,left:0,middle:"50%",center:"50%",bottom:"100%",right:"100%"},L=function(e,t){var n=e.left,r=e.top;return"auto"===n&&(n=Y[t.left]),"auto"===r&&(r=z[t.top]),{left:n,top:r}},V=function(e){var t=e.left,n=e.top;return"undefined"!=typeof q[e.left]&&(t=q[e.left]),"undefined"!=typeof q[e.top]&&(n=q[e.top]),{left:t,top:n}},H=function(e){var t=e.split(" "),n=A(t,2),r=n[0],o=n[1];return{top:r,left:o}},U=H,$=function(e){function t(e){var n=this;r(this,t),F(Object.getPrototypeOf(t.prototype),"constructor",this).call(this),this.position=this.position.bind(this),I.push(this),this.history=[],this.setOptions(e,!1),T.modules.forEach(function(e){"undefined"!=typeof e.initialize&&e.initialize.call(n)}),this.position()}return g(t,e),x(t,[{key:"getClass",value:function(){var e=arguments.length<=0||void 0===arguments[0]?"":arguments[0],t=this.options.classes;return"undefined"!=typeof t&&t[e]?this.options.classes[e]:this.options.classPrefix?this.options.classPrefix+"-"+e:e}},{key:"setOptions",value:function(e){var t=this,n=arguments.length<=1||void 0===arguments[1]||arguments[1],r={offset:"0 0",targetOffset:"0 0",targetAttachment:"auto auto",classPrefix:"tether"};this.options=l(r,e);var o=this.options,i=o.element,s=o.target,u=o.targetModifier;if(this.element=i,this.target=s,this.targetModifier=u,"viewport"===this.target?(this.target=document.body,this.targetModifier="visible"):"scroll-handle"===this.target&&(this.target=document.body,this.targetModifier="scroll-handle"),["element","target"].forEach(function(e){if("undefined"==typeof t[e])throw new Error("Tether Error: Both element and target must be defined");"undefined"!=typeof t[e].jquery?t[e]=t[e][0]:"string"==typeof t[e]&&(t[e]=document.querySelector(t[e]))}),f(this.element,this.getClass("element")),this.options.addTargetClasses!==!1&&f(this.target,this.getClass("target")),!this.options.attachment)throw new Error("Tether Error: You must provide an attachment");this.targetAttachment=U(this.options.targetAttachment),this.attachment=U(this.options.attachment),this.offset=H(this.options.offset),this.targetOffset=H(this.options.targetOffset),"undefined"!=typeof this.scrollParents&&this.disable(),"scroll-handle"===this.targetModifier?this.scrollParents=[this.target]:this.scrollParents=a(this.target),this.options.enabled!==!1&&this.enable(n)}},{key:"getTargetBounds",value:function(){if("undefined"==typeof this.targetModifier)return s(this.target);if("visible"===this.targetModifier){if(this.target===document.body)return{top:pageYOffset,left:pageXOffset,height:innerHeight,width:innerWidth};var e=s(this.target),t={height:e.height,width:e.width,top:e.top,left:e.left};return t.height=Math.min(t.height,e.height-(pageYOffset-e.top)),t.height=Math.min(t.height,e.height-(e.top+e.height-(pageYOffset+innerHeight))),t.height=Math.min(innerHeight,t.height),t.height-=2,t.width=Math.min(t.width,e.width-(pageXOffset-e.left)),t.width=Math.min(t.width,e.width-(e.left+e.width-(pageXOffset+innerWidth))),t.width=Math.min(innerWidth,t.width),t.width-=2,t.top<pageYOffset&&(t.top=pageYOffset),t.left<pageXOffset&&(t.left=pageXOffset),t}if("scroll-handle"===this.targetModifier){var e=void 0,n=this.target;n===document.body?(n=document.documentElement,e={left:pageXOffset,top:pageYOffset,height:innerHeight,width:innerWidth}):e=s(n);var r=getComputedStyle(n),o=n.scrollWidth>n.clientWidth||[r.overflow,r.overflowX].indexOf("scroll")>=0||this.target!==document.body,a=0;o&&(a=15);var i=e.height-parseFloat(r.borderTopWidth)-parseFloat(r.borderBottomWidth)-a,t={width:15,height:.975*i*(i/n.scrollHeight),left:e.left+e.width-parseFloat(r.borderLeftWidth)-15},u=0;i<408&&this.target===document.body&&(u=-11e-5*Math.pow(i,2)-.00727*i+22.58),this.target!==document.body&&(t.height=Math.max(t.height,24));var p=this.target.scrollTop/(n.scrollHeight-i);return t.top=p*(i-t.height-u)+e.top+parseFloat(r.borderTopWidth),this.target===document.body&&(t.height=Math.max(t.height,24)),t}}},{key:"clearCache",value:function(){this._cache={}}},{key:"cache",value:function(e,t){return"undefined"==typeof this._cache&&(this._cache={}),"undefined"==typeof this._cache[e]&&(this._cache[e]=t.call(this)),this._cache[e]}},{key:"enable",value:function(){var e=this,t=arguments.length<=0||void 0===arguments[0]||arguments[0];this.options.addTargetClasses!==!1&&f(this.target,this.getClass("enabled")),f(this.element,this.getClass("enabled")),this.enabled=!0,this.scrollParents.forEach(function(t){t!==e.target.ownerDocument&&t.addEventListener("scroll",e.position)}),t&&this.position()}},{key:"disable",value:function(){var e=this;c(this.target,this.getClass("enabled")),c(this.element,this.getClass("enabled")),this.enabled=!1,"undefined"!=typeof this.scrollParents&&this.scrollParents.forEach(function(t){t.removeEventListener("scroll",e.position)})}},{key:"destroy",value:function(){var e=this;this.disable(),I.forEach(function(t,n){t===e&&I.splice(n,1)}),0===I.length&&i()}},{key:"updateAttachClasses",value:function(e,t){var n=this;e=e||this.attachment,t=t||this.targetAttachment;var r=["left","top","bottom","right","middle","center"];"undefined"!=typeof this._addAttachClasses&&this._addAttachClasses.length&&this._addAttachClasses.splice(0,this._addAttachClasses.length),"undefined"==typeof this._addAttachClasses&&(this._addAttachClasses=[]);var o=this._addAttachClasses;e.top&&o.push(this.getClass("element-attached")+"-"+e.top),e.left&&o.push(this.getClass("element-attached")+"-"+e.left),t.top&&o.push(this.getClass("target-attached")+"-"+t.top),t.left&&o.push(this.getClass("target-attached")+"-"+t.left);var a=[];r.forEach(function(e){a.push(n.getClass("element-attached")+"-"+e),a.push(n.getClass("target-attached")+"-"+e)}),S(function(){"undefined"!=typeof n._addAttachClasses&&(m(n.element,n._addAttachClasses,a),n.options.addTargetClasses!==!1&&m(n.target,n._addAttachClasses,a),delete n._addAttachClasses)})}},{key:"position",value:function(){var e=this,t=arguments.length<=0||void 0===arguments[0]||arguments[0];if(this.enabled){this.clearCache();var n=L(this.targetAttachment,this.attachment);this.updateAttachClasses(this.attachment,n);var r=this.cache("element-bounds",function(){return s(e.element)}),o=r.width,a=r.height;if(0===o&&0===a&&"undefined"!=typeof this.lastSize){var i=this.lastSize;o=i.width,a=i.height}else this.lastSize={width:o,height:a};var l=this.cache("target-bounds",function(){return e.getTargetBounds()}),c=l,f=w(V(this.attachment),{width:o,height:a}),d=w(V(n),c),h=w(this.offset,{width:o,height:a}),y=w(this.targetOffset,c);f=D(f,h),d=D(d,y);for(var m=l.left+d.left-f.left,g=l.top+d.top-f.top,v=0;v<T.modules.length;++v){var b=T.modules[v],_=b.position.call(this,{left:m,top:g,targetAttachment:n,targetPos:l,elementPos:r,offset:f,targetOffset:d,manualOffset:h,manualTargetOffset:y,scrollbarSize:k,attachment:this.attachment});if(_===!1)return!1;"undefined"!=typeof _&&"object"==typeof _&&(g=_.top,m=_.left)}var x={page:{top:g,left:m},viewport:{top:g-pageYOffset,bottom:pageYOffset-g-a+innerHeight,left:m-pageXOffset,right:pageXOffset-m-o+innerWidth}},P=this.target.ownerDocument,C=P.defaultView,k=void 0;return C.innerHeight>P.documentElement.clientHeight&&(k=this.cache("scrollbar-size",p),x.viewport.bottom-=k.height),C.innerWidth>P.documentElement.clientWidth&&(k=this.cache("scrollbar-size",p),x.viewport.right-=k.width),["","static"].indexOf(P.body.style.position)!==-1&&["","static"].indexOf(P.body.parentElement.style.position)!==-1||(x.page.bottom=P.body.scrollHeight-g-a,x.page.right=P.body.scrollWidth-m-o),"undefined"!=typeof this.options.optimizations&&this.options.optimizations.moveElement!==!1&&"undefined"==typeof this.targetModifier&&!function(){var t=e.cache("target-offsetparent",function(){return u(e.target)}),n=e.cache("target-offsetparent-bounds",function(){return s(t)}),r=getComputedStyle(t),o=n,a={};if(["Top","Left","Bottom","Right"].forEach(function(e){a[e.toLowerCase()]=parseFloat(r["border"+e+"Width"])}),n.right=P.body.scrollWidth-n.left-o.width+a.right,n.bottom=P.body.scrollHeight-n.top-o.height+a.bottom,x.page.top>=n.top+a.top&&x.page.bottom>=n.bottom&&x.page.left>=n.left+a.left&&x.page.right>=n.right){var i=t.scrollTop,p=t.scrollLeft;x.offset={top:x.page.top-n.top+i-a.top,left:x.page.left-n.left+p-a.left}}}(),this.move(x),this.history.unshift(x),this.history.length>3&&this.history.pop(),t&&j(),!0}}},{key:"move",value:function(e){var t=this;if("undefined"!=typeof this.element.parentNode){var n={};for(var r in e){n[r]={};for(var o in e[r]){for(var a=!1,i=0;i<this.history.length;++i){var s=this.history[i];if("undefined"!=typeof s[r]&&!v(s[r][o],e[r][o])){a=!0;break}}a||(n[r][o]=!0)}}var p={top:"",left:"",right:"",bottom:""},c=function(e,n){var r="undefined"!=typeof t.options.optimizations,o=r?t.options.optimizations.gpu:null;if(o!==!1){var a=void 0,i=void 0;if(e.top?(p.top=0,a=n.top):(p.bottom=0,a=-n.bottom),e.left?(p.left=0,i=n.left):(p.right=0,i=-n.right),window.matchMedia){var s=window.matchMedia("only screen and (min-resolution: 1.3dppx)").matches||window.matchMedia("only screen and (-webkit-min-device-pixel-ratio: 1.3)").matches;s||(i=Math.round(i),a=Math.round(a))}p[R]="translateX("+i+"px) translateY("+a+"px)","msTransform"!==R&&(p[R]+=" translateZ(0)")}else e.top?p.top=n.top+"px":p.bottom=n.bottom+"px",e.left?p.left=n.left+"px":p.right=n.right+"px"},f=!1;if((n.page.top||n.page.bottom)&&(n.page.left||n.page.right)?(p.position="absolute",c(n.page,e.page)):(n.viewport.top||n.viewport.bottom)&&(n.viewport.left||n.viewport.right)?(p.position="fixed",c(n.viewport,e.viewport)):"undefined"!=typeof n.offset&&n.offset.top&&n.offset.left?!function(){p.position="absolute";var r=t.cache("target-offsetparent",function(){return u(t.target)});u(t.element)!==r&&S(function(){t.element.parentNode.removeChild(t.element),r.appendChild(t.element)}),c(n.offset,e.offset),f=!0}():(p.position="absolute",c({top:!0,left:!0},e.page)),!f){for(var d=!0,h=this.element.parentNode;h&&1===h.nodeType&&"BODY"!==h.tagName;){if("static"!==getComputedStyle(h).position){d=!1;break}h=h.parentNode}d||(this.element.parentNode.removeChild(this.element),this.element.ownerDocument.body.appendChild(this.element))}var y={},m=!1;for(var o in p){var g=p[o],b=this.element.style[o];b!==g&&(m=!0,y[o]=g)}m&&S(function(){l(t.element.style,y),t.trigger("repositioned")})}}}]),t}(N);$.modules=[],T.position=W;var X=l($,T),A=function(){function e(e,t){var n=[],r=!0,o=!1,a=void 0;try{for(var i,s=e[Symbol.iterator]();!(r=(i=s.next()).done)&&(n.push(i.value),!t||n.length!==t);r=!0);}catch(e){o=!0,a=e}finally{try{!r&&s.return&&s.return()}finally{if(o)throw a}}return n}return function(t,n){if(Array.isArray(t))return t;if(Symbol.iterator in Object(t))return e(t,n);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),B=T.Utils,s=B.getBounds,l=B.extend,m=B.updateClasses,S=B.defer,K=["left","top","right","bottom"];T.modules.push({position:function(e){var t=this,n=e.top,r=e.left,o=e.targetAttachment;if(!this.options.constraints)return!0;var a=this.cache("element-bounds",function(){return s(t.element)}),i=a.height,u=a.width;if(0===u&&0===i&&"undefined"!=typeof this.lastSize){var p=this.lastSize;u=p.width,i=p.height}var c=this.cache("target-bounds",function(){return t.getTargetBounds()}),f=c.height,d=c.width,h=[this.getClass("pinned"),this.getClass("out-of-bounds")];this.options.constraints.forEach(function(e){var t=e.outOfBoundsClass,n=e.pinnedClass;t&&h.push(t),n&&h.push(n)}),h.forEach(function(e){["left","top","right","bottom"].forEach(function(t){h.push(e+"-"+t)})});var y=[],g=l({},o),v=l({},this.attachment);return this.options.constraints.forEach(function(e){var a=e.to,s=e.attachment,p=e.pin;"undefined"==typeof s&&(s="");var l=void 0,c=void 0;if(s.indexOf(" ")>=0){var h=s.split(" "),m=A(h,2);c=m[0],l=m[1]}else l=c=s;var b=_(t,a);"target"!==c&&"both"!==c||(n<b[1]&&"top"===g.top&&(n+=f,g.top="bottom"),n+i>b[3]&&"bottom"===g.top&&(n-=f,g.top="top")),"together"===c&&("top"===g.top&&("bottom"===v.top&&n<b[1]?(n+=f,g.top="bottom",n+=i,v.top="top"):"top"===v.top&&n+i>b[3]&&n-(i-f)>=b[1]&&(n-=i-f,g.top="bottom",v.top="bottom")),"bottom"===g.top&&("top"===v.top&&n+i>b[3]?(n-=f,g.top="top",n-=i,v.top="bottom"):"bottom"===v.top&&n<b[1]&&n+(2*i-f)<=b[3]&&(n+=i-f,g.top="top",v.top="top")),"middle"===g.top&&(n+i>b[3]&&"top"===v.top?(n-=i,v.top="bottom"):n<b[1]&&"bottom"===v.top&&(n+=i,v.top="top"))),"target"!==l&&"both"!==l||(r<b[0]&&"left"===g.left&&(r+=d,g.left="right"),r+u>b[2]&&"right"===g.left&&(r-=d,g.left="left")),"together"===l&&(r<b[0]&&"left"===g.left?"right"===v.left?(r+=d,g.left="right",r+=u,v.left="left"):"left"===v.left&&(r+=d,g.left="right",r-=u,v.left="right"):r+u>b[2]&&"right"===g.left?"left"===v.left?(r-=d,g.left="left",r-=u,v.left="right"):"right"===v.left&&(r-=d,g.left="left",r+=u,v.left="left"):"center"===g.left&&(r+u>b[2]&&"left"===v.left?(r-=u,v.left="right"):r<b[0]&&"right"===v.left&&(r+=u,v.left="left"))),"element"!==c&&"both"!==c||(n<b[1]&&"bottom"===v.top&&(n+=i,v.top="top"),n+i>b[3]&&"top"===v.top&&(n-=i,v.top="bottom")),"element"!==l&&"both"!==l||(r<b[0]&&("right"===v.left?(r+=u,v.left="left"):"center"===v.left&&(r+=u/2,v.left="left")),r+u>b[2]&&("left"===v.left?(r-=u,v.left="right"):"center"===v.left&&(r-=u/2,v.left="right"))),"string"==typeof p?p=p.split(",").map(function(e){return e.trim()}):p===!0&&(p=["top","left","right","bottom"]),p=p||[];var D=[],w=[];n<b[1]&&(p.indexOf("top")>=0?(n=b[1],D.push("top")):w.push("top")),n+i>b[3]&&(p.indexOf("bottom")>=0?(n=b[3]-i,D.push("bottom")):w.push("bottom")),r<b[0]&&(p.indexOf("left")>=0?(r=b[0],D.push("left")):w.push("left")),r+u>b[2]&&(p.indexOf("right")>=0?(r=b[2]-u,D.push("right")):w.push("right")),D.length&&!function(){var e=void 0;e="undefined"!=typeof t.options.pinnedClass?t.options.pinnedClass:t.getClass("pinned"),y.push(e),D.forEach(function(t){y.push(e+"-"+t)})}(),w.length&&!function(){var e=void 0;e="undefined"!=typeof t.options.outOfBoundsClass?t.options.outOfBoundsClass:t.getClass("out-of-bounds"),y.push(e),w.forEach(function(t){y.push(e+"-"+t)})}(),(D.indexOf("left")>=0||D.indexOf("right")>=0)&&(v.left=g.left=!1),(D.indexOf("top")>=0||D.indexOf("bottom")>=0)&&(v.top=g.top=!1),g.top===o.top&&g.left===o.left&&v.top===t.attachment.top&&v.left===t.attachment.left||(t.updateAttachClasses(v,g),t.trigger("update",{attachment:v,targetAttachment:g}))}),S(function(){t.options.addTargetClasses!==!1&&m(t.target,y,h),m(t.element,y,h)}),{top:n,left:r}}});var B=T.Utils,s=B.getBounds,m=B.updateClasses,S=B.defer;T.modules.push({position:function(e){var t=this,n=e.top,r=e.left,o=this.cache("element-bounds",function(){return s(t.element)}),a=o.height,i=o.width,u=this.getTargetBounds(),p=n+a,l=r+i,c=[];n<=u.bottom&&p>=u.top&&["left","right"].forEach(function(e){var t=u[e];t!==r&&t!==l||c.push(e)}),r<=u.right&&l>=u.left&&["top","bottom"].forEach(function(e){var t=u[e];t!==n&&t!==p||c.push(e)});var f=[],d=[],h=["left","top","right","bottom"];return f.push(this.getClass("abutted")),h.forEach(function(e){f.push(t.getClass("abutted")+"-"+e)}),c.length&&d.push(this.getClass("abutted")),c.forEach(function(e){d.push(t.getClass("abutted")+"-"+e)}),S(function(){t.options.addTargetClasses!==!1&&m(t.target,d,f),m(t.element,d,f)}),!0}});var A=function(){function e(e,t){var n=[],r=!0,o=!1,a=void 0;try{for(var i,s=e[Symbol.iterator]();!(r=(i=s.next()).done)&&(n.push(i.value),!t||n.length!==t);r=!0);}catch(e){o=!0,a=e}finally{try{!r&&s.return&&s.return()}finally{if(o)throw a}}return n}return function(t,n){if(Array.isArray(t))return t;if(Symbol.iterator in Object(t))return e(t,n);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}();return T.modules.push({position:function(e){var t=e.top,n=e.left;if(this.options.shift){var r=this.options.shift;"function"==typeof this.options.shift&&(r=this.options.shift.call(this,{top:t,left:n}));var o=void 0,a=void 0;if("string"==typeof r){r=r.split(" "),r[1]=r[1]||r[0];var i=r,s=A(i,2);o=s[0],a=s[1],o=parseFloat(o,10),a=parseFloat(a,10)}else o=r.top,a=r.left;return t+=o,n+=a,{top:t,left:n}}}}),X})}])});

/***/ },
/* 158 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_158__;

/***/ },
/* 159 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * A higher-order-component for handling onClickOutside for React components.
	 */
	(function(root) {
	
	  // administrative
	  var registeredComponents = [];
	  var handlers = [];
	  var IGNORE_CLASS = 'ignore-react-onclickoutside';
	  var DEFAULT_EVENTS = ['mousedown', 'touchstart'];
	
	  /**
	   * Check whether some DOM node is our Component's node.
	   */
	  var isNodeFound = function(current, componentNode, ignoreClass) {
	    if (current === componentNode) {
	      return true;
	    }
	    // SVG <use/> elements do not technically reside in the rendered DOM, so
	    // they do not have classList directly, but they offer a link to their
	    // corresponding element, which can have classList. This extra check is for
	    // that case.
	    // See: http://www.w3.org/TR/SVG11/struct.html#InterfaceSVGUseElement
	    // Discussion: https://github.com/Pomax/react-onclickoutside/pull/17
	    if (current.correspondingElement) {
	      return current.correspondingElement.classList.contains(ignoreClass);
	    }
	    return current.classList.contains(ignoreClass);
	  };
	
	  /**
	   * Try to find our node in a hierarchy of nodes, returning the document
	   * node as highest noode if our node is not found in the path up.
	   */
	  var findHighest = function(current, componentNode, ignoreClass) {
	    if (current === componentNode) {
	      return true;
	    }
	
	    // If source=local then this event came from 'somewhere'
	    // inside and should be ignored. We could handle this with
	    // a layered approach, too, but that requires going back to
	    // thinking in terms of Dom node nesting, running counter
	    // to React's 'you shouldn't care about the DOM' philosophy.
	    while(current.parentNode) {
	      if (isNodeFound(current, componentNode, ignoreClass)) {
	        return true;
	      }
	      current = current.parentNode;
	    }
	    return current;
	  };
	
	  /**
	   * Generate the event handler that checks whether a clicked DOM node
	   * is inside of, or lives outside of, our Component's node tree.
	   */
	  var generateOutsideCheck = function(componentNode, componentInstance, eventHandler, ignoreClass, preventDefault, stopPropagation) {
	    return function(evt) {
	      if (preventDefault) {
	        evt.preventDefault();
	      }
	      if (stopPropagation) {
	        evt.stopPropagation();
	      }
	      var current = evt.target;
	      if(findHighest(current, componentNode, ignoreClass) !== document) {
	        return;
	      }
	      eventHandler(evt);
	    };
	  };
	
	  /**
	   * This function generates the HOC function that you'll use
	   * in order to impart onOutsideClick listening to an
	   * arbitrary component. It gets called at the end of the
	   * bootstrapping code to yield an instance of the
	   * onClickOutsideHOC function defined inside setupHOC().
	   */
	  function setupHOC(root, React, ReactDOM) {
	
	    // The actual Component-wrapping HOC:
	    return function onClickOutsideHOC(Component, config) {
	      var wrapComponentWithOnClickOutsideHandling = React.createClass({
	        statics: {
	          /**
	           * Access the wrapped Component's class.
	           */
	          getClass: function() {
	            if (Component.getClass) {
	              return Component.getClass();
	            }
	            return Component;
	          }
	        },
	
	        /**
	         * Access the wrapped Component's instance.
	         */
	        getInstance: function() {
	          return Component.prototype.isReactComponent ? this.refs.instance : this;
	        },
	
	        // this is given meaning in componentDidMount
	        __outsideClickHandler: function() {},
	
	        /**
	         * Add click listeners to the current document,
	         * linked to this component's state.
	         */
	        componentDidMount: function() {
	          // If we are in an environment without a DOM such
	          // as shallow rendering or snapshots then we exit
	          // early to prevent any unhandled errors being thrown.
	          if (typeof document === 'undefined' || !document.createElement){
	            return;
	          }
	
	          var instance = this.getInstance();
	          var clickOutsideHandler;
	
	          if(config && typeof config.handleClickOutside === 'function') {
	            clickOutsideHandler = config.handleClickOutside(instance);
	            if(typeof clickOutsideHandler !== 'function') {
	              throw new Error('Component lacks a function for processing outside click events specified by the handleClickOutside config option.');
	            }
	          } else if(typeof instance.handleClickOutside === 'function') {
	            if (React.Component.prototype.isPrototypeOf(instance)) {
	              clickOutsideHandler = instance.handleClickOutside.bind(instance);
	            } else {
	              clickOutsideHandler = instance.handleClickOutside;
	            }
	          } else if(typeof instance.props.handleClickOutside === 'function') {
	            clickOutsideHandler = instance.props.handleClickOutside;
	          } else {
	            throw new Error('Component lacks a handleClickOutside(event) function for processing outside click events.');
	          }
	
	          var componentNode = ReactDOM.findDOMNode(instance);
	          if (componentNode === null) {
	            console.warn('Antipattern warning: there was no DOM node associated with the component that is being wrapped by outsideClick.');
	            console.warn([
	              'This is typically caused by having a component that starts life with a render function that',
	              'returns `null` (due to a state or props value), so that the component \'exist\' in the React',
	              'chain of components, but not in the DOM.\n\nInstead, you need to refactor your code so that the',
	              'decision of whether or not to show your component is handled by the parent, in their render()',
	              'function.\n\nIn code, rather than:\n\n  A{render(){return check? <.../> : null;}\n  B{render(){<A check=... />}\n\nmake sure that you',
	              'use:\n\n  A{render(){return <.../>}\n  B{render(){return <...>{ check ? <A/> : null }<...>}}\n\nThat is:',
	              'the parent is always responsible for deciding whether or not to render any of its children.',
	              'It is not the child\'s responsibility to decide whether a render instruction from above should',
	              'get ignored or not by returning `null`.\n\nWhen any component gets its render() function called,',
	              'that is the signal that it should be rendering its part of the UI. It may in turn decide not to',
	              'render all of *its* children, but it should never return `null` for itself. It is not responsible',
	              'for that decision.'
	            ].join(' '));
	          }
	
	          var fn = this.__outsideClickHandler = generateOutsideCheck(
	            componentNode,
	            instance,
	            clickOutsideHandler,
	            this.props.outsideClickIgnoreClass || IGNORE_CLASS,
	            this.props.preventDefault || false,
	            this.props.stopPropagation || false
	          );
	
	          var pos = registeredComponents.length;
	          registeredComponents.push(this);
	          handlers[pos] = fn;
	
	          // If there is a truthy disableOnClickOutside property for this
	          // component, don't immediately start listening for outside events.
	          if (!this.props.disableOnClickOutside) {
	            this.enableOnClickOutside();
	          }
	        },
	
	        /**
	        * Track for disableOnClickOutside props changes and enable/disable click outside
	        */
	        componentWillReceiveProps: function(nextProps) {
	          if (this.props.disableOnClickOutside && !nextProps.disableOnClickOutside) {
	            this.enableOnClickOutside();
	          } else if (!this.props.disableOnClickOutside && nextProps.disableOnClickOutside) {
	            this.disableOnClickOutside();
	          }
	        },
	
	        /**
	         * Remove the document's event listeners
	         */
	        componentWillUnmount: function() {
	          this.disableOnClickOutside();
	          this.__outsideClickHandler = false;
	          var pos = registeredComponents.indexOf(this);
	          if( pos>-1) {
	            // clean up so we don't leak memory
	            if (handlers[pos]) { handlers.splice(pos, 1); }
	            registeredComponents.splice(pos, 1);
	          }
	        },
	
	        /**
	         * Can be called to explicitly enable event listening
	         * for clicks and touches outside of this element.
	         */
	        enableOnClickOutside: function() {
	          var fn = this.__outsideClickHandler;
	          if (typeof document !== 'undefined') {
	            var events = this.props.eventTypes || DEFAULT_EVENTS;
	            if (!events.forEach) {
	              events = [events];
	            }
	            events.forEach(function (eventName) {
	              document.addEventListener(eventName, fn);
	            });
	          }
	        },
	
	        /**
	         * Can be called to explicitly disable event listening
	         * for clicks and touches outside of this element.
	         */
	        disableOnClickOutside: function() {
	          var fn = this.__outsideClickHandler;
	          if (typeof document !== 'undefined') {
	            var events = this.props.eventTypes || DEFAULT_EVENTS;
	            if (!events.forEach) {
	              events = [events];
	            }
	            events.forEach(function (eventName) {
	              document.removeEventListener(eventName, fn);
	            });
	          }
	        },
	
	        /**
	         * Pass-through render
	         */
	        render: function() {
	          var passedProps = this.props;
	          var props = {};
	          Object.keys(this.props).forEach(function(key) {
	            props[key] = passedProps[key];
	          });
	          if (Component.prototype.isReactComponent) {
	            props.ref = 'instance';
	          }
	          props.disableOnClickOutside = this.disableOnClickOutside;
	          props.enableOnClickOutside = this.enableOnClickOutside;
	          return React.createElement(Component, props);
	        }
	      });
	
	      // Add display name for React devtools
	      (function bindWrappedComponentName(c, wrapper) {
	        var componentName = c.displayName || c.name || 'Component';
	        wrapper.displayName = 'OnClickOutside(' + componentName + ')';
	      }(Component, wrapComponentWithOnClickOutsideHandling));
	
	      return wrapComponentWithOnClickOutsideHandling;
	    };
	  }
	
	  /**
	   * This function sets up the library in ways that
	   * work with the various modulde loading solutions
	   * used in JavaScript land today.
	   */
	  function setupBinding(root, factory) {
	    if (true) {
	      // AMD. Register as an anonymous module.
	      !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(14),__webpack_require__(151)], __WEBPACK_AMD_DEFINE_RESULT__ = function(React, ReactDom) {
	        return factory(root, React, ReactDom);
	      }.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof exports === 'object') {
	      // Node. Note that this does not work with strict
	      // CommonJS, but only CommonJS-like environments
	      // that support module.exports
	      module.exports = factory(root, require('react'), require('react-dom'));
	    } else {
	      // Browser globals (root is window)
	      root.onClickOutside = factory(root, React, ReactDOM);
	    }
	  }
	
	  // Make it all happen
	  setupBinding(root, setupHOC);
	
	}(this));


/***/ },
/* 160 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.formatDate = formatDate;
	exports.formatToSoqlDate = formatToSoqlDate;
	exports.formatToInclusiveSoqlDateRange = formatToInclusiveSoqlDateRange;
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _moment = __webpack_require__(158);
	
	var _moment2 = _interopRequireDefault(_moment);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	// Formats an ISO8601 date to something pretty like January 1, 1970.
	function formatDate(date, format, fallback) {
	  var dateFormat = _lodash2.default.defaultTo(format, 'MMMM D, YYYY');
	  var momentDate = (0, _moment2.default)(date, _moment2.default.ISO_8601);
	  return momentDate.isValid() ? momentDate.format(dateFormat) : fallback;
	}
	
	function formatToSoqlDate(date) {
	  return date.format('YYYY-MM-DDTHH:mm:ss');
	}
	
	function formatToInclusiveSoqlDateRange(value) {
	  var start = formatToSoqlDate((0, _moment2.default)(value.start).startOf('day'));
	  var end = formatToSoqlDate((0, _moment2.default)(value.end).endOf('day'));
	
	  return { start: start, end: end };
	}

/***/ },
/* 161 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = FilterHeader;
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function FilterHeader(_ref) {
	  var name = _ref.name;
	
	  return _react2.default.createElement(
	    "div",
	    { className: "filter-control-title" },
	    _react2.default.createElement(
	      "h3",
	      null,
	      name
	    )
	  );
	}
	
	FilterHeader.propTypes = {
	  name: _react.PropTypes.string
	};

/***/ },
/* 162 */
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
	  var disableApplyFilter = props.disableApplyFilter,
	      onClickApply = props.onClickApply,
	      onClickCancel = props.onClickCancel,
	      onClickClear = props.onClickClear;
	
	
	  return _react2.default.createElement(
	    'div',
	    { className: 'filter-footer' },
	    _react2.default.createElement(
	      'button',
	      { className: 'btn btn-sm btn-transparent clear-btn', onClick: onClickClear },
	      _react2.default.createElement('span', { className: 'socrata-icon-close-2', role: 'presentation' }),
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
	          className: 'btn btn-sm btn-alternate-2 apply-btn',
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
/* 163 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.getDefaultFilterForColumn = getDefaultFilterForColumn;
	exports.getTextFilter = getTextFilter;
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function getDefaultFilterForColumn(column) {
	  return {
	    'function': 'noop',
	    columnName: column.fieldName,
	    arguments: null,
	    isHidden: true
	  };
	}
	
	function getTextFilter(column, filter, values, isNegated) {
	  if (_lodash2.default.isEmpty(values)) {
	    var isHidden = filter.isHidden;
	
	    return _lodash2.default.merge({}, getDefaultFilterForColumn(column), { isHidden: isHidden });
	  } else {
	    var toArgument = function toArgument(value) {
	      if (_lodash2.default.isNull(value)) {
	        return {
	          operator: isNegated ? 'IS NOT NULL' : 'IS NULL'
	        };
	      } else {
	        return {
	          operator: isNegated ? '!=' : '=',
	          operand: value
	        };
	      }
	    };
	
	    return _lodash2.default.assign({}, filter, {
	      'function': 'binaryOperator',
	      joinOn: isNegated ? 'AND' : 'OR',
	      arguments: _lodash2.default.map(values, toArgument)
	    });
	  }
	}

/***/ },
/* 164 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.NumberFilter = undefined;
	
	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _Slider = __webpack_require__(165);
	
	var _Slider2 = _interopRequireDefault(_Slider);
	
	var _FilterHeader = __webpack_require__(161);
	
	var _FilterHeader2 = _interopRequireDefault(_FilterHeader);
	
	var _FilterFooter = __webpack_require__(162);
	
	var _FilterFooter2 = _interopRequireDefault(_FilterFooter);
	
	var _I18n = __webpack_require__(15);
	
	var _numbers = __webpack_require__(175);
	
	var _filters = __webpack_require__(163);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
	
	var NumberFilter = exports.NumberFilter = _react2.default.createClass({
	  displayName: 'NumberFilter',
	
	  propTypes: {
	    filter: _react.PropTypes.object.isRequired,
	    column: _react.PropTypes.shape({
	      rangeMin: _react.PropTypes.number.isRequired,
	      rangeMax: _react.PropTypes.number.isRequired
	    }),
	    onCancel: _react.PropTypes.func.isRequired,
	    onUpdate: _react.PropTypes.func.isRequired
	  },
	
	  getInitialState: function getInitialState() {
	    var _props = this.props,
	        column = _props.column,
	        filter = _props.filter;
	
	
	    return {
	      value: _lodash2.default.defaults(filter.arguments, {
	        start: column.rangeMin,
	        end: column.rangeMax
	      })
	    };
	  },
	  componentDidMount: function componentDidMount() {
	    if (this.firstInput) {
	      this.firstInput.focus();
	    }
	  },
	  onInputChange: function onInputChange(_ref) {
	    var target = _ref.target;
	
	    this.updateValueState(_defineProperty({}, target.id, _lodash2.default.toNumber(target.value)));
	  },
	  onSliderChange: function onSliderChange(newValue) {
	    this.updateValueState(newValue);
	  },
	  getStepInterval: function getStepInterval() {
	    var _props$column = this.props.column,
	        rangeMin = _props$column.rangeMin,
	        rangeMax = _props$column.rangeMax;
	
	
	    return _lodash2.default.min(_lodash2.default.map([rangeMin, rangeMax], _numbers.getPrecision));
	  },
	  updateValueState: function updateValueState(updates) {
	    this.setState({
	      value: _extends({}, this.state.value, updates)
	    });
	  },
	  shouldDisableApply: function shouldDisableApply() {
	    var value = this.state.value;
	
	
	    return _lodash2.default.isEqual(value, this.getInitialState().value);
	  },
	  clearFilter: function clearFilter() {
	    var _props$column2 = this.props.column,
	        rangeMin = _props$column2.rangeMin,
	        rangeMax = _props$column2.rangeMax;
	
	
	    this.updateValueState({
	      start: rangeMin,
	      end: rangeMax
	    });
	  },
	  updateFilter: function updateFilter() {
	    var _props2 = this.props,
	        column = _props2.column,
	        filter = _props2.filter,
	        onUpdate = _props2.onUpdate;
	    var value = this.state.value;
	
	    // Swap the start and end if necessary to ensure the range is valid
	
	    var start = value.start,
	        end = value.end;
	
	    if (start > end) {
	      var _ref2 = [end, start];
	      start = _ref2[0];
	      end = _ref2[1];
	    }
	
	    // Add a small amount to the end of the interval (computed based on precision) to
	    // fake a range that is inclusive on both ends.  The real fix is to generate two
	    // binaryOperator filters from this control (one >=, one <=).
	    end += this.getStepInterval() / 100;
	
	    if (_lodash2.default.isEqual(_lodash2.default.at(value, 'start', 'end'), _lodash2.default.at(column, 'rangeMin', 'rangeMax'))) {
	      var isHidden = filter.isHidden;
	
	      onUpdate(_lodash2.default.merge({}, (0, _filters.getDefaultFilterForColumn)(column), { isHidden: isHidden }));
	    } else {
	      onUpdate(_lodash2.default.merge({}, filter, {
	        'function': 'valueRange',
	        arguments: {
	          start: start,
	          end: end
	        }
	      }));
	    }
	  },
	  renderInputFields: function renderInputFields() {
	    var _this = this;
	
	    var value = this.state.value;
	
	    var step = this.getStepInterval();
	    var formatLabel = _lodash2.default.partialRight(_numbers.roundToPrecision, step);
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'range-text-inputs-container input-group' },
	      _react2.default.createElement('input', {
	        id: 'start',
	        className: 'range-input text-input',
	        type: 'number',
	        value: formatLabel(value.start),
	        step: step,
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
	        value: formatLabel(value.end),
	        step: step,
	        onChange: this.onInputChange,
	        'aria-label': (0, _I18n.translate)('filter_bar.to'),
	        placeholder: (0, _I18n.translate)('filter_bar.to') })
	    );
	  },
	  renderSlider: function renderSlider() {
	    var column = this.props.column;
	    var rangeMin = column.rangeMin,
	        rangeMax = column.rangeMax;
	    var value = this.state.value;
	    var start = value.start,
	        end = value.end;
	
	    var step = this.getStepInterval();
	
	    var sliderProps = {
	      rangeMin: rangeMin,
	      rangeMax: rangeMax,
	      value: {
	        start: _lodash2.default.clamp(start, rangeMin, end),
	        end: _lodash2.default.clamp(end, start, rangeMax)
	      },
	      step: step,
	      onChange: this.onSliderChange
	    };
	
	    return _react2.default.createElement(_Slider2.default, sliderProps);
	  },
	  render: function render() {
	    var _props3 = this.props,
	        column = _props3.column,
	        onCancel = _props3.onCancel;
	
	
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
	        _react2.default.createElement(_FilterHeader2.default, { name: column.name }),
	        this.renderSlider(),
	        this.renderInputFields()
	      ),
	      _react2.default.createElement(_FilterFooter2.default, filterFooterProps)
	    );
	  }
	});
	
	exports.default = NumberFilter;

/***/ },
/* 165 */
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
	
	var _reactInputRange = __webpack_require__(166);
	
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
	  componentWillMount: function componentWillMount() {
	    this.labelId = 'slider-label-' + _lodash2.default.uniqueId();
	  },
	  onChange: function onChange(inputRangeComponent, value) {
	    var newValue = _lodash2.default.isPlainObject(value) ? { start: value.min, end: value.max } : value;
	
	    this.props.onChange(newValue);
	  },
	  formatLabel: function formatLabel(label) {
	    return _react2.default.createElement(
	      'span',
	      { id: this.labelId },
	      _lodash2.default.round(label, 1)
	    );
	  },
	  render: function render() {
	    var displayableValue = void 0;
	    var _props = this.props,
	        rangeMin = _props.rangeMin,
	        rangeMax = _props.rangeMax,
	        step = _props.step,
	        value = _props.value;
	
	
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
	      ariaLabelledby: this.labelId,
	      formatLabel: this.formatLabel
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
/* 166 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module InputRange
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
	
	var _InputRange = __webpack_require__(167);
	
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
/* 167 */
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
	
	var _Slider = __webpack_require__(168);
	
	var _Slider2 = _interopRequireDefault(_Slider);
	
	var _Track = __webpack_require__(171);
	
	var _Track2 = _interopRequireDefault(_Track);
	
	var _Label = __webpack_require__(169);
	
	var _Label2 = _interopRequireDefault(_Label);
	
	var _defaultClassNames = __webpack_require__(172);
	
	var _defaultClassNames2 = _interopRequireDefault(_defaultClassNames);
	
	var _valueTransformer = __webpack_require__(173);
	
	var _valueTransformer2 = _interopRequireDefault(_valueTransformer);
	
	var _util = __webpack_require__(170);
	
	var _propTypes = __webpack_require__(174);
	
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
/* 168 */
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
	
	var _Label = __webpack_require__(169);
	
	var _Label2 = _interopRequireDefault(_Label);
	
	var _util = __webpack_require__(170);
	
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
/* 169 */
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
/* 170 */
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
/* 171 */
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
	
	var _util = __webpack_require__(170);
	
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
/* 172 */
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
/* 173 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module InputRange/valueTransformer
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	
	var _util = __webpack_require__(170);
	
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
/* 174 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * @module InputRange/maxMinValuePropType
	 */
	
	'use strict';
	
	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	exports.maxMinValuePropType = maxMinValuePropType;
	
	var _util = __webpack_require__(170);
	
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
/* 175 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.getPrecision = getPrecision;
	exports.roundToPrecision = roundToPrecision;
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function getPrecision(x) {
	  if (_lodash2.default.isInteger(x) || !_lodash2.default.isFinite(x)) {
	    return 1;
	  }
	
	  var places = _lodash2.default.toString(x).split('.')[1].length;
	  return Math.pow(10, -places);
	}
	
	function roundToPrecision(x, precision) {
	  if (precision < 0 || !_lodash2.default.isFinite(x) || !_lodash2.default.isFinite(precision)) {
	    return x;
	  }
	
	  var places = precision === 1 ? 0 : -Math.log10(precision);
	  return _lodash2.default.round(x, _lodash2.default.round(places));
	}

/***/ },
/* 176 */
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
	
	var _Dropdown = __webpack_require__(18);
	
	var _Dropdown2 = _interopRequireDefault(_Dropdown);
	
	var _SocrataIcon = __webpack_require__(29);
	
	var _SocrataIcon2 = _interopRequireDefault(_SocrataIcon);
	
	var _SearchablePicklist = __webpack_require__(152);
	
	var _SearchablePicklist2 = _interopRequireDefault(_SearchablePicklist);
	
	var _FilterFooter = __webpack_require__(162);
	
	var _FilterFooter2 = _interopRequireDefault(_FilterFooter);
	
	var _filters = __webpack_require__(163);
	
	var _I18n = __webpack_require__(15);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var TextFilter = exports.TextFilter = _react2.default.createClass({
	  displayName: 'TextFilter',
	
	  propTypes: {
	    filter: _react.PropTypes.object.isRequired,
	    column: _react.PropTypes.object.isRequired,
	    onCancel: _react.PropTypes.func.isRequired,
	    onUpdate: _react.PropTypes.func.isRequired,
	    isValidTextFilterColumnValue: _react.PropTypes.func,
	    value: _react.PropTypes.string
	  },
	
	  getDefaultProps: function getDefaultProps() {
	    return {
	      isValidTextFilterColumnValue: function isValidTextFilterColumnValue(column, value) {
	        return Promise.reject(value);
	      }
	    };
	  },
	  getInitialState: function getInitialState() {
	    var filter = this.props.filter;
	
	
	    var selectedValues = _lodash2.default.map(filter.arguments, function (argument) {
	      if (_lodash2.default.includes(['IS NULL', 'IS NOT NULL'], argument.operator)) {
	        return null;
	      }
	
	      return argument.operand;
	    });
	
	    return {
	      value: '',
	      selectedValues: selectedValues,
	      isNegated: _lodash2.default.toLower(filter.joinOn) === 'and',
	      isValidating: false
	    };
	  },
	  componentDidMount: function componentDidMount() {
	    this.isMounted = true;
	  },
	  componentWillUnmount: function componentWillUnmount() {
	    this.isMounted = false;
	  },
	  onChangeSearchTerm: function onChangeSearchTerm(searchTerm) {
	    this.setState({ value: searchTerm });
	  },
	  onSelectOption: function onSelectOption(option) {
	    this.updateSelectedValues(_lodash2.default.union(this.state.selectedValues, [option.value]));
	  },
	  onUnselectOption: function onUnselectOption(option) {
	    this.updateSelectedValues(_lodash2.default.without(this.state.selectedValues, option.value));
	  },
	  updateSelectedValues: function updateSelectedValues(nextSelectedValues) {
	    this.setState({
	      selectedValues: _lodash2.default.uniq(nextSelectedValues)
	    });
	  },
	
	
	  // Remove existing selected values and clear the search term.
	  clearFilter: function clearFilter() {
	    this.updateSelectedValues([]);
	
	    if (this.state.value !== '') {
	      this.setState({ value: '' });
	    }
	  },
	  updateFilter: function updateFilter() {
	    var _props = this.props,
	        column = _props.column,
	        filter = _props.filter,
	        onUpdate = _props.onUpdate;
	    var _state = this.state,
	        selectedValues = _state.selectedValues,
	        isNegated = _state.isNegated;
	
	
	    onUpdate((0, _filters.getTextFilter)(column, filter, selectedValues, isNegated));
	  },
	  isDirty: function isDirty() {
	    var _props2 = this.props,
	        column = _props2.column,
	        filter = _props2.filter;
	    var _state2 = this.state,
	        isNegated = _state2.isNegated,
	        selectedValues = _state2.selectedValues;
	
	
	    return !_lodash2.default.isEqual((0, _filters.getTextFilter)(column, filter, selectedValues, isNegated), filter);
	  },
	  canAddSearchTerm: function canAddSearchTerm(term) {
	    var _this = this;
	
	    var _props3 = this.props,
	        column = _props3.column,
	        isValidTextFilterColumnValue = _props3.isValidTextFilterColumnValue;
	
	    var trimmedTerm = term.trim();
	
	    if (trimmedTerm.length === 0) {
	      return Promise.reject();
	    }
	
	    this.setState({ isValidating: true });
	
	    return isValidTextFilterColumnValue(column, trimmedTerm).then(function () {
	      if (_this.isMounted) {
	        _this.setState({ isValidating: false, value: '' });
	        _this.onSelectOption({ name: trimmedTerm, value: trimmedTerm });
	      }
	    }).catch(function () {
	      if (_this.isMounted) {
	        _this.setState({ isValidating: false });
	      }
	
	      return Promise.reject();
	    });
	  },
	  renderHeader: function renderHeader() {
	    var _this2 = this;
	
	    var column = this.props.column;
	    var isValidating = this.state.isValidating;
	
	
	    var dropdownProps = {
	      onSelection: function onSelection(option) {
	        _this2.setState({ isNegated: option.value === 'true' });
	      },
	      placeholder: this.state.isNegated ? (0, _I18n.translate)('filter_bar.text_filter.is_not') : (0, _I18n.translate)('filter_bar.text_filter.is'),
	      options: [{ title: (0, _I18n.translate)('filter_bar.text_filter.is'), value: 'false' }, { title: (0, _I18n.translate)('filter_bar.text_filter.is_not'), value: 'true' }],
	      disabled: isValidating
	    };
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'text-filter-header' },
	      _react2.default.createElement(
	        'h3',
	        null,
	        column.name
	      ),
	      _react2.default.createElement(_Dropdown2.default, dropdownProps)
	    );
	  },
	  renderSelectedOption: function renderSelectedOption(option) {
	    var title = _lodash2.default.isNull(option.value) ? _react2.default.createElement(
	      'em',
	      null,
	      option.title
	    ) : option.title;
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'searchable-picklist-selected-option' },
	      _react2.default.createElement(_SocrataIcon2.default, { name: 'filter' }),
	      _react2.default.createElement(
	        'span',
	        { className: 'searchable-picklist-selected-option-title' },
	        title
	      ),
	      _react2.default.createElement(_SocrataIcon2.default, { name: 'close-2' })
	    );
	  },
	  renderSuggestedOption: function renderSuggestedOption(option) {
	    var title = _lodash2.default.isNull(option.value) ? _react2.default.createElement(
	      'em',
	      null,
	      option.title
	    ) : option.title;
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'searchable-picklist-option' },
	      title
	    );
	  },
	  render: function render() {
	    var _this3 = this;
	
	    var _props4 = this.props,
	        column = _props4.column,
	        onCancel = _props4.onCancel;
	    var _state3 = this.state,
	        value = _state3.value,
	        selectedValues = _state3.selectedValues,
	        isValidating = _state3.isValidating;
	
	    // Create the "null" suggestion to allow filtering on empty values.
	
	    var nullOption = {
	      title: (0, _I18n.translate)('filter_bar.text_filter.no_value'),
	      value: null,
	      group: (0, _I18n.translate)('filter_bar.text_filter.suggested_values'),
	      render: this.renderSuggestedOption
	    };
	
	    var options = _lodash2.default.chain(column.top).filter(function (text) {
	      return _lodash2.default.toLower(text.item).match(_lodash2.default.toLower(value));
	    }).map(function (text) {
	      return {
	        title: text.item,
	        value: text.item,
	        group: (0, _I18n.translate)('filter_bar.text_filter.suggested_values'),
	        render: _this3.renderSuggestedOption
	      };
	    }).value();
	
	    var selectedOptions = _lodash2.default.map(selectedValues, function (selectedValue) {
	      return {
	        title: _lodash2.default.isNull(selectedValue) ? (0, _I18n.translate)('filter_bar.text_filter.no_value') : selectedValue,
	        value: selectedValue,
	        render: _this3.renderSelectedOption
	      };
	    });
	
	    var picklistProps = {
	      onBlur: _lodash2.default.noop,
	      onSelection: this.onSelectOption,
	      onChangeSearchTerm: this.onChangeSearchTerm,
	      options: _lodash2.default.concat(nullOption, options).filter(function (option) {
	        return !_lodash2.default.includes(selectedValues, option.value);
	      }),
	      value: value,
	      selectedOptions: selectedOptions,
	      onClickSelectedOption: this.onUnselectOption,
	      canAddSearchTerm: this.canAddSearchTerm
	    };
	
	    var filterFooterProps = {
	      disableApplyFilter: !this.isDirty() || isValidating,
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
	        this.renderHeader(),
	        _react2.default.createElement(_SearchablePicklist2.default, picklistProps)
	      ),
	      _react2.default.createElement(_FilterFooter2.default, filterFooterProps)
	    );
	  }
	});
	
	exports.default = TextFilter;

/***/ },
/* 177 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _I18n = __webpack_require__(15);
	
	var _a11y = __webpack_require__(178);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	exports.default = _react2.default.createClass({
	  displayName: 'FilterConfig',
	
	  propTypes: {
	    filter: _react.PropTypes.object.isRequired,
	    onRemove: _react.PropTypes.func.isRequired,
	    onUpdate: _react.PropTypes.func.isRequired
	  },
	
	  componentDidMount: function componentDidMount() {
	    var actionableElement = (0, _a11y.getFirstActionableElement)(this.configElement);
	    if (actionableElement) {
	      actionableElement.focus();
	    }
	  },
	  setFilterHidden: function setFilterHidden(bool) {
	    var _this = this;
	
	    return function () {
	      var _props = _this.props,
	          filter = _props.filter,
	          onUpdate = _props.onUpdate;
	
	      var newFilter = _lodash2.default.merge({}, filter, {
	        isHidden: bool
	      });
	
	      onUpdate(newFilter);
	    };
	  },
	  render: function render() {
	    var _this2 = this;
	
	    var filter = this.props.filter;
	
	
	    return _react2.default.createElement(
	      'div',
	      { className: 'filter-config', ref: function ref(_ref) {
	          return _this2.configElement = _ref;
	        } },
	      _react2.default.createElement(
	        'form',
	        { className: 'filter-options' },
	        _react2.default.createElement(
	          'div',
	          { className: 'radiobutton' },
	          _react2.default.createElement(
	            'div',
	            null,
	            _react2.default.createElement('input', {
	              id: 'hidden',
	              type: 'radio',
	              checked: filter.isHidden,
	              onChange: this.setFilterHidden(true) }),
	            _react2.default.createElement(
	              'label',
	              { htmlFor: 'hidden' },
	              _react2.default.createElement('span', { className: 'fake-radiobutton' }),
	              _react2.default.createElement(
	                'span',
	                { className: 'option-label' },
	                (0, _I18n.translate)('filter_bar.config.hidden_label')
	              ),
	              _react2.default.createElement(
	                'div',
	                { className: 'setting-description' },
	                (0, _I18n.translate)('filter_bar.config.hidden_description')
	              )
	            )
	          ),
	          _react2.default.createElement(
	            'div',
	            null,
	            _react2.default.createElement('input', {
	              id: 'viewers-can-edit',
	              type: 'radio',
	              checked: !filter.isHidden,
	              onChange: this.setFilterHidden(false) }),
	            _react2.default.createElement(
	              'label',
	              { htmlFor: 'viewers-can-edit' },
	              _react2.default.createElement('span', { className: 'fake-radiobutton' }),
	              _react2.default.createElement(
	                'span',
	                { className: 'option-label' },
	                (0, _I18n.translate)('filter_bar.config.viewers_can_edit_label')
	              ),
	              _react2.default.createElement(
	                'div',
	                { className: 'setting-description' },
	                (0, _I18n.translate)('filter_bar.config.viewers_can_edit_description')
	              )
	            )
	          )
	        )
	      ),
	      _react2.default.createElement(
	        'div',
	        { className: 'filter-footer' },
	        _react2.default.createElement(
	          'button',
	          { className: 'btn btn-sm btn-transparent remove-btn', onClick: this.props.onRemove },
	          _react2.default.createElement('span', { className: 'socrata-icon-close-2' }),
	          (0, _I18n.translate)('filter_bar.remove_filter')
	        )
	      )
	    );
	  }
	});

/***/ },
/* 178 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.getFirstActionableElement = undefined;
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	/**
	 * Find the first actionable element within an element, using an exludedSelector, if any, and
	 * falling back to the first actionable element, if a non-excluded element wasn't found.
	 */
	var getFirstActionableElement = exports.getFirstActionableElement = function getFirstActionableElement(element, excludedSelector) {
	  var firstActionableElement = element.querySelector('input, button, a');
	
	  if (_lodash2.default.isString(excludedSelector)) {
	    var firstNonExcludedActionableElement = element.querySelector('input:not(' + excludedSelector + '), button:not(' + excludedSelector + '), a:not(' + excludedSelector + ')');
	    return firstNonExcludedActionableElement || firstActionableElement;
	  } else {
	    return firstActionableElement;
	  }
	};

/***/ },
/* 179 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _jquery = __webpack_require__(19);
	
	var _jquery2 = _interopRequireDefault(_jquery);
	
	var _collapsible = __webpack_require__(180);
	
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
	     * The provenance is used to display an authority badge icon and text.
	     */
	    provenance: _react.PropTypes.oneOf(['official', 'community', null]),
	
	    /**
	     * The provenanceIcon is used to display the appropriate icon for the authority badge
	     */
	    provenanceIcon: _react.PropTypes.oneOf(['official2', 'community', null]),
	
	    /**
	     * The hideProvenance is used to conditionally hide the authority badge depending on feature flags.
	     */
	    hideProvenance: _react.PropTypes.bool,
	
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
	    this.$description = (0, _jquery2.default)(this.description);
	    this.ellipsify();
	  },
	  componentWillUpdate: function componentWillUpdate(nextProps) {
	    if (this.shouldEllipsify(this.props, nextProps)) {
	      this.$description.trigger('destroy.dot');
	      this.resetParentHeight();
	    }
	  },
	  componentDidUpdate: function componentDidUpdate(prevProps) {
	    if (this.shouldEllipsify(prevProps, this.props)) {
	      this.ellipsify();
	    }
	  },
	  resetParentHeight: function resetParentHeight() {
	    this.description.parentElement.style.height = 'auto';
	  },
	  shouldEllipsify: function shouldEllipsify(prevProps, nextProps) {
	    return prevProps.description !== nextProps.description;
	  },
	  ellipsify: function ellipsify() {
	    if (this.metadataPane && this.description) {
	      var metadataHeight = this.metadataPane.getBoundingClientRect().height;
	      var descriptionHeight = this.description.getBoundingClientRect().height;
	
	      if (descriptionHeight < metadataHeight) {
	        this.description.style.height = metadataHeight + 'px';
	      }
	    }
	
	    var _props = this.props,
	        descriptionLines = _props.descriptionLines,
	        onExpandDescription = _props.onExpandDescription;
	
	    var descriptionLineHeight = 24;
	    var descriptionPadding = 11;
	    var height = descriptionLines * descriptionLineHeight + 2 * descriptionPadding;
	
	    (0, _collapsible2.default)(this.description, {
	      height: height,
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
	      _react2.default.createElement(
	        'div',
	        { className: 'entry-meta topics' },
	        footer
	      )
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
	    var _props2 = this.props,
	        category = _props2.category,
	        isPrivate = _props2.isPrivate,
	        name = _props2.name,
	        renderButtons = _props2.renderButtons,
	        provenance = _props2.provenance,
	        provenanceIcon = _props2.provenanceIcon,
	        hideProvenance = _props2.hideProvenance;
	
	
	    var privateIcon = isPrivate ? _react2.default.createElement('span', {
	      className: 'socrata-icon-private',
	      'aria-label': (0, _I18n.translate)('info_pane.private_notice'),
	      title: (0, _I18n.translate)('info_pane.private_notice') }) : null;
	
	    var categoryBadge = category ? _react2.default.createElement(
	      'span',
	      { className: 'tag-category' },
	      _lodash2.default.upperFirst(category)
	    ) : null;
	
	    var buttons = renderButtons ? _react2.default.createElement(
	      'div',
	      { className: 'entry-actions' },
	      renderButtons(this.props)
	    ) : null;
	
	    var provenanceBadge = hideProvenance || !provenance ? null : _react2.default.createElement(
	      'span',
	      { className: 'tag-' + provenance },
	      _react2.default.createElement('span', { 'aria-hidden': true, className: 'socrata-icon-' + provenanceIcon }),
	      (0, _I18n.translate)('info_pane.' + provenance)
	    );
	
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
	            provenanceBadge,
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
/* 180 */
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
	
	  $el.find('.collapse-toggle').off('click').on('click', function (event) {
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
/* 181 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.ModalFooter = exports.ModalContent = exports.ModalHeader = exports.Modal = undefined;
	
	var _Header = __webpack_require__(182);
	
	Object.defineProperty(exports, 'ModalHeader', {
	  enumerable: true,
	  get: function get() {
	    return _interopRequireDefault(_Header).default;
	  }
	});
	
	var _Content = __webpack_require__(183);
	
	Object.defineProperty(exports, 'ModalContent', {
	  enumerable: true,
	  get: function get() {
	    return _interopRequireDefault(_Content).default;
	  }
	});
	
	var _Footer = __webpack_require__(184);
	
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
	
	    var _props = this.props,
	        children = _props.children,
	        className = _props.className,
	        fullScreen = _props.fullScreen,
	        overlay = _props.overlay;
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
/* 182 */
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
	  var children = props.children,
	      className = props.className,
	      title = props.title,
	      onDismiss = props.onDismiss;
	
	
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
	      _react2.default.createElement('span', { className: 'socrata-icon-close-2' })
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
/* 183 */
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
	  var children = props.children,
	      className = props.className;
	
	
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
/* 184 */
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
	  var children = props.children,
	      className = props.className;
	
	
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

/***/ },
/* 185 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.ExpandableMenuListItem = exports.MenuListItem = exports.SideMenu = undefined;
	
	var _MenuListItem = __webpack_require__(186);
	
	Object.defineProperty(exports, 'MenuListItem', {
	  enumerable: true,
	  get: function get() {
	    return _interopRequireDefault(_MenuListItem).default;
	  }
	});
	
	var _ExpandableMenuListItem = __webpack_require__(187);
	
	Object.defineProperty(exports, 'ExpandableMenuListItem', {
	  enumerable: true,
	  get: function get() {
	    return _interopRequireDefault(_ExpandableMenuListItem).default;
	  }
	});
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _classnames = __webpack_require__(13);
	
	var _classnames2 = _interopRequireDefault(_classnames);
	
	var _I18n = __webpack_require__(15);
	
	var _keycodes = __webpack_require__(17);
	
	var _a11y = __webpack_require__(178);
	
	var _SocrataIcon = __webpack_require__(29);
	
	var _SocrataIcon2 = _interopRequireDefault(_SocrataIcon);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var SideMenu = exports.SideMenu = _react2.default.createClass({
	  displayName: 'SideMenu',
	
	  propTypes: {
	    /**
	     * The title displayed at the top of the menu.
	     */
	    title: _react.PropTypes.string,
	
	    /**
	     * Whether the menu is anchored to the left of the page. If true, the menu will anchor to the
	     * left side of the page, if false, it will be anchored to the right side of the page. Defaults
	     * to true.
	     */
	    isAnchoredLeft: _react.PropTypes.bool,
	
	    /**
	     * Whether the menu is visible, defaults to false.
	     */
	    isOpen: _react.PropTypes.bool,
	
	    /**
	     * The click handler for the menu's dismiss button. Note that this is not invoked when clicking
	     * outside of the menu element, nor when pressing the escape key. The consuming application
	     * should invoke this behavior.
	     */
	    onDismiss: _react.PropTypes.func,
	
	    /**
	     * Any children elements you'd like to render. Accessible as a prop or like this:
	     * <SideMenu>
	     *   <OtherComponent />
	     * </SideMenu>
	     */
	    children: _react.PropTypes.node
	  },
	
	  getDefaultProps: function getDefaultProps() {
	    return {
	      title: null,
	      isOpen: false,
	      isAnchoredLeft: true,
	      onDismiss: _lodash2.default.noop,
	      children: null
	    };
	  },
	  componentDidMount: function componentDidMount() {
	    var _this = this;
	
	    this.toggleVisibility();
	
	    this.bodyClickHandler = function (event) {
	      var _props = _this.props,
	          isOpen = _props.isOpen,
	          onDismiss = _props.onDismiss;
	
	
	      if (isOpen && !_this.menuElement.contains(event.target)) {
	        onDismiss();
	      }
	    };
	
	    this.bodyEscapeHandler = function (event) {
	      var _props2 = _this.props,
	          isOpen = _props2.isOpen,
	          onDismiss = _props2.onDismiss;
	
	
	      if (isOpen && event.keyCode === _keycodes.ESCAPE) {
	        onDismiss();
	      }
	    };
	
	    document.body.addEventListener('click', this.bodyClickHandler);
	    document.body.addEventListener('keyup', this.bodyEscapeHandler);
	  },
	  componentDidUpdate: function componentDidUpdate(oldProps) {
	    var isOpen = this.props.isOpen;
	
	
	    if (oldProps.isOpen !== isOpen) {
	      this.toggleVisibility();
	    }
	  },
	  componentWillUnmount: function componentWillUnmount() {
	    document.body.removeEventListener('click', this.bodyClickHandler);
	    document.body.removeEventListener('keyup', this.bodyEscapeHandler);
	  },
	  focusFirstActionableElement: function focusFirstActionableElement() {
	    var element = (0, _a11y.getFirstActionableElement)(this.menuElement, '.menu-header-dismiss');
	
	    return element ? element.focus() : this.dismissButton.focus();
	  },
	  toggleVisibility: function toggleVisibility() {
	    var isOpen = this.props.isOpen;
	
	
	    if (isOpen) {
	      this.menuElement.classList.add('active');
	      this.focusFirstActionableElement();
	    } else {
	      this.menuElement.classList.remove('active');
	    }
	  },
	  render: function render() {
	    var _this2 = this;
	
	    var _props3 = this.props,
	        title = _props3.title,
	        children = _props3.children,
	        onDismiss = _props3.onDismiss,
	        isAnchoredLeft = _props3.isAnchoredLeft;
	
	
	    var menuProps = {
	      className: (0, _classnames2.default)('side-menu', {
	        'menu-anchor-left': isAnchoredLeft,
	        'menu-anchor-right': !isAnchoredLeft
	      }),
	      ref: function ref(_ref) {
	        return _this2.menuElement = _ref;
	      }
	    };
	
	    var header = title ? _react2.default.createElement(
	      'h4',
	      { className: 'menu-header-title' },
	      title
	    ) : null;
	
	    var dismissProps = {
	      className: 'btn btn-block btn-transparent menu-header-dismiss',
	      'aria-label': (0, _I18n.translate)('menu.aria_close'),
	      onClick: onDismiss,
	      ref: function ref(_ref2) {
	        return _this2.dismissButton = _ref2;
	      }
	    };
	
	    return _react2.default.createElement(
	      'div',
	      menuProps,
	      _react2.default.createElement(
	        'div',
	        { className: 'menu-header' },
	        header,
	        _react2.default.createElement(
	          'button',
	          dismissProps,
	          _react2.default.createElement(_SocrataIcon2.default, { name: 'close-2' })
	        )
	      ),
	      _react2.default.createElement(
	        'ul',
	        { className: 'menu-navigation' },
	        children
	      )
	    );
	  }
	});
	
	exports.default = SideMenu;

/***/ },
/* 186 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.MenuListItem = undefined;
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _SocrataIcon = __webpack_require__(29);
	
	var _SocrataIcon2 = _interopRequireDefault(_SocrataIcon);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var MenuListItem = exports.MenuListItem = function MenuListItem(props) {
	  var iconName = props.iconName,
	      text = props.text,
	      onClick = props.onClick;
	
	
	  var icon = iconName ? _react2.default.createElement(_SocrataIcon2.default, { name: iconName }) : null;
	
	  return _react2.default.createElement(
	    'li',
	    null,
	    _react2.default.createElement(
	      'button',
	      { className: 'btn btn-transparent menu-list-item', onClick: onClick },
	      icon,
	      text
	    )
	  );
	};
	
	MenuListItem.propTypes = {
	  iconName: _react.PropTypes.string,
	  text: _react.PropTypes.string.isRequired,
	  onClick: _react.PropTypes.func
	};
	
	MenuListItem.defaultProps = {
	  onClick: _lodash2.default.noop
	};
	
	exports.default = MenuListItem;

/***/ },
/* 187 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.ExpandableMenuListItem = undefined;
	
	var _lodash = __webpack_require__(12);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _react = __webpack_require__(14);
	
	var _react2 = _interopRequireDefault(_react);
	
	var _classnames = __webpack_require__(13);
	
	var _classnames2 = _interopRequireDefault(_classnames);
	
	var _SocrataIcon = __webpack_require__(29);
	
	var _SocrataIcon2 = _interopRequireDefault(_SocrataIcon);
	
	var _a11y = __webpack_require__(178);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var ExpandableMenuListItem = exports.ExpandableMenuListItem = _react2.default.createClass({
	  displayName: 'ExpandableMenuListItem',
	
	  propTypes: {
	    iconName: _react.PropTypes.string,
	    text: _react.PropTypes.string.isRequired,
	    onClick: _react.PropTypes.func,
	    children: _react.PropTypes.node
	  },
	
	  getDefaultProps: function getDefaultProps() {
	    return {
	      onClick: _lodash2.default.noop
	    };
	  },
	  getInitialState: function getInitialState() {
	    return {
	      isOpen: false
	    };
	  },
	  componentDidUpdate: function componentDidUpdate(oldProps, oldState) {
	    var children = this.props.children;
	    var isOpen = this.state.isOpen;
	
	    // Sets focus on the first actionable item inside of the children
	
	    if (oldState.isOpen !== isOpen && children) {
	      var actionableElement = (0, _a11y.getFirstActionableElement)(this.contentElement);
	
	      if (isOpen && actionableElement) {
	        actionableElement.focus();
	      } else {
	        this.buttonElement.focus();
	      }
	    }
	  },
	  onClick: function onClick() {
	    var onClick = this.props.onClick;
	    var isOpen = this.state.isOpen;
	
	
	    this.setState({ isOpen: !isOpen });
	    onClick();
	  },
	  render: function render() {
	    var _this = this;
	
	    var _props = this.props,
	        iconName = _props.iconName,
	        text = _props.text,
	        children = _props.children;
	    var isOpen = this.state.isOpen;
	
	
	    var buttonProps = {
	      className: (0, _classnames2.default)('btn btn-transparent menu-list-item', {
	        'active': isOpen
	      }),
	      onClick: this.onClick,
	      ref: function ref(_ref) {
	        return _this.buttonElement = _ref;
	      }
	    };
	
	    var icon = iconName ? _react2.default.createElement(_SocrataIcon2.default, { name: iconName }) : null;
	
	    var childrenProps = {
	      className: 'menu-list-item-content',
	      ref: function ref(_ref2) {
	        return _this.contentElement = _ref2;
	      }
	    };
	
	    var content = children ? _react2.default.createElement(
	      'div',
	      childrenProps,
	      children
	    ) : null;
	
	    return _react2.default.createElement(
	      'li',
	      null,
	      _react2.default.createElement(
	        'button',
	        buttonProps,
	        icon,
	        text,
	        _react2.default.createElement(
	          'span',
	          { className: 'arrow' },
	          _react2.default.createElement(_SocrataIcon2.default, { name: 'arrow-down' })
	        )
	      ),
	      content
	    );
	  }
	});
	
	exports.default = ExpandableMenuListItem;

/***/ }
/******/ ])
});
;
//# sourceMappingURL=socrata-components.js-ea294776.map