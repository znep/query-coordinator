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

    this.getClassBreaks = function () {
      return lastBreakClasses || _computeClassBreaks(root.innerWidth);
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
