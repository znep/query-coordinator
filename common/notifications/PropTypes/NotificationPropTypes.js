import { PropTypes } from 'react';

export default {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  titleLink: PropTypes.string,
  body: PropTypes.string.isRequired,
  dateTime: PropTypes.number.isRequired,
  isUnread: PropTypes.bool
};
