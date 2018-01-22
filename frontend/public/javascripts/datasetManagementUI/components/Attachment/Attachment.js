import PropTypes from 'prop-types';
import React from 'react';
import SocrataIcon from '../../../common/components/SocrataIcon';

const Attachment = ({ attachment, onRemove, onEdit }) =>
  <li className="dsmp-attachment">
    <input
      type="text"
      className="text-input dsmp-filename"
      value={attachment.name}
      onChange={(e) => onEdit(e.target.value)} />
    <a
      onClick={onRemove}
      className="dsmp-remove-button">
      <SocrataIcon name="close-2" />
    </a>
  </li>;

Attachment.propTypes = {
  attachment: PropTypes.object.isRequired,
  onRemove: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired
};

export default Attachment;
