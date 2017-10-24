import PropTypes from 'prop-types';
import React from 'react';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from './Attachment.scss';

const Attachment = ({ attachment, onRemove, onEdit }) =>
  <li className={styles.attachment}>
    <input
      type="text"
      className={`text-input  ${styles.filename}`}
      value={attachment.name}
      onChange={(e) => onEdit(e.target.value)} />
    <a
      onClick={onRemove}
      className={styles.removeButton}>
      <SocrataIcon name="close-2" className={styles.icon} />
    </a>
  </li>;

Attachment.propTypes = {
  attachment: PropTypes.object.isRequired,
  onRemove: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired
};

export default Attachment;
