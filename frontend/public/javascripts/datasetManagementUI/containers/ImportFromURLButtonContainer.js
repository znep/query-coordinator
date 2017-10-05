import { connect } from 'react-redux';
import ImportFromURLButton from 'components/ImportFromURL/ImportFromURLButton';
import { showModal } from 'reduxStuff/actions/modal';

function mapStateToProps(state, { params }) {
  return {
    params
  };
}

function mapDispatchToProps(dispatch) {
  return {
    showCreateURLModal: (payload) => dispatch(showModal('ImportFromURL', payload))
  };
}
export default connect(mapStateToProps, mapDispatchToProps)(ImportFromURLButton);
