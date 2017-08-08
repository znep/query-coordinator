// This is VIF compatibility checker. It makes sure the socrata.soql
// data source is compatible with the demands of a visualization.
//
// The intent of this is to provide feedback while authoring a visualization,
// not to provide feedback to a developer. As such, messages returned are
// worded to make sense to a user.
const _ = require('lodash');
const I18n = require('common/i18n').default;
const MetadataProvider = require('./MetadataProvider');

// Obtains a soqlVifValidator (see below).
// Returns a Promise<soqlVifValidator>.
// The async is required because dataset metadata
// must be fetched.
//
// If this promise is rejected, dataset metadata
// failed to fetch.
export function getSoqlVifValidator(vif) {
  const metadataRequests = (vif.series || []).
    map((series) => {
      let metadataPromise;

      if (_.get(series, 'dataSource.type') === 'socrata.soql') {
        const metadataProviderConfig = {
          domain: _.get(series, 'dataSource.domain'),
          datasetUid: _.get(series, 'dataSource.datasetUid')
        };

        metadataPromise = new MetadataProvider(metadataProviderConfig).
          getDatasetMetadata();
      } else {
        metadataPromise = Promise.resolve({});
      }

      return metadataPromise;
    });

  return Promise.all(metadataRequests).
    then((metadataPerSeries) => soqlVifValidator(vif, metadataPerSeries));
}

