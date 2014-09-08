describe('fromNow filter', function() {
  var FROM_NOW_VALUE = '12 days ago';
  var fromNow;
  var isValidStub;
  var fromNowStub;

  beforeEach(function() {
    isValidStub = sinon.stub();
    fromNowStub = sinon.stub();
    module('socrataCommon.filters', function($provide) {
      $provide.value('moment', function() {
        return {
          isValid: isValidStub,
          fromNow: fromNowStub
        }
      });
    });
    inject(function(fromNowFilter) {
      fromNow = fromNowFilter;
    });
  });

  it('should take a date and return a moment.fromNow value', function() {
    isValidStub.returns(true);
    fromNowStub.returns(FROM_NOW_VALUE);
    expect(fromNow(new Date())).to.equal(FROM_NOW_VALUE);
    expect(isValidStub.callCount).to.equal(1);
    expect(fromNowStub.callCount).to.equal(1);
  });

  it('should return an empty string for an invalid date', function() {
    isValidStub.returns(false);
    fromNowStub.returns('ignored');
    expect(fromNow('invalid')).to.equal('');
    expect(fromNowStub.callCount).to.equal(0);
  });
});
