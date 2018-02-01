import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import UserSearchResultPropType from 'common/components/UserSearch/UserSearchResultPropType';
import SelectedUsersPropType from 'common/components/AccessManager/propTypes/SelectedUsersPropType';
import AccessLevelPropType from 'common/components/AccessManager/propTypes/AccessLevelPropType';

import * as addCollaboratorsActions from 'common/components/AccessManager/actions/AddCollaboratorsActions';
import * as permissionsActions from 'common/components/AccessManager/actions/PermissionsActions';

import AddUser from 'common/components/AccessManager/components/AddUser';

/**
 * Basically just wraps the <AddUsers /> component into a bunch of redux stuff
 * for adding collaborators
 */
class AddCollaborators extends Component {
  static propTypes = {
    onAccessLevelDropdownChanged: PropTypes.func.isRequired,
    addUsers: PropTypes.func.isRequired,
    addSelectedCollaborator: PropTypes.func.isRequired,
    removeSelectedCollaborator: PropTypes.func.isRequired,
    collaboratorsSearchQueryChanged: PropTypes.func.isRequired,
    currentSearchQuery: PropTypes.string,
    searchResults: PropTypes.arrayOf(UserSearchResultPropType),
    selectedUsers: SelectedUsersPropType,
    selectedAccessLevel: AccessLevelPropType
  };

  render() {
    const {
      onAccessLevelDropdownChanged,
      addUsers,
      addSelectedCollaborator,
      removeSelectedCollaborator,
      collaboratorsSearchQueryChanged,
      currentSearchQuery,
      searchResults,
      selectedUsers,
      selectedAccessLevel
    } = this.props;

    const addUserProps = {
      selectedAccessLevel,
      addSelectedUser: addSelectedCollaborator,
      addUsers,
      currentSearchQuery,
      onAccessLevelDropdownChanged,
      removeSelectedUser: removeSelectedCollaborator,
      searchResults,
      selectedUsers,
      userSearchQueryChanged: collaboratorsSearchQueryChanged
    };

    return (
      <AddUser {...addUserProps} />
    );
  }
}

const mapStateToProps = state => ({
  permissions: state.permissions.permissions,
  errors: state.ui.errors,
  selectedAccessLevel: state.addCollaborators.accessLevel,

  // for UserSearch
  searchResults: state.addCollaborators.results ? state.addCollaborators.results.results : null,
  currentSearchQuery: state.addCollaborators.query,
  selectedUsers: state.addCollaborators.selectedUsers
});

const mapDispatchToProps = dispatch => ({
  onAccessLevelDropdownChanged:
    level => dispatch(addCollaboratorsActions.selectedCollaboratorAccessLevelChanged(level)),
  addUsers: (users, accessLevel) => dispatch(permissionsActions.addUsers(users, accessLevel)),

  // for UserSearch
  addSelectedCollaborator:
    searchResult => dispatch(addCollaboratorsActions.addSelectedCollaborator(searchResult.user)),
  removeSelectedCollaborator: user => dispatch(addCollaboratorsActions.removeSelectedCollaborator(user)),
  collaboratorsSearchQueryChanged:
    (event) => dispatch(addCollaboratorsActions.collaboratorsSearchQueryChanged(event.target.value))
});

export default
  connect(mapStateToProps, mapDispatchToProps)(AddCollaborators);
