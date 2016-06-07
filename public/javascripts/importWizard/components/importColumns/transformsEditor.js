import _ from 'lodash';
import React, { PropTypes } from 'react';


export const ADD_TRANSFORM = 'ADD_TRANSFORM';
function addTransform() {
  return {
    type: ADD_TRANSFORM
  };
}

const initialState = [];

export function update(state, action) {
  switch(action) {
    case ADD_TRANSFORM:
      return XXX;
  }
}

export function view(props) {
  return <span>Hello world</span>;
}