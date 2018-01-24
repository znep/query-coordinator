import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import I18n from 'common/i18n';
import ToastNotification from 'common/components/ToastNotification';

import ModesPropType from 'common/components/AccessManager/propTypes/ModePropType';
import * as uiActions from 'common/components/AccessManager/actions/UiActions';

class SuccessToastMessage extends Component {
  static propTypes = {
    toastMessageVisible: PropTypes.bool,
    mode: ModesPropType,
    dismissToastMessage: PropTypes.func.isRequired
  };

  static defaultProps = {
    toastMessage: null,
    toastMessageVisible: false,
    mode: null
  };

  render() {
    const {
      dismissToastMessage,
      toastMessageVisible,
      mode
    } = this.props;
    return (
      <ToastNotification
        onDismiss={dismissToastMessage}
        showNotification={toastMessageVisible}
        type="success">
        <span
          dangerouslySetInnerHTML={{
            __html: I18n.t(`shared.site_chrome.access_manager.${mode}.success_toast`)
          }} />
      </ToastNotification>
    );
  }
}

const mapStateToProps = state => ({
  visible: state.ui.visible,
  errors: state.ui.errors,
  toastMessage: state.ui.toastMessage,
  toastMessageVisible: state.ui.toastMessageVisible,
  mode: state.ui.mode
});

const mapDispatchToProps = dispatch => ({
  dismissToastMessage: () => dispatch(uiActions.dismissToastMessage())
});

export default connect(mapStateToProps, mapDispatchToProps)(SuccessToastMessage);
