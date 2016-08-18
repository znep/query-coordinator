import * as LocationColumn from 'components/importColumns/locationColumn';

describe('LocationColumns', () => {
  let locationColumn;
  const sourceColumns = [
    {
      "type": "SingleColumn",
      "sourceColumn": {
        "name": "ID",
        "processed": 4999,
        "suggestion": "number",
        "types": {
          "number": 4999,
          "text": 4999,
          "calendar_date": 4999,
          "money": 4999,
          "percent": 4999
        },
        "index": 0
      }
    },
    {
      "type": "SingleColumn",
      "sourceColumn": {
        "name": "Case Number",
        "processed": 4999,
        "suggestion": "text",
        "types": {
          "number": 0,
          "text": 4999,
          "calendar_date": 0,
          "money": 0,
          "percent": 0
        },
        "index": 1
      }
    },
    {
      "type": "SingleColumn",
      "sourceColumn": {
        "name": "Date",
        "processed": 4999,
        "suggestion": "calendar_date",
        "types": {
          "number": 0,
          "text": 4999,
          "calendar_date": 4999,
          "money": 0,
          "percent": 0
        },
        "index": 2
      }
    },
    {
      "type": "SingleColumn",
      "sourceColumn": {
        "name": "Block",
        "processed": 4999,
        "suggestion": "text",
        "types": {
          "number": 0,
          "text": 4999,
          "calendar_date": 0,
          "money": 0,
          "percent": 0
        },
        "index": 3
      }
    },
    {
      "type": "SingleColumn",
      "sourceColumn": {
        "name": "IUCR",
        "processed": 4999,
        "suggestion": "text",
        "types": {
          "number": 3333,
          "text": 4999,
          "calendar_date": 3333,
          "money": 3333,
          "percent": 3333
        },
        "index": 4
      }
    },
    {
      "type": "SingleColumn",
      "sourceColumn": {
        "name": "Primary Type",
        "processed": 4999,
        "suggestion": "text",
        "types": {
          "number": 0,
          "text": 4999,
          "calendar_date": 0,
          "money": 0,
          "percent": 0
        },
        "index": 5
      }
    },
    {
      "type": "SingleColumn",
      "sourceColumn": {
        "name": "Description",
        "processed": 4999,
        "suggestion": "text",
        "types": {
          "number": 0,
          "text": 4999,
          "calendar_date": 0,
          "money": 0,
          "percent": 0
        },
        "index": 6
      }
    },
    {
      "type": "SingleColumn",
      "sourceColumn": {
        "name": "Location Description",
        "processed": 4999,
        "suggestion": "text",
        "types": {
          "number": 0,
          "text": 4999,
          "calendar_date": 0,
          "money": 0,
          "percent": 0
        },
        "index": 7
      }
    },
    {
      "type": "SingleColumn",
      "sourceColumn": {
        "name": "Arrest",
        "processed": 4999,
        "suggestion": "text",
        "types": {
          "number": 0,
          "text": 4999,
          "calendar_date": 0,
          "money": 0,
          "percent": 0
        },
        "index": 8
      }
    },
    {
      "type": "SingleColumn",
      "sourceColumn": {
        "name": "Domestic",
        "processed": 4999,
        "suggestion": "text",
        "types": {
          "number": 0,
          "text": 4999,
          "calendar_date": 0,
          "money": 0,
          "percent": 0
        },
        "index": 9
      }
    },
    {
      "type": "SingleColumn",
      "sourceColumn": {
        "name": "Beat",
        "processed": 4999,
        "suggestion": "number",
        "types": {
          "number": 4999,
          "text": 4999,
          "calendar_date": 4999,
          "money": 4999,
          "percent": 4999
        },
        "index": 10
      }
    },
    {
      "type": "SingleColumn",
      "sourceColumn": {
        "name": "District",
        "processed": 4999,
        "suggestion": "number",
        "types": {
          "number": 4999,
          "text": 4999,
          "calendar_date": 4999,
          "money": 4999,
          "percent": 4999
        },
        "index": 11
      }
    },
    {
      "type": "SingleColumn",
      "sourceColumn": {
        "name": "Ward",
        "processed": 4999,
        "suggestion": "number",
        "types": {
          "number": 4999,
          "text": 4999,
          "calendar_date": 4999,
          "money": 4999,
          "percent": 4999
        },
        "index": 12
      }
    },
    {
      "type": "SingleColumn",
      "sourceColumn": {
        "name": "Community Area",
        "processed": 4999,
        "suggestion": "number",
        "types": {
          "number": 4999,
          "text": 4999,
          "calendar_date": 4999,
          "money": 4999,
          "percent": 4999
        },
        "index": 13
      }
    },
    {
      "type": "SingleColumn",
      "sourceColumn": {
        "name": "FBI Code",
        "processed": 4999,
        "suggestion": "text",
        "types": {
          "number": 3888,
          "text": 4999,
          "calendar_date": 3888,
          "money": 3888,
          "percent": 3888
        },
        "index": 14
      }
    },
    {
      "type": "SingleColumn",
      "sourceColumn": {
        "name": "X Coordinate",
        "processed": 4999,
        "suggestion": "number",
        "types": {
          "number": 4999,
          "text": 4999,
          "calendar_date": 4999,
          "money": 4999,
          "percent": 4999
        },
        "index": 15
      }
    },
    {
      "type": "SingleColumn",
      "sourceColumn": {
        "name": "Y Coordinate",
        "processed": 4999,
        "suggestion": "number",
        "types": {
          "number": 4999,
          "text": 4999,
          "calendar_date": 4999,
          "money": 4999,
          "percent": 4999
        },
        "index": 16
      }
    },
    {
      "type": "SingleColumn",
      "sourceColumn": {
        "name": "Year",
        "processed": 4999,
        "suggestion": "number",
        "types": {
          "number": 4999,
          "text": 4999,
          "calendar_date": 4999,
          "money": 4999,
          "percent": 4999
        },
        "index": 17
      }
    },
    {
      "type": "SingleColumn",
      "sourceColumn": {
        "name": "Updated On",
        "processed": 4999,
        "suggestion": "calendar_date",
        "types": {
          "number": 0,
          "text": 4999,
          "calendar_date": 4999,
          "money": 0,
          "percent": 0
        },
        "index": 18
      }
    },
    {
      "type": "SingleColumn",
      "sourceColumn": {
        "name": "Latitude",
        "processed": 4999,
        "suggestion": "number",
        "types": {
          "number": 4999,
          "text": 4999,
          "calendar_date": 0,
          "money": 4999,
          "percent": 4999
        },
        "index": 19
      }
    },
    {
      "type": "SingleColumn",
      "sourceColumn": {
        "name": "Longitude",
        "processed": 4999,
        "suggestion": "number",
        "types": {
          "number": 4999,
          "text": 4999,
          "calendar_date": 0,
          "money": 4999,
          "percent": 4999
        },
        "index": 20
      }
    }
  ];

  beforeEach(() => {
    locationColumn = LocationColumn.defaultLocationColumn();
  });

  describe('reducer', () => {
    it(`Check initial configuration of locationColumns`, () => {
      const expected = {
        type: 'MultipleCols',
        isMultiple: true,
        singleSource: '',
        street: '',
        city: LocationColumn.defaultColumnOrText(),
        state: LocationColumn.defaultColumnOrText(),
        zip: LocationColumn.defaultColumnOrText(),
        lat: '',
        lon: ''
      };

      expect(locationColumn).to.deep.equal(expected);
    });

    it(`update isMultiple`, () => {
      const result = LocationColumn.update(locationColumn, LocationColumn.updateMultiple(false));
      expect(result.isMultiple).to.deep.equal(false);
    });

    it(`update street`, () => {
      const street = sourceColumns[7];

      const result = LocationColumn.update(locationColumn, LocationColumn.updateSourceColumnSingle('street', 7, sourceColumns));
      expect(result.street).to.deep.equal(street);
    });

    it(`update single source`, () => {
      const single = sourceColumns[16];

      const result = LocationColumn.update(locationColumn, LocationColumn.updateSourceColumnSingle('singleSource', 16, sourceColumns));
      expect(result.singleSource).to.deep.equal(single);
    });

    it(`update city`, () => {
      const cityColumn = {
        column: sourceColumns[1],
        text: '',
        isColumn: true
      };

      const columnResult = LocationColumn.update(locationColumn, LocationColumn.updateSourceColumn('city', 1, sourceColumns));
      expect(columnResult.city).to.deep.equal(cityColumn);

      const cityText = {
        column: '',
        text: 'city',
        isColumn: false
      };

      const textResult = LocationColumn.update(locationColumn, LocationColumn.updateText('city', 'city', sourceColumns));
      expect(textResult.city).to.deep.equal(cityText);

      const isColumnResult = LocationColumn.update(locationColumn, LocationColumn.updateIsColumn('city', false, sourceColumns));
      expect(isColumnResult.city.isColumn).to.equal(false);
    });

    it(`update state`, () => {
      const stateColumn = {
        column: sourceColumns[1],
        text: '',
        isColumn: true
      };

      const columnResult = LocationColumn.update(locationColumn, LocationColumn.updateSourceColumn('state', 1, sourceColumns));
      expect(columnResult.state).to.deep.equal(stateColumn);

      const stateText = {
        column: '',
        text: 'state',
        isColumn: false
      };

      const textResult = LocationColumn.update(locationColumn, LocationColumn.updateText('state', 'state', sourceColumns));
      expect(textResult.state).to.deep.equal(stateText);

      const isColumnResult = LocationColumn.update(locationColumn, LocationColumn.updateIsColumn('state', false, sourceColumns));
      expect(isColumnResult.state.isColumn).to.equal(false);
    });

    it(`update zip`, () => {
      const zipColumn = {
        column: sourceColumns[1],
        text: '',
        isColumn: true
      };

      const columnResult = LocationColumn.update(locationColumn, LocationColumn.updateSourceColumn('zip', 1, sourceColumns));
      expect(columnResult.zip).to.deep.equal(zipColumn);

      const zipText = {
        column: '',
        text: 'zip',
        isColumn: false
      };

      const textResult = LocationColumn.update(locationColumn, LocationColumn.updateText('zip', 'zip', sourceColumns));
      expect(textResult.zip).to.deep.equal(zipText);

      const isColumnResult = LocationColumn.update(locationColumn, LocationColumn.updateIsColumn('zip', false, sourceColumns));
      expect(isColumnResult.zip.isColumn).to.equal(false);
    });

    it(`update lat`, () => {
      const lat = sourceColumns[4];

      const result = LocationColumn.update(locationColumn, LocationColumn.updateSourceColumnSingle('lat', 4, sourceColumns));
      expect(result.lat).to.deep.equal(lat);
    });

    it(`update lon`, () => {
      const lon = sourceColumns[4];

      const result = LocationColumn.update(locationColumn, LocationColumn.updateSourceColumnSingle('lon', 4, sourceColumns));
      expect(result.lon).to.deep.equal(lon);
    });

  });
});
