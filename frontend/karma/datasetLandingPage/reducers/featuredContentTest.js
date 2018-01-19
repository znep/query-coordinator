import { expect, assert } from 'chai';
import { getDefaultStore } from 'testStore';
import reducer from 'datasetLandingPage/reducers/featuredContent';
import {
  addFeaturedItem,
  editFeaturedItem,
  cancelFeaturedItemEdit,
  requestedFeaturedItemSave,
  handleFeaturedItemSaveSuccess,
  handleFeaturedItemSaveError,
  setExternalResourceField,
  setStoryUrlField,
  requestedStory,
  handleLoadingStorySuccess,
  handleLoadingStoryError,
  requestedFeaturedItemRemoval,
  handleFeaturedItemRemovalSuccess,
  handleFeaturedItemRemovalError
} from 'datasetLandingPage/actions/featuredContent';

describe('reducers/featuredContent', function() {
  var state;

  beforeEach(function() {
    state = reducer();
  });

  describe('ADD_FEATURED_ITEM', function() {
    it('sets isEditing to true', function() {
      expect(state.isEditing).to.equal(false);
      state = reducer(state, addFeaturedItem('story', 0));
      expect(state.isEditing).to.equal(true);
    });

    it('sets editType', function() {
      expect(state.editType).to.equal(null);
      state = reducer(state, addFeaturedItem('story', 0));
      expect(state.editType).to.equal('story');
    });

    it('sets editPosition', function() {
      expect(state.editPosition).to.equal(null);
      state = reducer(state, addFeaturedItem('story', 0));
      expect(state.editPosition).to.equal(0);
    });
  });

  describe('EDIT_FEATURED_ITEM', function() {
    it('sets isEditing to true', function() {
      expect(state.isEditing).to.equal(false);
      state = reducer(state, editFeaturedItem('story', 0));
      expect(state.isEditing).to.equal(true);
    });

    it('sets editType to "externalResource" if the featuredItem is an external resource', function() {
      var featuredItem = {
        contentType: 'external',
        position: 2
      };

      expect(state.editType).to.equal(null);
      state = reducer(state, editFeaturedItem(featuredItem));
      expect(state.editType).to.equal('externalResource');
    });

    it('sets editType to "story" if the featuredItem is a story', function() {
      var featuredItem = {
        contentType: 'internal',
        featuredView: {
          displayType: 'story'
        },
        position: 2
      };

      expect(state.editType).to.equal(null);
      state = reducer(state, editFeaturedItem(featuredItem));
      expect(state.editType).to.equal('story');
    });

    it('sets the externalResource fields if the featured item is an external resource', function() {
      var featuredItem = {
        contentType: 'external',
        position: 2,
        title: 'oh',
        description: 'wow',
        url: 'http://www.nooooooooooooooo.com'
      };

      expect(state.externalResource.title).to.equal('');
      expect(state.externalResource.description).to.equal('');
      expect(state.externalResource.url).to.equal('');

      state = reducer(state, editFeaturedItem(featuredItem));

      expect(state.externalResource.title).to.equal('oh');
      expect(state.externalResource.description).to.equal('wow');
      expect(state.externalResource.url).to.equal('http://www.nooooooooooooooo.com');
    });

    it('sets the story fields if the featured item is a story', function() {
      var featuredItem = {
        contentType: 'internal',
        featuredView: {
          createdAt: 'some date',
          description: 'some description',
          displayType: 'story',
          imageUrl: 'http://dinosaur-polaroids.com',
          name: 'some name',
          url: 'http://some-url.com/stories/s/abcd-1234',
          viewCount: 99
        },
        position: 2
      };

      expect(state.story.title).to.equal('');
      expect(state.story.description).to.equal('');
      expect(state.story.url).to.equal('');
      expect(state.story.imageUrl).to.equal('');
      expect(state.story.createdAt).to.equal('');
      expect(state.story.viewCount).to.equal(null);

      state = reducer(state, editFeaturedItem(featuredItem));

      expect(state.story.title).to.equal('some name');
      expect(state.story.description).to.equal('some description');
      expect(state.story.url).to.equal('http://some-url.com/stories/s/abcd-1234');
      expect(state.story.imageUrl).to.equal('http://dinosaur-polaroids.com');
      expect(state.story.createdAt).to.equal('some date');
      expect(state.story.viewCount).to.equal(99);
    });

    it('sets editPosition to one less than the position of the featured item', function() {
      var featuredItem = {
        contentType: 'external',
        position: 2
      };

      expect(state.editPosition).to.equal(null);
      state = reducer(state, editFeaturedItem(featuredItem));
      expect(state.editPosition).to.equal(2);
    });
  });

  describe('CANCEL_FEATURED_ITEM_EDIT', function() {
    beforeEach(function() {
      state = reducer(state, addFeaturedItem('externalResource', 0));
      state = reducer(state, cancelFeaturedItemEdit());
    });

    it('sets isEditing to false', function() {
      expect(state.isEditing).to.equal(false);
    });

    it('sets editType to null', function() {
      expect(state.editType).to.equal(null);
    });

    it('sets editPosition to null', function() {
      expect(state.editPosition).to.equal(null);
    });

    it('sets isSaving to false', function() {
      state.isSaving = true;
      state = reducer(state, cancelFeaturedItemEdit());
      expect(state.isSaving).to.equal(false);
    });

    it('sets isSaved to false', function() {
      state.isSaved = true;
      state = reducer(state, cancelFeaturedItemEdit());
      expect(state.isSaved).to.equal(false);
    });

    it('sets hasSaveError to false', function() {
      state.hasSaveError = true;
      state = reducer(state, cancelFeaturedItemEdit());
      expect(state.hasSaveError).to.equal(false);
    });
  });

  describe('REQUESTED_FEATURED_ITEM_SAVE', function() {
    it('sets isSaving to true', function() {
      expect(state.isSaving).to.equal(false);
      state = reducer(state, requestedFeaturedItemSave());
      expect(state.isSaving).to.equal(true);
    });

    it('sets hasSaveError to false', function() {
      state.hasSaveError = true;
      state = reducer(state, requestedFeaturedItemSave());
      expect(state.hasSaveError).to.equal(false);
    });
  });

  describe('HANDLE_FEATURED_ITEM_SAVE_SUCCESS', function() {
    it('adds the new featured item to contentList', function() {
      expect(state.contentList).to.deep.equal([null, null, null]);
      state = reducer(state, handleFeaturedItemSaveSuccess('purple', 1));
      expect(state.contentList).to.deep.equal([null, 'purple', null]);
    });

    it('sets isSaving to false', function() {
      state.isSaving = true;
      state = reducer(state, handleFeaturedItemSaveSuccess('purple', 1));
      expect(state.isSaving).to.equal(false);
    });

    it('sets isSaved to true', function() {
      state.isSaved = false;
      state = reducer(state, handleFeaturedItemSaveSuccess('purple', 1));
      expect(state.isSaved).to.equal(true);
    });
  });

  describe('HANDLE_FEATURED_ITEM_SAVE_ERROR', function() {
    it('sets isSaving to false', function() {
      state.isSaving = true;
      state = reducer(state, handleFeaturedItemSaveError());
      expect(state.isSaving).to.equal(false);
    });

    it('sets hasSaveError to true', function() {
      state.hasSaveError = false;
      state = reducer(state, handleFeaturedItemSaveError());
      expect(state.hasSaveError).to.equal(true);
    });
  });

  describe('SET_EXTERNAL_RESOURCE_FIELD', function() {
    it('sets the specified field to the specified value', function() {
      expect(state.externalResource.title).to.equal('');
      state = reducer(state, setExternalResourceField('title', 'purple'));
      expect(state.externalResource.title).to.equal('purple');
    });

    it('sets canSave to true if the title and url are valid', function() {
      expect(state.externalResource.title).to.equal('');
      expect(state.externalResource.url).to.equal('');
      expect(state.externalResource.canSave).to.equal(false);

      state = reducer(state, setExternalResourceField('title', 'purple'));
      state = reducer(state, setExternalResourceField('url', 'http://socrata.com'));

      expect(state.externalResource.title).to.equal('purple');
      expect(state.externalResource.url).to.equal('http://socrata.com');
      expect(state.externalResource.canSave).to.equal(true);

      state = reducer(state, setExternalResourceField('title', ''));

      expect(state.externalResource.canSave).to.equal(false);
    });
  });

  describe('SET_STORY_URL_FIELD', function() {
    it('sets the specified field to the specified value', function() {
      expect(state.story.url).to.equal('');
      state = reducer(state, setStoryUrlField('http://super-real-website.com'));
      expect(state.story.url).to.equal('http://super-real-website.com');
    });

    it('validates the url format', function() {

      // empty string
      state = reducer(state, setStoryUrlField(''));
      expect(state.story.hasValidationError).to.equal(true);

      // string not formatted like a url
      state = reducer(state, setStoryUrlField('cool-potatoes'));
      expect(state.story.hasValidationError).to.equal(true);

      // url not formatted like a story
      state = reducer(state, setStoryUrlField('http://giraffes.com/abcd-1234'));
      expect(state.story.hasValidationError).to.equal(true);

      // url that looks like a story
      state = reducer(state, setStoryUrlField('http://giraffes.com/stories/s/turtles/abcd-1234'));
      expect(state.story.hasValidationError).to.equal(false);
    });

    describe('url format is invalid', function() {
      beforeEach(function() {
        state = reducer(state, setStoryUrlField('cool-potatoes'));
      });

      it('restores the preview widget fields to initial state', function() {
        expect(state.story.description).to.equal('');
        expect(state.story.createdAt).to.equal('');
        expect(state.story.title).to.equal('');
        expect(state.story.viewCount).to.equal(null);
      });

      it('sets canSave to false', function() {
        expect(state.story.canSave).to.equal(false);
      });

      it('does not set shouldLoadStory to true', function() {
        expect(state.story.shouldLoadStory).to.equal(false);
      });
    });

    describe('url format is valid', function() {
      beforeEach(function() {
        state = reducer(state, setStoryUrlField('http://giraffes.com/stories/s/turtles/abcd-1234'));
      });

      it('sets shouldLoadStory to true', function() {
        expect(state.story.shouldLoadStory).to.equal(true);
      });
    });
  });

  describe('REQUESTED_STORY', function() {
    beforeEach(function() {
      state = reducer(state, requestedStory());
    });

    it('sets shouldLoadStory to false', function() {
      expect(state.story.shouldLoadStory).to.equal(false);
    });

    it('sets isLoadingStory to true', function() {
      expect(state.story.isLoadingStory).to.equal(true);
    });
  });

  describe('HANDLE_LOADING_STORY_SUCCESS', function() {
    beforeEach(function() {
      state.story.url = 'http://giraffes.com/stories/s/turtles/abcd-1234';
      state = reducer(state, handleLoadingStorySuccess({
        description: 'ghostly guitars',
        createdAt: '2016-06-08T15:52:10.000-07:00',
        title: 'wombats in space',
        viewCount: 42
      }));
    });

    it('updates preview widget fields', function() {
      expect(state.story.description).to.equal('ghostly guitars');
      expect(state.story.createdAt).to.equal('2016-06-08T15:52:10.000-07:00');
      expect(state.story.title).to.equal('wombats in space');
      expect(state.story.viewCount).to.equal(42);
    });

    it('sets hasValidationError to false', function() {
      expect(state.story.hasValidationError).to.equal(false);
    });

    it('sets isLoadingStory to false', function() {
      expect(state.story.isLoadingStory).to.equal(false);
    });

    it('sets canSave to true', function() {
      expect(state.story.canSave).to.equal(true);
    });
  });

  describe('HANDLE_LOADING_STORY_ERROR', function() {
    beforeEach(function() {
      state.story.url = 'http://giraffes.com/stories/s/turtles/abcd-1234';
      state = reducer(state, handleLoadingStoryError());
    });

    it('updates preview widget fields', function() {
      expect(state.story.description).to.equal('');
      expect(state.story.createdAt).to.equal('');
      expect(state.story.title).to.equal('');
      expect(state.story.viewCount).to.equal(null);
    });

    it('sets hasValidationError to true', function() {
      expect(state.story.hasValidationError).to.equal(true);
    });

    it('sets isLoadingStory to false', function() {
      expect(state.story.isLoadingStory).to.equal(false);
    });

    it('sets canSave to false', function() {
      expect(state.story.canSave).to.equal(false);
    });
  });

  describe('REQUESTED_FEATURED_ITEM_REMOVAL', function() {
    it('sets isRemoving to true', function() {
      expect(state.isRemoving).to.equal(false);
      state = reducer(state, requestedFeaturedItemRemoval(6));
      expect(state.isRemoving).to.equal(true);
    });

    it('sets removePosition', function() {
      expect(state.removePosition).to.equal(null);
      state = reducer(state, requestedFeaturedItemRemoval(6));
      expect(state.removePosition).to.equal(6);
    });

    it('sets hasRemoveError to false', function() {
      state.hasRemoveError = true;
      state = reducer(state, requestedFeaturedItemRemoval(6));
      expect(state.hasRemoveError).to.equal(false);
    });
  });

  describe('HANDLE_FEATURED_ITEM_REMOVAL_SUCCESS', function() {
    it('sets isRemoving to false', function() {
      state.isRemoving = true;
      state = reducer(state, handleFeaturedItemRemovalSuccess(4));
      expect(state.isRemoving).to.equal(false);
    });

    it('sets removePosition to null', function() {
      state.removePosition = 4;
      state = reducer(state, handleFeaturedItemRemovalSuccess(4));
      expect(state.removePosition).to.equal(null);
    });

    it('sets hasRemoveError to false', function() {
      state.hasRemoveError = true;
      state = reducer(state, handleFeaturedItemRemovalSuccess(4));
      expect(state.hasRemoveError).to.equal(false);
    });

    it('removes the item from contentList at the specified index', function() {
      state.contentList = [ 4, 5, 6 ];
      state = reducer(state, handleFeaturedItemRemovalSuccess(1));
      expect(state.contentList).to.deep.equal([4, null, 6]);
    });
  });

  describe('HANDLE_FEATURED_ITEM_REMOVAL_ERROR', function() {
    it('sets isRemoving to false', function() {
      state.isRemoving = true;
      state = reducer(state, handleFeaturedItemRemovalError());
      expect(state.isRemoving).to.equal(false);
    });

    it('sets removePosition to null', function() {
      state.removePosition = 19;
      state = reducer(state, handleFeaturedItemRemovalError());
      expect(state.removePosition).to.equal(null);
    });

    it('sets hasRemoveError to true', function() {
      expect(state.hasRemoveError).to.equal(false);
      state = reducer(state, handleFeaturedItemRemovalError());
      expect(state.hasRemoveError).to.equal(true);
    });
  });
});
