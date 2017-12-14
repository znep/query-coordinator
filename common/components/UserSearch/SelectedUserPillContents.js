import React, { Component } from 'react';
import UserSearchResultPropType from './UserSearchResultPropType';
import SocrataIcon from '../SocrataIcon';

/**
 * Renders the contents of a selected user pill from the multiselect
 */
class SelectedUserPillContents extends Component {
  static propTypes = {
    user: UserSearchResultPropType.isRequired
  }

  render() {
    const { user } = this.props;
    return (
      <div className="user-search-pill-contents">
        <SocrataIcon name="user" className="user-search-pill-user-icon" />
        {/*
          * For registered users, we have a screen name.
          * For unregistered users, we only have an email address
          */}
        <div className="user-search-pill-user-name">{user.screen_name || user.email}</div>
      </div>
    );
  }
}

export default SelectedUserPillContents;
