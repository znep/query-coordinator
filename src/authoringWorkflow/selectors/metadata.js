import _ from 'lodash';
import { createSelector } from 'reselect';

import { VISUALIZATION_TYPES, DIMENSION_TYPES } from '../constants';

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

export const getRecommendedDimensions = (state, type) => {
  var dimensions = getValidDimensions(state);
  var visualizationType = _.find(VISUALIZATION_TYPES, visualization => visualization.type === type);

  return _.filter(dimensions, dimension => {
    return visualizationType && _.includes(visualizationType.preferredDimensionTypes, dimension.renderTypeName);
  });
};

export const getRecommendedVisualizationTypes = (state, column) => {
  var dimension = _.find(getValidDimensions(state), dimension => {
    return column && column.columnName === dimension.fieldName
  });

  var dimensionType = _.find(DIMENSION_TYPES, column => {
    return dimension && dimension.renderTypeName === column.type
  });

  return _.filter(VISUALIZATION_TYPES, visualization => {
    return dimensionType && _.includes(dimensionType.preferredVisualizationTypes, visualization.type);
  });
};

export const getValidMeasures = createSelector(
  getPhidippidesMetadata,
  (phidippidesMetadata) => {
    return _.chain(phidippidesMetadata.columns).
      map(injectFieldName).
      filter({ renderTypeName: 'number' }).
      filter(isNotSystemColumn).
      filter(isNotComputedColumn).
      sortBy('name').
      value();
  }
);

export const getValidComputedColumns = createSelector(
  getPhidippidesMetadata,
  (phidippidesMetadata) => {
    return _.chain(phidippidesMetadata.columns).
      map(injectFieldName).
      filter(isComputedColumn).
      map(pluckComputedColumnNameAndUid).
      sortBy('name').
      value();
  }
);

export const getValidCuratedRegions = createSelector(
  getCuratedRegions,
  getValidComputedColumns,
  (curatedRegions, computedColumns) =>  {
    var notInDataset = (region) => {
      return !_.some(computedColumns, {uid: region.uid});
    };

    return _.chain(curatedRegions).
      filter(notInDataset).
      map(pluckCuratedRegionNameAndUid).
      sortBy('name').
      value();
  }
);

export const getValidRegions = createSelector(
  getValidCuratedRegions,
  getValidComputedColumns,
  (curatedRegions, computedColumns) => {
    return [...curatedRegions, ...computedColumns];
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

