import ieFilter from 'common/airbrake/filters/ie';

describe('IE Filter', function() {
  it('returns null if the error is coming from an IE version under 11', function() {
    const notice = {
      context: {
        userAgentInfo: {
          browserName: 'Internet Explorer',
          browserVersion: "10"
        }
      }
    }

    assert.isNull(ieFilter(notice));
  });

  it('passes the notice through for all other errors', function() {
    const ie11Notice = {
      context: {
        userAgentInfo: {
          browserName: 'Internet Explorer',
          browserVersion: "11"
        }
      }
    }

    const safariNotice = {
      context: {
        userAgentInfo: {
          browserName: 'Safari',
        }
      }
    }

    assert.equal(ieFilter(ie11Notice), ie11Notice);
    assert.equal(ieFilter(safariNotice), safariNotice);
  });
});
