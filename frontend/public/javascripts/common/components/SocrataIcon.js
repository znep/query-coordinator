import PropTypes from 'prop-types';
import React from 'react';

/*
React component for socrata icons. Used like so:
<SocrataIcon name='arrow-right' className='custom-className' size='lg' />
*/

const SocrataIcon = ({ name, className, size, onIconClick }) => {
  let classNames = []; // eslint-disable-line prefer-const

  classNames.push(`socrata-icon-${name}`);
  className && classNames.push(className); // eslint-disable-line no-unused-expressions
  size && classNames.push(`socrata-icon-${size}`); // eslint-disable-line no-unused-expressions

  return (
    <span onClick={onIconClick} className={classNames.join(' ')}></span>
  );
};

SocrataIcon.propTypes = {
  name: PropTypes.string.isRequired,
  className: PropTypes.string,
  size: PropTypes.oneOf(['lg', '2x', '3x', '4x', '5x']),
  onIconClick: PropTypes.func
};

export default SocrataIcon;
