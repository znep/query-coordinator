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
  renderTabByKey(tab) {
    const { activeTab, changeTab } = this.props;

    const scope = 'shared.asset_browser.header.asset_tabs';
    const displayText = I18n.t(_.snakeCase(tab), { scope });
    const tabClasses = classNames('asset-tab', _.kebabCase(tab), {
      'active': tab === activeTab
    });

    const handleTabClick = (e) => {
      e.preventDefault();
      changeTab(tab);
    };

    return (
      <a
        key={tab}
        href="#"
        className={tabClasses}
        onClick={handleTabClick}
        onKeyDown={handleEnter(() => changeTab(tab), true)}>
        {displayText}
      </a>
    );
  }

  render() {
    const { isMobile, showAssetCounts, tabs } = this.props;
    const headerClassnames = classNames('header', { 'mobile': isMobile });

    const assetTabs = (
      <div className="asset-tabs">
        {_.keys(tabs).map((tab) => this.renderTabByKey(tab))}
      </div>
    );

    return (
      <div className={headerClassnames}>
        {!isMobile && assetTabs}
        {showAssetCounts && <AssetCounts />}
        {isMobile && assetTabs}
      </div>
    );
  }
}

Header.propTypes = {
  activeTab: PropTypes.string.isRequired,
  changeTab: PropTypes.func.isRequired,
  isMobile: PropTypes.bool.isRequired,
  tabs: PropTypes.object
};

const mapStateToProps = (state) => ({
  activeTab: state.header.activeTab,
  isMobile: state.windowDimensions.isMobile
});

const mapDispatchToProps = (dispatch) => ({
  changeTab: (newTab) => dispatch(headerActions.changeTab(newTab))
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);
