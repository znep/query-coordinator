/**
 * Input line renderers
 */

function renderIcon(dataTypeName) {
  var iconClassName =  _.get(rowEditorHelpers, ['dataTypes', dataTypeName, 'icon'], null);

  if (_.isNull(iconClassName)) {

    throw new Error(
      'Encountered unexpected column dataTypeName "' +
      dataTypeName +
      '" when attempting to render column icon.'
    );
  }

  return '<span class="icon ' + iconClassName + '"></span>';
}

function renderValidationError(dataTypeName) {

  return (
    '<span>' +
      $.t('controls.grid_view_row_editor.data_types.' + dataTypeName + '.validation_error') +
    '</span>'
  );
}

function renderStandardTextInputLine(column) {
  return $(
    '<div class="input-line" ' +
      'data-column-field-name="' +
      column.fieldName +
      '" ' +
      'data-column-data-type-name="' +
      column.dataTypeName +
      '">' +
      renderIcon(column.dataTypeName) +
      '<label class="value"></label>' +
      '<input id="row-editor-' +
        column.fieldName +
        '" class="value" type="text" />' +
      '<input id="row-editor-' +
        column.fieldName +
        '-is-null" class="is-null" type="checkbox" />' +
      '<div class="validation-error">' +
        renderValidationError(column.dataTypeName) +
      '</div>' +
    '</div>'
  );
}

function renderSimpleInputLine(column, value) {
  var $inputLine = renderStandardTextInputLine(column);

  // Use jQuery's wrapper around the DOM API in order to avoid XSS vectors
  // that we'd expose by doing plain string interpolation.
  $inputLine.find('label').eq(0).attr('for', 'row-editor-' + column.fieldName).text(column.name);

  if (_.isNull(value)) {
    $inputLine.find('input.value').attr('disabled', true);
    $inputLine.find('input.is-null').value(true);
  } else {
    $inputLine.find('input.value').value(value);
  }

  return $inputLine;
}

function renderDateInputLine(column, value) {
  var optionalUTCOffsetInput = '';
  var valueAsISOString = '';

  if (column.dataTypeName === 'date') {

    valueAsISOString = new Date(value * 1000).toISOString();
    optionalUTCOffsetInput = (
      '<label class="value utc-offset"></label>' +
      '<input id="row-editor-' +
        column.fieldName +
        '-utc-offset" class="value utc-offset" type="text" />'
    );
  } else {
    valueAsISOString = new Date(value).toISOString();
  }

  var $inputLine = $(
    '<div class="input-line" ' +
      'data-column-field-name="' +
      column.fieldName +
      '" ' +
      'data-column-data-type-name="' +
      column.dataTypeName +
      '">' +
      renderIcon(column.dataTypeName) +
      '<label class="value"></label>' +
      '<input id="row-editor-' +
        column.fieldName +
        '" class="value" type="text" />' +
      optionalUTCOffsetInput +
      '<input id="row-editor-' +
        column.fieldName +
        '-is-null" class="is-null" type="checkbox" />' +
      '<div class="validation-error">' +
        renderValidationError(column.dataTypeName) +
      '</div>' +
    '</div>'
  );

  // Use jQuery's wrapper around the DOM API in order to avoid XSS vectors
  // that we'd expose by doing plain string interpolation.
  $inputLine.find('label').eq(0).attr('for', 'row-editor-' + column.fieldName).text(column.name);
  $inputLine.find('label').eq(1).attr('for', 'row-editor-' + column.fieldName + '-utc-offset').text($.t('controls.grid_view_row_editor.utc_offset_label'));

  if (_.isNull(value)) {
    $inputLine.find('input.value').not('.utc-offset').attr('disabled', true);
    $inputLine.find('input.value.utc-offset').attr('disabled', true);
    $inputLine.find('input.is-null').value(true);
  } else {
    $inputLine.find('input.value').not('.utc-offset').value(valueAsISOString.substring(0, 19));
    $inputLine.find('input.value.utc-offset').value('+0000').attr('disabled', false);
  }

  return $inputLine;
}

function renderUrlInputLine(column, value) {
  var $inputLine = renderStandardTextInputLine(column);

  // Use jQuery's wrapper around the DOM API in order to avoid XSS vectors
  // that we'd expose by doing plain string interpolation.
  $inputLine.find('label').eq(0).attr('for', 'row-editor-' + column.fieldName).text(column.name);

  if (_.isNull(value)) {
    $inputLine.find('input.value').attr('disabled', true);
    $inputLine.find('input.is-null').value(true);
  } else {
    $inputLine.find('input.value').value(_.get(value, 'url', ''));
  }

  return $inputLine;
}

