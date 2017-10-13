import _ from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import SourceBreadcrumbs from 'components/SourceBreadcrumbs/SourceBreadcrumbs';
import * as Selectors from 'selectors';

export const mapStateToProps = ({ entities, ui }, { atShowSource, params }) => {
  const revision = Selectors.currentRevision(entities, _.toNumber(params.revisionSeq));
  const { output_schema_id: outputSchemaId } = revision;
  const { input_schema_id: inputSchemaId } = entities.output_schemas[outputSchemaId];
  const { source_id: sourceId } = entities.input_schemas[inputSchemaId];

  return {
    atShowSource,
    sourceId,
    outputSchemaId,
    inputSchemaId
  };
};

export default withRouter(connect(mapStateToProps)(SourceBreadcrumbs));
