import * as Immutable from 'immutable';

const emptyFile = Immutable.Map({});

export const getFile = (state, section, fileName) => {
  const file = state.getIn(['shared', 'downloads', section, fileName]);
  return file || emptyFile;
};
