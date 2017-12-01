import PropTypes from 'prop-types';
import React from 'react';
import SocrataIcon from '../../../common/components/SocrataIcon';

function DropdownWithIcon({ icon, title }) {
  return (
    <div>
      <SocrataIcon className={icon} name={title} />
      {title}
    </div>
  );
}

DropdownWithIcon.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired
};

export default DropdownWithIcon;
