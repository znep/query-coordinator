import { connect } from 'react-redux';
import * as LoadDataActions from 'datasetManagementUI/reduxStuff/actions/loadData';
import TableBody from 'datasetManagementUI/components/TableBody/TableBody';

const mapStateToProps = ({ ui }, ownProps) => {
  return {
    apiCalls: ui.apiCalls,
    ...ownProps
  };
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  loadVisibleData: () => dispatch(LoadDataActions.loadVisibleData(ownProps.displayState))
});

export default connect(mapStateToProps, mapDispatchToProps)(TableBody);
