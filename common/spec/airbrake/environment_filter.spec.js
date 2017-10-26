import environmentFilter from 'common/airbrake/filters/environment';

describe('Environment Filter', function() {
  it('decorates all notices with information about the running environment', function() {
    window.serverConfig = {
      airbrakeEnvironment: 'THIS_IS_NEW'
    };
    const beforeNotice = { context: {} };
    const afterNotice = { context: { environment: 'THIS_IS_NEW' } };

    assert.deepEqual(environmentFilter(beforeNotice), afterNotice);
  });
});
