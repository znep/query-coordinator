import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';

import FeatureFlags from 'common/feature_flags';

import AudienceScopePropType from 'common/components/AccessManager/propTypes/AudienceScopePropType';
import { AUDIENCE_SCOPES } from 'common/components/AccessManager/Constants';

import I18n from 'common/i18n';

import styles from './chooser.module.scss';
import AudienceScopeChooserRadioButton from './AudienceScopeChooserRadioButton';
import ManagePublishedTo from './ManagePublishedTo';


/**
 * Renders all the radio buttons to change the chosen audience
 */
class AudienceScopeChooser extends Component {
  static propTypes = {
    showApprovalMessage: PropTypes.bool,
    currentScope: AudienceScopePropType
  }

  static defaultProps = {
    showApprovalMessage: false,
    currentScope: null
  }

  renderBottomSection(internalSharingEnabled) {
    const { showApprovalMessage, currentScope } = this.props;

    if (currentScope === AUDIENCE_SCOPES.PRIVATE) {
      if (internalSharingEnabled) {
        // If current scope is private, we also show the ability to choose "published viewers"
        return (<ManagePublishedTo />);
      }
    } else {
      // if the approval message isn't shown, we still want to take up some space
      const approvalMessageStyleName =
        showApprovalMessage ? 'approval-message' : 'approval-message-placeholder';

      return (
        <div className="alert warning" styleName={approvalMessageStyleName}>
          {I18n.t('shared.site_chrome.access_manager.audience.approval_note')}
        </div>
      );
    }
  }

  render() {
    const internalSharingEnabled = FeatureFlags.value('enable_internal_sharing');

    return (
      <div styleName="chooser">
        <div styleName="chooser-buttons">
          <AudienceScopeChooserRadioButton scope={AUDIENCE_SCOPES.PRIVATE} />
          {internalSharingEnabled &&
            (<AudienceScopeChooserRadioButton scope={AUDIENCE_SCOPES.ORGANIZATION} />)}
          <AudienceScopeChooserRadioButton scope={AUDIENCE_SCOPES.PUBLIC} />
        </div>
        {this.renderBottomSection(internalSharingEnabled)}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  currentScope: state.permissions.permissions ? state.permissions.permissions.scope : null,
  showApprovalMessage: state.ui.showApprovalMessage
});

export default connect(mapStateToProps)(cssModules(AudienceScopeChooser, styles));
