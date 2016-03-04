(function(root) {
  'use strict';

  var socrata = root.socrata;
  var storyteller = socrata.storyteller;
  var utils = socrata.utils;

  function RichTextEditorColorStore() {
    _.extend(this, new storyteller.Store());

    var self = this;
    var defaultColors = ['#000000', '#666666', '#ffffff', null, null];
    var savedCustomColors = [null, null, null, null, null];
    var activeCustomColor = null;

    this.register(function(payload) {

      var action = payload.action;

      switch (action) {

        case Actions.STORY_CREATE:
        case Actions.STORY_UPDATE_THEME:
          updateDefaultColors(
            storyteller.storyStore.getStoryTheme(storyteller.userStoryUid)
          );
          break;

        case Actions.RTE_TOOLBAR_UPDATE_ACTIVE_CUSTOM_COLOR:
          updateActiveCustomColor(payload);
          break;

        case Actions.RTE_TOOLBAR_SAVE_ACTIVE_CUSTOM_COLOR:
          saveActiveCustomColor();
          break;
      }
    });

    /**
     * Public Methods
     */

    this.getColors = function() {

      return {
        defaultColors: defaultColors,
        savedCustomColors: savedCustomColors,
        activeCustomColor: activeCustomColor
      };
    };

    /**
     * Private methods
     */

    function updateDefaultColors(themeId) {
      /* eslint-disable camelcase */

      utils.assertIsOneOfTypes(themeId, 'string');

      var currentThemeObj = null;

      currentThemeObj = _.find(defaultThemes.themes, { id: themeId });

      // If we haven't found a matching theme in the defaults, look in the
      // custom themes. Note that although we match against the `id` property
      // for default themes, we match against the `class_name` property for
      // custom themes.
      if (!currentThemeObj) {
        currentThemeObj = _.find(customThemes, { class_name: themeId });
      }

      if (
        currentThemeObj &&
        currentThemeObj.hasOwnProperty('css_variables')
      ) {

        if (currentThemeObj.css_variables.hasOwnProperty('$heading-type-color')) {
          defaultColors[3] = currentThemeObj.css_variables['$heading-type-color'];
        }

        if (currentThemeObj.css_variables.hasOwnProperty('$default-type-color')) {
          defaultColors[4] = currentThemeObj.css_variables['$default-type-color'];
        }
      }

      self._emitChange();

      /* eslint-enable camelcase */
    }

    function isValidColor(color) {
      var colorCodeIsValid = false;
      var colorCode;

      if (typeof color === 'string') {

        colorCode = color.
          toLowerCase().
          replace(/#/gi, '');

        // If the length is not 3 (shorthand) and not 6, then assume it is invalid.
        // It's probably not technically invalid, but the logic to correctly expand
        // it seems unsuitable for a first pass.
        if (colorCode.length === 3 || colorCode.length === 6) {

          // If we remove any non-valid hex characters and the length differs, then
          // the original input wasn't a valid hex color code.
          if (colorCode.replace(/[^0-9abcdef]/gi, '').length === colorCode.length) {

            colorCodeIsValid = true;
          }
        }
      }

      return colorCodeIsValid;
    }

    function updateActiveCustomColor(payload) {
      var customColor = payload.customColor;

      if (isValidColor(customColor)) {
        activeCustomColor = '#{0}'.format(customColor.replace(/#/gi, ''));
      } else {
        activeCustomColor = null;
      }

      self._emitChange();
    }

    function saveActiveCustomColor() {

      if (activeCustomColor !== null) {

        savedCustomColors.unshift(activeCustomColor);
        savedCustomColors.length = 5;
      }

      self._emitChange();
    }
  }

  root.socrata.storyteller.RichTextEditorColorStore = RichTextEditorColorStore;
})(window);
