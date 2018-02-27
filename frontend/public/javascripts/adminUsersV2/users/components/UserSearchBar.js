import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { customConnect } from 'common/connectUtils';
import Autocomplete from 'common/autocomplete/components/Autocomplete';
import { renderUserAutocompleteResult } from './UserAutocompleteResult';
import UserFilter from './UserFilter';
import AddUserButton from './AddUserButton';
import * as Actions from '../actions';

// TODO: EN-19403 - Factor out as shared component
class UserSearchBar extends Component {
  static propTypes = {
    onChooseResult: PropTypes.func.isRequired,
    onClearSearch: PropTypes.func.isRequired
  };

  render() {
    const autocompleteOptions = {
      animate: true,
      anonymous: false,
      collapsible: false,
      // currentQuery: this.props.currentQuery,
      getSearchResults: this.props.userAutocomplete,
      millisecondsBeforeSearch: 100,
      onChooseResult: this.props.onChooseResult,
      onClearSearch: this.props.onClearSearch,
      renderResult: renderUserAutocompleteResult
    };

    return (
      <div className="user-search-bar search-bar">
        <div className="user-search-bar-filters">
          <Autocomplete className="user-autocomplete" {...autocompleteOptions} />
          <UserFilter />
        </div>
        <AddUserButton />
      </div>
    );
  }
}


const mapDispatchToProps = {
  onChooseResult: Actions.userSearch,
  onClearSearch: Actions.userSearch,
  userAutocomplete: Actions.userAutocomplete
};

export default customConnect({ mapDispatchToProps })(UserSearchBar);
