import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { ModalContent, ModalFooter } from 'socrata-components';

import { hideModal } from 'actions/modal';
import { applyUpdate } from 'actions/applyUpdate';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from 'styles/Modals/PublishConfirmation.scss';
import * as Selectors from '../../selectors';

function PublishConfirmation({ outputSchemaId, doCancel, doUpdate }) {
  return (
    <div>
      <h2>{I18n.home_pane.publish_confirmation.title}</h2>
      <ModalContent>
        <p>{I18n.home_pane.publish_confirmation.body}</p>
        <SocrataIcon className={styles.mainIcon} name="public-open" />
      </ModalContent>
      <ModalFooter className={styles.modalFooter}>
        <button
          onClick={doCancel}
          className={styles.cancelButton}>
          {I18n.common.cancel}
        </button>
        <button
          onClick={() => doUpdate(outputSchemaId)}
          className={styles.mainButton}>
          {I18n.home_pane.publish_confirmation.button}
        </button>
      </ModalFooter>
    </div>
  );
}

PublishConfirmation.propTypes = {
  outputSchemaId: PropTypes.number.isRequired,
  doCancel: PropTypes.func.isRequired,
  doUpdate: PropTypes.func.isRequired
};

function mapStateToProps({ db }) {
  const outputSchemaId = Selectors.latestOutputSchema(db).id;

  return {
    outputSchemaId
  };
}

function mapDispatchToProps(dispatch) {
  return {
    doCancel: () => dispatch(hideModal()),
    doUpdate: (outputSchemaId) => dispatch(applyUpdate(outputSchemaId))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PublishConfirmation);
