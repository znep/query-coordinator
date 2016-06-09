import { createSelector } from 'reselect';

const getLoading = state => state.isLoading;
const getDatasetMetadata = state => state.data;
const getCuratedRegions = state => state.curatedRegions;
const getPhidippidesMetadata = state => state.phidippidesMetadata;
const getError = state => state.error;

export const isLoading = createSelector(getLoading, isLoading => isLoading);
export const hasData = createSelector(getDatasetMetadata, datasetMetadata => { return !_.isNull(datasetMetadata); });
export const hasError = createSelector(getError, error => { return !_.isNull(error) });

export const getValidDimensions = createSelector(
  getPhidippidesMetadata,
  (phidippidesMetadata) => {
    return _.chain(phidippidesMetadata.columns).
      map(injectFieldName).
      filter(isNotSystemColumn).
      filter(isNotComputedColumn).
      sortBy('name').
      value();
  }
);

export const getValidMeasures = createSelector(
  getPhidippidesMetadata,
  (phidippidesMetadata) => {
    return _.chain(phidippidesMetadata.columns).
      map(injectFieldName).
      filter({ dataTypeName: 'number' }).
      filter(isNotSystemColumn).
      filter(isNotComputedColumn).
      sortBy('name').
      value();
  }
);

export const getValidRegions = createSelector(
  getDatasetMetadata,
  getCuratedRegions,
  getPhidippidesMetadata,
  (datasetMetadata, curatedRegions, phidippidesMetadata) => {
    var validCuratedRegions = _.chain(curatedRegions).
      map(pluckCuratedRegionNameAndUid).
      sortBy('name').
      value();
    var validComputedColumns = _.chain(phidippidesMetadata.columns).
      map(injectFieldName).
      filter(isComputedColumn).
      map(pluckComputedColumnNameAndUid).
      sortBy('name').
      value();

    return [
      ...validComputedColumns,
      ...validCuratedRegions
    ];
  }
);

const isNotSystemColumn = column => {
  return !column.name.startsWith(':');
};

const isComputedColumn = column => {
  return _.has(column, 'computationStrategy.parameters.region');
};

const isNotComputedColumn = column => {
  return !isComputedColumn(column);
};

const pluckComputedColumnNameAndUid = region => {
  return {
    fieldName: region.fieldName,
    name: region.name,
    uid: region.computationStrategy.parameters.region.slice(1)
  };
};

const pluckCuratedRegionNameAndUid = region => {
  return {
    name: region.name,
    uid: region.uid
  };
};

const injectFieldName = (column, key) => {
  return _.set(column, 'fieldName', key);
};

