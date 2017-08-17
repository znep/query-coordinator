import _ from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import * as ApplyRevision from 'reduxStuff/actions/applyRevision';
import AppBar from 'components/AppBar/AppBar';

function mapStateToProps({ entities }, { params }) {
  // only show the preview link when an upsert job has successfully completed
  const showPreviewLink = !!_.find(entities.task_sets, {
    status: ApplyRevision.TASK_SET_SUCCESSFUL
  });

  const revision = _.find(entities.revisions, { revision_seq: _.toNumber(params.revisionSeq) });

  return {
    name: _.values(entities.views)[0].name,
    showPreviewLink,
    revision
  };
}

export default withRouter(connect(mapStateToProps)(AppBar));
