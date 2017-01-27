const _ = require('lodash');
const rewire = require('rewire');
const GroupedCategoricalDataManagerAPI = rewire('../../src/dataProviders/GroupedCategoricalDataManager');

const VALID_VIF_WITH_DIMENSION_GROUPING = {
  configuration: {
    showOtherCategory: false
  },
  format: {
    type: 'visualization_interchange_format',
    version: 2
  },
  series: [
    {
      dataSource: {
        datasetUid: 'four-four',
        dimension: {
          columnName: 'blood_alcohol_level',
          aggregationFunction: null,
          grouping: {
            columnName: 'plausibility'
          }
        },
        domain: 'example.com',
        filters: [],
        limit: 5,
        measure: {
          columnName: null,
          aggregationFunction: 'count'
        },
        type: 'socrata.soql'
      },
      type: 'barChart'
    }
  ]
};
const MAX_ROW_COUNT = 1000;
const GROUPING_QUERY_VIFS = {
  '{"configuration":{"showOtherCategory":false},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"10"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"10","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
    columns: ['__dimension_alias__', '__measure_alias__'],
    rows: [
      ["0.5", 13],
      ["0.49", 11],
      ["0.48", 22],
      ["0.47", 14],
      ["0.46", 18]
    ]
  },
  '{"configuration":{"showOtherCategory":false},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"9"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"9","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
    columns: ['__dimension_alias__', '__measure_alias__'],
    rows: [
      ["0.5", 13],
      ["0.49", 11],
      ["0.48", 22],
      ["0.47", 14],
      ["0.46", 18]
    ]
  },
  '{"configuration":{"showOtherCategory":false},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"8"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"8","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
    columns: ['__dimension_alias__', '__measure_alias__'],
    rows: [
      ["0.5", 13],
      ["0.49", 11],
      ["0.48", 22],
      ["0.47", 14],
      ["0.46", 18]
    ]
  },
  '{"configuration":{"showOtherCategory":false},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"7"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"7","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
    columns: ['__dimension_alias__', '__measure_alias__'],
    rows: [
      ["0.5", 13],
      ["0.49", 11],
      ["0.48", 22],
      ["0.47", 14],
      ["0.46", 18]
    ]
  },
  '{"configuration":{"showOtherCategory":false},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"6"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"6","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
    columns: ['__dimension_alias__', '__measure_alias__'],
    rows: [
      ["0.5", 13],
      ["0.49", 11],
      ["0.48", 22],
      ["0.47", 14],
      ["0.46", 18]
    ]
  },
  '{"configuration":{"showOtherCategory":false},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"5"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"5","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
    columns: ['__dimension_alias__', '__measure_alias__'],
    rows: [
      ["0.5", 13],
      ["0.49", 11],
      ["0.48", 22],
      ["0.47", 14],
      ["0.46", 18]
    ]
  },
  '{"configuration":{"showOtherCategory":false},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"4"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"4","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
    columns: ['__dimension_alias__', '__measure_alias__'],
    rows: [
      ["0.5", 13],
      ["0.49", 11],
      ["0.48", 22],
      ["0.47", 14],
      ["0.46", 18]
    ]
  },
  '{"configuration":{"showOtherCategory":false},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"3"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"3","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
    columns: ['__dimension_alias__', '__measure_alias__'],
    rows: [
      ["0.5", 13],
      ["0.49", 11],
      ["0.48", 22],
      ["0.47", 14],
      ["0.46", 18]
    ]
  },
  '{"configuration":{"showOtherCategory":false},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"2"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"2","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
    columns: ['__dimension_alias__', '__measure_alias__'],
    rows: [
      ["0.5", 13],
      ["0.49", 11],
      ["0.48", 22],
      ["0.47", 14],
      ["0.46", 18]
    ]
  },
  '{"configuration":{"showOtherCategory":false},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"1"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"1","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
    columns: ['__dimension_alias__', '__measure_alias__'],
    rows: [
      ["0.5", 13],
      ["0.49", 11],
      ["0.48", 22],
      ["0.47", 14],
      ["0.46", 18]
    ]
  },
  '{"configuration":{"showOtherCategory":true},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"10"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"10","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
    columns: ['__dimension_alias__', '__measure_alias__'],
    rows: [
      ["0.5", 13],
      ["0.49", 11],
      ["0.48", 22],
      ["0.47", 14],
      ["0.46", 18],
      ["(Other)", 100]
    ]
  },
  '{"configuration":{"showOtherCategory":true},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"9"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"9","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
    columns: ['__dimension_alias__', '__measure_alias__'],
    rows: [
      ["0.5", 13],
      ["0.49", 11],
      ["0.48", 22],
      ["0.47", 14],
      ["0.46", 18],
      ["(Other)", 100]
    ]
  },
  '{"configuration":{"showOtherCategory":true},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"8"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"8","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
    columns: ['__dimension_alias__', '__measure_alias__'],
    rows: [
      ["0.5", 13],
      ["0.49", 11],
      ["0.48", 22],
      ["0.47", 14],
      ["0.46", 18],
      ["(Other)", 100]
    ]
  },
  '{"configuration":{"showOtherCategory":true},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"7"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"7","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
    columns: ['__dimension_alias__', '__measure_alias__'],
    rows: [
      ["0.5", 13],
      ["0.49", 11],
      ["0.48", 22],
      ["0.47", 14],
      ["0.46", 18],
      ["(Other)", 100]
    ]
  },
  '{"configuration":{"showOtherCategory":true},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"=","operand":"6"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":[{"operator":"=","operand":"0.5"},{"operator":"=","operand":"0.49"},{"operator":"=","operand":"0.48"},{"operator":"=","operand":"0.47"},{"operator":"=","operand":"0.46"}]}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"6","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
    columns: ['__dimension_alias__', '__measure_alias__'],
    rows: [
      ["0.5", 13],
      ["0.49", 11],
      ["0.48", 22],
      ["0.47", 14],
      ["0.46", 18],
      ["(Other)", 100]
    ]
  },
  '{"configuration":{"showOtherCategory":true},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"10"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"9"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"8"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"7"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"6"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":{"operator":"=","operand":"0.5"}}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"(Other)","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
    columns: ['__dimension_alias__', '__measure_alias__'],
    rows: [
      ["0.5", 13],
      ["(Other)", 100]
    ]
  },
  '{"configuration":{"showOtherCategory":true},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"10"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"9"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"8"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"7"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"6"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":{"operator":"=","operand":"0.49"}}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"(Other)","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
    columns: ['__dimension_alias__', '__measure_alias__'],
    rows: [
      ["0.49", 11],
      ["(Other)", 100]
    ]
  },
  '{"configuration":{"showOtherCategory":true},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"10"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"9"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"8"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"7"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"6"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":{"operator":"=","operand":"0.48"}}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"(Other)","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
    columns: ['__dimension_alias__', '__measure_alias__'],
    rows: [
      ["0.48", 22],
      ["(Other)", 100]
    ]
  },
  '{"configuration":{"showOtherCategory":true},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"10"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"9"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"8"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"7"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"6"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":{"operator":"=","operand":"0.47"}}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"(Other)","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
    columns: ['__dimension_alias__', '__measure_alias__'],
    rows: [
      ["0.47", 14],
      ["(Other)", 100]
    ]
  },
  '{"configuration":{"showOtherCategory":true},"series":[{"dataSource":{"datasetUid":"four-four","dimension":{"columnName":"blood_alcohol_level","aggregationFunction":null,"grouping":{"columnName":"plausibility"}},"domain":"example.com","filters":[{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"10"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"9"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"8"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"7"}},{"function":"binaryOperator","columnName":"plausibility","arguments":{"operator":"!=","operand":"6"}},{"function":"binaryOperator","columnName":"blood_alcohol_level","arguments":{"operator":"=","operand":"0.46"}}],"limit":5,"measure":{"columnName":null,"aggregationFunction":"count"},"type":"socrata.soql"},"label":"(Other)","type":"barChart"}],"format":{"type":"visualization_interchange_format","version":2}}': {
    columns: ['__dimension_alias__', '__measure_alias__'],
    rows: [
      ["0.46", 18],
      ["(Other)", 100]
    ]
  }
};

