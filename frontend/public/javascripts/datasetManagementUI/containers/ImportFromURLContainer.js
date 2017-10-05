import { connect } from 'react-redux';
import ImportFromURL from 'components/ImportFromURL/ImportFromURL';
import * as ModalActions from 'reduxStuff/actions/modal';
import * as FlashActions from 'reduxStuff/actions/flashMessage';
import * as Actions from 'reduxStuff/actions/createSource';

const mapStateToProps = (state, { payload }) => {
  return {
    ...payload
  };
};

const mapDispatchToProps = dispatch => ({
  onDismiss: () => dispatch(ModalActions.hideModal()),
  createURLSource: (url, params) => dispatch(Actions.createURLSource(url, params)),
  showError: message => dispatch(FlashActions.showFlashMessage('error', message, 3500))
});

export default connect(mapStateToProps, mapDispatchToProps)(ImportFromURL);
