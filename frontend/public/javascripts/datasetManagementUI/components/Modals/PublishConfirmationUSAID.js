import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import { ModalContent, ModalFooter } from 'common/components';

import SocrataIcon from '../../../common/components/SocrataIcon';
import { hideModal } from 'actions/modal';
import { applyRevision, updateRevision } from 'actions/applyRevision';
import ApiCallButton from 'components/ApiCallButton';
import { APPLY_REVISION } from 'actions/apiCalls';
import * as Selectors from '../../selectors';
import styles from 'styles/Modals/PublishConfirmationUSAID.scss';

export class PublishConfirmationUSAID extends Component {
  constructor() {
    super();
    // cache the initial permission in the component state so we can revert
    // to it if the user clicks cancel
    this.state = {
      initialPermission: null
    };
  }

  componentWillMount() {
    const { publicSelected } = this.props;

    this.setState({
      initialPermission: publicSelected ? 'public' : 'private'
    });
  }

  render() {
    const { outputSchemaId, doCancel, doUpdate, setPermission, btnDisabled, publicSelected } = this.props;

    return (
      <div>
        <h2>{I18n.home_pane.publish_confirmation.title}</h2>
        <ModalContent>
          <span
            onClick={() => setPermission('public')}
            className={publicSelected ? styles.privacySelectorActive : styles.privacySelector}>
            <h3>Public</h3>
            <SocrataIcon className={styles.icon} name="public-open" />
            Publically accessible. Discoverable through the public catalog
          </span>
          <span
            onClick={() => setPermission('private')}
            className={!publicSelected ? styles.privacySelectorActive : styles.privacySelector}>
            <h3>Private</h3>
            <SocrataIcon className={styles.icon} name="private" />
            Publically accessible. Discoverable through the public catalog
          </span>
        </ModalContent>
        <ModalFooter className={styles.modalFooter}>
          <button onClick={() => doCancel(this.state.initialPermission)} className={styles.cancelButton}>
            {I18n.common.cancel}
          </button>
          <ApiCallButton
            additionalClassName={styles.mainButton}
            operation={APPLY_REVISION}
            forceDisable={btnDisabled}
            onClick={() => doUpdate(outputSchemaId)}>
            {I18n.home_pane.publish_confirmation.button}
          </ApiCallButton>
        </ModalFooter>
      </div>
    );
  }
}

PublishConfirmationUSAID.propTypes = {
  outputSchemaId: PropTypes.number.isRequired,
  doCancel: PropTypes.func.isRequired,
  doUpdate: PropTypes.func.isRequired,
  btnDisabled: PropTypes.bool,
  setPermission: PropTypes.func,
  publicSelected: PropTypes.bool.isRequired
};

function mapStateToProps({ entities, ui }) {
  const { id: outputSchemaId } = Selectors.latestOutputSchema(entities);
  const { id: revisionId } = Selectors.latestRevision(entities);
  const permission = entities.revisions[revisionId] ? entities.revisions[revisionId].permission : 'public';
  const { apiCalls } = ui;

  // Don't want to allow user to apply revision if our update to the revision
  // (making it private or public) is ongoing
  const revisionUpdatesInProgress = Object.keys(apiCalls).filter(
    callid =>
      apiCalls[callid].operation === 'UPDATE_REVISION' &&
      apiCalls[callid].status === 'STATUS_CALL_IN_PROGRESS'
  );

  return {
    outputSchemaId,
    btnDisabled: !!revisionUpdatesInProgress.length,
    publicSelected: permission === 'public'
  };
}

function mapDispatchToProps(dispatch) {
  return {
    doCancel: initialPermission => {
      dispatch(updateRevision(initialPermission));
      dispatch(hideModal());
    },
    doUpdate: outputSchemaId => dispatch(applyRevision(outputSchemaId)),
    setPermission: permission => dispatch(updateRevision(permission))
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PublishConfirmationUSAID);
