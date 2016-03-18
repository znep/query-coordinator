import $ from 'jQuery';
import _ from 'lodash';
import SocrataUtils from 'socrata-utils';

import Constants from './editor/Constants';
import Environment from './StorytellerEnvironment';
import VifUtils from './VifUtils';

export default _.merge({}, SocrataUtils, VifUtils, {
  export: function(thing, as) {
    _.set(window, as, thing);
    return thing;
  },
  format: function(string) {
    return String.prototype.format.apply(string, _.tail(arguments));
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
	}
});
