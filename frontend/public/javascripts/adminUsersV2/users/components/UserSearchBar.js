import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Autocomplete from 'common/autocomplete/components/Autocomplete';
import { renderUserAutocompleteResult } from './UserAutocompleteResult';
import UserFilter from './UserFilter';
import AddUserButton from './AddUserButton';
import connectLocalization from 'common/i18n/components/connectLocalization';
import { userAutocomplete, userSearch } from '../actions';

// TODO: EN-19403 - Factor out as shared component
class UserSearchBar extends Component {
  render() {
    const autocompleteOptions = {
      animate: true,
      anonymous: false,
      collapsible: false,
      // currentQuery: this.props.currentQuery,
      getSearchResults: userAutocomplete,
      millisecondsBeforeSearch: 100,
      onChooseResult: this.props.onChooseResult,
      onClearSearch: this.props.onClearSearch,
      renderResult: renderUserAutocompleteResult
    };

    return (
      <div className="user-search-bar search-bar">
        <Autocomplete className="user-autocomplete" {...autocompleteOptions} />
        <UserFilter />
        <AddUserButton />
      </div>
    );
  }
}

UserSearchBar.propTypes = {
  onChooseResult: PropTypes.func.isRequired,
  onClearSearch: PropTypes.func.isRequired
};

const mapDispatchToProps = dispatch => ({
  onChooseResult: query => {
    dispatch(userSearch(query));
  },
  onClearSearch: () => {
    dispatch(userSearch());
  }
});

const ConnectedUserSearchBar = connect(() => ({}), mapDispatchToProps)(connectLocalization(UserSearchBar));
export default ConnectedUserSearchBar;
