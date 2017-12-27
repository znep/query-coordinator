import React, { Component } from 'react';
import styles from './tabs.module.scss';
import cssModules from 'react-css-modules';
import I18n from 'common/i18n';

class Tabs extends Component {
  render() {
    const { selectedTab } = this.props;
    return (
      <div className="tabs">
        <ul className="nav">
          <li className="active">
            <a className="nav-link active">
              {I18n.t('advance_alert', { scope: 'shared.components.create_alert_modal.tab' })}
            </a>
          </li>
        </ul>
      </div>
    );
  }
}

export default cssModules(Tabs, styles, { allowMultiple: true });
