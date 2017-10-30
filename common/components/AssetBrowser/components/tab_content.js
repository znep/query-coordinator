import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'lodash';

export class TabContent extends Component {
  render() {
    const { activeTab, tabs } = this.props;
    const currentTab = tabs[activeTab];

    // Render the component specified in the current tab. Pass the component all props given to the
    // AssetBrowser, along with any tab-component-specific props.
    return React.createElement(currentTab.component, _.merge({}, this.props, currentTab.props));
  }
}

TabContent.propTypes = {
  activeTab: PropTypes.string.isRequired,
  tabs: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  activeTab: state.header.activeTab
});

export default connect(mapStateToProps)(TabContent);
