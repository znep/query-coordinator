import dslpCrossOriginErrorsFilter from 'common/airbrake/filters/dslp_cross_origin_errors';

describe('DSLP Cross Origin Errors Filter', function() {
  it('returns null if the error looks like a cross origin error', function() {
    const notice = {
      errors: [{
        message: 'Uncaught SecurityError: Blocked a frame with origin "http://domain.com" from accessing a frame with origin "http://bar.com".'
      }]
    };

    assert.isNull(dslpCrossOriginErrorsFilter(notice));
  });

  it('passes the notice through for all other errors', function() {
    const notice = {
      errors: [{
        message: 'Another type of error'
      }]
    };

    assert.equal(dslpCrossOriginErrorsFilter(notice), notice);
  });
});
