(function(root) {

  'use strict';

  var Constants = root.Constants;
  var socrata = root.socrata;
  var utils = socrata.utils;
  var storyteller = socrata.storyteller;

  function WindowSizeBreakpointStore() {

    _.extend(this, new storyteller.Store());

    var self = this;
    var lastBreakClasses;

    /**
     * Public methods
     */

    /**
     * @function getAllClassBreaks
     * @description
     * Returns all of the class breaks that are available to window.
     * This includes:
     * - small
     * - medium
     * - large
     * - xlarge
     * - xxlarge
     * @returns {Array} - All class breaks defined in _computeClassBreaks.
     */
    this.getAllClassBreaks = function () {
      return lastBreakClasses || _computeClassBreaks(root.innerWidth);
    };

    /**
     * @function getClassBreak
     * @description
     * When the window is resized, we have specific breaks that
     * choose a class that is relevant for that size of screen, such as
     * small for devices smaller than 768px.
     *
     * This function returns the current, relevant class break name.
     *
     * @returns {String} - The current window size class break.
     */
    this.getClassBreak = function () {
      return _.findKey(this.getAllClassBreaks(), _.identity, true);
    };

    /**
     * @function getUnusedClassBreaks
     * @description
     * This is the complement of getClassBreak. In other words, it returns
     * all classes that are NOT currently relevant to the window size.
     *
     * @returns {Array} - An array of class break names.
     */
    this.getUnusedClassBreaks = function () {
      return _.omit(this.getAllClassBreaks(), this.getClassBreak());
    };

    /**
     * Private methods
     */

    function _computeClassBreaks(windowSize) {
      utils.assertIsOneOfTypes(windowSize, 'number');

      return {
        xxlarge: windowSize >= Constants.WINDOW_SIZE_BREAK_XXLARGE,
        xlarge: windowSize < Constants.WINDOW_SIZE_BREAK_XXLARGE && windowSize >= Constants.WINDOW_SIZE_BREAK_XLARGE,
        large: windowSize < Constants.WINDOW_SIZE_BREAK_XLARGE && windowSize >= Constants.WINDOW_SIZE_BREAK_LARGE,
        medium: windowSize < Constants.WINDOW_SIZE_BREAK_LARGE && windowSize >= Constants.WINDOW_SIZE_BREAK_MEDIUM,
        small: windowSize < Constants.WINDOW_SIZE_BREAK_MEDIUM
      };
    }

    function _haveClassBreaksChanged(newClasses, oldClasses) {
      if (!oldClasses) {
        return true;
      }

      return _.any(newClasses, function (isEnabled, className) {
        return oldClasses[className] !== isEnabled;
      });
    }

    $(root).resize(function (event) {
      var width = event.target.innerWidth;
      var breakClasses = _computeClassBreaks(width);

      if (_haveClassBreaksChanged(breakClasses, lastBreakClasses)) {
        lastBreakClasses = breakClasses;
        self._emitChange();
      }
    });
  }

  root.socrata.storyteller.WindowSizeBreakpointStore = WindowSizeBreakpointStore;
})(window);
