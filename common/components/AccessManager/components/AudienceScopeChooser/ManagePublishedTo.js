import React, { Component } from 'react';
import cssModules from 'react-css-modules';

import I18n from 'common/i18n';

import { ACCESS_LEVELS, ACCESS_LEVEL_VERSIONS } from 'common/components/AccessManager/Constants';
import { userHasAccessLevel } from 'common/components/AccessManager/Util';

import UserList from 'common/components/AccessManager/components/UserList';

import AddPublishedTo from './AddPublishedTo';
import styles from './manage-published-to.module.scss';

class ManagePublishedTo extends Component {
  render() {
    return (
      <div styleName="manage-published">
        <div
          styleName="header"
          dangerouslySetInnerHTML={{
            __html: I18n.t('shared.site_chrome.access_manager.choose_published_viewers_html')
          }} />

        <hr styleName="divider" />

        {/* User List filtered to only show users WITH published viewer access */}
        <UserList
          hideOwner
          hideAccessLevelDropdown
          noUsersMessage={I18n.t('shared.site_chrome.access_manager.no_published_to')}
          userFilter={
            user => userHasAccessLevel(user, ACCESS_LEVELS.VIEWER, ACCESS_LEVEL_VERSIONS.PUBLISHED)
          } />

        <AddPublishedTo />
      </div>
    );
  }
}

export default cssModules(ManagePublishedTo, styles);
