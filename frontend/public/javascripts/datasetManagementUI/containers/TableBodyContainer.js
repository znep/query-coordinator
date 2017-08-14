import { connect } from 'react-redux';
import TableBody from 'components/TableBody';

function mapStateToProps({ ui }) {
  return {
    apiCalls: ui.apiCalls
  };
}

export default connect(mapStateToProps)(TableBody);
