import _ from 'lodash';

import { FeatureFlags } from 'common/feature_flags';
import CollaboratorsDataProvider, { __RewireAPI__ as CollaboratorsDataProviderApi } from 'editor/CollaboratorsDataProvider';

describe('CollaboratorsDataProvider', () => {
  let subject;
  let mockHttpRequest;
  let environment;

  beforeEach(() => {
    environment = {
      STORY_UID: 'exam-ples'
    };
    FeatureFlags.useTestFixture({
      enable_deprecated_user_search_api: false
    });

    mockHttpRequest = sinon.stub().returns(new Promise(_.noop));
    CollaboratorsDataProviderApi.__Rewire__('httpRequest', mockHttpRequest);
    CollaboratorsDataProviderApi.__Rewire__('Environment', environment);
    subject = new CollaboratorsDataProvider();
  });

  afterEach(() => {
    CollaboratorsDataProviderApi.__ResetDependency__('httpRequest');
    CollaboratorsDataProviderApi.__ResetDependency__('Environment');
  });

  describe('doesUserWithEmailHaveStoriesRights', () => {
    it('returns results', (done) => {
      const response = { userExists: true, hasStoriesRights: true };
      mockHttpRequest.returns(Promise.resolve({ data: response }));
      subject.doesUserWithEmailHaveStoriesRights('foo').then(
        (resolution) => {
          assert.deepEqual(resolution, response);
          done();
        },
        done
      );
    });

    it('returns null if request fails', (done) => {
      mockHttpRequest.returns(Promise.reject());
      subject.doesUserWithEmailHaveStoriesRights('foo').then(
        (resolution) => {
          assert.isNull(resolution);
          done();
        },
        done
      );
    });
  });
});
