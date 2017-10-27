import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import reducer from './reducers';

import Header from './components/header';
import TabContent from './components/tab_content';
import WindowDimensions from './components/window_dimensions';

import Localization from 'common/i18n/components/Localization';

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

    this.store = createStore(reducer, applyMiddleware(...middlewares));
  }

  render() {
    const { showHeader } = this.props;
    const header = showHeader ? <Header {...this.props} /> : null;

    return (
      <Localization locale={window.serverConfig.locale || 'en'}>
        <Provider store={this.store}>
          <div className="asset-browser">
            {header}
            <TabContent {...this.props} />
            <WindowDimensions />
          </div>
        </Provider>
      </Localization>
    );
  }
}

AssetBrowser.propTypes = {
  baseFilters: PropTypes.object,
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
  baseFilters: {},
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
