var _ = require('lodash');

var DEFAULT_VIF = {
  configuration: {
    axisLabels: {
      top: false,
      right: false,
      bottom: false,
      left: false
    },
    localization: {}
  },
  createdAt: null,
  description: null,
  format: {
    type: 'visualization_interchange_format',
    version: 2
  },
  series: [],
  title: null
};

/**
 * Public methods
 */

function getDefaultVif() {
  return _.cloneDeep(DEFAULT_VIF);
}

function migrateVif(vifToMigrate) {
  var version = parseInt(_.get(vifToMigrate, 'format.version', 1), 10);

  switch (version) {
    case 1:
      return migrateVif1ToVif2(vifToMigrate);

    default:
      return vifToMigrate;
  }
}

/**
 * Private methods
 */

function migrateVif1ToVif2(vifToMigrate) {
  var migratedVif = getDefaultVif();
  var unit = {
    one: _.get(vifToMigrate, 'unit.one', null),
    other: _.get(vifToMigrate, 'unit.other', null)
  };

  // 1a. Create a series
  //
  // Note that the legacy AddVisualization workflow in the DataLens app will
  // sometimes not include an aggregation property on VIFs that it exports.
  //
  // This is blatantly incorrect behavior, but it does not seem economical to
  // attempt to fix it since that workflow will be replaced soon (as of May
  // 2016).
  //
  // Accordingly, we fetch the aggregation field and function ahead of time
  // and default to sane values if the properties or the root-level aggregation
  // property doesn't exist.
  var aggregationField = _.get(
    vifToMigrate,
    'aggregation.field',
    null
  );
  var aggregationFunction = _.get(
    vifToMigrate,
    'aggregation.function',
    'count'
  );
  var series = {
    dataSource: {
      datasetUid: vifToMigrate.datasetUid,
      dimension: {
        columnName: vifToMigrate.columnName,
        aggregationFunction: null
      },
      domain: vifToMigrate.domain,
      measure: {
        columnName: (aggregationField !== null) ?
          aggregationField :
          null,
        aggregationFunction: aggregationFunction
      },
      filters: _.cloneDeep(vifToMigrate.filters),
      type: 'socrata.soql'
    },
    label: 'Value',
    unit: {
      one: unit.one,
      other: unit.other
    }
  };

  // 1b. Assign a type and ascending value to the series
  switch (vifToMigrate.type) {

    case 'columnChart':
      series.dataSource.configuration = {
        ascending: false
      };
      series.type = 'columnChart';
      break;

    case 'timelineChart':

      if (!_.isUndefined(_.get(vifToMigrate, 'configuration.precision'))) {

        _.set(
          series,
          'dataSource.precision',
          _.get(
            vifToMigrate,
            'configuration.precision'
          )
        );
      }

      series.type = 'timelineChart';
      break;

    case 'distributionChart':
      series.dataSource.configuration = {
        ascending: true
      };
      series.type = 'distributionChart';
      break;

    case 'choroplethMap':
      series.type = 'regionMap';
      break;

    case 'featureMap':

      if (_.has(vifToMigrate, 'configuration.pointColor')) {
        _.set(series, 'color.primary', vifToMigrate.configuration.pointColor);
      }

      series.type = 'featureMap';
      break;

    case 'table':
    default:
      series.type = 'table';
      break;
  }

  // 1c. Add it to the series array on the VIF
  migratedVif.series.push(series);

  // 2a. Merge the configuration object
  migratedVif.configuration = _.merge(
    migratedVif.configuration,
    vifToMigrate.configuration
  );

  // 2c. Explicitly remove deprecated configuration values.
  _.unset(migratedVif, 'configuration.localization');
  _.unset(migratedVif, 'configuration.interactive');
  _.unset(migratedVif, 'configuration.hover');
  _.unset(migratedVif, 'configuration.isMobile');
  _.unset(migratedVif, 'configuration.pointColor');
  _.unset(migratedVif, 'configuration.tileserverHosts');
  _.unset(migratedVif, 'configuration.shapefile.columns');

  // 3. Copy over the createdAt timestamp
  migratedVif.createdAt = vifToMigrate.createdAt;

  // 4a. Copy over the format object
  migratedVif.format = _.cloneDeep(
    _.get(
      vifToMigrate,
      'format',
      {
        type: 'visualization_interchange_format',
        version: 1
      }
    )
  );

  // 4b. Update the version number in the format.
  migratedVif.format.version = 2;

  // 5. Copy over the origin object
  migratedVif.origin = _.cloneDeep(vifToMigrate.origin);

  return migratedVif;
}

module.exports = {
  getDefaultVif: getDefaultVif,
  migrateVif: migrateVif
};
