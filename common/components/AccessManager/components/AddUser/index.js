import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import { connect } from 'react-redux';

import I18n from 'common/i18n';
import Button from 'common/components/Button';
import UserSearch from 'common/components/UserSearch';
import UserSearchResultPropType from 'common/components/UserSearch/UserSearchResultPropType';

import * as addUsersActions from 'common/components/AccessManager/actions/AddUsersActions';
import * as permissionsActions from 'common/components/AccessManager/actions/PermissionsActions';

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
    onAccessLevelDropdownChanged: PropTypes.func.isRequired,
    addUsers: PropTypes.func.isRequired,
    accessLevel: UserAccessLevelPropType,

    // UserSearch props, from redux
    addSelectedUser: PropTypes.func.isRequired,
    currentSearchQuery: PropTypes.string,
    searchResults: PropTypes.arrayOf(UserSearchResultPropType),
    removeSelectedUser: PropTypes.func.isRequired,
    selectedUsers: SelectedUsersPropType,
    userSearchQueryChanged: PropTypes.func.isRequired
  }

  confirmSelectedUsers = () => {
    const { selectedUsers, accessLevel, addUsers } = this.props;

    if (selectedUsers && selectedUsers.length > 0 && accessLevel) {
      addUsers(selectedUsers, accessLevel);
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
      accessLevel,
      onAccessLevelDropdownChanged
    } = this.props;

    return (
      <div styleName="container">
        {this.renderUserSearch()}
        <AccessLevelDropdown
          onSelection={onAccessLevelDropdownChanged}
          value={accessLevel} />
        <Button
          onClick={this.confirmSelectedUsers}
          styleName="add-user-button">
          {I18n.t('shared.site_chrome.access_manager.add')}
        </Button>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  accessLevel: state.addUsers.accessLevel,

  // for UserSearch
  searchResults: state.addUsers.results ? state.addUsers.results.results : null,
  currentSearchQuery: state.addUsers.query,
  selectedUsers: state.addUsers.selectedUsers
});

const mapDispatchToProps = dispatch => ({
  onAccessLevelDropdownChanged: level => dispatch(addUsersActions.accessLevelChanged(level)),
  addUsers: (users, accessLevel) => dispatch(permissionsActions.addUsers(users, accessLevel)),

  // for UserSearch
  addSelectedUser: searchResult => dispatch(addUsersActions.addSelectedUser(searchResult.user)),
  removeSelectedUser: user => dispatch(addUsersActions.removeSelectedUser(user)),
  userSearchQueryChanged: (event) => dispatch(addUsersActions.userSearchQueryChanged(event.target.value))
});

export default connect(mapStateToProps, mapDispatchToProps)(cssModules(AddUser, styles));
