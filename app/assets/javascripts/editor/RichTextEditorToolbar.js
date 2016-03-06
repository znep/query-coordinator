import $ from 'jQuery';

import { dispatcher } from './Dispatcher';
import StorytellerUtils from '../StorytellerUtils';
import Actions from './Actions';
import Constants from './Constants';
import { richTextEditorColorStore } from './stores/RichTextEditorColorStore';

/**
 * The Formats configuration block is used by the RichTextEditorToolbar and
 * the RichTextEditorFormatController to specify which format options are
 * supported, how they should be displayed on the toolbar and what action
 * should be taken when they are executed.
 *
 * @constructor
 * @param {jQuery} element
 * @param {object[]} formats
 *   @property {string} id - The internal name of the operation that is
 *     associated with this format.
 *   @property {string} tag
 *   @property {string} name - The human-readable name that will appear
 *     as a tool-tip if the user hovers the cursor over the option or button.
 *   @property {boolean} dropdown - Whether or not this format should appear
 *     as an option in the block format select control. False indicates that
 *     the format should appear as a button.
 *   @property {number} [group] - The button group in which this format's
 *     button should appear.
 */
export var richTextEditorToolbar = new RichTextEditorToolbar(
  '#rich-text-editor-toolbar',
  Constants.RICH_TEXT_FORMATS
);
export default function RichTextEditorToolbar(selector, formats) {
  StorytellerUtils.assertInstanceOf(formats, Array);

  var element;
  var formatController = null;

  $(function() {
    element = $(selector);
    createToolbar();
    showToolbar();
    attachStoreListeners();
  });

  dispatcher.register(function(payload) {
    var action = payload.action;

    switch (action) {
      case Actions.RTE_TOOLBAR_UPDATE_ACTIVE_FORMATS:
        updateActiveFormats(payload);
        break;
    }
  });

  /**
   * Public methods
   */

  this.link = function(editorFormatController) {
    formatController = editorFormatController;

    element.removeClass('dim').addClass('active');
    element.find('.rich-text-editor-toolbar-select').prop('disabled', false);
  };

  this.unlink = function() {
    formatController = null;

    element.removeClass('active').addClass('dim');
    element.find('.rich-text-editor-toolbar-select').prop('disabled', true);
  };

  this.destroy = function() {
    detachEventListeners();
    detachStoreListeners();
    element.remove();
  };

  /**
   * Private methods
   */

  function attachStoreListeners() {
    richTextEditorColorStore.addChangeListener(updateTextColorPanel);
  }

  function detachStoreListeners() {
    richTextEditorColorStore.removeChangeListener(updateTextColorPanel);
  }

  function attachEventListeners() {
    element.on(
      'change',
      '[data-editor-action="change-format"]',
      handleToolbarSelectChange
    );

    element.on(
      'click',
      '[data-editor-action="toggle-format"]',
      handleToolbarButtonClick
    );

    element.on(
      'click',
      '[data-editor-action="toggle-panel"]',
      handleToolbarPanelToggle
    );

    element.on(
      'click',
      '[data-editor-command="textColor"]',
      handleColorSwatchClick
    );

    element.on(
      'input',
      '.rich-text-editor-toolbar-text-color-panel-color-input',
      handleCustomColorInput
    );

    element.on(
      'keyup',
      '.rich-text-editor-toolbar-text-color-panel-color-input',
      handleCustomColorInputEnter
    );

    element.on(
      'click',
      '.rich-text-editor-toolbar-text-color-panel-color-input',
      handleCustomColorClick
    );

    element.on(
      'click',
      '.rich-text-editor-toolbar-text-color-panel-active-custom-color-swatch',
      saveActiveCustomColor
    );
  }

  function detachEventListeners() {
    element.off(
      'change',
      '[data-editor-action="change-format"]',
      handleToolbarSelectChange
    );

    element.off(
      'click',
      '[data-editor-action="toggle-format"]',
      handleToolbarButtonClick
    );

    element.off(
      'click',
      '[data-editor-action="toggle-panel"]',
      handleToolbarPanelToggle
    );

    element.off(
      'click',
      '[data-editor-command="textColor"]',
      handleColorSwatchClick
    );

    element.off(
      'input',
      '.rich-text-editor-toolbar-text-color-panel-color-input',
      handleCustomColorInput
    );

    element.off(
      'keyup',
      '.rich-text-editor-toolbar-text-color-panel-color-input',
      handleCustomColorInputEnter
    );

    element.off(
      'click',
      '.rich-text-editor-toolbar-text-color-panel-color-input',
      handleCustomColorClick
    );

    element.off(
      'click',
      '.rich-text-editor-toolbar-text-color-panel-active-custom-color-swatch',
      saveActiveCustomColor
    );
  }

  function renderSelect(selectFormats) {
    var selectFormatElements = [];
    var option;

    for (var i = 0; i < selectFormats.length; i++) {
      option = $('<option>', { 'value': selectFormats[i].id });
      option.text(selectFormats[i].name);

      if (selectFormats[i].tag === null) {
        option.prop('selected', true);
      }

      selectFormatElements.push(option);
    }

    return $(
      '<div>',
      { 'class': 'rich-text-editor-toolbar-select-group' }
    ).
      append(
        $(
          '<div>',
          { 'class': 'rich-text-editor-toolbar-select-container' }
        ).
        append([
          $(
            '<select>',
            {
              'class': 'rich-text-editor-toolbar-select',
              'disabled': true,
              'data-editor-action': 'change-format'
            }
          ).append(selectFormatElements),
          $('<div>', { 'class': 'rich-text-editor-toolbar-select-hint' })
        ])
      );
  }

  function renderTextColorPanel() {
    var customColors = richTextEditorColorStore.getColors();
    var defaultColors = customColors.defaultColors;
    var savedCustomColors = customColors.savedCustomColors;
    var activeCustomColor = customColors.activeCustomColor;
    var $panel = $(
      '<div>',
      { 'class': 'rich-text-editor-toolbar-text-color-panel' }
    ).
    append(
      defaultColors.map(function(color) {
        return $(
          '<button>',
          {
            'class': 'rich-text-editor-toolbar-text-color-panel-color-swatch',
            'type': 'button',
            'style': 'background-color: ' + color + ';',
            'data-editor-command': 'textColor',
            'data-text-color': color
          }
        );
      })
    ).
    append(
      $('<hr />')
    ).
    append(
      savedCustomColors.
        map(function(color) {
          var options = {
            'class': 'rich-text-editor-toolbar-text-color-panel-custom-color-swatch',
            'type': 'button',
            'style': StorytellerUtils.format(
              'background-color: {0}',
              (color) ? color : 'transparent'
            )
          };

          if (color) {
            options['data-editor-command'] = 'textColor';
            options['data-text-color'] = color;
          }

          return $(
            '<button>',
            options
          );
        })
    ).
    append(
      $(
        '<div>',
        {
          'class': 'rich-text-editor-toolbar-text-color-panel-active-custom-color-container'
        }
      ).append([
        $(
          '<input>',
          {
            'class': 'rich-text-editor-toolbar-text-color-panel-color-input',
            'type': 'text',
            'placeholder': '#d3db3ef'
          }
        ),
        $(
          '<button>',
          {
            'class': 'rich-text-editor-toolbar-text-color-panel-active-custom-color-swatch',
            'type': 'button',
            'style': StorytellerUtils.format(
              'background-color: {0}',
              (activeCustomColor) ? activeCustomColor : 'transparent'
            )
          }
        )
      ])
    );

    return $panel;
  }

  function renderButtonGroup(group) {
    var toolbarButtons = [];
    var buttonClass;
    var buttonOptions;
    var $button;

    for (var i = 0; i < group.length; i++) {

      buttonClass = StorytellerUtils.format(
        '{0} {1}',
        'rich-text-editor-toolbar-btn',
        StorytellerUtils.format(
          'rich-text-editor-toolbar-btn-{0}',
          group[i].id
        )
      );
      buttonOptions = {
        'class': buttonClass,
        'data-editor-action': (group[i].panel) ? 'toggle-panel' : 'toggle-format',
        'data-label': group[i].name
      };

      if (!group[i].panel) {
        buttonOptions['data-editor-command'] = group[i].id;
      }

      $button = $(
        '<button>',
        buttonOptions
      );

      if (group[i].panel === true) {

        switch (group[i].id) {

          case 'textColor':
            $button.append([
              $(
                '<div>',
                {
                  'class': 'rich-text-editor-toolbar-text-color-swatch'
                }
              )
            ]);
            toolbarButtons.push(
              $(
                '<div>',
                {
                  'class': 'rich-text-editor-toolbar-btn-panel-group'
                }
              ).
                append([
                  $button,
                  renderTextColorPanel()
                ])
            );
            break;

          default:
            break;
        }
      } else {
        toolbarButtons.push($button);
      }
    }

    return $('<div>', { 'class': 'rich-text-editor-toolbar-btn-group' }).
      append(toolbarButtons);
  }

  function createToolbar() {
    var dropdownFormats = formats.
      filter(function(format) {
        return format.dropdown === true;
      });
    var buttonFormats = formats.
      filter(function(format) {
        return format.dropdown === false;
      });
    var buttonGroups = [];
    var controls = [];

    // Split buttons into button groups.
    buttonFormats.forEach(function(format) {

      if (format.group >= buttonGroups.length) {
        buttonGroups.push([]);
      }

      buttonGroups[format.group].push(format);
    });

    // Render the button groups and the format select.
    if (buttonGroups.length > 0) {
      controls.push(renderButtonGroup(buttonGroups[0]));
    }

    controls.push(renderSelect(dropdownFormats));

    for (var i = 1; i < buttonGroups.length; i++) {
      controls.push(renderButtonGroup(buttonGroups[i]));
    }

    element.append(controls);
    element.addClass('dim');

    // Finally, set up events and add the toolbar to the container.
    attachEventListeners();
  }

  function showToolbar() {
    element.addClass('visible');
  }

  function updateActiveFormats(payload) {
    StorytellerUtils.assertHasProperty(payload, 'activeFormats');

    var activeFormats = payload.activeFormats;
    var selectElement = element.find('.rich-text-editor-toolbar-select');

    element.find('.rich-text-editor-toolbar-btn').removeClass('active');

    if (activeFormats.length === 0) {
      selectElement.val('text');
    } else {
      selectElement.val('text');

      for (var i = 0; i < activeFormats.length; i++) {
        var thisFormat = activeFormats[i];

        if (thisFormat.dropdown === true) {
          selectElement.val(thisFormat.id);
        } else if (thisFormat.id === 'textColor') {
          if (!element.hasClass('dim')) {
            element.
              find('.rich-text-editor-toolbar-text-color-swatch').
              css('background-color', thisFormat.color);
          }
        } else {
          element.
            find('.rich-text-editor-toolbar-btn-' + thisFormat.id).
            addClass('active');
        }
      }
    }
  }

  function updateTextColorPanel() {
    var colors = richTextEditorColorStore.getColors();
    var defaultColors = colors.defaultColors;
    var activeCustomColor = colors.activeCustomColor;
    var savedCustomColors = colors.savedCustomColors;
    var $defaultColorSwatches = $(
      '.rich-text-editor-toolbar-text-color-panel-color-swatch'
    );
    var $savedCustomColorSwatches = $(
      '.rich-text-editor-toolbar-text-color-panel-custom-color-swatch'
    );
    var $activeCustomColorSwatch = $(
      '.rich-text-editor-toolbar-text-color-panel-active-custom-color-swatch'
    );

    $defaultColorSwatches.
      each(function(i, el) {
        var $el = $(el);
        var currentColor = $el.css('background-color');

        if (defaultColors[i] === null) {
          if (currentColor !== 'transparent') {
            $el.css('background-color', 'transparent');
            $el.removeAttr('data-editor-command');
            $el.removeAttr('data-text-color');
          }
        } else {
          if (currentColor !== defaultColors[i]) {
            $el.css('background-color', defaultColors[i]);
            $el.attr('data-editor-command', 'textColor');
            $el.attr('data-text-color', defaultColors[i]);
          }
        }
      });

    $savedCustomColorSwatches.
      each(function(i, el) {
        var $el = $(el);
        var currentColor = $el.css('background-color');

        if (savedCustomColors[i] === null) {
          if (currentColor !== 'transparent') {
            $el.css('background-color', 'transparent');
            $el.removeAttr('data-editor-command');
            $el.removeAttr('data-text-color');
          }
        } else {
          if (currentColor !== savedCustomColors[i]) {
            $el.css('background-color', savedCustomColors[i]);
            $el.attr('data-editor-command', 'textColor');
            $el.attr('data-text-color', savedCustomColors[i]);
          }
        }
      });

    if (activeCustomColor === null) {
      if ($activeCustomColorSwatch.css('background-color') !== 'transparent') {
        $activeCustomColorSwatch.css('background-color', 'transparent');
        $activeCustomColorSwatch.removeAttr('data-editor-command');
        $activeCustomColorSwatch.removeAttr('data-text-color');
      }
    } else {
      if ($activeCustomColorSwatch.css('background-color') !== activeCustomColor) {
        $activeCustomColorSwatch.css('background-color', activeCustomColor);
        $activeCustomColorSwatch.attr('data-editor-command', 'textColor');
        $activeCustomColorSwatch.attr('data-text-color', activeCustomColor);
      }
    }
  }

  function handleToolbarSelectChange(e) {
    var command = e.target.value;

    if (formatController !== null) {
      formatController.execute(command);
    }
  }

  function handleToolbarButtonClick(e) {
    var command = e.target.getAttribute('data-editor-command');

    if (formatController !== null) {
      formatController.execute(command);
    }
  }

  function handleToolbarPanelToggle(e) {
    if (
      !$('#rich-text-editor-toolbar').hasClass('dim') &&
      // We only want to trigger this on the parent button, not any
      // of its children (which will also trigger this event handler
      // when clicked).
      $(e.target).hasClass('rich-text-editor-toolbar-btn-textColor')
    ) {
      $(e.target).toggleClass('active');
    }
  }

  function handleColorSwatchClick(e) {
    var command = e.target.getAttribute('data-editor-command');
    var color = e.target.getAttribute('data-text-color');

    if (formatController !== null) {
      formatController.execute(command, color);
    }
  }

  function handleCustomColorInput(e) {

    var input = e.target.value;

    dispatcher.dispatch({
      action: Actions.RTE_TOOLBAR_UPDATE_ACTIVE_CUSTOM_COLOR,
      customColor: input
    });
  }

  function handleCustomColorInputEnter(e) {
    var colors = richTextEditorColorStore.getColors();

    // If the user has pressed 'Enter', attempt to set the active
    // custom color.
    if (e.keyCode === 13) {
      if (colors.activeCustomColor !== null) {
        formatController.execute('textColor', colors.activeCustomColor);
        saveActiveCustomColor();
      }
    }
  }

  function handleCustomColorClick() {
    $(this).select();
  }

  function saveActiveCustomColor() {
    dispatcher.dispatch({
      action: Actions.RTE_TOOLBAR_SAVE_ACTIVE_CUSTOM_COLOR
    });
  }
}
