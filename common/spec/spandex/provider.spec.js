import _ from 'lodash';

import SpandexDataProvider from 'common/spandex/provider';

import { mockResponse } from '../helpers';

describe('SpandexDataProvider', () => {
  const domain = 'example.org';
  const datasetUid = 'yeee-haww';

  describe('instantiation', () => {
    describe('with a domain and datasetUid', () => {
      it('returns an instance of SpandexDataProvider', () => {
        let instance = new SpandexDataProvider({ domain, datasetUid });
        assert.instanceOf(instance, SpandexDataProvider);
      });
    });

    describe('without a domain', () => {
      it('throws', () => {
        assert.throws(() => new SpandexDataProvider({ datasetUid }));
      });
    });

    describe('without a datasetUid', () => {
      it('throws', () => {
        assert.throws(() => new SpandexDataProvider({ domain }));
      });
    });
  });

  describe('fetchSuggestions', () => {
    let spandexDataProvider;
    let fetchSuggestionsStub;
    let mockSpandexResponse;

    afterEach(() => {
      fetchSuggestionsStub.restore();
    });

    describe('when spandex returns success', () => {
      beforeEach(() => {
        mockSpandexResponse = Promise.resolve(mockResponse([], 200));
        fetchSuggestionsStub = sinon.stub(window, 'fetch').resolves(mockSpandexResponse);
        spandexDataProvider = new SpandexDataProvider({ domain, datasetUid });
      });

      it('constructs the correct URL', () => {
        spandexDataProvider.fetchSuggestions('ultramonstrosityquotient', 'optimus', 2);

        sinon.assert.calledOnce(fetchSuggestionsStub);
        const url = window.fetch.args[0][0];
        assert.equal(url, `https://${domain}/views/${datasetUid}/columns/ultramonstrosityquotient/suggest?text=optimus&limit=2`);
      });
    });

    describe('when spandex returns an error', () => {
      beforeEach(() => {
        mockSpandexResponse = Promise.resolve(mockResponse(
          { 'Content-Type': 'text/html', 'Content-Length': 3 },
          403,
          'BAD'
        ));
        fetchSuggestionsStub = sinon.stub(window, 'fetch').resolves(mockSpandexResponse);
      });

      it('rejects the promise', (done) => {
        spandexDataProvider.fetchSuggestions('ultramonstrosityquotient', 'optimus', 2).
          then(() => { throw new Error('Expected promise to be rejected'); }).
          catch(() => done());
      });
    });
  });
});
