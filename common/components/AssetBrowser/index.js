import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { Provider } from 'react-redux';

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

    sagaMiddleware.run(sagas);
  }

  componentWillReceiveProps(nextProps) {
    this.checkValidProps(nextProps);
  }

  checkValidProps(nextProps) {
    // Throw/warn for unsupported prop combinations
    if (nextProps.selectMode === true && nextProps.renderStyle === 'list') {
      console.warn(`AssetBrowser currently only supports selectMode when renderStyle is "card".
        It will render using the "card" style instead.`);
    }

    if (nextProps.showFilters && nextProps.renderStyle === 'card') {
      console.warn('AssetBrowser does not yet support the filter sidebar in the "card" renderStyle.');
    }
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
  additionalTopbarComponents: PropTypes.array,
  columns: PropTypes.array,
  enableAssetInventoryLink: PropTypes.bool,
  initialTab: PropTypes.string,
  onAssetSelected: PropTypes.func,
  onClose: PropTypes.func,
  pageSize: PropTypes.number,
  renderStyle: PropTypes.string,
  selectMode: PropTypes.bool,
  settings: PropTypes.object,
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
  additionalTopbarComponents: [],
  enableAssetInventoryLink: true,
  onAssetSelected: _.noop,
  onClose: _.noop,
  pageSize: 10,
  renderStyle: 'list',
  selectMode: false,
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
