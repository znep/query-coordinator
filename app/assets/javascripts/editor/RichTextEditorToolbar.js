;var RichTextEditorToolbar = (function() {

  'use strict';

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
  function RichTextEditorToolbar(element, formats) {

    if (!(element instanceof jQuery)) {
      throw new Error(
        '`element` must be a jQuery object (is of type ' +
        (typeof element) +
        ').'
      );
    }

    if (element.length === 0) {
      throw new Error(
        '`element` did not match any DOM nodes.'
      );
    }

    if (element.length > 1) {
      throw new Error(
        '`element` matches more than one DOM node.'
      );
    }

    if (!(formats instanceof Array)) {
      throw new Error(
        '`formats` must be an array (is of type ' +
        (typeof formats) +
        ').'
      );
    }

    var _element = element;
    var _formats = formats;
    var _showLinkPanel = false;
    var _linkPanelElement = null;
    var _toolbarLinkButton = null;
    var _formatController = null;

    _createToolbar();
    _createLinkPanel();

    /**
     * Public methods
     */

    this.link = function(editorFormatController) {

      _formatController = editorFormatController;

      _element.removeClass('dim');
    };

    this.unlink = function() {

      if (_formatController !== null) {
        _formatController.clearSelection();
      }

      _formatController = null;

      _element.addClass('dim');
      _element.removeClass('active').addClass('dim');
    };

    this.updateActiveFormats = function(activeFormats) {

      _element.find('.toolbar-btn').removeClass('active');

      if (activeFormats.length === 0) {

        _element.find('.toolbar-select').val('text');

      } else {

        _element.find('.toolbar-select').val('text');

        for (var i = 0; i < activeFormats.length; i++) {

          var thisFormat = activeFormats[i];

          if (thisFormat.dropdown === true) {
            _element.find('.toolbar-select').val(thisFormat.id);
          } else {
            _element.find('.toolbar-btn-' + thisFormat.id).addClass('active');
          }
        }
      }
    };

    this.destroy = function() {
      _element.remove();
      _linkPanelElement.remove();
    };

    /**
     * Private methods
     */

    function _createToolbar() {

      function _renderSelect(selectFormats) {

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

        return $('<div>', { 'class': 'toolbar-select-group' }).
          append($('<div>', { 'class': 'toolbar-select-container' }).
            append([
              $(
                '<select>',
                {
                  'class': 'toolbar-select inactive',
                  'data-editor-action': 'change-format'
                }
              ).append(selectFormatElements),
              $('<div>', { 'class': 'toolbar-select-hint' })
            ])
          );
      }

      function _renderButtonGroup(group) {

        var toolbarButtons = [];

        for (var i = 0; i < group.length; i++) {

          var buttonClass = 'toolbar-btn toolbar-btn-' +
            group[i].id +
            ' inactive';

          toolbarButtons.push(
            $(
              '<button>',
              {
                'class': buttonClass,
                'data-editor-action': 'toggle-format',
                'data-editor-command': group[i].id,
                'data-label': group[i].name
              }
            )
          );
        }

        return $('<div>', { 'class': 'toolbar-btn-group' }).
          append(toolbarButtons);
      }

      var dropdownFormats = _formats.
        filter(function(format) {
          return format.dropdown === true;
        });
      var buttonFormats = _formats.
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
        controls.push(_renderButtonGroup(buttonGroups[0]));
      }

      controls.push(_renderSelect(dropdownFormats));

      for (var i = 1; i < buttonGroups.length; i++) {
        controls.push(_renderButtonGroup(buttonGroups[i]));
      }

      _element.append(controls);

      // Finally, set up events and add the toolbar to the container.
      _element.on(
        'change',
        '[data-editor-action="change-format"]',
        _handleToolbarSelectChange
      );

      _element.on(
        'click',
        '[data-editor-action="toggle-format"]',
        _handleToolbarButtonClick
      );

      _element.addClass('dim');

      _toolbarLinkButton = _element.find('.toolbar-btn-link');
    }

    function _createLinkPanel() {

      var linkPanelElement = $(
        '<div>',
        { 'class':'create-link-panel' }
      );

      var linkInputElement = $('<div>').
        append([
          $(
            '<span>',
            { 'class': 'add-link-label' }
          ),
          $(
            '<input>',
            { 'class': 'link-panel-input', 'placeholder': 'http://www.socrata.com' }
          )
        ]);

      var addLinkButtonElement = $(
        '<button>',
        {
          'class': 'link-panel-btn add-link-btn',
          'data-editor-action': 'create-link',
          'data-editor-command': 'link'
        }
      );

      var cancelLinkButtonElement = $(
        '<button>',
        {
          'class': 'link-panel-btn cancel-link-btn',
          'data-editor-action': 'cancel-link'
        }
      );

      addLinkButtonElement.on('click', _handleLinkPanelAddClick);

      cancelLinkButtonElement.on('click', _handleLinkPanelCancelClick);

      linkPanelElement.hide();
      linkPanelElement.append(linkInputElement);
      linkPanelElement.append(addLinkButtonElement);
      linkPanelElement.append(cancelLinkButtonElement);

      _linkPanelElement = linkPanelElement;
      _element.append(linkPanelElement);
    }

    function _handleToolbarSelectChange(e) {

      if (_formatController !== null) {

        var command = e.target.value;

        _formatController.execute(command);
      }
    }

    function _handleToolbarButtonClick(e) {

      if (_formatController !== null) {

        var command = e.target.getAttribute('data-editor-command');

        if (command === 'link') {
          _handleLinkButtonClick();
        } else {
          _formatController.execute(command);
        }
      }
    }

    function _handleLinkButtonClick() {

      if (_formatController !== null) {

        if (_formatController.hasLink()) {
          _formatController.execute('removeLink');
        } else {
          _toggleLinkPanel();
        }
      }
    }

    function _handleLinkPanelAddClick(e) {

      if (_formatController !== null) {

        _formatController.execute('addLink', _getLinkPanelUrl());
        _linkPanelElement.find('input').val('');
        _toggleLinkPanel();
      }
    }

    function _handleLinkPanelCancelClick(e) {

      if (_formatController !== null) {

        _linkPanelElement.find('input').val('');
        _toggleLinkPanel();
      }
    }

    function _getLinkPanelUrl() {
      return _linkPanelElement.find('input').val();
    }

    function _toggleLinkPanel() {

      if (_showLinkPanel) {
        _showLinkPanel = false;
        _toolbarLinkButton.removeClass('active');
        _linkPanelElement.addClass('hidden');
      } else {
        _showLinkPanel = true;
        _toolbarLinkButton.addClass('active');
        _linkPanelElement.removeClass('hidden');
      }
    }
  }

  return RichTextEditorToolbar;
})();
