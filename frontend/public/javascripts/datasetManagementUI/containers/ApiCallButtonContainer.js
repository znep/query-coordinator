import _ from 'lodash';
import { connect } from 'react-redux';
import ApiCallButton from 'datasetManagementUI/components/ApiCallButton/ApiCallButton';

const SHOW_RESULT_STATE_FOR_MS = 1000;

export const findMatchingApiCall = (apiCalls, operation, callParams, limit) =>
  _.find(apiCalls, call => {
    const timeElapsed = new Date() - (call.succeededAt || call.failedAt || call.startedAt);
    // we have a match if
    // 1. the api call operation matches
    // 2. the api callParams match
    // 3. the call finished/started/failed within a certain timeframe (specified by SHOW_RESULT_STATE_FOR_MS)
    // If no match, the ApiCallButton just renders normal blue button rather than one that tracks apiCall status
    return _.isMatch(call, { operation, callParams }) && timeElapsed < limit;
  });

export const mapStateToProps = ({ ui }, ownProps) => {
  const apiCall = findMatchingApiCall(
    ui.apiCalls,
    ownProps.operation,
    ownProps.callParams,
    ownProps.limit || SHOW_RESULT_STATE_FOR_MS
  );

  return {
    status: apiCall ? apiCall.status : null
  };
};

export default connect(mapStateToProps)(ApiCallButton);
