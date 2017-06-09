import React from 'react';
import { I18n } from 'common/visualizations';

export var EmptyPane = () => (
  <div className="authoring-empty-pane alert info">
    <p>
      <span className="icon-info" />
      {I18n.translate('panes.nothing_here')}
    </p>
  </div>
);

export default EmptyPane;
