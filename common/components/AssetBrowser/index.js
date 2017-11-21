import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { Provider } from 'react-redux';

import settingsSagas from './sagas/settings';
import { all } from 'redux-saga/effects';

import thunk from 'redux-thunk';
import createLogger from 'redux-logger';

import reducer from './reducers';
import sagas from './sagas';

import AssetBrowserWrapper from './components/asset_browser_wrapper';

import Localization from 'common/i18n/components/Localization';

export class AssetBrowser extends Component {
  constructor(props) {
    super(props);

    const sagaMiddleware = createSagaMiddleware();
    const middlewares = [thunk, sagaMiddleware];

    if (_.get(window, 'serverConfig.environment') === 'development') {
      middlewares.push(createLogger({
        duration: true, // need to prepend a message to identify this component in logged messages
        timestamp: false,
        collapsed: true
      }));
    }

    this.store = createStore(reducer, applyMiddleware(...middlewares));

    // combine all the sagas together
    function* sagas() {
      yield all([
        ...settingsSagas
      ]);
    }
    sagaMiddleware.run(sagas);
  }

  render() {
    return (
      <Localization locale={window.serverConfig.locale || 'en'}>
        <Provider store={this.store}>
          <AssetBrowserWrapper {...this.props} />
        </Provider>
      </Localization>
    );
  }
}

AssetBrowser.propTypes = {
  enableAssetInventoryLink: PropTypes.bool,
  onAssetSelected: PropTypes.func,
  pageSize: PropTypes.number,
  showAssetCounts: PropTypes.bool,
  showAuthorityFilter: PropTypes.bool,
  showFilters: PropTypes.bool,
  showHeader: PropTypes.bool,
  showManageAssets: PropTypes.bool,
  showOwnedByFilter: PropTypes.bool,
  showPager: PropTypes.bool,
  showSearchField: PropTypes.bool,
  tabs: PropTypes.object.isRequired
};

AssetBrowser.defaultProps = {
  enableAssetInventoryLink: true,
  onAssetSelected: null,
  pageSize: 10,
  showAssetCounts: true,
  showAuthorityFilter: true,
  showFilters: true,
  showHeader: true,
  showManageAssets: false,
  showOwnedByFilter: true,
  showPager: true,
  showSearchField: true
};

export default AssetBrowser;
