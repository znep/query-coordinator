import React from 'react';
import PropTypes from 'prop-types';
import { SocrataIcon } from 'common/components';

const MemberScreenName = ({ screenName, id }) => (
  <span>
    <SocrataIcon name="user" />
    <a href={`/profile/${id}`}>{screenName}</a>
  </span>
);

MemberScreenName.propTypes = {
  id: PropTypes.string.isRequired,
  screenName: PropTypes.string.isRequired
};

export default MemberScreenName;
