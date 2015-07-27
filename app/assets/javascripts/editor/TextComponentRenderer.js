;window.socrata.storyteller.TextComponentRenderer = (function(storyteller) {

  'use strict';

  var Util = storyteller.Util;
  var _componentTemplateRenderers = {
    'text': _renderTextComponentTemplate
  };
  var _componentDataRenderers = {
    'text': _renderTextComponentData
  };

  function _renderTemplate(componentOptions) {

    var type;

    Util.assertHasProperty(componentOptions, 'componentType');

    type = componentOptions.componentType;

    Util.assertHasProperty(_componentTemplateRenderers, type);

    return _componentTemplateRenderers[type](componentOptions);
  }

  function _renderData(element, data, editable, renderFn) {

    var type;
    var value;

    Util.assertHasProperties(data, 'type', 'value');
    Util.assertIsOneOfTypes(renderFn, 'function');

    type = data.type;
    value = data.value;

    Util.assertHasProperty(_componentDataRenderers, type);

    _componentDataRenderers[type](element, value, editable, renderFn);
  }

  /**
   * Component template renderers
   */

  function _renderTextComponentTemplate(componentOptions) {

    var editorId;
    var component;
    var editor;

    Util.assertHasProperties(
      componentOptions,
      'classes',
      'blockId',
      'componentIndex',
      'componentValue',
      'editable'
    );

    if (componentOptions.editable) {

      editorId = [
        componentOptions.blockId,
        '-',
        componentOptions.componentIndex
      ].join('');

      component = $(
        '<div>',
        {
          'class': componentOptions.classes + ' text-editor',
          'data-editor-id': editorId,
          'data-rendered-template': 'text'
        }
      );

      editor = storyteller.richTextEditorManager.createEditor(
        component,
        editorId,
        componentOptions.componentValue
      );

    } else {
      component = $(
        '<div>',
        {
          'class': componentOptions.classes
        }
      ).append(componentOptions.componentValue);
    }

    return component;
  }

  /**
   * Component data renderers
   */

  function _renderTextComponentData(element, value, editable, renderFn) {

    if (editable) {

      var editorId = element.attr('data-editor-id');
      var editor = storyteller.richTextEditorManager.getEditor(editorId);

      editor.setContent(value);

    } else {
      element.html(value);
    }
  }

  return {
    renderTemplate: _renderTemplate,
    renderData: _renderData
  };
})(window.socrata.storyteller);
