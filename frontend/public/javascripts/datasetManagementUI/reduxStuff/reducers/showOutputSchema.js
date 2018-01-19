import dotProp from 'dot-prop-immutable';
import { CREATE_NEW_OUTPUT_SCHEMA_SUCCESS } from 'datasetManagementUI/reduxStuff/actions/showOutputSchema';

const showOutputSchema = (state, action) => {
  switch (action.type) {
    case CREATE_NEW_OUTPUT_SCHEMA_SUCCESS: {
      const stateWithUpdatedOutputSchemas = dotProp.set(
        state,
        'entities.output_schemas',
        existingRecords => ({
          ...existingRecords,
          ...action.outputSchema
        })
      );

      const stateWithUpdatedOutputColumns = dotProp.set(
        stateWithUpdatedOutputSchemas,
        'entities.output_columns',
        existingRecords => ({
          ...existingRecords,
          ...action.outputColumns
        })
      );

      const stateWithUpdatedOutputSchemaColumns = dotProp.set(
        stateWithUpdatedOutputColumns,
        'entities.output_schema_columns',
        existingRecords => ({
          ...existingRecords,
          ...action.outputSchemaColumns
        })
      );

      return dotProp.set(stateWithUpdatedOutputSchemaColumns, 'entities.transforms', existingRecords => ({
        ...existingRecords,
        ...action.transforms
      }));
    }

    default:
      return state;
  }
};

export default showOutputSchema;
