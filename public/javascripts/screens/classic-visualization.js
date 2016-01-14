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

  $(document).ajaxError(function(event, xhr) {
    var missingColumnsError = /Cannot find column/.test(xhr.responseText);
    var notInDOM = $('.missing-columns-warning').length === 0;

    if (missingColumnsError && notInDOM) {
      var _$missingColumns = $('<div>', {'class': 'missing-columns-warning'});

      _$missingColumns.append(
        $('<div>', {'class': 'missing-columns-warning-message flash notice'}).
          append(
            $('<p>' + $.t('controls.charts.missing_column_html') + '</p>'),
            $('<p>').append(
              $('<small>(' + xhr.responseText + ')</small>')
            )
          )
        );

      $('body').append(_$missingColumns);
    }
  });
});