function renderCheckboxInputLine(column, value) {
  var $inputLine = $(
    '<div class="input-line" ' +
      'data-column-field-name="' +
      column.fieldName +
      '" ' +
      'data-column-data-type-name="' +
      column.dataTypeName +
      '">' +
      renderIcon(column.dataTypeName) +
      '<label class="value"></label>' +
      '<input id="row-editor-' +
        column.fieldName +
        '" class="value" type="checkbox" />' +
    '</div>'
  );

  // Use jQuery's wrapper around the DOM API in order to avoid XSS vectors
  // that we'd expose by doing plain string interpolation.
  $inputLine.find('label').eq(0).attr('for', column.fieldName).text(column.name);

  if (_.isNull(value) || !value) {
    $inputLine.find('input.value').value(false);
  } else {
    $inputLine.find('input.value').value(true);
  }

  return $inputLine;
}

function renderPhoneInputLine(column, value) {
  var $inputLine = renderStandardTextInputLine(column);

  // Use jQuery's wrapper around the DOM API in order to avoid XSS vectors
  // that we'd expose by doing plain string interpolation.
  $inputLine.find('label').eq(0).attr('for', 'row-editor-' + column.fieldName).text(column.name);

  if (_.isNull(value)) {
    $inputLine.find('input.value').attr('disabled', true);
    $inputLine.find('input.is-null').value(true);
  } else {
    $inputLine.find('input.value').value(_.get(value, 'phone_number', ''));
  }

  return $inputLine;
}

function renderFlagInputLine(column, value) {
  var $inputLine = $(
    '<div class="input-line" ' +
      'data-column-field-name="' +
      column.fieldName +
      '" ' +
      'data-column-data-type-name="' +
      column.dataTypeName +
      '">' +
      renderIcon(column.dataTypeName) +
      '<label class="value"></label>' +
      '<input id="row-editor-' +
        column.fieldName +
        '" class="value" type="text" />' +
      '<input id="row-editor-' +
        column.fieldName +
        '-is-null" class="is-null" type="checkbox" />' +
      '<div class="validation-error">' +
        renderValidationError(column.dataTypeName) +
        '"red", "blue", "green", "yellow", "orange" or "purple".' +
      '</div>' +
    '</div>'
  );

  // Use jQuery's wrapper around the DOM API in order to avoid XSS vectors
  // that we'd expose by doing plain string interpolation.
  $inputLine.find('label').eq(0).attr('for', 'row-editor-' + column.fieldName).text(column.name);

  if (_.isNull(value)) {
    $inputLine.find('input.value').attr('disabled', true);
    $inputLine.find('input.is-null').value(true);
  } else {
    $inputLine.find('input.value').value(value);
  }

  return $inputLine;
}

function renderDropDownListInputLine(column, value) {
  var validOptions = _.get(column, 'dropDownList.values', []).
    filter(function(dropDownValue) {
      return !dropDownValue.deleted;
    }).
    map(function(dropDownValue) {
      return dropDownValue.description;
    });
  var $inputLine = $(
    '<div class="input-line" ' +
      'data-column-field-name="' +
      column.fieldName +
      '" ' +
      'data-column-data-type-name="' +
      column.dataTypeName +
      '">' +
      renderIcon(column.dataTypeName) +
      '<label class="value"></label>' +
      '<input id="row-editor-' +
        column.fieldName +
        '" class="value" type="text" />' +
      '<input id="row-editor-' +
        column.fieldName +
        '-is-null" class="is-null" type="checkbox" />' +
      '<div class="validation-error">' +
        renderValidationError(column.dataTypeName) +
        validOptions.map(function(validOption) { return '"' + validOption + '"'; }).join(', ') +
      '</div>' +
    '</div>'
  );

  // Use jQuery's wrapper around the DOM API in order to avoid XSS vectors
  // that we'd expose by doing plain string interpolation.
  $inputLine.find('label').eq(0).attr('for', 'row-editor-' + column.fieldName).text(column.name);

  if (_.isNull(value)) {
    $inputLine.find('input.value').attr('disabled', true);
    $inputLine.find('input.is-null').value(true);
  } else {

    var valueDescription = _.get(_.find(column.dropDownList.values, {id: value}), 'description', '');

    $inputLine.find('input.value').value(valueDescription);
  }

  return $inputLine;
}

