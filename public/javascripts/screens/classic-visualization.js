$(function() {
  var $outerContainer = $('.outerContainer');
  var $innerContainer = $('#renderTypeContainer');

  window.renderVisualization = function(viewObject) {
    var dataset = new Dataset(viewObject);

    // Clear out the last instance of RenderTypeManager.
    $innerContainer.empty();
    $innerContainer.data('renderTypeManager', null);

    $innerContainer.renderTypeManager({
      view: dataset,
      editEnabled: false
    });
  };
});
