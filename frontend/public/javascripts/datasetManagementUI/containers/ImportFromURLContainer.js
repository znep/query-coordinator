import * as FlashActions from 'reduxStuff/actions/flashMessage';
import { connect } from 'react-redux';
import { hideModal } from 'reduxStuff/actions/modal';
import ImportFromURL from 'components/ImportFromURL/ImportFromURL';
import * as Actions from 'reduxStuff/actions/manageUploads';

const mapStateToProps = (state, { payload }) => {
  return {
    ...payload
  };
};

const mapDispatchToProps = dispatch => ({
  onDismiss: () => dispatch(hideModal()),
  createURLSource: (sourceType, params) => dispatch(Actions.createURLSource(sourceType, params)),
  showError: message => dispatch(FlashActions.showFlashMessage('error', message, 3500))
});

export default connect(mapStateToProps, mapDispatchToProps)(ImportFromURL);