function renderLocationInputLine(column, value) {
  var $inputLine = $(
    '<div class="input-line" ' +
      'data-column-field-name="' +
      column.fieldName +
      '" ' +
      'data-column-data-type-name="' +
      column.dataTypeName +
      '">' +
      renderIcon(column.dataTypeName) +
      '<label class="value"></label>' +
      '<div class="value-set">' +
        '<div class="value-row">' +
          '<label class="value location-address"></label>' +
          '<input id="row-editor-' +
            column.fieldName +
            '-address" class="value location-address" type="text" />' +
        '</div>' +
        '<div class="value-row">' +
          '<label class="value location-city"></label>' +
          '<input id="row-editor-' +
            column.fieldName +
            '-city" class="value location-city" type="text" />' +
        '</div>' +
        '<div class="value-row">' +
          '<label class="value location-state"></label>' +
          '<input id="row-editor-' +
            column.fieldName +
            '-state" class="value location-state" type="text" />' +
        '</div>' +
        '<div class="value-row">' +
          '<label class="value location-zip"></label>' +
          '<input id="row-editor-' +
            column.fieldName +
            '-zip" class="value location-zip" type="text" />' +
        '</div>' +
        '<div class="value-row">' +
          '<label class="value location-needs-recoding checkbox-label"></label>' +
          '<input id="row-editor-' +
            column.fieldName +
            '-needs-recoding" class="value location-needs-recoding" type="checkbox" />' +
        '</div>' +
        '<div class="value-row">' +
          '<label class="value location-latitude"></label>' +
          '<input id="row-editor-' +
            column.fieldName +
            '-latitude" class="value location-latitude" type="text" />' +
        '</div>' +
        '<div class="value-row">' +
          '<label class="value location-longitude"></label>' +
          '<input id="row-editor-' +
            column.fieldName +
            '-longitude" class="value location-longitude" type="text" />' +
        '</div>' +
      '</div>' +
      '<input id="row-editor-' +
        column.fieldName +
        '-is-null" class="is-null" type="checkbox" />' +
      '<div class="validation-error">' +
        renderValidationError(column.dataTypeName) +
      '</div>' +
    '</div>'
  );
  var $inputLineLabels = $inputLine.find('label');
  var $inputLineValues = $inputLine.find('input.value');

  // Use jQuery's wrapper around the DOM API in order to avoid XSS vectors
  // that we'd expose by doing plain string interpolation.
  $inputLineLabels.eq(0).attr('for', 'row-editor-' + column.fieldName).text(column.name);
  $inputLineLabels.eq(1).attr('for', 'row-editor-' + column.fieldName + '-address').text($.t('controls.grid_view_row_editor.data_types.location.address'));
  $inputLineLabels.eq(2).attr('for', 'row-editor-' + column.fieldName + '-city').text($.t('controls.grid_view_row_editor.data_types.location.city'));
  $inputLineLabels.eq(3).attr('for', 'row-editor-' + column.fieldName + '-state').text($.t('controls.grid_view_row_editor.data_types.location.state'));
  $inputLineLabels.eq(4).attr('for', 'row-editor-' + column.fieldName + '-zip').text($.t('controls.grid_view_row_editor.data_types.location.zip'));
  $inputLineLabels.eq(5).attr('for', 'row-editor-' + column.fieldName + '-needs-recoding').text($.t('controls.grid_view_row_editor.data_types.location.needs_recoding'));
  $inputLineLabels.eq(6).attr('for', 'row-editor-' + column.fieldName + '-latitude').text($.t('controls.grid_view_row_editor.data_types.location.latitude'));
  $inputLineLabels.eq(7).attr('for', 'row-editor-' + column.fieldName + '-longitude').text($.t('controls.grid_view_row_editor.data_types.location.longitude'));

  if (_.isEmpty(value)) {
    $inputLineValues.attr('disabled', true);
    $inputLine.find('input.is-null').value(true);
  } else {
    var humanAddress = JSON.parse(_.get(value, 'human_address', '{}'));
    var address = _.get(humanAddress, 'address', '');
    var city = _.get(humanAddress, 'city', '');
    var state = _.get(humanAddress, 'state', '');
    var zip = _.get(humanAddress, 'zip', '');
    var needsRecoding = _.get(value, 'needs_recoding', false);
    var latitude = _.get(value, 'latitude', '');
    var longitude = _.get(value, 'longitude', '');

    $inputLineValues.attr('disabled', false);
    $inputLine.find('input.is-null').value(false);
    $inputLineValues.eq(0).value(address);
    $inputLineValues.eq(1).value(city);
    $inputLineValues.eq(2).value(state);
    $inputLineValues.eq(3).value(zip);
    $inputLineValues.eq(4).value(needsRecoding);
    $inputLineValues.eq(5).value(latitude);
    $inputLineValues.eq(6).value(longitude);

    if (needsRecoding) {
      $inputLineValues.eq(5).attr('disabled', true);
      $inputLineValues.eq(6).attr('disabled', true);
    }
  }

  return $inputLine;
}

