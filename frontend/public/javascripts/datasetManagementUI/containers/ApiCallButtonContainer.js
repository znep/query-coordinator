import _ from 'lodash';
import { connect } from 'react-redux';
import { PropTypes } from 'react';
import ApiCallButton from 'components/ApiCallButton/ApiCallButton';

const SHOW_RESULT_STATE_FOR_MS = 1000;

function mapStateToProps({ ui }, ownProps) {
  const apiCall = _.find(ui.apiCalls, call => {
    return (
      _.isMatch(call, { operation: ownProps.operation, params: ownProps.params }) &&
      new Date() - (call.succeededAt || call.failedAt || call.startedAt) < SHOW_RESULT_STATE_FOR_MS
    );
  });

  return {
    status: apiCall ? apiCall.status : null
  };
}

const ConnectedApiCallButton = connect(mapStateToProps)(ApiCallButton);

ConnectedApiCallButton.propTypes = {
  operation: PropTypes.string.isRequired,
  params: PropTypes.object,
  onClick: PropTypes.func.isRequired,
  additionalClassName: PropTypes.string,
  children: PropTypes.node
};

export default ConnectedApiCallButton;
