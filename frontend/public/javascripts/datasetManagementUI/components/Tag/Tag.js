import PropTypes from 'prop-types';
import React from 'react';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from './Tag.module.scss';

const Tag = ({ tagName, onTagClick }) =>
  <li className={styles.tag} onClick={onTagClick}>
    {tagName}
    <SocrataIcon name="close-2" className={styles.icon} />
  </li>;

Tag.propTypes = {
  tagName: PropTypes.string.isRequired,
  onTagClick: PropTypes.func
};

export default Tag;