const mockMakeSocrataCategoricalDataRequest = function(vif, seriesIndex, maxRowCount) {
  const vifForQuery = _.cloneDeep(vif);
  vifForQuery.series[0].dataSource.filters.forEach((filter) => {
    if (_.isArray(filter.arguments)) {
      filter.arguments = _.sortBy(
        filter.arguments,
        [
          (filterArgument) => {
            return filterArgument.operand;
          }
        ]
      );
    }
  });
  vifForQuery.series[0].dataSource.filters = _.sortBy((filter) => {
    if (_.isArray(filter.arguments)) {
      return JSON.stringify(filter);
    }

    return filter.arguments.operand;
  });
  _.unset(vifForQuery, 'series[0].dataSource.orderBy');

  let stringifiedGroupingQueryVif;
  let queryResponse = false;

  for (stringifiedGroupingQueryVif in GROUPING_QUERY_VIFS) {
    const groupingQueryVif = JSON.parse(stringifiedGroupingQueryVif);
    // The filters property is an array, which means that a strict
    // equality comparison will take into account its order. Its order
    // does not actually matter in this case and makes it harder to
    // match the the query vif against one of the expected ones.
    // To simplify things a bit, we will just sort the filters array
    // on both the query vif and all vifs to which it is compared.
    // Additionally, where the arguments property of a filter is an
    // array, we sort this too. This is awful and hacky.
    groupingQueryVif.series[0].dataSource.filters.forEach((filter) => {
      if (_.isArray(filter.arguments)) {
        filter.arguments = _.sortBy(
          filter.arguments,
          [
            (filterArgument) => {
              return filterArgument.operand;
            }
          ]
        );
      }
    });
    groupingQueryVif.series[0].dataSource.filters = _.sortBy((filter) => {
      if (_.isArray(filter.arguments)) {
        return JSON.stringify(filter);
      }

      return filter.arguments.operand;
    });

    if (_.isEqual(vifForQuery, groupingQueryVif)) {
      queryResponse = GROUPING_QUERY_VIFS[stringifiedGroupingQueryVif];
      break;
    }
  }
  
  if (queryResponse) {
    return queryResponse;
  } else {
    throw new Error(
      `Could not match vif against expected vifs for grouping queries: "${JSON.stringify(vif)}"`
    );
  }
};

