/* eslint react/jsx-indent: 0 */
import PropTypes from 'prop-types';

import React, { Component } from 'react';
import SocrataIcon from '../../../common/components/SocrataIcon';
import TextInput from 'components/TextInput/TextInput';
import TextArea from 'components/TextArea/TextArea';
import Select from 'components/Select/Select';
import TagsInput from 'components/TagsInput/TagsInput';
import AttachmentsInput from 'containers/AttachmentsInputContainer';
import * as Types from 'models/forms';
import styles from './Field.scss';

class Field extends Component {
  constructor() {
    super();

    // This lets us show and hide errors based on blur/focus
    this.state = {
      showErrors: false
    };

    this.handleBlur = this.handleBlur.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
  }

  isHalfSized(field) {
    return Types.Field.Tags.is(field) || Types.Field.Select.is(field) || field.data.name === 'attribution';
  }

  handleFocus() {
    this.setState({
      showErrors: false
    });
  }

  handleBlur() {
    this.setState({
      showErrors: true
    });
  }

  render() {
    const { field, errors, setValue, showErrors, revision } = this.props;

    const labelClassNames = [styles.label];

    if (field.data.isRequired) {
      labelClassNames.push(styles.labelRequired);
    }

    // The showErrors prop is supplied by the connected containers for this component.
    // It is a boolean that lives in the store. The reason we don't manage all error
    // showing locally is because the form is in that lame fullscreen modal, and the
    // submit button for the form is in the modal footer, outside the form. So we need
    // to have a way to show errors on submit (say for example a required field that
    // the user didn't touch in any way, thus not triggering the local showError state)
    // If we got rid of the modal, and moved the save button inside the form, we could
    // manage error state in the local state of the form component.
    const inErrorState = (showErrors || this.state.showErrors) && !!errors.length;

    const element = field.cata({
      Text: data =>
        <TextInput
          {...data}
          handleFocus={this.handleFocus}
          handleBlur={this.handleBlur}
          handleChange={({ target }) => setValue(target.value)}
          inErrorState={inErrorState} />,
      Tags: data =>
        <TagsInput
          {...data}
          handleFocus={this.handleFocus}
          handleBlur={this.handleBlur}
          setValue={setValue}
          inErrorState={inErrorState} />,
      Attachments: data =>
        <AttachmentsInput
          {...data}
          handleFocus={this.handleFocus}
          revision={revision}
          handleBlur={this.handleBlur}
          setValue={setValue}
          inErrorState={inErrorState} />,
      TextArea: data =>
        <TextArea
          {...data}
          handleFocus={this.handleFocus}
          handleBlur={this.handleBlur}
          handleChange={({ target }) => setValue(target.value)}
          inErrorState={inErrorState} />,
      Select: (data, options) =>
        <Select
          {...data}
          options={options}
          handleFocus={this.handleFocus}
          handleBlur={this.handleBlur}
          handleChange={({ target }) => setValue(target.value)}
          inErrorState={inErrorState} />,
      NoField: () =>
        <span>
          {I18n.edit_metadata.no_fields_message}
        </span>
    });

    return (
      <div className={this.isHalfSized(field) ? styles.halfSize : null}>
        <label htmlFor={field.data.name} className={labelClassNames.join(' ')}>
          {field.data.label}
        </label>
        {field.data.isPrivate &&
          <div>
            <SocrataIcon name="private" className={styles.icon} />
            <span className={styles.privateMessage}>
              {I18n.metadata_manage.dataset_tab.subtitles.private_field}
            </span>
          </div>}
        {element}
        {inErrorState
          ? <ul className={styles.errorList}>
              {errors.map(error =>
                <li className={styles.errorMessage} key={error}>
                  {error}
                </li>
              )}
            </ul>
          : null}
      </div>
    );
  }
}

Field.propTypes = {
  revision: PropTypes.object.isRequired,
  errors: PropTypes.array,
  setValue: PropTypes.func.isRequired,
  field: PropTypes.object.isRequired,
  showErrors: PropTypes.bool.isRequired
};

export default Field;
