var editor = '.block-edit:nth-child({0}) .component-html';
var editorId = document.querySelector(editor).getAttribute('data-editor-id');
window.storyteller.richTextEditorManager.linkToolbar(editorId);