function renderWKTInputLine(column, value) {
  var $inputLine = renderStandardTextInputLine(column);

  // Use jQuery's wrapper around the DOM API in order to avoid XSS vectors
  // that we'd expose by doing plain string interpolation.
  $inputLine.find('label').eq(0).attr('for', 'row-editor-' + column.fieldName).text(column.name);

  if (_.isNull(value)) {
    $inputLine.find('input.value').attr('disabled', true);
    $inputLine.find('input.is-null').value(true);
  } else if (_.isString(value)) {
    $inputLine.find('input.value').value(value);
  } else {
    $inputLine.find('input.value').value(WKT.stringify(value));
  }

  return $inputLine;
}

function renderPhotoInputLine(column, value) {
  var $inputLine = $(
    '<div class="input-line" ' +
      'data-column-field-name="' +
      column.fieldName +
      '" ' +
      'data-column-data-type-name="' +
      column.dataTypeName +
      '">' +
      renderIcon(column.dataTypeName) +
      '<label class="value"></label>' +
      '<div class="value file-input-filename"></div>' +
      '<input type="button" class="value file-input-upload-button" value="' +
        $.t('controls.grid_view_row_editor.controls.choose_file') +
        '"/>' +
      '<input id="row-editor-' +
        column.fieldName +
        '-is-null" class="is-null" type="checkbox" />' +
      '<div class="validation-error">' +
        renderValidationError(column.dataTypeName) +
      '</div>' +
    '</div>'
  );

  // Use jQuery's wrapper around the DOM API in order to avoid XSS vectors
  // that we'd expose by doing plain string interpolation.
  $inputLine.find('label').eq(0).attr('for', 'row-editor-' + column.fieldName).text(column.name);

  if (_.isNull(value)) {
    $inputLine.find('.file-input-filename').text($.t('controls.grid_view_row_editor.controls.file_not_chosen'));
    $inputLine.find('.file-input-upload-button').attr('disabled', true);
    $inputLine.find('.is-null').value(true);
  } else {
    $inputLine.find('.file-input-filename').text($.t('controls.grid_view_row_editor.controls.file_chosen'));
    $inputLine.find('.file-input-upload-button').addClass('has-file').attr('data-file-id', value);
  }

  return $inputLine;
}

function renderDocumentInputLine(column, value) {
  var fileUploadButtonValue = _.get(value, 'file_id', false) ?
    $.t('controls.grid_view_row_editor.controls.replace_file') :
    $.t('controls.grid_view_row_editor.controls.choose_file');
  var $inputLine = $(
    '<div class="input-line" ' +
      'data-column-field-name="' +
      column.fieldName +
      '" ' +
      'data-column-data-type-name="' +
      column.dataTypeName +
      '">' +
      renderIcon(column.dataTypeName) +
      '<label class="value"></label>' +
      '<input type="text" class="value file-input-filename" placeholder="' +
        $.t('controls.grid_view_row_editor.controls.filename_placeholder') +
        '" />' +
      '<input type="button" class="value file-input-upload-button" value="' +
        fileUploadButtonValue +
        '"/>' +
      '<input id="row-editor-' +
        column.fieldName +
        '-is-null" class="is-null" type="checkbox" />' +
      '<div class="validation-error">' +
        renderValidationError(column.dataTypeName) +
      '</div>' +
    '</div>'
  );

  // Use jQuery's wrapper around the DOM API in order to avoid XSS vectors
  // that we'd expose by doing plain string interpolation.
  $inputLine.find('label').eq(0).attr('for', 'row-editor-' + column.fieldName).text(column.name);

  if (_.isNull(value)) {
    $inputLine.find('.file-input-filename, .file-input-upload-button').attr('disabled', true);
    $inputLine.find('.is-null').value(true);
  } else {
    $inputLine.find('.file-input-filename, .file-input-upload-button').attr('disabled', false);
    $inputLine.find('.is-null').value(false);
    $inputLine.find('.file-input-filename').value(value.filename);
    $inputLine.find('.file-input-upload-button').addClass('has-file').attr('data-file-id', value.file_id);
  }

  return $inputLine;
}

function renderBlobInputLine(column, value) {
  var $inputLine = $(
    '<div class="input-line" ' +
      'data-column-field-name="' +
      column.fieldName +
      '" ' +
      'data-column-data-type-name="' +
      column.dataTypeName +
      '">' +
      renderIcon(column.dataTypeName) +
      '<label class="value"></label>' +
      '<div class="value file-input-filename"></div>' +
      '<input type="button" class="value file-input-upload-button" value="' +
        $.t('controls.grid_view_row_editor.controls.choose_file') +
        '"/>' +
      '<input id="row-editor-' +
        column.fieldName +
        '-is-null" class="is-null" type="checkbox" />' +
      '<div class="validation-error">' +
        renderValidationError(column.dataTypeName) +
      '</div>' +
    '</div>'
  );

  // Use jQuery's wrapper around the DOM API in order to avoid XSS vectors
  // that we'd expose by doing plain string interpolation.
  $inputLine.find('label').eq(0).attr('for', 'row-editor-' + column.fieldName).text(column.name);

  if (_.isNull(value)) {
    $inputLine.find('.file-input-filename').text($.t('controls.grid_view_row_editor.controls.file_not_chosen'));
    $inputLine.find('.file-input-upload-button').attr('disabled', true);
    $inputLine.find('.is-null').value(true);
  } else {
    $inputLine.find('.file-input-filename').text($.t('controls.grid_view_row_editor.controls.file_chosen'));
    $inputLine.find('.file-input-upload-button').addClass('has-file').attr('data-file-id', value);
  }

  return $inputLine;
}

