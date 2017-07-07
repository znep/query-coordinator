import React from 'react';
import I18n from 'common/i18n';

export var EmptyPane = () => (
  <div className="authoring-empty-pane alert info">
    <p>
      <span className="icon-info" />
      {I18n.t('shared.visualizations.panes.nothing_here')}
    </p>
  </div>
);

export default EmptyPane;
