/* eslint react/jsx-indent: 0 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import SocrataIcon from '../../../common/components/SocrataIcon';
import TextInput from 'components/TextInput/TextInputNew';
import TextArea from 'components/TextArea/TextAreaNew';
import Select from 'components/Select/SelectNew';
import TagsInput from 'components/TagsInput/TagsInput';
import AttachmentsInput from 'containers/AttachmentsInputContainer';
import styles from './Field.scss';

class FieldNew extends Component {
  render() {
    const { field, fieldsetName, handleChange, errors } = this.props;

    const inErrorState = errors && !!errors.length;
    // const inErrorState = true;
    const labelClassNames = [styles.label];

    if (field.isRequired) {
      labelClassNames.push(styles.labelRequired);
    }

    let element;

    switch (field.elementType) {
      case 'text':
        element = (
          <TextInput
            field={field}
            inErrorState={inErrorState}
            handleChange={e => handleChange(fieldsetName, field.name, e.target.value)} />
        );
        break;
      case 'textarea':
        element = (
          <TextArea
            field={field}
            inErrorState={inErrorState}
            handleChange={e => handleChange(fieldsetName, field.name, e.target.value)} />
        );
        break;
      case 'select':
        element = (
          <Select
            field={field}
            inErrorState={inErrorState}
            handleChange={e => handleChange(fieldsetName, field.name, e.target.value)} />
        );
        break;
      case 'tagsInput':
        element = (
          <TagsInput
            field={field}
            inErrorState={inErrorState}
            handleAddTag={tags => handleChange(fieldsetName, field.name, tags)} />
        );
        break;
      case 'attachmentsInput':
        element = (
          <AttachmentsInput
            field={field}
            inErrorState={inErrorState}
            handleAttachmentChange={attachments => handleChange(fieldsetName, field.name, attachments)} />
        );
        break;
      default:
        element = null;
    }

    return (
      <div className={field.halfWidth ? styles.halfWidth : ''}>
        <label htmlFor={field.name} className={labelClassNames.join(' ')}>
          {field.label}
        </label>
        {field.isPrivate && (
          <div>
            <SocrataIcon name="private" className={styles.icon} />
            <span className={styles.privateMessage}>
              {I18n.metadata_manage.dataset_tab.subtitles.private_field}
            </span>
          </div>
        )}
        {element}
        {inErrorState ? (
          <ul className={styles.errorList}>
            {errors.map(error => (
              <li className={styles.errorMessage} key={error}>
                {error}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }
}

FieldNew.propTypes = {
  field: PropTypes.object.isRequired,
  fieldsetName: PropTypes.string.isRequired,
  errors: PropTypes.arrayOf(PropTypes.string),
  handleChange: PropTypes.func.isRequired
};

export default FieldNew;