function doNotRenderDeprecatedType() {
  return '';
}

/**
 * Input line getters
 */

function getSimpleInputLineValue($inputLine) {

  return ($inputLine.find('input.is-null').value()) ?
    null :
    // It's important to return an empty string instead of the null that jQuery returns
    // when calling .value() on a text input control that has no value in it since we
    // already allow a mechanism to indicate the absence of a value. There (may?) be
    // valid uses for empty strings as cell values?
    $inputLine.find('input.value').value() || '';
}

function getDateInputLineValue($inputLine) {

  if ($inputLine.find('input.is-null').value()) {
    return null;
  }

  var datetime = $inputLine.find('input.value').not('.utc-offset').value();
  var offset = $inputLine.find('input.value.utc-offset').value();

  // If either the datetime or the number is not present, the date is invalid.
  if (_.isNull(datetime) || _.isNull(offset)) {
    return Number.NEGATIVE_INFINITY;
  }

  // If the offset doesn't have a length or if it has any character other than
  // a +, a - or a digit, the date is invalid.
  if (offset.length === 0 || /[^[\+\-\d]/.test(offset)) {
    return Number.NEGATIVE_INFINITY;
  }

  var offsetSign = (offset.substring(0, 1) === '-') ?
    '-' :
    '+';
  var unsignedOffset = offset.replace(/[^\d]/g, '');

  // If the unsigned offset has either zero or more than four digits after an
  // optional + or -, the date is invalid.
  if (unsignedOffset.length === 0 || unsignedOffset.length > 4) {
    return Number.NEGATIVE_INFINITY;
  }

  var cleanOffset = '+0000';

  switch (unsignedOffset.length) {

    case 1:
      cleanOffset = offsetSign + unsignedOffset + '000';
      break;

    case 2:
      cleanOffset = offsetSign + unsignedOffset + '00';
      break;

    case 3:
      cleanOffset = offsetSign + unsignedOffset + '0';
      break;

    case 4:
      cleanOffset = offsetSign + unsignedOffset;
      break;

    default:
      break;
  }

  var timestamp = new Date(datetime + cleanOffset).getTime();

  if (!_.isFinite(timestamp)) {
    return Number.NEGATIVE_INFINITY;
  } else {
    return timestamp / 1000;
  }
}

function getCheckboxInputLineValue($inputLine) {
  return $inputLine.find('input.value').value();
}

function getLocationLineValue($inputLine) {
  var value = null;

  if (!$inputLine.find('input.is-null').value()) {

    value = {
      address: $inputLine.find('input.location-address').value(),
      city: $inputLine.find('input.location-city').value(),
      state: $inputLine.find('input.location-state').value(),
      zip: $inputLine.find('input.location-zip').value(),
      needsRecoding: $inputLine.find('input.location-needs-recoding').value(),
      latitude: $inputLine.find('input.location-latitude').value(),
      longitude: $inputLine.find('input.location-longitude').value()
    };
  }

  return value;
}

function getStarsInputLineValue($inputLine) {

  return ($inputLine.find('input.is-null').value()) ?
    null :
    // It's important to return an empty string instead of the null that jQuery returns
    // when calling .value() on a text input control that has no value in it since we
    // already allow a mechanism to indicate the absence of a value. There (may?) be
    // valid uses for empty strings as cell values?
    parseInt($inputLine.find('input.value').value(), 10);
}

function getPhotoInputLineValue($inputLine) {

  return ($inputLine.find('input.is-null').value()) ?
    null :
    $inputLine.find('input.value').attr('data-file-id') || false;
}

function getDocumentInputLineValue($inputLine) {
  var filename = $inputLine.find('input.value.file-input-filename').value();
  var fileId = $inputLine.find('input.value.file-input-upload-button').attr('data-file-id');

  if ($inputLine.find('input.is-null').value() || _.isNull(filename) || _.isNull(fileId)) {
    return null;
  } else {

    return {
      filename: filename,
      file_id: fileId
    };
  }
}

function getBlobInputLineValue($inputLine) {

  return ($inputLine.find('input.is-null').value()) ?
    null :
    $inputLine.find('input.value').attr('data-file-id') || false;
}

function doNotGetDeprecatedType() {
  return null;
}

/**
 * Input line validators
 */

function validateText(columnValue) {
  var value = columnValue.value;

  return _.isNull(value) || (value != '' && _.isString(value));
}

function validateNumber(columnValue) {
  var value = columnValue.value;

  return _.isNull(value) || (value != '' && !/[^\d\,\.\-]+/.test(value) && _.isFinite(parseFloat(value)));
}

function validateDate(columnValue) {
  var value = columnValue.value;

  return _.isNull(value) || _.isFinite(value);
}

function validateCheckbox(columnValue) {
  var value = columnValue.value;

  return _.isBoolean(value);
}

function validateFlag(columnValue) {
  var value = columnValue.value;

  return _.isNull(value) ||
    (
      value != '' &&
      _.isString(value) &&
      ['red', 'blue', 'green', 'yellow', 'orange', 'purple'].indexOf(value.toLowerCase()) >= 0
    );
}

function validateStars(columnValue) {
  var value = columnValue.value;

  return _.isNull(value) || (_.isFinite(value) && value >= 1 && value <= 5);
}

function validateEmail(columnValue) {
  var value = columnValue.value;

  return _.isNull(value) || window.blist.util.patterns.core.emailValidator.test(value);
}

function validateDatetime(columnValue) {
  var value = columnValue.value;
  // The pattern below will match 'floating' datetimes (e.g. those lacking
  // utc-offset information).
  var iso8601 = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})\:(\d{2})\:(\d{2})$/;

  return _.isNull(value) || (value != '' && iso8601.test(value));
}

