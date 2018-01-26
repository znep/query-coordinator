import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';
import get from 'lodash/get';

import I18n from 'common/i18n';

import styles from './chooser.module.scss';
import AudienceScopeChooserRadioButton from './AudienceScopeChooserRadioButton';

/**
 * Renders all the radio buttons to change the chosen audience
 */
class AudienceScopeChooser extends Component {
  static propTypes = {
    showApprovalMessage: PropTypes.bool
  }

  static defaultProps = {
    showApprovalMessage: false
  }

  render() {
    const renderOrganizationScope = get(window, 'socrata.featureFlags.enable_internal_sharing', false);
    const { showApprovalMessage } = this.props;

    // if the approval message isn't shown, we still want to take up some space
    const approvalMessageStyleName =
      showApprovalMessage ? 'approval-message' : 'approval-message-placeholder';

    return (
      <div styleName="chooser">
        <div styleName="chooser-buttons">
          <AudienceScopeChooserRadioButton scope="private" />
          {renderOrganizationScope && (<AudienceScopeChooserRadioButton scope="organization" />)}
          <AudienceScopeChooserRadioButton scope="public" />
        </div>
        <div className="alert warning" styleName={approvalMessageStyleName}>
          {I18n.t('shared.site_chrome.access_manager.audience.approval_note')}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  showApprovalMessage: state.ui.showApprovalMessage
});

export default connect(mapStateToProps)(cssModules(AudienceScopeChooser, styles));
