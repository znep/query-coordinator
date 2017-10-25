import _ from 'lodash';
import sinon from 'sinon';
import { expect, assert } from 'chai';

var TEST_VIEW = {
  "id": "nuke-xavt",
  "name": "",
  "description": "",
  "displayType": "table",
  "newBackend": true,
  "columns": [
    {
      "id": 1670,
      "name": "id",
      "dataTypeName": "text",
      "fieldName": "id",
      "position": 1,
      "renderTypeName": "text",
      "width": 124,
      "format": {},
      "metadata": {}
    },
    {
      "id": 1672,
      "name": "blood_alcohol_level",
      "dataTypeName": "number",
      "fieldName": "blood_alcohol_level",
      "position": 2,
      "renderTypeName": "number",
      "width": 170,
      "format": {},
      "metadata": {}
    },
    {
      "id": 1673,
      "name": "plausibility",
      "dataTypeName": "number",
      "fieldName": "plausibility",
      "position": 3,
      "renderTypeName": "number",
      "width": 134,
      "format": {},
      "metadata": {}
    }
  ],
  "metadata": {
    "rdfSubject": "0",
    "rdfClass": "",
    "availableDisplayTypes": [
      "socrataVizTable"
    ],
    "rowLabel": "test",
    "renderTypeConfig": {
      "visible": {
        "socrataVizTable": true
      }
    },
    "jsonQuery": {}
  },
  "query": {},
  "originalViewId": "nuke-xavt",
  "displayFormat": {}
};
var TEST_ROWS = [
  {
    "metadata": {
      "id": 1
    },
    "data": {
      "id": "1",
      "plausibility": "2"
    }
  },
  {
    "metadata": {
      "id": 2
    },
    "data": {
      "blood_alcohol_level": "0.99",
      "id": "2",
      "plausibility": "10"
    }
  },
];
var EXPECTED_INLINE_DATA = {
  columns: TEST_VIEW.columns,
  endIndex: 0,
  order: null,
  rows: [
    ['1', null, '2'],
    ['2', '0.99', '10']
  ],
  rowCount: 2,
  rowIds: ['1', '2'],
  totalRowCount: 0,
  startIndex: 0,
  view: TEST_VIEW,
  domain: 'test.example.com',
  datasetUid: 'nuke-xavt'
};
var EXPECTED_VIF = {
  format: {
    type: 'visualization_interchange_format',
    version: 2
  },
  configuration: {
    order: null,
    tableColumnWidths: {id: 124, blood_alcohol_level: 170, plausibility: 134},
    viewSourceDataLink: false
  },
  description: null,
  series: [
    {
      dataSource: _.merge({type: 'socrata.inline'}, EXPECTED_INLINE_DATA),
      label: null,
      type: 'table',
      unit: {
        one: 'test',
        other: 'tests'
      }
    }
  ],
  title: null
};

// We have to repeat these aliases here because we're importing lodash rather
// than using the one on the window (to which the aliases are added at the top
// of socrata-viz-dataset-grid.js).
_.detect = _.find;
_.include = _.includes;
_.any = _.some;
_.select = _.filter;
_.contains = _.includes;
_.all = _.every;

describe('$.fn.socrataVizDatasetGrid', function () {
  beforeEach(function() {
    blist.configuration = {};
    blist.feature_flags = {
      enable_2017_grid_view_refresh: true,
      ignore_metadata_jsonquery_property_in_view: 'frontend'
    };
    blist.rights = {
      view: {}
    }
    blist.datatypes = {
      text: {}
    };
  });

  afterEach(function() {
    delete blist.configuration;
    delete blist.feature_flags;
    delete blist.rights;
    delete blist.datatypes;
  });

  describe('.generateInlineData()', function() {
    it('returns the expected inline data object', function() {
      var view = new Dataset(TEST_VIEW);
      view.domainCName = 'test.example.com';
      var inlineData = $.fn.socrataVizDatasetGrid.generateInlineData(
        view,
        TEST_ROWS,
        // The following values don't really matter in the context of these
        // tests.
        0,
        0,
        0
      );

      assert.deepEqual(_.omit(inlineData, 'view'), _.omit(EXPECTED_INLINE_DATA, 'view'));
    });
  });

  describe('.generateVifFromInlineData()', function() {
    it('returns the expected vif', function() {
      var vif = $.fn.socrataVizDatasetGrid.generateVifFromInlineData(
        EXPECTED_INLINE_DATA
      );

      assert.deepEqual(vif, EXPECTED_VIF);
    });
  });
});
