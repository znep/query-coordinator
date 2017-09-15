import PropTypes from 'prop-types';
import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import _ from 'lodash';
import url from 'url';
import 'whatwg-fetch';
import { getCeteraResults } from '../Util';
import reducer from '../reducers';
import Autocomplete from './Autocomplete';
import Localization from 'common/i18n/components/Localization';

class StatefulAutocomplete extends React.Component {
  constructor(props) {
    super(props);

    const { collapsible, animate } = this.props.options;
    const initialReduxState = { autocomplete: { query: '', collapsed: collapsible } };

    // we only want to set the query to the current one if we're NOT collapsible and if we're animating
    // the appearance of the "clear search" icon, which the version used in the header bar does not have.
     if (collapsible === false && animate === true) {
      // grab the current search query from the URL
      const currentQuery = _.get(url.parse(window.location.href, true), 'query.q', '');

      if (_.isEmpty(initialReduxState.autocomplete.query) && !_.isEmpty(currentQuery)) {
        initialReduxState.autocomplete.query = currentQuery;
      }
    }

    this.store = createStore(
      reducer,
      initialReduxState,
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
      adminHeaderClasses,
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
      <Localization>
        <Provider store={this.store}>
          <Autocomplete
            getSearchResults={getResults}
            millisecondsBeforeSearch={milliseconds}
            anonymous={_.isUndefined(anonymous) ? true : anonymous}
            collapsible={collapsible}
            animate={animate}
            mobile={mobile}
            adminHeaderClasses={adminHeaderClasses}
            onChooseResult={onChooseResult}
            onClearSearch={onClearSearch}
            currentQuery={this.store.getState().autocomplete.query} />
        </Provider>
      </Localization>
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
    adminHeaderClasses: PropTypes.array,
    onChooseResult: PropTypes.func,
    onClearSearch: PropTypes.func
  })
};

StatefulAutocomplete.defaultProps = {
  options: {
    numberOfResults: 7,
    getSearchResults: getCeteraResults,
    millisecondsBeforeSearch: 60,
    collapsible: false,
    mobile: false,
    adminHeaderClasses: ''
  }
};

export default StatefulAutocomplete;
