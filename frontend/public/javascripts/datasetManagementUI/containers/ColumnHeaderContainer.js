import _ from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { COLUMN_OPERATIONS } from 'reduxStuff/actions/apiCalls';
import { STATUS_CALL_IN_PROGRESS } from 'lib/apiCallStatus';
import ColumnHeader from 'components/ColumnHeader/ColumnHeader';

function activeApiCallInvolvingThis(apiCalls, column) {
  const apiCallsByColumnId = _.chain(apiCalls)
    .filter(call => _.includes(COLUMN_OPERATIONS, call.operation) && call.status === STATUS_CALL_IN_PROGRESS)
    .keyBy('params.outputColumnId')
    .value();

  return _.has(apiCallsByColumnId, column.id);
}

const mapStateToProps = ({ ui }, props) => {
  const { outputColumn } = props;
  return {
    ...props,
    activeApiCallInvolvingThis: activeApiCallInvolvingThis(ui.apiCalls, outputColumn)
  };
};

export default withRouter(connect(mapStateToProps)(ColumnHeader));
