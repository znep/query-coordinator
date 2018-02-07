import $ from 'jquery';
import { assert } from 'chai';
import sinon from 'sinon';

import Constants from 'editor/Constants';
import WindowSizeBreakpointStore from 'editor/stores/WindowSizeBreakpointStore';

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
    var windowSizeBreakpointStore = new WindowSizeBreakpointStore();

    var callbackCalled = false;
    var expectedBreakpointClasses = {
      large: false,
      medium: false,
      small: false
    };

    expectedBreakpointClasses[expectedClass] = true;

    windowSizeBreakpointStore.addChangeListener(function() {
      assert.deepEqual(windowSizeBreakpointStore.getAllWindowSizeClasses(), expectedBreakpointClasses);
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
    sinon.stub($.fn, 'resize').callsFake(function(windowResizeCallback) {
      if (typeof windowResizeCallback === 'function') {
        resizeCallback = windowResizeCallback;
      }
    });
  });

  afterEach(function() {
    $.fn.resize.restore();
  });

  it('makes the right blob when given a window size', function() {
    verifyOutput(0, 'small');
    verifyOutput(1, 'small');

    verifyOutput(Constants.WINDOW_SIZE_BREAK_LARGE + 1, 'large');
    verifyOutput(Constants.WINDOW_SIZE_BREAK_LARGE, 'large');
    verifyOutput(Constants.WINDOW_SIZE_BREAK_LARGE - 1, 'medium');

    verifyOutput(Constants.WINDOW_SIZE_BREAK_MEDIUM + 1, 'medium');
    verifyOutput(Constants.WINDOW_SIZE_BREAK_MEDIUM, 'medium');
    verifyOutput(Constants.WINDOW_SIZE_BREAK_MEDIUM - 1, 'small');
  });

  it('should not emit a change if the breakpoint doesn\'t change', function() {
    var windowSizeBreakpointStore = new WindowSizeBreakpointStore();
    var count = 0;
    windowSizeBreakpointStore.addChangeListener(function() {
      count++;
    });

    callResizeCallback(Constants.WINDOW_SIZE_BREAK_LARGE);
    callResizeCallback(Constants.WINDOW_SIZE_BREAK_LARGE + 100);
    callResizeCallback(Constants.WINDOW_SIZE_BREAK_LARGE + 1000);
    callResizeCallback(Constants.WINDOW_SIZE_BREAK_LARGE + 0.0001);

    assert.equal(count, 1);
  });

  describe('getAllWindowSizeClasses', function() {
    it('should return all available window size classes', function() {
      var windowSizeBreakpointStore = new WindowSizeBreakpointStore();
      assert.deepEqual(windowSizeBreakpointStore.getAllWindowSizeClasses(), {
        large: false,
        medium: false,
        small: true
      });
    });
  });

  describe('getUnusedWindowSizeClasses', function() {
    it('should return all unused class breaks', function() {
      var windowSizeBreakpointStore = new WindowSizeBreakpointStore();
      assert.deepEqual(windowSizeBreakpointStore.getUnusedWindowSizeClasses(),
        ['large', 'medium']
      );
      assert.equal(windowSizeBreakpointStore.getWindowSizeClass(), 'small');
    });
  });
});
