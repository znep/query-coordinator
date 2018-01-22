import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Attachment from 'datasetManagementUI/components/Attachment/Attachment';

class AttachmentsInput extends Component {
  render() {
    const { inErrorState, uploadAttachment, removeAttachment, editAttachment, field } = this.props;

    const attachments = field.value || [];

    const listItems = attachments.map((attachment, idx) => (
      <Attachment
        key={idx}
        attachment={attachment}
        onRemove={() => removeAttachment(attachment)}
        onEdit={newName => editAttachment(attachment, newName)} />
    ));

    return (
      <div>
        <div>
          <label
            id="add-attachment"
            className={`btn ${inErrorState ? 'btn-error' : 'btn-primary'}`}
            htmlFor="file">
            {field.buttonText}
          </label>
          <input
            id="file"
            className="dsmp-upload-button-input"
            name="file"
            type="file"
            value={''}
            aria-labelledby="add-attachment"
            onChange={evt => uploadAttachment(evt.target.files[0])} />
        </div>
        {!!listItems.length && <ul className="dsmp-attachment-list">{listItems}</ul>}
      </div>
    );
  }
}

AttachmentsInput.propTypes = {
  field: PropTypes.object,
  inErrorState: PropTypes.bool.isRequired,
  uploadAttachment: PropTypes.func.isRequired,
  removeAttachment: PropTypes.func.isRequired,
  editAttachment: PropTypes.func.isRequired
};

export default AttachmentsInput;
