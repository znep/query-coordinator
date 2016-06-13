import React from 'react';


export const WORKING_NEXT = 'WORKING_NEXT';
export function workingNext() {
  return {
    type: WORKING_NEXT
  };
}

export function view() {
  return <span>{I18n.screens.dataset_new.processing}</span>;
}
