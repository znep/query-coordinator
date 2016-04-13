/*!
 * Socrata Styleguide v0.7.0
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

	var Styleguide = module.exports = {
	  DropdownFactory: __webpack_require__(1),
	  FlannelFactory: __webpack_require__(2),
	  FlyoutFactory: __webpack_require__(4),
	  MenuFactory: __webpack_require__(5),
	  ModalFactory: __webpack_require__(6),
	  ToggleFactory: __webpack_require__(7),
	  TourFactory: __webpack_require__(8)
	};

	document.addEventListener('DOMContentLoaded', function() {
	  new Styleguide.DropdownFactory(document);
	  new Styleguide.FlannelFactory(document);
	  new Styleguide.FlyoutFactory(document);
	  new Styleguide.MenuFactory(document);
	  new Styleguide.ToggleFactory(document);
	  new Styleguide.TourFactory(document);
	});


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

	          obj.dd.dataset.value = opt.textContent;
	          obj.dd.dataset.index = index;

	          obj.placeholder.innerHTML = opt.innerText.trim();

	          return false;
	        });
	      });
	    }

	    document.addEventListener('click', function() {
	      Array.from(document.querySelectorAll('.dropdown')).forEach(function(dropdown) {
	        dropdown.classList.remove('active');
	      });
	    });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJzdHlsZWd1aWRlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcInN0eWxlZ3VpZGVcIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wic3R5bGVndWlkZVwiXSA9IGZhY3RvcnkoKTtcbn0pKHRoaXMsIGZ1bmN0aW9uKCkge1xucmV0dXJuIC8qKioqKiovIChmdW5jdGlvbihtb2R1bGVzKSB7IC8vIHdlYnBhY2tCb290c3RyYXBcbi8qKioqKiovIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuLyoqKioqKi8gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4vKioqKioqLyBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4vKioqKioqLyBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuLyoqKioqKi8gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuLyoqKioqKi8gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuLyoqKioqKi8gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbi8qKioqKiovIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuLyoqKioqKi8gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbi8qKioqKiovIFx0XHRcdGV4cG9ydHM6IHt9LFxuLyoqKioqKi8gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuLyoqKioqKi8gXHRcdFx0bG9hZGVkOiBmYWxzZVxuLyoqKioqKi8gXHRcdH07XG5cbi8qKioqKiovIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbi8qKioqKiovIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuLyoqKioqKi8gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbi8qKioqKiovIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuLyoqKioqKi8gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4vKioqKioqLyBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuLyoqKioqKi8gXHR9XG5cblxuLyoqKioqKi8gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4vKioqKioqLyBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbi8qKioqKiovIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuLyoqKioqKi8gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8qKioqKiovIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG4vKioqKioqLyB9KVxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKioqKiovIChbXG4vKiAwICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHR2YXIgU3R5bGVndWlkZSA9IG1vZHVsZS5leHBvcnRzID0ge1xuXHQgIERyb3Bkb3duRmFjdG9yeTogX193ZWJwYWNrX3JlcXVpcmVfXygxKSxcblx0ICBGbGFubmVsRmFjdG9yeTogX193ZWJwYWNrX3JlcXVpcmVfXygyKSxcblx0ICBGbHlvdXRGYWN0b3J5OiBfX3dlYnBhY2tfcmVxdWlyZV9fKDQpLFxuXHQgIE1lbnVGYWN0b3J5OiBfX3dlYnBhY2tfcmVxdWlyZV9fKDUpLFxuXHQgIE1vZGFsRmFjdG9yeTogX193ZWJwYWNrX3JlcXVpcmVfXyg2KSxcblx0ICBUb2dnbGVGYWN0b3J5OiBfX3dlYnBhY2tfcmVxdWlyZV9fKDcpLFxuXHQgIFRvdXJGYWN0b3J5OiBfX3dlYnBhY2tfcmVxdWlyZV9fKDgpXG5cdH07XG5cblx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uKCkge1xuXHQgIG5ldyBTdHlsZWd1aWRlLkRyb3Bkb3duRmFjdG9yeShkb2N1bWVudCk7XG5cdCAgbmV3IFN0eWxlZ3VpZGUuRmxhbm5lbEZhY3RvcnkoZG9jdW1lbnQpO1xuXHQgIG5ldyBTdHlsZWd1aWRlLkZseW91dEZhY3RvcnkoZG9jdW1lbnQpO1xuXHQgIG5ldyBTdHlsZWd1aWRlLk1lbnVGYWN0b3J5KGRvY3VtZW50KTtcblx0ICBuZXcgU3R5bGVndWlkZS5Ub2dnbGVGYWN0b3J5KGRvY3VtZW50KTtcblx0ICBuZXcgU3R5bGVndWlkZS5Ub3VyRmFjdG9yeShkb2N1bWVudCk7XG5cdH0pO1xuXG5cbi8qKiovIH0sXG4vKiAxICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHR2YXIgRHJvcGRvd25GYWN0b3J5ID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgdGhpcy5kcm9wZG93bnMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLWRyb3Bkb3duXScpKTtcblx0ICB0aGlzLmRyb3Bkb3ducy5mb3JFYWNoKGZ1bmN0aW9uKGRyb3Bkb3duKSB7XG5cdCAgICBuZXcgRHJvcGRvd24oZHJvcGRvd24pO1xuXHQgIH0pO1xuXHR9XG5cblx0dmFyIERyb3Bkb3duID0gZnVuY3Rpb24oZWxlbWVudCkge1xuXHQgIHRoaXMuZGQgPSBlbGVtZW50O1xuXHQgIHRoaXMub3JpZW50YXRpb24gPSB0aGlzLmRkLmdldEF0dHJpYnV0ZSgnZGF0YS1vcmllbnRhdGlvbicpIHx8ICdib3R0b20nO1xuXHQgIHRoaXMuc2VsZWN0YWJsZSA9IHRoaXMuZGQuaGFzQXR0cmlidXRlKCdkYXRhLXNlbGVjdGFibGUnKTtcblxuXHQgIHRoaXMuZGQuY2xhc3NMaXN0LmFkZCgnZHJvcGRvd24tb3JpZW50YXRpb24tJyArIHRoaXMub3JpZW50YXRpb24pO1xuXG5cdCAgdGhpcy5wbGFjZWhvbGRlciA9IHRoaXMuZGQucXVlcnlTZWxlY3Rvcignc3BhbicpO1xuXHQgIHRoaXMub3B0cyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuZGQucXVlcnlTZWxlY3RvckFsbCgnLmRyb3Bkb3duLW9wdGlvbnMgPiBsaScpKTtcblxuXHQgIHRoaXMuZGQuZGF0YXNldC52YWx1ZSA9ICcnO1xuXHQgIHRoaXMuZGQuZGF0YXNldC5pbmRleCA9IC0xO1xuXG5cdCAgdGhpcy5pbml0RXZlbnRzKCk7XG5cdH07XG5cblx0RHJvcGRvd24ucHJvdG90eXBlID0ge1xuXHQgIGluaXRFdmVudHM6IGZ1bmN0aW9uKCkge1xuXHQgICAgdmFyIG9iaiA9IHRoaXM7XG5cblx0ICAgIG9iai5kZC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cdCAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXHQgICAgICBvYmouZGQuY2xhc3NMaXN0LnRvZ2dsZSgnYWN0aXZlJyk7XG5cdCAgICAgIHJldHVybiBmYWxzZTtcblx0ICAgIH0pO1xuXG5cdCAgICBpZiAob2JqLnNlbGVjdGFibGUpIHtcblx0ICAgICAgb2JqLm9wdHMuZm9yRWFjaChmdW5jdGlvbihvcHQpIHtcblx0ICAgICAgICBvcHQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuXHQgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHQgICAgICAgICAgdmFyIG5vZGUgPSBvcHQ7XG5cdCAgICAgICAgICB2YXIgaW5kZXggPSAwO1xuXG5cdCAgICAgICAgICB3aGlsZSAoKG5vZGUgPSBub2RlLnByZXZpb3VzRWxlbWVudFNpYmxpbmcpICE9PSBudWxsKSB7XG5cdCAgICAgICAgICAgIGluZGV4Kys7XG5cdCAgICAgICAgICB9XG5cblx0ICAgICAgICAgIG9iai5kZC5kYXRhc2V0LnZhbHVlID0gb3B0LnRleHRDb250ZW50O1xuXHQgICAgICAgICAgb2JqLmRkLmRhdGFzZXQuaW5kZXggPSBpbmRleDtcblxuXHQgICAgICAgICAgb2JqLnBsYWNlaG9sZGVyLmlubmVySFRNTCA9IG9wdC5pbm5lclRleHQudHJpbSgpO1xuXG5cdCAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cdCAgICAgICAgfSk7XG5cdCAgICAgIH0pO1xuXHQgICAgfVxuXG5cdCAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHQgICAgICBBcnJheS5mcm9tKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5kcm9wZG93bicpKS5mb3JFYWNoKGZ1bmN0aW9uKGRyb3Bkb3duKSB7XG5cdCAgICAgICAgZHJvcGRvd24uY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG5cdCAgICAgIH0pO1xuXHQgICAgfSk7XG5cdCAgfVxuXHR9XG5cblxuLyoqKi8gfSxcbi8qIDIgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdHZhciB2ZWxvY2l0eSA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cblx0dmFyIEZsYW5uZWxGYWN0b3J5ID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgdmFyIG1vYmlsZUJyZWFrcG9pbnQgPSA0MjA7XG5cdCAgdmFyIGFuaW1hdGlvbkR1cmF0aW9uID0gMzAwO1xuXHQgIHZhciBhbmltYXRpb25FYXNpbmcgPSBbLjY0NSwgLjA0NSwgLjM1NSwgMV07XG5cdCAgdmFyIHBhZGRpbmcgPSAxMDtcblx0ICB2YXIgaG92ZXJhYmxlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseShkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1mbGFubmVsXScpKTtcblxuXHQgIGZ1bmN0aW9uIGhpZGVGbGFubmVsKGZsYW5uZWwsIGhvdmVyYWJsZSkge1xuXHQgICAgaWYgKGRvY3VtZW50LmJvZHkub2Zmc2V0V2lkdGggPCBtb2JpbGVCcmVha3BvaW50KSB7XG5cdCAgICAgIHZlbG9jaXR5KGZsYW5uZWwsIHtcblx0ICAgICAgICBsZWZ0OiBkb2N1bWVudC5ib2R5Lm9mZnNldFdpZHRoXG5cdCAgICAgIH0sIHtcblx0ICAgICAgICBkdXJhdGlvbjogYW5pbWF0aW9uRHVyYXRpb24sXG5cdCAgICAgICAgZWFzaW5nOiBhbmltYXRpb25FYXNpbmcsXG5cdCAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgZmxhbm5lbC5jbGFzc0xpc3QuYWRkKCdmbGFubmVsLWhpZGRlbicpO1xuXHQgICAgICAgICAgaG92ZXJhYmxlLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuXHQgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5vdmVyZmxvdyA9ICcnO1xuXHQgICAgICAgIH1cblx0ICAgICAgfSk7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICBmbGFubmVsLmNsYXNzTGlzdC5hZGQoJ2ZsYW5uZWwtaGlkZGVuJyk7XG5cdCAgICAgIGhvdmVyYWJsZS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcblx0ICAgIH1cblx0ICB9XG5cblx0ICBmdW5jdGlvbiBwb3NpdGlvbkZsYW5uZWwoZmxhbm5lbCwgaG92ZXJhYmxlKSB7XG5cdCAgICB2YXIgbm9kZSA9IGhvdmVyYWJsZTtcblx0ICAgIHZhciBsZWZ0ID0gMDtcblx0ICAgIHZhciB0b3AgPSAwO1xuXHQgICAgdmFyIGZsYW5uZWxXaWR0aCA9IGZsYW5uZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGg7XG5cdCAgICB2YXIgd2luZG93V2lkdGggPSBkb2N1bWVudC5ib2R5Lm9mZnNldFdpZHRoO1xuXG5cdCAgICBkbyB7XG5cdCAgICAgIGxlZnQgKz0gbm9kZS5vZmZzZXRMZWZ0O1xuXHQgICAgICB0b3AgKz0gbm9kZS5vZmZzZXRUb3A7XG5cdCAgICB9IHdoaWxlICgobm9kZSA9IG5vZGUub2Zmc2V0UGFyZW50KSAhPT0gbnVsbCk7XG5cblx0ICAgIGxlZnQgPSBsZWZ0ICsgaG92ZXJhYmxlLm9mZnNldFdpZHRoIC8gMjtcblx0ICAgIHRvcCA9IHRvcCArIGhvdmVyYWJsZS5vZmZzZXRIZWlnaHQgKyBwYWRkaW5nO1xuXG5cdCAgICBpZiAobGVmdCArIGZsYW5uZWxXaWR0aCA+IHdpbmRvd1dpZHRoICYmIHdpbmRvd1dpZHRoID49IG1vYmlsZUJyZWFrcG9pbnQpIHtcblx0ICAgICAgZmxhbm5lbC5jbGFzc0xpc3QucmVtb3ZlKCdmbGFubmVsLXJpZ2h0Jyk7XG5cdCAgICAgIGZsYW5uZWwuY2xhc3NMaXN0LmFkZCgnZmxhbm5lbC1sZWZ0Jyk7XG5cdCAgICAgIGxlZnQgLT0gZmxhbm5lbFdpZHRoO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgZmxhbm5lbC5jbGFzc0xpc3QucmVtb3ZlKCdmbGFubmVsLWxlZnQnKTtcblx0ICAgICAgZmxhbm5lbC5jbGFzc0xpc3QuYWRkKCdmbGFubmVsLXJpZ2h0Jyk7XG5cdCAgICB9XG5cblx0ICAgIGlmICh3aW5kb3dXaWR0aCA+PSBtb2JpbGVCcmVha3BvaW50KSB7XG5cdCAgICAgIGZsYW5uZWwuc3R5bGUubGVmdCA9IGxlZnQgKyAncHgnO1xuXHQgICAgICBmbGFubmVsLnN0eWxlLnRvcCA9IHRvcCArICdweCc7XG5cdCAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnJztcblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgIGZsYW5uZWwuc3R5bGUubGVmdCA9IHdpbmRvd1dpZHRoICsgJ3B4Jztcblx0ICAgICAgZmxhbm5lbC5zdHlsZS50b3AgPSAwO1xuXHQgICAgICB2ZWxvY2l0eShmbGFubmVsLCB7XG5cdCAgICAgICAgbGVmdDogMFxuXHQgICAgICB9LCB7XG5cdCAgICAgICAgZHVyYXRpb246IGFuaW1hdGlvbkR1cmF0aW9uLFxuXHQgICAgICAgIGVhc2luZzogYW5pbWF0aW9uRWFzaW5nLFxuXHQgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcblx0ICAgICAgICB9XG5cdCAgICAgIH0pO1xuXHQgICAgfVxuXHQgIH1cblxuXHQgIGhvdmVyYWJsZXMuZm9yRWFjaChmdW5jdGlvbihob3ZlcmFibGUpIHtcblx0ICAgIHZhciBmbGFubmVsSWQgPSBob3ZlcmFibGUuZ2V0QXR0cmlidXRlKCdkYXRhLWZsYW5uZWwnKTtcblx0ICAgIHZhciBmbGFubmVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignIycgKyBmbGFubmVsSWQpO1xuXHQgICAgdmFyIGRpc21pc3NhbHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkoZmxhbm5lbC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1mbGFubmVsLWRpc21pc3NdJykpO1xuXG5cdCAgICBkaXNtaXNzYWxzLmZvckVhY2goZnVuY3Rpb24oZGlzbWlzc2FsKSB7XG5cdCAgICAgIGRpc21pc3NhbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIGhpZGVGbGFubmVsKGZsYW5uZWwsIGhvdmVyYWJsZSk7XG5cdCAgICAgIH0pO1xuXHQgICAgfSk7XG5cblx0ICAgIGhvdmVyYWJsZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cdCAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG5cdCAgICAgIGZsYW5uZWwuY2xhc3NMaXN0LnRvZ2dsZSgnZmxhbm5lbC1oaWRkZW4nKTtcblx0ICAgICAgcG9zaXRpb25GbGFubmVsKGZsYW5uZWwsIGhvdmVyYWJsZSk7XG5cdCAgICB9KTtcblxuXHQgICAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cdCAgICAgIGlmIChmbGFubmVsLmNsYXNzTGlzdC5jb250YWlucygnZmxhbm5lbC1oaWRkZW4nKSkge1xuXHQgICAgICAgIHJldHVybjtcblx0ICAgICAgfVxuXG5cdCAgICAgIHZhciBub2RlID0gZXZlbnQudGFyZ2V0O1xuXG5cdCAgICAgIHdoaWxlIChub2RlLnBhcmVudEVsZW1lbnQpIHtcblx0ICAgICAgICBpZiAobm9kZS5pZCA9PT0gZmxhbm5lbElkKSB7XG5cdCAgICAgICAgICByZXR1cm47XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgbm9kZSA9IG5vZGUucGFyZW50RWxlbWVudDtcblx0ICAgICAgfVxuXG5cdCAgICAgIGhpZGVGbGFubmVsKGZsYW5uZWwsIGhvdmVyYWJsZSk7XG5cdCAgICB9KTtcblxuXHQgICAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cdCAgICAgIHZhciBrZXkgPSBldmVudC53aGljaCB8fCBldmVudC5rZXlDb2RlO1xuXG5cdCAgICAgIC8vIEVTQ1xuXHQgICAgICBpZiAoa2V5ID09PSAyNykge1xuXHQgICAgICAgIGhpZGVGbGFubmVsKGZsYW5uZWwsIGhvdmVyYWJsZSk7XG5cdCAgICAgIH1cblx0ICAgIH0pO1xuXG5cdCAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgZnVuY3Rpb24oKSB7XG5cdCAgICAgIGlmICghZmxhbm5lbC5jbGFzc0xpc3QuY29udGFpbnMoJ2ZsYW5uZWwtaGlkZGVuJykpIHtcblx0ICAgICAgICBwb3NpdGlvbkZsYW5uZWwoZmxhbm5lbCwgaG92ZXJhYmxlKTtcblx0ICAgICAgfVxuXHQgICAgfSk7XG5cdCAgfSk7XG5cdH1cblxuXG4vKioqLyB9LFxuLyogMyAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0dmFyIF9fV0VCUEFDS19BTURfREVGSU5FX0ZBQ1RPUllfXywgX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX187LyohIFZlbG9jaXR5SlMub3JnICgxLjIuMykuIChDKSAyMDE0IEp1bGlhbiBTaGFwaXJvLiBNSVQgQGxpY2Vuc2U6IGVuLndpa2lwZWRpYS5vcmcvd2lraS9NSVRfTGljZW5zZSAqL1xuXG5cdC8qKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgIFZlbG9jaXR5IGpRdWVyeSBTaGltXG5cdCoqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0LyohIFZlbG9jaXR5SlMub3JnIGpRdWVyeSBTaGltICgxLjAuMSkuIChDKSAyMDE0IFRoZSBqUXVlcnkgRm91bmRhdGlvbi4gTUlUIEBsaWNlbnNlOiBlbi53aWtpcGVkaWEub3JnL3dpa2kvTUlUX0xpY2Vuc2UuICovXG5cblx0LyogVGhpcyBmaWxlIGNvbnRhaW5zIHRoZSBqUXVlcnkgZnVuY3Rpb25zIHRoYXQgVmVsb2NpdHkgcmVsaWVzIG9uLCB0aGVyZWJ5IHJlbW92aW5nIFZlbG9jaXR5J3MgZGVwZW5kZW5jeSBvbiBhIGZ1bGwgY29weSBvZiBqUXVlcnksIGFuZCBhbGxvd2luZyBpdCB0byB3b3JrIGluIGFueSBlbnZpcm9ubWVudC4gKi9cblx0LyogVGhlc2Ugc2hpbW1lZCBmdW5jdGlvbnMgYXJlIG9ubHkgdXNlZCBpZiBqUXVlcnkgaXNuJ3QgcHJlc2VudC4gSWYgYm90aCB0aGlzIHNoaW0gYW5kIGpRdWVyeSBhcmUgbG9hZGVkLCBWZWxvY2l0eSBkZWZhdWx0cyB0byBqUXVlcnkgcHJvcGVyLiAqL1xuXHQvKiBCcm93c2VyIHN1cHBvcnQ6IFVzaW5nIHRoaXMgc2hpbSBpbnN0ZWFkIG9mIGpRdWVyeSBwcm9wZXIgcmVtb3ZlcyBzdXBwb3J0IGZvciBJRTguICovXG5cblx0OyhmdW5jdGlvbiAod2luZG93KSB7XG5cdCAgICAvKioqKioqKioqKioqKioqXG5cdCAgICAgICAgIFNldHVwXG5cdCAgICAqKioqKioqKioqKioqKiovXG5cblx0ICAgIC8qIElmIGpRdWVyeSBpcyBhbHJlYWR5IGxvYWRlZCwgdGhlcmUncyBubyBwb2ludCBpbiBsb2FkaW5nIHRoaXMgc2hpbS4gKi9cblx0ICAgIGlmICh3aW5kb3cualF1ZXJ5KSB7XG5cdCAgICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXG5cdCAgICAvKiBqUXVlcnkgYmFzZS4gKi9cblx0ICAgIHZhciAkID0gZnVuY3Rpb24gKHNlbGVjdG9yLCBjb250ZXh0KSB7XG5cdCAgICAgICAgcmV0dXJuIG5ldyAkLmZuLmluaXQoc2VsZWN0b3IsIGNvbnRleHQpO1xuXHQgICAgfTtcblxuXHQgICAgLyoqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICBQcml2YXRlIE1ldGhvZHNcblx0ICAgICoqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAvKiBqUXVlcnkgKi9cblx0ICAgICQuaXNXaW5kb3cgPSBmdW5jdGlvbiAob2JqKSB7XG5cdCAgICAgICAgLyoganNoaW50IGVxZXFlcTogZmFsc2UgKi9cblx0ICAgICAgICByZXR1cm4gb2JqICE9IG51bGwgJiYgb2JqID09IG9iai53aW5kb3c7XG5cdCAgICB9O1xuXG5cdCAgICAvKiBqUXVlcnkgKi9cblx0ICAgICQudHlwZSA9IGZ1bmN0aW9uIChvYmopIHtcblx0ICAgICAgICBpZiAob2JqID09IG51bGwpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIG9iaiArIFwiXCI7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHR5cGVvZiBvYmogPT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIG9iaiA9PT0gXCJmdW5jdGlvblwiID9cblx0ICAgICAgICAgICAgY2xhc3MydHlwZVt0b1N0cmluZy5jYWxsKG9iaildIHx8IFwib2JqZWN0XCIgOlxuXHQgICAgICAgICAgICB0eXBlb2Ygb2JqO1xuXHQgICAgfTtcblxuXHQgICAgLyogalF1ZXJ5ICovXG5cdCAgICAkLmlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChvYmopIHtcblx0ICAgICAgICByZXR1cm4gJC50eXBlKG9iaikgPT09IFwiYXJyYXlcIjtcblx0ICAgIH07XG5cblx0ICAgIC8qIGpRdWVyeSAqL1xuXHQgICAgZnVuY3Rpb24gaXNBcnJheWxpa2UgKG9iaikge1xuXHQgICAgICAgIHZhciBsZW5ndGggPSBvYmoubGVuZ3RoLFxuXHQgICAgICAgICAgICB0eXBlID0gJC50eXBlKG9iaik7XG5cblx0ICAgICAgICBpZiAodHlwZSA9PT0gXCJmdW5jdGlvblwiIHx8ICQuaXNXaW5kb3cob2JqKSkge1xuXHQgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKG9iai5ub2RlVHlwZSA9PT0gMSAmJiBsZW5ndGgpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHR5cGUgPT09IFwiYXJyYXlcIiB8fCBsZW5ndGggPT09IDAgfHwgdHlwZW9mIGxlbmd0aCA9PT0gXCJudW1iZXJcIiAmJiBsZW5ndGggPiAwICYmIChsZW5ndGggLSAxKSBpbiBvYmo7XG5cdCAgICB9XG5cblx0ICAgIC8qKioqKioqKioqKioqKipcblx0ICAgICAgICQgTWV0aG9kc1xuXHQgICAgKioqKioqKioqKioqKioqL1xuXG5cdCAgICAvKiBqUXVlcnk6IFN1cHBvcnQgcmVtb3ZlZCBmb3IgSUU8OS4gKi9cblx0ICAgICQuaXNQbGFpbk9iamVjdCA9IGZ1bmN0aW9uIChvYmopIHtcblx0ICAgICAgICB2YXIga2V5O1xuXG5cdCAgICAgICAgaWYgKCFvYmogfHwgJC50eXBlKG9iaikgIT09IFwib2JqZWN0XCIgfHwgb2JqLm5vZGVUeXBlIHx8ICQuaXNXaW5kb3cob2JqKSkge1xuXHQgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdHJ5IHtcblx0ICAgICAgICAgICAgaWYgKG9iai5jb25zdHJ1Y3RvciAmJlxuXHQgICAgICAgICAgICAgICAgIWhhc093bi5jYWxsKG9iaiwgXCJjb25zdHJ1Y3RvclwiKSAmJlxuXHQgICAgICAgICAgICAgICAgIWhhc093bi5jYWxsKG9iai5jb25zdHJ1Y3Rvci5wcm90b3R5cGUsIFwiaXNQcm90b3R5cGVPZlwiKSkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSBjYXRjaCAoZSkge1xuXHQgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgZm9yIChrZXkgaW4gb2JqKSB7fVxuXG5cdCAgICAgICAgcmV0dXJuIGtleSA9PT0gdW5kZWZpbmVkIHx8IGhhc093bi5jYWxsKG9iaiwga2V5KTtcblx0ICAgIH07XG5cblx0ICAgIC8qIGpRdWVyeSAqL1xuXHQgICAgJC5lYWNoID0gZnVuY3Rpb24ob2JqLCBjYWxsYmFjaywgYXJncykge1xuXHQgICAgICAgIHZhciB2YWx1ZSxcblx0ICAgICAgICAgICAgaSA9IDAsXG5cdCAgICAgICAgICAgIGxlbmd0aCA9IG9iai5sZW5ndGgsXG5cdCAgICAgICAgICAgIGlzQXJyYXkgPSBpc0FycmF5bGlrZShvYmopO1xuXG5cdCAgICAgICAgaWYgKGFyZ3MpIHtcblx0ICAgICAgICAgICAgaWYgKGlzQXJyYXkpIHtcblx0ICAgICAgICAgICAgICAgIGZvciAoOyBpIDwgbGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGNhbGxiYWNrLmFwcGx5KG9ialtpXSwgYXJncyk7XG5cblx0ICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IGZhbHNlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIGZvciAoaSBpbiBvYmopIHtcblx0ICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGNhbGxiYWNrLmFwcGx5KG9ialtpXSwgYXJncyk7XG5cblx0ICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT09IGZhbHNlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgaWYgKGlzQXJyYXkpIHtcblx0ICAgICAgICAgICAgICAgIGZvciAoOyBpIDwgbGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGNhbGxiYWNrLmNhbGwob2JqW2ldLCBpLCBvYmpbaV0pO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBmYWxzZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICBmb3IgKGkgaW4gb2JqKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBjYWxsYmFjay5jYWxsKG9ialtpXSwgaSwgb2JqW2ldKTtcblxuXHQgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIG9iajtcblx0ICAgIH07XG5cblx0ICAgIC8qIEN1c3RvbSAqL1xuXHQgICAgJC5kYXRhID0gZnVuY3Rpb24gKG5vZGUsIGtleSwgdmFsdWUpIHtcblx0ICAgICAgICAvKiAkLmdldERhdGEoKSAqL1xuXHQgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgIHZhciBpZCA9IG5vZGVbJC5leHBhbmRvXSxcblx0ICAgICAgICAgICAgICAgIHN0b3JlID0gaWQgJiYgY2FjaGVbaWRdO1xuXG5cdCAgICAgICAgICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIHN0b3JlO1xuXHQgICAgICAgICAgICB9IGVsc2UgaWYgKHN0b3JlKSB7XG5cdCAgICAgICAgICAgICAgICBpZiAoa2V5IGluIHN0b3JlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0b3JlW2tleV07XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAvKiAkLnNldERhdGEoKSAqL1xuXHQgICAgICAgIH0gZWxzZSBpZiAoa2V5ICE9PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgdmFyIGlkID0gbm9kZVskLmV4cGFuZG9dIHx8IChub2RlWyQuZXhwYW5kb10gPSArKyQudXVpZCk7XG5cblx0ICAgICAgICAgICAgY2FjaGVbaWRdID0gY2FjaGVbaWRdIHx8IHt9O1xuXHQgICAgICAgICAgICBjYWNoZVtpZF1ba2V5XSA9IHZhbHVlO1xuXG5cdCAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcblx0ICAgICAgICB9XG5cdCAgICB9O1xuXG5cdCAgICAvKiBDdXN0b20gKi9cblx0ICAgICQucmVtb3ZlRGF0YSA9IGZ1bmN0aW9uIChub2RlLCBrZXlzKSB7XG5cdCAgICAgICAgdmFyIGlkID0gbm9kZVskLmV4cGFuZG9dLFxuXHQgICAgICAgICAgICBzdG9yZSA9IGlkICYmIGNhY2hlW2lkXTtcblxuXHQgICAgICAgIGlmIChzdG9yZSkge1xuXHQgICAgICAgICAgICAkLmVhY2goa2V5cywgZnVuY3Rpb24oXywga2V5KSB7XG5cdCAgICAgICAgICAgICAgICBkZWxldGUgc3RvcmVba2V5XTtcblx0ICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgfVxuXHQgICAgfTtcblxuXHQgICAgLyogalF1ZXJ5ICovXG5cdCAgICAkLmV4dGVuZCA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICB2YXIgc3JjLCBjb3B5SXNBcnJheSwgY29weSwgbmFtZSwgb3B0aW9ucywgY2xvbmUsXG5cdCAgICAgICAgICAgIHRhcmdldCA9IGFyZ3VtZW50c1swXSB8fCB7fSxcblx0ICAgICAgICAgICAgaSA9IDEsXG5cdCAgICAgICAgICAgIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGgsXG5cdCAgICAgICAgICAgIGRlZXAgPSBmYWxzZTtcblxuXHQgICAgICAgIGlmICh0eXBlb2YgdGFyZ2V0ID09PSBcImJvb2xlYW5cIikge1xuXHQgICAgICAgICAgICBkZWVwID0gdGFyZ2V0O1xuXG5cdCAgICAgICAgICAgIHRhcmdldCA9IGFyZ3VtZW50c1tpXSB8fCB7fTtcblx0ICAgICAgICAgICAgaSsrO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGlmICh0eXBlb2YgdGFyZ2V0ICE9PSBcIm9iamVjdFwiICYmICQudHlwZSh0YXJnZXQpICE9PSBcImZ1bmN0aW9uXCIpIHtcblx0ICAgICAgICAgICAgdGFyZ2V0ID0ge307XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKGkgPT09IGxlbmd0aCkge1xuXHQgICAgICAgICAgICB0YXJnZXQgPSB0aGlzO1xuXHQgICAgICAgICAgICBpLS07XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgZm9yICg7IGkgPCBsZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICBpZiAoKG9wdGlvbnMgPSBhcmd1bWVudHNbaV0pICE9IG51bGwpIHtcblx0ICAgICAgICAgICAgICAgIGZvciAobmFtZSBpbiBvcHRpb25zKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgc3JjID0gdGFyZ2V0W25hbWVdO1xuXHQgICAgICAgICAgICAgICAgICAgIGNvcHkgPSBvcHRpb25zW25hbWVdO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldCA9PT0gY29weSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoZGVlcCAmJiBjb3B5ICYmICgkLmlzUGxhaW5PYmplY3QoY29weSkgfHwgKGNvcHlJc0FycmF5ID0gJC5pc0FycmF5KGNvcHkpKSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvcHlJc0FycmF5KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3B5SXNBcnJheSA9IGZhbHNlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmUgPSBzcmMgJiYgJC5pc0FycmF5KHNyYykgPyBzcmMgOiBbXTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmUgPSBzcmMgJiYgJC5pc1BsYWluT2JqZWN0KHNyYykgPyBzcmMgOiB7fTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFtuYW1lXSA9ICQuZXh0ZW5kKGRlZXAsIGNsb25lLCBjb3B5KTtcblxuXHQgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY29weSAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFtuYW1lXSA9IGNvcHk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHRhcmdldDtcblx0ICAgIH07XG5cblx0ICAgIC8qIGpRdWVyeSAxLjQuMyAqL1xuXHQgICAgJC5xdWV1ZSA9IGZ1bmN0aW9uIChlbGVtLCB0eXBlLCBkYXRhKSB7XG5cdCAgICAgICAgZnVuY3Rpb24gJG1ha2VBcnJheSAoYXJyLCByZXN1bHRzKSB7XG5cdCAgICAgICAgICAgIHZhciByZXQgPSByZXN1bHRzIHx8IFtdO1xuXG5cdCAgICAgICAgICAgIGlmIChhcnIgIT0gbnVsbCkge1xuXHQgICAgICAgICAgICAgICAgaWYgKGlzQXJyYXlsaWtlKE9iamVjdChhcnIpKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIC8qICQubWVyZ2UgKi9cblx0ICAgICAgICAgICAgICAgICAgICAoZnVuY3Rpb24oZmlyc3QsIHNlY29uZCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGVuID0gK3NlY29uZC5sZW5ndGgsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBqID0gMCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGkgPSBmaXJzdC5sZW5ndGg7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKGogPCBsZW4pIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0W2krK10gPSBzZWNvbmRbaisrXTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsZW4gIT09IGxlbikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHNlY29uZFtqXSAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3RbaSsrXSA9IHNlY29uZFtqKytdO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3QubGVuZ3RoID0gaTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmlyc3Q7XG5cdCAgICAgICAgICAgICAgICAgICAgfSkocmV0LCB0eXBlb2YgYXJyID09PSBcInN0cmluZ1wiID8gW2Fycl0gOiBhcnIpO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICBbXS5wdXNoLmNhbGwocmV0LCBhcnIpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgcmV0dXJuIHJldDtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAoIWVsZW0pIHtcblx0ICAgICAgICAgICAgcmV0dXJuO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHR5cGUgPSAodHlwZSB8fCBcImZ4XCIpICsgXCJxdWV1ZVwiO1xuXG5cdCAgICAgICAgdmFyIHEgPSAkLmRhdGEoZWxlbSwgdHlwZSk7XG5cblx0ICAgICAgICBpZiAoIWRhdGEpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHEgfHwgW107XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKCFxIHx8ICQuaXNBcnJheShkYXRhKSkge1xuXHQgICAgICAgICAgICBxID0gJC5kYXRhKGVsZW0sIHR5cGUsICRtYWtlQXJyYXkoZGF0YSkpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHEucHVzaChkYXRhKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gcTtcblx0ICAgIH07XG5cblx0ICAgIC8qIGpRdWVyeSAxLjQuMyAqL1xuXHQgICAgJC5kZXF1ZXVlID0gZnVuY3Rpb24gKGVsZW1zLCB0eXBlKSB7XG5cdCAgICAgICAgLyogQ3VzdG9tOiBFbWJlZCBlbGVtZW50IGl0ZXJhdGlvbi4gKi9cblx0ICAgICAgICAkLmVhY2goZWxlbXMubm9kZVR5cGUgPyBbIGVsZW1zIF0gOiBlbGVtcywgZnVuY3Rpb24oaSwgZWxlbSkge1xuXHQgICAgICAgICAgICB0eXBlID0gdHlwZSB8fCBcImZ4XCI7XG5cblx0ICAgICAgICAgICAgdmFyIHF1ZXVlID0gJC5xdWV1ZShlbGVtLCB0eXBlKSxcblx0ICAgICAgICAgICAgICAgIGZuID0gcXVldWUuc2hpZnQoKTtcblxuXHQgICAgICAgICAgICBpZiAoZm4gPT09IFwiaW5wcm9ncmVzc1wiKSB7XG5cdCAgICAgICAgICAgICAgICBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBpZiAoZm4pIHtcblx0ICAgICAgICAgICAgICAgIGlmICh0eXBlID09PSBcImZ4XCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICBxdWV1ZS51bnNoaWZ0KFwiaW5wcm9ncmVzc1wiKTtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgZm4uY2FsbChlbGVtLCBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgICAgICAgICAkLmRlcXVldWUoZWxlbSwgdHlwZSk7XG5cdCAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0pO1xuXHQgICAgfTtcblxuXHQgICAgLyoqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgJC5mbiBNZXRob2RzXG5cdCAgICAqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgIC8qIGpRdWVyeSAqL1xuXHQgICAgJC5mbiA9ICQucHJvdG90eXBlID0ge1xuXHQgICAgICAgIGluaXQ6IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuXHQgICAgICAgICAgICAvKiBKdXN0IHJldHVybiB0aGUgZWxlbWVudCB3cmFwcGVkIGluc2lkZSBhbiBhcnJheTsgZG9uJ3QgcHJvY2VlZCB3aXRoIHRoZSBhY3R1YWwgalF1ZXJ5IG5vZGUgd3JhcHBpbmcgcHJvY2Vzcy4gKi9cblx0ICAgICAgICAgICAgaWYgKHNlbGVjdG9yLm5vZGVUeXBlKSB7XG5cdCAgICAgICAgICAgICAgICB0aGlzWzBdID0gc2VsZWN0b3I7XG5cblx0ICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm90IGEgRE9NIG5vZGUuXCIpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIG9mZnNldDogZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAvKiBqUXVlcnkgYWx0ZXJlZCBjb2RlOiBEcm9wcGVkIGRpc2Nvbm5lY3RlZCBET00gbm9kZSBjaGVja2luZy4gKi9cblx0ICAgICAgICAgICAgdmFyIGJveCA9IHRoaXNbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0ID8gdGhpc1swXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSA6IHsgdG9wOiAwLCBsZWZ0OiAwIH07XG5cblx0ICAgICAgICAgICAgcmV0dXJuIHtcblx0ICAgICAgICAgICAgICAgIHRvcDogYm94LnRvcCArICh3aW5kb3cucGFnZVlPZmZzZXQgfHwgZG9jdW1lbnQuc2Nyb2xsVG9wICB8fCAwKSAgLSAoZG9jdW1lbnQuY2xpZW50VG9wICB8fCAwKSxcblx0ICAgICAgICAgICAgICAgIGxlZnQ6IGJveC5sZWZ0ICsgKHdpbmRvdy5wYWdlWE9mZnNldCB8fCBkb2N1bWVudC5zY3JvbGxMZWZ0ICB8fCAwKSAtIChkb2N1bWVudC5jbGllbnRMZWZ0IHx8IDApXG5cdCAgICAgICAgICAgIH07XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIHBvc2l0aW9uOiBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgIC8qIGpRdWVyeSAqL1xuXHQgICAgICAgICAgICBmdW5jdGlvbiBvZmZzZXRQYXJlbnQoKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0UGFyZW50ID0gdGhpcy5vZmZzZXRQYXJlbnQgfHwgZG9jdW1lbnQ7XG5cblx0ICAgICAgICAgICAgICAgIHdoaWxlIChvZmZzZXRQYXJlbnQgJiYgKCFvZmZzZXRQYXJlbnQubm9kZVR5cGUudG9Mb3dlckNhc2UgPT09IFwiaHRtbFwiICYmIG9mZnNldFBhcmVudC5zdHlsZS5wb3NpdGlvbiA9PT0gXCJzdGF0aWNcIikpIHtcblx0ICAgICAgICAgICAgICAgICAgICBvZmZzZXRQYXJlbnQgPSBvZmZzZXRQYXJlbnQub2Zmc2V0UGFyZW50O1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICByZXR1cm4gb2Zmc2V0UGFyZW50IHx8IGRvY3VtZW50O1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLyogWmVwdG8gKi9cblx0ICAgICAgICAgICAgdmFyIGVsZW0gPSB0aGlzWzBdLFxuXHQgICAgICAgICAgICAgICAgb2Zmc2V0UGFyZW50ID0gb2Zmc2V0UGFyZW50LmFwcGx5KGVsZW0pLFxuXHQgICAgICAgICAgICAgICAgb2Zmc2V0ID0gdGhpcy5vZmZzZXQoKSxcblx0ICAgICAgICAgICAgICAgIHBhcmVudE9mZnNldCA9IC9eKD86Ym9keXxodG1sKSQvaS50ZXN0KG9mZnNldFBhcmVudC5ub2RlTmFtZSkgPyB7IHRvcDogMCwgbGVmdDogMCB9IDogJChvZmZzZXRQYXJlbnQpLm9mZnNldCgpXG5cblx0ICAgICAgICAgICAgb2Zmc2V0LnRvcCAtPSBwYXJzZUZsb2F0KGVsZW0uc3R5bGUubWFyZ2luVG9wKSB8fCAwO1xuXHQgICAgICAgICAgICBvZmZzZXQubGVmdCAtPSBwYXJzZUZsb2F0KGVsZW0uc3R5bGUubWFyZ2luTGVmdCkgfHwgMDtcblxuXHQgICAgICAgICAgICBpZiAob2Zmc2V0UGFyZW50LnN0eWxlKSB7XG5cdCAgICAgICAgICAgICAgICBwYXJlbnRPZmZzZXQudG9wICs9IHBhcnNlRmxvYXQob2Zmc2V0UGFyZW50LnN0eWxlLmJvcmRlclRvcFdpZHRoKSB8fCAwXG5cdCAgICAgICAgICAgICAgICBwYXJlbnRPZmZzZXQubGVmdCArPSBwYXJzZUZsb2F0KG9mZnNldFBhcmVudC5zdHlsZS5ib3JkZXJMZWZ0V2lkdGgpIHx8IDBcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHJldHVybiB7XG5cdCAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AgLSBwYXJlbnRPZmZzZXQudG9wLFxuXHQgICAgICAgICAgICAgICAgbGVmdDogb2Zmc2V0LmxlZnQgLSBwYXJlbnRPZmZzZXQubGVmdFxuXHQgICAgICAgICAgICB9O1xuXHQgICAgICAgIH1cblx0ICAgIH07XG5cblx0ICAgIC8qKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICBQcml2YXRlIFZhcmlhYmxlc1xuXHQgICAgKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgLyogRm9yICQuZGF0YSgpICovXG5cdCAgICB2YXIgY2FjaGUgPSB7fTtcblx0ICAgICQuZXhwYW5kbyA9IFwidmVsb2NpdHlcIiArIChuZXcgRGF0ZSgpLmdldFRpbWUoKSk7XG5cdCAgICAkLnV1aWQgPSAwO1xuXG5cdCAgICAvKiBGb3IgJC5xdWV1ZSgpICovXG5cdCAgICB2YXIgY2xhc3MydHlwZSA9IHt9LFxuXHQgICAgICAgIGhhc093biA9IGNsYXNzMnR5cGUuaGFzT3duUHJvcGVydHksXG5cdCAgICAgICAgdG9TdHJpbmcgPSBjbGFzczJ0eXBlLnRvU3RyaW5nO1xuXG5cdCAgICB2YXIgdHlwZXMgPSBcIkJvb2xlYW4gTnVtYmVyIFN0cmluZyBGdW5jdGlvbiBBcnJheSBEYXRlIFJlZ0V4cCBPYmplY3QgRXJyb3JcIi5zcGxpdChcIiBcIik7XG5cdCAgICBmb3IgKHZhciBpID0gMDsgaSA8IHR5cGVzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgY2xhc3MydHlwZVtcIltvYmplY3QgXCIgKyB0eXBlc1tpXSArIFwiXVwiXSA9IHR5cGVzW2ldLnRvTG93ZXJDYXNlKCk7XG5cdCAgICB9XG5cblx0ICAgIC8qIE1ha2VzICQobm9kZSkgcG9zc2libGUsIHdpdGhvdXQgaGF2aW5nIHRvIGNhbGwgaW5pdC4gKi9cblx0ICAgICQuZm4uaW5pdC5wcm90b3R5cGUgPSAkLmZuO1xuXG5cdCAgICAvKiBHbG9iYWxpemUgVmVsb2NpdHkgb250byB0aGUgd2luZG93LCBhbmQgYXNzaWduIGl0cyBVdGlsaXRpZXMgcHJvcGVydHkuICovXG5cdCAgICB3aW5kb3cuVmVsb2NpdHkgPSB7IFV0aWxpdGllczogJCB9O1xuXHR9KSh3aW5kb3cpO1xuXG5cdC8qKioqKioqKioqKioqKioqKipcblx0ICAgIFZlbG9jaXR5LmpzXG5cdCoqKioqKioqKioqKioqKioqKi9cblxuXHQ7KGZ1bmN0aW9uIChmYWN0b3J5KSB7XG5cdCAgICAvKiBDb21tb25KUyBtb2R1bGUuICovXG5cdCAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09IFwib2JqZWN0XCIpIHtcblx0ICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ICAgIC8qIEFNRCBtb2R1bGUuICovXG5cdCAgICB9IGVsc2UgaWYgKHRydWUpIHtcblx0ICAgICAgICAhKF9fV0VCUEFDS19BTURfREVGSU5FX0ZBQ1RPUllfXyA9IChmYWN0b3J5KSwgX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX18gPSAodHlwZW9mIF9fV0VCUEFDS19BTURfREVGSU5FX0ZBQ1RPUllfXyA9PT0gJ2Z1bmN0aW9uJyA/IChfX1dFQlBBQ0tfQU1EX0RFRklORV9GQUNUT1JZX18uY2FsbChleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fLCBleHBvcnRzLCBtb2R1bGUpKSA6IF9fV0VCUEFDS19BTURfREVGSU5FX0ZBQ1RPUllfXyksIF9fV0VCUEFDS19BTURfREVGSU5FX1JFU1VMVF9fICE9PSB1bmRlZmluZWQgJiYgKG1vZHVsZS5leHBvcnRzID0gX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX18pKTtcblx0ICAgIC8qIEJyb3dzZXIgZ2xvYmFscy4gKi9cblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgICAgZmFjdG9yeSgpO1xuXHQgICAgfVxuXHR9KGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gZnVuY3Rpb24gKGdsb2JhbCwgd2luZG93LCBkb2N1bWVudCwgdW5kZWZpbmVkKSB7XG5cblx0ICAgIC8qKioqKioqKioqKioqKipcblx0ICAgICAgICBTdW1tYXJ5XG5cdCAgICAqKioqKioqKioqKioqKiovXG5cblx0ICAgIC8qXG5cdCAgICAtIENTUzogQ1NTIHN0YWNrIHRoYXQgd29ya3MgaW5kZXBlbmRlbnRseSBmcm9tIHRoZSByZXN0IG9mIFZlbG9jaXR5LlxuXHQgICAgLSBhbmltYXRlKCk6IENvcmUgYW5pbWF0aW9uIG1ldGhvZCB0aGF0IGl0ZXJhdGVzIG92ZXIgdGhlIHRhcmdldGVkIGVsZW1lbnRzIGFuZCBxdWV1ZXMgdGhlIGluY29taW5nIGNhbGwgb250byBlYWNoIGVsZW1lbnQgaW5kaXZpZHVhbGx5LlxuXHQgICAgICAtIFByZS1RdWV1ZWluZzogUHJlcGFyZSB0aGUgZWxlbWVudCBmb3IgYW5pbWF0aW9uIGJ5IGluc3RhbnRpYXRpbmcgaXRzIGRhdGEgY2FjaGUgYW5kIHByb2Nlc3NpbmcgdGhlIGNhbGwncyBvcHRpb25zLlxuXHQgICAgICAtIFF1ZXVlaW5nOiBUaGUgbG9naWMgdGhhdCBydW5zIG9uY2UgdGhlIGNhbGwgaGFzIHJlYWNoZWQgaXRzIHBvaW50IG9mIGV4ZWN1dGlvbiBpbiB0aGUgZWxlbWVudCdzICQucXVldWUoKSBzdGFjay5cblx0ICAgICAgICAgICAgICAgICAgTW9zdCBsb2dpYyBpcyBwbGFjZWQgaGVyZSB0byBhdm9pZCByaXNraW5nIGl0IGJlY29taW5nIHN0YWxlIChpZiB0aGUgZWxlbWVudCdzIHByb3BlcnRpZXMgaGF2ZSBjaGFuZ2VkKS5cblx0ICAgICAgLSBQdXNoaW5nOiBDb25zb2xpZGF0aW9uIG9mIHRoZSB0d2VlbiBkYXRhIGZvbGxvd2VkIGJ5IGl0cyBwdXNoIG9udG8gdGhlIGdsb2JhbCBpbi1wcm9ncmVzcyBjYWxscyBjb250YWluZXIuXG5cdCAgICAtIHRpY2soKTogVGhlIHNpbmdsZSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgbG9vcCByZXNwb25zaWJsZSBmb3IgdHdlZW5pbmcgYWxsIGluLXByb2dyZXNzIGNhbGxzLlxuXHQgICAgLSBjb21wbGV0ZUNhbGwoKTogSGFuZGxlcyB0aGUgY2xlYW51cCBwcm9jZXNzIGZvciBlYWNoIFZlbG9jaXR5IGNhbGwuXG5cdCAgICAqL1xuXG5cdCAgICAvKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICBIZWxwZXIgRnVuY3Rpb25zXG5cdCAgICAqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgIC8qIElFIGRldGVjdGlvbi4gR2lzdDogaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vanVsaWFuc2hhcGlyby85MDk4NjA5ICovXG5cdCAgICB2YXIgSUUgPSAoZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgaWYgKGRvY3VtZW50LmRvY3VtZW50TW9kZSkge1xuXHQgICAgICAgICAgICByZXR1cm4gZG9jdW1lbnQuZG9jdW1lbnRNb2RlO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIGZvciAodmFyIGkgPSA3OyBpID4gNDsgaS0tKSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuXHQgICAgICAgICAgICAgICAgZGl2LmlubmVySFRNTCA9IFwiPCEtLVtpZiBJRSBcIiArIGkgKyBcIl0+PHNwYW4+PC9zcGFuPjwhW2VuZGlmXS0tPlwiO1xuXG5cdCAgICAgICAgICAgICAgICBpZiAoZGl2LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic3BhblwiKS5sZW5ndGgpIHtcblx0ICAgICAgICAgICAgICAgICAgICBkaXYgPSBudWxsO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuXHQgICAgfSkoKTtcblxuXHQgICAgLyogckFGIHNoaW0uIEdpc3Q6IGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL2p1bGlhbnNoYXBpcm8vOTQ5NzUxMyAqL1xuXHQgICAgdmFyIHJBRlNoaW0gPSAoZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgdmFyIHRpbWVMYXN0ID0gMDtcblxuXHQgICAgICAgIHJldHVybiB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0ICAgICAgICAgICAgdmFyIHRpbWVDdXJyZW50ID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKSxcblx0ICAgICAgICAgICAgICAgIHRpbWVEZWx0YTtcblxuXHQgICAgICAgICAgICAvKiBEeW5hbWljYWxseSBzZXQgZGVsYXkgb24gYSBwZXItdGljayBiYXNpcyB0byBtYXRjaCA2MGZwcy4gKi9cblx0ICAgICAgICAgICAgLyogVGVjaG5pcXVlIGJ5IEVyaWsgTW9sbGVyLiBNSVQgbGljZW5zZTogaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vcGF1bGlyaXNoLzE1Nzk2NzEgKi9cblx0ICAgICAgICAgICAgdGltZURlbHRhID0gTWF0aC5tYXgoMCwgMTYgLSAodGltZUN1cnJlbnQgLSB0aW1lTGFzdCkpO1xuXHQgICAgICAgICAgICB0aW1lTGFzdCA9IHRpbWVDdXJyZW50ICsgdGltZURlbHRhO1xuXG5cdCAgICAgICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyBjYWxsYmFjayh0aW1lQ3VycmVudCArIHRpbWVEZWx0YSk7IH0sIHRpbWVEZWx0YSk7XG5cdCAgICAgICAgfTtcblx0ICAgIH0pKCk7XG5cblx0ICAgIC8qIEFycmF5IGNvbXBhY3RpbmcuIENvcHlyaWdodCBMby1EYXNoLiBNSVQgTGljZW5zZTogaHR0cHM6Ly9naXRodWIuY29tL2xvZGFzaC9sb2Rhc2gvYmxvYi9tYXN0ZXIvTElDRU5TRS50eHQgKi9cblx0ICAgIGZ1bmN0aW9uIGNvbXBhY3RTcGFyc2VBcnJheSAoYXJyYXkpIHtcblx0ICAgICAgICB2YXIgaW5kZXggPSAtMSxcblx0ICAgICAgICAgICAgbGVuZ3RoID0gYXJyYXkgPyBhcnJheS5sZW5ndGggOiAwLFxuXHQgICAgICAgICAgICByZXN1bHQgPSBbXTtcblxuXHQgICAgICAgIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG5cdCAgICAgICAgICAgIHZhciB2YWx1ZSA9IGFycmF5W2luZGV4XTtcblxuXHQgICAgICAgICAgICBpZiAodmFsdWUpIHtcblx0ICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHZhbHVlKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiByZXN1bHQ7XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIHNhbml0aXplRWxlbWVudHMgKGVsZW1lbnRzKSB7XG5cdCAgICAgICAgLyogVW53cmFwIGpRdWVyeS9aZXB0byBvYmplY3RzLiAqL1xuXHQgICAgICAgIGlmIChUeXBlLmlzV3JhcHBlZChlbGVtZW50cykpIHtcblx0ICAgICAgICAgICAgZWxlbWVudHMgPSBbXS5zbGljZS5jYWxsKGVsZW1lbnRzKTtcblx0ICAgICAgICAvKiBXcmFwIGEgc2luZ2xlIGVsZW1lbnQgaW4gYW4gYXJyYXkgc28gdGhhdCAkLmVhY2goKSBjYW4gaXRlcmF0ZSB3aXRoIHRoZSBlbGVtZW50IGluc3RlYWQgb2YgaXRzIG5vZGUncyBjaGlsZHJlbi4gKi9cblx0ICAgICAgICB9IGVsc2UgaWYgKFR5cGUuaXNOb2RlKGVsZW1lbnRzKSkge1xuXHQgICAgICAgICAgICBlbGVtZW50cyA9IFsgZWxlbWVudHMgXTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gZWxlbWVudHM7XG5cdCAgICB9XG5cblx0ICAgIHZhciBUeXBlID0ge1xuXHQgICAgICAgIGlzU3RyaW5nOiBmdW5jdGlvbiAodmFyaWFibGUpIHtcblx0ICAgICAgICAgICAgcmV0dXJuICh0eXBlb2YgdmFyaWFibGUgPT09IFwic3RyaW5nXCIpO1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgaXNBcnJheTogQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAodmFyaWFibGUpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YXJpYWJsZSkgPT09IFwiW29iamVjdCBBcnJheV1cIjtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIGlzRnVuY3Rpb246IGZ1bmN0aW9uICh2YXJpYWJsZSkge1xuXHQgICAgICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhcmlhYmxlKSA9PT0gXCJbb2JqZWN0IEZ1bmN0aW9uXVwiO1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgaXNOb2RlOiBmdW5jdGlvbiAodmFyaWFibGUpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHZhcmlhYmxlICYmIHZhcmlhYmxlLm5vZGVUeXBlO1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgLyogQ29weXJpZ2h0IE1hcnRpbiBCb2htLiBNSVQgTGljZW5zZTogaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vVG9tYWxhay84MThhNzhhMjI2YTA3MzhlYWFkZSAqL1xuXHQgICAgICAgIGlzTm9kZUxpc3Q6IGZ1bmN0aW9uICh2YXJpYWJsZSkge1xuXHQgICAgICAgICAgICByZXR1cm4gdHlwZW9mIHZhcmlhYmxlID09PSBcIm9iamVjdFwiICYmXG5cdCAgICAgICAgICAgICAgICAvXlxcW29iamVjdCAoSFRNTENvbGxlY3Rpb258Tm9kZUxpc3R8T2JqZWN0KVxcXSQvLnRlc3QoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhcmlhYmxlKSkgJiZcblx0ICAgICAgICAgICAgICAgIHZhcmlhYmxlLmxlbmd0aCAhPT0gdW5kZWZpbmVkICYmXG5cdCAgICAgICAgICAgICAgICAodmFyaWFibGUubGVuZ3RoID09PSAwIHx8ICh0eXBlb2YgdmFyaWFibGVbMF0gPT09IFwib2JqZWN0XCIgJiYgdmFyaWFibGVbMF0ubm9kZVR5cGUgPiAwKSk7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICAvKiBEZXRlcm1pbmUgaWYgdmFyaWFibGUgaXMgYSB3cmFwcGVkIGpRdWVyeSBvciBaZXB0byBlbGVtZW50LiAqL1xuXHQgICAgICAgIGlzV3JhcHBlZDogZnVuY3Rpb24gKHZhcmlhYmxlKSB7XG5cdCAgICAgICAgICAgIHJldHVybiB2YXJpYWJsZSAmJiAodmFyaWFibGUuanF1ZXJ5IHx8ICh3aW5kb3cuWmVwdG8gJiYgd2luZG93LlplcHRvLnplcHRvLmlzWih2YXJpYWJsZSkpKTtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIGlzU1ZHOiBmdW5jdGlvbiAodmFyaWFibGUpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5TVkdFbGVtZW50ICYmICh2YXJpYWJsZSBpbnN0YW5jZW9mIHdpbmRvdy5TVkdFbGVtZW50KTtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIGlzRW1wdHlPYmplY3Q6IGZ1bmN0aW9uICh2YXJpYWJsZSkge1xuXHQgICAgICAgICAgICBmb3IgKHZhciBuYW1lIGluIHZhcmlhYmxlKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcblx0ICAgICAgICB9XG5cdCAgICB9O1xuXG5cdCAgICAvKioqKioqKioqKioqKioqKipcblx0ICAgICAgIERlcGVuZGVuY2llc1xuXHQgICAgKioqKioqKioqKioqKioqKiovXG5cblx0ICAgIHZhciAkLFxuXHQgICAgICAgIGlzSlF1ZXJ5ID0gZmFsc2U7XG5cblx0ICAgIGlmIChnbG9iYWwuZm4gJiYgZ2xvYmFsLmZuLmpxdWVyeSkge1xuXHQgICAgICAgICQgPSBnbG9iYWw7XG5cdCAgICAgICAgaXNKUXVlcnkgPSB0cnVlO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgICAkID0gd2luZG93LlZlbG9jaXR5LlV0aWxpdGllcztcblx0ICAgIH1cblxuXHQgICAgaWYgKElFIDw9IDggJiYgIWlzSlF1ZXJ5KSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVmVsb2NpdHk6IElFOCBhbmQgYmVsb3cgcmVxdWlyZSBqUXVlcnkgdG8gYmUgbG9hZGVkIGJlZm9yZSBWZWxvY2l0eS5cIik7XG5cdCAgICB9IGVsc2UgaWYgKElFIDw9IDcpIHtcblx0ICAgICAgICAvKiBSZXZlcnQgdG8galF1ZXJ5J3MgJC5hbmltYXRlKCksIGFuZCBsb3NlIFZlbG9jaXR5J3MgZXh0cmEgZmVhdHVyZXMuICovXG5cdCAgICAgICAgalF1ZXJ5LmZuLnZlbG9jaXR5ID0galF1ZXJ5LmZuLmFuaW1hdGU7XG5cblx0ICAgICAgICAvKiBOb3cgdGhhdCAkLmZuLnZlbG9jaXR5IGlzIGFsaWFzZWQsIGFib3J0IHRoaXMgVmVsb2NpdHkgZGVjbGFyYXRpb24uICovXG5cdCAgICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXG5cdCAgICAvKioqKioqKioqKioqKioqKipcblx0ICAgICAgICBDb25zdGFudHNcblx0ICAgICoqKioqKioqKioqKioqKioqL1xuXG5cdCAgICB2YXIgRFVSQVRJT05fREVGQVVMVCA9IDQwMCxcblx0ICAgICAgICBFQVNJTkdfREVGQVVMVCA9IFwic3dpbmdcIjtcblxuXHQgICAgLyoqKioqKioqKioqKipcblx0ICAgICAgICBTdGF0ZVxuXHQgICAgKioqKioqKioqKioqKi9cblxuXHQgICAgdmFyIFZlbG9jaXR5ID0ge1xuXHQgICAgICAgIC8qIENvbnRhaW5lciBmb3IgcGFnZS13aWRlIFZlbG9jaXR5IHN0YXRlIGRhdGEuICovXG5cdCAgICAgICAgU3RhdGU6IHtcblx0ICAgICAgICAgICAgLyogRGV0ZWN0IG1vYmlsZSBkZXZpY2VzIHRvIGRldGVybWluZSBpZiBtb2JpbGVIQSBzaG91bGQgYmUgdHVybmVkIG9uLiAqL1xuXHQgICAgICAgICAgICBpc01vYmlsZTogL0FuZHJvaWR8d2ViT1N8aVBob25lfGlQYWR8aVBvZHxCbGFja0JlcnJ5fElFTW9iaWxlfE9wZXJhIE1pbmkvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpLFxuXHQgICAgICAgICAgICAvKiBUaGUgbW9iaWxlSEEgb3B0aW9uJ3MgYmVoYXZpb3IgY2hhbmdlcyBvbiBvbGRlciBBbmRyb2lkIGRldmljZXMgKEdpbmdlcmJyZWFkLCB2ZXJzaW9ucyAyLjMuMy0yLjMuNykuICovXG5cdCAgICAgICAgICAgIGlzQW5kcm9pZDogL0FuZHJvaWQvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpLFxuXHQgICAgICAgICAgICBpc0dpbmdlcmJyZWFkOiAvQW5kcm9pZCAyXFwuM1xcLlszLTddL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSxcblx0ICAgICAgICAgICAgaXNDaHJvbWU6IHdpbmRvdy5jaHJvbWUsXG5cdCAgICAgICAgICAgIGlzRmlyZWZveDogL0ZpcmVmb3gvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpLFxuXHQgICAgICAgICAgICAvKiBDcmVhdGUgYSBjYWNoZWQgZWxlbWVudCBmb3IgcmUtdXNlIHdoZW4gY2hlY2tpbmcgZm9yIENTUyBwcm9wZXJ0eSBwcmVmaXhlcy4gKi9cblx0ICAgICAgICAgICAgcHJlZml4RWxlbWVudDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKSxcblx0ICAgICAgICAgICAgLyogQ2FjaGUgZXZlcnkgcHJlZml4IG1hdGNoIHRvIGF2b2lkIHJlcGVhdGluZyBsb29rdXBzLiAqL1xuXHQgICAgICAgICAgICBwcmVmaXhNYXRjaGVzOiB7fSxcblx0ICAgICAgICAgICAgLyogQ2FjaGUgdGhlIGFuY2hvciB1c2VkIGZvciBhbmltYXRpbmcgd2luZG93IHNjcm9sbGluZy4gKi9cblx0ICAgICAgICAgICAgc2Nyb2xsQW5jaG9yOiBudWxsLFxuXHQgICAgICAgICAgICAvKiBDYWNoZSB0aGUgYnJvd3Nlci1zcGVjaWZpYyBwcm9wZXJ0eSBuYW1lcyBhc3NvY2lhdGVkIHdpdGggdGhlIHNjcm9sbCBhbmNob3IuICovXG5cdCAgICAgICAgICAgIHNjcm9sbFByb3BlcnR5TGVmdDogbnVsbCxcblx0ICAgICAgICAgICAgc2Nyb2xsUHJvcGVydHlUb3A6IG51bGwsXG5cdCAgICAgICAgICAgIC8qIEtlZXAgdHJhY2sgb2Ygd2hldGhlciBvdXIgUkFGIHRpY2sgaXMgcnVubmluZy4gKi9cblx0ICAgICAgICAgICAgaXNUaWNraW5nOiBmYWxzZSxcblx0ICAgICAgICAgICAgLyogQ29udGFpbmVyIGZvciBldmVyeSBpbi1wcm9ncmVzcyBjYWxsIHRvIFZlbG9jaXR5LiAqL1xuXHQgICAgICAgICAgICBjYWxsczogW11cblx0ICAgICAgICB9LFxuXHQgICAgICAgIC8qIFZlbG9jaXR5J3MgY3VzdG9tIENTUyBzdGFjay4gTWFkZSBnbG9iYWwgZm9yIHVuaXQgdGVzdGluZy4gKi9cblx0ICAgICAgICBDU1M6IHsgLyogRGVmaW5lZCBiZWxvdy4gKi8gfSxcblx0ICAgICAgICAvKiBBIHNoaW0gb2YgdGhlIGpRdWVyeSB1dGlsaXR5IGZ1bmN0aW9ucyB1c2VkIGJ5IFZlbG9jaXR5IC0tIHByb3ZpZGVkIGJ5IFZlbG9jaXR5J3Mgb3B0aW9uYWwgalF1ZXJ5IHNoaW0uICovXG5cdCAgICAgICAgVXRpbGl0aWVzOiAkLFxuXHQgICAgICAgIC8qIENvbnRhaW5lciBmb3IgdGhlIHVzZXIncyBjdXN0b20gYW5pbWF0aW9uIHJlZGlyZWN0cyB0aGF0IGFyZSByZWZlcmVuY2VkIGJ5IG5hbWUgaW4gcGxhY2Ugb2YgdGhlIHByb3BlcnRpZXMgbWFwIGFyZ3VtZW50LiAqL1xuXHQgICAgICAgIFJlZGlyZWN0czogeyAvKiBNYW51YWxseSByZWdpc3RlcmVkIGJ5IHRoZSB1c2VyLiAqLyB9LFxuXHQgICAgICAgIEVhc2luZ3M6IHsgLyogRGVmaW5lZCBiZWxvdy4gKi8gfSxcblx0ICAgICAgICAvKiBBdHRlbXB0IHRvIHVzZSBFUzYgUHJvbWlzZXMgYnkgZGVmYXVsdC4gVXNlcnMgY2FuIG92ZXJyaWRlIHRoaXMgd2l0aCBhIHRoaXJkLXBhcnR5IHByb21pc2VzIGxpYnJhcnkuICovXG5cdCAgICAgICAgUHJvbWlzZTogd2luZG93LlByb21pc2UsXG5cdCAgICAgICAgLyogVmVsb2NpdHkgb3B0aW9uIGRlZmF1bHRzLCB3aGljaCBjYW4gYmUgb3ZlcnJpZGVuIGJ5IHRoZSB1c2VyLiAqL1xuXHQgICAgICAgIGRlZmF1bHRzOiB7XG5cdCAgICAgICAgICAgIHF1ZXVlOiBcIlwiLFxuXHQgICAgICAgICAgICBkdXJhdGlvbjogRFVSQVRJT05fREVGQVVMVCxcblx0ICAgICAgICAgICAgZWFzaW5nOiBFQVNJTkdfREVGQVVMVCxcblx0ICAgICAgICAgICAgYmVnaW46IHVuZGVmaW5lZCxcblx0ICAgICAgICAgICAgY29tcGxldGU6IHVuZGVmaW5lZCxcblx0ICAgICAgICAgICAgcHJvZ3Jlc3M6IHVuZGVmaW5lZCxcblx0ICAgICAgICAgICAgZGlzcGxheTogdW5kZWZpbmVkLFxuXHQgICAgICAgICAgICB2aXNpYmlsaXR5OiB1bmRlZmluZWQsXG5cdCAgICAgICAgICAgIGxvb3A6IGZhbHNlLFxuXHQgICAgICAgICAgICBkZWxheTogZmFsc2UsXG5cdCAgICAgICAgICAgIG1vYmlsZUhBOiB0cnVlLFxuXHQgICAgICAgICAgICAvKiBBZHZhbmNlZDogU2V0IHRvIGZhbHNlIHRvIHByZXZlbnQgcHJvcGVydHkgdmFsdWVzIGZyb20gYmVpbmcgY2FjaGVkIGJldHdlZW4gY29uc2VjdXRpdmUgVmVsb2NpdHktaW5pdGlhdGVkIGNoYWluIGNhbGxzLiAqL1xuXHQgICAgICAgICAgICBfY2FjaGVWYWx1ZXM6IHRydWVcblx0ICAgICAgICB9LFxuXHQgICAgICAgIC8qIEEgZGVzaWduIGdvYWwgb2YgVmVsb2NpdHkgaXMgdG8gY2FjaGUgZGF0YSB3aGVyZXZlciBwb3NzaWJsZSBpbiBvcmRlciB0byBhdm9pZCBET00gcmVxdWVyeWluZy4gQWNjb3JkaW5nbHksIGVhY2ggZWxlbWVudCBoYXMgYSBkYXRhIGNhY2hlLiAqL1xuXHQgICAgICAgIGluaXQ6IGZ1bmN0aW9uIChlbGVtZW50KSB7XG5cdCAgICAgICAgICAgICQuZGF0YShlbGVtZW50LCBcInZlbG9jaXR5XCIsIHtcblx0ICAgICAgICAgICAgICAgIC8qIFN0b3JlIHdoZXRoZXIgdGhpcyBpcyBhbiBTVkcgZWxlbWVudCwgc2luY2UgaXRzIHByb3BlcnRpZXMgYXJlIHJldHJpZXZlZCBhbmQgdXBkYXRlZCBkaWZmZXJlbnRseSB0aGFuIHN0YW5kYXJkIEhUTUwgZWxlbWVudHMuICovXG5cdCAgICAgICAgICAgICAgICBpc1NWRzogVHlwZS5pc1NWRyhlbGVtZW50KSxcblx0ICAgICAgICAgICAgICAgIC8qIEtlZXAgdHJhY2sgb2Ygd2hldGhlciB0aGUgZWxlbWVudCBpcyBjdXJyZW50bHkgYmVpbmcgYW5pbWF0ZWQgYnkgVmVsb2NpdHkuXG5cdCAgICAgICAgICAgICAgICAgICBUaGlzIGlzIHVzZWQgdG8gZW5zdXJlIHRoYXQgcHJvcGVydHkgdmFsdWVzIGFyZSBub3QgdHJhbnNmZXJyZWQgYmV0d2VlbiBub24tY29uc2VjdXRpdmUgKHN0YWxlKSBjYWxscy4gKi9cblx0ICAgICAgICAgICAgICAgIGlzQW5pbWF0aW5nOiBmYWxzZSxcblx0ICAgICAgICAgICAgICAgIC8qIEEgcmVmZXJlbmNlIHRvIHRoZSBlbGVtZW50J3MgbGl2ZSBjb21wdXRlZFN0eWxlIG9iamVjdC4gTGVhcm4gbW9yZSBoZXJlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9kb2NzL1dlYi9BUEkvd2luZG93LmdldENvbXB1dGVkU3R5bGUgKi9cblx0ICAgICAgICAgICAgICAgIGNvbXB1dGVkU3R5bGU6IG51bGwsXG5cdCAgICAgICAgICAgICAgICAvKiBUd2VlbiBkYXRhIGlzIGNhY2hlZCBmb3IgZWFjaCBhbmltYXRpb24gb24gdGhlIGVsZW1lbnQgc28gdGhhdCBkYXRhIGNhbiBiZSBwYXNzZWQgYWNyb3NzIGNhbGxzIC0tXG5cdCAgICAgICAgICAgICAgICAgICBpbiBwYXJ0aWN1bGFyLCBlbmQgdmFsdWVzIGFyZSB1c2VkIGFzIHN1YnNlcXVlbnQgc3RhcnQgdmFsdWVzIGluIGNvbnNlY3V0aXZlIFZlbG9jaXR5IGNhbGxzLiAqL1xuXHQgICAgICAgICAgICAgICAgdHdlZW5zQ29udGFpbmVyOiBudWxsLFxuXHQgICAgICAgICAgICAgICAgLyogVGhlIGZ1bGwgcm9vdCBwcm9wZXJ0eSB2YWx1ZXMgb2YgZWFjaCBDU1MgaG9vayBiZWluZyBhbmltYXRlZCBvbiB0aGlzIGVsZW1lbnQgYXJlIGNhY2hlZCBzbyB0aGF0OlxuXHQgICAgICAgICAgICAgICAgICAgMSkgQ29uY3VycmVudGx5LWFuaW1hdGluZyBob29rcyBzaGFyaW5nIHRoZSBzYW1lIHJvb3QgY2FuIGhhdmUgdGhlaXIgcm9vdCB2YWx1ZXMnIG1lcmdlZCBpbnRvIG9uZSB3aGlsZSB0d2VlbmluZy5cblx0ICAgICAgICAgICAgICAgICAgIDIpIFBvc3QtaG9vay1pbmplY3Rpb24gcm9vdCB2YWx1ZXMgY2FuIGJlIHRyYW5zZmVycmVkIG92ZXIgdG8gY29uc2VjdXRpdmVseSBjaGFpbmVkIFZlbG9jaXR5IGNhbGxzIGFzIHN0YXJ0aW5nIHJvb3QgdmFsdWVzLiAqL1xuXHQgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWVDYWNoZToge30sXG5cdCAgICAgICAgICAgICAgICAvKiBBIGNhY2hlIGZvciB0cmFuc2Zvcm0gdXBkYXRlcywgd2hpY2ggbXVzdCBiZSBtYW51YWxseSBmbHVzaGVkIHZpYSBDU1MuZmx1c2hUcmFuc2Zvcm1DYWNoZSgpLiAqL1xuXHQgICAgICAgICAgICAgICAgdHJhbnNmb3JtQ2FjaGU6IHt9XG5cdCAgICAgICAgICAgIH0pO1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgLyogQSBwYXJhbGxlbCB0byBqUXVlcnkncyAkLmNzcygpLCB1c2VkIGZvciBnZXR0aW5nL3NldHRpbmcgVmVsb2NpdHkncyBob29rZWQgQ1NTIHByb3BlcnRpZXMuICovXG5cdCAgICAgICAgaG9vazogbnVsbCwgLyogRGVmaW5lZCBiZWxvdy4gKi9cblx0ICAgICAgICAvKiBWZWxvY2l0eS13aWRlIGFuaW1hdGlvbiB0aW1lIHJlbWFwcGluZyBmb3IgdGVzdGluZyBwdXJwb3Nlcy4gKi9cblx0ICAgICAgICBtb2NrOiBmYWxzZSxcblx0ICAgICAgICB2ZXJzaW9uOiB7IG1ham9yOiAxLCBtaW5vcjogMiwgcGF0Y2g6IDIgfSxcblx0ICAgICAgICAvKiBTZXQgdG8gMSBvciAyIChtb3N0IHZlcmJvc2UpIHRvIG91dHB1dCBkZWJ1ZyBpbmZvIHRvIGNvbnNvbGUuICovXG5cdCAgICAgICAgZGVidWc6IGZhbHNlXG5cdCAgICB9O1xuXG5cdCAgICAvKiBSZXRyaWV2ZSB0aGUgYXBwcm9wcmlhdGUgc2Nyb2xsIGFuY2hvciBhbmQgcHJvcGVydHkgbmFtZSBmb3IgdGhlIGJyb3dzZXI6IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9XaW5kb3cuc2Nyb2xsWSAqL1xuXHQgICAgaWYgKHdpbmRvdy5wYWdlWU9mZnNldCAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgVmVsb2NpdHkuU3RhdGUuc2Nyb2xsQW5jaG9yID0gd2luZG93O1xuXHQgICAgICAgIFZlbG9jaXR5LlN0YXRlLnNjcm9sbFByb3BlcnR5TGVmdCA9IFwicGFnZVhPZmZzZXRcIjtcblx0ICAgICAgICBWZWxvY2l0eS5TdGF0ZS5zY3JvbGxQcm9wZXJ0eVRvcCA9IFwicGFnZVlPZmZzZXRcIjtcblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgICAgVmVsb2NpdHkuU3RhdGUuc2Nyb2xsQW5jaG9yID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IHx8IGRvY3VtZW50LmJvZHkucGFyZW50Tm9kZSB8fCBkb2N1bWVudC5ib2R5O1xuXHQgICAgICAgIFZlbG9jaXR5LlN0YXRlLnNjcm9sbFByb3BlcnR5TGVmdCA9IFwic2Nyb2xsTGVmdFwiO1xuXHQgICAgICAgIFZlbG9jaXR5LlN0YXRlLnNjcm9sbFByb3BlcnR5VG9wID0gXCJzY3JvbGxUb3BcIjtcblx0ICAgIH1cblxuXHQgICAgLyogU2hvcnRoYW5kIGFsaWFzIGZvciBqUXVlcnkncyAkLmRhdGEoKSB1dGlsaXR5LiAqL1xuXHQgICAgZnVuY3Rpb24gRGF0YSAoZWxlbWVudCkge1xuXHQgICAgICAgIC8qIEhhcmRjb2RlIGEgcmVmZXJlbmNlIHRvIHRoZSBwbHVnaW4gbmFtZS4gKi9cblx0ICAgICAgICB2YXIgcmVzcG9uc2UgPSAkLmRhdGEoZWxlbWVudCwgXCJ2ZWxvY2l0eVwiKTtcblxuXHQgICAgICAgIC8qIGpRdWVyeSA8PTEuNC4yIHJldHVybnMgbnVsbCBpbnN0ZWFkIG9mIHVuZGVmaW5lZCB3aGVuIG5vIG1hdGNoIGlzIGZvdW5kLiBXZSBub3JtYWxpemUgdGhpcyBiZWhhdmlvci4gKi9cblx0ICAgICAgICByZXR1cm4gcmVzcG9uc2UgPT09IG51bGwgPyB1bmRlZmluZWQgOiByZXNwb25zZTtcblx0ICAgIH07XG5cblx0ICAgIC8qKioqKioqKioqKioqKlxuXHQgICAgICAgIEVhc2luZ1xuXHQgICAgKioqKioqKioqKioqKiovXG5cblx0ICAgIC8qIFN0ZXAgZWFzaW5nIGdlbmVyYXRvci4gKi9cblx0ICAgIGZ1bmN0aW9uIGdlbmVyYXRlU3RlcCAoc3RlcHMpIHtcblx0ICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0ICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQocCAqIHN0ZXBzKSAqICgxIC8gc3RlcHMpO1xuXHQgICAgICAgIH07XG5cdCAgICB9XG5cblx0ICAgIC8qIEJlemllciBjdXJ2ZSBmdW5jdGlvbiBnZW5lcmF0b3IuIENvcHlyaWdodCBHYWV0YW4gUmVuYXVkZWF1LiBNSVQgTGljZW5zZTogaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9NSVRfTGljZW5zZSAqL1xuXHQgICAgZnVuY3Rpb24gZ2VuZXJhdGVCZXppZXIgKG1YMSwgbVkxLCBtWDIsIG1ZMikge1xuXHQgICAgICAgIHZhciBORVdUT05fSVRFUkFUSU9OUyA9IDQsXG5cdCAgICAgICAgICAgIE5FV1RPTl9NSU5fU0xPUEUgPSAwLjAwMSxcblx0ICAgICAgICAgICAgU1VCRElWSVNJT05fUFJFQ0lTSU9OID0gMC4wMDAwMDAxLFxuXHQgICAgICAgICAgICBTVUJESVZJU0lPTl9NQVhfSVRFUkFUSU9OUyA9IDEwLFxuXHQgICAgICAgICAgICBrU3BsaW5lVGFibGVTaXplID0gMTEsXG5cdCAgICAgICAgICAgIGtTYW1wbGVTdGVwU2l6ZSA9IDEuMCAvIChrU3BsaW5lVGFibGVTaXplIC0gMS4wKSxcblx0ICAgICAgICAgICAgZmxvYXQzMkFycmF5U3VwcG9ydGVkID0gXCJGbG9hdDMyQXJyYXlcIiBpbiB3aW5kb3c7XG5cblx0ICAgICAgICAvKiBNdXN0IGNvbnRhaW4gZm91ciBhcmd1bWVudHMuICovXG5cdCAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggIT09IDQpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8qIEFyZ3VtZW50cyBtdXN0IGJlIG51bWJlcnMuICovXG5cdCAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyArK2kpIHtcblx0ICAgICAgICAgICAgaWYgKHR5cGVvZiBhcmd1bWVudHNbaV0gIT09IFwibnVtYmVyXCIgfHwgaXNOYU4oYXJndW1lbnRzW2ldKSB8fCAhaXNGaW5pdGUoYXJndW1lbnRzW2ldKSkge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLyogWCB2YWx1ZXMgbXVzdCBiZSBpbiB0aGUgWzAsIDFdIHJhbmdlLiAqL1xuXHQgICAgICAgIG1YMSA9IE1hdGgubWluKG1YMSwgMSk7XG5cdCAgICAgICAgbVgyID0gTWF0aC5taW4obVgyLCAxKTtcblx0ICAgICAgICBtWDEgPSBNYXRoLm1heChtWDEsIDApO1xuXHQgICAgICAgIG1YMiA9IE1hdGgubWF4KG1YMiwgMCk7XG5cblx0ICAgICAgICB2YXIgbVNhbXBsZVZhbHVlcyA9IGZsb2F0MzJBcnJheVN1cHBvcnRlZCA/IG5ldyBGbG9hdDMyQXJyYXkoa1NwbGluZVRhYmxlU2l6ZSkgOiBuZXcgQXJyYXkoa1NwbGluZVRhYmxlU2l6ZSk7XG5cblx0ICAgICAgICBmdW5jdGlvbiBBIChhQTEsIGFBMikgeyByZXR1cm4gMS4wIC0gMy4wICogYUEyICsgMy4wICogYUExOyB9XG5cdCAgICAgICAgZnVuY3Rpb24gQiAoYUExLCBhQTIpIHsgcmV0dXJuIDMuMCAqIGFBMiAtIDYuMCAqIGFBMTsgfVxuXHQgICAgICAgIGZ1bmN0aW9uIEMgKGFBMSkgICAgICB7IHJldHVybiAzLjAgKiBhQTE7IH1cblxuXHQgICAgICAgIGZ1bmN0aW9uIGNhbGNCZXppZXIgKGFULCBhQTEsIGFBMikge1xuXHQgICAgICAgICAgICByZXR1cm4gKChBKGFBMSwgYUEyKSphVCArIEIoYUExLCBhQTIpKSphVCArIEMoYUExKSkqYVQ7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgZnVuY3Rpb24gZ2V0U2xvcGUgKGFULCBhQTEsIGFBMikge1xuXHQgICAgICAgICAgICByZXR1cm4gMy4wICogQShhQTEsIGFBMikqYVQqYVQgKyAyLjAgKiBCKGFBMSwgYUEyKSAqIGFUICsgQyhhQTEpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGZ1bmN0aW9uIG5ld3RvblJhcGhzb25JdGVyYXRlIChhWCwgYUd1ZXNzVCkge1xuXHQgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IE5FV1RPTl9JVEVSQVRJT05TOyArK2kpIHtcblx0ICAgICAgICAgICAgICAgIHZhciBjdXJyZW50U2xvcGUgPSBnZXRTbG9wZShhR3Vlc3NULCBtWDEsIG1YMik7XG5cblx0ICAgICAgICAgICAgICAgIGlmIChjdXJyZW50U2xvcGUgPT09IDAuMCkgcmV0dXJuIGFHdWVzc1Q7XG5cblx0ICAgICAgICAgICAgICAgIHZhciBjdXJyZW50WCA9IGNhbGNCZXppZXIoYUd1ZXNzVCwgbVgxLCBtWDIpIC0gYVg7XG5cdCAgICAgICAgICAgICAgICBhR3Vlc3NUIC09IGN1cnJlbnRYIC8gY3VycmVudFNsb3BlO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgcmV0dXJuIGFHdWVzc1Q7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgZnVuY3Rpb24gY2FsY1NhbXBsZVZhbHVlcyAoKSB7XG5cdCAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga1NwbGluZVRhYmxlU2l6ZTsgKytpKSB7XG5cdCAgICAgICAgICAgICAgICBtU2FtcGxlVmFsdWVzW2ldID0gY2FsY0JlemllcihpICoga1NhbXBsZVN0ZXBTaXplLCBtWDEsIG1YMik7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICBmdW5jdGlvbiBiaW5hcnlTdWJkaXZpZGUgKGFYLCBhQSwgYUIpIHtcblx0ICAgICAgICAgICAgdmFyIGN1cnJlbnRYLCBjdXJyZW50VCwgaSA9IDA7XG5cblx0ICAgICAgICAgICAgZG8ge1xuXHQgICAgICAgICAgICAgICAgY3VycmVudFQgPSBhQSArIChhQiAtIGFBKSAvIDIuMDtcblx0ICAgICAgICAgICAgICAgIGN1cnJlbnRYID0gY2FsY0JlemllcihjdXJyZW50VCwgbVgxLCBtWDIpIC0gYVg7XG5cdCAgICAgICAgICAgICAgICBpZiAoY3VycmVudFggPiAwLjApIHtcblx0ICAgICAgICAgICAgICAgICAgYUIgPSBjdXJyZW50VDtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgIGFBID0gY3VycmVudFQ7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH0gd2hpbGUgKE1hdGguYWJzKGN1cnJlbnRYKSA+IFNVQkRJVklTSU9OX1BSRUNJU0lPTiAmJiArK2kgPCBTVUJESVZJU0lPTl9NQVhfSVRFUkFUSU9OUyk7XG5cblx0ICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRUO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGZ1bmN0aW9uIGdldFRGb3JYIChhWCkge1xuXHQgICAgICAgICAgICB2YXIgaW50ZXJ2YWxTdGFydCA9IDAuMCxcblx0ICAgICAgICAgICAgICAgIGN1cnJlbnRTYW1wbGUgPSAxLFxuXHQgICAgICAgICAgICAgICAgbGFzdFNhbXBsZSA9IGtTcGxpbmVUYWJsZVNpemUgLSAxO1xuXG5cdCAgICAgICAgICAgIGZvciAoOyBjdXJyZW50U2FtcGxlICE9IGxhc3RTYW1wbGUgJiYgbVNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSA8PSBhWDsgKytjdXJyZW50U2FtcGxlKSB7XG5cdCAgICAgICAgICAgICAgICBpbnRlcnZhbFN0YXJ0ICs9IGtTYW1wbGVTdGVwU2l6ZTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC0tY3VycmVudFNhbXBsZTtcblxuXHQgICAgICAgICAgICB2YXIgZGlzdCA9IChhWCAtIG1TYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZV0pIC8gKG1TYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZSsxXSAtIG1TYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZV0pLFxuXHQgICAgICAgICAgICAgICAgZ3Vlc3NGb3JUID0gaW50ZXJ2YWxTdGFydCArIGRpc3QgKiBrU2FtcGxlU3RlcFNpemUsXG5cdCAgICAgICAgICAgICAgICBpbml0aWFsU2xvcGUgPSBnZXRTbG9wZShndWVzc0ZvclQsIG1YMSwgbVgyKTtcblxuXHQgICAgICAgICAgICBpZiAoaW5pdGlhbFNsb3BlID49IE5FV1RPTl9NSU5fU0xPUEUpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBuZXd0b25SYXBoc29uSXRlcmF0ZShhWCwgZ3Vlc3NGb3JUKTtcblx0ICAgICAgICAgICAgfSBlbHNlIGlmIChpbml0aWFsU2xvcGUgPT0gMC4wKSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gZ3Vlc3NGb3JUO1xuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgcmV0dXJuIGJpbmFyeVN1YmRpdmlkZShhWCwgaW50ZXJ2YWxTdGFydCwgaW50ZXJ2YWxTdGFydCArIGtTYW1wbGVTdGVwU2l6ZSk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICB2YXIgX3ByZWNvbXB1dGVkID0gZmFsc2U7XG5cblx0ICAgICAgICBmdW5jdGlvbiBwcmVjb21wdXRlKCkge1xuXHQgICAgICAgICAgICBfcHJlY29tcHV0ZWQgPSB0cnVlO1xuXHQgICAgICAgICAgICBpZiAobVgxICE9IG1ZMSB8fCBtWDIgIT0gbVkyKSBjYWxjU2FtcGxlVmFsdWVzKCk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgdmFyIGYgPSBmdW5jdGlvbiAoYVgpIHtcblx0ICAgICAgICAgICAgaWYgKCFfcHJlY29tcHV0ZWQpIHByZWNvbXB1dGUoKTtcblx0ICAgICAgICAgICAgaWYgKG1YMSA9PT0gbVkxICYmIG1YMiA9PT0gbVkyKSByZXR1cm4gYVg7XG5cdCAgICAgICAgICAgIGlmIChhWCA9PT0gMCkgcmV0dXJuIDA7XG5cdCAgICAgICAgICAgIGlmIChhWCA9PT0gMSkgcmV0dXJuIDE7XG5cblx0ICAgICAgICAgICAgcmV0dXJuIGNhbGNCZXppZXIoZ2V0VEZvclgoYVgpLCBtWTEsIG1ZMik7XG5cdCAgICAgICAgfTtcblxuXHQgICAgICAgIGYuZ2V0Q29udHJvbFBvaW50cyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gW3sgeDogbVgxLCB5OiBtWTEgfSwgeyB4OiBtWDIsIHk6IG1ZMiB9XTsgfTtcblxuXHQgICAgICAgIHZhciBzdHIgPSBcImdlbmVyYXRlQmV6aWVyKFwiICsgW21YMSwgbVkxLCBtWDIsIG1ZMl0gKyBcIilcIjtcblx0ICAgICAgICBmLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gc3RyOyB9O1xuXG5cdCAgICAgICAgcmV0dXJuIGY7XG5cdCAgICB9XG5cblx0ICAgIC8qIFJ1bmdlLUt1dHRhIHNwcmluZyBwaHlzaWNzIGZ1bmN0aW9uIGdlbmVyYXRvci4gQWRhcHRlZCBmcm9tIEZyYW1lci5qcywgY29weXJpZ2h0IEtvZW4gQm9rLiBNSVQgTGljZW5zZTogaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9NSVRfTGljZW5zZSAqL1xuXHQgICAgLyogR2l2ZW4gYSB0ZW5zaW9uLCBmcmljdGlvbiwgYW5kIGR1cmF0aW9uLCBhIHNpbXVsYXRpb24gYXQgNjBGUFMgd2lsbCBmaXJzdCBydW4gd2l0aG91dCBhIGRlZmluZWQgZHVyYXRpb24gaW4gb3JkZXIgdG8gY2FsY3VsYXRlIHRoZSBmdWxsIHBhdGguIEEgc2Vjb25kIHBhc3Ncblx0ICAgICAgIHRoZW4gYWRqdXN0cyB0aGUgdGltZSBkZWx0YSAtLSB1c2luZyB0aGUgcmVsYXRpb24gYmV0d2VlbiBhY3R1YWwgdGltZSBhbmQgZHVyYXRpb24gLS0gdG8gY2FsY3VsYXRlIHRoZSBwYXRoIGZvciB0aGUgZHVyYXRpb24tY29uc3RyYWluZWQgYW5pbWF0aW9uLiAqL1xuXHQgICAgdmFyIGdlbmVyYXRlU3ByaW5nUks0ID0gKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICBmdW5jdGlvbiBzcHJpbmdBY2NlbGVyYXRpb25Gb3JTdGF0ZSAoc3RhdGUpIHtcblx0ICAgICAgICAgICAgcmV0dXJuICgtc3RhdGUudGVuc2lvbiAqIHN0YXRlLngpIC0gKHN0YXRlLmZyaWN0aW9uICogc3RhdGUudik7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgZnVuY3Rpb24gc3ByaW5nRXZhbHVhdGVTdGF0ZVdpdGhEZXJpdmF0aXZlIChpbml0aWFsU3RhdGUsIGR0LCBkZXJpdmF0aXZlKSB7XG5cdCAgICAgICAgICAgIHZhciBzdGF0ZSA9IHtcblx0ICAgICAgICAgICAgICAgIHg6IGluaXRpYWxTdGF0ZS54ICsgZGVyaXZhdGl2ZS5keCAqIGR0LFxuXHQgICAgICAgICAgICAgICAgdjogaW5pdGlhbFN0YXRlLnYgKyBkZXJpdmF0aXZlLmR2ICogZHQsXG5cdCAgICAgICAgICAgICAgICB0ZW5zaW9uOiBpbml0aWFsU3RhdGUudGVuc2lvbixcblx0ICAgICAgICAgICAgICAgIGZyaWN0aW9uOiBpbml0aWFsU3RhdGUuZnJpY3Rpb25cblx0ICAgICAgICAgICAgfTtcblxuXHQgICAgICAgICAgICByZXR1cm4geyBkeDogc3RhdGUudiwgZHY6IHNwcmluZ0FjY2VsZXJhdGlvbkZvclN0YXRlKHN0YXRlKSB9O1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGZ1bmN0aW9uIHNwcmluZ0ludGVncmF0ZVN0YXRlIChzdGF0ZSwgZHQpIHtcblx0ICAgICAgICAgICAgdmFyIGEgPSB7XG5cdCAgICAgICAgICAgICAgICAgICAgZHg6IHN0YXRlLnYsXG5cdCAgICAgICAgICAgICAgICAgICAgZHY6IHNwcmluZ0FjY2VsZXJhdGlvbkZvclN0YXRlKHN0YXRlKVxuXHQgICAgICAgICAgICAgICAgfSxcblx0ICAgICAgICAgICAgICAgIGIgPSBzcHJpbmdFdmFsdWF0ZVN0YXRlV2l0aERlcml2YXRpdmUoc3RhdGUsIGR0ICogMC41LCBhKSxcblx0ICAgICAgICAgICAgICAgIGMgPSBzcHJpbmdFdmFsdWF0ZVN0YXRlV2l0aERlcml2YXRpdmUoc3RhdGUsIGR0ICogMC41LCBiKSxcblx0ICAgICAgICAgICAgICAgIGQgPSBzcHJpbmdFdmFsdWF0ZVN0YXRlV2l0aERlcml2YXRpdmUoc3RhdGUsIGR0LCBjKSxcblx0ICAgICAgICAgICAgICAgIGR4ZHQgPSAxLjAgLyA2LjAgKiAoYS5keCArIDIuMCAqIChiLmR4ICsgYy5keCkgKyBkLmR4KSxcblx0ICAgICAgICAgICAgICAgIGR2ZHQgPSAxLjAgLyA2LjAgKiAoYS5kdiArIDIuMCAqIChiLmR2ICsgYy5kdikgKyBkLmR2KTtcblxuXHQgICAgICAgICAgICBzdGF0ZS54ID0gc3RhdGUueCArIGR4ZHQgKiBkdDtcblx0ICAgICAgICAgICAgc3RhdGUudiA9IHN0YXRlLnYgKyBkdmR0ICogZHQ7XG5cblx0ICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiBmdW5jdGlvbiBzcHJpbmdSSzRGYWN0b3J5ICh0ZW5zaW9uLCBmcmljdGlvbiwgZHVyYXRpb24pIHtcblxuXHQgICAgICAgICAgICB2YXIgaW5pdFN0YXRlID0ge1xuXHQgICAgICAgICAgICAgICAgICAgIHg6IC0xLFxuXHQgICAgICAgICAgICAgICAgICAgIHY6IDAsXG5cdCAgICAgICAgICAgICAgICAgICAgdGVuc2lvbjogbnVsbCxcblx0ICAgICAgICAgICAgICAgICAgICBmcmljdGlvbjogbnVsbFxuXHQgICAgICAgICAgICAgICAgfSxcblx0ICAgICAgICAgICAgICAgIHBhdGggPSBbMF0sXG5cdCAgICAgICAgICAgICAgICB0aW1lX2xhcHNlZCA9IDAsXG5cdCAgICAgICAgICAgICAgICB0b2xlcmFuY2UgPSAxIC8gMTAwMDAsXG5cdCAgICAgICAgICAgICAgICBEVCA9IDE2IC8gMTAwMCxcblx0ICAgICAgICAgICAgICAgIGhhdmVfZHVyYXRpb24sIGR0LCBsYXN0X3N0YXRlO1xuXG5cdCAgICAgICAgICAgIHRlbnNpb24gPSBwYXJzZUZsb2F0KHRlbnNpb24pIHx8IDUwMDtcblx0ICAgICAgICAgICAgZnJpY3Rpb24gPSBwYXJzZUZsb2F0KGZyaWN0aW9uKSB8fCAyMDtcblx0ICAgICAgICAgICAgZHVyYXRpb24gPSBkdXJhdGlvbiB8fCBudWxsO1xuXG5cdCAgICAgICAgICAgIGluaXRTdGF0ZS50ZW5zaW9uID0gdGVuc2lvbjtcblx0ICAgICAgICAgICAgaW5pdFN0YXRlLmZyaWN0aW9uID0gZnJpY3Rpb247XG5cblx0ICAgICAgICAgICAgaGF2ZV9kdXJhdGlvbiA9IGR1cmF0aW9uICE9PSBudWxsO1xuXG5cdCAgICAgICAgICAgIC8qIENhbGN1bGF0ZSB0aGUgYWN0dWFsIHRpbWUgaXQgdGFrZXMgZm9yIHRoaXMgYW5pbWF0aW9uIHRvIGNvbXBsZXRlIHdpdGggdGhlIHByb3ZpZGVkIGNvbmRpdGlvbnMuICovXG5cdCAgICAgICAgICAgIGlmIChoYXZlX2R1cmF0aW9uKSB7XG5cdCAgICAgICAgICAgICAgICAvKiBSdW4gdGhlIHNpbXVsYXRpb24gd2l0aG91dCBhIGR1cmF0aW9uLiAqL1xuXHQgICAgICAgICAgICAgICAgdGltZV9sYXBzZWQgPSBzcHJpbmdSSzRGYWN0b3J5KHRlbnNpb24sIGZyaWN0aW9uKTtcblx0ICAgICAgICAgICAgICAgIC8qIENvbXB1dGUgdGhlIGFkanVzdGVkIHRpbWUgZGVsdGEuICovXG5cdCAgICAgICAgICAgICAgICBkdCA9IHRpbWVfbGFwc2VkIC8gZHVyYXRpb24gKiBEVDtcblx0ICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIGR0ID0gRFQ7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuXHQgICAgICAgICAgICAgICAgLyogTmV4dC9zdGVwIGZ1bmN0aW9uIC4qL1xuXHQgICAgICAgICAgICAgICAgbGFzdF9zdGF0ZSA9IHNwcmluZ0ludGVncmF0ZVN0YXRlKGxhc3Rfc3RhdGUgfHwgaW5pdFN0YXRlLCBkdCk7XG5cdCAgICAgICAgICAgICAgICAvKiBTdG9yZSB0aGUgcG9zaXRpb24uICovXG5cdCAgICAgICAgICAgICAgICBwYXRoLnB1c2goMSArIGxhc3Rfc3RhdGUueCk7XG5cdCAgICAgICAgICAgICAgICB0aW1lX2xhcHNlZCArPSAxNjtcblx0ICAgICAgICAgICAgICAgIC8qIElmIHRoZSBjaGFuZ2UgdGhyZXNob2xkIGlzIHJlYWNoZWQsIGJyZWFrLiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKCEoTWF0aC5hYnMobGFzdF9zdGF0ZS54KSA+IHRvbGVyYW5jZSAmJiBNYXRoLmFicyhsYXN0X3N0YXRlLnYpID4gdG9sZXJhbmNlKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLyogSWYgZHVyYXRpb24gaXMgbm90IGRlZmluZWQsIHJldHVybiB0aGUgYWN0dWFsIHRpbWUgcmVxdWlyZWQgZm9yIGNvbXBsZXRpbmcgdGhpcyBhbmltYXRpb24uIE90aGVyd2lzZSwgcmV0dXJuIGEgY2xvc3VyZSB0aGF0IGhvbGRzIHRoZVxuXHQgICAgICAgICAgICAgICBjb21wdXRlZCBwYXRoIGFuZCByZXR1cm5zIGEgc25hcHNob3Qgb2YgdGhlIHBvc2l0aW9uIGFjY29yZGluZyB0byBhIGdpdmVuIHBlcmNlbnRDb21wbGV0ZS4gKi9cblx0ICAgICAgICAgICAgcmV0dXJuICFoYXZlX2R1cmF0aW9uID8gdGltZV9sYXBzZWQgOiBmdW5jdGlvbihwZXJjZW50Q29tcGxldGUpIHsgcmV0dXJuIHBhdGhbIChwZXJjZW50Q29tcGxldGUgKiAocGF0aC5sZW5ndGggLSAxKSkgfCAwIF07IH07XG5cdCAgICAgICAgfTtcblx0ICAgIH0oKSk7XG5cblx0ICAgIC8qIGpRdWVyeSBlYXNpbmdzLiAqL1xuXHQgICAgVmVsb2NpdHkuRWFzaW5ncyA9IHtcblx0ICAgICAgICBsaW5lYXI6IGZ1bmN0aW9uKHApIHsgcmV0dXJuIHA7IH0sXG5cdCAgICAgICAgc3dpbmc6IGZ1bmN0aW9uKHApIHsgcmV0dXJuIDAuNSAtIE1hdGguY29zKCBwICogTWF0aC5QSSApIC8gMiB9LFxuXHQgICAgICAgIC8qIEJvbnVzIFwic3ByaW5nXCIgZWFzaW5nLCB3aGljaCBpcyBhIGxlc3MgZXhhZ2dlcmF0ZWQgdmVyc2lvbiBvZiBlYXNlSW5PdXRFbGFzdGljLiAqL1xuXHQgICAgICAgIHNwcmluZzogZnVuY3Rpb24ocCkgeyByZXR1cm4gMSAtIChNYXRoLmNvcyhwICogNC41ICogTWF0aC5QSSkgKiBNYXRoLmV4cCgtcCAqIDYpKTsgfVxuXHQgICAgfTtcblxuXHQgICAgLyogQ1NTMyBhbmQgUm9iZXJ0IFBlbm5lciBlYXNpbmdzLiAqL1xuXHQgICAgJC5lYWNoKFxuXHQgICAgICAgIFtcblx0ICAgICAgICAgICAgWyBcImVhc2VcIiwgWyAwLjI1LCAwLjEsIDAuMjUsIDEuMCBdIF0sXG5cdCAgICAgICAgICAgIFsgXCJlYXNlLWluXCIsIFsgMC40MiwgMC4wLCAxLjAwLCAxLjAgXSBdLFxuXHQgICAgICAgICAgICBbIFwiZWFzZS1vdXRcIiwgWyAwLjAwLCAwLjAsIDAuNTgsIDEuMCBdIF0sXG5cdCAgICAgICAgICAgIFsgXCJlYXNlLWluLW91dFwiLCBbIDAuNDIsIDAuMCwgMC41OCwgMS4wIF0gXSxcblx0ICAgICAgICAgICAgWyBcImVhc2VJblNpbmVcIiwgWyAwLjQ3LCAwLCAwLjc0NSwgMC43MTUgXSBdLFxuXHQgICAgICAgICAgICBbIFwiZWFzZU91dFNpbmVcIiwgWyAwLjM5LCAwLjU3NSwgMC41NjUsIDEgXSBdLFxuXHQgICAgICAgICAgICBbIFwiZWFzZUluT3V0U2luZVwiLCBbIDAuNDQ1LCAwLjA1LCAwLjU1LCAwLjk1IF0gXSxcblx0ICAgICAgICAgICAgWyBcImVhc2VJblF1YWRcIiwgWyAwLjU1LCAwLjA4NSwgMC42OCwgMC41MyBdIF0sXG5cdCAgICAgICAgICAgIFsgXCJlYXNlT3V0UXVhZFwiLCBbIDAuMjUsIDAuNDYsIDAuNDUsIDAuOTQgXSBdLFxuXHQgICAgICAgICAgICBbIFwiZWFzZUluT3V0UXVhZFwiLCBbIDAuNDU1LCAwLjAzLCAwLjUxNSwgMC45NTUgXSBdLFxuXHQgICAgICAgICAgICBbIFwiZWFzZUluQ3ViaWNcIiwgWyAwLjU1LCAwLjA1NSwgMC42NzUsIDAuMTkgXSBdLFxuXHQgICAgICAgICAgICBbIFwiZWFzZU91dEN1YmljXCIsIFsgMC4yMTUsIDAuNjEsIDAuMzU1LCAxIF0gXSxcblx0ICAgICAgICAgICAgWyBcImVhc2VJbk91dEN1YmljXCIsIFsgMC42NDUsIDAuMDQ1LCAwLjM1NSwgMSBdIF0sXG5cdCAgICAgICAgICAgIFsgXCJlYXNlSW5RdWFydFwiLCBbIDAuODk1LCAwLjAzLCAwLjY4NSwgMC4yMiBdIF0sXG5cdCAgICAgICAgICAgIFsgXCJlYXNlT3V0UXVhcnRcIiwgWyAwLjE2NSwgMC44NCwgMC40NCwgMSBdIF0sXG5cdCAgICAgICAgICAgIFsgXCJlYXNlSW5PdXRRdWFydFwiLCBbIDAuNzcsIDAsIDAuMTc1LCAxIF0gXSxcblx0ICAgICAgICAgICAgWyBcImVhc2VJblF1aW50XCIsIFsgMC43NTUsIDAuMDUsIDAuODU1LCAwLjA2IF0gXSxcblx0ICAgICAgICAgICAgWyBcImVhc2VPdXRRdWludFwiLCBbIDAuMjMsIDEsIDAuMzIsIDEgXSBdLFxuXHQgICAgICAgICAgICBbIFwiZWFzZUluT3V0UXVpbnRcIiwgWyAwLjg2LCAwLCAwLjA3LCAxIF0gXSxcblx0ICAgICAgICAgICAgWyBcImVhc2VJbkV4cG9cIiwgWyAwLjk1LCAwLjA1LCAwLjc5NSwgMC4wMzUgXSBdLFxuXHQgICAgICAgICAgICBbIFwiZWFzZU91dEV4cG9cIiwgWyAwLjE5LCAxLCAwLjIyLCAxIF0gXSxcblx0ICAgICAgICAgICAgWyBcImVhc2VJbk91dEV4cG9cIiwgWyAxLCAwLCAwLCAxIF0gXSxcblx0ICAgICAgICAgICAgWyBcImVhc2VJbkNpcmNcIiwgWyAwLjYsIDAuMDQsIDAuOTgsIDAuMzM1IF0gXSxcblx0ICAgICAgICAgICAgWyBcImVhc2VPdXRDaXJjXCIsIFsgMC4wNzUsIDAuODIsIDAuMTY1LCAxIF0gXSxcblx0ICAgICAgICAgICAgWyBcImVhc2VJbk91dENpcmNcIiwgWyAwLjc4NSwgMC4xMzUsIDAuMTUsIDAuODYgXSBdXG5cdCAgICAgICAgXSwgZnVuY3Rpb24oaSwgZWFzaW5nQXJyYXkpIHtcblx0ICAgICAgICAgICAgVmVsb2NpdHkuRWFzaW5nc1tlYXNpbmdBcnJheVswXV0gPSBnZW5lcmF0ZUJlemllci5hcHBseShudWxsLCBlYXNpbmdBcnJheVsxXSk7XG5cdCAgICAgICAgfSk7XG5cblx0ICAgIC8qIERldGVybWluZSB0aGUgYXBwcm9wcmlhdGUgZWFzaW5nIHR5cGUgZ2l2ZW4gYW4gZWFzaW5nIGlucHV0LiAqL1xuXHQgICAgZnVuY3Rpb24gZ2V0RWFzaW5nKHZhbHVlLCBkdXJhdGlvbikge1xuXHQgICAgICAgIHZhciBlYXNpbmcgPSB2YWx1ZTtcblxuXHQgICAgICAgIC8qIFRoZSBlYXNpbmcgb3B0aW9uIGNhbiBlaXRoZXIgYmUgYSBzdHJpbmcgdGhhdCByZWZlcmVuY2VzIGEgcHJlLXJlZ2lzdGVyZWQgZWFzaW5nLFxuXHQgICAgICAgICAgIG9yIGl0IGNhbiBiZSBhIHR3by0vZm91ci1pdGVtIGFycmF5IG9mIGludGVnZXJzIHRvIGJlIGNvbnZlcnRlZCBpbnRvIGEgYmV6aWVyL3NwcmluZyBmdW5jdGlvbi4gKi9cblx0ICAgICAgICBpZiAoVHlwZS5pc1N0cmluZyh2YWx1ZSkpIHtcblx0ICAgICAgICAgICAgLyogRW5zdXJlIHRoYXQgdGhlIGVhc2luZyBoYXMgYmVlbiBhc3NpZ25lZCB0byBqUXVlcnkncyBWZWxvY2l0eS5FYXNpbmdzIG9iamVjdC4gKi9cblx0ICAgICAgICAgICAgaWYgKCFWZWxvY2l0eS5FYXNpbmdzW3ZhbHVlXSkge1xuXHQgICAgICAgICAgICAgICAgZWFzaW5nID0gZmFsc2U7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9IGVsc2UgaWYgKFR5cGUuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAxKSB7XG5cdCAgICAgICAgICAgIGVhc2luZyA9IGdlbmVyYXRlU3RlcC5hcHBseShudWxsLCB2YWx1ZSk7XG5cdCAgICAgICAgfSBlbHNlIGlmIChUeXBlLmlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PT0gMikge1xuXHQgICAgICAgICAgICAvKiBzcHJpbmdSSzQgbXVzdCBiZSBwYXNzZWQgdGhlIGFuaW1hdGlvbidzIGR1cmF0aW9uLiAqL1xuXHQgICAgICAgICAgICAvKiBOb3RlOiBJZiB0aGUgc3ByaW5nUks0IGFycmF5IGNvbnRhaW5zIG5vbi1udW1iZXJzLCBnZW5lcmF0ZVNwcmluZ1JLNCgpIHJldHVybnMgYW4gZWFzaW5nXG5cdCAgICAgICAgICAgICAgIGZ1bmN0aW9uIGdlbmVyYXRlZCB3aXRoIGRlZmF1bHQgdGVuc2lvbiBhbmQgZnJpY3Rpb24gdmFsdWVzLiAqL1xuXHQgICAgICAgICAgICBlYXNpbmcgPSBnZW5lcmF0ZVNwcmluZ1JLNC5hcHBseShudWxsLCB2YWx1ZS5jb25jYXQoWyBkdXJhdGlvbiBdKSk7XG5cdCAgICAgICAgfSBlbHNlIGlmIChUeXBlLmlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PT0gNCkge1xuXHQgICAgICAgICAgICAvKiBOb3RlOiBJZiB0aGUgYmV6aWVyIGFycmF5IGNvbnRhaW5zIG5vbi1udW1iZXJzLCBnZW5lcmF0ZUJlemllcigpIHJldHVybnMgZmFsc2UuICovXG5cdCAgICAgICAgICAgIGVhc2luZyA9IGdlbmVyYXRlQmV6aWVyLmFwcGx5KG51bGwsIHZhbHVlKTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICBlYXNpbmcgPSBmYWxzZTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvKiBSZXZlcnQgdG8gdGhlIFZlbG9jaXR5LXdpZGUgZGVmYXVsdCBlYXNpbmcgdHlwZSwgb3IgZmFsbCBiYWNrIHRvIFwic3dpbmdcIiAod2hpY2ggaXMgYWxzbyBqUXVlcnkncyBkZWZhdWx0KVxuXHQgICAgICAgICAgIGlmIHRoZSBWZWxvY2l0eS13aWRlIGRlZmF1bHQgaGFzIGJlZW4gaW5jb3JyZWN0bHkgbW9kaWZpZWQuICovXG5cdCAgICAgICAgaWYgKGVhc2luZyA9PT0gZmFsc2UpIHtcblx0ICAgICAgICAgICAgaWYgKFZlbG9jaXR5LkVhc2luZ3NbVmVsb2NpdHkuZGVmYXVsdHMuZWFzaW5nXSkge1xuXHQgICAgICAgICAgICAgICAgZWFzaW5nID0gVmVsb2NpdHkuZGVmYXVsdHMuZWFzaW5nO1xuXHQgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgZWFzaW5nID0gRUFTSU5HX0RFRkFVTFQ7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gZWFzaW5nO1xuXHQgICAgfVxuXG5cdCAgICAvKioqKioqKioqKioqKioqKipcblx0ICAgICAgICBDU1MgU3RhY2tcblx0ICAgICoqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAvKiBUaGUgQ1NTIG9iamVjdCBpcyBhIGhpZ2hseSBjb25kZW5zZWQgYW5kIHBlcmZvcm1hbnQgQ1NTIHN0YWNrIHRoYXQgZnVsbHkgcmVwbGFjZXMgalF1ZXJ5J3MuXG5cdCAgICAgICBJdCBoYW5kbGVzIHRoZSB2YWxpZGF0aW9uLCBnZXR0aW5nLCBhbmQgc2V0dGluZyBvZiBib3RoIHN0YW5kYXJkIENTUyBwcm9wZXJ0aWVzIGFuZCBDU1MgcHJvcGVydHkgaG9va3MuICovXG5cdCAgICAvKiBOb3RlOiBBIFwiQ1NTXCIgc2hvcnRoYW5kIGlzIGFsaWFzZWQgc28gdGhhdCBvdXIgY29kZSBpcyBlYXNpZXIgdG8gcmVhZC4gKi9cblx0ICAgIHZhciBDU1MgPSBWZWxvY2l0eS5DU1MgPSB7XG5cblx0ICAgICAgICAvKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICBSZWdFeFxuXHQgICAgICAgICoqKioqKioqKioqKiovXG5cblx0ICAgICAgICBSZWdFeDoge1xuXHQgICAgICAgICAgICBpc0hleDogL14jKFtBLWZcXGRdezN9KXsxLDJ9JC9pLFxuXHQgICAgICAgICAgICAvKiBVbndyYXAgYSBwcm9wZXJ0eSB2YWx1ZSdzIHN1cnJvdW5kaW5nIHRleHQsIGUuZy4gXCJyZ2JhKDQsIDMsIDIsIDEpXCIgPT0+IFwiNCwgMywgMiwgMVwiIGFuZCBcInJlY3QoNHB4IDNweCAycHggMXB4KVwiID09PiBcIjRweCAzcHggMnB4IDFweFwiLiAqL1xuXHQgICAgICAgICAgICB2YWx1ZVVud3JhcDogL15bQS16XStcXCgoLiopXFwpJC9pLFxuXHQgICAgICAgICAgICB3cmFwcGVkVmFsdWVBbHJlYWR5RXh0cmFjdGVkOiAvWzAtOS5dKyBbMC05Ll0rIFswLTkuXSsoIFswLTkuXSspPy8sXG5cdCAgICAgICAgICAgIC8qIFNwbGl0IGEgbXVsdGktdmFsdWUgcHJvcGVydHkgaW50byBhbiBhcnJheSBvZiBzdWJ2YWx1ZXMsIGUuZy4gXCJyZ2JhKDQsIDMsIDIsIDEpIDRweCAzcHggMnB4IDFweFwiID09PiBbIFwicmdiYSg0LCAzLCAyLCAxKVwiLCBcIjRweFwiLCBcIjNweFwiLCBcIjJweFwiLCBcIjFweFwiIF0uICovXG5cdCAgICAgICAgICAgIHZhbHVlU3BsaXQ6IC8oW0Etel0rXFwoLitcXCkpfCgoW0EtejAtOSMtLl0rPykoPz1cXHN8JCkpL2lnXG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIC8qKioqKioqKioqKipcblx0ICAgICAgICAgICAgTGlzdHNcblx0ICAgICAgICAqKioqKioqKioqKiovXG5cblx0ICAgICAgICBMaXN0czoge1xuXHQgICAgICAgICAgICBjb2xvcnM6IFsgXCJmaWxsXCIsIFwic3Ryb2tlXCIsIFwic3RvcENvbG9yXCIsIFwiY29sb3JcIiwgXCJiYWNrZ3JvdW5kQ29sb3JcIiwgXCJib3JkZXJDb2xvclwiLCBcImJvcmRlclRvcENvbG9yXCIsIFwiYm9yZGVyUmlnaHRDb2xvclwiLCBcImJvcmRlckJvdHRvbUNvbG9yXCIsIFwiYm9yZGVyTGVmdENvbG9yXCIsIFwib3V0bGluZUNvbG9yXCIgXSxcblx0ICAgICAgICAgICAgdHJhbnNmb3Jtc0Jhc2U6IFsgXCJ0cmFuc2xhdGVYXCIsIFwidHJhbnNsYXRlWVwiLCBcInNjYWxlXCIsIFwic2NhbGVYXCIsIFwic2NhbGVZXCIsIFwic2tld1hcIiwgXCJza2V3WVwiLCBcInJvdGF0ZVpcIiBdLFxuXHQgICAgICAgICAgICB0cmFuc2Zvcm1zM0Q6IFsgXCJ0cmFuc2Zvcm1QZXJzcGVjdGl2ZVwiLCBcInRyYW5zbGF0ZVpcIiwgXCJzY2FsZVpcIiwgXCJyb3RhdGVYXCIsIFwicm90YXRlWVwiIF1cblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgLyoqKioqKioqKioqKlxuXHQgICAgICAgICAgICBIb29rc1xuXHQgICAgICAgICoqKioqKioqKioqKi9cblxuXHQgICAgICAgIC8qIEhvb2tzIGFsbG93IGEgc3VicHJvcGVydHkgKGUuZy4gXCJib3hTaGFkb3dCbHVyXCIpIG9mIGEgY29tcG91bmQtdmFsdWUgQ1NTIHByb3BlcnR5XG5cdCAgICAgICAgICAgKGUuZy4gXCJib3hTaGFkb3c6IFggWSBCbHVyIFNwcmVhZCBDb2xvclwiKSB0byBiZSBhbmltYXRlZCBhcyBpZiBpdCB3ZXJlIGEgZGlzY3JldGUgcHJvcGVydHkuICovXG5cdCAgICAgICAgLyogTm90ZTogQmV5b25kIGVuYWJsaW5nIGZpbmUtZ3JhaW5lZCBwcm9wZXJ0eSBhbmltYXRpb24sIGhvb2tpbmcgaXMgbmVjZXNzYXJ5IHNpbmNlIFZlbG9jaXR5IG9ubHlcblx0ICAgICAgICAgICB0d2VlbnMgcHJvcGVydGllcyB3aXRoIHNpbmdsZSBudW1lcmljIHZhbHVlczsgdW5saWtlIENTUyB0cmFuc2l0aW9ucywgVmVsb2NpdHkgZG9lcyBub3QgaW50ZXJwb2xhdGUgY29tcG91bmQtdmFsdWVzLiAqL1xuXHQgICAgICAgIEhvb2tzOiB7XG5cdCAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgUmVnaXN0cmF0aW9uXG5cdCAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgIC8qIFRlbXBsYXRlcyBhcmUgYSBjb25jaXNlIHdheSBvZiBpbmRpY2F0aW5nIHdoaWNoIHN1YnByb3BlcnRpZXMgbXVzdCBiZSBpbmRpdmlkdWFsbHkgcmVnaXN0ZXJlZCBmb3IgZWFjaCBjb21wb3VuZC12YWx1ZSBDU1MgcHJvcGVydHkuICovXG5cdCAgICAgICAgICAgIC8qIEVhY2ggdGVtcGxhdGUgY29uc2lzdHMgb2YgdGhlIGNvbXBvdW5kLXZhbHVlJ3MgYmFzZSBuYW1lLCBpdHMgY29uc3RpdHVlbnQgc3VicHJvcGVydHkgbmFtZXMsIGFuZCB0aG9zZSBzdWJwcm9wZXJ0aWVzJyBkZWZhdWx0IHZhbHVlcy4gKi9cblx0ICAgICAgICAgICAgdGVtcGxhdGVzOiB7XG5cdCAgICAgICAgICAgICAgICBcInRleHRTaGFkb3dcIjogWyBcIkNvbG9yIFggWSBCbHVyXCIsIFwiYmxhY2sgMHB4IDBweCAwcHhcIiBdLFxuXHQgICAgICAgICAgICAgICAgXCJib3hTaGFkb3dcIjogWyBcIkNvbG9yIFggWSBCbHVyIFNwcmVhZFwiLCBcImJsYWNrIDBweCAwcHggMHB4IDBweFwiIF0sXG5cdCAgICAgICAgICAgICAgICBcImNsaXBcIjogWyBcIlRvcCBSaWdodCBCb3R0b20gTGVmdFwiLCBcIjBweCAwcHggMHB4IDBweFwiIF0sXG5cdCAgICAgICAgICAgICAgICBcImJhY2tncm91bmRQb3NpdGlvblwiOiBbIFwiWCBZXCIsIFwiMCUgMCVcIiBdLFxuXHQgICAgICAgICAgICAgICAgXCJ0cmFuc2Zvcm1PcmlnaW5cIjogWyBcIlggWSBaXCIsIFwiNTAlIDUwJSAwcHhcIiBdLFxuXHQgICAgICAgICAgICAgICAgXCJwZXJzcGVjdGl2ZU9yaWdpblwiOiBbIFwiWCBZXCIsIFwiNTAlIDUwJVwiIF1cblx0ICAgICAgICAgICAgfSxcblxuXHQgICAgICAgICAgICAvKiBBIFwicmVnaXN0ZXJlZFwiIGhvb2sgaXMgb25lIHRoYXQgaGFzIGJlZW4gY29udmVydGVkIGZyb20gaXRzIHRlbXBsYXRlIGZvcm0gaW50byBhIGxpdmUsXG5cdCAgICAgICAgICAgICAgIHR3ZWVuYWJsZSBwcm9wZXJ0eS4gSXQgY29udGFpbnMgZGF0YSB0byBhc3NvY2lhdGUgaXQgd2l0aCBpdHMgcm9vdCBwcm9wZXJ0eS4gKi9cblx0ICAgICAgICAgICAgcmVnaXN0ZXJlZDoge1xuXHQgICAgICAgICAgICAgICAgLyogTm90ZTogQSByZWdpc3RlcmVkIGhvb2sgbG9va3MgbGlrZSB0aGlzID09PiB0ZXh0U2hhZG93Qmx1cjogWyBcInRleHRTaGFkb3dcIiwgMyBdLFxuXHQgICAgICAgICAgICAgICAgICAgd2hpY2ggY29uc2lzdHMgb2YgdGhlIHN1YnByb3BlcnR5J3MgbmFtZSwgdGhlIGFzc29jaWF0ZWQgcm9vdCBwcm9wZXJ0eSdzIG5hbWUsXG5cdCAgICAgICAgICAgICAgICAgICBhbmQgdGhlIHN1YnByb3BlcnR5J3MgcG9zaXRpb24gaW4gdGhlIHJvb3QncyB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgfSxcblx0ICAgICAgICAgICAgLyogQ29udmVydCB0aGUgdGVtcGxhdGVzIGludG8gaW5kaXZpZHVhbCBob29rcyB0aGVuIGFwcGVuZCB0aGVtIHRvIHRoZSByZWdpc3RlcmVkIG9iamVjdCBhYm92ZS4gKi9cblx0ICAgICAgICAgICAgcmVnaXN0ZXI6IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIC8qIENvbG9yIGhvb2tzIHJlZ2lzdHJhdGlvbjogQ29sb3JzIGFyZSBkZWZhdWx0ZWQgdG8gd2hpdGUgLS0gYXMgb3Bwb3NlZCB0byBibGFjayAtLSBzaW5jZSBjb2xvcnMgdGhhdCBhcmVcblx0ICAgICAgICAgICAgICAgICAgIGN1cnJlbnRseSBzZXQgdG8gXCJ0cmFuc3BhcmVudFwiIGRlZmF1bHQgdG8gdGhlaXIgcmVzcGVjdGl2ZSB0ZW1wbGF0ZSBiZWxvdyB3aGVuIGNvbG9yLWFuaW1hdGVkLFxuXHQgICAgICAgICAgICAgICAgICAgYW5kIHdoaXRlIGlzIHR5cGljYWxseSBhIGNsb3NlciBtYXRjaCB0byB0cmFuc3BhcmVudCB0aGFuIGJsYWNrIGlzLiBBbiBleGNlcHRpb24gaXMgbWFkZSBmb3IgdGV4dCAoXCJjb2xvclwiKSxcblx0ICAgICAgICAgICAgICAgICAgIHdoaWNoIGlzIGFsbW9zdCBhbHdheXMgc2V0IGNsb3NlciB0byBibGFjayB0aGFuIHdoaXRlLiAqL1xuXHQgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBDU1MuTGlzdHMuY29sb3JzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIHJnYkNvbXBvbmVudHMgPSAoQ1NTLkxpc3RzLmNvbG9yc1tpXSA9PT0gXCJjb2xvclwiKSA/IFwiMCAwIDAgMVwiIDogXCIyNTUgMjU1IDI1NSAxXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgQ1NTLkhvb2tzLnRlbXBsYXRlc1tDU1MuTGlzdHMuY29sb3JzW2ldXSA9IFsgXCJSZWQgR3JlZW4gQmx1ZSBBbHBoYVwiLCByZ2JDb21wb25lbnRzIF07XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIHZhciByb290UHJvcGVydHksXG5cdCAgICAgICAgICAgICAgICAgICAgaG9va1RlbXBsYXRlLFxuXHQgICAgICAgICAgICAgICAgICAgIGhvb2tOYW1lcztcblxuXHQgICAgICAgICAgICAgICAgLyogSW4gSUUsIGNvbG9yIHZhbHVlcyBpbnNpZGUgY29tcG91bmQtdmFsdWUgcHJvcGVydGllcyBhcmUgcG9zaXRpb25lZCBhdCB0aGUgZW5kIHRoZSB2YWx1ZSBpbnN0ZWFkIG9mIGF0IHRoZSBiZWdpbm5pbmcuXG5cdCAgICAgICAgICAgICAgICAgICBUaHVzLCB3ZSByZS1hcnJhbmdlIHRoZSB0ZW1wbGF0ZXMgYWNjb3JkaW5nbHkuICovXG5cdCAgICAgICAgICAgICAgICBpZiAoSUUpIHtcblx0ICAgICAgICAgICAgICAgICAgICBmb3IgKHJvb3RQcm9wZXJ0eSBpbiBDU1MuSG9va3MudGVtcGxhdGVzKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGhvb2tUZW1wbGF0ZSA9IENTUy5Ib29rcy50ZW1wbGF0ZXNbcm9vdFByb3BlcnR5XTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgaG9va05hbWVzID0gaG9va1RlbXBsYXRlWzBdLnNwbGl0KFwiIFwiKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGVmYXVsdFZhbHVlcyA9IGhvb2tUZW1wbGF0ZVsxXS5tYXRjaChDU1MuUmVnRXgudmFsdWVTcGxpdCk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhvb2tOYW1lc1swXSA9PT0gXCJDb2xvclwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBSZXBvc2l0aW9uIGJvdGggdGhlIGhvb2sncyBuYW1lIGFuZCBpdHMgZGVmYXVsdCB2YWx1ZSB0byB0aGUgZW5kIG9mIHRoZWlyIHJlc3BlY3RpdmUgc3RyaW5ncy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvb2tOYW1lcy5wdXNoKGhvb2tOYW1lcy5zaGlmdCgpKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRWYWx1ZXMucHVzaChkZWZhdWx0VmFsdWVzLnNoaWZ0KCkpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBSZXBsYWNlIHRoZSBleGlzdGluZyB0ZW1wbGF0ZSBmb3IgdGhlIGhvb2sncyByb290IHByb3BlcnR5LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ1NTLkhvb2tzLnRlbXBsYXRlc1tyb290UHJvcGVydHldID0gWyBob29rTmFtZXMuam9pbihcIiBcIiksIGRlZmF1bHRWYWx1ZXMuam9pbihcIiBcIikgXTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgLyogSG9vayByZWdpc3RyYXRpb24uICovXG5cdCAgICAgICAgICAgICAgICBmb3IgKHJvb3RQcm9wZXJ0eSBpbiBDU1MuSG9va3MudGVtcGxhdGVzKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaG9va1RlbXBsYXRlID0gQ1NTLkhvb2tzLnRlbXBsYXRlc1tyb290UHJvcGVydHldO1xuXHQgICAgICAgICAgICAgICAgICAgIGhvb2tOYW1lcyA9IGhvb2tUZW1wbGF0ZVswXS5zcGxpdChcIiBcIik7XG5cblx0ICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIGhvb2tOYW1lcykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZnVsbEhvb2tOYW1lID0gcm9vdFByb3BlcnR5ICsgaG9va05hbWVzW2ldLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaG9va1Bvc2l0aW9uID0gaTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBGb3IgZWFjaCBob29rLCByZWdpc3RlciBpdHMgZnVsbCBuYW1lIChlLmcuIHRleHRTaGFkb3dCbHVyKSB3aXRoIGl0cyByb290IHByb3BlcnR5IChlLmcuIHRleHRTaGFkb3cpXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZCB0aGUgaG9vaydzIHBvc2l0aW9uIGluIGl0cyB0ZW1wbGF0ZSdzIGRlZmF1bHQgdmFsdWUgc3RyaW5nLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBDU1MuSG9va3MucmVnaXN0ZXJlZFtmdWxsSG9va05hbWVdID0gWyByb290UHJvcGVydHksIGhvb2tQb3NpdGlvbiBdO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfSxcblxuXHQgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgSW5qZWN0aW9uIGFuZCBFeHRyYWN0aW9uXG5cdCAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgIC8qIExvb2sgdXAgdGhlIHJvb3QgcHJvcGVydHkgYXNzb2NpYXRlZCB3aXRoIHRoZSBob29rIChlLmcuIHJldHVybiBcInRleHRTaGFkb3dcIiBmb3IgXCJ0ZXh0U2hhZG93Qmx1clwiKS4gKi9cblx0ICAgICAgICAgICAgLyogU2luY2UgYSBob29rIGNhbm5vdCBiZSBzZXQgZGlyZWN0bHkgKHRoZSBicm93c2VyIHdvbid0IHJlY29nbml6ZSBpdCksIHN0eWxlIHVwZGF0aW5nIGZvciBob29rcyBpcyByb3V0ZWQgdGhyb3VnaCB0aGUgaG9vaydzIHJvb3QgcHJvcGVydHkuICovXG5cdCAgICAgICAgICAgIGdldFJvb3Q6IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuXHQgICAgICAgICAgICAgICAgdmFyIGhvb2tEYXRhID0gQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbcHJvcGVydHldO1xuXG5cdCAgICAgICAgICAgICAgICBpZiAoaG9va0RhdGEpIHtcblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gaG9va0RhdGFbMF07XG5cdCAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZXJlIHdhcyBubyBob29rIG1hdGNoLCByZXR1cm4gdGhlIHByb3BlcnR5IG5hbWUgdW50b3VjaGVkLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0eTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfSxcblx0ICAgICAgICAgICAgLyogQ29udmVydCBhbnkgcm9vdFByb3BlcnR5VmFsdWUsIG51bGwgb3Igb3RoZXJ3aXNlLCBpbnRvIGEgc3BhY2UtZGVsaW1pdGVkIGxpc3Qgb2YgaG9vayB2YWx1ZXMgc28gdGhhdFxuXHQgICAgICAgICAgICAgICB0aGUgdGFyZ2V0ZWQgaG9vayBjYW4gYmUgaW5qZWN0ZWQgb3IgZXh0cmFjdGVkIGF0IGl0cyBzdGFuZGFyZCBwb3NpdGlvbi4gKi9cblx0ICAgICAgICAgICAgY2xlYW5Sb290UHJvcGVydHlWYWx1ZTogZnVuY3Rpb24ocm9vdFByb3BlcnR5LCByb290UHJvcGVydHlWYWx1ZSkge1xuXHQgICAgICAgICAgICAgICAgLyogSWYgdGhlIHJvb3RQcm9wZXJ0eVZhbHVlIGlzIHdyYXBwZWQgd2l0aCBcInJnYigpXCIsIFwiY2xpcCgpXCIsIGV0Yy4sIHJlbW92ZSB0aGUgd3JhcHBpbmcgdG8gbm9ybWFsaXplIHRoZSB2YWx1ZSBiZWZvcmUgbWFuaXB1bGF0aW9uLiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKENTUy5SZWdFeC52YWx1ZVVud3JhcC50ZXN0KHJvb3RQcm9wZXJ0eVZhbHVlKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlID0gcm9vdFByb3BlcnR5VmFsdWUubWF0Y2goQ1NTLlJlZ0V4LnZhbHVlVW53cmFwKVsxXTtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgLyogSWYgcm9vdFByb3BlcnR5VmFsdWUgaXMgYSBDU1MgbnVsbC12YWx1ZSAoZnJvbSB3aGljaCB0aGVyZSdzIGluaGVyZW50bHkgbm8gaG9vayB2YWx1ZSB0byBleHRyYWN0KSxcblx0ICAgICAgICAgICAgICAgICAgIGRlZmF1bHQgdG8gdGhlIHJvb3QncyBkZWZhdWx0IHZhbHVlIGFzIGRlZmluZWQgaW4gQ1NTLkhvb2tzLnRlbXBsYXRlcy4gKi9cblx0ICAgICAgICAgICAgICAgIC8qIE5vdGU6IENTUyBudWxsLXZhbHVlcyBpbmNsdWRlIFwibm9uZVwiLCBcImF1dG9cIiwgYW5kIFwidHJhbnNwYXJlbnRcIi4gVGhleSBtdXN0IGJlIGNvbnZlcnRlZCBpbnRvIHRoZWlyXG5cdCAgICAgICAgICAgICAgICAgICB6ZXJvLXZhbHVlcyAoZS5nLiB0ZXh0U2hhZG93OiBcIm5vbmVcIiA9PT4gdGV4dFNoYWRvdzogXCIwcHggMHB4IDBweCBibGFja1wiKSBmb3IgaG9vayBtYW5pcHVsYXRpb24gdG8gcHJvY2VlZC4gKi9cblx0ICAgICAgICAgICAgICAgIGlmIChDU1MuVmFsdWVzLmlzQ1NTTnVsbFZhbHVlKHJvb3RQcm9wZXJ0eVZhbHVlKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlID0gQ1NTLkhvb2tzLnRlbXBsYXRlc1tyb290UHJvcGVydHldWzFdO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICByZXR1cm4gcm9vdFByb3BlcnR5VmFsdWU7XG5cdCAgICAgICAgICAgIH0sXG5cdCAgICAgICAgICAgIC8qIEV4dHJhY3RlZCB0aGUgaG9vaydzIHZhbHVlIGZyb20gaXRzIHJvb3QgcHJvcGVydHkncyB2YWx1ZS4gVGhpcyBpcyB1c2VkIHRvIGdldCB0aGUgc3RhcnRpbmcgdmFsdWUgb2YgYW4gYW5pbWF0aW5nIGhvb2suICovXG5cdCAgICAgICAgICAgIGV4dHJhY3RWYWx1ZTogZnVuY3Rpb24gKGZ1bGxIb29rTmFtZSwgcm9vdFByb3BlcnR5VmFsdWUpIHtcblx0ICAgICAgICAgICAgICAgIHZhciBob29rRGF0YSA9IENTUy5Ib29rcy5yZWdpc3RlcmVkW2Z1bGxIb29rTmFtZV07XG5cblx0ICAgICAgICAgICAgICAgIGlmIChob29rRGF0YSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciBob29rUm9vdCA9IGhvb2tEYXRhWzBdLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICBob29rUG9zaXRpb24gPSBob29rRGF0YVsxXTtcblxuXHQgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlID0gQ1NTLkhvb2tzLmNsZWFuUm9vdFByb3BlcnR5VmFsdWUoaG9va1Jvb3QsIHJvb3RQcm9wZXJ0eVZhbHVlKTtcblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIFNwbGl0IHJvb3RQcm9wZXJ0eVZhbHVlIGludG8gaXRzIGNvbnN0aXR1ZW50IGhvb2sgdmFsdWVzIHRoZW4gZ3JhYiB0aGUgZGVzaXJlZCBob29rIGF0IGl0cyBzdGFuZGFyZCBwb3NpdGlvbi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gcm9vdFByb3BlcnR5VmFsdWUudG9TdHJpbmcoKS5tYXRjaChDU1MuUmVnRXgudmFsdWVTcGxpdClbaG9va1Bvc2l0aW9uXTtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIHByb3ZpZGVkIGZ1bGxIb29rTmFtZSBpc24ndCBhIHJlZ2lzdGVyZWQgaG9vaywgcmV0dXJuIHRoZSByb290UHJvcGVydHlWYWx1ZSB0aGF0IHdhcyBwYXNzZWQgaW4uICovXG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJvb3RQcm9wZXJ0eVZhbHVlO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9LFxuXHQgICAgICAgICAgICAvKiBJbmplY3QgdGhlIGhvb2sncyB2YWx1ZSBpbnRvIGl0cyByb290IHByb3BlcnR5J3MgdmFsdWUuIFRoaXMgaXMgdXNlZCB0byBwaWVjZSBiYWNrIHRvZ2V0aGVyIHRoZSByb290IHByb3BlcnR5XG5cdCAgICAgICAgICAgICAgIG9uY2UgVmVsb2NpdHkgaGFzIHVwZGF0ZWQgb25lIG9mIGl0cyBpbmRpdmlkdWFsbHkgaG9va2VkIHZhbHVlcyB0aHJvdWdoIHR3ZWVuaW5nLiAqL1xuXHQgICAgICAgICAgICBpbmplY3RWYWx1ZTogZnVuY3Rpb24gKGZ1bGxIb29rTmFtZSwgaG9va1ZhbHVlLCByb290UHJvcGVydHlWYWx1ZSkge1xuXHQgICAgICAgICAgICAgICAgdmFyIGhvb2tEYXRhID0gQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbZnVsbEhvb2tOYW1lXTtcblxuXHQgICAgICAgICAgICAgICAgaWYgKGhvb2tEYXRhKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIGhvb2tSb290ID0gaG9va0RhdGFbMF0sXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGhvb2tQb3NpdGlvbiA9IGhvb2tEYXRhWzFdLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZVBhcnRzLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZVVwZGF0ZWQ7XG5cblx0ICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZSA9IENTUy5Ib29rcy5jbGVhblJvb3RQcm9wZXJ0eVZhbHVlKGhvb2tSb290LCByb290UHJvcGVydHlWYWx1ZSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBTcGxpdCByb290UHJvcGVydHlWYWx1ZSBpbnRvIGl0cyBpbmRpdmlkdWFsIGhvb2sgdmFsdWVzLCByZXBsYWNlIHRoZSB0YXJnZXRlZCB2YWx1ZSB3aXRoIGhvb2tWYWx1ZSxcblx0ICAgICAgICAgICAgICAgICAgICAgICB0aGVuIHJlY29uc3RydWN0IHRoZSByb290UHJvcGVydHlWYWx1ZSBzdHJpbmcuICovXG5cdCAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWVQYXJ0cyA9IHJvb3RQcm9wZXJ0eVZhbHVlLnRvU3RyaW5nKCkubWF0Y2goQ1NTLlJlZ0V4LnZhbHVlU3BsaXQpO1xuXHQgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlUGFydHNbaG9va1Bvc2l0aW9uXSA9IGhvb2tWYWx1ZTtcblx0ICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZVVwZGF0ZWQgPSByb290UHJvcGVydHlWYWx1ZVBhcnRzLmpvaW4oXCIgXCIpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJvb3RQcm9wZXJ0eVZhbHVlVXBkYXRlZDtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIHByb3ZpZGVkIGZ1bGxIb29rTmFtZSBpc24ndCBhIHJlZ2lzdGVyZWQgaG9vaywgcmV0dXJuIHRoZSByb290UHJvcGVydHlWYWx1ZSB0aGF0IHdhcyBwYXNzZWQgaW4uICovXG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJvb3RQcm9wZXJ0eVZhbHVlO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIC8qKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgTm9ybWFsaXphdGlvbnNcblx0ICAgICAgICAqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgLyogTm9ybWFsaXphdGlvbnMgc3RhbmRhcmRpemUgQ1NTIHByb3BlcnR5IG1hbmlwdWxhdGlvbiBieSBwb2xseWZpbGxpbmcgYnJvd3Nlci1zcGVjaWZpYyBpbXBsZW1lbnRhdGlvbnMgKGUuZy4gb3BhY2l0eSlcblx0ICAgICAgICAgICBhbmQgcmVmb3JtYXR0aW5nIHNwZWNpYWwgcHJvcGVydGllcyAoZS5nLiBjbGlwLCByZ2JhKSB0byBsb29rIGxpa2Ugc3RhbmRhcmQgb25lcy4gKi9cblx0ICAgICAgICBOb3JtYWxpemF0aW9uczoge1xuXHQgICAgICAgICAgICAvKiBOb3JtYWxpemF0aW9ucyBhcmUgcGFzc2VkIGEgbm9ybWFsaXphdGlvbiB0YXJnZXQgKGVpdGhlciB0aGUgcHJvcGVydHkncyBuYW1lLCBpdHMgZXh0cmFjdGVkIHZhbHVlLCBvciBpdHMgaW5qZWN0ZWQgdmFsdWUpLFxuXHQgICAgICAgICAgICAgICB0aGUgdGFyZ2V0ZWQgZWxlbWVudCAod2hpY2ggbWF5IG5lZWQgdG8gYmUgcXVlcmllZCksIGFuZCB0aGUgdGFyZ2V0ZWQgcHJvcGVydHkgdmFsdWUuICovXG5cdCAgICAgICAgICAgIHJlZ2lzdGVyZWQ6IHtcblx0ICAgICAgICAgICAgICAgIGNsaXA6IGZ1bmN0aW9uICh0eXBlLCBlbGVtZW50LCBwcm9wZXJ0eVZhbHVlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJuYW1lXCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJjbGlwXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIENsaXAgbmVlZHMgdG8gYmUgdW53cmFwcGVkIGFuZCBzdHJpcHBlZCBvZiBpdHMgY29tbWFzIGR1cmluZyBleHRyYWN0aW9uLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZXh0cmFjdFwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4dHJhY3RlZDtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgVmVsb2NpdHkgYWxzbyBleHRyYWN0ZWQgdGhpcyB2YWx1ZSwgc2tpcCBleHRyYWN0aW9uLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENTUy5SZWdFeC53cmFwcGVkVmFsdWVBbHJlYWR5RXh0cmFjdGVkLnRlc3QocHJvcGVydHlWYWx1ZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYWN0ZWQgPSBwcm9wZXJ0eVZhbHVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBSZW1vdmUgdGhlIFwicmVjdCgpXCIgd3JhcHBlci4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHRyYWN0ZWQgPSBwcm9wZXJ0eVZhbHVlLnRvU3RyaW5nKCkubWF0Y2goQ1NTLlJlZ0V4LnZhbHVlVW53cmFwKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFN0cmlwIG9mZiBjb21tYXMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFjdGVkID0gZXh0cmFjdGVkID8gZXh0cmFjdGVkWzFdLnJlcGxhY2UoLywoXFxzKyk/L2csIFwiIFwiKSA6IHByb3BlcnR5VmFsdWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBleHRyYWN0ZWQ7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIENsaXAgbmVlZHMgdG8gYmUgcmUtd3JhcHBlZCBkdXJpbmcgaW5qZWN0aW9uLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaW5qZWN0XCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJyZWN0KFwiICsgcHJvcGVydHlWYWx1ZSArIFwiKVwiO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH0sXG5cblx0ICAgICAgICAgICAgICAgIGJsdXI6IGZ1bmN0aW9uKHR5cGUsIGVsZW1lbnQsIHByb3BlcnR5VmFsdWUpIHtcblx0ICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm5hbWVcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBWZWxvY2l0eS5TdGF0ZS5pc0ZpcmVmb3ggPyBcImZpbHRlclwiIDogXCItd2Via2l0LWZpbHRlclwiO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZXh0cmFjdFwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4dHJhY3RlZCA9IHBhcnNlRmxvYXQocHJvcGVydHlWYWx1ZSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIGV4dHJhY3RlZCBpcyBOYU4sIG1lYW5pbmcgdGhlIHZhbHVlIGlzbid0IGFscmVhZHkgZXh0cmFjdGVkLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEoZXh0cmFjdGVkIHx8IGV4dHJhY3RlZCA9PT0gMCkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYmx1ckNvbXBvbmVudCA9IHByb3BlcnR5VmFsdWUudG9TdHJpbmcoKS5tYXRjaCgvYmx1clxcKChbMC05XStbQS16XSspXFwpL2kpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGZpbHRlciBzdHJpbmcgaGFkIGEgYmx1ciBjb21wb25lbnQsIHJldHVybiBqdXN0IHRoZSBibHVyIHZhbHVlIGFuZCB1bml0IHR5cGUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJsdXJDb21wb25lbnQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFjdGVkID0gYmx1ckNvbXBvbmVudFsxXTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgY29tcG9uZW50IGRvZXNuJ3QgZXhpc3QsIGRlZmF1bHQgYmx1ciB0byAwLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4dHJhY3RlZCA9IDA7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXh0cmFjdGVkO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBCbHVyIG5lZWRzIHRvIGJlIHJlLXdyYXBwZWQgZHVyaW5nIGluamVjdGlvbi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImluamVjdFwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRm9yIHRoZSBibHVyIGVmZmVjdCB0byBiZSBmdWxseSBkZS1hcHBsaWVkLCBpdCBuZWVkcyB0byBiZSBzZXQgdG8gXCJub25lXCIgaW5zdGVhZCBvZiAwLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFwYXJzZUZsb2F0KHByb3BlcnR5VmFsdWUpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwibm9uZVwiO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJibHVyKFwiICsgcHJvcGVydHlWYWx1ZSArIFwiKVwiO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH0sXG5cblx0ICAgICAgICAgICAgICAgIC8qIDw9SUU4IGRvIG5vdCBzdXBwb3J0IHRoZSBzdGFuZGFyZCBvcGFjaXR5IHByb3BlcnR5LiBUaGV5IHVzZSBmaWx0ZXI6YWxwaGEob3BhY2l0eT1JTlQpIGluc3RlYWQuICovXG5cdCAgICAgICAgICAgICAgICBvcGFjaXR5OiBmdW5jdGlvbiAodHlwZSwgZWxlbWVudCwgcHJvcGVydHlWYWx1ZSkge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChJRSA8PSA4KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm5hbWVcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJmaWx0ZXJcIjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJleHRyYWN0XCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogPD1JRTggcmV0dXJuIGEgXCJmaWx0ZXJcIiB2YWx1ZSBvZiBcImFscGhhKG9wYWNpdHk9XFxkezEsM30pXCIuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRXh0cmFjdCB0aGUgdmFsdWUgYW5kIGNvbnZlcnQgaXQgdG8gYSBkZWNpbWFsIHZhbHVlIHRvIG1hdGNoIHRoZSBzdGFuZGFyZCBDU1Mgb3BhY2l0eSBwcm9wZXJ0eSdzIGZvcm1hdHRpbmcuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGV4dHJhY3RlZCA9IHByb3BlcnR5VmFsdWUudG9TdHJpbmcoKS5tYXRjaCgvYWxwaGFcXChvcGFjaXR5PSguKilcXCkvaSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXh0cmFjdGVkKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENvbnZlcnQgdG8gZGVjaW1hbCB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IGV4dHJhY3RlZFsxXSAvIDEwMDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBXaGVuIGV4dHJhY3Rpbmcgb3BhY2l0eSwgZGVmYXVsdCB0byAxIHNpbmNlIGEgbnVsbCB2YWx1ZSBtZWFucyBvcGFjaXR5IGhhc24ndCBiZWVuIHNldC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IDE7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5VmFsdWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaW5qZWN0XCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogT3BhY2lmaWVkIGVsZW1lbnRzIGFyZSByZXF1aXJlZCB0byBoYXZlIHRoZWlyIHpvb20gcHJvcGVydHkgc2V0IHRvIGEgbm9uLXplcm8gdmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5zdHlsZS56b29tID0gMTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFNldHRpbmcgdGhlIGZpbHRlciBwcm9wZXJ0eSBvbiBlbGVtZW50cyB3aXRoIGNlcnRhaW4gZm9udCBwcm9wZXJ0eSBjb21iaW5hdGlvbnMgY2FuIHJlc3VsdCBpbiBhXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGlnaGx5IHVuYXBwZWFsaW5nIHVsdHJhLWJvbGRpbmcgZWZmZWN0LiBUaGVyZSdzIG5vIHdheSB0byByZW1lZHkgdGhpcyB0aHJvdWdob3V0IGEgdHdlZW4sIGJ1dCBkcm9wcGluZyB0aGVcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSBhbHRvZ2V0aGVyICh3aGVuIG9wYWNpdHkgaGl0cyAxKSBhdCBsZWFzdHMgZW5zdXJlcyB0aGF0IHRoZSBnbGl0Y2ggaXMgZ29uZSBwb3N0LXR3ZWVuaW5nLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJzZUZsb2F0KHByb3BlcnR5VmFsdWUpID49IDEpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEFzIHBlciB0aGUgZmlsdGVyIHByb3BlcnR5J3Mgc3BlYywgY29udmVydCB0aGUgZGVjaW1hbCB2YWx1ZSB0byBhIHdob2xlIG51bWJlciBhbmQgd3JhcCB0aGUgdmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJhbHBoYShvcGFjaXR5PVwiICsgcGFyc2VJbnQocGFyc2VGbG9hdChwcm9wZXJ0eVZhbHVlKSAqIDEwMCwgMTApICsgXCIpXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgLyogV2l0aCBhbGwgb3RoZXIgYnJvd3NlcnMsIG5vcm1hbGl6YXRpb24gaXMgbm90IHJlcXVpcmVkOyByZXR1cm4gdGhlIHNhbWUgdmFsdWVzIHRoYXQgd2VyZSBwYXNzZWQgaW4uICovXG5cdCAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwibmFtZVwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcIm9wYWNpdHlcIjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJleHRyYWN0XCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5VmFsdWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaW5qZWN0XCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByb3BlcnR5VmFsdWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH0sXG5cblx0ICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICBCYXRjaGVkIFJlZ2lzdHJhdGlvbnNcblx0ICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgLyogTm90ZTogQmF0Y2hlZCBub3JtYWxpemF0aW9ucyBleHRlbmQgdGhlIENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkIG9iamVjdC4gKi9cblx0ICAgICAgICAgICAgcmVnaXN0ZXI6IGZ1bmN0aW9uICgpIHtcblxuXHQgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgVHJhbnNmb3Jtc1xuXHQgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgIC8qIFRyYW5zZm9ybXMgYXJlIHRoZSBzdWJwcm9wZXJ0aWVzIGNvbnRhaW5lZCBieSB0aGUgQ1NTIFwidHJhbnNmb3JtXCIgcHJvcGVydHkuIFRyYW5zZm9ybXMgbXVzdCB1bmRlcmdvIG5vcm1hbGl6YXRpb25cblx0ICAgICAgICAgICAgICAgICAgIHNvIHRoYXQgdGhleSBjYW4gYmUgcmVmZXJlbmNlZCBpbiBhIHByb3BlcnRpZXMgbWFwIGJ5IHRoZWlyIGluZGl2aWR1YWwgbmFtZXMuICovXG5cdCAgICAgICAgICAgICAgICAvKiBOb3RlOiBXaGVuIHRyYW5zZm9ybXMgYXJlIFwic2V0XCIsIHRoZXkgYXJlIGFjdHVhbGx5IGFzc2lnbmVkIHRvIGEgcGVyLWVsZW1lbnQgdHJhbnNmb3JtQ2FjaGUuIFdoZW4gYWxsIHRyYW5zZm9ybVxuXHQgICAgICAgICAgICAgICAgICAgc2V0dGluZyBpcyBjb21wbGV0ZSBjb21wbGV0ZSwgQ1NTLmZsdXNoVHJhbnNmb3JtQ2FjaGUoKSBtdXN0IGJlIG1hbnVhbGx5IGNhbGxlZCB0byBmbHVzaCB0aGUgdmFsdWVzIHRvIHRoZSBET00uXG5cdCAgICAgICAgICAgICAgICAgICBUcmFuc2Zvcm0gc2V0dGluZyBpcyBiYXRjaGVkIGluIHRoaXMgd2F5IHRvIGltcHJvdmUgcGVyZm9ybWFuY2U6IHRoZSB0cmFuc2Zvcm0gc3R5bGUgb25seSBuZWVkcyB0byBiZSB1cGRhdGVkXG5cdCAgICAgICAgICAgICAgICAgICBvbmNlIHdoZW4gbXVsdGlwbGUgdHJhbnNmb3JtIHN1YnByb3BlcnRpZXMgYXJlIGJlaW5nIGFuaW1hdGVkIHNpbXVsdGFuZW91c2x5LiAqL1xuXHQgICAgICAgICAgICAgICAgLyogTm90ZTogSUU5IGFuZCBBbmRyb2lkIEdpbmdlcmJyZWFkIGhhdmUgc3VwcG9ydCBmb3IgMkQgLS0gYnV0IG5vdCAzRCAtLSB0cmFuc2Zvcm1zLiBTaW5jZSBhbmltYXRpbmcgdW5zdXBwb3J0ZWRcblx0ICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybSBwcm9wZXJ0aWVzIHJlc3VsdHMgaW4gdGhlIGJyb3dzZXIgaWdub3JpbmcgdGhlICplbnRpcmUqIHRyYW5zZm9ybSBzdHJpbmcsIHdlIHByZXZlbnQgdGhlc2UgM0QgdmFsdWVzXG5cdCAgICAgICAgICAgICAgICAgICBmcm9tIGJlaW5nIG5vcm1hbGl6ZWQgZm9yIHRoZXNlIGJyb3dzZXJzIHNvIHRoYXQgdHdlZW5pbmcgc2tpcHMgdGhlc2UgcHJvcGVydGllcyBhbHRvZ2V0aGVyXG5cdCAgICAgICAgICAgICAgICAgICAoc2luY2UgaXQgd2lsbCBpZ25vcmUgdGhlbSBhcyBiZWluZyB1bnN1cHBvcnRlZCBieSB0aGUgYnJvd3Nlci4pICovXG5cdCAgICAgICAgICAgICAgICBpZiAoIShJRSA8PSA5KSAmJiAhVmVsb2NpdHkuU3RhdGUuaXNHaW5nZXJicmVhZCkge1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFNpbmNlIHRoZSBzdGFuZGFsb25lIENTUyBcInBlcnNwZWN0aXZlXCIgcHJvcGVydHkgYW5kIHRoZSBDU1MgdHJhbnNmb3JtIFwicGVyc3BlY3RpdmVcIiBzdWJwcm9wZXJ0eVxuXHQgICAgICAgICAgICAgICAgICAgIHNoYXJlIHRoZSBzYW1lIG5hbWUsIHRoZSBsYXR0ZXIgaXMgZ2l2ZW4gYSB1bmlxdWUgdG9rZW4gd2l0aGluIFZlbG9jaXR5OiBcInRyYW5zZm9ybVBlcnNwZWN0aXZlXCIuICovXG5cdCAgICAgICAgICAgICAgICAgICAgQ1NTLkxpc3RzLnRyYW5zZm9ybXNCYXNlID0gQ1NTLkxpc3RzLnRyYW5zZm9ybXNCYXNlLmNvbmNhdChDU1MuTGlzdHMudHJhbnNmb3JtczNEKTtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBDU1MuTGlzdHMudHJhbnNmb3Jtc0Jhc2UubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgICAgICAvKiBXcmFwIHRoZSBkeW5hbWljYWxseSBnZW5lcmF0ZWQgbm9ybWFsaXphdGlvbiBmdW5jdGlvbiBpbiBhIG5ldyBzY29wZSBzbyB0aGF0IHRyYW5zZm9ybU5hbWUncyB2YWx1ZSBpc1xuXHQgICAgICAgICAgICAgICAgICAgIHBhaXJlZCB3aXRoIGl0cyByZXNwZWN0aXZlIGZ1bmN0aW9uLiAoT3RoZXJ3aXNlLCBhbGwgZnVuY3Rpb25zIHdvdWxkIHRha2UgdGhlIGZpbmFsIGZvciBsb29wJ3MgdHJhbnNmb3JtTmFtZS4pICovXG5cdCAgICAgICAgICAgICAgICAgICAgKGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdHJhbnNmb3JtTmFtZSA9IENTUy5MaXN0cy50cmFuc2Zvcm1zQmFzZVtpXTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFt0cmFuc2Zvcm1OYW1lXSA9IGZ1bmN0aW9uICh0eXBlLCBlbGVtZW50LCBwcm9wZXJ0eVZhbHVlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBUaGUgbm9ybWFsaXplZCBwcm9wZXJ0eSBuYW1lIGlzIHRoZSBwYXJlbnQgXCJ0cmFuc2Zvcm1cIiBwcm9wZXJ0eSAtLSB0aGUgcHJvcGVydHkgdGhhdCBpcyBhY3R1YWxseSBzZXQgaW4gQ1NTLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJuYW1lXCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBcInRyYW5zZm9ybVwiO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRyYW5zZm9ybSB2YWx1ZXMgYXJlIGNhY2hlZCBvbnRvIGEgcGVyLWVsZW1lbnQgdHJhbnNmb3JtQ2FjaGUgb2JqZWN0LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJleHRyYWN0XCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoaXMgdHJhbnNmb3JtIGhhcyB5ZXQgdG8gYmUgYXNzaWduZWQgYSB2YWx1ZSwgcmV0dXJuIGl0cyBudWxsIHZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoRGF0YShlbGVtZW50KSA9PT0gdW5kZWZpbmVkIHx8IERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGVbdHJhbnNmb3JtTmFtZV0gPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU2NhbGUgQ1NTLkxpc3RzLnRyYW5zZm9ybXNCYXNlIGRlZmF1bHQgdG8gMSB3aGVyZWFzIGFsbCBvdGhlciB0cmFuc2Zvcm0gcHJvcGVydGllcyBkZWZhdWx0IHRvIDAuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gL15zY2FsZS9pLnRlc3QodHJhbnNmb3JtTmFtZSkgPyAxIDogMDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogV2hlbiB0cmFuc2Zvcm0gdmFsdWVzIGFyZSBzZXQsIHRoZXkgYXJlIHdyYXBwZWQgaW4gcGFyZW50aGVzZXMgYXMgcGVyIHRoZSBDU1Mgc3BlYy5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVGh1cywgd2hlbiBleHRyYWN0aW5nIHRoZWlyIHZhbHVlcyAoZm9yIHR3ZWVuIGNhbGN1bGF0aW9ucyksIHdlIHN0cmlwIG9mZiB0aGUgcGFyZW50aGVzZXMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZVt0cmFuc2Zvcm1OYW1lXS5yZXBsYWNlKC9bKCldL2csIFwiXCIpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImluamVjdFwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW52YWxpZCA9IGZhbHNlO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIGFuIGluZGl2aWR1YWwgdHJhbnNmb3JtIHByb3BlcnR5IGNvbnRhaW5zIGFuIHVuc3VwcG9ydGVkIHVuaXQgdHlwZSwgdGhlIGJyb3dzZXIgaWdub3JlcyB0aGUgKmVudGlyZSogdHJhbnNmb3JtIHByb3BlcnR5LlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUaHVzLCBwcm90ZWN0IHVzZXJzIGZyb20gdGhlbXNlbHZlcyBieSBza2lwcGluZyBzZXR0aW5nIGZvciB0cmFuc2Zvcm0gdmFsdWVzIHN1cHBsaWVkIHdpdGggaW52YWxpZCB1bml0IHR5cGVzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTd2l0Y2ggb24gdGhlIGJhc2UgdHJhbnNmb3JtIHR5cGU7IGlnbm9yZSB0aGUgYXhpcyBieSByZW1vdmluZyB0aGUgbGFzdCBsZXR0ZXIgZnJvbSB0aGUgdHJhbnNmb3JtJ3MgbmFtZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh0cmFuc2Zvcm1OYW1lLnN1YnN0cigwLCB0cmFuc2Zvcm1OYW1lLmxlbmd0aCAtIDEpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBXaGl0ZWxpc3QgdW5pdCB0eXBlcyBmb3IgZWFjaCB0cmFuc2Zvcm0uICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwidHJhbnNsYXRlXCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW52YWxpZCA9ICEvKCV8cHh8ZW18cmVtfHZ3fHZofFxcZCkkL2kudGVzdChwcm9wZXJ0eVZhbHVlKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFNpbmNlIGFuIGF4aXMtZnJlZSBcInNjYWxlXCIgcHJvcGVydHkgaXMgc3VwcG9ydGVkIGFzIHdlbGwsIGEgbGl0dGxlIGhhY2sgaXMgdXNlZCBoZXJlIHRvIGRldGVjdCBpdCBieSBjaG9wcGluZyBvZmYgaXRzIGxhc3QgbGV0dGVyLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcInNjYWxcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJzY2FsZVwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENocm9tZSBvbiBBbmRyb2lkIGhhcyBhIGJ1ZyBpbiB3aGljaCBzY2FsZWQgZWxlbWVudHMgYmx1ciBpZiB0aGVpciBpbml0aWFsIHNjYWxlXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgaXMgYmVsb3cgMSAod2hpY2ggY2FuIGhhcHBlbiB3aXRoIGZvcmNlZmVlZGluZykuIFRodXMsIHdlIGRldGVjdCBhIHlldC11bnNldCBzY2FsZSBwcm9wZXJ0eVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFuZCBlbnN1cmUgdGhhdCBpdHMgZmlyc3QgdmFsdWUgaXMgYWx3YXlzIDEuIE1vcmUgaW5mbzogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDQxNzg5MC9jc3MzLWFuaW1hdGlvbnMtd2l0aC10cmFuc2Zvcm0tY2F1c2VzLWJsdXJyZWQtZWxlbWVudHMtb24td2Via2l0LzEwNDE3OTYyIzEwNDE3OTYyICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFZlbG9jaXR5LlN0YXRlLmlzQW5kcm9pZCAmJiBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlW3RyYW5zZm9ybU5hbWVdID09PSB1bmRlZmluZWQgJiYgcHJvcGVydHlWYWx1ZSA8IDEpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IDE7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW52YWxpZCA9ICEvKFxcZCkkL2kudGVzdChwcm9wZXJ0eVZhbHVlKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJza2V3XCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW52YWxpZCA9ICEvKGRlZ3xcXGQpJC9pLnRlc3QocHJvcGVydHlWYWx1ZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwicm90YXRlXCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW52YWxpZCA9ICEvKGRlZ3xcXGQpJC9pLnRlc3QocHJvcGVydHlWYWx1ZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWludmFsaWQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEFzIHBlciB0aGUgQ1NTIHNwZWMsIHdyYXAgdGhlIHZhbHVlIGluIHBhcmVudGhlc2VzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZVt0cmFuc2Zvcm1OYW1lXSA9IFwiKFwiICsgcHJvcGVydHlWYWx1ZSArIFwiKVwiO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQWx0aG91Z2ggdGhlIHZhbHVlIGlzIHNldCBvbiB0aGUgdHJhbnNmb3JtQ2FjaGUgb2JqZWN0LCByZXR1cm4gdGhlIG5ld2x5LXVwZGF0ZWQgdmFsdWUgZm9yIHRoZSBjYWxsaW5nIGNvZGUgdG8gcHJvY2VzcyBhcyBub3JtYWwuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlW3RyYW5zZm9ybU5hbWVdO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgICAgICAgICAgIH0pKCk7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgQ29sb3JzXG5cdCAgICAgICAgICAgICAgICAqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAvKiBTaW5jZSBWZWxvY2l0eSBvbmx5IGFuaW1hdGVzIGEgc2luZ2xlIG51bWVyaWMgdmFsdWUgcGVyIHByb3BlcnR5LCBjb2xvciBhbmltYXRpb24gaXMgYWNoaWV2ZWQgYnkgaG9va2luZyB0aGUgaW5kaXZpZHVhbCBSR0JBIGNvbXBvbmVudHMgb2YgQ1NTIGNvbG9yIHByb3BlcnRpZXMuXG5cdCAgICAgICAgICAgICAgICAgICBBY2NvcmRpbmdseSwgY29sb3IgdmFsdWVzIG11c3QgYmUgbm9ybWFsaXplZCAoZS5nLiBcIiNmZjAwMDBcIiwgXCJyZWRcIiwgYW5kIFwicmdiKDI1NSwgMCwgMClcIiA9PT4gXCIyNTUgMCAwIDFcIikgc28gdGhhdCB0aGVpciBjb21wb25lbnRzIGNhbiBiZSBpbmplY3RlZC9leHRyYWN0ZWQgYnkgQ1NTLkhvb2tzIGxvZ2ljLiAqL1xuXHQgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBDU1MuTGlzdHMuY29sb3JzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogV3JhcCB0aGUgZHluYW1pY2FsbHkgZ2VuZXJhdGVkIG5vcm1hbGl6YXRpb24gZnVuY3Rpb24gaW4gYSBuZXcgc2NvcGUgc28gdGhhdCBjb2xvck5hbWUncyB2YWx1ZSBpcyBwYWlyZWQgd2l0aCBpdHMgcmVzcGVjdGl2ZSBmdW5jdGlvbi5cblx0ICAgICAgICAgICAgICAgICAgICAgICAoT3RoZXJ3aXNlLCBhbGwgZnVuY3Rpb25zIHdvdWxkIHRha2UgdGhlIGZpbmFsIGZvciBsb29wJ3MgY29sb3JOYW1lLikgKi9cblx0ICAgICAgICAgICAgICAgICAgICAoZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29sb3JOYW1lID0gQ1NTLkxpc3RzLmNvbG9yc1tpXTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBJbiBJRTw9OCwgd2hpY2ggc3VwcG9ydCByZ2IgYnV0IG5vdCByZ2JhLCBjb2xvciBwcm9wZXJ0aWVzIGFyZSByZXZlcnRlZCB0byByZ2IgYnkgc3RyaXBwaW5nIG9mZiB0aGUgYWxwaGEgY29tcG9uZW50LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtjb2xvck5hbWVdID0gZnVuY3Rpb24odHlwZSwgZWxlbWVudCwgcHJvcGVydHlWYWx1ZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIm5hbWVcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbG9yTmFtZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDb252ZXJ0IGFsbCBjb2xvciB2YWx1ZXMgaW50byB0aGUgcmdiIGZvcm1hdC4gKE9sZCBJRSBjYW4gcmV0dXJuIGhleCB2YWx1ZXMgYW5kIGNvbG9yIG5hbWVzIGluc3RlYWQgb2YgcmdiL3JnYmEuKSAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJleHRyYWN0XCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBleHRyYWN0ZWQ7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIGNvbG9yIGlzIGFscmVhZHkgaW4gaXRzIGhvb2thYmxlIGZvcm0gKGUuZy4gXCIyNTUgMjU1IDI1NSAxXCIpIGR1ZSB0byBoYXZpbmcgYmVlbiBwcmV2aW91c2x5IGV4dHJhY3RlZCwgc2tpcCBleHRyYWN0aW9uLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ1NTLlJlZ0V4LndyYXBwZWRWYWx1ZUFscmVhZHlFeHRyYWN0ZWQudGVzdChwcm9wZXJ0eVZhbHVlKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFjdGVkID0gcHJvcGVydHlWYWx1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb252ZXJ0ZWQsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3JOYW1lcyA9IHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmxhY2s6IFwicmdiKDAsIDAsIDApXCIsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsdWU6IFwicmdiKDAsIDAsIDI1NSlcIixcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JheTogXCJyZ2IoMTI4LCAxMjgsIDEyOClcIixcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JlZW46IFwicmdiKDAsIDEyOCwgMClcIixcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVkOiBcInJnYigyNTUsIDAsIDApXCIsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaXRlOiBcInJnYigyNTUsIDI1NSwgMjU1KVwiXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQ29udmVydCBjb2xvciBuYW1lcyB0byByZ2IuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoL15bQS16XSskL2kudGVzdChwcm9wZXJ0eVZhbHVlKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2xvck5hbWVzW3Byb3BlcnR5VmFsdWVdICE9PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udmVydGVkID0gY29sb3JOYW1lc1twcm9wZXJ0eVZhbHVlXVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIGFuIHVubWF0Y2hlZCBjb2xvciBuYW1lIGlzIHByb3ZpZGVkLCBkZWZhdWx0IHRvIGJsYWNrLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb252ZXJ0ZWQgPSBjb2xvck5hbWVzLmJsYWNrO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENvbnZlcnQgaGV4IHZhbHVlcyB0byByZ2IuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKENTUy5SZWdFeC5pc0hleC50ZXN0KHByb3BlcnR5VmFsdWUpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udmVydGVkID0gXCJyZ2IoXCIgKyBDU1MuVmFsdWVzLmhleFRvUmdiKHByb3BlcnR5VmFsdWUpLmpvaW4oXCIgXCIpICsgXCIpXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgcHJvdmlkZWQgY29sb3IgZG9lc24ndCBtYXRjaCBhbnkgb2YgdGhlIGFjY2VwdGVkIGNvbG9yIGZvcm1hdHMsIGRlZmF1bHQgdG8gYmxhY2suICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCEoL15yZ2JhP1xcKC9pLnRlc3QocHJvcGVydHlWYWx1ZSkpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udmVydGVkID0gY29sb3JOYW1lcy5ibGFjaztcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogUmVtb3ZlIHRoZSBzdXJyb3VuZGluZyBcInJnYi9yZ2JhKClcIiBzdHJpbmcgdGhlbiByZXBsYWNlIGNvbW1hcyB3aXRoIHNwYWNlcyBhbmQgc3RyaXBcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcGVhdGVkIHNwYWNlcyAoaW4gY2FzZSB0aGUgdmFsdWUgaW5jbHVkZWQgc3BhY2VzIHRvIGJlZ2luIHdpdGgpLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFjdGVkID0gKGNvbnZlcnRlZCB8fCBwcm9wZXJ0eVZhbHVlKS50b1N0cmluZygpLm1hdGNoKENTUy5SZWdFeC52YWx1ZVVud3JhcClbMV0ucmVwbGFjZSgvLChcXHMrKT8vZywgXCIgXCIpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU28gbG9uZyBhcyB0aGlzIGlzbid0IDw9SUU4LCBhZGQgYSBmb3VydGggKGFscGhhKSBjb21wb25lbnQgaWYgaXQncyBtaXNzaW5nIGFuZCBkZWZhdWx0IGl0IHRvIDEgKHZpc2libGUpLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIShJRSA8PSA4KSAmJiBleHRyYWN0ZWQuc3BsaXQoXCIgXCIpLmxlbmd0aCA9PT0gMykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0cmFjdGVkICs9IFwiIDFcIjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBleHRyYWN0ZWQ7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImluamVjdFwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGlzIGlzIElFPD04IGFuZCBhbiBhbHBoYSBjb21wb25lbnQgZXhpc3RzLCBzdHJpcCBpdCBvZmYuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChJRSA8PSA4KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydHlWYWx1ZS5zcGxpdChcIiBcIikubGVuZ3RoID09PSA0KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IHByb3BlcnR5VmFsdWUuc3BsaXQoL1xccysvKS5zbGljZSgwLCAzKS5qb2luKFwiIFwiKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogT3RoZXJ3aXNlLCBhZGQgYSBmb3VydGggKGFscGhhKSBjb21wb25lbnQgaWYgaXQncyBtaXNzaW5nIGFuZCBkZWZhdWx0IGl0IHRvIDEgKHZpc2libGUpLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5VmFsdWUuc3BsaXQoXCIgXCIpLmxlbmd0aCA9PT0gMykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSArPSBcIiAxXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBSZS1pbnNlcnQgdGhlIGJyb3dzZXItYXBwcm9wcmlhdGUgd3JhcHBlcihcInJnYi9yZ2JhKClcIiksIGluc2VydCBjb21tYXMsIGFuZCBzdHJpcCBvZmYgZGVjaW1hbCB1bml0c1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbiBhbGwgdmFsdWVzIGJ1dCB0aGUgZm91cnRoIChSLCBHLCBhbmQgQiBvbmx5IGFjY2VwdCB3aG9sZSBudW1iZXJzKS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChJRSA8PSA4ID8gXCJyZ2JcIiA6IFwicmdiYVwiKSArIFwiKFwiICsgcHJvcGVydHlWYWx1ZS5yZXBsYWNlKC9cXHMrL2csIFwiLFwiKS5yZXBsYWNlKC9cXC4oXFxkKSsoPz0sKS9nLCBcIlwiKSArIFwiKVwiO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgICAgICAgICAgIH0pKCk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgIENTUyBQcm9wZXJ0eSBOYW1lc1xuXHQgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgIE5hbWVzOiB7XG5cdCAgICAgICAgICAgIC8qIENhbWVsY2FzZSBhIHByb3BlcnR5IG5hbWUgaW50byBpdHMgSmF2YVNjcmlwdCBub3RhdGlvbiAoZS5nLiBcImJhY2tncm91bmQtY29sb3JcIiA9PT4gXCJiYWNrZ3JvdW5kQ29sb3JcIikuXG5cdCAgICAgICAgICAgICAgIENhbWVsY2FzaW5nIGlzIHVzZWQgdG8gbm9ybWFsaXplIHByb3BlcnR5IG5hbWVzIGJldHdlZW4gYW5kIGFjcm9zcyBjYWxscy4gKi9cblx0ICAgICAgICAgICAgY2FtZWxDYXNlOiBmdW5jdGlvbiAocHJvcGVydHkpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0eS5yZXBsYWNlKC8tKFxcdykvZywgZnVuY3Rpb24gKG1hdGNoLCBzdWJNYXRjaCkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBzdWJNYXRjaC50b1VwcGVyQ2FzZSgpO1xuXHQgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgIH0sXG5cblx0ICAgICAgICAgICAgLyogRm9yIFNWRyBlbGVtZW50cywgc29tZSBwcm9wZXJ0aWVzIChuYW1lbHksIGRpbWVuc2lvbmFsIG9uZXMpIGFyZSBHRVQvU0VUIHZpYSB0aGUgZWxlbWVudCdzIEhUTUwgYXR0cmlidXRlcyAoaW5zdGVhZCBvZiB2aWEgQ1NTIHN0eWxlcykuICovXG5cdCAgICAgICAgICAgIFNWR0F0dHJpYnV0ZTogZnVuY3Rpb24gKHByb3BlcnR5KSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgU1ZHQXR0cmlidXRlcyA9IFwid2lkdGh8aGVpZ2h0fHh8eXxjeHxjeXxyfHJ4fHJ5fHgxfHgyfHkxfHkyXCI7XG5cblx0ICAgICAgICAgICAgICAgIC8qIENlcnRhaW4gYnJvd3NlcnMgcmVxdWlyZSBhbiBTVkcgdHJhbnNmb3JtIHRvIGJlIGFwcGxpZWQgYXMgYW4gYXR0cmlidXRlLiAoT3RoZXJ3aXNlLCBhcHBsaWNhdGlvbiB2aWEgQ1NTIGlzIHByZWZlcmFibGUgZHVlIHRvIDNEIHN1cHBvcnQuKSAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKElFIHx8IChWZWxvY2l0eS5TdGF0ZS5pc0FuZHJvaWQgJiYgIVZlbG9jaXR5LlN0YXRlLmlzQ2hyb21lKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIFNWR0F0dHJpYnV0ZXMgKz0gXCJ8dHJhbnNmb3JtXCI7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUmVnRXhwKFwiXihcIiArIFNWR0F0dHJpYnV0ZXMgKyBcIikkXCIsIFwiaVwiKS50ZXN0KHByb3BlcnR5KTtcblx0ICAgICAgICAgICAgfSxcblxuXHQgICAgICAgICAgICAvKiBEZXRlcm1pbmUgd2hldGhlciBhIHByb3BlcnR5IHNob3VsZCBiZSBzZXQgd2l0aCBhIHZlbmRvciBwcmVmaXguICovXG5cdCAgICAgICAgICAgIC8qIElmIGEgcHJlZml4ZWQgdmVyc2lvbiBvZiB0aGUgcHJvcGVydHkgZXhpc3RzLCByZXR1cm4gaXQuIE90aGVyd2lzZSwgcmV0dXJuIHRoZSBvcmlnaW5hbCBwcm9wZXJ0eSBuYW1lLlxuXHQgICAgICAgICAgICAgICBJZiB0aGUgcHJvcGVydHkgaXMgbm90IGF0IGFsbCBzdXBwb3J0ZWQgYnkgdGhlIGJyb3dzZXIsIHJldHVybiBhIGZhbHNlIGZsYWcuICovXG5cdCAgICAgICAgICAgIHByZWZpeENoZWNrOiBmdW5jdGlvbiAocHJvcGVydHkpIHtcblx0ICAgICAgICAgICAgICAgIC8qIElmIHRoaXMgcHJvcGVydHkgaGFzIGFscmVhZHkgYmVlbiBjaGVja2VkLCByZXR1cm4gdGhlIGNhY2hlZCB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgIGlmIChWZWxvY2l0eS5TdGF0ZS5wcmVmaXhNYXRjaGVzW3Byb3BlcnR5XSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBbIFZlbG9jaXR5LlN0YXRlLnByZWZpeE1hdGNoZXNbcHJvcGVydHldLCB0cnVlIF07XG5cdCAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciB2ZW5kb3JzID0gWyBcIlwiLCBcIldlYmtpdFwiLCBcIk1velwiLCBcIm1zXCIsIFwiT1wiIF07XG5cblx0ICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgdmVuZG9yc0xlbmd0aCA9IHZlbmRvcnMubGVuZ3RoOyBpIDwgdmVuZG9yc0xlbmd0aDsgaSsrKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0eVByZWZpeGVkO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpID09PSAwKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVByZWZpeGVkID0gcHJvcGVydHk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDYXBpdGFsaXplIHRoZSBmaXJzdCBsZXR0ZXIgb2YgdGhlIHByb3BlcnR5IHRvIGNvbmZvcm0gdG8gSmF2YVNjcmlwdCB2ZW5kb3IgcHJlZml4IG5vdGF0aW9uIChlLmcuIHdlYmtpdEZpbHRlcikuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVByZWZpeGVkID0gdmVuZG9yc1tpXSArIHByb3BlcnR5LnJlcGxhY2UoL15cXHcvLCBmdW5jdGlvbihtYXRjaCkgeyByZXR1cm4gbWF0Y2gudG9VcHBlckNhc2UoKTsgfSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBDaGVjayBpZiB0aGUgYnJvd3NlciBzdXBwb3J0cyB0aGlzIHByb3BlcnR5IGFzIHByZWZpeGVkLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoVHlwZS5pc1N0cmluZyhWZWxvY2l0eS5TdGF0ZS5wcmVmaXhFbGVtZW50LnN0eWxlW3Byb3BlcnR5UHJlZml4ZWRdKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQ2FjaGUgdGhlIG1hdGNoLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuU3RhdGUucHJlZml4TWF0Y2hlc1twcm9wZXJ0eV0gPSBwcm9wZXJ0eVByZWZpeGVkO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWyBwcm9wZXJ0eVByZWZpeGVkLCB0cnVlIF07XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgYnJvd3NlciBkb2Vzbid0IHN1cHBvcnQgdGhpcyBwcm9wZXJ0eSBpbiBhbnkgZm9ybSwgaW5jbHVkZSBhIGZhbHNlIGZsYWcgc28gdGhhdCB0aGUgY2FsbGVyIGNhbiBkZWNpZGUgaG93IHRvIHByb2NlZWQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsgcHJvcGVydHksIGZhbHNlIF07XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgIENTUyBQcm9wZXJ0eSBWYWx1ZXNcblx0ICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICBWYWx1ZXM6IHtcblx0ICAgICAgICAgICAgLyogSGV4IHRvIFJHQiBjb252ZXJzaW9uLiBDb3B5cmlnaHQgVGltIERvd246IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNTYyMzgzOC9yZ2ItdG8taGV4LWFuZC1oZXgtdG8tcmdiICovXG5cdCAgICAgICAgICAgIGhleFRvUmdiOiBmdW5jdGlvbiAoaGV4KSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgc2hvcnRmb3JtUmVnZXggPSAvXiM/KFthLWZcXGRdKShbYS1mXFxkXSkoW2EtZlxcZF0pJC9pLFxuXHQgICAgICAgICAgICAgICAgICAgIGxvbmdmb3JtUmVnZXggPSAvXiM/KFthLWZcXGRdezJ9KShbYS1mXFxkXXsyfSkoW2EtZlxcZF17Mn0pJC9pLFxuXHQgICAgICAgICAgICAgICAgICAgIHJnYlBhcnRzO1xuXG5cdCAgICAgICAgICAgICAgICBoZXggPSBoZXgucmVwbGFjZShzaG9ydGZvcm1SZWdleCwgZnVuY3Rpb24gKG0sIHIsIGcsIGIpIHtcblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gciArIHIgKyBnICsgZyArIGIgKyBiO1xuXHQgICAgICAgICAgICAgICAgfSk7XG5cblx0ICAgICAgICAgICAgICAgIHJnYlBhcnRzID0gbG9uZ2Zvcm1SZWdleC5leGVjKGhleCk7XG5cblx0ICAgICAgICAgICAgICAgIHJldHVybiByZ2JQYXJ0cyA/IFsgcGFyc2VJbnQocmdiUGFydHNbMV0sIDE2KSwgcGFyc2VJbnQocmdiUGFydHNbMl0sIDE2KSwgcGFyc2VJbnQocmdiUGFydHNbM10sIDE2KSBdIDogWyAwLCAwLCAwIF07XG5cdCAgICAgICAgICAgIH0sXG5cblx0ICAgICAgICAgICAgaXNDU1NOdWxsVmFsdWU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHQgICAgICAgICAgICAgICAgLyogVGhlIGJyb3dzZXIgZGVmYXVsdHMgQ1NTIHZhbHVlcyB0aGF0IGhhdmUgbm90IGJlZW4gc2V0IHRvIGVpdGhlciAwIG9yIG9uZSBvZiBzZXZlcmFsIHBvc3NpYmxlIG51bGwtdmFsdWUgc3RyaW5ncy5cblx0ICAgICAgICAgICAgICAgICAgIFRodXMsIHdlIGNoZWNrIGZvciBib3RoIGZhbHNpbmVzcyBhbmQgdGhlc2Ugc3BlY2lhbCBzdHJpbmdzLiAqL1xuXHQgICAgICAgICAgICAgICAgLyogTnVsbC12YWx1ZSBjaGVja2luZyBpcyBwZXJmb3JtZWQgdG8gZGVmYXVsdCB0aGUgc3BlY2lhbCBzdHJpbmdzIHRvIDAgKGZvciB0aGUgc2FrZSBvZiB0d2VlbmluZykgb3IgdGhlaXIgaG9va1xuXHQgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVzIGFzIGRlZmluZWQgYXMgQ1NTLkhvb2tzIChmb3IgdGhlIHNha2Ugb2YgaG9vayBpbmplY3Rpb24vZXh0cmFjdGlvbikuICovXG5cdCAgICAgICAgICAgICAgICAvKiBOb3RlOiBDaHJvbWUgcmV0dXJucyBcInJnYmEoMCwgMCwgMCwgMClcIiBmb3IgYW4gdW5kZWZpbmVkIGNvbG9yIHdoZXJlYXMgSUUgcmV0dXJucyBcInRyYW5zcGFyZW50XCIuICovXG5cdCAgICAgICAgICAgICAgICByZXR1cm4gKHZhbHVlID09IDAgfHwgL14obm9uZXxhdXRvfHRyYW5zcGFyZW50fChyZ2JhXFwoMCwgPzAsID8wLCA/MFxcKSkpJC9pLnRlc3QodmFsdWUpKTtcblx0ICAgICAgICAgICAgfSxcblxuXHQgICAgICAgICAgICAvKiBSZXRyaWV2ZSBhIHByb3BlcnR5J3MgZGVmYXVsdCB1bml0IHR5cGUuIFVzZWQgZm9yIGFzc2lnbmluZyBhIHVuaXQgdHlwZSB3aGVuIG9uZSBpcyBub3Qgc3VwcGxpZWQgYnkgdGhlIHVzZXIuICovXG5cdCAgICAgICAgICAgIGdldFVuaXRUeXBlOiBmdW5jdGlvbiAocHJvcGVydHkpIHtcblx0ICAgICAgICAgICAgICAgIGlmICgvXihyb3RhdGV8c2tldykvaS50ZXN0KHByb3BlcnR5KSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBcImRlZ1wiO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvKF4oc2NhbGV8c2NhbGVYfHNjYWxlWXxzY2FsZVp8YWxwaGF8ZmxleEdyb3d8ZmxleEhlaWdodHx6SW5kZXh8Zm9udFdlaWdodCkkKXwoKG9wYWNpdHl8cmVkfGdyZWVufGJsdWV8YWxwaGEpJCkvaS50ZXN0KHByb3BlcnR5KSkge1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIFRoZSBhYm92ZSBwcm9wZXJ0aWVzIGFyZSB1bml0bGVzcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogRGVmYXVsdCB0byBweCBmb3IgYWxsIG90aGVyIHByb3BlcnRpZXMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwicHhcIjtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfSxcblxuXHQgICAgICAgICAgICAvKiBIVE1MIGVsZW1lbnRzIGRlZmF1bHQgdG8gYW4gYXNzb2NpYXRlZCBkaXNwbGF5IHR5cGUgd2hlbiB0aGV5J3JlIG5vdCBzZXQgdG8gZGlzcGxheTpub25lLiAqL1xuXHQgICAgICAgICAgICAvKiBOb3RlOiBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgZm9yIGNvcnJlY3RseSBzZXR0aW5nIHRoZSBub24tXCJub25lXCIgZGlzcGxheSB2YWx1ZSBpbiBjZXJ0YWluIFZlbG9jaXR5IHJlZGlyZWN0cywgc3VjaCBhcyBmYWRlSW4vT3V0LiAqL1xuXHQgICAgICAgICAgICBnZXREaXNwbGF5VHlwZTogZnVuY3Rpb24gKGVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgICAgIHZhciB0YWdOYW1lID0gZWxlbWVudCAmJiBlbGVtZW50LnRhZ05hbWUudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpO1xuXG5cdCAgICAgICAgICAgICAgICBpZiAoL14oYnxiaWd8aXxzbWFsbHx0dHxhYmJyfGFjcm9ueW18Y2l0ZXxjb2RlfGRmbnxlbXxrYmR8c3Ryb25nfHNhbXB8dmFyfGF8YmRvfGJyfGltZ3xtYXB8b2JqZWN0fHF8c2NyaXB0fHNwYW58c3VifHN1cHxidXR0b258aW5wdXR8bGFiZWx8c2VsZWN0fHRleHRhcmVhKSQvaS50ZXN0KHRhZ05hbWUpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiaW5saW5lXCI7XG5cdCAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC9eKGxpKSQvaS50ZXN0KHRhZ05hbWUpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwibGlzdC1pdGVtXCI7XG5cdCAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC9eKHRyKSQvaS50ZXN0KHRhZ05hbWUpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwidGFibGUtcm93XCI7XG5cdCAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC9eKHRhYmxlKSQvaS50ZXN0KHRhZ05hbWUpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwidGFibGVcIjtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoL14odGJvZHkpJC9pLnRlc3QodGFnTmFtZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJ0YWJsZS1yb3ctZ3JvdXBcIjtcblx0ICAgICAgICAgICAgICAgIC8qIERlZmF1bHQgdG8gXCJibG9ja1wiIHdoZW4gbm8gbWF0Y2ggaXMgZm91bmQuICovXG5cdCAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBcImJsb2NrXCI7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH0sXG5cblx0ICAgICAgICAgICAgLyogVGhlIGNsYXNzIGFkZC9yZW1vdmUgZnVuY3Rpb25zIGFyZSB1c2VkIHRvIHRlbXBvcmFyaWx5IGFwcGx5IGEgXCJ2ZWxvY2l0eS1hbmltYXRpbmdcIiBjbGFzcyB0byBlbGVtZW50cyB3aGlsZSB0aGV5J3JlIGFuaW1hdGluZy4gKi9cblx0ICAgICAgICAgICAgYWRkQ2xhc3M6IGZ1bmN0aW9uIChlbGVtZW50LCBjbGFzc05hbWUpIHtcblx0ICAgICAgICAgICAgICAgIGlmIChlbGVtZW50LmNsYXNzTGlzdCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpO1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmNsYXNzTmFtZSArPSAoZWxlbWVudC5jbGFzc05hbWUubGVuZ3RoID8gXCIgXCIgOiBcIlwiKSArIGNsYXNzTmFtZTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfSxcblxuXHQgICAgICAgICAgICByZW1vdmVDbGFzczogZnVuY3Rpb24gKGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuXHQgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQuY2xhc3NMaXN0KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzTmFtZSk7XG5cdCAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gZWxlbWVudC5jbGFzc05hbWUudG9TdHJpbmcoKS5yZXBsYWNlKG5ldyBSZWdFeHAoXCIoXnxcXFxccylcIiArIGNsYXNzTmFtZS5zcGxpdChcIiBcIikuam9pbihcInxcIikgKyBcIihcXFxcc3wkKVwiLCBcImdpXCIpLCBcIiBcIik7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICBTdHlsZSBHZXR0aW5nICYgU2V0dGluZ1xuXHQgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAvKiBUaGUgc2luZ3VsYXIgZ2V0UHJvcGVydHlWYWx1ZSwgd2hpY2ggcm91dGVzIHRoZSBsb2dpYyBmb3IgYWxsIG5vcm1hbGl6YXRpb25zLCBob29rcywgYW5kIHN0YW5kYXJkIENTUyBwcm9wZXJ0aWVzLiAqL1xuXHQgICAgICAgIGdldFByb3BlcnR5VmFsdWU6IGZ1bmN0aW9uIChlbGVtZW50LCBwcm9wZXJ0eSwgcm9vdFByb3BlcnR5VmFsdWUsIGZvcmNlU3R5bGVMb29rdXApIHtcblx0ICAgICAgICAgICAgLyogR2V0IGFuIGVsZW1lbnQncyBjb21wdXRlZCBwcm9wZXJ0eSB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgLyogTm90ZTogUmV0cmlldmluZyB0aGUgdmFsdWUgb2YgYSBDU1MgcHJvcGVydHkgY2Fubm90IHNpbXBseSBiZSBwZXJmb3JtZWQgYnkgY2hlY2tpbmcgYW4gZWxlbWVudCdzXG5cdCAgICAgICAgICAgICAgIHN0eWxlIGF0dHJpYnV0ZSAod2hpY2ggb25seSByZWZsZWN0cyB1c2VyLWRlZmluZWQgdmFsdWVzKS4gSW5zdGVhZCwgdGhlIGJyb3dzZXIgbXVzdCBiZSBxdWVyaWVkIGZvciBhIHByb3BlcnR5J3Ncblx0ICAgICAgICAgICAgICAgKmNvbXB1dGVkKiB2YWx1ZS4gWW91IGNhbiByZWFkIG1vcmUgYWJvdXQgZ2V0Q29tcHV0ZWRTdHlsZSBoZXJlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9kb2NzL1dlYi9BUEkvd2luZG93LmdldENvbXB1dGVkU3R5bGUgKi9cblx0ICAgICAgICAgICAgZnVuY3Rpb24gY29tcHV0ZVByb3BlcnR5VmFsdWUgKGVsZW1lbnQsIHByb3BlcnR5KSB7XG5cdCAgICAgICAgICAgICAgICAvKiBXaGVuIGJveC1zaXppbmcgaXNuJ3Qgc2V0IHRvIGJvcmRlci1ib3gsIGhlaWdodCBhbmQgd2lkdGggc3R5bGUgdmFsdWVzIGFyZSBpbmNvcnJlY3RseSBjb21wdXRlZCB3aGVuIGFuXG5cdCAgICAgICAgICAgICAgICAgICBlbGVtZW50J3Mgc2Nyb2xsYmFycyBhcmUgdmlzaWJsZSAod2hpY2ggZXhwYW5kcyB0aGUgZWxlbWVudCdzIGRpbWVuc2lvbnMpLiBUaHVzLCB3ZSBkZWZlciB0byB0aGUgbW9yZSBhY2N1cmF0ZVxuXHQgICAgICAgICAgICAgICAgICAgb2Zmc2V0SGVpZ2h0L1dpZHRoIHByb3BlcnR5LCB3aGljaCBpbmNsdWRlcyB0aGUgdG90YWwgZGltZW5zaW9ucyBmb3IgaW50ZXJpb3IsIGJvcmRlciwgcGFkZGluZywgYW5kIHNjcm9sbGJhci5cblx0ICAgICAgICAgICAgICAgICAgIFdlIHN1YnRyYWN0IGJvcmRlciBhbmQgcGFkZGluZyB0byBnZXQgdGhlIHN1bSBvZiBpbnRlcmlvciArIHNjcm9sbGJhci4gKi9cblx0ICAgICAgICAgICAgICAgIHZhciBjb21wdXRlZFZhbHVlID0gMDtcblxuXHQgICAgICAgICAgICAgICAgLyogSUU8PTggZG9lc24ndCBzdXBwb3J0IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlLCB0aHVzIHdlIGRlZmVyIHRvIGpRdWVyeSwgd2hpY2ggaGFzIGFuIGV4dGVuc2l2ZSBhcnJheVxuXHQgICAgICAgICAgICAgICAgICAgb2YgaGFja3MgdG8gYWNjdXJhdGVseSByZXRyaWV2ZSBJRTggcHJvcGVydHkgdmFsdWVzLiBSZS1pbXBsZW1lbnRpbmcgdGhhdCBsb2dpYyBoZXJlIGlzIG5vdCB3b3J0aCBibG9hdGluZyB0aGVcblx0ICAgICAgICAgICAgICAgICAgIGNvZGViYXNlIGZvciBhIGR5aW5nIGJyb3dzZXIuIFRoZSBwZXJmb3JtYW5jZSByZXBlcmN1c3Npb25zIG9mIHVzaW5nIGpRdWVyeSBoZXJlIGFyZSBtaW5pbWFsIHNpbmNlXG5cdCAgICAgICAgICAgICAgICAgICBWZWxvY2l0eSBpcyBvcHRpbWl6ZWQgdG8gcmFyZWx5IChhbmQgc29tZXRpbWVzIG5ldmVyKSBxdWVyeSB0aGUgRE9NLiBGdXJ0aGVyLCB0aGUgJC5jc3MoKSBjb2RlcGF0aCBpc24ndCB0aGF0IHNsb3cuICovXG5cdCAgICAgICAgICAgICAgICBpZiAoSUUgPD0gOCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkVmFsdWUgPSAkLmNzcyhlbGVtZW50LCBwcm9wZXJ0eSk7IC8qIEdFVCAqL1xuXHQgICAgICAgICAgICAgICAgLyogQWxsIG90aGVyIGJyb3dzZXJzIHN1cHBvcnQgZ2V0Q29tcHV0ZWRTdHlsZS4gVGhlIHJldHVybmVkIGxpdmUgb2JqZWN0IHJlZmVyZW5jZSBpcyBjYWNoZWQgb250byBpdHNcblx0ICAgICAgICAgICAgICAgICAgIGFzc29jaWF0ZWQgZWxlbWVudCBzbyB0aGF0IGl0IGRvZXMgbm90IG5lZWQgdG8gYmUgcmVmZXRjaGVkIHVwb24gZXZlcnkgR0VULiAqL1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAvKiBCcm93c2VycyBkbyBub3QgcmV0dXJuIGhlaWdodCBhbmQgd2lkdGggdmFsdWVzIGZvciBlbGVtZW50cyB0aGF0IGFyZSBzZXQgdG8gZGlzcGxheTpcIm5vbmVcIi4gVGh1cywgd2UgdGVtcG9yYXJpbHlcblx0ICAgICAgICAgICAgICAgICAgICAgICB0b2dnbGUgZGlzcGxheSB0byB0aGUgZWxlbWVudCB0eXBlJ3MgZGVmYXVsdCB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICB2YXIgdG9nZ2xlRGlzcGxheSA9IGZhbHNlO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKC9eKHdpZHRofGhlaWdodCkkLy50ZXN0KHByb3BlcnR5KSAmJiBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImRpc3BsYXlcIikgPT09IDApIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdG9nZ2xlRGlzcGxheSA9IHRydWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIENTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiZGlzcGxheVwiLCBDU1MuVmFsdWVzLmdldERpc3BsYXlUeXBlKGVsZW1lbnQpKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiByZXZlcnREaXNwbGF5ICgpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRvZ2dsZURpc3BsYXkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIENTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoIWZvcmNlU3R5bGVMb29rdXApIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5ID09PSBcImhlaWdodFwiICYmIENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiYm94U2l6aW5nXCIpLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSAhPT0gXCJib3JkZXItYm94XCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb250ZW50Qm94SGVpZ2h0ID0gZWxlbWVudC5vZmZzZXRIZWlnaHQgLSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImJvcmRlclRvcFdpZHRoXCIpKSB8fCAwKSAtIChwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiYm9yZGVyQm90dG9tV2lkdGhcIikpIHx8IDApIC0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJwYWRkaW5nVG9wXCIpKSB8fCAwKSAtIChwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwicGFkZGluZ0JvdHRvbVwiKSkgfHwgMCk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXZlcnREaXNwbGF5KCk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZW50Qm94SGVpZ2h0O1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnR5ID09PSBcIndpZHRoXCIgJiYgQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJib3hTaXppbmdcIikudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpICE9PSBcImJvcmRlci1ib3hcIikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbnRlbnRCb3hXaWR0aCA9IGVsZW1lbnQub2Zmc2V0V2lkdGggLSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImJvcmRlckxlZnRXaWR0aFwiKSkgfHwgMCkgLSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImJvcmRlclJpZ2h0V2lkdGhcIikpIHx8IDApIC0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJwYWRkaW5nTGVmdFwiKSkgfHwgMCkgLSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcInBhZGRpbmdSaWdodFwiKSkgfHwgMCk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXZlcnREaXNwbGF5KCk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb250ZW50Qm94V2lkdGg7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICB2YXIgY29tcHV0ZWRTdHlsZTtcblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIEZvciBlbGVtZW50cyB0aGF0IFZlbG9jaXR5IGhhc24ndCBiZWVuIGNhbGxlZCBvbiBkaXJlY3RseSAoZS5nLiB3aGVuIFZlbG9jaXR5IHF1ZXJpZXMgdGhlIERPTSBvbiBiZWhhbGZcblx0ICAgICAgICAgICAgICAgICAgICAgICBvZiBhIHBhcmVudCBvZiBhbiBlbGVtZW50IGl0cyBhbmltYXRpbmcpLCBwZXJmb3JtIGEgZGlyZWN0IGdldENvbXB1dGVkU3R5bGUgbG9va3VwIHNpbmNlIHRoZSBvYmplY3QgaXNuJ3QgY2FjaGVkLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWRTdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQsIG51bGwpOyAvKiBHRVQgKi9cblx0ICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgY29tcHV0ZWRTdHlsZSBvYmplY3QgaGFzIHlldCB0byBiZSBjYWNoZWQsIGRvIHNvIG5vdy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFEYXRhKGVsZW1lbnQpLmNvbXB1dGVkU3R5bGUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWRTdHlsZSA9IERhdGEoZWxlbWVudCkuY29tcHV0ZWRTdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQsIG51bGwpOyAvKiBHRVQgKi9cblx0ICAgICAgICAgICAgICAgICAgICAvKiBJZiBjb21wdXRlZFN0eWxlIGlzIGNhY2hlZCwgdXNlIGl0LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkU3R5bGUgPSBEYXRhKGVsZW1lbnQpLmNvbXB1dGVkU3R5bGU7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogSUUgYW5kIEZpcmVmb3ggZG8gbm90IHJldHVybiBhIHZhbHVlIGZvciB0aGUgZ2VuZXJpYyBib3JkZXJDb2xvciAtLSB0aGV5IG9ubHkgcmV0dXJuIGluZGl2aWR1YWwgdmFsdWVzIGZvciBlYWNoIGJvcmRlciBzaWRlJ3MgY29sb3IuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgQWxzbywgaW4gYWxsIGJyb3dzZXJzLCB3aGVuIGJvcmRlciBjb2xvcnMgYXJlbid0IGFsbCB0aGUgc2FtZSwgYSBjb21wb3VuZCB2YWx1ZSBpcyByZXR1cm5lZCB0aGF0IFZlbG9jaXR5IGlzbid0IHNldHVwIHRvIHBhcnNlLlxuXHQgICAgICAgICAgICAgICAgICAgICAgIFNvLCBhcyBhIHBvbHlmaWxsIGZvciBxdWVyeWluZyBpbmRpdmlkdWFsIGJvcmRlciBzaWRlIGNvbG9ycywgd2UganVzdCByZXR1cm4gdGhlIHRvcCBib3JkZXIncyBjb2xvciBhbmQgYW5pbWF0ZSBhbGwgYm9yZGVycyBmcm9tIHRoYXQgdmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5ID09PSBcImJvcmRlckNvbG9yXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHkgPSBcImJvcmRlclRvcENvbG9yXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogSUU5IGhhcyBhIGJ1ZyBpbiB3aGljaCB0aGUgXCJmaWx0ZXJcIiBwcm9wZXJ0eSBtdXN0IGJlIGFjY2Vzc2VkIGZyb20gY29tcHV0ZWRTdHlsZSB1c2luZyB0aGUgZ2V0UHJvcGVydHlWYWx1ZSBtZXRob2Rcblx0ICAgICAgICAgICAgICAgICAgICAgICBpbnN0ZWFkIG9mIGEgZGlyZWN0IHByb3BlcnR5IGxvb2t1cC4gVGhlIGdldFByb3BlcnR5VmFsdWUgbWV0aG9kIGlzIHNsb3dlciB0aGFuIGEgZGlyZWN0IGxvb2t1cCwgd2hpY2ggaXMgd2h5IHdlIGF2b2lkIGl0IGJ5IGRlZmF1bHQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKElFID09PSA5ICYmIHByb3BlcnR5ID09PSBcImZpbHRlclwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNvbXB1dGVkVmFsdWUgPSBjb21wdXRlZFN0eWxlLmdldFByb3BlcnR5VmFsdWUocHJvcGVydHkpOyAvKiBHRVQgKi9cblx0ICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjb21wdXRlZFZhbHVlID0gY29tcHV0ZWRTdHlsZVtwcm9wZXJ0eV07XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogRmFsbCBiYWNrIHRvIHRoZSBwcm9wZXJ0eSdzIHN0eWxlIHZhbHVlIChpZiBkZWZpbmVkKSB3aGVuIGNvbXB1dGVkVmFsdWUgcmV0dXJucyBub3RoaW5nLFxuXHQgICAgICAgICAgICAgICAgICAgICAgIHdoaWNoIGNhbiBoYXBwZW4gd2hlbiB0aGUgZWxlbWVudCBoYXNuJ3QgYmVlbiBwYWludGVkLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChjb21wdXRlZFZhbHVlID09PSBcIlwiIHx8IGNvbXB1dGVkVmFsdWUgPT09IG51bGwpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWRWYWx1ZSA9IGVsZW1lbnQuc3R5bGVbcHJvcGVydHldO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIHJldmVydERpc3BsYXkoKTtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgLyogRm9yIHRvcCwgcmlnaHQsIGJvdHRvbSwgYW5kIGxlZnQgKFRSQkwpIHZhbHVlcyB0aGF0IGFyZSBzZXQgdG8gXCJhdXRvXCIgb24gZWxlbWVudHMgb2YgXCJmaXhlZFwiIG9yIFwiYWJzb2x1dGVcIiBwb3NpdGlvbixcblx0ICAgICAgICAgICAgICAgICAgIGRlZmVyIHRvIGpRdWVyeSBmb3IgY29udmVydGluZyBcImF1dG9cIiB0byBhIG51bWVyaWMgdmFsdWUuIChGb3IgZWxlbWVudHMgd2l0aCBhIFwic3RhdGljXCIgb3IgXCJyZWxhdGl2ZVwiIHBvc2l0aW9uLCBcImF1dG9cIiBoYXMgdGhlIHNhbWVcblx0ICAgICAgICAgICAgICAgICAgIGVmZmVjdCBhcyBiZWluZyBzZXQgdG8gMCwgc28gbm8gY29udmVyc2lvbiBpcyBuZWNlc3NhcnkuKSAqL1xuXHQgICAgICAgICAgICAgICAgLyogQW4gZXhhbXBsZSBvZiB3aHkgbnVtZXJpYyBjb252ZXJzaW9uIGlzIG5lY2Vzc2FyeTogV2hlbiBhbiBlbGVtZW50IHdpdGggXCJwb3NpdGlvbjphYnNvbHV0ZVwiIGhhcyBhbiB1bnRvdWNoZWQgXCJsZWZ0XCJcblx0ICAgICAgICAgICAgICAgICAgIHByb3BlcnR5LCB3aGljaCByZXZlcnRzIHRvIFwiYXV0b1wiLCBsZWZ0J3MgdmFsdWUgaXMgMCByZWxhdGl2ZSB0byBpdHMgcGFyZW50IGVsZW1lbnQsIGJ1dCBpcyBvZnRlbiBub24temVybyByZWxhdGl2ZVxuXHQgICAgICAgICAgICAgICAgICAgdG8gaXRzICpjb250YWluaW5nKiAobm90IHBhcmVudCkgZWxlbWVudCwgd2hpY2ggaXMgdGhlIG5lYXJlc3QgXCJwb3NpdGlvbjpyZWxhdGl2ZVwiIGFuY2VzdG9yIG9yIHRoZSB2aWV3cG9ydCAoYW5kIGFsd2F5cyB0aGUgdmlld3BvcnQgaW4gdGhlIGNhc2Ugb2YgXCJwb3NpdGlvbjpmaXhlZFwiKS4gKi9cblx0ICAgICAgICAgICAgICAgIGlmIChjb21wdXRlZFZhbHVlID09PSBcImF1dG9cIiAmJiAvXih0b3B8cmlnaHR8Ym90dG9tfGxlZnQpJC9pLnRlc3QocHJvcGVydHkpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIHBvc2l0aW9uID0gY29tcHV0ZVByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJwb3NpdGlvblwiKTsgLyogR0VUICovXG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBGb3IgYWJzb2x1dGUgcG9zaXRpb25pbmcsIGpRdWVyeSdzICQucG9zaXRpb24oKSBvbmx5IHJldHVybnMgdmFsdWVzIGZvciB0b3AgYW5kIGxlZnQ7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgcmlnaHQgYW5kIGJvdHRvbSB3aWxsIGhhdmUgdGhlaXIgXCJhdXRvXCIgdmFsdWUgcmV2ZXJ0ZWQgdG8gMC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBBIGpRdWVyeSBvYmplY3QgbXVzdCBiZSBjcmVhdGVkIGhlcmUgc2luY2UgalF1ZXJ5IGRvZXNuJ3QgaGF2ZSBhIGxvdy1sZXZlbCBhbGlhcyBmb3IgJC5wb3NpdGlvbigpLlxuXHQgICAgICAgICAgICAgICAgICAgICAgIE5vdCBhIGJpZyBkZWFsIHNpbmNlIHdlJ3JlIGN1cnJlbnRseSBpbiBhIEdFVCBiYXRjaCBhbnl3YXkuICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKHBvc2l0aW9uID09PSBcImZpeGVkXCIgfHwgKHBvc2l0aW9uID09PSBcImFic29sdXRlXCIgJiYgL3RvcHxsZWZ0L2kudGVzdChwcm9wZXJ0eSkpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IGpRdWVyeSBzdHJpcHMgdGhlIHBpeGVsIHVuaXQgZnJvbSBpdHMgcmV0dXJuZWQgdmFsdWVzOyB3ZSByZS1hZGQgaXQgaGVyZSB0byBjb25mb3JtIHdpdGggY29tcHV0ZVByb3BlcnR5VmFsdWUncyBiZWhhdmlvci4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgY29tcHV0ZWRWYWx1ZSA9ICQoZWxlbWVudCkucG9zaXRpb24oKVtwcm9wZXJ0eV0gKyBcInB4XCI7IC8qIEdFVCAqL1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgcmV0dXJuIGNvbXB1dGVkVmFsdWU7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICB2YXIgcHJvcGVydHlWYWx1ZTtcblxuXHQgICAgICAgICAgICAvKiBJZiB0aGlzIGlzIGEgaG9va2VkIHByb3BlcnR5IChlLmcuIFwiY2xpcExlZnRcIiBpbnN0ZWFkIG9mIHRoZSByb290IHByb3BlcnR5IG9mIFwiY2xpcFwiKSxcblx0ICAgICAgICAgICAgICAgZXh0cmFjdCB0aGUgaG9vaydzIHZhbHVlIGZyb20gYSBub3JtYWxpemVkIHJvb3RQcm9wZXJ0eVZhbHVlIHVzaW5nIENTUy5Ib29rcy5leHRyYWN0VmFsdWUoKS4gKi9cblx0ICAgICAgICAgICAgaWYgKENTUy5Ib29rcy5yZWdpc3RlcmVkW3Byb3BlcnR5XSkge1xuXHQgICAgICAgICAgICAgICAgdmFyIGhvb2sgPSBwcm9wZXJ0eSxcblx0ICAgICAgICAgICAgICAgICAgICBob29rUm9vdCA9IENTUy5Ib29rcy5nZXRSb290KGhvb2spO1xuXG5cdCAgICAgICAgICAgICAgICAvKiBJZiBhIGNhY2hlZCByb290UHJvcGVydHlWYWx1ZSB3YXNuJ3QgcGFzc2VkIGluICh3aGljaCBWZWxvY2l0eSBhbHdheXMgYXR0ZW1wdHMgdG8gZG8gaW4gb3JkZXIgdG8gYXZvaWQgcmVxdWVyeWluZyB0aGUgRE9NKSxcblx0ICAgICAgICAgICAgICAgICAgIHF1ZXJ5IHRoZSBET00gZm9yIHRoZSByb290IHByb3BlcnR5J3MgdmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICBpZiAocm9vdFByb3BlcnR5VmFsdWUgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIFNpbmNlIHRoZSBicm93c2VyIGlzIG5vdyBiZWluZyBkaXJlY3RseSBxdWVyaWVkLCB1c2UgdGhlIG9mZmljaWFsIHBvc3QtcHJlZml4aW5nIHByb3BlcnR5IG5hbWUgZm9yIHRoaXMgbG9va3VwLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlID0gQ1NTLmdldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgQ1NTLk5hbWVzLnByZWZpeENoZWNrKGhvb2tSb290KVswXSk7IC8qIEdFVCAqL1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAvKiBJZiB0aGlzIHJvb3QgaGFzIGEgbm9ybWFsaXphdGlvbiByZWdpc3RlcmVkLCBwZWZvcm0gdGhlIGFzc29jaWF0ZWQgbm9ybWFsaXphdGlvbiBleHRyYWN0aW9uLiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW2hvb2tSb290XSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlID0gQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbaG9va1Jvb3RdKFwiZXh0cmFjdFwiLCBlbGVtZW50LCByb290UHJvcGVydHlWYWx1ZSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIC8qIEV4dHJhY3QgdGhlIGhvb2sncyB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSBDU1MuSG9va3MuZXh0cmFjdFZhbHVlKGhvb2ssIHJvb3RQcm9wZXJ0eVZhbHVlKTtcblxuXHQgICAgICAgICAgICAvKiBJZiB0aGlzIGlzIGEgbm9ybWFsaXplZCBwcm9wZXJ0eSAoZS5nLiBcIm9wYWNpdHlcIiBiZWNvbWVzIFwiZmlsdGVyXCIgaW4gPD1JRTgpIG9yIFwidHJhbnNsYXRlWFwiIGJlY29tZXMgXCJ0cmFuc2Zvcm1cIiksXG5cdCAgICAgICAgICAgICAgIG5vcm1hbGl6ZSB0aGUgcHJvcGVydHkncyBuYW1lIGFuZCB2YWx1ZSwgYW5kIGhhbmRsZSB0aGUgc3BlY2lhbCBjYXNlIG9mIHRyYW5zZm9ybXMuICovXG5cdCAgICAgICAgICAgIC8qIE5vdGU6IE5vcm1hbGl6aW5nIGEgcHJvcGVydHkgaXMgbXV0dWFsbHkgZXhjbHVzaXZlIGZyb20gaG9va2luZyBhIHByb3BlcnR5IHNpbmNlIGhvb2stZXh0cmFjdGVkIHZhbHVlcyBhcmUgc3RyaWN0bHlcblx0ICAgICAgICAgICAgICAgbnVtZXJpY2FsIGFuZCB0aGVyZWZvcmUgZG8gbm90IHJlcXVpcmUgbm9ybWFsaXphdGlvbiBleHRyYWN0aW9uLiAqL1xuXHQgICAgICAgICAgICB9IGVsc2UgaWYgKENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3Byb3BlcnR5XSkge1xuXHQgICAgICAgICAgICAgICAgdmFyIG5vcm1hbGl6ZWRQcm9wZXJ0eU5hbWUsXG5cdCAgICAgICAgICAgICAgICAgICAgbm9ybWFsaXplZFByb3BlcnR5VmFsdWU7XG5cblx0ICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRQcm9wZXJ0eU5hbWUgPSBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtwcm9wZXJ0eV0oXCJuYW1lXCIsIGVsZW1lbnQpO1xuXG5cdCAgICAgICAgICAgICAgICAvKiBUcmFuc2Zvcm0gdmFsdWVzIGFyZSBjYWxjdWxhdGVkIHZpYSBub3JtYWxpemF0aW9uIGV4dHJhY3Rpb24gKHNlZSBiZWxvdyksIHdoaWNoIGNoZWNrcyBhZ2FpbnN0IHRoZSBlbGVtZW50J3MgdHJhbnNmb3JtQ2FjaGUuXG5cdCAgICAgICAgICAgICAgICAgICBBdCBubyBwb2ludCBkbyB0cmFuc2Zvcm0gR0VUcyBldmVyIGFjdHVhbGx5IHF1ZXJ5IHRoZSBET007IGluaXRpYWwgc3R5bGVzaGVldCB2YWx1ZXMgYXJlIG5ldmVyIHByb2Nlc3NlZC5cblx0ICAgICAgICAgICAgICAgICAgIFRoaXMgaXMgYmVjYXVzZSBwYXJzaW5nIDNEIHRyYW5zZm9ybSBtYXRyaWNlcyBpcyBub3QgYWx3YXlzIGFjY3VyYXRlIGFuZCB3b3VsZCBibG9hdCBvdXIgY29kZWJhc2U7XG5cdCAgICAgICAgICAgICAgICAgICB0aHVzLCBub3JtYWxpemF0aW9uIGV4dHJhY3Rpb24gZGVmYXVsdHMgaW5pdGlhbCB0cmFuc2Zvcm0gdmFsdWVzIHRvIHRoZWlyIHplcm8tdmFsdWVzIChlLmcuIDEgZm9yIHNjYWxlWCBhbmQgMCBmb3IgdHJhbnNsYXRlWCkuICovXG5cdCAgICAgICAgICAgICAgICBpZiAobm9ybWFsaXplZFByb3BlcnR5TmFtZSAhPT0gXCJ0cmFuc2Zvcm1cIikge1xuXHQgICAgICAgICAgICAgICAgICAgIG5vcm1hbGl6ZWRQcm9wZXJ0eVZhbHVlID0gY29tcHV0ZVByb3BlcnR5VmFsdWUoZWxlbWVudCwgQ1NTLk5hbWVzLnByZWZpeENoZWNrKG5vcm1hbGl6ZWRQcm9wZXJ0eU5hbWUpWzBdKTsgLyogR0VUICovXG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgdmFsdWUgaXMgYSBDU1MgbnVsbC12YWx1ZSBhbmQgdGhpcyBwcm9wZXJ0eSBoYXMgYSBob29rIHRlbXBsYXRlLCB1c2UgdGhhdCB6ZXJvLXZhbHVlIHRlbXBsYXRlIHNvIHRoYXQgaG9va3MgY2FuIGJlIGV4dHJhY3RlZCBmcm9tIGl0LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChDU1MuVmFsdWVzLmlzQ1NTTnVsbFZhbHVlKG5vcm1hbGl6ZWRQcm9wZXJ0eVZhbHVlKSAmJiBDU1MuSG9va3MudGVtcGxhdGVzW3Byb3BlcnR5XSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBub3JtYWxpemVkUHJvcGVydHlWYWx1ZSA9IENTUy5Ib29rcy50ZW1wbGF0ZXNbcHJvcGVydHldWzFdO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3Byb3BlcnR5XShcImV4dHJhY3RcIiwgZWxlbWVudCwgbm9ybWFsaXplZFByb3BlcnR5VmFsdWUpO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLyogSWYgYSAobnVtZXJpYykgdmFsdWUgd2Fzbid0IHByb2R1Y2VkIHZpYSBob29rIGV4dHJhY3Rpb24gb3Igbm9ybWFsaXphdGlvbiwgcXVlcnkgdGhlIERPTS4gKi9cblx0ICAgICAgICAgICAgaWYgKCEvXltcXGQtXS8udGVzdChwcm9wZXJ0eVZhbHVlKSkge1xuXHQgICAgICAgICAgICAgICAgLyogRm9yIFNWRyBlbGVtZW50cywgZGltZW5zaW9uYWwgcHJvcGVydGllcyAod2hpY2ggU1ZHQXR0cmlidXRlKCkgZGV0ZWN0cykgYXJlIHR3ZWVuZWQgdmlhXG5cdCAgICAgICAgICAgICAgICAgICB0aGVpciBIVE1MIGF0dHJpYnV0ZSB2YWx1ZXMgaW5zdGVhZCBvZiB0aGVpciBDU1Mgc3R5bGUgdmFsdWVzLiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkgJiYgRGF0YShlbGVtZW50KS5pc1NWRyAmJiBDU1MuTmFtZXMuU1ZHQXR0cmlidXRlKHByb3BlcnR5KSkge1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIFNpbmNlIHRoZSBoZWlnaHQvd2lkdGggYXR0cmlidXRlIHZhbHVlcyBtdXN0IGJlIHNldCBtYW51YWxseSwgdGhleSBkb24ndCByZWZsZWN0IGNvbXB1dGVkIHZhbHVlcy5cblx0ICAgICAgICAgICAgICAgICAgICAgICBUaHVzLCB3ZSB1c2UgdXNlIGdldEJCb3goKSB0byBlbnN1cmUgd2UgYWx3YXlzIGdldCB2YWx1ZXMgZm9yIGVsZW1lbnRzIHdpdGggdW5kZWZpbmVkIGhlaWdodC93aWR0aCBhdHRyaWJ1dGVzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmICgvXihoZWlnaHR8d2lkdGgpJC9pLnRlc3QocHJvcGVydHkpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIEZpcmVmb3ggdGhyb3dzIGFuIGVycm9yIGlmIC5nZXRCQm94KCkgaXMgY2FsbGVkIG9uIGFuIFNWRyB0aGF0IGlzbid0IGF0dGFjaGVkIHRvIHRoZSBET00uICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gZWxlbWVudC5nZXRCQm94KClbcHJvcGVydHldO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlWYWx1ZSA9IDA7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAvKiBPdGhlcndpc2UsIGFjY2VzcyB0aGUgYXR0cmlidXRlIHZhbHVlIGRpcmVjdGx5LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZShwcm9wZXJ0eSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gY29tcHV0ZVByb3BlcnR5VmFsdWUoZWxlbWVudCwgQ1NTLk5hbWVzLnByZWZpeENoZWNrKHByb3BlcnR5KVswXSk7IC8qIEdFVCAqL1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLyogU2luY2UgcHJvcGVydHkgbG9va3VwcyBhcmUgZm9yIGFuaW1hdGlvbiBwdXJwb3NlcyAod2hpY2ggZW50YWlscyBjb21wdXRpbmcgdGhlIG51bWVyaWMgZGVsdGEgYmV0d2VlbiBzdGFydCBhbmQgZW5kIHZhbHVlcyksXG5cdCAgICAgICAgICAgICAgIGNvbnZlcnQgQ1NTIG51bGwtdmFsdWVzIHRvIGFuIGludGVnZXIgb2YgdmFsdWUgMC4gKi9cblx0ICAgICAgICAgICAgaWYgKENTUy5WYWx1ZXMuaXNDU1NOdWxsVmFsdWUocHJvcGVydHlWYWx1ZSkpIHtcblx0ICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSAwO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgaWYgKFZlbG9jaXR5LmRlYnVnID49IDIpIGNvbnNvbGUubG9nKFwiR2V0IFwiICsgcHJvcGVydHkgKyBcIjogXCIgKyBwcm9wZXJ0eVZhbHVlKTtcblxuXHQgICAgICAgICAgICByZXR1cm4gcHJvcGVydHlWYWx1ZTtcblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgLyogVGhlIHNpbmd1bGFyIHNldFByb3BlcnR5VmFsdWUsIHdoaWNoIHJvdXRlcyB0aGUgbG9naWMgZm9yIGFsbCBub3JtYWxpemF0aW9ucywgaG9va3MsIGFuZCBzdGFuZGFyZCBDU1MgcHJvcGVydGllcy4gKi9cblx0ICAgICAgICBzZXRQcm9wZXJ0eVZhbHVlOiBmdW5jdGlvbihlbGVtZW50LCBwcm9wZXJ0eSwgcHJvcGVydHlWYWx1ZSwgcm9vdFByb3BlcnR5VmFsdWUsIHNjcm9sbERhdGEpIHtcblx0ICAgICAgICAgICAgdmFyIHByb3BlcnR5TmFtZSA9IHByb3BlcnR5O1xuXG5cdCAgICAgICAgICAgIC8qIEluIG9yZGVyIHRvIGJlIHN1YmplY3RlZCB0byBjYWxsIG9wdGlvbnMgYW5kIGVsZW1lbnQgcXVldWVpbmcsIHNjcm9sbCBhbmltYXRpb24gaXMgcm91dGVkIHRocm91Z2ggVmVsb2NpdHkgYXMgaWYgaXQgd2VyZSBhIHN0YW5kYXJkIENTUyBwcm9wZXJ0eS4gKi9cblx0ICAgICAgICAgICAgaWYgKHByb3BlcnR5ID09PSBcInNjcm9sbFwiKSB7XG5cdCAgICAgICAgICAgICAgICAvKiBJZiBhIGNvbnRhaW5lciBvcHRpb24gaXMgcHJlc2VudCwgc2Nyb2xsIHRoZSBjb250YWluZXIgaW5zdGVhZCBvZiB0aGUgYnJvd3NlciB3aW5kb3cuICovXG5cdCAgICAgICAgICAgICAgICBpZiAoc2Nyb2xsRGF0YS5jb250YWluZXIpIHtcblx0ICAgICAgICAgICAgICAgICAgICBzY3JvbGxEYXRhLmNvbnRhaW5lcltcInNjcm9sbFwiICsgc2Nyb2xsRGF0YS5kaXJlY3Rpb25dID0gcHJvcGVydHlWYWx1ZTtcblx0ICAgICAgICAgICAgICAgIC8qIE90aGVyd2lzZSwgVmVsb2NpdHkgZGVmYXVsdHMgdG8gc2Nyb2xsaW5nIHRoZSBicm93c2VyIHdpbmRvdy4gKi9cblx0ICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKHNjcm9sbERhdGEuZGlyZWN0aW9uID09PSBcIkxlZnRcIikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuc2Nyb2xsVG8ocHJvcGVydHlWYWx1ZSwgc2Nyb2xsRGF0YS5hbHRlcm5hdGVWYWx1ZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LnNjcm9sbFRvKHNjcm9sbERhdGEuYWx0ZXJuYXRlVmFsdWUsIHByb3BlcnR5VmFsdWUpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIC8qIFRyYW5zZm9ybXMgKHRyYW5zbGF0ZVgsIHJvdGF0ZVosIGV0Yy4pIGFyZSBhcHBsaWVkIHRvIGEgcGVyLWVsZW1lbnQgdHJhbnNmb3JtQ2FjaGUgb2JqZWN0LCB3aGljaCBpcyBtYW51YWxseSBmbHVzaGVkIHZpYSBmbHVzaFRyYW5zZm9ybUNhY2hlKCkuXG5cdCAgICAgICAgICAgICAgICAgICBUaHVzLCBmb3Igbm93LCB3ZSBtZXJlbHkgY2FjaGUgdHJhbnNmb3JtcyBiZWluZyBTRVQuICovXG5cdCAgICAgICAgICAgICAgICBpZiAoQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbcHJvcGVydHldICYmIENTUy5Ob3JtYWxpemF0aW9ucy5yZWdpc3RlcmVkW3Byb3BlcnR5XShcIm5hbWVcIiwgZWxlbWVudCkgPT09IFwidHJhbnNmb3JtXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAvKiBQZXJmb3JtIGEgbm9ybWFsaXphdGlvbiBpbmplY3Rpb24uICovXG5cdCAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogVGhlIG5vcm1hbGl6YXRpb24gbG9naWMgaGFuZGxlcyB0aGUgdHJhbnNmb3JtQ2FjaGUgdXBkYXRpbmcuICovXG5cdCAgICAgICAgICAgICAgICAgICAgQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbcHJvcGVydHldKFwiaW5qZWN0XCIsIGVsZW1lbnQsIHByb3BlcnR5VmFsdWUpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlOYW1lID0gXCJ0cmFuc2Zvcm1cIjtcblx0ICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVZhbHVlID0gRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZVtwcm9wZXJ0eV07XG5cdCAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIEluamVjdCBob29rcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoQ1NTLkhvb2tzLnJlZ2lzdGVyZWRbcHJvcGVydHldKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHZhciBob29rTmFtZSA9IHByb3BlcnR5LFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaG9va1Jvb3QgPSBDU1MuSG9va3MuZ2V0Um9vdChwcm9wZXJ0eSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgYSBjYWNoZWQgcm9vdFByb3BlcnR5VmFsdWUgd2FzIG5vdCBwcm92aWRlZCwgcXVlcnkgdGhlIERPTSBmb3IgdGhlIGhvb2tSb290J3MgY3VycmVudCB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWUgPSByb290UHJvcGVydHlWYWx1ZSB8fCBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBob29rUm9vdCk7IC8qIEdFVCAqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSBDU1MuSG9va3MuaW5qZWN0VmFsdWUoaG9va05hbWUsIHByb3BlcnR5VmFsdWUsIHJvb3RQcm9wZXJ0eVZhbHVlKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHkgPSBob29rUm9vdDtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBOb3JtYWxpemUgbmFtZXMgYW5kIHZhbHVlcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbcHJvcGVydHldKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5VmFsdWUgPSBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtwcm9wZXJ0eV0oXCJpbmplY3RcIiwgZWxlbWVudCwgcHJvcGVydHlWYWx1ZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5ID0gQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbcHJvcGVydHldKFwibmFtZVwiLCBlbGVtZW50KTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBBc3NpZ24gdGhlIGFwcHJvcHJpYXRlIHZlbmRvciBwcmVmaXggYmVmb3JlIHBlcmZvcm1pbmcgYW4gb2ZmaWNpYWwgc3R5bGUgdXBkYXRlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5TmFtZSA9IENTUy5OYW1lcy5wcmVmaXhDaGVjayhwcm9wZXJ0eSlbMF07XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBBIHRyeS9jYXRjaCBpcyB1c2VkIGZvciBJRTw9OCwgd2hpY2ggdGhyb3dzIGFuIGVycm9yIHdoZW4gXCJpbnZhbGlkXCIgQ1NTIHZhbHVlcyBhcmUgc2V0LCBlLmcuIGEgbmVnYXRpdmUgd2lkdGguXG5cdCAgICAgICAgICAgICAgICAgICAgICAgVHJ5L2NhdGNoIGlzIGF2b2lkZWQgZm9yIG90aGVyIGJyb3dzZXJzIHNpbmNlIGl0IGluY3VycyBhIHBlcmZvcm1hbmNlIG92ZXJoZWFkLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChJRSA8PSA4KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnN0eWxlW3Byb3BlcnR5TmFtZV0gPSBwcm9wZXJ0eVZhbHVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikgeyBpZiAoVmVsb2NpdHkuZGVidWcpIGNvbnNvbGUubG9nKFwiQnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IFtcIiArIHByb3BlcnR5VmFsdWUgKyBcIl0gZm9yIFtcIiArIHByb3BlcnR5TmFtZSArIFwiXVwiKTsgfVxuXHQgICAgICAgICAgICAgICAgICAgIC8qIFNWRyBlbGVtZW50cyBoYXZlIHRoZWlyIGRpbWVuc2lvbmFsIHByb3BlcnRpZXMgKHdpZHRoLCBoZWlnaHQsIHgsIHksIGN4LCBldGMuKSBhcHBsaWVkIGRpcmVjdGx5IGFzIGF0dHJpYnV0ZXMgaW5zdGVhZCBvZiBhcyBzdHlsZXMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogSUU4IGRvZXMgbm90IHN1cHBvcnQgU1ZHIGVsZW1lbnRzLCBzbyBpdCdzIG9rYXkgdGhhdCB3ZSBza2lwIGl0IGZvciBTVkcgYW5pbWF0aW9uLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoRGF0YShlbGVtZW50KSAmJiBEYXRhKGVsZW1lbnQpLmlzU1ZHICYmIENTUy5OYW1lcy5TVkdBdHRyaWJ1dGUocHJvcGVydHkpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IEZvciBTVkcgYXR0cmlidXRlcywgdmVuZG9yLXByZWZpeGVkIHByb3BlcnR5IG5hbWVzIGFyZSBuZXZlciB1c2VkLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBOb3QgYWxsIENTUyBwcm9wZXJ0aWVzIGNhbiBiZSBhbmltYXRlZCB2aWEgYXR0cmlidXRlcywgYnV0IHRoZSBicm93c2VyIHdvbid0IHRocm93IGFuIGVycm9yIGZvciB1bnN1cHBvcnRlZCBwcm9wZXJ0aWVzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShwcm9wZXJ0eSwgcHJvcGVydHlWYWx1ZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5zdHlsZVtwcm9wZXJ0eU5hbWVdID0gcHJvcGVydHlWYWx1ZTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoVmVsb2NpdHkuZGVidWcgPj0gMikgY29uc29sZS5sb2coXCJTZXQgXCIgKyBwcm9wZXJ0eSArIFwiIChcIiArIHByb3BlcnR5TmFtZSArIFwiKTogXCIgKyBwcm9wZXJ0eVZhbHVlKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8qIFJldHVybiB0aGUgbm9ybWFsaXplZCBwcm9wZXJ0eSBuYW1lIGFuZCB2YWx1ZSBpbiBjYXNlIHRoZSBjYWxsZXIgd2FudHMgdG8ga25vdyBob3cgdGhlc2UgdmFsdWVzIHdlcmUgbW9kaWZpZWQgYmVmb3JlIGJlaW5nIGFwcGxpZWQgdG8gdGhlIERPTS4gKi9cblx0ICAgICAgICAgICAgcmV0dXJuIFsgcHJvcGVydHlOYW1lLCBwcm9wZXJ0eVZhbHVlIF07XG5cdCAgICAgICAgfSxcblxuXHQgICAgICAgIC8qIFRvIGluY3JlYXNlIHBlcmZvcm1hbmNlIGJ5IGJhdGNoaW5nIHRyYW5zZm9ybSB1cGRhdGVzIGludG8gYSBzaW5nbGUgU0VULCB0cmFuc2Zvcm1zIGFyZSBub3QgZGlyZWN0bHkgYXBwbGllZCB0byBhbiBlbGVtZW50IHVudGlsIGZsdXNoVHJhbnNmb3JtQ2FjaGUoKSBpcyBjYWxsZWQuICovXG5cdCAgICAgICAgLyogTm90ZTogVmVsb2NpdHkgYXBwbGllcyB0cmFuc2Zvcm0gcHJvcGVydGllcyBpbiB0aGUgc2FtZSBvcmRlciB0aGF0IHRoZXkgYXJlIGNocm9ub2dpY2FsbHkgaW50cm9kdWNlZCB0byB0aGUgZWxlbWVudCdzIENTUyBzdHlsZXMuICovXG5cdCAgICAgICAgZmx1c2hUcmFuc2Zvcm1DYWNoZTogZnVuY3Rpb24oZWxlbWVudCkge1xuXHQgICAgICAgICAgICB2YXIgdHJhbnNmb3JtU3RyaW5nID0gXCJcIjtcblxuXHQgICAgICAgICAgICAvKiBDZXJ0YWluIGJyb3dzZXJzIHJlcXVpcmUgdGhhdCBTVkcgdHJhbnNmb3JtcyBiZSBhcHBsaWVkIGFzIGFuIGF0dHJpYnV0ZS4gSG93ZXZlciwgdGhlIFNWRyB0cmFuc2Zvcm0gYXR0cmlidXRlIHRha2VzIGEgbW9kaWZpZWQgdmVyc2lvbiBvZiBDU1MncyB0cmFuc2Zvcm0gc3RyaW5nXG5cdCAgICAgICAgICAgICAgICh1bml0cyBhcmUgZHJvcHBlZCBhbmQsIGV4Y2VwdCBmb3Igc2tld1gvWSwgc3VicHJvcGVydGllcyBhcmUgbWVyZ2VkIGludG8gdGhlaXIgbWFzdGVyIHByb3BlcnR5IC0tIGUuZy4gc2NhbGVYIGFuZCBzY2FsZVkgYXJlIG1lcmdlZCBpbnRvIHNjYWxlKFggWSkuICovXG5cdCAgICAgICAgICAgIGlmICgoSUUgfHwgKFZlbG9jaXR5LlN0YXRlLmlzQW5kcm9pZCAmJiAhVmVsb2NpdHkuU3RhdGUuaXNDaHJvbWUpKSAmJiBEYXRhKGVsZW1lbnQpLmlzU1ZHKSB7XG5cdCAgICAgICAgICAgICAgICAvKiBTaW5jZSB0cmFuc2Zvcm0gdmFsdWVzIGFyZSBzdG9yZWQgaW4gdGhlaXIgcGFyZW50aGVzZXMtd3JhcHBlZCBmb3JtLCB3ZSB1c2UgYSBoZWxwZXIgZnVuY3Rpb24gdG8gc3RyaXAgb3V0IHRoZWlyIG51bWVyaWMgdmFsdWVzLlxuXHQgICAgICAgICAgICAgICAgICAgRnVydGhlciwgU1ZHIHRyYW5zZm9ybSBwcm9wZXJ0aWVzIG9ubHkgdGFrZSB1bml0bGVzcyAocmVwcmVzZW50aW5nIHBpeGVscykgdmFsdWVzLCBzbyBpdCdzIG9rYXkgdGhhdCBwYXJzZUZsb2F0KCkgc3RyaXBzIHRoZSB1bml0IHN1ZmZpeGVkIHRvIHRoZSBmbG9hdCB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGdldFRyYW5zZm9ybUZsb2F0ICh0cmFuc2Zvcm1Qcm9wZXJ0eSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIHRyYW5zZm9ybVByb3BlcnR5KSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIC8qIENyZWF0ZSBhbiBvYmplY3QgdG8gb3JnYW5pemUgYWxsIHRoZSB0cmFuc2Zvcm1zIHRoYXQgd2UnbGwgYXBwbHkgdG8gdGhlIFNWRyBlbGVtZW50LiBUbyBrZWVwIHRoZSBsb2dpYyBzaW1wbGUsXG5cdCAgICAgICAgICAgICAgICAgICB3ZSBwcm9jZXNzICphbGwqIHRyYW5zZm9ybSBwcm9wZXJ0aWVzIC0tIGV2ZW4gdGhvc2UgdGhhdCBtYXkgbm90IGJlIGV4cGxpY2l0bHkgYXBwbGllZCAoc2luY2UgdGhleSBkZWZhdWx0IHRvIHRoZWlyIHplcm8tdmFsdWVzIGFueXdheSkuICovXG5cdCAgICAgICAgICAgICAgICB2YXIgU1ZHVHJhbnNmb3JtcyA9IHtcblx0ICAgICAgICAgICAgICAgICAgICB0cmFuc2xhdGU6IFsgZ2V0VHJhbnNmb3JtRmxvYXQoXCJ0cmFuc2xhdGVYXCIpLCBnZXRUcmFuc2Zvcm1GbG9hdChcInRyYW5zbGF0ZVlcIikgXSxcblx0ICAgICAgICAgICAgICAgICAgICBza2V3WDogWyBnZXRUcmFuc2Zvcm1GbG9hdChcInNrZXdYXCIpIF0sIHNrZXdZOiBbIGdldFRyYW5zZm9ybUZsb2F0KFwic2tld1lcIikgXSxcblx0ICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgc2NhbGUgcHJvcGVydHkgaXMgc2V0IChub24tMSksIHVzZSB0aGF0IHZhbHVlIGZvciB0aGUgc2NhbGVYIGFuZCBzY2FsZVkgdmFsdWVzXG5cdCAgICAgICAgICAgICAgICAgICAgICAgKHRoaXMgYmVoYXZpb3IgbWltaWNzIHRoZSByZXN1bHQgb2YgYW5pbWF0aW5nIGFsbCB0aGVzZSBwcm9wZXJ0aWVzIGF0IG9uY2Ugb24gSFRNTCBlbGVtZW50cykuICovXG5cdCAgICAgICAgICAgICAgICAgICAgc2NhbGU6IGdldFRyYW5zZm9ybUZsb2F0KFwic2NhbGVcIikgIT09IDEgPyBbIGdldFRyYW5zZm9ybUZsb2F0KFwic2NhbGVcIiksIGdldFRyYW5zZm9ybUZsb2F0KFwic2NhbGVcIikgXSA6IFsgZ2V0VHJhbnNmb3JtRmxvYXQoXCJzY2FsZVhcIiksIGdldFRyYW5zZm9ybUZsb2F0KFwic2NhbGVZXCIpIF0sXG5cdCAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogU1ZHJ3Mgcm90YXRlIHRyYW5zZm9ybSB0YWtlcyB0aHJlZSB2YWx1ZXM6IHJvdGF0aW9uIGRlZ3JlZXMgZm9sbG93ZWQgYnkgdGhlIFggYW5kIFkgdmFsdWVzXG5cdCAgICAgICAgICAgICAgICAgICAgICAgZGVmaW5pbmcgdGhlIHJvdGF0aW9uJ3Mgb3JpZ2luIHBvaW50LiBXZSBpZ25vcmUgdGhlIG9yaWdpbiB2YWx1ZXMgKGRlZmF1bHQgdGhlbSB0byAwKS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICByb3RhdGU6IFsgZ2V0VHJhbnNmb3JtRmxvYXQoXCJyb3RhdGVaXCIpLCAwLCAwIF1cblx0ICAgICAgICAgICAgICAgIH07XG5cblx0ICAgICAgICAgICAgICAgIC8qIEl0ZXJhdGUgdGhyb3VnaCB0aGUgdHJhbnNmb3JtIHByb3BlcnRpZXMgaW4gdGhlIHVzZXItZGVmaW5lZCBwcm9wZXJ0eSBtYXAgb3JkZXIuXG5cdCAgICAgICAgICAgICAgICAgICAoVGhpcyBtaW1pY3MgdGhlIGJlaGF2aW9yIG9mIG5vbi1TVkcgdHJhbnNmb3JtIGFuaW1hdGlvbi4pICovXG5cdCAgICAgICAgICAgICAgICAkLmVhY2goRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZSwgZnVuY3Rpb24odHJhbnNmb3JtTmFtZSkge1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIEV4Y2VwdCBmb3Igd2l0aCBza2V3WC9ZLCByZXZlcnQgdGhlIGF4aXMtc3BlY2lmaWMgdHJhbnNmb3JtIHN1YnByb3BlcnRpZXMgdG8gdGhlaXIgYXhpcy1mcmVlIG1hc3RlclxuXHQgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXMgc28gdGhhdCB0aGV5IG1hdGNoIHVwIHdpdGggU1ZHJ3MgYWNjZXB0ZWQgdHJhbnNmb3JtIHByb3BlcnRpZXMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKC9edHJhbnNsYXRlL2kudGVzdCh0cmFuc2Zvcm1OYW1lKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1OYW1lID0gXCJ0cmFuc2xhdGVcIjtcblx0ICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC9ec2NhbGUvaS50ZXN0KHRyYW5zZm9ybU5hbWUpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybU5hbWUgPSBcInNjYWxlXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvXnJvdGF0ZS9pLnRlc3QodHJhbnNmb3JtTmFtZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtTmFtZSA9IFwicm90YXRlXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogQ2hlY2sgdGhhdCB3ZSBoYXZlbid0IHlldCBkZWxldGVkIHRoZSBwcm9wZXJ0eSBmcm9tIHRoZSBTVkdUcmFuc2Zvcm1zIGNvbnRhaW5lci4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoU1ZHVHJhbnNmb3Jtc1t0cmFuc2Zvcm1OYW1lXSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBBcHBlbmQgdGhlIHRyYW5zZm9ybSBwcm9wZXJ0eSBpbiB0aGUgU1ZHLXN1cHBvcnRlZCB0cmFuc2Zvcm0gZm9ybWF0LiBBcyBwZXIgdGhlIHNwZWMsIHN1cnJvdW5kIHRoZSBzcGFjZS1kZWxpbWl0ZWQgdmFsdWVzIGluIHBhcmVudGhlc2VzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1TdHJpbmcgKz0gdHJhbnNmb3JtTmFtZSArIFwiKFwiICsgU1ZHVHJhbnNmb3Jtc1t0cmFuc2Zvcm1OYW1lXS5qb2luKFwiIFwiKSArIFwiKVwiICsgXCIgXCI7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogQWZ0ZXIgcHJvY2Vzc2luZyBhbiBTVkcgdHJhbnNmb3JtIHByb3BlcnR5LCBkZWxldGUgaXQgZnJvbSB0aGUgU1ZHVHJhbnNmb3JtcyBjb250YWluZXIgc28gd2UgZG9uJ3Rcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmUtaW5zZXJ0IHRoZSBzYW1lIG1hc3RlciBwcm9wZXJ0eSBpZiB3ZSBlbmNvdW50ZXIgYW5vdGhlciBvbmUgb2YgaXRzIGF4aXMtc3BlY2lmaWMgcHJvcGVydGllcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIFNWR1RyYW5zZm9ybXNbdHJhbnNmb3JtTmFtZV07XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICB2YXIgdHJhbnNmb3JtVmFsdWUsXG5cdCAgICAgICAgICAgICAgICAgICAgcGVyc3BlY3RpdmU7XG5cblx0ICAgICAgICAgICAgICAgIC8qIFRyYW5zZm9ybSBwcm9wZXJ0aWVzIGFyZSBzdG9yZWQgYXMgbWVtYmVycyBvZiB0aGUgdHJhbnNmb3JtQ2FjaGUgb2JqZWN0LiBDb25jYXRlbmF0ZSBhbGwgdGhlIG1lbWJlcnMgaW50byBhIHN0cmluZy4gKi9cblx0ICAgICAgICAgICAgICAgICQuZWFjaChEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlLCBmdW5jdGlvbih0cmFuc2Zvcm1OYW1lKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtVmFsdWUgPSBEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlW3RyYW5zZm9ybU5hbWVdO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogVHJhbnNmb3JtJ3MgcGVyc3BlY3RpdmUgc3VicHJvcGVydHkgbXVzdCBiZSBzZXQgZmlyc3QgaW4gb3JkZXIgdG8gdGFrZSBlZmZlY3QuIFN0b3JlIGl0IHRlbXBvcmFyaWx5LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmICh0cmFuc2Zvcm1OYW1lID09PSBcInRyYW5zZm9ybVBlcnNwZWN0aXZlXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcGVyc3BlY3RpdmUgPSB0cmFuc2Zvcm1WYWx1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogSUU5IG9ubHkgc3VwcG9ydHMgb25lIHJvdGF0aW9uIHR5cGUsIHJvdGF0ZVosIHdoaWNoIGl0IHJlZmVycyB0byBhcyBcInJvdGF0ZVwiLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChJRSA9PT0gOSAmJiB0cmFuc2Zvcm1OYW1lID09PSBcInJvdGF0ZVpcIikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1OYW1lID0gXCJyb3RhdGVcIjtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1TdHJpbmcgKz0gdHJhbnNmb3JtTmFtZSArIHRyYW5zZm9ybVZhbHVlICsgXCIgXCI7XG5cdCAgICAgICAgICAgICAgICB9KTtcblxuXHQgICAgICAgICAgICAgICAgLyogSWYgcHJlc2VudCwgc2V0IHRoZSBwZXJzcGVjdGl2ZSBzdWJwcm9wZXJ0eSBmaXJzdC4gKi9cblx0ICAgICAgICAgICAgICAgIGlmIChwZXJzcGVjdGl2ZSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVN0cmluZyA9IFwicGVyc3BlY3RpdmVcIiArIHBlcnNwZWN0aXZlICsgXCIgXCIgKyB0cmFuc2Zvcm1TdHJpbmc7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBDU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcInRyYW5zZm9ybVwiLCB0cmFuc2Zvcm1TdHJpbmcpO1xuXHQgICAgICAgIH1cblx0ICAgIH07XG5cblx0ICAgIC8qIFJlZ2lzdGVyIGhvb2tzIGFuZCBub3JtYWxpemF0aW9ucy4gKi9cblx0ICAgIENTUy5Ib29rcy5yZWdpc3RlcigpO1xuXHQgICAgQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyKCk7XG5cblx0ICAgIC8qIEFsbG93IGhvb2sgc2V0dGluZyBpbiB0aGUgc2FtZSBmYXNoaW9uIGFzIGpRdWVyeSdzICQuY3NzKCkuICovXG5cdCAgICBWZWxvY2l0eS5ob29rID0gZnVuY3Rpb24gKGVsZW1lbnRzLCBhcmcyLCBhcmczKSB7XG5cdCAgICAgICAgdmFyIHZhbHVlID0gdW5kZWZpbmVkO1xuXG5cdCAgICAgICAgZWxlbWVudHMgPSBzYW5pdGl6ZUVsZW1lbnRzKGVsZW1lbnRzKTtcblxuXHQgICAgICAgICQuZWFjaChlbGVtZW50cywgZnVuY3Rpb24oaSwgZWxlbWVudCkge1xuXHQgICAgICAgICAgICAvKiBJbml0aWFsaXplIFZlbG9jaXR5J3MgcGVyLWVsZW1lbnQgZGF0YSBjYWNoZSBpZiB0aGlzIGVsZW1lbnQgaGFzbid0IHByZXZpb3VzbHkgYmVlbiBhbmltYXRlZC4gKi9cblx0ICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgVmVsb2NpdHkuaW5pdChlbGVtZW50KTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8qIEdldCBwcm9wZXJ0eSB2YWx1ZS4gSWYgYW4gZWxlbWVudCBzZXQgd2FzIHBhc3NlZCBpbiwgb25seSByZXR1cm4gdGhlIHZhbHVlIGZvciB0aGUgZmlyc3QgZWxlbWVudC4gKi9cblx0ICAgICAgICAgICAgaWYgKGFyZzMgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IFZlbG9jaXR5LkNTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIGFyZzIpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAvKiBTZXQgcHJvcGVydHkgdmFsdWUuICovXG5cdCAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAvKiBzUFYgcmV0dXJucyBhbiBhcnJheSBvZiB0aGUgbm9ybWFsaXplZCBwcm9wZXJ0eU5hbWUvcHJvcGVydHlWYWx1ZSBwYWlyIHVzZWQgdG8gdXBkYXRlIHRoZSBET00uICovXG5cdCAgICAgICAgICAgICAgICB2YXIgYWRqdXN0ZWRTZXQgPSBWZWxvY2l0eS5DU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBhcmcyLCBhcmczKTtcblxuXHQgICAgICAgICAgICAgICAgLyogVHJhbnNmb3JtIHByb3BlcnRpZXMgZG9uJ3QgYXV0b21hdGljYWxseSBzZXQuIFRoZXkgaGF2ZSB0byBiZSBmbHVzaGVkIHRvIHRoZSBET00uICovXG5cdCAgICAgICAgICAgICAgICBpZiAoYWRqdXN0ZWRTZXRbMF0gPT09IFwidHJhbnNmb3JtXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5DU1MuZmx1c2hUcmFuc2Zvcm1DYWNoZShlbGVtZW50KTtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgdmFsdWUgPSBhZGp1c3RlZFNldDtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgcmV0dXJuIHZhbHVlO1xuXHQgICAgfTtcblxuXHQgICAgLyoqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgQW5pbWF0aW9uXG5cdCAgICAqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgdmFyIGFuaW1hdGUgPSBmdW5jdGlvbigpIHtcblxuXHQgICAgICAgIC8qKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgQ2FsbCBDaGFpblxuXHQgICAgICAgICoqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgIC8qIExvZ2ljIGZvciBkZXRlcm1pbmluZyB3aGF0IHRvIHJldHVybiB0byB0aGUgY2FsbCBzdGFjayB3aGVuIGV4aXRpbmcgb3V0IG9mIFZlbG9jaXR5LiAqL1xuXHQgICAgICAgIGZ1bmN0aW9uIGdldENoYWluICgpIHtcblx0ICAgICAgICAgICAgLyogSWYgd2UgYXJlIHVzaW5nIHRoZSB1dGlsaXR5IGZ1bmN0aW9uLCBhdHRlbXB0IHRvIHJldHVybiB0aGlzIGNhbGwncyBwcm9taXNlLiBJZiBubyBwcm9taXNlIGxpYnJhcnkgd2FzIGRldGVjdGVkLFxuXHQgICAgICAgICAgICAgICBkZWZhdWx0IHRvIG51bGwgaW5zdGVhZCBvZiByZXR1cm5pbmcgdGhlIHRhcmdldGVkIGVsZW1lbnRzIHNvIHRoYXQgdXRpbGl0eSBmdW5jdGlvbidzIHJldHVybiB2YWx1ZSBpcyBzdGFuZGFyZGl6ZWQuICovXG5cdCAgICAgICAgICAgIGlmIChpc1V0aWxpdHkpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlRGF0YS5wcm9taXNlIHx8IG51bGw7XG5cdCAgICAgICAgICAgIC8qIE90aGVyd2lzZSwgaWYgd2UncmUgdXNpbmcgJC5mbiwgcmV0dXJuIHRoZSBqUXVlcnktL1plcHRvLXdyYXBwZWQgZWxlbWVudCBzZXQuICovXG5cdCAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICByZXR1cm4gZWxlbWVudHNXcmFwcGVkO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICBBcmd1bWVudHMgQXNzaWdubWVudFxuXHQgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAvKiBUbyBhbGxvdyBmb3IgZXhwcmVzc2l2ZSBDb2ZmZWVTY3JpcHQgY29kZSwgVmVsb2NpdHkgc3VwcG9ydHMgYW4gYWx0ZXJuYXRpdmUgc3ludGF4IGluIHdoaWNoIFwiZWxlbWVudHNcIiAob3IgXCJlXCIpLCBcInByb3BlcnRpZXNcIiAob3IgXCJwXCIpLCBhbmQgXCJvcHRpb25zXCIgKG9yIFwib1wiKVxuXHQgICAgICAgICAgIG9iamVjdHMgYXJlIGRlZmluZWQgb24gYSBjb250YWluZXIgb2JqZWN0IHRoYXQncyBwYXNzZWQgaW4gYXMgVmVsb2NpdHkncyBzb2xlIGFyZ3VtZW50LiAqL1xuXHQgICAgICAgIC8qIE5vdGU6IFNvbWUgYnJvd3NlcnMgYXV0b21hdGljYWxseSBwb3B1bGF0ZSBhcmd1bWVudHMgd2l0aCBhIFwicHJvcGVydGllc1wiIG9iamVjdC4gV2UgZGV0ZWN0IGl0IGJ5IGNoZWNraW5nIGZvciBpdHMgZGVmYXVsdCBcIm5hbWVzXCIgcHJvcGVydHkuICovXG5cdCAgICAgICAgdmFyIHN5bnRhY3RpY1N1Z2FyID0gKGFyZ3VtZW50c1swXSAmJiAoYXJndW1lbnRzWzBdLnAgfHwgKCgkLmlzUGxhaW5PYmplY3QoYXJndW1lbnRzWzBdLnByb3BlcnRpZXMpICYmICFhcmd1bWVudHNbMF0ucHJvcGVydGllcy5uYW1lcykgfHwgVHlwZS5pc1N0cmluZyhhcmd1bWVudHNbMF0ucHJvcGVydGllcykpKSksXG5cdCAgICAgICAgICAgIC8qIFdoZXRoZXIgVmVsb2NpdHkgd2FzIGNhbGxlZCB2aWEgdGhlIHV0aWxpdHkgZnVuY3Rpb24gKGFzIG9wcG9zZWQgdG8gb24gYSBqUXVlcnkvWmVwdG8gb2JqZWN0KS4gKi9cblx0ICAgICAgICAgICAgaXNVdGlsaXR5LFxuXHQgICAgICAgICAgICAvKiBXaGVuIFZlbG9jaXR5IGlzIGNhbGxlZCB2aWEgdGhlIHV0aWxpdHkgZnVuY3Rpb24gKCQuVmVsb2NpdHkoKS9WZWxvY2l0eSgpKSwgZWxlbWVudHMgYXJlIGV4cGxpY2l0bHlcblx0ICAgICAgICAgICAgICAgcGFzc2VkIGluIGFzIHRoZSBmaXJzdCBwYXJhbWV0ZXIuIFRodXMsIGFyZ3VtZW50IHBvc2l0aW9uaW5nIHZhcmllcy4gV2Ugbm9ybWFsaXplIHRoZW0gaGVyZS4gKi9cblx0ICAgICAgICAgICAgZWxlbWVudHNXcmFwcGVkLFxuXHQgICAgICAgICAgICBhcmd1bWVudEluZGV4O1xuXG5cdCAgICAgICAgdmFyIGVsZW1lbnRzLFxuXHQgICAgICAgICAgICBwcm9wZXJ0aWVzTWFwLFxuXHQgICAgICAgICAgICBvcHRpb25zO1xuXG5cdCAgICAgICAgLyogRGV0ZWN0IGpRdWVyeS9aZXB0byBlbGVtZW50cyBiZWluZyBhbmltYXRlZCB2aWEgdGhlICQuZm4gbWV0aG9kLiAqL1xuXHQgICAgICAgIGlmIChUeXBlLmlzV3JhcHBlZCh0aGlzKSkge1xuXHQgICAgICAgICAgICBpc1V0aWxpdHkgPSBmYWxzZTtcblxuXHQgICAgICAgICAgICBhcmd1bWVudEluZGV4ID0gMDtcblx0ICAgICAgICAgICAgZWxlbWVudHMgPSB0aGlzO1xuXHQgICAgICAgICAgICBlbGVtZW50c1dyYXBwZWQgPSB0aGlzO1xuXHQgICAgICAgIC8qIE90aGVyd2lzZSwgcmF3IGVsZW1lbnRzIGFyZSBiZWluZyBhbmltYXRlZCB2aWEgdGhlIHV0aWxpdHkgZnVuY3Rpb24uICovXG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgaXNVdGlsaXR5ID0gdHJ1ZTtcblxuXHQgICAgICAgICAgICBhcmd1bWVudEluZGV4ID0gMTtcblx0ICAgICAgICAgICAgZWxlbWVudHMgPSBzeW50YWN0aWNTdWdhciA/IChhcmd1bWVudHNbMF0uZWxlbWVudHMgfHwgYXJndW1lbnRzWzBdLmUpIDogYXJndW1lbnRzWzBdO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGVsZW1lbnRzID0gc2FuaXRpemVFbGVtZW50cyhlbGVtZW50cyk7XG5cblx0ICAgICAgICBpZiAoIWVsZW1lbnRzKSB7XG5cdCAgICAgICAgICAgIHJldHVybjtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAoc3ludGFjdGljU3VnYXIpIHtcblx0ICAgICAgICAgICAgcHJvcGVydGllc01hcCA9IGFyZ3VtZW50c1swXS5wcm9wZXJ0aWVzIHx8IGFyZ3VtZW50c1swXS5wO1xuXHQgICAgICAgICAgICBvcHRpb25zID0gYXJndW1lbnRzWzBdLm9wdGlvbnMgfHwgYXJndW1lbnRzWzBdLm87XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgcHJvcGVydGllc01hcCA9IGFyZ3VtZW50c1thcmd1bWVudEluZGV4XTtcblx0ICAgICAgICAgICAgb3B0aW9ucyA9IGFyZ3VtZW50c1thcmd1bWVudEluZGV4ICsgMV07XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLyogVGhlIGxlbmd0aCBvZiB0aGUgZWxlbWVudCBzZXQgKGluIHRoZSBmb3JtIG9mIGEgbm9kZUxpc3Qgb3IgYW4gYXJyYXkgb2YgZWxlbWVudHMpIGlzIGRlZmF1bHRlZCB0byAxIGluIGNhc2UgYVxuXHQgICAgICAgICAgIHNpbmdsZSByYXcgRE9NIGVsZW1lbnQgaXMgcGFzc2VkIGluICh3aGljaCBkb2Vzbid0IGNvbnRhaW4gYSBsZW5ndGggcHJvcGVydHkpLiAqL1xuXHQgICAgICAgIHZhciBlbGVtZW50c0xlbmd0aCA9IGVsZW1lbnRzLmxlbmd0aCxcblx0ICAgICAgICAgICAgZWxlbWVudHNJbmRleCA9IDA7XG5cblx0ICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgIEFyZ3VtZW50IE92ZXJsb2FkaW5nXG5cdCAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgLyogU3VwcG9ydCBpcyBpbmNsdWRlZCBmb3IgalF1ZXJ5J3MgYXJndW1lbnQgb3ZlcmxvYWRpbmc6ICQuYW5pbWF0ZShwcm9wZXJ0eU1hcCBbLCBkdXJhdGlvbl0gWywgZWFzaW5nXSBbLCBjb21wbGV0ZV0pLlxuXHQgICAgICAgICAgIE92ZXJsb2FkaW5nIGlzIGRldGVjdGVkIGJ5IGNoZWNraW5nIGZvciB0aGUgYWJzZW5jZSBvZiBhbiBvYmplY3QgYmVpbmcgcGFzc2VkIGludG8gb3B0aW9ucy4gKi9cblx0ICAgICAgICAvKiBOb3RlOiBUaGUgc3RvcCBhbmQgZmluaXNoIGFjdGlvbnMgZG8gbm90IGFjY2VwdCBhbmltYXRpb24gb3B0aW9ucywgYW5kIGFyZSB0aGVyZWZvcmUgZXhjbHVkZWQgZnJvbSB0aGlzIGNoZWNrLiAqL1xuXHQgICAgICAgIGlmICghL14oc3RvcHxmaW5pc2h8ZmluaXNoQWxsKSQvaS50ZXN0KHByb3BlcnRpZXNNYXApICYmICEkLmlzUGxhaW5PYmplY3Qob3B0aW9ucykpIHtcblx0ICAgICAgICAgICAgLyogVGhlIHV0aWxpdHkgZnVuY3Rpb24gc2hpZnRzIGFsbCBhcmd1bWVudHMgb25lIHBvc2l0aW9uIHRvIHRoZSByaWdodCwgc28gd2UgYWRqdXN0IGZvciB0aGF0IG9mZnNldC4gKi9cblx0ICAgICAgICAgICAgdmFyIHN0YXJ0aW5nQXJndW1lbnRQb3NpdGlvbiA9IGFyZ3VtZW50SW5kZXggKyAxO1xuXG5cdCAgICAgICAgICAgIG9wdGlvbnMgPSB7fTtcblxuXHQgICAgICAgICAgICAvKiBJdGVyYXRlIHRocm91Z2ggYWxsIG9wdGlvbnMgYXJndW1lbnRzICovXG5cdCAgICAgICAgICAgIGZvciAodmFyIGkgPSBzdGFydGluZ0FyZ3VtZW50UG9zaXRpb247IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgIC8qIFRyZWF0IGEgbnVtYmVyIGFzIGEgZHVyYXRpb24uIFBhcnNlIGl0IG91dC4gKi9cblx0ICAgICAgICAgICAgICAgIC8qIE5vdGU6IFRoZSBmb2xsb3dpbmcgUmVnRXggd2lsbCByZXR1cm4gdHJ1ZSBpZiBwYXNzZWQgYW4gYXJyYXkgd2l0aCBhIG51bWJlciBhcyBpdHMgZmlyc3QgaXRlbS5cblx0ICAgICAgICAgICAgICAgICAgIFRodXMsIGFycmF5cyBhcmUgc2tpcHBlZCBmcm9tIHRoaXMgY2hlY2suICovXG5cdCAgICAgICAgICAgICAgICBpZiAoIVR5cGUuaXNBcnJheShhcmd1bWVudHNbaV0pICYmICgvXihmYXN0fG5vcm1hbHxzbG93KSQvaS50ZXN0KGFyZ3VtZW50c1tpXSkgfHwgL15cXGQvLnRlc3QoYXJndW1lbnRzW2ldKSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmR1cmF0aW9uID0gYXJndW1lbnRzW2ldO1xuXHQgICAgICAgICAgICAgICAgLyogVHJlYXQgc3RyaW5ncyBhbmQgYXJyYXlzIGFzIGVhc2luZ3MuICovXG5cdCAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFR5cGUuaXNTdHJpbmcoYXJndW1lbnRzW2ldKSB8fCBUeXBlLmlzQXJyYXkoYXJndW1lbnRzW2ldKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZWFzaW5nID0gYXJndW1lbnRzW2ldO1xuXHQgICAgICAgICAgICAgICAgLyogVHJlYXQgYSBmdW5jdGlvbiBhcyBhIGNvbXBsZXRlIGNhbGxiYWNrLiAqL1xuXHQgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChUeXBlLmlzRnVuY3Rpb24oYXJndW1lbnRzW2ldKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuY29tcGxldGUgPSBhcmd1bWVudHNbaV07XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgIFByb21pc2VzXG5cdCAgICAgICAgKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgdmFyIHByb21pc2VEYXRhID0ge1xuXHQgICAgICAgICAgICAgICAgcHJvbWlzZTogbnVsbCxcblx0ICAgICAgICAgICAgICAgIHJlc29sdmVyOiBudWxsLFxuXHQgICAgICAgICAgICAgICAgcmVqZWN0ZXI6IG51bGxcblx0ICAgICAgICAgICAgfTtcblxuXHQgICAgICAgIC8qIElmIHRoaXMgY2FsbCB3YXMgbWFkZSB2aWEgdGhlIHV0aWxpdHkgZnVuY3Rpb24gKHdoaWNoIGlzIHRoZSBkZWZhdWx0IG1ldGhvZCBvZiBpbnZvY2F0aW9uIHdoZW4galF1ZXJ5L1plcHRvIGFyZSBub3QgYmVpbmcgdXNlZCksIGFuZCBpZlxuXHQgICAgICAgICAgIHByb21pc2Ugc3VwcG9ydCB3YXMgZGV0ZWN0ZWQsIGNyZWF0ZSBhIHByb21pc2Ugb2JqZWN0IGZvciB0aGlzIGNhbGwgYW5kIHN0b3JlIHJlZmVyZW5jZXMgdG8gaXRzIHJlc29sdmVyIGFuZCByZWplY3RlciBtZXRob2RzLiBUaGUgcmVzb2x2ZVxuXHQgICAgICAgICAgIG1ldGhvZCBpcyB1c2VkIHdoZW4gYSBjYWxsIGNvbXBsZXRlcyBuYXR1cmFsbHkgb3IgaXMgcHJlbWF0dXJlbHkgc3RvcHBlZCBieSB0aGUgdXNlci4gSW4gYm90aCBjYXNlcywgY29tcGxldGVDYWxsKCkgaGFuZGxlcyB0aGUgYXNzb2NpYXRlZFxuXHQgICAgICAgICAgIGNhbGwgY2xlYW51cCBhbmQgcHJvbWlzZSByZXNvbHZpbmcgbG9naWMuIFRoZSByZWplY3QgbWV0aG9kIGlzIHVzZWQgd2hlbiBhbiBpbnZhbGlkIHNldCBvZiBhcmd1bWVudHMgaXMgcGFzc2VkIGludG8gYSBWZWxvY2l0eSBjYWxsLiAqL1xuXHQgICAgICAgIC8qIE5vdGU6IFZlbG9jaXR5IGVtcGxveXMgYSBjYWxsLWJhc2VkIHF1ZXVlaW5nIGFyY2hpdGVjdHVyZSwgd2hpY2ggbWVhbnMgdGhhdCBzdG9wcGluZyBhbiBhbmltYXRpbmcgZWxlbWVudCBhY3R1YWxseSBzdG9wcyB0aGUgZnVsbCBjYWxsIHRoYXRcblx0ICAgICAgICAgICB0cmlnZ2VyZWQgaXQgLS0gbm90IHRoYXQgb25lIGVsZW1lbnQgZXhjbHVzaXZlbHkuIFNpbWlsYXJseSwgdGhlcmUgaXMgb25lIHByb21pc2UgcGVyIGNhbGwsIGFuZCBhbGwgZWxlbWVudHMgdGFyZ2V0ZWQgYnkgYSBWZWxvY2l0eSBjYWxsIGFyZVxuXHQgICAgICAgICAgIGdyb3VwZWQgdG9nZXRoZXIgZm9yIHRoZSBwdXJwb3NlcyBvZiByZXNvbHZpbmcgYW5kIHJlamVjdGluZyBhIHByb21pc2UuICovXG5cdCAgICAgICAgaWYgKGlzVXRpbGl0eSAmJiBWZWxvY2l0eS5Qcm9taXNlKSB7XG5cdCAgICAgICAgICAgIHByb21pc2VEYXRhLnByb21pc2UgPSBuZXcgVmVsb2NpdHkuUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdCAgICAgICAgICAgICAgICBwcm9taXNlRGF0YS5yZXNvbHZlciA9IHJlc29sdmU7XG5cdCAgICAgICAgICAgICAgICBwcm9taXNlRGF0YS5yZWplY3RlciA9IHJlamVjdDtcblx0ICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgIEFjdGlvbiBEZXRlY3Rpb25cblx0ICAgICAgICAqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAvKiBWZWxvY2l0eSdzIGJlaGF2aW9yIGlzIGNhdGVnb3JpemVkIGludG8gXCJhY3Rpb25zXCI6IEVsZW1lbnRzIGNhbiBlaXRoZXIgYmUgc3BlY2lhbGx5IHNjcm9sbGVkIGludG8gdmlldyxcblx0ICAgICAgICAgICBvciB0aGV5IGNhbiBiZSBzdGFydGVkLCBzdG9wcGVkLCBvciByZXZlcnNlZC4gSWYgYSBsaXRlcmFsIG9yIHJlZmVyZW5jZWQgcHJvcGVydGllcyBtYXAgaXMgcGFzc2VkIGluIGFzIFZlbG9jaXR5J3Ncblx0ICAgICAgICAgICBmaXJzdCBhcmd1bWVudCwgdGhlIGFzc29jaWF0ZWQgYWN0aW9uIGlzIFwic3RhcnRcIi4gQWx0ZXJuYXRpdmVseSwgXCJzY3JvbGxcIiwgXCJyZXZlcnNlXCIsIG9yIFwic3RvcFwiIGNhbiBiZSBwYXNzZWQgaW4gaW5zdGVhZCBvZiBhIHByb3BlcnRpZXMgbWFwLiAqL1xuXHQgICAgICAgIHZhciBhY3Rpb247XG5cblx0ICAgICAgICBzd2l0Y2ggKHByb3BlcnRpZXNNYXApIHtcblx0ICAgICAgICAgICAgY2FzZSBcInNjcm9sbFwiOlxuXHQgICAgICAgICAgICAgICAgYWN0aW9uID0gXCJzY3JvbGxcIjtcblx0ICAgICAgICAgICAgICAgIGJyZWFrO1xuXG5cdCAgICAgICAgICAgIGNhc2UgXCJyZXZlcnNlXCI6XG5cdCAgICAgICAgICAgICAgICBhY3Rpb24gPSBcInJldmVyc2VcIjtcblx0ICAgICAgICAgICAgICAgIGJyZWFrO1xuXG5cdCAgICAgICAgICAgIGNhc2UgXCJmaW5pc2hcIjpcblx0ICAgICAgICAgICAgY2FzZSBcImZpbmlzaEFsbFwiOlxuXHQgICAgICAgICAgICBjYXNlIFwic3RvcFwiOlxuXHQgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICBBY3Rpb246IFN0b3Bcblx0ICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgIC8qIENsZWFyIHRoZSBjdXJyZW50bHktYWN0aXZlIGRlbGF5IG9uIGVhY2ggdGFyZ2V0ZWQgZWxlbWVudC4gKi9cblx0ICAgICAgICAgICAgICAgICQuZWFjaChlbGVtZW50cywgZnVuY3Rpb24oaSwgZWxlbWVudCkge1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpICYmIERhdGEoZWxlbWVudCkuZGVsYXlUaW1lcikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBTdG9wIHRoZSB0aW1lciBmcm9tIHRyaWdnZXJpbmcgaXRzIGNhY2hlZCBuZXh0KCkgZnVuY3Rpb24uICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChEYXRhKGVsZW1lbnQpLmRlbGF5VGltZXIuc2V0VGltZW91dCk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogTWFudWFsbHkgY2FsbCB0aGUgbmV4dCgpIGZ1bmN0aW9uIHNvIHRoYXQgdGhlIHN1YnNlcXVlbnQgcXVldWUgaXRlbXMgY2FuIHByb2dyZXNzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoRGF0YShlbGVtZW50KS5kZWxheVRpbWVyLm5leHQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkuZGVsYXlUaW1lci5uZXh0KCk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgRGF0YShlbGVtZW50KS5kZWxheVRpbWVyO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIElmIHdlIHdhbnQgdG8gZmluaXNoIGV2ZXJ5dGhpbmcgaW4gdGhlIHF1ZXVlLCB3ZSBoYXZlIHRvIGl0ZXJhdGUgdGhyb3VnaCBpdFxuXHQgICAgICAgICAgICAgICAgICAgICAgIGFuZCBjYWxsIGVhY2ggZnVuY3Rpb24uIFRoaXMgd2lsbCBtYWtlIHRoZW0gYWN0aXZlIGNhbGxzIGJlbG93LCB3aGljaCB3aWxsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgY2F1c2UgdGhlbSB0byBiZSBhcHBsaWVkIHZpYSB0aGUgZHVyYXRpb24gc2V0dGluZy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydGllc01hcCA9PT0gXCJmaW5pc2hBbGxcIiAmJiAob3B0aW9ucyA9PT0gdHJ1ZSB8fCBUeXBlLmlzU3RyaW5nKG9wdGlvbnMpKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBJdGVyYXRlIHRocm91Z2ggdGhlIGl0ZW1zIGluIHRoZSBlbGVtZW50J3MgcXVldWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaCgkLnF1ZXVlKGVsZW1lbnQsIFR5cGUuaXNTdHJpbmcob3B0aW9ucykgPyBvcHRpb25zIDogXCJcIiksIGZ1bmN0aW9uKF8sIGl0ZW0pIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRoZSBxdWV1ZSBhcnJheSBjYW4gY29udGFpbiBhbiBcImlucHJvZ3Jlc3NcIiBzdHJpbmcsIHdoaWNoIHdlIHNraXAuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoVHlwZS5pc0Z1bmN0aW9uKGl0ZW0pKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSgpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBDbGVhcmluZyB0aGUgJC5xdWV1ZSgpIGFycmF5IGlzIGFjaGlldmVkIGJ5IHJlc2V0dGluZyBpdCB0byBbXS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgJC5xdWV1ZShlbGVtZW50LCBUeXBlLmlzU3RyaW5nKG9wdGlvbnMpID8gb3B0aW9ucyA6IFwiXCIsIFtdKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9KTtcblxuXHQgICAgICAgICAgICAgICAgdmFyIGNhbGxzVG9TdG9wID0gW107XG5cblx0ICAgICAgICAgICAgICAgIC8qIFdoZW4gdGhlIHN0b3AgYWN0aW9uIGlzIHRyaWdnZXJlZCwgdGhlIGVsZW1lbnRzJyBjdXJyZW50bHkgYWN0aXZlIGNhbGwgaXMgaW1tZWRpYXRlbHkgc3RvcHBlZC4gVGhlIGFjdGl2ZSBjYWxsIG1pZ2h0IGhhdmVcblx0ICAgICAgICAgICAgICAgICAgIGJlZW4gYXBwbGllZCB0byBtdWx0aXBsZSBlbGVtZW50cywgaW4gd2hpY2ggY2FzZSBhbGwgb2YgdGhlIGNhbGwncyBlbGVtZW50cyB3aWxsIGJlIHN0b3BwZWQuIFdoZW4gYW4gZWxlbWVudFxuXHQgICAgICAgICAgICAgICAgICAgaXMgc3RvcHBlZCwgdGhlIG5leHQgaXRlbSBpbiBpdHMgYW5pbWF0aW9uIHF1ZXVlIGlzIGltbWVkaWF0ZWx5IHRyaWdnZXJlZC4gKi9cblx0ICAgICAgICAgICAgICAgIC8qIEFuIGFkZGl0aW9uYWwgYXJndW1lbnQgbWF5IGJlIHBhc3NlZCBpbiB0byBjbGVhciBhbiBlbGVtZW50J3MgcmVtYWluaW5nIHF1ZXVlZCBjYWxscy4gRWl0aGVyIHRydWUgKHdoaWNoIGRlZmF1bHRzIHRvIHRoZSBcImZ4XCIgcXVldWUpXG5cdCAgICAgICAgICAgICAgICAgICBvciBhIGN1c3RvbSBxdWV1ZSBzdHJpbmcgY2FuIGJlIHBhc3NlZCBpbi4gKi9cblx0ICAgICAgICAgICAgICAgIC8qIE5vdGU6IFRoZSBzdG9wIGNvbW1hbmQgcnVucyBwcmlvciB0byBWZWxvY2l0eSdzIFF1ZXVlaW5nIHBoYXNlIHNpbmNlIGl0cyBiZWhhdmlvciBpcyBpbnRlbmRlZCB0byB0YWtlIGVmZmVjdCAqaW1tZWRpYXRlbHkqLFxuXHQgICAgICAgICAgICAgICAgICAgcmVnYXJkbGVzcyBvZiB0aGUgZWxlbWVudCdzIGN1cnJlbnQgcXVldWUgc3RhdGUuICovXG5cblx0ICAgICAgICAgICAgICAgIC8qIEl0ZXJhdGUgdGhyb3VnaCBldmVyeSBhY3RpdmUgY2FsbC4gKi9cblx0ICAgICAgICAgICAgICAgICQuZWFjaChWZWxvY2l0eS5TdGF0ZS5jYWxscywgZnVuY3Rpb24oaSwgYWN0aXZlQ2FsbCkge1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIEluYWN0aXZlIGNhbGxzIGFyZSBzZXQgdG8gZmFsc2UgYnkgdGhlIGxvZ2ljIGluc2lkZSBjb21wbGV0ZUNhbGwoKS4gU2tpcCB0aGVtLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChhY3RpdmVDYWxsKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIEl0ZXJhdGUgdGhyb3VnaCB0aGUgYWN0aXZlIGNhbGwncyB0YXJnZXRlZCBlbGVtZW50cy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGFjdGl2ZUNhbGxbMV0sIGZ1bmN0aW9uKGssIGFjdGl2ZUVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRydWUgd2FzIHBhc3NlZCBpbiBhcyBhIHNlY29uZGFyeSBhcmd1bWVudCwgY2xlYXIgYWJzb2x1dGVseSBhbGwgY2FsbHMgb24gdGhpcyBlbGVtZW50LiBPdGhlcndpc2UsIG9ubHlcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyIGNhbGxzIGFzc29jaWF0ZWQgd2l0aCB0aGUgcmVsZXZhbnQgcXVldWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDYWxsIHN0b3BwaW5nIGxvZ2ljIHdvcmtzIGFzIGZvbGxvd3M6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIG9wdGlvbnMgPT09IHRydWUgLS0+IHN0b3AgY3VycmVudCBkZWZhdWx0IHF1ZXVlIGNhbGxzIChhbmQgcXVldWU6ZmFsc2UgY2FsbHMpLCBpbmNsdWRpbmcgcmVtYWluaW5nIHF1ZXVlZCBvbmVzLlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLSBvcHRpb25zID09PSB1bmRlZmluZWQgLS0+IHN0b3AgY3VycmVudCBxdWV1ZTpcIlwiIGNhbGwgYW5kIGFsbCBxdWV1ZTpmYWxzZSBjYWxscy5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0gb3B0aW9ucyA9PT0gZmFsc2UgLS0+IHN0b3Agb25seSBxdWV1ZTpmYWxzZSBjYWxscy5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0gb3B0aW9ucyA9PT0gXCJjdXN0b21cIiAtLT4gc3RvcCBjdXJyZW50IHF1ZXVlOlwiY3VzdG9tXCIgY2FsbCwgaW5jbHVkaW5nIHJlbWFpbmluZyBxdWV1ZWQgb25lcyAodGhlcmUgaXMgbm8gZnVuY3Rpb25hbGl0eSB0byBvbmx5IGNsZWFyIHRoZSBjdXJyZW50bHktcnVubmluZyBxdWV1ZTpcImN1c3RvbVwiIGNhbGwpLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHF1ZXVlTmFtZSA9IChvcHRpb25zID09PSB1bmRlZmluZWQpID8gXCJcIiA6IG9wdGlvbnM7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChxdWV1ZU5hbWUgIT09IHRydWUgJiYgKGFjdGl2ZUNhbGxbMl0ucXVldWUgIT09IHF1ZXVlTmFtZSkgJiYgIShvcHRpb25zID09PSB1bmRlZmluZWQgJiYgYWN0aXZlQ2FsbFsyXS5xdWV1ZSA9PT0gZmFsc2UpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEl0ZXJhdGUgdGhyb3VnaCB0aGUgY2FsbHMgdGFyZ2V0ZWQgYnkgdGhlIHN0b3AgY29tbWFuZC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChlbGVtZW50cywgZnVuY3Rpb24obCwgZWxlbWVudCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIENoZWNrIHRoYXQgdGhpcyBjYWxsIHdhcyBhcHBsaWVkIHRvIHRoZSB0YXJnZXQgZWxlbWVudC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudCA9PT0gYWN0aXZlRWxlbWVudCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBPcHRpb25hbGx5IGNsZWFyIHRoZSByZW1haW5pbmcgcXVldWVkIGNhbGxzLiBJZiB3ZSdyZSBkb2luZyBcImZpbmlzaEFsbFwiIHRoaXMgd29uJ3QgZmluZCBhbnl0aGluZyxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZHVlIHRvIHRoZSBxdWV1ZS1jbGVhcmluZyBhYm92ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMgPT09IHRydWUgfHwgVHlwZS5pc1N0cmluZyhvcHRpb25zKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSXRlcmF0ZSB0aHJvdWdoIHRoZSBpdGVtcyBpbiB0aGUgZWxlbWVudCdzIHF1ZXVlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKCQucXVldWUoZWxlbWVudCwgVHlwZS5pc1N0cmluZyhvcHRpb25zKSA/IG9wdGlvbnMgOiBcIlwiKSwgZnVuY3Rpb24oXywgaXRlbSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRoZSBxdWV1ZSBhcnJheSBjYW4gY29udGFpbiBhbiBcImlucHJvZ3Jlc3NcIiBzdHJpbmcsIHdoaWNoIHdlIHNraXAuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFR5cGUuaXNGdW5jdGlvbihpdGVtKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBQYXNzIHRoZSBpdGVtJ3MgY2FsbGJhY2sgYSBmbGFnIGluZGljYXRpbmcgdGhhdCB3ZSB3YW50IHRvIGFib3J0IGZyb20gdGhlIHF1ZXVlIGNhbGwuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChTcGVjaWZpY2FsbHksIHRoZSBxdWV1ZSB3aWxsIHJlc29sdmUgdGhlIGNhbGwncyBhc3NvY2lhdGVkIHByb21pc2UgdGhlbiBhYm9ydC4pICAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtKG51bGwsIHRydWUpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDbGVhcmluZyB0aGUgJC5xdWV1ZSgpIGFycmF5IGlzIGFjaGlldmVkIGJ5IHJlc2V0dGluZyBpdCB0byBbXS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQucXVldWUoZWxlbWVudCwgVHlwZS5pc1N0cmluZyhvcHRpb25zKSA/IG9wdGlvbnMgOiBcIlwiLCBbXSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydGllc01hcCA9PT0gXCJzdG9wXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFNpbmNlIFwicmV2ZXJzZVwiIHVzZXMgY2FjaGVkIHN0YXJ0IHZhbHVlcyAodGhlIHByZXZpb3VzIGNhbGwncyBlbmRWYWx1ZXMpLCB0aGVzZSB2YWx1ZXMgbXVzdCBiZVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlZCB0byByZWZsZWN0IHRoZSBmaW5hbCB2YWx1ZSB0aGF0IHRoZSBlbGVtZW50cyB3ZXJlIGFjdHVhbGx5IHR3ZWVuZWQgdG8uICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBJZiBvbmx5IHF1ZXVlOmZhbHNlIGFuaW1hdGlvbnMgYXJlIGN1cnJlbnRseSBydW5uaW5nIG9uIGFuIGVsZW1lbnQsIGl0IHdvbid0IGhhdmUgYSB0d2VlbnNDb250YWluZXJcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdC4gQWxzbywgcXVldWU6ZmFsc2UgYW5pbWF0aW9ucyBjYW4ndCBiZSByZXZlcnNlZC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpICYmIERhdGEoZWxlbWVudCkudHdlZW5zQ29udGFpbmVyICYmIHF1ZXVlTmFtZSAhPT0gZmFsc2UpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2goRGF0YShlbGVtZW50KS50d2VlbnNDb250YWluZXIsIGZ1bmN0aW9uKG0sIGFjdGl2ZVR3ZWVuKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZVR3ZWVuLmVuZFZhbHVlID0gYWN0aXZlVHdlZW4uY3VycmVudFZhbHVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsc1RvU3RvcC5wdXNoKGkpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByb3BlcnRpZXNNYXAgPT09IFwiZmluaXNoXCIgfHwgcHJvcGVydGllc01hcCA9PT0gXCJmaW5pc2hBbGxcIikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVG8gZ2V0IGFjdGl2ZSB0d2VlbnMgdG8gZmluaXNoIGltbWVkaWF0ZWx5LCB3ZSBmb3JjZWZ1bGx5IHNob3J0ZW4gdGhlaXIgZHVyYXRpb25zIHRvIDFtcyBzbyB0aGF0XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGV5IGZpbmlzaCB1cG9uIHRoZSBuZXh0IHJBZiB0aWNrIHRoZW4gcHJvY2VlZCB3aXRoIG5vcm1hbCBjYWxsIGNvbXBsZXRpb24gbG9naWMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmVDYWxsWzJdLmR1cmF0aW9uID0gMTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9KTtcblxuXHQgICAgICAgICAgICAgICAgLyogUHJlbWF0dXJlbHkgY2FsbCBjb21wbGV0ZUNhbGwoKSBvbiBlYWNoIG1hdGNoZWQgYWN0aXZlIGNhbGwuIFBhc3MgYW4gYWRkaXRpb25hbCBmbGFnIGZvciBcInN0b3BcIiB0byBpbmRpY2F0ZVxuXHQgICAgICAgICAgICAgICAgICAgdGhhdCB0aGUgY29tcGxldGUgY2FsbGJhY2sgYW5kIGRpc3BsYXk6bm9uZSBzZXR0aW5nIHNob3VsZCBiZSBza2lwcGVkIHNpbmNlIHdlJ3JlIGNvbXBsZXRpbmcgcHJlbWF0dXJlbHkuICovXG5cdCAgICAgICAgICAgICAgICBpZiAocHJvcGVydGllc01hcCA9PT0gXCJzdG9wXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAkLmVhY2goY2FsbHNUb1N0b3AsIGZ1bmN0aW9uKGksIGopIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY29tcGxldGVDYWxsKGosIHRydWUpO1xuXHQgICAgICAgICAgICAgICAgICAgIH0pO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKHByb21pc2VEYXRhLnByb21pc2UpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogSW1tZWRpYXRlbHkgcmVzb2x2ZSB0aGUgcHJvbWlzZSBhc3NvY2lhdGVkIHdpdGggdGhpcyBzdG9wIGNhbGwgc2luY2Ugc3RvcCBydW5zIHN5bmNocm9ub3VzbHkuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VEYXRhLnJlc29sdmVyKGVsZW1lbnRzKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIC8qIFNpbmNlIHdlJ3JlIHN0b3BwaW5nLCBhbmQgbm90IHByb2NlZWRpbmcgd2l0aCBxdWV1ZWluZywgZXhpdCBvdXQgb2YgVmVsb2NpdHkuICovXG5cdCAgICAgICAgICAgICAgICByZXR1cm4gZ2V0Q2hhaW4oKTtcblxuXHQgICAgICAgICAgICBkZWZhdWx0OlxuXHQgICAgICAgICAgICAgICAgLyogVHJlYXQgYSBub24tZW1wdHkgcGxhaW4gb2JqZWN0IGFzIGEgbGl0ZXJhbCBwcm9wZXJ0aWVzIG1hcC4gKi9cblx0ICAgICAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3QocHJvcGVydGllc01hcCkgJiYgIVR5cGUuaXNFbXB0eU9iamVjdChwcm9wZXJ0aWVzTWFwKSkge1xuXHQgICAgICAgICAgICAgICAgICAgIGFjdGlvbiA9IFwic3RhcnRcIjtcblxuXHQgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICBSZWRpcmVjdHNcblx0ICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgIC8qIENoZWNrIGlmIGEgc3RyaW5nIG1hdGNoZXMgYSByZWdpc3RlcmVkIHJlZGlyZWN0IChzZWUgUmVkaXJlY3RzIGFib3ZlKS4gKi9cblx0ICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoVHlwZS5pc1N0cmluZyhwcm9wZXJ0aWVzTWFwKSAmJiBWZWxvY2l0eS5SZWRpcmVjdHNbcHJvcGVydGllc01hcF0pIHtcblx0ICAgICAgICAgICAgICAgICAgICB2YXIgb3B0cyA9ICQuZXh0ZW5kKHt9LCBvcHRpb25zKSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgZHVyYXRpb25PcmlnaW5hbCA9IG9wdHMuZHVyYXRpb24sXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGRlbGF5T3JpZ2luYWwgPSBvcHRzLmRlbGF5IHx8IDA7XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgYmFja3dhcmRzIG9wdGlvbiB3YXMgcGFzc2VkIGluLCByZXZlcnNlIHRoZSBlbGVtZW50IHNldCBzbyB0aGF0IGVsZW1lbnRzIGFuaW1hdGUgZnJvbSB0aGUgbGFzdCB0byB0aGUgZmlyc3QuICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMuYmFja3dhcmRzID09PSB0cnVlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRzID0gJC5leHRlbmQodHJ1ZSwgW10sIGVsZW1lbnRzKS5yZXZlcnNlKCk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogSW5kaXZpZHVhbGx5IHRyaWdnZXIgdGhlIHJlZGlyZWN0IGZvciBlYWNoIGVsZW1lbnQgaW4gdGhlIHNldCB0byBwcmV2ZW50IHVzZXJzIGZyb20gaGF2aW5nIHRvIGhhbmRsZSBpdGVyYXRpb24gbG9naWMgaW4gdGhlaXIgcmVkaXJlY3QuICovXG5cdCAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGVsZW1lbnRzLCBmdW5jdGlvbihlbGVtZW50SW5kZXgsIGVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIHN0YWdnZXIgb3B0aW9uIHdhcyBwYXNzZWQgaW4sIHN1Y2Nlc3NpdmVseSBkZWxheSBlYWNoIGVsZW1lbnQgYnkgdGhlIHN0YWdnZXIgdmFsdWUgKGluIG1zKS4gUmV0YWluIHRoZSBvcmlnaW5hbCBkZWxheSB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhcnNlRmxvYXQob3B0cy5zdGFnZ2VyKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0cy5kZWxheSA9IGRlbGF5T3JpZ2luYWwgKyAocGFyc2VGbG9hdChvcHRzLnN0YWdnZXIpICogZWxlbWVudEluZGV4KTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChUeXBlLmlzRnVuY3Rpb24ob3B0cy5zdGFnZ2VyKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0cy5kZWxheSA9IGRlbGF5T3JpZ2luYWwgKyBvcHRzLnN0YWdnZXIuY2FsbChlbGVtZW50LCBlbGVtZW50SW5kZXgsIGVsZW1lbnRzTGVuZ3RoKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBkcmFnIG9wdGlvbiB3YXMgcGFzc2VkIGluLCBzdWNjZXNzaXZlbHkgaW5jcmVhc2UvZGVjcmVhc2UgKGRlcGVuZGluZyBvbiB0aGUgcHJlc2Vuc2Ugb2Ygb3B0cy5iYWNrd2FyZHMpXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZSBkdXJhdGlvbiBvZiBlYWNoIGVsZW1lbnQncyBhbmltYXRpb24sIHVzaW5nIGZsb29ycyB0byBwcmV2ZW50IHByb2R1Y2luZyB2ZXJ5IHNob3J0IGR1cmF0aW9ucy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMuZHJhZykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRGVmYXVsdCB0aGUgZHVyYXRpb24gb2YgVUkgcGFjayBlZmZlY3RzIChjYWxsb3V0cyBhbmQgdHJhbnNpdGlvbnMpIHRvIDEwMDBtcyBpbnN0ZWFkIG9mIHRoZSB1c3VhbCBkZWZhdWx0IGR1cmF0aW9uIG9mIDQwMG1zLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0cy5kdXJhdGlvbiA9IHBhcnNlRmxvYXQoZHVyYXRpb25PcmlnaW5hbCkgfHwgKC9eKGNhbGxvdXR8dHJhbnNpdGlvbikvLnRlc3QocHJvcGVydGllc01hcCkgPyAxMDAwIDogRFVSQVRJT05fREVGQVVMVCk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEZvciBlYWNoIGVsZW1lbnQsIHRha2UgdGhlIGdyZWF0ZXIgZHVyYXRpb24gb2Y6IEEpIGFuaW1hdGlvbiBjb21wbGV0aW9uIHBlcmNlbnRhZ2UgcmVsYXRpdmUgdG8gdGhlIG9yaWdpbmFsIGR1cmF0aW9uLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQikgNzUlIG9mIHRoZSBvcmlnaW5hbCBkdXJhdGlvbiwgb3IgQykgYSAyMDBtcyBmYWxsYmFjayAoaW4gY2FzZSBkdXJhdGlvbiBpcyBhbHJlYWR5IHNldCB0byBhIGxvdyB2YWx1ZSkuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUaGUgZW5kIHJlc3VsdCBpcyBhIGJhc2VsaW5lIG9mIDc1JSBvZiB0aGUgcmVkaXJlY3QncyBkdXJhdGlvbiB0aGF0IGluY3JlYXNlcy9kZWNyZWFzZXMgYXMgdGhlIGVuZCBvZiB0aGUgZWxlbWVudCBzZXQgaXMgYXBwcm9hY2hlZC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdHMuZHVyYXRpb24gPSBNYXRoLm1heChvcHRzLmR1cmF0aW9uICogKG9wdHMuYmFja3dhcmRzID8gMSAtIGVsZW1lbnRJbmRleC9lbGVtZW50c0xlbmd0aCA6IChlbGVtZW50SW5kZXggKyAxKSAvIGVsZW1lbnRzTGVuZ3RoKSwgb3B0cy5kdXJhdGlvbiAqIDAuNzUsIDIwMCk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBQYXNzIGluIHRoZSBjYWxsJ3Mgb3B0cyBvYmplY3Qgc28gdGhhdCB0aGUgcmVkaXJlY3QgY2FuIG9wdGlvbmFsbHkgZXh0ZW5kIGl0LiBJdCBkZWZhdWx0cyB0byBhbiBlbXB0eSBvYmplY3QgaW5zdGVhZCBvZiBudWxsIHRvXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZHVjZSB0aGUgb3B0cyBjaGVja2luZyBsb2dpYyByZXF1aXJlZCBpbnNpZGUgdGhlIHJlZGlyZWN0LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5SZWRpcmVjdHNbcHJvcGVydGllc01hcF0uY2FsbChlbGVtZW50LCBlbGVtZW50LCBvcHRzIHx8IHt9LCBlbGVtZW50SW5kZXgsIGVsZW1lbnRzTGVuZ3RoLCBlbGVtZW50cywgcHJvbWlzZURhdGEucHJvbWlzZSA/IHByb21pc2VEYXRhIDogdW5kZWZpbmVkKTtcblx0ICAgICAgICAgICAgICAgICAgICB9KTtcblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIFNpbmNlIHRoZSBhbmltYXRpb24gbG9naWMgcmVzaWRlcyB3aXRoaW4gdGhlIHJlZGlyZWN0J3Mgb3duIGNvZGUsIGFib3J0IHRoZSByZW1haW5kZXIgb2YgdGhpcyBjYWxsLlxuXHQgICAgICAgICAgICAgICAgICAgICAgIChUaGUgcGVyZm9ybWFuY2Ugb3ZlcmhlYWQgdXAgdG8gdGhpcyBwb2ludCBpcyB2aXJ0dWFsbHkgbm9uLWV4aXN0YW50LikgKi9cblx0ICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBUaGUgalF1ZXJ5IGNhbGwgY2hhaW4gaXMga2VwdCBpbnRhY3QgYnkgcmV0dXJuaW5nIHRoZSBjb21wbGV0ZSBlbGVtZW50IHNldC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2V0Q2hhaW4oKTtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIGFib3J0RXJyb3IgPSBcIlZlbG9jaXR5OiBGaXJzdCBhcmd1bWVudCAoXCIgKyBwcm9wZXJ0aWVzTWFwICsgXCIpIHdhcyBub3QgYSBwcm9wZXJ0eSBtYXAsIGEga25vd24gYWN0aW9uLCBvciBhIHJlZ2lzdGVyZWQgcmVkaXJlY3QuIEFib3J0aW5nLlwiO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKHByb21pc2VEYXRhLnByb21pc2UpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZURhdGEucmVqZWN0ZXIobmV3IEVycm9yKGFib3J0RXJyb3IpKTtcblx0ICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhhYm9ydEVycm9yKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICByZXR1cm4gZ2V0Q2hhaW4oKTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgQ2FsbC1XaWRlIFZhcmlhYmxlc1xuXHQgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgLyogQSBjb250YWluZXIgZm9yIENTUyB1bml0IGNvbnZlcnNpb24gcmF0aW9zIChlLmcuICUsIHJlbSwgYW5kIGVtID09PiBweCkgdGhhdCBpcyB1c2VkIHRvIGNhY2hlIHJhdGlvcyBhY3Jvc3MgYWxsIGVsZW1lbnRzXG5cdCAgICAgICAgICAgYmVpbmcgYW5pbWF0ZWQgaW4gYSBzaW5nbGUgVmVsb2NpdHkgY2FsbC4gQ2FsY3VsYXRpbmcgdW5pdCByYXRpb3MgbmVjZXNzaXRhdGVzIERPTSBxdWVyeWluZyBhbmQgdXBkYXRpbmcsIGFuZCBpcyB0aGVyZWZvcmVcblx0ICAgICAgICAgICBhdm9pZGVkICh2aWEgY2FjaGluZykgd2hlcmV2ZXIgcG9zc2libGUuIFRoaXMgY29udGFpbmVyIGlzIGNhbGwtd2lkZSBpbnN0ZWFkIG9mIHBhZ2Utd2lkZSB0byBhdm9pZCB0aGUgcmlzayBvZiB1c2luZyBzdGFsZVxuXHQgICAgICAgICAgIGNvbnZlcnNpb24gbWV0cmljcyBhY3Jvc3MgVmVsb2NpdHkgYW5pbWF0aW9ucyB0aGF0IGFyZSBub3QgaW1tZWRpYXRlbHkgY29uc2VjdXRpdmVseSBjaGFpbmVkLiAqL1xuXHQgICAgICAgIHZhciBjYWxsVW5pdENvbnZlcnNpb25EYXRhID0ge1xuXHQgICAgICAgICAgICAgICAgbGFzdFBhcmVudDogbnVsbCxcblx0ICAgICAgICAgICAgICAgIGxhc3RQb3NpdGlvbjogbnVsbCxcblx0ICAgICAgICAgICAgICAgIGxhc3RGb250U2l6ZTogbnVsbCxcblx0ICAgICAgICAgICAgICAgIGxhc3RQZXJjZW50VG9QeFdpZHRoOiBudWxsLFxuXHQgICAgICAgICAgICAgICAgbGFzdFBlcmNlbnRUb1B4SGVpZ2h0OiBudWxsLFxuXHQgICAgICAgICAgICAgICAgbGFzdEVtVG9QeDogbnVsbCxcblx0ICAgICAgICAgICAgICAgIHJlbVRvUHg6IG51bGwsXG5cdCAgICAgICAgICAgICAgICB2d1RvUHg6IG51bGwsXG5cdCAgICAgICAgICAgICAgICB2aFRvUHg6IG51bGxcblx0ICAgICAgICAgICAgfTtcblxuXHQgICAgICAgIC8qIEEgY29udGFpbmVyIGZvciBhbGwgdGhlIGVuc3VpbmcgdHdlZW4gZGF0YSBhbmQgbWV0YWRhdGEgYXNzb2NpYXRlZCB3aXRoIHRoaXMgY2FsbC4gVGhpcyBjb250YWluZXIgZ2V0cyBwdXNoZWQgdG8gdGhlIHBhZ2Utd2lkZVxuXHQgICAgICAgICAgIFZlbG9jaXR5LlN0YXRlLmNhbGxzIGFycmF5IHRoYXQgaXMgcHJvY2Vzc2VkIGR1cmluZyBhbmltYXRpb24gdGlja2luZy4gKi9cblx0ICAgICAgICB2YXIgY2FsbCA9IFtdO1xuXG5cdCAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgIEVsZW1lbnQgUHJvY2Vzc2luZ1xuXHQgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgIC8qIEVsZW1lbnQgcHJvY2Vzc2luZyBjb25zaXN0cyBvZiB0aHJlZSBwYXJ0cyAtLSBkYXRhIHByb2Nlc3NpbmcgdGhhdCBjYW5ub3QgZ28gc3RhbGUgYW5kIGRhdGEgcHJvY2Vzc2luZyB0aGF0ICpjYW4qIGdvIHN0YWxlIChpLmUuIHRoaXJkLXBhcnR5IHN0eWxlIG1vZGlmaWNhdGlvbnMpOlxuXHQgICAgICAgICAgIDEpIFByZS1RdWV1ZWluZzogRWxlbWVudC13aWRlIHZhcmlhYmxlcywgaW5jbHVkaW5nIHRoZSBlbGVtZW50J3MgZGF0YSBzdG9yYWdlLCBhcmUgaW5zdGFudGlhdGVkLiBDYWxsIG9wdGlvbnMgYXJlIHByZXBhcmVkLiBJZiB0cmlnZ2VyZWQsIHRoZSBTdG9wIGFjdGlvbiBpcyBleGVjdXRlZC5cblx0ICAgICAgICAgICAyKSBRdWV1ZWluZzogVGhlIGxvZ2ljIHRoYXQgcnVucyBvbmNlIHRoaXMgY2FsbCBoYXMgcmVhY2hlZCBpdHMgcG9pbnQgb2YgZXhlY3V0aW9uIGluIHRoZSBlbGVtZW50J3MgJC5xdWV1ZSgpIHN0YWNrLiBNb3N0IGxvZ2ljIGlzIHBsYWNlZCBoZXJlIHRvIGF2b2lkIHJpc2tpbmcgaXQgYmVjb21pbmcgc3RhbGUuXG5cdCAgICAgICAgICAgMykgUHVzaGluZzogQ29uc29saWRhdGlvbiBvZiB0aGUgdHdlZW4gZGF0YSBmb2xsb3dlZCBieSBpdHMgcHVzaCBvbnRvIHRoZSBnbG9iYWwgaW4tcHJvZ3Jlc3MgY2FsbHMgY29udGFpbmVyLlxuXHQgICAgICAgICovXG5cblx0ICAgICAgICBmdW5jdGlvbiBwcm9jZXNzRWxlbWVudCAoKSB7XG5cblx0ICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgUGFydCBJOiBQcmUtUXVldWVpbmdcblx0ICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgIEVsZW1lbnQtV2lkZSBWYXJpYWJsZXNcblx0ICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgIHZhciBlbGVtZW50ID0gdGhpcyxcblx0ICAgICAgICAgICAgICAgIC8qIFRoZSBydW50aW1lIG9wdHMgb2JqZWN0IGlzIHRoZSBleHRlbnNpb24gb2YgdGhlIGN1cnJlbnQgY2FsbCdzIG9wdGlvbnMgYW5kIFZlbG9jaXR5J3MgcGFnZS13aWRlIG9wdGlvbiBkZWZhdWx0cy4gKi9cblx0ICAgICAgICAgICAgICAgIG9wdHMgPSAkLmV4dGVuZCh7fSwgVmVsb2NpdHkuZGVmYXVsdHMsIG9wdGlvbnMpLFxuXHQgICAgICAgICAgICAgICAgLyogQSBjb250YWluZXIgZm9yIHRoZSBwcm9jZXNzZWQgZGF0YSBhc3NvY2lhdGVkIHdpdGggZWFjaCBwcm9wZXJ0eSBpbiB0aGUgcHJvcGVydHlNYXAuXG5cdCAgICAgICAgICAgICAgICAgICAoRWFjaCBwcm9wZXJ0eSBpbiB0aGUgbWFwIHByb2R1Y2VzIGl0cyBvd24gXCJ0d2VlblwiLikgKi9cblx0ICAgICAgICAgICAgICAgIHR3ZWVuc0NvbnRhaW5lciA9IHt9LFxuXHQgICAgICAgICAgICAgICAgZWxlbWVudFVuaXRDb252ZXJzaW9uRGF0YTtcblxuXHQgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgIEVsZW1lbnQgSW5pdFxuXHQgICAgICAgICAgICAqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgVmVsb2NpdHkuaW5pdChlbGVtZW50KTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgT3B0aW9uOiBEZWxheVxuXHQgICAgICAgICAgICAqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgLyogU2luY2UgcXVldWU6ZmFsc2UgZG9lc24ndCByZXNwZWN0IHRoZSBpdGVtJ3MgZXhpc3RpbmcgcXVldWUsIHdlIGF2b2lkIGluamVjdGluZyBpdHMgZGVsYXkgaGVyZSAoaXQncyBzZXQgbGF0ZXIgb24pLiAqL1xuXHQgICAgICAgICAgICAvKiBOb3RlOiBWZWxvY2l0eSByb2xscyBpdHMgb3duIGRlbGF5IGZ1bmN0aW9uIHNpbmNlIGpRdWVyeSBkb2Vzbid0IGhhdmUgYSB1dGlsaXR5IGFsaWFzIGZvciAkLmZuLmRlbGF5KClcblx0ICAgICAgICAgICAgICAgKGFuZCB0aHVzIHJlcXVpcmVzIGpRdWVyeSBlbGVtZW50IGNyZWF0aW9uLCB3aGljaCB3ZSBhdm9pZCBzaW5jZSBpdHMgb3ZlcmhlYWQgaW5jbHVkZXMgRE9NIHF1ZXJ5aW5nKS4gKi9cblx0ICAgICAgICAgICAgaWYgKHBhcnNlRmxvYXQob3B0cy5kZWxheSkgJiYgb3B0cy5xdWV1ZSAhPT0gZmFsc2UpIHtcblx0ICAgICAgICAgICAgICAgICQucXVldWUoZWxlbWVudCwgb3B0cy5xdWV1ZSwgZnVuY3Rpb24obmV4dCkge1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIFRoaXMgaXMgYSBmbGFnIHVzZWQgdG8gaW5kaWNhdGUgdG8gdGhlIHVwY29taW5nIGNvbXBsZXRlQ2FsbCgpIGZ1bmN0aW9uIHRoYXQgdGhpcyBxdWV1ZSBlbnRyeSB3YXMgaW5pdGlhdGVkIGJ5IFZlbG9jaXR5LiBTZWUgY29tcGxldGVDYWxsKCkgZm9yIGZ1cnRoZXIgZGV0YWlscy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS52ZWxvY2l0eVF1ZXVlRW50cnlGbGFnID0gdHJ1ZTtcblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIFRoZSBlbnN1aW5nIHF1ZXVlIGl0ZW0gKHdoaWNoIGlzIGFzc2lnbmVkIHRvIHRoZSBcIm5leHRcIiBhcmd1bWVudCB0aGF0ICQucXVldWUoKSBhdXRvbWF0aWNhbGx5IHBhc3NlcyBpbikgd2lsbCBiZSB0cmlnZ2VyZWQgYWZ0ZXIgYSBzZXRUaW1lb3V0IGRlbGF5LlxuXHQgICAgICAgICAgICAgICAgICAgICAgIFRoZSBzZXRUaW1lb3V0IGlzIHN0b3JlZCBzbyB0aGF0IGl0IGNhbiBiZSBzdWJqZWN0ZWQgdG8gY2xlYXJUaW1lb3V0KCkgaWYgdGhpcyBhbmltYXRpb24gaXMgcHJlbWF0dXJlbHkgc3RvcHBlZCB2aWEgVmVsb2NpdHkncyBcInN0b3BcIiBjb21tYW5kLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkuZGVsYXlUaW1lciA9IHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dDogc2V0VGltZW91dChuZXh0LCBwYXJzZUZsb2F0KG9wdHMuZGVsYXkpKSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgbmV4dDogbmV4dFxuXHQgICAgICAgICAgICAgICAgICAgIH07XG5cdCAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgT3B0aW9uOiBEdXJhdGlvblxuXHQgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgLyogU3VwcG9ydCBmb3IgalF1ZXJ5J3MgbmFtZWQgZHVyYXRpb25zLiAqL1xuXHQgICAgICAgICAgICBzd2l0Y2ggKG9wdHMuZHVyYXRpb24udG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpKSB7XG5cdCAgICAgICAgICAgICAgICBjYXNlIFwiZmFzdFwiOlxuXHQgICAgICAgICAgICAgICAgICAgIG9wdHMuZHVyYXRpb24gPSAyMDA7XG5cdCAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cblx0ICAgICAgICAgICAgICAgIGNhc2UgXCJub3JtYWxcIjpcblx0ICAgICAgICAgICAgICAgICAgICBvcHRzLmR1cmF0aW9uID0gRFVSQVRJT05fREVGQVVMVDtcblx0ICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuXHQgICAgICAgICAgICAgICAgY2FzZSBcInNsb3dcIjpcblx0ICAgICAgICAgICAgICAgICAgICBvcHRzLmR1cmF0aW9uID0gNjAwO1xuXHQgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG5cdCAgICAgICAgICAgICAgICBkZWZhdWx0OlxuXHQgICAgICAgICAgICAgICAgICAgIC8qIFJlbW92ZSB0aGUgcG90ZW50aWFsIFwibXNcIiBzdWZmaXggYW5kIGRlZmF1bHQgdG8gMSBpZiB0aGUgdXNlciBpcyBhdHRlbXB0aW5nIHRvIHNldCBhIGR1cmF0aW9uIG9mIDAgKGluIG9yZGVyIHRvIHByb2R1Y2UgYW4gaW1tZWRpYXRlIHN0eWxlIGNoYW5nZSkuICovXG5cdCAgICAgICAgICAgICAgICAgICAgb3B0cy5kdXJhdGlvbiA9IHBhcnNlRmxvYXQob3B0cy5kdXJhdGlvbikgfHwgMTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgR2xvYmFsIE9wdGlvbjogTW9ja1xuXHQgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgaWYgKFZlbG9jaXR5Lm1vY2sgIT09IGZhbHNlKSB7XG5cdCAgICAgICAgICAgICAgICAvKiBJbiBtb2NrIG1vZGUsIGFsbCBhbmltYXRpb25zIGFyZSBmb3JjZWQgdG8gMW1zIHNvIHRoYXQgdGhleSBvY2N1ciBpbW1lZGlhdGVseSB1cG9uIHRoZSBuZXh0IHJBRiB0aWNrLlxuXHQgICAgICAgICAgICAgICAgICAgQWx0ZXJuYXRpdmVseSwgYSBtdWx0aXBsaWVyIGNhbiBiZSBwYXNzZWQgaW4gdG8gdGltZSByZW1hcCBhbGwgZGVsYXlzIGFuZCBkdXJhdGlvbnMuICovXG5cdCAgICAgICAgICAgICAgICBpZiAoVmVsb2NpdHkubW9jayA9PT0gdHJ1ZSkge1xuXHQgICAgICAgICAgICAgICAgICAgIG9wdHMuZHVyYXRpb24gPSBvcHRzLmRlbGF5ID0gMTtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgb3B0cy5kdXJhdGlvbiAqPSBwYXJzZUZsb2F0KFZlbG9jaXR5Lm1vY2spIHx8IDE7XG5cdCAgICAgICAgICAgICAgICAgICAgb3B0cy5kZWxheSAqPSBwYXJzZUZsb2F0KFZlbG9jaXR5Lm1vY2spIHx8IDE7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICBPcHRpb246IEVhc2luZ1xuXHQgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgIG9wdHMuZWFzaW5nID0gZ2V0RWFzaW5nKG9wdHMuZWFzaW5nLCBvcHRzLmR1cmF0aW9uKTtcblxuXHQgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICBPcHRpb246IENhbGxiYWNrc1xuXHQgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgIC8qIENhbGxiYWNrcyBtdXN0IGZ1bmN0aW9ucy4gT3RoZXJ3aXNlLCBkZWZhdWx0IHRvIG51bGwuICovXG5cdCAgICAgICAgICAgIGlmIChvcHRzLmJlZ2luICYmICFUeXBlLmlzRnVuY3Rpb24ob3B0cy5iZWdpbikpIHtcblx0ICAgICAgICAgICAgICAgIG9wdHMuYmVnaW4gPSBudWxsO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgaWYgKG9wdHMucHJvZ3Jlc3MgJiYgIVR5cGUuaXNGdW5jdGlvbihvcHRzLnByb2dyZXNzKSkge1xuXHQgICAgICAgICAgICAgICAgb3B0cy5wcm9ncmVzcyA9IG51bGw7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBpZiAob3B0cy5jb21wbGV0ZSAmJiAhVHlwZS5pc0Z1bmN0aW9uKG9wdHMuY29tcGxldGUpKSB7XG5cdCAgICAgICAgICAgICAgICBvcHRzLmNvbXBsZXRlID0gbnVsbDtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgT3B0aW9uOiBEaXNwbGF5ICYgVmlzaWJpbGl0eVxuXHQgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgLyogUmVmZXIgdG8gVmVsb2NpdHkncyBkb2N1bWVudGF0aW9uIChWZWxvY2l0eUpTLm9yZy8jZGlzcGxheUFuZFZpc2liaWxpdHkpIGZvciBhIGRlc2NyaXB0aW9uIG9mIHRoZSBkaXNwbGF5IGFuZCB2aXNpYmlsaXR5IG9wdGlvbnMnIGJlaGF2aW9yLiAqL1xuXHQgICAgICAgICAgICAvKiBOb3RlOiBXZSBzdHJpY3RseSBjaGVjayBmb3IgdW5kZWZpbmVkIGluc3RlYWQgb2YgZmFsc2luZXNzIGJlY2F1c2UgZGlzcGxheSBhY2NlcHRzIGFuIGVtcHR5IHN0cmluZyB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgaWYgKG9wdHMuZGlzcGxheSAhPT0gdW5kZWZpbmVkICYmIG9wdHMuZGlzcGxheSAhPT0gbnVsbCkge1xuXHQgICAgICAgICAgICAgICAgb3B0cy5kaXNwbGF5ID0gb3B0cy5kaXNwbGF5LnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKTtcblxuXHQgICAgICAgICAgICAgICAgLyogVXNlcnMgY2FuIHBhc3MgaW4gYSBzcGVjaWFsIFwiYXV0b1wiIHZhbHVlIHRvIGluc3RydWN0IFZlbG9jaXR5IHRvIHNldCB0aGUgZWxlbWVudCB0byBpdHMgZGVmYXVsdCBkaXNwbGF5IHZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKG9wdHMuZGlzcGxheSA9PT0gXCJhdXRvXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICBvcHRzLmRpc3BsYXkgPSBWZWxvY2l0eS5DU1MuVmFsdWVzLmdldERpc3BsYXlUeXBlKGVsZW1lbnQpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgaWYgKG9wdHMudmlzaWJpbGl0eSAhPT0gdW5kZWZpbmVkICYmIG9wdHMudmlzaWJpbGl0eSAhPT0gbnVsbCkge1xuXHQgICAgICAgICAgICAgICAgb3B0cy52aXNpYmlsaXR5ID0gb3B0cy52aXNpYmlsaXR5LnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgIE9wdGlvbjogbW9iaWxlSEFcblx0ICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAvKiBXaGVuIHNldCB0byB0cnVlLCBhbmQgaWYgdGhpcyBpcyBhIG1vYmlsZSBkZXZpY2UsIG1vYmlsZUhBIGF1dG9tYXRpY2FsbHkgZW5hYmxlcyBoYXJkd2FyZSBhY2NlbGVyYXRpb24gKHZpYSBhIG51bGwgdHJhbnNmb3JtIGhhY2spXG5cdCAgICAgICAgICAgICAgIG9uIGFuaW1hdGluZyBlbGVtZW50cy4gSEEgaXMgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50IGF0IHRoZSBjb21wbGV0aW9uIG9mIGl0cyBhbmltYXRpb24uICovXG5cdCAgICAgICAgICAgIC8qIE5vdGU6IEFuZHJvaWQgR2luZ2VyYnJlYWQgZG9lc24ndCBzdXBwb3J0IEhBLiBJZiBhIG51bGwgdHJhbnNmb3JtIGhhY2sgKG1vYmlsZUhBKSBpcyBpbiBmYWN0IHNldCwgaXQgd2lsbCBwcmV2ZW50IG90aGVyIHRyYW5mb3JtIHN1YnByb3BlcnRpZXMgZnJvbSB0YWtpbmcgZWZmZWN0LiAqL1xuXHQgICAgICAgICAgICAvKiBOb3RlOiBZb3UgY2FuIHJlYWQgbW9yZSBhYm91dCB0aGUgdXNlIG9mIG1vYmlsZUhBIGluIFZlbG9jaXR5J3MgZG9jdW1lbnRhdGlvbjogVmVsb2NpdHlKUy5vcmcvI21vYmlsZUhBLiAqL1xuXHQgICAgICAgICAgICBvcHRzLm1vYmlsZUhBID0gKG9wdHMubW9iaWxlSEEgJiYgVmVsb2NpdHkuU3RhdGUuaXNNb2JpbGUgJiYgIVZlbG9jaXR5LlN0YXRlLmlzR2luZ2VyYnJlYWQpO1xuXG5cdCAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICBQYXJ0IElJOiBRdWV1ZWluZ1xuXHQgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAvKiBXaGVuIGEgc2V0IG9mIGVsZW1lbnRzIGlzIHRhcmdldGVkIGJ5IGEgVmVsb2NpdHkgY2FsbCwgdGhlIHNldCBpcyBicm9rZW4gdXAgYW5kIGVhY2ggZWxlbWVudCBoYXMgdGhlIGN1cnJlbnQgVmVsb2NpdHkgY2FsbCBpbmRpdmlkdWFsbHkgcXVldWVkIG9udG8gaXQuXG5cdCAgICAgICAgICAgICAgIEluIHRoaXMgd2F5LCBlYWNoIGVsZW1lbnQncyBleGlzdGluZyBxdWV1ZSBpcyByZXNwZWN0ZWQ7IHNvbWUgZWxlbWVudHMgbWF5IGFscmVhZHkgYmUgYW5pbWF0aW5nIGFuZCBhY2NvcmRpbmdseSBzaG91bGQgbm90IGhhdmUgdGhpcyBjdXJyZW50IFZlbG9jaXR5IGNhbGwgdHJpZ2dlcmVkIGltbWVkaWF0ZWx5LiAqL1xuXHQgICAgICAgICAgICAvKiBJbiBlYWNoIHF1ZXVlLCB0d2VlbiBkYXRhIGlzIHByb2Nlc3NlZCBmb3IgZWFjaCBhbmltYXRpbmcgcHJvcGVydHkgdGhlbiBwdXNoZWQgb250byB0aGUgY2FsbC13aWRlIGNhbGxzIGFycmF5LiBXaGVuIHRoZSBsYXN0IGVsZW1lbnQgaW4gdGhlIHNldCBoYXMgaGFkIGl0cyB0d2VlbnMgcHJvY2Vzc2VkLFxuXHQgICAgICAgICAgICAgICB0aGUgY2FsbCBhcnJheSBpcyBwdXNoZWQgdG8gVmVsb2NpdHkuU3RhdGUuY2FsbHMgZm9yIGxpdmUgcHJvY2Vzc2luZyBieSB0aGUgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHRpY2suICovXG5cdCAgICAgICAgICAgIGZ1bmN0aW9uIGJ1aWxkUXVldWUgKG5leHQpIHtcblxuXHQgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgIE9wdGlvbjogQmVnaW5cblx0ICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgIC8qIFRoZSBiZWdpbiBjYWxsYmFjayBpcyBmaXJlZCBvbmNlIHBlciBjYWxsIC0tIG5vdCBvbmNlIHBlciBlbGVtZW5ldCAtLSBhbmQgaXMgcGFzc2VkIHRoZSBmdWxsIHJhdyBET00gZWxlbWVudCBzZXQgYXMgYm90aCBpdHMgY29udGV4dCBhbmQgaXRzIGZpcnN0IGFyZ3VtZW50LiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKG9wdHMuYmVnaW4gJiYgZWxlbWVudHNJbmRleCA9PT0gMCkge1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIFdlIHRocm93IGNhbGxiYWNrcyBpbiBhIHNldFRpbWVvdXQgc28gdGhhdCB0aHJvd24gZXJyb3JzIGRvbid0IGhhbHQgdGhlIGV4ZWN1dGlvbiBvZiBWZWxvY2l0eSBpdHNlbGYuICovXG5cdCAgICAgICAgICAgICAgICAgICAgdHJ5IHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgb3B0cy5iZWdpbi5jYWxsKGVsZW1lbnRzLCBlbGVtZW50cyk7XG5cdCAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgdGhyb3cgZXJyb3I7IH0sIDEpO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICBUd2VlbiBEYXRhIENvbnN0cnVjdGlvbiAoZm9yIFNjcm9sbClcblx0ICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAvKiBOb3RlOiBJbiBvcmRlciB0byBiZSBzdWJqZWN0ZWQgdG8gY2hhaW5pbmcgYW5kIGFuaW1hdGlvbiBvcHRpb25zLCBzY3JvbGwncyB0d2VlbmluZyBpcyByb3V0ZWQgdGhyb3VnaCBWZWxvY2l0eSBhcyBpZiBpdCB3ZXJlIGEgc3RhbmRhcmQgQ1NTIHByb3BlcnR5IGFuaW1hdGlvbi4gKi9cblx0ICAgICAgICAgICAgICAgIGlmIChhY3Rpb24gPT09IFwic2Nyb2xsXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAvKiBUaGUgc2Nyb2xsIGFjdGlvbiB1bmlxdWVseSB0YWtlcyBhbiBvcHRpb25hbCBcIm9mZnNldFwiIG9wdGlvbiAtLSBzcGVjaWZpZWQgaW4gcGl4ZWxzIC0tIHRoYXQgb2Zmc2V0cyB0aGUgdGFyZ2V0ZWQgc2Nyb2xsIHBvc2l0aW9uLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIHZhciBzY3JvbGxEaXJlY3Rpb24gPSAoL154JC9pLnRlc3Qob3B0cy5heGlzKSA/IFwiTGVmdFwiIDogXCJUb3BcIiksXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbE9mZnNldCA9IHBhcnNlRmxvYXQob3B0cy5vZmZzZXQpIHx8IDAsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFBvc2l0aW9uQ3VycmVudCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsUG9zaXRpb25DdXJyZW50QWx0ZXJuYXRlLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxQb3NpdGlvbkVuZDtcblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIFNjcm9sbCBhbHNvIHVuaXF1ZWx5IHRha2VzIGFuIG9wdGlvbmFsIFwiY29udGFpbmVyXCIgb3B0aW9uLCB3aGljaCBpbmRpY2F0ZXMgdGhlIHBhcmVudCBlbGVtZW50IHRoYXQgc2hvdWxkIGJlIHNjcm9sbGVkIC0tXG5cdCAgICAgICAgICAgICAgICAgICAgICAgYXMgb3Bwb3NlZCB0byB0aGUgYnJvd3NlciB3aW5kb3cgaXRzZWxmLiBUaGlzIGlzIHVzZWZ1bCBmb3Igc2Nyb2xsaW5nIHRvd2FyZCBhbiBlbGVtZW50IHRoYXQncyBpbnNpZGUgYW4gb3ZlcmZsb3dpbmcgcGFyZW50IGVsZW1lbnQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMuY29udGFpbmVyKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIEVuc3VyZSB0aGF0IGVpdGhlciBhIGpRdWVyeSBvYmplY3Qgb3IgYSByYXcgRE9NIGVsZW1lbnQgd2FzIHBhc3NlZCBpbi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFR5cGUuaXNXcmFwcGVkKG9wdHMuY29udGFpbmVyKSB8fCBUeXBlLmlzTm9kZShvcHRzLmNvbnRhaW5lcikpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEV4dHJhY3QgdGhlIHJhdyBET00gZWxlbWVudCBmcm9tIHRoZSBqUXVlcnkgd3JhcHBlci4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdHMuY29udGFpbmVyID0gb3B0cy5jb250YWluZXJbMF0gfHwgb3B0cy5jb250YWluZXI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBVbmxpa2Ugb3RoZXIgcHJvcGVydGllcyBpbiBWZWxvY2l0eSwgdGhlIGJyb3dzZXIncyBzY3JvbGwgcG9zaXRpb24gaXMgbmV2ZXIgY2FjaGVkIHNpbmNlIGl0IHNvIGZyZXF1ZW50bHkgY2hhbmdlc1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGR1ZSB0byB0aGUgdXNlcidzIG5hdHVyYWwgaW50ZXJhY3Rpb24gd2l0aCB0aGUgcGFnZSkuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxQb3NpdGlvbkN1cnJlbnQgPSBvcHRzLmNvbnRhaW5lcltcInNjcm9sbFwiICsgc2Nyb2xsRGlyZWN0aW9uXTsgLyogR0VUICovXG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qICQucG9zaXRpb24oKSB2YWx1ZXMgYXJlIHJlbGF0aXZlIHRvIHRoZSBjb250YWluZXIncyBjdXJyZW50bHkgdmlld2FibGUgYXJlYSAod2l0aG91dCB0YWtpbmcgaW50byBhY2NvdW50IHRoZSBjb250YWluZXIncyB0cnVlIGRpbWVuc2lvbnNcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0tIHNheSwgZm9yIGV4YW1wbGUsIGlmIHRoZSBjb250YWluZXIgd2FzIG5vdCBvdmVyZmxvd2luZykuIFRodXMsIHRoZSBzY3JvbGwgZW5kIHZhbHVlIGlzIHRoZSBzdW0gb2YgdGhlIGNoaWxkIGVsZW1lbnQncyBwb3NpdGlvbiAqYW5kKlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIHNjcm9sbCBjb250YWluZXIncyBjdXJyZW50IHNjcm9sbCBwb3NpdGlvbi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFBvc2l0aW9uRW5kID0gKHNjcm9sbFBvc2l0aW9uQ3VycmVudCArICQoZWxlbWVudCkucG9zaXRpb24oKVtzY3JvbGxEaXJlY3Rpb24udG9Mb3dlckNhc2UoKV0pICsgc2Nyb2xsT2Zmc2V0OyAvKiBHRVQgKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgYSB2YWx1ZSBvdGhlciB0aGFuIGEgalF1ZXJ5IG9iamVjdCBvciBhIHJhdyBET00gZWxlbWVudCB3YXMgcGFzc2VkIGluLCBkZWZhdWx0IHRvIG51bGwgc28gdGhhdCB0aGlzIG9wdGlvbiBpcyBpZ25vcmVkLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0cy5jb250YWluZXIgPSBudWxsO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhlIHdpbmRvdyBpdHNlbGYgaXMgYmVpbmcgc2Nyb2xsZWQgLS0gbm90IGEgY29udGFpbmluZyBlbGVtZW50IC0tIHBlcmZvcm0gYSBsaXZlIHNjcm9sbCBwb3NpdGlvbiBsb29rdXAgdXNpbmdcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIGFwcHJvcHJpYXRlIGNhY2hlZCBwcm9wZXJ0eSBuYW1lcyAod2hpY2ggZGlmZmVyIGJhc2VkIG9uIGJyb3dzZXIgdHlwZSkuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbFBvc2l0aW9uQ3VycmVudCA9IFZlbG9jaXR5LlN0YXRlLnNjcm9sbEFuY2hvcltWZWxvY2l0eS5TdGF0ZVtcInNjcm9sbFByb3BlcnR5XCIgKyBzY3JvbGxEaXJlY3Rpb25dXTsgLyogR0VUICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIFdoZW4gc2Nyb2xsaW5nIHRoZSBicm93c2VyIHdpbmRvdywgY2FjaGUgdGhlIGFsdGVybmF0ZSBheGlzJ3MgY3VycmVudCB2YWx1ZSBzaW5jZSB3aW5kb3cuc2Nyb2xsVG8oKSBkb2Vzbid0IGxldCB1cyBjaGFuZ2Ugb25seSBvbmUgdmFsdWUgYXQgYSB0aW1lLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxQb3NpdGlvbkN1cnJlbnRBbHRlcm5hdGUgPSBWZWxvY2l0eS5TdGF0ZS5zY3JvbGxBbmNob3JbVmVsb2NpdHkuU3RhdGVbXCJzY3JvbGxQcm9wZXJ0eVwiICsgKHNjcm9sbERpcmVjdGlvbiA9PT0gXCJMZWZ0XCIgPyBcIlRvcFwiIDogXCJMZWZ0XCIpXV07IC8qIEdFVCAqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIFVubGlrZSAkLnBvc2l0aW9uKCksICQub2Zmc2V0KCkgdmFsdWVzIGFyZSByZWxhdGl2ZSB0byB0aGUgYnJvd3NlciB3aW5kb3cncyB0cnVlIGRpbWVuc2lvbnMgLS0gbm90IG1lcmVseSBpdHMgY3VycmVudGx5IHZpZXdhYmxlIGFyZWEgLS1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kIHRoZXJlZm9yZSBlbmQgdmFsdWVzIGRvIG5vdCBuZWVkIHRvIGJlIGNvbXBvdW5kZWQgb250byBjdXJyZW50IHZhbHVlcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsUG9zaXRpb25FbmQgPSAkKGVsZW1lbnQpLm9mZnNldCgpW3Njcm9sbERpcmVjdGlvbi50b0xvd2VyQ2FzZSgpXSArIHNjcm9sbE9mZnNldDsgLyogR0VUICovXG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogU2luY2UgdGhlcmUncyBvbmx5IG9uZSBmb3JtYXQgdGhhdCBzY3JvbGwncyBhc3NvY2lhdGVkIHR3ZWVuc0NvbnRhaW5lciBjYW4gdGFrZSwgd2UgY3JlYXRlIGl0IG1hbnVhbGx5LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIHR3ZWVuc0NvbnRhaW5lciA9IHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsOiB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZTogZmFsc2UsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlOiBzY3JvbGxQb3NpdGlvbkN1cnJlbnQsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWU6IHNjcm9sbFBvc2l0aW9uQ3VycmVudCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlOiBzY3JvbGxQb3NpdGlvbkVuZCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRUeXBlOiBcIlwiLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWFzaW5nOiBvcHRzLmVhc2luZyxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbERhdGE6IHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXI6IG9wdHMuY29udGFpbmVyLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogc2Nyb2xsRGlyZWN0aW9uLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsdGVybmF0ZVZhbHVlOiBzY3JvbGxQb3NpdGlvbkN1cnJlbnRBbHRlcm5hdGVcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgfSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudDogZWxlbWVudFxuXHQgICAgICAgICAgICAgICAgICAgIH07XG5cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoVmVsb2NpdHkuZGVidWcpIGNvbnNvbGUubG9nKFwidHdlZW5zQ29udGFpbmVyIChzY3JvbGwpOiBcIiwgdHdlZW5zQ29udGFpbmVyLnNjcm9sbCwgZWxlbWVudCk7XG5cblx0ICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgIFR3ZWVuIERhdGEgQ29uc3RydWN0aW9uIChmb3IgUmV2ZXJzZSlcblx0ICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgLyogUmV2ZXJzZSBhY3RzIGxpa2UgYSBcInN0YXJ0XCIgYWN0aW9uIGluIHRoYXQgYSBwcm9wZXJ0eSBtYXAgaXMgYW5pbWF0ZWQgdG93YXJkLiBUaGUgb25seSBkaWZmZXJlbmNlIGlzXG5cdCAgICAgICAgICAgICAgICAgICB0aGF0IHRoZSBwcm9wZXJ0eSBtYXAgdXNlZCBmb3IgcmV2ZXJzZSBpcyB0aGUgaW52ZXJzZSBvZiB0aGUgbWFwIHVzZWQgaW4gdGhlIHByZXZpb3VzIGNhbGwuIFRodXMsIHdlIG1hbmlwdWxhdGVcblx0ICAgICAgICAgICAgICAgICAgIHRoZSBwcmV2aW91cyBjYWxsIHRvIGNvbnN0cnVjdCBvdXIgbmV3IG1hcDogdXNlIHRoZSBwcmV2aW91cyBtYXAncyBlbmQgdmFsdWVzIGFzIG91ciBuZXcgbWFwJ3Mgc3RhcnQgdmFsdWVzLiBDb3B5IG92ZXIgYWxsIG90aGVyIGRhdGEuICovXG5cdCAgICAgICAgICAgICAgICAvKiBOb3RlOiBSZXZlcnNlIGNhbiBiZSBkaXJlY3RseSBjYWxsZWQgdmlhIHRoZSBcInJldmVyc2VcIiBwYXJhbWV0ZXIsIG9yIGl0IGNhbiBiZSBpbmRpcmVjdGx5IHRyaWdnZXJlZCB2aWEgdGhlIGxvb3Agb3B0aW9uLiAoTG9vcHMgYXJlIGNvbXBvc2VkIG9mIG11bHRpcGxlIHJldmVyc2VzLikgKi9cblx0ICAgICAgICAgICAgICAgIC8qIE5vdGU6IFJldmVyc2UgY2FsbHMgZG8gbm90IG5lZWQgdG8gYmUgY29uc2VjdXRpdmVseSBjaGFpbmVkIG9udG8gYSBjdXJyZW50bHktYW5pbWF0aW5nIGVsZW1lbnQgaW4gb3JkZXIgdG8gb3BlcmF0ZSBvbiBjYWNoZWQgdmFsdWVzO1xuXHQgICAgICAgICAgICAgICAgICAgdGhlcmUgaXMgbm8gaGFybSB0byByZXZlcnNlIGJlaW5nIGNhbGxlZCBvbiBhIHBvdGVudGlhbGx5IHN0YWxlIGRhdGEgY2FjaGUgc2luY2UgcmV2ZXJzZSdzIGJlaGF2aW9yIGlzIHNpbXBseSBkZWZpbmVkXG5cdCAgICAgICAgICAgICAgICAgICBhcyByZXZlcnRpbmcgdG8gdGhlIGVsZW1lbnQncyB2YWx1ZXMgYXMgdGhleSB3ZXJlIHByaW9yIHRvIHRoZSBwcmV2aW91cyAqVmVsb2NpdHkqIGNhbGwuICovXG5cdCAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGFjdGlvbiA9PT0gXCJyZXZlcnNlXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAvKiBBYm9ydCBpZiB0aGVyZSBpcyBubyBwcmlvciBhbmltYXRpb24gZGF0YSB0byByZXZlcnNlIHRvLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmICghRGF0YShlbGVtZW50KS50d2VlbnNDb250YWluZXIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogRGVxdWV1ZSB0aGUgZWxlbWVudCBzbyB0aGF0IHRoaXMgcXVldWUgZW50cnkgcmVsZWFzZXMgaXRzZWxmIGltbWVkaWF0ZWx5LCBhbGxvd2luZyBzdWJzZXF1ZW50IHF1ZXVlIGVudHJpZXMgdG8gcnVuLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAkLmRlcXVldWUoZWxlbWVudCwgb3B0cy5xdWV1ZSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuXHQgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgT3B0aW9ucyBQYXJzaW5nXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgZWxlbWVudCB3YXMgaGlkZGVuIHZpYSB0aGUgZGlzcGxheSBvcHRpb24gaW4gdGhlIHByZXZpb3VzIGNhbGwsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldmVydCBkaXNwbGF5IHRvIFwiYXV0b1wiIHByaW9yIHRvIHJldmVyc2FsIHNvIHRoYXQgdGhlIGVsZW1lbnQgaXMgdmlzaWJsZSBhZ2Fpbi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkub3B0cy5kaXNwbGF5ID09PSBcIm5vbmVcIikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5vcHRzLmRpc3BsYXkgPSBcImF1dG9cIjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpLm9wdHMudmlzaWJpbGl0eSA9PT0gXCJoaWRkZW5cIikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5vcHRzLnZpc2liaWxpdHkgPSBcInZpc2libGVcIjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBsb29wIG9wdGlvbiB3YXMgc2V0IGluIHRoZSBwcmV2aW91cyBjYWxsLCBkaXNhYmxlIGl0IHNvIHRoYXQgXCJyZXZlcnNlXCIgY2FsbHMgYXJlbid0IHJlY3Vyc2l2ZWx5IGdlbmVyYXRlZC5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgRnVydGhlciwgcmVtb3ZlIHRoZSBwcmV2aW91cyBjYWxsJ3MgY2FsbGJhY2sgb3B0aW9uczsgdHlwaWNhbGx5LCB1c2VycyBkbyBub3Qgd2FudCB0aGVzZSB0byBiZSByZWZpcmVkLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLm9wdHMubG9vcCA9IGZhbHNlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLm9wdHMuYmVnaW4gPSBudWxsO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLm9wdHMuY29tcGxldGUgPSBudWxsO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIFNpbmNlIHdlJ3JlIGV4dGVuZGluZyBhbiBvcHRzIG9iamVjdCB0aGF0IGhhcyBhbHJlYWR5IGJlZW4gZXh0ZW5kZWQgd2l0aCB0aGUgZGVmYXVsdHMgb3B0aW9ucyBvYmplY3QsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIHdlIHJlbW92ZSBub24tZXhwbGljaXRseS1kZWZpbmVkIHByb3BlcnRpZXMgdGhhdCBhcmUgYXV0by1hc3NpZ25lZCB2YWx1ZXMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5lYXNpbmcpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBvcHRzLmVhc2luZztcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5kdXJhdGlvbikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG9wdHMuZHVyYXRpb247XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBUaGUgb3B0cyBvYmplY3QgdXNlZCBmb3IgcmV2ZXJzYWwgaXMgYW4gZXh0ZW5zaW9uIG9mIHRoZSBvcHRpb25zIG9iamVjdCBvcHRpb25hbGx5IHBhc3NlZCBpbnRvIHRoaXNcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV2ZXJzZSBjYWxsIHBsdXMgdGhlIG9wdGlvbnMgdXNlZCBpbiB0aGUgcHJldmlvdXMgVmVsb2NpdHkgY2FsbC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgb3B0cyA9ICQuZXh0ZW5kKHt9LCBEYXRhKGVsZW1lbnQpLm9wdHMsIG9wdHMpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIFR3ZWVucyBDb250YWluZXIgUmVjb25zdHJ1Y3Rpb25cblx0ICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBDcmVhdGUgYSBkZWVweSBjb3B5IChpbmRpY2F0ZWQgdmlhIHRoZSB0cnVlIGZsYWcpIG9mIHRoZSBwcmV2aW91cyBjYWxsJ3MgdHdlZW5zQ29udGFpbmVyLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdFR3ZWVuc0NvbnRhaW5lciA9ICQuZXh0ZW5kKHRydWUsIHt9LCBEYXRhKGVsZW1lbnQpLnR3ZWVuc0NvbnRhaW5lcik7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogTWFuaXB1bGF0ZSB0aGUgcHJldmlvdXMgdHdlZW5zQ29udGFpbmVyIGJ5IHJlcGxhY2luZyBpdHMgZW5kIHZhbHVlcyBhbmQgY3VycmVudFZhbHVlcyB3aXRoIGl0cyBzdGFydCB2YWx1ZXMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGxhc3RUd2VlbiBpbiBsYXN0VHdlZW5zQ29udGFpbmVyKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJbiBhZGRpdGlvbiB0byB0d2VlbiBkYXRhLCB0d2VlbnNDb250YWluZXJzIGNvbnRhaW4gYW4gZWxlbWVudCBwcm9wZXJ0eSB0aGF0IHdlIGlnbm9yZSBoZXJlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxhc3RUd2VlbiAhPT0gXCJlbGVtZW50XCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdFN0YXJ0VmFsdWUgPSBsYXN0VHdlZW5zQ29udGFpbmVyW2xhc3RUd2Vlbl0uc3RhcnRWYWx1ZTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RUd2VlbnNDb250YWluZXJbbGFzdFR3ZWVuXS5zdGFydFZhbHVlID0gbGFzdFR3ZWVuc0NvbnRhaW5lcltsYXN0VHdlZW5dLmN1cnJlbnRWYWx1ZSA9IGxhc3RUd2VlbnNDb250YWluZXJbbGFzdFR3ZWVuXS5lbmRWYWx1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0VHdlZW5zQ29udGFpbmVyW2xhc3RUd2Vlbl0uZW5kVmFsdWUgPSBsYXN0U3RhcnRWYWx1ZTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEVhc2luZyBpcyB0aGUgb25seSBvcHRpb24gdGhhdCBlbWJlZHMgaW50byB0aGUgaW5kaXZpZHVhbCB0d2VlbiBkYXRhIChzaW5jZSBpdCBjYW4gYmUgZGVmaW5lZCBvbiBhIHBlci1wcm9wZXJ0eSBiYXNpcykuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQWNjb3JkaW5nbHksIGV2ZXJ5IHByb3BlcnR5J3MgZWFzaW5nIHZhbHVlIG11c3QgYmUgdXBkYXRlZCB3aGVuIGFuIG9wdGlvbnMgb2JqZWN0IGlzIHBhc3NlZCBpbiB3aXRoIGEgcmV2ZXJzZSBjYWxsLlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRoZSBzaWRlIGVmZmVjdCBvZiB0aGlzIGV4dGVuc2liaWxpdHkgaXMgdGhhdCBhbGwgcGVyLXByb3BlcnR5IGVhc2luZyB2YWx1ZXMgYXJlIGZvcmNlZnVsbHkgcmVzZXQgdG8gdGhlIG5ldyB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIVR5cGUuaXNFbXB0eU9iamVjdChvcHRpb25zKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0VHdlZW5zQ29udGFpbmVyW2xhc3RUd2Vlbl0uZWFzaW5nID0gb3B0cy5lYXNpbmc7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFZlbG9jaXR5LmRlYnVnKSBjb25zb2xlLmxvZyhcInJldmVyc2UgdHdlZW5zQ29udGFpbmVyIChcIiArIGxhc3RUd2VlbiArIFwiKTogXCIgKyBKU09OLnN0cmluZ2lmeShsYXN0VHdlZW5zQ29udGFpbmVyW2xhc3RUd2Vlbl0pLCBlbGVtZW50KTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuc0NvbnRhaW5lciA9IGxhc3RUd2VlbnNDb250YWluZXI7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgIFR3ZWVuIERhdGEgQ29uc3RydWN0aW9uIChmb3IgU3RhcnQpXG5cdCAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24gPT09IFwic3RhcnRcIikge1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICAgICAgVmFsdWUgVHJhbnNmZXJyaW5nXG5cdCAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoaXMgcXVldWUgZW50cnkgZm9sbG93cyBhIHByZXZpb3VzIFZlbG9jaXR5LWluaXRpYXRlZCBxdWV1ZSBlbnRyeSAqYW5kKiBpZiB0aGlzIGVudHJ5IHdhcyBjcmVhdGVkXG5cdCAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgdGhlIGVsZW1lbnQgd2FzIGluIHRoZSBwcm9jZXNzIG9mIGJlaW5nIGFuaW1hdGVkIGJ5IFZlbG9jaXR5LCB0aGVuIHRoaXMgY3VycmVudCBjYWxsIGlzIHNhZmUgdG8gdXNlXG5cdCAgICAgICAgICAgICAgICAgICAgICAgdGhlIGVuZCB2YWx1ZXMgZnJvbSB0aGUgcHJpb3IgY2FsbCBhcyBpdHMgc3RhcnQgdmFsdWVzLiBWZWxvY2l0eSBhdHRlbXB0cyB0byBwZXJmb3JtIHRoaXMgdmFsdWUgdHJhbnNmZXJcblx0ICAgICAgICAgICAgICAgICAgICAgICBwcm9jZXNzIHdoZW5ldmVyIHBvc3NpYmxlIGluIG9yZGVyIHRvIGF2b2lkIHJlcXVlcnlpbmcgdGhlIERPTS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAvKiBJZiB2YWx1ZXMgYXJlbid0IHRyYW5zZmVycmVkIGZyb20gYSBwcmlvciBjYWxsIGFuZCBzdGFydCB2YWx1ZXMgd2VyZSBub3QgZm9yY2VmZWQgYnkgdGhlIHVzZXIgKG1vcmUgb24gdGhpcyBiZWxvdyksXG5cdCAgICAgICAgICAgICAgICAgICAgICAgdGhlbiB0aGUgRE9NIGlzIHF1ZXJpZWQgZm9yIHRoZSBlbGVtZW50J3MgY3VycmVudCB2YWx1ZXMgYXMgYSBsYXN0IHJlc29ydC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBDb252ZXJzZWx5LCBhbmltYXRpb24gcmV2ZXJzYWwgKGFuZCBsb29waW5nKSAqYWx3YXlzKiBwZXJmb3JtIGludGVyLWNhbGwgdmFsdWUgdHJhbnNmZXJzOyB0aGV5IG5ldmVyIHJlcXVlcnkgdGhlIERPTS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICB2YXIgbGFzdFR3ZWVuc0NvbnRhaW5lcjtcblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIFRoZSBwZXItZWxlbWVudCBpc0FuaW1hdGluZyBmbGFnIGlzIHVzZWQgdG8gaW5kaWNhdGUgd2hldGhlciBpdCdzIHNhZmUgKGkuZS4gdGhlIGRhdGEgaXNuJ3Qgc3RhbGUpXG5cdCAgICAgICAgICAgICAgICAgICAgICAgdG8gdHJhbnNmZXIgb3ZlciBlbmQgdmFsdWVzIHRvIHVzZSBhcyBzdGFydCB2YWx1ZXMuIElmIGl0J3Mgc2V0IHRvIHRydWUgYW5kIHRoZXJlIGlzIGEgcHJldmlvdXNcblx0ICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eSBjYWxsIHRvIHB1bGwgdmFsdWVzIGZyb20sIGRvIHNvLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpLnR3ZWVuc0NvbnRhaW5lciAmJiBEYXRhKGVsZW1lbnQpLmlzQW5pbWF0aW5nID09PSB0cnVlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RUd2VlbnNDb250YWluZXIgPSBEYXRhKGVsZW1lbnQpLnR3ZWVuc0NvbnRhaW5lcjtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgICAgVHdlZW4gRGF0YSBDYWxjdWxhdGlvblxuXHQgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIFRoaXMgZnVuY3Rpb24gcGFyc2VzIHByb3BlcnR5IGRhdGEgYW5kIGRlZmF1bHRzIGVuZFZhbHVlLCBlYXNpbmcsIGFuZCBzdGFydFZhbHVlIGFzIGFwcHJvcHJpYXRlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIC8qIFByb3BlcnR5IG1hcCB2YWx1ZXMgY2FuIGVpdGhlciB0YWtlIHRoZSBmb3JtIG9mIDEpIGEgc2luZ2xlIHZhbHVlIHJlcHJlc2VudGluZyB0aGUgZW5kIHZhbHVlLFxuXHQgICAgICAgICAgICAgICAgICAgICAgIG9yIDIpIGFuIGFycmF5IGluIHRoZSBmb3JtIG9mIFsgZW5kVmFsdWUsIFssIGVhc2luZ10gWywgc3RhcnRWYWx1ZV0gXS5cblx0ICAgICAgICAgICAgICAgICAgICAgICBUaGUgb3B0aW9uYWwgdGhpcmQgcGFyYW1ldGVyIGlzIGEgZm9yY2VmZWQgc3RhcnRWYWx1ZSB0byBiZSB1c2VkIGluc3RlYWQgb2YgcXVlcnlpbmcgdGhlIERPTSBmb3Jcblx0ICAgICAgICAgICAgICAgICAgICAgICB0aGUgZWxlbWVudCdzIGN1cnJlbnQgdmFsdWUuIFJlYWQgVmVsb2NpdHkncyBkb2NtZW50YXRpb24gdG8gbGVhcm4gbW9yZSBhYm91dCBmb3JjZWZlZWRpbmc6IFZlbG9jaXR5SlMub3JnLyNmb3JjZWZlZWRpbmcgKi9cblx0ICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiBwYXJzZVByb3BlcnR5VmFsdWUgKHZhbHVlRGF0YSwgc2tpcFJlc29sdmluZ0Vhc2luZykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZW5kVmFsdWUgPSB1bmRlZmluZWQsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBlYXNpbmcgPSB1bmRlZmluZWQsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gdW5kZWZpbmVkO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIEhhbmRsZSB0aGUgYXJyYXkgZm9ybWF0LCB3aGljaCBjYW4gYmUgc3RydWN0dXJlZCBhcyBvbmUgb2YgdGhyZWUgcG90ZW50aWFsIG92ZXJsb2Fkczpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgQSkgWyBlbmRWYWx1ZSwgZWFzaW5nLCBzdGFydFZhbHVlIF0sIEIpIFsgZW5kVmFsdWUsIGVhc2luZyBdLCBvciBDKSBbIGVuZFZhbHVlLCBzdGFydFZhbHVlIF0gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFR5cGUuaXNBcnJheSh2YWx1ZURhdGEpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBlbmRWYWx1ZSBpcyBhbHdheXMgdGhlIGZpcnN0IGl0ZW0gaW4gdGhlIGFycmF5LiBEb24ndCBib3RoZXIgdmFsaWRhdGluZyBlbmRWYWx1ZSdzIHZhbHVlIG5vd1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2luY2UgdGhlIGVuc3VpbmcgcHJvcGVydHkgY3ljbGluZyBsb2dpYyBkb2VzIHRoYXQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IHZhbHVlRGF0YVswXTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVHdvLWl0ZW0gYXJyYXkgZm9ybWF0OiBJZiB0aGUgc2Vjb25kIGl0ZW0gaXMgYSBudW1iZXIsIGZ1bmN0aW9uLCBvciBoZXggc3RyaW5nLCB0cmVhdCBpdCBhcyBhXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydCB2YWx1ZSBzaW5jZSBlYXNpbmdzIGNhbiBvbmx5IGJlIG5vbi1oZXggc3RyaW5ncyBvciBhcnJheXMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKCFUeXBlLmlzQXJyYXkodmFsdWVEYXRhWzFdKSAmJiAvXltcXGQtXS8udGVzdCh2YWx1ZURhdGFbMV0pKSB8fCBUeXBlLmlzRnVuY3Rpb24odmFsdWVEYXRhWzFdKSB8fCBDU1MuUmVnRXguaXNIZXgudGVzdCh2YWx1ZURhdGFbMV0pKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IHZhbHVlRGF0YVsxXTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFR3byBvciB0aHJlZS1pdGVtIGFycmF5OiBJZiB0aGUgc2Vjb25kIGl0ZW0gaXMgYSBub24taGV4IHN0cmluZyBvciBhbiBhcnJheSwgdHJlYXQgaXQgYXMgYW4gZWFzaW5nLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgoVHlwZS5pc1N0cmluZyh2YWx1ZURhdGFbMV0pICYmICFDU1MuUmVnRXguaXNIZXgudGVzdCh2YWx1ZURhdGFbMV0pKSB8fCBUeXBlLmlzQXJyYXkodmFsdWVEYXRhWzFdKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVhc2luZyA9IHNraXBSZXNvbHZpbmdFYXNpbmcgPyB2YWx1ZURhdGFbMV0gOiBnZXRFYXNpbmcodmFsdWVEYXRhWzFdLCBvcHRzLmR1cmF0aW9uKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIERvbid0IGJvdGhlciB2YWxpZGF0aW5nIHN0YXJ0VmFsdWUncyB2YWx1ZSBub3cgc2luY2UgdGhlIGVuc3VpbmcgcHJvcGVydHkgY3ljbGluZyBsb2dpYyBpbmhlcmVudGx5IGRvZXMgdGhhdC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWVEYXRhWzJdICE9PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IHZhbHVlRGF0YVsyXTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIEhhbmRsZSB0aGUgc2luZ2xlLXZhbHVlIGZvcm1hdC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gdmFsdWVEYXRhO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogRGVmYXVsdCB0byB0aGUgY2FsbCdzIGVhc2luZyBpZiBhIHBlci1wcm9wZXJ0eSBlYXNpbmcgdHlwZSB3YXMgbm90IGRlZmluZWQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc2tpcFJlc29sdmluZ0Vhc2luZykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWFzaW5nID0gZWFzaW5nIHx8IG9wdHMuZWFzaW5nO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgZnVuY3Rpb25zIHdlcmUgcGFzc2VkIGluIGFzIHZhbHVlcywgcGFzcyB0aGUgZnVuY3Rpb24gdGhlIGN1cnJlbnQgZWxlbWVudCBhcyBpdHMgY29udGV4dCxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgcGx1cyB0aGUgZWxlbWVudCdzIGluZGV4IGFuZCB0aGUgZWxlbWVudCBzZXQncyBzaXplIGFzIGFyZ3VtZW50cy4gVGhlbiwgYXNzaWduIHRoZSByZXR1cm5lZCB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFR5cGUuaXNGdW5jdGlvbihlbmRWYWx1ZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gZW5kVmFsdWUuY2FsbChlbGVtZW50LCBlbGVtZW50c0luZGV4LCBlbGVtZW50c0xlbmd0aCk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoVHlwZS5pc0Z1bmN0aW9uKHN0YXJ0VmFsdWUpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gc3RhcnRWYWx1ZS5jYWxsKGVsZW1lbnQsIGVsZW1lbnRzSW5kZXgsIGVsZW1lbnRzTGVuZ3RoKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIEFsbG93IHN0YXJ0VmFsdWUgdG8gYmUgbGVmdCBhcyB1bmRlZmluZWQgdG8gaW5kaWNhdGUgdG8gdGhlIGVuc3VpbmcgY29kZSB0aGF0IGl0cyB2YWx1ZSB3YXMgbm90IGZvcmNlZmVkLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWyBlbmRWYWx1ZSB8fCAwLCBlYXNpbmcsIHN0YXJ0VmFsdWUgXTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBDeWNsZSB0aHJvdWdoIGVhY2ggcHJvcGVydHkgaW4gdGhlIG1hcCwgbG9va2luZyBmb3Igc2hvcnRoYW5kIGNvbG9yIHByb3BlcnRpZXMgKGUuZy4gXCJjb2xvclwiIGFzIG9wcG9zZWQgdG8gXCJjb2xvclJlZFwiKS4gSW5qZWN0IHRoZSBjb3JyZXNwb25kaW5nXG5cdCAgICAgICAgICAgICAgICAgICAgICAgY29sb3JSZWQsIGNvbG9yR3JlZW4sIGFuZCBjb2xvckJsdWUgUkdCIGNvbXBvbmVudCB0d2VlbnMgaW50byB0aGUgcHJvcGVydGllc01hcCAod2hpY2ggVmVsb2NpdHkgdW5kZXJzdGFuZHMpIGFuZCByZW1vdmUgdGhlIHNob3J0aGFuZCBwcm9wZXJ0eS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAkLmVhY2gocHJvcGVydGllc01hcCwgZnVuY3Rpb24ocHJvcGVydHksIHZhbHVlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIEZpbmQgc2hvcnRoYW5kIGNvbG9yIHByb3BlcnRpZXMgdGhhdCBoYXZlIGJlZW4gcGFzc2VkIGEgaGV4IHN0cmluZy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFJlZ0V4cChcIl5cIiArIENTUy5MaXN0cy5jb2xvcnMuam9pbihcIiR8XlwiKSArIFwiJFwiKS50ZXN0KHByb3BlcnR5KSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogUGFyc2UgdGhlIHZhbHVlIGRhdGEgZm9yIGVhY2ggc2hvcnRoYW5kLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlRGF0YSA9IHBhcnNlUHJvcGVydHlWYWx1ZSh2YWx1ZSwgdHJ1ZSksXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWUgPSB2YWx1ZURhdGFbMF0sXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWFzaW5nID0gdmFsdWVEYXRhWzFdLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgPSB2YWx1ZURhdGFbMl07XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDU1MuUmVnRXguaXNIZXgudGVzdChlbmRWYWx1ZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDb252ZXJ0IHRoZSBoZXggc3RyaW5ncyBpbnRvIHRoZWlyIFJHQiBjb21wb25lbnQgYXJyYXlzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb2xvckNvbXBvbmVudHMgPSBbIFwiUmVkXCIsIFwiR3JlZW5cIiwgXCJCbHVlXCIgXSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWVSR0IgPSBDU1MuVmFsdWVzLmhleFRvUmdiKGVuZFZhbHVlKSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZVJHQiA9IHN0YXJ0VmFsdWUgPyBDU1MuVmFsdWVzLmhleFRvUmdiKHN0YXJ0VmFsdWUpIDogdW5kZWZpbmVkO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSW5qZWN0IHRoZSBSR0IgY29tcG9uZW50IHR3ZWVucyBpbnRvIHByb3BlcnRpZXNNYXAuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb2xvckNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGFBcnJheSA9IFsgZW5kVmFsdWVSR0JbaV0gXTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWFzaW5nKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhQXJyYXkucHVzaChlYXNpbmcpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXJ0VmFsdWVSR0IgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YUFycmF5LnB1c2goc3RhcnRWYWx1ZVJHQltpXSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzTWFwW3Byb3BlcnR5ICsgY29sb3JDb21wb25lbnRzW2ldXSA9IGRhdGFBcnJheTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBSZW1vdmUgdGhlIGludGVybWVkaWFyeSBzaG9ydGhhbmQgcHJvcGVydHkgZW50cnkgbm93IHRoYXQgd2UndmUgcHJvY2Vzc2VkIGl0LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBwcm9wZXJ0aWVzTWFwW3Byb3BlcnR5XTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIH0pO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogQ3JlYXRlIGEgdHdlZW4gb3V0IG9mIGVhY2ggcHJvcGVydHksIGFuZCBhcHBlbmQgaXRzIGFzc29jaWF0ZWQgZGF0YSB0byB0d2VlbnNDb250YWluZXIuICovXG5cdCAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcGVydHkgaW4gcHJvcGVydGllc01hcCkge1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBTdGFydCBWYWx1ZSBTb3VyY2luZ1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBQYXJzZSBvdXQgZW5kVmFsdWUsIGVhc2luZywgYW5kIHN0YXJ0VmFsdWUgZnJvbSB0aGUgcHJvcGVydHkncyBkYXRhLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmFsdWVEYXRhID0gcGFyc2VQcm9wZXJ0eVZhbHVlKHByb3BlcnRpZXNNYXBbcHJvcGVydHldKSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gdmFsdWVEYXRhWzBdLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWFzaW5nID0gdmFsdWVEYXRhWzFdLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IHZhbHVlRGF0YVsyXTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3cgdGhhdCB0aGUgb3JpZ2luYWwgcHJvcGVydHkgbmFtZSdzIGZvcm1hdCBoYXMgYmVlbiB1c2VkIGZvciB0aGUgcGFyc2VQcm9wZXJ0eVZhbHVlKCkgbG9va3VwIGFib3ZlLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICB3ZSBmb3JjZSB0aGUgcHJvcGVydHkgdG8gaXRzIGNhbWVsQ2FzZSBzdHlsaW5nIHRvIG5vcm1hbGl6ZSBpdCBmb3IgbWFuaXB1bGF0aW9uLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eSA9IENTUy5OYW1lcy5jYW1lbENhc2UocHJvcGVydHkpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIEluIGNhc2UgdGhpcyBwcm9wZXJ0eSBpcyBhIGhvb2ssIHRoZXJlIGFyZSBjaXJjdW1zdGFuY2VzIHdoZXJlIHdlIHdpbGwgaW50ZW5kIHRvIHdvcmsgb24gdGhlIGhvb2sncyByb290IHByb3BlcnR5IGFuZCBub3QgdGhlIGhvb2tlZCBzdWJwcm9wZXJ0eS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJvb3RQcm9wZXJ0eSA9IENTUy5Ib29rcy5nZXRSb290KHByb3BlcnR5KSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlID0gZmFsc2U7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogT3RoZXIgdGhhbiBmb3IgdGhlIGR1bW15IHR3ZWVuIHByb3BlcnR5LCBwcm9wZXJ0aWVzIHRoYXQgYXJlIG5vdCBzdXBwb3J0ZWQgYnkgdGhlIGJyb3dzZXIgKGFuZCBkbyBub3QgaGF2ZSBhbiBhc3NvY2lhdGVkIG5vcm1hbGl6YXRpb24pIHdpbGxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5oZXJlbnRseSBwcm9kdWNlIG5vIHN0eWxlIGNoYW5nZXMgd2hlbiBzZXQsIHNvIHRoZXkgYXJlIHNraXBwZWQgaW4gb3JkZXIgdG8gZGVjcmVhc2UgYW5pbWF0aW9uIHRpY2sgb3ZlcmhlYWQuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIFByb3BlcnR5IHN1cHBvcnQgaXMgZGV0ZXJtaW5lZCB2aWEgcHJlZml4Q2hlY2soKSwgd2hpY2ggcmV0dXJucyBhIGZhbHNlIGZsYWcgd2hlbiBubyBzdXBwb3J0ZWQgaXMgZGV0ZWN0ZWQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIE5vdGU6IFNpbmNlIFNWRyBlbGVtZW50cyBoYXZlIHNvbWUgb2YgdGhlaXIgcHJvcGVydGllcyBkaXJlY3RseSBhcHBsaWVkIGFzIEhUTUwgYXR0cmlidXRlcyxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlcmUgaXMgbm8gd2F5IHRvIGNoZWNrIGZvciB0aGVpciBleHBsaWNpdCBicm93c2VyIHN1cHBvcnQsIGFuZCBzbyB3ZSBza2lwIHNraXAgdGhpcyBjaGVjayBmb3IgdGhlbS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFEYXRhKGVsZW1lbnQpLmlzU1ZHICYmIHJvb3RQcm9wZXJ0eSAhPT0gXCJ0d2VlblwiICYmIENTUy5OYW1lcy5wcmVmaXhDaGVjayhyb290UHJvcGVydHkpWzFdID09PSBmYWxzZSAmJiBDU1MuTm9ybWFsaXphdGlvbnMucmVnaXN0ZXJlZFtyb290UHJvcGVydHldID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChWZWxvY2l0eS5kZWJ1ZykgY29uc29sZS5sb2coXCJTa2lwcGluZyBbXCIgKyByb290UHJvcGVydHkgKyBcIl0gZHVlIHRvIGEgbGFjayBvZiBicm93c2VyIHN1cHBvcnQuXCIpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBkaXNwbGF5IG9wdGlvbiBpcyBiZWluZyBzZXQgdG8gYSBub24tXCJub25lXCIgKGUuZy4gXCJibG9ja1wiKSBhbmQgb3BhY2l0eSAoZmlsdGVyIG9uIElFPD04KSBpcyBiZWluZ1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRlZCB0byBhbiBlbmRWYWx1ZSBvZiBub24temVybywgdGhlIHVzZXIncyBpbnRlbnRpb24gaXMgdG8gZmFkZSBpbiBmcm9tIGludmlzaWJsZSwgdGh1cyB3ZSBmb3JjZWZlZWQgb3BhY2l0eVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBhIHN0YXJ0VmFsdWUgb2YgMCBpZiBpdHMgc3RhcnRWYWx1ZSBoYXNuJ3QgYWxyZWFkeSBiZWVuIHNvdXJjZWQgYnkgdmFsdWUgdHJhbnNmZXJyaW5nIG9yIHByaW9yIGZvcmNlZmVlZGluZy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCgob3B0cy5kaXNwbGF5ICE9PSB1bmRlZmluZWQgJiYgb3B0cy5kaXNwbGF5ICE9PSBudWxsICYmIG9wdHMuZGlzcGxheSAhPT0gXCJub25lXCIpIHx8IChvcHRzLnZpc2liaWxpdHkgIT09IHVuZGVmaW5lZCAmJiBvcHRzLnZpc2liaWxpdHkgIT09IFwiaGlkZGVuXCIpKSAmJiAvb3BhY2l0eXxmaWx0ZXIvLnRlc3QocHJvcGVydHkpICYmICFzdGFydFZhbHVlICYmIGVuZFZhbHVlICE9PSAwKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gMDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHZhbHVlcyBoYXZlIGJlZW4gdHJhbnNmZXJyZWQgZnJvbSB0aGUgcHJldmlvdXMgVmVsb2NpdHkgY2FsbCwgZXh0cmFjdCB0aGUgZW5kVmFsdWUgYW5kIHJvb3RQcm9wZXJ0eVZhbHVlXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciBhbGwgb2YgdGhlIGN1cnJlbnQgY2FsbCdzIHByb3BlcnRpZXMgdGhhdCB3ZXJlICphbHNvKiBhbmltYXRlZCBpbiB0aGUgcHJldmlvdXMgY2FsbC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogVmFsdWUgdHJhbnNmZXJyaW5nIGNhbiBvcHRpb25hbGx5IGJlIGRpc2FibGVkIGJ5IHRoZSB1c2VyIHZpYSB0aGUgX2NhY2hlVmFsdWVzIG9wdGlvbi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdHMuX2NhY2hlVmFsdWVzICYmIGxhc3RUd2VlbnNDb250YWluZXIgJiYgbGFzdFR3ZWVuc0NvbnRhaW5lcltwcm9wZXJ0eV0pIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGFydFZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlID0gbGFzdFR3ZWVuc0NvbnRhaW5lcltwcm9wZXJ0eV0uZW5kVmFsdWUgKyBsYXN0VHdlZW5zQ29udGFpbmVyW3Byb3BlcnR5XS51bml0VHlwZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVGhlIHByZXZpb3VzIGNhbGwncyByb290UHJvcGVydHlWYWx1ZSBpcyBleHRyYWN0ZWQgZnJvbSB0aGUgZWxlbWVudCdzIGRhdGEgY2FjaGUgc2luY2UgdGhhdCdzIHRoZVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2Ugb2Ygcm9vdFByb3BlcnR5VmFsdWUgdGhhdCBnZXRzIGZyZXNobHkgdXBkYXRlZCBieSB0aGUgdHdlZW5pbmcgcHJvY2Vzcywgd2hlcmVhcyB0aGUgcm9vdFByb3BlcnR5VmFsdWVcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dGFjaGVkIHRvIHRoZSBpbmNvbWluZyBsYXN0VHdlZW5zQ29udGFpbmVyIGlzIGVxdWFsIHRvIHRoZSByb290IHByb3BlcnR5J3MgdmFsdWUgcHJpb3IgdG8gYW55IHR3ZWVuaW5nLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWUgPSBEYXRhKGVsZW1lbnQpLnJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGVbcm9vdFByb3BlcnR5XTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdmFsdWVzIHdlcmUgbm90IHRyYW5zZmVycmVkIGZyb20gYSBwcmV2aW91cyBWZWxvY2l0eSBjYWxsLCBxdWVyeSB0aGUgRE9NIGFzIG5lZWRlZC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEhhbmRsZSBob29rZWQgcHJvcGVydGllcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDU1MuSG9va3MucmVnaXN0ZXJlZFtwcm9wZXJ0eV0pIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGFydFZhbHVlID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWUgPSBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCByb290UHJvcGVydHkpOyAvKiBHRVQgKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogVGhlIGZvbGxvd2luZyBnZXRQcm9wZXJ0eVZhbHVlKCkgY2FsbCBkb2VzIG5vdCBhY3R1YWxseSB0cmlnZ2VyIGEgRE9NIHF1ZXJ5O1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRQcm9wZXJ0eVZhbHVlKCkgd2lsbCBleHRyYWN0IHRoZSBob29rIGZyb20gcm9vdFByb3BlcnR5VmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgPSBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBwcm9wZXJ0eSwgcm9vdFByb3BlcnR5VmFsdWUpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHN0YXJ0VmFsdWUgaXMgYWxyZWFkeSBkZWZpbmVkIHZpYSBmb3JjZWZlZWRpbmcsIGRvIG5vdCBxdWVyeSB0aGUgRE9NIGZvciB0aGUgcm9vdCBwcm9wZXJ0eSdzIHZhbHVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGp1c3QgZ3JhYiByb290UHJvcGVydHkncyB6ZXJvLXZhbHVlIHRlbXBsYXRlIGZyb20gQ1NTLkhvb2tzLiBUaGlzIG92ZXJ3cml0ZXMgdGhlIGVsZW1lbnQncyBhY3R1YWxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290IHByb3BlcnR5IHZhbHVlIChpZiBvbmUgaXMgc2V0KSwgYnV0IHRoaXMgaXMgYWNjZXB0YWJsZSBzaW5jZSB0aGUgcHJpbWFyeSByZWFzb24gdXNlcnMgZm9yY2VmZWVkIGlzXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG8gYXZvaWQgRE9NIHF1ZXJpZXMsIGFuZCB0aHVzIHdlIGxpa2V3aXNlIGF2b2lkIHF1ZXJ5aW5nIHRoZSBET00gZm9yIHRoZSByb290IHByb3BlcnR5J3MgdmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogR3JhYiB0aGlzIGhvb2sncyB6ZXJvLXZhbHVlIHRlbXBsYXRlLCBlLmcuIFwiMHB4IDBweCAwcHggYmxhY2tcIi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWUgPSBDU1MuSG9va3MudGVtcGxhdGVzW3Jvb3RQcm9wZXJ0eV1bMV07XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSGFuZGxlIG5vbi1ob29rZWQgcHJvcGVydGllcyB0aGF0IGhhdmVuJ3QgYWxyZWFkeSBiZWVuIGRlZmluZWQgdmlhIGZvcmNlZmVlZGluZy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RhcnRWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIHByb3BlcnR5KTsgLyogR0VUICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgVmFsdWUgRGF0YSBFeHRyYWN0aW9uXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzZXBhcmF0ZWRWYWx1ZSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlVW5pdFR5cGUsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlVW5pdFR5cGUsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcGVyYXRvciA9IGZhbHNlO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIFNlcGFyYXRlcyBhIHByb3BlcnR5IHZhbHVlIGludG8gaXRzIG51bWVyaWMgdmFsdWUgYW5kIGl0cyB1bml0IHR5cGUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIHNlcGFyYXRlVmFsdWUgKHByb3BlcnR5LCB2YWx1ZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHVuaXRUeXBlLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bWVyaWNWYWx1ZTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtZXJpY1ZhbHVlID0gKHZhbHVlIHx8IFwiMFwiKVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50b1N0cmluZygpXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRvTG93ZXJDYXNlKClcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBNYXRjaCB0aGUgdW5pdCB0eXBlIGF0IHRoZSBlbmQgb2YgdGhlIHZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9bJUEtel0rJC8sIGZ1bmN0aW9uKG1hdGNoKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEdyYWIgdGhlIHVuaXQgdHlwZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFR5cGUgPSBtYXRjaDtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTdHJpcCB0aGUgdW5pdCB0eXBlIG9mZiBvZiB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIG5vIHVuaXQgdHlwZSB3YXMgc3VwcGxpZWQsIGFzc2lnbiBvbmUgdGhhdCBpcyBhcHByb3ByaWF0ZSBmb3IgdGhpcyBwcm9wZXJ0eSAoZS5nLiBcImRlZ1wiIGZvciByb3RhdGVaIG9yIFwicHhcIiBmb3Igd2lkdGgpLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF1bml0VHlwZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRUeXBlID0gQ1NTLlZhbHVlcy5nZXRVbml0VHlwZShwcm9wZXJ0eSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbIG51bWVyaWNWYWx1ZSwgdW5pdFR5cGUgXTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIFNlcGFyYXRlIHN0YXJ0VmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHNlcGFyYXRlZFZhbHVlID0gc2VwYXJhdGVWYWx1ZShwcm9wZXJ0eSwgc3RhcnRWYWx1ZSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0VmFsdWUgPSBzZXBhcmF0ZWRWYWx1ZVswXTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZVVuaXRUeXBlID0gc2VwYXJhdGVkVmFsdWVbMV07XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogU2VwYXJhdGUgZW5kVmFsdWUsIGFuZCBleHRyYWN0IGEgdmFsdWUgb3BlcmF0b3IgKGUuZy4gXCIrPVwiLCBcIi09XCIpIGlmIG9uZSBleGlzdHMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHNlcGFyYXRlZFZhbHVlID0gc2VwYXJhdGVWYWx1ZShwcm9wZXJ0eSwgZW5kVmFsdWUpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IHNlcGFyYXRlZFZhbHVlWzBdLnJlcGxhY2UoL14oWystXFwvKl0pPS8sIGZ1bmN0aW9uKG1hdGNoLCBzdWJNYXRjaCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3BlcmF0b3IgPSBzdWJNYXRjaDtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU3RyaXAgdGhlIG9wZXJhdG9yIG9mZiBvZiB0aGUgdmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlVW5pdFR5cGUgPSBzZXBhcmF0ZWRWYWx1ZVsxXTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBQYXJzZSBmbG9hdCB2YWx1ZXMgZnJvbSBlbmRWYWx1ZSBhbmQgc3RhcnRWYWx1ZS4gRGVmYXVsdCB0byAwIGlmIE5hTiBpcyByZXR1cm5lZC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSA9IHBhcnNlRmxvYXQoc3RhcnRWYWx1ZSkgfHwgMDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWUgPSBwYXJzZUZsb2F0KGVuZFZhbHVlKSB8fCAwO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgUHJvcGVydHktU3BlY2lmaWMgVmFsdWUgQ29udmVyc2lvblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogQ3VzdG9tIHN1cHBvcnQgZm9yIHByb3BlcnRpZXMgdGhhdCBkb24ndCBhY3R1YWxseSBhY2NlcHQgdGhlICUgdW5pdCB0eXBlLCBidXQgd2hlcmUgcG9sbHlmaWxsaW5nIGlzIHRyaXZpYWwgYW5kIHJlbGF0aXZlbHkgZm9vbHByb29mLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW5kVmFsdWVVbml0VHlwZSA9PT0gXCIlXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEEgJS12YWx1ZSBmb250U2l6ZS9saW5lSGVpZ2h0IGlzIHJlbGF0aXZlIHRvIHRoZSBwYXJlbnQncyBmb250U2l6ZSAoYXMgb3Bwb3NlZCB0byB0aGUgcGFyZW50J3MgZGltZW5zaW9ucyksXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGljaCBpcyBpZGVudGljYWwgdG8gdGhlIGVtIHVuaXQncyBiZWhhdmlvciwgc28gd2UgcGlnZ3liYWNrIG9mZiBvZiB0aGF0LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC9eKGZvbnRTaXplfGxpbmVIZWlnaHQpJC8udGVzdChwcm9wZXJ0eSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBDb252ZXJ0ICUgaW50byBhbiBlbSBkZWNpbWFsIHZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gZW5kVmFsdWUgLyAxMDA7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWVVbml0VHlwZSA9IFwiZW1cIjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEZvciBzY2FsZVggYW5kIHNjYWxlWSwgY29udmVydCB0aGUgdmFsdWUgaW50byBpdHMgZGVjaW1hbCBmb3JtYXQgYW5kIHN0cmlwIG9mZiB0aGUgdW5pdCB0eXBlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvXnNjYWxlLy50ZXN0KHByb3BlcnR5KSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gZW5kVmFsdWUgLyAxMDA7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWVVbml0VHlwZSA9IFwiXCI7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBGb3IgUkdCIGNvbXBvbmVudHMsIHRha2UgdGhlIGRlZmluZWQgcGVyY2VudGFnZSBvZiAyNTUgYW5kIHN0cmlwIG9mZiB0aGUgdW5pdCB0eXBlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvKFJlZHxHcmVlbnxCbHVlKSQvaS50ZXN0KHByb3BlcnR5KSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlID0gKGVuZFZhbHVlIC8gMTAwKSAqIDI1NTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZVVuaXRUeXBlID0gXCJcIjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgVW5pdCBSYXRpbyBDYWxjdWxhdGlvblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogV2hlbiBxdWVyaWVkLCB0aGUgYnJvd3NlciByZXR1cm5zIChtb3N0KSBDU1MgcHJvcGVydHkgdmFsdWVzIGluIHBpeGVscy4gVGhlcmVmb3JlLCBpZiBhbiBlbmRWYWx1ZSB3aXRoIGEgdW5pdCB0eXBlIG9mXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICUsIGVtLCBvciByZW0gaXMgYW5pbWF0ZWQgdG93YXJkLCBzdGFydFZhbHVlIG11c3QgYmUgY29udmVydGVkIGZyb20gcGl4ZWxzIGludG8gdGhlIHNhbWUgdW5pdCB0eXBlIGFzIGVuZFZhbHVlIGluIG9yZGVyXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciB2YWx1ZSBtYW5pcHVsYXRpb24gbG9naWMgKGluY3JlbWVudC9kZWNyZW1lbnQpIHRvIHByb2NlZWQuIEZ1cnRoZXIsIGlmIHRoZSBzdGFydFZhbHVlIHdhcyBmb3JjZWZlZCBvciB0cmFuc2ZlcnJlZFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBmcm9tIGEgcHJldmlvdXMgY2FsbCwgc3RhcnRWYWx1ZSBtYXkgYWxzbyBub3QgYmUgaW4gcGl4ZWxzLiBVbml0IGNvbnZlcnNpb24gbG9naWMgdGhlcmVmb3JlIGNvbnNpc3RzIG9mIHR3byBzdGVwczpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgMSkgQ2FsY3VsYXRpbmcgdGhlIHJhdGlvIG9mICUvZW0vcmVtL3ZoL3Z3IHJlbGF0aXZlIHRvIHBpeGVsc1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAyKSBDb252ZXJ0aW5nIHN0YXJ0VmFsdWUgaW50byB0aGUgc2FtZSB1bml0IG9mIG1lYXN1cmVtZW50IGFzIGVuZFZhbHVlIGJhc2VkIG9uIHRoZXNlIHJhdGlvcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogVW5pdCBjb252ZXJzaW9uIHJhdGlvcyBhcmUgY2FsY3VsYXRlZCBieSBpbnNlcnRpbmcgYSBzaWJsaW5nIG5vZGUgbmV4dCB0byB0aGUgdGFyZ2V0IG5vZGUsIGNvcHlpbmcgb3ZlciBpdHMgcG9zaXRpb24gcHJvcGVydHksXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldHRpbmcgdmFsdWVzIHdpdGggdGhlIHRhcmdldCB1bml0IHR5cGUgdGhlbiBjb21wYXJpbmcgdGhlIHJldHVybmVkIHBpeGVsIHZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBFdmVuIGlmIG9ubHkgb25lIG9mIHRoZXNlIHVuaXQgdHlwZXMgaXMgYmVpbmcgYW5pbWF0ZWQsIGFsbCB1bml0IHJhdGlvcyBhcmUgY2FsY3VsYXRlZCBhdCBvbmNlIHNpbmNlIHRoZSBvdmVyaGVhZFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBvZiBiYXRjaGluZyB0aGUgU0VUcyBhbmQgR0VUcyB0b2dldGhlciB1cGZyb250IG91dHdlaWdodHMgdGhlIHBvdGVudGlhbCBvdmVyaGVhZFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBvZiBsYXlvdXQgdGhyYXNoaW5nIGNhdXNlZCBieSByZS1xdWVyeWluZyBmb3IgdW5jYWxjdWxhdGVkIHJhdGlvcyBmb3Igc3Vic2VxdWVudGx5LXByb2Nlc3NlZCBwcm9wZXJ0aWVzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBUb2RvOiBTaGlmdCB0aGlzIGxvZ2ljIGludG8gdGhlIGNhbGxzJyBmaXJzdCB0aWNrIGluc3RhbmNlIHNvIHRoYXQgaXQncyBzeW5jZWQgd2l0aCBSQUYuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGNhbGN1bGF0ZVVuaXRSYXRpb3MgKCkge1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgU2FtZSBSYXRpbyBDaGVja3Ncblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogVGhlIHByb3BlcnRpZXMgYmVsb3cgYXJlIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhlIGVsZW1lbnQgZGlmZmVycyBzdWZmaWNpZW50bHkgZnJvbSB0aGlzIGNhbGwnc1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlvdXNseSBpdGVyYXRlZCBlbGVtZW50IHRvIGFsc28gZGlmZmVyIGluIGl0cyB1bml0IGNvbnZlcnNpb24gcmF0aW9zLiBJZiB0aGUgcHJvcGVydGllcyBtYXRjaCB1cCB3aXRoIHRob3NlXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZiB0aGUgcHJpb3IgZWxlbWVudCwgdGhlIHByaW9yIGVsZW1lbnQncyBjb252ZXJzaW9uIHJhdGlvcyBhcmUgdXNlZC4gTGlrZSBtb3N0IG9wdGltaXphdGlvbnMgaW4gVmVsb2NpdHksXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzIGlzIGRvbmUgdG8gbWluaW1pemUgRE9NIHF1ZXJ5aW5nLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNhbWVSYXRpb0luZGljYXRvcnMgPSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG15UGFyZW50OiBlbGVtZW50LnBhcmVudE5vZGUgfHwgZG9jdW1lbnQuYm9keSwgLyogR0VUICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBDU1MuZ2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcInBvc2l0aW9uXCIpLCAvKiBHRVQgKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udFNpemU6IENTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiZm9udFNpemVcIikgLyogR0VUICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBEZXRlcm1pbmUgaWYgdGhlIHNhbWUgJSByYXRpbyBjYW4gYmUgdXNlZC4gJSBpcyBiYXNlZCBvbiB0aGUgZWxlbWVudCdzIHBvc2l0aW9uIHZhbHVlIGFuZCBpdHMgcGFyZW50J3Mgd2lkdGggYW5kIGhlaWdodCBkaW1lbnNpb25zLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNhbWVQZXJjZW50UmF0aW8gPSAoKHNhbWVSYXRpb0luZGljYXRvcnMucG9zaXRpb24gPT09IGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdFBvc2l0aW9uKSAmJiAoc2FtZVJhdGlvSW5kaWNhdG9ycy5teVBhcmVudCA9PT0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0UGFyZW50KSksXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRGV0ZXJtaW5lIGlmIHRoZSBzYW1lIGVtIHJhdGlvIGNhbiBiZSB1c2VkLiBlbSBpcyByZWxhdGl2ZSB0byB0aGUgZWxlbWVudCdzIGZvbnRTaXplLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNhbWVFbVJhdGlvID0gKHNhbWVSYXRpb0luZGljYXRvcnMuZm9udFNpemUgPT09IGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdEZvbnRTaXplKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogU3RvcmUgdGhlc2UgcmF0aW8gaW5kaWNhdG9ycyBjYWxsLXdpZGUgZm9yIHRoZSBuZXh0IGVsZW1lbnQgdG8gY29tcGFyZSBhZ2FpbnN0LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0UGFyZW50ID0gc2FtZVJhdGlvSW5kaWNhdG9ycy5teVBhcmVudDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdFBvc2l0aW9uID0gc2FtZVJhdGlvSW5kaWNhdG9ycy5wb3NpdGlvbjtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdEZvbnRTaXplID0gc2FtZVJhdGlvSW5kaWNhdG9ycy5mb250U2l6ZTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRWxlbWVudC1TcGVjaWZpYyBVbml0c1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBJRTggcm91bmRzIHRvIHRoZSBuZWFyZXN0IHBpeGVsIHdoZW4gcmV0dXJuaW5nIENTUyB2YWx1ZXMsIHRodXMgd2UgcGVyZm9ybSBjb252ZXJzaW9ucyB1c2luZyBhIG1lYXN1cmVtZW50XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvZiAxMDAgKGluc3RlYWQgb2YgMSkgdG8gZ2l2ZSBvdXIgcmF0aW9zIGEgcHJlY2lzaW9uIG9mIGF0IGxlYXN0IDIgZGVjaW1hbCB2YWx1ZXMuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWVhc3VyZW1lbnQgPSAxMDAsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFJhdGlvcyA9IHt9O1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXNhbWVFbVJhdGlvIHx8ICFzYW1lUGVyY2VudFJhdGlvKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGR1bW15ID0gRGF0YShlbGVtZW50KS5pc1NWRyA/IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsIFwicmVjdFwiKSA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5pbml0KGR1bW15KTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzYW1lUmF0aW9JbmRpY2F0b3JzLm15UGFyZW50LmFwcGVuZENoaWxkKGR1bW15KTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRvIGFjY3VyYXRlbHkgYW5kIGNvbnNpc3RlbnRseSBjYWxjdWxhdGUgY29udmVyc2lvbiByYXRpb3MsIHRoZSBlbGVtZW50J3MgY2FzY2FkZWQgb3ZlcmZsb3cgYW5kIGJveC1zaXppbmcgYXJlIHN0cmlwcGVkLlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNpbWlsYXJseSwgc2luY2Ugd2lkdGgvaGVpZ2h0IGNhbiBiZSBhcnRpZmljaWFsbHkgY29uc3RyYWluZWQgYnkgdGhlaXIgbWluLS9tYXgtIGVxdWl2YWxlbnRzLCB0aGVzZSBhcmUgY29udHJvbGxlZCBmb3IgYXMgd2VsbC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBPdmVyZmxvdyBtdXN0IGJlIGFsc28gYmUgY29udHJvbGxlZCBmb3IgcGVyLWF4aXMgc2luY2UgdGhlIG92ZXJmbG93IHByb3BlcnR5IG92ZXJ3cml0ZXMgaXRzIHBlci1heGlzIHZhbHVlcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2goWyBcIm92ZXJmbG93XCIsIFwib3ZlcmZsb3dYXCIsIFwib3ZlcmZsb3dZXCIgXSwgZnVuY3Rpb24oaSwgcHJvcGVydHkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuQ1NTLnNldFByb3BlcnR5VmFsdWUoZHVtbXksIHByb3BlcnR5LCBcImhpZGRlblwiKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5DU1Muc2V0UHJvcGVydHlWYWx1ZShkdW1teSwgXCJwb3NpdGlvblwiLCBzYW1lUmF0aW9JbmRpY2F0b3JzLnBvc2l0aW9uKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5DU1Muc2V0UHJvcGVydHlWYWx1ZShkdW1teSwgXCJmb250U2l6ZVwiLCBzYW1lUmF0aW9JbmRpY2F0b3JzLmZvbnRTaXplKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5DU1Muc2V0UHJvcGVydHlWYWx1ZShkdW1teSwgXCJib3hTaXppbmdcIiwgXCJjb250ZW50LWJveFwiKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIHdpZHRoIGFuZCBoZWlnaHQgYWN0IGFzIG91ciBwcm94eSBwcm9wZXJ0aWVzIGZvciBtZWFzdXJpbmcgdGhlIGhvcml6b250YWwgYW5kIHZlcnRpY2FsICUgcmF0aW9zLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChbIFwibWluV2lkdGhcIiwgXCJtYXhXaWR0aFwiLCBcIndpZHRoXCIsIFwibWluSGVpZ2h0XCIsIFwibWF4SGVpZ2h0XCIsIFwiaGVpZ2h0XCIgXSwgZnVuY3Rpb24oaSwgcHJvcGVydHkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVmVsb2NpdHkuQ1NTLnNldFByb3BlcnR5VmFsdWUoZHVtbXksIHByb3BlcnR5LCBtZWFzdXJlbWVudCArIFwiJVwiKTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBwYWRkaW5nTGVmdCBhcmJpdHJhcmlseSBhY3RzIGFzIG91ciBwcm94eSBwcm9wZXJ0eSBmb3IgdGhlIGVtIHJhdGlvLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LkNTUy5zZXRQcm9wZXJ0eVZhbHVlKGR1bW15LCBcInBhZGRpbmdMZWZ0XCIsIG1lYXN1cmVtZW50ICsgXCJlbVwiKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIERpdmlkZSB0aGUgcmV0dXJuZWQgdmFsdWUgYnkgdGhlIG1lYXN1cmVtZW50IHRvIGdldCB0aGUgcmF0aW8gYmV0d2VlbiAxJSBhbmQgMXB4LiBEZWZhdWx0IHRvIDEgc2luY2Ugd29ya2luZyB3aXRoIDAgY2FuIHByb2R1Y2UgSW5maW5pdGUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFJhdGlvcy5wZXJjZW50VG9QeFdpZHRoID0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0UGVyY2VudFRvUHhXaWR0aCA9IChwYXJzZUZsb2F0KENTUy5nZXRQcm9wZXJ0eVZhbHVlKGR1bW15LCBcIndpZHRoXCIsIG51bGwsIHRydWUpKSB8fCAxKSAvIG1lYXN1cmVtZW50OyAvKiBHRVQgKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0UmF0aW9zLnBlcmNlbnRUb1B4SGVpZ2h0ID0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0UGVyY2VudFRvUHhIZWlnaHQgPSAocGFyc2VGbG9hdChDU1MuZ2V0UHJvcGVydHlWYWx1ZShkdW1teSwgXCJoZWlnaHRcIiwgbnVsbCwgdHJ1ZSkpIHx8IDEpIC8gbWVhc3VyZW1lbnQ7IC8qIEdFVCAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRSYXRpb3MuZW1Ub1B4ID0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0RW1Ub1B4ID0gKHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZHVtbXksIFwicGFkZGluZ0xlZnRcIikpIHx8IDEpIC8gbWVhc3VyZW1lbnQ7IC8qIEdFVCAqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2FtZVJhdGlvSW5kaWNhdG9ycy5teVBhcmVudC5yZW1vdmVDaGlsZChkdW1teSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRSYXRpb3MuZW1Ub1B4ID0gY2FsbFVuaXRDb252ZXJzaW9uRGF0YS5sYXN0RW1Ub1B4O1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRSYXRpb3MucGVyY2VudFRvUHhXaWR0aCA9IGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdFBlcmNlbnRUb1B4V2lkdGg7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFJhdGlvcy5wZXJjZW50VG9QeEhlaWdodCA9IGNhbGxVbml0Q29udmVyc2lvbkRhdGEubGFzdFBlcmNlbnRUb1B4SGVpZ2h0O1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBFbGVtZW50LUFnbm9zdGljIFVuaXRzXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFdoZXJlYXMgJSBhbmQgZW0gcmF0aW9zIGFyZSBkZXRlcm1pbmVkIG9uIGEgcGVyLWVsZW1lbnQgYmFzaXMsIHRoZSByZW0gdW5pdCBvbmx5IG5lZWRzIHRvIGJlIGNoZWNrZWRcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uY2UgcGVyIGNhbGwgc2luY2UgaXQncyBleGNsdXNpdmVseSBkZXBlbmRhbnQgdXBvbiBkb2N1bWVudC5ib2R5J3MgZm9udFNpemUuIElmIHRoaXMgaXMgdGhlIGZpcnN0IHRpbWVcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQgY2FsY3VsYXRlVW5pdFJhdGlvcygpIGlzIGJlaW5nIHJ1biBkdXJpbmcgdGhpcyBjYWxsLCByZW1Ub1B4IHdpbGwgc3RpbGwgYmUgc2V0IHRvIGl0cyBkZWZhdWx0IHZhbHVlIG9mIG51bGwsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzbyB3ZSBjYWxjdWxhdGUgaXQgbm93LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGxVbml0Q29udmVyc2lvbkRhdGEucmVtVG9QeCA9PT0gbnVsbCkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIERlZmF1bHQgdG8gYnJvd3NlcnMnIGRlZmF1bHQgZm9udFNpemUgb2YgMTZweCBpbiB0aGUgY2FzZSBvZiAwLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxVbml0Q29udmVyc2lvbkRhdGEucmVtVG9QeCA9IHBhcnNlRmxvYXQoQ1NTLmdldFByb3BlcnR5VmFsdWUoZG9jdW1lbnQuYm9keSwgXCJmb250U2l6ZVwiKSkgfHwgMTY7IC8qIEdFVCAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTaW1pbGFybHksIHZpZXdwb3J0IHVuaXRzIGFyZSAlLXJlbGF0aXZlIHRvIHRoZSB3aW5kb3cncyBpbm5lciBkaW1lbnNpb25zLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNhbGxVbml0Q29udmVyc2lvbkRhdGEudndUb1B4ID09PSBudWxsKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbFVuaXRDb252ZXJzaW9uRGF0YS52d1RvUHggPSBwYXJzZUZsb2F0KHdpbmRvdy5pbm5lcldpZHRoKSAvIDEwMDsgLyogR0VUICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbFVuaXRDb252ZXJzaW9uRGF0YS52aFRvUHggPSBwYXJzZUZsb2F0KHdpbmRvdy5pbm5lckhlaWdodCkgLyAxMDA7IC8qIEdFVCAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0UmF0aW9zLnJlbVRvUHggPSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLnJlbVRvUHg7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bml0UmF0aW9zLnZ3VG9QeCA9IGNhbGxVbml0Q29udmVyc2lvbkRhdGEudndUb1B4O1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdFJhdGlvcy52aFRvUHggPSBjYWxsVW5pdENvbnZlcnNpb25EYXRhLnZoVG9QeDtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFZlbG9jaXR5LmRlYnVnID49IDEpIGNvbnNvbGUubG9nKFwiVW5pdCByYXRpb3M6IFwiICsgSlNPTi5zdHJpbmdpZnkodW5pdFJhdGlvcyksIGVsZW1lbnQpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5pdFJhdGlvcztcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBVbml0IENvbnZlcnNpb25cblx0ICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogVGhlICogYW5kIC8gb3BlcmF0b3JzLCB3aGljaCBhcmUgbm90IHBhc3NlZCBpbiB3aXRoIGFuIGFzc29jaWF0ZWQgdW5pdCwgaW5oZXJlbnRseSB1c2Ugc3RhcnRWYWx1ZSdzIHVuaXQuIFNraXAgdmFsdWUgYW5kIHVuaXQgY29udmVyc2lvbi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC9bXFwvKl0vLnRlc3Qob3BlcmF0b3IpKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZVVuaXRUeXBlID0gc3RhcnRWYWx1ZVVuaXRUeXBlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBJZiBzdGFydFZhbHVlIGFuZCBlbmRWYWx1ZSBkaWZmZXIgaW4gdW5pdCB0eXBlLCBjb252ZXJ0IHN0YXJ0VmFsdWUgaW50byB0aGUgc2FtZSB1bml0IHR5cGUgYXMgZW5kVmFsdWUgc28gdGhhdCBpZiBlbmRWYWx1ZVVuaXRUeXBlXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzIGEgcmVsYXRpdmUgdW5pdCAoJSwgZW0sIHJlbSksIHRoZSB2YWx1ZXMgc2V0IGR1cmluZyB0d2VlbmluZyB3aWxsIGNvbnRpbnVlIHRvIGJlIGFjY3VyYXRlbHkgcmVsYXRpdmUgZXZlbiBpZiB0aGUgbWV0cmljcyB0aGV5IGRlcGVuZFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBvbiBhcmUgZHluYW1pY2FsbHkgY2hhbmdpbmcgZHVyaW5nIHRoZSBjb3Vyc2Ugb2YgdGhlIGFuaW1hdGlvbi4gQ29udmVyc2VseSwgaWYgd2UgYWx3YXlzIG5vcm1hbGl6ZWQgaW50byBweCBhbmQgdXNlZCBweCBmb3Igc2V0dGluZyB2YWx1ZXMsIHRoZSBweCByYXRpb1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICB3b3VsZCBiZWNvbWUgc3RhbGUgaWYgdGhlIG9yaWdpbmFsIHVuaXQgYmVpbmcgYW5pbWF0ZWQgdG93YXJkIHdhcyByZWxhdGl2ZSBhbmQgdGhlIHVuZGVybHlpbmcgbWV0cmljcyBjaGFuZ2UgZHVyaW5nIHRoZSBhbmltYXRpb24uICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIFNpbmNlIDAgaXMgMCBpbiBhbnkgdW5pdCB0eXBlLCBubyBjb252ZXJzaW9uIGlzIG5lY2Vzc2FyeSB3aGVuIHN0YXJ0VmFsdWUgaXMgMCAtLSB3ZSBqdXN0IHN0YXJ0IGF0IDAgd2l0aCBlbmRWYWx1ZVVuaXRUeXBlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKChzdGFydFZhbHVlVW5pdFR5cGUgIT09IGVuZFZhbHVlVW5pdFR5cGUpICYmIHN0YXJ0VmFsdWUgIT09IDApIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFVuaXQgY29udmVyc2lvbiBpcyBhbHNvIHNraXBwZWQgd2hlbiBlbmRWYWx1ZSBpcyAwLCBidXQgKnN0YXJ0VmFsdWVVbml0VHlwZSogbXVzdCBiZSB1c2VkIGZvciB0d2VlbiB2YWx1ZXMgdG8gcmVtYWluIGFjY3VyYXRlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogU2tpcHBpbmcgdW5pdCBjb252ZXJzaW9uIGhlcmUgbWVhbnMgdGhhdCBpZiBlbmRWYWx1ZVVuaXRUeXBlIHdhcyBvcmlnaW5hbGx5IGEgcmVsYXRpdmUgdW5pdCwgdGhlIGFuaW1hdGlvbiB3b24ndCByZWxhdGl2ZWx5XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaCB0aGUgdW5kZXJseWluZyBtZXRyaWNzIGlmIHRoZXkgY2hhbmdlLCBidXQgdGhpcyBpcyBhY2NlcHRhYmxlIHNpbmNlIHdlJ3JlIGFuaW1hdGluZyB0b3dhcmQgaW52aXNpYmlsaXR5IGluc3RlYWQgb2YgdG93YXJkIHZpc2liaWxpdHksXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGljaCByZW1haW5zIHBhc3QgdGhlIHBvaW50IG9mIHRoZSBhbmltYXRpb24ncyBjb21wbGV0aW9uLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVuZFZhbHVlID09PSAwKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kVmFsdWVVbml0VHlwZSA9IHN0YXJ0VmFsdWVVbml0VHlwZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogQnkgdGhpcyBwb2ludCwgd2UgY2Fubm90IGF2b2lkIHVuaXQgY29udmVyc2lvbiAoaXQncyB1bmRlc2lyYWJsZSBzaW5jZSBpdCBjYXVzZXMgbGF5b3V0IHRocmFzaGluZykuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSWYgd2UgaGF2ZW4ndCBhbHJlYWR5LCB3ZSB0cmlnZ2VyIGNhbGN1bGF0ZVVuaXRSYXRpb3MoKSwgd2hpY2ggcnVucyBvbmNlIHBlciBlbGVtZW50IHBlciBjYWxsLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRVbml0Q29udmVyc2lvbkRhdGEgPSBlbGVtZW50VW5pdENvbnZlcnNpb25EYXRhIHx8IGNhbGN1bGF0ZVVuaXRSYXRpb3MoKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIFRoZSBmb2xsb3dpbmcgUmVnRXggbWF0Y2hlcyBDU1MgcHJvcGVydGllcyB0aGF0IGhhdmUgdGhlaXIgJSB2YWx1ZXMgbWVhc3VyZWQgcmVsYXRpdmUgdG8gdGhlIHgtYXhpcy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBXM0Mgc3BlYyBtYW5kYXRlcyB0aGF0IGFsbCBvZiBtYXJnaW4gYW5kIHBhZGRpbmcncyBwcm9wZXJ0aWVzIChldmVuIHRvcCBhbmQgYm90dG9tKSBhcmUgJS1yZWxhdGl2ZSB0byB0aGUgKndpZHRoKiBvZiB0aGUgcGFyZW50IGVsZW1lbnQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGF4aXMgPSAoL21hcmdpbnxwYWRkaW5nfGxlZnR8cmlnaHR8d2lkdGh8dGV4dHx3b3JkfGxldHRlci9pLnRlc3QocHJvcGVydHkpIHx8IC9YJC8udGVzdChwcm9wZXJ0eSkgfHwgcHJvcGVydHkgPT09IFwieFwiKSA/IFwieFwiIDogXCJ5XCI7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJbiBvcmRlciB0byBhdm9pZCBnZW5lcmF0aW5nIG5eMiBiZXNwb2tlIGNvbnZlcnNpb24gZnVuY3Rpb25zLCB1bml0IGNvbnZlcnNpb24gaXMgYSB0d28tc3RlcCBwcm9jZXNzOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDEpIENvbnZlcnQgc3RhcnRWYWx1ZSBpbnRvIHBpeGVscy4gMikgQ29udmVydCB0aGlzIG5ldyBwaXhlbCB2YWx1ZSBpbnRvIGVuZFZhbHVlJ3MgdW5pdCB0eXBlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoc3RhcnRWYWx1ZVVuaXRUeXBlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCIlXCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiB0cmFuc2xhdGVYIGFuZCB0cmFuc2xhdGVZIGFyZSB0aGUgb25seSBwcm9wZXJ0aWVzIHRoYXQgYXJlICUtcmVsYXRpdmUgdG8gYW4gZWxlbWVudCdzIG93biBkaW1lbnNpb25zIC0tIG5vdCBpdHMgcGFyZW50J3MgZGltZW5zaW9ucy5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5IGRvZXMgbm90IGluY2x1ZGUgYSBzcGVjaWFsIGNvbnZlcnNpb24gcHJvY2VzcyB0byBhY2NvdW50IGZvciB0aGlzIGJlaGF2aW9yLiBUaGVyZWZvcmUsIGFuaW1hdGluZyB0cmFuc2xhdGVYL1kgZnJvbSBhICUgdmFsdWVcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvIGEgbm9uLSUgdmFsdWUgd2lsbCBwcm9kdWNlIGFuIGluY29ycmVjdCBzdGFydCB2YWx1ZS4gRm9ydHVuYXRlbHksIHRoaXMgc29ydCBvZiBjcm9zcy11bml0IGNvbnZlcnNpb24gaXMgcmFyZWx5IGRvbmUgYnkgdXNlcnMgaW4gcHJhY3RpY2UuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlICo9IChheGlzID09PSBcInhcIiA/IGVsZW1lbnRVbml0Q29udmVyc2lvbkRhdGEucGVyY2VudFRvUHhXaWR0aCA6IGVsZW1lbnRVbml0Q29udmVyc2lvbkRhdGEucGVyY2VudFRvUHhIZWlnaHQpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcInB4XCI6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBweCBhY3RzIGFzIG91ciBtaWRwb2ludCBpbiB0aGUgdW5pdCBjb252ZXJzaW9uIHByb2Nlc3M7IGRvIG5vdGhpbmcuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSAqPSBlbGVtZW50VW5pdENvbnZlcnNpb25EYXRhW3N0YXJ0VmFsdWVVbml0VHlwZSArIFwiVG9QeFwiXTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBJbnZlcnQgdGhlIHB4IHJhdGlvcyB0byBjb252ZXJ0IGludG8gdG8gdGhlIHRhcmdldCB1bml0LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoZW5kVmFsdWVVbml0VHlwZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiJVwiOlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZSAqPSAxIC8gKGF4aXMgPT09IFwieFwiID8gZWxlbWVudFVuaXRDb252ZXJzaW9uRGF0YS5wZXJjZW50VG9QeFdpZHRoIDogZWxlbWVudFVuaXRDb252ZXJzaW9uRGF0YS5wZXJjZW50VG9QeEhlaWdodCk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwicHhcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIHN0YXJ0VmFsdWUgaXMgYWxyZWFkeSBpbiBweCwgZG8gbm90aGluZzsgd2UncmUgZG9uZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydFZhbHVlICo9IDEgLyBlbGVtZW50VW5pdENvbnZlcnNpb25EYXRhW2VuZFZhbHVlVW5pdFR5cGUgKyBcIlRvUHhcIl07XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWxhdGl2ZSBWYWx1ZXNcblx0ICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIE9wZXJhdG9yIGxvZ2ljIG11c3QgYmUgcGVyZm9ybWVkIGxhc3Qgc2luY2UgaXQgcmVxdWlyZXMgdW5pdC1ub3JtYWxpemVkIHN0YXJ0IGFuZCBlbmQgdmFsdWVzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3RlOiBSZWxhdGl2ZSAqcGVyY2VudCB2YWx1ZXMqIGRvIG5vdCBiZWhhdmUgaG93IG1vc3QgcGVvcGxlIHRoaW5rOyB3aGlsZSBvbmUgd291bGQgZXhwZWN0IFwiKz01MCVcIlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICB0byBpbmNyZWFzZSB0aGUgcHJvcGVydHkgMS41eCBpdHMgY3VycmVudCB2YWx1ZSwgaXQgaW4gZmFjdCBpbmNyZWFzZXMgdGhlIHBlcmNlbnQgdW5pdHMgaW4gYWJzb2x1dGUgdGVybXM6XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIDUwIHBvaW50cyBpcyBhZGRlZCBvbiB0b3Agb2YgdGhlIGN1cnJlbnQgJSB2YWx1ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChvcGVyYXRvcikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIitcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IHN0YXJ0VmFsdWUgKyBlbmRWYWx1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIi1cIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IHN0YXJ0VmFsdWUgLSBlbmRWYWx1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIipcIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IHN0YXJ0VmFsdWUgKiBlbmRWYWx1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcIi9cIjpcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmRWYWx1ZSA9IHN0YXJ0VmFsdWUgLyBlbmRWYWx1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICB0d2VlbnNDb250YWluZXIgUHVzaFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBDb25zdHJ1Y3QgdGhlIHBlci1wcm9wZXJ0eSB0d2VlbiBvYmplY3QsIGFuZCBwdXNoIGl0IHRvIHRoZSBlbGVtZW50J3MgdHdlZW5zQ29udGFpbmVyLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB0d2VlbnNDb250YWluZXJbcHJvcGVydHldID0ge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9vdFByb3BlcnR5VmFsdWU6IHJvb3RQcm9wZXJ0eVZhbHVlLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRWYWx1ZTogc3RhcnRWYWx1ZSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWYWx1ZTogc3RhcnRWYWx1ZSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFZhbHVlOiBlbmRWYWx1ZSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRUeXBlOiBlbmRWYWx1ZVVuaXRUeXBlLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWFzaW5nOiBlYXNpbmdcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoVmVsb2NpdHkuZGVidWcpIGNvbnNvbGUubG9nKFwidHdlZW5zQ29udGFpbmVyIChcIiArIHByb3BlcnR5ICsgXCIpOiBcIiArIEpTT04uc3RyaW5naWZ5KHR3ZWVuc0NvbnRhaW5lcltwcm9wZXJ0eV0pLCBlbGVtZW50KTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBBbG9uZyB3aXRoIGl0cyBwcm9wZXJ0eSBkYXRhLCBzdG9yZSBhIHJlZmVyZW5jZSB0byB0aGUgZWxlbWVudCBpdHNlbGYgb250byB0d2VlbnNDb250YWluZXIuICovXG5cdCAgICAgICAgICAgICAgICAgICAgdHdlZW5zQ29udGFpbmVyLmVsZW1lbnQgPSBlbGVtZW50O1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICBDYWxsIFB1c2hcblx0ICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAvKiBOb3RlOiB0d2VlbnNDb250YWluZXIgY2FuIGJlIGVtcHR5IGlmIGFsbCBvZiB0aGUgcHJvcGVydGllcyBpbiB0aGlzIGNhbGwncyBwcm9wZXJ0eSBtYXAgd2VyZSBza2lwcGVkIGR1ZSB0byBub3Rcblx0ICAgICAgICAgICAgICAgICAgIGJlaW5nIHN1cHBvcnRlZCBieSB0aGUgYnJvd3Nlci4gVGhlIGVsZW1lbnQgcHJvcGVydHkgaXMgdXNlZCBmb3IgY2hlY2tpbmcgdGhhdCB0aGUgdHdlZW5zQ29udGFpbmVyIGhhcyBiZWVuIGFwcGVuZGVkIHRvLiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKHR3ZWVuc0NvbnRhaW5lci5lbGVtZW50KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgLyogQXBwbHkgdGhlIFwidmVsb2NpdHktYW5pbWF0aW5nXCIgaW5kaWNhdG9yIGNsYXNzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIENTUy5WYWx1ZXMuYWRkQ2xhc3MoZWxlbWVudCwgXCJ2ZWxvY2l0eS1hbmltYXRpbmdcIik7XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBUaGUgY2FsbCBhcnJheSBob3VzZXMgdGhlIHR3ZWVuc0NvbnRhaW5lcnMgZm9yIGVhY2ggZWxlbWVudCBiZWluZyBhbmltYXRlZCBpbiB0aGUgY3VycmVudCBjYWxsLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGNhbGwucHVzaCh0d2VlbnNDb250YWluZXIpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogU3RvcmUgdGhlIHR3ZWVuc0NvbnRhaW5lciBhbmQgb3B0aW9ucyBpZiB3ZSdyZSB3b3JraW5nIG9uIHRoZSBkZWZhdWx0IGVmZmVjdHMgcXVldWUsIHNvIHRoYXQgdGhleSBjYW4gYmUgdXNlZCBieSB0aGUgcmV2ZXJzZSBjb21tYW5kLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLnF1ZXVlID09PSBcIlwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkudHdlZW5zQ29udGFpbmVyID0gdHdlZW5zQ29udGFpbmVyO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLm9wdHMgPSBvcHRzO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIFN3aXRjaCBvbiB0aGUgZWxlbWVudCdzIGFuaW1hdGluZyBmbGFnLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkuaXNBbmltYXRpbmcgPSB0cnVlO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogT25jZSB0aGUgZmluYWwgZWxlbWVudCBpbiB0aGlzIGNhbGwncyBlbGVtZW50IHNldCBoYXMgYmVlbiBwcm9jZXNzZWQsIHB1c2ggdGhlIGNhbGwgYXJyYXkgb250b1xuXHQgICAgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LlN0YXRlLmNhbGxzIGZvciB0aGUgYW5pbWF0aW9uIHRpY2sgdG8gaW1tZWRpYXRlbHkgYmVnaW4gcHJvY2Vzc2luZy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudHNJbmRleCA9PT0gZWxlbWVudHNMZW5ndGggLSAxKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIEFkZCB0aGUgY3VycmVudCBjYWxsIHBsdXMgaXRzIGFzc29jaWF0ZWQgbWV0YWRhdGEgKHRoZSBlbGVtZW50IHNldCBhbmQgdGhlIGNhbGwncyBvcHRpb25zKSBvbnRvIHRoZSBnbG9iYWwgY2FsbCBjb250YWluZXIuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgIEFueXRoaW5nIG9uIHRoaXMgY2FsbCBjb250YWluZXIgaXMgc3ViamVjdGVkIHRvIHRpY2soKSBwcm9jZXNzaW5nLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5TdGF0ZS5jYWxscy5wdXNoKFsgY2FsbCwgZWxlbWVudHMsIG9wdHMsIG51bGwsIHByb21pc2VEYXRhLnJlc29sdmVyIF0pO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBhbmltYXRpb24gdGljayBpc24ndCBydW5uaW5nLCBzdGFydCBpdC4gKFZlbG9jaXR5IHNodXRzIGl0IG9mZiB3aGVuIHRoZXJlIGFyZSBubyBhY3RpdmUgY2FsbHMgdG8gcHJvY2Vzcy4pICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChWZWxvY2l0eS5TdGF0ZS5pc1RpY2tpbmcgPT09IGZhbHNlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5TdGF0ZS5pc1RpY2tpbmcgPSB0cnVlO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTdGFydCB0aGUgdGljayBsb29wLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGljaygpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudHNJbmRleCsrO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8qIFdoZW4gdGhlIHF1ZXVlIG9wdGlvbiBpcyBzZXQgdG8gZmFsc2UsIHRoZSBjYWxsIHNraXBzIHRoZSBlbGVtZW50J3MgcXVldWUgYW5kIGZpcmVzIGltbWVkaWF0ZWx5LiAqL1xuXHQgICAgICAgICAgICBpZiAob3B0cy5xdWV1ZSA9PT0gZmFsc2UpIHtcblx0ICAgICAgICAgICAgICAgIC8qIFNpbmNlIHRoaXMgYnVpbGRRdWV1ZSBjYWxsIGRvZXNuJ3QgcmVzcGVjdCB0aGUgZWxlbWVudCdzIGV4aXN0aW5nIHF1ZXVlICh3aGljaCBpcyB3aGVyZSBhIGRlbGF5IG9wdGlvbiB3b3VsZCBoYXZlIGJlZW4gYXBwZW5kZWQpLFxuXHQgICAgICAgICAgICAgICAgICAgd2UgbWFudWFsbHkgaW5qZWN0IHRoZSBkZWxheSBwcm9wZXJ0eSBoZXJlIHdpdGggYW4gZXhwbGljaXQgc2V0VGltZW91dC4gKi9cblx0ICAgICAgICAgICAgICAgIGlmIChvcHRzLmRlbGF5KSB7XG5cdCAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChidWlsZFF1ZXVlLCBvcHRzLmRlbGF5KTtcblx0ICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAgICAgYnVpbGRRdWV1ZSgpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAvKiBPdGhlcndpc2UsIHRoZSBjYWxsIHVuZGVyZ29lcyBlbGVtZW50IHF1ZXVlaW5nIGFzIG5vcm1hbC4gKi9cblx0ICAgICAgICAgICAgLyogTm90ZTogVG8gaW50ZXJvcGVyYXRlIHdpdGggalF1ZXJ5LCBWZWxvY2l0eSB1c2VzIGpRdWVyeSdzIG93biAkLnF1ZXVlKCkgc3RhY2sgZm9yIHF1ZXVpbmcgbG9naWMuICovXG5cdCAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICAkLnF1ZXVlKGVsZW1lbnQsIG9wdHMucXVldWUsIGZ1bmN0aW9uKG5leHQsIGNsZWFyUXVldWUpIHtcblx0ICAgICAgICAgICAgICAgICAgICAvKiBJZiB0aGUgY2xlYXJRdWV1ZSBmbGFnIHdhcyBwYXNzZWQgaW4gYnkgdGhlIHN0b3AgY29tbWFuZCwgcmVzb2x2ZSB0aGlzIGNhbGwncyBwcm9taXNlLiAoUHJvbWlzZXMgY2FuIG9ubHkgYmUgcmVzb2x2ZWQgb25jZSxcblx0ICAgICAgICAgICAgICAgICAgICAgICBzbyBpdCdzIGZpbmUgaWYgdGhpcyBpcyByZXBlYXRlZGx5IHRyaWdnZXJlZCBmb3IgZWFjaCBlbGVtZW50IGluIHRoZSBhc3NvY2lhdGVkIGNhbGwuKSAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChjbGVhclF1ZXVlID09PSB0cnVlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9taXNlRGF0YS5wcm9taXNlKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlRGF0YS5yZXNvbHZlcihlbGVtZW50cyk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAvKiBEbyBub3QgY29udGludWUgd2l0aCBhbmltYXRpb24gcXVldWVpbmcuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIFRoaXMgZmxhZyBpbmRpY2F0ZXMgdG8gdGhlIHVwY29taW5nIGNvbXBsZXRlQ2FsbCgpIGZ1bmN0aW9uIHRoYXQgdGhpcyBxdWV1ZSBlbnRyeSB3YXMgaW5pdGlhdGVkIGJ5IFZlbG9jaXR5LlxuXHQgICAgICAgICAgICAgICAgICAgICAgIFNlZSBjb21wbGV0ZUNhbGwoKSBmb3IgZnVydGhlciBkZXRhaWxzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LnZlbG9jaXR5UXVldWVFbnRyeUZsYWcgPSB0cnVlO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgYnVpbGRRdWV1ZShuZXh0KTtcblx0ICAgICAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgQXV0by1EZXF1ZXVpbmdcblx0ICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgIC8qIEFzIHBlciBqUXVlcnkncyAkLnF1ZXVlKCkgYmVoYXZpb3IsIHRvIGZpcmUgdGhlIGZpcnN0IG5vbi1jdXN0b20tcXVldWUgZW50cnkgb24gYW4gZWxlbWVudCwgdGhlIGVsZW1lbnRcblx0ICAgICAgICAgICAgICAgbXVzdCBiZSBkZXF1ZXVlZCBpZiBpdHMgcXVldWUgc3RhY2sgY29uc2lzdHMgKnNvbGVseSogb2YgdGhlIGN1cnJlbnQgY2FsbC4gKFRoaXMgY2FuIGJlIGRldGVybWluZWQgYnkgY2hlY2tpbmdcblx0ICAgICAgICAgICAgICAgZm9yIHRoZSBcImlucHJvZ3Jlc3NcIiBpdGVtIHRoYXQgalF1ZXJ5IHByZXBlbmRzIHRvIGFjdGl2ZSBxdWV1ZSBzdGFjayBhcnJheXMuKSBSZWdhcmRsZXNzLCB3aGVuZXZlciB0aGUgZWxlbWVudCdzXG5cdCAgICAgICAgICAgICAgIHF1ZXVlIGlzIGZ1cnRoZXIgYXBwZW5kZWQgd2l0aCBhZGRpdGlvbmFsIGl0ZW1zIC0tIGluY2x1ZGluZyAkLmRlbGF5KCkncyBvciBldmVuICQuYW5pbWF0ZSgpIGNhbGxzLCB0aGUgcXVldWUnc1xuXHQgICAgICAgICAgICAgICBmaXJzdCBlbnRyeSBpcyBhdXRvbWF0aWNhbGx5IGZpcmVkLiBUaGlzIGJlaGF2aW9yIGNvbnRyYXN0cyB0aGF0IG9mIGN1c3RvbSBxdWV1ZXMsIHdoaWNoIG5ldmVyIGF1dG8tZmlyZS4gKi9cblx0ICAgICAgICAgICAgLyogTm90ZTogV2hlbiBhbiBlbGVtZW50IHNldCBpcyBiZWluZyBzdWJqZWN0ZWQgdG8gYSBub24tcGFyYWxsZWwgVmVsb2NpdHkgY2FsbCwgdGhlIGFuaW1hdGlvbiB3aWxsIG5vdCBiZWdpbiB1bnRpbFxuXHQgICAgICAgICAgICAgICBlYWNoIG9uZSBvZiB0aGUgZWxlbWVudHMgaW4gdGhlIHNldCBoYXMgcmVhY2hlZCB0aGUgZW5kIG9mIGl0cyBpbmRpdmlkdWFsbHkgcHJlLWV4aXN0aW5nIHF1ZXVlIGNoYWluLiAqL1xuXHQgICAgICAgICAgICAvKiBOb3RlOiBVbmZvcnR1bmF0ZWx5LCBtb3N0IHBlb3BsZSBkb24ndCBmdWxseSBncmFzcCBqUXVlcnkncyBwb3dlcmZ1bCwgeWV0IHF1aXJreSwgJC5xdWV1ZSgpIGZ1bmN0aW9uLlxuXHQgICAgICAgICAgICAgICBMZWFuIG1vcmUgaGVyZTogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDU4MTU4L2Nhbi1zb21lYm9keS1leHBsYWluLWpxdWVyeS1xdWV1ZS10by1tZSAqL1xuXHQgICAgICAgICAgICBpZiAoKG9wdHMucXVldWUgPT09IFwiXCIgfHwgb3B0cy5xdWV1ZSA9PT0gXCJmeFwiKSAmJiAkLnF1ZXVlKGVsZW1lbnQpWzBdICE9PSBcImlucHJvZ3Jlc3NcIikge1xuXHQgICAgICAgICAgICAgICAgJC5kZXF1ZXVlKGVsZW1lbnQpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgRWxlbWVudCBTZXQgSXRlcmF0aW9uXG5cdCAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAvKiBJZiB0aGUgXCJub2RlVHlwZVwiIHByb3BlcnR5IGV4aXN0cyBvbiB0aGUgZWxlbWVudHMgdmFyaWFibGUsIHdlJ3JlIGFuaW1hdGluZyBhIHNpbmdsZSBlbGVtZW50LlxuXHQgICAgICAgICAgIFBsYWNlIGl0IGluIGFuIGFycmF5IHNvIHRoYXQgJC5lYWNoKCkgY2FuIGl0ZXJhdGUgb3ZlciBpdC4gKi9cblx0ICAgICAgICAkLmVhY2goZWxlbWVudHMsIGZ1bmN0aW9uKGksIGVsZW1lbnQpIHtcblx0ICAgICAgICAgICAgLyogRW5zdXJlIGVhY2ggZWxlbWVudCBpbiBhIHNldCBoYXMgYSBub2RlVHlwZSAoaXMgYSByZWFsIGVsZW1lbnQpIHRvIGF2b2lkIHRocm93aW5nIGVycm9ycy4gKi9cblx0ICAgICAgICAgICAgaWYgKFR5cGUuaXNOb2RlKGVsZW1lbnQpKSB7XG5cdCAgICAgICAgICAgICAgICBwcm9jZXNzRWxlbWVudC5jYWxsKGVsZW1lbnQpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfSk7XG5cblx0ICAgICAgICAvKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgT3B0aW9uOiBMb29wXG5cdCAgICAgICAgKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgLyogVGhlIGxvb3Agb3B0aW9uIGFjY2VwdHMgYW4gaW50ZWdlciBpbmRpY2F0aW5nIGhvdyBtYW55IHRpbWVzIHRoZSBlbGVtZW50IHNob3VsZCBsb29wIGJldHdlZW4gdGhlIHZhbHVlcyBpbiB0aGVcblx0ICAgICAgICAgICBjdXJyZW50IGNhbGwncyBwcm9wZXJ0aWVzIG1hcCBhbmQgdGhlIGVsZW1lbnQncyBwcm9wZXJ0eSB2YWx1ZXMgcHJpb3IgdG8gdGhpcyBjYWxsLiAqL1xuXHQgICAgICAgIC8qIE5vdGU6IFRoZSBsb29wIG9wdGlvbidzIGxvZ2ljIGlzIHBlcmZvcm1lZCBoZXJlIC0tIGFmdGVyIGVsZW1lbnQgcHJvY2Vzc2luZyAtLSBiZWNhdXNlIHRoZSBjdXJyZW50IGNhbGwgbmVlZHNcblx0ICAgICAgICAgICB0byB1bmRlcmdvIGl0cyBxdWV1ZSBpbnNlcnRpb24gcHJpb3IgdG8gdGhlIGxvb3Agb3B0aW9uIGdlbmVyYXRpbmcgaXRzIHNlcmllcyBvZiBjb25zdGl0dWVudCBcInJldmVyc2VcIiBjYWxscyxcblx0ICAgICAgICAgICB3aGljaCBjaGFpbiBhZnRlciB0aGUgY3VycmVudCBjYWxsLiBUd28gcmV2ZXJzZSBjYWxscyAodHdvIFwiYWx0ZXJuYXRpb25zXCIpIGNvbnN0aXR1dGUgb25lIGxvb3AuICovXG5cdCAgICAgICAgdmFyIG9wdHMgPSAkLmV4dGVuZCh7fSwgVmVsb2NpdHkuZGVmYXVsdHMsIG9wdGlvbnMpLFxuXHQgICAgICAgICAgICByZXZlcnNlQ2FsbHNDb3VudDtcblxuXHQgICAgICAgIG9wdHMubG9vcCA9IHBhcnNlSW50KG9wdHMubG9vcCk7XG5cdCAgICAgICAgcmV2ZXJzZUNhbGxzQ291bnQgPSAob3B0cy5sb29wICogMikgLSAxO1xuXG5cdCAgICAgICAgaWYgKG9wdHMubG9vcCkge1xuXHQgICAgICAgICAgICAvKiBEb3VibGUgdGhlIGxvb3AgY291bnQgdG8gY29udmVydCBpdCBpbnRvIGl0cyBhcHByb3ByaWF0ZSBudW1iZXIgb2YgXCJyZXZlcnNlXCIgY2FsbHMuXG5cdCAgICAgICAgICAgICAgIFN1YnRyYWN0IDEgZnJvbSB0aGUgcmVzdWx0aW5nIHZhbHVlIHNpbmNlIHRoZSBjdXJyZW50IGNhbGwgaXMgaW5jbHVkZWQgaW4gdGhlIHRvdGFsIGFsdGVybmF0aW9uIGNvdW50LiAqL1xuXHQgICAgICAgICAgICBmb3IgKHZhciB4ID0gMDsgeCA8IHJldmVyc2VDYWxsc0NvdW50OyB4KyspIHtcblx0ICAgICAgICAgICAgICAgIC8qIFNpbmNlIHRoZSBsb2dpYyBmb3IgdGhlIHJldmVyc2UgYWN0aW9uIG9jY3VycyBpbnNpZGUgUXVldWVpbmcgYW5kIHRoZXJlZm9yZSB0aGlzIGNhbGwncyBvcHRpb25zIG9iamVjdFxuXHQgICAgICAgICAgICAgICAgICAgaXNuJ3QgcGFyc2VkIHVudGlsIHRoZW4gYXMgd2VsbCwgdGhlIGN1cnJlbnQgY2FsbCdzIGRlbGF5IG9wdGlvbiBtdXN0IGJlIGV4cGxpY2l0bHkgcGFzc2VkIGludG8gdGhlIHJldmVyc2Vcblx0ICAgICAgICAgICAgICAgICAgIGNhbGwgc28gdGhhdCB0aGUgZGVsYXkgbG9naWMgdGhhdCBvY2N1cnMgaW5zaWRlICpQcmUtUXVldWVpbmcqIGNhbiBwcm9jZXNzIGl0LiAqL1xuXHQgICAgICAgICAgICAgICAgdmFyIHJldmVyc2VPcHRpb25zID0ge1xuXHQgICAgICAgICAgICAgICAgICAgIGRlbGF5OiBvcHRzLmRlbGF5LFxuXHQgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzOiBvcHRzLnByb2dyZXNzXG5cdCAgICAgICAgICAgICAgICB9O1xuXG5cdCAgICAgICAgICAgICAgICAvKiBJZiBhIGNvbXBsZXRlIGNhbGxiYWNrIHdhcyBwYXNzZWQgaW50byB0aGlzIGNhbGwsIHRyYW5zZmVyIGl0IHRvIHRoZSBsb29wIHJlZGlyZWN0J3MgZmluYWwgXCJyZXZlcnNlXCIgY2FsbFxuXHQgICAgICAgICAgICAgICAgICAgc28gdGhhdCBpdCdzIHRyaWdnZXJlZCB3aGVuIHRoZSBlbnRpcmUgcmVkaXJlY3QgaXMgY29tcGxldGUgKGFuZCBub3Qgd2hlbiB0aGUgdmVyeSBmaXJzdCBhbmltYXRpb24gaXMgY29tcGxldGUpLiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKHggPT09IHJldmVyc2VDYWxsc0NvdW50IC0gMSkge1xuXHQgICAgICAgICAgICAgICAgICAgIHJldmVyc2VPcHRpb25zLmRpc3BsYXkgPSBvcHRzLmRpc3BsYXk7XG5cdCAgICAgICAgICAgICAgICAgICAgcmV2ZXJzZU9wdGlvbnMudmlzaWJpbGl0eSA9IG9wdHMudmlzaWJpbGl0eTtcblx0ICAgICAgICAgICAgICAgICAgICByZXZlcnNlT3B0aW9ucy5jb21wbGV0ZSA9IG9wdHMuY29tcGxldGU7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIGFuaW1hdGUoZWxlbWVudHMsIFwicmV2ZXJzZVwiLCByZXZlcnNlT3B0aW9ucyk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgIENoYWluaW5nXG5cdCAgICAgICAgKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgLyogUmV0dXJuIHRoZSBlbGVtZW50cyBiYWNrIHRvIHRoZSBjYWxsIGNoYWluLCB3aXRoIHdyYXBwZWQgZWxlbWVudHMgdGFraW5nIHByZWNlZGVuY2UgaW4gY2FzZSBWZWxvY2l0eSB3YXMgY2FsbGVkIHZpYSB0aGUgJC5mbi4gZXh0ZW5zaW9uLiAqL1xuXHQgICAgICAgIHJldHVybiBnZXRDaGFpbigpO1xuXHQgICAgfTtcblxuXHQgICAgLyogVHVybiBWZWxvY2l0eSBpbnRvIHRoZSBhbmltYXRpb24gZnVuY3Rpb24sIGV4dGVuZGVkIHdpdGggdGhlIHByZS1leGlzdGluZyBWZWxvY2l0eSBvYmplY3QuICovXG5cdCAgICBWZWxvY2l0eSA9ICQuZXh0ZW5kKGFuaW1hdGUsIFZlbG9jaXR5KTtcblx0ICAgIC8qIEZvciBsZWdhY3kgc3VwcG9ydCwgYWxzbyBleHBvc2UgdGhlIGxpdGVyYWwgYW5pbWF0ZSBtZXRob2QuICovXG5cdCAgICBWZWxvY2l0eS5hbmltYXRlID0gYW5pbWF0ZTtcblxuXHQgICAgLyoqKioqKioqKioqKioqXG5cdCAgICAgICAgVGltaW5nXG5cdCAgICAqKioqKioqKioqKioqKi9cblxuXHQgICAgLyogVGlja2VyIGZ1bmN0aW9uLiAqL1xuXHQgICAgdmFyIHRpY2tlciA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgckFGU2hpbTtcblxuXHQgICAgLyogSW5hY3RpdmUgYnJvd3NlciB0YWJzIHBhdXNlIHJBRiwgd2hpY2ggcmVzdWx0cyBpbiBhbGwgYWN0aXZlIGFuaW1hdGlvbnMgaW1tZWRpYXRlbHkgc3ByaW50aW5nIHRvIHRoZWlyIGNvbXBsZXRpb24gc3RhdGVzIHdoZW4gdGhlIHRhYiByZWZvY3VzZXMuXG5cdCAgICAgICBUbyBnZXQgYXJvdW5kIHRoaXMsIHdlIGR5bmFtaWNhbGx5IHN3aXRjaCByQUYgdG8gc2V0VGltZW91dCAod2hpY2ggdGhlIGJyb3dzZXIgKmRvZXNuJ3QqIHBhdXNlKSB3aGVuIHRoZSB0YWIgbG9zZXMgZm9jdXMuIFdlIHNraXAgdGhpcyBmb3IgbW9iaWxlXG5cdCAgICAgICBkZXZpY2VzIHRvIGF2b2lkIHdhc3RpbmcgYmF0dGVyeSBwb3dlciBvbiBpbmFjdGl2ZSB0YWJzLiAqL1xuXHQgICAgLyogTm90ZTogVGFiIGZvY3VzIGRldGVjdGlvbiBkb2Vzbid0IHdvcmsgb24gb2xkZXIgdmVyc2lvbnMgb2YgSUUsIGJ1dCB0aGF0J3Mgb2theSBzaW5jZSB0aGV5IGRvbid0IHN1cHBvcnQgckFGIHRvIGJlZ2luIHdpdGguICovXG5cdCAgICBpZiAoIVZlbG9jaXR5LlN0YXRlLmlzTW9iaWxlICYmIGRvY3VtZW50LmhpZGRlbiAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInZpc2liaWxpdHljaGFuZ2VcIiwgZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgIC8qIFJlYXNzaWduIHRoZSByQUYgZnVuY3Rpb24gKHdoaWNoIHRoZSBnbG9iYWwgdGljaygpIGZ1bmN0aW9uIHVzZXMpIGJhc2VkIG9uIHRoZSB0YWIncyBmb2N1cyBzdGF0ZS4gKi9cblx0ICAgICAgICAgICAgaWYgKGRvY3VtZW50LmhpZGRlbikge1xuXHQgICAgICAgICAgICAgICAgdGlja2VyID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0ICAgICAgICAgICAgICAgICAgICAvKiBUaGUgdGljayBmdW5jdGlvbiBuZWVkcyBhIHRydXRoeSBmaXJzdCBhcmd1bWVudCBpbiBvcmRlciB0byBwYXNzIGl0cyBpbnRlcm5hbCB0aW1lc3RhbXAgY2hlY2suICovXG5cdCAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKHRydWUpIH0sIDE2KTtcblx0ICAgICAgICAgICAgICAgIH07XG5cblx0ICAgICAgICAgICAgICAgIC8qIFRoZSByQUYgbG9vcCBoYXMgYmVlbiBwYXVzZWQgYnkgdGhlIGJyb3dzZXIsIHNvIHdlIG1hbnVhbGx5IHJlc3RhcnQgdGhlIHRpY2suICovXG5cdCAgICAgICAgICAgICAgICB0aWNrKCk7XG5cdCAgICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgICAgICB0aWNrZXIgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHJBRlNoaW07XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9KTtcblx0ICAgIH1cblxuXHQgICAgLyoqKioqKioqKioqKlxuXHQgICAgICAgIFRpY2tcblx0ICAgICoqKioqKioqKioqKi9cblxuXHQgICAgLyogTm90ZTogQWxsIGNhbGxzIHRvIFZlbG9jaXR5IGFyZSBwdXNoZWQgdG8gdGhlIFZlbG9jaXR5LlN0YXRlLmNhbGxzIGFycmF5LCB3aGljaCBpcyBmdWxseSBpdGVyYXRlZCB0aHJvdWdoIHVwb24gZWFjaCB0aWNrLiAqL1xuXHQgICAgZnVuY3Rpb24gdGljayAodGltZXN0YW1wKSB7XG5cdCAgICAgICAgLyogQW4gZW1wdHkgdGltZXN0YW1wIGFyZ3VtZW50IGluZGljYXRlcyB0aGF0IHRoaXMgaXMgdGhlIGZpcnN0IHRpY2sgb2NjdXJlbmNlIHNpbmNlIHRpY2tpbmcgd2FzIHR1cm5lZCBvbi5cblx0ICAgICAgICAgICBXZSBsZXZlcmFnZSB0aGlzIG1ldGFkYXRhIHRvIGZ1bGx5IGlnbm9yZSB0aGUgZmlyc3QgdGljayBwYXNzIHNpbmNlIFJBRidzIGluaXRpYWwgcGFzcyBpcyBmaXJlZCB3aGVuZXZlclxuXHQgICAgICAgICAgIHRoZSBicm93c2VyJ3MgbmV4dCB0aWNrIHN5bmMgdGltZSBvY2N1cnMsIHdoaWNoIHJlc3VsdHMgaW4gdGhlIGZpcnN0IGVsZW1lbnRzIHN1YmplY3RlZCB0byBWZWxvY2l0eVxuXHQgICAgICAgICAgIGNhbGxzIGJlaW5nIGFuaW1hdGVkIG91dCBvZiBzeW5jIHdpdGggYW55IGVsZW1lbnRzIGFuaW1hdGVkIGltbWVkaWF0ZWx5IHRoZXJlYWZ0ZXIuIEluIHNob3J0LCB3ZSBpZ25vcmVcblx0ICAgICAgICAgICB0aGUgZmlyc3QgUkFGIHRpY2sgcGFzcyBzbyB0aGF0IGVsZW1lbnRzIGJlaW5nIGltbWVkaWF0ZWx5IGNvbnNlY3V0aXZlbHkgYW5pbWF0ZWQgLS0gaW5zdGVhZCBvZiBzaW11bHRhbmVvdXNseSBhbmltYXRlZFxuXHQgICAgICAgICAgIGJ5IHRoZSBzYW1lIFZlbG9jaXR5IGNhbGwgLS0gYXJlIHByb3Blcmx5IGJhdGNoZWQgaW50byB0aGUgc2FtZSBpbml0aWFsIFJBRiB0aWNrIGFuZCBjb25zZXF1ZW50bHkgcmVtYWluIGluIHN5bmMgdGhlcmVhZnRlci4gKi9cblx0ICAgICAgICBpZiAodGltZXN0YW1wKSB7XG5cdCAgICAgICAgICAgIC8qIFdlIGlnbm9yZSBSQUYncyBoaWdoIHJlc29sdXRpb24gdGltZXN0YW1wIHNpbmNlIGl0IGNhbiBiZSBzaWduaWZpY2FudGx5IG9mZnNldCB3aGVuIHRoZSBicm93c2VyIGlzXG5cdCAgICAgICAgICAgICAgIHVuZGVyIGhpZ2ggc3RyZXNzOyB3ZSBvcHQgZm9yIGNob3BwaW5lc3Mgb3ZlciBhbGxvd2luZyB0aGUgYnJvd3NlciB0byBkcm9wIGh1Z2UgY2h1bmtzIG9mIGZyYW1lcy4gKi9cblx0ICAgICAgICAgICAgdmFyIHRpbWVDdXJyZW50ID0gKG5ldyBEYXRlKS5nZXRUaW1lKCk7XG5cblx0ICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgIENhbGwgSXRlcmF0aW9uXG5cdCAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgIHZhciBjYWxsc0xlbmd0aCA9IFZlbG9jaXR5LlN0YXRlLmNhbGxzLmxlbmd0aDtcblxuXHQgICAgICAgICAgICAvKiBUbyBzcGVlZCB1cCBpdGVyYXRpbmcgb3ZlciB0aGlzIGFycmF5LCBpdCBpcyBjb21wYWN0ZWQgKGZhbHNleSBpdGVtcyAtLSBjYWxscyB0aGF0IGhhdmUgY29tcGxldGVkIC0tIGFyZSByZW1vdmVkKVxuXHQgICAgICAgICAgICAgICB3aGVuIGl0cyBsZW5ndGggaGFzIGJhbGxvb25lZCB0byBhIHBvaW50IHRoYXQgY2FuIGltcGFjdCB0aWNrIHBlcmZvcm1hbmNlLiBUaGlzIG9ubHkgYmVjb21lcyBuZWNlc3Nhcnkgd2hlbiBhbmltYXRpb25cblx0ICAgICAgICAgICAgICAgaGFzIGJlZW4gY29udGludW91cyB3aXRoIG1hbnkgZWxlbWVudHMgb3ZlciBhIGxvbmcgcGVyaW9kIG9mIHRpbWU7IHdoZW5ldmVyIGFsbCBhY3RpdmUgY2FsbHMgYXJlIGNvbXBsZXRlZCwgY29tcGxldGVDYWxsKCkgY2xlYXJzIFZlbG9jaXR5LlN0YXRlLmNhbGxzLiAqL1xuXHQgICAgICAgICAgICBpZiAoY2FsbHNMZW5ndGggPiAxMDAwMCkge1xuXHQgICAgICAgICAgICAgICAgVmVsb2NpdHkuU3RhdGUuY2FsbHMgPSBjb21wYWN0U3BhcnNlQXJyYXkoVmVsb2NpdHkuU3RhdGUuY2FsbHMpO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLyogSXRlcmF0ZSB0aHJvdWdoIGVhY2ggYWN0aXZlIGNhbGwuICovXG5cdCAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbHNMZW5ndGg7IGkrKykge1xuXHQgICAgICAgICAgICAgICAgLyogV2hlbiBhIFZlbG9jaXR5IGNhbGwgaXMgY29tcGxldGVkLCBpdHMgVmVsb2NpdHkuU3RhdGUuY2FsbHMgZW50cnkgaXMgc2V0IHRvIGZhbHNlLiBDb250aW51ZSBvbiB0byB0aGUgbmV4dCBjYWxsLiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKCFWZWxvY2l0eS5TdGF0ZS5jYWxsc1tpXSkge1xuXHQgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICBDYWxsLVdpZGUgVmFyaWFibGVzXG5cdCAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgIHZhciBjYWxsQ29udGFpbmVyID0gVmVsb2NpdHkuU3RhdGUuY2FsbHNbaV0sXG5cdCAgICAgICAgICAgICAgICAgICAgY2FsbCA9IGNhbGxDb250YWluZXJbMF0sXG5cdCAgICAgICAgICAgICAgICAgICAgb3B0cyA9IGNhbGxDb250YWluZXJbMl0sXG5cdCAgICAgICAgICAgICAgICAgICAgdGltZVN0YXJ0ID0gY2FsbENvbnRhaW5lclszXSxcblx0ICAgICAgICAgICAgICAgICAgICBmaXJzdFRpY2sgPSAhIXRpbWVTdGFydCxcblx0ICAgICAgICAgICAgICAgICAgICB0d2VlbkR1bW15VmFsdWUgPSBudWxsO1xuXG5cdCAgICAgICAgICAgICAgICAvKiBJZiB0aW1lU3RhcnQgaXMgdW5kZWZpbmVkLCB0aGVuIHRoaXMgaXMgdGhlIGZpcnN0IHRpbWUgdGhhdCB0aGlzIGNhbGwgaGFzIGJlZW4gcHJvY2Vzc2VkIGJ5IHRpY2soKS5cblx0ICAgICAgICAgICAgICAgICAgIFdlIGFzc2lnbiB0aW1lU3RhcnQgbm93IHNvIHRoYXQgaXRzIHZhbHVlIGlzIGFzIGNsb3NlIHRvIHRoZSByZWFsIGFuaW1hdGlvbiBzdGFydCB0aW1lIGFzIHBvc3NpYmxlLlxuXHQgICAgICAgICAgICAgICAgICAgKENvbnZlcnNlbHksIGhhZCB0aW1lU3RhcnQgYmVlbiBkZWZpbmVkIHdoZW4gdGhpcyBjYWxsIHdhcyBhZGRlZCB0byBWZWxvY2l0eS5TdGF0ZS5jYWxscywgdGhlIGRlbGF5XG5cdCAgICAgICAgICAgICAgICAgICBiZXR3ZWVuIHRoYXQgdGltZSBhbmQgbm93IHdvdWxkIGNhdXNlIHRoZSBmaXJzdCBmZXcgZnJhbWVzIG9mIHRoZSB0d2VlbiB0byBiZSBza2lwcGVkIHNpbmNlXG5cdCAgICAgICAgICAgICAgICAgICBwZXJjZW50Q29tcGxldGUgaXMgY2FsY3VsYXRlZCByZWxhdGl2ZSB0byB0aW1lU3RhcnQuKSAqL1xuXHQgICAgICAgICAgICAgICAgLyogRnVydGhlciwgc3VidHJhY3QgMTZtcyAodGhlIGFwcHJveGltYXRlIHJlc29sdXRpb24gb2YgUkFGKSBmcm9tIHRoZSBjdXJyZW50IHRpbWUgdmFsdWUgc28gdGhhdCB0aGVcblx0ICAgICAgICAgICAgICAgICAgIGZpcnN0IHRpY2sgaXRlcmF0aW9uIGlzbid0IHdhc3RlZCBieSBhbmltYXRpbmcgYXQgMCUgdHdlZW4gY29tcGxldGlvbiwgd2hpY2ggd291bGQgcHJvZHVjZSB0aGVcblx0ICAgICAgICAgICAgICAgICAgIHNhbWUgc3R5bGUgdmFsdWUgYXMgdGhlIGVsZW1lbnQncyBjdXJyZW50IHZhbHVlLiAqL1xuXHQgICAgICAgICAgICAgICAgaWYgKCF0aW1lU3RhcnQpIHtcblx0ICAgICAgICAgICAgICAgICAgICB0aW1lU3RhcnQgPSBWZWxvY2l0eS5TdGF0ZS5jYWxsc1tpXVszXSA9IHRpbWVDdXJyZW50IC0gMTY7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIC8qIFRoZSB0d2VlbidzIGNvbXBsZXRpb24gcGVyY2VudGFnZSBpcyByZWxhdGl2ZSB0byB0aGUgdHdlZW4ncyBzdGFydCB0aW1lLCBub3QgdGhlIHR3ZWVuJ3Mgc3RhcnQgdmFsdWVcblx0ICAgICAgICAgICAgICAgICAgICh3aGljaCB3b3VsZCByZXN1bHQgaW4gdW5wcmVkaWN0YWJsZSB0d2VlbiBkdXJhdGlvbnMgc2luY2UgSmF2YVNjcmlwdCdzIHRpbWVycyBhcmUgbm90IHBhcnRpY3VsYXJseSBhY2N1cmF0ZSkuXG5cdCAgICAgICAgICAgICAgICAgICBBY2NvcmRpbmdseSwgd2UgZW5zdXJlIHRoYXQgcGVyY2VudENvbXBsZXRlIGRvZXMgbm90IGV4Y2VlZCAxLiAqL1xuXHQgICAgICAgICAgICAgICAgdmFyIHBlcmNlbnRDb21wbGV0ZSA9IE1hdGgubWluKCh0aW1lQ3VycmVudCAtIHRpbWVTdGFydCkgLyBvcHRzLmR1cmF0aW9uLCAxKTtcblxuXHQgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgIEVsZW1lbnQgSXRlcmF0aW9uXG5cdCAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAvKiBGb3IgZXZlcnkgY2FsbCwgaXRlcmF0ZSB0aHJvdWdoIGVhY2ggb2YgdGhlIGVsZW1lbnRzIGluIGl0cyBzZXQuICovXG5cdCAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMCwgY2FsbExlbmd0aCA9IGNhbGwubGVuZ3RoOyBqIDwgY2FsbExlbmd0aDsgaisrKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIHR3ZWVuc0NvbnRhaW5lciA9IGNhbGxbal0sXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQgPSB0d2VlbnNDb250YWluZXIuZWxlbWVudDtcblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIENoZWNrIHRvIHNlZSBpZiB0aGlzIGVsZW1lbnQgaGFzIGJlZW4gZGVsZXRlZCBtaWR3YXkgdGhyb3VnaCB0aGUgYW5pbWF0aW9uIGJ5IGNoZWNraW5nIGZvciB0aGVcblx0ICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZWQgZXhpc3RlbmNlIG9mIGl0cyBkYXRhIGNhY2hlLiBJZiBpdCdzIGdvbmUsIHNraXAgYW5pbWF0aW5nIHRoaXMgZWxlbWVudC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoIURhdGEoZWxlbWVudCkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIHRyYW5zZm9ybVByb3BlcnR5RXhpc3RzID0gZmFsc2U7XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgICAgIERpc3BsYXkgJiBWaXNpYmlsaXR5IFRvZ2dsaW5nXG5cdCAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIElmIHRoZSBkaXNwbGF5IG9wdGlvbiBpcyBzZXQgdG8gbm9uLVwibm9uZVwiLCBzZXQgaXQgdXBmcm9udCBzbyB0aGF0IHRoZSBlbGVtZW50IGNhbiBiZWNvbWUgdmlzaWJsZSBiZWZvcmUgdHdlZW5pbmcgYmVnaW5zLlxuXHQgICAgICAgICAgICAgICAgICAgICAgIChPdGhlcndpc2UsIGRpc3BsYXkncyBcIm5vbmVcIiB2YWx1ZSBpcyBzZXQgaW4gY29tcGxldGVDYWxsKCkgb25jZSB0aGUgYW5pbWF0aW9uIGhhcyBjb21wbGV0ZWQuKSAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLmRpc3BsYXkgIT09IHVuZGVmaW5lZCAmJiBvcHRzLmRpc3BsYXkgIT09IG51bGwgJiYgb3B0cy5kaXNwbGF5ICE9PSBcIm5vbmVcIikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3B0cy5kaXNwbGF5ID09PSBcImZsZXhcIikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZsZXhWYWx1ZXMgPSBbIFwiLXdlYmtpdC1ib3hcIiwgXCItbW96LWJveFwiLCBcIi1tcy1mbGV4Ym94XCIsIFwiLXdlYmtpdC1mbGV4XCIgXTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGZsZXhWYWx1ZXMsIGZ1bmN0aW9uKGksIGZsZXhWYWx1ZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIENTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwiZGlzcGxheVwiLCBmbGV4VmFsdWUpO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICBDU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImRpc3BsYXlcIiwgb3B0cy5kaXNwbGF5KTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBTYW1lIGdvZXMgd2l0aCB0aGUgdmlzaWJpbGl0eSBvcHRpb24sIGJ1dCBpdHMgXCJub25lXCIgZXF1aXZhbGVudCBpcyBcImhpZGRlblwiLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLnZpc2liaWxpdHkgIT09IHVuZGVmaW5lZCAmJiBvcHRzLnZpc2liaWxpdHkgIT09IFwiaGlkZGVuXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgQ1NTLnNldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgXCJ2aXNpYmlsaXR5XCIsIG9wdHMudmlzaWJpbGl0eSk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICAgICAgICAgIFByb3BlcnR5IEl0ZXJhdGlvblxuXHQgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIEZvciBldmVyeSBlbGVtZW50LCBpdGVyYXRlIHRocm91Z2ggZWFjaCBwcm9wZXJ0eS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBwcm9wZXJ0eSBpbiB0d2VlbnNDb250YWluZXIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogSW4gYWRkaXRpb24gdG8gcHJvcGVydHkgdHdlZW4gZGF0YSwgdHdlZW5zQ29udGFpbmVyIGNvbnRhaW5zIGEgcmVmZXJlbmNlIHRvIGl0cyBhc3NvY2lhdGVkIGVsZW1lbnQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eSAhPT0gXCJlbGVtZW50XCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0d2VlbiA9IHR3ZWVuc0NvbnRhaW5lcltwcm9wZXJ0eV0sXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFZhbHVlLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEVhc2luZyBjYW4gZWl0aGVyIGJlIGEgcHJlLWdlbmVyZWF0ZWQgZnVuY3Rpb24gb3IgYSBzdHJpbmcgdGhhdCByZWZlcmVuY2VzIGEgcHJlLXJlZ2lzdGVyZWQgZWFzaW5nXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb24gdGhlIFZlbG9jaXR5LkVhc2luZ3Mgb2JqZWN0LiBJbiBlaXRoZXIgY2FzZSwgcmV0dXJuIHRoZSBhcHByb3ByaWF0ZSBlYXNpbmcgKmZ1bmN0aW9uKi4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlYXNpbmcgPSBUeXBlLmlzU3RyaW5nKHR3ZWVuLmVhc2luZykgPyBWZWxvY2l0eS5FYXNpbmdzW3R3ZWVuLmVhc2luZ10gOiB0d2Vlbi5lYXNpbmc7XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEN1cnJlbnQgVmFsdWUgQ2FsY3VsYXRpb25cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgdGhpcyBpcyB0aGUgbGFzdCB0aWNrIHBhc3MgKGlmIHdlJ3ZlIHJlYWNoZWQgMTAwJSBjb21wbGV0aW9uIGZvciB0aGlzIHR3ZWVuKSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuc3VyZSB0aGF0IGN1cnJlbnRWYWx1ZSBpcyBleHBsaWNpdGx5IHNldCB0byBpdHMgdGFyZ2V0IGVuZFZhbHVlIHNvIHRoYXQgaXQncyBub3Qgc3ViamVjdGVkIHRvIGFueSByb3VuZGluZy4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwZXJjZW50Q29tcGxldGUgPT09IDEpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50VmFsdWUgPSB0d2Vlbi5lbmRWYWx1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIE90aGVyd2lzZSwgY2FsY3VsYXRlIGN1cnJlbnRWYWx1ZSBiYXNlZCBvbiB0aGUgY3VycmVudCBkZWx0YSBmcm9tIHN0YXJ0VmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0d2VlbkRlbHRhID0gdHdlZW4uZW5kVmFsdWUgLSB0d2Vlbi5zdGFydFZhbHVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWYWx1ZSA9IHR3ZWVuLnN0YXJ0VmFsdWUgKyAodHdlZW5EZWx0YSAqIGVhc2luZyhwZXJjZW50Q29tcGxldGUsIG9wdHMsIHR3ZWVuRGVsdGEpKTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIElmIG5vIHZhbHVlIGNoYW5nZSBpcyBvY2N1cnJpbmcsIGRvbid0IHByb2NlZWQgd2l0aCBET00gdXBkYXRpbmcuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFmaXJzdFRpY2sgJiYgKGN1cnJlbnRWYWx1ZSA9PT0gdHdlZW4uY3VycmVudFZhbHVlKSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuLmN1cnJlbnRWYWx1ZSA9IGN1cnJlbnRWYWx1ZTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogSWYgd2UncmUgdHdlZW5pbmcgYSBmYWtlICd0d2VlbicgcHJvcGVydHkgaW4gb3JkZXIgdG8gbG9nIHRyYW5zaXRpb24gdmFsdWVzLCB1cGRhdGUgdGhlIG9uZS1wZXItY2FsbCB2YXJpYWJsZSBzbyB0aGF0XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdCBjYW4gYmUgcGFzc2VkIGludG8gdGhlIHByb2dyZXNzIGNhbGxiYWNrLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5ID09PSBcInR3ZWVuXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0d2VlbkR1bW15VmFsdWUgPSBjdXJyZW50VmFsdWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBIb29rczogUGFydCBJXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRm9yIGhvb2tlZCBwcm9wZXJ0aWVzLCB0aGUgbmV3bHktdXBkYXRlZCByb290UHJvcGVydHlWYWx1ZUNhY2hlIGlzIGNhY2hlZCBvbnRvIHRoZSBlbGVtZW50IHNvIHRoYXQgaXQgY2FuIGJlIHVzZWRcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3Igc3Vic2VxdWVudCBob29rcyBpbiB0aGlzIGNhbGwgdGhhdCBhcmUgYXNzb2NpYXRlZCB3aXRoIHRoZSBzYW1lIHJvb3QgcHJvcGVydHkuIElmIHdlIGRpZG4ndCBjYWNoZSB0aGUgdXBkYXRlZFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb3RQcm9wZXJ0eVZhbHVlLCBlYWNoIHN1YnNlcXVlbnQgdXBkYXRlIHRvIHRoZSByb290IHByb3BlcnR5IGluIHRoaXMgdGljayBwYXNzIHdvdWxkIHJlc2V0IHRoZSBwcmV2aW91cyBob29rJ3Ncblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cGRhdGVzIHRvIHJvb3RQcm9wZXJ0eVZhbHVlIHByaW9yIHRvIGluamVjdGlvbi4gQSBuaWNlIHBlcmZvcm1hbmNlIGJ5cHJvZHVjdCBvZiByb290UHJvcGVydHlWYWx1ZSBjYWNoaW5nIGlzIHRoYXRcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJzZXF1ZW50bHkgY2hhaW5lZCBhbmltYXRpb25zIHVzaW5nIHRoZSBzYW1lIGhvb2tSb290IGJ1dCBhIGRpZmZlcmVudCBob29rIGNhbiB1c2UgdGhpcyBjYWNoZWQgcm9vdFByb3BlcnR5VmFsdWUuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENTUy5Ib29rcy5yZWdpc3RlcmVkW3Byb3BlcnR5XSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaG9va1Jvb3QgPSBDU1MuSG9va3MuZ2V0Um9vdChwcm9wZXJ0eSksXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByb290UHJvcGVydHlWYWx1ZUNhY2hlID0gRGF0YShlbGVtZW50KS5yb290UHJvcGVydHlWYWx1ZUNhY2hlW2hvb2tSb290XTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocm9vdFByb3BlcnR5VmFsdWVDYWNoZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW4ucm9vdFByb3BlcnR5VmFsdWUgPSByb290UHJvcGVydHlWYWx1ZUNhY2hlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERPTSBVcGRhdGVcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIHNldFByb3BlcnR5VmFsdWUoKSByZXR1cm5zIGFuIGFycmF5IG9mIHRoZSBwcm9wZXJ0eSBuYW1lIGFuZCBwcm9wZXJ0eSB2YWx1ZSBwb3N0IGFueSBub3JtYWxpemF0aW9uIHRoYXQgbWF5IGhhdmUgYmVlbiBwZXJmb3JtZWQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogTm90ZTogVG8gc29sdmUgYW4gSUU8PTggcG9zaXRpb25pbmcgYnVnLCB0aGUgdW5pdCB0eXBlIGlzIGRyb3BwZWQgd2hlbiBzZXR0aW5nIGEgcHJvcGVydHkgdmFsdWUgb2YgMC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWRqdXN0ZWRTZXREYXRhID0gQ1NTLnNldFByb3BlcnR5VmFsdWUoZWxlbWVudCwgLyogU0VUICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5LFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0d2Vlbi5jdXJyZW50VmFsdWUgKyAocGFyc2VGbG9hdChjdXJyZW50VmFsdWUpID09PSAwID8gXCJcIiA6IHR3ZWVuLnVuaXRUeXBlKSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW4ucm9vdFByb3BlcnR5VmFsdWUsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuLnNjcm9sbERhdGEpO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBIb29rczogUGFydCBJSVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBOb3cgdGhhdCB3ZSBoYXZlIHRoZSBob29rJ3MgdXBkYXRlZCByb290UHJvcGVydHlWYWx1ZSAodGhlIHBvc3QtcHJvY2Vzc2VkIHZhbHVlIHByb3ZpZGVkIGJ5IGFkanVzdGVkU2V0RGF0YSksIGNhY2hlIGl0IG9udG8gdGhlIGVsZW1lbnQuICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENTUy5Ib29rcy5yZWdpc3RlcmVkW3Byb3BlcnR5XSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKiBTaW5jZSBhZGp1c3RlZFNldERhdGEgY29udGFpbnMgbm9ybWFsaXplZCBkYXRhIHJlYWR5IGZvciBET00gdXBkYXRpbmcsIHRoZSByb290UHJvcGVydHlWYWx1ZSBuZWVkcyB0byBiZSByZS1leHRyYWN0ZWQgZnJvbSBpdHMgbm9ybWFsaXplZCBmb3JtLiA/PyAqL1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbaG9va1Jvb3RdKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEYXRhKGVsZW1lbnQpLnJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGVbaG9va1Jvb3RdID0gQ1NTLk5vcm1hbGl6YXRpb25zLnJlZ2lzdGVyZWRbaG9va1Jvb3RdKFwiZXh0cmFjdFwiLCBudWxsLCBhZGp1c3RlZFNldERhdGFbMV0pO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRGF0YShlbGVtZW50KS5yb290UHJvcGVydHlWYWx1ZUNhY2hlW2hvb2tSb290XSA9IGFkanVzdGVkU2V0RGF0YVsxXTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUcmFuc2Zvcm1zXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLyogRmxhZyB3aGV0aGVyIGEgdHJhbnNmb3JtIHByb3BlcnR5IGlzIGJlaW5nIGFuaW1hdGVkIHNvIHRoYXQgZmx1c2hUcmFuc2Zvcm1DYWNoZSgpIGNhbiBiZSB0cmlnZ2VyZWQgb25jZSB0aGlzIHRpY2sgcGFzcyBpcyBjb21wbGV0ZS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWRqdXN0ZWRTZXREYXRhWzBdID09PSBcInRyYW5zZm9ybVwiKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybVByb3BlcnR5RXhpc3RzID0gdHJ1ZTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIG1vYmlsZUhBXG5cdCAgICAgICAgICAgICAgICAgICAgKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAgICAgICAgIC8qIElmIG1vYmlsZUhBIGlzIGVuYWJsZWQsIHNldCB0aGUgdHJhbnNsYXRlM2QgdHJhbnNmb3JtIHRvIG51bGwgdG8gZm9yY2UgaGFyZHdhcmUgYWNjZWxlcmF0aW9uLlxuXHQgICAgICAgICAgICAgICAgICAgICAgIEl0J3Mgc2FmZSB0byBvdmVycmlkZSB0aGlzIHByb3BlcnR5IHNpbmNlIFZlbG9jaXR5IGRvZXNuJ3QgYWN0dWFsbHkgc3VwcG9ydCBpdHMgYW5pbWF0aW9uIChob29rcyBhcmUgdXNlZCBpbiBpdHMgcGxhY2UpLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLm1vYmlsZUhBKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIC8qIERvbid0IHNldCB0aGUgbnVsbCB0cmFuc2Zvcm0gaGFjayBpZiB3ZSd2ZSBhbHJlYWR5IGRvbmUgc28uICovXG5cdCAgICAgICAgICAgICAgICAgICAgICAgIGlmIChEYXRhKGVsZW1lbnQpLnRyYW5zZm9ybUNhY2hlLnRyYW5zbGF0ZTNkID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qIEFsbCBlbnRyaWVzIG9uIHRoZSB0cmFuc2Zvcm1DYWNoZSBvYmplY3QgYXJlIGxhdGVyIGNvbmNhdGVuYXRlZCBpbnRvIGEgc2luZ2xlIHRyYW5zZm9ybSBzdHJpbmcgdmlhIGZsdXNoVHJhbnNmb3JtQ2FjaGUoKS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkudHJhbnNmb3JtQ2FjaGUudHJhbnNsYXRlM2QgPSBcIigwcHgsIDBweCwgMHB4KVwiO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1Qcm9wZXJ0eUV4aXN0cyA9IHRydWU7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICBpZiAodHJhbnNmb3JtUHJvcGVydHlFeGlzdHMpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgQ1NTLmZsdXNoVHJhbnNmb3JtQ2FjaGUoZWxlbWVudCk7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAvKiBUaGUgbm9uLVwibm9uZVwiIGRpc3BsYXkgdmFsdWUgaXMgb25seSBhcHBsaWVkIHRvIGFuIGVsZW1lbnQgb25jZSAtLSB3aGVuIGl0cyBhc3NvY2lhdGVkIGNhbGwgaXMgZmlyc3QgdGlja2VkIHRocm91Z2guXG5cdCAgICAgICAgICAgICAgICAgICBBY2NvcmRpbmdseSwgaXQncyBzZXQgdG8gZmFsc2Ugc28gdGhhdCBpdCBpc24ndCByZS1wcm9jZXNzZWQgYnkgdGhpcyBjYWxsIGluIHRoZSBuZXh0IHRpY2suICovXG5cdCAgICAgICAgICAgICAgICBpZiAob3B0cy5kaXNwbGF5ICE9PSB1bmRlZmluZWQgJiYgb3B0cy5kaXNwbGF5ICE9PSBcIm5vbmVcIikge1xuXHQgICAgICAgICAgICAgICAgICAgIFZlbG9jaXR5LlN0YXRlLmNhbGxzW2ldWzJdLmRpc3BsYXkgPSBmYWxzZTtcblx0ICAgICAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgICAgIGlmIChvcHRzLnZpc2liaWxpdHkgIT09IHVuZGVmaW5lZCAmJiBvcHRzLnZpc2liaWxpdHkgIT09IFwiaGlkZGVuXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICBWZWxvY2l0eS5TdGF0ZS5jYWxsc1tpXVsyXS52aXNpYmlsaXR5ID0gZmFsc2U7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIC8qIFBhc3MgdGhlIGVsZW1lbnRzIGFuZCB0aGUgdGltaW5nIGRhdGEgKHBlcmNlbnRDb21wbGV0ZSwgbXNSZW1haW5pbmcsIHRpbWVTdGFydCwgdHdlZW5EdW1teVZhbHVlKSBpbnRvIHRoZSBwcm9ncmVzcyBjYWxsYmFjay4gKi9cblx0ICAgICAgICAgICAgICAgIGlmIChvcHRzLnByb2dyZXNzKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgb3B0cy5wcm9ncmVzcy5jYWxsKGNhbGxDb250YWluZXJbMV0sXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxDb250YWluZXJbMV0sXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBlcmNlbnRDb21wbGV0ZSxcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5tYXgoMCwgKHRpbWVTdGFydCArIG9wdHMuZHVyYXRpb24pIC0gdGltZUN1cnJlbnQpLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aW1lU3RhcnQsXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuRHVtbXlWYWx1ZSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgIC8qIElmIHRoaXMgY2FsbCBoYXMgZmluaXNoZWQgdHdlZW5pbmcsIHBhc3MgaXRzIGluZGV4IHRvIGNvbXBsZXRlQ2FsbCgpIHRvIGhhbmRsZSBjYWxsIGNsZWFudXAuICovXG5cdCAgICAgICAgICAgICAgICBpZiAocGVyY2VudENvbXBsZXRlID09PSAxKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgY29tcGxldGVDYWxsKGkpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLyogTm90ZTogY29tcGxldGVDYWxsKCkgc2V0cyB0aGUgaXNUaWNraW5nIGZsYWcgdG8gZmFsc2Ugd2hlbiB0aGUgbGFzdCBjYWxsIG9uIFZlbG9jaXR5LlN0YXRlLmNhbGxzIGhhcyBjb21wbGV0ZWQuICovXG5cdCAgICAgICAgaWYgKFZlbG9jaXR5LlN0YXRlLmlzVGlja2luZykge1xuXHQgICAgICAgICAgICB0aWNrZXIodGljayk7XG5cdCAgICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICAvKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgIENhbGwgQ29tcGxldGlvblxuXHQgICAgKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgLyogTm90ZTogVW5saWtlIHRpY2soKSwgd2hpY2ggcHJvY2Vzc2VzIGFsbCBhY3RpdmUgY2FsbHMgYXQgb25jZSwgY2FsbCBjb21wbGV0aW9uIGlzIGhhbmRsZWQgb24gYSBwZXItY2FsbCBiYXNpcy4gKi9cblx0ICAgIGZ1bmN0aW9uIGNvbXBsZXRlQ2FsbCAoY2FsbEluZGV4LCBpc1N0b3BwZWQpIHtcblx0ICAgICAgICAvKiBFbnN1cmUgdGhlIGNhbGwgZXhpc3RzLiAqL1xuXHQgICAgICAgIGlmICghVmVsb2NpdHkuU3RhdGUuY2FsbHNbY2FsbEluZGV4XSkge1xuXHQgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLyogUHVsbCB0aGUgbWV0YWRhdGEgZnJvbSB0aGUgY2FsbC4gKi9cblx0ICAgICAgICB2YXIgY2FsbCA9IFZlbG9jaXR5LlN0YXRlLmNhbGxzW2NhbGxJbmRleF1bMF0sXG5cdCAgICAgICAgICAgIGVsZW1lbnRzID0gVmVsb2NpdHkuU3RhdGUuY2FsbHNbY2FsbEluZGV4XVsxXSxcblx0ICAgICAgICAgICAgb3B0cyA9IFZlbG9jaXR5LlN0YXRlLmNhbGxzW2NhbGxJbmRleF1bMl0sXG5cdCAgICAgICAgICAgIHJlc29sdmVyID0gVmVsb2NpdHkuU3RhdGUuY2FsbHNbY2FsbEluZGV4XVs0XTtcblxuXHQgICAgICAgIHZhciByZW1haW5pbmdDYWxsc0V4aXN0ID0gZmFsc2U7XG5cblx0ICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgIEVsZW1lbnQgRmluYWxpemF0aW9uXG5cdCAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgIGZvciAodmFyIGkgPSAwLCBjYWxsTGVuZ3RoID0gY2FsbC5sZW5ndGg7IGkgPCBjYWxsTGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSBjYWxsW2ldLmVsZW1lbnQ7XG5cblx0ICAgICAgICAgICAgLyogSWYgdGhlIHVzZXIgc2V0IGRpc3BsYXkgdG8gXCJub25lXCIgKGludGVuZGluZyB0byBoaWRlIHRoZSBlbGVtZW50KSwgc2V0IGl0IG5vdyB0aGF0IHRoZSBhbmltYXRpb24gaGFzIGNvbXBsZXRlZC4gKi9cblx0ICAgICAgICAgICAgLyogTm90ZTogZGlzcGxheTpub25lIGlzbid0IHNldCB3aGVuIGNhbGxzIGFyZSBtYW51YWxseSBzdG9wcGVkICh2aWEgVmVsb2NpdHkoXCJzdG9wXCIpLiAqL1xuXHQgICAgICAgICAgICAvKiBOb3RlOiBEaXNwbGF5IGdldHMgaWdub3JlZCB3aXRoIFwicmV2ZXJzZVwiIGNhbGxzIGFuZCBpbmZpbml0ZSBsb29wcywgc2luY2UgdGhpcyBiZWhhdmlvciB3b3VsZCBiZSB1bmRlc2lyYWJsZS4gKi9cblx0ICAgICAgICAgICAgaWYgKCFpc1N0b3BwZWQgJiYgIW9wdHMubG9vcCkge1xuXHQgICAgICAgICAgICAgICAgaWYgKG9wdHMuZGlzcGxheSA9PT0gXCJub25lXCIpIHtcblx0ICAgICAgICAgICAgICAgICAgICBDU1Muc2V0UHJvcGVydHlWYWx1ZShlbGVtZW50LCBcImRpc3BsYXlcIiwgb3B0cy5kaXNwbGF5KTtcblx0ICAgICAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAgICAgaWYgKG9wdHMudmlzaWJpbGl0eSA9PT0gXCJoaWRkZW5cIikge1xuXHQgICAgICAgICAgICAgICAgICAgIENTUy5zZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIFwidmlzaWJpbGl0eVwiLCBvcHRzLnZpc2liaWxpdHkpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLyogSWYgdGhlIGVsZW1lbnQncyBxdWV1ZSBpcyBlbXB0eSAoaWYgb25seSB0aGUgXCJpbnByb2dyZXNzXCIgaXRlbSBpcyBsZWZ0IGF0IHBvc2l0aW9uIDApIG9yIGlmIGl0cyBxdWV1ZSBpcyBhYm91dCB0byBydW5cblx0ICAgICAgICAgICAgICAgYSBub24tVmVsb2NpdHktaW5pdGlhdGVkIGVudHJ5LCB0dXJuIG9mZiB0aGUgaXNBbmltYXRpbmcgZmxhZy4gQSBub24tVmVsb2NpdHktaW5pdGlhdGllZCBxdWV1ZSBlbnRyeSdzIGxvZ2ljIG1pZ2h0IGFsdGVyXG5cdCAgICAgICAgICAgICAgIGFuIGVsZW1lbnQncyBDU1MgdmFsdWVzIGFuZCB0aGVyZWJ5IGNhdXNlIFZlbG9jaXR5J3MgY2FjaGVkIHZhbHVlIGRhdGEgdG8gZ28gc3RhbGUuIFRvIGRldGVjdCBpZiBhIHF1ZXVlIGVudHJ5IHdhcyBpbml0aWF0ZWQgYnkgVmVsb2NpdHksXG5cdCAgICAgICAgICAgICAgIHdlIGNoZWNrIGZvciB0aGUgZXhpc3RlbmNlIG9mIG91ciBzcGVjaWFsIFZlbG9jaXR5LnF1ZXVlRW50cnlGbGFnIGRlY2xhcmF0aW9uLCB3aGljaCBtaW5pZmllcnMgd29uJ3QgcmVuYW1lIHNpbmNlIHRoZSBmbGFnXG5cdCAgICAgICAgICAgICAgIGlzIGFzc2lnbmVkIHRvIGpRdWVyeSdzIGdsb2JhbCAkIG9iamVjdCBhbmQgdGh1cyBleGlzdHMgb3V0IG9mIFZlbG9jaXR5J3Mgb3duIHNjb3BlLiAqL1xuXHQgICAgICAgICAgICBpZiAob3B0cy5sb29wICE9PSB0cnVlICYmICgkLnF1ZXVlKGVsZW1lbnQpWzFdID09PSB1bmRlZmluZWQgfHwgIS9cXC52ZWxvY2l0eVF1ZXVlRW50cnlGbGFnL2kudGVzdCgkLnF1ZXVlKGVsZW1lbnQpWzFdKSkpIHtcblx0ICAgICAgICAgICAgICAgIC8qIFRoZSBlbGVtZW50IG1heSBoYXZlIGJlZW4gZGVsZXRlZC4gRW5zdXJlIHRoYXQgaXRzIGRhdGEgY2FjaGUgc3RpbGwgZXhpc3RzIGJlZm9yZSBhY3Rpbmcgb24gaXQuICovXG5cdCAgICAgICAgICAgICAgICBpZiAoRGF0YShlbGVtZW50KSkge1xuXHQgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkuaXNBbmltYXRpbmcgPSBmYWxzZTtcblx0ICAgICAgICAgICAgICAgICAgICAvKiBDbGVhciB0aGUgZWxlbWVudCdzIHJvb3RQcm9wZXJ0eVZhbHVlQ2FjaGUsIHdoaWNoIHdpbGwgYmVjb21lIHN0YWxlLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIERhdGEoZWxlbWVudCkucm9vdFByb3BlcnR5VmFsdWVDYWNoZSA9IHt9O1xuXG5cdCAgICAgICAgICAgICAgICAgICAgdmFyIHRyYW5zZm9ybUhBUHJvcGVydHlFeGlzdHMgPSBmYWxzZTtcblx0ICAgICAgICAgICAgICAgICAgICAvKiBJZiBhbnkgM0QgdHJhbnNmb3JtIHN1YnByb3BlcnR5IGlzIGF0IGl0cyBkZWZhdWx0IHZhbHVlIChyZWdhcmRsZXNzIG9mIHVuaXQgdHlwZSksIHJlbW92ZSBpdC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICAkLmVhY2goQ1NTLkxpc3RzLnRyYW5zZm9ybXMzRCwgZnVuY3Rpb24oaSwgdHJhbnNmb3JtTmFtZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZGVmYXVsdFZhbHVlID0gL15zY2FsZS8udGVzdCh0cmFuc2Zvcm1OYW1lKSA/IDEgOiAwLFxuXHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFZhbHVlID0gRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZVt0cmFuc2Zvcm1OYW1lXTtcblxuXHQgICAgICAgICAgICAgICAgICAgICAgICBpZiAoRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZVt0cmFuc2Zvcm1OYW1lXSAhPT0gdW5kZWZpbmVkICYmIG5ldyBSZWdFeHAoXCJeXFxcXChcIiArIGRlZmF1bHRWYWx1ZSArIFwiW14uXVwiKS50ZXN0KGN1cnJlbnRWYWx1ZSkpIHtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybUhBUHJvcGVydHlFeGlzdHMgPSB0cnVlO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZVt0cmFuc2Zvcm1OYW1lXTtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgICAgIH0pO1xuXG5cdCAgICAgICAgICAgICAgICAgICAgLyogTW9iaWxlIGRldmljZXMgaGF2ZSBoYXJkd2FyZSBhY2NlbGVyYXRpb24gcmVtb3ZlZCBhdCB0aGUgZW5kIG9mIHRoZSBhbmltYXRpb24gaW4gb3JkZXIgdG8gYXZvaWQgaG9nZ2luZyB0aGUgR1BVJ3MgbWVtb3J5LiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIGlmIChvcHRzLm1vYmlsZUhBKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybUhBUHJvcGVydHlFeGlzdHMgPSB0cnVlO1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgRGF0YShlbGVtZW50KS50cmFuc2Zvcm1DYWNoZS50cmFuc2xhdGUzZDtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBGbHVzaCB0aGUgc3VicHJvcGVydHkgcmVtb3ZhbHMgdG8gdGhlIERPTS4gKi9cblx0ICAgICAgICAgICAgICAgICAgICBpZiAodHJhbnNmb3JtSEFQcm9wZXJ0eUV4aXN0cykge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBDU1MuZmx1c2hUcmFuc2Zvcm1DYWNoZShlbGVtZW50KTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBSZW1vdmUgdGhlIFwidmVsb2NpdHktYW5pbWF0aW5nXCIgaW5kaWNhdG9yIGNsYXNzLiAqL1xuXHQgICAgICAgICAgICAgICAgICAgIENTUy5WYWx1ZXMucmVtb3ZlQ2xhc3MoZWxlbWVudCwgXCJ2ZWxvY2l0eS1hbmltYXRpbmdcIik7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgIE9wdGlvbjogQ29tcGxldGVcblx0ICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqL1xuXG5cdCAgICAgICAgICAgIC8qIENvbXBsZXRlIGlzIGZpcmVkIG9uY2UgcGVyIGNhbGwgKG5vdCBvbmNlIHBlciBlbGVtZW50KSBhbmQgaXMgcGFzc2VkIHRoZSBmdWxsIHJhdyBET00gZWxlbWVudCBzZXQgYXMgYm90aCBpdHMgY29udGV4dCBhbmQgaXRzIGZpcnN0IGFyZ3VtZW50LiAqL1xuXHQgICAgICAgICAgICAvKiBOb3RlOiBDYWxsYmFja3MgYXJlbid0IGZpcmVkIHdoZW4gY2FsbHMgYXJlIG1hbnVhbGx5IHN0b3BwZWQgKHZpYSBWZWxvY2l0eShcInN0b3BcIikuICovXG5cdCAgICAgICAgICAgIGlmICghaXNTdG9wcGVkICYmIG9wdHMuY29tcGxldGUgJiYgIW9wdHMubG9vcCAmJiAoaSA9PT0gY2FsbExlbmd0aCAtIDEpKSB7XG5cdCAgICAgICAgICAgICAgICAvKiBXZSB0aHJvdyBjYWxsYmFja3MgaW4gYSBzZXRUaW1lb3V0IHNvIHRoYXQgdGhyb3duIGVycm9ycyBkb24ndCBoYWx0IHRoZSBleGVjdXRpb24gb2YgVmVsb2NpdHkgaXRzZWxmLiAqL1xuXHQgICAgICAgICAgICAgICAgdHJ5IHtcblx0ICAgICAgICAgICAgICAgICAgICBvcHRzLmNvbXBsZXRlLmNhbGwoZWxlbWVudHMsIGVsZW1lbnRzKTtcblx0ICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgdGhyb3cgZXJyb3I7IH0sIDEpO1xuXHQgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLyoqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgICAgICAgICAgUHJvbWlzZSBSZXNvbHZpbmdcblx0ICAgICAgICAgICAgKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAvKiBOb3RlOiBJbmZpbml0ZSBsb29wcyBkb24ndCByZXR1cm4gcHJvbWlzZXMuICovXG5cdCAgICAgICAgICAgIGlmIChyZXNvbHZlciAmJiBvcHRzLmxvb3AgIT09IHRydWUpIHtcblx0ICAgICAgICAgICAgICAgIHJlc29sdmVyKGVsZW1lbnRzKTtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgICAgIE9wdGlvbjogTG9vcCAoSW5maW5pdGUpXG5cdCAgICAgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgICAgICAgICAgaWYgKERhdGEoZWxlbWVudCkgJiYgb3B0cy5sb29wID09PSB0cnVlICYmICFpc1N0b3BwZWQpIHtcblx0ICAgICAgICAgICAgICAgIC8qIElmIGEgcm90YXRlWC9ZL1ogcHJvcGVydHkgaXMgYmVpbmcgYW5pbWF0ZWQgdG8gMzYwIGRlZyB3aXRoIGxvb3A6dHJ1ZSwgc3dhcCB0d2VlbiBzdGFydC9lbmQgdmFsdWVzIHRvIGVuYWJsZVxuXHQgICAgICAgICAgICAgICAgICAgY29udGludW91cyBpdGVyYXRpdmUgcm90YXRpb24gbG9vcGluZy4gKE90aGVyaXNlLCB0aGUgZWxlbWVudCB3b3VsZCBqdXN0IHJvdGF0ZSBiYWNrIGFuZCBmb3J0aC4pICovXG5cdCAgICAgICAgICAgICAgICAkLmVhY2goRGF0YShlbGVtZW50KS50d2VlbnNDb250YWluZXIsIGZ1bmN0aW9uKHByb3BlcnR5TmFtZSwgdHdlZW5Db250YWluZXIpIHtcblx0ICAgICAgICAgICAgICAgICAgICBpZiAoL15yb3RhdGUvLnRlc3QocHJvcGVydHlOYW1lKSAmJiBwYXJzZUZsb2F0KHR3ZWVuQ29udGFpbmVyLmVuZFZhbHVlKSA9PT0gMzYwKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuQ29udGFpbmVyLmVuZFZhbHVlID0gMDtcblx0ICAgICAgICAgICAgICAgICAgICAgICAgdHdlZW5Db250YWluZXIuc3RhcnRWYWx1ZSA9IDM2MDtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICBpZiAoL15iYWNrZ3JvdW5kUG9zaXRpb24vLnRlc3QocHJvcGVydHlOYW1lKSAmJiBwYXJzZUZsb2F0KHR3ZWVuQ29udGFpbmVyLmVuZFZhbHVlKSA9PT0gMTAwICYmIHR3ZWVuQ29udGFpbmVyLnVuaXRUeXBlID09PSBcIiVcIikge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICB0d2VlbkNvbnRhaW5lci5lbmRWYWx1ZSA9IDA7XG5cdCAgICAgICAgICAgICAgICAgICAgICAgIHR3ZWVuQ29udGFpbmVyLnN0YXJ0VmFsdWUgPSAxMDA7XG5cdCAgICAgICAgICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICAgICAgfSk7XG5cblx0ICAgICAgICAgICAgICAgIFZlbG9jaXR5KGVsZW1lbnQsIFwicmV2ZXJzZVwiLCB7IGxvb3A6IHRydWUsIGRlbGF5OiBvcHRzLmRlbGF5IH0pO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgLyoqKioqKioqKioqKioqKlxuXHQgICAgICAgICAgICAgICBEZXF1ZXVlaW5nXG5cdCAgICAgICAgICAgICoqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgICAgICAvKiBGaXJlIHRoZSBuZXh0IGNhbGwgaW4gdGhlIHF1ZXVlIHNvIGxvbmcgYXMgdGhpcyBjYWxsJ3MgcXVldWUgd2Fzbid0IHNldCB0byBmYWxzZSAodG8gdHJpZ2dlciBhIHBhcmFsbGVsIGFuaW1hdGlvbiksXG5cdCAgICAgICAgICAgICAgIHdoaWNoIHdvdWxkIGhhdmUgYWxyZWFkeSBjYXVzZWQgdGhlIG5leHQgY2FsbCB0byBmaXJlLiBOb3RlOiBFdmVuIGlmIHRoZSBlbmQgb2YgdGhlIGFuaW1hdGlvbiBxdWV1ZSBoYXMgYmVlbiByZWFjaGVkLFxuXHQgICAgICAgICAgICAgICAkLmRlcXVldWUoKSBtdXN0IHN0aWxsIGJlIGNhbGxlZCBpbiBvcmRlciB0byBjb21wbGV0ZWx5IGNsZWFyIGpRdWVyeSdzIGFuaW1hdGlvbiBxdWV1ZS4gKi9cblx0ICAgICAgICAgICAgaWYgKG9wdHMucXVldWUgIT09IGZhbHNlKSB7XG5cdCAgICAgICAgICAgICAgICAkLmRlcXVldWUoZWxlbWVudCwgb3B0cy5xdWV1ZSk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICAvKioqKioqKioqKioqKioqKioqKioqKioqXG5cdCAgICAgICAgICAgQ2FsbHMgQXJyYXkgQ2xlYW51cFxuXHQgICAgICAgICoqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgICAgIC8qIFNpbmNlIHRoaXMgY2FsbCBpcyBjb21wbGV0ZSwgc2V0IGl0IHRvIGZhbHNlIHNvIHRoYXQgdGhlIHJBRiB0aWNrIHNraXBzIGl0LiBUaGlzIGFycmF5IGlzIGxhdGVyIGNvbXBhY3RlZCB2aWEgY29tcGFjdFNwYXJzZUFycmF5KCkuXG5cdCAgICAgICAgICAoRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMsIHRoZSBjYWxsIGlzIHNldCB0byBmYWxzZSBpbnN0ZWFkIG9mIGJlaW5nIGRlbGV0ZWQgZnJvbSB0aGUgYXJyYXk6IGh0dHA6Ly93d3cuaHRtbDVyb2Nrcy5jb20vZW4vdHV0b3JpYWxzL3NwZWVkL3Y4LykgKi9cblx0ICAgICAgICBWZWxvY2l0eS5TdGF0ZS5jYWxsc1tjYWxsSW5kZXhdID0gZmFsc2U7XG5cblx0ICAgICAgICAvKiBJdGVyYXRlIHRocm91Z2ggdGhlIGNhbGxzIGFycmF5IHRvIGRldGVybWluZSBpZiB0aGlzIHdhcyB0aGUgZmluYWwgaW4tcHJvZ3Jlc3MgYW5pbWF0aW9uLlxuXHQgICAgICAgICAgIElmIHNvLCBzZXQgYSBmbGFnIHRvIGVuZCB0aWNraW5nIGFuZCBjbGVhciB0aGUgY2FsbHMgYXJyYXkuICovXG5cdCAgICAgICAgZm9yICh2YXIgaiA9IDAsIGNhbGxzTGVuZ3RoID0gVmVsb2NpdHkuU3RhdGUuY2FsbHMubGVuZ3RoOyBqIDwgY2FsbHNMZW5ndGg7IGorKykge1xuXHQgICAgICAgICAgICBpZiAoVmVsb2NpdHkuU3RhdGUuY2FsbHNbal0gIT09IGZhbHNlKSB7XG5cdCAgICAgICAgICAgICAgICByZW1haW5pbmdDYWxsc0V4aXN0ID0gdHJ1ZTtcblxuXHQgICAgICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAocmVtYWluaW5nQ2FsbHNFeGlzdCA9PT0gZmFsc2UpIHtcblx0ICAgICAgICAgICAgLyogdGljaygpIHdpbGwgZGV0ZWN0IHRoaXMgZmxhZyB1cG9uIGl0cyBuZXh0IGl0ZXJhdGlvbiBhbmQgc3Vic2VxdWVudGx5IHR1cm4gaXRzZWxmIG9mZi4gKi9cblx0ICAgICAgICAgICAgVmVsb2NpdHkuU3RhdGUuaXNUaWNraW5nID0gZmFsc2U7XG5cblx0ICAgICAgICAgICAgLyogQ2xlYXIgdGhlIGNhbGxzIGFycmF5IHNvIHRoYXQgaXRzIGxlbmd0aCBpcyByZXNldC4gKi9cblx0ICAgICAgICAgICAgZGVsZXRlIFZlbG9jaXR5LlN0YXRlLmNhbGxzO1xuXHQgICAgICAgICAgICBWZWxvY2l0eS5TdGF0ZS5jYWxscyA9IFtdO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgLyoqKioqKioqKioqKioqKioqKlxuXHQgICAgICAgIEZyYW1ld29ya3Ncblx0ICAgICoqKioqKioqKioqKioqKioqKi9cblxuXHQgICAgLyogQm90aCBqUXVlcnkgYW5kIFplcHRvIGFsbG93IHRoZWlyICQuZm4gb2JqZWN0IHRvIGJlIGV4dGVuZGVkIHRvIGFsbG93IHdyYXBwZWQgZWxlbWVudHMgdG8gYmUgc3ViamVjdGVkIHRvIHBsdWdpbiBjYWxscy5cblx0ICAgICAgIElmIGVpdGhlciBmcmFtZXdvcmsgaXMgbG9hZGVkLCByZWdpc3RlciBhIFwidmVsb2NpdHlcIiBleHRlbnNpb24gcG9pbnRpbmcgdG8gVmVsb2NpdHkncyBjb3JlIGFuaW1hdGUoKSBtZXRob2QuICBWZWxvY2l0eVxuXHQgICAgICAgYWxzbyByZWdpc3RlcnMgaXRzZWxmIG9udG8gYSBnbG9iYWwgY29udGFpbmVyICh3aW5kb3cualF1ZXJ5IHx8IHdpbmRvdy5aZXB0byB8fCB3aW5kb3cpIHNvIHRoYXQgY2VydGFpbiBmZWF0dXJlcyBhcmVcblx0ICAgICAgIGFjY2Vzc2libGUgYmV5b25kIGp1c3QgYSBwZXItZWxlbWVudCBzY29wZS4gVGhpcyBtYXN0ZXIgb2JqZWN0IGNvbnRhaW5zIGFuIC5hbmltYXRlKCkgbWV0aG9kLCB3aGljaCBpcyBsYXRlciBhc3NpZ25lZCB0byAkLmZuXG5cdCAgICAgICAoaWYgalF1ZXJ5IG9yIFplcHRvIGFyZSBwcmVzZW50KS4gQWNjb3JkaW5nbHksIFZlbG9jaXR5IGNhbiBib3RoIGFjdCBvbiB3cmFwcGVkIERPTSBlbGVtZW50cyBhbmQgc3RhbmQgYWxvbmUgZm9yIHRhcmdldGluZyByYXcgRE9NIGVsZW1lbnRzLiAqL1xuXHQgICAgZ2xvYmFsLlZlbG9jaXR5ID0gVmVsb2NpdHk7XG5cblx0ICAgIGlmIChnbG9iYWwgIT09IHdpbmRvdykge1xuXHQgICAgICAgIC8qIEFzc2lnbiB0aGUgZWxlbWVudCBmdW5jdGlvbiB0byBWZWxvY2l0eSdzIGNvcmUgYW5pbWF0ZSgpIG1ldGhvZC4gKi9cblx0ICAgICAgICBnbG9iYWwuZm4udmVsb2NpdHkgPSBhbmltYXRlO1xuXHQgICAgICAgIC8qIEFzc2lnbiB0aGUgb2JqZWN0IGZ1bmN0aW9uJ3MgZGVmYXVsdHMgdG8gVmVsb2NpdHkncyBnbG9iYWwgZGVmYXVsdHMgb2JqZWN0LiAqL1xuXHQgICAgICAgIGdsb2JhbC5mbi52ZWxvY2l0eS5kZWZhdWx0cyA9IFZlbG9jaXR5LmRlZmF1bHRzO1xuXHQgICAgfVxuXG5cdCAgICAvKioqKioqKioqKioqKioqKioqKioqKipcblx0ICAgICAgIFBhY2thZ2VkIFJlZGlyZWN0c1xuXHQgICAgKioqKioqKioqKioqKioqKioqKioqKiovXG5cblx0ICAgIC8qIHNsaWRlVXAsIHNsaWRlRG93biAqL1xuXHQgICAgJC5lYWNoKFsgXCJEb3duXCIsIFwiVXBcIiBdLCBmdW5jdGlvbihpLCBkaXJlY3Rpb24pIHtcblx0ICAgICAgICBWZWxvY2l0eS5SZWRpcmVjdHNbXCJzbGlkZVwiICsgZGlyZWN0aW9uXSA9IGZ1bmN0aW9uIChlbGVtZW50LCBvcHRpb25zLCBlbGVtZW50c0luZGV4LCBlbGVtZW50c1NpemUsIGVsZW1lbnRzLCBwcm9taXNlRGF0YSkge1xuXHQgICAgICAgICAgICB2YXIgb3B0cyA9ICQuZXh0ZW5kKHt9LCBvcHRpb25zKSxcblx0ICAgICAgICAgICAgICAgIGJlZ2luID0gb3B0cy5iZWdpbixcblx0ICAgICAgICAgICAgICAgIGNvbXBsZXRlID0gb3B0cy5jb21wbGV0ZSxcblx0ICAgICAgICAgICAgICAgIGNvbXB1dGVkVmFsdWVzID0geyBoZWlnaHQ6IFwiXCIsIG1hcmdpblRvcDogXCJcIiwgbWFyZ2luQm90dG9tOiBcIlwiLCBwYWRkaW5nVG9wOiBcIlwiLCBwYWRkaW5nQm90dG9tOiBcIlwiIH0sXG5cdCAgICAgICAgICAgICAgICBpbmxpbmVWYWx1ZXMgPSB7fTtcblxuXHQgICAgICAgICAgICBpZiAob3B0cy5kaXNwbGF5ID09PSB1bmRlZmluZWQpIHtcblx0ICAgICAgICAgICAgICAgIC8qIFNob3cgdGhlIGVsZW1lbnQgYmVmb3JlIHNsaWRlRG93biBiZWdpbnMgYW5kIGhpZGUgdGhlIGVsZW1lbnQgYWZ0ZXIgc2xpZGVVcCBjb21wbGV0ZXMuICovXG5cdCAgICAgICAgICAgICAgICAvKiBOb3RlOiBJbmxpbmUgZWxlbWVudHMgY2Fubm90IGhhdmUgZGltZW5zaW9ucyBhbmltYXRlZCwgc28gdGhleSdyZSByZXZlcnRlZCB0byBpbmxpbmUtYmxvY2suICovXG5cdCAgICAgICAgICAgICAgICBvcHRzLmRpc3BsYXkgPSAoZGlyZWN0aW9uID09PSBcIkRvd25cIiA/IChWZWxvY2l0eS5DU1MuVmFsdWVzLmdldERpc3BsYXlUeXBlKGVsZW1lbnQpID09PSBcImlubGluZVwiID8gXCJpbmxpbmUtYmxvY2tcIiA6IFwiYmxvY2tcIikgOiBcIm5vbmVcIik7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBvcHRzLmJlZ2luID0gZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgICAgICAgICAvKiBJZiB0aGUgdXNlciBwYXNzZWQgaW4gYSBiZWdpbiBjYWxsYmFjaywgZmlyZSBpdCBub3cuICovXG5cdCAgICAgICAgICAgICAgICBiZWdpbiAmJiBiZWdpbi5jYWxsKGVsZW1lbnRzLCBlbGVtZW50cyk7XG5cblx0ICAgICAgICAgICAgICAgIC8qIENhY2hlIHRoZSBlbGVtZW50cycgb3JpZ2luYWwgdmVydGljYWwgZGltZW5zaW9uYWwgcHJvcGVydHkgdmFsdWVzIHNvIHRoYXQgd2UgY2FuIGFuaW1hdGUgYmFjayB0byB0aGVtLiAqL1xuXHQgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcGVydHkgaW4gY29tcHV0ZWRWYWx1ZXMpIHtcblx0ICAgICAgICAgICAgICAgICAgICBpbmxpbmVWYWx1ZXNbcHJvcGVydHldID0gZWxlbWVudC5zdHlsZVtwcm9wZXJ0eV07XG5cblx0ICAgICAgICAgICAgICAgICAgICAvKiBGb3Igc2xpZGVEb3duLCB1c2UgZm9yY2VmZWVkaW5nIHRvIGFuaW1hdGUgYWxsIHZlcnRpY2FsIHByb3BlcnRpZXMgZnJvbSAwLiBGb3Igc2xpZGVVcCxcblx0ICAgICAgICAgICAgICAgICAgICAgICB1c2UgZm9yY2VmZWVkaW5nIHRvIHN0YXJ0IGZyb20gY29tcHV0ZWQgdmFsdWVzIGFuZCBhbmltYXRlIGRvd24gdG8gMC4gKi9cblx0ICAgICAgICAgICAgICAgICAgICB2YXIgcHJvcGVydHlWYWx1ZSA9IFZlbG9jaXR5LkNTUy5nZXRQcm9wZXJ0eVZhbHVlKGVsZW1lbnQsIHByb3BlcnR5KTtcblx0ICAgICAgICAgICAgICAgICAgICBjb21wdXRlZFZhbHVlc1twcm9wZXJ0eV0gPSAoZGlyZWN0aW9uID09PSBcIkRvd25cIikgPyBbIHByb3BlcnR5VmFsdWUsIDAgXSA6IFsgMCwgcHJvcGVydHlWYWx1ZSBdO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAvKiBGb3JjZSB2ZXJ0aWNhbCBvdmVyZmxvdyBjb250ZW50IHRvIGNsaXAgc28gdGhhdCBzbGlkaW5nIHdvcmtzIGFzIGV4cGVjdGVkLiAqL1xuXHQgICAgICAgICAgICAgICAgaW5saW5lVmFsdWVzLm92ZXJmbG93ID0gZWxlbWVudC5zdHlsZS5vdmVyZmxvdztcblx0ICAgICAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUub3ZlcmZsb3cgPSBcImhpZGRlblwiO1xuXHQgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgb3B0cy5jb21wbGV0ZSA9IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICAgICAgLyogUmVzZXQgZWxlbWVudCB0byBpdHMgcHJlLXNsaWRlIGlubGluZSB2YWx1ZXMgb25jZSBpdHMgc2xpZGUgYW5pbWF0aW9uIGlzIGNvbXBsZXRlLiAqL1xuXHQgICAgICAgICAgICAgICAgZm9yICh2YXIgcHJvcGVydHkgaW4gaW5saW5lVmFsdWVzKSB7XG5cdCAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5zdHlsZVtwcm9wZXJ0eV0gPSBpbmxpbmVWYWx1ZXNbcHJvcGVydHldO1xuXHQgICAgICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgICAgICAvKiBJZiB0aGUgdXNlciBwYXNzZWQgaW4gYSBjb21wbGV0ZSBjYWxsYmFjaywgZmlyZSBpdCBub3cuICovXG5cdCAgICAgICAgICAgICAgICBjb21wbGV0ZSAmJiBjb21wbGV0ZS5jYWxsKGVsZW1lbnRzLCBlbGVtZW50cyk7XG5cdCAgICAgICAgICAgICAgICBwcm9taXNlRGF0YSAmJiBwcm9taXNlRGF0YS5yZXNvbHZlcihlbGVtZW50cyk7XG5cdCAgICAgICAgICAgIH07XG5cblx0ICAgICAgICAgICAgVmVsb2NpdHkoZWxlbWVudCwgY29tcHV0ZWRWYWx1ZXMsIG9wdHMpO1xuXHQgICAgICAgIH07XG5cdCAgICB9KTtcblxuXHQgICAgLyogZmFkZUluLCBmYWRlT3V0ICovXG5cdCAgICAkLmVhY2goWyBcIkluXCIsIFwiT3V0XCIgXSwgZnVuY3Rpb24oaSwgZGlyZWN0aW9uKSB7XG5cdCAgICAgICAgVmVsb2NpdHkuUmVkaXJlY3RzW1wiZmFkZVwiICsgZGlyZWN0aW9uXSA9IGZ1bmN0aW9uIChlbGVtZW50LCBvcHRpb25zLCBlbGVtZW50c0luZGV4LCBlbGVtZW50c1NpemUsIGVsZW1lbnRzLCBwcm9taXNlRGF0YSkge1xuXHQgICAgICAgICAgICB2YXIgb3B0cyA9ICQuZXh0ZW5kKHt9LCBvcHRpb25zKSxcblx0ICAgICAgICAgICAgICAgIHByb3BlcnRpZXNNYXAgPSB7IG9wYWNpdHk6IChkaXJlY3Rpb24gPT09IFwiSW5cIikgPyAxIDogMCB9LFxuXHQgICAgICAgICAgICAgICAgb3JpZ2luYWxDb21wbGV0ZSA9IG9wdHMuY29tcGxldGU7XG5cblx0ICAgICAgICAgICAgLyogU2luY2UgcmVkaXJlY3RzIGFyZSB0cmlnZ2VyZWQgaW5kaXZpZHVhbGx5IGZvciBlYWNoIGVsZW1lbnQgaW4gdGhlIGFuaW1hdGVkIHNldCwgYXZvaWQgcmVwZWF0ZWRseSB0cmlnZ2VyaW5nXG5cdCAgICAgICAgICAgICAgIGNhbGxiYWNrcyBieSBmaXJpbmcgdGhlbSBvbmx5IHdoZW4gdGhlIGZpbmFsIGVsZW1lbnQgaGFzIGJlZW4gcmVhY2hlZC4gKi9cblx0ICAgICAgICAgICAgaWYgKGVsZW1lbnRzSW5kZXggIT09IGVsZW1lbnRzU2l6ZSAtIDEpIHtcblx0ICAgICAgICAgICAgICAgIG9wdHMuY29tcGxldGUgPSBvcHRzLmJlZ2luID0gbnVsbDtcblx0ICAgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgICAgIG9wdHMuY29tcGxldGUgPSBmdW5jdGlvbigpIHtcblx0ICAgICAgICAgICAgICAgICAgICBpZiAob3JpZ2luYWxDb21wbGV0ZSkge1xuXHQgICAgICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbENvbXBsZXRlLmNhbGwoZWxlbWVudHMsIGVsZW1lbnRzKTtcblx0ICAgICAgICAgICAgICAgICAgICB9XG5cblx0ICAgICAgICAgICAgICAgICAgICBwcm9taXNlRGF0YSAmJiBwcm9taXNlRGF0YS5yZXNvbHZlcihlbGVtZW50cyk7XG5cdCAgICAgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICAvKiBJZiBhIGRpc3BsYXkgd2FzIHBhc3NlZCBpbiwgdXNlIGl0LiBPdGhlcndpc2UsIGRlZmF1bHQgdG8gXCJub25lXCIgZm9yIGZhZGVPdXQgb3IgdGhlIGVsZW1lbnQtc3BlY2lmaWMgZGVmYXVsdCBmb3IgZmFkZUluLiAqL1xuXHQgICAgICAgICAgICAvKiBOb3RlOiBXZSBhbGxvdyB1c2VycyB0byBwYXNzIGluIFwibnVsbFwiIHRvIHNraXAgZGlzcGxheSBzZXR0aW5nIGFsdG9nZXRoZXIuICovXG5cdCAgICAgICAgICAgIGlmIChvcHRzLmRpc3BsYXkgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgICAgICAgICAgICAgb3B0cy5kaXNwbGF5ID0gKGRpcmVjdGlvbiA9PT0gXCJJblwiID8gXCJhdXRvXCIgOiBcIm5vbmVcIik7XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBWZWxvY2l0eSh0aGlzLCBwcm9wZXJ0aWVzTWFwLCBvcHRzKTtcblx0ICAgICAgICB9O1xuXHQgICAgfSk7XG5cblx0ICAgIHJldHVybiBWZWxvY2l0eTtcblx0fSgod2luZG93LmpRdWVyeSB8fCB3aW5kb3cuWmVwdG8gfHwgd2luZG93KSwgd2luZG93LCBkb2N1bWVudCk7XG5cdH0pKTtcblxuXHQvKioqKioqKioqKioqKioqKioqXG5cdCAgIEtub3duIElzc3Vlc1xuXHQqKioqKioqKioqKioqKioqKiovXG5cblx0LyogVGhlIENTUyBzcGVjIG1hbmRhdGVzIHRoYXQgdGhlIHRyYW5zbGF0ZVgvWS9aIHRyYW5zZm9ybXMgYXJlICUtcmVsYXRpdmUgdG8gdGhlIGVsZW1lbnQgaXRzZWxmIC0tIG5vdCBpdHMgcGFyZW50LlxuXHRWZWxvY2l0eSwgaG93ZXZlciwgZG9lc24ndCBtYWtlIHRoaXMgZGlzdGluY3Rpb24uIFRodXMsIGNvbnZlcnRpbmcgdG8gb3IgZnJvbSB0aGUgJSB1bml0IHdpdGggdGhlc2Ugc3VicHJvcGVydGllc1xuXHR3aWxsIHByb2R1Y2UgYW4gaW5hY2N1cmF0ZSBjb252ZXJzaW9uIHZhbHVlLiBUaGUgc2FtZSBpc3N1ZSBleGlzdHMgd2l0aCB0aGUgY3gvY3kgYXR0cmlidXRlcyBvZiBTVkcgY2lyY2xlcyBhbmQgZWxsaXBzZXMuICovXG5cbi8qKiovIH0sXG4vKiA0ICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuXHR2YXIgRmx5b3V0RmFjdG9yeSA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWxlbWVudCkge1xuXHQgIHZhciBwYWRkaW5nID0gMTA7XG5cdCAgdmFyIGhvdmVyYWJsZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkoZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1mbHlvdXRdJykpO1xuXG5cdCAgaG92ZXJhYmxlcy5mb3JFYWNoKGZ1bmN0aW9uKGhvdmVyYWJsZSkge1xuXHQgICAgdmFyIGZseW91dCA9IGVsZW1lbnQucXVlcnlTZWxlY3RvcignIycgKyBob3ZlcmFibGUuZ2V0QXR0cmlidXRlKCdkYXRhLWZseW91dCcpKTtcblxuXHQgICAgaG92ZXJhYmxlLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIGZ1bmN0aW9uKCkge1xuXHQgICAgICBmbHlvdXQuY2xhc3NMaXN0LnJlbW92ZSgnZmx5b3V0LWhpZGRlbicpO1xuXHQgICAgICB2YXIgbm9kZSA9IGhvdmVyYWJsZTtcblx0ICAgICAgdmFyIGxlZnQgPSAwO1xuXHQgICAgICB2YXIgdG9wID0gMDtcblxuXHQgICAgICBkbyB7XG5cdCAgICAgICAgbGVmdCArPSBub2RlLm9mZnNldExlZnQ7XG5cdCAgICAgICAgdG9wICs9IG5vZGUub2Zmc2V0VG9wO1xuXHQgICAgICB9IHdoaWxlICgobm9kZSA9IG5vZGUub2Zmc2V0UGFyZW50KSAhPT0gbnVsbCk7XG5cblx0ICAgICAgbGVmdCA9IGxlZnQgKyBob3ZlcmFibGUub2Zmc2V0V2lkdGggLyAyO1xuXHQgICAgICB0b3AgPSB0b3AgKyBob3ZlcmFibGUub2Zmc2V0SGVpZ2h0ICsgcGFkZGluZztcblxuXHQgICAgICBmbHlvdXQuc3R5bGUubGVmdCA9IGxlZnQgKyAncHgnO1xuXHQgICAgICBmbHlvdXQuc3R5bGUudG9wID0gdG9wICsgJ3B4Jztcblx0ICAgIH0pO1xuXG5cdCAgICBob3ZlcmFibGUuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdXQnLCBmdW5jdGlvbigpIHtcblx0ICAgICAgZmx5b3V0LmNsYXNzTGlzdC5hZGQoJ2ZseW91dC1oaWRkZW4nKTtcblx0ICAgIH0pO1xuXHQgIH0pO1xuXG5cdH1cblxuXG4vKioqLyB9LFxuLyogNSAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cblx0dmFyIE1lbnVGYWN0b3J5ID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgdmFyIG1lbnVzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCcubWVudScpKTtcblx0ICB2YXIgdG9nZ2xlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtbWVudS10b2dnbGVdJykpO1xuXG5cdCAgdG9nZ2xlcy5mb3JFYWNoKGZ1bmN0aW9uKHRvZ2dsZSkge1xuXHQgICAgdG9nZ2xlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdCAgICAgIHZhciBtZW51ID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcjJyArIHRvZ2dsZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtbWVudS10b2dnbGUnKSk7XG5cdCAgICAgIG1lbnUuY2xhc3NMaXN0LnRvZ2dsZSgnYWN0aXZlJyk7XG5cdCAgICB9KTtcblx0ICB9KTtcblxuXHQgIG1lbnVzLmZvckVhY2goZnVuY3Rpb24obWVudSkge1xuXHQgICAgdmFyIGRpc21pc3NhbHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChtZW51LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW1lbnUtZGlzbWlzc10nKSk7XG5cblx0ICAgIGRpc21pc3NhbHMuZm9yRWFjaChmdW5jdGlvbihkaXNtaXNzYWwpIHtcblx0ICAgICAgZGlzbWlzc2FsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG5cdCAgICAgICAgbWVudS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcblx0ICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1tZW51LXRvZ2dsZT1cIicgKyBtZW51LmlkICsgJ1wiXScpLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuXHQgICAgICB9KTtcblx0ICAgIH0pO1xuXHQgIH0pO1xuXHR9XG5cblxuLyoqKi8gfSxcbi8qIDYgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdHZhciB2ZWxvY2l0eSA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cblx0dmFyIG1vYmlsZUJyZWFrcG9pbnQgPSA0MjA7XG5cdHZhciBhbmltYXRpb25EdXJhdGlvbiA9IDMwMDtcblx0dmFyIGFuaW1hdGlvbkVhc2luZyA9IFsuNjQ1LCAuMDQ1LCAuMzU1LCAxXTtcblxuXHR2YXIgTW9kYWxGYWN0b3J5ID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgdGhpcy5yb290ID0gZWxlbWVudDtcblx0ICB0aGlzLmRpc21pc3NhbHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkoZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1tb2RhbC1kaXNtaXNzXScpKTtcblx0ICB0aGlzLm9wZW5lcnMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkoZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1tb2RhbF0nKSk7XG5cdCAgdGhpcy5hdHRhY2hFdmVudHMoKTtcblx0fVxuXG5cdE1vZGFsRmFjdG9yeS5wcm90b3R5cGUgPSB7XG5cdCAgYXR0YWNoRXZlbnRzOiBmdW5jdGlvbigpIHtcblx0ICAgIHRoaXMuZGlzbWlzc2Fscy5mb3JFYWNoKGZ1bmN0aW9uIChkaXNtaXNzYWwpIHtcblx0ICAgICAgZGlzbWlzc2FsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5kaXNtaXNzLmJpbmQodGhpcykpO1xuXHQgICAgfSwgdGhpcyk7XG5cblx0ICAgIHRoaXMub3BlbmVycy5mb3JFYWNoKGZ1bmN0aW9uIChvcGVuZXIpIHtcblx0ICAgICAgb3BlbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5vcGVuLmJpbmQodGhpcykpO1xuXHQgICAgfSwgdGhpcyk7XG5cblx0ICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZnVuY3Rpb24oZXZlbnQpIHtcblx0ICAgICAgdmFyIGtleSA9IGV2ZW50LndoaWNoIHx8IGV2ZW50LmtleUNvZGU7XG5cblx0ICAgICAgLy8gRVNDXG5cdCAgICAgIGlmIChrZXkgPT09IDI3KSB7XG5cdCAgICAgICAgdmFyIG1vZGFscyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5tb2RhbDpub3QoLm1vZGFsLWhpZGRlbiknKSk7XG5cdCAgICAgICAgbW9kYWxzLmZvckVhY2goZnVuY3Rpb24obW9kYWwpIHtcblx0ICAgICAgICAgIG1vZGFsLmNsYXNzTGlzdC5hZGQoJ21vZGFsLWhpZGRlbicpO1xuXHQgICAgICAgIH0pO1xuXHQgICAgICB9XG5cdCAgICB9KTtcblxuXHQgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cdCAgICAgIHZhciBtb2RhbHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcubW9kYWw6bm90KC5tb2RhbC1oaWRkZW4pJykpO1xuXHQgICAgICBtb2RhbHMuZm9yRWFjaChmdW5jdGlvbihtb2RhbCkge1xuXHQgICAgICAgIHRoaXMucmVwb3NpdGlvbihtb2RhbC5xdWVyeVNlbGVjdG9yKCcubW9kYWwtY29udGFpbmVyJykpO1xuXHQgICAgICB9LmJpbmQodGhpcykpO1xuXHQgICAgfS5iaW5kKHRoaXMpKTtcblx0ICB9LFxuXG5cdCAgb3BlbjogZnVuY3Rpb24oZXZlbnQpIHtcblx0ICAgIHZhciBtb2RhbCA9IGV2ZW50LnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtbW9kYWwnKTtcblx0ICAgIG1vZGFsID0gdGhpcy5yb290LnF1ZXJ5U2VsZWN0b3IoJyMnICsgbW9kYWwpO1xuXHQgICAgbW9kYWwuY2xhc3NMaXN0LnJlbW92ZSgnbW9kYWwtaGlkZGVuJyk7XG5cblx0ICAgIHZhciB3aW5kb3dXaWR0aCA9IGRvY3VtZW50LmJvZHkub2Zmc2V0V2lkdGg7XG5cdCAgICB2YXIgbW9kYWxDb250YWluZXIgPSBtb2RhbC5xdWVyeVNlbGVjdG9yKCcubW9kYWwtY29udGFpbmVyJyk7XG5cblx0ICAgIGlmICh3aW5kb3dXaWR0aCA8PSBtb2JpbGVCcmVha3BvaW50KSB7XG5cdCAgICAgIG1vZGFsQ29udGFpbmVyLnN0eWxlLmxlZnQgPSB3aW5kb3dXaWR0aCArICdweCc7XG5cblx0ICAgICAgdmVsb2NpdHkobW9kYWxDb250YWluZXIsIHtcblx0ICAgICAgICBsZWZ0OiAwXG5cdCAgICAgIH0sIHtcblx0ICAgICAgICBkdXJhdGlvbjogYW5pbWF0aW9uRHVyYXRpb24sXG5cdCAgICAgICAgZWFzaW5nOiBhbmltYXRpb25FYXNpbmcsXG5cdCAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xuXHQgICAgICAgIH1cblx0ICAgICAgfSk7XG5cdCAgICB9XG5cblx0ICAgIHRoaXMucmVwb3NpdGlvbihtb2RhbENvbnRhaW5lcik7XG5cdCAgfSxcblxuXHQgIGRpc21pc3M6IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdCAgICB2YXIgc2VsZiA9IHRoaXM7XG5cdCAgICB2YXIgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xuXG5cdCAgICB2YXIgY2xvc2VhYmxlID0gdGFyZ2V0ID09PSBldmVudC5jdXJyZW50VGFyZ2V0ICYmIHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ21vZGFsLW92ZXJsYXknKTtcblx0ICAgIHZhciBtb2RhbDtcblxuXHQgICAgLy8gRmluZCB0aGUgbW9kYWwgYW5kIGZpZ3VyZSBvdXQgaWYgaXQncyBjbG9zZWFibGUuXG5cdCAgICBkbyB7XG5cdCAgICAgIGlmICh0YXJnZXQuaGFzQXR0cmlidXRlKCdkYXRhLW1vZGFsLWRpc21pc3MnKSAmJlxuXHQgICAgICAgICAgIXRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ21vZGFsJykpIHtcblx0ICAgICAgICBjbG9zZWFibGUgPSB0cnVlO1xuXHQgICAgICB9IGVsc2UgaWYgKHRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ21vZGFsJykpe1xuXHQgICAgICAgIG1vZGFsID0gdGFyZ2V0O1xuXHQgICAgICAgIGJyZWFrO1xuXHQgICAgICB9XG5cdCAgICB9IHdoaWxlKCh0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZSkgIT09IHNlbGYucm9vdCk7XG5cblx0ICAgIGlmICghbW9kYWwpIHtcblx0ICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBoaWRlTW9kYWwoKSB7XG5cdCAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnJztcblxuXHQgICAgICBpZiAoY2xvc2VhYmxlKSB7XG5cdCAgICAgICAgbW9kYWwuY2xhc3NMaXN0LmFkZCgnbW9kYWwtaGlkZGVuJyk7XG5cdCAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgdmFyIHdpbmRvd1dpZHRoID0gZG9jdW1lbnQuYm9keS5vZmZzZXRXaWR0aDtcblx0ICAgIHZhciBtb2RhbENvbnRhaW5lciA9IG1vZGFsLnF1ZXJ5U2VsZWN0b3IoJy5tb2RhbC1jb250YWluZXInKTtcblxuXHQgICAgaWYgKHdpbmRvd1dpZHRoIDw9IG1vYmlsZUJyZWFrcG9pbnQpIHtcblx0ICAgICAgdmVsb2NpdHkobW9kYWxDb250YWluZXIsIHtcblx0ICAgICAgICBsZWZ0OiB3aW5kb3dXaWR0aFxuXHQgICAgICB9LCB7XG5cdCAgICAgICAgZHVyYXRpb246IGFuaW1hdGlvbkR1cmF0aW9uLFxuXHQgICAgICAgIGVhc2luZzogYW5pbWF0aW9uRWFzaW5nLFxuXHQgICAgICAgIGNvbXBsZXRlOiBoaWRlTW9kYWxcblx0ICAgICAgfSk7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICBoaWRlTW9kYWwoKTtcblx0ICAgIH1cblx0ICB9LFxuXG5cdCAgcmVwb3NpdGlvbjogZnVuY3Rpb24obW9kYWwpIHtcblx0ICAgIGlmIChtb2RhbC5jbGFzc0xpc3QuY29udGFpbnMoJ21vZGFsLWhpZGRlbicpKSB7XG5cdCAgICAgIHJldHVybjtcblx0ICAgIH1cblxuXHQgICAgdmFyIHdpbmRvd1dpZHRoID0gZG9jdW1lbnQuYm9keS5vZmZzZXRXaWR0aDtcblxuXHQgICAgaWYgKHdpbmRvd1dpZHRoID49IG1vYmlsZUJyZWFrcG9pbnQpIHtcblx0ICAgICAgbW9kYWwuc3R5bGUubWFyZ2luID0gJyc7XG5cdCAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnJztcblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgIG1vZGFsLnN0eWxlLm1hcmdpbiA9IDA7XG5cdCAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUub3ZlcmZsb3cgPSAnaGlkZGVuJztcblx0ICAgIH1cblx0ICB9XG5cdH07XG5cblxuLyoqKi8gfSxcbi8qIDcgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5cdHZhciBUb2dnbGVGYWN0b3J5ID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihlbGVtZW50KSB7XG5cdCAgdmFyIHRvZ2dsZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkoZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS10b2dnbGVdJykpO1xuXHQgIHRoaXMuZWxlbWVudCA9IGVsZW1lbnQ7XG5cblx0ICB0b2dnbGVzLmZvckVhY2goZnVuY3Rpb24odG9nZ2xlKSB7XG5cdCAgICB0b2dnbGUuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpKTtcblx0ICB9LCB0aGlzKTtcblx0fVxuXG5cdFRvZ2dsZUZhY3RvcnkucHJvdG90eXBlID0ge1xuXHQgIHRvZ2dsZTogZnVuY3Rpb24oZXZlbnQpIHtcblx0ICAgIHZhciB0YXJnZXQgPSBldmVudC50YXJnZXQ7XG5cblx0ICAgIGRvIHtcblx0ICAgICAgaWYgKHRhcmdldC5oYXNBdHRyaWJ1dGUoJ2RhdGEtdG9nZ2xlJykpIHtcblx0ICAgICAgICByZXR1cm4gdGFyZ2V0LmNsYXNzTGlzdC50b2dnbGUoJ2FjdGl2ZScpXG5cdCAgICAgIH1cblx0ICAgIH0gd2hpbGUoKHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlKSAhPT0gdGhpcy5lbGVtZW50KVxuXHQgIH1cblx0fVxuXG5cbi8qKiovIH0sXG4vKiA4ICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHR2YXIgU2hlcGhlcmQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDkpO1xuXG5cdC8vIEN1c3RvbUV2ZW50IHBvbHlmaWxsIGZvciBJRTEwLzExIChmcm9tIGZyb250ZW5kLXV0aWxzKVxuXHR2YXIgQ3VzdG9tRXZlbnQgPSBmdW5jdGlvbihldmVudE5hbWUsIHBhcmFtcykge1xuXHQgIHZhciBldmVudFBhcmFtcyA9IHsgYnViYmxlczogZmFsc2UsIGNhbmNlbGFibGU6IGZhbHNlLCBkZXRhaWw6IHVuZGVmaW5lZCB9O1xuXG5cdCAgZm9yICh2YXIga2V5IGluIHBhcmFtcykge1xuXHQgICAgaWYgKHBhcmFtcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdCAgICAgIGV2ZW50UGFyYW1zW2tleV0gPSBwYXJhbXNba2V5XTtcblx0ICAgIH1cblx0ICB9XG5cblx0ICB2YXIgY3VzdG9tRXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKTtcblxuXHQgIGN1c3RvbUV2ZW50LmluaXRDdXN0b21FdmVudChcblx0ICAgIGV2ZW50TmFtZSxcblx0ICAgIGV2ZW50UGFyYW1zLmJ1YmJsZXMsXG5cdCAgICBldmVudFBhcmFtcy5jYW5jZWxhYmxlLFxuXHQgICAgZXZlbnRQYXJhbXMuZGV0YWlsXG5cdCAgKTtcblxuXHQgIHJldHVybiBjdXN0b21FdmVudDtcblx0fTtcblxuXHR2YXIgVG91ckZhY3RvcnkgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcblx0ICB0aGlzLnJvb3QgPSBlbGVtZW50O1xuXHQgIHRoaXMudG91ckVsZW1lbnRzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmFwcGx5KGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtdG91cl0nKSk7XG5cblx0ICBpZiAodGhpcy50b3VyRWxlbWVudHMubGVuZ3RoID4gMCkge1xuXHQgICAgdGhpcy50b3VycyA9IHt9O1xuXHQgICAgdGhpcy5jdXJyZW50VG91ck5hbWUgPSBudWxsO1xuXG5cdCAgICB0aGlzLm9wZW5lcnMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuYXBwbHkoZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS10b3VyLW9wZW5lcl0nKSk7XG5cblx0ICAgIHZhciB0b3VyT3ZlcmxheUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0ICAgIHRvdXJPdmVybGF5RWxlbWVudC5jbGFzc0xpc3QuYWRkKCd0b3VyLW92ZXJsYXknLCAnb3ZlcmxheS1oaWRkZW4nKTtcblx0ICAgIHRoaXMudG91ck92ZXJsYXkgPSBlbGVtZW50LmJvZHkuYXBwZW5kQ2hpbGQodG91ck92ZXJsYXlFbGVtZW50KTtcblxuXHQgICAgdGhpcy5pbml0aWFsaXplKCk7XG5cblx0ICAgIC8vIE9wZW4gYWxsIHRvdXJzIHdpdGhvdXQgb3BlbmVycyBpbW1lZGlhdGVseVxuXHQgICAgaWYgKHRoaXMub3BlbmVycy5sZW5ndGggPCB0aGlzLnRvdXJFbGVtZW50cy5sZW5ndGgpIHtcblx0ICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuXHQgICAgICB2YXIgb3BlbmVyTmFtZXMgPSB0aGF0Lm9wZW5lcnMubWFwKGZ1bmN0aW9uKG9wZW5lcikgeyByZXR1cm4gb3BlbmVyLmdldEF0dHJpYnV0ZSgnZGF0YS10b3VyLW9wZW5lcicpOyB9KTtcblxuXHQgICAgICB0aGF0LnRvdXJFbGVtZW50cy5mb3JFYWNoKGZ1bmN0aW9uKHRvdXJFbGVtZW50KSB7XG5cdCAgICAgICAgdmFyIHRvdXJOYW1lID0gdG91ckVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXRvdXItbmFtZScpO1xuXHQgICAgICAgIGlmICghb3BlbmVyTmFtZXMuaW5jbHVkZXModG91ck5hbWUpKSB7XG5cdCAgICAgICAgICB0aGF0Lm9wZW5Ub3VyKHRvdXJOYW1lKTtcblx0ICAgICAgICB9XG5cdCAgICAgIH0pO1xuXHQgICAgfVxuXHQgIH1cblx0fVxuXG5cdFRvdXJGYWN0b3J5LnByb3RvdHlwZSA9IHtcblx0ICBpbml0aWFsaXplOiBmdW5jdGlvbigpIHtcblx0ICAgIHZhciB0aGF0ID0gdGhpcztcblxuXHQgICAgdGhhdC50b3VyRWxlbWVudHMuZm9yRWFjaChmdW5jdGlvbih0b3VyRWxlbWVudCkge1xuXHQgICAgICB0aGF0LmluaXRpYWxpemVUb3VyKHRvdXJFbGVtZW50KTtcblx0ICAgIH0pO1xuXG5cdCAgICB0aGF0LmF0dGFjaEV2ZW50cygpO1xuXHQgIH0sXG5cdCAgaW5pdGlhbGl6ZVRvdXI6IGZ1bmN0aW9uKHRvdXJFbGVtZW50KSB7XG5cdCAgICB2YXIgdGhhdCA9IHRoaXM7XG5cdCAgICB2YXIgdG91ck5hbWUgPSB0b3VyRWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2RhdGEtdG91ci1uYW1lJyk7XG5cblx0ICAgIHZhciB0b3VyID0gbmV3IFNoZXBoZXJkLlRvdXIoe1xuXHQgICAgICBkZWZhdWx0czoge1xuXHQgICAgICAgIHNob3dDYW5jZWxMaW5rOiB0cnVlLFxuXHQgICAgICAgIGJ1dHRvbnM6IFtcblx0ICAgICAgICAgIHtcblx0ICAgICAgICAgICAgdGV4dDogdG91ckVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXRvdXItc2tpcCcpLFxuXHQgICAgICAgICAgICBjbGFzc2VzOiAnYnRuLWRlZmF1bHQnLFxuXHQgICAgICAgICAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICAgIHRoYXQuY2xvc2VUb3VyKHRvdXJOYW1lKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgfSxcblx0ICAgICAgICAgIHtcblx0ICAgICAgICAgICAgdGV4dDogdG91ckVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXRvdXItbmV4dCcpLFxuXHQgICAgICAgICAgICBjbGFzc2VzOiAnYnRuLXByaW1hcnknLFxuXHQgICAgICAgICAgICBhY3Rpb246IGZ1bmN0aW9uKCkge1xuXHQgICAgICAgICAgICAgIHRoYXQuY2xpY2tOZXh0KHRvdXJOYW1lKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgfVxuXHQgICAgICAgIF1cblx0ICAgICAgfVxuXHQgICAgfSk7XG5cblx0ICAgIHRoYXQudG91cnNbdG91ck5hbWVdID0ge1xuXHQgICAgICB0b3VyOiB0b3VyLFxuXHQgICAgICBuYW1lOiB0b3VyTmFtZVxuXHQgICAgfTtcblx0ICAgIHRoYXQuYWRkU3RlcHModG91ciwgdG91ckVsZW1lbnQpO1xuXHQgIH0sXG5cdCAgYWRkU3RlcHM6IGZ1bmN0aW9uKHRvdXIsIHRvdXJFbGVtZW50KSB7XG5cdCAgICB2YXIgdGhhdCA9IHRoaXM7XG5cblx0ICAgIHZhciBzdGVwcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5hcHBseSh0b3VyRWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS10b3VyLXN0ZXBdJykpO1xuXHQgICAgdmFyIHNvcnRlZFN0ZXBzID0gc3RlcHMuc29ydChmdW5jdGlvbihhLCBiKSB7XG5cdCAgICAgIHZhciBzdGVwQSA9IHBhcnNlSW50KGEuZ2V0QXR0cmlidXRlKCdkYXRhLXN0ZXAtbnVtYmVyJykpO1xuXHQgICAgICB2YXIgc3RlcEIgPSBwYXJzZUludChiLmdldEF0dHJpYnV0ZSgnZGF0YS1zdGVwLW51bWJlcicpKTtcblxuXHQgICAgICBpZiAoc3RlcEEgPiBzdGVwQikge1xuXHQgICAgICAgIHJldHVybiAxO1xuXHQgICAgICB9IGVsc2UgaWYgKHN0ZXBBIDwgc3RlcEIpIHtcblx0ICAgICAgICByZXR1cm4gLTE7XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgcmV0dXJuIDA7XG5cdCAgICAgIH1cblx0ICAgIH0pO1xuXG5cdCAgICBzb3J0ZWRTdGVwcy5mb3JFYWNoKGZ1bmN0aW9uKHN0ZXAsIGluZGV4KSB7XG5cdCAgICAgIHZhciBzdGVwQ29uZmlnID0ge1xuXHQgICAgICAgIHRpdGxlOiBzdGVwLmdldEF0dHJpYnV0ZSgnZGF0YS10aXRsZScpIHx8ICcnLFxuXHQgICAgICAgIHRleHQ6IHN0ZXAuaW5uZXJIVE1MLFxuXHQgICAgICB9O1xuXG5cdCAgICAgIHZhciBjbGFzc2VzID0gc3RlcC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY2xhc3NlcycpIHx8ICcnO1xuXG5cdCAgICAgIHZhciBhdHRhY2hUb0VsZW1lbnQgPSBzdGVwLmdldEF0dHJpYnV0ZSgnZGF0YS1hdHRhY2gtdG8tZWxlbWVudCcpO1xuXHQgICAgICB2YXIgYXR0YWNoVG9Qb3NpdGlvbiA9IHN0ZXAuZ2V0QXR0cmlidXRlKCdkYXRhLWF0dGFjaC10by1wb3NpdGlvbicpO1xuXHQgICAgICB2YXIgcG9zaXRpb25PZmZzZXQgPSB7XG5cdCAgICAgICAgbGVmdDogJzAgMjVweCcsXG5cdCAgICAgICAgcmlnaHQ6ICcwIC0yNXB4Jyxcblx0ICAgICAgICB0b3A6ICcyNXB4IDAnLFxuXHQgICAgICAgIGJvdHRvbTogJy0yNXB4IDAnXG5cdCAgICAgIH1bYXR0YWNoVG9Qb3NpdGlvbl07XG5cblx0ICAgICAgaWYgKGNsYXNzZXMpIHtcblx0ICAgICAgICBzdGVwQ29uZmlnLmNsYXNzZXMgPSBjbGFzc2VzLnNwbGl0KCcgJyk7XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAoYXR0YWNoVG9FbGVtZW50ICYmIGF0dGFjaFRvUG9zaXRpb24gJiYgcG9zaXRpb25PZmZzZXQpIHtcblx0ICAgICAgICBzdGVwQ29uZmlnLmF0dGFjaFRvID0ge1xuXHQgICAgICAgICAgZWxlbWVudDogYXR0YWNoVG9FbGVtZW50LFxuXHQgICAgICAgICAgb246IGF0dGFjaFRvUG9zaXRpb25cblx0ICAgICAgICB9O1xuXG5cdCAgICAgICAgc3RlcENvbmZpZy50ZXRoZXJPcHRpb25zID0ge1xuXHQgICAgICAgICAgb2Zmc2V0OiBwb3NpdGlvbk9mZnNldFxuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXG5cdCAgICAgIGlmIChzb3J0ZWRTdGVwcy5sZW5ndGggLSAxID09PSBpbmRleCkge1xuXHQgICAgICAgIHN0ZXBDb25maWcuYnV0dG9ucyA9IFtcblx0ICAgICAgICAgIHtcblx0ICAgICAgICAgICAgdGV4dDogdG91ckVsZW1lbnQuZ2V0QXR0cmlidXRlKCdkYXRhLXRvdXItZG9uZScpLFxuXHQgICAgICAgICAgICBjbGFzc2VzOiAnYnRuLXByaW1hcnknLFxuXHQgICAgICAgICAgICBhY3Rpb246IHRvdXIuY29tcGxldGVcblx0ICAgICAgICAgIH1cblx0ICAgICAgICBdO1xuXHQgICAgICB9XG5cblx0ICAgICAgdG91ci5hZGRTdGVwKHN0ZXBDb25maWcpO1xuXG5cdCAgICAgIHRvdXIub24oJ2FjdGl2ZScsIGZ1bmN0aW9uKCkge1xuXHQgICAgICAgIHRoYXQudG91ck92ZXJsYXkuY2xhc3NMaXN0LnJlbW92ZSgnb3ZlcmxheS1oaWRkZW4nKTtcblx0ICAgICAgfSk7XG5cblx0ICAgICAgdG91ci5vbignaW5hY3RpdmUnLCBmdW5jdGlvbigpIHtcblx0ICAgICAgICB0aGF0LnRvdXJPdmVybGF5LmNsYXNzTGlzdC5hZGQoJ292ZXJsYXktaGlkZGVuJyk7XG5cdCAgICAgIH0pO1xuXHQgICAgfSk7XG5cdCAgfSxcblx0ICBhdHRhY2hFdmVudHM6IGZ1bmN0aW9uKCkge1xuXHQgICAgdmFyIHRoYXQgPSB0aGlzO1xuXG5cdCAgICB0aGF0Lm9wZW5lcnMuZm9yRWFjaChmdW5jdGlvbiAob3BlbmVyKSB7XG5cdCAgICAgIG9wZW5lci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoYXQub3BlblRvdXIuYmluZCh0aGF0LCBvcGVuZXIuZ2V0QXR0cmlidXRlKCdkYXRhLXRvdXItb3BlbmVyJykpKTtcblx0ICAgIH0sIHRoYXQpO1xuXG5cdCAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cdCAgICAgIHZhciBrZXkgPSBldmVudC53aGljaCB8fCBldmVudC5rZXlDb2RlO1xuXG5cdCAgICAgIGlmICh0aGF0LmN1cnJlbnRUb3VyTmFtZSA9PT0gbnVsbCkge1xuXHQgICAgICAgIHJldHVybjtcblx0ICAgICAgfVxuXG5cdCAgICAgIC8vIEVTQ1xuXHQgICAgICBpZiAoa2V5ID09PSAyNykge1xuXHQgICAgICAgIHRoYXQuY2xvc2VUb3VyKHRoYXQuY3VycmVudFRvdXJOYW1lKTtcblx0ICAgICAgfVxuXHQgICAgfSk7XG5cblx0ICAgIHRoYXQudG91ck92ZXJsYXkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcblx0ICAgICAgdGhhdC5jbG9zZVRvdXIodGhhdC5jdXJyZW50VG91ck5hbWUpO1xuXHQgICAgfSk7XG5cdCAgfSxcblx0ICBvcGVuVG91cjogZnVuY3Rpb24odG91ck5hbWUpIHtcblx0ICAgIHZhciB0b3VyT2JqZWN0ID0gdGhpcy50b3Vyc1t0b3VyTmFtZV07XG5cblx0ICAgIHRoaXMuY3VycmVudFRvdXJOYW1lID0gdG91ck9iamVjdC5uYW1lO1xuXG5cdCAgICB0b3VyT2JqZWN0LnRvdXIuc3RhcnQoKTtcblx0ICAgIHRoaXMudG91ck92ZXJsYXkuY2xhc3NMaXN0LnJlbW92ZSgndG91ci1vdmVybGF5LWhpZGRlbicpO1xuXHQgIH0sXG5cdCAgY2xpY2tOZXh0OiBmdW5jdGlvbih0b3VyTmFtZSkge1xuXHQgICAgdmFyIHRvdXJPYmplY3QgPSB0aGlzLnRvdXJzW3RvdXJOYW1lXTtcblx0ICAgIHZhciBwYXlsb2FkID0ge1xuXHQgICAgICBjdXJyZW50U3RlcDogdG91ck9iamVjdC50b3VyLmdldEN1cnJlbnRTdGVwKCkuaWQucmVwbGFjZSgnc3RlcC0nLCAnJyksXG5cdCAgICAgIHRvdXJOYW1lOiB0b3VyT2JqZWN0Lm5hbWVcblx0ICAgIH07XG5cblx0ICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KCduZXh0JywgeyAnZGV0YWlsJzogcGF5bG9hZCB9KSk7XG5cdCAgICB0b3VyT2JqZWN0LnRvdXIubmV4dCgpO1xuXHQgIH0sXG5cdCAgY2xvc2VUb3VyOiBmdW5jdGlvbih0b3VyTmFtZSkge1xuXHQgICAgdmFyIHRvdXJPYmplY3QgPSB0aGlzLnRvdXJzW3RvdXJOYW1lXTtcblx0ICAgIHZhciBwYXlsb2FkID0ge1xuXHQgICAgICBjdXJyZW50U3RlcDogdG91ck9iamVjdC50b3VyLmdldEN1cnJlbnRTdGVwKCkuaWQucmVwbGFjZSgnc3RlcC0nLCAnJyksXG5cdCAgICAgIHRvdXJOYW1lOiB0b3VyT2JqZWN0Lm5hbWVcblx0ICAgIH07XG5cblx0ICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KCdjYW5jZWwnLCB7ICdkZXRhaWwnOiBwYXlsb2FkIH0pKTtcblx0ICAgIHRvdXJPYmplY3QudG91ci5jYW5jZWwoKTtcblx0ICB9XG5cdH07XG5cblxuLyoqKi8gfSxcbi8qIDkgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdHZhciBfX1dFQlBBQ0tfQU1EX0RFRklORV9GQUNUT1JZX18sIF9fV0VCUEFDS19BTURfREVGSU5FX0FSUkFZX18sIF9fV0VCUEFDS19BTURfREVGSU5FX1JFU1VMVF9fOy8qISB0ZXRoZXItc2hlcGhlcmQgMS4yLjAgKi9cblxuXHQoZnVuY3Rpb24ocm9vdCwgZmFjdG9yeSkge1xuXHQgIGlmICh0cnVlKSB7XG5cdCAgICAhKF9fV0VCUEFDS19BTURfREVGSU5FX0FSUkFZX18gPSBbX193ZWJwYWNrX3JlcXVpcmVfXygxMCldLCBfX1dFQlBBQ0tfQU1EX0RFRklORV9GQUNUT1JZX18gPSAoZmFjdG9yeSksIF9fV0VCUEFDS19BTURfREVGSU5FX1JFU1VMVF9fID0gKHR5cGVvZiBfX1dFQlBBQ0tfQU1EX0RFRklORV9GQUNUT1JZX18gPT09ICdmdW5jdGlvbicgPyAoX19XRUJQQUNLX0FNRF9ERUZJTkVfRkFDVE9SWV9fLmFwcGx5KGV4cG9ydHMsIF9fV0VCUEFDS19BTURfREVGSU5FX0FSUkFZX18pKSA6IF9fV0VCUEFDS19BTURfREVGSU5FX0ZBQ1RPUllfXyksIF9fV0VCUEFDS19BTURfREVGSU5FX1JFU1VMVF9fICE9PSB1bmRlZmluZWQgJiYgKG1vZHVsZS5leHBvcnRzID0gX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX18pKTtcblx0ICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ3RldGhlcicpKTtcblx0ICB9IGVsc2Uge1xuXHQgICAgcm9vdC5TaGVwaGVyZCA9IGZhY3Rvcnkocm9vdC5UZXRoZXIpO1xuXHQgIH1cblx0fSh0aGlzLCBmdW5jdGlvbihUZXRoZXIpIHtcblxuXHQvKiBnbG9iYWwgVGV0aGVyICovXG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKCd2YWx1ZScgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cblx0dmFyIF9nZXQgPSBmdW5jdGlvbiBnZXQoX3g1LCBfeDYsIF94NykgeyB2YXIgX2FnYWluID0gdHJ1ZTsgX2Z1bmN0aW9uOiB3aGlsZSAoX2FnYWluKSB7IHZhciBvYmplY3QgPSBfeDUsIHByb3BlcnR5ID0gX3g2LCByZWNlaXZlciA9IF94NzsgZGVzYyA9IHBhcmVudCA9IGdldHRlciA9IHVuZGVmaW5lZDsgX2FnYWluID0gZmFsc2U7IGlmIChvYmplY3QgPT09IG51bGwpIG9iamVjdCA9IEZ1bmN0aW9uLnByb3RvdHlwZTsgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgcHJvcGVydHkpOyBpZiAoZGVzYyA9PT0gdW5kZWZpbmVkKSB7IHZhciBwYXJlbnQgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqZWN0KTsgaWYgKHBhcmVudCA9PT0gbnVsbCkgeyByZXR1cm4gdW5kZWZpbmVkOyB9IGVsc2UgeyBfeDUgPSBwYXJlbnQ7IF94NiA9IHByb3BlcnR5OyBfeDcgPSByZWNlaXZlcjsgX2FnYWluID0gdHJ1ZTsgY29udGludWUgX2Z1bmN0aW9uOyB9IH0gZWxzZSBpZiAoJ3ZhbHVlJyBpbiBkZXNjKSB7IHJldHVybiBkZXNjLnZhbHVlOyB9IGVsc2UgeyB2YXIgZ2V0dGVyID0gZGVzYy5nZXQ7IGlmIChnZXR0ZXIgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gdW5kZWZpbmVkOyB9IHJldHVybiBnZXR0ZXIuY2FsbChyZWNlaXZlcik7IH0gfSB9O1xuXG5cdGZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG5cdGZ1bmN0aW9uIF9pbmhlcml0cyhzdWJDbGFzcywgc3VwZXJDbGFzcykgeyBpZiAodHlwZW9mIHN1cGVyQ2xhc3MgIT09ICdmdW5jdGlvbicgJiYgc3VwZXJDbGFzcyAhPT0gbnVsbCkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdTdXBlciBleHByZXNzaW9uIG11c3QgZWl0aGVyIGJlIG51bGwgb3IgYSBmdW5jdGlvbiwgbm90ICcgKyB0eXBlb2Ygc3VwZXJDbGFzcyk7IH0gc3ViQ2xhc3MucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzICYmIHN1cGVyQ2xhc3MucHJvdG90eXBlLCB7IGNvbnN0cnVjdG9yOiB7IHZhbHVlOiBzdWJDbGFzcywgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiB0cnVlLCBjb25maWd1cmFibGU6IHRydWUgfSB9KTsgaWYgKHN1cGVyQ2xhc3MpIE9iamVjdC5zZXRQcm90b3R5cGVPZiA/IE9iamVjdC5zZXRQcm90b3R5cGVPZihzdWJDbGFzcywgc3VwZXJDbGFzcykgOiBzdWJDbGFzcy5fX3Byb3RvX18gPSBzdXBlckNsYXNzOyB9XG5cblx0dmFyIF9UZXRoZXIkVXRpbHMgPSBUZXRoZXIuVXRpbHM7XG5cdHZhciBFdmVudGVkID0gX1RldGhlciRVdGlscy5FdmVudGVkO1xuXHR2YXIgYWRkQ2xhc3MgPSBfVGV0aGVyJFV0aWxzLmFkZENsYXNzO1xuXHR2YXIgZXh0ZW5kID0gX1RldGhlciRVdGlscy5leHRlbmQ7XG5cdHZhciBoYXNDbGFzcyA9IF9UZXRoZXIkVXRpbHMuaGFzQ2xhc3M7XG5cdHZhciByZW1vdmVDbGFzcyA9IF9UZXRoZXIkVXRpbHMucmVtb3ZlQ2xhc3M7XG5cdHZhciB1bmlxdWVJZCA9IF9UZXRoZXIkVXRpbHMudW5pcXVlSWQ7XG5cblx0dmFyIFNoZXBoZXJkID0gbmV3IEV2ZW50ZWQoKTtcblxuXHR2YXIgQVRUQUNITUVOVCA9IHtcblx0ICAndG9wJzogJ2JvdHRvbSBjZW50ZXInLFxuXHQgICdsZWZ0JzogJ21pZGRsZSByaWdodCcsXG5cdCAgJ3JpZ2h0JzogJ21pZGRsZSBsZWZ0Jyxcblx0ICAnYm90dG9tJzogJ3RvcCBjZW50ZXInLFxuXHQgICdjZW50ZXInOiAnbWlkZGxlIGNlbnRlcidcblx0fTtcblxuXHRmdW5jdGlvbiBjcmVhdGVGcm9tSFRNTChodG1sKSB7XG5cdCAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdCAgZWwuaW5uZXJIVE1MID0gaHRtbDtcblx0ICByZXR1cm4gZWwuY2hpbGRyZW5bMF07XG5cdH1cblxuXHRmdW5jdGlvbiBtYXRjaGVzU2VsZWN0b3IoZWwsIHNlbCkge1xuXHQgIHZhciBtYXRjaGVzID0gdW5kZWZpbmVkO1xuXHQgIGlmICh0eXBlb2YgZWwubWF0Y2hlcyAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIG1hdGNoZXMgPSBlbC5tYXRjaGVzO1xuXHQgIH0gZWxzZSBpZiAodHlwZW9mIGVsLm1hdGNoZXNTZWxlY3RvciAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIG1hdGNoZXMgPSBlbC5tYXRjaGVzU2VsZWN0b3I7XG5cdCAgfSBlbHNlIGlmICh0eXBlb2YgZWwubXNNYXRjaGVzU2VsZWN0b3IgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICBtYXRjaGVzID0gZWwubXNNYXRjaGVzU2VsZWN0b3I7XG5cdCAgfSBlbHNlIGlmICh0eXBlb2YgZWwud2Via2l0TWF0Y2hlc1NlbGVjdG9yICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgbWF0Y2hlcyA9IGVsLndlYmtpdE1hdGNoZXNTZWxlY3Rvcjtcblx0ICB9IGVsc2UgaWYgKHR5cGVvZiBlbC5tb3pNYXRjaGVzU2VsZWN0b3IgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICBtYXRjaGVzID0gZWwubW96TWF0Y2hlc1NlbGVjdG9yO1xuXHQgIH0gZWxzZSBpZiAodHlwZW9mIGVsLm9NYXRjaGVzU2VsZWN0b3IgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICBtYXRjaGVzID0gZWwub01hdGNoZXNTZWxlY3Rvcjtcblx0ICB9XG5cdCAgcmV0dXJuIG1hdGNoZXMuY2FsbChlbCwgc2VsKTtcblx0fVxuXG5cdGZ1bmN0aW9uIHBhcnNlU2hvcnRoYW5kKG9iaiwgcHJvcHMpIHtcblx0ICBpZiAob2JqID09PSBudWxsIHx8IHR5cGVvZiBvYmogPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICByZXR1cm4gb2JqO1xuXHQgIH0gZWxzZSBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpIHtcblx0ICAgIHJldHVybiBvYmo7XG5cdCAgfVxuXG5cdCAgdmFyIHZhbHMgPSBvYmouc3BsaXQoJyAnKTtcblx0ICB2YXIgdmFsc0xlbiA9IHZhbHMubGVuZ3RoO1xuXHQgIHZhciBwcm9wc0xlbiA9IHByb3BzLmxlbmd0aDtcblx0ICBpZiAodmFsc0xlbiA+IHByb3BzTGVuKSB7XG5cdCAgICB2YWxzWzBdID0gdmFscy5zbGljZSgwLCB2YWxzTGVuIC0gcHJvcHNMZW4gKyAxKS5qb2luKCcgJyk7XG5cdCAgICB2YWxzLnNwbGljZSgxLCAodmFsc0xlbiwgcHJvcHNMZW4pKTtcblx0ICB9XG5cblx0ICB2YXIgb3V0ID0ge307XG5cdCAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wc0xlbjsgKytpKSB7XG5cdCAgICB2YXIgcHJvcCA9IHByb3BzW2ldO1xuXHQgICAgb3V0W3Byb3BdID0gdmFsc1tpXTtcblx0ICB9XG5cblx0ICByZXR1cm4gb3V0O1xuXHR9XG5cblx0dmFyIFN0ZXAgPSAoZnVuY3Rpb24gKF9FdmVudGVkKSB7XG5cdCAgX2luaGVyaXRzKFN0ZXAsIF9FdmVudGVkKTtcblxuXHQgIGZ1bmN0aW9uIFN0ZXAodG91ciwgb3B0aW9ucykge1xuXHQgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFN0ZXApO1xuXG5cdCAgICBfZ2V0KE9iamVjdC5nZXRQcm90b3R5cGVPZihTdGVwLnByb3RvdHlwZSksICdjb25zdHJ1Y3RvcicsIHRoaXMpLmNhbGwodGhpcywgdG91ciwgb3B0aW9ucyk7XG5cdCAgICB0aGlzLnRvdXIgPSB0b3VyO1xuXHQgICAgdGhpcy5iaW5kTWV0aG9kcygpO1xuXHQgICAgdGhpcy5zZXRPcHRpb25zKG9wdGlvbnMpO1xuXHQgICAgcmV0dXJuIHRoaXM7XG5cdCAgfVxuXG5cdCAgX2NyZWF0ZUNsYXNzKFN0ZXAsIFt7XG5cdCAgICBrZXk6ICdiaW5kTWV0aG9kcycsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gYmluZE1ldGhvZHMoKSB7XG5cdCAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cblx0ICAgICAgdmFyIG1ldGhvZHMgPSBbJ19zaG93JywgJ3Nob3cnLCAnaGlkZScsICdpc09wZW4nLCAnY2FuY2VsJywgJ2NvbXBsZXRlJywgJ3Njcm9sbFRvJywgJ2Rlc3Ryb3knXTtcblx0ICAgICAgbWV0aG9kcy5tYXAoZnVuY3Rpb24gKG1ldGhvZCkge1xuXHQgICAgICAgIF90aGlzW21ldGhvZF0gPSBfdGhpc1ttZXRob2RdLmJpbmQoX3RoaXMpO1xuXHQgICAgICB9KTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdzZXRPcHRpb25zJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBzZXRPcHRpb25zKCkge1xuXHQgICAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzBdO1xuXG5cdCAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cdCAgICAgIHRoaXMuZGVzdHJveSgpO1xuXG5cdCAgICAgIHRoaXMuaWQgPSB0aGlzLm9wdGlvbnMuaWQgfHwgdGhpcy5pZCB8fCAnc3RlcC0nICsgdW5pcXVlSWQoKTtcblxuXHQgICAgICB2YXIgd2hlbiA9IHRoaXMub3B0aW9ucy53aGVuO1xuXHQgICAgICBpZiAod2hlbikge1xuXHQgICAgICAgIGZvciAodmFyIF9ldmVudCBpbiB3aGVuKSB7XG5cdCAgICAgICAgICBpZiAoKHt9KS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHdoZW4sIF9ldmVudCkpIHtcblx0ICAgICAgICAgICAgdmFyIGhhbmRsZXIgPSB3aGVuW19ldmVudF07XG5cdCAgICAgICAgICAgIHRoaXMub24oX2V2ZW50LCBoYW5kbGVyLCB0aGlzKTtcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAoIXRoaXMub3B0aW9ucy5idXR0b25zKSB7XG5cdCAgICAgICAgdGhpcy5vcHRpb25zLmJ1dHRvbnMgPSBbe1xuXHQgICAgICAgICAgdGV4dDogJ05leHQnLFxuXHQgICAgICAgICAgYWN0aW9uOiB0aGlzLnRvdXIubmV4dFxuXHQgICAgICAgIH1dO1xuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnZ2V0VG91cicsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0VG91cigpIHtcblx0ICAgICAgcmV0dXJuIHRoaXMudG91cjtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdiaW5kQWR2YW5jZScsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gYmluZEFkdmFuY2UoKSB7XG5cdCAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuXG5cdCAgICAgIC8vIEFuIGVtcHR5IHNlbGVjdG9yIG1hdGNoZXMgdGhlIHN0ZXAgZWxlbWVudFxuXG5cdCAgICAgIHZhciBfcGFyc2VTaG9ydGhhbmQgPSBwYXJzZVNob3J0aGFuZCh0aGlzLm9wdGlvbnMuYWR2YW5jZU9uLCBbJ3NlbGVjdG9yJywgJ2V2ZW50J10pO1xuXG5cdCAgICAgIHZhciBldmVudCA9IF9wYXJzZVNob3J0aGFuZC5ldmVudDtcblx0ICAgICAgdmFyIHNlbGVjdG9yID0gX3BhcnNlU2hvcnRoYW5kLnNlbGVjdG9yO1xuXG5cdCAgICAgIHZhciBoYW5kbGVyID0gZnVuY3Rpb24gaGFuZGxlcihlKSB7XG5cdCAgICAgICAgaWYgKCFfdGhpczIuaXNPcGVuKCkpIHtcblx0ICAgICAgICAgIHJldHVybjtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAodHlwZW9mIHNlbGVjdG9yICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgICAgaWYgKG1hdGNoZXNTZWxlY3RvcihlLnRhcmdldCwgc2VsZWN0b3IpKSB7XG5cdCAgICAgICAgICAgIF90aGlzMi50b3VyLm5leHQoKTtcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgaWYgKF90aGlzMi5lbCAmJiBlLnRhcmdldCA9PT0gX3RoaXMyLmVsKSB7XG5cdCAgICAgICAgICAgIF90aGlzMi50b3VyLm5leHQoKTtcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgIH07XG5cblx0ICAgICAgLy8gVE9ETzogdGhpcyBzaG91bGQgYWxzbyBiaW5kL3VuYmluZCBvbiBzaG93L2hpZGVcblx0ICAgICAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyKTtcblx0ICAgICAgdGhpcy5vbignZGVzdHJveScsIGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICByZXR1cm4gZG9jdW1lbnQuYm9keS5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyKTtcblx0ICAgICAgfSk7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnZ2V0QXR0YWNoVG8nLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGdldEF0dGFjaFRvKCkge1xuXHQgICAgICB2YXIgb3B0cyA9IHBhcnNlU2hvcnRoYW5kKHRoaXMub3B0aW9ucy5hdHRhY2hUbywgWydlbGVtZW50JywgJ29uJ10pIHx8IHt9O1xuXHQgICAgICB2YXIgc2VsZWN0b3IgPSBvcHRzLmVsZW1lbnQ7XG5cblx0ICAgICAgaWYgKHR5cGVvZiBzZWxlY3RvciA9PT0gJ3N0cmluZycpIHtcblx0ICAgICAgICBvcHRzLmVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcblxuXHQgICAgICAgIGlmICghb3B0cy5lbGVtZW50KSB7XG5cdCAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSBlbGVtZW50IGZvciB0aGlzIFNoZXBoZXJkIHN0ZXAgd2FzIG5vdCBmb3VuZCAnICsgc2VsZWN0b3IpO1xuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXG5cdCAgICAgIHJldHVybiBvcHRzO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ3NldHVwVGV0aGVyJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBzZXR1cFRldGhlcigpIHtcblx0ICAgICAgaWYgKHR5cGVvZiBUZXRoZXIgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVXNpbmcgdGhlIGF0dGFjaG1lbnQgZmVhdHVyZSBvZiBTaGVwaGVyZCByZXF1aXJlcyB0aGUgVGV0aGVyIGxpYnJhcnlcIik7XG5cdCAgICAgIH1cblxuXHQgICAgICB2YXIgb3B0cyA9IHRoaXMuZ2V0QXR0YWNoVG8oKTtcblx0ICAgICAgdmFyIGF0dGFjaG1lbnQgPSBBVFRBQ0hNRU5UW29wdHMub24gfHwgJ3JpZ2h0J107XG5cdCAgICAgIGlmICh0eXBlb2Ygb3B0cy5lbGVtZW50ID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIG9wdHMuZWxlbWVudCA9ICd2aWV3cG9ydCc7XG5cdCAgICAgICAgYXR0YWNobWVudCA9ICdtaWRkbGUgY2VudGVyJztcblx0ICAgICAgfVxuXG5cdCAgICAgIHZhciB0ZXRoZXJPcHRzID0ge1xuXHQgICAgICAgIGNsYXNzUHJlZml4OiAnc2hlcGhlcmQnLFxuXHQgICAgICAgIGVsZW1lbnQ6IHRoaXMuZWwsXG5cdCAgICAgICAgY29uc3RyYWludHM6IFt7XG5cdCAgICAgICAgICB0bzogJ3dpbmRvdycsXG5cdCAgICAgICAgICBwaW46IHRydWUsXG5cdCAgICAgICAgICBhdHRhY2htZW50OiAndG9nZXRoZXInXG5cdCAgICAgICAgfV0sXG5cdCAgICAgICAgdGFyZ2V0OiBvcHRzLmVsZW1lbnQsXG5cdCAgICAgICAgb2Zmc2V0OiBvcHRzLm9mZnNldCB8fCAnMCAwJyxcblx0ICAgICAgICBhdHRhY2htZW50OiBhdHRhY2htZW50XG5cdCAgICAgIH07XG5cblx0ICAgICAgaWYgKHRoaXMudGV0aGVyKSB7XG5cdCAgICAgICAgdGhpcy50ZXRoZXIuZGVzdHJveSgpO1xuXHQgICAgICB9XG5cblx0ICAgICAgdGhpcy50ZXRoZXIgPSBuZXcgVGV0aGVyKGV4dGVuZCh0ZXRoZXJPcHRzLCB0aGlzLm9wdGlvbnMudGV0aGVyT3B0aW9ucykpO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ3Nob3cnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIHNob3coKSB7XG5cdCAgICAgIHZhciBfdGhpczMgPSB0aGlzO1xuXG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5vcHRpb25zLmJlZm9yZVNob3dQcm9taXNlICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIHZhciBiZWZvcmVTaG93UHJvbWlzZSA9IHRoaXMub3B0aW9ucy5iZWZvcmVTaG93UHJvbWlzZSgpO1xuXHQgICAgICAgIGlmICh0eXBlb2YgYmVmb3JlU2hvd1Byb21pc2UgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgICByZXR1cm4gYmVmb3JlU2hvd1Byb21pc2UudGhlbihmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBfdGhpczMuX3Nob3coKTtcblx0ICAgICAgICAgIH0pO1xuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXHQgICAgICB0aGlzLl9zaG93KCk7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnX3Nob3cnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIF9zaG93KCkge1xuXHQgICAgICB2YXIgX3RoaXM0ID0gdGhpcztcblxuXHQgICAgICB0aGlzLnRyaWdnZXIoJ2JlZm9yZS1zaG93Jyk7XG5cblx0ICAgICAgaWYgKCF0aGlzLmVsKSB7XG5cdCAgICAgICAgdGhpcy5yZW5kZXIoKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGFkZENsYXNzKHRoaXMuZWwsICdzaGVwaGVyZC1vcGVuJyk7XG5cblx0ICAgICAgZG9jdW1lbnQuYm9keS5zZXRBdHRyaWJ1dGUoJ2RhdGEtc2hlcGhlcmQtc3RlcCcsIHRoaXMuaWQpO1xuXG5cdCAgICAgIHRoaXMuc2V0dXBUZXRoZXIoKTtcblxuXHQgICAgICBpZiAodGhpcy5vcHRpb25zLnNjcm9sbFRvKSB7XG5cdCAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICBfdGhpczQuc2Nyb2xsVG8oKTtcblx0ICAgICAgICB9KTtcblx0ICAgICAgfVxuXG5cdCAgICAgIHRoaXMudHJpZ2dlcignc2hvdycpO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2hpZGUnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGhpZGUoKSB7XG5cdCAgICAgIHRoaXMudHJpZ2dlcignYmVmb3JlLWhpZGUnKTtcblxuXHQgICAgICByZW1vdmVDbGFzcyh0aGlzLmVsLCAnc2hlcGhlcmQtb3BlbicpO1xuXG5cdCAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXNoZXBoZXJkLXN0ZXAnKTtcblxuXHQgICAgICBpZiAodGhpcy50ZXRoZXIpIHtcblx0ICAgICAgICB0aGlzLnRldGhlci5kZXN0cm95KCk7XG5cdCAgICAgIH1cblx0ICAgICAgdGhpcy50ZXRoZXIgPSBudWxsO1xuXG5cdCAgICAgIHRoaXMudHJpZ2dlcignaGlkZScpO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2lzT3BlbicsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gaXNPcGVuKCkge1xuXHQgICAgICByZXR1cm4gaGFzQ2xhc3ModGhpcy5lbCwgJ3NoZXBoZXJkLW9wZW4nKTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdjYW5jZWwnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGNhbmNlbCgpIHtcblx0ICAgICAgdGhpcy50b3VyLmNhbmNlbCgpO1xuXHQgICAgICB0aGlzLnRyaWdnZXIoJ2NhbmNlbCcpO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2NvbXBsZXRlJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBjb21wbGV0ZSgpIHtcblx0ICAgICAgdGhpcy50b3VyLmNvbXBsZXRlKCk7XG5cdCAgICAgIHRoaXMudHJpZ2dlcignY29tcGxldGUnKTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdzY3JvbGxUbycsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gc2Nyb2xsVG8oKSB7XG5cdCAgICAgIHZhciBfZ2V0QXR0YWNoVG8gPSB0aGlzLmdldEF0dGFjaFRvKCk7XG5cblx0ICAgICAgdmFyIGVsZW1lbnQgPSBfZ2V0QXR0YWNoVG8uZWxlbWVudDtcblxuXHQgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5zY3JvbGxUb0hhbmRsZXIgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgdGhpcy5vcHRpb25zLnNjcm9sbFRvSGFuZGxlcihlbGVtZW50KTtcblx0ICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZWxlbWVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICBlbGVtZW50LnNjcm9sbEludG9WaWV3KCk7XG5cdCAgICAgIH1cblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdkZXN0cm95Jyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBkZXN0cm95KCkge1xuXHQgICAgICBpZiAodHlwZW9mIHRoaXMuZWwgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCh0aGlzLmVsKTtcblx0ICAgICAgICBkZWxldGUgdGhpcy5lbDtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICh0aGlzLnRldGhlcikge1xuXHQgICAgICAgIHRoaXMudGV0aGVyLmRlc3Ryb3koKTtcblx0ICAgICAgfVxuXHQgICAgICB0aGlzLnRldGhlciA9IG51bGw7XG5cblx0ICAgICAgdGhpcy50cmlnZ2VyKCdkZXN0cm95Jyk7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAncmVuZGVyJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiByZW5kZXIoKSB7XG5cdCAgICAgIHZhciBfdGhpczUgPSB0aGlzO1xuXG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5lbCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICB0aGlzLmRlc3Ryb3koKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIHRoaXMuZWwgPSBjcmVhdGVGcm9tSFRNTCgnPGRpdiBjbGFzcz1cXCdzaGVwaGVyZC1zdGVwICcgKyAodGhpcy5vcHRpb25zLmNsYXNzZXMgfHwgJycpICsgJ1xcJyBkYXRhLWlkPVxcJycgKyB0aGlzLmlkICsgJ1xcJyAnICsgKHRoaXMub3B0aW9ucy5pZEF0dHJpYnV0ZSA/ICdpZD1cIicgKyB0aGlzLm9wdGlvbnMuaWRBdHRyaWJ1dGUgKyAnXCInIDogJycpICsgJz48L2Rpdj4nKTtcblxuXHQgICAgICB2YXIgY29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHQgICAgICBjb250ZW50LmNsYXNzTmFtZSA9ICdzaGVwaGVyZC1jb250ZW50Jztcblx0ICAgICAgdGhpcy5lbC5hcHBlbmRDaGlsZChjb250ZW50KTtcblxuXHQgICAgICB2YXIgaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaGVhZGVyJyk7XG5cdCAgICAgIGNvbnRlbnQuYXBwZW5kQ2hpbGQoaGVhZGVyKTtcblxuXHQgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy50aXRsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICBoZWFkZXIuaW5uZXJIVE1MICs9ICc8aDMgY2xhc3M9XFwnc2hlcGhlcmQtdGl0bGVcXCc+JyArIHRoaXMub3B0aW9ucy50aXRsZSArICc8L2gzPic7XG5cdCAgICAgICAgdGhpcy5lbC5jbGFzc05hbWUgKz0gJyBzaGVwaGVyZC1oYXMtdGl0bGUnO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKHRoaXMub3B0aW9ucy5zaG93Q2FuY2VsTGluaykge1xuXHQgICAgICAgIHZhciBsaW5rID0gY3JlYXRlRnJvbUhUTUwoXCI8YSBocmVmIGNsYXNzPSdzaGVwaGVyZC1jYW5jZWwtbGluayc+4pyVPC9hPlwiKTtcblx0ICAgICAgICBoZWFkZXIuYXBwZW5kQ2hpbGQobGluayk7XG5cblx0ICAgICAgICB0aGlzLmVsLmNsYXNzTmFtZSArPSAnIHNoZXBoZXJkLWhhcy1jYW5jZWwtbGluayc7XG5cblx0ICAgICAgICB0aGlzLmJpbmRDYW5jZWxMaW5rKGxpbmspO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMudGV4dCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICAoZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgdmFyIHRleHQgPSBjcmVhdGVGcm9tSFRNTChcIjxkaXYgY2xhc3M9J3NoZXBoZXJkLXRleHQnPjwvZGl2PlwiKTtcblx0ICAgICAgICAgIHZhciBwYXJhZ3JhcGhzID0gX3RoaXM1Lm9wdGlvbnMudGV4dDtcblxuXHQgICAgICAgICAgaWYgKHR5cGVvZiBwYXJhZ3JhcGhzID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgICAgIHBhcmFncmFwaHMgPSBwYXJhZ3JhcGhzLmNhbGwoX3RoaXM1LCB0ZXh0KTtcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgaWYgKHBhcmFncmFwaHMgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkge1xuXHQgICAgICAgICAgICB0ZXh0LmFwcGVuZENoaWxkKHBhcmFncmFwaHMpO1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXJhZ3JhcGhzID09PSAnc3RyaW5nJykge1xuXHQgICAgICAgICAgICAgIHBhcmFncmFwaHMgPSBbcGFyYWdyYXBoc107XG5cdCAgICAgICAgICAgIH1cblxuXHQgICAgICAgICAgICBwYXJhZ3JhcGhzLm1hcChmdW5jdGlvbiAocGFyYWdyYXBoKSB7XG5cdCAgICAgICAgICAgICAgdGV4dC5pbm5lckhUTUwgKz0gJzxwPicgKyBwYXJhZ3JhcGggKyAnPC9wPic7XG5cdCAgICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBjb250ZW50LmFwcGVuZENoaWxkKHRleHQpO1xuXHQgICAgICAgIH0pKCk7XG5cdCAgICAgIH1cblxuXHQgICAgICB2YXIgZm9vdGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZm9vdGVyJyk7XG5cblx0ICAgICAgaWYgKHRoaXMub3B0aW9ucy5idXR0b25zKSB7XG5cdCAgICAgICAgKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgIHZhciBidXR0b25zID0gY3JlYXRlRnJvbUhUTUwoXCI8dWwgY2xhc3M9J3NoZXBoZXJkLWJ1dHRvbnMnPjwvdWw+XCIpO1xuXG5cdCAgICAgICAgICBfdGhpczUub3B0aW9ucy5idXR0b25zLm1hcChmdW5jdGlvbiAoY2ZnKSB7XG5cdCAgICAgICAgICAgIHZhciBidXR0b24gPSBjcmVhdGVGcm9tSFRNTCgnPGxpPjxhIGNsYXNzPVxcJ3NoZXBoZXJkLWJ1dHRvbiAnICsgKGNmZy5jbGFzc2VzIHx8ICcnKSArICdcXCc+JyArIGNmZy50ZXh0ICsgJzwvYT4nKTtcblx0ICAgICAgICAgICAgYnV0dG9ucy5hcHBlbmRDaGlsZChidXR0b24pO1xuXHQgICAgICAgICAgICBfdGhpczUuYmluZEJ1dHRvbkV2ZW50cyhjZmcsIGJ1dHRvbi5xdWVyeVNlbGVjdG9yKCdhJykpO1xuXHQgICAgICAgICAgfSk7XG5cblx0ICAgICAgICAgIGZvb3Rlci5hcHBlbmRDaGlsZChidXR0b25zKTtcblx0ICAgICAgICB9KSgpO1xuXHQgICAgICB9XG5cblx0ICAgICAgY29udGVudC5hcHBlbmRDaGlsZChmb290ZXIpO1xuXG5cdCAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5lbCk7XG5cblx0ICAgICAgdGhpcy5zZXR1cFRldGhlcigpO1xuXG5cdCAgICAgIGlmICh0aGlzLm9wdGlvbnMuYWR2YW5jZU9uKSB7XG5cdCAgICAgICAgdGhpcy5iaW5kQWR2YW5jZSgpO1xuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnYmluZENhbmNlbExpbmsnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGJpbmRDYW5jZWxMaW5rKGxpbmspIHtcblx0ICAgICAgdmFyIF90aGlzNiA9IHRoaXM7XG5cblx0ICAgICAgbGluay5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XG5cdCAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHQgICAgICAgIF90aGlzNi5jYW5jZWwoKTtcblx0ICAgICAgfSk7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnYmluZEJ1dHRvbkV2ZW50cycsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gYmluZEJ1dHRvbkV2ZW50cyhjZmcsIGVsKSB7XG5cdCAgICAgIHZhciBfdGhpczcgPSB0aGlzO1xuXG5cdCAgICAgIGNmZy5ldmVudHMgPSBjZmcuZXZlbnRzIHx8IHt9O1xuXHQgICAgICBpZiAodHlwZW9mIGNmZy5hY3Rpb24gIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgLy8gSW5jbHVkaW5nIGJvdGggYSBjbGljayBldmVudCBhbmQgYW4gYWN0aW9uIGlzIG5vdCBzdXBwb3J0ZWRcblx0ICAgICAgICBjZmcuZXZlbnRzLmNsaWNrID0gY2ZnLmFjdGlvbjtcblx0ICAgICAgfVxuXG5cdCAgICAgIGZvciAodmFyIF9ldmVudDIgaW4gY2ZnLmV2ZW50cykge1xuXHQgICAgICAgIGlmICgoe30pLmhhc093blByb3BlcnR5LmNhbGwoY2ZnLmV2ZW50cywgX2V2ZW50MikpIHtcblx0ICAgICAgICAgIHZhciBoYW5kbGVyID0gY2ZnLmV2ZW50c1tfZXZlbnQyXTtcblx0ICAgICAgICAgIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ3N0cmluZycpIHtcblx0ICAgICAgICAgICAgKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICB2YXIgcGFnZSA9IGhhbmRsZXI7XG5cdCAgICAgICAgICAgICAgaGFuZGxlciA9IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICAgIHJldHVybiBfdGhpczcudG91ci5zaG93KHBhZ2UpO1xuXHQgICAgICAgICAgICAgIH07XG5cdCAgICAgICAgICAgIH0pKCk7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKF9ldmVudDIsIGhhbmRsZXIpO1xuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXG5cdCAgICAgIHRoaXMub24oJ2Rlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgZm9yICh2YXIgX2V2ZW50MyBpbiBjZmcuZXZlbnRzKSB7XG5cdCAgICAgICAgICBpZiAoKHt9KS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGNmZy5ldmVudHMsIF9ldmVudDMpKSB7XG5cdCAgICAgICAgICAgIHZhciBoYW5kbGVyID0gY2ZnLmV2ZW50c1tfZXZlbnQzXTtcblx0ICAgICAgICAgICAgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihfZXZlbnQzLCBoYW5kbGVyKTtcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgIH0pO1xuXHQgICAgfVxuXHQgIH1dKTtcblxuXHQgIHJldHVybiBTdGVwO1xuXHR9KShFdmVudGVkKTtcblxuXHR2YXIgVG91ciA9IChmdW5jdGlvbiAoX0V2ZW50ZWQyKSB7XG5cdCAgX2luaGVyaXRzKFRvdXIsIF9FdmVudGVkMik7XG5cblx0ICBmdW5jdGlvbiBUb3VyKCkge1xuXHQgICAgdmFyIF90aGlzOCA9IHRoaXM7XG5cblx0ICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMF07XG5cblx0ICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBUb3VyKTtcblxuXHQgICAgX2dldChPYmplY3QuZ2V0UHJvdG90eXBlT2YoVG91ci5wcm90b3R5cGUpLCAnY29uc3RydWN0b3InLCB0aGlzKS5jYWxsKHRoaXMsIG9wdGlvbnMpO1xuXHQgICAgdGhpcy5iaW5kTWV0aG9kcygpO1xuXHQgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcblx0ICAgIHRoaXMuc3RlcHMgPSB0aGlzLm9wdGlvbnMuc3RlcHMgfHwgW107XG5cblx0ICAgIC8vIFBhc3MgdGhlc2UgZXZlbnRzIG9udG8gdGhlIGdsb2JhbCBTaGVwaGVyZCBvYmplY3Rcblx0ICAgIHZhciBldmVudHMgPSBbJ2NvbXBsZXRlJywgJ2NhbmNlbCcsICdoaWRlJywgJ3N0YXJ0JywgJ3Nob3cnLCAnYWN0aXZlJywgJ2luYWN0aXZlJ107XG5cdCAgICBldmVudHMubWFwKGZ1bmN0aW9uIChldmVudCkge1xuXHQgICAgICAoZnVuY3Rpb24gKGUpIHtcblx0ICAgICAgICBfdGhpczgub24oZSwgZnVuY3Rpb24gKG9wdHMpIHtcblx0ICAgICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXHQgICAgICAgICAgb3B0cy50b3VyID0gX3RoaXM4O1xuXHQgICAgICAgICAgU2hlcGhlcmQudHJpZ2dlcihlLCBvcHRzKTtcblx0ICAgICAgICB9KTtcblx0ICAgICAgfSkoZXZlbnQpO1xuXHQgICAgfSk7XG5cblx0ICAgIHJldHVybiB0aGlzO1xuXHQgIH1cblxuXHQgIF9jcmVhdGVDbGFzcyhUb3VyLCBbe1xuXHQgICAga2V5OiAnYmluZE1ldGhvZHMnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGJpbmRNZXRob2RzKCkge1xuXHQgICAgICB2YXIgX3RoaXM5ID0gdGhpcztcblxuXHQgICAgICB2YXIgbWV0aG9kcyA9IFsnbmV4dCcsICdiYWNrJywgJ2NhbmNlbCcsICdjb21wbGV0ZScsICdoaWRlJ107XG5cdCAgICAgIG1ldGhvZHMubWFwKGZ1bmN0aW9uIChtZXRob2QpIHtcblx0ICAgICAgICBfdGhpczlbbWV0aG9kXSA9IF90aGlzOVttZXRob2RdLmJpbmQoX3RoaXM5KTtcblx0ICAgICAgfSk7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnYWRkU3RlcCcsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gYWRkU3RlcChuYW1lLCBzdGVwKSB7XG5cdCAgICAgIGlmICh0eXBlb2Ygc3RlcCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICBzdGVwID0gbmFtZTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICghKHN0ZXAgaW5zdGFuY2VvZiBTdGVwKSkge1xuXHQgICAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIG5hbWUgPT09ICdudW1iZXInKSB7XG5cdCAgICAgICAgICBzdGVwLmlkID0gbmFtZS50b1N0cmluZygpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBzdGVwID0gZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMuZGVmYXVsdHMsIHN0ZXApO1xuXHQgICAgICAgIHN0ZXAgPSBuZXcgU3RlcCh0aGlzLCBzdGVwKTtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICBzdGVwLnRvdXIgPSB0aGlzO1xuXHQgICAgICB9XG5cblx0ICAgICAgdGhpcy5zdGVwcy5wdXNoKHN0ZXApO1xuXHQgICAgICByZXR1cm4gdGhpcztcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdnZXRCeUlkJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRCeUlkKGlkKSB7XG5cdCAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zdGVwcy5sZW5ndGg7ICsraSkge1xuXHQgICAgICAgIHZhciBzdGVwID0gdGhpcy5zdGVwc1tpXTtcblx0ICAgICAgICBpZiAoc3RlcC5pZCA9PT0gaWQpIHtcblx0ICAgICAgICAgIHJldHVybiBzdGVwO1xuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2dldEN1cnJlbnRTdGVwJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRDdXJyZW50U3RlcCgpIHtcblx0ICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFN0ZXA7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnbmV4dCcsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gbmV4dCgpIHtcblx0ICAgICAgdmFyIGluZGV4ID0gdGhpcy5zdGVwcy5pbmRleE9mKHRoaXMuY3VycmVudFN0ZXApO1xuXG5cdCAgICAgIGlmIChpbmRleCA9PT0gdGhpcy5zdGVwcy5sZW5ndGggLSAxKSB7XG5cdCAgICAgICAgdGhpcy5oaWRlKGluZGV4KTtcblx0ICAgICAgICB0aGlzLnRyaWdnZXIoJ2NvbXBsZXRlJyk7XG5cdCAgICAgICAgdGhpcy5kb25lKCk7XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgdGhpcy5zaG93KGluZGV4ICsgMSwgdHJ1ZSk7XG5cdCAgICAgIH1cblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdiYWNrJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBiYWNrKCkge1xuXHQgICAgICB2YXIgaW5kZXggPSB0aGlzLnN0ZXBzLmluZGV4T2YodGhpcy5jdXJyZW50U3RlcCk7XG5cdCAgICAgIHRoaXMuc2hvdyhpbmRleCAtIDEsIGZhbHNlKTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdjYW5jZWwnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGNhbmNlbCgpIHtcblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLmN1cnJlbnRTdGVwICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIHRoaXMuY3VycmVudFN0ZXAuaGlkZSgpO1xuXHQgICAgICB9XG5cdCAgICAgIHRoaXMudHJpZ2dlcignY2FuY2VsJyk7XG5cdCAgICAgIHRoaXMuZG9uZSgpO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2NvbXBsZXRlJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBjb21wbGV0ZSgpIHtcblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLmN1cnJlbnRTdGVwICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIHRoaXMuY3VycmVudFN0ZXAuaGlkZSgpO1xuXHQgICAgICB9XG5cdCAgICAgIHRoaXMudHJpZ2dlcignY29tcGxldGUnKTtcblx0ICAgICAgdGhpcy5kb25lKCk7XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnaGlkZScsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gaGlkZSgpIHtcblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLmN1cnJlbnRTdGVwICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIHRoaXMuY3VycmVudFN0ZXAuaGlkZSgpO1xuXHQgICAgICB9XG5cdCAgICAgIHRoaXMudHJpZ2dlcignaGlkZScpO1xuXHQgICAgICB0aGlzLmRvbmUoKTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdkb25lJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBkb25lKCkge1xuXHQgICAgICBTaGVwaGVyZC5hY3RpdmVUb3VyID0gbnVsbDtcblx0ICAgICAgcmVtb3ZlQ2xhc3MoZG9jdW1lbnQuYm9keSwgJ3NoZXBoZXJkLWFjdGl2ZScpO1xuXHQgICAgICB0aGlzLnRyaWdnZXIoJ2luYWN0aXZlJywgeyB0b3VyOiB0aGlzIH0pO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ3Nob3cnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIHNob3coKSB7XG5cdCAgICAgIHZhciBrZXkgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyAwIDogYXJndW1lbnRzWzBdO1xuXHQgICAgICB2YXIgZm9yd2FyZCA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMSB8fCBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IHRydWUgOiBhcmd1bWVudHNbMV07XG5cblx0ICAgICAgaWYgKHRoaXMuY3VycmVudFN0ZXApIHtcblx0ICAgICAgICB0aGlzLmN1cnJlbnRTdGVwLmhpZGUoKTtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICBhZGRDbGFzcyhkb2N1bWVudC5ib2R5LCAnc2hlcGhlcmQtYWN0aXZlJyk7XG5cdCAgICAgICAgdGhpcy50cmlnZ2VyKCdhY3RpdmUnLCB7IHRvdXI6IHRoaXMgfSk7XG5cdCAgICAgIH1cblxuXHQgICAgICBTaGVwaGVyZC5hY3RpdmVUb3VyID0gdGhpcztcblxuXHQgICAgICB2YXIgbmV4dCA9IHVuZGVmaW5lZDtcblxuXHQgICAgICBpZiAodHlwZW9mIGtleSA9PT0gJ3N0cmluZycpIHtcblx0ICAgICAgICBuZXh0ID0gdGhpcy5nZXRCeUlkKGtleSk7XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgbmV4dCA9IHRoaXMuc3RlcHNba2V5XTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmIChuZXh0KSB7XG5cdCAgICAgICAgaWYgKHR5cGVvZiBuZXh0Lm9wdGlvbnMuc2hvd09uICE9PSAndW5kZWZpbmVkJyAmJiAhbmV4dC5vcHRpb25zLnNob3dPbigpKSB7XG5cdCAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLnN0ZXBzLmluZGV4T2YobmV4dCk7XG5cdCAgICAgICAgICB2YXIgbmV4dEluZGV4ID0gZm9yd2FyZCA/IGluZGV4ICsgMSA6IGluZGV4IC0gMTtcblx0ICAgICAgICAgIHRoaXMuc2hvdyhuZXh0SW5kZXgsIGZvcndhcmQpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICB0aGlzLnRyaWdnZXIoJ3Nob3cnLCB7XG5cdCAgICAgICAgICAgIHN0ZXA6IG5leHQsXG5cdCAgICAgICAgICAgIHByZXZpb3VzOiB0aGlzLmN1cnJlbnRTdGVwXG5cdCAgICAgICAgICB9KTtcblxuXHQgICAgICAgICAgdGhpcy5jdXJyZW50U3RlcCA9IG5leHQ7XG5cdCAgICAgICAgICBuZXh0LnNob3coKTtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdzdGFydCcsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gc3RhcnQoKSB7XG5cdCAgICAgIHRoaXMudHJpZ2dlcignc3RhcnQnKTtcblxuXHQgICAgICB0aGlzLmN1cnJlbnRTdGVwID0gbnVsbDtcblx0ICAgICAgdGhpcy5uZXh0KCk7XG5cdCAgICB9XG5cdCAgfV0pO1xuXG5cdCAgcmV0dXJuIFRvdXI7XG5cdH0pKEV2ZW50ZWQpO1xuXG5cdGV4dGVuZChTaGVwaGVyZCwgeyBUb3VyOiBUb3VyLCBTdGVwOiBTdGVwLCBFdmVudGVkOiBFdmVudGVkIH0pO1xuXHRyZXR1cm4gU2hlcGhlcmQ7XG5cblx0fSkpO1xuXG5cbi8qKiovIH0sXG4vKiAxMCAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0dmFyIF9fV0VCUEFDS19BTURfREVGSU5FX0ZBQ1RPUllfXywgX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX187LyohIHRldGhlciAxLjIuMCAqL1xuXG5cdChmdW5jdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdCAgaWYgKHRydWUpIHtcblx0ICAgICEoX19XRUJQQUNLX0FNRF9ERUZJTkVfRkFDVE9SWV9fID0gKGZhY3RvcnkpLCBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXyA9ICh0eXBlb2YgX19XRUJQQUNLX0FNRF9ERUZJTkVfRkFDVE9SWV9fID09PSAnZnVuY3Rpb24nID8gKF9fV0VCUEFDS19BTURfREVGSU5FX0ZBQ1RPUllfXy5jYWxsKGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18sIGV4cG9ydHMsIG1vZHVsZSkpIDogX19XRUJQQUNLX0FNRF9ERUZJTkVfRkFDVE9SWV9fKSwgX19XRUJQQUNLX0FNRF9ERUZJTkVfUkVTVUxUX18gIT09IHVuZGVmaW5lZCAmJiAobW9kdWxlLmV4cG9ydHMgPSBfX1dFQlBBQ0tfQU1EX0RFRklORV9SRVNVTFRfXykpO1xuXHQgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKTtcblx0ICB9IGVsc2Uge1xuXHQgICAgcm9vdC5UZXRoZXIgPSBmYWN0b3J5KCk7XG5cdCAgfVxuXHR9KHRoaXMsIGZ1bmN0aW9uKHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSkge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHsgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTsgZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlOyBkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmICgndmFsdWUnIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG5cdGZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uJyk7IH0gfVxuXG5cdHZhciBUZXRoZXJCYXNlID0gdW5kZWZpbmVkO1xuXHRpZiAodHlwZW9mIFRldGhlckJhc2UgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgVGV0aGVyQmFzZSA9IHsgbW9kdWxlczogW10gfTtcblx0fVxuXG5cdGZ1bmN0aW9uIGdldFNjcm9sbFBhcmVudChlbCkge1xuXHQgIC8vIEluIGZpcmVmb3ggaWYgdGhlIGVsIGlzIGluc2lkZSBhbiBpZnJhbWUgd2l0aCBkaXNwbGF5OiBub25lOyB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSgpIHdpbGwgcmV0dXJuIG51bGw7XG5cdCAgLy8gaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NTQ4Mzk3XG5cdCAgdmFyIGNvbXB1dGVkU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsKSB8fCB7fTtcblx0ICB2YXIgcG9zaXRpb24gPSBjb21wdXRlZFN0eWxlLnBvc2l0aW9uO1xuXG5cdCAgaWYgKHBvc2l0aW9uID09PSAnZml4ZWQnKSB7XG5cdCAgICByZXR1cm4gZWw7XG5cdCAgfVxuXG5cdCAgdmFyIHBhcmVudCA9IGVsO1xuXHQgIHdoaWxlIChwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZSkge1xuXHQgICAgdmFyIHN0eWxlID0gdW5kZWZpbmVkO1xuXHQgICAgdHJ5IHtcblx0ICAgICAgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHBhcmVudCk7XG5cdCAgICB9IGNhdGNoIChlcnIpIHt9XG5cblx0ICAgIGlmICh0eXBlb2Ygc3R5bGUgPT09ICd1bmRlZmluZWQnIHx8IHN0eWxlID09PSBudWxsKSB7XG5cdCAgICAgIHJldHVybiBwYXJlbnQ7XG5cdCAgICB9XG5cblx0ICAgIHZhciBfc3R5bGUgPSBzdHlsZTtcblx0ICAgIHZhciBvdmVyZmxvdyA9IF9zdHlsZS5vdmVyZmxvdztcblx0ICAgIHZhciBvdmVyZmxvd1ggPSBfc3R5bGUub3ZlcmZsb3dYO1xuXHQgICAgdmFyIG92ZXJmbG93WSA9IF9zdHlsZS5vdmVyZmxvd1k7XG5cblx0ICAgIGlmICgvKGF1dG98c2Nyb2xsKS8udGVzdChvdmVyZmxvdyArIG92ZXJmbG93WSArIG92ZXJmbG93WCkpIHtcblx0ICAgICAgaWYgKHBvc2l0aW9uICE9PSAnYWJzb2x1dGUnIHx8IFsncmVsYXRpdmUnLCAnYWJzb2x1dGUnLCAnZml4ZWQnXS5pbmRleE9mKHN0eWxlLnBvc2l0aW9uKSA+PSAwKSB7XG5cdCAgICAgICAgcmV0dXJuIHBhcmVudDtcblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH1cblxuXHQgIHJldHVybiBkb2N1bWVudC5ib2R5O1xuXHR9XG5cblx0dmFyIHVuaXF1ZUlkID0gKGZ1bmN0aW9uICgpIHtcblx0ICB2YXIgaWQgPSAwO1xuXHQgIHJldHVybiBmdW5jdGlvbiAoKSB7XG5cdCAgICByZXR1cm4gKytpZDtcblx0ICB9O1xuXHR9KSgpO1xuXG5cdHZhciB6ZXJvUG9zQ2FjaGUgPSB7fTtcblx0dmFyIGdldE9yaWdpbiA9IGZ1bmN0aW9uIGdldE9yaWdpbihkb2MpIHtcblx0ICAvLyBnZXRCb3VuZGluZ0NsaWVudFJlY3QgaXMgdW5mb3J0dW5hdGVseSB0b28gYWNjdXJhdGUuICBJdCBpbnRyb2R1Y2VzIGEgcGl4ZWwgb3IgdHdvIG9mXG5cdCAgLy8gaml0dGVyIGFzIHRoZSB1c2VyIHNjcm9sbHMgdGhhdCBtZXNzZXMgd2l0aCBvdXIgYWJpbGl0eSB0byBkZXRlY3QgaWYgdHdvIHBvc2l0aW9uc1xuXHQgIC8vIGFyZSBlcXVpdmlsYW50IG9yIG5vdC4gIFdlIHBsYWNlIGFuIGVsZW1lbnQgYXQgdGhlIHRvcCBsZWZ0IG9mIHRoZSBwYWdlIHRoYXQgd2lsbFxuXHQgIC8vIGdldCB0aGUgc2FtZSBqaXR0ZXIsIHNvIHdlIGNhbiBjYW5jZWwgdGhlIHR3byBvdXQuXG5cdCAgdmFyIG5vZGUgPSBkb2MuX3RldGhlclplcm9FbGVtZW50O1xuXHQgIGlmICh0eXBlb2Ygbm9kZSA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIG5vZGUgPSBkb2MuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cdCAgICBub2RlLnNldEF0dHJpYnV0ZSgnZGF0YS10ZXRoZXItaWQnLCB1bmlxdWVJZCgpKTtcblx0ICAgIGV4dGVuZChub2RlLnN0eWxlLCB7XG5cdCAgICAgIHRvcDogMCxcblx0ICAgICAgbGVmdDogMCxcblx0ICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZSdcblx0ICAgIH0pO1xuXG5cdCAgICBkb2MuYm9keS5hcHBlbmRDaGlsZChub2RlKTtcblxuXHQgICAgZG9jLl90ZXRoZXJaZXJvRWxlbWVudCA9IG5vZGU7XG5cdCAgfVxuXG5cdCAgdmFyIGlkID0gbm9kZS5nZXRBdHRyaWJ1dGUoJ2RhdGEtdGV0aGVyLWlkJyk7XG5cdCAgaWYgKHR5cGVvZiB6ZXJvUG9zQ2FjaGVbaWRdID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgemVyb1Bvc0NhY2hlW2lkXSA9IHt9O1xuXG5cdCAgICB2YXIgcmVjdCA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cdCAgICBmb3IgKHZhciBrIGluIHJlY3QpIHtcblx0ICAgICAgLy8gQ2FuJ3QgdXNlIGV4dGVuZCwgYXMgb24gSUU5LCBlbGVtZW50cyBkb24ndCByZXNvbHZlIHRvIGJlIGhhc093blByb3BlcnR5XG5cdCAgICAgIHplcm9Qb3NDYWNoZVtpZF1ba10gPSByZWN0W2tdO1xuXHQgICAgfVxuXG5cdCAgICAvLyBDbGVhciB0aGUgY2FjaGUgd2hlbiB0aGlzIHBvc2l0aW9uIGNhbGwgaXMgZG9uZVxuXHQgICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuXHQgICAgICBkZWxldGUgemVyb1Bvc0NhY2hlW2lkXTtcblx0ICAgIH0pO1xuXHQgIH1cblxuXHQgIHJldHVybiB6ZXJvUG9zQ2FjaGVbaWRdO1xuXHR9O1xuXG5cdGZ1bmN0aW9uIGdldEJvdW5kcyhlbCkge1xuXHQgIHZhciBkb2MgPSB1bmRlZmluZWQ7XG5cdCAgaWYgKGVsID09PSBkb2N1bWVudCkge1xuXHQgICAgZG9jID0gZG9jdW1lbnQ7XG5cdCAgICBlbCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblx0ICB9IGVsc2Uge1xuXHQgICAgZG9jID0gZWwub3duZXJEb2N1bWVudDtcblx0ICB9XG5cblx0ICB2YXIgZG9jRWwgPSBkb2MuZG9jdW1lbnRFbGVtZW50O1xuXG5cdCAgdmFyIGJveCA9IHt9O1xuXHQgIC8vIFRoZSBvcmlnaW5hbCBvYmplY3QgcmV0dXJuZWQgYnkgZ2V0Qm91bmRpbmdDbGllbnRSZWN0IGlzIGltbXV0YWJsZSwgc28gd2UgY2xvbmUgaXRcblx0ICAvLyBXZSBjYW4ndCB1c2UgZXh0ZW5kIGJlY2F1c2UgdGhlIHByb3BlcnRpZXMgYXJlIG5vdCBjb25zaWRlcmVkIHBhcnQgb2YgdGhlIG9iamVjdCBieSBoYXNPd25Qcm9wZXJ0eSBpbiBJRTlcblx0ICB2YXIgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXHQgIGZvciAodmFyIGsgaW4gcmVjdCkge1xuXHQgICAgYm94W2tdID0gcmVjdFtrXTtcblx0ICB9XG5cblx0ICB2YXIgb3JpZ2luID0gZ2V0T3JpZ2luKGRvYyk7XG5cblx0ICBib3gudG9wIC09IG9yaWdpbi50b3A7XG5cdCAgYm94LmxlZnQgLT0gb3JpZ2luLmxlZnQ7XG5cblx0ICBpZiAodHlwZW9mIGJveC53aWR0aCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIGJveC53aWR0aCA9IGRvY3VtZW50LmJvZHkuc2Nyb2xsV2lkdGggLSBib3gubGVmdCAtIGJveC5yaWdodDtcblx0ICB9XG5cdCAgaWYgKHR5cGVvZiBib3guaGVpZ2h0ID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgYm94LmhlaWdodCA9IGRvY3VtZW50LmJvZHkuc2Nyb2xsSGVpZ2h0IC0gYm94LnRvcCAtIGJveC5ib3R0b207XG5cdCAgfVxuXG5cdCAgYm94LnRvcCA9IGJveC50b3AgLSBkb2NFbC5jbGllbnRUb3A7XG5cdCAgYm94LmxlZnQgPSBib3gubGVmdCAtIGRvY0VsLmNsaWVudExlZnQ7XG5cdCAgYm94LnJpZ2h0ID0gZG9jLmJvZHkuY2xpZW50V2lkdGggLSBib3gud2lkdGggLSBib3gubGVmdDtcblx0ICBib3guYm90dG9tID0gZG9jLmJvZHkuY2xpZW50SGVpZ2h0IC0gYm94LmhlaWdodCAtIGJveC50b3A7XG5cblx0ICByZXR1cm4gYm94O1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0T2Zmc2V0UGFyZW50KGVsKSB7XG5cdCAgcmV0dXJuIGVsLm9mZnNldFBhcmVudCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG5cdH1cblxuXHRmdW5jdGlvbiBnZXRTY3JvbGxCYXJTaXplKCkge1xuXHQgIHZhciBpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHQgIGlubmVyLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuXHQgIGlubmVyLnN0eWxlLmhlaWdodCA9ICcyMDBweCc7XG5cblx0ICB2YXIgb3V0ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblx0ICBleHRlbmQob3V0ZXIuc3R5bGUsIHtcblx0ICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuXHQgICAgdG9wOiAwLFxuXHQgICAgbGVmdDogMCxcblx0ICAgIHBvaW50ZXJFdmVudHM6ICdub25lJyxcblx0ICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nLFxuXHQgICAgd2lkdGg6ICcyMDBweCcsXG5cdCAgICBoZWlnaHQ6ICcxNTBweCcsXG5cdCAgICBvdmVyZmxvdzogJ2hpZGRlbidcblx0ICB9KTtcblxuXHQgIG91dGVyLmFwcGVuZENoaWxkKGlubmVyKTtcblxuXHQgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQob3V0ZXIpO1xuXG5cdCAgdmFyIHdpZHRoQ29udGFpbmVkID0gaW5uZXIub2Zmc2V0V2lkdGg7XG5cdCAgb3V0ZXIuc3R5bGUub3ZlcmZsb3cgPSAnc2Nyb2xsJztcblx0ICB2YXIgd2lkdGhTY3JvbGwgPSBpbm5lci5vZmZzZXRXaWR0aDtcblxuXHQgIGlmICh3aWR0aENvbnRhaW5lZCA9PT0gd2lkdGhTY3JvbGwpIHtcblx0ICAgIHdpZHRoU2Nyb2xsID0gb3V0ZXIuY2xpZW50V2lkdGg7XG5cdCAgfVxuXG5cdCAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChvdXRlcik7XG5cblx0ICB2YXIgd2lkdGggPSB3aWR0aENvbnRhaW5lZCAtIHdpZHRoU2Nyb2xsO1xuXG5cdCAgcmV0dXJuIHsgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IHdpZHRoIH07XG5cdH1cblxuXHRmdW5jdGlvbiBleHRlbmQoKSB7XG5cdCAgdmFyIG91dCA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzBdO1xuXG5cdCAgdmFyIGFyZ3MgPSBbXTtcblxuXHQgIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KGFyZ3MsIGFyZ3VtZW50cyk7XG5cblx0ICBhcmdzLnNsaWNlKDEpLmZvckVhY2goZnVuY3Rpb24gKG9iaikge1xuXHQgICAgaWYgKG9iaikge1xuXHQgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG5cdCAgICAgICAgaWYgKCh7fSkuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHtcblx0ICAgICAgICAgIG91dFtrZXldID0gb2JqW2tleV07XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfSk7XG5cblx0ICByZXR1cm4gb3V0O1xuXHR9XG5cblx0ZnVuY3Rpb24gcmVtb3ZlQ2xhc3MoZWwsIG5hbWUpIHtcblx0ICBpZiAodHlwZW9mIGVsLmNsYXNzTGlzdCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIG5hbWUuc3BsaXQoJyAnKS5mb3JFYWNoKGZ1bmN0aW9uIChjbHMpIHtcblx0ICAgICAgaWYgKGNscy50cmltKCkpIHtcblx0ICAgICAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKGNscyk7XG5cdCAgICAgIH1cblx0ICAgIH0pO1xuXHQgIH0gZWxzZSB7XG5cdCAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKCcoXnwgKScgKyBuYW1lLnNwbGl0KCcgJykuam9pbignfCcpICsgJyggfCQpJywgJ2dpJyk7XG5cdCAgICB2YXIgY2xhc3NOYW1lID0gZ2V0Q2xhc3NOYW1lKGVsKS5yZXBsYWNlKHJlZ2V4LCAnICcpO1xuXHQgICAgc2V0Q2xhc3NOYW1lKGVsLCBjbGFzc05hbWUpO1xuXHQgIH1cblx0fVxuXG5cdGZ1bmN0aW9uIGFkZENsYXNzKGVsLCBuYW1lKSB7XG5cdCAgaWYgKHR5cGVvZiBlbC5jbGFzc0xpc3QgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICBuYW1lLnNwbGl0KCcgJykuZm9yRWFjaChmdW5jdGlvbiAoY2xzKSB7XG5cdCAgICAgIGlmIChjbHMudHJpbSgpKSB7XG5cdCAgICAgICAgZWwuY2xhc3NMaXN0LmFkZChjbHMpO1xuXHQgICAgICB9XG5cdCAgICB9KTtcblx0ICB9IGVsc2Uge1xuXHQgICAgcmVtb3ZlQ2xhc3MoZWwsIG5hbWUpO1xuXHQgICAgdmFyIGNscyA9IGdldENsYXNzTmFtZShlbCkgKyAoJyAnICsgbmFtZSk7XG5cdCAgICBzZXRDbGFzc05hbWUoZWwsIGNscyk7XG5cdCAgfVxuXHR9XG5cblx0ZnVuY3Rpb24gaGFzQ2xhc3MoZWwsIG5hbWUpIHtcblx0ICBpZiAodHlwZW9mIGVsLmNsYXNzTGlzdCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIHJldHVybiBlbC5jbGFzc0xpc3QuY29udGFpbnMobmFtZSk7XG5cdCAgfVxuXHQgIHZhciBjbGFzc05hbWUgPSBnZXRDbGFzc05hbWUoZWwpO1xuXHQgIHJldHVybiBuZXcgUmVnRXhwKCcoXnwgKScgKyBuYW1lICsgJyggfCQpJywgJ2dpJykudGVzdChjbGFzc05hbWUpO1xuXHR9XG5cblx0ZnVuY3Rpb24gZ2V0Q2xhc3NOYW1lKGVsKSB7XG5cdCAgaWYgKGVsLmNsYXNzTmFtZSBpbnN0YW5jZW9mIFNWR0FuaW1hdGVkU3RyaW5nKSB7XG5cdCAgICByZXR1cm4gZWwuY2xhc3NOYW1lLmJhc2VWYWw7XG5cdCAgfVxuXHQgIHJldHVybiBlbC5jbGFzc05hbWU7XG5cdH1cblxuXHRmdW5jdGlvbiBzZXRDbGFzc05hbWUoZWwsIGNsYXNzTmFtZSkge1xuXHQgIGVsLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCBjbGFzc05hbWUpO1xuXHR9XG5cblx0ZnVuY3Rpb24gdXBkYXRlQ2xhc3NlcyhlbCwgYWRkLCBhbGwpIHtcblx0ICAvLyBPZiB0aGUgc2V0IG9mICdhbGwnIGNsYXNzZXMsIHdlIG5lZWQgdGhlICdhZGQnIGNsYXNzZXMsIGFuZCBvbmx5IHRoZVxuXHQgIC8vICdhZGQnIGNsYXNzZXMgdG8gYmUgc2V0LlxuXHQgIGFsbC5mb3JFYWNoKGZ1bmN0aW9uIChjbHMpIHtcblx0ICAgIGlmIChhZGQuaW5kZXhPZihjbHMpID09PSAtMSAmJiBoYXNDbGFzcyhlbCwgY2xzKSkge1xuXHQgICAgICByZW1vdmVDbGFzcyhlbCwgY2xzKTtcblx0ICAgIH1cblx0ICB9KTtcblxuXHQgIGFkZC5mb3JFYWNoKGZ1bmN0aW9uIChjbHMpIHtcblx0ICAgIGlmICghaGFzQ2xhc3MoZWwsIGNscykpIHtcblx0ICAgICAgYWRkQ2xhc3MoZWwsIGNscyk7XG5cdCAgICB9XG5cdCAgfSk7XG5cdH1cblxuXHR2YXIgZGVmZXJyZWQgPSBbXTtcblxuXHR2YXIgZGVmZXIgPSBmdW5jdGlvbiBkZWZlcihmbikge1xuXHQgIGRlZmVycmVkLnB1c2goZm4pO1xuXHR9O1xuXG5cdHZhciBmbHVzaCA9IGZ1bmN0aW9uIGZsdXNoKCkge1xuXHQgIHZhciBmbiA9IHVuZGVmaW5lZDtcblx0ICB3aGlsZSAoZm4gPSBkZWZlcnJlZC5wb3AoKSkge1xuXHQgICAgZm4oKTtcblx0ICB9XG5cdH07XG5cblx0dmFyIEV2ZW50ZWQgPSAoZnVuY3Rpb24gKCkge1xuXHQgIGZ1bmN0aW9uIEV2ZW50ZWQoKSB7XG5cdCAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRXZlbnRlZCk7XG5cdCAgfVxuXG5cdCAgX2NyZWF0ZUNsYXNzKEV2ZW50ZWQsIFt7XG5cdCAgICBrZXk6ICdvbicsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gb24oZXZlbnQsIGhhbmRsZXIsIGN0eCkge1xuXHQgICAgICB2YXIgb25jZSA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMyB8fCBhcmd1bWVudHNbM10gPT09IHVuZGVmaW5lZCA/IGZhbHNlIDogYXJndW1lbnRzWzNdO1xuXG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5iaW5kaW5ncyA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICB0aGlzLmJpbmRpbmdzID0ge307XG5cdCAgICAgIH1cblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLmJpbmRpbmdzW2V2ZW50XSA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICB0aGlzLmJpbmRpbmdzW2V2ZW50XSA9IFtdO1xuXHQgICAgICB9XG5cdCAgICAgIHRoaXMuYmluZGluZ3NbZXZlbnRdLnB1c2goeyBoYW5kbGVyOiBoYW5kbGVyLCBjdHg6IGN0eCwgb25jZTogb25jZSB9KTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdvbmNlJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBvbmNlKGV2ZW50LCBoYW5kbGVyLCBjdHgpIHtcblx0ICAgICAgdGhpcy5vbihldmVudCwgaGFuZGxlciwgY3R4LCB0cnVlKTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdvZmYnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIG9mZihldmVudCwgaGFuZGxlcikge1xuXHQgICAgICBpZiAodHlwZW9mIHRoaXMuYmluZGluZ3MgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiB0aGlzLmJpbmRpbmdzW2V2ZW50XSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICByZXR1cm47XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAodHlwZW9mIGhhbmRsZXIgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgZGVsZXRlIHRoaXMuYmluZGluZ3NbZXZlbnRdO1xuXHQgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIHZhciBpID0gMDtcblx0ICAgICAgICB3aGlsZSAoaSA8IHRoaXMuYmluZGluZ3NbZXZlbnRdLmxlbmd0aCkge1xuXHQgICAgICAgICAgaWYgKHRoaXMuYmluZGluZ3NbZXZlbnRdW2ldLmhhbmRsZXIgPT09IGhhbmRsZXIpIHtcblx0ICAgICAgICAgICAgdGhpcy5iaW5kaW5nc1tldmVudF0uc3BsaWNlKGksIDEpO1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgKytpO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ3RyaWdnZXInLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIHRyaWdnZXIoZXZlbnQpIHtcblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLmJpbmRpbmdzICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLmJpbmRpbmdzW2V2ZW50XSkge1xuXHQgICAgICAgIHZhciBpID0gMDtcblxuXHQgICAgICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gQXJyYXkoX2xlbiA+IDEgPyBfbGVuIC0gMSA6IDApLCBfa2V5ID0gMTsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuXHQgICAgICAgICAgYXJnc1tfa2V5IC0gMV0gPSBhcmd1bWVudHNbX2tleV07XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgd2hpbGUgKGkgPCB0aGlzLmJpbmRpbmdzW2V2ZW50XS5sZW5ndGgpIHtcblx0ICAgICAgICAgIHZhciBfYmluZGluZ3MkZXZlbnQkaSA9IHRoaXMuYmluZGluZ3NbZXZlbnRdW2ldO1xuXHQgICAgICAgICAgdmFyIGhhbmRsZXIgPSBfYmluZGluZ3MkZXZlbnQkaS5oYW5kbGVyO1xuXHQgICAgICAgICAgdmFyIGN0eCA9IF9iaW5kaW5ncyRldmVudCRpLmN0eDtcblx0ICAgICAgICAgIHZhciBvbmNlID0gX2JpbmRpbmdzJGV2ZW50JGkub25jZTtcblxuXHQgICAgICAgICAgdmFyIGNvbnRleHQgPSBjdHg7XG5cdCAgICAgICAgICBpZiAodHlwZW9mIGNvbnRleHQgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgICAgIGNvbnRleHQgPSB0aGlzO1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBoYW5kbGVyLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuXG5cdCAgICAgICAgICBpZiAob25jZSkge1xuXHQgICAgICAgICAgICB0aGlzLmJpbmRpbmdzW2V2ZW50XS5zcGxpY2UoaSwgMSk7XG5cdCAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICArK2k7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfV0pO1xuXG5cdCAgcmV0dXJuIEV2ZW50ZWQ7XG5cdH0pKCk7XG5cblx0VGV0aGVyQmFzZS5VdGlscyA9IHtcblx0ICBnZXRTY3JvbGxQYXJlbnQ6IGdldFNjcm9sbFBhcmVudCxcblx0ICBnZXRCb3VuZHM6IGdldEJvdW5kcyxcblx0ICBnZXRPZmZzZXRQYXJlbnQ6IGdldE9mZnNldFBhcmVudCxcblx0ICBleHRlbmQ6IGV4dGVuZCxcblx0ICBhZGRDbGFzczogYWRkQ2xhc3MsXG5cdCAgcmVtb3ZlQ2xhc3M6IHJlbW92ZUNsYXNzLFxuXHQgIGhhc0NsYXNzOiBoYXNDbGFzcyxcblx0ICB1cGRhdGVDbGFzc2VzOiB1cGRhdGVDbGFzc2VzLFxuXHQgIGRlZmVyOiBkZWZlcixcblx0ICBmbHVzaDogZmx1c2gsXG5cdCAgdW5pcXVlSWQ6IHVuaXF1ZUlkLFxuXHQgIEV2ZW50ZWQ6IEV2ZW50ZWQsXG5cdCAgZ2V0U2Nyb2xsQmFyU2l6ZTogZ2V0U2Nyb2xsQmFyU2l6ZVxuXHR9O1xuXHQvKiBnbG9iYWxzIFRldGhlckJhc2UsIHBlcmZvcm1hbmNlICovXG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBfc2xpY2VkVG9BcnJheSA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIHNsaWNlSXRlcmF0b3IoYXJyLCBpKSB7IHZhciBfYXJyID0gW107IHZhciBfbiA9IHRydWU7IHZhciBfZCA9IGZhbHNlOyB2YXIgX2UgPSB1bmRlZmluZWQ7IHRyeSB7IGZvciAodmFyIF9pID0gYXJyW1N5bWJvbC5pdGVyYXRvcl0oKSwgX3M7ICEoX24gPSAoX3MgPSBfaS5uZXh0KCkpLmRvbmUpOyBfbiA9IHRydWUpIHsgX2Fyci5wdXNoKF9zLnZhbHVlKTsgaWYgKGkgJiYgX2Fyci5sZW5ndGggPT09IGkpIGJyZWFrOyB9IH0gY2F0Y2ggKGVycikgeyBfZCA9IHRydWU7IF9lID0gZXJyOyB9IGZpbmFsbHkgeyB0cnkgeyBpZiAoIV9uICYmIF9pWydyZXR1cm4nXSkgX2lbJ3JldHVybiddKCk7IH0gZmluYWxseSB7IGlmIChfZCkgdGhyb3cgX2U7IH0gfSByZXR1cm4gX2FycjsgfSByZXR1cm4gZnVuY3Rpb24gKGFyciwgaSkgeyBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7IHJldHVybiBhcnI7IH0gZWxzZSBpZiAoU3ltYm9sLml0ZXJhdG9yIGluIE9iamVjdChhcnIpKSB7IHJldHVybiBzbGljZUl0ZXJhdG9yKGFyciwgaSk7IH0gZWxzZSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgYXR0ZW1wdCB0byBkZXN0cnVjdHVyZSBub24taXRlcmFibGUgaW5zdGFuY2UnKTsgfSB9OyB9KSgpO1xuXG5cdHZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgeyB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldOyBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7IGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKCd2YWx1ZScgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTsgfSB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cblx0ZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cblx0aWYgKHR5cGVvZiBUZXRoZXJCYXNlID09PSAndW5kZWZpbmVkJykge1xuXHQgIHRocm93IG5ldyBFcnJvcignWW91IG11c3QgaW5jbHVkZSB0aGUgdXRpbHMuanMgZmlsZSBiZWZvcmUgdGV0aGVyLmpzJyk7XG5cdH1cblxuXHR2YXIgX1RldGhlckJhc2UkVXRpbHMgPSBUZXRoZXJCYXNlLlV0aWxzO1xuXHR2YXIgZ2V0U2Nyb2xsUGFyZW50ID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0U2Nyb2xsUGFyZW50O1xuXHR2YXIgZ2V0Qm91bmRzID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0Qm91bmRzO1xuXHR2YXIgZ2V0T2Zmc2V0UGFyZW50ID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0T2Zmc2V0UGFyZW50O1xuXHR2YXIgZXh0ZW5kID0gX1RldGhlckJhc2UkVXRpbHMuZXh0ZW5kO1xuXHR2YXIgYWRkQ2xhc3MgPSBfVGV0aGVyQmFzZSRVdGlscy5hZGRDbGFzcztcblx0dmFyIHJlbW92ZUNsYXNzID0gX1RldGhlckJhc2UkVXRpbHMucmVtb3ZlQ2xhc3M7XG5cdHZhciB1cGRhdGVDbGFzc2VzID0gX1RldGhlckJhc2UkVXRpbHMudXBkYXRlQ2xhc3Nlcztcblx0dmFyIGRlZmVyID0gX1RldGhlckJhc2UkVXRpbHMuZGVmZXI7XG5cdHZhciBmbHVzaCA9IF9UZXRoZXJCYXNlJFV0aWxzLmZsdXNoO1xuXHR2YXIgZ2V0U2Nyb2xsQmFyU2l6ZSA9IF9UZXRoZXJCYXNlJFV0aWxzLmdldFNjcm9sbEJhclNpemU7XG5cblx0ZnVuY3Rpb24gd2l0aGluKGEsIGIpIHtcblx0ICB2YXIgZGlmZiA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMiB8fCBhcmd1bWVudHNbMl0gPT09IHVuZGVmaW5lZCA/IDEgOiBhcmd1bWVudHNbMl07XG5cblx0ICByZXR1cm4gYSArIGRpZmYgPj0gYiAmJiBiID49IGEgLSBkaWZmO1xuXHR9XG5cblx0dmFyIHRyYW5zZm9ybUtleSA9IChmdW5jdGlvbiAoKSB7XG5cdCAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIHJldHVybiAnJztcblx0ICB9XG5cdCAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cblx0ICB2YXIgdHJhbnNmb3JtcyA9IFsndHJhbnNmb3JtJywgJ3dlYmtpdFRyYW5zZm9ybScsICdPVHJhbnNmb3JtJywgJ01velRyYW5zZm9ybScsICdtc1RyYW5zZm9ybSddO1xuXHQgIGZvciAodmFyIGkgPSAwOyBpIDwgdHJhbnNmb3Jtcy5sZW5ndGg7ICsraSkge1xuXHQgICAgdmFyIGtleSA9IHRyYW5zZm9ybXNbaV07XG5cdCAgICBpZiAoZWwuc3R5bGVba2V5XSAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICAgIHJldHVybiBrZXk7XG5cdCAgICB9XG5cdCAgfVxuXHR9KSgpO1xuXG5cdHZhciB0ZXRoZXJzID0gW107XG5cblx0dmFyIHBvc2l0aW9uID0gZnVuY3Rpb24gcG9zaXRpb24oKSB7XG5cdCAgdGV0aGVycy5mb3JFYWNoKGZ1bmN0aW9uICh0ZXRoZXIpIHtcblx0ICAgIHRldGhlci5wb3NpdGlvbihmYWxzZSk7XG5cdCAgfSk7XG5cdCAgZmx1c2goKTtcblx0fTtcblxuXHRmdW5jdGlvbiBub3coKSB7XG5cdCAgaWYgKHR5cGVvZiBwZXJmb3JtYW5jZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHBlcmZvcm1hbmNlLm5vdyAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIHJldHVybiBwZXJmb3JtYW5jZS5ub3coKTtcblx0ICB9XG5cdCAgcmV0dXJuICtuZXcgRGF0ZSgpO1xuXHR9XG5cblx0KGZ1bmN0aW9uICgpIHtcblx0ICB2YXIgbGFzdENhbGwgPSBudWxsO1xuXHQgIHZhciBsYXN0RHVyYXRpb24gPSBudWxsO1xuXHQgIHZhciBwZW5kaW5nVGltZW91dCA9IG51bGw7XG5cblx0ICB2YXIgdGljayA9IGZ1bmN0aW9uIHRpY2soKSB7XG5cdCAgICBpZiAodHlwZW9mIGxhc3REdXJhdGlvbiAhPT0gJ3VuZGVmaW5lZCcgJiYgbGFzdER1cmF0aW9uID4gMTYpIHtcblx0ICAgICAgLy8gV2Ugdm9sdW50YXJpbHkgdGhyb3R0bGUgb3Vyc2VsdmVzIGlmIHdlIGNhbid0IG1hbmFnZSA2MGZwc1xuXHQgICAgICBsYXN0RHVyYXRpb24gPSBNYXRoLm1pbihsYXN0RHVyYXRpb24gLSAxNiwgMjUwKTtcblxuXHQgICAgICAvLyBKdXN0IGluIGNhc2UgdGhpcyBpcyB0aGUgbGFzdCBldmVudCwgcmVtZW1iZXIgdG8gcG9zaXRpb24ganVzdCBvbmNlIG1vcmVcblx0ICAgICAgcGVuZGluZ1RpbWVvdXQgPSBzZXRUaW1lb3V0KHRpY2ssIDI1MCk7XG5cdCAgICAgIHJldHVybjtcblx0ICAgIH1cblxuXHQgICAgaWYgKHR5cGVvZiBsYXN0Q2FsbCAhPT0gJ3VuZGVmaW5lZCcgJiYgbm93KCkgLSBsYXN0Q2FsbCA8IDEwKSB7XG5cdCAgICAgIC8vIFNvbWUgYnJvd3NlcnMgY2FsbCBldmVudHMgYSBsaXR0bGUgdG9vIGZyZXF1ZW50bHksIHJlZnVzZSB0byBydW4gbW9yZSB0aGFuIGlzIHJlYXNvbmFibGVcblx0ICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXG5cdCAgICBpZiAodHlwZW9mIHBlbmRpbmdUaW1lb3V0ICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICBjbGVhclRpbWVvdXQocGVuZGluZ1RpbWVvdXQpO1xuXHQgICAgICBwZW5kaW5nVGltZW91dCA9IG51bGw7XG5cdCAgICB9XG5cblx0ICAgIGxhc3RDYWxsID0gbm93KCk7XG5cdCAgICBwb3NpdGlvbigpO1xuXHQgICAgbGFzdER1cmF0aW9uID0gbm93KCkgLSBsYXN0Q2FsbDtcblx0ICB9O1xuXG5cdCAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICBbJ3Jlc2l6ZScsICdzY3JvbGwnLCAndG91Y2htb3ZlJ10uZm9yRWFjaChmdW5jdGlvbiAoZXZlbnQpIHtcblx0ICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIHRpY2spO1xuXHQgICAgfSk7XG5cdCAgfVxuXHR9KSgpO1xuXG5cdHZhciBNSVJST1JfTFIgPSB7XG5cdCAgY2VudGVyOiAnY2VudGVyJyxcblx0ICBsZWZ0OiAncmlnaHQnLFxuXHQgIHJpZ2h0OiAnbGVmdCdcblx0fTtcblxuXHR2YXIgTUlSUk9SX1RCID0ge1xuXHQgIG1pZGRsZTogJ21pZGRsZScsXG5cdCAgdG9wOiAnYm90dG9tJyxcblx0ICBib3R0b206ICd0b3AnXG5cdH07XG5cblx0dmFyIE9GRlNFVF9NQVAgPSB7XG5cdCAgdG9wOiAwLFxuXHQgIGxlZnQ6IDAsXG5cdCAgbWlkZGxlOiAnNTAlJyxcblx0ICBjZW50ZXI6ICc1MCUnLFxuXHQgIGJvdHRvbTogJzEwMCUnLFxuXHQgIHJpZ2h0OiAnMTAwJSdcblx0fTtcblxuXHR2YXIgYXV0b1RvRml4ZWRBdHRhY2htZW50ID0gZnVuY3Rpb24gYXV0b1RvRml4ZWRBdHRhY2htZW50KGF0dGFjaG1lbnQsIHJlbGF0aXZlVG9BdHRhY2htZW50KSB7XG5cdCAgdmFyIGxlZnQgPSBhdHRhY2htZW50LmxlZnQ7XG5cdCAgdmFyIHRvcCA9IGF0dGFjaG1lbnQudG9wO1xuXG5cdCAgaWYgKGxlZnQgPT09ICdhdXRvJykge1xuXHQgICAgbGVmdCA9IE1JUlJPUl9MUltyZWxhdGl2ZVRvQXR0YWNobWVudC5sZWZ0XTtcblx0ICB9XG5cblx0ICBpZiAodG9wID09PSAnYXV0bycpIHtcblx0ICAgIHRvcCA9IE1JUlJPUl9UQltyZWxhdGl2ZVRvQXR0YWNobWVudC50b3BdO1xuXHQgIH1cblxuXHQgIHJldHVybiB7IGxlZnQ6IGxlZnQsIHRvcDogdG9wIH07XG5cdH07XG5cblx0dmFyIGF0dGFjaG1lbnRUb09mZnNldCA9IGZ1bmN0aW9uIGF0dGFjaG1lbnRUb09mZnNldChhdHRhY2htZW50KSB7XG5cdCAgdmFyIGxlZnQgPSBhdHRhY2htZW50LmxlZnQ7XG5cdCAgdmFyIHRvcCA9IGF0dGFjaG1lbnQudG9wO1xuXG5cdCAgaWYgKHR5cGVvZiBPRkZTRVRfTUFQW2F0dGFjaG1lbnQubGVmdF0gIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICBsZWZ0ID0gT0ZGU0VUX01BUFthdHRhY2htZW50LmxlZnRdO1xuXHQgIH1cblxuXHQgIGlmICh0eXBlb2YgT0ZGU0VUX01BUFthdHRhY2htZW50LnRvcF0gIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICB0b3AgPSBPRkZTRVRfTUFQW2F0dGFjaG1lbnQudG9wXTtcblx0ICB9XG5cblx0ICByZXR1cm4geyBsZWZ0OiBsZWZ0LCB0b3A6IHRvcCB9O1xuXHR9O1xuXG5cdGZ1bmN0aW9uIGFkZE9mZnNldCgpIHtcblx0ICB2YXIgb3V0ID0geyB0b3A6IDAsIGxlZnQ6IDAgfTtcblxuXHQgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBvZmZzZXRzID0gQXJyYXkoX2xlbiksIF9rZXkgPSAwOyBfa2V5IDwgX2xlbjsgX2tleSsrKSB7XG5cdCAgICBvZmZzZXRzW19rZXldID0gYXJndW1lbnRzW19rZXldO1xuXHQgIH1cblxuXHQgIG9mZnNldHMuZm9yRWFjaChmdW5jdGlvbiAoX3JlZikge1xuXHQgICAgdmFyIHRvcCA9IF9yZWYudG9wO1xuXHQgICAgdmFyIGxlZnQgPSBfcmVmLmxlZnQ7XG5cblx0ICAgIGlmICh0eXBlb2YgdG9wID09PSAnc3RyaW5nJykge1xuXHQgICAgICB0b3AgPSBwYXJzZUZsb2F0KHRvcCwgMTApO1xuXHQgICAgfVxuXHQgICAgaWYgKHR5cGVvZiBsZWZ0ID09PSAnc3RyaW5nJykge1xuXHQgICAgICBsZWZ0ID0gcGFyc2VGbG9hdChsZWZ0LCAxMCk7XG5cdCAgICB9XG5cblx0ICAgIG91dC50b3AgKz0gdG9wO1xuXHQgICAgb3V0LmxlZnQgKz0gbGVmdDtcblx0ICB9KTtcblxuXHQgIHJldHVybiBvdXQ7XG5cdH1cblxuXHRmdW5jdGlvbiBvZmZzZXRUb1B4KG9mZnNldCwgc2l6ZSkge1xuXHQgIGlmICh0eXBlb2Ygb2Zmc2V0LmxlZnQgPT09ICdzdHJpbmcnICYmIG9mZnNldC5sZWZ0LmluZGV4T2YoJyUnKSAhPT0gLTEpIHtcblx0ICAgIG9mZnNldC5sZWZ0ID0gcGFyc2VGbG9hdChvZmZzZXQubGVmdCwgMTApIC8gMTAwICogc2l6ZS53aWR0aDtcblx0ICB9XG5cdCAgaWYgKHR5cGVvZiBvZmZzZXQudG9wID09PSAnc3RyaW5nJyAmJiBvZmZzZXQudG9wLmluZGV4T2YoJyUnKSAhPT0gLTEpIHtcblx0ICAgIG9mZnNldC50b3AgPSBwYXJzZUZsb2F0KG9mZnNldC50b3AsIDEwKSAvIDEwMCAqIHNpemUuaGVpZ2h0O1xuXHQgIH1cblxuXHQgIHJldHVybiBvZmZzZXQ7XG5cdH1cblxuXHR2YXIgcGFyc2VPZmZzZXQgPSBmdW5jdGlvbiBwYXJzZU9mZnNldCh2YWx1ZSkge1xuXHQgIHZhciBfdmFsdWUkc3BsaXQgPSB2YWx1ZS5zcGxpdCgnICcpO1xuXG5cdCAgdmFyIF92YWx1ZSRzcGxpdDIgPSBfc2xpY2VkVG9BcnJheShfdmFsdWUkc3BsaXQsIDIpO1xuXG5cdCAgdmFyIHRvcCA9IF92YWx1ZSRzcGxpdDJbMF07XG5cdCAgdmFyIGxlZnQgPSBfdmFsdWUkc3BsaXQyWzFdO1xuXG5cdCAgcmV0dXJuIHsgdG9wOiB0b3AsIGxlZnQ6IGxlZnQgfTtcblx0fTtcblx0dmFyIHBhcnNlQXR0YWNobWVudCA9IHBhcnNlT2Zmc2V0O1xuXG5cdHZhciBUZXRoZXJDbGFzcyA9IChmdW5jdGlvbiAoKSB7XG5cdCAgZnVuY3Rpb24gVGV0aGVyQ2xhc3Mob3B0aW9ucykge1xuXHQgICAgdmFyIF90aGlzID0gdGhpcztcblxuXHQgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFRldGhlckNsYXNzKTtcblxuXHQgICAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uYmluZCh0aGlzKTtcblxuXHQgICAgdGV0aGVycy5wdXNoKHRoaXMpO1xuXG5cdCAgICB0aGlzLmhpc3RvcnkgPSBbXTtcblxuXHQgICAgdGhpcy5zZXRPcHRpb25zKG9wdGlvbnMsIGZhbHNlKTtcblxuXHQgICAgVGV0aGVyQmFzZS5tb2R1bGVzLmZvckVhY2goZnVuY3Rpb24gKG1vZHVsZSkge1xuXHQgICAgICBpZiAodHlwZW9mIG1vZHVsZS5pbml0aWFsaXplICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIG1vZHVsZS5pbml0aWFsaXplLmNhbGwoX3RoaXMpO1xuXHQgICAgICB9XG5cdCAgICB9KTtcblxuXHQgICAgdGhpcy5wb3NpdGlvbigpO1xuXHQgIH1cblxuXHQgIF9jcmVhdGVDbGFzcyhUZXRoZXJDbGFzcywgW3tcblx0ICAgIGtleTogJ2dldENsYXNzJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRDbGFzcygpIHtcblx0ICAgICAgdmFyIGtleSA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/ICcnIDogYXJndW1lbnRzWzBdO1xuXHQgICAgICB2YXIgY2xhc3NlcyA9IHRoaXMub3B0aW9ucy5jbGFzc2VzO1xuXG5cdCAgICAgIGlmICh0eXBlb2YgY2xhc3NlcyAhPT0gJ3VuZGVmaW5lZCcgJiYgY2xhc3Nlc1trZXldKSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5jbGFzc2VzW2tleV07XG5cdCAgICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmNsYXNzUHJlZml4KSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5jbGFzc1ByZWZpeCArICctJyArIGtleTtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICByZXR1cm4ga2V5O1xuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnc2V0T3B0aW9ucycsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gc2V0T3B0aW9ucyhvcHRpb25zKSB7XG5cdCAgICAgIHZhciBfdGhpczIgPSB0aGlzO1xuXG5cdCAgICAgIHZhciBwb3MgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDEgfHwgYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyB0cnVlIDogYXJndW1lbnRzWzFdO1xuXG5cdCAgICAgIHZhciBkZWZhdWx0cyA9IHtcblx0ICAgICAgICBvZmZzZXQ6ICcwIDAnLFxuXHQgICAgICAgIHRhcmdldE9mZnNldDogJzAgMCcsXG5cdCAgICAgICAgdGFyZ2V0QXR0YWNobWVudDogJ2F1dG8gYXV0bycsXG5cdCAgICAgICAgY2xhc3NQcmVmaXg6ICd0ZXRoZXInXG5cdCAgICAgIH07XG5cblx0ICAgICAgdGhpcy5vcHRpb25zID0gZXh0ZW5kKGRlZmF1bHRzLCBvcHRpb25zKTtcblxuXHQgICAgICB2YXIgX29wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG5cdCAgICAgIHZhciBlbGVtZW50ID0gX29wdGlvbnMuZWxlbWVudDtcblx0ICAgICAgdmFyIHRhcmdldCA9IF9vcHRpb25zLnRhcmdldDtcblx0ICAgICAgdmFyIHRhcmdldE1vZGlmaWVyID0gX29wdGlvbnMudGFyZ2V0TW9kaWZpZXI7XG5cblx0ICAgICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcblx0ICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG5cdCAgICAgIHRoaXMudGFyZ2V0TW9kaWZpZXIgPSB0YXJnZXRNb2RpZmllcjtcblxuXHQgICAgICBpZiAodGhpcy50YXJnZXQgPT09ICd2aWV3cG9ydCcpIHtcblx0ICAgICAgICB0aGlzLnRhcmdldCA9IGRvY3VtZW50LmJvZHk7XG5cdCAgICAgICAgdGhpcy50YXJnZXRNb2RpZmllciA9ICd2aXNpYmxlJztcblx0ICAgICAgfSBlbHNlIGlmICh0aGlzLnRhcmdldCA9PT0gJ3Njcm9sbC1oYW5kbGUnKSB7XG5cdCAgICAgICAgdGhpcy50YXJnZXQgPSBkb2N1bWVudC5ib2R5O1xuXHQgICAgICAgIHRoaXMudGFyZ2V0TW9kaWZpZXIgPSAnc2Nyb2xsLWhhbmRsZSc7XG5cdCAgICAgIH1cblxuXHQgICAgICBbJ2VsZW1lbnQnLCAndGFyZ2V0J10uZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG5cdCAgICAgICAgaWYgKHR5cGVvZiBfdGhpczJba2V5XSA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICAgIHRocm93IG5ldyBFcnJvcignVGV0aGVyIEVycm9yOiBCb3RoIGVsZW1lbnQgYW5kIHRhcmdldCBtdXN0IGJlIGRlZmluZWQnKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAodHlwZW9mIF90aGlzMltrZXldLmpxdWVyeSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICAgIF90aGlzMltrZXldID0gX3RoaXMyW2tleV1bMF07XG5cdCAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgX3RoaXMyW2tleV0gPT09ICdzdHJpbmcnKSB7XG5cdCAgICAgICAgICBfdGhpczJba2V5XSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoX3RoaXMyW2tleV0pO1xuXHQgICAgICAgIH1cblx0ICAgICAgfSk7XG5cblx0ICAgICAgYWRkQ2xhc3ModGhpcy5lbGVtZW50LCB0aGlzLmdldENsYXNzKCdlbGVtZW50JykpO1xuXHQgICAgICBpZiAoISh0aGlzLm9wdGlvbnMuYWRkVGFyZ2V0Q2xhc3NlcyA9PT0gZmFsc2UpKSB7XG5cdCAgICAgICAgYWRkQ2xhc3ModGhpcy50YXJnZXQsIHRoaXMuZ2V0Q2xhc3MoJ3RhcmdldCcpKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICghdGhpcy5vcHRpb25zLmF0dGFjaG1lbnQpIHtcblx0ICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RldGhlciBFcnJvcjogWW91IG11c3QgcHJvdmlkZSBhbiBhdHRhY2htZW50Jyk7XG5cdCAgICAgIH1cblxuXHQgICAgICB0aGlzLnRhcmdldEF0dGFjaG1lbnQgPSBwYXJzZUF0dGFjaG1lbnQodGhpcy5vcHRpb25zLnRhcmdldEF0dGFjaG1lbnQpO1xuXHQgICAgICB0aGlzLmF0dGFjaG1lbnQgPSBwYXJzZUF0dGFjaG1lbnQodGhpcy5vcHRpb25zLmF0dGFjaG1lbnQpO1xuXHQgICAgICB0aGlzLm9mZnNldCA9IHBhcnNlT2Zmc2V0KHRoaXMub3B0aW9ucy5vZmZzZXQpO1xuXHQgICAgICB0aGlzLnRhcmdldE9mZnNldCA9IHBhcnNlT2Zmc2V0KHRoaXMub3B0aW9ucy50YXJnZXRPZmZzZXQpO1xuXG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5zY3JvbGxQYXJlbnQgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgdGhpcy5kaXNhYmxlKCk7XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAodGhpcy50YXJnZXRNb2RpZmllciA9PT0gJ3Njcm9sbC1oYW5kbGUnKSB7XG5cdCAgICAgICAgdGhpcy5zY3JvbGxQYXJlbnQgPSB0aGlzLnRhcmdldDtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICB0aGlzLnNjcm9sbFBhcmVudCA9IGdldFNjcm9sbFBhcmVudCh0aGlzLnRhcmdldCk7XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAoISh0aGlzLm9wdGlvbnMuZW5hYmxlZCA9PT0gZmFsc2UpKSB7XG5cdCAgICAgICAgdGhpcy5lbmFibGUocG9zKTtcblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2dldFRhcmdldEJvdW5kcycsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0VGFyZ2V0Qm91bmRzKCkge1xuXHQgICAgICBpZiAodHlwZW9mIHRoaXMudGFyZ2V0TW9kaWZpZXIgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgaWYgKHRoaXMudGFyZ2V0TW9kaWZpZXIgPT09ICd2aXNpYmxlJykge1xuXHQgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0ID09PSBkb2N1bWVudC5ib2R5KSB7XG5cdCAgICAgICAgICAgIHJldHVybiB7IHRvcDogcGFnZVlPZmZzZXQsIGxlZnQ6IHBhZ2VYT2Zmc2V0LCBoZWlnaHQ6IGlubmVySGVpZ2h0LCB3aWR0aDogaW5uZXJXaWR0aCB9O1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgdmFyIGJvdW5kcyA9IGdldEJvdW5kcyh0aGlzLnRhcmdldCk7XG5cblx0ICAgICAgICAgICAgdmFyIG91dCA9IHtcblx0ICAgICAgICAgICAgICBoZWlnaHQ6IGJvdW5kcy5oZWlnaHQsXG5cdCAgICAgICAgICAgICAgd2lkdGg6IGJvdW5kcy53aWR0aCxcblx0ICAgICAgICAgICAgICB0b3A6IGJvdW5kcy50b3AsXG5cdCAgICAgICAgICAgICAgbGVmdDogYm91bmRzLmxlZnRcblx0ICAgICAgICAgICAgfTtcblxuXHQgICAgICAgICAgICBvdXQuaGVpZ2h0ID0gTWF0aC5taW4ob3V0LmhlaWdodCwgYm91bmRzLmhlaWdodCAtIChwYWdlWU9mZnNldCAtIGJvdW5kcy50b3ApKTtcblx0ICAgICAgICAgICAgb3V0LmhlaWdodCA9IE1hdGgubWluKG91dC5oZWlnaHQsIGJvdW5kcy5oZWlnaHQgLSAoYm91bmRzLnRvcCArIGJvdW5kcy5oZWlnaHQgLSAocGFnZVlPZmZzZXQgKyBpbm5lckhlaWdodCkpKTtcblx0ICAgICAgICAgICAgb3V0LmhlaWdodCA9IE1hdGgubWluKGlubmVySGVpZ2h0LCBvdXQuaGVpZ2h0KTtcblx0ICAgICAgICAgICAgb3V0LmhlaWdodCAtPSAyO1xuXG5cdCAgICAgICAgICAgIG91dC53aWR0aCA9IE1hdGgubWluKG91dC53aWR0aCwgYm91bmRzLndpZHRoIC0gKHBhZ2VYT2Zmc2V0IC0gYm91bmRzLmxlZnQpKTtcblx0ICAgICAgICAgICAgb3V0LndpZHRoID0gTWF0aC5taW4ob3V0LndpZHRoLCBib3VuZHMud2lkdGggLSAoYm91bmRzLmxlZnQgKyBib3VuZHMud2lkdGggLSAocGFnZVhPZmZzZXQgKyBpbm5lcldpZHRoKSkpO1xuXHQgICAgICAgICAgICBvdXQud2lkdGggPSBNYXRoLm1pbihpbm5lcldpZHRoLCBvdXQud2lkdGgpO1xuXHQgICAgICAgICAgICBvdXQud2lkdGggLT0gMjtcblxuXHQgICAgICAgICAgICBpZiAob3V0LnRvcCA8IHBhZ2VZT2Zmc2V0KSB7XG5cdCAgICAgICAgICAgICAgb3V0LnRvcCA9IHBhZ2VZT2Zmc2V0O1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIGlmIChvdXQubGVmdCA8IHBhZ2VYT2Zmc2V0KSB7XG5cdCAgICAgICAgICAgICAgb3V0LmxlZnQgPSBwYWdlWE9mZnNldDtcblx0ICAgICAgICAgICAgfVxuXG5cdCAgICAgICAgICAgIHJldHVybiBvdXQ7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfSBlbHNlIGlmICh0aGlzLnRhcmdldE1vZGlmaWVyID09PSAnc2Nyb2xsLWhhbmRsZScpIHtcblx0ICAgICAgICAgIHZhciBib3VuZHMgPSB1bmRlZmluZWQ7XG5cdCAgICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy50YXJnZXQ7XG5cdCAgICAgICAgICBpZiAodGFyZ2V0ID09PSBkb2N1bWVudC5ib2R5KSB7XG5cdCAgICAgICAgICAgIHRhcmdldCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblxuXHQgICAgICAgICAgICBib3VuZHMgPSB7XG5cdCAgICAgICAgICAgICAgbGVmdDogcGFnZVhPZmZzZXQsXG5cdCAgICAgICAgICAgICAgdG9wOiBwYWdlWU9mZnNldCxcblx0ICAgICAgICAgICAgICBoZWlnaHQ6IGlubmVySGVpZ2h0LFxuXHQgICAgICAgICAgICAgIHdpZHRoOiBpbm5lcldpZHRoXG5cdCAgICAgICAgICAgIH07XG5cdCAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICBib3VuZHMgPSBnZXRCb3VuZHModGFyZ2V0KTtcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgdmFyIHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZSh0YXJnZXQpO1xuXG5cdCAgICAgICAgICB2YXIgaGFzQm90dG9tU2Nyb2xsID0gdGFyZ2V0LnNjcm9sbFdpZHRoID4gdGFyZ2V0LmNsaWVudFdpZHRoIHx8IFtzdHlsZS5vdmVyZmxvdywgc3R5bGUub3ZlcmZsb3dYXS5pbmRleE9mKCdzY3JvbGwnKSA+PSAwIHx8IHRoaXMudGFyZ2V0ICE9PSBkb2N1bWVudC5ib2R5O1xuXG5cdCAgICAgICAgICB2YXIgc2Nyb2xsQm90dG9tID0gMDtcblx0ICAgICAgICAgIGlmIChoYXNCb3R0b21TY3JvbGwpIHtcblx0ICAgICAgICAgICAgc2Nyb2xsQm90dG9tID0gMTU7XG5cdCAgICAgICAgICB9XG5cblx0ICAgICAgICAgIHZhciBoZWlnaHQgPSBib3VuZHMuaGVpZ2h0IC0gcGFyc2VGbG9hdChzdHlsZS5ib3JkZXJUb3BXaWR0aCkgLSBwYXJzZUZsb2F0KHN0eWxlLmJvcmRlckJvdHRvbVdpZHRoKSAtIHNjcm9sbEJvdHRvbTtcblxuXHQgICAgICAgICAgdmFyIG91dCA9IHtcblx0ICAgICAgICAgICAgd2lkdGg6IDE1LFxuXHQgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCAqIDAuOTc1ICogKGhlaWdodCAvIHRhcmdldC5zY3JvbGxIZWlnaHQpLFxuXHQgICAgICAgICAgICBsZWZ0OiBib3VuZHMubGVmdCArIGJvdW5kcy53aWR0aCAtIHBhcnNlRmxvYXQoc3R5bGUuYm9yZGVyTGVmdFdpZHRoKSAtIDE1XG5cdCAgICAgICAgICB9O1xuXG5cdCAgICAgICAgICB2YXIgZml0QWRqID0gMDtcblx0ICAgICAgICAgIGlmIChoZWlnaHQgPCA0MDggJiYgdGhpcy50YXJnZXQgPT09IGRvY3VtZW50LmJvZHkpIHtcblx0ICAgICAgICAgICAgZml0QWRqID0gLTAuMDAwMTEgKiBNYXRoLnBvdyhoZWlnaHQsIDIpIC0gMC4wMDcyNyAqIGhlaWdodCArIDIyLjU4O1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBpZiAodGhpcy50YXJnZXQgIT09IGRvY3VtZW50LmJvZHkpIHtcblx0ICAgICAgICAgICAgb3V0LmhlaWdodCA9IE1hdGgubWF4KG91dC5oZWlnaHQsIDI0KTtcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgdmFyIHNjcm9sbFBlcmNlbnRhZ2UgPSB0aGlzLnRhcmdldC5zY3JvbGxUb3AgLyAodGFyZ2V0LnNjcm9sbEhlaWdodCAtIGhlaWdodCk7XG5cdCAgICAgICAgICBvdXQudG9wID0gc2Nyb2xsUGVyY2VudGFnZSAqIChoZWlnaHQgLSBvdXQuaGVpZ2h0IC0gZml0QWRqKSArIGJvdW5kcy50b3AgKyBwYXJzZUZsb2F0KHN0eWxlLmJvcmRlclRvcFdpZHRoKTtcblxuXHQgICAgICAgICAgaWYgKHRoaXMudGFyZ2V0ID09PSBkb2N1bWVudC5ib2R5KSB7XG5cdCAgICAgICAgICAgIG91dC5oZWlnaHQgPSBNYXRoLm1heChvdXQuaGVpZ2h0LCAyNCk7XG5cdCAgICAgICAgICB9XG5cblx0ICAgICAgICAgIHJldHVybiBvdXQ7XG5cdCAgICAgICAgfVxuXHQgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIHJldHVybiBnZXRCb3VuZHModGhpcy50YXJnZXQpO1xuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnY2xlYXJDYWNoZScsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gY2xlYXJDYWNoZSgpIHtcblx0ICAgICAgdGhpcy5fY2FjaGUgPSB7fTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdjYWNoZScsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gY2FjaGUoaywgZ2V0dGVyKSB7XG5cdCAgICAgIC8vIE1vcmUgdGhhbiBvbmUgbW9kdWxlIHdpbGwgb2Z0ZW4gbmVlZCB0aGUgc2FtZSBET00gaW5mbywgc29cblx0ICAgICAgLy8gd2Uga2VlcCBhIGNhY2hlIHdoaWNoIGlzIGNsZWFyZWQgb24gZWFjaCBwb3NpdGlvbiBjYWxsXG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5fY2FjaGUgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgdGhpcy5fY2FjaGUgPSB7fTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5fY2FjaGVba10gPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgdGhpcy5fY2FjaGVba10gPSBnZXR0ZXIuY2FsbCh0aGlzKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIHJldHVybiB0aGlzLl9jYWNoZVtrXTtcblx0ICAgIH1cblx0ICB9LCB7XG5cdCAgICBrZXk6ICdlbmFibGUnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGVuYWJsZSgpIHtcblx0ICAgICAgdmFyIHBvcyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHRydWUgOiBhcmd1bWVudHNbMF07XG5cblx0ICAgICAgaWYgKCEodGhpcy5vcHRpb25zLmFkZFRhcmdldENsYXNzZXMgPT09IGZhbHNlKSkge1xuXHQgICAgICAgIGFkZENsYXNzKHRoaXMudGFyZ2V0LCB0aGlzLmdldENsYXNzKCdlbmFibGVkJykpO1xuXHQgICAgICB9XG5cdCAgICAgIGFkZENsYXNzKHRoaXMuZWxlbWVudCwgdGhpcy5nZXRDbGFzcygnZW5hYmxlZCcpKTtcblx0ICAgICAgdGhpcy5lbmFibGVkID0gdHJ1ZTtcblxuXHQgICAgICBpZiAodGhpcy5zY3JvbGxQYXJlbnQgIT09IGRvY3VtZW50KSB7XG5cdCAgICAgICAgdGhpcy5zY3JvbGxQYXJlbnQuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgdGhpcy5wb3NpdGlvbik7XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAocG9zKSB7XG5cdCAgICAgICAgdGhpcy5wb3NpdGlvbigpO1xuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfSwge1xuXHQgICAga2V5OiAnZGlzYWJsZScsXG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gZGlzYWJsZSgpIHtcblx0ICAgICAgcmVtb3ZlQ2xhc3ModGhpcy50YXJnZXQsIHRoaXMuZ2V0Q2xhc3MoJ2VuYWJsZWQnKSk7XG5cdCAgICAgIHJlbW92ZUNsYXNzKHRoaXMuZWxlbWVudCwgdGhpcy5nZXRDbGFzcygnZW5hYmxlZCcpKTtcblx0ICAgICAgdGhpcy5lbmFibGVkID0gZmFsc2U7XG5cblx0ICAgICAgaWYgKHR5cGVvZiB0aGlzLnNjcm9sbFBhcmVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICB0aGlzLnNjcm9sbFBhcmVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdzY3JvbGwnLCB0aGlzLnBvc2l0aW9uKTtcblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ2Rlc3Ryb3knLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG5cdCAgICAgIHZhciBfdGhpczMgPSB0aGlzO1xuXG5cdCAgICAgIHRoaXMuZGlzYWJsZSgpO1xuXG5cdCAgICAgIHRldGhlcnMuZm9yRWFjaChmdW5jdGlvbiAodGV0aGVyLCBpKSB7XG5cdCAgICAgICAgaWYgKHRldGhlciA9PT0gX3RoaXMzKSB7XG5cdCAgICAgICAgICB0ZXRoZXJzLnNwbGljZShpLCAxKTtcblx0ICAgICAgICAgIHJldHVybjtcblx0ICAgICAgICB9XG5cdCAgICAgIH0pO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ3VwZGF0ZUF0dGFjaENsYXNzZXMnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIHVwZGF0ZUF0dGFjaENsYXNzZXMoZWxlbWVudEF0dGFjaCwgdGFyZ2V0QXR0YWNoKSB7XG5cdCAgICAgIHZhciBfdGhpczQgPSB0aGlzO1xuXG5cdCAgICAgIGVsZW1lbnRBdHRhY2ggPSBlbGVtZW50QXR0YWNoIHx8IHRoaXMuYXR0YWNobWVudDtcblx0ICAgICAgdGFyZ2V0QXR0YWNoID0gdGFyZ2V0QXR0YWNoIHx8IHRoaXMudGFyZ2V0QXR0YWNobWVudDtcblx0ICAgICAgdmFyIHNpZGVzID0gWydsZWZ0JywgJ3RvcCcsICdib3R0b20nLCAncmlnaHQnLCAnbWlkZGxlJywgJ2NlbnRlciddO1xuXG5cdCAgICAgIGlmICh0eXBlb2YgdGhpcy5fYWRkQXR0YWNoQ2xhc3NlcyAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5fYWRkQXR0YWNoQ2xhc3Nlcy5sZW5ndGgpIHtcblx0ICAgICAgICAvLyB1cGRhdGVBdHRhY2hDbGFzc2VzIGNhbiBiZSBjYWxsZWQgbW9yZSB0aGFuIG9uY2UgaW4gYSBwb3NpdGlvbiBjYWxsLCBzb1xuXHQgICAgICAgIC8vIHdlIG5lZWQgdG8gY2xlYW4gdXAgYWZ0ZXIgb3Vyc2VsdmVzIHN1Y2ggdGhhdCB3aGVuIHRoZSBsYXN0IGRlZmVyIGdldHNcblx0ICAgICAgICAvLyByYW4gaXQgZG9lc24ndCBhZGQgYW55IGV4dHJhIGNsYXNzZXMgZnJvbSBwcmV2aW91cyBjYWxscy5cblx0ICAgICAgICB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzLnNwbGljZSgwLCB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzLmxlbmd0aCk7XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAodHlwZW9mIHRoaXMuX2FkZEF0dGFjaENsYXNzZXMgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgdGhpcy5fYWRkQXR0YWNoQ2xhc3NlcyA9IFtdO1xuXHQgICAgICB9XG5cdCAgICAgIHZhciBhZGQgPSB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzO1xuXG5cdCAgICAgIGlmIChlbGVtZW50QXR0YWNoLnRvcCkge1xuXHQgICAgICAgIGFkZC5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ2VsZW1lbnQtYXR0YWNoZWQnKSArICctJyArIGVsZW1lbnRBdHRhY2gudG9wKTtcblx0ICAgICAgfVxuXHQgICAgICBpZiAoZWxlbWVudEF0dGFjaC5sZWZ0KSB7XG5cdCAgICAgICAgYWRkLnB1c2godGhpcy5nZXRDbGFzcygnZWxlbWVudC1hdHRhY2hlZCcpICsgJy0nICsgZWxlbWVudEF0dGFjaC5sZWZ0KTtcblx0ICAgICAgfVxuXHQgICAgICBpZiAodGFyZ2V0QXR0YWNoLnRvcCkge1xuXHQgICAgICAgIGFkZC5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ3RhcmdldC1hdHRhY2hlZCcpICsgJy0nICsgdGFyZ2V0QXR0YWNoLnRvcCk7XG5cdCAgICAgIH1cblx0ICAgICAgaWYgKHRhcmdldEF0dGFjaC5sZWZ0KSB7XG5cdCAgICAgICAgYWRkLnB1c2godGhpcy5nZXRDbGFzcygndGFyZ2V0LWF0dGFjaGVkJykgKyAnLScgKyB0YXJnZXRBdHRhY2gubGVmdCk7XG5cdCAgICAgIH1cblxuXHQgICAgICB2YXIgYWxsID0gW107XG5cdCAgICAgIHNpZGVzLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcblx0ICAgICAgICBhbGwucHVzaChfdGhpczQuZ2V0Q2xhc3MoJ2VsZW1lbnQtYXR0YWNoZWQnKSArICctJyArIHNpZGUpO1xuXHQgICAgICAgIGFsbC5wdXNoKF90aGlzNC5nZXRDbGFzcygndGFyZ2V0LWF0dGFjaGVkJykgKyAnLScgKyBzaWRlKTtcblx0ICAgICAgfSk7XG5cblx0ICAgICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuXHQgICAgICAgIGlmICghKHR5cGVvZiBfdGhpczQuX2FkZEF0dGFjaENsYXNzZXMgIT09ICd1bmRlZmluZWQnKSkge1xuXHQgICAgICAgICAgcmV0dXJuO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXM0LmVsZW1lbnQsIF90aGlzNC5fYWRkQXR0YWNoQ2xhc3NlcywgYWxsKTtcblx0ICAgICAgICBpZiAoIShfdGhpczQub3B0aW9ucy5hZGRUYXJnZXRDbGFzc2VzID09PSBmYWxzZSkpIHtcblx0ICAgICAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXM0LnRhcmdldCwgX3RoaXM0Ll9hZGRBdHRhY2hDbGFzc2VzLCBhbGwpO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGRlbGV0ZSBfdGhpczQuX2FkZEF0dGFjaENsYXNzZXM7XG5cdCAgICAgIH0pO1xuXHQgICAgfVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ3Bvc2l0aW9uJyxcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiBwb3NpdGlvbigpIHtcblx0ICAgICAgdmFyIF90aGlzNSA9IHRoaXM7XG5cblx0ICAgICAgdmFyIGZsdXNoQ2hhbmdlcyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHRydWUgOiBhcmd1bWVudHNbMF07XG5cblx0ICAgICAgLy8gZmx1c2hDaGFuZ2VzIGNvbW1pdHMgdGhlIGNoYW5nZXMgaW1tZWRpYXRlbHksIGxlYXZlIHRydWUgdW5sZXNzIHlvdSBhcmUgcG9zaXRpb25pbmcgbXVsdGlwbGVcblx0ICAgICAgLy8gdGV0aGVycyAoaW4gd2hpY2ggY2FzZSBjYWxsIFRldGhlci5VdGlscy5mbHVzaCB5b3Vyc2VsZiB3aGVuIHlvdSdyZSBkb25lKVxuXG5cdCAgICAgIGlmICghdGhpcy5lbmFibGVkKSB7XG5cdCAgICAgICAgcmV0dXJuO1xuXHQgICAgICB9XG5cblx0ICAgICAgdGhpcy5jbGVhckNhY2hlKCk7XG5cblx0ICAgICAgLy8gVHVybiAnYXV0bycgYXR0YWNobWVudHMgaW50byB0aGUgYXBwcm9wcmlhdGUgY29ybmVyIG9yIGVkZ2Vcblx0ICAgICAgdmFyIHRhcmdldEF0dGFjaG1lbnQgPSBhdXRvVG9GaXhlZEF0dGFjaG1lbnQodGhpcy50YXJnZXRBdHRhY2htZW50LCB0aGlzLmF0dGFjaG1lbnQpO1xuXG5cdCAgICAgIHRoaXMudXBkYXRlQXR0YWNoQ2xhc3Nlcyh0aGlzLmF0dGFjaG1lbnQsIHRhcmdldEF0dGFjaG1lbnQpO1xuXG5cdCAgICAgIHZhciBlbGVtZW50UG9zID0gdGhpcy5jYWNoZSgnZWxlbWVudC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgcmV0dXJuIGdldEJvdW5kcyhfdGhpczUuZWxlbWVudCk7XG5cdCAgICAgIH0pO1xuXG5cdCAgICAgIHZhciB3aWR0aCA9IGVsZW1lbnRQb3Mud2lkdGg7XG5cdCAgICAgIHZhciBoZWlnaHQgPSBlbGVtZW50UG9zLmhlaWdodDtcblxuXHQgICAgICBpZiAod2lkdGggPT09IDAgJiYgaGVpZ2h0ID09PSAwICYmIHR5cGVvZiB0aGlzLmxhc3RTaXplICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIHZhciBfbGFzdFNpemUgPSB0aGlzLmxhc3RTaXplO1xuXG5cdCAgICAgICAgLy8gV2UgY2FjaGUgdGhlIGhlaWdodCBhbmQgd2lkdGggdG8gbWFrZSBpdCBwb3NzaWJsZSB0byBwb3NpdGlvbiBlbGVtZW50cyB0aGF0IGFyZVxuXHQgICAgICAgIC8vIGdldHRpbmcgaGlkZGVuLlxuXHQgICAgICAgIHdpZHRoID0gX2xhc3RTaXplLndpZHRoO1xuXHQgICAgICAgIGhlaWdodCA9IF9sYXN0U2l6ZS5oZWlnaHQ7XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgdGhpcy5sYXN0U2l6ZSA9IHsgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodCB9O1xuXHQgICAgICB9XG5cblx0ICAgICAgdmFyIHRhcmdldFBvcyA9IHRoaXMuY2FjaGUoJ3RhcmdldC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgcmV0dXJuIF90aGlzNS5nZXRUYXJnZXRCb3VuZHMoKTtcblx0ICAgICAgfSk7XG5cdCAgICAgIHZhciB0YXJnZXRTaXplID0gdGFyZ2V0UG9zO1xuXG5cdCAgICAgIC8vIEdldCBhbiBhY3R1YWwgcHggb2Zmc2V0IGZyb20gdGhlIGF0dGFjaG1lbnRcblx0ICAgICAgdmFyIG9mZnNldCA9IG9mZnNldFRvUHgoYXR0YWNobWVudFRvT2Zmc2V0KHRoaXMuYXR0YWNobWVudCksIHsgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodCB9KTtcblx0ICAgICAgdmFyIHRhcmdldE9mZnNldCA9IG9mZnNldFRvUHgoYXR0YWNobWVudFRvT2Zmc2V0KHRhcmdldEF0dGFjaG1lbnQpLCB0YXJnZXRTaXplKTtcblxuXHQgICAgICB2YXIgbWFudWFsT2Zmc2V0ID0gb2Zmc2V0VG9QeCh0aGlzLm9mZnNldCwgeyB3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0IH0pO1xuXHQgICAgICB2YXIgbWFudWFsVGFyZ2V0T2Zmc2V0ID0gb2Zmc2V0VG9QeCh0aGlzLnRhcmdldE9mZnNldCwgdGFyZ2V0U2l6ZSk7XG5cblx0ICAgICAgLy8gQWRkIHRoZSBtYW51YWxseSBwcm92aWRlZCBvZmZzZXRcblx0ICAgICAgb2Zmc2V0ID0gYWRkT2Zmc2V0KG9mZnNldCwgbWFudWFsT2Zmc2V0KTtcblx0ICAgICAgdGFyZ2V0T2Zmc2V0ID0gYWRkT2Zmc2V0KHRhcmdldE9mZnNldCwgbWFudWFsVGFyZ2V0T2Zmc2V0KTtcblxuXHQgICAgICAvLyBJdCdzIG5vdyBvdXIgZ29hbCB0byBtYWtlIChlbGVtZW50IHBvc2l0aW9uICsgb2Zmc2V0KSA9PSAodGFyZ2V0IHBvc2l0aW9uICsgdGFyZ2V0IG9mZnNldClcblx0ICAgICAgdmFyIGxlZnQgPSB0YXJnZXRQb3MubGVmdCArIHRhcmdldE9mZnNldC5sZWZ0IC0gb2Zmc2V0LmxlZnQ7XG5cdCAgICAgIHZhciB0b3AgPSB0YXJnZXRQb3MudG9wICsgdGFyZ2V0T2Zmc2V0LnRvcCAtIG9mZnNldC50b3A7XG5cblx0ICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBUZXRoZXJCYXNlLm1vZHVsZXMubGVuZ3RoOyArK2kpIHtcblx0ICAgICAgICB2YXIgX21vZHVsZTIgPSBUZXRoZXJCYXNlLm1vZHVsZXNbaV07XG5cdCAgICAgICAgdmFyIHJldCA9IF9tb2R1bGUyLnBvc2l0aW9uLmNhbGwodGhpcywge1xuXHQgICAgICAgICAgbGVmdDogbGVmdCxcblx0ICAgICAgICAgIHRvcDogdG9wLFxuXHQgICAgICAgICAgdGFyZ2V0QXR0YWNobWVudDogdGFyZ2V0QXR0YWNobWVudCxcblx0ICAgICAgICAgIHRhcmdldFBvczogdGFyZ2V0UG9zLFxuXHQgICAgICAgICAgZWxlbWVudFBvczogZWxlbWVudFBvcyxcblx0ICAgICAgICAgIG9mZnNldDogb2Zmc2V0LFxuXHQgICAgICAgICAgdGFyZ2V0T2Zmc2V0OiB0YXJnZXRPZmZzZXQsXG5cdCAgICAgICAgICBtYW51YWxPZmZzZXQ6IG1hbnVhbE9mZnNldCxcblx0ICAgICAgICAgIG1hbnVhbFRhcmdldE9mZnNldDogbWFudWFsVGFyZ2V0T2Zmc2V0LFxuXHQgICAgICAgICAgc2Nyb2xsYmFyU2l6ZTogc2Nyb2xsYmFyU2l6ZSxcblx0ICAgICAgICAgIGF0dGFjaG1lbnQ6IHRoaXMuYXR0YWNobWVudFxuXHQgICAgICAgIH0pO1xuXG5cdCAgICAgICAgaWYgKHJldCA9PT0gZmFsc2UpIHtcblx0ICAgICAgICAgIHJldHVybiBmYWxzZTtcblx0ICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiByZXQgPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiByZXQgIT09ICdvYmplY3QnKSB7XG5cdCAgICAgICAgICBjb250aW51ZTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgdG9wID0gcmV0LnRvcDtcblx0ICAgICAgICAgIGxlZnQgPSByZXQubGVmdDtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICAvLyBXZSBkZXNjcmliZSB0aGUgcG9zaXRpb24gdGhyZWUgZGlmZmVyZW50IHdheXMgdG8gZ2l2ZSB0aGUgb3B0aW1pemVyXG5cdCAgICAgIC8vIGEgY2hhbmNlIHRvIGRlY2lkZSB0aGUgYmVzdCBwb3NzaWJsZSB3YXkgdG8gcG9zaXRpb24gdGhlIGVsZW1lbnRcblx0ICAgICAgLy8gd2l0aCB0aGUgZmV3ZXN0IHJlcGFpbnRzLlxuXHQgICAgICB2YXIgbmV4dCA9IHtcblx0ICAgICAgICAvLyBJdCdzIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSBwYWdlIChhYnNvbHV0ZSBwb3NpdGlvbmluZyB3aGVuXG5cdCAgICAgICAgLy8gdGhlIGVsZW1lbnQgaXMgYSBjaGlsZCBvZiB0aGUgYm9keSlcblx0ICAgICAgICBwYWdlOiB7XG5cdCAgICAgICAgICB0b3A6IHRvcCxcblx0ICAgICAgICAgIGxlZnQ6IGxlZnRcblx0ICAgICAgICB9LFxuXG5cdCAgICAgICAgLy8gSXQncyBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQgKGZpeGVkIHBvc2l0aW9uaW5nKVxuXHQgICAgICAgIHZpZXdwb3J0OiB7XG5cdCAgICAgICAgICB0b3A6IHRvcCAtIHBhZ2VZT2Zmc2V0LFxuXHQgICAgICAgICAgYm90dG9tOiBwYWdlWU9mZnNldCAtIHRvcCAtIGhlaWdodCArIGlubmVySGVpZ2h0LFxuXHQgICAgICAgICAgbGVmdDogbGVmdCAtIHBhZ2VYT2Zmc2V0LFxuXHQgICAgICAgICAgcmlnaHQ6IHBhZ2VYT2Zmc2V0IC0gbGVmdCAtIHdpZHRoICsgaW5uZXJXaWR0aFxuXHQgICAgICAgIH1cblx0ICAgICAgfTtcblxuXHQgICAgICB2YXIgc2Nyb2xsYmFyU2l6ZSA9IHVuZGVmaW5lZDtcblx0ICAgICAgaWYgKGRvY3VtZW50LmJvZHkuc2Nyb2xsV2lkdGggPiB3aW5kb3cuaW5uZXJXaWR0aCkge1xuXHQgICAgICAgIHNjcm9sbGJhclNpemUgPSB0aGlzLmNhY2hlKCdzY3JvbGxiYXItc2l6ZScsIGdldFNjcm9sbEJhclNpemUpO1xuXHQgICAgICAgIG5leHQudmlld3BvcnQuYm90dG9tIC09IHNjcm9sbGJhclNpemUuaGVpZ2h0O1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKGRvY3VtZW50LmJvZHkuc2Nyb2xsSGVpZ2h0ID4gd2luZG93LmlubmVySGVpZ2h0KSB7XG5cdCAgICAgICAgc2Nyb2xsYmFyU2l6ZSA9IHRoaXMuY2FjaGUoJ3Njcm9sbGJhci1zaXplJywgZ2V0U2Nyb2xsQmFyU2l6ZSk7XG5cdCAgICAgICAgbmV4dC52aWV3cG9ydC5yaWdodCAtPSBzY3JvbGxiYXJTaXplLndpZHRoO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKFsnJywgJ3N0YXRpYyddLmluZGV4T2YoZG9jdW1lbnQuYm9keS5zdHlsZS5wb3NpdGlvbikgPT09IC0xIHx8IFsnJywgJ3N0YXRpYyddLmluZGV4T2YoZG9jdW1lbnQuYm9keS5wYXJlbnRFbGVtZW50LnN0eWxlLnBvc2l0aW9uKSA9PT0gLTEpIHtcblx0ICAgICAgICAvLyBBYnNvbHV0ZSBwb3NpdGlvbmluZyBpbiB0aGUgYm9keSB3aWxsIGJlIHJlbGF0aXZlIHRvIHRoZSBwYWdlLCBub3QgdGhlICdpbml0aWFsIGNvbnRhaW5pbmcgYmxvY2snXG5cdCAgICAgICAgbmV4dC5wYWdlLmJvdHRvbSA9IGRvY3VtZW50LmJvZHkuc2Nyb2xsSGVpZ2h0IC0gdG9wIC0gaGVpZ2h0O1xuXHQgICAgICAgIG5leHQucGFnZS5yaWdodCA9IGRvY3VtZW50LmJvZHkuc2Nyb2xsV2lkdGggLSBsZWZ0IC0gd2lkdGg7XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAodHlwZW9mIHRoaXMub3B0aW9ucy5vcHRpbWl6YXRpb25zICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLm9wdGlvbnMub3B0aW1pemF0aW9ucy5tb3ZlRWxlbWVudCAhPT0gZmFsc2UgJiYgISh0eXBlb2YgdGhpcy50YXJnZXRNb2RpZmllciAhPT0gJ3VuZGVmaW5lZCcpKSB7XG5cdCAgICAgICAgKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnQgPSBfdGhpczUuY2FjaGUoJ3RhcmdldC1vZmZzZXRwYXJlbnQnLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBnZXRPZmZzZXRQYXJlbnQoX3RoaXM1LnRhcmdldCk7XG5cdCAgICAgICAgICB9KTtcblx0ICAgICAgICAgIHZhciBvZmZzZXRQb3NpdGlvbiA9IF90aGlzNS5jYWNoZSgndGFyZ2V0LW9mZnNldHBhcmVudC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAgIHJldHVybiBnZXRCb3VuZHMob2Zmc2V0UGFyZW50KTtcblx0ICAgICAgICAgIH0pO1xuXHQgICAgICAgICAgdmFyIG9mZnNldFBhcmVudFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShvZmZzZXRQYXJlbnQpO1xuXHQgICAgICAgICAgdmFyIG9mZnNldFBhcmVudFNpemUgPSBvZmZzZXRQb3NpdGlvbjtcblxuXHQgICAgICAgICAgdmFyIG9mZnNldEJvcmRlciA9IHt9O1xuXHQgICAgICAgICAgWydUb3AnLCAnTGVmdCcsICdCb3R0b20nLCAnUmlnaHQnXS5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG5cdCAgICAgICAgICAgIG9mZnNldEJvcmRlcltzaWRlLnRvTG93ZXJDYXNlKCldID0gcGFyc2VGbG9hdChvZmZzZXRQYXJlbnRTdHlsZVsnYm9yZGVyJyArIHNpZGUgKyAnV2lkdGgnXSk7XG5cdCAgICAgICAgICB9KTtcblxuXHQgICAgICAgICAgb2Zmc2V0UG9zaXRpb24ucmlnaHQgPSBkb2N1bWVudC5ib2R5LnNjcm9sbFdpZHRoIC0gb2Zmc2V0UG9zaXRpb24ubGVmdCAtIG9mZnNldFBhcmVudFNpemUud2lkdGggKyBvZmZzZXRCb3JkZXIucmlnaHQ7XG5cdCAgICAgICAgICBvZmZzZXRQb3NpdGlvbi5ib3R0b20gPSBkb2N1bWVudC5ib2R5LnNjcm9sbEhlaWdodCAtIG9mZnNldFBvc2l0aW9uLnRvcCAtIG9mZnNldFBhcmVudFNpemUuaGVpZ2h0ICsgb2Zmc2V0Qm9yZGVyLmJvdHRvbTtcblxuXHQgICAgICAgICAgaWYgKG5leHQucGFnZS50b3AgPj0gb2Zmc2V0UG9zaXRpb24udG9wICsgb2Zmc2V0Qm9yZGVyLnRvcCAmJiBuZXh0LnBhZ2UuYm90dG9tID49IG9mZnNldFBvc2l0aW9uLmJvdHRvbSkge1xuXHQgICAgICAgICAgICBpZiAobmV4dC5wYWdlLmxlZnQgPj0gb2Zmc2V0UG9zaXRpb24ubGVmdCArIG9mZnNldEJvcmRlci5sZWZ0ICYmIG5leHQucGFnZS5yaWdodCA+PSBvZmZzZXRQb3NpdGlvbi5yaWdodCkge1xuXHQgICAgICAgICAgICAgIC8vIFdlJ3JlIHdpdGhpbiB0aGUgdmlzaWJsZSBwYXJ0IG9mIHRoZSB0YXJnZXQncyBzY3JvbGwgcGFyZW50XG5cdCAgICAgICAgICAgICAgdmFyIHNjcm9sbFRvcCA9IG9mZnNldFBhcmVudC5zY3JvbGxUb3A7XG5cdCAgICAgICAgICAgICAgdmFyIHNjcm9sbExlZnQgPSBvZmZzZXRQYXJlbnQuc2Nyb2xsTGVmdDtcblxuXHQgICAgICAgICAgICAgIC8vIEl0J3MgcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIHRhcmdldCdzIG9mZnNldCBwYXJlbnQgKGFic29sdXRlIHBvc2l0aW9uaW5nIHdoZW5cblx0ICAgICAgICAgICAgICAvLyB0aGUgZWxlbWVudCBpcyBtb3ZlZCB0byBiZSBhIGNoaWxkIG9mIHRoZSB0YXJnZXQncyBvZmZzZXQgcGFyZW50KS5cblx0ICAgICAgICAgICAgICBuZXh0Lm9mZnNldCA9IHtcblx0ICAgICAgICAgICAgICAgIHRvcDogbmV4dC5wYWdlLnRvcCAtIG9mZnNldFBvc2l0aW9uLnRvcCArIHNjcm9sbFRvcCAtIG9mZnNldEJvcmRlci50b3AsXG5cdCAgICAgICAgICAgICAgICBsZWZ0OiBuZXh0LnBhZ2UubGVmdCAtIG9mZnNldFBvc2l0aW9uLmxlZnQgKyBzY3JvbGxMZWZ0IC0gb2Zmc2V0Qm9yZGVyLmxlZnRcblx0ICAgICAgICAgICAgICB9O1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfSkoKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIC8vIFdlIGNvdWxkIGFsc28gdHJhdmVsIHVwIHRoZSBET00gYW5kIHRyeSBlYWNoIGNvbnRhaW5pbmcgY29udGV4dCwgcmF0aGVyIHRoYW4gb25seVxuXHQgICAgICAvLyBsb29raW5nIGF0IHRoZSBib2R5LCBidXQgd2UncmUgZ29ubmEgZ2V0IGRpbWluaXNoaW5nIHJldHVybnMuXG5cblx0ICAgICAgdGhpcy5tb3ZlKG5leHQpO1xuXG5cdCAgICAgIHRoaXMuaGlzdG9yeS51bnNoaWZ0KG5leHQpO1xuXG5cdCAgICAgIGlmICh0aGlzLmhpc3RvcnkubGVuZ3RoID4gMykge1xuXHQgICAgICAgIHRoaXMuaGlzdG9yeS5wb3AoKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmIChmbHVzaENoYW5nZXMpIHtcblx0ICAgICAgICBmbHVzaCgpO1xuXHQgICAgICB9XG5cblx0ICAgICAgcmV0dXJuIHRydWU7XG5cdCAgICB9XG5cblx0ICAgIC8vIFRIRSBJU1NVRVxuXHQgIH0sIHtcblx0ICAgIGtleTogJ21vdmUnLFxuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIG1vdmUocG9zKSB7XG5cdCAgICAgIHZhciBfdGhpczYgPSB0aGlzO1xuXG5cdCAgICAgIGlmICghKHR5cGVvZiB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZSAhPT0gJ3VuZGVmaW5lZCcpKSB7XG5cdCAgICAgICAgcmV0dXJuO1xuXHQgICAgICB9XG5cblx0ICAgICAgdmFyIHNhbWUgPSB7fTtcblxuXHQgICAgICBmb3IgKHZhciB0eXBlIGluIHBvcykge1xuXHQgICAgICAgIHNhbWVbdHlwZV0gPSB7fTtcblxuXHQgICAgICAgIGZvciAodmFyIGtleSBpbiBwb3NbdHlwZV0pIHtcblx0ICAgICAgICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuXG5cdCAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaGlzdG9yeS5sZW5ndGg7ICsraSkge1xuXHQgICAgICAgICAgICB2YXIgcG9pbnQgPSB0aGlzLmhpc3RvcnlbaV07XG5cdCAgICAgICAgICAgIGlmICh0eXBlb2YgcG9pbnRbdHlwZV0gIT09ICd1bmRlZmluZWQnICYmICF3aXRoaW4ocG9pbnRbdHlwZV1ba2V5XSwgcG9zW3R5cGVdW2tleV0pKSB7XG5cdCAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuXHQgICAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICB9XG5cblx0ICAgICAgICAgIGlmICghZm91bmQpIHtcblx0ICAgICAgICAgICAgc2FtZVt0eXBlXVtrZXldID0gdHJ1ZTtcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICB2YXIgY3NzID0geyB0b3A6ICcnLCBsZWZ0OiAnJywgcmlnaHQ6ICcnLCBib3R0b206ICcnIH07XG5cblx0ICAgICAgdmFyIHRyYW5zY3JpYmUgPSBmdW5jdGlvbiB0cmFuc2NyaWJlKF9zYW1lLCBfcG9zKSB7XG5cdCAgICAgICAgdmFyIGhhc09wdGltaXphdGlvbnMgPSB0eXBlb2YgX3RoaXM2Lm9wdGlvbnMub3B0aW1pemF0aW9ucyAhPT0gJ3VuZGVmaW5lZCc7XG5cdCAgICAgICAgdmFyIGdwdSA9IGhhc09wdGltaXphdGlvbnMgPyBfdGhpczYub3B0aW9ucy5vcHRpbWl6YXRpb25zLmdwdSA6IG51bGw7XG5cdCAgICAgICAgaWYgKGdwdSAhPT0gZmFsc2UpIHtcblx0ICAgICAgICAgIHZhciB5UG9zID0gdW5kZWZpbmVkLFxuXHQgICAgICAgICAgICAgIHhQb3MgPSB1bmRlZmluZWQ7XG5cdCAgICAgICAgICBpZiAoX3NhbWUudG9wKSB7XG5cdCAgICAgICAgICAgIGNzcy50b3AgPSAwO1xuXHQgICAgICAgICAgICB5UG9zID0gX3Bvcy50b3A7XG5cdCAgICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgICBjc3MuYm90dG9tID0gMDtcblx0ICAgICAgICAgICAgeVBvcyA9IC1fcG9zLmJvdHRvbTtcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgaWYgKF9zYW1lLmxlZnQpIHtcblx0ICAgICAgICAgICAgY3NzLmxlZnQgPSAwO1xuXHQgICAgICAgICAgICB4UG9zID0gX3Bvcy5sZWZ0O1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgY3NzLnJpZ2h0ID0gMDtcblx0ICAgICAgICAgICAgeFBvcyA9IC1fcG9zLnJpZ2h0O1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBjc3NbdHJhbnNmb3JtS2V5XSA9ICd0cmFuc2xhdGVYKCcgKyBNYXRoLnJvdW5kKHhQb3MpICsgJ3B4KSB0cmFuc2xhdGVZKCcgKyBNYXRoLnJvdW5kKHlQb3MpICsgJ3B4KSc7XG5cblx0ICAgICAgICAgIGlmICh0cmFuc2Zvcm1LZXkgIT09ICdtc1RyYW5zZm9ybScpIHtcblx0ICAgICAgICAgICAgLy8gVGhlIFogdHJhbnNmb3JtIHdpbGwga2VlcCB0aGlzIGluIHRoZSBHUFUgKGZhc3RlciwgYW5kIHByZXZlbnRzIGFydGlmYWN0cyksXG5cdCAgICAgICAgICAgIC8vIGJ1dCBJRTkgZG9lc24ndCBzdXBwb3J0IDNkIHRyYW5zZm9ybXMgYW5kIHdpbGwgY2hva2UuXG5cdCAgICAgICAgICAgIGNzc1t0cmFuc2Zvcm1LZXldICs9IFwiIHRyYW5zbGF0ZVooMClcIjtcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgaWYgKF9zYW1lLnRvcCkge1xuXHQgICAgICAgICAgICBjc3MudG9wID0gX3Bvcy50b3AgKyAncHgnO1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgY3NzLmJvdHRvbSA9IF9wb3MuYm90dG9tICsgJ3B4Jztcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgaWYgKF9zYW1lLmxlZnQpIHtcblx0ICAgICAgICAgICAgY3NzLmxlZnQgPSBfcG9zLmxlZnQgKyAncHgnO1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgY3NzLnJpZ2h0ID0gX3Bvcy5yaWdodCArICdweCc7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICB9O1xuXG5cdCAgICAgIHZhciBtb3ZlZCA9IGZhbHNlO1xuXHQgICAgICBpZiAoKHNhbWUucGFnZS50b3AgfHwgc2FtZS5wYWdlLmJvdHRvbSkgJiYgKHNhbWUucGFnZS5sZWZ0IHx8IHNhbWUucGFnZS5yaWdodCkpIHtcblx0ICAgICAgICBjc3MucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHQgICAgICAgIHRyYW5zY3JpYmUoc2FtZS5wYWdlLCBwb3MucGFnZSk7XG5cdCAgICAgIH0gZWxzZSBpZiAoKHNhbWUudmlld3BvcnQudG9wIHx8IHNhbWUudmlld3BvcnQuYm90dG9tKSAmJiAoc2FtZS52aWV3cG9ydC5sZWZ0IHx8IHNhbWUudmlld3BvcnQucmlnaHQpKSB7XG5cdCAgICAgICAgY3NzLnBvc2l0aW9uID0gJ2ZpeGVkJztcblx0ICAgICAgICB0cmFuc2NyaWJlKHNhbWUudmlld3BvcnQsIHBvcy52aWV3cG9ydCk7XG5cdCAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHNhbWUub2Zmc2V0ICE9PSAndW5kZWZpbmVkJyAmJiBzYW1lLm9mZnNldC50b3AgJiYgc2FtZS5vZmZzZXQubGVmdCkge1xuXHQgICAgICAgIChmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICBjc3MucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHQgICAgICAgICAgdmFyIG9mZnNldFBhcmVudCA9IF90aGlzNi5jYWNoZSgndGFyZ2V0LW9mZnNldHBhcmVudCcsIGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgcmV0dXJuIGdldE9mZnNldFBhcmVudChfdGhpczYudGFyZ2V0KTtcblx0ICAgICAgICAgIH0pO1xuXG5cdCAgICAgICAgICBpZiAoZ2V0T2Zmc2V0UGFyZW50KF90aGlzNi5lbGVtZW50KSAhPT0gb2Zmc2V0UGFyZW50KSB7XG5cdCAgICAgICAgICAgIGRlZmVyKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICBfdGhpczYuZWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKF90aGlzNi5lbGVtZW50KTtcblx0ICAgICAgICAgICAgICBvZmZzZXRQYXJlbnQuYXBwZW5kQ2hpbGQoX3RoaXM2LmVsZW1lbnQpO1xuXHQgICAgICAgICAgICB9KTtcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgdHJhbnNjcmliZShzYW1lLm9mZnNldCwgcG9zLm9mZnNldCk7XG5cdCAgICAgICAgICBtb3ZlZCA9IHRydWU7XG5cdCAgICAgICAgfSkoKTtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICBjc3MucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuXHQgICAgICAgIHRyYW5zY3JpYmUoeyB0b3A6IHRydWUsIGxlZnQ6IHRydWUgfSwgcG9zLnBhZ2UpO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKCFtb3ZlZCkge1xuXHQgICAgICAgIHZhciBvZmZzZXRQYXJlbnRJc0JvZHkgPSB0cnVlO1xuXHQgICAgICAgIHZhciBjdXJyZW50Tm9kZSA9IHRoaXMuZWxlbWVudC5wYXJlbnROb2RlO1xuXHQgICAgICAgIHdoaWxlIChjdXJyZW50Tm9kZSAmJiBjdXJyZW50Tm9kZS50YWdOYW1lICE9PSAnQk9EWScpIHtcblx0ICAgICAgICAgIGlmIChnZXRDb21wdXRlZFN0eWxlKGN1cnJlbnROb2RlKS5wb3NpdGlvbiAhPT0gJ3N0YXRpYycpIHtcblx0ICAgICAgICAgICAgb2Zmc2V0UGFyZW50SXNCb2R5ID0gZmFsc2U7XG5cdCAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBjdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlLnBhcmVudE5vZGU7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKCFvZmZzZXRQYXJlbnRJc0JvZHkpIHtcblx0ICAgICAgICAgIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuZWxlbWVudCk7XG5cdCAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuZWxlbWVudCk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgLy8gQW55IGNzcyBjaGFuZ2Ugd2lsbCB0cmlnZ2VyIGEgcmVwYWludCwgc28gbGV0J3MgYXZvaWQgb25lIGlmIG5vdGhpbmcgY2hhbmdlZFxuXHQgICAgICB2YXIgd3JpdGVDU1MgPSB7fTtcblx0ICAgICAgdmFyIHdyaXRlID0gZmFsc2U7XG5cdCAgICAgIGZvciAodmFyIGtleSBpbiBjc3MpIHtcblx0ICAgICAgICB2YXIgdmFsID0gY3NzW2tleV07XG5cdCAgICAgICAgdmFyIGVsVmFsID0gdGhpcy5lbGVtZW50LnN0eWxlW2tleV07XG5cblx0ICAgICAgICBpZiAoZWxWYWwgIT09ICcnICYmIHZhbCAhPT0gJycgJiYgWyd0b3AnLCAnbGVmdCcsICdib3R0b20nLCAncmlnaHQnXS5pbmRleE9mKGtleSkgPj0gMCkge1xuXHQgICAgICAgICAgZWxWYWwgPSBwYXJzZUZsb2F0KGVsVmFsKTtcblx0ICAgICAgICAgIHZhbCA9IHBhcnNlRmxvYXQodmFsKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAoZWxWYWwgIT09IHZhbCkge1xuXHQgICAgICAgICAgd3JpdGUgPSB0cnVlO1xuXHQgICAgICAgICAgd3JpdGVDU1Nba2V5XSA9IHZhbDtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAod3JpdGUpIHtcblx0ICAgICAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICBleHRlbmQoX3RoaXM2LmVsZW1lbnQuc3R5bGUsIHdyaXRlQ1NTKTtcblx0ICAgICAgICB9KTtcblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH1dKTtcblxuXHQgIHJldHVybiBUZXRoZXJDbGFzcztcblx0fSkoKTtcblxuXHRUZXRoZXJDbGFzcy5tb2R1bGVzID0gW107XG5cblx0VGV0aGVyQmFzZS5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuXG5cdHZhciBUZXRoZXIgPSBleHRlbmQoVGV0aGVyQ2xhc3MsIFRldGhlckJhc2UpO1xuXHQvKiBnbG9iYWxzIFRldGhlckJhc2UgKi9cblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIF9zbGljZWRUb0FycmF5ID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gc2xpY2VJdGVyYXRvcihhcnIsIGkpIHsgdmFyIF9hcnIgPSBbXTsgdmFyIF9uID0gdHJ1ZTsgdmFyIF9kID0gZmFsc2U7IHZhciBfZSA9IHVuZGVmaW5lZDsgdHJ5IHsgZm9yICh2YXIgX2kgPSBhcnJbU3ltYm9sLml0ZXJhdG9yXSgpLCBfczsgIShfbiA9IChfcyA9IF9pLm5leHQoKSkuZG9uZSk7IF9uID0gdHJ1ZSkgeyBfYXJyLnB1c2goX3MudmFsdWUpOyBpZiAoaSAmJiBfYXJyLmxlbmd0aCA9PT0gaSkgYnJlYWs7IH0gfSBjYXRjaCAoZXJyKSB7IF9kID0gdHJ1ZTsgX2UgPSBlcnI7IH0gZmluYWxseSB7IHRyeSB7IGlmICghX24gJiYgX2lbJ3JldHVybiddKSBfaVsncmV0dXJuJ10oKTsgfSBmaW5hbGx5IHsgaWYgKF9kKSB0aHJvdyBfZTsgfSB9IHJldHVybiBfYXJyOyB9IHJldHVybiBmdW5jdGlvbiAoYXJyLCBpKSB7IGlmIChBcnJheS5pc0FycmF5KGFycikpIHsgcmV0dXJuIGFycjsgfSBlbHNlIGlmIChTeW1ib2wuaXRlcmF0b3IgaW4gT2JqZWN0KGFycikpIHsgcmV0dXJuIHNsaWNlSXRlcmF0b3IoYXJyLCBpKTsgfSBlbHNlIHsgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBhdHRlbXB0IHRvIGRlc3RydWN0dXJlIG5vbi1pdGVyYWJsZSBpbnN0YW5jZScpOyB9IH07IH0pKCk7XG5cblx0dmFyIF9UZXRoZXJCYXNlJFV0aWxzID0gVGV0aGVyQmFzZS5VdGlscztcblx0dmFyIGdldEJvdW5kcyA9IF9UZXRoZXJCYXNlJFV0aWxzLmdldEJvdW5kcztcblx0dmFyIGV4dGVuZCA9IF9UZXRoZXJCYXNlJFV0aWxzLmV4dGVuZDtcblx0dmFyIHVwZGF0ZUNsYXNzZXMgPSBfVGV0aGVyQmFzZSRVdGlscy51cGRhdGVDbGFzc2VzO1xuXHR2YXIgZGVmZXIgPSBfVGV0aGVyQmFzZSRVdGlscy5kZWZlcjtcblxuXHR2YXIgQk9VTkRTX0ZPUk1BVCA9IFsnbGVmdCcsICd0b3AnLCAncmlnaHQnLCAnYm90dG9tJ107XG5cblx0ZnVuY3Rpb24gZ2V0Qm91bmRpbmdSZWN0KHRldGhlciwgdG8pIHtcblx0ICBpZiAodG8gPT09ICdzY3JvbGxQYXJlbnQnKSB7XG5cdCAgICB0byA9IHRldGhlci5zY3JvbGxQYXJlbnQ7XG5cdCAgfSBlbHNlIGlmICh0byA9PT0gJ3dpbmRvdycpIHtcblx0ICAgIHRvID0gW3BhZ2VYT2Zmc2V0LCBwYWdlWU9mZnNldCwgaW5uZXJXaWR0aCArIHBhZ2VYT2Zmc2V0LCBpbm5lckhlaWdodCArIHBhZ2VZT2Zmc2V0XTtcblx0ICB9XG5cblx0ICBpZiAodG8gPT09IGRvY3VtZW50KSB7XG5cdCAgICB0byA9IHRvLmRvY3VtZW50RWxlbWVudDtcblx0ICB9XG5cblx0ICBpZiAodHlwZW9mIHRvLm5vZGVUeXBlICE9PSAndW5kZWZpbmVkJykge1xuXHQgICAgKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgdmFyIHNpemUgPSBnZXRCb3VuZHModG8pO1xuXHQgICAgICB2YXIgcG9zID0gc2l6ZTtcblx0ICAgICAgdmFyIHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZSh0byk7XG5cblx0ICAgICAgdG8gPSBbcG9zLmxlZnQsIHBvcy50b3AsIHNpemUud2lkdGggKyBwb3MubGVmdCwgc2l6ZS5oZWlnaHQgKyBwb3MudG9wXTtcblxuXHQgICAgICBCT1VORFNfRk9STUFULmZvckVhY2goZnVuY3Rpb24gKHNpZGUsIGkpIHtcblx0ICAgICAgICBzaWRlID0gc2lkZVswXS50b1VwcGVyQ2FzZSgpICsgc2lkZS5zdWJzdHIoMSk7XG5cdCAgICAgICAgaWYgKHNpZGUgPT09ICdUb3AnIHx8IHNpZGUgPT09ICdMZWZ0Jykge1xuXHQgICAgICAgICAgdG9baV0gKz0gcGFyc2VGbG9hdChzdHlsZVsnYm9yZGVyJyArIHNpZGUgKyAnV2lkdGgnXSk7XG5cdCAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgIHRvW2ldIC09IHBhcnNlRmxvYXQoc3R5bGVbJ2JvcmRlcicgKyBzaWRlICsgJ1dpZHRoJ10pO1xuXHQgICAgICAgIH1cblx0ICAgICAgfSk7XG5cdCAgICB9KSgpO1xuXHQgIH1cblxuXHQgIHJldHVybiB0bztcblx0fVxuXG5cdFRldGhlckJhc2UubW9kdWxlcy5wdXNoKHtcblx0ICBwb3NpdGlvbjogZnVuY3Rpb24gcG9zaXRpb24oX3JlZikge1xuXHQgICAgdmFyIF90aGlzID0gdGhpcztcblxuXHQgICAgdmFyIHRvcCA9IF9yZWYudG9wO1xuXHQgICAgdmFyIGxlZnQgPSBfcmVmLmxlZnQ7XG5cdCAgICB2YXIgdGFyZ2V0QXR0YWNobWVudCA9IF9yZWYudGFyZ2V0QXR0YWNobWVudDtcblxuXHQgICAgaWYgKCF0aGlzLm9wdGlvbnMuY29uc3RyYWludHMpIHtcblx0ICAgICAgcmV0dXJuIHRydWU7XG5cdCAgICB9XG5cblx0ICAgIHZhciBfY2FjaGUgPSB0aGlzLmNhY2hlKCdlbGVtZW50LWJvdW5kcycsIGZ1bmN0aW9uICgpIHtcblx0ICAgICAgcmV0dXJuIGdldEJvdW5kcyhfdGhpcy5lbGVtZW50KTtcblx0ICAgIH0pO1xuXG5cdCAgICB2YXIgaGVpZ2h0ID0gX2NhY2hlLmhlaWdodDtcblx0ICAgIHZhciB3aWR0aCA9IF9jYWNoZS53aWR0aDtcblxuXHQgICAgaWYgKHdpZHRoID09PSAwICYmIGhlaWdodCA9PT0gMCAmJiB0eXBlb2YgdGhpcy5sYXN0U2l6ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgdmFyIF9sYXN0U2l6ZSA9IHRoaXMubGFzdFNpemU7XG5cblx0ICAgICAgLy8gSGFuZGxlIHRoZSBpdGVtIGdldHRpbmcgaGlkZGVuIGFzIGEgcmVzdWx0IG9mIG91ciBwb3NpdGlvbmluZyB3aXRob3V0IGdsaXRjaGluZ1xuXHQgICAgICAvLyB0aGUgY2xhc3NlcyBpbiBhbmQgb3V0XG5cdCAgICAgIHdpZHRoID0gX2xhc3RTaXplLndpZHRoO1xuXHQgICAgICBoZWlnaHQgPSBfbGFzdFNpemUuaGVpZ2h0O1xuXHQgICAgfVxuXG5cdCAgICB2YXIgdGFyZ2V0U2l6ZSA9IHRoaXMuY2FjaGUoJ3RhcmdldC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG5cdCAgICAgIHJldHVybiBfdGhpcy5nZXRUYXJnZXRCb3VuZHMoKTtcblx0ICAgIH0pO1xuXG5cdCAgICB2YXIgdGFyZ2V0SGVpZ2h0ID0gdGFyZ2V0U2l6ZS5oZWlnaHQ7XG5cdCAgICB2YXIgdGFyZ2V0V2lkdGggPSB0YXJnZXRTaXplLndpZHRoO1xuXG5cdCAgICB2YXIgYWxsQ2xhc3NlcyA9IFt0aGlzLmdldENsYXNzKCdwaW5uZWQnKSwgdGhpcy5nZXRDbGFzcygnb3V0LW9mLWJvdW5kcycpXTtcblxuXHQgICAgdGhpcy5vcHRpb25zLmNvbnN0cmFpbnRzLmZvckVhY2goZnVuY3Rpb24gKGNvbnN0cmFpbnQpIHtcblx0ICAgICAgdmFyIG91dE9mQm91bmRzQ2xhc3MgPSBjb25zdHJhaW50Lm91dE9mQm91bmRzQ2xhc3M7XG5cdCAgICAgIHZhciBwaW5uZWRDbGFzcyA9IGNvbnN0cmFpbnQucGlubmVkQ2xhc3M7XG5cblx0ICAgICAgaWYgKG91dE9mQm91bmRzQ2xhc3MpIHtcblx0ICAgICAgICBhbGxDbGFzc2VzLnB1c2gob3V0T2ZCb3VuZHNDbGFzcyk7XG5cdCAgICAgIH1cblx0ICAgICAgaWYgKHBpbm5lZENsYXNzKSB7XG5cdCAgICAgICAgYWxsQ2xhc3Nlcy5wdXNoKHBpbm5lZENsYXNzKTtcblx0ICAgICAgfVxuXHQgICAgfSk7XG5cblx0ICAgIGFsbENsYXNzZXMuZm9yRWFjaChmdW5jdGlvbiAoY2xzKSB7XG5cdCAgICAgIFsnbGVmdCcsICd0b3AnLCAncmlnaHQnLCAnYm90dG9tJ10uZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuXHQgICAgICAgIGFsbENsYXNzZXMucHVzaChjbHMgKyAnLScgKyBzaWRlKTtcblx0ICAgICAgfSk7XG5cdCAgICB9KTtcblxuXHQgICAgdmFyIGFkZENsYXNzZXMgPSBbXTtcblxuXHQgICAgdmFyIHRBdHRhY2htZW50ID0gZXh0ZW5kKHt9LCB0YXJnZXRBdHRhY2htZW50KTtcblx0ICAgIHZhciBlQXR0YWNobWVudCA9IGV4dGVuZCh7fSwgdGhpcy5hdHRhY2htZW50KTtcblxuXHQgICAgdGhpcy5vcHRpb25zLmNvbnN0cmFpbnRzLmZvckVhY2goZnVuY3Rpb24gKGNvbnN0cmFpbnQpIHtcblx0ICAgICAgdmFyIHRvID0gY29uc3RyYWludC50bztcblx0ICAgICAgdmFyIGF0dGFjaG1lbnQgPSBjb25zdHJhaW50LmF0dGFjaG1lbnQ7XG5cdCAgICAgIHZhciBwaW4gPSBjb25zdHJhaW50LnBpbjtcblxuXHQgICAgICBpZiAodHlwZW9mIGF0dGFjaG1lbnQgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgYXR0YWNobWVudCA9ICcnO1xuXHQgICAgICB9XG5cblx0ICAgICAgdmFyIGNoYW5nZUF0dGFjaFggPSB1bmRlZmluZWQsXG5cdCAgICAgICAgICBjaGFuZ2VBdHRhY2hZID0gdW5kZWZpbmVkO1xuXHQgICAgICBpZiAoYXR0YWNobWVudC5pbmRleE9mKCcgJykgPj0gMCkge1xuXHQgICAgICAgIHZhciBfYXR0YWNobWVudCRzcGxpdCA9IGF0dGFjaG1lbnQuc3BsaXQoJyAnKTtcblxuXHQgICAgICAgIHZhciBfYXR0YWNobWVudCRzcGxpdDIgPSBfc2xpY2VkVG9BcnJheShfYXR0YWNobWVudCRzcGxpdCwgMik7XG5cblx0ICAgICAgICBjaGFuZ2VBdHRhY2hZID0gX2F0dGFjaG1lbnQkc3BsaXQyWzBdO1xuXHQgICAgICAgIGNoYW5nZUF0dGFjaFggPSBfYXR0YWNobWVudCRzcGxpdDJbMV07XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgY2hhbmdlQXR0YWNoWCA9IGNoYW5nZUF0dGFjaFkgPSBhdHRhY2htZW50O1xuXHQgICAgICB9XG5cblx0ICAgICAgdmFyIGJvdW5kcyA9IGdldEJvdW5kaW5nUmVjdChfdGhpcywgdG8pO1xuXG5cdCAgICAgIGlmIChjaGFuZ2VBdHRhY2hZID09PSAndGFyZ2V0JyB8fCBjaGFuZ2VBdHRhY2hZID09PSAnYm90aCcpIHtcblx0ICAgICAgICBpZiAodG9wIDwgYm91bmRzWzFdICYmIHRBdHRhY2htZW50LnRvcCA9PT0gJ3RvcCcpIHtcblx0ICAgICAgICAgIHRvcCArPSB0YXJnZXRIZWlnaHQ7XG5cdCAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAodG9wICsgaGVpZ2h0ID4gYm91bmRzWzNdICYmIHRBdHRhY2htZW50LnRvcCA9PT0gJ2JvdHRvbScpIHtcblx0ICAgICAgICAgIHRvcCAtPSB0YXJnZXRIZWlnaHQ7XG5cdCAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAndG9wJztcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAoY2hhbmdlQXR0YWNoWSA9PT0gJ3RvZ2V0aGVyJykge1xuXHQgICAgICAgIGlmICh0b3AgPCBib3VuZHNbMV0gJiYgdEF0dGFjaG1lbnQudG9wID09PSAndG9wJykge1xuXHQgICAgICAgICAgaWYgKGVBdHRhY2htZW50LnRvcCA9PT0gJ2JvdHRvbScpIHtcblx0ICAgICAgICAgICAgdG9wICs9IHRhcmdldEhlaWdodDtcblx0ICAgICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG5cblx0ICAgICAgICAgICAgdG9wICs9IGhlaWdodDtcblx0ICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG5cdCAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LnRvcCA9PT0gJ3RvcCcpIHtcblx0ICAgICAgICAgICAgdG9wICs9IHRhcmdldEhlaWdodDtcblx0ICAgICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG5cblx0ICAgICAgICAgICAgdG9wIC09IGhlaWdodDtcblx0ICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSAmJiB0QXR0YWNobWVudC50b3AgPT09ICdib3R0b20nKSB7XG5cdCAgICAgICAgICBpZiAoZUF0dGFjaG1lbnQudG9wID09PSAndG9wJykge1xuXHQgICAgICAgICAgICB0b3AgLT0gdGFyZ2V0SGVpZ2h0O1xuXHQgICAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAndG9wJztcblxuXHQgICAgICAgICAgICB0b3AgLT0gaGVpZ2h0O1xuXHQgICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcblx0ICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQudG9wID09PSAnYm90dG9tJykge1xuXHQgICAgICAgICAgICB0b3AgLT0gdGFyZ2V0SGVpZ2h0O1xuXHQgICAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAndG9wJztcblxuXHQgICAgICAgICAgICB0b3AgKz0gaGVpZ2h0O1xuXHQgICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAndG9wJztcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cblx0ICAgICAgICBpZiAodEF0dGFjaG1lbnQudG9wID09PSAnbWlkZGxlJykge1xuXHQgICAgICAgICAgaWYgKHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSAmJiBlQXR0YWNobWVudC50b3AgPT09ICd0b3AnKSB7XG5cdCAgICAgICAgICAgIHRvcCAtPSBoZWlnaHQ7XG5cdCAgICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuXHQgICAgICAgICAgfSBlbHNlIGlmICh0b3AgPCBib3VuZHNbMV0gJiYgZUF0dGFjaG1lbnQudG9wID09PSAnYm90dG9tJykge1xuXHQgICAgICAgICAgICB0b3AgKz0gaGVpZ2h0O1xuXHQgICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAndG9wJztcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAoY2hhbmdlQXR0YWNoWCA9PT0gJ3RhcmdldCcgfHwgY2hhbmdlQXR0YWNoWCA9PT0gJ2JvdGgnKSB7XG5cdCAgICAgICAgaWYgKGxlZnQgPCBib3VuZHNbMF0gJiYgdEF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG5cdCAgICAgICAgICBsZWZ0ICs9IHRhcmdldFdpZHRoO1xuXHQgICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKGxlZnQgKyB3aWR0aCA+IGJvdW5kc1syXSAmJiB0QXR0YWNobWVudC5sZWZ0ID09PSAncmlnaHQnKSB7XG5cdCAgICAgICAgICBsZWZ0IC09IHRhcmdldFdpZHRoO1xuXHQgICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0Jztcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAoY2hhbmdlQXR0YWNoWCA9PT0gJ3RvZ2V0aGVyJykge1xuXHQgICAgICAgIGlmIChsZWZ0IDwgYm91bmRzWzBdICYmIHRBdHRhY2htZW50LmxlZnQgPT09ICdsZWZ0Jykge1xuXHQgICAgICAgICAgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcblx0ICAgICAgICAgICAgbGVmdCArPSB0YXJnZXRXaWR0aDtcblx0ICAgICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG5cblx0ICAgICAgICAgICAgbGVmdCArPSB3aWR0aDtcblx0ICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0Jztcblx0ICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG5cdCAgICAgICAgICAgIGxlZnQgKz0gdGFyZ2V0V2lkdGg7XG5cdCAgICAgICAgICAgIHRBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuXG5cdCAgICAgICAgICAgIGxlZnQgLT0gd2lkdGg7XG5cdCAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH0gZWxzZSBpZiAobGVmdCArIHdpZHRoID4gYm91bmRzWzJdICYmIHRBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcblx0ICAgICAgICAgIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAnbGVmdCcpIHtcblx0ICAgICAgICAgICAgbGVmdCAtPSB0YXJnZXRXaWR0aDtcblx0ICAgICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcblxuXHQgICAgICAgICAgICBsZWZ0IC09IHdpZHRoO1xuXHQgICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0Jztcblx0ICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ3JpZ2h0Jykge1xuXHQgICAgICAgICAgICBsZWZ0IC09IHRhcmdldFdpZHRoO1xuXHQgICAgICAgICAgICB0QXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuXG5cdCAgICAgICAgICAgIGxlZnQgKz0gd2lkdGg7XG5cdCAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfSBlbHNlIGlmICh0QXR0YWNobWVudC5sZWZ0ID09PSAnY2VudGVyJykge1xuXHQgICAgICAgICAgaWYgKGxlZnQgKyB3aWR0aCA+IGJvdW5kc1syXSAmJiBlQXR0YWNobWVudC5sZWZ0ID09PSAnbGVmdCcpIHtcblx0ICAgICAgICAgICAgbGVmdCAtPSB3aWR0aDtcblx0ICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG5cdCAgICAgICAgICB9IGVsc2UgaWYgKGxlZnQgPCBib3VuZHNbMF0gJiYgZUF0dGFjaG1lbnQubGVmdCA9PT0gJ3JpZ2h0Jykge1xuXHQgICAgICAgICAgICBsZWZ0ICs9IHdpZHRoO1xuXHQgICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXG5cdCAgICAgIGlmIChjaGFuZ2VBdHRhY2hZID09PSAnZWxlbWVudCcgfHwgY2hhbmdlQXR0YWNoWSA9PT0gJ2JvdGgnKSB7XG5cdCAgICAgICAgaWYgKHRvcCA8IGJvdW5kc1sxXSAmJiBlQXR0YWNobWVudC50b3AgPT09ICdib3R0b20nKSB7XG5cdCAgICAgICAgICB0b3AgKz0gaGVpZ2h0O1xuXHQgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSAmJiBlQXR0YWNobWVudC50b3AgPT09ICd0b3AnKSB7XG5cdCAgICAgICAgICB0b3AgLT0gaGVpZ2h0O1xuXHQgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKGNoYW5nZUF0dGFjaFggPT09ICdlbGVtZW50JyB8fCBjaGFuZ2VBdHRhY2hYID09PSAnYm90aCcpIHtcblx0ICAgICAgICBpZiAobGVmdCA8IGJvdW5kc1swXSkge1xuXHQgICAgICAgICAgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcblx0ICAgICAgICAgICAgbGVmdCArPSB3aWR0aDtcblx0ICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0Jztcblx0ICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2NlbnRlcicpIHtcblx0ICAgICAgICAgICAgbGVmdCArPSB3aWR0aCAvIDI7XG5cdCAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKGxlZnQgKyB3aWR0aCA+IGJvdW5kc1syXSkge1xuXHQgICAgICAgICAgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdsZWZ0Jykge1xuXHQgICAgICAgICAgICBsZWZ0IC09IHdpZHRoO1xuXHQgICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0Jztcblx0ICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2NlbnRlcicpIHtcblx0ICAgICAgICAgICAgbGVmdCAtPSB3aWR0aCAvIDI7XG5cdCAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICh0eXBlb2YgcGluID09PSAnc3RyaW5nJykge1xuXHQgICAgICAgIHBpbiA9IHBpbi5zcGxpdCgnLCcpLm1hcChmdW5jdGlvbiAocCkge1xuXHQgICAgICAgICAgcmV0dXJuIHAudHJpbSgpO1xuXHQgICAgICAgIH0pO1xuXHQgICAgICB9IGVsc2UgaWYgKHBpbiA9PT0gdHJ1ZSkge1xuXHQgICAgICAgIHBpbiA9IFsndG9wJywgJ2xlZnQnLCAncmlnaHQnLCAnYm90dG9tJ107XG5cdCAgICAgIH1cblxuXHQgICAgICBwaW4gPSBwaW4gfHwgW107XG5cblx0ICAgICAgdmFyIHBpbm5lZCA9IFtdO1xuXHQgICAgICB2YXIgb29iID0gW107XG5cblx0ICAgICAgaWYgKHRvcCA8IGJvdW5kc1sxXSkge1xuXHQgICAgICAgIGlmIChwaW4uaW5kZXhPZigndG9wJykgPj0gMCkge1xuXHQgICAgICAgICAgdG9wID0gYm91bmRzWzFdO1xuXHQgICAgICAgICAgcGlubmVkLnB1c2goJ3RvcCcpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICBvb2IucHVzaCgndG9wJyk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKHRvcCArIGhlaWdodCA+IGJvdW5kc1szXSkge1xuXHQgICAgICAgIGlmIChwaW4uaW5kZXhPZignYm90dG9tJykgPj0gMCkge1xuXHQgICAgICAgICAgdG9wID0gYm91bmRzWzNdIC0gaGVpZ2h0O1xuXHQgICAgICAgICAgcGlubmVkLnB1c2goJ2JvdHRvbScpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICBvb2IucHVzaCgnYm90dG9tJyk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKGxlZnQgPCBib3VuZHNbMF0pIHtcblx0ICAgICAgICBpZiAocGluLmluZGV4T2YoJ2xlZnQnKSA+PSAwKSB7XG5cdCAgICAgICAgICBsZWZ0ID0gYm91bmRzWzBdO1xuXHQgICAgICAgICAgcGlubmVkLnB1c2goJ2xlZnQnKTtcblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgb29iLnB1c2goJ2xlZnQnKTtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAobGVmdCArIHdpZHRoID4gYm91bmRzWzJdKSB7XG5cdCAgICAgICAgaWYgKHBpbi5pbmRleE9mKCdyaWdodCcpID49IDApIHtcblx0ICAgICAgICAgIGxlZnQgPSBib3VuZHNbMl0gLSB3aWR0aDtcblx0ICAgICAgICAgIHBpbm5lZC5wdXNoKCdyaWdodCcpO1xuXHQgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICBvb2IucHVzaCgncmlnaHQnKTtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAocGlubmVkLmxlbmd0aCkge1xuXHQgICAgICAgIChmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICB2YXIgcGlubmVkQ2xhc3MgPSB1bmRlZmluZWQ7XG5cdCAgICAgICAgICBpZiAodHlwZW9mIF90aGlzLm9wdGlvbnMucGlubmVkQ2xhc3MgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgICAgIHBpbm5lZENsYXNzID0gX3RoaXMub3B0aW9ucy5waW5uZWRDbGFzcztcblx0ICAgICAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgICAgIHBpbm5lZENsYXNzID0gX3RoaXMuZ2V0Q2xhc3MoJ3Bpbm5lZCcpO1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBhZGRDbGFzc2VzLnB1c2gocGlubmVkQ2xhc3MpO1xuXHQgICAgICAgICAgcGlubmVkLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcblx0ICAgICAgICAgICAgYWRkQ2xhc3Nlcy5wdXNoKHBpbm5lZENsYXNzICsgJy0nICsgc2lkZSk7XG5cdCAgICAgICAgICB9KTtcblx0ICAgICAgICB9KSgpO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKG9vYi5sZW5ndGgpIHtcblx0ICAgICAgICAoZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgdmFyIG9vYkNsYXNzID0gdW5kZWZpbmVkO1xuXHQgICAgICAgICAgaWYgKHR5cGVvZiBfdGhpcy5vcHRpb25zLm91dE9mQm91bmRzQ2xhc3MgIT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgICAgIG9vYkNsYXNzID0gX3RoaXMub3B0aW9ucy5vdXRPZkJvdW5kc0NsYXNzO1xuXHQgICAgICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAgICAgb29iQ2xhc3MgPSBfdGhpcy5nZXRDbGFzcygnb3V0LW9mLWJvdW5kcycpO1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBhZGRDbGFzc2VzLnB1c2gob29iQ2xhc3MpO1xuXHQgICAgICAgICAgb29iLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcblx0ICAgICAgICAgICAgYWRkQ2xhc3Nlcy5wdXNoKG9vYkNsYXNzICsgJy0nICsgc2lkZSk7XG5cdCAgICAgICAgICB9KTtcblx0ICAgICAgICB9KSgpO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKHBpbm5lZC5pbmRleE9mKCdsZWZ0JykgPj0gMCB8fCBwaW5uZWQuaW5kZXhPZigncmlnaHQnKSA+PSAwKSB7XG5cdCAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9IHRBdHRhY2htZW50LmxlZnQgPSBmYWxzZTtcblx0ICAgICAgfVxuXHQgICAgICBpZiAocGlubmVkLmluZGV4T2YoJ3RvcCcpID49IDAgfHwgcGlubmVkLmluZGV4T2YoJ2JvdHRvbScpID49IDApIHtcblx0ICAgICAgICBlQXR0YWNobWVudC50b3AgPSB0QXR0YWNobWVudC50b3AgPSBmYWxzZTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICh0QXR0YWNobWVudC50b3AgIT09IHRhcmdldEF0dGFjaG1lbnQudG9wIHx8IHRBdHRhY2htZW50LmxlZnQgIT09IHRhcmdldEF0dGFjaG1lbnQubGVmdCB8fCBlQXR0YWNobWVudC50b3AgIT09IF90aGlzLmF0dGFjaG1lbnQudG9wIHx8IGVBdHRhY2htZW50LmxlZnQgIT09IF90aGlzLmF0dGFjaG1lbnQubGVmdCkge1xuXHQgICAgICAgIF90aGlzLnVwZGF0ZUF0dGFjaENsYXNzZXMoZUF0dGFjaG1lbnQsIHRBdHRhY2htZW50KTtcblx0ICAgICAgfVxuXHQgICAgfSk7XG5cblx0ICAgIGRlZmVyKGZ1bmN0aW9uICgpIHtcblx0ICAgICAgaWYgKCEoX3RoaXMub3B0aW9ucy5hZGRUYXJnZXRDbGFzc2VzID09PSBmYWxzZSkpIHtcblx0ICAgICAgICB1cGRhdGVDbGFzc2VzKF90aGlzLnRhcmdldCwgYWRkQ2xhc3NlcywgYWxsQ2xhc3Nlcyk7XG5cdCAgICAgIH1cblx0ICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpcy5lbGVtZW50LCBhZGRDbGFzc2VzLCBhbGxDbGFzc2VzKTtcblx0ICAgIH0pO1xuXG5cdCAgICByZXR1cm4geyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9O1xuXHQgIH1cblx0fSk7XG5cdC8qIGdsb2JhbHMgVGV0aGVyQmFzZSAqL1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgX1RldGhlckJhc2UkVXRpbHMgPSBUZXRoZXJCYXNlLlV0aWxzO1xuXHR2YXIgZ2V0Qm91bmRzID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0Qm91bmRzO1xuXHR2YXIgdXBkYXRlQ2xhc3NlcyA9IF9UZXRoZXJCYXNlJFV0aWxzLnVwZGF0ZUNsYXNzZXM7XG5cdHZhciBkZWZlciA9IF9UZXRoZXJCYXNlJFV0aWxzLmRlZmVyO1xuXG5cdFRldGhlckJhc2UubW9kdWxlcy5wdXNoKHtcblx0ICBwb3NpdGlvbjogZnVuY3Rpb24gcG9zaXRpb24oX3JlZikge1xuXHQgICAgdmFyIF90aGlzID0gdGhpcztcblxuXHQgICAgdmFyIHRvcCA9IF9yZWYudG9wO1xuXHQgICAgdmFyIGxlZnQgPSBfcmVmLmxlZnQ7XG5cblx0ICAgIHZhciBfY2FjaGUgPSB0aGlzLmNhY2hlKCdlbGVtZW50LWJvdW5kcycsIGZ1bmN0aW9uICgpIHtcblx0ICAgICAgcmV0dXJuIGdldEJvdW5kcyhfdGhpcy5lbGVtZW50KTtcblx0ICAgIH0pO1xuXG5cdCAgICB2YXIgaGVpZ2h0ID0gX2NhY2hlLmhlaWdodDtcblx0ICAgIHZhciB3aWR0aCA9IF9jYWNoZS53aWR0aDtcblxuXHQgICAgdmFyIHRhcmdldFBvcyA9IHRoaXMuZ2V0VGFyZ2V0Qm91bmRzKCk7XG5cblx0ICAgIHZhciBib3R0b20gPSB0b3AgKyBoZWlnaHQ7XG5cdCAgICB2YXIgcmlnaHQgPSBsZWZ0ICsgd2lkdGg7XG5cblx0ICAgIHZhciBhYnV0dGVkID0gW107XG5cdCAgICBpZiAodG9wIDw9IHRhcmdldFBvcy5ib3R0b20gJiYgYm90dG9tID49IHRhcmdldFBvcy50b3ApIHtcblx0ICAgICAgWydsZWZ0JywgJ3JpZ2h0J10uZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuXHQgICAgICAgIHZhciB0YXJnZXRQb3NTaWRlID0gdGFyZ2V0UG9zW3NpZGVdO1xuXHQgICAgICAgIGlmICh0YXJnZXRQb3NTaWRlID09PSBsZWZ0IHx8IHRhcmdldFBvc1NpZGUgPT09IHJpZ2h0KSB7XG5cdCAgICAgICAgICBhYnV0dGVkLnB1c2goc2lkZSk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9KTtcblx0ICAgIH1cblxuXHQgICAgaWYgKGxlZnQgPD0gdGFyZ2V0UG9zLnJpZ2h0ICYmIHJpZ2h0ID49IHRhcmdldFBvcy5sZWZ0KSB7XG5cdCAgICAgIFsndG9wJywgJ2JvdHRvbSddLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcblx0ICAgICAgICB2YXIgdGFyZ2V0UG9zU2lkZSA9IHRhcmdldFBvc1tzaWRlXTtcblx0ICAgICAgICBpZiAodGFyZ2V0UG9zU2lkZSA9PT0gdG9wIHx8IHRhcmdldFBvc1NpZGUgPT09IGJvdHRvbSkge1xuXHQgICAgICAgICAgYWJ1dHRlZC5wdXNoKHNpZGUpO1xuXHQgICAgICAgIH1cblx0ICAgICAgfSk7XG5cdCAgICB9XG5cblx0ICAgIHZhciBhbGxDbGFzc2VzID0gW107XG5cdCAgICB2YXIgYWRkQ2xhc3NlcyA9IFtdO1xuXG5cdCAgICB2YXIgc2lkZXMgPSBbJ2xlZnQnLCAndG9wJywgJ3JpZ2h0JywgJ2JvdHRvbSddO1xuXHQgICAgYWxsQ2xhc3Nlcy5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ2FidXR0ZWQnKSk7XG5cdCAgICBzaWRlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG5cdCAgICAgIGFsbENsYXNzZXMucHVzaChfdGhpcy5nZXRDbGFzcygnYWJ1dHRlZCcpICsgJy0nICsgc2lkZSk7XG5cdCAgICB9KTtcblxuXHQgICAgaWYgKGFidXR0ZWQubGVuZ3RoKSB7XG5cdCAgICAgIGFkZENsYXNzZXMucHVzaCh0aGlzLmdldENsYXNzKCdhYnV0dGVkJykpO1xuXHQgICAgfVxuXG5cdCAgICBhYnV0dGVkLmZvckVhY2goZnVuY3Rpb24gKHNpZGUpIHtcblx0ICAgICAgYWRkQ2xhc3Nlcy5wdXNoKF90aGlzLmdldENsYXNzKCdhYnV0dGVkJykgKyAnLScgKyBzaWRlKTtcblx0ICAgIH0pO1xuXG5cdCAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG5cdCAgICAgIGlmICghKF90aGlzLm9wdGlvbnMuYWRkVGFyZ2V0Q2xhc3NlcyA9PT0gZmFsc2UpKSB7XG5cdCAgICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpcy50YXJnZXQsIGFkZENsYXNzZXMsIGFsbENsYXNzZXMpO1xuXHQgICAgICB9XG5cdCAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXMuZWxlbWVudCwgYWRkQ2xhc3NlcywgYWxsQ2xhc3Nlcyk7XG5cdCAgICB9KTtcblxuXHQgICAgcmV0dXJuIHRydWU7XG5cdCAgfVxuXHR9KTtcblx0LyogZ2xvYmFscyBUZXRoZXJCYXNlICovXG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBfc2xpY2VkVG9BcnJheSA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIHNsaWNlSXRlcmF0b3IoYXJyLCBpKSB7IHZhciBfYXJyID0gW107IHZhciBfbiA9IHRydWU7IHZhciBfZCA9IGZhbHNlOyB2YXIgX2UgPSB1bmRlZmluZWQ7IHRyeSB7IGZvciAodmFyIF9pID0gYXJyW1N5bWJvbC5pdGVyYXRvcl0oKSwgX3M7ICEoX24gPSAoX3MgPSBfaS5uZXh0KCkpLmRvbmUpOyBfbiA9IHRydWUpIHsgX2Fyci5wdXNoKF9zLnZhbHVlKTsgaWYgKGkgJiYgX2Fyci5sZW5ndGggPT09IGkpIGJyZWFrOyB9IH0gY2F0Y2ggKGVycikgeyBfZCA9IHRydWU7IF9lID0gZXJyOyB9IGZpbmFsbHkgeyB0cnkgeyBpZiAoIV9uICYmIF9pWydyZXR1cm4nXSkgX2lbJ3JldHVybiddKCk7IH0gZmluYWxseSB7IGlmIChfZCkgdGhyb3cgX2U7IH0gfSByZXR1cm4gX2FycjsgfSByZXR1cm4gZnVuY3Rpb24gKGFyciwgaSkgeyBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7IHJldHVybiBhcnI7IH0gZWxzZSBpZiAoU3ltYm9sLml0ZXJhdG9yIGluIE9iamVjdChhcnIpKSB7IHJldHVybiBzbGljZUl0ZXJhdG9yKGFyciwgaSk7IH0gZWxzZSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgYXR0ZW1wdCB0byBkZXN0cnVjdHVyZSBub24taXRlcmFibGUgaW5zdGFuY2UnKTsgfSB9OyB9KSgpO1xuXG5cdFRldGhlckJhc2UubW9kdWxlcy5wdXNoKHtcblx0ICBwb3NpdGlvbjogZnVuY3Rpb24gcG9zaXRpb24oX3JlZikge1xuXHQgICAgdmFyIHRvcCA9IF9yZWYudG9wO1xuXHQgICAgdmFyIGxlZnQgPSBfcmVmLmxlZnQ7XG5cblx0ICAgIGlmICghdGhpcy5vcHRpb25zLnNoaWZ0KSB7XG5cdCAgICAgIHJldHVybjtcblx0ICAgIH1cblxuXHQgICAgdmFyIHNoaWZ0ID0gdGhpcy5vcHRpb25zLnNoaWZ0O1xuXHQgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMuc2hpZnQgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgc2hpZnQgPSB0aGlzLm9wdGlvbnMuc2hpZnQuY2FsbCh0aGlzLCB7IHRvcDogdG9wLCBsZWZ0OiBsZWZ0IH0pO1xuXHQgICAgfVxuXG5cdCAgICB2YXIgc2hpZnRUb3AgPSB1bmRlZmluZWQsXG5cdCAgICAgICAgc2hpZnRMZWZ0ID0gdW5kZWZpbmVkO1xuXHQgICAgaWYgKHR5cGVvZiBzaGlmdCA9PT0gJ3N0cmluZycpIHtcblx0ICAgICAgc2hpZnQgPSBzaGlmdC5zcGxpdCgnICcpO1xuXHQgICAgICBzaGlmdFsxXSA9IHNoaWZ0WzFdIHx8IHNoaWZ0WzBdO1xuXG5cdCAgICAgIHZhciBfc2hpZnQgPSBzaGlmdDtcblxuXHQgICAgICB2YXIgX3NoaWZ0MiA9IF9zbGljZWRUb0FycmF5KF9zaGlmdCwgMik7XG5cblx0ICAgICAgc2hpZnRUb3AgPSBfc2hpZnQyWzBdO1xuXHQgICAgICBzaGlmdExlZnQgPSBfc2hpZnQyWzFdO1xuXG5cdCAgICAgIHNoaWZ0VG9wID0gcGFyc2VGbG9hdChzaGlmdFRvcCwgMTApO1xuXHQgICAgICBzaGlmdExlZnQgPSBwYXJzZUZsb2F0KHNoaWZ0TGVmdCwgMTApO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgc2hpZnRUb3AgPSBzaGlmdC50b3A7XG5cdCAgICAgIHNoaWZ0TGVmdCA9IHNoaWZ0LmxlZnQ7XG5cdCAgICB9XG5cblx0ICAgIHRvcCArPSBzaGlmdFRvcDtcblx0ICAgIGxlZnQgKz0gc2hpZnRMZWZ0O1xuXG5cdCAgICByZXR1cm4geyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9O1xuXHQgIH1cblx0fSk7XG5cdHJldHVybiBUZXRoZXI7XG5cblx0fSkpO1xuXG5cbi8qKiovIH1cbi8qKioqKiovIF0pXG59KTtcbjsiXSwiZmlsZSI6InN0eWxlZ3VpZGUuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