function validateUrl(columnValue) {
  var value = columnValue.value;

  return _.isNull(value) || window.blist.util.patterns.core.urlValidator.test(value);
}

function validateDropDownList(columnValue) {
  var value = columnValue.value;
  var validOptions = _.get(columnValue.column, 'dropDownList.values', []).
    filter(function(dropDownValue) {
      return !dropDownValue.deleted;
    }).
    map(function(dropDownValue) {
      return dropDownValue.description;
    });

  return _.isNull(value) || validOptions.indexOf(value) >= 0;
}

function validateLocation(columnValue) {
  var value = columnValue.value;

  if (_.isNull(value)) {
    return true;
  }

  var addressIsValid = _.isNull(value.address) || _.isString(value.address);
  var cityIsValid = _.isNull(value.city) || _.isString(value.city);
  var stateIsValid = _.isNull(value.state) || _.isString(value.state);
  var zipIsValid = _.isNull(value.zip) || _.isString(value.zip);
  var needsRecodingIsValid = _.isBoolean(value.needsRecoding);
  var latLngPattern = /^\-{0,1}\d+\.{0,1}\d+$/;
  var latLngIsValid = (
    (
      _.isNull(value.latitude) ||
      (
        _.isString(value.latitude) &&
        latLngPattern.test(value.latitude)
      )
    ) &&
    (
      _.isNull(value.longitude) ||
      (
        _.isString(value.longitude) &&
        latLngPattern.test(value.longitude)
      )
    )
  );

  // Otherwise, we need to check that all the address components are valid if we intend to
  // recompute the location using geocoding, that the latitude and longitude are valid if
  // we do not intend to recompute anything.
  return (
    needsRecodingIsValid &&
    (value.needsRecoding && addressIsValid && cityIsValid && stateIsValid && zipIsValid) ||
    (!value.needsRecoding && latLngIsValid)
  );
}

function validateWKT(columnValue) {
  var value = columnValue.value;

  return _.isNull(value) || (_.isString(value) && !_.isNull(WKT.parse(value)));
}

function validatePhoto(columnValue) {
  var value = columnValue.value;

  return _.isNull(value) || (_.isString(value) && /^[0-9a-f]{8}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{12}$/.test(value));
}

function validateDocument(columnValue) {
  var value = columnValue.value;

  if (_.isNull(value)) {
    return true;
  }

  if (!_.isObject(value) || !_.get(value, 'filename') || !_.get(value, 'file_id')) {
    return false;
  }

  return (
    _.isString(value.filename) &&
    !_.isEmpty(value.filename) &&
    value.filename.replace(/\s/g, '').length > 0 &&
    /^[0-9a-f]{8}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{12}$/.test(value.file_id)
  );
}

function validateBlob(columnValue) {
  var value = columnValue.value;

  return _.isNull(value) || (_.isString(value) && /^[0-9a-f]{8}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{4}\-[0-9a-f]{12}$/.test(value));
}

function doNotValidateDeprecatedType() {
  return false;
}

