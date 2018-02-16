import _ from 'lodash';
import $ from 'jquery';

import DataTypeFormatter from 'common/visualizations/views/DataTypeFormatter';

export async function setPopupContent(element, vif, renderOptions, retrieveDataCondition) {
  const additionalColumnNames = vif.getFlyoutAdditionalColumns();
  const columnNameToColumnMap = _.keyBy(renderOptions.datasetMetadata.columns, 'fieldName');
  const datasetSoqlDataProvider = vif.getDatasetSoqlDataProvider();
  const titleColumnName = vif.getFlyoutTitleColumn();
  const selectColumns = vif.getAllFlyoutColumns();

  if (_.isEmpty(selectColumns)) {
    return null;
  }

  // To use :id='....' in the where condition, we need to have the :id in the select clause.
  // Otherwise soql breaks.
  selectColumns.push(':id');
  // While data is loading, show loading spinner in the popup.
  $(element).html(getLoadingSpinnerContent());

  const query = `SELECT ${selectColumns.join(',')} WHERE ${retrieveDataCondition}`;
  const results = await datasetSoqlDataProvider.rawQuery(query);

  const additionalColumns = _.map(additionalColumnNames, (additionalColumnName) => {
    return columnNameToColumnMap[additionalColumnName];
  });
  const genericPopupContent = '<div class="point-map-popup point-popup">' +
    formatTitleColumnValue(vif, results[0], columnNameToColumnMap[titleColumnName]) +
    formatAdditionalColumnValues(vif, results[0], additionalColumns) +
    '</div>';
  $(element).html(genericPopupContent);

  return genericPopupContent;
}

function formatTitleColumnValue(vif, rowData, column) {
  if (_.isUndefined(column)) {
    return '';
  }

  const titleContent = DataTypeFormatter.renderCellHTML(
    _.get(rowData, column.fieldName),
    column,
    vif.getDomain(),
    vif.getDatasetUid()
  );

  return `<div class="popup-title">${titleContent}</div>`;
}

function formatAdditionalColumnValues(vif, rowData, columns) {
  return _.map(columns, (column) => {
    const formattedValue = DataTypeFormatter.renderCellHTML(
      _.get(rowData, column.fieldName),
      column,
      vif.getDomain(),
      vif.getDatasetUid()
    );

    return '<div class="additional-column">' +
      `<div class="column-name">${column.name}</div>` +
      `<div class="column-value">${formattedValue}</div>` +
    '</div>';
  }).join('');
}

function getLoadingSpinnerContent() {
  return '<div class="loading-spinner-container">' +
    '<div class="loading-spinner"></div>' +
    '</div>';
}
