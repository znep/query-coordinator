import React, { PropTypes } from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import _ from 'lodash';
import 'whatwg-fetch';
import { getCeteraUrl } from '../Util';
import AutocompleteReducer from '../reducers/AutocompleteReducer';
import Container from './Container';

class Autocomplete extends React.Component {
  constructor(props) {
    super(props);

    // because people like overwriting global lodash ¯\_(ツ)_/¯
    _.noConflict();

    this.store = createStore(
      AutocompleteReducer,
      this.props.defaultState,
      window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
    );

    this.getResults = this.getResults.bind(this);
  }

  getResults(query, callback) {
    if (_.isEmpty(query)) {
      return;
    }

    fetch(getCeteraUrl(query), { credentials: 'same-origin' }).
    then((response) => response.json()).
    then(
      (searchResults) => {
        /*
         * We ask for way more results than we need, since each result isn't necessarily distinct
         * i.e. if you have 10 datasets called "Crime Data" and do a search that only asks for
         * top 10 results, you would only get back 1 result of "Crime Data".
         * So we ask for more than we need and only take the top n
         */
        const numberOfResults =
          _.isUndefined(this.props.options.numberOfResults) ?
            Autocomplete.defaultProps.options.numberOfResults :
            this.props.options.numberOfResults;

        searchResults.results = _.take(searchResults.results, numberOfResults);
        callback(searchResults);
      },
      (error) => {
        console.error('Failed to fetch data', error);
      }
    ).catch((ex) => console.error('Error parsing JSON', ex));
  }

  render() {
    const {
      millisecondsBeforeSearch,
      collapsible,
      animate
    } = this.props.options;

    const milliseconds =
      _.isEmpty(millisecondsBeforeSearch) ?
        Autocomplete.defaultProps.options.millisecondsBeforeSearch :
        millisecondsBeforeSearch;

    return (
      <Provider store={this.store}>
        <Container
          getResults={this.getResults}
          millisecondsBeforeSearch={milliseconds}
          collapsible={collapsible}
          animate={animate} />
      </Provider>
    );
  }
}

Autocomplete.propTypes = {
  options: PropTypes.shape({
    numberOfResults: PropTypes.number,
    millisecondsBeforeSearch: PropTypes.number,
    collapsible: PropTypes.bool,
    animate: PropTypes.bool
  }),
  defaultState: PropTypes.shape({
    query: PropTypes.string
  })
};

Autocomplete.defaultProps = {
  options: {
    numberOfResults: 7,
    millisecondsBeforeSearch: 125,
    collapsible: false
  },
  defaultState: {
    query: '',
    collapsed: false
  }
};

export default Autocomplete;
