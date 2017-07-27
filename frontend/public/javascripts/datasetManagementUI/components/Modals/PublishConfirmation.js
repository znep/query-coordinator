import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { ModalContent, ModalFooter } from 'common/components';
import { withRouter } from 'react-router';

import SocrataIcon from '../../../common/components/SocrataIcon';
import { hideModal } from 'actions/modal';
import { applyRevision } from 'actions/applyRevision';
import ApiCallButton from 'components/ApiCallButton';
import { APPLY_REVISION } from 'actions/apiCalls';
import * as Selectors from '../../selectors';
import styles from 'styles/Modals/PublishConfirmation.scss';

function PublishConfirmation({ outputSchemaId, doCancel, doUpdate, location }) {
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
          onClick={() => doUpdate(outputSchemaId, location)}>
          {I18n.home_pane.publish_confirmation.button}
        </ApiCallButton>
      </ModalFooter>
    </div>
  );
}

PublishConfirmation.propTypes = {
  outputSchemaId: PropTypes.number.isRequired,
  doCancel: PropTypes.func.isRequired,
  doUpdate: PropTypes.func.isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string
  })
};

export function mapStateToProps({ entities }) {
  const outputSchemaId = Selectors.latestOutputSchema(entities).id;

  return {
    outputSchemaId
  };
}

export function mapDispatchToProps(dispatch) {
  return {
    doCancel: () => dispatch(hideModal()),
    doUpdate: (outputSchemaId, location) => dispatch(applyRevision(outputSchemaId, location))
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PublishConfirmation));
