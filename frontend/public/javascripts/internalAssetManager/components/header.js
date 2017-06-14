import React from 'react';
import AssetCounts from './asset_counts';

export class Header extends React.Component {
  render() {
    return (
      <div className="header">
        <div className="asset-toggles">
          <a href="#" className="asset-toggle active">{_.get(I18n, 'header.asset_toggles.all_assets')}</a>
          <a href="#" className="asset-toggle">{_.get(I18n, 'header.asset_toggles.my_assets')}</a>
        </div>

        <AssetCounts />
      </div>
    );
  }
}

export default Header;
