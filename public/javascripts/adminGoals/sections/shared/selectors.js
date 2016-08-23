import * as Downloads from './downloads/selectors';

export { Downloads };

export const getLoading = (state) => state.getIn(['shared', 'loading', 'inProgress'], false);

