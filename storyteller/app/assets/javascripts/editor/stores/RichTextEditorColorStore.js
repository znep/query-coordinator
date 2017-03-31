import _ from 'lodash';

import Actions from '../Actions';
import StorytellerUtils from '../../StorytellerUtils';
import Environment from '../../StorytellerEnvironment';
import Store from './Store';
import { storyStore } from './StoryStore';

export var richTextEditorColorStore = new RichTextEditorColorStore();
export default function RichTextEditorColorStore() {
  _.extend(this, new Store());

  var self = this;
  var defaultColors = [null, null, '#fff', '#666', '#D2160A'];
  var savedCustomColors = [null, null, null, null, null];
  var activeCustomColor = null;

  this.register(function(payload) {
    var action = payload.action;

    switch (action) {
      case Actions.STORY_CREATE:
      case Actions.STORY_UPDATE_THEME:
        updateDefaultColors(
          storyStore.getStoryTheme(Environment.STORY_UID)
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
    StorytellerUtils.assertIsOneOfTypes(themeId, 'string');

    if (_.startsWith(themeId, 'custom-')) {
      themeId = parseInt(_.trimStart(themeId, 'custom-'), 10);
    }

    var defaultThemes = Environment.DEFAULT_THEMES.themes;
    var customThemes = Environment.CUSTOM_THEMES;

    var themes = defaultThemes.concat(customThemes);
    var currentThemeObj = _.find(themes, { id: themeId });

    if (_.has(currentThemeObj, 'css_variables')) {
      var cssVariables = currentThemeObj['css_variables'];

      if (cssVariables.hasOwnProperty('$heading-type-color')) {
        defaultColors[0] = cssVariables['$heading-type-color'];
      }

      if (cssVariables.hasOwnProperty('$default-type-color')) {
        defaultColors[1] = cssVariables['$default-type-color'];
      }
    }

    self._emitChange();
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
      activeCustomColor = StorytellerUtils.format('#{0}', customColor.replace(/#/gi, ''));
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
