function TextEditorToolbar(element, formats) {

  function elementIsJQueryObject(el) {
    return el instanceof jQuery;
  }

  function elementIsDomNode(el) {
    // nodeType 1 is an ELEMENT_NODE.
    return el.hasOwnProperty('nodeType') && el.nodeType === 1;
  }

  var DEFAULT_FORMATS = [
    { id: 'heading1', tag: 'h2', name: 'Heading 1', dropdown: true },
    { id: 'heading2', tag: 'h3', name: 'Heading 2', dropdown: true },
    { id: 'heading3', tag: 'h4', name: 'Heading 3', dropdown: true },
    { id: 'heading4', tag: 'h5', name: 'Heading 4', dropdown: true },
    { id: 'text', tag: null, name: 'Paragraph', dropdown: true },
    { id: 'bold', tag: 'b', name: 'Bold', dropdown: false, group: 0 },
    { id: 'italic', tag: 'i', name: 'Italic', dropdown: false, group: 0 },
    { id: 'left', tag: 'p', name: 'Align Left', dropdown: false, group: 1 },
    { id: 'center', tag: 'p', name: 'Align Center', dropdown: false, group: 1 },
    { id: 'right', tag: 'p', name: 'Align Right', dropdown: false, group: 1 },
    { id: 'orderedList', tag: 'ol', name: 'Ordered List', dropdown: false, group: 2 },
    { id: 'unorderedList', tag: 'ul', name: 'Unordered List', dropdown: false, group: 2 },
    { id: 'blockquote', tag: 'blockquote', name: 'Block Quote', dropdown: false, group: 2 },
    { id: 'link', tag: 'a', name: 'Link', dropdown: false, group: 3 }
  ];
  var containerElement;

  if (!elementIsJQueryObject(element) && !elementIsDomNode(element)) {
    throw new Error(
      '`element` argument must be a jQuery object or a DOM element.'
    );
  }

  containerElement = $(element);

  if (containerElement.length === 0) {
    throw new Error(
      '`element` did not match any DOM nodes: $(element) is of length 0.'
    );
  }

  containerElement.addClass('dim');

  if (typeof formats === 'object') {
    this.formats = formats;
  } else {
    this.formats = DEFAULT_FORMATS;
  }

  this.element = containerElement;
  this.showLinkPanel = false;
  this.linkPanelElement = null;
  this.toolbarLinkButton = null;

  this.formatController = null;

  this.createToolbar();
  this.createLinkPanel();
}

TextEditorToolbar.prototype.createToolbar = function() {

  function renderSelect(selectFormats) {
    var html;

    // First add the format select dropdown.
    html = [
      '<div class="toolbar-select-group">',
        '<div class="toolbar-select-container">',
          '<select class="toolbar-select inactive" ',
            'data-editor-action="change-format">'
    ].
    join('');

    for (var i = 0; i < selectFormats.length; i++) {
      html += '<option value="{0}"{1}>{2}</option>'.
        format(
          selectFormats[i].id,
          (selectFormats[i].tag === null) ? ' selected="selected"' : '',
          selectFormats[i].name
        );
    }
    html += [
          '</select>',
          '<div class="toolbar-select-hint"></div>',
        '</div>',
      '</div>'
    ].join('');

    return html;
  }

  function renderButtonGroup(group) {
    var html;

    html = '<div class="toolbar-btn-group">';

    for (var i = 0; i < group.length; i++) {
      html += [
        '<button class="toolbar-btn toolbar-btn-{0} unselectable inactive" ',
          'data-editor-action="toggle-format" ',
          'data-editor-command="{0}" ',
          'data-label="{1}">',
        '</button>'
      ].
      join('').
      format(
        group[i].id,
        group[i].name
      );
    }

    html += '</div>';

    return html;
  }

  var dropdownFormats = this.formats.
    filter(function(format) {
      return format.dropdown === true;
    });
  var buttonFormats = this.formats.
    filter(function(format) {
      return format.dropdown === false;
    });
  var buttonGroups = [];
  var html;

  // Split buttons into button groups.
  buttonFormats.forEach(function(format) {
    if (format.group >= buttonGroups.length) {
      buttonGroups.push([]);
    }

    buttonGroups[format.group].push(format);
  });

  // Render the button groups and the format select.
  html = renderButtonGroup(buttonGroups[0]);
  this.element.append($(html));

  html = renderSelect(dropdownFormats);
  this.element.append($(html));

  for (var i = 1; i < buttonGroups.length; i++) {
    html = renderButtonGroup(buttonGroups[i]);
    this.element.append($(html));
  }

  // Finally, set up events and add the toolbar to the container.
  this.element.on(
    'change',
    '[data-editor-action="change-format"]',
    this.handleToolbarSelectChange.bind(this)
  );

  this.element.on(
    'click',
    '[data-editor-action="toggle-format"]',
    this.handleToolbarButtonClick.bind(this)
  );

  this.toolbarLinkButton = this.element.find('.toolbar-btn-link');
}

