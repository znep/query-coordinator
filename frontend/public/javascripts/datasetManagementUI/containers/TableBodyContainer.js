import { connect } from 'react-redux';
import * as LoadDataActions from 'reduxStuff/actions/loadData';
import TableBody from 'components/TableBody/TableBody';

const mapStateToProps = ({ ui }, ownProps) => ({
  apiCalls: ui.apiCalls,
  ...ownProps
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  loadVisibleData: () => dispatch(LoadDataActions.loadVisibleData(ownProps.displayState))
});

export default connect(mapStateToProps, mapDispatchToProps)(TableBody);
