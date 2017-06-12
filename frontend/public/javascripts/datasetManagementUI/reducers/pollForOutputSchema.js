import dotProp from 'dot-prop-immutable';
import { POLL_FOR_OUTPUT_SCHEMA_SUCCESS } from 'actions/manageUploads';

const pollForOutputSchema = (state, action) => {
  switch (action.type) {
    case POLL_FOR_OUTPUT_SCHEMA_SUCCESS: {
      const stateWithUpdatedOutputSchemas = dotProp.set(
        state,
        'entities.output_schemas',
        existingRecords => ({
          ...existingRecords,
          [action.outputSchema.id]: action.outputSchema
        })
      );

      let stateWithUpdatedTransforms = stateWithUpdatedOutputSchemas;

      action.transformUpdates.forEach(update => {
        stateWithUpdatedTransforms = dotProp.set(
          stateWithUpdatedTransforms,
          `entities.transforms.${update.id}`,
          record => ({
            ...record,
            ...update
          })
        );
      });

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

export default pollForOutputSchema;
