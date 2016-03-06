import $ from 'jQuery';
import _ from 'lodash';

import Store from './Store';
import StorytellerUtils from '../../StorytellerUtils';
import Constants from '../Constants';

export var windowSizeBreakpointStore = new WindowSizeBreakpointStore();
export default function WindowSizeBreakpointStore() {
  _.extend(this, new Store());

  var self = this;
  var lastWindowSizeClasses;

  /**
   * Public methods
   */

  /**
   * @function getAllWindowSizeClasses
   * @description
   * Returns all of the class breaks that are available to window.
   * This includes:
   * - small
   * - medium
   * - large
   * - xlarge
   * - xxlarge
   * @returns {Array} - All class breaks defined in _computeWindowSizeClasses.
   */
  this.getAllWindowSizeClasses = function() {
    return lastWindowSizeClasses || _computeWindowSizeClasses(window.innerWidth);
  };

  /**
   * @function getWindowSizeClass
   * @description
   * When the window is resized, we have specific breaks that
   * choose a class that is relevant for that size of screen, such as
   * small for devices smaller than 768px.
   *
   * This function returns the current, relevant class break name.
   *
   * @returns {String} - The current window size class break.
   */
  this.getWindowSizeClass = function() {
    return _.findKey(this.getAllWindowSizeClasses(), _.identity, true);
  };

  /**
   * @function getUnusedWindowSizeClasses
   * @description
   * This is the complement of getWindowSizeClass. In other words, it returns
   * all classes that are NOT currently relevant to the window size.
   *
   * @returns {Array} - An array of class break names.
   */
  this.getUnusedWindowSizeClasses = function() {
    return _.keys(_.omit(this.getAllWindowSizeClasses(), this.getWindowSizeClass()));
  };

  /**
   * Private methods
   */

  function _computeWindowSizeClasses(windowSize) {
    StorytellerUtils.assertIsOneOfTypes(windowSize, 'number');

    return {
      large: windowSize >= Constants.WINDOW_SIZE_BREAK_LARGE,
      medium: windowSize < Constants.WINDOW_SIZE_BREAK_LARGE && windowSize >= Constants.WINDOW_SIZE_BREAK_MEDIUM,
      small: windowSize < Constants.WINDOW_SIZE_BREAK_MEDIUM
    };
  }

  function _haveWindowSizeClassesChanged(newClasses, oldClasses) {
    if (!oldClasses) {
      return true;
    }

    return _.some(newClasses, function(isEnabled, className) {
      return oldClasses[className] !== isEnabled;
    });
  }

  function _resize(event) {
    var width = event.target.innerWidth;
    var sizeClasses = _computeWindowSizeClasses(width);

    if (_haveWindowSizeClassesChanged(sizeClasses, lastWindowSizeClasses)) {
      lastWindowSizeClasses = sizeClasses;
      self._emitChange();
    }
  }

  $(window).resize(_resize);
  $(window).resize();
}
