import { getDefaultStore } from 'testStore';
import reducer from 'reducers/featuredContent';
import {
  addFeaturedItem,
  editFeaturedItem,
  cancelFeaturedItemEdit,
  requestedFeaturedItemSave,
  handleFeaturedItemSaveSuccess,
  handleFeaturedItemSaveError,
  setExternalResourceField
} from 'actions/featuredContent';

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

    it('sets editPosition to one less than the position of the featured item', function() {
      var featuredItem = {
        contentType: 'external',
        position: 2
      };

      expect(state.editPosition).to.equal(null);
      state = reducer(state, editFeaturedItem(featuredItem));
      expect(state.editPosition).to.equal(1);
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

    it('sets hasError to false', function() {
      state.hasError = true;
      state = reducer(state, cancelFeaturedItemEdit());
      expect(state.hasError).to.equal(false);
    });
  });

  describe('REQUESTED_FEATURED_ITEM_SAVE', function() {
    it('sets isSaving to true', function() {
      expect(state.isSaving).to.equal(false);
      state = reducer(state, requestedFeaturedItemSave());
      expect(state.isSaving).to.equal(true);
    });

    it('sets hasError to false', function() {
      state.hasError = true;
      state = reducer(state, requestedFeaturedItemSave());
      expect(state.hasError).to.equal(false);
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

    it('sets hasError to true', function() {
      state.hasError = false;
      state = reducer(state, handleFeaturedItemSaveError());
      expect(state.hasError).to.equal(true);
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
});
