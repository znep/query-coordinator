(function(root) {

  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function Autosave(storyUid, opts) {
    var defaultOptions = {
      disableOnFail: false,
      debouncePeriod: storyteller.config.autosaveDebounceTimeInSeconds
    };
    var options = _.merge(defaultOptions, opts);
    var self = this;
    var _autosaveDisabled = false;
    var _debouncedSave;

    this.enable = function() {
      _autosaveDisabled = false;
    };

    this.disable = function() {
      _autosaveDisabled = true;
    };

    function triggerSave() {
      if (_autosaveDisabled) {
        return;
      }

      var storySaveIsPossible = storyteller.storySaveStatusStore.isStorySavePossible();
      if (storySaveIsPossible) {
        var savePromise = storyteller.StoryDraftCreator.saveDraft(storyUid);
        if (options.disableOnFail) {
          savePromise.fail(self.disable);
        }
      }
    }

    /**
     * Re-creates the debounced saving function according to the timeout.
     *
     * @param {number|moment.duration} - seconds to wait before saving a change.
     *                                   or moment.duration(number, unit),
     */
    this.setDebouncePeriod = function(inSeconds) {
      if (window.moment && window.moment.isDuration(inSeconds)) {
        options.debouncePeriod = inSeconds.asSeconds();
      } else {
        utils.assertIsOneOfTypes(inSeconds, 'number');
        options.debouncePeriod = inSeconds;
      }

      if (_.isFunction(_debouncedSave)) {
        storyteller.storyStore.removeChangeListener(_debouncedSave);
      }

      _debouncedSave = _.debounce(
        triggerSave,
        options.debouncePeriod * 1000
      );
      storyteller.storyStore.addChangeListener(_debouncedSave);
    };

    this.setDebouncePeriod(options.debouncePeriod);
  }

  storyteller.Autosave = Autosave;

})(window);
