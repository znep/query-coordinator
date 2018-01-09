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
import ProvenanceCounts from './provenance_counts';

export class Header extends Component {
  scope = 'shared.asset_browser.header.asset_tabs';

  renderTabByKey(tab) {
    const { activeTab, changeTab } = this.props;

    const displayText = I18n.t(_.snakeCase(tab), { scope: this.scope });
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
    const { activeTab, isMobile, showAssetCounts, settings, tabs } = this.props;
    const headerClasses = classNames('header', { 'mobile': isMobile });

    const assetTabs = (
      <div className="asset-tabs">
        {_.keys(tabs).map((tab) => this.renderTabByKey(tab))}
      </div>
    );

    const showProvenanceCounts = _.get(tabs, `${activeTab}.props.showProvenanceCounts`) === true;

    const approvalsHeaderContent = (settings || showProvenanceCounts) ? (
      <div className="approvals-header-content">
        {settings}
        {showProvenanceCounts && <ProvenanceCounts />}
      </div>
    ) : null;

    return (
      <div className={headerClasses}>
        {!isMobile && assetTabs}
        {showAssetCounts && <AssetCounts />}
        {approvalsHeaderContent}
        {isMobile && assetTabs}
      </div>
    );
  }
}

Header.propTypes = {
  activeTab: PropTypes.string.isRequired,
  changeTab: PropTypes.func.isRequired,
  isMobile: PropTypes.bool.isRequired,
  settings: PropTypes.object,
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
