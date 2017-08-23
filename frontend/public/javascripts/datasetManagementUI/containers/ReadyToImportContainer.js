import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { showModal } from 'reduxStuff/actions/modal';
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
      outputSchema
    };
  } else {
    return {};
  }
};

const mapDispatchToProps = dispatch => ({
  openModal: componentName => dispatch(showModal(componentName))
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ReadyToImport));
