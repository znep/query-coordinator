import { createSelector } from 'reselect';

const getLoading = (state) => state.isLoading;
const getData = (state) => state.data;
const getError = (state) => state.error;

export const isLoading = createSelector(
  getLoading,
  (isLoading) => isLoading
);

export const hasData = createSelector(
  getData,
  (data) => {
    return !_.isNull(data);
  }
);

export const hasError = createSelector(
  getError,
  (error) => {
    return !_.isNull(error)
  }
);
