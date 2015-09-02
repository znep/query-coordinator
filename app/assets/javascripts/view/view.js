$(document).on('ready', function() {
  'use strict';

  var storyteller = window.socrata.storyteller;
  storyteller.flyoutRenderer = new storyteller.FlyoutRenderer();

  // Init visualizations
  $('[data-component-data]').each(function(index) {
    var $this = $(this);

    $this.componentSocrataVisualizationColumnChart(
      JSON.parse($this.attr('data-component-data'))
    )
  });
});
