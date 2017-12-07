import React, { Component } from 'react';
import cssModules from 'react-css-modules';

import I18n from 'common/i18n';
import SocrataIcon from 'common/components/SocrataIcon';

import styles from './audience-label.scss';
import AudienceScopePropType from '../../propTypes/AudienceScopePropType';

/**
 * A label with an icon, a title, and a subtitle that describes a "scope"
 * of audience (public, private, etc.)
 *
 * Assumes that the following translation keys exist:
 *  - shared.site_chrome.access_manager.audience.${scope}.title
 *  - shared.site_chrome.access_manager.audience.${scope}.subtitle
 * where ${scope} is what is passed in to the component's props.
 *
 * Icons are stored in a static object in the class, for now.
 */
class AudienceScopeLabel extends Component {
  static propTypes = {
    scope: AudienceScopePropType.isRequired
  };

  // this is *probably* fine right here for now
  // since these won't be changing frequently, if at all
  static iconForScope = {
    'private': 'sub-org',
    'organization': 'my-org',
    'public': 'public-open'
  };

  render() {
    const { scope } = this.props;

    return (
      <div styleName="container">
        <SocrataIcon
          name={AudienceScopeLabel.iconForScope[scope]}
          styleName="icon" />
        <div styleName="label">
          <span styleName="title">
            {I18n.t(`shared.site_chrome.access_manager.audience.${scope}.title`)}
          </span>
          <span styleName="subtitle">
            {I18n.t(`shared.site_chrome.access_manager.audience.${scope}.subtitle`)}
          </span>
        </div>
      </div>
    );
  }
}

export default cssModules(AudienceScopeLabel, styles);
