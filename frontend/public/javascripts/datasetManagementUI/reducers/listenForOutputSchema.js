import dotProp from 'dot-prop-immutable';
import { LISTEN_FOR_OUTPUT_SCHEMA_SUCCESS } from 'actions/manageUploads';
import { mergeRecords } from 'lib/util';

const listenForOutputSchema = (state, action) => {
  switch (action.type) {
    case LISTEN_FOR_OUTPUT_SCHEMA_SUCCESS: {
      const stateWithUpdatedOutputSchemas = dotProp.set(
        state,
        'entities.output_schemas',
        existingRecords => ({
          ...existingRecords,
          [action.outputSchema.id]: action.outputSchema
        })
      );

      const stateWithUpdatedTransforms = dotProp.set(
        stateWithUpdatedOutputSchemas,
        'entities.transforms',
        existingRecords => mergeRecords(existingRecords, action.transforms)
      );

      const stateWithUpdatedOutputColumns = dotProp.set(
        stateWithUpdatedTransforms,
        'entities.output_columns',
        existingRecords => ({
          ...existingRecords,
          ...action.outputColumns
        })
      );

      return dotProp.set(
        stateWithUpdatedOutputColumns,
        'entities.output_schema_columns',
        existingRecords => ({
          ...existingRecords,
          ...action.outputSchemaColumns
        })
      );
    }

    default:
      return state;
  }
};

export default listenForOutputSchema;
