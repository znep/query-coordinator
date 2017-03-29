const fourfour = (state = '', action) => {
  switch (action.type) {
    case 'SET_FOURFOUR':
      return action.fourfour;
    default:
      return state;
  }
};

export default fourfour;
