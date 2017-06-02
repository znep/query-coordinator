import sinon from 'sinon';
import { expect, assert } from 'chai';
const angular = require('angular');

describe('WindowState service', function() {
  'use strict';

  beforeEach(angular.mock.module('dataCards'));

  var WindowState;
  beforeEach(function() {
    inject(function($injector) {
      WindowState = $injector.get('WindowState');
    });
  });

  describe('mouseLeftButtonPressedSubject', function() {

    function generateFakeMouseDown(button) {
      var ev = document.createEvent('HTMLEvents');
      ev.initEvent('mousedown', true, true);
      ev.which = button;
      ev.pageX = 1337;
      ev.pageY = 666;
      return ev;
    }

    function generateFakeMouseUp(button) {
      var ev = document.createEvent('HTMLEvents');
      ev.initEvent('mouseup', true, true);
      ev.which = button;
      ev.pageX = 1337;
      ev.pageY = 666;
      return ev;
    }

    it('should react to left mousedown', function() {
      assert.isFalse(WindowState.mouseLeftButtonPressed$.value);

      var body = document.getElementsByTagName('body')[0];

      body.dispatchEvent(generateFakeMouseDown(1));

      assert.isTrue(WindowState.mouseLeftButtonPressed$.value);
    });

    it('should not react to right mousedown', function() {
      assert.isFalse(WindowState.mouseLeftButtonPressed$.value);

      var body = document.getElementsByTagName('body')[0];

      body.dispatchEvent(generateFakeMouseDown(3));

      assert.isFalse(WindowState.mouseLeftButtonPressed$.value);
    });

    it('should react to left mouseup after left mousedown', function() {
      assert.isFalse(WindowState.mouseLeftButtonPressed$.value);

      var body = document.getElementsByTagName('body')[0];

      body.dispatchEvent(generateFakeMouseDown(1));
      assert.isTrue(WindowState.mouseLeftButtonPressed$.value);

      body.dispatchEvent(generateFakeMouseUp(1));
      assert.isFalse(WindowState.mouseLeftButtonPressed$.value);
    });

  });

  describe('mousePosition$', function() {

    function generateFakeMouseMove(clientX, clientY) {
      var ev = document.createEvent('HTMLEvents');
      ev.initEvent('mousemove', true, true);
      ev.clientX = clientX;
      ev.clientY = clientY;
      return ev;
    }

    it('should report the correct mouse position on mousemove', function() {
      var body = document.getElementsByTagName('body')[0];

      expect(WindowState.mousePosition$.value).to.deep.equal({
        clientX: 0,
        clientY: 0,
        target: document.body
      });

      body.dispatchEvent(generateFakeMouseMove(10, 20));

      expect(WindowState.mousePosition$.value).to.deep.equal({
        clientX: 10,
        clientY: 20,
        target: body
      });
      expect(WindowState.mouseClientX).to.equal(10);
      expect(WindowState.mouseClientY).to.equal(20);
    });
  });

  describe('windowSize$', function() {

    it('should react to resize events on window', function() {
      var handler = sinon.spy();
      WindowState.windowSize$.subscribe(handler);
      sinon.assert.calledOnce(handler);

      var ev = document.createEvent('HTMLEvents');
      ev.initEvent('resize', true, true);
      window.dispatchEvent(ev);

      sinon.assert.calledTwice(handler);

      var currentWindowDimensions = $(window).dimensions();
      assert.isTrue(handler.alwaysCalledWithExactly(currentWindowDimensions));
    });

  });
});
