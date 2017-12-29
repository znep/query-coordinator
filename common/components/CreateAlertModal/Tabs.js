import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from './tabs.module.scss';
import cssModules from 'react-css-modules';
import I18n from 'common/i18n';

class Tabs extends Component {
  render() {
    const { selectedTab } = this.props;
    return (
      <div styleName="tabs">
        <ul className="nav">
          <li styleName="active">
            <a className="nav-link">
              {I18n.t('advance_alert', { scope: 'shared.components.create_alert_modal.tab' })}
            </a>
          </li>
        </ul>
      </div>
    );
  }
}

Tabs.propTypes = {
  selectedTab: PropTypes.string
};

export default cssModules(Tabs, styles, { allowMultiple: true });
