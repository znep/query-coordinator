import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Autocomplete from 'common/autocomplete/components/Autocomplete';
import * as Actions from '../actions';
import { renderUserAutocompleteResult } from './UserAutocompleteResult';

class UserSearchBar extends Component {
  render() {

    const autocompleteOptions = {
      animate: true,
      anonymous: false,
      collapsible: false,
      // currentQuery: this.props.currentQuery,
      getSearchResults: Actions.userAutocomplete,
      millisecondsBeforeSearch: 100,
      onChooseResult: this.props.onChooseResult,
      onClearSearch: this.props.onClearSearch,
      renderResult: renderUserAutocompleteResult
    };

    return (
      <Autocomplete {...autocompleteOptions} />
    );
  }
}

UserSearchBar.propTypes = {
  onChooseResult: PropTypes.func.isRequired,
  onClearSearch: PropTypes.func.isRequired
};

const mapDispatchToProps = (dispatch) => ({
  onChooseResult: (query) => { dispatch(Actions.userSearch(query)); },
  onClearSearch: () => { dispatch(Actions.userSearch()); }
});

const ConnectedUserSearchBar = connect(() => { return {}; }, mapDispatchToProps)(UserSearchBar);
export default ConnectedUserSearchBar;
