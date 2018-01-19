import { assert } from 'chai';
import {
  getOutputSchemaCols,
  getRevision,
  shapeCustomFields,
  addFieldValues,
  validateFieldset,
  hasDatasetErrors,
  hasColumnErrors,
  isUnique,
  partitionCustomNoncustom,
  getFieldsBy,
  shapeOutputSchemaCols,
  validateColumns,
  handleServerErrors
} from 'datasetManagementUI/containers/ManageMetadataContainer';

describe('ManageMetadata Container', () => {
  describe('getRevision', () => {
    const revision1 = {
      id: 600,
      fourfour: 'abcd-efgh',
      revision_seq: 0
    };

    const revision2 = {
      id: 601,
      fourfour: 'abcd-efgh',
      revision_seq: 1
    };

    const revisions = {
      [revision1.id]: revision1,
      [revision2.id]: revision2
    };

    it('finds a revision by sequence number if it exists in revisions table', () => {
      const result = getRevision(revisions, 0);
      assert.deepEqual(result, revision1);
    });

    it('returns undefined if revision sequence param is not a number', () => {
      const result = getRevision(revisions, '1');
      assert.isUndefined(result);
    });

    it('returns undefined if revision sequence param is NaN', () => {
      const result = getRevision(revisions, NaN);
      assert.isUndefined(result);
    });

    it('returns undefined if the revisions table is undefined', () => {
      const result = getRevision(undefined, 0);
      assert.isUndefined(result);
    });
  });

  describe('getOutputSchemaCols', () => {
    const output_schema_columns = {
      '4-1234': {
        id: '4-1234',
        output_schema_id: 4,
        output_column_id: 1234,
        is_primary_key: false
      },
      '4-1235': {
        id: '4-1235',
        output_schema_id: 4,
        output_column_id: 1235,
        is_primary_key: false
      },
      '5-1236': {
        id: '5-1236',
        output_schema_id: 5,
        output_column_id: 1236,
        is_primary_key: false
      }
    };

    const output_schemas = {
      '4': {
        id: 4
      },
      '5': {
        id: 5
      }
    };

    const output_columns = {
      '1234': {
        id: 1234,
        position: 1,
        transform_id: 7
      },
      '1235': {
        id: 1235,
        position: 2,
        transform_id: 7
      },
      '1236': {
        id: 1236,
        position: 1,
        transform_id: 7
      }
    };

    const transforms = {
      '7': {
        id: 7
      }
    };

    const entities = {
      transforms,
      output_schemas,
      output_columns,
      output_schema_columns
    };

    it('returns an array of output columns for an output schema', () => {
      const result = getOutputSchemaCols(entities, 4);
      assert.isArray(result);
      assert.lengthOf(result, 2);
      assert.sameMembers(result.map(res => res.id), [1234, 1235]);
    });

    it('returns undefined if outputSchemaId param is not a number', () => {
      const result = getOutputSchemaCols(entities, '4');
      assert.isUndefined(result);
    });

    it('returns undefined if outputSchemaId param is NaN', () => {
      const result = getOutputSchemaCols(entities, NaN);
      assert.isUndefined(result);
    });
  });

  describe('shapeCustomFields', () => {
    const fieldsFromRails = [
      {
        name: 'first',
        required: true
      },
      {
        name: 'second',
        private: true
      }
    ];

    it('successfully re-shapes an array of text fields', () => {
      const fields = shapeCustomFields(fieldsFromRails);

      assert.isTrue(fields[0].isRequired);
      assert.isTrue(fields[0].isCustom);
      assert.equal(fields[0].elementType, 'text');
    });

    it('handles a select field', () => {
      const selectField = {
        name: 'fish',
        type: 'fixed',
        options: ['onefish', 'twofish', 'redfish', 'bluefish']
      };

      const serverFieldsWithSelect = [...fieldsFromRails, selectField];

      const reshapedSelect = shapeCustomFields(serverFieldsWithSelect).find(
        field => field.options
      );

      assert.equal(reshapedSelect.elementType, 'select');
      assert.equal(
        reshapedSelect.options.length,
        selectField.options.length + 1
      );
    });

    it('returns an empty array if given an undefined value', () => {
      let notDefined;
      const res = shapeCustomFields(notDefined);
      assert.deepEqual(res, []);
    });
  });

  describe('addFieldValues', () => {
    const revision = {
      metadata: {
        name: 'my dataset',
        privateMetadata: {
          custom_fields: {
            FieldsetOne: {
              name: 'test'
            }
          },
          contactEmail: 'test@socrata.com'
        },
        metadata: {
          custom_fields: {
            FieldsetOne: {
              foo: 'bar',
              '*anu@@': 'beep'
            }
          }
        }
      }
    };

    it('returns an empty list if fields param is not defined', () => {
      const result = addFieldValues(undefined, 'An irrelevant name', revision);
      assert.deepEqual(result, []);
    });

    it('returns an empty string if it cannot find the value on the revision', () => {
      const fieldWithNoValue = {
        name: 'valueless',
        isPrivate: true,
        isCustom: false
      };

      const result = addFieldValues(
        [fieldWithNoValue],
        'An irrelevant name',
        revision
      );

      assert.equal(result[0].value, '');
    });

    it('adds the value to a custom private field', () => {
      const privateCustom = {
        name: 'name',
        isCustom: true,
        isPrivate: true
      };

      const result = addFieldValues([privateCustom], 'FieldsetOne', revision);

      assert.equal(result[0].value, 'test');
    });

    it('adds the value to a custom field', () => {
      const custom = {
        name: 'foo',
        isCustom: true,
        isPrivate: false
      };

      const result = addFieldValues([custom], 'FieldsetOne', revision);

      assert.equal(result[0].value, 'bar');
    });

    it('adds the value to a private field', () => {
      const privateField = {
        name: 'contactEmail',
        isPrivate: true
      };

      const result = addFieldValues([privateField], 'Contact Info', revision);

      assert.equal(result[0].value, 'test@socrata.com');
    });

    it('adds the value to a normal field', () => {
      const field = {
        name: 'name'
      };

      const result = addFieldValues([field], 'Title', revision);

      assert.equal(result[0].value, 'my dataset');
    });

    it('handles stupidly named custom fields with special characters', () => {
      const stupidField = {
        name: '*anu@@',
        isCustom: true
      };

      const result = addFieldValues([stupidField], 'FieldsetOne', revision);

      assert.equal(result[0].value, 'beep');
    });
  });

  describe('validateFieldset', () => {
    const requiredMessage = 'this is required';
    const minLengthMessage = 'this is too short';

    function isRequired(v) {
      if (v) {
        return;
      } else {
        return requiredMessage;
      }
    }

    function minLength(l) {
      return v => {
        if (v >= l) {
          return;
        } else {
          return minLengthMessage;
        }
      };
    }

    const fieldset = {
      title: 'My Fieldset',
      subtitle: 'It is a good fieldset',
      fields: {
        name: {
          name: 'name',
          value: 'B',
          isRequired: true,
          validations: [isRequired, minLength(7)]
        },
        age: {
          name: 'age',
          value: '',
          isRequired: true,
          validations: [isRequired]
        },
        address: {
          name: 'address',
          value: 'hey'
        }
      }
    };

    it('applies all validations properly', () => {
      const res = validateFieldset(fieldset);

      assert.equal(res.fields.name[0], minLengthMessage);
      assert.equal(res.fields.age[0], requiredMessage);
      assert.isEmpty(res.fields.address);
    });

    it('concats errors if there are more than one', () => {
      const newFieldset = {
        ...fieldset,
        fields: {
          name: {
            name: 'name',
            value: '',
            isRequired: true,
            validations: [isRequired, minLength(7)]
          }
        }
      };

      const res = validateFieldset(newFieldset);

      assert.sameMembers(res.fields.name, [requiredMessage, minLengthMessage]);
    });

    it('returns an empty object if fieldset is undefined for some reason', () => {
      const res = validateFieldset(undefined);

      assert.isEmpty(res.fields);
    });

    it('returns an empty array if no validations for a field are specified', () => {
      const res = validateFieldset(fieldset);

      assert.isEmpty(res.fields.address);
      assert.isArray(res.fields.address);
    });
  });

  describe('hasErrors', () => {
    const validFieldset = {
      fields: {
        name: [],
        age: []
      }
    };

    const invalidFieldset = {
      fields: {
        address: ['city is required'],
        dob: []
      }
    };

    const fieldlessFieldset = {
      boop: 'beep'
    };

    it('returns true when the passed object contains errors', () => {
      assert.isTrue(
        hasDatasetErrors({
          one: validFieldset,
          two: invalidFieldset
        })
      );
    });

    it('returns false when the passed object contains no errors', () => {
      assert.isFalse(
        hasDatasetErrors({
          validFieldset
        })
      );
    });

    it('returns false if its param is undefined for some reason', () => {
      assert.isFalse(hasDatasetErrors(undefined));
    });

    it('handles fieldsets that have no fields', () => {
      assert.isFalse(
        hasDatasetErrors({
          fieldlessFieldset
        })
      );
    });
  });

  describe('hasColumnErrors', () => {
    const validColumns = {
      '1000': {
        field_name: 'one',
        display_name: 'a name'
      },
      '1001': {
        field_name: 'two',
        display_name: 'another name'
      },
      '1002': {
        field_name: 'three',
        display_name: 'yet another name'
      }
    };

    const invalidColumns = {
      ...validColumns,
      '1003': {
        field_name: '%^!!aa',
        display_name: ''
      }
    };

    it('returns true if 1 or more column errors exist', () => {
      const validationResults = validateColumns(invalidColumns);
      assert.isTrue(hasColumnErrors(validationResults));
    });

    it('returns false if no columns have errors', () => {
      const validationResults = validateColumns(validColumns);

      assert.isFalse(hasColumnErrors(validationResults));
    });

    it('returns false if the input is undefined', () => {
      assert.isFalse(hasColumnErrors(undefined));
    });
  });

  describe('isUnique', () => {
    it('returns an error message if a value appears more than once in the specified set of values', () => {
      const validator = isUnique(['foo', 'bar', 'foo', 'baz']);
      assert.isOk(validator('foo'));
    });

    it('returns undefined--meaning valid--if the value appears only once in the specified set of values', () => {
      const validator = isUnique(['foo', 'bar', 'baz']);
      assert.isUndefined(validator('foo'));
    });

    it('returns undefined--meaning valid--if either input is undefined', () => {
      const validator1 = isUnique(['foo']);
      const validator2 = isUnique(undefined);

      assert.isUndefined(validator1(undefined));
      assert.isUndefined(validator2('foo'));
    });
  });

  describe('validateColumns', () => {
    const validColumns = {
      '1000': {
        field_name: 'one',
        display_name: 'a name'
      },
      '1001': {
        field_name: 'two',
        display_name: 'another name'
      },
      '1002': {
        field_name: 'three',
        display_name: 'yet another name'
      }
    };

    it('returns an object with the same keys as the object passed in', () => {
      const result = validateColumns(validColumns);
      assert.sameMembers(Object.keys(result), Object.keys(validColumns));
    });

    it('catches field name duplication', () => {
      const dupFieldName = {
        ...validColumns,
        '1003': {
          field_name: 'three',
          display_name: 'boop beep'
        }
      };

      const result = validateColumns(dupFieldName);

      assert.equal(result['1003'].field_name.length, 1);
      assert.equal(result['1002'].field_name.length, 1);
    });

    it('catches display name duplication', () => {
      const dupDisplayName = {
        ...validColumns,
        '1003': {
          field_name: 'boop',
          display_name: 'a name'
        }
      };

      const result = validateColumns(dupDisplayName);
      assert.equal(result['1003'].display_name.length, 1);
      assert.equal(result['1000'].display_name.length, 1);
    });

    it('catches an invalid field name', () => {
      const withInvalidFieldName = {
        ...validColumns,
        ['1003']: {
          field_name: '@--wrong-name!!',
          display_name: 'ok'
        }
      };

      const result = validateColumns(withInvalidFieldName);

      assert.equal(result['1003'].field_name.length, 1);
    });

    it('catches a missing field name', () => {
      const withMissingfieldName = {
        ...validColumns,
        ['1003']: {
          field_name: '',
          display_name: 'weeee'
        }
      };

      const result = validateColumns(withMissingfieldName);

      assert.equal(result['1003'].field_name.length, 1);
    });

    it('catches a missing display name', () => {
      const withMissingDisplayName = {
        ...validColumns,
        ['1003']: {
          field_name: 'ok',
          display_name: ''
        }
      };

      const result = validateColumns(withMissingDisplayName);

      assert.equal(result['1003'].display_name.length, 1);
    });

    it('returns an empty object if the in put is undefined for whatever reason', () => {
      const result = validateColumns(undefined);
      assert.isObject(result);
      assert.isEmpty(result);
    });
  });

  describe('partitionCustomNoncustom', () => {
    it('divides a object based on the presence of an isCustom attribute', () => {
      const one = {
        title: 'one'
      };

      const two = {
        title: 'two',
        isCustom: true
      };

      const fieldsets = {
        one,
        two
      };

      const { custom, noncustom } = partitionCustomNoncustom(fieldsets);

      assert.deepEqual(custom, { two });
      assert.deepEqual(noncustom, { one });
    });

    it('does not blow up if given an undefined value', () => {
      const { custom, noncustom } = partitionCustomNoncustom(undefined);

      assert.isObject(custom);
      assert.isEmpty(custom);
      assert.isObject(noncustom);
      assert.isEmpty(noncustom);
    });
  });

  describe('getFieldsBy', () => {
    const fieldset = {
      fields: {
        one: {
          name: 'one',
          value: 'ok',
          isPrivate: true
        },
        two: {
          name: 'two',
          value: 'good'
        },
        three: {
          name: 'three',
          value: ''
        }
      }
    };

    it('correctly extracts fields from a fieldset', () => {
      const actual = getFieldsBy(fieldset, f => !f.isPrivate);
      const expected = { two: fieldset.fields.two.value, three: null };
      assert.deepEqual(actual, expected);
    });

    it('converts any empty string value to null', () => {
      const actual = getFieldsBy(fieldset, f => !f.isPrivate).three;
      assert.isNull(actual);
    });

    it('returns an empty object if given an undefiend value instead of a fieldset', () => {
      const actual = getFieldsBy(undefined, () => {});

      assert.isEmpty(actual);
      assert.isObject(actual);
    });

    it('returns an empy object if the fieldset has no fields property', () => {
      const actual = getFieldsBy({ foo: 'bar' }, () => {});

      assert.isEmpty(actual);
      assert.isObject(actual);
    });
  });

  describe('shapeOutputSchemaCols', () => {
    it('turns an array of output columns into an object keyed by column id', () => {
      const cols = [
        { position: 1, id: 123, field_name: 'first' },
        { position: 2, id: 124, field_name: 'second' }
      ];

      assert.deepEqual(shapeOutputSchemaCols(cols), {
        [123]: cols[0],
        [124]: cols[1]
      });
    });

    it('returns an empty object if given an undefined value', () => {
      assert.deepEqual(shapeOutputSchemaCols(), {});
    });
  });

  describe('handleServerErrors', () => {
    const validColumns = [
      { position: 1, id: 1, display_name: 'one', field_name: 'one' },
      { position: 2, id: 2, display_name: 'two', field_name: 'two' }
    ];

    it('returns an empty array if details object contains no errors', () => {
      const result = handleServerErrors({}, validColumns);

      assert.isObject(result);
      assert.isEmpty(result);
    });

    it('identifies all columns with duplicate display names', () => {
      const colsWithDuplicateDisplayName = [
        ...validColumns,
        { position: 3, id: 3, display_name: 'one', field_name: 'three' }
      ];

      const result = handleServerErrors(
        { display_name: [{ position: 1, value: 'one' }] },
        colsWithDuplicateDisplayName
      );

      assert.sameMembers(Object.keys(result), ['1', '3']);
    });

    it('identifies all columns with duplicate field names', () => {
      const colsWithDuplicateFieldNames = [
        ...validColumns,
        { position: 3, id: 3, display_name: 'three', field_name: 'two' }
      ];

      const result = handleServerErrors(
        { field_name: [{ position: 2, value: 'two' }] },
        colsWithDuplicateFieldNames
      );

      assert.sameMembers(Object.keys(result), ['2', '3']);
    });

    it('returns an empty object if either input is undefined', () => {
      const result = handleServerErrors(undefined, undefined);

      assert.isObject(result);
      assert.isEmpty(result);
    });
  });
});
