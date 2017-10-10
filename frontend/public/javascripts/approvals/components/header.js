import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'lodash';

import connectLocalization from 'common/i18n/components/connectLocalization';
import SocrataIcon from 'common/components/SocrataIcon';

import * as actions from '../actions/header';

export class Header extends Component {
  render() {
    const { activeTab, changeTab, I18n } = this.props;
    const getTranslation = (key, count) => I18n.t(key, { count, scope: 'approvals.header' });

    const renderBreadcrumbs = () => (
      <h1 className="breadcrumbs">
        <a href="/admin">{getTranslation('breadcrumbs.administration')}</a>
        <SocrataIcon name="arrow-right" className="divider" />
        {getTranslation('breadcrumbs.approval_requests')}
      </h1>
    );

    const renderTabLinks = () => {
      const tabs = ['myQueue', 'history', 'settings'];

      return tabs.map((tabName) => {
        const activeClass = (tabName === activeTab) ? 'active' : '';
        const tabText = getTranslation(`tabs.${_.snakeCase(tabName)}.title`);

        return (
          <a
            key={tabName}
            href="#"
            className={`tab-link ${_.kebabCase(tabName)} ${activeClass}`}
            onClick={() => changeTab(tabName)}>
            {tabText}
          </a>
        );
      });
    };

    return (
      <div className="header">
        {renderBreadcrumbs()}
        <div className="tab-links">
          {renderTabLinks()}
        </div>
      </div>
    );
  }
}

Header.propTypes = {
  activeTab: PropTypes.string.isRequired,
  changeTab: PropTypes.func.isRequired,
  I18n: PropTypes.object
};

const mapStateToProps = (state) => ({
  activeTab: state.header.activeTab
});

const mapDispatchToProps = (dispatch) => ({
  changeTab: (newTab) => dispatch(actions.changeTab(newTab))
});

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(Header));
