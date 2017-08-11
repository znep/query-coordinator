import PermissionStore, {__RewireAPI__ as PermissionStoreAPI} from 'editor/stores/PermissionStore';

describe('PermissionStore', () => {

  function getStore(authorization) {
    PermissionStoreAPI.__Rewire__('Environment', {
      CURRENT_USER_STORY_AUTHORIZATION: authorization
    });

    return new PermissionStore();
  }

  afterEach(function() {
    PermissionStoreAPI.__ResetDependency__('Environment');
  });

  describe('publishing authorization', () => {
    it('returns true for users with edit_others_stories right', () => {
      const store = getStore({ domainRights: ['edit_others_stories'] });
      assert.isTrue(store.canPublishCurrentStory());
    });

    it('returns true for story co-owners with the manage_story_public_version right', () => {
      const store = getStore({ viewRole: 'owner', domainRights: ['manage_story_public_version'] });
      assert.isTrue(store.canPublishCurrentStory());
    });

    it('returns false if none of the above criteria are met', () => {
      const store = getStore({
        viewRole: 'contributor',
        domainRights: ['edit_story']
      });
      assert.isFalse(store.canPublishCurrentStory());
    });
  });
});
