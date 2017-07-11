import React, { PropTypes } from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import _ from 'lodash';
import url from 'url';
import 'whatwg-fetch';
import { getCeteraResults } from '../Util';
import AutocompleteReducer from '../reducers/AutocompleteReducer';
import Autocomplete from './Autocomplete';

class StatefulAutocomplete extends React.Component {
  constructor(props) {
    super(props);

    // default to empty state
    const { defaultState } = this.props;
    const state = _.isEmpty(defaultState) ? { } : defaultState;

    // we only want to set the query to the current one if we're NOT collapsible and if we're animating
    // the appearance of the "clear search" icon, which the version used in the header bar does not have.
     if (!_.isEmpty(props.options) &&
      (props.options.collapsible === false && props.options.animate === true)) {
      // grab the current search query from the URL
      const parsedUrl = url.parse(window.location.href, true);
      const currentQuery = _.get(parsedUrl, 'query.q', '');

      // set our query only if we weren't passed on by props
      if (_.isEmpty(state.query) && !_.isEmpty(currentQuery)) {
        state.query = currentQuery;
      }
    }

    this.store = createStore(
      AutocompleteReducer,
      state,
      window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
    );
  }

  render() {
    const {
      getSearchResults,
      millisecondsBeforeSearch,
      anonymous,
      collapsible,
      animate,
      mobile,
      onChooseResult,
      onClearSearch
    } = this.props.options;

    const milliseconds =
      _.isEmpty(millisecondsBeforeSearch) ?
        StatefulAutocomplete.defaultProps.options.millisecondsBeforeSearch :
        millisecondsBeforeSearch;

    const getResults =
      _.isEmpty(getSearchResults) ?
        StatefulAutocomplete.defaultProps.options.getSearchResults :
        getSearchResults;

    return (
      <Provider store={this.store}>
        <Autocomplete
          getSearchResults={getResults}
          millisecondsBeforeSearch={milliseconds}
          anonymous={_.isUndefined(anonymous) ? true : anonymous}
          collapsible={collapsible}
          animate={animate}
          mobile={mobile}
          onChooseResult={onChooseResult}
          onClearSearch={onClearSearch} />
      </Provider>
    );
  }
}

StatefulAutocomplete.propTypes = {
  options: PropTypes.shape({
    numberOfResults: PropTypes.number,
    getSearchResults: PropTypes.func,
    millisecondsBeforeSearch: PropTypes.number,
    // `anonymous` is technically wrong, but until cetera-ruby is updated to use visibility
    // concepts rather than anonymity concepts, that's what we're using for now.
    anonymous: PropTypes.bool,
    collapsible: PropTypes.bool,
    animate: PropTypes.bool,
    mobile: PropTypes.bool,
    onChooseResult: PropTypes.func,
    onClearSearch: PropTypes.func
  }),
  defaultState: PropTypes.shape({
    query: PropTypes.string
  })
};

StatefulAutocomplete.defaultProps = {
  options: {
    numberOfResults: 7,
    getSearchResults: getCeteraResults,
    millisecondsBeforeSearch: 60,
    collapsible: false,
    mobile: false
  },
  defaultState: {
    query: '',
    collapsed: false
  }
};

export default StatefulAutocomplete;
