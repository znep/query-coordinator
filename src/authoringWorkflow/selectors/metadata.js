import _ from 'lodash';
import MetadataProvider from '../../dataProviders/MetadataProvider';
import SpandexDataProvider from '../../dataProviders/SpandexDataProvider';

import { createSelector } from 'reselect';

import { VISUALIZATION_TYPES, COLUMN_TYPES } from '../constants';

const getLoading = state => state.isLoading;
const getDomain = state => state.domain;
const getDatasetUid = state => state.datasetUid;
const getDatasetMetadata = state => state.data;
const getCuratedRegions = state => state.curatedRegions;
const getPhidippidesMetadata = state => state.phidippidesMetadata;
const hasColumnStats = state => state.hasColumnStats;
const getError = state => state.error;

export const isLoading = createSelector(getLoading, isLoading => isLoading);
export const hasData = createSelector(getDatasetMetadata, datasetMetadata => !_.isNull(datasetMetadata));
export const hasError = createSelector(getError, error => !_.isNull(error));

export const getDatasetName = createSelector(
  getDatasetMetadata,
  (datasetMetadata) => _.get(datasetMetadata, 'name')
);

export const getDisplayableColumns = createSelector(
  getDomain,
  getDatasetUid,
  getDatasetMetadata,
  (domain, datasetUid, datasetMetadata) => {

    if (datasetMetadata) {
      return new MetadataProvider({domain, datasetUid}).getDisplayableColumns(datasetMetadata);
    } else {
      return []; // No data yet.
    }
  }
);

export const getFilterableColumns = createSelector(
  getDisplayableColumns,
  hasColumnStats,
  (columns, hasColumnStats) => {
    return _.filter(columns, (column) => {
      return column.dataTypeName === 'text' || (hasColumnStats && column.dataTypeName === 'number');
    });
  }
);

export const getDatasetLink = createSelector(
  getDomain,
  getDatasetUid,
  (domain, datasetUid) => `https://${domain}/d/${datasetUid}`
);

export const getValidDimensions = createSelector(
  getDomain,
  getDatasetUid,
  getDatasetMetadata,
  getPhidippidesMetadata,
  (domain, datasetUid, datasetMetadata, phidippidesMetadata) => {
    const datasetMetadataProvider = new MetadataProvider({domain, datasetUid});

    return _.chain(phidippidesMetadata.columns).
      map(injectFieldName).
      filter(isNotSystemColumn).
      filter(isNotComputedColumn).
      filter(
        column =>
          !datasetMetadataProvider.
            isSubcolumn(column.fieldName, datasetMetadata)
      ).
      map(toDatasetMetadata(datasetMetadata)).
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

  var dimensionType = _.find(COLUMN_TYPES, column => {
    return dimension && dimension.renderTypeName === column.type
  });

  return _.filter(VISUALIZATION_TYPES, visualization => {
    return dimensionType && _.includes(dimensionType.preferredVisualizationTypes, visualization.type);
  });
};

export const getValidMeasures = createSelector(
  getDatasetMetadata,
  getPhidippidesMetadata,
  (datasetMetadata, phidippidesMetadata) => {
    return _.chain(phidippidesMetadata.columns).
      map(injectFieldName).
      filter(isNumericColumn).
      filter(isNotSystemColumn).
      filter(isNotComputedColumn).
      map(toDatasetMetadata(datasetMetadata)).
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

export const hasRegions = createSelector(
  getValidCuratedRegions,
  getValidComputedColumns,
  (curatedRegions, computedColumns) => curatedRegions.length > 0 || computedColumns.length > 0
);

export const getAnyLocationColumn = createSelector(
  getDatasetMetadata,
  (datasetMetadata) => _.find(datasetMetadata.columns, {renderTypeName: 'point'})
);

export const getSpandexDataProvider = createSelector(
  getDomain,
  getDatasetUid,
  (domain, datasetUid) => new SpandexDataProvider({ domain, datasetUid })
);

const toDatasetMetadata = (metadata) => (column) => _.find(metadata.columns, {fieldName: column.fieldName});

const isNotSystemColumn = column => {
  return !_.startsWith(column.name, ':');
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

const injectFieldName = (column, key) => {
  return _.set(column, 'fieldName', key);
};

const isNumericColumn = (column) => {
  var renderTypeName = _.get(column, 'renderTypeName');

  return (renderTypeName === 'number' || renderTypeName === 'money' || renderTypeName === 'percent');
};
