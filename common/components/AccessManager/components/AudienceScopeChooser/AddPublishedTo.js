import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { ACCESS_LEVELS, ACCESS_LEVEL_VERSIONS } from 'common/components/AccessManager/Constants';

import UserSearchResultPropType from 'common/components/UserSearch/UserSearchResultPropType';
import SelectedUsersPropType from 'common/components/AccessManager/propTypes/SelectedUsersPropType';

import * as publishedToActions from 'common/components/AccessManager/actions/PublishedToActions';
import * as permissionsActions from 'common/components/AccessManager/actions/PermissionsActions';

import AddUser from 'common/components/AccessManager/components/AddUser';

/**
 * Basically just wraps the <AddUsers /> component into a bunch of redux stuff
 * for adding collaborators
 */
class AddPublishedTo extends Component {
  static propTypes = {
    addUsers: PropTypes.func.isRequired,
    addSelectedPublishedTo: PropTypes.func.isRequired,
    removeSelectedPublishedTo: PropTypes.func.isRequired,
    publishedToSearchQueryChanged: PropTypes.func.isRequired,
    currentSearchQuery: PropTypes.string,
    searchResults: PropTypes.arrayOf(UserSearchResultPropType),
    selectedUsers: SelectedUsersPropType
  };

  // we pass this in as the "selected" access level for all users who the dataset it "published to"
  static publishedViewerAccessLevel = {
    name: ACCESS_LEVELS.VIEWER,
    version: ACCESS_LEVEL_VERSIONS.PUBLISHED
  };

  render() {
    const {
      addUsers,
      addSelectedPublishedTo,
      removeSelectedPublishedTo,
      publishedToSearchQueryChanged,
      currentSearchQuery,
      searchResults,
      selectedUsers
    } = this.props;

    const addUserProps = {
      hideAccessLevelDropdown: true,
      addSelectedUser: addSelectedPublishedTo,
      addUsers,
      currentSearchQuery,
      removeSelectedUser: removeSelectedPublishedTo,
      searchResults,
      selectedUsers,
      userSearchQueryChanged: publishedToSearchQueryChanged,
      selectedAccessLevel: AddPublishedTo.publishedViewerAccessLevel
    };

    return (<AddUser {...addUserProps} />);
  }
}

const mapStateToProps = state => ({
  permissions: state.permissions.permissions,
  errors: state.ui.errors,
  selectedAccessLevel: state.publishedTo.accessLevel,

  // for UserSearch
  searchResults: state.publishedTo.results ? state.publishedTo.results.results : null,
  currentSearchQuery: state.publishedTo.query,
  selectedUsers: state.publishedTo.selectedUsers
});

const mapDispatchToProps = dispatch => ({
  addUsers: (users, accessLevel) => dispatch(permissionsActions.addUsers(users, accessLevel)),

  // for UserSearch
  addSelectedPublishedTo: searchResult =>
    dispatch(publishedToActions.addSelectedPublishedTo(searchResult.user)),
  removeSelectedPublishedTo: user => dispatch(publishedToActions.removeSelectedPublishedTo(user)),
  publishedToSearchQueryChanged:
    (event) => dispatch(publishedToActions.publishedToSearchQueryChanged(event.target.value))
});

export default
  connect(mapStateToProps, mapDispatchToProps)(AddPublishedTo);