function formatColumnValuesForOBE(columnValues) {
  var payload = {};

  columnValues.forEach(function(columnValue) {

    switch (columnValue.column.dataTypeName) {
      case 'text':
      case 'html':
      case 'number':
      case 'money':
      case 'percent':
      case 'calendar_date':
      case 'date':
      case 'url':
      case 'email':
      case 'checkbox':
      case 'flag':
      case 'stars':
      case 'photo':
      case 'nested_table':
        payload[columnValue.column.id] = columnValue.value;
        break;

      case 'location':

        payload[columnValue.column.id] = (_.isNull(columnValue.value)) ?
          columnValue.value :
          {
            human_address: JSON.stringify({
              address: columnValue.value.address,
              city: columnValue.value.city,
              state: columnValue.value.state,
              zip: columnValue.value.zip
            }),
            latitude: columnValue.value.latitude,
            longitude: columnValue.value.longitude,
            needs_recoding: columnValue.value.needsRecoding
          };
        break;

      case 'phone':
        payload[columnValue.column.id] = {
          phone_number: columnValue.value,
          phone_type: null
        };
        break;

      case 'drop_down_list':
        payload[columnValue.column.id] = _.get(
          _.find(
            columnValue.column.dropDownList.values,
            {description: columnValue.value}
          ),
          'id',
          null
        );
        break;

      case 'document':
        payload[columnValue.column.id] = _.get(columnValue, 'value', null);
        break;

      // NBE-only types. Do nothing.
      case 'point':
      case 'multiline':
      case 'multipolygon':
      case 'polygon':
      case 'line':
      case 'multipoint':
      case 'blob':
        break;

      // Unknown or deprecated types. Do nothing.
      case 'dataset_link':
      case 'geospatial':
      case 'object':
      case 'list':
      default:
        break;
    }
  });

  return payload;
}

function formatColumnValuesForNBE(columnValues) {
  var payload = {};

  columnValues.forEach(function(columnValue) {

    switch (columnValue.column.dataTypeName) {

      case 'text':
        payload[columnValue.column.fieldName] = columnValue.value;
        break;

      case 'number':
        payload[columnValue.column.fieldName] = parseFloat(columnValue.value);
        break;

      case 'calendar_date':
        payload[columnValue.column.fieldName] = columnValue.value;
        break;

      case 'checkbox':
        payload[columnValue.column.fieldName] = columnValue.value;
        break;

      case 'blob':
        payload[columnValue.column.fieldName] = columnValue.value;
        break;

      case 'point':
      case 'multiline':
      case 'multipolygon':
      case 'polygon':
      case 'line':
      case 'multipoint':
        payload[columnValue.column.fieldName] = (_.isNull(columnValue.value)) ? null : WKT.parse(columnValue.value);
        break;

      // OBE-only, unknown, or deprecated types. Do nothing.
      case 'date':
      case 'money':
      case 'phone':
      case 'flag':
      case 'stars':
      case 'percent':
      case 'email':
      case 'html':
      case 'url':
      case 'nested_table':
      case 'drop_down_list':
      case 'photo':
      case 'document':
      case 'location':
      case 'dataset_link':
      case 'geospatial':
      case 'object':
      case 'list':
      default:
        break;
    }
  });

  return payload;
}

