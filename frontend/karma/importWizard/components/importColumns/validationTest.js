import { expect, assert } from 'chai';
import React, { PropTypes } from 'react';
import _ from 'lodash';
import TestUtils from 'react-addons-test-utils';

import * as V from 'components/importColumns/validation';
import * as LocationColumn from 'components/importColumns/locationColumn';
import { ResultColumn } from 'components/importColumns';

const sourceColumns: Array<SourceColumn> = [
  {
    name: 'DEPT',
    index: 0,
    suggestion: 'text',
    processed: 5000,
    types: {
      calendar_date: 0,
      money: 0,
      number: 0,
      percent: 0,
      text: 5000
    }
  },
  {
    name: 'salary',
    index: 1,
    suggestion: 'money',
    processed: 5000,
    types: {
      calendar_date: 0,
      money: 5000,
      number: 5000,
      percent: 234,
      text: 5000
    }
  },
  {
    name: '_name',
    index: 2,
    suggestion: 'text',
    processed: 5000,
    types: {
      calendar_date: 0,
      money: 0,
      number: 0,
      percent: 0,
      text: 5000
    }
  },
  {
    name: 'HRD_DT',
    index: 3,
    suggestion: 'calendar_date',
    processed: 5000,
    types: {
      calendar_date: 5000,
      money: 0,
      number: 0,
      percent: 0,
      text: 5000
    }
  },
  {
    name: 'skills',
    index: 4,
    suggestion: 'text',
    processed: 5000,
    types: {
      calendar_date: 0,
      money: 0,
      number: 0,
      percent: 0,
      text: 5000
    }
  }
];

const correctTransform: Array<ResultColumn> = [
  {
    columnSource: {
      type: 'SingleColumn',
      sourceColumn: sourceColumns[0]
    },
    name: 'Department',
    chosenType: 'text',
    transforms: []
  },
  {
    columnSource: {
      type: 'SingleColumn',
      sourceColumn: sourceColumns[1]
    },
    name: 'Salary',
    chosenType: 'money',
    transforms: []
  },
  {
    columnSource: {
      type: 'SingleColumn',
      sourceColumn: sourceColumns[2]
    },
    name: 'Name',
    chosenType: 'text',
    transforms: []
  },
  {
    columnSource: {
      type: 'SingleColumn',
      sourceColumn: sourceColumns[3]
    },
    name: 'Hired Date',
    chosenType: 'calendar_date',
    transforms: []
  },
  {
    columnSource: {
      type: 'CompositeColumn',
      components: [
        sourceColumns[4],
        '!'
      ]
    },
    name: 'skills!',
    chosenType: 'text',
    transforms: []
  }
];


