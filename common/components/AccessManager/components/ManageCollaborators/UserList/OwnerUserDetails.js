import React, { Component } from 'react';
import cssModules from 'react-css-modules';

import I18n from 'common/i18n';

import UserDetails from 'common/components/AccessManager/components/UserDetails';
import UserPropType from 'common/components/AccessManager/propTypes/UserPropType';

import styles from './owner-user-details.module.scss';

/**
 * Renders user details for the current owner of the asset.
 * If the current user can change the owner, they will also see a button
 * to do so.
 */
class OwnerUserDetails extends Component {
  static propTypes = {
    user: UserPropType
  }

  renderActions = () => {
    return (
      <div styleName="change-owner-container">
        {I18n.t('shared.site_chrome.access_manager.owner')}
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

export default cssModules(OwnerUserDetails, styles);
