import React, { Component } from 'react';
import PropTypes from 'prop-types';
import I18n from '../../i18n';
import UserSearchResultPropType from './UserSearchResultPropType';
import MultiSelect from '../MultiSelect';
import UserSearchResult from './UserSearchResult';
import SelectedUserPillContents from './SelectedUserPillContents';

class UserSearch extends Component {
  static propTypes = {
    // Called when a user is selected in the multiselect
    addSelectedUser: PropTypes.func.isRequired,

    // The current search query entered into the mutliselect
    currentQuery: PropTypes.string,

    // (Optional) Maximum number of users to allow
    maxSelectedUsers: PropTypes.number,

    // List of search results from cetera
    results: PropTypes.arrayOf(UserSearchResultPropType),

    // Called when removing a selected user from the multiselect
    // (either clicking the remove button or hitting backspace)
    removeSelectedUser: PropTypes.func.isRequired,

    // The list of all the currently selected users
    selectedUsers: PropTypes.arrayOf(UserSearchResultPropType),

    // Called when the user is typing in to the search box
    userSearchQueryChanged: PropTypes.func.isRequired
  }

  static defaultProps = {
    maxSelectedUsers: null,
    currentQuery: '',
    results: null,
    selectedUsers: []
  }

  static renderSearchResult = (result, index) => {
    return (<UserSearchResult result={result} index={index} />);
  }

  static renderSelectedOptionContents = (user) => {
    return (<SelectedUserPillContents user={user} />);
  }

  render() {
    const {
      addSelectedUser,
      currentQuery,
      maxSelectedUsers,
      removeSelectedUser,
      results,
      selectedUsers,
      userSearchQueryChanged
    } = this.props;

    return (
      <MultiSelect
        currentQuery={currentQuery}
        noResultsMessage={I18n.t('shared.site_chrome.access_manager.no_results')}
        options={results}
        maxSelectedOptions={maxSelectedUsers}
        renderSelectedOptionContents={UserSearch.renderSelectedOptionContents}
        renderOption={UserSearch.renderSearchResult}
        selectedOptions={selectedUsers}
        onAddSelectedOption={addSelectedUser}
        onCurrentQueryChanged={userSearchQueryChanged}
        onRemoveSelectedOption={removeSelectedUser} />
    );
  }
}

export default UserSearch;
