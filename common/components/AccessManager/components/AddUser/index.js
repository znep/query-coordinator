import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';

import I18n from 'common/i18n';
import Button from 'common/components/Button';
import UserSearch from 'common/components/UserSearch';
import UserSearchResultPropType from 'common/components/UserSearch/UserSearchResultPropType';

import SelectedUsersPropType from 'common/components/AccessManager/propTypes/SelectedUsersPropType';
import UserAccessLevelPropType from 'common/components/AccessManager/propTypes/UserAccessLevelPropType';

import AccessLevelDropdown from 'common/components/AccessManager/components/AccessLevelDropdown';

import styles from './add-user.module.scss';

/**
 * Contains the search box to select users to add,
 * a dropdown to select their access level,
 * and a button to confirm them and add them to the list of users.
 */
class AddUser extends Component {
  static propTypes = {
    selectedAccessLevel: UserAccessLevelPropType,
    addSelectedUser: PropTypes.func.isRequired,
    addUsers: PropTypes.func.isRequired,
    currentSearchQuery: PropTypes.string,
    onAccessLevelDropdownChanged: PropTypes.func.isRequired,
    hideAccessLevelDropdown: PropTypes.bool,
    removeSelectedUser: PropTypes.func.isRequired,
    searchResults: PropTypes.arrayOf(UserSearchResultPropType),
    selectedUsers: SelectedUsersPropType,
    userSearchQueryChanged: PropTypes.func.isRequired
  }

  static defaultProps = {
    hideAccessLevelDropdown: false
  }

  confirmSelectedUsers = () => {
    const { selectedUsers, selectedAccessLevel, addUsers } = this.props;

    if (selectedUsers && selectedUsers.length > 0 && selectedAccessLevel) {
      addUsers(selectedUsers, selectedAccessLevel);
    }
  }

  renderUserSearch = () => {
    const {
      addSelectedUser,
      currentSearchQuery,
      removeSelectedUser,
      searchResults,
      selectedUsers,
      userSearchQueryChanged
    } = this.props;

    const userSearchProps = {
      addSelectedUser,
      currentQuery: currentSearchQuery,
      results: searchResults,
      removeSelectedUser,
      selectedUsers,
      userSearchQueryChanged
    };

    return (
      <UserSearch {...userSearchProps} />
    );
  }

  render() {
    const {
      selectedAccessLevel,
      onAccessLevelDropdownChanged,
      hideAccessLevelDropdown
    } = this.props;

    return (
      <div styleName="container">
        {this.renderUserSearch()}
        {hideAccessLevelDropdown === false &&
          (<AccessLevelDropdown
            onSelection={onAccessLevelDropdownChanged}
            value={selectedAccessLevel} />)
        }
        <Button
          onClick={this.confirmSelectedUsers}
          styleName="add-user-button">
          {I18n.t('shared.site_chrome.access_manager.add')}
        </Button>
      </div>
    );
  }
}

export default cssModules(AddUser, styles);
