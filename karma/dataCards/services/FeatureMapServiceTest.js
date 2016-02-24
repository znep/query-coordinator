describe('FeatureMapService', function() {
  'use strict';

  var FeatureMapService;
  var TestHelpers;

  function getFormattedResponse(payload) {
    return FeatureMapService.formatRowInspectorQueryResponse(payload);
  };

  function createRows() {
    return [
      createRow(),
      createRow(),
      createRow()
    ]
  }

  function createRow() {
    return [
      {
        columnName: 'Division Number',
        isTitleColumn: false,
        isFeatureMapColumn: false,
        isParentColumn: false,
        value: [12345],
        physicalDataType: 'number',
        renderTypeName: 'number'
      },
      {
        columnName: 'Training Center',
        isTitleColumn: false,
        isFeatureMapColumn: true,
        isParentColumn: false,
        value: [{
          coordinates: [-89.115646, 32.911919],
          type: 'Point'
        }],
        physicalDatatype: 'point',
        renderTypeName: 'location'
      },
      {
        columnName: 'Commanding Officer',
        isTitleColumn: false,
        isFeatureMapColumn: false,
        isParentColumn: false,
        value: ['Brad Hentley'],
        physicalDataType: 'text',
        renderTypeName: 'text'
      }
    ];
  }

  beforeEach(angular.mock.module('dataCards'));

  beforeEach(inject(function($injector) {
    FeatureMapService = $injector.get('FeatureMapService');
    TestHelpers = $injector.get('testHelpers');
  }));

  describe('formatRowInspectorQueryResponse', function() {
    it('returns an array of formatted titles', function() {
      var testData = createRows();
      var result = getFormattedResponse(testData);
      var titles = result.titles;
      expect(titles).to.have.length(testData.length);
    });

    it('returns an array of formatted rows', function() {
      var testData = createRows();
      var result = getFormattedResponse(testData);
      var rows = result.rows;
      expect(rows).to.have.length(testData.length);
    });

    describe('row formatting', function() {
      it('should return a payload RowInspector can consume', function() {
        var testData = createRows();
        var result = getFormattedResponse(testData);
        var rows = result.rows;

        _.each(rows, function(page) {
          _.each(page, function(row) {
            expect(row).to.haveOwnProperty('column');
            expect(row).to.haveOwnProperty('value');
          });
        });
      });

      it('formats rows with subcolumns', function() {
        var testData = [
          [
            {
              columnName: 'Incident Location',
              isTitleColumn: false,
              isFeatureMapColumn: false,
              isParentColumn: true,
              value: [
                {
                  columnName: 'Incident Location',
                  value: {
                    type: 'Point',
                    coordinates: [-89.756581, 31.432233]
                  },
                  physicalDatatype: 'point',
                  renderTypeName: 'location'
                },
                {
                  columnName: 'address',
                  value: '225 Theron Rue',
                  physicalDatatype: 'text'
                },
                {
                  columnName: 'city',
                  value: 'Wittingville',
                  physicalDatatype: 'text'
                },
                {
                  columnName: 'state',
                  value: 'WA',
                  physicalDatatype: 'text'
                },
                {
                  columnName: 'zip',
                  value: '72435',
                  physicalDatatype: 'text'
                }
              ],
              physicalDatatype: 'point',
              renderTypeName: 'location'
            }
          ]
        ];
        var result = getFormattedResponse(testData);
        var rowValue = result.rows[0][0].value;

        expect(rowValue).to.equal('225 Theron Rue\nWittingville, WA 72435');
      });
    });

    describe('title formatting', function() {
      it('should include a title of coordinates without parentheses when no custom title', function() {
        var testData = [
          [
            {
              columnName: 'Training Center',
              isTitleColumn: false,
              isFeatureMapColumn: true,
              isParentColumn: false,
              value: [{
                coordinates: [-89.115646, 32.911919],
                type: 'Point'
              }],
              physicalDatatype: 'point',
              renderTypeName: 'location'
            }
          ]
        ];
        var result = getFormattedResponse(testData);
        var title = result.titles[0];

        expect(title).to.match(/^-?\d+(?:\.\d+)?°,\s-?\d+(?:\.\d+)?°$/);
      });

      it('should format coordinate titles without parentheses when from a title column', function() {
        var testData = [
          [
            {
              columnName: 'Headquarters',
              isTitleColumn: true,
              isFeatureMapColumn: false,
              physicalDatatype: 'point',
              value: [{
                coordinates: [-89.115646, 140.000],
                type: 'Point'
              }],
              renderTypeName: 'location'
            }
          ]
        ];
        var result = getFormattedResponse(testData);
        var title = result.titles[0];

        expect(title).to.match(/^-?\d+(?:\.\d+)?°,\s-?\d+(?:\.\d+)?°$/);
      });

      it('should include a formatted title from the title column if present', function() {
        var testData = [
          [
            {
              columnName: 'Division Name',
              isTitleColumn: true,
              isFeatureMapColumn: false,
              isParentColumn: false,
              value: ['Red Pandas Carrying Umbrellas'],
              physicalDatatype: 'text',
              renderTypeName: 'text'
            }
          ]
        ];
        var result = getFormattedResponse(testData);
        var title = result.titles[0];

        expect(title).to.equal('RED PANDAS CARRYING UMBRELLAS');
      });
    });
  });
});
