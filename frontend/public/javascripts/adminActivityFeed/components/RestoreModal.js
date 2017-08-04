import _ from 'lodash';
import React from 'react';
import {connect} from 'react-redux';
import {
  restoreDataset,
  dismissRestoreModal
} from '../actions';
import {Modal, ModalHeader, ModalContent, ModalFooter} from 'common/components';
import I18n from 'common/i18n';
import LocalizedText from 'common/i18n/components/LocalizedText';

class RestoreModal extends React.Component {
  shouldComponentUpdate(nextProps) {
    return !_.isNull(nextProps.datasetName);
  }

  render() {
    const {datasetName, dispatchRestoreDataset, dispatchDismissRestoreModal} = this.props;

    const modalProps = {
      fullScreen: false,
      onDismiss: dispatchDismissRestoreModal
    };

    const headerProps = {
      title: I18n.t('screens.admin.jobs.restore'),
      onDismiss: dispatchDismissRestoreModal
    };

    return (
      <Modal {...modalProps} >
        <ModalHeader {...headerProps} />

        <ModalContent>
          <p>
            <LocalizedText localeKey='screens.admin.jobs.restore_confirmation' data={ {dataset: datasetName} }/>
          </p>
        </ModalContent>

        <ModalFooter>
          <div>
            <button className='btn btn-default' onClick={dispatchDismissRestoreModal}>
              <LocalizedText localeKey='screens.admin.jobs.cancel'/>
            </button>
            &nbsp;
            <button className='btn btn-primary' onClick={dispatchRestoreDataset}>
              <LocalizedText localeKey='screens.admin.jobs.restore'/>
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

export default connect(mapStateToProps, mapDispatchToProps)(RestoreModal);
