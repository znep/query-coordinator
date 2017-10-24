import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { showModal } from 'reduxStuff/actions/modal';
import { createImportConfig } from 'reduxStuff/actions/createImportConfig';
import ReadyToImport from 'components/ReadyToImport/ReadyToImport';

const mapStateToProps = ({ entities }, { params }) => {
  const { outputSchemaId } = params;

  if (outputSchemaId) {
    const outputSchema = entities.output_schemas[outputSchemaId];
    const inputSchema = entities.input_schemas[outputSchema.input_schema_id];
    const source = entities.sources[inputSchema.source_id];
    const errorRows = outputSchema.error_count || 0;
    const importableRows = Math.max(0, inputSchema.total_rows - errorRows);

    return {
      source,
      inputSchema,
      importableRows,
      errorRows,
      outputSchema,
      params
    };
  } else {
    return {};
  }
};

const mergeProps = (stateProps, { dispatch }, ownProps) => ({
  ...ownProps,
  ...stateProps,
  openModal: componentName => dispatch(showModal(componentName)),
  createConfigAndOpenModal: () => {
    dispatch(createImportConfig(
      stateProps.source,
      stateProps.outputSchema.id
    )).then((resource) => {
      dispatch(showModal('SetupAutomation', {
        outputSchemaId: stateProps.outputSchema.id,
        importConfigName: resource.name,
        fourfour: ownProps.params.fourfour,
        source: stateProps.source
      }));
    });
  }
});

export default withRouter(connect(mapStateToProps, null, mergeProps)(ReadyToImport));
