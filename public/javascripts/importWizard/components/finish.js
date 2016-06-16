import React from 'react';

export function view() {
  return (
    <div className="finishPane">
      <p className="headline">{I18n.screens.dataset_new.finish.headline}</p>
      <p className="subheadline">{I18n.screens.dataset_new.finish.subheadline}</p>
    </div>
  );
}