TextEditorToolbar.prototype.createLinkPanel = function() {

  var linkPanelElement = $('<div class="create-link-panel clearfix">');

  var linkInputElement = $(
    [
      '<span class="add-link-label"></span>',
      '<input class="link-panel-input" ',
        'placeholder="http://www.socrata.com">',
      '</input>'
    ].
    join('')
  );

  var addLinkButtonElement = $(
    [
      '<button class="link-panel-btn add-link-btn" ',
        'data-editor-action="create-link" ',
        'data-editor-command="link">',
      '</button>'
    ].
    join('').
    format(this.id)
  );

  var cancelLinkButtonElement = $(
    [
      '<button class="link-panel-btn cancel-link-btn" ',
        'data-editor-action="cancel-link">',
      '</button>',
    ].
    join('')
  );

  addLinkButtonElement.on(
    'click',
    this.handleLinkPanelAddClick.bind(this)
  );

  cancelLinkButtonElement.on(
    'click',
    this.handleLinkPanelCancelClick.bind(this)
  );

  linkPanelElement.hide();
  linkPanelElement.append(linkInputElement);
  linkPanelElement.append(addLinkButtonElement);
  linkPanelElement.append(cancelLinkButtonElement);

  this.linkPanelElement = linkPanelElement;
  this.element.append(linkPanelElement);
}

TextEditorToolbar.prototype.link = function(editorFormatController) {

  this.formatController = editorFormatController;

  this.element.removeClass('dim');
}

TextEditorToolbar.prototype.unlink = function() {

  if (this.formatController !== null) {
    this.formatController.clearSelection();
  }

  this.formatController = null;

  this.element.addClass('dim');
  this.element.removeClass('active').addClass('dim');
}

TextEditorToolbar.prototype.updateActiveFormats = function(activeFormats) {

  this.element.find('.toolbar-btn').removeClass('active');

  if (activeFormats.length === 0) {

    this.element.find('.toolbar-select').val('text');

  } else {

    this.element.find('.toolbar-select').val('text');

    for (var i = 0; i < activeFormats.length; i++) {

      var thisFormat = activeFormats[i];

      if (thisFormat.dropdown === true) {
        this.element.find('.toolbar-select').val(thisFormat.id);
      } else {
        this.element.find('.toolbar-btn-' + thisFormat.id).addClass('active');
      }
    }
  }
}

TextEditorToolbar.prototype.handleToolbarSelectChange = function(e) {

  if (this.formatController !== null) {

    var command = e.target.value;

    this.formatController.execute(command);
  }
}

TextEditorToolbar.prototype.handleToolbarButtonClick = function(e) {

  if (this.formatController !== null) {

    var command = e.target.getAttribute('data-editor-command');

    if (command === 'link') {
      this.handleLinkButtonClick();
    } else {

      this.formatController.execute(command);
    }
  }
}

TextEditorToolbar.prototype.handleLinkButtonClick = function() {

  if (this.formatController !== null) {

    if (this.formatController.hasLink()) {

      this.formatController.execute('removeLink');

    } else {
      this.toggleLinkPanel();
    }
  }
}

TextEditorToolbar.prototype.handleLinkPanelAddClick = function(e) {

  if (this.formatController !== null) {

    this.formatController.execute('addLink', this.getLinkPanelUrl());

    this.linkPanelElement.find('input').val('');
    this.toggleLinkPanel();
  }
}

TextEditorToolbar.prototype.handleLinkPanelCancelClick = function(e) {

  if (this.formatController !== null) {
    this.linkPanelElement.find('input').val('');
    this.toggleLinkPanel();
  }
}

TextEditorToolbar.prototype.getLinkPanelUrl = function() {
  return this.linkPanelElement.find('input').val();
}

TextEditorToolbar.prototype.toggleLinkPanel = function() {

  if (this.showLinkPanel) {
    this.showLinkPanel = false;
    this.toolbarLinkButton.removeClass('active');
    this.linkPanelElement.addClass('hidden');
  } else {
    this.showLinkPanel = true;
    this.toolbarLinkButton.addClass('active');
    this.linkPanelElement.removeClass('hidden');
  }
}

TextEditorToolbar.prototype.destroy = function() {

  this.element.remove();
  this.linkPanelElement.remove();
}
