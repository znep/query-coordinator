import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import reducer from './reducers';
import createLogger from 'redux-logger';

import Header from './components/header';
import ResultsAndFilters from './components/results_and_filters';
import WindowDimensions from './components/window_dimensions';

export class AssetBrowser extends Component {
  constructor(props) {
    super(props);

    const middlewares = [thunk];

    if (_.get(window, 'serverConfig.environment') === 'development') {
      middlewares.push(createLogger({
        duration: true, // need to prepend a message to identify this component in logged messages
        timestamp: false,
        collapsed: true
      }));
    }

    const store = createStore(reducer, applyMiddleware(...middlewares));
    this.state = { store };
  }

  render() {
    const { showHeader } = this.props;

    const header = showHeader ? <Header {...this.props} /> : null;

    return (
      <Provider store={this.state.store}>
        <div>
          {header}
          <ResultsAndFilters {...this.props} />
          <WindowDimensions />
        </div>
      </Provider>
    );
  }
}

AssetBrowser.propTypes = {
  baseFilters: PropTypes.object,
  onAssetSelected: PropTypes.func,
  pageSize: PropTypes.number,
  showAssetInventoryLink: PropTypes.bool,
  showAuthorityFilter: PropTypes.bool,
  showFilters: PropTypes.bool,
  showHeader: PropTypes.bool,
  showManageAssets: PropTypes.bool,
  showOwnedByFilter: PropTypes.bool,
  showPager: PropTypes.bool,
  showSearchField: PropTypes.bool
};

AssetBrowser.defaultProps = {
  baseFilters: {},
  onAssetSelected: null,
  pageSize: 10,
  showAssetInventoryLink: true,
  showAuthorityFilter: true,
  showFilters: true,
  showHeader: true,
  showManageAssets: false,
  showOwnedByFilter: true,
  showPager: true,
  showSearchField: true
};

export default AssetBrowser;
