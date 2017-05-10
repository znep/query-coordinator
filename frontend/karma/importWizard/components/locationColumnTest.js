import { expect, assert } from 'chai';
import * as LocationColumn from 'components/importColumns/locationColumn';

describe('LocationColumns', () => {
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

  describe('reducer', () => {

    it('update isMultiple', () => {
      const result = LocationColumn.update(LocationColumn.emptyLocationSource(), LocationColumn.updateMultiple(false));
      expect(result.isMultiple).to.deep.equal(false);
    });

    it('update street', () => {
      const street = sourceColumns[7];

      const result = LocationColumn.update(
        LocationColumn.emptyLocationSource(),
        LocationColumn.updateSourceColumnSingle('street', 7, sourceColumns)
      );
      expect(result.street).to.deep.equal(street);
    });

    it('update single source', () => {
      const single = sourceColumns[16];

      const result = LocationColumn.update(
        LocationColumn.emptyLocationSource(),
        LocationColumn.updateSourceColumnSingle('singleSource', 16, sourceColumns)
      );
      expect(result.singleSource).to.deep.equal(single);
    });

    describe('city sub-reducer', () => {

      it('updates to be from a column', () => {
        const columnResult = LocationColumn.update(
          LocationColumn.emptyLocationSource(),
          LocationColumn.updateSourceColumn('city', 1, sourceColumns)
        );
        expect(columnResult.city).to.deep.equal({
          column: sourceColumns[1],
          text: '',
          isColumn: true
        });
      });

      it('updates to be text', () => {
        const textResult = LocationColumn.update(
          LocationColumn.emptyLocationSource(),
          LocationColumn.updateText('city', 'city', sourceColumns)
        );
        expect(textResult.city).to.deep.equal({
          column: null,
          text: 'city',
          isColumn: false
        });
      });

      it('updates to be text instead of a column', () => {
        const isColumnResult = LocationColumn.update(
          LocationColumn.emptyLocationSource(),
          LocationColumn.updateIsColumn('city', false, sourceColumns)
        );
        expect(isColumnResult.city.isColumn).to.equal(false);
      });

    });

    describe('state sub-reducer', () => {

      it('updates to be from a column', () => {
        const columnResult = LocationColumn.update(
          LocationColumn.emptyLocationSource(),
          LocationColumn.updateSourceColumn('state', 1, sourceColumns)
        );
        expect(columnResult.state).to.deep.equal({
          column: sourceColumns[1],
          text: '',
          isColumn: true
        });
      });

      it('updates to be text', () => {
        const textResult = LocationColumn.update(
          LocationColumn.emptyLocationSource(),
          LocationColumn.updateText('state', 'PA', sourceColumns)
        );
        expect(textResult.state).to.deep.equal({
          column: null,
          text: 'PA',
          isColumn: false
        });
      });

      it('updates to be text instead of a column', () => {
        const isColumnResult = LocationColumn.update(
          LocationColumn.emptyLocationSource(),
          LocationColumn.updateIsColumn('state', false, sourceColumns)
        );
        expect(isColumnResult.state.isColumn).to.equal(false);
      });

    });

    describe('zip sub-reducer', () => {

      it('updates be from a column', () => {
        const columnResult = LocationColumn.update(
          LocationColumn.emptyLocationSource(),
          LocationColumn.updateSourceColumn('zip', 1, sourceColumns)
        );
        expect(columnResult.zip).to.deep.equal({
          column: sourceColumns[1],
          text: '',
          isColumn: true
        });
      });

      it('updates to be text', () => {
        const textResult = LocationColumn.update(
          LocationColumn.emptyLocationSource(),
          LocationColumn.updateText('zip', '19301', sourceColumns)
        );
        expect(textResult.zip).to.deep.equal({
          column: null,
          text: '19301',
          isColumn: false
        });
      });

      it('updates to be set to text, not column', () => {
        const isColumnResult = LocationColumn.update(
          LocationColumn.emptyLocationSource(),
          LocationColumn.updateIsColumn('zip', false, sourceColumns)
        );
        expect(isColumnResult.zip.isColumn).to.equal(false);
      });

    });

    it('update latitude', () => {
      const lat = sourceColumns[4];

      const result = LocationColumn.update(
        LocationColumn.emptyLocationSource(),
        LocationColumn.updateSourceColumnSingle('latitude', 4, sourceColumns)
      );
      expect(result.latitude).to.deep.equal(lat);
    });

    it('update longitude', () => {
      const lon = sourceColumns[4];

      const result = LocationColumn.update(
        LocationColumn.emptyLocationSource(),
        LocationColumn.updateSourceColumnSingle('longitude', 4, sourceColumns)
      );
      expect(result.longitude).to.deep.equal(lon);
    });

  });
});
