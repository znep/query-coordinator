import _ from 'lodash';
import React from 'react';
import {connect} from 'react-redux';
import {
  restoreDataset,
  dismissRestoreModal
} from '../actions';
import {Modal, ModalHeader, ModalContent, ModalFooter} from 'socrata-components';

import connectLocalization from './Localization/connectLocalization';
import LocalizedText from './Localization/LocalizedText';

class RestoreModal extends React.Component {
  shouldComponentUpdate(nextProps) {
    return !_.isNull(nextProps.datasetName);
  }

  render() {
    const {datasetName, localization, dispatchRestoreDataset, dispatchDismissRestoreModal} = this.props;

    const modalProps = {
      fullScreen: false,
      onDismiss: dispatchDismissRestoreModal
    };

    const headerProps = {
      title: localization.translate('restore'),
      onDismiss: dispatchDismissRestoreModal
    };

    return (
      <Modal {...modalProps} >
        <ModalHeader {...headerProps} />

        <ModalContent>
          <p>
            <LocalizedText localeKey='restore_confirmation' data={ {dataset: datasetName} }/>
          </p>
        </ModalContent>

        <ModalFooter>
          <div>
            <button className="btn btn-default" onClick={dispatchDismissRestoreModal}>
              <LocalizedText localeKey='cancel'/>
            </button>
            &nbsp;
            <button className="btn btn-primary" onClick={dispatchRestoreDataset}>
              <LocalizedText localeKey='restore'/>
            </button>
          </div>
        </ModalFooter>
      </Modal>
    );
  }
}

const mapStateToProps = (state) => ({
  datasetName: state.getIn(['restoreModal', 'name'], null)
});
const mapDispatchToProps = (dispatch) => ({
  dispatchRestoreDataset: () => dispatch(restoreDataset()),
  dispatchDismissRestoreModal: () => dispatch(dismissRestoreModal())
});

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(RestoreModal));
