import dotProp from 'dot-prop-immutable';
import { INSERT_INPUT_SCHEMA } from 'reduxStuff/actions/manageUploads';
import { mergeRecords } from 'lib/util';

const insertInputSchema = (state, action) => {
  switch (action.type) {
    case INSERT_INPUT_SCHEMA: {
      const stateWithUpdatedInputSchemas = dotProp.set(state, 'entities.input_schemas', existingRecords =>
        mergeRecords(existingRecords, action.inputSchemas)
      );

      return dotProp.set(stateWithUpdatedInputSchemas, 'entities.input_columns', existingRecords => ({
        ...existingRecords,
        ...action.inputColumns
      }));
    }

    default:
      return state;
  }
};

export default insertInputSchema;
