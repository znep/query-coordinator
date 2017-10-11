import _ from 'lodash';

const MOBILE_BREAKPOINT = 768;

const getInitialState = () => ({
  height: window.innerHeight,
  width: window.innerWidth,
  isMobile: window.innerWidth <= MOBILE_BREAKPOINT
});

export default (state, action) => {
  if (_.isUndefined(state)) {
    return getInitialState();
  }

  if (action.type === 'CHANGE_DIMENSIONS') {
    return {
      ...state,
      height: action.height,
      width: action.width,
      isMobile: action.width <= MOBILE_BREAKPOINT
    };
  }

  return state;
};
