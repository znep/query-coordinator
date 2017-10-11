import dotProp from 'dot-prop-immutable';
import { CREATE_SOURCE_SUCCESS, CREATE_UPLOAD_SOURCE_SUCCESS } from 'reduxStuff/actions/createSource';

const createSource = (state, action) => {
  switch (action.type) {
    case CREATE_SOURCE_SUCCESS: {
      const stateWithUpdatedSources = dotProp.set(state, 'entities.sources', existingRecords => ({
        ...existingRecords,
        ...action.source
      }));

      const stateWithUpdatedInputSchemas = dotProp.set(
        stateWithUpdatedSources,
        'entities.input_schemas',
        existingRecords => ({
          ...existingRecords,
          ...action.inputSchemas
        })
      );

      const stateWithUpdatedInputCols = dotProp.set(
        stateWithUpdatedInputSchemas,
        'entities.input_columns',
        existingRecords => ({
          ...existingRecords,
          ...action.inputColumns
        })
      );

      const stateWithUpdatedOutputSchemas = dotProp.set(
        stateWithUpdatedInputCols,
        'entities.output_schemas',
        existingRecords => ({
          ...existingRecords,
          ...action.outputSchemas
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

    case CREATE_UPLOAD_SOURCE_SUCCESS: {
      return dotProp.set(state, `entities.sources.${action.source.id}`, action.source);
    }

    default:
      return state;
  }
};

export default createSource;
