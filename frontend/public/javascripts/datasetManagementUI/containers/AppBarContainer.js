import _ from 'lodash';
import { connect } from 'react-redux';
import * as ApplyRevision from 'reduxStuff/actions/applyRevision';
import AppBar from 'components/AppBar/AppBar';

function mapStateToProps({ entities }) {
  // only show the preview link when an upsert job has successfully completed
  const showPreviewLink = !!_.find(entities.task_sets, {
    status: ApplyRevision.TASK_SET_SUCCESSFUL
  });

  return {
    name: _.values(entities.views)[0].name,
    showPreviewLink
  };
}

export default connect(mapStateToProps)(AppBar);
