import PropTypes from 'prop-types';

export const dateSlice = PropTypes.shape({
  column: PropTypes.string.isRequired,
  end_date: PropTypes.string,
  logical_operator: PropTypes.string,
  operator: PropTypes.string.isRequired,
  start_date: PropTypes.string
});

export const locationSlice = PropTypes.shape({
  column: PropTypes.string.isRequired,
  location: PropTypes.string,
  logical_operator: PropTypes.string,
  lat: PropTypes.string,
  lng: PropTypes.string,
  operator: PropTypes.string.isRequired
});

export const numberSlice = PropTypes.shape({
  aggregation: PropTypes.string,
  column: PropTypes.string,
  logical_operator: PropTypes.string,
  operator: PropTypes.string,
  value: PropTypes.string
});

export const textSlice = PropTypes.shape({
  column: PropTypes.string.isRequired,
  logical_operator: PropTypes.string,
  operator: PropTypes.string,
  value: PropTypes.string
});

export default PropTypes.oneOfType([
  dateSlice,
  locationSlice,
  numberSlice,
  textSlice
]);
