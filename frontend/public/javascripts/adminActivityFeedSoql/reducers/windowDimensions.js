import { MOBILE_BREAKPOINT } from '../constants';

const initialState = {
  isMobile: window.innerWidth <= MOBILE_BREAKPOINT
};

export default function windowDimensions(state, action) {
  if (typeof state === 'undefined') {
    return initialState;
  }

  if (action.type === 'CHANGE_DIMENSIONS') {
    return Object.assign({}, state, { isMobile: action.isMobile });
  }

  return state;
}
