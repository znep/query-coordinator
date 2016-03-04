import $ from 'jQuery';
import _ from 'lodash';

import I18nMocker from '../I18nMocker';
import Store from '../../../app/assets/javascripts/editor/stores/Store';
import StorytellerUtils from '../../../app/assets/javascripts/StorytellerUtils';
import {__RewireAPI__ as StoryPublicationStatusAPI} from '../../../app/assets/javascripts/editor/components/StoryPublicationStatus';

describe('storyPublicationStatus jQuery plugin', function() {

  var $button;
  var mockStore;

  beforeEach(function() {
    $button = $('<button>');

    function MockStore() {
      var self = this;
      var _isDirty = false;
      var _isPublic = false;
      var _currentDigest = 'unpublished';

      _.extend(this, new Store());

      this.mockIsStoryDirty = function(isDirty) {
        _isDirty = isDirty;
        self._emitChange();
      };

      this.mockIsStoryPublic = function(isPublic) {
        _isPublic = isPublic;
        self._emitChange();
      };

      this.mockIsDraftDiverged = function(isDiverged) {
        _currentDigest = isDiverged ? 'unpublished' : 'published';
        self._emitChange();
      };

      this.isStoryDirty = function() { return _isDirty; };
      this.getStoryPermissions = function() { return { isPublic: _isPublic }; };
      this.getStoryPublishedStory = _.constant({ digest: 'published' });
      this.getStoryDigest = function() { return _currentDigest; };
    }

    mockStore = new MockStore();
    StoryPublicationStatusAPI.__Rewire__('storySaveStatusStore', mockStore);
    StoryPublicationStatusAPI.__Rewire__('storyStore', mockStore);
    StoryPublicationStatusAPI.__Rewire__('I18n', I18nMocker);
  });

  afterEach(function() {
    StoryPublicationStatusAPI.__ResetDependency__('storySaveStatusStore');
    StoryPublicationStatusAPI.__ResetDependency__('storyStore');
    StoryPublicationStatusAPI.__ResetDependency__('I18n');
  });

  it('should return a jQuery object for chaining', function() {
    var returnValue = $button.storyPublicationStatus();
    assert.instanceOf(returnValue, jQuery);
  });

  describe('instance', function() {
    beforeEach(function() {
      $button.storyPublicationStatus({ savedMessageTimeout: 10 });
    });

    describe('button text', function() {
      function textFor(status) {
        return StorytellerUtils.format(
          'Translation for: editor.settings_panel.publishing_section.status.{0}',
          status
        );
      }

      it('should mirror the story save state', function() {

        // If story is unpublished, then text is ALWAYS draft.
        mockStore.mockIsStoryPublic(false);
        mockStore.mockIsStoryDirty(false);
        mockStore.mockIsDraftDiverged(false);
        assert.equal($button.text(), textFor('draft'), 'clean unpublished story');

        mockStore.mockIsStoryPublic(false);
        mockStore.mockIsStoryDirty(true);
        mockStore.mockIsDraftDiverged(false);
        assert.equal($button.text(), textFor('draft'), 'dirty unpublished story');

        mockStore.mockIsStoryPublic(false);
        mockStore.mockIsStoryDirty(false);
        mockStore.mockIsDraftDiverged(true);
        assert.equal($button.text(), textFor('draft'), 'diverged unpublished story');

        mockStore.mockIsStoryPublic(false);
        mockStore.mockIsStoryDirty(true);
        mockStore.mockIsDraftDiverged(true);
        assert.equal($button.text(), textFor('draft'), 'dirty diverged unpublished story');

        // Only if published, not dirty, not diverged, should it say published.
        mockStore.mockIsStoryPublic(true);
        mockStore.mockIsStoryDirty(false);
        mockStore.mockIsDraftDiverged(false);
        assert.equal($button.text(), textFor('published'), 'clean published story');

        mockStore.mockIsStoryPublic(true);
        mockStore.mockIsStoryDirty(true);
        mockStore.mockIsDraftDiverged(false);
        assert.equal($button.text(), textFor('draft'), 'dirty published story');

        mockStore.mockIsStoryPublic(true);
        mockStore.mockIsStoryDirty(false);
        mockStore.mockIsDraftDiverged(true);
        assert.equal($button.text(), textFor('draft'), 'diverged published story');

        mockStore.mockIsStoryPublic(true);
        mockStore.mockIsStoryDirty(true);
        mockStore.mockIsDraftDiverged(true);
        assert.equal($button.text(), textFor('draft'), 'dirty diverged published story');
      });
    });
  });
});

