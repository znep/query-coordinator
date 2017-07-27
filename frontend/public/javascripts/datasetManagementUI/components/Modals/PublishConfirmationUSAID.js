import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import { ModalContent, ModalFooter } from 'common/components';
import { withRouter } from 'react-router';

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
    const {
      outputSchemaId,
      doCancel,
      dispatchApplyRevision,
      setPermission,
      btnDisabled,
      publicSelected,
      location
    } = this.props;

    return (
      <div>
        <h2>
          {I18n.home_pane.publish_confirmation_usaid.title}
        </h2>
        <ModalContent>
          <span
            onClick={() => setPermission('public')}
            className={publicSelected ? styles.privacySelectorActive : styles.privacySelector}>
            <SocrataIcon name="checkmark3" className={styles.checkbox} />
            <h3>
              {I18n.home_pane.publish_confirmation_usaid.public}
            </h3>
            <SocrataIcon className={styles.icon} name="public-open" />
            {I18n.home_pane.publish_confirmation_usaid.public_msg}
          </span>
          <span
            onClick={() => setPermission('private')}
            className={!publicSelected ? styles.privacySelectorActive : styles.privacySelector}>
            <SocrataIcon name="checkmark3" className={styles.checkbox} />
            <h3>
              {I18n.home_pane.publish_confirmation_usaid.private}
            </h3>
            <SocrataIcon className={styles.icon} name="private" />
            {I18n.home_pane.publish_confirmation_usaid.private_msg}
          </span>
        </ModalContent>
        <ModalFooter className={styles.modalFooter}>
          <button onClick={() => doCancel(this.state.initialPermission)} className={styles.cancelButton}>
            {I18n.common.cancel}
          </button>
          <ApiCallButton
            additionalClassName={styles.mainButton}
            operation={APPLY_REVISION}
            params={{ outputSchemaId }}
            forceDisable={btnDisabled}
            onClick={() => dispatchApplyRevision(outputSchemaId, location)}>
            {publicSelected
              ? I18n.home_pane.publish_confirmation.button
              : I18n.home_pane.publish_confirmation_usaid.button}
          </ApiCallButton>
        </ModalFooter>
      </div>
    );
  }
}

PublishConfirmationUSAID.propTypes = {
  outputSchemaId: PropTypes.number,
  doCancel: PropTypes.func.isRequired,
  dispatchApplyRevision: PropTypes.func.isRequired,
  btnDisabled: PropTypes.bool,
  setPermission: PropTypes.func,
  publicSelected: PropTypes.bool.isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string
  })
};

export function mapStateToProps({ entities, ui }) {
  const latestOutputSchema = Selectors.latestOutputSchema(entities);
  const outputSchemaId = latestOutputSchema ? latestOutputSchema.id : null;
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
    dispatchApplyRevision: (outputSchemaId, location) => dispatch(applyRevision(outputSchemaId, location)),
    setPermission: permission => dispatch(updateRevision(permission))
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PublishConfirmationUSAID));