describe('GroupedCategoricalDataManager', () => {

  describe('When not showing the "other" category', () => {
    const DIMENSION_VALUES_DIMENSION_ASC_QUERY = 'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ GROUP BY `blood_alcohol_level` ORDER BY __dimension_alias__ ASC NULL LAST LIMIT 5'
    const DIMENSION_VALUES_DIMENSION_ASC_DATA = {
      columns: ['__dimension_alias__', '__measure_alias__'],
      rows: [
        ["0.46", 18],
        ["0.47", 14],
        ["0.48", 22],
        ["0.49", 11],
        ["0.5", 13]
      ]
    };
    const DIMENSION_VALUES_DIMENSION_DESC_QUERY = 'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ GROUP BY `blood_alcohol_level` ORDER BY __dimension_alias__ DESC NULL LAST LIMIT 5'
    const DIMENSION_VALUES_DIMENSION_DESC_DATA = {
      columns: ['__dimension_alias__', '__measure_alias__'],
      rows: [
        ["0.5", 13],
        ["0.49", 11],
        ["0.48", 22],
        ["0.47", 14],
        ["0.46", 18]
      ]
    };
    const DIMENSION_VALUES_MEASURE_ASC_QUERY = 'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ ASC NULL LAST LIMIT 5'
    const DIMENSION_VALUES_MEASURE_ASC_DATA = {
      columns: ['__dimension_alias__', '__measure_alias__'],
      rows: [
        ["0.49", 11],
        ["0.5", 13],
        ["0.47", 14],
        ["0.46", 18],
        ["0.48", 22]
      ]
    };
    const DIMENSION_VALUES_MEASURE_DESC_QUERY = 'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 5'
    const DIMENSION_VALUES_MEASURE_DESC_DATA = {
      columns: ['__dimension_alias__', '__measure_alias__'],
      rows: [
        ["0.48", 22],
        ["0.46", 18],
        ["0.47", 14],
        ["0.5", 13],
        ["0.49", 11]
      ]
    };
    const GROUPING_VALUES_DIMENSION_ASC_QUERY = 'SELECT `plausibility` AS __dimension_alias__ GROUP BY `plausibility` ORDER BY __dimension_alias__ ASC LIMIT 12';
    const GROUPING_VALUES_DIMENSION_ASC_DATA = {
      columns: ['__dimension_alias__', '__measure_alias__'],
      rows: [
        ["1", undefined],
        ["2", undefined],
        ["3", undefined],
        ["4", undefined],
        ["5", undefined], 
        ["6", undefined],
        ["7", undefined],
        ["8", undefined],
        ["9", undefined],
        ["10", undefined],
      ]
    };
    const GROUPING_VALUES_DIMENSION_DESC_QUERY = 'SELECT `plausibility` AS __dimension_alias__ GROUP BY `plausibility` ORDER BY __dimension_alias__ DESC LIMIT 12';
    const GROUPING_VALUES_DIMENSION_DESC_DATA = {
      columns: ['__dimension_alias__', '__measure_alias__'],
      rows: [
        ["10", undefined],
        ["9", undefined],
        ["8", undefined],
        ["7", undefined],
        ["6", undefined],
        ["5", undefined],
        ["4", undefined],
        ["3", undefined],
        ["2", undefined],
        ["1", undefined],
      ]
    };

    let revertGroupedCategoricalDataManagerAPI;

    beforeEach(() => {

      revertGroupedCategoricalDataManagerAPI = GroupedCategoricalDataManagerAPI.__set__(
        {
          SoqlDataProvider: function() {

            this.query = function(queryString) {

              switch (decodeURIComponent(queryString.trim())) {

                case DIMENSION_VALUES_DIMENSION_ASC_QUERY:
                  return Promise.resolve(DIMENSION_VALUES_DIMENSION_ASC_DATA);

                case DIMENSION_VALUES_DIMENSION_DESC_QUERY:
                  return Promise.resolve(DIMENSION_VALUES_DIMENSION_DESC_DATA);

                case DIMENSION_VALUES_MEASURE_ASC_QUERY:
                  return Promise.resolve(DIMENSION_VALUES_MEASURE_ASC_DATA);

                case DIMENSION_VALUES_MEASURE_DESC_QUERY:
                  return Promise.resolve(DIMENSION_VALUES_MEASURE_DESC_DATA);

                case GROUPING_VALUES_DIMENSION_ASC_QUERY:
                  return Promise.resolve(GROUPING_VALUES_DIMENSION_ASC_DATA);

                case GROUPING_VALUES_DIMENSION_DESC_QUERY:
                  return Promise.resolve(GROUPING_VALUES_DIMENSION_DESC_DATA);

                default:
                  return Promise.reject(`Unrecognized query: "${decodeURIComponent(queryString.trim())}".`);
              }
            };
          },
          makeSocrataCategoricalDataRequest: mockMakeSocrataCategoricalDataRequest
        }
      );
    });

    afterEach(() => {
      revertGroupedCategoricalDataManagerAPI();
    });

    describe('when sorting by dimension, ascending', () => {

      it('returns the expected grouped data.', () => {
        const vif = _.cloneDeep(VALID_VIF_WITH_DIMENSION_GROUPING);
        vif.series[0].dataSource.orderBy = {
          parameter: 'dimension',
          sort: 'asc'
        };

        return GroupedCategoricalDataManagerAPI.getData(
          vif,
          {MAX_ROW_COUNT: MAX_ROW_COUNT}
        ).
          then((response) => {
            const expectedRows = [
              ["0.46", 18, 18, 18, 18, 18, 18, 18, 18, 18, 18],
              ["0.47", 14, 14, 14, 14, 14, 14, 14, 14, 14, 14],
              ["0.48", 22, 22, 22, 22, 22, 22, 22, 22, 22, 22],
              ["0.49", 11, 11, 11, 11, 11, 11, 11, 11, 11, 11],
              ["0.5", 13, 13, 13, 13, 13, 13, 13, 13, 13, 13]
            ];

            // Make assertions about the 'data' that came back to see if it's in the right shape.
            assert.deepEqual(response.columns, ['dimension', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
            assert.deepEqual(response.rows, expectedRows);
          }).
          catch((error) => {

            console.error(error);
            throw error;
          });
      });
    });

    describe('when sorting by dimension, descending', () => {

      it('returns the expected grouped data.', () => {
        const vif = _.cloneDeep(VALID_VIF_WITH_DIMENSION_GROUPING);
        vif.series[0].dataSource.orderBy = {
          parameter: 'dimension',
          sort: 'desc'
        };

        return GroupedCategoricalDataManagerAPI.getData(
          vif,
          {MAX_ROW_COUNT: MAX_ROW_COUNT}
        ).
          then((response) => {
            const expectedRows = [
              ["0.5", 13, 13, 13, 13, 13, 13, 13, 13, 13, 13],
              ["0.49", 11, 11, 11, 11, 11, 11, 11, 11, 11, 11],
              ["0.48", 22, 22, 22, 22, 22, 22, 22, 22, 22, 22],
              ["0.47", 14, 14, 14, 14, 14, 14, 14, 14, 14, 14],
              ["0.46", 18, 18, 18, 18, 18, 18, 18, 18, 18, 18]
            ];

            // Make assertions about the 'data' that came back to see if it's in the right shape.
            assert.deepEqual(response.columns, ['dimension', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1']);
            assert.deepEqual(response.rows, expectedRows);
          }).
          catch((error) => {

            console.error(error);
            throw error;
          });
      });
    });

    describe('when sorting by measure, ascending', () => {

      it('returns the expected grouped data.', () => {
        const vif = _.cloneDeep(VALID_VIF_WITH_DIMENSION_GROUPING);
        vif.series[0].dataSource.orderBy = {
          parameter: 'measure',
          sort: 'asc'
        };

        return GroupedCategoricalDataManagerAPI.getData(
          vif,
          {MAX_ROW_COUNT: MAX_ROW_COUNT}
        ).
          then((response) => {
            const expectedRows = [
              ["0.49", 11, 11, 11, 11, 11, 11, 11, 11, 11, 11],
              ["0.5", 13, 13, 13, 13, 13, 13, 13, 13, 13, 13],
              ["0.47", 14, 14, 14, 14, 14, 14, 14, 14, 14, 14],
              ["0.46", 18, 18, 18, 18, 18, 18, 18, 18, 18, 18],
              ["0.48", 22, 22, 22, 22, 22, 22, 22, 22, 22, 22]
            ];

            // Make assertions about the 'data' that came back to see if it's in the right shape.
            assert.deepEqual(response.columns, ['dimension', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
            assert.deepEqual(response.rows, expectedRows);
          }).
          catch((error) => {

            console.error(error);
            throw error;
          });
      });
    });

    describe('when sorting by measure, descending', () => {

      it('returns the expected grouped data.', () => {
        const vif = _.cloneDeep(VALID_VIF_WITH_DIMENSION_GROUPING);
        vif.series[0].dataSource.orderBy = {
          parameter: 'measure',
          sort: 'desc'
        };

        return GroupedCategoricalDataManagerAPI.getData(
          vif,
          {MAX_ROW_COUNT: MAX_ROW_COUNT}
        ).
          then((response) => {
            const expectedRows = [
              ["0.48", 22, 22, 22, 22, 22, 22, 22, 22, 22, 22],
              ["0.46", 18, 18, 18, 18, 18, 18, 18, 18, 18, 18],
              ["0.47", 14, 14, 14, 14, 14, 14, 14, 14, 14, 14],
              ["0.5", 13, 13, 13, 13, 13, 13, 13, 13, 13, 13],
              ["0.49", 11, 11, 11, 11, 11, 11, 11, 11, 11, 11]
            ];

            // Make assertions about the 'data' that came back to see if it's in the right shape.
            assert.deepEqual(response.columns, ['dimension', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1']);
            assert.deepEqual(response.rows, expectedRows);
          }).
          catch((error) => {

            console.error(error);
            throw error;
          });
      });
    });
  });

  describe('when showing the "other" category', () => {
    const DIMENSION_VALUES_DIMENSION_ASC_QUERY = 'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ GROUP BY `blood_alcohol_level` ORDER BY __dimension_alias__ ASC NULL LAST LIMIT 5'
    const DIMENSION_VALUES_DIMENSION_ASC_DATA = {
      columns: ['__dimension_alias__', '__measure_alias__'],
      rows: [
        ["0.5", 13],
        ["0.49", 11],
        ["0.48", 22],
        ["0.47", 14],
        ["0.46", 18]
      ]
    };
    const DIMENSION_VALUES_DIMENSION_DESC_QUERY = 'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ GROUP BY `blood_alcohol_level` ORDER BY __dimension_alias__ DESC NULL LAST LIMIT 5'
    const DIMENSION_VALUES_DIMENSION_DESC_DATA = {
      columns: ['__dimension_alias__', '__measure_alias__'],
      rows: [
        ["0.46", 18],
        ["0.47", 14],
        ["0.48", 22],
        ["0.49", 11],
        ["0.5", 13]
      ]
    };
    const DIMENSION_VALUES_MEASURE_ASC_QUERY = 'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ ASC NULL LAST LIMIT 5'
    const DIMENSION_VALUES_MEASURE_ASC_DATA = {
      columns: ['__dimension_alias__', '__measure_alias__'],
      rows: [
        ["0.49", 11],
        ["0.5", 13],
        ["0.47", 14],
        ["0.46", 18],
        ["0.48", 22]
      ]
    };
    const DIMENSION_VALUES_MEASURE_DESC_QUERY = 'SELECT `blood_alcohol_level` AS __dimension_alias__, COUNT(*) AS __measure_alias__ GROUP BY `blood_alcohol_level` ORDER BY __measure_alias__ DESC NULL LAST LIMIT 5'
    const DIMENSION_VALUES_MEASURE_DESC_DATA = {
      columns: ['__dimension_alias__', '__measure_alias__'],
      rows: [
        ["0.48", 22],
        ["0.46", 18],
        ["0.47", 14],
        ["0.5", 13],
        ["0.49", 11]
      ]
    };
    const GROUPING_VALUES_DIMENSION_ASC_QUERY = 'SELECT `plausibility` AS __dimension_alias__ GROUP BY `plausibility` ORDER BY __dimension_alias__ ASC LIMIT 5';
    const GROUPING_VALUES_DIMENSION_ASC_DATA = {
      columns: ['__dimension_alias__', '__measure_alias__'],
      rows: [
        ["6", undefined],
        ["7", undefined],
        ["8", undefined],
        ["9", undefined],
        ["10", undefined]
      ]
    };
    const GROUPING_VALUES_DIMENSION_DESC_QUERY = 'SELECT `plausibility` AS __dimension_alias__ GROUP BY `plausibility` ORDER BY __dimension_alias__ DESC LIMIT 5';
    const GROUPING_VALUES_DIMENSION_DESC_DATA = {
      columns: ['__dimension_alias__', '__measure_alias__'],
      rows: [
        ["10", undefined],
        ["9", undefined],
        ["8", undefined],
        ["7", undefined],
        ["6", undefined]
      ]
    };

    let revertGroupedCategoricalDataManagerAPI;

    beforeEach(() => {

      revertGroupedCategoricalDataManagerAPI = GroupedCategoricalDataManagerAPI.__set__(
        {
          SoqlDataProvider: function() {

            this.query = function(queryString) {

              switch (decodeURIComponent(queryString.trim())) {

                case DIMENSION_VALUES_DIMENSION_ASC_QUERY:
                  return Promise.resolve(DIMENSION_VALUES_DIMENSION_ASC_DATA);

                case DIMENSION_VALUES_DIMENSION_DESC_QUERY:
                  return Promise.resolve(DIMENSION_VALUES_DIMENSION_DESC_DATA);

                case DIMENSION_VALUES_MEASURE_ASC_QUERY:
                  return Promise.resolve(DIMENSION_VALUES_MEASURE_ASC_DATA);

                case DIMENSION_VALUES_MEASURE_DESC_QUERY:
                  return Promise.resolve(DIMENSION_VALUES_MEASURE_DESC_DATA);

                case GROUPING_VALUES_DIMENSION_ASC_QUERY:
                  return Promise.resolve(GROUPING_VALUES_DIMENSION_ASC_DATA);

                case GROUPING_VALUES_DIMENSION_DESC_QUERY:
                  return Promise.resolve(GROUPING_VALUES_DIMENSION_DESC_DATA);

                default:
                  return Promise.reject(`Unrecognized query: "${decodeURIComponent(queryString.trim())}".`);
              }
            };
          },
          makeSocrataCategoricalDataRequest: mockMakeSocrataCategoricalDataRequest,
          MAX_GROUP_COUNT: 5
        }
      );
    });

    afterEach(() => {
      revertGroupedCategoricalDataManagerAPI();
    });

    describe('when sorting by dimension, ascending', () => {

      it('returns the expected grouped data.', () => {
        const vif = _.cloneDeep(VALID_VIF_WITH_DIMENSION_GROUPING);
        vif.series[0].dataSource.orderBy = {
          parameter: 'dimension',
          sort: 'asc'
        };
        vif.configuration.showOtherCategory = true;

        return GroupedCategoricalDataManagerAPI.getData(
          vif,
          {MAX_ROW_COUNT: MAX_ROW_COUNT}
        ).
          then((response) => {
            const expectedRows = [
              ["0.46", 18, 18, 18, 18, 18, 13],
              ["0.47", 14, 14, 14, 14, 14, 13],
              ["0.48", 22, 22, 22, 22, 22, 13],
              ["0.49", 11, 11, 11, 11, 11, 13],
              ["0.5", 13, 13, 13, 13, 13, 13],
              ["(Other)", 100, 100, 100, 100, 100, null]
            ];

            // Make assertions about the 'data' that came back to see if it's in the right shape.
            assert.deepEqual(response.columns, ['dimension', '6', '7', '8', '9', '10', '(Other)']);
            assert.deepEqual(response.rows, expectedRows);
          }).
          catch((error) => {

            console.error(error);
            throw error;
          });
      });
    });

    describe('when sorting by dimension, descending', () => {

      it('returns the expected grouped data.', () => {
        const vif = _.cloneDeep(VALID_VIF_WITH_DIMENSION_GROUPING);
        vif.series[0].dataSource.orderBy = {
          parameter: 'dimension',
          sort: 'desc'
        };
        vif.configuration.showOtherCategory = true;

        return GroupedCategoricalDataManagerAPI.getData(
          vif,
          {MAX_ROW_COUNT: MAX_ROW_COUNT}
        ).
          then((response) => {
            const expectedRows = [
              ["0.5", 13, 13, 13, 13, 13, 13],
              ["0.49", 11, 11, 11, 11, 11, 13],
              ["0.48", 22, 22, 22, 22, 22, 13],
              ["0.47", 14, 14, 14, 14, 14, 13],
              ["0.46", 18, 18, 18, 18, 18, 13],
              ["(Other)", 100, 100, 100, 100, 100, null]
            ];

            // Make assertions about the 'data' that came back to see if it's in the right shape.
            assert.deepEqual(response.columns, ['dimension', '10', '9', '8', '7', '6', '(Other)']);
            assert.deepEqual(response.rows, expectedRows);
          }).
          catch((error) => {

            console.error(error);
            throw error;
          });
      });
    });

    describe('when sorting by measure, ascending', () => {

      it('returns the expected grouped data.', () => {
        const vif = _.cloneDeep(VALID_VIF_WITH_DIMENSION_GROUPING);
        vif.series[0].dataSource.orderBy = {
          parameter: 'measure',
          sort: 'asc'
        };
        vif.configuration.showOtherCategory = true;

        return GroupedCategoricalDataManagerAPI.getData(
          vif,
          {MAX_ROW_COUNT: MAX_ROW_COUNT}
        ).
          then((response) => {
            const expectedRows = [
              ["0.49", 11, 11, 11, 11, 11, 13],
              ["0.5", 13, 13, 13, 13, 13, 13],
              ["0.47", 14, 14, 14, 14, 14, 13],
              ["0.46", 18, 18, 18, 18, 18, 13],
              ["0.48", 22, 22, 22, 22, 22, 13],
              ["(Other)", 100, 100, 100, 100, 100, null]
            ];

            // Make assertions about the 'data' that came back to see if it's in the right shape.
            assert.deepEqual(response.columns, ['dimension', '6', '7', '8', '9', '10', '(Other)']);
            assert.deepEqual(response.rows, expectedRows);
          }).
          catch((error) => {

            console.error(error);
            throw error;
          });
      });
    });

    describe('when sorting by measure, descending', () => {

      it('returns the expected grouped data.', () => {
        const vif = _.cloneDeep(VALID_VIF_WITH_DIMENSION_GROUPING);
        vif.series[0].dataSource.orderBy = {
          parameter: 'measure',
          sort: 'desc'
        };
        vif.configuration.showOtherCategory = true;

        return GroupedCategoricalDataManagerAPI.getData(
          vif,
          {MAX_ROW_COUNT: MAX_ROW_COUNT}
        ).
          then((response) => {
            const expectedRows = [
              ["(Other)", 100, 100, 100, 100, 100, null],
              ["0.48", 22, 22, 22, 22, 22, 13],
              ["0.46", 18, 18, 18, 18, 18, 13],
              ["0.47", 14, 14, 14, 14, 14, 13],
              ["0.5", 13, 13, 13, 13, 13, 13],
              ["0.49", 11, 11, 11, 11, 11, 13]
            ];

            // Make assertions about the 'data' that came back to see if it's in the right shape.
            assert.deepEqual(response.columns, ['dimension', '10', '9', '8', '7', '6', '(Other)']);
            assert.deepEqual(response.rows, expectedRows);
          }).
          catch((error) => {

            console.error(error);
            throw error;
          });
      });
    });
  });
});
