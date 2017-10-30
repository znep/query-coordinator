import PropTypes from 'prop-types';
import React from 'react';
import { Dropdown } from 'common/components';
import SocrataIcon from '../../../common/components/SocrataIcon';

const SubI18n = I18n.format_column;

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


function Alignment({ onChange, format }) {
  const dropdownProps = {
    onSelection: e => onChange({ align: e.value }),
    value: format.align || 'left',
    options: [
      {
        title: SubI18n.left,
        value: 'left',
        icon: 'socrata-icon-paragraph-left',
        render: DropdownWithIcon
      },
      {
        title: SubI18n.right,
        value: 'right',
        icon: 'socrata-icon-paragraph-right3',
        render: DropdownWithIcon
      },
      {
        title: SubI18n.center,
        value: 'center',
        icon: 'socrata-icon-paragraph-center3',
        render: DropdownWithIcon
      }
    ]
  };


  return (
    <div>
      <label>{SubI18n.alignment}</label>
      <Dropdown {...dropdownProps} />
    </div>
  );
}

Alignment.propTypes = {
  onChange: PropTypes.func.isRequired,
  format: PropTypes.object.isRequired
};

export default Alignment;
