import _ from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import SourceBreadcrumbs from 'components/SourceBreadcrumbs/SourceBreadcrumbs';
import * as Selectors from 'selectors';

export const mapStateToProps = ({ entities, ui }, { atShowSource, params }) => {
  let inputSchema;
  let inputSchemaId;
  let sourceId;

  const revision = Selectors.currentRevision(entities, _.toNumber(params.revisionSeq));
  const { output_schema_id: outputSchemaId } = revision;
  const outputSchema = entities.output_schemas[outputSchemaId];

  // can't just do !!outputSchemaId because it could be 0 possibly?
  if (outputSchema && outputSchema.input_schema_id != null) {
    inputSchemaId = outputSchema.input_schema_id;
    inputSchema = entities.input_schemas[inputSchemaId];
  }

  if (inputSchema && inputSchema.source_id != null) {
    sourceId = inputSchema.source_id;
  }

  return {
    atShowSource,
    sourceId,
    outputSchemaId,
    inputSchemaId
  };
};

export default withRouter(connect(mapStateToProps)(SourceBreadcrumbs));
