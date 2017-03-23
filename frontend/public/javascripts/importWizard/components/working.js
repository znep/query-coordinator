import React from 'react';
import NavigationControl from './navigationControl';


export const WORKING_NEXT = 'WORKING_NEXT';
export function workingNext() {
  return {
    type: WORKING_NEXT
  };
}

export function view() {
  return (
    <div>
      <div className="workingPane">
        <p className="headline">{I18n.screens.dataset_new.processing}</p>
        <div className="spinner-default spinner-large-center"></div>
      </div>
      <NavigationControl />
    </div>
  );
}
