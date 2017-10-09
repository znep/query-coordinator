import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ManageData from 'components/ManageData/ManageData';
import RecentActions from 'containers/RecentActionsContainer';
import styles from './HomePaneSidebar.scss';

class HomePaneSidebar extends Component {
  constructor() {
    super();
    this.state = {
      activeTab: ''
    };
  }

  componentWillMount() {
    this.setState({
      activeTab: this.props.defaultTab
    });
  }

  setActiveTab(tabName) {
    this.setState({
      activeTab: tabName
    });
  }

  isActive(tabName) {
    return this.state.activeTab === tabName;
  }

  render() {
    let contents;

    // prob don't need a switch statement at this point but we plan to add
    // more stuff here so might as well make it extensible.
    switch (this.state.activeTab) {
      case 'manageData':
        contents = <ManageData />;
        break;
      case 'recentActions':
        contents = <RecentActions />;
        break;
      default:
        contents = <RecentActions />;
    }

    return (
      <div className={styles.sidebar}>
        <div className={styles.nav}>
          <button
            onClick={() => this.setActiveTab('recentActions')}
            className={this.isActive('recentActions') ? styles.navBtnEnabled : styles.navBtn}>
            {I18n.home_pane.home_pane_sidebar.recent_actions}
          </button>
          <button
            onClick={() => this.setActiveTab('manageData')}
            className={this.isActive('manageData') ? styles.navBtnEnabled : styles.navBtn}>
            {I18n.home_pane.home_pane_sidebar.manage}
          </button>
        </div>
        {contents}
      </div>
    );
  }
}

HomePaneSidebar.propTypes = {
  defaultTab: PropTypes.oneOf(['manageData', 'recentActions'])
};

export default HomePaneSidebar;
