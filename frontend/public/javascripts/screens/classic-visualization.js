$(function() {
  var $innerContainer = $('#renderTypeContainer');

  function renderMissingColumnMessage() {
    var $missingColumns;
    var notInDOM = $('.missing-columns-warning').length === 0;

    if (notInDOM) {
      $missingColumns = $('<div>', {
        'class': 'missing-columns-warning'
      });
      $missingColumns.append(
        $('<div>', {
          'class': 'missing-columns-warning-message flash notice'
        }).append(
          $('<p>' + $.t('controls.charts.missing_column_html') + '</p>')
        )
      );

      $('body').append($missingColumns);
    }
  }

  function renderMissingDatasetMessage() {
    var $missingDatasetError;
    var notInDOM = $('.missing-dataset-error').length === 0;

    if (notInDOM) {
      $missingDatasetError = $('<div>', {
        'class': 'missing-dataset-error'
      });
      $missingDatasetError.append(
        $('<div>', {
          'class': 'missing-dataset-error-message flash error'
        }).append(
          $('<p>' + $.t('controls.charts.inaccessible') + '</p>')
        )
      );

      $('body').append($missingDatasetError);
    }
  }

  /**
   * renderVisualization expects a static, valid /api/views
   * view metadata object. If that object is malformed or outdated,
   * the visualization may not render successfully.
   */
  window.renderVisualization = function(viewObject) {
    if (viewObject.id) {

      // Dataset will modify the JSON blob passed into its constructor.
      // We want to insulate our caller from this.
      viewObject = _.cloneDeep(viewObject);
      var dataset = createDatasetFromView(viewObject);

      // Clear out any errors that were shown.
      $('.missing-columns-warning, .missing-dataset-error').remove();

      // Clear out the last instance of RenderTypeManager.
      $innerContainer.
      empty().
      data('renderTypeManager', null).
      renderTypeManager({
        view: dataset,
        editEnabled: false,
        deoptimizeRender: true, // see EN-17277 and forgive me
        hideDividers: true
      });
    } else {
      renderMissingDatasetMessage();
    }
  };

  $(document).ajaxError(function(event, xhr) {
    var isMissingColumnsError = /Cannot find column/.test(xhr.responseText);

    if (isMissingColumnsError) {
      renderMissingColumnMessage();
    }
  });
});
