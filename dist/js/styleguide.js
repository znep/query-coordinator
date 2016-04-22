/*!
 * Socrata Styleguide v1.0.0
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

	var Styleguide = {
	  DropdownFactory: __webpack_require__(1),
	  FlannelFactory: __webpack_require__(2),
	  FlyoutFactory: __webpack_require__(4),
	  MenuFactory: __webpack_require__(5),
	  ModalFactory: __webpack_require__(6),
	  ToggleFactory: __webpack_require__(7),
	  TourFactory: __webpack_require__(8)
	};

	module.exports = function(element) {
	  document.addEventListener('DOMContentLoaded', function() {
	    new Styleguide.DropdownFactory(element);
	    new Styleguide.FlannelFactory(element);
	    new Styleguide.FlyoutFactory(element);
	    new Styleguide.MenuFactory(element);
	    new Styleguide.ModalFactory(element);
	    new Styleguide.ToggleFactory(element);
	    new Styleguide.TourFactory(element);
	  });

	  return Styleguide;
	};


/***/ },
/* 1 */
/***/ function(module, exports) {

	var DropdownFactory = module.exports = function(element) {
	  this.dropdowns = Array.prototype.slice.call(element.querySelectorAll('[data-dropdown]'));
	  this.dropdowns.forEach(function(dropdown) {
	    new Dropdown(dropdown);
	  });
	}

	var Dropdown = function(element) {
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
	  initEvents: function() {
	    var obj = this;
	    // Reposition dropdown if it's near the edge of the window to avoid
	    // the dropdown making the window larger than we wanted
	    positionDropdown();

	    obj.dd.addEventListener('click', function(event) {
	      event.stopPropagation();
	      positionDropdown();
	      obj.dd.classList.toggle('active');
	      return false;
	    });

	    if (obj.selectable) {
	      obj.opts.forEach(function(opt) {
	        opt.addEventListener('click', function(event) {
	          event.preventDefault();

	          var node = opt;
	          var index = 0;

	          while ((node = node.previousElementSibling) !== null) {
	            index++;
	          }

	          obj.dd.dataset.value = opt.textContent;
	          obj.dd.dataset.index = index;

	          obj.placeholder.innerHTML = opt.innerText.trim();

	          return false;
	        });
	      });
	    }

	    document.addEventListener('click', function() {
	      var dropdowns = document.querySelectorAll('.dropdown');
	      for (var i = 0; i < dropdowns.length; i++) {
	        dropdowns[i].classList.remove('active');
	      }
	    });

	    window.addEventListener('resize', function() {
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
	      } while ((node = node.offsetParent) !== null);

	      // Update dropdown options position if needed
	      if (optionsElementWidth + left >= windowWidth || optionsElement.style.left) {
	        var dropdownWidth = obj.dd.getBoundingClientRect().width;
	        optionsElement.style.left = -(optionsElementWidth - dropdownWidth) + 'px';
	      }
	    }
	  }
	}


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var velocity = __webpack_require__(3);

	var FlannelFactory = module.exports = function(element) {
	  var mobileBreakpoint = 420;
	  var animationDuration = 300;
	  var animationEasing = [.645, .045, .355, 1];
	  var padding = 10;
	  var hoverables = Array.prototype.slice.apply(document.querySelectorAll('[data-flannel]'));

	  function hideFlannel(flannel, hoverable) {
	    if (document.body.offsetWidth < mobileBreakpoint) {
	      velocity(flannel, {
	        left: document.body.offsetWidth
	      }, {
	        duration: animationDuration,
	        easing: animationEasing,
	        complete: function() {
	          flannel.classList.add('flannel-hidden');
	          hoverable.classList.remove('active');
	          document.body.style.overflow = '';
	        }
	      });
	    } else {
	      flannel.classList.add('flannel-hidden');
	      hoverable.classList.remove('active');
	    }
	  }

	  function positionFlannel(flannel, hoverable) {
	    var node = hoverable;
	    var left = 0;
	    var top = 0;
	    var flannelWidth = flannel.getBoundingClientRect().width;
	    var windowWidth = document.body.offsetWidth;

	    do {
	      left += node.offsetLeft;
	      top += node.offsetTop;
	    } while ((node = node.offsetParent) !== null);

	    left = left + hoverable.offsetWidth / 2;
	    top = top + hoverable.offsetHeight + padding;

	    if (left + flannelWidth > windowWidth && windowWidth >= mobileBreakpoint) {
	      flannel.classList.remove('flannel-right');
	      flannel.classList.add('flannel-left');
	      left -= flannelWidth;
	    } else {
	      flannel.classList.remove('flannel-left');
	      flannel.classList.add('flannel-right');
	    }

	    if (windowWidth >= mobileBreakpoint) {
	      flannel.style.left = left + 'px';
	      flannel.style.top = top + 'px';
	      document.body.style.overflow = '';
	    } else {
	      flannel.style.left = windowWidth + 'px';
	      flannel.style.top = 0;
	      velocity(flannel, {
	        left: 0
	      }, {
	        duration: animationDuration,
	        easing: animationEasing,
	        complete: function() {
	          document.body.style.overflow = 'hidden';
	        }
	      });
	    }
	  }

	  hoverables.forEach(function(hoverable) {
	    var flannelId = hoverable.getAttribute('data-flannel');
	    var flannel = document.querySelector('#' + flannelId);
	    var dismissals = Array.prototype.slice.apply(flannel.querySelectorAll('[data-flannel-dismiss]'));

	    dismissals.forEach(function(dismissal) {
	      dismissal.addEventListener('click', function() {
	        hideFlannel(flannel, hoverable);
	      });
	    });

	    hoverable.addEventListener('click', function(event) {
	      event.stopPropagation();

	      flannel.classList.toggle('flannel-hidden');
	      positionFlannel(flannel, hoverable);
	    });

	    document.body.addEventListener('click', function(event) {
	      if (flannel.classList.contains('flannel-hidden')) {
	        return;
	      }

	      var node = event.target;

	      while (node.parentElement) {
	        if (node.id === flannelId) {
	          return;
	        }

	        node = node.parentElement;
	      }

	      hideFlannel(flannel, hoverable);
	    });

	    document.body.addEventListener('keyup', function(event) {
	      var key = event.which || event.keyCode;

	      // ESC
	      if (key === 27) {
	        hideFlannel(flannel, hoverable);
	      }
	    });

	    window.addEventListener('resize', function() {
	      if (!flannel.classList.contains('flannel-hidden')) {
	        positionFlannel(flannel, hoverable);
	      }
	    });

	    positionFlannel(flannel, hoverable);
	  });
	}


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;/*! VelocityJS.org (1.2.3). (C) 2014 Julian Shapiro. MIT @license: en.wikipedia.org/wiki/MIT_License */

	/*************************
	   Velocity jQuery Shim
	*************************/

	/*! VelocityJS.org jQuery Shim (1.0.1). (C) 2014 The jQuery Foundation. MIT @license: en.wikipedia.org/wiki/MIT_License. */

	/* This file contains the jQuery functions that Velocity relies on, thereby removing Velocity's dependency on a full copy of jQuery, and allowing it to work in any environment. */
	/* These shimmed functions are only used if jQuery isn't present. If both this shim and jQuery are loaded, Velocity defaults to jQuery proper. */
	/* Browser support: Using this shim instead of jQuery proper removes support for IE8. */

	;(function (window) {
	    /***************
	         Setup
	    ***************/

	    /* If jQuery is already loaded, there's no point in loading this shim. */
	    if (window.jQuery) {
	        return;
	    }

	    /* jQuery base. */
	    var $ = function (selector, context) {
	        return new $.fn.init(selector, context);
	    };

	    /********************
	       Private Methods
	    ********************/

	    /* jQuery */
	    $.isWindow = function (obj) {
	        /* jshint eqeqeq: false */
	        return obj != null && obj == obj.window;
	    };

	    /* jQuery */
	    $.type = function (obj) {
	        if (obj == null) {
	            return obj + "";
	        }

	        return typeof obj === "object" || typeof obj === "function" ?
	            class2type[toString.call(obj)] || "object" :
	            typeof obj;
	    };

	    /* jQuery */
	    $.isArray = Array.isArray || function (obj) {
	        return $.type(obj) === "array";
	    };

	    /* jQuery */
	    function isArraylike (obj) {
	        var length = obj.length,
	            type = $.type(obj);

	        if (type === "function" || $.isWindow(obj)) {
	            return false;
	        }

	        if (obj.nodeType === 1 && length) {
	            return true;
	        }

	        return type === "array" || length === 0 || typeof length === "number" && length > 0 && (length - 1) in obj;
	    }

	    /***************
	       $ Methods
	    ***************/

	    /* jQuery: Support removed for IE<9. */
	    $.isPlainObject = function (obj) {
	        var key;

	        if (!obj || $.type(obj) !== "object" || obj.nodeType || $.isWindow(obj)) {
	            return false;
	        }

	        try {
	            if (obj.constructor &&
	                !hasOwn.call(obj, "constructor") &&
	                !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
	                return false;
	            }
	        } catch (e) {
	            return false;
	        }

	        for (key in obj) {}

	        return key === undefined || hasOwn.call(obj, key);
	    };

	    /* jQuery */
	    $.each = function(obj, callback, args) {
	        var value,
	            i = 0,
	            length = obj.length,
	            isArray = isArraylike(obj);

	        if (args) {
	            if (isArray) {
	                for (; i < length; i++) {
	                    value = callback.apply(obj[i], args);

	                    if (value === false) {
	                        break;
	                    }
	                }
	            } else {
	                for (i in obj) {
	                    value = callback.apply(obj[i], args);

	                    if (value === false) {
	                        break;
	                    }
	                }
	            }

	        } else {
	            if (isArray) {
	                for (; i < length; i++) {
	                    value = callback.call(obj[i], i, obj[i]);

	                    if (value === false) {
	                        break;
	                    }
	                }
	            } else {
	                for (i in obj) {
	                    value = callback.call(obj[i], i, obj[i]);

	                    if (value === false) {
	                        break;
	                    }
	                }
	            }
	        }

	        return obj;
	    };

	    /* Custom */
	    $.data = function (node, key, value) {
	        /* $.getData() */
	        if (value === undefined) {
	            var id = node[$.expando],
	                store = id && cache[id];

	            if (key === undefined) {
	                return store;
	            } else if (store) {
	                if (key in store) {
	                    return store[key];
	                }
	            }
	        /* $.setData() */
	        } else if (key !== undefined) {
	            var id = node[$.expando] || (node[$.expando] = ++$.uuid);

	            cache[id] = cache[id] || {};
	            cache[id][key] = value;

	            return value;
	        }
	    };

	    /* Custom */
	    $.removeData = function (node, keys) {
	        var id = node[$.expando],
	            store = id && cache[id];

	        if (store) {
	            $.each(keys, function(_, key) {
	                delete store[key];
	            });
	        }
	    };

	    /* jQuery */
	    $.extend = function () {
	        var src, copyIsArray, copy, name, options, clone,
	            target = arguments[0] || {},
	            i = 1,
	            length = arguments.length,
	            deep = false;

	        if (typeof target === "boolean") {
	            deep = target;

	            target = arguments[i] || {};
	            i++;
	        }

	        if (typeof target !== "object" && $.type(target) !== "function") {
	            target = {};
	        }

	        if (i === length) {
	            target = this;
	            i--;
	        }

	        for (; i < length; i++) {
	            if ((options = arguments[i]) != null) {
	                for (name in options) {
	                    src = target[name];
	                    copy = options[name];

	                    if (target === copy) {
	                        continue;
	                    }

	                    if (deep && copy && ($.isPlainObject(copy) || (copyIsArray = $.isArray(copy)))) {
	                        if (copyIsArray) {
	                            copyIsArray = false;
	                            clone = src && $.isArray(src) ? src : [];

	                        } else {
	                            clone = src && $.isPlainObject(src) ? src : {};
	                        }

	                        target[name] = $.extend(deep, clone, copy);

	                    } else if (copy !== undefined) {
	                        target[name] = copy;
	                    }
	                }
	            }
	        }

	        return target;
	    };

	    /* jQuery 1.4.3 */
	    $.queue = function (elem, type, data) {
	        function $makeArray (arr, results) {
	            var ret = results || [];

	            if (arr != null) {
	                if (isArraylike(Object(arr))) {
	                    /* $.merge */
	                    (function(first, second) {
	                        var len = +second.length,
	                            j = 0,
	                            i = first.length;

	                        while (j < len) {
	                            first[i++] = second[j++];
	                        }

	                        if (len !== len) {
	                            while (second[j] !== undefined) {
	                                first[i++] = second[j++];
	                            }
	                        }

	                        first.length = i;

	                        return first;
	                    })(ret, typeof arr === "string" ? [arr] : arr);
	                } else {
	                    [].push.call(ret, arr);
	                }
	            }

	            return ret;
	        }

	        if (!elem) {
	            return;
	        }

	        type = (type || "fx") + "queue";

	        var q = $.data(elem, type);

	        if (!data) {
	            return q || [];
	        }

	        if (!q || $.isArray(data)) {
	            q = $.data(elem, type, $makeArray(data));
	        } else {
	            q.push(data);
	        }

	        return q;
	    };

	    /* jQuery 1.4.3 */
	    $.dequeue = function (elems, type) {
	        /* Custom: Embed element iteration. */
	        $.each(elems.nodeType ? [ elems ] : elems, function(i, elem) {
	            type = type || "fx";

	            var queue = $.queue(elem, type),
	                fn = queue.shift();

	            if (fn === "inprogress") {
	                fn = queue.shift();
	            }

	            if (fn) {
	                if (type === "fx") {
	                    queue.unshift("inprogress");
	                }

	                fn.call(elem, function() {
	                    $.dequeue(elem, type);
	                });
	            }
	        });
	    };

	    /******************
	       $.fn Methods
	    ******************/

	    /* jQuery */
	    $.fn = $.prototype = {
	        init: function (selector) {
	            /* Just return the element wrapped inside an array; don't proceed with the actual jQuery node wrapping process. */
	            if (selector.nodeType) {
	                this[0] = selector;

	                return this;
	            } else {
	                throw new Error("Not a DOM node.");
	            }
	        },

	        offset: function () {
	            /* jQuery altered code: Dropped disconnected DOM node checking. */
	            var box = this[0].getBoundingClientRect ? this[0].getBoundingClientRect() : { top: 0, left: 0 };

	            return {
	                top: box.top + (window.pageYOffset || document.scrollTop  || 0)  - (document.clientTop  || 0),
	                left: box.left + (window.pageXOffset || document.scrollLeft  || 0) - (document.clientLeft || 0)
	            };
	        },

	        position: function () {
	            /* jQuery */
	            function offsetParent() {
	                var offsetParent = this.offsetParent || document;

	                while (offsetParent && (!offsetParent.nodeType.toLowerCase === "html" && offsetParent.style.position === "static")) {
	                    offsetParent = offsetParent.offsetParent;
	                }

	                return offsetParent || document;
	            }

	            /* Zepto */
	            var elem = this[0],
	                offsetParent = offsetParent.apply(elem),
	                offset = this.offset(),
	                parentOffset = /^(?:body|html)$/i.test(offsetParent.nodeName) ? { top: 0, left: 0 } : $(offsetParent).offset()

	            offset.top -= parseFloat(elem.style.marginTop) || 0;
	            offset.left -= parseFloat(elem.style.marginLeft) || 0;

	            if (offsetParent.style) {
	                parentOffset.top += parseFloat(offsetParent.style.borderTopWidth) || 0
	                parentOffset.left += parseFloat(offsetParent.style.borderLeftWidth) || 0
	            }

	            return {
	                top: offset.top - parentOffset.top,
	                left: offset.left - parentOffset.left
	            };
	        }
	    };

	    /**********************
	       Private Variables
	    **********************/

	    /* For $.data() */
	    var cache = {};
	    $.expando = "velocity" + (new Date().getTime());
	    $.uuid = 0;

	    /* For $.queue() */
	    var class2type = {},
	        hasOwn = class2type.hasOwnProperty,
	        toString = class2type.toString;

	    var types = "Boolean Number String Function Array Date RegExp Object Error".split(" ");
	    for (var i = 0; i < types.length; i++) {
	        class2type["[object " + types[i] + "]"] = types[i].toLowerCase();
	    }

	    /* Makes $(node) possible, without having to call init. */
	    $.fn.init.prototype = $.fn;

	    /* Globalize Velocity onto the window, and assign its Utilities property. */
	    window.Velocity = { Utilities: $ };
	})(window);

	/******************
	    Velocity.js
	******************/

	;(function (factory) {
	    /* CommonJS module. */
	    if (typeof module === "object" && typeof module.exports === "object") {
	        module.exports = factory();
	    /* AMD module. */
	    } else if (true) {
	        !(__WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    /* Browser globals. */
	    } else {
	        factory();
	    }
	}(function() {
	return function (global, window, document, undefined) {

	    /***************
	        Summary
	    ***************/

	    /*
	    - CSS: CSS stack that works independently from the rest of Velocity.
	    - animate(): Core animation method that iterates over the targeted elements and queues the incoming call onto each element individually.
	      - Pre-Queueing: Prepare the element for animation by instantiating its data cache and processing the call's options.
	      - Queueing: The logic that runs once the call has reached its point of execution in the element's $.queue() stack.
	                  Most logic is placed here to avoid risking it becoming stale (if the element's properties have changed).
	      - Pushing: Consolidation of the tween data followed by its push onto the global in-progress calls container.
	    - tick(): The single requestAnimationFrame loop responsible for tweening all in-progress calls.
	    - completeCall(): Handles the cleanup process for each Velocity call.
	    */

	    /*********************
	       Helper Functions
	    *********************/

	    /* IE detection. Gist: https://gist.github.com/julianshapiro/9098609 */
	    var IE = (function() {
	        if (document.documentMode) {
	            return document.documentMode;
	        } else {
	            for (var i = 7; i > 4; i--) {
	                var div = document.createElement("div");

	                div.innerHTML = "<!--[if IE " + i + "]><span></span><![endif]-->";

	                if (div.getElementsByTagName("span").length) {
	                    div = null;

	                    return i;
	                }
	            }
	        }

	        return undefined;
	    })();

	    /* rAF shim. Gist: https://gist.github.com/julianshapiro/9497513 */
	    var rAFShim = (function() {
	        var timeLast = 0;

	        return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(callback) {
	            var timeCurrent = (new Date()).getTime(),
	                timeDelta;

	            /* Dynamically set delay on a per-tick basis to match 60fps. */
	            /* Technique by Erik Moller. MIT license: https://gist.github.com/paulirish/1579671 */
	            timeDelta = Math.max(0, 16 - (timeCurrent - timeLast));
	            timeLast = timeCurrent + timeDelta;

	            return setTimeout(function() { callback(timeCurrent + timeDelta); }, timeDelta);
	        };
	    })();

	    /* Array compacting. Copyright Lo-Dash. MIT License: https://github.com/lodash/lodash/blob/master/LICENSE.txt */
	    function compactSparseArray (array) {
	        var index = -1,
	            length = array ? array.length : 0,
	            result = [];

	        while (++index < length) {
	            var value = array[index];

	            if (value) {
	                result.push(value);
	            }
	        }

	        return result;
	    }

	    function sanitizeElements (elements) {
	        /* Unwrap jQuery/Zepto objects. */
	        if (Type.isWrapped(elements)) {
	            elements = [].slice.call(elements);
	        /* Wrap a single element in an array so that $.each() can iterate with the element instead of its node's children. */
	        } else if (Type.isNode(elements)) {
	            elements = [ elements ];
	        }

	        return elements;
	    }

	    var Type = {
	        isString: function (variable) {
	            return (typeof variable === "string");
	        },
	        isArray: Array.isArray || function (variable) {
	            return Object.prototype.toString.call(variable) === "[object Array]";
	        },
	        isFunction: function (variable) {
	            return Object.prototype.toString.call(variable) === "[object Function]";
	        },
	        isNode: function (variable) {
	            return variable && variable.nodeType;
	        },
	        /* Copyright Martin Bohm. MIT License: https://gist.github.com/Tomalak/818a78a226a0738eaade */
	        isNodeList: function (variable) {
	            return typeof variable === "object" &&
	                /^\[object (HTMLCollection|NodeList|Object)\]$/.test(Object.prototype.toString.call(variable)) &&
	                variable.length !== undefined &&
	                (variable.length === 0 || (typeof variable[0] === "object" && variable[0].nodeType > 0));
	        },
	        /* Determine if variable is a wrapped jQuery or Zepto element. */
	        isWrapped: function (variable) {
	            return variable && (variable.jquery || (window.Zepto && window.Zepto.zepto.isZ(variable)));
	        },
	        isSVG: function (variable) {
	            return window.SVGElement && (variable instanceof window.SVGElement);
	        },
	        isEmptyObject: function (variable) {
	            for (var name in variable) {
	                return false;
	            }

	            return true;
	        }
	    };

	    /*****************
	       Dependencies
	    *****************/

	    var $,
	        isJQuery = false;

	    if (global.fn && global.fn.jquery) {
	        $ = global;
	        isJQuery = true;
	    } else {
	        $ = window.Velocity.Utilities;
	    }

	    if (IE <= 8 && !isJQuery) {
	        throw new Error("Velocity: IE8 and below require jQuery to be loaded before Velocity.");
	    } else if (IE <= 7) {
	        /* Revert to jQuery's $.animate(), and lose Velocity's extra features. */
	        jQuery.fn.velocity = jQuery.fn.animate;

	        /* Now that $.fn.velocity is aliased, abort this Velocity declaration. */
	        return;
	    }

	    /*****************
	        Constants
	    *****************/

	    var DURATION_DEFAULT = 400,
	        EASING_DEFAULT = "swing";

	    /*************
	        State
	    *************/

	    var Velocity = {
	        /* Container for page-wide Velocity state data. */
	        State: {
	            /* Detect mobile devices to determine if mobileHA should be turned on. */
	            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
	            /* The mobileHA option's behavior changes on older Android devices (Gingerbread, versions 2.3.3-2.3.7). */
	            isAndroid: /Android/i.test(navigator.userAgent),
	            isGingerbread: /Android 2\.3\.[3-7]/i.test(navigator.userAgent),
	            isChrome: window.chrome,
	            isFirefox: /Firefox/i.test(navigator.userAgent),
	            /* Create a cached element for re-use when checking for CSS property prefixes. */
	            prefixElement: document.createElement("div"),
	            /* Cache every prefix match to avoid repeating lookups. */
	            prefixMatches: {},
	            /* Cache the anchor used for animating window scrolling. */
	            scrollAnchor: null,
	            /* Cache the browser-specific property names associated with the scroll anchor. */
	            scrollPropertyLeft: null,
	            scrollPropertyTop: null,
	            /* Keep track of whether our RAF tick is running. */
	            isTicking: false,
	            /* Container for every in-progress call to Velocity. */
	            calls: []
	        },
	        /* Velocity's custom CSS stack. Made global for unit testing. */
	        CSS: { /* Defined below. */ },
	        /* A shim of the jQuery utility functions used by Velocity -- provided by Velocity's optional jQuery shim. */
	        Utilities: $,
	        /* Container for the user's custom animation redirects that are referenced by name in place of the properties map argument. */
	        Redirects: { /* Manually registered by the user. */ },
	        Easings: { /* Defined below. */ },
	        /* Attempt to use ES6 Promises by default. Users can override this with a third-party promises library. */
	        Promise: window.Promise,
	        /* Velocity option defaults, which can be overriden by the user. */
	        defaults: {
	            queue: "",
	            duration: DURATION_DEFAULT,
	            easing: EASING_DEFAULT,
	            begin: undefined,
	            complete: undefined,
	            progress: undefined,
	            display: undefined,
	            visibility: undefined,
	            loop: false,
	            delay: false,
	            mobileHA: true,
	            /* Advanced: Set to false to prevent property values from being cached between consecutive Velocity-initiated chain calls. */
	            _cacheValues: true
	        },
	        /* A design goal of Velocity is to cache data wherever possible in order to avoid DOM requerying. Accordingly, each element has a data cache. */
	        init: function (element) {
	            $.data(element, "velocity", {
	                /* Store whether this is an SVG element, since its properties are retrieved and updated differently than standard HTML elements. */
	                isSVG: Type.isSVG(element),
	                /* Keep track of whether the element is currently being animated by Velocity.
	                   This is used to ensure that property values are not transferred between non-consecutive (stale) calls. */
	                isAnimating: false,
	                /* A reference to the element's live computedStyle object. Learn more here: https://developer.mozilla.org/en/docs/Web/API/window.getComputedStyle */
	                computedStyle: null,
	                /* Tween data is cached for each animation on the element so that data can be passed across calls --
	                   in particular, end values are used as subsequent start values in consecutive Velocity calls. */
	                tweensContainer: null,
	                /* The full root property values of each CSS hook being animated on this element are cached so that:
	                   1) Concurrently-animating hooks sharing the same root can have their root values' merged into one while tweening.
	                   2) Post-hook-injection root values can be transferred over to consecutively chained Velocity calls as starting root values. */
	                rootPropertyValueCache: {},
	                /* A cache for transform updates, which must be manually flushed via CSS.flushTransformCache(). */
	                transformCache: {}
	            });
	        },
	        /* A parallel to jQuery's $.css(), used for getting/setting Velocity's hooked CSS properties. */
	        hook: null, /* Defined below. */
	        /* Velocity-wide animation time remapping for testing purposes. */
	        mock: false,
	        version: { major: 1, minor: 2, patch: 2 },
	        /* Set to 1 or 2 (most verbose) to output debug info to console. */
	        debug: false
	    };

	    /* Retrieve the appropriate scroll anchor and property name for the browser: https://developer.mozilla.org/en-US/docs/Web/API/Window.scrollY */
	    if (window.pageYOffset !== undefined) {
	        Velocity.State.scrollAnchor = window;
	        Velocity.State.scrollPropertyLeft = "pageXOffset";
	        Velocity.State.scrollPropertyTop = "pageYOffset";
	    } else {
	        Velocity.State.scrollAnchor = document.documentElement || document.body.parentNode || document.body;
	        Velocity.State.scrollPropertyLeft = "scrollLeft";
	        Velocity.State.scrollPropertyTop = "scrollTop";
	    }

	    /* Shorthand alias for jQuery's $.data() utility. */
	    function Data (element) {
	        /* Hardcode a reference to the plugin name. */
	        var response = $.data(element, "velocity");

	        /* jQuery <=1.4.2 returns null instead of undefined when no match is found. We normalize this behavior. */
	        return response === null ? undefined : response;
	    };

	    /**************
	        Easing
	    **************/

	    /* Step easing generator. */
	    function generateStep (steps) {
	        return function (p) {
	            return Math.round(p * steps) * (1 / steps);
	        };
	    }

	    /* Bezier curve function generator. Copyright Gaetan Renaudeau. MIT License: http://en.wikipedia.org/wiki/MIT_License */
	    function generateBezier (mX1, mY1, mX2, mY2) {
	        var NEWTON_ITERATIONS = 4,
	            NEWTON_MIN_SLOPE = 0.001,
	            SUBDIVISION_PRECISION = 0.0000001,
	            SUBDIVISION_MAX_ITERATIONS = 10,
	            kSplineTableSize = 11,
	            kSampleStepSize = 1.0 / (kSplineTableSize - 1.0),
	            float32ArraySupported = "Float32Array" in window;

	        /* Must contain four arguments. */
	        if (arguments.length !== 4) {
	            return false;
	        }

	        /* Arguments must be numbers. */
	        for (var i = 0; i < 4; ++i) {
	            if (typeof arguments[i] !== "number" || isNaN(arguments[i]) || !isFinite(arguments[i])) {
	                return false;
	            }
	        }

	        /* X values must be in the [0, 1] range. */
	        mX1 = Math.min(mX1, 1);
	        mX2 = Math.min(mX2, 1);
	        mX1 = Math.max(mX1, 0);
	        mX2 = Math.max(mX2, 0);

	        var mSampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);

	        function A (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
	        function B (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
	        function C (aA1)      { return 3.0 * aA1; }

	        function calcBezier (aT, aA1, aA2) {
	            return ((A(aA1, aA2)*aT + B(aA1, aA2))*aT + C(aA1))*aT;
	        }

	        function getSlope (aT, aA1, aA2) {
	            return 3.0 * A(aA1, aA2)*aT*aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
	        }

	        function newtonRaphsonIterate (aX, aGuessT) {
	            for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
	                var currentSlope = getSlope(aGuessT, mX1, mX2);

	                if (currentSlope === 0.0) return aGuessT;

	                var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
	                aGuessT -= currentX / currentSlope;
	            }

	            return aGuessT;
	        }

	        function calcSampleValues () {
	            for (var i = 0; i < kSplineTableSize; ++i) {
	                mSampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
	            }
	        }

	        function binarySubdivide (aX, aA, aB) {
	            var currentX, currentT, i = 0;

	            do {
	                currentT = aA + (aB - aA) / 2.0;
	                currentX = calcBezier(currentT, mX1, mX2) - aX;
	                if (currentX > 0.0) {
	                  aB = currentT;
	                } else {
	                  aA = currentT;
	                }
	            } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);

	            return currentT;
	        }

	        function getTForX (aX) {
	            var intervalStart = 0.0,
	                currentSample = 1,
	                lastSample = kSplineTableSize - 1;

	            for (; currentSample != lastSample && mSampleValues[currentSample] <= aX; ++currentSample) {
	                intervalStart += kSampleStepSize;
	            }

	            --currentSample;

	            var dist = (aX - mSampleValues[currentSample]) / (mSampleValues[currentSample+1] - mSampleValues[currentSample]),
	                guessForT = intervalStart + dist * kSampleStepSize,
	                initialSlope = getSlope(guessForT, mX1, mX2);

	            if (initialSlope >= NEWTON_MIN_SLOPE) {
	                return newtonRaphsonIterate(aX, guessForT);
	            } else if (initialSlope == 0.0) {
	                return guessForT;
	            } else {
	                return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize);
	            }
	        }

	        var _precomputed = false;

	        function precompute() {
	            _precomputed = true;
	            if (mX1 != mY1 || mX2 != mY2) calcSampleValues();
	        }

	        var f = function (aX) {
	            if (!_precomputed) precompute();
	            if (mX1 === mY1 && mX2 === mY2) return aX;
	            if (aX === 0) return 0;
	            if (aX === 1) return 1;

	            return calcBezier(getTForX(aX), mY1, mY2);
	        };

	        f.getControlPoints = function() { return [{ x: mX1, y: mY1 }, { x: mX2, y: mY2 }]; };

	        var str = "generateBezier(" + [mX1, mY1, mX2, mY2] + ")";
	        f.toString = function () { return str; };

	        return f;
	    }

	    /* Runge-Kutta spring physics function generator. Adapted from Framer.js, copyright Koen Bok. MIT License: http://en.wikipedia.org/wiki/MIT_License */
	    /* Given a tension, friction, and duration, a simulation at 60FPS will first run without a defined duration in order to calculate the full path. A second pass
	       then adjusts the time delta -- using the relation between actual time and duration -- to calculate the path for the duration-constrained animation. */
	    var generateSpringRK4 = (function () {
	        function springAccelerationForState (state) {
	            return (-state.tension * state.x) - (state.friction * state.v);
	        }

	        function springEvaluateStateWithDerivative (initialState, dt, derivative) {
	            var state = {
	                x: initialState.x + derivative.dx * dt,
	                v: initialState.v + derivative.dv * dt,
	                tension: initialState.tension,
	                friction: initialState.friction
	            };

	            return { dx: state.v, dv: springAccelerationForState(state) };
	        }

	        function springIntegrateState (state, dt) {
	            var a = {
	                    dx: state.v,
	                    dv: springAccelerationForState(state)
	                },
	                b = springEvaluateStateWithDerivative(state, dt * 0.5, a),
	                c = springEvaluateStateWithDerivative(state, dt * 0.5, b),
	                d = springEvaluateStateWithDerivative(state, dt, c),
	                dxdt = 1.0 / 6.0 * (a.dx + 2.0 * (b.dx + c.dx) + d.dx),
	                dvdt = 1.0 / 6.0 * (a.dv + 2.0 * (b.dv + c.dv) + d.dv);

	            state.x = state.x + dxdt * dt;
	            state.v = state.v + dvdt * dt;

	            return state;
	        }

	        return function springRK4Factory (tension, friction, duration) {

	            var initState = {
	                    x: -1,
	                    v: 0,
	                    tension: null,
	                    friction: null
	                },
	                path = [0],
	                time_lapsed = 0,
	                tolerance = 1 / 10000,
	                DT = 16 / 1000,
	                have_duration, dt, last_state;

	            tension = parseFloat(tension) || 500;
	            friction = parseFloat(friction) || 20;
	            duration = duration || null;

	            initState.tension = tension;
	            initState.friction = friction;

	            have_duration = duration !== null;

	            /* Calculate the actual time it takes for this animation to complete with the provided conditions. */
	            if (have_duration) {
	                /* Run the simulation without a duration. */
	                time_lapsed = springRK4Factory(tension, friction);
	                /* Compute the adjusted time delta. */
	                dt = time_lapsed / duration * DT;
	            } else {
	                dt = DT;
	            }

	            while (true) {
	                /* Next/step function .*/
	                last_state = springIntegrateState(last_state || initState, dt);
	                /* Store the position. */
	                path.push(1 + last_state.x);
	                time_lapsed += 16;
	                /* If the change threshold is reached, break. */
	                if (!(Math.abs(last_state.x) > tolerance && Math.abs(last_state.v) > tolerance)) {
	                    break;
	                }
	            }

	            /* If duration is not defined, return the actual time required for completing this animation. Otherwise, return a closure that holds the
	               computed path and returns a snapshot of the position according to a given percentComplete. */
	            return !have_duration ? time_lapsed : function(percentComplete) { return path[ (percentComplete * (path.length - 1)) | 0 ]; };
	        };
	    }());

	    /* jQuery easings. */
	    Velocity.Easings = {
	        linear: function(p) { return p; },
	        swing: function(p) { return 0.5 - Math.cos( p * Math.PI ) / 2 },
	        /* Bonus "spring" easing, which is a less exaggerated version of easeInOutElastic. */
	        spring: function(p) { return 1 - (Math.cos(p * 4.5 * Math.PI) * Math.exp(-p * 6)); }
	    };

	    /* CSS3 and Robert Penner easings. */
	    $.each(
	        [
	            [ "ease", [ 0.25, 0.1, 0.25, 1.0 ] ],
	            [ "ease-in", [ 0.42, 0.0, 1.00, 1.0 ] ],
	            [ "ease-out", [ 0.00, 0.0, 0.58, 1.0 ] ],
	            [ "ease-in-out", [ 0.42, 0.0, 0.58, 1.0 ] ],
	            [ "easeInSine", [ 0.47, 0, 0.745, 0.715 ] ],
	            [ "easeOutSine", [ 0.39, 0.575, 0.565, 1 ] ],
	            [ "easeInOutSine", [ 0.445, 0.05, 0.55, 0.95 ] ],
	            [ "easeInQuad", [ 0.55, 0.085, 0.68, 0.53 ] ],
	            [ "easeOutQuad", [ 0.25, 0.46, 0.45, 0.94 ] ],
	            [ "easeInOutQuad", [ 0.455, 0.03, 0.515, 0.955 ] ],
	            [ "easeInCubic", [ 0.55, 0.055, 0.675, 0.19 ] ],
	            [ "easeOutCubic", [ 0.215, 0.61, 0.355, 1 ] ],
	            [ "easeInOutCubic", [ 0.645, 0.045, 0.355, 1 ] ],
	            [ "easeInQuart", [ 0.895, 0.03, 0.685, 0.22 ] ],
	            [ "easeOutQuart", [ 0.165, 0.84, 0.44, 1 ] ],
	            [ "easeInOutQuart", [ 0.77, 0, 0.175, 1 ] ],
	            [ "easeInQuint", [ 0.755, 0.05, 0.855, 0.06 ] ],
	            [ "easeOutQuint", [ 0.23, 1, 0.32, 1 ] ],
	            [ "easeInOutQuint", [ 0.86, 0, 0.07, 1 ] ],
	            [ "easeInExpo", [ 0.95, 0.05, 0.795, 0.035 ] ],
	            [ "easeOutExpo", [ 0.19, 1, 0.22, 1 ] ],
	            [ "easeInOutExpo", [ 1, 0, 0, 1 ] ],
	            [ "easeInCirc", [ 0.6, 0.04, 0.98, 0.335 ] ],
	            [ "easeOutCirc", [ 0.075, 0.82, 0.165, 1 ] ],
	            [ "easeInOutCirc", [ 0.785, 0.135, 0.15, 0.86 ] ]
	        ], function(i, easingArray) {
	            Velocity.Easings[easingArray[0]] = generateBezier.apply(null, easingArray[1]);
	        });

	    /* Determine the appropriate easing type given an easing input. */
	    function getEasing(value, duration) {
	        var easing = value;

	        /* The easing option can either be a string that references a pre-registered easing,
	           or it can be a two-/four-item array of integers to be converted into a bezier/spring function. */
	        if (Type.isString(value)) {
	            /* Ensure that the easing has been assigned to jQuery's Velocity.Easings object. */
	            if (!Velocity.Easings[value]) {
	                easing = false;
	            }
	        } else if (Type.isArray(value) && value.length === 1) {
	            easing = generateStep.apply(null, value);
	        } else if (Type.isArray(value) && value.length === 2) {
	            /* springRK4 must be passed the animation's duration. */
	            /* Note: If the springRK4 array contains non-numbers, generateSpringRK4() returns an easing
	               function generated with default tension and friction values. */
	            easing = generateSpringRK4.apply(null, value.concat([ duration ]));
	        } else if (Type.isArray(value) && value.length === 4) {
	            /* Note: If the bezier array contains non-numbers, generateBezier() returns false. */
	            easing = generateBezier.apply(null, value);
	        } else {
	            easing = false;
	        }

	        /* Revert to the Velocity-wide default easing type, or fall back to "swing" (which is also jQuery's default)
	           if the Velocity-wide default has been incorrectly modified. */
	        if (easing === false) {
	            if (Velocity.Easings[Velocity.defaults.easing]) {
	                easing = Velocity.defaults.easing;
	            } else {
	                easing = EASING_DEFAULT;
	            }
	        }

	        return easing;
	    }

	    /*****************
	        CSS Stack
	    *****************/

	    /* The CSS object is a highly condensed and performant CSS stack that fully replaces jQuery's.
	       It handles the validation, getting, and setting of both standard CSS properties and CSS property hooks. */
	    /* Note: A "CSS" shorthand is aliased so that our code is easier to read. */
	    var CSS = Velocity.CSS = {

	        /*************
	            RegEx
	        *************/

	        RegEx: {
	            isHex: /^#([A-f\d]{3}){1,2}$/i,
	            /* Unwrap a property value's surrounding text, e.g. "rgba(4, 3, 2, 1)" ==> "4, 3, 2, 1" and "rect(4px 3px 2px 1px)" ==> "4px 3px 2px 1px". */
	            valueUnwrap: /^[A-z]+\((.*)\)$/i,
	            wrappedValueAlreadyExtracted: /[0-9.]+ [0-9.]+ [0-9.]+( [0-9.]+)?/,
	            /* Split a multi-value property into an array of subvalues, e.g. "rgba(4, 3, 2, 1) 4px 3px 2px 1px" ==> [ "rgba(4, 3, 2, 1)", "4px", "3px", "2px", "1px" ]. */
	            valueSplit: /([A-z]+\(.+\))|(([A-z0-9#-.]+?)(?=\s|$))/ig
	        },

	        /************
	            Lists
	        ************/

	        Lists: {
	            colors: [ "fill", "stroke", "stopColor", "color", "backgroundColor", "borderColor", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor", "outlineColor" ],
	            transformsBase: [ "translateX", "translateY", "scale", "scaleX", "scaleY", "skewX", "skewY", "rotateZ" ],
	            transforms3D: [ "transformPerspective", "translateZ", "scaleZ", "rotateX", "rotateY" ]
	        },

	        /************
	            Hooks
	        ************/

	        /* Hooks allow a subproperty (e.g. "boxShadowBlur") of a compound-value CSS property
	           (e.g. "boxShadow: X Y Blur Spread Color") to be animated as if it were a discrete property. */
	        /* Note: Beyond enabling fine-grained property animation, hooking is necessary since Velocity only
	           tweens properties with single numeric values; unlike CSS transitions, Velocity does not interpolate compound-values. */
	        Hooks: {
	            /********************
	                Registration
	            ********************/

	            /* Templates are a concise way of indicating which subproperties must be individually registered for each compound-value CSS property. */
	            /* Each template consists of the compound-value's base name, its constituent subproperty names, and those subproperties' default values. */
	            templates: {
	                "textShadow": [ "Color X Y Blur", "black 0px 0px 0px" ],
	                "boxShadow": [ "Color X Y Blur Spread", "black 0px 0px 0px 0px" ],
	                "clip": [ "Top Right Bottom Left", "0px 0px 0px 0px" ],
	                "backgroundPosition": [ "X Y", "0% 0%" ],
	                "transformOrigin": [ "X Y Z", "50% 50% 0px" ],
	                "perspectiveOrigin": [ "X Y", "50% 50%" ]
	            },

	            /* A "registered" hook is one that has been converted from its template form into a live,
	               tweenable property. It contains data to associate it with its root property. */
	            registered: {
	                /* Note: A registered hook looks like this ==> textShadowBlur: [ "textShadow", 3 ],
	                   which consists of the subproperty's name, the associated root property's name,
	                   and the subproperty's position in the root's value. */
	            },
	            /* Convert the templates into individual hooks then append them to the registered object above. */
	            register: function () {
	                /* Color hooks registration: Colors are defaulted to white -- as opposed to black -- since colors that are
	                   currently set to "transparent" default to their respective template below when color-animated,
	                   and white is typically a closer match to transparent than black is. An exception is made for text ("color"),
	                   which is almost always set closer to black than white. */
	                for (var i = 0; i < CSS.Lists.colors.length; i++) {
	                    var rgbComponents = (CSS.Lists.colors[i] === "color") ? "0 0 0 1" : "255 255 255 1";
	                    CSS.Hooks.templates[CSS.Lists.colors[i]] = [ "Red Green Blue Alpha", rgbComponents ];
	                }

	                var rootProperty,
	                    hookTemplate,
	                    hookNames;

	                /* In IE, color values inside compound-value properties are positioned at the end the value instead of at the beginning.
	                   Thus, we re-arrange the templates accordingly. */
	                if (IE) {
	                    for (rootProperty in CSS.Hooks.templates) {
	                        hookTemplate = CSS.Hooks.templates[rootProperty];
	                        hookNames = hookTemplate[0].split(" ");

	                        var defaultValues = hookTemplate[1].match(CSS.RegEx.valueSplit);

	                        if (hookNames[0] === "Color") {
	                            /* Reposition both the hook's name and its default value to the end of their respective strings. */
	                            hookNames.push(hookNames.shift());
	                            defaultValues.push(defaultValues.shift());

	                            /* Replace the existing template for the hook's root property. */
	                            CSS.Hooks.templates[rootProperty] = [ hookNames.join(" "), defaultValues.join(" ") ];
	                        }
	                    }
	                }

	                /* Hook registration. */
	                for (rootProperty in CSS.Hooks.templates) {
	                    hookTemplate = CSS.Hooks.templates[rootProperty];
	                    hookNames = hookTemplate[0].split(" ");

	                    for (var i in hookNames) {
	                        var fullHookName = rootProperty + hookNames[i],
	                            hookPosition = i;

	                        /* For each hook, register its full name (e.g. textShadowBlur) with its root property (e.g. textShadow)
	                           and the hook's position in its template's default value string. */
	                        CSS.Hooks.registered[fullHookName] = [ rootProperty, hookPosition ];
	                    }
	                }
	            },

	            /*****************************
	               Injection and Extraction
	            *****************************/

	            /* Look up the root property associated with the hook (e.g. return "textShadow" for "textShadowBlur"). */
	            /* Since a hook cannot be set directly (the browser won't recognize it), style updating for hooks is routed through the hook's root property. */
	            getRoot: function (property) {
	                var hookData = CSS.Hooks.registered[property];

	                if (hookData) {
	                    return hookData[0];
	                } else {
	                    /* If there was no hook match, return the property name untouched. */
	                    return property;
	                }
	            },
	            /* Convert any rootPropertyValue, null or otherwise, into a space-delimited list of hook values so that
	               the targeted hook can be injected or extracted at its standard position. */
	            cleanRootPropertyValue: function(rootProperty, rootPropertyValue) {
	                /* If the rootPropertyValue is wrapped with "rgb()", "clip()", etc., remove the wrapping to normalize the value before manipulation. */
	                if (CSS.RegEx.valueUnwrap.test(rootPropertyValue)) {
	                    rootPropertyValue = rootPropertyValue.match(CSS.RegEx.valueUnwrap)[1];
	                }

	                /* If rootPropertyValue is a CSS null-value (from which there's inherently no hook value to extract),
	                   default to the root's default value as defined in CSS.Hooks.templates. */
	                /* Note: CSS null-values include "none", "auto", and "transparent". They must be converted into their
	                   zero-values (e.g. textShadow: "none" ==> textShadow: "0px 0px 0px black") for hook manipulation to proceed. */
	                if (CSS.Values.isCSSNullValue(rootPropertyValue)) {
	                    rootPropertyValue = CSS.Hooks.templates[rootProperty][1];
	                }

	                return rootPropertyValue;
	            },
	            /* Extracted the hook's value from its root property's value. This is used to get the starting value of an animating hook. */
	            extractValue: function (fullHookName, rootPropertyValue) {
	                var hookData = CSS.Hooks.registered[fullHookName];

	                if (hookData) {
	                    var hookRoot = hookData[0],
	                        hookPosition = hookData[1];

	                    rootPropertyValue = CSS.Hooks.cleanRootPropertyValue(hookRoot, rootPropertyValue);

	                    /* Split rootPropertyValue into its constituent hook values then grab the desired hook at its standard position. */
	                    return rootPropertyValue.toString().match(CSS.RegEx.valueSplit)[hookPosition];
	                } else {
	                    /* If the provided fullHookName isn't a registered hook, return the rootPropertyValue that was passed in. */
	                    return rootPropertyValue;
	                }
	            },
	            /* Inject the hook's value into its root property's value. This is used to piece back together the root property
	               once Velocity has updated one of its individually hooked values through tweening. */
	            injectValue: function (fullHookName, hookValue, rootPropertyValue) {
	                var hookData = CSS.Hooks.registered[fullHookName];

	                if (hookData) {
	                    var hookRoot = hookData[0],
	                        hookPosition = hookData[1],
	                        rootPropertyValueParts,
	                        rootPropertyValueUpdated;

	                    rootPropertyValue = CSS.Hooks.cleanRootPropertyValue(hookRoot, rootPropertyValue);

	                    /* Split rootPropertyValue into its individual hook values, replace the targeted value with hookValue,
	                       then reconstruct the rootPropertyValue string. */
	                    rootPropertyValueParts = rootPropertyValue.toString().match(CSS.RegEx.valueSplit);
	                    rootPropertyValueParts[hookPosition] = hookValue;
	                    rootPropertyValueUpdated = rootPropertyValueParts.join(" ");

	                    return rootPropertyValueUpdated;
	                } else {
	                    /* If the provided fullHookName isn't a registered hook, return the rootPropertyValue that was passed in. */
	                    return rootPropertyValue;
	                }
	            }
	        },

	        /*******************
	           Normalizations
	        *******************/

	        /* Normalizations standardize CSS property manipulation by pollyfilling browser-specific implementations (e.g. opacity)
	           and reformatting special properties (e.g. clip, rgba) to look like standard ones. */
	        Normalizations: {
	            /* Normalizations are passed a normalization target (either the property's name, its extracted value, or its injected value),
	               the targeted element (which may need to be queried), and the targeted property value. */
	            registered: {
	                clip: function (type, element, propertyValue) {
	                    switch (type) {
	                        case "name":
	                            return "clip";
	                        /* Clip needs to be unwrapped and stripped of its commas during extraction. */
	                        case "extract":
	                            var extracted;

	                            /* If Velocity also extracted this value, skip extraction. */
	                            if (CSS.RegEx.wrappedValueAlreadyExtracted.test(propertyValue)) {
	                                extracted = propertyValue;
	                            } else {
	                                /* Remove the "rect()" wrapper. */
	                                extracted = propertyValue.toString().match(CSS.RegEx.valueUnwrap);

	                                /* Strip off commas. */
	                                extracted = extracted ? extracted[1].replace(/,(\s+)?/g, " ") : propertyValue;
	                            }

	                            return extracted;
	                        /* Clip needs to be re-wrapped during injection. */
	                        case "inject":
	                            return "rect(" + propertyValue + ")";
	                    }
	                },

	                blur: function(type, element, propertyValue) {
	                    switch (type) {
	                        case "name":
	                            return Velocity.State.isFirefox ? "filter" : "-webkit-filter";
	                        case "extract":
	                            var extracted = parseFloat(propertyValue);

	                            /* If extracted is NaN, meaning the value isn't already extracted. */
	                            if (!(extracted || extracted === 0)) {
	                                var blurComponent = propertyValue.toString().match(/blur\(([0-9]+[A-z]+)\)/i);

	                                /* If the filter string had a blur component, return just the blur value and unit type. */
	                                if (blurComponent) {
	                                    extracted = blurComponent[1];
	                                /* If the component doesn't exist, default blur to 0. */
	                                } else {
	                                    extracted = 0;
	                                }
	                            }

	                            return extracted;
	                        /* Blur needs to be re-wrapped during injection. */
	                        case "inject":
	                            /* For the blur effect to be fully de-applied, it needs to be set to "none" instead of 0. */
	                            if (!parseFloat(propertyValue)) {
	                                return "none";
	                            } else {
	                                return "blur(" + propertyValue + ")";
	                            }
	                    }
	                },

	                /* <=IE8 do not support the standard opacity property. They use filter:alpha(opacity=INT) instead. */
	                opacity: function (type, element, propertyValue) {
	                    if (IE <= 8) {
	                        switch (type) {
	                            case "name":
	                                return "filter";
	                            case "extract":
	                                /* <=IE8 return a "filter" value of "alpha(opacity=\d{1,3})".
	                                   Extract the value and convert it to a decimal value to match the standard CSS opacity property's formatting. */
	                                var extracted = propertyValue.toString().match(/alpha\(opacity=(.*)\)/i);

	                                if (extracted) {
	                                    /* Convert to decimal value. */
	                                    propertyValue = extracted[1] / 100;
	                                } else {
	                                    /* When extracting opacity, default to 1 since a null value means opacity hasn't been set. */
	                                    propertyValue = 1;
	                                }

	                                return propertyValue;
	                            case "inject":
	                                /* Opacified elements are required to have their zoom property set to a non-zero value. */
	                                element.style.zoom = 1;

	                                /* Setting the filter property on elements with certain font property combinations can result in a
	                                   highly unappealing ultra-bolding effect. There's no way to remedy this throughout a tween, but dropping the
	                                   value altogether (when opacity hits 1) at leasts ensures that the glitch is gone post-tweening. */
	                                if (parseFloat(propertyValue) >= 1) {
	                                    return "";
	                                } else {
	                                  /* As per the filter property's spec, convert the decimal value to a whole number and wrap the value. */
	                                  return "alpha(opacity=" + parseInt(parseFloat(propertyValue) * 100, 10) + ")";
	                                }
	                        }
	                    /* With all other browsers, normalization is not required; return the same values that were passed in. */
	                    } else {
	                        switch (type) {
	                            case "name":
	                                return "opacity";
	                            case "extract":
	                                return propertyValue;
	                            case "inject":
	                                return propertyValue;
	                        }
	                    }
	                }
	            },

	            /*****************************
	                Batched Registrations
	            *****************************/

	            /* Note: Batched normalizations extend the CSS.Normalizations.registered object. */
	            register: function () {

	                /*****************
	                    Transforms
	                *****************/

	                /* Transforms are the subproperties contained by the CSS "transform" property. Transforms must undergo normalization
	                   so that they can be referenced in a properties map by their individual names. */
	                /* Note: When transforms are "set", they are actually assigned to a per-element transformCache. When all transform
	                   setting is complete complete, CSS.flushTransformCache() must be manually called to flush the values to the DOM.
	                   Transform setting is batched in this way to improve performance: the transform style only needs to be updated
	                   once when multiple transform subproperties are being animated simultaneously. */
	                /* Note: IE9 and Android Gingerbread have support for 2D -- but not 3D -- transforms. Since animating unsupported
	                   transform properties results in the browser ignoring the *entire* transform string, we prevent these 3D values
	                   from being normalized for these browsers so that tweening skips these properties altogether
	                   (since it will ignore them as being unsupported by the browser.) */
	                if (!(IE <= 9) && !Velocity.State.isGingerbread) {
	                    /* Note: Since the standalone CSS "perspective" property and the CSS transform "perspective" subproperty
	                    share the same name, the latter is given a unique token within Velocity: "transformPerspective". */
	                    CSS.Lists.transformsBase = CSS.Lists.transformsBase.concat(CSS.Lists.transforms3D);
	                }

	                for (var i = 0; i < CSS.Lists.transformsBase.length; i++) {
	                    /* Wrap the dynamically generated normalization function in a new scope so that transformName's value is
	                    paired with its respective function. (Otherwise, all functions would take the final for loop's transformName.) */
	                    (function() {
	                        var transformName = CSS.Lists.transformsBase[i];

	                        CSS.Normalizations.registered[transformName] = function (type, element, propertyValue) {
	                            switch (type) {
	                                /* The normalized property name is the parent "transform" property -- the property that is actually set in CSS. */
	                                case "name":
	                                    return "transform";
	                                /* Transform values are cached onto a per-element transformCache object. */
	                                case "extract":
	                                    /* If this transform has yet to be assigned a value, return its null value. */
	                                    if (Data(element) === undefined || Data(element).transformCache[transformName] === undefined) {
	                                        /* Scale CSS.Lists.transformsBase default to 1 whereas all other transform properties default to 0. */
	                                        return /^scale/i.test(transformName) ? 1 : 0;
	                                    /* When transform values are set, they are wrapped in parentheses as per the CSS spec.
	                                       Thus, when extracting their values (for tween calculations), we strip off the parentheses. */
	                                    } else {
	                                        return Data(element).transformCache[transformName].replace(/[()]/g, "");
	                                    }
	                                case "inject":
	                                    var invalid = false;

	                                    /* If an individual transform property contains an unsupported unit type, the browser ignores the *entire* transform property.
	                                       Thus, protect users from themselves by skipping setting for transform values supplied with invalid unit types. */
	                                    /* Switch on the base transform type; ignore the axis by removing the last letter from the transform's name. */
	                                    switch (transformName.substr(0, transformName.length - 1)) {
	                                        /* Whitelist unit types for each transform. */
	                                        case "translate":
	                                            invalid = !/(%|px|em|rem|vw|vh|\d)$/i.test(propertyValue);
	                                            break;
	                                        /* Since an axis-free "scale" property is supported as well, a little hack is used here to detect it by chopping off its last letter. */
	                                        case "scal":
	                                        case "scale":
	                                            /* Chrome on Android has a bug in which scaled elements blur if their initial scale
	                                               value is below 1 (which can happen with forcefeeding). Thus, we detect a yet-unset scale property
	                                               and ensure that its first value is always 1. More info: http://stackoverflow.com/questions/10417890/css3-animations-with-transform-causes-blurred-elements-on-webkit/10417962#10417962 */
	                                            if (Velocity.State.isAndroid && Data(element).transformCache[transformName] === undefined && propertyValue < 1) {
	                                                propertyValue = 1;
	                                            }

	                                            invalid = !/(\d)$/i.test(propertyValue);
	                                            break;
	                                        case "skew":
	                                            invalid = !/(deg|\d)$/i.test(propertyValue);
	                                            break;
	                                        case "rotate":
	                                            invalid = !/(deg|\d)$/i.test(propertyValue);
	                                            break;
	                                    }

	                                    if (!invalid) {
	                                        /* As per the CSS spec, wrap the value in parentheses. */
	                                        Data(element).transformCache[transformName] = "(" + propertyValue + ")";
	                                    }

	                                    /* Although the value is set on the transformCache object, return the newly-updated value for the calling code to process as normal. */
	                                    return Data(element).transformCache[transformName];
	                            }
	                        };
	                    })();
	                }

	                /*************
	                    Colors
	                *************/

	                /* Since Velocity only animates a single numeric value per property, color animation is achieved by hooking the individual RGBA components of CSS color properties.
	                   Accordingly, color values must be normalized (e.g. "#ff0000", "red", and "rgb(255, 0, 0)" ==> "255 0 0 1") so that their components can be injected/extracted by CSS.Hooks logic. */
	                for (var i = 0; i < CSS.Lists.colors.length; i++) {
	                    /* Wrap the dynamically generated normalization function in a new scope so that colorName's value is paired with its respective function.
	                       (Otherwise, all functions would take the final for loop's colorName.) */
	                    (function () {
	                        var colorName = CSS.Lists.colors[i];

	                        /* Note: In IE<=8, which support rgb but not rgba, color properties are reverted to rgb by stripping off the alpha component. */
	                        CSS.Normalizations.registered[colorName] = function(type, element, propertyValue) {
	                            switch (type) {
	                                case "name":
	                                    return colorName;
	                                /* Convert all color values into the rgb format. (Old IE can return hex values and color names instead of rgb/rgba.) */
	                                case "extract":
	                                    var extracted;

	                                    /* If the color is already in its hookable form (e.g. "255 255 255 1") due to having been previously extracted, skip extraction. */
	                                    if (CSS.RegEx.wrappedValueAlreadyExtracted.test(propertyValue)) {
	                                        extracted = propertyValue;
	                                    } else {
	                                        var converted,
	                                            colorNames = {
	                                                black: "rgb(0, 0, 0)",
	                                                blue: "rgb(0, 0, 255)",
	                                                gray: "rgb(128, 128, 128)",
	                                                green: "rgb(0, 128, 0)",
	                                                red: "rgb(255, 0, 0)",
	                                                white: "rgb(255, 255, 255)"
	                                            };

	                                        /* Convert color names to rgb. */
	                                        if (/^[A-z]+$/i.test(propertyValue)) {
	                                            if (colorNames[propertyValue] !== undefined) {
	                                                converted = colorNames[propertyValue]
	                                            } else {
	                                                /* If an unmatched color name is provided, default to black. */
	                                                converted = colorNames.black;
	                                            }
	                                        /* Convert hex values to rgb. */
	                                        } else if (CSS.RegEx.isHex.test(propertyValue)) {
	                                            converted = "rgb(" + CSS.Values.hexToRgb(propertyValue).join(" ") + ")";
	                                        /* If the provided color doesn't match any of the accepted color formats, default to black. */
	                                        } else if (!(/^rgba?\(/i.test(propertyValue))) {
	                                            converted = colorNames.black;
	                                        }

	                                        /* Remove the surrounding "rgb/rgba()" string then replace commas with spaces and strip
	                                           repeated spaces (in case the value included spaces to begin with). */
	                                        extracted = (converted || propertyValue).toString().match(CSS.RegEx.valueUnwrap)[1].replace(/,(\s+)?/g, " ");
	                                    }

	                                    /* So long as this isn't <=IE8, add a fourth (alpha) component if it's missing and default it to 1 (visible). */
	                                    if (!(IE <= 8) && extracted.split(" ").length === 3) {
	                                        extracted += " 1";
	                                    }

	                                    return extracted;
	                                case "inject":
	                                    /* If this is IE<=8 and an alpha component exists, strip it off. */
	                                    if (IE <= 8) {
	                                        if (propertyValue.split(" ").length === 4) {
	                                            propertyValue = propertyValue.split(/\s+/).slice(0, 3).join(" ");
	                                        }
	                                    /* Otherwise, add a fourth (alpha) component if it's missing and default it to 1 (visible). */
	                                    } else if (propertyValue.split(" ").length === 3) {
	                                        propertyValue += " 1";
	                                    }

	                                    /* Re-insert the browser-appropriate wrapper("rgb/rgba()"), insert commas, and strip off decimal units
	                                       on all values but the fourth (R, G, and B only accept whole numbers). */
	                                    return (IE <= 8 ? "rgb" : "rgba") + "(" + propertyValue.replace(/\s+/g, ",").replace(/\.(\d)+(?=,)/g, "") + ")";
	                            }
	                        };
	                    })();
	                }
	            }
	        },

	        /************************
	           CSS Property Names
	        ************************/

	        Names: {
	            /* Camelcase a property name into its JavaScript notation (e.g. "background-color" ==> "backgroundColor").
	               Camelcasing is used to normalize property names between and across calls. */
	            camelCase: function (property) {
	                return property.replace(/-(\w)/g, function (match, subMatch) {
	                    return subMatch.toUpperCase();
	                });
	            },

	            /* For SVG elements, some properties (namely, dimensional ones) are GET/SET via the element's HTML attributes (instead of via CSS styles). */
	            SVGAttribute: function (property) {
	                var SVGAttributes = "width|height|x|y|cx|cy|r|rx|ry|x1|x2|y1|y2";

	                /* Certain browsers require an SVG transform to be applied as an attribute. (Otherwise, application via CSS is preferable due to 3D support.) */
	                if (IE || (Velocity.State.isAndroid && !Velocity.State.isChrome)) {
	                    SVGAttributes += "|transform";
	                }

	                return new RegExp("^(" + SVGAttributes + ")$", "i").test(property);
	            },

	            /* Determine whether a property should be set with a vendor prefix. */
	            /* If a prefixed version of the property exists, return it. Otherwise, return the original property name.
	               If the property is not at all supported by the browser, return a false flag. */
	            prefixCheck: function (property) {
	                /* If this property has already been checked, return the cached value. */
	                if (Velocity.State.prefixMatches[property]) {
	                    return [ Velocity.State.prefixMatches[property], true ];
	                } else {
	                    var vendors = [ "", "Webkit", "Moz", "ms", "O" ];

	                    for (var i = 0, vendorsLength = vendors.length; i < vendorsLength; i++) {
	                        var propertyPrefixed;

	                        if (i === 0) {
	                            propertyPrefixed = property;
	                        } else {
	                            /* Capitalize the first letter of the property to conform to JavaScript vendor prefix notation (e.g. webkitFilter). */
	                            propertyPrefixed = vendors[i] + property.replace(/^\w/, function(match) { return match.toUpperCase(); });
	                        }

	                        /* Check if the browser supports this property as prefixed. */
	                        if (Type.isString(Velocity.State.prefixElement.style[propertyPrefixed])) {
	                            /* Cache the match. */
	                            Velocity.State.prefixMatches[property] = propertyPrefixed;

	                            return [ propertyPrefixed, true ];
	                        }
	                    }

	                    /* If the browser doesn't support this property in any form, include a false flag so that the caller can decide how to proceed. */
	                    return [ property, false ];
	                }
	            }
	        },

	        /************************
	           CSS Property Values
	        ************************/

	        Values: {
	            /* Hex to RGB conversion. Copyright Tim Down: http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb */
	            hexToRgb: function (hex) {
	                var shortformRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
	                    longformRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i,
	                    rgbParts;

	                hex = hex.replace(shortformRegex, function (m, r, g, b) {
	                    return r + r + g + g + b + b;
	                });

	                rgbParts = longformRegex.exec(hex);

	                return rgbParts ? [ parseInt(rgbParts[1], 16), parseInt(rgbParts[2], 16), parseInt(rgbParts[3], 16) ] : [ 0, 0, 0 ];
	            },

	            isCSSNullValue: function (value) {
	                /* The browser defaults CSS values that have not been set to either 0 or one of several possible null-value strings.
	                   Thus, we check for both falsiness and these special strings. */
	                /* Null-value checking is performed to default the special strings to 0 (for the sake of tweening) or their hook
	                   templates as defined as CSS.Hooks (for the sake of hook injection/extraction). */
	                /* Note: Chrome returns "rgba(0, 0, 0, 0)" for an undefined color whereas IE returns "transparent". */
	                return (value == 0 || /^(none|auto|transparent|(rgba\(0, ?0, ?0, ?0\)))$/i.test(value));
	            },

	            /* Retrieve a property's default unit type. Used for assigning a unit type when one is not supplied by the user. */
	            getUnitType: function (property) {
	                if (/^(rotate|skew)/i.test(property)) {
	                    return "deg";
	                } else if (/(^(scale|scaleX|scaleY|scaleZ|alpha|flexGrow|flexHeight|zIndex|fontWeight)$)|((opacity|red|green|blue|alpha)$)/i.test(property)) {
	                    /* The above properties are unitless. */
	                    return "";
	                } else {
	                    /* Default to px for all other properties. */
	                    return "px";
	                }
	            },

	            /* HTML elements default to an associated display type when they're not set to display:none. */
	            /* Note: This function is used for correctly setting the non-"none" display value in certain Velocity redirects, such as fadeIn/Out. */
	            getDisplayType: function (element) {
	                var tagName = element && element.tagName.toString().toLowerCase();

	                if (/^(b|big|i|small|tt|abbr|acronym|cite|code|dfn|em|kbd|strong|samp|var|a|bdo|br|img|map|object|q|script|span|sub|sup|button|input|label|select|textarea)$/i.test(tagName)) {
	                    return "inline";
	                } else if (/^(li)$/i.test(tagName)) {
	                    return "list-item";
	                } else if (/^(tr)$/i.test(tagName)) {
	                    return "table-row";
	                } else if (/^(table)$/i.test(tagName)) {
	                    return "table";
	                } else if (/^(tbody)$/i.test(tagName)) {
	                    return "table-row-group";
	                /* Default to "block" when no match is found. */
	                } else {
	                    return "block";
	                }
	            },

	            /* The class add/remove functions are used to temporarily apply a "velocity-animating" class to elements while they're animating. */
	            addClass: function (element, className) {
	                if (element.classList) {
	                    element.classList.add(className);
	                } else {
	                    element.className += (element.className.length ? " " : "") + className;
	                }
	            },

	            removeClass: function (element, className) {
	                if (element.classList) {
	                    element.classList.remove(className);
	                } else {
	                    element.className = element.className.toString().replace(new RegExp("(^|\\s)" + className.split(" ").join("|") + "(\\s|$)", "gi"), " ");
	                }
	            }
	        },

	        /****************************
	           Style Getting & Setting
	        ****************************/

	        /* The singular getPropertyValue, which routes the logic for all normalizations, hooks, and standard CSS properties. */
	        getPropertyValue: function (element, property, rootPropertyValue, forceStyleLookup) {
	            /* Get an element's computed property value. */
	            /* Note: Retrieving the value of a CSS property cannot simply be performed by checking an element's
	               style attribute (which only reflects user-defined values). Instead, the browser must be queried for a property's
	               *computed* value. You can read more about getComputedStyle here: https://developer.mozilla.org/en/docs/Web/API/window.getComputedStyle */
	            function computePropertyValue (element, property) {
	                /* When box-sizing isn't set to border-box, height and width style values are incorrectly computed when an
	                   element's scrollbars are visible (which expands the element's dimensions). Thus, we defer to the more accurate
	                   offsetHeight/Width property, which includes the total dimensions for interior, border, padding, and scrollbar.
	                   We subtract border and padding to get the sum of interior + scrollbar. */
	                var computedValue = 0;

	                /* IE<=8 doesn't support window.getComputedStyle, thus we defer to jQuery, which has an extensive array
	                   of hacks to accurately retrieve IE8 property values. Re-implementing that logic here is not worth bloating the
	                   codebase for a dying browser. The performance repercussions of using jQuery here are minimal since
	                   Velocity is optimized to rarely (and sometimes never) query the DOM. Further, the $.css() codepath isn't that slow. */
	                if (IE <= 8) {
	                    computedValue = $.css(element, property); /* GET */
	                /* All other browsers support getComputedStyle. The returned live object reference is cached onto its
	                   associated element so that it does not need to be refetched upon every GET. */
	                } else {
	                    /* Browsers do not return height and width values for elements that are set to display:"none". Thus, we temporarily
	                       toggle display to the element type's default value. */
	                    var toggleDisplay = false;

	                    if (/^(width|height)$/.test(property) && CSS.getPropertyValue(element, "display") === 0) {
	                        toggleDisplay = true;
	                        CSS.setPropertyValue(element, "display", CSS.Values.getDisplayType(element));
	                    }

	                    function revertDisplay () {
	                        if (toggleDisplay) {
	                            CSS.setPropertyValue(element, "display", "none");
	                        }
	                    }

	                    if (!forceStyleLookup) {
	                        if (property === "height" && CSS.getPropertyValue(element, "boxSizing").toString().toLowerCase() !== "border-box") {
	                            var contentBoxHeight = element.offsetHeight - (parseFloat(CSS.getPropertyValue(element, "borderTopWidth")) || 0) - (parseFloat(CSS.getPropertyValue(element, "borderBottomWidth")) || 0) - (parseFloat(CSS.getPropertyValue(element, "paddingTop")) || 0) - (parseFloat(CSS.getPropertyValue(element, "paddingBottom")) || 0);
	                            revertDisplay();

	                            return contentBoxHeight;
	                        } else if (property === "width" && CSS.getPropertyValue(element, "boxSizing").toString().toLowerCase() !== "border-box") {
	                            var contentBoxWidth = element.offsetWidth - (parseFloat(CSS.getPropertyValue(element, "borderLeftWidth")) || 0) - (parseFloat(CSS.getPropertyValue(element, "borderRightWidth")) || 0) - (parseFloat(CSS.getPropertyValue(element, "paddingLeft")) || 0) - (parseFloat(CSS.getPropertyValue(element, "paddingRight")) || 0);
	                            revertDisplay();

	                            return contentBoxWidth;
	                        }
	                    }

	                    var computedStyle;

	                    /* For elements that Velocity hasn't been called on directly (e.g. when Velocity queries the DOM on behalf
	                       of a parent of an element its animating), perform a direct getComputedStyle lookup since the object isn't cached. */
	                    if (Data(element) === undefined) {
	                        computedStyle = window.getComputedStyle(element, null); /* GET */
	                    /* If the computedStyle object has yet to be cached, do so now. */
	                    } else if (!Data(element).computedStyle) {
	                        computedStyle = Data(element).computedStyle = window.getComputedStyle(element, null); /* GET */
	                    /* If computedStyle is cached, use it. */
	                    } else {
	                        computedStyle = Data(element).computedStyle;
	                    }

	                    /* IE and Firefox do not return a value for the generic borderColor -- they only return individual values for each border side's color.
	                       Also, in all browsers, when border colors aren't all the same, a compound value is returned that Velocity isn't setup to parse.
	                       So, as a polyfill for querying individual border side colors, we just return the top border's color and animate all borders from that value. */
	                    if (property === "borderColor") {
	                        property = "borderTopColor";
	                    }

	                    /* IE9 has a bug in which the "filter" property must be accessed from computedStyle using the getPropertyValue method
	                       instead of a direct property lookup. The getPropertyValue method is slower than a direct lookup, which is why we avoid it by default. */
	                    if (IE === 9 && property === "filter") {
	                        computedValue = computedStyle.getPropertyValue(property); /* GET */
	                    } else {
	                        computedValue = computedStyle[property];
	                    }

	                    /* Fall back to the property's style value (if defined) when computedValue returns nothing,
	                       which can happen when the element hasn't been painted. */
	                    if (computedValue === "" || computedValue === null) {
	                        computedValue = element.style[property];
	                    }

	                    revertDisplay();
	                }

	                /* For top, right, bottom, and left (TRBL) values that are set to "auto" on elements of "fixed" or "absolute" position,
	                   defer to jQuery for converting "auto" to a numeric value. (For elements with a "static" or "relative" position, "auto" has the same
	                   effect as being set to 0, so no conversion is necessary.) */
	                /* An example of why numeric conversion is necessary: When an element with "position:absolute" has an untouched "left"
	                   property, which reverts to "auto", left's value is 0 relative to its parent element, but is often non-zero relative
	                   to its *containing* (not parent) element, which is the nearest "position:relative" ancestor or the viewport (and always the viewport in the case of "position:fixed"). */
	                if (computedValue === "auto" && /^(top|right|bottom|left)$/i.test(property)) {
	                    var position = computePropertyValue(element, "position"); /* GET */

	                    /* For absolute positioning, jQuery's $.position() only returns values for top and left;
	                       right and bottom will have their "auto" value reverted to 0. */
	                    /* Note: A jQuery object must be created here since jQuery doesn't have a low-level alias for $.position().
	                       Not a big deal since we're currently in a GET batch anyway. */
	                    if (position === "fixed" || (position === "absolute" && /top|left/i.test(property))) {
	                        /* Note: jQuery strips the pixel unit from its returned values; we re-add it here to conform with computePropertyValue's behavior. */
	                        computedValue = $(element).position()[property] + "px"; /* GET */
	                    }
	                }

	                return computedValue;
	            }

	            var propertyValue;

	            /* If this is a hooked property (e.g. "clipLeft" instead of the root property of "clip"),
	               extract the hook's value from a normalized rootPropertyValue using CSS.Hooks.extractValue(). */
	            if (CSS.Hooks.registered[property]) {
	                var hook = property,
	                    hookRoot = CSS.Hooks.getRoot(hook);

	                /* If a cached rootPropertyValue wasn't passed in (which Velocity always attempts to do in order to avoid requerying the DOM),
	                   query the DOM for the root property's value. */
	                if (rootPropertyValue === undefined) {
	                    /* Since the browser is now being directly queried, use the official post-prefixing property name for this lookup. */
	                    rootPropertyValue = CSS.getPropertyValue(element, CSS.Names.prefixCheck(hookRoot)[0]); /* GET */
	                }

	                /* If this root has a normalization registered, peform the associated normalization extraction. */
	                if (CSS.Normalizations.registered[hookRoot]) {
	                    rootPropertyValue = CSS.Normalizations.registered[hookRoot]("extract", element, rootPropertyValue);
	                }

	                /* Extract the hook's value. */
	                propertyValue = CSS.Hooks.extractValue(hook, rootPropertyValue);

	            /* If this is a normalized property (e.g. "opacity" becomes "filter" in <=IE8) or "translateX" becomes "transform"),
	               normalize the property's name and value, and handle the special case of transforms. */
	            /* Note: Normalizing a property is mutually exclusive from hooking a property since hook-extracted values are strictly
	               numerical and therefore do not require normalization extraction. */
	            } else if (CSS.Normalizations.registered[property]) {
	                var normalizedPropertyName,
	                    normalizedPropertyValue;

	                normalizedPropertyName = CSS.Normalizations.registered[property]("name", element);

	                /* Transform values are calculated via normalization extraction (see below), which checks against the element's transformCache.
	                   At no point do transform GETs ever actually query the DOM; initial stylesheet values are never processed.
	                   This is because parsing 3D transform matrices is not always accurate and would bloat our codebase;
	                   thus, normalization extraction defaults initial transform values to their zero-values (e.g. 1 for scaleX and 0 for translateX). */
	                if (normalizedPropertyName !== "transform") {
	                    normalizedPropertyValue = computePropertyValue(element, CSS.Names.prefixCheck(normalizedPropertyName)[0]); /* GET */

	                    /* If the value is a CSS null-value and this property has a hook template, use that zero-value template so that hooks can be extracted from it. */
	                    if (CSS.Values.isCSSNullValue(normalizedPropertyValue) && CSS.Hooks.templates[property]) {
	                        normalizedPropertyValue = CSS.Hooks.templates[property][1];
	                    }
	                }

	                propertyValue = CSS.Normalizations.registered[property]("extract", element, normalizedPropertyValue);
	            }

	            /* If a (numeric) value wasn't produced via hook extraction or normalization, query the DOM. */
	            if (!/^[\d-]/.test(propertyValue)) {
	                /* For SVG elements, dimensional properties (which SVGAttribute() detects) are tweened via
	                   their HTML attribute values instead of their CSS style values. */
	                if (Data(element) && Data(element).isSVG && CSS.Names.SVGAttribute(property)) {
	                    /* Since the height/width attribute values must be set manually, they don't reflect computed values.
	                       Thus, we use use getBBox() to ensure we always get values for elements with undefined height/width attributes. */
	                    if (/^(height|width)$/i.test(property)) {
	                        /* Firefox throws an error if .getBBox() is called on an SVG that isn't attached to the DOM. */
	                        try {
	                            propertyValue = element.getBBox()[property];
	                        } catch (error) {
	                            propertyValue = 0;
	                        }
	                    /* Otherwise, access the attribute value directly. */
	                    } else {
	                        propertyValue = element.getAttribute(property);
	                    }
	                } else {
	                    propertyValue = computePropertyValue(element, CSS.Names.prefixCheck(property)[0]); /* GET */
	                }
	            }

	            /* Since property lookups are for animation purposes (which entails computing the numeric delta between start and end values),
	               convert CSS null-values to an integer of value 0. */
	            if (CSS.Values.isCSSNullValue(propertyValue)) {
	                propertyValue = 0;
	            }

	            if (Velocity.debug >= 2) console.log("Get " + property + ": " + propertyValue);

	            return propertyValue;
	        },

	        /* The singular setPropertyValue, which routes the logic for all normalizations, hooks, and standard CSS properties. */
	        setPropertyValue: function(element, property, propertyValue, rootPropertyValue, scrollData) {
	            var propertyName = property;

	            /* In order to be subjected to call options and element queueing, scroll animation is routed through Velocity as if it were a standard CSS property. */
	            if (property === "scroll") {
	                /* If a container option is present, scroll the container instead of the browser window. */
	                if (scrollData.container) {
	                    scrollData.container["scroll" + scrollData.direction] = propertyValue;
	                /* Otherwise, Velocity defaults to scrolling the browser window. */
	                } else {
	                    if (scrollData.direction === "Left") {
	                        window.scrollTo(propertyValue, scrollData.alternateValue);
	                    } else {
	                        window.scrollTo(scrollData.alternateValue, propertyValue);
	                    }
	                }
	            } else {
	                /* Transforms (translateX, rotateZ, etc.) are applied to a per-element transformCache object, which is manually flushed via flushTransformCache().
	                   Thus, for now, we merely cache transforms being SET. */
	                if (CSS.Normalizations.registered[property] && CSS.Normalizations.registered[property]("name", element) === "transform") {
	                    /* Perform a normalization injection. */
	                    /* Note: The normalization logic handles the transformCache updating. */
	                    CSS.Normalizations.registered[property]("inject", element, propertyValue);

	                    propertyName = "transform";
	                    propertyValue = Data(element).transformCache[property];
	                } else {
	                    /* Inject hooks. */
	                    if (CSS.Hooks.registered[property]) {
	                        var hookName = property,
	                            hookRoot = CSS.Hooks.getRoot(property);

	                        /* If a cached rootPropertyValue was not provided, query the DOM for the hookRoot's current value. */
	                        rootPropertyValue = rootPropertyValue || CSS.getPropertyValue(element, hookRoot); /* GET */

	                        propertyValue = CSS.Hooks.injectValue(hookName, propertyValue, rootPropertyValue);
	                        property = hookRoot;
	                    }

	                    /* Normalize names and values. */
	                    if (CSS.Normalizations.registered[property]) {
	                        propertyValue = CSS.Normalizations.registered[property]("inject", element, propertyValue);
	                        property = CSS.Normalizations.registered[property]("name", element);
	                    }

	                    /* Assign the appropriate vendor prefix before performing an official style update. */
	                    propertyName = CSS.Names.prefixCheck(property)[0];

	                    /* A try/catch is used for IE<=8, which throws an error when "invalid" CSS values are set, e.g. a negative width.
	                       Try/catch is avoided for other browsers since it incurs a performance overhead. */
	                    if (IE <= 8) {
	                        try {
	                            element.style[propertyName] = propertyValue;
	                        } catch (error) { if (Velocity.debug) console.log("Browser does not support [" + propertyValue + "] for [" + propertyName + "]"); }
	                    /* SVG elements have their dimensional properties (width, height, x, y, cx, etc.) applied directly as attributes instead of as styles. */
	                    /* Note: IE8 does not support SVG elements, so it's okay that we skip it for SVG animation. */
	                    } else if (Data(element) && Data(element).isSVG && CSS.Names.SVGAttribute(property)) {
	                        /* Note: For SVG attributes, vendor-prefixed property names are never used. */
	                        /* Note: Not all CSS properties can be animated via attributes, but the browser won't throw an error for unsupported properties. */
	                        element.setAttribute(property, propertyValue);
	                    } else {
	                        element.style[propertyName] = propertyValue;
	                    }

	                    if (Velocity.debug >= 2) console.log("Set " + property + " (" + propertyName + "): " + propertyValue);
	                }
	            }

	            /* Return the normalized property name and value in case the caller wants to know how these values were modified before being applied to the DOM. */
	            return [ propertyName, propertyValue ];
	        },

	        /* To increase performance by batching transform updates into a single SET, transforms are not directly applied to an element until flushTransformCache() is called. */
	        /* Note: Velocity applies transform properties in the same order that they are chronogically introduced to the element's CSS styles. */
	        flushTransformCache: function(element) {
	            var transformString = "";

	            /* Certain browsers require that SVG transforms be applied as an attribute. However, the SVG transform attribute takes a modified version of CSS's transform string
	               (units are dropped and, except for skewX/Y, subproperties are merged into their master property -- e.g. scaleX and scaleY are merged into scale(X Y). */
	            if ((IE || (Velocity.State.isAndroid && !Velocity.State.isChrome)) && Data(element).isSVG) {
	                /* Since transform values are stored in their parentheses-wrapped form, we use a helper function to strip out their numeric values.
	                   Further, SVG transform properties only take unitless (representing pixels) values, so it's okay that parseFloat() strips the unit suffixed to the float value. */
	                function getTransformFloat (transformProperty) {
	                    return parseFloat(CSS.getPropertyValue(element, transformProperty));
	                }

	                /* Create an object to organize all the transforms that we'll apply to the SVG element. To keep the logic simple,
	                   we process *all* transform properties -- even those that may not be explicitly applied (since they default to their zero-values anyway). */
	                var SVGTransforms = {
	                    translate: [ getTransformFloat("translateX"), getTransformFloat("translateY") ],
	                    skewX: [ getTransformFloat("skewX") ], skewY: [ getTransformFloat("skewY") ],
	                    /* If the scale property is set (non-1), use that value for the scaleX and scaleY values
	                       (this behavior mimics the result of animating all these properties at once on HTML elements). */
	                    scale: getTransformFloat("scale") !== 1 ? [ getTransformFloat("scale"), getTransformFloat("scale") ] : [ getTransformFloat("scaleX"), getTransformFloat("scaleY") ],
	                    /* Note: SVG's rotate transform takes three values: rotation degrees followed by the X and Y values
	                       defining the rotation's origin point. We ignore the origin values (default them to 0). */
	                    rotate: [ getTransformFloat("rotateZ"), 0, 0 ]
	                };

	                /* Iterate through the transform properties in the user-defined property map order.
	                   (This mimics the behavior of non-SVG transform animation.) */
	                $.each(Data(element).transformCache, function(transformName) {
	                    /* Except for with skewX/Y, revert the axis-specific transform subproperties to their axis-free master
	                       properties so that they match up with SVG's accepted transform properties. */
	                    if (/^translate/i.test(transformName)) {
	                        transformName = "translate";
	                    } else if (/^scale/i.test(transformName)) {
	                        transformName = "scale";
	                    } else if (/^rotate/i.test(transformName)) {
	                        transformName = "rotate";
	                    }

	                    /* Check that we haven't yet deleted the property from the SVGTransforms container. */
	                    if (SVGTransforms[transformName]) {
	                        /* Append the transform property in the SVG-supported transform format. As per the spec, surround the space-delimited values in parentheses. */
	                        transformString += transformName + "(" + SVGTransforms[transformName].join(" ") + ")" + " ";

	                        /* After processing an SVG transform property, delete it from the SVGTransforms container so we don't
	                           re-insert the same master property if we encounter another one of its axis-specific properties. */
	                        delete SVGTransforms[transformName];
	                    }
	                });
	            } else {
	                var transformValue,
	                    perspective;

	                /* Transform properties are stored as members of the transformCache object. Concatenate all the members into a string. */
	                $.each(Data(element).transformCache, function(transformName) {
	                    transformValue = Data(element).transformCache[transformName];

	                    /* Transform's perspective subproperty must be set first in order to take effect. Store it temporarily. */
	                    if (transformName === "transformPerspective") {
	                        perspective = transformValue;
	                        return true;
	                    }

	                    /* IE9 only supports one rotation type, rotateZ, which it refers to as "rotate". */
	                    if (IE === 9 && transformName === "rotateZ") {
	                        transformName = "rotate";
	                    }

	                    transformString += transformName + transformValue + " ";
	                });

	                /* If present, set the perspective subproperty first. */
	                if (perspective) {
	                    transformString = "perspective" + perspective + " " + transformString;
	                }
	            }

	            CSS.setPropertyValue(element, "transform", transformString);
	        }
	    };

	    /* Register hooks and normalizations. */
	    CSS.Hooks.register();
	    CSS.Normalizations.register();

	    /* Allow hook setting in the same fashion as jQuery's $.css(). */
	    Velocity.hook = function (elements, arg2, arg3) {
	        var value = undefined;

	        elements = sanitizeElements(elements);

	        $.each(elements, function(i, element) {
	            /* Initialize Velocity's per-element data cache if this element hasn't previously been animated. */
	            if (Data(element) === undefined) {
	                Velocity.init(element);
	            }

	            /* Get property value. If an element set was passed in, only return the value for the first element. */
	            if (arg3 === undefined) {
	                if (value === undefined) {
	                    value = Velocity.CSS.getPropertyValue(element, arg2);
	                }
	            /* Set property value. */
	            } else {
	                /* sPV returns an array of the normalized propertyName/propertyValue pair used to update the DOM. */
	                var adjustedSet = Velocity.CSS.setPropertyValue(element, arg2, arg3);

	                /* Transform properties don't automatically set. They have to be flushed to the DOM. */
	                if (adjustedSet[0] === "transform") {
	                    Velocity.CSS.flushTransformCache(element);
	                }

	                value = adjustedSet;
	            }
	        });

	        return value;
	    };

	    /*****************
	        Animation
	    *****************/

	    var animate = function() {

	        /******************
	            Call Chain
	        ******************/

	        /* Logic for determining what to return to the call stack when exiting out of Velocity. */
	        function getChain () {
	            /* If we are using the utility function, attempt to return this call's promise. If no promise library was detected,
	               default to null instead of returning the targeted elements so that utility function's return value is standardized. */
	            if (isUtility) {
	                return promiseData.promise || null;
	            /* Otherwise, if we're using $.fn, return the jQuery-/Zepto-wrapped element set. */
	            } else {
	                return elementsWrapped;
	            }
	        }

	        /*************************
	           Arguments Assignment
	        *************************/

	        /* To allow for expressive CoffeeScript code, Velocity supports an alternative syntax in which "elements" (or "e"), "properties" (or "p"), and "options" (or "o")
	           objects are defined on a container object that's passed in as Velocity's sole argument. */
	        /* Note: Some browsers automatically populate arguments with a "properties" object. We detect it by checking for its default "names" property. */
	        var syntacticSugar = (arguments[0] && (arguments[0].p || (($.isPlainObject(arguments[0].properties) && !arguments[0].properties.names) || Type.isString(arguments[0].properties)))),
	            /* Whether Velocity was called via the utility function (as opposed to on a jQuery/Zepto object). */
	            isUtility,
	            /* When Velocity is called via the utility function ($.Velocity()/Velocity()), elements are explicitly
	               passed in as the first parameter. Thus, argument positioning varies. We normalize them here. */
	            elementsWrapped,
	            argumentIndex;

	        var elements,
	            propertiesMap,
	            options;

	        /* Detect jQuery/Zepto elements being animated via the $.fn method. */
	        if (Type.isWrapped(this)) {
	            isUtility = false;

	            argumentIndex = 0;
	            elements = this;
	            elementsWrapped = this;
	        /* Otherwise, raw elements are being animated via the utility function. */
	        } else {
	            isUtility = true;

	            argumentIndex = 1;
	            elements = syntacticSugar ? (arguments[0].elements || arguments[0].e) : arguments[0];
	        }

	        elements = sanitizeElements(elements);

	        if (!elements) {
	            return;
	        }

	        if (syntacticSugar) {
	            propertiesMap = arguments[0].properties || arguments[0].p;
	            options = arguments[0].options || arguments[0].o;
	        } else {
	            propertiesMap = arguments[argumentIndex];
	            options = arguments[argumentIndex + 1];
	        }

	        /* The length of the element set (in the form of a nodeList or an array of elements) is defaulted to 1 in case a
	           single raw DOM element is passed in (which doesn't contain a length property). */
	        var elementsLength = elements.length,
	            elementsIndex = 0;

	        /***************************
	            Argument Overloading
	        ***************************/

	        /* Support is included for jQuery's argument overloading: $.animate(propertyMap [, duration] [, easing] [, complete]).
	           Overloading is detected by checking for the absence of an object being passed into options. */
	        /* Note: The stop and finish actions do not accept animation options, and are therefore excluded from this check. */
	        if (!/^(stop|finish|finishAll)$/i.test(propertiesMap) && !$.isPlainObject(options)) {
	            /* The utility function shifts all arguments one position to the right, so we adjust for that offset. */
	            var startingArgumentPosition = argumentIndex + 1;

	            options = {};

	            /* Iterate through all options arguments */
	            for (var i = startingArgumentPosition; i < arguments.length; i++) {
	                /* Treat a number as a duration. Parse it out. */
	                /* Note: The following RegEx will return true if passed an array with a number as its first item.
	                   Thus, arrays are skipped from this check. */
	                if (!Type.isArray(arguments[i]) && (/^(fast|normal|slow)$/i.test(arguments[i]) || /^\d/.test(arguments[i]))) {
	                    options.duration = arguments[i];
	                /* Treat strings and arrays as easings. */
	                } else if (Type.isString(arguments[i]) || Type.isArray(arguments[i])) {
	                    options.easing = arguments[i];
	                /* Treat a function as a complete callback. */
	                } else if (Type.isFunction(arguments[i])) {
	                    options.complete = arguments[i];
	                }
	            }
	        }

	        /***************
	            Promises
	        ***************/

	        var promiseData = {
	                promise: null,
	                resolver: null,
	                rejecter: null
	            };

	        /* If this call was made via the utility function (which is the default method of invocation when jQuery/Zepto are not being used), and if
	           promise support was detected, create a promise object for this call and store references to its resolver and rejecter methods. The resolve
	           method is used when a call completes naturally or is prematurely stopped by the user. In both cases, completeCall() handles the associated
	           call cleanup and promise resolving logic. The reject method is used when an invalid set of arguments is passed into a Velocity call. */
	        /* Note: Velocity employs a call-based queueing architecture, which means that stopping an animating element actually stops the full call that
	           triggered it -- not that one element exclusively. Similarly, there is one promise per call, and all elements targeted by a Velocity call are
	           grouped together for the purposes of resolving and rejecting a promise. */
	        if (isUtility && Velocity.Promise) {
	            promiseData.promise = new Velocity.Promise(function (resolve, reject) {
	                promiseData.resolver = resolve;
	                promiseData.rejecter = reject;
	            });
	        }

	        /*********************
	           Action Detection
	        *********************/

	        /* Velocity's behavior is categorized into "actions": Elements can either be specially scrolled into view,
	           or they can be started, stopped, or reversed. If a literal or referenced properties map is passed in as Velocity's
	           first argument, the associated action is "start". Alternatively, "scroll", "reverse", or "stop" can be passed in instead of a properties map. */
	        var action;

	        switch (propertiesMap) {
	            case "scroll":
	                action = "scroll";
	                break;

	            case "reverse":
	                action = "reverse";
	                break;

	            case "finish":
	            case "finishAll":
	            case "stop":
	                /*******************
	                    Action: Stop
	                *******************/

	                /* Clear the currently-active delay on each targeted element. */
	                $.each(elements, function(i, element) {
	                    if (Data(element) && Data(element).delayTimer) {
	                        /* Stop the timer from triggering its cached next() function. */
	                        clearTimeout(Data(element).delayTimer.setTimeout);

	                        /* Manually call the next() function so that the subsequent queue items can progress. */
	                        if (Data(element).delayTimer.next) {
	                            Data(element).delayTimer.next();
	                        }

	                        delete Data(element).delayTimer;
	                    }

	                    /* If we want to finish everything in the queue, we have to iterate through it
	                       and call each function. This will make them active calls below, which will
	                       cause them to be applied via the duration setting. */
	                    if (propertiesMap === "finishAll" && (options === true || Type.isString(options))) {
	                        /* Iterate through the items in the element's queue. */
	                        $.each($.queue(element, Type.isString(options) ? options : ""), function(_, item) {
	                            /* The queue array can contain an "inprogress" string, which we skip. */
	                            if (Type.isFunction(item)) {
	                                item();
	                            }
	                        });

	                        /* Clearing the $.queue() array is achieved by resetting it to []. */
	                        $.queue(element, Type.isString(options) ? options : "", []);
	                    }
	                });

	                var callsToStop = [];

	                /* When the stop action is triggered, the elements' currently active call is immediately stopped. The active call might have
	                   been applied to multiple elements, in which case all of the call's elements will be stopped. When an element
	                   is stopped, the next item in its animation queue is immediately triggered. */
	                /* An additional argument may be passed in to clear an element's remaining queued calls. Either true (which defaults to the "fx" queue)
	                   or a custom queue string can be passed in. */
	                /* Note: The stop command runs prior to Velocity's Queueing phase since its behavior is intended to take effect *immediately*,
	                   regardless of the element's current queue state. */

	                /* Iterate through every active call. */
	                $.each(Velocity.State.calls, function(i, activeCall) {
	                    /* Inactive calls are set to false by the logic inside completeCall(). Skip them. */
	                    if (activeCall) {
	                        /* Iterate through the active call's targeted elements. */
	                        $.each(activeCall[1], function(k, activeElement) {
	                            /* If true was passed in as a secondary argument, clear absolutely all calls on this element. Otherwise, only
	                               clear calls associated with the relevant queue. */
	                            /* Call stopping logic works as follows:
	                               - options === true --> stop current default queue calls (and queue:false calls), including remaining queued ones.
	                               - options === undefined --> stop current queue:"" call and all queue:false calls.
	                               - options === false --> stop only queue:false calls.
	                               - options === "custom" --> stop current queue:"custom" call, including remaining queued ones (there is no functionality to only clear the currently-running queue:"custom" call). */
	                            var queueName = (options === undefined) ? "" : options;

	                            if (queueName !== true && (activeCall[2].queue !== queueName) && !(options === undefined && activeCall[2].queue === false)) {
	                                return true;
	                            }

	                            /* Iterate through the calls targeted by the stop command. */
	                            $.each(elements, function(l, element) {
	                                /* Check that this call was applied to the target element. */
	                                if (element === activeElement) {
	                                    /* Optionally clear the remaining queued calls. If we're doing "finishAll" this won't find anything,
	                                       due to the queue-clearing above. */
	                                    if (options === true || Type.isString(options)) {
	                                        /* Iterate through the items in the element's queue. */
	                                        $.each($.queue(element, Type.isString(options) ? options : ""), function(_, item) {
	                                            /* The queue array can contain an "inprogress" string, which we skip. */
	                                            if (Type.isFunction(item)) {
	                                                /* Pass the item's callback a flag indicating that we want to abort from the queue call.
	                                                   (Specifically, the queue will resolve the call's associated promise then abort.)  */
	                                                item(null, true);
	                                            }
	                                        });

	                                        /* Clearing the $.queue() array is achieved by resetting it to []. */
	                                        $.queue(element, Type.isString(options) ? options : "", []);
	                                    }

	                                    if (propertiesMap === "stop") {
	                                        /* Since "reverse" uses cached start values (the previous call's endValues), these values must be
	                                           changed to reflect the final value that the elements were actually tweened to. */
	                                        /* Note: If only queue:false animations are currently running on an element, it won't have a tweensContainer
	                                           object. Also, queue:false animations can't be reversed. */
	                                        if (Data(element) && Data(element).tweensContainer && queueName !== false) {
	                                            $.each(Data(element).tweensContainer, function(m, activeTween) {
	                                                activeTween.endValue = activeTween.currentValue;
	                                            });
	                                        }

	                                        callsToStop.push(i);
	                                    } else if (propertiesMap === "finish" || propertiesMap === "finishAll") {
	                                        /* To get active tweens to finish immediately, we forcefully shorten their durations to 1ms so that
	                                        they finish upon the next rAf tick then proceed with normal call completion logic. */
	                                        activeCall[2].duration = 1;
	                                    }
	                                }
	                            });
	                        });
	                    }
	                });

	                /* Prematurely call completeCall() on each matched active call. Pass an additional flag for "stop" to indicate
	                   that the complete callback and display:none setting should be skipped since we're completing prematurely. */
	                if (propertiesMap === "stop") {
	                    $.each(callsToStop, function(i, j) {
	                        completeCall(j, true);
	                    });

	                    if (promiseData.promise) {
	                        /* Immediately resolve the promise associated with this stop call since stop runs synchronously. */
	                        promiseData.resolver(elements);
	                    }
	                }

	                /* Since we're stopping, and not proceeding with queueing, exit out of Velocity. */
	                return getChain();

	            default:
	                /* Treat a non-empty plain object as a literal properties map. */
	                if ($.isPlainObject(propertiesMap) && !Type.isEmptyObject(propertiesMap)) {
	                    action = "start";

	                /****************
	                    Redirects
	                ****************/

	                /* Check if a string matches a registered redirect (see Redirects above). */
	                } else if (Type.isString(propertiesMap) && Velocity.Redirects[propertiesMap]) {
	                    var opts = $.extend({}, options),
	                        durationOriginal = opts.duration,
	                        delayOriginal = opts.delay || 0;

	                    /* If the backwards option was passed in, reverse the element set so that elements animate from the last to the first. */
	                    if (opts.backwards === true) {
	                        elements = $.extend(true, [], elements).reverse();
	                    }

	                    /* Individually trigger the redirect for each element in the set to prevent users from having to handle iteration logic in their redirect. */
	                    $.each(elements, function(elementIndex, element) {
	                        /* If the stagger option was passed in, successively delay each element by the stagger value (in ms). Retain the original delay value. */
	                        if (parseFloat(opts.stagger)) {
	                            opts.delay = delayOriginal + (parseFloat(opts.stagger) * elementIndex);
	                        } else if (Type.isFunction(opts.stagger)) {
	                            opts.delay = delayOriginal + opts.stagger.call(element, elementIndex, elementsLength);
	                        }

	                        /* If the drag option was passed in, successively increase/decrease (depending on the presense of opts.backwards)
	                           the duration of each element's animation, using floors to prevent producing very short durations. */
	                        if (opts.drag) {
	                            /* Default the duration of UI pack effects (callouts and transitions) to 1000ms instead of the usual default duration of 400ms. */
	                            opts.duration = parseFloat(durationOriginal) || (/^(callout|transition)/.test(propertiesMap) ? 1000 : DURATION_DEFAULT);

	                            /* For each element, take the greater duration of: A) animation completion percentage relative to the original duration,
	                               B) 75% of the original duration, or C) a 200ms fallback (in case duration is already set to a low value).
	                               The end result is a baseline of 75% of the redirect's duration that increases/decreases as the end of the element set is approached. */
	                            opts.duration = Math.max(opts.duration * (opts.backwards ? 1 - elementIndex/elementsLength : (elementIndex + 1) / elementsLength), opts.duration * 0.75, 200);
	                        }

	                        /* Pass in the call's opts object so that the redirect can optionally extend it. It defaults to an empty object instead of null to
	                           reduce the opts checking logic required inside the redirect. */
	                        Velocity.Redirects[propertiesMap].call(element, element, opts || {}, elementIndex, elementsLength, elements, promiseData.promise ? promiseData : undefined);
	                    });

	                    /* Since the animation logic resides within the redirect's own code, abort the remainder of this call.
	                       (The performance overhead up to this point is virtually non-existant.) */
	                    /* Note: The jQuery call chain is kept intact by returning the complete element set. */
	                    return getChain();
	                } else {
	                    var abortError = "Velocity: First argument (" + propertiesMap + ") was not a property map, a known action, or a registered redirect. Aborting.";

	                    if (promiseData.promise) {
	                        promiseData.rejecter(new Error(abortError));
	                    } else {
	                        console.log(abortError);
	                    }

	                    return getChain();
	                }
	        }

	        /**************************
	            Call-Wide Variables
	        **************************/

	        /* A container for CSS unit conversion ratios (e.g. %, rem, and em ==> px) that is used to cache ratios across all elements
	           being animated in a single Velocity call. Calculating unit ratios necessitates DOM querying and updating, and is therefore
	           avoided (via caching) wherever possible. This container is call-wide instead of page-wide to avoid the risk of using stale
	           conversion metrics across Velocity animations that are not immediately consecutively chained. */
	        var callUnitConversionData = {
	                lastParent: null,
	                lastPosition: null,
	                lastFontSize: null,
	                lastPercentToPxWidth: null,
	                lastPercentToPxHeight: null,
	                lastEmToPx: null,
	                remToPx: null,
	                vwToPx: null,
	                vhToPx: null
	            };

	        /* A container for all the ensuing tween data and metadata associated with this call. This container gets pushed to the page-wide
	           Velocity.State.calls array that is processed during animation ticking. */
	        var call = [];

	        /************************
	           Element Processing
	        ************************/

	        /* Element processing consists of three parts -- data processing that cannot go stale and data processing that *can* go stale (i.e. third-party style modifications):
	           1) Pre-Queueing: Element-wide variables, including the element's data storage, are instantiated. Call options are prepared. If triggered, the Stop action is executed.
	           2) Queueing: The logic that runs once this call has reached its point of execution in the element's $.queue() stack. Most logic is placed here to avoid risking it becoming stale.
	           3) Pushing: Consolidation of the tween data followed by its push onto the global in-progress calls container.
	        */

	        function processElement () {

	            /*************************
	               Part I: Pre-Queueing
	            *************************/

	            /***************************
	               Element-Wide Variables
	            ***************************/

	            var element = this,
	                /* The runtime opts object is the extension of the current call's options and Velocity's page-wide option defaults. */
	                opts = $.extend({}, Velocity.defaults, options),
	                /* A container for the processed data associated with each property in the propertyMap.
	                   (Each property in the map produces its own "tween".) */
	                tweensContainer = {},
	                elementUnitConversionData;

	            /******************
	               Element Init
	            ******************/

	            if (Data(element) === undefined) {
	                Velocity.init(element);
	            }

	            /******************
	               Option: Delay
	            ******************/

	            /* Since queue:false doesn't respect the item's existing queue, we avoid injecting its delay here (it's set later on). */
	            /* Note: Velocity rolls its own delay function since jQuery doesn't have a utility alias for $.fn.delay()
	               (and thus requires jQuery element creation, which we avoid since its overhead includes DOM querying). */
	            if (parseFloat(opts.delay) && opts.queue !== false) {
	                $.queue(element, opts.queue, function(next) {
	                    /* This is a flag used to indicate to the upcoming completeCall() function that this queue entry was initiated by Velocity. See completeCall() for further details. */
	                    Velocity.velocityQueueEntryFlag = true;

	                    /* The ensuing queue item (which is assigned to the "next" argument that $.queue() automatically passes in) will be triggered after a setTimeout delay.
	                       The setTimeout is stored so that it can be subjected to clearTimeout() if this animation is prematurely stopped via Velocity's "stop" command. */
	                    Data(element).delayTimer = {
	                        setTimeout: setTimeout(next, parseFloat(opts.delay)),
	                        next: next
	                    };
	                });
	            }

	            /*********************
	               Option: Duration
	            *********************/

	            /* Support for jQuery's named durations. */
	            switch (opts.duration.toString().toLowerCase()) {
	                case "fast":
	                    opts.duration = 200;
	                    break;

	                case "normal":
	                    opts.duration = DURATION_DEFAULT;
	                    break;

	                case "slow":
	                    opts.duration = 600;
	                    break;

	                default:
	                    /* Remove the potential "ms" suffix and default to 1 if the user is attempting to set a duration of 0 (in order to produce an immediate style change). */
	                    opts.duration = parseFloat(opts.duration) || 1;
	            }

	            /************************
	               Global Option: Mock
	            ************************/

	            if (Velocity.mock !== false) {
	                /* In mock mode, all animations are forced to 1ms so that they occur immediately upon the next rAF tick.
	                   Alternatively, a multiplier can be passed in to time remap all delays and durations. */
	                if (Velocity.mock === true) {
	                    opts.duration = opts.delay = 1;
	                } else {
	                    opts.duration *= parseFloat(Velocity.mock) || 1;
	                    opts.delay *= parseFloat(Velocity.mock) || 1;
	                }
	            }

	            /*******************
	               Option: Easing
	            *******************/

	            opts.easing = getEasing(opts.easing, opts.duration);

	            /**********************
	               Option: Callbacks
	            **********************/

	            /* Callbacks must functions. Otherwise, default to null. */
	            if (opts.begin && !Type.isFunction(opts.begin)) {
	                opts.begin = null;
	            }

	            if (opts.progress && !Type.isFunction(opts.progress)) {
	                opts.progress = null;
	            }

	            if (opts.complete && !Type.isFunction(opts.complete)) {
	                opts.complete = null;
	            }

	            /*********************************
	               Option: Display & Visibility
	            *********************************/

	            /* Refer to Velocity's documentation (VelocityJS.org/#displayAndVisibility) for a description of the display and visibility options' behavior. */
	            /* Note: We strictly check for undefined instead of falsiness because display accepts an empty string value. */
	            if (opts.display !== undefined && opts.display !== null) {
	                opts.display = opts.display.toString().toLowerCase();

	                /* Users can pass in a special "auto" value to instruct Velocity to set the element to its default display value. */
	                if (opts.display === "auto") {
	                    opts.display = Velocity.CSS.Values.getDisplayType(element);
	                }
	            }

	            if (opts.visibility !== undefined && opts.visibility !== null) {
	                opts.visibility = opts.visibility.toString().toLowerCase();
	            }

	            /**********************
	               Option: mobileHA
	            **********************/

	            /* When set to true, and if this is a mobile device, mobileHA automatically enables hardware acceleration (via a null transform hack)
	               on animating elements. HA is removed from the element at the completion of its animation. */
	            /* Note: Android Gingerbread doesn't support HA. If a null transform hack (mobileHA) is in fact set, it will prevent other tranform subproperties from taking effect. */
	            /* Note: You can read more about the use of mobileHA in Velocity's documentation: VelocityJS.org/#mobileHA. */
	            opts.mobileHA = (opts.mobileHA && Velocity.State.isMobile && !Velocity.State.isGingerbread);

	            /***********************
	               Part II: Queueing
	            ***********************/

	            /* When a set of elements is targeted by a Velocity call, the set is broken up and each element has the current Velocity call individually queued onto it.
	               In this way, each element's existing queue is respected; some elements may already be animating and accordingly should not have this current Velocity call triggered immediately. */
	            /* In each queue, tween data is processed for each animating property then pushed onto the call-wide calls array. When the last element in the set has had its tweens processed,
	               the call array is pushed to Velocity.State.calls for live processing by the requestAnimationFrame tick. */
	            function buildQueue (next) {

	                /*******************
	                   Option: Begin
	                *******************/

	                /* The begin callback is fired once per call -- not once per elemenet -- and is passed the full raw DOM element set as both its context and its first argument. */
	                if (opts.begin && elementsIndex === 0) {
	                    /* We throw callbacks in a setTimeout so that thrown errors don't halt the execution of Velocity itself. */
	                    try {
	                        opts.begin.call(elements, elements);
	                    } catch (error) {
	                        setTimeout(function() { throw error; }, 1);
	                    }
	                }

	                /*****************************************
	                   Tween Data Construction (for Scroll)
	                *****************************************/

	                /* Note: In order to be subjected to chaining and animation options, scroll's tweening is routed through Velocity as if it were a standard CSS property animation. */
	                if (action === "scroll") {
	                    /* The scroll action uniquely takes an optional "offset" option -- specified in pixels -- that offsets the targeted scroll position. */
	                    var scrollDirection = (/^x$/i.test(opts.axis) ? "Left" : "Top"),
	                        scrollOffset = parseFloat(opts.offset) || 0,
	                        scrollPositionCurrent,
	                        scrollPositionCurrentAlternate,
	                        scrollPositionEnd;

	                    /* Scroll also uniquely takes an optional "container" option, which indicates the parent element that should be scrolled --
	                       as opposed to the browser window itself. This is useful for scrolling toward an element that's inside an overflowing parent element. */
	                    if (opts.container) {
	                        /* Ensure that either a jQuery object or a raw DOM element was passed in. */
	                        if (Type.isWrapped(opts.container) || Type.isNode(opts.container)) {
	                            /* Extract the raw DOM element from the jQuery wrapper. */
	                            opts.container = opts.container[0] || opts.container;
	                            /* Note: Unlike other properties in Velocity, the browser's scroll position is never cached since it so frequently changes
	                               (due to the user's natural interaction with the page). */
	                            scrollPositionCurrent = opts.container["scroll" + scrollDirection]; /* GET */

	                            /* $.position() values are relative to the container's currently viewable area (without taking into account the container's true dimensions
	                               -- say, for example, if the container was not overflowing). Thus, the scroll end value is the sum of the child element's position *and*
	                               the scroll container's current scroll position. */
	                            scrollPositionEnd = (scrollPositionCurrent + $(element).position()[scrollDirection.toLowerCase()]) + scrollOffset; /* GET */
	                        /* If a value other than a jQuery object or a raw DOM element was passed in, default to null so that this option is ignored. */
	                        } else {
	                            opts.container = null;
	                        }
	                    } else {
	                        /* If the window itself is being scrolled -- not a containing element -- perform a live scroll position lookup using
	                           the appropriate cached property names (which differ based on browser type). */
	                        scrollPositionCurrent = Velocity.State.scrollAnchor[Velocity.State["scrollProperty" + scrollDirection]]; /* GET */
	                        /* When scrolling the browser window, cache the alternate axis's current value since window.scrollTo() doesn't let us change only one value at a time. */
	                        scrollPositionCurrentAlternate = Velocity.State.scrollAnchor[Velocity.State["scrollProperty" + (scrollDirection === "Left" ? "Top" : "Left")]]; /* GET */

	                        /* Unlike $.position(), $.offset() values are relative to the browser window's true dimensions -- not merely its currently viewable area --
	                           and therefore end values do not need to be compounded onto current values. */
	                        scrollPositionEnd = $(element).offset()[scrollDirection.toLowerCase()] + scrollOffset; /* GET */
	                    }

	                    /* Since there's only one format that scroll's associated tweensContainer can take, we create it manually. */
	                    tweensContainer = {
	                        scroll: {
	                            rootPropertyValue: false,
	                            startValue: scrollPositionCurrent,
	                            currentValue: scrollPositionCurrent,
	                            endValue: scrollPositionEnd,
	                            unitType: "",
	                            easing: opts.easing,
	                            scrollData: {
	                                container: opts.container,
	                                direction: scrollDirection,
	                                alternateValue: scrollPositionCurrentAlternate
	                            }
	                        },
	                        element: element
	                    };

	                    if (Velocity.debug) console.log("tweensContainer (scroll): ", tweensContainer.scroll, element);

	                /******************************************
	                   Tween Data Construction (for Reverse)
	                ******************************************/

	                /* Reverse acts like a "start" action in that a property map is animated toward. The only difference is
	                   that the property map used for reverse is the inverse of the map used in the previous call. Thus, we manipulate
	                   the previous call to construct our new map: use the previous map's end values as our new map's start values. Copy over all other data. */
	                /* Note: Reverse can be directly called via the "reverse" parameter, or it can be indirectly triggered via the loop option. (Loops are composed of multiple reverses.) */
	                /* Note: Reverse calls do not need to be consecutively chained onto a currently-animating element in order to operate on cached values;
	                   there is no harm to reverse being called on a potentially stale data cache since reverse's behavior is simply defined
	                   as reverting to the element's values as they were prior to the previous *Velocity* call. */
	                } else if (action === "reverse") {
	                    /* Abort if there is no prior animation data to reverse to. */
	                    if (!Data(element).tweensContainer) {
	                        /* Dequeue the element so that this queue entry releases itself immediately, allowing subsequent queue entries to run. */
	                        $.dequeue(element, opts.queue);

	                        return;
	                    } else {
	                        /*********************
	                           Options Parsing
	                        *********************/

	                        /* If the element was hidden via the display option in the previous call,
	                           revert display to "auto" prior to reversal so that the element is visible again. */
	                        if (Data(element).opts.display === "none") {
	                            Data(element).opts.display = "auto";
	                        }

	                        if (Data(element).opts.visibility === "hidden") {
	                            Data(element).opts.visibility = "visible";
	                        }

	                        /* If the loop option was set in the previous call, disable it so that "reverse" calls aren't recursively generated.
	                           Further, remove the previous call's callback options; typically, users do not want these to be refired. */
	                        Data(element).opts.loop = false;
	                        Data(element).opts.begin = null;
	                        Data(element).opts.complete = null;

	                        /* Since we're extending an opts object that has already been extended with the defaults options object,
	                           we remove non-explicitly-defined properties that are auto-assigned values. */
	                        if (!options.easing) {
	                            delete opts.easing;
	                        }

	                        if (!options.duration) {
	                            delete opts.duration;
	                        }

	                        /* The opts object used for reversal is an extension of the options object optionally passed into this
	                           reverse call plus the options used in the previous Velocity call. */
	                        opts = $.extend({}, Data(element).opts, opts);

	                        /*************************************
	                           Tweens Container Reconstruction
	                        *************************************/

	                        /* Create a deepy copy (indicated via the true flag) of the previous call's tweensContainer. */
	                        var lastTweensContainer = $.extend(true, {}, Data(element).tweensContainer);

	                        /* Manipulate the previous tweensContainer by replacing its end values and currentValues with its start values. */
	                        for (var lastTween in lastTweensContainer) {
	                            /* In addition to tween data, tweensContainers contain an element property that we ignore here. */
	                            if (lastTween !== "element") {
	                                var lastStartValue = lastTweensContainer[lastTween].startValue;

	                                lastTweensContainer[lastTween].startValue = lastTweensContainer[lastTween].currentValue = lastTweensContainer[lastTween].endValue;
	                                lastTweensContainer[lastTween].endValue = lastStartValue;

	                                /* Easing is the only option that embeds into the individual tween data (since it can be defined on a per-property basis).
	                                   Accordingly, every property's easing value must be updated when an options object is passed in with a reverse call.
	                                   The side effect of this extensibility is that all per-property easing values are forcefully reset to the new value. */
	                                if (!Type.isEmptyObject(options)) {
	                                    lastTweensContainer[lastTween].easing = opts.easing;
	                                }

	                                if (Velocity.debug) console.log("reverse tweensContainer (" + lastTween + "): " + JSON.stringify(lastTweensContainer[lastTween]), element);
	                            }
	                        }

	                        tweensContainer = lastTweensContainer;
	                    }

	                /*****************************************
	                   Tween Data Construction (for Start)
	                *****************************************/

	                } else if (action === "start") {

	                    /*************************
	                        Value Transferring
	                    *************************/

	                    /* If this queue entry follows a previous Velocity-initiated queue entry *and* if this entry was created
	                       while the element was in the process of being animated by Velocity, then this current call is safe to use
	                       the end values from the prior call as its start values. Velocity attempts to perform this value transfer
	                       process whenever possible in order to avoid requerying the DOM. */
	                    /* If values aren't transferred from a prior call and start values were not forcefed by the user (more on this below),
	                       then the DOM is queried for the element's current values as a last resort. */
	                    /* Note: Conversely, animation reversal (and looping) *always* perform inter-call value transfers; they never requery the DOM. */
	                    var lastTweensContainer;

	                    /* The per-element isAnimating flag is used to indicate whether it's safe (i.e. the data isn't stale)
	                       to transfer over end values to use as start values. If it's set to true and there is a previous
	                       Velocity call to pull values from, do so. */
	                    if (Data(element).tweensContainer && Data(element).isAnimating === true) {
	                        lastTweensContainer = Data(element).tweensContainer;
	                    }

	                    /***************************
	                       Tween Data Calculation
	                    ***************************/

	                    /* This function parses property data and defaults endValue, easing, and startValue as appropriate. */
	                    /* Property map values can either take the form of 1) a single value representing the end value,
	                       or 2) an array in the form of [ endValue, [, easing] [, startValue] ].
	                       The optional third parameter is a forcefed startValue to be used instead of querying the DOM for
	                       the element's current value. Read Velocity's docmentation to learn more about forcefeeding: VelocityJS.org/#forcefeeding */
	                    function parsePropertyValue (valueData, skipResolvingEasing) {
	                        var endValue = undefined,
	                            easing = undefined,
	                            startValue = undefined;

	                        /* Handle the array format, which can be structured as one of three potential overloads:
	                           A) [ endValue, easing, startValue ], B) [ endValue, easing ], or C) [ endValue, startValue ] */
	                        if (Type.isArray(valueData)) {
	                            /* endValue is always the first item in the array. Don't bother validating endValue's value now
	                               since the ensuing property cycling logic does that. */
	                            endValue = valueData[0];

	                            /* Two-item array format: If the second item is a number, function, or hex string, treat it as a
	                               start value since easings can only be non-hex strings or arrays. */
	                            if ((!Type.isArray(valueData[1]) && /^[\d-]/.test(valueData[1])) || Type.isFunction(valueData[1]) || CSS.RegEx.isHex.test(valueData[1])) {
	                                startValue = valueData[1];
	                            /* Two or three-item array: If the second item is a non-hex string or an array, treat it as an easing. */
	                            } else if ((Type.isString(valueData[1]) && !CSS.RegEx.isHex.test(valueData[1])) || Type.isArray(valueData[1])) {
	                                easing = skipResolvingEasing ? valueData[1] : getEasing(valueData[1], opts.duration);

	                                /* Don't bother validating startValue's value now since the ensuing property cycling logic inherently does that. */
	                                if (valueData[2] !== undefined) {
	                                    startValue = valueData[2];
	                                }
	                            }
	                        /* Handle the single-value format. */
	                        } else {
	                            endValue = valueData;
	                        }

	                        /* Default to the call's easing if a per-property easing type was not defined. */
	                        if (!skipResolvingEasing) {
	                            easing = easing || opts.easing;
	                        }

	                        /* If functions were passed in as values, pass the function the current element as its context,
	                           plus the element's index and the element set's size as arguments. Then, assign the returned value. */
	                        if (Type.isFunction(endValue)) {
	                            endValue = endValue.call(element, elementsIndex, elementsLength);
	                        }

	                        if (Type.isFunction(startValue)) {
	                            startValue = startValue.call(element, elementsIndex, elementsLength);
	                        }

	                        /* Allow startValue to be left as undefined to indicate to the ensuing code that its value was not forcefed. */
	                        return [ endValue || 0, easing, startValue ];
	                    }

	                    /* Cycle through each property in the map, looking for shorthand color properties (e.g. "color" as opposed to "colorRed"). Inject the corresponding
	                       colorRed, colorGreen, and colorBlue RGB component tweens into the propertiesMap (which Velocity understands) and remove the shorthand property. */
	                    $.each(propertiesMap, function(property, value) {
	                        /* Find shorthand color properties that have been passed a hex string. */
	                        if (RegExp("^" + CSS.Lists.colors.join("$|^") + "$").test(property)) {
	                            /* Parse the value data for each shorthand. */
	                            var valueData = parsePropertyValue(value, true),
	                                endValue = valueData[0],
	                                easing = valueData[1],
	                                startValue = valueData[2];

	                            if (CSS.RegEx.isHex.test(endValue)) {
	                                /* Convert the hex strings into their RGB component arrays. */
	                                var colorComponents = [ "Red", "Green", "Blue" ],
	                                    endValueRGB = CSS.Values.hexToRgb(endValue),
	                                    startValueRGB = startValue ? CSS.Values.hexToRgb(startValue) : undefined;

	                                /* Inject the RGB component tweens into propertiesMap. */
	                                for (var i = 0; i < colorComponents.length; i++) {
	                                    var dataArray = [ endValueRGB[i] ];

	                                    if (easing) {
	                                        dataArray.push(easing);
	                                    }

	                                    if (startValueRGB !== undefined) {
	                                        dataArray.push(startValueRGB[i]);
	                                    }

	                                    propertiesMap[property + colorComponents[i]] = dataArray;
	                                }

	                                /* Remove the intermediary shorthand property entry now that we've processed it. */
	                                delete propertiesMap[property];
	                            }
	                        }
	                    });

	                    /* Create a tween out of each property, and append its associated data to tweensContainer. */
	                    for (var property in propertiesMap) {

	                        /**************************
	                           Start Value Sourcing
	                        **************************/

	                        /* Parse out endValue, easing, and startValue from the property's data. */
	                        var valueData = parsePropertyValue(propertiesMap[property]),
	                            endValue = valueData[0],
	                            easing = valueData[1],
	                            startValue = valueData[2];

	                        /* Now that the original property name's format has been used for the parsePropertyValue() lookup above,
	                           we force the property to its camelCase styling to normalize it for manipulation. */
	                        property = CSS.Names.camelCase(property);

	                        /* In case this property is a hook, there are circumstances where we will intend to work on the hook's root property and not the hooked subproperty. */
	                        var rootProperty = CSS.Hooks.getRoot(property),
	                            rootPropertyValue = false;

	                        /* Other than for the dummy tween property, properties that are not supported by the browser (and do not have an associated normalization) will
	                           inherently produce no style changes when set, so they are skipped in order to decrease animation tick overhead.
	                           Property support is determined via prefixCheck(), which returns a false flag when no supported is detected. */
	                        /* Note: Since SVG elements have some of their properties directly applied as HTML attributes,
	                           there is no way to check for their explicit browser support, and so we skip skip this check for them. */
	                        if (!Data(element).isSVG && rootProperty !== "tween" && CSS.Names.prefixCheck(rootProperty)[1] === false && CSS.Normalizations.registered[rootProperty] === undefined) {
	                            if (Velocity.debug) console.log("Skipping [" + rootProperty + "] due to a lack of browser support.");

	                            continue;
	                        }

	                        /* If the display option is being set to a non-"none" (e.g. "block") and opacity (filter on IE<=8) is being
	                           animated to an endValue of non-zero, the user's intention is to fade in from invisible, thus we forcefeed opacity
	                           a startValue of 0 if its startValue hasn't already been sourced by value transferring or prior forcefeeding. */
	                        if (((opts.display !== undefined && opts.display !== null && opts.display !== "none") || (opts.visibility !== undefined && opts.visibility !== "hidden")) && /opacity|filter/.test(property) && !startValue && endValue !== 0) {
	                            startValue = 0;
	                        }

	                        /* If values have been transferred from the previous Velocity call, extract the endValue and rootPropertyValue
	                           for all of the current call's properties that were *also* animated in the previous call. */
	                        /* Note: Value transferring can optionally be disabled by the user via the _cacheValues option. */
	                        if (opts._cacheValues && lastTweensContainer && lastTweensContainer[property]) {
	                            if (startValue === undefined) {
	                                startValue = lastTweensContainer[property].endValue + lastTweensContainer[property].unitType;
	                            }

	                            /* The previous call's rootPropertyValue is extracted from the element's data cache since that's the
	                               instance of rootPropertyValue that gets freshly updated by the tweening process, whereas the rootPropertyValue
	                               attached to the incoming lastTweensContainer is equal to the root property's value prior to any tweening. */
	                            rootPropertyValue = Data(element).rootPropertyValueCache[rootProperty];
	                        /* If values were not transferred from a previous Velocity call, query the DOM as needed. */
	                        } else {
	                            /* Handle hooked properties. */
	                            if (CSS.Hooks.registered[property]) {
	                               if (startValue === undefined) {
	                                    rootPropertyValue = CSS.getPropertyValue(element, rootProperty); /* GET */
	                                    /* Note: The following getPropertyValue() call does not actually trigger a DOM query;
	                                       getPropertyValue() will extract the hook from rootPropertyValue. */
	                                    startValue = CSS.getPropertyValue(element, property, rootPropertyValue);
	                                /* If startValue is already defined via forcefeeding, do not query the DOM for the root property's value;
	                                   just grab rootProperty's zero-value template from CSS.Hooks. This overwrites the element's actual
	                                   root property value (if one is set), but this is acceptable since the primary reason users forcefeed is
	                                   to avoid DOM queries, and thus we likewise avoid querying the DOM for the root property's value. */
	                                } else {
	                                    /* Grab this hook's zero-value template, e.g. "0px 0px 0px black". */
	                                    rootPropertyValue = CSS.Hooks.templates[rootProperty][1];
	                                }
	                            /* Handle non-hooked properties that haven't already been defined via forcefeeding. */
	                            } else if (startValue === undefined) {
	                                startValue = CSS.getPropertyValue(element, property); /* GET */
	                            }
	                        }

	                        /**************************
	                           Value Data Extraction
	                        **************************/

	                        var separatedValue,
	                            endValueUnitType,
	                            startValueUnitType,
	                            operator = false;

	                        /* Separates a property value into its numeric value and its unit type. */
	                        function separateValue (property, value) {
	                            var unitType,
	                                numericValue;

	                            numericValue = (value || "0")
	                                .toString()
	                                .toLowerCase()
	                                /* Match the unit type at the end of the value. */
	                                .replace(/[%A-z]+$/, function(match) {
	                                    /* Grab the unit type. */
	                                    unitType = match;

	                                    /* Strip the unit type off of value. */
	                                    return "";
	                                });

	                            /* If no unit type was supplied, assign one that is appropriate for this property (e.g. "deg" for rotateZ or "px" for width). */
	                            if (!unitType) {
	                                unitType = CSS.Values.getUnitType(property);
	                            }

	                            return [ numericValue, unitType ];
	                        }

	                        /* Separate startValue. */
	                        separatedValue = separateValue(property, startValue);
	                        startValue = separatedValue[0];
	                        startValueUnitType = separatedValue[1];

	                        /* Separate endValue, and extract a value operator (e.g. "+=", "-=") if one exists. */
	                        separatedValue = separateValue(property, endValue);
	                        endValue = separatedValue[0].replace(/^([+-\/*])=/, function(match, subMatch) {
	                            operator = subMatch;

	                            /* Strip the operator off of the value. */
	                            return "";
	                        });
	                        endValueUnitType = separatedValue[1];

	                        /* Parse float values from endValue and startValue. Default to 0 if NaN is returned. */
	                        startValue = parseFloat(startValue) || 0;
	                        endValue = parseFloat(endValue) || 0;

	                        /***************************************
	                           Property-Specific Value Conversion
	                        ***************************************/

	                        /* Custom support for properties that don't actually accept the % unit type, but where pollyfilling is trivial and relatively foolproof. */
	                        if (endValueUnitType === "%") {
	                            /* A %-value fontSize/lineHeight is relative to the parent's fontSize (as opposed to the parent's dimensions),
	                               which is identical to the em unit's behavior, so we piggyback off of that. */
	                            if (/^(fontSize|lineHeight)$/.test(property)) {
	                                /* Convert % into an em decimal value. */
	                                endValue = endValue / 100;
	                                endValueUnitType = "em";
	                            /* For scaleX and scaleY, convert the value into its decimal format and strip off the unit type. */
	                            } else if (/^scale/.test(property)) {
	                                endValue = endValue / 100;
	                                endValueUnitType = "";
	                            /* For RGB components, take the defined percentage of 255 and strip off the unit type. */
	                            } else if (/(Red|Green|Blue)$/i.test(property)) {
	                                endValue = (endValue / 100) * 255;
	                                endValueUnitType = "";
	                            }
	                        }

	                        /***************************
	                           Unit Ratio Calculation
	                        ***************************/

	                        /* When queried, the browser returns (most) CSS property values in pixels. Therefore, if an endValue with a unit type of
	                           %, em, or rem is animated toward, startValue must be converted from pixels into the same unit type as endValue in order
	                           for value manipulation logic (increment/decrement) to proceed. Further, if the startValue was forcefed or transferred
	                           from a previous call, startValue may also not be in pixels. Unit conversion logic therefore consists of two steps:
	                           1) Calculating the ratio of %/em/rem/vh/vw relative to pixels
	                           2) Converting startValue into the same unit of measurement as endValue based on these ratios. */
	                        /* Unit conversion ratios are calculated by inserting a sibling node next to the target node, copying over its position property,
	                           setting values with the target unit type then comparing the returned pixel value. */
	                        /* Note: Even if only one of these unit types is being animated, all unit ratios are calculated at once since the overhead
	                           of batching the SETs and GETs together upfront outweights the potential overhead
	                           of layout thrashing caused by re-querying for uncalculated ratios for subsequently-processed properties. */
	                        /* Todo: Shift this logic into the calls' first tick instance so that it's synced with RAF. */
	                        function calculateUnitRatios () {

	                            /************************
	                                Same Ratio Checks
	                            ************************/

	                            /* The properties below are used to determine whether the element differs sufficiently from this call's
	                               previously iterated element to also differ in its unit conversion ratios. If the properties match up with those
	                               of the prior element, the prior element's conversion ratios are used. Like most optimizations in Velocity,
	                               this is done to minimize DOM querying. */
	                            var sameRatioIndicators = {
	                                    myParent: element.parentNode || document.body, /* GET */
	                                    position: CSS.getPropertyValue(element, "position"), /* GET */
	                                    fontSize: CSS.getPropertyValue(element, "fontSize") /* GET */
	                                },
	                                /* Determine if the same % ratio can be used. % is based on the element's position value and its parent's width and height dimensions. */
	                                samePercentRatio = ((sameRatioIndicators.position === callUnitConversionData.lastPosition) && (sameRatioIndicators.myParent === callUnitConversionData.lastParent)),
	                                /* Determine if the same em ratio can be used. em is relative to the element's fontSize. */
	                                sameEmRatio = (sameRatioIndicators.fontSize === callUnitConversionData.lastFontSize);

	                            /* Store these ratio indicators call-wide for the next element to compare against. */
	                            callUnitConversionData.lastParent = sameRatioIndicators.myParent;
	                            callUnitConversionData.lastPosition = sameRatioIndicators.position;
	                            callUnitConversionData.lastFontSize = sameRatioIndicators.fontSize;

	                            /***************************
	                               Element-Specific Units
	                            ***************************/

	                            /* Note: IE8 rounds to the nearest pixel when returning CSS values, thus we perform conversions using a measurement
	                               of 100 (instead of 1) to give our ratios a precision of at least 2 decimal values. */
	                            var measurement = 100,
	                                unitRatios = {};

	                            if (!sameEmRatio || !samePercentRatio) {
	                                var dummy = Data(element).isSVG ? document.createElementNS("http://www.w3.org/2000/svg", "rect") : document.createElement("div");

	                                Velocity.init(dummy);
	                                sameRatioIndicators.myParent.appendChild(dummy);

	                                /* To accurately and consistently calculate conversion ratios, the element's cascaded overflow and box-sizing are stripped.
	                                   Similarly, since width/height can be artificially constrained by their min-/max- equivalents, these are controlled for as well. */
	                                /* Note: Overflow must be also be controlled for per-axis since the overflow property overwrites its per-axis values. */
	                                $.each([ "overflow", "overflowX", "overflowY" ], function(i, property) {
	                                    Velocity.CSS.setPropertyValue(dummy, property, "hidden");
	                                });
	                                Velocity.CSS.setPropertyValue(dummy, "position", sameRatioIndicators.position);
	                                Velocity.CSS.setPropertyValue(dummy, "fontSize", sameRatioIndicators.fontSize);
	                                Velocity.CSS.setPropertyValue(dummy, "boxSizing", "content-box");

	                                /* width and height act as our proxy properties for measuring the horizontal and vertical % ratios. */
	                                $.each([ "minWidth", "maxWidth", "width", "minHeight", "maxHeight", "height" ], function(i, property) {
	                                    Velocity.CSS.setPropertyValue(dummy, property, measurement + "%");
	                                });
	                                /* paddingLeft arbitrarily acts as our proxy property for the em ratio. */
	                                Velocity.CSS.setPropertyValue(dummy, "paddingLeft", measurement + "em");

	                                /* Divide the returned value by the measurement to get the ratio between 1% and 1px. Default to 1 since working with 0 can produce Infinite. */
	                                unitRatios.percentToPxWidth = callUnitConversionData.lastPercentToPxWidth = (parseFloat(CSS.getPropertyValue(dummy, "width", null, true)) || 1) / measurement; /* GET */
	                                unitRatios.percentToPxHeight = callUnitConversionData.lastPercentToPxHeight = (parseFloat(CSS.getPropertyValue(dummy, "height", null, true)) || 1) / measurement; /* GET */
	                                unitRatios.emToPx = callUnitConversionData.lastEmToPx = (parseFloat(CSS.getPropertyValue(dummy, "paddingLeft")) || 1) / measurement; /* GET */

	                                sameRatioIndicators.myParent.removeChild(dummy);
	                            } else {
	                                unitRatios.emToPx = callUnitConversionData.lastEmToPx;
	                                unitRatios.percentToPxWidth = callUnitConversionData.lastPercentToPxWidth;
	                                unitRatios.percentToPxHeight = callUnitConversionData.lastPercentToPxHeight;
	                            }

	                            /***************************
	                               Element-Agnostic Units
	                            ***************************/

	                            /* Whereas % and em ratios are determined on a per-element basis, the rem unit only needs to be checked
	                               once per call since it's exclusively dependant upon document.body's fontSize. If this is the first time
	                               that calculateUnitRatios() is being run during this call, remToPx will still be set to its default value of null,
	                               so we calculate it now. */
	                            if (callUnitConversionData.remToPx === null) {
	                                /* Default to browsers' default fontSize of 16px in the case of 0. */
	                                callUnitConversionData.remToPx = parseFloat(CSS.getPropertyValue(document.body, "fontSize")) || 16; /* GET */
	                            }

	                            /* Similarly, viewport units are %-relative to the window's inner dimensions. */
	                            if (callUnitConversionData.vwToPx === null) {
	                                callUnitConversionData.vwToPx = parseFloat(window.innerWidth) / 100; /* GET */
	                                callUnitConversionData.vhToPx = parseFloat(window.innerHeight) / 100; /* GET */
	                            }

	                            unitRatios.remToPx = callUnitConversionData.remToPx;
	                            unitRatios.vwToPx = callUnitConversionData.vwToPx;
	                            unitRatios.vhToPx = callUnitConversionData.vhToPx;

	                            if (Velocity.debug >= 1) console.log("Unit ratios: " + JSON.stringify(unitRatios), element);

	                            return unitRatios;
	                        }

	                        /********************
	                           Unit Conversion
	                        ********************/

	                        /* The * and / operators, which are not passed in with an associated unit, inherently use startValue's unit. Skip value and unit conversion. */
	                        if (/[\/*]/.test(operator)) {
	                            endValueUnitType = startValueUnitType;
	                        /* If startValue and endValue differ in unit type, convert startValue into the same unit type as endValue so that if endValueUnitType
	                           is a relative unit (%, em, rem), the values set during tweening will continue to be accurately relative even if the metrics they depend
	                           on are dynamically changing during the course of the animation. Conversely, if we always normalized into px and used px for setting values, the px ratio
	                           would become stale if the original unit being animated toward was relative and the underlying metrics change during the animation. */
	                        /* Since 0 is 0 in any unit type, no conversion is necessary when startValue is 0 -- we just start at 0 with endValueUnitType. */
	                        } else if ((startValueUnitType !== endValueUnitType) && startValue !== 0) {
	                            /* Unit conversion is also skipped when endValue is 0, but *startValueUnitType* must be used for tween values to remain accurate. */
	                            /* Note: Skipping unit conversion here means that if endValueUnitType was originally a relative unit, the animation won't relatively
	                               match the underlying metrics if they change, but this is acceptable since we're animating toward invisibility instead of toward visibility,
	                               which remains past the point of the animation's completion. */
	                            if (endValue === 0) {
	                                endValueUnitType = startValueUnitType;
	                            } else {
	                                /* By this point, we cannot avoid unit conversion (it's undesirable since it causes layout thrashing).
	                                   If we haven't already, we trigger calculateUnitRatios(), which runs once per element per call. */
	                                elementUnitConversionData = elementUnitConversionData || calculateUnitRatios();

	                                /* The following RegEx matches CSS properties that have their % values measured relative to the x-axis. */
	                                /* Note: W3C spec mandates that all of margin and padding's properties (even top and bottom) are %-relative to the *width* of the parent element. */
	                                var axis = (/margin|padding|left|right|width|text|word|letter/i.test(property) || /X$/.test(property) || property === "x") ? "x" : "y";

	                                /* In order to avoid generating n^2 bespoke conversion functions, unit conversion is a two-step process:
	                                   1) Convert startValue into pixels. 2) Convert this new pixel value into endValue's unit type. */
	                                switch (startValueUnitType) {
	                                    case "%":
	                                        /* Note: translateX and translateY are the only properties that are %-relative to an element's own dimensions -- not its parent's dimensions.
	                                           Velocity does not include a special conversion process to account for this behavior. Therefore, animating translateX/Y from a % value
	                                           to a non-% value will produce an incorrect start value. Fortunately, this sort of cross-unit conversion is rarely done by users in practice. */
	                                        startValue *= (axis === "x" ? elementUnitConversionData.percentToPxWidth : elementUnitConversionData.percentToPxHeight);
	                                        break;

	                                    case "px":
	                                        /* px acts as our midpoint in the unit conversion process; do nothing. */
	                                        break;

	                                    default:
	                                        startValue *= elementUnitConversionData[startValueUnitType + "ToPx"];
	                                }

	                                /* Invert the px ratios to convert into to the target unit. */
	                                switch (endValueUnitType) {
	                                    case "%":
	                                        startValue *= 1 / (axis === "x" ? elementUnitConversionData.percentToPxWidth : elementUnitConversionData.percentToPxHeight);
	                                        break;

	                                    case "px":
	                                        /* startValue is already in px, do nothing; we're done. */
	                                        break;

	                                    default:
	                                        startValue *= 1 / elementUnitConversionData[endValueUnitType + "ToPx"];
	                                }
	                            }
	                        }

	                        /*********************
	                           Relative Values
	                        *********************/

	                        /* Operator logic must be performed last since it requires unit-normalized start and end values. */
	                        /* Note: Relative *percent values* do not behave how most people think; while one would expect "+=50%"
	                           to increase the property 1.5x its current value, it in fact increases the percent units in absolute terms:
	                           50 points is added on top of the current % value. */
	                        switch (operator) {
	                            case "+":
	                                endValue = startValue + endValue;
	                                break;

	                            case "-":
	                                endValue = startValue - endValue;
	                                break;

	                            case "*":
	                                endValue = startValue * endValue;
	                                break;

	                            case "/":
	                                endValue = startValue / endValue;
	                                break;
	                        }

	                        /**************************
	                           tweensContainer Push
	                        **************************/

	                        /* Construct the per-property tween object, and push it to the element's tweensContainer. */
	                        tweensContainer[property] = {
	                            rootPropertyValue: rootPropertyValue,
	                            startValue: startValue,
	                            currentValue: startValue,
	                            endValue: endValue,
	                            unitType: endValueUnitType,
	                            easing: easing
	                        };

	                        if (Velocity.debug) console.log("tweensContainer (" + property + "): " + JSON.stringify(tweensContainer[property]), element);
	                    }

	                    /* Along with its property data, store a reference to the element itself onto tweensContainer. */
	                    tweensContainer.element = element;
	                }

	                /*****************
	                    Call Push
	                *****************/

	                /* Note: tweensContainer can be empty if all of the properties in this call's property map were skipped due to not
	                   being supported by the browser. The element property is used for checking that the tweensContainer has been appended to. */
	                if (tweensContainer.element) {
	                    /* Apply the "velocity-animating" indicator class. */
	                    CSS.Values.addClass(element, "velocity-animating");

	                    /* The call array houses the tweensContainers for each element being animated in the current call. */
	                    call.push(tweensContainer);

	                    /* Store the tweensContainer and options if we're working on the default effects queue, so that they can be used by the reverse command. */
	                    if (opts.queue === "") {
	                        Data(element).tweensContainer = tweensContainer;
	                        Data(element).opts = opts;
	                    }

	                    /* Switch on the element's animating flag. */
	                    Data(element).isAnimating = true;

	                    /* Once the final element in this call's element set has been processed, push the call array onto
	                       Velocity.State.calls for the animation tick to immediately begin processing. */
	                    if (elementsIndex === elementsLength - 1) {
	                        /* Add the current call plus its associated metadata (the element set and the call's options) onto the global call container.
	                           Anything on this call container is subjected to tick() processing. */
	                        Velocity.State.calls.push([ call, elements, opts, null, promiseData.resolver ]);

	                        /* If the animation tick isn't running, start it. (Velocity shuts it off when there are no active calls to process.) */
	                        if (Velocity.State.isTicking === false) {
	                            Velocity.State.isTicking = true;

	                            /* Start the tick loop. */
	                            tick();
	                        }
	                    } else {
	                        elementsIndex++;
	                    }
	                }
	            }

	            /* When the queue option is set to false, the call skips the element's queue and fires immediately. */
	            if (opts.queue === false) {
	                /* Since this buildQueue call doesn't respect the element's existing queue (which is where a delay option would have been appended),
	                   we manually inject the delay property here with an explicit setTimeout. */
	                if (opts.delay) {
	                    setTimeout(buildQueue, opts.delay);
	                } else {
	                    buildQueue();
	                }
	            /* Otherwise, the call undergoes element queueing as normal. */
	            /* Note: To interoperate with jQuery, Velocity uses jQuery's own $.queue() stack for queuing logic. */
	            } else {
	                $.queue(element, opts.queue, function(next, clearQueue) {
	                    /* If the clearQueue flag was passed in by the stop command, resolve this call's promise. (Promises can only be resolved once,
	                       so it's fine if this is repeatedly triggered for each element in the associated call.) */
	                    if (clearQueue === true) {
	                        if (promiseData.promise) {
	                            promiseData.resolver(elements);
	                        }

	                        /* Do not continue with animation queueing. */
	                        return true;
	                    }

	                    /* This flag indicates to the upcoming completeCall() function that this queue entry was initiated by Velocity.
	                       See completeCall() for further details. */
	                    Velocity.velocityQueueEntryFlag = true;

	                    buildQueue(next);
	                });
	            }

	            /*********************
	                Auto-Dequeuing
	            *********************/

	            /* As per jQuery's $.queue() behavior, to fire the first non-custom-queue entry on an element, the element
	               must be dequeued if its queue stack consists *solely* of the current call. (This can be determined by checking
	               for the "inprogress" item that jQuery prepends to active queue stack arrays.) Regardless, whenever the element's
	               queue is further appended with additional items -- including $.delay()'s or even $.animate() calls, the queue's
	               first entry is automatically fired. This behavior contrasts that of custom queues, which never auto-fire. */
	            /* Note: When an element set is being subjected to a non-parallel Velocity call, the animation will not begin until
	               each one of the elements in the set has reached the end of its individually pre-existing queue chain. */
	            /* Note: Unfortunately, most people don't fully grasp jQuery's powerful, yet quirky, $.queue() function.
	               Lean more here: http://stackoverflow.com/questions/1058158/can-somebody-explain-jquery-queue-to-me */
	            if ((opts.queue === "" || opts.queue === "fx") && $.queue(element)[0] !== "inprogress") {
	                $.dequeue(element);
	            }
	        }

	        /**************************
	           Element Set Iteration
	        **************************/

	        /* If the "nodeType" property exists on the elements variable, we're animating a single element.
	           Place it in an array so that $.each() can iterate over it. */
	        $.each(elements, function(i, element) {
	            /* Ensure each element in a set has a nodeType (is a real element) to avoid throwing errors. */
	            if (Type.isNode(element)) {
	                processElement.call(element);
	            }
	        });

	        /******************
	           Option: Loop
	        ******************/

	        /* The loop option accepts an integer indicating how many times the element should loop between the values in the
	           current call's properties map and the element's property values prior to this call. */
	        /* Note: The loop option's logic is performed here -- after element processing -- because the current call needs
	           to undergo its queue insertion prior to the loop option generating its series of constituent "reverse" calls,
	           which chain after the current call. Two reverse calls (two "alternations") constitute one loop. */
	        var opts = $.extend({}, Velocity.defaults, options),
	            reverseCallsCount;

	        opts.loop = parseInt(opts.loop);
	        reverseCallsCount = (opts.loop * 2) - 1;

	        if (opts.loop) {
	            /* Double the loop count to convert it into its appropriate number of "reverse" calls.
	               Subtract 1 from the resulting value since the current call is included in the total alternation count. */
	            for (var x = 0; x < reverseCallsCount; x++) {
	                /* Since the logic for the reverse action occurs inside Queueing and therefore this call's options object
	                   isn't parsed until then as well, the current call's delay option must be explicitly passed into the reverse
	                   call so that the delay logic that occurs inside *Pre-Queueing* can process it. */
	                var reverseOptions = {
	                    delay: opts.delay,
	                    progress: opts.progress
	                };

	                /* If a complete callback was passed into this call, transfer it to the loop redirect's final "reverse" call
	                   so that it's triggered when the entire redirect is complete (and not when the very first animation is complete). */
	                if (x === reverseCallsCount - 1) {
	                    reverseOptions.display = opts.display;
	                    reverseOptions.visibility = opts.visibility;
	                    reverseOptions.complete = opts.complete;
	                }

	                animate(elements, "reverse", reverseOptions);
	            }
	        }

	        /***************
	            Chaining
	        ***************/

	        /* Return the elements back to the call chain, with wrapped elements taking precedence in case Velocity was called via the $.fn. extension. */
	        return getChain();
	    };

	    /* Turn Velocity into the animation function, extended with the pre-existing Velocity object. */
	    Velocity = $.extend(animate, Velocity);
	    /* For legacy support, also expose the literal animate method. */
	    Velocity.animate = animate;

	    /**************
	        Timing
	    **************/

	    /* Ticker function. */
	    var ticker = window.requestAnimationFrame || rAFShim;

	    /* Inactive browser tabs pause rAF, which results in all active animations immediately sprinting to their completion states when the tab refocuses.
	       To get around this, we dynamically switch rAF to setTimeout (which the browser *doesn't* pause) when the tab loses focus. We skip this for mobile
	       devices to avoid wasting battery power on inactive tabs. */
	    /* Note: Tab focus detection doesn't work on older versions of IE, but that's okay since they don't support rAF to begin with. */
	    if (!Velocity.State.isMobile && document.hidden !== undefined) {
	        document.addEventListener("visibilitychange", function() {
	            /* Reassign the rAF function (which the global tick() function uses) based on the tab's focus state. */
	            if (document.hidden) {
	                ticker = function(callback) {
	                    /* The tick function needs a truthy first argument in order to pass its internal timestamp check. */
	                    return setTimeout(function() { callback(true) }, 16);
	                };

	                /* The rAF loop has been paused by the browser, so we manually restart the tick. */
	                tick();
	            } else {
	                ticker = window.requestAnimationFrame || rAFShim;
	            }
	        });
	    }

	    /************
	        Tick
	    ************/

	    /* Note: All calls to Velocity are pushed to the Velocity.State.calls array, which is fully iterated through upon each tick. */
	    function tick (timestamp) {
	        /* An empty timestamp argument indicates that this is the first tick occurence since ticking was turned on.
	           We leverage this metadata to fully ignore the first tick pass since RAF's initial pass is fired whenever
	           the browser's next tick sync time occurs, which results in the first elements subjected to Velocity
	           calls being animated out of sync with any elements animated immediately thereafter. In short, we ignore
	           the first RAF tick pass so that elements being immediately consecutively animated -- instead of simultaneously animated
	           by the same Velocity call -- are properly batched into the same initial RAF tick and consequently remain in sync thereafter. */
	        if (timestamp) {
	            /* We ignore RAF's high resolution timestamp since it can be significantly offset when the browser is
	               under high stress; we opt for choppiness over allowing the browser to drop huge chunks of frames. */
	            var timeCurrent = (new Date).getTime();

	            /********************
	               Call Iteration
	            ********************/

	            var callsLength = Velocity.State.calls.length;

	            /* To speed up iterating over this array, it is compacted (falsey items -- calls that have completed -- are removed)
	               when its length has ballooned to a point that can impact tick performance. This only becomes necessary when animation
	               has been continuous with many elements over a long period of time; whenever all active calls are completed, completeCall() clears Velocity.State.calls. */
	            if (callsLength > 10000) {
	                Velocity.State.calls = compactSparseArray(Velocity.State.calls);
	            }

	            /* Iterate through each active call. */
	            for (var i = 0; i < callsLength; i++) {
	                /* When a Velocity call is completed, its Velocity.State.calls entry is set to false. Continue on to the next call. */
	                if (!Velocity.State.calls[i]) {
	                    continue;
	                }

	                /************************
	                   Call-Wide Variables
	                ************************/

	                var callContainer = Velocity.State.calls[i],
	                    call = callContainer[0],
	                    opts = callContainer[2],
	                    timeStart = callContainer[3],
	                    firstTick = !!timeStart,
	                    tweenDummyValue = null;

	                /* If timeStart is undefined, then this is the first time that this call has been processed by tick().
	                   We assign timeStart now so that its value is as close to the real animation start time as possible.
	                   (Conversely, had timeStart been defined when this call was added to Velocity.State.calls, the delay
	                   between that time and now would cause the first few frames of the tween to be skipped since
	                   percentComplete is calculated relative to timeStart.) */
	                /* Further, subtract 16ms (the approximate resolution of RAF) from the current time value so that the
	                   first tick iteration isn't wasted by animating at 0% tween completion, which would produce the
	                   same style value as the element's current value. */
	                if (!timeStart) {
	                    timeStart = Velocity.State.calls[i][3] = timeCurrent - 16;
	                }

	                /* The tween's completion percentage is relative to the tween's start time, not the tween's start value
	                   (which would result in unpredictable tween durations since JavaScript's timers are not particularly accurate).
	                   Accordingly, we ensure that percentComplete does not exceed 1. */
	                var percentComplete = Math.min((timeCurrent - timeStart) / opts.duration, 1);

	                /**********************
	                   Element Iteration
	                **********************/

	                /* For every call, iterate through each of the elements in its set. */
	                for (var j = 0, callLength = call.length; j < callLength; j++) {
	                    var tweensContainer = call[j],
	                        element = tweensContainer.element;

	                    /* Check to see if this element has been deleted midway through the animation by checking for the
	                       continued existence of its data cache. If it's gone, skip animating this element. */
	                    if (!Data(element)) {
	                        continue;
	                    }

	                    var transformPropertyExists = false;

	                    /**********************************
	                       Display & Visibility Toggling
	                    **********************************/

	                    /* If the display option is set to non-"none", set it upfront so that the element can become visible before tweening begins.
	                       (Otherwise, display's "none" value is set in completeCall() once the animation has completed.) */
	                    if (opts.display !== undefined && opts.display !== null && opts.display !== "none") {
	                        if (opts.display === "flex") {
	                            var flexValues = [ "-webkit-box", "-moz-box", "-ms-flexbox", "-webkit-flex" ];

	                            $.each(flexValues, function(i, flexValue) {
	                                CSS.setPropertyValue(element, "display", flexValue);
	                            });
	                        }

	                        CSS.setPropertyValue(element, "display", opts.display);
	                    }

	                    /* Same goes with the visibility option, but its "none" equivalent is "hidden". */
	                    if (opts.visibility !== undefined && opts.visibility !== "hidden") {
	                        CSS.setPropertyValue(element, "visibility", opts.visibility);
	                    }

	                    /************************
	                       Property Iteration
	                    ************************/

	                    /* For every element, iterate through each property. */
	                    for (var property in tweensContainer) {
	                        /* Note: In addition to property tween data, tweensContainer contains a reference to its associated element. */
	                        if (property !== "element") {
	                            var tween = tweensContainer[property],
	                                currentValue,
	                                /* Easing can either be a pre-genereated function or a string that references a pre-registered easing
	                                   on the Velocity.Easings object. In either case, return the appropriate easing *function*. */
	                                easing = Type.isString(tween.easing) ? Velocity.Easings[tween.easing] : tween.easing;

	                            /******************************
	                               Current Value Calculation
	                            ******************************/

	                            /* If this is the last tick pass (if we've reached 100% completion for this tween),
	                               ensure that currentValue is explicitly set to its target endValue so that it's not subjected to any rounding. */
	                            if (percentComplete === 1) {
	                                currentValue = tween.endValue;
	                            /* Otherwise, calculate currentValue based on the current delta from startValue. */
	                            } else {
	                                var tweenDelta = tween.endValue - tween.startValue;
	                                currentValue = tween.startValue + (tweenDelta * easing(percentComplete, opts, tweenDelta));

	                                /* If no value change is occurring, don't proceed with DOM updating. */
	                                if (!firstTick && (currentValue === tween.currentValue)) {
	                                    continue;
	                                }
	                            }

	                            tween.currentValue = currentValue;

	                            /* If we're tweening a fake 'tween' property in order to log transition values, update the one-per-call variable so that
	                               it can be passed into the progress callback. */
	                            if (property === "tween") {
	                                tweenDummyValue = currentValue;
	                            } else {
	                                /******************
	                                   Hooks: Part I
	                                ******************/

	                                /* For hooked properties, the newly-updated rootPropertyValueCache is cached onto the element so that it can be used
	                                   for subsequent hooks in this call that are associated with the same root property. If we didn't cache the updated
	                                   rootPropertyValue, each subsequent update to the root property in this tick pass would reset the previous hook's
	                                   updates to rootPropertyValue prior to injection. A nice performance byproduct of rootPropertyValue caching is that
	                                   subsequently chained animations using the same hookRoot but a different hook can use this cached rootPropertyValue. */
	                                if (CSS.Hooks.registered[property]) {
	                                    var hookRoot = CSS.Hooks.getRoot(property),
	                                        rootPropertyValueCache = Data(element).rootPropertyValueCache[hookRoot];

	                                    if (rootPropertyValueCache) {
	                                        tween.rootPropertyValue = rootPropertyValueCache;
	                                    }
	                                }

	                                /*****************
	                                    DOM Update
	                                *****************/

	                                /* setPropertyValue() returns an array of the property name and property value post any normalization that may have been performed. */
	                                /* Note: To solve an IE<=8 positioning bug, the unit type is dropped when setting a property value of 0. */
	                                var adjustedSetData = CSS.setPropertyValue(element, /* SET */
	                                                                           property,
	                                                                           tween.currentValue + (parseFloat(currentValue) === 0 ? "" : tween.unitType),
	                                                                           tween.rootPropertyValue,
	                                                                           tween.scrollData);

	                                /*******************
	                                   Hooks: Part II
	                                *******************/

	                                /* Now that we have the hook's updated rootPropertyValue (the post-processed value provided by adjustedSetData), cache it onto the element. */
	                                if (CSS.Hooks.registered[property]) {
	                                    /* Since adjustedSetData contains normalized data ready for DOM updating, the rootPropertyValue needs to be re-extracted from its normalized form. ?? */
	                                    if (CSS.Normalizations.registered[hookRoot]) {
	                                        Data(element).rootPropertyValueCache[hookRoot] = CSS.Normalizations.registered[hookRoot]("extract", null, adjustedSetData[1]);
	                                    } else {
	                                        Data(element).rootPropertyValueCache[hookRoot] = adjustedSetData[1];
	                                    }
	                                }

	                                /***************
	                                   Transforms
	                                ***************/

	                                /* Flag whether a transform property is being animated so that flushTransformCache() can be triggered once this tick pass is complete. */
	                                if (adjustedSetData[0] === "transform") {
	                                    transformPropertyExists = true;
	                                }

	                            }
	                        }
	                    }

	                    /****************
	                        mobileHA
	                    ****************/

	                    /* If mobileHA is enabled, set the translate3d transform to null to force hardware acceleration.
	                       It's safe to override this property since Velocity doesn't actually support its animation (hooks are used in its place). */
	                    if (opts.mobileHA) {
	                        /* Don't set the null transform hack if we've already done so. */
	                        if (Data(element).transformCache.translate3d === undefined) {
	                            /* All entries on the transformCache object are later concatenated into a single transform string via flushTransformCache(). */
	                            Data(element).transformCache.translate3d = "(0px, 0px, 0px)";

	                            transformPropertyExists = true;
	                        }
	                    }

	                    if (transformPropertyExists) {
	                        CSS.flushTransformCache(element);
	                    }
	                }

	                /* The non-"none" display value is only applied to an element once -- when its associated call is first ticked through.
	                   Accordingly, it's set to false so that it isn't re-processed by this call in the next tick. */
	                if (opts.display !== undefined && opts.display !== "none") {
	                    Velocity.State.calls[i][2].display = false;
	                }
	                if (opts.visibility !== undefined && opts.visibility !== "hidden") {
	                    Velocity.State.calls[i][2].visibility = false;
	                }

	                /* Pass the elements and the timing data (percentComplete, msRemaining, timeStart, tweenDummyValue) into the progress callback. */
	                if (opts.progress) {
	                    opts.progress.call(callContainer[1],
	                                       callContainer[1],
	                                       percentComplete,
	                                       Math.max(0, (timeStart + opts.duration) - timeCurrent),
	                                       timeStart,
	                                       tweenDummyValue);
	                }

	                /* If this call has finished tweening, pass its index to completeCall() to handle call cleanup. */
	                if (percentComplete === 1) {
	                    completeCall(i);
	                }
	            }
	        }

	        /* Note: completeCall() sets the isTicking flag to false when the last call on Velocity.State.calls has completed. */
	        if (Velocity.State.isTicking) {
	            ticker(tick);
	        }
	    }

	    /**********************
	        Call Completion
	    **********************/

	    /* Note: Unlike tick(), which processes all active calls at once, call completion is handled on a per-call basis. */
	    function completeCall (callIndex, isStopped) {
	        /* Ensure the call exists. */
	        if (!Velocity.State.calls[callIndex]) {
	            return false;
	        }

	        /* Pull the metadata from the call. */
	        var call = Velocity.State.calls[callIndex][0],
	            elements = Velocity.State.calls[callIndex][1],
	            opts = Velocity.State.calls[callIndex][2],
	            resolver = Velocity.State.calls[callIndex][4];

	        var remainingCallsExist = false;

	        /*************************
	           Element Finalization
	        *************************/

	        for (var i = 0, callLength = call.length; i < callLength; i++) {
	            var element = call[i].element;

	            /* If the user set display to "none" (intending to hide the element), set it now that the animation has completed. */
	            /* Note: display:none isn't set when calls are manually stopped (via Velocity("stop"). */
	            /* Note: Display gets ignored with "reverse" calls and infinite loops, since this behavior would be undesirable. */
	            if (!isStopped && !opts.loop) {
	                if (opts.display === "none") {
	                    CSS.setPropertyValue(element, "display", opts.display);
	                }

	                if (opts.visibility === "hidden") {
	                    CSS.setPropertyValue(element, "visibility", opts.visibility);
	                }
	            }

	            /* If the element's queue is empty (if only the "inprogress" item is left at position 0) or if its queue is about to run
	               a non-Velocity-initiated entry, turn off the isAnimating flag. A non-Velocity-initiatied queue entry's logic might alter
	               an element's CSS values and thereby cause Velocity's cached value data to go stale. To detect if a queue entry was initiated by Velocity,
	               we check for the existence of our special Velocity.queueEntryFlag declaration, which minifiers won't rename since the flag
	               is assigned to jQuery's global $ object and thus exists out of Velocity's own scope. */
	            if (opts.loop !== true && ($.queue(element)[1] === undefined || !/\.velocityQueueEntryFlag/i.test($.queue(element)[1]))) {
	                /* The element may have been deleted. Ensure that its data cache still exists before acting on it. */
	                if (Data(element)) {
	                    Data(element).isAnimating = false;
	                    /* Clear the element's rootPropertyValueCache, which will become stale. */
	                    Data(element).rootPropertyValueCache = {};

	                    var transformHAPropertyExists = false;
	                    /* If any 3D transform subproperty is at its default value (regardless of unit type), remove it. */
	                    $.each(CSS.Lists.transforms3D, function(i, transformName) {
	                        var defaultValue = /^scale/.test(transformName) ? 1 : 0,
	                            currentValue = Data(element).transformCache[transformName];

	                        if (Data(element).transformCache[transformName] !== undefined && new RegExp("^\\(" + defaultValue + "[^.]").test(currentValue)) {
	                            transformHAPropertyExists = true;

	                            delete Data(element).transformCache[transformName];
	                        }
	                    });

	                    /* Mobile devices have hardware acceleration removed at the end of the animation in order to avoid hogging the GPU's memory. */
	                    if (opts.mobileHA) {
	                        transformHAPropertyExists = true;
	                        delete Data(element).transformCache.translate3d;
	                    }

	                    /* Flush the subproperty removals to the DOM. */
	                    if (transformHAPropertyExists) {
	                        CSS.flushTransformCache(element);
	                    }

	                    /* Remove the "velocity-animating" indicator class. */
	                    CSS.Values.removeClass(element, "velocity-animating");
	                }
	            }

	            /*********************
	               Option: Complete
	            *********************/

	            /* Complete is fired once per call (not once per element) and is passed the full raw DOM element set as both its context and its first argument. */
	            /* Note: Callbacks aren't fired when calls are manually stopped (via Velocity("stop"). */
	            if (!isStopped && opts.complete && !opts.loop && (i === callLength - 1)) {
	                /* We throw callbacks in a setTimeout so that thrown errors don't halt the execution of Velocity itself. */
	                try {
	                    opts.complete.call(elements, elements);
	                } catch (error) {
	                    setTimeout(function() { throw error; }, 1);
	                }
	            }

	            /**********************
	               Promise Resolving
	            **********************/

	            /* Note: Infinite loops don't return promises. */
	            if (resolver && opts.loop !== true) {
	                resolver(elements);
	            }

	            /****************************
	               Option: Loop (Infinite)
	            ****************************/

	            if (Data(element) && opts.loop === true && !isStopped) {
	                /* If a rotateX/Y/Z property is being animated to 360 deg with loop:true, swap tween start/end values to enable
	                   continuous iterative rotation looping. (Otherise, the element would just rotate back and forth.) */
	                $.each(Data(element).tweensContainer, function(propertyName, tweenContainer) {
	                    if (/^rotate/.test(propertyName) && parseFloat(tweenContainer.endValue) === 360) {
	                        tweenContainer.endValue = 0;
	                        tweenContainer.startValue = 360;
	                    }

	                    if (/^backgroundPosition/.test(propertyName) && parseFloat(tweenContainer.endValue) === 100 && tweenContainer.unitType === "%") {
	                        tweenContainer.endValue = 0;
	                        tweenContainer.startValue = 100;
	                    }
	                });

	                Velocity(element, "reverse", { loop: true, delay: opts.delay });
	            }

	            /***************
	               Dequeueing
	            ***************/

	            /* Fire the next call in the queue so long as this call's queue wasn't set to false (to trigger a parallel animation),
	               which would have already caused the next call to fire. Note: Even if the end of the animation queue has been reached,
	               $.dequeue() must still be called in order to completely clear jQuery's animation queue. */
	            if (opts.queue !== false) {
	                $.dequeue(element, opts.queue);
	            }
	        }

	        /************************
	           Calls Array Cleanup
	        ************************/

	        /* Since this call is complete, set it to false so that the rAF tick skips it. This array is later compacted via compactSparseArray().
	          (For performance reasons, the call is set to false instead of being deleted from the array: http://www.html5rocks.com/en/tutorials/speed/v8/) */
	        Velocity.State.calls[callIndex] = false;

	        /* Iterate through the calls array to determine if this was the final in-progress animation.
	           If so, set a flag to end ticking and clear the calls array. */
	        for (var j = 0, callsLength = Velocity.State.calls.length; j < callsLength; j++) {
	            if (Velocity.State.calls[j] !== false) {
	                remainingCallsExist = true;

	                break;
	            }
	        }

	        if (remainingCallsExist === false) {
	            /* tick() will detect this flag upon its next iteration and subsequently turn itself off. */
	            Velocity.State.isTicking = false;

	            /* Clear the calls array so that its length is reset. */
	            delete Velocity.State.calls;
	            Velocity.State.calls = [];
	        }
	    }

	    /******************
	        Frameworks
	    ******************/

	    /* Both jQuery and Zepto allow their $.fn object to be extended to allow wrapped elements to be subjected to plugin calls.
	       If either framework is loaded, register a "velocity" extension pointing to Velocity's core animate() method.  Velocity
	       also registers itself onto a global container (window.jQuery || window.Zepto || window) so that certain features are
	       accessible beyond just a per-element scope. This master object contains an .animate() method, which is later assigned to $.fn
	       (if jQuery or Zepto are present). Accordingly, Velocity can both act on wrapped DOM elements and stand alone for targeting raw DOM elements. */
	    global.Velocity = Velocity;

	    if (global !== window) {
	        /* Assign the element function to Velocity's core animate() method. */
	        global.fn.velocity = animate;
	        /* Assign the object function's defaults to Velocity's global defaults object. */
	        global.fn.velocity.defaults = Velocity.defaults;
	    }

	    /***********************
	       Packaged Redirects
	    ***********************/

	    /* slideUp, slideDown */
	    $.each([ "Down", "Up" ], function(i, direction) {
	        Velocity.Redirects["slide" + direction] = function (element, options, elementsIndex, elementsSize, elements, promiseData) {
	            var opts = $.extend({}, options),
	                begin = opts.begin,
	                complete = opts.complete,
	                computedValues = { height: "", marginTop: "", marginBottom: "", paddingTop: "", paddingBottom: "" },
	                inlineValues = {};

	            if (opts.display === undefined) {
	                /* Show the element before slideDown begins and hide the element after slideUp completes. */
	                /* Note: Inline elements cannot have dimensions animated, so they're reverted to inline-block. */
	                opts.display = (direction === "Down" ? (Velocity.CSS.Values.getDisplayType(element) === "inline" ? "inline-block" : "block") : "none");
	            }

	            opts.begin = function() {
	                /* If the user passed in a begin callback, fire it now. */
	                begin && begin.call(elements, elements);

	                /* Cache the elements' original vertical dimensional property values so that we can animate back to them. */
	                for (var property in computedValues) {
	                    inlineValues[property] = element.style[property];

	                    /* For slideDown, use forcefeeding to animate all vertical properties from 0. For slideUp,
	                       use forcefeeding to start from computed values and animate down to 0. */
	                    var propertyValue = Velocity.CSS.getPropertyValue(element, property);
	                    computedValues[property] = (direction === "Down") ? [ propertyValue, 0 ] : [ 0, propertyValue ];
	                }

	                /* Force vertical overflow content to clip so that sliding works as expected. */
	                inlineValues.overflow = element.style.overflow;
	                element.style.overflow = "hidden";
	            }

	            opts.complete = function() {
	                /* Reset element to its pre-slide inline values once its slide animation is complete. */
	                for (var property in inlineValues) {
	                    element.style[property] = inlineValues[property];
	                }

	                /* If the user passed in a complete callback, fire it now. */
	                complete && complete.call(elements, elements);
	                promiseData && promiseData.resolver(elements);
	            };

	            Velocity(element, computedValues, opts);
	        };
	    });

	    /* fadeIn, fadeOut */
	    $.each([ "In", "Out" ], function(i, direction) {
	        Velocity.Redirects["fade" + direction] = function (element, options, elementsIndex, elementsSize, elements, promiseData) {
	            var opts = $.extend({}, options),
	                propertiesMap = { opacity: (direction === "In") ? 1 : 0 },
	                originalComplete = opts.complete;

	            /* Since redirects are triggered individually for each element in the animated set, avoid repeatedly triggering
	               callbacks by firing them only when the final element has been reached. */
	            if (elementsIndex !== elementsSize - 1) {
	                opts.complete = opts.begin = null;
	            } else {
	                opts.complete = function() {
	                    if (originalComplete) {
	                        originalComplete.call(elements, elements);
	                    }

	                    promiseData && promiseData.resolver(elements);
	                }
	            }

	            /* If a display was passed in, use it. Otherwise, default to "none" for fadeOut or the element-specific default for fadeIn. */
	            /* Note: We allow users to pass in "null" to skip display setting altogether. */
	            if (opts.display === undefined) {
	                opts.display = (direction === "In" ? "auto" : "none");
	            }

	            Velocity(this, propertiesMap, opts);
	        };
	    });

	    return Velocity;
	}((window.jQuery || window.Zepto || window), window, document);
	}));

	/******************
	   Known Issues
	******************/

	/* The CSS spec mandates that the translateX/Y/Z transforms are %-relative to the element itself -- not its parent.
	Velocity, however, doesn't make this distinction. Thus, converting to or from the % unit with these subproperties
	will produce an inaccurate conversion value. The same issue exists with the cx/cy attributes of SVG circles and ellipses. */

/***/ },
/* 4 */
/***/ function(module, exports) {

	var FlyoutFactory = module.exports = function(element) {
	  var padding = 10;
	  var hoverables = Array.prototype.slice.apply(element.querySelectorAll('[data-flyout]'));

	  hoverables.forEach(function(hoverable) {
	    var flyout = element.querySelector('#' + hoverable.getAttribute('data-flyout'));

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
/* 5 */
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
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var velocity = __webpack_require__(3);

	var mobileBreakpoint = 420;
	var animationDuration = 300;
	var animationEasing = [.645, .045, .355, 1];

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

	    window.addEventListener('resize', function(event) {
	      var modals = Array.prototype.slice.call(document.querySelectorAll('.modal:not(.modal-hidden)'));
	      modals.forEach(function(modal) {
	        this.reposition(modal.querySelector('.modal-container'));
	      }.bind(this));
	    }.bind(this));
	  },

	  open: function(event) {
	    var modal = event.target.getAttribute('data-modal');
	    modal = this.root.querySelector('#' + modal);
	    modal.classList.remove('modal-hidden');

	    var windowWidth = document.body.offsetWidth;
	    var modalContainer = modal.querySelector('.modal-container');

	    if (windowWidth <= mobileBreakpoint) {
	      modalContainer.style.left = windowWidth + 'px';

	      velocity(modalContainer, {
	        left: 0
	      }, {
	        duration: animationDuration,
	        easing: animationEasing,
	        complete: function() {
	          document.body.style.overflow = 'hidden';
	        }
	      });
	    }

	    this.reposition(modalContainer);
	  },

	  dismiss: function(event) {
	    var self = this;
	    var target = event.target;

	    var closeable = target === event.currentTarget && target.classList.contains('modal-overlay');
	    var modal;

	    // Find the modal and figure out if it's closeable.
	    do {
	      if (target.hasAttribute('data-modal-dismiss') &&
	          !target.classList.contains('modal')) {
	        closeable = true;
	      } else if (target.classList.contains('modal')){
	        modal = target;
	        break;
	      }
	    } while((target = target.parentNode) !== self.root);

	    if (!modal) {
	      return;
	    }

	    function hideModal() {
	      document.body.style.overflow = '';

	      if (closeable) {
	        modal.classList.add('modal-hidden');
	      }
	    }

	    var windowWidth = document.body.offsetWidth;
	    var modalContainer = modal.querySelector('.modal-container');

	    if (windowWidth <= mobileBreakpoint) {
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

	  reposition: function(modal) {
	    if (modal.classList.contains('modal-hidden')) {
	      return;
	    }

	    var windowWidth = document.body.offsetWidth;

	    if (windowWidth >= mobileBreakpoint) {
	      modal.style.margin = '';
	      document.body.style.overflow = '';
	    } else {
	      modal.style.margin = 0;
	      document.body.style.overflow = 'hidden';
	    }
	  }
	};


/***/ },
/* 7 */
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
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var Shepherd = __webpack_require__(9);

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

	      if (that.currentTourName === null) {
	        return;
	      }

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
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*! tether-shepherd 1.2.0 */

	(function(root, factory) {
	  if (true) {
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(10)], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
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
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;/*! tether 1.2.2 */

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

	  if (typeof window !== 'undefined' && typeof window.addEventListener !== 'undefined') {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJzdHlsZWd1aWRlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcInN0eWxlZ3VpZGVcIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wic3R5bGVndWlkZVwiXSA9IGZhY3RvcnkoKTtcbn0pKHRoaXMsIGZ1bmN0aW9uKCkge1xucmV0dXJuIC8qKioqKiovIChmdW5jdGlvbihtb2R1bGVzKSB7IC8vIHdlYnBhY2tCb290c3RyYXBcbi8qKioqKiovIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuLyoqKioqKi8gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4vKioqKioqLyBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4vKioqKioqLyBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuLyoqKioqKi8gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuLyoqKioqKi8gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuLyoqKioqKi8gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbi8qKioqKiovIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuLyoqKioqKi8gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbi8qKioqKiovIFx0XHRcdGV4cG9ydHM6IHt9LFxuLyoqKioqKi8gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuLyoqKioqKi8gXHRcdFx0bG9hZGVkOiBmYWxzZVxuLyoqKioqKi8gXHRcdH07XG5cbi8qKioqKiovIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbi8qKioqKiovIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuLyoqKioqKi8gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbi8qKioqKiovIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuLyoqKioqKi8gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4vKioqKioqLyBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuLyoqKioqKi8gXHR9XG5cblxuLyoqKioqKi8gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4vKioqKioqLyBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbi8qKioqKiovIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuLyoqKioqKi8gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8qKioqKiovIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG4vKioqKioqLyB9KVxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKioqKiovIChbXG4vKiAwICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHR2YXIgU3R5bGVndWlkZSA9IHtcblx0ICBEcm9wZG93bkZhY3Rvcnk6IF9fd2VicGFja19yZXF1aXJlX18oMSksXG5cdCAgRmxhbm5lbEZhY3Rvcnk6IF9fd2VicGFja19yZXF1aXJlX18oMiksXG5cdCAgRmx5b3V0RmFjdG9yeTogX193ZWJwYWNrX3JlcXVpcmVfXyg0KSxcblx0ICBNZW51RmFjdG9yeTogX193ZWJwYWNrX3JlcXVpcmVfXyg1KSxcblx0ICBNb2RhbEZhY3Rvcnk6IF9fd2VicGFja19yZXF1aXJlX18oNiksXG5cdCAgVG9nZ2xlRmFjdG9yeTogX193ZWJwYWNrX3JlcXVpcmVfXyg3KSxcblx0ICBUb3VyRmFjdG9yeTogX193ZWJwYWNrX3JlcXVpcmVfXyg4KVxuXHR9O1xuXG5cdG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWxlbWVudCkge1xuXHQgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbigpIHtcblx0ICAgIG5ldyBTdHlsZWd1aWRlLkRyb3Bkb3duRmFjdG9yeShlbGVtZW50KTtcblx0ICAgIG5ldyBTdHlsZWd1aWRlLkZsYW5uZWxGYWN0b3J5KGVsZW1lbnQpO1xuXHQgICAgbmV3IFN0eWxlZ3VpZGUuRmx5b3V0RmFjdG9yeShlbGVtZW50KTtcblx0ICAgIG5ldyBTdHlsZWd1aWRlLk1lbnVGYWN0b3J5KGVsZW1lbnQpO1xuXHQgICAgbmV3IFN0eWxlZ3VpZGUuTW9kYWxGYWN0b3J5KGVsZW1lbnQpO1xuXHQgICAgbmV3IFN0eWxlZ3VpZGUuVG9nZ2xlRmFjdG9yeShlbGVtZW50KTtcblx0ICAgIG5ldyBTdHlsZWd1aWRlLlRvdXJGYWN0b3J5KGVsZW1lbnQpO1xuXHQgIH0pO1xuXG5cdCAgcmV0dXJuIFN0eWxlZ3VpZGU7XG5cdH07XG5cblxuLyoqKi8gfSxcbi8qIDEgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdHZhciBEcm9wZG93bkZhY3RvcnkgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICB0aGlzLmRyb3Bkb3ducyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtZHJvcGRvd25dJykpO1xuXHQgIHRoaXMuZHJvcGRvd25zLmZvckVhY2goZnVuY3Rpb24oZHJvcGRvd24pIHtcblx0ICAgIG5ldyBEcm9wZG93bihkcm9wZG93bik7XG5cdCAgfSk7XG5cdH1cblxuXHR2YXIgRHJvcGRvd24gPSBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgdGhpcy5kZCA9IGVsZW1lbnQ7XG5cdCAgdGhpcy5vcmllbnRhdGlvbiA9IHRoaXMuZGQuZ2V0QXR0cmlidXRlKCdkYXRhLW9yaWVudGF0aW9uJykgfHwgJ2JvdHRvbSc7XG5cdCAgdGhpcy5zZWxlY3RhYmxlID0gdGhpcy5kZC5oYXNBdHRyaWJ1dGUoJ2RhdGEtc2VsZWN0YWJsZScpO1xuXG5cdCAgdGhpcy5kZC5jbGFzc0xpc3QuYWRkKCdkcm9wZG93bi1vcmllbnRhdGlvbi0nICsgdGhpcy5vcmllbnRhdGlvbik7XG5cblx0ICB0aGlzLnBsYWNlaG9sZGVyID0gdGhpcy5kZC5xdWVyeVNlbGVjdG9yKCdzcGFuJyk7XG5cdCAgdGhpcy5vcHRzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodGhpcy5kZC5xdWVyeVNlbGVjdG9yQWxsKCcuZHJvcGRvd24tb3B0aW9ucyA+IGxpJykpO1xuXG5cdCAgdGhpcy5kZC5kYXRhc2V0LnZhbHVlID0gJyc7XG5cdCAgdGhpcy5kZC5kYXRhc2V0LmluZGV4ID0gLTE7XG5cblx0ICB0aGlzLmluaXRFdmVudHMoKTtcblx0fTtcblxuXHREcm9wZG93bi5wcm90b3R5cGUgPSB7XG5cdCAgaW5pdEV2ZW50czogZnVuY3Rpb24oKSB7XG5cdCAgICB2YXIgb2JqID0gdGhpcztcblx0ICAgIC8vIFJlcG9zaXRpb24gZHJvcGRvd24gaWYgaXQncyBuZWFyIHRoZSBlZGdlIG9mIHRoZSB3aW5kb3cgdG8gYXZvaWRcblx0ICAgIC8vIHRoZSBkcm9wZG93biBtYWtpbmcgdGhlIHdpbmRvdyBsYXJnZXIgdGhhbiB3ZSB3YW50ZWRcblx0ICAgIHBvc2l0aW9uRHJvcGRvd24oKTtcblxuXHQgICAgb2JqLmRkLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcblx0ICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdCAgICAgIHBvc2l0aW9uRHJvcGRvd24oKTtcblx0ICAgICAgb2JqLmRkLmNsYXNzTGlzdC50b2dnbGUoJ2FjdGl2ZScpO1xuXHQgICAgICByZXR1cm4gZmFsc2U7XG5cdCAgICB9KTtcblxuXHQgICAgaWYgKG9iai5zZWxlY3RhYmxlKSB7XG5cdCAgICAgIG9iai5vcHRzLmZvckVhY2goZnVuY3Rpb24ob3B0KSB7XG5cdCAgICAgICAgb3B0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcblx0ICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0ICAgICAgICAgIHZhciBub2RlID0gb3B0O1xuXHQgICAgICAgICAgdmFyIGluZGV4ID0gMDtcblxuXHQgICAgICAgICAgd2hpbGUgKChub2RlID0gbm9kZS5wcmV2aW91c0VsZW1lbnRTaWJsaW5nKSAhPT0gbnVsbCkge1xuXHQgICAgICAgICAgICBpbmRleCsrO1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBvYmouZGQuZGF0YXNldC52YWx1ZSA9IG9wdC50ZXh0Q29udGVudDtcblx0ICAgICAgICAgIG9iai5kZC5kYXRhc2V0LmluZGV4ID0gaW5kZXg7XG5cblx0ICAgICAgICAgIG9iai5wbGFjZWhvbGRlci5pbm5lckhUTUwgPSBvcHQuaW5uZXJUZXh0LnRyaW0oKTtcblxuXHQgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXHQgICAgICAgIH0pO1xuXHQgICAgICB9KTtcblx0ICAgIH1cblxuXHQgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0ICAgICAgdmFyIGRyb3Bkb3ducyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5kcm9wZG93bicpO1xuXHQgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRyb3Bkb3ducy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgIGRyb3Bkb3duc1tpXS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcblx0ICAgICAgfVxuXHQgICAgfSk7XG5cblx0ICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBmdW5jdGlvbigpIHtcblx0ICAgICAgcG9zaXRpb25Ecm9wZG93bigpO1xuXHQgICAgfSk7XG5cblx0ICAgIGZ1bmN0aW9uIHBvc2l0aW9uRHJvcGRvd24oKSB7XG5cdCAgICAgIHZhciBvcHRpb25zRWxlbWVudCA9IG9iai5kZC5xdWVyeVNlbGVjdG9yKCcuZHJvcGRvd24tb3B0aW9ucycpO1xuXHQgICAgICB2YXIgb3B0aW9uc0VsZW1lbnRXaWR0aCA9IG9wdGlvbnNFbGVtZW50Lm9mZnNldFdpZHRoO1xuXHQgICAgICB2YXIgd2luZG93V2lkdGggPSBkb2N1bWVudC5ib2R5Lm9mZnNldFdpZHRoO1xuXG5cdCAgICAgIC8vIEdldCBsZWZ0IHRvIGNoZWNrIGlmIHRoZSBkcm9wZG93biBvcHRpb25zIGFyZSBoYW5naW5nIG9mZiB0aGUgc2lkZSBvZiB0aGUgcGFnZVxuXHQgICAgICB2YXIgbm9kZSA9IG9wdGlvbnNFbGVtZW50O1xuXHQgICAgICB2YXIgbGVmdCA9IDA7XG5cblx0ICAgICAgZG8ge1xuXHQgICAgICAgIGxlZnQgKz0gbm9kZS5vZmZzZXRMZWZ0O1xuXHQgICAgICB9IHdoaWxlICgobm9kZSA9IG5vZGUub2Zmc2V0UGFyZW50KSAhPT0gbnVsbCk7XG5cblx0ICAgICAgLy8gVXBkYXRlIGRyb3Bkb3duIG9wdGlvbnMgcG9zaXRpb24gaWYgbmVlZGVkXG5cdCAgICAgIGlmIChvcHRpb25zRWxlbWVudFdpZHRoICsgbGVmdCA+PSB3aW5kb3dXaWR0aCB8fCBvcHRpb25zRWxlbWVudC5zdHlsZS5sZWZ0KSB7XG5cdCAgICAgICAgdmFyIGRyb3Bkb3duV2lkdGggPSBvYmouZGQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGg7XG5cdCAgICAgICAgb3B0aW9uc0VsZW1lbnQuc3R5bGUubGVmdCA9IC0ob3B0aW9uc0VsZW1lbnRXaWR0aCAtIGRyb3Bkb3duV2lkdGgpICsgJ3B4Jztcblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH1cblx0fVxuXG5cbi8qKiovIH0sXG4vKiAyICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHR2YXIgdmVsb2NpdHkgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXG5cdHZhciBGbGFubmVsRmFjdG9yeSA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWxlbWVudCkge1xuXHQgIHZhciBtb2JpbGVCcmVha3BvaW50ID0gNDIwO1xuXHQgIHZhciBhbmltYXRpb25EdXJhdGlvbiA9IDMwMDtcblx0ICB2YXIgYW5pbWF0aW9uRWFzaW5nID0gWy42NDUsIC4wNDUsIC4zNTUsIDFdO1xuXHQgIHZhciBwYWRkaW5nID0gMTA7XG5cdCAgdmFyIGhvdmVyYWJsZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtZmxhbm5lbF0nKSk7XG5cblx0ICBmdW5jdGlvbiBoaWRlRmxhbm5lbChmbGFubmVsLCBob3ZlcmFibGUpIHtcblx0ICAgIGlmIChkb2N1bWVudC5ib2R5Lm9mZnNldFdpZHRoIDwgbW9iaWxlQnJlYWtwb2ludCkge1xuXHQgICAgICB2ZWxvY2l0eShmbGFubmVsLCB7XG5cdCAgICAgICAgbGVmdDogZG9jdW1lbnQuYm9keS5vZmZzZXRXaWR0aFxuXHQgICAgICB9LCB7XG5cdCAgICAgICAgZHVyYXRpb246IGFuaW1hdGlvbkR1cmF0aW9uLFxuXHQgICAgICAgIGVhc2luZzogYW5pbWF0aW9uRWFzaW5nLFxuXHQgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgIGZsYW5uZWwuY2xhc3NMaXN0LmFkZCgnZmxhbm5lbC1oaWRkZW4nKTtcblx0ICAgICAgICAgIGhvdmVyYWJsZS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcblx0ICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnJztcblx0ICAgICAgICB9XG5cdCAgICAgIH0pO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgZmxhbm5lbC5jbGFzc0xpc3QuYWRkKCdmbGFubmVsLWhpZGRlbicpO1xuXHQgICAgICBob3ZlcmFibGUuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG5cdCAgICB9XG5cdCAgfVxuXG5cdCAgZnVuY3Rpb24gcG9zaXRpb25GbGFubmVsKGZsYW5uZWwsIGhvdmVyYWJsZSkge1xuXHQgICAgdmFyIG5vZGUgPSBob3ZlcmFibGU7XG5cdCAgICB2YXIgbGVmdCA9IDA7XG5cdCAgICB2YXIgdG9wID0gMDtcblx0ICAgIHZhciBmbGFubmVsV2lkdGggPSBmbGFubmVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoO1xuXHQgICAgdmFyIHdpbmRvd1dpZHRoID0gZG9jdW1lbnQuYm9keS5vZmZzZXRXaWR0aDtcblxuXHQgICAgZG8ge1xuXHQgICAgICBsZWZ0ICs9IG5vZGUub2Zmc2V0TGVmdDtcblx0ICAgICAgdG9wICs9IG5vZGUub2Zmc2V0VG9wO1xuXHQgICAgfSB3aGlsZSAoKG5vZGUgPSBub2RlLm9mZnNldFBhcmVudCkgIT09IG51bGwpO1xuXG5cdCAgICBsZWZ0ID0gbGVmdCArIGhvdmVyYWJsZS5vZmZzZXRXaWR0aCAvIDI7XG5cdCAgICB0b3AgPSB0b3AgKyBob3ZlcmFibGUub2Zmc2V0SGVpZ2h0ICsgcGFkZGluZztcblxuXHQgICAgaWYgKGxlZnQgKyBmbGFubmVsV2lkdGggPiB3aW5kb3dXaWR0aCAmJiB3aW5kb3dXaWR0aCA+PSBtb2JpbGVCcmVha3BvaW50KSB7XG5cdCAgICAgIGZsYW5uZWwuY2xhc3NMaXN0LnJlbW92ZSgnZmxhbm5lbC1yaWdodCcpO1xuXHQgICAgICBmbGFubmVsLmNsYXNzTGlzdC5hZGQoJ2ZsYW5uZWwtbGVmdCcpO1xuXHQgICAgICBsZWZ0IC09IGZsYW5uZWxXaWR0aDtcblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgIGZsYW5uZWwuY2xhc3NMaXN0LnJlbW92ZSgnZmxhbm5lbC1sZWZ0Jyk7XG5cdCAgICAgIGZsYW5uZWwuY2xhc3NMaXN0LmFkZCgnZmxhbm5lbC1yaWdodCcpO1xuXHQgICAgfVxuXG5cdCAgICBpZiAod2luZG93V2lkdGggPj0gbW9iaWxlQnJlYWtwb2ludCkge1xuXHQgICAgICBmbGFubmVsLnN0eWxlLmxlZnQgPSBsZWZ0ICsgJ3B4Jztcblx0ICAgICAgZmxhbm5lbC5zdHlsZS50b3AgPSB0b3AgKyAncHgnO1xuXHQgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLm92ZXJmbG93ID0gJyc7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICBmbGFubmVsLnN0eWxlLmxlZnQgPSB3aW5kb3dXaWR0aCArICdweCc7XG5cdCAgICAgIGZsYW5uZWwuc3R5bGUudG9wID0gMDtcblx0ICAgICAgdmVsb2NpdHkoZmxhbm5lbCwge1xuXHQgICAgICAgIGxlZnQ6IDBcblx0ICAgICAgfSwge1xuXHQgICAgICAgIGR1cmF0aW9uOiBhbmltYXRpb25EdXJhdGlvbixcblx0ICAgICAgICBlYXNpbmc6IGFuaW1hdGlvbkVhc2luZyxcblx0ICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG5cdCAgICAgICAgfVxuXHQgICAgICB9KTtcblx0ICAgIH1cblx0ICB9XG5cblx0ICBob3ZlcmFibGVzLmZvckVhY2goZnVuY3Rpb24oaG92ZXJhYmxlKSB7XG5cdCAgICB2YXIgZmxhbm5lbElkID0gaG92ZXJhYmxlLmdldEF0dHJpYnV0ZSgnZGF0YS1mbGFubmVsJyk7XG5cdCAgICB2YXIgZmxhbm5lbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnICsgZmxhbm5lbElkKTtcblx0ICAgIHZhciBkaXNtaXNzYWxzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGZsYW5uZWwucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtZmxhbm5lbC1kaXNtaXNzXScpKTtcblxuXHQgICAgZGlzbWlzc2Fscy5mb3JFYWNoKGZ1bmN0aW9uKGRpc21pc3NhbCkge1xuXHQgICAgICBkaXNtaXNzYWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0ICAgICAgICBoaWRlRmxhbm5lbChmbGFubmVsLCBob3ZlcmFibGUpO1xuXHQgICAgICB9KTtcblx0ICAgIH0pO1xuXG5cdCAgICBob3ZlcmFibGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuXHQgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuXHQgICAgICBmbGFubmVsLmNsYXNzTGlzdC50b2dnbGUoJ2ZsYW5uZWwtaGlkZGVuJyk7XG5cdCAgICAgIHBvc2l0aW9uRmxhbm5lbChmbGFubmVsLCBob3ZlcmFibGUpO1xuXHQgICAgfSk7XG5cblx0ICAgIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuXHQgICAgICBpZiAoZmxhbm5lbC5jbGFzc0xpc3QuY29udGFpbnMoJ2ZsYW5uZWwtaGlkZGVuJykpIHtcblx0ICAgICAgICByZXR1cm47XG5cdCAgICAgIH1cblxuXHQgICAgICB2YXIgbm9kZSA9IGV2ZW50LnRhcmdldDtcblxuXHQgICAgICB3aGlsZSAobm9kZS5wYXJlbnRFbGVtZW50KSB7XG5cdCAgICAgICAgaWYgKG5vZGUuaWQgPT09IGZsYW5uZWxJZCkge1xuXHQgICAgICAgICAgcmV0dXJuO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIG5vZGUgPSBub2RlLnBhcmVudEVsZW1lbnQ7XG5cdCAgICAgIH1cblxuXHQgICAgICBoaWRlRmxhbm5lbChmbGFubmVsLCBob3ZlcmFibGUpO1xuXHQgICAgfSk7XG5cblx0ICAgIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBmdW5jdGlvbihldmVudCkge1xuXHQgICAgICB2YXIga2V5ID0gZXZlbnQud2hpY2ggfHwgZXZlbnQua2V5Q29kZTtcblxuXHQgICAgICAvLyBFU0Ncblx0ICAgICAgaWYgKGtleSA9PT0gMjcpIHtcblx0ICAgICAgICBoaWRlRmxhbm5lbChmbGFubmVsLCBob3ZlcmFibGUpO1xuXHQgICAgICB9XG5cdCAgICB9KTtcblxuXHQgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGZ1bmN0aW9uKCkge1xuXHQgICAgICBpZiAoIWZsYW5uZWwuY2xhc3NMaXN0LmNvbnRhaW5zKCdmbGFubmVsLWhpZGRlbicpKSB7XG5cdCAgICAgICAgcG9zaXRpb25GbGFubmVsKGZsYW5uZWwsIGhvdmVyYWJsZSk7XG5cdCAgICAgIH1cblx0ICAgIH0pO1xuXG5cdCAgICBwb3NpdGlvbkZsYW5uZWwoZmxhbm5lbCwgaG92ZXJhYmxlKTtcblx0ICB9KTtcblx0fVxuXG5cbi8qKiovIH0sXG4vKiAzICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHR2YXIgX19XRUJQQUNLX0FNRF9ERUZJTkVfRkFDVE9SWV9fLCBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXzsvKiEgVmVsb2NpdHlKUy5vcmcgKDEuMi4zKS4gKEMpIDIwMTQgSnVsaWFuIFNoYXBpcm8uIE1JVCBAbGljZW5zZTogZW4ud2lraXBlZGlhLm9yZy93aWtpL01JVF9MaWNlbnNlICovXG5cblx0LyoqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgVmVsb2NpdHkgalF1ZXJ5IFNoaW1cblx0KioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQvKiEgVmVsb2NpdHlKUy5vcmcgalF1ZXJ5IFNoaW0gKDEuMC4xKS4gKEMpIDIwMTQgVGhlIGpRdWVyeSBGb3VuZGF0aW9uLiBNSVQgQGxpY2Vuc2U6IGVuLndpa2lwZWRpYS5vcmcvd2lraS9NSVRfTGljZW5zZS4gKi9cblxuXHQvKiBUaGlzIGZpbGUgY29udGFpbnMgdGhlIGpRdWVyeSBmdW5jdGlvbnMgdGhhdCBWZWxvY2l0eSByZWxpZXMgb24sIHRoZXJlYnkgcmVtb3ZpbmcgVmVsb2NpdHkncyBkZXBlbmRlbmN5IG9uIGEgZnVsbCBjb3B5IG9mIGpRdWVyeSwgYW5kIGFsbG93aW5nIGl0IHRvIHdvcmsgaW4gYW55IGVudmlyb25tZW50LiAqL1xuXHQvKiBUaGVzZSBzaGltbWVkIGZ1bmN0aW9ucyBhcmUgb25seSB1c2VkIGlmIGpRdWVyeSBpc24ndCBwcmVzZW50LiBJZiBib3RoIHRoaXMgc2hpbSBhbmQgalF1ZXJ5IGFyZSBsb2FkZWQsIFZlbG9jaXR5IGRlZmF1bHRzIHRvIGpRdWVyeSBwcm9wZXIuICovXG5cdC8qIEJyb3dzZXIgc3VwcG9ydDogVXNpbmcgdGhpcyBzaGltIGluc3RlYWQgb2YgalF1ZXJ5IHByb3BlciByZW1vdmVzIHN1cHBvcnQgZm9yIElFOC4gKi9cblxuXHQ7KGZ1bmN0aW9uICh3aW5kb3cpIHtcblx0ICAgIC8qKioqKioqKioqKioqKipcblx0ICAgICAgICAgU2V0dXBcblx0ICAgICoqKioqKioqKioqKioqKi9cblxuXHQgICAgLyogSWYgalF1ZXJ5IGlzIGFscmVhZHkgbG9hZGVkLCB0aGVyZSdzIG5vIHBvaW50IGluIGxvYWRpbmcgdGhpcyBzaGltLiAqL1xuXHQgICAgaWYgKHdpbmRvdy5qUXVlcnkpIHtcblx0ICAgICAgICByZXR1cm47XG5cdCAgICB9XG5cblx0ICAgIC8qIGpRdWVyeSBiYXNlLiAqL1xuXHQgICAgdmFyICQgPSBmdW5jdGlvbiAoc2VsZWN0b3IsIGNvbnRleHQpIHtcblx0ICAgICAgICByZXR1cm4gbmV3ICQuZm4uaW5pdChzZWxlY3RvciwgY29udGV4dCk7XG5cdCAgICB9O1xuXG5cdCAgICAvKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgIFByaXZhdGUgTWV0aG9kc1xuXHQgICAgKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgIC8qIGpRdWVyeSAqL1xuXHQgICAgJC5pc1dpbmRvdyA9IGZ1bmN0aW9uIChvYmopIHtcblx0ICAgICAgICAvKiBqc2hpbnQgZXFlcWVxOiBmYWxzZSAqL1xuXHQgICAgICAgIHJldHVybiBvYmogIT0gbnVsbCAmJiBvYmogPT0gb2JqLndpbmRvdztcblx0ICAgIH07XG5cblx0ICAgIC8qIGpRdWVyeSAqL1xuXHQgICAgJC50eXBlID0gZnVuY3Rpb24gKG9iaikge1xuXHQgICAgICAgIGlmIChvYmogPT0gbnVsbCkge1xuXHQgICAgICAgICAgICByZXR1cm4gb2JqICsgXCJcIjtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gdHlwZW9mIG9iaiA9PT0gXCJvYmplY3RcIiB8fCB0eXBlb2Ygb2JqID09PSBcImZ1bmN0aW9uXCIgP1xuXHQgICAgICAgICAgICBjbGFzczJ0eXBlW3RvU3RyaW5nLmNhbGwob2JqKV0gfHwgXCJvYmplY3RcIiA6XG5cdCAgICAgICAgICAgIHR5cGVvZiBvYmo7XG5cdCAgICB9O1xuXG5cdCAgICAvKiBqUXVlcnkgKi9cblx0ICAgICQuaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKG9iaikge1xuXHQgICAgICAgIHJldHVybiAkLnR5cGUob2JqKSA9PT0gXCJhcnJheVwiO1xuXHQgICAgfTtcblxuXHQgICAgLyogalF1ZXJ5ICovXG5cdCAgICBmdW5jdGlvbiBpc0FycmF5bGlrZSAob2JqKSB7XG5cdCAgICAgICAgdmFyIGxlbmd0aCA9IG9iai5sZW5ndGgsXG5cdCAgICAgICAgICAgIHR5cGUgPSAkLnR5cGUob2JqKTtcblxuXHQgICAgICAgIGlmICh0eXBlID09PSBcImZ1bmN0aW9uXCIgfHwgJC5pc1dpbmRvdyhvYmopKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAob2JqLm5vZGVUeXBlID09PSAxICYmIGxlbmd0aCkge1xuXHQgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gdHlwZSA9PT0gXCJhcnJheVwiIHx8IGxlbmd0aCA9PT0gMCB8fCB0eXBlb2YgbGVuZ3RoID09PSBcIm51bWJlclwiICYmIGxlbmd0aCA+IDAgJiYgKGxlbmd0aCAtIDEpIGluIG9iajtcblx0ICAgIH1cblxuXHQgICAgLyoqKioqKioqKioqKioqKlxuXHQgICAgICAgJCBNZXRob2RzXG5cdCAgICAqKioqKioqKioqKioqKiovXG5cblx0ICAgIC8qIGpRdWVyeTogU3VwcG9ydCByZW1vdmVkIGZvciBJRTw5LiAqL1xuXHQgICAgJC5pc1BsYWluT2JqZWN0ID0gZnVuY3Rpb24gKG9iaikge1xuXHQgICAgICAgIHZhciBrZXk7XG5cblx0ICAgICAgICBpZiAoIW9iaiB8fCAkLnR5cGUob2JqKSAhPT0gXCJvYmplY3RcIiB8fCBvYmoubm9kZVR5cGUgfHwgJC5pc1dpbmRvdyhvYmopKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICBpZiAob2JqLmNvbnN0cnVjdG9yICYmXG5cdCAgICAgICAgICAgICAgICAhaGFzT3duLmNhbGwob2JqLCBcImNvbnN0cnVjdG9yXCIpICYmXG5cdCAgICAgICAgICAgICAgICAhaGFzT3duLmNhbGwob2JqLmNvbnN0cnVjdG9yLnByb3RvdHlwZSwgXCJpc1Byb3RvdHlwZU9mXCIpKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9IGNhdGNoIChlKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBmb3IgKGtleSBpbiBvYmopIHt9XG5cblx0ICAgICAgICByZXR1cm4ga2V5ID09PSB1bmRlZmluZWQgfHwgaGFzT3duLmNhbGwob2JqLCBrZXkpO1xuXHQgICAgfTtcblxuXHQgICAgLyogalF1ZXJ5ICovXG5cdCAgICAkLmVhY2ggPSBmdW5jdGlvbihvYmosIGNhbGxiYWNrLCBhcmdzKSB7XG5cdCAgICAgICAgdmFyIHZhbHVlLFxuXHQgICAgICAgICAgICBpID0gMCxcblx0ICAgICAgICAgICAgbGVuZ3RoID0gb2JqLmxlbmd0aCxcblx0ICAgICAgICAgICAgaXNBcnJheSA9IGlzQXJyYXlsaWtlKG9iaik7XG5cblx0ICAgICAgICBpZiAoYXJncykge1xuXHQgICAgICAgICAgICBpZiAoaXNBcnJheSkge1xuXHQgICAgICAgICAgICAgICAgZm9yICg7IGkgPCBsZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gY2FsbGJhY2suYXBwbHkob2JqW2ldLCBhcmdzKTtcblxuXHQgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgZm9yIChpIGluIG9iaikge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gY2FsbGJhY2suYXBwbHkob2JqW2ldLCBhcmdzKTtcblxuXHQgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICBpZiAoaXNBcnJheSkge1xuXHQgICAgICAgICAgICAgICAgZm9yICg7IGkgPCBsZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gY2FsbGJhY2suY2FsbChvYmpbaV0sIGksIG9ialtpXSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IGZhbHNlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIGZvciAoaSBpbiBvYmopIHtcblx0ICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGNhbGxiYWNrLmNhbGwob2JqW2ldLCBpLCBvYmpbaV0pO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBmYWxzZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gb2JqO1xuXHQgICAgfTtcblxuXHQgICAgLyogQ3VzdG9tICovXG5cdCAgICAkLmRhdGEgPSBmdW5jdGlvbiAobm9kZSwga2V5LCB2YWx1ZSkge1xuXHQgICAgICAgIC8qICQuZ2V0RGF0YSgpICovXG5cdCAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgdmFyIGlkID0gbm9kZVskLmV4cGFuZG9dLFxuXHQgICAgICAgICAgICAgICAgc3RvcmUgPSBpZCAmJiBjYWNoZVtpZF07XG5cblx0ICAgICAgICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gc3RvcmU7XG5cdCAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RvcmUpIHtcblx0ICAgICAgICAgICAgICAgIGlmIChrZXkgaW4gc3RvcmUpIHtcblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RvcmVba2V5XTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIC8qICQuc2V0RGF0YSgpICovXG5cdCAgICAgICAgfSBlbHNlIGlmIChrZXkgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICB2YXIgaWQgPSBub2RlWyQuZXhwYW5kb10gfHwgKG5vZGVbJC5leHBhbmRvXSA9ICsrJC51dWlkKTtcblxuXHQgICAgICAgICAgICBjYWNoZVtpZF0gPSBjYWNoZVtpZF0gfHwge307XG5cdCAgICAgICAgICAgIGNhY2hlW2lkXVtrZXldID0gdmFsdWU7XG5cblx0ICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuXHQgICAgICAgIH1cblx0ICAgIH07XG5cblx0ICAgIC8qIEN1c3RvbSAqL1xuXHQgICAgJC5yZW1vdmVEYXRhID0gZnVuY3Rpb24gKG5vZGUsIGtleXMpIHtcblx0ICAgICAgICB2YXIgaWQgPSBub2RlWyQuZXhwYW5kb10sXG5cdCAgICAgICAgICAgIHN0b3JlID0gaWQgJiYgY2FjaGVbaWRdO1xuXG5cdCAgICAgICAgaWYgKHN0b3JlKSB7XG5cdCAgICAgICAgICAgICQuZWFjaChrZXlzLCBmdW5jdGlvbihfLCBrZXkpIHtcblx0ICAgICAgICAgICAgICAgIGRlbGV0ZSBzdG9yZVtrZXldO1xuXHQgICAgICAgICAgICB9KTtcblx0ICAgICAgICB9XG5cdCAgICB9O1xuXG5cdCAgICAvKiBqUXVlcnkgKi9cblx0ICAgICQuZXh0ZW5kID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgIHZhciBzcmMsIGNvcHlJc0FycmF5LCBjb3B5LCBuYW1lLCBvcHRpb25zLCBjbG9uZSxcblx0ICAgICAgICAgICAgdGFyZ2V0ID0gYXJndW1lbnRzWzBdIHx8IHt9LFxuXHQgICAgICAgICAgICBpID0gMSxcblx0ICAgICAgICAgICAgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aCxcblx0ICAgICAgICAgICAgZGVlcCA9IGZhbHNlO1xuXG5cdCAgICAgICAgaWYgKHR5cGVvZiB0YXJnZXQgPT09IFwiYm9vbGVhblwiKSB7XG5cdCAgICAgICAgICAgIGRlZXAgPSB0YXJnZXQ7XG5cblx0ICAgICAgICAgICAgdGFyZ2V0ID0gYXJndW1lbnRzW2ldIHx8IHt9O1xuXHQgICAgICAgICAgICBpKys7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKHR5cGVvZiB0YXJnZXQgIT09IFwib2JqZWN0XCIgJiYgJC50eXBlKHRhcmdldCkgIT09IFwiZnVuY3Rpb25cIikge1xuXHQgICAgICAgICAgICB0YXJnZXQgPSB7fTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAoaSA9PT0gbGVuZ3RoKSB7XG5cdCAgICAgICAgICAgIHRhcmdldCA9IHRoaXM7XG5cdCAgICAgICAgICAgIGktLTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBmb3IgKDsgaSA8IGxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgIGlmICgob3B0aW9ucyA9IGFyZ3VtZW50c1tpXSkgIT0gbnVsbCkge1xuXHQgICAgICAgICAgICAgICAgZm9yIChuYW1lIGluIG9wdGlvbnMpIHtcblx0ICAgICAgICAgICAgICAgICAgICBzcmMgPSB0YXJnZXRbbmFtZV07XG5cdCAgICAgICAgICAgICAgICAgICAgY29weSA9IG9wdGlvbnNbbmFtZV07XG5cblx0ICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0ID09PSBjb3B5KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIGlmIChkZWVwICYmIGNvcHkgJiYgKCQuaXNQbGFpbk9iamVjdChjb3B5KSB8fCAoY29weUlzQXJyYXkgPSAkLmlzQXJyYXkoY29weSkpKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29weUlzQXJyYXkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvcHlJc0FycmF5ID0gZmFsc2U7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZSA9IHNyYyAmJiAkLmlzQXJyYXkoc3JjKSA/IHNyYyA6IFtdO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZSA9IHNyYyAmJiAkLmlzUGxhaW5PYmplY3Qoc3JjKSA/IHNyYyA6IHt9O1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0W25hbWVdID0gJC5leHRlbmQoZGVlcCwgY2xvbmUsIGNvcHkpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjb3B5ICE9PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0W25hbWVdID0gY29weTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gdGFyZ2V0O1xuXHQgICAgfTtcblxuXHQgICAgLyogalF1ZXJ5IDEuNC4zICovXG5cdCAgICAkLnF1ZXVlID0gZnVuY3Rpb24gKGVsZW0sIHR5cGUsIGRhdGEpIHtcblx0ICAgICAgICBmdW5jdGlvbiAkbWFrZUFycmF5IChhcnIsIHJlc3VsdHMpIHtcblx0ICAgICAgICAgICAgdmFyIHJldCA9IHJlc3VsdHMgfHwgW107XG5cblx0ICAgICAgICAgICAgaWYgKGFyciAhPSBudWxsKSB7XG5cdCAgICAgICAgICAgICAgICBpZiAoaXNBcnJheWxpa2UoT2JqZWN0KGFycikpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogJC5tZXJnZSAqL1xuXHQgICAgICAgICAgICAgICAgICAgIChmdW5jdGlvbihmaXJzdCwgc2Vjb25kKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsZW4gPSArc2Vjb25kLmxlbmd0aCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGogPSAwLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaSA9IGZpcnN0Lmxlbmd0aDtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaiA8IGxlbikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3RbaSsrXSA9IHNlY29uZFtqKytdO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxlbiAhPT0gbGVuKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAoc2Vjb25kW2pdICE9PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaXJzdFtpKytdID0gc2Vjb25kW2orK107XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICBmaXJzdC5sZW5ndGggPSBpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmaXJzdDtcblx0ICAgICAgICAgICAgICAgICAgICB9KShyZXQsIHR5cGVvZiBhcnIgPT09IFwic3RyaW5nXCIgPyBbYXJyXSA6IGFycik7XG5cdCAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIFtdLnB1c2guY2FsbChyZXQsIGFycik7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICByZXR1cm4gcmV0O1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmICghZWxlbSkge1xuXHQgICAgICAgICAgICByZXR1cm47XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdHlwZSA9ICh0eXBlIHx8IFwiZnhcIikgKyBcInF1ZXVlXCI7XG5cblx0ICAgICAgICB2YXIgcSA9ICQuZGF0YShlbGVtLCB0eXBlKTtcblxuXHQgICAgICAgIGlmICghZGF0YSkge1xuXHQgICAgICAgICAgICByZXR1cm4gcSB8fCBbXTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAoIXEgfHwgJC5pc0FycmF5KGRhdGEpKSB7XG5cdCAgICAgICAgICAgIHEgPSAkLmRhdGEoZWxlbSwgdHlwZSwgJG1ha2VBcnJheShkYXRhKSk7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgcS5wdXNoKGRhdGEpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiBxO1xuXHQgICAgfTtcblxuXHQgICAgLyogalF1ZXJ5IDEuNC4zICovXG5cdCAgICAkLmRlcXVldWUgPSBmdW5jdGlvbiAoZWxlbXMsIHR5cGUpIHtcblx0ICAgICAgICAvKiBDdXN0b206IEVtYmVkIGVsZW1lbnQgaXRlcmF0aW9uLiAqL1xuXHQgICAgICAgICQuZWFjaChlbGVtcy5ub2RlVHlwZSA/IFsgZWxlbXMgXSA6IGVsZW1zLCBmdW5jdGlvbihpLCBlbGVtKSB7XG5cdCAgICAgICAgICAgIHR5cGUgPSB0eXBlIHx8IFwiZnhcIjtcblxuXHQgICAgICAgICAgICB2YXIgcXVldWUgPSAkLnF1ZXVlKGVsZW0sIHR5cGUpLFxuXHQgICAgICAgICAgICAgICAgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuXG5cdCAgICAgICAgICAgIGlmIChmbiA9PT0gXCJpbnByb2dyZXNzXCIpIHtcblx0ICAgICAgICAgICAgICAgIGZuID0gcXVldWUuc2hpZnQoKTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIGlmIChmbikge1xuXHQgICAgICAgICAgICAgICAgaWYgKHR5cGUgPT09IFwiZnhcIikge1xuXHQgICAgICAgICAgICAgICAgICAgIHF1ZXVlLnVuc2hpZnQoXCJpbnByb2dyZXNzXCIpO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICBmbi5jYWxsKGVsZW0sIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICAgICAgICAgICQuZGVxdWV1ZShlbGVtLCB0eXBlKTtcblx0ICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSk7XG5cdCAgICB9O1xuXG5cdCAgICAvKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAkLmZuIE1ldGhvZHNcblx0ICAgICoqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgLyogalF1ZXJ5ICovXG5cdCAgICAkLmZuID0gJC5wcm90b3R5cGUgPSB7XG5cdCAgICAgICAgaW5pdDogZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG5cdCAgICAgICAgICAgIC8qIEp1c3QgcmV0dXJuIHRoZSBlbGVtZW50IHdyYXBwZWQgaW5zaWRlIGFuIGFycmF5OyBkb24ndCBwcm9jZWVkIHdpdGggdGhlIGFjdHVhbCBqUXVlcnkgbm9kZSB3cmFwcGluZyBwcm9jZXNzLiAqL1xuXHQgICAgICAgICAgICBpZiAoc2VsZWN0b3Iubm9kZVR5cGUpIHtcblx0ICAgICAgICAgICAgICAgIHRoaXNbMF0gPSBzZWxlY3RvcjtcblxuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgYSBET00gbm9kZS5cIik7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgb2Zmc2V0OiBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgIC8qIGpRdWVyeSBhbHRlcmVkIGNvZGU6IERyb3BwZWQgZGlzY29ubmVjdGVkIERPTSBub2RlIGNoZWNraW5nLiAqL1xuXHQgICAgICAgICAgICB2YXIgYm94ID0gdGhpc1swXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QgPyB0aGlzWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpIDogeyB0b3A6IDAsIGxlZnQ6IDAgfTtcblxuXHQgICAgICAgICAgICByZXR1cm4ge1xuXHQgICAgICAgICAgICAgICAgdG9wOiBib3gudG9wICsgKHdpbmRvdy5wYWdlWU9mZnNldCB8fCBkb2N1bWVudC5zY3JvbGxUb3AgIHx8IDApICAtIChkb2N1bWVudC5jbGllbnRUb3AgIHx8IDApLFxuXHQgICAgICAgICAgICAgICAgbGVmdDogYm94LmxlZnQgKyAod2luZG93LnBhZ2VYT2Zmc2V0IHx8IGRvY3VtZW50LnNjcm9sbExlZnQgIHx8IDApIC0gKGRvY3VtZW50LmNsaWVudExlZnQgfHwgMClcblx0ICAgICAgICAgICAgfTtcblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgcG9zaXRpb246IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgLyogalF1ZXJ5ICovXG5cdCAgICAgICAgICAgIGZ1bmN0aW9uIG9mZnNldFBhcmVudCgpIHtcblx0ICAgICAgICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnQgPSB0aGlzLm9mZnNldFBhcmVudCB8fCBkb2N1bWVudDtcblxuXHQgICAgICAgICAgICAgICAgd2hpbGUgKG9mZnNldFBhcmVudCAmJiAoIW9mZnNldFBhcmVudC5ub2RlVHlwZS50b0xvd2VyQ2FzZSA9PT0gXCJodG1sXCIgJiYgb2Zmc2V0UGFyZW50LnN0eWxlLnBvc2l0aW9uID09PSBcInN0YXRpY1wiKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIG9mZnNldFBhcmVudCA9IG9mZnNldFBhcmVudC5vZmZzZXRQYXJlbnQ7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIHJldHVybiBvZmZzZXRQYXJlbnQgfHwgZG9jdW1lbnQ7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvKiBaZXB0byAqL1xuXHQgICAgICAgICAgICB2YXIgZWxlbSA9IHRoaXNbMF0sXG5cdCAgICAgICAgICAgICAgICBvZmZzZXRQYXJlbnQgPSBvZmZzZXRQYXJlbnQuYXBwbHkoZWxlbSksXG5cdCAgICAgICAgICAgICAgICBvZmZzZXQgPSB0aGlzLm9mZnNldCgpLFxuXHQgICAgICAgICAgICAgICAgcGFyZW50T2Zmc2V0ID0gL14oPzpib2R5fGh0bWwpJC9pLnRlc3Qob2Zmc2V0UGFyZW50Lm5vZGVOYW1lKSA/IHsgdG9wOiAwLCBsZWZ0OiAwIH0gOiAkKG9mZnNldFBhcmVudCkub2Zmc2V0KClcblxuXHQgICAgICAgICAgICBvZmZzZXQudG9wIC09IHBhcnNlRmxvYXQoZWxlbS5zdHlsZS5tYXJnaW5Ub3ApIHx8IDA7XG5cdCAgICAgICAgICAgIG9mZnNldC5sZWZ0IC09IHBhcnNlRmxvYXQoZWxlbS5zdHlsZS5tYXJnaW5MZWZ0KSB8fCAwO1xuXG5cdCAgICAgICAgICAgIGlmIChvZmZzZXRQYXJlbnQuc3R5bGUpIHtcblx0ICAgICAgICAgICAgICAgIHBhcmVudE9mZnNldC50b3AgKz0gcGFyc2VGbG9hdChvZmZzZXRQYXJlbnQuc3R5bGUuYm9yZGVyVG9wV2lkdGgpIHx8IDBcblx0ICAgICAgICAgICAgICAgIHBhcmVudE9mZnNldC5sZWZ0ICs9IHBhcnNlRmxvYXQob2Zmc2V0UGFyZW50LnN0eWxlLmJvcmRlckxlZnRXaWR0aCkgfHwgMFxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgcmV0dXJuIHtcblx0ICAgICAgICAgICAgICAgIHRvcDogb2Zmc2V0LnRvcCAtIHBhcmVudE9mZnNldC50b3AsXG5cdCAgICAgICAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdCAtIHBhcmVudE9mZnNldC5sZWZ0XG5cdCAgICAgICAgICAgIH07XG5cdCAgICAgICAgfVxuXHQgICAgfTtcblxuXHQgICAgLyoqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgIFByaXZhdGUgVmFyaWFibGVzXG5cdCAgICAqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAvKiBGb3IgJC5kYXRhKCkgKi9cblx0ICAgIHZhciBjYWNoZSA9IHt9O1xuXHQgICAgJC5leHBhbmRvID0gXCJ2ZWxvY2l0eVwiICsgKG5ldyBEYXRlKCkuZ2V0VGltZSgpKTtcblx0ICAgICQudXVpZCA9IDA7XG5cblx0ICAgIC8qIEZvciAkLnF1ZXVlKCkgKi9cblx0ICAgIHZhciBjbGFzczJ0eXBlID0ge30sXG5cdCAgICAgICAgaGFzT3duID0gY2xhc3MydHlwZS5oYXNPd25Qcm9wZXJ0eSxcblx0ICAgICAgICB0b1N0cmluZyA9IGNsYXNzMnR5cGUudG9TdHJpbmc7XG5cblx0ICAgIHZhciB0eXBlcyA9IFwiQm9vbGVhbiBOdW1iZXIgU3RyaW5nIEZ1bmN0aW9uIEFycmF5IERhdGUgUmVnRXhwIE9iamVjdCBFcnJvclwiLnNwbGl0KFwiIFwiKTtcblx0ICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHlwZXMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICBjbGFzczJ0eXBlW1wiW29iamVjdCBcIiArIHR5cGVzW2ldICsgXCJdXCJdID0gdHlwZXNbaV0udG9Mb3dlckNhc2UoKTtcblx0ICAgIH1cblxuXHQgICAgLyogTWFrZXMgJChub2RlKSBwb3NzaWJsZSwgd2l0aG91dCBoYXZpbmcgdG8gY2FsbCBpbml0LiAqL1xuXHQgICAgJC5mbi5pbml0LnByb3RvdHlwZSA9ICQuZm47XG5cblx0ICAgIC8qIEdsb2JhbGl6ZSBWZWxvY2l0eSBvbnRvIHRoZSB3aW5kb3csIGFuZCBhc3NpZ24gaXRzIFV0aWxpdGllcyBwcm9wZXJ0eS4gKi9cblx0ICAgIHdpbmRvdy5WZWxvY2l0eSA9IHsgVXRpbGl0aWVzOiAkIH07XG5cdH0pKHdpbmRvdyk7XG5cblx0LyoqKioqKioqKioqKioqKioqKlxuXHQgICAgVmVsb2NpdHkuanNcblx0KioqKioqKioqKioqKioqKioqL1xuXG5cdDsoZnVuY3Rpb24gKGZhY3RvcnkpIHtcblx0ICAgIC8qIENvbW1vbkpTIG1vZHVsZS4gKi9cblx0ICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyA9PT0gXCJvYmplY3RcIikge1xuXHQgICAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHQgICAgLyogQU1EIG1vZHVsZS4gKi9cblx0ICAgIH0gZWxzZSBpZiAodHJ1ZSkge1xuXHQgICAgICAgICEoX19XRUJQQUNLX0FNRF9ERUZJTkVfRkFDVE9SWV9fID0gKGZhY3RvcnkpLCBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXyA9ICh0eXBlb2YgX19XRUJQQUNLX0FNRF9ERUZJTkVfRkFDVE9SWV9fID09PSAnZnVuY3Rpb24nID8gKF9fV0VCUEFDS19BTURfREVGSU5FX0ZBQ1RPUllfXy5jYWxsKGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18sIGV4cG9ydHMsIG1vZHVsZSkpIDogX19XRUJQQUNLX0FNRF9ERUZJTkVfRkFDVE9SWV9fKSwgX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX18gIT09IHVuZGVmaW5lZCAmJiAobW9kdWxlLmV4cG9ydHMgPSBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXykpO1xuXHQgICAgLyogQnJvd3NlciBnbG9iYWxzLiAqL1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgICBmYWN0b3J5KCk7XG5cdCAgICB9XG5cdH0oZnVuY3Rpb24oKSB7XG5cdHJldHVybiBmdW5jdGlvbiAoZ2xvYmFsLCB3aW5kb3csIGRvY3VtZW50LCB1bmRlZmluZWQpIHtcblxuXHQgICAgLyoqKioqKioqKioqKioqKlxuXHQgICAgICAgIFN1bW1hcnlcblx0ICAgICoqKioqKioqKioqKioqKi9cblxuXHQgICAgLypcblx0ICAgIC0gQ1NTOiBDU1Mgc3RhY2sgdGhhdCB3b3JrcyBpbmRlcGVuZGVudGx5IGZyb20gdGhlIHJlc3Qgb2YgVmVsb2NpdHkuXG5cdCAgICAtIGFuaW1hdGUoKTogQ29yZSBhbmltYXRpb24gbWV0aG9kIHRoYXQgaXRlcmF0ZXMgb3ZlciB0aGUgdGFyZ2V0ZWQgZWxlbWVudHMgYW5kIHF1ZXVlcyB0aGUgaW5jb21pbmcgY2FsbCBvbnRvIGVhY2ggZWxlbWVudCBpbmRpdmlkdWFsbHkuXG5cdCAgICAgIC0gUHJlLVF1ZXVlaW5nOiBQcmVwYXJlIHRoZSBlbGVtZW50IGZvciBhbmltYXRpb24gYnkgaW5zdGFudGlhdGluZyBpdHMgZGF0YSBjYWNoZSBhbmQgcHJvY2Vzc2luZyB0aGUgY2FsbCdzIG9wdGlvbnMuXG5cdCAgICAgIC0gUXVldWVpbmc6IFRoZSBsb2dpYyB0aGF0IHJ1bnMgb25jZSB0aGUgY2FsbCBoYXMgcmVhY2hlZCBpdHMgcG9pbnQgb2YgZXhlY3V0aW9uIGluIHRoZSBlbGVtZW50J3MgJC5xdWV1ZSgpIHN0YWNrLlxuXHQgICAgICAgICAgICAgICAgICBNb3N0IGxvZ2ljIGlzIHBsYWNlZCBoZXJlIHRvIGF2b2lkIHJpc2tpbmcgaXQgYmVjb21pbmcgc3RhbGUgKGlmIHRoZSBlbGVtZW50J3MgcHJvcGVydGllcyBoYXZlIGNoYW5nZWQpLlxuXHQgICAgICAtIFB1c2hpbmc6IENvbnNvbGlkYXRpb24gb2YgdGhlIHR3ZWVuIGRhdGEgZm9sbG93ZWQgYnkgaXRzIHB1c2ggb250byB0aGUgZ2xvYmFsIGluLXByb2dyZXNzIGNhbGxzIGNvbnRhaW5lci5cblx0ICAgIC0gdGljaygpOiBUaGUgc2luZ2xlIHJlcXVlc3RBbmltYXRpb25GcmFtZSBsb29wIHJlc3BvbnNpYmxlIGZvciB0d2VlbmluZyBhbGwgaW4tcHJvZ3Jlc3MgY2FsbHMuXG5cdCAgICAtIGNvbXBsZXRlQ2FsbCgpOiBIYW5kbGVzIHRoZSBjbGVhbnVwIHByb2Nlc3MgZm9yIGVhY2ggVmVsb2NpdHkgY2FsbC5cblx0ICAgICovXG5cblx0ICAgIC8qKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgIEhlbHBlciBGdW5jdGlvbnNcblx0ICAgICoqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgLyogSUUgZGV0ZWN0aW9uLiBHaXN0OiBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9qdWxpYW5zaGFwaXJvLzkwOTg2MDkgKi9cblx0ICAgIHZhciBJRSA9IChmdW5jdGlvbigpIHtcblx0ICAgICAgICBpZiAoZG9jdW1lbnQuZG9jdW1lbnRNb2RlKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBkb2N1bWVudC5kb2N1bWVudE1vZGU7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgZm9yICh2YXIgaSA9IDc7IGkgPiA0OyBpLS0pIHtcblx0ICAgICAgICAgICAgICAgIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXG5cdCAgICAgICAgICAgICAgICBkaXYuaW5uZXJIVE1MID0gXCI8IS0tW2lmIElFIFwiICsgaSArIFwiXT48c3Bhbj48L3NwYW4+PCFbZW5kaWZdLS0+XCI7XG5cblx0ICAgICAgICAgICAgICAgIGlmIChkaXYuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzcGFuXCIpLmxlbmd0aCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGRpdiA9IG51bGw7XG5cblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gaTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG5cdCAgICB9KSgpO1xuXG5cdCAgICAvKiByQUYgc2hpbS4gR2lzdDogaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vanVsaWFuc2hhcGlyby85NDk3NTEzICovXG5cdCAgICB2YXIgckFGU2hpbSA9IChmdW5jdGlvbigpIHtcblx0ICAgICAgICB2YXIgdGltZUxhc3QgPSAwO1xuXG5cdCAgICAgICAgcmV0dXJuIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCBmdW5jdGlvbihjYWxsYmFjaykge1xuXHQgICAgICAgICAgICB2YXIgdGltZUN1cnJlbnQgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpLFxuXHQgICAgICAgICAgICAgICAgdGltZURlbHRhO1xuXG5cdCAgICAgICAgICAgIC8qIER5bmFtaWNhbGx5IHNldCBkZWxheSBvbiBhIHBlci10aWNrIGJhc2lzIHRvIG1hdGNoIDYwZnBzLiAqL1xuXHQgICAgICAgICAgICAvKiBUZWNobmlxdWUgYnkgRXJpayBNb2xsZXIuIE1JVCBsaWNlbnNlOiBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9wYXVsaXJpc2gvMTU3OTY3MSAqL1xuXHQgICAgICAgICAgICB0aW1lRGVsdGEgPSBNYXRoLm1heCgwLCAxNiAtICh0aW1lQ3VycmVudCAtIHRpbWVMYXN0KSk7XG5cdCAgICAgICAgICAgIHRpbWVMYXN0ID0gdGltZUN1cnJlbnQgKyB0aW1lRGVsdGE7XG5cblx0ICAgICAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKHRpbWVDdXJyZW50ICsgdGltZURlbHRhKTsgfSwgdGltZURlbHRhKTtcblx0ICAgICAgICB9O1xuXHQgICAgfSkoKTtcblxuXHQgICAgLyogQXJyYXkgY29tcGFjdGluZy4gQ29weXJpZ2h0IExvLURhc2guIE1JVCBMaWNlbnNlOiBodHRwczovL2dpdGh1Yi5jb20vbG9kYXNoL2xvZGFzaC9ibG9iL21hc3Rlci9MSUNFTlNFLnR4dCAqL1xuXHQgICAgZnVuY3Rpb24gY29tcGFjdFNwYXJzZUFycmF5IChhcnJheSkge1xuXHQgICAgICAgIHZhciBpbmRleCA9IC0xLFxuXHQgICAgICAgICAgICBsZW5ndGggPSBhcnJheSA/IGFycmF5Lmxlbmd0aCA6IDAsXG5cdCAgICAgICAgICAgIHJlc3VsdCA9IFtdO1xuXG5cdCAgICAgICAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcblx0ICAgICAgICAgICAgdmFyIHZhbHVlID0gYXJyYXlbaW5kZXhdO1xuXG5cdCAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuXHQgICAgICAgICAgICAgICAgcmVzdWx0LnB1c2godmFsdWUpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHJlc3VsdDtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gc2FuaXRpemVFbGVtZW50cyAoZWxlbWVudHMpIHtcblx0ICAgICAgICAvKiBVbndyYXAgalF1ZXJ5L1plcHRvIG9iamVjdHMuICovXG5cdCAgICAgICAgaWYgKFR5cGUuaXNXcmFwcGVkKGVsZW1lbnRzKSkge1xuXHQgICAgICAgICAgICBlbGVtZW50cyA9IFtdLnNsaWNlLmNhbGwoZWxlbWVudHMpO1xuXHQgICAgICAgIC8qIFdyYXAgYSBzaW5nbGUgZWxlbWVudCBpbiBhbiBhcnJheSBzbyB0aGF0ICQuZWFjaCgpIGNhbiBpdGVyYXRlIHdpdGggdGhlIGVsZW1lbnQgaW5zdGVhZCBvZiBpdHMgbm9kZSdzIGNoaWxkcmVuLiAqL1xuXHQgICAgICAgIH0gZWxzZSBpZiAoVHlwZS5pc05vZGUoZWxlbWVudHMpKSB7XG5cdCAgICAgICAgICAgIGVsZW1lbnRzID0gWyBlbGVtZW50cyBdO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiBlbGVtZW50cztcblx0ICAgIH1cblxuXHQgICAgdmFyIFR5cGUgPSB7XG5cdCAgICAgICAgaXNTdHJpbmc6IGZ1bmN0aW9uICh2YXJpYWJsZSkge1xuXHQgICAgICAgICAgICByZXR1cm4gKHR5cGVvZiB2YXJpYWJsZSA9PT0gXCJzdHJpbmdcIik7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICBpc0FycmF5OiBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uICh2YXJpYWJsZSkge1xuXHQgICAgICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhcmlhYmxlKSA9PT0gXCJbb2JqZWN0IEFycmF5XVwiO1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgaXNGdW5jdGlvbjogZnVuY3Rpb24gKHZhcmlhYmxlKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFyaWFibGUpID09PSBcIltvYmplY3QgRnVuY3Rpb25dXCI7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICBpc05vZGU6IGZ1bmN0aW9uICh2YXJpYWJsZSkge1xuXHQgICAgICAgICAgICByZXR1cm4gdmFyaWFibGUgJiYgdmFyaWFibGUubm9kZVR5cGU7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICAvKiBDb3B5cmlnaHQgTWFydGluIEJvaG0uIE1JVCBMaWNlbnNlOiBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9Ub21hbGFrLzgxOGE3OGEyMjZhMDczOGVhYWRlICovXG5cdCAgICAgICAgaXNOb2RlTGlzdDogZnVuY3Rpb24gKHZhcmlhYmxlKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB0eXBlb2YgdmFyaWFibGUgPT09IFwib2JqZWN0XCIgJiZcblx0ICAgICAgICAgICAgICAgIC9eXFxbb2JqZWN0IChIVE1MQ29sbGVjdGlvbnxOb2RlTGlzdHxPYmplY3QpXFxdJC8udGVzdChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFyaWFibGUpKSAmJlxuXHQgICAgICAgICAgICAgICAgdmFyaWFibGUubGVuZ3RoICE9PSB1bmRlZmluZWQgJiZcblx0ICAgICAgICAgICAgICAgICh2YXJpYWJsZS5sZW5ndGggPT09IDAgfHwgKHR5cGVvZiB2YXJpYWJsZVswXSA9PT0gXCJvYmplY3RcIiAmJiB2YXJpYWJsZVswXS5ub2RlVHlwZSA+IDApKTtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIC8qIERldGVybWluZSBpZiB2YXJpYWJsZSBpcyBhIHdyYXBwZWQgalF1ZXJ5IG9yIFplcHRvIGVsZW1lbnQuICovXG5cdCAgICAgICAgaXNXcmFwcGVkOiBmdW5jdGlvbiAodmFyaWFibGUpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHZhcmlhYmxlICYmICh2YXJpYWJsZS5qcXVlcnkgfHwgKHdpbmRvdy5aZXB0byAmJiB3aW5kb3cuWmVwdG8uemVwdG8uaXNaKHZhcmlhYmxlKSkpO1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgaXNTVkc6IGZ1bmN0aW9uICh2YXJpYWJsZSkge1xuXHQgICAgICAgICAgICByZXR1cm4gd2luZG93LlNWR0VsZW1lbnQgJiYgKHZhcmlhYmxlIGluc3RhbmNlb2Ygd2luZG93LlNWR0VsZW1lbnQpO1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgaXNFbXB0eU9iamVjdDogZnVuY3Rpb24gKHZhcmlhYmxlKSB7XG5cdCAgICAgICAgICAgIGZvciAodmFyIG5hbWUgaW4gdmFyaWFibGUpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXHQgICAgICAgIH1cblx0ICAgIH07XG5cblx0ICAgIC8qKioqKioqKioqKioqKioqKlxuXHQgICAgICAgRGVwZW5kZW5jaWVzXG5cdCAgICAqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgdmFyICQsXG5cdCAgICAgICAgaXNKUXVlcnkgPSBmYWxzZTtcblxuXHQgICAgaWYgKGdsb2JhbC5mbiAmJiBnbG9iYWwuZm4uanF1ZXJ5KSB7XG5cdCAgICAgICAgJCA9IGdsb2JhbDtcblx0ICAgICAgICBpc0pRdWVyeSA9IHRydWU7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICAgICQgPSB3aW5kb3cuVmVsb2NpdHkuVXRpbGl0aWVzO1xuXHQgICAgfVxuXG5cdCAgICBpZiAoSUUgPD0gOCAmJiAhaXNKUXVlcnkpIHtcblx0ICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJWZWxvY2l0eTogSUU4IGFuZCBiZWxvdyByZXF1aXJlIGpRdWVyeSB0byBiZSBsb2FkZWQgYmVmb3JlIFZlbG9jaXR5LlwiKTtcblx0ICAgIH0gZWxzZSBpZiAoSUUgPD0gNykge1xuXHQgICAgICAgIC8qIFJldmVydCB0byBqUXVlcnkncyAkLmFuaW1hdGUoKSwgYW5kIGxvc2UgVmVsb2NpdHkncyBleHRyYSBmZWF0dXJlcy4gKi9cblx0ICAgICAgICBqUXVlcnkuZm4udmVsb2NpdHkgPSBqUXVlcnkuZm4uYW5pbWF0ZTtcblxuXHQgICAgICAgIC8qIE5vdyB0aGF0ICQuZm4udmVsb2NpdHkgaXMgYWxpYXNlZCwgYWJvcnQgdGhpcyBWZWxvY2l0eSBkZWNsYXJhdGlvbi4gKi9cblx0ICAgICAgICByZXR1cm47XG5cdCAgICB9XG5cblx0ICAgIC8qKioqKioqKioqKioqKioqKlxuXHQgICAgICAgIENvbnN0YW50c1xuXHQgICAgKioqKioqKioqKioqKioqKiovXG5cblx0ICAgIHZhciBEVVJBVElPTl9ERUZBVUxUID0gNDAwLFxuXHQgICAgICAgIEVBU0lOR19ERUZBVUxUID0gXCJzd2luZ1wiO1xuXG5cdCAgICAvKioqKioqKioqKioqKlxuXHQgICAgICAgIFN0YXRlXG5cdCAgICAqKioqKioqKioqKioqL1xuXG5cdCAgICB2YXIgVmVsb2NpdHkgPSB7XG5cdCAgICAgICAgLyogQ29udGFpbmVyIGZvciBwYWdlLXdpZGUgVmVsb2NpdHkgc3RhdGUgZGF0YS4gKi9cblx0ICAgICAgICBTdGF0ZToge1xuXHQgICAgICAgICAgICAvKiBEZXRlY3QgbW9iaWxlIGRldmljZXMgdG8gZGV0ZXJtaW5lIGlmIG1vYmlsZUhBIHNob3VsZCBiZSB0dXJuZWQgb24uICovXG5cdCAgICAgICAgICAgIGlzTW9iaWxlOiAvQW5kcm9pZHx3ZWJPU3xpUGhvbmV8aVBhZHxpUG9kfEJsYWNrQmVycnl8SUVNb2JpbGV8T3BlcmEgTWluaS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCksXG5cdCAgICAgICAgICAgIC8qIFRoZSBtb2JpbGVIQSBvcHRpb24ncyBiZWhhdmlvciBjaGFuZ2VzIG9uIG9sZGVyIEFuZHJvaWQgZGV2aWNlcyAoR2luZ2VyYnJlYWQsIHZlcnNpb25zIDIuMy4zLTIuMy43KS4gKi9cblx0ICAgICAgICAgICAgaXNBbmRyb2lkOiAvQW5kcm9pZC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCksXG5cdCAgICAgICAgICAgIGlzR2luZ2VyYnJlYWQ6IC9BbmRyb2lkIDJcXC4zXFwuWzMtN10vaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpLFxuXHQgICAgICAgICAgICBpc0Nocm9tZTogd2luZG93LmNocm9tZSxcblx0ICAgICAgICAgICAgaXNGaXJlZm94OiAvRmlyZWZveC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCksXG5cdCAgICAgICAgICAgIC8qIENyZWF0ZSBhIGNhY2hlZCBlbGVtZW50IGZvciByZS11c2Ugd2hlbiBjaGVja2luZyBmb3IgQ1NTIHByb3BlcnR5IHByZWZpeGVzLiAqL1xuXHQgICAgICAgICAgICBwcmVmaXhFbGVtZW50OiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpLFxuXHQgICAgICAgICAgICAvKiBDYWNoZSBldmVyeSBwcmVmaXggbWF0Y2ggdG8gYXZvaWQgcmVwZWF0aW5nIGxvb2t1cHMuICovXG5cdCAgICAgICAgICAgIHByZWZpeE1hdGNoZXM6IHt9LFxuXHQgICAgICAgICAgICAvKiBDYWNoZSB0aGUgYW5jaG9yIHVzZWQgZm9yIGFuaW1hdGluZyB3aW5kb3cgc2Nyb2xsaW5nLiAqL1xuXHQgICAgICAgICAgICBzY3JvbGxBbmNob3I6IG51bGwsXG5cdCAgICAgICAgICAgIC8qIENhY2hlIHRoZSBicm93c2VyLXNwZWNpZmljIHByb3BlcnR5IG5hbWVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgc2Nyb2xsIGFuY2hvci4gKi9cblx0ICAgICAgICAgICAgc2Nyb2xsUHJvcGVydHlMZWZ0OiBudWxsLFxuXHQgICAgICAgICAgICBzY3JvbGxQcm9wZXJ0eVRvcDogbnVsbCxcblx0ICAgICAgICAgICAgLyogS2VlcCB0cmFjayBvZiB3aGV0aGVyIG91ciBSQUYgdGljayBpcyBydW5uaW5nLiAqL1xuXHQgICAgICAgICAgICBpc1RpY2tpbmc6IGZhbHNlLFxuXHQgICAgICAgICAgICAvKiBDb250YWluZXIgZm9yIGV2ZXJ5IGluLXByb2dyZXNzIGNhbGwgdG8gVmVsb2NpdHkuICovXG5cdCAgICAgICAgICAgIGNhbGxzOiBbXVxuXHQgICAgICAgIH0sXG5cdCAgICAgICAgLyogVmVsb2NpdHkncyBjdXN0b20gQ1NTIHN0YWNrLiBNYWRlIGdsb2JhbCBmb3IgdW5pdCB0ZXN0aW5nLiAqL1xuXHQgICAgICAgIENTUzogeyAvKiBEZWZpbmVkIGJlbG93LiAqLyB9LFxuXHQgICAgICAgIC8qIEEgc2hpbSBvZiB0aGUgalF1ZXJ5IHV0aWxpdHkgZnVuY3Rpb25zIHVzZWQgYnkgVmVsb2NpdHkgLS0gcHJvdmlkZWQgYnkgVmVsb2NpdHkncyBvcHRpb25hbCBqUXVlcnkgc2hpbS4gKi9cblx0ICAgICAgICBVdGlsaXRpZXM6ICQsXG5cdCAgICAgICAgLyogQ29udGFpbmVyIGZvciB0aGUgdXNlcidzIGN1c3RvbSBhbmltYXRpb24gcmVkaXJlY3RzIHRoYXQgYXJlIHJlZmVyZW5jZWQgYnkgbmFtZSBpbiBwbGFjZSBvZiB0aGUgcHJvcGVydGllcyBtYXAgYXJndW1lbnQuICovXG5cdCAgICAgICAgUmVkaXJlY3RzOiB7IC8qIE1hbnVhbGx5IHJlZ2lzdGVyZWQgYnkgdGhlIHVzZXIuICovIH0sXG5cdCAgICAgICAgRWFzaW5nczogeyAvKiBEZWZpbmVkIGJlbG93LiAqLyB9LFxuXHQgICAgICAgIC8qIEF0dGVtcHQgdG8gdXNlIEVTNiBQcm9taXNlcyBieSBkZWZhdWx0LiBVc2VycyBjYW4gb3ZlcnJpZGUgdGhpcyB3aXRoIGEgdGhpcmQtcGFydHkgcHJvbWlzZXMgbGlicmFyeS4gKi9cblx0ICAgICAgICBQcm9taXNlOiB3aW5kb3cuUHJvbWlzZSxcblx0ICAgICAgICAvKiBWZWxvY2l0eSBvcHRpb24gZGVmYXVsdHMsIHdoaWNoIGNhbiBiZSBvdmVycmlkZW4gYnkgdGhlIHVzZXIuICovXG5cdCAgICAgICAgZGVmYXVsdHM6IHtcblx0ICAgICAgICAgICAgcXVldWU6IFwiXCIsXG5cdCAgICAgICAgICAgIGR1cmF0aW9uOiBEVVJBVElPTl9ERUZBVUxULFxuXHQgICAgICAgICAgICBlYXNpbmc6IEVBU0lOR19ERUZBVUxULFxuXHQgICAgICAgICAgICBiZWdpbjogdW5kZWZpbmVkLFxuXHQgICAgICAgICAgICBjb21wbGV0ZTogdW5kZWZpbmVkLFxuXHQgICAgICAgICAgICBwcm9ncmVzczogdW5kZWZpbmVkLFxuXHQgICAgICAgICAgICBkaXNwbGF5OiB1bmRlZmluZWQsXG5cdCAgICAgICAgICAgIHZpc2liaWxpdHk6IHVuZGVmaW5lZCxcblx0ICAgICAgICAgICAgbG9vcDogZmFsc2UsXG5cdCAgICAgICAgICAgIGRlbGF5OiBmYWxzZSxcblx0ICAgICAgICAgICAgbW9iaWxlSEE6IHRydWUsXG5cdCAgICAgICAgICAgIC8qIEFkdmFuY2VkOiBTZXQgdG8gZmFsc2UgdG8gcHJldmVudCBwcm9wZXJ0eSB2YWx1ZXMgZnJvbSBiZWluZyBjYWNoZWQgYmV0d2VlbiBjb25zZWN1dGl2ZSBWZWxvY2l0eS1pbml0aWF0ZWQgY2hhaW4gY2FsbHMuICovXG5cdCAgICAgICAgICAgIF9jYWNoZVZhbHVlczogdHJ1ZVxuXHQgICAgICAgIH0sXG5cdCAgICAgICAgLyogQSBkZXNpZ24gZ29hbCBvZiBWZWxvY2l0eSBpcyB0byBjYWNoZSBkYXRhIHdoZXJldmVyIHBvc3NpYmxlIGluIG9yZGVyIHRvIGF2b2lkIERPTSByZXF1ZXJ5aW5nLiBBY2NvcmRpbmdseSwgZWFjaCBlbGVtZW50IGhhcyBhIGRhdGEgY2FjaGUuICovXG5cdCAgICAgICAgaW5pdDogZnVuY3Rpb24gKGVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgJC5kYXRhKGVsZW1lbnQsIFwidmVsb2NpdHlcIiwge1xuXHQgICAgICAgICAgICAgICAgLyogU3RvcmUgd2hldGhlciB0aGlzIGlzIGFuIFNWRyBlbGVtZW50LCBzaW5jZSBpdHMgcHJvcGVydGllcyBhcmUgcmV0cmlldmVkIGFuZCB1cGRhdGVkIGRpZmZlcmVudGx5IHRoYW4gc3RhbmRhcmQgSFRNTCBlbGVtZW50cy4gKi9cblx0ICAgICAgICAgICAgICAgIGlzU1ZHOiBUeXBlLmlzU1ZHKGVsZW1lbnQpLFxuXHQgICAgICAgICAgICAgICAgLyogS2VlcCB0cmFjayBvZiB3aGV0aGVyIHRoZSBlbGVtZW50IGlzIGN1cnJlbnRseSBiZWluZyBhbmltYXRlZCBieSBWZWxvY2l0eS5cblx0ICAgICAgICAgICAgICAgICAgIFRoaXMgaXMgdXNlZCB0byBlbnN1cmUgdGhhdCBwcm9wZXJ0eSB2YWx1ZXMgYXJlIG5vdCB0cmFuc2ZlcnJlZCBiZXR3ZWVuIG5vbi1jb25zZWN1dGl2ZSAoc3RhbGUpIGNhbGxzLiAqL1xuXHQgICAgICAgICAgICAgICAgaXNBbmltYXRpbmc6IGZhbHNlLFxuXHQgICAgICAgICAgICAgICAgLyogQSByZWZlcmVuY2UgdG8gdGhlIGVsZW1lbnQncyBsaXZlIGNvbXB1dGVkU3R5bGUgb2JqZWN0LiBMZWFybiBtb3JlIGhlcmU6IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL2RvY3MvV2ViL0FQSS93aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSAqL1xuXHQgICAgICAgICAgICAgICAgY29tcHV0ZWRTdHlsZTogbnVsbCxcblx0ICAgICAgICAgICAgICAgIC8qIFR3ZWVuIGRhdGEgaXMgY2FjaGVkIGZvciBlYWNoIGFuaW1hdGlvbiBvbiB0aGUgZWxlbWVudCBzbyB0aGF0IGRhdGEgY2FuIGJlIHBhc3NlZCBhY3Jvc3MgY2FsbHMgLS1cblx0ICAgICAgICAgICAgICAgICAgIGluIHBhcnRpY3VsYXIsIGVuZCB2YWx1ZXMgYXJlIHVzZWQgYXMgc3Vic2VxdWVudCBzdGFydCB2YWx1ZXMgaW4gY29uc2VjdXRpdmUgVmVsb2NpdHkgY2FsbHMuICovXG5cdCAgICAgICAgICAgICAgICB0d2VlbnNDb250YWluZXI6IG51bGwsXG5cdCAgICAgICAgICAgICAgICAvKiBUaGUgZnVsbCByb290IHByb3BlcnR5IHZhbHVlcyBvZiBlYWNoIENTUyBob29rIGJlaW5nIGFuaW1hdGVkIG9uIHRoaXMgZWxlbWVudCBhcmUgY2FjaGVkIHNvIHRoYXQ6XG5cdCAgICAgICAgICAgICAgICAgICAxKSBDb25jdXJyZW50bHktYW5pbWF0aW5nIGhvb2tzIHNoYXJpbmcgdGhlIHNhbWUgcm9vdCBjYW4gaGF2ZSB0aGVpciByb290IHZhbHVlcycgbWVyZ2VkIGludG8gb25lIHdoaWxlIHR3ZWVuaW5nLlxuXHQgICAgICAgICAgICAgICAgICAgMikgUG9zdC1ob29rLWluamVjdGlvbiByb290IHZhbHVlcyBjYW4gYmUgdHJhbnNmZXJyZWQgb3ZlciB0byBjb25zZWN1dGl2ZWx5IGNoYWluZWQgVmVsb2NpdHkgY2FsbHMgYXMgc3RhcnRpbmcgcm9vdCB2YWx1ZXMuICovXG5cdCAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZUNhY2hlOiB7fSxcblx0ICAgICAgICAgICAgICAgIC8qIEEgY2FjaGUgZm9yIHRyYW5zZm9ybSB1cGRhdGVzLCB3aGljaCBtdXN0IGJlIG1hbnVhbGx5IGZsdXNoZWQgdmlhIENTUy5mbHVzaFRyYW5zZm9ybUNhY2hlKCkuICovXG5cdCAgICAgICAgICAgICAgICB0cmFuc2Zvcm1DYWNoZToge31cblx0ICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICAvKiBBIHBhcmFsbGVsIHRvIGpRdWVyeSdzICQuY3NzKCksIHVzZWQgZm9yIGdldHRpbmcvc2V0dGluZyBWZWxvY2l0eSdzIGhvb2tlZCBDU1MgcHJvcGVydGllcy4gKi9cblx0ICAgICAgICBob29rOiBudWxsLCAvKiBEZWZpbmVkIGJlbG93LiAqL1xuXHQgICAgICAgIC8qIFZlbG9jaXR5LXdpZGUgYW5pbWF0aW9uIHRpbWUgcmVtYXBwaW5nIGZvciB0ZXN0aW5nIHB1cnBvc2VzLiAqL1xuXHQgICAgICAgIG1vY2s6IGZhbHNlLFxuXHQgICAgICAgIHZlcnNpb246IHsgbWFqb3I6IDEsIG1pbm9yOiAyLCBwYXRjaDogMiB9LFxuXHQgICAgICAgIC8qIFNldCB0byAxIG9yIDIgKG1vc3QgdmVyYm9zZSkgdG8gb3V0cHV0IGRlYnVnIGluZm8gdG8gY29uc29sZS4gKi9cblx0ICAgICAgICBkZWJ1ZzogZmFsc2Vcblx0ICAgIH07XG5cblx0ICAgIC8qIFJldHJpZXZlIHRoZSBhcHByb3ByaWF0ZSBzY3JvbGwgYW5jaG9yIGFuZCBwcm9wZXJ0eSBuYW1lIGZvciB0aGUgYnJvd3NlcjogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dpbmRvdy5zY3JvbGxZICovXG5cdCAgICBpZiAod2luZG93LnBhZ2VZT2Zmc2V0ICE9PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICBWZWxvY2l0eS5TdGF0ZS5zY3JvbGxBbmNob3IgPSB3aW5kb3c7XG5cdCAgICAgICAgVmVsb2NpdHkuU3RhdGUuc2Nyb2xsUHJvcGVydHlMZWZ0ID0gXCJwYWdlWE9mZnNldFwiO1xuXHQgICAgICAgIFZlbG9jaXR5LlN0YXRlLnNjcm9sbFByb3BlcnR5VG9wID0gXCJwYWdlWU9mZnNldFwiO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgICBWZWxvY2l0eS5TdGF0ZS5zY3JvbGxBbmNob3IgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgfHwgZG9jdW1lbnQuYm9keS5wYXJlbnROb2RlIHx8IGRvY3VtZW50LmJvZHk7XG5cdCAgICAgICAgVmVsb2NpdHkuU3RhdGUuc2Nyb2xsUHJvcGVydHlMZWZ0ID0gXCJzY3JvbGxMZWZ0XCI7XG5cdCAgICAgICAgVmVsb2NpdHkuU3RhdGUuc2Nyb2xsUHJvcGVydHlUb3AgPSBcInNjcm9sbFRvcFwiO1xuXHQgICAgfVxuXG5cdCAgICAvKiBTaG9ydGhhbmQgYWxpYXMgZm9yIGpRdWVyeSdzICQuZGF0YSgpIHV0aWxpdHkuICovXG5cdCAgICBmdW5jdGlvbiBEYXRhIChlbGVtZW50KSB7XG5cdCAgICAgICAgLyogSGFyZGNvZGUgYSByZWZlcmVuY2UgdG8gdGhlIHBsdWdpbiBuYW1lLiAqL1xuXHQgICAgICAgIHZhciByZXNwb25zZSA9ICQuZGF0YShlbGVtZW50LCBcInZlbG9jaXR5XCIpO1xuXG5cdCAgICAgICAgLyogalF1ZXJ5IDw9MS40LjIgcmV0dXJucyBudWxsIGluc3RlYWQgb2YgdW5kZWZpbmVkIHdoZW4gbm8gbWF0Y2ggaXMgZm91bmQuIFdlIG5vcm1hbGl6ZSB0aGlzIGJlaGF2aW9yLiAqL1xuXHQgICAgICAgIHJldHVybiByZXNwb25zZSA9PT0gbnVsbCA/IHVuZGVmaW5lZCA6IHJlc3BvbnNlO1xuXHQgICAgfTtcblxuXHQgICAgLyoqKioqKioqKioqKioqXG5cdCAgICAgICAgRWFzaW5nXG5cdCAgICAqKioqKioqKioqKioqKi9cblxuXHQgICAgLyogU3RlcCBlYXNpbmcgZ2VuZXJhdG9yLiAqL1xuXHQgICAgZnVuY3Rpb24gZ2VuZXJhdGVTdGVwIChzdGVwcykge1xuXHQgICAgICAgIHJldHVybiBmdW5jdGlvbiAocCkge1xuXHQgICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChwICogc3RlcHMpICogKDEgLyBzdGVwcyk7XG5cdCAgICAgICAgfTtcblx0ICAgIH1cblxuXHQgICAgLyogQmV6aWVyIGN1cnZlIGZ1bmN0aW9uIGdlbmVyYXRvci4gQ29weXJpZ2h0IEdhZXRhbiBSZW5hdWRlYXUuIE1JVCBMaWNlbnNlOiBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL01JVF9MaWNlbnNlICovXG5cdCAgICBmdW5jdGlvbiBnZW5lcmF0ZUJlemllciAobVgxLCBtWTEsIG1YMiwgbVkyKSB7XG5cdCAgICAgICAgdmFyIE5FV1RPTl9JVEVSQVRJT05TID0gNCxcblx0ICAgICAgICAgICAgTkVXVE9OX01JTl9TTE9QRSA9IDAuMDAxLFxuXHQgICAgICAgICAgICBTVUJESVZJU0lPTl9QUkVDSVNJT04gPSAwLjAwMDAwMDEsXG5cdCAgICAgICAgICAgIFNVQkRJVklTSU9OX01BWF9JVEVSQVRJT05TID0gMTAsXG5cdCAgICAgICAgICAgIGtTcGxpbmVUYWJsZVNpemUgPSAxMSxcblx0ICAgICAgICAgICAga1NhbXBsZVN0ZXBTaXplID0gMS4wIC8gKGtTcGxpbmVUYWJsZVNpemUgLSAxLjApLFxuXHQgICAgICAgICAgICBmbG9hdDMyQXJyYXlTdXBwb3J0ZWQgPSBcIkZsb2F0MzJBcnJheVwiIGluIHdpbmRvdztcblxuXHQgICAgICAgIC8qIE11c3QgY29udGFpbiBmb3VyIGFyZ3VtZW50cy4gKi9cblx0ICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCAhPT0gNCkge1xuXHQgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLyogQXJndW1lbnRzIG11c3QgYmUgbnVtYmVycy4gKi9cblx0ICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDQ7ICsraSkge1xuXHQgICAgICAgICAgICBpZiAodHlwZW9mIGFyZ3VtZW50c1tpXSAhPT0gXCJudW1iZXJcIiB8fCBpc05hTihhcmd1bWVudHNbaV0pIHx8ICFpc0Zpbml0ZShhcmd1bWVudHNbaV0pKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvKiBYIHZhbHVlcyBtdXN0IGJlIGluIHRoZSBbMCwgMV0gcmFuZ2UuICovXG5cdCAgICAgICAgbVgxID0gTWF0aC5taW4obVgxLCAxKTtcblx0ICAgICAgICBtWDIgPSBNYXRoLm1pbihtWDIsIDEpO1xuXHQgICAgICAgIG1YMSA9IE1hdGgubWF4KG1YMSwgMCk7XG5cdCAgICAgICAgbVgyID0gTWF0aC5tYXgobVgyLCAwKTtcblxuXHQgICAgICAgIHZhciBtU2FtcGxlVmFsdWVzID0gZmxvYXQzMkFycmF5U3VwcG9ydGVkID8gbmV3IEZsb2F0MzJBcnJheShrU3BsaW5lVGFibGVTaXplKSA6IG5ldyBBcnJheShrU3BsaW5lVGFibGVTaXplKTtcblxuXHQgICAgICAgIGZ1bmN0aW9uIEEgKGFBMSwgYUEyKSB7IHJldHVybiAxLjAgLSAzLjAgKiBhQTIgKyAzLjAgKiBhQTE7IH1cblx0ICAgICAgICBmdW5jdGlvbiBCIChhQTEsIGFBMikgeyByZXR1cm4gMy4wICogYUEyIC0gNi4wICogYUExOyB9XG5cdCAgICAgICAgZnVuY3Rpb24gQyAoYUExKSAgICAgIHsgcmV0dXJuIDMuMCAqIGFBMTsgfVxuXG5cdCAgICAgICAgZnVuY3Rpb24gY2FsY0JlemllciAoYVQsIGFBMSwgYUEyKSB7XG5cdCAgICAgICAgICAgIHJldHVybiAoKEEoYUExLCBhQTIpKmFUICsgQihhQTEsIGFBMikpKmFUICsgQyhhQTEpKSphVDtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBmdW5jdGlvbiBnZXRTbG9wZSAoYVQsIGFBMSwgYUEyKSB7XG5cdCAgICAgICAgICAgIHJldHVybiAzLjAgKiBBKGFBMSwgYUEyKSphVCphVCArIDIuMCAqIEIoYUExLCBhQTIpICogYVQgKyBDKGFBMSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgZnVuY3Rpb24gbmV3dG9uUmFwaHNvbkl0ZXJhdGUgKGFYLCBhR3Vlc3NUKSB7XG5cdCAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgTkVXVE9OX0lURVJBVElPTlM7ICsraSkge1xuXHQgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRTbG9wZSA9IGdldFNsb3BlKGFHdWVzc1QsIG1YMSwgbVgyKTtcblxuXHQgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRTbG9wZSA9PT0gMC4wKSByZXR1cm4gYUd1ZXNzVDtcblxuXHQgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRYID0gY2FsY0JlemllcihhR3Vlc3NULCBtWDEsIG1YMikgLSBhWDtcblx0ICAgICAgICAgICAgICAgIGFHdWVzc1QgLT0gY3VycmVudFggLyBjdXJyZW50U2xvcGU7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICByZXR1cm4gYUd1ZXNzVDtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBmdW5jdGlvbiBjYWxjU2FtcGxlVmFsdWVzICgpIHtcblx0ICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBrU3BsaW5lVGFibGVTaXplOyArK2kpIHtcblx0ICAgICAgICAgICAgICAgIG1TYW1wbGVWYWx1ZXNbaV0gPSBjYWxjQmV6aWVyKGkgKiBrU2FtcGxlU3RlcFNpemUsIG1YMSwgbVgyKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGZ1bmN0aW9uIGJpbmFyeVN1YmRpdmlkZSAoYVgsIGFBLCBhQikge1xuXHQgICAgICAgICAgICB2YXIgY3VycmVudFgsIGN1cnJlbnRULCBpID0gMDtcblxuXHQgICAgICAgICAgICBkbyB7XG5cdCAgICAgICAgICAgICAgICBjdXJyZW50VCA9IGFBICsgKGFCIC0gYUEpIC8gMi4wO1xuXHQgICAgICAgICAgICAgICAgY3VycmVudFggPSBjYWxjQmV6aWVyKGN1cnJlbnRULCBtWDEsIG1YMikgLSBhWDtcblx0ICAgICAgICAgICAgICAgIGlmIChjdXJyZW50WCA+IDAuMCkge1xuXHQgICAgICAgICAgICAgICAgICBhQiA9IGN1cnJlbnRUO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgYUEgPSBjdXJyZW50VDtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfSB3aGlsZSAoTWF0aC5hYnMoY3VycmVudFgpID4gU1VCRElWSVNJT05fUFJFQ0lTSU9OICYmICsraSA8IFNVQkRJVklTSU9OX01BWF9JVEVSQVRJT05TKTtcblxuXHQgICAgICAgICAgICByZXR1cm4gY3VycmVudFQ7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgZnVuY3Rpb24gZ2V0VEZvclggKGFYKSB7XG5cdCAgICAgICAgICAgIHZhciBpbnRlcnZhbFN0YXJ0ID0gMC4wLFxuXHQgICAgICAgICAgICAgICAgY3VycmVudFNhbXBsZSA9IDEsXG5cdCAgICAgICAgICAgICAgICBsYXN0U2FtcGxlID0ga1NwbGluZVRhYmxlU2l6ZSAtIDE7XG5cblx0ICAgICAgICAgICAgZm9yICg7IGN1cnJlbnRTYW1wbGUgIT0gbGFzdFNhbXBsZSAmJiBtU2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGVdIDw9IGFYOyArK2N1cnJlbnRTYW1wbGUpIHtcblx0ICAgICAgICAgICAgICAgIGludGVydmFsU3RhcnQgKz0ga1NhbXBsZVN0ZXBTaXplO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLS1jdXJyZW50U2FtcGxlO1xuXG5cdCAgICAgICAgICAgIHZhciBkaXN0ID0gKGFYIC0gbVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSkgLyAobVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlKzFdIC0gbVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSksXG5cdCAgICAgICAgICAgICAgICBndWVzc0ZvclQgPSBpbnRlcnZhbFN0YXJ0ICsgZGlzdCAqIGtTYW1wbGVTdGVwU2l6ZSxcblx0ICAgICAgICAgICAgICAgIGluaXRpYWxTbG9wZSA9IGdldFNsb3BlKGd1ZXNzRm9yVCwgbVgxLCBtWDIpO1xuXG5cdCAgICAgICAgICAgIGlmIChpbml0aWFsU2xvcGUgPj0gTkVXVE9OX01JTl9TTE9QRSkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIG5ld3RvblJhcGhzb25JdGVyYXRlKGFYLCBndWVzc0ZvclQpO1xuXHQgICAgICAgICAgICB9IGVsc2UgaWYgKGluaXRpYWxTbG9wZSA9PSAwLjApIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBndWVzc0ZvclQ7XG5cdCAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gYmluYXJ5U3ViZGl2aWRlKGFYLCBpbnRlcnZhbFN0YXJ0LCBpbnRlcnZhbFN0YXJ0ICsga1NhbXBsZVN0ZXBTaXplKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBfcHJlY29tcHV0ZWQgPSBmYWxzZTtcblxuXHQgICAgICAgIGZ1bmN0aW9uIHByZWNvbXB1dGUoKSB7XG5cdCAgICAgICAgICAgIF9wcmVjb21wdXRlZCA9IHRydWU7XG5cdCAgICAgICAgICAgIGlmIChtWDEgIT0gbVkxIHx8IG1YMiAhPSBtWTIpIGNhbGNTYW1wbGVWYWx1ZXMoKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgZiA9IGZ1bmN0aW9uIChhWCkge1xuXHQgICAgICAgICAgICBpZiAoIV9wcmVjb21wdXRlZCkgcHJlY29tcHV0ZSgpO1xuXHQgICAgICAgICAgICBpZiAobVgxID09PSBtWTEgJiYgbVgyID09PSBtWTIpIHJldHVybiBhWDtcblx0ICAgICAgICAgICAgaWYgKGFYID09PSAwKSByZXR1cm4gMDtcblx0ICAgICAgICAgICAgaWYgKGFYID09PSAxKSByZXR1cm4gMTtcblxuXHQgICAgICAgICAgICByZXR1cm4gY2FsY0JlemllcihnZXRURm9yWChhWCksIG1ZMSwgbVkyKTtcblx0ICAgICAgICB9O1xuXG5cdCAgICAgICAgZi5nZXRDb250cm9sUG9pbnRzID0gZnVuY3Rpb24oKSB7IHJldHVybiBbeyB4OiBtWDEsIHk6IG1ZMSB9LCB7IHg6IG1YMiwgeTogbVkyIH1dOyB9O1xuXG5cdCAgICAgICAgdmFyIHN0ciA9IFwiZ2VuZXJhdGVCZXppZXIoXCIgKyBbbVgxLCBtWTEsIG1YMiwgbVkyXSArIFwiKVwiO1xuXHQgICAgICAgIGYudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBzdHI7IH07XG5cblx0ICAgICAgICByZXR1cm4gZjtcblx0ICAgIH1cblxuXHQgICAgLyogUnVuZ2UtS3V0dGEgc3ByaW5nIHBoeXNpY3MgZnVuY3Rpb24gZ2VuZXJhdG9yLiBBZGFwdGVkIGZyb20gRnJhbWVyLmpzLCBjb3B5cmlnaHQgS29lbiBCb2suIE1JVCBMaWNlbnNlOiBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL01JVF9MaWNlbnNlICovXG5cdCAgICAvKiBHaXZlbiBhIHRlbnNpb24sIGZyaWN0aW9uLCBhbmQgZHVyYXRpb24sIGEgc2ltdWxhdGlvbiBhdCA2MEZQUyB3aWxsIGZpcnN0IHJ1biB3aXRob3V0IGEgZGVmaW5lZCBkdXJhdGlvbiBpbiBvcmRlciB0byBjYWxjdWxhdGUgdGhlIGZ1bGwgcGF0aC4gQSBzZWNvbmQgcGFzc1xuXHQgICAgICAgdGhlbiBhZGp1c3RzIHRoZSB0aW1lIGRlbHRhIC0tIHVzaW5nIHRoZSByZWxhdGlvbiBiZXR3ZWVuIGFjdHVhbCB0aW1lIGFuZCBkdXJhdGlvbiAtLSB0byBjYWxjdWxhdGUgdGhlIHBhdGggZm9yIHRoZSBkdXJhdGlvbi1jb25zdHJhaW5lZCBhbmltYXRpb24uICovXG5cdCAgICB2YXIgZ2VuZXJhdGVTcHJpbmdSSzQgPSAoZnVuY3Rpb24gKCkge1xuXHQgICAgICAgIGZ1bmN0aW9uIHNwcmluZ0FjY2VsZXJhdGlvbkZvclN0YXRlIChzdGF0ZSkge1xuXHQgICAgICAgICAgICByZXR1cm4gKC1zdGF0ZS50ZW5zaW9uICogc3RhdGUueCkgLSAoc3RhdGUuZnJpY3Rpb24gKiBzdGF0ZS52KTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBmdW5jdGlvbiBzcHJpbmdFdmFsdWF0ZVN0YXRlV2l0aERlcml2YXRpdmUgKGluaXRpYWxTdGF0ZSwgZHQsIGRlcml2YXRpdmUpIHtcblx0ICAgICAgICAgICAgdmFyIHN0YXRlID0ge1xuXHQgICAgICAgICAgICAgICAgeDogaW5pdGlhbFN0YXRlLnggKyBkZXJpdmF0aXZlLmR4ICogZHQsXG5cdCAgICAgICAgICAgICAgICB2OiBpbml0aWFsU3RhdGUudiArIGRlcml2YXRpdmUuZHYgKiBkdCxcblx0ICAgICAgICAgICAgICAgIHRlbnNpb246IGluaXRpYWxTdGF0ZS50ZW5zaW9uLFxuXHQgICAgICAgICAgICAgICAgZnJpY3Rpb246IGluaXRpYWxTdGF0ZS5mcmljdGlvblxuXHQgICAgICAgICAgICB9O1xuXG5cdCAgICAgICAgICAgIHJldHVybiB7IGR4OiBzdGF0ZS52LCBkdjogc3ByaW5nQWNjZWxlcmF0aW9uRm9yU3RhdGUoc3RhdGUpIH07XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgZnVuY3Rpb24gc3ByaW5nSW50ZWdyYXRlU3RhdGUgKHN0YXRlLCBkdCkge1xuXHQgICAgICAgICAgICB2YXIgYSA9IHtcblx0ICAgICAgICAgICAgICAgICAgICBkeDogc3RhdGUudixcblx0ICAgICAgICAgICAgICAgICAgICBkdjogc3ByaW5nQWNjZWxlcmF0aW9uRm9yU3RhdGUoc3RhdGUpXG5cdCAgICAgICAgICAgICAgICB9LFxuXHQgICAgICAgICAgICAgICAgYiA9IHNwcmluZ0V2YWx1YXRlU3RhdGVXaXRoRGVyaXZhdGl2ZShzdGF0ZSwgZHQgKiAwLjUsIGEpLFxuXHQgICAgICAgICAgICAgICAgYyA9IHNwcmluZ0V2YWx1YXRlU3RhdGVXaXRoRGVyaXZhdGl2ZShzdGF0ZSwgZHQgKiAwLjUsIGIpLFxuXHQgICAgICAgICAgICAgICAgZCA9IHNwcmluZ0V2YWx1YXRlU3RhdGVXaXRoRGVyaXZhdGl2ZShzdGF0ZSwgZHQsIGMpLFxuXHQgICAgICAgICAgICAgICAgZHhkdCA9IDEuMCAvIDYuMCAqIChhLmR4ICsgMi4wICogKGIuZHggKyBjLmR4KSArIGQuZHgpLFxuXHQgICAgICAgICAgICAgICAgZHZkdCA9IDEuMCAvIDYuMCAqIChhLmR2ICsgMi4wICogKGIuZHYgKyBjLmR2KSArIGQuZHYpO1xuXG5cdCAgICAgICAgICAgIHN0YXRlLnggPSBzdGF0ZS54ICsgZHhkdCAqIGR0O1xuXHQgICAgICAgICAgICBzdGF0ZS52ID0gc3RhdGUudiArIGR2ZHQgKiBkdDtcblxuXHQgICAgICAgICAgICByZXR1cm4gc3RhdGU7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIHNwcmluZ1JLNEZhY3RvcnkgKHRlbnNpb24sIGZyaWN0aW9uLCBkdXJhdGlvbikge1xuXG5cdCAgICAgICAgICAgIHZhciBpbml0U3RhdGUgPSB7XG5cdCAgICAgICAgICAgICAgICAgICAgeDogLTEsXG5cdCAgICAgICAgICAgICAgICAgICAgdjogMCxcblx0ICAgICAgICAgICAgICAgICAgICB0ZW5zaW9uOiBudWxsLFxuXHQgICAgICAgICAgICAgICAgICAgIGZyaWN0aW9uOiBudWxsXG5cdCAgICAgICAgICAgICAgICB9LFxuXHQgICAgICAgICAgICAgICAgcGF0aCA9IFswXSxcblx0ICAgICAgICAgICAgICAgIHRpbWVfbGFwc2VkID0gMCxcblx0ICAgICAgICAgICAgICAgIHRvbGVyYW5jZSA9IDEgLyAxMDAwMCxcblx0ICAgICAgICAgICAgICAgIERUID0gMTYgLyAxMDAwLFxuXHQgICAgICAgICAgICAgICAgaGF2ZV9kdXJhdGlvbiwgZHQsIGxhc3Rfc3RhdGU7XG5cblx0ICAgICAgICAgICAgdGVuc2lvbiA9IHBhcnNlRmxvYXQodGVuc2lvbikgfHwgNTAwO1xuXHQgICAgICAgICAgICBmcmljdGlvbiA9IHBhcnNlRmxvYXQoZnJpY3Rpb24pIHx8IDIwO1xuXHQgICAgICAgICAgICBkdXJhdGlvbiA9IGR1cmF0aW9uIHx8IG51bGw7XG5cblx0ICAgICAgICAgICAgaW5pdFN0YXRlLnRlbnNpb24gPSB0ZW5zaW9uO1xuXHQgICAgICAgICAgICBpbml0U3RhdGUuZnJpY3Rpb24gPSBmcmljdGlvbjtcblxuXHQgICAgICAgICAgICBoYXZlX2R1cmF0aW9uID0gZHVyYXRpb24gIT09IG51bGw7XG5cblx0ICAgICAgICAgICAgLyogQ2FsY3VsYXRlIHRoZSBhY3R1YWwgdGltZSBpdCB0YWtlcyBmb3IgdGhpcyBhbmltYXRpb24gdG8gY29tcGxldGUgd2l0aCB0aGUgcHJvdmlkZWQgY29uZGl0aW9ucy4gKi9cblx0ICAgICAgICAgICAgaWYgKGhhdmVfZHVyYXRpb24pIHtcblx0ICAgICAgICAgICAgICAgIC8qIFJ1biB0aGUgc2ltdWxhdGlvbiB3aXRob3V0IGEgZHVyYXRpb24uICovXG5cdCAgICAgICAgICAgICAgICB0aW1lX2xhcHNlZCA9IHNwcmluZ1JLNEZhY3RvcnkodGVuc2lvbiwgZnJpY3Rpb24pO1xuXHQgICAgICAgICAgICAgICAgLyogQ29tcHV0ZSB0aGUgYWRqdXN0ZWQgdGltZSBkZWx0YS4gKi9cblx0ICAgICAgICAgICAgICAgIGR0ID0gdGltZV9sYXBzZWQgLyBkdXJhdGlvbiAqIERUO1xuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgZHQgPSBEVDtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHdoaWxlICh0cnVlKSB7XG5cdCAgICAgICAgICAgICAgICAvKiBOZXh0L3N0ZXAgZnVuY3Rpb24gLiovXG5cdCAgICAgICAgICAgICAgICBsYXN0X3N0YXRlID0gc3ByaW5nSW50ZWdyYXRlU3RhdGUobGFzdF9zdGF0ZSB8fCBpbml0U3RhdGUsIGR0KTtcblx0ICAgICAgICAgICAgICAgIC8qIFN0b3JlIHRoZSBwb3NpdGlvbi4gKi9cblx0ICAgICAgICAgICAgICAgIHBhdGgucHVzaCgxICsgbGFzdF9zdGF0ZS54KTtcblx0ICAgICAgICAgICAgICAgIHRpbWVfbGFwc2VkICs9IDE2O1xuXHQgICAgICAgICAgICAgICAgLyogSWYgdGhlIGNoYW5nZSB0aHJlc2hvbGQgaXMgcmVhY2hlZCwgYnJlYWsuICovXG5cdCAgICAgICAgICAgICAgICBpZiAoIShNYXRoLmFicyhsYXN0X3N0YXRlLngpID4gdG9sZXJhbmNlICYmIE1hdGguYWJzKGxhc3Rfc3RhdGUudikgPiB0b2xlcmFuY2UpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvKiBJZiBkdXJhdGlvbiBpcyBub3QgZGVmaW5lZCwgcmV0dXJuIHRoZSBhY3R1YWwgdGltZSByZXF1aXJlZCBmb3IgY29tcGxldGluZyB0aGlzIGFuaW1hdGlvbi4gT3RoZXJ3aXNlLCByZXR1cm4gYSBjbG9zdXJlIHRoYXQgaG9sZHMgdGhlXG5cdCAgICAgICAgICAgICAgIGNvbXB1dGVkIHBhdGggYW5kIHJldHVybnMgYSBzbmFwc2hvdCBvZiB0aGUgcG9zaXRpb24gYWNjb3JkaW5nIHRvIGEgZ2l2ZW4gcGVyY2VudENvbXBsZXRlLiAqL1xuXHQgICAgICAgICAgICByZXR1cm4gIWhhdmVfZHVyYXRpb24gPyB0aW1lX2xhcHNlZCA6IGZ1bmN0aW9uKHBlcmNlbnRDb21wbGV0ZSkgeyByZXR1cm4gcGF0aFsgKHBlcmNlbnRDb21wbGV0ZSAqIChwYXRoLmxlbmd0aCAtIDEpKSB8IDAgXTsgfTtcblx0ICAgICAgICB9O1xuXHQgICAgfSgpKTtcblxuXHQgICAgLyogalF1ZXJ5IGVhc2luZ3MuICovXG5cdCAgICBWZWxvY2l0eS5FYXNpbmdzID0ge1xuXHQgICAgICAgIGxpbmVhcjogZnVuY3Rpb24ocCkgeyByZXR1cm4gcDsgfSxcblx0ICAgICAgICBzd2luZzogZnVuY3Rpb24ocCkgeyByZXR1cm4gMC41IC0gTWF0aC5jb3MoIHAgKiBNYXRoLlBJICkgLyAyIH0sXG5cdCAgICAgICAgLyogQm9udXMgXCJzcHJpbmdcIiBlYXNpbmcsIHdoaWNoIGlzIGEgbGVzcyBleGFnZ2VyYXRlZCB2ZXJzaW9uIG9mIGVhc2VJbk91dEVsYXN0aWMuICovXG5cdCAgICAgICAgc3ByaW5nOiBmdW5jdGlvbihwKSB7IHJldHVybiAxIC0gKE1hdGguY29zKHAgKiA0LjUgKiBNYXRoLlBJKSAqIE1hdGguZXhwKC1wICogNikpOyB9XG5cdCAgICB9O1xuXG5cdCAgICAvKiBDU1MzIGFuZCBSb2JlcnQgUGVubmVyIGVhc2luZ3MuICovXG5cdCAgICAkLmVhY2goXG5cdCAgICAgICAgW1xuXHQgICAgICAgICAgICBbIFwiZWFzZVwiLCBbIDAuMjUsIDAuMSwgMC4yNSwgMS4wIF0gXSxcblx0ICAgICAgICAgICAgWyBcImVhc2UtaW5cIiwgWyAwLjQyLCAwLjAsIDEuMDAsIDEuMCBdIF0sXG5cdCAgICAgICAgICAgIFsgXCJlYXNlLW91dFwiLCBbIDAuMDAsIDAuMCwgMC41OCwgMS4wIF0gXSxcblx0ICAgICAgICAgICAgWyBcImVhc2UtaW4tb3V0XCIsIFsgMC40MiwgMC4wLCAwLjU4LCAxLjAgXSBdLFxuXHQgICAgICAgICAgICBbIFwiZWFzZUluU2luZVwiLCBbIDAuNDcsIDAsIDAuNzQ1LCAwLjcxNSBdIF0sXG5cdCAgICAgICAgICAgIFsgXCJlYXNlT3V0U2luZVwiLCBbIDAuMzksIDAuNTc1LCAwLjU2NSwgMSBdIF0sXG5cdCAgICAgICAgICAgIFsgXCJlYXNlSW5PdXRTaW5lXCIsIFsgMC40NDUsIDAuMDUsIDAuNTUsIDAuOTUgXSBdLFxuXHQgICAgICAgICAgICBbIFwiZWFzZUluUXVhZFwiLCBbIDAuNTUsIDAuMDg1LCAwLjY4LCAwLjUzIF0gXSxcblx0ICAgICAgICAgICAgWyBcImVhc2VPdXRRdWFkXCIsIFsgMC4yNSwgMC40NiwgMC40NSwgMC45NCBdIF0sXG5cdCAgICAgICAgICAgIFsgXCJlYXNlSW5PdXRRdWFkXCIsIFsgMC40NTUsIDAuMDMsIDAuNTE1LCAwLjk1NSBdIF0sXG5cdCAgICAgICAgICAgIFsgXCJlYXNlSW5DdWJpY1wiLCBbIDAuNTUsIDAuMDU1LCAwLjY3NSwgMC4xOSBdIF0sXG5cdCAgICAgICAgICAgIFsgXCJlYXNlT3V0Q3ViaWNcIiwgWyAwLjIxNSwgMC42MSwgMC4zNTUsIDEgXSBdLFxuXHQgICAgICAgICAgICBbIFwiZWFzZUluT3V0Q3ViaWNcIiwgWyAwLjY0NSwgMC4wNDUsIDAuMzU1LCAxIF0gXSxcblx0ICAgICAgICAgICAgWyBcImVhc2VJblF1YXJ0XCIsIFsgMC44OTUsIDAuMDMsIDAuNjg1LCAwLjIyIF0gXSxcblx0ICAgICAgICAgICAgWyBcImVhc2VPdXRRdWFydFwiLCBbIDAuMTY1LCAwLjg0LCAwLjQ0LCAxIF0gXSxcblx0ICAgICAgICAgICAgWyBcImVhc2VJbk91dFF1YXJ0XCIsIFsgMC43NywgMCwgMC4xNzUsIDEgXSBdLFxuXHQgICAgICAgICAgICBbIFwiZWFzZUluUXVpbnRcIiwgWyAwLjc1NSwgMC4wNSwgMC44NTUsIDAuMDYgXSBdLFxuXHQgICAgICAgICAgICBbIFwiZWFzZU91dFF1aW50XCIsIFsgMC4yMywgMSwgMC4zMiwgMSBdIF0sXG5cdCAgICAgICAgICAgIFsgXCJlYXNlSW5PdXRRdWludFwiLCBbIDAuODYsIDAsIDAuMDcsIDEgXSBdLFxuXHQgICAgICAgICAgICBbIFwiZWFzZUluRXhwb1wiLCBbIDAuOTUsIDAuMDUsIDAuNzk1LCAwLjAzNSBdIF0sXG5cdCAgICAgICAgICAgIFsgXCJlYXNlT3V0RXhwb1wiLCBbIDAuMTksIDEsIDAuMjIsIDEgXSBdLFxuXHQgICAgICAgICAgICBbIFwiZWFzZUluT3V0RXhwb1wiLCBbIDEsIDAsIDAsIDEgXSBdLFxuXHQgICAgICAgICAgICBbIFwiZWFzZUluQ2lyY1wiLCBbIDAuNiwgMC4wNCwgMC45OCwgMC4zMzUgXSBdLFxuXHQgICAgICAgICAgICBbIFwiZWFzZU91dENpcmNcIiwgWyAwLjA3NSwgMC44MiwgMC4xNjUsIDEgXSBdLFxuXHQgICAgICAgICAgICBbIFwiZWFzZUluT3V0Q2lyY1wiLCBbIDAuNzg1LCAwLjEzNSwgMC4xNSwgMC44NiBdIF1cblx0ICAgICAgICBdLCBmdW5jdGlvbihpLCBlYXNpbmdBcnJheSkge1xuXHQgICAgICAgICAgICBWZWxvY2l0eS5FYXNpbmdzW2Vhc2luZ0FycmF5WzBdXSA9IGdlbmVyYXRlQmV6aWVyLmFwcGx5KG51bGwsIGVhc2luZ0FycmF5WzFdKTtcblx0ICAgICAgICB9KTtcblxuXHQgICAgLyogRGV0ZXJtaW5lIHRoZSBhcHByb3ByaWF0ZSBlYXNpbmcgdHlwZSBnaXZlbiBhbiBlYXNpbmcgaW5wdXQuICovXG5cdCAgICBmdW5jdGlvbiBnZXRFYXNpbmcodmFsdWUsIGR1cmF0aW9uKSB7XG5cdCAgICAgICAgdmFyIGVhc2luZyA9IHZhbHVlO1xuXG5cdCAgICAgICAgLyogVGhlIGVhc2luZyBvcHRpb24gY2FuIGVpdGhlciBiZSBhIHN0cmluZyB0aGF0IHJlZmVyZW5jZXMgYSBwcmUtcmVnaXN0ZXJlZCBlYXNpbmcsXG5cdCAgICAgICAgICAgb3IgaXQgY2FuIGJlIGEgdHdvLS9mb3VyLWl0ZW0gYXJyYXkgb2YgaW50ZWdlcnMgdG8gYmUgY29udmVydGVkIGludG8gYSBiZXppZXIvc3ByaW5nIGZ1bmN0aW9uLiAqL1xuXHQgICAgICAgIGlmIChUeXBlLmlzU3RyaW5nKHZhbHVlKSkge1xuXHQgICAgICAgICAgICAvKiBFbnN1cmUgdGhhdCB0aGUgZWFzaW5nIGhhcyBiZWVuIGFzc2lnbmVkIHRvIGpRdWVyeSdzIFZlbG9jaXR5LkVhc2luZ3Mgb2JqZWN0LiAqL1xuXHQgICAgICAgICAgICBpZiAoIVZlbG9jaXR5LkVhc2luZ3NbdmFsdWVdKSB7XG5cdCAgICAgICAgICAgICAgICBlYXNpbmcgPSBmYWxzZTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0gZWxzZSBpZiAoVHlwZS5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPT09IDEpIHtcblx0ICAgICAgICAgICAgZWFzaW5nID0gZ2VuZXJhdGVTdGVwLmFwcGx5KG51bGwsIHZhbHVlKTtcblx0ICAgICAgICB9IGVsc2UgaWYgKFR5cGUuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAyKSB7XG5cdCAgICAgICAgICAgIC8qIHNwcmluZ1JLNCBtdXN0IGJlIHBhc3NlZCB0aGUgYW5pbWF0aW9uJ3MgZHVyYXRpb24uICovXG5cdCAgICAgICAgICAgIC8qIE5vdGU6IElmIHRoZSBzcHJpbmdSSzQgYXJyYXkgY29udGFpbnMgbm9uLW51bWJlcnMsIGdlbmVyYXRlU3ByaW5nUks0KCkgcmV0dXJucyBhbiBlYXNpbmdcblx0ICAgICAgICAgICAgICAgZnVuY3Rpb24gZ2VuZXJhdGVkIHdpdGggZGVmYXVsdCB0ZW5zaW9uIGFuZCBmcmljdGlvbiB2YWx1ZXMuICovXG5cdCAgICAgICAgICAgIGVhc2luZyA9IGdlbmVyYXRlU3ByaW5nUks0LmFwcGx5KG51bGwsIHZhbHVlLmNvbmNhdChbIGR1cmF0aW9uIF0pKTtcblx0ICAgICAgICB9IGVsc2UgaWYgKFR5cGUuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSA0KSB7XG5cdCAgICAgICAgICAgIC8qIE5vdGU6IElmIHRoZSBiZXppZXIgYXJyYXkgY29udGFpbnMgbm9uLW51bWJlcnMsIGdlbmVyYXRlQmV6aWVyKCkgcmV0dXJucyBmYWxzZS4gKi9cblx0ICAgICAgICAgICAgZWFzaW5nID0gZ2VuZXJhdGVCZXppZXIuYXBwbHkobnVsbCwgdmFsdWUpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIGVhc2luZyA9IGZhbHNlO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8qIFJldmVydCB0byB0aGUgVmVsb2NpdHktd2lkZSBkZWZhdWx0IGVhc2luZyB0eXBlLCBvciBmYWxsIGJhY2sgdG8gXCJzd2luZ1wiICh3aGljaCBpcyBhbHNvIGpRdWVyeSdzIGRlZmF1bHQpXG5cdCAgICAgICAgICAgaWYgdGhlIFZlbG9jaXR5LXdpZGUgZGVmYXVsdCBoYXMgYmVlbiBpbmNvcnJlY3RseSBtb2RpZmllZC4gKi9cblx0ICAgICAgICBpZiAoZWFzaW5nID09PSBmYWxzZSkge1xuXHQgICAgICAgICAgICBpZiAoVmVsb2NpdHkuRWFzaW5nc1tWZWxvY2l0eS5kZWZhdWx0cy5lYXNpbmddKSB7XG5cdCAgICAgICAgICAgICAgICBlYXNpbmcgPSBWZWxvY2l0eS5kZWZhdWx0cy5lYXNpbmc7XG5cdCAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICBlYXNpbmcgPSBFQVNJTkdfREVGQVVMVDtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiBlYXNpbmc7XG5cdCAgICB9XG5cblx0ICAgIC8qKioqKioqKioqKioqKioqKlxuXHQgICAgICAgIENTUyBTdGFja1xuXHQgICAgKioqKioqKioqKioqKioqKiovXG5cblx0ICAgIC8qIFRoZSBDU1Mgb2JqZWN0IGlzIGEgaGlnaGx5IGNvbmRlbnNlZCBhbmQgcGVyZm9ybWFudCBDU1Mgc3RhY2sgdGhhdCBmdWxseSByZXBsYWNlcyBqUXVlcnkncy5cblx0ICAgICAgIEl0IGhhbmRsZXMgdGhlIHZhbGlkYXRpb24sIGdldHRpbmcsIGFuZCBzZXR0aW5nIG9mIGJvdGggc3RhbmRhcmQgQ1NTIHByb3BlcnRpZXMgYW5kIENTUyBwcm9wZXJ0eSBob29rcy4gKi9cblx0ICAgIC8qIE5vdGU6IEEgXCJDU1NcIiBzaG9ydGhhbmQgaXMgYWxpYXNlZCBzbyB0aGF0IG91ciBjb2RlIGlzIGVhc2llciB0byByZWFkLiAqL1xuXHQgICAgdmFyIENTUyA9IFZlbG9jaXR5LkNTUyA9IHtcblxuXHQgICAgICAgIC8qKioqKioqKioqKioqXG5cdCAgICAgICAgICAgIFJlZ0V4XG5cdCAgICAgICAgKioqKioqKioqKioqKi9cblxuXHQgICAgICAgIFJlZ0V4OiB7XG5cdCAgICAgICAgICAgIGlzSGV4OiAvXiMoW0EtZlxcZF17M30pezEsMn0kL2ksXG5cdCAgICAgICAgICAgIC8qIFVud3JhcCBhIHByb3BlcnR5IHZhbHVlJ3Mgc3Vycm91bmRpbmcgdGV4dCwgZS5nLiBcInJnYmEoNCwgMywgMiwgMSlcIiA9PT4gXCI0LCAzLCAyLCAxXCIgYW5kIFwicmVjdCg0cHggM3B4IDJweCAxcHgpXCIgPT0+IFwiNHB4IDNweCAycHggMXB4XCIuICovXG5cdCAgICAgICAgICAgIHZhbHVlVW53cmFwOiAvXltBLXpdK1xcKCguKilcXCkkL2ksXG5cdCAgICAgICAgICAgIHdyYXBwZWRWYWx1ZUFscmVhZHlFeHRyYWN0ZWQ6IC9bMC05Ll0rIFswLTkuXSsgWzAtOS5dKyggWzAtOS5dKyk/Lyxcblx0ICAgICAgICAgICAgLyogU3BsaXQgYSBtdWx0aS12YWx1ZSBwcm9wZXJ0eSBpbnRvIGFuIGFycmF5IG9mIHN1YnZhbHVlcywgZS5nLiBcInJnYmEoNCwgMywgMiwgMSkgNHB4IDNweCAycHggMXB4XCIgPT0+IFsgXCJyZ2JhKDQsIDMsIDIsIDEpXCIsIFwiNHB4XCIsIFwiM3B4XCIsIFwiMnB4XCIsIFwiMXB4XCIgXS4gKi9cblx0ICAgICAgICAgICAgdmFsdWVTcGxpdDogLyhbQS16XStcXCguK1xcKSl8KChbQS16MC05Iy0uXSs/KSg/PVxcc3wkKSkvaWdcblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgLyoqKioqKioqKioqKlxuXHQgICAgICAgICAgICBMaXN0c1xuXHQgICAgICAgICoqKioqKioqKioqKi9cblxuXHQgICAgICAgIExpc3RzOiB7XG5cdCAgICAgICAgICAgIGNvbG9yczogWyBcImZpbGxcIiwgXCJzdHJva2VcIiwgXCJzdG9wQ29sb3JcIiwgXCJjb2xvclwiLCBcImJhY2tncm91bmRDb2xvclwiLCBcImJvcmRlckNvbG9yXCIsIFwiYm9yZGVyVG9wQ29sb3JcIiwgXCJib3JkZXJSaWdodENvbG9yXCIsIFwiYm9yZGVyQm90dG9tQ29sb3JcIiwgXCJib3JkZXJMZWZ0Q29sb3JcIiwgXCJvdXRsaW5lQ29sb3JcIiBdLFxuXHQgICAgICAgICAgICB0cmFuc2Zvcm1zQmFzZTogWyBcInRyYW5zbGF0ZVhcIiwgXCJ0cmFuc2xhdGVZXCIsIFwic2NhbGVcIiwgXCJzY2FsZVhcIiwgXCJzY2FsZVlcIiwgXCJza2V3WFwiLCBcInNrZXdZXCIsIFwicm90YXRlWlwiIF0sXG5cdCAgICAgICAgICAgIHRyYW5zZm9ybXMzRDogWyBcInRyYW5zZm9ybVBlcnNwZWN0aXZlXCIsIFwidHJhbnNsYXRlWlwiLCBcInNjYWxlWlwiLCBcInJvdGF0ZVhcIiwgXCJyb3RhdGVZXCIgXVxuXHQgICAgICAgIH0sXG5cblx0ICAgICAgICAvKioqKioqKioqKioqXG5cdCAgICAgICAgICAgIEhvb2tzXG5cdCAgICAgICAgKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgLyogSG9va3MgYWxsb3cgYSBzdWJwcm9wZXJ0eSAoZS5nLiBcImJveFNoYWRvd0JsdXJcIikgb2YgYSBjb21wb3VuZC12YWx1ZSBDU1MgcHJvcGVydHlcblx0ICAgICAgICAgICAoZS5nLiBcImJveFNoYWRvdzogWCBZIEJsdXIgU3ByZWFkIENvbG9yXCIpIHRvIGJlIGFuaW1hdGVkIGFzIGlmIGl0IHdlcmUgYSBkaXNjcmV0ZSBwcm9wZXJ0eS4gKi9cblx0ICAgICAgICAvKiBOb3RlOiBCZXlvbmQgZW5hYmxpbmcgZmluZS1ncmFpbmVkIHByb3BlcnR5IGFuaW1hdGlvbiwgaG9va2luZyBpcyBuZWNlc3Nhcnkgc2luY2UgVmVsb2NpdHkgb25seVxuXHQgICAgICAgICAgIHR3ZWVucyBwcm9wZXJ0aWVzIHdpdGggc2luZ2xlIG51bWVyaWMgdmFsdWVzOyB1bmxpa2UgQ1NTIHRyYW5zaXRpb25zLCBWZWxvY2l0eSBkb2VzIG5vdCBpbnRlcnBvbGF0ZSBjb21wb3VuZC12YWx1ZXMuICovXG5cdCAgICAgICAgSG9va3M6IHtcblx0ICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICBSZWdpc3RyYXRpb25cblx0ICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgLyogVGVtcGxhdGVzIGFyZSBhIGNvbmNpc2Ugd2F5IG9mIGluZGljYXRpbmcgd2hpY2ggc3VicHJvcGVydGllcyBtdXN0IGJlIGluZGl2aWR1YWxseSByZWdpc3RlcmVkIGZvciBlYWNoIGNvbXBvdW5kLXZhbHVlIENTUyBwcm9wZXJ0eS4gKi9cblx0ICAgICAgICAgICAgLyogRWFjaCB0ZW1wbGF0ZSBjb25zaXN0cyBvZiB0aGUgY29tcG91bmQtdmFsdWUncyBiYXNlIG5hbWUsIGl0cyBjb25zdGl0dWVudCBzdWJwcm9wZXJ0eSBuYW1lcywgYW5kIHRob3NlIHN1YnByb3BlcnRpZXMnIGRlZmF1bHQgdmFsdWVzLiAqL1xuXHQgICAgICAgICAgICB0ZW1wbGF0ZXM6IHtcblx0ICAgICAgICAgICAgICAgIFwidGV4dFNoYWRvd1wiOiBbIFwiQ29sb3IgWCBZIEJsdXJcIiwgXCJibGFjayAwcHggMHB4IDBweFwiIF0sXG5cdCAgICAgICAgICAgICAgICBcImJveFNoYWRvd1wiOiBbIFwiQ29sb3IgWCBZIEJsdXIgU3ByZWFkXCIsIFwiYmxhY2sgMHB4IDBweCAwcHggMHB4XCIgXSxcblx0ICAgICAgICAgICAgICAgIFwiY2xpcFwiOiBbIFwiVG9wIFJpZ2h0IEJvdHRvbSBMZWZ0XCIsIFwiMHB4IDBweCAwcHggMHB4XCIgXSxcblx0ICAgICAgICAgICAgICAgIFwiYmFja2dyb3VuZFBvc2l0aW9uXCI6IFsgXCJYIFlcIiwgXCIwJSAwJVwiIF0sXG5cdCAgICAgICAgICAgICAgICBcInRyYW5zZm9ybU9yaWdpblwiOiBbIFwiWCBZIFpcIiwgXCI1MCUgNTAlIDBweFwiIF0sXG5cdCAgICAgICAgICAgICAgICBcInBlcnNwZWN0aXZlT3JpZ2luXCI6IFsgXCJYIFlcIiwgXCI1MCUgNTAlXCIgXVxuXHQgICAgICAgICAgICB9LFxuXG5cdCAgICAgICAgICAgIC8qIEEgXCJyZWdpc3RlcmVkXCIgaG9vayBpcyBvbmUgdGhhdCBoYXMgYmVlbiBjb252ZXJ0ZWQgZnJvbSBpdHMgdGVtcGxhdGUgZm9ybSBpbnRvIGEgbGl2ZSxcblx0ICAgICAgICAgICAgICAgdHdlZW5hYmxlIHByb3BlcnR5LiBJdCBjb250YWlucyBkYXRhIHRvIGFzc29jaWF0ZSBpdCB3aXRoIGl0cyByb290IHByb3BlcnR5LiAqL1xuXHQgICAgICAgICAgICByZWdpc3RlcmVkOiB7XG5cdCAgICAgICAgICAgICAgICAvKiBOb3RlOiBBIHJlZ2lzdGVyZWQgaG9vayBsb29rcyBsaWtlIHRoaXMgPT0+IHRleHRTaGFkb3dCbHVyOiBbIFwidGV4dFNoYWRvd1wiLCAzIF0sXG5cdCAgICAgICAgICAgICAgICAgICB3aGljaCBjb25zaXN0cyBvZiB0aGUgc3VicHJvcGVydHkncyBuYW1lLCB0aGUgYXNzb2NpYXRlZCByb290IHByb3BlcnR5J3MgbmFtZSxcblx0ICAgICAgICAgICAgICAgICAgIGFuZCB0aGUgc3VicHJvcGVydHkncyBwb3NpdGlvbiBpbiB0aGUgcm9vdCdzIHZhbHVlLiAqL1xuXHQgICAgICAgICAgICB9LFxuXHQgICAgICAgICAgICAvKiBDb252ZXJ0IHRoZSB0ZW1wbGF0ZXMgaW50byBpbmRpdmlkdWFsIGhvb2tzIHRoZW4gYXBwZW5kIHRoZW0gdG8gdGhlIHJlZ2lzdGVyZWQgb2JqZWN0IGFib3ZlLiAqL1xuXHQgICAgICAgICAgICByZWdpc3RlcjogZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgLyogQ29sb3IgaG9va3MgcmVnaXN0cmF0aW9uOiBDb2xvcnMgYXJlIGRlZmF1bHRlZCB0byB3aGl0ZSAtLSBhcyBvcHBvc2VkIHRvIGJsYWNrIC0tIHNpbmNlIGNvbG9ycyB0aGF0IGFyZVxuXHQgICAgICAgICAgICAgICAgICAgY3VycmVudGx5IHNldCB0byBcInRyYW5zcGFyZW50XCIgZGVmYXVsdCB0byB0aGVpciByZXNwZWN0aXZlIHRlbXBsYXRlIGJlbG93IHdoZW4gY29sb3ItYW5pbWF0ZWQsXG5cdCAgICAgICAgICAgICAgICAgICBhbmQgd2hpdGUgaXMgdHlwaWNhbGx5IGEgY2xvc2VyIG1hdGNoIHRvIHRyYW5zcGFyZW50IHRoYW4gYmxhY2sgaXMuIEFuIGV4Y2VwdGlvbiBpcyBtYWRlIGZvciB0ZXh0IChcImNvbG9yXCIpLFxuXHQgICAgICAgICAgICAgICAgICAgd2hpY2ggaXMgYWxtb3N0IGFsd2F5cyBzZXQgY2xvc2VyIHRvIGJsYWNrIHRoYW4gd2hpdGUuICovXG5cdCAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IENTUy5MaXN0cy5jb2xvcnMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgcmdiQ29tcG9uZW50cyA9IChDU1MuTGlzdHMuY29sb3JzW2ldID09PSBcImNvbG9yXCIpID8gXCIwIDAgMCAxXCIgOiBcIjI1NSAyNTUgMjU1IDFcIjtcblx0ICAgICAgICAgICAgICAgICAgICBDU1MuSG9va3MudGVtcGxhdGVzW0NTUy5MaXN0cy5jb2xvcnNbaV1dID0gWyBcIlJlZCBHcmVlbiBCbHVlIEFscGhhXCIsIHJnYkNvbXBvbmVudHMgXTtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgdmFyIHJvb3RQcm9wZXJ0eSxcblx0ICAgICAgICAgICAgICAgICAgICBob29rVGVtcGxhdGUsXG5cdCAgICAgICAgICAgICAgICAgICAgaG9va05hbWVzO1xuXG5cdCAgICAgICAgICAgICAgICAvKiBJbiBJRSwgY29sb3IgdmFsdWVzIGluc2lkZSBjb21wb3VuZC12YWx1ZSBwcm9wZXJ0aWVzIGFyZSBwb3NpdGlvbmVkIGF0IHRoZSBlbmQgdGhlIHZhbHVlIGluc3RlYWQgb2YgYXQgdGhlIGJlZ2lubmluZy5cblx0ICAgICAgICAgICAgICAgICAgIFRodXMsIHdlIHJlLWFycmFuZ2UgdGhlIHRlbXBsYXRlcyBhY2NvcmRpbmdseS4gKi9cblx0ICAgICAgICAgICAgICAgIGlmIChJRSkge1xuXHQgICAgICAgICAgICAgICAgICAgIGZvciAocm9vdFByb3BlcnR5IGluIENTUy5Ib29rcy50ZW1wbGF0ZXMpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgaG9va1RlbXBsYXRlID0gQ1NTLkhvb2tzLnRlbXBsYXRlc1tyb290UHJvcGVydHldO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBob29rTmFtZXMgPSBob29rVGVtcGxhdGVbMF0uc3BsaXQoXCIgXCIpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkZWZhdWx0VmFsdWVzID0gaG9va1RlbXBsYXRlWzFdLm1hdGNoKENTUy5SZWdFeC52YWx1ZVNwbGl0KTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaG9va05hbWVzWzBdID09PSBcIkNvbG9yXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFJlcG9zaXRpb24gYm90aCB0aGUgaG9vaydzIG5hbWUgYW5kIGl0cyBkZWZhdWx0IHZhbHVlIHRvIHRoZSBlbmQgb2YgdGhlaXIgcmVzcGVjdGl2ZSBzdHJpbmdzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaG9va05hbWVzLnB1c2goaG9va05hbWVzLnNoaWZ0KCkpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdFZhbHVlcy5wdXNoKGRlZmF1bHRWYWx1ZXMuc2hpZnQoKSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFJlcGxhY2UgdGhlIGV4aXN0aW5nIHRlbXBsYXRlIGZvciB0aGUgaG9vaydzIHJvb3QgcHJvcGVydHkuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBDU1MuSG9va3MudGVtcGxhdGVzW3Jvb3RQcm9wZXJ0eV0gPSBbIGhvb2tOYW1lcy5qb2luKFwiIFwiKSwgZGVmYXVsdFZhbHVlcy5qb2luKFwiIFwiKSBdO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAvKiBIb29rIHJlZ2lzdHJhdGlvbi4gKi9cblx0ICAgICAgICAgICAgICAgIGZvciAocm9vdFByb3BlcnR5IGluIENTUy5Ib29rcy50ZW1wbGF0ZXMpIHtcblx0ICAgICAgICAgICAgICAgICAgICBob29rVGVtcGxhdGUgPSBDU1MuSG9va3MudGVtcGxhdGVzW3Jvb3RQcm9wZXJ0eV07XG5cdCAgICAgICAgICAgICAgICAgICAgaG9va05hbWVzID0gaG9va1RlbXBsYXRlWzBdLnNwbGl0KFwiIFwiKTtcblxuXHQgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gaG9va05hbWVzKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmdWxsSG9va05hbWUgPSByb290UHJvcGVydHkgKyBob29rTmFtZXNbaV0sXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBob29rUG9zaXRpb24gPSBpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIEZvciBlYWNoIGhvb2ssIHJlZ2lzdGVyIGl0cyBmdWxsIG5hbWUgKGUuZy4gdGV4dFNoYWRvd0JsdXIpIHdpdGggaXRzIHJvb3QgcHJvcGVydHkgKGUuZy4gdGV4dFNoYWRvdylcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kIHRoZSBob29rJ3MgcG9zaXRpb24gaW4gaXRzIHRlbXBsYXRlJ3MgZGVmYXVsdCB2YWx1ZSBzdHJpbmcuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIENTUy5Ib29rcy5yZWdpc3RlcmVkW2Z1bGxIb29rTmFtZV0gPSBbIHJvb3RQcm9wZXJ0eSwgaG9va1Bvc2l0aW9uIF07XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9LFxuXG5cdCAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICBJbmplY3Rpb24gYW5kIEV4dHJhY3Rpb25cblx0ICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgLyogTG9vayB1cCB0aGUgcm9vdCBwcm9wZXJ0eSBhc3NvY2lhdGVkIHdpdGggdGhlIGhvb2sgKGUuZy4gcmV0dXJuIFwidGV4dFNoYWRvd1wiIGZvciBcInRleHRTaGFkb3dCbHVyXCIpLiAqL1xuXHQgICAgICAgICAgICAvKiBTaW5jZSBhIGhvb2sgY2Fubm90IGJlIHNldCBkaXJlY3RseSAodGhlIGJyb3dzZXIgd29uJ3QgcmVjb2duaXplIGl0KSwgc3R5bGUgdXBkYXRpbmcgZm9yIGhvb2tzIGlzIHJvdXRlZCB0aHJvdWdoIHRoZSBob29rJ3Mgcm9vdCBwcm9wZXJ0eS4gKi9cblx0ICAgICAgICAgICAgZ2V0Um9vdDogZnVuY3Rpb24gKHByb3BlcnR5KSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgaG9va0RhdGEgPSBDU1MuSG9va3MucmVnaXN0ZXJlZFtwcm9wZXJ0eV07XG5cblx0ICAgICAgICAgICAgICAgIGlmIChob29rRGF0YSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBob29rRGF0YVswXTtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlcmUgd2FzIG5vIGhvb2sgbWF0Y2gsIHJldHVybiB0aGUgcHJvcGVydHkgbmFtZSB1bnRvdWNoZWQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5O1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9LFxuXHQgICAgICAgICAgICAvKiBDb252ZXJ0IGFueSByb290UHJvcGVydHlWYWx1ZSwgbnVsbCBvciBvdGhlcndpc2UsIGludG8gYSBzcGFjZS1kZWxpbWl0ZWQgbGlzdCBvZiBob29rIHZhbHVlcyBzbyB0aGF0XG5cdCAgICAgICAgICAgICAgIHRoZSB0YXJnZXRlZCBob29rIGNhbiBiZSBpbmplY3RlZCBvciBleHRyYWN0ZWQgYXQgaXRzIHN0YW5kYXJkIHBvc2l0aW9uLiAqL1xuXHQgICAgICAgICAgICBjbGVhblJvb3RQcm9wZXJ0eVZhbHVlOiBmdW5jdGlvbihyb290UHJvcGVydHksIHJvb3RQcm9wZXJ0eVZhbHVlKSB7XG5cdCAgICAgICAgICAgICAgICAvKiBJZiB0aGUgcm9vdFByb3BlcnR5VmFsdWUgaXMgd3JhcHBlZCB3aXRoIFwicmdiKClcIiwgXCJjbGlwKClcIiwgZXRjLiwgcmVtb3ZlIHRoZSB3cmFwcGluZyB0byBub3JtYWxpemUgdGhlIHZhbHVlIGJlZm9yZSBtYW5pcHVsYXRpb24uICovXG5cdCAgICAgICAgICAgICAgICBpZiAoQ1NTLlJlZ0V4LnZhbHVlVW53cmFwLnRlc3Qocm9vdFByb3BlcnR5VmFsdWUpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWUgPSByb290UHJvcGVydHlWYWx1ZS5tYXRjaChDU1MuUmVnRXgudmFsdWVVbndyYXApWzFdO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAvKiBJZiByb290UHJvcGVydHlWYWx1ZSBpcyBhIENTUyBudWxsLXZhbHVlIChmcm9tIHdoaWNoIHRoZXJlJ3MgaW5oZXJlbnRseSBubyBob29rIHZhbHVlIHRvIGV4dHJhY3QpLFxuXHQgICAgICAgICAgICAgICAgICAgZGVmYXVsdCB0byB0aGUgcm9vdCdzIGRlZmF1bHQgdmFsdWUgYXMgZGVmaW5lZCBpbiBDU1MuSG9va3MudGVtcGxhdGVzLiAqL1xuXHQgICAgICAgICAgICAgICAgLyogTm90ZTogQ1NTIG51bGwtdmFsdWVzIGluY2x1ZGUgXCJub25lXCIsIFwiYXV0b1wiLCBhbmQgXCJ0cmFuc3BhcmVudFwiLiBUaGV5IG11c3QgYmUgY29udmVydGVkIGludG8gdGhlaXJcblx0ICAgICAgICAgICAgICAgICAgIHplcm8tdmFsdWVzIChlLmcuIHRleHRTaGFkb3c6IFwibm9uZVwiID09PiB0ZXh0U2hhZG93OiBcIjBweCAwcHggMHB4IGJsYWNrXCIpIGZvciBob29rIG1hbmlwdWxhdGlvbiB0byBwcm9jZWVkLiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKENTUy5WYWx1ZXMuaXNDU1NOdWxsVmFsdWUocm9vdFByb3BlcnR5VmFsdWUpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWUgPSBDU1MuSG9va3MudGVtcGxhdGVzW3Jvb3RQcm9wZXJ0eV1bMV07XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIHJldHVybiByb290UHJvcGVydHlWYWx1ZTtcblx0ICAgICAgICAgICAgfSxcblx0ICAgICAgICAgICAgLyogRXh0cmFjdGVkIHRoZSBob29rJ3MgdmFsdWUgZnJvbSBpdHMgcm9vdCBwcm9wZXJ0eSdzIHZhbHVlLiBUaGlzIGlzIHVzZWQgdG8gZ2V0IHRoZSBzdGFydGluZyB2YWx1ZSBvZiBhbiBhbmltYXRpbmcgaG9vay4gKi9cblx0ICAgICAgICAgICAgZXh0cmFjdFZhbHVlOiBmdW5jdGlvbiAoZnVsbEhvb2tOYW1lLCByb290UHJvcGVydHlWYWx1ZSkge1xuXHQgICAgICAgICAgICAgICAgdmFyIGhvb2tEYXRhID0gQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbZnVsbEhvb2tOYW1lXTtcblxuXHQgICAgICAgICAgICAgICAgaWYgKGhvb2tEYXRhKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIGhvb2tSb290ID0gaG9va0RhdGFbMF0sXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGhvb2tQb3NpdGlvbiA9IGhvb2tEYXRhWzFdO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWUgPSBDU1MuSG9va3MuY2xlYW5Sb290UHJvcGVydHlWYWx1ZShob29rUm9vdCwgcm9vdFByb3BlcnR5VmFsdWUpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogU3BsaXQgcm9vdFByb3BlcnR5VmFsdWUgaW50byBpdHMgY29uc3RpdHVlbnQgaG9vayB2YWx1ZXMgdGhlbiBncmFiIHRoZSBkZXNpcmVkIGhvb2sgYXQgaXRzIHN0YW5kYXJkIHBvc2l0aW9uLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiByb290UHJvcGVydHlWYWx1ZS50b1N0cmluZygpLm1hdGNoKENTUy5SZWdFeC52YWx1ZVNwbGl0KVtob29rUG9zaXRpb25dO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgcHJvdmlkZWQgZnVsbEhvb2tOYW1lIGlzbid0IGEgcmVnaXN0ZXJlZCBob29rLCByZXR1cm4gdGhlIHJvb3RQcm9wZXJ0eVZhbHVlIHRoYXQgd2FzIHBhc3NlZCBpbi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gcm9vdFByb3BlcnR5VmFsdWU7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH0sXG5cdCAgICAgICAgICAgIC8qIEluamVjdCB0aGUgaG9vaydzIHZhbHVlIGludG8gaXRzIHJvb3QgcHJvcGVydHkncyB2YWx1ZS4gVGhpcyBpcyB1c2VkIHRvIHBpZWNlIGJhY2sgdG9nZXRoZXIgdGhlIHJvb3QgcHJvcGVydHlcblx0ICAgICAgICAgICAgICAgb25jZSBWZWxvY2l0eSBoYXMgdXBkYXRlZCBvbmUgb2YgaXRzIGluZGl2aWR1YWxseSBob29rZWQgdmFsdWVzIHRocm91Z2ggdHdlZW5pbmcuICovXG5cdCAgICAgICAgICAgIGluamVjdFZhbHVlOiBmdW5jdGlvbiAoZnVsbEhvb2tOYW1lLCBob29rVmFsdWUsIHJvb3RQcm9wZXJ0eVZhbHVlKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgaG9va0RhdGEgPSBDU1MuSG9va3MucmVnaXN0ZXJlZFtmdWxsSG9va05hbWVdO1xuXG5cdCAgICAgICAgICAgICAgICBpZiAoaG9va0RhdGEpIHtcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgaG9va1Jvb3QgPSBob29rRGF0YVswXSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgaG9va1Bvc2l0aW9uID0gaG9va0RhdGFbMV0sXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlUGFydHMsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlVXBkYXRlZDtcblxuXHQgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlID0gQ1NTLkhvb2tzLmNsZWFuUm9vdFByb3BlcnR5VmFsdWUoaG9va1Jvb3QsIHJvb3RQcm9wZXJ0eVZhbHVlKTtcblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIFNwbGl0IHJvb3RQcm9wZXJ0eVZhbHVlIGludG8gaXRzIGluZGl2aWR1YWwgaG9vayB2YWx1ZXMsIHJlcGxhY2UgdGhlIHRhcmdldGVkIHZhbHVlIHdpdGggaG9va1ZhbHVlLFxuXHQgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gcmVjb25zdHJ1Y3QgdGhlIHJvb3RQcm9wZXJ0eVZhbHVlIHN0cmluZy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZVBhcnRzID0gcm9vdFByb3BlcnR5VmFsdWUudG9TdHJpbmcoKS5tYXRjaChDU1MuUmVnRXgudmFsdWVTcGxpdCk7XG5cdCAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWVQYXJ0c1tob29rUG9zaXRpb25dID0gaG9va1ZhbHVlO1xuXHQgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlVXBkYXRlZCA9IHJvb3RQcm9wZXJ0eVZhbHVlUGFydHMuam9pbihcIiBcIik7XG5cblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gcm9vdFByb3BlcnR5VmFsdWVVcGRhdGVkO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgcHJvdmlkZWQgZnVsbEhvb2tOYW1lIGlzbid0IGEgcmVnaXN0ZXJlZCBob29rLCByZXR1cm4gdGhlIHJvb3RQcm9wZXJ0eVZhbHVlIHRoYXQgd2FzIHBhc3NlZCBpbi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gcm9vdFByb3BlcnR5VmFsdWU7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgLyoqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICBOb3JtYWxpemF0aW9uc1xuXHQgICAgICAgICoqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAvKiBOb3JtYWxpemF0aW9ucyBzdGFuZGFyZGl6ZSBDU1MgcHJvcGVydHkgbWFuaXB1bGF0aW9uIGJ5IHBvbGx5ZmlsbGluZyBicm93c2VyLXNwZWNpZmljIGltcGxlbWVudGF0aW9ucyAoZS5nLiBvcGFjaXR5KVxuXHQgICAgICAgICAgIGFuZCByZWZvcm1hdHRpbmcgc3BlY2lhbCBwcm9wZXJ0aWVzIChlLmcuIGNsaXAsIHJnYmEpIHRvIGxvb2sgbGlrZSBzdGFuZGFyZCBvbmVzLiAqL1xuXHQgICAgICAgIE5vcm1hbGl6YXRpb25zOiB7XG5cdCAgICAgICAgICAgIC8qIE5vcm1hbGl6YXRpb25zIGFyZSBwYXNzZWQgYSBub3JtYWxpemF0aW9uIHRhcmdldCAoZWl0aGVyIHRoZSBwcm9wZXJ0eSdzIG5hbWUsIGl0cyBleHRyYWN0ZWQgdmFsdWUsIG9yIGl0cyBpbmplY3RlZCB2YWx1ZSksXG5cdCAgICAgICAgICAgICAgIHRoZSB0YXJnZXRlZCBlbGVtZW50ICh3aGljaCBtYXkgbmVlZCB0byBiZSBxdWVyaWVkKSwgYW5kIHRoZSB0YXJnZXRlZCBwcm9wZXJ0eSB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgcmVnaXN0ZXJlZDoge1xuXHQgICAgICAgICAgICAgICAgY2xpcDogZnVuY3Rpb24gKHR5cGUsIGVsZW1lbnQsIHByb3BlcnR5VmFsdWUpIHtcblx0ICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm5hbWVcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcImNsaXBcIjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogQ2xpcCBuZWVkcyB0byBiZSB1bndyYXBwZWQgYW5kIHN0cmlwcGVkIG9mIGl0cyBjb21tYXMgZHVyaW5nIGV4dHJhY3Rpb24uICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJleHRyYWN0XCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXh0cmFjdGVkO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiBWZWxvY2l0eSBhbHNvIGV4dHJhY3RlZCB0aGlzIHZhbHVlLCBza2lwIGV4dHJhY3Rpb24uICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ1NTLlJlZ0V4LndyYXBwZWRWYWx1ZUFscmVhZHlFeHRyYWN0ZWQudGVzdChwcm9wZXJ0eVZhbHVlKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhY3RlZCA9IHByb3BlcnR5VmFsdWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFJlbW92ZSB0aGUgXCJyZWN0KClcIiB3cmFwcGVyLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhY3RlZCA9IHByb3BlcnR5VmFsdWUudG9TdHJpbmcoKS5tYXRjaChDU1MuUmVnRXgudmFsdWVVbndyYXApO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU3RyaXAgb2ZmIGNvbW1hcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYWN0ZWQgPSBleHRyYWN0ZWQgPyBleHRyYWN0ZWRbMV0ucmVwbGFjZSgvLChcXHMrKT8vZywgXCIgXCIpIDogcHJvcGVydHlWYWx1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV4dHJhY3RlZDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogQ2xpcCBuZWVkcyB0byBiZSByZS13cmFwcGVkIGR1cmluZyBpbmplY3Rpb24uICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJpbmplY3RcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcInJlY3QoXCIgKyBwcm9wZXJ0eVZhbHVlICsgXCIpXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfSxcblxuXHQgICAgICAgICAgICAgICAgYmx1cjogZnVuY3Rpb24odHlwZSwgZWxlbWVudCwgcHJvcGVydHlWYWx1ZSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwibmFtZVwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFZlbG9jaXR5LlN0YXRlLmlzRmlyZWZveCA/IFwiZmlsdGVyXCIgOiBcIi13ZWJraXQtZmlsdGVyXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJleHRyYWN0XCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXh0cmFjdGVkID0gcGFyc2VGbG9hdChwcm9wZXJ0eVZhbHVlKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgZXh0cmFjdGVkIGlzIE5hTiwgbWVhbmluZyB0aGUgdmFsdWUgaXNuJ3QgYWxyZWFkeSBleHRyYWN0ZWQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIShleHRyYWN0ZWQgfHwgZXh0cmFjdGVkID09PSAwKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBibHVyQ29tcG9uZW50ID0gcHJvcGVydHlWYWx1ZS50b1N0cmluZygpLm1hdGNoKC9ibHVyXFwoKFswLTldK1tBLXpdKylcXCkvaSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgZmlsdGVyIHN0cmluZyBoYWQgYSBibHVyIGNvbXBvbmVudCwgcmV0dXJuIGp1c3QgdGhlIGJsdXIgdmFsdWUgYW5kIHVuaXQgdHlwZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYmx1ckNvbXBvbmVudCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYWN0ZWQgPSBibHVyQ29tcG9uZW50WzFdO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBjb21wb25lbnQgZG9lc24ndCBleGlzdCwgZGVmYXVsdCBibHVyIHRvIDAuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFjdGVkID0gMDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBleHRyYWN0ZWQ7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIEJsdXIgbmVlZHMgdG8gYmUgcmUtd3JhcHBlZCBkdXJpbmcgaW5qZWN0aW9uLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaW5qZWN0XCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBGb3IgdGhlIGJsdXIgZWZmZWN0IHRvIGJlIGZ1bGx5IGRlLWFwcGxpZWQsIGl0IG5lZWRzIHRvIGJlIHNldCB0byBcIm5vbmVcIiBpbnN0ZWFkIG9mIDAuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXBhcnNlRmxvYXQocHJvcGVydHlWYWx1ZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJub25lXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcImJsdXIoXCIgKyBwcm9wZXJ0eVZhbHVlICsgXCIpXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfSxcblxuXHQgICAgICAgICAgICAgICAgLyogPD1JRTggZG8gbm90IHN1cHBvcnQgdGhlIHN0YW5kYXJkIG9wYWNpdHkgcHJvcGVydHkuIFRoZXkgdXNlIGZpbHRlcjphbHBoYShvcGFjaXR5PUlOVCkgaW5zdGVhZC4gKi9cblx0ICAgICAgICAgICAgICAgIG9wYWNpdHk6IGZ1bmN0aW9uICh0eXBlLCBlbGVtZW50LCBwcm9wZXJ0eVZhbHVlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKElFIDw9IDgpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwibmFtZVwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcImZpbHRlclwiO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImV4dHJhY3RcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiA8PUlFOCByZXR1cm4gYSBcImZpbHRlclwiIHZhbHVlIG9mIFwiYWxwaGEob3BhY2l0eT1cXGR7MSwzfSlcIi5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFeHRyYWN0IHRoZSB2YWx1ZSBhbmQgY29udmVydCBpdCB0byBhIGRlY2ltYWwgdmFsdWUgdG8gbWF0Y2ggdGhlIHN0YW5kYXJkIENTUyBvcGFjaXR5IHByb3BlcnR5J3MgZm9ybWF0dGluZy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXh0cmFjdGVkID0gcHJvcGVydHlWYWx1ZS50b1N0cmluZygpLm1hdGNoKC9hbHBoYVxcKG9wYWNpdHk9KC4qKVxcKS9pKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChleHRyYWN0ZWQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQ29udmVydCB0byBkZWNpbWFsIHZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gZXh0cmFjdGVkWzFdIC8gMTAwO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFdoZW4gZXh0cmFjdGluZyBvcGFjaXR5LCBkZWZhdWx0IHRvIDEgc2luY2UgYSBudWxsIHZhbHVlIG1lYW5zIG9wYWNpdHkgaGFzbid0IGJlZW4gc2V0LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gMTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvcGVydHlWYWx1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJpbmplY3RcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBPcGFjaWZpZWQgZWxlbWVudHMgYXJlIHJlcXVpcmVkIHRvIGhhdmUgdGhlaXIgem9vbSBwcm9wZXJ0eSBzZXQgdG8gYSBub24temVybyB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnN0eWxlLnpvb20gPSAxO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU2V0dGluZyB0aGUgZmlsdGVyIHByb3BlcnR5IG9uIGVsZW1lbnRzIHdpdGggY2VydGFpbiBmb250IHByb3BlcnR5IGNvbWJpbmF0aW9ucyBjYW4gcmVzdWx0IGluIGFcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaWdobHkgdW5hcHBlYWxpbmcgdWx0cmEtYm9sZGluZyBlZmZlY3QuIFRoZXJlJ3Mgbm8gd2F5IHRvIHJlbWVkeSB0aGlzIHRocm91Z2hvdXQgYSB0d2VlbiwgYnV0IGRyb3BwaW5nIHRoZVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlIGFsdG9nZXRoZXIgKHdoZW4gb3BhY2l0eSBoaXRzIDEpIGF0IGxlYXN0cyBlbnN1cmVzIHRoYXQgdGhlIGdsaXRjaCBpcyBnb25lIHBvc3QtdHdlZW5pbmcuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlRmxvYXQocHJvcGVydHlWYWx1ZSkgPj0gMSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQXMgcGVyIHRoZSBmaWx0ZXIgcHJvcGVydHkncyBzcGVjLCBjb252ZXJ0IHRoZSBkZWNpbWFsIHZhbHVlIHRvIGEgd2hvbGUgbnVtYmVyIGFuZCB3cmFwIHRoZSB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcImFscGhhKG9wYWNpdHk9XCIgKyBwYXJzZUludChwYXJzZUZsb2F0KHByb3BlcnR5VmFsdWUpICogMTAwLCAxMCkgKyBcIilcIjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAvKiBXaXRoIGFsbCBvdGhlciBicm93c2Vycywgbm9ybWFsaXphdGlvbiBpcyBub3QgcmVxdWlyZWQ7IHJldHVybiB0aGUgc2FtZSB2YWx1ZXMgdGhhdCB3ZXJlIHBhc3NlZCBpbi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJuYW1lXCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwib3BhY2l0eVwiO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImV4dHJhY3RcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvcGVydHlWYWx1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJpbmplY3RcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvcGVydHlWYWx1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfSxcblxuXHQgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgIEJhdGNoZWQgUmVnaXN0cmF0aW9uc1xuXHQgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAvKiBOb3RlOiBCYXRjaGVkIG5vcm1hbGl6YXRpb25zIGV4dGVuZCB0aGUgQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWQgb2JqZWN0LiAqL1xuXHQgICAgICAgICAgICByZWdpc3RlcjogZnVuY3Rpb24gKCkge1xuXG5cdCAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICBUcmFuc2Zvcm1zXG5cdCAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgLyogVHJhbnNmb3JtcyBhcmUgdGhlIHN1YnByb3BlcnRpZXMgY29udGFpbmVkIGJ5IHRoZSBDU1MgXCJ0cmFuc2Zvcm1cIiBwcm9wZXJ0eS4gVHJhbnNmb3JtcyBtdXN0IHVuZGVyZ28gbm9ybWFsaXphdGlvblxuXHQgICAgICAgICAgICAgICAgICAgc28gdGhhdCB0aGV5IGNhbiBiZSByZWZlcmVuY2VkIGluIGEgcHJvcGVydGllcyBtYXAgYnkgdGhlaXIgaW5kaXZpZHVhbCBuYW1lcy4gKi9cblx0ICAgICAgICAgICAgICAgIC8qIE5vdGU6IFdoZW4gdHJhbnNmb3JtcyBhcmUgXCJzZXRcIiwgdGhleSBhcmUgYWN0dWFsbHkgYXNzaWduZWQgdG8gYSBwZXItZWxlbWVudCB0cmFuc2Zvcm1DYWNoZS4gV2hlbiBhbGwgdHJhbnNmb3JtXG5cdCAgICAgICAgICAgICAgICAgICBzZXR0aW5nIGlzIGNvbXBsZXRlIGNvbXBsZXRlLCBDU1MuZmx1c2hUcmFuc2Zvcm1DYWNoZSgpIG11c3QgYmUgbWFudWFsbHkgY2FsbGVkIHRvIGZsdXNoIHRoZSB2YWx1ZXMgdG8gdGhlIERPTS5cblx0ICAgICAgICAgICAgICAgICAgIFRyYW5zZm9ybSBzZXR0aW5nIGlzIGJhdGNoZWQgaW4gdGhpcyB3YXkgdG8gaW1wcm92ZSBwZXJmb3JtYW5jZTogdGhlIHRyYW5zZm9ybSBzdHlsZSBvbmx5IG5lZWRzIHRvIGJlIHVwZGF0ZWRcblx0ICAgICAgICAgICAgICAgICAgIG9uY2Ugd2hlbiBtdWx0aXBsZSB0cmFuc2Zvcm0gc3VicHJvcGVydGllcyBhcmUgYmVpbmcgYW5pbWF0ZWQgc2ltdWx0YW5lb3VzbHkuICovXG5cdCAgICAgICAgICAgICAgICAvKiBOb3RlOiBJRTkgYW5kIEFuZHJvaWQgR2luZ2VyYnJlYWQgaGF2ZSBzdXBwb3J0IGZvciAyRCAtLSBidXQgbm90IDNEIC0tIHRyYW5zZm9ybXMuIFNpbmNlIGFuaW1hdGluZyB1bnN1cHBvcnRlZFxuXHQgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtIHByb3BlcnRpZXMgcmVzdWx0cyBpbiB0aGUgYnJvd3NlciBpZ25vcmluZyB0aGUgKmVudGlyZSogdHJhbnNmb3JtIHN0cmluZywgd2UgcHJldmVudCB0aGVzZSAzRCB2YWx1ZXNcblx0ICAgICAgICAgICAgICAgICAgIGZyb20gYmVpbmcgbm9ybWFsaXplZCBmb3IgdGhlc2UgYnJvd3NlcnMgc28gdGhhdCB0d2VlbmluZyBza2lwcyB0aGVzZSBwcm9wZXJ0aWVzIGFsdG9nZXRoZXJcblx0ICAgICAgICAgICAgICAgICAgIChzaW5jZSBpdCB3aWxsIGlnbm9yZSB0aGVtIGFzIGJlaW5nIHVuc3VwcG9ydGVkIGJ5IHRoZSBicm93c2VyLikgKi9cblx0ICAgICAgICAgICAgICAgIGlmICghKElFIDw9IDkpICYmICFWZWxvY2l0eS5TdGF0ZS5pc0dpbmdlcmJyZWFkKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogU2luY2UgdGhlIHN0YW5kYWxvbmUgQ1NTIFwicGVyc3BlY3RpdmVcIiBwcm9wZXJ0eSBhbmQgdGhlIENTUyB0cmFuc2Zvcm0gXCJwZXJzcGVjdGl2ZVwiIHN1YnByb3BlcnR5XG5cdCAgICAgICAgICAgICAgICAgICAgc2hhcmUgdGhlIHNhbWUgbmFtZSwgdGhlIGxhdHRlciBpcyBnaXZlbiBhIHVuaXF1ZSB0b2tlbiB3aXRoaW4gVmVsb2NpdHk6IFwidHJhbnNmb3JtUGVyc3BlY3RpdmVcIi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBDU1MuTGlzdHMudHJhbnNmb3Jtc0Jhc2UgPSBDU1MuTGlzdHMudHJhbnNmb3Jtc0Jhc2UuY29uY2F0KENTUy5MaXN0cy50cmFuc2Zvcm1zM0QpO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IENTUy5MaXN0cy50cmFuc2Zvcm1zQmFzZS5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIFdyYXAgdGhlIGR5bmFtaWNhbGx5IGdlbmVyYXRlZCBub3JtYWxpemF0aW9uIGZ1bmN0aW9uIGluIGEgbmV3IHNjb3BlIHNvIHRoYXQgdHJhbnNmb3JtTmFtZSdzIHZhbHVlIGlzXG5cdCAgICAgICAgICAgICAgICAgICAgcGFpcmVkIHdpdGggaXRzIHJlc3BlY3RpdmUgZnVuY3Rpb24uIChPdGhlcndpc2UsIGFsbCBmdW5jdGlvbnMgd291bGQgdGFrZSB0aGUgZmluYWwgZm9yIGxvb3AncyB0cmFuc2Zvcm1OYW1lLikgKi9cblx0ICAgICAgICAgICAgICAgICAgICAoZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0cmFuc2Zvcm1OYW1lID0gQ1NTLkxpc3RzLnRyYW5zZm9ybXNCYXNlW2ldO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3RyYW5zZm9ybU5hbWVdID0gZnVuY3Rpb24gKHR5cGUsIGVsZW1lbnQsIHByb3BlcnR5VmFsdWUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRoZSBub3JtYWxpemVkIHByb3BlcnR5IG5hbWUgaXMgdGhlIHBhcmVudCBcInRyYW5zZm9ybVwiIHByb3BlcnR5IC0tIHRoZSBwcm9wZXJ0eSB0aGF0IGlzIGFjdHVhbGx5IHNldCBpbiBDU1MuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm5hbWVcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwidHJhbnNmb3JtXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVHJhbnNmb3JtIHZhbHVlcyBhcmUgY2FjaGVkIG9udG8gYSBwZXItZWxlbWVudCB0cmFuc2Zvcm1DYWNoZSBvYmplY3QuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImV4dHJhY3RcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhpcyB0cmFuc2Zvcm0gaGFzIHlldCB0byBiZSBhc3NpZ25lZCBhIHZhbHVlLCByZXR1cm4gaXRzIG51bGwgdmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpID09PSB1bmRlZmluZWQgfHwgRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZVt0cmFuc2Zvcm1OYW1lXSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTY2FsZSBDU1MuTGlzdHMudHJhbnNmb3Jtc0Jhc2UgZGVmYXVsdCB0byAxIHdoZXJlYXMgYWxsIG90aGVyIHRyYW5zZm9ybSBwcm9wZXJ0aWVzIGRlZmF1bHQgdG8gMC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAvXnNjYWxlL2kudGVzdCh0cmFuc2Zvcm1OYW1lKSA/IDEgOiAwO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBXaGVuIHRyYW5zZm9ybSB2YWx1ZXMgYXJlIHNldCwgdGhleSBhcmUgd3JhcHBlZCBpbiBwYXJlbnRoZXNlcyBhcyBwZXIgdGhlIENTUyBzcGVjLlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUaHVzLCB3aGVuIGV4dHJhY3RpbmcgdGhlaXIgdmFsdWVzIChmb3IgdHdlZW4gY2FsY3VsYXRpb25zKSwgd2Ugc3RyaXAgb2ZmIHRoZSBwYXJlbnRoZXNlcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlW3RyYW5zZm9ybU5hbWVdLnJlcGxhY2UoL1soKV0vZywgXCJcIik7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaW5qZWN0XCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbnZhbGlkID0gZmFsc2U7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgYW4gaW5kaXZpZHVhbCB0cmFuc2Zvcm0gcHJvcGVydHkgY29udGFpbnMgYW4gdW5zdXBwb3J0ZWQgdW5pdCB0eXBlLCB0aGUgYnJvd3NlciBpZ25vcmVzIHRoZSAqZW50aXJlKiB0cmFuc2Zvcm0gcHJvcGVydHkuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRodXMsIHByb3RlY3QgdXNlcnMgZnJvbSB0aGVtc2VsdmVzIGJ5IHNraXBwaW5nIHNldHRpbmcgZm9yIHRyYW5zZm9ybSB2YWx1ZXMgc3VwcGxpZWQgd2l0aCBpbnZhbGlkIHVuaXQgdHlwZXMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFN3aXRjaCBvbiB0aGUgYmFzZSB0cmFuc2Zvcm0gdHlwZTsgaWdub3JlIHRoZSBheGlzIGJ5IHJlbW92aW5nIHRoZSBsYXN0IGxldHRlciBmcm9tIHRoZSB0cmFuc2Zvcm0ncyBuYW1lLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHRyYW5zZm9ybU5hbWUuc3Vic3RyKDAsIHRyYW5zZm9ybU5hbWUubGVuZ3RoIC0gMSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFdoaXRlbGlzdCB1bml0IHR5cGVzIGZvciBlYWNoIHRyYW5zZm9ybS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJ0cmFuc2xhdGVcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnZhbGlkID0gIS8oJXxweHxlbXxyZW18dnd8dmh8XFxkKSQvaS50ZXN0KHByb3BlcnR5VmFsdWUpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU2luY2UgYW4gYXhpcy1mcmVlIFwic2NhbGVcIiBwcm9wZXJ0eSBpcyBzdXBwb3J0ZWQgYXMgd2VsbCwgYSBsaXR0bGUgaGFjayBpcyB1c2VkIGhlcmUgdG8gZGV0ZWN0IGl0IGJ5IGNob3BwaW5nIG9mZiBpdHMgbGFzdCBsZXR0ZXIuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwic2NhbFwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcInNjYWxlXCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQ2hyb21lIG9uIEFuZHJvaWQgaGFzIGEgYnVnIGluIHdoaWNoIHNjYWxlZCBlbGVtZW50cyBibHVyIGlmIHRoZWlyIGluaXRpYWwgc2NhbGVcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSBpcyBiZWxvdyAxICh3aGljaCBjYW4gaGFwcGVuIHdpdGggZm9yY2VmZWVkaW5nKS4gVGh1cywgd2UgZGV0ZWN0IGEgeWV0LXVuc2V0IHNjYWxlIHByb3BlcnR5XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kIGVuc3VyZSB0aGF0IGl0cyBmaXJzdCB2YWx1ZSBpcyBhbHdheXMgMS4gTW9yZSBpbmZvOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwNDE3ODkwL2NzczMtYW5pbWF0aW9ucy13aXRoLXRyYW5zZm9ybS1jYXVzZXMtYmx1cnJlZC1lbGVtZW50cy1vbi13ZWJraXQvMTA0MTc5NjIjMTA0MTc5NjIgKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoVmVsb2NpdHkuU3RhdGUuaXNBbmRyb2lkICYmIERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGVbdHJhbnNmb3JtTmFtZV0gPT09IHVuZGVmaW5lZCAmJiBwcm9wZXJ0eVZhbHVlIDwgMSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gMTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnZhbGlkID0gIS8oXFxkKSQvaS50ZXN0KHByb3BlcnR5VmFsdWUpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcInNrZXdcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnZhbGlkID0gIS8oZGVnfFxcZCkkL2kudGVzdChwcm9wZXJ0eVZhbHVlKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJyb3RhdGVcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnZhbGlkID0gIS8oZGVnfFxcZCkkL2kudGVzdChwcm9wZXJ0eVZhbHVlKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaW52YWxpZCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQXMgcGVyIHRoZSBDU1Mgc3BlYywgd3JhcCB0aGUgdmFsdWUgaW4gcGFyZW50aGVzZXMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlW3RyYW5zZm9ybU5hbWVdID0gXCIoXCIgKyBwcm9wZXJ0eVZhbHVlICsgXCIpXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBBbHRob3VnaCB0aGUgdmFsdWUgaXMgc2V0IG9uIHRoZSB0cmFuc2Zvcm1DYWNoZSBvYmplY3QsIHJldHVybiB0aGUgbmV3bHktdXBkYXRlZCB2YWx1ZSBmb3IgdGhlIGNhbGxpbmcgY29kZSB0byBwcm9jZXNzIGFzIG5vcm1hbC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGVbdHJhbnNmb3JtTmFtZV07XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cdCAgICAgICAgICAgICAgICAgICAgfSkoKTtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICBDb2xvcnNcblx0ICAgICAgICAgICAgICAgICoqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgIC8qIFNpbmNlIFZlbG9jaXR5IG9ubHkgYW5pbWF0ZXMgYSBzaW5nbGUgbnVtZXJpYyB2YWx1ZSBwZXIgcHJvcGVydHksIGNvbG9yIGFuaW1hdGlvbiBpcyBhY2hpZXZlZCBieSBob29raW5nIHRoZSBpbmRpdmlkdWFsIFJHQkEgY29tcG9uZW50cyBvZiBDU1MgY29sb3IgcHJvcGVydGllcy5cblx0ICAgICAgICAgICAgICAgICAgIEFjY29yZGluZ2x5LCBjb2xvciB2YWx1ZXMgbXVzdCBiZSBub3JtYWxpemVkIChlLmcuIFwiI2ZmMDAwMFwiLCBcInJlZFwiLCBhbmQgXCJyZ2IoMjU1LCAwLCAwKVwiID09PiBcIjI1NSAwIDAgMVwiKSBzbyB0aGF0IHRoZWlyIGNvbXBvbmVudHMgY2FuIGJlIGluamVjdGVkL2V4dHJhY3RlZCBieSBDU1MuSG9va3MgbG9naWMuICovXG5cdCAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IENTUy5MaXN0cy5jb2xvcnMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgICAgICAvKiBXcmFwIHRoZSBkeW5hbWljYWxseSBnZW5lcmF0ZWQgbm9ybWFsaXphdGlvbiBmdW5jdGlvbiBpbiBhIG5ldyBzY29wZSBzbyB0aGF0IGNvbG9yTmFtZSdzIHZhbHVlIGlzIHBhaXJlZCB3aXRoIGl0cyByZXNwZWN0aXZlIGZ1bmN0aW9uLlxuXHQgICAgICAgICAgICAgICAgICAgICAgIChPdGhlcndpc2UsIGFsbCBmdW5jdGlvbnMgd291bGQgdGFrZSB0aGUgZmluYWwgZm9yIGxvb3AncyBjb2xvck5hbWUuKSAqL1xuXHQgICAgICAgICAgICAgICAgICAgIChmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb2xvck5hbWUgPSBDU1MuTGlzdHMuY29sb3JzW2ldO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IEluIElFPD04LCB3aGljaCBzdXBwb3J0IHJnYiBidXQgbm90IHJnYmEsIGNvbG9yIHByb3BlcnRpZXMgYXJlIHJldmVydGVkIHRvIHJnYiBieSBzdHJpcHBpbmcgb2ZmIHRoZSBhbHBoYSBjb21wb25lbnQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW2NvbG9yTmFtZV0gPSBmdW5jdGlvbih0eXBlLCBlbGVtZW50LCBwcm9wZXJ0eVZhbHVlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwibmFtZVwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sb3JOYW1lO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENvbnZlcnQgYWxsIGNvbG9yIHZhbHVlcyBpbnRvIHRoZSByZ2IgZm9ybWF0LiAoT2xkIElFIGNhbiByZXR1cm4gaGV4IHZhbHVlcyBhbmQgY29sb3IgbmFtZXMgaW5zdGVhZCBvZiByZ2IvcmdiYS4pICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImV4dHJhY3RcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4dHJhY3RlZDtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgY29sb3IgaXMgYWxyZWFkeSBpbiBpdHMgaG9va2FibGUgZm9ybSAoZS5nLiBcIjI1NSAyNTUgMjU1IDFcIikgZHVlIHRvIGhhdmluZyBiZWVuIHByZXZpb3VzbHkgZXh0cmFjdGVkLCBza2lwIGV4dHJhY3Rpb24uICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDU1MuUmVnRXgud3JhcHBlZFZhbHVlQWxyZWFkeUV4dHJhY3RlZC50ZXN0KHByb3BlcnR5VmFsdWUpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYWN0ZWQgPSBwcm9wZXJ0eVZhbHVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnZlcnRlZCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvck5hbWVzID0ge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBibGFjazogXCJyZ2IoMCwgMCwgMClcIixcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmx1ZTogXCJyZ2IoMCwgMCwgMjU1KVwiLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBncmF5OiBcInJnYigxMjgsIDEyOCwgMTI4KVwiLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBncmVlbjogXCJyZ2IoMCwgMTI4LCAwKVwiLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWQ6IFwicmdiKDI1NSwgMCwgMClcIixcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpdGU6IFwicmdiKDI1NSwgMjU1LCAyNTUpXCJcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDb252ZXJ0IGNvbG9yIG5hbWVzIHRvIHJnYi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgvXltBLXpdKyQvaS50ZXN0KHByb3BlcnR5VmFsdWUpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbG9yTmFtZXNbcHJvcGVydHlWYWx1ZV0gIT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb252ZXJ0ZWQgPSBjb2xvck5hbWVzW3Byb3BlcnR5VmFsdWVdXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgYW4gdW5tYXRjaGVkIGNvbG9yIG5hbWUgaXMgcHJvdmlkZWQsIGRlZmF1bHQgdG8gYmxhY2suICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnZlcnRlZCA9IGNvbG9yTmFtZXMuYmxhY2s7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQ29udmVydCBoZXggdmFsdWVzIHRvIHJnYi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoQ1NTLlJlZ0V4LmlzSGV4LnRlc3QocHJvcGVydHlWYWx1ZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb252ZXJ0ZWQgPSBcInJnYihcIiArIENTUy5WYWx1ZXMuaGV4VG9SZ2IocHJvcGVydHlWYWx1ZSkuam9pbihcIiBcIikgKyBcIilcIjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBwcm92aWRlZCBjb2xvciBkb2Vzbid0IG1hdGNoIGFueSBvZiB0aGUgYWNjZXB0ZWQgY29sb3IgZm9ybWF0cywgZGVmYXVsdCB0byBibGFjay4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoISgvXnJnYmE/XFwoL2kudGVzdChwcm9wZXJ0eVZhbHVlKSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb252ZXJ0ZWQgPSBjb2xvck5hbWVzLmJsYWNrO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBSZW1vdmUgdGhlIHN1cnJvdW5kaW5nIFwicmdiL3JnYmEoKVwiIHN0cmluZyB0aGVuIHJlcGxhY2UgY29tbWFzIHdpdGggc3BhY2VzIGFuZCBzdHJpcFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVwZWF0ZWQgc3BhY2VzIChpbiBjYXNlIHRoZSB2YWx1ZSBpbmNsdWRlZCBzcGFjZXMgdG8gYmVnaW4gd2l0aCkuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYWN0ZWQgPSAoY29udmVydGVkIHx8IHByb3BlcnR5VmFsdWUpLnRvU3RyaW5nKCkubWF0Y2goQ1NTLlJlZ0V4LnZhbHVlVW53cmFwKVsxXS5yZXBsYWNlKC8sKFxccyspPy9nLCBcIiBcIik7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTbyBsb25nIGFzIHRoaXMgaXNuJ3QgPD1JRTgsIGFkZCBhIGZvdXJ0aCAoYWxwaGEpIGNvbXBvbmVudCBpZiBpdCdzIG1pc3NpbmcgYW5kIGRlZmF1bHQgaXQgdG8gMSAodmlzaWJsZSkuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKElFIDw9IDgpICYmIGV4dHJhY3RlZC5zcGxpdChcIiBcIikubGVuZ3RoID09PSAzKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYWN0ZWQgKz0gXCIgMVwiO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV4dHJhY3RlZDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaW5qZWN0XCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoaXMgaXMgSUU8PTggYW5kIGFuIGFscGhhIGNvbXBvbmVudCBleGlzdHMsIHN0cmlwIGl0IG9mZi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKElFIDw9IDgpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eVZhbHVlLnNwbGl0KFwiIFwiKS5sZW5ndGggPT09IDQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gcHJvcGVydHlWYWx1ZS5zcGxpdCgvXFxzKy8pLnNsaWNlKDAsIDMpLmpvaW4oXCIgXCIpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBPdGhlcndpc2UsIGFkZCBhIGZvdXJ0aCAoYWxwaGEpIGNvbXBvbmVudCBpZiBpdCdzIG1pc3NpbmcgYW5kIGRlZmF1bHQgaXQgdG8gMSAodmlzaWJsZSkuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHlWYWx1ZS5zcGxpdChcIiBcIikubGVuZ3RoID09PSAzKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlICs9IFwiIDFcIjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFJlLWluc2VydCB0aGUgYnJvd3Nlci1hcHByb3ByaWF0ZSB3cmFwcGVyKFwicmdiL3JnYmEoKVwiKSwgaW5zZXJ0IGNvbW1hcywgYW5kIHN0cmlwIG9mZiBkZWNpbWFsIHVuaXRzXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uIGFsbCB2YWx1ZXMgYnV0IHRoZSBmb3VydGggKFIsIEcsIGFuZCBCIG9ubHkgYWNjZXB0IHdob2xlIG51bWJlcnMpLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKElFIDw9IDggPyBcInJnYlwiIDogXCJyZ2JhXCIpICsgXCIoXCIgKyBwcm9wZXJ0eVZhbHVlLnJlcGxhY2UoL1xccysvZywgXCIsXCIpLnJlcGxhY2UoL1xcLihcXGQpKyg/PSwpL2csIFwiXCIpICsgXCIpXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cdCAgICAgICAgICAgICAgICAgICAgfSkoKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0sXG5cblx0ICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgQ1NTIFByb3BlcnR5IE5hbWVzXG5cdCAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgTmFtZXM6IHtcblx0ICAgICAgICAgICAgLyogQ2FtZWxjYXNlIGEgcHJvcGVydHkgbmFtZSBpbnRvIGl0cyBKYXZhU2NyaXB0IG5vdGF0aW9uIChlLmcuIFwiYmFja2dyb3VuZC1jb2xvclwiID09PiBcImJhY2tncm91bmRDb2xvclwiKS5cblx0ICAgICAgICAgICAgICAgQ2FtZWxjYXNpbmcgaXMgdXNlZCB0byBub3JtYWxpemUgcHJvcGVydHkgbmFtZXMgYmV0d2VlbiBhbmQgYWNyb3NzIGNhbGxzLiAqL1xuXHQgICAgICAgICAgICBjYW1lbENhc2U6IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5LnJlcGxhY2UoLy0oXFx3KS9nLCBmdW5jdGlvbiAobWF0Y2gsIHN1Yk1hdGNoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN1Yk1hdGNoLnRvVXBwZXJDYXNlKCk7XG5cdCAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgfSxcblxuXHQgICAgICAgICAgICAvKiBGb3IgU1ZHIGVsZW1lbnRzLCBzb21lIHByb3BlcnRpZXMgKG5hbWVseSwgZGltZW5zaW9uYWwgb25lcykgYXJlIEdFVC9TRVQgdmlhIHRoZSBlbGVtZW50J3MgSFRNTCBhdHRyaWJ1dGVzIChpbnN0ZWFkIG9mIHZpYSBDU1Mgc3R5bGVzKS4gKi9cblx0ICAgICAgICAgICAgU1ZHQXR0cmlidXRlOiBmdW5jdGlvbiAocHJvcGVydHkpIHtcblx0ICAgICAgICAgICAgICAgIHZhciBTVkdBdHRyaWJ1dGVzID0gXCJ3aWR0aHxoZWlnaHR8eHx5fGN4fGN5fHJ8cnh8cnl8eDF8eDJ8eTF8eTJcIjtcblxuXHQgICAgICAgICAgICAgICAgLyogQ2VydGFpbiBicm93c2VycyByZXF1aXJlIGFuIFNWRyB0cmFuc2Zvcm0gdG8gYmUgYXBwbGllZCBhcyBhbiBhdHRyaWJ1dGUuIChPdGhlcndpc2UsIGFwcGxpY2F0aW9uIHZpYSBDU1MgaXMgcHJlZmVyYWJsZSBkdWUgdG8gM0Qgc3VwcG9ydC4pICovXG5cdCAgICAgICAgICAgICAgICBpZiAoSUUgfHwgKFZlbG9jaXR5LlN0YXRlLmlzQW5kcm9pZCAmJiAhVmVsb2NpdHkuU3RhdGUuaXNDaHJvbWUpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgU1ZHQXR0cmlidXRlcyArPSBcInx0cmFuc2Zvcm1cIjtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAoXCJeKFwiICsgU1ZHQXR0cmlidXRlcyArIFwiKSRcIiwgXCJpXCIpLnRlc3QocHJvcGVydHkpO1xuXHQgICAgICAgICAgICB9LFxuXG5cdCAgICAgICAgICAgIC8qIERldGVybWluZSB3aGV0aGVyIGEgcHJvcGVydHkgc2hvdWxkIGJlIHNldCB3aXRoIGEgdmVuZG9yIHByZWZpeC4gKi9cblx0ICAgICAgICAgICAgLyogSWYgYSBwcmVmaXhlZCB2ZXJzaW9uIG9mIHRoZSBwcm9wZXJ0eSBleGlzdHMsIHJldHVybiBpdC4gT3RoZXJ3aXNlLCByZXR1cm4gdGhlIG9yaWdpbmFsIHByb3BlcnR5IG5hbWUuXG5cdCAgICAgICAgICAgICAgIElmIHRoZSBwcm9wZXJ0eSBpcyBub3QgYXQgYWxsIHN1cHBvcnRlZCBieSB0aGUgYnJvd3NlciwgcmV0dXJuIGEgZmFsc2UgZmxhZy4gKi9cblx0ICAgICAgICAgICAgcHJlZml4Q2hlY2s6IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuXHQgICAgICAgICAgICAgICAgLyogSWYgdGhpcyBwcm9wZXJ0eSBoYXMgYWxyZWFkeSBiZWVuIGNoZWNrZWQsIHJldHVybiB0aGUgY2FjaGVkIHZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKFZlbG9jaXR5LlN0YXRlLnByZWZpeE1hdGNoZXNbcHJvcGVydHldKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsgVmVsb2NpdHkuU3RhdGUucHJlZml4TWF0Y2hlc1twcm9wZXJ0eV0sIHRydWUgXTtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIHZlbmRvcnMgPSBbIFwiXCIsIFwiV2Via2l0XCIsIFwiTW96XCIsIFwibXNcIiwgXCJPXCIgXTtcblxuXHQgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCB2ZW5kb3JzTGVuZ3RoID0gdmVuZG9ycy5sZW5ndGg7IGkgPCB2ZW5kb3JzTGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByb3BlcnR5UHJlZml4ZWQ7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGkgPT09IDApIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5UHJlZml4ZWQgPSBwcm9wZXJ0eTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENhcGl0YWxpemUgdGhlIGZpcnN0IGxldHRlciBvZiB0aGUgcHJvcGVydHkgdG8gY29uZm9ybSB0byBKYXZhU2NyaXB0IHZlbmRvciBwcmVmaXggbm90YXRpb24gKGUuZy4gd2Via2l0RmlsdGVyKS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5UHJlZml4ZWQgPSB2ZW5kb3JzW2ldICsgcHJvcGVydHkucmVwbGFjZSgvXlxcdy8sIGZ1bmN0aW9uKG1hdGNoKSB7IHJldHVybiBtYXRjaC50b1VwcGVyQ2FzZSgpOyB9KTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIENoZWNrIGlmIHRoZSBicm93c2VyIHN1cHBvcnRzIHRoaXMgcHJvcGVydHkgYXMgcHJlZml4ZWQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChUeXBlLmlzU3RyaW5nKFZlbG9jaXR5LlN0YXRlLnByZWZpeEVsZW1lbnQuc3R5bGVbcHJvcGVydHlQcmVmaXhlZF0pKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDYWNoZSB0aGUgbWF0Y2guICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5TdGF0ZS5wcmVmaXhNYXRjaGVzW3Byb3BlcnR5XSA9IHByb3BlcnR5UHJlZml4ZWQ7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbIHByb3BlcnR5UHJlZml4ZWQsIHRydWUgXTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBicm93c2VyIGRvZXNuJ3Qgc3VwcG9ydCB0aGlzIHByb3BlcnR5IGluIGFueSBmb3JtLCBpbmNsdWRlIGEgZmFsc2UgZmxhZyBzbyB0aGF0IHRoZSBjYWxsZXIgY2FuIGRlY2lkZSBob3cgdG8gcHJvY2VlZC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gWyBwcm9wZXJ0eSwgZmFsc2UgXTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0sXG5cblx0ICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgQ1NTIFByb3BlcnR5IFZhbHVlc1xuXHQgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgIFZhbHVlczoge1xuXHQgICAgICAgICAgICAvKiBIZXggdG8gUkdCIGNvbnZlcnNpb24uIENvcHlyaWdodCBUaW0gRG93bjogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy81NjIzODM4L3JnYi10by1oZXgtYW5kLWhleC10by1yZ2IgKi9cblx0ICAgICAgICAgICAgaGV4VG9SZ2I6IGZ1bmN0aW9uIChoZXgpIHtcblx0ICAgICAgICAgICAgICAgIHZhciBzaG9ydGZvcm1SZWdleCA9IC9eIz8oW2EtZlxcZF0pKFthLWZcXGRdKShbYS1mXFxkXSkkL2ksXG5cdCAgICAgICAgICAgICAgICAgICAgbG9uZ2Zvcm1SZWdleCA9IC9eIz8oW2EtZlxcZF17Mn0pKFthLWZcXGRdezJ9KShbYS1mXFxkXXsyfSkkL2ksXG5cdCAgICAgICAgICAgICAgICAgICAgcmdiUGFydHM7XG5cblx0ICAgICAgICAgICAgICAgIGhleCA9IGhleC5yZXBsYWNlKHNob3J0Zm9ybVJlZ2V4LCBmdW5jdGlvbiAobSwgciwgZywgYikge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiByICsgciArIGcgKyBnICsgYiArIGI7XG5cdCAgICAgICAgICAgICAgICB9KTtcblxuXHQgICAgICAgICAgICAgICAgcmdiUGFydHMgPSBsb25nZm9ybVJlZ2V4LmV4ZWMoaGV4KTtcblxuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHJnYlBhcnRzID8gWyBwYXJzZUludChyZ2JQYXJ0c1sxXSwgMTYpLCBwYXJzZUludChyZ2JQYXJ0c1syXSwgMTYpLCBwYXJzZUludChyZ2JQYXJ0c1szXSwgMTYpIF0gOiBbIDAsIDAsIDAgXTtcblx0ICAgICAgICAgICAgfSxcblxuXHQgICAgICAgICAgICBpc0NTU051bGxWYWx1ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG5cdCAgICAgICAgICAgICAgICAvKiBUaGUgYnJvd3NlciBkZWZhdWx0cyBDU1MgdmFsdWVzIHRoYXQgaGF2ZSBub3QgYmVlbiBzZXQgdG8gZWl0aGVyIDAgb3Igb25lIG9mIHNldmVyYWwgcG9zc2libGUgbnVsbC12YWx1ZSBzdHJpbmdzLlxuXHQgICAgICAgICAgICAgICAgICAgVGh1cywgd2UgY2hlY2sgZm9yIGJvdGggZmFsc2luZXNzIGFuZCB0aGVzZSBzcGVjaWFsIHN0cmluZ3MuICovXG5cdCAgICAgICAgICAgICAgICAvKiBOdWxsLXZhbHVlIGNoZWNraW5nIGlzIHBlcmZvcm1lZCB0byBkZWZhdWx0IHRoZSBzcGVjaWFsIHN0cmluZ3MgdG8gMCAoZm9yIHRoZSBzYWtlIG9mIHR3ZWVuaW5nKSBvciB0aGVpciBob29rXG5cdCAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZXMgYXMgZGVmaW5lZCBhcyBDU1MuSG9va3MgKGZvciB0aGUgc2FrZSBvZiBob29rIGluamVjdGlvbi9leHRyYWN0aW9uKS4gKi9cblx0ICAgICAgICAgICAgICAgIC8qIE5vdGU6IENocm9tZSByZXR1cm5zIFwicmdiYSgwLCAwLCAwLCAwKVwiIGZvciBhbiB1bmRlZmluZWQgY29sb3Igd2hlcmVhcyBJRSByZXR1cm5zIFwidHJhbnNwYXJlbnRcIi4gKi9cblx0ICAgICAgICAgICAgICAgIHJldHVybiAodmFsdWUgPT0gMCB8fCAvXihub25lfGF1dG98dHJhbnNwYXJlbnR8KHJnYmFcXCgwLCA/MCwgPzAsID8wXFwpKSkkL2kudGVzdCh2YWx1ZSkpO1xuXHQgICAgICAgICAgICB9LFxuXG5cdCAgICAgICAgICAgIC8qIFJldHJpZXZlIGEgcHJvcGVydHkncyBkZWZhdWx0IHVuaXQgdHlwZS4gVXNlZCBmb3IgYXNzaWduaW5nIGEgdW5pdCB0eXBlIHdoZW4gb25lIGlzIG5vdCBzdXBwbGllZCBieSB0aGUgdXNlci4gKi9cblx0ICAgICAgICAgICAgZ2V0VW5pdFR5cGU6IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuXHQgICAgICAgICAgICAgICAgaWYgKC9eKHJvdGF0ZXxza2V3KS9pLnRlc3QocHJvcGVydHkpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiZGVnXCI7XG5cdCAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC8oXihzY2FsZXxzY2FsZVh8c2NhbGVZfHNjYWxlWnxhbHBoYXxmbGV4R3Jvd3xmbGV4SGVpZ2h0fHpJbmRleHxmb250V2VpZ2h0KSQpfCgob3BhY2l0eXxyZWR8Z3JlZW58Ymx1ZXxhbHBoYSkkKS9pLnRlc3QocHJvcGVydHkpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogVGhlIGFib3ZlIHByb3BlcnRpZXMgYXJlIHVuaXRsZXNzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBcIlwiO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAvKiBEZWZhdWx0IHRvIHB4IGZvciBhbGwgb3RoZXIgcHJvcGVydGllcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJweFwiO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9LFxuXG5cdCAgICAgICAgICAgIC8qIEhUTUwgZWxlbWVudHMgZGVmYXVsdCB0byBhbiBhc3NvY2lhdGVkIGRpc3BsYXkgdHlwZSB3aGVuIHRoZXkncmUgbm90IHNldCB0byBkaXNwbGF5Om5vbmUuICovXG5cdCAgICAgICAgICAgIC8qIE5vdGU6IFRoaXMgZnVuY3Rpb24gaXMgdXNlZCBmb3IgY29ycmVjdGx5IHNldHRpbmcgdGhlIG5vbi1cIm5vbmVcIiBkaXNwbGF5IHZhbHVlIGluIGNlcnRhaW4gVmVsb2NpdHkgcmVkaXJlY3RzLCBzdWNoIGFzIGZhZGVJbi9PdXQuICovXG5cdCAgICAgICAgICAgIGdldERpc3BsYXlUeXBlOiBmdW5jdGlvbiAoZWxlbWVudCkge1xuXHQgICAgICAgICAgICAgICAgdmFyIHRhZ05hbWUgPSBlbGVtZW50ICYmIGVsZW1lbnQudGFnTmFtZS50b1N0cmluZygpLnRvTG93ZXJDYXNlKCk7XG5cblx0ICAgICAgICAgICAgICAgIGlmICgvXihifGJpZ3xpfHNtYWxsfHR0fGFiYnJ8YWNyb255bXxjaXRlfGNvZGV8ZGZufGVtfGtiZHxzdHJvbmd8c2FtcHx2YXJ8YXxiZG98YnJ8aW1nfG1hcHxvYmplY3R8cXxzY3JpcHR8c3BhbnxzdWJ8c3VwfGJ1dHRvbnxpbnB1dHxsYWJlbHxzZWxlY3R8dGV4dGFyZWEpJC9pLnRlc3QodGFnTmFtZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJpbmxpbmVcIjtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoL14obGkpJC9pLnRlc3QodGFnTmFtZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJsaXN0LWl0ZW1cIjtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoL14odHIpJC9pLnRlc3QodGFnTmFtZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJ0YWJsZS1yb3dcIjtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoL14odGFibGUpJC9pLnRlc3QodGFnTmFtZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJ0YWJsZVwiO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvXih0Ym9keSkkL2kudGVzdCh0YWdOYW1lKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBcInRhYmxlLXJvdy1ncm91cFwiO1xuXHQgICAgICAgICAgICAgICAgLyogRGVmYXVsdCB0byBcImJsb2NrXCIgd2hlbiBubyBtYXRjaCBpcyBmb3VuZC4gKi9cblx0ICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiYmxvY2tcIjtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfSxcblxuXHQgICAgICAgICAgICAvKiBUaGUgY2xhc3MgYWRkL3JlbW92ZSBmdW5jdGlvbnMgYXJlIHVzZWQgdG8gdGVtcG9yYXJpbHkgYXBwbHkgYSBcInZlbG9jaXR5LWFuaW1hdGluZ1wiIGNsYXNzIHRvIGVsZW1lbnRzIHdoaWxlIHRoZXkncmUgYW5pbWF0aW5nLiAqL1xuXHQgICAgICAgICAgICBhZGRDbGFzczogZnVuY3Rpb24gKGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuXHQgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQuY2xhc3NMaXN0KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSk7XG5cdCAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NOYW1lICs9IChlbGVtZW50LmNsYXNzTmFtZS5sZW5ndGggPyBcIiBcIiA6IFwiXCIpICsgY2xhc3NOYW1lO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9LFxuXG5cdCAgICAgICAgICAgIHJlbW92ZUNsYXNzOiBmdW5jdGlvbiAoZWxlbWVudCwgY2xhc3NOYW1lKSB7XG5cdCAgICAgICAgICAgICAgICBpZiAoZWxlbWVudC5jbGFzc0xpc3QpIHtcblx0ICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKTtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgPSBlbGVtZW50LmNsYXNzTmFtZS50b1N0cmluZygpLnJlcGxhY2UobmV3IFJlZ0V4cChcIihefFxcXFxzKVwiICsgY2xhc3NOYW1lLnNwbGl0KFwiIFwiKS5qb2luKFwifFwiKSArIFwiKFxcXFxzfCQpXCIsIFwiZ2lcIiksIFwiIFwiKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0sXG5cblx0ICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgIFN0eWxlIEdldHRpbmcgJiBTZXR0aW5nXG5cdCAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgIC8qIFRoZSBzaW5ndWxhciBnZXRQcm9wZXJ0eVZhbHVlLCB3aGljaCByb3V0ZXMgdGhlIGxvZ2ljIGZvciBhbGwgbm9ybWFsaXphdGlvbnMsIGhvb2tzLCBhbmQgc3RhbmRhcmQgQ1NTIHByb3BlcnRpZXMuICovXG5cdCAgICAgICAgZ2V0UHJvcGVydHlWYWx1ZTogZnVuY3Rpb24gKGVsZW1lbnQsIHByb3BlcnR5LCByb290UHJvcGVydHlWYWx1ZSwgZm9yY2VTdHlsZUxvb2t1cCkge1xuXHQgICAgICAgICAgICAvKiBHZXQgYW4gZWxlbWVudCdzIGNvbXB1dGVkIHByb3BlcnR5IHZhbHVlLiAqL1xuXHQgICAgICAgICAgICAvKiBOb3RlOiBSZXRyaWV2aW5nIHRoZSB2YWx1ZSBvZiBhIENTUyBwcm9wZXJ0eSBjYW5ub3Qgc2ltcGx5IGJlIHBlcmZvcm1lZCBieSBjaGVja2luZyBhbiBlbGVtZW50J3Ncblx0ICAgICAgICAgICAgICAgc3R5bGUgYXR0cmlidXRlICh3aGljaCBvbmx5IHJlZmxlY3RzIHVzZXItZGVmaW5lZCB2YWx1ZXMpLiBJbnN0ZWFkLCB0aGUgYnJvd3NlciBtdXN0IGJlIHF1ZXJpZWQgZm9yIGEgcHJvcGVydHknc1xuXHQgICAgICAgICAgICAgICAqY29tcHV0ZWQqIHZhbHVlLiBZb3UgY2FuIHJlYWQgbW9yZSBhYm91dCBnZXRDb21wdXRlZFN0eWxlIGhlcmU6IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuL2RvY3MvV2ViL0FQSS93aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSAqL1xuXHQgICAgICAgICAgICBmdW5jdGlvbiBjb21wdXRlUHJvcGVydHlWYWx1ZSAoZWxlbWVudCwgcHJvcGVydHkpIHtcblx0ICAgICAgICAgICAgICAgIC8qIFdoZW4gYm94LXNpemluZyBpc24ndCBzZXQgdG8gYm9yZGVyLWJveCwgaGVpZ2h0IGFuZCB3aWR0aCBzdHlsZSB2YWx1ZXMgYXJlIGluY29ycmVjdGx5IGNvbXB1dGVkIHdoZW4gYW5cblx0ICAgICAgICAgICAgICAgICAgIGVsZW1lbnQncyBzY3JvbGxiYXJzIGFyZSB2aXNpYmxlICh3aGljaCBleHBhbmRzIHRoZSBlbGVtZW50J3MgZGltZW5zaW9ucykuIFRodXMsIHdlIGRlZmVyIHRvIHRoZSBtb3JlIGFjY3VyYXRlXG5cdCAgICAgICAgICAgICAgICAgICBvZmZzZXRIZWlnaHQvV2lkdGggcHJvcGVydHksIHdoaWNoIGluY2x1ZGVzIHRoZSB0b3RhbCBkaW1lbnNpb25zIGZvciBpbnRlcmlvciwgYm9yZGVyLCBwYWRkaW5nLCBhbmQgc2Nyb2xsYmFyLlxuXHQgICAgICAgICAgICAgICAgICAgV2Ugc3VidHJhY3QgYm9yZGVyIGFuZCBwYWRkaW5nIHRvIGdldCB0aGUgc3VtIG9mIGludGVyaW9yICsgc2Nyb2xsYmFyLiAqL1xuXHQgICAgICAgICAgICAgICAgdmFyIGNvbXB1dGVkVmFsdWUgPSAwO1xuXG5cdCAgICAgICAgICAgICAgICAvKiBJRTw9OCBkb2Vzbid0IHN1cHBvcnQgd2luZG93LmdldENvbXB1dGVkU3R5bGUsIHRodXMgd2UgZGVmZXIgdG8galF1ZXJ5LCB3aGljaCBoYXMgYW4gZXh0ZW5zaXZlIGFycmF5XG5cdCAgICAgICAgICAgICAgICAgICBvZiBoYWNrcyB0byBhY2N1cmF0ZWx5IHJldHJpZXZlIElFOCBwcm9wZXJ0eSB2YWx1ZXMuIFJlLWltcGxlbWVudGluZyB0aGF0IGxvZ2ljIGhlcmUgaXMgbm90IHdvcnRoIGJsb2F0aW5nIHRoZVxuXHQgICAgICAgICAgICAgICAgICAgY29kZWJhc2UgZm9yIGEgZHlpbmcgYnJvd3Nlci4gVGhlIHBlcmZvcm1hbmNlIHJlcGVyY3Vzc2lvbnMgb2YgdXNpbmcgalF1ZXJ5IGhlcmUgYXJlIG1pbmltYWwgc2luY2Vcblx0ICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5IGlzIG9wdGltaXplZCB0byByYXJlbHkgKGFuZCBzb21ldGltZXMgbmV2ZXIpIHF1ZXJ5IHRoZSBET00uIEZ1cnRoZXIsIHRoZSAkLmNzcygpIGNvZGVwYXRoIGlzbid0IHRoYXQgc2xvdy4gKi9cblx0ICAgICAgICAgICAgICAgIGlmIChJRSA8PSA4KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWRWYWx1ZSA9ICQuY3NzKGVsZW1lbnQsIHByb3BlcnR5KTsgLyogR0VUICovXG5cdCAgICAgICAgICAgICAgICAvKiBBbGwgb3RoZXIgYnJvd3NlcnMgc3VwcG9ydCBnZXRDb21wdXRlZFN0eWxlLiBUaGUgcmV0dXJuZWQgbGl2ZSBvYmplY3QgcmVmZXJlbmNlIGlzIGNhY2hlZCBvbnRvIGl0c1xuXHQgICAgICAgICAgICAgICAgICAgYXNzb2NpYXRlZCBlbGVtZW50IHNvIHRoYXQgaXQgZG9lcyBub3QgbmVlZCB0byBiZSByZWZldGNoZWQgdXBvbiBldmVyeSBHRVQuICovXG5cdCAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIEJyb3dzZXJzIGRvIG5vdCByZXR1cm4gaGVpZ2h0IGFuZCB3aWR0aCB2YWx1ZXMgZm9yIGVsZW1lbnRzIHRoYXQgYXJlIHNldCB0byBkaXNwbGF5Olwibm9uZVwiLiBUaHVzLCB3ZSB0ZW1wb3JhcmlseVxuXHQgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZSBkaXNwbGF5IHRvIHRoZSBlbGVtZW50IHR5cGUncyBkZWZhdWx0IHZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciB0b2dnbGVEaXNwbGF5ID0gZmFsc2U7XG5cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoL14od2lkdGh8aGVpZ2h0KSQvLnRlc3QocHJvcGVydHkpICYmIENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiZGlzcGxheVwiKSA9PT0gMCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB0b2dnbGVEaXNwbGF5ID0gdHJ1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgQ1NTLnNldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJkaXNwbGF5XCIsIENTUy5WYWx1ZXMuZ2V0RGlzcGxheVR5cGUoZWxlbWVudCkpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHJldmVydERpc3BsYXkgKCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAodG9nZ2xlRGlzcGxheSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ1NTLnNldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIGlmICghZm9yY2VTdHlsZUxvb2t1cCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydHkgPT09IFwiaGVpZ2h0XCIgJiYgQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJib3hTaXppbmdcIikudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpICE9PSBcImJvcmRlci1ib3hcIikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRCb3hIZWlnaHQgPSBlbGVtZW50Lm9mZnNldEhlaWdodCAtIChwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiYm9yZGVyVG9wV2lkdGhcIikpIHx8IDApIC0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJib3JkZXJCb3R0b21XaWR0aFwiKSkgfHwgMCkgLSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcInBhZGRpbmdUb3BcIikpIHx8IDApIC0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJwYWRkaW5nQm90dG9tXCIpKSB8fCAwKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldmVydERpc3BsYXkoKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnRCb3hIZWlnaHQ7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydHkgPT09IFwid2lkdGhcIiAmJiBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImJveFNpemluZ1wiKS50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgIT09IFwiYm9yZGVyLWJveFwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29udGVudEJveFdpZHRoID0gZWxlbWVudC5vZmZzZXRXaWR0aCAtIChwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiYm9yZGVyTGVmdFdpZHRoXCIpKSB8fCAwKSAtIChwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiYm9yZGVyUmlnaHRXaWR0aFwiKSkgfHwgMCkgLSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcInBhZGRpbmdMZWZ0XCIpKSB8fCAwKSAtIChwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwicGFkZGluZ1JpZ2h0XCIpKSB8fCAwKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldmVydERpc3BsYXkoKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRlbnRCb3hXaWR0aDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIHZhciBjb21wdXRlZFN0eWxlO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogRm9yIGVsZW1lbnRzIHRoYXQgVmVsb2NpdHkgaGFzbid0IGJlZW4gY2FsbGVkIG9uIGRpcmVjdGx5IChlLmcuIHdoZW4gVmVsb2NpdHkgcXVlcmllcyB0aGUgRE9NIG9uIGJlaGFsZlxuXHQgICAgICAgICAgICAgICAgICAgICAgIG9mIGEgcGFyZW50IG9mIGFuIGVsZW1lbnQgaXRzIGFuaW1hdGluZyksIHBlcmZvcm0gYSBkaXJlY3QgZ2V0Q29tcHV0ZWRTdHlsZSBsb29rdXAgc2luY2UgdGhlIG9iamVjdCBpc24ndCBjYWNoZWQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjb21wdXRlZFN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbWVudCwgbnVsbCk7IC8qIEdFVCAqL1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBjb21wdXRlZFN0eWxlIG9iamVjdCBoYXMgeWV0IHRvIGJlIGNhY2hlZCwgZG8gc28gbm93LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIURhdGEoZWxlbWVudCkuY29tcHV0ZWRTdHlsZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjb21wdXRlZFN0eWxlID0gRGF0YShlbGVtZW50KS5jb21wdXRlZFN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbWVudCwgbnVsbCk7IC8qIEdFVCAqL1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIElmIGNvbXB1dGVkU3R5bGUgaXMgY2FjaGVkLCB1c2UgaXQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWRTdHlsZSA9IERhdGEoZWxlbWVudCkuY29tcHV0ZWRTdHlsZTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBJRSBhbmQgRmlyZWZveCBkbyBub3QgcmV0dXJuIGEgdmFsdWUgZm9yIHRoZSBnZW5lcmljIGJvcmRlckNvbG9yIC0tIHRoZXkgb25seSByZXR1cm4gaW5kaXZpZHVhbCB2YWx1ZXMgZm9yIGVhY2ggYm9yZGVyIHNpZGUncyBjb2xvci5cblx0ICAgICAgICAgICAgICAgICAgICAgICBBbHNvLCBpbiBhbGwgYnJvd3NlcnMsIHdoZW4gYm9yZGVyIGNvbG9ycyBhcmVuJ3QgYWxsIHRoZSBzYW1lLCBhIGNvbXBvdW5kIHZhbHVlIGlzIHJldHVybmVkIHRoYXQgVmVsb2NpdHkgaXNuJ3Qgc2V0dXAgdG8gcGFyc2UuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgU28sIGFzIGEgcG9seWZpbGwgZm9yIHF1ZXJ5aW5nIGluZGl2aWR1YWwgYm9yZGVyIHNpZGUgY29sb3JzLCB3ZSBqdXN0IHJldHVybiB0aGUgdG9wIGJvcmRlcidzIGNvbG9yIGFuZCBhbmltYXRlIGFsbCBib3JkZXJzIGZyb20gdGhhdCB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydHkgPT09IFwiYm9yZGVyQ29sb3JcIikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eSA9IFwiYm9yZGVyVG9wQ29sb3JcIjtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBJRTkgaGFzIGEgYnVnIGluIHdoaWNoIHRoZSBcImZpbHRlclwiIHByb3BlcnR5IG11c3QgYmUgYWNjZXNzZWQgZnJvbSBjb21wdXRlZFN0eWxlIHVzaW5nIHRoZSBnZXRQcm9wZXJ0eVZhbHVlIG1ldGhvZFxuXHQgICAgICAgICAgICAgICAgICAgICAgIGluc3RlYWQgb2YgYSBkaXJlY3QgcHJvcGVydHkgbG9va3VwLiBUaGUgZ2V0UHJvcGVydHlWYWx1ZSBtZXRob2QgaXMgc2xvd2VyIHRoYW4gYSBkaXJlY3QgbG9va3VwLCB3aGljaCBpcyB3aHkgd2UgYXZvaWQgaXQgYnkgZGVmYXVsdC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoSUUgPT09IDkgJiYgcHJvcGVydHkgPT09IFwiZmlsdGVyXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWRWYWx1ZSA9IGNvbXB1dGVkU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZShwcm9wZXJ0eSk7IC8qIEdFVCAqL1xuXHQgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkVmFsdWUgPSBjb21wdXRlZFN0eWxlW3Byb3BlcnR5XTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBGYWxsIGJhY2sgdG8gdGhlIHByb3BlcnR5J3Mgc3R5bGUgdmFsdWUgKGlmIGRlZmluZWQpIHdoZW4gY29tcHV0ZWRWYWx1ZSByZXR1cm5zIG5vdGhpbmcsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgd2hpY2ggY2FuIGhhcHBlbiB3aGVuIHRoZSBlbGVtZW50IGhhc24ndCBiZWVuIHBhaW50ZWQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXB1dGVkVmFsdWUgPT09IFwiXCIgfHwgY29tcHV0ZWRWYWx1ZSA9PT0gbnVsbCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjb21wdXRlZFZhbHVlID0gZWxlbWVudC5zdHlsZVtwcm9wZXJ0eV07XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgcmV2ZXJ0RGlzcGxheSgpO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAvKiBGb3IgdG9wLCByaWdodCwgYm90dG9tLCBhbmQgbGVmdCAoVFJCTCkgdmFsdWVzIHRoYXQgYXJlIHNldCB0byBcImF1dG9cIiBvbiBlbGVtZW50cyBvZiBcImZpeGVkXCIgb3IgXCJhYnNvbHV0ZVwiIHBvc2l0aW9uLFxuXHQgICAgICAgICAgICAgICAgICAgZGVmZXIgdG8galF1ZXJ5IGZvciBjb252ZXJ0aW5nIFwiYXV0b1wiIHRvIGEgbnVtZXJpYyB2YWx1ZS4gKEZvciBlbGVtZW50cyB3aXRoIGEgXCJzdGF0aWNcIiBvciBcInJlbGF0aXZlXCIgcG9zaXRpb24sIFwiYXV0b1wiIGhhcyB0aGUgc2FtZVxuXHQgICAgICAgICAgICAgICAgICAgZWZmZWN0IGFzIGJlaW5nIHNldCB0byAwLCBzbyBubyBjb252ZXJzaW9uIGlzIG5lY2Vzc2FyeS4pICovXG5cdCAgICAgICAgICAgICAgICAvKiBBbiBleGFtcGxlIG9mIHdoeSBudW1lcmljIGNvbnZlcnNpb24gaXMgbmVjZXNzYXJ5OiBXaGVuIGFuIGVsZW1lbnQgd2l0aCBcInBvc2l0aW9uOmFic29sdXRlXCIgaGFzIGFuIHVudG91Y2hlZCBcImxlZnRcIlxuXHQgICAgICAgICAgICAgICAgICAgcHJvcGVydHksIHdoaWNoIHJldmVydHMgdG8gXCJhdXRvXCIsIGxlZnQncyB2YWx1ZSBpcyAwIHJlbGF0aXZlIHRvIGl0cyBwYXJlbnQgZWxlbWVudCwgYnV0IGlzIG9mdGVuIG5vbi16ZXJvIHJlbGF0aXZlXG5cdCAgICAgICAgICAgICAgICAgICB0byBpdHMgKmNvbnRhaW5pbmcqIChub3QgcGFyZW50KSBlbGVtZW50LCB3aGljaCBpcyB0aGUgbmVhcmVzdCBcInBvc2l0aW9uOnJlbGF0aXZlXCIgYW5jZXN0b3Igb3IgdGhlIHZpZXdwb3J0IChhbmQgYWx3YXlzIHRoZSB2aWV3cG9ydCBpbiB0aGUgY2FzZSBvZiBcInBvc2l0aW9uOmZpeGVkXCIpLiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKGNvbXB1dGVkVmFsdWUgPT09IFwiYXV0b1wiICYmIC9eKHRvcHxyaWdodHxib3R0b218bGVmdCkkL2kudGVzdChwcm9wZXJ0eSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgcG9zaXRpb24gPSBjb21wdXRlUHJvcGVydHlWYWx1ZShlbGVtZW50LCBcInBvc2l0aW9uXCIpOyAvKiBHRVQgKi9cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIEZvciBhYnNvbHV0ZSBwb3NpdGlvbmluZywgalF1ZXJ5J3MgJC5wb3NpdGlvbigpIG9ubHkgcmV0dXJucyB2YWx1ZXMgZm9yIHRvcCBhbmQgbGVmdDtcblx0ICAgICAgICAgICAgICAgICAgICAgICByaWdodCBhbmQgYm90dG9tIHdpbGwgaGF2ZSB0aGVpciBcImF1dG9cIiB2YWx1ZSByZXZlcnRlZCB0byAwLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IEEgalF1ZXJ5IG9iamVjdCBtdXN0IGJlIGNyZWF0ZWQgaGVyZSBzaW5jZSBqUXVlcnkgZG9lc24ndCBoYXZlIGEgbG93LWxldmVsIGFsaWFzIGZvciAkLnBvc2l0aW9uKCkuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgTm90IGEgYmlnIGRlYWwgc2luY2Ugd2UncmUgY3VycmVudGx5IGluIGEgR0VUIGJhdGNoIGFueXdheS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAocG9zaXRpb24gPT09IFwiZml4ZWRcIiB8fCAocG9zaXRpb24gPT09IFwiYWJzb2x1dGVcIiAmJiAvdG9wfGxlZnQvaS50ZXN0KHByb3BlcnR5KSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogalF1ZXJ5IHN0cmlwcyB0aGUgcGl4ZWwgdW5pdCBmcm9tIGl0cyByZXR1cm5lZCB2YWx1ZXM7IHdlIHJlLWFkZCBpdCBoZXJlIHRvIGNvbmZvcm0gd2l0aCBjb21wdXRlUHJvcGVydHlWYWx1ZSdzIGJlaGF2aW9yLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjb21wdXRlZFZhbHVlID0gJChlbGVtZW50KS5wb3NpdGlvbigpW3Byb3BlcnR5XSArIFwicHhcIjsgLyogR0VUICovXG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICByZXR1cm4gY29tcHV0ZWRWYWx1ZTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHZhciBwcm9wZXJ0eVZhbHVlO1xuXG5cdCAgICAgICAgICAgIC8qIElmIHRoaXMgaXMgYSBob29rZWQgcHJvcGVydHkgKGUuZy4gXCJjbGlwTGVmdFwiIGluc3RlYWQgb2YgdGhlIHJvb3QgcHJvcGVydHkgb2YgXCJjbGlwXCIpLFxuXHQgICAgICAgICAgICAgICBleHRyYWN0IHRoZSBob29rJ3MgdmFsdWUgZnJvbSBhIG5vcm1hbGl6ZWQgcm9vdFByb3BlcnR5VmFsdWUgdXNpbmcgQ1NTLkhvb2tzLmV4dHJhY3RWYWx1ZSgpLiAqL1xuXHQgICAgICAgICAgICBpZiAoQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbcHJvcGVydHldKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgaG9vayA9IHByb3BlcnR5LFxuXHQgICAgICAgICAgICAgICAgICAgIGhvb2tSb290ID0gQ1NTLkhvb2tzLmdldFJvb3QoaG9vayk7XG5cblx0ICAgICAgICAgICAgICAgIC8qIElmIGEgY2FjaGVkIHJvb3RQcm9wZXJ0eVZhbHVlIHdhc24ndCBwYXNzZWQgaW4gKHdoaWNoIFZlbG9jaXR5IGFsd2F5cyBhdHRlbXB0cyB0byBkbyBpbiBvcmRlciB0byBhdm9pZCByZXF1ZXJ5aW5nIHRoZSBET00pLFxuXHQgICAgICAgICAgICAgICAgICAgcXVlcnkgdGhlIERPTSBmb3IgdGhlIHJvb3QgcHJvcGVydHkncyB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgIGlmIChyb290UHJvcGVydHlWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogU2luY2UgdGhlIGJyb3dzZXIgaXMgbm93IGJlaW5nIGRpcmVjdGx5IHF1ZXJpZWQsIHVzZSB0aGUgb2ZmaWNpYWwgcG9zdC1wcmVmaXhpbmcgcHJvcGVydHkgbmFtZSBmb3IgdGhpcyBsb29rdXAuICovXG5cdCAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWUgPSBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBDU1MuTmFtZXMucHJlZml4Q2hlY2soaG9va1Jvb3QpWzBdKTsgLyogR0VUICovXG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIC8qIElmIHRoaXMgcm9vdCBoYXMgYSBub3JtYWxpemF0aW9uIHJlZ2lzdGVyZWQsIHBlZm9ybSB0aGUgYXNzb2NpYXRlZCBub3JtYWxpemF0aW9uIGV4dHJhY3Rpb24uICovXG5cdCAgICAgICAgICAgICAgICBpZiAoQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbaG9va1Jvb3RdKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWUgPSBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtob29rUm9vdF0oXCJleHRyYWN0XCIsIGVsZW1lbnQsIHJvb3RQcm9wZXJ0eVZhbHVlKTtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgLyogRXh0cmFjdCB0aGUgaG9vaydzIHZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IENTUy5Ib29rcy5leHRyYWN0VmFsdWUoaG9vaywgcm9vdFByb3BlcnR5VmFsdWUpO1xuXG5cdCAgICAgICAgICAgIC8qIElmIHRoaXMgaXMgYSBub3JtYWxpemVkIHByb3BlcnR5IChlLmcuIFwib3BhY2l0eVwiIGJlY29tZXMgXCJmaWx0ZXJcIiBpbiA8PUlFOCkgb3IgXCJ0cmFuc2xhdGVYXCIgYmVjb21lcyBcInRyYW5zZm9ybVwiKSxcblx0ICAgICAgICAgICAgICAgbm9ybWFsaXplIHRoZSBwcm9wZXJ0eSdzIG5hbWUgYW5kIHZhbHVlLCBhbmQgaGFuZGxlIHRoZSBzcGVjaWFsIGNhc2Ugb2YgdHJhbnNmb3Jtcy4gKi9cblx0ICAgICAgICAgICAgLyogTm90ZTogTm9ybWFsaXppbmcgYSBwcm9wZXJ0eSBpcyBtdXR1YWxseSBleGNsdXNpdmUgZnJvbSBob29raW5nIGEgcHJvcGVydHkgc2luY2UgaG9vay1leHRyYWN0ZWQgdmFsdWVzIGFyZSBzdHJpY3RseVxuXHQgICAgICAgICAgICAgICBudW1lcmljYWwgYW5kIHRoZXJlZm9yZSBkbyBub3QgcmVxdWlyZSBub3JtYWxpemF0aW9uIGV4dHJhY3Rpb24uICovXG5cdCAgICAgICAgICAgIH0gZWxzZSBpZiAoQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbcHJvcGVydHldKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgbm9ybWFsaXplZFByb3BlcnR5TmFtZSxcblx0ICAgICAgICAgICAgICAgICAgICBub3JtYWxpemVkUHJvcGVydHlWYWx1ZTtcblxuXHQgICAgICAgICAgICAgICAgbm9ybWFsaXplZFByb3BlcnR5TmFtZSA9IENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3Byb3BlcnR5XShcIm5hbWVcIiwgZWxlbWVudCk7XG5cblx0ICAgICAgICAgICAgICAgIC8qIFRyYW5zZm9ybSB2YWx1ZXMgYXJlIGNhbGN1bGF0ZWQgdmlhIG5vcm1hbGl6YXRpb24gZXh0cmFjdGlvbiAoc2VlIGJlbG93KSwgd2hpY2ggY2hlY2tzIGFnYWluc3QgdGhlIGVsZW1lbnQncyB0cmFuc2Zvcm1DYWNoZS5cblx0ICAgICAgICAgICAgICAgICAgIEF0IG5vIHBvaW50IGRvIHRyYW5zZm9ybSBHRVRzIGV2ZXIgYWN0dWFsbHkgcXVlcnkgdGhlIERPTTsgaW5pdGlhbCBzdHlsZXNoZWV0IHZhbHVlcyBhcmUgbmV2ZXIgcHJvY2Vzc2VkLlxuXHQgICAgICAgICAgICAgICAgICAgVGhpcyBpcyBiZWNhdXNlIHBhcnNpbmcgM0QgdHJhbnNmb3JtIG1hdHJpY2VzIGlzIG5vdCBhbHdheXMgYWNjdXJhdGUgYW5kIHdvdWxkIGJsb2F0IG91ciBjb2RlYmFzZTtcblx0ICAgICAgICAgICAgICAgICAgIHRodXMsIG5vcm1hbGl6YXRpb24gZXh0cmFjdGlvbiBkZWZhdWx0cyBpbml0aWFsIHRyYW5zZm9ybSB2YWx1ZXMgdG8gdGhlaXIgemVyby12YWx1ZXMgKGUuZy4gMSBmb3Igc2NhbGVYIGFuZCAwIGZvciB0cmFuc2xhdGVYKS4gKi9cblx0ICAgICAgICAgICAgICAgIGlmIChub3JtYWxpemVkUHJvcGVydHlOYW1lICE9PSBcInRyYW5zZm9ybVwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgbm9ybWFsaXplZFByb3BlcnR5VmFsdWUgPSBjb21wdXRlUHJvcGVydHlWYWx1ZShlbGVtZW50LCBDU1MuTmFtZXMucHJlZml4Q2hlY2sobm9ybWFsaXplZFByb3BlcnR5TmFtZSlbMF0pOyAvKiBHRVQgKi9cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSB2YWx1ZSBpcyBhIENTUyBudWxsLXZhbHVlIGFuZCB0aGlzIHByb3BlcnR5IGhhcyBhIGhvb2sgdGVtcGxhdGUsIHVzZSB0aGF0IHplcm8tdmFsdWUgdGVtcGxhdGUgc28gdGhhdCBob29rcyBjYW4gYmUgZXh0cmFjdGVkIGZyb20gaXQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKENTUy5WYWx1ZXMuaXNDU1NOdWxsVmFsdWUobm9ybWFsaXplZFByb3BlcnR5VmFsdWUpICYmIENTUy5Ib29rcy50ZW1wbGF0ZXNbcHJvcGVydHldKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRQcm9wZXJ0eVZhbHVlID0gQ1NTLkhvb2tzLnRlbXBsYXRlc1twcm9wZXJ0eV1bMV07XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbcHJvcGVydHldKFwiZXh0cmFjdFwiLCBlbGVtZW50LCBub3JtYWxpemVkUHJvcGVydHlWYWx1ZSk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvKiBJZiBhIChudW1lcmljKSB2YWx1ZSB3YXNuJ3QgcHJvZHVjZWQgdmlhIGhvb2sgZXh0cmFjdGlvbiBvciBub3JtYWxpemF0aW9uLCBxdWVyeSB0aGUgRE9NLiAqL1xuXHQgICAgICAgICAgICBpZiAoIS9eW1xcZC1dLy50ZXN0KHByb3BlcnR5VmFsdWUpKSB7XG5cdCAgICAgICAgICAgICAgICAvKiBGb3IgU1ZHIGVsZW1lbnRzLCBkaW1lbnNpb25hbCBwcm9wZXJ0aWVzICh3aGljaCBTVkdBdHRyaWJ1dGUoKSBkZXRlY3RzKSBhcmUgdHdlZW5lZCB2aWFcblx0ICAgICAgICAgICAgICAgICAgIHRoZWlyIEhUTUwgYXR0cmlidXRlIHZhbHVlcyBpbnN0ZWFkIG9mIHRoZWlyIENTUyBzdHlsZSB2YWx1ZXMuICovXG5cdCAgICAgICAgICAgICAgICBpZiAoRGF0YShlbGVtZW50KSAmJiBEYXRhKGVsZW1lbnQpLmlzU1ZHICYmIENTUy5OYW1lcy5TVkdBdHRyaWJ1dGUocHJvcGVydHkpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogU2luY2UgdGhlIGhlaWdodC93aWR0aCBhdHRyaWJ1dGUgdmFsdWVzIG11c3QgYmUgc2V0IG1hbnVhbGx5LCB0aGV5IGRvbid0IHJlZmxlY3QgY29tcHV0ZWQgdmFsdWVzLlxuXHQgICAgICAgICAgICAgICAgICAgICAgIFRodXMsIHdlIHVzZSB1c2UgZ2V0QkJveCgpIHRvIGVuc3VyZSB3ZSBhbHdheXMgZ2V0IHZhbHVlcyBmb3IgZWxlbWVudHMgd2l0aCB1bmRlZmluZWQgaGVpZ2h0L3dpZHRoIGF0dHJpYnV0ZXMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKC9eKGhlaWdodHx3aWR0aCkkL2kudGVzdChwcm9wZXJ0eSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogRmlyZWZveCB0aHJvd3MgYW4gZXJyb3IgaWYgLmdldEJCb3goKSBpcyBjYWxsZWQgb24gYW4gU1ZHIHRoYXQgaXNuJ3QgYXR0YWNoZWQgdG8gdGhlIERPTS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSBlbGVtZW50LmdldEJCb3goKVtwcm9wZXJ0eV07XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gMDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIC8qIE90aGVyd2lzZSwgYWNjZXNzIHRoZSBhdHRyaWJ1dGUgdmFsdWUgZGlyZWN0bHkuICovXG5cdCAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKHByb3BlcnR5KTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSBjb21wdXRlUHJvcGVydHlWYWx1ZShlbGVtZW50LCBDU1MuTmFtZXMucHJlZml4Q2hlY2socHJvcGVydHkpWzBdKTsgLyogR0VUICovXG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvKiBTaW5jZSBwcm9wZXJ0eSBsb29rdXBzIGFyZSBmb3IgYW5pbWF0aW9uIHB1cnBvc2VzICh3aGljaCBlbnRhaWxzIGNvbXB1dGluZyB0aGUgbnVtZXJpYyBkZWx0YSBiZXR3ZWVuIHN0YXJ0IGFuZCBlbmQgdmFsdWVzKSxcblx0ICAgICAgICAgICAgICAgY29udmVydCBDU1MgbnVsbC12YWx1ZXMgdG8gYW4gaW50ZWdlciBvZiB2YWx1ZSAwLiAqL1xuXHQgICAgICAgICAgICBpZiAoQ1NTLlZhbHVlcy5pc0NTU051bGxWYWx1ZShwcm9wZXJ0eVZhbHVlKSkge1xuXHQgICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IDA7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBpZiAoVmVsb2NpdHkuZGVidWcgPj0gMikgY29uc29sZS5sb2coXCJHZXQgXCIgKyBwcm9wZXJ0eSArIFwiOiBcIiArIHByb3BlcnR5VmFsdWUpO1xuXG5cdCAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0eVZhbHVlO1xuXHQgICAgICAgIH0sXG5cblx0ICAgICAgICAvKiBUaGUgc2luZ3VsYXIgc2V0UHJvcGVydHlWYWx1ZSwgd2hpY2ggcm91dGVzIHRoZSBsb2dpYyBmb3IgYWxsIG5vcm1hbGl6YXRpb25zLCBob29rcywgYW5kIHN0YW5kYXJkIENTUyBwcm9wZXJ0aWVzLiAqL1xuXHQgICAgICAgIHNldFByb3BlcnR5VmFsdWU6IGZ1bmN0aW9uKGVsZW1lbnQsIHByb3BlcnR5LCBwcm9wZXJ0eVZhbHVlLCByb290UHJvcGVydHlWYWx1ZSwgc2Nyb2xsRGF0YSkge1xuXHQgICAgICAgICAgICB2YXIgcHJvcGVydHlOYW1lID0gcHJvcGVydHk7XG5cblx0ICAgICAgICAgICAgLyogSW4gb3JkZXIgdG8gYmUgc3ViamVjdGVkIHRvIGNhbGwgb3B0aW9ucyBhbmQgZWxlbWVudCBxdWV1ZWluZywgc2Nyb2xsIGFuaW1hdGlvbiBpcyByb3V0ZWQgdGhyb3VnaCBWZWxvY2l0eSBhcyBpZiBpdCB3ZXJlIGEgc3RhbmRhcmQgQ1NTIHByb3BlcnR5LiAqL1xuXHQgICAgICAgICAgICBpZiAocHJvcGVydHkgPT09IFwic2Nyb2xsXCIpIHtcblx0ICAgICAgICAgICAgICAgIC8qIElmIGEgY29udGFpbmVyIG9wdGlvbiBpcyBwcmVzZW50LCBzY3JvbGwgdGhlIGNvbnRhaW5lciBpbnN0ZWFkIG9mIHRoZSBicm93c2VyIHdpbmRvdy4gKi9cblx0ICAgICAgICAgICAgICAgIGlmIChzY3JvbGxEYXRhLmNvbnRhaW5lcikge1xuXHQgICAgICAgICAgICAgICAgICAgIHNjcm9sbERhdGEuY29udGFpbmVyW1wic2Nyb2xsXCIgKyBzY3JvbGxEYXRhLmRpcmVjdGlvbl0gPSBwcm9wZXJ0eVZhbHVlO1xuXHQgICAgICAgICAgICAgICAgLyogT3RoZXJ3aXNlLCBWZWxvY2l0eSBkZWZhdWx0cyB0byBzY3JvbGxpbmcgdGhlIGJyb3dzZXIgd2luZG93LiAqL1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICBpZiAoc2Nyb2xsRGF0YS5kaXJlY3Rpb24gPT09IFwiTGVmdFwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5zY3JvbGxUbyhwcm9wZXJ0eVZhbHVlLCBzY3JvbGxEYXRhLmFsdGVybmF0ZVZhbHVlKTtcblx0ICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuc2Nyb2xsVG8oc2Nyb2xsRGF0YS5hbHRlcm5hdGVWYWx1ZSwgcHJvcGVydHlWYWx1ZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgLyogVHJhbnNmb3JtcyAodHJhbnNsYXRlWCwgcm90YXRlWiwgZXRjLikgYXJlIGFwcGxpZWQgdG8gYSBwZXItZWxlbWVudCB0cmFuc2Zvcm1DYWNoZSBvYmplY3QsIHdoaWNoIGlzIG1hbnVhbGx5IGZsdXNoZWQgdmlhIGZsdXNoVHJhbnNmb3JtQ2FjaGUoKS5cblx0ICAgICAgICAgICAgICAgICAgIFRodXMsIGZvciBub3csIHdlIG1lcmVseSBjYWNoZSB0cmFuc2Zvcm1zIGJlaW5nIFNFVC4gKi9cblx0ICAgICAgICAgICAgICAgIGlmIChDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtwcm9wZXJ0eV0gJiYgQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbcHJvcGVydHldKFwibmFtZVwiLCBlbGVtZW50KSA9PT0gXCJ0cmFuc2Zvcm1cIikge1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIFBlcmZvcm0gYSBub3JtYWxpemF0aW9uIGluamVjdGlvbi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBUaGUgbm9ybWFsaXphdGlvbiBsb2dpYyBoYW5kbGVzIHRoZSB0cmFuc2Zvcm1DYWNoZSB1cGRhdGluZy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtwcm9wZXJ0eV0oXCJpbmplY3RcIiwgZWxlbWVudCwgcHJvcGVydHlWYWx1ZSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWUgPSBcInRyYW5zZm9ybVwiO1xuXHQgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlW3Byb3BlcnR5XTtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogSW5qZWN0IGhvb2tzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChDU1MuSG9va3MucmVnaXN0ZXJlZFtwcm9wZXJ0eV0pIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGhvb2tOYW1lID0gcHJvcGVydHksXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBob29rUm9vdCA9IENTUy5Ib29rcy5nZXRSb290KHByb3BlcnR5KTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiBhIGNhY2hlZCByb290UHJvcGVydHlWYWx1ZSB3YXMgbm90IHByb3ZpZGVkLCBxdWVyeSB0aGUgRE9NIGZvciB0aGUgaG9va1Jvb3QncyBjdXJyZW50IHZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZSA9IHJvb3RQcm9wZXJ0eVZhbHVlIHx8IENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIGhvb2tSb290KTsgLyogR0VUICovXG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IENTUy5Ib29rcy5pbmplY3RWYWx1ZShob29rTmFtZSwgcHJvcGVydHlWYWx1ZSwgcm9vdFByb3BlcnR5VmFsdWUpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eSA9IGhvb2tSb290O1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIE5vcm1hbGl6ZSBuYW1lcyBhbmQgdmFsdWVzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtwcm9wZXJ0eV0pIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3Byb3BlcnR5XShcImluamVjdFwiLCBlbGVtZW50LCBwcm9wZXJ0eVZhbHVlKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHkgPSBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtwcm9wZXJ0eV0oXCJuYW1lXCIsIGVsZW1lbnQpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIEFzc2lnbiB0aGUgYXBwcm9wcmlhdGUgdmVuZG9yIHByZWZpeCBiZWZvcmUgcGVyZm9ybWluZyBhbiBvZmZpY2lhbCBzdHlsZSB1cGRhdGUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gQ1NTLk5hbWVzLnByZWZpeENoZWNrKHByb3BlcnR5KVswXTtcblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIEEgdHJ5L2NhdGNoIGlzIHVzZWQgZm9yIElFPD04LCB3aGljaCB0aHJvd3MgYW4gZXJyb3Igd2hlbiBcImludmFsaWRcIiBDU1MgdmFsdWVzIGFyZSBzZXQsIGUuZy4gYSBuZWdhdGl2ZSB3aWR0aC5cblx0ICAgICAgICAgICAgICAgICAgICAgICBUcnkvY2F0Y2ggaXMgYXZvaWRlZCBmb3Igb3RoZXIgYnJvd3NlcnMgc2luY2UgaXQgaW5jdXJzIGEgcGVyZm9ybWFuY2Ugb3ZlcmhlYWQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKElFIDw9IDgpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuc3R5bGVbcHJvcGVydHlOYW1lXSA9IHByb3BlcnR5VmFsdWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7IGlmIChWZWxvY2l0eS5kZWJ1ZykgY29uc29sZS5sb2coXCJCcm93c2VyIGRvZXMgbm90IHN1cHBvcnQgW1wiICsgcHJvcGVydHlWYWx1ZSArIFwiXSBmb3IgW1wiICsgcHJvcGVydHlOYW1lICsgXCJdXCIpOyB9XG5cdCAgICAgICAgICAgICAgICAgICAgLyogU1ZHIGVsZW1lbnRzIGhhdmUgdGhlaXIgZGltZW5zaW9uYWwgcHJvcGVydGllcyAod2lkdGgsIGhlaWdodCwgeCwgeSwgY3gsIGV0Yy4pIGFwcGxpZWQgZGlyZWN0bHkgYXMgYXR0cmlidXRlcyBpbnN0ZWFkIG9mIGFzIHN0eWxlcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBJRTggZG9lcyBub3Qgc3VwcG9ydCBTVkcgZWxlbWVudHMsIHNvIGl0J3Mgb2theSB0aGF0IHdlIHNraXAgaXQgZm9yIFNWRyBhbmltYXRpb24uICovXG5cdCAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChEYXRhKGVsZW1lbnQpICYmIERhdGEoZWxlbWVudCkuaXNTVkcgJiYgQ1NTLk5hbWVzLlNWR0F0dHJpYnV0ZShwcm9wZXJ0eSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogRm9yIFNWRyBhdHRyaWJ1dGVzLCB2ZW5kb3ItcHJlZml4ZWQgcHJvcGVydHkgbmFtZXMgYXJlIG5ldmVyIHVzZWQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IE5vdCBhbGwgQ1NTIHByb3BlcnRpZXMgY2FuIGJlIGFuaW1hdGVkIHZpYSBhdHRyaWJ1dGVzLCBidXQgdGhlIGJyb3dzZXIgd29uJ3QgdGhyb3cgYW4gZXJyb3IgZm9yIHVuc3VwcG9ydGVkIHByb3BlcnRpZXMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKHByb3BlcnR5LCBwcm9wZXJ0eVZhbHVlKTtcblx0ICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnN0eWxlW3Byb3BlcnR5TmFtZV0gPSBwcm9wZXJ0eVZhbHVlO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIGlmIChWZWxvY2l0eS5kZWJ1ZyA+PSAyKSBjb25zb2xlLmxvZyhcIlNldCBcIiArIHByb3BlcnR5ICsgXCIgKFwiICsgcHJvcGVydHlOYW1lICsgXCIpOiBcIiArIHByb3BlcnR5VmFsdWUpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLyogUmV0dXJuIHRoZSBub3JtYWxpemVkIHByb3BlcnR5IG5hbWUgYW5kIHZhbHVlIGluIGNhc2UgdGhlIGNhbGxlciB3YW50cyB0byBrbm93IGhvdyB0aGVzZSB2YWx1ZXMgd2VyZSBtb2RpZmllZCBiZWZvcmUgYmVpbmcgYXBwbGllZCB0byB0aGUgRE9NLiAqL1xuXHQgICAgICAgICAgICByZXR1cm4gWyBwcm9wZXJ0eU5hbWUsIHByb3BlcnR5VmFsdWUgXTtcblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgLyogVG8gaW5jcmVhc2UgcGVyZm9ybWFuY2UgYnkgYmF0Y2hpbmcgdHJhbnNmb3JtIHVwZGF0ZXMgaW50byBhIHNpbmdsZSBTRVQsIHRyYW5zZm9ybXMgYXJlIG5vdCBkaXJlY3RseSBhcHBsaWVkIHRvIGFuIGVsZW1lbnQgdW50aWwgZmx1c2hUcmFuc2Zvcm1DYWNoZSgpIGlzIGNhbGxlZC4gKi9cblx0ICAgICAgICAvKiBOb3RlOiBWZWxvY2l0eSBhcHBsaWVzIHRyYW5zZm9ybSBwcm9wZXJ0aWVzIGluIHRoZSBzYW1lIG9yZGVyIHRoYXQgdGhleSBhcmUgY2hyb25vZ2ljYWxseSBpbnRyb2R1Y2VkIHRvIHRoZSBlbGVtZW50J3MgQ1NTIHN0eWxlcy4gKi9cblx0ICAgICAgICBmbHVzaFRyYW5zZm9ybUNhY2hlOiBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgICAgICAgICAgIHZhciB0cmFuc2Zvcm1TdHJpbmcgPSBcIlwiO1xuXG5cdCAgICAgICAgICAgIC8qIENlcnRhaW4gYnJvd3NlcnMgcmVxdWlyZSB0aGF0IFNWRyB0cmFuc2Zvcm1zIGJlIGFwcGxpZWQgYXMgYW4gYXR0cmlidXRlLiBIb3dldmVyLCB0aGUgU1ZHIHRyYW5zZm9ybSBhdHRyaWJ1dGUgdGFrZXMgYSBtb2RpZmllZCB2ZXJzaW9uIG9mIENTUydzIHRyYW5zZm9ybSBzdHJpbmdcblx0ICAgICAgICAgICAgICAgKHVuaXRzIGFyZSBkcm9wcGVkIGFuZCwgZXhjZXB0IGZvciBza2V3WC9ZLCBzdWJwcm9wZXJ0aWVzIGFyZSBtZXJnZWQgaW50byB0aGVpciBtYXN0ZXIgcHJvcGVydHkgLS0gZS5nLiBzY2FsZVggYW5kIHNjYWxlWSBhcmUgbWVyZ2VkIGludG8gc2NhbGUoWCBZKS4gKi9cblx0ICAgICAgICAgICAgaWYgKChJRSB8fCAoVmVsb2NpdHkuU3RhdGUuaXNBbmRyb2lkICYmICFWZWxvY2l0eS5TdGF0ZS5pc0Nocm9tZSkpICYmIERhdGEoZWxlbWVudCkuaXNTVkcpIHtcblx0ICAgICAgICAgICAgICAgIC8qIFNpbmNlIHRyYW5zZm9ybSB2YWx1ZXMgYXJlIHN0b3JlZCBpbiB0aGVpciBwYXJlbnRoZXNlcy13cmFwcGVkIGZvcm0sIHdlIHVzZSBhIGhlbHBlciBmdW5jdGlvbiB0byBzdHJpcCBvdXQgdGhlaXIgbnVtZXJpYyB2YWx1ZXMuXG5cdCAgICAgICAgICAgICAgICAgICBGdXJ0aGVyLCBTVkcgdHJhbnNmb3JtIHByb3BlcnRpZXMgb25seSB0YWtlIHVuaXRsZXNzIChyZXByZXNlbnRpbmcgcGl4ZWxzKSB2YWx1ZXMsIHNvIGl0J3Mgb2theSB0aGF0IHBhcnNlRmxvYXQoKSBzdHJpcHMgdGhlIHVuaXQgc3VmZml4ZWQgdG8gdGhlIGZsb2F0IHZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgZnVuY3Rpb24gZ2V0VHJhbnNmb3JtRmxvYXQgKHRyYW5zZm9ybVByb3BlcnR5KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgdHJhbnNmb3JtUHJvcGVydHkpKTtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgLyogQ3JlYXRlIGFuIG9iamVjdCB0byBvcmdhbml6ZSBhbGwgdGhlIHRyYW5zZm9ybXMgdGhhdCB3ZSdsbCBhcHBseSB0byB0aGUgU1ZHIGVsZW1lbnQuIFRvIGtlZXAgdGhlIGxvZ2ljIHNpbXBsZSxcblx0ICAgICAgICAgICAgICAgICAgIHdlIHByb2Nlc3MgKmFsbCogdHJhbnNmb3JtIHByb3BlcnRpZXMgLS0gZXZlbiB0aG9zZSB0aGF0IG1heSBub3QgYmUgZXhwbGljaXRseSBhcHBsaWVkIChzaW5jZSB0aGV5IGRlZmF1bHQgdG8gdGhlaXIgemVyby12YWx1ZXMgYW55d2F5KS4gKi9cblx0ICAgICAgICAgICAgICAgIHZhciBTVkdUcmFuc2Zvcm1zID0ge1xuXHQgICAgICAgICAgICAgICAgICAgIHRyYW5zbGF0ZTogWyBnZXRUcmFuc2Zvcm1GbG9hdChcInRyYW5zbGF0ZVhcIiksIGdldFRyYW5zZm9ybUZsb2F0KFwidHJhbnNsYXRlWVwiKSBdLFxuXHQgICAgICAgICAgICAgICAgICAgIHNrZXdYOiBbIGdldFRyYW5zZm9ybUZsb2F0KFwic2tld1hcIikgXSwgc2tld1k6IFsgZ2V0VHJhbnNmb3JtRmxvYXQoXCJza2V3WVwiKSBdLFxuXHQgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBzY2FsZSBwcm9wZXJ0eSBpcyBzZXQgKG5vbi0xKSwgdXNlIHRoYXQgdmFsdWUgZm9yIHRoZSBzY2FsZVggYW5kIHNjYWxlWSB2YWx1ZXNcblx0ICAgICAgICAgICAgICAgICAgICAgICAodGhpcyBiZWhhdmlvciBtaW1pY3MgdGhlIHJlc3VsdCBvZiBhbmltYXRpbmcgYWxsIHRoZXNlIHByb3BlcnRpZXMgYXQgb25jZSBvbiBIVE1MIGVsZW1lbnRzKS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBzY2FsZTogZ2V0VHJhbnNmb3JtRmxvYXQoXCJzY2FsZVwiKSAhPT0gMSA/IFsgZ2V0VHJhbnNmb3JtRmxvYXQoXCJzY2FsZVwiKSwgZ2V0VHJhbnNmb3JtRmxvYXQoXCJzY2FsZVwiKSBdIDogWyBnZXRUcmFuc2Zvcm1GbG9hdChcInNjYWxlWFwiKSwgZ2V0VHJhbnNmb3JtRmxvYXQoXCJzY2FsZVlcIikgXSxcblx0ICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBTVkcncyByb3RhdGUgdHJhbnNmb3JtIHRha2VzIHRocmVlIHZhbHVlczogcm90YXRpb24gZGVncmVlcyBmb2xsb3dlZCBieSB0aGUgWCBhbmQgWSB2YWx1ZXNcblx0ICAgICAgICAgICAgICAgICAgICAgICBkZWZpbmluZyB0aGUgcm90YXRpb24ncyBvcmlnaW4gcG9pbnQuIFdlIGlnbm9yZSB0aGUgb3JpZ2luIHZhbHVlcyAoZGVmYXVsdCB0aGVtIHRvIDApLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIHJvdGF0ZTogWyBnZXRUcmFuc2Zvcm1GbG9hdChcInJvdGF0ZVpcIiksIDAsIDAgXVxuXHQgICAgICAgICAgICAgICAgfTtcblxuXHQgICAgICAgICAgICAgICAgLyogSXRlcmF0ZSB0aHJvdWdoIHRoZSB0cmFuc2Zvcm0gcHJvcGVydGllcyBpbiB0aGUgdXNlci1kZWZpbmVkIHByb3BlcnR5IG1hcCBvcmRlci5cblx0ICAgICAgICAgICAgICAgICAgIChUaGlzIG1pbWljcyB0aGUgYmVoYXZpb3Igb2Ygbm9uLVNWRyB0cmFuc2Zvcm0gYW5pbWF0aW9uLikgKi9cblx0ICAgICAgICAgICAgICAgICQuZWFjaChEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlLCBmdW5jdGlvbih0cmFuc2Zvcm1OYW1lKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogRXhjZXB0IGZvciB3aXRoIHNrZXdYL1ksIHJldmVydCB0aGUgYXhpcy1zcGVjaWZpYyB0cmFuc2Zvcm0gc3VicHJvcGVydGllcyB0byB0aGVpciBheGlzLWZyZWUgbWFzdGVyXG5cdCAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllcyBzbyB0aGF0IHRoZXkgbWF0Y2ggdXAgd2l0aCBTVkcncyBhY2NlcHRlZCB0cmFuc2Zvcm0gcHJvcGVydGllcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoL150cmFuc2xhdGUvaS50ZXN0KHRyYW5zZm9ybU5hbWUpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybU5hbWUgPSBcInRyYW5zbGF0ZVwiO1xuXHQgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoL15zY2FsZS9pLnRlc3QodHJhbnNmb3JtTmFtZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtTmFtZSA9IFwic2NhbGVcIjtcblx0ICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC9ecm90YXRlL2kudGVzdCh0cmFuc2Zvcm1OYW1lKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1OYW1lID0gXCJyb3RhdGVcIjtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBDaGVjayB0aGF0IHdlIGhhdmVuJ3QgeWV0IGRlbGV0ZWQgdGhlIHByb3BlcnR5IGZyb20gdGhlIFNWR1RyYW5zZm9ybXMgY29udGFpbmVyLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChTVkdUcmFuc2Zvcm1zW3RyYW5zZm9ybU5hbWVdKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIEFwcGVuZCB0aGUgdHJhbnNmb3JtIHByb3BlcnR5IGluIHRoZSBTVkctc3VwcG9ydGVkIHRyYW5zZm9ybSBmb3JtYXQuIEFzIHBlciB0aGUgc3BlYywgc3Vycm91bmQgdGhlIHNwYWNlLWRlbGltaXRlZCB2YWx1ZXMgaW4gcGFyZW50aGVzZXMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVN0cmluZyArPSB0cmFuc2Zvcm1OYW1lICsgXCIoXCIgKyBTVkdUcmFuc2Zvcm1zW3RyYW5zZm9ybU5hbWVdLmpvaW4oXCIgXCIpICsgXCIpXCIgKyBcIiBcIjtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBBZnRlciBwcm9jZXNzaW5nIGFuIFNWRyB0cmFuc2Zvcm0gcHJvcGVydHksIGRlbGV0ZSBpdCBmcm9tIHRoZSBTVkdUcmFuc2Zvcm1zIGNvbnRhaW5lciBzbyB3ZSBkb24ndFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICByZS1pbnNlcnQgdGhlIHNhbWUgbWFzdGVyIHByb3BlcnR5IGlmIHdlIGVuY291bnRlciBhbm90aGVyIG9uZSBvZiBpdHMgYXhpcy1zcGVjaWZpYyBwcm9wZXJ0aWVzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgU1ZHVHJhbnNmb3Jtc1t0cmFuc2Zvcm1OYW1lXTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIHZhciB0cmFuc2Zvcm1WYWx1ZSxcblx0ICAgICAgICAgICAgICAgICAgICBwZXJzcGVjdGl2ZTtcblxuXHQgICAgICAgICAgICAgICAgLyogVHJhbnNmb3JtIHByb3BlcnRpZXMgYXJlIHN0b3JlZCBhcyBtZW1iZXJzIG9mIHRoZSB0cmFuc2Zvcm1DYWNoZSBvYmplY3QuIENvbmNhdGVuYXRlIGFsbCB0aGUgbWVtYmVycyBpbnRvIGEgc3RyaW5nLiAqL1xuXHQgICAgICAgICAgICAgICAgJC5lYWNoKERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGUsIGZ1bmN0aW9uKHRyYW5zZm9ybU5hbWUpIHtcblx0ICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1WYWx1ZSA9IERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGVbdHJhbnNmb3JtTmFtZV07XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBUcmFuc2Zvcm0ncyBwZXJzcGVjdGl2ZSBzdWJwcm9wZXJ0eSBtdXN0IGJlIHNldCBmaXJzdCBpbiBvcmRlciB0byB0YWtlIGVmZmVjdC4gU3RvcmUgaXQgdGVtcG9yYXJpbHkuICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKHRyYW5zZm9ybU5hbWUgPT09IFwidHJhbnNmb3JtUGVyc3BlY3RpdmVcIikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBwZXJzcGVjdGl2ZSA9IHRyYW5zZm9ybVZhbHVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBJRTkgb25seSBzdXBwb3J0cyBvbmUgcm90YXRpb24gdHlwZSwgcm90YXRlWiwgd2hpY2ggaXQgcmVmZXJzIHRvIGFzIFwicm90YXRlXCIuICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKElFID09PSA5ICYmIHRyYW5zZm9ybU5hbWUgPT09IFwicm90YXRlWlwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybU5hbWUgPSBcInJvdGF0ZVwiO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVN0cmluZyArPSB0cmFuc2Zvcm1OYW1lICsgdHJhbnNmb3JtVmFsdWUgKyBcIiBcIjtcblx0ICAgICAgICAgICAgICAgIH0pO1xuXG5cdCAgICAgICAgICAgICAgICAvKiBJZiBwcmVzZW50LCBzZXQgdGhlIHBlcnNwZWN0aXZlIHN1YnByb3BlcnR5IGZpcnN0LiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKHBlcnNwZWN0aXZlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtU3RyaW5nID0gXCJwZXJzcGVjdGl2ZVwiICsgcGVyc3BlY3RpdmUgKyBcIiBcIiArIHRyYW5zZm9ybVN0cmluZztcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIENTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwidHJhbnNmb3JtXCIsIHRyYW5zZm9ybVN0cmluZyk7XG5cdCAgICAgICAgfVxuXHQgICAgfTtcblxuXHQgICAgLyogUmVnaXN0ZXIgaG9va3MgYW5kIG5vcm1hbGl6YXRpb25zLiAqL1xuXHQgICAgQ1NTLkhvb2tzLnJlZ2lzdGVyKCk7XG5cdCAgICBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXIoKTtcblxuXHQgICAgLyogQWxsb3cgaG9vayBzZXR0aW5nIGluIHRoZSBzYW1lIGZhc2hpb24gYXMgalF1ZXJ5J3MgJC5jc3MoKS4gKi9cblx0ICAgIFZlbG9jaXR5Lmhvb2sgPSBmdW5jdGlvbiAoZWxlbWVudHMsIGFyZzIsIGFyZzMpIHtcblx0ICAgICAgICB2YXIgdmFsdWUgPSB1bmRlZmluZWQ7XG5cblx0ICAgICAgICBlbGVtZW50cyA9IHNhbml0aXplRWxlbWVudHMoZWxlbWVudHMpO1xuXG5cdCAgICAgICAgJC5lYWNoKGVsZW1lbnRzLCBmdW5jdGlvbihpLCBlbGVtZW50KSB7XG5cdCAgICAgICAgICAgIC8qIEluaXRpYWxpemUgVmVsb2NpdHkncyBwZXItZWxlbWVudCBkYXRhIGNhY2hlIGlmIHRoaXMgZWxlbWVudCBoYXNuJ3QgcHJldmlvdXNseSBiZWVuIGFuaW1hdGVkLiAqL1xuXHQgICAgICAgICAgICBpZiAoRGF0YShlbGVtZW50KSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICBWZWxvY2l0eS5pbml0KGVsZW1lbnQpO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLyogR2V0IHByb3BlcnR5IHZhbHVlLiBJZiBhbiBlbGVtZW50IHNldCB3YXMgcGFzc2VkIGluLCBvbmx5IHJldHVybiB0aGUgdmFsdWUgZm9yIHRoZSBmaXJzdCBlbGVtZW50LiAqL1xuXHQgICAgICAgICAgICBpZiAoYXJnMyA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gVmVsb2NpdHkuQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgYXJnMik7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIC8qIFNldCBwcm9wZXJ0eSB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIC8qIHNQViByZXR1cm5zIGFuIGFycmF5IG9mIHRoZSBub3JtYWxpemVkIHByb3BlcnR5TmFtZS9wcm9wZXJ0eVZhbHVlIHBhaXIgdXNlZCB0byB1cGRhdGUgdGhlIERPTS4gKi9cblx0ICAgICAgICAgICAgICAgIHZhciBhZGp1c3RlZFNldCA9IFZlbG9jaXR5LkNTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIGFyZzIsIGFyZzMpO1xuXG5cdCAgICAgICAgICAgICAgICAvKiBUcmFuc2Zvcm0gcHJvcGVydGllcyBkb24ndCBhdXRvbWF0aWNhbGx5IHNldC4gVGhleSBoYXZlIHRvIGJlIGZsdXNoZWQgdG8gdGhlIERPTS4gKi9cblx0ICAgICAgICAgICAgICAgIGlmIChhZGp1c3RlZFNldFswXSA9PT0gXCJ0cmFuc2Zvcm1cIikge1xuXHQgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LkNTUy5mbHVzaFRyYW5zZm9ybUNhY2hlKGVsZW1lbnQpO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICB2YWx1ZSA9IGFkanVzdGVkU2V0O1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICByZXR1cm4gdmFsdWU7XG5cdCAgICB9O1xuXG5cdCAgICAvKioqKioqKioqKioqKioqKipcblx0ICAgICAgICBBbmltYXRpb25cblx0ICAgICoqKioqKioqKioqKioqKioqL1xuXG5cdCAgICB2YXIgYW5pbWF0ZSA9IGZ1bmN0aW9uKCkge1xuXG5cdCAgICAgICAgLyoqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICBDYWxsIENoYWluXG5cdCAgICAgICAgKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgLyogTG9naWMgZm9yIGRldGVybWluaW5nIHdoYXQgdG8gcmV0dXJuIHRvIHRoZSBjYWxsIHN0YWNrIHdoZW4gZXhpdGluZyBvdXQgb2YgVmVsb2NpdHkuICovXG5cdCAgICAgICAgZnVuY3Rpb24gZ2V0Q2hhaW4gKCkge1xuXHQgICAgICAgICAgICAvKiBJZiB3ZSBhcmUgdXNpbmcgdGhlIHV0aWxpdHkgZnVuY3Rpb24sIGF0dGVtcHQgdG8gcmV0dXJuIHRoaXMgY2FsbCdzIHByb21pc2UuIElmIG5vIHByb21pc2UgbGlicmFyeSB3YXMgZGV0ZWN0ZWQsXG5cdCAgICAgICAgICAgICAgIGRlZmF1bHQgdG8gbnVsbCBpbnN0ZWFkIG9mIHJldHVybmluZyB0aGUgdGFyZ2V0ZWQgZWxlbWVudHMgc28gdGhhdCB1dGlsaXR5IGZ1bmN0aW9uJ3MgcmV0dXJuIHZhbHVlIGlzIHN0YW5kYXJkaXplZC4gKi9cblx0ICAgICAgICAgICAgaWYgKGlzVXRpbGl0eSkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2VEYXRhLnByb21pc2UgfHwgbnVsbDtcblx0ICAgICAgICAgICAgLyogT3RoZXJ3aXNlLCBpZiB3ZSdyZSB1c2luZyAkLmZuLCByZXR1cm4gdGhlIGpRdWVyeS0vWmVwdG8td3JhcHBlZCBlbGVtZW50IHNldC4gKi9cblx0ICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBlbGVtZW50c1dyYXBwZWQ7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgIEFyZ3VtZW50cyBBc3NpZ25tZW50XG5cdCAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgIC8qIFRvIGFsbG93IGZvciBleHByZXNzaXZlIENvZmZlZVNjcmlwdCBjb2RlLCBWZWxvY2l0eSBzdXBwb3J0cyBhbiBhbHRlcm5hdGl2ZSBzeW50YXggaW4gd2hpY2ggXCJlbGVtZW50c1wiIChvciBcImVcIiksIFwicHJvcGVydGllc1wiIChvciBcInBcIiksIGFuZCBcIm9wdGlvbnNcIiAob3IgXCJvXCIpXG5cdCAgICAgICAgICAgb2JqZWN0cyBhcmUgZGVmaW5lZCBvbiBhIGNvbnRhaW5lciBvYmplY3QgdGhhdCdzIHBhc3NlZCBpbiBhcyBWZWxvY2l0eSdzIHNvbGUgYXJndW1lbnQuICovXG5cdCAgICAgICAgLyogTm90ZTogU29tZSBicm93c2VycyBhdXRvbWF0aWNhbGx5IHBvcHVsYXRlIGFyZ3VtZW50cyB3aXRoIGEgXCJwcm9wZXJ0aWVzXCIgb2JqZWN0LiBXZSBkZXRlY3QgaXQgYnkgY2hlY2tpbmcgZm9yIGl0cyBkZWZhdWx0IFwibmFtZXNcIiBwcm9wZXJ0eS4gKi9cblx0ICAgICAgICB2YXIgc3ludGFjdGljU3VnYXIgPSAoYXJndW1lbnRzWzBdICYmIChhcmd1bWVudHNbMF0ucCB8fCAoKCQuaXNQbGFpbk9iamVjdChhcmd1bWVudHNbMF0ucHJvcGVydGllcykgJiYgIWFyZ3VtZW50c1swXS5wcm9wZXJ0aWVzLm5hbWVzKSB8fCBUeXBlLmlzU3RyaW5nKGFyZ3VtZW50c1swXS5wcm9wZXJ0aWVzKSkpKSxcblx0ICAgICAgICAgICAgLyogV2hldGhlciBWZWxvY2l0eSB3YXMgY2FsbGVkIHZpYSB0aGUgdXRpbGl0eSBmdW5jdGlvbiAoYXMgb3Bwb3NlZCB0byBvbiBhIGpRdWVyeS9aZXB0byBvYmplY3QpLiAqL1xuXHQgICAgICAgICAgICBpc1V0aWxpdHksXG5cdCAgICAgICAgICAgIC8qIFdoZW4gVmVsb2NpdHkgaXMgY2FsbGVkIHZpYSB0aGUgdXRpbGl0eSBmdW5jdGlvbiAoJC5WZWxvY2l0eSgpL1ZlbG9jaXR5KCkpLCBlbGVtZW50cyBhcmUgZXhwbGljaXRseVxuXHQgICAgICAgICAgICAgICBwYXNzZWQgaW4gYXMgdGhlIGZpcnN0IHBhcmFtZXRlci4gVGh1cywgYXJndW1lbnQgcG9zaXRpb25pbmcgdmFyaWVzLiBXZSBub3JtYWxpemUgdGhlbSBoZXJlLiAqL1xuXHQgICAgICAgICAgICBlbGVtZW50c1dyYXBwZWQsXG5cdCAgICAgICAgICAgIGFyZ3VtZW50SW5kZXg7XG5cblx0ICAgICAgICB2YXIgZWxlbWVudHMsXG5cdCAgICAgICAgICAgIHByb3BlcnRpZXNNYXAsXG5cdCAgICAgICAgICAgIG9wdGlvbnM7XG5cblx0ICAgICAgICAvKiBEZXRlY3QgalF1ZXJ5L1plcHRvIGVsZW1lbnRzIGJlaW5nIGFuaW1hdGVkIHZpYSB0aGUgJC5mbiBtZXRob2QuICovXG5cdCAgICAgICAgaWYgKFR5cGUuaXNXcmFwcGVkKHRoaXMpKSB7XG5cdCAgICAgICAgICAgIGlzVXRpbGl0eSA9IGZhbHNlO1xuXG5cdCAgICAgICAgICAgIGFyZ3VtZW50SW5kZXggPSAwO1xuXHQgICAgICAgICAgICBlbGVtZW50cyA9IHRoaXM7XG5cdCAgICAgICAgICAgIGVsZW1lbnRzV3JhcHBlZCA9IHRoaXM7XG5cdCAgICAgICAgLyogT3RoZXJ3aXNlLCByYXcgZWxlbWVudHMgYXJlIGJlaW5nIGFuaW1hdGVkIHZpYSB0aGUgdXRpbGl0eSBmdW5jdGlvbi4gKi9cblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICBpc1V0aWxpdHkgPSB0cnVlO1xuXG5cdCAgICAgICAgICAgIGFyZ3VtZW50SW5kZXggPSAxO1xuXHQgICAgICAgICAgICBlbGVtZW50cyA9IHN5bnRhY3RpY1N1Z2FyID8gKGFyZ3VtZW50c1swXS5lbGVtZW50cyB8fCBhcmd1bWVudHNbMF0uZSkgOiBhcmd1bWVudHNbMF07XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgZWxlbWVudHMgPSBzYW5pdGl6ZUVsZW1lbnRzKGVsZW1lbnRzKTtcblxuXHQgICAgICAgIGlmICghZWxlbWVudHMpIHtcblx0ICAgICAgICAgICAgcmV0dXJuO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmIChzeW50YWN0aWNTdWdhcikge1xuXHQgICAgICAgICAgICBwcm9wZXJ0aWVzTWFwID0gYXJndW1lbnRzWzBdLnByb3BlcnRpZXMgfHwgYXJndW1lbnRzWzBdLnA7XG5cdCAgICAgICAgICAgIG9wdGlvbnMgPSBhcmd1bWVudHNbMF0ub3B0aW9ucyB8fCBhcmd1bWVudHNbMF0ubztcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICBwcm9wZXJ0aWVzTWFwID0gYXJndW1lbnRzW2FyZ3VtZW50SW5kZXhdO1xuXHQgICAgICAgICAgICBvcHRpb25zID0gYXJndW1lbnRzW2FyZ3VtZW50SW5kZXggKyAxXTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvKiBUaGUgbGVuZ3RoIG9mIHRoZSBlbGVtZW50IHNldCAoaW4gdGhlIGZvcm0gb2YgYSBub2RlTGlzdCBvciBhbiBhcnJheSBvZiBlbGVtZW50cykgaXMgZGVmYXVsdGVkIHRvIDEgaW4gY2FzZSBhXG5cdCAgICAgICAgICAgc2luZ2xlIHJhdyBET00gZWxlbWVudCBpcyBwYXNzZWQgaW4gKHdoaWNoIGRvZXNuJ3QgY29udGFpbiBhIGxlbmd0aCBwcm9wZXJ0eSkuICovXG5cdCAgICAgICAgdmFyIGVsZW1lbnRzTGVuZ3RoID0gZWxlbWVudHMubGVuZ3RoLFxuXHQgICAgICAgICAgICBlbGVtZW50c0luZGV4ID0gMDtcblxuXHQgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgQXJndW1lbnQgT3ZlcmxvYWRpbmdcblx0ICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAvKiBTdXBwb3J0IGlzIGluY2x1ZGVkIGZvciBqUXVlcnkncyBhcmd1bWVudCBvdmVybG9hZGluZzogJC5hbmltYXRlKHByb3BlcnR5TWFwIFssIGR1cmF0aW9uXSBbLCBlYXNpbmddIFssIGNvbXBsZXRlXSkuXG5cdCAgICAgICAgICAgT3ZlcmxvYWRpbmcgaXMgZGV0ZWN0ZWQgYnkgY2hlY2tpbmcgZm9yIHRoZSBhYnNlbmNlIG9mIGFuIG9iamVjdCBiZWluZyBwYXNzZWQgaW50byBvcHRpb25zLiAqL1xuXHQgICAgICAgIC8qIE5vdGU6IFRoZSBzdG9wIGFuZCBmaW5pc2ggYWN0aW9ucyBkbyBub3QgYWNjZXB0IGFuaW1hdGlvbiBvcHRpb25zLCBhbmQgYXJlIHRoZXJlZm9yZSBleGNsdWRlZCBmcm9tIHRoaXMgY2hlY2suICovXG5cdCAgICAgICAgaWYgKCEvXihzdG9wfGZpbmlzaHxmaW5pc2hBbGwpJC9pLnRlc3QocHJvcGVydGllc01hcCkgJiYgISQuaXNQbGFpbk9iamVjdChvcHRpb25zKSkge1xuXHQgICAgICAgICAgICAvKiBUaGUgdXRpbGl0eSBmdW5jdGlvbiBzaGlmdHMgYWxsIGFyZ3VtZW50cyBvbmUgcG9zaXRpb24gdG8gdGhlIHJpZ2h0LCBzbyB3ZSBhZGp1c3QgZm9yIHRoYXQgb2Zmc2V0LiAqL1xuXHQgICAgICAgICAgICB2YXIgc3RhcnRpbmdBcmd1bWVudFBvc2l0aW9uID0gYXJndW1lbnRJbmRleCArIDE7XG5cblx0ICAgICAgICAgICAgb3B0aW9ucyA9IHt9O1xuXG5cdCAgICAgICAgICAgIC8qIEl0ZXJhdGUgdGhyb3VnaCBhbGwgb3B0aW9ucyBhcmd1bWVudHMgKi9cblx0ICAgICAgICAgICAgZm9yICh2YXIgaSA9IHN0YXJ0aW5nQXJndW1lbnRQb3NpdGlvbjsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgLyogVHJlYXQgYSBudW1iZXIgYXMgYSBkdXJhdGlvbi4gUGFyc2UgaXQgb3V0LiAqL1xuXHQgICAgICAgICAgICAgICAgLyogTm90ZTogVGhlIGZvbGxvd2luZyBSZWdFeCB3aWxsIHJldHVybiB0cnVlIGlmIHBhc3NlZCBhbiBhcnJheSB3aXRoIGEgbnVtYmVyIGFzIGl0cyBmaXJzdCBpdGVtLlxuXHQgICAgICAgICAgICAgICAgICAgVGh1cywgYXJyYXlzIGFyZSBza2lwcGVkIGZyb20gdGhpcyBjaGVjay4gKi9cblx0ICAgICAgICAgICAgICAgIGlmICghVHlwZS5pc0FycmF5KGFyZ3VtZW50c1tpXSkgJiYgKC9eKGZhc3R8bm9ybWFsfHNsb3cpJC9pLnRlc3QoYXJndW1lbnRzW2ldKSB8fCAvXlxcZC8udGVzdChhcmd1bWVudHNbaV0pKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZHVyYXRpb24gPSBhcmd1bWVudHNbaV07XG5cdCAgICAgICAgICAgICAgICAvKiBUcmVhdCBzdHJpbmdzIGFuZCBhcnJheXMgYXMgZWFzaW5ncy4gKi9cblx0ICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoVHlwZS5pc1N0cmluZyhhcmd1bWVudHNbaV0pIHx8IFR5cGUuaXNBcnJheShhcmd1bWVudHNbaV0pKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5lYXNpbmcgPSBhcmd1bWVudHNbaV07XG5cdCAgICAgICAgICAgICAgICAvKiBUcmVhdCBhIGZ1bmN0aW9uIGFzIGEgY29tcGxldGUgY2FsbGJhY2suICovXG5cdCAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFR5cGUuaXNGdW5jdGlvbihhcmd1bWVudHNbaV0pKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5jb21wbGV0ZSA9IGFyZ3VtZW50c1tpXTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8qKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgUHJvbWlzZXNcblx0ICAgICAgICAqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICB2YXIgcHJvbWlzZURhdGEgPSB7XG5cdCAgICAgICAgICAgICAgICBwcm9taXNlOiBudWxsLFxuXHQgICAgICAgICAgICAgICAgcmVzb2x2ZXI6IG51bGwsXG5cdCAgICAgICAgICAgICAgICByZWplY3RlcjogbnVsbFxuXHQgICAgICAgICAgICB9O1xuXG5cdCAgICAgICAgLyogSWYgdGhpcyBjYWxsIHdhcyBtYWRlIHZpYSB0aGUgdXRpbGl0eSBmdW5jdGlvbiAod2hpY2ggaXMgdGhlIGRlZmF1bHQgbWV0aG9kIG9mIGludm9jYXRpb24gd2hlbiBqUXVlcnkvWmVwdG8gYXJlIG5vdCBiZWluZyB1c2VkKSwgYW5kIGlmXG5cdCAgICAgICAgICAgcHJvbWlzZSBzdXBwb3J0IHdhcyBkZXRlY3RlZCwgY3JlYXRlIGEgcHJvbWlzZSBvYmplY3QgZm9yIHRoaXMgY2FsbCBhbmQgc3RvcmUgcmVmZXJlbmNlcyB0byBpdHMgcmVzb2x2ZXIgYW5kIHJlamVjdGVyIG1ldGhvZHMuIFRoZSByZXNvbHZlXG5cdCAgICAgICAgICAgbWV0aG9kIGlzIHVzZWQgd2hlbiBhIGNhbGwgY29tcGxldGVzIG5hdHVyYWxseSBvciBpcyBwcmVtYXR1cmVseSBzdG9wcGVkIGJ5IHRoZSB1c2VyLiBJbiBib3RoIGNhc2VzLCBjb21wbGV0ZUNhbGwoKSBoYW5kbGVzIHRoZSBhc3NvY2lhdGVkXG5cdCAgICAgICAgICAgY2FsbCBjbGVhbnVwIGFuZCBwcm9taXNlIHJlc29sdmluZyBsb2dpYy4gVGhlIHJlamVjdCBtZXRob2QgaXMgdXNlZCB3aGVuIGFuIGludmFsaWQgc2V0IG9mIGFyZ3VtZW50cyBpcyBwYXNzZWQgaW50byBhIFZlbG9jaXR5IGNhbGwuICovXG5cdCAgICAgICAgLyogTm90ZTogVmVsb2NpdHkgZW1wbG95cyBhIGNhbGwtYmFzZWQgcXVldWVpbmcgYXJjaGl0ZWN0dXJlLCB3aGljaCBtZWFucyB0aGF0IHN0b3BwaW5nIGFuIGFuaW1hdGluZyBlbGVtZW50IGFjdHVhbGx5IHN0b3BzIHRoZSBmdWxsIGNhbGwgdGhhdFxuXHQgICAgICAgICAgIHRyaWdnZXJlZCBpdCAtLSBub3QgdGhhdCBvbmUgZWxlbWVudCBleGNsdXNpdmVseS4gU2ltaWxhcmx5LCB0aGVyZSBpcyBvbmUgcHJvbWlzZSBwZXIgY2FsbCwgYW5kIGFsbCBlbGVtZW50cyB0YXJnZXRlZCBieSBhIFZlbG9jaXR5IGNhbGwgYXJlXG5cdCAgICAgICAgICAgZ3JvdXBlZCB0b2dldGhlciBmb3IgdGhlIHB1cnBvc2VzIG9mIHJlc29sdmluZyBhbmQgcmVqZWN0aW5nIGEgcHJvbWlzZS4gKi9cblx0ICAgICAgICBpZiAoaXNVdGlsaXR5ICYmIFZlbG9jaXR5LlByb21pc2UpIHtcblx0ICAgICAgICAgICAgcHJvbWlzZURhdGEucHJvbWlzZSA9IG5ldyBWZWxvY2l0eS5Qcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0ICAgICAgICAgICAgICAgIHByb21pc2VEYXRhLnJlc29sdmVyID0gcmVzb2x2ZTtcblx0ICAgICAgICAgICAgICAgIHByb21pc2VEYXRhLnJlamVjdGVyID0gcmVqZWN0O1xuXHQgICAgICAgICAgICB9KTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgQWN0aW9uIERldGVjdGlvblxuXHQgICAgICAgICoqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgIC8qIFZlbG9jaXR5J3MgYmVoYXZpb3IgaXMgY2F0ZWdvcml6ZWQgaW50byBcImFjdGlvbnNcIjogRWxlbWVudHMgY2FuIGVpdGhlciBiZSBzcGVjaWFsbHkgc2Nyb2xsZWQgaW50byB2aWV3LFxuXHQgICAgICAgICAgIG9yIHRoZXkgY2FuIGJlIHN0YXJ0ZWQsIHN0b3BwZWQsIG9yIHJldmVyc2VkLiBJZiBhIGxpdGVyYWwgb3IgcmVmZXJlbmNlZCBwcm9wZXJ0aWVzIG1hcCBpcyBwYXNzZWQgaW4gYXMgVmVsb2NpdHknc1xuXHQgICAgICAgICAgIGZpcnN0IGFyZ3VtZW50LCB0aGUgYXNzb2NpYXRlZCBhY3Rpb24gaXMgXCJzdGFydFwiLiBBbHRlcm5hdGl2ZWx5LCBcInNjcm9sbFwiLCBcInJldmVyc2VcIiwgb3IgXCJzdG9wXCIgY2FuIGJlIHBhc3NlZCBpbiBpbnN0ZWFkIG9mIGEgcHJvcGVydGllcyBtYXAuICovXG5cdCAgICAgICAgdmFyIGFjdGlvbjtcblxuXHQgICAgICAgIHN3aXRjaCAocHJvcGVydGllc01hcCkge1xuXHQgICAgICAgICAgICBjYXNlIFwic2Nyb2xsXCI6XG5cdCAgICAgICAgICAgICAgICBhY3Rpb24gPSBcInNjcm9sbFwiO1xuXHQgICAgICAgICAgICAgICAgYnJlYWs7XG5cblx0ICAgICAgICAgICAgY2FzZSBcInJldmVyc2VcIjpcblx0ICAgICAgICAgICAgICAgIGFjdGlvbiA9IFwicmV2ZXJzZVwiO1xuXHQgICAgICAgICAgICAgICAgYnJlYWs7XG5cblx0ICAgICAgICAgICAgY2FzZSBcImZpbmlzaFwiOlxuXHQgICAgICAgICAgICBjYXNlIFwiZmluaXNoQWxsXCI6XG5cdCAgICAgICAgICAgIGNhc2UgXCJzdG9wXCI6XG5cdCAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgIEFjdGlvbjogU3RvcFxuXHQgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgLyogQ2xlYXIgdGhlIGN1cnJlbnRseS1hY3RpdmUgZGVsYXkgb24gZWFjaCB0YXJnZXRlZCBlbGVtZW50LiAqL1xuXHQgICAgICAgICAgICAgICAgJC5lYWNoKGVsZW1lbnRzLCBmdW5jdGlvbihpLCBlbGVtZW50KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkgJiYgRGF0YShlbGVtZW50KS5kZWxheVRpbWVyKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIFN0b3AgdGhlIHRpbWVyIGZyb20gdHJpZ2dlcmluZyBpdHMgY2FjaGVkIG5leHQoKSBmdW5jdGlvbi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KERhdGEoZWxlbWVudCkuZGVsYXlUaW1lci5zZXRUaW1lb3V0KTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBNYW51YWxseSBjYWxsIHRoZSBuZXh0KCkgZnVuY3Rpb24gc28gdGhhdCB0aGUgc3Vic2VxdWVudCBxdWV1ZSBpdGVtcyBjYW4gcHJvZ3Jlc3MuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpLmRlbGF5VGltZXIubmV4dCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5kZWxheVRpbWVyLm5leHQoKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBEYXRhKGVsZW1lbnQpLmRlbGF5VGltZXI7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogSWYgd2Ugd2FudCB0byBmaW5pc2ggZXZlcnl0aGluZyBpbiB0aGUgcXVldWUsIHdlIGhhdmUgdG8gaXRlcmF0ZSB0aHJvdWdoIGl0XG5cdCAgICAgICAgICAgICAgICAgICAgICAgYW5kIGNhbGwgZWFjaCBmdW5jdGlvbi4gVGhpcyB3aWxsIG1ha2UgdGhlbSBhY3RpdmUgY2FsbHMgYmVsb3csIHdoaWNoIHdpbGxcblx0ICAgICAgICAgICAgICAgICAgICAgICBjYXVzZSB0aGVtIHRvIGJlIGFwcGxpZWQgdmlhIHRoZSBkdXJhdGlvbiBzZXR0aW5nLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzTWFwID09PSBcImZpbmlzaEFsbFwiICYmIChvcHRpb25zID09PSB0cnVlIHx8IFR5cGUuaXNTdHJpbmcob3B0aW9ucykpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIEl0ZXJhdGUgdGhyb3VnaCB0aGUgaXRlbXMgaW4gdGhlIGVsZW1lbnQncyBxdWV1ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKCQucXVldWUoZWxlbWVudCwgVHlwZS5pc1N0cmluZyhvcHRpb25zKSA/IG9wdGlvbnMgOiBcIlwiKSwgZnVuY3Rpb24oXywgaXRlbSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVGhlIHF1ZXVlIGFycmF5IGNhbiBjb250YWluIGFuIFwiaW5wcm9ncmVzc1wiIHN0cmluZywgd2hpY2ggd2Ugc2tpcC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChUeXBlLmlzRnVuY3Rpb24oaXRlbSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtKCk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIENsZWFyaW5nIHRoZSAkLnF1ZXVlKCkgYXJyYXkgaXMgYWNoaWV2ZWQgYnkgcmVzZXR0aW5nIGl0IHRvIFtdLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAkLnF1ZXVlKGVsZW1lbnQsIFR5cGUuaXNTdHJpbmcob3B0aW9ucykgPyBvcHRpb25zIDogXCJcIiwgW10pO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH0pO1xuXG5cdCAgICAgICAgICAgICAgICB2YXIgY2FsbHNUb1N0b3AgPSBbXTtcblxuXHQgICAgICAgICAgICAgICAgLyogV2hlbiB0aGUgc3RvcCBhY3Rpb24gaXMgdHJpZ2dlcmVkLCB0aGUgZWxlbWVudHMnIGN1cnJlbnRseSBhY3RpdmUgY2FsbCBpcyBpbW1lZGlhdGVseSBzdG9wcGVkLiBUaGUgYWN0aXZlIGNhbGwgbWlnaHQgaGF2ZVxuXHQgICAgICAgICAgICAgICAgICAgYmVlbiBhcHBsaWVkIHRvIG11bHRpcGxlIGVsZW1lbnRzLCBpbiB3aGljaCBjYXNlIGFsbCBvZiB0aGUgY2FsbCdzIGVsZW1lbnRzIHdpbGwgYmUgc3RvcHBlZC4gV2hlbiBhbiBlbGVtZW50XG5cdCAgICAgICAgICAgICAgICAgICBpcyBzdG9wcGVkLCB0aGUgbmV4dCBpdGVtIGluIGl0cyBhbmltYXRpb24gcXVldWUgaXMgaW1tZWRpYXRlbHkgdHJpZ2dlcmVkLiAqL1xuXHQgICAgICAgICAgICAgICAgLyogQW4gYWRkaXRpb25hbCBhcmd1bWVudCBtYXkgYmUgcGFzc2VkIGluIHRvIGNsZWFyIGFuIGVsZW1lbnQncyByZW1haW5pbmcgcXVldWVkIGNhbGxzLiBFaXRoZXIgdHJ1ZSAod2hpY2ggZGVmYXVsdHMgdG8gdGhlIFwiZnhcIiBxdWV1ZSlcblx0ICAgICAgICAgICAgICAgICAgIG9yIGEgY3VzdG9tIHF1ZXVlIHN0cmluZyBjYW4gYmUgcGFzc2VkIGluLiAqL1xuXHQgICAgICAgICAgICAgICAgLyogTm90ZTogVGhlIHN0b3AgY29tbWFuZCBydW5zIHByaW9yIHRvIFZlbG9jaXR5J3MgUXVldWVpbmcgcGhhc2Ugc2luY2UgaXRzIGJlaGF2aW9yIGlzIGludGVuZGVkIHRvIHRha2UgZWZmZWN0ICppbW1lZGlhdGVseSosXG5cdCAgICAgICAgICAgICAgICAgICByZWdhcmRsZXNzIG9mIHRoZSBlbGVtZW50J3MgY3VycmVudCBxdWV1ZSBzdGF0ZS4gKi9cblxuXHQgICAgICAgICAgICAgICAgLyogSXRlcmF0ZSB0aHJvdWdoIGV2ZXJ5IGFjdGl2ZSBjYWxsLiAqL1xuXHQgICAgICAgICAgICAgICAgJC5lYWNoKFZlbG9jaXR5LlN0YXRlLmNhbGxzLCBmdW5jdGlvbihpLCBhY3RpdmVDYWxsKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogSW5hY3RpdmUgY2FsbHMgYXJlIHNldCB0byBmYWxzZSBieSB0aGUgbG9naWMgaW5zaWRlIGNvbXBsZXRlQ2FsbCgpLiBTa2lwIHRoZW0uICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGl2ZUNhbGwpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogSXRlcmF0ZSB0aHJvdWdoIHRoZSBhY3RpdmUgY2FsbCdzIHRhcmdldGVkIGVsZW1lbnRzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2goYWN0aXZlQ2FsbFsxXSwgZnVuY3Rpb24oaywgYWN0aXZlRWxlbWVudCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdHJ1ZSB3YXMgcGFzc2VkIGluIGFzIGEgc2Vjb25kYXJ5IGFyZ3VtZW50LCBjbGVhciBhYnNvbHV0ZWx5IGFsbCBjYWxscyBvbiB0aGlzIGVsZW1lbnQuIE90aGVyd2lzZSwgb25seVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXIgY2FsbHMgYXNzb2NpYXRlZCB3aXRoIHRoZSByZWxldmFudCBxdWV1ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENhbGwgc3RvcHBpbmcgbG9naWMgd29ya3MgYXMgZm9sbG93czpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0gb3B0aW9ucyA9PT0gdHJ1ZSAtLT4gc3RvcCBjdXJyZW50IGRlZmF1bHQgcXVldWUgY2FsbHMgKGFuZCBxdWV1ZTpmYWxzZSBjYWxscyksIGluY2x1ZGluZyByZW1haW5pbmcgcXVldWVkIG9uZXMuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIG9wdGlvbnMgPT09IHVuZGVmaW5lZCAtLT4gc3RvcCBjdXJyZW50IHF1ZXVlOlwiXCIgY2FsbCBhbmQgYWxsIHF1ZXVlOmZhbHNlIGNhbGxzLlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLSBvcHRpb25zID09PSBmYWxzZSAtLT4gc3RvcCBvbmx5IHF1ZXVlOmZhbHNlIGNhbGxzLlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLSBvcHRpb25zID09PSBcImN1c3RvbVwiIC0tPiBzdG9wIGN1cnJlbnQgcXVldWU6XCJjdXN0b21cIiBjYWxsLCBpbmNsdWRpbmcgcmVtYWluaW5nIHF1ZXVlZCBvbmVzICh0aGVyZSBpcyBubyBmdW5jdGlvbmFsaXR5IHRvIG9ubHkgY2xlYXIgdGhlIGN1cnJlbnRseS1ydW5uaW5nIHF1ZXVlOlwiY3VzdG9tXCIgY2FsbCkuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcXVldWVOYW1lID0gKG9wdGlvbnMgPT09IHVuZGVmaW5lZCkgPyBcIlwiIDogb3B0aW9ucztcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXVlTmFtZSAhPT0gdHJ1ZSAmJiAoYWN0aXZlQ2FsbFsyXS5xdWV1ZSAhPT0gcXVldWVOYW1lKSAmJiAhKG9wdGlvbnMgPT09IHVuZGVmaW5lZCAmJiBhY3RpdmVDYWxsWzJdLnF1ZXVlID09PSBmYWxzZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSXRlcmF0ZSB0aHJvdWdoIHRoZSBjYWxscyB0YXJnZXRlZCBieSB0aGUgc3RvcCBjb21tYW5kLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGVsZW1lbnRzLCBmdW5jdGlvbihsLCBlbGVtZW50KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQ2hlY2sgdGhhdCB0aGlzIGNhbGwgd2FzIGFwcGxpZWQgdG8gdGhlIHRhcmdldCBlbGVtZW50LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbGVtZW50ID09PSBhY3RpdmVFbGVtZW50KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE9wdGlvbmFsbHkgY2xlYXIgdGhlIHJlbWFpbmluZyBxdWV1ZWQgY2FsbHMuIElmIHdlJ3JlIGRvaW5nIFwiZmluaXNoQWxsXCIgdGhpcyB3b24ndCBmaW5kIGFueXRoaW5nLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkdWUgdG8gdGhlIHF1ZXVlLWNsZWFyaW5nIGFib3ZlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucyA9PT0gdHJ1ZSB8fCBUeXBlLmlzU3RyaW5nKG9wdGlvbnMpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJdGVyYXRlIHRocm91Z2ggdGhlIGl0ZW1zIGluIHRoZSBlbGVtZW50J3MgcXVldWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2goJC5xdWV1ZShlbGVtZW50LCBUeXBlLmlzU3RyaW5nKG9wdGlvbnMpID8gb3B0aW9ucyA6IFwiXCIpLCBmdW5jdGlvbihfLCBpdGVtKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVGhlIHF1ZXVlIGFycmF5IGNhbiBjb250YWluIGFuIFwiaW5wcm9ncmVzc1wiIHN0cmluZywgd2hpY2ggd2Ugc2tpcC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoVHlwZS5pc0Z1bmN0aW9uKGl0ZW0pKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFBhc3MgdGhlIGl0ZW0ncyBjYWxsYmFjayBhIGZsYWcgaW5kaWNhdGluZyB0aGF0IHdlIHdhbnQgdG8gYWJvcnQgZnJvbSB0aGUgcXVldWUgY2FsbC5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKFNwZWNpZmljYWxseSwgdGhlIHF1ZXVlIHdpbGwgcmVzb2x2ZSB0aGUgY2FsbCdzIGFzc29jaWF0ZWQgcHJvbWlzZSB0aGVuIGFib3J0LikgICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0obnVsbCwgdHJ1ZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENsZWFyaW5nIHRoZSAkLnF1ZXVlKCkgYXJyYXkgaXMgYWNoaWV2ZWQgYnkgcmVzZXR0aW5nIGl0IHRvIFtdLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5xdWV1ZShlbGVtZW50LCBUeXBlLmlzU3RyaW5nKG9wdGlvbnMpID8gb3B0aW9ucyA6IFwiXCIsIFtdKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzTWFwID09PSBcInN0b3BcIikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU2luY2UgXCJyZXZlcnNlXCIgdXNlcyBjYWNoZWQgc3RhcnQgdmFsdWVzICh0aGUgcHJldmlvdXMgY2FsbCdzIGVuZFZhbHVlcyksIHRoZXNlIHZhbHVlcyBtdXN0IGJlXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VkIHRvIHJlZmxlY3QgdGhlIGZpbmFsIHZhbHVlIHRoYXQgdGhlIGVsZW1lbnRzIHdlcmUgYWN0dWFsbHkgdHdlZW5lZCB0by4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IElmIG9ubHkgcXVldWU6ZmFsc2UgYW5pbWF0aW9ucyBhcmUgY3VycmVudGx5IHJ1bm5pbmcgb24gYW4gZWxlbWVudCwgaXQgd29uJ3QgaGF2ZSBhIHR3ZWVuc0NvbnRhaW5lclxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0LiBBbHNvLCBxdWV1ZTpmYWxzZSBhbmltYXRpb25zIGNhbid0IGJlIHJldmVyc2VkLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkgJiYgRGF0YShlbGVtZW50KS50d2VlbnNDb250YWluZXIgJiYgcXVldWVOYW1lICE9PSBmYWxzZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChEYXRhKGVsZW1lbnQpLnR3ZWVuc0NvbnRhaW5lciwgZnVuY3Rpb24obSwgYWN0aXZlVHdlZW4pIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlVHdlZW4uZW5kVmFsdWUgPSBhY3RpdmVUd2Vlbi5jdXJyZW50VmFsdWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxzVG9TdG9wLnB1c2goaSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvcGVydGllc01hcCA9PT0gXCJmaW5pc2hcIiB8fCBwcm9wZXJ0aWVzTWFwID09PSBcImZpbmlzaEFsbFwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBUbyBnZXQgYWN0aXZlIHR3ZWVucyB0byBmaW5pc2ggaW1tZWRpYXRlbHksIHdlIGZvcmNlZnVsbHkgc2hvcnRlbiB0aGVpciBkdXJhdGlvbnMgdG8gMW1zIHNvIHRoYXRcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZXkgZmluaXNoIHVwb24gdGhlIG5leHQgckFmIHRpY2sgdGhlbiBwcm9jZWVkIHdpdGggbm9ybWFsIGNhbGwgY29tcGxldGlvbiBsb2dpYy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZUNhbGxbMl0uZHVyYXRpb24gPSAxO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH0pO1xuXG5cdCAgICAgICAgICAgICAgICAvKiBQcmVtYXR1cmVseSBjYWxsIGNvbXBsZXRlQ2FsbCgpIG9uIGVhY2ggbWF0Y2hlZCBhY3RpdmUgY2FsbC4gUGFzcyBhbiBhZGRpdGlvbmFsIGZsYWcgZm9yIFwic3RvcFwiIHRvIGluZGljYXRlXG5cdCAgICAgICAgICAgICAgICAgICB0aGF0IHRoZSBjb21wbGV0ZSBjYWxsYmFjayBhbmQgZGlzcGxheTpub25lIHNldHRpbmcgc2hvdWxkIGJlIHNraXBwZWQgc2luY2Ugd2UncmUgY29tcGxldGluZyBwcmVtYXR1cmVseS4gKi9cblx0ICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0aWVzTWFwID09PSBcInN0b3BcIikge1xuXHQgICAgICAgICAgICAgICAgICAgICQuZWFjaChjYWxsc1RvU3RvcCwgZnVuY3Rpb24oaSwgaikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjb21wbGV0ZUNhbGwoaiwgdHJ1ZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICBpZiAocHJvbWlzZURhdGEucHJvbWlzZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBJbW1lZGlhdGVseSByZXNvbHZlIHRoZSBwcm9taXNlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHN0b3AgY2FsbCBzaW5jZSBzdG9wIHJ1bnMgc3luY2hyb25vdXNseS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZURhdGEucmVzb2x2ZXIoZWxlbWVudHMpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgLyogU2luY2Ugd2UncmUgc3RvcHBpbmcsIGFuZCBub3QgcHJvY2VlZGluZyB3aXRoIHF1ZXVlaW5nLCBleGl0IG91dCBvZiBWZWxvY2l0eS4gKi9cblx0ICAgICAgICAgICAgICAgIHJldHVybiBnZXRDaGFpbigpO1xuXG5cdCAgICAgICAgICAgIGRlZmF1bHQ6XG5cdCAgICAgICAgICAgICAgICAvKiBUcmVhdCBhIG5vbi1lbXB0eSBwbGFpbiBvYmplY3QgYXMgYSBsaXRlcmFsIHByb3BlcnRpZXMgbWFwLiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdChwcm9wZXJ0aWVzTWFwKSAmJiAhVHlwZS5pc0VtcHR5T2JqZWN0KHByb3BlcnRpZXNNYXApKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0gXCJzdGFydFwiO1xuXG5cdCAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgIFJlZGlyZWN0c1xuXHQgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgLyogQ2hlY2sgaWYgYSBzdHJpbmcgbWF0Y2hlcyBhIHJlZ2lzdGVyZWQgcmVkaXJlY3QgKHNlZSBSZWRpcmVjdHMgYWJvdmUpLiAqL1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChUeXBlLmlzU3RyaW5nKHByb3BlcnRpZXNNYXApICYmIFZlbG9jaXR5LlJlZGlyZWN0c1twcm9wZXJ0aWVzTWFwXSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciBvcHRzID0gJC5leHRlbmQoe30sIG9wdGlvbnMpLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbk9yaWdpbmFsID0gb3B0cy5kdXJhdGlvbixcblx0ICAgICAgICAgICAgICAgICAgICAgICAgZGVsYXlPcmlnaW5hbCA9IG9wdHMuZGVsYXkgfHwgMDtcblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBiYWNrd2FyZHMgb3B0aW9uIHdhcyBwYXNzZWQgaW4sIHJldmVyc2UgdGhlIGVsZW1lbnQgc2V0IHNvIHRoYXQgZWxlbWVudHMgYW5pbWF0ZSBmcm9tIHRoZSBsYXN0IHRvIHRoZSBmaXJzdC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5iYWNrd2FyZHMgPT09IHRydWUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudHMgPSAkLmV4dGVuZCh0cnVlLCBbXSwgZWxlbWVudHMpLnJldmVyc2UoKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBJbmRpdmlkdWFsbHkgdHJpZ2dlciB0aGUgcmVkaXJlY3QgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUgc2V0IHRvIHByZXZlbnQgdXNlcnMgZnJvbSBoYXZpbmcgdG8gaGFuZGxlIGl0ZXJhdGlvbiBsb2dpYyBpbiB0aGVpciByZWRpcmVjdC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAkLmVhY2goZWxlbWVudHMsIGZ1bmN0aW9uKGVsZW1lbnRJbmRleCwgZWxlbWVudCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgc3RhZ2dlciBvcHRpb24gd2FzIHBhc3NlZCBpbiwgc3VjY2Vzc2l2ZWx5IGRlbGF5IGVhY2ggZWxlbWVudCBieSB0aGUgc3RhZ2dlciB2YWx1ZSAoaW4gbXMpLiBSZXRhaW4gdGhlIG9yaWdpbmFsIGRlbGF5IHZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyc2VGbG9hdChvcHRzLnN0YWdnZXIpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmRlbGF5ID0gZGVsYXlPcmlnaW5hbCArIChwYXJzZUZsb2F0KG9wdHMuc3RhZ2dlcikgKiBlbGVtZW50SW5kZXgpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFR5cGUuaXNGdW5jdGlvbihvcHRzLnN0YWdnZXIpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmRlbGF5ID0gZGVsYXlPcmlnaW5hbCArIG9wdHMuc3RhZ2dlci5jYWxsKGVsZW1lbnQsIGVsZW1lbnRJbmRleCwgZWxlbWVudHNMZW5ndGgpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGRyYWcgb3B0aW9uIHdhcyBwYXNzZWQgaW4sIHN1Y2Nlc3NpdmVseSBpbmNyZWFzZS9kZWNyZWFzZSAoZGVwZW5kaW5nIG9uIHRoZSBwcmVzZW5zZSBvZiBvcHRzLmJhY2t3YXJkcylcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIGR1cmF0aW9uIG9mIGVhY2ggZWxlbWVudCdzIGFuaW1hdGlvbiwgdXNpbmcgZmxvb3JzIHRvIHByZXZlbnQgcHJvZHVjaW5nIHZlcnkgc2hvcnQgZHVyYXRpb25zLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5kcmFnKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBEZWZhdWx0IHRoZSBkdXJhdGlvbiBvZiBVSSBwYWNrIGVmZmVjdHMgKGNhbGxvdXRzIGFuZCB0cmFuc2l0aW9ucykgdG8gMTAwMG1zIGluc3RlYWQgb2YgdGhlIHVzdWFsIGRlZmF1bHQgZHVyYXRpb24gb2YgNDAwbXMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmR1cmF0aW9uID0gcGFyc2VGbG9hdChkdXJhdGlvbk9yaWdpbmFsKSB8fCAoL14oY2FsbG91dHx0cmFuc2l0aW9uKS8udGVzdChwcm9wZXJ0aWVzTWFwKSA/IDEwMDAgOiBEVVJBVElPTl9ERUZBVUxUKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRm9yIGVhY2ggZWxlbWVudCwgdGFrZSB0aGUgZ3JlYXRlciBkdXJhdGlvbiBvZjogQSkgYW5pbWF0aW9uIGNvbXBsZXRpb24gcGVyY2VudGFnZSByZWxhdGl2ZSB0byB0aGUgb3JpZ2luYWwgZHVyYXRpb24sXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBCKSA3NSUgb2YgdGhlIG9yaWdpbmFsIGR1cmF0aW9uLCBvciBDKSBhIDIwMG1zIGZhbGxiYWNrIChpbiBjYXNlIGR1cmF0aW9uIGlzIGFscmVhZHkgc2V0IHRvIGEgbG93IHZhbHVlKS5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBlbmQgcmVzdWx0IGlzIGEgYmFzZWxpbmUgb2YgNzUlIG9mIHRoZSByZWRpcmVjdCdzIGR1cmF0aW9uIHRoYXQgaW5jcmVhc2VzL2RlY3JlYXNlcyBhcyB0aGUgZW5kIG9mIHRoZSBlbGVtZW50IHNldCBpcyBhcHByb2FjaGVkLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0cy5kdXJhdGlvbiA9IE1hdGgubWF4KG9wdHMuZHVyYXRpb24gKiAob3B0cy5iYWNrd2FyZHMgPyAxIC0gZWxlbWVudEluZGV4L2VsZW1lbnRzTGVuZ3RoIDogKGVsZW1lbnRJbmRleCArIDEpIC8gZWxlbWVudHNMZW5ndGgpLCBvcHRzLmR1cmF0aW9uICogMC43NSwgMjAwKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIFBhc3MgaW4gdGhlIGNhbGwncyBvcHRzIG9iamVjdCBzbyB0aGF0IHRoZSByZWRpcmVjdCBjYW4gb3B0aW9uYWxseSBleHRlbmQgaXQuIEl0IGRlZmF1bHRzIHRvIGFuIGVtcHR5IG9iamVjdCBpbnN0ZWFkIG9mIG51bGwgdG9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVkdWNlIHRoZSBvcHRzIGNoZWNraW5nIGxvZ2ljIHJlcXVpcmVkIGluc2lkZSB0aGUgcmVkaXJlY3QuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LlJlZGlyZWN0c1twcm9wZXJ0aWVzTWFwXS5jYWxsKGVsZW1lbnQsIGVsZW1lbnQsIG9wdHMgfHwge30sIGVsZW1lbnRJbmRleCwgZWxlbWVudHNMZW5ndGgsIGVsZW1lbnRzLCBwcm9taXNlRGF0YS5wcm9taXNlID8gcHJvbWlzZURhdGEgOiB1bmRlZmluZWQpO1xuXHQgICAgICAgICAgICAgICAgICAgIH0pO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogU2luY2UgdGhlIGFuaW1hdGlvbiBsb2dpYyByZXNpZGVzIHdpdGhpbiB0aGUgcmVkaXJlY3QncyBvd24gY29kZSwgYWJvcnQgdGhlIHJlbWFpbmRlciBvZiB0aGlzIGNhbGwuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgKFRoZSBwZXJmb3JtYW5jZSBvdmVyaGVhZCB1cCB0byB0aGlzIHBvaW50IGlzIHZpcnR1YWxseSBub24tZXhpc3RhbnQuKSAqL1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFRoZSBqUXVlcnkgY2FsbCBjaGFpbiBpcyBrZXB0IGludGFjdCBieSByZXR1cm5pbmcgdGhlIGNvbXBsZXRlIGVsZW1lbnQgc2V0LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBnZXRDaGFpbigpO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgYWJvcnRFcnJvciA9IFwiVmVsb2NpdHk6IEZpcnN0IGFyZ3VtZW50IChcIiArIHByb3BlcnRpZXNNYXAgKyBcIikgd2FzIG5vdCBhIHByb3BlcnR5IG1hcCwgYSBrbm93biBhY3Rpb24sIG9yIGEgcmVnaXN0ZXJlZCByZWRpcmVjdC4gQWJvcnRpbmcuXCI7XG5cblx0ICAgICAgICAgICAgICAgICAgICBpZiAocHJvbWlzZURhdGEucHJvbWlzZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlRGF0YS5yZWplY3RlcihuZXcgRXJyb3IoYWJvcnRFcnJvcikpO1xuXHQgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGFib3J0RXJyb3IpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBnZXRDaGFpbigpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICBDYWxsLVdpZGUgVmFyaWFibGVzXG5cdCAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAvKiBBIGNvbnRhaW5lciBmb3IgQ1NTIHVuaXQgY29udmVyc2lvbiByYXRpb3MgKGUuZy4gJSwgcmVtLCBhbmQgZW0gPT0+IHB4KSB0aGF0IGlzIHVzZWQgdG8gY2FjaGUgcmF0aW9zIGFjcm9zcyBhbGwgZWxlbWVudHNcblx0ICAgICAgICAgICBiZWluZyBhbmltYXRlZCBpbiBhIHNpbmdsZSBWZWxvY2l0eSBjYWxsLiBDYWxjdWxhdGluZyB1bml0IHJhdGlvcyBuZWNlc3NpdGF0ZXMgRE9NIHF1ZXJ5aW5nIGFuZCB1cGRhdGluZywgYW5kIGlzIHRoZXJlZm9yZVxuXHQgICAgICAgICAgIGF2b2lkZWQgKHZpYSBjYWNoaW5nKSB3aGVyZXZlciBwb3NzaWJsZS4gVGhpcyBjb250YWluZXIgaXMgY2FsbC13aWRlIGluc3RlYWQgb2YgcGFnZS13aWRlIHRvIGF2b2lkIHRoZSByaXNrIG9mIHVzaW5nIHN0YWxlXG5cdCAgICAgICAgICAgY29udmVyc2lvbiBtZXRyaWNzIGFjcm9zcyBWZWxvY2l0eSBhbmltYXRpb25zIHRoYXQgYXJlIG5vdCBpbW1lZGlhdGVseSBjb25zZWN1dGl2ZWx5IGNoYWluZWQuICovXG5cdCAgICAgICAgdmFyIGNhbGxVbml0Q29udmVyc2lvbkRhdGEgPSB7XG5cdCAgICAgICAgICAgICAgICBsYXN0UGFyZW50OiBudWxsLFxuXHQgICAgICAgICAgICAgICAgbGFzdFBvc2l0aW9uOiBudWxsLFxuXHQgICAgICAgICAgICAgICAgbGFzdEZvbnRTaXplOiBudWxsLFxuXHQgICAgICAgICAgICAgICAgbGFzdFBlcmNlbnRUb1B4V2lkdGg6IG51bGwsXG5cdCAgICAgICAgICAgICAgICBsYXN0UGVyY2VudFRvUHhIZWlnaHQ6IG51bGwsXG5cdCAgICAgICAgICAgICAgICBsYXN0RW1Ub1B4OiBudWxsLFxuXHQgICAgICAgICAgICAgICAgcmVtVG9QeDogbnVsbCxcblx0ICAgICAgICAgICAgICAgIHZ3VG9QeDogbnVsbCxcblx0ICAgICAgICAgICAgICAgIHZoVG9QeDogbnVsbFxuXHQgICAgICAgICAgICB9O1xuXG5cdCAgICAgICAgLyogQSBjb250YWluZXIgZm9yIGFsbCB0aGUgZW5zdWluZyB0d2VlbiBkYXRhIGFuZCBtZXRhZGF0YSBhc3NvY2lhdGVkIHdpdGggdGhpcyBjYWxsLiBUaGlzIGNvbnRhaW5lciBnZXRzIHB1c2hlZCB0byB0aGUgcGFnZS13aWRlXG5cdCAgICAgICAgICAgVmVsb2NpdHkuU3RhdGUuY2FsbHMgYXJyYXkgdGhhdCBpcyBwcm9jZXNzZWQgZHVyaW5nIGFuaW1hdGlvbiB0aWNraW5nLiAqL1xuXHQgICAgICAgIHZhciBjYWxsID0gW107XG5cblx0ICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgRWxlbWVudCBQcm9jZXNzaW5nXG5cdCAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgLyogRWxlbWVudCBwcm9jZXNzaW5nIGNvbnNpc3RzIG9mIHRocmVlIHBhcnRzIC0tIGRhdGEgcHJvY2Vzc2luZyB0aGF0IGNhbm5vdCBnbyBzdGFsZSBhbmQgZGF0YSBwcm9jZXNzaW5nIHRoYXQgKmNhbiogZ28gc3RhbGUgKGkuZS4gdGhpcmQtcGFydHkgc3R5bGUgbW9kaWZpY2F0aW9ucyk6XG5cdCAgICAgICAgICAgMSkgUHJlLVF1ZXVlaW5nOiBFbGVtZW50LXdpZGUgdmFyaWFibGVzLCBpbmNsdWRpbmcgdGhlIGVsZW1lbnQncyBkYXRhIHN0b3JhZ2UsIGFyZSBpbnN0YW50aWF0ZWQuIENhbGwgb3B0aW9ucyBhcmUgcHJlcGFyZWQuIElmIHRyaWdnZXJlZCwgdGhlIFN0b3AgYWN0aW9uIGlzIGV4ZWN1dGVkLlxuXHQgICAgICAgICAgIDIpIFF1ZXVlaW5nOiBUaGUgbG9naWMgdGhhdCBydW5zIG9uY2UgdGhpcyBjYWxsIGhhcyByZWFjaGVkIGl0cyBwb2ludCBvZiBleGVjdXRpb24gaW4gdGhlIGVsZW1lbnQncyAkLnF1ZXVlKCkgc3RhY2suIE1vc3QgbG9naWMgaXMgcGxhY2VkIGhlcmUgdG8gYXZvaWQgcmlza2luZyBpdCBiZWNvbWluZyBzdGFsZS5cblx0ICAgICAgICAgICAzKSBQdXNoaW5nOiBDb25zb2xpZGF0aW9uIG9mIHRoZSB0d2VlbiBkYXRhIGZvbGxvd2VkIGJ5IGl0cyBwdXNoIG9udG8gdGhlIGdsb2JhbCBpbi1wcm9ncmVzcyBjYWxscyBjb250YWluZXIuXG5cdCAgICAgICAgKi9cblxuXHQgICAgICAgIGZ1bmN0aW9uIHByb2Nlc3NFbGVtZW50ICgpIHtcblxuXHQgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICBQYXJ0IEk6IFByZS1RdWV1ZWluZ1xuXHQgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgRWxlbWVudC1XaWRlIFZhcmlhYmxlc1xuXHQgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSB0aGlzLFxuXHQgICAgICAgICAgICAgICAgLyogVGhlIHJ1bnRpbWUgb3B0cyBvYmplY3QgaXMgdGhlIGV4dGVuc2lvbiBvZiB0aGUgY3VycmVudCBjYWxsJ3Mgb3B0aW9ucyBhbmQgVmVsb2NpdHkncyBwYWdlLXdpZGUgb3B0aW9uIGRlZmF1bHRzLiAqL1xuXHQgICAgICAgICAgICAgICAgb3B0cyA9ICQuZXh0ZW5kKHt9LCBWZWxvY2l0eS5kZWZhdWx0cywgb3B0aW9ucyksXG5cdCAgICAgICAgICAgICAgICAvKiBBIGNvbnRhaW5lciBmb3IgdGhlIHByb2Nlc3NlZCBkYXRhIGFzc29jaWF0ZWQgd2l0aCBlYWNoIHByb3BlcnR5IGluIHRoZSBwcm9wZXJ0eU1hcC5cblx0ICAgICAgICAgICAgICAgICAgIChFYWNoIHByb3BlcnR5IGluIHRoZSBtYXAgcHJvZHVjZXMgaXRzIG93biBcInR3ZWVuXCIuKSAqL1xuXHQgICAgICAgICAgICAgICAgdHdlZW5zQ29udGFpbmVyID0ge30sXG5cdCAgICAgICAgICAgICAgICBlbGVtZW50VW5pdENvbnZlcnNpb25EYXRhO1xuXG5cdCAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgRWxlbWVudCBJbml0XG5cdCAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICBpZiAoRGF0YShlbGVtZW50KSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICBWZWxvY2l0eS5pbml0KGVsZW1lbnQpO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICBPcHRpb246IERlbGF5XG5cdCAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAvKiBTaW5jZSBxdWV1ZTpmYWxzZSBkb2Vzbid0IHJlc3BlY3QgdGhlIGl0ZW0ncyBleGlzdGluZyBxdWV1ZSwgd2UgYXZvaWQgaW5qZWN0aW5nIGl0cyBkZWxheSBoZXJlIChpdCdzIHNldCBsYXRlciBvbikuICovXG5cdCAgICAgICAgICAgIC8qIE5vdGU6IFZlbG9jaXR5IHJvbGxzIGl0cyBvd24gZGVsYXkgZnVuY3Rpb24gc2luY2UgalF1ZXJ5IGRvZXNuJ3QgaGF2ZSBhIHV0aWxpdHkgYWxpYXMgZm9yICQuZm4uZGVsYXkoKVxuXHQgICAgICAgICAgICAgICAoYW5kIHRodXMgcmVxdWlyZXMgalF1ZXJ5IGVsZW1lbnQgY3JlYXRpb24sIHdoaWNoIHdlIGF2b2lkIHNpbmNlIGl0cyBvdmVyaGVhZCBpbmNsdWRlcyBET00gcXVlcnlpbmcpLiAqL1xuXHQgICAgICAgICAgICBpZiAocGFyc2VGbG9hdChvcHRzLmRlbGF5KSAmJiBvcHRzLnF1ZXVlICE9PSBmYWxzZSkge1xuXHQgICAgICAgICAgICAgICAgJC5xdWV1ZShlbGVtZW50LCBvcHRzLnF1ZXVlLCBmdW5jdGlvbihuZXh0KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogVGhpcyBpcyBhIGZsYWcgdXNlZCB0byBpbmRpY2F0ZSB0byB0aGUgdXBjb21pbmcgY29tcGxldGVDYWxsKCkgZnVuY3Rpb24gdGhhdCB0aGlzIHF1ZXVlIGVudHJ5IHdhcyBpbml0aWF0ZWQgYnkgVmVsb2NpdHkuIFNlZSBjb21wbGV0ZUNhbGwoKSBmb3IgZnVydGhlciBkZXRhaWxzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LnZlbG9jaXR5UXVldWVFbnRyeUZsYWcgPSB0cnVlO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogVGhlIGVuc3VpbmcgcXVldWUgaXRlbSAod2hpY2ggaXMgYXNzaWduZWQgdG8gdGhlIFwibmV4dFwiIGFyZ3VtZW50IHRoYXQgJC5xdWV1ZSgpIGF1dG9tYXRpY2FsbHkgcGFzc2VzIGluKSB3aWxsIGJlIHRyaWdnZXJlZCBhZnRlciBhIHNldFRpbWVvdXQgZGVsYXkuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgVGhlIHNldFRpbWVvdXQgaXMgc3RvcmVkIHNvIHRoYXQgaXQgY2FuIGJlIHN1YmplY3RlZCB0byBjbGVhclRpbWVvdXQoKSBpZiB0aGlzIGFuaW1hdGlvbiBpcyBwcmVtYXR1cmVseSBzdG9wcGVkIHZpYSBWZWxvY2l0eSdzIFwic3RvcFwiIGNvbW1hbmQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5kZWxheVRpbWVyID0ge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0OiBzZXRUaW1lb3V0KG5leHQsIHBhcnNlRmxvYXQob3B0cy5kZWxheSkpLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICBuZXh0OiBuZXh0XG5cdCAgICAgICAgICAgICAgICAgICAgfTtcblx0ICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICBPcHRpb246IER1cmF0aW9uXG5cdCAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAvKiBTdXBwb3J0IGZvciBqUXVlcnkncyBuYW1lZCBkdXJhdGlvbnMuICovXG5cdCAgICAgICAgICAgIHN3aXRjaCAob3B0cy5kdXJhdGlvbi50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkpIHtcblx0ICAgICAgICAgICAgICAgIGNhc2UgXCJmYXN0XCI6XG5cdCAgICAgICAgICAgICAgICAgICAgb3B0cy5kdXJhdGlvbiA9IDIwMDtcblx0ICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuXHQgICAgICAgICAgICAgICAgY2FzZSBcIm5vcm1hbFwiOlxuXHQgICAgICAgICAgICAgICAgICAgIG9wdHMuZHVyYXRpb24gPSBEVVJBVElPTl9ERUZBVUxUO1xuXHQgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG5cdCAgICAgICAgICAgICAgICBjYXNlIFwic2xvd1wiOlxuXHQgICAgICAgICAgICAgICAgICAgIG9wdHMuZHVyYXRpb24gPSA2MDA7XG5cdCAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cblx0ICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG5cdCAgICAgICAgICAgICAgICAgICAgLyogUmVtb3ZlIHRoZSBwb3RlbnRpYWwgXCJtc1wiIHN1ZmZpeCBhbmQgZGVmYXVsdCB0byAxIGlmIHRoZSB1c2VyIGlzIGF0dGVtcHRpbmcgdG8gc2V0IGEgZHVyYXRpb24gb2YgMCAoaW4gb3JkZXIgdG8gcHJvZHVjZSBhbiBpbW1lZGlhdGUgc3R5bGUgY2hhbmdlKS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBvcHRzLmR1cmF0aW9uID0gcGFyc2VGbG9hdChvcHRzLmR1cmF0aW9uKSB8fCAxO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICBHbG9iYWwgT3B0aW9uOiBNb2NrXG5cdCAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICBpZiAoVmVsb2NpdHkubW9jayAhPT0gZmFsc2UpIHtcblx0ICAgICAgICAgICAgICAgIC8qIEluIG1vY2sgbW9kZSwgYWxsIGFuaW1hdGlvbnMgYXJlIGZvcmNlZCB0byAxbXMgc28gdGhhdCB0aGV5IG9jY3VyIGltbWVkaWF0ZWx5IHVwb24gdGhlIG5leHQgckFGIHRpY2suXG5cdCAgICAgICAgICAgICAgICAgICBBbHRlcm5hdGl2ZWx5LCBhIG11bHRpcGxpZXIgY2FuIGJlIHBhc3NlZCBpbiB0byB0aW1lIHJlbWFwIGFsbCBkZWxheXMgYW5kIGR1cmF0aW9ucy4gKi9cblx0ICAgICAgICAgICAgICAgIGlmIChWZWxvY2l0eS5tb2NrID09PSB0cnVlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgb3B0cy5kdXJhdGlvbiA9IG9wdHMuZGVsYXkgPSAxO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICBvcHRzLmR1cmF0aW9uICo9IHBhcnNlRmxvYXQoVmVsb2NpdHkubW9jaykgfHwgMTtcblx0ICAgICAgICAgICAgICAgICAgICBvcHRzLmRlbGF5ICo9IHBhcnNlRmxvYXQoVmVsb2NpdHkubW9jaykgfHwgMTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgIE9wdGlvbjogRWFzaW5nXG5cdCAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgb3B0cy5lYXNpbmcgPSBnZXRFYXNpbmcob3B0cy5lYXNpbmcsIG9wdHMuZHVyYXRpb24pO1xuXG5cdCAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgIE9wdGlvbjogQ2FsbGJhY2tzXG5cdCAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgLyogQ2FsbGJhY2tzIG11c3QgZnVuY3Rpb25zLiBPdGhlcndpc2UsIGRlZmF1bHQgdG8gbnVsbC4gKi9cblx0ICAgICAgICAgICAgaWYgKG9wdHMuYmVnaW4gJiYgIVR5cGUuaXNGdW5jdGlvbihvcHRzLmJlZ2luKSkge1xuXHQgICAgICAgICAgICAgICAgb3B0cy5iZWdpbiA9IG51bGw7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBpZiAob3B0cy5wcm9ncmVzcyAmJiAhVHlwZS5pc0Z1bmN0aW9uKG9wdHMucHJvZ3Jlc3MpKSB7XG5cdCAgICAgICAgICAgICAgICBvcHRzLnByb2dyZXNzID0gbnVsbDtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIGlmIChvcHRzLmNvbXBsZXRlICYmICFUeXBlLmlzRnVuY3Rpb24ob3B0cy5jb21wbGV0ZSkpIHtcblx0ICAgICAgICAgICAgICAgIG9wdHMuY29tcGxldGUgPSBudWxsO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICBPcHRpb246IERpc3BsYXkgJiBWaXNpYmlsaXR5XG5cdCAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAvKiBSZWZlciB0byBWZWxvY2l0eSdzIGRvY3VtZW50YXRpb24gKFZlbG9jaXR5SlMub3JnLyNkaXNwbGF5QW5kVmlzaWJpbGl0eSkgZm9yIGEgZGVzY3JpcHRpb24gb2YgdGhlIGRpc3BsYXkgYW5kIHZpc2liaWxpdHkgb3B0aW9ucycgYmVoYXZpb3IuICovXG5cdCAgICAgICAgICAgIC8qIE5vdGU6IFdlIHN0cmljdGx5IGNoZWNrIGZvciB1bmRlZmluZWQgaW5zdGVhZCBvZiBmYWxzaW5lc3MgYmVjYXVzZSBkaXNwbGF5IGFjY2VwdHMgYW4gZW1wdHkgc3RyaW5nIHZhbHVlLiAqL1xuXHQgICAgICAgICAgICBpZiAob3B0cy5kaXNwbGF5ICE9PSB1bmRlZmluZWQgJiYgb3B0cy5kaXNwbGF5ICE9PSBudWxsKSB7XG5cdCAgICAgICAgICAgICAgICBvcHRzLmRpc3BsYXkgPSBvcHRzLmRpc3BsYXkudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpO1xuXG5cdCAgICAgICAgICAgICAgICAvKiBVc2VycyBjYW4gcGFzcyBpbiBhIHNwZWNpYWwgXCJhdXRvXCIgdmFsdWUgdG8gaW5zdHJ1Y3QgVmVsb2NpdHkgdG8gc2V0IHRoZSBlbGVtZW50IHRvIGl0cyBkZWZhdWx0IGRpc3BsYXkgdmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICBpZiAob3B0cy5kaXNwbGF5ID09PSBcImF1dG9cIikge1xuXHQgICAgICAgICAgICAgICAgICAgIG9wdHMuZGlzcGxheSA9IFZlbG9jaXR5LkNTUy5WYWx1ZXMuZ2V0RGlzcGxheVR5cGUoZWxlbWVudCk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBpZiAob3B0cy52aXNpYmlsaXR5ICE9PSB1bmRlZmluZWQgJiYgb3B0cy52aXNpYmlsaXR5ICE9PSBudWxsKSB7XG5cdCAgICAgICAgICAgICAgICBvcHRzLnZpc2liaWxpdHkgPSBvcHRzLnZpc2liaWxpdHkudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgT3B0aW9uOiBtb2JpbGVIQVxuXHQgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgIC8qIFdoZW4gc2V0IHRvIHRydWUsIGFuZCBpZiB0aGlzIGlzIGEgbW9iaWxlIGRldmljZSwgbW9iaWxlSEEgYXV0b21hdGljYWxseSBlbmFibGVzIGhhcmR3YXJlIGFjY2VsZXJhdGlvbiAodmlhIGEgbnVsbCB0cmFuc2Zvcm0gaGFjaylcblx0ICAgICAgICAgICAgICAgb24gYW5pbWF0aW5nIGVsZW1lbnRzLiBIQSBpcyByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQgYXQgdGhlIGNvbXBsZXRpb24gb2YgaXRzIGFuaW1hdGlvbi4gKi9cblx0ICAgICAgICAgICAgLyogTm90ZTogQW5kcm9pZCBHaW5nZXJicmVhZCBkb2Vzbid0IHN1cHBvcnQgSEEuIElmIGEgbnVsbCB0cmFuc2Zvcm0gaGFjayAobW9iaWxlSEEpIGlzIGluIGZhY3Qgc2V0LCBpdCB3aWxsIHByZXZlbnQgb3RoZXIgdHJhbmZvcm0gc3VicHJvcGVydGllcyBmcm9tIHRha2luZyBlZmZlY3QuICovXG5cdCAgICAgICAgICAgIC8qIE5vdGU6IFlvdSBjYW4gcmVhZCBtb3JlIGFib3V0IHRoZSB1c2Ugb2YgbW9iaWxlSEEgaW4gVmVsb2NpdHkncyBkb2N1bWVudGF0aW9uOiBWZWxvY2l0eUpTLm9yZy8jbW9iaWxlSEEuICovXG5cdCAgICAgICAgICAgIG9wdHMubW9iaWxlSEEgPSAob3B0cy5tb2JpbGVIQSAmJiBWZWxvY2l0eS5TdGF0ZS5pc01vYmlsZSAmJiAhVmVsb2NpdHkuU3RhdGUuaXNHaW5nZXJicmVhZCk7XG5cblx0ICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgIFBhcnQgSUk6IFF1ZXVlaW5nXG5cdCAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgIC8qIFdoZW4gYSBzZXQgb2YgZWxlbWVudHMgaXMgdGFyZ2V0ZWQgYnkgYSBWZWxvY2l0eSBjYWxsLCB0aGUgc2V0IGlzIGJyb2tlbiB1cCBhbmQgZWFjaCBlbGVtZW50IGhhcyB0aGUgY3VycmVudCBWZWxvY2l0eSBjYWxsIGluZGl2aWR1YWxseSBxdWV1ZWQgb250byBpdC5cblx0ICAgICAgICAgICAgICAgSW4gdGhpcyB3YXksIGVhY2ggZWxlbWVudCdzIGV4aXN0aW5nIHF1ZXVlIGlzIHJlc3BlY3RlZDsgc29tZSBlbGVtZW50cyBtYXkgYWxyZWFkeSBiZSBhbmltYXRpbmcgYW5kIGFjY29yZGluZ2x5IHNob3VsZCBub3QgaGF2ZSB0aGlzIGN1cnJlbnQgVmVsb2NpdHkgY2FsbCB0cmlnZ2VyZWQgaW1tZWRpYXRlbHkuICovXG5cdCAgICAgICAgICAgIC8qIEluIGVhY2ggcXVldWUsIHR3ZWVuIGRhdGEgaXMgcHJvY2Vzc2VkIGZvciBlYWNoIGFuaW1hdGluZyBwcm9wZXJ0eSB0aGVuIHB1c2hlZCBvbnRvIHRoZSBjYWxsLXdpZGUgY2FsbHMgYXJyYXkuIFdoZW4gdGhlIGxhc3QgZWxlbWVudCBpbiB0aGUgc2V0IGhhcyBoYWQgaXRzIHR3ZWVucyBwcm9jZXNzZWQsXG5cdCAgICAgICAgICAgICAgIHRoZSBjYWxsIGFycmF5IGlzIHB1c2hlZCB0byBWZWxvY2l0eS5TdGF0ZS5jYWxscyBmb3IgbGl2ZSBwcm9jZXNzaW5nIGJ5IHRoZSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgdGljay4gKi9cblx0ICAgICAgICAgICAgZnVuY3Rpb24gYnVpbGRRdWV1ZSAobmV4dCkge1xuXG5cdCAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgT3B0aW9uOiBCZWdpblxuXHQgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgLyogVGhlIGJlZ2luIGNhbGxiYWNrIGlzIGZpcmVkIG9uY2UgcGVyIGNhbGwgLS0gbm90IG9uY2UgcGVyIGVsZW1lbmV0IC0tIGFuZCBpcyBwYXNzZWQgdGhlIGZ1bGwgcmF3IERPTSBlbGVtZW50IHNldCBhcyBib3RoIGl0cyBjb250ZXh0IGFuZCBpdHMgZmlyc3QgYXJndW1lbnQuICovXG5cdCAgICAgICAgICAgICAgICBpZiAob3B0cy5iZWdpbiAmJiBlbGVtZW50c0luZGV4ID09PSAwKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogV2UgdGhyb3cgY2FsbGJhY2tzIGluIGEgc2V0VGltZW91dCBzbyB0aGF0IHRocm93biBlcnJvcnMgZG9uJ3QgaGFsdCB0aGUgZXhlY3V0aW9uIG9mIFZlbG9jaXR5IGl0c2VsZi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmJlZ2luLmNhbGwoZWxlbWVudHMsIGVsZW1lbnRzKTtcblx0ICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyB0aHJvdyBlcnJvcjsgfSwgMSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgIFR3ZWVuIERhdGEgQ29uc3RydWN0aW9uIChmb3IgU2Nyb2xsKVxuXHQgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgIC8qIE5vdGU6IEluIG9yZGVyIHRvIGJlIHN1YmplY3RlZCB0byBjaGFpbmluZyBhbmQgYW5pbWF0aW9uIG9wdGlvbnMsIHNjcm9sbCdzIHR3ZWVuaW5nIGlzIHJvdXRlZCB0aHJvdWdoIFZlbG9jaXR5IGFzIGlmIGl0IHdlcmUgYSBzdGFuZGFyZCBDU1MgcHJvcGVydHkgYW5pbWF0aW9uLiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKGFjdGlvbiA9PT0gXCJzY3JvbGxcIikge1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIFRoZSBzY3JvbGwgYWN0aW9uIHVuaXF1ZWx5IHRha2VzIGFuIG9wdGlvbmFsIFwib2Zmc2V0XCIgb3B0aW9uIC0tIHNwZWNpZmllZCBpbiBwaXhlbHMgLS0gdGhhdCBvZmZzZXRzIHRoZSB0YXJnZXRlZCBzY3JvbGwgcG9zaXRpb24uICovXG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIHNjcm9sbERpcmVjdGlvbiA9ICgvXngkL2kudGVzdChvcHRzLmF4aXMpID8gXCJMZWZ0XCIgOiBcIlRvcFwiKSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsT2Zmc2V0ID0gcGFyc2VGbG9hdChvcHRzLm9mZnNldCkgfHwgMCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsUG9zaXRpb25DdXJyZW50LFxuXHQgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxQb3NpdGlvbkN1cnJlbnRBbHRlcm5hdGUsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFBvc2l0aW9uRW5kO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogU2Nyb2xsIGFsc28gdW5pcXVlbHkgdGFrZXMgYW4gb3B0aW9uYWwgXCJjb250YWluZXJcIiBvcHRpb24sIHdoaWNoIGluZGljYXRlcyB0aGUgcGFyZW50IGVsZW1lbnQgdGhhdCBzaG91bGQgYmUgc2Nyb2xsZWQgLS1cblx0ICAgICAgICAgICAgICAgICAgICAgICBhcyBvcHBvc2VkIHRvIHRoZSBicm93c2VyIHdpbmRvdyBpdHNlbGYuIFRoaXMgaXMgdXNlZnVsIGZvciBzY3JvbGxpbmcgdG93YXJkIGFuIGVsZW1lbnQgdGhhdCdzIGluc2lkZSBhbiBvdmVyZmxvd2luZyBwYXJlbnQgZWxlbWVudC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5jb250YWluZXIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogRW5zdXJlIHRoYXQgZWl0aGVyIGEgalF1ZXJ5IG9iamVjdCBvciBhIHJhdyBET00gZWxlbWVudCB3YXMgcGFzc2VkIGluLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoVHlwZS5pc1dyYXBwZWQob3B0cy5jb250YWluZXIpIHx8IFR5cGUuaXNOb2RlKG9wdHMuY29udGFpbmVyKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRXh0cmFjdCB0aGUgcmF3IERPTSBlbGVtZW50IGZyb20gdGhlIGpRdWVyeSB3cmFwcGVyLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0cy5jb250YWluZXIgPSBvcHRzLmNvbnRhaW5lclswXSB8fCBvcHRzLmNvbnRhaW5lcjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFVubGlrZSBvdGhlciBwcm9wZXJ0aWVzIGluIFZlbG9jaXR5LCB0aGUgYnJvd3NlcidzIHNjcm9sbCBwb3NpdGlvbiBpcyBuZXZlciBjYWNoZWQgc2luY2UgaXQgc28gZnJlcXVlbnRseSBjaGFuZ2VzXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZHVlIHRvIHRoZSB1c2VyJ3MgbmF0dXJhbCBpbnRlcmFjdGlvbiB3aXRoIHRoZSBwYWdlKS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFBvc2l0aW9uQ3VycmVudCA9IG9wdHMuY29udGFpbmVyW1wic2Nyb2xsXCIgKyBzY3JvbGxEaXJlY3Rpb25dOyAvKiBHRVQgKi9cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogJC5wb3NpdGlvbigpIHZhbHVlcyBhcmUgcmVsYXRpdmUgdG8gdGhlIGNvbnRhaW5lcidzIGN1cnJlbnRseSB2aWV3YWJsZSBhcmVhICh3aXRob3V0IHRha2luZyBpbnRvIGFjY291bnQgdGhlIGNvbnRhaW5lcidzIHRydWUgZGltZW5zaW9uc1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLS0gc2F5LCBmb3IgZXhhbXBsZSwgaWYgdGhlIGNvbnRhaW5lciB3YXMgbm90IG92ZXJmbG93aW5nKS4gVGh1cywgdGhlIHNjcm9sbCBlbmQgdmFsdWUgaXMgdGhlIHN1bSBvZiB0aGUgY2hpbGQgZWxlbWVudCdzIHBvc2l0aW9uICphbmQqXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgc2Nyb2xsIGNvbnRhaW5lcidzIGN1cnJlbnQgc2Nyb2xsIHBvc2l0aW9uLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsUG9zaXRpb25FbmQgPSAoc2Nyb2xsUG9zaXRpb25DdXJyZW50ICsgJChlbGVtZW50KS5wb3NpdGlvbigpW3Njcm9sbERpcmVjdGlvbi50b0xvd2VyQ2FzZSgpXSkgKyBzY3JvbGxPZmZzZXQ7IC8qIEdFVCAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiBhIHZhbHVlIG90aGVyIHRoYW4gYSBqUXVlcnkgb2JqZWN0IG9yIGEgcmF3IERPTSBlbGVtZW50IHdhcyBwYXNzZWQgaW4sIGRlZmF1bHQgdG8gbnVsbCBzbyB0aGF0IHRoaXMgb3B0aW9uIGlzIGlnbm9yZWQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmNvbnRhaW5lciA9IG51bGw7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgd2luZG93IGl0c2VsZiBpcyBiZWluZyBzY3JvbGxlZCAtLSBub3QgYSBjb250YWluaW5nIGVsZW1lbnQgLS0gcGVyZm9ybSBhIGxpdmUgc2Nyb2xsIHBvc2l0aW9uIGxvb2t1cCB1c2luZ1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgYXBwcm9wcmlhdGUgY2FjaGVkIHByb3BlcnR5IG5hbWVzICh3aGljaCBkaWZmZXIgYmFzZWQgb24gYnJvd3NlciB0eXBlKS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsUG9zaXRpb25DdXJyZW50ID0gVmVsb2NpdHkuU3RhdGUuc2Nyb2xsQW5jaG9yW1ZlbG9jaXR5LlN0YXRlW1wic2Nyb2xsUHJvcGVydHlcIiArIHNjcm9sbERpcmVjdGlvbl1dOyAvKiBHRVQgKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogV2hlbiBzY3JvbGxpbmcgdGhlIGJyb3dzZXIgd2luZG93LCBjYWNoZSB0aGUgYWx0ZXJuYXRlIGF4aXMncyBjdXJyZW50IHZhbHVlIHNpbmNlIHdpbmRvdy5zY3JvbGxUbygpIGRvZXNuJ3QgbGV0IHVzIGNoYW5nZSBvbmx5IG9uZSB2YWx1ZSBhdCBhIHRpbWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFBvc2l0aW9uQ3VycmVudEFsdGVybmF0ZSA9IFZlbG9jaXR5LlN0YXRlLnNjcm9sbEFuY2hvcltWZWxvY2l0eS5TdGF0ZVtcInNjcm9sbFByb3BlcnR5XCIgKyAoc2Nyb2xsRGlyZWN0aW9uID09PSBcIkxlZnRcIiA/IFwiVG9wXCIgOiBcIkxlZnRcIildXTsgLyogR0VUICovXG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogVW5saWtlICQucG9zaXRpb24oKSwgJC5vZmZzZXQoKSB2YWx1ZXMgYXJlIHJlbGF0aXZlIHRvIHRoZSBicm93c2VyIHdpbmRvdydzIHRydWUgZGltZW5zaW9ucyAtLSBub3QgbWVyZWx5IGl0cyBjdXJyZW50bHkgdmlld2FibGUgYXJlYSAtLVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmQgdGhlcmVmb3JlIGVuZCB2YWx1ZXMgZG8gbm90IG5lZWQgdG8gYmUgY29tcG91bmRlZCBvbnRvIGN1cnJlbnQgdmFsdWVzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxQb3NpdGlvbkVuZCA9ICQoZWxlbWVudCkub2Zmc2V0KClbc2Nyb2xsRGlyZWN0aW9uLnRvTG93ZXJDYXNlKCldICsgc2Nyb2xsT2Zmc2V0OyAvKiBHRVQgKi9cblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBTaW5jZSB0aGVyZSdzIG9ubHkgb25lIGZvcm1hdCB0aGF0IHNjcm9sbCdzIGFzc29jaWF0ZWQgdHdlZW5zQ29udGFpbmVyIGNhbiB0YWtlLCB3ZSBjcmVhdGUgaXQgbWFudWFsbHkuICovXG5cdCAgICAgICAgICAgICAgICAgICAgdHdlZW5zQ29udGFpbmVyID0ge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGw6IHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlOiBmYWxzZSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWU6IHNjcm9sbFBvc2l0aW9uQ3VycmVudCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWYWx1ZTogc2Nyb2xsUG9zaXRpb25DdXJyZW50LFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWU6IHNjcm9sbFBvc2l0aW9uRW5kLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFR5cGU6IFwiXCIsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBlYXNpbmc6IG9wdHMuZWFzaW5nLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsRGF0YToge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lcjogb3B0cy5jb250YWluZXIsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBzY3JvbGxEaXJlY3Rpb24sXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWx0ZXJuYXRlVmFsdWU6IHNjcm9sbFBvc2l0aW9uQ3VycmVudEFsdGVybmF0ZVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICB9LFxuXHQgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50OiBlbGVtZW50XG5cdCAgICAgICAgICAgICAgICAgICAgfTtcblxuXHQgICAgICAgICAgICAgICAgICAgIGlmIChWZWxvY2l0eS5kZWJ1ZykgY29uc29sZS5sb2coXCJ0d2VlbnNDb250YWluZXIgKHNjcm9sbCk6IFwiLCB0d2VlbnNDb250YWluZXIuc2Nyb2xsLCBlbGVtZW50KTtcblxuXHQgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgVHdlZW4gRGF0YSBDb25zdHJ1Y3Rpb24gKGZvciBSZXZlcnNlKVxuXHQgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAvKiBSZXZlcnNlIGFjdHMgbGlrZSBhIFwic3RhcnRcIiBhY3Rpb24gaW4gdGhhdCBhIHByb3BlcnR5IG1hcCBpcyBhbmltYXRlZCB0b3dhcmQuIFRoZSBvbmx5IGRpZmZlcmVuY2UgaXNcblx0ICAgICAgICAgICAgICAgICAgIHRoYXQgdGhlIHByb3BlcnR5IG1hcCB1c2VkIGZvciByZXZlcnNlIGlzIHRoZSBpbnZlcnNlIG9mIHRoZSBtYXAgdXNlZCBpbiB0aGUgcHJldmlvdXMgY2FsbC4gVGh1cywgd2UgbWFuaXB1bGF0ZVxuXHQgICAgICAgICAgICAgICAgICAgdGhlIHByZXZpb3VzIGNhbGwgdG8gY29uc3RydWN0IG91ciBuZXcgbWFwOiB1c2UgdGhlIHByZXZpb3VzIG1hcCdzIGVuZCB2YWx1ZXMgYXMgb3VyIG5ldyBtYXAncyBzdGFydCB2YWx1ZXMuIENvcHkgb3ZlciBhbGwgb3RoZXIgZGF0YS4gKi9cblx0ICAgICAgICAgICAgICAgIC8qIE5vdGU6IFJldmVyc2UgY2FuIGJlIGRpcmVjdGx5IGNhbGxlZCB2aWEgdGhlIFwicmV2ZXJzZVwiIHBhcmFtZXRlciwgb3IgaXQgY2FuIGJlIGluZGlyZWN0bHkgdHJpZ2dlcmVkIHZpYSB0aGUgbG9vcCBvcHRpb24uIChMb29wcyBhcmUgY29tcG9zZWQgb2YgbXVsdGlwbGUgcmV2ZXJzZXMuKSAqL1xuXHQgICAgICAgICAgICAgICAgLyogTm90ZTogUmV2ZXJzZSBjYWxscyBkbyBub3QgbmVlZCB0byBiZSBjb25zZWN1dGl2ZWx5IGNoYWluZWQgb250byBhIGN1cnJlbnRseS1hbmltYXRpbmcgZWxlbWVudCBpbiBvcmRlciB0byBvcGVyYXRlIG9uIGNhY2hlZCB2YWx1ZXM7XG5cdCAgICAgICAgICAgICAgICAgICB0aGVyZSBpcyBubyBoYXJtIHRvIHJldmVyc2UgYmVpbmcgY2FsbGVkIG9uIGEgcG90ZW50aWFsbHkgc3RhbGUgZGF0YSBjYWNoZSBzaW5jZSByZXZlcnNlJ3MgYmVoYXZpb3IgaXMgc2ltcGx5IGRlZmluZWRcblx0ICAgICAgICAgICAgICAgICAgIGFzIHJldmVydGluZyB0byB0aGUgZWxlbWVudCdzIHZhbHVlcyBhcyB0aGV5IHdlcmUgcHJpb3IgdG8gdGhlIHByZXZpb3VzICpWZWxvY2l0eSogY2FsbC4gKi9cblx0ICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBcInJldmVyc2VcIikge1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIEFib3J0IGlmIHRoZXJlIGlzIG5vIHByaW9yIGFuaW1hdGlvbiBkYXRhIHRvIHJldmVyc2UgdG8uICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKCFEYXRhKGVsZW1lbnQpLnR3ZWVuc0NvbnRhaW5lcikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBEZXF1ZXVlIHRoZSBlbGVtZW50IHNvIHRoYXQgdGhpcyBxdWV1ZSBlbnRyeSByZWxlYXNlcyBpdHNlbGYgaW1tZWRpYXRlbHksIGFsbG93aW5nIHN1YnNlcXVlbnQgcXVldWUgZW50cmllcyB0byBydW4uICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICQuZGVxdWV1ZShlbGVtZW50LCBvcHRzLnF1ZXVlKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG5cdCAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBPcHRpb25zIFBhcnNpbmdcblx0ICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBlbGVtZW50IHdhcyBoaWRkZW4gdmlhIHRoZSBkaXNwbGF5IG9wdGlvbiBpbiB0aGUgcHJldmlvdXMgY2FsbCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV2ZXJ0IGRpc3BsYXkgdG8gXCJhdXRvXCIgcHJpb3IgdG8gcmV2ZXJzYWwgc28gdGhhdCB0aGUgZWxlbWVudCBpcyB2aXNpYmxlIGFnYWluLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoRGF0YShlbGVtZW50KS5vcHRzLmRpc3BsYXkgPT09IFwibm9uZVwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLm9wdHMuZGlzcGxheSA9IFwiYXV0b1wiO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkub3B0cy52aXNpYmlsaXR5ID09PSBcImhpZGRlblwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLm9wdHMudmlzaWJpbGl0eSA9IFwidmlzaWJsZVwiO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGxvb3Agb3B0aW9uIHdhcyBzZXQgaW4gdGhlIHByZXZpb3VzIGNhbGwsIGRpc2FibGUgaXQgc28gdGhhdCBcInJldmVyc2VcIiBjYWxscyBhcmVuJ3QgcmVjdXJzaXZlbHkgZ2VuZXJhdGVkLlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBGdXJ0aGVyLCByZW1vdmUgdGhlIHByZXZpb3VzIGNhbGwncyBjYWxsYmFjayBvcHRpb25zOyB0eXBpY2FsbHksIHVzZXJzIGRvIG5vdCB3YW50IHRoZXNlIHRvIGJlIHJlZmlyZWQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkub3B0cy5sb29wID0gZmFsc2U7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkub3B0cy5iZWdpbiA9IG51bGw7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkub3B0cy5jb21wbGV0ZSA9IG51bGw7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogU2luY2Ugd2UncmUgZXh0ZW5kaW5nIGFuIG9wdHMgb2JqZWN0IHRoYXQgaGFzIGFscmVhZHkgYmVlbiBleHRlbmRlZCB3aXRoIHRoZSBkZWZhdWx0cyBvcHRpb25zIG9iamVjdCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgd2UgcmVtb3ZlIG5vbi1leHBsaWNpdGx5LWRlZmluZWQgcHJvcGVydGllcyB0aGF0IGFyZSBhdXRvLWFzc2lnbmVkIHZhbHVlcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFvcHRpb25zLmVhc2luZykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG9wdHMuZWFzaW5nO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFvcHRpb25zLmR1cmF0aW9uKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgb3B0cy5kdXJhdGlvbjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRoZSBvcHRzIG9iamVjdCB1c2VkIGZvciByZXZlcnNhbCBpcyBhbiBleHRlbnNpb24gb2YgdGhlIG9wdGlvbnMgb2JqZWN0IG9wdGlvbmFsbHkgcGFzc2VkIGludG8gdGhpc1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICByZXZlcnNlIGNhbGwgcGx1cyB0aGUgb3B0aW9ucyB1c2VkIGluIHRoZSBwcmV2aW91cyBWZWxvY2l0eSBjYWxsLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBvcHRzID0gJC5leHRlbmQoe30sIERhdGEoZWxlbWVudCkub3B0cywgb3B0cyk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgVHdlZW5zIENvbnRhaW5lciBSZWNvbnN0cnVjdGlvblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIENyZWF0ZSBhIGRlZXB5IGNvcHkgKGluZGljYXRlZCB2aWEgdGhlIHRydWUgZmxhZykgb2YgdGhlIHByZXZpb3VzIGNhbGwncyB0d2VlbnNDb250YWluZXIuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsYXN0VHdlZW5zQ29udGFpbmVyID0gJC5leHRlbmQodHJ1ZSwge30sIERhdGEoZWxlbWVudCkudHdlZW5zQ29udGFpbmVyKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBNYW5pcHVsYXRlIHRoZSBwcmV2aW91cyB0d2VlbnNDb250YWluZXIgYnkgcmVwbGFjaW5nIGl0cyBlbmQgdmFsdWVzIGFuZCBjdXJyZW50VmFsdWVzIHdpdGggaXRzIHN0YXJ0IHZhbHVlcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgbGFzdFR3ZWVuIGluIGxhc3RUd2VlbnNDb250YWluZXIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEluIGFkZGl0aW9uIHRvIHR3ZWVuIGRhdGEsIHR3ZWVuc0NvbnRhaW5lcnMgY29udGFpbiBhbiBlbGVtZW50IHByb3BlcnR5IHRoYXQgd2UgaWdub3JlIGhlcmUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobGFzdFR3ZWVuICE9PSBcImVsZW1lbnRcIikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsYXN0U3RhcnRWYWx1ZSA9IGxhc3RUd2VlbnNDb250YWluZXJbbGFzdFR3ZWVuXS5zdGFydFZhbHVlO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFR3ZWVuc0NvbnRhaW5lcltsYXN0VHdlZW5dLnN0YXJ0VmFsdWUgPSBsYXN0VHdlZW5zQ29udGFpbmVyW2xhc3RUd2Vlbl0uY3VycmVudFZhbHVlID0gbGFzdFR3ZWVuc0NvbnRhaW5lcltsYXN0VHdlZW5dLmVuZFZhbHVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RUd2VlbnNDb250YWluZXJbbGFzdFR3ZWVuXS5lbmRWYWx1ZSA9IGxhc3RTdGFydFZhbHVlO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRWFzaW5nIGlzIHRoZSBvbmx5IG9wdGlvbiB0aGF0IGVtYmVkcyBpbnRvIHRoZSBpbmRpdmlkdWFsIHR3ZWVuIGRhdGEgKHNpbmNlIGl0IGNhbiBiZSBkZWZpbmVkIG9uIGEgcGVyLXByb3BlcnR5IGJhc2lzKS5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBY2NvcmRpbmdseSwgZXZlcnkgcHJvcGVydHkncyBlYXNpbmcgdmFsdWUgbXVzdCBiZSB1cGRhdGVkIHdoZW4gYW4gb3B0aW9ucyBvYmplY3QgaXMgcGFzc2VkIGluIHdpdGggYSByZXZlcnNlIGNhbGwuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVGhlIHNpZGUgZWZmZWN0IG9mIHRoaXMgZXh0ZW5zaWJpbGl0eSBpcyB0aGF0IGFsbCBwZXItcHJvcGVydHkgZWFzaW5nIHZhbHVlcyBhcmUgZm9yY2VmdWxseSByZXNldCB0byB0aGUgbmV3IHZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghVHlwZS5pc0VtcHR5T2JqZWN0KG9wdGlvbnMpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RUd2VlbnNDb250YWluZXJbbGFzdFR3ZWVuXS5lYXNpbmcgPSBvcHRzLmVhc2luZztcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoVmVsb2NpdHkuZGVidWcpIGNvbnNvbGUubG9nKFwicmV2ZXJzZSB0d2VlbnNDb250YWluZXIgKFwiICsgbGFzdFR3ZWVuICsgXCIpOiBcIiArIEpTT04uc3RyaW5naWZ5KGxhc3RUd2VlbnNDb250YWluZXJbbGFzdFR3ZWVuXSksIGVsZW1lbnQpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW5zQ29udGFpbmVyID0gbGFzdFR3ZWVuc0NvbnRhaW5lcjtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgVHdlZW4gRGF0YSBDb25zdHJ1Y3Rpb24gKGZvciBTdGFydClcblx0ICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJzdGFydFwiKSB7XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgICAgICBWYWx1ZSBUcmFuc2ZlcnJpbmdcblx0ICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhpcyBxdWV1ZSBlbnRyeSBmb2xsb3dzIGEgcHJldmlvdXMgVmVsb2NpdHktaW5pdGlhdGVkIHF1ZXVlIGVudHJ5ICphbmQqIGlmIHRoaXMgZW50cnkgd2FzIGNyZWF0ZWRcblx0ICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSB0aGUgZWxlbWVudCB3YXMgaW4gdGhlIHByb2Nlc3Mgb2YgYmVpbmcgYW5pbWF0ZWQgYnkgVmVsb2NpdHksIHRoZW4gdGhpcyBjdXJyZW50IGNhbGwgaXMgc2FmZSB0byB1c2Vcblx0ICAgICAgICAgICAgICAgICAgICAgICB0aGUgZW5kIHZhbHVlcyBmcm9tIHRoZSBwcmlvciBjYWxsIGFzIGl0cyBzdGFydCB2YWx1ZXMuIFZlbG9jaXR5IGF0dGVtcHRzIHRvIHBlcmZvcm0gdGhpcyB2YWx1ZSB0cmFuc2ZlclxuXHQgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3Mgd2hlbmV2ZXIgcG9zc2libGUgaW4gb3JkZXIgdG8gYXZvaWQgcmVxdWVyeWluZyB0aGUgRE9NLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIElmIHZhbHVlcyBhcmVuJ3QgdHJhbnNmZXJyZWQgZnJvbSBhIHByaW9yIGNhbGwgYW5kIHN0YXJ0IHZhbHVlcyB3ZXJlIG5vdCBmb3JjZWZlZCBieSB0aGUgdXNlciAobW9yZSBvbiB0aGlzIGJlbG93KSxcblx0ICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHRoZSBET00gaXMgcXVlcmllZCBmb3IgdGhlIGVsZW1lbnQncyBjdXJyZW50IHZhbHVlcyBhcyBhIGxhc3QgcmVzb3J0LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IENvbnZlcnNlbHksIGFuaW1hdGlvbiByZXZlcnNhbCAoYW5kIGxvb3BpbmcpICphbHdheXMqIHBlcmZvcm0gaW50ZXItY2FsbCB2YWx1ZSB0cmFuc2ZlcnM7IHRoZXkgbmV2ZXIgcmVxdWVyeSB0aGUgRE9NLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciBsYXN0VHdlZW5zQ29udGFpbmVyO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogVGhlIHBlci1lbGVtZW50IGlzQW5pbWF0aW5nIGZsYWcgaXMgdXNlZCB0byBpbmRpY2F0ZSB3aGV0aGVyIGl0J3Mgc2FmZSAoaS5lLiB0aGUgZGF0YSBpc24ndCBzdGFsZSlcblx0ICAgICAgICAgICAgICAgICAgICAgICB0byB0cmFuc2ZlciBvdmVyIGVuZCB2YWx1ZXMgdG8gdXNlIGFzIHN0YXJ0IHZhbHVlcy4gSWYgaXQncyBzZXQgdG8gdHJ1ZSBhbmQgdGhlcmUgaXMgYSBwcmV2aW91c1xuXHQgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5IGNhbGwgdG8gcHVsbCB2YWx1ZXMgZnJvbSwgZG8gc28uICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkudHdlZW5zQ29udGFpbmVyICYmIERhdGEoZWxlbWVudCkuaXNBbmltYXRpbmcgPT09IHRydWUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFR3ZWVuc0NvbnRhaW5lciA9IERhdGEoZWxlbWVudCkudHdlZW5zQ29udGFpbmVyO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICAgICBUd2VlbiBEYXRhIENhbGN1bGF0aW9uXG5cdCAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogVGhpcyBmdW5jdGlvbiBwYXJzZXMgcHJvcGVydHkgZGF0YSBhbmQgZGVmYXVsdHMgZW5kVmFsdWUsIGVhc2luZywgYW5kIHN0YXJ0VmFsdWUgYXMgYXBwcm9wcmlhdGUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgLyogUHJvcGVydHkgbWFwIHZhbHVlcyBjYW4gZWl0aGVyIHRha2UgdGhlIGZvcm0gb2YgMSkgYSBzaW5nbGUgdmFsdWUgcmVwcmVzZW50aW5nIHRoZSBlbmQgdmFsdWUsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgb3IgMikgYW4gYXJyYXkgaW4gdGhlIGZvcm0gb2YgWyBlbmRWYWx1ZSwgWywgZWFzaW5nXSBbLCBzdGFydFZhbHVlXSBdLlxuXHQgICAgICAgICAgICAgICAgICAgICAgIFRoZSBvcHRpb25hbCB0aGlyZCBwYXJhbWV0ZXIgaXMgYSBmb3JjZWZlZCBzdGFydFZhbHVlIHRvIGJlIHVzZWQgaW5zdGVhZCBvZiBxdWVyeWluZyB0aGUgRE9NIGZvclxuXHQgICAgICAgICAgICAgICAgICAgICAgIHRoZSBlbGVtZW50J3MgY3VycmVudCB2YWx1ZS4gUmVhZCBWZWxvY2l0eSdzIGRvY21lbnRhdGlvbiB0byBsZWFybiBtb3JlIGFib3V0IGZvcmNlZmVlZGluZzogVmVsb2NpdHlKUy5vcmcvI2ZvcmNlZmVlZGluZyAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHBhcnNlUHJvcGVydHlWYWx1ZSAodmFsdWVEYXRhLCBza2lwUmVzb2x2aW5nRWFzaW5nKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbmRWYWx1ZSA9IHVuZGVmaW5lZCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVhc2luZyA9IHVuZGVmaW5lZCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgPSB1bmRlZmluZWQ7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogSGFuZGxlIHRoZSBhcnJheSBmb3JtYXQsIHdoaWNoIGNhbiBiZSBzdHJ1Y3R1cmVkIGFzIG9uZSBvZiB0aHJlZSBwb3RlbnRpYWwgb3ZlcmxvYWRzOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBBKSBbIGVuZFZhbHVlLCBlYXNpbmcsIHN0YXJ0VmFsdWUgXSwgQikgWyBlbmRWYWx1ZSwgZWFzaW5nIF0sIG9yIEMpIFsgZW5kVmFsdWUsIHN0YXJ0VmFsdWUgXSAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoVHlwZS5pc0FycmF5KHZhbHVlRGF0YSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIGVuZFZhbHVlIGlzIGFsd2F5cyB0aGUgZmlyc3QgaXRlbSBpbiB0aGUgYXJyYXkuIERvbid0IGJvdGhlciB2YWxpZGF0aW5nIGVuZFZhbHVlJ3MgdmFsdWUgbm93XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaW5jZSB0aGUgZW5zdWluZyBwcm9wZXJ0eSBjeWNsaW5nIGxvZ2ljIGRvZXMgdGhhdC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gdmFsdWVEYXRhWzBdO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBUd28taXRlbSBhcnJheSBmb3JtYXQ6IElmIHRoZSBzZWNvbmQgaXRlbSBpcyBhIG51bWJlciwgZnVuY3Rpb24sIG9yIGhleCBzdHJpbmcsIHRyZWF0IGl0IGFzIGFcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0IHZhbHVlIHNpbmNlIGVhc2luZ3MgY2FuIG9ubHkgYmUgbm9uLWhleCBzdHJpbmdzIG9yIGFycmF5cy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoIVR5cGUuaXNBcnJheSh2YWx1ZURhdGFbMV0pICYmIC9eW1xcZC1dLy50ZXN0KHZhbHVlRGF0YVsxXSkpIHx8IFR5cGUuaXNGdW5jdGlvbih2YWx1ZURhdGFbMV0pIHx8IENTUy5SZWdFeC5pc0hleC50ZXN0KHZhbHVlRGF0YVsxXSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gdmFsdWVEYXRhWzFdO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVHdvIG9yIHRocmVlLWl0ZW0gYXJyYXk6IElmIHRoZSBzZWNvbmQgaXRlbSBpcyBhIG5vbi1oZXggc3RyaW5nIG9yIGFuIGFycmF5LCB0cmVhdCBpdCBhcyBhbiBlYXNpbmcuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKChUeXBlLmlzU3RyaW5nKHZhbHVlRGF0YVsxXSkgJiYgIUNTUy5SZWdFeC5pc0hleC50ZXN0KHZhbHVlRGF0YVsxXSkpIHx8IFR5cGUuaXNBcnJheSh2YWx1ZURhdGFbMV0pKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWFzaW5nID0gc2tpcFJlc29sdmluZ0Vhc2luZyA/IHZhbHVlRGF0YVsxXSA6IGdldEVhc2luZyh2YWx1ZURhdGFbMV0sIG9wdHMuZHVyYXRpb24pO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRG9uJ3QgYm90aGVyIHZhbGlkYXRpbmcgc3RhcnRWYWx1ZSdzIHZhbHVlIG5vdyBzaW5jZSB0aGUgZW5zdWluZyBwcm9wZXJ0eSBjeWNsaW5nIGxvZ2ljIGluaGVyZW50bHkgZG9lcyB0aGF0LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZURhdGFbMl0gIT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gdmFsdWVEYXRhWzJdO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogSGFuZGxlIHRoZSBzaW5nbGUtdmFsdWUgZm9ybWF0LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWUgPSB2YWx1ZURhdGE7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBEZWZhdWx0IHRvIHRoZSBjYWxsJ3MgZWFzaW5nIGlmIGEgcGVyLXByb3BlcnR5IGVhc2luZyB0eXBlIHdhcyBub3QgZGVmaW5lZC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFza2lwUmVzb2x2aW5nRWFzaW5nKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBlYXNpbmcgPSBlYXNpbmcgfHwgb3B0cy5lYXNpbmc7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiBmdW5jdGlvbnMgd2VyZSBwYXNzZWQgaW4gYXMgdmFsdWVzLCBwYXNzIHRoZSBmdW5jdGlvbiB0aGUgY3VycmVudCBlbGVtZW50IGFzIGl0cyBjb250ZXh0LFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBwbHVzIHRoZSBlbGVtZW50J3MgaW5kZXggYW5kIHRoZSBlbGVtZW50IHNldCdzIHNpemUgYXMgYXJndW1lbnRzLiBUaGVuLCBhc3NpZ24gdGhlIHJldHVybmVkIHZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoVHlwZS5pc0Z1bmN0aW9uKGVuZFZhbHVlKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWUgPSBlbmRWYWx1ZS5jYWxsKGVsZW1lbnQsIGVsZW1lbnRzSW5kZXgsIGVsZW1lbnRzTGVuZ3RoKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChUeXBlLmlzRnVuY3Rpb24oc3RhcnRWYWx1ZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgPSBzdGFydFZhbHVlLmNhbGwoZWxlbWVudCwgZWxlbWVudHNJbmRleCwgZWxlbWVudHNMZW5ndGgpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogQWxsb3cgc3RhcnRWYWx1ZSB0byBiZSBsZWZ0IGFzIHVuZGVmaW5lZCB0byBpbmRpY2F0ZSB0byB0aGUgZW5zdWluZyBjb2RlIHRoYXQgaXRzIHZhbHVlIHdhcyBub3QgZm9yY2VmZWQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbIGVuZFZhbHVlIHx8IDAsIGVhc2luZywgc3RhcnRWYWx1ZSBdO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIEN5Y2xlIHRocm91Z2ggZWFjaCBwcm9wZXJ0eSBpbiB0aGUgbWFwLCBsb29raW5nIGZvciBzaG9ydGhhbmQgY29sb3IgcHJvcGVydGllcyAoZS5nLiBcImNvbG9yXCIgYXMgb3Bwb3NlZCB0byBcImNvbG9yUmVkXCIpLiBJbmplY3QgdGhlIGNvcnJlc3BvbmRpbmdcblx0ICAgICAgICAgICAgICAgICAgICAgICBjb2xvclJlZCwgY29sb3JHcmVlbiwgYW5kIGNvbG9yQmx1ZSBSR0IgY29tcG9uZW50IHR3ZWVucyBpbnRvIHRoZSBwcm9wZXJ0aWVzTWFwICh3aGljaCBWZWxvY2l0eSB1bmRlcnN0YW5kcykgYW5kIHJlbW92ZSB0aGUgc2hvcnRoYW5kIHByb3BlcnR5LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICQuZWFjaChwcm9wZXJ0aWVzTWFwLCBmdW5jdGlvbihwcm9wZXJ0eSwgdmFsdWUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogRmluZCBzaG9ydGhhbmQgY29sb3IgcHJvcGVydGllcyB0aGF0IGhhdmUgYmVlbiBwYXNzZWQgYSBoZXggc3RyaW5nLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoUmVnRXhwKFwiXlwiICsgQ1NTLkxpc3RzLmNvbG9ycy5qb2luKFwiJHxeXCIpICsgXCIkXCIpLnRlc3QocHJvcGVydHkpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBQYXJzZSB0aGUgdmFsdWUgZGF0YSBmb3IgZWFjaCBzaG9ydGhhbmQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWVEYXRhID0gcGFyc2VQcm9wZXJ0eVZhbHVlKHZhbHVlLCB0cnVlKSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IHZhbHVlRGF0YVswXSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlYXNpbmcgPSB2YWx1ZURhdGFbMV0sXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IHZhbHVlRGF0YVsyXTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENTUy5SZWdFeC5pc0hleC50ZXN0KGVuZFZhbHVlKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENvbnZlcnQgdGhlIGhleCBzdHJpbmdzIGludG8gdGhlaXIgUkdCIGNvbXBvbmVudCBhcnJheXMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbG9yQ29tcG9uZW50cyA9IFsgXCJSZWRcIiwgXCJHcmVlblwiLCBcIkJsdWVcIiBdLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZVJHQiA9IENTUy5WYWx1ZXMuaGV4VG9SZ2IoZW5kVmFsdWUpLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlUkdCID0gc3RhcnRWYWx1ZSA/IENTUy5WYWx1ZXMuaGV4VG9SZ2Ioc3RhcnRWYWx1ZSkgOiB1bmRlZmluZWQ7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJbmplY3QgdGhlIFJHQiBjb21wb25lbnQgdHdlZW5zIGludG8gcHJvcGVydGllc01hcC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvbG9yQ29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YUFycmF5ID0gWyBlbmRWYWx1ZVJHQltpXSBdO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlYXNpbmcpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFBcnJheS5wdXNoKGVhc2luZyk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RhcnRWYWx1ZVJHQiAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhQXJyYXkucHVzaChzdGFydFZhbHVlUkdCW2ldKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXNNYXBbcHJvcGVydHkgKyBjb2xvckNvbXBvbmVudHNbaV1dID0gZGF0YUFycmF5O1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFJlbW92ZSB0aGUgaW50ZXJtZWRpYXJ5IHNob3J0aGFuZCBwcm9wZXJ0eSBlbnRyeSBub3cgdGhhdCB3ZSd2ZSBwcm9jZXNzZWQgaXQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHByb3BlcnRpZXNNYXBbcHJvcGVydHldO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgfSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBDcmVhdGUgYSB0d2VlbiBvdXQgb2YgZWFjaCBwcm9wZXJ0eSwgYW5kIGFwcGVuZCBpdHMgYXNzb2NpYXRlZCBkYXRhIHRvIHR3ZWVuc0NvbnRhaW5lci4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wZXJ0eSBpbiBwcm9wZXJ0aWVzTWFwKSB7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIFN0YXJ0IFZhbHVlIFNvdXJjaW5nXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIFBhcnNlIG91dCBlbmRWYWx1ZSwgZWFzaW5nLCBhbmQgc3RhcnRWYWx1ZSBmcm9tIHRoZSBwcm9wZXJ0eSdzIGRhdGEuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZURhdGEgPSBwYXJzZVByb3BlcnR5VmFsdWUocHJvcGVydGllc01hcFtwcm9wZXJ0eV0pLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWUgPSB2YWx1ZURhdGFbMF0sXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBlYXNpbmcgPSB2YWx1ZURhdGFbMV0sXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gdmFsdWVEYXRhWzJdO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdyB0aGF0IHRoZSBvcmlnaW5hbCBwcm9wZXJ0eSBuYW1lJ3MgZm9ybWF0IGhhcyBiZWVuIHVzZWQgZm9yIHRoZSBwYXJzZVByb3BlcnR5VmFsdWUoKSBsb29rdXAgYWJvdmUsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIHdlIGZvcmNlIHRoZSBwcm9wZXJ0eSB0byBpdHMgY2FtZWxDYXNlIHN0eWxpbmcgdG8gbm9ybWFsaXplIGl0IGZvciBtYW5pcHVsYXRpb24uICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5ID0gQ1NTLk5hbWVzLmNhbWVsQ2FzZShwcm9wZXJ0eSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogSW4gY2FzZSB0aGlzIHByb3BlcnR5IGlzIGEgaG9vaywgdGhlcmUgYXJlIGNpcmN1bXN0YW5jZXMgd2hlcmUgd2Ugd2lsbCBpbnRlbmQgdG8gd29yayBvbiB0aGUgaG9vaydzIHJvb3QgcHJvcGVydHkgYW5kIG5vdCB0aGUgaG9va2VkIHN1YnByb3BlcnR5LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcm9vdFByb3BlcnR5ID0gQ1NTLkhvb2tzLmdldFJvb3QocHJvcGVydHkpLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWUgPSBmYWxzZTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBPdGhlciB0aGFuIGZvciB0aGUgZHVtbXkgdHdlZW4gcHJvcGVydHksIHByb3BlcnRpZXMgdGhhdCBhcmUgbm90IHN1cHBvcnRlZCBieSB0aGUgYnJvd3NlciAoYW5kIGRvIG5vdCBoYXZlIGFuIGFzc29jaWF0ZWQgbm9ybWFsaXphdGlvbikgd2lsbFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmhlcmVudGx5IHByb2R1Y2Ugbm8gc3R5bGUgY2hhbmdlcyB3aGVuIHNldCwgc28gdGhleSBhcmUgc2tpcHBlZCBpbiBvcmRlciB0byBkZWNyZWFzZSBhbmltYXRpb24gdGljayBvdmVyaGVhZC5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgUHJvcGVydHkgc3VwcG9ydCBpcyBkZXRlcm1pbmVkIHZpYSBwcmVmaXhDaGVjaygpLCB3aGljaCByZXR1cm5zIGEgZmFsc2UgZmxhZyB3aGVuIG5vIHN1cHBvcnRlZCBpcyBkZXRlY3RlZC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogU2luY2UgU1ZHIGVsZW1lbnRzIGhhdmUgc29tZSBvZiB0aGVpciBwcm9wZXJ0aWVzIGRpcmVjdGx5IGFwcGxpZWQgYXMgSFRNTCBhdHRyaWJ1dGVzLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGVyZSBpcyBubyB3YXkgdG8gY2hlY2sgZm9yIHRoZWlyIGV4cGxpY2l0IGJyb3dzZXIgc3VwcG9ydCwgYW5kIHNvIHdlIHNraXAgc2tpcCB0aGlzIGNoZWNrIGZvciB0aGVtLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIURhdGEoZWxlbWVudCkuaXNTVkcgJiYgcm9vdFByb3BlcnR5ICE9PSBcInR3ZWVuXCIgJiYgQ1NTLk5hbWVzLnByZWZpeENoZWNrKHJvb3RQcm9wZXJ0eSlbMV0gPT09IGZhbHNlICYmIENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3Jvb3RQcm9wZXJ0eV0gPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFZlbG9jaXR5LmRlYnVnKSBjb25zb2xlLmxvZyhcIlNraXBwaW5nIFtcIiArIHJvb3RQcm9wZXJ0eSArIFwiXSBkdWUgdG8gYSBsYWNrIG9mIGJyb3dzZXIgc3VwcG9ydC5cIik7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGRpc3BsYXkgb3B0aW9uIGlzIGJlaW5nIHNldCB0byBhIG5vbi1cIm5vbmVcIiAoZS5nLiBcImJsb2NrXCIpIGFuZCBvcGFjaXR5IChmaWx0ZXIgb24gSUU8PTgpIGlzIGJlaW5nXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGVkIHRvIGFuIGVuZFZhbHVlIG9mIG5vbi16ZXJvLCB0aGUgdXNlcidzIGludGVudGlvbiBpcyB0byBmYWRlIGluIGZyb20gaW52aXNpYmxlLCB0aHVzIHdlIGZvcmNlZmVlZCBvcGFjaXR5XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIGEgc3RhcnRWYWx1ZSBvZiAwIGlmIGl0cyBzdGFydFZhbHVlIGhhc24ndCBhbHJlYWR5IGJlZW4gc291cmNlZCBieSB2YWx1ZSB0cmFuc2ZlcnJpbmcgb3IgcHJpb3IgZm9yY2VmZWVkaW5nLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKChvcHRzLmRpc3BsYXkgIT09IHVuZGVmaW5lZCAmJiBvcHRzLmRpc3BsYXkgIT09IG51bGwgJiYgb3B0cy5kaXNwbGF5ICE9PSBcIm5vbmVcIikgfHwgKG9wdHMudmlzaWJpbGl0eSAhPT0gdW5kZWZpbmVkICYmIG9wdHMudmlzaWJpbGl0eSAhPT0gXCJoaWRkZW5cIikpICYmIC9vcGFjaXR5fGZpbHRlci8udGVzdChwcm9wZXJ0eSkgJiYgIXN0YXJ0VmFsdWUgJiYgZW5kVmFsdWUgIT09IDApIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgPSAwO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdmFsdWVzIGhhdmUgYmVlbiB0cmFuc2ZlcnJlZCBmcm9tIHRoZSBwcmV2aW91cyBWZWxvY2l0eSBjYWxsLCBleHRyYWN0IHRoZSBlbmRWYWx1ZSBhbmQgcm9vdFByb3BlcnR5VmFsdWVcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIGFsbCBvZiB0aGUgY3VycmVudCBjYWxsJ3MgcHJvcGVydGllcyB0aGF0IHdlcmUgKmFsc28qIGFuaW1hdGVkIGluIHRoZSBwcmV2aW91cyBjYWxsLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBWYWx1ZSB0cmFuc2ZlcnJpbmcgY2FuIG9wdGlvbmFsbHkgYmUgZGlzYWJsZWQgYnkgdGhlIHVzZXIgdmlhIHRoZSBfY2FjaGVWYWx1ZXMgb3B0aW9uLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5fY2FjaGVWYWx1ZXMgJiYgbGFzdFR3ZWVuc0NvbnRhaW5lciAmJiBsYXN0VHdlZW5zQ29udGFpbmVyW3Byb3BlcnR5XSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXJ0VmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgPSBsYXN0VHdlZW5zQ29udGFpbmVyW3Byb3BlcnR5XS5lbmRWYWx1ZSArIGxhc3RUd2VlbnNDb250YWluZXJbcHJvcGVydHldLnVuaXRUeXBlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBUaGUgcHJldmlvdXMgY2FsbCdzIHJvb3RQcm9wZXJ0eVZhbHVlIGlzIGV4dHJhY3RlZCBmcm9tIHRoZSBlbGVtZW50J3MgZGF0YSBjYWNoZSBzaW5jZSB0aGF0J3MgdGhlXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZSBvZiByb290UHJvcGVydHlWYWx1ZSB0aGF0IGdldHMgZnJlc2hseSB1cGRhdGVkIGJ5IHRoZSB0d2VlbmluZyBwcm9jZXNzLCB3aGVyZWFzIHRoZSByb290UHJvcGVydHlWYWx1ZVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0YWNoZWQgdG8gdGhlIGluY29taW5nIGxhc3RUd2VlbnNDb250YWluZXIgaXMgZXF1YWwgdG8gdGhlIHJvb3QgcHJvcGVydHkncyB2YWx1ZSBwcmlvciB0byBhbnkgdHdlZW5pbmcuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZSA9IERhdGEoZWxlbWVudCkucm9vdFByb3BlcnR5VmFsdWVDYWNoZVtyb290UHJvcGVydHldO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB2YWx1ZXMgd2VyZSBub3QgdHJhbnNmZXJyZWQgZnJvbSBhIHByZXZpb3VzIFZlbG9jaXR5IGNhbGwsIHF1ZXJ5IHRoZSBET00gYXMgbmVlZGVkLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSGFuZGxlIGhvb2tlZCBwcm9wZXJ0aWVzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENTUy5Ib29rcy5yZWdpc3RlcmVkW3Byb3BlcnR5XSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXJ0VmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZSA9IENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIHJvb3RQcm9wZXJ0eSk7IC8qIEdFVCAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBUaGUgZm9sbG93aW5nIGdldFByb3BlcnR5VmFsdWUoKSBjYWxsIGRvZXMgbm90IGFjdHVhbGx5IHRyaWdnZXIgYSBET00gcXVlcnk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldFByb3BlcnR5VmFsdWUoKSB3aWxsIGV4dHJhY3QgdGhlIGhvb2sgZnJvbSByb290UHJvcGVydHlWYWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIHByb3BlcnR5LCByb290UHJvcGVydHlWYWx1ZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgc3RhcnRWYWx1ZSBpcyBhbHJlYWR5IGRlZmluZWQgdmlhIGZvcmNlZmVlZGluZywgZG8gbm90IHF1ZXJ5IHRoZSBET00gZm9yIHRoZSByb290IHByb3BlcnR5J3MgdmFsdWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAganVzdCBncmFiIHJvb3RQcm9wZXJ0eSdzIHplcm8tdmFsdWUgdGVtcGxhdGUgZnJvbSBDU1MuSG9va3MuIFRoaXMgb3ZlcndyaXRlcyB0aGUgZWxlbWVudCdzIGFjdHVhbFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3QgcHJvcGVydHkgdmFsdWUgKGlmIG9uZSBpcyBzZXQpLCBidXQgdGhpcyBpcyBhY2NlcHRhYmxlIHNpbmNlIHRoZSBwcmltYXJ5IHJlYXNvbiB1c2VycyBmb3JjZWZlZWQgaXNcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0byBhdm9pZCBET00gcXVlcmllcywgYW5kIHRodXMgd2UgbGlrZXdpc2UgYXZvaWQgcXVlcnlpbmcgdGhlIERPTSBmb3IgdGhlIHJvb3QgcHJvcGVydHkncyB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBHcmFiIHRoaXMgaG9vaydzIHplcm8tdmFsdWUgdGVtcGxhdGUsIGUuZy4gXCIwcHggMHB4IDBweCBibGFja1wiLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZSA9IENTUy5Ib29rcy50ZW1wbGF0ZXNbcm9vdFByb3BlcnR5XVsxXTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBIYW5kbGUgbm9uLWhvb2tlZCBwcm9wZXJ0aWVzIHRoYXQgaGF2ZW4ndCBhbHJlYWR5IGJlZW4gZGVmaW5lZCB2aWEgZm9yY2VmZWVkaW5nLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzdGFydFZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgcHJvcGVydHkpOyAvKiBHRVQgKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBWYWx1ZSBEYXRhIEV4dHJhY3Rpb25cblx0ICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNlcGFyYXRlZFZhbHVlLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWVVbml0VHlwZSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWVVbml0VHlwZSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wZXJhdG9yID0gZmFsc2U7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogU2VwYXJhdGVzIGEgcHJvcGVydHkgdmFsdWUgaW50byBpdHMgbnVtZXJpYyB2YWx1ZSBhbmQgaXRzIHVuaXQgdHlwZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gc2VwYXJhdGVWYWx1ZSAocHJvcGVydHksIHZhbHVlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdW5pdFR5cGUsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtZXJpY1ZhbHVlO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1lcmljVmFsdWUgPSAodmFsdWUgfHwgXCIwXCIpXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRvU3RyaW5nKClcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudG9Mb3dlckNhc2UoKVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE1hdGNoIHRoZSB1bml0IHR5cGUgYXQgdGhlIGVuZCBvZiB0aGUgdmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1slQS16XSskLywgZnVuY3Rpb24obWF0Y2gpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogR3JhYiB0aGUgdW5pdCB0eXBlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0VHlwZSA9IG1hdGNoO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFN0cmlwIHRoZSB1bml0IHR5cGUgb2ZmIG9mIHZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgbm8gdW5pdCB0eXBlIHdhcyBzdXBwbGllZCwgYXNzaWduIG9uZSB0aGF0IGlzIGFwcHJvcHJpYXRlIGZvciB0aGlzIHByb3BlcnR5IChlLmcuIFwiZGVnXCIgZm9yIHJvdGF0ZVogb3IgXCJweFwiIGZvciB3aWR0aCkuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXVuaXRUeXBlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFR5cGUgPSBDU1MuVmFsdWVzLmdldFVuaXRUeXBlKHByb3BlcnR5KTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsgbnVtZXJpY1ZhbHVlLCB1bml0VHlwZSBdO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogU2VwYXJhdGUgc3RhcnRWYWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgc2VwYXJhdGVkVmFsdWUgPSBzZXBhcmF0ZVZhbHVlKHByb3BlcnR5LCBzdGFydFZhbHVlKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IHNlcGFyYXRlZFZhbHVlWzBdO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlVW5pdFR5cGUgPSBzZXBhcmF0ZWRWYWx1ZVsxXTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBTZXBhcmF0ZSBlbmRWYWx1ZSwgYW5kIGV4dHJhY3QgYSB2YWx1ZSBvcGVyYXRvciAoZS5nLiBcIis9XCIsIFwiLT1cIikgaWYgb25lIGV4aXN0cy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgc2VwYXJhdGVkVmFsdWUgPSBzZXBhcmF0ZVZhbHVlKHByb3BlcnR5LCBlbmRWYWx1ZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gc2VwYXJhdGVkVmFsdWVbMF0ucmVwbGFjZSgvXihbKy1cXC8qXSk9LywgZnVuY3Rpb24obWF0Y2gsIHN1Yk1hdGNoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcGVyYXRvciA9IHN1Yk1hdGNoO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTdHJpcCB0aGUgb3BlcmF0b3Igb2ZmIG9mIHRoZSB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcIlwiO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWVVbml0VHlwZSA9IHNlcGFyYXRlZFZhbHVlWzFdO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIFBhcnNlIGZsb2F0IHZhbHVlcyBmcm9tIGVuZFZhbHVlIGFuZCBzdGFydFZhbHVlLiBEZWZhdWx0IHRvIDAgaWYgTmFOIGlzIHJldHVybmVkLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gcGFyc2VGbG9hdChzdGFydFZhbHVlKSB8fCAwO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IHBhcnNlRmxvYXQoZW5kVmFsdWUpIHx8IDA7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBQcm9wZXJ0eS1TcGVjaWZpYyBWYWx1ZSBDb252ZXJzaW9uXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBDdXN0b20gc3VwcG9ydCBmb3IgcHJvcGVydGllcyB0aGF0IGRvbid0IGFjdHVhbGx5IGFjY2VwdCB0aGUgJSB1bml0IHR5cGUsIGJ1dCB3aGVyZSBwb2xseWZpbGxpbmcgaXMgdHJpdmlhbCBhbmQgcmVsYXRpdmVseSBmb29scHJvb2YuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbmRWYWx1ZVVuaXRUeXBlID09PSBcIiVcIikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQSAlLXZhbHVlIGZvbnRTaXplL2xpbmVIZWlnaHQgaXMgcmVsYXRpdmUgdG8gdGhlIHBhcmVudCdzIGZvbnRTaXplIChhcyBvcHBvc2VkIHRvIHRoZSBwYXJlbnQncyBkaW1lbnNpb25zKSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWNoIGlzIGlkZW50aWNhbCB0byB0aGUgZW0gdW5pdCdzIGJlaGF2aW9yLCBzbyB3ZSBwaWdneWJhY2sgb2ZmIG9mIHRoYXQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoL14oZm9udFNpemV8bGluZUhlaWdodCkkLy50ZXN0KHByb3BlcnR5KSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENvbnZlcnQgJSBpbnRvIGFuIGVtIGRlY2ltYWwgdmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWUgPSBlbmRWYWx1ZSAvIDEwMDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZVVuaXRUeXBlID0gXCJlbVwiO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRm9yIHNjYWxlWCBhbmQgc2NhbGVZLCBjb252ZXJ0IHRoZSB2YWx1ZSBpbnRvIGl0cyBkZWNpbWFsIGZvcm1hdCBhbmQgc3RyaXAgb2ZmIHRoZSB1bml0IHR5cGUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC9ec2NhbGUvLnRlc3QocHJvcGVydHkpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWUgPSBlbmRWYWx1ZSAvIDEwMDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZVVuaXRUeXBlID0gXCJcIjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEZvciBSR0IgY29tcG9uZW50cywgdGFrZSB0aGUgZGVmaW5lZCBwZXJjZW50YWdlIG9mIDI1NSBhbmQgc3RyaXAgb2ZmIHRoZSB1bml0IHR5cGUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC8oUmVkfEdyZWVufEJsdWUpJC9pLnRlc3QocHJvcGVydHkpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWUgPSAoZW5kVmFsdWUgLyAxMDApICogMjU1O1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlVW5pdFR5cGUgPSBcIlwiO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBVbml0IFJhdGlvIENhbGN1bGF0aW9uXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBXaGVuIHF1ZXJpZWQsIHRoZSBicm93c2VyIHJldHVybnMgKG1vc3QpIENTUyBwcm9wZXJ0eSB2YWx1ZXMgaW4gcGl4ZWxzLiBUaGVyZWZvcmUsIGlmIGFuIGVuZFZhbHVlIHdpdGggYSB1bml0IHR5cGUgb2Zcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgJSwgZW0sIG9yIHJlbSBpcyBhbmltYXRlZCB0b3dhcmQsIHN0YXJ0VmFsdWUgbXVzdCBiZSBjb252ZXJ0ZWQgZnJvbSBwaXhlbHMgaW50byB0aGUgc2FtZSB1bml0IHR5cGUgYXMgZW5kVmFsdWUgaW4gb3JkZXJcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIHZhbHVlIG1hbmlwdWxhdGlvbiBsb2dpYyAoaW5jcmVtZW50L2RlY3JlbWVudCkgdG8gcHJvY2VlZC4gRnVydGhlciwgaWYgdGhlIHN0YXJ0VmFsdWUgd2FzIGZvcmNlZmVkIG9yIHRyYW5zZmVycmVkXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyb20gYSBwcmV2aW91cyBjYWxsLCBzdGFydFZhbHVlIG1heSBhbHNvIG5vdCBiZSBpbiBwaXhlbHMuIFVuaXQgY29udmVyc2lvbiBsb2dpYyB0aGVyZWZvcmUgY29uc2lzdHMgb2YgdHdvIHN0ZXBzOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAxKSBDYWxjdWxhdGluZyB0aGUgcmF0aW8gb2YgJS9lbS9yZW0vdmgvdncgcmVsYXRpdmUgdG8gcGl4ZWxzXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIDIpIENvbnZlcnRpbmcgc3RhcnRWYWx1ZSBpbnRvIHRoZSBzYW1lIHVuaXQgb2YgbWVhc3VyZW1lbnQgYXMgZW5kVmFsdWUgYmFzZWQgb24gdGhlc2UgcmF0aW9zLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBVbml0IGNvbnZlcnNpb24gcmF0aW9zIGFyZSBjYWxjdWxhdGVkIGJ5IGluc2VydGluZyBhIHNpYmxpbmcgbm9kZSBuZXh0IHRvIHRoZSB0YXJnZXQgbm9kZSwgY29weWluZyBvdmVyIGl0cyBwb3NpdGlvbiBwcm9wZXJ0eSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0dGluZyB2YWx1ZXMgd2l0aCB0aGUgdGFyZ2V0IHVuaXQgdHlwZSB0aGVuIGNvbXBhcmluZyB0aGUgcmV0dXJuZWQgcGl4ZWwgdmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IEV2ZW4gaWYgb25seSBvbmUgb2YgdGhlc2UgdW5pdCB0eXBlcyBpcyBiZWluZyBhbmltYXRlZCwgYWxsIHVuaXQgcmF0aW9zIGFyZSBjYWxjdWxhdGVkIGF0IG9uY2Ugc2luY2UgdGhlIG92ZXJoZWFkXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mIGJhdGNoaW5nIHRoZSBTRVRzIGFuZCBHRVRzIHRvZ2V0aGVyIHVwZnJvbnQgb3V0d2VpZ2h0cyB0aGUgcG90ZW50aWFsIG92ZXJoZWFkXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mIGxheW91dCB0aHJhc2hpbmcgY2F1c2VkIGJ5IHJlLXF1ZXJ5aW5nIGZvciB1bmNhbGN1bGF0ZWQgcmF0aW9zIGZvciBzdWJzZXF1ZW50bHktcHJvY2Vzc2VkIHByb3BlcnRpZXMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRvZG86IFNoaWZ0IHRoaXMgbG9naWMgaW50byB0aGUgY2FsbHMnIGZpcnN0IHRpY2sgaW5zdGFuY2Ugc28gdGhhdCBpdCdzIHN5bmNlZCB3aXRoIFJBRi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gY2FsY3VsYXRlVW5pdFJhdGlvcyAoKSB7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTYW1lIFJhdGlvIENoZWNrc1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBUaGUgcHJvcGVydGllcyBiZWxvdyBhcmUgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciB0aGUgZWxlbWVudCBkaWZmZXJzIHN1ZmZpY2llbnRseSBmcm9tIHRoaXMgY2FsbCdzXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmV2aW91c2x5IGl0ZXJhdGVkIGVsZW1lbnQgdG8gYWxzbyBkaWZmZXIgaW4gaXRzIHVuaXQgY29udmVyc2lvbiByYXRpb3MuIElmIHRoZSBwcm9wZXJ0aWVzIG1hdGNoIHVwIHdpdGggdGhvc2Vcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mIHRoZSBwcmlvciBlbGVtZW50LCB0aGUgcHJpb3IgZWxlbWVudCdzIGNvbnZlcnNpb24gcmF0aW9zIGFyZSB1c2VkLiBMaWtlIG1vc3Qgb3B0aW1pemF0aW9ucyBpbiBWZWxvY2l0eSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMgaXMgZG9uZSB0byBtaW5pbWl6ZSBET00gcXVlcnlpbmcuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2FtZVJhdGlvSW5kaWNhdG9ycyA9IHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbXlQYXJlbnQ6IGVsZW1lbnQucGFyZW50Tm9kZSB8fCBkb2N1bWVudC5ib2R5LCAvKiBHRVQgKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwicG9zaXRpb25cIiksIC8qIEdFVCAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250U2l6ZTogQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJmb250U2l6ZVwiKSAvKiBHRVQgKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIERldGVybWluZSBpZiB0aGUgc2FtZSAlIHJhdGlvIGNhbiBiZSB1c2VkLiAlIGlzIGJhc2VkIG9uIHRoZSBlbGVtZW50J3MgcG9zaXRpb24gdmFsdWUgYW5kIGl0cyBwYXJlbnQncyB3aWR0aCBhbmQgaGVpZ2h0IGRpbWVuc2lvbnMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2FtZVBlcmNlbnRSYXRpbyA9ICgoc2FtZVJhdGlvSW5kaWNhdG9ycy5wb3NpdGlvbiA9PT0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0UG9zaXRpb24pICYmIChzYW1lUmF0aW9JbmRpY2F0b3JzLm15UGFyZW50ID09PSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RQYXJlbnQpKSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBEZXRlcm1pbmUgaWYgdGhlIHNhbWUgZW0gcmF0aW8gY2FuIGJlIHVzZWQuIGVtIGlzIHJlbGF0aXZlIHRvIHRoZSBlbGVtZW50J3MgZm9udFNpemUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2FtZUVtUmF0aW8gPSAoc2FtZVJhdGlvSW5kaWNhdG9ycy5mb250U2l6ZSA9PT0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0Rm9udFNpemUpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTdG9yZSB0aGVzZSByYXRpbyBpbmRpY2F0b3JzIGNhbGwtd2lkZSBmb3IgdGhlIG5leHQgZWxlbWVudCB0byBjb21wYXJlIGFnYWluc3QuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RQYXJlbnQgPSBzYW1lUmF0aW9JbmRpY2F0b3JzLm15UGFyZW50O1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0UG9zaXRpb24gPSBzYW1lUmF0aW9JbmRpY2F0b3JzLnBvc2l0aW9uO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0Rm9udFNpemUgPSBzYW1lUmF0aW9JbmRpY2F0b3JzLmZvbnRTaXplO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFbGVtZW50LVNwZWNpZmljIFVuaXRzXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IElFOCByb3VuZHMgdG8gdGhlIG5lYXJlc3QgcGl4ZWwgd2hlbiByZXR1cm5pbmcgQ1NTIHZhbHVlcywgdGh1cyB3ZSBwZXJmb3JtIGNvbnZlcnNpb25zIHVzaW5nIGEgbWVhc3VyZW1lbnRcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9mIDEwMCAoaW5zdGVhZCBvZiAxKSB0byBnaXZlIG91ciByYXRpb3MgYSBwcmVjaXNpb24gb2YgYXQgbGVhc3QgMiBkZWNpbWFsIHZhbHVlcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtZWFzdXJlbWVudCA9IDEwMCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0UmF0aW9zID0ge307XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc2FtZUVtUmF0aW8gfHwgIXNhbWVQZXJjZW50UmF0aW8pIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZHVtbXkgPSBEYXRhKGVsZW1lbnQpLmlzU1ZHID8gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiwgXCJyZWN0XCIpIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LmluaXQoZHVtbXkpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNhbWVSYXRpb0luZGljYXRvcnMubXlQYXJlbnQuYXBwZW5kQ2hpbGQoZHVtbXkpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVG8gYWNjdXJhdGVseSBhbmQgY29uc2lzdGVudGx5IGNhbGN1bGF0ZSBjb252ZXJzaW9uIHJhdGlvcywgdGhlIGVsZW1lbnQncyBjYXNjYWRlZCBvdmVyZmxvdyBhbmQgYm94LXNpemluZyBhcmUgc3RyaXBwZWQuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU2ltaWxhcmx5LCBzaW5jZSB3aWR0aC9oZWlnaHQgY2FuIGJlIGFydGlmaWNpYWxseSBjb25zdHJhaW5lZCBieSB0aGVpciBtaW4tL21heC0gZXF1aXZhbGVudHMsIHRoZXNlIGFyZSBjb250cm9sbGVkIGZvciBhcyB3ZWxsLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IE92ZXJmbG93IG11c3QgYmUgYWxzbyBiZSBjb250cm9sbGVkIGZvciBwZXItYXhpcyBzaW5jZSB0aGUgb3ZlcmZsb3cgcHJvcGVydHkgb3ZlcndyaXRlcyBpdHMgcGVyLWF4aXMgdmFsdWVzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChbIFwib3ZlcmZsb3dcIiwgXCJvdmVyZmxvd1hcIiwgXCJvdmVyZmxvd1lcIiBdLCBmdW5jdGlvbihpLCBwcm9wZXJ0eSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5DU1Muc2V0UHJvcGVydHlWYWx1ZShkdW1teSwgcHJvcGVydHksIFwiaGlkZGVuXCIpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LkNTUy5zZXRQcm9wZXJ0eVZhbHVlKGR1bW15LCBcInBvc2l0aW9uXCIsIHNhbWVSYXRpb0luZGljYXRvcnMucG9zaXRpb24pO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LkNTUy5zZXRQcm9wZXJ0eVZhbHVlKGR1bW15LCBcImZvbnRTaXplXCIsIHNhbWVSYXRpb0luZGljYXRvcnMuZm9udFNpemUpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LkNTUy5zZXRQcm9wZXJ0eVZhbHVlKGR1bW15LCBcImJveFNpemluZ1wiLCBcImNvbnRlbnQtYm94XCIpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogd2lkdGggYW5kIGhlaWdodCBhY3QgYXMgb3VyIHByb3h5IHByb3BlcnRpZXMgZm9yIG1lYXN1cmluZyB0aGUgaG9yaXpvbnRhbCBhbmQgdmVydGljYWwgJSByYXRpb3MuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKFsgXCJtaW5XaWR0aFwiLCBcIm1heFdpZHRoXCIsIFwid2lkdGhcIiwgXCJtaW5IZWlnaHRcIiwgXCJtYXhIZWlnaHRcIiwgXCJoZWlnaHRcIiBdLCBmdW5jdGlvbihpLCBwcm9wZXJ0eSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5DU1Muc2V0UHJvcGVydHlWYWx1ZShkdW1teSwgcHJvcGVydHksIG1lYXN1cmVtZW50ICsgXCIlXCIpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIHBhZGRpbmdMZWZ0IGFyYml0cmFyaWx5IGFjdHMgYXMgb3VyIHByb3h5IHByb3BlcnR5IGZvciB0aGUgZW0gcmF0aW8uICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuQ1NTLnNldFByb3BlcnR5VmFsdWUoZHVtbXksIFwicGFkZGluZ0xlZnRcIiwgbWVhc3VyZW1lbnQgKyBcImVtXCIpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRGl2aWRlIHRoZSByZXR1cm5lZCB2YWx1ZSBieSB0aGUgbWVhc3VyZW1lbnQgdG8gZ2V0IHRoZSByYXRpbyBiZXR3ZWVuIDElIGFuZCAxcHguIERlZmF1bHQgdG8gMSBzaW5jZSB3b3JraW5nIHdpdGggMCBjYW4gcHJvZHVjZSBJbmZpbml0ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0UmF0aW9zLnBlcmNlbnRUb1B4V2lkdGggPSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RQZXJjZW50VG9QeFdpZHRoID0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZHVtbXksIFwid2lkdGhcIiwgbnVsbCwgdHJ1ZSkpIHx8IDEpIC8gbWVhc3VyZW1lbnQ7IC8qIEdFVCAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRSYXRpb3MucGVyY2VudFRvUHhIZWlnaHQgPSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RQZXJjZW50VG9QeEhlaWdodCA9IChwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGR1bW15LCBcImhlaWdodFwiLCBudWxsLCB0cnVlKSkgfHwgMSkgLyBtZWFzdXJlbWVudDsgLyogR0VUICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFJhdGlvcy5lbVRvUHggPSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RFbVRvUHggPSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShkdW1teSwgXCJwYWRkaW5nTGVmdFwiKSkgfHwgMSkgLyBtZWFzdXJlbWVudDsgLyogR0VUICovXG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYW1lUmF0aW9JbmRpY2F0b3JzLm15UGFyZW50LnJlbW92ZUNoaWxkKGR1bW15KTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFJhdGlvcy5lbVRvUHggPSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RFbVRvUHg7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFJhdGlvcy5wZXJjZW50VG9QeFdpZHRoID0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0UGVyY2VudFRvUHhXaWR0aDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0UmF0aW9zLnBlcmNlbnRUb1B4SGVpZ2h0ID0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0UGVyY2VudFRvUHhIZWlnaHQ7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEVsZW1lbnQtQWdub3N0aWMgVW5pdHNcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogV2hlcmVhcyAlIGFuZCBlbSByYXRpb3MgYXJlIGRldGVybWluZWQgb24gYSBwZXItZWxlbWVudCBiYXNpcywgdGhlIHJlbSB1bml0IG9ubHkgbmVlZHMgdG8gYmUgY2hlY2tlZFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25jZSBwZXIgY2FsbCBzaW5jZSBpdCdzIGV4Y2x1c2l2ZWx5IGRlcGVuZGFudCB1cG9uIGRvY3VtZW50LmJvZHkncyBmb250U2l6ZS4gSWYgdGhpcyBpcyB0aGUgZmlyc3QgdGltZVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdCBjYWxjdWxhdGVVbml0UmF0aW9zKCkgaXMgYmVpbmcgcnVuIGR1cmluZyB0aGlzIGNhbGwsIHJlbVRvUHggd2lsbCBzdGlsbCBiZSBzZXQgdG8gaXRzIGRlZmF1bHQgdmFsdWUgb2YgbnVsbCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvIHdlIGNhbGN1bGF0ZSBpdCBub3cuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5yZW1Ub1B4ID09PSBudWxsKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRGVmYXVsdCB0byBicm93c2VycycgZGVmYXVsdCBmb250U2l6ZSBvZiAxNnB4IGluIHRoZSBjYXNlIG9mIDAuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5yZW1Ub1B4ID0gcGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShkb2N1bWVudC5ib2R5LCBcImZvbnRTaXplXCIpKSB8fCAxNjsgLyogR0VUICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFNpbWlsYXJseSwgdmlld3BvcnQgdW5pdHMgYXJlICUtcmVsYXRpdmUgdG8gdGhlIHdpbmRvdydzIGlubmVyIGRpbWVuc2lvbnMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbFVuaXRDb252ZXJzaW9uRGF0YS52d1RvUHggPT09IG51bGwpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsVW5pdENvbnZlcnNpb25EYXRhLnZ3VG9QeCA9IHBhcnNlRmxvYXQod2luZG93LmlubmVyV2lkdGgpIC8gMTAwOyAvKiBHRVQgKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsVW5pdENvbnZlcnNpb25EYXRhLnZoVG9QeCA9IHBhcnNlRmxvYXQod2luZG93LmlubmVySGVpZ2h0KSAvIDEwMDsgLyogR0VUICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRSYXRpb3MucmVtVG9QeCA9IGNhbGxVbml0Q29udmVyc2lvbkRhdGEucmVtVG9QeDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRSYXRpb3MudndUb1B4ID0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS52d1RvUHg7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0UmF0aW9zLnZoVG9QeCA9IGNhbGxVbml0Q29udmVyc2lvbkRhdGEudmhUb1B4O1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoVmVsb2NpdHkuZGVidWcgPj0gMSkgY29uc29sZS5sb2coXCJVbml0IHJhdGlvczogXCIgKyBKU09OLnN0cmluZ2lmeSh1bml0UmF0aW9zKSwgZWxlbWVudCk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB1bml0UmF0aW9zO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIFVuaXQgQ29udmVyc2lvblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBUaGUgKiBhbmQgLyBvcGVyYXRvcnMsIHdoaWNoIGFyZSBub3QgcGFzc2VkIGluIHdpdGggYW4gYXNzb2NpYXRlZCB1bml0LCBpbmhlcmVudGx5IHVzZSBzdGFydFZhbHVlJ3MgdW5pdC4gU2tpcCB2YWx1ZSBhbmQgdW5pdCBjb252ZXJzaW9uLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoL1tcXC8qXS8udGVzdChvcGVyYXRvcikpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlVW5pdFR5cGUgPSBzdGFydFZhbHVlVW5pdFR5cGU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHN0YXJ0VmFsdWUgYW5kIGVuZFZhbHVlIGRpZmZlciBpbiB1bml0IHR5cGUsIGNvbnZlcnQgc3RhcnRWYWx1ZSBpbnRvIHRoZSBzYW1lIHVuaXQgdHlwZSBhcyBlbmRWYWx1ZSBzbyB0aGF0IGlmIGVuZFZhbHVlVW5pdFR5cGVcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgaXMgYSByZWxhdGl2ZSB1bml0ICglLCBlbSwgcmVtKSwgdGhlIHZhbHVlcyBzZXQgZHVyaW5nIHR3ZWVuaW5nIHdpbGwgY29udGludWUgdG8gYmUgYWNjdXJhdGVseSByZWxhdGl2ZSBldmVuIGlmIHRoZSBtZXRyaWNzIHRoZXkgZGVwZW5kXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uIGFyZSBkeW5hbWljYWxseSBjaGFuZ2luZyBkdXJpbmcgdGhlIGNvdXJzZSBvZiB0aGUgYW5pbWF0aW9uLiBDb252ZXJzZWx5LCBpZiB3ZSBhbHdheXMgbm9ybWFsaXplZCBpbnRvIHB4IGFuZCB1c2VkIHB4IGZvciBzZXR0aW5nIHZhbHVlcywgdGhlIHB4IHJhdGlvXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIHdvdWxkIGJlY29tZSBzdGFsZSBpZiB0aGUgb3JpZ2luYWwgdW5pdCBiZWluZyBhbmltYXRlZCB0b3dhcmQgd2FzIHJlbGF0aXZlIGFuZCB0aGUgdW5kZXJseWluZyBtZXRyaWNzIGNoYW5nZSBkdXJpbmcgdGhlIGFuaW1hdGlvbi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogU2luY2UgMCBpcyAwIGluIGFueSB1bml0IHR5cGUsIG5vIGNvbnZlcnNpb24gaXMgbmVjZXNzYXJ5IHdoZW4gc3RhcnRWYWx1ZSBpcyAwIC0tIHdlIGp1c3Qgc3RhcnQgYXQgMCB3aXRoIGVuZFZhbHVlVW5pdFR5cGUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoKHN0YXJ0VmFsdWVVbml0VHlwZSAhPT0gZW5kVmFsdWVVbml0VHlwZSkgJiYgc3RhcnRWYWx1ZSAhPT0gMCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVW5pdCBjb252ZXJzaW9uIGlzIGFsc28gc2tpcHBlZCB3aGVuIGVuZFZhbHVlIGlzIDAsIGJ1dCAqc3RhcnRWYWx1ZVVuaXRUeXBlKiBtdXN0IGJlIHVzZWQgZm9yIHR3ZWVuIHZhbHVlcyB0byByZW1haW4gYWNjdXJhdGUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBTa2lwcGluZyB1bml0IGNvbnZlcnNpb24gaGVyZSBtZWFucyB0aGF0IGlmIGVuZFZhbHVlVW5pdFR5cGUgd2FzIG9yaWdpbmFsbHkgYSByZWxhdGl2ZSB1bml0LCB0aGUgYW5pbWF0aW9uIHdvbid0IHJlbGF0aXZlbHlcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoIHRoZSB1bmRlcmx5aW5nIG1ldHJpY3MgaWYgdGhleSBjaGFuZ2UsIGJ1dCB0aGlzIGlzIGFjY2VwdGFibGUgc2luY2Ugd2UncmUgYW5pbWF0aW5nIHRvd2FyZCBpbnZpc2liaWxpdHkgaW5zdGVhZCBvZiB0b3dhcmQgdmlzaWJpbGl0eSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWNoIHJlbWFpbnMgcGFzdCB0aGUgcG9pbnQgb2YgdGhlIGFuaW1hdGlvbidzIGNvbXBsZXRpb24uICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW5kVmFsdWUgPT09IDApIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZVVuaXRUeXBlID0gc3RhcnRWYWx1ZVVuaXRUeXBlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBCeSB0aGlzIHBvaW50LCB3ZSBjYW5ub3QgYXZvaWQgdW5pdCBjb252ZXJzaW9uIChpdCdzIHVuZGVzaXJhYmxlIHNpbmNlIGl0IGNhdXNlcyBsYXlvdXQgdGhyYXNoaW5nKS5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJZiB3ZSBoYXZlbid0IGFscmVhZHksIHdlIHRyaWdnZXIgY2FsY3VsYXRlVW5pdFJhdGlvcygpLCB3aGljaCBydW5zIG9uY2UgcGVyIGVsZW1lbnQgcGVyIGNhbGwuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudFVuaXRDb252ZXJzaW9uRGF0YSA9IGVsZW1lbnRVbml0Q29udmVyc2lvbkRhdGEgfHwgY2FsY3VsYXRlVW5pdFJhdGlvcygpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVGhlIGZvbGxvd2luZyBSZWdFeCBtYXRjaGVzIENTUyBwcm9wZXJ0aWVzIHRoYXQgaGF2ZSB0aGVpciAlIHZhbHVlcyBtZWFzdXJlZCByZWxhdGl2ZSB0byB0aGUgeC1heGlzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFczQyBzcGVjIG1hbmRhdGVzIHRoYXQgYWxsIG9mIG1hcmdpbiBhbmQgcGFkZGluZydzIHByb3BlcnRpZXMgKGV2ZW4gdG9wIGFuZCBib3R0b20pIGFyZSAlLXJlbGF0aXZlIHRvIHRoZSAqd2lkdGgqIG9mIHRoZSBwYXJlbnQgZWxlbWVudC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXhpcyA9ICgvbWFyZ2lufHBhZGRpbmd8bGVmdHxyaWdodHx3aWR0aHx0ZXh0fHdvcmR8bGV0dGVyL2kudGVzdChwcm9wZXJ0eSkgfHwgL1gkLy50ZXN0KHByb3BlcnR5KSB8fCBwcm9wZXJ0eSA9PT0gXCJ4XCIpID8gXCJ4XCIgOiBcInlcIjtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEluIG9yZGVyIHRvIGF2b2lkIGdlbmVyYXRpbmcgbl4yIGJlc3Bva2UgY29udmVyc2lvbiBmdW5jdGlvbnMsIHVuaXQgY29udmVyc2lvbiBpcyBhIHR3by1zdGVwIHByb2Nlc3M6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMSkgQ29udmVydCBzdGFydFZhbHVlIGludG8gcGl4ZWxzLiAyKSBDb252ZXJ0IHRoaXMgbmV3IHBpeGVsIHZhbHVlIGludG8gZW5kVmFsdWUncyB1bml0IHR5cGUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChzdGFydFZhbHVlVW5pdFR5cGUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIiVcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IHRyYW5zbGF0ZVggYW5kIHRyYW5zbGF0ZVkgYXJlIHRoZSBvbmx5IHByb3BlcnRpZXMgdGhhdCBhcmUgJS1yZWxhdGl2ZSB0byBhbiBlbGVtZW50J3Mgb3duIGRpbWVuc2lvbnMgLS0gbm90IGl0cyBwYXJlbnQncyBkaW1lbnNpb25zLlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkgZG9lcyBub3QgaW5jbHVkZSBhIHNwZWNpYWwgY29udmVyc2lvbiBwcm9jZXNzIHRvIGFjY291bnQgZm9yIHRoaXMgYmVoYXZpb3IuIFRoZXJlZm9yZSwgYW5pbWF0aW5nIHRyYW5zbGF0ZVgvWSBmcm9tIGEgJSB2YWx1ZVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG8gYSBub24tJSB2YWx1ZSB3aWxsIHByb2R1Y2UgYW4gaW5jb3JyZWN0IHN0YXJ0IHZhbHVlLiBGb3J0dW5hdGVseSwgdGhpcyBzb3J0IG9mIGNyb3NzLXVuaXQgY29udmVyc2lvbiBpcyByYXJlbHkgZG9uZSBieSB1c2VycyBpbiBwcmFjdGljZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgKj0gKGF4aXMgPT09IFwieFwiID8gZWxlbWVudFVuaXRDb252ZXJzaW9uRGF0YS5wZXJjZW50VG9QeFdpZHRoIDogZWxlbWVudFVuaXRDb252ZXJzaW9uRGF0YS5wZXJjZW50VG9QeEhlaWdodCk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwicHhcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIHB4IGFjdHMgYXMgb3VyIG1pZHBvaW50IGluIHRoZSB1bml0IGNvbnZlcnNpb24gcHJvY2VzczsgZG8gbm90aGluZy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlICo9IGVsZW1lbnRVbml0Q29udmVyc2lvbkRhdGFbc3RhcnRWYWx1ZVVuaXRUeXBlICsgXCJUb1B4XCJdO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEludmVydCB0aGUgcHggcmF0aW9zIHRvIGNvbnZlcnQgaW50byB0byB0aGUgdGFyZ2V0IHVuaXQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChlbmRWYWx1ZVVuaXRUeXBlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCIlXCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlICo9IDEgLyAoYXhpcyA9PT0gXCJ4XCIgPyBlbGVtZW50VW5pdENvbnZlcnNpb25EYXRhLnBlcmNlbnRUb1B4V2lkdGggOiBlbGVtZW50VW5pdENvbnZlcnNpb25EYXRhLnBlcmNlbnRUb1B4SGVpZ2h0KTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJweFwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogc3RhcnRWYWx1ZSBpcyBhbHJlYWR5IGluIHB4LCBkbyBub3RoaW5nOyB3ZSdyZSBkb25lLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgKj0gMSAvIGVsZW1lbnRVbml0Q29udmVyc2lvbkRhdGFbZW5kVmFsdWVVbml0VHlwZSArIFwiVG9QeFwiXTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlbGF0aXZlIFZhbHVlc1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogT3BlcmF0b3IgbG9naWMgbXVzdCBiZSBwZXJmb3JtZWQgbGFzdCBzaW5jZSBpdCByZXF1aXJlcyB1bml0LW5vcm1hbGl6ZWQgc3RhcnQgYW5kIGVuZCB2YWx1ZXMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFJlbGF0aXZlICpwZXJjZW50IHZhbHVlcyogZG8gbm90IGJlaGF2ZSBob3cgbW9zdCBwZW9wbGUgdGhpbms7IHdoaWxlIG9uZSB3b3VsZCBleHBlY3QgXCIrPTUwJVwiXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvIGluY3JlYXNlIHRoZSBwcm9wZXJ0eSAxLjV4IGl0cyBjdXJyZW50IHZhbHVlLCBpdCBpbiBmYWN0IGluY3JlYXNlcyB0aGUgcGVyY2VudCB1bml0cyBpbiBhYnNvbHV0ZSB0ZXJtczpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgNTAgcG9pbnRzIGlzIGFkZGVkIG9uIHRvcCBvZiB0aGUgY3VycmVudCAlIHZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKG9wZXJhdG9yKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiK1wiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gc3RhcnRWYWx1ZSArIGVuZFZhbHVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiLVwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gc3RhcnRWYWx1ZSAtIGVuZFZhbHVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiKlwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gc3RhcnRWYWx1ZSAqIGVuZFZhbHVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiL1wiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gc3RhcnRWYWx1ZSAvIGVuZFZhbHVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuc0NvbnRhaW5lciBQdXNoXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIENvbnN0cnVjdCB0aGUgcGVyLXByb3BlcnR5IHR3ZWVuIG9iamVjdCwgYW5kIHB1c2ggaXQgdG8gdGhlIGVsZW1lbnQncyB0d2VlbnNDb250YWluZXIuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuc0NvbnRhaW5lcltwcm9wZXJ0eV0gPSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZTogcm9vdFByb3BlcnR5VmFsdWUsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlOiBzdGFydFZhbHVlLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFZhbHVlOiBzdGFydFZhbHVlLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWU6IGVuZFZhbHVlLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFR5cGU6IGVuZFZhbHVlVW5pdFR5cGUsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBlYXNpbmc6IGVhc2luZ1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9O1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChWZWxvY2l0eS5kZWJ1ZykgY29uc29sZS5sb2coXCJ0d2VlbnNDb250YWluZXIgKFwiICsgcHJvcGVydHkgKyBcIik6IFwiICsgSlNPTi5zdHJpbmdpZnkodHdlZW5zQ29udGFpbmVyW3Byb3BlcnR5XSksIGVsZW1lbnQpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIEFsb25nIHdpdGggaXRzIHByb3BlcnR5IGRhdGEsIHN0b3JlIGEgcmVmZXJlbmNlIHRvIHRoZSBlbGVtZW50IGl0c2VsZiBvbnRvIHR3ZWVuc0NvbnRhaW5lci4gKi9cblx0ICAgICAgICAgICAgICAgICAgICB0d2VlbnNDb250YWluZXIuZWxlbWVudCA9IGVsZW1lbnQ7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgIENhbGwgUHVzaFxuXHQgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgIC8qIE5vdGU6IHR3ZWVuc0NvbnRhaW5lciBjYW4gYmUgZW1wdHkgaWYgYWxsIG9mIHRoZSBwcm9wZXJ0aWVzIGluIHRoaXMgY2FsbCdzIHByb3BlcnR5IG1hcCB3ZXJlIHNraXBwZWQgZHVlIHRvIG5vdFxuXHQgICAgICAgICAgICAgICAgICAgYmVpbmcgc3VwcG9ydGVkIGJ5IHRoZSBicm93c2VyLiBUaGUgZWxlbWVudCBwcm9wZXJ0eSBpcyB1c2VkIGZvciBjaGVja2luZyB0aGF0IHRoZSB0d2VlbnNDb250YWluZXIgaGFzIGJlZW4gYXBwZW5kZWQgdG8uICovXG5cdCAgICAgICAgICAgICAgICBpZiAodHdlZW5zQ29udGFpbmVyLmVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAvKiBBcHBseSB0aGUgXCJ2ZWxvY2l0eS1hbmltYXRpbmdcIiBpbmRpY2F0b3IgY2xhc3MuICovXG5cdCAgICAgICAgICAgICAgICAgICAgQ1NTLlZhbHVlcy5hZGRDbGFzcyhlbGVtZW50LCBcInZlbG9jaXR5LWFuaW1hdGluZ1wiKTtcblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIFRoZSBjYWxsIGFycmF5IGhvdXNlcyB0aGUgdHdlZW5zQ29udGFpbmVycyBmb3IgZWFjaCBlbGVtZW50IGJlaW5nIGFuaW1hdGVkIGluIHRoZSBjdXJyZW50IGNhbGwuICovXG5cdCAgICAgICAgICAgICAgICAgICAgY2FsbC5wdXNoKHR3ZWVuc0NvbnRhaW5lcik7XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBTdG9yZSB0aGUgdHdlZW5zQ29udGFpbmVyIGFuZCBvcHRpb25zIGlmIHdlJ3JlIHdvcmtpbmcgb24gdGhlIGRlZmF1bHQgZWZmZWN0cyBxdWV1ZSwgc28gdGhhdCB0aGV5IGNhbiBiZSB1c2VkIGJ5IHRoZSByZXZlcnNlIGNvbW1hbmQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMucXVldWUgPT09IFwiXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS50d2VlbnNDb250YWluZXIgPSB0d2VlbnNDb250YWluZXI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkub3B0cyA9IG9wdHM7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogU3dpdGNoIG9uIHRoZSBlbGVtZW50J3MgYW5pbWF0aW5nIGZsYWcuICovXG5cdCAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5pc0FuaW1hdGluZyA9IHRydWU7XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBPbmNlIHRoZSBmaW5hbCBlbGVtZW50IGluIHRoaXMgY2FsbCdzIGVsZW1lbnQgc2V0IGhhcyBiZWVuIHByb2Nlc3NlZCwgcHVzaCB0aGUgY2FsbCBhcnJheSBvbnRvXG5cdCAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuU3RhdGUuY2FsbHMgZm9yIHRoZSBhbmltYXRpb24gdGljayB0byBpbW1lZGlhdGVseSBiZWdpbiBwcm9jZXNzaW5nLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChlbGVtZW50c0luZGV4ID09PSBlbGVtZW50c0xlbmd0aCAtIDEpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogQWRkIHRoZSBjdXJyZW50IGNhbGwgcGx1cyBpdHMgYXNzb2NpYXRlZCBtZXRhZGF0YSAodGhlIGVsZW1lbnQgc2V0IGFuZCB0aGUgY2FsbCdzIG9wdGlvbnMpIG9udG8gdGhlIGdsb2JhbCBjYWxsIGNvbnRhaW5lci5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgQW55dGhpbmcgb24gdGhpcyBjYWxsIGNvbnRhaW5lciBpcyBzdWJqZWN0ZWQgdG8gdGljaygpIHByb2Nlc3NpbmcuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LlN0YXRlLmNhbGxzLnB1c2goWyBjYWxsLCBlbGVtZW50cywgb3B0cywgbnVsbCwgcHJvbWlzZURhdGEucmVzb2x2ZXIgXSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGFuaW1hdGlvbiB0aWNrIGlzbid0IHJ1bm5pbmcsIHN0YXJ0IGl0LiAoVmVsb2NpdHkgc2h1dHMgaXQgb2ZmIHdoZW4gdGhlcmUgYXJlIG5vIGFjdGl2ZSBjYWxscyB0byBwcm9jZXNzLikgKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFZlbG9jaXR5LlN0YXRlLmlzVGlja2luZyA9PT0gZmFsc2UpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LlN0YXRlLmlzVGlja2luZyA9IHRydWU7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFN0YXJ0IHRoZSB0aWNrIGxvb3AuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aWNrKCk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50c0luZGV4Kys7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLyogV2hlbiB0aGUgcXVldWUgb3B0aW9uIGlzIHNldCB0byBmYWxzZSwgdGhlIGNhbGwgc2tpcHMgdGhlIGVsZW1lbnQncyBxdWV1ZSBhbmQgZmlyZXMgaW1tZWRpYXRlbHkuICovXG5cdCAgICAgICAgICAgIGlmIChvcHRzLnF1ZXVlID09PSBmYWxzZSkge1xuXHQgICAgICAgICAgICAgICAgLyogU2luY2UgdGhpcyBidWlsZFF1ZXVlIGNhbGwgZG9lc24ndCByZXNwZWN0IHRoZSBlbGVtZW50J3MgZXhpc3RpbmcgcXVldWUgKHdoaWNoIGlzIHdoZXJlIGEgZGVsYXkgb3B0aW9uIHdvdWxkIGhhdmUgYmVlbiBhcHBlbmRlZCksXG5cdCAgICAgICAgICAgICAgICAgICB3ZSBtYW51YWxseSBpbmplY3QgdGhlIGRlbGF5IHByb3BlcnR5IGhlcmUgd2l0aCBhbiBleHBsaWNpdCBzZXRUaW1lb3V0LiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKG9wdHMuZGVsYXkpIHtcblx0ICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGJ1aWxkUXVldWUsIG9wdHMuZGVsYXkpO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICBidWlsZFF1ZXVlKCk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIC8qIE90aGVyd2lzZSwgdGhlIGNhbGwgdW5kZXJnb2VzIGVsZW1lbnQgcXVldWVpbmcgYXMgbm9ybWFsLiAqL1xuXHQgICAgICAgICAgICAvKiBOb3RlOiBUbyBpbnRlcm9wZXJhdGUgd2l0aCBqUXVlcnksIFZlbG9jaXR5IHVzZXMgalF1ZXJ5J3Mgb3duICQucXVldWUoKSBzdGFjayBmb3IgcXVldWluZyBsb2dpYy4gKi9cblx0ICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICQucXVldWUoZWxlbWVudCwgb3B0cy5xdWV1ZSwgZnVuY3Rpb24obmV4dCwgY2xlYXJRdWV1ZSkge1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBjbGVhclF1ZXVlIGZsYWcgd2FzIHBhc3NlZCBpbiBieSB0aGUgc3RvcCBjb21tYW5kLCByZXNvbHZlIHRoaXMgY2FsbCdzIHByb21pc2UuIChQcm9taXNlcyBjYW4gb25seSBiZSByZXNvbHZlZCBvbmNlLFxuXHQgICAgICAgICAgICAgICAgICAgICAgIHNvIGl0J3MgZmluZSBpZiB0aGlzIGlzIHJlcGVhdGVkbHkgdHJpZ2dlcmVkIGZvciBlYWNoIGVsZW1lbnQgaW4gdGhlIGFzc29jaWF0ZWQgY2FsbC4pICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKGNsZWFyUXVldWUgPT09IHRydWUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb21pc2VEYXRhLnByb21pc2UpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VEYXRhLnJlc29sdmVyKGVsZW1lbnRzKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIERvIG5vdCBjb250aW51ZSB3aXRoIGFuaW1hdGlvbiBxdWV1ZWluZy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogVGhpcyBmbGFnIGluZGljYXRlcyB0byB0aGUgdXBjb21pbmcgY29tcGxldGVDYWxsKCkgZnVuY3Rpb24gdGhhdCB0aGlzIHF1ZXVlIGVudHJ5IHdhcyBpbml0aWF0ZWQgYnkgVmVsb2NpdHkuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgU2VlIGNvbXBsZXRlQ2FsbCgpIGZvciBmdXJ0aGVyIGRldGFpbHMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkudmVsb2NpdHlRdWV1ZUVudHJ5RmxhZyA9IHRydWU7XG5cblx0ICAgICAgICAgICAgICAgICAgICBidWlsZFF1ZXVlKG5leHQpO1xuXHQgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICBBdXRvLURlcXVldWluZ1xuXHQgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgLyogQXMgcGVyIGpRdWVyeSdzICQucXVldWUoKSBiZWhhdmlvciwgdG8gZmlyZSB0aGUgZmlyc3Qgbm9uLWN1c3RvbS1xdWV1ZSBlbnRyeSBvbiBhbiBlbGVtZW50LCB0aGUgZWxlbWVudFxuXHQgICAgICAgICAgICAgICBtdXN0IGJlIGRlcXVldWVkIGlmIGl0cyBxdWV1ZSBzdGFjayBjb25zaXN0cyAqc29sZWx5KiBvZiB0aGUgY3VycmVudCBjYWxsLiAoVGhpcyBjYW4gYmUgZGV0ZXJtaW5lZCBieSBjaGVja2luZ1xuXHQgICAgICAgICAgICAgICBmb3IgdGhlIFwiaW5wcm9ncmVzc1wiIGl0ZW0gdGhhdCBqUXVlcnkgcHJlcGVuZHMgdG8gYWN0aXZlIHF1ZXVlIHN0YWNrIGFycmF5cy4pIFJlZ2FyZGxlc3MsIHdoZW5ldmVyIHRoZSBlbGVtZW50J3Ncblx0ICAgICAgICAgICAgICAgcXVldWUgaXMgZnVydGhlciBhcHBlbmRlZCB3aXRoIGFkZGl0aW9uYWwgaXRlbXMgLS0gaW5jbHVkaW5nICQuZGVsYXkoKSdzIG9yIGV2ZW4gJC5hbmltYXRlKCkgY2FsbHMsIHRoZSBxdWV1ZSdzXG5cdCAgICAgICAgICAgICAgIGZpcnN0IGVudHJ5IGlzIGF1dG9tYXRpY2FsbHkgZmlyZWQuIFRoaXMgYmVoYXZpb3IgY29udHJhc3RzIHRoYXQgb2YgY3VzdG9tIHF1ZXVlcywgd2hpY2ggbmV2ZXIgYXV0by1maXJlLiAqL1xuXHQgICAgICAgICAgICAvKiBOb3RlOiBXaGVuIGFuIGVsZW1lbnQgc2V0IGlzIGJlaW5nIHN1YmplY3RlZCB0byBhIG5vbi1wYXJhbGxlbCBWZWxvY2l0eSBjYWxsLCB0aGUgYW5pbWF0aW9uIHdpbGwgbm90IGJlZ2luIHVudGlsXG5cdCAgICAgICAgICAgICAgIGVhY2ggb25lIG9mIHRoZSBlbGVtZW50cyBpbiB0aGUgc2V0IGhhcyByZWFjaGVkIHRoZSBlbmQgb2YgaXRzIGluZGl2aWR1YWxseSBwcmUtZXhpc3RpbmcgcXVldWUgY2hhaW4uICovXG5cdCAgICAgICAgICAgIC8qIE5vdGU6IFVuZm9ydHVuYXRlbHksIG1vc3QgcGVvcGxlIGRvbid0IGZ1bGx5IGdyYXNwIGpRdWVyeSdzIHBvd2VyZnVsLCB5ZXQgcXVpcmt5LCAkLnF1ZXVlKCkgZnVuY3Rpb24uXG5cdCAgICAgICAgICAgICAgIExlYW4gbW9yZSBoZXJlOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwNTgxNTgvY2FuLXNvbWVib2R5LWV4cGxhaW4tanF1ZXJ5LXF1ZXVlLXRvLW1lICovXG5cdCAgICAgICAgICAgIGlmICgob3B0cy5xdWV1ZSA9PT0gXCJcIiB8fCBvcHRzLnF1ZXVlID09PSBcImZ4XCIpICYmICQucXVldWUoZWxlbWVudClbMF0gIT09IFwiaW5wcm9ncmVzc1wiKSB7XG5cdCAgICAgICAgICAgICAgICAkLmRlcXVldWUoZWxlbWVudCk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICBFbGVtZW50IFNldCBJdGVyYXRpb25cblx0ICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgIC8qIElmIHRoZSBcIm5vZGVUeXBlXCIgcHJvcGVydHkgZXhpc3RzIG9uIHRoZSBlbGVtZW50cyB2YXJpYWJsZSwgd2UncmUgYW5pbWF0aW5nIGEgc2luZ2xlIGVsZW1lbnQuXG5cdCAgICAgICAgICAgUGxhY2UgaXQgaW4gYW4gYXJyYXkgc28gdGhhdCAkLmVhY2goKSBjYW4gaXRlcmF0ZSBvdmVyIGl0LiAqL1xuXHQgICAgICAgICQuZWFjaChlbGVtZW50cywgZnVuY3Rpb24oaSwgZWxlbWVudCkge1xuXHQgICAgICAgICAgICAvKiBFbnN1cmUgZWFjaCBlbGVtZW50IGluIGEgc2V0IGhhcyBhIG5vZGVUeXBlIChpcyBhIHJlYWwgZWxlbWVudCkgdG8gYXZvaWQgdGhyb3dpbmcgZXJyb3JzLiAqL1xuXHQgICAgICAgICAgICBpZiAoVHlwZS5pc05vZGUoZWxlbWVudCkpIHtcblx0ICAgICAgICAgICAgICAgIHByb2Nlc3NFbGVtZW50LmNhbGwoZWxlbWVudCk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIC8qKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICBPcHRpb246IExvb3Bcblx0ICAgICAgICAqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAvKiBUaGUgbG9vcCBvcHRpb24gYWNjZXB0cyBhbiBpbnRlZ2VyIGluZGljYXRpbmcgaG93IG1hbnkgdGltZXMgdGhlIGVsZW1lbnQgc2hvdWxkIGxvb3AgYmV0d2VlbiB0aGUgdmFsdWVzIGluIHRoZVxuXHQgICAgICAgICAgIGN1cnJlbnQgY2FsbCdzIHByb3BlcnRpZXMgbWFwIGFuZCB0aGUgZWxlbWVudCdzIHByb3BlcnR5IHZhbHVlcyBwcmlvciB0byB0aGlzIGNhbGwuICovXG5cdCAgICAgICAgLyogTm90ZTogVGhlIGxvb3Agb3B0aW9uJ3MgbG9naWMgaXMgcGVyZm9ybWVkIGhlcmUgLS0gYWZ0ZXIgZWxlbWVudCBwcm9jZXNzaW5nIC0tIGJlY2F1c2UgdGhlIGN1cnJlbnQgY2FsbCBuZWVkc1xuXHQgICAgICAgICAgIHRvIHVuZGVyZ28gaXRzIHF1ZXVlIGluc2VydGlvbiBwcmlvciB0byB0aGUgbG9vcCBvcHRpb24gZ2VuZXJhdGluZyBpdHMgc2VyaWVzIG9mIGNvbnN0aXR1ZW50IFwicmV2ZXJzZVwiIGNhbGxzLFxuXHQgICAgICAgICAgIHdoaWNoIGNoYWluIGFmdGVyIHRoZSBjdXJyZW50IGNhbGwuIFR3byByZXZlcnNlIGNhbGxzICh0d28gXCJhbHRlcm5hdGlvbnNcIikgY29uc3RpdHV0ZSBvbmUgbG9vcC4gKi9cblx0ICAgICAgICB2YXIgb3B0cyA9ICQuZXh0ZW5kKHt9LCBWZWxvY2l0eS5kZWZhdWx0cywgb3B0aW9ucyksXG5cdCAgICAgICAgICAgIHJldmVyc2VDYWxsc0NvdW50O1xuXG5cdCAgICAgICAgb3B0cy5sb29wID0gcGFyc2VJbnQob3B0cy5sb29wKTtcblx0ICAgICAgICByZXZlcnNlQ2FsbHNDb3VudCA9IChvcHRzLmxvb3AgKiAyKSAtIDE7XG5cblx0ICAgICAgICBpZiAob3B0cy5sb29wKSB7XG5cdCAgICAgICAgICAgIC8qIERvdWJsZSB0aGUgbG9vcCBjb3VudCB0byBjb252ZXJ0IGl0IGludG8gaXRzIGFwcHJvcHJpYXRlIG51bWJlciBvZiBcInJldmVyc2VcIiBjYWxscy5cblx0ICAgICAgICAgICAgICAgU3VidHJhY3QgMSBmcm9tIHRoZSByZXN1bHRpbmcgdmFsdWUgc2luY2UgdGhlIGN1cnJlbnQgY2FsbCBpcyBpbmNsdWRlZCBpbiB0aGUgdG90YWwgYWx0ZXJuYXRpb24gY291bnQuICovXG5cdCAgICAgICAgICAgIGZvciAodmFyIHggPSAwOyB4IDwgcmV2ZXJzZUNhbGxzQ291bnQ7IHgrKykge1xuXHQgICAgICAgICAgICAgICAgLyogU2luY2UgdGhlIGxvZ2ljIGZvciB0aGUgcmV2ZXJzZSBhY3Rpb24gb2NjdXJzIGluc2lkZSBRdWV1ZWluZyBhbmQgdGhlcmVmb3JlIHRoaXMgY2FsbCdzIG9wdGlvbnMgb2JqZWN0XG5cdCAgICAgICAgICAgICAgICAgICBpc24ndCBwYXJzZWQgdW50aWwgdGhlbiBhcyB3ZWxsLCB0aGUgY3VycmVudCBjYWxsJ3MgZGVsYXkgb3B0aW9uIG11c3QgYmUgZXhwbGljaXRseSBwYXNzZWQgaW50byB0aGUgcmV2ZXJzZVxuXHQgICAgICAgICAgICAgICAgICAgY2FsbCBzbyB0aGF0IHRoZSBkZWxheSBsb2dpYyB0aGF0IG9jY3VycyBpbnNpZGUgKlByZS1RdWV1ZWluZyogY2FuIHByb2Nlc3MgaXQuICovXG5cdCAgICAgICAgICAgICAgICB2YXIgcmV2ZXJzZU9wdGlvbnMgPSB7XG5cdCAgICAgICAgICAgICAgICAgICAgZGVsYXk6IG9wdHMuZGVsYXksXG5cdCAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3M6IG9wdHMucHJvZ3Jlc3Ncblx0ICAgICAgICAgICAgICAgIH07XG5cblx0ICAgICAgICAgICAgICAgIC8qIElmIGEgY29tcGxldGUgY2FsbGJhY2sgd2FzIHBhc3NlZCBpbnRvIHRoaXMgY2FsbCwgdHJhbnNmZXIgaXQgdG8gdGhlIGxvb3AgcmVkaXJlY3QncyBmaW5hbCBcInJldmVyc2VcIiBjYWxsXG5cdCAgICAgICAgICAgICAgICAgICBzbyB0aGF0IGl0J3MgdHJpZ2dlcmVkIHdoZW4gdGhlIGVudGlyZSByZWRpcmVjdCBpcyBjb21wbGV0ZSAoYW5kIG5vdCB3aGVuIHRoZSB2ZXJ5IGZpcnN0IGFuaW1hdGlvbiBpcyBjb21wbGV0ZSkuICovXG5cdCAgICAgICAgICAgICAgICBpZiAoeCA9PT0gcmV2ZXJzZUNhbGxzQ291bnQgLSAxKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV2ZXJzZU9wdGlvbnMuZGlzcGxheSA9IG9wdHMuZGlzcGxheTtcblx0ICAgICAgICAgICAgICAgICAgICByZXZlcnNlT3B0aW9ucy52aXNpYmlsaXR5ID0gb3B0cy52aXNpYmlsaXR5O1xuXHQgICAgICAgICAgICAgICAgICAgIHJldmVyc2VPcHRpb25zLmNvbXBsZXRlID0gb3B0cy5jb21wbGV0ZTtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgYW5pbWF0ZShlbGVtZW50cywgXCJyZXZlcnNlXCIsIHJldmVyc2VPcHRpb25zKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8qKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgQ2hhaW5pbmdcblx0ICAgICAgICAqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAvKiBSZXR1cm4gdGhlIGVsZW1lbnRzIGJhY2sgdG8gdGhlIGNhbGwgY2hhaW4sIHdpdGggd3JhcHBlZCBlbGVtZW50cyB0YWtpbmcgcHJlY2VkZW5jZSBpbiBjYXNlIFZlbG9jaXR5IHdhcyBjYWxsZWQgdmlhIHRoZSAkLmZuLiBleHRlbnNpb24uICovXG5cdCAgICAgICAgcmV0dXJuIGdldENoYWluKCk7XG5cdCAgICB9O1xuXG5cdCAgICAvKiBUdXJuIFZlbG9jaXR5IGludG8gdGhlIGFuaW1hdGlvbiBmdW5jdGlvbiwgZXh0ZW5kZWQgd2l0aCB0aGUgcHJlLWV4aXN0aW5nIFZlbG9jaXR5IG9iamVjdC4gKi9cblx0ICAgIFZlbG9jaXR5ID0gJC5leHRlbmQoYW5pbWF0ZSwgVmVsb2NpdHkpO1xuXHQgICAgLyogRm9yIGxlZ2FjeSBzdXBwb3J0LCBhbHNvIGV4cG9zZSB0aGUgbGl0ZXJhbCBhbmltYXRlIG1ldGhvZC4gKi9cblx0ICAgIFZlbG9jaXR5LmFuaW1hdGUgPSBhbmltYXRlO1xuXG5cdCAgICAvKioqKioqKioqKioqKipcblx0ICAgICAgICBUaW1pbmdcblx0ICAgICoqKioqKioqKioqKioqL1xuXG5cdCAgICAvKiBUaWNrZXIgZnVuY3Rpb24uICovXG5cdCAgICB2YXIgdGlja2VyID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCByQUZTaGltO1xuXG5cdCAgICAvKiBJbmFjdGl2ZSBicm93c2VyIHRhYnMgcGF1c2UgckFGLCB3aGljaCByZXN1bHRzIGluIGFsbCBhY3RpdmUgYW5pbWF0aW9ucyBpbW1lZGlhdGVseSBzcHJpbnRpbmcgdG8gdGhlaXIgY29tcGxldGlvbiBzdGF0ZXMgd2hlbiB0aGUgdGFiIHJlZm9jdXNlcy5cblx0ICAgICAgIFRvIGdldCBhcm91bmQgdGhpcywgd2UgZHluYW1pY2FsbHkgc3dpdGNoIHJBRiB0byBzZXRUaW1lb3V0ICh3aGljaCB0aGUgYnJvd3NlciAqZG9lc24ndCogcGF1c2UpIHdoZW4gdGhlIHRhYiBsb3NlcyBmb2N1cy4gV2Ugc2tpcCB0aGlzIGZvciBtb2JpbGVcblx0ICAgICAgIGRldmljZXMgdG8gYXZvaWQgd2FzdGluZyBiYXR0ZXJ5IHBvd2VyIG9uIGluYWN0aXZlIHRhYnMuICovXG5cdCAgICAvKiBOb3RlOiBUYWIgZm9jdXMgZGV0ZWN0aW9uIGRvZXNuJ3Qgd29yayBvbiBvbGRlciB2ZXJzaW9ucyBvZiBJRSwgYnV0IHRoYXQncyBva2F5IHNpbmNlIHRoZXkgZG9uJ3Qgc3VwcG9ydCByQUYgdG8gYmVnaW4gd2l0aC4gKi9cblx0ICAgIGlmICghVmVsb2NpdHkuU3RhdGUuaXNNb2JpbGUgJiYgZG9jdW1lbnQuaGlkZGVuICE9PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwidmlzaWJpbGl0eWNoYW5nZVwiLCBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgLyogUmVhc3NpZ24gdGhlIHJBRiBmdW5jdGlvbiAod2hpY2ggdGhlIGdsb2JhbCB0aWNrKCkgZnVuY3Rpb24gdXNlcykgYmFzZWQgb24gdGhlIHRhYidzIGZvY3VzIHN0YXRlLiAqL1xuXHQgICAgICAgICAgICBpZiAoZG9jdW1lbnQuaGlkZGVuKSB7XG5cdCAgICAgICAgICAgICAgICB0aWNrZXIgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIFRoZSB0aWNrIGZ1bmN0aW9uIG5lZWRzIGEgdHJ1dGh5IGZpcnN0IGFyZ3VtZW50IGluIG9yZGVyIHRvIHBhc3MgaXRzIGludGVybmFsIHRpbWVzdGFtcCBjaGVjay4gKi9cblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2sodHJ1ZSkgfSwgMTYpO1xuXHQgICAgICAgICAgICAgICAgfTtcblxuXHQgICAgICAgICAgICAgICAgLyogVGhlIHJBRiBsb29wIGhhcyBiZWVuIHBhdXNlZCBieSB0aGUgYnJvd3Nlciwgc28gd2UgbWFudWFsbHkgcmVzdGFydCB0aGUgdGljay4gKi9cblx0ICAgICAgICAgICAgICAgIHRpY2soKTtcblx0ICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIHRpY2tlciA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgckFGU2hpbTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0pO1xuXHQgICAgfVxuXG5cdCAgICAvKioqKioqKioqKioqXG5cdCAgICAgICAgVGlja1xuXHQgICAgKioqKioqKioqKioqL1xuXG5cdCAgICAvKiBOb3RlOiBBbGwgY2FsbHMgdG8gVmVsb2NpdHkgYXJlIHB1c2hlZCB0byB0aGUgVmVsb2NpdHkuU3RhdGUuY2FsbHMgYXJyYXksIHdoaWNoIGlzIGZ1bGx5IGl0ZXJhdGVkIHRocm91Z2ggdXBvbiBlYWNoIHRpY2suICovXG5cdCAgICBmdW5jdGlvbiB0aWNrICh0aW1lc3RhbXApIHtcblx0ICAgICAgICAvKiBBbiBlbXB0eSB0aW1lc3RhbXAgYXJndW1lbnQgaW5kaWNhdGVzIHRoYXQgdGhpcyBpcyB0aGUgZmlyc3QgdGljayBvY2N1cmVuY2Ugc2luY2UgdGlja2luZyB3YXMgdHVybmVkIG9uLlxuXHQgICAgICAgICAgIFdlIGxldmVyYWdlIHRoaXMgbWV0YWRhdGEgdG8gZnVsbHkgaWdub3JlIHRoZSBmaXJzdCB0aWNrIHBhc3Mgc2luY2UgUkFGJ3MgaW5pdGlhbCBwYXNzIGlzIGZpcmVkIHdoZW5ldmVyXG5cdCAgICAgICAgICAgdGhlIGJyb3dzZXIncyBuZXh0IHRpY2sgc3luYyB0aW1lIG9jY3Vycywgd2hpY2ggcmVzdWx0cyBpbiB0aGUgZmlyc3QgZWxlbWVudHMgc3ViamVjdGVkIHRvIFZlbG9jaXR5XG5cdCAgICAgICAgICAgY2FsbHMgYmVpbmcgYW5pbWF0ZWQgb3V0IG9mIHN5bmMgd2l0aCBhbnkgZWxlbWVudHMgYW5pbWF0ZWQgaW1tZWRpYXRlbHkgdGhlcmVhZnRlci4gSW4gc2hvcnQsIHdlIGlnbm9yZVxuXHQgICAgICAgICAgIHRoZSBmaXJzdCBSQUYgdGljayBwYXNzIHNvIHRoYXQgZWxlbWVudHMgYmVpbmcgaW1tZWRpYXRlbHkgY29uc2VjdXRpdmVseSBhbmltYXRlZCAtLSBpbnN0ZWFkIG9mIHNpbXVsdGFuZW91c2x5IGFuaW1hdGVkXG5cdCAgICAgICAgICAgYnkgdGhlIHNhbWUgVmVsb2NpdHkgY2FsbCAtLSBhcmUgcHJvcGVybHkgYmF0Y2hlZCBpbnRvIHRoZSBzYW1lIGluaXRpYWwgUkFGIHRpY2sgYW5kIGNvbnNlcXVlbnRseSByZW1haW4gaW4gc3luYyB0aGVyZWFmdGVyLiAqL1xuXHQgICAgICAgIGlmICh0aW1lc3RhbXApIHtcblx0ICAgICAgICAgICAgLyogV2UgaWdub3JlIFJBRidzIGhpZ2ggcmVzb2x1dGlvbiB0aW1lc3RhbXAgc2luY2UgaXQgY2FuIGJlIHNpZ25pZmljYW50bHkgb2Zmc2V0IHdoZW4gdGhlIGJyb3dzZXIgaXNcblx0ICAgICAgICAgICAgICAgdW5kZXIgaGlnaCBzdHJlc3M7IHdlIG9wdCBmb3IgY2hvcHBpbmVzcyBvdmVyIGFsbG93aW5nIHRoZSBicm93c2VyIHRvIGRyb3AgaHVnZSBjaHVua3Mgb2YgZnJhbWVzLiAqL1xuXHQgICAgICAgICAgICB2YXIgdGltZUN1cnJlbnQgPSAobmV3IERhdGUpLmdldFRpbWUoKTtcblxuXHQgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgQ2FsbCBJdGVyYXRpb25cblx0ICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgdmFyIGNhbGxzTGVuZ3RoID0gVmVsb2NpdHkuU3RhdGUuY2FsbHMubGVuZ3RoO1xuXG5cdCAgICAgICAgICAgIC8qIFRvIHNwZWVkIHVwIGl0ZXJhdGluZyBvdmVyIHRoaXMgYXJyYXksIGl0IGlzIGNvbXBhY3RlZCAoZmFsc2V5IGl0ZW1zIC0tIGNhbGxzIHRoYXQgaGF2ZSBjb21wbGV0ZWQgLS0gYXJlIHJlbW92ZWQpXG5cdCAgICAgICAgICAgICAgIHdoZW4gaXRzIGxlbmd0aCBoYXMgYmFsbG9vbmVkIHRvIGEgcG9pbnQgdGhhdCBjYW4gaW1wYWN0IHRpY2sgcGVyZm9ybWFuY2UuIFRoaXMgb25seSBiZWNvbWVzIG5lY2Vzc2FyeSB3aGVuIGFuaW1hdGlvblxuXHQgICAgICAgICAgICAgICBoYXMgYmVlbiBjb250aW51b3VzIHdpdGggbWFueSBlbGVtZW50cyBvdmVyIGEgbG9uZyBwZXJpb2Qgb2YgdGltZTsgd2hlbmV2ZXIgYWxsIGFjdGl2ZSBjYWxscyBhcmUgY29tcGxldGVkLCBjb21wbGV0ZUNhbGwoKSBjbGVhcnMgVmVsb2NpdHkuU3RhdGUuY2FsbHMuICovXG5cdCAgICAgICAgICAgIGlmIChjYWxsc0xlbmd0aCA+IDEwMDAwKSB7XG5cdCAgICAgICAgICAgICAgICBWZWxvY2l0eS5TdGF0ZS5jYWxscyA9IGNvbXBhY3RTcGFyc2VBcnJheShWZWxvY2l0eS5TdGF0ZS5jYWxscyk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvKiBJdGVyYXRlIHRocm91Z2ggZWFjaCBhY3RpdmUgY2FsbC4gKi9cblx0ICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsc0xlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICAvKiBXaGVuIGEgVmVsb2NpdHkgY2FsbCBpcyBjb21wbGV0ZWQsIGl0cyBWZWxvY2l0eS5TdGF0ZS5jYWxscyBlbnRyeSBpcyBzZXQgdG8gZmFsc2UuIENvbnRpbnVlIG9uIHRvIHRoZSBuZXh0IGNhbGwuICovXG5cdCAgICAgICAgICAgICAgICBpZiAoIVZlbG9jaXR5LlN0YXRlLmNhbGxzW2ldKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgIENhbGwtV2lkZSBWYXJpYWJsZXNcblx0ICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgdmFyIGNhbGxDb250YWluZXIgPSBWZWxvY2l0eS5TdGF0ZS5jYWxsc1tpXSxcblx0ICAgICAgICAgICAgICAgICAgICBjYWxsID0gY2FsbENvbnRhaW5lclswXSxcblx0ICAgICAgICAgICAgICAgICAgICBvcHRzID0gY2FsbENvbnRhaW5lclsyXSxcblx0ICAgICAgICAgICAgICAgICAgICB0aW1lU3RhcnQgPSBjYWxsQ29udGFpbmVyWzNdLFxuXHQgICAgICAgICAgICAgICAgICAgIGZpcnN0VGljayA9ICEhdGltZVN0YXJ0LFxuXHQgICAgICAgICAgICAgICAgICAgIHR3ZWVuRHVtbXlWYWx1ZSA9IG51bGw7XG5cblx0ICAgICAgICAgICAgICAgIC8qIElmIHRpbWVTdGFydCBpcyB1bmRlZmluZWQsIHRoZW4gdGhpcyBpcyB0aGUgZmlyc3QgdGltZSB0aGF0IHRoaXMgY2FsbCBoYXMgYmVlbiBwcm9jZXNzZWQgYnkgdGljaygpLlxuXHQgICAgICAgICAgICAgICAgICAgV2UgYXNzaWduIHRpbWVTdGFydCBub3cgc28gdGhhdCBpdHMgdmFsdWUgaXMgYXMgY2xvc2UgdG8gdGhlIHJlYWwgYW5pbWF0aW9uIHN0YXJ0IHRpbWUgYXMgcG9zc2libGUuXG5cdCAgICAgICAgICAgICAgICAgICAoQ29udmVyc2VseSwgaGFkIHRpbWVTdGFydCBiZWVuIGRlZmluZWQgd2hlbiB0aGlzIGNhbGwgd2FzIGFkZGVkIHRvIFZlbG9jaXR5LlN0YXRlLmNhbGxzLCB0aGUgZGVsYXlcblx0ICAgICAgICAgICAgICAgICAgIGJldHdlZW4gdGhhdCB0aW1lIGFuZCBub3cgd291bGQgY2F1c2UgdGhlIGZpcnN0IGZldyBmcmFtZXMgb2YgdGhlIHR3ZWVuIHRvIGJlIHNraXBwZWQgc2luY2Vcblx0ICAgICAgICAgICAgICAgICAgIHBlcmNlbnRDb21wbGV0ZSBpcyBjYWxjdWxhdGVkIHJlbGF0aXZlIHRvIHRpbWVTdGFydC4pICovXG5cdCAgICAgICAgICAgICAgICAvKiBGdXJ0aGVyLCBzdWJ0cmFjdCAxNm1zICh0aGUgYXBwcm94aW1hdGUgcmVzb2x1dGlvbiBvZiBSQUYpIGZyb20gdGhlIGN1cnJlbnQgdGltZSB2YWx1ZSBzbyB0aGF0IHRoZVxuXHQgICAgICAgICAgICAgICAgICAgZmlyc3QgdGljayBpdGVyYXRpb24gaXNuJ3Qgd2FzdGVkIGJ5IGFuaW1hdGluZyBhdCAwJSB0d2VlbiBjb21wbGV0aW9uLCB3aGljaCB3b3VsZCBwcm9kdWNlIHRoZVxuXHQgICAgICAgICAgICAgICAgICAgc2FtZSBzdHlsZSB2YWx1ZSBhcyB0aGUgZWxlbWVudCdzIGN1cnJlbnQgdmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICBpZiAoIXRpbWVTdGFydCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHRpbWVTdGFydCA9IFZlbG9jaXR5LlN0YXRlLmNhbGxzW2ldWzNdID0gdGltZUN1cnJlbnQgLSAxNjtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgLyogVGhlIHR3ZWVuJ3MgY29tcGxldGlvbiBwZXJjZW50YWdlIGlzIHJlbGF0aXZlIHRvIHRoZSB0d2VlbidzIHN0YXJ0IHRpbWUsIG5vdCB0aGUgdHdlZW4ncyBzdGFydCB2YWx1ZVxuXHQgICAgICAgICAgICAgICAgICAgKHdoaWNoIHdvdWxkIHJlc3VsdCBpbiB1bnByZWRpY3RhYmxlIHR3ZWVuIGR1cmF0aW9ucyBzaW5jZSBKYXZhU2NyaXB0J3MgdGltZXJzIGFyZSBub3QgcGFydGljdWxhcmx5IGFjY3VyYXRlKS5cblx0ICAgICAgICAgICAgICAgICAgIEFjY29yZGluZ2x5LCB3ZSBlbnN1cmUgdGhhdCBwZXJjZW50Q29tcGxldGUgZG9lcyBub3QgZXhjZWVkIDEuICovXG5cdCAgICAgICAgICAgICAgICB2YXIgcGVyY2VudENvbXBsZXRlID0gTWF0aC5taW4oKHRpbWVDdXJyZW50IC0gdGltZVN0YXJ0KSAvIG9wdHMuZHVyYXRpb24sIDEpO1xuXG5cdCAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgRWxlbWVudCBJdGVyYXRpb25cblx0ICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgIC8qIEZvciBldmVyeSBjYWxsLCBpdGVyYXRlIHRocm91Z2ggZWFjaCBvZiB0aGUgZWxlbWVudHMgaW4gaXRzIHNldC4gKi9cblx0ICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwLCBjYWxsTGVuZ3RoID0gY2FsbC5sZW5ndGg7IGogPCBjYWxsTGVuZ3RoOyBqKyspIHtcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgdHdlZW5zQ29udGFpbmVyID0gY2FsbFtqXSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudCA9IHR3ZWVuc0NvbnRhaW5lci5lbGVtZW50O1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogQ2hlY2sgdG8gc2VlIGlmIHRoaXMgZWxlbWVudCBoYXMgYmVlbiBkZWxldGVkIG1pZHdheSB0aHJvdWdoIHRoZSBhbmltYXRpb24gYnkgY2hlY2tpbmcgZm9yIHRoZVxuXHQgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlZCBleGlzdGVuY2Ugb2YgaXRzIGRhdGEgY2FjaGUuIElmIGl0J3MgZ29uZSwgc2tpcCBhbmltYXRpbmcgdGhpcyBlbGVtZW50LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmICghRGF0YShlbGVtZW50KSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICB2YXIgdHJhbnNmb3JtUHJvcGVydHlFeGlzdHMgPSBmYWxzZTtcblxuXHQgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgICAgRGlzcGxheSAmIFZpc2liaWxpdHkgVG9nZ2xpbmdcblx0ICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGRpc3BsYXkgb3B0aW9uIGlzIHNldCB0byBub24tXCJub25lXCIsIHNldCBpdCB1cGZyb250IHNvIHRoYXQgdGhlIGVsZW1lbnQgY2FuIGJlY29tZSB2aXNpYmxlIGJlZm9yZSB0d2VlbmluZyBiZWdpbnMuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgKE90aGVyd2lzZSwgZGlzcGxheSdzIFwibm9uZVwiIHZhbHVlIGlzIHNldCBpbiBjb21wbGV0ZUNhbGwoKSBvbmNlIHRoZSBhbmltYXRpb24gaGFzIGNvbXBsZXRlZC4pICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMuZGlzcGxheSAhPT0gdW5kZWZpbmVkICYmIG9wdHMuZGlzcGxheSAhPT0gbnVsbCAmJiBvcHRzLmRpc3BsYXkgIT09IFwibm9uZVwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLmRpc3BsYXkgPT09IFwiZmxleFwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZmxleFZhbHVlcyA9IFsgXCItd2Via2l0LWJveFwiLCBcIi1tb3otYm94XCIsIFwiLW1zLWZsZXhib3hcIiwgXCItd2Via2l0LWZsZXhcIiBdO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2goZmxleFZhbHVlcywgZnVuY3Rpb24oaSwgZmxleFZhbHVlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ1NTLnNldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJkaXNwbGF5XCIsIGZsZXhWYWx1ZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIENTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiZGlzcGxheVwiLCBvcHRzLmRpc3BsYXkpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIFNhbWUgZ29lcyB3aXRoIHRoZSB2aXNpYmlsaXR5IG9wdGlvbiwgYnV0IGl0cyBcIm5vbmVcIiBlcXVpdmFsZW50IGlzIFwiaGlkZGVuXCIuICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMudmlzaWJpbGl0eSAhPT0gdW5kZWZpbmVkICYmIG9wdHMudmlzaWJpbGl0eSAhPT0gXCJoaWRkZW5cIikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBDU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcInZpc2liaWxpdHlcIiwgb3B0cy52aXNpYmlsaXR5KTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgICAgUHJvcGVydHkgSXRlcmF0aW9uXG5cdCAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogRm9yIGV2ZXJ5IGVsZW1lbnQsIGl0ZXJhdGUgdGhyb3VnaCBlYWNoIHByb3BlcnR5LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BlcnR5IGluIHR3ZWVuc0NvbnRhaW5lcikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBJbiBhZGRpdGlvbiB0byBwcm9wZXJ0eSB0d2VlbiBkYXRhLCB0d2VlbnNDb250YWluZXIgY29udGFpbnMgYSByZWZlcmVuY2UgdG8gaXRzIGFzc29jaWF0ZWQgZWxlbWVudC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5ICE9PSBcImVsZW1lbnRcIikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHR3ZWVuID0gdHdlZW5zQ29udGFpbmVyW3Byb3BlcnR5XSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWUsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRWFzaW5nIGNhbiBlaXRoZXIgYmUgYSBwcmUtZ2VuZXJlYXRlZCBmdW5jdGlvbiBvciBhIHN0cmluZyB0aGF0IHJlZmVyZW5jZXMgYSBwcmUtcmVnaXN0ZXJlZCBlYXNpbmdcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbiB0aGUgVmVsb2NpdHkuRWFzaW5ncyBvYmplY3QuIEluIGVpdGhlciBjYXNlLCByZXR1cm4gdGhlIGFwcHJvcHJpYXRlIGVhc2luZyAqZnVuY3Rpb24qLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVhc2luZyA9IFR5cGUuaXNTdHJpbmcodHdlZW4uZWFzaW5nKSA/IFZlbG9jaXR5LkVhc2luZ3NbdHdlZW4uZWFzaW5nXSA6IHR3ZWVuLmVhc2luZztcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ3VycmVudCBWYWx1ZSBDYWxjdWxhdGlvblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGlzIGlzIHRoZSBsYXN0IHRpY2sgcGFzcyAoaWYgd2UndmUgcmVhY2hlZCAxMDAlIGNvbXBsZXRpb24gZm9yIHRoaXMgdHdlZW4pLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5zdXJlIHRoYXQgY3VycmVudFZhbHVlIGlzIGV4cGxpY2l0bHkgc2V0IHRvIGl0cyB0YXJnZXQgZW5kVmFsdWUgc28gdGhhdCBpdCdzIG5vdCBzdWJqZWN0ZWQgdG8gYW55IHJvdW5kaW5nLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBlcmNlbnRDb21wbGV0ZSA9PT0gMSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWYWx1ZSA9IHR3ZWVuLmVuZFZhbHVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogT3RoZXJ3aXNlLCBjYWxjdWxhdGUgY3VycmVudFZhbHVlIGJhc2VkIG9uIHRoZSBjdXJyZW50IGRlbHRhIGZyb20gc3RhcnRWYWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHR3ZWVuRGVsdGEgPSB0d2Vlbi5lbmRWYWx1ZSAtIHR3ZWVuLnN0YXJ0VmFsdWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFZhbHVlID0gdHdlZW4uc3RhcnRWYWx1ZSArICh0d2VlbkRlbHRhICogZWFzaW5nKHBlcmNlbnRDb21wbGV0ZSwgb3B0cywgdHdlZW5EZWx0YSkpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgbm8gdmFsdWUgY2hhbmdlIGlzIG9jY3VycmluZywgZG9uJ3QgcHJvY2VlZCB3aXRoIERPTSB1cGRhdGluZy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWZpcnN0VGljayAmJiAoY3VycmVudFZhbHVlID09PSB0d2Vlbi5jdXJyZW50VmFsdWUpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW4uY3VycmVudFZhbHVlID0gY3VycmVudFZhbHVlO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB3ZSdyZSB0d2VlbmluZyBhIGZha2UgJ3R3ZWVuJyBwcm9wZXJ0eSBpbiBvcmRlciB0byBsb2cgdHJhbnNpdGlvbiB2YWx1ZXMsIHVwZGF0ZSB0aGUgb25lLXBlci1jYWxsIHZhcmlhYmxlIHNvIHRoYXRcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0IGNhbiBiZSBwYXNzZWQgaW50byB0aGUgcHJvZ3Jlc3MgY2FsbGJhY2suICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydHkgPT09IFwidHdlZW5cIikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuRHVtbXlWYWx1ZSA9IGN1cnJlbnRWYWx1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEhvb2tzOiBQYXJ0IElcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBGb3IgaG9va2VkIHByb3BlcnRpZXMsIHRoZSBuZXdseS11cGRhdGVkIHJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGUgaXMgY2FjaGVkIG9udG8gdGhlIGVsZW1lbnQgc28gdGhhdCBpdCBjYW4gYmUgdXNlZFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciBzdWJzZXF1ZW50IGhvb2tzIGluIHRoaXMgY2FsbCB0aGF0IGFyZSBhc3NvY2lhdGVkIHdpdGggdGhlIHNhbWUgcm9vdCBwcm9wZXJ0eS4gSWYgd2UgZGlkbid0IGNhY2hlIHRoZSB1cGRhdGVkXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWUsIGVhY2ggc3Vic2VxdWVudCB1cGRhdGUgdG8gdGhlIHJvb3QgcHJvcGVydHkgaW4gdGhpcyB0aWNrIHBhc3Mgd291bGQgcmVzZXQgdGhlIHByZXZpb3VzIGhvb2snc1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZXMgdG8gcm9vdFByb3BlcnR5VmFsdWUgcHJpb3IgdG8gaW5qZWN0aW9uLiBBIG5pY2UgcGVyZm9ybWFuY2UgYnlwcm9kdWN0IG9mIHJvb3RQcm9wZXJ0eVZhbHVlIGNhY2hpbmcgaXMgdGhhdFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNlcXVlbnRseSBjaGFpbmVkIGFuaW1hdGlvbnMgdXNpbmcgdGhlIHNhbWUgaG9va1Jvb3QgYnV0IGEgZGlmZmVyZW50IGhvb2sgY2FuIHVzZSB0aGlzIGNhY2hlZCByb290UHJvcGVydHlWYWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbcHJvcGVydHldKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBob29rUm9vdCA9IENTUy5Ib29rcy5nZXRSb290KHByb3BlcnR5KSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGUgPSBEYXRhKGVsZW1lbnQpLnJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGVbaG9va1Jvb3RdO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyb290UHJvcGVydHlWYWx1ZUNhY2hlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0d2Vlbi5yb290UHJvcGVydHlWYWx1ZSA9IHJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRE9NIFVwZGF0ZVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogc2V0UHJvcGVydHlWYWx1ZSgpIHJldHVybnMgYW4gYXJyYXkgb2YgdGhlIHByb3BlcnR5IG5hbWUgYW5kIHByb3BlcnR5IHZhbHVlIHBvc3QgYW55IG5vcm1hbGl6YXRpb24gdGhhdCBtYXkgaGF2ZSBiZWVuIHBlcmZvcm1lZC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBUbyBzb2x2ZSBhbiBJRTw9OCBwb3NpdGlvbmluZyBidWcsIHRoZSB1bml0IHR5cGUgaXMgZHJvcHBlZCB3aGVuIHNldHRpbmcgYSBwcm9wZXJ0eSB2YWx1ZSBvZiAwLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhZGp1c3RlZFNldERhdGEgPSBDU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCAvKiBTRVQgKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHksXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuLmN1cnJlbnRWYWx1ZSArIChwYXJzZUZsb2F0KGN1cnJlbnRWYWx1ZSkgPT09IDAgPyBcIlwiIDogdHdlZW4udW5pdFR5cGUpLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0d2Vlbi5yb290UHJvcGVydHlWYWx1ZSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW4uc2Nyb2xsRGF0YSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEhvb2tzOiBQYXJ0IElJXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdyB0aGF0IHdlIGhhdmUgdGhlIGhvb2sncyB1cGRhdGVkIHJvb3RQcm9wZXJ0eVZhbHVlICh0aGUgcG9zdC1wcm9jZXNzZWQgdmFsdWUgcHJvdmlkZWQgYnkgYWRqdXN0ZWRTZXREYXRhKSwgY2FjaGUgaXQgb250byB0aGUgZWxlbWVudC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbcHJvcGVydHldKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFNpbmNlIGFkanVzdGVkU2V0RGF0YSBjb250YWlucyBub3JtYWxpemVkIGRhdGEgcmVhZHkgZm9yIERPTSB1cGRhdGluZywgdGhlIHJvb3RQcm9wZXJ0eVZhbHVlIG5lZWRzIHRvIGJlIHJlLWV4dHJhY3RlZCBmcm9tIGl0cyBub3JtYWxpemVkIGZvcm0uID8/ICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtob29rUm9vdF0pIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkucm9vdFByb3BlcnR5VmFsdWVDYWNoZVtob29rUm9vdF0gPSBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtob29rUm9vdF0oXCJleHRyYWN0XCIsIG51bGwsIGFkanVzdGVkU2V0RGF0YVsxXSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLnJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGVbaG9va1Jvb3RdID0gYWRqdXN0ZWRTZXREYXRhWzFdO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRyYW5zZm9ybXNcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBGbGFnIHdoZXRoZXIgYSB0cmFuc2Zvcm0gcHJvcGVydHkgaXMgYmVpbmcgYW5pbWF0ZWQgc28gdGhhdCBmbHVzaFRyYW5zZm9ybUNhY2hlKCkgY2FuIGJlIHRyaWdnZXJlZCBvbmNlIHRoaXMgdGljayBwYXNzIGlzIGNvbXBsZXRlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhZGp1c3RlZFNldERhdGFbMF0gPT09IFwidHJhbnNmb3JtXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUHJvcGVydHlFeGlzdHMgPSB0cnVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICAgICAgbW9iaWxlSEFcblx0ICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogSWYgbW9iaWxlSEEgaXMgZW5hYmxlZCwgc2V0IHRoZSB0cmFuc2xhdGUzZCB0cmFuc2Zvcm0gdG8gbnVsbCB0byBmb3JjZSBoYXJkd2FyZSBhY2NlbGVyYXRpb24uXG5cdCAgICAgICAgICAgICAgICAgICAgICAgSXQncyBzYWZlIHRvIG92ZXJyaWRlIHRoaXMgcHJvcGVydHkgc2luY2UgVmVsb2NpdHkgZG9lc24ndCBhY3R1YWxseSBzdXBwb3J0IGl0cyBhbmltYXRpb24gKGhvb2tzIGFyZSB1c2VkIGluIGl0cyBwbGFjZSkuICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMubW9iaWxlSEEpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogRG9uJ3Qgc2V0IHRoZSBudWxsIHRyYW5zZm9ybSBoYWNrIGlmIHdlJ3ZlIGFscmVhZHkgZG9uZSBzby4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGUudHJhbnNsYXRlM2QgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQWxsIGVudHJpZXMgb24gdGhlIHRyYW5zZm9ybUNhY2hlIG9iamVjdCBhcmUgbGF0ZXIgY29uY2F0ZW5hdGVkIGludG8gYSBzaW5nbGUgdHJhbnNmb3JtIHN0cmluZyB2aWEgZmx1c2hUcmFuc2Zvcm1DYWNoZSgpLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZS50cmFuc2xhdGUzZCA9IFwiKDBweCwgMHB4LCAwcHgpXCI7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVByb3BlcnR5RXhpc3RzID0gdHJ1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIGlmICh0cmFuc2Zvcm1Qcm9wZXJ0eUV4aXN0cykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBDU1MuZmx1c2hUcmFuc2Zvcm1DYWNoZShlbGVtZW50KTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIC8qIFRoZSBub24tXCJub25lXCIgZGlzcGxheSB2YWx1ZSBpcyBvbmx5IGFwcGxpZWQgdG8gYW4gZWxlbWVudCBvbmNlIC0tIHdoZW4gaXRzIGFzc29jaWF0ZWQgY2FsbCBpcyBmaXJzdCB0aWNrZWQgdGhyb3VnaC5cblx0ICAgICAgICAgICAgICAgICAgIEFjY29yZGluZ2x5LCBpdCdzIHNldCB0byBmYWxzZSBzbyB0aGF0IGl0IGlzbid0IHJlLXByb2Nlc3NlZCBieSB0aGlzIGNhbGwgaW4gdGhlIG5leHQgdGljay4gKi9cblx0ICAgICAgICAgICAgICAgIGlmIChvcHRzLmRpc3BsYXkgIT09IHVuZGVmaW5lZCAmJiBvcHRzLmRpc3BsYXkgIT09IFwibm9uZVwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuU3RhdGUuY2FsbHNbaV1bMl0uZGlzcGxheSA9IGZhbHNlO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgaWYgKG9wdHMudmlzaWJpbGl0eSAhPT0gdW5kZWZpbmVkICYmIG9wdHMudmlzaWJpbGl0eSAhPT0gXCJoaWRkZW5cIikge1xuXHQgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LlN0YXRlLmNhbGxzW2ldWzJdLnZpc2liaWxpdHkgPSBmYWxzZTtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgLyogUGFzcyB0aGUgZWxlbWVudHMgYW5kIHRoZSB0aW1pbmcgZGF0YSAocGVyY2VudENvbXBsZXRlLCBtc1JlbWFpbmluZywgdGltZVN0YXJ0LCB0d2VlbkR1bW15VmFsdWUpIGludG8gdGhlIHByb2dyZXNzIGNhbGxiYWNrLiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKG9wdHMucHJvZ3Jlc3MpIHtcblx0ICAgICAgICAgICAgICAgICAgICBvcHRzLnByb2dyZXNzLmNhbGwoY2FsbENvbnRhaW5lclsxXSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbENvbnRhaW5lclsxXSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGVyY2VudENvbXBsZXRlLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNYXRoLm1heCgwLCAodGltZVN0YXJ0ICsgb3B0cy5kdXJhdGlvbikgLSB0aW1lQ3VycmVudCksXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVTdGFydCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW5EdW1teVZhbHVlKTtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgLyogSWYgdGhpcyBjYWxsIGhhcyBmaW5pc2hlZCB0d2VlbmluZywgcGFzcyBpdHMgaW5kZXggdG8gY29tcGxldGVDYWxsKCkgdG8gaGFuZGxlIGNhbGwgY2xlYW51cC4gKi9cblx0ICAgICAgICAgICAgICAgIGlmIChwZXJjZW50Q29tcGxldGUgPT09IDEpIHtcblx0ICAgICAgICAgICAgICAgICAgICBjb21wbGV0ZUNhbGwoaSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvKiBOb3RlOiBjb21wbGV0ZUNhbGwoKSBzZXRzIHRoZSBpc1RpY2tpbmcgZmxhZyB0byBmYWxzZSB3aGVuIHRoZSBsYXN0IGNhbGwgb24gVmVsb2NpdHkuU3RhdGUuY2FsbHMgaGFzIGNvbXBsZXRlZC4gKi9cblx0ICAgICAgICBpZiAoVmVsb2NpdHkuU3RhdGUuaXNUaWNraW5nKSB7XG5cdCAgICAgICAgICAgIHRpY2tlcih0aWNrKTtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIC8qKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgQ2FsbCBDb21wbGV0aW9uXG5cdCAgICAqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAvKiBOb3RlOiBVbmxpa2UgdGljaygpLCB3aGljaCBwcm9jZXNzZXMgYWxsIGFjdGl2ZSBjYWxscyBhdCBvbmNlLCBjYWxsIGNvbXBsZXRpb24gaXMgaGFuZGxlZCBvbiBhIHBlci1jYWxsIGJhc2lzLiAqL1xuXHQgICAgZnVuY3Rpb24gY29tcGxldGVDYWxsIChjYWxsSW5kZXgsIGlzU3RvcHBlZCkge1xuXHQgICAgICAgIC8qIEVuc3VyZSB0aGUgY2FsbCBleGlzdHMuICovXG5cdCAgICAgICAgaWYgKCFWZWxvY2l0eS5TdGF0ZS5jYWxsc1tjYWxsSW5kZXhdKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvKiBQdWxsIHRoZSBtZXRhZGF0YSBmcm9tIHRoZSBjYWxsLiAqL1xuXHQgICAgICAgIHZhciBjYWxsID0gVmVsb2NpdHkuU3RhdGUuY2FsbHNbY2FsbEluZGV4XVswXSxcblx0ICAgICAgICAgICAgZWxlbWVudHMgPSBWZWxvY2l0eS5TdGF0ZS5jYWxsc1tjYWxsSW5kZXhdWzFdLFxuXHQgICAgICAgICAgICBvcHRzID0gVmVsb2NpdHkuU3RhdGUuY2FsbHNbY2FsbEluZGV4XVsyXSxcblx0ICAgICAgICAgICAgcmVzb2x2ZXIgPSBWZWxvY2l0eS5TdGF0ZS5jYWxsc1tjYWxsSW5kZXhdWzRdO1xuXG5cdCAgICAgICAgdmFyIHJlbWFpbmluZ0NhbGxzRXhpc3QgPSBmYWxzZTtcblxuXHQgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgRWxlbWVudCBGaW5hbGl6YXRpb25cblx0ICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgZm9yICh2YXIgaSA9IDAsIGNhbGxMZW5ndGggPSBjYWxsLmxlbmd0aDsgaSA8IGNhbGxMZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICB2YXIgZWxlbWVudCA9IGNhbGxbaV0uZWxlbWVudDtcblxuXHQgICAgICAgICAgICAvKiBJZiB0aGUgdXNlciBzZXQgZGlzcGxheSB0byBcIm5vbmVcIiAoaW50ZW5kaW5nIHRvIGhpZGUgdGhlIGVsZW1lbnQpLCBzZXQgaXQgbm93IHRoYXQgdGhlIGFuaW1hdGlvbiBoYXMgY29tcGxldGVkLiAqL1xuXHQgICAgICAgICAgICAvKiBOb3RlOiBkaXNwbGF5Om5vbmUgaXNuJ3Qgc2V0IHdoZW4gY2FsbHMgYXJlIG1hbnVhbGx5IHN0b3BwZWQgKHZpYSBWZWxvY2l0eShcInN0b3BcIikuICovXG5cdCAgICAgICAgICAgIC8qIE5vdGU6IERpc3BsYXkgZ2V0cyBpZ25vcmVkIHdpdGggXCJyZXZlcnNlXCIgY2FsbHMgYW5kIGluZmluaXRlIGxvb3BzLCBzaW5jZSB0aGlzIGJlaGF2aW9yIHdvdWxkIGJlIHVuZGVzaXJhYmxlLiAqL1xuXHQgICAgICAgICAgICBpZiAoIWlzU3RvcHBlZCAmJiAhb3B0cy5sb29wKSB7XG5cdCAgICAgICAgICAgICAgICBpZiAob3B0cy5kaXNwbGF5ID09PSBcIm5vbmVcIikge1xuXHQgICAgICAgICAgICAgICAgICAgIENTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiZGlzcGxheVwiLCBvcHRzLmRpc3BsYXkpO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICBpZiAob3B0cy52aXNpYmlsaXR5ID09PSBcImhpZGRlblwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgQ1NTLnNldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJ2aXNpYmlsaXR5XCIsIG9wdHMudmlzaWJpbGl0eSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvKiBJZiB0aGUgZWxlbWVudCdzIHF1ZXVlIGlzIGVtcHR5IChpZiBvbmx5IHRoZSBcImlucHJvZ3Jlc3NcIiBpdGVtIGlzIGxlZnQgYXQgcG9zaXRpb24gMCkgb3IgaWYgaXRzIHF1ZXVlIGlzIGFib3V0IHRvIHJ1blxuXHQgICAgICAgICAgICAgICBhIG5vbi1WZWxvY2l0eS1pbml0aWF0ZWQgZW50cnksIHR1cm4gb2ZmIHRoZSBpc0FuaW1hdGluZyBmbGFnLiBBIG5vbi1WZWxvY2l0eS1pbml0aWF0aWVkIHF1ZXVlIGVudHJ5J3MgbG9naWMgbWlnaHQgYWx0ZXJcblx0ICAgICAgICAgICAgICAgYW4gZWxlbWVudCdzIENTUyB2YWx1ZXMgYW5kIHRoZXJlYnkgY2F1c2UgVmVsb2NpdHkncyBjYWNoZWQgdmFsdWUgZGF0YSB0byBnbyBzdGFsZS4gVG8gZGV0ZWN0IGlmIGEgcXVldWUgZW50cnkgd2FzIGluaXRpYXRlZCBieSBWZWxvY2l0eSxcblx0ICAgICAgICAgICAgICAgd2UgY2hlY2sgZm9yIHRoZSBleGlzdGVuY2Ugb2Ygb3VyIHNwZWNpYWwgVmVsb2NpdHkucXVldWVFbnRyeUZsYWcgZGVjbGFyYXRpb24sIHdoaWNoIG1pbmlmaWVycyB3b24ndCByZW5hbWUgc2luY2UgdGhlIGZsYWdcblx0ICAgICAgICAgICAgICAgaXMgYXNzaWduZWQgdG8galF1ZXJ5J3MgZ2xvYmFsICQgb2JqZWN0IGFuZCB0aHVzIGV4aXN0cyBvdXQgb2YgVmVsb2NpdHkncyBvd24gc2NvcGUuICovXG5cdCAgICAgICAgICAgIGlmIChvcHRzLmxvb3AgIT09IHRydWUgJiYgKCQucXVldWUoZWxlbWVudClbMV0gPT09IHVuZGVmaW5lZCB8fCAhL1xcLnZlbG9jaXR5UXVldWVFbnRyeUZsYWcvaS50ZXN0KCQucXVldWUoZWxlbWVudClbMV0pKSkge1xuXHQgICAgICAgICAgICAgICAgLyogVGhlIGVsZW1lbnQgbWF5IGhhdmUgYmVlbiBkZWxldGVkLiBFbnN1cmUgdGhhdCBpdHMgZGF0YSBjYWNoZSBzdGlsbCBleGlzdHMgYmVmb3JlIGFjdGluZyBvbiBpdC4gKi9cblx0ICAgICAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5pc0FuaW1hdGluZyA9IGZhbHNlO1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIENsZWFyIHRoZSBlbGVtZW50J3Mgcm9vdFByb3BlcnR5VmFsdWVDYWNoZSwgd2hpY2ggd2lsbCBiZWNvbWUgc3RhbGUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5yb290UHJvcGVydHlWYWx1ZUNhY2hlID0ge307XG5cblx0ICAgICAgICAgICAgICAgICAgICB2YXIgdHJhbnNmb3JtSEFQcm9wZXJ0eUV4aXN0cyA9IGZhbHNlO1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIElmIGFueSAzRCB0cmFuc2Zvcm0gc3VicHJvcGVydHkgaXMgYXQgaXRzIGRlZmF1bHQgdmFsdWUgKHJlZ2FyZGxlc3Mgb2YgdW5pdCB0eXBlKSwgcmVtb3ZlIGl0LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICQuZWFjaChDU1MuTGlzdHMudHJhbnNmb3JtczNELCBmdW5jdGlvbihpLCB0cmFuc2Zvcm1OYW1lKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkZWZhdWx0VmFsdWUgPSAvXnNjYWxlLy50ZXN0KHRyYW5zZm9ybU5hbWUpID8gMSA6IDAsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWUgPSBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlW3RyYW5zZm9ybU5hbWVdO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlW3RyYW5zZm9ybU5hbWVdICE9PSB1bmRlZmluZWQgJiYgbmV3IFJlZ0V4cChcIl5cXFxcKFwiICsgZGVmYXVsdFZhbHVlICsgXCJbXi5dXCIpLnRlc3QoY3VycmVudFZhbHVlKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtSEFQcm9wZXJ0eUV4aXN0cyA9IHRydWU7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlW3RyYW5zZm9ybU5hbWVdO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgfSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBNb2JpbGUgZGV2aWNlcyBoYXZlIGhhcmR3YXJlIGFjY2VsZXJhdGlvbiByZW1vdmVkIGF0IHRoZSBlbmQgb2YgdGhlIGFuaW1hdGlvbiBpbiBvcmRlciB0byBhdm9pZCBob2dnaW5nIHRoZSBHUFUncyBtZW1vcnkuICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMubW9iaWxlSEEpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtSEFQcm9wZXJ0eUV4aXN0cyA9IHRydWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlLnRyYW5zbGF0ZTNkO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIEZsdXNoIHRoZSBzdWJwcm9wZXJ0eSByZW1vdmFscyB0byB0aGUgRE9NLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmICh0cmFuc2Zvcm1IQVByb3BlcnR5RXhpc3RzKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIENTUy5mbHVzaFRyYW5zZm9ybUNhY2hlKGVsZW1lbnQpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIFJlbW92ZSB0aGUgXCJ2ZWxvY2l0eS1hbmltYXRpbmdcIiBpbmRpY2F0b3IgY2xhc3MuICovXG5cdCAgICAgICAgICAgICAgICAgICAgQ1NTLlZhbHVlcy5yZW1vdmVDbGFzcyhlbGVtZW50LCBcInZlbG9jaXR5LWFuaW1hdGluZ1wiKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgT3B0aW9uOiBDb21wbGV0ZVxuXHQgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgLyogQ29tcGxldGUgaXMgZmlyZWQgb25jZSBwZXIgY2FsbCAobm90IG9uY2UgcGVyIGVsZW1lbnQpIGFuZCBpcyBwYXNzZWQgdGhlIGZ1bGwgcmF3IERPTSBlbGVtZW50IHNldCBhcyBib3RoIGl0cyBjb250ZXh0IGFuZCBpdHMgZmlyc3QgYXJndW1lbnQuICovXG5cdCAgICAgICAgICAgIC8qIE5vdGU6IENhbGxiYWNrcyBhcmVuJ3QgZmlyZWQgd2hlbiBjYWxscyBhcmUgbWFudWFsbHkgc3RvcHBlZCAodmlhIFZlbG9jaXR5KFwic3RvcFwiKS4gKi9cblx0ICAgICAgICAgICAgaWYgKCFpc1N0b3BwZWQgJiYgb3B0cy5jb21wbGV0ZSAmJiAhb3B0cy5sb29wICYmIChpID09PSBjYWxsTGVuZ3RoIC0gMSkpIHtcblx0ICAgICAgICAgICAgICAgIC8qIFdlIHRocm93IGNhbGxiYWNrcyBpbiBhIHNldFRpbWVvdXQgc28gdGhhdCB0aHJvd24gZXJyb3JzIGRvbid0IGhhbHQgdGhlIGV4ZWN1dGlvbiBvZiBWZWxvY2l0eSBpdHNlbGYuICovXG5cdCAgICAgICAgICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICAgICAgICAgIG9wdHMuY29tcGxldGUuY2FsbChlbGVtZW50cywgZWxlbWVudHMpO1xuXHQgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcblx0ICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyB0aHJvdyBlcnJvcjsgfSwgMSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICBQcm9taXNlIFJlc29sdmluZ1xuXHQgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgIC8qIE5vdGU6IEluZmluaXRlIGxvb3BzIGRvbid0IHJldHVybiBwcm9taXNlcy4gKi9cblx0ICAgICAgICAgICAgaWYgKHJlc29sdmVyICYmIG9wdHMubG9vcCAhPT0gdHJ1ZSkge1xuXHQgICAgICAgICAgICAgICAgcmVzb2x2ZXIoZWxlbWVudHMpO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgT3B0aW9uOiBMb29wIChJbmZpbml0ZSlcblx0ICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICBpZiAoRGF0YShlbGVtZW50KSAmJiBvcHRzLmxvb3AgPT09IHRydWUgJiYgIWlzU3RvcHBlZCkge1xuXHQgICAgICAgICAgICAgICAgLyogSWYgYSByb3RhdGVYL1kvWiBwcm9wZXJ0eSBpcyBiZWluZyBhbmltYXRlZCB0byAzNjAgZGVnIHdpdGggbG9vcDp0cnVlLCBzd2FwIHR3ZWVuIHN0YXJ0L2VuZCB2YWx1ZXMgdG8gZW5hYmxlXG5cdCAgICAgICAgICAgICAgICAgICBjb250aW51b3VzIGl0ZXJhdGl2ZSByb3RhdGlvbiBsb29waW5nLiAoT3RoZXJpc2UsIHRoZSBlbGVtZW50IHdvdWxkIGp1c3Qgcm90YXRlIGJhY2sgYW5kIGZvcnRoLikgKi9cblx0ICAgICAgICAgICAgICAgICQuZWFjaChEYXRhKGVsZW1lbnQpLnR3ZWVuc0NvbnRhaW5lciwgZnVuY3Rpb24ocHJvcGVydHlOYW1lLCB0d2VlbkNvbnRhaW5lcikge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmICgvXnJvdGF0ZS8udGVzdChwcm9wZXJ0eU5hbWUpICYmIHBhcnNlRmxvYXQodHdlZW5Db250YWluZXIuZW5kVmFsdWUpID09PSAzNjApIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW5Db250YWluZXIuZW5kVmFsdWUgPSAwO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB0d2VlbkNvbnRhaW5lci5zdGFydFZhbHVlID0gMzYwO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIGlmICgvXmJhY2tncm91bmRQb3NpdGlvbi8udGVzdChwcm9wZXJ0eU5hbWUpICYmIHBhcnNlRmxvYXQodHdlZW5Db250YWluZXIuZW5kVmFsdWUpID09PSAxMDAgJiYgdHdlZW5Db250YWluZXIudW5pdFR5cGUgPT09IFwiJVwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuQ29udGFpbmVyLmVuZFZhbHVlID0gMDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW5Db250YWluZXIuc3RhcnRWYWx1ZSA9IDEwMDtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9KTtcblxuXHQgICAgICAgICAgICAgICAgVmVsb2NpdHkoZWxlbWVudCwgXCJyZXZlcnNlXCIsIHsgbG9vcDogdHJ1ZSwgZGVsYXk6IG9wdHMuZGVsYXkgfSk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgIERlcXVldWVpbmdcblx0ICAgICAgICAgICAgKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgIC8qIEZpcmUgdGhlIG5leHQgY2FsbCBpbiB0aGUgcXVldWUgc28gbG9uZyBhcyB0aGlzIGNhbGwncyBxdWV1ZSB3YXNuJ3Qgc2V0IHRvIGZhbHNlICh0byB0cmlnZ2VyIGEgcGFyYWxsZWwgYW5pbWF0aW9uKSxcblx0ICAgICAgICAgICAgICAgd2hpY2ggd291bGQgaGF2ZSBhbHJlYWR5IGNhdXNlZCB0aGUgbmV4dCBjYWxsIHRvIGZpcmUuIE5vdGU6IEV2ZW4gaWYgdGhlIGVuZCBvZiB0aGUgYW5pbWF0aW9uIHF1ZXVlIGhhcyBiZWVuIHJlYWNoZWQsXG5cdCAgICAgICAgICAgICAgICQuZGVxdWV1ZSgpIG11c3Qgc3RpbGwgYmUgY2FsbGVkIGluIG9yZGVyIHRvIGNvbXBsZXRlbHkgY2xlYXIgalF1ZXJ5J3MgYW5pbWF0aW9uIHF1ZXVlLiAqL1xuXHQgICAgICAgICAgICBpZiAob3B0cy5xdWV1ZSAhPT0gZmFsc2UpIHtcblx0ICAgICAgICAgICAgICAgICQuZGVxdWV1ZShlbGVtZW50LCBvcHRzLnF1ZXVlKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICBDYWxscyBBcnJheSBDbGVhbnVwXG5cdCAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgLyogU2luY2UgdGhpcyBjYWxsIGlzIGNvbXBsZXRlLCBzZXQgaXQgdG8gZmFsc2Ugc28gdGhhdCB0aGUgckFGIHRpY2sgc2tpcHMgaXQuIFRoaXMgYXJyYXkgaXMgbGF0ZXIgY29tcGFjdGVkIHZpYSBjb21wYWN0U3BhcnNlQXJyYXkoKS5cblx0ICAgICAgICAgIChGb3IgcGVyZm9ybWFuY2UgcmVhc29ucywgdGhlIGNhbGwgaXMgc2V0IHRvIGZhbHNlIGluc3RlYWQgb2YgYmVpbmcgZGVsZXRlZCBmcm9tIHRoZSBhcnJheTogaHR0cDovL3d3dy5odG1sNXJvY2tzLmNvbS9lbi90dXRvcmlhbHMvc3BlZWQvdjgvKSAqL1xuXHQgICAgICAgIFZlbG9jaXR5LlN0YXRlLmNhbGxzW2NhbGxJbmRleF0gPSBmYWxzZTtcblxuXHQgICAgICAgIC8qIEl0ZXJhdGUgdGhyb3VnaCB0aGUgY2FsbHMgYXJyYXkgdG8gZGV0ZXJtaW5lIGlmIHRoaXMgd2FzIHRoZSBmaW5hbCBpbi1wcm9ncmVzcyBhbmltYXRpb24uXG5cdCAgICAgICAgICAgSWYgc28sIHNldCBhIGZsYWcgdG8gZW5kIHRpY2tpbmcgYW5kIGNsZWFyIHRoZSBjYWxscyBhcnJheS4gKi9cblx0ICAgICAgICBmb3IgKHZhciBqID0gMCwgY2FsbHNMZW5ndGggPSBWZWxvY2l0eS5TdGF0ZS5jYWxscy5sZW5ndGg7IGogPCBjYWxsc0xlbmd0aDsgaisrKSB7XG5cdCAgICAgICAgICAgIGlmIChWZWxvY2l0eS5TdGF0ZS5jYWxsc1tqXSAhPT0gZmFsc2UpIHtcblx0ICAgICAgICAgICAgICAgIHJlbWFpbmluZ0NhbGxzRXhpc3QgPSB0cnVlO1xuXG5cdCAgICAgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmIChyZW1haW5pbmdDYWxsc0V4aXN0ID09PSBmYWxzZSkge1xuXHQgICAgICAgICAgICAvKiB0aWNrKCkgd2lsbCBkZXRlY3QgdGhpcyBmbGFnIHVwb24gaXRzIG5leHQgaXRlcmF0aW9uIGFuZCBzdWJzZXF1ZW50bHkgdHVybiBpdHNlbGYgb2ZmLiAqL1xuXHQgICAgICAgICAgICBWZWxvY2l0eS5TdGF0ZS5pc1RpY2tpbmcgPSBmYWxzZTtcblxuXHQgICAgICAgICAgICAvKiBDbGVhciB0aGUgY2FsbHMgYXJyYXkgc28gdGhhdCBpdHMgbGVuZ3RoIGlzIHJlc2V0LiAqL1xuXHQgICAgICAgICAgICBkZWxldGUgVmVsb2NpdHkuU3RhdGUuY2FsbHM7XG5cdCAgICAgICAgICAgIFZlbG9jaXR5LlN0YXRlLmNhbGxzID0gW107XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICAvKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgRnJhbWV3b3Jrc1xuXHQgICAgKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAvKiBCb3RoIGpRdWVyeSBhbmQgWmVwdG8gYWxsb3cgdGhlaXIgJC5mbiBvYmplY3QgdG8gYmUgZXh0ZW5kZWQgdG8gYWxsb3cgd3JhcHBlZCBlbGVtZW50cyB0byBiZSBzdWJqZWN0ZWQgdG8gcGx1Z2luIGNhbGxzLlxuXHQgICAgICAgSWYgZWl0aGVyIGZyYW1ld29yayBpcyBsb2FkZWQsIHJlZ2lzdGVyIGEgXCJ2ZWxvY2l0eVwiIGV4dGVuc2lvbiBwb2ludGluZyB0byBWZWxvY2l0eSdzIGNvcmUgYW5pbWF0ZSgpIG1ldGhvZC4gIFZlbG9jaXR5XG5cdCAgICAgICBhbHNvIHJlZ2lzdGVycyBpdHNlbGYgb250byBhIGdsb2JhbCBjb250YWluZXIgKHdpbmRvdy5qUXVlcnkgfHwgd2luZG93LlplcHRvIHx8IHdpbmRvdykgc28gdGhhdCBjZXJ0YWluIGZlYXR1cmVzIGFyZVxuXHQgICAgICAgYWNjZXNzaWJsZSBiZXlvbmQganVzdCBhIHBlci1lbGVtZW50IHNjb3BlLiBUaGlzIG1hc3RlciBvYmplY3QgY29udGFpbnMgYW4gLmFuaW1hdGUoKSBtZXRob2QsIHdoaWNoIGlzIGxhdGVyIGFzc2lnbmVkIHRvICQuZm5cblx0ICAgICAgIChpZiBqUXVlcnkgb3IgWmVwdG8gYXJlIHByZXNlbnQpLiBBY2NvcmRpbmdseSwgVmVsb2NpdHkgY2FuIGJvdGggYWN0IG9uIHdyYXBwZWQgRE9NIGVsZW1lbnRzIGFuZCBzdGFuZCBhbG9uZSBmb3IgdGFyZ2V0aW5nIHJhdyBET00gZWxlbWVudHMuICovXG5cdCAgICBnbG9iYWwuVmVsb2NpdHkgPSBWZWxvY2l0eTtcblxuXHQgICAgaWYgKGdsb2JhbCAhPT0gd2luZG93KSB7XG5cdCAgICAgICAgLyogQXNzaWduIHRoZSBlbGVtZW50IGZ1bmN0aW9uIHRvIFZlbG9jaXR5J3MgY29yZSBhbmltYXRlKCkgbWV0aG9kLiAqL1xuXHQgICAgICAgIGdsb2JhbC5mbi52ZWxvY2l0eSA9IGFuaW1hdGU7XG5cdCAgICAgICAgLyogQXNzaWduIHRoZSBvYmplY3QgZnVuY3Rpb24ncyBkZWZhdWx0cyB0byBWZWxvY2l0eSdzIGdsb2JhbCBkZWZhdWx0cyBvYmplY3QuICovXG5cdCAgICAgICAgZ2xvYmFsLmZuLnZlbG9jaXR5LmRlZmF1bHRzID0gVmVsb2NpdHkuZGVmYXVsdHM7XG5cdCAgICB9XG5cblx0ICAgIC8qKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgUGFja2FnZWQgUmVkaXJlY3RzXG5cdCAgICAqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgLyogc2xpZGVVcCwgc2xpZGVEb3duICovXG5cdCAgICAkLmVhY2goWyBcIkRvd25cIiwgXCJVcFwiIF0sIGZ1bmN0aW9uKGksIGRpcmVjdGlvbikge1xuXHQgICAgICAgIFZlbG9jaXR5LlJlZGlyZWN0c1tcInNsaWRlXCIgKyBkaXJlY3Rpb25dID0gZnVuY3Rpb24gKGVsZW1lbnQsIG9wdGlvbnMsIGVsZW1lbnRzSW5kZXgsIGVsZW1lbnRzU2l6ZSwgZWxlbWVudHMsIHByb21pc2VEYXRhKSB7XG5cdCAgICAgICAgICAgIHZhciBvcHRzID0gJC5leHRlbmQoe30sIG9wdGlvbnMpLFxuXHQgICAgICAgICAgICAgICAgYmVnaW4gPSBvcHRzLmJlZ2luLFxuXHQgICAgICAgICAgICAgICAgY29tcGxldGUgPSBvcHRzLmNvbXBsZXRlLFxuXHQgICAgICAgICAgICAgICAgY29tcHV0ZWRWYWx1ZXMgPSB7IGhlaWdodDogXCJcIiwgbWFyZ2luVG9wOiBcIlwiLCBtYXJnaW5Cb3R0b206IFwiXCIsIHBhZGRpbmdUb3A6IFwiXCIsIHBhZGRpbmdCb3R0b206IFwiXCIgfSxcblx0ICAgICAgICAgICAgICAgIGlubGluZVZhbHVlcyA9IHt9O1xuXG5cdCAgICAgICAgICAgIGlmIChvcHRzLmRpc3BsYXkgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgLyogU2hvdyB0aGUgZWxlbWVudCBiZWZvcmUgc2xpZGVEb3duIGJlZ2lucyBhbmQgaGlkZSB0aGUgZWxlbWVudCBhZnRlciBzbGlkZVVwIGNvbXBsZXRlcy4gKi9cblx0ICAgICAgICAgICAgICAgIC8qIE5vdGU6IElubGluZSBlbGVtZW50cyBjYW5ub3QgaGF2ZSBkaW1lbnNpb25zIGFuaW1hdGVkLCBzbyB0aGV5J3JlIHJldmVydGVkIHRvIGlubGluZS1ibG9jay4gKi9cblx0ICAgICAgICAgICAgICAgIG9wdHMuZGlzcGxheSA9IChkaXJlY3Rpb24gPT09IFwiRG93blwiID8gKFZlbG9jaXR5LkNTUy5WYWx1ZXMuZ2V0RGlzcGxheVR5cGUoZWxlbWVudCkgPT09IFwiaW5saW5lXCIgPyBcImlubGluZS1ibG9ja1wiIDogXCJibG9ja1wiKSA6IFwibm9uZVwiKTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIG9wdHMuYmVnaW4gPSBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgICAgIC8qIElmIHRoZSB1c2VyIHBhc3NlZCBpbiBhIGJlZ2luIGNhbGxiYWNrLCBmaXJlIGl0IG5vdy4gKi9cblx0ICAgICAgICAgICAgICAgIGJlZ2luICYmIGJlZ2luLmNhbGwoZWxlbWVudHMsIGVsZW1lbnRzKTtcblxuXHQgICAgICAgICAgICAgICAgLyogQ2FjaGUgdGhlIGVsZW1lbnRzJyBvcmlnaW5hbCB2ZXJ0aWNhbCBkaW1lbnNpb25hbCBwcm9wZXJ0eSB2YWx1ZXMgc28gdGhhdCB3ZSBjYW4gYW5pbWF0ZSBiYWNrIHRvIHRoZW0uICovXG5cdCAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wZXJ0eSBpbiBjb21wdXRlZFZhbHVlcykge1xuXHQgICAgICAgICAgICAgICAgICAgIGlubGluZVZhbHVlc1twcm9wZXJ0eV0gPSBlbGVtZW50LnN0eWxlW3Byb3BlcnR5XTtcblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIEZvciBzbGlkZURvd24sIHVzZSBmb3JjZWZlZWRpbmcgdG8gYW5pbWF0ZSBhbGwgdmVydGljYWwgcHJvcGVydGllcyBmcm9tIDAuIEZvciBzbGlkZVVwLFxuXHQgICAgICAgICAgICAgICAgICAgICAgIHVzZSBmb3JjZWZlZWRpbmcgdG8gc3RhcnQgZnJvbSBjb21wdXRlZCB2YWx1ZXMgYW5kIGFuaW1hdGUgZG93biB0byAwLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0eVZhbHVlID0gVmVsb2NpdHkuQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgcHJvcGVydHkpO1xuXHQgICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkVmFsdWVzW3Byb3BlcnR5XSA9IChkaXJlY3Rpb24gPT09IFwiRG93blwiKSA/IFsgcHJvcGVydHlWYWx1ZSwgMCBdIDogWyAwLCBwcm9wZXJ0eVZhbHVlIF07XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIC8qIEZvcmNlIHZlcnRpY2FsIG92ZXJmbG93IGNvbnRlbnQgdG8gY2xpcCBzbyB0aGF0IHNsaWRpbmcgd29ya3MgYXMgZXhwZWN0ZWQuICovXG5cdCAgICAgICAgICAgICAgICBpbmxpbmVWYWx1ZXMub3ZlcmZsb3cgPSBlbGVtZW50LnN0eWxlLm92ZXJmbG93O1xuXHQgICAgICAgICAgICAgICAgZWxlbWVudC5zdHlsZS5vdmVyZmxvdyA9IFwiaGlkZGVuXCI7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBvcHRzLmNvbXBsZXRlID0gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgICAgICAvKiBSZXNldCBlbGVtZW50IHRvIGl0cyBwcmUtc2xpZGUgaW5saW5lIHZhbHVlcyBvbmNlIGl0cyBzbGlkZSBhbmltYXRpb24gaXMgY29tcGxldGUuICovXG5cdCAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wZXJ0eSBpbiBpbmxpbmVWYWx1ZXMpIHtcblx0ICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnN0eWxlW3Byb3BlcnR5XSA9IGlubGluZVZhbHVlc1twcm9wZXJ0eV07XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIC8qIElmIHRoZSB1c2VyIHBhc3NlZCBpbiBhIGNvbXBsZXRlIGNhbGxiYWNrLCBmaXJlIGl0IG5vdy4gKi9cblx0ICAgICAgICAgICAgICAgIGNvbXBsZXRlICYmIGNvbXBsZXRlLmNhbGwoZWxlbWVudHMsIGVsZW1lbnRzKTtcblx0ICAgICAgICAgICAgICAgIHByb21pc2VEYXRhICYmIHByb21pc2VEYXRhLnJlc29sdmVyKGVsZW1lbnRzKTtcblx0ICAgICAgICAgICAgfTtcblxuXHQgICAgICAgICAgICBWZWxvY2l0eShlbGVtZW50LCBjb21wdXRlZFZhbHVlcywgb3B0cyk7XG5cdCAgICAgICAgfTtcblx0ICAgIH0pO1xuXG5cdCAgICAvKiBmYWRlSW4sIGZhZGVPdXQgKi9cblx0ICAgICQuZWFjaChbIFwiSW5cIiwgXCJPdXRcIiBdLCBmdW5jdGlvbihpLCBkaXJlY3Rpb24pIHtcblx0ICAgICAgICBWZWxvY2l0eS5SZWRpcmVjdHNbXCJmYWRlXCIgKyBkaXJlY3Rpb25dID0gZnVuY3Rpb24gKGVsZW1lbnQsIG9wdGlvbnMsIGVsZW1lbnRzSW5kZXgsIGVsZW1lbnRzU2l6ZSwgZWxlbWVudHMsIHByb21pc2VEYXRhKSB7XG5cdCAgICAgICAgICAgIHZhciBvcHRzID0gJC5leHRlbmQoe30sIG9wdGlvbnMpLFxuXHQgICAgICAgICAgICAgICAgcHJvcGVydGllc01hcCA9IHsgb3BhY2l0eTogKGRpcmVjdGlvbiA9PT0gXCJJblwiKSA/IDEgOiAwIH0sXG5cdCAgICAgICAgICAgICAgICBvcmlnaW5hbENvbXBsZXRlID0gb3B0cy5jb21wbGV0ZTtcblxuXHQgICAgICAgICAgICAvKiBTaW5jZSByZWRpcmVjdHMgYXJlIHRyaWdnZXJlZCBpbmRpdmlkdWFsbHkgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUgYW5pbWF0ZWQgc2V0LCBhdm9pZCByZXBlYXRlZGx5IHRyaWdnZXJpbmdcblx0ICAgICAgICAgICAgICAgY2FsbGJhY2tzIGJ5IGZpcmluZyB0aGVtIG9ubHkgd2hlbiB0aGUgZmluYWwgZWxlbWVudCBoYXMgYmVlbiByZWFjaGVkLiAqL1xuXHQgICAgICAgICAgICBpZiAoZWxlbWVudHNJbmRleCAhPT0gZWxlbWVudHNTaXplIC0gMSkge1xuXHQgICAgICAgICAgICAgICAgb3B0cy5jb21wbGV0ZSA9IG9wdHMuYmVnaW4gPSBudWxsO1xuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgb3B0cy5jb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChvcmlnaW5hbENvbXBsZXRlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIG9yaWdpbmFsQ29tcGxldGUuY2FsbChlbGVtZW50cywgZWxlbWVudHMpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIHByb21pc2VEYXRhICYmIHByb21pc2VEYXRhLnJlc29sdmVyKGVsZW1lbnRzKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8qIElmIGEgZGlzcGxheSB3YXMgcGFzc2VkIGluLCB1c2UgaXQuIE90aGVyd2lzZSwgZGVmYXVsdCB0byBcIm5vbmVcIiBmb3IgZmFkZU91dCBvciB0aGUgZWxlbWVudC1zcGVjaWZpYyBkZWZhdWx0IGZvciBmYWRlSW4uICovXG5cdCAgICAgICAgICAgIC8qIE5vdGU6IFdlIGFsbG93IHVzZXJzIHRvIHBhc3MgaW4gXCJudWxsXCIgdG8gc2tpcCBkaXNwbGF5IHNldHRpbmcgYWx0b2dldGhlci4gKi9cblx0ICAgICAgICAgICAgaWYgKG9wdHMuZGlzcGxheSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICBvcHRzLmRpc3BsYXkgPSAoZGlyZWN0aW9uID09PSBcIkluXCIgPyBcImF1dG9cIiA6IFwibm9uZVwiKTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIFZlbG9jaXR5KHRoaXMsIHByb3BlcnRpZXNNYXAsIG9wdHMpO1xuXHQgICAgICAgIH07XG5cdCAgICB9KTtcblxuXHQgICAgcmV0dXJuIFZlbG9jaXR5O1xuXHR9KCh3aW5kb3cualF1ZXJ5IHx8IHdpbmRvdy5aZXB0byB8fCB3aW5kb3cpLCB3aW5kb3csIGRvY3VtZW50KTtcblx0fSkpO1xuXG5cdC8qKioqKioqKioqKioqKioqKipcblx0ICAgS25vd24gSXNzdWVzXG5cdCoqKioqKioqKioqKioqKioqKi9cblxuXHQvKiBUaGUgQ1NTIHNwZWMgbWFuZGF0ZXMgdGhhdCB0aGUgdHJhbnNsYXRlWC9ZL1ogdHJhbnNmb3JtcyBhcmUgJS1yZWxhdGl2ZSB0byB0aGUgZWxlbWVudCBpdHNlbGYgLS0gbm90IGl0cyBwYXJlbnQuXG5cdFZlbG9jaXR5LCBob3dldmVyLCBkb2Vzbid0IG1ha2UgdGhpcyBkaXN0aW5jdGlvbi4gVGh1cywgY29udmVydGluZyB0byBvciBmcm9tIHRoZSAlIHVuaXQgd2l0aCB0aGVzZSBzdWJwcm9wZXJ0aWVzXG5cdHdpbGwgcHJvZHVjZSBhbiBpbmFjY3VyYXRlIGNvbnZlcnNpb24gdmFsdWUuIFRoZSBzYW1lIGlzc3VlIGV4aXN0cyB3aXRoIHRoZSBjeC9jeSBhdHRyaWJ1dGVzIG9mIFNWRyBjaXJjbGVzIGFuZCBlbGxpcHNlcy4gKi9cblxuLyoqKi8gfSxcbi8qIDQgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdHZhciBGbHlvdXRGYWN0b3J5ID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgdmFyIHBhZGRpbmcgPSAxMDtcblx0ICB2YXIgaG92ZXJhYmxlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLWZseW91dF0nKSk7XG5cblx0ICBob3ZlcmFibGVzLmZvckVhY2goZnVuY3Rpb24oaG92ZXJhYmxlKSB7XG5cdCAgICB2YXIgZmx5b3V0ID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcjJyArIGhvdmVyYWJsZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtZmx5b3V0JykpO1xuXG5cdCAgICBob3ZlcmFibGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgZnVuY3Rpb24oKSB7XG5cdCAgICAgIGZseW91dC5jbGFzc0xpc3QucmVtb3ZlKCdmbHlvdXQtaGlkZGVuJyk7XG5cdCAgICAgIHZhciBub2RlID0gaG92ZXJhYmxlO1xuXHQgICAgICB2YXIgbGVmdCA9IDA7XG5cdCAgICAgIHZhciB0b3AgPSAwO1xuXG5cdCAgICAgIGRvIHtcblx0ICAgICAgICBsZWZ0ICs9IG5vZGUub2Zmc2V0TGVmdDtcblx0ICAgICAgICB0b3AgKz0gbm9kZS5vZmZzZXRUb3A7XG5cdCAgICAgIH0gd2hpbGUgKChub2RlID0gbm9kZS5vZmZzZXRQYXJlbnQpICE9PSBudWxsKTtcblxuXHQgICAgICBsZWZ0ID0gbGVmdCArIGhvdmVyYWJsZS5vZmZzZXRXaWR0aCAvIDI7XG5cdCAgICAgIHRvcCA9IHRvcCArIGhvdmVyYWJsZS5vZmZzZXRIZWlnaHQgKyBwYWRkaW5nO1xuXG5cdCAgICAgIGZseW91dC5zdHlsZS5sZWZ0ID0gbGVmdCArICdweCc7XG5cdCAgICAgIGZseW91dC5zdHlsZS50b3AgPSB0b3AgKyAncHgnO1xuXHQgICAgfSk7XG5cblx0ICAgIGhvdmVyYWJsZS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW91dCcsIGZ1bmN0aW9uKCkge1xuXHQgICAgICBmbHlvdXQuY2xhc3NMaXN0LmFkZCgnZmx5b3V0LWhpZGRlbicpO1xuXHQgICAgfSk7XG5cdCAgfSk7XG5cblx0fVxuXG5cbi8qKiovIH0sXG4vKiA1ICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHR2YXIgTWVudUZhY3RvcnkgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICB2YXIgbWVudXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5tZW51JykpO1xuXHQgIHZhciB0b2dnbGVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1tZW51LXRvZ2dsZV0nKSk7XG5cblx0ICB0b2dnbGVzLmZvckVhY2goZnVuY3Rpb24odG9nZ2xlKSB7XG5cdCAgICB0b2dnbGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0ICAgICAgdmFyIG1lbnUgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnICsgdG9nZ2xlLmdldEF0dHJpYnV0ZSgnZGF0YS1tZW51LXRvZ2dsZScpKTtcblx0ICAgICAgbWVudS5jbGFzc0xpc3QudG9nZ2xlKCdhY3RpdmUnKTtcblx0ICAgIH0pO1xuXHQgIH0pO1xuXG5cdCAgbWVudXMuZm9yRWFjaChmdW5jdGlvbihtZW51KSB7XG5cdCAgICB2YXIgZGlzbWlzc2FscyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKG1lbnUucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtbWVudS1kaXNtaXNzXScpKTtcblxuXHQgICAgZGlzbWlzc2Fscy5mb3JFYWNoKGZ1bmN0aW9uKGRpc21pc3NhbCkge1xuXHQgICAgICBkaXNtaXNzYWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0ICAgICAgICBtZW51LmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuXHQgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLW1lbnUtdG9nZ2xlPVwiJyArIG1lbnUuaWQgKyAnXCJdJykuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG5cdCAgICAgIH0pO1xuXHQgICAgfSk7XG5cdCAgfSk7XG5cdH1cblxuXG4vKioqLyB9LFxuLyogNiAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0dmFyIHZlbG9jaXR5ID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblxuXHR2YXIgbW9iaWxlQnJlYWtwb2ludCA9IDQyMDtcblx0dmFyIGFuaW1hdGlvbkR1cmF0aW9uID0gMzAwO1xuXHR2YXIgYW5pbWF0aW9uRWFzaW5nID0gWy42NDUsIC4wNDUsIC4zNTUsIDFdO1xuXG5cdHZhciBNb2RhbEZhY3RvcnkgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICB0aGlzLnJvb3QgPSBlbGVtZW50O1xuXHQgIHRoaXMuZGlzbWlzc2FscyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW1vZGFsLWRpc21pc3NdJykpO1xuXHQgIHRoaXMub3BlbmVycyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW1vZGFsXScpKTtcblx0ICB0aGlzLmF0dGFjaEV2ZW50cygpO1xuXHR9XG5cblx0TW9kYWxGYWN0b3J5LnByb3RvdHlwZSA9IHtcblx0ICBhdHRhY2hFdmVudHM6IGZ1bmN0aW9uKCkge1xuXHQgICAgdGhpcy5kaXNtaXNzYWxzLmZvckVhY2goZnVuY3Rpb24gKGRpc21pc3NhbCkge1xuXHQgICAgICBkaXNtaXNzYWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmRpc21pc3MuYmluZCh0aGlzKSk7XG5cdCAgICB9LCB0aGlzKTtcblxuXHQgICAgdGhpcy5vcGVuZXJzLmZvckVhY2goZnVuY3Rpb24gKG9wZW5lcikge1xuXHQgICAgICBvcGVuZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm9wZW4uYmluZCh0aGlzKSk7XG5cdCAgICB9LCB0aGlzKTtcblxuXHQgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBmdW5jdGlvbihldmVudCkge1xuXHQgICAgICB2YXIga2V5ID0gZXZlbnQud2hpY2ggfHwgZXZlbnQua2V5Q29kZTtcblxuXHQgICAgICAvLyBFU0Ncblx0ICAgICAgaWYgKGtleSA9PT0gMjcpIHtcblx0ICAgICAgICB2YXIgbW9kYWxzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLm1vZGFsOm5vdCgubW9kYWwtaGlkZGVuKScpKTtcblx0ICAgICAgICBtb2RhbHMuZm9yRWFjaChmdW5jdGlvbihtb2RhbCkge1xuXHQgICAgICAgICAgbW9kYWwuY2xhc3NMaXN0LmFkZCgnbW9kYWwtaGlkZGVuJyk7XG5cdCAgICAgICAgfSk7XG5cdCAgICAgIH1cblx0ICAgIH0pO1xuXG5cdCAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgZnVuY3Rpb24oZXZlbnQpIHtcblx0ICAgICAgdmFyIG1vZGFscyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5tb2RhbDpub3QoLm1vZGFsLWhpZGRlbiknKSk7XG5cdCAgICAgIG1vZGFscy5mb3JFYWNoKGZ1bmN0aW9uKG1vZGFsKSB7XG5cdCAgICAgICAgdGhpcy5yZXBvc2l0aW9uKG1vZGFsLnF1ZXJ5U2VsZWN0b3IoJy5tb2RhbC1jb250YWluZXInKSk7XG5cdCAgICAgIH0uYmluZCh0aGlzKSk7XG5cdCAgICB9LmJpbmQodGhpcykpO1xuXHQgIH0sXG5cblx0ICBvcGVuOiBmdW5jdGlvbihldmVudCkge1xuXHQgICAgdmFyIG1vZGFsID0gZXZlbnQudGFyZ2V0LmdldEF0dHJpYnV0ZSgnZGF0YS1tb2RhbCcpO1xuXHQgICAgbW9kYWwgPSB0aGlzLnJvb3QucXVlcnlTZWxlY3RvcignIycgKyBtb2RhbCk7XG5cdCAgICBtb2RhbC5jbGFzc0xpc3QucmVtb3ZlKCdtb2RhbC1oaWRkZW4nKTtcblxuXHQgICAgdmFyIHdpbmRvd1dpZHRoID0gZG9jdW1lbnQuYm9keS5vZmZzZXRXaWR0aDtcblx0ICAgIHZhciBtb2RhbENvbnRhaW5lciA9IG1vZGFsLnF1ZXJ5U2VsZWN0b3IoJy5tb2RhbC1jb250YWluZXInKTtcblxuXHQgICAgaWYgKHdpbmRvd1dpZHRoIDw9IG1vYmlsZUJyZWFrcG9pbnQpIHtcblx0ICAgICAgbW9kYWxDb250YWluZXIuc3R5bGUubGVmdCA9IHdpbmRvd1dpZHRoICsgJ3B4JztcblxuXHQgICAgICB2ZWxvY2l0eShtb2RhbENvbnRhaW5lciwge1xuXHQgICAgICAgIGxlZnQ6IDBcblx0ICAgICAgfSwge1xuXHQgICAgICAgIGR1cmF0aW9uOiBhbmltYXRpb25EdXJhdGlvbixcblx0ICAgICAgICBlYXNpbmc6IGFuaW1hdGlvbkVhc2luZyxcblx0ICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XG5cdCAgICAgICAgfVxuXHQgICAgICB9KTtcblx0ICAgIH1cblxuXHQgICAgdGhpcy5yZXBvc2l0aW9uKG1vZGFsQ29udGFpbmVyKTtcblx0ICB9LFxuXG5cdCAgZGlzbWlzczogZnVuY3Rpb24oZXZlbnQpIHtcblx0ICAgIHZhciBzZWxmID0gdGhpcztcblx0ICAgIHZhciB0YXJnZXQgPSBldmVudC50YXJnZXQ7XG5cblx0ICAgIHZhciBjbG9zZWFibGUgPSB0YXJnZXQgPT09IGV2ZW50LmN1cnJlbnRUYXJnZXQgJiYgdGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnbW9kYWwtb3ZlcmxheScpO1xuXHQgICAgdmFyIG1vZGFsO1xuXG5cdCAgICAvLyBGaW5kIHRoZSBtb2RhbCBhbmQgZmlndXJlIG91dCBpZiBpdCdzIGNsb3NlYWJsZS5cblx0ICAgIGRvIHtcblx0ICAgICAgaWYgKHRhcmdldC5oYXNBdHRyaWJ1dGUoJ2RhdGEtbW9kYWwtZGlzbWlzcycpICYmXG5cdCAgICAgICAgICAhdGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnbW9kYWwnKSkge1xuXHQgICAgICAgIGNsb3NlYWJsZSA9IHRydWU7XG5cdCAgICAgIH0gZWxzZSBpZiAodGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnbW9kYWwnKSl7XG5cdCAgICAgICAgbW9kYWwgPSB0YXJnZXQ7XG5cdCAgICAgICAgYnJlYWs7XG5cdCAgICAgIH1cblx0ICAgIH0gd2hpbGUoKHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlKSAhPT0gc2VsZi5yb290KTtcblxuXHQgICAgaWYgKCFtb2RhbCkge1xuXHQgICAgICByZXR1cm47XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIGhpZGVNb2RhbCgpIHtcblx0ICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5vdmVyZmxvdyA9ICcnO1xuXG5cdCAgICAgIGlmIChjbG9zZWFibGUpIHtcblx0ICAgICAgICBtb2RhbC5jbGFzc0xpc3QuYWRkKCdtb2RhbC1oaWRkZW4nKTtcblx0ICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICB2YXIgd2luZG93V2lkdGggPSBkb2N1bWVudC5ib2R5Lm9mZnNldFdpZHRoO1xuXHQgICAgdmFyIG1vZGFsQ29udGFpbmVyID0gbW9kYWwucXVlcnlTZWxlY3RvcignLm1vZGFsLWNvbnRhaW5lcicpO1xuXG5cdCAgICBpZiAod2luZG93V2lkdGggPD0gbW9iaWxlQnJlYWtwb2ludCkge1xuXHQgICAgICB2ZWxvY2l0eShtb2RhbENvbnRhaW5lciwge1xuXHQgICAgICAgIGxlZnQ6IHdpbmRvd1dpZHRoXG5cdCAgICAgIH0sIHtcblx0ICAgICAgICBkdXJhdGlvbjogYW5pbWF0aW9uRHVyYXRpb24sXG5cdCAgICAgICAgZWFzaW5nOiBhbmltYXRpb25FYXNpbmcsXG5cdCAgICAgICAgY29tcGxldGU6IGhpZGVNb2RhbFxuXHQgICAgICB9KTtcblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgIGhpZGVNb2RhbCgpO1xuXHQgICAgfVxuXHQgIH0sXG5cblx0ICByZXBvc2l0aW9uOiBmdW5jdGlvbihtb2RhbCkge1xuXHQgICAgaWYgKG1vZGFsLmNsYXNzTGlzdC5jb250YWlucygnbW9kYWwtaGlkZGVuJykpIHtcblx0ICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXG5cdCAgICB2YXIgd2luZG93V2lkdGggPSBkb2N1bWVudC5ib2R5Lm9mZnNldFdpZHRoO1xuXG5cdCAgICBpZiAod2luZG93V2lkdGggPj0gbW9iaWxlQnJlYWtwb2ludCkge1xuXHQgICAgICBtb2RhbC5zdHlsZS5tYXJnaW4gPSAnJztcblx0ICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5vdmVyZmxvdyA9ICcnO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgbW9kYWwuc3R5bGUubWFyZ2luID0gMDtcblx0ICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuXHQgICAgfVxuXHQgIH1cblx0fTtcblxuXG4vKioqLyB9LFxuLyogNyAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0dmFyIFRvZ2dsZUZhY3RvcnkgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICB2YXIgdG9nZ2xlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXRvZ2dsZV0nKSk7XG5cdCAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcblxuXHQgIHRvZ2dsZXMuZm9yRWFjaChmdW5jdGlvbih0b2dnbGUpIHtcblx0ICAgIHRvZ2dsZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMudG9nZ2xlLmJpbmQodGhpcykpO1xuXHQgIH0sIHRoaXMpO1xuXHR9XG5cblx0VG9nZ2xlRmFjdG9yeS5wcm90b3R5cGUgPSB7XG5cdCAgdG9nZ2xlOiBmdW5jdGlvbihldmVudCkge1xuXHQgICAgdmFyIHRhcmdldCA9IGV2ZW50LnRhcmdldDtcblxuXHQgICAgZG8ge1xuXHQgICAgICBpZiAodGFyZ2V0Lmhhc0F0dHJpYnV0ZSgnZGF0YS10b2dnbGUnKSkge1xuXHQgICAgICAgIHJldHVybiB0YXJnZXQuY2xhc3NMaXN0LnRvZ2dsZSgnYWN0aXZlJylcblx0ICAgICAgfVxuXHQgICAgfSB3aGlsZSgodGFyZ2V0ID0gdGFyZ2V0LnBhcmVudE5vZGUpICE9PSB0aGlzLmVsZW1lbnQpXG5cdCAgfVxuXHR9XG5cblxuLyoqKi8gfSxcbi8qIDggKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdHZhciBTaGVwaGVyZCA9IF9fd2VicGFja19yZXF1aXJlX18oOSk7XG5cblx0Ly8gQ3VzdG9tRXZlbnQgcG9seWZpbGwgZm9yIElFMTAvMTEgKGZyb20gZnJvbnRlbmQtdXRpbHMpXG5cdHZhciBDdXN0b21FdmVudCA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgcGFyYW1zKSB7XG5cdCAgdmFyIGV2ZW50UGFyYW1zID0geyBidWJibGVzOiBmYWxzZSwgY2FuY2VsYWJsZTogZmFsc2UsIGRldGFpbDogdW5kZWZpbmVkIH07XG5cblx0ICBmb3IgKHZhciBrZXkgaW4gcGFyYW1zKSB7XG5cdCAgICBpZiAocGFyYW1zLmhhc093blByb3BlcnR5KGtleSkpIHtcblx0ICAgICAgZXZlbnRQYXJhbXNba2V5XSA9IHBhcmFtc1trZXldO1xuXHQgICAgfVxuXHQgIH1cblxuXHQgIHZhciBjdXN0b21FdmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuXG5cdCAgY3VzdG9tRXZlbnQuaW5pdEN1c3RvbUV2ZW50KFxuXHQgICAgZXZlbnROYW1lLFxuXHQgICAgZXZlbnRQYXJhbXMuYnViYmxlcyxcblx0ICAgIGV2ZW50UGFyYW1zLmNhbmNlbGFibGUsXG5cdCAgICBldmVudFBhcmFtcy5kZXRhaWxcblx0ICApO1xuXG5cdCAgcmV0dXJuIGN1c3RvbUV2ZW50O1xuXHR9O1xuXG5cdHZhciBUb3VyRmFjdG9yeSA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWxlbWVudCkge1xuXHQgIHRoaXMucm9vdCA9IGVsZW1lbnQ7XG5cdCAgdGhpcy50b3VyRWxlbWVudHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkoZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS10b3VyXScpKTtcblxuXHQgIGlmICh0aGlzLnRvdXJFbGVtZW50cy5sZW5ndGggPiAwKSB7XG5cdCAgICB0aGlzLnRvdXJzID0ge307XG5cdCAgICB0aGlzLmN1cnJlbnRUb3VyTmFtZSA9IG51bGw7XG5cblx0ICAgIHRoaXMub3BlbmVycyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXRvdXItb3BlbmVyXScpKTtcblxuXHQgICAgdmFyIHRvdXJPdmVybGF5RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHQgICAgdG91ck92ZXJsYXlFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ3RvdXItb3ZlcmxheScsICdvdmVybGF5LWhpZGRlbicpO1xuXHQgICAgdGhpcy50b3VyT3ZlcmxheSA9IGVsZW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0b3VyT3ZlcmxheUVsZW1lbnQpO1xuXG5cdCAgICB0aGlzLmluaXRpYWxpemUoKTtcblxuXHQgICAgLy8gT3BlbiBhbGwgdG91cnMgd2l0aG91dCBvcGVuZXJzIGltbWVkaWF0ZWx5XG5cdCAgICBpZiAodGhpcy5vcGVuZXJzLmxlbmd0aCA8IHRoaXMudG91ckVsZW1lbnRzLmxlbmd0aCkge1xuXHQgICAgICB2YXIgdGhhdCA9IHRoaXM7XG5cdCAgICAgIHZhciBvcGVuZXJOYW1lcyA9IHRoYXQub3BlbmVycy5tYXAoZnVuY3Rpb24ob3BlbmVyKSB7IHJldHVybiBvcGVuZXIuZ2V0QXR0cmlidXRlKCdkYXRhLXRvdXItb3BlbmVyJyk7IH0pO1xuXG5cdCAgICAgIHRoYXQudG91ckVsZW1lbnRzLmZvckVhY2goZnVuY3Rpb24odG91ckVsZW1lbnQpIHtcblx0ICAgICAgICB2YXIgdG91ck5hbWUgPSB0b3VyRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdG91ci1uYW1lJyk7XG5cdCAgICAgICAgaWYgKCFvcGVuZXJOYW1lcy5pbmNsdWRlcyh0b3VyTmFtZSkpIHtcblx0ICAgICAgICAgIHRoYXQub3BlblRvdXIodG91ck5hbWUpO1xuXHQgICAgICAgIH1cblx0ICAgICAgfSk7XG5cdCAgICB9XG5cdCAgfVxuXHR9XG5cblx0VG91ckZhY3RvcnkucHJvdG90eXBlID0ge1xuXHQgIGluaXRpYWxpemU6IGZ1bmN0aW9uKCkge1xuXHQgICAgdmFyIHRoYXQgPSB0aGlzO1xuXG5cdCAgICB0aGF0LnRvdXJFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uKHRvdXJFbGVtZW50KSB7XG5cdCAgICAgIHRoYXQuaW5pdGlhbGl6ZVRvdXIodG91ckVsZW1lbnQpO1xuXHQgICAgfSk7XG5cblx0ICAgIHRoYXQuYXR0YWNoRXZlbnRzKCk7XG5cdCAgfSxcblx0ICBpbml0aWFsaXplVG91cjogZnVuY3Rpb24odG91ckVsZW1lbnQpIHtcblx0ICAgIHZhciB0aGF0ID0gdGhpcztcblx0ICAgIHZhciB0b3VyTmFtZSA9IHRvdXJFbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS10b3VyLW5hbWUnKTtcblxuXHQgICAgdmFyIHRvdXIgPSBuZXcgU2hlcGhlcmQuVG91cih7XG5cdCAgICAgIGRlZmF1bHRzOiB7XG5cdCAgICAgICAgc2hvd0NhbmNlbExpbms6IHRydWUsXG5cdCAgICAgICAgYnV0dG9uczogW1xuXHQgICAgICAgICAge1xuXHQgICAgICAgICAgICB0ZXh0OiB0b3VyRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdG91ci1za2lwJyksXG5cdCAgICAgICAgICAgIGNsYXNzZXM6ICdidG4tZGVmYXVsdCcsXG5cdCAgICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgICAgdGhhdC5jbG9zZVRvdXIodG91ck5hbWUpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICB9LFxuXHQgICAgICAgICAge1xuXHQgICAgICAgICAgICB0ZXh0OiB0b3VyRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdG91ci1uZXh0JyksXG5cdCAgICAgICAgICAgIGNsYXNzZXM6ICdidG4tcHJpbWFyeScsXG5cdCAgICAgICAgICAgIGFjdGlvbjogZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgICAgdGhhdC5jbGlja05leHQodG91ck5hbWUpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgXVxuXHQgICAgICB9XG5cdCAgICB9KTtcblxuXHQgICAgdGhhdC50b3Vyc1t0b3VyTmFtZV0gPSB7XG5cdCAgICAgIHRvdXI6IHRvdXIsXG5cdCAgICAgIG5hbWU6IHRvdXJOYW1lXG5cdCAgICB9O1xuXHQgICAgdGhhdC5hZGRTdGVwcyh0b3VyLCB0b3VyRWxlbWVudCk7XG5cdCAgfSxcblx0ICBhZGRTdGVwczogZnVuY3Rpb24odG91ciwgdG91ckVsZW1lbnQpIHtcblx0ICAgIHZhciB0aGF0ID0gdGhpcztcblxuXHQgICAgdmFyIHN0ZXBzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KHRvdXJFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLXRvdXItc3RlcF0nKSk7XG5cdCAgICB2YXIgc29ydGVkU3RlcHMgPSBzdGVwcy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcblx0ICAgICAgdmFyIHN0ZXBBID0gcGFyc2VJbnQoYS5nZXRBdHRyaWJ1dGUoJ2RhdGEtc3RlcC1udW1iZXInKSk7XG5cdCAgICAgIHZhciBzdGVwQiA9IHBhcnNlSW50KGIuZ2V0QXR0cmlidXRlKCdkYXRhLXN0ZXAtbnVtYmVyJykpO1xuXG5cdCAgICAgIGlmIChzdGVwQSA+IHN0ZXBCKSB7XG5cdCAgICAgICAgcmV0dXJuIDE7XG5cdCAgICAgIH0gZWxzZSBpZiAoc3RlcEEgPCBzdGVwQikge1xuXHQgICAgICAgIHJldHVybiAtMTtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICByZXR1cm4gMDtcblx0ICAgICAgfVxuXHQgICAgfSk7XG5cblx0ICAgIHNvcnRlZFN0ZXBzLmZvckVhY2goZnVuY3Rpb24oc3RlcCwgaW5kZXgpIHtcblx0ICAgICAgdmFyIHN0ZXBDb25maWcgPSB7XG5cdCAgICAgICAgdGl0bGU6IHN0ZXAuZ2V0QXR0cmlidXRlKCdkYXRhLXRpdGxlJykgfHwgJycsXG5cdCAgICAgICAgdGV4dDogc3RlcC5pbm5lckhUTUwsXG5cdCAgICAgIH07XG5cblx0ICAgICAgdmFyIGNsYXNzZXMgPSBzdGVwLmdldEF0dHJpYnV0ZSgnZGF0YS1jbGFzc2VzJykgfHwgJyc7XG5cblx0ICAgICAgdmFyIGF0dGFjaFRvRWxlbWVudCA9IHN0ZXAuZ2V0QXR0cmlidXRlKCdkYXRhLWF0dGFjaC10by1lbGVtZW50Jyk7XG5cdCAgICAgIHZhciBhdHRhY2hUb1Bvc2l0aW9uID0gc3RlcC5nZXRBdHRyaWJ1dGUoJ2RhdGEtYXR0YWNoLXRvLXBvc2l0aW9uJyk7XG5cdCAgICAgIHZhciBwb3NpdGlvbk9mZnNldCA9IHtcblx0ICAgICAgICBsZWZ0OiAnMCAyNXB4Jyxcblx0ICAgICAgICByaWdodDogJzAgLTI1cHgnLFxuXHQgICAgICAgIHRvcDogJzI1cHggMCcsXG5cdCAgICAgICAgYm90dG9tOiAnLTI1cHggMCdcblx0ICAgICAgfVthdHRhY2hUb1Bvc2l0aW9uXTtcblxuXHQgICAgICBpZiAoY2xhc3Nlcykge1xuXHQgICAgICAgIHN0ZXBDb25maWcuY2xhc3NlcyA9IGNsYXNzZXMuc3BsaXQoJyAnKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmIChhdHRhY2hUb0VsZW1lbnQgJiYgYXR0YWNoVG9Qb3NpdGlvbiAmJiBwb3NpdGlvbk9mZnNldCkge1xuXHQgICAgICAgIHN0ZXBDb25maWcuYXR0YWNoVG8gPSB7XG5cdCAgICAgICAgICBlbGVtZW50OiBhdHRhY2hUb0VsZW1lbnQsXG5cdCAgICAgICAgICBvbjogYXR0YWNoVG9Qb3NpdGlvblxuXHQgICAgICAgIH07XG5cblx0ICAgICAgICBzdGVwQ29uZmlnLnRldGhlck9wdGlvbnMgPSB7XG5cdCAgICAgICAgICBvZmZzZXQ6IHBvc2l0aW9uT2Zmc2V0XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKHNvcnRlZFN0ZXBzLmxlbmd0aCAtIDEgPT09IGluZGV4KSB7XG5cdCAgICAgICAgc3RlcENvbmZpZy5idXR0b25zID0gW1xuXHQgICAgICAgICAge1xuXHQgICAgICAgICAgICB0ZXh0OiB0b3VyRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdG91ci1kb25lJyksXG5cdCAgICAgICAgICAgIGNsYXNzZXM6ICdidG4tcHJpbWFyeScsXG5cdCAgICAgICAgICAgIGFjdGlvbjogdG91ci5jb21wbGV0ZVxuXHQgICAgICAgICAgfVxuXHQgICAgICAgIF07XG5cdCAgICAgIH1cblxuXHQgICAgICB0b3VyLmFkZFN0ZXAoc3RlcENvbmZpZyk7XG5cblx0ICAgICAgdG91ci5vbignYWN0aXZlJywgZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgdGhhdC50b3VyT3ZlcmxheS5jbGFzc0xpc3QucmVtb3ZlKCdvdmVybGF5LWhpZGRlbicpO1xuXHQgICAgICB9KTtcblxuXHQgICAgICB0b3VyLm9uKCdpbmFjdGl2ZScsIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIHRoYXQudG91ck92ZXJsYXkuY2xhc3NMaXN0LmFkZCgnb3ZlcmxheS1oaWRkZW4nKTtcblx0ICAgICAgfSk7XG5cdCAgICB9KTtcblx0ICB9LFxuXHQgIGF0dGFjaEV2ZW50czogZnVuY3Rpb24oKSB7XG5cdCAgICB2YXIgdGhhdCA9IHRoaXM7XG5cblx0ICAgIHRoYXQub3BlbmVycy5mb3JFYWNoKGZ1bmN0aW9uIChvcGVuZXIpIHtcblx0ICAgICAgb3BlbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhhdC5vcGVuVG91ci5iaW5kKHRoYXQsIG9wZW5lci5nZXRBdHRyaWJ1dGUoJ2RhdGEtdG91ci1vcGVuZXInKSkpO1xuXHQgICAgfSwgdGhhdCk7XG5cblx0ICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZnVuY3Rpb24oZXZlbnQpIHtcblx0ICAgICAgdmFyIGtleSA9IGV2ZW50LndoaWNoIHx8IGV2ZW50LmtleUNvZGU7XG5cblx0ICAgICAgaWYgKHRoYXQuY3VycmVudFRvdXJOYW1lID09PSBudWxsKSB7XG5cdCAgICAgICAgcmV0dXJuO1xuXHQgICAgICB9XG5cblx0ICAgICAgLy8gRVNDXG5cdCAgICAgIGlmIChrZXkgPT09IDI3KSB7XG5cdCAgICAgICAgdGhhdC5jbG9zZVRvdXIodGhhdC5jdXJyZW50VG91ck5hbWUpO1xuXHQgICAgICB9XG5cdCAgICB9KTtcblxuXHQgICAgdGhhdC50b3VyT3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHQgICAgICB0aGF0LmNsb3NlVG91cih0aGF0LmN1cnJlbnRUb3VyTmFtZSk7XG5cdCAgICB9KTtcblx0ICB9LFxuXHQgIG9wZW5Ub3VyOiBmdW5jdGlvbih0b3VyTmFtZSkge1xuXHQgICAgdmFyIHRvdXJPYmplY3QgPSB0aGlzLnRvdXJzW3RvdXJOYW1lXTtcblxuXHQgICAgdGhpcy5jdXJyZW50VG91ck5hbWUgPSB0b3VyT2JqZWN0Lm5hbWU7XG5cblx0ICAgIHRvdXJPYmplY3QudG91ci5zdGFydCgpO1xuXHQgICAgdGhpcy50b3VyT3ZlcmxheS5jbGFzc0xpc3QucmVtb3ZlKCd0b3VyLW92ZXJsYXktaGlkZGVuJyk7XG5cdCAgfSxcblx0ICBjbGlja05leHQ6IGZ1bmN0aW9uKHRvdXJOYW1lKSB7XG5cdCAgICB2YXIgdG91ck9iamVjdCA9IHRoaXMudG91cnNbdG91ck5hbWVdO1xuXHQgICAgdmFyIHBheWxvYWQgPSB7XG5cdCAgICAgIGN1cnJlbnRTdGVwOiB0b3VyT2JqZWN0LnRvdXIuZ2V0Q3VycmVudFN0ZXAoKS5pZC5yZXBsYWNlKCdzdGVwLScsICcnKSxcblx0ICAgICAgdG91ck5hbWU6IHRvdXJPYmplY3QubmFtZVxuXHQgICAgfTtcblxuXHQgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ25leHQnLCB7ICdkZXRhaWwnOiBwYXlsb2FkIH0pKTtcblx0ICAgIHRvdXJPYmplY3QudG91ci5uZXh0KCk7XG5cdCAgfSxcblx0ICBjbG9zZVRvdXI6IGZ1bmN0aW9uKHRvdXJOYW1lKSB7XG5cdCAgICB2YXIgdG91ck9iamVjdCA9IHRoaXMudG91cnNbdG91ck5hbWVdO1xuXHQgICAgdmFyIHBheWxvYWQgPSB7XG5cdCAgICAgIGN1cnJlbnRTdGVwOiB0b3VyT2JqZWN0LnRvdXIuZ2V0Q3VycmVudFN0ZXAoKS5pZC5yZXBsYWNlKCdzdGVwLScsICcnKSxcblx0ICAgICAgdG91ck5hbWU6IHRvdXJPYmplY3QubmFtZVxuXHQgICAgfTtcblxuXHQgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ2NhbmNlbCcsIHsgJ2RldGFpbCc6IHBheWxvYWQgfSkpO1xuXHQgICAgdG91ck9iamVjdC50b3VyLmNhbmNlbCgpO1xuXHQgIH1cblx0fTtcblxuXG4vKioqLyB9LFxuLyogOSAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0dmFyIF9fV0VCUEFDS19BTURfREVGSU5FX0ZBQ1RPUllfXywgX19XRUJQQUNLX0FNRF9ERUZJTkVfQVJSQVlfXywgX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX187LyohIHRldGhlci1zaGVwaGVyZCAxLjIuMCAqL1xuXG5cdChmdW5jdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdCAgaWYgKHRydWUpIHtcblx0ICAgICEoX19XRUJQQUNLX0FNRF9ERUZJTkVfQVJSQVlfXyA9IFtfX3dlYnBhY2tfcmVxdWlyZV9fKDEwKV0sIF9fV0VCUEFDS19BTURfREVGSU5FX0ZBQ1RPUllfXyA9IChmYWN0b3J5KSwgX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX18gPSAodHlwZW9mIF9fV0VCUEFDS19BTURfREVGSU5FX0ZBQ1RPUllfXyA9PT0gJ2Z1bmN0aW9uJyA/IChfX1dFQlBBQ0tfQU1EX0RFRklORV9GQUNUT1JZX18uYXBwbHkoZXhwb3J0cywgX19XRUJQQUNLX0FNRF9ERUZJTkVfQVJSQVlfXykpIDogX19XRUJQQUNLX0FNRF9ERUZJTkVfRkFDVE9SWV9fKSwgX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX18gIT09IHVuZGVmaW5lZCAmJiAobW9kdWxlLmV4cG9ydHMgPSBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXykpO1xuXHQgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgndGV0aGVyJykpO1xuXHQgIH0gZWxzZSB7XG5cdCAgICByb290LlNoZXBoZXJkID0gZmFjdG9yeShyb290LlRldGhlcik7XG5cdCAgfVxuXHR9KHRoaXMsIGZ1bmN0aW9uKFRldGhlcikge1xuXG5cdC8qIGdsb2JhbCBUZXRoZXIgKi9cblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoJ3ZhbHVlJyBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxuXHR2YXIgX2dldCA9IGZ1bmN0aW9uIGdldChfeDUsIF94NiwgX3g3KSB7IHZhciBfYWdhaW4gPSB0cnVlOyBfZnVuY3Rpb246IHdoaWxlIChfYWdhaW4pIHsgdmFyIG9iamVjdCA9IF94NSwgcHJvcGVydHkgPSBfeDYsIHJlY2VpdmVyID0gX3g3OyBkZXNjID0gcGFyZW50ID0gZ2V0dGVyID0gdW5kZWZpbmVkOyBfYWdhaW4gPSBmYWxzZTsgaWYgKG9iamVjdCA9PT0gbnVsbCkgb2JqZWN0ID0gRnVuY3Rpb24ucHJvdG90eXBlOyB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3Iob2JqZWN0LCBwcm9wZXJ0eSk7IGlmIChkZXNjID09PSB1bmRlZmluZWQpIHsgdmFyIHBhcmVudCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmplY3QpOyBpZiAocGFyZW50ID09PSBudWxsKSB7IHJldHVybiB1bmRlZmluZWQ7IH0gZWxzZSB7IF94NSA9IHBhcmVudDsgX3g2ID0gcHJvcGVydHk7IF94NyA9IHJlY2VpdmVyOyBfYWdhaW4gPSB0cnVlOyBjb250aW51ZSBfZnVuY3Rpb247IH0gfSBlbHNlIGlmICgndmFsdWUnIGluIGRlc2MpIHsgcmV0dXJuIGRlc2MudmFsdWU7IH0gZWxzZSB7IHZhciBnZXR0ZXIgPSBkZXNjLmdldDsgaWYgKGdldHRlciA9PT0gdW5kZWZpbmVkKSB7IHJldHVybiB1bmRlZmluZWQ7IH0gcmV0dXJuIGdldHRlci5jYWxsKHJlY2VpdmVyKTsgfSB9IH07XG5cblx0ZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cblx0ZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gJ2Z1bmN0aW9uJyAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ1N1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgJyArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxuXHR2YXIgX1RldGhlciRVdGlscyA9IFRldGhlci5VdGlscztcblx0dmFyIEV2ZW50ZWQgPSBfVGV0aGVyJFV0aWxzLkV2ZW50ZWQ7XG5cdHZhciBhZGRDbGFzcyA9IF9UZXRoZXIkVXRpbHMuYWRkQ2xhc3M7XG5cdHZhciBleHRlbmQgPSBfVGV0aGVyJFV0aWxzLmV4dGVuZDtcblx0dmFyIGhhc0NsYXNzID0gX1RldGhlciRVdGlscy5oYXNDbGFzcztcblx0dmFyIHJlbW92ZUNsYXNzID0gX1RldGhlciRVdGlscy5yZW1vdmVDbGFzcztcblx0dmFyIHVuaXF1ZUlkID0gX1RldGhlciRVdGlscy51bmlxdWVJZDtcblxuXHR2YXIgU2hlcGhlcmQgPSBuZXcgRXZlbnRlZCgpO1xuXG5cdHZhciBBVFRBQ0hNRU5UID0ge1xuXHQgICd0b3AnOiAnYm90dG9tIGNlbnRlcicsXG5cdCAgJ2xlZnQnOiAnbWlkZGxlIHJpZ2h0Jyxcblx0ICAncmlnaHQnOiAnbWlkZGxlIGxlZnQnLFxuXHQgICdib3R0b20nOiAndG9wIGNlbnRlcicsXG5cdCAgJ2NlbnRlcic6ICdtaWRkbGUgY2VudGVyJ1xuXHR9O1xuXG5cdGZ1bmN0aW9uIGNyZWF0ZUZyb21IVE1MKGh0bWwpIHtcblx0ICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0ICBlbC5pbm5lckhUTUwgPSBodG1sO1xuXHQgIHJldHVybiBlbC5jaGlsZHJlblswXTtcblx0fVxuXG5cdGZ1bmN0aW9uIG1hdGNoZXNTZWxlY3RvcihlbCwgc2VsKSB7XG5cdCAgdmFyIG1hdGNoZXMgPSB1bmRlZmluZWQ7XG5cdCAgaWYgKHR5cGVvZiBlbC5tYXRjaGVzICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgbWF0Y2hlcyA9IGVsLm1hdGNoZXM7XG5cdCAgfSBlbHNlIGlmICh0eXBlb2YgZWwubWF0Y2hlc1NlbGVjdG9yICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgbWF0Y2hlcyA9IGVsLm1hdGNoZXNTZWxlY3Rvcjtcblx0ICB9IGVsc2UgaWYgKHR5cGVvZiBlbC5tc01hdGNoZXNTZWxlY3RvciAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIG1hdGNoZXMgPSBlbC5tc01hdGNoZXNTZWxlY3Rvcjtcblx0ICB9IGVsc2UgaWYgKHR5cGVvZiBlbC53ZWJraXRNYXRjaGVzU2VsZWN0b3IgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICBtYXRjaGVzID0gZWwud2Via2l0TWF0Y2hlc1NlbGVjdG9yO1xuXHQgIH0gZWxzZSBpZiAodHlwZW9mIGVsLm1vek1hdGNoZXNTZWxlY3RvciAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIG1hdGNoZXMgPSBlbC5tb3pNYXRjaGVzU2VsZWN0b3I7XG5cdCAgfSBlbHNlIGlmICh0eXBlb2YgZWwub01hdGNoZXNTZWxlY3RvciAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIG1hdGNoZXMgPSBlbC5vTWF0Y2hlc1NlbGVjdG9yO1xuXHQgIH1cblx0ICByZXR1cm4gbWF0Y2hlcy5jYWxsKGVsLCBzZWwpO1xuXHR9XG5cblx0ZnVuY3Rpb24gcGFyc2VTaG9ydGhhbmQob2JqLCBwcm9wcykge1xuXHQgIGlmIChvYmogPT09IG51bGwgfHwgdHlwZW9mIG9iaiA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIHJldHVybiBvYmo7XG5cdCAgfSBlbHNlIGlmICh0eXBlb2Ygb2JqID09PSAnb2JqZWN0Jykge1xuXHQgICAgcmV0dXJuIG9iajtcblx0ICB9XG5cblx0ICB2YXIgdmFscyA9IG9iai5zcGxpdCgnICcpO1xuXHQgIHZhciB2YWxzTGVuID0gdmFscy5sZW5ndGg7XG5cdCAgdmFyIHByb3BzTGVuID0gcHJvcHMubGVuZ3RoO1xuXHQgIGlmICh2YWxzTGVuID4gcHJvcHNMZW4pIHtcblx0ICAgIHZhbHNbMF0gPSB2YWxzLnNsaWNlKDAsIHZhbHNMZW4gLSBwcm9wc0xlbiArIDEpLmpvaW4oJyAnKTtcblx0ICAgIHZhbHMuc3BsaWNlKDEsICh2YWxzTGVuLCBwcm9wc0xlbikpO1xuXHQgIH1cblxuXHQgIHZhciBvdXQgPSB7fTtcblx0ICBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzTGVuOyArK2kpIHtcblx0ICAgIHZhciBwcm9wID0gcHJvcHNbaV07XG5cdCAgICBvdXRbcHJvcF0gPSB2YWxzW2ldO1xuXHQgIH1cblxuXHQgIHJldHVybiBvdXQ7XG5cdH1cblxuXHR2YXIgU3RlcCA9IChmdW5jdGlvbiAoX0V2ZW50ZWQpIHtcblx0ICBfaW5oZXJpdHMoU3RlcCwgX0V2ZW50ZWQpO1xuXG5cdCAgZnVuY3Rpb24gU3RlcCh0b3VyLCBvcHRpb25zKSB7XG5cdCAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgU3RlcCk7XG5cblx0ICAgIF9nZXQoT2JqZWN0LmdldFByb3RvdHlwZU9mKFN0ZXAucHJvdG90eXBlKSwgJ2NvbnN0cnVjdG9yJywgdGhpcykuY2FsbCh0aGlzLCB0b3VyLCBvcHRpb25zKTtcblx0ICAgIHRoaXMudG91ciA9IHRvdXI7XG5cdCAgICB0aGlzLmJpbmRNZXRob2RzKCk7XG5cdCAgICB0aGlzLnNldE9wdGlvbnMob3B0aW9ucyk7XG5cdCAgICByZXR1cm4gdGhpcztcblx0ICB9XG5cblx0ICBfY3JlYXRlQ2xhc3MoU3RlcCwgW3tcblx0ICAgIGtleTogJ2JpbmRNZXRob2RzJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBiaW5kTWV0aG9kcygpIHtcblx0ICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuXHQgICAgICB2YXIgbWV0aG9kcyA9IFsnX3Nob3cnLCAnc2hvdycsICdoaWRlJywgJ2lzT3BlbicsICdjYW5jZWwnLCAnY29tcGxldGUnLCAnc2Nyb2xsVG8nLCAnZGVzdHJveSddO1xuXHQgICAgICBtZXRob2RzLm1hcChmdW5jdGlvbiAobWV0aG9kKSB7XG5cdCAgICAgICAgX3RoaXNbbWV0aG9kXSA9IF90aGlzW21ldGhvZF0uYmluZChfdGhpcyk7XG5cdCAgICAgIH0pO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ3NldE9wdGlvbnMnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIHNldE9wdGlvbnMoKSB7XG5cdCAgICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMF07XG5cblx0ICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcblx0ICAgICAgdGhpcy5kZXN0cm95KCk7XG5cblx0ICAgICAgdGhpcy5pZCA9IHRoaXMub3B0aW9ucy5pZCB8fCB0aGlzLmlkIHx8ICdzdGVwLScgKyB1bmlxdWVJZCgpO1xuXG5cdCAgICAgIHZhciB3aGVuID0gdGhpcy5vcHRpb25zLndoZW47XG5cdCAgICAgIGlmICh3aGVuKSB7XG5cdCAgICAgICAgZm9yICh2YXIgX2V2ZW50IGluIHdoZW4pIHtcblx0ICAgICAgICAgIGlmICgoe30pLmhhc093blByb3BlcnR5LmNhbGwod2hlbiwgX2V2ZW50KSkge1xuXHQgICAgICAgICAgICB2YXIgaGFuZGxlciA9IHdoZW5bX2V2ZW50XTtcblx0ICAgICAgICAgICAgdGhpcy5vbihfZXZlbnQsIGhhbmRsZXIsIHRoaXMpO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICghdGhpcy5vcHRpb25zLmJ1dHRvbnMpIHtcblx0ICAgICAgICB0aGlzLm9wdGlvbnMuYnV0dG9ucyA9IFt7XG5cdCAgICAgICAgICB0ZXh0OiAnTmV4dCcsXG5cdCAgICAgICAgICBhY3Rpb246IHRoaXMudG91ci5uZXh0XG5cdCAgICAgICAgfV07XG5cdCAgICAgIH1cblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdnZXRUb3VyJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRUb3VyKCkge1xuXHQgICAgICByZXR1cm4gdGhpcy50b3VyO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2JpbmRBZHZhbmNlJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBiaW5kQWR2YW5jZSgpIHtcblx0ICAgICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cblx0ICAgICAgLy8gQW4gZW1wdHkgc2VsZWN0b3IgbWF0Y2hlcyB0aGUgc3RlcCBlbGVtZW50XG5cblx0ICAgICAgdmFyIF9wYXJzZVNob3J0aGFuZCA9IHBhcnNlU2hvcnRoYW5kKHRoaXMub3B0aW9ucy5hZHZhbmNlT24sIFsnc2VsZWN0b3InLCAnZXZlbnQnXSk7XG5cblx0ICAgICAgdmFyIGV2ZW50ID0gX3BhcnNlU2hvcnRoYW5kLmV2ZW50O1xuXHQgICAgICB2YXIgc2VsZWN0b3IgPSBfcGFyc2VTaG9ydGhhbmQuc2VsZWN0b3I7XG5cblx0ICAgICAgdmFyIGhhbmRsZXIgPSBmdW5jdGlvbiBoYW5kbGVyKGUpIHtcblx0ICAgICAgICBpZiAoIV90aGlzMi5pc09wZW4oKSkge1xuXHQgICAgICAgICAgcmV0dXJuO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmICh0eXBlb2Ygc2VsZWN0b3IgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgICBpZiAobWF0Y2hlc1NlbGVjdG9yKGUudGFyZ2V0LCBzZWxlY3RvcikpIHtcblx0ICAgICAgICAgICAgX3RoaXMyLnRvdXIubmV4dCgpO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICBpZiAoX3RoaXMyLmVsICYmIGUudGFyZ2V0ID09PSBfdGhpczIuZWwpIHtcblx0ICAgICAgICAgICAgX3RoaXMyLnRvdXIubmV4dCgpO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgfTtcblxuXHQgICAgICAvLyBUT0RPOiB0aGlzIHNob3VsZCBhbHNvIGJpbmQvdW5iaW5kIG9uIHNob3cvaGlkZVxuXHQgICAgICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIpO1xuXHQgICAgICB0aGlzLm9uKCdkZXN0cm95JywgZnVuY3Rpb24gKCkge1xuXHQgICAgICAgIHJldHVybiBkb2N1bWVudC5ib2R5LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIpO1xuXHQgICAgICB9KTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdnZXRBdHRhY2hUbycsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0QXR0YWNoVG8oKSB7XG5cdCAgICAgIHZhciBvcHRzID0gcGFyc2VTaG9ydGhhbmQodGhpcy5vcHRpb25zLmF0dGFjaFRvLCBbJ2VsZW1lbnQnLCAnb24nXSkgfHwge307XG5cdCAgICAgIHZhciBzZWxlY3RvciA9IG9wdHMuZWxlbWVudDtcblxuXHQgICAgICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSAnc3RyaW5nJykge1xuXHQgICAgICAgIG9wdHMuZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuXG5cdCAgICAgICAgaWYgKCFvcHRzLmVsZW1lbnQpIHtcblx0ICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGVsZW1lbnQgZm9yIHRoaXMgU2hlcGhlcmQgc3RlcCB3YXMgbm90IGZvdW5kICcgKyBzZWxlY3Rvcik7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgcmV0dXJuIG9wdHM7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnc2V0dXBUZXRoZXInLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIHNldHVwVGV0aGVyKCkge1xuXHQgICAgICBpZiAodHlwZW9mIFRldGhlciA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVc2luZyB0aGUgYXR0YWNobWVudCBmZWF0dXJlIG9mIFNoZXBoZXJkIHJlcXVpcmVzIHRoZSBUZXRoZXIgbGlicmFyeVwiKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIHZhciBvcHRzID0gdGhpcy5nZXRBdHRhY2hUbygpO1xuXHQgICAgICB2YXIgYXR0YWNobWVudCA9IEFUVEFDSE1FTlRbb3B0cy5vbiB8fCAncmlnaHQnXTtcblx0ICAgICAgaWYgKHR5cGVvZiBvcHRzLmVsZW1lbnQgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgb3B0cy5lbGVtZW50ID0gJ3ZpZXdwb3J0Jztcblx0ICAgICAgICBhdHRhY2htZW50ID0gJ21pZGRsZSBjZW50ZXInO1xuXHQgICAgICB9XG5cblx0ICAgICAgdmFyIHRldGhlck9wdHMgPSB7XG5cdCAgICAgICAgY2xhc3NQcmVmaXg6ICdzaGVwaGVyZCcsXG5cdCAgICAgICAgZWxlbWVudDogdGhpcy5lbCxcblx0ICAgICAgICBjb25zdHJhaW50czogW3tcblx0ICAgICAgICAgIHRvOiAnd2luZG93Jyxcblx0ICAgICAgICAgIHBpbjogdHJ1ZSxcblx0ICAgICAgICAgIGF0dGFjaG1lbnQ6ICd0b2dldGhlcidcblx0ICAgICAgICB9XSxcblx0ICAgICAgICB0YXJnZXQ6IG9wdHMuZWxlbWVudCxcblx0ICAgICAgICBvZmZzZXQ6IG9wdHMub2Zmc2V0IHx8ICcwIDAnLFxuXHQgICAgICAgIGF0dGFjaG1lbnQ6IGF0dGFjaG1lbnRcblx0ICAgICAgfTtcblxuXHQgICAgICBpZiAodGhpcy50ZXRoZXIpIHtcblx0ICAgICAgICB0aGlzLnRldGhlci5kZXN0cm95KCk7XG5cdCAgICAgIH1cblxuXHQgICAgICB0aGlzLnRldGhlciA9IG5ldyBUZXRoZXIoZXh0ZW5kKHRldGhlck9wdHMsIHRoaXMub3B0aW9ucy50ZXRoZXJPcHRpb25zKSk7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnc2hvdycsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gc2hvdygpIHtcblx0ICAgICAgdmFyIF90aGlzMyA9IHRoaXM7XG5cblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMuYmVmb3JlU2hvd1Byb21pc2UgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgdmFyIGJlZm9yZVNob3dQcm9taXNlID0gdGhpcy5vcHRpb25zLmJlZm9yZVNob3dQcm9taXNlKCk7XG5cdCAgICAgICAgaWYgKHR5cGVvZiBiZWZvcmVTaG93UHJvbWlzZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICAgIHJldHVybiBiZWZvcmVTaG93UHJvbWlzZS50aGVuKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIF90aGlzMy5fc2hvdygpO1xuXHQgICAgICAgICAgfSk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cdCAgICAgIHRoaXMuX3Nob3coKTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdfc2hvdycsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gX3Nob3coKSB7XG5cdCAgICAgIHZhciBfdGhpczQgPSB0aGlzO1xuXG5cdCAgICAgIHRoaXMudHJpZ2dlcignYmVmb3JlLXNob3cnKTtcblxuXHQgICAgICBpZiAoIXRoaXMuZWwpIHtcblx0ICAgICAgICB0aGlzLnJlbmRlcigpO1xuXHQgICAgICB9XG5cblx0ICAgICAgYWRkQ2xhc3ModGhpcy5lbCwgJ3NoZXBoZXJkLW9wZW4nKTtcblxuXHQgICAgICBkb2N1bWVudC5ib2R5LnNldEF0dHJpYnV0ZSgnZGF0YS1zaGVwaGVyZC1zdGVwJywgdGhpcy5pZCk7XG5cblx0ICAgICAgdGhpcy5zZXR1cFRldGhlcigpO1xuXG5cdCAgICAgIGlmICh0aGlzLm9wdGlvbnMuc2Nyb2xsVG8pIHtcblx0ICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgIF90aGlzNC5zY3JvbGxUbygpO1xuXHQgICAgICAgIH0pO1xuXHQgICAgICB9XG5cblx0ICAgICAgdGhpcy50cmlnZ2VyKCdzaG93Jyk7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnaGlkZScsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gaGlkZSgpIHtcblx0ICAgICAgdGhpcy50cmlnZ2VyKCdiZWZvcmUtaGlkZScpO1xuXG5cdCAgICAgIHJlbW92ZUNsYXNzKHRoaXMuZWwsICdzaGVwaGVyZC1vcGVuJyk7XG5cblx0ICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtc2hlcGhlcmQtc3RlcCcpO1xuXG5cdCAgICAgIGlmICh0aGlzLnRldGhlcikge1xuXHQgICAgICAgIHRoaXMudGV0aGVyLmRlc3Ryb3koKTtcblx0ICAgICAgfVxuXHQgICAgICB0aGlzLnRldGhlciA9IG51bGw7XG5cblx0ICAgICAgdGhpcy50cmlnZ2VyKCdoaWRlJyk7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnaXNPcGVuJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBpc09wZW4oKSB7XG5cdCAgICAgIHJldHVybiBoYXNDbGFzcyh0aGlzLmVsLCAnc2hlcGhlcmQtb3BlbicpO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2NhbmNlbCcsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gY2FuY2VsKCkge1xuXHQgICAgICB0aGlzLnRvdXIuY2FuY2VsKCk7XG5cdCAgICAgIHRoaXMudHJpZ2dlcignY2FuY2VsJyk7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnY29tcGxldGUnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGNvbXBsZXRlKCkge1xuXHQgICAgICB0aGlzLnRvdXIuY29tcGxldGUoKTtcblx0ICAgICAgdGhpcy50cmlnZ2VyKCdjb21wbGV0ZScpO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ3Njcm9sbFRvJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBzY3JvbGxUbygpIHtcblx0ICAgICAgdmFyIF9nZXRBdHRhY2hUbyA9IHRoaXMuZ2V0QXR0YWNoVG8oKTtcblxuXHQgICAgICB2YXIgZWxlbWVudCA9IF9nZXRBdHRhY2hUby5lbGVtZW50O1xuXG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLnNjcm9sbFRvSGFuZGxlciAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICB0aGlzLm9wdGlvbnMuc2Nyb2xsVG9IYW5kbGVyKGVsZW1lbnQpO1xuXHQgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbGVtZW50ICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIGVsZW1lbnQuc2Nyb2xsSW50b1ZpZXcoKTtcblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2Rlc3Ryb3knLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5lbCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRoaXMuZWwpO1xuXHQgICAgICAgIGRlbGV0ZSB0aGlzLmVsO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKHRoaXMudGV0aGVyKSB7XG5cdCAgICAgICAgdGhpcy50ZXRoZXIuZGVzdHJveSgpO1xuXHQgICAgICB9XG5cdCAgICAgIHRoaXMudGV0aGVyID0gbnVsbDtcblxuXHQgICAgICB0aGlzLnRyaWdnZXIoJ2Rlc3Ryb3knKTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdyZW5kZXInLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIHJlbmRlcigpIHtcblx0ICAgICAgdmFyIF90aGlzNSA9IHRoaXM7XG5cblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLmVsICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIHRoaXMuZGVzdHJveSgpO1xuXHQgICAgICB9XG5cblx0ICAgICAgdGhpcy5lbCA9IGNyZWF0ZUZyb21IVE1MKCc8ZGl2IGNsYXNzPVxcJ3NoZXBoZXJkLXN0ZXAgJyArICh0aGlzLm9wdGlvbnMuY2xhc3NlcyB8fCAnJykgKyAnXFwnIGRhdGEtaWQ9XFwnJyArIHRoaXMuaWQgKyAnXFwnICcgKyAodGhpcy5vcHRpb25zLmlkQXR0cmlidXRlID8gJ2lkPVwiJyArIHRoaXMub3B0aW9ucy5pZEF0dHJpYnV0ZSArICdcIicgOiAnJykgKyAnPjwvZGl2PicpO1xuXG5cdCAgICAgIHZhciBjb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdCAgICAgIGNvbnRlbnQuY2xhc3NOYW1lID0gJ3NoZXBoZXJkLWNvbnRlbnQnO1xuXHQgICAgICB0aGlzLmVsLmFwcGVuZENoaWxkKGNvbnRlbnQpO1xuXG5cdCAgICAgIHZhciBoZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoZWFkZXInKTtcblx0ICAgICAgY29udGVudC5hcHBlbmRDaGlsZChoZWFkZXIpO1xuXG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLnRpdGxlICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIGhlYWRlci5pbm5lckhUTUwgKz0gJzxoMyBjbGFzcz1cXCdzaGVwaGVyZC10aXRsZVxcJz4nICsgdGhpcy5vcHRpb25zLnRpdGxlICsgJzwvaDM+Jztcblx0ICAgICAgICB0aGlzLmVsLmNsYXNzTmFtZSArPSAnIHNoZXBoZXJkLWhhcy10aXRsZSc7XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAodGhpcy5vcHRpb25zLnNob3dDYW5jZWxMaW5rKSB7XG5cdCAgICAgICAgdmFyIGxpbmsgPSBjcmVhdGVGcm9tSFRNTChcIjxhIGhyZWYgY2xhc3M9J3NoZXBoZXJkLWNhbmNlbC1saW5rJz7inJU8L2E+XCIpO1xuXHQgICAgICAgIGhlYWRlci5hcHBlbmRDaGlsZChsaW5rKTtcblxuXHQgICAgICAgIHRoaXMuZWwuY2xhc3NOYW1lICs9ICcgc2hlcGhlcmQtaGFzLWNhbmNlbC1saW5rJztcblxuXHQgICAgICAgIHRoaXMuYmluZENhbmNlbExpbmsobGluayk7XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy50ZXh0ICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIChmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICB2YXIgdGV4dCA9IGNyZWF0ZUZyb21IVE1MKFwiPGRpdiBjbGFzcz0nc2hlcGhlcmQtdGV4dCc+PC9kaXY+XCIpO1xuXHQgICAgICAgICAgdmFyIHBhcmFncmFwaHMgPSBfdGhpczUub3B0aW9ucy50ZXh0O1xuXG5cdCAgICAgICAgICBpZiAodHlwZW9mIHBhcmFncmFwaHMgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICAgICAgcGFyYWdyYXBocyA9IHBhcmFncmFwaHMuY2FsbChfdGhpczUsIHRleHQpO1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBpZiAocGFyYWdyYXBocyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG5cdCAgICAgICAgICAgIHRleHQuYXBwZW5kQ2hpbGQocGFyYWdyYXBocyk7XG5cdCAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFncmFwaHMgPT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgICAgICAgcGFyYWdyYXBocyA9IFtwYXJhZ3JhcGhzXTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHBhcmFncmFwaHMubWFwKGZ1bmN0aW9uIChwYXJhZ3JhcGgpIHtcblx0ICAgICAgICAgICAgICB0ZXh0LmlubmVySFRNTCArPSAnPHA+JyArIHBhcmFncmFwaCArICc8L3A+Jztcblx0ICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICB9XG5cblx0ICAgICAgICAgIGNvbnRlbnQuYXBwZW5kQ2hpbGQodGV4dCk7XG5cdCAgICAgICAgfSkoKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIHZhciBmb290ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdmb290ZXInKTtcblxuXHQgICAgICBpZiAodGhpcy5vcHRpb25zLmJ1dHRvbnMpIHtcblx0ICAgICAgICAoZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgdmFyIGJ1dHRvbnMgPSBjcmVhdGVGcm9tSFRNTChcIjx1bCBjbGFzcz0nc2hlcGhlcmQtYnV0dG9ucyc+PC91bD5cIik7XG5cblx0ICAgICAgICAgIF90aGlzNS5vcHRpb25zLmJ1dHRvbnMubWFwKGZ1bmN0aW9uIChjZmcpIHtcblx0ICAgICAgICAgICAgdmFyIGJ1dHRvbiA9IGNyZWF0ZUZyb21IVE1MKCc8bGk+PGEgY2xhc3M9XFwnc2hlcGhlcmQtYnV0dG9uICcgKyAoY2ZnLmNsYXNzZXMgfHwgJycpICsgJ1xcJz4nICsgY2ZnLnRleHQgKyAnPC9hPicpO1xuXHQgICAgICAgICAgICBidXR0b25zLmFwcGVuZENoaWxkKGJ1dHRvbik7XG5cdCAgICAgICAgICAgIF90aGlzNS5iaW5kQnV0dG9uRXZlbnRzKGNmZywgYnV0dG9uLnF1ZXJ5U2VsZWN0b3IoJ2EnKSk7XG5cdCAgICAgICAgICB9KTtcblxuXHQgICAgICAgICAgZm9vdGVyLmFwcGVuZENoaWxkKGJ1dHRvbnMpO1xuXHQgICAgICAgIH0pKCk7XG5cdCAgICAgIH1cblxuXHQgICAgICBjb250ZW50LmFwcGVuZENoaWxkKGZvb3Rlcik7XG5cblx0ICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmVsKTtcblxuXHQgICAgICB0aGlzLnNldHVwVGV0aGVyKCk7XG5cblx0ICAgICAgaWYgKHRoaXMub3B0aW9ucy5hZHZhbmNlT24pIHtcblx0ICAgICAgICB0aGlzLmJpbmRBZHZhbmNlKCk7XG5cdCAgICAgIH1cblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdiaW5kQ2FuY2VsTGluaycsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gYmluZENhbmNlbExpbmsobGluaykge1xuXHQgICAgICB2YXIgX3RoaXM2ID0gdGhpcztcblxuXHQgICAgICBsaW5rLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcblx0ICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cdCAgICAgICAgX3RoaXM2LmNhbmNlbCgpO1xuXHQgICAgICB9KTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdiaW5kQnV0dG9uRXZlbnRzJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBiaW5kQnV0dG9uRXZlbnRzKGNmZywgZWwpIHtcblx0ICAgICAgdmFyIF90aGlzNyA9IHRoaXM7XG5cblx0ICAgICAgY2ZnLmV2ZW50cyA9IGNmZy5ldmVudHMgfHwge307XG5cdCAgICAgIGlmICh0eXBlb2YgY2ZnLmFjdGlvbiAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICAvLyBJbmNsdWRpbmcgYm90aCBhIGNsaWNrIGV2ZW50IGFuZCBhbiBhY3Rpb24gaXMgbm90IHN1cHBvcnRlZFxuXHQgICAgICAgIGNmZy5ldmVudHMuY2xpY2sgPSBjZmcuYWN0aW9uO1xuXHQgICAgICB9XG5cblx0ICAgICAgZm9yICh2YXIgX2V2ZW50MiBpbiBjZmcuZXZlbnRzKSB7XG5cdCAgICAgICAgaWYgKCh7fSkuaGFzT3duUHJvcGVydHkuY2FsbChjZmcuZXZlbnRzLCBfZXZlbnQyKSkge1xuXHQgICAgICAgICAgdmFyIGhhbmRsZXIgPSBjZmcuZXZlbnRzW19ldmVudDJdO1xuXHQgICAgICAgICAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSAnc3RyaW5nJykge1xuXHQgICAgICAgICAgICAoZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgIHZhciBwYWdlID0gaGFuZGxlcjtcblx0ICAgICAgICAgICAgICBoYW5kbGVyID0gZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzNy50b3VyLnNob3cocGFnZSk7XG5cdCAgICAgICAgICAgICAgfTtcblx0ICAgICAgICAgICAgfSkoKTtcblx0ICAgICAgICAgIH1cblx0ICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoX2V2ZW50MiwgaGFuZGxlcik7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgdGhpcy5vbignZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICBmb3IgKHZhciBfZXZlbnQzIGluIGNmZy5ldmVudHMpIHtcblx0ICAgICAgICAgIGlmICgoe30pLmhhc093blByb3BlcnR5LmNhbGwoY2ZnLmV2ZW50cywgX2V2ZW50MykpIHtcblx0ICAgICAgICAgICAgdmFyIGhhbmRsZXIgPSBjZmcuZXZlbnRzW19ldmVudDNdO1xuXHQgICAgICAgICAgICBlbC5yZW1vdmVFdmVudExpc3RlbmVyKF9ldmVudDMsIGhhbmRsZXIpO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgfSk7XG5cdCAgICB9XG5cdCAgfV0pO1xuXG5cdCAgcmV0dXJuIFN0ZXA7XG5cdH0pKEV2ZW50ZWQpO1xuXG5cdHZhciBUb3VyID0gKGZ1bmN0aW9uIChfRXZlbnRlZDIpIHtcblx0ICBfaW5oZXJpdHMoVG91ciwgX0V2ZW50ZWQyKTtcblxuXHQgIGZ1bmN0aW9uIFRvdXIoKSB7XG5cdCAgICB2YXIgX3RoaXM4ID0gdGhpcztcblxuXHQgICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB7fSA6IGFyZ3VtZW50c1swXTtcblxuXHQgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFRvdXIpO1xuXG5cdCAgICBfZ2V0KE9iamVjdC5nZXRQcm90b3R5cGVPZihUb3VyLnByb3RvdHlwZSksICdjb25zdHJ1Y3RvcicsIHRoaXMpLmNhbGwodGhpcywgb3B0aW9ucyk7XG5cdCAgICB0aGlzLmJpbmRNZXRob2RzKCk7XG5cdCAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXHQgICAgdGhpcy5zdGVwcyA9IHRoaXMub3B0aW9ucy5zdGVwcyB8fCBbXTtcblxuXHQgICAgLy8gUGFzcyB0aGVzZSBldmVudHMgb250byB0aGUgZ2xvYmFsIFNoZXBoZXJkIG9iamVjdFxuXHQgICAgdmFyIGV2ZW50cyA9IFsnY29tcGxldGUnLCAnY2FuY2VsJywgJ2hpZGUnLCAnc3RhcnQnLCAnc2hvdycsICdhY3RpdmUnLCAnaW5hY3RpdmUnXTtcblx0ICAgIGV2ZW50cy5tYXAoZnVuY3Rpb24gKGV2ZW50KSB7XG5cdCAgICAgIChmdW5jdGlvbiAoZSkge1xuXHQgICAgICAgIF90aGlzOC5vbihlLCBmdW5jdGlvbiAob3B0cykge1xuXHQgICAgICAgICAgb3B0cyA9IG9wdHMgfHwge307XG5cdCAgICAgICAgICBvcHRzLnRvdXIgPSBfdGhpczg7XG5cdCAgICAgICAgICBTaGVwaGVyZC50cmlnZ2VyKGUsIG9wdHMpO1xuXHQgICAgICAgIH0pO1xuXHQgICAgICB9KShldmVudCk7XG5cdCAgICB9KTtcblxuXHQgICAgcmV0dXJuIHRoaXM7XG5cdCAgfVxuXG5cdCAgX2NyZWF0ZUNsYXNzKFRvdXIsIFt7XG5cdCAgICBrZXk6ICdiaW5kTWV0aG9kcycsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gYmluZE1ldGhvZHMoKSB7XG5cdCAgICAgIHZhciBfdGhpczkgPSB0aGlzO1xuXG5cdCAgICAgIHZhciBtZXRob2RzID0gWyduZXh0JywgJ2JhY2snLCAnY2FuY2VsJywgJ2NvbXBsZXRlJywgJ2hpZGUnXTtcblx0ICAgICAgbWV0aG9kcy5tYXAoZnVuY3Rpb24gKG1ldGhvZCkge1xuXHQgICAgICAgIF90aGlzOVttZXRob2RdID0gX3RoaXM5W21ldGhvZF0uYmluZChfdGhpczkpO1xuXHQgICAgICB9KTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdhZGRTdGVwJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBhZGRTdGVwKG5hbWUsIHN0ZXApIHtcblx0ICAgICAgaWYgKHR5cGVvZiBzdGVwID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIHN0ZXAgPSBuYW1lO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKCEoc3RlcCBpbnN0YW5jZW9mIFN0ZXApKSB7XG5cdCAgICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgbmFtZSA9PT0gJ251bWJlcicpIHtcblx0ICAgICAgICAgIHN0ZXAuaWQgPSBuYW1lLnRvU3RyaW5nKCk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHN0ZXAgPSBleHRlbmQoe30sIHRoaXMub3B0aW9ucy5kZWZhdWx0cywgc3RlcCk7XG5cdCAgICAgICAgc3RlcCA9IG5ldyBTdGVwKHRoaXMsIHN0ZXApO1xuXHQgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIHN0ZXAudG91ciA9IHRoaXM7XG5cdCAgICAgIH1cblxuXHQgICAgICB0aGlzLnN0ZXBzLnB1c2goc3RlcCk7XG5cdCAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2dldEJ5SWQnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGdldEJ5SWQoaWQpIHtcblx0ICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN0ZXBzLmxlbmd0aDsgKytpKSB7XG5cdCAgICAgICAgdmFyIHN0ZXAgPSB0aGlzLnN0ZXBzW2ldO1xuXHQgICAgICAgIGlmIChzdGVwLmlkID09PSBpZCkge1xuXHQgICAgICAgICAgcmV0dXJuIHN0ZXA7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnZ2V0Q3VycmVudFN0ZXAnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGdldEN1cnJlbnRTdGVwKCkge1xuXHQgICAgICByZXR1cm4gdGhpcy5jdXJyZW50U3RlcDtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICduZXh0Jyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBuZXh0KCkge1xuXHQgICAgICB2YXIgaW5kZXggPSB0aGlzLnN0ZXBzLmluZGV4T2YodGhpcy5jdXJyZW50U3RlcCk7XG5cblx0ICAgICAgaWYgKGluZGV4ID09PSB0aGlzLnN0ZXBzLmxlbmd0aCAtIDEpIHtcblx0ICAgICAgICB0aGlzLmhpZGUoaW5kZXgpO1xuXHQgICAgICAgIHRoaXMudHJpZ2dlcignY29tcGxldGUnKTtcblx0ICAgICAgICB0aGlzLmRvbmUoKTtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICB0aGlzLnNob3coaW5kZXggKyAxLCB0cnVlKTtcblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2JhY2snLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGJhY2soKSB7XG5cdCAgICAgIHZhciBpbmRleCA9IHRoaXMuc3RlcHMuaW5kZXhPZih0aGlzLmN1cnJlbnRTdGVwKTtcblx0ICAgICAgdGhpcy5zaG93KGluZGV4IC0gMSwgZmFsc2UpO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2NhbmNlbCcsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gY2FuY2VsKCkge1xuXHQgICAgICBpZiAodHlwZW9mIHRoaXMuY3VycmVudFN0ZXAgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgdGhpcy5jdXJyZW50U3RlcC5oaWRlKCk7XG5cdCAgICAgIH1cblx0ICAgICAgdGhpcy50cmlnZ2VyKCdjYW5jZWwnKTtcblx0ICAgICAgdGhpcy5kb25lKCk7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnY29tcGxldGUnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGNvbXBsZXRlKCkge1xuXHQgICAgICBpZiAodHlwZW9mIHRoaXMuY3VycmVudFN0ZXAgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgdGhpcy5jdXJyZW50U3RlcC5oaWRlKCk7XG5cdCAgICAgIH1cblx0ICAgICAgdGhpcy50cmlnZ2VyKCdjb21wbGV0ZScpO1xuXHQgICAgICB0aGlzLmRvbmUoKTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdoaWRlJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBoaWRlKCkge1xuXHQgICAgICBpZiAodHlwZW9mIHRoaXMuY3VycmVudFN0ZXAgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgdGhpcy5jdXJyZW50U3RlcC5oaWRlKCk7XG5cdCAgICAgIH1cblx0ICAgICAgdGhpcy50cmlnZ2VyKCdoaWRlJyk7XG5cdCAgICAgIHRoaXMuZG9uZSgpO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2RvbmUnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGRvbmUoKSB7XG5cdCAgICAgIFNoZXBoZXJkLmFjdGl2ZVRvdXIgPSBudWxsO1xuXHQgICAgICByZW1vdmVDbGFzcyhkb2N1bWVudC5ib2R5LCAnc2hlcGhlcmQtYWN0aXZlJyk7XG5cdCAgICAgIHRoaXMudHJpZ2dlcignaW5hY3RpdmUnLCB7IHRvdXI6IHRoaXMgfSk7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnc2hvdycsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gc2hvdygpIHtcblx0ICAgICAgdmFyIGtleSA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IDAgOiBhcmd1bWVudHNbMF07XG5cdCAgICAgIHZhciBmb3J3YXJkID0gYXJndW1lbnRzLmxlbmd0aCA8PSAxIHx8IGFyZ3VtZW50c1sxXSA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IGFyZ3VtZW50c1sxXTtcblxuXHQgICAgICBpZiAodGhpcy5jdXJyZW50U3RlcCkge1xuXHQgICAgICAgIHRoaXMuY3VycmVudFN0ZXAuaGlkZSgpO1xuXHQgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIGFkZENsYXNzKGRvY3VtZW50LmJvZHksICdzaGVwaGVyZC1hY3RpdmUnKTtcblx0ICAgICAgICB0aGlzLnRyaWdnZXIoJ2FjdGl2ZScsIHsgdG91cjogdGhpcyB9KTtcblx0ICAgICAgfVxuXG5cdCAgICAgIFNoZXBoZXJkLmFjdGl2ZVRvdXIgPSB0aGlzO1xuXG5cdCAgICAgIHZhciBuZXh0ID0gdW5kZWZpbmVkO1xuXG5cdCAgICAgIGlmICh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJykge1xuXHQgICAgICAgIG5leHQgPSB0aGlzLmdldEJ5SWQoa2V5KTtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICBuZXh0ID0gdGhpcy5zdGVwc1trZXldO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKG5leHQpIHtcblx0ICAgICAgICBpZiAodHlwZW9mIG5leHQub3B0aW9ucy5zaG93T24gIT09ICd1bmRlZmluZWQnICYmICFuZXh0Lm9wdGlvbnMuc2hvd09uKCkpIHtcblx0ICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuc3RlcHMuaW5kZXhPZihuZXh0KTtcblx0ICAgICAgICAgIHZhciBuZXh0SW5kZXggPSBmb3J3YXJkID8gaW5kZXggKyAxIDogaW5kZXggLSAxO1xuXHQgICAgICAgICAgdGhpcy5zaG93KG5leHRJbmRleCwgZm9yd2FyZCk7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgIHRoaXMudHJpZ2dlcignc2hvdycsIHtcblx0ICAgICAgICAgICAgc3RlcDogbmV4dCxcblx0ICAgICAgICAgICAgcHJldmlvdXM6IHRoaXMuY3VycmVudFN0ZXBcblx0ICAgICAgICAgIH0pO1xuXG5cdCAgICAgICAgICB0aGlzLmN1cnJlbnRTdGVwID0gbmV4dDtcblx0ICAgICAgICAgIG5leHQuc2hvdygpO1xuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ3N0YXJ0Jyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBzdGFydCgpIHtcblx0ICAgICAgdGhpcy50cmlnZ2VyKCdzdGFydCcpO1xuXG5cdCAgICAgIHRoaXMuY3VycmVudFN0ZXAgPSBudWxsO1xuXHQgICAgICB0aGlzLm5leHQoKTtcblx0ICAgIH1cblx0ICB9XSk7XG5cblx0ICByZXR1cm4gVG91cjtcblx0fSkoRXZlbnRlZCk7XG5cblx0ZXh0ZW5kKFNoZXBoZXJkLCB7IFRvdXI6IFRvdXIsIFN0ZXA6IFN0ZXAsIEV2ZW50ZWQ6IEV2ZW50ZWQgfSk7XG5cdHJldHVybiBTaGVwaGVyZDtcblxuXHR9KSk7XG5cblxuLyoqKi8gfSxcbi8qIDEwICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHR2YXIgX19XRUJQQUNLX0FNRF9ERUZJTkVfRkFDVE9SWV9fLCBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXzsvKiEgdGV0aGVyIDEuMi4yICovXG5cblx0KGZ1bmN0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblx0ICBpZiAodHJ1ZSkge1xuXHQgICAgIShfX1dFQlBBQ0tfQU1EX0RFRklORV9GQUNUT1JZX18gPSAoZmFjdG9yeSksIF9fV0VCUEFDS19BTURfREVGSU5FX1JFU1VMVF9fID0gKHR5cGVvZiBfX1dFQlBBQ0tfQU1EX0RFRklORV9GQUNUT1JZX18gPT09ICdmdW5jdGlvbicgPyAoX19XRUJQQUNLX0FNRF9ERUZJTkVfRkFDVE9SWV9fLmNhbGwoZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXywgZXhwb3J0cywgbW9kdWxlKSkgOiBfX1dFQlBBQ0tfQU1EX0RFRklORV9GQUNUT1JZX18pLCBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXyAhPT0gdW5kZWZpbmVkICYmIChtb2R1bGUuZXhwb3J0cyA9IF9fV0VCUEFDS19BTURfREVGSU5FX1JFU1VMVF9fKSk7XG5cdCAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlLCBleHBvcnRzLCBtb2R1bGUpO1xuXHQgIH0gZWxzZSB7XG5cdCAgICByb290LlRldGhlciA9IGZhY3RvcnkoKTtcblx0ICB9XG5cdH0odGhpcywgZnVuY3Rpb24ocmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKCd2YWx1ZScgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cblx0ZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cblx0dmFyIFRldGhlckJhc2UgPSB1bmRlZmluZWQ7XG5cdGlmICh0eXBlb2YgVGV0aGVyQmFzZSA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICBUZXRoZXJCYXNlID0geyBtb2R1bGVzOiBbXSB9O1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0U2Nyb2xsUGFyZW50KGVsKSB7XG5cdCAgLy8gSW4gZmlyZWZveCBpZiB0aGUgZWwgaXMgaW5zaWRlIGFuIGlmcmFtZSB3aXRoIGRpc3BsYXk6IG5vbmU7IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKCkgd2lsbCByZXR1cm4gbnVsbDtcblx0ICAvLyBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD01NDgzOTdcblx0ICB2YXIgY29tcHV0ZWRTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZWwpIHx8IHt9O1xuXHQgIHZhciBwb3NpdGlvbiA9IGNvbXB1dGVkU3R5bGUucG9zaXRpb247XG5cblx0ICBpZiAocG9zaXRpb24gPT09ICdmaXhlZCcpIHtcblx0ICAgIHJldHVybiBlbDtcblx0ICB9XG5cblx0ICB2YXIgcGFyZW50ID0gZWw7XG5cdCAgd2hpbGUgKHBhcmVudCA9IHBhcmVudC5wYXJlbnROb2RlKSB7XG5cdCAgICB2YXIgc3R5bGUgPSB1bmRlZmluZWQ7XG5cdCAgICB0cnkge1xuXHQgICAgICBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUocGFyZW50KTtcblx0ICAgIH0gY2F0Y2ggKGVycikge31cblxuXHQgICAgaWYgKHR5cGVvZiBzdHlsZSA9PT0gJ3VuZGVmaW5lZCcgfHwgc3R5bGUgPT09IG51bGwpIHtcblx0ICAgICAgcmV0dXJuIHBhcmVudDtcblx0ICAgIH1cblxuXHQgICAgdmFyIF9zdHlsZSA9IHN0eWxlO1xuXHQgICAgdmFyIG92ZXJmbG93ID0gX3N0eWxlLm92ZXJmbG93O1xuXHQgICAgdmFyIG92ZXJmbG93WCA9IF9zdHlsZS5vdmVyZmxvd1g7XG5cdCAgICB2YXIgb3ZlcmZsb3dZID0gX3N0eWxlLm92ZXJmbG93WTtcblxuXHQgICAgaWYgKC8oYXV0b3xzY3JvbGwpLy50ZXN0KG92ZXJmbG93ICsgb3ZlcmZsb3dZICsgb3ZlcmZsb3dYKSkge1xuXHQgICAgICBpZiAocG9zaXRpb24gIT09ICdhYnNvbHV0ZScgfHwgWydyZWxhdGl2ZScsICdhYnNvbHV0ZScsICdmaXhlZCddLmluZGV4T2Yoc3R5bGUucG9zaXRpb24pID49IDApIHtcblx0ICAgICAgICByZXR1cm4gcGFyZW50O1xuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfVxuXG5cdCAgcmV0dXJuIGRvY3VtZW50LmJvZHk7XG5cdH1cblxuXHR2YXIgdW5pcXVlSWQgPSAoZnVuY3Rpb24gKCkge1xuXHQgIHZhciBpZCA9IDA7XG5cdCAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcblx0ICAgIHJldHVybiArK2lkO1xuXHQgIH07XG5cdH0pKCk7XG5cblx0dmFyIHplcm9Qb3NDYWNoZSA9IHt9O1xuXHR2YXIgZ2V0T3JpZ2luID0gZnVuY3Rpb24gZ2V0T3JpZ2luKGRvYykge1xuXHQgIC8vIGdldEJvdW5kaW5nQ2xpZW50UmVjdCBpcyB1bmZvcnR1bmF0ZWx5IHRvbyBhY2N1cmF0ZS4gIEl0IGludHJvZHVjZXMgYSBwaXhlbCBvciB0d28gb2Zcblx0ICAvLyBqaXR0ZXIgYXMgdGhlIHVzZXIgc2Nyb2xscyB0aGF0IG1lc3NlcyB3aXRoIG91ciBhYmlsaXR5IHRvIGRldGVjdCBpZiB0d28gcG9zaXRpb25zXG5cdCAgLy8gYXJlIGVxdWl2aWxhbnQgb3Igbm90LiAgV2UgcGxhY2UgYW4gZWxlbWVudCBhdCB0aGUgdG9wIGxlZnQgb2YgdGhlIHBhZ2UgdGhhdCB3aWxsXG5cdCAgLy8gZ2V0IHRoZSBzYW1lIGppdHRlciwgc28gd2UgY2FuIGNhbmNlbCB0aGUgdHdvIG91dC5cblx0ICB2YXIgbm9kZSA9IGRvYy5fdGV0aGVyWmVyb0VsZW1lbnQ7XG5cdCAgaWYgKHR5cGVvZiBub2RlID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgbm9kZSA9IGRvYy5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0ICAgIG5vZGUuc2V0QXR0cmlidXRlKCdkYXRhLXRldGhlci1pZCcsIHVuaXF1ZUlkKCkpO1xuXHQgICAgZXh0ZW5kKG5vZGUuc3R5bGUsIHtcblx0ICAgICAgdG9wOiAwLFxuXHQgICAgICBsZWZ0OiAwLFxuXHQgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJ1xuXHQgICAgfSk7XG5cblx0ICAgIGRvYy5ib2R5LmFwcGVuZENoaWxkKG5vZGUpO1xuXG5cdCAgICBkb2MuX3RldGhlclplcm9FbGVtZW50ID0gbm9kZTtcblx0ICB9XG5cblx0ICB2YXIgaWQgPSBub2RlLmdldEF0dHJpYnV0ZSgnZGF0YS10ZXRoZXItaWQnKTtcblx0ICBpZiAodHlwZW9mIHplcm9Qb3NDYWNoZVtpZF0gPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICB6ZXJvUG9zQ2FjaGVbaWRdID0ge307XG5cblx0ICAgIHZhciByZWN0ID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblx0ICAgIGZvciAodmFyIGsgaW4gcmVjdCkge1xuXHQgICAgICAvLyBDYW4ndCB1c2UgZXh0ZW5kLCBhcyBvbiBJRTksIGVsZW1lbnRzIGRvbid0IHJlc29sdmUgdG8gYmUgaGFzT3duUHJvcGVydHlcblx0ICAgICAgemVyb1Bvc0NhY2hlW2lkXVtrXSA9IHJlY3Rba107XG5cdCAgICB9XG5cblx0ICAgIC8vIENsZWFyIHRoZSBjYWNoZSB3aGVuIHRoaXMgcG9zaXRpb24gY2FsbCBpcyBkb25lXG5cdCAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG5cdCAgICAgIGRlbGV0ZSB6ZXJvUG9zQ2FjaGVbaWRdO1xuXHQgICAgfSk7XG5cdCAgfVxuXG5cdCAgcmV0dXJuIHplcm9Qb3NDYWNoZVtpZF07XG5cdH07XG5cblx0ZnVuY3Rpb24gZ2V0Qm91bmRzKGVsKSB7XG5cdCAgdmFyIGRvYyA9IHVuZGVmaW5lZDtcblx0ICBpZiAoZWwgPT09IGRvY3VtZW50KSB7XG5cdCAgICBkb2MgPSBkb2N1bWVudDtcblx0ICAgIGVsID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuXHQgIH0gZWxzZSB7XG5cdCAgICBkb2MgPSBlbC5vd25lckRvY3VtZW50O1xuXHQgIH1cblxuXHQgIHZhciBkb2NFbCA9IGRvYy5kb2N1bWVudEVsZW1lbnQ7XG5cblx0ICB2YXIgYm94ID0ge307XG5cdCAgLy8gVGhlIG9yaWdpbmFsIG9iamVjdCByZXR1cm5lZCBieSBnZXRCb3VuZGluZ0NsaWVudFJlY3QgaXMgaW1tdXRhYmxlLCBzbyB3ZSBjbG9uZSBpdFxuXHQgIC8vIFdlIGNhbid0IHVzZSBleHRlbmQgYmVjYXVzZSB0aGUgcHJvcGVydGllcyBhcmUgbm90IGNvbnNpZGVyZWQgcGFydCBvZiB0aGUgb2JqZWN0IGJ5IGhhc093blByb3BlcnR5IGluIElFOVxuXHQgIHZhciByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdCAgZm9yICh2YXIgayBpbiByZWN0KSB7XG5cdCAgICBib3hba10gPSByZWN0W2tdO1xuXHQgIH1cblxuXHQgIHZhciBvcmlnaW4gPSBnZXRPcmlnaW4oZG9jKTtcblxuXHQgIGJveC50b3AgLT0gb3JpZ2luLnRvcDtcblx0ICBib3gubGVmdCAtPSBvcmlnaW4ubGVmdDtcblxuXHQgIGlmICh0eXBlb2YgYm94LndpZHRoID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgYm94LndpZHRoID0gZG9jdW1lbnQuYm9keS5zY3JvbGxXaWR0aCAtIGJveC5sZWZ0IC0gYm94LnJpZ2h0O1xuXHQgIH1cblx0ICBpZiAodHlwZW9mIGJveC5oZWlnaHQgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICBib3guaGVpZ2h0ID0gZG9jdW1lbnQuYm9keS5zY3JvbGxIZWlnaHQgLSBib3gudG9wIC0gYm94LmJvdHRvbTtcblx0ICB9XG5cblx0ICBib3gudG9wID0gYm94LnRvcCAtIGRvY0VsLmNsaWVudFRvcDtcblx0ICBib3gubGVmdCA9IGJveC5sZWZ0IC0gZG9jRWwuY2xpZW50TGVmdDtcblx0ICBib3gucmlnaHQgPSBkb2MuYm9keS5jbGllbnRXaWR0aCAtIGJveC53aWR0aCAtIGJveC5sZWZ0O1xuXHQgIGJveC5ib3R0b20gPSBkb2MuYm9keS5jbGllbnRIZWlnaHQgLSBib3guaGVpZ2h0IC0gYm94LnRvcDtcblxuXHQgIHJldHVybiBib3g7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRPZmZzZXRQYXJlbnQoZWwpIHtcblx0ICByZXR1cm4gZWwub2Zmc2V0UGFyZW50IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldFNjcm9sbEJhclNpemUoKSB7XG5cdCAgdmFyIGlubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdCAgaW5uZXIuc3R5bGUud2lkdGggPSAnMTAwJSc7XG5cdCAgaW5uZXIuc3R5bGUuaGVpZ2h0ID0gJzIwMHB4JztcblxuXHQgIHZhciBvdXRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHQgIGV4dGVuZChvdXRlci5zdHlsZSwge1xuXHQgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG5cdCAgICB0b3A6IDAsXG5cdCAgICBsZWZ0OiAwLFxuXHQgICAgcG9pbnRlckV2ZW50czogJ25vbmUnLFxuXHQgICAgdmlzaWJpbGl0eTogJ2hpZGRlbicsXG5cdCAgICB3aWR0aDogJzIwMHB4Jyxcblx0ICAgIGhlaWdodDogJzE1MHB4Jyxcblx0ICAgIG92ZXJmbG93OiAnaGlkZGVuJ1xuXHQgIH0pO1xuXG5cdCAgb3V0ZXIuYXBwZW5kQ2hpbGQoaW5uZXIpO1xuXG5cdCAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChvdXRlcik7XG5cblx0ICB2YXIgd2lkdGhDb250YWluZWQgPSBpbm5lci5vZmZzZXRXaWR0aDtcblx0ICBvdXRlci5zdHlsZS5vdmVyZmxvdyA9ICdzY3JvbGwnO1xuXHQgIHZhciB3aWR0aFNjcm9sbCA9IGlubmVyLm9mZnNldFdpZHRoO1xuXG5cdCAgaWYgKHdpZHRoQ29udGFpbmVkID09PSB3aWR0aFNjcm9sbCkge1xuXHQgICAgd2lkdGhTY3JvbGwgPSBvdXRlci5jbGllbnRXaWR0aDtcblx0ICB9XG5cblx0ICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKG91dGVyKTtcblxuXHQgIHZhciB3aWR0aCA9IHdpZHRoQ29udGFpbmVkIC0gd2lkdGhTY3JvbGw7XG5cblx0ICByZXR1cm4geyB3aWR0aDogd2lkdGgsIGhlaWdodDogd2lkdGggfTtcblx0fVxuXG5cdGZ1bmN0aW9uIGV4dGVuZCgpIHtcblx0ICB2YXIgb3V0ID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMF07XG5cblx0ICB2YXIgYXJncyA9IFtdO1xuXG5cdCAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoYXJncywgYXJndW1lbnRzKTtcblxuXHQgIGFyZ3Muc2xpY2UoMSkuZm9yRWFjaChmdW5jdGlvbiAob2JqKSB7XG5cdCAgICBpZiAob2JqKSB7XG5cdCAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcblx0ICAgICAgICBpZiAoKHt9KS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkge1xuXHQgICAgICAgICAgb3V0W2tleV0gPSBvYmpba2V5XTtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblx0ICAgIH1cblx0ICB9KTtcblxuXHQgIHJldHVybiBvdXQ7XG5cdH1cblxuXHRmdW5jdGlvbiByZW1vdmVDbGFzcyhlbCwgbmFtZSkge1xuXHQgIGlmICh0eXBlb2YgZWwuY2xhc3NMaXN0ICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgbmFtZS5zcGxpdCgnICcpLmZvckVhY2goZnVuY3Rpb24gKGNscykge1xuXHQgICAgICBpZiAoY2xzLnRyaW0oKSkge1xuXHQgICAgICAgIGVsLmNsYXNzTGlzdC5yZW1vdmUoY2xzKTtcblx0ICAgICAgfVxuXHQgICAgfSk7XG5cdCAgfSBlbHNlIHtcblx0ICAgIHZhciByZWdleCA9IG5ldyBSZWdFeHAoJyhefCApJyArIG5hbWUuc3BsaXQoJyAnKS5qb2luKCd8JykgKyAnKCB8JCknLCAnZ2knKTtcblx0ICAgIHZhciBjbGFzc05hbWUgPSBnZXRDbGFzc05hbWUoZWwpLnJlcGxhY2UocmVnZXgsICcgJyk7XG5cdCAgICBzZXRDbGFzc05hbWUoZWwsIGNsYXNzTmFtZSk7XG5cdCAgfVxuXHR9XG5cblx0ZnVuY3Rpb24gYWRkQ2xhc3MoZWwsIG5hbWUpIHtcblx0ICBpZiAodHlwZW9mIGVsLmNsYXNzTGlzdCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIG5hbWUuc3BsaXQoJyAnKS5mb3JFYWNoKGZ1bmN0aW9uIChjbHMpIHtcblx0ICAgICAgaWYgKGNscy50cmltKCkpIHtcblx0ICAgICAgICBlbC5jbGFzc0xpc3QuYWRkKGNscyk7XG5cdCAgICAgIH1cblx0ICAgIH0pO1xuXHQgIH0gZWxzZSB7XG5cdCAgICByZW1vdmVDbGFzcyhlbCwgbmFtZSk7XG5cdCAgICB2YXIgY2xzID0gZ2V0Q2xhc3NOYW1lKGVsKSArICgnICcgKyBuYW1lKTtcblx0ICAgIHNldENsYXNzTmFtZShlbCwgY2xzKTtcblx0ICB9XG5cdH1cblxuXHRmdW5jdGlvbiBoYXNDbGFzcyhlbCwgbmFtZSkge1xuXHQgIGlmICh0eXBlb2YgZWwuY2xhc3NMaXN0ICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgcmV0dXJuIGVsLmNsYXNzTGlzdC5jb250YWlucyhuYW1lKTtcblx0ICB9XG5cdCAgdmFyIGNsYXNzTmFtZSA9IGdldENsYXNzTmFtZShlbCk7XG5cdCAgcmV0dXJuIG5ldyBSZWdFeHAoJyhefCApJyArIG5hbWUgKyAnKCB8JCknLCAnZ2knKS50ZXN0KGNsYXNzTmFtZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRDbGFzc05hbWUoZWwpIHtcblx0ICBpZiAoZWwuY2xhc3NOYW1lIGluc3RhbmNlb2YgU1ZHQW5pbWF0ZWRTdHJpbmcpIHtcblx0ICAgIHJldHVybiBlbC5jbGFzc05hbWUuYmFzZVZhbDtcblx0ICB9XG5cdCAgcmV0dXJuIGVsLmNsYXNzTmFtZTtcblx0fVxuXG5cdGZ1bmN0aW9uIHNldENsYXNzTmFtZShlbCwgY2xhc3NOYW1lKSB7XG5cdCAgZWwuc2V0QXR0cmlidXRlKCdjbGFzcycsIGNsYXNzTmFtZSk7XG5cdH1cblxuXHRmdW5jdGlvbiB1cGRhdGVDbGFzc2VzKGVsLCBhZGQsIGFsbCkge1xuXHQgIC8vIE9mIHRoZSBzZXQgb2YgJ2FsbCcgY2xhc3Nlcywgd2UgbmVlZCB0aGUgJ2FkZCcgY2xhc3NlcywgYW5kIG9ubHkgdGhlXG5cdCAgLy8gJ2FkZCcgY2xhc3NlcyB0byBiZSBzZXQuXG5cdCAgYWxsLmZvckVhY2goZnVuY3Rpb24gKGNscykge1xuXHQgICAgaWYgKGFkZC5pbmRleE9mKGNscykgPT09IC0xICYmIGhhc0NsYXNzKGVsLCBjbHMpKSB7XG5cdCAgICAgIHJlbW92ZUNsYXNzKGVsLCBjbHMpO1xuXHQgICAgfVxuXHQgIH0pO1xuXG5cdCAgYWRkLmZvckVhY2goZnVuY3Rpb24gKGNscykge1xuXHQgICAgaWYgKCFoYXNDbGFzcyhlbCwgY2xzKSkge1xuXHQgICAgICBhZGRDbGFzcyhlbCwgY2xzKTtcblx0ICAgIH1cblx0ICB9KTtcblx0fVxuXG5cdHZhciBkZWZlcnJlZCA9IFtdO1xuXG5cdHZhciBkZWZlciA9IGZ1bmN0aW9uIGRlZmVyKGZuKSB7XG5cdCAgZGVmZXJyZWQucHVzaChmbik7XG5cdH07XG5cblx0dmFyIGZsdXNoID0gZnVuY3Rpb24gZmx1c2goKSB7XG5cdCAgdmFyIGZuID0gdW5kZWZpbmVkO1xuXHQgIHdoaWxlIChmbiA9IGRlZmVycmVkLnBvcCgpKSB7XG5cdCAgICBmbigpO1xuXHQgIH1cblx0fTtcblxuXHR2YXIgRXZlbnRlZCA9IChmdW5jdGlvbiAoKSB7XG5cdCAgZnVuY3Rpb24gRXZlbnRlZCgpIHtcblx0ICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBFdmVudGVkKTtcblx0ICB9XG5cblx0ICBfY3JlYXRlQ2xhc3MoRXZlbnRlZCwgW3tcblx0ICAgIGtleTogJ29uJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBvbihldmVudCwgaGFuZGxlciwgY3R4KSB7XG5cdCAgICAgIHZhciBvbmNlID0gYXJndW1lbnRzLmxlbmd0aCA8PSAzIHx8IGFyZ3VtZW50c1szXSA9PT0gdW5kZWZpbmVkID8gZmFsc2UgOiBhcmd1bWVudHNbM107XG5cblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLmJpbmRpbmdzID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIHRoaXMuYmluZGluZ3MgPSB7fTtcblx0ICAgICAgfVxuXHQgICAgICBpZiAodHlwZW9mIHRoaXMuYmluZGluZ3NbZXZlbnRdID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIHRoaXMuYmluZGluZ3NbZXZlbnRdID0gW107XG5cdCAgICAgIH1cblx0ICAgICAgdGhpcy5iaW5kaW5nc1tldmVudF0ucHVzaCh7IGhhbmRsZXI6IGhhbmRsZXIsIGN0eDogY3R4LCBvbmNlOiBvbmNlIH0pO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ29uY2UnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIG9uY2UoZXZlbnQsIGhhbmRsZXIsIGN0eCkge1xuXHQgICAgICB0aGlzLm9uKGV2ZW50LCBoYW5kbGVyLCBjdHgsIHRydWUpO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ29mZicsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gb2ZmKGV2ZW50LCBoYW5kbGVyKSB7XG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5iaW5kaW5ncyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHRoaXMuYmluZGluZ3NbZXZlbnRdICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIHJldHVybjtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICBkZWxldGUgdGhpcy5iaW5kaW5nc1tldmVudF07XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgdmFyIGkgPSAwO1xuXHQgICAgICAgIHdoaWxlIChpIDwgdGhpcy5iaW5kaW5nc1tldmVudF0ubGVuZ3RoKSB7XG5cdCAgICAgICAgICBpZiAodGhpcy5iaW5kaW5nc1tldmVudF1baV0uaGFuZGxlciA9PT0gaGFuZGxlcikge1xuXHQgICAgICAgICAgICB0aGlzLmJpbmRpbmdzW2V2ZW50XS5zcGxpY2UoaSwgMSk7XG5cdCAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICArK2k7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAndHJpZ2dlcicsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gdHJpZ2dlcihldmVudCkge1xuXHQgICAgICBpZiAodHlwZW9mIHRoaXMuYmluZGluZ3MgIT09ICd1bmRlZmluZWQnICYmIHRoaXMuYmluZGluZ3NbZXZlbnRdKSB7XG5cdCAgICAgICAgdmFyIGkgPSAwO1xuXG5cdCAgICAgICAgZm9yICh2YXIgX2xlbiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBBcnJheShfbGVuID4gMSA/IF9sZW4gLSAxIDogMCksIF9rZXkgPSAxOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG5cdCAgICAgICAgICBhcmdzW19rZXkgLSAxXSA9IGFyZ3VtZW50c1tfa2V5XTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB3aGlsZSAoaSA8IHRoaXMuYmluZGluZ3NbZXZlbnRdLmxlbmd0aCkge1xuXHQgICAgICAgICAgdmFyIF9iaW5kaW5ncyRldmVudCRpID0gdGhpcy5iaW5kaW5nc1tldmVudF1baV07XG5cdCAgICAgICAgICB2YXIgaGFuZGxlciA9IF9iaW5kaW5ncyRldmVudCRpLmhhbmRsZXI7XG5cdCAgICAgICAgICB2YXIgY3R4ID0gX2JpbmRpbmdzJGV2ZW50JGkuY3R4O1xuXHQgICAgICAgICAgdmFyIG9uY2UgPSBfYmluZGluZ3MkZXZlbnQkaS5vbmNlO1xuXG5cdCAgICAgICAgICB2YXIgY29udGV4dCA9IGN0eDtcblx0ICAgICAgICAgIGlmICh0eXBlb2YgY29udGV4dCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICAgICAgY29udGV4dCA9IHRoaXM7XG5cdCAgICAgICAgICB9XG5cblx0ICAgICAgICAgIGhhbmRsZXIuYXBwbHkoY29udGV4dCwgYXJncyk7XG5cblx0ICAgICAgICAgIGlmIChvbmNlKSB7XG5cdCAgICAgICAgICAgIHRoaXMuYmluZGluZ3NbZXZlbnRdLnNwbGljZShpLCAxKTtcblx0ICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICsraTtcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgIH1cblx0ICAgIH1cblx0ICB9XSk7XG5cblx0ICByZXR1cm4gRXZlbnRlZDtcblx0fSkoKTtcblxuXHRUZXRoZXJCYXNlLlV0aWxzID0ge1xuXHQgIGdldFNjcm9sbFBhcmVudDogZ2V0U2Nyb2xsUGFyZW50LFxuXHQgIGdldEJvdW5kczogZ2V0Qm91bmRzLFxuXHQgIGdldE9mZnNldFBhcmVudDogZ2V0T2Zmc2V0UGFyZW50LFxuXHQgIGV4dGVuZDogZXh0ZW5kLFxuXHQgIGFkZENsYXNzOiBhZGRDbGFzcyxcblx0ICByZW1vdmVDbGFzczogcmVtb3ZlQ2xhc3MsXG5cdCAgaGFzQ2xhc3M6IGhhc0NsYXNzLFxuXHQgIHVwZGF0ZUNsYXNzZXM6IHVwZGF0ZUNsYXNzZXMsXG5cdCAgZGVmZXI6IGRlZmVyLFxuXHQgIGZsdXNoOiBmbHVzaCxcblx0ICB1bmlxdWVJZDogdW5pcXVlSWQsXG5cdCAgRXZlbnRlZDogRXZlbnRlZCxcblx0ICBnZXRTY3JvbGxCYXJTaXplOiBnZXRTY3JvbGxCYXJTaXplXG5cdH07XG5cdC8qIGdsb2JhbHMgVGV0aGVyQmFzZSwgcGVyZm9ybWFuY2UgKi9cblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIF9zbGljZWRUb0FycmF5ID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gc2xpY2VJdGVyYXRvcihhcnIsIGkpIHsgdmFyIF9hcnIgPSBbXTsgdmFyIF9uID0gdHJ1ZTsgdmFyIF9kID0gZmFsc2U7IHZhciBfZSA9IHVuZGVmaW5lZDsgdHJ5IHsgZm9yICh2YXIgX2kgPSBhcnJbU3ltYm9sLml0ZXJhdG9yXSgpLCBfczsgIShfbiA9IChfcyA9IF9pLm5leHQoKSkuZG9uZSk7IF9uID0gdHJ1ZSkgeyBfYXJyLnB1c2goX3MudmFsdWUpOyBpZiAoaSAmJiBfYXJyLmxlbmd0aCA9PT0gaSkgYnJlYWs7IH0gfSBjYXRjaCAoZXJyKSB7IF9kID0gdHJ1ZTsgX2UgPSBlcnI7IH0gZmluYWxseSB7IHRyeSB7IGlmICghX24gJiYgX2lbJ3JldHVybiddKSBfaVsncmV0dXJuJ10oKTsgfSBmaW5hbGx5IHsgaWYgKF9kKSB0aHJvdyBfZTsgfSB9IHJldHVybiBfYXJyOyB9IHJldHVybiBmdW5jdGlvbiAoYXJyLCBpKSB7IGlmIChBcnJheS5pc0FycmF5KGFycikpIHsgcmV0dXJuIGFycjsgfSBlbHNlIGlmIChTeW1ib2wuaXRlcmF0b3IgaW4gT2JqZWN0KGFycikpIHsgcmV0dXJuIHNsaWNlSXRlcmF0b3IoYXJyLCBpKTsgfSBlbHNlIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBhdHRlbXB0IHRvIGRlc3RydWN0dXJlIG5vbi1pdGVyYWJsZSBpbnN0YW5jZScpOyB9IH07IH0pKCk7XG5cblx0dmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoJ3ZhbHVlJyBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxuXHRmdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxuXHRpZiAodHlwZW9mIFRldGhlckJhc2UgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgdGhyb3cgbmV3IEVycm9yKCdZb3UgbXVzdCBpbmNsdWRlIHRoZSB1dGlscy5qcyBmaWxlIGJlZm9yZSB0ZXRoZXIuanMnKTtcblx0fVxuXG5cdHZhciBfVGV0aGVyQmFzZSRVdGlscyA9IFRldGhlckJhc2UuVXRpbHM7XG5cdHZhciBnZXRTY3JvbGxQYXJlbnQgPSBfVGV0aGVyQmFzZSRVdGlscy5nZXRTY3JvbGxQYXJlbnQ7XG5cdHZhciBnZXRCb3VuZHMgPSBfVGV0aGVyQmFzZSRVdGlscy5nZXRCb3VuZHM7XG5cdHZhciBnZXRPZmZzZXRQYXJlbnQgPSBfVGV0aGVyQmFzZSRVdGlscy5nZXRPZmZzZXRQYXJlbnQ7XG5cdHZhciBleHRlbmQgPSBfVGV0aGVyQmFzZSRVdGlscy5leHRlbmQ7XG5cdHZhciBhZGRDbGFzcyA9IF9UZXRoZXJCYXNlJFV0aWxzLmFkZENsYXNzO1xuXHR2YXIgcmVtb3ZlQ2xhc3MgPSBfVGV0aGVyQmFzZSRVdGlscy5yZW1vdmVDbGFzcztcblx0dmFyIHVwZGF0ZUNsYXNzZXMgPSBfVGV0aGVyQmFzZSRVdGlscy51cGRhdGVDbGFzc2VzO1xuXHR2YXIgZGVmZXIgPSBfVGV0aGVyQmFzZSRVdGlscy5kZWZlcjtcblx0dmFyIGZsdXNoID0gX1RldGhlckJhc2UkVXRpbHMuZmx1c2g7XG5cdHZhciBnZXRTY3JvbGxCYXJTaXplID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0U2Nyb2xsQmFyU2l6ZTtcblxuXHRmdW5jdGlvbiB3aXRoaW4oYSwgYikge1xuXHQgIHZhciBkaWZmID0gYXJndW1lbnRzLmxlbmd0aCA8PSAyIHx8IGFyZ3VtZW50c1syXSA9PT0gdW5kZWZpbmVkID8gMSA6IGFyZ3VtZW50c1syXTtcblxuXHQgIHJldHVybiBhICsgZGlmZiA+PSBiICYmIGIgPj0gYSAtIGRpZmY7XG5cdH1cblxuXHR2YXIgdHJhbnNmb3JtS2V5ID0gKGZ1bmN0aW9uICgpIHtcblx0ICBpZiAodHlwZW9mIGRvY3VtZW50ID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgcmV0dXJuICcnO1xuXHQgIH1cblx0ICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuXHQgIHZhciB0cmFuc2Zvcm1zID0gWyd0cmFuc2Zvcm0nLCAnd2Via2l0VHJhbnNmb3JtJywgJ09UcmFuc2Zvcm0nLCAnTW96VHJhbnNmb3JtJywgJ21zVHJhbnNmb3JtJ107XG5cdCAgZm9yICh2YXIgaSA9IDA7IGkgPCB0cmFuc2Zvcm1zLmxlbmd0aDsgKytpKSB7XG5cdCAgICB2YXIga2V5ID0gdHJhbnNmb3Jtc1tpXTtcblx0ICAgIGlmIChlbC5zdHlsZVtrZXldICE9PSB1bmRlZmluZWQpIHtcblx0ICAgICAgcmV0dXJuIGtleTtcblx0ICAgIH1cblx0ICB9XG5cdH0pKCk7XG5cblx0dmFyIHRldGhlcnMgPSBbXTtcblxuXHR2YXIgcG9zaXRpb24gPSBmdW5jdGlvbiBwb3NpdGlvbigpIHtcblx0ICB0ZXRoZXJzLmZvckVhY2goZnVuY3Rpb24gKHRldGhlcikge1xuXHQgICAgdGV0aGVyLnBvc2l0aW9uKGZhbHNlKTtcblx0ICB9KTtcblx0ICBmbHVzaCgpO1xuXHR9O1xuXG5cdGZ1bmN0aW9uIG5vdygpIHtcblx0ICBpZiAodHlwZW9mIHBlcmZvcm1hbmNlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgcGVyZm9ybWFuY2Uubm93ICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgcmV0dXJuIHBlcmZvcm1hbmNlLm5vdygpO1xuXHQgIH1cblx0ICByZXR1cm4gK25ldyBEYXRlKCk7XG5cdH1cblxuXHQoZnVuY3Rpb24gKCkge1xuXHQgIHZhciBsYXN0Q2FsbCA9IG51bGw7XG5cdCAgdmFyIGxhc3REdXJhdGlvbiA9IG51bGw7XG5cdCAgdmFyIHBlbmRpbmdUaW1lb3V0ID0gbnVsbDtcblxuXHQgIHZhciB0aWNrID0gZnVuY3Rpb24gdGljaygpIHtcblx0ICAgIGlmICh0eXBlb2YgbGFzdER1cmF0aW9uICE9PSAndW5kZWZpbmVkJyAmJiBsYXN0RHVyYXRpb24gPiAxNikge1xuXHQgICAgICAvLyBXZSB2b2x1bnRhcmlseSB0aHJvdHRsZSBvdXJzZWx2ZXMgaWYgd2UgY2FuJ3QgbWFuYWdlIDYwZnBzXG5cdCAgICAgIGxhc3REdXJhdGlvbiA9IE1hdGgubWluKGxhc3REdXJhdGlvbiAtIDE2LCAyNTApO1xuXG5cdCAgICAgIC8vIEp1c3QgaW4gY2FzZSB0aGlzIGlzIHRoZSBsYXN0IGV2ZW50LCByZW1lbWJlciB0byBwb3NpdGlvbiBqdXN0IG9uY2UgbW9yZVxuXHQgICAgICBwZW5kaW5nVGltZW91dCA9IHNldFRpbWVvdXQodGljaywgMjUwKTtcblx0ICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXG5cdCAgICBpZiAodHlwZW9mIGxhc3RDYWxsICE9PSAndW5kZWZpbmVkJyAmJiBub3coKSAtIGxhc3RDYWxsIDwgMTApIHtcblx0ICAgICAgLy8gU29tZSBicm93c2VycyBjYWxsIGV2ZW50cyBhIGxpdHRsZSB0b28gZnJlcXVlbnRseSwgcmVmdXNlIHRvIHJ1biBtb3JlIHRoYW4gaXMgcmVhc29uYWJsZVxuXHQgICAgICByZXR1cm47XG5cdCAgICB9XG5cblx0ICAgIGlmICh0eXBlb2YgcGVuZGluZ1RpbWVvdXQgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgIGNsZWFyVGltZW91dChwZW5kaW5nVGltZW91dCk7XG5cdCAgICAgIHBlbmRpbmdUaW1lb3V0ID0gbnVsbDtcblx0ICAgIH1cblxuXHQgICAgbGFzdENhbGwgPSBub3coKTtcblx0ICAgIHBvc2l0aW9uKCk7XG5cdCAgICBsYXN0RHVyYXRpb24gPSBub3coKSAtIGxhc3RDYWxsO1xuXHQgIH07XG5cblx0ICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgWydyZXNpemUnLCAnc2Nyb2xsJywgJ3RvdWNobW92ZSddLmZvckVhY2goZnVuY3Rpb24gKGV2ZW50KSB7XG5cdCAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCB0aWNrKTtcblx0ICAgIH0pO1xuXHQgIH1cblx0fSkoKTtcblxuXHR2YXIgTUlSUk9SX0xSID0ge1xuXHQgIGNlbnRlcjogJ2NlbnRlcicsXG5cdCAgbGVmdDogJ3JpZ2h0Jyxcblx0ICByaWdodDogJ2xlZnQnXG5cdH07XG5cblx0dmFyIE1JUlJPUl9UQiA9IHtcblx0ICBtaWRkbGU6ICdtaWRkbGUnLFxuXHQgIHRvcDogJ2JvdHRvbScsXG5cdCAgYm90dG9tOiAndG9wJ1xuXHR9O1xuXG5cdHZhciBPRkZTRVRfTUFQID0ge1xuXHQgIHRvcDogMCxcblx0ICBsZWZ0OiAwLFxuXHQgIG1pZGRsZTogJzUwJScsXG5cdCAgY2VudGVyOiAnNTAlJyxcblx0ICBib3R0b206ICcxMDAlJyxcblx0ICByaWdodDogJzEwMCUnXG5cdH07XG5cblx0dmFyIGF1dG9Ub0ZpeGVkQXR0YWNobWVudCA9IGZ1bmN0aW9uIGF1dG9Ub0ZpeGVkQXR0YWNobWVudChhdHRhY2htZW50LCByZWxhdGl2ZVRvQXR0YWNobWVudCkge1xuXHQgIHZhciBsZWZ0ID0gYXR0YWNobWVudC5sZWZ0O1xuXHQgIHZhciB0b3AgPSBhdHRhY2htZW50LnRvcDtcblxuXHQgIGlmIChsZWZ0ID09PSAnYXV0bycpIHtcblx0ICAgIGxlZnQgPSBNSVJST1JfTFJbcmVsYXRpdmVUb0F0dGFjaG1lbnQubGVmdF07XG5cdCAgfVxuXG5cdCAgaWYgKHRvcCA9PT0gJ2F1dG8nKSB7XG5cdCAgICB0b3AgPSBNSVJST1JfVEJbcmVsYXRpdmVUb0F0dGFjaG1lbnQudG9wXTtcblx0ICB9XG5cblx0ICByZXR1cm4geyBsZWZ0OiBsZWZ0LCB0b3A6IHRvcCB9O1xuXHR9O1xuXG5cdHZhciBhdHRhY2htZW50VG9PZmZzZXQgPSBmdW5jdGlvbiBhdHRhY2htZW50VG9PZmZzZXQoYXR0YWNobWVudCkge1xuXHQgIHZhciBsZWZ0ID0gYXR0YWNobWVudC5sZWZ0O1xuXHQgIHZhciB0b3AgPSBhdHRhY2htZW50LnRvcDtcblxuXHQgIGlmICh0eXBlb2YgT0ZGU0VUX01BUFthdHRhY2htZW50LmxlZnRdICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgbGVmdCA9IE9GRlNFVF9NQVBbYXR0YWNobWVudC5sZWZ0XTtcblx0ICB9XG5cblx0ICBpZiAodHlwZW9mIE9GRlNFVF9NQVBbYXR0YWNobWVudC50b3BdICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgdG9wID0gT0ZGU0VUX01BUFthdHRhY2htZW50LnRvcF07XG5cdCAgfVxuXG5cdCAgcmV0dXJuIHsgbGVmdDogbGVmdCwgdG9wOiB0b3AgfTtcblx0fTtcblxuXHRmdW5jdGlvbiBhZGRPZmZzZXQoKSB7XG5cdCAgdmFyIG91dCA9IHsgdG9wOiAwLCBsZWZ0OiAwIH07XG5cblx0ICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgb2Zmc2V0cyA9IEFycmF5KF9sZW4pLCBfa2V5ID0gMDsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuXHQgICAgb2Zmc2V0c1tfa2V5XSA9IGFyZ3VtZW50c1tfa2V5XTtcblx0ICB9XG5cblx0ICBvZmZzZXRzLmZvckVhY2goZnVuY3Rpb24gKF9yZWYpIHtcblx0ICAgIHZhciB0b3AgPSBfcmVmLnRvcDtcblx0ICAgIHZhciBsZWZ0ID0gX3JlZi5sZWZ0O1xuXG5cdCAgICBpZiAodHlwZW9mIHRvcCA9PT0gJ3N0cmluZycpIHtcblx0ICAgICAgdG9wID0gcGFyc2VGbG9hdCh0b3AsIDEwKTtcblx0ICAgIH1cblx0ICAgIGlmICh0eXBlb2YgbGVmdCA9PT0gJ3N0cmluZycpIHtcblx0ICAgICAgbGVmdCA9IHBhcnNlRmxvYXQobGVmdCwgMTApO1xuXHQgICAgfVxuXG5cdCAgICBvdXQudG9wICs9IHRvcDtcblx0ICAgIG91dC5sZWZ0ICs9IGxlZnQ7XG5cdCAgfSk7XG5cblx0ICByZXR1cm4gb3V0O1xuXHR9XG5cblx0ZnVuY3Rpb24gb2Zmc2V0VG9QeChvZmZzZXQsIHNpemUpIHtcblx0ICBpZiAodHlwZW9mIG9mZnNldC5sZWZ0ID09PSAnc3RyaW5nJyAmJiBvZmZzZXQubGVmdC5pbmRleE9mKCclJykgIT09IC0xKSB7XG5cdCAgICBvZmZzZXQubGVmdCA9IHBhcnNlRmxvYXQob2Zmc2V0LmxlZnQsIDEwKSAvIDEwMCAqIHNpemUud2lkdGg7XG5cdCAgfVxuXHQgIGlmICh0eXBlb2Ygb2Zmc2V0LnRvcCA9PT0gJ3N0cmluZycgJiYgb2Zmc2V0LnRvcC5pbmRleE9mKCclJykgIT09IC0xKSB7XG5cdCAgICBvZmZzZXQudG9wID0gcGFyc2VGbG9hdChvZmZzZXQudG9wLCAxMCkgLyAxMDAgKiBzaXplLmhlaWdodDtcblx0ICB9XG5cblx0ICByZXR1cm4gb2Zmc2V0O1xuXHR9XG5cblx0dmFyIHBhcnNlT2Zmc2V0ID0gZnVuY3Rpb24gcGFyc2VPZmZzZXQodmFsdWUpIHtcblx0ICB2YXIgX3ZhbHVlJHNwbGl0ID0gdmFsdWUuc3BsaXQoJyAnKTtcblxuXHQgIHZhciBfdmFsdWUkc3BsaXQyID0gX3NsaWNlZFRvQXJyYXkoX3ZhbHVlJHNwbGl0LCAyKTtcblxuXHQgIHZhciB0b3AgPSBfdmFsdWUkc3BsaXQyWzBdO1xuXHQgIHZhciBsZWZ0ID0gX3ZhbHVlJHNwbGl0MlsxXTtcblxuXHQgIHJldHVybiB7IHRvcDogdG9wLCBsZWZ0OiBsZWZ0IH07XG5cdH07XG5cdHZhciBwYXJzZUF0dGFjaG1lbnQgPSBwYXJzZU9mZnNldDtcblxuXHR2YXIgVGV0aGVyQ2xhc3MgPSAoZnVuY3Rpb24gKCkge1xuXHQgIGZ1bmN0aW9uIFRldGhlckNsYXNzKG9wdGlvbnMpIHtcblx0ICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cblx0ICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBUZXRoZXJDbGFzcyk7XG5cblx0ICAgIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLmJpbmQodGhpcyk7XG5cblx0ICAgIHRldGhlcnMucHVzaCh0aGlzKTtcblxuXHQgICAgdGhpcy5oaXN0b3J5ID0gW107XG5cblx0ICAgIHRoaXMuc2V0T3B0aW9ucyhvcHRpb25zLCBmYWxzZSk7XG5cblx0ICAgIFRldGhlckJhc2UubW9kdWxlcy5mb3JFYWNoKGZ1bmN0aW9uIChtb2R1bGUpIHtcblx0ICAgICAgaWYgKHR5cGVvZiBtb2R1bGUuaW5pdGlhbGl6ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICBtb2R1bGUuaW5pdGlhbGl6ZS5jYWxsKF90aGlzKTtcblx0ICAgICAgfVxuXHQgICAgfSk7XG5cblx0ICAgIHRoaXMucG9zaXRpb24oKTtcblx0ICB9XG5cblx0ICBfY3JlYXRlQ2xhc3MoVGV0aGVyQ2xhc3MsIFt7XG5cdCAgICBrZXk6ICdnZXRDbGFzcycsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0Q2xhc3MoKSB7XG5cdCAgICAgIHZhciBrZXkgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyAnJyA6IGFyZ3VtZW50c1swXTtcblx0ICAgICAgdmFyIGNsYXNzZXMgPSB0aGlzLm9wdGlvbnMuY2xhc3NlcztcblxuXHQgICAgICBpZiAodHlwZW9mIGNsYXNzZXMgIT09ICd1bmRlZmluZWQnICYmIGNsYXNzZXNba2V5XSkge1xuXHQgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuY2xhc3Nlc1trZXldO1xuXHQgICAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5jbGFzc1ByZWZpeCkge1xuXHQgICAgICAgIHJldHVybiB0aGlzLm9wdGlvbnMuY2xhc3NQcmVmaXggKyAnLScgKyBrZXk7XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgcmV0dXJuIGtleTtcblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ3NldE9wdGlvbnMnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIHNldE9wdGlvbnMob3B0aW9ucykge1xuXHQgICAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuXHQgICAgICB2YXIgcG9zID0gYXJndW1lbnRzLmxlbmd0aCA8PSAxIHx8IGFyZ3VtZW50c1sxXSA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IGFyZ3VtZW50c1sxXTtcblxuXHQgICAgICB2YXIgZGVmYXVsdHMgPSB7XG5cdCAgICAgICAgb2Zmc2V0OiAnMCAwJyxcblx0ICAgICAgICB0YXJnZXRPZmZzZXQ6ICcwIDAnLFxuXHQgICAgICAgIHRhcmdldEF0dGFjaG1lbnQ6ICdhdXRvIGF1dG8nLFxuXHQgICAgICAgIGNsYXNzUHJlZml4OiAndGV0aGVyJ1xuXHQgICAgICB9O1xuXG5cdCAgICAgIHRoaXMub3B0aW9ucyA9IGV4dGVuZChkZWZhdWx0cywgb3B0aW9ucyk7XG5cblx0ICAgICAgdmFyIF9vcHRpb25zID0gdGhpcy5vcHRpb25zO1xuXHQgICAgICB2YXIgZWxlbWVudCA9IF9vcHRpb25zLmVsZW1lbnQ7XG5cdCAgICAgIHZhciB0YXJnZXQgPSBfb3B0aW9ucy50YXJnZXQ7XG5cdCAgICAgIHZhciB0YXJnZXRNb2RpZmllciA9IF9vcHRpb25zLnRhcmdldE1vZGlmaWVyO1xuXG5cdCAgICAgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG5cdCAgICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuXHQgICAgICB0aGlzLnRhcmdldE1vZGlmaWVyID0gdGFyZ2V0TW9kaWZpZXI7XG5cblx0ICAgICAgaWYgKHRoaXMudGFyZ2V0ID09PSAndmlld3BvcnQnKSB7XG5cdCAgICAgICAgdGhpcy50YXJnZXQgPSBkb2N1bWVudC5ib2R5O1xuXHQgICAgICAgIHRoaXMudGFyZ2V0TW9kaWZpZXIgPSAndmlzaWJsZSc7XG5cdCAgICAgIH0gZWxzZSBpZiAodGhpcy50YXJnZXQgPT09ICdzY3JvbGwtaGFuZGxlJykge1xuXHQgICAgICAgIHRoaXMudGFyZ2V0ID0gZG9jdW1lbnQuYm9keTtcblx0ICAgICAgICB0aGlzLnRhcmdldE1vZGlmaWVyID0gJ3Njcm9sbC1oYW5kbGUnO1xuXHQgICAgICB9XG5cblx0ICAgICAgWydlbGVtZW50JywgJ3RhcmdldCddLmZvckVhY2goZnVuY3Rpb24gKGtleSkge1xuXHQgICAgICAgIGlmICh0eXBlb2YgX3RoaXMyW2tleV0gPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RldGhlciBFcnJvcjogQm90aCBlbGVtZW50IGFuZCB0YXJnZXQgbXVzdCBiZSBkZWZpbmVkJyk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKHR5cGVvZiBfdGhpczJba2V5XS5qcXVlcnkgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgICBfdGhpczJba2V5XSA9IF90aGlzMltrZXldWzBdO1xuXHQgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIF90aGlzMltrZXldID09PSAnc3RyaW5nJykge1xuXHQgICAgICAgICAgX3RoaXMyW2tleV0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKF90aGlzMltrZXldKTtcblx0ICAgICAgICB9XG5cdCAgICAgIH0pO1xuXG5cdCAgICAgIGFkZENsYXNzKHRoaXMuZWxlbWVudCwgdGhpcy5nZXRDbGFzcygnZWxlbWVudCcpKTtcblx0ICAgICAgaWYgKCEodGhpcy5vcHRpb25zLmFkZFRhcmdldENsYXNzZXMgPT09IGZhbHNlKSkge1xuXHQgICAgICAgIGFkZENsYXNzKHRoaXMudGFyZ2V0LCB0aGlzLmdldENsYXNzKCd0YXJnZXQnKSk7XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAoIXRoaXMub3B0aW9ucy5hdHRhY2htZW50KSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUZXRoZXIgRXJyb3I6IFlvdSBtdXN0IHByb3ZpZGUgYW4gYXR0YWNobWVudCcpO1xuXHQgICAgICB9XG5cblx0ICAgICAgdGhpcy50YXJnZXRBdHRhY2htZW50ID0gcGFyc2VBdHRhY2htZW50KHRoaXMub3B0aW9ucy50YXJnZXRBdHRhY2htZW50KTtcblx0ICAgICAgdGhpcy5hdHRhY2htZW50ID0gcGFyc2VBdHRhY2htZW50KHRoaXMub3B0aW9ucy5hdHRhY2htZW50KTtcblx0ICAgICAgdGhpcy5vZmZzZXQgPSBwYXJzZU9mZnNldCh0aGlzLm9wdGlvbnMub2Zmc2V0KTtcblx0ICAgICAgdGhpcy50YXJnZXRPZmZzZXQgPSBwYXJzZU9mZnNldCh0aGlzLm9wdGlvbnMudGFyZ2V0T2Zmc2V0KTtcblxuXHQgICAgICBpZiAodHlwZW9mIHRoaXMuc2Nyb2xsUGFyZW50ICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIHRoaXMuZGlzYWJsZSgpO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKHRoaXMudGFyZ2V0TW9kaWZpZXIgPT09ICdzY3JvbGwtaGFuZGxlJykge1xuXHQgICAgICAgIHRoaXMuc2Nyb2xsUGFyZW50ID0gdGhpcy50YXJnZXQ7XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgdGhpcy5zY3JvbGxQYXJlbnQgPSBnZXRTY3JvbGxQYXJlbnQodGhpcy50YXJnZXQpO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKCEodGhpcy5vcHRpb25zLmVuYWJsZWQgPT09IGZhbHNlKSkge1xuXHQgICAgICAgIHRoaXMuZW5hYmxlKHBvcyk7XG5cdCAgICAgIH1cblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdnZXRUYXJnZXRCb3VuZHMnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGdldFRhcmdldEJvdW5kcygpIHtcblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLnRhcmdldE1vZGlmaWVyICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIGlmICh0aGlzLnRhcmdldE1vZGlmaWVyID09PSAndmlzaWJsZScpIHtcblx0ICAgICAgICAgIGlmICh0aGlzLnRhcmdldCA9PT0gZG9jdW1lbnQuYm9keSkge1xuXHQgICAgICAgICAgICByZXR1cm4geyB0b3A6IHBhZ2VZT2Zmc2V0LCBsZWZ0OiBwYWdlWE9mZnNldCwgaGVpZ2h0OiBpbm5lckhlaWdodCwgd2lkdGg6IGlubmVyV2lkdGggfTtcblx0ICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHZhciBib3VuZHMgPSBnZXRCb3VuZHModGhpcy50YXJnZXQpO1xuXG5cdCAgICAgICAgICAgIHZhciBvdXQgPSB7XG5cdCAgICAgICAgICAgICAgaGVpZ2h0OiBib3VuZHMuaGVpZ2h0LFxuXHQgICAgICAgICAgICAgIHdpZHRoOiBib3VuZHMud2lkdGgsXG5cdCAgICAgICAgICAgICAgdG9wOiBib3VuZHMudG9wLFxuXHQgICAgICAgICAgICAgIGxlZnQ6IGJvdW5kcy5sZWZ0XG5cdCAgICAgICAgICAgIH07XG5cblx0ICAgICAgICAgICAgb3V0LmhlaWdodCA9IE1hdGgubWluKG91dC5oZWlnaHQsIGJvdW5kcy5oZWlnaHQgLSAocGFnZVlPZmZzZXQgLSBib3VuZHMudG9wKSk7XG5cdCAgICAgICAgICAgIG91dC5oZWlnaHQgPSBNYXRoLm1pbihvdXQuaGVpZ2h0LCBib3VuZHMuaGVpZ2h0IC0gKGJvdW5kcy50b3AgKyBib3VuZHMuaGVpZ2h0IC0gKHBhZ2VZT2Zmc2V0ICsgaW5uZXJIZWlnaHQpKSk7XG5cdCAgICAgICAgICAgIG91dC5oZWlnaHQgPSBNYXRoLm1pbihpbm5lckhlaWdodCwgb3V0LmhlaWdodCk7XG5cdCAgICAgICAgICAgIG91dC5oZWlnaHQgLT0gMjtcblxuXHQgICAgICAgICAgICBvdXQud2lkdGggPSBNYXRoLm1pbihvdXQud2lkdGgsIGJvdW5kcy53aWR0aCAtIChwYWdlWE9mZnNldCAtIGJvdW5kcy5sZWZ0KSk7XG5cdCAgICAgICAgICAgIG91dC53aWR0aCA9IE1hdGgubWluKG91dC53aWR0aCwgYm91bmRzLndpZHRoIC0gKGJvdW5kcy5sZWZ0ICsgYm91bmRzLndpZHRoIC0gKHBhZ2VYT2Zmc2V0ICsgaW5uZXJXaWR0aCkpKTtcblx0ICAgICAgICAgICAgb3V0LndpZHRoID0gTWF0aC5taW4oaW5uZXJXaWR0aCwgb3V0LndpZHRoKTtcblx0ICAgICAgICAgICAgb3V0LndpZHRoIC09IDI7XG5cblx0ICAgICAgICAgICAgaWYgKG91dC50b3AgPCBwYWdlWU9mZnNldCkge1xuXHQgICAgICAgICAgICAgIG91dC50b3AgPSBwYWdlWU9mZnNldDtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBpZiAob3V0LmxlZnQgPCBwYWdlWE9mZnNldCkge1xuXHQgICAgICAgICAgICAgIG91dC5sZWZ0ID0gcGFnZVhPZmZzZXQ7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICByZXR1cm4gb3V0O1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH0gZWxzZSBpZiAodGhpcy50YXJnZXRNb2RpZmllciA9PT0gJ3Njcm9sbC1oYW5kbGUnKSB7XG5cdCAgICAgICAgICB2YXIgYm91bmRzID0gdW5kZWZpbmVkO1xuXHQgICAgICAgICAgdmFyIHRhcmdldCA9IHRoaXMudGFyZ2V0O1xuXHQgICAgICAgICAgaWYgKHRhcmdldCA9PT0gZG9jdW1lbnQuYm9keSkge1xuXHQgICAgICAgICAgICB0YXJnZXQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG5cblx0ICAgICAgICAgICAgYm91bmRzID0ge1xuXHQgICAgICAgICAgICAgIGxlZnQ6IHBhZ2VYT2Zmc2V0LFxuXHQgICAgICAgICAgICAgIHRvcDogcGFnZVlPZmZzZXQsXG5cdCAgICAgICAgICAgICAgaGVpZ2h0OiBpbm5lckhlaWdodCxcblx0ICAgICAgICAgICAgICB3aWR0aDogaW5uZXJXaWR0aFxuXHQgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgYm91bmRzID0gZ2V0Qm91bmRzKHRhcmdldCk7XG5cdCAgICAgICAgICB9XG5cblx0ICAgICAgICAgIHZhciBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUodGFyZ2V0KTtcblxuXHQgICAgICAgICAgdmFyIGhhc0JvdHRvbVNjcm9sbCA9IHRhcmdldC5zY3JvbGxXaWR0aCA+IHRhcmdldC5jbGllbnRXaWR0aCB8fCBbc3R5bGUub3ZlcmZsb3csIHN0eWxlLm92ZXJmbG93WF0uaW5kZXhPZignc2Nyb2xsJykgPj0gMCB8fCB0aGlzLnRhcmdldCAhPT0gZG9jdW1lbnQuYm9keTtcblxuXHQgICAgICAgICAgdmFyIHNjcm9sbEJvdHRvbSA9IDA7XG5cdCAgICAgICAgICBpZiAoaGFzQm90dG9tU2Nyb2xsKSB7XG5cdCAgICAgICAgICAgIHNjcm9sbEJvdHRvbSA9IDE1O1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICB2YXIgaGVpZ2h0ID0gYm91bmRzLmhlaWdodCAtIHBhcnNlRmxvYXQoc3R5bGUuYm9yZGVyVG9wV2lkdGgpIC0gcGFyc2VGbG9hdChzdHlsZS5ib3JkZXJCb3R0b21XaWR0aCkgLSBzY3JvbGxCb3R0b207XG5cblx0ICAgICAgICAgIHZhciBvdXQgPSB7XG5cdCAgICAgICAgICAgIHdpZHRoOiAxNSxcblx0ICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQgKiAwLjk3NSAqIChoZWlnaHQgLyB0YXJnZXQuc2Nyb2xsSGVpZ2h0KSxcblx0ICAgICAgICAgICAgbGVmdDogYm91bmRzLmxlZnQgKyBib3VuZHMud2lkdGggLSBwYXJzZUZsb2F0KHN0eWxlLmJvcmRlckxlZnRXaWR0aCkgLSAxNVxuXHQgICAgICAgICAgfTtcblxuXHQgICAgICAgICAgdmFyIGZpdEFkaiA9IDA7XG5cdCAgICAgICAgICBpZiAoaGVpZ2h0IDwgNDA4ICYmIHRoaXMudGFyZ2V0ID09PSBkb2N1bWVudC5ib2R5KSB7XG5cdCAgICAgICAgICAgIGZpdEFkaiA9IC0wLjAwMDExICogTWF0aC5wb3coaGVpZ2h0LCAyKSAtIDAuMDA3MjcgKiBoZWlnaHQgKyAyMi41ODtcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0ICE9PSBkb2N1bWVudC5ib2R5KSB7XG5cdCAgICAgICAgICAgIG91dC5oZWlnaHQgPSBNYXRoLm1heChvdXQuaGVpZ2h0LCAyNCk7XG5cdCAgICAgICAgICB9XG5cblx0ICAgICAgICAgIHZhciBzY3JvbGxQZXJjZW50YWdlID0gdGhpcy50YXJnZXQuc2Nyb2xsVG9wIC8gKHRhcmdldC5zY3JvbGxIZWlnaHQgLSBoZWlnaHQpO1xuXHQgICAgICAgICAgb3V0LnRvcCA9IHNjcm9sbFBlcmNlbnRhZ2UgKiAoaGVpZ2h0IC0gb3V0LmhlaWdodCAtIGZpdEFkaikgKyBib3VuZHMudG9wICsgcGFyc2VGbG9hdChzdHlsZS5ib3JkZXJUb3BXaWR0aCk7XG5cblx0ICAgICAgICAgIGlmICh0aGlzLnRhcmdldCA9PT0gZG9jdW1lbnQuYm9keSkge1xuXHQgICAgICAgICAgICBvdXQuaGVpZ2h0ID0gTWF0aC5tYXgob3V0LmhlaWdodCwgMjQpO1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICByZXR1cm4gb3V0O1xuXHQgICAgICAgIH1cblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICByZXR1cm4gZ2V0Qm91bmRzKHRoaXMudGFyZ2V0KTtcblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2NsZWFyQ2FjaGUnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGNsZWFyQ2FjaGUoKSB7XG5cdCAgICAgIHRoaXMuX2NhY2hlID0ge307XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnY2FjaGUnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGNhY2hlKGssIGdldHRlcikge1xuXHQgICAgICAvLyBNb3JlIHRoYW4gb25lIG1vZHVsZSB3aWxsIG9mdGVuIG5lZWQgdGhlIHNhbWUgRE9NIGluZm8sIHNvXG5cdCAgICAgIC8vIHdlIGtlZXAgYSBjYWNoZSB3aGljaCBpcyBjbGVhcmVkIG9uIGVhY2ggcG9zaXRpb24gY2FsbFxuXHQgICAgICBpZiAodHlwZW9mIHRoaXMuX2NhY2hlID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIHRoaXMuX2NhY2hlID0ge307XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAodHlwZW9mIHRoaXMuX2NhY2hlW2tdID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIHRoaXMuX2NhY2hlW2tdID0gZ2V0dGVyLmNhbGwodGhpcyk7XG5cdCAgICAgIH1cblxuXHQgICAgICByZXR1cm4gdGhpcy5fY2FjaGVba107XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnZW5hYmxlJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBlbmFibGUoKSB7XG5cdCAgICAgIHZhciBwb3MgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB0cnVlIDogYXJndW1lbnRzWzBdO1xuXG5cdCAgICAgIGlmICghKHRoaXMub3B0aW9ucy5hZGRUYXJnZXRDbGFzc2VzID09PSBmYWxzZSkpIHtcblx0ICAgICAgICBhZGRDbGFzcyh0aGlzLnRhcmdldCwgdGhpcy5nZXRDbGFzcygnZW5hYmxlZCcpKTtcblx0ICAgICAgfVxuXHQgICAgICBhZGRDbGFzcyh0aGlzLmVsZW1lbnQsIHRoaXMuZ2V0Q2xhc3MoJ2VuYWJsZWQnKSk7XG5cdCAgICAgIHRoaXMuZW5hYmxlZCA9IHRydWU7XG5cblx0ICAgICAgaWYgKHRoaXMuc2Nyb2xsUGFyZW50ICE9PSBkb2N1bWVudCkge1xuXHQgICAgICAgIHRoaXMuc2Nyb2xsUGFyZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIHRoaXMucG9zaXRpb24pO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKHBvcykge1xuXHQgICAgICAgIHRoaXMucG9zaXRpb24oKTtcblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2Rpc2FibGUnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGRpc2FibGUoKSB7XG5cdCAgICAgIHJlbW92ZUNsYXNzKHRoaXMudGFyZ2V0LCB0aGlzLmdldENsYXNzKCdlbmFibGVkJykpO1xuXHQgICAgICByZW1vdmVDbGFzcyh0aGlzLmVsZW1lbnQsIHRoaXMuZ2V0Q2xhc3MoJ2VuYWJsZWQnKSk7XG5cdCAgICAgIHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xuXG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5zY3JvbGxQYXJlbnQgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgdGhpcy5zY3JvbGxQYXJlbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgdGhpcy5wb3NpdGlvbik7XG5cdCAgICAgIH1cblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdkZXN0cm95Jyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBkZXN0cm95KCkge1xuXHQgICAgICB2YXIgX3RoaXMzID0gdGhpcztcblxuXHQgICAgICB0aGlzLmRpc2FibGUoKTtcblxuXHQgICAgICB0ZXRoZXJzLmZvckVhY2goZnVuY3Rpb24gKHRldGhlciwgaSkge1xuXHQgICAgICAgIGlmICh0ZXRoZXIgPT09IF90aGlzMykge1xuXHQgICAgICAgICAgdGV0aGVycy5zcGxpY2UoaSwgMSk7XG5cdCAgICAgICAgICByZXR1cm47XG5cdCAgICAgICAgfVxuXHQgICAgICB9KTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICd1cGRhdGVBdHRhY2hDbGFzc2VzJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiB1cGRhdGVBdHRhY2hDbGFzc2VzKGVsZW1lbnRBdHRhY2gsIHRhcmdldEF0dGFjaCkge1xuXHQgICAgICB2YXIgX3RoaXM0ID0gdGhpcztcblxuXHQgICAgICBlbGVtZW50QXR0YWNoID0gZWxlbWVudEF0dGFjaCB8fCB0aGlzLmF0dGFjaG1lbnQ7XG5cdCAgICAgIHRhcmdldEF0dGFjaCA9IHRhcmdldEF0dGFjaCB8fCB0aGlzLnRhcmdldEF0dGFjaG1lbnQ7XG5cdCAgICAgIHZhciBzaWRlcyA9IFsnbGVmdCcsICd0b3AnLCAnYm90dG9tJywgJ3JpZ2h0JywgJ21pZGRsZScsICdjZW50ZXInXTtcblxuXHQgICAgICBpZiAodHlwZW9mIHRoaXMuX2FkZEF0dGFjaENsYXNzZXMgIT09ICd1bmRlZmluZWQnICYmIHRoaXMuX2FkZEF0dGFjaENsYXNzZXMubGVuZ3RoKSB7XG5cdCAgICAgICAgLy8gdXBkYXRlQXR0YWNoQ2xhc3NlcyBjYW4gYmUgY2FsbGVkIG1vcmUgdGhhbiBvbmNlIGluIGEgcG9zaXRpb24gY2FsbCwgc29cblx0ICAgICAgICAvLyB3ZSBuZWVkIHRvIGNsZWFuIHVwIGFmdGVyIG91cnNlbHZlcyBzdWNoIHRoYXQgd2hlbiB0aGUgbGFzdCBkZWZlciBnZXRzXG5cdCAgICAgICAgLy8gcmFuIGl0IGRvZXNuJ3QgYWRkIGFueSBleHRyYSBjbGFzc2VzIGZyb20gcHJldmlvdXMgY2FsbHMuXG5cdCAgICAgICAgdGhpcy5fYWRkQXR0YWNoQ2xhc3Nlcy5zcGxpY2UoMCwgdGhpcy5fYWRkQXR0YWNoQ2xhc3Nlcy5sZW5ndGgpO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIHRoaXMuX2FkZEF0dGFjaENsYXNzZXMgPSBbXTtcblx0ICAgICAgfVxuXHQgICAgICB2YXIgYWRkID0gdGhpcy5fYWRkQXR0YWNoQ2xhc3NlcztcblxuXHQgICAgICBpZiAoZWxlbWVudEF0dGFjaC50b3ApIHtcblx0ICAgICAgICBhZGQucHVzaCh0aGlzLmdldENsYXNzKCdlbGVtZW50LWF0dGFjaGVkJykgKyAnLScgKyBlbGVtZW50QXR0YWNoLnRvcCk7XG5cdCAgICAgIH1cblx0ICAgICAgaWYgKGVsZW1lbnRBdHRhY2gubGVmdCkge1xuXHQgICAgICAgIGFkZC5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ2VsZW1lbnQtYXR0YWNoZWQnKSArICctJyArIGVsZW1lbnRBdHRhY2gubGVmdCk7XG5cdCAgICAgIH1cblx0ICAgICAgaWYgKHRhcmdldEF0dGFjaC50b3ApIHtcblx0ICAgICAgICBhZGQucHVzaCh0aGlzLmdldENsYXNzKCd0YXJnZXQtYXR0YWNoZWQnKSArICctJyArIHRhcmdldEF0dGFjaC50b3ApO1xuXHQgICAgICB9XG5cdCAgICAgIGlmICh0YXJnZXRBdHRhY2gubGVmdCkge1xuXHQgICAgICAgIGFkZC5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ3RhcmdldC1hdHRhY2hlZCcpICsgJy0nICsgdGFyZ2V0QXR0YWNoLmxlZnQpO1xuXHQgICAgICB9XG5cblx0ICAgICAgdmFyIGFsbCA9IFtdO1xuXHQgICAgICBzaWRlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG5cdCAgICAgICAgYWxsLnB1c2goX3RoaXM0LmdldENsYXNzKCdlbGVtZW50LWF0dGFjaGVkJykgKyAnLScgKyBzaWRlKTtcblx0ICAgICAgICBhbGwucHVzaChfdGhpczQuZ2V0Q2xhc3MoJ3RhcmdldC1hdHRhY2hlZCcpICsgJy0nICsgc2lkZSk7XG5cdCAgICAgIH0pO1xuXG5cdCAgICAgIGRlZmVyKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICBpZiAoISh0eXBlb2YgX3RoaXM0Ll9hZGRBdHRhY2hDbGFzc2VzICE9PSAndW5kZWZpbmVkJykpIHtcblx0ICAgICAgICAgIHJldHVybjtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB1cGRhdGVDbGFzc2VzKF90aGlzNC5lbGVtZW50LCBfdGhpczQuX2FkZEF0dGFjaENsYXNzZXMsIGFsbCk7XG5cdCAgICAgICAgaWYgKCEoX3RoaXM0Lm9wdGlvbnMuYWRkVGFyZ2V0Q2xhc3NlcyA9PT0gZmFsc2UpKSB7XG5cdCAgICAgICAgICB1cGRhdGVDbGFzc2VzKF90aGlzNC50YXJnZXQsIF90aGlzNC5fYWRkQXR0YWNoQ2xhc3NlcywgYWxsKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBkZWxldGUgX3RoaXM0Ll9hZGRBdHRhY2hDbGFzc2VzO1xuXHQgICAgICB9KTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdwb3NpdGlvbicsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gcG9zaXRpb24oKSB7XG5cdCAgICAgIHZhciBfdGhpczUgPSB0aGlzO1xuXG5cdCAgICAgIHZhciBmbHVzaENoYW5nZXMgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB0cnVlIDogYXJndW1lbnRzWzBdO1xuXG5cdCAgICAgIC8vIGZsdXNoQ2hhbmdlcyBjb21taXRzIHRoZSBjaGFuZ2VzIGltbWVkaWF0ZWx5LCBsZWF2ZSB0cnVlIHVubGVzcyB5b3UgYXJlIHBvc2l0aW9uaW5nIG11bHRpcGxlXG5cdCAgICAgIC8vIHRldGhlcnMgKGluIHdoaWNoIGNhc2UgY2FsbCBUZXRoZXIuVXRpbHMuZmx1c2ggeW91cnNlbGYgd2hlbiB5b3UncmUgZG9uZSlcblxuXHQgICAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xuXHQgICAgICAgIHJldHVybjtcblx0ICAgICAgfVxuXG5cdCAgICAgIHRoaXMuY2xlYXJDYWNoZSgpO1xuXG5cdCAgICAgIC8vIFR1cm4gJ2F1dG8nIGF0dGFjaG1lbnRzIGludG8gdGhlIGFwcHJvcHJpYXRlIGNvcm5lciBvciBlZGdlXG5cdCAgICAgIHZhciB0YXJnZXRBdHRhY2htZW50ID0gYXV0b1RvRml4ZWRBdHRhY2htZW50KHRoaXMudGFyZ2V0QXR0YWNobWVudCwgdGhpcy5hdHRhY2htZW50KTtcblxuXHQgICAgICB0aGlzLnVwZGF0ZUF0dGFjaENsYXNzZXModGhpcy5hdHRhY2htZW50LCB0YXJnZXRBdHRhY2htZW50KTtcblxuXHQgICAgICB2YXIgZWxlbWVudFBvcyA9IHRoaXMuY2FjaGUoJ2VsZW1lbnQtYm91bmRzJywgZnVuY3Rpb24gKCkge1xuXHQgICAgICAgIHJldHVybiBnZXRCb3VuZHMoX3RoaXM1LmVsZW1lbnQpO1xuXHQgICAgICB9KTtcblxuXHQgICAgICB2YXIgd2lkdGggPSBlbGVtZW50UG9zLndpZHRoO1xuXHQgICAgICB2YXIgaGVpZ2h0ID0gZWxlbWVudFBvcy5oZWlnaHQ7XG5cblx0ICAgICAgaWYgKHdpZHRoID09PSAwICYmIGhlaWdodCA9PT0gMCAmJiB0eXBlb2YgdGhpcy5sYXN0U2l6ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICB2YXIgX2xhc3RTaXplID0gdGhpcy5sYXN0U2l6ZTtcblxuXHQgICAgICAgIC8vIFdlIGNhY2hlIHRoZSBoZWlnaHQgYW5kIHdpZHRoIHRvIG1ha2UgaXQgcG9zc2libGUgdG8gcG9zaXRpb24gZWxlbWVudHMgdGhhdCBhcmVcblx0ICAgICAgICAvLyBnZXR0aW5nIGhpZGRlbi5cblx0ICAgICAgICB3aWR0aCA9IF9sYXN0U2l6ZS53aWR0aDtcblx0ICAgICAgICBoZWlnaHQgPSBfbGFzdFNpemUuaGVpZ2h0O1xuXHQgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIHRoaXMubGFzdFNpemUgPSB7IHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHQgfTtcblx0ICAgICAgfVxuXG5cdCAgICAgIHZhciB0YXJnZXRQb3MgPSB0aGlzLmNhY2hlKCd0YXJnZXQtYm91bmRzJywgZnVuY3Rpb24gKCkge1xuXHQgICAgICAgIHJldHVybiBfdGhpczUuZ2V0VGFyZ2V0Qm91bmRzKCk7XG5cdCAgICAgIH0pO1xuXHQgICAgICB2YXIgdGFyZ2V0U2l6ZSA9IHRhcmdldFBvcztcblxuXHQgICAgICAvLyBHZXQgYW4gYWN0dWFsIHB4IG9mZnNldCBmcm9tIHRoZSBhdHRhY2htZW50XG5cdCAgICAgIHZhciBvZmZzZXQgPSBvZmZzZXRUb1B4KGF0dGFjaG1lbnRUb09mZnNldCh0aGlzLmF0dGFjaG1lbnQpLCB7IHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHQgfSk7XG5cdCAgICAgIHZhciB0YXJnZXRPZmZzZXQgPSBvZmZzZXRUb1B4KGF0dGFjaG1lbnRUb09mZnNldCh0YXJnZXRBdHRhY2htZW50KSwgdGFyZ2V0U2l6ZSk7XG5cblx0ICAgICAgdmFyIG1hbnVhbE9mZnNldCA9IG9mZnNldFRvUHgodGhpcy5vZmZzZXQsIHsgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodCB9KTtcblx0ICAgICAgdmFyIG1hbnVhbFRhcmdldE9mZnNldCA9IG9mZnNldFRvUHgodGhpcy50YXJnZXRPZmZzZXQsIHRhcmdldFNpemUpO1xuXG5cdCAgICAgIC8vIEFkZCB0aGUgbWFudWFsbHkgcHJvdmlkZWQgb2Zmc2V0XG5cdCAgICAgIG9mZnNldCA9IGFkZE9mZnNldChvZmZzZXQsIG1hbnVhbE9mZnNldCk7XG5cdCAgICAgIHRhcmdldE9mZnNldCA9IGFkZE9mZnNldCh0YXJnZXRPZmZzZXQsIG1hbnVhbFRhcmdldE9mZnNldCk7XG5cblx0ICAgICAgLy8gSXQncyBub3cgb3VyIGdvYWwgdG8gbWFrZSAoZWxlbWVudCBwb3NpdGlvbiArIG9mZnNldCkgPT0gKHRhcmdldCBwb3NpdGlvbiArIHRhcmdldCBvZmZzZXQpXG5cdCAgICAgIHZhciBsZWZ0ID0gdGFyZ2V0UG9zLmxlZnQgKyB0YXJnZXRPZmZzZXQubGVmdCAtIG9mZnNldC5sZWZ0O1xuXHQgICAgICB2YXIgdG9wID0gdGFyZ2V0UG9zLnRvcCArIHRhcmdldE9mZnNldC50b3AgLSBvZmZzZXQudG9wO1xuXG5cdCAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgVGV0aGVyQmFzZS5tb2R1bGVzLmxlbmd0aDsgKytpKSB7XG5cdCAgICAgICAgdmFyIF9tb2R1bGUyID0gVGV0aGVyQmFzZS5tb2R1bGVzW2ldO1xuXHQgICAgICAgIHZhciByZXQgPSBfbW9kdWxlMi5wb3NpdGlvbi5jYWxsKHRoaXMsIHtcblx0ICAgICAgICAgIGxlZnQ6IGxlZnQsXG5cdCAgICAgICAgICB0b3A6IHRvcCxcblx0ICAgICAgICAgIHRhcmdldEF0dGFjaG1lbnQ6IHRhcmdldEF0dGFjaG1lbnQsXG5cdCAgICAgICAgICB0YXJnZXRQb3M6IHRhcmdldFBvcyxcblx0ICAgICAgICAgIGVsZW1lbnRQb3M6IGVsZW1lbnRQb3MsXG5cdCAgICAgICAgICBvZmZzZXQ6IG9mZnNldCxcblx0ICAgICAgICAgIHRhcmdldE9mZnNldDogdGFyZ2V0T2Zmc2V0LFxuXHQgICAgICAgICAgbWFudWFsT2Zmc2V0OiBtYW51YWxPZmZzZXQsXG5cdCAgICAgICAgICBtYW51YWxUYXJnZXRPZmZzZXQ6IG1hbnVhbFRhcmdldE9mZnNldCxcblx0ICAgICAgICAgIHNjcm9sbGJhclNpemU6IHNjcm9sbGJhclNpemUsXG5cdCAgICAgICAgICBhdHRhY2htZW50OiB0aGlzLmF0dGFjaG1lbnRcblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIGlmIChyZXQgPT09IGZhbHNlKSB7XG5cdCAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cdCAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcmV0ID09PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgcmV0ICE9PSAnb2JqZWN0Jykge1xuXHQgICAgICAgICAgY29udGludWU7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgIHRvcCA9IHJldC50b3A7XG5cdCAgICAgICAgICBsZWZ0ID0gcmV0LmxlZnQ7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgLy8gV2UgZGVzY3JpYmUgdGhlIHBvc2l0aW9uIHRocmVlIGRpZmZlcmVudCB3YXlzIHRvIGdpdmUgdGhlIG9wdGltaXplclxuXHQgICAgICAvLyBhIGNoYW5jZSB0byBkZWNpZGUgdGhlIGJlc3QgcG9zc2libGUgd2F5IHRvIHBvc2l0aW9uIHRoZSBlbGVtZW50XG5cdCAgICAgIC8vIHdpdGggdGhlIGZld2VzdCByZXBhaW50cy5cblx0ICAgICAgdmFyIG5leHQgPSB7XG5cdCAgICAgICAgLy8gSXQncyBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgcGFnZSAoYWJzb2x1dGUgcG9zaXRpb25pbmcgd2hlblxuXHQgICAgICAgIC8vIHRoZSBlbGVtZW50IGlzIGEgY2hpbGQgb2YgdGhlIGJvZHkpXG5cdCAgICAgICAgcGFnZToge1xuXHQgICAgICAgICAgdG9wOiB0b3AsXG5cdCAgICAgICAgICBsZWZ0OiBsZWZ0XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIC8vIEl0J3MgcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIHZpZXdwb3J0IChmaXhlZCBwb3NpdGlvbmluZylcblx0ICAgICAgICB2aWV3cG9ydDoge1xuXHQgICAgICAgICAgdG9wOiB0b3AgLSBwYWdlWU9mZnNldCxcblx0ICAgICAgICAgIGJvdHRvbTogcGFnZVlPZmZzZXQgLSB0b3AgLSBoZWlnaHQgKyBpbm5lckhlaWdodCxcblx0ICAgICAgICAgIGxlZnQ6IGxlZnQgLSBwYWdlWE9mZnNldCxcblx0ICAgICAgICAgIHJpZ2h0OiBwYWdlWE9mZnNldCAtIGxlZnQgLSB3aWR0aCArIGlubmVyV2lkdGhcblx0ICAgICAgICB9XG5cdCAgICAgIH07XG5cblx0ICAgICAgdmFyIHNjcm9sbGJhclNpemUgPSB1bmRlZmluZWQ7XG5cdCAgICAgIGlmIChkb2N1bWVudC5ib2R5LnNjcm9sbFdpZHRoID4gd2luZG93LmlubmVyV2lkdGgpIHtcblx0ICAgICAgICBzY3JvbGxiYXJTaXplID0gdGhpcy5jYWNoZSgnc2Nyb2xsYmFyLXNpemUnLCBnZXRTY3JvbGxCYXJTaXplKTtcblx0ICAgICAgICBuZXh0LnZpZXdwb3J0LmJvdHRvbSAtPSBzY3JvbGxiYXJTaXplLmhlaWdodDtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmIChkb2N1bWVudC5ib2R5LnNjcm9sbEhlaWdodCA+IHdpbmRvdy5pbm5lckhlaWdodCkge1xuXHQgICAgICAgIHNjcm9sbGJhclNpemUgPSB0aGlzLmNhY2hlKCdzY3JvbGxiYXItc2l6ZScsIGdldFNjcm9sbEJhclNpemUpO1xuXHQgICAgICAgIG5leHQudmlld3BvcnQucmlnaHQgLT0gc2Nyb2xsYmFyU2l6ZS53aWR0aDtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmIChbJycsICdzdGF0aWMnXS5pbmRleE9mKGRvY3VtZW50LmJvZHkuc3R5bGUucG9zaXRpb24pID09PSAtMSB8fCBbJycsICdzdGF0aWMnXS5pbmRleE9mKGRvY3VtZW50LmJvZHkucGFyZW50RWxlbWVudC5zdHlsZS5wb3NpdGlvbikgPT09IC0xKSB7XG5cdCAgICAgICAgLy8gQWJzb2x1dGUgcG9zaXRpb25pbmcgaW4gdGhlIGJvZHkgd2lsbCBiZSByZWxhdGl2ZSB0byB0aGUgcGFnZSwgbm90IHRoZSAnaW5pdGlhbCBjb250YWluaW5nIGJsb2NrJ1xuXHQgICAgICAgIG5leHQucGFnZS5ib3R0b20gPSBkb2N1bWVudC5ib2R5LnNjcm9sbEhlaWdodCAtIHRvcCAtIGhlaWdodDtcblx0ICAgICAgICBuZXh0LnBhZ2UucmlnaHQgPSBkb2N1bWVudC5ib2R5LnNjcm9sbFdpZHRoIC0gbGVmdCAtIHdpZHRoO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMub3B0aW1pemF0aW9ucyAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5vcHRpb25zLm9wdGltaXphdGlvbnMubW92ZUVsZW1lbnQgIT09IGZhbHNlICYmICEodHlwZW9mIHRoaXMudGFyZ2V0TW9kaWZpZXIgIT09ICd1bmRlZmluZWQnKSkge1xuXHQgICAgICAgIChmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICB2YXIgb2Zmc2V0UGFyZW50ID0gX3RoaXM1LmNhY2hlKCd0YXJnZXQtb2Zmc2V0cGFyZW50JywgZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICByZXR1cm4gZ2V0T2Zmc2V0UGFyZW50KF90aGlzNS50YXJnZXQpO1xuXHQgICAgICAgICAgfSk7XG5cdCAgICAgICAgICB2YXIgb2Zmc2V0UG9zaXRpb24gPSBfdGhpczUuY2FjaGUoJ3RhcmdldC1vZmZzZXRwYXJlbnQtYm91bmRzJywgZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICByZXR1cm4gZ2V0Qm91bmRzKG9mZnNldFBhcmVudCk7XG5cdCAgICAgICAgICB9KTtcblx0ICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnRTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUob2Zmc2V0UGFyZW50KTtcblx0ICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnRTaXplID0gb2Zmc2V0UG9zaXRpb247XG5cblx0ICAgICAgICAgIHZhciBvZmZzZXRCb3JkZXIgPSB7fTtcblx0ICAgICAgICAgIFsnVG9wJywgJ0xlZnQnLCAnQm90dG9tJywgJ1JpZ2h0J10uZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuXHQgICAgICAgICAgICBvZmZzZXRCb3JkZXJbc2lkZS50b0xvd2VyQ2FzZSgpXSA9IHBhcnNlRmxvYXQob2Zmc2V0UGFyZW50U3R5bGVbJ2JvcmRlcicgKyBzaWRlICsgJ1dpZHRoJ10pO1xuXHQgICAgICAgICAgfSk7XG5cblx0ICAgICAgICAgIG9mZnNldFBvc2l0aW9uLnJpZ2h0ID0gZG9jdW1lbnQuYm9keS5zY3JvbGxXaWR0aCAtIG9mZnNldFBvc2l0aW9uLmxlZnQgLSBvZmZzZXRQYXJlbnRTaXplLndpZHRoICsgb2Zmc2V0Qm9yZGVyLnJpZ2h0O1xuXHQgICAgICAgICAgb2Zmc2V0UG9zaXRpb24uYm90dG9tID0gZG9jdW1lbnQuYm9keS5zY3JvbGxIZWlnaHQgLSBvZmZzZXRQb3NpdGlvbi50b3AgLSBvZmZzZXRQYXJlbnRTaXplLmhlaWdodCArIG9mZnNldEJvcmRlci5ib3R0b207XG5cblx0ICAgICAgICAgIGlmIChuZXh0LnBhZ2UudG9wID49IG9mZnNldFBvc2l0aW9uLnRvcCArIG9mZnNldEJvcmRlci50b3AgJiYgbmV4dC5wYWdlLmJvdHRvbSA+PSBvZmZzZXRQb3NpdGlvbi5ib3R0b20pIHtcblx0ICAgICAgICAgICAgaWYgKG5leHQucGFnZS5sZWZ0ID49IG9mZnNldFBvc2l0aW9uLmxlZnQgKyBvZmZzZXRCb3JkZXIubGVmdCAmJiBuZXh0LnBhZ2UucmlnaHQgPj0gb2Zmc2V0UG9zaXRpb24ucmlnaHQpIHtcblx0ICAgICAgICAgICAgICAvLyBXZSdyZSB3aXRoaW4gdGhlIHZpc2libGUgcGFydCBvZiB0aGUgdGFyZ2V0J3Mgc2Nyb2xsIHBhcmVudFxuXHQgICAgICAgICAgICAgIHZhciBzY3JvbGxUb3AgPSBvZmZzZXRQYXJlbnQuc2Nyb2xsVG9wO1xuXHQgICAgICAgICAgICAgIHZhciBzY3JvbGxMZWZ0ID0gb2Zmc2V0UGFyZW50LnNjcm9sbExlZnQ7XG5cblx0ICAgICAgICAgICAgICAvLyBJdCdzIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSB0YXJnZXQncyBvZmZzZXQgcGFyZW50IChhYnNvbHV0ZSBwb3NpdGlvbmluZyB3aGVuXG5cdCAgICAgICAgICAgICAgLy8gdGhlIGVsZW1lbnQgaXMgbW92ZWQgdG8gYmUgYSBjaGlsZCBvZiB0aGUgdGFyZ2V0J3Mgb2Zmc2V0IHBhcmVudCkuXG5cdCAgICAgICAgICAgICAgbmV4dC5vZmZzZXQgPSB7XG5cdCAgICAgICAgICAgICAgICB0b3A6IG5leHQucGFnZS50b3AgLSBvZmZzZXRQb3NpdGlvbi50b3AgKyBzY3JvbGxUb3AgLSBvZmZzZXRCb3JkZXIudG9wLFxuXHQgICAgICAgICAgICAgICAgbGVmdDogbmV4dC5wYWdlLmxlZnQgLSBvZmZzZXRQb3NpdGlvbi5sZWZ0ICsgc2Nyb2xsTGVmdCAtIG9mZnNldEJvcmRlci5sZWZ0XG5cdCAgICAgICAgICAgICAgfTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH0pKCk7XG5cdCAgICAgIH1cblxuXHQgICAgICAvLyBXZSBjb3VsZCBhbHNvIHRyYXZlbCB1cCB0aGUgRE9NIGFuZCB0cnkgZWFjaCBjb250YWluaW5nIGNvbnRleHQsIHJhdGhlciB0aGFuIG9ubHlcblx0ICAgICAgLy8gbG9va2luZyBhdCB0aGUgYm9keSwgYnV0IHdlJ3JlIGdvbm5hIGdldCBkaW1pbmlzaGluZyByZXR1cm5zLlxuXG5cdCAgICAgIHRoaXMubW92ZShuZXh0KTtcblxuXHQgICAgICB0aGlzLmhpc3RvcnkudW5zaGlmdChuZXh0KTtcblxuXHQgICAgICBpZiAodGhpcy5oaXN0b3J5Lmxlbmd0aCA+IDMpIHtcblx0ICAgICAgICB0aGlzLmhpc3RvcnkucG9wKCk7XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAoZmx1c2hDaGFuZ2VzKSB7XG5cdCAgICAgICAgZmx1c2goKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIHJldHVybiB0cnVlO1xuXHQgICAgfVxuXG5cdCAgICAvLyBUSEUgSVNTVUVcblx0ICB9LCB7XG5cdCAgICBrZXk6ICdtb3ZlJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBtb3ZlKHBvcykge1xuXHQgICAgICB2YXIgX3RoaXM2ID0gdGhpcztcblxuXHQgICAgICBpZiAoISh0eXBlb2YgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUgIT09ICd1bmRlZmluZWQnKSkge1xuXHQgICAgICAgIHJldHVybjtcblx0ICAgICAgfVxuXG5cdCAgICAgIHZhciBzYW1lID0ge307XG5cblx0ICAgICAgZm9yICh2YXIgdHlwZSBpbiBwb3MpIHtcblx0ICAgICAgICBzYW1lW3R5cGVdID0ge307XG5cblx0ICAgICAgICBmb3IgKHZhciBrZXkgaW4gcG9zW3R5cGVdKSB7XG5cdCAgICAgICAgICB2YXIgZm91bmQgPSBmYWxzZTtcblxuXHQgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmhpc3RvcnkubGVuZ3RoOyArK2kpIHtcblx0ICAgICAgICAgICAgdmFyIHBvaW50ID0gdGhpcy5oaXN0b3J5W2ldO1xuXHQgICAgICAgICAgICBpZiAodHlwZW9mIHBvaW50W3R5cGVdICE9PSAndW5kZWZpbmVkJyAmJiAhd2l0aGluKHBvaW50W3R5cGVdW2tleV0sIHBvc1t0eXBlXVtrZXldKSkge1xuXHQgICAgICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcblx0ICAgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBpZiAoIWZvdW5kKSB7XG5cdCAgICAgICAgICAgIHNhbWVbdHlwZV1ba2V5XSA9IHRydWU7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgdmFyIGNzcyA9IHsgdG9wOiAnJywgbGVmdDogJycsIHJpZ2h0OiAnJywgYm90dG9tOiAnJyB9O1xuXG5cdCAgICAgIHZhciB0cmFuc2NyaWJlID0gZnVuY3Rpb24gdHJhbnNjcmliZShfc2FtZSwgX3Bvcykge1xuXHQgICAgICAgIHZhciBoYXNPcHRpbWl6YXRpb25zID0gdHlwZW9mIF90aGlzNi5vcHRpb25zLm9wdGltaXphdGlvbnMgIT09ICd1bmRlZmluZWQnO1xuXHQgICAgICAgIHZhciBncHUgPSBoYXNPcHRpbWl6YXRpb25zID8gX3RoaXM2Lm9wdGlvbnMub3B0aW1pemF0aW9ucy5ncHUgOiBudWxsO1xuXHQgICAgICAgIGlmIChncHUgIT09IGZhbHNlKSB7XG5cdCAgICAgICAgICB2YXIgeVBvcyA9IHVuZGVmaW5lZCxcblx0ICAgICAgICAgICAgICB4UG9zID0gdW5kZWZpbmVkO1xuXHQgICAgICAgICAgaWYgKF9zYW1lLnRvcCkge1xuXHQgICAgICAgICAgICBjc3MudG9wID0gMDtcblx0ICAgICAgICAgICAgeVBvcyA9IF9wb3MudG9wO1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgY3NzLmJvdHRvbSA9IDA7XG5cdCAgICAgICAgICAgIHlQb3MgPSAtX3Bvcy5ib3R0b207XG5cdCAgICAgICAgICB9XG5cblx0ICAgICAgICAgIGlmIChfc2FtZS5sZWZ0KSB7XG5cdCAgICAgICAgICAgIGNzcy5sZWZ0ID0gMDtcblx0ICAgICAgICAgICAgeFBvcyA9IF9wb3MubGVmdDtcblx0ICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIGNzcy5yaWdodCA9IDA7XG5cdCAgICAgICAgICAgIHhQb3MgPSAtX3Bvcy5yaWdodDtcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgY3NzW3RyYW5zZm9ybUtleV0gPSAndHJhbnNsYXRlWCgnICsgTWF0aC5yb3VuZCh4UG9zKSArICdweCkgdHJhbnNsYXRlWSgnICsgTWF0aC5yb3VuZCh5UG9zKSArICdweCknO1xuXG5cdCAgICAgICAgICBpZiAodHJhbnNmb3JtS2V5ICE9PSAnbXNUcmFuc2Zvcm0nKSB7XG5cdCAgICAgICAgICAgIC8vIFRoZSBaIHRyYW5zZm9ybSB3aWxsIGtlZXAgdGhpcyBpbiB0aGUgR1BVIChmYXN0ZXIsIGFuZCBwcmV2ZW50cyBhcnRpZmFjdHMpLFxuXHQgICAgICAgICAgICAvLyBidXQgSUU5IGRvZXNuJ3Qgc3VwcG9ydCAzZCB0cmFuc2Zvcm1zIGFuZCB3aWxsIGNob2tlLlxuXHQgICAgICAgICAgICBjc3NbdHJhbnNmb3JtS2V5XSArPSBcIiB0cmFuc2xhdGVaKDApXCI7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgIGlmIChfc2FtZS50b3ApIHtcblx0ICAgICAgICAgICAgY3NzLnRvcCA9IF9wb3MudG9wICsgJ3B4Jztcblx0ICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIGNzcy5ib3R0b20gPSBfcG9zLmJvdHRvbSArICdweCc7XG5cdCAgICAgICAgICB9XG5cblx0ICAgICAgICAgIGlmIChfc2FtZS5sZWZ0KSB7XG5cdCAgICAgICAgICAgIGNzcy5sZWZ0ID0gX3Bvcy5sZWZ0ICsgJ3B4Jztcblx0ICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIGNzcy5yaWdodCA9IF9wb3MucmlnaHQgKyAncHgnO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgfTtcblxuXHQgICAgICB2YXIgbW92ZWQgPSBmYWxzZTtcblx0ICAgICAgaWYgKChzYW1lLnBhZ2UudG9wIHx8IHNhbWUucGFnZS5ib3R0b20pICYmIChzYW1lLnBhZ2UubGVmdCB8fCBzYW1lLnBhZ2UucmlnaHQpKSB7XG5cdCAgICAgICAgY3NzLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0ICAgICAgICB0cmFuc2NyaWJlKHNhbWUucGFnZSwgcG9zLnBhZ2UpO1xuXHQgICAgICB9IGVsc2UgaWYgKChzYW1lLnZpZXdwb3J0LnRvcCB8fCBzYW1lLnZpZXdwb3J0LmJvdHRvbSkgJiYgKHNhbWUudmlld3BvcnQubGVmdCB8fCBzYW1lLnZpZXdwb3J0LnJpZ2h0KSkge1xuXHQgICAgICAgIGNzcy5wb3NpdGlvbiA9ICdmaXhlZCc7XG5cdCAgICAgICAgdHJhbnNjcmliZShzYW1lLnZpZXdwb3J0LCBwb3Mudmlld3BvcnQpO1xuXHQgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBzYW1lLm9mZnNldCAhPT0gJ3VuZGVmaW5lZCcgJiYgc2FtZS5vZmZzZXQudG9wICYmIHNhbWUub2Zmc2V0LmxlZnQpIHtcblx0ICAgICAgICAoZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgY3NzLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0ICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnQgPSBfdGhpczYuY2FjaGUoJ3RhcmdldC1vZmZzZXRwYXJlbnQnLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBnZXRPZmZzZXRQYXJlbnQoX3RoaXM2LnRhcmdldCk7XG5cdCAgICAgICAgICB9KTtcblxuXHQgICAgICAgICAgaWYgKGdldE9mZnNldFBhcmVudChfdGhpczYuZWxlbWVudCkgIT09IG9mZnNldFBhcmVudCkge1xuXHQgICAgICAgICAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgX3RoaXM2LmVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChfdGhpczYuZWxlbWVudCk7XG5cdCAgICAgICAgICAgICAgb2Zmc2V0UGFyZW50LmFwcGVuZENoaWxkKF90aGlzNi5lbGVtZW50KTtcblx0ICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICB9XG5cblx0ICAgICAgICAgIHRyYW5zY3JpYmUoc2FtZS5vZmZzZXQsIHBvcy5vZmZzZXQpO1xuXHQgICAgICAgICAgbW92ZWQgPSB0cnVlO1xuXHQgICAgICAgIH0pKCk7XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgY3NzLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcblx0ICAgICAgICB0cmFuc2NyaWJlKHsgdG9wOiB0cnVlLCBsZWZ0OiB0cnVlIH0sIHBvcy5wYWdlKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICghbW92ZWQpIHtcblx0ICAgICAgICB2YXIgb2Zmc2V0UGFyZW50SXNCb2R5ID0gdHJ1ZTtcblx0ICAgICAgICB2YXIgY3VycmVudE5vZGUgPSB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZTtcblx0ICAgICAgICB3aGlsZSAoY3VycmVudE5vZGUgJiYgY3VycmVudE5vZGUudGFnTmFtZSAhPT0gJ0JPRFknKSB7XG5cdCAgICAgICAgICBpZiAoZ2V0Q29tcHV0ZWRTdHlsZShjdXJyZW50Tm9kZSkucG9zaXRpb24gIT09ICdzdGF0aWMnKSB7XG5cdCAgICAgICAgICAgIG9mZnNldFBhcmVudElzQm9keSA9IGZhbHNlO1xuXHQgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgY3VycmVudE5vZGUgPSBjdXJyZW50Tm9kZS5wYXJlbnROb2RlO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmICghb2Zmc2V0UGFyZW50SXNCb2R5KSB7XG5cdCAgICAgICAgICB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmVsZW1lbnQpO1xuXHQgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmVsZW1lbnQpO1xuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXG5cdCAgICAgIC8vIEFueSBjc3MgY2hhbmdlIHdpbGwgdHJpZ2dlciBhIHJlcGFpbnQsIHNvIGxldCdzIGF2b2lkIG9uZSBpZiBub3RoaW5nIGNoYW5nZWRcblx0ICAgICAgdmFyIHdyaXRlQ1NTID0ge307XG5cdCAgICAgIHZhciB3cml0ZSA9IGZhbHNlO1xuXHQgICAgICBmb3IgKHZhciBrZXkgaW4gY3NzKSB7XG5cdCAgICAgICAgdmFyIHZhbCA9IGNzc1trZXldO1xuXHQgICAgICAgIHZhciBlbFZhbCA9IHRoaXMuZWxlbWVudC5zdHlsZVtrZXldO1xuXG5cdCAgICAgICAgaWYgKGVsVmFsICE9PSB2YWwpIHtcblx0ICAgICAgICAgIHdyaXRlID0gdHJ1ZTtcblx0ICAgICAgICAgIHdyaXRlQ1NTW2tleV0gPSB2YWw7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKHdyaXRlKSB7XG5cdCAgICAgICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgZXh0ZW5kKF90aGlzNi5lbGVtZW50LnN0eWxlLCB3cml0ZUNTUyk7XG5cdCAgICAgICAgfSk7XG5cdCAgICAgIH1cblx0ICAgIH1cblx0ICB9XSk7XG5cblx0ICByZXR1cm4gVGV0aGVyQ2xhc3M7XG5cdH0pKCk7XG5cblx0VGV0aGVyQ2xhc3MubW9kdWxlcyA9IFtdO1xuXG5cdFRldGhlckJhc2UucG9zaXRpb24gPSBwb3NpdGlvbjtcblxuXHR2YXIgVGV0aGVyID0gZXh0ZW5kKFRldGhlckNsYXNzLCBUZXRoZXJCYXNlKTtcblx0LyogZ2xvYmFscyBUZXRoZXJCYXNlICovXG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBfc2xpY2VkVG9BcnJheSA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIHNsaWNlSXRlcmF0b3IoYXJyLCBpKSB7IHZhciBfYXJyID0gW107IHZhciBfbiA9IHRydWU7IHZhciBfZCA9IGZhbHNlOyB2YXIgX2UgPSB1bmRlZmluZWQ7IHRyeSB7IGZvciAodmFyIF9pID0gYXJyW1N5bWJvbC5pdGVyYXRvcl0oKSwgX3M7ICEoX24gPSAoX3MgPSBfaS5uZXh0KCkpLmRvbmUpOyBfbiA9IHRydWUpIHsgX2Fyci5wdXNoKF9zLnZhbHVlKTsgaWYgKGkgJiYgX2Fyci5sZW5ndGggPT09IGkpIGJyZWFrOyB9IH0gY2F0Y2ggKGVycikgeyBfZCA9IHRydWU7IF9lID0gZXJyOyB9IGZpbmFsbHkgeyB0cnkgeyBpZiAoIV9uICYmIF9pWydyZXR1cm4nXSkgX2lbJ3JldHVybiddKCk7IH0gZmluYWxseSB7IGlmIChfZCkgdGhyb3cgX2U7IH0gfSByZXR1cm4gX2FycjsgfSByZXR1cm4gZnVuY3Rpb24gKGFyciwgaSkgeyBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7IHJldHVybiBhcnI7IH0gZWxzZSBpZiAoU3ltYm9sLml0ZXJhdG9yIGluIE9iamVjdChhcnIpKSB7IHJldHVybiBzbGljZUl0ZXJhdG9yKGFyciwgaSk7IH0gZWxzZSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgYXR0ZW1wdCB0byBkZXN0cnVjdHVyZSBub24taXRlcmFibGUgaW5zdGFuY2UnKTsgfSB9OyB9KSgpO1xuXG5cdHZhciBfVGV0aGVyQmFzZSRVdGlscyA9IFRldGhlckJhc2UuVXRpbHM7XG5cdHZhciBnZXRCb3VuZHMgPSBfVGV0aGVyQmFzZSRVdGlscy5nZXRCb3VuZHM7XG5cdHZhciBleHRlbmQgPSBfVGV0aGVyQmFzZSRVdGlscy5leHRlbmQ7XG5cdHZhciB1cGRhdGVDbGFzc2VzID0gX1RldGhlckJhc2UkVXRpbHMudXBkYXRlQ2xhc3Nlcztcblx0dmFyIGRlZmVyID0gX1RldGhlckJhc2UkVXRpbHMuZGVmZXI7XG5cblx0dmFyIEJPVU5EU19GT1JNQVQgPSBbJ2xlZnQnLCAndG9wJywgJ3JpZ2h0JywgJ2JvdHRvbSddO1xuXG5cdGZ1bmN0aW9uIGdldEJvdW5kaW5nUmVjdCh0ZXRoZXIsIHRvKSB7XG5cdCAgaWYgKHRvID09PSAnc2Nyb2xsUGFyZW50Jykge1xuXHQgICAgdG8gPSB0ZXRoZXIuc2Nyb2xsUGFyZW50O1xuXHQgIH0gZWxzZSBpZiAodG8gPT09ICd3aW5kb3cnKSB7XG5cdCAgICB0byA9IFtwYWdlWE9mZnNldCwgcGFnZVlPZmZzZXQsIGlubmVyV2lkdGggKyBwYWdlWE9mZnNldCwgaW5uZXJIZWlnaHQgKyBwYWdlWU9mZnNldF07XG5cdCAgfVxuXG5cdCAgaWYgKHRvID09PSBkb2N1bWVudCkge1xuXHQgICAgdG8gPSB0by5kb2N1bWVudEVsZW1lbnQ7XG5cdCAgfVxuXG5cdCAgaWYgKHR5cGVvZiB0by5ub2RlVHlwZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIChmdW5jdGlvbiAoKSB7XG5cdCAgICAgIHZhciBzaXplID0gZ2V0Qm91bmRzKHRvKTtcblx0ICAgICAgdmFyIHBvcyA9IHNpemU7XG5cdCAgICAgIHZhciBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUodG8pO1xuXG5cdCAgICAgIHRvID0gW3Bvcy5sZWZ0LCBwb3MudG9wLCBzaXplLndpZHRoICsgcG9zLmxlZnQsIHNpemUuaGVpZ2h0ICsgcG9zLnRvcF07XG5cblx0ICAgICAgQk9VTkRTX0ZPUk1BVC5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlLCBpKSB7XG5cdCAgICAgICAgc2lkZSA9IHNpZGVbMF0udG9VcHBlckNhc2UoKSArIHNpZGUuc3Vic3RyKDEpO1xuXHQgICAgICAgIGlmIChzaWRlID09PSAnVG9wJyB8fCBzaWRlID09PSAnTGVmdCcpIHtcblx0ICAgICAgICAgIHRvW2ldICs9IHBhcnNlRmxvYXQoc3R5bGVbJ2JvcmRlcicgKyBzaWRlICsgJ1dpZHRoJ10pO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICB0b1tpXSAtPSBwYXJzZUZsb2F0KHN0eWxlWydib3JkZXInICsgc2lkZSArICdXaWR0aCddKTtcblx0ICAgICAgICB9XG5cdCAgICAgIH0pO1xuXHQgICAgfSkoKTtcblx0ICB9XG5cblx0ICByZXR1cm4gdG87XG5cdH1cblxuXHRUZXRoZXJCYXNlLm1vZHVsZXMucHVzaCh7XG5cdCAgcG9zaXRpb246IGZ1bmN0aW9uIHBvc2l0aW9uKF9yZWYpIHtcblx0ICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cblx0ICAgIHZhciB0b3AgPSBfcmVmLnRvcDtcblx0ICAgIHZhciBsZWZ0ID0gX3JlZi5sZWZ0O1xuXHQgICAgdmFyIHRhcmdldEF0dGFjaG1lbnQgPSBfcmVmLnRhcmdldEF0dGFjaG1lbnQ7XG5cblx0ICAgIGlmICghdGhpcy5vcHRpb25zLmNvbnN0cmFpbnRzKSB7XG5cdCAgICAgIHJldHVybiB0cnVlO1xuXHQgICAgfVxuXG5cdCAgICB2YXIgX2NhY2hlID0gdGhpcy5jYWNoZSgnZWxlbWVudC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgIHJldHVybiBnZXRCb3VuZHMoX3RoaXMuZWxlbWVudCk7XG5cdCAgICB9KTtcblxuXHQgICAgdmFyIGhlaWdodCA9IF9jYWNoZS5oZWlnaHQ7XG5cdCAgICB2YXIgd2lkdGggPSBfY2FjaGUud2lkdGg7XG5cblx0ICAgIGlmICh3aWR0aCA9PT0gMCAmJiBoZWlnaHQgPT09IDAgJiYgdHlwZW9mIHRoaXMubGFzdFNpemUgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgIHZhciBfbGFzdFNpemUgPSB0aGlzLmxhc3RTaXplO1xuXG5cdCAgICAgIC8vIEhhbmRsZSB0aGUgaXRlbSBnZXR0aW5nIGhpZGRlbiBhcyBhIHJlc3VsdCBvZiBvdXIgcG9zaXRpb25pbmcgd2l0aG91dCBnbGl0Y2hpbmdcblx0ICAgICAgLy8gdGhlIGNsYXNzZXMgaW4gYW5kIG91dFxuXHQgICAgICB3aWR0aCA9IF9sYXN0U2l6ZS53aWR0aDtcblx0ICAgICAgaGVpZ2h0ID0gX2xhc3RTaXplLmhlaWdodDtcblx0ICAgIH1cblxuXHQgICAgdmFyIHRhcmdldFNpemUgPSB0aGlzLmNhY2hlKCd0YXJnZXQtYm91bmRzJywgZnVuY3Rpb24gKCkge1xuXHQgICAgICByZXR1cm4gX3RoaXMuZ2V0VGFyZ2V0Qm91bmRzKCk7XG5cdCAgICB9KTtcblxuXHQgICAgdmFyIHRhcmdldEhlaWdodCA9IHRhcmdldFNpemUuaGVpZ2h0O1xuXHQgICAgdmFyIHRhcmdldFdpZHRoID0gdGFyZ2V0U2l6ZS53aWR0aDtcblxuXHQgICAgdmFyIGFsbENsYXNzZXMgPSBbdGhpcy5nZXRDbGFzcygncGlubmVkJyksIHRoaXMuZ2V0Q2xhc3MoJ291dC1vZi1ib3VuZHMnKV07XG5cblx0ICAgIHRoaXMub3B0aW9ucy5jb25zdHJhaW50cy5mb3JFYWNoKGZ1bmN0aW9uIChjb25zdHJhaW50KSB7XG5cdCAgICAgIHZhciBvdXRPZkJvdW5kc0NsYXNzID0gY29uc3RyYWludC5vdXRPZkJvdW5kc0NsYXNzO1xuXHQgICAgICB2YXIgcGlubmVkQ2xhc3MgPSBjb25zdHJhaW50LnBpbm5lZENsYXNzO1xuXG5cdCAgICAgIGlmIChvdXRPZkJvdW5kc0NsYXNzKSB7XG5cdCAgICAgICAgYWxsQ2xhc3Nlcy5wdXNoKG91dE9mQm91bmRzQ2xhc3MpO1xuXHQgICAgICB9XG5cdCAgICAgIGlmIChwaW5uZWRDbGFzcykge1xuXHQgICAgICAgIGFsbENsYXNzZXMucHVzaChwaW5uZWRDbGFzcyk7XG5cdCAgICAgIH1cblx0ICAgIH0pO1xuXG5cdCAgICBhbGxDbGFzc2VzLmZvckVhY2goZnVuY3Rpb24gKGNscykge1xuXHQgICAgICBbJ2xlZnQnLCAndG9wJywgJ3JpZ2h0JywgJ2JvdHRvbSddLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcblx0ICAgICAgICBhbGxDbGFzc2VzLnB1c2goY2xzICsgJy0nICsgc2lkZSk7XG5cdCAgICAgIH0pO1xuXHQgICAgfSk7XG5cblx0ICAgIHZhciBhZGRDbGFzc2VzID0gW107XG5cblx0ICAgIHZhciB0QXR0YWNobWVudCA9IGV4dGVuZCh7fSwgdGFyZ2V0QXR0YWNobWVudCk7XG5cdCAgICB2YXIgZUF0dGFjaG1lbnQgPSBleHRlbmQoe30sIHRoaXMuYXR0YWNobWVudCk7XG5cblx0ICAgIHRoaXMub3B0aW9ucy5jb25zdHJhaW50cy5mb3JFYWNoKGZ1bmN0aW9uIChjb25zdHJhaW50KSB7XG5cdCAgICAgIHZhciB0byA9IGNvbnN0cmFpbnQudG87XG5cdCAgICAgIHZhciBhdHRhY2htZW50ID0gY29uc3RyYWludC5hdHRhY2htZW50O1xuXHQgICAgICB2YXIgcGluID0gY29uc3RyYWludC5waW47XG5cblx0ICAgICAgaWYgKHR5cGVvZiBhdHRhY2htZW50ID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIGF0dGFjaG1lbnQgPSAnJztcblx0ICAgICAgfVxuXG5cdCAgICAgIHZhciBjaGFuZ2VBdHRhY2hYID0gdW5kZWZpbmVkLFxuXHQgICAgICAgICAgY2hhbmdlQXR0YWNoWSA9IHVuZGVmaW5lZDtcblx0ICAgICAgaWYgKGF0dGFjaG1lbnQuaW5kZXhPZignICcpID49IDApIHtcblx0ICAgICAgICB2YXIgX2F0dGFjaG1lbnQkc3BsaXQgPSBhdHRhY2htZW50LnNwbGl0KCcgJyk7XG5cblx0ICAgICAgICB2YXIgX2F0dGFjaG1lbnQkc3BsaXQyID0gX3NsaWNlZFRvQXJyYXkoX2F0dGFjaG1lbnQkc3BsaXQsIDIpO1xuXG5cdCAgICAgICAgY2hhbmdlQXR0YWNoWSA9IF9hdHRhY2htZW50JHNwbGl0MlswXTtcblx0ICAgICAgICBjaGFuZ2VBdHRhY2hYID0gX2F0dGFjaG1lbnQkc3BsaXQyWzFdO1xuXHQgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIGNoYW5nZUF0dGFjaFggPSBjaGFuZ2VBdHRhY2hZID0gYXR0YWNobWVudDtcblx0ICAgICAgfVxuXG5cdCAgICAgIHZhciBib3VuZHMgPSBnZXRCb3VuZGluZ1JlY3QoX3RoaXMsIHRvKTtcblxuXHQgICAgICBpZiAoY2hhbmdlQXR0YWNoWSA9PT0gJ3RhcmdldCcgfHwgY2hhbmdlQXR0YWNoWSA9PT0gJ2JvdGgnKSB7XG5cdCAgICAgICAgaWYgKHRvcCA8IGJvdW5kc1sxXSAmJiB0QXR0YWNobWVudC50b3AgPT09ICd0b3AnKSB7XG5cdCAgICAgICAgICB0b3AgKz0gdGFyZ2V0SGVpZ2h0O1xuXHQgICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSAmJiB0QXR0YWNobWVudC50b3AgPT09ICdib3R0b20nKSB7XG5cdCAgICAgICAgICB0b3AgLT0gdGFyZ2V0SGVpZ2h0O1xuXHQgICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKGNoYW5nZUF0dGFjaFkgPT09ICd0b2dldGhlcicpIHtcblx0ICAgICAgICBpZiAodG9wIDwgYm91bmRzWzFdICYmIHRBdHRhY2htZW50LnRvcCA9PT0gJ3RvcCcpIHtcblx0ICAgICAgICAgIGlmIChlQXR0YWNobWVudC50b3AgPT09ICdib3R0b20nKSB7XG5cdCAgICAgICAgICAgIHRvcCArPSB0YXJnZXRIZWlnaHQ7XG5cdCAgICAgICAgICAgIHRBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuXG5cdCAgICAgICAgICAgIHRvcCArPSBoZWlnaHQ7XG5cdCAgICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICd0b3AnO1xuXHQgICAgICAgICAgfSBlbHNlIGlmIChlQXR0YWNobWVudC50b3AgPT09ICd0b3AnKSB7XG5cdCAgICAgICAgICAgIHRvcCArPSB0YXJnZXRIZWlnaHQ7XG5cdCAgICAgICAgICAgIHRBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuXG5cdCAgICAgICAgICAgIHRvcCAtPSBoZWlnaHQ7XG5cdCAgICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmICh0b3AgKyBoZWlnaHQgPiBib3VuZHNbM10gJiYgdEF0dGFjaG1lbnQudG9wID09PSAnYm90dG9tJykge1xuXHQgICAgICAgICAgaWYgKGVBdHRhY2htZW50LnRvcCA9PT0gJ3RvcCcpIHtcblx0ICAgICAgICAgICAgdG9wIC09IHRhcmdldEhlaWdodDtcblx0ICAgICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG5cblx0ICAgICAgICAgICAgdG9wIC09IGhlaWdodDtcblx0ICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG5cdCAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LnRvcCA9PT0gJ2JvdHRvbScpIHtcblx0ICAgICAgICAgICAgdG9wIC09IHRhcmdldEhlaWdodDtcblx0ICAgICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG5cblx0ICAgICAgICAgICAgdG9wICs9IGhlaWdodDtcblx0ICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKHRBdHRhY2htZW50LnRvcCA9PT0gJ21pZGRsZScpIHtcblx0ICAgICAgICAgIGlmICh0b3AgKyBoZWlnaHQgPiBib3VuZHNbM10gJiYgZUF0dGFjaG1lbnQudG9wID09PSAndG9wJykge1xuXHQgICAgICAgICAgICB0b3AgLT0gaGVpZ2h0O1xuXHQgICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcblx0ICAgICAgICAgIH0gZWxzZSBpZiAodG9wIDwgYm91bmRzWzFdICYmIGVBdHRhY2htZW50LnRvcCA9PT0gJ2JvdHRvbScpIHtcblx0ICAgICAgICAgICAgdG9wICs9IGhlaWdodDtcblx0ICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKGNoYW5nZUF0dGFjaFggPT09ICd0YXJnZXQnIHx8IGNoYW5nZUF0dGFjaFggPT09ICdib3RoJykge1xuXHQgICAgICAgIGlmIChsZWZ0IDwgYm91bmRzWzBdICYmIHRBdHRhY2htZW50LmxlZnQgPT09ICdsZWZ0Jykge1xuXHQgICAgICAgICAgbGVmdCArPSB0YXJnZXRXaWR0aDtcblx0ICAgICAgICAgIHRBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmIChsZWZ0ICsgd2lkdGggPiBib3VuZHNbMl0gJiYgdEF0dGFjaG1lbnQubGVmdCA9PT0gJ3JpZ2h0Jykge1xuXHQgICAgICAgICAgbGVmdCAtPSB0YXJnZXRXaWR0aDtcblx0ICAgICAgICAgIHRBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKGNoYW5nZUF0dGFjaFggPT09ICd0b2dldGhlcicpIHtcblx0ICAgICAgICBpZiAobGVmdCA8IGJvdW5kc1swXSAmJiB0QXR0YWNobWVudC5sZWZ0ID09PSAnbGVmdCcpIHtcblx0ICAgICAgICAgIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAncmlnaHQnKSB7XG5cdCAgICAgICAgICAgIGxlZnQgKz0gdGFyZ2V0V2lkdGg7XG5cdCAgICAgICAgICAgIHRBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuXG5cdCAgICAgICAgICAgIGxlZnQgKz0gd2lkdGg7XG5cdCAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG5cdCAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdsZWZ0Jykge1xuXHQgICAgICAgICAgICBsZWZ0ICs9IHRhcmdldFdpZHRoO1xuXHQgICAgICAgICAgICB0QXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0JztcblxuXHQgICAgICAgICAgICBsZWZ0IC09IHdpZHRoO1xuXHQgICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0Jztcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9IGVsc2UgaWYgKGxlZnQgKyB3aWR0aCA+IGJvdW5kc1syXSAmJiB0QXR0YWNobWVudC5sZWZ0ID09PSAncmlnaHQnKSB7XG5cdCAgICAgICAgICBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG5cdCAgICAgICAgICAgIGxlZnQgLT0gdGFyZ2V0V2lkdGg7XG5cdCAgICAgICAgICAgIHRBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG5cblx0ICAgICAgICAgICAgbGVmdCAtPSB3aWR0aDtcblx0ICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG5cdCAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcblx0ICAgICAgICAgICAgbGVmdCAtPSB0YXJnZXRXaWR0aDtcblx0ICAgICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcblxuXHQgICAgICAgICAgICBsZWZ0ICs9IHdpZHRoO1xuXHQgICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH0gZWxzZSBpZiAodEF0dGFjaG1lbnQubGVmdCA9PT0gJ2NlbnRlcicpIHtcblx0ICAgICAgICAgIGlmIChsZWZ0ICsgd2lkdGggPiBib3VuZHNbMl0gJiYgZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG5cdCAgICAgICAgICAgIGxlZnQgLT0gd2lkdGg7XG5cdCAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuXHQgICAgICAgICAgfSBlbHNlIGlmIChsZWZ0IDwgYm91bmRzWzBdICYmIGVBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcblx0ICAgICAgICAgICAgbGVmdCArPSB3aWR0aDtcblx0ICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0Jztcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAoY2hhbmdlQXR0YWNoWSA9PT0gJ2VsZW1lbnQnIHx8IGNoYW5nZUF0dGFjaFkgPT09ICdib3RoJykge1xuXHQgICAgICAgIGlmICh0b3AgPCBib3VuZHNbMV0gJiYgZUF0dGFjaG1lbnQudG9wID09PSAnYm90dG9tJykge1xuXHQgICAgICAgICAgdG9wICs9IGhlaWdodDtcblx0ICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICd0b3AnO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmICh0b3AgKyBoZWlnaHQgPiBib3VuZHNbM10gJiYgZUF0dGFjaG1lbnQudG9wID09PSAndG9wJykge1xuXHQgICAgICAgICAgdG9wIC09IGhlaWdodDtcblx0ICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXG5cdCAgICAgIGlmIChjaGFuZ2VBdHRhY2hYID09PSAnZWxlbWVudCcgfHwgY2hhbmdlQXR0YWNoWCA9PT0gJ2JvdGgnKSB7XG5cdCAgICAgICAgaWYgKGxlZnQgPCBib3VuZHNbMF0pIHtcblx0ICAgICAgICAgIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAncmlnaHQnKSB7XG5cdCAgICAgICAgICAgIGxlZnQgKz0gd2lkdGg7XG5cdCAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG5cdCAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdjZW50ZXInKSB7XG5cdCAgICAgICAgICAgIGxlZnQgKz0gd2lkdGggLyAyO1xuXHQgICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmIChsZWZ0ICsgd2lkdGggPiBib3VuZHNbMl0pIHtcblx0ICAgICAgICAgIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAnbGVmdCcpIHtcblx0ICAgICAgICAgICAgbGVmdCAtPSB3aWR0aDtcblx0ICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG5cdCAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdjZW50ZXInKSB7XG5cdCAgICAgICAgICAgIGxlZnQgLT0gd2lkdGggLyAyO1xuXHQgICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0Jztcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAodHlwZW9mIHBpbiA9PT0gJ3N0cmluZycpIHtcblx0ICAgICAgICBwaW4gPSBwaW4uc3BsaXQoJywnKS5tYXAoZnVuY3Rpb24gKHApIHtcblx0ICAgICAgICAgIHJldHVybiBwLnRyaW0oKTtcblx0ICAgICAgICB9KTtcblx0ICAgICAgfSBlbHNlIGlmIChwaW4gPT09IHRydWUpIHtcblx0ICAgICAgICBwaW4gPSBbJ3RvcCcsICdsZWZ0JywgJ3JpZ2h0JywgJ2JvdHRvbSddO1xuXHQgICAgICB9XG5cblx0ICAgICAgcGluID0gcGluIHx8IFtdO1xuXG5cdCAgICAgIHZhciBwaW5uZWQgPSBbXTtcblx0ICAgICAgdmFyIG9vYiA9IFtdO1xuXG5cdCAgICAgIGlmICh0b3AgPCBib3VuZHNbMV0pIHtcblx0ICAgICAgICBpZiAocGluLmluZGV4T2YoJ3RvcCcpID49IDApIHtcblx0ICAgICAgICAgIHRvcCA9IGJvdW5kc1sxXTtcblx0ICAgICAgICAgIHBpbm5lZC5wdXNoKCd0b3AnKTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgb29iLnB1c2goJ3RvcCcpO1xuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICh0b3AgKyBoZWlnaHQgPiBib3VuZHNbM10pIHtcblx0ICAgICAgICBpZiAocGluLmluZGV4T2YoJ2JvdHRvbScpID49IDApIHtcblx0ICAgICAgICAgIHRvcCA9IGJvdW5kc1szXSAtIGhlaWdodDtcblx0ICAgICAgICAgIHBpbm5lZC5wdXNoKCdib3R0b20nKTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgb29iLnB1c2goJ2JvdHRvbScpO1xuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXG5cdCAgICAgIGlmIChsZWZ0IDwgYm91bmRzWzBdKSB7XG5cdCAgICAgICAgaWYgKHBpbi5pbmRleE9mKCdsZWZ0JykgPj0gMCkge1xuXHQgICAgICAgICAgbGVmdCA9IGJvdW5kc1swXTtcblx0ICAgICAgICAgIHBpbm5lZC5wdXNoKCdsZWZ0Jyk7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgIG9vYi5wdXNoKCdsZWZ0Jyk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKGxlZnQgKyB3aWR0aCA+IGJvdW5kc1syXSkge1xuXHQgICAgICAgIGlmIChwaW4uaW5kZXhPZigncmlnaHQnKSA+PSAwKSB7XG5cdCAgICAgICAgICBsZWZ0ID0gYm91bmRzWzJdIC0gd2lkdGg7XG5cdCAgICAgICAgICBwaW5uZWQucHVzaCgncmlnaHQnKTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgb29iLnB1c2goJ3JpZ2h0Jyk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKHBpbm5lZC5sZW5ndGgpIHtcblx0ICAgICAgICAoZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgdmFyIHBpbm5lZENsYXNzID0gdW5kZWZpbmVkO1xuXHQgICAgICAgICAgaWYgKHR5cGVvZiBfdGhpcy5vcHRpb25zLnBpbm5lZENsYXNzICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgICAgICBwaW5uZWRDbGFzcyA9IF90aGlzLm9wdGlvbnMucGlubmVkQ2xhc3M7XG5cdCAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICBwaW5uZWRDbGFzcyA9IF90aGlzLmdldENsYXNzKCdwaW5uZWQnKTtcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgYWRkQ2xhc3Nlcy5wdXNoKHBpbm5lZENsYXNzKTtcblx0ICAgICAgICAgIHBpbm5lZC5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG5cdCAgICAgICAgICAgIGFkZENsYXNzZXMucHVzaChwaW5uZWRDbGFzcyArICctJyArIHNpZGUpO1xuXHQgICAgICAgICAgfSk7XG5cdCAgICAgICAgfSkoKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmIChvb2IubGVuZ3RoKSB7XG5cdCAgICAgICAgKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgIHZhciBvb2JDbGFzcyA9IHVuZGVmaW5lZDtcblx0ICAgICAgICAgIGlmICh0eXBlb2YgX3RoaXMub3B0aW9ucy5vdXRPZkJvdW5kc0NsYXNzICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgICAgICBvb2JDbGFzcyA9IF90aGlzLm9wdGlvbnMub3V0T2ZCb3VuZHNDbGFzcztcblx0ICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIG9vYkNsYXNzID0gX3RoaXMuZ2V0Q2xhc3MoJ291dC1vZi1ib3VuZHMnKTtcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgYWRkQ2xhc3Nlcy5wdXNoKG9vYkNsYXNzKTtcblx0ICAgICAgICAgIG9vYi5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG5cdCAgICAgICAgICAgIGFkZENsYXNzZXMucHVzaChvb2JDbGFzcyArICctJyArIHNpZGUpO1xuXHQgICAgICAgICAgfSk7XG5cdCAgICAgICAgfSkoKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmIChwaW5uZWQuaW5kZXhPZignbGVmdCcpID49IDAgfHwgcGlubmVkLmluZGV4T2YoJ3JpZ2h0JykgPj0gMCkge1xuXHQgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSB0QXR0YWNobWVudC5sZWZ0ID0gZmFsc2U7XG5cdCAgICAgIH1cblx0ICAgICAgaWYgKHBpbm5lZC5pbmRleE9mKCd0b3AnKSA+PSAwIHx8IHBpbm5lZC5pbmRleE9mKCdib3R0b20nKSA+PSAwKSB7XG5cdCAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gdEF0dGFjaG1lbnQudG9wID0gZmFsc2U7XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAodEF0dGFjaG1lbnQudG9wICE9PSB0YXJnZXRBdHRhY2htZW50LnRvcCB8fCB0QXR0YWNobWVudC5sZWZ0ICE9PSB0YXJnZXRBdHRhY2htZW50LmxlZnQgfHwgZUF0dGFjaG1lbnQudG9wICE9PSBfdGhpcy5hdHRhY2htZW50LnRvcCB8fCBlQXR0YWNobWVudC5sZWZ0ICE9PSBfdGhpcy5hdHRhY2htZW50LmxlZnQpIHtcblx0ICAgICAgICBfdGhpcy51cGRhdGVBdHRhY2hDbGFzc2VzKGVBdHRhY2htZW50LCB0QXR0YWNobWVudCk7XG5cdCAgICAgIH1cblx0ICAgIH0pO1xuXG5cdCAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG5cdCAgICAgIGlmICghKF90aGlzLm9wdGlvbnMuYWRkVGFyZ2V0Q2xhc3NlcyA9PT0gZmFsc2UpKSB7XG5cdCAgICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpcy50YXJnZXQsIGFkZENsYXNzZXMsIGFsbENsYXNzZXMpO1xuXHQgICAgICB9XG5cdCAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXMuZWxlbWVudCwgYWRkQ2xhc3NlcywgYWxsQ2xhc3Nlcyk7XG5cdCAgICB9KTtcblxuXHQgICAgcmV0dXJuIHsgdG9wOiB0b3AsIGxlZnQ6IGxlZnQgfTtcblx0ICB9XG5cdH0pO1xuXHQvKiBnbG9iYWxzIFRldGhlckJhc2UgKi9cblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIF9UZXRoZXJCYXNlJFV0aWxzID0gVGV0aGVyQmFzZS5VdGlscztcblx0dmFyIGdldEJvdW5kcyA9IF9UZXRoZXJCYXNlJFV0aWxzLmdldEJvdW5kcztcblx0dmFyIHVwZGF0ZUNsYXNzZXMgPSBfVGV0aGVyQmFzZSRVdGlscy51cGRhdGVDbGFzc2VzO1xuXHR2YXIgZGVmZXIgPSBfVGV0aGVyQmFzZSRVdGlscy5kZWZlcjtcblxuXHRUZXRoZXJCYXNlLm1vZHVsZXMucHVzaCh7XG5cdCAgcG9zaXRpb246IGZ1bmN0aW9uIHBvc2l0aW9uKF9yZWYpIHtcblx0ICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cblx0ICAgIHZhciB0b3AgPSBfcmVmLnRvcDtcblx0ICAgIHZhciBsZWZ0ID0gX3JlZi5sZWZ0O1xuXG5cdCAgICB2YXIgX2NhY2hlID0gdGhpcy5jYWNoZSgnZWxlbWVudC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgIHJldHVybiBnZXRCb3VuZHMoX3RoaXMuZWxlbWVudCk7XG5cdCAgICB9KTtcblxuXHQgICAgdmFyIGhlaWdodCA9IF9jYWNoZS5oZWlnaHQ7XG5cdCAgICB2YXIgd2lkdGggPSBfY2FjaGUud2lkdGg7XG5cblx0ICAgIHZhciB0YXJnZXRQb3MgPSB0aGlzLmdldFRhcmdldEJvdW5kcygpO1xuXG5cdCAgICB2YXIgYm90dG9tID0gdG9wICsgaGVpZ2h0O1xuXHQgICAgdmFyIHJpZ2h0ID0gbGVmdCArIHdpZHRoO1xuXG5cdCAgICB2YXIgYWJ1dHRlZCA9IFtdO1xuXHQgICAgaWYgKHRvcCA8PSB0YXJnZXRQb3MuYm90dG9tICYmIGJvdHRvbSA+PSB0YXJnZXRQb3MudG9wKSB7XG5cdCAgICAgIFsnbGVmdCcsICdyaWdodCddLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcblx0ICAgICAgICB2YXIgdGFyZ2V0UG9zU2lkZSA9IHRhcmdldFBvc1tzaWRlXTtcblx0ICAgICAgICBpZiAodGFyZ2V0UG9zU2lkZSA9PT0gbGVmdCB8fCB0YXJnZXRQb3NTaWRlID09PSByaWdodCkge1xuXHQgICAgICAgICAgYWJ1dHRlZC5wdXNoKHNpZGUpO1xuXHQgICAgICAgIH1cblx0ICAgICAgfSk7XG5cdCAgICB9XG5cblx0ICAgIGlmIChsZWZ0IDw9IHRhcmdldFBvcy5yaWdodCAmJiByaWdodCA+PSB0YXJnZXRQb3MubGVmdCkge1xuXHQgICAgICBbJ3RvcCcsICdib3R0b20nXS5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG5cdCAgICAgICAgdmFyIHRhcmdldFBvc1NpZGUgPSB0YXJnZXRQb3Nbc2lkZV07XG5cdCAgICAgICAgaWYgKHRhcmdldFBvc1NpZGUgPT09IHRvcCB8fCB0YXJnZXRQb3NTaWRlID09PSBib3R0b20pIHtcblx0ICAgICAgICAgIGFidXR0ZWQucHVzaChzaWRlKTtcblx0ICAgICAgICB9XG5cdCAgICAgIH0pO1xuXHQgICAgfVxuXG5cdCAgICB2YXIgYWxsQ2xhc3NlcyA9IFtdO1xuXHQgICAgdmFyIGFkZENsYXNzZXMgPSBbXTtcblxuXHQgICAgdmFyIHNpZGVzID0gWydsZWZ0JywgJ3RvcCcsICdyaWdodCcsICdib3R0b20nXTtcblx0ICAgIGFsbENsYXNzZXMucHVzaCh0aGlzLmdldENsYXNzKCdhYnV0dGVkJykpO1xuXHQgICAgc2lkZXMuZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuXHQgICAgICBhbGxDbGFzc2VzLnB1c2goX3RoaXMuZ2V0Q2xhc3MoJ2FidXR0ZWQnKSArICctJyArIHNpZGUpO1xuXHQgICAgfSk7XG5cblx0ICAgIGlmIChhYnV0dGVkLmxlbmd0aCkge1xuXHQgICAgICBhZGRDbGFzc2VzLnB1c2godGhpcy5nZXRDbGFzcygnYWJ1dHRlZCcpKTtcblx0ICAgIH1cblxuXHQgICAgYWJ1dHRlZC5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG5cdCAgICAgIGFkZENsYXNzZXMucHVzaChfdGhpcy5nZXRDbGFzcygnYWJ1dHRlZCcpICsgJy0nICsgc2lkZSk7XG5cdCAgICB9KTtcblxuXHQgICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuXHQgICAgICBpZiAoIShfdGhpcy5vcHRpb25zLmFkZFRhcmdldENsYXNzZXMgPT09IGZhbHNlKSkge1xuXHQgICAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXMudGFyZ2V0LCBhZGRDbGFzc2VzLCBhbGxDbGFzc2VzKTtcblx0ICAgICAgfVxuXHQgICAgICB1cGRhdGVDbGFzc2VzKF90aGlzLmVsZW1lbnQsIGFkZENsYXNzZXMsIGFsbENsYXNzZXMpO1xuXHQgICAgfSk7XG5cblx0ICAgIHJldHVybiB0cnVlO1xuXHQgIH1cblx0fSk7XG5cdC8qIGdsb2JhbHMgVGV0aGVyQmFzZSAqL1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgX3NsaWNlZFRvQXJyYXkgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBzbGljZUl0ZXJhdG9yKGFyciwgaSkgeyB2YXIgX2FyciA9IFtdOyB2YXIgX24gPSB0cnVlOyB2YXIgX2QgPSBmYWxzZTsgdmFyIF9lID0gdW5kZWZpbmVkOyB0cnkgeyBmb3IgKHZhciBfaSA9IGFycltTeW1ib2wuaXRlcmF0b3JdKCksIF9zOyAhKF9uID0gKF9zID0gX2kubmV4dCgpKS5kb25lKTsgX24gPSB0cnVlKSB7IF9hcnIucHVzaChfcy52YWx1ZSk7IGlmIChpICYmIF9hcnIubGVuZ3RoID09PSBpKSBicmVhazsgfSB9IGNhdGNoIChlcnIpIHsgX2QgPSB0cnVlOyBfZSA9IGVycjsgfSBmaW5hbGx5IHsgdHJ5IHsgaWYgKCFfbiAmJiBfaVsncmV0dXJuJ10pIF9pWydyZXR1cm4nXSgpOyB9IGZpbmFsbHkgeyBpZiAoX2QpIHRocm93IF9lOyB9IH0gcmV0dXJuIF9hcnI7IH0gcmV0dXJuIGZ1bmN0aW9uIChhcnIsIGkpIHsgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkgeyByZXR1cm4gYXJyOyB9IGVsc2UgaWYgKFN5bWJvbC5pdGVyYXRvciBpbiBPYmplY3QoYXJyKSkgeyByZXR1cm4gc2xpY2VJdGVyYXRvcihhcnIsIGkpOyB9IGVsc2UgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIGF0dGVtcHQgdG8gZGVzdHJ1Y3R1cmUgbm9uLWl0ZXJhYmxlIGluc3RhbmNlJyk7IH0gfTsgfSkoKTtcblxuXHRUZXRoZXJCYXNlLm1vZHVsZXMucHVzaCh7XG5cdCAgcG9zaXRpb246IGZ1bmN0aW9uIHBvc2l0aW9uKF9yZWYpIHtcblx0ICAgIHZhciB0b3AgPSBfcmVmLnRvcDtcblx0ICAgIHZhciBsZWZ0ID0gX3JlZi5sZWZ0O1xuXG5cdCAgICBpZiAoIXRoaXMub3B0aW9ucy5zaGlmdCkge1xuXHQgICAgICByZXR1cm47XG5cdCAgICB9XG5cblx0ICAgIHZhciBzaGlmdCA9IHRoaXMub3B0aW9ucy5zaGlmdDtcblx0ICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLnNoaWZ0ID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgIHNoaWZ0ID0gdGhpcy5vcHRpb25zLnNoaWZ0LmNhbGwodGhpcywgeyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9KTtcblx0ICAgIH1cblxuXHQgICAgdmFyIHNoaWZ0VG9wID0gdW5kZWZpbmVkLFxuXHQgICAgICAgIHNoaWZ0TGVmdCA9IHVuZGVmaW5lZDtcblx0ICAgIGlmICh0eXBlb2Ygc2hpZnQgPT09ICdzdHJpbmcnKSB7XG5cdCAgICAgIHNoaWZ0ID0gc2hpZnQuc3BsaXQoJyAnKTtcblx0ICAgICAgc2hpZnRbMV0gPSBzaGlmdFsxXSB8fCBzaGlmdFswXTtcblxuXHQgICAgICB2YXIgX3NoaWZ0ID0gc2hpZnQ7XG5cblx0ICAgICAgdmFyIF9zaGlmdDIgPSBfc2xpY2VkVG9BcnJheShfc2hpZnQsIDIpO1xuXG5cdCAgICAgIHNoaWZ0VG9wID0gX3NoaWZ0MlswXTtcblx0ICAgICAgc2hpZnRMZWZ0ID0gX3NoaWZ0MlsxXTtcblxuXHQgICAgICBzaGlmdFRvcCA9IHBhcnNlRmxvYXQoc2hpZnRUb3AsIDEwKTtcblx0ICAgICAgc2hpZnRMZWZ0ID0gcGFyc2VGbG9hdChzaGlmdExlZnQsIDEwKTtcblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgIHNoaWZ0VG9wID0gc2hpZnQudG9wO1xuXHQgICAgICBzaGlmdExlZnQgPSBzaGlmdC5sZWZ0O1xuXHQgICAgfVxuXG5cdCAgICB0b3AgKz0gc2hpZnRUb3A7XG5cdCAgICBsZWZ0ICs9IHNoaWZ0TGVmdDtcblxuXHQgICAgcmV0dXJuIHsgdG9wOiB0b3AsIGxlZnQ6IGxlZnQgfTtcblx0ICB9XG5cdH0pO1xuXHRyZXR1cm4gVGV0aGVyO1xuXG5cdH0pKTtcblxuXG4vKioqLyB9XG4vKioqKioqLyBdKVxufSk7XG47Il0sImZpbGUiOiJzdHlsZWd1aWRlLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
