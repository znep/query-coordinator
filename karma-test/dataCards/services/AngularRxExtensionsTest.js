describe('Angular RX Extensions', function() {
  'use strict';

  var _extensions, _$rootScope;

  beforeEach(module('socrataCommon.services'));
  beforeEach(module('dataCards'));
  beforeEach(inject(function(AngularRxExtensions, $rootScope) {
    _extensions = AngularRxExtensions;
    _$rootScope = $rootScope;
  }));

});
