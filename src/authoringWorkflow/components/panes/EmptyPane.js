import React from 'react';
import { translate } from '../../../I18n';

export var EmptyPane = () => (
  <div className="authoring-empty-pane alert info">
    <p>
      <span className="icon-info" />
      {translate('panes.nothing_here')}
    </p>
  </div>
);

export default EmptyPane;
