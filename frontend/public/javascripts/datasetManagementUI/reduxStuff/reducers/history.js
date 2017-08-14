import { ADD_LOCATION } from 'reduxStuff/actions/history';

const history = (state = [], action) => {
  switch (action.type) {
    case ADD_LOCATION:
      return [...state, action.location];
    default:
      return state;
  }
};

export default history;
