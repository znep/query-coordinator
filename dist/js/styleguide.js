/*!
 * Socrata Styleguide v0.6.0
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
	  FlyoutFactory: __webpack_require__(4),
	  MenuFactory: __webpack_require__(5),
	  ModalFactory: __webpack_require__(6),
	  ToggleFactory: __webpack_require__(7),
	  TourFactory: __webpack_require__(8)
	};


/***/ },
/* 1 */
/***/ function(module, exports) {

	var Dropdown = module.exports = function(element) {
	  this.dd = element;
	  this.orientation = element.getAttribute('data-orientation') || 'bottom';
	  this.selectable = element.hasAttribute('data-selectable');
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

	    if (obj.selectable) {
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

	          obj.placeholder.innerHTML = opt.innerText.trim();

	          return false;
	        });
	      });
	    }
	  }
	}


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var velocity = __webpack_require__(3);

	var FlannelFactory = module.exports = function(element) {
	  var mobileBreakpoint = 420;
	  var padding = 10;
	  var hoverables = Array.prototype.slice.apply(document.querySelectorAll('[data-flannel]'));

	  function hideFlannel(flannel, hoverable) {
	    if (document.body.offsetWidth < mobileBreakpoint) {
	      velocity(flannel, {
	        left: document.body.offsetWidth
	      }, {
	        duration: 350,
	        complete: function() {
	          flannel.classList.add('flannel-hidden');
	          hoverable.classList.remove('active');
	        }
	      });

	      document.body.style.overflow = '';
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
	    } else {
	      flannel.style.left = windowWidth + 'px';
	      flannel.style.top = 0;
	      velocity(flannel, {
	        left: 0
	      }, 350);
	      document.body.style.overflow = 'hidden';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJzdHlsZWd1aWRlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcInN0eWxlZ3VpZGVcIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wic3R5bGVndWlkZVwiXSA9IGZhY3RvcnkoKTtcbn0pKHRoaXMsIGZ1bmN0aW9uKCkge1xucmV0dXJuIC8qKioqKiovIChmdW5jdGlvbihtb2R1bGVzKSB7IC8vIHdlYnBhY2tCb290c3RyYXBcbi8qKioqKiovIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuLyoqKioqKi8gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4vKioqKioqLyBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4vKioqKioqLyBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuLyoqKioqKi8gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuLyoqKioqKi8gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuLyoqKioqKi8gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbi8qKioqKiovIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuLyoqKioqKi8gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbi8qKioqKiovIFx0XHRcdGV4cG9ydHM6IHt9LFxuLyoqKioqKi8gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuLyoqKioqKi8gXHRcdFx0bG9hZGVkOiBmYWxzZVxuLyoqKioqKi8gXHRcdH07XG5cbi8qKioqKiovIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbi8qKioqKiovIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuLyoqKioqKi8gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbi8qKioqKiovIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuLyoqKioqKi8gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4vKioqKioqLyBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuLyoqKioqKi8gXHR9XG5cblxuLyoqKioqKi8gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4vKioqKioqLyBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbi8qKioqKiovIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuLyoqKioqKi8gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8qKioqKiovIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG4vKioqKioqLyB9KVxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKioqKiovIChbXG4vKiAwICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHRtb2R1bGUuZXhwb3J0cyA9IHtcblx0ICBEcm9wZG93bjogX193ZWJwYWNrX3JlcXVpcmVfXygxKSxcblx0ICBGbGFubmVsRmFjdG9yeTogX193ZWJwYWNrX3JlcXVpcmVfXygyKSxcblx0ICBGbHlvdXRGYWN0b3J5OiBfX3dlYnBhY2tfcmVxdWlyZV9fKDQpLFxuXHQgIE1lbnVGYWN0b3J5OiBfX3dlYnBhY2tfcmVxdWlyZV9fKDUpLFxuXHQgIE1vZGFsRmFjdG9yeTogX193ZWJwYWNrX3JlcXVpcmVfXyg2KSxcblx0ICBUb2dnbGVGYWN0b3J5OiBfX3dlYnBhY2tfcmVxdWlyZV9fKDcpLFxuXHQgIFRvdXJGYWN0b3J5OiBfX3dlYnBhY2tfcmVxdWlyZV9fKDgpXG5cdH07XG5cblxuLyoqKi8gfSxcbi8qIDEgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdHZhciBEcm9wZG93biA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWxlbWVudCkge1xuXHQgIHRoaXMuZGQgPSBlbGVtZW50O1xuXHQgIHRoaXMub3JpZW50YXRpb24gPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnZGF0YS1vcmllbnRhdGlvbicpIHx8ICdib3R0b20nO1xuXHQgIHRoaXMuc2VsZWN0YWJsZSA9IGVsZW1lbnQuaGFzQXR0cmlidXRlKCdkYXRhLXNlbGVjdGFibGUnKTtcblx0ICB0aGlzLmRkLmNsYXNzTGlzdC5hZGQoJ2Ryb3Bkb3duLW9yaWVudGF0aW9uLScgKyB0aGlzLm9yaWVudGF0aW9uKTtcblxuXHQgIHRoaXMucGxhY2Vob2xkZXIgPSB0aGlzLmRkLnF1ZXJ5U2VsZWN0b3IoJ3NwYW4nKTtcblx0ICB0aGlzLm9wdHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLmRkLnF1ZXJ5U2VsZWN0b3JBbGwoJy5kcm9wZG93bi1vcHRpb25zID4gbGknKSk7XG5cdCAgdGhpcy52YWwgPSAnJztcblx0ICB0aGlzLmluZGV4ID0gLTE7XG5cblx0ICB0aGlzLmluaXRFdmVudHMoKTtcblx0fVxuXG5cdERyb3Bkb3duLnByb3RvdHlwZSA9IHtcblx0ICBpbml0RXZlbnRzOiBmdW5jdGlvbigpIHtcblx0ICAgIHZhciBvYmogPSB0aGlzO1xuXG5cdCAgICBvYmouZGQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuXHQgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblx0ICAgICAgb2JqLmRkLmNsYXNzTGlzdC50b2dnbGUoJ2FjdGl2ZScpO1xuXHQgICAgICByZXR1cm4gZmFsc2U7XG5cdCAgICB9KTtcblxuXHQgICAgaWYgKG9iai5zZWxlY3RhYmxlKSB7XG5cdCAgICAgIG9iai5vcHRzLmZvckVhY2goZnVuY3Rpb24ob3B0KSB7XG5cdCAgICAgICAgb3B0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcblx0ICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0ICAgICAgICAgIHZhciBub2RlID0gb3B0O1xuXHQgICAgICAgICAgdmFyIGluZGV4ID0gMDtcblxuXHQgICAgICAgICAgd2hpbGUgKChub2RlID0gbm9kZS5wcmV2aW91c0VsZW1lbnRTaWJsaW5nKSAhPT0gbnVsbCkge1xuXHQgICAgICAgICAgICBpbmRleCsrO1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBvYmoudmFsID0gb3B0LnRleHRDb250ZW50O1xuXHQgICAgICAgICAgb2JqLmluZGV4ID0gaW5kZXg7XG5cblx0ICAgICAgICAgIG9iai5wbGFjZWhvbGRlci5pbm5lckhUTUwgPSBvcHQuaW5uZXJUZXh0LnRyaW0oKTtcblxuXHQgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXHQgICAgICAgIH0pO1xuXHQgICAgICB9KTtcblx0ICAgIH1cblx0ICB9XG5cdH1cblxuXG4vKioqLyB9LFxuLyogMiAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0dmFyIHZlbG9jaXR5ID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblxuXHR2YXIgRmxhbm5lbEZhY3RvcnkgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICB2YXIgbW9iaWxlQnJlYWtwb2ludCA9IDQyMDtcblx0ICB2YXIgcGFkZGluZyA9IDEwO1xuXHQgIHZhciBob3ZlcmFibGVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLWZsYW5uZWxdJykpO1xuXG5cdCAgZnVuY3Rpb24gaGlkZUZsYW5uZWwoZmxhbm5lbCwgaG92ZXJhYmxlKSB7XG5cdCAgICBpZiAoZG9jdW1lbnQuYm9keS5vZmZzZXRXaWR0aCA8IG1vYmlsZUJyZWFrcG9pbnQpIHtcblx0ICAgICAgdmVsb2NpdHkoZmxhbm5lbCwge1xuXHQgICAgICAgIGxlZnQ6IGRvY3VtZW50LmJvZHkub2Zmc2V0V2lkdGhcblx0ICAgICAgfSwge1xuXHQgICAgICAgIGR1cmF0aW9uOiAzNTAsXG5cdCAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgZmxhbm5lbC5jbGFzc0xpc3QuYWRkKCdmbGFubmVsLWhpZGRlbicpO1xuXHQgICAgICAgICAgaG92ZXJhYmxlLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuXHQgICAgICAgIH1cblx0ICAgICAgfSk7XG5cblx0ICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5vdmVyZmxvdyA9ICcnO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgZmxhbm5lbC5jbGFzc0xpc3QuYWRkKCdmbGFubmVsLWhpZGRlbicpO1xuXHQgICAgICBob3ZlcmFibGUuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG5cdCAgICB9XG5cdCAgfVxuXG5cdCAgZnVuY3Rpb24gcG9zaXRpb25GbGFubmVsKGZsYW5uZWwsIGhvdmVyYWJsZSkge1xuXHQgICAgdmFyIG5vZGUgPSBob3ZlcmFibGU7XG5cdCAgICB2YXIgbGVmdCA9IDA7XG5cdCAgICB2YXIgdG9wID0gMDtcblx0ICAgIHZhciBmbGFubmVsV2lkdGggPSBmbGFubmVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoO1xuXHQgICAgdmFyIHdpbmRvd1dpZHRoID0gZG9jdW1lbnQuYm9keS5vZmZzZXRXaWR0aDtcblxuXHQgICAgZG8ge1xuXHQgICAgICBsZWZ0ICs9IG5vZGUub2Zmc2V0TGVmdDtcblx0ICAgICAgdG9wICs9IG5vZGUub2Zmc2V0VG9wO1xuXHQgICAgfSB3aGlsZSAoKG5vZGUgPSBub2RlLm9mZnNldFBhcmVudCkgIT09IG51bGwpO1xuXG5cdCAgICBsZWZ0ID0gbGVmdCArIGhvdmVyYWJsZS5vZmZzZXRXaWR0aCAvIDI7XG5cdCAgICB0b3AgPSB0b3AgKyBob3ZlcmFibGUub2Zmc2V0SGVpZ2h0ICsgcGFkZGluZztcblxuXHQgICAgaWYgKGxlZnQgKyBmbGFubmVsV2lkdGggPiB3aW5kb3dXaWR0aCAmJiB3aW5kb3dXaWR0aCA+PSBtb2JpbGVCcmVha3BvaW50KSB7XG5cdCAgICAgIGZsYW5uZWwuY2xhc3NMaXN0LnJlbW92ZSgnZmxhbm5lbC1yaWdodCcpO1xuXHQgICAgICBmbGFubmVsLmNsYXNzTGlzdC5hZGQoJ2ZsYW5uZWwtbGVmdCcpO1xuXHQgICAgICBsZWZ0IC09IGZsYW5uZWxXaWR0aDtcblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgIGZsYW5uZWwuY2xhc3NMaXN0LnJlbW92ZSgnZmxhbm5lbC1sZWZ0Jyk7XG5cdCAgICAgIGZsYW5uZWwuY2xhc3NMaXN0LmFkZCgnZmxhbm5lbC1yaWdodCcpO1xuXHQgICAgfVxuXG5cdCAgICBpZiAod2luZG93V2lkdGggPj0gbW9iaWxlQnJlYWtwb2ludCkge1xuXHQgICAgICBmbGFubmVsLnN0eWxlLmxlZnQgPSBsZWZ0ICsgJ3B4Jztcblx0ICAgICAgZmxhbm5lbC5zdHlsZS50b3AgPSB0b3AgKyAncHgnO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgZmxhbm5lbC5zdHlsZS5sZWZ0ID0gd2luZG93V2lkdGggKyAncHgnO1xuXHQgICAgICBmbGFubmVsLnN0eWxlLnRvcCA9IDA7XG5cdCAgICAgIHZlbG9jaXR5KGZsYW5uZWwsIHtcblx0ICAgICAgICBsZWZ0OiAwXG5cdCAgICAgIH0sIDM1MCk7XG5cdCAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcblx0ICAgIH1cblx0ICB9XG5cblx0ICBob3ZlcmFibGVzLmZvckVhY2goZnVuY3Rpb24oaG92ZXJhYmxlKSB7XG5cdCAgICB2YXIgZmxhbm5lbElkID0gaG92ZXJhYmxlLmdldEF0dHJpYnV0ZSgnZGF0YS1mbGFubmVsJyk7XG5cdCAgICB2YXIgZmxhbm5lbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyMnICsgZmxhbm5lbElkKTtcblx0ICAgIHZhciBkaXNtaXNzYWxzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGZsYW5uZWwucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtZmxhbm5lbC1kaXNtaXNzXScpKTtcblxuXHQgICAgZGlzbWlzc2Fscy5mb3JFYWNoKGZ1bmN0aW9uKGRpc21pc3NhbCkge1xuXHQgICAgICBkaXNtaXNzYWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0ICAgICAgICBoaWRlRmxhbm5lbChmbGFubmVsLCBob3ZlcmFibGUpO1xuXHQgICAgICB9KTtcblx0ICAgIH0pO1xuXG5cdCAgICBob3ZlcmFibGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuXHQgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuXHQgICAgICBmbGFubmVsLmNsYXNzTGlzdC50b2dnbGUoJ2ZsYW5uZWwtaGlkZGVuJyk7XG5cdCAgICAgIHBvc2l0aW9uRmxhbm5lbChmbGFubmVsLCBob3ZlcmFibGUpO1xuXHQgICAgfSk7XG5cblx0ICAgIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuXHQgICAgICB2YXIgbm9kZSA9IGV2ZW50LnRhcmdldDtcblxuXHQgICAgICB3aGlsZSAobm9kZS5wYXJlbnRFbGVtZW50KSB7XG5cdCAgICAgICAgaWYgKG5vZGUuaWQgPT09IGZsYW5uZWxJZCkge1xuXHQgICAgICAgICAgcmV0dXJuO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIG5vZGUgPSBub2RlLnBhcmVudEVsZW1lbnQ7XG5cdCAgICAgIH1cblxuXHQgICAgICBoaWRlRmxhbm5lbChmbGFubmVsLCBob3ZlcmFibGUpO1xuXHQgICAgfSk7XG5cblx0ICAgIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBmdW5jdGlvbihldmVudCkge1xuXHQgICAgICB2YXIga2V5ID0gZXZlbnQud2hpY2ggfHwgZXZlbnQua2V5Q29kZTtcblxuXHQgICAgICAvLyBFU0Ncblx0ICAgICAgaWYgKGtleSA9PT0gMjcpIHtcblx0ICAgICAgICBoaWRlRmxhbm5lbChmbGFubmVsLCBob3ZlcmFibGUpO1xuXHQgICAgICB9XG5cdCAgICB9KTtcblxuXHQgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGZ1bmN0aW9uKCkge1xuXHQgICAgICBpZiAoIWZsYW5uZWwuY2xhc3NMaXN0LmNvbnRhaW5zKCdmbGFubmVsLWhpZGRlbicpKSB7XG5cdCAgICAgICAgcG9zaXRpb25GbGFubmVsKGZsYW5uZWwsIGhvdmVyYWJsZSk7XG5cdCAgICAgIH1cblx0ICAgIH0pO1xuXHQgIH0pO1xuXHR9XG5cblxuLyoqKi8gfSxcbi8qIDMgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdHZhciBfX1dFQlBBQ0tfQU1EX0RFRklORV9GQUNUT1JZX18sIF9fV0VCUEFDS19BTURfREVGSU5FX1JFU1VMVF9fOy8qISBWZWxvY2l0eUpTLm9yZyAoMS4yLjMpLiAoQykgMjAxNCBKdWxpYW4gU2hhcGlyby4gTUlUIEBsaWNlbnNlOiBlbi53aWtpcGVkaWEub3JnL3dpa2kvTUlUX0xpY2Vuc2UgKi9cblxuXHQvKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICBWZWxvY2l0eSBqUXVlcnkgU2hpbVxuXHQqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdC8qISBWZWxvY2l0eUpTLm9yZyBqUXVlcnkgU2hpbSAoMS4wLjEpLiAoQykgMjAxNCBUaGUgalF1ZXJ5IEZvdW5kYXRpb24uIE1JVCBAbGljZW5zZTogZW4ud2lraXBlZGlhLm9yZy93aWtpL01JVF9MaWNlbnNlLiAqL1xuXG5cdC8qIFRoaXMgZmlsZSBjb250YWlucyB0aGUgalF1ZXJ5IGZ1bmN0aW9ucyB0aGF0IFZlbG9jaXR5IHJlbGllcyBvbiwgdGhlcmVieSByZW1vdmluZyBWZWxvY2l0eSdzIGRlcGVuZGVuY3kgb24gYSBmdWxsIGNvcHkgb2YgalF1ZXJ5LCBhbmQgYWxsb3dpbmcgaXQgdG8gd29yayBpbiBhbnkgZW52aXJvbm1lbnQuICovXG5cdC8qIFRoZXNlIHNoaW1tZWQgZnVuY3Rpb25zIGFyZSBvbmx5IHVzZWQgaWYgalF1ZXJ5IGlzbid0IHByZXNlbnQuIElmIGJvdGggdGhpcyBzaGltIGFuZCBqUXVlcnkgYXJlIGxvYWRlZCwgVmVsb2NpdHkgZGVmYXVsdHMgdG8galF1ZXJ5IHByb3Blci4gKi9cblx0LyogQnJvd3NlciBzdXBwb3J0OiBVc2luZyB0aGlzIHNoaW0gaW5zdGVhZCBvZiBqUXVlcnkgcHJvcGVyIHJlbW92ZXMgc3VwcG9ydCBmb3IgSUU4LiAqL1xuXG5cdDsoZnVuY3Rpb24gKHdpbmRvdykge1xuXHQgICAgLyoqKioqKioqKioqKioqKlxuXHQgICAgICAgICBTZXR1cFxuXHQgICAgKioqKioqKioqKioqKioqL1xuXG5cdCAgICAvKiBJZiBqUXVlcnkgaXMgYWxyZWFkeSBsb2FkZWQsIHRoZXJlJ3Mgbm8gcG9pbnQgaW4gbG9hZGluZyB0aGlzIHNoaW0uICovXG5cdCAgICBpZiAod2luZG93LmpRdWVyeSkge1xuXHQgICAgICAgIHJldHVybjtcblx0ICAgIH1cblxuXHQgICAgLyogalF1ZXJ5IGJhc2UuICovXG5cdCAgICB2YXIgJCA9IGZ1bmN0aW9uIChzZWxlY3RvciwgY29udGV4dCkge1xuXHQgICAgICAgIHJldHVybiBuZXcgJC5mbi5pbml0KHNlbGVjdG9yLCBjb250ZXh0KTtcblx0ICAgIH07XG5cblx0ICAgIC8qKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgUHJpdmF0ZSBNZXRob2RzXG5cdCAgICAqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgLyogalF1ZXJ5ICovXG5cdCAgICAkLmlzV2luZG93ID0gZnVuY3Rpb24gKG9iaikge1xuXHQgICAgICAgIC8qIGpzaGludCBlcWVxZXE6IGZhbHNlICovXG5cdCAgICAgICAgcmV0dXJuIG9iaiAhPSBudWxsICYmIG9iaiA9PSBvYmoud2luZG93O1xuXHQgICAgfTtcblxuXHQgICAgLyogalF1ZXJ5ICovXG5cdCAgICAkLnR5cGUgPSBmdW5jdGlvbiAob2JqKSB7XG5cdCAgICAgICAgaWYgKG9iaiA9PSBudWxsKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBvYmogKyBcIlwiO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiB0eXBlb2Ygb2JqID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBvYmogPT09IFwiZnVuY3Rpb25cIiA/XG5cdCAgICAgICAgICAgIGNsYXNzMnR5cGVbdG9TdHJpbmcuY2FsbChvYmopXSB8fCBcIm9iamVjdFwiIDpcblx0ICAgICAgICAgICAgdHlwZW9mIG9iajtcblx0ICAgIH07XG5cblx0ICAgIC8qIGpRdWVyeSAqL1xuXHQgICAgJC5pc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAob2JqKSB7XG5cdCAgICAgICAgcmV0dXJuICQudHlwZShvYmopID09PSBcImFycmF5XCI7XG5cdCAgICB9O1xuXG5cdCAgICAvKiBqUXVlcnkgKi9cblx0ICAgIGZ1bmN0aW9uIGlzQXJyYXlsaWtlIChvYmopIHtcblx0ICAgICAgICB2YXIgbGVuZ3RoID0gb2JqLmxlbmd0aCxcblx0ICAgICAgICAgICAgdHlwZSA9ICQudHlwZShvYmopO1xuXG5cdCAgICAgICAgaWYgKHR5cGUgPT09IFwiZnVuY3Rpb25cIiB8fCAkLmlzV2luZG93KG9iaikpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmIChvYmoubm9kZVR5cGUgPT09IDEgJiYgbGVuZ3RoKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiB0eXBlID09PSBcImFycmF5XCIgfHwgbGVuZ3RoID09PSAwIHx8IHR5cGVvZiBsZW5ndGggPT09IFwibnVtYmVyXCIgJiYgbGVuZ3RoID4gMCAmJiAobGVuZ3RoIC0gMSkgaW4gb2JqO1xuXHQgICAgfVxuXG5cdCAgICAvKioqKioqKioqKioqKioqXG5cdCAgICAgICAkIE1ldGhvZHNcblx0ICAgICoqKioqKioqKioqKioqKi9cblxuXHQgICAgLyogalF1ZXJ5OiBTdXBwb3J0IHJlbW92ZWQgZm9yIElFPDkuICovXG5cdCAgICAkLmlzUGxhaW5PYmplY3QgPSBmdW5jdGlvbiAob2JqKSB7XG5cdCAgICAgICAgdmFyIGtleTtcblxuXHQgICAgICAgIGlmICghb2JqIHx8ICQudHlwZShvYmopICE9PSBcIm9iamVjdFwiIHx8IG9iai5ub2RlVHlwZSB8fCAkLmlzV2luZG93KG9iaikpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgIGlmIChvYmouY29uc3RydWN0b3IgJiZcblx0ICAgICAgICAgICAgICAgICFoYXNPd24uY2FsbChvYmosIFwiY29uc3RydWN0b3JcIikgJiZcblx0ICAgICAgICAgICAgICAgICFoYXNPd24uY2FsbChvYmouY29uc3RydWN0b3IucHJvdG90eXBlLCBcImlzUHJvdG90eXBlT2ZcIikpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0gY2F0Y2ggKGUpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGZvciAoa2V5IGluIG9iaikge31cblxuXHQgICAgICAgIHJldHVybiBrZXkgPT09IHVuZGVmaW5lZCB8fCBoYXNPd24uY2FsbChvYmosIGtleSk7XG5cdCAgICB9O1xuXG5cdCAgICAvKiBqUXVlcnkgKi9cblx0ICAgICQuZWFjaCA9IGZ1bmN0aW9uKG9iaiwgY2FsbGJhY2ssIGFyZ3MpIHtcblx0ICAgICAgICB2YXIgdmFsdWUsXG5cdCAgICAgICAgICAgIGkgPSAwLFxuXHQgICAgICAgICAgICBsZW5ndGggPSBvYmoubGVuZ3RoLFxuXHQgICAgICAgICAgICBpc0FycmF5ID0gaXNBcnJheWxpa2Uob2JqKTtcblxuXHQgICAgICAgIGlmIChhcmdzKSB7XG5cdCAgICAgICAgICAgIGlmIChpc0FycmF5KSB7XG5cdCAgICAgICAgICAgICAgICBmb3IgKDsgaSA8IGxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBjYWxsYmFjay5hcHBseShvYmpbaV0sIGFyZ3MpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBmYWxzZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICBmb3IgKGkgaW4gb2JqKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBjYWxsYmFjay5hcHBseShvYmpbaV0sIGFyZ3MpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBmYWxzZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIGlmIChpc0FycmF5KSB7XG5cdCAgICAgICAgICAgICAgICBmb3IgKDsgaSA8IGxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBjYWxsYmFjay5jYWxsKG9ialtpXSwgaSwgb2JqW2ldKTtcblxuXHQgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgZm9yIChpIGluIG9iaikge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gY2FsbGJhY2suY2FsbChvYmpbaV0sIGksIG9ialtpXSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IGZhbHNlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiBvYmo7XG5cdCAgICB9O1xuXG5cdCAgICAvKiBDdXN0b20gKi9cblx0ICAgICQuZGF0YSA9IGZ1bmN0aW9uIChub2RlLCBrZXksIHZhbHVlKSB7XG5cdCAgICAgICAgLyogJC5nZXREYXRhKCkgKi9cblx0ICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICB2YXIgaWQgPSBub2RlWyQuZXhwYW5kb10sXG5cdCAgICAgICAgICAgICAgICBzdG9yZSA9IGlkICYmIGNhY2hlW2lkXTtcblxuXHQgICAgICAgICAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBzdG9yZTtcblx0ICAgICAgICAgICAgfSBlbHNlIGlmIChzdG9yZSkge1xuXHQgICAgICAgICAgICAgICAgaWYgKGtleSBpbiBzdG9yZSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBzdG9yZVtrZXldO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgLyogJC5zZXREYXRhKCkgKi9cblx0ICAgICAgICB9IGVsc2UgaWYgKGtleSAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgIHZhciBpZCA9IG5vZGVbJC5leHBhbmRvXSB8fCAobm9kZVskLmV4cGFuZG9dID0gKyskLnV1aWQpO1xuXG5cdCAgICAgICAgICAgIGNhY2hlW2lkXSA9IGNhY2hlW2lkXSB8fCB7fTtcblx0ICAgICAgICAgICAgY2FjaGVbaWRdW2tleV0gPSB2YWx1ZTtcblxuXHQgICAgICAgICAgICByZXR1cm4gdmFsdWU7XG5cdCAgICAgICAgfVxuXHQgICAgfTtcblxuXHQgICAgLyogQ3VzdG9tICovXG5cdCAgICAkLnJlbW92ZURhdGEgPSBmdW5jdGlvbiAobm9kZSwga2V5cykge1xuXHQgICAgICAgIHZhciBpZCA9IG5vZGVbJC5leHBhbmRvXSxcblx0ICAgICAgICAgICAgc3RvcmUgPSBpZCAmJiBjYWNoZVtpZF07XG5cblx0ICAgICAgICBpZiAoc3RvcmUpIHtcblx0ICAgICAgICAgICAgJC5lYWNoKGtleXMsIGZ1bmN0aW9uKF8sIGtleSkge1xuXHQgICAgICAgICAgICAgICAgZGVsZXRlIHN0b3JlW2tleV07XG5cdCAgICAgICAgICAgIH0pO1xuXHQgICAgICAgIH1cblx0ICAgIH07XG5cblx0ICAgIC8qIGpRdWVyeSAqL1xuXHQgICAgJC5leHRlbmQgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgdmFyIHNyYywgY29weUlzQXJyYXksIGNvcHksIG5hbWUsIG9wdGlvbnMsIGNsb25lLFxuXHQgICAgICAgICAgICB0YXJnZXQgPSBhcmd1bWVudHNbMF0gfHwge30sXG5cdCAgICAgICAgICAgIGkgPSAxLFxuXHQgICAgICAgICAgICBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoLFxuXHQgICAgICAgICAgICBkZWVwID0gZmFsc2U7XG5cblx0ICAgICAgICBpZiAodHlwZW9mIHRhcmdldCA9PT0gXCJib29sZWFuXCIpIHtcblx0ICAgICAgICAgICAgZGVlcCA9IHRhcmdldDtcblxuXHQgICAgICAgICAgICB0YXJnZXQgPSBhcmd1bWVudHNbaV0gfHwge307XG5cdCAgICAgICAgICAgIGkrKztcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAodHlwZW9mIHRhcmdldCAhPT0gXCJvYmplY3RcIiAmJiAkLnR5cGUodGFyZ2V0KSAhPT0gXCJmdW5jdGlvblwiKSB7XG5cdCAgICAgICAgICAgIHRhcmdldCA9IHt9O1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmIChpID09PSBsZW5ndGgpIHtcblx0ICAgICAgICAgICAgdGFyZ2V0ID0gdGhpcztcblx0ICAgICAgICAgICAgaS0tO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGZvciAoOyBpIDwgbGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgaWYgKChvcHRpb25zID0gYXJndW1lbnRzW2ldKSAhPSBudWxsKSB7XG5cdCAgICAgICAgICAgICAgICBmb3IgKG5hbWUgaW4gb3B0aW9ucykge1xuXHQgICAgICAgICAgICAgICAgICAgIHNyYyA9IHRhcmdldFtuYW1lXTtcblx0ICAgICAgICAgICAgICAgICAgICBjb3B5ID0gb3B0aW9uc1tuYW1lXTtcblxuXHQgICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQgPT09IGNvcHkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKGRlZXAgJiYgY29weSAmJiAoJC5pc1BsYWluT2JqZWN0KGNvcHkpIHx8IChjb3B5SXNBcnJheSA9ICQuaXNBcnJheShjb3B5KSkpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb3B5SXNBcnJheSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29weUlzQXJyYXkgPSBmYWxzZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lID0gc3JjICYmICQuaXNBcnJheShzcmMpID8gc3JjIDogW107XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lID0gc3JjICYmICQuaXNQbGFpbk9iamVjdChzcmMpID8gc3JjIDoge307XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRbbmFtZV0gPSAkLmV4dGVuZChkZWVwLCBjbG9uZSwgY29weSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvcHkgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRbbmFtZV0gPSBjb3B5O1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiB0YXJnZXQ7XG5cdCAgICB9O1xuXG5cdCAgICAvKiBqUXVlcnkgMS40LjMgKi9cblx0ICAgICQucXVldWUgPSBmdW5jdGlvbiAoZWxlbSwgdHlwZSwgZGF0YSkge1xuXHQgICAgICAgIGZ1bmN0aW9uICRtYWtlQXJyYXkgKGFyciwgcmVzdWx0cykge1xuXHQgICAgICAgICAgICB2YXIgcmV0ID0gcmVzdWx0cyB8fCBbXTtcblxuXHQgICAgICAgICAgICBpZiAoYXJyICE9IG51bGwpIHtcblx0ICAgICAgICAgICAgICAgIGlmIChpc0FycmF5bGlrZShPYmplY3QoYXJyKSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAvKiAkLm1lcmdlICovXG5cdCAgICAgICAgICAgICAgICAgICAgKGZ1bmN0aW9uKGZpcnN0LCBzZWNvbmQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxlbiA9ICtzZWNvbmQubGVuZ3RoLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaiA9IDAsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpID0gZmlyc3QubGVuZ3RoO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChqIDwgbGVuKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaXJzdFtpKytdID0gc2Vjb25kW2orK107XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAobGVuICE9PSBsZW4pIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChzZWNvbmRbal0gIT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0W2krK10gPSBzZWNvbmRbaisrXTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0Lmxlbmd0aCA9IGk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpcnN0O1xuXHQgICAgICAgICAgICAgICAgICAgIH0pKHJldCwgdHlwZW9mIGFyciA9PT0gXCJzdHJpbmdcIiA/IFthcnJdIDogYXJyKTtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgW10ucHVzaC5jYWxsKHJldCwgYXJyKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHJldHVybiByZXQ7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKCFlbGVtKSB7XG5cdCAgICAgICAgICAgIHJldHVybjtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICB0eXBlID0gKHR5cGUgfHwgXCJmeFwiKSArIFwicXVldWVcIjtcblxuXHQgICAgICAgIHZhciBxID0gJC5kYXRhKGVsZW0sIHR5cGUpO1xuXG5cdCAgICAgICAgaWYgKCFkYXRhKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBxIHx8IFtdO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmICghcSB8fCAkLmlzQXJyYXkoZGF0YSkpIHtcblx0ICAgICAgICAgICAgcSA9ICQuZGF0YShlbGVtLCB0eXBlLCAkbWFrZUFycmF5KGRhdGEpKTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICBxLnB1c2goZGF0YSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHE7XG5cdCAgICB9O1xuXG5cdCAgICAvKiBqUXVlcnkgMS40LjMgKi9cblx0ICAgICQuZGVxdWV1ZSA9IGZ1bmN0aW9uIChlbGVtcywgdHlwZSkge1xuXHQgICAgICAgIC8qIEN1c3RvbTogRW1iZWQgZWxlbWVudCBpdGVyYXRpb24uICovXG5cdCAgICAgICAgJC5lYWNoKGVsZW1zLm5vZGVUeXBlID8gWyBlbGVtcyBdIDogZWxlbXMsIGZ1bmN0aW9uKGksIGVsZW0pIHtcblx0ICAgICAgICAgICAgdHlwZSA9IHR5cGUgfHwgXCJmeFwiO1xuXG5cdCAgICAgICAgICAgIHZhciBxdWV1ZSA9ICQucXVldWUoZWxlbSwgdHlwZSksXG5cdCAgICAgICAgICAgICAgICBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG5cblx0ICAgICAgICAgICAgaWYgKGZuID09PSBcImlucHJvZ3Jlc3NcIikge1xuXHQgICAgICAgICAgICAgICAgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgaWYgKGZuKSB7XG5cdCAgICAgICAgICAgICAgICBpZiAodHlwZSA9PT0gXCJmeFwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcXVldWUudW5zaGlmdChcImlucHJvZ3Jlc3NcIik7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIGZuLmNhbGwoZWxlbSwgZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgJC5kZXF1ZXVlKGVsZW0sIHR5cGUpO1xuXHQgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9KTtcblx0ICAgIH07XG5cblx0ICAgIC8qKioqKioqKioqKioqKioqKipcblx0ICAgICAgICQuZm4gTWV0aG9kc1xuXHQgICAgKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAvKiBqUXVlcnkgKi9cblx0ICAgICQuZm4gPSAkLnByb3RvdHlwZSA9IHtcblx0ICAgICAgICBpbml0OiBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcblx0ICAgICAgICAgICAgLyogSnVzdCByZXR1cm4gdGhlIGVsZW1lbnQgd3JhcHBlZCBpbnNpZGUgYW4gYXJyYXk7IGRvbid0IHByb2NlZWQgd2l0aCB0aGUgYWN0dWFsIGpRdWVyeSBub2RlIHdyYXBwaW5nIHByb2Nlc3MuICovXG5cdCAgICAgICAgICAgIGlmIChzZWxlY3Rvci5ub2RlVHlwZSkge1xuXHQgICAgICAgICAgICAgICAgdGhpc1swXSA9IHNlbGVjdG9yO1xuXG5cdCAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcblx0ICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBhIERPTSBub2RlLlwiKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0sXG5cblx0ICAgICAgICBvZmZzZXQ6IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgLyogalF1ZXJ5IGFsdGVyZWQgY29kZTogRHJvcHBlZCBkaXNjb25uZWN0ZWQgRE9NIG5vZGUgY2hlY2tpbmcuICovXG5cdCAgICAgICAgICAgIHZhciBib3ggPSB0aGlzWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCA/IHRoaXNbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkgOiB7IHRvcDogMCwgbGVmdDogMCB9O1xuXG5cdCAgICAgICAgICAgIHJldHVybiB7XG5cdCAgICAgICAgICAgICAgICB0b3A6IGJveC50b3AgKyAod2luZG93LnBhZ2VZT2Zmc2V0IHx8IGRvY3VtZW50LnNjcm9sbFRvcCAgfHwgMCkgIC0gKGRvY3VtZW50LmNsaWVudFRvcCAgfHwgMCksXG5cdCAgICAgICAgICAgICAgICBsZWZ0OiBib3gubGVmdCArICh3aW5kb3cucGFnZVhPZmZzZXQgfHwgZG9jdW1lbnQuc2Nyb2xsTGVmdCAgfHwgMCkgLSAoZG9jdW1lbnQuY2xpZW50TGVmdCB8fCAwKVxuXHQgICAgICAgICAgICB9O1xuXHQgICAgICAgIH0sXG5cblx0ICAgICAgICBwb3NpdGlvbjogZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAvKiBqUXVlcnkgKi9cblx0ICAgICAgICAgICAgZnVuY3Rpb24gb2Zmc2V0UGFyZW50KCkge1xuXHQgICAgICAgICAgICAgICAgdmFyIG9mZnNldFBhcmVudCA9IHRoaXMub2Zmc2V0UGFyZW50IHx8IGRvY3VtZW50O1xuXG5cdCAgICAgICAgICAgICAgICB3aGlsZSAob2Zmc2V0UGFyZW50ICYmICghb2Zmc2V0UGFyZW50Lm5vZGVUeXBlLnRvTG93ZXJDYXNlID09PSBcImh0bWxcIiAmJiBvZmZzZXRQYXJlbnQuc3R5bGUucG9zaXRpb24gPT09IFwic3RhdGljXCIpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgb2Zmc2V0UGFyZW50ID0gb2Zmc2V0UGFyZW50Lm9mZnNldFBhcmVudDtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgcmV0dXJuIG9mZnNldFBhcmVudCB8fCBkb2N1bWVudDtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8qIFplcHRvICovXG5cdCAgICAgICAgICAgIHZhciBlbGVtID0gdGhpc1swXSxcblx0ICAgICAgICAgICAgICAgIG9mZnNldFBhcmVudCA9IG9mZnNldFBhcmVudC5hcHBseShlbGVtKSxcblx0ICAgICAgICAgICAgICAgIG9mZnNldCA9IHRoaXMub2Zmc2V0KCksXG5cdCAgICAgICAgICAgICAgICBwYXJlbnRPZmZzZXQgPSAvXig/OmJvZHl8aHRtbCkkL2kudGVzdChvZmZzZXRQYXJlbnQubm9kZU5hbWUpID8geyB0b3A6IDAsIGxlZnQ6IDAgfSA6ICQob2Zmc2V0UGFyZW50KS5vZmZzZXQoKVxuXG5cdCAgICAgICAgICAgIG9mZnNldC50b3AgLT0gcGFyc2VGbG9hdChlbGVtLnN0eWxlLm1hcmdpblRvcCkgfHwgMDtcblx0ICAgICAgICAgICAgb2Zmc2V0LmxlZnQgLT0gcGFyc2VGbG9hdChlbGVtLnN0eWxlLm1hcmdpbkxlZnQpIHx8IDA7XG5cblx0ICAgICAgICAgICAgaWYgKG9mZnNldFBhcmVudC5zdHlsZSkge1xuXHQgICAgICAgICAgICAgICAgcGFyZW50T2Zmc2V0LnRvcCArPSBwYXJzZUZsb2F0KG9mZnNldFBhcmVudC5zdHlsZS5ib3JkZXJUb3BXaWR0aCkgfHwgMFxuXHQgICAgICAgICAgICAgICAgcGFyZW50T2Zmc2V0LmxlZnQgKz0gcGFyc2VGbG9hdChvZmZzZXRQYXJlbnQuc3R5bGUuYm9yZGVyTGVmdFdpZHRoKSB8fCAwXG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICByZXR1cm4ge1xuXHQgICAgICAgICAgICAgICAgdG9wOiBvZmZzZXQudG9wIC0gcGFyZW50T2Zmc2V0LnRvcCxcblx0ICAgICAgICAgICAgICAgIGxlZnQ6IG9mZnNldC5sZWZ0IC0gcGFyZW50T2Zmc2V0LmxlZnRcblx0ICAgICAgICAgICAgfTtcblx0ICAgICAgICB9XG5cdCAgICB9O1xuXG5cdCAgICAvKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgUHJpdmF0ZSBWYXJpYWJsZXNcblx0ICAgICoqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgIC8qIEZvciAkLmRhdGEoKSAqL1xuXHQgICAgdmFyIGNhY2hlID0ge307XG5cdCAgICAkLmV4cGFuZG8gPSBcInZlbG9jaXR5XCIgKyAobmV3IERhdGUoKS5nZXRUaW1lKCkpO1xuXHQgICAgJC51dWlkID0gMDtcblxuXHQgICAgLyogRm9yICQucXVldWUoKSAqL1xuXHQgICAgdmFyIGNsYXNzMnR5cGUgPSB7fSxcblx0ICAgICAgICBoYXNPd24gPSBjbGFzczJ0eXBlLmhhc093blByb3BlcnR5LFxuXHQgICAgICAgIHRvU3RyaW5nID0gY2xhc3MydHlwZS50b1N0cmluZztcblxuXHQgICAgdmFyIHR5cGVzID0gXCJCb29sZWFuIE51bWJlciBTdHJpbmcgRnVuY3Rpb24gQXJyYXkgRGF0ZSBSZWdFeHAgT2JqZWN0IEVycm9yXCIuc3BsaXQoXCIgXCIpO1xuXHQgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0eXBlcy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgIGNsYXNzMnR5cGVbXCJbb2JqZWN0IFwiICsgdHlwZXNbaV0gKyBcIl1cIl0gPSB0eXBlc1tpXS50b0xvd2VyQ2FzZSgpO1xuXHQgICAgfVxuXG5cdCAgICAvKiBNYWtlcyAkKG5vZGUpIHBvc3NpYmxlLCB3aXRob3V0IGhhdmluZyB0byBjYWxsIGluaXQuICovXG5cdCAgICAkLmZuLmluaXQucHJvdG90eXBlID0gJC5mbjtcblxuXHQgICAgLyogR2xvYmFsaXplIFZlbG9jaXR5IG9udG8gdGhlIHdpbmRvdywgYW5kIGFzc2lnbiBpdHMgVXRpbGl0aWVzIHByb3BlcnR5LiAqL1xuXHQgICAgd2luZG93LlZlbG9jaXR5ID0geyBVdGlsaXRpZXM6ICQgfTtcblx0fSkod2luZG93KTtcblxuXHQvKioqKioqKioqKioqKioqKioqXG5cdCAgICBWZWxvY2l0eS5qc1xuXHQqKioqKioqKioqKioqKioqKiovXG5cblx0OyhmdW5jdGlvbiAoZmFjdG9yeSkge1xuXHQgICAgLyogQ29tbW9uSlMgbW9kdWxlLiAqL1xuXHQgICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzID09PSBcIm9iamVjdFwiKSB7XG5cdCAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdCAgICAvKiBBTUQgbW9kdWxlLiAqL1xuXHQgICAgfSBlbHNlIGlmICh0cnVlKSB7XG5cdCAgICAgICAgIShfX1dFQlBBQ0tfQU1EX0RFRklORV9GQUNUT1JZX18gPSAoZmFjdG9yeSksIF9fV0VCUEFDS19BTURfREVGSU5FX1JFU1VMVF9fID0gKHR5cGVvZiBfX1dFQlBBQ0tfQU1EX0RFRklORV9GQUNUT1JZX18gPT09ICdmdW5jdGlvbicgPyAoX19XRUJQQUNLX0FNRF9ERUZJTkVfRkFDVE9SWV9fLmNhbGwoZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXywgZXhwb3J0cywgbW9kdWxlKSkgOiBfX1dFQlBBQ0tfQU1EX0RFRklORV9GQUNUT1JZX18pLCBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXyAhPT0gdW5kZWZpbmVkICYmIChtb2R1bGUuZXhwb3J0cyA9IF9fV0VCUEFDS19BTURfREVGSU5FX1JFU1VMVF9fKSk7XG5cdCAgICAvKiBCcm93c2VyIGdsb2JhbHMuICovXG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICAgIGZhY3RvcnkoKTtcblx0ICAgIH1cblx0fShmdW5jdGlvbigpIHtcblx0cmV0dXJuIGZ1bmN0aW9uIChnbG9iYWwsIHdpbmRvdywgZG9jdW1lbnQsIHVuZGVmaW5lZCkge1xuXG5cdCAgICAvKioqKioqKioqKioqKioqXG5cdCAgICAgICAgU3VtbWFyeVxuXHQgICAgKioqKioqKioqKioqKioqL1xuXG5cdCAgICAvKlxuXHQgICAgLSBDU1M6IENTUyBzdGFjayB0aGF0IHdvcmtzIGluZGVwZW5kZW50bHkgZnJvbSB0aGUgcmVzdCBvZiBWZWxvY2l0eS5cblx0ICAgIC0gYW5pbWF0ZSgpOiBDb3JlIGFuaW1hdGlvbiBtZXRob2QgdGhhdCBpdGVyYXRlcyBvdmVyIHRoZSB0YXJnZXRlZCBlbGVtZW50cyBhbmQgcXVldWVzIHRoZSBpbmNvbWluZyBjYWxsIG9udG8gZWFjaCBlbGVtZW50IGluZGl2aWR1YWxseS5cblx0ICAgICAgLSBQcmUtUXVldWVpbmc6IFByZXBhcmUgdGhlIGVsZW1lbnQgZm9yIGFuaW1hdGlvbiBieSBpbnN0YW50aWF0aW5nIGl0cyBkYXRhIGNhY2hlIGFuZCBwcm9jZXNzaW5nIHRoZSBjYWxsJ3Mgb3B0aW9ucy5cblx0ICAgICAgLSBRdWV1ZWluZzogVGhlIGxvZ2ljIHRoYXQgcnVucyBvbmNlIHRoZSBjYWxsIGhhcyByZWFjaGVkIGl0cyBwb2ludCBvZiBleGVjdXRpb24gaW4gdGhlIGVsZW1lbnQncyAkLnF1ZXVlKCkgc3RhY2suXG5cdCAgICAgICAgICAgICAgICAgIE1vc3QgbG9naWMgaXMgcGxhY2VkIGhlcmUgdG8gYXZvaWQgcmlza2luZyBpdCBiZWNvbWluZyBzdGFsZSAoaWYgdGhlIGVsZW1lbnQncyBwcm9wZXJ0aWVzIGhhdmUgY2hhbmdlZCkuXG5cdCAgICAgIC0gUHVzaGluZzogQ29uc29saWRhdGlvbiBvZiB0aGUgdHdlZW4gZGF0YSBmb2xsb3dlZCBieSBpdHMgcHVzaCBvbnRvIHRoZSBnbG9iYWwgaW4tcHJvZ3Jlc3MgY2FsbHMgY29udGFpbmVyLlxuXHQgICAgLSB0aWNrKCk6IFRoZSBzaW5nbGUgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIGxvb3AgcmVzcG9uc2libGUgZm9yIHR3ZWVuaW5nIGFsbCBpbi1wcm9ncmVzcyBjYWxscy5cblx0ICAgIC0gY29tcGxldGVDYWxsKCk6IEhhbmRsZXMgdGhlIGNsZWFudXAgcHJvY2VzcyBmb3IgZWFjaCBWZWxvY2l0eSBjYWxsLlxuXHQgICAgKi9cblxuXHQgICAgLyoqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgSGVscGVyIEZ1bmN0aW9uc1xuXHQgICAgKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAvKiBJRSBkZXRlY3Rpb24uIEdpc3Q6IGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL2p1bGlhbnNoYXBpcm8vOTA5ODYwOSAqL1xuXHQgICAgdmFyIElFID0gKGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIGlmIChkb2N1bWVudC5kb2N1bWVudE1vZGUpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGRvY3VtZW50LmRvY3VtZW50TW9kZTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICBmb3IgKHZhciBpID0gNzsgaSA+IDQ7IGktLSkge1xuXHQgICAgICAgICAgICAgICAgdmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cblx0ICAgICAgICAgICAgICAgIGRpdi5pbm5lckhUTUwgPSBcIjwhLS1baWYgSUUgXCIgKyBpICsgXCJdPjxzcGFuPjwvc3Bhbj48IVtlbmRpZl0tLT5cIjtcblxuXHQgICAgICAgICAgICAgICAgaWYgKGRpdi5nZXRFbGVtZW50c0J5VGFnTmFtZShcInNwYW5cIikubGVuZ3RoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgZGl2ID0gbnVsbDtcblxuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcblx0ICAgIH0pKCk7XG5cblx0ICAgIC8qIHJBRiBzaGltLiBHaXN0OiBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9qdWxpYW5zaGFwaXJvLzk0OTc1MTMgKi9cblx0ICAgIHZhciByQUZTaGltID0gKGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIHZhciB0aW1lTGFzdCA9IDA7XG5cblx0ICAgICAgICByZXR1cm4gd2luZG93LndlYmtpdFJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5cdCAgICAgICAgICAgIHZhciB0aW1lQ3VycmVudCA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCksXG5cdCAgICAgICAgICAgICAgICB0aW1lRGVsdGE7XG5cblx0ICAgICAgICAgICAgLyogRHluYW1pY2FsbHkgc2V0IGRlbGF5IG9uIGEgcGVyLXRpY2sgYmFzaXMgdG8gbWF0Y2ggNjBmcHMuICovXG5cdCAgICAgICAgICAgIC8qIFRlY2huaXF1ZSBieSBFcmlrIE1vbGxlci4gTUlUIGxpY2Vuc2U6IGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL3BhdWxpcmlzaC8xNTc5NjcxICovXG5cdCAgICAgICAgICAgIHRpbWVEZWx0YSA9IE1hdGgubWF4KDAsIDE2IC0gKHRpbWVDdXJyZW50IC0gdGltZUxhc3QpKTtcblx0ICAgICAgICAgICAgdGltZUxhc3QgPSB0aW1lQ3VycmVudCArIHRpbWVEZWx0YTtcblxuXHQgICAgICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2sodGltZUN1cnJlbnQgKyB0aW1lRGVsdGEpOyB9LCB0aW1lRGVsdGEpO1xuXHQgICAgICAgIH07XG5cdCAgICB9KSgpO1xuXG5cdCAgICAvKiBBcnJheSBjb21wYWN0aW5nLiBDb3B5cmlnaHQgTG8tRGFzaC4gTUlUIExpY2Vuc2U6IGh0dHBzOi8vZ2l0aHViLmNvbS9sb2Rhc2gvbG9kYXNoL2Jsb2IvbWFzdGVyL0xJQ0VOU0UudHh0ICovXG5cdCAgICBmdW5jdGlvbiBjb21wYWN0U3BhcnNlQXJyYXkgKGFycmF5KSB7XG5cdCAgICAgICAgdmFyIGluZGV4ID0gLTEsXG5cdCAgICAgICAgICAgIGxlbmd0aCA9IGFycmF5ID8gYXJyYXkubGVuZ3RoIDogMCxcblx0ICAgICAgICAgICAgcmVzdWx0ID0gW107XG5cblx0ICAgICAgICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuXHQgICAgICAgICAgICB2YXIgdmFsdWUgPSBhcnJheVtpbmRleF07XG5cblx0ICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG5cdCAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh2YWx1ZSk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gcmVzdWx0O1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBzYW5pdGl6ZUVsZW1lbnRzIChlbGVtZW50cykge1xuXHQgICAgICAgIC8qIFVud3JhcCBqUXVlcnkvWmVwdG8gb2JqZWN0cy4gKi9cblx0ICAgICAgICBpZiAoVHlwZS5pc1dyYXBwZWQoZWxlbWVudHMpKSB7XG5cdCAgICAgICAgICAgIGVsZW1lbnRzID0gW10uc2xpY2UuY2FsbChlbGVtZW50cyk7XG5cdCAgICAgICAgLyogV3JhcCBhIHNpbmdsZSBlbGVtZW50IGluIGFuIGFycmF5IHNvIHRoYXQgJC5lYWNoKCkgY2FuIGl0ZXJhdGUgd2l0aCB0aGUgZWxlbWVudCBpbnN0ZWFkIG9mIGl0cyBub2RlJ3MgY2hpbGRyZW4uICovXG5cdCAgICAgICAgfSBlbHNlIGlmIChUeXBlLmlzTm9kZShlbGVtZW50cykpIHtcblx0ICAgICAgICAgICAgZWxlbWVudHMgPSBbIGVsZW1lbnRzIF07XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIGVsZW1lbnRzO1xuXHQgICAgfVxuXG5cdCAgICB2YXIgVHlwZSA9IHtcblx0ICAgICAgICBpc1N0cmluZzogZnVuY3Rpb24gKHZhcmlhYmxlKSB7XG5cdCAgICAgICAgICAgIHJldHVybiAodHlwZW9mIHZhcmlhYmxlID09PSBcInN0cmluZ1wiKTtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIGlzQXJyYXk6IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKHZhcmlhYmxlKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFyaWFibGUpID09PSBcIltvYmplY3QgQXJyYXldXCI7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICBpc0Z1bmN0aW9uOiBmdW5jdGlvbiAodmFyaWFibGUpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YXJpYWJsZSkgPT09IFwiW29iamVjdCBGdW5jdGlvbl1cIjtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIGlzTm9kZTogZnVuY3Rpb24gKHZhcmlhYmxlKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB2YXJpYWJsZSAmJiB2YXJpYWJsZS5ub2RlVHlwZTtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIC8qIENvcHlyaWdodCBNYXJ0aW4gQm9obS4gTUlUIExpY2Vuc2U6IGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL1RvbWFsYWsvODE4YTc4YTIyNmEwNzM4ZWFhZGUgKi9cblx0ICAgICAgICBpc05vZGVMaXN0OiBmdW5jdGlvbiAodmFyaWFibGUpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiB2YXJpYWJsZSA9PT0gXCJvYmplY3RcIiAmJlxuXHQgICAgICAgICAgICAgICAgL15cXFtvYmplY3QgKEhUTUxDb2xsZWN0aW9ufE5vZGVMaXN0fE9iamVjdClcXF0kLy50ZXN0KE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YXJpYWJsZSkpICYmXG5cdCAgICAgICAgICAgICAgICB2YXJpYWJsZS5sZW5ndGggIT09IHVuZGVmaW5lZCAmJlxuXHQgICAgICAgICAgICAgICAgKHZhcmlhYmxlLmxlbmd0aCA9PT0gMCB8fCAodHlwZW9mIHZhcmlhYmxlWzBdID09PSBcIm9iamVjdFwiICYmIHZhcmlhYmxlWzBdLm5vZGVUeXBlID4gMCkpO1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgLyogRGV0ZXJtaW5lIGlmIHZhcmlhYmxlIGlzIGEgd3JhcHBlZCBqUXVlcnkgb3IgWmVwdG8gZWxlbWVudC4gKi9cblx0ICAgICAgICBpc1dyYXBwZWQ6IGZ1bmN0aW9uICh2YXJpYWJsZSkge1xuXHQgICAgICAgICAgICByZXR1cm4gdmFyaWFibGUgJiYgKHZhcmlhYmxlLmpxdWVyeSB8fCAod2luZG93LlplcHRvICYmIHdpbmRvdy5aZXB0by56ZXB0by5pc1oodmFyaWFibGUpKSk7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICBpc1NWRzogZnVuY3Rpb24gKHZhcmlhYmxlKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB3aW5kb3cuU1ZHRWxlbWVudCAmJiAodmFyaWFibGUgaW5zdGFuY2VvZiB3aW5kb3cuU1ZHRWxlbWVudCk7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICBpc0VtcHR5T2JqZWN0OiBmdW5jdGlvbiAodmFyaWFibGUpIHtcblx0ICAgICAgICAgICAgZm9yICh2YXIgbmFtZSBpbiB2YXJpYWJsZSkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cdCAgICAgICAgfVxuXHQgICAgfTtcblxuXHQgICAgLyoqKioqKioqKioqKioqKioqXG5cdCAgICAgICBEZXBlbmRlbmNpZXNcblx0ICAgICoqKioqKioqKioqKioqKioqL1xuXG5cdCAgICB2YXIgJCxcblx0ICAgICAgICBpc0pRdWVyeSA9IGZhbHNlO1xuXG5cdCAgICBpZiAoZ2xvYmFsLmZuICYmIGdsb2JhbC5mbi5qcXVlcnkpIHtcblx0ICAgICAgICAkID0gZ2xvYmFsO1xuXHQgICAgICAgIGlzSlF1ZXJ5ID0gdHJ1ZTtcblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgICAgJCA9IHdpbmRvdy5WZWxvY2l0eS5VdGlsaXRpZXM7XG5cdCAgICB9XG5cblx0ICAgIGlmIChJRSA8PSA4ICYmICFpc0pRdWVyeSkge1xuXHQgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlZlbG9jaXR5OiBJRTggYW5kIGJlbG93IHJlcXVpcmUgalF1ZXJ5IHRvIGJlIGxvYWRlZCBiZWZvcmUgVmVsb2NpdHkuXCIpO1xuXHQgICAgfSBlbHNlIGlmIChJRSA8PSA3KSB7XG5cdCAgICAgICAgLyogUmV2ZXJ0IHRvIGpRdWVyeSdzICQuYW5pbWF0ZSgpLCBhbmQgbG9zZSBWZWxvY2l0eSdzIGV4dHJhIGZlYXR1cmVzLiAqL1xuXHQgICAgICAgIGpRdWVyeS5mbi52ZWxvY2l0eSA9IGpRdWVyeS5mbi5hbmltYXRlO1xuXG5cdCAgICAgICAgLyogTm93IHRoYXQgJC5mbi52ZWxvY2l0eSBpcyBhbGlhc2VkLCBhYm9ydCB0aGlzIFZlbG9jaXR5IGRlY2xhcmF0aW9uLiAqL1xuXHQgICAgICAgIHJldHVybjtcblx0ICAgIH1cblxuXHQgICAgLyoqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgQ29uc3RhbnRzXG5cdCAgICAqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgdmFyIERVUkFUSU9OX0RFRkFVTFQgPSA0MDAsXG5cdCAgICAgICAgRUFTSU5HX0RFRkFVTFQgPSBcInN3aW5nXCI7XG5cblx0ICAgIC8qKioqKioqKioqKioqXG5cdCAgICAgICAgU3RhdGVcblx0ICAgICoqKioqKioqKioqKiovXG5cblx0ICAgIHZhciBWZWxvY2l0eSA9IHtcblx0ICAgICAgICAvKiBDb250YWluZXIgZm9yIHBhZ2Utd2lkZSBWZWxvY2l0eSBzdGF0ZSBkYXRhLiAqL1xuXHQgICAgICAgIFN0YXRlOiB7XG5cdCAgICAgICAgICAgIC8qIERldGVjdCBtb2JpbGUgZGV2aWNlcyB0byBkZXRlcm1pbmUgaWYgbW9iaWxlSEEgc2hvdWxkIGJlIHR1cm5lZCBvbi4gKi9cblx0ICAgICAgICAgICAgaXNNb2JpbGU6IC9BbmRyb2lkfHdlYk9TfGlQaG9uZXxpUGFkfGlQb2R8QmxhY2tCZXJyeXxJRU1vYmlsZXxPcGVyYSBNaW5pL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSxcblx0ICAgICAgICAgICAgLyogVGhlIG1vYmlsZUhBIG9wdGlvbidzIGJlaGF2aW9yIGNoYW5nZXMgb24gb2xkZXIgQW5kcm9pZCBkZXZpY2VzIChHaW5nZXJicmVhZCwgdmVyc2lvbnMgMi4zLjMtMi4zLjcpLiAqL1xuXHQgICAgICAgICAgICBpc0FuZHJvaWQ6IC9BbmRyb2lkL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSxcblx0ICAgICAgICAgICAgaXNHaW5nZXJicmVhZDogL0FuZHJvaWQgMlxcLjNcXC5bMy03XS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCksXG5cdCAgICAgICAgICAgIGlzQ2hyb21lOiB3aW5kb3cuY2hyb21lLFxuXHQgICAgICAgICAgICBpc0ZpcmVmb3g6IC9GaXJlZm94L2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSxcblx0ICAgICAgICAgICAgLyogQ3JlYXRlIGEgY2FjaGVkIGVsZW1lbnQgZm9yIHJlLXVzZSB3aGVuIGNoZWNraW5nIGZvciBDU1MgcHJvcGVydHkgcHJlZml4ZXMuICovXG5cdCAgICAgICAgICAgIHByZWZpeEVsZW1lbnQ6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiksXG5cdCAgICAgICAgICAgIC8qIENhY2hlIGV2ZXJ5IHByZWZpeCBtYXRjaCB0byBhdm9pZCByZXBlYXRpbmcgbG9va3Vwcy4gKi9cblx0ICAgICAgICAgICAgcHJlZml4TWF0Y2hlczoge30sXG5cdCAgICAgICAgICAgIC8qIENhY2hlIHRoZSBhbmNob3IgdXNlZCBmb3IgYW5pbWF0aW5nIHdpbmRvdyBzY3JvbGxpbmcuICovXG5cdCAgICAgICAgICAgIHNjcm9sbEFuY2hvcjogbnVsbCxcblx0ICAgICAgICAgICAgLyogQ2FjaGUgdGhlIGJyb3dzZXItc3BlY2lmaWMgcHJvcGVydHkgbmFtZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBzY3JvbGwgYW5jaG9yLiAqL1xuXHQgICAgICAgICAgICBzY3JvbGxQcm9wZXJ0eUxlZnQ6IG51bGwsXG5cdCAgICAgICAgICAgIHNjcm9sbFByb3BlcnR5VG9wOiBudWxsLFxuXHQgICAgICAgICAgICAvKiBLZWVwIHRyYWNrIG9mIHdoZXRoZXIgb3VyIFJBRiB0aWNrIGlzIHJ1bm5pbmcuICovXG5cdCAgICAgICAgICAgIGlzVGlja2luZzogZmFsc2UsXG5cdCAgICAgICAgICAgIC8qIENvbnRhaW5lciBmb3IgZXZlcnkgaW4tcHJvZ3Jlc3MgY2FsbCB0byBWZWxvY2l0eS4gKi9cblx0ICAgICAgICAgICAgY2FsbHM6IFtdXG5cdCAgICAgICAgfSxcblx0ICAgICAgICAvKiBWZWxvY2l0eSdzIGN1c3RvbSBDU1Mgc3RhY2suIE1hZGUgZ2xvYmFsIGZvciB1bml0IHRlc3RpbmcuICovXG5cdCAgICAgICAgQ1NTOiB7IC8qIERlZmluZWQgYmVsb3cuICovIH0sXG5cdCAgICAgICAgLyogQSBzaGltIG9mIHRoZSBqUXVlcnkgdXRpbGl0eSBmdW5jdGlvbnMgdXNlZCBieSBWZWxvY2l0eSAtLSBwcm92aWRlZCBieSBWZWxvY2l0eSdzIG9wdGlvbmFsIGpRdWVyeSBzaGltLiAqL1xuXHQgICAgICAgIFV0aWxpdGllczogJCxcblx0ICAgICAgICAvKiBDb250YWluZXIgZm9yIHRoZSB1c2VyJ3MgY3VzdG9tIGFuaW1hdGlvbiByZWRpcmVjdHMgdGhhdCBhcmUgcmVmZXJlbmNlZCBieSBuYW1lIGluIHBsYWNlIG9mIHRoZSBwcm9wZXJ0aWVzIG1hcCBhcmd1bWVudC4gKi9cblx0ICAgICAgICBSZWRpcmVjdHM6IHsgLyogTWFudWFsbHkgcmVnaXN0ZXJlZCBieSB0aGUgdXNlci4gKi8gfSxcblx0ICAgICAgICBFYXNpbmdzOiB7IC8qIERlZmluZWQgYmVsb3cuICovIH0sXG5cdCAgICAgICAgLyogQXR0ZW1wdCB0byB1c2UgRVM2IFByb21pc2VzIGJ5IGRlZmF1bHQuIFVzZXJzIGNhbiBvdmVycmlkZSB0aGlzIHdpdGggYSB0aGlyZC1wYXJ0eSBwcm9taXNlcyBsaWJyYXJ5LiAqL1xuXHQgICAgICAgIFByb21pc2U6IHdpbmRvdy5Qcm9taXNlLFxuXHQgICAgICAgIC8qIFZlbG9jaXR5IG9wdGlvbiBkZWZhdWx0cywgd2hpY2ggY2FuIGJlIG92ZXJyaWRlbiBieSB0aGUgdXNlci4gKi9cblx0ICAgICAgICBkZWZhdWx0czoge1xuXHQgICAgICAgICAgICBxdWV1ZTogXCJcIixcblx0ICAgICAgICAgICAgZHVyYXRpb246IERVUkFUSU9OX0RFRkFVTFQsXG5cdCAgICAgICAgICAgIGVhc2luZzogRUFTSU5HX0RFRkFVTFQsXG5cdCAgICAgICAgICAgIGJlZ2luOiB1bmRlZmluZWQsXG5cdCAgICAgICAgICAgIGNvbXBsZXRlOiB1bmRlZmluZWQsXG5cdCAgICAgICAgICAgIHByb2dyZXNzOiB1bmRlZmluZWQsXG5cdCAgICAgICAgICAgIGRpc3BsYXk6IHVuZGVmaW5lZCxcblx0ICAgICAgICAgICAgdmlzaWJpbGl0eTogdW5kZWZpbmVkLFxuXHQgICAgICAgICAgICBsb29wOiBmYWxzZSxcblx0ICAgICAgICAgICAgZGVsYXk6IGZhbHNlLFxuXHQgICAgICAgICAgICBtb2JpbGVIQTogdHJ1ZSxcblx0ICAgICAgICAgICAgLyogQWR2YW5jZWQ6IFNldCB0byBmYWxzZSB0byBwcmV2ZW50IHByb3BlcnR5IHZhbHVlcyBmcm9tIGJlaW5nIGNhY2hlZCBiZXR3ZWVuIGNvbnNlY3V0aXZlIFZlbG9jaXR5LWluaXRpYXRlZCBjaGFpbiBjYWxscy4gKi9cblx0ICAgICAgICAgICAgX2NhY2hlVmFsdWVzOiB0cnVlXG5cdCAgICAgICAgfSxcblx0ICAgICAgICAvKiBBIGRlc2lnbiBnb2FsIG9mIFZlbG9jaXR5IGlzIHRvIGNhY2hlIGRhdGEgd2hlcmV2ZXIgcG9zc2libGUgaW4gb3JkZXIgdG8gYXZvaWQgRE9NIHJlcXVlcnlpbmcuIEFjY29yZGluZ2x5LCBlYWNoIGVsZW1lbnQgaGFzIGEgZGF0YSBjYWNoZS4gKi9cblx0ICAgICAgICBpbml0OiBmdW5jdGlvbiAoZWxlbWVudCkge1xuXHQgICAgICAgICAgICAkLmRhdGEoZWxlbWVudCwgXCJ2ZWxvY2l0eVwiLCB7XG5cdCAgICAgICAgICAgICAgICAvKiBTdG9yZSB3aGV0aGVyIHRoaXMgaXMgYW4gU1ZHIGVsZW1lbnQsIHNpbmNlIGl0cyBwcm9wZXJ0aWVzIGFyZSByZXRyaWV2ZWQgYW5kIHVwZGF0ZWQgZGlmZmVyZW50bHkgdGhhbiBzdGFuZGFyZCBIVE1MIGVsZW1lbnRzLiAqL1xuXHQgICAgICAgICAgICAgICAgaXNTVkc6IFR5cGUuaXNTVkcoZWxlbWVudCksXG5cdCAgICAgICAgICAgICAgICAvKiBLZWVwIHRyYWNrIG9mIHdoZXRoZXIgdGhlIGVsZW1lbnQgaXMgY3VycmVudGx5IGJlaW5nIGFuaW1hdGVkIGJ5IFZlbG9jaXR5LlxuXHQgICAgICAgICAgICAgICAgICAgVGhpcyBpcyB1c2VkIHRvIGVuc3VyZSB0aGF0IHByb3BlcnR5IHZhbHVlcyBhcmUgbm90IHRyYW5zZmVycmVkIGJldHdlZW4gbm9uLWNvbnNlY3V0aXZlIChzdGFsZSkgY2FsbHMuICovXG5cdCAgICAgICAgICAgICAgICBpc0FuaW1hdGluZzogZmFsc2UsXG5cdCAgICAgICAgICAgICAgICAvKiBBIHJlZmVyZW5jZSB0byB0aGUgZWxlbWVudCdzIGxpdmUgY29tcHV0ZWRTdHlsZSBvYmplY3QuIExlYXJuIG1vcmUgaGVyZTogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vZG9jcy9XZWIvQVBJL3dpbmRvdy5nZXRDb21wdXRlZFN0eWxlICovXG5cdCAgICAgICAgICAgICAgICBjb21wdXRlZFN0eWxlOiBudWxsLFxuXHQgICAgICAgICAgICAgICAgLyogVHdlZW4gZGF0YSBpcyBjYWNoZWQgZm9yIGVhY2ggYW5pbWF0aW9uIG9uIHRoZSBlbGVtZW50IHNvIHRoYXQgZGF0YSBjYW4gYmUgcGFzc2VkIGFjcm9zcyBjYWxscyAtLVxuXHQgICAgICAgICAgICAgICAgICAgaW4gcGFydGljdWxhciwgZW5kIHZhbHVlcyBhcmUgdXNlZCBhcyBzdWJzZXF1ZW50IHN0YXJ0IHZhbHVlcyBpbiBjb25zZWN1dGl2ZSBWZWxvY2l0eSBjYWxscy4gKi9cblx0ICAgICAgICAgICAgICAgIHR3ZWVuc0NvbnRhaW5lcjogbnVsbCxcblx0ICAgICAgICAgICAgICAgIC8qIFRoZSBmdWxsIHJvb3QgcHJvcGVydHkgdmFsdWVzIG9mIGVhY2ggQ1NTIGhvb2sgYmVpbmcgYW5pbWF0ZWQgb24gdGhpcyBlbGVtZW50IGFyZSBjYWNoZWQgc28gdGhhdDpcblx0ICAgICAgICAgICAgICAgICAgIDEpIENvbmN1cnJlbnRseS1hbmltYXRpbmcgaG9va3Mgc2hhcmluZyB0aGUgc2FtZSByb290IGNhbiBoYXZlIHRoZWlyIHJvb3QgdmFsdWVzJyBtZXJnZWQgaW50byBvbmUgd2hpbGUgdHdlZW5pbmcuXG5cdCAgICAgICAgICAgICAgICAgICAyKSBQb3N0LWhvb2staW5qZWN0aW9uIHJvb3QgdmFsdWVzIGNhbiBiZSB0cmFuc2ZlcnJlZCBvdmVyIHRvIGNvbnNlY3V0aXZlbHkgY2hhaW5lZCBWZWxvY2l0eSBjYWxscyBhcyBzdGFydGluZyByb290IHZhbHVlcy4gKi9cblx0ICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGU6IHt9LFxuXHQgICAgICAgICAgICAgICAgLyogQSBjYWNoZSBmb3IgdHJhbnNmb3JtIHVwZGF0ZXMsIHdoaWNoIG11c3QgYmUgbWFudWFsbHkgZmx1c2hlZCB2aWEgQ1NTLmZsdXNoVHJhbnNmb3JtQ2FjaGUoKS4gKi9cblx0ICAgICAgICAgICAgICAgIHRyYW5zZm9ybUNhY2hlOiB7fVxuXHQgICAgICAgICAgICB9KTtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIC8qIEEgcGFyYWxsZWwgdG8galF1ZXJ5J3MgJC5jc3MoKSwgdXNlZCBmb3IgZ2V0dGluZy9zZXR0aW5nIFZlbG9jaXR5J3MgaG9va2VkIENTUyBwcm9wZXJ0aWVzLiAqL1xuXHQgICAgICAgIGhvb2s6IG51bGwsIC8qIERlZmluZWQgYmVsb3cuICovXG5cdCAgICAgICAgLyogVmVsb2NpdHktd2lkZSBhbmltYXRpb24gdGltZSByZW1hcHBpbmcgZm9yIHRlc3RpbmcgcHVycG9zZXMuICovXG5cdCAgICAgICAgbW9jazogZmFsc2UsXG5cdCAgICAgICAgdmVyc2lvbjogeyBtYWpvcjogMSwgbWlub3I6IDIsIHBhdGNoOiAyIH0sXG5cdCAgICAgICAgLyogU2V0IHRvIDEgb3IgMiAobW9zdCB2ZXJib3NlKSB0byBvdXRwdXQgZGVidWcgaW5mbyB0byBjb25zb2xlLiAqL1xuXHQgICAgICAgIGRlYnVnOiBmYWxzZVxuXHQgICAgfTtcblxuXHQgICAgLyogUmV0cmlldmUgdGhlIGFwcHJvcHJpYXRlIHNjcm9sbCBhbmNob3IgYW5kIHByb3BlcnR5IG5hbWUgZm9yIHRoZSBicm93c2VyOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2luZG93LnNjcm9sbFkgKi9cblx0ICAgIGlmICh3aW5kb3cucGFnZVlPZmZzZXQgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgIFZlbG9jaXR5LlN0YXRlLnNjcm9sbEFuY2hvciA9IHdpbmRvdztcblx0ICAgICAgICBWZWxvY2l0eS5TdGF0ZS5zY3JvbGxQcm9wZXJ0eUxlZnQgPSBcInBhZ2VYT2Zmc2V0XCI7XG5cdCAgICAgICAgVmVsb2NpdHkuU3RhdGUuc2Nyb2xsUHJvcGVydHlUb3AgPSBcInBhZ2VZT2Zmc2V0XCI7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICAgIFZlbG9jaXR5LlN0YXRlLnNjcm9sbEFuY2hvciA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCB8fCBkb2N1bWVudC5ib2R5LnBhcmVudE5vZGUgfHwgZG9jdW1lbnQuYm9keTtcblx0ICAgICAgICBWZWxvY2l0eS5TdGF0ZS5zY3JvbGxQcm9wZXJ0eUxlZnQgPSBcInNjcm9sbExlZnRcIjtcblx0ICAgICAgICBWZWxvY2l0eS5TdGF0ZS5zY3JvbGxQcm9wZXJ0eVRvcCA9IFwic2Nyb2xsVG9wXCI7XG5cdCAgICB9XG5cblx0ICAgIC8qIFNob3J0aGFuZCBhbGlhcyBmb3IgalF1ZXJ5J3MgJC5kYXRhKCkgdXRpbGl0eS4gKi9cblx0ICAgIGZ1bmN0aW9uIERhdGEgKGVsZW1lbnQpIHtcblx0ICAgICAgICAvKiBIYXJkY29kZSBhIHJlZmVyZW5jZSB0byB0aGUgcGx1Z2luIG5hbWUuICovXG5cdCAgICAgICAgdmFyIHJlc3BvbnNlID0gJC5kYXRhKGVsZW1lbnQsIFwidmVsb2NpdHlcIik7XG5cblx0ICAgICAgICAvKiBqUXVlcnkgPD0xLjQuMiByZXR1cm5zIG51bGwgaW5zdGVhZCBvZiB1bmRlZmluZWQgd2hlbiBubyBtYXRjaCBpcyBmb3VuZC4gV2Ugbm9ybWFsaXplIHRoaXMgYmVoYXZpb3IuICovXG5cdCAgICAgICAgcmV0dXJuIHJlc3BvbnNlID09PSBudWxsID8gdW5kZWZpbmVkIDogcmVzcG9uc2U7XG5cdCAgICB9O1xuXG5cdCAgICAvKioqKioqKioqKioqKipcblx0ICAgICAgICBFYXNpbmdcblx0ICAgICoqKioqKioqKioqKioqL1xuXG5cdCAgICAvKiBTdGVwIGVhc2luZyBnZW5lcmF0b3IuICovXG5cdCAgICBmdW5jdGlvbiBnZW5lcmF0ZVN0ZXAgKHN0ZXBzKSB7XG5cdCAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHAgKiBzdGVwcykgKiAoMSAvIHN0ZXBzKTtcblx0ICAgICAgICB9O1xuXHQgICAgfVxuXG5cdCAgICAvKiBCZXppZXIgY3VydmUgZnVuY3Rpb24gZ2VuZXJhdG9yLiBDb3B5cmlnaHQgR2FldGFuIFJlbmF1ZGVhdS4gTUlUIExpY2Vuc2U6IGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTUlUX0xpY2Vuc2UgKi9cblx0ICAgIGZ1bmN0aW9uIGdlbmVyYXRlQmV6aWVyIChtWDEsIG1ZMSwgbVgyLCBtWTIpIHtcblx0ICAgICAgICB2YXIgTkVXVE9OX0lURVJBVElPTlMgPSA0LFxuXHQgICAgICAgICAgICBORVdUT05fTUlOX1NMT1BFID0gMC4wMDEsXG5cdCAgICAgICAgICAgIFNVQkRJVklTSU9OX1BSRUNJU0lPTiA9IDAuMDAwMDAwMSxcblx0ICAgICAgICAgICAgU1VCRElWSVNJT05fTUFYX0lURVJBVElPTlMgPSAxMCxcblx0ICAgICAgICAgICAga1NwbGluZVRhYmxlU2l6ZSA9IDExLFxuXHQgICAgICAgICAgICBrU2FtcGxlU3RlcFNpemUgPSAxLjAgLyAoa1NwbGluZVRhYmxlU2l6ZSAtIDEuMCksXG5cdCAgICAgICAgICAgIGZsb2F0MzJBcnJheVN1cHBvcnRlZCA9IFwiRmxvYXQzMkFycmF5XCIgaW4gd2luZG93O1xuXG5cdCAgICAgICAgLyogTXVzdCBjb250YWluIGZvdXIgYXJndW1lbnRzLiAqL1xuXHQgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoICE9PSA0KSB7XG5cdCAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvKiBBcmd1bWVudHMgbXVzdCBiZSBudW1iZXJzLiAqL1xuXHQgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgKytpKSB7XG5cdCAgICAgICAgICAgIGlmICh0eXBlb2YgYXJndW1lbnRzW2ldICE9PSBcIm51bWJlclwiIHx8IGlzTmFOKGFyZ3VtZW50c1tpXSkgfHwgIWlzRmluaXRlKGFyZ3VtZW50c1tpXSkpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8qIFggdmFsdWVzIG11c3QgYmUgaW4gdGhlIFswLCAxXSByYW5nZS4gKi9cblx0ICAgICAgICBtWDEgPSBNYXRoLm1pbihtWDEsIDEpO1xuXHQgICAgICAgIG1YMiA9IE1hdGgubWluKG1YMiwgMSk7XG5cdCAgICAgICAgbVgxID0gTWF0aC5tYXgobVgxLCAwKTtcblx0ICAgICAgICBtWDIgPSBNYXRoLm1heChtWDIsIDApO1xuXG5cdCAgICAgICAgdmFyIG1TYW1wbGVWYWx1ZXMgPSBmbG9hdDMyQXJyYXlTdXBwb3J0ZWQgPyBuZXcgRmxvYXQzMkFycmF5KGtTcGxpbmVUYWJsZVNpemUpIDogbmV3IEFycmF5KGtTcGxpbmVUYWJsZVNpemUpO1xuXG5cdCAgICAgICAgZnVuY3Rpb24gQSAoYUExLCBhQTIpIHsgcmV0dXJuIDEuMCAtIDMuMCAqIGFBMiArIDMuMCAqIGFBMTsgfVxuXHQgICAgICAgIGZ1bmN0aW9uIEIgKGFBMSwgYUEyKSB7IHJldHVybiAzLjAgKiBhQTIgLSA2LjAgKiBhQTE7IH1cblx0ICAgICAgICBmdW5jdGlvbiBDIChhQTEpICAgICAgeyByZXR1cm4gMy4wICogYUExOyB9XG5cblx0ICAgICAgICBmdW5jdGlvbiBjYWxjQmV6aWVyIChhVCwgYUExLCBhQTIpIHtcblx0ICAgICAgICAgICAgcmV0dXJuICgoQShhQTEsIGFBMikqYVQgKyBCKGFBMSwgYUEyKSkqYVQgKyBDKGFBMSkpKmFUO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGZ1bmN0aW9uIGdldFNsb3BlIChhVCwgYUExLCBhQTIpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIDMuMCAqIEEoYUExLCBhQTIpKmFUKmFUICsgMi4wICogQihhQTEsIGFBMikgKiBhVCArIEMoYUExKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBmdW5jdGlvbiBuZXd0b25SYXBoc29uSXRlcmF0ZSAoYVgsIGFHdWVzc1QpIHtcblx0ICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBORVdUT05fSVRFUkFUSU9OUzsgKytpKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgY3VycmVudFNsb3BlID0gZ2V0U2xvcGUoYUd1ZXNzVCwgbVgxLCBtWDIpO1xuXG5cdCAgICAgICAgICAgICAgICBpZiAoY3VycmVudFNsb3BlID09PSAwLjApIHJldHVybiBhR3Vlc3NUO1xuXG5cdCAgICAgICAgICAgICAgICB2YXIgY3VycmVudFggPSBjYWxjQmV6aWVyKGFHdWVzc1QsIG1YMSwgbVgyKSAtIGFYO1xuXHQgICAgICAgICAgICAgICAgYUd1ZXNzVCAtPSBjdXJyZW50WCAvIGN1cnJlbnRTbG9wZTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHJldHVybiBhR3Vlc3NUO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGZ1bmN0aW9uIGNhbGNTYW1wbGVWYWx1ZXMgKCkge1xuXHQgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtTcGxpbmVUYWJsZVNpemU7ICsraSkge1xuXHQgICAgICAgICAgICAgICAgbVNhbXBsZVZhbHVlc1tpXSA9IGNhbGNCZXppZXIoaSAqIGtTYW1wbGVTdGVwU2l6ZSwgbVgxLCBtWDIpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgZnVuY3Rpb24gYmluYXJ5U3ViZGl2aWRlIChhWCwgYUEsIGFCKSB7XG5cdCAgICAgICAgICAgIHZhciBjdXJyZW50WCwgY3VycmVudFQsIGkgPSAwO1xuXG5cdCAgICAgICAgICAgIGRvIHtcblx0ICAgICAgICAgICAgICAgIGN1cnJlbnRUID0gYUEgKyAoYUIgLSBhQSkgLyAyLjA7XG5cdCAgICAgICAgICAgICAgICBjdXJyZW50WCA9IGNhbGNCZXppZXIoY3VycmVudFQsIG1YMSwgbVgyKSAtIGFYO1xuXHQgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRYID4gMC4wKSB7XG5cdCAgICAgICAgICAgICAgICAgIGFCID0gY3VycmVudFQ7XG5cdCAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICBhQSA9IGN1cnJlbnRUO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9IHdoaWxlIChNYXRoLmFicyhjdXJyZW50WCkgPiBTVUJESVZJU0lPTl9QUkVDSVNJT04gJiYgKytpIDwgU1VCRElWSVNJT05fTUFYX0lURVJBVElPTlMpO1xuXG5cdCAgICAgICAgICAgIHJldHVybiBjdXJyZW50VDtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBmdW5jdGlvbiBnZXRURm9yWCAoYVgpIHtcblx0ICAgICAgICAgICAgdmFyIGludGVydmFsU3RhcnQgPSAwLjAsXG5cdCAgICAgICAgICAgICAgICBjdXJyZW50U2FtcGxlID0gMSxcblx0ICAgICAgICAgICAgICAgIGxhc3RTYW1wbGUgPSBrU3BsaW5lVGFibGVTaXplIC0gMTtcblxuXHQgICAgICAgICAgICBmb3IgKDsgY3VycmVudFNhbXBsZSAhPSBsYXN0U2FtcGxlICYmIG1TYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZV0gPD0gYVg7ICsrY3VycmVudFNhbXBsZSkge1xuXHQgICAgICAgICAgICAgICAgaW50ZXJ2YWxTdGFydCArPSBrU2FtcGxlU3RlcFNpemU7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAtLWN1cnJlbnRTYW1wbGU7XG5cblx0ICAgICAgICAgICAgdmFyIGRpc3QgPSAoYVggLSBtU2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGVdKSAvIChtU2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGUrMV0gLSBtU2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGVdKSxcblx0ICAgICAgICAgICAgICAgIGd1ZXNzRm9yVCA9IGludGVydmFsU3RhcnQgKyBkaXN0ICoga1NhbXBsZVN0ZXBTaXplLFxuXHQgICAgICAgICAgICAgICAgaW5pdGlhbFNsb3BlID0gZ2V0U2xvcGUoZ3Vlc3NGb3JULCBtWDEsIG1YMik7XG5cblx0ICAgICAgICAgICAgaWYgKGluaXRpYWxTbG9wZSA+PSBORVdUT05fTUlOX1NMT1BFKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gbmV3dG9uUmFwaHNvbkl0ZXJhdGUoYVgsIGd1ZXNzRm9yVCk7XG5cdCAgICAgICAgICAgIH0gZWxzZSBpZiAoaW5pdGlhbFNsb3BlID09IDAuMCkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIGd1ZXNzRm9yVDtcblx0ICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBiaW5hcnlTdWJkaXZpZGUoYVgsIGludGVydmFsU3RhcnQsIGludGVydmFsU3RhcnQgKyBrU2FtcGxlU3RlcFNpemUpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIF9wcmVjb21wdXRlZCA9IGZhbHNlO1xuXG5cdCAgICAgICAgZnVuY3Rpb24gcHJlY29tcHV0ZSgpIHtcblx0ICAgICAgICAgICAgX3ByZWNvbXB1dGVkID0gdHJ1ZTtcblx0ICAgICAgICAgICAgaWYgKG1YMSAhPSBtWTEgfHwgbVgyICE9IG1ZMikgY2FsY1NhbXBsZVZhbHVlcygpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHZhciBmID0gZnVuY3Rpb24gKGFYKSB7XG5cdCAgICAgICAgICAgIGlmICghX3ByZWNvbXB1dGVkKSBwcmVjb21wdXRlKCk7XG5cdCAgICAgICAgICAgIGlmIChtWDEgPT09IG1ZMSAmJiBtWDIgPT09IG1ZMikgcmV0dXJuIGFYO1xuXHQgICAgICAgICAgICBpZiAoYVggPT09IDApIHJldHVybiAwO1xuXHQgICAgICAgICAgICBpZiAoYVggPT09IDEpIHJldHVybiAxO1xuXG5cdCAgICAgICAgICAgIHJldHVybiBjYWxjQmV6aWVyKGdldFRGb3JYKGFYKSwgbVkxLCBtWTIpO1xuXHQgICAgICAgIH07XG5cblx0ICAgICAgICBmLmdldENvbnRyb2xQb2ludHMgPSBmdW5jdGlvbigpIHsgcmV0dXJuIFt7IHg6IG1YMSwgeTogbVkxIH0sIHsgeDogbVgyLCB5OiBtWTIgfV07IH07XG5cblx0ICAgICAgICB2YXIgc3RyID0gXCJnZW5lcmF0ZUJlemllcihcIiArIFttWDEsIG1ZMSwgbVgyLCBtWTJdICsgXCIpXCI7XG5cdCAgICAgICAgZi50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHN0cjsgfTtcblxuXHQgICAgICAgIHJldHVybiBmO1xuXHQgICAgfVxuXG5cdCAgICAvKiBSdW5nZS1LdXR0YSBzcHJpbmcgcGh5c2ljcyBmdW5jdGlvbiBnZW5lcmF0b3IuIEFkYXB0ZWQgZnJvbSBGcmFtZXIuanMsIGNvcHlyaWdodCBLb2VuIEJvay4gTUlUIExpY2Vuc2U6IGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTUlUX0xpY2Vuc2UgKi9cblx0ICAgIC8qIEdpdmVuIGEgdGVuc2lvbiwgZnJpY3Rpb24sIGFuZCBkdXJhdGlvbiwgYSBzaW11bGF0aW9uIGF0IDYwRlBTIHdpbGwgZmlyc3QgcnVuIHdpdGhvdXQgYSBkZWZpbmVkIGR1cmF0aW9uIGluIG9yZGVyIHRvIGNhbGN1bGF0ZSB0aGUgZnVsbCBwYXRoLiBBIHNlY29uZCBwYXNzXG5cdCAgICAgICB0aGVuIGFkanVzdHMgdGhlIHRpbWUgZGVsdGEgLS0gdXNpbmcgdGhlIHJlbGF0aW9uIGJldHdlZW4gYWN0dWFsIHRpbWUgYW5kIGR1cmF0aW9uIC0tIHRvIGNhbGN1bGF0ZSB0aGUgcGF0aCBmb3IgdGhlIGR1cmF0aW9uLWNvbnN0cmFpbmVkIGFuaW1hdGlvbi4gKi9cblx0ICAgIHZhciBnZW5lcmF0ZVNwcmluZ1JLNCA9IChmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgZnVuY3Rpb24gc3ByaW5nQWNjZWxlcmF0aW9uRm9yU3RhdGUgKHN0YXRlKSB7XG5cdCAgICAgICAgICAgIHJldHVybiAoLXN0YXRlLnRlbnNpb24gKiBzdGF0ZS54KSAtIChzdGF0ZS5mcmljdGlvbiAqIHN0YXRlLnYpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGZ1bmN0aW9uIHNwcmluZ0V2YWx1YXRlU3RhdGVXaXRoRGVyaXZhdGl2ZSAoaW5pdGlhbFN0YXRlLCBkdCwgZGVyaXZhdGl2ZSkge1xuXHQgICAgICAgICAgICB2YXIgc3RhdGUgPSB7XG5cdCAgICAgICAgICAgICAgICB4OiBpbml0aWFsU3RhdGUueCArIGRlcml2YXRpdmUuZHggKiBkdCxcblx0ICAgICAgICAgICAgICAgIHY6IGluaXRpYWxTdGF0ZS52ICsgZGVyaXZhdGl2ZS5kdiAqIGR0LFxuXHQgICAgICAgICAgICAgICAgdGVuc2lvbjogaW5pdGlhbFN0YXRlLnRlbnNpb24sXG5cdCAgICAgICAgICAgICAgICBmcmljdGlvbjogaW5pdGlhbFN0YXRlLmZyaWN0aW9uXG5cdCAgICAgICAgICAgIH07XG5cblx0ICAgICAgICAgICAgcmV0dXJuIHsgZHg6IHN0YXRlLnYsIGR2OiBzcHJpbmdBY2NlbGVyYXRpb25Gb3JTdGF0ZShzdGF0ZSkgfTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBmdW5jdGlvbiBzcHJpbmdJbnRlZ3JhdGVTdGF0ZSAoc3RhdGUsIGR0KSB7XG5cdCAgICAgICAgICAgIHZhciBhID0ge1xuXHQgICAgICAgICAgICAgICAgICAgIGR4OiBzdGF0ZS52LFxuXHQgICAgICAgICAgICAgICAgICAgIGR2OiBzcHJpbmdBY2NlbGVyYXRpb25Gb3JTdGF0ZShzdGF0ZSlcblx0ICAgICAgICAgICAgICAgIH0sXG5cdCAgICAgICAgICAgICAgICBiID0gc3ByaW5nRXZhbHVhdGVTdGF0ZVdpdGhEZXJpdmF0aXZlKHN0YXRlLCBkdCAqIDAuNSwgYSksXG5cdCAgICAgICAgICAgICAgICBjID0gc3ByaW5nRXZhbHVhdGVTdGF0ZVdpdGhEZXJpdmF0aXZlKHN0YXRlLCBkdCAqIDAuNSwgYiksXG5cdCAgICAgICAgICAgICAgICBkID0gc3ByaW5nRXZhbHVhdGVTdGF0ZVdpdGhEZXJpdmF0aXZlKHN0YXRlLCBkdCwgYyksXG5cdCAgICAgICAgICAgICAgICBkeGR0ID0gMS4wIC8gNi4wICogKGEuZHggKyAyLjAgKiAoYi5keCArIGMuZHgpICsgZC5keCksXG5cdCAgICAgICAgICAgICAgICBkdmR0ID0gMS4wIC8gNi4wICogKGEuZHYgKyAyLjAgKiAoYi5kdiArIGMuZHYpICsgZC5kdik7XG5cblx0ICAgICAgICAgICAgc3RhdGUueCA9IHN0YXRlLnggKyBkeGR0ICogZHQ7XG5cdCAgICAgICAgICAgIHN0YXRlLnYgPSBzdGF0ZS52ICsgZHZkdCAqIGR0O1xuXG5cdCAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gZnVuY3Rpb24gc3ByaW5nUks0RmFjdG9yeSAodGVuc2lvbiwgZnJpY3Rpb24sIGR1cmF0aW9uKSB7XG5cblx0ICAgICAgICAgICAgdmFyIGluaXRTdGF0ZSA9IHtcblx0ICAgICAgICAgICAgICAgICAgICB4OiAtMSxcblx0ICAgICAgICAgICAgICAgICAgICB2OiAwLFxuXHQgICAgICAgICAgICAgICAgICAgIHRlbnNpb246IG51bGwsXG5cdCAgICAgICAgICAgICAgICAgICAgZnJpY3Rpb246IG51bGxcblx0ICAgICAgICAgICAgICAgIH0sXG5cdCAgICAgICAgICAgICAgICBwYXRoID0gWzBdLFxuXHQgICAgICAgICAgICAgICAgdGltZV9sYXBzZWQgPSAwLFxuXHQgICAgICAgICAgICAgICAgdG9sZXJhbmNlID0gMSAvIDEwMDAwLFxuXHQgICAgICAgICAgICAgICAgRFQgPSAxNiAvIDEwMDAsXG5cdCAgICAgICAgICAgICAgICBoYXZlX2R1cmF0aW9uLCBkdCwgbGFzdF9zdGF0ZTtcblxuXHQgICAgICAgICAgICB0ZW5zaW9uID0gcGFyc2VGbG9hdCh0ZW5zaW9uKSB8fCA1MDA7XG5cdCAgICAgICAgICAgIGZyaWN0aW9uID0gcGFyc2VGbG9hdChmcmljdGlvbikgfHwgMjA7XG5cdCAgICAgICAgICAgIGR1cmF0aW9uID0gZHVyYXRpb24gfHwgbnVsbDtcblxuXHQgICAgICAgICAgICBpbml0U3RhdGUudGVuc2lvbiA9IHRlbnNpb247XG5cdCAgICAgICAgICAgIGluaXRTdGF0ZS5mcmljdGlvbiA9IGZyaWN0aW9uO1xuXG5cdCAgICAgICAgICAgIGhhdmVfZHVyYXRpb24gPSBkdXJhdGlvbiAhPT0gbnVsbDtcblxuXHQgICAgICAgICAgICAvKiBDYWxjdWxhdGUgdGhlIGFjdHVhbCB0aW1lIGl0IHRha2VzIGZvciB0aGlzIGFuaW1hdGlvbiB0byBjb21wbGV0ZSB3aXRoIHRoZSBwcm92aWRlZCBjb25kaXRpb25zLiAqL1xuXHQgICAgICAgICAgICBpZiAoaGF2ZV9kdXJhdGlvbikge1xuXHQgICAgICAgICAgICAgICAgLyogUnVuIHRoZSBzaW11bGF0aW9uIHdpdGhvdXQgYSBkdXJhdGlvbi4gKi9cblx0ICAgICAgICAgICAgICAgIHRpbWVfbGFwc2VkID0gc3ByaW5nUks0RmFjdG9yeSh0ZW5zaW9uLCBmcmljdGlvbik7XG5cdCAgICAgICAgICAgICAgICAvKiBDb21wdXRlIHRoZSBhZGp1c3RlZCB0aW1lIGRlbHRhLiAqL1xuXHQgICAgICAgICAgICAgICAgZHQgPSB0aW1lX2xhcHNlZCAvIGR1cmF0aW9uICogRFQ7XG5cdCAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICBkdCA9IERUO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcblx0ICAgICAgICAgICAgICAgIC8qIE5leHQvc3RlcCBmdW5jdGlvbiAuKi9cblx0ICAgICAgICAgICAgICAgIGxhc3Rfc3RhdGUgPSBzcHJpbmdJbnRlZ3JhdGVTdGF0ZShsYXN0X3N0YXRlIHx8IGluaXRTdGF0ZSwgZHQpO1xuXHQgICAgICAgICAgICAgICAgLyogU3RvcmUgdGhlIHBvc2l0aW9uLiAqL1xuXHQgICAgICAgICAgICAgICAgcGF0aC5wdXNoKDEgKyBsYXN0X3N0YXRlLngpO1xuXHQgICAgICAgICAgICAgICAgdGltZV9sYXBzZWQgKz0gMTY7XG5cdCAgICAgICAgICAgICAgICAvKiBJZiB0aGUgY2hhbmdlIHRocmVzaG9sZCBpcyByZWFjaGVkLCBicmVhay4gKi9cblx0ICAgICAgICAgICAgICAgIGlmICghKE1hdGguYWJzKGxhc3Rfc3RhdGUueCkgPiB0b2xlcmFuY2UgJiYgTWF0aC5hYnMobGFzdF9zdGF0ZS52KSA+IHRvbGVyYW5jZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8qIElmIGR1cmF0aW9uIGlzIG5vdCBkZWZpbmVkLCByZXR1cm4gdGhlIGFjdHVhbCB0aW1lIHJlcXVpcmVkIGZvciBjb21wbGV0aW5nIHRoaXMgYW5pbWF0aW9uLiBPdGhlcndpc2UsIHJldHVybiBhIGNsb3N1cmUgdGhhdCBob2xkcyB0aGVcblx0ICAgICAgICAgICAgICAgY29tcHV0ZWQgcGF0aCBhbmQgcmV0dXJucyBhIHNuYXBzaG90IG9mIHRoZSBwb3NpdGlvbiBhY2NvcmRpbmcgdG8gYSBnaXZlbiBwZXJjZW50Q29tcGxldGUuICovXG5cdCAgICAgICAgICAgIHJldHVybiAhaGF2ZV9kdXJhdGlvbiA/IHRpbWVfbGFwc2VkIDogZnVuY3Rpb24ocGVyY2VudENvbXBsZXRlKSB7IHJldHVybiBwYXRoWyAocGVyY2VudENvbXBsZXRlICogKHBhdGgubGVuZ3RoIC0gMSkpIHwgMCBdOyB9O1xuXHQgICAgICAgIH07XG5cdCAgICB9KCkpO1xuXG5cdCAgICAvKiBqUXVlcnkgZWFzaW5ncy4gKi9cblx0ICAgIFZlbG9jaXR5LkVhc2luZ3MgPSB7XG5cdCAgICAgICAgbGluZWFyOiBmdW5jdGlvbihwKSB7IHJldHVybiBwOyB9LFxuXHQgICAgICAgIHN3aW5nOiBmdW5jdGlvbihwKSB7IHJldHVybiAwLjUgLSBNYXRoLmNvcyggcCAqIE1hdGguUEkgKSAvIDIgfSxcblx0ICAgICAgICAvKiBCb251cyBcInNwcmluZ1wiIGVhc2luZywgd2hpY2ggaXMgYSBsZXNzIGV4YWdnZXJhdGVkIHZlcnNpb24gb2YgZWFzZUluT3V0RWxhc3RpYy4gKi9cblx0ICAgICAgICBzcHJpbmc6IGZ1bmN0aW9uKHApIHsgcmV0dXJuIDEgLSAoTWF0aC5jb3MocCAqIDQuNSAqIE1hdGguUEkpICogTWF0aC5leHAoLXAgKiA2KSk7IH1cblx0ICAgIH07XG5cblx0ICAgIC8qIENTUzMgYW5kIFJvYmVydCBQZW5uZXIgZWFzaW5ncy4gKi9cblx0ICAgICQuZWFjaChcblx0ICAgICAgICBbXG5cdCAgICAgICAgICAgIFsgXCJlYXNlXCIsIFsgMC4yNSwgMC4xLCAwLjI1LCAxLjAgXSBdLFxuXHQgICAgICAgICAgICBbIFwiZWFzZS1pblwiLCBbIDAuNDIsIDAuMCwgMS4wMCwgMS4wIF0gXSxcblx0ICAgICAgICAgICAgWyBcImVhc2Utb3V0XCIsIFsgMC4wMCwgMC4wLCAwLjU4LCAxLjAgXSBdLFxuXHQgICAgICAgICAgICBbIFwiZWFzZS1pbi1vdXRcIiwgWyAwLjQyLCAwLjAsIDAuNTgsIDEuMCBdIF0sXG5cdCAgICAgICAgICAgIFsgXCJlYXNlSW5TaW5lXCIsIFsgMC40NywgMCwgMC43NDUsIDAuNzE1IF0gXSxcblx0ICAgICAgICAgICAgWyBcImVhc2VPdXRTaW5lXCIsIFsgMC4zOSwgMC41NzUsIDAuNTY1LCAxIF0gXSxcblx0ICAgICAgICAgICAgWyBcImVhc2VJbk91dFNpbmVcIiwgWyAwLjQ0NSwgMC4wNSwgMC41NSwgMC45NSBdIF0sXG5cdCAgICAgICAgICAgIFsgXCJlYXNlSW5RdWFkXCIsIFsgMC41NSwgMC4wODUsIDAuNjgsIDAuNTMgXSBdLFxuXHQgICAgICAgICAgICBbIFwiZWFzZU91dFF1YWRcIiwgWyAwLjI1LCAwLjQ2LCAwLjQ1LCAwLjk0IF0gXSxcblx0ICAgICAgICAgICAgWyBcImVhc2VJbk91dFF1YWRcIiwgWyAwLjQ1NSwgMC4wMywgMC41MTUsIDAuOTU1IF0gXSxcblx0ICAgICAgICAgICAgWyBcImVhc2VJbkN1YmljXCIsIFsgMC41NSwgMC4wNTUsIDAuNjc1LCAwLjE5IF0gXSxcblx0ICAgICAgICAgICAgWyBcImVhc2VPdXRDdWJpY1wiLCBbIDAuMjE1LCAwLjYxLCAwLjM1NSwgMSBdIF0sXG5cdCAgICAgICAgICAgIFsgXCJlYXNlSW5PdXRDdWJpY1wiLCBbIDAuNjQ1LCAwLjA0NSwgMC4zNTUsIDEgXSBdLFxuXHQgICAgICAgICAgICBbIFwiZWFzZUluUXVhcnRcIiwgWyAwLjg5NSwgMC4wMywgMC42ODUsIDAuMjIgXSBdLFxuXHQgICAgICAgICAgICBbIFwiZWFzZU91dFF1YXJ0XCIsIFsgMC4xNjUsIDAuODQsIDAuNDQsIDEgXSBdLFxuXHQgICAgICAgICAgICBbIFwiZWFzZUluT3V0UXVhcnRcIiwgWyAwLjc3LCAwLCAwLjE3NSwgMSBdIF0sXG5cdCAgICAgICAgICAgIFsgXCJlYXNlSW5RdWludFwiLCBbIDAuNzU1LCAwLjA1LCAwLjg1NSwgMC4wNiBdIF0sXG5cdCAgICAgICAgICAgIFsgXCJlYXNlT3V0UXVpbnRcIiwgWyAwLjIzLCAxLCAwLjMyLCAxIF0gXSxcblx0ICAgICAgICAgICAgWyBcImVhc2VJbk91dFF1aW50XCIsIFsgMC44NiwgMCwgMC4wNywgMSBdIF0sXG5cdCAgICAgICAgICAgIFsgXCJlYXNlSW5FeHBvXCIsIFsgMC45NSwgMC4wNSwgMC43OTUsIDAuMDM1IF0gXSxcblx0ICAgICAgICAgICAgWyBcImVhc2VPdXRFeHBvXCIsIFsgMC4xOSwgMSwgMC4yMiwgMSBdIF0sXG5cdCAgICAgICAgICAgIFsgXCJlYXNlSW5PdXRFeHBvXCIsIFsgMSwgMCwgMCwgMSBdIF0sXG5cdCAgICAgICAgICAgIFsgXCJlYXNlSW5DaXJjXCIsIFsgMC42LCAwLjA0LCAwLjk4LCAwLjMzNSBdIF0sXG5cdCAgICAgICAgICAgIFsgXCJlYXNlT3V0Q2lyY1wiLCBbIDAuMDc1LCAwLjgyLCAwLjE2NSwgMSBdIF0sXG5cdCAgICAgICAgICAgIFsgXCJlYXNlSW5PdXRDaXJjXCIsIFsgMC43ODUsIDAuMTM1LCAwLjE1LCAwLjg2IF0gXVxuXHQgICAgICAgIF0sIGZ1bmN0aW9uKGksIGVhc2luZ0FycmF5KSB7XG5cdCAgICAgICAgICAgIFZlbG9jaXR5LkVhc2luZ3NbZWFzaW5nQXJyYXlbMF1dID0gZ2VuZXJhdGVCZXppZXIuYXBwbHkobnVsbCwgZWFzaW5nQXJyYXlbMV0pO1xuXHQgICAgICAgIH0pO1xuXG5cdCAgICAvKiBEZXRlcm1pbmUgdGhlIGFwcHJvcHJpYXRlIGVhc2luZyB0eXBlIGdpdmVuIGFuIGVhc2luZyBpbnB1dC4gKi9cblx0ICAgIGZ1bmN0aW9uIGdldEVhc2luZyh2YWx1ZSwgZHVyYXRpb24pIHtcblx0ICAgICAgICB2YXIgZWFzaW5nID0gdmFsdWU7XG5cblx0ICAgICAgICAvKiBUaGUgZWFzaW5nIG9wdGlvbiBjYW4gZWl0aGVyIGJlIGEgc3RyaW5nIHRoYXQgcmVmZXJlbmNlcyBhIHByZS1yZWdpc3RlcmVkIGVhc2luZyxcblx0ICAgICAgICAgICBvciBpdCBjYW4gYmUgYSB0d28tL2ZvdXItaXRlbSBhcnJheSBvZiBpbnRlZ2VycyB0byBiZSBjb252ZXJ0ZWQgaW50byBhIGJlemllci9zcHJpbmcgZnVuY3Rpb24uICovXG5cdCAgICAgICAgaWYgKFR5cGUuaXNTdHJpbmcodmFsdWUpKSB7XG5cdCAgICAgICAgICAgIC8qIEVuc3VyZSB0aGF0IHRoZSBlYXNpbmcgaGFzIGJlZW4gYXNzaWduZWQgdG8galF1ZXJ5J3MgVmVsb2NpdHkuRWFzaW5ncyBvYmplY3QuICovXG5cdCAgICAgICAgICAgIGlmICghVmVsb2NpdHkuRWFzaW5nc1t2YWx1ZV0pIHtcblx0ICAgICAgICAgICAgICAgIGVhc2luZyA9IGZhbHNlO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSBlbHNlIGlmIChUeXBlLmlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PT0gMSkge1xuXHQgICAgICAgICAgICBlYXNpbmcgPSBnZW5lcmF0ZVN0ZXAuYXBwbHkobnVsbCwgdmFsdWUpO1xuXHQgICAgICAgIH0gZWxzZSBpZiAoVHlwZS5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPT09IDIpIHtcblx0ICAgICAgICAgICAgLyogc3ByaW5nUks0IG11c3QgYmUgcGFzc2VkIHRoZSBhbmltYXRpb24ncyBkdXJhdGlvbi4gKi9cblx0ICAgICAgICAgICAgLyogTm90ZTogSWYgdGhlIHNwcmluZ1JLNCBhcnJheSBjb250YWlucyBub24tbnVtYmVycywgZ2VuZXJhdGVTcHJpbmdSSzQoKSByZXR1cm5zIGFuIGVhc2luZ1xuXHQgICAgICAgICAgICAgICBmdW5jdGlvbiBnZW5lcmF0ZWQgd2l0aCBkZWZhdWx0IHRlbnNpb24gYW5kIGZyaWN0aW9uIHZhbHVlcy4gKi9cblx0ICAgICAgICAgICAgZWFzaW5nID0gZ2VuZXJhdGVTcHJpbmdSSzQuYXBwbHkobnVsbCwgdmFsdWUuY29uY2F0KFsgZHVyYXRpb24gXSkpO1xuXHQgICAgICAgIH0gZWxzZSBpZiAoVHlwZS5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPT09IDQpIHtcblx0ICAgICAgICAgICAgLyogTm90ZTogSWYgdGhlIGJlemllciBhcnJheSBjb250YWlucyBub24tbnVtYmVycywgZ2VuZXJhdGVCZXppZXIoKSByZXR1cm5zIGZhbHNlLiAqL1xuXHQgICAgICAgICAgICBlYXNpbmcgPSBnZW5lcmF0ZUJlemllci5hcHBseShudWxsLCB2YWx1ZSk7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgZWFzaW5nID0gZmFsc2U7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLyogUmV2ZXJ0IHRvIHRoZSBWZWxvY2l0eS13aWRlIGRlZmF1bHQgZWFzaW5nIHR5cGUsIG9yIGZhbGwgYmFjayB0byBcInN3aW5nXCIgKHdoaWNoIGlzIGFsc28galF1ZXJ5J3MgZGVmYXVsdClcblx0ICAgICAgICAgICBpZiB0aGUgVmVsb2NpdHktd2lkZSBkZWZhdWx0IGhhcyBiZWVuIGluY29ycmVjdGx5IG1vZGlmaWVkLiAqL1xuXHQgICAgICAgIGlmIChlYXNpbmcgPT09IGZhbHNlKSB7XG5cdCAgICAgICAgICAgIGlmIChWZWxvY2l0eS5FYXNpbmdzW1ZlbG9jaXR5LmRlZmF1bHRzLmVhc2luZ10pIHtcblx0ICAgICAgICAgICAgICAgIGVhc2luZyA9IFZlbG9jaXR5LmRlZmF1bHRzLmVhc2luZztcblx0ICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIGVhc2luZyA9IEVBU0lOR19ERUZBVUxUO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIGVhc2luZztcblx0ICAgIH1cblxuXHQgICAgLyoqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgQ1NTIFN0YWNrXG5cdCAgICAqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgLyogVGhlIENTUyBvYmplY3QgaXMgYSBoaWdobHkgY29uZGVuc2VkIGFuZCBwZXJmb3JtYW50IENTUyBzdGFjayB0aGF0IGZ1bGx5IHJlcGxhY2VzIGpRdWVyeSdzLlxuXHQgICAgICAgSXQgaGFuZGxlcyB0aGUgdmFsaWRhdGlvbiwgZ2V0dGluZywgYW5kIHNldHRpbmcgb2YgYm90aCBzdGFuZGFyZCBDU1MgcHJvcGVydGllcyBhbmQgQ1NTIHByb3BlcnR5IGhvb2tzLiAqL1xuXHQgICAgLyogTm90ZTogQSBcIkNTU1wiIHNob3J0aGFuZCBpcyBhbGlhc2VkIHNvIHRoYXQgb3VyIGNvZGUgaXMgZWFzaWVyIHRvIHJlYWQuICovXG5cdCAgICB2YXIgQ1NTID0gVmVsb2NpdHkuQ1NTID0ge1xuXG5cdCAgICAgICAgLyoqKioqKioqKioqKipcblx0ICAgICAgICAgICAgUmVnRXhcblx0ICAgICAgICAqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgUmVnRXg6IHtcblx0ICAgICAgICAgICAgaXNIZXg6IC9eIyhbQS1mXFxkXXszfSl7MSwyfSQvaSxcblx0ICAgICAgICAgICAgLyogVW53cmFwIGEgcHJvcGVydHkgdmFsdWUncyBzdXJyb3VuZGluZyB0ZXh0LCBlLmcuIFwicmdiYSg0LCAzLCAyLCAxKVwiID09PiBcIjQsIDMsIDIsIDFcIiBhbmQgXCJyZWN0KDRweCAzcHggMnB4IDFweClcIiA9PT4gXCI0cHggM3B4IDJweCAxcHhcIi4gKi9cblx0ICAgICAgICAgICAgdmFsdWVVbndyYXA6IC9eW0Etel0rXFwoKC4qKVxcKSQvaSxcblx0ICAgICAgICAgICAgd3JhcHBlZFZhbHVlQWxyZWFkeUV4dHJhY3RlZDogL1swLTkuXSsgWzAtOS5dKyBbMC05Ll0rKCBbMC05Ll0rKT8vLFxuXHQgICAgICAgICAgICAvKiBTcGxpdCBhIG11bHRpLXZhbHVlIHByb3BlcnR5IGludG8gYW4gYXJyYXkgb2Ygc3VidmFsdWVzLCBlLmcuIFwicmdiYSg0LCAzLCAyLCAxKSA0cHggM3B4IDJweCAxcHhcIiA9PT4gWyBcInJnYmEoNCwgMywgMiwgMSlcIiwgXCI0cHhcIiwgXCIzcHhcIiwgXCIycHhcIiwgXCIxcHhcIiBdLiAqL1xuXHQgICAgICAgICAgICB2YWx1ZVNwbGl0OiAvKFtBLXpdK1xcKC4rXFwpKXwoKFtBLXowLTkjLS5dKz8pKD89XFxzfCQpKS9pZ1xuXHQgICAgICAgIH0sXG5cblx0ICAgICAgICAvKioqKioqKioqKioqXG5cdCAgICAgICAgICAgIExpc3RzXG5cdCAgICAgICAgKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgTGlzdHM6IHtcblx0ICAgICAgICAgICAgY29sb3JzOiBbIFwiZmlsbFwiLCBcInN0cm9rZVwiLCBcInN0b3BDb2xvclwiLCBcImNvbG9yXCIsIFwiYmFja2dyb3VuZENvbG9yXCIsIFwiYm9yZGVyQ29sb3JcIiwgXCJib3JkZXJUb3BDb2xvclwiLCBcImJvcmRlclJpZ2h0Q29sb3JcIiwgXCJib3JkZXJCb3R0b21Db2xvclwiLCBcImJvcmRlckxlZnRDb2xvclwiLCBcIm91dGxpbmVDb2xvclwiIF0sXG5cdCAgICAgICAgICAgIHRyYW5zZm9ybXNCYXNlOiBbIFwidHJhbnNsYXRlWFwiLCBcInRyYW5zbGF0ZVlcIiwgXCJzY2FsZVwiLCBcInNjYWxlWFwiLCBcInNjYWxlWVwiLCBcInNrZXdYXCIsIFwic2tld1lcIiwgXCJyb3RhdGVaXCIgXSxcblx0ICAgICAgICAgICAgdHJhbnNmb3JtczNEOiBbIFwidHJhbnNmb3JtUGVyc3BlY3RpdmVcIiwgXCJ0cmFuc2xhdGVaXCIsIFwic2NhbGVaXCIsIFwicm90YXRlWFwiLCBcInJvdGF0ZVlcIiBdXG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIC8qKioqKioqKioqKipcblx0ICAgICAgICAgICAgSG9va3Ncblx0ICAgICAgICAqKioqKioqKioqKiovXG5cblx0ICAgICAgICAvKiBIb29rcyBhbGxvdyBhIHN1YnByb3BlcnR5IChlLmcuIFwiYm94U2hhZG93Qmx1clwiKSBvZiBhIGNvbXBvdW5kLXZhbHVlIENTUyBwcm9wZXJ0eVxuXHQgICAgICAgICAgIChlLmcuIFwiYm94U2hhZG93OiBYIFkgQmx1ciBTcHJlYWQgQ29sb3JcIikgdG8gYmUgYW5pbWF0ZWQgYXMgaWYgaXQgd2VyZSBhIGRpc2NyZXRlIHByb3BlcnR5LiAqL1xuXHQgICAgICAgIC8qIE5vdGU6IEJleW9uZCBlbmFibGluZyBmaW5lLWdyYWluZWQgcHJvcGVydHkgYW5pbWF0aW9uLCBob29raW5nIGlzIG5lY2Vzc2FyeSBzaW5jZSBWZWxvY2l0eSBvbmx5XG5cdCAgICAgICAgICAgdHdlZW5zIHByb3BlcnRpZXMgd2l0aCBzaW5nbGUgbnVtZXJpYyB2YWx1ZXM7IHVubGlrZSBDU1MgdHJhbnNpdGlvbnMsIFZlbG9jaXR5IGRvZXMgbm90IGludGVycG9sYXRlIGNvbXBvdW5kLXZhbHVlcy4gKi9cblx0ICAgICAgICBIb29rczoge1xuXHQgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgIFJlZ2lzdHJhdGlvblxuXHQgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAvKiBUZW1wbGF0ZXMgYXJlIGEgY29uY2lzZSB3YXkgb2YgaW5kaWNhdGluZyB3aGljaCBzdWJwcm9wZXJ0aWVzIG11c3QgYmUgaW5kaXZpZHVhbGx5IHJlZ2lzdGVyZWQgZm9yIGVhY2ggY29tcG91bmQtdmFsdWUgQ1NTIHByb3BlcnR5LiAqL1xuXHQgICAgICAgICAgICAvKiBFYWNoIHRlbXBsYXRlIGNvbnNpc3RzIG9mIHRoZSBjb21wb3VuZC12YWx1ZSdzIGJhc2UgbmFtZSwgaXRzIGNvbnN0aXR1ZW50IHN1YnByb3BlcnR5IG5hbWVzLCBhbmQgdGhvc2Ugc3VicHJvcGVydGllcycgZGVmYXVsdCB2YWx1ZXMuICovXG5cdCAgICAgICAgICAgIHRlbXBsYXRlczoge1xuXHQgICAgICAgICAgICAgICAgXCJ0ZXh0U2hhZG93XCI6IFsgXCJDb2xvciBYIFkgQmx1clwiLCBcImJsYWNrIDBweCAwcHggMHB4XCIgXSxcblx0ICAgICAgICAgICAgICAgIFwiYm94U2hhZG93XCI6IFsgXCJDb2xvciBYIFkgQmx1ciBTcHJlYWRcIiwgXCJibGFjayAwcHggMHB4IDBweCAwcHhcIiBdLFxuXHQgICAgICAgICAgICAgICAgXCJjbGlwXCI6IFsgXCJUb3AgUmlnaHQgQm90dG9tIExlZnRcIiwgXCIwcHggMHB4IDBweCAwcHhcIiBdLFxuXHQgICAgICAgICAgICAgICAgXCJiYWNrZ3JvdW5kUG9zaXRpb25cIjogWyBcIlggWVwiLCBcIjAlIDAlXCIgXSxcblx0ICAgICAgICAgICAgICAgIFwidHJhbnNmb3JtT3JpZ2luXCI6IFsgXCJYIFkgWlwiLCBcIjUwJSA1MCUgMHB4XCIgXSxcblx0ICAgICAgICAgICAgICAgIFwicGVyc3BlY3RpdmVPcmlnaW5cIjogWyBcIlggWVwiLCBcIjUwJSA1MCVcIiBdXG5cdCAgICAgICAgICAgIH0sXG5cblx0ICAgICAgICAgICAgLyogQSBcInJlZ2lzdGVyZWRcIiBob29rIGlzIG9uZSB0aGF0IGhhcyBiZWVuIGNvbnZlcnRlZCBmcm9tIGl0cyB0ZW1wbGF0ZSBmb3JtIGludG8gYSBsaXZlLFxuXHQgICAgICAgICAgICAgICB0d2VlbmFibGUgcHJvcGVydHkuIEl0IGNvbnRhaW5zIGRhdGEgdG8gYXNzb2NpYXRlIGl0IHdpdGggaXRzIHJvb3QgcHJvcGVydHkuICovXG5cdCAgICAgICAgICAgIHJlZ2lzdGVyZWQ6IHtcblx0ICAgICAgICAgICAgICAgIC8qIE5vdGU6IEEgcmVnaXN0ZXJlZCBob29rIGxvb2tzIGxpa2UgdGhpcyA9PT4gdGV4dFNoYWRvd0JsdXI6IFsgXCJ0ZXh0U2hhZG93XCIsIDMgXSxcblx0ICAgICAgICAgICAgICAgICAgIHdoaWNoIGNvbnNpc3RzIG9mIHRoZSBzdWJwcm9wZXJ0eSdzIG5hbWUsIHRoZSBhc3NvY2lhdGVkIHJvb3QgcHJvcGVydHkncyBuYW1lLFxuXHQgICAgICAgICAgICAgICAgICAgYW5kIHRoZSBzdWJwcm9wZXJ0eSdzIHBvc2l0aW9uIGluIHRoZSByb290J3MgdmFsdWUuICovXG5cdCAgICAgICAgICAgIH0sXG5cdCAgICAgICAgICAgIC8qIENvbnZlcnQgdGhlIHRlbXBsYXRlcyBpbnRvIGluZGl2aWR1YWwgaG9va3MgdGhlbiBhcHBlbmQgdGhlbSB0byB0aGUgcmVnaXN0ZXJlZCBvYmplY3QgYWJvdmUuICovXG5cdCAgICAgICAgICAgIHJlZ2lzdGVyOiBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgICAgICAvKiBDb2xvciBob29rcyByZWdpc3RyYXRpb246IENvbG9ycyBhcmUgZGVmYXVsdGVkIHRvIHdoaXRlIC0tIGFzIG9wcG9zZWQgdG8gYmxhY2sgLS0gc2luY2UgY29sb3JzIHRoYXQgYXJlXG5cdCAgICAgICAgICAgICAgICAgICBjdXJyZW50bHkgc2V0IHRvIFwidHJhbnNwYXJlbnRcIiBkZWZhdWx0IHRvIHRoZWlyIHJlc3BlY3RpdmUgdGVtcGxhdGUgYmVsb3cgd2hlbiBjb2xvci1hbmltYXRlZCxcblx0ICAgICAgICAgICAgICAgICAgIGFuZCB3aGl0ZSBpcyB0eXBpY2FsbHkgYSBjbG9zZXIgbWF0Y2ggdG8gdHJhbnNwYXJlbnQgdGhhbiBibGFjayBpcy4gQW4gZXhjZXB0aW9uIGlzIG1hZGUgZm9yIHRleHQgKFwiY29sb3JcIiksXG5cdCAgICAgICAgICAgICAgICAgICB3aGljaCBpcyBhbG1vc3QgYWx3YXlzIHNldCBjbG9zZXIgdG8gYmxhY2sgdGhhbiB3aGl0ZS4gKi9cblx0ICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgQ1NTLkxpc3RzLmNvbG9ycy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciByZ2JDb21wb25lbnRzID0gKENTUy5MaXN0cy5jb2xvcnNbaV0gPT09IFwiY29sb3JcIikgPyBcIjAgMCAwIDFcIiA6IFwiMjU1IDI1NSAyNTUgMVwiO1xuXHQgICAgICAgICAgICAgICAgICAgIENTUy5Ib29rcy50ZW1wbGF0ZXNbQ1NTLkxpc3RzLmNvbG9yc1tpXV0gPSBbIFwiUmVkIEdyZWVuIEJsdWUgQWxwaGFcIiwgcmdiQ29tcG9uZW50cyBdO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICB2YXIgcm9vdFByb3BlcnR5LFxuXHQgICAgICAgICAgICAgICAgICAgIGhvb2tUZW1wbGF0ZSxcblx0ICAgICAgICAgICAgICAgICAgICBob29rTmFtZXM7XG5cblx0ICAgICAgICAgICAgICAgIC8qIEluIElFLCBjb2xvciB2YWx1ZXMgaW5zaWRlIGNvbXBvdW5kLXZhbHVlIHByb3BlcnRpZXMgYXJlIHBvc2l0aW9uZWQgYXQgdGhlIGVuZCB0aGUgdmFsdWUgaW5zdGVhZCBvZiBhdCB0aGUgYmVnaW5uaW5nLlxuXHQgICAgICAgICAgICAgICAgICAgVGh1cywgd2UgcmUtYXJyYW5nZSB0aGUgdGVtcGxhdGVzIGFjY29yZGluZ2x5LiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKElFKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgZm9yIChyb290UHJvcGVydHkgaW4gQ1NTLkhvb2tzLnRlbXBsYXRlcykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBob29rVGVtcGxhdGUgPSBDU1MuSG9va3MudGVtcGxhdGVzW3Jvb3RQcm9wZXJ0eV07XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGhvb2tOYW1lcyA9IGhvb2tUZW1wbGF0ZVswXS5zcGxpdChcIiBcIik7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRlZmF1bHRWYWx1ZXMgPSBob29rVGVtcGxhdGVbMV0ubWF0Y2goQ1NTLlJlZ0V4LnZhbHVlU3BsaXQpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChob29rTmFtZXNbMF0gPT09IFwiQ29sb3JcIikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogUmVwb3NpdGlvbiBib3RoIHRoZSBob29rJ3MgbmFtZSBhbmQgaXRzIGRlZmF1bHQgdmFsdWUgdG8gdGhlIGVuZCBvZiB0aGVpciByZXNwZWN0aXZlIHN0cmluZ3MuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBob29rTmFtZXMucHVzaChob29rTmFtZXMuc2hpZnQoKSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0VmFsdWVzLnB1c2goZGVmYXVsdFZhbHVlcy5zaGlmdCgpKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogUmVwbGFjZSB0aGUgZXhpc3RpbmcgdGVtcGxhdGUgZm9yIHRoZSBob29rJ3Mgcm9vdCBwcm9wZXJ0eS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIENTUy5Ib29rcy50ZW1wbGF0ZXNbcm9vdFByb3BlcnR5XSA9IFsgaG9va05hbWVzLmpvaW4oXCIgXCIpLCBkZWZhdWx0VmFsdWVzLmpvaW4oXCIgXCIpIF07XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIC8qIEhvb2sgcmVnaXN0cmF0aW9uLiAqL1xuXHQgICAgICAgICAgICAgICAgZm9yIChyb290UHJvcGVydHkgaW4gQ1NTLkhvb2tzLnRlbXBsYXRlcykge1xuXHQgICAgICAgICAgICAgICAgICAgIGhvb2tUZW1wbGF0ZSA9IENTUy5Ib29rcy50ZW1wbGF0ZXNbcm9vdFByb3BlcnR5XTtcblx0ICAgICAgICAgICAgICAgICAgICBob29rTmFtZXMgPSBob29rVGVtcGxhdGVbMF0uc3BsaXQoXCIgXCIpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBob29rTmFtZXMpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZ1bGxIb29rTmFtZSA9IHJvb3RQcm9wZXJ0eSArIGhvb2tOYW1lc1tpXSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvb2tQb3NpdGlvbiA9IGk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogRm9yIGVhY2ggaG9vaywgcmVnaXN0ZXIgaXRzIGZ1bGwgbmFtZSAoZS5nLiB0ZXh0U2hhZG93Qmx1cikgd2l0aCBpdHMgcm9vdCBwcm9wZXJ0eSAoZS5nLiB0ZXh0U2hhZG93KVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmQgdGhlIGhvb2sncyBwb3NpdGlvbiBpbiBpdHMgdGVtcGxhdGUncyBkZWZhdWx0IHZhbHVlIHN0cmluZy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbZnVsbEhvb2tOYW1lXSA9IFsgcm9vdFByb3BlcnR5LCBob29rUG9zaXRpb24gXTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH0sXG5cblx0ICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgIEluamVjdGlvbiBhbmQgRXh0cmFjdGlvblxuXHQgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAvKiBMb29rIHVwIHRoZSByb290IHByb3BlcnR5IGFzc29jaWF0ZWQgd2l0aCB0aGUgaG9vayAoZS5nLiByZXR1cm4gXCJ0ZXh0U2hhZG93XCIgZm9yIFwidGV4dFNoYWRvd0JsdXJcIikuICovXG5cdCAgICAgICAgICAgIC8qIFNpbmNlIGEgaG9vayBjYW5ub3QgYmUgc2V0IGRpcmVjdGx5ICh0aGUgYnJvd3NlciB3b24ndCByZWNvZ25pemUgaXQpLCBzdHlsZSB1cGRhdGluZyBmb3IgaG9va3MgaXMgcm91dGVkIHRocm91Z2ggdGhlIGhvb2sncyByb290IHByb3BlcnR5LiAqL1xuXHQgICAgICAgICAgICBnZXRSb290OiBmdW5jdGlvbiAocHJvcGVydHkpIHtcblx0ICAgICAgICAgICAgICAgIHZhciBob29rRGF0YSA9IENTUy5Ib29rcy5yZWdpc3RlcmVkW3Byb3BlcnR5XTtcblxuXHQgICAgICAgICAgICAgICAgaWYgKGhvb2tEYXRhKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGhvb2tEYXRhWzBdO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGVyZSB3YXMgbm8gaG9vayBtYXRjaCwgcmV0dXJuIHRoZSBwcm9wZXJ0eSBuYW1lIHVudG91Y2hlZC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvcGVydHk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH0sXG5cdCAgICAgICAgICAgIC8qIENvbnZlcnQgYW55IHJvb3RQcm9wZXJ0eVZhbHVlLCBudWxsIG9yIG90aGVyd2lzZSwgaW50byBhIHNwYWNlLWRlbGltaXRlZCBsaXN0IG9mIGhvb2sgdmFsdWVzIHNvIHRoYXRcblx0ICAgICAgICAgICAgICAgdGhlIHRhcmdldGVkIGhvb2sgY2FuIGJlIGluamVjdGVkIG9yIGV4dHJhY3RlZCBhdCBpdHMgc3RhbmRhcmQgcG9zaXRpb24uICovXG5cdCAgICAgICAgICAgIGNsZWFuUm9vdFByb3BlcnR5VmFsdWU6IGZ1bmN0aW9uKHJvb3RQcm9wZXJ0eSwgcm9vdFByb3BlcnR5VmFsdWUpIHtcblx0ICAgICAgICAgICAgICAgIC8qIElmIHRoZSByb290UHJvcGVydHlWYWx1ZSBpcyB3cmFwcGVkIHdpdGggXCJyZ2IoKVwiLCBcImNsaXAoKVwiLCBldGMuLCByZW1vdmUgdGhlIHdyYXBwaW5nIHRvIG5vcm1hbGl6ZSB0aGUgdmFsdWUgYmVmb3JlIG1hbmlwdWxhdGlvbi4gKi9cblx0ICAgICAgICAgICAgICAgIGlmIChDU1MuUmVnRXgudmFsdWVVbndyYXAudGVzdChyb290UHJvcGVydHlWYWx1ZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZSA9IHJvb3RQcm9wZXJ0eVZhbHVlLm1hdGNoKENTUy5SZWdFeC52YWx1ZVVud3JhcClbMV07XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIC8qIElmIHJvb3RQcm9wZXJ0eVZhbHVlIGlzIGEgQ1NTIG51bGwtdmFsdWUgKGZyb20gd2hpY2ggdGhlcmUncyBpbmhlcmVudGx5IG5vIGhvb2sgdmFsdWUgdG8gZXh0cmFjdCksXG5cdCAgICAgICAgICAgICAgICAgICBkZWZhdWx0IHRvIHRoZSByb290J3MgZGVmYXVsdCB2YWx1ZSBhcyBkZWZpbmVkIGluIENTUy5Ib29rcy50ZW1wbGF0ZXMuICovXG5cdCAgICAgICAgICAgICAgICAvKiBOb3RlOiBDU1MgbnVsbC12YWx1ZXMgaW5jbHVkZSBcIm5vbmVcIiwgXCJhdXRvXCIsIGFuZCBcInRyYW5zcGFyZW50XCIuIFRoZXkgbXVzdCBiZSBjb252ZXJ0ZWQgaW50byB0aGVpclxuXHQgICAgICAgICAgICAgICAgICAgemVyby12YWx1ZXMgKGUuZy4gdGV4dFNoYWRvdzogXCJub25lXCIgPT0+IHRleHRTaGFkb3c6IFwiMHB4IDBweCAwcHggYmxhY2tcIikgZm9yIGhvb2sgbWFuaXB1bGF0aW9uIHRvIHByb2NlZWQuICovXG5cdCAgICAgICAgICAgICAgICBpZiAoQ1NTLlZhbHVlcy5pc0NTU051bGxWYWx1ZShyb290UHJvcGVydHlWYWx1ZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZSA9IENTUy5Ib29rcy50ZW1wbGF0ZXNbcm9vdFByb3BlcnR5XVsxXTtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHJvb3RQcm9wZXJ0eVZhbHVlO1xuXHQgICAgICAgICAgICB9LFxuXHQgICAgICAgICAgICAvKiBFeHRyYWN0ZWQgdGhlIGhvb2sncyB2YWx1ZSBmcm9tIGl0cyByb290IHByb3BlcnR5J3MgdmFsdWUuIFRoaXMgaXMgdXNlZCB0byBnZXQgdGhlIHN0YXJ0aW5nIHZhbHVlIG9mIGFuIGFuaW1hdGluZyBob29rLiAqL1xuXHQgICAgICAgICAgICBleHRyYWN0VmFsdWU6IGZ1bmN0aW9uIChmdWxsSG9va05hbWUsIHJvb3RQcm9wZXJ0eVZhbHVlKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgaG9va0RhdGEgPSBDU1MuSG9va3MucmVnaXN0ZXJlZFtmdWxsSG9va05hbWVdO1xuXG5cdCAgICAgICAgICAgICAgICBpZiAoaG9va0RhdGEpIHtcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgaG9va1Jvb3QgPSBob29rRGF0YVswXSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgaG9va1Bvc2l0aW9uID0gaG9va0RhdGFbMV07XG5cblx0ICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZSA9IENTUy5Ib29rcy5jbGVhblJvb3RQcm9wZXJ0eVZhbHVlKGhvb2tSb290LCByb290UHJvcGVydHlWYWx1ZSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBTcGxpdCByb290UHJvcGVydHlWYWx1ZSBpbnRvIGl0cyBjb25zdGl0dWVudCBob29rIHZhbHVlcyB0aGVuIGdyYWIgdGhlIGRlc2lyZWQgaG9vayBhdCBpdHMgc3RhbmRhcmQgcG9zaXRpb24uICovXG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJvb3RQcm9wZXJ0eVZhbHVlLnRvU3RyaW5nKCkubWF0Y2goQ1NTLlJlZ0V4LnZhbHVlU3BsaXQpW2hvb2tQb3NpdGlvbl07XG5cdCAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBwcm92aWRlZCBmdWxsSG9va05hbWUgaXNuJ3QgYSByZWdpc3RlcmVkIGhvb2ssIHJldHVybiB0aGUgcm9vdFByb3BlcnR5VmFsdWUgdGhhdCB3YXMgcGFzc2VkIGluLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiByb290UHJvcGVydHlWYWx1ZTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfSxcblx0ICAgICAgICAgICAgLyogSW5qZWN0IHRoZSBob29rJ3MgdmFsdWUgaW50byBpdHMgcm9vdCBwcm9wZXJ0eSdzIHZhbHVlLiBUaGlzIGlzIHVzZWQgdG8gcGllY2UgYmFjayB0b2dldGhlciB0aGUgcm9vdCBwcm9wZXJ0eVxuXHQgICAgICAgICAgICAgICBvbmNlIFZlbG9jaXR5IGhhcyB1cGRhdGVkIG9uZSBvZiBpdHMgaW5kaXZpZHVhbGx5IGhvb2tlZCB2YWx1ZXMgdGhyb3VnaCB0d2VlbmluZy4gKi9cblx0ICAgICAgICAgICAgaW5qZWN0VmFsdWU6IGZ1bmN0aW9uIChmdWxsSG9va05hbWUsIGhvb2tWYWx1ZSwgcm9vdFByb3BlcnR5VmFsdWUpIHtcblx0ICAgICAgICAgICAgICAgIHZhciBob29rRGF0YSA9IENTUy5Ib29rcy5yZWdpc3RlcmVkW2Z1bGxIb29rTmFtZV07XG5cblx0ICAgICAgICAgICAgICAgIGlmIChob29rRGF0YSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciBob29rUm9vdCA9IGhvb2tEYXRhWzBdLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICBob29rUG9zaXRpb24gPSBob29rRGF0YVsxXSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWVQYXJ0cyxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWVVcGRhdGVkO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWUgPSBDU1MuSG9va3MuY2xlYW5Sb290UHJvcGVydHlWYWx1ZShob29rUm9vdCwgcm9vdFByb3BlcnR5VmFsdWUpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogU3BsaXQgcm9vdFByb3BlcnR5VmFsdWUgaW50byBpdHMgaW5kaXZpZHVhbCBob29rIHZhbHVlcywgcmVwbGFjZSB0aGUgdGFyZ2V0ZWQgdmFsdWUgd2l0aCBob29rVmFsdWUsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgdGhlbiByZWNvbnN0cnVjdCB0aGUgcm9vdFByb3BlcnR5VmFsdWUgc3RyaW5nLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlUGFydHMgPSByb290UHJvcGVydHlWYWx1ZS50b1N0cmluZygpLm1hdGNoKENTUy5SZWdFeC52YWx1ZVNwbGl0KTtcblx0ICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZVBhcnRzW2hvb2tQb3NpdGlvbl0gPSBob29rVmFsdWU7XG5cdCAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWVVcGRhdGVkID0gcm9vdFByb3BlcnR5VmFsdWVQYXJ0cy5qb2luKFwiIFwiKTtcblxuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiByb290UHJvcGVydHlWYWx1ZVVwZGF0ZWQ7XG5cdCAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBwcm92aWRlZCBmdWxsSG9va05hbWUgaXNuJ3QgYSByZWdpc3RlcmVkIGhvb2ssIHJldHVybiB0aGUgcm9vdFByb3BlcnR5VmFsdWUgdGhhdCB3YXMgcGFzc2VkIGluLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiByb290UHJvcGVydHlWYWx1ZTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0sXG5cblx0ICAgICAgICAvKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgIE5vcm1hbGl6YXRpb25zXG5cdCAgICAgICAgKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgIC8qIE5vcm1hbGl6YXRpb25zIHN0YW5kYXJkaXplIENTUyBwcm9wZXJ0eSBtYW5pcHVsYXRpb24gYnkgcG9sbHlmaWxsaW5nIGJyb3dzZXItc3BlY2lmaWMgaW1wbGVtZW50YXRpb25zIChlLmcuIG9wYWNpdHkpXG5cdCAgICAgICAgICAgYW5kIHJlZm9ybWF0dGluZyBzcGVjaWFsIHByb3BlcnRpZXMgKGUuZy4gY2xpcCwgcmdiYSkgdG8gbG9vayBsaWtlIHN0YW5kYXJkIG9uZXMuICovXG5cdCAgICAgICAgTm9ybWFsaXphdGlvbnM6IHtcblx0ICAgICAgICAgICAgLyogTm9ybWFsaXphdGlvbnMgYXJlIHBhc3NlZCBhIG5vcm1hbGl6YXRpb24gdGFyZ2V0IChlaXRoZXIgdGhlIHByb3BlcnR5J3MgbmFtZSwgaXRzIGV4dHJhY3RlZCB2YWx1ZSwgb3IgaXRzIGluamVjdGVkIHZhbHVlKSxcblx0ICAgICAgICAgICAgICAgdGhlIHRhcmdldGVkIGVsZW1lbnQgKHdoaWNoIG1heSBuZWVkIHRvIGJlIHF1ZXJpZWQpLCBhbmQgdGhlIHRhcmdldGVkIHByb3BlcnR5IHZhbHVlLiAqL1xuXHQgICAgICAgICAgICByZWdpc3RlcmVkOiB7XG5cdCAgICAgICAgICAgICAgICBjbGlwOiBmdW5jdGlvbiAodHlwZSwgZWxlbWVudCwgcHJvcGVydHlWYWx1ZSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwibmFtZVwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiY2xpcFwiO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBDbGlwIG5lZWRzIHRvIGJlIHVud3JhcHBlZCBhbmQgc3RyaXBwZWQgb2YgaXRzIGNvbW1hcyBkdXJpbmcgZXh0cmFjdGlvbi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImV4dHJhY3RcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBleHRyYWN0ZWQ7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIFZlbG9jaXR5IGFsc28gZXh0cmFjdGVkIHRoaXMgdmFsdWUsIHNraXAgZXh0cmFjdGlvbi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDU1MuUmVnRXgud3JhcHBlZFZhbHVlQWxyZWFkeUV4dHJhY3RlZC50ZXN0KHByb3BlcnR5VmFsdWUpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFjdGVkID0gcHJvcGVydHlWYWx1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogUmVtb3ZlIHRoZSBcInJlY3QoKVwiIHdyYXBwZXIuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFjdGVkID0gcHJvcGVydHlWYWx1ZS50b1N0cmluZygpLm1hdGNoKENTUy5SZWdFeC52YWx1ZVVud3JhcCk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTdHJpcCBvZmYgY29tbWFzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhY3RlZCA9IGV4dHJhY3RlZCA/IGV4dHJhY3RlZFsxXS5yZXBsYWNlKC8sKFxccyspPy9nLCBcIiBcIikgOiBwcm9wZXJ0eVZhbHVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXh0cmFjdGVkO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBDbGlwIG5lZWRzIHRvIGJlIHJlLXdyYXBwZWQgZHVyaW5nIGluamVjdGlvbi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImluamVjdFwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwicmVjdChcIiArIHByb3BlcnR5VmFsdWUgKyBcIilcIjtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9LFxuXG5cdCAgICAgICAgICAgICAgICBibHVyOiBmdW5jdGlvbih0eXBlLCBlbGVtZW50LCBwcm9wZXJ0eVZhbHVlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJuYW1lXCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gVmVsb2NpdHkuU3RhdGUuaXNGaXJlZm94ID8gXCJmaWx0ZXJcIiA6IFwiLXdlYmtpdC1maWx0ZXJcIjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImV4dHJhY3RcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBleHRyYWN0ZWQgPSBwYXJzZUZsb2F0KHByb3BlcnR5VmFsdWUpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiBleHRyYWN0ZWQgaXMgTmFOLCBtZWFuaW5nIHRoZSB2YWx1ZSBpc24ndCBhbHJlYWR5IGV4dHJhY3RlZC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKGV4dHJhY3RlZCB8fCBleHRyYWN0ZWQgPT09IDApKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGJsdXJDb21wb25lbnQgPSBwcm9wZXJ0eVZhbHVlLnRvU3RyaW5nKCkubWF0Y2goL2JsdXJcXCgoWzAtOV0rW0Etel0rKVxcKS9pKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBmaWx0ZXIgc3RyaW5nIGhhZCBhIGJsdXIgY29tcG9uZW50LCByZXR1cm4ganVzdCB0aGUgYmx1ciB2YWx1ZSBhbmQgdW5pdCB0eXBlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChibHVyQ29tcG9uZW50KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhY3RlZCA9IGJsdXJDb21wb25lbnRbMV07XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGNvbXBvbmVudCBkb2Vzbid0IGV4aXN0LCBkZWZhdWx0IGJsdXIgdG8gMC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYWN0ZWQgPSAwO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGV4dHJhY3RlZDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogQmx1ciBuZWVkcyB0byBiZSByZS13cmFwcGVkIGR1cmluZyBpbmplY3Rpb24uICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJpbmplY3RcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEZvciB0aGUgYmx1ciBlZmZlY3QgdG8gYmUgZnVsbHkgZGUtYXBwbGllZCwgaXQgbmVlZHMgdG8gYmUgc2V0IHRvIFwibm9uZVwiIGluc3RlYWQgb2YgMC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcGFyc2VGbG9hdChwcm9wZXJ0eVZhbHVlKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcIm5vbmVcIjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiYmx1cihcIiArIHByb3BlcnR5VmFsdWUgKyBcIilcIjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9LFxuXG5cdCAgICAgICAgICAgICAgICAvKiA8PUlFOCBkbyBub3Qgc3VwcG9ydCB0aGUgc3RhbmRhcmQgb3BhY2l0eSBwcm9wZXJ0eS4gVGhleSB1c2UgZmlsdGVyOmFscGhhKG9wYWNpdHk9SU5UKSBpbnN0ZWFkLiAqL1xuXHQgICAgICAgICAgICAgICAgb3BhY2l0eTogZnVuY3Rpb24gKHR5cGUsIGVsZW1lbnQsIHByb3BlcnR5VmFsdWUpIHtcblx0ICAgICAgICAgICAgICAgICAgICBpZiAoSUUgPD0gOCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJuYW1lXCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiZmlsdGVyXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZXh0cmFjdFwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIDw9SUU4IHJldHVybiBhIFwiZmlsdGVyXCIgdmFsdWUgb2YgXCJhbHBoYShvcGFjaXR5PVxcZHsxLDN9KVwiLlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEV4dHJhY3QgdGhlIHZhbHVlIGFuZCBjb252ZXJ0IGl0IHRvIGEgZGVjaW1hbCB2YWx1ZSB0byBtYXRjaCB0aGUgc3RhbmRhcmQgQ1NTIG9wYWNpdHkgcHJvcGVydHkncyBmb3JtYXR0aW5nLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBleHRyYWN0ZWQgPSBwcm9wZXJ0eVZhbHVlLnRvU3RyaW5nKCkubWF0Y2goL2FscGhhXFwob3BhY2l0eT0oLiopXFwpL2kpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV4dHJhY3RlZCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDb252ZXJ0IHRvIGRlY2ltYWwgdmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSBleHRyYWN0ZWRbMV0gLyAxMDA7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogV2hlbiBleHRyYWN0aW5nIG9wYWNpdHksIGRlZmF1bHQgdG8gMSBzaW5jZSBhIG51bGwgdmFsdWUgbWVhbnMgb3BhY2l0eSBoYXNuJ3QgYmVlbiBzZXQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSAxO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0eVZhbHVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImluamVjdFwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE9wYWNpZmllZCBlbGVtZW50cyBhcmUgcmVxdWlyZWQgdG8gaGF2ZSB0aGVpciB6b29tIHByb3BlcnR5IHNldCB0byBhIG5vbi16ZXJvIHZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuem9vbSA9IDE7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTZXR0aW5nIHRoZSBmaWx0ZXIgcHJvcGVydHkgb24gZWxlbWVudHMgd2l0aCBjZXJ0YWluIGZvbnQgcHJvcGVydHkgY29tYmluYXRpb25zIGNhbiByZXN1bHQgaW4gYVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhpZ2hseSB1bmFwcGVhbGluZyB1bHRyYS1ib2xkaW5nIGVmZmVjdC4gVGhlcmUncyBubyB3YXkgdG8gcmVtZWR5IHRoaXMgdGhyb3VnaG91dCBhIHR3ZWVuLCBidXQgZHJvcHBpbmcgdGhlXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgYWx0b2dldGhlciAod2hlbiBvcGFjaXR5IGhpdHMgMSkgYXQgbGVhc3RzIGVuc3VyZXMgdGhhdCB0aGUgZ2xpdGNoIGlzIGdvbmUgcG9zdC10d2VlbmluZy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGFyc2VGbG9hdChwcm9wZXJ0eVZhbHVlKSA+PSAxKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcIlwiO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBBcyBwZXIgdGhlIGZpbHRlciBwcm9wZXJ0eSdzIHNwZWMsIGNvbnZlcnQgdGhlIGRlY2ltYWwgdmFsdWUgdG8gYSB3aG9sZSBudW1iZXIgYW5kIHdyYXAgdGhlIHZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiYWxwaGEob3BhY2l0eT1cIiArIHBhcnNlSW50KHBhcnNlRmxvYXQocHJvcGVydHlWYWx1ZSkgKiAxMDAsIDEwKSArIFwiKVwiO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIC8qIFdpdGggYWxsIG90aGVyIGJyb3dzZXJzLCBub3JtYWxpemF0aW9uIGlzIG5vdCByZXF1aXJlZDsgcmV0dXJuIHRoZSBzYW1lIHZhbHVlcyB0aGF0IHdlcmUgcGFzc2VkIGluLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm5hbWVcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJvcGFjaXR5XCI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZXh0cmFjdFwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0eVZhbHVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImluamVjdFwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0eVZhbHVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9LFxuXG5cdCAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgQmF0Y2hlZCBSZWdpc3RyYXRpb25zXG5cdCAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgIC8qIE5vdGU6IEJhdGNoZWQgbm9ybWFsaXphdGlvbnMgZXh0ZW5kIHRoZSBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZCBvYmplY3QuICovXG5cdCAgICAgICAgICAgIHJlZ2lzdGVyOiBmdW5jdGlvbiAoKSB7XG5cblx0ICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgIFRyYW5zZm9ybXNcblx0ICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAvKiBUcmFuc2Zvcm1zIGFyZSB0aGUgc3VicHJvcGVydGllcyBjb250YWluZWQgYnkgdGhlIENTUyBcInRyYW5zZm9ybVwiIHByb3BlcnR5LiBUcmFuc2Zvcm1zIG11c3QgdW5kZXJnbyBub3JtYWxpemF0aW9uXG5cdCAgICAgICAgICAgICAgICAgICBzbyB0aGF0IHRoZXkgY2FuIGJlIHJlZmVyZW5jZWQgaW4gYSBwcm9wZXJ0aWVzIG1hcCBieSB0aGVpciBpbmRpdmlkdWFsIG5hbWVzLiAqL1xuXHQgICAgICAgICAgICAgICAgLyogTm90ZTogV2hlbiB0cmFuc2Zvcm1zIGFyZSBcInNldFwiLCB0aGV5IGFyZSBhY3R1YWxseSBhc3NpZ25lZCB0byBhIHBlci1lbGVtZW50IHRyYW5zZm9ybUNhY2hlLiBXaGVuIGFsbCB0cmFuc2Zvcm1cblx0ICAgICAgICAgICAgICAgICAgIHNldHRpbmcgaXMgY29tcGxldGUgY29tcGxldGUsIENTUy5mbHVzaFRyYW5zZm9ybUNhY2hlKCkgbXVzdCBiZSBtYW51YWxseSBjYWxsZWQgdG8gZmx1c2ggdGhlIHZhbHVlcyB0byB0aGUgRE9NLlxuXHQgICAgICAgICAgICAgICAgICAgVHJhbnNmb3JtIHNldHRpbmcgaXMgYmF0Y2hlZCBpbiB0aGlzIHdheSB0byBpbXByb3ZlIHBlcmZvcm1hbmNlOiB0aGUgdHJhbnNmb3JtIHN0eWxlIG9ubHkgbmVlZHMgdG8gYmUgdXBkYXRlZFxuXHQgICAgICAgICAgICAgICAgICAgb25jZSB3aGVuIG11bHRpcGxlIHRyYW5zZm9ybSBzdWJwcm9wZXJ0aWVzIGFyZSBiZWluZyBhbmltYXRlZCBzaW11bHRhbmVvdXNseS4gKi9cblx0ICAgICAgICAgICAgICAgIC8qIE5vdGU6IElFOSBhbmQgQW5kcm9pZCBHaW5nZXJicmVhZCBoYXZlIHN1cHBvcnQgZm9yIDJEIC0tIGJ1dCBub3QgM0QgLS0gdHJhbnNmb3Jtcy4gU2luY2UgYW5pbWF0aW5nIHVuc3VwcG9ydGVkXG5cdCAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm0gcHJvcGVydGllcyByZXN1bHRzIGluIHRoZSBicm93c2VyIGlnbm9yaW5nIHRoZSAqZW50aXJlKiB0cmFuc2Zvcm0gc3RyaW5nLCB3ZSBwcmV2ZW50IHRoZXNlIDNEIHZhbHVlc1xuXHQgICAgICAgICAgICAgICAgICAgZnJvbSBiZWluZyBub3JtYWxpemVkIGZvciB0aGVzZSBicm93c2VycyBzbyB0aGF0IHR3ZWVuaW5nIHNraXBzIHRoZXNlIHByb3BlcnRpZXMgYWx0b2dldGhlclxuXHQgICAgICAgICAgICAgICAgICAgKHNpbmNlIGl0IHdpbGwgaWdub3JlIHRoZW0gYXMgYmVpbmcgdW5zdXBwb3J0ZWQgYnkgdGhlIGJyb3dzZXIuKSAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKCEoSUUgPD0gOSkgJiYgIVZlbG9jaXR5LlN0YXRlLmlzR2luZ2VyYnJlYWQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBTaW5jZSB0aGUgc3RhbmRhbG9uZSBDU1MgXCJwZXJzcGVjdGl2ZVwiIHByb3BlcnR5IGFuZCB0aGUgQ1NTIHRyYW5zZm9ybSBcInBlcnNwZWN0aXZlXCIgc3VicHJvcGVydHlcblx0ICAgICAgICAgICAgICAgICAgICBzaGFyZSB0aGUgc2FtZSBuYW1lLCB0aGUgbGF0dGVyIGlzIGdpdmVuIGEgdW5pcXVlIHRva2VuIHdpdGhpbiBWZWxvY2l0eTogXCJ0cmFuc2Zvcm1QZXJzcGVjdGl2ZVwiLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIENTUy5MaXN0cy50cmFuc2Zvcm1zQmFzZSA9IENTUy5MaXN0cy50cmFuc2Zvcm1zQmFzZS5jb25jYXQoQ1NTLkxpc3RzLnRyYW5zZm9ybXMzRCk7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgQ1NTLkxpc3RzLnRyYW5zZm9ybXNCYXNlLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogV3JhcCB0aGUgZHluYW1pY2FsbHkgZ2VuZXJhdGVkIG5vcm1hbGl6YXRpb24gZnVuY3Rpb24gaW4gYSBuZXcgc2NvcGUgc28gdGhhdCB0cmFuc2Zvcm1OYW1lJ3MgdmFsdWUgaXNcblx0ICAgICAgICAgICAgICAgICAgICBwYWlyZWQgd2l0aCBpdHMgcmVzcGVjdGl2ZSBmdW5jdGlvbi4gKE90aGVyd2lzZSwgYWxsIGZ1bmN0aW9ucyB3b3VsZCB0YWtlIHRoZSBmaW5hbCBmb3IgbG9vcCdzIHRyYW5zZm9ybU5hbWUuKSAqL1xuXHQgICAgICAgICAgICAgICAgICAgIChmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRyYW5zZm9ybU5hbWUgPSBDU1MuTGlzdHMudHJhbnNmb3Jtc0Jhc2VbaV07XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbdHJhbnNmb3JtTmFtZV0gPSBmdW5jdGlvbiAodHlwZSwgZWxlbWVudCwgcHJvcGVydHlWYWx1ZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVGhlIG5vcm1hbGl6ZWQgcHJvcGVydHkgbmFtZSBpcyB0aGUgcGFyZW50IFwidHJhbnNmb3JtXCIgcHJvcGVydHkgLS0gdGhlIHByb3BlcnR5IHRoYXQgaXMgYWN0dWFsbHkgc2V0IGluIENTUy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwibmFtZVwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJ0cmFuc2Zvcm1cIjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBUcmFuc2Zvcm0gdmFsdWVzIGFyZSBjYWNoZWQgb250byBhIHBlci1lbGVtZW50IHRyYW5zZm9ybUNhY2hlIG9iamVjdC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZXh0cmFjdFwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGlzIHRyYW5zZm9ybSBoYXMgeWV0IHRvIGJlIGFzc2lnbmVkIGEgdmFsdWUsIHJldHVybiBpdHMgbnVsbCB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkgPT09IHVuZGVmaW5lZCB8fCBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlW3RyYW5zZm9ybU5hbWVdID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFNjYWxlIENTUy5MaXN0cy50cmFuc2Zvcm1zQmFzZSBkZWZhdWx0IHRvIDEgd2hlcmVhcyBhbGwgb3RoZXIgdHJhbnNmb3JtIHByb3BlcnRpZXMgZGVmYXVsdCB0byAwLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIC9ec2NhbGUvaS50ZXN0KHRyYW5zZm9ybU5hbWUpID8gMSA6IDA7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFdoZW4gdHJhbnNmb3JtIHZhbHVlcyBhcmUgc2V0LCB0aGV5IGFyZSB3cmFwcGVkIGluIHBhcmVudGhlc2VzIGFzIHBlciB0aGUgQ1NTIHNwZWMuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRodXMsIHdoZW4gZXh0cmFjdGluZyB0aGVpciB2YWx1ZXMgKGZvciB0d2VlbiBjYWxjdWxhdGlvbnMpLCB3ZSBzdHJpcCBvZmYgdGhlIHBhcmVudGhlc2VzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGVbdHJhbnNmb3JtTmFtZV0ucmVwbGFjZSgvWygpXS9nLCBcIlwiKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJpbmplY3RcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGludmFsaWQgPSBmYWxzZTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiBhbiBpbmRpdmlkdWFsIHRyYW5zZm9ybSBwcm9wZXJ0eSBjb250YWlucyBhbiB1bnN1cHBvcnRlZCB1bml0IHR5cGUsIHRoZSBicm93c2VyIGlnbm9yZXMgdGhlICplbnRpcmUqIHRyYW5zZm9ybSBwcm9wZXJ0eS5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVGh1cywgcHJvdGVjdCB1c2VycyBmcm9tIHRoZW1zZWx2ZXMgYnkgc2tpcHBpbmcgc2V0dGluZyBmb3IgdHJhbnNmb3JtIHZhbHVlcyBzdXBwbGllZCB3aXRoIGludmFsaWQgdW5pdCB0eXBlcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU3dpdGNoIG9uIHRoZSBiYXNlIHRyYW5zZm9ybSB0eXBlOyBpZ25vcmUgdGhlIGF4aXMgYnkgcmVtb3ZpbmcgdGhlIGxhc3QgbGV0dGVyIGZyb20gdGhlIHRyYW5zZm9ybSdzIG5hbWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodHJhbnNmb3JtTmFtZS5zdWJzdHIoMCwgdHJhbnNmb3JtTmFtZS5sZW5ndGggLSAxKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogV2hpdGVsaXN0IHVuaXQgdHlwZXMgZm9yIGVhY2ggdHJhbnNmb3JtLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcInRyYW5zbGF0ZVwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludmFsaWQgPSAhLyglfHB4fGVtfHJlbXx2d3x2aHxcXGQpJC9pLnRlc3QocHJvcGVydHlWYWx1ZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTaW5jZSBhbiBheGlzLWZyZWUgXCJzY2FsZVwiIHByb3BlcnR5IGlzIHN1cHBvcnRlZCBhcyB3ZWxsLCBhIGxpdHRsZSBoYWNrIGlzIHVzZWQgaGVyZSB0byBkZXRlY3QgaXQgYnkgY2hvcHBpbmcgb2ZmIGl0cyBsYXN0IGxldHRlci4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJzY2FsXCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwic2NhbGVcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDaHJvbWUgb24gQW5kcm9pZCBoYXMgYSBidWcgaW4gd2hpY2ggc2NhbGVkIGVsZW1lbnRzIGJsdXIgaWYgdGhlaXIgaW5pdGlhbCBzY2FsZVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlIGlzIGJlbG93IDEgKHdoaWNoIGNhbiBoYXBwZW4gd2l0aCBmb3JjZWZlZWRpbmcpLiBUaHVzLCB3ZSBkZXRlY3QgYSB5ZXQtdW5zZXQgc2NhbGUgcHJvcGVydHlcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmQgZW5zdXJlIHRoYXQgaXRzIGZpcnN0IHZhbHVlIGlzIGFsd2F5cyAxLiBNb3JlIGluZm86IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTA0MTc4OTAvY3NzMy1hbmltYXRpb25zLXdpdGgtdHJhbnNmb3JtLWNhdXNlcy1ibHVycmVkLWVsZW1lbnRzLW9uLXdlYmtpdC8xMDQxNzk2MiMxMDQxNzk2MiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChWZWxvY2l0eS5TdGF0ZS5pc0FuZHJvaWQgJiYgRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZVt0cmFuc2Zvcm1OYW1lXSA9PT0gdW5kZWZpbmVkICYmIHByb3BlcnR5VmFsdWUgPCAxKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSAxO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludmFsaWQgPSAhLyhcXGQpJC9pLnRlc3QocHJvcGVydHlWYWx1ZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwic2tld1wiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludmFsaWQgPSAhLyhkZWd8XFxkKSQvaS50ZXN0KHByb3BlcnR5VmFsdWUpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcInJvdGF0ZVwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludmFsaWQgPSAhLyhkZWd8XFxkKSQvaS50ZXN0KHByb3BlcnR5VmFsdWUpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpbnZhbGlkKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBBcyBwZXIgdGhlIENTUyBzcGVjLCB3cmFwIHRoZSB2YWx1ZSBpbiBwYXJlbnRoZXNlcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGVbdHJhbnNmb3JtTmFtZV0gPSBcIihcIiArIHByb3BlcnR5VmFsdWUgKyBcIilcIjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEFsdGhvdWdoIHRoZSB2YWx1ZSBpcyBzZXQgb24gdGhlIHRyYW5zZm9ybUNhY2hlIG9iamVjdCwgcmV0dXJuIHRoZSBuZXdseS11cGRhdGVkIHZhbHVlIGZvciB0aGUgY2FsbGluZyBjb2RlIHRvIHByb2Nlc3MgYXMgbm9ybWFsLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZVt0cmFuc2Zvcm1OYW1lXTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgfTtcblx0ICAgICAgICAgICAgICAgICAgICB9KSgpO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgIENvbG9yc1xuXHQgICAgICAgICAgICAgICAgKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgLyogU2luY2UgVmVsb2NpdHkgb25seSBhbmltYXRlcyBhIHNpbmdsZSBudW1lcmljIHZhbHVlIHBlciBwcm9wZXJ0eSwgY29sb3IgYW5pbWF0aW9uIGlzIGFjaGlldmVkIGJ5IGhvb2tpbmcgdGhlIGluZGl2aWR1YWwgUkdCQSBjb21wb25lbnRzIG9mIENTUyBjb2xvciBwcm9wZXJ0aWVzLlxuXHQgICAgICAgICAgICAgICAgICAgQWNjb3JkaW5nbHksIGNvbG9yIHZhbHVlcyBtdXN0IGJlIG5vcm1hbGl6ZWQgKGUuZy4gXCIjZmYwMDAwXCIsIFwicmVkXCIsIGFuZCBcInJnYigyNTUsIDAsIDApXCIgPT0+IFwiMjU1IDAgMCAxXCIpIHNvIHRoYXQgdGhlaXIgY29tcG9uZW50cyBjYW4gYmUgaW5qZWN0ZWQvZXh0cmFjdGVkIGJ5IENTUy5Ib29rcyBsb2dpYy4gKi9cblx0ICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgQ1NTLkxpc3RzLmNvbG9ycy5sZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIFdyYXAgdGhlIGR5bmFtaWNhbGx5IGdlbmVyYXRlZCBub3JtYWxpemF0aW9uIGZ1bmN0aW9uIGluIGEgbmV3IHNjb3BlIHNvIHRoYXQgY29sb3JOYW1lJ3MgdmFsdWUgaXMgcGFpcmVkIHdpdGggaXRzIHJlc3BlY3RpdmUgZnVuY3Rpb24uXG5cdCAgICAgICAgICAgICAgICAgICAgICAgKE90aGVyd2lzZSwgYWxsIGZ1bmN0aW9ucyB3b3VsZCB0YWtlIHRoZSBmaW5hbCBmb3IgbG9vcCdzIGNvbG9yTmFtZS4pICovXG5cdCAgICAgICAgICAgICAgICAgICAgKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbG9yTmFtZSA9IENTUy5MaXN0cy5jb2xvcnNbaV07XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogSW4gSUU8PTgsIHdoaWNoIHN1cHBvcnQgcmdiIGJ1dCBub3QgcmdiYSwgY29sb3IgcHJvcGVydGllcyBhcmUgcmV2ZXJ0ZWQgdG8gcmdiIGJ5IHN0cmlwcGluZyBvZmYgdGhlIGFscGhhIGNvbXBvbmVudC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbY29sb3JOYW1lXSA9IGZ1bmN0aW9uKHR5cGUsIGVsZW1lbnQsIHByb3BlcnR5VmFsdWUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJuYW1lXCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2xvck5hbWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQ29udmVydCBhbGwgY29sb3IgdmFsdWVzIGludG8gdGhlIHJnYiBmb3JtYXQuIChPbGQgSUUgY2FuIHJldHVybiBoZXggdmFsdWVzIGFuZCBjb2xvciBuYW1lcyBpbnN0ZWFkIG9mIHJnYi9yZ2JhLikgKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZXh0cmFjdFwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXh0cmFjdGVkO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBjb2xvciBpcyBhbHJlYWR5IGluIGl0cyBob29rYWJsZSBmb3JtIChlLmcuIFwiMjU1IDI1NSAyNTUgMVwiKSBkdWUgdG8gaGF2aW5nIGJlZW4gcHJldmlvdXNseSBleHRyYWN0ZWQsIHNraXAgZXh0cmFjdGlvbi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENTUy5SZWdFeC53cmFwcGVkVmFsdWVBbHJlYWR5RXh0cmFjdGVkLnRlc3QocHJvcGVydHlWYWx1ZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhY3RlZCA9IHByb3BlcnR5VmFsdWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29udmVydGVkLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yTmFtZXMgPSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsYWNrOiBcInJnYigwLCAwLCAwKVwiLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBibHVlOiBcInJnYigwLCAwLCAyNTUpXCIsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyYXk6IFwicmdiKDEyOCwgMTI4LCAxMjgpXCIsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyZWVuOiBcInJnYigwLCAxMjgsIDApXCIsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZDogXCJyZ2IoMjU1LCAwLCAwKVwiLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGl0ZTogXCJyZ2IoMjU1LCAyNTUsIDI1NSlcIlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENvbnZlcnQgY29sb3IgbmFtZXMgdG8gcmdiLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC9eW0Etel0rJC9pLnRlc3QocHJvcGVydHlWYWx1ZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29sb3JOYW1lc1twcm9wZXJ0eVZhbHVlXSAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnZlcnRlZCA9IGNvbG9yTmFtZXNbcHJvcGVydHlWYWx1ZV1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiBhbiB1bm1hdGNoZWQgY29sb3IgbmFtZSBpcyBwcm92aWRlZCwgZGVmYXVsdCB0byBibGFjay4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udmVydGVkID0gY29sb3JOYW1lcy5ibGFjaztcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDb252ZXJ0IGhleCB2YWx1ZXMgdG8gcmdiLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChDU1MuUmVnRXguaXNIZXgudGVzdChwcm9wZXJ0eVZhbHVlKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnZlcnRlZCA9IFwicmdiKFwiICsgQ1NTLlZhbHVlcy5oZXhUb1JnYihwcm9wZXJ0eVZhbHVlKS5qb2luKFwiIFwiKSArIFwiKVwiO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIHByb3ZpZGVkIGNvbG9yIGRvZXNuJ3QgbWF0Y2ggYW55IG9mIHRoZSBhY2NlcHRlZCBjb2xvciBmb3JtYXRzLCBkZWZhdWx0IHRvIGJsYWNrLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICghKC9ecmdiYT9cXCgvaS50ZXN0KHByb3BlcnR5VmFsdWUpKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnZlcnRlZCA9IGNvbG9yTmFtZXMuYmxhY2s7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFJlbW92ZSB0aGUgc3Vycm91bmRpbmcgXCJyZ2IvcmdiYSgpXCIgc3RyaW5nIHRoZW4gcmVwbGFjZSBjb21tYXMgd2l0aCBzcGFjZXMgYW5kIHN0cmlwXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXBlYXRlZCBzcGFjZXMgKGluIGNhc2UgdGhlIHZhbHVlIGluY2x1ZGVkIHNwYWNlcyB0byBiZWdpbiB3aXRoKS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhY3RlZCA9IChjb252ZXJ0ZWQgfHwgcHJvcGVydHlWYWx1ZSkudG9TdHJpbmcoKS5tYXRjaChDU1MuUmVnRXgudmFsdWVVbndyYXApWzFdLnJlcGxhY2UoLywoXFxzKyk/L2csIFwiIFwiKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFNvIGxvbmcgYXMgdGhpcyBpc24ndCA8PUlFOCwgYWRkIGEgZm91cnRoIChhbHBoYSkgY29tcG9uZW50IGlmIGl0J3MgbWlzc2luZyBhbmQgZGVmYXVsdCBpdCB0byAxICh2aXNpYmxlKS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEoSUUgPD0gOCkgJiYgZXh0cmFjdGVkLnNwbGl0KFwiIFwiKS5sZW5ndGggPT09IDMpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhY3RlZCArPSBcIiAxXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXh0cmFjdGVkO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJpbmplY3RcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhpcyBpcyBJRTw9OCBhbmQgYW4gYWxwaGEgY29tcG9uZW50IGV4aXN0cywgc3RyaXAgaXQgb2ZmLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoSUUgPD0gOCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5VmFsdWUuc3BsaXQoXCIgXCIpLmxlbmd0aCA9PT0gNCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSBwcm9wZXJ0eVZhbHVlLnNwbGl0KC9cXHMrLykuc2xpY2UoMCwgMykuam9pbihcIiBcIik7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE90aGVyd2lzZSwgYWRkIGEgZm91cnRoIChhbHBoYSkgY29tcG9uZW50IGlmIGl0J3MgbWlzc2luZyBhbmQgZGVmYXVsdCBpdCB0byAxICh2aXNpYmxlKS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eVZhbHVlLnNwbGl0KFwiIFwiKS5sZW5ndGggPT09IDMpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgKz0gXCIgMVwiO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogUmUtaW5zZXJ0IHRoZSBicm93c2VyLWFwcHJvcHJpYXRlIHdyYXBwZXIoXCJyZ2IvcmdiYSgpXCIpLCBpbnNlcnQgY29tbWFzLCBhbmQgc3RyaXAgb2ZmIGRlY2ltYWwgdW5pdHNcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb24gYWxsIHZhbHVlcyBidXQgdGhlIGZvdXJ0aCAoUiwgRywgYW5kIEIgb25seSBhY2NlcHQgd2hvbGUgbnVtYmVycykuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoSUUgPD0gOCA/IFwicmdiXCIgOiBcInJnYmFcIikgKyBcIihcIiArIHByb3BlcnR5VmFsdWUucmVwbGFjZSgvXFxzKy9nLCBcIixcIikucmVwbGFjZSgvXFwuKFxcZCkrKD89LCkvZywgXCJcIikgKyBcIilcIjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgfTtcblx0ICAgICAgICAgICAgICAgICAgICB9KSgpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICBDU1MgUHJvcGVydHkgTmFtZXNcblx0ICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICBOYW1lczoge1xuXHQgICAgICAgICAgICAvKiBDYW1lbGNhc2UgYSBwcm9wZXJ0eSBuYW1lIGludG8gaXRzIEphdmFTY3JpcHQgbm90YXRpb24gKGUuZy4gXCJiYWNrZ3JvdW5kLWNvbG9yXCIgPT0+IFwiYmFja2dyb3VuZENvbG9yXCIpLlxuXHQgICAgICAgICAgICAgICBDYW1lbGNhc2luZyBpcyB1c2VkIHRvIG5vcm1hbGl6ZSBwcm9wZXJ0eSBuYW1lcyBiZXR3ZWVuIGFuZCBhY3Jvc3MgY2FsbHMuICovXG5cdCAgICAgICAgICAgIGNhbWVsQ2FzZTogZnVuY3Rpb24gKHByb3BlcnR5KSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gcHJvcGVydHkucmVwbGFjZSgvLShcXHcpL2csIGZ1bmN0aW9uIChtYXRjaCwgc3ViTWF0Y2gpIHtcblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3ViTWF0Y2gudG9VcHBlckNhc2UoKTtcblx0ICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICB9LFxuXG5cdCAgICAgICAgICAgIC8qIEZvciBTVkcgZWxlbWVudHMsIHNvbWUgcHJvcGVydGllcyAobmFtZWx5LCBkaW1lbnNpb25hbCBvbmVzKSBhcmUgR0VUL1NFVCB2aWEgdGhlIGVsZW1lbnQncyBIVE1MIGF0dHJpYnV0ZXMgKGluc3RlYWQgb2YgdmlhIENTUyBzdHlsZXMpLiAqL1xuXHQgICAgICAgICAgICBTVkdBdHRyaWJ1dGU6IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuXHQgICAgICAgICAgICAgICAgdmFyIFNWR0F0dHJpYnV0ZXMgPSBcIndpZHRofGhlaWdodHx4fHl8Y3h8Y3l8cnxyeHxyeXx4MXx4Mnx5MXx5MlwiO1xuXG5cdCAgICAgICAgICAgICAgICAvKiBDZXJ0YWluIGJyb3dzZXJzIHJlcXVpcmUgYW4gU1ZHIHRyYW5zZm9ybSB0byBiZSBhcHBsaWVkIGFzIGFuIGF0dHJpYnV0ZS4gKE90aGVyd2lzZSwgYXBwbGljYXRpb24gdmlhIENTUyBpcyBwcmVmZXJhYmxlIGR1ZSB0byAzRCBzdXBwb3J0LikgKi9cblx0ICAgICAgICAgICAgICAgIGlmIChJRSB8fCAoVmVsb2NpdHkuU3RhdGUuaXNBbmRyb2lkICYmICFWZWxvY2l0eS5TdGF0ZS5pc0Nocm9tZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICBTVkdBdHRyaWJ1dGVzICs9IFwifHRyYW5zZm9ybVwiO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFJlZ0V4cChcIl4oXCIgKyBTVkdBdHRyaWJ1dGVzICsgXCIpJFwiLCBcImlcIikudGVzdChwcm9wZXJ0eSk7XG5cdCAgICAgICAgICAgIH0sXG5cblx0ICAgICAgICAgICAgLyogRGV0ZXJtaW5lIHdoZXRoZXIgYSBwcm9wZXJ0eSBzaG91bGQgYmUgc2V0IHdpdGggYSB2ZW5kb3IgcHJlZml4LiAqL1xuXHQgICAgICAgICAgICAvKiBJZiBhIHByZWZpeGVkIHZlcnNpb24gb2YgdGhlIHByb3BlcnR5IGV4aXN0cywgcmV0dXJuIGl0LiBPdGhlcndpc2UsIHJldHVybiB0aGUgb3JpZ2luYWwgcHJvcGVydHkgbmFtZS5cblx0ICAgICAgICAgICAgICAgSWYgdGhlIHByb3BlcnR5IGlzIG5vdCBhdCBhbGwgc3VwcG9ydGVkIGJ5IHRoZSBicm93c2VyLCByZXR1cm4gYSBmYWxzZSBmbGFnLiAqL1xuXHQgICAgICAgICAgICBwcmVmaXhDaGVjazogZnVuY3Rpb24gKHByb3BlcnR5KSB7XG5cdCAgICAgICAgICAgICAgICAvKiBJZiB0aGlzIHByb3BlcnR5IGhhcyBhbHJlYWR5IGJlZW4gY2hlY2tlZCwgcmV0dXJuIHRoZSBjYWNoZWQgdmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICBpZiAoVmVsb2NpdHkuU3RhdGUucHJlZml4TWF0Y2hlc1twcm9wZXJ0eV0pIHtcblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gWyBWZWxvY2l0eS5TdGF0ZS5wcmVmaXhNYXRjaGVzW3Byb3BlcnR5XSwgdHJ1ZSBdO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgdmVuZG9ycyA9IFsgXCJcIiwgXCJXZWJraXRcIiwgXCJNb3pcIiwgXCJtc1wiLCBcIk9cIiBdO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIHZlbmRvcnNMZW5ndGggPSB2ZW5kb3JzLmxlbmd0aDsgaSA8IHZlbmRvcnNMZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcGVydHlQcmVmaXhlZDtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoaSA9PT0gMCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlQcmVmaXhlZCA9IHByb3BlcnR5O1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQ2FwaXRhbGl6ZSB0aGUgZmlyc3QgbGV0dGVyIG9mIHRoZSBwcm9wZXJ0eSB0byBjb25mb3JtIHRvIEphdmFTY3JpcHQgdmVuZG9yIHByZWZpeCBub3RhdGlvbiAoZS5nLiB3ZWJraXRGaWx0ZXIpLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlQcmVmaXhlZCA9IHZlbmRvcnNbaV0gKyBwcm9wZXJ0eS5yZXBsYWNlKC9eXFx3LywgZnVuY3Rpb24obWF0Y2gpIHsgcmV0dXJuIG1hdGNoLnRvVXBwZXJDYXNlKCk7IH0pO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogQ2hlY2sgaWYgdGhlIGJyb3dzZXIgc3VwcG9ydHMgdGhpcyBwcm9wZXJ0eSBhcyBwcmVmaXhlZC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFR5cGUuaXNTdHJpbmcoVmVsb2NpdHkuU3RhdGUucHJlZml4RWxlbWVudC5zdHlsZVtwcm9wZXJ0eVByZWZpeGVkXSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENhY2hlIHRoZSBtYXRjaC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LlN0YXRlLnByZWZpeE1hdGNoZXNbcHJvcGVydHldID0gcHJvcGVydHlQcmVmaXhlZDtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsgcHJvcGVydHlQcmVmaXhlZCwgdHJ1ZSBdO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGJyb3dzZXIgZG9lc24ndCBzdXBwb3J0IHRoaXMgcHJvcGVydHkgaW4gYW55IGZvcm0sIGluY2x1ZGUgYSBmYWxzZSBmbGFnIHNvIHRoYXQgdGhlIGNhbGxlciBjYW4gZGVjaWRlIGhvdyB0byBwcm9jZWVkLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBbIHByb3BlcnR5LCBmYWxzZSBdO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICBDU1MgUHJvcGVydHkgVmFsdWVzXG5cdCAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgVmFsdWVzOiB7XG5cdCAgICAgICAgICAgIC8qIEhleCB0byBSR0IgY29udmVyc2lvbi4gQ29weXJpZ2h0IFRpbSBEb3duOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzU2MjM4MzgvcmdiLXRvLWhleC1hbmQtaGV4LXRvLXJnYiAqL1xuXHQgICAgICAgICAgICBoZXhUb1JnYjogZnVuY3Rpb24gKGhleCkge1xuXHQgICAgICAgICAgICAgICAgdmFyIHNob3J0Zm9ybVJlZ2V4ID0gL14jPyhbYS1mXFxkXSkoW2EtZlxcZF0pKFthLWZcXGRdKSQvaSxcblx0ICAgICAgICAgICAgICAgICAgICBsb25nZm9ybVJlZ2V4ID0gL14jPyhbYS1mXFxkXXsyfSkoW2EtZlxcZF17Mn0pKFthLWZcXGRdezJ9KSQvaSxcblx0ICAgICAgICAgICAgICAgICAgICByZ2JQYXJ0cztcblxuXHQgICAgICAgICAgICAgICAgaGV4ID0gaGV4LnJlcGxhY2Uoc2hvcnRmb3JtUmVnZXgsIGZ1bmN0aW9uIChtLCByLCBnLCBiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHIgKyByICsgZyArIGcgKyBiICsgYjtcblx0ICAgICAgICAgICAgICAgIH0pO1xuXG5cdCAgICAgICAgICAgICAgICByZ2JQYXJ0cyA9IGxvbmdmb3JtUmVnZXguZXhlYyhoZXgpO1xuXG5cdCAgICAgICAgICAgICAgICByZXR1cm4gcmdiUGFydHMgPyBbIHBhcnNlSW50KHJnYlBhcnRzWzFdLCAxNiksIHBhcnNlSW50KHJnYlBhcnRzWzJdLCAxNiksIHBhcnNlSW50KHJnYlBhcnRzWzNdLCAxNikgXSA6IFsgMCwgMCwgMCBdO1xuXHQgICAgICAgICAgICB9LFxuXG5cdCAgICAgICAgICAgIGlzQ1NTTnVsbFZhbHVlOiBmdW5jdGlvbiAodmFsdWUpIHtcblx0ICAgICAgICAgICAgICAgIC8qIFRoZSBicm93c2VyIGRlZmF1bHRzIENTUyB2YWx1ZXMgdGhhdCBoYXZlIG5vdCBiZWVuIHNldCB0byBlaXRoZXIgMCBvciBvbmUgb2Ygc2V2ZXJhbCBwb3NzaWJsZSBudWxsLXZhbHVlIHN0cmluZ3MuXG5cdCAgICAgICAgICAgICAgICAgICBUaHVzLCB3ZSBjaGVjayBmb3IgYm90aCBmYWxzaW5lc3MgYW5kIHRoZXNlIHNwZWNpYWwgc3RyaW5ncy4gKi9cblx0ICAgICAgICAgICAgICAgIC8qIE51bGwtdmFsdWUgY2hlY2tpbmcgaXMgcGVyZm9ybWVkIHRvIGRlZmF1bHQgdGhlIHNwZWNpYWwgc3RyaW5ncyB0byAwIChmb3IgdGhlIHNha2Ugb2YgdHdlZW5pbmcpIG9yIHRoZWlyIGhvb2tcblx0ICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlcyBhcyBkZWZpbmVkIGFzIENTUy5Ib29rcyAoZm9yIHRoZSBzYWtlIG9mIGhvb2sgaW5qZWN0aW9uL2V4dHJhY3Rpb24pLiAqL1xuXHQgICAgICAgICAgICAgICAgLyogTm90ZTogQ2hyb21lIHJldHVybnMgXCJyZ2JhKDAsIDAsIDAsIDApXCIgZm9yIGFuIHVuZGVmaW5lZCBjb2xvciB3aGVyZWFzIElFIHJldHVybnMgXCJ0cmFuc3BhcmVudFwiLiAqL1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuICh2YWx1ZSA9PSAwIHx8IC9eKG5vbmV8YXV0b3x0cmFuc3BhcmVudHwocmdiYVxcKDAsID8wLCA/MCwgPzBcXCkpKSQvaS50ZXN0KHZhbHVlKSk7XG5cdCAgICAgICAgICAgIH0sXG5cblx0ICAgICAgICAgICAgLyogUmV0cmlldmUgYSBwcm9wZXJ0eSdzIGRlZmF1bHQgdW5pdCB0eXBlLiBVc2VkIGZvciBhc3NpZ25pbmcgYSB1bml0IHR5cGUgd2hlbiBvbmUgaXMgbm90IHN1cHBsaWVkIGJ5IHRoZSB1c2VyLiAqL1xuXHQgICAgICAgICAgICBnZXRVbml0VHlwZTogZnVuY3Rpb24gKHByb3BlcnR5KSB7XG5cdCAgICAgICAgICAgICAgICBpZiAoL14ocm90YXRlfHNrZXcpL2kudGVzdChwcm9wZXJ0eSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJkZWdcIjtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoLyheKHNjYWxlfHNjYWxlWHxzY2FsZVl8c2NhbGVafGFscGhhfGZsZXhHcm93fGZsZXhIZWlnaHR8ekluZGV4fGZvbnRXZWlnaHQpJCl8KChvcGFjaXR5fHJlZHxncmVlbnxibHVlfGFscGhhKSQpL2kudGVzdChwcm9wZXJ0eSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAvKiBUaGUgYWJvdmUgcHJvcGVydGllcyBhcmUgdW5pdGxlc3MuICovXG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG5cdCAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIERlZmF1bHQgdG8gcHggZm9yIGFsbCBvdGhlciBwcm9wZXJ0aWVzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBcInB4XCI7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH0sXG5cblx0ICAgICAgICAgICAgLyogSFRNTCBlbGVtZW50cyBkZWZhdWx0IHRvIGFuIGFzc29jaWF0ZWQgZGlzcGxheSB0eXBlIHdoZW4gdGhleSdyZSBub3Qgc2V0IHRvIGRpc3BsYXk6bm9uZS4gKi9cblx0ICAgICAgICAgICAgLyogTm90ZTogVGhpcyBmdW5jdGlvbiBpcyB1c2VkIGZvciBjb3JyZWN0bHkgc2V0dGluZyB0aGUgbm9uLVwibm9uZVwiIGRpc3BsYXkgdmFsdWUgaW4gY2VydGFpbiBWZWxvY2l0eSByZWRpcmVjdHMsIHN1Y2ggYXMgZmFkZUluL091dC4gKi9cblx0ICAgICAgICAgICAgZ2V0RGlzcGxheVR5cGU6IGZ1bmN0aW9uIChlbGVtZW50KSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgdGFnTmFtZSA9IGVsZW1lbnQgJiYgZWxlbWVudC50YWdOYW1lLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKTtcblxuXHQgICAgICAgICAgICAgICAgaWYgKC9eKGJ8YmlnfGl8c21hbGx8dHR8YWJicnxhY3JvbnltfGNpdGV8Y29kZXxkZm58ZW18a2JkfHN0cm9uZ3xzYW1wfHZhcnxhfGJkb3xicnxpbWd8bWFwfG9iamVjdHxxfHNjcmlwdHxzcGFufHN1YnxzdXB8YnV0dG9ufGlucHV0fGxhYmVsfHNlbGVjdHx0ZXh0YXJlYSkkL2kudGVzdCh0YWdOYW1lKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBcImlubGluZVwiO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvXihsaSkkL2kudGVzdCh0YWdOYW1lKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBcImxpc3QtaXRlbVwiO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvXih0cikkL2kudGVzdCh0YWdOYW1lKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBcInRhYmxlLXJvd1wiO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvXih0YWJsZSkkL2kudGVzdCh0YWdOYW1lKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBcInRhYmxlXCI7XG5cdCAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC9eKHRib2R5KSQvaS50ZXN0KHRhZ05hbWUpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwidGFibGUtcm93LWdyb3VwXCI7XG5cdCAgICAgICAgICAgICAgICAvKiBEZWZhdWx0IHRvIFwiYmxvY2tcIiB3aGVuIG5vIG1hdGNoIGlzIGZvdW5kLiAqL1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJibG9ja1wiO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9LFxuXG5cdCAgICAgICAgICAgIC8qIFRoZSBjbGFzcyBhZGQvcmVtb3ZlIGZ1bmN0aW9ucyBhcmUgdXNlZCB0byB0ZW1wb3JhcmlseSBhcHBseSBhIFwidmVsb2NpdHktYW5pbWF0aW5nXCIgY2xhc3MgdG8gZWxlbWVudHMgd2hpbGUgdGhleSdyZSBhbmltYXRpbmcuICovXG5cdCAgICAgICAgICAgIGFkZENsYXNzOiBmdW5jdGlvbiAoZWxlbWVudCwgY2xhc3NOYW1lKSB7XG5cdCAgICAgICAgICAgICAgICBpZiAoZWxlbWVudC5jbGFzc0xpc3QpIHtcblx0ICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jbGFzc05hbWUgKz0gKGVsZW1lbnQuY2xhc3NOYW1lLmxlbmd0aCA/IFwiIFwiIDogXCJcIikgKyBjbGFzc05hbWU7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH0sXG5cblx0ICAgICAgICAgICAgcmVtb3ZlQ2xhc3M6IGZ1bmN0aW9uIChlbGVtZW50LCBjbGFzc05hbWUpIHtcblx0ICAgICAgICAgICAgICAgIGlmIChlbGVtZW50LmNsYXNzTGlzdCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmNsYXNzTmFtZSA9IGVsZW1lbnQuY2xhc3NOYW1lLnRvU3RyaW5nKCkucmVwbGFjZShuZXcgUmVnRXhwKFwiKF58XFxcXHMpXCIgKyBjbGFzc05hbWUuc3BsaXQoXCIgXCIpLmpvaW4oXCJ8XCIpICsgXCIoXFxcXHN8JClcIiwgXCJnaVwiKSwgXCIgXCIpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgU3R5bGUgR2V0dGluZyAmIFNldHRpbmdcblx0ICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgLyogVGhlIHNpbmd1bGFyIGdldFByb3BlcnR5VmFsdWUsIHdoaWNoIHJvdXRlcyB0aGUgbG9naWMgZm9yIGFsbCBub3JtYWxpemF0aW9ucywgaG9va3MsIGFuZCBzdGFuZGFyZCBDU1MgcHJvcGVydGllcy4gKi9cblx0ICAgICAgICBnZXRQcm9wZXJ0eVZhbHVlOiBmdW5jdGlvbiAoZWxlbWVudCwgcHJvcGVydHksIHJvb3RQcm9wZXJ0eVZhbHVlLCBmb3JjZVN0eWxlTG9va3VwKSB7XG5cdCAgICAgICAgICAgIC8qIEdldCBhbiBlbGVtZW50J3MgY29tcHV0ZWQgcHJvcGVydHkgdmFsdWUuICovXG5cdCAgICAgICAgICAgIC8qIE5vdGU6IFJldHJpZXZpbmcgdGhlIHZhbHVlIG9mIGEgQ1NTIHByb3BlcnR5IGNhbm5vdCBzaW1wbHkgYmUgcGVyZm9ybWVkIGJ5IGNoZWNraW5nIGFuIGVsZW1lbnQnc1xuXHQgICAgICAgICAgICAgICBzdHlsZSBhdHRyaWJ1dGUgKHdoaWNoIG9ubHkgcmVmbGVjdHMgdXNlci1kZWZpbmVkIHZhbHVlcykuIEluc3RlYWQsIHRoZSBicm93c2VyIG11c3QgYmUgcXVlcmllZCBmb3IgYSBwcm9wZXJ0eSdzXG5cdCAgICAgICAgICAgICAgICpjb21wdXRlZCogdmFsdWUuIFlvdSBjYW4gcmVhZCBtb3JlIGFib3V0IGdldENvbXB1dGVkU3R5bGUgaGVyZTogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4vZG9jcy9XZWIvQVBJL3dpbmRvdy5nZXRDb21wdXRlZFN0eWxlICovXG5cdCAgICAgICAgICAgIGZ1bmN0aW9uIGNvbXB1dGVQcm9wZXJ0eVZhbHVlIChlbGVtZW50LCBwcm9wZXJ0eSkge1xuXHQgICAgICAgICAgICAgICAgLyogV2hlbiBib3gtc2l6aW5nIGlzbid0IHNldCB0byBib3JkZXItYm94LCBoZWlnaHQgYW5kIHdpZHRoIHN0eWxlIHZhbHVlcyBhcmUgaW5jb3JyZWN0bHkgY29tcHV0ZWQgd2hlbiBhblxuXHQgICAgICAgICAgICAgICAgICAgZWxlbWVudCdzIHNjcm9sbGJhcnMgYXJlIHZpc2libGUgKHdoaWNoIGV4cGFuZHMgdGhlIGVsZW1lbnQncyBkaW1lbnNpb25zKS4gVGh1cywgd2UgZGVmZXIgdG8gdGhlIG1vcmUgYWNjdXJhdGVcblx0ICAgICAgICAgICAgICAgICAgIG9mZnNldEhlaWdodC9XaWR0aCBwcm9wZXJ0eSwgd2hpY2ggaW5jbHVkZXMgdGhlIHRvdGFsIGRpbWVuc2lvbnMgZm9yIGludGVyaW9yLCBib3JkZXIsIHBhZGRpbmcsIGFuZCBzY3JvbGxiYXIuXG5cdCAgICAgICAgICAgICAgICAgICBXZSBzdWJ0cmFjdCBib3JkZXIgYW5kIHBhZGRpbmcgdG8gZ2V0IHRoZSBzdW0gb2YgaW50ZXJpb3IgKyBzY3JvbGxiYXIuICovXG5cdCAgICAgICAgICAgICAgICB2YXIgY29tcHV0ZWRWYWx1ZSA9IDA7XG5cblx0ICAgICAgICAgICAgICAgIC8qIElFPD04IGRvZXNuJ3Qgc3VwcG9ydCB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSwgdGh1cyB3ZSBkZWZlciB0byBqUXVlcnksIHdoaWNoIGhhcyBhbiBleHRlbnNpdmUgYXJyYXlcblx0ICAgICAgICAgICAgICAgICAgIG9mIGhhY2tzIHRvIGFjY3VyYXRlbHkgcmV0cmlldmUgSUU4IHByb3BlcnR5IHZhbHVlcy4gUmUtaW1wbGVtZW50aW5nIHRoYXQgbG9naWMgaGVyZSBpcyBub3Qgd29ydGggYmxvYXRpbmcgdGhlXG5cdCAgICAgICAgICAgICAgICAgICBjb2RlYmFzZSBmb3IgYSBkeWluZyBicm93c2VyLiBUaGUgcGVyZm9ybWFuY2UgcmVwZXJjdXNzaW9ucyBvZiB1c2luZyBqUXVlcnkgaGVyZSBhcmUgbWluaW1hbCBzaW5jZVxuXHQgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkgaXMgb3B0aW1pemVkIHRvIHJhcmVseSAoYW5kIHNvbWV0aW1lcyBuZXZlcikgcXVlcnkgdGhlIERPTS4gRnVydGhlciwgdGhlICQuY3NzKCkgY29kZXBhdGggaXNuJ3QgdGhhdCBzbG93LiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKElFIDw9IDgpIHtcblx0ICAgICAgICAgICAgICAgICAgICBjb21wdXRlZFZhbHVlID0gJC5jc3MoZWxlbWVudCwgcHJvcGVydHkpOyAvKiBHRVQgKi9cblx0ICAgICAgICAgICAgICAgIC8qIEFsbCBvdGhlciBicm93c2VycyBzdXBwb3J0IGdldENvbXB1dGVkU3R5bGUuIFRoZSByZXR1cm5lZCBsaXZlIG9iamVjdCByZWZlcmVuY2UgaXMgY2FjaGVkIG9udG8gaXRzXG5cdCAgICAgICAgICAgICAgICAgICBhc3NvY2lhdGVkIGVsZW1lbnQgc28gdGhhdCBpdCBkb2VzIG5vdCBuZWVkIHRvIGJlIHJlZmV0Y2hlZCB1cG9uIGV2ZXJ5IEdFVC4gKi9cblx0ICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogQnJvd3NlcnMgZG8gbm90IHJldHVybiBoZWlnaHQgYW5kIHdpZHRoIHZhbHVlcyBmb3IgZWxlbWVudHMgdGhhdCBhcmUgc2V0IHRvIGRpc3BsYXk6XCJub25lXCIuIFRodXMsIHdlIHRlbXBvcmFyaWx5XG5cdCAgICAgICAgICAgICAgICAgICAgICAgdG9nZ2xlIGRpc3BsYXkgdG8gdGhlIGVsZW1lbnQgdHlwZSdzIGRlZmF1bHQgdmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIHRvZ2dsZURpc3BsYXkgPSBmYWxzZTtcblxuXHQgICAgICAgICAgICAgICAgICAgIGlmICgvXih3aWR0aHxoZWlnaHQpJC8udGVzdChwcm9wZXJ0eSkgJiYgQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJkaXNwbGF5XCIpID09PSAwKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZURpc3BsYXkgPSB0cnVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBDU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImRpc3BsYXlcIiwgQ1NTLlZhbHVlcy5nZXREaXNwbGF5VHlwZShlbGVtZW50KSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gcmV2ZXJ0RGlzcGxheSAoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0b2dnbGVEaXNwbGF5KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBDU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKCFmb3JjZVN0eWxlTG9va3VwKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eSA9PT0gXCJoZWlnaHRcIiAmJiBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImJveFNpemluZ1wiKS50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgIT09IFwiYm9yZGVyLWJveFwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29udGVudEJveEhlaWdodCA9IGVsZW1lbnQub2Zmc2V0SGVpZ2h0IC0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJib3JkZXJUb3BXaWR0aFwiKSkgfHwgMCkgLSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImJvcmRlckJvdHRvbVdpZHRoXCIpKSB8fCAwKSAtIChwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwicGFkZGluZ1RvcFwiKSkgfHwgMCkgLSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcInBhZGRpbmdCb3R0b21cIikpIHx8IDApO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV2ZXJ0RGlzcGxheSgpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudEJveEhlaWdodDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0eSA9PT0gXCJ3aWR0aFwiICYmIENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiYm94U2l6aW5nXCIpLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSAhPT0gXCJib3JkZXItYm94XCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb250ZW50Qm94V2lkdGggPSBlbGVtZW50Lm9mZnNldFdpZHRoIC0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJib3JkZXJMZWZ0V2lkdGhcIikpIHx8IDApIC0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJib3JkZXJSaWdodFdpZHRoXCIpKSB8fCAwKSAtIChwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwicGFkZGluZ0xlZnRcIikpIHx8IDApIC0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJwYWRkaW5nUmlnaHRcIikpIHx8IDApO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV2ZXJ0RGlzcGxheSgpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29udGVudEJveFdpZHRoO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIGNvbXB1dGVkU3R5bGU7XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBGb3IgZWxlbWVudHMgdGhhdCBWZWxvY2l0eSBoYXNuJ3QgYmVlbiBjYWxsZWQgb24gZGlyZWN0bHkgKGUuZy4gd2hlbiBWZWxvY2l0eSBxdWVyaWVzIHRoZSBET00gb24gYmVoYWxmXG5cdCAgICAgICAgICAgICAgICAgICAgICAgb2YgYSBwYXJlbnQgb2YgYW4gZWxlbWVudCBpdHMgYW5pbWF0aW5nKSwgcGVyZm9ybSBhIGRpcmVjdCBnZXRDb21wdXRlZFN0eWxlIGxvb2t1cCBzaW5jZSB0aGUgb2JqZWN0IGlzbid0IGNhY2hlZC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoRGF0YShlbGVtZW50KSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50LCBudWxsKTsgLyogR0VUICovXG5cdCAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGNvbXB1dGVkU3R5bGUgb2JqZWN0IGhhcyB5ZXQgdG8gYmUgY2FjaGVkLCBkbyBzbyBub3cuICovXG5cdCAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICghRGF0YShlbGVtZW50KS5jb21wdXRlZFN0eWxlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkU3R5bGUgPSBEYXRhKGVsZW1lbnQpLmNvbXB1dGVkU3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50LCBudWxsKTsgLyogR0VUICovXG5cdCAgICAgICAgICAgICAgICAgICAgLyogSWYgY29tcHV0ZWRTdHlsZSBpcyBjYWNoZWQsIHVzZSBpdC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjb21wdXRlZFN0eWxlID0gRGF0YShlbGVtZW50KS5jb21wdXRlZFN0eWxlO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIElFIGFuZCBGaXJlZm94IGRvIG5vdCByZXR1cm4gYSB2YWx1ZSBmb3IgdGhlIGdlbmVyaWMgYm9yZGVyQ29sb3IgLS0gdGhleSBvbmx5IHJldHVybiBpbmRpdmlkdWFsIHZhbHVlcyBmb3IgZWFjaCBib3JkZXIgc2lkZSdzIGNvbG9yLlxuXHQgICAgICAgICAgICAgICAgICAgICAgIEFsc28sIGluIGFsbCBicm93c2Vycywgd2hlbiBib3JkZXIgY29sb3JzIGFyZW4ndCBhbGwgdGhlIHNhbWUsIGEgY29tcG91bmQgdmFsdWUgaXMgcmV0dXJuZWQgdGhhdCBWZWxvY2l0eSBpc24ndCBzZXR1cCB0byBwYXJzZS5cblx0ICAgICAgICAgICAgICAgICAgICAgICBTbywgYXMgYSBwb2x5ZmlsbCBmb3IgcXVlcnlpbmcgaW5kaXZpZHVhbCBib3JkZXIgc2lkZSBjb2xvcnMsIHdlIGp1c3QgcmV0dXJuIHRoZSB0b3AgYm9yZGVyJ3MgY29sb3IgYW5kIGFuaW1hdGUgYWxsIGJvcmRlcnMgZnJvbSB0aGF0IHZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eSA9PT0gXCJib3JkZXJDb2xvclwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5ID0gXCJib3JkZXJUb3BDb2xvclwiO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIElFOSBoYXMgYSBidWcgaW4gd2hpY2ggdGhlIFwiZmlsdGVyXCIgcHJvcGVydHkgbXVzdCBiZSBhY2Nlc3NlZCBmcm9tIGNvbXB1dGVkU3R5bGUgdXNpbmcgdGhlIGdldFByb3BlcnR5VmFsdWUgbWV0aG9kXG5cdCAgICAgICAgICAgICAgICAgICAgICAgaW5zdGVhZCBvZiBhIGRpcmVjdCBwcm9wZXJ0eSBsb29rdXAuIFRoZSBnZXRQcm9wZXJ0eVZhbHVlIG1ldGhvZCBpcyBzbG93ZXIgdGhhbiBhIGRpcmVjdCBsb29rdXAsIHdoaWNoIGlzIHdoeSB3ZSBhdm9pZCBpdCBieSBkZWZhdWx0LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChJRSA9PT0gOSAmJiBwcm9wZXJ0eSA9PT0gXCJmaWx0ZXJcIikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjb21wdXRlZFZhbHVlID0gY29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKHByb3BlcnR5KTsgLyogR0VUICovXG5cdCAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWRWYWx1ZSA9IGNvbXB1dGVkU3R5bGVbcHJvcGVydHldO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIEZhbGwgYmFjayB0byB0aGUgcHJvcGVydHkncyBzdHlsZSB2YWx1ZSAoaWYgZGVmaW5lZCkgd2hlbiBjb21wdXRlZFZhbHVlIHJldHVybnMgbm90aGluZyxcblx0ICAgICAgICAgICAgICAgICAgICAgICB3aGljaCBjYW4gaGFwcGVuIHdoZW4gdGhlIGVsZW1lbnQgaGFzbid0IGJlZW4gcGFpbnRlZC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoY29tcHV0ZWRWYWx1ZSA9PT0gXCJcIiB8fCBjb21wdXRlZFZhbHVlID09PSBudWxsKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkVmFsdWUgPSBlbGVtZW50LnN0eWxlW3Byb3BlcnR5XTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICByZXZlcnREaXNwbGF5KCk7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIC8qIEZvciB0b3AsIHJpZ2h0LCBib3R0b20sIGFuZCBsZWZ0IChUUkJMKSB2YWx1ZXMgdGhhdCBhcmUgc2V0IHRvIFwiYXV0b1wiIG9uIGVsZW1lbnRzIG9mIFwiZml4ZWRcIiBvciBcImFic29sdXRlXCIgcG9zaXRpb24sXG5cdCAgICAgICAgICAgICAgICAgICBkZWZlciB0byBqUXVlcnkgZm9yIGNvbnZlcnRpbmcgXCJhdXRvXCIgdG8gYSBudW1lcmljIHZhbHVlLiAoRm9yIGVsZW1lbnRzIHdpdGggYSBcInN0YXRpY1wiIG9yIFwicmVsYXRpdmVcIiBwb3NpdGlvbiwgXCJhdXRvXCIgaGFzIHRoZSBzYW1lXG5cdCAgICAgICAgICAgICAgICAgICBlZmZlY3QgYXMgYmVpbmcgc2V0IHRvIDAsIHNvIG5vIGNvbnZlcnNpb24gaXMgbmVjZXNzYXJ5LikgKi9cblx0ICAgICAgICAgICAgICAgIC8qIEFuIGV4YW1wbGUgb2Ygd2h5IG51bWVyaWMgY29udmVyc2lvbiBpcyBuZWNlc3Nhcnk6IFdoZW4gYW4gZWxlbWVudCB3aXRoIFwicG9zaXRpb246YWJzb2x1dGVcIiBoYXMgYW4gdW50b3VjaGVkIFwibGVmdFwiXG5cdCAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eSwgd2hpY2ggcmV2ZXJ0cyB0byBcImF1dG9cIiwgbGVmdCdzIHZhbHVlIGlzIDAgcmVsYXRpdmUgdG8gaXRzIHBhcmVudCBlbGVtZW50LCBidXQgaXMgb2Z0ZW4gbm9uLXplcm8gcmVsYXRpdmVcblx0ICAgICAgICAgICAgICAgICAgIHRvIGl0cyAqY29udGFpbmluZyogKG5vdCBwYXJlbnQpIGVsZW1lbnQsIHdoaWNoIGlzIHRoZSBuZWFyZXN0IFwicG9zaXRpb246cmVsYXRpdmVcIiBhbmNlc3RvciBvciB0aGUgdmlld3BvcnQgKGFuZCBhbHdheXMgdGhlIHZpZXdwb3J0IGluIHRoZSBjYXNlIG9mIFwicG9zaXRpb246Zml4ZWRcIikuICovXG5cdCAgICAgICAgICAgICAgICBpZiAoY29tcHV0ZWRWYWx1ZSA9PT0gXCJhdXRvXCIgJiYgL14odG9wfHJpZ2h0fGJvdHRvbXxsZWZ0KSQvaS50ZXN0KHByb3BlcnR5KSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciBwb3NpdGlvbiA9IGNvbXB1dGVQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwicG9zaXRpb25cIik7IC8qIEdFVCAqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogRm9yIGFic29sdXRlIHBvc2l0aW9uaW5nLCBqUXVlcnkncyAkLnBvc2l0aW9uKCkgb25seSByZXR1cm5zIHZhbHVlcyBmb3IgdG9wIGFuZCBsZWZ0O1xuXHQgICAgICAgICAgICAgICAgICAgICAgIHJpZ2h0IGFuZCBib3R0b20gd2lsbCBoYXZlIHRoZWlyIFwiYXV0b1wiIHZhbHVlIHJldmVydGVkIHRvIDAuICovXG5cdCAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogQSBqUXVlcnkgb2JqZWN0IG11c3QgYmUgY3JlYXRlZCBoZXJlIHNpbmNlIGpRdWVyeSBkb2Vzbid0IGhhdmUgYSBsb3ctbGV2ZWwgYWxpYXMgZm9yICQucG9zaXRpb24oKS5cblx0ICAgICAgICAgICAgICAgICAgICAgICBOb3QgYSBiaWcgZGVhbCBzaW5jZSB3ZSdyZSBjdXJyZW50bHkgaW4gYSBHRVQgYmF0Y2ggYW55d2F5LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbiA9PT0gXCJmaXhlZFwiIHx8IChwb3NpdGlvbiA9PT0gXCJhYnNvbHV0ZVwiICYmIC90b3B8bGVmdC9pLnRlc3QocHJvcGVydHkpKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBqUXVlcnkgc3RyaXBzIHRoZSBwaXhlbCB1bml0IGZyb20gaXRzIHJldHVybmVkIHZhbHVlczsgd2UgcmUtYWRkIGl0IGhlcmUgdG8gY29uZm9ybSB3aXRoIGNvbXB1dGVQcm9wZXJ0eVZhbHVlJ3MgYmVoYXZpb3IuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkVmFsdWUgPSAkKGVsZW1lbnQpLnBvc2l0aW9uKClbcHJvcGVydHldICsgXCJweFwiOyAvKiBHRVQgKi9cblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIHJldHVybiBjb21wdXRlZFZhbHVlO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgdmFyIHByb3BlcnR5VmFsdWU7XG5cblx0ICAgICAgICAgICAgLyogSWYgdGhpcyBpcyBhIGhvb2tlZCBwcm9wZXJ0eSAoZS5nLiBcImNsaXBMZWZ0XCIgaW5zdGVhZCBvZiB0aGUgcm9vdCBwcm9wZXJ0eSBvZiBcImNsaXBcIiksXG5cdCAgICAgICAgICAgICAgIGV4dHJhY3QgdGhlIGhvb2sncyB2YWx1ZSBmcm9tIGEgbm9ybWFsaXplZCByb290UHJvcGVydHlWYWx1ZSB1c2luZyBDU1MuSG9va3MuZXh0cmFjdFZhbHVlKCkuICovXG5cdCAgICAgICAgICAgIGlmIChDU1MuSG9va3MucmVnaXN0ZXJlZFtwcm9wZXJ0eV0pIHtcblx0ICAgICAgICAgICAgICAgIHZhciBob29rID0gcHJvcGVydHksXG5cdCAgICAgICAgICAgICAgICAgICAgaG9va1Jvb3QgPSBDU1MuSG9va3MuZ2V0Um9vdChob29rKTtcblxuXHQgICAgICAgICAgICAgICAgLyogSWYgYSBjYWNoZWQgcm9vdFByb3BlcnR5VmFsdWUgd2Fzbid0IHBhc3NlZCBpbiAod2hpY2ggVmVsb2NpdHkgYWx3YXlzIGF0dGVtcHRzIHRvIGRvIGluIG9yZGVyIHRvIGF2b2lkIHJlcXVlcnlpbmcgdGhlIERPTSksXG5cdCAgICAgICAgICAgICAgICAgICBxdWVyeSB0aGUgRE9NIGZvciB0aGUgcm9vdCBwcm9wZXJ0eSdzIHZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKHJvb3RQcm9wZXJ0eVZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAvKiBTaW5jZSB0aGUgYnJvd3NlciBpcyBub3cgYmVpbmcgZGlyZWN0bHkgcXVlcmllZCwgdXNlIHRoZSBvZmZpY2lhbCBwb3N0LXByZWZpeGluZyBwcm9wZXJ0eSBuYW1lIGZvciB0aGlzIGxvb2t1cC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZSA9IENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIENTUy5OYW1lcy5wcmVmaXhDaGVjayhob29rUm9vdClbMF0pOyAvKiBHRVQgKi9cblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgLyogSWYgdGhpcyByb290IGhhcyBhIG5vcm1hbGl6YXRpb24gcmVnaXN0ZXJlZCwgcGVmb3JtIHRoZSBhc3NvY2lhdGVkIG5vcm1hbGl6YXRpb24gZXh0cmFjdGlvbi4gKi9cblx0ICAgICAgICAgICAgICAgIGlmIChDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtob29rUm9vdF0pIHtcblx0ICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZSA9IENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW2hvb2tSb290XShcImV4dHJhY3RcIiwgZWxlbWVudCwgcm9vdFByb3BlcnR5VmFsdWUpO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAvKiBFeHRyYWN0IHRoZSBob29rJ3MgdmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gQ1NTLkhvb2tzLmV4dHJhY3RWYWx1ZShob29rLCByb290UHJvcGVydHlWYWx1ZSk7XG5cblx0ICAgICAgICAgICAgLyogSWYgdGhpcyBpcyBhIG5vcm1hbGl6ZWQgcHJvcGVydHkgKGUuZy4gXCJvcGFjaXR5XCIgYmVjb21lcyBcImZpbHRlclwiIGluIDw9SUU4KSBvciBcInRyYW5zbGF0ZVhcIiBiZWNvbWVzIFwidHJhbnNmb3JtXCIpLFxuXHQgICAgICAgICAgICAgICBub3JtYWxpemUgdGhlIHByb3BlcnR5J3MgbmFtZSBhbmQgdmFsdWUsIGFuZCBoYW5kbGUgdGhlIHNwZWNpYWwgY2FzZSBvZiB0cmFuc2Zvcm1zLiAqL1xuXHQgICAgICAgICAgICAvKiBOb3RlOiBOb3JtYWxpemluZyBhIHByb3BlcnR5IGlzIG11dHVhbGx5IGV4Y2x1c2l2ZSBmcm9tIGhvb2tpbmcgYSBwcm9wZXJ0eSBzaW5jZSBob29rLWV4dHJhY3RlZCB2YWx1ZXMgYXJlIHN0cmljdGx5XG5cdCAgICAgICAgICAgICAgIG51bWVyaWNhbCBhbmQgdGhlcmVmb3JlIGRvIG5vdCByZXF1aXJlIG5vcm1hbGl6YXRpb24gZXh0cmFjdGlvbi4gKi9cblx0ICAgICAgICAgICAgfSBlbHNlIGlmIChDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtwcm9wZXJ0eV0pIHtcblx0ICAgICAgICAgICAgICAgIHZhciBub3JtYWxpemVkUHJvcGVydHlOYW1lLFxuXHQgICAgICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRQcm9wZXJ0eVZhbHVlO1xuXG5cdCAgICAgICAgICAgICAgICBub3JtYWxpemVkUHJvcGVydHlOYW1lID0gQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbcHJvcGVydHldKFwibmFtZVwiLCBlbGVtZW50KTtcblxuXHQgICAgICAgICAgICAgICAgLyogVHJhbnNmb3JtIHZhbHVlcyBhcmUgY2FsY3VsYXRlZCB2aWEgbm9ybWFsaXphdGlvbiBleHRyYWN0aW9uIChzZWUgYmVsb3cpLCB3aGljaCBjaGVja3MgYWdhaW5zdCB0aGUgZWxlbWVudCdzIHRyYW5zZm9ybUNhY2hlLlxuXHQgICAgICAgICAgICAgICAgICAgQXQgbm8gcG9pbnQgZG8gdHJhbnNmb3JtIEdFVHMgZXZlciBhY3R1YWxseSBxdWVyeSB0aGUgRE9NOyBpbml0aWFsIHN0eWxlc2hlZXQgdmFsdWVzIGFyZSBuZXZlciBwcm9jZXNzZWQuXG5cdCAgICAgICAgICAgICAgICAgICBUaGlzIGlzIGJlY2F1c2UgcGFyc2luZyAzRCB0cmFuc2Zvcm0gbWF0cmljZXMgaXMgbm90IGFsd2F5cyBhY2N1cmF0ZSBhbmQgd291bGQgYmxvYXQgb3VyIGNvZGViYXNlO1xuXHQgICAgICAgICAgICAgICAgICAgdGh1cywgbm9ybWFsaXphdGlvbiBleHRyYWN0aW9uIGRlZmF1bHRzIGluaXRpYWwgdHJhbnNmb3JtIHZhbHVlcyB0byB0aGVpciB6ZXJvLXZhbHVlcyAoZS5nLiAxIGZvciBzY2FsZVggYW5kIDAgZm9yIHRyYW5zbGF0ZVgpLiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKG5vcm1hbGl6ZWRQcm9wZXJ0eU5hbWUgIT09IFwidHJhbnNmb3JtXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICBub3JtYWxpemVkUHJvcGVydHlWYWx1ZSA9IGNvbXB1dGVQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIENTUy5OYW1lcy5wcmVmaXhDaGVjayhub3JtYWxpemVkUHJvcGVydHlOYW1lKVswXSk7IC8qIEdFVCAqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIHZhbHVlIGlzIGEgQ1NTIG51bGwtdmFsdWUgYW5kIHRoaXMgcHJvcGVydHkgaGFzIGEgaG9vayB0ZW1wbGF0ZSwgdXNlIHRoYXQgemVyby12YWx1ZSB0ZW1wbGF0ZSBzbyB0aGF0IGhvb2tzIGNhbiBiZSBleHRyYWN0ZWQgZnJvbSBpdC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoQ1NTLlZhbHVlcy5pc0NTU051bGxWYWx1ZShub3JtYWxpemVkUHJvcGVydHlWYWx1ZSkgJiYgQ1NTLkhvb2tzLnRlbXBsYXRlc1twcm9wZXJ0eV0pIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgbm9ybWFsaXplZFByb3BlcnR5VmFsdWUgPSBDU1MuSG9va3MudGVtcGxhdGVzW3Byb3BlcnR5XVsxXTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtwcm9wZXJ0eV0oXCJleHRyYWN0XCIsIGVsZW1lbnQsIG5vcm1hbGl6ZWRQcm9wZXJ0eVZhbHVlKTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8qIElmIGEgKG51bWVyaWMpIHZhbHVlIHdhc24ndCBwcm9kdWNlZCB2aWEgaG9vayBleHRyYWN0aW9uIG9yIG5vcm1hbGl6YXRpb24sIHF1ZXJ5IHRoZSBET00uICovXG5cdCAgICAgICAgICAgIGlmICghL15bXFxkLV0vLnRlc3QocHJvcGVydHlWYWx1ZSkpIHtcblx0ICAgICAgICAgICAgICAgIC8qIEZvciBTVkcgZWxlbWVudHMsIGRpbWVuc2lvbmFsIHByb3BlcnRpZXMgKHdoaWNoIFNWR0F0dHJpYnV0ZSgpIGRldGVjdHMpIGFyZSB0d2VlbmVkIHZpYVxuXHQgICAgICAgICAgICAgICAgICAgdGhlaXIgSFRNTCBhdHRyaWJ1dGUgdmFsdWVzIGluc3RlYWQgb2YgdGhlaXIgQ1NTIHN0eWxlIHZhbHVlcy4gKi9cblx0ICAgICAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpICYmIERhdGEoZWxlbWVudCkuaXNTVkcgJiYgQ1NTLk5hbWVzLlNWR0F0dHJpYnV0ZShwcm9wZXJ0eSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAvKiBTaW5jZSB0aGUgaGVpZ2h0L3dpZHRoIGF0dHJpYnV0ZSB2YWx1ZXMgbXVzdCBiZSBzZXQgbWFudWFsbHksIHRoZXkgZG9uJ3QgcmVmbGVjdCBjb21wdXRlZCB2YWx1ZXMuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgVGh1cywgd2UgdXNlIHVzZSBnZXRCQm94KCkgdG8gZW5zdXJlIHdlIGFsd2F5cyBnZXQgdmFsdWVzIGZvciBlbGVtZW50cyB3aXRoIHVuZGVmaW5lZCBoZWlnaHQvd2lkdGggYXR0cmlidXRlcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoL14oaGVpZ2h0fHdpZHRoKSQvaS50ZXN0KHByb3BlcnR5KSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBGaXJlZm94IHRocm93cyBhbiBlcnJvciBpZiAuZ2V0QkJveCgpIGlzIGNhbGxlZCBvbiBhbiBTVkcgdGhhdCBpc24ndCBhdHRhY2hlZCB0byB0aGUgRE9NLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IGVsZW1lbnQuZ2V0QkJveCgpW3Byb3BlcnR5XTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSAwO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgLyogT3RoZXJ3aXNlLCBhY2Nlc3MgdGhlIGF0dHJpYnV0ZSB2YWx1ZSBkaXJlY3RseS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUocHJvcGVydHkpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IGNvbXB1dGVQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIENTUy5OYW1lcy5wcmVmaXhDaGVjayhwcm9wZXJ0eSlbMF0pOyAvKiBHRVQgKi9cblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8qIFNpbmNlIHByb3BlcnR5IGxvb2t1cHMgYXJlIGZvciBhbmltYXRpb24gcHVycG9zZXMgKHdoaWNoIGVudGFpbHMgY29tcHV0aW5nIHRoZSBudW1lcmljIGRlbHRhIGJldHdlZW4gc3RhcnQgYW5kIGVuZCB2YWx1ZXMpLFxuXHQgICAgICAgICAgICAgICBjb252ZXJ0IENTUyBudWxsLXZhbHVlcyB0byBhbiBpbnRlZ2VyIG9mIHZhbHVlIDAuICovXG5cdCAgICAgICAgICAgIGlmIChDU1MuVmFsdWVzLmlzQ1NTTnVsbFZhbHVlKHByb3BlcnR5VmFsdWUpKSB7XG5cdCAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gMDtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIGlmIChWZWxvY2l0eS5kZWJ1ZyA+PSAyKSBjb25zb2xlLmxvZyhcIkdldCBcIiArIHByb3BlcnR5ICsgXCI6IFwiICsgcHJvcGVydHlWYWx1ZSk7XG5cblx0ICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5VmFsdWU7XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIC8qIFRoZSBzaW5ndWxhciBzZXRQcm9wZXJ0eVZhbHVlLCB3aGljaCByb3V0ZXMgdGhlIGxvZ2ljIGZvciBhbGwgbm9ybWFsaXphdGlvbnMsIGhvb2tzLCBhbmQgc3RhbmRhcmQgQ1NTIHByb3BlcnRpZXMuICovXG5cdCAgICAgICAgc2V0UHJvcGVydHlWYWx1ZTogZnVuY3Rpb24oZWxlbWVudCwgcHJvcGVydHksIHByb3BlcnR5VmFsdWUsIHJvb3RQcm9wZXJ0eVZhbHVlLCBzY3JvbGxEYXRhKSB7XG5cdCAgICAgICAgICAgIHZhciBwcm9wZXJ0eU5hbWUgPSBwcm9wZXJ0eTtcblxuXHQgICAgICAgICAgICAvKiBJbiBvcmRlciB0byBiZSBzdWJqZWN0ZWQgdG8gY2FsbCBvcHRpb25zIGFuZCBlbGVtZW50IHF1ZXVlaW5nLCBzY3JvbGwgYW5pbWF0aW9uIGlzIHJvdXRlZCB0aHJvdWdoIFZlbG9jaXR5IGFzIGlmIGl0IHdlcmUgYSBzdGFuZGFyZCBDU1MgcHJvcGVydHkuICovXG5cdCAgICAgICAgICAgIGlmIChwcm9wZXJ0eSA9PT0gXCJzY3JvbGxcIikge1xuXHQgICAgICAgICAgICAgICAgLyogSWYgYSBjb250YWluZXIgb3B0aW9uIGlzIHByZXNlbnQsIHNjcm9sbCB0aGUgY29udGFpbmVyIGluc3RlYWQgb2YgdGhlIGJyb3dzZXIgd2luZG93LiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKHNjcm9sbERhdGEuY29udGFpbmVyKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgc2Nyb2xsRGF0YS5jb250YWluZXJbXCJzY3JvbGxcIiArIHNjcm9sbERhdGEuZGlyZWN0aW9uXSA9IHByb3BlcnR5VmFsdWU7XG5cdCAgICAgICAgICAgICAgICAvKiBPdGhlcndpc2UsIFZlbG9jaXR5IGRlZmF1bHRzIHRvIHNjcm9sbGluZyB0aGUgYnJvd3NlciB3aW5kb3cuICovXG5cdCAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChzY3JvbGxEYXRhLmRpcmVjdGlvbiA9PT0gXCJMZWZ0XCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LnNjcm9sbFRvKHByb3BlcnR5VmFsdWUsIHNjcm9sbERhdGEuYWx0ZXJuYXRlVmFsdWUpO1xuXHQgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5zY3JvbGxUbyhzY3JvbGxEYXRhLmFsdGVybmF0ZVZhbHVlLCBwcm9wZXJ0eVZhbHVlKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAvKiBUcmFuc2Zvcm1zICh0cmFuc2xhdGVYLCByb3RhdGVaLCBldGMuKSBhcmUgYXBwbGllZCB0byBhIHBlci1lbGVtZW50IHRyYW5zZm9ybUNhY2hlIG9iamVjdCwgd2hpY2ggaXMgbWFudWFsbHkgZmx1c2hlZCB2aWEgZmx1c2hUcmFuc2Zvcm1DYWNoZSgpLlxuXHQgICAgICAgICAgICAgICAgICAgVGh1cywgZm9yIG5vdywgd2UgbWVyZWx5IGNhY2hlIHRyYW5zZm9ybXMgYmVpbmcgU0VULiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3Byb3BlcnR5XSAmJiBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtwcm9wZXJ0eV0oXCJuYW1lXCIsIGVsZW1lbnQpID09PSBcInRyYW5zZm9ybVwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogUGVyZm9ybSBhIG5vcm1hbGl6YXRpb24gaW5qZWN0aW9uLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFRoZSBub3JtYWxpemF0aW9uIGxvZ2ljIGhhbmRsZXMgdGhlIHRyYW5zZm9ybUNhY2hlIHVwZGF0aW5nLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3Byb3BlcnR5XShcImluamVjdFwiLCBlbGVtZW50LCBwcm9wZXJ0eVZhbHVlKTtcblxuXHQgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZSA9IFwidHJhbnNmb3JtXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGVbcHJvcGVydHldO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAvKiBJbmplY3QgaG9va3MuICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKENTUy5Ib29rcy5yZWdpc3RlcmVkW3Byb3BlcnR5XSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaG9va05hbWUgPSBwcm9wZXJ0eSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvb2tSb290ID0gQ1NTLkhvb2tzLmdldFJvb3QocHJvcGVydHkpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIGEgY2FjaGVkIHJvb3RQcm9wZXJ0eVZhbHVlIHdhcyBub3QgcHJvdmlkZWQsIHF1ZXJ5IHRoZSBET00gZm9yIHRoZSBob29rUm9vdCdzIGN1cnJlbnQgdmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlID0gcm9vdFByb3BlcnR5VmFsdWUgfHwgQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgaG9va1Jvb3QpOyAvKiBHRVQgKi9cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gQ1NTLkhvb2tzLmluamVjdFZhbHVlKGhvb2tOYW1lLCBwcm9wZXJ0eVZhbHVlLCByb290UHJvcGVydHlWYWx1ZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5ID0gaG9va1Jvb3Q7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogTm9ybWFsaXplIG5hbWVzIGFuZCB2YWx1ZXMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3Byb3BlcnR5XSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbcHJvcGVydHldKFwiaW5qZWN0XCIsIGVsZW1lbnQsIHByb3BlcnR5VmFsdWUpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eSA9IENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3Byb3BlcnR5XShcIm5hbWVcIiwgZWxlbWVudCk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogQXNzaWduIHRoZSBhcHByb3ByaWF0ZSB2ZW5kb3IgcHJlZml4IGJlZm9yZSBwZXJmb3JtaW5nIGFuIG9mZmljaWFsIHN0eWxlIHVwZGF0ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eU5hbWUgPSBDU1MuTmFtZXMucHJlZml4Q2hlY2socHJvcGVydHkpWzBdO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogQSB0cnkvY2F0Y2ggaXMgdXNlZCBmb3IgSUU8PTgsIHdoaWNoIHRocm93cyBhbiBlcnJvciB3aGVuIFwiaW52YWxpZFwiIENTUyB2YWx1ZXMgYXJlIHNldCwgZS5nLiBhIG5lZ2F0aXZlIHdpZHRoLlxuXHQgICAgICAgICAgICAgICAgICAgICAgIFRyeS9jYXRjaCBpcyBhdm9pZGVkIGZvciBvdGhlciBicm93c2VycyBzaW5jZSBpdCBpbmN1cnMgYSBwZXJmb3JtYW5jZSBvdmVyaGVhZC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoSUUgPD0gOCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5zdHlsZVtwcm9wZXJ0eU5hbWVdID0gcHJvcGVydHlWYWx1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHsgaWYgKFZlbG9jaXR5LmRlYnVnKSBjb25zb2xlLmxvZyhcIkJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBbXCIgKyBwcm9wZXJ0eVZhbHVlICsgXCJdIGZvciBbXCIgKyBwcm9wZXJ0eU5hbWUgKyBcIl1cIik7IH1cblx0ICAgICAgICAgICAgICAgICAgICAvKiBTVkcgZWxlbWVudHMgaGF2ZSB0aGVpciBkaW1lbnNpb25hbCBwcm9wZXJ0aWVzICh3aWR0aCwgaGVpZ2h0LCB4LCB5LCBjeCwgZXRjLikgYXBwbGllZCBkaXJlY3RseSBhcyBhdHRyaWJ1dGVzIGluc3RlYWQgb2YgYXMgc3R5bGVzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IElFOCBkb2VzIG5vdCBzdXBwb3J0IFNWRyBlbGVtZW50cywgc28gaXQncyBva2F5IHRoYXQgd2Ugc2tpcCBpdCBmb3IgU1ZHIGFuaW1hdGlvbi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKERhdGEoZWxlbWVudCkgJiYgRGF0YShlbGVtZW50KS5pc1NWRyAmJiBDU1MuTmFtZXMuU1ZHQXR0cmlidXRlKHByb3BlcnR5KSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBGb3IgU1ZHIGF0dHJpYnV0ZXMsIHZlbmRvci1wcmVmaXhlZCBwcm9wZXJ0eSBuYW1lcyBhcmUgbmV2ZXIgdXNlZC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogTm90IGFsbCBDU1MgcHJvcGVydGllcyBjYW4gYmUgYW5pbWF0ZWQgdmlhIGF0dHJpYnV0ZXMsIGJ1dCB0aGUgYnJvd3NlciB3b24ndCB0aHJvdyBhbiBlcnJvciBmb3IgdW5zdXBwb3J0ZWQgcHJvcGVydGllcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUocHJvcGVydHksIHByb3BlcnR5VmFsdWUpO1xuXHQgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuc3R5bGVbcHJvcGVydHlOYW1lXSA9IHByb3BlcnR5VmFsdWU7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKFZlbG9jaXR5LmRlYnVnID49IDIpIGNvbnNvbGUubG9nKFwiU2V0IFwiICsgcHJvcGVydHkgKyBcIiAoXCIgKyBwcm9wZXJ0eU5hbWUgKyBcIik6IFwiICsgcHJvcGVydHlWYWx1ZSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvKiBSZXR1cm4gdGhlIG5vcm1hbGl6ZWQgcHJvcGVydHkgbmFtZSBhbmQgdmFsdWUgaW4gY2FzZSB0aGUgY2FsbGVyIHdhbnRzIHRvIGtub3cgaG93IHRoZXNlIHZhbHVlcyB3ZXJlIG1vZGlmaWVkIGJlZm9yZSBiZWluZyBhcHBsaWVkIHRvIHRoZSBET00uICovXG5cdCAgICAgICAgICAgIHJldHVybiBbIHByb3BlcnR5TmFtZSwgcHJvcGVydHlWYWx1ZSBdO1xuXHQgICAgICAgIH0sXG5cblx0ICAgICAgICAvKiBUbyBpbmNyZWFzZSBwZXJmb3JtYW5jZSBieSBiYXRjaGluZyB0cmFuc2Zvcm0gdXBkYXRlcyBpbnRvIGEgc2luZ2xlIFNFVCwgdHJhbnNmb3JtcyBhcmUgbm90IGRpcmVjdGx5IGFwcGxpZWQgdG8gYW4gZWxlbWVudCB1bnRpbCBmbHVzaFRyYW5zZm9ybUNhY2hlKCkgaXMgY2FsbGVkLiAqL1xuXHQgICAgICAgIC8qIE5vdGU6IFZlbG9jaXR5IGFwcGxpZXMgdHJhbnNmb3JtIHByb3BlcnRpZXMgaW4gdGhlIHNhbWUgb3JkZXIgdGhhdCB0aGV5IGFyZSBjaHJvbm9naWNhbGx5IGludHJvZHVjZWQgdG8gdGhlIGVsZW1lbnQncyBDU1Mgc3R5bGVzLiAqL1xuXHQgICAgICAgIGZsdXNoVHJhbnNmb3JtQ2FjaGU6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgdmFyIHRyYW5zZm9ybVN0cmluZyA9IFwiXCI7XG5cblx0ICAgICAgICAgICAgLyogQ2VydGFpbiBicm93c2VycyByZXF1aXJlIHRoYXQgU1ZHIHRyYW5zZm9ybXMgYmUgYXBwbGllZCBhcyBhbiBhdHRyaWJ1dGUuIEhvd2V2ZXIsIHRoZSBTVkcgdHJhbnNmb3JtIGF0dHJpYnV0ZSB0YWtlcyBhIG1vZGlmaWVkIHZlcnNpb24gb2YgQ1NTJ3MgdHJhbnNmb3JtIHN0cmluZ1xuXHQgICAgICAgICAgICAgICAodW5pdHMgYXJlIGRyb3BwZWQgYW5kLCBleGNlcHQgZm9yIHNrZXdYL1ksIHN1YnByb3BlcnRpZXMgYXJlIG1lcmdlZCBpbnRvIHRoZWlyIG1hc3RlciBwcm9wZXJ0eSAtLSBlLmcuIHNjYWxlWCBhbmQgc2NhbGVZIGFyZSBtZXJnZWQgaW50byBzY2FsZShYIFkpLiAqL1xuXHQgICAgICAgICAgICBpZiAoKElFIHx8IChWZWxvY2l0eS5TdGF0ZS5pc0FuZHJvaWQgJiYgIVZlbG9jaXR5LlN0YXRlLmlzQ2hyb21lKSkgJiYgRGF0YShlbGVtZW50KS5pc1NWRykge1xuXHQgICAgICAgICAgICAgICAgLyogU2luY2UgdHJhbnNmb3JtIHZhbHVlcyBhcmUgc3RvcmVkIGluIHRoZWlyIHBhcmVudGhlc2VzLXdyYXBwZWQgZm9ybSwgd2UgdXNlIGEgaGVscGVyIGZ1bmN0aW9uIHRvIHN0cmlwIG91dCB0aGVpciBudW1lcmljIHZhbHVlcy5cblx0ICAgICAgICAgICAgICAgICAgIEZ1cnRoZXIsIFNWRyB0cmFuc2Zvcm0gcHJvcGVydGllcyBvbmx5IHRha2UgdW5pdGxlc3MgKHJlcHJlc2VudGluZyBwaXhlbHMpIHZhbHVlcywgc28gaXQncyBva2F5IHRoYXQgcGFyc2VGbG9hdCgpIHN0cmlwcyB0aGUgdW5pdCBzdWZmaXhlZCB0byB0aGUgZmxvYXQgdmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICBmdW5jdGlvbiBnZXRUcmFuc2Zvcm1GbG9hdCAodHJhbnNmb3JtUHJvcGVydHkpIHtcblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCB0cmFuc2Zvcm1Qcm9wZXJ0eSkpO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAvKiBDcmVhdGUgYW4gb2JqZWN0IHRvIG9yZ2FuaXplIGFsbCB0aGUgdHJhbnNmb3JtcyB0aGF0IHdlJ2xsIGFwcGx5IHRvIHRoZSBTVkcgZWxlbWVudC4gVG8ga2VlcCB0aGUgbG9naWMgc2ltcGxlLFxuXHQgICAgICAgICAgICAgICAgICAgd2UgcHJvY2VzcyAqYWxsKiB0cmFuc2Zvcm0gcHJvcGVydGllcyAtLSBldmVuIHRob3NlIHRoYXQgbWF5IG5vdCBiZSBleHBsaWNpdGx5IGFwcGxpZWQgKHNpbmNlIHRoZXkgZGVmYXVsdCB0byB0aGVpciB6ZXJvLXZhbHVlcyBhbnl3YXkpLiAqL1xuXHQgICAgICAgICAgICAgICAgdmFyIFNWR1RyYW5zZm9ybXMgPSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdHJhbnNsYXRlOiBbIGdldFRyYW5zZm9ybUZsb2F0KFwidHJhbnNsYXRlWFwiKSwgZ2V0VHJhbnNmb3JtRmxvYXQoXCJ0cmFuc2xhdGVZXCIpIF0sXG5cdCAgICAgICAgICAgICAgICAgICAgc2tld1g6IFsgZ2V0VHJhbnNmb3JtRmxvYXQoXCJza2V3WFwiKSBdLCBza2V3WTogWyBnZXRUcmFuc2Zvcm1GbG9hdChcInNrZXdZXCIpIF0sXG5cdCAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIHNjYWxlIHByb3BlcnR5IGlzIHNldCAobm9uLTEpLCB1c2UgdGhhdCB2YWx1ZSBmb3IgdGhlIHNjYWxlWCBhbmQgc2NhbGVZIHZhbHVlc1xuXHQgICAgICAgICAgICAgICAgICAgICAgICh0aGlzIGJlaGF2aW9yIG1pbWljcyB0aGUgcmVzdWx0IG9mIGFuaW1hdGluZyBhbGwgdGhlc2UgcHJvcGVydGllcyBhdCBvbmNlIG9uIEhUTUwgZWxlbWVudHMpLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIHNjYWxlOiBnZXRUcmFuc2Zvcm1GbG9hdChcInNjYWxlXCIpICE9PSAxID8gWyBnZXRUcmFuc2Zvcm1GbG9hdChcInNjYWxlXCIpLCBnZXRUcmFuc2Zvcm1GbG9hdChcInNjYWxlXCIpIF0gOiBbIGdldFRyYW5zZm9ybUZsb2F0KFwic2NhbGVYXCIpLCBnZXRUcmFuc2Zvcm1GbG9hdChcInNjYWxlWVwiKSBdLFxuXHQgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFNWRydzIHJvdGF0ZSB0cmFuc2Zvcm0gdGFrZXMgdGhyZWUgdmFsdWVzOiByb3RhdGlvbiBkZWdyZWVzIGZvbGxvd2VkIGJ5IHRoZSBYIGFuZCBZIHZhbHVlc1xuXHQgICAgICAgICAgICAgICAgICAgICAgIGRlZmluaW5nIHRoZSByb3RhdGlvbidzIG9yaWdpbiBwb2ludC4gV2UgaWdub3JlIHRoZSBvcmlnaW4gdmFsdWVzIChkZWZhdWx0IHRoZW0gdG8gMCkuICovXG5cdCAgICAgICAgICAgICAgICAgICAgcm90YXRlOiBbIGdldFRyYW5zZm9ybUZsb2F0KFwicm90YXRlWlwiKSwgMCwgMCBdXG5cdCAgICAgICAgICAgICAgICB9O1xuXG5cdCAgICAgICAgICAgICAgICAvKiBJdGVyYXRlIHRocm91Z2ggdGhlIHRyYW5zZm9ybSBwcm9wZXJ0aWVzIGluIHRoZSB1c2VyLWRlZmluZWQgcHJvcGVydHkgbWFwIG9yZGVyLlxuXHQgICAgICAgICAgICAgICAgICAgKFRoaXMgbWltaWNzIHRoZSBiZWhhdmlvciBvZiBub24tU1ZHIHRyYW5zZm9ybSBhbmltYXRpb24uKSAqL1xuXHQgICAgICAgICAgICAgICAgJC5lYWNoKERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGUsIGZ1bmN0aW9uKHRyYW5zZm9ybU5hbWUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAvKiBFeGNlcHQgZm9yIHdpdGggc2tld1gvWSwgcmV2ZXJ0IHRoZSBheGlzLXNwZWNpZmljIHRyYW5zZm9ybSBzdWJwcm9wZXJ0aWVzIHRvIHRoZWlyIGF4aXMtZnJlZSBtYXN0ZXJcblx0ICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzIHNvIHRoYXQgdGhleSBtYXRjaCB1cCB3aXRoIFNWRydzIGFjY2VwdGVkIHRyYW5zZm9ybSBwcm9wZXJ0aWVzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmICgvXnRyYW5zbGF0ZS9pLnRlc3QodHJhbnNmb3JtTmFtZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtTmFtZSA9IFwidHJhbnNsYXRlXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvXnNjYWxlL2kudGVzdCh0cmFuc2Zvcm1OYW1lKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1OYW1lID0gXCJzY2FsZVwiO1xuXHQgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoL15yb3RhdGUvaS50ZXN0KHRyYW5zZm9ybU5hbWUpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybU5hbWUgPSBcInJvdGF0ZVwiO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIENoZWNrIHRoYXQgd2UgaGF2ZW4ndCB5ZXQgZGVsZXRlZCB0aGUgcHJvcGVydHkgZnJvbSB0aGUgU1ZHVHJhbnNmb3JtcyBjb250YWluZXIuICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKFNWR1RyYW5zZm9ybXNbdHJhbnNmb3JtTmFtZV0pIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogQXBwZW5kIHRoZSB0cmFuc2Zvcm0gcHJvcGVydHkgaW4gdGhlIFNWRy1zdXBwb3J0ZWQgdHJhbnNmb3JtIGZvcm1hdC4gQXMgcGVyIHRoZSBzcGVjLCBzdXJyb3VuZCB0aGUgc3BhY2UtZGVsaW1pdGVkIHZhbHVlcyBpbiBwYXJlbnRoZXNlcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtU3RyaW5nICs9IHRyYW5zZm9ybU5hbWUgKyBcIihcIiArIFNWR1RyYW5zZm9ybXNbdHJhbnNmb3JtTmFtZV0uam9pbihcIiBcIikgKyBcIilcIiArIFwiIFwiO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIEFmdGVyIHByb2Nlc3NpbmcgYW4gU1ZHIHRyYW5zZm9ybSBwcm9wZXJ0eSwgZGVsZXRlIGl0IGZyb20gdGhlIFNWR1RyYW5zZm9ybXMgY29udGFpbmVyIHNvIHdlIGRvbid0XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlLWluc2VydCB0aGUgc2FtZSBtYXN0ZXIgcHJvcGVydHkgaWYgd2UgZW5jb3VudGVyIGFub3RoZXIgb25lIG9mIGl0cyBheGlzLXNwZWNpZmljIHByb3BlcnRpZXMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBTVkdUcmFuc2Zvcm1zW3RyYW5zZm9ybU5hbWVdO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgdmFyIHRyYW5zZm9ybVZhbHVlLFxuXHQgICAgICAgICAgICAgICAgICAgIHBlcnNwZWN0aXZlO1xuXG5cdCAgICAgICAgICAgICAgICAvKiBUcmFuc2Zvcm0gcHJvcGVydGllcyBhcmUgc3RvcmVkIGFzIG1lbWJlcnMgb2YgdGhlIHRyYW5zZm9ybUNhY2hlIG9iamVjdC4gQ29uY2F0ZW5hdGUgYWxsIHRoZSBtZW1iZXJzIGludG8gYSBzdHJpbmcuICovXG5cdCAgICAgICAgICAgICAgICAkLmVhY2goRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZSwgZnVuY3Rpb24odHJhbnNmb3JtTmFtZSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVZhbHVlID0gRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZVt0cmFuc2Zvcm1OYW1lXTtcblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIFRyYW5zZm9ybSdzIHBlcnNwZWN0aXZlIHN1YnByb3BlcnR5IG11c3QgYmUgc2V0IGZpcnN0IGluIG9yZGVyIHRvIHRha2UgZWZmZWN0LiBTdG9yZSBpdCB0ZW1wb3JhcmlseS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAodHJhbnNmb3JtTmFtZSA9PT0gXCJ0cmFuc2Zvcm1QZXJzcGVjdGl2ZVwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHBlcnNwZWN0aXZlID0gdHJhbnNmb3JtVmFsdWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIElFOSBvbmx5IHN1cHBvcnRzIG9uZSByb3RhdGlvbiB0eXBlLCByb3RhdGVaLCB3aGljaCBpdCByZWZlcnMgdG8gYXMgXCJyb3RhdGVcIi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoSUUgPT09IDkgJiYgdHJhbnNmb3JtTmFtZSA9PT0gXCJyb3RhdGVaXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtTmFtZSA9IFwicm90YXRlXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtU3RyaW5nICs9IHRyYW5zZm9ybU5hbWUgKyB0cmFuc2Zvcm1WYWx1ZSArIFwiIFwiO1xuXHQgICAgICAgICAgICAgICAgfSk7XG5cblx0ICAgICAgICAgICAgICAgIC8qIElmIHByZXNlbnQsIHNldCB0aGUgcGVyc3BlY3RpdmUgc3VicHJvcGVydHkgZmlyc3QuICovXG5cdCAgICAgICAgICAgICAgICBpZiAocGVyc3BlY3RpdmUpIHtcblx0ICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1TdHJpbmcgPSBcInBlcnNwZWN0aXZlXCIgKyBwZXJzcGVjdGl2ZSArIFwiIFwiICsgdHJhbnNmb3JtU3RyaW5nO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgQ1NTLnNldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJ0cmFuc2Zvcm1cIiwgdHJhbnNmb3JtU3RyaW5nKTtcblx0ICAgICAgICB9XG5cdCAgICB9O1xuXG5cdCAgICAvKiBSZWdpc3RlciBob29rcyBhbmQgbm9ybWFsaXphdGlvbnMuICovXG5cdCAgICBDU1MuSG9va3MucmVnaXN0ZXIoKTtcblx0ICAgIENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcigpO1xuXG5cdCAgICAvKiBBbGxvdyBob29rIHNldHRpbmcgaW4gdGhlIHNhbWUgZmFzaGlvbiBhcyBqUXVlcnkncyAkLmNzcygpLiAqL1xuXHQgICAgVmVsb2NpdHkuaG9vayA9IGZ1bmN0aW9uIChlbGVtZW50cywgYXJnMiwgYXJnMykge1xuXHQgICAgICAgIHZhciB2YWx1ZSA9IHVuZGVmaW5lZDtcblxuXHQgICAgICAgIGVsZW1lbnRzID0gc2FuaXRpemVFbGVtZW50cyhlbGVtZW50cyk7XG5cblx0ICAgICAgICAkLmVhY2goZWxlbWVudHMsIGZ1bmN0aW9uKGksIGVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgLyogSW5pdGlhbGl6ZSBWZWxvY2l0eSdzIHBlci1lbGVtZW50IGRhdGEgY2FjaGUgaWYgdGhpcyBlbGVtZW50IGhhc24ndCBwcmV2aW91c2x5IGJlZW4gYW5pbWF0ZWQuICovXG5cdCAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgIFZlbG9jaXR5LmluaXQoZWxlbWVudCk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvKiBHZXQgcHJvcGVydHkgdmFsdWUuIElmIGFuIGVsZW1lbnQgc2V0IHdhcyBwYXNzZWQgaW4sIG9ubHkgcmV0dXJuIHRoZSB2YWx1ZSBmb3IgdGhlIGZpcnN0IGVsZW1lbnQuICovXG5cdCAgICAgICAgICAgIGlmIChhcmczID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBWZWxvY2l0eS5DU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBhcmcyKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgLyogU2V0IHByb3BlcnR5IHZhbHVlLiAqL1xuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgLyogc1BWIHJldHVybnMgYW4gYXJyYXkgb2YgdGhlIG5vcm1hbGl6ZWQgcHJvcGVydHlOYW1lL3Byb3BlcnR5VmFsdWUgcGFpciB1c2VkIHRvIHVwZGF0ZSB0aGUgRE9NLiAqL1xuXHQgICAgICAgICAgICAgICAgdmFyIGFkanVzdGVkU2V0ID0gVmVsb2NpdHkuQ1NTLnNldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgYXJnMiwgYXJnMyk7XG5cblx0ICAgICAgICAgICAgICAgIC8qIFRyYW5zZm9ybSBwcm9wZXJ0aWVzIGRvbid0IGF1dG9tYXRpY2FsbHkgc2V0LiBUaGV5IGhhdmUgdG8gYmUgZmx1c2hlZCB0byB0aGUgRE9NLiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKGFkanVzdGVkU2V0WzBdID09PSBcInRyYW5zZm9ybVwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuQ1NTLmZsdXNoVHJhbnNmb3JtQ2FjaGUoZWxlbWVudCk7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIHZhbHVlID0gYWRqdXN0ZWRTZXQ7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9KTtcblxuXHQgICAgICAgIHJldHVybiB2YWx1ZTtcblx0ICAgIH07XG5cblx0ICAgIC8qKioqKioqKioqKioqKioqKlxuXHQgICAgICAgIEFuaW1hdGlvblxuXHQgICAgKioqKioqKioqKioqKioqKiovXG5cblx0ICAgIHZhciBhbmltYXRlID0gZnVuY3Rpb24oKSB7XG5cblx0ICAgICAgICAvKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgIENhbGwgQ2hhaW5cblx0ICAgICAgICAqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAvKiBMb2dpYyBmb3IgZGV0ZXJtaW5pbmcgd2hhdCB0byByZXR1cm4gdG8gdGhlIGNhbGwgc3RhY2sgd2hlbiBleGl0aW5nIG91dCBvZiBWZWxvY2l0eS4gKi9cblx0ICAgICAgICBmdW5jdGlvbiBnZXRDaGFpbiAoKSB7XG5cdCAgICAgICAgICAgIC8qIElmIHdlIGFyZSB1c2luZyB0aGUgdXRpbGl0eSBmdW5jdGlvbiwgYXR0ZW1wdCB0byByZXR1cm4gdGhpcyBjYWxsJ3MgcHJvbWlzZS4gSWYgbm8gcHJvbWlzZSBsaWJyYXJ5IHdhcyBkZXRlY3RlZCxcblx0ICAgICAgICAgICAgICAgZGVmYXVsdCB0byBudWxsIGluc3RlYWQgb2YgcmV0dXJuaW5nIHRoZSB0YXJnZXRlZCBlbGVtZW50cyBzbyB0aGF0IHV0aWxpdHkgZnVuY3Rpb24ncyByZXR1cm4gdmFsdWUgaXMgc3RhbmRhcmRpemVkLiAqL1xuXHQgICAgICAgICAgICBpZiAoaXNVdGlsaXR5KSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZURhdGEucHJvbWlzZSB8fCBudWxsO1xuXHQgICAgICAgICAgICAvKiBPdGhlcndpc2UsIGlmIHdlJ3JlIHVzaW5nICQuZm4sIHJldHVybiB0aGUgalF1ZXJ5LS9aZXB0by13cmFwcGVkIGVsZW1lbnQgc2V0LiAqL1xuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnRzV3JhcHBlZDtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgQXJndW1lbnRzIEFzc2lnbm1lbnRcblx0ICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgLyogVG8gYWxsb3cgZm9yIGV4cHJlc3NpdmUgQ29mZmVlU2NyaXB0IGNvZGUsIFZlbG9jaXR5IHN1cHBvcnRzIGFuIGFsdGVybmF0aXZlIHN5bnRheCBpbiB3aGljaCBcImVsZW1lbnRzXCIgKG9yIFwiZVwiKSwgXCJwcm9wZXJ0aWVzXCIgKG9yIFwicFwiKSwgYW5kIFwib3B0aW9uc1wiIChvciBcIm9cIilcblx0ICAgICAgICAgICBvYmplY3RzIGFyZSBkZWZpbmVkIG9uIGEgY29udGFpbmVyIG9iamVjdCB0aGF0J3MgcGFzc2VkIGluIGFzIFZlbG9jaXR5J3Mgc29sZSBhcmd1bWVudC4gKi9cblx0ICAgICAgICAvKiBOb3RlOiBTb21lIGJyb3dzZXJzIGF1dG9tYXRpY2FsbHkgcG9wdWxhdGUgYXJndW1lbnRzIHdpdGggYSBcInByb3BlcnRpZXNcIiBvYmplY3QuIFdlIGRldGVjdCBpdCBieSBjaGVja2luZyBmb3IgaXRzIGRlZmF1bHQgXCJuYW1lc1wiIHByb3BlcnR5LiAqL1xuXHQgICAgICAgIHZhciBzeW50YWN0aWNTdWdhciA9IChhcmd1bWVudHNbMF0gJiYgKGFyZ3VtZW50c1swXS5wIHx8ICgoJC5pc1BsYWluT2JqZWN0KGFyZ3VtZW50c1swXS5wcm9wZXJ0aWVzKSAmJiAhYXJndW1lbnRzWzBdLnByb3BlcnRpZXMubmFtZXMpIHx8IFR5cGUuaXNTdHJpbmcoYXJndW1lbnRzWzBdLnByb3BlcnRpZXMpKSkpLFxuXHQgICAgICAgICAgICAvKiBXaGV0aGVyIFZlbG9jaXR5IHdhcyBjYWxsZWQgdmlhIHRoZSB1dGlsaXR5IGZ1bmN0aW9uIChhcyBvcHBvc2VkIHRvIG9uIGEgalF1ZXJ5L1plcHRvIG9iamVjdCkuICovXG5cdCAgICAgICAgICAgIGlzVXRpbGl0eSxcblx0ICAgICAgICAgICAgLyogV2hlbiBWZWxvY2l0eSBpcyBjYWxsZWQgdmlhIHRoZSB1dGlsaXR5IGZ1bmN0aW9uICgkLlZlbG9jaXR5KCkvVmVsb2NpdHkoKSksIGVsZW1lbnRzIGFyZSBleHBsaWNpdGx5XG5cdCAgICAgICAgICAgICAgIHBhc3NlZCBpbiBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyLiBUaHVzLCBhcmd1bWVudCBwb3NpdGlvbmluZyB2YXJpZXMuIFdlIG5vcm1hbGl6ZSB0aGVtIGhlcmUuICovXG5cdCAgICAgICAgICAgIGVsZW1lbnRzV3JhcHBlZCxcblx0ICAgICAgICAgICAgYXJndW1lbnRJbmRleDtcblxuXHQgICAgICAgIHZhciBlbGVtZW50cyxcblx0ICAgICAgICAgICAgcHJvcGVydGllc01hcCxcblx0ICAgICAgICAgICAgb3B0aW9ucztcblxuXHQgICAgICAgIC8qIERldGVjdCBqUXVlcnkvWmVwdG8gZWxlbWVudHMgYmVpbmcgYW5pbWF0ZWQgdmlhIHRoZSAkLmZuIG1ldGhvZC4gKi9cblx0ICAgICAgICBpZiAoVHlwZS5pc1dyYXBwZWQodGhpcykpIHtcblx0ICAgICAgICAgICAgaXNVdGlsaXR5ID0gZmFsc2U7XG5cblx0ICAgICAgICAgICAgYXJndW1lbnRJbmRleCA9IDA7XG5cdCAgICAgICAgICAgIGVsZW1lbnRzID0gdGhpcztcblx0ICAgICAgICAgICAgZWxlbWVudHNXcmFwcGVkID0gdGhpcztcblx0ICAgICAgICAvKiBPdGhlcndpc2UsIHJhdyBlbGVtZW50cyBhcmUgYmVpbmcgYW5pbWF0ZWQgdmlhIHRoZSB1dGlsaXR5IGZ1bmN0aW9uLiAqL1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIGlzVXRpbGl0eSA9IHRydWU7XG5cblx0ICAgICAgICAgICAgYXJndW1lbnRJbmRleCA9IDE7XG5cdCAgICAgICAgICAgIGVsZW1lbnRzID0gc3ludGFjdGljU3VnYXIgPyAoYXJndW1lbnRzWzBdLmVsZW1lbnRzIHx8IGFyZ3VtZW50c1swXS5lKSA6IGFyZ3VtZW50c1swXTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBlbGVtZW50cyA9IHNhbml0aXplRWxlbWVudHMoZWxlbWVudHMpO1xuXG5cdCAgICAgICAgaWYgKCFlbGVtZW50cykge1xuXHQgICAgICAgICAgICByZXR1cm47XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKHN5bnRhY3RpY1N1Z2FyKSB7XG5cdCAgICAgICAgICAgIHByb3BlcnRpZXNNYXAgPSBhcmd1bWVudHNbMF0ucHJvcGVydGllcyB8fCBhcmd1bWVudHNbMF0ucDtcblx0ICAgICAgICAgICAgb3B0aW9ucyA9IGFyZ3VtZW50c1swXS5vcHRpb25zIHx8IGFyZ3VtZW50c1swXS5vO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHByb3BlcnRpZXNNYXAgPSBhcmd1bWVudHNbYXJndW1lbnRJbmRleF07XG5cdCAgICAgICAgICAgIG9wdGlvbnMgPSBhcmd1bWVudHNbYXJndW1lbnRJbmRleCArIDFdO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8qIFRoZSBsZW5ndGggb2YgdGhlIGVsZW1lbnQgc2V0IChpbiB0aGUgZm9ybSBvZiBhIG5vZGVMaXN0IG9yIGFuIGFycmF5IG9mIGVsZW1lbnRzKSBpcyBkZWZhdWx0ZWQgdG8gMSBpbiBjYXNlIGFcblx0ICAgICAgICAgICBzaW5nbGUgcmF3IERPTSBlbGVtZW50IGlzIHBhc3NlZCBpbiAod2hpY2ggZG9lc24ndCBjb250YWluIGEgbGVuZ3RoIHByb3BlcnR5KS4gKi9cblx0ICAgICAgICB2YXIgZWxlbWVudHNMZW5ndGggPSBlbGVtZW50cy5sZW5ndGgsXG5cdCAgICAgICAgICAgIGVsZW1lbnRzSW5kZXggPSAwO1xuXG5cdCAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICBBcmd1bWVudCBPdmVybG9hZGluZ1xuXHQgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgIC8qIFN1cHBvcnQgaXMgaW5jbHVkZWQgZm9yIGpRdWVyeSdzIGFyZ3VtZW50IG92ZXJsb2FkaW5nOiAkLmFuaW1hdGUocHJvcGVydHlNYXAgWywgZHVyYXRpb25dIFssIGVhc2luZ10gWywgY29tcGxldGVdKS5cblx0ICAgICAgICAgICBPdmVybG9hZGluZyBpcyBkZXRlY3RlZCBieSBjaGVja2luZyBmb3IgdGhlIGFic2VuY2Ugb2YgYW4gb2JqZWN0IGJlaW5nIHBhc3NlZCBpbnRvIG9wdGlvbnMuICovXG5cdCAgICAgICAgLyogTm90ZTogVGhlIHN0b3AgYW5kIGZpbmlzaCBhY3Rpb25zIGRvIG5vdCBhY2NlcHQgYW5pbWF0aW9uIG9wdGlvbnMsIGFuZCBhcmUgdGhlcmVmb3JlIGV4Y2x1ZGVkIGZyb20gdGhpcyBjaGVjay4gKi9cblx0ICAgICAgICBpZiAoIS9eKHN0b3B8ZmluaXNofGZpbmlzaEFsbCkkL2kudGVzdChwcm9wZXJ0aWVzTWFwKSAmJiAhJC5pc1BsYWluT2JqZWN0KG9wdGlvbnMpKSB7XG5cdCAgICAgICAgICAgIC8qIFRoZSB1dGlsaXR5IGZ1bmN0aW9uIHNoaWZ0cyBhbGwgYXJndW1lbnRzIG9uZSBwb3NpdGlvbiB0byB0aGUgcmlnaHQsIHNvIHdlIGFkanVzdCBmb3IgdGhhdCBvZmZzZXQuICovXG5cdCAgICAgICAgICAgIHZhciBzdGFydGluZ0FyZ3VtZW50UG9zaXRpb24gPSBhcmd1bWVudEluZGV4ICsgMTtcblxuXHQgICAgICAgICAgICBvcHRpb25zID0ge307XG5cblx0ICAgICAgICAgICAgLyogSXRlcmF0ZSB0aHJvdWdoIGFsbCBvcHRpb25zIGFyZ3VtZW50cyAqL1xuXHQgICAgICAgICAgICBmb3IgKHZhciBpID0gc3RhcnRpbmdBcmd1bWVudFBvc2l0aW9uOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICAvKiBUcmVhdCBhIG51bWJlciBhcyBhIGR1cmF0aW9uLiBQYXJzZSBpdCBvdXQuICovXG5cdCAgICAgICAgICAgICAgICAvKiBOb3RlOiBUaGUgZm9sbG93aW5nIFJlZ0V4IHdpbGwgcmV0dXJuIHRydWUgaWYgcGFzc2VkIGFuIGFycmF5IHdpdGggYSBudW1iZXIgYXMgaXRzIGZpcnN0IGl0ZW0uXG5cdCAgICAgICAgICAgICAgICAgICBUaHVzLCBhcnJheXMgYXJlIHNraXBwZWQgZnJvbSB0aGlzIGNoZWNrLiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKCFUeXBlLmlzQXJyYXkoYXJndW1lbnRzW2ldKSAmJiAoL14oZmFzdHxub3JtYWx8c2xvdykkL2kudGVzdChhcmd1bWVudHNbaV0pIHx8IC9eXFxkLy50ZXN0KGFyZ3VtZW50c1tpXSkpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5kdXJhdGlvbiA9IGFyZ3VtZW50c1tpXTtcblx0ICAgICAgICAgICAgICAgIC8qIFRyZWF0IHN0cmluZ3MgYW5kIGFycmF5cyBhcyBlYXNpbmdzLiAqL1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChUeXBlLmlzU3RyaW5nKGFyZ3VtZW50c1tpXSkgfHwgVHlwZS5pc0FycmF5KGFyZ3VtZW50c1tpXSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmVhc2luZyA9IGFyZ3VtZW50c1tpXTtcblx0ICAgICAgICAgICAgICAgIC8qIFRyZWF0IGEgZnVuY3Rpb24gYXMgYSBjb21wbGV0ZSBjYWxsYmFjay4gKi9cblx0ICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoVHlwZS5pc0Z1bmN0aW9uKGFyZ3VtZW50c1tpXSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmNvbXBsZXRlID0gYXJndW1lbnRzW2ldO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLyoqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICBQcm9taXNlc1xuXHQgICAgICAgICoqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgIHZhciBwcm9taXNlRGF0YSA9IHtcblx0ICAgICAgICAgICAgICAgIHByb21pc2U6IG51bGwsXG5cdCAgICAgICAgICAgICAgICByZXNvbHZlcjogbnVsbCxcblx0ICAgICAgICAgICAgICAgIHJlamVjdGVyOiBudWxsXG5cdCAgICAgICAgICAgIH07XG5cblx0ICAgICAgICAvKiBJZiB0aGlzIGNhbGwgd2FzIG1hZGUgdmlhIHRoZSB1dGlsaXR5IGZ1bmN0aW9uICh3aGljaCBpcyB0aGUgZGVmYXVsdCBtZXRob2Qgb2YgaW52b2NhdGlvbiB3aGVuIGpRdWVyeS9aZXB0byBhcmUgbm90IGJlaW5nIHVzZWQpLCBhbmQgaWZcblx0ICAgICAgICAgICBwcm9taXNlIHN1cHBvcnQgd2FzIGRldGVjdGVkLCBjcmVhdGUgYSBwcm9taXNlIG9iamVjdCBmb3IgdGhpcyBjYWxsIGFuZCBzdG9yZSByZWZlcmVuY2VzIHRvIGl0cyByZXNvbHZlciBhbmQgcmVqZWN0ZXIgbWV0aG9kcy4gVGhlIHJlc29sdmVcblx0ICAgICAgICAgICBtZXRob2QgaXMgdXNlZCB3aGVuIGEgY2FsbCBjb21wbGV0ZXMgbmF0dXJhbGx5IG9yIGlzIHByZW1hdHVyZWx5IHN0b3BwZWQgYnkgdGhlIHVzZXIuIEluIGJvdGggY2FzZXMsIGNvbXBsZXRlQ2FsbCgpIGhhbmRsZXMgdGhlIGFzc29jaWF0ZWRcblx0ICAgICAgICAgICBjYWxsIGNsZWFudXAgYW5kIHByb21pc2UgcmVzb2x2aW5nIGxvZ2ljLiBUaGUgcmVqZWN0IG1ldGhvZCBpcyB1c2VkIHdoZW4gYW4gaW52YWxpZCBzZXQgb2YgYXJndW1lbnRzIGlzIHBhc3NlZCBpbnRvIGEgVmVsb2NpdHkgY2FsbC4gKi9cblx0ICAgICAgICAvKiBOb3RlOiBWZWxvY2l0eSBlbXBsb3lzIGEgY2FsbC1iYXNlZCBxdWV1ZWluZyBhcmNoaXRlY3R1cmUsIHdoaWNoIG1lYW5zIHRoYXQgc3RvcHBpbmcgYW4gYW5pbWF0aW5nIGVsZW1lbnQgYWN0dWFsbHkgc3RvcHMgdGhlIGZ1bGwgY2FsbCB0aGF0XG5cdCAgICAgICAgICAgdHJpZ2dlcmVkIGl0IC0tIG5vdCB0aGF0IG9uZSBlbGVtZW50IGV4Y2x1c2l2ZWx5LiBTaW1pbGFybHksIHRoZXJlIGlzIG9uZSBwcm9taXNlIHBlciBjYWxsLCBhbmQgYWxsIGVsZW1lbnRzIHRhcmdldGVkIGJ5IGEgVmVsb2NpdHkgY2FsbCBhcmVcblx0ICAgICAgICAgICBncm91cGVkIHRvZ2V0aGVyIGZvciB0aGUgcHVycG9zZXMgb2YgcmVzb2x2aW5nIGFuZCByZWplY3RpbmcgYSBwcm9taXNlLiAqL1xuXHQgICAgICAgIGlmIChpc1V0aWxpdHkgJiYgVmVsb2NpdHkuUHJvbWlzZSkge1xuXHQgICAgICAgICAgICBwcm9taXNlRGF0YS5wcm9taXNlID0gbmV3IFZlbG9jaXR5LlByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXHQgICAgICAgICAgICAgICAgcHJvbWlzZURhdGEucmVzb2x2ZXIgPSByZXNvbHZlO1xuXHQgICAgICAgICAgICAgICAgcHJvbWlzZURhdGEucmVqZWN0ZXIgPSByZWplY3Q7XG5cdCAgICAgICAgICAgIH0pO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICBBY3Rpb24gRGV0ZWN0aW9uXG5cdCAgICAgICAgKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgLyogVmVsb2NpdHkncyBiZWhhdmlvciBpcyBjYXRlZ29yaXplZCBpbnRvIFwiYWN0aW9uc1wiOiBFbGVtZW50cyBjYW4gZWl0aGVyIGJlIHNwZWNpYWxseSBzY3JvbGxlZCBpbnRvIHZpZXcsXG5cdCAgICAgICAgICAgb3IgdGhleSBjYW4gYmUgc3RhcnRlZCwgc3RvcHBlZCwgb3IgcmV2ZXJzZWQuIElmIGEgbGl0ZXJhbCBvciByZWZlcmVuY2VkIHByb3BlcnRpZXMgbWFwIGlzIHBhc3NlZCBpbiBhcyBWZWxvY2l0eSdzXG5cdCAgICAgICAgICAgZmlyc3QgYXJndW1lbnQsIHRoZSBhc3NvY2lhdGVkIGFjdGlvbiBpcyBcInN0YXJ0XCIuIEFsdGVybmF0aXZlbHksIFwic2Nyb2xsXCIsIFwicmV2ZXJzZVwiLCBvciBcInN0b3BcIiBjYW4gYmUgcGFzc2VkIGluIGluc3RlYWQgb2YgYSBwcm9wZXJ0aWVzIG1hcC4gKi9cblx0ICAgICAgICB2YXIgYWN0aW9uO1xuXG5cdCAgICAgICAgc3dpdGNoIChwcm9wZXJ0aWVzTWFwKSB7XG5cdCAgICAgICAgICAgIGNhc2UgXCJzY3JvbGxcIjpcblx0ICAgICAgICAgICAgICAgIGFjdGlvbiA9IFwic2Nyb2xsXCI7XG5cdCAgICAgICAgICAgICAgICBicmVhaztcblxuXHQgICAgICAgICAgICBjYXNlIFwicmV2ZXJzZVwiOlxuXHQgICAgICAgICAgICAgICAgYWN0aW9uID0gXCJyZXZlcnNlXCI7XG5cdCAgICAgICAgICAgICAgICBicmVhaztcblxuXHQgICAgICAgICAgICBjYXNlIFwiZmluaXNoXCI6XG5cdCAgICAgICAgICAgIGNhc2UgXCJmaW5pc2hBbGxcIjpcblx0ICAgICAgICAgICAgY2FzZSBcInN0b3BcIjpcblx0ICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgQWN0aW9uOiBTdG9wXG5cdCAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAvKiBDbGVhciB0aGUgY3VycmVudGx5LWFjdGl2ZSBkZWxheSBvbiBlYWNoIHRhcmdldGVkIGVsZW1lbnQuICovXG5cdCAgICAgICAgICAgICAgICAkLmVhY2goZWxlbWVudHMsIGZ1bmN0aW9uKGksIGVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgICAgICAgICBpZiAoRGF0YShlbGVtZW50KSAmJiBEYXRhKGVsZW1lbnQpLmRlbGF5VGltZXIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogU3RvcCB0aGUgdGltZXIgZnJvbSB0cmlnZ2VyaW5nIGl0cyBjYWNoZWQgbmV4dCgpIGZ1bmN0aW9uLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoRGF0YShlbGVtZW50KS5kZWxheVRpbWVyLnNldFRpbWVvdXQpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIE1hbnVhbGx5IGNhbGwgdGhlIG5leHQoKSBmdW5jdGlvbiBzbyB0aGF0IHRoZSBzdWJzZXF1ZW50IHF1ZXVlIGl0ZW1zIGNhbiBwcm9ncmVzcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkuZGVsYXlUaW1lci5uZXh0KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLmRlbGF5VGltZXIubmV4dCgpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIERhdGEoZWxlbWVudCkuZGVsYXlUaW1lcjtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBJZiB3ZSB3YW50IHRvIGZpbmlzaCBldmVyeXRoaW5nIGluIHRoZSBxdWV1ZSwgd2UgaGF2ZSB0byBpdGVyYXRlIHRocm91Z2ggaXRcblx0ICAgICAgICAgICAgICAgICAgICAgICBhbmQgY2FsbCBlYWNoIGZ1bmN0aW9uLiBUaGlzIHdpbGwgbWFrZSB0aGVtIGFjdGl2ZSBjYWxscyBiZWxvdywgd2hpY2ggd2lsbFxuXHQgICAgICAgICAgICAgICAgICAgICAgIGNhdXNlIHRoZW0gdG8gYmUgYXBwbGllZCB2aWEgdGhlIGR1cmF0aW9uIHNldHRpbmcuICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXNNYXAgPT09IFwiZmluaXNoQWxsXCIgJiYgKG9wdGlvbnMgPT09IHRydWUgfHwgVHlwZS5pc1N0cmluZyhvcHRpb25zKSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogSXRlcmF0ZSB0aHJvdWdoIHRoZSBpdGVtcyBpbiB0aGUgZWxlbWVudCdzIHF1ZXVlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2goJC5xdWV1ZShlbGVtZW50LCBUeXBlLmlzU3RyaW5nKG9wdGlvbnMpID8gb3B0aW9ucyA6IFwiXCIpLCBmdW5jdGlvbihfLCBpdGVtKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBUaGUgcXVldWUgYXJyYXkgY2FuIGNvbnRhaW4gYW4gXCJpbnByb2dyZXNzXCIgc3RyaW5nLCB3aGljaCB3ZSBza2lwLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFR5cGUuaXNGdW5jdGlvbihpdGVtKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0oKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogQ2xlYXJpbmcgdGhlICQucXVldWUoKSBhcnJheSBpcyBhY2hpZXZlZCBieSByZXNldHRpbmcgaXQgdG8gW10uICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICQucXVldWUoZWxlbWVudCwgVHlwZS5pc1N0cmluZyhvcHRpb25zKSA/IG9wdGlvbnMgOiBcIlwiLCBbXSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfSk7XG5cblx0ICAgICAgICAgICAgICAgIHZhciBjYWxsc1RvU3RvcCA9IFtdO1xuXG5cdCAgICAgICAgICAgICAgICAvKiBXaGVuIHRoZSBzdG9wIGFjdGlvbiBpcyB0cmlnZ2VyZWQsIHRoZSBlbGVtZW50cycgY3VycmVudGx5IGFjdGl2ZSBjYWxsIGlzIGltbWVkaWF0ZWx5IHN0b3BwZWQuIFRoZSBhY3RpdmUgY2FsbCBtaWdodCBoYXZlXG5cdCAgICAgICAgICAgICAgICAgICBiZWVuIGFwcGxpZWQgdG8gbXVsdGlwbGUgZWxlbWVudHMsIGluIHdoaWNoIGNhc2UgYWxsIG9mIHRoZSBjYWxsJ3MgZWxlbWVudHMgd2lsbCBiZSBzdG9wcGVkLiBXaGVuIGFuIGVsZW1lbnRcblx0ICAgICAgICAgICAgICAgICAgIGlzIHN0b3BwZWQsIHRoZSBuZXh0IGl0ZW0gaW4gaXRzIGFuaW1hdGlvbiBxdWV1ZSBpcyBpbW1lZGlhdGVseSB0cmlnZ2VyZWQuICovXG5cdCAgICAgICAgICAgICAgICAvKiBBbiBhZGRpdGlvbmFsIGFyZ3VtZW50IG1heSBiZSBwYXNzZWQgaW4gdG8gY2xlYXIgYW4gZWxlbWVudCdzIHJlbWFpbmluZyBxdWV1ZWQgY2FsbHMuIEVpdGhlciB0cnVlICh3aGljaCBkZWZhdWx0cyB0byB0aGUgXCJmeFwiIHF1ZXVlKVxuXHQgICAgICAgICAgICAgICAgICAgb3IgYSBjdXN0b20gcXVldWUgc3RyaW5nIGNhbiBiZSBwYXNzZWQgaW4uICovXG5cdCAgICAgICAgICAgICAgICAvKiBOb3RlOiBUaGUgc3RvcCBjb21tYW5kIHJ1bnMgcHJpb3IgdG8gVmVsb2NpdHkncyBRdWV1ZWluZyBwaGFzZSBzaW5jZSBpdHMgYmVoYXZpb3IgaXMgaW50ZW5kZWQgdG8gdGFrZSBlZmZlY3QgKmltbWVkaWF0ZWx5Kixcblx0ICAgICAgICAgICAgICAgICAgIHJlZ2FyZGxlc3Mgb2YgdGhlIGVsZW1lbnQncyBjdXJyZW50IHF1ZXVlIHN0YXRlLiAqL1xuXG5cdCAgICAgICAgICAgICAgICAvKiBJdGVyYXRlIHRocm91Z2ggZXZlcnkgYWN0aXZlIGNhbGwuICovXG5cdCAgICAgICAgICAgICAgICAkLmVhY2goVmVsb2NpdHkuU3RhdGUuY2FsbHMsIGZ1bmN0aW9uKGksIGFjdGl2ZUNhbGwpIHtcblx0ICAgICAgICAgICAgICAgICAgICAvKiBJbmFjdGl2ZSBjYWxscyBhcmUgc2V0IHRvIGZhbHNlIGJ5IHRoZSBsb2dpYyBpbnNpZGUgY29tcGxldGVDYWxsKCkuIFNraXAgdGhlbS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aXZlQ2FsbCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBJdGVyYXRlIHRocm91Z2ggdGhlIGFjdGl2ZSBjYWxsJ3MgdGFyZ2V0ZWQgZWxlbWVudHMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChhY3RpdmVDYWxsWzFdLCBmdW5jdGlvbihrLCBhY3RpdmVFbGVtZW50KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0cnVlIHdhcyBwYXNzZWQgaW4gYXMgYSBzZWNvbmRhcnkgYXJndW1lbnQsIGNsZWFyIGFic29sdXRlbHkgYWxsIGNhbGxzIG9uIHRoaXMgZWxlbWVudC4gT3RoZXJ3aXNlLCBvbmx5XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGVhciBjYWxscyBhc3NvY2lhdGVkIHdpdGggdGhlIHJlbGV2YW50IHF1ZXVlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQ2FsbCBzdG9wcGluZyBsb2dpYyB3b3JrcyBhcyBmb2xsb3dzOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLSBvcHRpb25zID09PSB0cnVlIC0tPiBzdG9wIGN1cnJlbnQgZGVmYXVsdCBxdWV1ZSBjYWxscyAoYW5kIHF1ZXVlOmZhbHNlIGNhbGxzKSwgaW5jbHVkaW5nIHJlbWFpbmluZyBxdWV1ZWQgb25lcy5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0gb3B0aW9ucyA9PT0gdW5kZWZpbmVkIC0tPiBzdG9wIGN1cnJlbnQgcXVldWU6XCJcIiBjYWxsIGFuZCBhbGwgcXVldWU6ZmFsc2UgY2FsbHMuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIG9wdGlvbnMgPT09IGZhbHNlIC0tPiBzdG9wIG9ubHkgcXVldWU6ZmFsc2UgY2FsbHMuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIG9wdGlvbnMgPT09IFwiY3VzdG9tXCIgLS0+IHN0b3AgY3VycmVudCBxdWV1ZTpcImN1c3RvbVwiIGNhbGwsIGluY2x1ZGluZyByZW1haW5pbmcgcXVldWVkIG9uZXMgKHRoZXJlIGlzIG5vIGZ1bmN0aW9uYWxpdHkgdG8gb25seSBjbGVhciB0aGUgY3VycmVudGx5LXJ1bm5pbmcgcXVldWU6XCJjdXN0b21cIiBjYWxsKS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBxdWV1ZU5hbWUgPSAob3B0aW9ucyA9PT0gdW5kZWZpbmVkKSA/IFwiXCIgOiBvcHRpb25zO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocXVldWVOYW1lICE9PSB0cnVlICYmIChhY3RpdmVDYWxsWzJdLnF1ZXVlICE9PSBxdWV1ZU5hbWUpICYmICEob3B0aW9ucyA9PT0gdW5kZWZpbmVkICYmIGFjdGl2ZUNhbGxbMl0ucXVldWUgPT09IGZhbHNlKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJdGVyYXRlIHRocm91Z2ggdGhlIGNhbGxzIHRhcmdldGVkIGJ5IHRoZSBzdG9wIGNvbW1hbmQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2goZWxlbWVudHMsIGZ1bmN0aW9uKGwsIGVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDaGVjayB0aGF0IHRoaXMgY2FsbCB3YXMgYXBwbGllZCB0byB0aGUgdGFyZ2V0IGVsZW1lbnQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQgPT09IGFjdGl2ZUVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogT3B0aW9uYWxseSBjbGVhciB0aGUgcmVtYWluaW5nIHF1ZXVlZCBjYWxscy4gSWYgd2UncmUgZG9pbmcgXCJmaW5pc2hBbGxcIiB0aGlzIHdvbid0IGZpbmQgYW55dGhpbmcsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1ZSB0byB0aGUgcXVldWUtY2xlYXJpbmcgYWJvdmUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zID09PSB0cnVlIHx8IFR5cGUuaXNTdHJpbmcob3B0aW9ucykpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEl0ZXJhdGUgdGhyb3VnaCB0aGUgaXRlbXMgaW4gdGhlIGVsZW1lbnQncyBxdWV1ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaCgkLnF1ZXVlKGVsZW1lbnQsIFR5cGUuaXNTdHJpbmcob3B0aW9ucykgPyBvcHRpb25zIDogXCJcIiksIGZ1bmN0aW9uKF8sIGl0ZW0pIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBUaGUgcXVldWUgYXJyYXkgY2FuIGNvbnRhaW4gYW4gXCJpbnByb2dyZXNzXCIgc3RyaW5nLCB3aGljaCB3ZSBza2lwLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChUeXBlLmlzRnVuY3Rpb24oaXRlbSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogUGFzcyB0aGUgaXRlbSdzIGNhbGxiYWNrIGEgZmxhZyBpbmRpY2F0aW5nIHRoYXQgd2Ugd2FudCB0byBhYm9ydCBmcm9tIHRoZSBxdWV1ZSBjYWxsLlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoU3BlY2lmaWNhbGx5LCB0aGUgcXVldWUgd2lsbCByZXNvbHZlIHRoZSBjYWxsJ3MgYXNzb2NpYXRlZCBwcm9taXNlIHRoZW4gYWJvcnQuKSAgKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbShudWxsLCB0cnVlKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQ2xlYXJpbmcgdGhlICQucXVldWUoKSBhcnJheSBpcyBhY2hpZXZlZCBieSByZXNldHRpbmcgaXQgdG8gW10uICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLnF1ZXVlKGVsZW1lbnQsIFR5cGUuaXNTdHJpbmcob3B0aW9ucykgPyBvcHRpb25zIDogXCJcIiwgW10pO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXNNYXAgPT09IFwic3RvcFwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTaW5jZSBcInJldmVyc2VcIiB1c2VzIGNhY2hlZCBzdGFydCB2YWx1ZXMgKHRoZSBwcmV2aW91cyBjYWxsJ3MgZW5kVmFsdWVzKSwgdGhlc2UgdmFsdWVzIG11c3QgYmVcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5nZWQgdG8gcmVmbGVjdCB0aGUgZmluYWwgdmFsdWUgdGhhdCB0aGUgZWxlbWVudHMgd2VyZSBhY3R1YWxseSB0d2VlbmVkIHRvLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogSWYgb25seSBxdWV1ZTpmYWxzZSBhbmltYXRpb25zIGFyZSBjdXJyZW50bHkgcnVubmluZyBvbiBhbiBlbGVtZW50LCBpdCB3b24ndCBoYXZlIGEgdHdlZW5zQ29udGFpbmVyXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3QuIEFsc28sIHF1ZXVlOmZhbHNlIGFuaW1hdGlvbnMgY2FuJ3QgYmUgcmV2ZXJzZWQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoRGF0YShlbGVtZW50KSAmJiBEYXRhKGVsZW1lbnQpLnR3ZWVuc0NvbnRhaW5lciAmJiBxdWV1ZU5hbWUgIT09IGZhbHNlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKERhdGEoZWxlbWVudCkudHdlZW5zQ29udGFpbmVyLCBmdW5jdGlvbihtLCBhY3RpdmVUd2Vlbikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmVUd2Vlbi5lbmRWYWx1ZSA9IGFjdGl2ZVR3ZWVuLmN1cnJlbnRWYWx1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbHNUb1N0b3AucHVzaChpKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9wZXJ0aWVzTWFwID09PSBcImZpbmlzaFwiIHx8IHByb3BlcnRpZXNNYXAgPT09IFwiZmluaXNoQWxsXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRvIGdldCBhY3RpdmUgdHdlZW5zIHRvIGZpbmlzaCBpbW1lZGlhdGVseSwgd2UgZm9yY2VmdWxseSBzaG9ydGVuIHRoZWlyIGR1cmF0aW9ucyB0byAxbXMgc28gdGhhdFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhleSBmaW5pc2ggdXBvbiB0aGUgbmV4dCByQWYgdGljayB0aGVuIHByb2NlZWQgd2l0aCBub3JtYWwgY2FsbCBjb21wbGV0aW9uIGxvZ2ljLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlQ2FsbFsyXS5kdXJhdGlvbiA9IDE7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfSk7XG5cblx0ICAgICAgICAgICAgICAgIC8qIFByZW1hdHVyZWx5IGNhbGwgY29tcGxldGVDYWxsKCkgb24gZWFjaCBtYXRjaGVkIGFjdGl2ZSBjYWxsLiBQYXNzIGFuIGFkZGl0aW9uYWwgZmxhZyBmb3IgXCJzdG9wXCIgdG8gaW5kaWNhdGVcblx0ICAgICAgICAgICAgICAgICAgIHRoYXQgdGhlIGNvbXBsZXRlIGNhbGxiYWNrIGFuZCBkaXNwbGF5Om5vbmUgc2V0dGluZyBzaG91bGQgYmUgc2tpcHBlZCBzaW5jZSB3ZSdyZSBjb21wbGV0aW5nIHByZW1hdHVyZWx5LiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKHByb3BlcnRpZXNNYXAgPT09IFwic3RvcFwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGNhbGxzVG9TdG9wLCBmdW5jdGlvbihpLCBqKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlQ2FsbChqLCB0cnVlKTtcblx0ICAgICAgICAgICAgICAgICAgICB9KTtcblxuXHQgICAgICAgICAgICAgICAgICAgIGlmIChwcm9taXNlRGF0YS5wcm9taXNlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIEltbWVkaWF0ZWx5IHJlc29sdmUgdGhlIHByb21pc2UgYXNzb2NpYXRlZCB3aXRoIHRoaXMgc3RvcCBjYWxsIHNpbmNlIHN0b3AgcnVucyBzeW5jaHJvbm91c2x5LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlRGF0YS5yZXNvbHZlcihlbGVtZW50cyk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAvKiBTaW5jZSB3ZSdyZSBzdG9wcGluZywgYW5kIG5vdCBwcm9jZWVkaW5nIHdpdGggcXVldWVpbmcsIGV4aXQgb3V0IG9mIFZlbG9jaXR5LiAqL1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIGdldENoYWluKCk7XG5cblx0ICAgICAgICAgICAgZGVmYXVsdDpcblx0ICAgICAgICAgICAgICAgIC8qIFRyZWF0IGEgbm9uLWVtcHR5IHBsYWluIG9iamVjdCBhcyBhIGxpdGVyYWwgcHJvcGVydGllcyBtYXAuICovXG5cdCAgICAgICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHByb3BlcnRpZXNNYXApICYmICFUeXBlLmlzRW1wdHlPYmplY3QocHJvcGVydGllc01hcCkpIHtcblx0ICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBcInN0YXJ0XCI7XG5cblx0ICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgUmVkaXJlY3RzXG5cdCAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAvKiBDaGVjayBpZiBhIHN0cmluZyBtYXRjaGVzIGEgcmVnaXN0ZXJlZCByZWRpcmVjdCAoc2VlIFJlZGlyZWN0cyBhYm92ZSkuICovXG5cdCAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFR5cGUuaXNTdHJpbmcocHJvcGVydGllc01hcCkgJiYgVmVsb2NpdHkuUmVkaXJlY3RzW3Byb3BlcnRpZXNNYXBdKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIG9wdHMgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucyksXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uT3JpZ2luYWwgPSBvcHRzLmR1cmF0aW9uLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICBkZWxheU9yaWdpbmFsID0gb3B0cy5kZWxheSB8fCAwO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGJhY2t3YXJkcyBvcHRpb24gd2FzIHBhc3NlZCBpbiwgcmV2ZXJzZSB0aGUgZWxlbWVudCBzZXQgc28gdGhhdCBlbGVtZW50cyBhbmltYXRlIGZyb20gdGhlIGxhc3QgdG8gdGhlIGZpcnN0LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLmJhY2t3YXJkcyA9PT0gdHJ1ZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50cyA9ICQuZXh0ZW5kKHRydWUsIFtdLCBlbGVtZW50cykucmV2ZXJzZSgpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIEluZGl2aWR1YWxseSB0cmlnZ2VyIHRoZSByZWRpcmVjdCBmb3IgZWFjaCBlbGVtZW50IGluIHRoZSBzZXQgdG8gcHJldmVudCB1c2VycyBmcm9tIGhhdmluZyB0byBoYW5kbGUgaXRlcmF0aW9uIGxvZ2ljIGluIHRoZWlyIHJlZGlyZWN0LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICQuZWFjaChlbGVtZW50cywgZnVuY3Rpb24oZWxlbWVudEluZGV4LCBlbGVtZW50KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBzdGFnZ2VyIG9wdGlvbiB3YXMgcGFzc2VkIGluLCBzdWNjZXNzaXZlbHkgZGVsYXkgZWFjaCBlbGVtZW50IGJ5IHRoZSBzdGFnZ2VyIHZhbHVlIChpbiBtcykuIFJldGFpbiB0aGUgb3JpZ2luYWwgZGVsYXkgdmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJzZUZsb2F0KG9wdHMuc3RhZ2dlcikpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdHMuZGVsYXkgPSBkZWxheU9yaWdpbmFsICsgKHBhcnNlRmxvYXQob3B0cy5zdGFnZ2VyKSAqIGVsZW1lbnRJbmRleCk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoVHlwZS5pc0Z1bmN0aW9uKG9wdHMuc3RhZ2dlcikpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdHMuZGVsYXkgPSBkZWxheU9yaWdpbmFsICsgb3B0cy5zdGFnZ2VyLmNhbGwoZWxlbWVudCwgZWxlbWVudEluZGV4LCBlbGVtZW50c0xlbmd0aCk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgZHJhZyBvcHRpb24gd2FzIHBhc3NlZCBpbiwgc3VjY2Vzc2l2ZWx5IGluY3JlYXNlL2RlY3JlYXNlIChkZXBlbmRpbmcgb24gdGhlIHByZXNlbnNlIG9mIG9wdHMuYmFja3dhcmRzKVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgZHVyYXRpb24gb2YgZWFjaCBlbGVtZW50J3MgYW5pbWF0aW9uLCB1c2luZyBmbG9vcnMgdG8gcHJldmVudCBwcm9kdWNpbmcgdmVyeSBzaG9ydCBkdXJhdGlvbnMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLmRyYWcpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIERlZmF1bHQgdGhlIGR1cmF0aW9uIG9mIFVJIHBhY2sgZWZmZWN0cyAoY2FsbG91dHMgYW5kIHRyYW5zaXRpb25zKSB0byAxMDAwbXMgaW5zdGVhZCBvZiB0aGUgdXN1YWwgZGVmYXVsdCBkdXJhdGlvbiBvZiA0MDBtcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdHMuZHVyYXRpb24gPSBwYXJzZUZsb2F0KGR1cmF0aW9uT3JpZ2luYWwpIHx8ICgvXihjYWxsb3V0fHRyYW5zaXRpb24pLy50ZXN0KHByb3BlcnRpZXNNYXApID8gMTAwMCA6IERVUkFUSU9OX0RFRkFVTFQpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBGb3IgZWFjaCBlbGVtZW50LCB0YWtlIHRoZSBncmVhdGVyIGR1cmF0aW9uIG9mOiBBKSBhbmltYXRpb24gY29tcGxldGlvbiBwZXJjZW50YWdlIHJlbGF0aXZlIHRvIHRoZSBvcmlnaW5hbCBkdXJhdGlvbixcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEIpIDc1JSBvZiB0aGUgb3JpZ2luYWwgZHVyYXRpb24sIG9yIEMpIGEgMjAwbXMgZmFsbGJhY2sgKGluIGNhc2UgZHVyYXRpb24gaXMgYWxyZWFkeSBzZXQgdG8gYSBsb3cgdmFsdWUpLlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVGhlIGVuZCByZXN1bHQgaXMgYSBiYXNlbGluZSBvZiA3NSUgb2YgdGhlIHJlZGlyZWN0J3MgZHVyYXRpb24gdGhhdCBpbmNyZWFzZXMvZGVjcmVhc2VzIGFzIHRoZSBlbmQgb2YgdGhlIGVsZW1lbnQgc2V0IGlzIGFwcHJvYWNoZWQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmR1cmF0aW9uID0gTWF0aC5tYXgob3B0cy5kdXJhdGlvbiAqIChvcHRzLmJhY2t3YXJkcyA/IDEgLSBlbGVtZW50SW5kZXgvZWxlbWVudHNMZW5ndGggOiAoZWxlbWVudEluZGV4ICsgMSkgLyBlbGVtZW50c0xlbmd0aCksIG9wdHMuZHVyYXRpb24gKiAwLjc1LCAyMDApO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogUGFzcyBpbiB0aGUgY2FsbCdzIG9wdHMgb2JqZWN0IHNvIHRoYXQgdGhlIHJlZGlyZWN0IGNhbiBvcHRpb25hbGx5IGV4dGVuZCBpdC4gSXQgZGVmYXVsdHMgdG8gYW4gZW1wdHkgb2JqZWN0IGluc3RlYWQgb2YgbnVsbCB0b1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICByZWR1Y2UgdGhlIG9wdHMgY2hlY2tpbmcgbG9naWMgcmVxdWlyZWQgaW5zaWRlIHRoZSByZWRpcmVjdC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuUmVkaXJlY3RzW3Byb3BlcnRpZXNNYXBdLmNhbGwoZWxlbWVudCwgZWxlbWVudCwgb3B0cyB8fCB7fSwgZWxlbWVudEluZGV4LCBlbGVtZW50c0xlbmd0aCwgZWxlbWVudHMsIHByb21pc2VEYXRhLnByb21pc2UgPyBwcm9taXNlRGF0YSA6IHVuZGVmaW5lZCk7XG5cdCAgICAgICAgICAgICAgICAgICAgfSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBTaW5jZSB0aGUgYW5pbWF0aW9uIGxvZ2ljIHJlc2lkZXMgd2l0aGluIHRoZSByZWRpcmVjdCdzIG93biBjb2RlLCBhYm9ydCB0aGUgcmVtYWluZGVyIG9mIHRoaXMgY2FsbC5cblx0ICAgICAgICAgICAgICAgICAgICAgICAoVGhlIHBlcmZvcm1hbmNlIG92ZXJoZWFkIHVwIHRvIHRoaXMgcG9pbnQgaXMgdmlydHVhbGx5IG5vbi1leGlzdGFudC4pICovXG5cdCAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogVGhlIGpRdWVyeSBjYWxsIGNoYWluIGlzIGtlcHQgaW50YWN0IGJ5IHJldHVybmluZyB0aGUgY29tcGxldGUgZWxlbWVudCBzZXQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdldENoYWluKCk7XG5cdCAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciBhYm9ydEVycm9yID0gXCJWZWxvY2l0eTogRmlyc3QgYXJndW1lbnQgKFwiICsgcHJvcGVydGllc01hcCArIFwiKSB3YXMgbm90IGEgcHJvcGVydHkgbWFwLCBhIGtub3duIGFjdGlvbiwgb3IgYSByZWdpc3RlcmVkIHJlZGlyZWN0LiBBYm9ydGluZy5cIjtcblxuXHQgICAgICAgICAgICAgICAgICAgIGlmIChwcm9taXNlRGF0YS5wcm9taXNlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VEYXRhLnJlamVjdGVyKG5ldyBFcnJvcihhYm9ydEVycm9yKSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYWJvcnRFcnJvcik7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdldENoYWluKCk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgIENhbGwtV2lkZSBWYXJpYWJsZXNcblx0ICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgIC8qIEEgY29udGFpbmVyIGZvciBDU1MgdW5pdCBjb252ZXJzaW9uIHJhdGlvcyAoZS5nLiAlLCByZW0sIGFuZCBlbSA9PT4gcHgpIHRoYXQgaXMgdXNlZCB0byBjYWNoZSByYXRpb3MgYWNyb3NzIGFsbCBlbGVtZW50c1xuXHQgICAgICAgICAgIGJlaW5nIGFuaW1hdGVkIGluIGEgc2luZ2xlIFZlbG9jaXR5IGNhbGwuIENhbGN1bGF0aW5nIHVuaXQgcmF0aW9zIG5lY2Vzc2l0YXRlcyBET00gcXVlcnlpbmcgYW5kIHVwZGF0aW5nLCBhbmQgaXMgdGhlcmVmb3JlXG5cdCAgICAgICAgICAgYXZvaWRlZCAodmlhIGNhY2hpbmcpIHdoZXJldmVyIHBvc3NpYmxlLiBUaGlzIGNvbnRhaW5lciBpcyBjYWxsLXdpZGUgaW5zdGVhZCBvZiBwYWdlLXdpZGUgdG8gYXZvaWQgdGhlIHJpc2sgb2YgdXNpbmcgc3RhbGVcblx0ICAgICAgICAgICBjb252ZXJzaW9uIG1ldHJpY3MgYWNyb3NzIFZlbG9jaXR5IGFuaW1hdGlvbnMgdGhhdCBhcmUgbm90IGltbWVkaWF0ZWx5IGNvbnNlY3V0aXZlbHkgY2hhaW5lZC4gKi9cblx0ICAgICAgICB2YXIgY2FsbFVuaXRDb252ZXJzaW9uRGF0YSA9IHtcblx0ICAgICAgICAgICAgICAgIGxhc3RQYXJlbnQ6IG51bGwsXG5cdCAgICAgICAgICAgICAgICBsYXN0UG9zaXRpb246IG51bGwsXG5cdCAgICAgICAgICAgICAgICBsYXN0Rm9udFNpemU6IG51bGwsXG5cdCAgICAgICAgICAgICAgICBsYXN0UGVyY2VudFRvUHhXaWR0aDogbnVsbCxcblx0ICAgICAgICAgICAgICAgIGxhc3RQZXJjZW50VG9QeEhlaWdodDogbnVsbCxcblx0ICAgICAgICAgICAgICAgIGxhc3RFbVRvUHg6IG51bGwsXG5cdCAgICAgICAgICAgICAgICByZW1Ub1B4OiBudWxsLFxuXHQgICAgICAgICAgICAgICAgdndUb1B4OiBudWxsLFxuXHQgICAgICAgICAgICAgICAgdmhUb1B4OiBudWxsXG5cdCAgICAgICAgICAgIH07XG5cblx0ICAgICAgICAvKiBBIGNvbnRhaW5lciBmb3IgYWxsIHRoZSBlbnN1aW5nIHR3ZWVuIGRhdGEgYW5kIG1ldGFkYXRhIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGNhbGwuIFRoaXMgY29udGFpbmVyIGdldHMgcHVzaGVkIHRvIHRoZSBwYWdlLXdpZGVcblx0ICAgICAgICAgICBWZWxvY2l0eS5TdGF0ZS5jYWxscyBhcnJheSB0aGF0IGlzIHByb2Nlc3NlZCBkdXJpbmcgYW5pbWF0aW9uIHRpY2tpbmcuICovXG5cdCAgICAgICAgdmFyIGNhbGwgPSBbXTtcblxuXHQgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICBFbGVtZW50IFByb2Nlc3Npbmdcblx0ICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAvKiBFbGVtZW50IHByb2Nlc3NpbmcgY29uc2lzdHMgb2YgdGhyZWUgcGFydHMgLS0gZGF0YSBwcm9jZXNzaW5nIHRoYXQgY2Fubm90IGdvIHN0YWxlIGFuZCBkYXRhIHByb2Nlc3NpbmcgdGhhdCAqY2FuKiBnbyBzdGFsZSAoaS5lLiB0aGlyZC1wYXJ0eSBzdHlsZSBtb2RpZmljYXRpb25zKTpcblx0ICAgICAgICAgICAxKSBQcmUtUXVldWVpbmc6IEVsZW1lbnQtd2lkZSB2YXJpYWJsZXMsIGluY2x1ZGluZyB0aGUgZWxlbWVudCdzIGRhdGEgc3RvcmFnZSwgYXJlIGluc3RhbnRpYXRlZC4gQ2FsbCBvcHRpb25zIGFyZSBwcmVwYXJlZC4gSWYgdHJpZ2dlcmVkLCB0aGUgU3RvcCBhY3Rpb24gaXMgZXhlY3V0ZWQuXG5cdCAgICAgICAgICAgMikgUXVldWVpbmc6IFRoZSBsb2dpYyB0aGF0IHJ1bnMgb25jZSB0aGlzIGNhbGwgaGFzIHJlYWNoZWQgaXRzIHBvaW50IG9mIGV4ZWN1dGlvbiBpbiB0aGUgZWxlbWVudCdzICQucXVldWUoKSBzdGFjay4gTW9zdCBsb2dpYyBpcyBwbGFjZWQgaGVyZSB0byBhdm9pZCByaXNraW5nIGl0IGJlY29taW5nIHN0YWxlLlxuXHQgICAgICAgICAgIDMpIFB1c2hpbmc6IENvbnNvbGlkYXRpb24gb2YgdGhlIHR3ZWVuIGRhdGEgZm9sbG93ZWQgYnkgaXRzIHB1c2ggb250byB0aGUgZ2xvYmFsIGluLXByb2dyZXNzIGNhbGxzIGNvbnRhaW5lci5cblx0ICAgICAgICAqL1xuXG5cdCAgICAgICAgZnVuY3Rpb24gcHJvY2Vzc0VsZW1lbnQgKCkge1xuXG5cdCAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgIFBhcnQgSTogUHJlLVF1ZXVlaW5nXG5cdCAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICBFbGVtZW50LVdpZGUgVmFyaWFibGVzXG5cdCAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICB2YXIgZWxlbWVudCA9IHRoaXMsXG5cdCAgICAgICAgICAgICAgICAvKiBUaGUgcnVudGltZSBvcHRzIG9iamVjdCBpcyB0aGUgZXh0ZW5zaW9uIG9mIHRoZSBjdXJyZW50IGNhbGwncyBvcHRpb25zIGFuZCBWZWxvY2l0eSdzIHBhZ2Utd2lkZSBvcHRpb24gZGVmYXVsdHMuICovXG5cdCAgICAgICAgICAgICAgICBvcHRzID0gJC5leHRlbmQoe30sIFZlbG9jaXR5LmRlZmF1bHRzLCBvcHRpb25zKSxcblx0ICAgICAgICAgICAgICAgIC8qIEEgY29udGFpbmVyIGZvciB0aGUgcHJvY2Vzc2VkIGRhdGEgYXNzb2NpYXRlZCB3aXRoIGVhY2ggcHJvcGVydHkgaW4gdGhlIHByb3BlcnR5TWFwLlxuXHQgICAgICAgICAgICAgICAgICAgKEVhY2ggcHJvcGVydHkgaW4gdGhlIG1hcCBwcm9kdWNlcyBpdHMgb3duIFwidHdlZW5cIi4pICovXG5cdCAgICAgICAgICAgICAgICB0d2VlbnNDb250YWluZXIgPSB7fSxcblx0ICAgICAgICAgICAgICAgIGVsZW1lbnRVbml0Q29udmVyc2lvbkRhdGE7XG5cblx0ICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICBFbGVtZW50IEluaXRcblx0ICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgIFZlbG9jaXR5LmluaXQoZWxlbWVudCk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgIE9wdGlvbjogRGVsYXlcblx0ICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgIC8qIFNpbmNlIHF1ZXVlOmZhbHNlIGRvZXNuJ3QgcmVzcGVjdCB0aGUgaXRlbSdzIGV4aXN0aW5nIHF1ZXVlLCB3ZSBhdm9pZCBpbmplY3RpbmcgaXRzIGRlbGF5IGhlcmUgKGl0J3Mgc2V0IGxhdGVyIG9uKS4gKi9cblx0ICAgICAgICAgICAgLyogTm90ZTogVmVsb2NpdHkgcm9sbHMgaXRzIG93biBkZWxheSBmdW5jdGlvbiBzaW5jZSBqUXVlcnkgZG9lc24ndCBoYXZlIGEgdXRpbGl0eSBhbGlhcyBmb3IgJC5mbi5kZWxheSgpXG5cdCAgICAgICAgICAgICAgIChhbmQgdGh1cyByZXF1aXJlcyBqUXVlcnkgZWxlbWVudCBjcmVhdGlvbiwgd2hpY2ggd2UgYXZvaWQgc2luY2UgaXRzIG92ZXJoZWFkIGluY2x1ZGVzIERPTSBxdWVyeWluZykuICovXG5cdCAgICAgICAgICAgIGlmIChwYXJzZUZsb2F0KG9wdHMuZGVsYXkpICYmIG9wdHMucXVldWUgIT09IGZhbHNlKSB7XG5cdCAgICAgICAgICAgICAgICAkLnF1ZXVlKGVsZW1lbnQsIG9wdHMucXVldWUsIGZ1bmN0aW9uKG5leHQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAvKiBUaGlzIGlzIGEgZmxhZyB1c2VkIHRvIGluZGljYXRlIHRvIHRoZSB1cGNvbWluZyBjb21wbGV0ZUNhbGwoKSBmdW5jdGlvbiB0aGF0IHRoaXMgcXVldWUgZW50cnkgd2FzIGluaXRpYXRlZCBieSBWZWxvY2l0eS4gU2VlIGNvbXBsZXRlQ2FsbCgpIGZvciBmdXJ0aGVyIGRldGFpbHMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkudmVsb2NpdHlRdWV1ZUVudHJ5RmxhZyA9IHRydWU7XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBUaGUgZW5zdWluZyBxdWV1ZSBpdGVtICh3aGljaCBpcyBhc3NpZ25lZCB0byB0aGUgXCJuZXh0XCIgYXJndW1lbnQgdGhhdCAkLnF1ZXVlKCkgYXV0b21hdGljYWxseSBwYXNzZXMgaW4pIHdpbGwgYmUgdHJpZ2dlcmVkIGFmdGVyIGEgc2V0VGltZW91dCBkZWxheS5cblx0ICAgICAgICAgICAgICAgICAgICAgICBUaGUgc2V0VGltZW91dCBpcyBzdG9yZWQgc28gdGhhdCBpdCBjYW4gYmUgc3ViamVjdGVkIHRvIGNsZWFyVGltZW91dCgpIGlmIHRoaXMgYW5pbWF0aW9uIGlzIHByZW1hdHVyZWx5IHN0b3BwZWQgdmlhIFZlbG9jaXR5J3MgXCJzdG9wXCIgY29tbWFuZC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLmRlbGF5VGltZXIgPSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQ6IHNldFRpbWVvdXQobmV4dCwgcGFyc2VGbG9hdChvcHRzLmRlbGF5KSksXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIG5leHQ6IG5leHRcblx0ICAgICAgICAgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgIE9wdGlvbjogRHVyYXRpb25cblx0ICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgIC8qIFN1cHBvcnQgZm9yIGpRdWVyeSdzIG5hbWVkIGR1cmF0aW9ucy4gKi9cblx0ICAgICAgICAgICAgc3dpdGNoIChvcHRzLmR1cmF0aW9uLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSkge1xuXHQgICAgICAgICAgICAgICAgY2FzZSBcImZhc3RcIjpcblx0ICAgICAgICAgICAgICAgICAgICBvcHRzLmR1cmF0aW9uID0gMjAwO1xuXHQgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG5cdCAgICAgICAgICAgICAgICBjYXNlIFwibm9ybWFsXCI6XG5cdCAgICAgICAgICAgICAgICAgICAgb3B0cy5kdXJhdGlvbiA9IERVUkFUSU9OX0RFRkFVTFQ7XG5cdCAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cblx0ICAgICAgICAgICAgICAgIGNhc2UgXCJzbG93XCI6XG5cdCAgICAgICAgICAgICAgICAgICAgb3B0cy5kdXJhdGlvbiA9IDYwMDtcblx0ICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuXHQgICAgICAgICAgICAgICAgZGVmYXVsdDpcblx0ICAgICAgICAgICAgICAgICAgICAvKiBSZW1vdmUgdGhlIHBvdGVudGlhbCBcIm1zXCIgc3VmZml4IGFuZCBkZWZhdWx0IHRvIDEgaWYgdGhlIHVzZXIgaXMgYXR0ZW1wdGluZyB0byBzZXQgYSBkdXJhdGlvbiBvZiAwIChpbiBvcmRlciB0byBwcm9kdWNlIGFuIGltbWVkaWF0ZSBzdHlsZSBjaGFuZ2UpLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIG9wdHMuZHVyYXRpb24gPSBwYXJzZUZsb2F0KG9wdHMuZHVyYXRpb24pIHx8IDE7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgIEdsb2JhbCBPcHRpb246IE1vY2tcblx0ICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgIGlmIChWZWxvY2l0eS5tb2NrICE9PSBmYWxzZSkge1xuXHQgICAgICAgICAgICAgICAgLyogSW4gbW9jayBtb2RlLCBhbGwgYW5pbWF0aW9ucyBhcmUgZm9yY2VkIHRvIDFtcyBzbyB0aGF0IHRoZXkgb2NjdXIgaW1tZWRpYXRlbHkgdXBvbiB0aGUgbmV4dCByQUYgdGljay5cblx0ICAgICAgICAgICAgICAgICAgIEFsdGVybmF0aXZlbHksIGEgbXVsdGlwbGllciBjYW4gYmUgcGFzc2VkIGluIHRvIHRpbWUgcmVtYXAgYWxsIGRlbGF5cyBhbmQgZHVyYXRpb25zLiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKFZlbG9jaXR5Lm1vY2sgPT09IHRydWUpIHtcblx0ICAgICAgICAgICAgICAgICAgICBvcHRzLmR1cmF0aW9uID0gb3B0cy5kZWxheSA9IDE7XG5cdCAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIG9wdHMuZHVyYXRpb24gKj0gcGFyc2VGbG9hdChWZWxvY2l0eS5tb2NrKSB8fCAxO1xuXHQgICAgICAgICAgICAgICAgICAgIG9wdHMuZGVsYXkgKj0gcGFyc2VGbG9hdChWZWxvY2l0eS5tb2NrKSB8fCAxO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgT3B0aW9uOiBFYXNpbmdcblx0ICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICBvcHRzLmVhc2luZyA9IGdldEVhc2luZyhvcHRzLmVhc2luZywgb3B0cy5kdXJhdGlvbik7XG5cblx0ICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgT3B0aW9uOiBDYWxsYmFja3Ncblx0ICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAvKiBDYWxsYmFja3MgbXVzdCBmdW5jdGlvbnMuIE90aGVyd2lzZSwgZGVmYXVsdCB0byBudWxsLiAqL1xuXHQgICAgICAgICAgICBpZiAob3B0cy5iZWdpbiAmJiAhVHlwZS5pc0Z1bmN0aW9uKG9wdHMuYmVnaW4pKSB7XG5cdCAgICAgICAgICAgICAgICBvcHRzLmJlZ2luID0gbnVsbDtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIGlmIChvcHRzLnByb2dyZXNzICYmICFUeXBlLmlzRnVuY3Rpb24ob3B0cy5wcm9ncmVzcykpIHtcblx0ICAgICAgICAgICAgICAgIG9wdHMucHJvZ3Jlc3MgPSBudWxsO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgaWYgKG9wdHMuY29tcGxldGUgJiYgIVR5cGUuaXNGdW5jdGlvbihvcHRzLmNvbXBsZXRlKSkge1xuXHQgICAgICAgICAgICAgICAgb3B0cy5jb21wbGV0ZSA9IG51bGw7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgIE9wdGlvbjogRGlzcGxheSAmIFZpc2liaWxpdHlcblx0ICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgIC8qIFJlZmVyIHRvIFZlbG9jaXR5J3MgZG9jdW1lbnRhdGlvbiAoVmVsb2NpdHlKUy5vcmcvI2Rpc3BsYXlBbmRWaXNpYmlsaXR5KSBmb3IgYSBkZXNjcmlwdGlvbiBvZiB0aGUgZGlzcGxheSBhbmQgdmlzaWJpbGl0eSBvcHRpb25zJyBiZWhhdmlvci4gKi9cblx0ICAgICAgICAgICAgLyogTm90ZTogV2Ugc3RyaWN0bHkgY2hlY2sgZm9yIHVuZGVmaW5lZCBpbnN0ZWFkIG9mIGZhbHNpbmVzcyBiZWNhdXNlIGRpc3BsYXkgYWNjZXB0cyBhbiBlbXB0eSBzdHJpbmcgdmFsdWUuICovXG5cdCAgICAgICAgICAgIGlmIChvcHRzLmRpc3BsYXkgIT09IHVuZGVmaW5lZCAmJiBvcHRzLmRpc3BsYXkgIT09IG51bGwpIHtcblx0ICAgICAgICAgICAgICAgIG9wdHMuZGlzcGxheSA9IG9wdHMuZGlzcGxheS50b1N0cmluZygpLnRvTG93ZXJDYXNlKCk7XG5cblx0ICAgICAgICAgICAgICAgIC8qIFVzZXJzIGNhbiBwYXNzIGluIGEgc3BlY2lhbCBcImF1dG9cIiB2YWx1ZSB0byBpbnN0cnVjdCBWZWxvY2l0eSB0byBzZXQgdGhlIGVsZW1lbnQgdG8gaXRzIGRlZmF1bHQgZGlzcGxheSB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgIGlmIChvcHRzLmRpc3BsYXkgPT09IFwiYXV0b1wiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgb3B0cy5kaXNwbGF5ID0gVmVsb2NpdHkuQ1NTLlZhbHVlcy5nZXREaXNwbGF5VHlwZShlbGVtZW50KTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIGlmIChvcHRzLnZpc2liaWxpdHkgIT09IHVuZGVmaW5lZCAmJiBvcHRzLnZpc2liaWxpdHkgIT09IG51bGwpIHtcblx0ICAgICAgICAgICAgICAgIG9wdHMudmlzaWJpbGl0eSA9IG9wdHMudmlzaWJpbGl0eS50b1N0cmluZygpLnRvTG93ZXJDYXNlKCk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICBPcHRpb246IG1vYmlsZUhBXG5cdCAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgLyogV2hlbiBzZXQgdG8gdHJ1ZSwgYW5kIGlmIHRoaXMgaXMgYSBtb2JpbGUgZGV2aWNlLCBtb2JpbGVIQSBhdXRvbWF0aWNhbGx5IGVuYWJsZXMgaGFyZHdhcmUgYWNjZWxlcmF0aW9uICh2aWEgYSBudWxsIHRyYW5zZm9ybSBoYWNrKVxuXHQgICAgICAgICAgICAgICBvbiBhbmltYXRpbmcgZWxlbWVudHMuIEhBIGlzIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudCBhdCB0aGUgY29tcGxldGlvbiBvZiBpdHMgYW5pbWF0aW9uLiAqL1xuXHQgICAgICAgICAgICAvKiBOb3RlOiBBbmRyb2lkIEdpbmdlcmJyZWFkIGRvZXNuJ3Qgc3VwcG9ydCBIQS4gSWYgYSBudWxsIHRyYW5zZm9ybSBoYWNrIChtb2JpbGVIQSkgaXMgaW4gZmFjdCBzZXQsIGl0IHdpbGwgcHJldmVudCBvdGhlciB0cmFuZm9ybSBzdWJwcm9wZXJ0aWVzIGZyb20gdGFraW5nIGVmZmVjdC4gKi9cblx0ICAgICAgICAgICAgLyogTm90ZTogWW91IGNhbiByZWFkIG1vcmUgYWJvdXQgdGhlIHVzZSBvZiBtb2JpbGVIQSBpbiBWZWxvY2l0eSdzIGRvY3VtZW50YXRpb246IFZlbG9jaXR5SlMub3JnLyNtb2JpbGVIQS4gKi9cblx0ICAgICAgICAgICAgb3B0cy5tb2JpbGVIQSA9IChvcHRzLm1vYmlsZUhBICYmIFZlbG9jaXR5LlN0YXRlLmlzTW9iaWxlICYmICFWZWxvY2l0eS5TdGF0ZS5pc0dpbmdlcmJyZWFkKTtcblxuXHQgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgUGFydCBJSTogUXVldWVpbmdcblx0ICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgLyogV2hlbiBhIHNldCBvZiBlbGVtZW50cyBpcyB0YXJnZXRlZCBieSBhIFZlbG9jaXR5IGNhbGwsIHRoZSBzZXQgaXMgYnJva2VuIHVwIGFuZCBlYWNoIGVsZW1lbnQgaGFzIHRoZSBjdXJyZW50IFZlbG9jaXR5IGNhbGwgaW5kaXZpZHVhbGx5IHF1ZXVlZCBvbnRvIGl0LlxuXHQgICAgICAgICAgICAgICBJbiB0aGlzIHdheSwgZWFjaCBlbGVtZW50J3MgZXhpc3RpbmcgcXVldWUgaXMgcmVzcGVjdGVkOyBzb21lIGVsZW1lbnRzIG1heSBhbHJlYWR5IGJlIGFuaW1hdGluZyBhbmQgYWNjb3JkaW5nbHkgc2hvdWxkIG5vdCBoYXZlIHRoaXMgY3VycmVudCBWZWxvY2l0eSBjYWxsIHRyaWdnZXJlZCBpbW1lZGlhdGVseS4gKi9cblx0ICAgICAgICAgICAgLyogSW4gZWFjaCBxdWV1ZSwgdHdlZW4gZGF0YSBpcyBwcm9jZXNzZWQgZm9yIGVhY2ggYW5pbWF0aW5nIHByb3BlcnR5IHRoZW4gcHVzaGVkIG9udG8gdGhlIGNhbGwtd2lkZSBjYWxscyBhcnJheS4gV2hlbiB0aGUgbGFzdCBlbGVtZW50IGluIHRoZSBzZXQgaGFzIGhhZCBpdHMgdHdlZW5zIHByb2Nlc3NlZCxcblx0ICAgICAgICAgICAgICAgdGhlIGNhbGwgYXJyYXkgaXMgcHVzaGVkIHRvIFZlbG9jaXR5LlN0YXRlLmNhbGxzIGZvciBsaXZlIHByb2Nlc3NpbmcgYnkgdGhlIHJlcXVlc3RBbmltYXRpb25GcmFtZSB0aWNrLiAqL1xuXHQgICAgICAgICAgICBmdW5jdGlvbiBidWlsZFF1ZXVlIChuZXh0KSB7XG5cblx0ICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICBPcHRpb246IEJlZ2luXG5cdCAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAvKiBUaGUgYmVnaW4gY2FsbGJhY2sgaXMgZmlyZWQgb25jZSBwZXIgY2FsbCAtLSBub3Qgb25jZSBwZXIgZWxlbWVuZXQgLS0gYW5kIGlzIHBhc3NlZCB0aGUgZnVsbCByYXcgRE9NIGVsZW1lbnQgc2V0IGFzIGJvdGggaXRzIGNvbnRleHQgYW5kIGl0cyBmaXJzdCBhcmd1bWVudC4gKi9cblx0ICAgICAgICAgICAgICAgIGlmIChvcHRzLmJlZ2luICYmIGVsZW1lbnRzSW5kZXggPT09IDApIHtcblx0ICAgICAgICAgICAgICAgICAgICAvKiBXZSB0aHJvdyBjYWxsYmFja3MgaW4gYSBzZXRUaW1lb3V0IHNvIHRoYXQgdGhyb3duIGVycm9ycyBkb24ndCBoYWx0IHRoZSBleGVjdXRpb24gb2YgVmVsb2NpdHkgaXRzZWxmLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIG9wdHMuYmVnaW4uY2FsbChlbGVtZW50cywgZWxlbWVudHMpO1xuXHQgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IHRocm93IGVycm9yOyB9LCAxKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgVHdlZW4gRGF0YSBDb25zdHJ1Y3Rpb24gKGZvciBTY3JvbGwpXG5cdCAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgLyogTm90ZTogSW4gb3JkZXIgdG8gYmUgc3ViamVjdGVkIHRvIGNoYWluaW5nIGFuZCBhbmltYXRpb24gb3B0aW9ucywgc2Nyb2xsJ3MgdHdlZW5pbmcgaXMgcm91dGVkIHRocm91Z2ggVmVsb2NpdHkgYXMgaWYgaXQgd2VyZSBhIHN0YW5kYXJkIENTUyBwcm9wZXJ0eSBhbmltYXRpb24uICovXG5cdCAgICAgICAgICAgICAgICBpZiAoYWN0aW9uID09PSBcInNjcm9sbFwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogVGhlIHNjcm9sbCBhY3Rpb24gdW5pcXVlbHkgdGFrZXMgYW4gb3B0aW9uYWwgXCJvZmZzZXRcIiBvcHRpb24gLS0gc3BlY2lmaWVkIGluIHBpeGVscyAtLSB0aGF0IG9mZnNldHMgdGhlIHRhcmdldGVkIHNjcm9sbCBwb3NpdGlvbi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICB2YXIgc2Nyb2xsRGlyZWN0aW9uID0gKC9eeCQvaS50ZXN0KG9wdHMuYXhpcykgPyBcIkxlZnRcIiA6IFwiVG9wXCIpLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxPZmZzZXQgPSBwYXJzZUZsb2F0KG9wdHMub2Zmc2V0KSB8fCAwLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxQb3NpdGlvbkN1cnJlbnQsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFBvc2l0aW9uQ3VycmVudEFsdGVybmF0ZSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsUG9zaXRpb25FbmQ7XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBTY3JvbGwgYWxzbyB1bmlxdWVseSB0YWtlcyBhbiBvcHRpb25hbCBcImNvbnRhaW5lclwiIG9wdGlvbiwgd2hpY2ggaW5kaWNhdGVzIHRoZSBwYXJlbnQgZWxlbWVudCB0aGF0IHNob3VsZCBiZSBzY3JvbGxlZCAtLVxuXHQgICAgICAgICAgICAgICAgICAgICAgIGFzIG9wcG9zZWQgdG8gdGhlIGJyb3dzZXIgd2luZG93IGl0c2VsZi4gVGhpcyBpcyB1c2VmdWwgZm9yIHNjcm9sbGluZyB0b3dhcmQgYW4gZWxlbWVudCB0aGF0J3MgaW5zaWRlIGFuIG92ZXJmbG93aW5nIHBhcmVudCBlbGVtZW50LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLmNvbnRhaW5lcikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBFbnN1cmUgdGhhdCBlaXRoZXIgYSBqUXVlcnkgb2JqZWN0IG9yIGEgcmF3IERPTSBlbGVtZW50IHdhcyBwYXNzZWQgaW4uICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChUeXBlLmlzV3JhcHBlZChvcHRzLmNvbnRhaW5lcikgfHwgVHlwZS5pc05vZGUob3B0cy5jb250YWluZXIpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBFeHRyYWN0IHRoZSByYXcgRE9NIGVsZW1lbnQgZnJvbSB0aGUgalF1ZXJ5IHdyYXBwZXIuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRzLmNvbnRhaW5lciA9IG9wdHMuY29udGFpbmVyWzBdIHx8IG9wdHMuY29udGFpbmVyO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogVW5saWtlIG90aGVyIHByb3BlcnRpZXMgaW4gVmVsb2NpdHksIHRoZSBicm93c2VyJ3Mgc2Nyb2xsIHBvc2l0aW9uIGlzIG5ldmVyIGNhY2hlZCBzaW5jZSBpdCBzbyBmcmVxdWVudGx5IGNoYW5nZXNcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChkdWUgdG8gdGhlIHVzZXIncyBuYXR1cmFsIGludGVyYWN0aW9uIHdpdGggdGhlIHBhZ2UpLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsUG9zaXRpb25DdXJyZW50ID0gb3B0cy5jb250YWluZXJbXCJzY3JvbGxcIiArIHNjcm9sbERpcmVjdGlvbl07IC8qIEdFVCAqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiAkLnBvc2l0aW9uKCkgdmFsdWVzIGFyZSByZWxhdGl2ZSB0byB0aGUgY29udGFpbmVyJ3MgY3VycmVudGx5IHZpZXdhYmxlIGFyZWEgKHdpdGhvdXQgdGFraW5nIGludG8gYWNjb3VudCB0aGUgY29udGFpbmVyJ3MgdHJ1ZSBkaW1lbnNpb25zXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtLSBzYXksIGZvciBleGFtcGxlLCBpZiB0aGUgY29udGFpbmVyIHdhcyBub3Qgb3ZlcmZsb3dpbmcpLiBUaHVzLCB0aGUgc2Nyb2xsIGVuZCB2YWx1ZSBpcyB0aGUgc3VtIG9mIHRoZSBjaGlsZCBlbGVtZW50J3MgcG9zaXRpb24gKmFuZCpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZSBzY3JvbGwgY29udGFpbmVyJ3MgY3VycmVudCBzY3JvbGwgcG9zaXRpb24uICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxQb3NpdGlvbkVuZCA9IChzY3JvbGxQb3NpdGlvbkN1cnJlbnQgKyAkKGVsZW1lbnQpLnBvc2l0aW9uKClbc2Nyb2xsRGlyZWN0aW9uLnRvTG93ZXJDYXNlKCldKSArIHNjcm9sbE9mZnNldDsgLyogR0VUICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIGEgdmFsdWUgb3RoZXIgdGhhbiBhIGpRdWVyeSBvYmplY3Qgb3IgYSByYXcgRE9NIGVsZW1lbnQgd2FzIHBhc3NlZCBpbiwgZGVmYXVsdCB0byBudWxsIHNvIHRoYXQgdGhpcyBvcHRpb24gaXMgaWdub3JlZC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdHMuY29udGFpbmVyID0gbnVsbDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSB3aW5kb3cgaXRzZWxmIGlzIGJlaW5nIHNjcm9sbGVkIC0tIG5vdCBhIGNvbnRhaW5pbmcgZWxlbWVudCAtLSBwZXJmb3JtIGEgbGl2ZSBzY3JvbGwgcG9zaXRpb24gbG9va3VwIHVzaW5nXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZSBhcHByb3ByaWF0ZSBjYWNoZWQgcHJvcGVydHkgbmFtZXMgKHdoaWNoIGRpZmZlciBiYXNlZCBvbiBicm93c2VyIHR5cGUpLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxQb3NpdGlvbkN1cnJlbnQgPSBWZWxvY2l0eS5TdGF0ZS5zY3JvbGxBbmNob3JbVmVsb2NpdHkuU3RhdGVbXCJzY3JvbGxQcm9wZXJ0eVwiICsgc2Nyb2xsRGlyZWN0aW9uXV07IC8qIEdFVCAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBXaGVuIHNjcm9sbGluZyB0aGUgYnJvd3NlciB3aW5kb3csIGNhY2hlIHRoZSBhbHRlcm5hdGUgYXhpcydzIGN1cnJlbnQgdmFsdWUgc2luY2Ugd2luZG93LnNjcm9sbFRvKCkgZG9lc24ndCBsZXQgdXMgY2hhbmdlIG9ubHkgb25lIHZhbHVlIGF0IGEgdGltZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsUG9zaXRpb25DdXJyZW50QWx0ZXJuYXRlID0gVmVsb2NpdHkuU3RhdGUuc2Nyb2xsQW5jaG9yW1ZlbG9jaXR5LlN0YXRlW1wic2Nyb2xsUHJvcGVydHlcIiArIChzY3JvbGxEaXJlY3Rpb24gPT09IFwiTGVmdFwiID8gXCJUb3BcIiA6IFwiTGVmdFwiKV1dOyAvKiBHRVQgKi9cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBVbmxpa2UgJC5wb3NpdGlvbigpLCAkLm9mZnNldCgpIHZhbHVlcyBhcmUgcmVsYXRpdmUgdG8gdGhlIGJyb3dzZXIgd2luZG93J3MgdHJ1ZSBkaW1lbnNpb25zIC0tIG5vdCBtZXJlbHkgaXRzIGN1cnJlbnRseSB2aWV3YWJsZSBhcmVhIC0tXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZCB0aGVyZWZvcmUgZW5kIHZhbHVlcyBkbyBub3QgbmVlZCB0byBiZSBjb21wb3VuZGVkIG9udG8gY3VycmVudCB2YWx1ZXMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFBvc2l0aW9uRW5kID0gJChlbGVtZW50KS5vZmZzZXQoKVtzY3JvbGxEaXJlY3Rpb24udG9Mb3dlckNhc2UoKV0gKyBzY3JvbGxPZmZzZXQ7IC8qIEdFVCAqL1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIFNpbmNlIHRoZXJlJ3Mgb25seSBvbmUgZm9ybWF0IHRoYXQgc2Nyb2xsJ3MgYXNzb2NpYXRlZCB0d2VlbnNDb250YWluZXIgY2FuIHRha2UsIHdlIGNyZWF0ZSBpdCBtYW51YWxseS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICB0d2VlbnNDb250YWluZXIgPSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbDoge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWU6IGZhbHNlLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZTogc2Nyb2xsUG9zaXRpb25DdXJyZW50LFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFZhbHVlOiBzY3JvbGxQb3NpdGlvbkN1cnJlbnQsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZTogc2Nyb2xsUG9zaXRpb25FbmQsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0VHlwZTogXCJcIixcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVhc2luZzogb3B0cy5lYXNpbmcsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxEYXRhOiB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyOiBvcHRzLmNvbnRhaW5lcixcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246IHNjcm9sbERpcmVjdGlvbixcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbHRlcm5hdGVWYWx1ZTogc2Nyb2xsUG9zaXRpb25DdXJyZW50QWx0ZXJuYXRlXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH0sXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6IGVsZW1lbnRcblx0ICAgICAgICAgICAgICAgICAgICB9O1xuXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKFZlbG9jaXR5LmRlYnVnKSBjb25zb2xlLmxvZyhcInR3ZWVuc0NvbnRhaW5lciAoc2Nyb2xsKTogXCIsIHR3ZWVuc0NvbnRhaW5lci5zY3JvbGwsIGVsZW1lbnQpO1xuXG5cdCAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICBUd2VlbiBEYXRhIENvbnN0cnVjdGlvbiAoZm9yIFJldmVyc2UpXG5cdCAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgIC8qIFJldmVyc2UgYWN0cyBsaWtlIGEgXCJzdGFydFwiIGFjdGlvbiBpbiB0aGF0IGEgcHJvcGVydHkgbWFwIGlzIGFuaW1hdGVkIHRvd2FyZC4gVGhlIG9ubHkgZGlmZmVyZW5jZSBpc1xuXHQgICAgICAgICAgICAgICAgICAgdGhhdCB0aGUgcHJvcGVydHkgbWFwIHVzZWQgZm9yIHJldmVyc2UgaXMgdGhlIGludmVyc2Ugb2YgdGhlIG1hcCB1c2VkIGluIHRoZSBwcmV2aW91cyBjYWxsLiBUaHVzLCB3ZSBtYW5pcHVsYXRlXG5cdCAgICAgICAgICAgICAgICAgICB0aGUgcHJldmlvdXMgY2FsbCB0byBjb25zdHJ1Y3Qgb3VyIG5ldyBtYXA6IHVzZSB0aGUgcHJldmlvdXMgbWFwJ3MgZW5kIHZhbHVlcyBhcyBvdXIgbmV3IG1hcCdzIHN0YXJ0IHZhbHVlcy4gQ29weSBvdmVyIGFsbCBvdGhlciBkYXRhLiAqL1xuXHQgICAgICAgICAgICAgICAgLyogTm90ZTogUmV2ZXJzZSBjYW4gYmUgZGlyZWN0bHkgY2FsbGVkIHZpYSB0aGUgXCJyZXZlcnNlXCIgcGFyYW1ldGVyLCBvciBpdCBjYW4gYmUgaW5kaXJlY3RseSB0cmlnZ2VyZWQgdmlhIHRoZSBsb29wIG9wdGlvbi4gKExvb3BzIGFyZSBjb21wb3NlZCBvZiBtdWx0aXBsZSByZXZlcnNlcy4pICovXG5cdCAgICAgICAgICAgICAgICAvKiBOb3RlOiBSZXZlcnNlIGNhbGxzIGRvIG5vdCBuZWVkIHRvIGJlIGNvbnNlY3V0aXZlbHkgY2hhaW5lZCBvbnRvIGEgY3VycmVudGx5LWFuaW1hdGluZyBlbGVtZW50IGluIG9yZGVyIHRvIG9wZXJhdGUgb24gY2FjaGVkIHZhbHVlcztcblx0ICAgICAgICAgICAgICAgICAgIHRoZXJlIGlzIG5vIGhhcm0gdG8gcmV2ZXJzZSBiZWluZyBjYWxsZWQgb24gYSBwb3RlbnRpYWxseSBzdGFsZSBkYXRhIGNhY2hlIHNpbmNlIHJldmVyc2UncyBiZWhhdmlvciBpcyBzaW1wbHkgZGVmaW5lZFxuXHQgICAgICAgICAgICAgICAgICAgYXMgcmV2ZXJ0aW5nIHRvIHRoZSBlbGVtZW50J3MgdmFsdWVzIGFzIHRoZXkgd2VyZSBwcmlvciB0byB0aGUgcHJldmlvdXMgKlZlbG9jaXR5KiBjYWxsLiAqL1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFwicmV2ZXJzZVwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogQWJvcnQgaWYgdGhlcmUgaXMgbm8gcHJpb3IgYW5pbWF0aW9uIGRhdGEgdG8gcmV2ZXJzZSB0by4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoIURhdGEoZWxlbWVudCkudHdlZW5zQ29udGFpbmVyKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIERlcXVldWUgdGhlIGVsZW1lbnQgc28gdGhhdCB0aGlzIHF1ZXVlIGVudHJ5IHJlbGVhc2VzIGl0c2VsZiBpbW1lZGlhdGVseSwgYWxsb3dpbmcgc3Vic2VxdWVudCBxdWV1ZSBlbnRyaWVzIHRvIHJ1bi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgJC5kZXF1ZXVlKGVsZW1lbnQsIG9wdHMucXVldWUpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcblx0ICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIE9wdGlvbnMgUGFyc2luZ1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGVsZW1lbnQgd2FzIGhpZGRlbiB2aWEgdGhlIGRpc3BsYXkgb3B0aW9uIGluIHRoZSBwcmV2aW91cyBjYWxsLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICByZXZlcnQgZGlzcGxheSB0byBcImF1dG9cIiBwcmlvciB0byByZXZlcnNhbCBzbyB0aGF0IHRoZSBlbGVtZW50IGlzIHZpc2libGUgYWdhaW4uICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpLm9wdHMuZGlzcGxheSA9PT0gXCJub25lXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkub3B0cy5kaXNwbGF5ID0gXCJhdXRvXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoRGF0YShlbGVtZW50KS5vcHRzLnZpc2liaWxpdHkgPT09IFwiaGlkZGVuXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkub3B0cy52aXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgbG9vcCBvcHRpb24gd2FzIHNldCBpbiB0aGUgcHJldmlvdXMgY2FsbCwgZGlzYWJsZSBpdCBzbyB0aGF0IFwicmV2ZXJzZVwiIGNhbGxzIGFyZW4ndCByZWN1cnNpdmVseSBnZW5lcmF0ZWQuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIEZ1cnRoZXIsIHJlbW92ZSB0aGUgcHJldmlvdXMgY2FsbCdzIGNhbGxiYWNrIG9wdGlvbnM7IHR5cGljYWxseSwgdXNlcnMgZG8gbm90IHdhbnQgdGhlc2UgdG8gYmUgcmVmaXJlZC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5vcHRzLmxvb3AgPSBmYWxzZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5vcHRzLmJlZ2luID0gbnVsbDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5vcHRzLmNvbXBsZXRlID0gbnVsbDtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBTaW5jZSB3ZSdyZSBleHRlbmRpbmcgYW4gb3B0cyBvYmplY3QgdGhhdCBoYXMgYWxyZWFkeSBiZWVuIGV4dGVuZGVkIHdpdGggdGhlIGRlZmF1bHRzIG9wdGlvbnMgb2JqZWN0LFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICB3ZSByZW1vdmUgbm9uLWV4cGxpY2l0bHktZGVmaW5lZCBwcm9wZXJ0aWVzIHRoYXQgYXJlIGF1dG8tYXNzaWduZWQgdmFsdWVzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMuZWFzaW5nKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgb3B0cy5lYXNpbmc7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMuZHVyYXRpb24pIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBvcHRzLmR1cmF0aW9uO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogVGhlIG9wdHMgb2JqZWN0IHVzZWQgZm9yIHJldmVyc2FsIGlzIGFuIGV4dGVuc2lvbiBvZiB0aGUgb3B0aW9ucyBvYmplY3Qgb3B0aW9uYWxseSBwYXNzZWQgaW50byB0aGlzXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldmVyc2UgY2FsbCBwbHVzIHRoZSBvcHRpb25zIHVzZWQgaW4gdGhlIHByZXZpb3VzIFZlbG9jaXR5IGNhbGwuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIG9wdHMgPSAkLmV4dGVuZCh7fSwgRGF0YShlbGVtZW50KS5vcHRzLCBvcHRzKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBUd2VlbnMgQ29udGFpbmVyIFJlY29uc3RydWN0aW9uXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogQ3JlYXRlIGEgZGVlcHkgY29weSAoaW5kaWNhdGVkIHZpYSB0aGUgdHJ1ZSBmbGFnKSBvZiB0aGUgcHJldmlvdXMgY2FsbCdzIHR3ZWVuc0NvbnRhaW5lci4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3RUd2VlbnNDb250YWluZXIgPSAkLmV4dGVuZCh0cnVlLCB7fSwgRGF0YShlbGVtZW50KS50d2VlbnNDb250YWluZXIpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIE1hbmlwdWxhdGUgdGhlIHByZXZpb3VzIHR3ZWVuc0NvbnRhaW5lciBieSByZXBsYWNpbmcgaXRzIGVuZCB2YWx1ZXMgYW5kIGN1cnJlbnRWYWx1ZXMgd2l0aCBpdHMgc3RhcnQgdmFsdWVzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBsYXN0VHdlZW4gaW4gbGFzdFR3ZWVuc0NvbnRhaW5lcikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSW4gYWRkaXRpb24gdG8gdHdlZW4gZGF0YSwgdHdlZW5zQ29udGFpbmVycyBjb250YWluIGFuIGVsZW1lbnQgcHJvcGVydHkgdGhhdCB3ZSBpZ25vcmUgaGVyZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYXN0VHdlZW4gIT09IFwiZWxlbWVudFwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3RTdGFydFZhbHVlID0gbGFzdFR3ZWVuc0NvbnRhaW5lcltsYXN0VHdlZW5dLnN0YXJ0VmFsdWU7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0VHdlZW5zQ29udGFpbmVyW2xhc3RUd2Vlbl0uc3RhcnRWYWx1ZSA9IGxhc3RUd2VlbnNDb250YWluZXJbbGFzdFR3ZWVuXS5jdXJyZW50VmFsdWUgPSBsYXN0VHdlZW5zQ29udGFpbmVyW2xhc3RUd2Vlbl0uZW5kVmFsdWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFR3ZWVuc0NvbnRhaW5lcltsYXN0VHdlZW5dLmVuZFZhbHVlID0gbGFzdFN0YXJ0VmFsdWU7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBFYXNpbmcgaXMgdGhlIG9ubHkgb3B0aW9uIHRoYXQgZW1iZWRzIGludG8gdGhlIGluZGl2aWR1YWwgdHdlZW4gZGF0YSAoc2luY2UgaXQgY2FuIGJlIGRlZmluZWQgb24gYSBwZXItcHJvcGVydHkgYmFzaXMpLlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFjY29yZGluZ2x5LCBldmVyeSBwcm9wZXJ0eSdzIGVhc2luZyB2YWx1ZSBtdXN0IGJlIHVwZGF0ZWQgd2hlbiBhbiBvcHRpb25zIG9iamVjdCBpcyBwYXNzZWQgaW4gd2l0aCBhIHJldmVyc2UgY2FsbC5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUaGUgc2lkZSBlZmZlY3Qgb2YgdGhpcyBleHRlbnNpYmlsaXR5IGlzIHRoYXQgYWxsIHBlci1wcm9wZXJ0eSBlYXNpbmcgdmFsdWVzIGFyZSBmb3JjZWZ1bGx5IHJlc2V0IHRvIHRoZSBuZXcgdmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFUeXBlLmlzRW1wdHlPYmplY3Qob3B0aW9ucykpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdFR3ZWVuc0NvbnRhaW5lcltsYXN0VHdlZW5dLmVhc2luZyA9IG9wdHMuZWFzaW5nO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChWZWxvY2l0eS5kZWJ1ZykgY29uc29sZS5sb2coXCJyZXZlcnNlIHR3ZWVuc0NvbnRhaW5lciAoXCIgKyBsYXN0VHdlZW4gKyBcIik6IFwiICsgSlNPTi5zdHJpbmdpZnkobGFzdFR3ZWVuc0NvbnRhaW5lcltsYXN0VHdlZW5dKSwgZWxlbWVudCk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICB0d2VlbnNDb250YWluZXIgPSBsYXN0VHdlZW5zQ29udGFpbmVyO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICBUd2VlbiBEYXRhIENvbnN0cnVjdGlvbiAoZm9yIFN0YXJ0KVxuXHQgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uID09PSBcInN0YXJ0XCIpIHtcblxuXHQgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIFZhbHVlIFRyYW5zZmVycmluZ1xuXHQgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGlzIHF1ZXVlIGVudHJ5IGZvbGxvd3MgYSBwcmV2aW91cyBWZWxvY2l0eS1pbml0aWF0ZWQgcXVldWUgZW50cnkgKmFuZCogaWYgdGhpcyBlbnRyeSB3YXMgY3JlYXRlZFxuXHQgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIHRoZSBlbGVtZW50IHdhcyBpbiB0aGUgcHJvY2VzcyBvZiBiZWluZyBhbmltYXRlZCBieSBWZWxvY2l0eSwgdGhlbiB0aGlzIGN1cnJlbnQgY2FsbCBpcyBzYWZlIHRvIHVzZVxuXHQgICAgICAgICAgICAgICAgICAgICAgIHRoZSBlbmQgdmFsdWVzIGZyb20gdGhlIHByaW9yIGNhbGwgYXMgaXRzIHN0YXJ0IHZhbHVlcy4gVmVsb2NpdHkgYXR0ZW1wdHMgdG8gcGVyZm9ybSB0aGlzIHZhbHVlIHRyYW5zZmVyXG5cdCAgICAgICAgICAgICAgICAgICAgICAgcHJvY2VzcyB3aGVuZXZlciBwb3NzaWJsZSBpbiBvcmRlciB0byBhdm9pZCByZXF1ZXJ5aW5nIHRoZSBET00uICovXG5cdCAgICAgICAgICAgICAgICAgICAgLyogSWYgdmFsdWVzIGFyZW4ndCB0cmFuc2ZlcnJlZCBmcm9tIGEgcHJpb3IgY2FsbCBhbmQgc3RhcnQgdmFsdWVzIHdlcmUgbm90IGZvcmNlZmVkIGJ5IHRoZSB1c2VyIChtb3JlIG9uIHRoaXMgYmVsb3cpLFxuXHQgICAgICAgICAgICAgICAgICAgICAgIHRoZW4gdGhlIERPTSBpcyBxdWVyaWVkIGZvciB0aGUgZWxlbWVudCdzIGN1cnJlbnQgdmFsdWVzIGFzIGEgbGFzdCByZXNvcnQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogQ29udmVyc2VseSwgYW5pbWF0aW9uIHJldmVyc2FsIChhbmQgbG9vcGluZykgKmFsd2F5cyogcGVyZm9ybSBpbnRlci1jYWxsIHZhbHVlIHRyYW5zZmVyczsgdGhleSBuZXZlciByZXF1ZXJ5IHRoZSBET00uICovXG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3RUd2VlbnNDb250YWluZXI7XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBUaGUgcGVyLWVsZW1lbnQgaXNBbmltYXRpbmcgZmxhZyBpcyB1c2VkIHRvIGluZGljYXRlIHdoZXRoZXIgaXQncyBzYWZlIChpLmUuIHRoZSBkYXRhIGlzbid0IHN0YWxlKVxuXHQgICAgICAgICAgICAgICAgICAgICAgIHRvIHRyYW5zZmVyIG92ZXIgZW5kIHZhbHVlcyB0byB1c2UgYXMgc3RhcnQgdmFsdWVzLiBJZiBpdCdzIHNldCB0byB0cnVlIGFuZCB0aGVyZSBpcyBhIHByZXZpb3VzXG5cdCAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkgY2FsbCB0byBwdWxsIHZhbHVlcyBmcm9tLCBkbyBzby4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoRGF0YShlbGVtZW50KS50d2VlbnNDb250YWluZXIgJiYgRGF0YShlbGVtZW50KS5pc0FuaW1hdGluZyA9PT0gdHJ1ZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBsYXN0VHdlZW5zQ29udGFpbmVyID0gRGF0YShlbGVtZW50KS50d2VlbnNDb250YWluZXI7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgICAgIFR3ZWVuIERhdGEgQ2FsY3VsYXRpb25cblx0ICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBUaGlzIGZ1bmN0aW9uIHBhcnNlcyBwcm9wZXJ0eSBkYXRhIGFuZCBkZWZhdWx0cyBlbmRWYWx1ZSwgZWFzaW5nLCBhbmQgc3RhcnRWYWx1ZSBhcyBhcHByb3ByaWF0ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAvKiBQcm9wZXJ0eSBtYXAgdmFsdWVzIGNhbiBlaXRoZXIgdGFrZSB0aGUgZm9ybSBvZiAxKSBhIHNpbmdsZSB2YWx1ZSByZXByZXNlbnRpbmcgdGhlIGVuZCB2YWx1ZSxcblx0ICAgICAgICAgICAgICAgICAgICAgICBvciAyKSBhbiBhcnJheSBpbiB0aGUgZm9ybSBvZiBbIGVuZFZhbHVlLCBbLCBlYXNpbmddIFssIHN0YXJ0VmFsdWVdIF0uXG5cdCAgICAgICAgICAgICAgICAgICAgICAgVGhlIG9wdGlvbmFsIHRoaXJkIHBhcmFtZXRlciBpcyBhIGZvcmNlZmVkIHN0YXJ0VmFsdWUgdG8gYmUgdXNlZCBpbnN0ZWFkIG9mIHF1ZXJ5aW5nIHRoZSBET00gZm9yXG5cdCAgICAgICAgICAgICAgICAgICAgICAgdGhlIGVsZW1lbnQncyBjdXJyZW50IHZhbHVlLiBSZWFkIFZlbG9jaXR5J3MgZG9jbWVudGF0aW9uIHRvIGxlYXJuIG1vcmUgYWJvdXQgZm9yY2VmZWVkaW5nOiBWZWxvY2l0eUpTLm9yZy8jZm9yY2VmZWVkaW5nICovXG5cdCAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gcGFyc2VQcm9wZXJ0eVZhbHVlICh2YWx1ZURhdGEsIHNraXBSZXNvbHZpbmdFYXNpbmcpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVuZFZhbHVlID0gdW5kZWZpbmVkLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWFzaW5nID0gdW5kZWZpbmVkLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IHVuZGVmaW5lZDtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBIYW5kbGUgdGhlIGFycmF5IGZvcm1hdCwgd2hpY2ggY2FuIGJlIHN0cnVjdHVyZWQgYXMgb25lIG9mIHRocmVlIHBvdGVudGlhbCBvdmVybG9hZHM6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIEEpIFsgZW5kVmFsdWUsIGVhc2luZywgc3RhcnRWYWx1ZSBdLCBCKSBbIGVuZFZhbHVlLCBlYXNpbmcgXSwgb3IgQykgWyBlbmRWYWx1ZSwgc3RhcnRWYWx1ZSBdICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChUeXBlLmlzQXJyYXkodmFsdWVEYXRhKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogZW5kVmFsdWUgaXMgYWx3YXlzIHRoZSBmaXJzdCBpdGVtIGluIHRoZSBhcnJheS4gRG9uJ3QgYm90aGVyIHZhbGlkYXRpbmcgZW5kVmFsdWUncyB2YWx1ZSBub3dcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpbmNlIHRoZSBlbnN1aW5nIHByb3BlcnR5IGN5Y2xpbmcgbG9naWMgZG9lcyB0aGF0LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWUgPSB2YWx1ZURhdGFbMF07XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFR3by1pdGVtIGFycmF5IGZvcm1hdDogSWYgdGhlIHNlY29uZCBpdGVtIGlzIGEgbnVtYmVyLCBmdW5jdGlvbiwgb3IgaGV4IHN0cmluZywgdHJlYXQgaXQgYXMgYVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQgdmFsdWUgc2luY2UgZWFzaW5ncyBjYW4gb25seSBiZSBub24taGV4IHN0cmluZ3Mgb3IgYXJyYXlzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCghVHlwZS5pc0FycmF5KHZhbHVlRGF0YVsxXSkgJiYgL15bXFxkLV0vLnRlc3QodmFsdWVEYXRhWzFdKSkgfHwgVHlwZS5pc0Z1bmN0aW9uKHZhbHVlRGF0YVsxXSkgfHwgQ1NTLlJlZ0V4LmlzSGV4LnRlc3QodmFsdWVEYXRhWzFdKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgPSB2YWx1ZURhdGFbMV07XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBUd28gb3IgdGhyZWUtaXRlbSBhcnJheTogSWYgdGhlIHNlY29uZCBpdGVtIGlzIGEgbm9uLWhleCBzdHJpbmcgb3IgYW4gYXJyYXksIHRyZWF0IGl0IGFzIGFuIGVhc2luZy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoKFR5cGUuaXNTdHJpbmcodmFsdWVEYXRhWzFdKSAmJiAhQ1NTLlJlZ0V4LmlzSGV4LnRlc3QodmFsdWVEYXRhWzFdKSkgfHwgVHlwZS5pc0FycmF5KHZhbHVlRGF0YVsxXSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlYXNpbmcgPSBza2lwUmVzb2x2aW5nRWFzaW5nID8gdmFsdWVEYXRhWzFdIDogZ2V0RWFzaW5nKHZhbHVlRGF0YVsxXSwgb3B0cy5kdXJhdGlvbik7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBEb24ndCBib3RoZXIgdmFsaWRhdGluZyBzdGFydFZhbHVlJ3MgdmFsdWUgbm93IHNpbmNlIHRoZSBlbnN1aW5nIHByb3BlcnR5IGN5Y2xpbmcgbG9naWMgaW5oZXJlbnRseSBkb2VzIHRoYXQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlRGF0YVsyXSAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgPSB2YWx1ZURhdGFbMl07XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBIYW5kbGUgdGhlIHNpbmdsZS12YWx1ZSBmb3JtYXQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IHZhbHVlRGF0YTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIERlZmF1bHQgdG8gdGhlIGNhbGwncyBlYXNpbmcgaWYgYSBwZXItcHJvcGVydHkgZWFzaW5nIHR5cGUgd2FzIG5vdCBkZWZpbmVkLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXNraXBSZXNvbHZpbmdFYXNpbmcpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVhc2luZyA9IGVhc2luZyB8fCBvcHRzLmVhc2luZztcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIGZ1bmN0aW9ucyB3ZXJlIHBhc3NlZCBpbiBhcyB2YWx1ZXMsIHBhc3MgdGhlIGZ1bmN0aW9uIHRoZSBjdXJyZW50IGVsZW1lbnQgYXMgaXRzIGNvbnRleHQsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsdXMgdGhlIGVsZW1lbnQncyBpbmRleCBhbmQgdGhlIGVsZW1lbnQgc2V0J3Mgc2l6ZSBhcyBhcmd1bWVudHMuIFRoZW4sIGFzc2lnbiB0aGUgcmV0dXJuZWQgdmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChUeXBlLmlzRnVuY3Rpb24oZW5kVmFsdWUpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IGVuZFZhbHVlLmNhbGwoZWxlbWVudCwgZWxlbWVudHNJbmRleCwgZWxlbWVudHNMZW5ndGgpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFR5cGUuaXNGdW5jdGlvbihzdGFydFZhbHVlKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IHN0YXJ0VmFsdWUuY2FsbChlbGVtZW50LCBlbGVtZW50c0luZGV4LCBlbGVtZW50c0xlbmd0aCk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBBbGxvdyBzdGFydFZhbHVlIHRvIGJlIGxlZnQgYXMgdW5kZWZpbmVkIHRvIGluZGljYXRlIHRvIHRoZSBlbnN1aW5nIGNvZGUgdGhhdCBpdHMgdmFsdWUgd2FzIG5vdCBmb3JjZWZlZC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsgZW5kVmFsdWUgfHwgMCwgZWFzaW5nLCBzdGFydFZhbHVlIF07XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogQ3ljbGUgdGhyb3VnaCBlYWNoIHByb3BlcnR5IGluIHRoZSBtYXAsIGxvb2tpbmcgZm9yIHNob3J0aGFuZCBjb2xvciBwcm9wZXJ0aWVzIChlLmcuIFwiY29sb3JcIiBhcyBvcHBvc2VkIHRvIFwiY29sb3JSZWRcIikuIEluamVjdCB0aGUgY29ycmVzcG9uZGluZ1xuXHQgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yUmVkLCBjb2xvckdyZWVuLCBhbmQgY29sb3JCbHVlIFJHQiBjb21wb25lbnQgdHdlZW5zIGludG8gdGhlIHByb3BlcnRpZXNNYXAgKHdoaWNoIFZlbG9jaXR5IHVuZGVyc3RhbmRzKSBhbmQgcmVtb3ZlIHRoZSBzaG9ydGhhbmQgcHJvcGVydHkuICovXG5cdCAgICAgICAgICAgICAgICAgICAgJC5lYWNoKHByb3BlcnRpZXNNYXAsIGZ1bmN0aW9uKHByb3BlcnR5LCB2YWx1ZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBGaW5kIHNob3J0aGFuZCBjb2xvciBwcm9wZXJ0aWVzIHRoYXQgaGF2ZSBiZWVuIHBhc3NlZCBhIGhleCBzdHJpbmcuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChSZWdFeHAoXCJeXCIgKyBDU1MuTGlzdHMuY29sb3JzLmpvaW4oXCIkfF5cIikgKyBcIiRcIikudGVzdChwcm9wZXJ0eSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFBhcnNlIHRoZSB2YWx1ZSBkYXRhIGZvciBlYWNoIHNob3J0aGFuZC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZURhdGEgPSBwYXJzZVByb3BlcnR5VmFsdWUodmFsdWUsIHRydWUpLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gdmFsdWVEYXRhWzBdLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVhc2luZyA9IHZhbHVlRGF0YVsxXSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gdmFsdWVEYXRhWzJdO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ1NTLlJlZ0V4LmlzSGV4LnRlc3QoZW5kVmFsdWUpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQ29udmVydCB0aGUgaGV4IHN0cmluZ3MgaW50byB0aGVpciBSR0IgY29tcG9uZW50IGFycmF5cy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29sb3JDb21wb25lbnRzID0gWyBcIlJlZFwiLCBcIkdyZWVuXCIsIFwiQmx1ZVwiIF0sXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlUkdCID0gQ1NTLlZhbHVlcy5oZXhUb1JnYihlbmRWYWx1ZSksXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWVSR0IgPSBzdGFydFZhbHVlID8gQ1NTLlZhbHVlcy5oZXhUb1JnYihzdGFydFZhbHVlKSA6IHVuZGVmaW5lZDtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEluamVjdCB0aGUgUkdCIGNvbXBvbmVudCB0d2VlbnMgaW50byBwcm9wZXJ0aWVzTWFwLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29sb3JDb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkYXRhQXJyYXkgPSBbIGVuZFZhbHVlUkdCW2ldIF07XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVhc2luZykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YUFycmF5LnB1c2goZWFzaW5nKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGFydFZhbHVlUkdCICE9PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFBcnJheS5wdXNoKHN0YXJ0VmFsdWVSR0JbaV0pO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllc01hcFtwcm9wZXJ0eSArIGNvbG9yQ29tcG9uZW50c1tpXV0gPSBkYXRhQXJyYXk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogUmVtb3ZlIHRoZSBpbnRlcm1lZGlhcnkgc2hvcnRoYW5kIHByb3BlcnR5IGVudHJ5IG5vdyB0aGF0IHdlJ3ZlIHByb2Nlc3NlZCBpdC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgcHJvcGVydGllc01hcFtwcm9wZXJ0eV07XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICB9KTtcblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIENyZWF0ZSBhIHR3ZWVuIG91dCBvZiBlYWNoIHByb3BlcnR5LCBhbmQgYXBwZW5kIGl0cyBhc3NvY2lhdGVkIGRhdGEgdG8gdHdlZW5zQ29udGFpbmVyLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BlcnR5IGluIHByb3BlcnRpZXNNYXApIHtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgU3RhcnQgVmFsdWUgU291cmNpbmdcblx0ICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogUGFyc2Ugb3V0IGVuZFZhbHVlLCBlYXNpbmcsIGFuZCBzdGFydFZhbHVlIGZyb20gdGhlIHByb3BlcnR5J3MgZGF0YS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlRGF0YSA9IHBhcnNlUHJvcGVydHlWYWx1ZShwcm9wZXJ0aWVzTWFwW3Byb3BlcnR5XSksXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IHZhbHVlRGF0YVswXSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVhc2luZyA9IHZhbHVlRGF0YVsxXSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgPSB2YWx1ZURhdGFbMl07XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogTm93IHRoYXQgdGhlIG9yaWdpbmFsIHByb3BlcnR5IG5hbWUncyBmb3JtYXQgaGFzIGJlZW4gdXNlZCBmb3IgdGhlIHBhcnNlUHJvcGVydHlWYWx1ZSgpIGxvb2t1cCBhYm92ZSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgd2UgZm9yY2UgdGhlIHByb3BlcnR5IHRvIGl0cyBjYW1lbENhc2Ugc3R5bGluZyB0byBub3JtYWxpemUgaXQgZm9yIG1hbmlwdWxhdGlvbi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHkgPSBDU1MuTmFtZXMuY2FtZWxDYXNlKHByb3BlcnR5KTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBJbiBjYXNlIHRoaXMgcHJvcGVydHkgaXMgYSBob29rLCB0aGVyZSBhcmUgY2lyY3Vtc3RhbmNlcyB3aGVyZSB3ZSB3aWxsIGludGVuZCB0byB3b3JrIG9uIHRoZSBob29rJ3Mgcm9vdCBwcm9wZXJ0eSBhbmQgbm90IHRoZSBob29rZWQgc3VicHJvcGVydHkuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHZhciByb290UHJvcGVydHkgPSBDU1MuSG9va3MuZ2V0Um9vdChwcm9wZXJ0eSksXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZSA9IGZhbHNlO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIE90aGVyIHRoYW4gZm9yIHRoZSBkdW1teSB0d2VlbiBwcm9wZXJ0eSwgcHJvcGVydGllcyB0aGF0IGFyZSBub3Qgc3VwcG9ydGVkIGJ5IHRoZSBicm93c2VyIChhbmQgZG8gbm90IGhhdmUgYW4gYXNzb2NpYXRlZCBub3JtYWxpemF0aW9uKSB3aWxsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIGluaGVyZW50bHkgcHJvZHVjZSBubyBzdHlsZSBjaGFuZ2VzIHdoZW4gc2V0LCBzbyB0aGV5IGFyZSBza2lwcGVkIGluIG9yZGVyIHRvIGRlY3JlYXNlIGFuaW1hdGlvbiB0aWNrIG92ZXJoZWFkLlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBQcm9wZXJ0eSBzdXBwb3J0IGlzIGRldGVybWluZWQgdmlhIHByZWZpeENoZWNrKCksIHdoaWNoIHJldHVybnMgYSBmYWxzZSBmbGFnIHdoZW4gbm8gc3VwcG9ydGVkIGlzIGRldGVjdGVkLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBTaW5jZSBTVkcgZWxlbWVudHMgaGF2ZSBzb21lIG9mIHRoZWlyIHByb3BlcnRpZXMgZGlyZWN0bHkgYXBwbGllZCBhcyBIVE1MIGF0dHJpYnV0ZXMsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZXJlIGlzIG5vIHdheSB0byBjaGVjayBmb3IgdGhlaXIgZXhwbGljaXQgYnJvd3NlciBzdXBwb3J0LCBhbmQgc28gd2Ugc2tpcCBza2lwIHRoaXMgY2hlY2sgZm9yIHRoZW0uICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmICghRGF0YShlbGVtZW50KS5pc1NWRyAmJiByb290UHJvcGVydHkgIT09IFwidHdlZW5cIiAmJiBDU1MuTmFtZXMucHJlZml4Q2hlY2socm9vdFByb3BlcnR5KVsxXSA9PT0gZmFsc2UgJiYgQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbcm9vdFByb3BlcnR5XSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoVmVsb2NpdHkuZGVidWcpIGNvbnNvbGUubG9nKFwiU2tpcHBpbmcgW1wiICsgcm9vdFByb3BlcnR5ICsgXCJdIGR1ZSB0byBhIGxhY2sgb2YgYnJvd3NlciBzdXBwb3J0LlwiKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgZGlzcGxheSBvcHRpb24gaXMgYmVpbmcgc2V0IHRvIGEgbm9uLVwibm9uZVwiIChlLmcuIFwiYmxvY2tcIikgYW5kIG9wYWNpdHkgKGZpbHRlciBvbiBJRTw9OCkgaXMgYmVpbmdcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0ZWQgdG8gYW4gZW5kVmFsdWUgb2Ygbm9uLXplcm8sIHRoZSB1c2VyJ3MgaW50ZW50aW9uIGlzIHRvIGZhZGUgaW4gZnJvbSBpbnZpc2libGUsIHRodXMgd2UgZm9yY2VmZWVkIG9wYWNpdHlcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgYSBzdGFydFZhbHVlIG9mIDAgaWYgaXRzIHN0YXJ0VmFsdWUgaGFzbid0IGFscmVhZHkgYmVlbiBzb3VyY2VkIGJ5IHZhbHVlIHRyYW5zZmVycmluZyBvciBwcmlvciBmb3JjZWZlZWRpbmcuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoKG9wdHMuZGlzcGxheSAhPT0gdW5kZWZpbmVkICYmIG9wdHMuZGlzcGxheSAhPT0gbnVsbCAmJiBvcHRzLmRpc3BsYXkgIT09IFwibm9uZVwiKSB8fCAob3B0cy52aXNpYmlsaXR5ICE9PSB1bmRlZmluZWQgJiYgb3B0cy52aXNpYmlsaXR5ICE9PSBcImhpZGRlblwiKSkgJiYgL29wYWNpdHl8ZmlsdGVyLy50ZXN0KHByb3BlcnR5KSAmJiAhc3RhcnRWYWx1ZSAmJiBlbmRWYWx1ZSAhPT0gMCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IDA7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB2YWx1ZXMgaGF2ZSBiZWVuIHRyYW5zZmVycmVkIGZyb20gdGhlIHByZXZpb3VzIFZlbG9jaXR5IGNhbGwsIGV4dHJhY3QgdGhlIGVuZFZhbHVlIGFuZCByb290UHJvcGVydHlWYWx1ZVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgYWxsIG9mIHRoZSBjdXJyZW50IGNhbGwncyBwcm9wZXJ0aWVzIHRoYXQgd2VyZSAqYWxzbyogYW5pbWF0ZWQgaW4gdGhlIHByZXZpb3VzIGNhbGwuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFZhbHVlIHRyYW5zZmVycmluZyBjYW4gb3B0aW9uYWxseSBiZSBkaXNhYmxlZCBieSB0aGUgdXNlciB2aWEgdGhlIF9jYWNoZVZhbHVlcyBvcHRpb24uICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLl9jYWNoZVZhbHVlcyAmJiBsYXN0VHdlZW5zQ29udGFpbmVyICYmIGxhc3RUd2VlbnNDb250YWluZXJbcHJvcGVydHldKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RhcnRWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IGxhc3RUd2VlbnNDb250YWluZXJbcHJvcGVydHldLmVuZFZhbHVlICsgbGFzdFR3ZWVuc0NvbnRhaW5lcltwcm9wZXJ0eV0udW5pdFR5cGU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRoZSBwcmV2aW91cyBjYWxsJ3Mgcm9vdFByb3BlcnR5VmFsdWUgaXMgZXh0cmFjdGVkIGZyb20gdGhlIGVsZW1lbnQncyBkYXRhIGNhY2hlIHNpbmNlIHRoYXQncyB0aGVcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc3RhbmNlIG9mIHJvb3RQcm9wZXJ0eVZhbHVlIHRoYXQgZ2V0cyBmcmVzaGx5IHVwZGF0ZWQgYnkgdGhlIHR3ZWVuaW5nIHByb2Nlc3MsIHdoZXJlYXMgdGhlIHJvb3RQcm9wZXJ0eVZhbHVlXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRhY2hlZCB0byB0aGUgaW5jb21pbmcgbGFzdFR3ZWVuc0NvbnRhaW5lciBpcyBlcXVhbCB0byB0aGUgcm9vdCBwcm9wZXJ0eSdzIHZhbHVlIHByaW9yIHRvIGFueSB0d2VlbmluZy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlID0gRGF0YShlbGVtZW50KS5yb290UHJvcGVydHlWYWx1ZUNhY2hlW3Jvb3RQcm9wZXJ0eV07XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHZhbHVlcyB3ZXJlIG5vdCB0cmFuc2ZlcnJlZCBmcm9tIGEgcHJldmlvdXMgVmVsb2NpdHkgY2FsbCwgcXVlcnkgdGhlIERPTSBhcyBuZWVkZWQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBIYW5kbGUgaG9va2VkIHByb3BlcnRpZXMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbcHJvcGVydHldKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3RhcnRWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlID0gQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgcm9vdFByb3BlcnR5KTsgLyogR0VUICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFRoZSBmb2xsb3dpbmcgZ2V0UHJvcGVydHlWYWx1ZSgpIGNhbGwgZG9lcyBub3QgYWN0dWFsbHkgdHJpZ2dlciBhIERPTSBxdWVyeTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0UHJvcGVydHlWYWx1ZSgpIHdpbGwgZXh0cmFjdCB0aGUgaG9vayBmcm9tIHJvb3RQcm9wZXJ0eVZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgcHJvcGVydHksIHJvb3RQcm9wZXJ0eVZhbHVlKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiBzdGFydFZhbHVlIGlzIGFscmVhZHkgZGVmaW5lZCB2aWEgZm9yY2VmZWVkaW5nLCBkbyBub3QgcXVlcnkgdGhlIERPTSBmb3IgdGhlIHJvb3QgcHJvcGVydHkncyB2YWx1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBqdXN0IGdyYWIgcm9vdFByb3BlcnR5J3MgemVyby12YWx1ZSB0ZW1wbGF0ZSBmcm9tIENTUy5Ib29rcy4gVGhpcyBvdmVyd3JpdGVzIHRoZSBlbGVtZW50J3MgYWN0dWFsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vdCBwcm9wZXJ0eSB2YWx1ZSAoaWYgb25lIGlzIHNldCksIGJ1dCB0aGlzIGlzIGFjY2VwdGFibGUgc2luY2UgdGhlIHByaW1hcnkgcmVhc29uIHVzZXJzIGZvcmNlZmVlZCBpc1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvIGF2b2lkIERPTSBxdWVyaWVzLCBhbmQgdGh1cyB3ZSBsaWtld2lzZSBhdm9pZCBxdWVyeWluZyB0aGUgRE9NIGZvciB0aGUgcm9vdCBwcm9wZXJ0eSdzIHZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEdyYWIgdGhpcyBob29rJ3MgemVyby12YWx1ZSB0ZW1wbGF0ZSwgZS5nLiBcIjBweCAwcHggMHB4IGJsYWNrXCIuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlID0gQ1NTLkhvb2tzLnRlbXBsYXRlc1tyb290UHJvcGVydHldWzFdO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEhhbmRsZSBub24taG9va2VkIHByb3BlcnRpZXMgdGhhdCBoYXZlbid0IGFscmVhZHkgYmVlbiBkZWZpbmVkIHZpYSBmb3JjZWZlZWRpbmcuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHN0YXJ0VmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgPSBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBwcm9wZXJ0eSk7IC8qIEdFVCAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIFZhbHVlIERhdGEgRXh0cmFjdGlvblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2VwYXJhdGVkVmFsdWUsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZVVuaXRUeXBlLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZVVuaXRUeXBlLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3BlcmF0b3IgPSBmYWxzZTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBTZXBhcmF0ZXMgYSBwcm9wZXJ0eSB2YWx1ZSBpbnRvIGl0cyBudW1lcmljIHZhbHVlIGFuZCBpdHMgdW5pdCB0eXBlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBzZXBhcmF0ZVZhbHVlIChwcm9wZXJ0eSwgdmFsdWUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB1bml0VHlwZSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1lcmljVmFsdWU7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bWVyaWNWYWx1ZSA9ICh2YWx1ZSB8fCBcIjBcIilcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudG9TdHJpbmcoKVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50b0xvd2VyQ2FzZSgpXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogTWF0Y2ggdGhlIHVuaXQgdHlwZSBhdCB0aGUgZW5kIG9mIHRoZSB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvWyVBLXpdKyQvLCBmdW5jdGlvbihtYXRjaCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBHcmFiIHRoZSB1bml0IHR5cGUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRUeXBlID0gbWF0Y2g7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU3RyaXAgdGhlIHVuaXQgdHlwZSBvZmYgb2YgdmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcIlwiO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiBubyB1bml0IHR5cGUgd2FzIHN1cHBsaWVkLCBhc3NpZ24gb25lIHRoYXQgaXMgYXBwcm9wcmlhdGUgZm9yIHRoaXMgcHJvcGVydHkgKGUuZy4gXCJkZWdcIiBmb3Igcm90YXRlWiBvciBcInB4XCIgZm9yIHdpZHRoKS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdW5pdFR5cGUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0VHlwZSA9IENTUy5WYWx1ZXMuZ2V0VW5pdFR5cGUocHJvcGVydHkpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWyBudW1lcmljVmFsdWUsIHVuaXRUeXBlIF07XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBTZXBhcmF0ZSBzdGFydFZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBzZXBhcmF0ZWRWYWx1ZSA9IHNlcGFyYXRlVmFsdWUocHJvcGVydHksIHN0YXJ0VmFsdWUpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gc2VwYXJhdGVkVmFsdWVbMF07XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWVVbml0VHlwZSA9IHNlcGFyYXRlZFZhbHVlWzFdO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIFNlcGFyYXRlIGVuZFZhbHVlLCBhbmQgZXh0cmFjdCBhIHZhbHVlIG9wZXJhdG9yIChlLmcuIFwiKz1cIiwgXCItPVwiKSBpZiBvbmUgZXhpc3RzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBzZXBhcmF0ZWRWYWx1ZSA9IHNlcGFyYXRlVmFsdWUocHJvcGVydHksIGVuZFZhbHVlKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWUgPSBzZXBhcmF0ZWRWYWx1ZVswXS5yZXBsYWNlKC9eKFsrLVxcLypdKT0vLCBmdW5jdGlvbihtYXRjaCwgc3ViTWF0Y2gpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wZXJhdG9yID0gc3ViTWF0Y2g7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFN0cmlwIHRoZSBvcGVyYXRvciBvZmYgb2YgdGhlIHZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZVVuaXRUeXBlID0gc2VwYXJhdGVkVmFsdWVbMV07XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogUGFyc2UgZmxvYXQgdmFsdWVzIGZyb20gZW5kVmFsdWUgYW5kIHN0YXJ0VmFsdWUuIERlZmF1bHQgdG8gMCBpZiBOYU4gaXMgcmV0dXJuZWQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgPSBwYXJzZUZsb2F0KHN0YXJ0VmFsdWUpIHx8IDA7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gcGFyc2VGbG9hdChlbmRWYWx1ZSkgfHwgMDtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIFByb3BlcnR5LVNwZWNpZmljIFZhbHVlIENvbnZlcnNpb25cblx0ICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIEN1c3RvbSBzdXBwb3J0IGZvciBwcm9wZXJ0aWVzIHRoYXQgZG9uJ3QgYWN0dWFsbHkgYWNjZXB0IHRoZSAlIHVuaXQgdHlwZSwgYnV0IHdoZXJlIHBvbGx5ZmlsbGluZyBpcyB0cml2aWFsIGFuZCByZWxhdGl2ZWx5IGZvb2xwcm9vZi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVuZFZhbHVlVW5pdFR5cGUgPT09IFwiJVwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBBICUtdmFsdWUgZm9udFNpemUvbGluZUhlaWdodCBpcyByZWxhdGl2ZSB0byB0aGUgcGFyZW50J3MgZm9udFNpemUgKGFzIG9wcG9zZWQgdG8gdGhlIHBhcmVudCdzIGRpbWVuc2lvbnMpLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpY2ggaXMgaWRlbnRpY2FsIHRvIHRoZSBlbSB1bml0J3MgYmVoYXZpb3IsIHNvIHdlIHBpZ2d5YmFjayBvZmYgb2YgdGhhdC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgvXihmb250U2l6ZXxsaW5lSGVpZ2h0KSQvLnRlc3QocHJvcGVydHkpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQ29udmVydCAlIGludG8gYW4gZW0gZGVjaW1hbCB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IGVuZFZhbHVlIC8gMTAwO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlVW5pdFR5cGUgPSBcImVtXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBGb3Igc2NhbGVYIGFuZCBzY2FsZVksIGNvbnZlcnQgdGhlIHZhbHVlIGludG8gaXRzIGRlY2ltYWwgZm9ybWF0IGFuZCBzdHJpcCBvZmYgdGhlIHVuaXQgdHlwZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoL15zY2FsZS8udGVzdChwcm9wZXJ0eSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IGVuZFZhbHVlIC8gMTAwO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlVW5pdFR5cGUgPSBcIlwiO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRm9yIFJHQiBjb21wb25lbnRzLCB0YWtlIHRoZSBkZWZpbmVkIHBlcmNlbnRhZ2Ugb2YgMjU1IGFuZCBzdHJpcCBvZmYgdGhlIHVuaXQgdHlwZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoLyhSZWR8R3JlZW58Qmx1ZSkkL2kudGVzdChwcm9wZXJ0eSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IChlbmRWYWx1ZSAvIDEwMCkgKiAyNTU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWVVbml0VHlwZSA9IFwiXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIFVuaXQgUmF0aW8gQ2FsY3VsYXRpb25cblx0ICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIFdoZW4gcXVlcmllZCwgdGhlIGJyb3dzZXIgcmV0dXJucyAobW9zdCkgQ1NTIHByb3BlcnR5IHZhbHVlcyBpbiBwaXhlbHMuIFRoZXJlZm9yZSwgaWYgYW4gZW5kVmFsdWUgd2l0aCBhIHVuaXQgdHlwZSBvZlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAlLCBlbSwgb3IgcmVtIGlzIGFuaW1hdGVkIHRvd2FyZCwgc3RhcnRWYWx1ZSBtdXN0IGJlIGNvbnZlcnRlZCBmcm9tIHBpeGVscyBpbnRvIHRoZSBzYW1lIHVuaXQgdHlwZSBhcyBlbmRWYWx1ZSBpbiBvcmRlclxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgdmFsdWUgbWFuaXB1bGF0aW9uIGxvZ2ljIChpbmNyZW1lbnQvZGVjcmVtZW50KSB0byBwcm9jZWVkLiBGdXJ0aGVyLCBpZiB0aGUgc3RhcnRWYWx1ZSB3YXMgZm9yY2VmZWQgb3IgdHJhbnNmZXJyZWRcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJvbSBhIHByZXZpb3VzIGNhbGwsIHN0YXJ0VmFsdWUgbWF5IGFsc28gbm90IGJlIGluIHBpeGVscy4gVW5pdCBjb252ZXJzaW9uIGxvZ2ljIHRoZXJlZm9yZSBjb25zaXN0cyBvZiB0d28gc3RlcHM6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIDEpIENhbGN1bGF0aW5nIHRoZSByYXRpbyBvZiAlL2VtL3JlbS92aC92dyByZWxhdGl2ZSB0byBwaXhlbHNcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgMikgQ29udmVydGluZyBzdGFydFZhbHVlIGludG8gdGhlIHNhbWUgdW5pdCBvZiBtZWFzdXJlbWVudCBhcyBlbmRWYWx1ZSBiYXNlZCBvbiB0aGVzZSByYXRpb3MuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIFVuaXQgY29udmVyc2lvbiByYXRpb3MgYXJlIGNhbGN1bGF0ZWQgYnkgaW5zZXJ0aW5nIGEgc2libGluZyBub2RlIG5leHQgdG8gdGhlIHRhcmdldCBub2RlLCBjb3B5aW5nIG92ZXIgaXRzIHBvc2l0aW9uIHByb3BlcnR5LFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXR0aW5nIHZhbHVlcyB3aXRoIHRoZSB0YXJnZXQgdW5pdCB0eXBlIHRoZW4gY29tcGFyaW5nIHRoZSByZXR1cm5lZCBwaXhlbCB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogRXZlbiBpZiBvbmx5IG9uZSBvZiB0aGVzZSB1bml0IHR5cGVzIGlzIGJlaW5nIGFuaW1hdGVkLCBhbGwgdW5pdCByYXRpb3MgYXJlIGNhbGN1bGF0ZWQgYXQgb25jZSBzaW5jZSB0aGUgb3ZlcmhlYWRcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgb2YgYmF0Y2hpbmcgdGhlIFNFVHMgYW5kIEdFVHMgdG9nZXRoZXIgdXBmcm9udCBvdXR3ZWlnaHRzIHRoZSBwb3RlbnRpYWwgb3ZlcmhlYWRcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgb2YgbGF5b3V0IHRocmFzaGluZyBjYXVzZWQgYnkgcmUtcXVlcnlpbmcgZm9yIHVuY2FsY3VsYXRlZCByYXRpb3MgZm9yIHN1YnNlcXVlbnRseS1wcm9jZXNzZWQgcHJvcGVydGllcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogVG9kbzogU2hpZnQgdGhpcyBsb2dpYyBpbnRvIHRoZSBjYWxscycgZmlyc3QgdGljayBpbnN0YW5jZSBzbyB0aGF0IGl0J3Mgc3luY2VkIHdpdGggUkFGLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBjYWxjdWxhdGVVbml0UmF0aW9zICgpIHtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNhbWUgUmF0aW8gQ2hlY2tzXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRoZSBwcm9wZXJ0aWVzIGJlbG93IGFyZSB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIHRoZSBlbGVtZW50IGRpZmZlcnMgc3VmZmljaWVudGx5IGZyb20gdGhpcyBjYWxsJ3Ncblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpb3VzbHkgaXRlcmF0ZWQgZWxlbWVudCB0byBhbHNvIGRpZmZlciBpbiBpdHMgdW5pdCBjb252ZXJzaW9uIHJhdGlvcy4gSWYgdGhlIHByb3BlcnRpZXMgbWF0Y2ggdXAgd2l0aCB0aG9zZVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2YgdGhlIHByaW9yIGVsZW1lbnQsIHRoZSBwcmlvciBlbGVtZW50J3MgY29udmVyc2lvbiByYXRpb3MgYXJlIHVzZWQuIExpa2UgbW9zdCBvcHRpbWl6YXRpb25zIGluIFZlbG9jaXR5LFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcyBpcyBkb25lIHRvIG1pbmltaXplIERPTSBxdWVyeWluZy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzYW1lUmF0aW9JbmRpY2F0b3JzID0ge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBteVBhcmVudDogZWxlbWVudC5wYXJlbnROb2RlIHx8IGRvY3VtZW50LmJvZHksIC8qIEdFVCAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJwb3NpdGlvblwiKSwgLyogR0VUICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImZvbnRTaXplXCIpIC8qIEdFVCAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRGV0ZXJtaW5lIGlmIHRoZSBzYW1lICUgcmF0aW8gY2FuIGJlIHVzZWQuICUgaXMgYmFzZWQgb24gdGhlIGVsZW1lbnQncyBwb3NpdGlvbiB2YWx1ZSBhbmQgaXRzIHBhcmVudCdzIHdpZHRoIGFuZCBoZWlnaHQgZGltZW5zaW9ucy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYW1lUGVyY2VudFJhdGlvID0gKChzYW1lUmF0aW9JbmRpY2F0b3JzLnBvc2l0aW9uID09PSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RQb3NpdGlvbikgJiYgKHNhbWVSYXRpb0luZGljYXRvcnMubXlQYXJlbnQgPT09IGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdFBhcmVudCkpLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIERldGVybWluZSBpZiB0aGUgc2FtZSBlbSByYXRpbyBjYW4gYmUgdXNlZC4gZW0gaXMgcmVsYXRpdmUgdG8gdGhlIGVsZW1lbnQncyBmb250U2l6ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYW1lRW1SYXRpbyA9IChzYW1lUmF0aW9JbmRpY2F0b3JzLmZvbnRTaXplID09PSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RGb250U2l6ZSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFN0b3JlIHRoZXNlIHJhdGlvIGluZGljYXRvcnMgY2FsbC13aWRlIGZvciB0aGUgbmV4dCBlbGVtZW50IHRvIGNvbXBhcmUgYWdhaW5zdC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdFBhcmVudCA9IHNhbWVSYXRpb0luZGljYXRvcnMubXlQYXJlbnQ7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RQb3NpdGlvbiA9IHNhbWVSYXRpb0luZGljYXRvcnMucG9zaXRpb247XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RGb250U2l6ZSA9IHNhbWVSYXRpb0luZGljYXRvcnMuZm9udFNpemU7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEVsZW1lbnQtU3BlY2lmaWMgVW5pdHNcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogSUU4IHJvdW5kcyB0byB0aGUgbmVhcmVzdCBwaXhlbCB3aGVuIHJldHVybmluZyBDU1MgdmFsdWVzLCB0aHVzIHdlIHBlcmZvcm0gY29udmVyc2lvbnMgdXNpbmcgYSBtZWFzdXJlbWVudFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2YgMTAwIChpbnN0ZWFkIG9mIDEpIHRvIGdpdmUgb3VyIHJhdGlvcyBhIHByZWNpc2lvbiBvZiBhdCBsZWFzdCAyIGRlY2ltYWwgdmFsdWVzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1lYXN1cmVtZW50ID0gMTAwLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRSYXRpb3MgPSB7fTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzYW1lRW1SYXRpbyB8fCAhc2FtZVBlcmNlbnRSYXRpbykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkdW1teSA9IERhdGEoZWxlbWVudCkuaXNTVkcgPyBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcInJlY3RcIikgOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuaW5pdChkdW1teSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2FtZVJhdGlvSW5kaWNhdG9ycy5teVBhcmVudC5hcHBlbmRDaGlsZChkdW1teSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBUbyBhY2N1cmF0ZWx5IGFuZCBjb25zaXN0ZW50bHkgY2FsY3VsYXRlIGNvbnZlcnNpb24gcmF0aW9zLCB0aGUgZWxlbWVudCdzIGNhc2NhZGVkIG92ZXJmbG93IGFuZCBib3gtc2l6aW5nIGFyZSBzdHJpcHBlZC5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBTaW1pbGFybHksIHNpbmNlIHdpZHRoL2hlaWdodCBjYW4gYmUgYXJ0aWZpY2lhbGx5IGNvbnN0cmFpbmVkIGJ5IHRoZWlyIG1pbi0vbWF4LSBlcXVpdmFsZW50cywgdGhlc2UgYXJlIGNvbnRyb2xsZWQgZm9yIGFzIHdlbGwuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogT3ZlcmZsb3cgbXVzdCBiZSBhbHNvIGJlIGNvbnRyb2xsZWQgZm9yIHBlci1heGlzIHNpbmNlIHRoZSBvdmVyZmxvdyBwcm9wZXJ0eSBvdmVyd3JpdGVzIGl0cyBwZXItYXhpcyB2YWx1ZXMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKFsgXCJvdmVyZmxvd1wiLCBcIm92ZXJmbG93WFwiLCBcIm92ZXJmbG93WVwiIF0sIGZ1bmN0aW9uKGksIHByb3BlcnR5KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LkNTUy5zZXRQcm9wZXJ0eVZhbHVlKGR1bW15LCBwcm9wZXJ0eSwgXCJoaWRkZW5cIik7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuQ1NTLnNldFByb3BlcnR5VmFsdWUoZHVtbXksIFwicG9zaXRpb25cIiwgc2FtZVJhdGlvSW5kaWNhdG9ycy5wb3NpdGlvbik7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuQ1NTLnNldFByb3BlcnR5VmFsdWUoZHVtbXksIFwiZm9udFNpemVcIiwgc2FtZVJhdGlvSW5kaWNhdG9ycy5mb250U2l6ZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuQ1NTLnNldFByb3BlcnR5VmFsdWUoZHVtbXksIFwiYm94U2l6aW5nXCIsIFwiY29udGVudC1ib3hcIik7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiB3aWR0aCBhbmQgaGVpZ2h0IGFjdCBhcyBvdXIgcHJveHkgcHJvcGVydGllcyBmb3IgbWVhc3VyaW5nIHRoZSBob3Jpem9udGFsIGFuZCB2ZXJ0aWNhbCAlIHJhdGlvcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2goWyBcIm1pbldpZHRoXCIsIFwibWF4V2lkdGhcIiwgXCJ3aWR0aFwiLCBcIm1pbkhlaWdodFwiLCBcIm1heEhlaWdodFwiLCBcImhlaWdodFwiIF0sIGZ1bmN0aW9uKGksIHByb3BlcnR5KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LkNTUy5zZXRQcm9wZXJ0eVZhbHVlKGR1bW15LCBwcm9wZXJ0eSwgbWVhc3VyZW1lbnQgKyBcIiVcIik7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogcGFkZGluZ0xlZnQgYXJiaXRyYXJpbHkgYWN0cyBhcyBvdXIgcHJveHkgcHJvcGVydHkgZm9yIHRoZSBlbSByYXRpby4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5DU1Muc2V0UHJvcGVydHlWYWx1ZShkdW1teSwgXCJwYWRkaW5nTGVmdFwiLCBtZWFzdXJlbWVudCArIFwiZW1cIik7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBEaXZpZGUgdGhlIHJldHVybmVkIHZhbHVlIGJ5IHRoZSBtZWFzdXJlbWVudCB0byBnZXQgdGhlIHJhdGlvIGJldHdlZW4gMSUgYW5kIDFweC4gRGVmYXVsdCB0byAxIHNpbmNlIHdvcmtpbmcgd2l0aCAwIGNhbiBwcm9kdWNlIEluZmluaXRlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRSYXRpb3MucGVyY2VudFRvUHhXaWR0aCA9IGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdFBlcmNlbnRUb1B4V2lkdGggPSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShkdW1teSwgXCJ3aWR0aFwiLCBudWxsLCB0cnVlKSkgfHwgMSkgLyBtZWFzdXJlbWVudDsgLyogR0VUICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFJhdGlvcy5wZXJjZW50VG9QeEhlaWdodCA9IGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdFBlcmNlbnRUb1B4SGVpZ2h0ID0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZHVtbXksIFwiaGVpZ2h0XCIsIG51bGwsIHRydWUpKSB8fCAxKSAvIG1lYXN1cmVtZW50OyAvKiBHRVQgKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0UmF0aW9zLmVtVG9QeCA9IGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdEVtVG9QeCA9IChwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGR1bW15LCBcInBhZGRpbmdMZWZ0XCIpKSB8fCAxKSAvIG1lYXN1cmVtZW50OyAvKiBHRVQgKi9cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNhbWVSYXRpb0luZGljYXRvcnMubXlQYXJlbnQucmVtb3ZlQ2hpbGQoZHVtbXkpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0UmF0aW9zLmVtVG9QeCA9IGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdEVtVG9QeDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0UmF0aW9zLnBlcmNlbnRUb1B4V2lkdGggPSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RQZXJjZW50VG9QeFdpZHRoO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRSYXRpb3MucGVyY2VudFRvUHhIZWlnaHQgPSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLmxhc3RQZXJjZW50VG9QeEhlaWdodDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRWxlbWVudC1BZ25vc3RpYyBVbml0c1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBXaGVyZWFzICUgYW5kIGVtIHJhdGlvcyBhcmUgZGV0ZXJtaW5lZCBvbiBhIHBlci1lbGVtZW50IGJhc2lzLCB0aGUgcmVtIHVuaXQgb25seSBuZWVkcyB0byBiZSBjaGVja2VkXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbmNlIHBlciBjYWxsIHNpbmNlIGl0J3MgZXhjbHVzaXZlbHkgZGVwZW5kYW50IHVwb24gZG9jdW1lbnQuYm9keSdzIGZvbnRTaXplLiBJZiB0aGlzIGlzIHRoZSBmaXJzdCB0aW1lXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0IGNhbGN1bGF0ZVVuaXRSYXRpb3MoKSBpcyBiZWluZyBydW4gZHVyaW5nIHRoaXMgY2FsbCwgcmVtVG9QeCB3aWxsIHN0aWxsIGJlIHNldCB0byBpdHMgZGVmYXVsdCB2YWx1ZSBvZiBudWxsLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc28gd2UgY2FsY3VsYXRlIGl0IG5vdy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYWxsVW5pdENvbnZlcnNpb25EYXRhLnJlbVRvUHggPT09IG51bGwpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBEZWZhdWx0IHRvIGJyb3dzZXJzJyBkZWZhdWx0IGZvbnRTaXplIG9mIDE2cHggaW4gdGhlIGNhc2Ugb2YgMC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsVW5pdENvbnZlcnNpb25EYXRhLnJlbVRvUHggPSBwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGRvY3VtZW50LmJvZHksIFwiZm9udFNpemVcIikpIHx8IDE2OyAvKiBHRVQgKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU2ltaWxhcmx5LCB2aWV3cG9ydCB1bml0cyBhcmUgJS1yZWxhdGl2ZSB0byB0aGUgd2luZG93J3MgaW5uZXIgZGltZW5zaW9ucy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjYWxsVW5pdENvbnZlcnNpb25EYXRhLnZ3VG9QeCA9PT0gbnVsbCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxVbml0Q29udmVyc2lvbkRhdGEudndUb1B4ID0gcGFyc2VGbG9hdCh3aW5kb3cuaW5uZXJXaWR0aCkgLyAxMDA7IC8qIEdFVCAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxVbml0Q29udmVyc2lvbkRhdGEudmhUb1B4ID0gcGFyc2VGbG9hdCh3aW5kb3cuaW5uZXJIZWlnaHQpIC8gMTAwOyAvKiBHRVQgKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFJhdGlvcy5yZW1Ub1B4ID0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5yZW1Ub1B4O1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFJhdGlvcy52d1RvUHggPSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLnZ3VG9QeDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRSYXRpb3MudmhUb1B4ID0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS52aFRvUHg7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChWZWxvY2l0eS5kZWJ1ZyA+PSAxKSBjb25zb2xlLmxvZyhcIlVuaXQgcmF0aW9zOiBcIiArIEpTT04uc3RyaW5naWZ5KHVuaXRSYXRpb3MpLCBlbGVtZW50KTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVuaXRSYXRpb3M7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgVW5pdCBDb252ZXJzaW9uXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRoZSAqIGFuZCAvIG9wZXJhdG9ycywgd2hpY2ggYXJlIG5vdCBwYXNzZWQgaW4gd2l0aCBhbiBhc3NvY2lhdGVkIHVuaXQsIGluaGVyZW50bHkgdXNlIHN0YXJ0VmFsdWUncyB1bml0LiBTa2lwIHZhbHVlIGFuZCB1bml0IGNvbnZlcnNpb24uICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmICgvW1xcLypdLy50ZXN0KG9wZXJhdG9yKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWVVbml0VHlwZSA9IHN0YXJ0VmFsdWVVbml0VHlwZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgc3RhcnRWYWx1ZSBhbmQgZW5kVmFsdWUgZGlmZmVyIGluIHVuaXQgdHlwZSwgY29udmVydCBzdGFydFZhbHVlIGludG8gdGhlIHNhbWUgdW5pdCB0eXBlIGFzIGVuZFZhbHVlIHNvIHRoYXQgaWYgZW5kVmFsdWVVbml0VHlwZVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBpcyBhIHJlbGF0aXZlIHVuaXQgKCUsIGVtLCByZW0pLCB0aGUgdmFsdWVzIHNldCBkdXJpbmcgdHdlZW5pbmcgd2lsbCBjb250aW51ZSB0byBiZSBhY2N1cmF0ZWx5IHJlbGF0aXZlIGV2ZW4gaWYgdGhlIG1ldHJpY3MgdGhleSBkZXBlbmRcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgb24gYXJlIGR5bmFtaWNhbGx5IGNoYW5naW5nIGR1cmluZyB0aGUgY291cnNlIG9mIHRoZSBhbmltYXRpb24uIENvbnZlcnNlbHksIGlmIHdlIGFsd2F5cyBub3JtYWxpemVkIGludG8gcHggYW5kIHVzZWQgcHggZm9yIHNldHRpbmcgdmFsdWVzLCB0aGUgcHggcmF0aW9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgd291bGQgYmVjb21lIHN0YWxlIGlmIHRoZSBvcmlnaW5hbCB1bml0IGJlaW5nIGFuaW1hdGVkIHRvd2FyZCB3YXMgcmVsYXRpdmUgYW5kIHRoZSB1bmRlcmx5aW5nIG1ldHJpY3MgY2hhbmdlIGR1cmluZyB0aGUgYW5pbWF0aW9uLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBTaW5jZSAwIGlzIDAgaW4gYW55IHVuaXQgdHlwZSwgbm8gY29udmVyc2lvbiBpcyBuZWNlc3Nhcnkgd2hlbiBzdGFydFZhbHVlIGlzIDAgLS0gd2UganVzdCBzdGFydCBhdCAwIHdpdGggZW5kVmFsdWVVbml0VHlwZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgoc3RhcnRWYWx1ZVVuaXRUeXBlICE9PSBlbmRWYWx1ZVVuaXRUeXBlKSAmJiBzdGFydFZhbHVlICE9PSAwKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBVbml0IGNvbnZlcnNpb24gaXMgYWxzbyBza2lwcGVkIHdoZW4gZW5kVmFsdWUgaXMgMCwgYnV0ICpzdGFydFZhbHVlVW5pdFR5cGUqIG11c3QgYmUgdXNlZCBmb3IgdHdlZW4gdmFsdWVzIHRvIHJlbWFpbiBhY2N1cmF0ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFNraXBwaW5nIHVuaXQgY29udmVyc2lvbiBoZXJlIG1lYW5zIHRoYXQgaWYgZW5kVmFsdWVVbml0VHlwZSB3YXMgb3JpZ2luYWxseSBhIHJlbGF0aXZlIHVuaXQsIHRoZSBhbmltYXRpb24gd29uJ3QgcmVsYXRpdmVseVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2ggdGhlIHVuZGVybHlpbmcgbWV0cmljcyBpZiB0aGV5IGNoYW5nZSwgYnV0IHRoaXMgaXMgYWNjZXB0YWJsZSBzaW5jZSB3ZSdyZSBhbmltYXRpbmcgdG93YXJkIGludmlzaWJpbGl0eSBpbnN0ZWFkIG9mIHRvd2FyZCB2aXNpYmlsaXR5LFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpY2ggcmVtYWlucyBwYXN0IHRoZSBwb2ludCBvZiB0aGUgYW5pbWF0aW9uJ3MgY29tcGxldGlvbi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbmRWYWx1ZSA9PT0gMCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlVW5pdFR5cGUgPSBzdGFydFZhbHVlVW5pdFR5cGU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEJ5IHRoaXMgcG9pbnQsIHdlIGNhbm5vdCBhdm9pZCB1bml0IGNvbnZlcnNpb24gKGl0J3MgdW5kZXNpcmFibGUgc2luY2UgaXQgY2F1c2VzIGxheW91dCB0aHJhc2hpbmcpLlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIElmIHdlIGhhdmVuJ3QgYWxyZWFkeSwgd2UgdHJpZ2dlciBjYWxjdWxhdGVVbml0UmF0aW9zKCksIHdoaWNoIHJ1bnMgb25jZSBwZXIgZWxlbWVudCBwZXIgY2FsbC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50VW5pdENvbnZlcnNpb25EYXRhID0gZWxlbWVudFVuaXRDb252ZXJzaW9uRGF0YSB8fCBjYWxjdWxhdGVVbml0UmF0aW9zKCk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBUaGUgZm9sbG93aW5nIFJlZ0V4IG1hdGNoZXMgQ1NTIHByb3BlcnRpZXMgdGhhdCBoYXZlIHRoZWlyICUgdmFsdWVzIG1lYXN1cmVkIHJlbGF0aXZlIHRvIHRoZSB4LWF4aXMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogVzNDIHNwZWMgbWFuZGF0ZXMgdGhhdCBhbGwgb2YgbWFyZ2luIGFuZCBwYWRkaW5nJ3MgcHJvcGVydGllcyAoZXZlbiB0b3AgYW5kIGJvdHRvbSkgYXJlICUtcmVsYXRpdmUgdG8gdGhlICp3aWR0aCogb2YgdGhlIHBhcmVudCBlbGVtZW50LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBheGlzID0gKC9tYXJnaW58cGFkZGluZ3xsZWZ0fHJpZ2h0fHdpZHRofHRleHR8d29yZHxsZXR0ZXIvaS50ZXN0KHByb3BlcnR5KSB8fCAvWCQvLnRlc3QocHJvcGVydHkpIHx8IHByb3BlcnR5ID09PSBcInhcIikgPyBcInhcIiA6IFwieVwiO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSW4gb3JkZXIgdG8gYXZvaWQgZ2VuZXJhdGluZyBuXjIgYmVzcG9rZSBjb252ZXJzaW9uIGZ1bmN0aW9ucywgdW5pdCBjb252ZXJzaW9uIGlzIGEgdHdvLXN0ZXAgcHJvY2Vzczpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAxKSBDb252ZXJ0IHN0YXJ0VmFsdWUgaW50byBwaXhlbHMuIDIpIENvbnZlcnQgdGhpcyBuZXcgcGl4ZWwgdmFsdWUgaW50byBlbmRWYWx1ZSdzIHVuaXQgdHlwZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHN0YXJ0VmFsdWVVbml0VHlwZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiJVwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogdHJhbnNsYXRlWCBhbmQgdHJhbnNsYXRlWSBhcmUgdGhlIG9ubHkgcHJvcGVydGllcyB0aGF0IGFyZSAlLXJlbGF0aXZlIHRvIGFuIGVsZW1lbnQncyBvd24gZGltZW5zaW9ucyAtLSBub3QgaXRzIHBhcmVudCdzIGRpbWVuc2lvbnMuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eSBkb2VzIG5vdCBpbmNsdWRlIGEgc3BlY2lhbCBjb252ZXJzaW9uIHByb2Nlc3MgdG8gYWNjb3VudCBmb3IgdGhpcyBiZWhhdmlvci4gVGhlcmVmb3JlLCBhbmltYXRpbmcgdHJhbnNsYXRlWC9ZIGZyb20gYSAlIHZhbHVlXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0byBhIG5vbi0lIHZhbHVlIHdpbGwgcHJvZHVjZSBhbiBpbmNvcnJlY3Qgc3RhcnQgdmFsdWUuIEZvcnR1bmF0ZWx5LCB0aGlzIHNvcnQgb2YgY3Jvc3MtdW5pdCBjb252ZXJzaW9uIGlzIHJhcmVseSBkb25lIGJ5IHVzZXJzIGluIHByYWN0aWNlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSAqPSAoYXhpcyA9PT0gXCJ4XCIgPyBlbGVtZW50VW5pdENvbnZlcnNpb25EYXRhLnBlcmNlbnRUb1B4V2lkdGggOiBlbGVtZW50VW5pdENvbnZlcnNpb25EYXRhLnBlcmNlbnRUb1B4SGVpZ2h0KTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJweFwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogcHggYWN0cyBhcyBvdXIgbWlkcG9pbnQgaW4gdGhlIHVuaXQgY29udmVyc2lvbiBwcm9jZXNzOyBkbyBub3RoaW5nLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgKj0gZWxlbWVudFVuaXRDb252ZXJzaW9uRGF0YVtzdGFydFZhbHVlVW5pdFR5cGUgKyBcIlRvUHhcIl07XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSW52ZXJ0IHRoZSBweCByYXRpb3MgdG8gY29udmVydCBpbnRvIHRvIHRoZSB0YXJnZXQgdW5pdC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGVuZFZhbHVlVW5pdFR5cGUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIiVcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgKj0gMSAvIChheGlzID09PSBcInhcIiA/IGVsZW1lbnRVbml0Q29udmVyc2lvbkRhdGEucGVyY2VudFRvUHhXaWR0aCA6IGVsZW1lbnRVbml0Q29udmVyc2lvbkRhdGEucGVyY2VudFRvUHhIZWlnaHQpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcInB4XCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBzdGFydFZhbHVlIGlzIGFscmVhZHkgaW4gcHgsIGRvIG5vdGhpbmc7IHdlJ3JlIGRvbmUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSAqPSAxIC8gZWxlbWVudFVuaXRDb252ZXJzaW9uRGF0YVtlbmRWYWx1ZVVuaXRUeXBlICsgXCJUb1B4XCJdO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVsYXRpdmUgVmFsdWVzXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBPcGVyYXRvciBsb2dpYyBtdXN0IGJlIHBlcmZvcm1lZCBsYXN0IHNpbmNlIGl0IHJlcXVpcmVzIHVuaXQtbm9ybWFsaXplZCBzdGFydCBhbmQgZW5kIHZhbHVlcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogUmVsYXRpdmUgKnBlcmNlbnQgdmFsdWVzKiBkbyBub3QgYmVoYXZlIGhvdyBtb3N0IHBlb3BsZSB0aGluazsgd2hpbGUgb25lIHdvdWxkIGV4cGVjdCBcIis9NTAlXCJcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgdG8gaW5jcmVhc2UgdGhlIHByb3BlcnR5IDEuNXggaXRzIGN1cnJlbnQgdmFsdWUsIGl0IGluIGZhY3QgaW5jcmVhc2VzIHRoZSBwZXJjZW50IHVuaXRzIGluIGFic29sdXRlIHRlcm1zOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICA1MCBwb2ludHMgaXMgYWRkZWQgb24gdG9wIG9mIHRoZSBjdXJyZW50ICUgdmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAob3BlcmF0b3IpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCIrXCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWUgPSBzdGFydFZhbHVlICsgZW5kVmFsdWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCItXCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWUgPSBzdGFydFZhbHVlIC0gZW5kVmFsdWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCIqXCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWUgPSBzdGFydFZhbHVlICogZW5kVmFsdWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCIvXCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWUgPSBzdGFydFZhbHVlIC8gZW5kVmFsdWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW5zQ29udGFpbmVyIFB1c2hcblx0ICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogQ29uc3RydWN0IHRoZSBwZXItcHJvcGVydHkgdHdlZW4gb2JqZWN0LCBhbmQgcHVzaCBpdCB0byB0aGUgZWxlbWVudCdzIHR3ZWVuc0NvbnRhaW5lci4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW5zQ29udGFpbmVyW3Byb3BlcnR5XSA9IHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlOiByb290UHJvcGVydHlWYWx1ZSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWU6IHN0YXJ0VmFsdWUsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWU6IHN0YXJ0VmFsdWUsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZTogZW5kVmFsdWUsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0VHlwZTogZW5kVmFsdWVVbml0VHlwZSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVhc2luZzogZWFzaW5nXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH07XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFZlbG9jaXR5LmRlYnVnKSBjb25zb2xlLmxvZyhcInR3ZWVuc0NvbnRhaW5lciAoXCIgKyBwcm9wZXJ0eSArIFwiKTogXCIgKyBKU09OLnN0cmluZ2lmeSh0d2VlbnNDb250YWluZXJbcHJvcGVydHldKSwgZWxlbWVudCk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogQWxvbmcgd2l0aCBpdHMgcHJvcGVydHkgZGF0YSwgc3RvcmUgYSByZWZlcmVuY2UgdG8gdGhlIGVsZW1lbnQgaXRzZWxmIG9udG8gdHdlZW5zQ29udGFpbmVyLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIHR3ZWVuc0NvbnRhaW5lci5lbGVtZW50ID0gZWxlbWVudDtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgQ2FsbCBQdXNoXG5cdCAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgLyogTm90ZTogdHdlZW5zQ29udGFpbmVyIGNhbiBiZSBlbXB0eSBpZiBhbGwgb2YgdGhlIHByb3BlcnRpZXMgaW4gdGhpcyBjYWxsJ3MgcHJvcGVydHkgbWFwIHdlcmUgc2tpcHBlZCBkdWUgdG8gbm90XG5cdCAgICAgICAgICAgICAgICAgICBiZWluZyBzdXBwb3J0ZWQgYnkgdGhlIGJyb3dzZXIuIFRoZSBlbGVtZW50IHByb3BlcnR5IGlzIHVzZWQgZm9yIGNoZWNraW5nIHRoYXQgdGhlIHR3ZWVuc0NvbnRhaW5lciBoYXMgYmVlbiBhcHBlbmRlZCB0by4gKi9cblx0ICAgICAgICAgICAgICAgIGlmICh0d2VlbnNDb250YWluZXIuZWxlbWVudCkge1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIEFwcGx5IHRoZSBcInZlbG9jaXR5LWFuaW1hdGluZ1wiIGluZGljYXRvciBjbGFzcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBDU1MuVmFsdWVzLmFkZENsYXNzKGVsZW1lbnQsIFwidmVsb2NpdHktYW5pbWF0aW5nXCIpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogVGhlIGNhbGwgYXJyYXkgaG91c2VzIHRoZSB0d2VlbnNDb250YWluZXJzIGZvciBlYWNoIGVsZW1lbnQgYmVpbmcgYW5pbWF0ZWQgaW4gdGhlIGN1cnJlbnQgY2FsbC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBjYWxsLnB1c2godHdlZW5zQ29udGFpbmVyKTtcblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIFN0b3JlIHRoZSB0d2VlbnNDb250YWluZXIgYW5kIG9wdGlvbnMgaWYgd2UncmUgd29ya2luZyBvbiB0aGUgZGVmYXVsdCBlZmZlY3RzIHF1ZXVlLCBzbyB0aGF0IHRoZXkgY2FuIGJlIHVzZWQgYnkgdGhlIHJldmVyc2UgY29tbWFuZC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5xdWV1ZSA9PT0gXCJcIikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLnR3ZWVuc0NvbnRhaW5lciA9IHR3ZWVuc0NvbnRhaW5lcjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5vcHRzID0gb3B0cztcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBTd2l0Y2ggb24gdGhlIGVsZW1lbnQncyBhbmltYXRpbmcgZmxhZy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLmlzQW5pbWF0aW5nID0gdHJ1ZTtcblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIE9uY2UgdGhlIGZpbmFsIGVsZW1lbnQgaW4gdGhpcyBjYWxsJ3MgZWxlbWVudCBzZXQgaGFzIGJlZW4gcHJvY2Vzc2VkLCBwdXNoIHRoZSBjYWxsIGFycmF5IG9udG9cblx0ICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5TdGF0ZS5jYWxscyBmb3IgdGhlIGFuaW1hdGlvbiB0aWNrIHRvIGltbWVkaWF0ZWx5IGJlZ2luIHByb2Nlc3NpbmcuICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnRzSW5kZXggPT09IGVsZW1lbnRzTGVuZ3RoIC0gMSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBBZGQgdGhlIGN1cnJlbnQgY2FsbCBwbHVzIGl0cyBhc3NvY2lhdGVkIG1ldGFkYXRhICh0aGUgZWxlbWVudCBzZXQgYW5kIHRoZSBjYWxsJ3Mgb3B0aW9ucykgb250byB0aGUgZ2xvYmFsIGNhbGwgY29udGFpbmVyLlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBBbnl0aGluZyBvbiB0aGlzIGNhbGwgY29udGFpbmVyIGlzIHN1YmplY3RlZCB0byB0aWNrKCkgcHJvY2Vzc2luZy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuU3RhdGUuY2FsbHMucHVzaChbIGNhbGwsIGVsZW1lbnRzLCBvcHRzLCBudWxsLCBwcm9taXNlRGF0YS5yZXNvbHZlciBdKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgYW5pbWF0aW9uIHRpY2sgaXNuJ3QgcnVubmluZywgc3RhcnQgaXQuIChWZWxvY2l0eSBzaHV0cyBpdCBvZmYgd2hlbiB0aGVyZSBhcmUgbm8gYWN0aXZlIGNhbGxzIHRvIHByb2Nlc3MuKSAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoVmVsb2NpdHkuU3RhdGUuaXNUaWNraW5nID09PSBmYWxzZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuU3RhdGUuaXNUaWNraW5nID0gdHJ1ZTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU3RhcnQgdGhlIHRpY2sgbG9vcC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpY2soKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRzSW5kZXgrKztcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvKiBXaGVuIHRoZSBxdWV1ZSBvcHRpb24gaXMgc2V0IHRvIGZhbHNlLCB0aGUgY2FsbCBza2lwcyB0aGUgZWxlbWVudCdzIHF1ZXVlIGFuZCBmaXJlcyBpbW1lZGlhdGVseS4gKi9cblx0ICAgICAgICAgICAgaWYgKG9wdHMucXVldWUgPT09IGZhbHNlKSB7XG5cdCAgICAgICAgICAgICAgICAvKiBTaW5jZSB0aGlzIGJ1aWxkUXVldWUgY2FsbCBkb2Vzbid0IHJlc3BlY3QgdGhlIGVsZW1lbnQncyBleGlzdGluZyBxdWV1ZSAod2hpY2ggaXMgd2hlcmUgYSBkZWxheSBvcHRpb24gd291bGQgaGF2ZSBiZWVuIGFwcGVuZGVkKSxcblx0ICAgICAgICAgICAgICAgICAgIHdlIG1hbnVhbGx5IGluamVjdCB0aGUgZGVsYXkgcHJvcGVydHkgaGVyZSB3aXRoIGFuIGV4cGxpY2l0IHNldFRpbWVvdXQuICovXG5cdCAgICAgICAgICAgICAgICBpZiAob3B0cy5kZWxheSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoYnVpbGRRdWV1ZSwgb3B0cy5kZWxheSk7XG5cdCAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIGJ1aWxkUXVldWUoKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgLyogT3RoZXJ3aXNlLCB0aGUgY2FsbCB1bmRlcmdvZXMgZWxlbWVudCBxdWV1ZWluZyBhcyBub3JtYWwuICovXG5cdCAgICAgICAgICAgIC8qIE5vdGU6IFRvIGludGVyb3BlcmF0ZSB3aXRoIGpRdWVyeSwgVmVsb2NpdHkgdXNlcyBqUXVlcnkncyBvd24gJC5xdWV1ZSgpIHN0YWNrIGZvciBxdWV1aW5nIGxvZ2ljLiAqL1xuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgJC5xdWV1ZShlbGVtZW50LCBvcHRzLnF1ZXVlLCBmdW5jdGlvbihuZXh0LCBjbGVhclF1ZXVlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGNsZWFyUXVldWUgZmxhZyB3YXMgcGFzc2VkIGluIGJ5IHRoZSBzdG9wIGNvbW1hbmQsIHJlc29sdmUgdGhpcyBjYWxsJ3MgcHJvbWlzZS4gKFByb21pc2VzIGNhbiBvbmx5IGJlIHJlc29sdmVkIG9uY2UsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgc28gaXQncyBmaW5lIGlmIHRoaXMgaXMgcmVwZWF0ZWRseSB0cmlnZ2VyZWQgZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUgYXNzb2NpYXRlZCBjYWxsLikgKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoY2xlYXJRdWV1ZSA9PT0gdHJ1ZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvbWlzZURhdGEucHJvbWlzZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZURhdGEucmVzb2x2ZXIoZWxlbWVudHMpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogRG8gbm90IGNvbnRpbnVlIHdpdGggYW5pbWF0aW9uIHF1ZXVlaW5nLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBUaGlzIGZsYWcgaW5kaWNhdGVzIHRvIHRoZSB1cGNvbWluZyBjb21wbGV0ZUNhbGwoKSBmdW5jdGlvbiB0aGF0IHRoaXMgcXVldWUgZW50cnkgd2FzIGluaXRpYXRlZCBieSBWZWxvY2l0eS5cblx0ICAgICAgICAgICAgICAgICAgICAgICBTZWUgY29tcGxldGVDYWxsKCkgZm9yIGZ1cnRoZXIgZGV0YWlscy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS52ZWxvY2l0eVF1ZXVlRW50cnlGbGFnID0gdHJ1ZTtcblxuXHQgICAgICAgICAgICAgICAgICAgIGJ1aWxkUXVldWUobmV4dCk7XG5cdCAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgIEF1dG8tRGVxdWV1aW5nXG5cdCAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAvKiBBcyBwZXIgalF1ZXJ5J3MgJC5xdWV1ZSgpIGJlaGF2aW9yLCB0byBmaXJlIHRoZSBmaXJzdCBub24tY3VzdG9tLXF1ZXVlIGVudHJ5IG9uIGFuIGVsZW1lbnQsIHRoZSBlbGVtZW50XG5cdCAgICAgICAgICAgICAgIG11c3QgYmUgZGVxdWV1ZWQgaWYgaXRzIHF1ZXVlIHN0YWNrIGNvbnNpc3RzICpzb2xlbHkqIG9mIHRoZSBjdXJyZW50IGNhbGwuIChUaGlzIGNhbiBiZSBkZXRlcm1pbmVkIGJ5IGNoZWNraW5nXG5cdCAgICAgICAgICAgICAgIGZvciB0aGUgXCJpbnByb2dyZXNzXCIgaXRlbSB0aGF0IGpRdWVyeSBwcmVwZW5kcyB0byBhY3RpdmUgcXVldWUgc3RhY2sgYXJyYXlzLikgUmVnYXJkbGVzcywgd2hlbmV2ZXIgdGhlIGVsZW1lbnQnc1xuXHQgICAgICAgICAgICAgICBxdWV1ZSBpcyBmdXJ0aGVyIGFwcGVuZGVkIHdpdGggYWRkaXRpb25hbCBpdGVtcyAtLSBpbmNsdWRpbmcgJC5kZWxheSgpJ3Mgb3IgZXZlbiAkLmFuaW1hdGUoKSBjYWxscywgdGhlIHF1ZXVlJ3Ncblx0ICAgICAgICAgICAgICAgZmlyc3QgZW50cnkgaXMgYXV0b21hdGljYWxseSBmaXJlZC4gVGhpcyBiZWhhdmlvciBjb250cmFzdHMgdGhhdCBvZiBjdXN0b20gcXVldWVzLCB3aGljaCBuZXZlciBhdXRvLWZpcmUuICovXG5cdCAgICAgICAgICAgIC8qIE5vdGU6IFdoZW4gYW4gZWxlbWVudCBzZXQgaXMgYmVpbmcgc3ViamVjdGVkIHRvIGEgbm9uLXBhcmFsbGVsIFZlbG9jaXR5IGNhbGwsIHRoZSBhbmltYXRpb24gd2lsbCBub3QgYmVnaW4gdW50aWxcblx0ICAgICAgICAgICAgICAgZWFjaCBvbmUgb2YgdGhlIGVsZW1lbnRzIGluIHRoZSBzZXQgaGFzIHJlYWNoZWQgdGhlIGVuZCBvZiBpdHMgaW5kaXZpZHVhbGx5IHByZS1leGlzdGluZyBxdWV1ZSBjaGFpbi4gKi9cblx0ICAgICAgICAgICAgLyogTm90ZTogVW5mb3J0dW5hdGVseSwgbW9zdCBwZW9wbGUgZG9uJ3QgZnVsbHkgZ3Jhc3AgalF1ZXJ5J3MgcG93ZXJmdWwsIHlldCBxdWlya3ksICQucXVldWUoKSBmdW5jdGlvbi5cblx0ICAgICAgICAgICAgICAgTGVhbiBtb3JlIGhlcmU6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTA1ODE1OC9jYW4tc29tZWJvZHktZXhwbGFpbi1qcXVlcnktcXVldWUtdG8tbWUgKi9cblx0ICAgICAgICAgICAgaWYgKChvcHRzLnF1ZXVlID09PSBcIlwiIHx8IG9wdHMucXVldWUgPT09IFwiZnhcIikgJiYgJC5xdWV1ZShlbGVtZW50KVswXSAhPT0gXCJpbnByb2dyZXNzXCIpIHtcblx0ICAgICAgICAgICAgICAgICQuZGVxdWV1ZShlbGVtZW50KTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgIEVsZW1lbnQgU2V0IEl0ZXJhdGlvblxuXHQgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgLyogSWYgdGhlIFwibm9kZVR5cGVcIiBwcm9wZXJ0eSBleGlzdHMgb24gdGhlIGVsZW1lbnRzIHZhcmlhYmxlLCB3ZSdyZSBhbmltYXRpbmcgYSBzaW5nbGUgZWxlbWVudC5cblx0ICAgICAgICAgICBQbGFjZSBpdCBpbiBhbiBhcnJheSBzbyB0aGF0ICQuZWFjaCgpIGNhbiBpdGVyYXRlIG92ZXIgaXQuICovXG5cdCAgICAgICAgJC5lYWNoKGVsZW1lbnRzLCBmdW5jdGlvbihpLCBlbGVtZW50KSB7XG5cdCAgICAgICAgICAgIC8qIEVuc3VyZSBlYWNoIGVsZW1lbnQgaW4gYSBzZXQgaGFzIGEgbm9kZVR5cGUgKGlzIGEgcmVhbCBlbGVtZW50KSB0byBhdm9pZCB0aHJvd2luZyBlcnJvcnMuICovXG5cdCAgICAgICAgICAgIGlmIChUeXBlLmlzTm9kZShlbGVtZW50KSkge1xuXHQgICAgICAgICAgICAgICAgcHJvY2Vzc0VsZW1lbnQuY2FsbChlbGVtZW50KTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgLyoqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgIE9wdGlvbjogTG9vcFxuXHQgICAgICAgICoqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgIC8qIFRoZSBsb29wIG9wdGlvbiBhY2NlcHRzIGFuIGludGVnZXIgaW5kaWNhdGluZyBob3cgbWFueSB0aW1lcyB0aGUgZWxlbWVudCBzaG91bGQgbG9vcCBiZXR3ZWVuIHRoZSB2YWx1ZXMgaW4gdGhlXG5cdCAgICAgICAgICAgY3VycmVudCBjYWxsJ3MgcHJvcGVydGllcyBtYXAgYW5kIHRoZSBlbGVtZW50J3MgcHJvcGVydHkgdmFsdWVzIHByaW9yIHRvIHRoaXMgY2FsbC4gKi9cblx0ICAgICAgICAvKiBOb3RlOiBUaGUgbG9vcCBvcHRpb24ncyBsb2dpYyBpcyBwZXJmb3JtZWQgaGVyZSAtLSBhZnRlciBlbGVtZW50IHByb2Nlc3NpbmcgLS0gYmVjYXVzZSB0aGUgY3VycmVudCBjYWxsIG5lZWRzXG5cdCAgICAgICAgICAgdG8gdW5kZXJnbyBpdHMgcXVldWUgaW5zZXJ0aW9uIHByaW9yIHRvIHRoZSBsb29wIG9wdGlvbiBnZW5lcmF0aW5nIGl0cyBzZXJpZXMgb2YgY29uc3RpdHVlbnQgXCJyZXZlcnNlXCIgY2FsbHMsXG5cdCAgICAgICAgICAgd2hpY2ggY2hhaW4gYWZ0ZXIgdGhlIGN1cnJlbnQgY2FsbC4gVHdvIHJldmVyc2UgY2FsbHMgKHR3byBcImFsdGVybmF0aW9uc1wiKSBjb25zdGl0dXRlIG9uZSBsb29wLiAqL1xuXHQgICAgICAgIHZhciBvcHRzID0gJC5leHRlbmQoe30sIFZlbG9jaXR5LmRlZmF1bHRzLCBvcHRpb25zKSxcblx0ICAgICAgICAgICAgcmV2ZXJzZUNhbGxzQ291bnQ7XG5cblx0ICAgICAgICBvcHRzLmxvb3AgPSBwYXJzZUludChvcHRzLmxvb3ApO1xuXHQgICAgICAgIHJldmVyc2VDYWxsc0NvdW50ID0gKG9wdHMubG9vcCAqIDIpIC0gMTtcblxuXHQgICAgICAgIGlmIChvcHRzLmxvb3ApIHtcblx0ICAgICAgICAgICAgLyogRG91YmxlIHRoZSBsb29wIGNvdW50IHRvIGNvbnZlcnQgaXQgaW50byBpdHMgYXBwcm9wcmlhdGUgbnVtYmVyIG9mIFwicmV2ZXJzZVwiIGNhbGxzLlxuXHQgICAgICAgICAgICAgICBTdWJ0cmFjdCAxIGZyb20gdGhlIHJlc3VsdGluZyB2YWx1ZSBzaW5jZSB0aGUgY3VycmVudCBjYWxsIGlzIGluY2x1ZGVkIGluIHRoZSB0b3RhbCBhbHRlcm5hdGlvbiBjb3VudC4gKi9cblx0ICAgICAgICAgICAgZm9yICh2YXIgeCA9IDA7IHggPCByZXZlcnNlQ2FsbHNDb3VudDsgeCsrKSB7XG5cdCAgICAgICAgICAgICAgICAvKiBTaW5jZSB0aGUgbG9naWMgZm9yIHRoZSByZXZlcnNlIGFjdGlvbiBvY2N1cnMgaW5zaWRlIFF1ZXVlaW5nIGFuZCB0aGVyZWZvcmUgdGhpcyBjYWxsJ3Mgb3B0aW9ucyBvYmplY3Rcblx0ICAgICAgICAgICAgICAgICAgIGlzbid0IHBhcnNlZCB1bnRpbCB0aGVuIGFzIHdlbGwsIHRoZSBjdXJyZW50IGNhbGwncyBkZWxheSBvcHRpb24gbXVzdCBiZSBleHBsaWNpdGx5IHBhc3NlZCBpbnRvIHRoZSByZXZlcnNlXG5cdCAgICAgICAgICAgICAgICAgICBjYWxsIHNvIHRoYXQgdGhlIGRlbGF5IGxvZ2ljIHRoYXQgb2NjdXJzIGluc2lkZSAqUHJlLVF1ZXVlaW5nKiBjYW4gcHJvY2VzcyBpdC4gKi9cblx0ICAgICAgICAgICAgICAgIHZhciByZXZlcnNlT3B0aW9ucyA9IHtcblx0ICAgICAgICAgICAgICAgICAgICBkZWxheTogb3B0cy5kZWxheSxcblx0ICAgICAgICAgICAgICAgICAgICBwcm9ncmVzczogb3B0cy5wcm9ncmVzc1xuXHQgICAgICAgICAgICAgICAgfTtcblxuXHQgICAgICAgICAgICAgICAgLyogSWYgYSBjb21wbGV0ZSBjYWxsYmFjayB3YXMgcGFzc2VkIGludG8gdGhpcyBjYWxsLCB0cmFuc2ZlciBpdCB0byB0aGUgbG9vcCByZWRpcmVjdCdzIGZpbmFsIFwicmV2ZXJzZVwiIGNhbGxcblx0ICAgICAgICAgICAgICAgICAgIHNvIHRoYXQgaXQncyB0cmlnZ2VyZWQgd2hlbiB0aGUgZW50aXJlIHJlZGlyZWN0IGlzIGNvbXBsZXRlIChhbmQgbm90IHdoZW4gdGhlIHZlcnkgZmlyc3QgYW5pbWF0aW9uIGlzIGNvbXBsZXRlKS4gKi9cblx0ICAgICAgICAgICAgICAgIGlmICh4ID09PSByZXZlcnNlQ2FsbHNDb3VudCAtIDEpIHtcblx0ICAgICAgICAgICAgICAgICAgICByZXZlcnNlT3B0aW9ucy5kaXNwbGF5ID0gb3B0cy5kaXNwbGF5O1xuXHQgICAgICAgICAgICAgICAgICAgIHJldmVyc2VPcHRpb25zLnZpc2liaWxpdHkgPSBvcHRzLnZpc2liaWxpdHk7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV2ZXJzZU9wdGlvbnMuY29tcGxldGUgPSBvcHRzLmNvbXBsZXRlO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICBhbmltYXRlKGVsZW1lbnRzLCBcInJldmVyc2VcIiwgcmV2ZXJzZU9wdGlvbnMpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLyoqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICBDaGFpbmluZ1xuXHQgICAgICAgICoqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgIC8qIFJldHVybiB0aGUgZWxlbWVudHMgYmFjayB0byB0aGUgY2FsbCBjaGFpbiwgd2l0aCB3cmFwcGVkIGVsZW1lbnRzIHRha2luZyBwcmVjZWRlbmNlIGluIGNhc2UgVmVsb2NpdHkgd2FzIGNhbGxlZCB2aWEgdGhlICQuZm4uIGV4dGVuc2lvbi4gKi9cblx0ICAgICAgICByZXR1cm4gZ2V0Q2hhaW4oKTtcblx0ICAgIH07XG5cblx0ICAgIC8qIFR1cm4gVmVsb2NpdHkgaW50byB0aGUgYW5pbWF0aW9uIGZ1bmN0aW9uLCBleHRlbmRlZCB3aXRoIHRoZSBwcmUtZXhpc3RpbmcgVmVsb2NpdHkgb2JqZWN0LiAqL1xuXHQgICAgVmVsb2NpdHkgPSAkLmV4dGVuZChhbmltYXRlLCBWZWxvY2l0eSk7XG5cdCAgICAvKiBGb3IgbGVnYWN5IHN1cHBvcnQsIGFsc28gZXhwb3NlIHRoZSBsaXRlcmFsIGFuaW1hdGUgbWV0aG9kLiAqL1xuXHQgICAgVmVsb2NpdHkuYW5pbWF0ZSA9IGFuaW1hdGU7XG5cblx0ICAgIC8qKioqKioqKioqKioqKlxuXHQgICAgICAgIFRpbWluZ1xuXHQgICAgKioqKioqKioqKioqKiovXG5cblx0ICAgIC8qIFRpY2tlciBmdW5jdGlvbi4gKi9cblx0ICAgIHZhciB0aWNrZXIgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHJBRlNoaW07XG5cblx0ICAgIC8qIEluYWN0aXZlIGJyb3dzZXIgdGFicyBwYXVzZSByQUYsIHdoaWNoIHJlc3VsdHMgaW4gYWxsIGFjdGl2ZSBhbmltYXRpb25zIGltbWVkaWF0ZWx5IHNwcmludGluZyB0byB0aGVpciBjb21wbGV0aW9uIHN0YXRlcyB3aGVuIHRoZSB0YWIgcmVmb2N1c2VzLlxuXHQgICAgICAgVG8gZ2V0IGFyb3VuZCB0aGlzLCB3ZSBkeW5hbWljYWxseSBzd2l0Y2ggckFGIHRvIHNldFRpbWVvdXQgKHdoaWNoIHRoZSBicm93c2VyICpkb2Vzbid0KiBwYXVzZSkgd2hlbiB0aGUgdGFiIGxvc2VzIGZvY3VzLiBXZSBza2lwIHRoaXMgZm9yIG1vYmlsZVxuXHQgICAgICAgZGV2aWNlcyB0byBhdm9pZCB3YXN0aW5nIGJhdHRlcnkgcG93ZXIgb24gaW5hY3RpdmUgdGFicy4gKi9cblx0ICAgIC8qIE5vdGU6IFRhYiBmb2N1cyBkZXRlY3Rpb24gZG9lc24ndCB3b3JrIG9uIG9sZGVyIHZlcnNpb25zIG9mIElFLCBidXQgdGhhdCdzIG9rYXkgc2luY2UgdGhleSBkb24ndCBzdXBwb3J0IHJBRiB0byBiZWdpbiB3aXRoLiAqL1xuXHQgICAgaWYgKCFWZWxvY2l0eS5TdGF0ZS5pc01vYmlsZSAmJiBkb2N1bWVudC5oaWRkZW4gIT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJ2aXNpYmlsaXR5Y2hhbmdlXCIsIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICAvKiBSZWFzc2lnbiB0aGUgckFGIGZ1bmN0aW9uICh3aGljaCB0aGUgZ2xvYmFsIHRpY2soKSBmdW5jdGlvbiB1c2VzKSBiYXNlZCBvbiB0aGUgdGFiJ3MgZm9jdXMgc3RhdGUuICovXG5cdCAgICAgICAgICAgIGlmIChkb2N1bWVudC5oaWRkZW4pIHtcblx0ICAgICAgICAgICAgICAgIHRpY2tlciA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogVGhlIHRpY2sgZnVuY3Rpb24gbmVlZHMgYSB0cnV0aHkgZmlyc3QgYXJndW1lbnQgaW4gb3JkZXIgdG8gcGFzcyBpdHMgaW50ZXJuYWwgdGltZXN0YW1wIGNoZWNrLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYWxsYmFjayh0cnVlKSB9LCAxNik7XG5cdCAgICAgICAgICAgICAgICB9O1xuXG5cdCAgICAgICAgICAgICAgICAvKiBUaGUgckFGIGxvb3AgaGFzIGJlZW4gcGF1c2VkIGJ5IHRoZSBicm93c2VyLCBzbyB3ZSBtYW51YWxseSByZXN0YXJ0IHRoZSB0aWNrLiAqL1xuXHQgICAgICAgICAgICAgICAgdGljaygpO1xuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgdGlja2VyID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCByQUZTaGltO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSk7XG5cdCAgICB9XG5cblx0ICAgIC8qKioqKioqKioqKipcblx0ICAgICAgICBUaWNrXG5cdCAgICAqKioqKioqKioqKiovXG5cblx0ICAgIC8qIE5vdGU6IEFsbCBjYWxscyB0byBWZWxvY2l0eSBhcmUgcHVzaGVkIHRvIHRoZSBWZWxvY2l0eS5TdGF0ZS5jYWxscyBhcnJheSwgd2hpY2ggaXMgZnVsbHkgaXRlcmF0ZWQgdGhyb3VnaCB1cG9uIGVhY2ggdGljay4gKi9cblx0ICAgIGZ1bmN0aW9uIHRpY2sgKHRpbWVzdGFtcCkge1xuXHQgICAgICAgIC8qIEFuIGVtcHR5IHRpbWVzdGFtcCBhcmd1bWVudCBpbmRpY2F0ZXMgdGhhdCB0aGlzIGlzIHRoZSBmaXJzdCB0aWNrIG9jY3VyZW5jZSBzaW5jZSB0aWNraW5nIHdhcyB0dXJuZWQgb24uXG5cdCAgICAgICAgICAgV2UgbGV2ZXJhZ2UgdGhpcyBtZXRhZGF0YSB0byBmdWxseSBpZ25vcmUgdGhlIGZpcnN0IHRpY2sgcGFzcyBzaW5jZSBSQUYncyBpbml0aWFsIHBhc3MgaXMgZmlyZWQgd2hlbmV2ZXJcblx0ICAgICAgICAgICB0aGUgYnJvd3NlcidzIG5leHQgdGljayBzeW5jIHRpbWUgb2NjdXJzLCB3aGljaCByZXN1bHRzIGluIHRoZSBmaXJzdCBlbGVtZW50cyBzdWJqZWN0ZWQgdG8gVmVsb2NpdHlcblx0ICAgICAgICAgICBjYWxscyBiZWluZyBhbmltYXRlZCBvdXQgb2Ygc3luYyB3aXRoIGFueSBlbGVtZW50cyBhbmltYXRlZCBpbW1lZGlhdGVseSB0aGVyZWFmdGVyLiBJbiBzaG9ydCwgd2UgaWdub3JlXG5cdCAgICAgICAgICAgdGhlIGZpcnN0IFJBRiB0aWNrIHBhc3Mgc28gdGhhdCBlbGVtZW50cyBiZWluZyBpbW1lZGlhdGVseSBjb25zZWN1dGl2ZWx5IGFuaW1hdGVkIC0tIGluc3RlYWQgb2Ygc2ltdWx0YW5lb3VzbHkgYW5pbWF0ZWRcblx0ICAgICAgICAgICBieSB0aGUgc2FtZSBWZWxvY2l0eSBjYWxsIC0tIGFyZSBwcm9wZXJseSBiYXRjaGVkIGludG8gdGhlIHNhbWUgaW5pdGlhbCBSQUYgdGljayBhbmQgY29uc2VxdWVudGx5IHJlbWFpbiBpbiBzeW5jIHRoZXJlYWZ0ZXIuICovXG5cdCAgICAgICAgaWYgKHRpbWVzdGFtcCkge1xuXHQgICAgICAgICAgICAvKiBXZSBpZ25vcmUgUkFGJ3MgaGlnaCByZXNvbHV0aW9uIHRpbWVzdGFtcCBzaW5jZSBpdCBjYW4gYmUgc2lnbmlmaWNhbnRseSBvZmZzZXQgd2hlbiB0aGUgYnJvd3NlciBpc1xuXHQgICAgICAgICAgICAgICB1bmRlciBoaWdoIHN0cmVzczsgd2Ugb3B0IGZvciBjaG9wcGluZXNzIG92ZXIgYWxsb3dpbmcgdGhlIGJyb3dzZXIgdG8gZHJvcCBodWdlIGNodW5rcyBvZiBmcmFtZXMuICovXG5cdCAgICAgICAgICAgIHZhciB0aW1lQ3VycmVudCA9IChuZXcgRGF0ZSkuZ2V0VGltZSgpO1xuXG5cdCAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICBDYWxsIEl0ZXJhdGlvblxuXHQgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICB2YXIgY2FsbHNMZW5ndGggPSBWZWxvY2l0eS5TdGF0ZS5jYWxscy5sZW5ndGg7XG5cblx0ICAgICAgICAgICAgLyogVG8gc3BlZWQgdXAgaXRlcmF0aW5nIG92ZXIgdGhpcyBhcnJheSwgaXQgaXMgY29tcGFjdGVkIChmYWxzZXkgaXRlbXMgLS0gY2FsbHMgdGhhdCBoYXZlIGNvbXBsZXRlZCAtLSBhcmUgcmVtb3ZlZClcblx0ICAgICAgICAgICAgICAgd2hlbiBpdHMgbGVuZ3RoIGhhcyBiYWxsb29uZWQgdG8gYSBwb2ludCB0aGF0IGNhbiBpbXBhY3QgdGljayBwZXJmb3JtYW5jZS4gVGhpcyBvbmx5IGJlY29tZXMgbmVjZXNzYXJ5IHdoZW4gYW5pbWF0aW9uXG5cdCAgICAgICAgICAgICAgIGhhcyBiZWVuIGNvbnRpbnVvdXMgd2l0aCBtYW55IGVsZW1lbnRzIG92ZXIgYSBsb25nIHBlcmlvZCBvZiB0aW1lOyB3aGVuZXZlciBhbGwgYWN0aXZlIGNhbGxzIGFyZSBjb21wbGV0ZWQsIGNvbXBsZXRlQ2FsbCgpIGNsZWFycyBWZWxvY2l0eS5TdGF0ZS5jYWxscy4gKi9cblx0ICAgICAgICAgICAgaWYgKGNhbGxzTGVuZ3RoID4gMTAwMDApIHtcblx0ICAgICAgICAgICAgICAgIFZlbG9jaXR5LlN0YXRlLmNhbGxzID0gY29tcGFjdFNwYXJzZUFycmF5KFZlbG9jaXR5LlN0YXRlLmNhbGxzKTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8qIEl0ZXJhdGUgdGhyb3VnaCBlYWNoIGFjdGl2ZSBjYWxsLiAqL1xuXHQgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxzTGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgIC8qIFdoZW4gYSBWZWxvY2l0eSBjYWxsIGlzIGNvbXBsZXRlZCwgaXRzIFZlbG9jaXR5LlN0YXRlLmNhbGxzIGVudHJ5IGlzIHNldCB0byBmYWxzZS4gQ29udGludWUgb24gdG8gdGhlIG5leHQgY2FsbC4gKi9cblx0ICAgICAgICAgICAgICAgIGlmICghVmVsb2NpdHkuU3RhdGUuY2FsbHNbaV0pIHtcblx0ICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgQ2FsbC1XaWRlIFZhcmlhYmxlc1xuXHQgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICB2YXIgY2FsbENvbnRhaW5lciA9IFZlbG9jaXR5LlN0YXRlLmNhbGxzW2ldLFxuXHQgICAgICAgICAgICAgICAgICAgIGNhbGwgPSBjYWxsQ29udGFpbmVyWzBdLFxuXHQgICAgICAgICAgICAgICAgICAgIG9wdHMgPSBjYWxsQ29udGFpbmVyWzJdLFxuXHQgICAgICAgICAgICAgICAgICAgIHRpbWVTdGFydCA9IGNhbGxDb250YWluZXJbM10sXG5cdCAgICAgICAgICAgICAgICAgICAgZmlyc3RUaWNrID0gISF0aW1lU3RhcnQsXG5cdCAgICAgICAgICAgICAgICAgICAgdHdlZW5EdW1teVZhbHVlID0gbnVsbDtcblxuXHQgICAgICAgICAgICAgICAgLyogSWYgdGltZVN0YXJ0IGlzIHVuZGVmaW5lZCwgdGhlbiB0aGlzIGlzIHRoZSBmaXJzdCB0aW1lIHRoYXQgdGhpcyBjYWxsIGhhcyBiZWVuIHByb2Nlc3NlZCBieSB0aWNrKCkuXG5cdCAgICAgICAgICAgICAgICAgICBXZSBhc3NpZ24gdGltZVN0YXJ0IG5vdyBzbyB0aGF0IGl0cyB2YWx1ZSBpcyBhcyBjbG9zZSB0byB0aGUgcmVhbCBhbmltYXRpb24gc3RhcnQgdGltZSBhcyBwb3NzaWJsZS5cblx0ICAgICAgICAgICAgICAgICAgIChDb252ZXJzZWx5LCBoYWQgdGltZVN0YXJ0IGJlZW4gZGVmaW5lZCB3aGVuIHRoaXMgY2FsbCB3YXMgYWRkZWQgdG8gVmVsb2NpdHkuU3RhdGUuY2FsbHMsIHRoZSBkZWxheVxuXHQgICAgICAgICAgICAgICAgICAgYmV0d2VlbiB0aGF0IHRpbWUgYW5kIG5vdyB3b3VsZCBjYXVzZSB0aGUgZmlyc3QgZmV3IGZyYW1lcyBvZiB0aGUgdHdlZW4gdG8gYmUgc2tpcHBlZCBzaW5jZVxuXHQgICAgICAgICAgICAgICAgICAgcGVyY2VudENvbXBsZXRlIGlzIGNhbGN1bGF0ZWQgcmVsYXRpdmUgdG8gdGltZVN0YXJ0LikgKi9cblx0ICAgICAgICAgICAgICAgIC8qIEZ1cnRoZXIsIHN1YnRyYWN0IDE2bXMgKHRoZSBhcHByb3hpbWF0ZSByZXNvbHV0aW9uIG9mIFJBRikgZnJvbSB0aGUgY3VycmVudCB0aW1lIHZhbHVlIHNvIHRoYXQgdGhlXG5cdCAgICAgICAgICAgICAgICAgICBmaXJzdCB0aWNrIGl0ZXJhdGlvbiBpc24ndCB3YXN0ZWQgYnkgYW5pbWF0aW5nIGF0IDAlIHR3ZWVuIGNvbXBsZXRpb24sIHdoaWNoIHdvdWxkIHByb2R1Y2UgdGhlXG5cdCAgICAgICAgICAgICAgICAgICBzYW1lIHN0eWxlIHZhbHVlIGFzIHRoZSBlbGVtZW50J3MgY3VycmVudCB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgIGlmICghdGltZVN0YXJ0KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdGltZVN0YXJ0ID0gVmVsb2NpdHkuU3RhdGUuY2FsbHNbaV1bM10gPSB0aW1lQ3VycmVudCAtIDE2O1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAvKiBUaGUgdHdlZW4ncyBjb21wbGV0aW9uIHBlcmNlbnRhZ2UgaXMgcmVsYXRpdmUgdG8gdGhlIHR3ZWVuJ3Mgc3RhcnQgdGltZSwgbm90IHRoZSB0d2VlbidzIHN0YXJ0IHZhbHVlXG5cdCAgICAgICAgICAgICAgICAgICAod2hpY2ggd291bGQgcmVzdWx0IGluIHVucHJlZGljdGFibGUgdHdlZW4gZHVyYXRpb25zIHNpbmNlIEphdmFTY3JpcHQncyB0aW1lcnMgYXJlIG5vdCBwYXJ0aWN1bGFybHkgYWNjdXJhdGUpLlxuXHQgICAgICAgICAgICAgICAgICAgQWNjb3JkaW5nbHksIHdlIGVuc3VyZSB0aGF0IHBlcmNlbnRDb21wbGV0ZSBkb2VzIG5vdCBleGNlZWQgMS4gKi9cblx0ICAgICAgICAgICAgICAgIHZhciBwZXJjZW50Q29tcGxldGUgPSBNYXRoLm1pbigodGltZUN1cnJlbnQgLSB0aW1lU3RhcnQpIC8gb3B0cy5kdXJhdGlvbiwgMSk7XG5cblx0ICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICBFbGVtZW50IEl0ZXJhdGlvblxuXHQgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgLyogRm9yIGV2ZXJ5IGNhbGwsIGl0ZXJhdGUgdGhyb3VnaCBlYWNoIG9mIHRoZSBlbGVtZW50cyBpbiBpdHMgc2V0LiAqL1xuXHQgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDAsIGNhbGxMZW5ndGggPSBjYWxsLmxlbmd0aDsgaiA8IGNhbGxMZW5ndGg7IGorKykge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciB0d2VlbnNDb250YWluZXIgPSBjYWxsW2pdLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50ID0gdHdlZW5zQ29udGFpbmVyLmVsZW1lbnQ7XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBDaGVjayB0byBzZWUgaWYgdGhpcyBlbGVtZW50IGhhcyBiZWVuIGRlbGV0ZWQgbWlkd2F5IHRocm91Z2ggdGhlIGFuaW1hdGlvbiBieSBjaGVja2luZyBmb3IgdGhlXG5cdCAgICAgICAgICAgICAgICAgICAgICAgY29udGludWVkIGV4aXN0ZW5jZSBvZiBpdHMgZGF0YSBjYWNoZS4gSWYgaXQncyBnb25lLCBza2lwIGFuaW1hdGluZyB0aGlzIGVsZW1lbnQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKCFEYXRhKGVsZW1lbnQpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIHZhciB0cmFuc2Zvcm1Qcm9wZXJ0eUV4aXN0cyA9IGZhbHNlO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICAgICBEaXNwbGF5ICYgVmlzaWJpbGl0eSBUb2dnbGluZ1xuXHQgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgZGlzcGxheSBvcHRpb24gaXMgc2V0IHRvIG5vbi1cIm5vbmVcIiwgc2V0IGl0IHVwZnJvbnQgc28gdGhhdCB0aGUgZWxlbWVudCBjYW4gYmVjb21lIHZpc2libGUgYmVmb3JlIHR3ZWVuaW5nIGJlZ2lucy5cblx0ICAgICAgICAgICAgICAgICAgICAgICAoT3RoZXJ3aXNlLCBkaXNwbGF5J3MgXCJub25lXCIgdmFsdWUgaXMgc2V0IGluIGNvbXBsZXRlQ2FsbCgpIG9uY2UgdGhlIGFuaW1hdGlvbiBoYXMgY29tcGxldGVkLikgKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5kaXNwbGF5ICE9PSB1bmRlZmluZWQgJiYgb3B0cy5kaXNwbGF5ICE9PSBudWxsICYmIG9wdHMuZGlzcGxheSAhPT0gXCJub25lXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMuZGlzcGxheSA9PT0gXCJmbGV4XCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmbGV4VmFsdWVzID0gWyBcIi13ZWJraXQtYm94XCIsIFwiLW1vei1ib3hcIiwgXCItbXMtZmxleGJveFwiLCBcIi13ZWJraXQtZmxleFwiIF07XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChmbGV4VmFsdWVzLCBmdW5jdGlvbihpLCBmbGV4VmFsdWUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImRpc3BsYXlcIiwgZmxleFZhbHVlKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgQ1NTLnNldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJkaXNwbGF5XCIsIG9wdHMuZGlzcGxheSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogU2FtZSBnb2VzIHdpdGggdGhlIHZpc2liaWxpdHkgb3B0aW9uLCBidXQgaXRzIFwibm9uZVwiIGVxdWl2YWxlbnQgaXMgXCJoaWRkZW5cIi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy52aXNpYmlsaXR5ICE9PSB1bmRlZmluZWQgJiYgb3B0cy52aXNpYmlsaXR5ICE9PSBcImhpZGRlblwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIENTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwidmlzaWJpbGl0eVwiLCBvcHRzLnZpc2liaWxpdHkpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICAgICBQcm9wZXJ0eSBJdGVyYXRpb25cblx0ICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBGb3IgZXZlcnkgZWxlbWVudCwgaXRlcmF0ZSB0aHJvdWdoIGVhY2ggcHJvcGVydHkuICovXG5cdCAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcGVydHkgaW4gdHdlZW5zQ29udGFpbmVyKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IEluIGFkZGl0aW9uIHRvIHByb3BlcnR5IHR3ZWVuIGRhdGEsIHR3ZWVuc0NvbnRhaW5lciBjb250YWlucyBhIHJlZmVyZW5jZSB0byBpdHMgYXNzb2NpYXRlZCBlbGVtZW50LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydHkgIT09IFwiZWxlbWVudFwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdHdlZW4gPSB0d2VlbnNDb250YWluZXJbcHJvcGVydHldLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWYWx1ZSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBFYXNpbmcgY2FuIGVpdGhlciBiZSBhIHByZS1nZW5lcmVhdGVkIGZ1bmN0aW9uIG9yIGEgc3RyaW5nIHRoYXQgcmVmZXJlbmNlcyBhIHByZS1yZWdpc3RlcmVkIGVhc2luZ1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uIHRoZSBWZWxvY2l0eS5FYXNpbmdzIG9iamVjdC4gSW4gZWl0aGVyIGNhc2UsIHJldHVybiB0aGUgYXBwcm9wcmlhdGUgZWFzaW5nICpmdW5jdGlvbiouICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWFzaW5nID0gVHlwZS5pc1N0cmluZyh0d2Vlbi5lYXNpbmcpID8gVmVsb2NpdHkuRWFzaW5nc1t0d2Vlbi5lYXNpbmddIDogdHdlZW4uZWFzaW5nO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDdXJyZW50IFZhbHVlIENhbGN1bGF0aW9uXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoaXMgaXMgdGhlIGxhc3QgdGljayBwYXNzIChpZiB3ZSd2ZSByZWFjaGVkIDEwMCUgY29tcGxldGlvbiBmb3IgdGhpcyB0d2VlbiksXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnN1cmUgdGhhdCBjdXJyZW50VmFsdWUgaXMgZXhwbGljaXRseSBzZXQgdG8gaXRzIHRhcmdldCBlbmRWYWx1ZSBzbyB0aGF0IGl0J3Mgbm90IHN1YmplY3RlZCB0byBhbnkgcm91bmRpbmcuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGVyY2VudENvbXBsZXRlID09PSAxKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFZhbHVlID0gdHdlZW4uZW5kVmFsdWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBPdGhlcndpc2UsIGNhbGN1bGF0ZSBjdXJyZW50VmFsdWUgYmFzZWQgb24gdGhlIGN1cnJlbnQgZGVsdGEgZnJvbSBzdGFydFZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdHdlZW5EZWx0YSA9IHR3ZWVuLmVuZFZhbHVlIC0gdHdlZW4uc3RhcnRWYWx1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWUgPSB0d2Vlbi5zdGFydFZhbHVlICsgKHR3ZWVuRGVsdGEgKiBlYXNpbmcocGVyY2VudENvbXBsZXRlLCBvcHRzLCB0d2VlbkRlbHRhKSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiBubyB2YWx1ZSBjaGFuZ2UgaXMgb2NjdXJyaW5nLCBkb24ndCBwcm9jZWVkIHdpdGggRE9NIHVwZGF0aW5nLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZmlyc3RUaWNrICYmIChjdXJyZW50VmFsdWUgPT09IHR3ZWVuLmN1cnJlbnRWYWx1ZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB0d2Vlbi5jdXJyZW50VmFsdWUgPSBjdXJyZW50VmFsdWU7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHdlJ3JlIHR3ZWVuaW5nIGEgZmFrZSAndHdlZW4nIHByb3BlcnR5IGluIG9yZGVyIHRvIGxvZyB0cmFuc2l0aW9uIHZhbHVlcywgdXBkYXRlIHRoZSBvbmUtcGVyLWNhbGwgdmFyaWFibGUgc28gdGhhdFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXQgY2FuIGJlIHBhc3NlZCBpbnRvIHRoZSBwcm9ncmVzcyBjYWxsYmFjay4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eSA9PT0gXCJ0d2VlblwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW5EdW1teVZhbHVlID0gY3VycmVudFZhbHVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSG9va3M6IFBhcnQgSVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEZvciBob29rZWQgcHJvcGVydGllcywgdGhlIG5ld2x5LXVwZGF0ZWQgcm9vdFByb3BlcnR5VmFsdWVDYWNoZSBpcyBjYWNoZWQgb250byB0aGUgZWxlbWVudCBzbyB0aGF0IGl0IGNhbiBiZSB1c2VkXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIHN1YnNlcXVlbnQgaG9va3MgaW4gdGhpcyBjYWxsIHRoYXQgYXJlIGFzc29jaWF0ZWQgd2l0aCB0aGUgc2FtZSByb290IHByb3BlcnR5LiBJZiB3ZSBkaWRuJ3QgY2FjaGUgdGhlIHVwZGF0ZWRcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZSwgZWFjaCBzdWJzZXF1ZW50IHVwZGF0ZSB0byB0aGUgcm9vdCBwcm9wZXJ0eSBpbiB0aGlzIHRpY2sgcGFzcyB3b3VsZCByZXNldCB0aGUgcHJldmlvdXMgaG9vaydzXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlcyB0byByb290UHJvcGVydHlWYWx1ZSBwcmlvciB0byBpbmplY3Rpb24uIEEgbmljZSBwZXJmb3JtYW5jZSBieXByb2R1Y3Qgb2Ygcm9vdFByb3BlcnR5VmFsdWUgY2FjaGluZyBpcyB0aGF0XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2VxdWVudGx5IGNoYWluZWQgYW5pbWF0aW9ucyB1c2luZyB0aGUgc2FtZSBob29rUm9vdCBidXQgYSBkaWZmZXJlbnQgaG9vayBjYW4gdXNlIHRoaXMgY2FjaGVkIHJvb3RQcm9wZXJ0eVZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDU1MuSG9va3MucmVnaXN0ZXJlZFtwcm9wZXJ0eV0pIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGhvb2tSb290ID0gQ1NTLkhvb2tzLmdldFJvb3QocHJvcGVydHkpLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWVDYWNoZSA9IERhdGEoZWxlbWVudCkucm9vdFByb3BlcnR5VmFsdWVDYWNoZVtob29rUm9vdF07XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuLnJvb3RQcm9wZXJ0eVZhbHVlID0gcm9vdFByb3BlcnR5VmFsdWVDYWNoZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBET00gVXBkYXRlXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBzZXRQcm9wZXJ0eVZhbHVlKCkgcmV0dXJucyBhbiBhcnJheSBvZiB0aGUgcHJvcGVydHkgbmFtZSBhbmQgcHJvcGVydHkgdmFsdWUgcG9zdCBhbnkgbm9ybWFsaXphdGlvbiB0aGF0IG1heSBoYXZlIGJlZW4gcGVyZm9ybWVkLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFRvIHNvbHZlIGFuIElFPD04IHBvc2l0aW9uaW5nIGJ1ZywgdGhlIHVuaXQgdHlwZSBpcyBkcm9wcGVkIHdoZW4gc2V0dGluZyBhIHByb3BlcnR5IHZhbHVlIG9mIDAuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFkanVzdGVkU2V0RGF0YSA9IENTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIC8qIFNFVCAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW4uY3VycmVudFZhbHVlICsgKHBhcnNlRmxvYXQoY3VycmVudFZhbHVlKSA9PT0gMCA/IFwiXCIgOiB0d2Vlbi51bml0VHlwZSksXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuLnJvb3RQcm9wZXJ0eVZhbHVlLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0d2Vlbi5zY3JvbGxEYXRhKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSG9va3M6IFBhcnQgSUlcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogTm93IHRoYXQgd2UgaGF2ZSB0aGUgaG9vaydzIHVwZGF0ZWQgcm9vdFByb3BlcnR5VmFsdWUgKHRoZSBwb3N0LXByb2Nlc3NlZCB2YWx1ZSBwcm92aWRlZCBieSBhZGp1c3RlZFNldERhdGEpLCBjYWNoZSBpdCBvbnRvIHRoZSBlbGVtZW50LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDU1MuSG9va3MucmVnaXN0ZXJlZFtwcm9wZXJ0eV0pIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU2luY2UgYWRqdXN0ZWRTZXREYXRhIGNvbnRhaW5zIG5vcm1hbGl6ZWQgZGF0YSByZWFkeSBmb3IgRE9NIHVwZGF0aW5nLCB0aGUgcm9vdFByb3BlcnR5VmFsdWUgbmVlZHMgdG8gYmUgcmUtZXh0cmFjdGVkIGZyb20gaXRzIG5vcm1hbGl6ZWQgZm9ybS4gPz8gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW2hvb2tSb290XSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5yb290UHJvcGVydHlWYWx1ZUNhY2hlW2hvb2tSb290XSA9IENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW2hvb2tSb290XShcImV4dHJhY3RcIiwgbnVsbCwgYWRqdXN0ZWRTZXREYXRhWzFdKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkucm9vdFByb3BlcnR5VmFsdWVDYWNoZVtob29rUm9vdF0gPSBhZGp1c3RlZFNldERhdGFbMV07XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVHJhbnNmb3Jtc1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEZsYWcgd2hldGhlciBhIHRyYW5zZm9ybSBwcm9wZXJ0eSBpcyBiZWluZyBhbmltYXRlZCBzbyB0aGF0IGZsdXNoVHJhbnNmb3JtQ2FjaGUoKSBjYW4gYmUgdHJpZ2dlcmVkIG9uY2UgdGhpcyB0aWNrIHBhc3MgaXMgY29tcGxldGUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFkanVzdGVkU2V0RGF0YVswXSA9PT0gXCJ0cmFuc2Zvcm1cIikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1Qcm9wZXJ0eUV4aXN0cyA9IHRydWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgICAgICBtb2JpbGVIQVxuXHQgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBJZiBtb2JpbGVIQSBpcyBlbmFibGVkLCBzZXQgdGhlIHRyYW5zbGF0ZTNkIHRyYW5zZm9ybSB0byBudWxsIHRvIGZvcmNlIGhhcmR3YXJlIGFjY2VsZXJhdGlvbi5cblx0ICAgICAgICAgICAgICAgICAgICAgICBJdCdzIHNhZmUgdG8gb3ZlcnJpZGUgdGhpcyBwcm9wZXJ0eSBzaW5jZSBWZWxvY2l0eSBkb2Vzbid0IGFjdHVhbGx5IHN1cHBvcnQgaXRzIGFuaW1hdGlvbiAoaG9va3MgYXJlIHVzZWQgaW4gaXRzIHBsYWNlKS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5tb2JpbGVIQSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBEb24ndCBzZXQgdGhlIG51bGwgdHJhbnNmb3JtIGhhY2sgaWYgd2UndmUgYWxyZWFkeSBkb25lIHNvLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZS50cmFuc2xhdGUzZCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBBbGwgZW50cmllcyBvbiB0aGUgdHJhbnNmb3JtQ2FjaGUgb2JqZWN0IGFyZSBsYXRlciBjb25jYXRlbmF0ZWQgaW50byBhIHNpbmdsZSB0cmFuc2Zvcm0gc3RyaW5nIHZpYSBmbHVzaFRyYW5zZm9ybUNhY2hlKCkuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlLnRyYW5zbGF0ZTNkID0gXCIoMHB4LCAwcHgsIDBweClcIjtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtUHJvcGVydHlFeGlzdHMgPSB0cnVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKHRyYW5zZm9ybVByb3BlcnR5RXhpc3RzKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIENTUy5mbHVzaFRyYW5zZm9ybUNhY2hlKGVsZW1lbnQpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgLyogVGhlIG5vbi1cIm5vbmVcIiBkaXNwbGF5IHZhbHVlIGlzIG9ubHkgYXBwbGllZCB0byBhbiBlbGVtZW50IG9uY2UgLS0gd2hlbiBpdHMgYXNzb2NpYXRlZCBjYWxsIGlzIGZpcnN0IHRpY2tlZCB0aHJvdWdoLlxuXHQgICAgICAgICAgICAgICAgICAgQWNjb3JkaW5nbHksIGl0J3Mgc2V0IHRvIGZhbHNlIHNvIHRoYXQgaXQgaXNuJ3QgcmUtcHJvY2Vzc2VkIGJ5IHRoaXMgY2FsbCBpbiB0aGUgbmV4dCB0aWNrLiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKG9wdHMuZGlzcGxheSAhPT0gdW5kZWZpbmVkICYmIG9wdHMuZGlzcGxheSAhPT0gXCJub25lXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5TdGF0ZS5jYWxsc1tpXVsyXS5kaXNwbGF5ID0gZmFsc2U7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICBpZiAob3B0cy52aXNpYmlsaXR5ICE9PSB1bmRlZmluZWQgJiYgb3B0cy52aXNpYmlsaXR5ICE9PSBcImhpZGRlblwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuU3RhdGUuY2FsbHNbaV1bMl0udmlzaWJpbGl0eSA9IGZhbHNlO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAvKiBQYXNzIHRoZSBlbGVtZW50cyBhbmQgdGhlIHRpbWluZyBkYXRhIChwZXJjZW50Q29tcGxldGUsIG1zUmVtYWluaW5nLCB0aW1lU3RhcnQsIHR3ZWVuRHVtbXlWYWx1ZSkgaW50byB0aGUgcHJvZ3Jlc3MgY2FsbGJhY2suICovXG5cdCAgICAgICAgICAgICAgICBpZiAob3B0cy5wcm9ncmVzcykge1xuXHQgICAgICAgICAgICAgICAgICAgIG9wdHMucHJvZ3Jlc3MuY2FsbChjYWxsQ29udGFpbmVyWzFdLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsQ29udGFpbmVyWzFdLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwZXJjZW50Q29tcGxldGUsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgubWF4KDAsICh0aW1lU3RhcnQgKyBvcHRzLmR1cmF0aW9uKSAtIHRpbWVDdXJyZW50KSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZVN0YXJ0LFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0d2VlbkR1bW15VmFsdWUpO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAvKiBJZiB0aGlzIGNhbGwgaGFzIGZpbmlzaGVkIHR3ZWVuaW5nLCBwYXNzIGl0cyBpbmRleCB0byBjb21wbGV0ZUNhbGwoKSB0byBoYW5kbGUgY2FsbCBjbGVhbnVwLiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKHBlcmNlbnRDb21wbGV0ZSA9PT0gMSkge1xuXHQgICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlQ2FsbChpKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8qIE5vdGU6IGNvbXBsZXRlQ2FsbCgpIHNldHMgdGhlIGlzVGlja2luZyBmbGFnIHRvIGZhbHNlIHdoZW4gdGhlIGxhc3QgY2FsbCBvbiBWZWxvY2l0eS5TdGF0ZS5jYWxscyBoYXMgY29tcGxldGVkLiAqL1xuXHQgICAgICAgIGlmIChWZWxvY2l0eS5TdGF0ZS5pc1RpY2tpbmcpIHtcblx0ICAgICAgICAgICAgdGlja2VyKHRpY2spO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgLyoqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICBDYWxsIENvbXBsZXRpb25cblx0ICAgICoqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgIC8qIE5vdGU6IFVubGlrZSB0aWNrKCksIHdoaWNoIHByb2Nlc3NlcyBhbGwgYWN0aXZlIGNhbGxzIGF0IG9uY2UsIGNhbGwgY29tcGxldGlvbiBpcyBoYW5kbGVkIG9uIGEgcGVyLWNhbGwgYmFzaXMuICovXG5cdCAgICBmdW5jdGlvbiBjb21wbGV0ZUNhbGwgKGNhbGxJbmRleCwgaXNTdG9wcGVkKSB7XG5cdCAgICAgICAgLyogRW5zdXJlIHRoZSBjYWxsIGV4aXN0cy4gKi9cblx0ICAgICAgICBpZiAoIVZlbG9jaXR5LlN0YXRlLmNhbGxzW2NhbGxJbmRleF0pIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8qIFB1bGwgdGhlIG1ldGFkYXRhIGZyb20gdGhlIGNhbGwuICovXG5cdCAgICAgICAgdmFyIGNhbGwgPSBWZWxvY2l0eS5TdGF0ZS5jYWxsc1tjYWxsSW5kZXhdWzBdLFxuXHQgICAgICAgICAgICBlbGVtZW50cyA9IFZlbG9jaXR5LlN0YXRlLmNhbGxzW2NhbGxJbmRleF1bMV0sXG5cdCAgICAgICAgICAgIG9wdHMgPSBWZWxvY2l0eS5TdGF0ZS5jYWxsc1tjYWxsSW5kZXhdWzJdLFxuXHQgICAgICAgICAgICByZXNvbHZlciA9IFZlbG9jaXR5LlN0YXRlLmNhbGxzW2NhbGxJbmRleF1bNF07XG5cblx0ICAgICAgICB2YXIgcmVtYWluaW5nQ2FsbHNFeGlzdCA9IGZhbHNlO1xuXG5cdCAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICBFbGVtZW50IEZpbmFsaXphdGlvblxuXHQgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICBmb3IgKHZhciBpID0gMCwgY2FsbExlbmd0aCA9IGNhbGwubGVuZ3RoOyBpIDwgY2FsbExlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgIHZhciBlbGVtZW50ID0gY2FsbFtpXS5lbGVtZW50O1xuXG5cdCAgICAgICAgICAgIC8qIElmIHRoZSB1c2VyIHNldCBkaXNwbGF5IHRvIFwibm9uZVwiIChpbnRlbmRpbmcgdG8gaGlkZSB0aGUgZWxlbWVudCksIHNldCBpdCBub3cgdGhhdCB0aGUgYW5pbWF0aW9uIGhhcyBjb21wbGV0ZWQuICovXG5cdCAgICAgICAgICAgIC8qIE5vdGU6IGRpc3BsYXk6bm9uZSBpc24ndCBzZXQgd2hlbiBjYWxscyBhcmUgbWFudWFsbHkgc3RvcHBlZCAodmlhIFZlbG9jaXR5KFwic3RvcFwiKS4gKi9cblx0ICAgICAgICAgICAgLyogTm90ZTogRGlzcGxheSBnZXRzIGlnbm9yZWQgd2l0aCBcInJldmVyc2VcIiBjYWxscyBhbmQgaW5maW5pdGUgbG9vcHMsIHNpbmNlIHRoaXMgYmVoYXZpb3Igd291bGQgYmUgdW5kZXNpcmFibGUuICovXG5cdCAgICAgICAgICAgIGlmICghaXNTdG9wcGVkICYmICFvcHRzLmxvb3ApIHtcblx0ICAgICAgICAgICAgICAgIGlmIChvcHRzLmRpc3BsYXkgPT09IFwibm9uZVwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgQ1NTLnNldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJkaXNwbGF5XCIsIG9wdHMuZGlzcGxheSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIGlmIChvcHRzLnZpc2liaWxpdHkgPT09IFwiaGlkZGVuXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICBDU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcInZpc2liaWxpdHlcIiwgb3B0cy52aXNpYmlsaXR5KTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8qIElmIHRoZSBlbGVtZW50J3MgcXVldWUgaXMgZW1wdHkgKGlmIG9ubHkgdGhlIFwiaW5wcm9ncmVzc1wiIGl0ZW0gaXMgbGVmdCBhdCBwb3NpdGlvbiAwKSBvciBpZiBpdHMgcXVldWUgaXMgYWJvdXQgdG8gcnVuXG5cdCAgICAgICAgICAgICAgIGEgbm9uLVZlbG9jaXR5LWluaXRpYXRlZCBlbnRyeSwgdHVybiBvZmYgdGhlIGlzQW5pbWF0aW5nIGZsYWcuIEEgbm9uLVZlbG9jaXR5LWluaXRpYXRpZWQgcXVldWUgZW50cnkncyBsb2dpYyBtaWdodCBhbHRlclxuXHQgICAgICAgICAgICAgICBhbiBlbGVtZW50J3MgQ1NTIHZhbHVlcyBhbmQgdGhlcmVieSBjYXVzZSBWZWxvY2l0eSdzIGNhY2hlZCB2YWx1ZSBkYXRhIHRvIGdvIHN0YWxlLiBUbyBkZXRlY3QgaWYgYSBxdWV1ZSBlbnRyeSB3YXMgaW5pdGlhdGVkIGJ5IFZlbG9jaXR5LFxuXHQgICAgICAgICAgICAgICB3ZSBjaGVjayBmb3IgdGhlIGV4aXN0ZW5jZSBvZiBvdXIgc3BlY2lhbCBWZWxvY2l0eS5xdWV1ZUVudHJ5RmxhZyBkZWNsYXJhdGlvbiwgd2hpY2ggbWluaWZpZXJzIHdvbid0IHJlbmFtZSBzaW5jZSB0aGUgZmxhZ1xuXHQgICAgICAgICAgICAgICBpcyBhc3NpZ25lZCB0byBqUXVlcnkncyBnbG9iYWwgJCBvYmplY3QgYW5kIHRodXMgZXhpc3RzIG91dCBvZiBWZWxvY2l0eSdzIG93biBzY29wZS4gKi9cblx0ICAgICAgICAgICAgaWYgKG9wdHMubG9vcCAhPT0gdHJ1ZSAmJiAoJC5xdWV1ZShlbGVtZW50KVsxXSA9PT0gdW5kZWZpbmVkIHx8ICEvXFwudmVsb2NpdHlRdWV1ZUVudHJ5RmxhZy9pLnRlc3QoJC5xdWV1ZShlbGVtZW50KVsxXSkpKSB7XG5cdCAgICAgICAgICAgICAgICAvKiBUaGUgZWxlbWVudCBtYXkgaGF2ZSBiZWVuIGRlbGV0ZWQuIEVuc3VyZSB0aGF0IGl0cyBkYXRhIGNhY2hlIHN0aWxsIGV4aXN0cyBiZWZvcmUgYWN0aW5nIG9uIGl0LiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkpIHtcblx0ICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLmlzQW5pbWF0aW5nID0gZmFsc2U7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogQ2xlYXIgdGhlIGVsZW1lbnQncyByb290UHJvcGVydHlWYWx1ZUNhY2hlLCB3aGljaCB3aWxsIGJlY29tZSBzdGFsZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLnJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGUgPSB7fTtcblxuXHQgICAgICAgICAgICAgICAgICAgIHZhciB0cmFuc2Zvcm1IQVByb3BlcnR5RXhpc3RzID0gZmFsc2U7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogSWYgYW55IDNEIHRyYW5zZm9ybSBzdWJwcm9wZXJ0eSBpcyBhdCBpdHMgZGVmYXVsdCB2YWx1ZSAocmVnYXJkbGVzcyBvZiB1bml0IHR5cGUpLCByZW1vdmUgaXQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgJC5lYWNoKENTUy5MaXN0cy50cmFuc2Zvcm1zM0QsIGZ1bmN0aW9uKGksIHRyYW5zZm9ybU5hbWUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRlZmF1bHRWYWx1ZSA9IC9ec2NhbGUvLnRlc3QodHJhbnNmb3JtTmFtZSkgPyAxIDogMCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWYWx1ZSA9IERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGVbdHJhbnNmb3JtTmFtZV07XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGVbdHJhbnNmb3JtTmFtZV0gIT09IHVuZGVmaW5lZCAmJiBuZXcgUmVnRXhwKFwiXlxcXFwoXCIgKyBkZWZhdWx0VmFsdWUgKyBcIlteLl1cIikudGVzdChjdXJyZW50VmFsdWUpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1IQVByb3BlcnR5RXhpc3RzID0gdHJ1ZTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGVbdHJhbnNmb3JtTmFtZV07XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICB9KTtcblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIE1vYmlsZSBkZXZpY2VzIGhhdmUgaGFyZHdhcmUgYWNjZWxlcmF0aW9uIHJlbW92ZWQgYXQgdGhlIGVuZCBvZiB0aGUgYW5pbWF0aW9uIGluIG9yZGVyIHRvIGF2b2lkIGhvZ2dpbmcgdGhlIEdQVSdzIG1lbW9yeS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5tb2JpbGVIQSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1IQVByb3BlcnR5RXhpc3RzID0gdHJ1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGUudHJhbnNsYXRlM2Q7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogRmx1c2ggdGhlIHN1YnByb3BlcnR5IHJlbW92YWxzIHRvIHRoZSBET00uICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKHRyYW5zZm9ybUhBUHJvcGVydHlFeGlzdHMpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgQ1NTLmZsdXNoVHJhbnNmb3JtQ2FjaGUoZWxlbWVudCk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogUmVtb3ZlIHRoZSBcInZlbG9jaXR5LWFuaW1hdGluZ1wiIGluZGljYXRvciBjbGFzcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBDU1MuVmFsdWVzLnJlbW92ZUNsYXNzKGVsZW1lbnQsIFwidmVsb2NpdHktYW5pbWF0aW5nXCIpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICBPcHRpb246IENvbXBsZXRlXG5cdCAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAvKiBDb21wbGV0ZSBpcyBmaXJlZCBvbmNlIHBlciBjYWxsIChub3Qgb25jZSBwZXIgZWxlbWVudCkgYW5kIGlzIHBhc3NlZCB0aGUgZnVsbCByYXcgRE9NIGVsZW1lbnQgc2V0IGFzIGJvdGggaXRzIGNvbnRleHQgYW5kIGl0cyBmaXJzdCBhcmd1bWVudC4gKi9cblx0ICAgICAgICAgICAgLyogTm90ZTogQ2FsbGJhY2tzIGFyZW4ndCBmaXJlZCB3aGVuIGNhbGxzIGFyZSBtYW51YWxseSBzdG9wcGVkICh2aWEgVmVsb2NpdHkoXCJzdG9wXCIpLiAqL1xuXHQgICAgICAgICAgICBpZiAoIWlzU3RvcHBlZCAmJiBvcHRzLmNvbXBsZXRlICYmICFvcHRzLmxvb3AgJiYgKGkgPT09IGNhbGxMZW5ndGggLSAxKSkge1xuXHQgICAgICAgICAgICAgICAgLyogV2UgdGhyb3cgY2FsbGJhY2tzIGluIGEgc2V0VGltZW91dCBzbyB0aGF0IHRocm93biBlcnJvcnMgZG9uJ3QgaGFsdCB0aGUgZXhlY3V0aW9uIG9mIFZlbG9jaXR5IGl0c2VsZi4gKi9cblx0ICAgICAgICAgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgICAgICAgICAgb3B0cy5jb21wbGV0ZS5jYWxsKGVsZW1lbnRzLCBlbGVtZW50cyk7XG5cdCAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuXHQgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IHRocm93IGVycm9yOyB9LCAxKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgIFByb21pc2UgUmVzb2x2aW5nXG5cdCAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgLyogTm90ZTogSW5maW5pdGUgbG9vcHMgZG9uJ3QgcmV0dXJuIHByb21pc2VzLiAqL1xuXHQgICAgICAgICAgICBpZiAocmVzb2x2ZXIgJiYgb3B0cy5sb29wICE9PSB0cnVlKSB7XG5cdCAgICAgICAgICAgICAgICByZXNvbHZlcihlbGVtZW50cyk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICBPcHRpb246IExvb3AgKEluZmluaXRlKVxuXHQgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpICYmIG9wdHMubG9vcCA9PT0gdHJ1ZSAmJiAhaXNTdG9wcGVkKSB7XG5cdCAgICAgICAgICAgICAgICAvKiBJZiBhIHJvdGF0ZVgvWS9aIHByb3BlcnR5IGlzIGJlaW5nIGFuaW1hdGVkIHRvIDM2MCBkZWcgd2l0aCBsb29wOnRydWUsIHN3YXAgdHdlZW4gc3RhcnQvZW5kIHZhbHVlcyB0byBlbmFibGVcblx0ICAgICAgICAgICAgICAgICAgIGNvbnRpbnVvdXMgaXRlcmF0aXZlIHJvdGF0aW9uIGxvb3BpbmcuIChPdGhlcmlzZSwgdGhlIGVsZW1lbnQgd291bGQganVzdCByb3RhdGUgYmFjayBhbmQgZm9ydGguKSAqL1xuXHQgICAgICAgICAgICAgICAgJC5lYWNoKERhdGEoZWxlbWVudCkudHdlZW5zQ29udGFpbmVyLCBmdW5jdGlvbihwcm9wZXJ0eU5hbWUsIHR3ZWVuQ29udGFpbmVyKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKC9ecm90YXRlLy50ZXN0KHByb3BlcnR5TmFtZSkgJiYgcGFyc2VGbG9hdCh0d2VlbkNvbnRhaW5lci5lbmRWYWx1ZSkgPT09IDM2MCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB0d2VlbkNvbnRhaW5lci5lbmRWYWx1ZSA9IDA7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuQ29udGFpbmVyLnN0YXJ0VmFsdWUgPSAzNjA7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKC9eYmFja2dyb3VuZFBvc2l0aW9uLy50ZXN0KHByb3BlcnR5TmFtZSkgJiYgcGFyc2VGbG9hdCh0d2VlbkNvbnRhaW5lci5lbmRWYWx1ZSkgPT09IDEwMCAmJiB0d2VlbkNvbnRhaW5lci51bml0VHlwZSA9PT0gXCIlXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW5Db250YWluZXIuZW5kVmFsdWUgPSAwO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB0d2VlbkNvbnRhaW5lci5zdGFydFZhbHVlID0gMTAwO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH0pO1xuXG5cdCAgICAgICAgICAgICAgICBWZWxvY2l0eShlbGVtZW50LCBcInJldmVyc2VcIiwgeyBsb29wOiB0cnVlLCBkZWxheTogb3B0cy5kZWxheSB9KTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8qKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgRGVxdWV1ZWluZ1xuXHQgICAgICAgICAgICAqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgLyogRmlyZSB0aGUgbmV4dCBjYWxsIGluIHRoZSBxdWV1ZSBzbyBsb25nIGFzIHRoaXMgY2FsbCdzIHF1ZXVlIHdhc24ndCBzZXQgdG8gZmFsc2UgKHRvIHRyaWdnZXIgYSBwYXJhbGxlbCBhbmltYXRpb24pLFxuXHQgICAgICAgICAgICAgICB3aGljaCB3b3VsZCBoYXZlIGFscmVhZHkgY2F1c2VkIHRoZSBuZXh0IGNhbGwgdG8gZmlyZS4gTm90ZTogRXZlbiBpZiB0aGUgZW5kIG9mIHRoZSBhbmltYXRpb24gcXVldWUgaGFzIGJlZW4gcmVhY2hlZCxcblx0ICAgICAgICAgICAgICAgJC5kZXF1ZXVlKCkgbXVzdCBzdGlsbCBiZSBjYWxsZWQgaW4gb3JkZXIgdG8gY29tcGxldGVseSBjbGVhciBqUXVlcnkncyBhbmltYXRpb24gcXVldWUuICovXG5cdCAgICAgICAgICAgIGlmIChvcHRzLnF1ZXVlICE9PSBmYWxzZSkge1xuXHQgICAgICAgICAgICAgICAgJC5kZXF1ZXVlKGVsZW1lbnQsIG9wdHMucXVldWUpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgIENhbGxzIEFycmF5IENsZWFudXBcblx0ICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAvKiBTaW5jZSB0aGlzIGNhbGwgaXMgY29tcGxldGUsIHNldCBpdCB0byBmYWxzZSBzbyB0aGF0IHRoZSByQUYgdGljayBza2lwcyBpdC4gVGhpcyBhcnJheSBpcyBsYXRlciBjb21wYWN0ZWQgdmlhIGNvbXBhY3RTcGFyc2VBcnJheSgpLlxuXHQgICAgICAgICAgKEZvciBwZXJmb3JtYW5jZSByZWFzb25zLCB0aGUgY2FsbCBpcyBzZXQgdG8gZmFsc2UgaW5zdGVhZCBvZiBiZWluZyBkZWxldGVkIGZyb20gdGhlIGFycmF5OiBodHRwOi8vd3d3Lmh0bWw1cm9ja3MuY29tL2VuL3R1dG9yaWFscy9zcGVlZC92OC8pICovXG5cdCAgICAgICAgVmVsb2NpdHkuU3RhdGUuY2FsbHNbY2FsbEluZGV4XSA9IGZhbHNlO1xuXG5cdCAgICAgICAgLyogSXRlcmF0ZSB0aHJvdWdoIHRoZSBjYWxscyBhcnJheSB0byBkZXRlcm1pbmUgaWYgdGhpcyB3YXMgdGhlIGZpbmFsIGluLXByb2dyZXNzIGFuaW1hdGlvbi5cblx0ICAgICAgICAgICBJZiBzbywgc2V0IGEgZmxhZyB0byBlbmQgdGlja2luZyBhbmQgY2xlYXIgdGhlIGNhbGxzIGFycmF5LiAqL1xuXHQgICAgICAgIGZvciAodmFyIGogPSAwLCBjYWxsc0xlbmd0aCA9IFZlbG9jaXR5LlN0YXRlLmNhbGxzLmxlbmd0aDsgaiA8IGNhbGxzTGVuZ3RoOyBqKyspIHtcblx0ICAgICAgICAgICAgaWYgKFZlbG9jaXR5LlN0YXRlLmNhbGxzW2pdICE9PSBmYWxzZSkge1xuXHQgICAgICAgICAgICAgICAgcmVtYWluaW5nQ2FsbHNFeGlzdCA9IHRydWU7XG5cblx0ICAgICAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKHJlbWFpbmluZ0NhbGxzRXhpc3QgPT09IGZhbHNlKSB7XG5cdCAgICAgICAgICAgIC8qIHRpY2soKSB3aWxsIGRldGVjdCB0aGlzIGZsYWcgdXBvbiBpdHMgbmV4dCBpdGVyYXRpb24gYW5kIHN1YnNlcXVlbnRseSB0dXJuIGl0c2VsZiBvZmYuICovXG5cdCAgICAgICAgICAgIFZlbG9jaXR5LlN0YXRlLmlzVGlja2luZyA9IGZhbHNlO1xuXG5cdCAgICAgICAgICAgIC8qIENsZWFyIHRoZSBjYWxscyBhcnJheSBzbyB0aGF0IGl0cyBsZW5ndGggaXMgcmVzZXQuICovXG5cdCAgICAgICAgICAgIGRlbGV0ZSBWZWxvY2l0eS5TdGF0ZS5jYWxscztcblx0ICAgICAgICAgICAgVmVsb2NpdHkuU3RhdGUuY2FsbHMgPSBbXTtcblx0ICAgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIC8qKioqKioqKioqKioqKioqKipcblx0ICAgICAgICBGcmFtZXdvcmtzXG5cdCAgICAqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgIC8qIEJvdGggalF1ZXJ5IGFuZCBaZXB0byBhbGxvdyB0aGVpciAkLmZuIG9iamVjdCB0byBiZSBleHRlbmRlZCB0byBhbGxvdyB3cmFwcGVkIGVsZW1lbnRzIHRvIGJlIHN1YmplY3RlZCB0byBwbHVnaW4gY2FsbHMuXG5cdCAgICAgICBJZiBlaXRoZXIgZnJhbWV3b3JrIGlzIGxvYWRlZCwgcmVnaXN0ZXIgYSBcInZlbG9jaXR5XCIgZXh0ZW5zaW9uIHBvaW50aW5nIHRvIFZlbG9jaXR5J3MgY29yZSBhbmltYXRlKCkgbWV0aG9kLiAgVmVsb2NpdHlcblx0ICAgICAgIGFsc28gcmVnaXN0ZXJzIGl0c2VsZiBvbnRvIGEgZ2xvYmFsIGNvbnRhaW5lciAod2luZG93LmpRdWVyeSB8fCB3aW5kb3cuWmVwdG8gfHwgd2luZG93KSBzbyB0aGF0IGNlcnRhaW4gZmVhdHVyZXMgYXJlXG5cdCAgICAgICBhY2Nlc3NpYmxlIGJleW9uZCBqdXN0IGEgcGVyLWVsZW1lbnQgc2NvcGUuIFRoaXMgbWFzdGVyIG9iamVjdCBjb250YWlucyBhbiAuYW5pbWF0ZSgpIG1ldGhvZCwgd2hpY2ggaXMgbGF0ZXIgYXNzaWduZWQgdG8gJC5mblxuXHQgICAgICAgKGlmIGpRdWVyeSBvciBaZXB0byBhcmUgcHJlc2VudCkuIEFjY29yZGluZ2x5LCBWZWxvY2l0eSBjYW4gYm90aCBhY3Qgb24gd3JhcHBlZCBET00gZWxlbWVudHMgYW5kIHN0YW5kIGFsb25lIGZvciB0YXJnZXRpbmcgcmF3IERPTSBlbGVtZW50cy4gKi9cblx0ICAgIGdsb2JhbC5WZWxvY2l0eSA9IFZlbG9jaXR5O1xuXG5cdCAgICBpZiAoZ2xvYmFsICE9PSB3aW5kb3cpIHtcblx0ICAgICAgICAvKiBBc3NpZ24gdGhlIGVsZW1lbnQgZnVuY3Rpb24gdG8gVmVsb2NpdHkncyBjb3JlIGFuaW1hdGUoKSBtZXRob2QuICovXG5cdCAgICAgICAgZ2xvYmFsLmZuLnZlbG9jaXR5ID0gYW5pbWF0ZTtcblx0ICAgICAgICAvKiBBc3NpZ24gdGhlIG9iamVjdCBmdW5jdGlvbidzIGRlZmF1bHRzIHRvIFZlbG9jaXR5J3MgZ2xvYmFsIGRlZmF1bHRzIG9iamVjdC4gKi9cblx0ICAgICAgICBnbG9iYWwuZm4udmVsb2NpdHkuZGVmYXVsdHMgPSBWZWxvY2l0eS5kZWZhdWx0cztcblx0ICAgIH1cblxuXHQgICAgLyoqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICBQYWNrYWdlZCBSZWRpcmVjdHNcblx0ICAgICoqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAvKiBzbGlkZVVwLCBzbGlkZURvd24gKi9cblx0ICAgICQuZWFjaChbIFwiRG93blwiLCBcIlVwXCIgXSwgZnVuY3Rpb24oaSwgZGlyZWN0aW9uKSB7XG5cdCAgICAgICAgVmVsb2NpdHkuUmVkaXJlY3RzW1wic2xpZGVcIiArIGRpcmVjdGlvbl0gPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0aW9ucywgZWxlbWVudHNJbmRleCwgZWxlbWVudHNTaXplLCBlbGVtZW50cywgcHJvbWlzZURhdGEpIHtcblx0ICAgICAgICAgICAgdmFyIG9wdHMgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucyksXG5cdCAgICAgICAgICAgICAgICBiZWdpbiA9IG9wdHMuYmVnaW4sXG5cdCAgICAgICAgICAgICAgICBjb21wbGV0ZSA9IG9wdHMuY29tcGxldGUsXG5cdCAgICAgICAgICAgICAgICBjb21wdXRlZFZhbHVlcyA9IHsgaGVpZ2h0OiBcIlwiLCBtYXJnaW5Ub3A6IFwiXCIsIG1hcmdpbkJvdHRvbTogXCJcIiwgcGFkZGluZ1RvcDogXCJcIiwgcGFkZGluZ0JvdHRvbTogXCJcIiB9LFxuXHQgICAgICAgICAgICAgICAgaW5saW5lVmFsdWVzID0ge307XG5cblx0ICAgICAgICAgICAgaWYgKG9wdHMuZGlzcGxheSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICAvKiBTaG93IHRoZSBlbGVtZW50IGJlZm9yZSBzbGlkZURvd24gYmVnaW5zIGFuZCBoaWRlIHRoZSBlbGVtZW50IGFmdGVyIHNsaWRlVXAgY29tcGxldGVzLiAqL1xuXHQgICAgICAgICAgICAgICAgLyogTm90ZTogSW5saW5lIGVsZW1lbnRzIGNhbm5vdCBoYXZlIGRpbWVuc2lvbnMgYW5pbWF0ZWQsIHNvIHRoZXkncmUgcmV2ZXJ0ZWQgdG8gaW5saW5lLWJsb2NrLiAqL1xuXHQgICAgICAgICAgICAgICAgb3B0cy5kaXNwbGF5ID0gKGRpcmVjdGlvbiA9PT0gXCJEb3duXCIgPyAoVmVsb2NpdHkuQ1NTLlZhbHVlcy5nZXREaXNwbGF5VHlwZShlbGVtZW50KSA9PT0gXCJpbmxpbmVcIiA/IFwiaW5saW5lLWJsb2NrXCIgOiBcImJsb2NrXCIpIDogXCJub25lXCIpO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgb3B0cy5iZWdpbiA9IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICAgICAgLyogSWYgdGhlIHVzZXIgcGFzc2VkIGluIGEgYmVnaW4gY2FsbGJhY2ssIGZpcmUgaXQgbm93LiAqL1xuXHQgICAgICAgICAgICAgICAgYmVnaW4gJiYgYmVnaW4uY2FsbChlbGVtZW50cywgZWxlbWVudHMpO1xuXG5cdCAgICAgICAgICAgICAgICAvKiBDYWNoZSB0aGUgZWxlbWVudHMnIG9yaWdpbmFsIHZlcnRpY2FsIGRpbWVuc2lvbmFsIHByb3BlcnR5IHZhbHVlcyBzbyB0aGF0IHdlIGNhbiBhbmltYXRlIGJhY2sgdG8gdGhlbS4gKi9cblx0ICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BlcnR5IGluIGNvbXB1dGVkVmFsdWVzKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaW5saW5lVmFsdWVzW3Byb3BlcnR5XSA9IGVsZW1lbnQuc3R5bGVbcHJvcGVydHldO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogRm9yIHNsaWRlRG93biwgdXNlIGZvcmNlZmVlZGluZyB0byBhbmltYXRlIGFsbCB2ZXJ0aWNhbCBwcm9wZXJ0aWVzIGZyb20gMC4gRm9yIHNsaWRlVXAsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgdXNlIGZvcmNlZmVlZGluZyB0byBzdGFydCBmcm9tIGNvbXB1dGVkIHZhbHVlcyBhbmQgYW5pbWF0ZSBkb3duIHRvIDAuICovXG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIHByb3BlcnR5VmFsdWUgPSBWZWxvY2l0eS5DU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBwcm9wZXJ0eSk7XG5cdCAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWRWYWx1ZXNbcHJvcGVydHldID0gKGRpcmVjdGlvbiA9PT0gXCJEb3duXCIpID8gWyBwcm9wZXJ0eVZhbHVlLCAwIF0gOiBbIDAsIHByb3BlcnR5VmFsdWUgXTtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgLyogRm9yY2UgdmVydGljYWwgb3ZlcmZsb3cgY29udGVudCB0byBjbGlwIHNvIHRoYXQgc2xpZGluZyB3b3JrcyBhcyBleHBlY3RlZC4gKi9cblx0ICAgICAgICAgICAgICAgIGlubGluZVZhbHVlcy5vdmVyZmxvdyA9IGVsZW1lbnQuc3R5bGUub3ZlcmZsb3c7XG5cdCAgICAgICAgICAgICAgICBlbGVtZW50LnN0eWxlLm92ZXJmbG93ID0gXCJoaWRkZW5cIjtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIG9wdHMuY29tcGxldGUgPSBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgICAgIC8qIFJlc2V0IGVsZW1lbnQgdG8gaXRzIHByZS1zbGlkZSBpbmxpbmUgdmFsdWVzIG9uY2UgaXRzIHNsaWRlIGFuaW1hdGlvbiBpcyBjb21wbGV0ZS4gKi9cblx0ICAgICAgICAgICAgICAgIGZvciAodmFyIHByb3BlcnR5IGluIGlubGluZVZhbHVlcykge1xuXHQgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuc3R5bGVbcHJvcGVydHldID0gaW5saW5lVmFsdWVzW3Byb3BlcnR5XTtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgLyogSWYgdGhlIHVzZXIgcGFzc2VkIGluIGEgY29tcGxldGUgY2FsbGJhY2ssIGZpcmUgaXQgbm93LiAqL1xuXHQgICAgICAgICAgICAgICAgY29tcGxldGUgJiYgY29tcGxldGUuY2FsbChlbGVtZW50cywgZWxlbWVudHMpO1xuXHQgICAgICAgICAgICAgICAgcHJvbWlzZURhdGEgJiYgcHJvbWlzZURhdGEucmVzb2x2ZXIoZWxlbWVudHMpO1xuXHQgICAgICAgICAgICB9O1xuXG5cdCAgICAgICAgICAgIFZlbG9jaXR5KGVsZW1lbnQsIGNvbXB1dGVkVmFsdWVzLCBvcHRzKTtcblx0ICAgICAgICB9O1xuXHQgICAgfSk7XG5cblx0ICAgIC8qIGZhZGVJbiwgZmFkZU91dCAqL1xuXHQgICAgJC5lYWNoKFsgXCJJblwiLCBcIk91dFwiIF0sIGZ1bmN0aW9uKGksIGRpcmVjdGlvbikge1xuXHQgICAgICAgIFZlbG9jaXR5LlJlZGlyZWN0c1tcImZhZGVcIiArIGRpcmVjdGlvbl0gPSBmdW5jdGlvbiAoZWxlbWVudCwgb3B0aW9ucywgZWxlbWVudHNJbmRleCwgZWxlbWVudHNTaXplLCBlbGVtZW50cywgcHJvbWlzZURhdGEpIHtcblx0ICAgICAgICAgICAgdmFyIG9wdHMgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucyksXG5cdCAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzTWFwID0geyBvcGFjaXR5OiAoZGlyZWN0aW9uID09PSBcIkluXCIpID8gMSA6IDAgfSxcblx0ICAgICAgICAgICAgICAgIG9yaWdpbmFsQ29tcGxldGUgPSBvcHRzLmNvbXBsZXRlO1xuXG5cdCAgICAgICAgICAgIC8qIFNpbmNlIHJlZGlyZWN0cyBhcmUgdHJpZ2dlcmVkIGluZGl2aWR1YWxseSBmb3IgZWFjaCBlbGVtZW50IGluIHRoZSBhbmltYXRlZCBzZXQsIGF2b2lkIHJlcGVhdGVkbHkgdHJpZ2dlcmluZ1xuXHQgICAgICAgICAgICAgICBjYWxsYmFja3MgYnkgZmlyaW5nIHRoZW0gb25seSB3aGVuIHRoZSBmaW5hbCBlbGVtZW50IGhhcyBiZWVuIHJlYWNoZWQuICovXG5cdCAgICAgICAgICAgIGlmIChlbGVtZW50c0luZGV4ICE9PSBlbGVtZW50c1NpemUgLSAxKSB7XG5cdCAgICAgICAgICAgICAgICBvcHRzLmNvbXBsZXRlID0gb3B0cy5iZWdpbiA9IG51bGw7XG5cdCAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICBvcHRzLmNvbXBsZXRlID0gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKG9yaWdpbmFsQ29tcGxldGUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luYWxDb21wbGV0ZS5jYWxsKGVsZW1lbnRzLCBlbGVtZW50cyk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgcHJvbWlzZURhdGEgJiYgcHJvbWlzZURhdGEucmVzb2x2ZXIoZWxlbWVudHMpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLyogSWYgYSBkaXNwbGF5IHdhcyBwYXNzZWQgaW4sIHVzZSBpdC4gT3RoZXJ3aXNlLCBkZWZhdWx0IHRvIFwibm9uZVwiIGZvciBmYWRlT3V0IG9yIHRoZSBlbGVtZW50LXNwZWNpZmljIGRlZmF1bHQgZm9yIGZhZGVJbi4gKi9cblx0ICAgICAgICAgICAgLyogTm90ZTogV2UgYWxsb3cgdXNlcnMgdG8gcGFzcyBpbiBcIm51bGxcIiB0byBza2lwIGRpc3BsYXkgc2V0dGluZyBhbHRvZ2V0aGVyLiAqL1xuXHQgICAgICAgICAgICBpZiAob3B0cy5kaXNwbGF5ID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgIG9wdHMuZGlzcGxheSA9IChkaXJlY3Rpb24gPT09IFwiSW5cIiA/IFwiYXV0b1wiIDogXCJub25lXCIpO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgVmVsb2NpdHkodGhpcywgcHJvcGVydGllc01hcCwgb3B0cyk7XG5cdCAgICAgICAgfTtcblx0ICAgIH0pO1xuXG5cdCAgICByZXR1cm4gVmVsb2NpdHk7XG5cdH0oKHdpbmRvdy5qUXVlcnkgfHwgd2luZG93LlplcHRvIHx8IHdpbmRvdyksIHdpbmRvdywgZG9jdW1lbnQpO1xuXHR9KSk7XG5cblx0LyoqKioqKioqKioqKioqKioqKlxuXHQgICBLbm93biBJc3N1ZXNcblx0KioqKioqKioqKioqKioqKioqL1xuXG5cdC8qIFRoZSBDU1Mgc3BlYyBtYW5kYXRlcyB0aGF0IHRoZSB0cmFuc2xhdGVYL1kvWiB0cmFuc2Zvcm1zIGFyZSAlLXJlbGF0aXZlIHRvIHRoZSBlbGVtZW50IGl0c2VsZiAtLSBub3QgaXRzIHBhcmVudC5cblx0VmVsb2NpdHksIGhvd2V2ZXIsIGRvZXNuJ3QgbWFrZSB0aGlzIGRpc3RpbmN0aW9uLiBUaHVzLCBjb252ZXJ0aW5nIHRvIG9yIGZyb20gdGhlICUgdW5pdCB3aXRoIHRoZXNlIHN1YnByb3BlcnRpZXNcblx0d2lsbCBwcm9kdWNlIGFuIGluYWNjdXJhdGUgY29udmVyc2lvbiB2YWx1ZS4gVGhlIHNhbWUgaXNzdWUgZXhpc3RzIHdpdGggdGhlIGN4L2N5IGF0dHJpYnV0ZXMgb2YgU1ZHIGNpcmNsZXMgYW5kIGVsbGlwc2VzLiAqL1xuXG4vKioqLyB9LFxuLyogNCAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0dmFyIEZseW91dEZhY3RvcnkgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICB2YXIgcGFkZGluZyA9IDEwO1xuXHQgIHZhciBob3ZlcmFibGVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLWZseW91dF0nKSk7XG5cblx0ICBob3ZlcmFibGVzLmZvckVhY2goZnVuY3Rpb24oaG92ZXJhYmxlKSB7XG5cdCAgICB2YXIgZmx5b3V0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycgKyBob3ZlcmFibGUuZ2V0QXR0cmlidXRlKCdkYXRhLWZseW91dCcpKTtcblxuXHQgICAgaG92ZXJhYmxlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIGZ1bmN0aW9uKCkge1xuXHQgICAgICBmbHlvdXQuY2xhc3NMaXN0LnJlbW92ZSgnZmx5b3V0LWhpZGRlbicpO1xuXHQgICAgICB2YXIgbm9kZSA9IGhvdmVyYWJsZTtcblx0ICAgICAgdmFyIGxlZnQgPSAwO1xuXHQgICAgICB2YXIgdG9wID0gMDtcblxuXHQgICAgICBkbyB7XG5cdCAgICAgICAgbGVmdCArPSBub2RlLm9mZnNldExlZnQ7XG5cdCAgICAgICAgdG9wICs9IG5vZGUub2Zmc2V0VG9wO1xuXHQgICAgICB9IHdoaWxlICgobm9kZSA9IG5vZGUub2Zmc2V0UGFyZW50KSAhPT0gbnVsbCk7XG5cblx0ICAgICAgbGVmdCA9IGxlZnQgKyBob3ZlcmFibGUub2Zmc2V0V2lkdGggLyAyO1xuXHQgICAgICB0b3AgPSB0b3AgKyBob3ZlcmFibGUub2Zmc2V0SGVpZ2h0ICsgcGFkZGluZztcblxuXHQgICAgICBmbHlvdXQuc3R5bGUubGVmdCA9IGxlZnQgKyAncHgnO1xuXHQgICAgICBmbHlvdXQuc3R5bGUudG9wID0gdG9wICsgJ3B4Jztcblx0ICAgIH0pO1xuXG5cdCAgICBob3ZlcmFibGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdXQnLCBmdW5jdGlvbigpIHtcblx0ICAgICAgZmx5b3V0LmNsYXNzTGlzdC5hZGQoJ2ZseW91dC1oaWRkZW4nKTtcblx0ICAgIH0pO1xuXHQgIH0pO1xuXG5cdH1cblxuXG4vKioqLyB9LFxuLyogNSAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0dmFyIE1lbnVGYWN0b3J5ID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgdmFyIG1lbnVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCcubWVudScpKTtcblx0ICB2YXIgdG9nZ2xlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtbWVudS10b2dnbGVdJykpO1xuXG5cdCAgdG9nZ2xlcy5mb3JFYWNoKGZ1bmN0aW9uKHRvZ2dsZSkge1xuXHQgICAgdG9nZ2xlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdCAgICAgIHZhciBtZW51ID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcjJyArIHRvZ2dsZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbWVudS10b2dnbGUnKSk7XG5cdCAgICAgIG1lbnUuY2xhc3NMaXN0LnRvZ2dsZSgnYWN0aXZlJyk7XG5cdCAgICB9KTtcblx0ICB9KTtcblxuXHQgIG1lbnVzLmZvckVhY2goZnVuY3Rpb24obWVudSkge1xuXHQgICAgdmFyIGRpc21pc3NhbHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChtZW51LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW1lbnUtZGlzbWlzc10nKSk7XG5cblx0ICAgIGRpc21pc3NhbHMuZm9yRWFjaChmdW5jdGlvbihkaXNtaXNzYWwpIHtcblx0ICAgICAgZGlzbWlzc2FsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgbWVudS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcblx0ICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1tZW51LXRvZ2dsZT1cIicgKyBtZW51LmlkICsgJ1wiXScpLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuXHQgICAgICB9KTtcblx0ICAgIH0pO1xuXHQgIH0pO1xuXHR9XG5cblxuLyoqKi8gfSxcbi8qIDYgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdHZhciBNb2RhbEZhY3RvcnkgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICB0aGlzLnJvb3QgPSBlbGVtZW50O1xuXHQgIHRoaXMuZGlzbWlzc2FscyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW1vZGFsLWRpc21pc3NdJykpO1xuXHQgIHRoaXMub3BlbmVycyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW1vZGFsXScpKTtcblx0ICB0aGlzLmF0dGFjaEV2ZW50cygpO1xuXHR9XG5cblx0TW9kYWxGYWN0b3J5LnByb3RvdHlwZSA9IHtcblx0ICBhdHRhY2hFdmVudHM6IGZ1bmN0aW9uKCkge1xuXHQgICAgdGhpcy5kaXNtaXNzYWxzLmZvckVhY2goZnVuY3Rpb24gKGRpc21pc3NhbCkge1xuXHQgICAgICBkaXNtaXNzYWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmRpc21pc3MuYmluZCh0aGlzKSk7XG5cdCAgICB9LCB0aGlzKTtcblxuXHQgICAgdGhpcy5vcGVuZXJzLmZvckVhY2goZnVuY3Rpb24gKG9wZW5lcikge1xuXHQgICAgICBvcGVuZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm9wZW4uYmluZCh0aGlzKSk7XG5cdCAgICB9LCB0aGlzKTtcblxuXHQgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBmdW5jdGlvbihldmVudCkge1xuXHQgICAgICB2YXIga2V5ID0gZXZlbnQud2hpY2ggfHwgZXZlbnQua2V5Q29kZTtcblxuXHQgICAgICAvLyBFU0Ncblx0ICAgICAgaWYgKGtleSA9PT0gMjcpIHtcblx0ICAgICAgICB2YXIgbW9kYWxzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLm1vZGFsOm5vdCgubW9kYWwtaGlkZGVuKScpKTtcblx0ICAgICAgICBtb2RhbHMuZm9yRWFjaChmdW5jdGlvbihtb2RhbCkge1xuXHQgICAgICAgICAgbW9kYWwuY2xhc3NMaXN0LmFkZCgnbW9kYWwtaGlkZGVuJyk7XG5cdCAgICAgICAgfSk7XG5cdCAgICAgIH1cblx0ICAgIH0pO1xuXHQgIH0sXG5cdCAgb3BlbjogZnVuY3Rpb24oZXZlbnQpIHtcblx0ICAgIHZhciBtb2RhbCA9IGV2ZW50LnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtbW9kYWwnKTtcblx0ICAgIG1vZGFsID0gdGhpcy5yb290LnF1ZXJ5U2VsZWN0b3IoJyMnICsgbW9kYWwpO1xuXHQgICAgbW9kYWwuY2xhc3NMaXN0LnJlbW92ZSgnbW9kYWwtaGlkZGVuJyk7XG5cdCAgfSxcblx0ICBkaXNtaXNzOiBmdW5jdGlvbihldmVudCkge1xuXHQgICAgdmFyIHRhcmdldCA9IGV2ZW50LnRhcmdldDtcblx0ICAgIHZhciBjbG9zZWFibGUgPSB0YXJnZXQgPT09IGV2ZW50LmN1cnJlbnRUYXJnZXQgJiZcblx0ICAgICAgdGFyZ2V0LmNsYXNzTGlzdC5jb250YWlucygnbW9kYWwtb3ZlcmxheScpO1xuXG5cdCAgICBkbyB7XG5cdCAgICAgIGlmICh0YXJnZXQuaGFzQXR0cmlidXRlKCdkYXRhLW1vZGFsLWRpc21pc3MnKSAmJlxuXHQgICAgICAgICAgIXRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ21vZGFsJykpIHtcblx0ICAgICAgICBjbG9zZWFibGUgPSB0cnVlO1xuXHQgICAgICB9IGVsc2UgaWYgKHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ21vZGFsJykgJiYgY2xvc2VhYmxlKSB7XG5cdCAgICAgICAgcmV0dXJuIHRhcmdldC5jbGFzc0xpc3QuYWRkKCdtb2RhbC1oaWRkZW4nKTtcblx0ICAgICAgfSBlbHNlIGlmICh0YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdtb2RhbCcpKXtcblx0ICAgICAgICByZXR1cm47XG5cdCAgICAgIH1cblx0ICAgIH0gd2hpbGUoKHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlKSAhPT0gdGhpcy5yb290KTtcblx0ICB9XG5cdH07XG5cblxuLyoqKi8gfSxcbi8qIDcgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdHZhciBUb2dnbGVGYWN0b3J5ID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgdmFyIHRvZ2dsZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkoZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS10b2dnbGVdJykpO1xuXHQgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG5cblx0ICB0b2dnbGVzLmZvckVhY2goZnVuY3Rpb24odG9nZ2xlKSB7XG5cdCAgICB0b2dnbGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpKTtcblx0ICB9LCB0aGlzKTtcblx0fVxuXG5cdFRvZ2dsZUZhY3RvcnkucHJvdG90eXBlID0ge1xuXHQgIHRvZ2dsZTogZnVuY3Rpb24oZXZlbnQpIHtcblx0ICAgIHZhciB0YXJnZXQgPSBldmVudC50YXJnZXQ7XG5cblx0ICAgIGRvIHtcblx0ICAgICAgaWYgKHRhcmdldC5oYXNBdHRyaWJ1dGUoJ2RhdGEtdG9nZ2xlJykpIHtcblx0ICAgICAgICByZXR1cm4gdGFyZ2V0LmNsYXNzTGlzdC50b2dnbGUoJ2FjdGl2ZScpXG5cdCAgICAgIH1cblx0ICAgIH0gd2hpbGUoKHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlKSAhPT0gdGhpcy5lbGVtZW50KVxuXHQgIH1cblx0fVxuXG5cbi8qKiovIH0sXG4vKiA4ICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHR2YXIgU2hlcGhlcmQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDkpO1xuXG5cdC8vIEN1c3RvbUV2ZW50IHBvbHlmaWxsIGZvciBJRTEwLzExIChmcm9tIGZyb250ZW5kLXV0aWxzKVxuXHR2YXIgQ3VzdG9tRXZlbnQgPSBmdW5jdGlvbihldmVudE5hbWUsIHBhcmFtcykge1xuXHQgIHZhciBldmVudFBhcmFtcyA9IHsgYnViYmxlczogZmFsc2UsIGNhbmNlbGFibGU6IGZhbHNlLCBkZXRhaWw6IHVuZGVmaW5lZCB9O1xuXG5cdCAgZm9yICh2YXIga2V5IGluIHBhcmFtcykge1xuXHQgICAgaWYgKHBhcmFtcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdCAgICAgIGV2ZW50UGFyYW1zW2tleV0gPSBwYXJhbXNba2V5XTtcblx0ICAgIH1cblx0ICB9XG5cblx0ICB2YXIgY3VzdG9tRXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKTtcblxuXHQgIGN1c3RvbUV2ZW50LmluaXRDdXN0b21FdmVudChcblx0ICAgIGV2ZW50TmFtZSxcblx0ICAgIGV2ZW50UGFyYW1zLmJ1YmJsZXMsXG5cdCAgICBldmVudFBhcmFtcy5jYW5jZWxhYmxlLFxuXHQgICAgZXZlbnRQYXJhbXMuZGV0YWlsXG5cdCAgKTtcblxuXHQgIHJldHVybiBjdXN0b21FdmVudDtcblx0fTtcblxuXHR2YXIgVG91ckZhY3RvcnkgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICB0aGlzLnJvb3QgPSBlbGVtZW50O1xuXHQgIHRoaXMudG91ckVsZW1lbnRzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtdG91cl0nKSk7XG5cblx0ICBpZiAodGhpcy50b3VyRWxlbWVudHMubGVuZ3RoID4gMCkge1xuXHQgICAgdGhpcy50b3VycyA9IHt9O1xuXHQgICAgdGhpcy5jdXJyZW50VG91ck5hbWUgPSBudWxsO1xuXG5cdCAgICB0aGlzLm9wZW5lcnMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkoZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS10b3VyLW9wZW5lcl0nKSk7XG5cblx0ICAgIHZhciB0b3VyT3ZlcmxheUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0ICAgIHRvdXJPdmVybGF5RWxlbWVudC5jbGFzc0xpc3QuYWRkKCd0b3VyLW92ZXJsYXknLCAnb3ZlcmxheS1oaWRkZW4nKTtcblx0ICAgIHRoaXMudG91ck92ZXJsYXkgPSBlbGVtZW50LmJvZHkuYXBwZW5kQ2hpbGQodG91ck92ZXJsYXlFbGVtZW50KTtcblxuXHQgICAgdGhpcy5pbml0aWFsaXplKCk7XG5cblx0ICAgIC8vIE9wZW4gYWxsIHRvdXJzIHdpdGhvdXQgb3BlbmVycyBpbW1lZGlhdGVseVxuXHQgICAgaWYgKHRoaXMub3BlbmVycy5sZW5ndGggPCB0aGlzLnRvdXJFbGVtZW50cy5sZW5ndGgpIHtcblx0ICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuXHQgICAgICB2YXIgb3BlbmVyTmFtZXMgPSB0aGF0Lm9wZW5lcnMubWFwKGZ1bmN0aW9uKG9wZW5lcikgeyByZXR1cm4gb3BlbmVyLmdldEF0dHJpYnV0ZSgnZGF0YS10b3VyLW9wZW5lcicpOyB9KTtcblxuXHQgICAgICB0aGF0LnRvdXJFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uKHRvdXJFbGVtZW50KSB7XG5cdCAgICAgICAgdmFyIHRvdXJOYW1lID0gdG91ckVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXRvdXItbmFtZScpO1xuXHQgICAgICAgIGlmICghb3BlbmVyTmFtZXMuaW5jbHVkZXModG91ck5hbWUpKSB7XG5cdCAgICAgICAgICB0aGF0Lm9wZW5Ub3VyKHRvdXJOYW1lKTtcblx0ICAgICAgICB9XG5cdCAgICAgIH0pO1xuXHQgICAgfVxuXHQgIH1cblx0fVxuXG5cdFRvdXJGYWN0b3J5LnByb3RvdHlwZSA9IHtcblx0ICBpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0ICAgIHZhciB0aGF0ID0gdGhpcztcblxuXHQgICAgdGhhdC50b3VyRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbih0b3VyRWxlbWVudCkge1xuXHQgICAgICB0aGF0LmluaXRpYWxpemVUb3VyKHRvdXJFbGVtZW50KTtcblx0ICAgIH0pO1xuXG5cdCAgICB0aGF0LmF0dGFjaEV2ZW50cygpO1xuXHQgIH0sXG5cdCAgaW5pdGlhbGl6ZVRvdXI6IGZ1bmN0aW9uKHRvdXJFbGVtZW50KSB7XG5cdCAgICB2YXIgdGhhdCA9IHRoaXM7XG5cdCAgICB2YXIgdG91ck5hbWUgPSB0b3VyRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdG91ci1uYW1lJyk7XG5cblx0ICAgIHZhciB0b3VyID0gbmV3IFNoZXBoZXJkLlRvdXIoe1xuXHQgICAgICBkZWZhdWx0czoge1xuXHQgICAgICAgIHNob3dDYW5jZWxMaW5rOiB0cnVlLFxuXHQgICAgICAgIGJ1dHRvbnM6IFtcblx0ICAgICAgICAgIHtcblx0ICAgICAgICAgICAgdGV4dDogdG91ckVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXRvdXItc2tpcCcpLFxuXHQgICAgICAgICAgICBjbGFzc2VzOiAnYnRuLWRlZmF1bHQnLFxuXHQgICAgICAgICAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICAgIHRoYXQuY2xvc2VUb3VyKHRvdXJOYW1lKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgfSxcblx0ICAgICAgICAgIHtcblx0ICAgICAgICAgICAgdGV4dDogdG91ckVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXRvdXItbmV4dCcpLFxuXHQgICAgICAgICAgICBjbGFzc2VzOiAnYnRuLXByaW1hcnknLFxuXHQgICAgICAgICAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICAgIHRoYXQuY2xpY2tOZXh0KHRvdXJOYW1lKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgfVxuXHQgICAgICAgIF1cblx0ICAgICAgfVxuXHQgICAgfSk7XG5cblx0ICAgIHRoYXQudG91cnNbdG91ck5hbWVdID0ge1xuXHQgICAgICB0b3VyOiB0b3VyLFxuXHQgICAgICBuYW1lOiB0b3VyTmFtZVxuXHQgICAgfTtcblx0ICAgIHRoYXQuYWRkU3RlcHModG91ciwgdG91ckVsZW1lbnQpO1xuXHQgIH0sXG5cdCAgYWRkU3RlcHM6IGZ1bmN0aW9uKHRvdXIsIHRvdXJFbGVtZW50KSB7XG5cdCAgICB2YXIgdGhhdCA9IHRoaXM7XG5cblx0ICAgIHZhciBzdGVwcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseSh0b3VyRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS10b3VyLXN0ZXBdJykpO1xuXHQgICAgdmFyIHNvcnRlZFN0ZXBzID0gc3RlcHMuc29ydChmdW5jdGlvbihhLCBiKSB7XG5cdCAgICAgIHZhciBzdGVwQSA9IHBhcnNlSW50KGEuZ2V0QXR0cmlidXRlKCdkYXRhLXN0ZXAtbnVtYmVyJykpO1xuXHQgICAgICB2YXIgc3RlcEIgPSBwYXJzZUludChiLmdldEF0dHJpYnV0ZSgnZGF0YS1zdGVwLW51bWJlcicpKTtcblxuXHQgICAgICBpZiAoc3RlcEEgPiBzdGVwQikge1xuXHQgICAgICAgIHJldHVybiAxO1xuXHQgICAgICB9IGVsc2UgaWYgKHN0ZXBBIDwgc3RlcEIpIHtcblx0ICAgICAgICByZXR1cm4gLTE7XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgcmV0dXJuIDA7XG5cdCAgICAgIH1cblx0ICAgIH0pO1xuXG5cdCAgICBzb3J0ZWRTdGVwcy5mb3JFYWNoKGZ1bmN0aW9uKHN0ZXAsIGluZGV4KSB7XG5cdCAgICAgIHZhciBzdGVwQ29uZmlnID0ge1xuXHQgICAgICAgIHRpdGxlOiBzdGVwLmdldEF0dHJpYnV0ZSgnZGF0YS10aXRsZScpIHx8ICcnLFxuXHQgICAgICAgIHRleHQ6IHN0ZXAuaW5uZXJIVE1MLFxuXHQgICAgICB9O1xuXG5cdCAgICAgIHZhciBjbGFzc2VzID0gc3RlcC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY2xhc3NlcycpIHx8ICcnO1xuXG5cdCAgICAgIHZhciBhdHRhY2hUb0VsZW1lbnQgPSBzdGVwLmdldEF0dHJpYnV0ZSgnZGF0YS1hdHRhY2gtdG8tZWxlbWVudCcpO1xuXHQgICAgICB2YXIgYXR0YWNoVG9Qb3NpdGlvbiA9IHN0ZXAuZ2V0QXR0cmlidXRlKCdkYXRhLWF0dGFjaC10by1wb3NpdGlvbicpO1xuXHQgICAgICB2YXIgcG9zaXRpb25PZmZzZXQgPSB7XG5cdCAgICAgICAgbGVmdDogJzAgMjVweCcsXG5cdCAgICAgICAgcmlnaHQ6ICcwIC0yNXB4Jyxcblx0ICAgICAgICB0b3A6ICcyNXB4IDAnLFxuXHQgICAgICAgIGJvdHRvbTogJy0yNXB4IDAnXG5cdCAgICAgIH1bYXR0YWNoVG9Qb3NpdGlvbl07XG5cblx0ICAgICAgaWYgKGNsYXNzZXMpIHtcblx0ICAgICAgICBzdGVwQ29uZmlnLmNsYXNzZXMgPSBjbGFzc2VzLnNwbGl0KCcgJyk7XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAoYXR0YWNoVG9FbGVtZW50ICYmIGF0dGFjaFRvUG9zaXRpb24gJiYgcG9zaXRpb25PZmZzZXQpIHtcblx0ICAgICAgICBzdGVwQ29uZmlnLmF0dGFjaFRvID0ge1xuXHQgICAgICAgICAgZWxlbWVudDogYXR0YWNoVG9FbGVtZW50LFxuXHQgICAgICAgICAgb246IGF0dGFjaFRvUG9zaXRpb25cblx0ICAgICAgICB9O1xuXG5cdCAgICAgICAgc3RlcENvbmZpZy50ZXRoZXJPcHRpb25zID0ge1xuXHQgICAgICAgICAgb2Zmc2V0OiBwb3NpdGlvbk9mZnNldFxuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXG5cdCAgICAgIGlmIChzb3J0ZWRTdGVwcy5sZW5ndGggLSAxID09PSBpbmRleCkge1xuXHQgICAgICAgIHN0ZXBDb25maWcuYnV0dG9ucyA9IFtcblx0ICAgICAgICAgIHtcblx0ICAgICAgICAgICAgdGV4dDogdG91ckVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXRvdXItZG9uZScpLFxuXHQgICAgICAgICAgICBjbGFzc2VzOiAnYnRuLXByaW1hcnknLFxuXHQgICAgICAgICAgICBhY3Rpb246IHRvdXIuY29tcGxldGVcblx0ICAgICAgICAgIH1cblx0ICAgICAgICBdO1xuXHQgICAgICB9XG5cblx0ICAgICAgdG91ci5hZGRTdGVwKHN0ZXBDb25maWcpO1xuXG5cdCAgICAgIHRvdXIub24oJ2FjdGl2ZScsIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIHRoYXQudG91ck92ZXJsYXkuY2xhc3NMaXN0LnJlbW92ZSgnb3ZlcmxheS1oaWRkZW4nKTtcblx0ICAgICAgfSk7XG5cblx0ICAgICAgdG91ci5vbignaW5hY3RpdmUnLCBmdW5jdGlvbigpIHtcblx0ICAgICAgICB0aGF0LnRvdXJPdmVybGF5LmNsYXNzTGlzdC5hZGQoJ292ZXJsYXktaGlkZGVuJyk7XG5cdCAgICAgIH0pO1xuXHQgICAgfSk7XG5cdCAgfSxcblx0ICBhdHRhY2hFdmVudHM6IGZ1bmN0aW9uKCkge1xuXHQgICAgdmFyIHRoYXQgPSB0aGlzO1xuXG5cdCAgICB0aGF0Lm9wZW5lcnMuZm9yRWFjaChmdW5jdGlvbiAob3BlbmVyKSB7XG5cdCAgICAgIG9wZW5lci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoYXQub3BlblRvdXIuYmluZCh0aGF0LCBvcGVuZXIuZ2V0QXR0cmlidXRlKCdkYXRhLXRvdXItb3BlbmVyJykpKTtcblx0ICAgIH0sIHRoYXQpO1xuXG5cdCAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cdCAgICAgIHZhciBrZXkgPSBldmVudC53aGljaCB8fCBldmVudC5rZXlDb2RlO1xuXG5cdCAgICAgIGlmICh0aGF0LmN1cnJlbnRUb3VyTmFtZSA9PT0gbnVsbCkge1xuXHQgICAgICAgIHJldHVybjtcblx0ICAgICAgfVxuXG5cdCAgICAgIC8vIEVTQ1xuXHQgICAgICBpZiAoa2V5ID09PSAyNykge1xuXHQgICAgICAgIHRoYXQuY2xvc2VUb3VyKHRoYXQuY3VycmVudFRvdXJOYW1lKTtcblx0ICAgICAgfVxuXHQgICAgfSk7XG5cblx0ICAgIHRoYXQudG91ck92ZXJsYXkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0ICAgICAgdGhhdC5jbG9zZVRvdXIodGhhdC5jdXJyZW50VG91ck5hbWUpO1xuXHQgICAgfSk7XG5cdCAgfSxcblx0ICBvcGVuVG91cjogZnVuY3Rpb24odG91ck5hbWUpIHtcblx0ICAgIHZhciB0b3VyT2JqZWN0ID0gdGhpcy50b3Vyc1t0b3VyTmFtZV07XG5cblx0ICAgIHRoaXMuY3VycmVudFRvdXJOYW1lID0gdG91ck9iamVjdC5uYW1lO1xuXG5cdCAgICB0b3VyT2JqZWN0LnRvdXIuc3RhcnQoKTtcblx0ICAgIHRoaXMudG91ck92ZXJsYXkuY2xhc3NMaXN0LnJlbW92ZSgndG91ci1vdmVybGF5LWhpZGRlbicpO1xuXHQgIH0sXG5cdCAgY2xpY2tOZXh0OiBmdW5jdGlvbih0b3VyTmFtZSkge1xuXHQgICAgdmFyIHRvdXJPYmplY3QgPSB0aGlzLnRvdXJzW3RvdXJOYW1lXTtcblx0ICAgIHZhciBwYXlsb2FkID0ge1xuXHQgICAgICBjdXJyZW50U3RlcDogdG91ck9iamVjdC50b3VyLmdldEN1cnJlbnRTdGVwKCkuaWQucmVwbGFjZSgnc3RlcC0nLCAnJyksXG5cdCAgICAgIHRvdXJOYW1lOiB0b3VyT2JqZWN0Lm5hbWVcblx0ICAgIH07XG5cblx0ICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KCduZXh0JywgeyAnZGV0YWlsJzogcGF5bG9hZCB9KSk7XG5cdCAgICB0b3VyT2JqZWN0LnRvdXIubmV4dCgpO1xuXHQgIH0sXG5cdCAgY2xvc2VUb3VyOiBmdW5jdGlvbih0b3VyTmFtZSkge1xuXHQgICAgdmFyIHRvdXJPYmplY3QgPSB0aGlzLnRvdXJzW3RvdXJOYW1lXTtcblx0ICAgIHZhciBwYXlsb2FkID0ge1xuXHQgICAgICBjdXJyZW50U3RlcDogdG91ck9iamVjdC50b3VyLmdldEN1cnJlbnRTdGVwKCkuaWQucmVwbGFjZSgnc3RlcC0nLCAnJyksXG5cdCAgICAgIHRvdXJOYW1lOiB0b3VyT2JqZWN0Lm5hbWVcblx0ICAgIH07XG5cblx0ICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KCdjYW5jZWwnLCB7ICdkZXRhaWwnOiBwYXlsb2FkIH0pKTtcblx0ICAgIHRvdXJPYmplY3QudG91ci5jYW5jZWwoKTtcblx0ICB9XG5cdH07XG5cblxuLyoqKi8gfSxcbi8qIDkgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdHZhciBfX1dFQlBBQ0tfQU1EX0RFRklORV9GQUNUT1JZX18sIF9fV0VCUEFDS19BTURfREVGSU5FX0FSUkFZX18sIF9fV0VCUEFDS19BTURfREVGSU5FX1JFU1VMVF9fOy8qISB0ZXRoZXItc2hlcGhlcmQgMS4yLjAgKi9cblxuXHQoZnVuY3Rpb24ocm9vdCwgZmFjdG9yeSkge1xuXHQgIGlmICh0cnVlKSB7XG5cdCAgICAhKF9fV0VCUEFDS19BTURfREVGSU5FX0FSUkFZX18gPSBbX193ZWJwYWNrX3JlcXVpcmVfXygxMCldLCBfX1dFQlBBQ0tfQU1EX0RFRklORV9GQUNUT1JZX18gPSAoZmFjdG9yeSksIF9fV0VCUEFDS19BTURfREVGSU5FX1JFU1VMVF9fID0gKHR5cGVvZiBfX1dFQlBBQ0tfQU1EX0RFRklORV9GQUNUT1JZX18gPT09ICdmdW5jdGlvbicgPyAoX19XRUJQQUNLX0FNRF9ERUZJTkVfRkFDVE9SWV9fLmFwcGx5KGV4cG9ydHMsIF9fV0VCUEFDS19BTURfREVGSU5FX0FSUkFZX18pKSA6IF9fV0VCUEFDS19BTURfREVGSU5FX0ZBQ1RPUllfXyksIF9fV0VCUEFDS19BTURfREVGSU5FX1JFU1VMVF9fICE9PSB1bmRlZmluZWQgJiYgKG1vZHVsZS5leHBvcnRzID0gX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX18pKTtcblx0ICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ3RldGhlcicpKTtcblx0ICB9IGVsc2Uge1xuXHQgICAgcm9vdC5TaGVwaGVyZCA9IGZhY3Rvcnkocm9vdC5UZXRoZXIpO1xuXHQgIH1cblx0fSh0aGlzLCBmdW5jdGlvbihUZXRoZXIpIHtcblxuXHQvKiBnbG9iYWwgVGV0aGVyICovXG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKCd2YWx1ZScgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cblx0dmFyIF9nZXQgPSBmdW5jdGlvbiBnZXQoX3g1LCBfeDYsIF94NykgeyB2YXIgX2FnYWluID0gdHJ1ZTsgX2Z1bmN0aW9uOiB3aGlsZSAoX2FnYWluKSB7IHZhciBvYmplY3QgPSBfeDUsIHByb3BlcnR5ID0gX3g2LCByZWNlaXZlciA9IF94NzsgZGVzYyA9IHBhcmVudCA9IGdldHRlciA9IHVuZGVmaW5lZDsgX2FnYWluID0gZmFsc2U7IGlmIChvYmplY3QgPT09IG51bGwpIG9iamVjdCA9IEZ1bmN0aW9uLnByb3RvdHlwZTsgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgcHJvcGVydHkpOyBpZiAoZGVzYyA9PT0gdW5kZWZpbmVkKSB7IHZhciBwYXJlbnQgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqZWN0KTsgaWYgKHBhcmVudCA9PT0gbnVsbCkgeyByZXR1cm4gdW5kZWZpbmVkOyB9IGVsc2UgeyBfeDUgPSBwYXJlbnQ7IF94NiA9IHByb3BlcnR5OyBfeDcgPSByZWNlaXZlcjsgX2FnYWluID0gdHJ1ZTsgY29udGludWUgX2Z1bmN0aW9uOyB9IH0gZWxzZSBpZiAoJ3ZhbHVlJyBpbiBkZXNjKSB7IHJldHVybiBkZXNjLnZhbHVlOyB9IGVsc2UgeyB2YXIgZ2V0dGVyID0gZGVzYy5nZXQ7IGlmIChnZXR0ZXIgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gdW5kZWZpbmVkOyB9IHJldHVybiBnZXR0ZXIuY2FsbChyZWNlaXZlcik7IH0gfSB9O1xuXG5cdGZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG5cdGZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09ICdmdW5jdGlvbicgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90ICcgKyB0eXBlb2Ygc3VwZXJDbGFzcyk7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcykgOiBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzOyB9XG5cblx0dmFyIF9UZXRoZXIkVXRpbHMgPSBUZXRoZXIuVXRpbHM7XG5cdHZhciBFdmVudGVkID0gX1RldGhlciRVdGlscy5FdmVudGVkO1xuXHR2YXIgYWRkQ2xhc3MgPSBfVGV0aGVyJFV0aWxzLmFkZENsYXNzO1xuXHR2YXIgZXh0ZW5kID0gX1RldGhlciRVdGlscy5leHRlbmQ7XG5cdHZhciBoYXNDbGFzcyA9IF9UZXRoZXIkVXRpbHMuaGFzQ2xhc3M7XG5cdHZhciByZW1vdmVDbGFzcyA9IF9UZXRoZXIkVXRpbHMucmVtb3ZlQ2xhc3M7XG5cdHZhciB1bmlxdWVJZCA9IF9UZXRoZXIkVXRpbHMudW5pcXVlSWQ7XG5cblx0dmFyIFNoZXBoZXJkID0gbmV3IEV2ZW50ZWQoKTtcblxuXHR2YXIgQVRUQUNITUVOVCA9IHtcblx0ICAndG9wJzogJ2JvdHRvbSBjZW50ZXInLFxuXHQgICdsZWZ0JzogJ21pZGRsZSByaWdodCcsXG5cdCAgJ3JpZ2h0JzogJ21pZGRsZSBsZWZ0Jyxcblx0ICAnYm90dG9tJzogJ3RvcCBjZW50ZXInLFxuXHQgICdjZW50ZXInOiAnbWlkZGxlIGNlbnRlcidcblx0fTtcblxuXHRmdW5jdGlvbiBjcmVhdGVGcm9tSFRNTChodG1sKSB7XG5cdCAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdCAgZWwuaW5uZXJIVE1MID0gaHRtbDtcblx0ICByZXR1cm4gZWwuY2hpbGRyZW5bMF07XG5cdH1cblxuXHRmdW5jdGlvbiBtYXRjaGVzU2VsZWN0b3IoZWwsIHNlbCkge1xuXHQgIHZhciBtYXRjaGVzID0gdW5kZWZpbmVkO1xuXHQgIGlmICh0eXBlb2YgZWwubWF0Y2hlcyAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIG1hdGNoZXMgPSBlbC5tYXRjaGVzO1xuXHQgIH0gZWxzZSBpZiAodHlwZW9mIGVsLm1hdGNoZXNTZWxlY3RvciAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIG1hdGNoZXMgPSBlbC5tYXRjaGVzU2VsZWN0b3I7XG5cdCAgfSBlbHNlIGlmICh0eXBlb2YgZWwubXNNYXRjaGVzU2VsZWN0b3IgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICBtYXRjaGVzID0gZWwubXNNYXRjaGVzU2VsZWN0b3I7XG5cdCAgfSBlbHNlIGlmICh0eXBlb2YgZWwud2Via2l0TWF0Y2hlc1NlbGVjdG9yICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgbWF0Y2hlcyA9IGVsLndlYmtpdE1hdGNoZXNTZWxlY3Rvcjtcblx0ICB9IGVsc2UgaWYgKHR5cGVvZiBlbC5tb3pNYXRjaGVzU2VsZWN0b3IgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICBtYXRjaGVzID0gZWwubW96TWF0Y2hlc1NlbGVjdG9yO1xuXHQgIH0gZWxzZSBpZiAodHlwZW9mIGVsLm9NYXRjaGVzU2VsZWN0b3IgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICBtYXRjaGVzID0gZWwub01hdGNoZXNTZWxlY3Rvcjtcblx0ICB9XG5cdCAgcmV0dXJuIG1hdGNoZXMuY2FsbChlbCwgc2VsKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHBhcnNlU2hvcnRoYW5kKG9iaiwgcHJvcHMpIHtcblx0ICBpZiAob2JqID09PSBudWxsIHx8IHR5cGVvZiBvYmogPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICByZXR1cm4gb2JqO1xuXHQgIH0gZWxzZSBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpIHtcblx0ICAgIHJldHVybiBvYmo7XG5cdCAgfVxuXG5cdCAgdmFyIHZhbHMgPSBvYmouc3BsaXQoJyAnKTtcblx0ICB2YXIgdmFsc0xlbiA9IHZhbHMubGVuZ3RoO1xuXHQgIHZhciBwcm9wc0xlbiA9IHByb3BzLmxlbmd0aDtcblx0ICBpZiAodmFsc0xlbiA+IHByb3BzTGVuKSB7XG5cdCAgICB2YWxzWzBdID0gdmFscy5zbGljZSgwLCB2YWxzTGVuIC0gcHJvcHNMZW4gKyAxKS5qb2luKCcgJyk7XG5cdCAgICB2YWxzLnNwbGljZSgxLCAodmFsc0xlbiwgcHJvcHNMZW4pKTtcblx0ICB9XG5cblx0ICB2YXIgb3V0ID0ge307XG5cdCAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wc0xlbjsgKytpKSB7XG5cdCAgICB2YXIgcHJvcCA9IHByb3BzW2ldO1xuXHQgICAgb3V0W3Byb3BdID0gdmFsc1tpXTtcblx0ICB9XG5cblx0ICByZXR1cm4gb3V0O1xuXHR9XG5cblx0dmFyIFN0ZXAgPSAoZnVuY3Rpb24gKF9FdmVudGVkKSB7XG5cdCAgX2luaGVyaXRzKFN0ZXAsIF9FdmVudGVkKTtcblxuXHQgIGZ1bmN0aW9uIFN0ZXAodG91ciwgb3B0aW9ucykge1xuXHQgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFN0ZXApO1xuXG5cdCAgICBfZ2V0KE9iamVjdC5nZXRQcm90b3R5cGVPZihTdGVwLnByb3RvdHlwZSksICdjb25zdHJ1Y3RvcicsIHRoaXMpLmNhbGwodGhpcywgdG91ciwgb3B0aW9ucyk7XG5cdCAgICB0aGlzLnRvdXIgPSB0b3VyO1xuXHQgICAgdGhpcy5iaW5kTWV0aG9kcygpO1xuXHQgICAgdGhpcy5zZXRPcHRpb25zKG9wdGlvbnMpO1xuXHQgICAgcmV0dXJuIHRoaXM7XG5cdCAgfVxuXG5cdCAgX2NyZWF0ZUNsYXNzKFN0ZXAsIFt7XG5cdCAgICBrZXk6ICdiaW5kTWV0aG9kcycsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gYmluZE1ldGhvZHMoKSB7XG5cdCAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cblx0ICAgICAgdmFyIG1ldGhvZHMgPSBbJ19zaG93JywgJ3Nob3cnLCAnaGlkZScsICdpc09wZW4nLCAnY2FuY2VsJywgJ2NvbXBsZXRlJywgJ3Njcm9sbFRvJywgJ2Rlc3Ryb3knXTtcblx0ICAgICAgbWV0aG9kcy5tYXAoZnVuY3Rpb24gKG1ldGhvZCkge1xuXHQgICAgICAgIF90aGlzW21ldGhvZF0gPSBfdGhpc1ttZXRob2RdLmJpbmQoX3RoaXMpO1xuXHQgICAgICB9KTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdzZXRPcHRpb25zJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRPcHRpb25zKCkge1xuXHQgICAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzBdO1xuXG5cdCAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cdCAgICAgIHRoaXMuZGVzdHJveSgpO1xuXG5cdCAgICAgIHRoaXMuaWQgPSB0aGlzLm9wdGlvbnMuaWQgfHwgdGhpcy5pZCB8fCAnc3RlcC0nICsgdW5pcXVlSWQoKTtcblxuXHQgICAgICB2YXIgd2hlbiA9IHRoaXMub3B0aW9ucy53aGVuO1xuXHQgICAgICBpZiAod2hlbikge1xuXHQgICAgICAgIGZvciAodmFyIF9ldmVudCBpbiB3aGVuKSB7XG5cdCAgICAgICAgICBpZiAoKHt9KS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHdoZW4sIF9ldmVudCkpIHtcblx0ICAgICAgICAgICAgdmFyIGhhbmRsZXIgPSB3aGVuW19ldmVudF07XG5cdCAgICAgICAgICAgIHRoaXMub24oX2V2ZW50LCBoYW5kbGVyLCB0aGlzKTtcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAoIXRoaXMub3B0aW9ucy5idXR0b25zKSB7XG5cdCAgICAgICAgdGhpcy5vcHRpb25zLmJ1dHRvbnMgPSBbe1xuXHQgICAgICAgICAgdGV4dDogJ05leHQnLFxuXHQgICAgICAgICAgYWN0aW9uOiB0aGlzLnRvdXIubmV4dFxuXHQgICAgICAgIH1dO1xuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnZ2V0VG91cicsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0VG91cigpIHtcblx0ICAgICAgcmV0dXJuIHRoaXMudG91cjtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdiaW5kQWR2YW5jZScsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gYmluZEFkdmFuY2UoKSB7XG5cdCAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuXG5cdCAgICAgIC8vIEFuIGVtcHR5IHNlbGVjdG9yIG1hdGNoZXMgdGhlIHN0ZXAgZWxlbWVudFxuXG5cdCAgICAgIHZhciBfcGFyc2VTaG9ydGhhbmQgPSBwYXJzZVNob3J0aGFuZCh0aGlzLm9wdGlvbnMuYWR2YW5jZU9uLCBbJ3NlbGVjdG9yJywgJ2V2ZW50J10pO1xuXG5cdCAgICAgIHZhciBldmVudCA9IF9wYXJzZVNob3J0aGFuZC5ldmVudDtcblx0ICAgICAgdmFyIHNlbGVjdG9yID0gX3BhcnNlU2hvcnRoYW5kLnNlbGVjdG9yO1xuXG5cdCAgICAgIHZhciBoYW5kbGVyID0gZnVuY3Rpb24gaGFuZGxlcihlKSB7XG5cdCAgICAgICAgaWYgKCFfdGhpczIuaXNPcGVuKCkpIHtcblx0ICAgICAgICAgIHJldHVybjtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAodHlwZW9mIHNlbGVjdG9yICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgICAgaWYgKG1hdGNoZXNTZWxlY3RvcihlLnRhcmdldCwgc2VsZWN0b3IpKSB7XG5cdCAgICAgICAgICAgIF90aGlzMi50b3VyLm5leHQoKTtcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgaWYgKF90aGlzMi5lbCAmJiBlLnRhcmdldCA9PT0gX3RoaXMyLmVsKSB7XG5cdCAgICAgICAgICAgIF90aGlzMi50b3VyLm5leHQoKTtcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgIH07XG5cblx0ICAgICAgLy8gVE9ETzogdGhpcyBzaG91bGQgYWxzbyBiaW5kL3VuYmluZCBvbiBzaG93L2hpZGVcblx0ICAgICAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyKTtcblx0ICAgICAgdGhpcy5vbignZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICByZXR1cm4gZG9jdW1lbnQuYm9keS5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyKTtcblx0ICAgICAgfSk7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnZ2V0QXR0YWNoVG8nLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGdldEF0dGFjaFRvKCkge1xuXHQgICAgICB2YXIgb3B0cyA9IHBhcnNlU2hvcnRoYW5kKHRoaXMub3B0aW9ucy5hdHRhY2hUbywgWydlbGVtZW50JywgJ29uJ10pIHx8IHt9O1xuXHQgICAgICB2YXIgc2VsZWN0b3IgPSBvcHRzLmVsZW1lbnQ7XG5cblx0ICAgICAgaWYgKHR5cGVvZiBzZWxlY3RvciA9PT0gJ3N0cmluZycpIHtcblx0ICAgICAgICBvcHRzLmVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcblxuXHQgICAgICAgIGlmICghb3B0cy5lbGVtZW50KSB7XG5cdCAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBlbGVtZW50IGZvciB0aGlzIFNoZXBoZXJkIHN0ZXAgd2FzIG5vdCBmb3VuZCAnICsgc2VsZWN0b3IpO1xuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXG5cdCAgICAgIHJldHVybiBvcHRzO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ3NldHVwVGV0aGVyJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBzZXR1cFRldGhlcigpIHtcblx0ICAgICAgaWYgKHR5cGVvZiBUZXRoZXIgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVXNpbmcgdGhlIGF0dGFjaG1lbnQgZmVhdHVyZSBvZiBTaGVwaGVyZCByZXF1aXJlcyB0aGUgVGV0aGVyIGxpYnJhcnlcIik7XG5cdCAgICAgIH1cblxuXHQgICAgICB2YXIgb3B0cyA9IHRoaXMuZ2V0QXR0YWNoVG8oKTtcblx0ICAgICAgdmFyIGF0dGFjaG1lbnQgPSBBVFRBQ0hNRU5UW29wdHMub24gfHwgJ3JpZ2h0J107XG5cdCAgICAgIGlmICh0eXBlb2Ygb3B0cy5lbGVtZW50ID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIG9wdHMuZWxlbWVudCA9ICd2aWV3cG9ydCc7XG5cdCAgICAgICAgYXR0YWNobWVudCA9ICdtaWRkbGUgY2VudGVyJztcblx0ICAgICAgfVxuXG5cdCAgICAgIHZhciB0ZXRoZXJPcHRzID0ge1xuXHQgICAgICAgIGNsYXNzUHJlZml4OiAnc2hlcGhlcmQnLFxuXHQgICAgICAgIGVsZW1lbnQ6IHRoaXMuZWwsXG5cdCAgICAgICAgY29uc3RyYWludHM6IFt7XG5cdCAgICAgICAgICB0bzogJ3dpbmRvdycsXG5cdCAgICAgICAgICBwaW46IHRydWUsXG5cdCAgICAgICAgICBhdHRhY2htZW50OiAndG9nZXRoZXInXG5cdCAgICAgICAgfV0sXG5cdCAgICAgICAgdGFyZ2V0OiBvcHRzLmVsZW1lbnQsXG5cdCAgICAgICAgb2Zmc2V0OiBvcHRzLm9mZnNldCB8fCAnMCAwJyxcblx0ICAgICAgICBhdHRhY2htZW50OiBhdHRhY2htZW50XG5cdCAgICAgIH07XG5cblx0ICAgICAgaWYgKHRoaXMudGV0aGVyKSB7XG5cdCAgICAgICAgdGhpcy50ZXRoZXIuZGVzdHJveSgpO1xuXHQgICAgICB9XG5cblx0ICAgICAgdGhpcy50ZXRoZXIgPSBuZXcgVGV0aGVyKGV4dGVuZCh0ZXRoZXJPcHRzLCB0aGlzLm9wdGlvbnMudGV0aGVyT3B0aW9ucykpO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ3Nob3cnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIHNob3coKSB7XG5cdCAgICAgIHZhciBfdGhpczMgPSB0aGlzO1xuXG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLmJlZm9yZVNob3dQcm9taXNlICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIHZhciBiZWZvcmVTaG93UHJvbWlzZSA9IHRoaXMub3B0aW9ucy5iZWZvcmVTaG93UHJvbWlzZSgpO1xuXHQgICAgICAgIGlmICh0eXBlb2YgYmVmb3JlU2hvd1Byb21pc2UgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgICByZXR1cm4gYmVmb3JlU2hvd1Byb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBfdGhpczMuX3Nob3coKTtcblx0ICAgICAgICAgIH0pO1xuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXHQgICAgICB0aGlzLl9zaG93KCk7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnX3Nob3cnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIF9zaG93KCkge1xuXHQgICAgICB2YXIgX3RoaXM0ID0gdGhpcztcblxuXHQgICAgICB0aGlzLnRyaWdnZXIoJ2JlZm9yZS1zaG93Jyk7XG5cblx0ICAgICAgaWYgKCF0aGlzLmVsKSB7XG5cdCAgICAgICAgdGhpcy5yZW5kZXIoKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGFkZENsYXNzKHRoaXMuZWwsICdzaGVwaGVyZC1vcGVuJyk7XG5cblx0ICAgICAgZG9jdW1lbnQuYm9keS5zZXRBdHRyaWJ1dGUoJ2RhdGEtc2hlcGhlcmQtc3RlcCcsIHRoaXMuaWQpO1xuXG5cdCAgICAgIHRoaXMuc2V0dXBUZXRoZXIoKTtcblxuXHQgICAgICBpZiAodGhpcy5vcHRpb25zLnNjcm9sbFRvKSB7XG5cdCAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICBfdGhpczQuc2Nyb2xsVG8oKTtcblx0ICAgICAgICB9KTtcblx0ICAgICAgfVxuXG5cdCAgICAgIHRoaXMudHJpZ2dlcignc2hvdycpO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2hpZGUnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGhpZGUoKSB7XG5cdCAgICAgIHRoaXMudHJpZ2dlcignYmVmb3JlLWhpZGUnKTtcblxuXHQgICAgICByZW1vdmVDbGFzcyh0aGlzLmVsLCAnc2hlcGhlcmQtb3BlbicpO1xuXG5cdCAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXNoZXBoZXJkLXN0ZXAnKTtcblxuXHQgICAgICBpZiAodGhpcy50ZXRoZXIpIHtcblx0ICAgICAgICB0aGlzLnRldGhlci5kZXN0cm95KCk7XG5cdCAgICAgIH1cblx0ICAgICAgdGhpcy50ZXRoZXIgPSBudWxsO1xuXG5cdCAgICAgIHRoaXMudHJpZ2dlcignaGlkZScpO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2lzT3BlbicsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gaXNPcGVuKCkge1xuXHQgICAgICByZXR1cm4gaGFzQ2xhc3ModGhpcy5lbCwgJ3NoZXBoZXJkLW9wZW4nKTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdjYW5jZWwnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGNhbmNlbCgpIHtcblx0ICAgICAgdGhpcy50b3VyLmNhbmNlbCgpO1xuXHQgICAgICB0aGlzLnRyaWdnZXIoJ2NhbmNlbCcpO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2NvbXBsZXRlJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBjb21wbGV0ZSgpIHtcblx0ICAgICAgdGhpcy50b3VyLmNvbXBsZXRlKCk7XG5cdCAgICAgIHRoaXMudHJpZ2dlcignY29tcGxldGUnKTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdzY3JvbGxUbycsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gc2Nyb2xsVG8oKSB7XG5cdCAgICAgIHZhciBfZ2V0QXR0YWNoVG8gPSB0aGlzLmdldEF0dGFjaFRvKCk7XG5cblx0ICAgICAgdmFyIGVsZW1lbnQgPSBfZ2V0QXR0YWNoVG8uZWxlbWVudDtcblxuXHQgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5zY3JvbGxUb0hhbmRsZXIgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgdGhpcy5vcHRpb25zLnNjcm9sbFRvSGFuZGxlcihlbGVtZW50KTtcblx0ICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZWxlbWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICBlbGVtZW50LnNjcm9sbEludG9WaWV3KCk7XG5cdCAgICAgIH1cblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdkZXN0cm95Jyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBkZXN0cm95KCkge1xuXHQgICAgICBpZiAodHlwZW9mIHRoaXMuZWwgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCh0aGlzLmVsKTtcblx0ICAgICAgICBkZWxldGUgdGhpcy5lbDtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICh0aGlzLnRldGhlcikge1xuXHQgICAgICAgIHRoaXMudGV0aGVyLmRlc3Ryb3koKTtcblx0ICAgICAgfVxuXHQgICAgICB0aGlzLnRldGhlciA9IG51bGw7XG5cblx0ICAgICAgdGhpcy50cmlnZ2VyKCdkZXN0cm95Jyk7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAncmVuZGVyJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdCAgICAgIHZhciBfdGhpczUgPSB0aGlzO1xuXG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5lbCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICB0aGlzLmRlc3Ryb3koKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIHRoaXMuZWwgPSBjcmVhdGVGcm9tSFRNTCgnPGRpdiBjbGFzcz1cXCdzaGVwaGVyZC1zdGVwICcgKyAodGhpcy5vcHRpb25zLmNsYXNzZXMgfHwgJycpICsgJ1xcJyBkYXRhLWlkPVxcJycgKyB0aGlzLmlkICsgJ1xcJyAnICsgKHRoaXMub3B0aW9ucy5pZEF0dHJpYnV0ZSA/ICdpZD1cIicgKyB0aGlzLm9wdGlvbnMuaWRBdHRyaWJ1dGUgKyAnXCInIDogJycpICsgJz48L2Rpdj4nKTtcblxuXHQgICAgICB2YXIgY29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHQgICAgICBjb250ZW50LmNsYXNzTmFtZSA9ICdzaGVwaGVyZC1jb250ZW50Jztcblx0ICAgICAgdGhpcy5lbC5hcHBlbmRDaGlsZChjb250ZW50KTtcblxuXHQgICAgICB2YXIgaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaGVhZGVyJyk7XG5cdCAgICAgIGNvbnRlbnQuYXBwZW5kQ2hpbGQoaGVhZGVyKTtcblxuXHQgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy50aXRsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICBoZWFkZXIuaW5uZXJIVE1MICs9ICc8aDMgY2xhc3M9XFwnc2hlcGhlcmQtdGl0bGVcXCc+JyArIHRoaXMub3B0aW9ucy50aXRsZSArICc8L2gzPic7XG5cdCAgICAgICAgdGhpcy5lbC5jbGFzc05hbWUgKz0gJyBzaGVwaGVyZC1oYXMtdGl0bGUnO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKHRoaXMub3B0aW9ucy5zaG93Q2FuY2VsTGluaykge1xuXHQgICAgICAgIHZhciBsaW5rID0gY3JlYXRlRnJvbUhUTUwoXCI8YSBocmVmIGNsYXNzPSdzaGVwaGVyZC1jYW5jZWwtbGluayc+4pyVPC9hPlwiKTtcblx0ICAgICAgICBoZWFkZXIuYXBwZW5kQ2hpbGQobGluayk7XG5cblx0ICAgICAgICB0aGlzLmVsLmNsYXNzTmFtZSArPSAnIHNoZXBoZXJkLWhhcy1jYW5jZWwtbGluayc7XG5cblx0ICAgICAgICB0aGlzLmJpbmRDYW5jZWxMaW5rKGxpbmspO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMudGV4dCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICAoZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgdmFyIHRleHQgPSBjcmVhdGVGcm9tSFRNTChcIjxkaXYgY2xhc3M9J3NoZXBoZXJkLXRleHQnPjwvZGl2PlwiKTtcblx0ICAgICAgICAgIHZhciBwYXJhZ3JhcGhzID0gX3RoaXM1Lm9wdGlvbnMudGV4dDtcblxuXHQgICAgICAgICAgaWYgKHR5cGVvZiBwYXJhZ3JhcGhzID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgICAgIHBhcmFncmFwaHMgPSBwYXJhZ3JhcGhzLmNhbGwoX3RoaXM1LCB0ZXh0KTtcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgaWYgKHBhcmFncmFwaHMgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkge1xuXHQgICAgICAgICAgICB0ZXh0LmFwcGVuZENoaWxkKHBhcmFncmFwaHMpO1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXJhZ3JhcGhzID09PSAnc3RyaW5nJykge1xuXHQgICAgICAgICAgICAgIHBhcmFncmFwaHMgPSBbcGFyYWdyYXBoc107XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBwYXJhZ3JhcGhzLm1hcChmdW5jdGlvbiAocGFyYWdyYXBoKSB7XG5cdCAgICAgICAgICAgICAgdGV4dC5pbm5lckhUTUwgKz0gJzxwPicgKyBwYXJhZ3JhcGggKyAnPC9wPic7XG5cdCAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBjb250ZW50LmFwcGVuZENoaWxkKHRleHQpO1xuXHQgICAgICAgIH0pKCk7XG5cdCAgICAgIH1cblxuXHQgICAgICB2YXIgZm9vdGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZm9vdGVyJyk7XG5cblx0ICAgICAgaWYgKHRoaXMub3B0aW9ucy5idXR0b25zKSB7XG5cdCAgICAgICAgKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgIHZhciBidXR0b25zID0gY3JlYXRlRnJvbUhUTUwoXCI8dWwgY2xhc3M9J3NoZXBoZXJkLWJ1dHRvbnMnPjwvdWw+XCIpO1xuXG5cdCAgICAgICAgICBfdGhpczUub3B0aW9ucy5idXR0b25zLm1hcChmdW5jdGlvbiAoY2ZnKSB7XG5cdCAgICAgICAgICAgIHZhciBidXR0b24gPSBjcmVhdGVGcm9tSFRNTCgnPGxpPjxhIGNsYXNzPVxcJ3NoZXBoZXJkLWJ1dHRvbiAnICsgKGNmZy5jbGFzc2VzIHx8ICcnKSArICdcXCc+JyArIGNmZy50ZXh0ICsgJzwvYT4nKTtcblx0ICAgICAgICAgICAgYnV0dG9ucy5hcHBlbmRDaGlsZChidXR0b24pO1xuXHQgICAgICAgICAgICBfdGhpczUuYmluZEJ1dHRvbkV2ZW50cyhjZmcsIGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdhJykpO1xuXHQgICAgICAgICAgfSk7XG5cblx0ICAgICAgICAgIGZvb3Rlci5hcHBlbmRDaGlsZChidXR0b25zKTtcblx0ICAgICAgICB9KSgpO1xuXHQgICAgICB9XG5cblx0ICAgICAgY29udGVudC5hcHBlbmRDaGlsZChmb290ZXIpO1xuXG5cdCAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5lbCk7XG5cblx0ICAgICAgdGhpcy5zZXR1cFRldGhlcigpO1xuXG5cdCAgICAgIGlmICh0aGlzLm9wdGlvbnMuYWR2YW5jZU9uKSB7XG5cdCAgICAgICAgdGhpcy5iaW5kQWR2YW5jZSgpO1xuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnYmluZENhbmNlbExpbmsnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGJpbmRDYW5jZWxMaW5rKGxpbmspIHtcblx0ICAgICAgdmFyIF90aGlzNiA9IHRoaXM7XG5cblx0ICAgICAgbGluay5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG5cdCAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHQgICAgICAgIF90aGlzNi5jYW5jZWwoKTtcblx0ICAgICAgfSk7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnYmluZEJ1dHRvbkV2ZW50cycsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gYmluZEJ1dHRvbkV2ZW50cyhjZmcsIGVsKSB7XG5cdCAgICAgIHZhciBfdGhpczcgPSB0aGlzO1xuXG5cdCAgICAgIGNmZy5ldmVudHMgPSBjZmcuZXZlbnRzIHx8IHt9O1xuXHQgICAgICBpZiAodHlwZW9mIGNmZy5hY3Rpb24gIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgLy8gSW5jbHVkaW5nIGJvdGggYSBjbGljayBldmVudCBhbmQgYW4gYWN0aW9uIGlzIG5vdCBzdXBwb3J0ZWRcblx0ICAgICAgICBjZmcuZXZlbnRzLmNsaWNrID0gY2ZnLmFjdGlvbjtcblx0ICAgICAgfVxuXG5cdCAgICAgIGZvciAodmFyIF9ldmVudDIgaW4gY2ZnLmV2ZW50cykge1xuXHQgICAgICAgIGlmICgoe30pLmhhc093blByb3BlcnR5LmNhbGwoY2ZnLmV2ZW50cywgX2V2ZW50MikpIHtcblx0ICAgICAgICAgIHZhciBoYW5kbGVyID0gY2ZnLmV2ZW50c1tfZXZlbnQyXTtcblx0ICAgICAgICAgIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ3N0cmluZycpIHtcblx0ICAgICAgICAgICAgKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICB2YXIgcGFnZSA9IGhhbmRsZXI7XG5cdCAgICAgICAgICAgICAgaGFuZGxlciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBfdGhpczcudG91ci5zaG93KHBhZ2UpO1xuXHQgICAgICAgICAgICAgIH07XG5cdCAgICAgICAgICAgIH0pKCk7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKF9ldmVudDIsIGhhbmRsZXIpO1xuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXG5cdCAgICAgIHRoaXMub24oJ2Rlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgZm9yICh2YXIgX2V2ZW50MyBpbiBjZmcuZXZlbnRzKSB7XG5cdCAgICAgICAgICBpZiAoKHt9KS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGNmZy5ldmVudHMsIF9ldmVudDMpKSB7XG5cdCAgICAgICAgICAgIHZhciBoYW5kbGVyID0gY2ZnLmV2ZW50c1tfZXZlbnQzXTtcblx0ICAgICAgICAgICAgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihfZXZlbnQzLCBoYW5kbGVyKTtcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgIH0pO1xuXHQgICAgfVxuXHQgIH1dKTtcblxuXHQgIHJldHVybiBTdGVwO1xuXHR9KShFdmVudGVkKTtcblxuXHR2YXIgVG91ciA9IChmdW5jdGlvbiAoX0V2ZW50ZWQyKSB7XG5cdCAgX2luaGVyaXRzKFRvdXIsIF9FdmVudGVkMik7XG5cblx0ICBmdW5jdGlvbiBUb3VyKCkge1xuXHQgICAgdmFyIF90aGlzOCA9IHRoaXM7XG5cblx0ICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMF07XG5cblx0ICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBUb3VyKTtcblxuXHQgICAgX2dldChPYmplY3QuZ2V0UHJvdG90eXBlT2YoVG91ci5wcm90b3R5cGUpLCAnY29uc3RydWN0b3InLCB0aGlzKS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuXHQgICAgdGhpcy5iaW5kTWV0aG9kcygpO1xuXHQgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcblx0ICAgIHRoaXMuc3RlcHMgPSB0aGlzLm9wdGlvbnMuc3RlcHMgfHwgW107XG5cblx0ICAgIC8vIFBhc3MgdGhlc2UgZXZlbnRzIG9udG8gdGhlIGdsb2JhbCBTaGVwaGVyZCBvYmplY3Rcblx0ICAgIHZhciBldmVudHMgPSBbJ2NvbXBsZXRlJywgJ2NhbmNlbCcsICdoaWRlJywgJ3N0YXJ0JywgJ3Nob3cnLCAnYWN0aXZlJywgJ2luYWN0aXZlJ107XG5cdCAgICBldmVudHMubWFwKGZ1bmN0aW9uIChldmVudCkge1xuXHQgICAgICAoZnVuY3Rpb24gKGUpIHtcblx0ICAgICAgICBfdGhpczgub24oZSwgZnVuY3Rpb24gKG9wdHMpIHtcblx0ICAgICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXHQgICAgICAgICAgb3B0cy50b3VyID0gX3RoaXM4O1xuXHQgICAgICAgICAgU2hlcGhlcmQudHJpZ2dlcihlLCBvcHRzKTtcblx0ICAgICAgICB9KTtcblx0ICAgICAgfSkoZXZlbnQpO1xuXHQgICAgfSk7XG5cblx0ICAgIHJldHVybiB0aGlzO1xuXHQgIH1cblxuXHQgIF9jcmVhdGVDbGFzcyhUb3VyLCBbe1xuXHQgICAga2V5OiAnYmluZE1ldGhvZHMnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGJpbmRNZXRob2RzKCkge1xuXHQgICAgICB2YXIgX3RoaXM5ID0gdGhpcztcblxuXHQgICAgICB2YXIgbWV0aG9kcyA9IFsnbmV4dCcsICdiYWNrJywgJ2NhbmNlbCcsICdjb21wbGV0ZScsICdoaWRlJ107XG5cdCAgICAgIG1ldGhvZHMubWFwKGZ1bmN0aW9uIChtZXRob2QpIHtcblx0ICAgICAgICBfdGhpczlbbWV0aG9kXSA9IF90aGlzOVttZXRob2RdLmJpbmQoX3RoaXM5KTtcblx0ICAgICAgfSk7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnYWRkU3RlcCcsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gYWRkU3RlcChuYW1lLCBzdGVwKSB7XG5cdCAgICAgIGlmICh0eXBlb2Ygc3RlcCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICBzdGVwID0gbmFtZTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICghKHN0ZXAgaW5zdGFuY2VvZiBTdGVwKSkge1xuXHQgICAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIG5hbWUgPT09ICdudW1iZXInKSB7XG5cdCAgICAgICAgICBzdGVwLmlkID0gbmFtZS50b1N0cmluZygpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBzdGVwID0gZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMuZGVmYXVsdHMsIHN0ZXApO1xuXHQgICAgICAgIHN0ZXAgPSBuZXcgU3RlcCh0aGlzLCBzdGVwKTtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICBzdGVwLnRvdXIgPSB0aGlzO1xuXHQgICAgICB9XG5cblx0ICAgICAgdGhpcy5zdGVwcy5wdXNoKHN0ZXApO1xuXHQgICAgICByZXR1cm4gdGhpcztcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdnZXRCeUlkJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRCeUlkKGlkKSB7XG5cdCAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zdGVwcy5sZW5ndGg7ICsraSkge1xuXHQgICAgICAgIHZhciBzdGVwID0gdGhpcy5zdGVwc1tpXTtcblx0ICAgICAgICBpZiAoc3RlcC5pZCA9PT0gaWQpIHtcblx0ICAgICAgICAgIHJldHVybiBzdGVwO1xuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2dldEN1cnJlbnRTdGVwJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRDdXJyZW50U3RlcCgpIHtcblx0ICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFN0ZXA7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnbmV4dCcsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gbmV4dCgpIHtcblx0ICAgICAgdmFyIGluZGV4ID0gdGhpcy5zdGVwcy5pbmRleE9mKHRoaXMuY3VycmVudFN0ZXApO1xuXG5cdCAgICAgIGlmIChpbmRleCA9PT0gdGhpcy5zdGVwcy5sZW5ndGggLSAxKSB7XG5cdCAgICAgICAgdGhpcy5oaWRlKGluZGV4KTtcblx0ICAgICAgICB0aGlzLnRyaWdnZXIoJ2NvbXBsZXRlJyk7XG5cdCAgICAgICAgdGhpcy5kb25lKCk7XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgdGhpcy5zaG93KGluZGV4ICsgMSwgdHJ1ZSk7XG5cdCAgICAgIH1cblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdiYWNrJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBiYWNrKCkge1xuXHQgICAgICB2YXIgaW5kZXggPSB0aGlzLnN0ZXBzLmluZGV4T2YodGhpcy5jdXJyZW50U3RlcCk7XG5cdCAgICAgIHRoaXMuc2hvdyhpbmRleCAtIDEsIGZhbHNlKTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdjYW5jZWwnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGNhbmNlbCgpIHtcblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLmN1cnJlbnRTdGVwICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIHRoaXMuY3VycmVudFN0ZXAuaGlkZSgpO1xuXHQgICAgICB9XG5cdCAgICAgIHRoaXMudHJpZ2dlcignY2FuY2VsJyk7XG5cdCAgICAgIHRoaXMuZG9uZSgpO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2NvbXBsZXRlJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBjb21wbGV0ZSgpIHtcblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLmN1cnJlbnRTdGVwICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIHRoaXMuY3VycmVudFN0ZXAuaGlkZSgpO1xuXHQgICAgICB9XG5cdCAgICAgIHRoaXMudHJpZ2dlcignY29tcGxldGUnKTtcblx0ICAgICAgdGhpcy5kb25lKCk7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnaGlkZScsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gaGlkZSgpIHtcblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLmN1cnJlbnRTdGVwICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIHRoaXMuY3VycmVudFN0ZXAuaGlkZSgpO1xuXHQgICAgICB9XG5cdCAgICAgIHRoaXMudHJpZ2dlcignaGlkZScpO1xuXHQgICAgICB0aGlzLmRvbmUoKTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdkb25lJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBkb25lKCkge1xuXHQgICAgICBTaGVwaGVyZC5hY3RpdmVUb3VyID0gbnVsbDtcblx0ICAgICAgcmVtb3ZlQ2xhc3MoZG9jdW1lbnQuYm9keSwgJ3NoZXBoZXJkLWFjdGl2ZScpO1xuXHQgICAgICB0aGlzLnRyaWdnZXIoJ2luYWN0aXZlJywgeyB0b3VyOiB0aGlzIH0pO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ3Nob3cnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIHNob3coKSB7XG5cdCAgICAgIHZhciBrZXkgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyAwIDogYXJndW1lbnRzWzBdO1xuXHQgICAgICB2YXIgZm9yd2FyZCA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMSB8fCBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IHRydWUgOiBhcmd1bWVudHNbMV07XG5cblx0ICAgICAgaWYgKHRoaXMuY3VycmVudFN0ZXApIHtcblx0ICAgICAgICB0aGlzLmN1cnJlbnRTdGVwLmhpZGUoKTtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICBhZGRDbGFzcyhkb2N1bWVudC5ib2R5LCAnc2hlcGhlcmQtYWN0aXZlJyk7XG5cdCAgICAgICAgdGhpcy50cmlnZ2VyKCdhY3RpdmUnLCB7IHRvdXI6IHRoaXMgfSk7XG5cdCAgICAgIH1cblxuXHQgICAgICBTaGVwaGVyZC5hY3RpdmVUb3VyID0gdGhpcztcblxuXHQgICAgICB2YXIgbmV4dCA9IHVuZGVmaW5lZDtcblxuXHQgICAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycpIHtcblx0ICAgICAgICBuZXh0ID0gdGhpcy5nZXRCeUlkKGtleSk7XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgbmV4dCA9IHRoaXMuc3RlcHNba2V5XTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmIChuZXh0KSB7XG5cdCAgICAgICAgaWYgKHR5cGVvZiBuZXh0Lm9wdGlvbnMuc2hvd09uICE9PSAndW5kZWZpbmVkJyAmJiAhbmV4dC5vcHRpb25zLnNob3dPbigpKSB7XG5cdCAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLnN0ZXBzLmluZGV4T2YobmV4dCk7XG5cdCAgICAgICAgICB2YXIgbmV4dEluZGV4ID0gZm9yd2FyZCA/IGluZGV4ICsgMSA6IGluZGV4IC0gMTtcblx0ICAgICAgICAgIHRoaXMuc2hvdyhuZXh0SW5kZXgsIGZvcndhcmQpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICB0aGlzLnRyaWdnZXIoJ3Nob3cnLCB7XG5cdCAgICAgICAgICAgIHN0ZXA6IG5leHQsXG5cdCAgICAgICAgICAgIHByZXZpb3VzOiB0aGlzLmN1cnJlbnRTdGVwXG5cdCAgICAgICAgICB9KTtcblxuXHQgICAgICAgICAgdGhpcy5jdXJyZW50U3RlcCA9IG5leHQ7XG5cdCAgICAgICAgICBuZXh0LnNob3coKTtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdzdGFydCcsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gc3RhcnQoKSB7XG5cdCAgICAgIHRoaXMudHJpZ2dlcignc3RhcnQnKTtcblxuXHQgICAgICB0aGlzLmN1cnJlbnRTdGVwID0gbnVsbDtcblx0ICAgICAgdGhpcy5uZXh0KCk7XG5cdCAgICB9XG5cdCAgfV0pO1xuXG5cdCAgcmV0dXJuIFRvdXI7XG5cdH0pKEV2ZW50ZWQpO1xuXG5cdGV4dGVuZChTaGVwaGVyZCwgeyBUb3VyOiBUb3VyLCBTdGVwOiBTdGVwLCBFdmVudGVkOiBFdmVudGVkIH0pO1xuXHRyZXR1cm4gU2hlcGhlcmQ7XG5cblx0fSkpO1xuXG5cbi8qKiovIH0sXG4vKiAxMCAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0dmFyIF9fV0VCUEFDS19BTURfREVGSU5FX0ZBQ1RPUllfXywgX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX187LyohIHRldGhlciAxLjIuMCAqL1xuXG5cdChmdW5jdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdCAgaWYgKHRydWUpIHtcblx0ICAgICEoX19XRUJQQUNLX0FNRF9ERUZJTkVfRkFDVE9SWV9fID0gKGZhY3RvcnkpLCBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXyA9ICh0eXBlb2YgX19XRUJQQUNLX0FNRF9ERUZJTkVfRkFDVE9SWV9fID09PSAnZnVuY3Rpb24nID8gKF9fV0VCUEFDS19BTURfREVGSU5FX0ZBQ1RPUllfXy5jYWxsKGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18sIGV4cG9ydHMsIG1vZHVsZSkpIDogX19XRUJQQUNLX0FNRF9ERUZJTkVfRkFDVE9SWV9fKSwgX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX18gIT09IHVuZGVmaW5lZCAmJiAobW9kdWxlLmV4cG9ydHMgPSBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXykpO1xuXHQgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKTtcblx0ICB9IGVsc2Uge1xuXHQgICAgcm9vdC5UZXRoZXIgPSBmYWN0b3J5KCk7XG5cdCAgfVxuXHR9KHRoaXMsIGZ1bmN0aW9uKHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSkge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmICgndmFsdWUnIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5cdGZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG5cdHZhciBUZXRoZXJCYXNlID0gdW5kZWZpbmVkO1xuXHRpZiAodHlwZW9mIFRldGhlckJhc2UgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgVGV0aGVyQmFzZSA9IHsgbW9kdWxlczogW10gfTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldFNjcm9sbFBhcmVudChlbCkge1xuXHQgIC8vIEluIGZpcmVmb3ggaWYgdGhlIGVsIGlzIGluc2lkZSBhbiBpZnJhbWUgd2l0aCBkaXNwbGF5OiBub25lOyB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSgpIHdpbGwgcmV0dXJuIG51bGw7XG5cdCAgLy8gaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NTQ4Mzk3XG5cdCAgdmFyIGNvbXB1dGVkU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsKSB8fCB7fTtcblx0ICB2YXIgcG9zaXRpb24gPSBjb21wdXRlZFN0eWxlLnBvc2l0aW9uO1xuXG5cdCAgaWYgKHBvc2l0aW9uID09PSAnZml4ZWQnKSB7XG5cdCAgICByZXR1cm4gZWw7XG5cdCAgfVxuXG5cdCAgdmFyIHBhcmVudCA9IGVsO1xuXHQgIHdoaWxlIChwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZSkge1xuXHQgICAgdmFyIHN0eWxlID0gdW5kZWZpbmVkO1xuXHQgICAgdHJ5IHtcblx0ICAgICAgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHBhcmVudCk7XG5cdCAgICB9IGNhdGNoIChlcnIpIHt9XG5cblx0ICAgIGlmICh0eXBlb2Ygc3R5bGUgPT09ICd1bmRlZmluZWQnIHx8IHN0eWxlID09PSBudWxsKSB7XG5cdCAgICAgIHJldHVybiBwYXJlbnQ7XG5cdCAgICB9XG5cblx0ICAgIHZhciBfc3R5bGUgPSBzdHlsZTtcblx0ICAgIHZhciBvdmVyZmxvdyA9IF9zdHlsZS5vdmVyZmxvdztcblx0ICAgIHZhciBvdmVyZmxvd1ggPSBfc3R5bGUub3ZlcmZsb3dYO1xuXHQgICAgdmFyIG92ZXJmbG93WSA9IF9zdHlsZS5vdmVyZmxvd1k7XG5cblx0ICAgIGlmICgvKGF1dG98c2Nyb2xsKS8udGVzdChvdmVyZmxvdyArIG92ZXJmbG93WSArIG92ZXJmbG93WCkpIHtcblx0ICAgICAgaWYgKHBvc2l0aW9uICE9PSAnYWJzb2x1dGUnIHx8IFsncmVsYXRpdmUnLCAnYWJzb2x1dGUnLCAnZml4ZWQnXS5pbmRleE9mKHN0eWxlLnBvc2l0aW9uKSA+PSAwKSB7XG5cdCAgICAgICAgcmV0dXJuIHBhcmVudDtcblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH1cblxuXHQgIHJldHVybiBkb2N1bWVudC5ib2R5O1xuXHR9XG5cblx0dmFyIHVuaXF1ZUlkID0gKGZ1bmN0aW9uICgpIHtcblx0ICB2YXIgaWQgPSAwO1xuXHQgIHJldHVybiBmdW5jdGlvbiAoKSB7XG5cdCAgICByZXR1cm4gKytpZDtcblx0ICB9O1xuXHR9KSgpO1xuXG5cdHZhciB6ZXJvUG9zQ2FjaGUgPSB7fTtcblx0dmFyIGdldE9yaWdpbiA9IGZ1bmN0aW9uIGdldE9yaWdpbihkb2MpIHtcblx0ICAvLyBnZXRCb3VuZGluZ0NsaWVudFJlY3QgaXMgdW5mb3J0dW5hdGVseSB0b28gYWNjdXJhdGUuICBJdCBpbnRyb2R1Y2VzIGEgcGl4ZWwgb3IgdHdvIG9mXG5cdCAgLy8gaml0dGVyIGFzIHRoZSB1c2VyIHNjcm9sbHMgdGhhdCBtZXNzZXMgd2l0aCBvdXIgYWJpbGl0eSB0byBkZXRlY3QgaWYgdHdvIHBvc2l0aW9uc1xuXHQgIC8vIGFyZSBlcXVpdmlsYW50IG9yIG5vdC4gIFdlIHBsYWNlIGFuIGVsZW1lbnQgYXQgdGhlIHRvcCBsZWZ0IG9mIHRoZSBwYWdlIHRoYXQgd2lsbFxuXHQgIC8vIGdldCB0aGUgc2FtZSBqaXR0ZXIsIHNvIHdlIGNhbiBjYW5jZWwgdGhlIHR3byBvdXQuXG5cdCAgdmFyIG5vZGUgPSBkb2MuX3RldGhlclplcm9FbGVtZW50O1xuXHQgIGlmICh0eXBlb2Ygbm9kZSA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIG5vZGUgPSBkb2MuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdCAgICBub2RlLnNldEF0dHJpYnV0ZSgnZGF0YS10ZXRoZXItaWQnLCB1bmlxdWVJZCgpKTtcblx0ICAgIGV4dGVuZChub2RlLnN0eWxlLCB7XG5cdCAgICAgIHRvcDogMCxcblx0ICAgICAgbGVmdDogMCxcblx0ICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcblx0ICAgIH0pO1xuXG5cdCAgICBkb2MuYm9keS5hcHBlbmRDaGlsZChub2RlKTtcblxuXHQgICAgZG9jLl90ZXRoZXJaZXJvRWxlbWVudCA9IG5vZGU7XG5cdCAgfVxuXG5cdCAgdmFyIGlkID0gbm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtdGV0aGVyLWlkJyk7XG5cdCAgaWYgKHR5cGVvZiB6ZXJvUG9zQ2FjaGVbaWRdID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgemVyb1Bvc0NhY2hlW2lkXSA9IHt9O1xuXG5cdCAgICB2YXIgcmVjdCA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdCAgICBmb3IgKHZhciBrIGluIHJlY3QpIHtcblx0ICAgICAgLy8gQ2FuJ3QgdXNlIGV4dGVuZCwgYXMgb24gSUU5LCBlbGVtZW50cyBkb24ndCByZXNvbHZlIHRvIGJlIGhhc093blByb3BlcnR5XG5cdCAgICAgIHplcm9Qb3NDYWNoZVtpZF1ba10gPSByZWN0W2tdO1xuXHQgICAgfVxuXG5cdCAgICAvLyBDbGVhciB0aGUgY2FjaGUgd2hlbiB0aGlzIHBvc2l0aW9uIGNhbGwgaXMgZG9uZVxuXHQgICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuXHQgICAgICBkZWxldGUgemVyb1Bvc0NhY2hlW2lkXTtcblx0ICAgIH0pO1xuXHQgIH1cblxuXHQgIHJldHVybiB6ZXJvUG9zQ2FjaGVbaWRdO1xuXHR9O1xuXG5cdGZ1bmN0aW9uIGdldEJvdW5kcyhlbCkge1xuXHQgIHZhciBkb2MgPSB1bmRlZmluZWQ7XG5cdCAgaWYgKGVsID09PSBkb2N1bWVudCkge1xuXHQgICAgZG9jID0gZG9jdW1lbnQ7XG5cdCAgICBlbCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblx0ICB9IGVsc2Uge1xuXHQgICAgZG9jID0gZWwub3duZXJEb2N1bWVudDtcblx0ICB9XG5cblx0ICB2YXIgZG9jRWwgPSBkb2MuZG9jdW1lbnRFbGVtZW50O1xuXG5cdCAgdmFyIGJveCA9IHt9O1xuXHQgIC8vIFRoZSBvcmlnaW5hbCBvYmplY3QgcmV0dXJuZWQgYnkgZ2V0Qm91bmRpbmdDbGllbnRSZWN0IGlzIGltbXV0YWJsZSwgc28gd2UgY2xvbmUgaXRcblx0ICAvLyBXZSBjYW4ndCB1c2UgZXh0ZW5kIGJlY2F1c2UgdGhlIHByb3BlcnRpZXMgYXJlIG5vdCBjb25zaWRlcmVkIHBhcnQgb2YgdGhlIG9iamVjdCBieSBoYXNPd25Qcm9wZXJ0eSBpbiBJRTlcblx0ICB2YXIgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHQgIGZvciAodmFyIGsgaW4gcmVjdCkge1xuXHQgICAgYm94W2tdID0gcmVjdFtrXTtcblx0ICB9XG5cblx0ICB2YXIgb3JpZ2luID0gZ2V0T3JpZ2luKGRvYyk7XG5cblx0ICBib3gudG9wIC09IG9yaWdpbi50b3A7XG5cdCAgYm94LmxlZnQgLT0gb3JpZ2luLmxlZnQ7XG5cblx0ICBpZiAodHlwZW9mIGJveC53aWR0aCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIGJveC53aWR0aCA9IGRvY3VtZW50LmJvZHkuc2Nyb2xsV2lkdGggLSBib3gubGVmdCAtIGJveC5yaWdodDtcblx0ICB9XG5cdCAgaWYgKHR5cGVvZiBib3guaGVpZ2h0ID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgYm94LmhlaWdodCA9IGRvY3VtZW50LmJvZHkuc2Nyb2xsSGVpZ2h0IC0gYm94LnRvcCAtIGJveC5ib3R0b207XG5cdCAgfVxuXG5cdCAgYm94LnRvcCA9IGJveC50b3AgLSBkb2NFbC5jbGllbnRUb3A7XG5cdCAgYm94LmxlZnQgPSBib3gubGVmdCAtIGRvY0VsLmNsaWVudExlZnQ7XG5cdCAgYm94LnJpZ2h0ID0gZG9jLmJvZHkuY2xpZW50V2lkdGggLSBib3gud2lkdGggLSBib3gubGVmdDtcblx0ICBib3guYm90dG9tID0gZG9jLmJvZHkuY2xpZW50SGVpZ2h0IC0gYm94LmhlaWdodCAtIGJveC50b3A7XG5cblx0ICByZXR1cm4gYm94O1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0T2Zmc2V0UGFyZW50KGVsKSB7XG5cdCAgcmV0dXJuIGVsLm9mZnNldFBhcmVudCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRTY3JvbGxCYXJTaXplKCkge1xuXHQgIHZhciBpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHQgIGlubmVyLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuXHQgIGlubmVyLnN0eWxlLmhlaWdodCA9ICcyMDBweCc7XG5cblx0ICB2YXIgb3V0ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0ICBleHRlbmQob3V0ZXIuc3R5bGUsIHtcblx0ICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuXHQgICAgdG9wOiAwLFxuXHQgICAgbGVmdDogMCxcblx0ICAgIHBvaW50ZXJFdmVudHM6ICdub25lJyxcblx0ICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nLFxuXHQgICAgd2lkdGg6ICcyMDBweCcsXG5cdCAgICBoZWlnaHQ6ICcxNTBweCcsXG5cdCAgICBvdmVyZmxvdzogJ2hpZGRlbidcblx0ICB9KTtcblxuXHQgIG91dGVyLmFwcGVuZENoaWxkKGlubmVyKTtcblxuXHQgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQob3V0ZXIpO1xuXG5cdCAgdmFyIHdpZHRoQ29udGFpbmVkID0gaW5uZXIub2Zmc2V0V2lkdGg7XG5cdCAgb3V0ZXIuc3R5bGUub3ZlcmZsb3cgPSAnc2Nyb2xsJztcblx0ICB2YXIgd2lkdGhTY3JvbGwgPSBpbm5lci5vZmZzZXRXaWR0aDtcblxuXHQgIGlmICh3aWR0aENvbnRhaW5lZCA9PT0gd2lkdGhTY3JvbGwpIHtcblx0ICAgIHdpZHRoU2Nyb2xsID0gb3V0ZXIuY2xpZW50V2lkdGg7XG5cdCAgfVxuXG5cdCAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChvdXRlcik7XG5cblx0ICB2YXIgd2lkdGggPSB3aWR0aENvbnRhaW5lZCAtIHdpZHRoU2Nyb2xsO1xuXG5cdCAgcmV0dXJuIHsgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IHdpZHRoIH07XG5cdH1cblxuXHRmdW5jdGlvbiBleHRlbmQoKSB7XG5cdCAgdmFyIG91dCA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzBdO1xuXG5cdCAgdmFyIGFyZ3MgPSBbXTtcblxuXHQgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG5cblx0ICBhcmdzLnNsaWNlKDEpLmZvckVhY2goZnVuY3Rpb24gKG9iaikge1xuXHQgICAgaWYgKG9iaikge1xuXHQgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG5cdCAgICAgICAgaWYgKCh7fSkuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHtcblx0ICAgICAgICAgIG91dFtrZXldID0gb2JqW2tleV07XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfSk7XG5cblx0ICByZXR1cm4gb3V0O1xuXHR9XG5cblx0ZnVuY3Rpb24gcmVtb3ZlQ2xhc3MoZWwsIG5hbWUpIHtcblx0ICBpZiAodHlwZW9mIGVsLmNsYXNzTGlzdCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIG5hbWUuc3BsaXQoJyAnKS5mb3JFYWNoKGZ1bmN0aW9uIChjbHMpIHtcblx0ICAgICAgaWYgKGNscy50cmltKCkpIHtcblx0ICAgICAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKGNscyk7XG5cdCAgICAgIH1cblx0ICAgIH0pO1xuXHQgIH0gZWxzZSB7XG5cdCAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKCcoXnwgKScgKyBuYW1lLnNwbGl0KCcgJykuam9pbignfCcpICsgJyggfCQpJywgJ2dpJyk7XG5cdCAgICB2YXIgY2xhc3NOYW1lID0gZ2V0Q2xhc3NOYW1lKGVsKS5yZXBsYWNlKHJlZ2V4LCAnICcpO1xuXHQgICAgc2V0Q2xhc3NOYW1lKGVsLCBjbGFzc05hbWUpO1xuXHQgIH1cblx0fVxuXG5cdGZ1bmN0aW9uIGFkZENsYXNzKGVsLCBuYW1lKSB7XG5cdCAgaWYgKHR5cGVvZiBlbC5jbGFzc0xpc3QgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICBuYW1lLnNwbGl0KCcgJykuZm9yRWFjaChmdW5jdGlvbiAoY2xzKSB7XG5cdCAgICAgIGlmIChjbHMudHJpbSgpKSB7XG5cdCAgICAgICAgZWwuY2xhc3NMaXN0LmFkZChjbHMpO1xuXHQgICAgICB9XG5cdCAgICB9KTtcblx0ICB9IGVsc2Uge1xuXHQgICAgcmVtb3ZlQ2xhc3MoZWwsIG5hbWUpO1xuXHQgICAgdmFyIGNscyA9IGdldENsYXNzTmFtZShlbCkgKyAoJyAnICsgbmFtZSk7XG5cdCAgICBzZXRDbGFzc05hbWUoZWwsIGNscyk7XG5cdCAgfVxuXHR9XG5cblx0ZnVuY3Rpb24gaGFzQ2xhc3MoZWwsIG5hbWUpIHtcblx0ICBpZiAodHlwZW9mIGVsLmNsYXNzTGlzdCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIHJldHVybiBlbC5jbGFzc0xpc3QuY29udGFpbnMobmFtZSk7XG5cdCAgfVxuXHQgIHZhciBjbGFzc05hbWUgPSBnZXRDbGFzc05hbWUoZWwpO1xuXHQgIHJldHVybiBuZXcgUmVnRXhwKCcoXnwgKScgKyBuYW1lICsgJyggfCQpJywgJ2dpJykudGVzdChjbGFzc05hbWUpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0Q2xhc3NOYW1lKGVsKSB7XG5cdCAgaWYgKGVsLmNsYXNzTmFtZSBpbnN0YW5jZW9mIFNWR0FuaW1hdGVkU3RyaW5nKSB7XG5cdCAgICByZXR1cm4gZWwuY2xhc3NOYW1lLmJhc2VWYWw7XG5cdCAgfVxuXHQgIHJldHVybiBlbC5jbGFzc05hbWU7XG5cdH1cblxuXHRmdW5jdGlvbiBzZXRDbGFzc05hbWUoZWwsIGNsYXNzTmFtZSkge1xuXHQgIGVsLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCBjbGFzc05hbWUpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdXBkYXRlQ2xhc3NlcyhlbCwgYWRkLCBhbGwpIHtcblx0ICAvLyBPZiB0aGUgc2V0IG9mICdhbGwnIGNsYXNzZXMsIHdlIG5lZWQgdGhlICdhZGQnIGNsYXNzZXMsIGFuZCBvbmx5IHRoZVxuXHQgIC8vICdhZGQnIGNsYXNzZXMgdG8gYmUgc2V0LlxuXHQgIGFsbC5mb3JFYWNoKGZ1bmN0aW9uIChjbHMpIHtcblx0ICAgIGlmIChhZGQuaW5kZXhPZihjbHMpID09PSAtMSAmJiBoYXNDbGFzcyhlbCwgY2xzKSkge1xuXHQgICAgICByZW1vdmVDbGFzcyhlbCwgY2xzKTtcblx0ICAgIH1cblx0ICB9KTtcblxuXHQgIGFkZC5mb3JFYWNoKGZ1bmN0aW9uIChjbHMpIHtcblx0ICAgIGlmICghaGFzQ2xhc3MoZWwsIGNscykpIHtcblx0ICAgICAgYWRkQ2xhc3MoZWwsIGNscyk7XG5cdCAgICB9XG5cdCAgfSk7XG5cdH1cblxuXHR2YXIgZGVmZXJyZWQgPSBbXTtcblxuXHR2YXIgZGVmZXIgPSBmdW5jdGlvbiBkZWZlcihmbikge1xuXHQgIGRlZmVycmVkLnB1c2goZm4pO1xuXHR9O1xuXG5cdHZhciBmbHVzaCA9IGZ1bmN0aW9uIGZsdXNoKCkge1xuXHQgIHZhciBmbiA9IHVuZGVmaW5lZDtcblx0ICB3aGlsZSAoZm4gPSBkZWZlcnJlZC5wb3AoKSkge1xuXHQgICAgZm4oKTtcblx0ICB9XG5cdH07XG5cblx0dmFyIEV2ZW50ZWQgPSAoZnVuY3Rpb24gKCkge1xuXHQgIGZ1bmN0aW9uIEV2ZW50ZWQoKSB7XG5cdCAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRXZlbnRlZCk7XG5cdCAgfVxuXG5cdCAgX2NyZWF0ZUNsYXNzKEV2ZW50ZWQsIFt7XG5cdCAgICBrZXk6ICdvbicsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gb24oZXZlbnQsIGhhbmRsZXIsIGN0eCkge1xuXHQgICAgICB2YXIgb25jZSA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMyB8fCBhcmd1bWVudHNbM10gPT09IHVuZGVmaW5lZCA/IGZhbHNlIDogYXJndW1lbnRzWzNdO1xuXG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5iaW5kaW5ncyA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICB0aGlzLmJpbmRpbmdzID0ge307XG5cdCAgICAgIH1cblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLmJpbmRpbmdzW2V2ZW50XSA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICB0aGlzLmJpbmRpbmdzW2V2ZW50XSA9IFtdO1xuXHQgICAgICB9XG5cdCAgICAgIHRoaXMuYmluZGluZ3NbZXZlbnRdLnB1c2goeyBoYW5kbGVyOiBoYW5kbGVyLCBjdHg6IGN0eCwgb25jZTogb25jZSB9KTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdvbmNlJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBvbmNlKGV2ZW50LCBoYW5kbGVyLCBjdHgpIHtcblx0ICAgICAgdGhpcy5vbihldmVudCwgaGFuZGxlciwgY3R4LCB0cnVlKTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdvZmYnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIG9mZihldmVudCwgaGFuZGxlcikge1xuXHQgICAgICBpZiAodHlwZW9mIHRoaXMuYmluZGluZ3MgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiB0aGlzLmJpbmRpbmdzW2V2ZW50XSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICByZXR1cm47XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAodHlwZW9mIGhhbmRsZXIgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgZGVsZXRlIHRoaXMuYmluZGluZ3NbZXZlbnRdO1xuXHQgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIHZhciBpID0gMDtcblx0ICAgICAgICB3aGlsZSAoaSA8IHRoaXMuYmluZGluZ3NbZXZlbnRdLmxlbmd0aCkge1xuXHQgICAgICAgICAgaWYgKHRoaXMuYmluZGluZ3NbZXZlbnRdW2ldLmhhbmRsZXIgPT09IGhhbmRsZXIpIHtcblx0ICAgICAgICAgICAgdGhpcy5iaW5kaW5nc1tldmVudF0uc3BsaWNlKGksIDEpO1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgKytpO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ3RyaWdnZXInLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIHRyaWdnZXIoZXZlbnQpIHtcblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLmJpbmRpbmdzICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLmJpbmRpbmdzW2V2ZW50XSkge1xuXHQgICAgICAgIHZhciBpID0gMDtcblxuXHQgICAgICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gQXJyYXkoX2xlbiA+IDEgPyBfbGVuIC0gMSA6IDApLCBfa2V5ID0gMTsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuXHQgICAgICAgICAgYXJnc1tfa2V5IC0gMV0gPSBhcmd1bWVudHNbX2tleV07XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgd2hpbGUgKGkgPCB0aGlzLmJpbmRpbmdzW2V2ZW50XS5sZW5ndGgpIHtcblx0ICAgICAgICAgIHZhciBfYmluZGluZ3MkZXZlbnQkaSA9IHRoaXMuYmluZGluZ3NbZXZlbnRdW2ldO1xuXHQgICAgICAgICAgdmFyIGhhbmRsZXIgPSBfYmluZGluZ3MkZXZlbnQkaS5oYW5kbGVyO1xuXHQgICAgICAgICAgdmFyIGN0eCA9IF9iaW5kaW5ncyRldmVudCRpLmN0eDtcblx0ICAgICAgICAgIHZhciBvbmNlID0gX2JpbmRpbmdzJGV2ZW50JGkub25jZTtcblxuXHQgICAgICAgICAgdmFyIGNvbnRleHQgPSBjdHg7XG5cdCAgICAgICAgICBpZiAodHlwZW9mIGNvbnRleHQgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgICAgIGNvbnRleHQgPSB0aGlzO1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBoYW5kbGVyLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXG5cdCAgICAgICAgICBpZiAob25jZSkge1xuXHQgICAgICAgICAgICB0aGlzLmJpbmRpbmdzW2V2ZW50XS5zcGxpY2UoaSwgMSk7XG5cdCAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICArK2k7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfV0pO1xuXG5cdCAgcmV0dXJuIEV2ZW50ZWQ7XG5cdH0pKCk7XG5cblx0VGV0aGVyQmFzZS5VdGlscyA9IHtcblx0ICBnZXRTY3JvbGxQYXJlbnQ6IGdldFNjcm9sbFBhcmVudCxcblx0ICBnZXRCb3VuZHM6IGdldEJvdW5kcyxcblx0ICBnZXRPZmZzZXRQYXJlbnQ6IGdldE9mZnNldFBhcmVudCxcblx0ICBleHRlbmQ6IGV4dGVuZCxcblx0ICBhZGRDbGFzczogYWRkQ2xhc3MsXG5cdCAgcmVtb3ZlQ2xhc3M6IHJlbW92ZUNsYXNzLFxuXHQgIGhhc0NsYXNzOiBoYXNDbGFzcyxcblx0ICB1cGRhdGVDbGFzc2VzOiB1cGRhdGVDbGFzc2VzLFxuXHQgIGRlZmVyOiBkZWZlcixcblx0ICBmbHVzaDogZmx1c2gsXG5cdCAgdW5pcXVlSWQ6IHVuaXF1ZUlkLFxuXHQgIEV2ZW50ZWQ6IEV2ZW50ZWQsXG5cdCAgZ2V0U2Nyb2xsQmFyU2l6ZTogZ2V0U2Nyb2xsQmFyU2l6ZVxuXHR9O1xuXHQvKiBnbG9iYWxzIFRldGhlckJhc2UsIHBlcmZvcm1hbmNlICovXG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBfc2xpY2VkVG9BcnJheSA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIHNsaWNlSXRlcmF0b3IoYXJyLCBpKSB7IHZhciBfYXJyID0gW107IHZhciBfbiA9IHRydWU7IHZhciBfZCA9IGZhbHNlOyB2YXIgX2UgPSB1bmRlZmluZWQ7IHRyeSB7IGZvciAodmFyIF9pID0gYXJyW1N5bWJvbC5pdGVyYXRvcl0oKSwgX3M7ICEoX24gPSAoX3MgPSBfaS5uZXh0KCkpLmRvbmUpOyBfbiA9IHRydWUpIHsgX2Fyci5wdXNoKF9zLnZhbHVlKTsgaWYgKGkgJiYgX2Fyci5sZW5ndGggPT09IGkpIGJyZWFrOyB9IH0gY2F0Y2ggKGVycikgeyBfZCA9IHRydWU7IF9lID0gZXJyOyB9IGZpbmFsbHkgeyB0cnkgeyBpZiAoIV9uICYmIF9pWydyZXR1cm4nXSkgX2lbJ3JldHVybiddKCk7IH0gZmluYWxseSB7IGlmIChfZCkgdGhyb3cgX2U7IH0gfSByZXR1cm4gX2FycjsgfSByZXR1cm4gZnVuY3Rpb24gKGFyciwgaSkgeyBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7IHJldHVybiBhcnI7IH0gZWxzZSBpZiAoU3ltYm9sLml0ZXJhdG9yIGluIE9iamVjdChhcnIpKSB7IHJldHVybiBzbGljZUl0ZXJhdG9yKGFyciwgaSk7IH0gZWxzZSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgYXR0ZW1wdCB0byBkZXN0cnVjdHVyZSBub24taXRlcmFibGUgaW5zdGFuY2UnKTsgfSB9OyB9KSgpO1xuXG5cdHZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKCd2YWx1ZScgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cblx0ZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cblx0aWYgKHR5cGVvZiBUZXRoZXJCYXNlID09PSAndW5kZWZpbmVkJykge1xuXHQgIHRocm93IG5ldyBFcnJvcignWW91IG11c3QgaW5jbHVkZSB0aGUgdXRpbHMuanMgZmlsZSBiZWZvcmUgdGV0aGVyLmpzJyk7XG5cdH1cblxuXHR2YXIgX1RldGhlckJhc2UkVXRpbHMgPSBUZXRoZXJCYXNlLlV0aWxzO1xuXHR2YXIgZ2V0U2Nyb2xsUGFyZW50ID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0U2Nyb2xsUGFyZW50O1xuXHR2YXIgZ2V0Qm91bmRzID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0Qm91bmRzO1xuXHR2YXIgZ2V0T2Zmc2V0UGFyZW50ID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0T2Zmc2V0UGFyZW50O1xuXHR2YXIgZXh0ZW5kID0gX1RldGhlckJhc2UkVXRpbHMuZXh0ZW5kO1xuXHR2YXIgYWRkQ2xhc3MgPSBfVGV0aGVyQmFzZSRVdGlscy5hZGRDbGFzcztcblx0dmFyIHJlbW92ZUNsYXNzID0gX1RldGhlckJhc2UkVXRpbHMucmVtb3ZlQ2xhc3M7XG5cdHZhciB1cGRhdGVDbGFzc2VzID0gX1RldGhlckJhc2UkVXRpbHMudXBkYXRlQ2xhc3Nlcztcblx0dmFyIGRlZmVyID0gX1RldGhlckJhc2UkVXRpbHMuZGVmZXI7XG5cdHZhciBmbHVzaCA9IF9UZXRoZXJCYXNlJFV0aWxzLmZsdXNoO1xuXHR2YXIgZ2V0U2Nyb2xsQmFyU2l6ZSA9IF9UZXRoZXJCYXNlJFV0aWxzLmdldFNjcm9sbEJhclNpemU7XG5cblx0ZnVuY3Rpb24gd2l0aGluKGEsIGIpIHtcblx0ICB2YXIgZGlmZiA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMiB8fCBhcmd1bWVudHNbMl0gPT09IHVuZGVmaW5lZCA/IDEgOiBhcmd1bWVudHNbMl07XG5cblx0ICByZXR1cm4gYSArIGRpZmYgPj0gYiAmJiBiID49IGEgLSBkaWZmO1xuXHR9XG5cblx0dmFyIHRyYW5zZm9ybUtleSA9IChmdW5jdGlvbiAoKSB7XG5cdCAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIHJldHVybiAnJztcblx0ICB9XG5cdCAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cblx0ICB2YXIgdHJhbnNmb3JtcyA9IFsndHJhbnNmb3JtJywgJ3dlYmtpdFRyYW5zZm9ybScsICdPVHJhbnNmb3JtJywgJ01velRyYW5zZm9ybScsICdtc1RyYW5zZm9ybSddO1xuXHQgIGZvciAodmFyIGkgPSAwOyBpIDwgdHJhbnNmb3Jtcy5sZW5ndGg7ICsraSkge1xuXHQgICAgdmFyIGtleSA9IHRyYW5zZm9ybXNbaV07XG5cdCAgICBpZiAoZWwuc3R5bGVba2V5XSAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgIHJldHVybiBrZXk7XG5cdCAgICB9XG5cdCAgfVxuXHR9KSgpO1xuXG5cdHZhciB0ZXRoZXJzID0gW107XG5cblx0dmFyIHBvc2l0aW9uID0gZnVuY3Rpb24gcG9zaXRpb24oKSB7XG5cdCAgdGV0aGVycy5mb3JFYWNoKGZ1bmN0aW9uICh0ZXRoZXIpIHtcblx0ICAgIHRldGhlci5wb3NpdGlvbihmYWxzZSk7XG5cdCAgfSk7XG5cdCAgZmx1c2goKTtcblx0fTtcblxuXHRmdW5jdGlvbiBub3coKSB7XG5cdCAgaWYgKHR5cGVvZiBwZXJmb3JtYW5jZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHBlcmZvcm1hbmNlLm5vdyAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIHJldHVybiBwZXJmb3JtYW5jZS5ub3coKTtcblx0ICB9XG5cdCAgcmV0dXJuICtuZXcgRGF0ZSgpO1xuXHR9XG5cblx0KGZ1bmN0aW9uICgpIHtcblx0ICB2YXIgbGFzdENhbGwgPSBudWxsO1xuXHQgIHZhciBsYXN0RHVyYXRpb24gPSBudWxsO1xuXHQgIHZhciBwZW5kaW5nVGltZW91dCA9IG51bGw7XG5cblx0ICB2YXIgdGljayA9IGZ1bmN0aW9uIHRpY2soKSB7XG5cdCAgICBpZiAodHlwZW9mIGxhc3REdXJhdGlvbiAhPT0gJ3VuZGVmaW5lZCcgJiYgbGFzdER1cmF0aW9uID4gMTYpIHtcblx0ICAgICAgLy8gV2Ugdm9sdW50YXJpbHkgdGhyb3R0bGUgb3Vyc2VsdmVzIGlmIHdlIGNhbid0IG1hbmFnZSA2MGZwc1xuXHQgICAgICBsYXN0RHVyYXRpb24gPSBNYXRoLm1pbihsYXN0RHVyYXRpb24gLSAxNiwgMjUwKTtcblxuXHQgICAgICAvLyBKdXN0IGluIGNhc2UgdGhpcyBpcyB0aGUgbGFzdCBldmVudCwgcmVtZW1iZXIgdG8gcG9zaXRpb24ganVzdCBvbmNlIG1vcmVcblx0ICAgICAgcGVuZGluZ1RpbWVvdXQgPSBzZXRUaW1lb3V0KHRpY2ssIDI1MCk7XG5cdCAgICAgIHJldHVybjtcblx0ICAgIH1cblxuXHQgICAgaWYgKHR5cGVvZiBsYXN0Q2FsbCAhPT0gJ3VuZGVmaW5lZCcgJiYgbm93KCkgLSBsYXN0Q2FsbCA8IDEwKSB7XG5cdCAgICAgIC8vIFNvbWUgYnJvd3NlcnMgY2FsbCBldmVudHMgYSBsaXR0bGUgdG9vIGZyZXF1ZW50bHksIHJlZnVzZSB0byBydW4gbW9yZSB0aGFuIGlzIHJlYXNvbmFibGVcblx0ICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXG5cdCAgICBpZiAodHlwZW9mIHBlbmRpbmdUaW1lb3V0ICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICBjbGVhclRpbWVvdXQocGVuZGluZ1RpbWVvdXQpO1xuXHQgICAgICBwZW5kaW5nVGltZW91dCA9IG51bGw7XG5cdCAgICB9XG5cblx0ICAgIGxhc3RDYWxsID0gbm93KCk7XG5cdCAgICBwb3NpdGlvbigpO1xuXHQgICAgbGFzdER1cmF0aW9uID0gbm93KCkgLSBsYXN0Q2FsbDtcblx0ICB9O1xuXG5cdCAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICBbJ3Jlc2l6ZScsICdzY3JvbGwnLCAndG91Y2htb3ZlJ10uZm9yRWFjaChmdW5jdGlvbiAoZXZlbnQpIHtcblx0ICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIHRpY2spO1xuXHQgICAgfSk7XG5cdCAgfVxuXHR9KSgpO1xuXG5cdHZhciBNSVJST1JfTFIgPSB7XG5cdCAgY2VudGVyOiAnY2VudGVyJyxcblx0ICBsZWZ0OiAncmlnaHQnLFxuXHQgIHJpZ2h0OiAnbGVmdCdcblx0fTtcblxuXHR2YXIgTUlSUk9SX1RCID0ge1xuXHQgIG1pZGRsZTogJ21pZGRsZScsXG5cdCAgdG9wOiAnYm90dG9tJyxcblx0ICBib3R0b206ICd0b3AnXG5cdH07XG5cblx0dmFyIE9GRlNFVF9NQVAgPSB7XG5cdCAgdG9wOiAwLFxuXHQgIGxlZnQ6IDAsXG5cdCAgbWlkZGxlOiAnNTAlJyxcblx0ICBjZW50ZXI6ICc1MCUnLFxuXHQgIGJvdHRvbTogJzEwMCUnLFxuXHQgIHJpZ2h0OiAnMTAwJSdcblx0fTtcblxuXHR2YXIgYXV0b1RvRml4ZWRBdHRhY2htZW50ID0gZnVuY3Rpb24gYXV0b1RvRml4ZWRBdHRhY2htZW50KGF0dGFjaG1lbnQsIHJlbGF0aXZlVG9BdHRhY2htZW50KSB7XG5cdCAgdmFyIGxlZnQgPSBhdHRhY2htZW50LmxlZnQ7XG5cdCAgdmFyIHRvcCA9IGF0dGFjaG1lbnQudG9wO1xuXG5cdCAgaWYgKGxlZnQgPT09ICdhdXRvJykge1xuXHQgICAgbGVmdCA9IE1JUlJPUl9MUltyZWxhdGl2ZVRvQXR0YWNobWVudC5sZWZ0XTtcblx0ICB9XG5cblx0ICBpZiAodG9wID09PSAnYXV0bycpIHtcblx0ICAgIHRvcCA9IE1JUlJPUl9UQltyZWxhdGl2ZVRvQXR0YWNobWVudC50b3BdO1xuXHQgIH1cblxuXHQgIHJldHVybiB7IGxlZnQ6IGxlZnQsIHRvcDogdG9wIH07XG5cdH07XG5cblx0dmFyIGF0dGFjaG1lbnRUb09mZnNldCA9IGZ1bmN0aW9uIGF0dGFjaG1lbnRUb09mZnNldChhdHRhY2htZW50KSB7XG5cdCAgdmFyIGxlZnQgPSBhdHRhY2htZW50LmxlZnQ7XG5cdCAgdmFyIHRvcCA9IGF0dGFjaG1lbnQudG9wO1xuXG5cdCAgaWYgKHR5cGVvZiBPRkZTRVRfTUFQW2F0dGFjaG1lbnQubGVmdF0gIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICBsZWZ0ID0gT0ZGU0VUX01BUFthdHRhY2htZW50LmxlZnRdO1xuXHQgIH1cblxuXHQgIGlmICh0eXBlb2YgT0ZGU0VUX01BUFthdHRhY2htZW50LnRvcF0gIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICB0b3AgPSBPRkZTRVRfTUFQW2F0dGFjaG1lbnQudG9wXTtcblx0ICB9XG5cblx0ICByZXR1cm4geyBsZWZ0OiBsZWZ0LCB0b3A6IHRvcCB9O1xuXHR9O1xuXG5cdGZ1bmN0aW9uIGFkZE9mZnNldCgpIHtcblx0ICB2YXIgb3V0ID0geyB0b3A6IDAsIGxlZnQ6IDAgfTtcblxuXHQgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBvZmZzZXRzID0gQXJyYXkoX2xlbiksIF9rZXkgPSAwOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG5cdCAgICBvZmZzZXRzW19rZXldID0gYXJndW1lbnRzW19rZXldO1xuXHQgIH1cblxuXHQgIG9mZnNldHMuZm9yRWFjaChmdW5jdGlvbiAoX3JlZikge1xuXHQgICAgdmFyIHRvcCA9IF9yZWYudG9wO1xuXHQgICAgdmFyIGxlZnQgPSBfcmVmLmxlZnQ7XG5cblx0ICAgIGlmICh0eXBlb2YgdG9wID09PSAnc3RyaW5nJykge1xuXHQgICAgICB0b3AgPSBwYXJzZUZsb2F0KHRvcCwgMTApO1xuXHQgICAgfVxuXHQgICAgaWYgKHR5cGVvZiBsZWZ0ID09PSAnc3RyaW5nJykge1xuXHQgICAgICBsZWZ0ID0gcGFyc2VGbG9hdChsZWZ0LCAxMCk7XG5cdCAgICB9XG5cblx0ICAgIG91dC50b3AgKz0gdG9wO1xuXHQgICAgb3V0LmxlZnQgKz0gbGVmdDtcblx0ICB9KTtcblxuXHQgIHJldHVybiBvdXQ7XG5cdH1cblxuXHRmdW5jdGlvbiBvZmZzZXRUb1B4KG9mZnNldCwgc2l6ZSkge1xuXHQgIGlmICh0eXBlb2Ygb2Zmc2V0LmxlZnQgPT09ICdzdHJpbmcnICYmIG9mZnNldC5sZWZ0LmluZGV4T2YoJyUnKSAhPT0gLTEpIHtcblx0ICAgIG9mZnNldC5sZWZ0ID0gcGFyc2VGbG9hdChvZmZzZXQubGVmdCwgMTApIC8gMTAwICogc2l6ZS53aWR0aDtcblx0ICB9XG5cdCAgaWYgKHR5cGVvZiBvZmZzZXQudG9wID09PSAnc3RyaW5nJyAmJiBvZmZzZXQudG9wLmluZGV4T2YoJyUnKSAhPT0gLTEpIHtcblx0ICAgIG9mZnNldC50b3AgPSBwYXJzZUZsb2F0KG9mZnNldC50b3AsIDEwKSAvIDEwMCAqIHNpemUuaGVpZ2h0O1xuXHQgIH1cblxuXHQgIHJldHVybiBvZmZzZXQ7XG5cdH1cblxuXHR2YXIgcGFyc2VPZmZzZXQgPSBmdW5jdGlvbiBwYXJzZU9mZnNldCh2YWx1ZSkge1xuXHQgIHZhciBfdmFsdWUkc3BsaXQgPSB2YWx1ZS5zcGxpdCgnICcpO1xuXG5cdCAgdmFyIF92YWx1ZSRzcGxpdDIgPSBfc2xpY2VkVG9BcnJheShfdmFsdWUkc3BsaXQsIDIpO1xuXG5cdCAgdmFyIHRvcCA9IF92YWx1ZSRzcGxpdDJbMF07XG5cdCAgdmFyIGxlZnQgPSBfdmFsdWUkc3BsaXQyWzFdO1xuXG5cdCAgcmV0dXJuIHsgdG9wOiB0b3AsIGxlZnQ6IGxlZnQgfTtcblx0fTtcblx0dmFyIHBhcnNlQXR0YWNobWVudCA9IHBhcnNlT2Zmc2V0O1xuXG5cdHZhciBUZXRoZXJDbGFzcyA9IChmdW5jdGlvbiAoKSB7XG5cdCAgZnVuY3Rpb24gVGV0aGVyQ2xhc3Mob3B0aW9ucykge1xuXHQgICAgdmFyIF90aGlzID0gdGhpcztcblxuXHQgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFRldGhlckNsYXNzKTtcblxuXHQgICAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uYmluZCh0aGlzKTtcblxuXHQgICAgdGV0aGVycy5wdXNoKHRoaXMpO1xuXG5cdCAgICB0aGlzLmhpc3RvcnkgPSBbXTtcblxuXHQgICAgdGhpcy5zZXRPcHRpb25zKG9wdGlvbnMsIGZhbHNlKTtcblxuXHQgICAgVGV0aGVyQmFzZS5tb2R1bGVzLmZvckVhY2goZnVuY3Rpb24gKG1vZHVsZSkge1xuXHQgICAgICBpZiAodHlwZW9mIG1vZHVsZS5pbml0aWFsaXplICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIG1vZHVsZS5pbml0aWFsaXplLmNhbGwoX3RoaXMpO1xuXHQgICAgICB9XG5cdCAgICB9KTtcblxuXHQgICAgdGhpcy5wb3NpdGlvbigpO1xuXHQgIH1cblxuXHQgIF9jcmVhdGVDbGFzcyhUZXRoZXJDbGFzcywgW3tcblx0ICAgIGtleTogJ2dldENsYXNzJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRDbGFzcygpIHtcblx0ICAgICAgdmFyIGtleSA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/ICcnIDogYXJndW1lbnRzWzBdO1xuXHQgICAgICB2YXIgY2xhc3NlcyA9IHRoaXMub3B0aW9ucy5jbGFzc2VzO1xuXG5cdCAgICAgIGlmICh0eXBlb2YgY2xhc3NlcyAhPT0gJ3VuZGVmaW5lZCcgJiYgY2xhc3Nlc1trZXldKSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5jbGFzc2VzW2tleV07XG5cdCAgICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmNsYXNzUHJlZml4KSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5jbGFzc1ByZWZpeCArICctJyArIGtleTtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICByZXR1cm4ga2V5O1xuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnc2V0T3B0aW9ucycsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gc2V0T3B0aW9ucyhvcHRpb25zKSB7XG5cdCAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuXG5cdCAgICAgIHZhciBwb3MgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDEgfHwgYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyB0cnVlIDogYXJndW1lbnRzWzFdO1xuXG5cdCAgICAgIHZhciBkZWZhdWx0cyA9IHtcblx0ICAgICAgICBvZmZzZXQ6ICcwIDAnLFxuXHQgICAgICAgIHRhcmdldE9mZnNldDogJzAgMCcsXG5cdCAgICAgICAgdGFyZ2V0QXR0YWNobWVudDogJ2F1dG8gYXV0bycsXG5cdCAgICAgICAgY2xhc3NQcmVmaXg6ICd0ZXRoZXInXG5cdCAgICAgIH07XG5cblx0ICAgICAgdGhpcy5vcHRpb25zID0gZXh0ZW5kKGRlZmF1bHRzLCBvcHRpb25zKTtcblxuXHQgICAgICB2YXIgX29wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG5cdCAgICAgIHZhciBlbGVtZW50ID0gX29wdGlvbnMuZWxlbWVudDtcblx0ICAgICAgdmFyIHRhcmdldCA9IF9vcHRpb25zLnRhcmdldDtcblx0ICAgICAgdmFyIHRhcmdldE1vZGlmaWVyID0gX29wdGlvbnMudGFyZ2V0TW9kaWZpZXI7XG5cblx0ICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcblx0ICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG5cdCAgICAgIHRoaXMudGFyZ2V0TW9kaWZpZXIgPSB0YXJnZXRNb2RpZmllcjtcblxuXHQgICAgICBpZiAodGhpcy50YXJnZXQgPT09ICd2aWV3cG9ydCcpIHtcblx0ICAgICAgICB0aGlzLnRhcmdldCA9IGRvY3VtZW50LmJvZHk7XG5cdCAgICAgICAgdGhpcy50YXJnZXRNb2RpZmllciA9ICd2aXNpYmxlJztcblx0ICAgICAgfSBlbHNlIGlmICh0aGlzLnRhcmdldCA9PT0gJ3Njcm9sbC1oYW5kbGUnKSB7XG5cdCAgICAgICAgdGhpcy50YXJnZXQgPSBkb2N1bWVudC5ib2R5O1xuXHQgICAgICAgIHRoaXMudGFyZ2V0TW9kaWZpZXIgPSAnc2Nyb2xsLWhhbmRsZSc7XG5cdCAgICAgIH1cblxuXHQgICAgICBbJ2VsZW1lbnQnLCAndGFyZ2V0J10uZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG5cdCAgICAgICAgaWYgKHR5cGVvZiBfdGhpczJba2V5XSA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGV0aGVyIEVycm9yOiBCb3RoIGVsZW1lbnQgYW5kIHRhcmdldCBtdXN0IGJlIGRlZmluZWQnKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAodHlwZW9mIF90aGlzMltrZXldLmpxdWVyeSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICAgIF90aGlzMltrZXldID0gX3RoaXMyW2tleV1bMF07XG5cdCAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgX3RoaXMyW2tleV0gPT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgICBfdGhpczJba2V5XSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoX3RoaXMyW2tleV0pO1xuXHQgICAgICAgIH1cblx0ICAgICAgfSk7XG5cblx0ICAgICAgYWRkQ2xhc3ModGhpcy5lbGVtZW50LCB0aGlzLmdldENsYXNzKCdlbGVtZW50JykpO1xuXHQgICAgICBpZiAoISh0aGlzLm9wdGlvbnMuYWRkVGFyZ2V0Q2xhc3NlcyA9PT0gZmFsc2UpKSB7XG5cdCAgICAgICAgYWRkQ2xhc3ModGhpcy50YXJnZXQsIHRoaXMuZ2V0Q2xhc3MoJ3RhcmdldCcpKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICghdGhpcy5vcHRpb25zLmF0dGFjaG1lbnQpIHtcblx0ICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RldGhlciBFcnJvcjogWW91IG11c3QgcHJvdmlkZSBhbiBhdHRhY2htZW50Jyk7XG5cdCAgICAgIH1cblxuXHQgICAgICB0aGlzLnRhcmdldEF0dGFjaG1lbnQgPSBwYXJzZUF0dGFjaG1lbnQodGhpcy5vcHRpb25zLnRhcmdldEF0dGFjaG1lbnQpO1xuXHQgICAgICB0aGlzLmF0dGFjaG1lbnQgPSBwYXJzZUF0dGFjaG1lbnQodGhpcy5vcHRpb25zLmF0dGFjaG1lbnQpO1xuXHQgICAgICB0aGlzLm9mZnNldCA9IHBhcnNlT2Zmc2V0KHRoaXMub3B0aW9ucy5vZmZzZXQpO1xuXHQgICAgICB0aGlzLnRhcmdldE9mZnNldCA9IHBhcnNlT2Zmc2V0KHRoaXMub3B0aW9ucy50YXJnZXRPZmZzZXQpO1xuXG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5zY3JvbGxQYXJlbnQgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgdGhpcy5kaXNhYmxlKCk7XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAodGhpcy50YXJnZXRNb2RpZmllciA9PT0gJ3Njcm9sbC1oYW5kbGUnKSB7XG5cdCAgICAgICAgdGhpcy5zY3JvbGxQYXJlbnQgPSB0aGlzLnRhcmdldDtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICB0aGlzLnNjcm9sbFBhcmVudCA9IGdldFNjcm9sbFBhcmVudCh0aGlzLnRhcmdldCk7XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAoISh0aGlzLm9wdGlvbnMuZW5hYmxlZCA9PT0gZmFsc2UpKSB7XG5cdCAgICAgICAgdGhpcy5lbmFibGUocG9zKTtcblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2dldFRhcmdldEJvdW5kcycsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0VGFyZ2V0Qm91bmRzKCkge1xuXHQgICAgICBpZiAodHlwZW9mIHRoaXMudGFyZ2V0TW9kaWZpZXIgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgaWYgKHRoaXMudGFyZ2V0TW9kaWZpZXIgPT09ICd2aXNpYmxlJykge1xuXHQgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0ID09PSBkb2N1bWVudC5ib2R5KSB7XG5cdCAgICAgICAgICAgIHJldHVybiB7IHRvcDogcGFnZVlPZmZzZXQsIGxlZnQ6IHBhZ2VYT2Zmc2V0LCBoZWlnaHQ6IGlubmVySGVpZ2h0LCB3aWR0aDogaW5uZXJXaWR0aCB9O1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgdmFyIGJvdW5kcyA9IGdldEJvdW5kcyh0aGlzLnRhcmdldCk7XG5cblx0ICAgICAgICAgICAgdmFyIG91dCA9IHtcblx0ICAgICAgICAgICAgICBoZWlnaHQ6IGJvdW5kcy5oZWlnaHQsXG5cdCAgICAgICAgICAgICAgd2lkdGg6IGJvdW5kcy53aWR0aCxcblx0ICAgICAgICAgICAgICB0b3A6IGJvdW5kcy50b3AsXG5cdCAgICAgICAgICAgICAgbGVmdDogYm91bmRzLmxlZnRcblx0ICAgICAgICAgICAgfTtcblxuXHQgICAgICAgICAgICBvdXQuaGVpZ2h0ID0gTWF0aC5taW4ob3V0LmhlaWdodCwgYm91bmRzLmhlaWdodCAtIChwYWdlWU9mZnNldCAtIGJvdW5kcy50b3ApKTtcblx0ICAgICAgICAgICAgb3V0LmhlaWdodCA9IE1hdGgubWluKG91dC5oZWlnaHQsIGJvdW5kcy5oZWlnaHQgLSAoYm91bmRzLnRvcCArIGJvdW5kcy5oZWlnaHQgLSAocGFnZVlPZmZzZXQgKyBpbm5lckhlaWdodCkpKTtcblx0ICAgICAgICAgICAgb3V0LmhlaWdodCA9IE1hdGgubWluKGlubmVySGVpZ2h0LCBvdXQuaGVpZ2h0KTtcblx0ICAgICAgICAgICAgb3V0LmhlaWdodCAtPSAyO1xuXG5cdCAgICAgICAgICAgIG91dC53aWR0aCA9IE1hdGgubWluKG91dC53aWR0aCwgYm91bmRzLndpZHRoIC0gKHBhZ2VYT2Zmc2V0IC0gYm91bmRzLmxlZnQpKTtcblx0ICAgICAgICAgICAgb3V0LndpZHRoID0gTWF0aC5taW4ob3V0LndpZHRoLCBib3VuZHMud2lkdGggLSAoYm91bmRzLmxlZnQgKyBib3VuZHMud2lkdGggLSAocGFnZVhPZmZzZXQgKyBpbm5lcldpZHRoKSkpO1xuXHQgICAgICAgICAgICBvdXQud2lkdGggPSBNYXRoLm1pbihpbm5lcldpZHRoLCBvdXQud2lkdGgpO1xuXHQgICAgICAgICAgICBvdXQud2lkdGggLT0gMjtcblxuXHQgICAgICAgICAgICBpZiAob3V0LnRvcCA8IHBhZ2VZT2Zmc2V0KSB7XG5cdCAgICAgICAgICAgICAgb3V0LnRvcCA9IHBhZ2VZT2Zmc2V0O1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGlmIChvdXQubGVmdCA8IHBhZ2VYT2Zmc2V0KSB7XG5cdCAgICAgICAgICAgICAgb3V0LmxlZnQgPSBwYWdlWE9mZnNldDtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHJldHVybiBvdXQ7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfSBlbHNlIGlmICh0aGlzLnRhcmdldE1vZGlmaWVyID09PSAnc2Nyb2xsLWhhbmRsZScpIHtcblx0ICAgICAgICAgIHZhciBib3VuZHMgPSB1bmRlZmluZWQ7XG5cdCAgICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy50YXJnZXQ7XG5cdCAgICAgICAgICBpZiAodGFyZ2V0ID09PSBkb2N1bWVudC5ib2R5KSB7XG5cdCAgICAgICAgICAgIHRhcmdldCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblxuXHQgICAgICAgICAgICBib3VuZHMgPSB7XG5cdCAgICAgICAgICAgICAgbGVmdDogcGFnZVhPZmZzZXQsXG5cdCAgICAgICAgICAgICAgdG9wOiBwYWdlWU9mZnNldCxcblx0ICAgICAgICAgICAgICBoZWlnaHQ6IGlubmVySGVpZ2h0LFxuXHQgICAgICAgICAgICAgIHdpZHRoOiBpbm5lcldpZHRoXG5cdCAgICAgICAgICAgIH07XG5cdCAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICBib3VuZHMgPSBnZXRCb3VuZHModGFyZ2V0KTtcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgdmFyIHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZSh0YXJnZXQpO1xuXG5cdCAgICAgICAgICB2YXIgaGFzQm90dG9tU2Nyb2xsID0gdGFyZ2V0LnNjcm9sbFdpZHRoID4gdGFyZ2V0LmNsaWVudFdpZHRoIHx8IFtzdHlsZS5vdmVyZmxvdywgc3R5bGUub3ZlcmZsb3dYXS5pbmRleE9mKCdzY3JvbGwnKSA+PSAwIHx8IHRoaXMudGFyZ2V0ICE9PSBkb2N1bWVudC5ib2R5O1xuXG5cdCAgICAgICAgICB2YXIgc2Nyb2xsQm90dG9tID0gMDtcblx0ICAgICAgICAgIGlmIChoYXNCb3R0b21TY3JvbGwpIHtcblx0ICAgICAgICAgICAgc2Nyb2xsQm90dG9tID0gMTU7XG5cdCAgICAgICAgICB9XG5cblx0ICAgICAgICAgIHZhciBoZWlnaHQgPSBib3VuZHMuaGVpZ2h0IC0gcGFyc2VGbG9hdChzdHlsZS5ib3JkZXJUb3BXaWR0aCkgLSBwYXJzZUZsb2F0KHN0eWxlLmJvcmRlckJvdHRvbVdpZHRoKSAtIHNjcm9sbEJvdHRvbTtcblxuXHQgICAgICAgICAgdmFyIG91dCA9IHtcblx0ICAgICAgICAgICAgd2lkdGg6IDE1LFxuXHQgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCAqIDAuOTc1ICogKGhlaWdodCAvIHRhcmdldC5zY3JvbGxIZWlnaHQpLFxuXHQgICAgICAgICAgICBsZWZ0OiBib3VuZHMubGVmdCArIGJvdW5kcy53aWR0aCAtIHBhcnNlRmxvYXQoc3R5bGUuYm9yZGVyTGVmdFdpZHRoKSAtIDE1XG5cdCAgICAgICAgICB9O1xuXG5cdCAgICAgICAgICB2YXIgZml0QWRqID0gMDtcblx0ICAgICAgICAgIGlmIChoZWlnaHQgPCA0MDggJiYgdGhpcy50YXJnZXQgPT09IGRvY3VtZW50LmJvZHkpIHtcblx0ICAgICAgICAgICAgZml0QWRqID0gLTAuMDAwMTEgKiBNYXRoLnBvdyhoZWlnaHQsIDIpIC0gMC4wMDcyNyAqIGhlaWdodCArIDIyLjU4O1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBpZiAodGhpcy50YXJnZXQgIT09IGRvY3VtZW50LmJvZHkpIHtcblx0ICAgICAgICAgICAgb3V0LmhlaWdodCA9IE1hdGgubWF4KG91dC5oZWlnaHQsIDI0KTtcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgdmFyIHNjcm9sbFBlcmNlbnRhZ2UgPSB0aGlzLnRhcmdldC5zY3JvbGxUb3AgLyAodGFyZ2V0LnNjcm9sbEhlaWdodCAtIGhlaWdodCk7XG5cdCAgICAgICAgICBvdXQudG9wID0gc2Nyb2xsUGVyY2VudGFnZSAqIChoZWlnaHQgLSBvdXQuaGVpZ2h0IC0gZml0QWRqKSArIGJvdW5kcy50b3AgKyBwYXJzZUZsb2F0KHN0eWxlLmJvcmRlclRvcFdpZHRoKTtcblxuXHQgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0ID09PSBkb2N1bWVudC5ib2R5KSB7XG5cdCAgICAgICAgICAgIG91dC5oZWlnaHQgPSBNYXRoLm1heChvdXQuaGVpZ2h0LCAyNCk7XG5cdCAgICAgICAgICB9XG5cblx0ICAgICAgICAgIHJldHVybiBvdXQ7XG5cdCAgICAgICAgfVxuXHQgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIHJldHVybiBnZXRCb3VuZHModGhpcy50YXJnZXQpO1xuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnY2xlYXJDYWNoZScsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gY2xlYXJDYWNoZSgpIHtcblx0ICAgICAgdGhpcy5fY2FjaGUgPSB7fTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdjYWNoZScsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gY2FjaGUoaywgZ2V0dGVyKSB7XG5cdCAgICAgIC8vIE1vcmUgdGhhbiBvbmUgbW9kdWxlIHdpbGwgb2Z0ZW4gbmVlZCB0aGUgc2FtZSBET00gaW5mbywgc29cblx0ICAgICAgLy8gd2Uga2VlcCBhIGNhY2hlIHdoaWNoIGlzIGNsZWFyZWQgb24gZWFjaCBwb3NpdGlvbiBjYWxsXG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5fY2FjaGUgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgdGhpcy5fY2FjaGUgPSB7fTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5fY2FjaGVba10gPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgdGhpcy5fY2FjaGVba10gPSBnZXR0ZXIuY2FsbCh0aGlzKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIHJldHVybiB0aGlzLl9jYWNoZVtrXTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdlbmFibGUnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGVuYWJsZSgpIHtcblx0ICAgICAgdmFyIHBvcyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHRydWUgOiBhcmd1bWVudHNbMF07XG5cblx0ICAgICAgaWYgKCEodGhpcy5vcHRpb25zLmFkZFRhcmdldENsYXNzZXMgPT09IGZhbHNlKSkge1xuXHQgICAgICAgIGFkZENsYXNzKHRoaXMudGFyZ2V0LCB0aGlzLmdldENsYXNzKCdlbmFibGVkJykpO1xuXHQgICAgICB9XG5cdCAgICAgIGFkZENsYXNzKHRoaXMuZWxlbWVudCwgdGhpcy5nZXRDbGFzcygnZW5hYmxlZCcpKTtcblx0ICAgICAgdGhpcy5lbmFibGVkID0gdHJ1ZTtcblxuXHQgICAgICBpZiAodGhpcy5zY3JvbGxQYXJlbnQgIT09IGRvY3VtZW50KSB7XG5cdCAgICAgICAgdGhpcy5zY3JvbGxQYXJlbnQuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgdGhpcy5wb3NpdGlvbik7XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAocG9zKSB7XG5cdCAgICAgICAgdGhpcy5wb3NpdGlvbigpO1xuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnZGlzYWJsZScsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gZGlzYWJsZSgpIHtcblx0ICAgICAgcmVtb3ZlQ2xhc3ModGhpcy50YXJnZXQsIHRoaXMuZ2V0Q2xhc3MoJ2VuYWJsZWQnKSk7XG5cdCAgICAgIHJlbW92ZUNsYXNzKHRoaXMuZWxlbWVudCwgdGhpcy5nZXRDbGFzcygnZW5hYmxlZCcpKTtcblx0ICAgICAgdGhpcy5lbmFibGVkID0gZmFsc2U7XG5cblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLnNjcm9sbFBhcmVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICB0aGlzLnNjcm9sbFBhcmVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aGlzLnBvc2l0aW9uKTtcblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2Rlc3Ryb3knLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG5cdCAgICAgIHZhciBfdGhpczMgPSB0aGlzO1xuXG5cdCAgICAgIHRoaXMuZGlzYWJsZSgpO1xuXG5cdCAgICAgIHRldGhlcnMuZm9yRWFjaChmdW5jdGlvbiAodGV0aGVyLCBpKSB7XG5cdCAgICAgICAgaWYgKHRldGhlciA9PT0gX3RoaXMzKSB7XG5cdCAgICAgICAgICB0ZXRoZXJzLnNwbGljZShpLCAxKTtcblx0ICAgICAgICAgIHJldHVybjtcblx0ICAgICAgICB9XG5cdCAgICAgIH0pO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ3VwZGF0ZUF0dGFjaENsYXNzZXMnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIHVwZGF0ZUF0dGFjaENsYXNzZXMoZWxlbWVudEF0dGFjaCwgdGFyZ2V0QXR0YWNoKSB7XG5cdCAgICAgIHZhciBfdGhpczQgPSB0aGlzO1xuXG5cdCAgICAgIGVsZW1lbnRBdHRhY2ggPSBlbGVtZW50QXR0YWNoIHx8IHRoaXMuYXR0YWNobWVudDtcblx0ICAgICAgdGFyZ2V0QXR0YWNoID0gdGFyZ2V0QXR0YWNoIHx8IHRoaXMudGFyZ2V0QXR0YWNobWVudDtcblx0ICAgICAgdmFyIHNpZGVzID0gWydsZWZ0JywgJ3RvcCcsICdib3R0b20nLCAncmlnaHQnLCAnbWlkZGxlJywgJ2NlbnRlciddO1xuXG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5fYWRkQXR0YWNoQ2xhc3NlcyAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5fYWRkQXR0YWNoQ2xhc3Nlcy5sZW5ndGgpIHtcblx0ICAgICAgICAvLyB1cGRhdGVBdHRhY2hDbGFzc2VzIGNhbiBiZSBjYWxsZWQgbW9yZSB0aGFuIG9uY2UgaW4gYSBwb3NpdGlvbiBjYWxsLCBzb1xuXHQgICAgICAgIC8vIHdlIG5lZWQgdG8gY2xlYW4gdXAgYWZ0ZXIgb3Vyc2VsdmVzIHN1Y2ggdGhhdCB3aGVuIHRoZSBsYXN0IGRlZmVyIGdldHNcblx0ICAgICAgICAvLyByYW4gaXQgZG9lc24ndCBhZGQgYW55IGV4dHJhIGNsYXNzZXMgZnJvbSBwcmV2aW91cyBjYWxscy5cblx0ICAgICAgICB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzLnNwbGljZSgwLCB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzLmxlbmd0aCk7XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAodHlwZW9mIHRoaXMuX2FkZEF0dGFjaENsYXNzZXMgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgdGhpcy5fYWRkQXR0YWNoQ2xhc3NlcyA9IFtdO1xuXHQgICAgICB9XG5cdCAgICAgIHZhciBhZGQgPSB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzO1xuXG5cdCAgICAgIGlmIChlbGVtZW50QXR0YWNoLnRvcCkge1xuXHQgICAgICAgIGFkZC5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ2VsZW1lbnQtYXR0YWNoZWQnKSArICctJyArIGVsZW1lbnRBdHRhY2gudG9wKTtcblx0ICAgICAgfVxuXHQgICAgICBpZiAoZWxlbWVudEF0dGFjaC5sZWZ0KSB7XG5cdCAgICAgICAgYWRkLnB1c2godGhpcy5nZXRDbGFzcygnZWxlbWVudC1hdHRhY2hlZCcpICsgJy0nICsgZWxlbWVudEF0dGFjaC5sZWZ0KTtcblx0ICAgICAgfVxuXHQgICAgICBpZiAodGFyZ2V0QXR0YWNoLnRvcCkge1xuXHQgICAgICAgIGFkZC5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ3RhcmdldC1hdHRhY2hlZCcpICsgJy0nICsgdGFyZ2V0QXR0YWNoLnRvcCk7XG5cdCAgICAgIH1cblx0ICAgICAgaWYgKHRhcmdldEF0dGFjaC5sZWZ0KSB7XG5cdCAgICAgICAgYWRkLnB1c2godGhpcy5nZXRDbGFzcygndGFyZ2V0LWF0dGFjaGVkJykgKyAnLScgKyB0YXJnZXRBdHRhY2gubGVmdCk7XG5cdCAgICAgIH1cblxuXHQgICAgICB2YXIgYWxsID0gW107XG5cdCAgICAgIHNpZGVzLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcblx0ICAgICAgICBhbGwucHVzaChfdGhpczQuZ2V0Q2xhc3MoJ2VsZW1lbnQtYXR0YWNoZWQnKSArICctJyArIHNpZGUpO1xuXHQgICAgICAgIGFsbC5wdXNoKF90aGlzNC5nZXRDbGFzcygndGFyZ2V0LWF0dGFjaGVkJykgKyAnLScgKyBzaWRlKTtcblx0ICAgICAgfSk7XG5cblx0ICAgICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuXHQgICAgICAgIGlmICghKHR5cGVvZiBfdGhpczQuX2FkZEF0dGFjaENsYXNzZXMgIT09ICd1bmRlZmluZWQnKSkge1xuXHQgICAgICAgICAgcmV0dXJuO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXM0LmVsZW1lbnQsIF90aGlzNC5fYWRkQXR0YWNoQ2xhc3NlcywgYWxsKTtcblx0ICAgICAgICBpZiAoIShfdGhpczQub3B0aW9ucy5hZGRUYXJnZXRDbGFzc2VzID09PSBmYWxzZSkpIHtcblx0ICAgICAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXM0LnRhcmdldCwgX3RoaXM0Ll9hZGRBdHRhY2hDbGFzc2VzLCBhbGwpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGRlbGV0ZSBfdGhpczQuX2FkZEF0dGFjaENsYXNzZXM7XG5cdCAgICAgIH0pO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ3Bvc2l0aW9uJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBwb3NpdGlvbigpIHtcblx0ICAgICAgdmFyIF90aGlzNSA9IHRoaXM7XG5cblx0ICAgICAgdmFyIGZsdXNoQ2hhbmdlcyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHRydWUgOiBhcmd1bWVudHNbMF07XG5cblx0ICAgICAgLy8gZmx1c2hDaGFuZ2VzIGNvbW1pdHMgdGhlIGNoYW5nZXMgaW1tZWRpYXRlbHksIGxlYXZlIHRydWUgdW5sZXNzIHlvdSBhcmUgcG9zaXRpb25pbmcgbXVsdGlwbGVcblx0ICAgICAgLy8gdGV0aGVycyAoaW4gd2hpY2ggY2FzZSBjYWxsIFRldGhlci5VdGlscy5mbHVzaCB5b3Vyc2VsZiB3aGVuIHlvdSdyZSBkb25lKVxuXG5cdCAgICAgIGlmICghdGhpcy5lbmFibGVkKSB7XG5cdCAgICAgICAgcmV0dXJuO1xuXHQgICAgICB9XG5cblx0ICAgICAgdGhpcy5jbGVhckNhY2hlKCk7XG5cblx0ICAgICAgLy8gVHVybiAnYXV0bycgYXR0YWNobWVudHMgaW50byB0aGUgYXBwcm9wcmlhdGUgY29ybmVyIG9yIGVkZ2Vcblx0ICAgICAgdmFyIHRhcmdldEF0dGFjaG1lbnQgPSBhdXRvVG9GaXhlZEF0dGFjaG1lbnQodGhpcy50YXJnZXRBdHRhY2htZW50LCB0aGlzLmF0dGFjaG1lbnQpO1xuXG5cdCAgICAgIHRoaXMudXBkYXRlQXR0YWNoQ2xhc3Nlcyh0aGlzLmF0dGFjaG1lbnQsIHRhcmdldEF0dGFjaG1lbnQpO1xuXG5cdCAgICAgIHZhciBlbGVtZW50UG9zID0gdGhpcy5jYWNoZSgnZWxlbWVudC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgcmV0dXJuIGdldEJvdW5kcyhfdGhpczUuZWxlbWVudCk7XG5cdCAgICAgIH0pO1xuXG5cdCAgICAgIHZhciB3aWR0aCA9IGVsZW1lbnRQb3Mud2lkdGg7XG5cdCAgICAgIHZhciBoZWlnaHQgPSBlbGVtZW50UG9zLmhlaWdodDtcblxuXHQgICAgICBpZiAod2lkdGggPT09IDAgJiYgaGVpZ2h0ID09PSAwICYmIHR5cGVvZiB0aGlzLmxhc3RTaXplICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIHZhciBfbGFzdFNpemUgPSB0aGlzLmxhc3RTaXplO1xuXG5cdCAgICAgICAgLy8gV2UgY2FjaGUgdGhlIGhlaWdodCBhbmQgd2lkdGggdG8gbWFrZSBpdCBwb3NzaWJsZSB0byBwb3NpdGlvbiBlbGVtZW50cyB0aGF0IGFyZVxuXHQgICAgICAgIC8vIGdldHRpbmcgaGlkZGVuLlxuXHQgICAgICAgIHdpZHRoID0gX2xhc3RTaXplLndpZHRoO1xuXHQgICAgICAgIGhlaWdodCA9IF9sYXN0U2l6ZS5oZWlnaHQ7XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgdGhpcy5sYXN0U2l6ZSA9IHsgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodCB9O1xuXHQgICAgICB9XG5cblx0ICAgICAgdmFyIHRhcmdldFBvcyA9IHRoaXMuY2FjaGUoJ3RhcmdldC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgcmV0dXJuIF90aGlzNS5nZXRUYXJnZXRCb3VuZHMoKTtcblx0ICAgICAgfSk7XG5cdCAgICAgIHZhciB0YXJnZXRTaXplID0gdGFyZ2V0UG9zO1xuXG5cdCAgICAgIC8vIEdldCBhbiBhY3R1YWwgcHggb2Zmc2V0IGZyb20gdGhlIGF0dGFjaG1lbnRcblx0ICAgICAgdmFyIG9mZnNldCA9IG9mZnNldFRvUHgoYXR0YWNobWVudFRvT2Zmc2V0KHRoaXMuYXR0YWNobWVudCksIHsgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodCB9KTtcblx0ICAgICAgdmFyIHRhcmdldE9mZnNldCA9IG9mZnNldFRvUHgoYXR0YWNobWVudFRvT2Zmc2V0KHRhcmdldEF0dGFjaG1lbnQpLCB0YXJnZXRTaXplKTtcblxuXHQgICAgICB2YXIgbWFudWFsT2Zmc2V0ID0gb2Zmc2V0VG9QeCh0aGlzLm9mZnNldCwgeyB3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0IH0pO1xuXHQgICAgICB2YXIgbWFudWFsVGFyZ2V0T2Zmc2V0ID0gb2Zmc2V0VG9QeCh0aGlzLnRhcmdldE9mZnNldCwgdGFyZ2V0U2l6ZSk7XG5cblx0ICAgICAgLy8gQWRkIHRoZSBtYW51YWxseSBwcm92aWRlZCBvZmZzZXRcblx0ICAgICAgb2Zmc2V0ID0gYWRkT2Zmc2V0KG9mZnNldCwgbWFudWFsT2Zmc2V0KTtcblx0ICAgICAgdGFyZ2V0T2Zmc2V0ID0gYWRkT2Zmc2V0KHRhcmdldE9mZnNldCwgbWFudWFsVGFyZ2V0T2Zmc2V0KTtcblxuXHQgICAgICAvLyBJdCdzIG5vdyBvdXIgZ29hbCB0byBtYWtlIChlbGVtZW50IHBvc2l0aW9uICsgb2Zmc2V0KSA9PSAodGFyZ2V0IHBvc2l0aW9uICsgdGFyZ2V0IG9mZnNldClcblx0ICAgICAgdmFyIGxlZnQgPSB0YXJnZXRQb3MubGVmdCArIHRhcmdldE9mZnNldC5sZWZ0IC0gb2Zmc2V0LmxlZnQ7XG5cdCAgICAgIHZhciB0b3AgPSB0YXJnZXRQb3MudG9wICsgdGFyZ2V0T2Zmc2V0LnRvcCAtIG9mZnNldC50b3A7XG5cblx0ICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBUZXRoZXJCYXNlLm1vZHVsZXMubGVuZ3RoOyArK2kpIHtcblx0ICAgICAgICB2YXIgX21vZHVsZTIgPSBUZXRoZXJCYXNlLm1vZHVsZXNbaV07XG5cdCAgICAgICAgdmFyIHJldCA9IF9tb2R1bGUyLnBvc2l0aW9uLmNhbGwodGhpcywge1xuXHQgICAgICAgICAgbGVmdDogbGVmdCxcblx0ICAgICAgICAgIHRvcDogdG9wLFxuXHQgICAgICAgICAgdGFyZ2V0QXR0YWNobWVudDogdGFyZ2V0QXR0YWNobWVudCxcblx0ICAgICAgICAgIHRhcmdldFBvczogdGFyZ2V0UG9zLFxuXHQgICAgICAgICAgZWxlbWVudFBvczogZWxlbWVudFBvcyxcblx0ICAgICAgICAgIG9mZnNldDogb2Zmc2V0LFxuXHQgICAgICAgICAgdGFyZ2V0T2Zmc2V0OiB0YXJnZXRPZmZzZXQsXG5cdCAgICAgICAgICBtYW51YWxPZmZzZXQ6IG1hbnVhbE9mZnNldCxcblx0ICAgICAgICAgIG1hbnVhbFRhcmdldE9mZnNldDogbWFudWFsVGFyZ2V0T2Zmc2V0LFxuXHQgICAgICAgICAgc2Nyb2xsYmFyU2l6ZTogc2Nyb2xsYmFyU2l6ZSxcblx0ICAgICAgICAgIGF0dGFjaG1lbnQ6IHRoaXMuYXR0YWNobWVudFxuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgaWYgKHJldCA9PT0gZmFsc2UpIHtcblx0ICAgICAgICAgIHJldHVybiBmYWxzZTtcblx0ICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiByZXQgPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiByZXQgIT09ICdvYmplY3QnKSB7XG5cdCAgICAgICAgICBjb250aW51ZTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgdG9wID0gcmV0LnRvcDtcblx0ICAgICAgICAgIGxlZnQgPSByZXQubGVmdDtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICAvLyBXZSBkZXNjcmliZSB0aGUgcG9zaXRpb24gdGhyZWUgZGlmZmVyZW50IHdheXMgdG8gZ2l2ZSB0aGUgb3B0aW1pemVyXG5cdCAgICAgIC8vIGEgY2hhbmNlIHRvIGRlY2lkZSB0aGUgYmVzdCBwb3NzaWJsZSB3YXkgdG8gcG9zaXRpb24gdGhlIGVsZW1lbnRcblx0ICAgICAgLy8gd2l0aCB0aGUgZmV3ZXN0IHJlcGFpbnRzLlxuXHQgICAgICB2YXIgbmV4dCA9IHtcblx0ICAgICAgICAvLyBJdCdzIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSBwYWdlIChhYnNvbHV0ZSBwb3NpdGlvbmluZyB3aGVuXG5cdCAgICAgICAgLy8gdGhlIGVsZW1lbnQgaXMgYSBjaGlsZCBvZiB0aGUgYm9keSlcblx0ICAgICAgICBwYWdlOiB7XG5cdCAgICAgICAgICB0b3A6IHRvcCxcblx0ICAgICAgICAgIGxlZnQ6IGxlZnRcblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgLy8gSXQncyBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQgKGZpeGVkIHBvc2l0aW9uaW5nKVxuXHQgICAgICAgIHZpZXdwb3J0OiB7XG5cdCAgICAgICAgICB0b3A6IHRvcCAtIHBhZ2VZT2Zmc2V0LFxuXHQgICAgICAgICAgYm90dG9tOiBwYWdlWU9mZnNldCAtIHRvcCAtIGhlaWdodCArIGlubmVySGVpZ2h0LFxuXHQgICAgICAgICAgbGVmdDogbGVmdCAtIHBhZ2VYT2Zmc2V0LFxuXHQgICAgICAgICAgcmlnaHQ6IHBhZ2VYT2Zmc2V0IC0gbGVmdCAtIHdpZHRoICsgaW5uZXJXaWR0aFxuXHQgICAgICAgIH1cblx0ICAgICAgfTtcblxuXHQgICAgICB2YXIgc2Nyb2xsYmFyU2l6ZSA9IHVuZGVmaW5lZDtcblx0ICAgICAgaWYgKGRvY3VtZW50LmJvZHkuc2Nyb2xsV2lkdGggPiB3aW5kb3cuaW5uZXJXaWR0aCkge1xuXHQgICAgICAgIHNjcm9sbGJhclNpemUgPSB0aGlzLmNhY2hlKCdzY3JvbGxiYXItc2l6ZScsIGdldFNjcm9sbEJhclNpemUpO1xuXHQgICAgICAgIG5leHQudmlld3BvcnQuYm90dG9tIC09IHNjcm9sbGJhclNpemUuaGVpZ2h0O1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKGRvY3VtZW50LmJvZHkuc2Nyb2xsSGVpZ2h0ID4gd2luZG93LmlubmVySGVpZ2h0KSB7XG5cdCAgICAgICAgc2Nyb2xsYmFyU2l6ZSA9IHRoaXMuY2FjaGUoJ3Njcm9sbGJhci1zaXplJywgZ2V0U2Nyb2xsQmFyU2l6ZSk7XG5cdCAgICAgICAgbmV4dC52aWV3cG9ydC5yaWdodCAtPSBzY3JvbGxiYXJTaXplLndpZHRoO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKFsnJywgJ3N0YXRpYyddLmluZGV4T2YoZG9jdW1lbnQuYm9keS5zdHlsZS5wb3NpdGlvbikgPT09IC0xIHx8IFsnJywgJ3N0YXRpYyddLmluZGV4T2YoZG9jdW1lbnQuYm9keS5wYXJlbnRFbGVtZW50LnN0eWxlLnBvc2l0aW9uKSA9PT0gLTEpIHtcblx0ICAgICAgICAvLyBBYnNvbHV0ZSBwb3NpdGlvbmluZyBpbiB0aGUgYm9keSB3aWxsIGJlIHJlbGF0aXZlIHRvIHRoZSBwYWdlLCBub3QgdGhlICdpbml0aWFsIGNvbnRhaW5pbmcgYmxvY2snXG5cdCAgICAgICAgbmV4dC5wYWdlLmJvdHRvbSA9IGRvY3VtZW50LmJvZHkuc2Nyb2xsSGVpZ2h0IC0gdG9wIC0gaGVpZ2h0O1xuXHQgICAgICAgIG5leHQucGFnZS5yaWdodCA9IGRvY3VtZW50LmJvZHkuc2Nyb2xsV2lkdGggLSBsZWZ0IC0gd2lkdGg7XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5vcHRpbWl6YXRpb25zICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLm9wdGlvbnMub3B0aW1pemF0aW9ucy5tb3ZlRWxlbWVudCAhPT0gZmFsc2UgJiYgISh0eXBlb2YgdGhpcy50YXJnZXRNb2RpZmllciAhPT0gJ3VuZGVmaW5lZCcpKSB7XG5cdCAgICAgICAgKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnQgPSBfdGhpczUuY2FjaGUoJ3RhcmdldC1vZmZzZXRwYXJlbnQnLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBnZXRPZmZzZXRQYXJlbnQoX3RoaXM1LnRhcmdldCk7XG5cdCAgICAgICAgICB9KTtcblx0ICAgICAgICAgIHZhciBvZmZzZXRQb3NpdGlvbiA9IF90aGlzNS5jYWNoZSgndGFyZ2V0LW9mZnNldHBhcmVudC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBnZXRCb3VuZHMob2Zmc2V0UGFyZW50KTtcblx0ICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgdmFyIG9mZnNldFBhcmVudFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShvZmZzZXRQYXJlbnQpO1xuXHQgICAgICAgICAgdmFyIG9mZnNldFBhcmVudFNpemUgPSBvZmZzZXRQb3NpdGlvbjtcblxuXHQgICAgICAgICAgdmFyIG9mZnNldEJvcmRlciA9IHt9O1xuXHQgICAgICAgICAgWydUb3AnLCAnTGVmdCcsICdCb3R0b20nLCAnUmlnaHQnXS5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG5cdCAgICAgICAgICAgIG9mZnNldEJvcmRlcltzaWRlLnRvTG93ZXJDYXNlKCldID0gcGFyc2VGbG9hdChvZmZzZXRQYXJlbnRTdHlsZVsnYm9yZGVyJyArIHNpZGUgKyAnV2lkdGgnXSk7XG5cdCAgICAgICAgICB9KTtcblxuXHQgICAgICAgICAgb2Zmc2V0UG9zaXRpb24ucmlnaHQgPSBkb2N1bWVudC5ib2R5LnNjcm9sbFdpZHRoIC0gb2Zmc2V0UG9zaXRpb24ubGVmdCAtIG9mZnNldFBhcmVudFNpemUud2lkdGggKyBvZmZzZXRCb3JkZXIucmlnaHQ7XG5cdCAgICAgICAgICBvZmZzZXRQb3NpdGlvbi5ib3R0b20gPSBkb2N1bWVudC5ib2R5LnNjcm9sbEhlaWdodCAtIG9mZnNldFBvc2l0aW9uLnRvcCAtIG9mZnNldFBhcmVudFNpemUuaGVpZ2h0ICsgb2Zmc2V0Qm9yZGVyLmJvdHRvbTtcblxuXHQgICAgICAgICAgaWYgKG5leHQucGFnZS50b3AgPj0gb2Zmc2V0UG9zaXRpb24udG9wICsgb2Zmc2V0Qm9yZGVyLnRvcCAmJiBuZXh0LnBhZ2UuYm90dG9tID49IG9mZnNldFBvc2l0aW9uLmJvdHRvbSkge1xuXHQgICAgICAgICAgICBpZiAobmV4dC5wYWdlLmxlZnQgPj0gb2Zmc2V0UG9zaXRpb24ubGVmdCArIG9mZnNldEJvcmRlci5sZWZ0ICYmIG5leHQucGFnZS5yaWdodCA+PSBvZmZzZXRQb3NpdGlvbi5yaWdodCkge1xuXHQgICAgICAgICAgICAgIC8vIFdlJ3JlIHdpdGhpbiB0aGUgdmlzaWJsZSBwYXJ0IG9mIHRoZSB0YXJnZXQncyBzY3JvbGwgcGFyZW50XG5cdCAgICAgICAgICAgICAgdmFyIHNjcm9sbFRvcCA9IG9mZnNldFBhcmVudC5zY3JvbGxUb3A7XG5cdCAgICAgICAgICAgICAgdmFyIHNjcm9sbExlZnQgPSBvZmZzZXRQYXJlbnQuc2Nyb2xsTGVmdDtcblxuXHQgICAgICAgICAgICAgIC8vIEl0J3MgcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIHRhcmdldCdzIG9mZnNldCBwYXJlbnQgKGFic29sdXRlIHBvc2l0aW9uaW5nIHdoZW5cblx0ICAgICAgICAgICAgICAvLyB0aGUgZWxlbWVudCBpcyBtb3ZlZCB0byBiZSBhIGNoaWxkIG9mIHRoZSB0YXJnZXQncyBvZmZzZXQgcGFyZW50KS5cblx0ICAgICAgICAgICAgICBuZXh0Lm9mZnNldCA9IHtcblx0ICAgICAgICAgICAgICAgIHRvcDogbmV4dC5wYWdlLnRvcCAtIG9mZnNldFBvc2l0aW9uLnRvcCArIHNjcm9sbFRvcCAtIG9mZnNldEJvcmRlci50b3AsXG5cdCAgICAgICAgICAgICAgICBsZWZ0OiBuZXh0LnBhZ2UubGVmdCAtIG9mZnNldFBvc2l0aW9uLmxlZnQgKyBzY3JvbGxMZWZ0IC0gb2Zmc2V0Qm9yZGVyLmxlZnRcblx0ICAgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfSkoKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIC8vIFdlIGNvdWxkIGFsc28gdHJhdmVsIHVwIHRoZSBET00gYW5kIHRyeSBlYWNoIGNvbnRhaW5pbmcgY29udGV4dCwgcmF0aGVyIHRoYW4gb25seVxuXHQgICAgICAvLyBsb29raW5nIGF0IHRoZSBib2R5LCBidXQgd2UncmUgZ29ubmEgZ2V0IGRpbWluaXNoaW5nIHJldHVybnMuXG5cblx0ICAgICAgdGhpcy5tb3ZlKG5leHQpO1xuXG5cdCAgICAgIHRoaXMuaGlzdG9yeS51bnNoaWZ0KG5leHQpO1xuXG5cdCAgICAgIGlmICh0aGlzLmhpc3RvcnkubGVuZ3RoID4gMykge1xuXHQgICAgICAgIHRoaXMuaGlzdG9yeS5wb3AoKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmIChmbHVzaENoYW5nZXMpIHtcblx0ICAgICAgICBmbHVzaCgpO1xuXHQgICAgICB9XG5cblx0ICAgICAgcmV0dXJuIHRydWU7XG5cdCAgICB9XG5cblx0ICAgIC8vIFRIRSBJU1NVRVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ21vdmUnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIG1vdmUocG9zKSB7XG5cdCAgICAgIHZhciBfdGhpczYgPSB0aGlzO1xuXG5cdCAgICAgIGlmICghKHR5cGVvZiB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZSAhPT0gJ3VuZGVmaW5lZCcpKSB7XG5cdCAgICAgICAgcmV0dXJuO1xuXHQgICAgICB9XG5cblx0ICAgICAgdmFyIHNhbWUgPSB7fTtcblxuXHQgICAgICBmb3IgKHZhciB0eXBlIGluIHBvcykge1xuXHQgICAgICAgIHNhbWVbdHlwZV0gPSB7fTtcblxuXHQgICAgICAgIGZvciAodmFyIGtleSBpbiBwb3NbdHlwZV0pIHtcblx0ICAgICAgICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuXG5cdCAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaGlzdG9yeS5sZW5ndGg7ICsraSkge1xuXHQgICAgICAgICAgICB2YXIgcG9pbnQgPSB0aGlzLmhpc3RvcnlbaV07XG5cdCAgICAgICAgICAgIGlmICh0eXBlb2YgcG9pbnRbdHlwZV0gIT09ICd1bmRlZmluZWQnICYmICF3aXRoaW4ocG9pbnRbdHlwZV1ba2V5XSwgcG9zW3R5cGVdW2tleV0pKSB7XG5cdCAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuXHQgICAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICB9XG5cblx0ICAgICAgICAgIGlmICghZm91bmQpIHtcblx0ICAgICAgICAgICAgc2FtZVt0eXBlXVtrZXldID0gdHJ1ZTtcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICB2YXIgY3NzID0geyB0b3A6ICcnLCBsZWZ0OiAnJywgcmlnaHQ6ICcnLCBib3R0b206ICcnIH07XG5cblx0ICAgICAgdmFyIHRyYW5zY3JpYmUgPSBmdW5jdGlvbiB0cmFuc2NyaWJlKF9zYW1lLCBfcG9zKSB7XG5cdCAgICAgICAgdmFyIGhhc09wdGltaXphdGlvbnMgPSB0eXBlb2YgX3RoaXM2Lm9wdGlvbnMub3B0aW1pemF0aW9ucyAhPT0gJ3VuZGVmaW5lZCc7XG5cdCAgICAgICAgdmFyIGdwdSA9IGhhc09wdGltaXphdGlvbnMgPyBfdGhpczYub3B0aW9ucy5vcHRpbWl6YXRpb25zLmdwdSA6IG51bGw7XG5cdCAgICAgICAgaWYgKGdwdSAhPT0gZmFsc2UpIHtcblx0ICAgICAgICAgIHZhciB5UG9zID0gdW5kZWZpbmVkLFxuXHQgICAgICAgICAgICAgIHhQb3MgPSB1bmRlZmluZWQ7XG5cdCAgICAgICAgICBpZiAoX3NhbWUudG9wKSB7XG5cdCAgICAgICAgICAgIGNzcy50b3AgPSAwO1xuXHQgICAgICAgICAgICB5UG9zID0gX3Bvcy50b3A7XG5cdCAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICBjc3MuYm90dG9tID0gMDtcblx0ICAgICAgICAgICAgeVBvcyA9IC1fcG9zLmJvdHRvbTtcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgaWYgKF9zYW1lLmxlZnQpIHtcblx0ICAgICAgICAgICAgY3NzLmxlZnQgPSAwO1xuXHQgICAgICAgICAgICB4UG9zID0gX3Bvcy5sZWZ0O1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgY3NzLnJpZ2h0ID0gMDtcblx0ICAgICAgICAgICAgeFBvcyA9IC1fcG9zLnJpZ2h0O1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBjc3NbdHJhbnNmb3JtS2V5XSA9ICd0cmFuc2xhdGVYKCcgKyBNYXRoLnJvdW5kKHhQb3MpICsgJ3B4KSB0cmFuc2xhdGVZKCcgKyBNYXRoLnJvdW5kKHlQb3MpICsgJ3B4KSc7XG5cblx0ICAgICAgICAgIGlmICh0cmFuc2Zvcm1LZXkgIT09ICdtc1RyYW5zZm9ybScpIHtcblx0ICAgICAgICAgICAgLy8gVGhlIFogdHJhbnNmb3JtIHdpbGwga2VlcCB0aGlzIGluIHRoZSBHUFUgKGZhc3RlciwgYW5kIHByZXZlbnRzIGFydGlmYWN0cyksXG5cdCAgICAgICAgICAgIC8vIGJ1dCBJRTkgZG9lc24ndCBzdXBwb3J0IDNkIHRyYW5zZm9ybXMgYW5kIHdpbGwgY2hva2UuXG5cdCAgICAgICAgICAgIGNzc1t0cmFuc2Zvcm1LZXldICs9IFwiIHRyYW5zbGF0ZVooMClcIjtcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgaWYgKF9zYW1lLnRvcCkge1xuXHQgICAgICAgICAgICBjc3MudG9wID0gX3Bvcy50b3AgKyAncHgnO1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgY3NzLmJvdHRvbSA9IF9wb3MuYm90dG9tICsgJ3B4Jztcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgaWYgKF9zYW1lLmxlZnQpIHtcblx0ICAgICAgICAgICAgY3NzLmxlZnQgPSBfcG9zLmxlZnQgKyAncHgnO1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgY3NzLnJpZ2h0ID0gX3Bvcy5yaWdodCArICdweCc7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICB9O1xuXG5cdCAgICAgIHZhciBtb3ZlZCA9IGZhbHNlO1xuXHQgICAgICBpZiAoKHNhbWUucGFnZS50b3AgfHwgc2FtZS5wYWdlLmJvdHRvbSkgJiYgKHNhbWUucGFnZS5sZWZ0IHx8IHNhbWUucGFnZS5yaWdodCkpIHtcblx0ICAgICAgICBjc3MucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHQgICAgICAgIHRyYW5zY3JpYmUoc2FtZS5wYWdlLCBwb3MucGFnZSk7XG5cdCAgICAgIH0gZWxzZSBpZiAoKHNhbWUudmlld3BvcnQudG9wIHx8IHNhbWUudmlld3BvcnQuYm90dG9tKSAmJiAoc2FtZS52aWV3cG9ydC5sZWZ0IHx8IHNhbWUudmlld3BvcnQucmlnaHQpKSB7XG5cdCAgICAgICAgY3NzLnBvc2l0aW9uID0gJ2ZpeGVkJztcblx0ICAgICAgICB0cmFuc2NyaWJlKHNhbWUudmlld3BvcnQsIHBvcy52aWV3cG9ydCk7XG5cdCAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHNhbWUub2Zmc2V0ICE9PSAndW5kZWZpbmVkJyAmJiBzYW1lLm9mZnNldC50b3AgJiYgc2FtZS5vZmZzZXQubGVmdCkge1xuXHQgICAgICAgIChmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICBjc3MucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHQgICAgICAgICAgdmFyIG9mZnNldFBhcmVudCA9IF90aGlzNi5jYWNoZSgndGFyZ2V0LW9mZnNldHBhcmVudCcsIGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGdldE9mZnNldFBhcmVudChfdGhpczYudGFyZ2V0KTtcblx0ICAgICAgICAgIH0pO1xuXG5cdCAgICAgICAgICBpZiAoZ2V0T2Zmc2V0UGFyZW50KF90aGlzNi5lbGVtZW50KSAhPT0gb2Zmc2V0UGFyZW50KSB7XG5cdCAgICAgICAgICAgIGRlZmVyKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICBfdGhpczYuZWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKF90aGlzNi5lbGVtZW50KTtcblx0ICAgICAgICAgICAgICBvZmZzZXRQYXJlbnQuYXBwZW5kQ2hpbGQoX3RoaXM2LmVsZW1lbnQpO1xuXHQgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgdHJhbnNjcmliZShzYW1lLm9mZnNldCwgcG9zLm9mZnNldCk7XG5cdCAgICAgICAgICBtb3ZlZCA9IHRydWU7XG5cdCAgICAgICAgfSkoKTtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICBjc3MucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHQgICAgICAgIHRyYW5zY3JpYmUoeyB0b3A6IHRydWUsIGxlZnQ6IHRydWUgfSwgcG9zLnBhZ2UpO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKCFtb3ZlZCkge1xuXHQgICAgICAgIHZhciBvZmZzZXRQYXJlbnRJc0JvZHkgPSB0cnVlO1xuXHQgICAgICAgIHZhciBjdXJyZW50Tm9kZSA9IHRoaXMuZWxlbWVudC5wYXJlbnROb2RlO1xuXHQgICAgICAgIHdoaWxlIChjdXJyZW50Tm9kZSAmJiBjdXJyZW50Tm9kZS50YWdOYW1lICE9PSAnQk9EWScpIHtcblx0ICAgICAgICAgIGlmIChnZXRDb21wdXRlZFN0eWxlKGN1cnJlbnROb2RlKS5wb3NpdGlvbiAhPT0gJ3N0YXRpYycpIHtcblx0ICAgICAgICAgICAgb2Zmc2V0UGFyZW50SXNCb2R5ID0gZmFsc2U7XG5cdCAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBjdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlLnBhcmVudE5vZGU7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKCFvZmZzZXRQYXJlbnRJc0JvZHkpIHtcblx0ICAgICAgICAgIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuZWxlbWVudCk7XG5cdCAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuZWxlbWVudCk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgLy8gQW55IGNzcyBjaGFuZ2Ugd2lsbCB0cmlnZ2VyIGEgcmVwYWludCwgc28gbGV0J3MgYXZvaWQgb25lIGlmIG5vdGhpbmcgY2hhbmdlZFxuXHQgICAgICB2YXIgd3JpdGVDU1MgPSB7fTtcblx0ICAgICAgdmFyIHdyaXRlID0gZmFsc2U7XG5cdCAgICAgIGZvciAodmFyIGtleSBpbiBjc3MpIHtcblx0ICAgICAgICB2YXIgdmFsID0gY3NzW2tleV07XG5cdCAgICAgICAgdmFyIGVsVmFsID0gdGhpcy5lbGVtZW50LnN0eWxlW2tleV07XG5cblx0ICAgICAgICBpZiAoZWxWYWwgIT09ICcnICYmIHZhbCAhPT0gJycgJiYgWyd0b3AnLCAnbGVmdCcsICdib3R0b20nLCAncmlnaHQnXS5pbmRleE9mKGtleSkgPj0gMCkge1xuXHQgICAgICAgICAgZWxWYWwgPSBwYXJzZUZsb2F0KGVsVmFsKTtcblx0ICAgICAgICAgIHZhbCA9IHBhcnNlRmxvYXQodmFsKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAoZWxWYWwgIT09IHZhbCkge1xuXHQgICAgICAgICAgd3JpdGUgPSB0cnVlO1xuXHQgICAgICAgICAgd3JpdGVDU1Nba2V5XSA9IHZhbDtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAod3JpdGUpIHtcblx0ICAgICAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICBleHRlbmQoX3RoaXM2LmVsZW1lbnQuc3R5bGUsIHdyaXRlQ1NTKTtcblx0ICAgICAgICB9KTtcblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH1dKTtcblxuXHQgIHJldHVybiBUZXRoZXJDbGFzcztcblx0fSkoKTtcblxuXHRUZXRoZXJDbGFzcy5tb2R1bGVzID0gW107XG5cblx0VGV0aGVyQmFzZS5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuXG5cdHZhciBUZXRoZXIgPSBleHRlbmQoVGV0aGVyQ2xhc3MsIFRldGhlckJhc2UpO1xuXHQvKiBnbG9iYWxzIFRldGhlckJhc2UgKi9cblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIF9zbGljZWRUb0FycmF5ID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gc2xpY2VJdGVyYXRvcihhcnIsIGkpIHsgdmFyIF9hcnIgPSBbXTsgdmFyIF9uID0gdHJ1ZTsgdmFyIF9kID0gZmFsc2U7IHZhciBfZSA9IHVuZGVmaW5lZDsgdHJ5IHsgZm9yICh2YXIgX2kgPSBhcnJbU3ltYm9sLml0ZXJhdG9yXSgpLCBfczsgIShfbiA9IChfcyA9IF9pLm5leHQoKSkuZG9uZSk7IF9uID0gdHJ1ZSkgeyBfYXJyLnB1c2goX3MudmFsdWUpOyBpZiAoaSAmJiBfYXJyLmxlbmd0aCA9PT0gaSkgYnJlYWs7IH0gfSBjYXRjaCAoZXJyKSB7IF9kID0gdHJ1ZTsgX2UgPSBlcnI7IH0gZmluYWxseSB7IHRyeSB7IGlmICghX24gJiYgX2lbJ3JldHVybiddKSBfaVsncmV0dXJuJ10oKTsgfSBmaW5hbGx5IHsgaWYgKF9kKSB0aHJvdyBfZTsgfSB9IHJldHVybiBfYXJyOyB9IHJldHVybiBmdW5jdGlvbiAoYXJyLCBpKSB7IGlmIChBcnJheS5pc0FycmF5KGFycikpIHsgcmV0dXJuIGFycjsgfSBlbHNlIGlmIChTeW1ib2wuaXRlcmF0b3IgaW4gT2JqZWN0KGFycikpIHsgcmV0dXJuIHNsaWNlSXRlcmF0b3IoYXJyLCBpKTsgfSBlbHNlIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBhdHRlbXB0IHRvIGRlc3RydWN0dXJlIG5vbi1pdGVyYWJsZSBpbnN0YW5jZScpOyB9IH07IH0pKCk7XG5cblx0dmFyIF9UZXRoZXJCYXNlJFV0aWxzID0gVGV0aGVyQmFzZS5VdGlscztcblx0dmFyIGdldEJvdW5kcyA9IF9UZXRoZXJCYXNlJFV0aWxzLmdldEJvdW5kcztcblx0dmFyIGV4dGVuZCA9IF9UZXRoZXJCYXNlJFV0aWxzLmV4dGVuZDtcblx0dmFyIHVwZGF0ZUNsYXNzZXMgPSBfVGV0aGVyQmFzZSRVdGlscy51cGRhdGVDbGFzc2VzO1xuXHR2YXIgZGVmZXIgPSBfVGV0aGVyQmFzZSRVdGlscy5kZWZlcjtcblxuXHR2YXIgQk9VTkRTX0ZPUk1BVCA9IFsnbGVmdCcsICd0b3AnLCAncmlnaHQnLCAnYm90dG9tJ107XG5cblx0ZnVuY3Rpb24gZ2V0Qm91bmRpbmdSZWN0KHRldGhlciwgdG8pIHtcblx0ICBpZiAodG8gPT09ICdzY3JvbGxQYXJlbnQnKSB7XG5cdCAgICB0byA9IHRldGhlci5zY3JvbGxQYXJlbnQ7XG5cdCAgfSBlbHNlIGlmICh0byA9PT0gJ3dpbmRvdycpIHtcblx0ICAgIHRvID0gW3BhZ2VYT2Zmc2V0LCBwYWdlWU9mZnNldCwgaW5uZXJXaWR0aCArIHBhZ2VYT2Zmc2V0LCBpbm5lckhlaWdodCArIHBhZ2VZT2Zmc2V0XTtcblx0ICB9XG5cblx0ICBpZiAodG8gPT09IGRvY3VtZW50KSB7XG5cdCAgICB0byA9IHRvLmRvY3VtZW50RWxlbWVudDtcblx0ICB9XG5cblx0ICBpZiAodHlwZW9mIHRvLm5vZGVUeXBlICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgdmFyIHNpemUgPSBnZXRCb3VuZHModG8pO1xuXHQgICAgICB2YXIgcG9zID0gc2l6ZTtcblx0ICAgICAgdmFyIHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZSh0byk7XG5cblx0ICAgICAgdG8gPSBbcG9zLmxlZnQsIHBvcy50b3AsIHNpemUud2lkdGggKyBwb3MubGVmdCwgc2l6ZS5oZWlnaHQgKyBwb3MudG9wXTtcblxuXHQgICAgICBCT1VORFNfRk9STUFULmZvckVhY2goZnVuY3Rpb24gKHNpZGUsIGkpIHtcblx0ICAgICAgICBzaWRlID0gc2lkZVswXS50b1VwcGVyQ2FzZSgpICsgc2lkZS5zdWJzdHIoMSk7XG5cdCAgICAgICAgaWYgKHNpZGUgPT09ICdUb3AnIHx8IHNpZGUgPT09ICdMZWZ0Jykge1xuXHQgICAgICAgICAgdG9baV0gKz0gcGFyc2VGbG9hdChzdHlsZVsnYm9yZGVyJyArIHNpZGUgKyAnV2lkdGgnXSk7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgIHRvW2ldIC09IHBhcnNlRmxvYXQoc3R5bGVbJ2JvcmRlcicgKyBzaWRlICsgJ1dpZHRoJ10pO1xuXHQgICAgICAgIH1cblx0ICAgICAgfSk7XG5cdCAgICB9KSgpO1xuXHQgIH1cblxuXHQgIHJldHVybiB0bztcblx0fVxuXG5cdFRldGhlckJhc2UubW9kdWxlcy5wdXNoKHtcblx0ICBwb3NpdGlvbjogZnVuY3Rpb24gcG9zaXRpb24oX3JlZikge1xuXHQgICAgdmFyIF90aGlzID0gdGhpcztcblxuXHQgICAgdmFyIHRvcCA9IF9yZWYudG9wO1xuXHQgICAgdmFyIGxlZnQgPSBfcmVmLmxlZnQ7XG5cdCAgICB2YXIgdGFyZ2V0QXR0YWNobWVudCA9IF9yZWYudGFyZ2V0QXR0YWNobWVudDtcblxuXHQgICAgaWYgKCF0aGlzLm9wdGlvbnMuY29uc3RyYWludHMpIHtcblx0ICAgICAgcmV0dXJuIHRydWU7XG5cdCAgICB9XG5cblx0ICAgIHZhciBfY2FjaGUgPSB0aGlzLmNhY2hlKCdlbGVtZW50LWJvdW5kcycsIGZ1bmN0aW9uICgpIHtcblx0ICAgICAgcmV0dXJuIGdldEJvdW5kcyhfdGhpcy5lbGVtZW50KTtcblx0ICAgIH0pO1xuXG5cdCAgICB2YXIgaGVpZ2h0ID0gX2NhY2hlLmhlaWdodDtcblx0ICAgIHZhciB3aWR0aCA9IF9jYWNoZS53aWR0aDtcblxuXHQgICAgaWYgKHdpZHRoID09PSAwICYmIGhlaWdodCA9PT0gMCAmJiB0eXBlb2YgdGhpcy5sYXN0U2l6ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgdmFyIF9sYXN0U2l6ZSA9IHRoaXMubGFzdFNpemU7XG5cblx0ICAgICAgLy8gSGFuZGxlIHRoZSBpdGVtIGdldHRpbmcgaGlkZGVuIGFzIGEgcmVzdWx0IG9mIG91ciBwb3NpdGlvbmluZyB3aXRob3V0IGdsaXRjaGluZ1xuXHQgICAgICAvLyB0aGUgY2xhc3NlcyBpbiBhbmQgb3V0XG5cdCAgICAgIHdpZHRoID0gX2xhc3RTaXplLndpZHRoO1xuXHQgICAgICBoZWlnaHQgPSBfbGFzdFNpemUuaGVpZ2h0O1xuXHQgICAgfVxuXG5cdCAgICB2YXIgdGFyZ2V0U2l6ZSA9IHRoaXMuY2FjaGUoJ3RhcmdldC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgIHJldHVybiBfdGhpcy5nZXRUYXJnZXRCb3VuZHMoKTtcblx0ICAgIH0pO1xuXG5cdCAgICB2YXIgdGFyZ2V0SGVpZ2h0ID0gdGFyZ2V0U2l6ZS5oZWlnaHQ7XG5cdCAgICB2YXIgdGFyZ2V0V2lkdGggPSB0YXJnZXRTaXplLndpZHRoO1xuXG5cdCAgICB2YXIgYWxsQ2xhc3NlcyA9IFt0aGlzLmdldENsYXNzKCdwaW5uZWQnKSwgdGhpcy5nZXRDbGFzcygnb3V0LW9mLWJvdW5kcycpXTtcblxuXHQgICAgdGhpcy5vcHRpb25zLmNvbnN0cmFpbnRzLmZvckVhY2goZnVuY3Rpb24gKGNvbnN0cmFpbnQpIHtcblx0ICAgICAgdmFyIG91dE9mQm91bmRzQ2xhc3MgPSBjb25zdHJhaW50Lm91dE9mQm91bmRzQ2xhc3M7XG5cdCAgICAgIHZhciBwaW5uZWRDbGFzcyA9IGNvbnN0cmFpbnQucGlubmVkQ2xhc3M7XG5cblx0ICAgICAgaWYgKG91dE9mQm91bmRzQ2xhc3MpIHtcblx0ICAgICAgICBhbGxDbGFzc2VzLnB1c2gob3V0T2ZCb3VuZHNDbGFzcyk7XG5cdCAgICAgIH1cblx0ICAgICAgaWYgKHBpbm5lZENsYXNzKSB7XG5cdCAgICAgICAgYWxsQ2xhc3Nlcy5wdXNoKHBpbm5lZENsYXNzKTtcblx0ICAgICAgfVxuXHQgICAgfSk7XG5cblx0ICAgIGFsbENsYXNzZXMuZm9yRWFjaChmdW5jdGlvbiAoY2xzKSB7XG5cdCAgICAgIFsnbGVmdCcsICd0b3AnLCAncmlnaHQnLCAnYm90dG9tJ10uZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuXHQgICAgICAgIGFsbENsYXNzZXMucHVzaChjbHMgKyAnLScgKyBzaWRlKTtcblx0ICAgICAgfSk7XG5cdCAgICB9KTtcblxuXHQgICAgdmFyIGFkZENsYXNzZXMgPSBbXTtcblxuXHQgICAgdmFyIHRBdHRhY2htZW50ID0gZXh0ZW5kKHt9LCB0YXJnZXRBdHRhY2htZW50KTtcblx0ICAgIHZhciBlQXR0YWNobWVudCA9IGV4dGVuZCh7fSwgdGhpcy5hdHRhY2htZW50KTtcblxuXHQgICAgdGhpcy5vcHRpb25zLmNvbnN0cmFpbnRzLmZvckVhY2goZnVuY3Rpb24gKGNvbnN0cmFpbnQpIHtcblx0ICAgICAgdmFyIHRvID0gY29uc3RyYWludC50bztcblx0ICAgICAgdmFyIGF0dGFjaG1lbnQgPSBjb25zdHJhaW50LmF0dGFjaG1lbnQ7XG5cdCAgICAgIHZhciBwaW4gPSBjb25zdHJhaW50LnBpbjtcblxuXHQgICAgICBpZiAodHlwZW9mIGF0dGFjaG1lbnQgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgYXR0YWNobWVudCA9ICcnO1xuXHQgICAgICB9XG5cblx0ICAgICAgdmFyIGNoYW5nZUF0dGFjaFggPSB1bmRlZmluZWQsXG5cdCAgICAgICAgICBjaGFuZ2VBdHRhY2hZID0gdW5kZWZpbmVkO1xuXHQgICAgICBpZiAoYXR0YWNobWVudC5pbmRleE9mKCcgJykgPj0gMCkge1xuXHQgICAgICAgIHZhciBfYXR0YWNobWVudCRzcGxpdCA9IGF0dGFjaG1lbnQuc3BsaXQoJyAnKTtcblxuXHQgICAgICAgIHZhciBfYXR0YWNobWVudCRzcGxpdDIgPSBfc2xpY2VkVG9BcnJheShfYXR0YWNobWVudCRzcGxpdCwgMik7XG5cblx0ICAgICAgICBjaGFuZ2VBdHRhY2hZID0gX2F0dGFjaG1lbnQkc3BsaXQyWzBdO1xuXHQgICAgICAgIGNoYW5nZUF0dGFjaFggPSBfYXR0YWNobWVudCRzcGxpdDJbMV07XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgY2hhbmdlQXR0YWNoWCA9IGNoYW5nZUF0dGFjaFkgPSBhdHRhY2htZW50O1xuXHQgICAgICB9XG5cblx0ICAgICAgdmFyIGJvdW5kcyA9IGdldEJvdW5kaW5nUmVjdChfdGhpcywgdG8pO1xuXG5cdCAgICAgIGlmIChjaGFuZ2VBdHRhY2hZID09PSAndGFyZ2V0JyB8fCBjaGFuZ2VBdHRhY2hZID09PSAnYm90aCcpIHtcblx0ICAgICAgICBpZiAodG9wIDwgYm91bmRzWzFdICYmIHRBdHRhY2htZW50LnRvcCA9PT0gJ3RvcCcpIHtcblx0ICAgICAgICAgIHRvcCArPSB0YXJnZXRIZWlnaHQ7XG5cdCAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAodG9wICsgaGVpZ2h0ID4gYm91bmRzWzNdICYmIHRBdHRhY2htZW50LnRvcCA9PT0gJ2JvdHRvbScpIHtcblx0ICAgICAgICAgIHRvcCAtPSB0YXJnZXRIZWlnaHQ7XG5cdCAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAndG9wJztcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAoY2hhbmdlQXR0YWNoWSA9PT0gJ3RvZ2V0aGVyJykge1xuXHQgICAgICAgIGlmICh0b3AgPCBib3VuZHNbMV0gJiYgdEF0dGFjaG1lbnQudG9wID09PSAndG9wJykge1xuXHQgICAgICAgICAgaWYgKGVBdHRhY2htZW50LnRvcCA9PT0gJ2JvdHRvbScpIHtcblx0ICAgICAgICAgICAgdG9wICs9IHRhcmdldEhlaWdodDtcblx0ICAgICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG5cblx0ICAgICAgICAgICAgdG9wICs9IGhlaWdodDtcblx0ICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG5cdCAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LnRvcCA9PT0gJ3RvcCcpIHtcblx0ICAgICAgICAgICAgdG9wICs9IHRhcmdldEhlaWdodDtcblx0ICAgICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG5cblx0ICAgICAgICAgICAgdG9wIC09IGhlaWdodDtcblx0ICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSAmJiB0QXR0YWNobWVudC50b3AgPT09ICdib3R0b20nKSB7XG5cdCAgICAgICAgICBpZiAoZUF0dGFjaG1lbnQudG9wID09PSAndG9wJykge1xuXHQgICAgICAgICAgICB0b3AgLT0gdGFyZ2V0SGVpZ2h0O1xuXHQgICAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAndG9wJztcblxuXHQgICAgICAgICAgICB0b3AgLT0gaGVpZ2h0O1xuXHQgICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcblx0ICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQudG9wID09PSAnYm90dG9tJykge1xuXHQgICAgICAgICAgICB0b3AgLT0gdGFyZ2V0SGVpZ2h0O1xuXHQgICAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAndG9wJztcblxuXHQgICAgICAgICAgICB0b3AgKz0gaGVpZ2h0O1xuXHQgICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAndG9wJztcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAodEF0dGFjaG1lbnQudG9wID09PSAnbWlkZGxlJykge1xuXHQgICAgICAgICAgaWYgKHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSAmJiBlQXR0YWNobWVudC50b3AgPT09ICd0b3AnKSB7XG5cdCAgICAgICAgICAgIHRvcCAtPSBoZWlnaHQ7XG5cdCAgICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuXHQgICAgICAgICAgfSBlbHNlIGlmICh0b3AgPCBib3VuZHNbMV0gJiYgZUF0dGFjaG1lbnQudG9wID09PSAnYm90dG9tJykge1xuXHQgICAgICAgICAgICB0b3AgKz0gaGVpZ2h0O1xuXHQgICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAndG9wJztcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAoY2hhbmdlQXR0YWNoWCA9PT0gJ3RhcmdldCcgfHwgY2hhbmdlQXR0YWNoWCA9PT0gJ2JvdGgnKSB7XG5cdCAgICAgICAgaWYgKGxlZnQgPCBib3VuZHNbMF0gJiYgdEF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG5cdCAgICAgICAgICBsZWZ0ICs9IHRhcmdldFdpZHRoO1xuXHQgICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKGxlZnQgKyB3aWR0aCA+IGJvdW5kc1syXSAmJiB0QXR0YWNobWVudC5sZWZ0ID09PSAncmlnaHQnKSB7XG5cdCAgICAgICAgICBsZWZ0IC09IHRhcmdldFdpZHRoO1xuXHQgICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0Jztcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAoY2hhbmdlQXR0YWNoWCA9PT0gJ3RvZ2V0aGVyJykge1xuXHQgICAgICAgIGlmIChsZWZ0IDwgYm91bmRzWzBdICYmIHRBdHRhY2htZW50LmxlZnQgPT09ICdsZWZ0Jykge1xuXHQgICAgICAgICAgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcblx0ICAgICAgICAgICAgbGVmdCArPSB0YXJnZXRXaWR0aDtcblx0ICAgICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG5cblx0ICAgICAgICAgICAgbGVmdCArPSB3aWR0aDtcblx0ICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0Jztcblx0ICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG5cdCAgICAgICAgICAgIGxlZnQgKz0gdGFyZ2V0V2lkdGg7XG5cdCAgICAgICAgICAgIHRBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuXG5cdCAgICAgICAgICAgIGxlZnQgLT0gd2lkdGg7XG5cdCAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH0gZWxzZSBpZiAobGVmdCArIHdpZHRoID4gYm91bmRzWzJdICYmIHRBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcblx0ICAgICAgICAgIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAnbGVmdCcpIHtcblx0ICAgICAgICAgICAgbGVmdCAtPSB0YXJnZXRXaWR0aDtcblx0ICAgICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcblxuXHQgICAgICAgICAgICBsZWZ0IC09IHdpZHRoO1xuXHQgICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0Jztcblx0ICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ3JpZ2h0Jykge1xuXHQgICAgICAgICAgICBsZWZ0IC09IHRhcmdldFdpZHRoO1xuXHQgICAgICAgICAgICB0QXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuXG5cdCAgICAgICAgICAgIGxlZnQgKz0gd2lkdGg7XG5cdCAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfSBlbHNlIGlmICh0QXR0YWNobWVudC5sZWZ0ID09PSAnY2VudGVyJykge1xuXHQgICAgICAgICAgaWYgKGxlZnQgKyB3aWR0aCA+IGJvdW5kc1syXSAmJiBlQXR0YWNobWVudC5sZWZ0ID09PSAnbGVmdCcpIHtcblx0ICAgICAgICAgICAgbGVmdCAtPSB3aWR0aDtcblx0ICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG5cdCAgICAgICAgICB9IGVsc2UgaWYgKGxlZnQgPCBib3VuZHNbMF0gJiYgZUF0dGFjaG1lbnQubGVmdCA9PT0gJ3JpZ2h0Jykge1xuXHQgICAgICAgICAgICBsZWZ0ICs9IHdpZHRoO1xuXHQgICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXG5cdCAgICAgIGlmIChjaGFuZ2VBdHRhY2hZID09PSAnZWxlbWVudCcgfHwgY2hhbmdlQXR0YWNoWSA9PT0gJ2JvdGgnKSB7XG5cdCAgICAgICAgaWYgKHRvcCA8IGJvdW5kc1sxXSAmJiBlQXR0YWNobWVudC50b3AgPT09ICdib3R0b20nKSB7XG5cdCAgICAgICAgICB0b3AgKz0gaGVpZ2h0O1xuXHQgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSAmJiBlQXR0YWNobWVudC50b3AgPT09ICd0b3AnKSB7XG5cdCAgICAgICAgICB0b3AgLT0gaGVpZ2h0O1xuXHQgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKGNoYW5nZUF0dGFjaFggPT09ICdlbGVtZW50JyB8fCBjaGFuZ2VBdHRhY2hYID09PSAnYm90aCcpIHtcblx0ICAgICAgICBpZiAobGVmdCA8IGJvdW5kc1swXSkge1xuXHQgICAgICAgICAgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcblx0ICAgICAgICAgICAgbGVmdCArPSB3aWR0aDtcblx0ICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0Jztcblx0ICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2NlbnRlcicpIHtcblx0ICAgICAgICAgICAgbGVmdCArPSB3aWR0aCAvIDI7XG5cdCAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKGxlZnQgKyB3aWR0aCA+IGJvdW5kc1syXSkge1xuXHQgICAgICAgICAgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdsZWZ0Jykge1xuXHQgICAgICAgICAgICBsZWZ0IC09IHdpZHRoO1xuXHQgICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0Jztcblx0ICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2NlbnRlcicpIHtcblx0ICAgICAgICAgICAgbGVmdCAtPSB3aWR0aCAvIDI7XG5cdCAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICh0eXBlb2YgcGluID09PSAnc3RyaW5nJykge1xuXHQgICAgICAgIHBpbiA9IHBpbi5zcGxpdCgnLCcpLm1hcChmdW5jdGlvbiAocCkge1xuXHQgICAgICAgICAgcmV0dXJuIHAudHJpbSgpO1xuXHQgICAgICAgIH0pO1xuXHQgICAgICB9IGVsc2UgaWYgKHBpbiA9PT0gdHJ1ZSkge1xuXHQgICAgICAgIHBpbiA9IFsndG9wJywgJ2xlZnQnLCAncmlnaHQnLCAnYm90dG9tJ107XG5cdCAgICAgIH1cblxuXHQgICAgICBwaW4gPSBwaW4gfHwgW107XG5cblx0ICAgICAgdmFyIHBpbm5lZCA9IFtdO1xuXHQgICAgICB2YXIgb29iID0gW107XG5cblx0ICAgICAgaWYgKHRvcCA8IGJvdW5kc1sxXSkge1xuXHQgICAgICAgIGlmIChwaW4uaW5kZXhPZigndG9wJykgPj0gMCkge1xuXHQgICAgICAgICAgdG9wID0gYm91bmRzWzFdO1xuXHQgICAgICAgICAgcGlubmVkLnB1c2goJ3RvcCcpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICBvb2IucHVzaCgndG9wJyk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSkge1xuXHQgICAgICAgIGlmIChwaW4uaW5kZXhPZignYm90dG9tJykgPj0gMCkge1xuXHQgICAgICAgICAgdG9wID0gYm91bmRzWzNdIC0gaGVpZ2h0O1xuXHQgICAgICAgICAgcGlubmVkLnB1c2goJ2JvdHRvbScpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICBvb2IucHVzaCgnYm90dG9tJyk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKGxlZnQgPCBib3VuZHNbMF0pIHtcblx0ICAgICAgICBpZiAocGluLmluZGV4T2YoJ2xlZnQnKSA+PSAwKSB7XG5cdCAgICAgICAgICBsZWZ0ID0gYm91bmRzWzBdO1xuXHQgICAgICAgICAgcGlubmVkLnB1c2goJ2xlZnQnKTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgb29iLnB1c2goJ2xlZnQnKTtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAobGVmdCArIHdpZHRoID4gYm91bmRzWzJdKSB7XG5cdCAgICAgICAgaWYgKHBpbi5pbmRleE9mKCdyaWdodCcpID49IDApIHtcblx0ICAgICAgICAgIGxlZnQgPSBib3VuZHNbMl0gLSB3aWR0aDtcblx0ICAgICAgICAgIHBpbm5lZC5wdXNoKCdyaWdodCcpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICBvb2IucHVzaCgncmlnaHQnKTtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAocGlubmVkLmxlbmd0aCkge1xuXHQgICAgICAgIChmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICB2YXIgcGlubmVkQ2xhc3MgPSB1bmRlZmluZWQ7XG5cdCAgICAgICAgICBpZiAodHlwZW9mIF90aGlzLm9wdGlvbnMucGlubmVkQ2xhc3MgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgICAgIHBpbm5lZENsYXNzID0gX3RoaXMub3B0aW9ucy5waW5uZWRDbGFzcztcblx0ICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHBpbm5lZENsYXNzID0gX3RoaXMuZ2V0Q2xhc3MoJ3Bpbm5lZCcpO1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBhZGRDbGFzc2VzLnB1c2gocGlubmVkQ2xhc3MpO1xuXHQgICAgICAgICAgcGlubmVkLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcblx0ICAgICAgICAgICAgYWRkQ2xhc3Nlcy5wdXNoKHBpbm5lZENsYXNzICsgJy0nICsgc2lkZSk7XG5cdCAgICAgICAgICB9KTtcblx0ICAgICAgICB9KSgpO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKG9vYi5sZW5ndGgpIHtcblx0ICAgICAgICAoZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgdmFyIG9vYkNsYXNzID0gdW5kZWZpbmVkO1xuXHQgICAgICAgICAgaWYgKHR5cGVvZiBfdGhpcy5vcHRpb25zLm91dE9mQm91bmRzQ2xhc3MgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgICAgIG9vYkNsYXNzID0gX3RoaXMub3B0aW9ucy5vdXRPZkJvdW5kc0NsYXNzO1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgb29iQ2xhc3MgPSBfdGhpcy5nZXRDbGFzcygnb3V0LW9mLWJvdW5kcycpO1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBhZGRDbGFzc2VzLnB1c2gob29iQ2xhc3MpO1xuXHQgICAgICAgICAgb29iLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcblx0ICAgICAgICAgICAgYWRkQ2xhc3Nlcy5wdXNoKG9vYkNsYXNzICsgJy0nICsgc2lkZSk7XG5cdCAgICAgICAgICB9KTtcblx0ICAgICAgICB9KSgpO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKHBpbm5lZC5pbmRleE9mKCdsZWZ0JykgPj0gMCB8fCBwaW5uZWQuaW5kZXhPZigncmlnaHQnKSA+PSAwKSB7XG5cdCAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9IHRBdHRhY2htZW50LmxlZnQgPSBmYWxzZTtcblx0ICAgICAgfVxuXHQgICAgICBpZiAocGlubmVkLmluZGV4T2YoJ3RvcCcpID49IDAgfHwgcGlubmVkLmluZGV4T2YoJ2JvdHRvbScpID49IDApIHtcblx0ICAgICAgICBlQXR0YWNobWVudC50b3AgPSB0QXR0YWNobWVudC50b3AgPSBmYWxzZTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICh0QXR0YWNobWVudC50b3AgIT09IHRhcmdldEF0dGFjaG1lbnQudG9wIHx8IHRBdHRhY2htZW50LmxlZnQgIT09IHRhcmdldEF0dGFjaG1lbnQubGVmdCB8fCBlQXR0YWNobWVudC50b3AgIT09IF90aGlzLmF0dGFjaG1lbnQudG9wIHx8IGVBdHRhY2htZW50LmxlZnQgIT09IF90aGlzLmF0dGFjaG1lbnQubGVmdCkge1xuXHQgICAgICAgIF90aGlzLnVwZGF0ZUF0dGFjaENsYXNzZXMoZUF0dGFjaG1lbnQsIHRBdHRhY2htZW50KTtcblx0ICAgICAgfVxuXHQgICAgfSk7XG5cblx0ICAgIGRlZmVyKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgaWYgKCEoX3RoaXMub3B0aW9ucy5hZGRUYXJnZXRDbGFzc2VzID09PSBmYWxzZSkpIHtcblx0ICAgICAgICB1cGRhdGVDbGFzc2VzKF90aGlzLnRhcmdldCwgYWRkQ2xhc3NlcywgYWxsQ2xhc3Nlcyk7XG5cdCAgICAgIH1cblx0ICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpcy5lbGVtZW50LCBhZGRDbGFzc2VzLCBhbGxDbGFzc2VzKTtcblx0ICAgIH0pO1xuXG5cdCAgICByZXR1cm4geyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9O1xuXHQgIH1cblx0fSk7XG5cdC8qIGdsb2JhbHMgVGV0aGVyQmFzZSAqL1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgX1RldGhlckJhc2UkVXRpbHMgPSBUZXRoZXJCYXNlLlV0aWxzO1xuXHR2YXIgZ2V0Qm91bmRzID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0Qm91bmRzO1xuXHR2YXIgdXBkYXRlQ2xhc3NlcyA9IF9UZXRoZXJCYXNlJFV0aWxzLnVwZGF0ZUNsYXNzZXM7XG5cdHZhciBkZWZlciA9IF9UZXRoZXJCYXNlJFV0aWxzLmRlZmVyO1xuXG5cdFRldGhlckJhc2UubW9kdWxlcy5wdXNoKHtcblx0ICBwb3NpdGlvbjogZnVuY3Rpb24gcG9zaXRpb24oX3JlZikge1xuXHQgICAgdmFyIF90aGlzID0gdGhpcztcblxuXHQgICAgdmFyIHRvcCA9IF9yZWYudG9wO1xuXHQgICAgdmFyIGxlZnQgPSBfcmVmLmxlZnQ7XG5cblx0ICAgIHZhciBfY2FjaGUgPSB0aGlzLmNhY2hlKCdlbGVtZW50LWJvdW5kcycsIGZ1bmN0aW9uICgpIHtcblx0ICAgICAgcmV0dXJuIGdldEJvdW5kcyhfdGhpcy5lbGVtZW50KTtcblx0ICAgIH0pO1xuXG5cdCAgICB2YXIgaGVpZ2h0ID0gX2NhY2hlLmhlaWdodDtcblx0ICAgIHZhciB3aWR0aCA9IF9jYWNoZS53aWR0aDtcblxuXHQgICAgdmFyIHRhcmdldFBvcyA9IHRoaXMuZ2V0VGFyZ2V0Qm91bmRzKCk7XG5cblx0ICAgIHZhciBib3R0b20gPSB0b3AgKyBoZWlnaHQ7XG5cdCAgICB2YXIgcmlnaHQgPSBsZWZ0ICsgd2lkdGg7XG5cblx0ICAgIHZhciBhYnV0dGVkID0gW107XG5cdCAgICBpZiAodG9wIDw9IHRhcmdldFBvcy5ib3R0b20gJiYgYm90dG9tID49IHRhcmdldFBvcy50b3ApIHtcblx0ICAgICAgWydsZWZ0JywgJ3JpZ2h0J10uZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuXHQgICAgICAgIHZhciB0YXJnZXRQb3NTaWRlID0gdGFyZ2V0UG9zW3NpZGVdO1xuXHQgICAgICAgIGlmICh0YXJnZXRQb3NTaWRlID09PSBsZWZ0IHx8IHRhcmdldFBvc1NpZGUgPT09IHJpZ2h0KSB7XG5cdCAgICAgICAgICBhYnV0dGVkLnB1c2goc2lkZSk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9KTtcblx0ICAgIH1cblxuXHQgICAgaWYgKGxlZnQgPD0gdGFyZ2V0UG9zLnJpZ2h0ICYmIHJpZ2h0ID49IHRhcmdldFBvcy5sZWZ0KSB7XG5cdCAgICAgIFsndG9wJywgJ2JvdHRvbSddLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcblx0ICAgICAgICB2YXIgdGFyZ2V0UG9zU2lkZSA9IHRhcmdldFBvc1tzaWRlXTtcblx0ICAgICAgICBpZiAodGFyZ2V0UG9zU2lkZSA9PT0gdG9wIHx8IHRhcmdldFBvc1NpZGUgPT09IGJvdHRvbSkge1xuXHQgICAgICAgICAgYWJ1dHRlZC5wdXNoKHNpZGUpO1xuXHQgICAgICAgIH1cblx0ICAgICAgfSk7XG5cdCAgICB9XG5cblx0ICAgIHZhciBhbGxDbGFzc2VzID0gW107XG5cdCAgICB2YXIgYWRkQ2xhc3NlcyA9IFtdO1xuXG5cdCAgICB2YXIgc2lkZXMgPSBbJ2xlZnQnLCAndG9wJywgJ3JpZ2h0JywgJ2JvdHRvbSddO1xuXHQgICAgYWxsQ2xhc3Nlcy5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ2FidXR0ZWQnKSk7XG5cdCAgICBzaWRlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG5cdCAgICAgIGFsbENsYXNzZXMucHVzaChfdGhpcy5nZXRDbGFzcygnYWJ1dHRlZCcpICsgJy0nICsgc2lkZSk7XG5cdCAgICB9KTtcblxuXHQgICAgaWYgKGFidXR0ZWQubGVuZ3RoKSB7XG5cdCAgICAgIGFkZENsYXNzZXMucHVzaCh0aGlzLmdldENsYXNzKCdhYnV0dGVkJykpO1xuXHQgICAgfVxuXG5cdCAgICBhYnV0dGVkLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcblx0ICAgICAgYWRkQ2xhc3Nlcy5wdXNoKF90aGlzLmdldENsYXNzKCdhYnV0dGVkJykgKyAnLScgKyBzaWRlKTtcblx0ICAgIH0pO1xuXG5cdCAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG5cdCAgICAgIGlmICghKF90aGlzLm9wdGlvbnMuYWRkVGFyZ2V0Q2xhc3NlcyA9PT0gZmFsc2UpKSB7XG5cdCAgICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpcy50YXJnZXQsIGFkZENsYXNzZXMsIGFsbENsYXNzZXMpO1xuXHQgICAgICB9XG5cdCAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXMuZWxlbWVudCwgYWRkQ2xhc3NlcywgYWxsQ2xhc3Nlcyk7XG5cdCAgICB9KTtcblxuXHQgICAgcmV0dXJuIHRydWU7XG5cdCAgfVxuXHR9KTtcblx0LyogZ2xvYmFscyBUZXRoZXJCYXNlICovXG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBfc2xpY2VkVG9BcnJheSA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIHNsaWNlSXRlcmF0b3IoYXJyLCBpKSB7IHZhciBfYXJyID0gW107IHZhciBfbiA9IHRydWU7IHZhciBfZCA9IGZhbHNlOyB2YXIgX2UgPSB1bmRlZmluZWQ7IHRyeSB7IGZvciAodmFyIF9pID0gYXJyW1N5bWJvbC5pdGVyYXRvcl0oKSwgX3M7ICEoX24gPSAoX3MgPSBfaS5uZXh0KCkpLmRvbmUpOyBfbiA9IHRydWUpIHsgX2Fyci5wdXNoKF9zLnZhbHVlKTsgaWYgKGkgJiYgX2Fyci5sZW5ndGggPT09IGkpIGJyZWFrOyB9IH0gY2F0Y2ggKGVycikgeyBfZCA9IHRydWU7IF9lID0gZXJyOyB9IGZpbmFsbHkgeyB0cnkgeyBpZiAoIV9uICYmIF9pWydyZXR1cm4nXSkgX2lbJ3JldHVybiddKCk7IH0gZmluYWxseSB7IGlmIChfZCkgdGhyb3cgX2U7IH0gfSByZXR1cm4gX2FycjsgfSByZXR1cm4gZnVuY3Rpb24gKGFyciwgaSkgeyBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7IHJldHVybiBhcnI7IH0gZWxzZSBpZiAoU3ltYm9sLml0ZXJhdG9yIGluIE9iamVjdChhcnIpKSB7IHJldHVybiBzbGljZUl0ZXJhdG9yKGFyciwgaSk7IH0gZWxzZSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgYXR0ZW1wdCB0byBkZXN0cnVjdHVyZSBub24taXRlcmFibGUgaW5zdGFuY2UnKTsgfSB9OyB9KSgpO1xuXG5cdFRldGhlckJhc2UubW9kdWxlcy5wdXNoKHtcblx0ICBwb3NpdGlvbjogZnVuY3Rpb24gcG9zaXRpb24oX3JlZikge1xuXHQgICAgdmFyIHRvcCA9IF9yZWYudG9wO1xuXHQgICAgdmFyIGxlZnQgPSBfcmVmLmxlZnQ7XG5cblx0ICAgIGlmICghdGhpcy5vcHRpb25zLnNoaWZ0KSB7XG5cdCAgICAgIHJldHVybjtcblx0ICAgIH1cblxuXHQgICAgdmFyIHNoaWZ0ID0gdGhpcy5vcHRpb25zLnNoaWZ0O1xuXHQgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMuc2hpZnQgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgc2hpZnQgPSB0aGlzLm9wdGlvbnMuc2hpZnQuY2FsbCh0aGlzLCB7IHRvcDogdG9wLCBsZWZ0OiBsZWZ0IH0pO1xuXHQgICAgfVxuXG5cdCAgICB2YXIgc2hpZnRUb3AgPSB1bmRlZmluZWQsXG5cdCAgICAgICAgc2hpZnRMZWZ0ID0gdW5kZWZpbmVkO1xuXHQgICAgaWYgKHR5cGVvZiBzaGlmdCA9PT0gJ3N0cmluZycpIHtcblx0ICAgICAgc2hpZnQgPSBzaGlmdC5zcGxpdCgnICcpO1xuXHQgICAgICBzaGlmdFsxXSA9IHNoaWZ0WzFdIHx8IHNoaWZ0WzBdO1xuXG5cdCAgICAgIHZhciBfc2hpZnQgPSBzaGlmdDtcblxuXHQgICAgICB2YXIgX3NoaWZ0MiA9IF9zbGljZWRUb0FycmF5KF9zaGlmdCwgMik7XG5cblx0ICAgICAgc2hpZnRUb3AgPSBfc2hpZnQyWzBdO1xuXHQgICAgICBzaGlmdExlZnQgPSBfc2hpZnQyWzFdO1xuXG5cdCAgICAgIHNoaWZ0VG9wID0gcGFyc2VGbG9hdChzaGlmdFRvcCwgMTApO1xuXHQgICAgICBzaGlmdExlZnQgPSBwYXJzZUZsb2F0KHNoaWZ0TGVmdCwgMTApO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgc2hpZnRUb3AgPSBzaGlmdC50b3A7XG5cdCAgICAgIHNoaWZ0TGVmdCA9IHNoaWZ0LmxlZnQ7XG5cdCAgICB9XG5cblx0ICAgIHRvcCArPSBzaGlmdFRvcDtcblx0ICAgIGxlZnQgKz0gc2hpZnRMZWZ0O1xuXG5cdCAgICByZXR1cm4geyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9O1xuXHQgIH1cblx0fSk7XG5cdHJldHVybiBUZXRoZXI7XG5cblx0fSkpO1xuXG5cbi8qKiovIH1cbi8qKioqKiovIF0pXG59KTtcbjsiXSwiZmlsZSI6InN0eWxlZ3VpZGUuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
