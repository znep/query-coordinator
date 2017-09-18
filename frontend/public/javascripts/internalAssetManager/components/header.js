import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { changeTab } from '../actions/header';
import AssetCounts from './asset_counts';
import { FeatureFlags } from 'common/feature_flags';
import { handleEnter } from 'common/helpers/keyPressHelpers';
import _ from 'lodash';
import classNames from 'classnames';

export class Header extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, 'renderTab');
  }

  // `tabName` is either 'myAssets' or 'allAssets'
  renderTab(tabName, text) {
    const activeClass = (tabName === this.props.activeTab) ? 'active' : '';

    return (
      <a
        href="#"
        className={`asset-toggle ${_.kebabCase(tabName)} ${activeClass}`}
        onClick={() => this.props.changeTab(tabName)}
        onKeyDown={handleEnter(() => this.props.changeTab(tabName), true)}>
        {text}
      </a>
    );
  }

  render() {
    const { page, isMobile } = this.props;

    if (page === 'profile') {
      return null; // TODO: we may want to eventually show "My Assets" and "Shared to me" tabs.. TBD
    }

    const myAssetsTab = FeatureFlags.value('enable_internal_asset_manager_my_assets') ?
      this.renderTab('myAssets', _.get(I18n, 'header.asset_toggles.my_assets')) : null;
    const sharedToMeTab = FeatureFlags.value('enable_internal_asset_manager_my_assets') ?
      this.renderTab('sharedToMe', _.get(I18n, 'header.asset_toggles.shared_to_me')) : null;

    const assetToggles = (
      <div className="asset-toggles">
        {myAssetsTab}
          {sharedToMeTab}
        {this.renderTab('allAssets', _.get(I18n, 'header.asset_toggles.all_assets'))}
      </div>
    );

    const headerClassnames = classNames('header', {
      'mobile': isMobile
    });

    return (
      <div className={headerClassnames}>
        {!isMobile && assetToggles}
        <AssetCounts />
        {isMobile && assetToggles}
      </div>
    );
  }
}

Header.propTypes = {
  activeTab: PropTypes.string.isRequired,
  changeTab: PropTypes.func.isRequired,
  isMobile: PropTypes.bool.isRequired,
  page: PropTypes.string
};

const mapStateToProps = (state) => ({
  activeTab: state.header.activeTab,
  isMobile: state.windowDimensions.isMobile
});

const mapDispatchToProps = (dispatch) => ({
  changeTab: (newTab) => dispatch(changeTab(newTab))
});

export default connect(mapStateToProps, mapDispatchToProps)(Header);
