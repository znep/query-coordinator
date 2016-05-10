var _ = require('lodash');

var DEFAULT_VIF = {
  configuration: {
    axisLabels: {
      top: null,
      right: null,
      bottom: null,
      left: null
    },
    localization: {}
  },
  createdAt: null,
  description: null,
  format: {
    type: 'visualization_interchange_format',
    version: 2
  },
  scale: {
    x: {
      type: null,
      unit: {
        one: null,
        other: null
      }
    },
    y: {
      type: null
    }
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

  // 1. Assign scales
  switch (vifToMigrate.type) {

    case 'columnChart':
    case 'distributionChart':
    case 'choroplethMap':
      migratedVif.scale.x = {
        type: 'ordinal',
        unit: {
          one: null,
          other: null
        }
      };
      migratedVif.scale.y = {
        type: 'quantitative'
      };
      break;

    case 'timelineChart':
      migratedVif.scale.x = {
        type: 'time',
        unit: {
          one: null,
          other: null
        }
      };
      migratedVif.scale.y = {
        type: 'quantitative'
      };
      break;

    case 'featureMap':
    case 'table':
    default:
      migratedVif.scale.x = {
        type: null,
        unit: {
          one: null,
          other: null
        }
      };
      migratedVif.scale.y = {
        type: null
      };
  }

  // 2a. Create a series
  var series = {
    // color: {
    //   secondary: null
    // },
    dataSource: {
      datasetUid: vifToMigrate.datasetUid,
      dimension: {
        columnName: vifToMigrate.columnName,
        aggregationFunction: null
      },
      domain: vifToMigrate.domain,
      measure: {
        columnName: (!_.isUndefined(vifToMigrate.aggregation.field)) ?
          vifToMigrate.aggregation.field :
          null,
        aggregationFunction: vifToMigrate.aggregation.function
      },
      filters: _.cloneDeep(vifToMigrate.filters),
      type: 'socrata.soql'
    },
    label: 'Filtered',
    unit: {
      one: unit.one,
      other: unit.other
    }
  };
  // 2b. Assign a type and ascending value to the series
  switch (vifToMigrate.type) {

    case 'columnChart':
      series.dataSource.configuration = {
        ascending: false
      };
      series.type = 'columnChart';
      break;

    case 'timelineChart':
      series.type = 'timelineChart';
      break;

    case 'distributionChart':
      series.dataSource.configuration = {
        ascending: true
      };
      series.type = 'distributionChart';
      break;

    case 'choroplethMap':
      series.type = 'choroplethMap';
      break;

    case 'featureMap':
      series.type = 'featureMap';
      break;

    case 'table':
    default:
      series.type = 'table';
      break;
  }
  // 2c. Add it to the series array on the VIF
  migratedVif.series.push(series);

  // 3a. Merge the configuration object
  migratedVif.configuration = _.merge(
    migratedVif.configuration,
    vifToMigrate.configuration
  );
  // 3b. Explicitly remove the interactive and isMobile flags, since we no
  // longer differentiate.
  delete migratedVif.configuration.interactive;
  delete migratedVif.configuration.isMobile;

  // 4. Copy over the createdAt timestamp
  migratedVif.createdAt = vifToMigrate.createdAt;

  // 5a. Copy over the format object
  migratedVif.format = _.cloneDeep(vifToMigrate.format);
  // 5b. Update the version number in the format.
  migratedVif.format.version = 2;

  // 6. Copy over the origin object
  migratedVif.origin = _.cloneDeep(vifToMigrate.origin);

  return migratedVif;
}

module.exports = {
  getDefaultVif: getDefaultVif,
  migrateVif: migrateVif
};
