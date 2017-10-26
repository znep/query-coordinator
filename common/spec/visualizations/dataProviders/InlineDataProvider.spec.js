import _ from 'lodash';
import $ from 'jquery';
import InlineDataProvider from 'common/visualizations/dataProviders/InlineDataProvider';

describe('InlineDataProvider', () => {
  const VALID_VIF = {
    format: {
      type: 'visualization_interchange_format',
      version: 2
    },
    configuration: {
      order: [{ columnName: 'plausibility', ascending: false }],
      viewSourceDataLink: false
    },
    description: 'This table reads inline data out of the data source',
    series: [
      {
        color: {
        },
        dataSource: {
          endIndex: 50,
          rows: [
            ['10619', '0.36', '10', null, '2001-06-25T00:00:00', 'POINT (-90.248707 33.894355)', '8982 Hagenes Club', 'Vaughnshire', 'TN', '66167-1471'],
            ['10515', null, '10', null, '2001-12-02T00:00:00', 'POINT (-90.078326 34.579712)', '17699 Emard Loaf', 'Beierberg', 'KS', '65328'],
            ['10519', '0.4', '10', null, '2001-02-21T00:00:00', 'POINT (-88.99551 32.124844)', '15317 Cielo Mission', 'Langworthton', 'MA', '51740-7151'],
            ['10593', '0.48', '10', null, '2001-03-17T00:00:00', 'POINT (-89.616479 31.488375)', '60959 Volkman Harbor', 'Tillmanland', 'VT', '37533-9603'],
            ['10590', null, '10', null, '2001-08-21T00:00:00', 'POINT (-88.228408 34.182483)', '9581 Stephan Lights', 'Port Norwood', 'LA', '44781-2640'],
            ['10585', '0.19', '10', 'That is what we ask ourselves in childhood when we write the name that we are told is ours.', '2001-03-02T00:00:00', 'POINT (-90.335322 31.090589)', '18901 Harber Locks', 'Jarredport', 'WV', '55657'],
            ['10535', '0.47', '10', null, '2001-07-28T00:00:00', 'POINT (-88.557487 31.967642)', '655 Enoch Prairie', 'West Leanne', 'AL', '32752-1845'],
            ['10573', '0.25', '10', null, '2001-05-13T00:00:00', 'POINT (-90.429047 32.009568)', '3641 Berge Mission', 'Ritamouth', 'MS', '93665'],
            ['10546', null, '10', 'One moment.', '2001-08-14T00:00:00', 'POINT (-89.171442 31.654586)', '48232 Gregoria Overpass', 'West Lora', 'SC', '95947'],
            ['10569', '0.25', '10', 'Must be two of em.', '2001-03-14T00:00:00', 'POINT (-89.756628 33.259273)', '6762 Nikolaus Radial', 'Cronaville', 'WA', '87598-0635'],
            ['10568', '0.1', '10', null, '2001-12-27T00:00:00', 'POINT (-90.356872 31.169022)', '62863 Dickinson Hill', 'Freidaberg', 'MA', '34419'],
            ['10079', '0.47', '10', null, '2001-12-27T00:00:00', 'POINT (-89.55683 30.927021)', '5765 Rusty Garden', 'West Marjolaine', 'AL', '95704'],
            ['10081', '0.02', '10', null, '2001-01-04T00:00:00', 'POINT (-89.858807 33.645682)', '804 Celestine Greens', 'Rempelfurt', 'OK', '74934-2559'],
            ['10956', null, '10', null, '2001-04-08T00:00:00', 'POINT (-90.299329 33.625451)', '340 Raynor Village', 'Olafchester', 'TX', '73983-5766'],
            ['10093', null, '10', null, '2001-12-07T00:00:00', 'POINT (-89.472112 33.367133)', '1118 Rowe Divide', 'New Barton', 'IL', '81894'],
            ['10944', '0.16', '10', null, '2001-08-07T00:00:00', 'POINT (-88.525412 30.757059)', '279 Ayana Mall', 'East Louisa', 'OR', '41365-6996'],
            ['10940', '0.18', '10', null, '2001-08-23T00:00:00', 'POINT (-90.597953 32.594247)', '69212 Gino Terrace', 'New Connor', 'NH', '98136'],
            ['10105', null, '10', null, '2001-11-27T00:00:00', 'POINT (-89.692628 30.690185)', '3753 Skyla Drive', "O'Keefeport", 'LA', '88333'],
            ['10108', '0.24', '10', null, '2001-05-14T00:00:00', 'POINT (-90.646612 32.706185)', '437 Jayce Grove', 'Marlinburgh', 'KS', '38773-0124'],
            ['10936', null, '10', null, '2001-09-14T00:00:00', 'POINT (-89.648423 31.592597)', '2842 Dakota Creek', 'East Bianka', 'MS', '14890'],
            ['10111', '0.37', '10', null, '2001-08-06T00:00:00', 'POINT (-88.913103 30.445168)', '14615 Smith Creek', 'Missouritown', 'ND', '43850'],
            ['10133', '0.2', '10', null, '2001-01-04T00:00:00', 'POINT (-89.980492 33.986256)', '2088 Hirthe Corner', 'Port Maybellview', 'FL', '52131'],
            ['10915', '0.45', '10', null, '2001-06-11T00:00:00', 'POINT (-88.78501 30.681833)', '80245 Hamill Road', 'Wisokyland', 'IL', '65142-9931'],
            ['10146', '0.09', '10', null, '2001-04-30T00:00:00', 'POINT (-88.39258 32.679806)', '504 Casandra Inlet', 'New Lura', 'NH', '85223-0297'],
            ['10148', null, '10', null, '2001-08-16T00:00:00', 'POINT (-89.062681 30.898886)', '656 Stark Cliffs', 'North Friedrich', 'GA', '16448-1987'],
            ['10907', '0.48', '10', null, '2001-06-19T00:00:00', 'POINT (-88.712348 31.33856)', '8886 Ritchie Ferry', 'Hansmouth', 'NE', '65921-4585'],
            ['10151', '0.4', '10', null, '2001-09-14T00:00:00', 'POINT (-88.345039 33.080249)', '862 Rau Freeway', 'New Stephan', 'NY', '99907-8822'],
            ['10027', '0.15', '10', null, '2001-05-11T00:00:00', 'POINT (-89.024902 34.26354)', '8129 Norwood Tunnel', 'North Ara', 'NH', '68420-3884'],
            ['10155', '0.25', '10', null, '2001-10-09T00:00:00', 'POINT (-89.650367 33.613154)', '610 Corwin Mall', 'Ruthieburgh', 'ND', '20862-7400'],
            ['10900', '0.25', '10', null, '2001-06-21T00:00:00', 'POINT (-88.842026 31.969966)', '9079 Herzog Freeway', 'Johnsmouth', 'MI', '37113'],
            ['10163', '0.35', '10', null, '2001-02-06T00:00:00', 'POINT (-89.35853 33.868341)', '65727 Nola Courts', 'Martinaland', 'GA', '26772-6706'],
            ['10164', null, '10', null, '2001-12-29T00:00:00', 'POINT (-89.08139 34.516468)', '667 Murazik Squares', 'Makaylaburgh', 'HI', '11331'],
            ['10894', '0.2', '10', null, '2001-02-24T00:00:00', 'POINT (-90.638906 31.480432)', '4438 Ottis Parkway', 'Port Jacestad', 'WY', '80131'],
            ['10172', '0.08', '10', null, '2001-11-19T00:00:00', 'POINT (-89.630003 32.11929)', '5803 Heathcote Falls', 'Arnulfofort', 'NE', '32850'],
            ['10888', null, '10', null, '2001-12-17T00:00:00', 'POINT (-89.388415 34.967496)', '513 Veum Plains', 'Alethabury', 'RI', '81992'],
            ['10176', '0.29', '10', 'You are walking through it howsomever.', '2001-09-20T00:00:00', 'POINT (-90.988843 31.685475)', '406 Agustina Path', 'Port Roel', 'KS', '28258-5315'],
            ['10886', null, '10', null, '2001-07-13T00:00:00', 'POINT (-90.810871 34.051478)', '81449 Reyes Pass', 'West Reynoldside', 'IL', '81982-3275'],
            ['10885', '0.1', '10', null, '2001-02-05T00:00:00', 'POINT (-88.620368 34.149999)', '1554 Rogahn Cliffs', 'Meaghantown', 'VA', '80628'],
            ['10187', null, '10', null, '2001-10-13T00:00:00', 'POINT (-90.608836 33.839544)', '467 Tanya Station', 'Hesselmouth', 'RI', '25272-1432'],
            ['10872', '0.11', '10', null, '2001-04-12T00:00:00', 'POINT (-88.402527 33.087982)', '661 Pouros Coves', 'North Maurinehaven', 'CT', '59683'],
            ['10868', '0.15', '10', null, '2001-02-03T00:00:00', 'POINT (-89.190573 33.624282)', '1334 Hammes Ranch', 'Lake Delfinahaven', 'PA', '60075-6183'],
            ['10864', '0.11', '10', null, '2001-03-13T00:00:00', 'POINT (-90.853503 31.858582)', '13658 Brakus Ports', 'Cadeberg', 'CT', '62466'],
            ['10862', '0.49', '10', null, '2001-05-12T00:00:00', 'POINT (-90.21472 34.630747)', '8931 Barbara Manor', 'Rodriguezfort', 'NH', '97824-4300'],
            ['10850', null, '10', null, '2001-05-24T00:00:00', 'POINT (-88.82111 31.260353)', '7619 Garland Falls', 'North Jamaalberg', 'MN', '35030'],
            ['10219', '0.47', '10', null, '2001-07-13T00:00:00', 'POINT (-89.624968 31.427482)', '4386 Deckow Bypass', 'Connellyshire', 'WA', '18013-9827'],
            ['10847', '0.45', '10', null, '2001-05-28T00:00:00', 'POINT (-88.629032 34.239933)', '7469 Graham Mill', 'New Mariahborough', 'WV', '78911'],
            ['10845', null, '10', null, '2001-07-18T00:00:00', 'POINT (-89.373538 31.466256)', '486 Rohan Knolls', 'Port Audra', 'OK', '29323'],
            ['10226', null, '10', null, '2001-06-04T00:00:00', 'POINT (-88.610783 33.106336)', '799 Goyette Track', 'East Estrella', 'AK', '24180'],
            ['10839', '0.27', '10', null, '2001-05-24T00:00:00', 'POINT (-88.790716 30.972667)', '75057 Ila Green', 'Elianeborough', 'WV', '95070'],
            ['10234', '0.11', '10', null, '2001-01-06T00:00:00', 'POINT (-90.139987 32.225867)', '15697 Schneider Mall', 'Olsonstad', 'KY', '57412']
          ],
          totalRowCount: 1000,
          startIndex: 0,
          type: 'socrata.inline',
          // Note that the columns are intentionally out of position order.
          view: { 'columns':[{ 'renderTypeName':'text', 'id':1310, 'name':'incident_location_zip', 'dataTypeName':'text', 'fieldName':'incident_location_zip', 'position':11, 'tableColumnId':953, 'width':352, 'format':{}, 'metadata':{} }, { 'renderTypeName':'text', 'id':1301, 'name':'id', 'dataTypeName':'text', 'fieldName':'id', 'position':2, 'tableColumnId':944, 'width':124, 'format':{}, 'metadata':{} }, { 'renderTypeName':'number', 'id':1302, 'name':'blood_alcohol_level', 'dataTypeName':'number', 'fieldName':'blood_alcohol_level', 'position':3, 'tableColumnId':945, 'width':328, 'format':{}, 'metadata':{} }, { 'renderTypeName':'number', 'id':1303, 'name':'plausibility', 'dataTypeName':'number', 'fieldName':'plausibility', 'position':4, 'tableColumnId':946, 'width':244, 'format':{}, 'metadata':{} }, { 'renderTypeName':'text', 'id':1304, 'name':'witness_gibberish', 'dataTypeName':'text', 'fieldName':'witness_gibberish', 'position':5, 'tableColumnId':947, 'width':304, 'format':{}, 'metadata':{} }, { 'renderTypeName':'calendar_date', 'id':1305, 'name':'incident_occurrence', 'dataTypeName':'calendar_date', 'fieldName':'incident_occurrence', 'position':6, 'tableColumnId':948, 'width':328, 'format':{}, 'metadata':{} }, { 'renderTypeName':'text', 'id':1306, 'name':'incident_location', 'dataTypeName':'text', 'fieldName':'incident_location', 'position':7, 'tableColumnId':949, 'width':304, 'format':{}, 'metadata':{} }, { 'renderTypeName':'text', 'id':1307, 'name':'incident_location_address', 'dataTypeName':'text', 'fieldName':'incident_location_address', 'position':8, 'tableColumnId':950, 'width':400, 'format':{}, 'metadata':{} }, { 'renderTypeName':'text', 'id':1308, 'name':'incident_location_city', 'dataTypeName':'text', 'fieldName':'incident_location_city', 'position':9, 'tableColumnId':951, 'width':364, 'format':{}, 'metadata':{} }, { 'renderTypeName':'text', 'id':1309, 'name':'incident_location_state', 'dataTypeName':'text', 'fieldName':'incident_location_state', 'position':10, 'tableColumnId':952, 'width':376, 'format':{}, 'metadata':{} }], 'id':'uwa4-dwin', 'name':'TEST UFO Sightings (OBE)', 'displayType':'table', 'publicationAppendEnabled':false, 'metadata':{ 'availableDisplayTypes':['socrataVizTable'], 'renderTypeConfig':{ 'visible':{ 'socrataVizTable':true } }, 'jsonQuery':{} }, 'query':{}, 'flags':['default', 'restorable'], 'originalViewId':'uwa4-dwin', 'displayFormat':{} }
        },
        label: null,
        type: 'table',
        unit: {
          one: 'case',
          other: 'cases'
        }
      }
    ],
    title: '`inline` data source type'
  };
  const INVALID_VIF = {};

  describe('constructor', () => {
    describe('when called with an invalid vif', () => {
      it('should not throw', () => {
        assert.doesNotThrow(() => {
          new InlineDataProvider(INVALID_VIF);
        });
      });
    });

    describe('when called with a valid vif', () => {
      it('should not throw', () => {
        assert.doesNotThrow(() => {
          new InlineDataProvider(VALID_VIF);
        });
      });
    });
  });

  describe('methods', () => {
    describe('when instantiated with an invalid vif', () => {
      it('should return sensible default values indicating no data', () => {
        const inlineDataProvider = new InlineDataProvider(INVALID_VIF);
        const view = inlineDataProvider.getView();
        const columns = inlineDataProvider.getColumns();
        const rows = inlineDataProvider.getRows();

        assert(_.isObject(view) && _.isEmpty(view));
        assert(_.isArray(columns) && _.isEmpty(columns));
        assert.equal(inlineDataProvider.getStartIndex(), 0);
        assert.equal(inlineDataProvider.getEndIndex(), 0);
        assert.equal(inlineDataProvider.getRowCount(), 0);
        assert.equal(inlineDataProvider.getTotalRowCount(), 0);
        assert(_.isArray(rows) && _.isEmpty(rows));
      });
    });

    describe('when instantiated with a valid vif', () => {
      it('should return the values in the vif', () => {
        const inlineDataProvider = new InlineDataProvider(VALID_VIF);
        const dataSource = _.get(VALID_VIF, 'series[0].dataSource');

        assert.deepEqual(inlineDataProvider.getView(), _.get(dataSource, 'view'));
        assert(_.isEqual(inlineDataProvider.getView(), _.get(dataSource, 'view')));
        // Columns are always returned sorted by the position property.
        assert.deepEqual(inlineDataProvider.getColumns(), _.sortBy(_.get(dataSource, 'view.columns'), 'position'));
        assert.equal(inlineDataProvider.getStartIndex(), _.get(dataSource, 'startIndex'));
        assert.equal(inlineDataProvider.getEndIndex(), _.get(dataSource, 'endIndex'));
        assert.equal(inlineDataProvider.getRowCount(), 50);
        assert.equal(inlineDataProvider.getTotalRowCount(), _.get(dataSource, 'totalRowCount'));
        assert.deepEqual(inlineDataProvider.getRows(), _.get(dataSource, 'rows'));
      });

      it('should return columns in ascending order by position', () => {
        const inlineDataProvider = new InlineDataProvider(VALID_VIF);
        const dataSource = _.get(VALID_VIF, 'series[0].dataSource');
        const columnPositions = inlineDataProvider.getColumns().map((column) => {
          return column.position;
        });
        const sortedColumnPositions = _.sortBy(_.cloneDeep(columnPositions));

        assert.deepEqual(columnPositions, sortedColumnPositions);
      });
    });
  });
});
