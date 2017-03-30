(function() {
  var selector = '{0}';
  var element = document.querySelector(selector);
  var selection = window.getSelection();
  var range = document.createRange();

  range.selectNode(element);
  selection.removeAllRanges();
  selection.addRange(range);

  return selection.toString();
})();
