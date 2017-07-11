import React, { PropTypes } from 'react';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from 'styles/FormComponents/Tag.scss';

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
