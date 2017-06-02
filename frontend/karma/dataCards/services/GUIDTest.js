import { expect, assert } from 'chai';
const angular = require('angular');

describe('Request ID service', function() {
  'use strict';

  var RequestId;

  beforeEach(angular.mock.module('dataCards'));

  beforeEach(function() {
    inject(function($injector) {
      RequestId = $injector.get('RequestId');
    });
  });

  describe('generate()', function() {
    it('should return a valid Socrata request ID /[a-z0-9]{32}/', function() {
      var id = RequestId.generate();
      assert.lengthOf(id, 32);
      assert.match(id, /[a-z0-9]{32}/)
    });

    it('should return a different request ID every call', function() {
      var id1 = RequestId.generate();
      var id2 = RequestId.generate();
      expect(id1).to.not.equal(id2);
    });

    it('should have equal top-16 characters, but different bottom-16 characters', function() {
      var id1 = RequestId.generate();
      var id1Top = id1.slice(0, 16);
      var id2 = RequestId.generate();
      var id2Top = id2.slice(0, 16);
      expect(id1Top).to.have.length(16);
      expect(id2Top).to.have.length(16);
      expect(id1Top).to.equal(id2Top);
    });
  })

});
