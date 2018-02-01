import React, { Component } from 'react';
import { UserPropType } from './UserSearchResultPropType';
import SocrataIcon from '../SocrataIcon';

/**
 * Renders the contents of a selected user pill from the multiselect
 */
class SelectedUserPillContents extends Component {
  static propTypes = {
    user: UserPropType.isRequired
  };

  render() {
    const { user } = this.props;
    const { type } = user;
    return (
      <div className="user-search-pill-contents">
        {/*
            Unfortunately we can't just use "type" here as the icon name since
            the type is "interactive" but the icon is "user"
        */}
        {(type && type === 'team') ?
          (<SocrataIcon name="team" className="user-search-pill-user-icon" />) :
          (<SocrataIcon name="user" className="user-search-pill-user-icon" />)}
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
