import { assert, expect } from 'chai';
import fetchMock from 'fetch-mock';
import serverConfig from '../../data/mock_server_config';
import { fetchJsonWithDefaults } from 'common/components/AccessManager/Util';

describe('Util', () => {
  beforeEach(() => {
    window.serverConfig = serverConfig;
    fetchMock.get('/test/path', {}, { name: 'testFetch' });
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('passes the proper headers when calling fetch', (done) => {
    fetchJsonWithDefaults('/test/path').
      then(() => {
        const [ignored, { headers }] = fetchMock.lastCall('testFetch');
        assert.equal(headers['X-CSRF-Token'], serverConfig.csrfToken);
        assert.equal(headers['X-App-Token'], serverConfig.appToken);
        done();
      }).
      catch(err => { console.error(err); done(err); });
  });
});
