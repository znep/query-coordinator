import _ from 'lodash';

import CollaboratorsDataProvider, { __RewireAPI__ as CollaboratorsDataProviderApi } from 'editor/CollaboratorsDataProvider';

describe('CollaboratorsDataProvider', () => {
  let subject;
  let mockHttpRequest;
  let environment;

  beforeEach(() => {
    environment = {
      STORY_UID: 'exam-ples'
    };
    mockHttpRequest = sinon.stub().returns(new Promise(_.noop));
    CollaboratorsDataProviderApi.__Rewire__('httpRequest', mockHttpRequest);
    CollaboratorsDataProviderApi.__Rewire__('Environment', environment);
    subject = new CollaboratorsDataProvider();
  });

  afterEach(() => {
    CollaboratorsDataProviderApi.__ResetDependency__('httpRequest');
    CollaboratorsDataProviderApi.__ResetDependency__('Environment');
  });

  describe('lookupUserByEmail', () => {
    describe('ENABLE_DEPRECATED_USER_SEARCH_API = true', () => {
      it('queries core', () => {
        environment.ENABLE_DEPRECATED_USER_SEARCH_API = true;

        subject.lookupUserByEmail('foo');
        sinon.assert.calledWithExactly(
          mockHttpRequest,
          'GET',
          '/api/search/users.json?q=foo'
        );
      });
    });

    describe('ENABLE_DEPRECATED_USER_SEARCH_API = false', () => {
      it('queries cetera', () => {
        environment.ENABLE_DEPRECATED_USER_SEARCH_API = false;

        subject.lookupUserByEmail('foo');
        sinon.assert.calledWithExactly(
          mockHttpRequest,
          'GET',
          '/stories/search/users.json?email=foo'
        );
      });
    });

    it('returns null if request fails', (done) => {
      mockHttpRequest.returns(Promise.reject());
      subject.lookupUserByEmail('foo').then(
        (resolution) => {
          assert.isNull(resolution);
          done();
        },
        done
      );
    });

    it('returns null if request returns empty', (done) => {
      mockHttpRequest.returns(Promise.resolve({ results: [] }));
      subject.lookupUserByEmail('foo').then(
        (resolution) => {
          assert.isNull(resolution);
          done();
        },
        done
      );
    });

    it('returns the user if request returns results', (done) => {
      const user = { id: 'some-user', roleName: 'test_dummy' };
      mockHttpRequest.returns(Promise.resolve({ data: { results: [ user ] } }));
      subject.lookupUserByEmail('foo').then(
        (resolution) => {
          assert.deepEqual(resolution, user);
          done();
        },
        done
      );
    });
  });
});
