import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import SocrataIcon from '../SocrataIcon';

export const MenuListItem = (props) => {
  const { iconName, text, onClick } = props;

  const icon = iconName ?
    <SocrataIcon name={iconName} /> :
    null;

  return (
    <li>
      <button className="btn btn-transparent menu-list-item" onClick={onClick}>
        {icon}
        {text}
      </button>
    </li>
  );
};

MenuListItem.propTypes = {
  iconName: PropTypes.string,
  text: PropTypes.string.isRequired,
  onClick: PropTypes.func
};

MenuListItem.defaultProps = {
  onClick: _.noop
};

export default MenuListItem;
