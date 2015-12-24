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

    // Autosave can be disabled from a URL parameter: autosave.
    // For example: https://example.com?autosave=false
    var _forceDisabled = utils.queryParameters().some(function(parameter) {
      return parameter[0] === 'autosave' && parameter[1] === 'false';
    });

    this.enable = function() {
      _autosaveDisabled = false;
    };

    this.disable = function() {
      _autosaveDisabled = true;
    };

    function triggerSave() {
      if (_autosaveDisabled || _forceDisabled) {
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
      storyteller.userSessionStore.addChangeListener(function() {
        // When the session is re-established, trigger autosave
        // and re-enable (the autosave was likely disabled due
        // to persistent errors caused by expired sessions).
        if (storyteller.userSessionStore.hasValidSession()) {
          if (options.disableOnFail) {
            self.enable();
          }
          triggerSave();
        }
      });
    };

    this.setDebouncePeriod(options.debouncePeriod);
  }

  storyteller.Autosave = Autosave;

})(window);
