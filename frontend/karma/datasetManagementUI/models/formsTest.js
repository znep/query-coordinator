import { assert } from 'chai';
import * as FormModel from 'models/forms';
import state from '../data/stateWithRevision';
import dotProp from 'dot-prop-immutable';

describe('models/forms', () => {
  describe('validateDatasetForm', () => {
    it('succeeds if form is valid', () => {
      const { regular, custom } = FormModel.makeFieldsets(
        state.entities.views['nn5w-zj56']
      );

      const res = FormModel.validateDatasetForm(regular, custom).matchWith({
        Success: () => 'success',
        Failure: () => 'big fail'
      });

      assert.equal(res, 'success');
    });

    it('fails if form is invalid', () => {
      const { regular, custom } = FormModel.makeFieldsets(
        state.entities.views['nn5w-zj56']
      );

      const [head, ...tail] = regular;

      const invalid = {
        ...head,
        fields: head.fields.map(field => ({ ...field, value: null }))
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
      const res = FormModel.validateColumnForm(state.entities);

      assert.deepEqual(res, []);
    });

    it('returns an array of errors if invalid', () => {
      const invalidEntities = dotProp.set(
        state.entities,
        `output_columns.${2125}.field_name`,
        'intake_date'
      );
      const res = FormModel.validateColumnForm(invalidEntities);

      const expectedRes = [
        { message: 'Field names must be unique', fieldName: 'field-name-2124' },
        { message: 'Field names must be unique', fieldName: 'field-name-2125' }
      ];

      assert.deepEqual(res, expectedRes);
    });
  });
});
