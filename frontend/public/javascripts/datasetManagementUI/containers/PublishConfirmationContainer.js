import _ from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { hideModal } from 'datasetManagementUI/reduxStuff/actions/modal';
import { applyRevision, updatePermission } from 'datasetManagementUI/reduxStuff/actions/applyRevision';
import PublishConfirmation,
  { PERMISSIONS } from 'datasetManagementUI/components/PublishConfirmation/PublishConfirmation';
import { addNotification } from 'datasetManagementUI/reduxStuff/actions/notifications';

export function mapStateToProps({ entities }, { params }) {
  const rev = _.values(entities.revisions).find(r => r.revision_seq === _.toNumber(params.revisionSeq)) || {};

  const { id: revisionId } = rev;

  const view = _.get(entities, ['views', params.fourfour], {});

  const permission = _.get(entities, ['revisions', revisionId, 'action', 'permission'], PERMISSIONS.PUBLIC);

  return {
    view,
    permission
  };
}

function mapDispatchToProps(dispatch, { params }) {
  return {
    doCancel: () => dispatch(hideModal()),
    async doUpdateAndApply(permission) {
      try {
        await dispatch(updatePermission(permission, params));
        await dispatch(applyRevision(params));
      } catch (e) {
        dispatch(addNotification('error', I18n.notifications.dataset_revision_error));
        return;
      }
    }
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PublishConfirmation));