describe('validate', () => {

  describe('blank name checking', () => {

    it('returns no errors when all columns have names', () => {
      expect(V.validate(correctTransform, sourceColumns)).to.deep.equal([]);
    });

    it('returns one error when one column has a blank name', () => {
      const invalidTransform = _.cloneDeep(correctTransform);
      invalidTransform[0].name = '';
      expect(V.validate(invalidTransform, sourceColumns)).to.deep.equal([
        {
          type: 'blank_names',
          instances: 1
        }
      ]);
    });

    it('returns one error when more than one column has a blank name', () => {
      const invalidTransform = _.cloneDeep(correctTransform);
      invalidTransform[0].name = '';
      invalidTransform[1].name = '';
      expect(V.validate(invalidTransform, sourceColumns)).to.deep.equal([
        {
          type: 'blank_names',
          instances: 2
        }
      ]);
    });

  });

  describe('duplicate name checking', () => {

    it('returns no errors when all column names are different', () => {
      expect(V.validate(correctTransform, sourceColumns)).to.deep.equal([]);
    });

    it('returns one error when two columns have the same name', () => {
      const invalidTransform = _.cloneDeep(correctTransform);
      invalidTransform[0].name = 'Salary';
      expect(V.validate(invalidTransform, sourceColumns)).to.deep.equal([
        {
          type: 'duplicate_names',
          name: 'Salary',
          instances: 2
        }
      ])
    });

    it('returns one error for each duplicate name', () => {
      const invalidTransform = _.cloneDeep(correctTransform);
      invalidTransform[3].name = 'Name';
      invalidTransform[0].name = 'Salary';
      expect(V.validate(invalidTransform, sourceColumns)).to.deep.equal([
        {
          type: 'duplicate_names',
          name: 'Salary',
          instances: 2
        },
        {
          type: 'duplicate_names',
          name: 'Name',
          instances: 2
        }
      ]);
    });

  });

  describe('wrong type checking', () => {

    function checkTypeError(chosenType:ST.TypeName, suggestedType:ST.TypeName, problemType:?string) {
      const sourceColumn = {
        ...sourceColumns[0],
        suggestion: suggestedType
      };
      const problem = V.checkType(chosenType, sourceColumn);
      expect(problem === null ? null : problem.type).to.equal(problemType);
    }

    it('doesn\'t return a problem if you pick the suggested type', () => {
      checkTypeError('text', 'text', null);
      checkTypeError('url', 'url', null);
      checkTypeError('number', 'number', null);
      checkTypeError('money', 'money', null);
    });

    it('returns a "too generic" error if you pick a type more generic than the suggestion', () => {
      checkTypeError('number', 'money', 'type_too_generic');
      checkTypeError('number', 'percent', 'type_too_generic');
      checkTypeError('text', 'money', 'type_too_generic');
      checkTypeError('text', 'percent', 'type_too_generic');
      checkTypeError('text', 'url', 'type_too_generic');
      checkTypeError('text', 'email', 'type_too_generic');
      checkTypeError('text', 'number', 'type_too_generic');
      checkTypeError('text', 'calendar_date', 'type_too_generic');
      checkTypeError('text', 'date', 'type_too_generic');
      checkTypeError('text', 'checkbox', 'type_too_generic');
      checkTypeError('text', 'stars', 'type_too_generic');
    });

    it('returns a "wrong type" error if you pick a type that can\'t be parsed from the suggestion', () => {
      checkTypeError('email', 'text', 'wrong_type_unknown_count');
      checkTypeError('number', 'text', 'wrong_type');
      checkTypeError('money', 'number', 'wrong_type');
      checkTypeError('percent', 'number', 'wrong_type');
    });

  });

  describe('source column dropped checking', () => {

    it('returns a warning if a source column is not in the transform', () => {
      const invalidTransform = _.cloneDeep(correctTransform);
      invalidTransform.splice(3, 1);
      expect(V.validate(invalidTransform, sourceColumns)).to.deep.equal([
        {
          type: 'source_columns_dropped',
          sourceColumns: ['HRD_DT']
        }
      ]);
    });

  });

  describe('composite column checking', () => {

    it('returns an error if the source column is empty (has no components)', () => {
      const invalidTransform = _.cloneDeep(correctTransform);
      invalidTransform[4].columnSource.components = [];
      // add the column that was used in the composite column to avoid a "column dropped" warning
      invalidTransform.push({
        columnSource: {
          type: 'SingleColumn',
          sourceColumn: sourceColumns[4]
        },
        name: 'skills',
        chosenType: 'text',
        transforms: []
      });
      expect(V.validate(invalidTransform, sourceColumns)).to.deep.equal([
        {
          type: 'single_column_error',
          resultColumnName: 'skills!',
          error: {
            type: 'empty_composite_col'
          }
        }
      ])
    });

    it('returns a warning if the composite column is not text', () => {
      const invalidTransform = _.cloneDeep(correctTransform);
      invalidTransform[4].chosenType = 'number';
      expect(V.validate(invalidTransform, sourceColumns)).to.deep.equal([
        {
          type: 'single_column_error',
          resultColumnName: 'skills!',
          error: {
            type: 'non_text_composite_col',
            chosenType: 'number'
          }
        }
      ]);
    });

  });

  describe('problemText (turning error objects into localized text)', () => {

    it('returns correct text for a duplicate_names message', () => {
      const problem: V.ValidationProblem = {
        type: 'duplicate_names',
        name: 'foo',
        instances: 2
      };
      expect(V.problemText(problem)).to.equal('<strong>2</strong> of your columns are named <strong>“foo”</strong>. Columns in a dataset cannot share the same name.');
    });

    it('returns correct text for a blank_name message with one instance', () => {
      const problem: V.ValidationProblem = {
        type: 'blank_names',
        instances: 1
      };
      expect(V.problemText(problem)).to.equal('<strong>One</strong> of your columns does not have a name. Please give it a name.');
    });

    it('returns correct text for a blank_name message with two instances', () => {
      const problem: V.ValidationProblem = {
        type: 'blank_names',
        instances: 2
      };
      expect(V.problemText(problem)).to.equal('<strong>2</strong> of your columns do not have names. Please give them names.');
    });

    it('returns correct text for a source_columns_dropped message', () => {
      const problem: V.ValidationProblem = {
        type: 'source_columns_dropped',
        sourceColumns: [
          sourceColumns[0].name
        ]
      };
      expect(V.problemText(problem)).to.equal('Column <strong>“DEPT”</strong> is in your source data file, but is not currently set to be imported into your dataset.');
    });

    describe('returns correct text for single_column_error messages', () => {

      it('including wrong_type messages', () => {
        const problem = {
          type: 'single_column_error',
          resultColumnName: 'myResultCol',
          error: {
            type: 'wrong_type',
            suggestedType: 'text',
            chosenType: 'number',
            invalidPercent: 25
          }
        };
        expect(V.problemText(problem)).to.equal('Column <strong>myResultCol</strong> is a <strong>Number</strong>, but our analysis indicates that the source column you are trying to import into it is of type <strong>Plain Text</strong>. Should you choose to import that column, roughly <strong>25%</strong> of your data will likely import incorrectly.');
      });

      it('including wrong_type_unknown_count messages', () => {
        const problem = {
          type: 'single_column_error',
          resultColumnName: 'myResultCol',
          error: {
            type: 'wrong_type_unknown_count',
            suggestedType: 'number',
            chosenType: 'money'
          }
        };
        expect(V.problemText(problem)).to.equal('Column <strong>myResultCol</strong> is set to import as <strong>Money</strong> but our analysis shows that <strong>Number</strong> might be a better fit. Unless the column’s data is formatted correctly as Money data may import incorrectly.');
      });

      it('including type_too_generic messages', () => {
        const problem = {
          type: 'single_column_error',
          resultColumnName: 'myResultCol',
          error: {
            type: 'type_too_generic',
            suggestedType: 'number',
            chosenType: 'text'
          }
        };
        expect(V.problemText(problem)).to.equal('Column <strong>myResultCol</strong> is set to import as <strong>Plain Text</strong>, but our analysis indicates that the column is likely a <strong>Number</strong> column. You can import it as Plain Text, but you will lose some features if you do so. We strongly recommend that you import it as <strong>Number</strong>.');
      });

      it('including empty_composite_col messages', () => {
        const problem = {
          type: 'single_column_error',
          resultColumnName: 'myResultCol',
          error: {
            type: 'empty_composite_col'
          }
        };
        expect(V.problemText(problem)).to.equal('Column <strong>myResultCol</strong> is a composite column that will be created out of multiple source columns, but you currently don\'t have it set to be populated by anything. Please add some source columns or text.');
      });

      it('including non_text_composite_col messages', () => {
        const problem = {
          type: 'single_column_error',
          resultColumnName: 'myResultCol',
          error: {
            type: 'non_text_composite_col',
            chosenType: 'email'
          }
        };
        expect(V.problemText(problem)).to.equal('Column <strong>myResultCol</strong> is a composite column that will be created out of multiple source columns, but it is currently set to import as <strong>Email</strong>. Please be certain that combining the columns you have specified will yield a valid Email.');
      });

    });

  });

  describe('location columns checking', () => {
    const sourceColumns = [
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
        "index": 8
      },
      {
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
        "index": 9
      }
    ];

    const locationSource = LocationColumn.emptyLocationSource();

    it('returns no errors on an empty location column source', () => {
      const initialErrors = V.validateResultColumnLocationSource(locationSource);
      expect(initialErrors.length).to.equal(0);
    });

    it('returns a coordinateError when there is a missing lon', () => {
      const coordinateError = V.coordinateError({
        ...locationSource,
        latitude: sourceColumns[8]
      });
      expect(coordinateError).to.deep.equal({
        type: 'missing_lat_long',
        coordinateType: 'latitude',
        missingCoordinateType: 'longitude'
      });
    });

    it('returns a coordinateError when there is a missing lat', () => {
      const coordinateError = V.coordinateError({
        ...locationSource,
        longitude: sourceColumns[9]
      });
      expect(coordinateError).to.deep.equal({
        type: 'missing_lat_long',
        coordinateType: 'longitude',
        missingCoordinateType: 'latitude'
      });
    });

    it('checkLocationColComponentType street', () => {
      // Description
      const valid = sourceColumns[6];
      const noError = V.checkLocationColComponentType('street', valid);
      expect(noError).to.equal(null);

      // Date
      const invalid = sourceColumns[2];
      const error = V.checkLocationColComponentType('street', invalid);
      expect(error.type).to.equal('wrong_type_location');
    });

    it('checkLocationColColumnOrTextType city', () => {
      // Description
      const valid = {
        column: sourceColumns[6],
        isColumn: true
      };
      const noError = V.checkLocationColColumnOrTextType('city', valid);
      expect(noError).to.equal(null);

      // Date
      const invalid = {
        column: sourceColumns[2],
        isColumn: true
      };
      const error = V.checkLocationColColumnOrTextType('city', invalid);
      expect(error.type).to.equal('wrong_type_location');
    });

    it('checkLocationColColumnOrTextType state', () => {
      // Description
      const valid = {
        column: sourceColumns[6],
        isColumn: true
      };
      const noError = V.checkLocationColColumnOrTextType('state', valid);
      expect(noError).to.equal(null);

      // Date
      const invalid = {
        column: sourceColumns[2],
        isColumn: true
      };
      const error = V.checkLocationColColumnOrTextType('state', invalid);
      expect(error.type).to.equal('wrong_type_location');
    });

    it('checkLocationColColumnOrTextType zip', () => {
      // Description
      const valid = {
        column: sourceColumns[6],
        isColumn: true
      };
      const noError = V.checkLocationColColumnOrTextType('zip', valid, ['text', 'number']);
      expect(noError).to.equal(null);

      // Date
      const invalid = {
        column: sourceColumns[2],
        isColumn: true
      };
      const error = V.checkLocationColColumnOrTextType('zip', invalid, ['text', 'number']);
      expect(error.type).to.equal('wrong_type_location');
    });

    it('checkLocationColComponentType lat', () => {
      // latitude
      const latValid = sourceColumns[8];
      const noError = V.checkLocationColComponentType('latitude', latValid, ['number']);
      expect(noError).to.equal(null);

      // Date
      const latInvalid = sourceColumns[2];
      const error = V.checkLocationColComponentType('latitude', latInvalid, ['number']);
      expect(error.type).to.equal('wrong_type_location');
    });

    it('checkLocationColComponentType lon', () => {
      // latitude
      const lonValid = sourceColumns[9];
      const noError = V.checkLocationColComponentType('longitude', lonValid, ['number']);
      expect(noError).to.equal(null);

      // Date
      const lonInvalid = sourceColumns[2];
      const error = V.checkLocationColComponentType('longitude', lonInvalid, ['number']);
      expect(error.type).to.equal('wrong_type_location');
    });


  });

});
