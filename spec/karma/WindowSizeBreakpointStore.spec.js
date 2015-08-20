(function(root) {
  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;

  describe('WindowSizeBreakpointStore', function() {

    var resizeCallback;

    function callResizeCallback(size) {
      resizeCallback({
        target: {
          innerWidth: size
        }
      });
    }

    function verifyOutput(size, expectedClass) {
      var windowSizeBreakpointStore = new storyteller.WindowSizeBreakpointStore();

      var callbackCalled = false;
      var expectedBreakpoints = {
        xxlarge: false,
        xlarge: false,
        large: false,
        medium: false,
        small: false
      };

      expectedBreakpoints[expectedClass] = true;

      windowSizeBreakpointStore.addChangeListener(function () {
        assert.deepEqual(windowSizeBreakpointStore.getClassBreaks(), expectedBreakpoints);
        callbackCalled = true;
      });

      resizeCallback({
        target: {
          innerWidth: size
        }
      });

      assert(callbackCalled, 'Callback should be called.');
    }

    beforeEach(function() {
      sinon.stub($.fn, 'resize', function (windowResizeCallback) {
        resizeCallback = windowResizeCallback;
      });
    });

    afterEach(function() {
      $.fn.resize.restore();
    });

    it('makes the right blob when given a window size', function () {
      chai.config.truncateThreshold = 0;
      verifyOutput(0, 'small');
      verifyOutput(1, 'small');

      verifyOutput(Constants.WINDOW_SIZE_BREAK_XXLARGE + 1, 'xxlarge');
      verifyOutput(Constants.WINDOW_SIZE_BREAK_XXLARGE, 'xxlarge');
      verifyOutput(Constants.WINDOW_SIZE_BREAK_XXLARGE - 1, 'xlarge');

      verifyOutput(Constants.WINDOW_SIZE_BREAK_XLARGE + 1, 'xlarge');
      verifyOutput(Constants.WINDOW_SIZE_BREAK_XLARGE, 'xlarge');
      verifyOutput(Constants.WINDOW_SIZE_BREAK_XLARGE - 1, 'large');

      verifyOutput(Constants.WINDOW_SIZE_BREAK_LARGE + 1, 'large');
      verifyOutput(Constants.WINDOW_SIZE_BREAK_LARGE, 'large');
      verifyOutput(Constants.WINDOW_SIZE_BREAK_LARGE - 1, 'medium');

      verifyOutput(Constants.WINDOW_SIZE_BREAK_MEDIUM + 1, 'medium');
      verifyOutput(Constants.WINDOW_SIZE_BREAK_MEDIUM, 'medium');
      verifyOutput(Constants.WINDOW_SIZE_BREAK_MEDIUM - 1, 'small');
    });

    it('should not emit a change if the breakpoint doesn\'t change', function() {
      var windowSizeBreakpointStore = new storyteller.WindowSizeBreakpointStore();
      var count = 0;
      windowSizeBreakpointStore.addChangeListener(function() {
        count++;
      });

      callResizeCallback(Constants.WINDOW_SIZE_BREAK_XXLARGE);
      callResizeCallback(Constants.WINDOW_SIZE_BREAK_XXLARGE + 100);
      callResizeCallback(Constants.WINDOW_SIZE_BREAK_XXLARGE + 1000);
      callResizeCallback(Constants.WINDOW_SIZE_BREAK_XXLARGE + 0.0001);

      assert.equal(count, 1);
    });
  });
})(window);
