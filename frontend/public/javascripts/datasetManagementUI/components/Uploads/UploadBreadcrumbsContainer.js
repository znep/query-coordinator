import _ from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import UploadBreadcrumbs from 'components/Uploads/UploadBreadcrumbs';
import * as Selectors from 'selectors';

export const mapStateToProps = ({ entities, ui }, { atShowUpload }) => {
  const source = Selectors.latestSource(entities);
  let currentOutputSchema = { id: null };
  let currentInputSchema = { id: null };
  let sourceId = null;

  if (source) {
    sourceId = source.id;

    const inputSchemaList = Object.keys(entities.input_schemas).map(
      isid => entities.input_schemas[Number(isid)]
    );

    currentInputSchema = inputSchemaList.find(is => is.source_id === Number(sourceId)) || { id: null };

    const outputSchemasForCurrentInputSchema = currentInputSchema
      ? _.pickBy(entities.output_schemas, os => os.input_schema_id === currentInputSchema.id)
      : null;

    currentOutputSchema = !_.isEmpty(outputSchemasForCurrentInputSchema)
      ? _.maxBy(_.values(outputSchemasForCurrentInputSchema), 'id') // TODO: use revision current output schema if it's on this input schema
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
