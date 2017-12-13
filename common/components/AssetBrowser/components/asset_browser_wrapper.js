import _ from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import AlertWrapper from './alert_wrapper';
import Header from './header';
import TabContent from './tab_content';
import WindowDimensions from './window_dimensions';
import * as assetBrowserPropsActions from '../actions/asset_browser_props';

export class AssetBrowserWrapper extends Component {
  componentWillMount() {
    const { setAssetBrowserProps } = this.props;
    setAssetBrowserProps(this.props);
  }

  render() {
    const { showHeader } = this.props;
    const header = showHeader ? <Header {...this.props} /> : null;

    return (
      <div className="asset-browser">
        {header}
        <TabContent {...this.props} />
        <AlertWrapper />
        <WindowDimensions />
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => ({
  setAssetBrowserProps: (props) => dispatch(assetBrowserPropsActions.setAssetBrowserProps(props))
});

export default connect(null, mapDispatchToProps)(AssetBrowserWrapper);
