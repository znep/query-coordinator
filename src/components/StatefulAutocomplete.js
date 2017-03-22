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
    // (the static, non-animated version is used in the header bar)
    if (!_.isEmpty(props.options) &&
      (props.options.collapsible === false || props.options.animate === true)) {
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
      collapsible,
      animate
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
          collapsible={collapsible}
          animate={animate} />
      </Provider>
    );
  }
}

StatefulAutocomplete.propTypes = {
  options: PropTypes.shape({
    numberOfResults: PropTypes.number,
    getSearchResults: PropTypes.func,
    millisecondsBeforeSearch: PropTypes.number,
    collapsible: PropTypes.bool,
    animate: PropTypes.bool
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
    collapsible: false
  },
  defaultState: {
    query: '',
    collapsed: false
  }
};

export default StatefulAutocomplete;
