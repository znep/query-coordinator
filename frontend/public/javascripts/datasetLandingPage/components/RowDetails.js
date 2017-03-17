import { connect } from 'react-redux';
import CommonRowDetails from '../../common/components/RowDetails';

function mapStateToProps(state) {
  return {
    rowLabel: state.view.rowLabel,
    columnCount: state.view.columns.length,
    rowCount: state.view.rowCount
  };
}

export default connect(mapStateToProps)(CommonRowDetails);
