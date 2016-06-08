import React, { PropTypes } from 'react';


export const WORKING_NEXT = 'WORKING_NEXT';
export function workingNext() {
  return {
    type: WORKING_NEXT
  };
}

export function view() {
  return <span>Working...</span>;
}
