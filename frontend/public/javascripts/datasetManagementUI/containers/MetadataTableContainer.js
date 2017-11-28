import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { makeProps } from 'models/metadataTable';
import MetadataTable from 'components/MetadataTable/MetadataTable';
import { associateChildToParent } from 'reduxStuff/actions/associateCollections';
import { UPDATE_REVISION } from 'reduxStuff/actions/apiCalls';
import _ from 'lodash';


function mergeProps(stateProps, { dispatch }, ownProps) {
  return {
    ...ownProps,
    ...stateProps,
    onSaveAssociationCallback: parentUid =>
      dispatch(associateChildToParent(parentUid, stateProps.revision, ownProps.params))
  };
}

const mapStateToProps = ({ entities, ui }, { params }) => ({
  associatedAssetsApiCalls: _.filter(_.values(ui.apiCalls), (call) => call.operation === UPDATE_REVISION),
  ...makeProps(entities, params)
});

export default withRouter(connect(mapStateToProps, null, mergeProps)(MetadataTable));
