import React, { Component } from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';

import I18n from 'common/i18n';

import styles from './owner-user-details.module.scss';
import UserDetails from '../../UserDetails';
import CurrentUserPropType from '../../../propTypes/CurrentUserPropType';
import UserPropType from '../../../propTypes/UserPropType';
import { userCanChangeOwner } from '../../../Util';

/**
 * Renders user details for the current owner of the asset.
 * If the current user can change the owner, they will also see a button
 * to do so.
 */
class OwnerUserDetails extends Component {
  static propTypes = {
    currentUser: CurrentUserPropType,
    user: UserPropType
  }

  renderActions = () => {
    const { currentUser } = this.props;

    if (!userCanChangeOwner(currentUser)) {
      return null;
    }

    return (
      <div styleName="change-owner-container">
        {I18n.t('shared.site_chrome.access_manager.owner')}
        <Link
          to="/change_owner"
          className="btn btn-default"
          styleName="change-owner-button">
          {I18n.t('shared.site_chrome.access_manager.change')}
        </Link>
      </div>
    );
  }

  render() {
    const { user } = this.props;
    return (
      <UserDetails user={user}>
        {this.renderActions()}
      </UserDetails>
    );
  }
}

const mapStateToProps = state => ({
  currentUser: state.permissions.currentUser
});

export default connect(mapStateToProps)(cssModules(OwnerUserDetails, styles));
