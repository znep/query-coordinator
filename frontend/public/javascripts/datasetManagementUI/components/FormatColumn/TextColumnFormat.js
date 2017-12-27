import PropTypes from 'prop-types';
import React from 'react';
import styles from './FormatColumn.module.scss';
import Alignment from './Alignment';
import { Dropdown } from 'common/components';
import DropdownWithIcon from '../DropdownWithIcon/DropdownWithIcon';

const SubI18n = I18n.format_column;

function RenderTypeChooser({ onChange, format }) {
  const dropdownProps = {
    onSelection: e => onChange({ displayStyle: e.value }),
    value: format.displayStyle || null,
    placeholder: SubI18n.render_type,
    options: [
      {
        title: SubI18n.normal,
        value: null,
        icon: 'socrata-icon-text',
        render: DropdownWithIcon
      },
      {
        title: SubI18n.url,
        value: 'url',
        icon: 'socrata-icon-link',
        render: DropdownWithIcon
      },
      {
        title: SubI18n.email,
        value: 'email',
        icon: 'socrata-icon-email',
        render: DropdownWithIcon
      }
    ]
  };
  return (
    <div>
      <label>{SubI18n.render_type}</label>
      <Dropdown {...dropdownProps} />
    </div>
  );
}
RenderTypeChooser.propTypes = {
  onChange: PropTypes.func.isRequired,
  format: PropTypes.object.isRequired
};


function TextColumnFormat({ onUpdateFormat, format }) {
  return (
    <div className={styles.formatColumn}>
      <form>
        <Alignment onChange={onUpdateFormat} format={format} />
        <RenderTypeChooser onChange={onUpdateFormat} format={format} />
      </form>
    </div>
  );
}

TextColumnFormat.propTypes = {
  onUpdateFormat: PropTypes.func.isRequired,
  format: PropTypes.object.isRequired
};

export default TextColumnFormat;
