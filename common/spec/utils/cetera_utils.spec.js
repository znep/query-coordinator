import _ from 'lodash';
import { assert } from 'chai';
import airbrake from 'common/airbrake';
// The import below causes the test to print WARN: 'Mixpanel has not been loaded or has been disabled.' -SOARY
import mixpanel from 'common/mixpanel';
import sinon from 'sinon';
import { useTestTranslations } from 'common/i18n';
import frontendTranslations from 'frontend/config/locales/en.yml';

import mockCeteraFetchResponse from 'common/spec/components/AssetBrowser/data/mock_cetera_fetch_response';

import ceteraUtils from 'common/cetera/utils';

const stubCeteraFetch = (ceteraResponse) => (
  sinon.stub(window, 'fetch').callsFake(_.constant(Promise.resolve(ceteraResponse)))
);

describe('cetera/utils', () => {

  describe('ceteraQueryString', () => {

    it('handles baseFilters as an array of values', () => {
      assert.equal(
        ceteraUtils.ceteraQueryString({ approvalStatus: ['approved', 'rejected'] }),
        'domains=localhost&limit=6&offset=0&order=relevance&search_context=localhost&approval_status[]=approved&approval_status[]=rejected'
      );
    });

    it('handles baseFilters as a single string value', () => {
      assert.equal(
        ceteraUtils.ceteraQueryString({ approvalStatus: 'pending' }),
        'domains=localhost&limit=6&offset=0&order=relevance&search_context=localhost&approval_status=pending'
      );
    });
  });

  describe('query', () => {
    let mixpanelStub = null;
    let ceteraStub = null;
    let ceteraResponse = null;

    beforeEach(() => {
      mixpanelStub = sinon.stub(mixpanel, 'sendPayload');
      ceteraResponse = _.cloneDeep(mockCeteraFetchResponse);
      ceteraResponse.status = 200;
      ceteraStub = stubCeteraFetch(ceteraResponse);
      useTestTranslations(frontendTranslations.en);
    });

    afterEach(() => {
      mixpanelStub.restore();
      ceteraStub.restore();
    });

    describe('encoding query string parameters', () => {

      it('encodes "false" boolean values', () => {
        ceteraUtils.query({ showVisibility: false });
        assert.equal(
          window.fetch.args[0][0],
          '/api/catalog/v1?domains=localhost&limit=6&offset=0&order=relevance&search_context=localhost&show_visibility=false'
        );
      });

      it('encodes "true" boolean values', () => {
        ceteraUtils.query({ showVisibility: true });
        assert.equal(
          window.fetch.args[0][0],
          '/api/catalog/v1?domains=localhost&limit=6&offset=0&order=relevance&search_context=localhost&show_visibility=true'
        );
      });

      it('omits null values', () => {
        ceteraUtils.query({ showVisibility: null });
        assert.equal(
          window.fetch.args[0][0],
          '/api/catalog/v1?domains=localhost&limit=6&offset=0&order=relevance&search_context=localhost'
        );
      });

    });

    describe('unsuccessful response', () => {

      let airBrakeStub = null;
      let consoleErrorStub = null;

      beforeEach(() => {
        airBrakeStub = sinon.stub(airbrake, 'notify');
        consoleErrorStub = sinon.stub(window.console, 'error');
      });

      afterEach(() => {
        airBrakeStub.restore();
        consoleErrorStub.restore();
      });

      // Returns a promise
      it('throws a connection error', () => {
        ceteraResponse.status = 502;

        return ceteraUtils.query({ mixpanelContext: 'Used Asset Search Field' }).then(
          () => { throw new Error('Unexpected resolution'); },
          (error) => {
            ceteraStub.restore();
            assert.equal(error.toString(),
              'Error: We were unable to connect to the asset catalog. Please reload and try again.');
          }
        );
      });

      // Returns a promise
      it('throws a service unavailable error', () => {
        ceteraResponse.status = 503;

        return ceteraUtils.query({ mixpanelContext: 'Used Asset Search Field' }).then(
          () => { throw new Error('Unexpected resolution'); },
          (error) => {
            ceteraStub.restore();
            assert.equal(error.toString(),
              'Error: We were unable to contact the asset catalog. Please reload and try again.');
          }
        );
      });

      // Returns a promise
      it('throws a timeout error', () => {
        ceteraResponse.status = 504;

        return ceteraUtils.query({ mixpanelContext: 'Used Asset Search Field' }).then(
          () => { throw new Error('Unexpected resolution'); },
          (error) => {
            ceteraStub.restore();
            assert.equal(error.toString(),
              'Error: We were unable to query to the asset catalog. Please reload and try again.');
          }
        );
      });

    });

    describe('successful response', () => {

      describe('query', () => {

        describe('without mixpanel', () => {

          // Returns a promise
          it('should return results', () => {
            return ceteraUtils.query({}).then((response) => {
              assert(response.results.length > 0);
            });
          });

        });

        describe('mixpanel', () => {

          // Returns a promise
          it('includes the context argument when reporting metrics', () => {
            return ceteraUtils.query({
              mixpanelContext: {
                eventName: 'Used Asset Search Field',
                params: { pageNumber: 3 }
              }
            }).then((response) => {
              assert.equal(mixpanel.sendPayload.getCall(0).args[0], 'Used Asset Search Field');
              assert.equal(mixpanel.sendPayload.getCall(0).args[1]['Result Count'], 6);
              assert.equal(mixpanel.sendPayload.getCall(0).args[1].pageNumber, 3);
            });
          });
        });
      });
    });
  });
});
