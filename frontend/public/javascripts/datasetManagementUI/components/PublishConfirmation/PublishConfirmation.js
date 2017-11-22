import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { ModalContent, ModalFooter } from 'common/components';
import SocrataIcon from '../../../common/components/SocrataIcon';
import ApiCallButton from 'containers/ApiCallButtonContainer';
import { APPLY_REVISION } from 'reduxStuff/actions/apiCalls';
import styles from './PublishConfirmation.scss';

class PublishConfirmation extends Component {
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
    const { doCancel, dispatchApplyRevision, setPermission, btnDisabled, publicSelected } = this.props;

    return (
      <div>
        <h2>
          {I18n.home_pane.publish_confirmation.title}
        </h2>
        <ModalContent>
          <span
            onClick={() => setPermission('public')}
            className={publicSelected ? styles.privacySelectorActive : styles.privacySelector}>
            <SocrataIcon name="checkmark3" className={styles.checkbox} />
            <h3>
              {I18n.home_pane.publish_confirmation.public}
            </h3>
            <SocrataIcon className={styles.icon} name="public-open" />
            {I18n.home_pane.publish_confirmation.public_msg}
          </span>
          <span
            onClick={() => setPermission('private')}
            className={!publicSelected ? styles.privacySelectorActive : styles.privacySelector}>
            <SocrataIcon name="checkmark3" className={styles.checkbox} />
            <h3>
              {I18n.home_pane.publish_confirmation.private}
            </h3>
            <SocrataIcon className={styles.icon} name="private" />
            {I18n.home_pane.publish_confirmation.private_msg}
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
            onClick={() => dispatchApplyRevision()}>
              {I18n.home_pane.publish_confirmation.button}
          </ApiCallButton>
        </ModalFooter>
      </div>
    );
  }
}

PublishConfirmation.propTypes = {
  doCancel: PropTypes.func.isRequired,
  dispatchApplyRevision: PropTypes.func.isRequired,
  btnDisabled: PropTypes.bool,
  setPermission: PropTypes.func,
  publicSelected: PropTypes.bool.isRequired
};

export default PublishConfirmation;
