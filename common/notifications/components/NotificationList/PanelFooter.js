import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import styles from './panel-footer.scss';
import AlertSettingModal from '../AlertSettingModal/AlertSettingModal';
import connectLocalization from 'common/i18n/components/connectLocalization';

class PanelFooter extends Component {

  constructor(props) {
    super(props);

    this.state = {
      showAlertSettingModal: false
    };
    this.toggleSubscription = this.toggleSubscription.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.renderModal = this.renderModal.bind(this);
  }

  closeModal(){
    const showAlertSettingModal = false;
    this.setState({showAlertSettingModal});
  }

  toggleSubscription(){
    const showAlertSettingModal = !this.state.showAlertSettingModal;
    this.setState({showAlertSettingModal});
  }

  renderModal() {
    const { showAlertSettingModal } = this.state;
    const { currentUserRole, isAdmin } = this.props;
    if (showAlertSettingModal) {
      return (
        <AlertSettingModal
          onClose={this.closeModal}
          isAdmin={isAdmin}
          currentUserRole={currentUserRole} />
      )
    } else{
      return null;
    }
  }

  render() {
    const {
      hasUnreadNotifications,
      markAllAsRead,
      I18n
    } = this.props;
    return (
      <div styleName='footer-bar'>
        <button styleName='primary-button'
          className='mark-all-as-read-button'
          disabled={!hasUnreadNotifications}
          onClick={markAllAsRead}>
          {I18n.t('mark_as_read')}
        </button>
        <a className="btn" styleName="setting-btn" onClick={this.toggleSubscription}>
          <span className="socrata-icon-settings"></span>
          {I18n.t('setting')}
        </a>
        {this.renderModal()}
      </div>
    );
  }
}

PanelFooter.propTypes = {
  hasUnreadNotifications: PropTypes.bool.isRequired,
  markAllAsRead: PropTypes.func.isRequired
};

export default connectLocalization(cssModules(PanelFooter, styles));
