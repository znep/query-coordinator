var rowEditorHelpers = require('./row_editor_helpers');

module.exports = function(options) {

  function renderRowFields(columnsToRender, valuesToRender) {
    function throwError(dataTypeName) {
      throw new Error(
        'Encountered unexpected column dataTypeName "' +
        dataTypeName +
        '" when attempting to render column fields.'
      );
    }

    return columnsToRender.map(function(column, i) {
      var value = (valuesToRender) ? valuesToRender[i] : null;
      var inputLineRendererForDataType = _.get(
        rowEditorHelpers,
        ['dataTypes', column.dataTypeName, 'inputLineRenderer'],
        function() { return throwError(column.dataTypeName); }
      );

      return inputLineRendererForDataType.apply(null, [column, value]);
    });
  }

  function renderRowEditor(viewId, rowId, columnsToRender, valuesToRender) {
    var title = (rowId) ?
      $.t('controls.grid_view_row_editor.title_edit') :
      $.t('controls.grid_view_row_editor.title_append');
    var optionalDeleteButton = (rowId) ?
        (
          '<button class="delete">' +
            $.t('controls.grid_view_row_editor.controls.delete') +
          '</button>'
        ) :
        '';
    var rowEditorHtml =
      '<div id="grid-view-row-editor">' +
        '<div class="overlay"></div>' +
        '<div class="modal">' +
          '<div class="header">' +
            '<span class="socrata-icon-edit"></span>' +
            '<h2 id="column-name">' +
              title +
            '</h2>' +
            '<button class="cancel">' +
              '<span class="socrata-icon-close-2"></span>' +
            '</button>' +
          '</div>' +
          '<div class="row-header">' +
            '<span class="column-name">Column name</span>' +
            '<span class="column-value">Column value(s)</span>' +
            '<span class="column-is-null">(No value)</span>' +
          '</div>' +
          '<div class="row-container">' +
          '</div>' +
          '<div class="controls">' +
            optionalDeleteButton +
            '<button class="cancel">' +
              $.t('controls.grid_view_row_editor.controls.cancel') +
            '</button>' +
            '<button class="save">' +
              $.t('controls.grid_view_row_editor.controls.save') +
            '</button>' +
          '</div>' +
          '<div class="loadingSpinnerContainer hidden">' +
            '<div class="loadingSpinner"></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Render modal skeleton
    var $rowEditor = $(rowEditorHtml);
    var $rowContainer = $rowEditor.find('.row-container');

    $rowContainer.append.apply($rowContainer, renderRowFields(columnsToRender, valuesToRender));

    return $rowEditor;
  }

  function updateColumnValues() {
    columnValues = $editor.find('.input-line').toArray().map(function(inputLine, i) {
      var $inputLine = $(inputLine);
      var column = columns[i];

      return {
        column: column,
        value: _.get(rowEditorHelpers, ['dataTypes', column.dataTypeName, 'inputLineGetter'], _.noop)($inputLine)
      };
    });
  }

  function validateColumnValues() {
    function throwError(column) {
      throw new Error(
        'Encountered unexpected column dataTypeName "' +
        column.dataTypeName +
        '" when attempting to validate column value.'
      );
    }

    columnValues.forEach(function(columnValue) {
      var validator = _.get(
        rowEditorHelpers,
        ['dataTypes', columnValue.column.dataTypeName, 'validator'],
        function() { return throwError(columnValue.column); }
      );

      columnValue.isValid = validator.apply(null, [columnValue]);
    });
  }

  function updateModal() {

    updateColumnValues();
    validateColumnValues();

    var invalidColumnValues = columnValues.filter(function(columnValue) {
      return !columnValue.isValid;
    });

    if (invalidColumnValues.length === 0) {
      $editor.find('.save').attr('disabled', false);
      $editor.find('.input-line').removeClass('invalid');
      return;
    }

    $editor.find('.save').attr('disabled', true);
    $editor.find('.input-line').removeClass('invalid');

    invalidColumnValues.forEach(function(invalidColumnValue) {

      $editor.find(
        '.input-line[data-column-field-name="' +
        invalidColumnValue.column.fieldName +
        '"]'
      ).addClass('invalid');
    });
  }

  function createNewOBERow() {
    /**
     * How to create a new row in the OBE:
     *
     * 1. POST to /views/ij2u-iwtx/rows.json to provision a new row.
     *    The row's unique id will come back in the response to this request (we need
     *    the 'uuid' of the row in order to do anything useful).
     * 2. POST to /views/<four-four>/rows/<row uuid>.json to add the actual data to the row.
     */

    function onProvisionRowSuccess(data) {
      var rowUUID = _.get(data, '_uuid', null);

      if (_.isNull(rowUUID)) {
        throw new Error('Could not create row: row provision request did not return a row UUID');
      }

      var payload = JSON.stringify(rowEditorHelpers.formatColumnValuesForOBE(columnValues));
      var updateRowAjaxOptions = {
        url: '/views/' + window.blist.dataset.id + '/rows/' + rowUUID + '.json',
        type: 'PUT',
        contentType: 'application/json',
        data: payload,
        dataType: 'json',
        success: function() {
          window.location.reload(true);
        },
        error: function() {
          $editor.find('.loadingSpinnerContainer').addClass('hidden');
          alert(
            $.t('controls.grid_view_row_editor.error.save')
          );
          $editor.find('.controls').find('button').attr('disabled', false);
        }
      };
      $.ajax(updateRowAjaxOptions);
    }

    var provisionRowAjaxOptions = {
      url: '/views/' + window.blist.dataset.id + '/rows.json',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({}),
      dataType: 'json',
      success: onProvisionRowSuccess,
      error: function() {
        $editor.find('.loadingSpinnerContainer').addClass('hidden');
        alert(
          $.t('controls.grid_view_row_editor.error.save')
        );
        $editor.find('.controls').find('button').attr('disabled', false);
      }
    };

    $editor.find('.loadingSpinnerContainer').removeClass('hidden');
    $editor.find('button').attr('disabled', true);

    $.ajax(provisionRowAjaxOptions);
  }

  function attachRowEditorEvents() {
    var $cancel = $editor.find('.overlay, .cancel');
    var $save = $editor.find('.save');
    var $delete = $editor.find('.delete');

    $cancel.on('click', function() {

      if (confirm($.t('controls.grid_view_row_editor.close_without_saving'))) {
        $editor.find('input').DatePickerRemove(); // eslint-disable-line new-cap
        $editor.remove();
      }
    });

    $save.on('click', function() {
      var isNewRow = (_.isEmpty(options.row.id) && _.isEmpty(options.row.data));
      var isOBE = !window.blist.dataset.newBackend;
      var url;
      var method;
      var payload;

      if (isOBE && isNewRow) {
        // This is a two-step process, so drop out of this flow in order to handle
        // this case on its own.
        createNewOBERow();
        return;
      }

      if (isOBE) {

        url = '/views/' + window.blist.dataset.id + '/rows/' + options.row.id + '.json';
        method = 'PUT';
        payload = JSON.stringify(rowEditorHelpers.formatColumnValuesForOBE(columnValues));
      } else {

        url = '/api/id/' + window.blist.dataset.id + '.json';
        method = 'POST';
        payload = rowEditorHelpers.formatColumnValuesForNBE(columnValues);

        if (!isNewRow) {
          _.set(payload, ':id', options.row.id);
        }

        payload = JSON.stringify(payload);
      }

      var ajaxOptions = {
        url: url,
        type: method,
        contentType: 'application/json',
        data: payload,
        dataType: 'json',
        success: function() {
          window.location.reload(true);
        },
        error: function() {
          $editor.find('.loadingSpinnerContainer').addClass('hidden');
          alert(
            $.t('controls.grid_view_row_editor.error.save')
          );
          $editor.find('.controls').find('button').attr('disabled', false);
        }
      };

      $editor.find('.loadingSpinnerContainer').removeClass('hidden');
      $editor.find('button').attr('disabled', true);

      $.ajax(ajaxOptions);
    });

    $delete.on('click', function() {

      if (confirm($.t('controls.grid_view_row_editor.controls.delete_confirm'))) {
        var isOBE = !window.blist.dataset.newBackend;
        var url;
        var method;
        var payload;

        if (isOBE) {
          url = '/views/' + window.blist.dataset.id + '/rows/' + options.row.id + '.json';
          method = 'DELETE';
          payload = JSON.stringify(
            {
              ':deleted': true,
              ':id': options.row.id
            }
          );
        } else {
          url = '/api/id/' + window.blist.dataset.id + '.json';
          method = 'POST';
          payload = JSON.stringify(
            [
              {
                ':deleted': true,
                ':id': options.row.id
              }
            ]
          );
        }

        var ajaxOptions = {
          url: url,
          type: method,
          contentType: 'application/json',
          data: payload,
          dataType: 'json',
          success: function() {
            window.location.reload(true);
          },
          error: function() {
            alert(
              $.t('controls.grid_view_row_editor.error.delete')
            );
            $editor.find('button').attr('disabled', false);
            $editor.find('.loadingSpinnerContainer').addClass('hidden');
          }
        };

        $editor.find('.loadingSpinnerContainer').removeClass('hidden');
        $editor.find('button').attr('disabled', true);

        $.ajax(ajaxOptions);
      }
    });

    $editor.
      find('[data-column-data-type-name="checkbox"] input.value').
      // If the user only clicks a checkbox it does not update the internal state
      // of the modal but the UI change is reflected. This ensures that the internal
      // state of the modal is kept in sync with how the checkbox is rendered.
      on('change', updateModal);

    $editor.
      find(
        '[data-column-data-type-name="date"] input.value, ' +
        '[data-column-data-type-name="calendar_date"] input.value'
      ).
      not('.utc-offset').
      on('focus', function(e) {
        var $target = $(e.target);

        e.stopPropagation();

        $editor.find('input').DatePickerRemove(); // eslint-disable-line new-cap

        $target.DatePicker({ // eslint-disable-line new-cap
          current: new Date(),
          date: new Date().format('y-m-d'),
          locale: $.DatePickerLocaleOptions,
          onShow: function() {
            $('.datepicker').show();
          },
          onChange: function(selectedDate) {
            var value = selectedDate + 'T00:00:00';

            $target.value(value);
            $target.trigger('input');
            $target.DatePickerRemove(); // eslint-disable-line new-cap
          },
          starts: 0
        });
      });

    $editor.
      find(
        '[data-column-data-type-name="photo"] input.file-input-upload-button, ' +
        '[data-column-data-type-name="document"] input.file-input-upload-button, ' +
        '[data-column-data-type-name="blob"] input.file-input-upload-button'
      ).
      on('click', function(e) {
        var $target = $(e.target);
        var dataTypeName = $target.closest('.input-line').attr('data-column-data-type-name');

        e.stopPropagation();

        $.uploadDialog().
          show(
            'https://localhost/views/' + window.blist.dataset.id + '/files.txt',
            function(fileId) {

              $target.attr('data-file-id', fileId);
              $target.addClass('has-file').value($.t('controls.grid_view_row_editor.controls.replace_file'));

              if (dataTypeName === 'document') {
                $target.siblings('.file-input-filename').text($.t('controls.grid_view_row_editor.controls.filename_selected'));
              } else {
                $target.siblings('.file-input-filename').text($.t('controls.grid_view_row_editor.controls.file_chosen'));
              }

              updateModal();
            },
            // On modal close
            _.noop
          );
      });

    $editor.find('input').not('input.is-null, input.location-needs-recoding').on('input', updateModal);

    $editor.find('input.is-null').on('change', function(e) {
      var $target = $(e.target);
      var isNull = $target.value();
      var $inputLine = $target.closest('.input-line');
      var dataTypeName = $inputLine.attr('data-column-data-type-name');

      switch (dataTypeName) {

        case 'location':
          $inputLine.find('.value-set input.value').not('.location-latitude, .location-longitude').attr('disabled', isNull);
          $inputLine.find('.location-latitude, .location-longitude').attr('disabled', isNull || $inputLine.find('.location-needs-recoding').value());
          break;

        case 'date':
          $target.siblings('input.value').attr('disabled', isNull);
          break;

        case 'calendar_date':
          $target.siblings('input.value').not('.utc-offset').attr('disabled', isNull);
          break;

        case 'photo':
        case 'document':
        case 'blob':
          $target.siblings('input.value').attr('disabled', isNull);
          break;

        default:
          $target.siblings('input.value').attr('disabled', isNull);
          break;
      }

      updateModal();
    });

    $editor.find('input.value.location-needs-recoding').on('change', function(e) {
      var $target = $(e.target);
      var isNull = $target.value();

      $target.closest('.input-line').find('.location-latitude, .location-longitude').attr('disabled', isNull);
    });
  }

  // columnValues is used to track the current state of the form, and whether
  // or not all column values are valid for the column type.
  var columnValues = [];
  var columns = options.columns;
  var $editor = renderRowEditor(
    options.viewId,
    options.row.id,
    options.columns,
    options.row.data
  );

  attachRowEditorEvents();

  $('body').append($editor);

  updateModal();
};
