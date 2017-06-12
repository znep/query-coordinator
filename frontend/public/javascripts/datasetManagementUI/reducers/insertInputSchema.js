import dotProp from 'dot-prop-immutable';
import { INSERT_INPUT_SCHEMA } from 'actions/manageUploads';

const insertInputSchema = (state, action) => {
  switch (action.type) {
    case INSERT_INPUT_SCHEMA: {
      let stateWithUpdatedInputSchemas = state;

      action.inputSchemaUpdates.forEach(
        update =>
          (stateWithUpdatedInputSchemas = dotProp.set(
            stateWithUpdatedInputSchemas,
            `entities.input_schemas.${update.id}`,
            record => ({
              ...record,
              ...update
            })
          ))
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
