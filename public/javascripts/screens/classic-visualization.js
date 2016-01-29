$(function() {
  'use strict';

  var $innerContainer = $('#renderTypeContainer');

  window.renderVisualization = function(viewObject) {
    // Dataset will modify the JSON blob passed into its constructor.
    // We want to insulate our caller from this.
    viewObject = _.cloneDeep(viewObject);
    var dataset = new Dataset(viewObject);

    // Clear out any errors that were shown.
    $('.missing-columns-warning').remove();
    // Clear out the last instance of RenderTypeManager.
    $innerContainer.empty();
    $innerContainer.data('renderTypeManager', null);

    $innerContainer.renderTypeManager({
      view: dataset,
      editEnabled: false
    });
  };

  $(document).ajaxError(function(event, xhr) {
    var missingColumnsError = /Cannot find column/.test(xhr.responseText);
    var notInDOM = $('.missing-columns-warning').length === 0;

    if (missingColumnsError && notInDOM) {
      var $missingColumns = $('<div>', {'class': 'missing-columns-warning'});

      $missingColumns.append(
        $('<div>', {'class': 'missing-columns-warning-message flash notice'}).
          append(
            $('<p>' + $.t('controls.charts.missing_column_html') + '</p>')
          )
        );

      $('body').append($missingColumns);
    }
  });
});
