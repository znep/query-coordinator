describe('fromNow filter', function() {
  'use strict';

  var FROM_NOW_VALUE = '12 days ago';
  var TWELVE_DAYS_AGO_DATE = moment().subtract(12, 'day').toISOString();
  var fromNow;
  var isValidStub;
  var fromNowStub;

  beforeEach(function() {
    module('socrataCommon.filters');

    inject(function(fromNowFilter) {
      fromNow = fromNowFilter;
    });
  });

  it('should take a date and return a moment.fromNow value', function() {
    expect(fromNow(TWELVE_DAYS_AGO_DATE)).to.equal(FROM_NOW_VALUE);
  });

  it('should return an empty string for an invalid date', function() {
    expect(fromNow('invalid')).to.equal('');
  });

  it('makes valid dates from the format soda2 gives us', function() {
    expect(fromNow('Wed, 25 Mar 2015 23:59:52 GMT')).not.to.equal('');
  });
});
