/* eslint react/jsx-indent: 0 */
import React, { PropTypes } from 'react';
import SocrataIcon from '../../../common/components/SocrataIcon';
import TextInput from 'components/FormComponents/TextInput';
import TextArea from 'components/FormComponents/TextArea';
import Select from 'components/FormComponents/Select';
import TagsInput from 'components/FormComponents/TagsInput';
import * as Types from 'models/forms';
import styles from 'styles/FormComponents/Field.scss';

// TODO: this is pretty lame...maybe do another way
function isHalfSized(field) {
  return Types.Field.Tags.is(field) || Types.Field.Select.is(field) || field.name === 'attribution';
}

const Field = ({ field, errors, setValue, showErrors }) => {
  if (!field) {
    return null;
  }

  const labelClassNames = [styles.label];

  if (field.isRequired) {
    labelClassNames.push(styles.labelRequired);
  }

  const inErrorState = showErrors && !!errors.length;

  const element = field.cata({
    Text: () => <TextInput field={field} setValue={setValue} inErrorState={inErrorState} />,
    Tags: () => <TagsInput field={field} setValue={setValue} inErrorState={inErrorState} />,
    TextArea: () => <TextArea field={field} setValue={setValue} inErrorState={inErrorState} />,
    Select: () => <Select field={field} setValue={setValue} inErrorState={inErrorState} />,
    NoField: () =>
      <span>
        {I18n.edit_metadata.no_fields_message}
      </span>
  });

  return (
    <div className={isHalfSized(field) ? styles.halfSize : null}>
      <label htmlFor={field.name} className={labelClassNames.join(' ')}>
        {field.label}
      </label>
      {field.isPrivate &&
        <div>
          <SocrataIcon name="private" className={styles.icon} />
          <span className={styles.privateMessage}>
            {I18n.metadata_manage.dataset_tab.subtitles.private_field}
          </span>
        </div>}
      {element}
      {showErrors && errors.length
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
};

Field.propTypes = {
  errors: PropTypes.array,
  setValue: PropTypes.func.isRequired,
  field: PropTypes.object.isRequired,
  showErrors: PropTypes.bool.isRequired
};

export default Field;
