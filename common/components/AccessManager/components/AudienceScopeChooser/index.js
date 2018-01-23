import React, { Component } from 'react';
import cssModules from 'react-css-modules';
import get from 'lodash/get';

import styles from './chooser.module.scss';
import AudienceScopeChooserRadioButton from './AudienceScopeChooserRadioButton';

/**
 * Renders all the radio buttons to change the chosen audience
 */
class AudienceScopeChooser extends Component {
  render() {
    const renderOrgannizationScope = get(window, 'socrata.featureFlags.enable_internal_sharing', false);
    return (
      <div styleName="chooser">
        <AudienceScopeChooserRadioButton scope="private" />
        {renderOrgannizationScope && (<AudienceScopeChooserRadioButton scope="organization" />)}
        <AudienceScopeChooserRadioButton scope="public" />
      </div>
    );
  }
}

export default cssModules(AudienceScopeChooser, styles);
