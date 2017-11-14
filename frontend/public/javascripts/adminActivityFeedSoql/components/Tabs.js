import _ from 'lodash';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import classNames from 'classnames';
import { handleEnter } from 'common/dom_helpers/keyPressHelpers';
import LocalizedText from 'common/i18n/components/LocalizedText';

import PropTypes from 'prop-types';

class Tabs extends PureComponent {
  constructor(props) {
    super(props);

    _.bindAll(this, ['renderTabByKey']);
  }

  renderTabByKey(tab) {
    const { activeTab, changeTab } = this.props;

    const tabClasses = classNames('asset-tab', tab, {
      'active': tab === activeTab
    });

    const onClick = (e) => {
      e.preventDefault();
      changeTab(tab);
    };

    const linkProps = {
      key: tab,
      href: '#',
      className: tabClasses,
      onClick,
      onKeyDown: handleEnter(() => changeTab(tab), true)
    };

    const translationKey = `screens.admin.activity_feed.tabs.${tab}`;

    return (
      <a {...linkProps}>
        <LocalizedText localeKey={translationKey} />
      </a>
    );
  }

  render() {
    const { isMobile } = this.props;
    const headerClassnames = classNames('header', { 'mobile': isMobile });

    return (
      <div className={headerClassnames}>
        <div className="asset-tabs">
          {['all', 'failure', 'deleted'].map(this.renderTabByKey)}
        </div>
      </div>
    );
  }
}


Tabs.propTypes = {
  activeTab: PropTypes.string.isRequired,
  changeTab: PropTypes.func.isRequired,
  isMobile: PropTypes.bool.isRequired
};

const mapStateToProps = state => ({
  activeTab: state.filters.activeTab,
  isMobile: state.windowDimensions.isMobile
});

const mapDispatchToProps = dispatch => ({
  changeTab: tab => dispatch(actions.filters.changeTab(tab))
});

export default connect(mapStateToProps, mapDispatchToProps)(Tabs);
