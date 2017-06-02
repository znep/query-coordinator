import React from 'react';
import cssModules from 'react-css-modules';
import { SocrataIcon } from 'common/components/SocrataIcon';
import styles from './socrata-logo.scss';

function SocrataLogo() {
  return (
    <span styleName="logo">
      <SocrataIcon name="logo" />
    </span>
  );
}

export default cssModules(SocrataLogo, styles);
