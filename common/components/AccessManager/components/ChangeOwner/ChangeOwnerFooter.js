import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import cssModules from 'react-css-modules';

import I18n from 'common/i18n';

import styles from './footer.scss';
import SelectedUsersPropType from '../../propTypes/SelectedUsersPropType';

/**
 * Footer for changing the owner of an asset
 * Has a confirm button and a cancel button,
 * and displays a message when no new owner has been selected.
 */
class ChangeOwnerFooter extends Component {
  static propTypes = {
    confirmSelectedOwner: PropTypes.func.isRequired,
    hasSelectedOwner: PropTypes.bool,
    removeSelectedOwner: PropTypes.func.isRequired,
    selectedOwner: SelectedUsersPropType
  }

  static defaultProps = {
    hasSelectedOwner: false
  }

  onConfirmClick = (e) => {
    const {
      confirmSelectedOwner,
      hasSelectedOwner,
      selectedOwner
    } = this.props;

    if (hasSelectedOwner) {
      confirmSelectedOwner(selectedOwner[0]);
    } else {
      e.preventDefault();
    }
  }

  renderButtons = () => {
    const { hasSelectedOwner, removeSelectedOwner } = this.props;

    return (
      <div styleName="footer-buttons">
        <Link
          onClick={() => { removeSelectedOwner(); }}
          to="/"
          className="btn btn-default"
          styleName="cancel-button">
          {I18n.t('shared.site_chrome.access_manager.cancel')}
        </Link>
        <Link
          onClick={this.onConfirmClick}
          to="/"
          className={`btn btn-primary${!hasSelectedOwner ? ' btn-disabled' : ''}`}
          styleName="confirm-button">
          {I18n.t('shared.site_chrome.access_manager.transfer')}
        </Link>
      </div>
    );
  }

  renderMessage = () => {
    const { hasSelectedOwner } = this.props;

    // Show a nice message if they haven't selected a user yet
    return (
      <div styleName="footer-message">
        {!hasSelectedOwner ? I18n.t('shared.site_chrome.access_manager.please_select') : null}
      </div>
    );
  }

  render() {
    return (
      <div styleName="footer">
        {this.renderMessage()}
        {this.renderButtons()}
      </div>
    );
  }
}

export default cssModules(ChangeOwnerFooter, styles);
