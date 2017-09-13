import _ from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import UploadBreadcrumbs from 'components/UploadBreadcrumbs/UploadBreadcrumbs';
import * as Selectors from 'selectors';

export const mapStateToProps = ({ entities, ui }, { atShowUpload, params }) => {
  const rseq = _.toNumber(params.revisionSeq);
  const source = Selectors.currentSource(entities, rseq);
  const revision = Selectors.currentRevision(entities, rseq);
  let currentOutputSchema = { id: null };
  let currentInputSchema = { id: null };
  let sourceId = null;

  if (source && revision) {
    sourceId = source.id;

    const inputSchemaList = Object.keys(entities.input_schemas).map(
      isid => entities.input_schemas[Number(isid)]
    );

    currentInputSchema = inputSchemaList.find(is => is.source_id === Number(sourceId)) || { id: null };

    const outputSchemasForCurrentInputSchema = currentInputSchema
      ? _.pickBy(entities.output_schemas, os => os.input_schema_id === currentInputSchema.id)
      : null;

    currentOutputSchema = !_.isEmpty(outputSchemasForCurrentInputSchema)
      ? _.values(outputSchemasForCurrentInputSchema).find(os => os.id === revision.output_schema_id)
      : { id: null };
  }

  return {
    atShowUpload,
    sourceId,
    outputSchemaId: currentOutputSchema.id,
    inputSchemaId: currentInputSchema.id
  };
};

export default withRouter(connect(mapStateToProps)(UploadBreadcrumbs));
