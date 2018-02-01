import React, { Component } from 'react';
import cssModules from 'react-css-modules';

import I18n from 'common/i18n';

import UserPropType from 'common/components/AccessManager/propTypes/UserPropType';
import { USER_TYPES } from 'common/components/AccessManager/Constants';

import styles from './user-label.module.scss';

/**
 * Shows the display name and the email of the given user.
 * If the user has no display name, it is assume they are unregistered and an
 * "Unregistered User" label is displayed instead.
 */
class UserLabel extends Component {
  static propTypes = {
    user: UserPropType.isRequired
  }

  render() {
    const { user } = this.props;
    const { displayName, email, type } = user;

    if (displayName) {
      return (
        <div styleName="user-label">
          <div styleName="title">{displayName}</div>
          {/* Teams have no email */}
          {(type === USER_TYPES.INTERACTIVE && email) ? <div styleName="subtitle">{email}</div> : null}
        </div>
      );
    } else {
      // if we don't have the display name, we assume that this user
      // is "unregistered" (meaning they had permission shared to just their email)
      return (
        <div styleName="user-label">
          <div styleName="title">{email}</div>
          <div styleName="subtitle">
            <em styleName="unregistered">
              {I18n.t('shared.site_chrome.access_manager.unregistered_user')}
            </em>
          </div>
        </div>
      );
    }
  }
}

export default cssModules(UserLabel, styles);
