import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';

import I18n from 'common/i18n';
import Button from 'common/components/Button';

import { MODES } from 'common/components/AccessManager/Constants';

import * as uiActions from 'common/components/AccessManager/actions/UiActions';
import * as changeOwnerActions from 'common/components/AccessManager/actions/ChangeOwnerActions';

import ModePropType from 'common/components/AccessManager/propTypes/ModePropType';
import UserPropType from 'common/components/AccessManager/propTypes/UserPropType';

import styles from './confirm-button.module.scss';

class FooterConfirmButton extends Component {
  static propTypes = {
    confirmSelectedOwner: PropTypes.func.isRequired,
    onConfirmClick: PropTypes.func.isRequired,
    confirmButtonDisabled: PropTypes.bool,
    confirmButtonBusy: PropTypes.bool,
    confirmButtonText: PropTypes.string,
    mode: ModePropType,
    selectedOwner: UserPropType,
    showApprovalMessage: PropTypes.bool
  }

  static defaultProps = {
    confirmButtonText: I18n.t('shared.site_chrome.access_manager.save'),
    confirmButtonDisabled: false,
    confirmButtonBusy: false,
    selectedOwner: null,
    showApprovalMessage: false
  }

  onClick = () => {
    const {
      confirmSelectedOwner,
      mode,
      onConfirmClick,
      selectedOwner
    } = this.props;

    switch (mode) {
      case MODES.CHANGE_OWNER:
        // confirm the selected owner before saving
        if (selectedOwner) {
          confirmSelectedOwner(selectedOwner);
        }
        break;
      default:
        break;
    }

    onConfirmClick();
  }

  getText = () => {
    const { mode, showApprovalMessage } = this.props;

    if (mode) {
      // if the approval message is being shown, and we're in a mode that
      // cares about scope, show a message about approval instead
      if (
        showApprovalMessage &&
        (mode === MODES.PUBLISH || mode === MODES.CHANGE_AUDIENCE)
      ) {
        return I18n.t('shared.site_chrome.access_manager.submit_for_approval');
      }

      switch (mode) {
        case MODES.PUBLISH:
          return I18n.t('shared.site_chrome.access_manager.publish_button');
        case MODES.CHANGE_OWNER:
          return I18n.t('shared.site_chrome.access_manager.transfer');
        case MODES.CHANGE_AUDIENCE:
        case MODES.MANAGE_COLLABORATORS:
          return I18n.t('shared.site_chrome.access_manager.save');
        default:
          console.error(`Unknown mode in FooterConfirmButton: ${mode}. Using default "Save" text.`);
      }
    }

    return I18n.t('shared.site_chrome.access_manager.save');
  }

  render() {
    const {
      confirmButtonDisabled,
      confirmButtonBusy
    } = this.props;

    return (
      <Button
        onClick={this.onClick}
        disabled={confirmButtonDisabled || confirmButtonBusy}
        busy={confirmButtonBusy}
        variant="primary"
        styleName="confirm-button">
        {this.getText()}
      </Button>
    );
  }
}

const mapStateToProps = state => ({
  mode: state.ui.mode,
  confirmButtonBusy: state.ui.footer.confirmButtonBusy,
  confirmButtonText: state.ui.footer.confirmButtonText,
  confirmButtonDisabled: state.ui.footer.confirmButtonDisabled,
  showCancelButton: state.ui.footer.showCancelButton,
  selectedOwner: state.changeOwner.selectedOwner ? state.changeOwner.selectedOwner[0] : null,
  showApprovalMessage: state.ui.showApprovalMessage
});

const mapDispatchToProps = dispatch => ({
  onConfirmClick: () => dispatch(uiActions.saveButtonClicked()),
  onCancelClick: () => dispatch(uiActions.cancelButtonClicked()),
  confirmSelectedOwner: (owner) => dispatch(changeOwnerActions.confirmSelectedOwner(owner))
});

export default connect(mapStateToProps, mapDispatchToProps)(cssModules(FooterConfirmButton, styles));
