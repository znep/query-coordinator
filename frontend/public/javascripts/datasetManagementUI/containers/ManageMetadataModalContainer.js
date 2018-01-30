import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { hideModal } from 'datasetManagementUI/reduxStuff/actions/modal';
import { dismissMetadataPane } from 'datasetManagementUI/reduxStuff/actions/manageMetadata';
import { getOutputSchemaId, getRevision } from 'datasetManagementUI/containers/ManageMetadataContainer';
import * as Selectors from 'datasetManagementUI/selectors';
import * as Links from 'datasetManagementUI/links/links';
import ManageMetadataModal from 'datasetManagementUI/components/ManageMetadataModal/ManageMetadataModal';

const mapStateToProps = ({ entities }, { params }) => {
  const revisionSeq = Number(params.revisionSeq);
  const revision = getRevision(entities.revisions, revisionSeq) || {};
  const outputSchemaId = getOutputSchemaId(
    Number(params.outputSchemaId),
    revision,
    Selectors.currentOutputSchema(entities, revisionSeq)
  );
  const { source, inputSchema, outputSchema } = Selectors.treeForOutputSchema(entities, outputSchemaId);
  const pathToNewOutputSchema = Links.showOutputSchema(params, source.id, inputSchema.id, outputSchema.id);

  return {
    pathToNewOutputSchema
  };
};

const mapDispatchToProps = (dispatch, { params }) => ({
  cancelClose: () => dispatch(hideModal()),
  yesReallyClose: path => {
    dispatch(hideModal());
    dispatch(dismissMetadataPane(path, params, null, null, true));
  }
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ManageMetadataModal));