// Checks a VIF data source for compatibility with a set of
// requirements (usually called by visualizations).
// The intent of this function is to provide feedback while
// authoring a visualization, not to provide feedback to a developer.
// As such, messages returned are worded to make sense to a user.
//
// Returns a chaining object. Example usage:
// var validation = soqlVifValidator(vif, datasetMetadata).
//   requireSingleSeries().
//   requireNumericDimension().
//   validate();
// if (!validation.ok) {
//   alert(validation.errorMessages.join('\n');
// }
//
// Methods:
//
// .requireAtLeastOneSeries()
//   Requires at least one series.
// .requireExactlyOneSeries()
//   Requires exactly one series.
// .requireAllSeriesFromSameDomain()
//   Requires all series to be sourced from the same domain.
// .requireNoMeasureAggregation()
//   Requires that all measure columns are NOT aggregated in some way (count(*) counts
//   as an aggregation and therefore does not satisfy the condition).
// .requireMeasureAggregation()
//   Requires that all measure columns are aggregated in some way (count(*) counts
//   as an aggregation).
// .requireCalendarDateDimension()
//   Requires all dimension columns to be time.
// .requirePointDimension()
//   Requires all dimension columns to be location.
// .requireNumericDimension()
//   Requires all dimension columns to be numeric.
// .validate()
//   If the VIF conforms to the requirements, { ok: true } is returned.
//   If the VIF does not conform, an object is returned:
//   {
//     ok: false,
//     errorMessages: Array<String>
//   }
// .toPromise()
//   Wraps the return value of .validate() in a promise.
//   If the VIF conforms to the requirements, the promise is
//   resolved. If not, the error object from .validate() is used
//   as a rejection.
export function soqlVifValidator(vif, datasetMetadataPerSeries) {
  const errorMessages = [];
  const addError = (errorMessage) => errorMessages.push(errorMessage);
  const allSeries = _.get(vif, 'series', []);
  const getColumn = (columnName, seriesIndex) => {

    const column = _.find(
      datasetMetadataPerSeries[seriesIndex].columns,
      { fieldName: columnName }
    );

    if (_.isUndefined(column)) {

      throw new Error(
        `[soqlVifValidator] column "${columnName}" does not exist in dataset.`
      );
    }

    return column;
  };

  const hasColumnWithType = (type, seriesIndex) => {
    const column = _.find(datasetMetadataPerSeries[seriesIndex].columns, (c) => c.renderTypeName === type);
    return !_.isUndefined(column);
  };

  if (allSeries.length !== datasetMetadataPerSeries.length) {
    throw new Error('vif.series.length does not match datasetMetadataPerSeries.length');
  }

  allSeries.forEach((series) => {
    const dataSourceType = _.get(series, 'dataSource.type');

    switch (dataSourceType) {

      case 'socrata.soql':
      case 'socrata.sample':
        break;

      default:
        throw new Error(`Cannot validate unknown dataSource type: ${dataSourceType}`);
    }
  });

  const validator = {

    requireAtLeastOneSeries() {
      if (allSeries.length === 0) {
        addError(I18n.t('shared.visualizations.charts.common.validation.errors.need_at_least_one_series'));
      }
      return validator;
    },

    requireExactlyOneSeries() {
      if (allSeries.length !== 1) {
        addError(I18n.t('shared.visualizations.charts.common.validation.errors.need_single_series'));
      }
      return validator;
    },

    requireExactlyOneSeriesIfDimensionGroupingEnabled() {
      const groupingFromVif = _.get(
        vif,
        'series[0].dataSource.dimension.grouping.columnName',
        null
      );
      const groupingIsEnabled = _.isString(groupingFromVif) && !_.isEmpty(groupingFromVif);

      if (allSeries.length !== 1 && groupingIsEnabled) {
        addError(I18n.t('shared.visualizations.charts.common.validation.errors.need_single_series_if_grouping_enabled'));
      }

      return validator;
    },

    requireAllSeriesFromSameDomain() {
      const allDomains = allSeries.map((series) => _.get(series, 'dataSource.domain'));
      const uniqDomains = _.uniq(allDomains);
      if (uniqDomains.length > 1) {
        addError(I18n.t('shared.visualizations.charts.common.validation.errors.need_all_series_from_same_domain'));
      }
      return validator;
    },

    requireNoMeasureAggregation() {
      allSeries.forEach((series) => {
        if (_.get(series, 'dataSource.measure.aggregationFunction')) {
          addError(I18n.t('shared.visualizations.charts.common.validation.errors.need_no_aggregation'));
        }
      });
      return validator;
    },

    requireMeasureAggregation() {
      allSeries.forEach((series) => {
        if (!_.get(series, 'dataSource.measure.aggregationFunction')) {
          addError(I18n.t('shared.visualizations.charts.common.validation.errors.need_aggregation'));
        }
      });
      return validator;
    },

    requirePointDimension() {
      allSeries.forEach((series, seriesIndex) => {
        const columnName = _.get(series, 'dataSource.dimension.columnName');
        const renderTypeName = getColumn(columnName, seriesIndex).renderTypeName;
        if (renderTypeName !== 'point') {
          if (hasColumnWithType('point', seriesIndex)) {
            addError(I18n.t('shared.visualizations.charts.common.validation.errors.dimension_column_should_be_point'));
          } else {
            addError(I18n.t('shared.visualizations.charts.common.validation.errors.dataset_does_not_include_point_column'));
          }
        }
      });
      return validator;
    },

    requireCalendarDateDimension() {
      allSeries.forEach((series, seriesIndex) => {
        const columnName = _.get(series, 'dataSource.dimension.columnName');
        const renderTypeName = getColumn(columnName, seriesIndex).renderTypeName;
        if (renderTypeName !== 'calendar_date') {
          if (hasColumnWithType('calendar_date', seriesIndex)) {
            addError(I18n.t('shared.visualizations.charts.common.validation.errors.dimension_column_should_be_calendar_date'));
          } else {
            addError(I18n.t('shared.visualizations.charts.common.validation.errors.dataset_does_not_include_calendar_date_column'));
          }
        }
      });
      return validator;
    },

    requireNumericDimension() {
      allSeries.forEach((series, seriesIndex) => {
        const columnName = _.get(series, 'dataSource.dimension.columnName');
        const renderTypeName = getColumn(columnName, seriesIndex).renderTypeName;
        if (renderTypeName !== 'number' && renderTypeName !== 'money') {
          if (hasColumnWithType('number', seriesIndex) || hasColumnWithType('money', seriesIndex)) {
            addError(I18n.t('shared.visualizations.charts.common.validation.errors.dimension_column_should_be_numeric'));
          } else {
            addError(I18n.t('shared.visualizations.charts.common.validation.errors.dataset_does_not_include_numeric_column'));
          }
        }
      });
      return validator;
    },

    validate() {
      if (errorMessages.length > 0) {
        return { ok: false, errorMessages };
      } else {
        return { ok: true };
      }
    },
    toPromise() {
      const validation = validator.validate();
      if (validation.ok) {
        return Promise.resolve();
      } else {
        return Promise.reject(validation);
      }
    }
  };

  return validator;
}
