import { assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import NewForm, {
  getOutputSchemaCols,
  getRevision,
  shapeCustomFields
} from 'components/NewForm/NewForm';

describe.only('NewForm', () => {
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
      assert.equal(fields[0].inputType, 'text');
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

      assert.equal(reshapedSelect.inputType, 'select');
      assert.equal(reshapedSelect.options.length, selectField.options.length);
    });

    it('returns an empty array if given an undefined value', () => {
      let notDefined;
      const res = shapeCustomFields(notDefined);
      assert.deepEqual(res, []);
    });
  });
});
