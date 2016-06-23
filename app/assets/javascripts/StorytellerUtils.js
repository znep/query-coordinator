import $ from 'jQuery';
import _ from 'lodash';
import SocrataUtils from 'socrata-utils';

import Constants from './editor/Constants';
import Environment from './StorytellerEnvironment';
import VifUtils from './VifUtils';

function exportImpl(thing, as) {
  _.set(window, as, thing);
  return thing;
}

var utils = _.merge({}, SocrataUtils, VifUtils, {
  export: exportImpl,
  format: function(string) {
    if (_.isString(string)) {
      return String.prototype.format.apply(string, _.tail(arguments));
    } else {
      return '';
    }
  },

  /**
   * @function typeToClassNameForComponentType
   * @description
   * Transforms something.something to something-something
   * @param {String} type - A dot-delimited Storyteller component type.
   * @returns {String} - a hyphenated, lowercase Storyteller type.
   */
  typeToClassNameForComponentType: function(type) {
    this.assertIsOneOfTypes(type, 'string');

    return 'component-' + type.replace(/\./g, '-').replace(/[A-Z]/g, '-$&').toLowerCase();
  },

  /**
   * @function queryParameters
   * @description
   * Build URL query parameters into a consumable data structure.
   * @returns {Array} - A list of key-value pairs: [['key', 'value'], ...]
   */
  queryParameters: function() {
    var search = window.location.search &&
      window.location.search.length !== 0 &&
      window.location.search.substring(1);

    if (search) {
      var parameters = search.split('&');

      return parameters.map(function(parameter) {
        return parameter.split('=');
      });
    } else {
      return [];
    }
  },

  mapDOMFragmentDescending: function(element, applyFn, shouldTerminateFn) {

    var clonedElement = applyFn(element.cloneNode());

    if (!shouldTerminateFn(element)) {

      var childCount = element.childNodes.length;

      for (var i = 0; i < childCount; i++) {

        clonedElement.appendChild(
          this.mapDOMFragmentDescending(
            element.childNodes[i],
            applyFn,
            shouldTerminateFn
          )
        );
      }
    }

    return clonedElement;
  },

  /**
   * Binds a set of events, whether delegated or direct, on a single node.
   * Events are specified as a mapping of event types to handlers, e.g.
   *
   * {
   *   'keyup': [
   *     ['.custom-url-input', validateForm]
   *   ],
   *   'modal-dismissed': [
   *     [handleModalDismissed]
   *   ]
   * }
   *
   * Handlers are specified as an array of arrays (which allows an event to be
   * handled in multiple ways); the inner array consists of an optional selector
   * (for delegated events) and the handling function.
   *
   * In conjunction with an unbinding counterpart (below), consolidating handlers
   * into a data structure provides us with a more explicit guarantee of behavior.
   */
  bindEvents: function(node, eventHandlers) {
    var $node = $(node);
    _.each(eventHandlers, function(handlers, eventName) {
      _.each(handlers, function(handlerArray) {
        var handler = handlerArray.pop();
        var delegate = handlerArray.pop();
        $node.on(eventName, delegate, handler);
      });
    });
  },

  /**
   * Unbinds a set of events, whether delegated or direct, on a single ancestor node.
   * See previous method for more details.
   */
  unbindEvents: function(node, eventHandlers) {
    var $node = $(node);
    _.each(eventHandlers, function(handlers, eventName) {
      _.each(handlers, function(handlerArray) {
        var handler = handlerArray.pop();
        var delegate = handlerArray.pop();
        $node.off(eventName, delegate, handler);
      });
    });
  },

  /**
   * Prevents scrolling from bubbling up to the document
   * Ex: element.on('mousewheel', '.scrollable', Util.preventScrolling)
   */
  preventScrolling: function(e) {
    var target = $(this);
    var scrollTop = target.scrollTop();

    var delta = e.originalEvent.deltaY;
    if (delta < 0) {
      // Scrolling up.
      if (scrollTop === 0) {
        // Past top.
        e.preventDefault();
      }
    } else if (delta > 0) {
      // Scrolling down.
      var innerHeight = target.innerHeight();
      var scrollHeight = target[0].scrollHeight;

      if (scrollTop >= scrollHeight - innerHeight) {
        // Past bottom.
        e.preventDefault();
      }
    }
  },

  reduceDOMFragmentAscending: function(element, applyFn, shouldTerminateFn, accumulator) {

    if (!shouldTerminateFn(element)) {

      if (element.parentNode !== null) {

        this.reduceDOMFragmentAscending(
          element.parentNode,
          applyFn,
          shouldTerminateFn,
          accumulator
        );
      }
    }

    applyFn(element, accumulator);

    return accumulator;
  },

  reduceDOMFragmentDescending: function(element, applyFn, shouldTerminateFn, accumulator) {

    applyFn(element, accumulator);

    if (!shouldTerminateFn(element)) {

      var childCount = element.childNodes.length;

      for (var i = 0; i < childCount; i++) {
        this.reduceDOMFragmentDescending(
          element.childNodes[i],
          applyFn,
          shouldTerminateFn,
          accumulator
        );
      }
    }

    return accumulator;
  },

  generateStoryTileIframeSrc: function(storyDomain, storyUid) {

    this.assertIsOneOfTypes(storyDomain, 'string');
    this.assertIsOneOfTypes(storyUid, 'string');
    this.assertEqual(storyDomain.match(/[^a-z0-9\.\-]/gi), null);
    this.assert(
      storyUid.match(/^\w{4}\-\w{4}$/) !== null,
      '`storyUid` does not match anchored four-by-four pattern'
    );

    return 'https://' + storyDomain + '/stories/s/' + storyUid + '/tile';
  },

  generateStoryTileJsonSrc: function(storyDomain, storyUid) {

    this.assertIsOneOfTypes(storyDomain, 'string');
    this.assertIsOneOfTypes(storyUid, 'string');
    this.assertEqual(storyDomain.match(/[^a-z0-9\.\-]/gi), null);
    this.assert(
      storyUid.match(/^\w{4}\-\w{4}$/) !== null,
      '`storyUid` does not match anchored four-by-four pattern'
    );

    return 'https://' + storyDomain + '/stories/s/' + storyUid + '/tile.json';
  },

  generateGoalTileJsonSrc: function(goalDomain, goalUid) {

    this.assertIsOneOfTypes(goalDomain, 'string');
    this.assertIsOneOfTypes(goalUid, 'string');
    this.assertEqual(goalDomain.match(/[^a-z0-9\.\-]/gi), null);
    this.assert(
      goalUid.match(/^\w{4}\-\w{4}$/) !== null,
      '`goalUid` does not match anchored four-by-four pattern'
    );

    return 'https://' + goalDomain + '/stat/api/v1/goals/' + goalUid + '.json';
  },

  generateYoutubeUrl: function(youtubeId) {

    this.assertIsOneOfTypes(youtubeId, 'string');

    return 'https://www.youtube.com/embed/' + youtubeId;
  },

  generateYoutubeIframeSrc: function(youtubeId, autoplay) {

    this.assertIsOneOfTypes(youtubeId, 'string');

    var src = 'https://www.youtube.com/embed/' + youtubeId + '?rel=0&showinfo=0';

    if (autoplay) {
      src += '&autoplay=true';
    }

    return src;
  },

  /**
   * Walks up the DOM looking for elements with the given attribute.
   * When it finds one, returns the value of the given attribute.
   *
   * @param {HTMLElement | jQuery} element - The starting point of the search.
   * @param {string} attribute - The name of the attribute to search for.
   *
   * @return {string | undefined} - The value of the found attribute, or undefined if not found.
   */
  findClosestAttribute: function(element, attribute) {

    this.assertInstanceOfAny(element, $, HTMLElement);
    this.assertIsOneOfTypes(attribute, 'string');

    return $(element).closest(this.format('[{0}]', attribute)).attr(attribute);
  },

  /**
   * @function storytellerApiRequest
   * @description
   * Makes a call to the API_PREFIX_PATH for Storyteller, and returns a Promise.
   *
   * @param {String} path - a valid Storyteller API URI.
   * @param {String} requestType - any HTTP verb.
   * @param {Any} requestData - any JSON-formatted data.
   *
   * @return {Promise}
   */
  storytellerApiRequest: function(path, requestType, requestData) {
    return Promise.resolve(
      $.ajax({
        url: Constants.API_PREFIX_PATH + path,
        type: requestType,
        dataType: 'json',
        contentType: 'application/json',
        headers: {
          'X-CSRF-Token': Environment.CSRF_TOKEN
        },
        data: requestData
      })
    );
  },

  /**
   * @function ellipsifyText
   * @description
   * Truncates a string and appends an ellipsis such that when rendered in its
   * container element the number of lines of text is less than or equal to the
   * argument `lineCount`.
   *
   * @param {Object} $element - a jQuery-wrapped DOM element.
   * @param {Number} lineCount - an integer specifying the maximum number of
   * lines of text to render before truncating the string and appending an
   * ellipsis.
   *
   * @return {Undefined} - this method is side-effecty.
   */
  ellipsifyText: function($element, lineCount) {
    var elementHeight = $element.height();
    var lineHeight = Math.ceil(parseFloat($element.css('line-height')));
    var targetElementHeight = lineHeight * lineCount;
    var words;
    var truncatedWords;

    this.assert(
      (Math.floor(lineCount) === lineCount),
      '`lineCount` must be an integer'
    );

    if (elementHeight > targetElementHeight) {
      words = $element.text().split(' ');

      if (words[words.length - 1] === '…') {
        truncatedWords = words.slice(0, -2);
      } else {
        truncatedWords = words.slice(0, -1);
      }

      $element.text(truncatedWords.join(' ') + '…');

      if (truncatedWords.length > 0) {
        this.ellipsifyText($element, lineCount);
      }
    }
  },

  formatValueWithoutRounding: function(value) {
    var valueIsNegative = value < 0;
    var absValue = Math.abs(value);
    var valueInteger;
    var valueFraction;
    var valueUnit;
    var valueFractionHundredths;

    function deriveValueFraction(val, digits) {
      var fraction = val.toString().split('.')[0];

      return fraction.substring(fraction.length - digits);
    }

    if (!_.isNumber(value)) {
      return value;
    }

    valueInteger = Math.floor(absValue);

    if (valueInteger < 1e3) {
      valueFraction = absValue.toString().split('.')[1] || '';
      valueUnit = '';
    } else if (valueInteger < 1e6) {
      valueInteger = Math.floor(absValue / 1e3);
      valueFraction = deriveValueFraction(absValue, 3);
      valueUnit = 'K';
    } else if (valueInteger < 1e9) {
      valueInteger = Math.floor(absValue / 1e6);
      valueFraction = deriveValueFraction(absValue, 6);
      valueUnit = 'M';
    } else if (valueInteger < 1e12) {
      valueInteger = Math.floor(absValue / 1e9);
      valueFraction = deriveValueFraction(absValue, 9);
      valueUnit = 'B';
    } else {
      valueInteger = Math.floor(absValue / 1e12);
      valueFraction = deriveValueFraction(absValue, 12);
      valueUnit = 'T';
    }

    valueFractionHundredths = (valueFraction.length > 1) ? parseInt(valueFraction.charAt(1), 10) : 0;

    if (valueFractionHundredths >= 5) {
      valueFraction = Math.min(9, parseInt(valueFraction.charAt(0), 10) + 1).toString();
    } else {
      valueFraction = (valueFraction.charAt(0) === '0') ? '' : valueFraction.charAt(0);
    }

    return (
      ((valueIsNegative) ? '-' : '') +
      valueInteger.toLocaleString() +
      ((valueFraction.length > 0) ? ('.' + valueFraction) : '') +
      valueUnit
    );
  },

  // Fetch strings from the site_theme of the specified domain's configuration.
  // Returns a promise for a plain object.
  //
  // Example promise resolution:
  // {
  //   "open_performance": {
  //     "metric": {
  //       "progress": {
  //         "good": "Some String"
  //       }
  //     }
  //   }
  // }
  //
  // locale: String, optional, defaults to 'en'
  // domain: String, optional, defaults to page domain.
  fetchDomainStrings: function(locale, domain) {
    locale = locale || 'en';
    return this.fetchDomainConfigurationHash(domain, { type: 'site_theme' }).
      then(function(configs) { return _.merge.apply(_, configs); }).
      then(function(config) {
        var strings = _.get(config, 'properties.strings', {});
        return _.merge(strings, _.get(strings, locale, {}));
      });
  },

  /**
   * Fetch configurations for the given domain (page domain if omitted). Returns a promise for
   * an array of configurations. You likely want to use fetchDomainConfigurationHash instead,
   * because the configuration properties as returned here are difficult to consume.
   * Not only are they an array of name-value pairs (meaning by-name lookup is annoying,
   * but the names are also dot-delimited to arbitrary depth.
   *
   * Example promise resolution:
   * [
   *   {
   *     "id": 19,
   *     "name": "Feature Flags",
   *     "default": true,
   *     "domainCName": "localhost",
   *     "type": "feature_flags",
   *     "updatedAt": 1457488698,
   *     "properties": [
   *       {
   *         "name": "stories_enabled",
   *         "value": "true"
   *       },
   *       {
   *         "name": "asteroids",
   *         "value": "true"
   *       }
   *     ]
   *   },
   *   {
   *     "id": 4,
   *     "name": "Current Theme",
   *     "default": true,
   *     "domainCName": "localhost",
   *     "type": "site_theme",
   *     "updatedAt": 1457488698,
   *     "properties": [
   *       {
   *         "name": "strings.open_performance.metric.progress.good", // <-- Note the dot delimiter.
   *         "value": "A Good Goal"
   *       },
   *       {
   *         "name": "strings.open_performance.metric.progress.bad",
   *         "value": "A Bad Goal"
   *       },
   *       {
   *         "name": "custom_css",
   *         "value": "stuff"
   *       }
   *     ]
   *   }
   * ]
   *
   * Options:
   *   Authoritative list is here, under the Parameters heading: https://localhost/api/docs/configurations
   *
   *   Quick ref (default value):
   *   merge (true): Whether to merge with parent properties.
   *   default_only (false): Whether to return only the default.
   *   type (unset): The tope of configuration to return.
   */
  fetchDomainConfigurations: function(domain, options) {
    domain = domain || window.location.hostname;
    options = _.extend({}, { merge: true, default_only: false }, options);
    return Promise.resolve($.get(
      this.format('https://{0}/api/configurations.json?{1}', domain, $.param(options))
    ));
  },

  /**
   * Fetch configurations for the given domain (page domain if omitted). Returns a promise for an array of
   * configurations. Each configuration's properties are represented as a hash.
   *
   * Example promise resolution:
   * [
   *   {
   *     "id": 19,
   *     "name": "Feature Flags",
   *     "default": true,
   *     "domainCName": "localhost",
   *     "type": "feature_flags",
   *     "updatedAt": 1457488698,
   *     "properties": {
   *       "stories_enabled": true,
   *       "asteroids: true
   *     }
   *   },
   *   {
   *     "id": 4,
   *     "name": "Current Theme",
   *     "default": true,
   *     "domainCName": "localhost",
   *     "type": "site_theme",
   *     "updatedAt": 1457488698,
   *     "properties": {             // <-- Note that this is a hash.
   *       "custom_css": "stuff",
   *       "strings": {
   *         "open_performance": {
   *           "metric": {
   *             "progress": {
   *               "bad": "A Bad Goal",
   *               "good": "A Good Goal"
   *             }
   *           }
   *         }
   *       }
   *     }
   *   }
   * ]
   *
   * Options:
   *   Authoritative list is here, under the Parameters heading: https://localhost/api/docs/configurations
   *
   *   Quick ref (default value):
   *   merge (true): Whether to merge with parent properties.
   *   default_only (false): Whether to return only the default.
   *   type (unset): The tope of configuration to return.
   */
  fetchDomainConfigurationHash: function(domain, options) {
    return utils.fetchDomainConfigurations(domain, options).then(function(configurations) {
      // Hashify each config, taking into account that properties may have a dot-delimited name
      // (i.e. "strings.homepage.foobar") that should be parsed.
      return _.each(configurations, function(configuration) {
        configuration.properties = utils.keyByPath(configuration.properties, 'name', 'value');
      });
    });
  },

  /**
   * Maps a collection of [path, value] pairs to an object.
   * Similar to _.indexBy/_.keyBy, but correctly understands dot-delimited paths.
   * Best explained by example:
   * keyByPath(
   *   [
   *     { name: 'a', value: 'one' },
   *     { name: 'b.x', value: 'two' },
   *     { name: 'b.y', value: 'three' }
   *   ],
   *   'name',
   *   'value'
   *  )
   * Returns:
   * {
   *   a: 'one',
   *   b: {
   *     x: 'two',
   *     y: 'three'
   *   }
   * }
   *
   * By comparison, _.indexBy/_.keyBy would return:
   * {
   *   'a', 'one',
   *   'b.x', 'two',
   *   'b.y', 'three'
   * }
   *
   * pathIteratee and valueIteratee, like in lodash, can be either
   * a string property name or an iteratee function.
   * valueIteratee defaults to _.identity. Omitting pathIteratee is an error.
   */
  keyByPath: function(collection, pathIteratee, valueIteratee) {
    var result = {};

    pathIteratee = _.iteratee(pathIteratee);
    valueIteratee = _.iteratee(valueIteratee) || _.identity;

    _.each(
      collection,
      function(item) {
        _.set(result, pathIteratee(item), valueIteratee(item));
      }
    );

    return result;
  },

  // Prevent form autosubmission on <enter> key.
  // All our forms that actually use the default
  // browser form submission have an action attribute.
  preventFormAutoSubmit: function() {
    $(document.body).on('submit', 'form:not([action])', _.constant(false));
  }
});

exportImpl(utils, 'socrata.utils');
export default utils;
