describe('fromNow filter', function() {
  'use strict';

  var FROM_NOW_VALUE = '12 days ago';
  var TWELVE_DAYS_AGO_DATE = moment().subtract(12, 'day').toDate();
  var INVALID_DATE = new Date('');
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
    expect(fromNow(INVALID_DATE)).to.equal('');
  });
});
