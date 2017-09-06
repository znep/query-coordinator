import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classNames from 'classnames';

import { FeatureFlags } from 'common/feature_flags';
import { handleEnter } from 'common/dom_helpers/keyPressHelpers';
import I18n from 'common/i18n';
import { ALL_ASSETS_TAB, MY_ASSETS_TAB, SHARED_TO_ME_TAB } from 'common/components/AssetBrowser/lib/constants';

import * as headerActions from '../actions/header';
import AssetCounts from './asset_counts';

export class Header extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, 'renderTab');
  }

  // See ../lib/constants.js for tabName values
  renderTab(tabName, text) {
    const activeClass = (tabName === this.props.activeTab) ? 'active' : '';

    return (
      <a
        href="#"
        className={`asset-tab ${_.kebabCase(tabName)} ${activeClass}`}
        onClick={() => this.props.changeTab(tabName)}
        onKeyDown={handleEnter(() => this.props.changeTab(tabName), true)}>
        {text}
      </a>
    );
  }

  render() {
    const { isMobile } = this.props;
    const rights = _.get(window.serverConfig, 'currentUser.rights');

    const allAssetsTab = _.includes(rights, 'can_see_all_assets_tab_siam') ?
      this.renderTab(ALL_ASSETS_TAB, I18n.t('shared.asset_browser.header.asset_tabs.all_assets')) : null;
    const myAssetsTab = this.renderTab(
      MY_ASSETS_TAB, I18n.t('shared.asset_browser.header.asset_tabs.my_assets')
    );
    const sharedToMeTab = this.renderTab(
      SHARED_TO_ME_TAB, I18n.t('shared.asset_browser.header.asset_tabs.shared_to_me')
    );

    const assetTabs = (
      <div className="asset-tabs">
        {myAssetsTab}
        {sharedToMeTab}
        {allAssetsTab}
      </div>
    );

    const headerClassnames = classNames('header', { 'mobile': isMobile });

    return (
      <div className={headerClassnames}>
        {!isMobile && assetTabs}
        <AssetCounts />
        {isMobile && assetTabs}
      </div>
    );
  }
}

Header.propTypes = {
  activeTab: PropTypes.string.isRequired,
  changeTab: PropTypes.func.isRequired,
  isMobile: PropTypes.bool.isRequired
};

const mapStateToProps = (state) => ({
  activeTab: _.get(state, 'header.activeTab', 'myAssets'),
  isMobile: _.get(state, 'windowDimensions.isMobile', false)
});

const mapDispatchToProps = (dispatch) => ({
  changeTab: (newTab) => dispatch(headerActions.changeTab(newTab))
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);
