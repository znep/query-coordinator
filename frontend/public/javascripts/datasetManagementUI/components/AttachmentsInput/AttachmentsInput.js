import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Attachment from 'components/Attachment/Attachment';
import classNames from 'classnames';
import styles from './AttachmentsInput.scss';

class AttachmentsInput extends Component {
  render() {
    const { inErrorState, uploadAttachment, removeAttachment, editAttachment, field } = this.props;

    const attachments = field.value || [];

    const buttonClasses = classNames(styles.button, { [styles.validationError]: inErrorState });

    const listItems = attachments.map((attachment, idx) => (
      <Attachment
        key={idx}
        attachment={attachment}
        onRemove={() => removeAttachment(attachment)}
        onEdit={newName => editAttachment(attachment, newName)} />
    ));

    return (
      <div>
        <div className={styles.container}>
          <label id="add-attachment" className={buttonClasses} htmlFor="file">
            {field.buttonText}
          </label>
          <input
            id="file"
            className={styles.uploadButtonInput}
            name="file"
            type="file"
            value={''}
            aria-labelledby="add-attachment"
            onChange={evt => uploadAttachment(evt.target.files[0])} />
        </div>
        {!!listItems.length && <ul className={styles.attachmentList}>{listItems}</ul>}
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
