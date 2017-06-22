import React from 'react';
import AssetCounts from './asset_counts';
import { FeatureFlags } from 'common/feature_flags';

export class Header extends React.Component {
  myAssetsTab() {
    if (FeatureFlags.value('enable_internal_asset_manager_my_assets')) {
      return (
        <a href="#" className="asset-toggle my-assets">
          {_.get(I18n, 'header.asset_toggles.my_assets')}
        </a>
      );
    }
  }

  render() {
    return (
      <div className="header">
        <div className="asset-toggles">
          <a href="#" className="asset-toggle all-assets active">
            {_.get(I18n, 'header.asset_toggles.all_assets')}
          </a>
          {this.myAssetsTab()}
        </div>

        <AssetCounts />
      </div>
    );
  }
}

export default Header;
