import _ from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import AlertWrapper from './alert_wrapper';
import Header from './header';
import TabContent from './tab_content';
import WindowDimensions from './window_dimensions';
import * as tabActions from '../actions/tabs';

export class AssetBrowserWrapper extends Component {
  componentWillMount() {
    const { setTabs, tabs } = this.props;
    setTabs(tabs);
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
  setTabs: (tabs) => dispatch(tabActions.setTabs(tabs))
});

export default connect(null, mapDispatchToProps)(AssetBrowserWrapper);
