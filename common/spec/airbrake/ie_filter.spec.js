import ieFilter from 'common/airbrake/filters/ie';

// User agent string examples taken from:
// http://www.useragentstring.com/pages/useragentstring.php?name=Internet+Explorer

describe('IE Filter', function() {
  it('returns null if the error is coming from an IE version under 11', function() {
    const ie10notice = {
      context: {
        userAgent: 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)'
      }
    };

    const ie9notice = {
      context: {
        userAgent: 'Mozilla/5.0 (Windows; U; MSIE 9.0; WIndows NT 9.0; en-US))'
      }
    };

    assert.isNull(ieFilter(ie10notice));
    assert.isNull(ieFilter(ie9notice));
  });

  it('passes the notice through for all other errors', function() {
    const ie11Notice = {
      context: {
        userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) like Gecko'
      }
    };

    const safariNotice = {
      context: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari'
      }
    };

    const firefoxNotice = {
      context: {
        userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.1'
      }
    };

    const chromeNotice = {
      context: {
        userAgent: 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'
      }
    };

    assert.equal(ieFilter(ie11Notice), ie11Notice);
    assert.equal(ieFilter(safariNotice), safariNotice);
    assert.equal(ieFilter(firefoxNotice), firefoxNotice);
    assert.equal(ieFilter(chromeNotice), chromeNotice);
  });
});
