$(function() {
  var $outerContainer = $('.outerContainer');
  var $innerContainer = $('#renderTypeContainer');

  window.renderVisualization = function(viewObject) {
    // Dataset will modify the JSON blob passed into its constructor.
    // We want to insulate our caller from this.
    viewObject = _.cloneDeep(viewObject);
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
