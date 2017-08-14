import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { hideModal } from 'reduxStuff/actions/modal';
import { applyRevision } from 'reduxStuff/actions/applyRevision';
import PublishConfirmation from 'components/PublishConfirmation/PublishConfirmation';

export function mapDispatchToProps(dispatch) {
  return {
    doCancel: () => dispatch(hideModal()),
    doUpdate: params => dispatch(applyRevision(params))
  };
}

export default withRouter(connect(null, mapDispatchToProps)(PublishConfirmation));
