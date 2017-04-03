import Constants from './Constants';
import RichTextEditor from './RichTextEditor';
import StorytellerUtils from '../StorytellerUtils';
import RichTextEditorToolbar, { richTextEditorToolbar } from './RichTextEditorToolbar';

export var richTextEditorManager = StorytellerUtils.export(
  new RichTextEditorManager(richTextEditorToolbar, Constants.RICH_TEXT_FORMATS),
  'storyteller.richTextEditorManager'
);

export default function RichTextEditorManager(toolbar, formats) {
  StorytellerUtils.assertInstanceOf(toolbar, RichTextEditorToolbar);
  StorytellerUtils.assertInstanceOf(formats, Array);

  var _formats = formats;
  var _toolbar = toolbar;
  var _editors = {};

  this.createEditor = function(element, editorId, contentToPreload) {
    _editors[editorId] = new RichTextEditor(element, editorId, _formats, contentToPreload);

    return _editors[editorId];
  };

  this.getEditor = function(editorId) {
    var editor = null;

    if (_editors.hasOwnProperty(editorId)) {
      editor = _editors[editorId];
    }

    return editor;
  };

  this.getAllEditors = function() {
    return _editors;
  };

  this.deleteEditor = function(editorId) {
    _editors[editorId].destroy();

    delete _editors[editorId];
  };

  this.linkToolbar = function(editorId) {
    _toolbar.link(this.getEditor(editorId).getFormatController());
  };

  this.unlinkToolbar = function() {
    _toolbar.unlink();
  };
}