var rowEditorHelpers = {
  formatColumnValuesForOBE: formatColumnValuesForOBE,
  formatColumnValuesForNBE: formatColumnValuesForNBE,
  // Note that most of the values of these properties are functions.
  dataTypes: {
    text: {
      icon: 'socrata-icon-text',
      inputLineRenderer: renderSimpleInputLine,
      inputLineGetter: getSimpleInputLineValue,
      validator: validateText
    },
    number: {
      icon: 'socrata-icon-number',
      inputLineRenderer: renderSimpleInputLine,
      inputLineGetter: getSimpleInputLineValue,
      validator: validateNumber
    },
    date: {
      icon: 'socrata-icon-date',
      inputLineRenderer: renderDateInputLine,
      inputLineGetter: getDateInputLineValue,
      validator: validateDate
    },
    money: {
      icon: 'socrata-icon-number',
      inputLineRenderer: renderSimpleInputLine,
      inputLineGetter: getSimpleInputLineValue,
      validator: validateNumber
    },
    phone: {
      icon: 'socrata-icon-text',
      inputLineRenderer: renderPhoneInputLine,
      inputLineGetter: getSimpleInputLineValue,
      validator: validateText
    },
    checkbox: {
      icon: 'socrata-icon-checkmark3',
      inputLineRenderer: renderCheckboxInputLine,
      inputLineGetter: getCheckboxInputLineValue,
      validator: validateCheckbox
    },
    flag: {
      icon: 'socrata-icon-text',
      inputLineRenderer: renderFlagInputLine,
      inputLineGetter: getSimpleInputLineValue,
      validator: validateFlag
    },
    stars: {
      icon: 'socrata-icon-number',
      inputLineRenderer: renderSimpleInputLine,
      inputLineGetter: getStarsInputLineValue,
      validator: validateStars
    },
    percent: {
      icon: 'socrata-icon-number',
      inputLineRenderer: renderSimpleInputLine,
      inputLineGetter: getSimpleInputLineValue,
      validator: validateNumber
    },
    email: {
      icon: 'socrata-icon-email',
      inputLineRenderer: renderSimpleInputLine,
      inputLineGetter: getSimpleInputLineValue,
      validator: validateEmail
    },
    html: {
      icon: 'socrata-icon-text',
      inputLineRenderer: renderSimpleInputLine,
      inputLineGetter: getSimpleInputLineValue,
      validator: validateText
    },
    calendar_date: {
      icon: 'socrata-icon-date',
      inputLineRenderer: renderDateInputLine,
      inputLineGetter: getSimpleInputLineValue,
      validator: validateDatetime
    },
    point: {
      icon: 'socrata-icon-geo',
      inputLineRenderer: renderWKTInputLine,
      inputLineGetter: getSimpleInputLineValue,
      validator: validateWKT
    },
    multiline: {
      icon: 'socrata-icon-geo',
      inputLineRenderer: renderWKTInputLine,
      inputLineGetter: getSimpleInputLineValue,
      validator: validateWKT
    },
    multipolygon: {
      icon: 'socrata-icon-geo',
      inputLineRenderer: renderWKTInputLine,
      inputLineGetter: getSimpleInputLineValue,
      validator: validateWKT
    },
    polygon: {
      icon: 'socrata-icon-geo',
      inputLineRenderer: renderWKTInputLine,
      inputLineGetter: getSimpleInputLineValue,
      validator: validateWKT
    },
    line: {
      icon: 'socrata-icon-geo',
      inputLineRenderer: renderWKTInputLine,
      inputLineGetter: getSimpleInputLineValue,
      validator: validateWKT
    },
    multipoint: {
      icon: 'socrata-icon-geo',
      inputLineRenderer: renderWKTInputLine,
      inputLineGetter: getSimpleInputLineValue,
      validator: validateWKT
    },
    url: {
      icon: 'socrata-icon-link',
      inputLineRenderer: renderUrlInputLine,
      inputLineGetter: getSimpleInputLineValue,
      validator: validateUrl
    },
    nested_table: {
      icon: 'socrata-icon-puzzle',
      inputLineRenderer: doNotRenderDeprecatedType,
      inputLineGetter: doNotGetDeprecatedType,
      validator: doNotValidateDeprecatedType
    },
    drop_down_list: {
      icon: 'socrata-icon-text',
      inputLineRenderer: renderDropDownListInputLine,
      inputLineGetter: getSimpleInputLineValue,
      validator: validateDropDownList
    },
    photo: {
      icon: 'socrata-icon-puzzle',
      inputLineRenderer: renderPhotoInputLine,
      inputLineGetter: getPhotoInputLineValue,
      validator: validatePhoto
    },
    document: {
      icon: 'socrata-icon-puzzle',
      inputLineRenderer: renderDocumentInputLine,
      inputLineGetter: getDocumentInputLineValue,
      validator: validateDocument
    },
    location: {
      icon: 'socrata-icon-geo',
      inputLineRenderer: renderLocationInputLine,
      inputLineGetter: getLocationLineValue,
      validator: validateLocation
    },
    dataset_link: {
      icon: 'socrata-icon-warning',
      inputLineRenderer: doNotRenderDeprecatedType,
      inputLineGetter: doNotGetDeprecatedType,
      validator: doNotValidateDeprecatedType
    },
    geospatial: {
      icon: 'socrata-icon-warning',
      inputLineRenderer: doNotRenderDeprecatedType,
      inputLineGetter: doNotGetDeprecatedType,
      validator: doNotValidateDeprecatedType
    },
    object: {
      icon: 'socrata-icon-warning',
      inputLineRenderer: doNotRenderDeprecatedType,
      inputLineGetter: doNotGetDeprecatedType,
      validator: doNotValidateDeprecatedType
    },
    list: {
      icon: 'socrata-icon-warning',
      inputLineRenderer: doNotRenderDeprecatedType,
      inputLineGetter: doNotGetDeprecatedType,
      validator: doNotValidateDeprecatedType
    },
    blob: {
      icon: 'socrata-icon-puzzle',
      inputLineRenderer: renderBlobInputLine,
      inputLineGetter: getBlobInputLineValue,
      validator: validateBlob
    }
  }
};

module.exports = rowEditorHelpers;
