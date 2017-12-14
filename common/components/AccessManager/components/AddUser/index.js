import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import { connect } from 'react-redux';

import I18n from 'common/i18n';
import UserSearch from 'common/components/UserSearch';
import UserSearchResultPropType from 'common/components/UserSearch/UserSearchResultPropType';

import styles from './add-user.scss';
import AccessLevelDropdown from '../AccessLevelDropdown';
import * as addUsersActions from '../../actions/AddUsersActions';
import * as permissionsActions from '../../actions/PermissionsActions';
import SelectedUsersPropType from '../../propTypes/SelectedUsersPropType';
import UserAccessLevelPropType from '../../propTypes/UserAccessLevelPropType';

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
      <div styleName="section">
        <span styleName="label">
          {I18n.t('shared.site_chrome.access_manager.people')}
        </span>
        <UserSearch {...userSearchProps} />
      </div>
    );
  }

  renderAccessLevelDropdown = () => {
    const {
      accessLevel,
      onAccessLevelDropdownChanged
    } = this.props;

    return (
      <div styleName="section">
        <span styleName="label">
          {I18n.t('shared.site_chrome.access_manager.access_level')}
        </span>
        <AccessLevelDropdown
          onSelection={onAccessLevelDropdownChanged}
          value={accessLevel} />
      </div>
    );
  }

  render() {
    return (
      <div styleName="container">
        {this.renderUserSearch()}
        {this.renderAccessLevelDropdown()}
        <button
          onClick={this.confirmSelectedUsers}
          styleName="add-user-button"
          className="btn btn-primary">
          {I18n.t('shared.site_chrome.access_manager.add')}
        </button>
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
