import React, { PropTypes } from 'react';
import { ModalContent, ModalFooter } from 'common/components';
import SocrataIcon from '../../../common/components/SocrataIcon';
import ApiCallButton from 'containers/ApiCallButtonContainer';
import { APPLY_REVISION } from 'reduxStuff/actions/apiCalls';
import styles from './PublishConfirmation.scss';

function PublishConfirmation({ doCancel, doUpdate, params }) {
  return (
    <div>
      <h2>
        {I18n.home_pane.publish_confirmation.title}
      </h2>
      <ModalContent>
        <p>
          {I18n.home_pane.publish_confirmation.body}
        </p>
        <SocrataIcon className={styles.mainIcon} name="public-open" />
      </ModalContent>
      <ModalFooter className={styles.modalFooter}>
        <button onClick={doCancel} className={styles.cancelButton}>
          {I18n.common.cancel}
        </button>
        <ApiCallButton
          additionalClassName={styles.mainButton}
          operation={APPLY_REVISION}
          onClick={() => doUpdate(params)}>
          {I18n.home_pane.publish_confirmation.button}
        </ApiCallButton>
      </ModalFooter>
    </div>
  );
}

PublishConfirmation.propTypes = {
  doCancel: PropTypes.func.isRequired,
  doUpdate: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired
};

export function mapDispatchToProps(dispatch, ownProps) {
  return {
    doCancel: () => dispatch(hideModal()),
    doUpdate: () => dispatch(applyRevision(ownProps.params))
  };
}

export default PublishConfirmation;
