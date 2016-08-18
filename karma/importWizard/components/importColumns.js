import * as IC from 'components/importColumns';
import * as ED from 'components/exampleData';
import * as UF from 'components/uploadFile';
import * as CD from 'components/importColumns/columnDetail';

describe('ImportColumns component', () => {

  describe('reducer', () => {
    it(`Does nothing ${UF.FILE_UPLOAD_COMPLETE} with empty summary`, () => {
      const expected = 'original transform value!';

      const result = IC.update(expected, {
        type: UF.FILE_UPLOAD_COMPLETE,
        summary: {}
      });

      expect(result).to.equal(expected);
    });

    it(`creates the initial transform if missing ${UF.FILE_UPLOAD_COMPLETE}`, () => {
      const summary = ED.imports2ScanResponse.summary;

      const initialTranslation = IC.initialTranslation(summary);

      const result = IC.update(undefined, {
        type: UF.FILE_UPLOAD_COMPLETE,
        summary: summary
      });

      expect(result.columns).to.deep.equal(initialTranslation);
      expect(result.defaultColumns).to.deep.equal(initialTranslation);
      expect(result.numHeaders).to.deep.equal(summary.headers);
      expect(result.sample).to.deep.equal(summary.sample);
    });

    it(`handles ${IC.CHANGE_HEADER_COUNT}`, () => {
      const original = {
        untouched: 'do not touch!',
        columns: 'original columns',
        defaultColumns: 'original default columns',
        numHeaders: 1776,
        sample: 'original sample'
      };

      const minus1 = IC.update(original, {
        type: IC.CHANGE_HEADER_COUNT,
        change: -1
      });

      expect(minus1.untouched).to.deep.equal(original.untouched);
      expect(minus1.columns).to.deep.equal(original.columns);
      expect(minus1.defaultColumns).to.deep.equal(original.defaultColumns);
      expect(minus1.sample).to.deep.equal(original.sample);

      expect(minus1.numHeaders).to.deep.equal(original.numHeaders - 1);

      const plus7 = IC.update(original, {
        type: IC.CHANGE_HEADER_COUNT,
        change: 7
      });

      expect(plus7.untouched).to.deep.equal(original.untouched);
      expect(plus7.columns).to.deep.equal(original.columns);
      expect(plus7.defaultColumns).to.deep.equal(original.defaultColumns);
      expect(plus7.sample).to.deep.equal(original.sample);

      expect(plus7.numHeaders).to.deep.equal(original.numHeaders + 7);

      const zero  = IC.update(original, {
        type: IC.CHANGE_HEADER_COUNT,
        change: 0
      });

      expect(zero.untouched).to.deep.equal(original.untouched);
      expect(zero.columns).to.deep.equal(original.columns);
      expect(zero.defaultColumns).to.deep.equal(original.defaultColumns);
      expect(zero.sample).to.deep.equal(original.sample);
      expect(zero.numHeaders).to.deep.equal(original.numHeaders);
    });

    // Sub reducers are tested in columnDetail.js
    it(`handles ${IC.UPDATE_COLUMN} with ${CD.UPDATE_COLUMN_NAME}`, () => {
      const originalColumns = [
        {virginian: false, name:'Aaron Burr'},
        {virginian: false, name: 'The Ten Dollar Founding Father'},
        {virginian: true, name: 'Thomas Jefferson', home: 'Monticello'},
        {virginian: true, name: 'George Washington', home: 'Mount Vernon'}
      ];

      // What's your name, man?
      const expectedColumns = originalColumns.map( row => {
        if (row.name == 'The Ten Dollar Founding Father') {
          return { ...row, name: 'Alexander Hamilton' };
        } else {
          return row;
        }
      });

      const original = {
        untouched: 'do not touch!',
        columns: originalColumns,
        defaultColumns: 'original default columns',
        numHeaders: 42,
        sample: 'original sample'
      };

      const result  = IC.update(original, {
        type: IC.UPDATE_COLUMN,
        index: 1,
        action: {
          type: CD.UPDATE_COLUMN_NAME,
          newName: 'Alexander Hamilton'
        }
      });

      expect(result.untouched).to.deep.equal(original.untouched);
      expect(result.defaultColumns).to.deep.equal(original.defaultColumns);
      expect(result.sample).to.deep.equal(original.sample);

      // My name is Alexander Hamilton.
      expect(result.columns).to.deep.equal(expectedColumns);
    });
  });

  it(`handles ${IC.REMOVE_COLUMN}`, () => {
    const originalColumns = [
      {virginian: false, name:'Aaron Burr'},
      {virginian: false, name: 'Alexander Hamilton'},
      {virginian: true, name: 'Thomas Jefferson', home: 'Monticello'},
      {virginian: true, name: 'George Washington', home: 'Mount Vernon'}
    ];

    const expectedColumns = originalColumns.slice(0, 1).concat(originalColumns.slice(2));

    const original = {
      untouched: 'do not touch!',
      columns: originalColumns,
      defaultColumns: 'original default columns',
      numHeaders: 42,
      sample: 'original sample'
    };

    // Ten!  Paces fire!
    const result  = IC.update(original, {
      type: IC.REMOVE_COLUMN,
      index: 1
    });

    expect(result.untouched).to.deep.equal(original.untouched);
    expect(result.defaultColumns).to.deep.equal(original.defaultColumns);
    expect(result.sample).to.deep.equal(original.sample);

    // I imagine death so much it feels more like a memory.
    expect(result.columns).to.deep.equal(expectedColumns);
  });

  it(`handles ${IC.REMOVE_COLUMN}`, () => {
    const defaultColumns = [
      {married: false, name: 'Alexander Hamilton'},
      {married: false, name: 'Elizabeth Schulyer'},
      {married: false, name: 'Angelica Schulyer'}
    ];

    const columns = [
      {married: true, name: 'Alexander Hamilton'},
      {married: true, name: 'Elizabeth Schulyer'},
      {married: false, name: 'Angelica Schulyer'}
    ];

    const original = {
      freeAdvice: 'talk less; smile more.',
      columns: columns,
      defaultColumns: defaultColumns,
      numHeaders: 1776,
      sample: 'new york city'
    };

    // Rewind...  Rewind...
    const result  = IC.update(original, {
      type: IC.RESTORE_SUGGESTED_SETTINGS
    });

    expect(result.untouched).to.deep.equal(original.untouched);
    expect(result.defaultColumns).to.deep.equal(original.defaultColumns);
    expect(result.numHeaders).to.deep.equal(original.numHeaders);
    expect(result.sample).to.deep.equal(original.sample);

    // Satisfied.
    expect(result.columns).to.deep.equal(defaultColumns);
  });

  it(`handles ${IC.ADD_COLUMN}`, () => {
    const defaultColumns = [
      {married: false, name: 'Alexander Hamilton'},
      {married: false, name: 'Elizabeth Schulyer'},
      {married: false, name: 'Angelica Schulyer'}
    ];

    const columns = [
      {married: true, name: 'Alexander Hamilton'},
      {married: true, name: 'Elizabeth Schulyer'},
      {married: false, name: 'Angelica Schulyer'}
    ];

    const original = {
      freeAdvice: 'talk less; smile more.',
      columns: columns,
      defaultColumns: defaultColumns,
      numHeaders: 1776,
      sample: 'new york city'
    };

    const result  = IC.update(original, {
      type: IC.ADD_COLUMN
    });

    expect(result.columns.length).to.deep.equal(4);
    expect(_.last(result.columns)).to.deep.equal({
      id: 3,
      columnSource: {
        type: 'CompositeColumn',
        components: []
      },
      name: 'New Column 3',
      chosenType: 'text',
      transforms: []
    });
  });

  it(`handles ${IC.CLEAR_ALL_COLUMNS}`, () => {
    const defaultColumns = [
      {married: false, name: 'Alexander Hamilton'},
      {married: false, name: 'Elizabeth Schulyer'},
      {married: false, name: 'Angelica Schulyer'}
    ];

    const columns = [
      {married: true, name: 'Alexander Hamilton'},
      {married: true, name: 'Elizabeth Schulyer'},
      {married: false, name: 'Angelica Schulyer'}
    ];

    const original = {
      freeAdvice: 'talk less; smile more.',
      columns: columns,
      defaultColumns: defaultColumns,
      numHeaders: 1776,
      sample: 'new york city'
    };

    const result  = IC.update(original, {
      type: IC.CLEAR_ALL_COLUMNS
    });

    expect(result.columns).to.deep.equal([]);
  });
});
