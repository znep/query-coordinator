import { assert } from 'chai';
import * as FormModel from 'models/forms';
import * as Selectors from 'selectors';
import state from '../data/stateWithRevision';
import dotProp from 'dot-prop-immutable';

describe('models/forms', () => {
  describe('validateDatasetForm', () => {

    const customMetadataFieldsets = state.entities.views['nn5w-zj56'].customMetadataFieldsets;
    const revision = state.entities.revisions[187];

    it('succeeds if form is valid', () => {
      const { regular, custom } = FormModel.makeFieldsets(
        revision,
        customMetadataFieldsets
      );

      const res = FormModel.validateDatasetForm(regular, custom).matchWith({
        Success: () => 'success',
        Failure: () => 'big fail'
      });

      assert.equal(res, 'success');
    });

    it('fails if form is invalid', () => {
      const { regular, custom } = FormModel.makeFieldsets(
        revision,
        customMetadataFieldsets
      );

      const [head, ...tail] = regular;

      const invalid = {
        ...head,
        fields: head.fields.map(field => ({
          ...field,
          data: {
            ...field.data,
            value: null
          }
        }))
      };

      const invalidRegular = [invalid, ...tail];

      const res = FormModel.validateDatasetForm(
        invalidRegular,
        custom
      ).matchWith({
        Success: () => 'success',
        Failure: x => x.value
      });

      const expectedResponse = {
        message: 'This field is required',
        fieldName: 'name',
        fieldset: 'Title and Description'
      };

      assert.deepEqual(res[0], expectedResponse);
    });
  });

  describe('validateColumnForm', () => {
    it('returns an empty array if valid', () => {
      const outputSchemaId = Selectors.currentOutputSchema(state.entities, 0).id;
      const res = FormModel.validateColumnForm(outputSchemaId, state.entities);

      assert.deepEqual(res, []);
    });

    it('returns an array of errors if invalid', () => {
      const invalidEntities = dotProp.set(
        state.entities,
        `output_columns.${2125}.field_name`,
        'intake_date'
      );
      const outputSchemaId = Selectors.currentOutputSchema(state.entities, 0).id;
      const res = FormModel.validateColumnForm(outputSchemaId, invalidEntities);

      const expectedRes = [
        { message: 'Field names must be unique', fieldName: 'field-name-2124' },
        { message: 'Field names must be unique', fieldName: 'field-name-2125' }
      ];

      assert.deepEqual(res, expectedRes);
    });
  });
});
