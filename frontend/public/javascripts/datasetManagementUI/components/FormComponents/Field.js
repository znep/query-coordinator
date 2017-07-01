/* eslint react/jsx-indent: 0 */
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import SocrataIcon from '../../../common/components/SocrataIcon';
import TextInput from 'components/FormComponents/TextInput';
import TextArea from 'components/FormComponents/TextArea';
import Select from 'components/FormComponents/Select';
import TagsInput from 'components/FormComponents/TagsInput';
import * as Types from 'models/forms';
import styles from 'styles/MetadataField.scss';

// TODO: this is pretty ugly...maybe do another way
const isHalfSized = field =>
  Types.Field.Tags.is(field) || Types.Field.Select.is(field) || field.name === 'attribution';

const Field = ({ field, errors, setValue, showErrors }) => {
  if (!field) {
    return null;
  }

  const labelClassNames = [styles.label];

  if (field.isRequired) {
    labelClassNames.push(styles.labelRequired);
  }

  const inErrorState = showErrors && errors.length;

  const element = field.cata({
    Text: () => <TextInput field={field} setValue={setValue} inErrorState={inErrorState} />,
    Tags: () => <TagsInput field={field} setValue={setValue} inErrorState={inErrorState} />,
    TextArea: () => <TextArea field={field} setValue={setValue} inErrorState={inErrorState} />,
    Select: () => <Select field={field} setValue={setValue} inErrorState={inErrorState} />
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

const mapStateToProps = ({ entities, ui }, { field, fieldset }) => {
  const { fourfour } = ui.routing;

  const datasetMetadataErrors = _.get(entities, `views.${fourfour}.datasetMetadataErrors`, []);

  const errors = datasetMetadataErrors
    .filter(error => error.fieldset === fieldset && error.fieldName === field.name)
    .map(error => error.message);

  const showErrors = !!entities.views[fourfour].showErrors;

  return { errors, fourfour, showErrors };
};

const forgePath = (field, fieldsetName, fourfour) => {
  const isRegPrivate = f => f.isPrivate && !f.isCustom;
  const isCustomPrivate = f => f.isPrivate && f.isCustom;
  const isCustomPublic = f => !f.isPrivate && f.isCustom;

  let path;

  if (isRegPrivate(field)) {
    path = `${fourfour}.privateMetadata.${field.name}`;
  } else if (isCustomPrivate(field)) {
    path = `${fourfour}.privateMetadata.custom_fields.${fieldsetName}.${field.name}`;
  } else if (isCustomPublic(field)) {
    path = `${fourfour}.metadata.custom_fields.${fieldsetName}.${field.name}`;
  } else {
    path = `${fourfour}.${field.name}`;
  }

  return path;
};

// We don't use this much, but it is a nice alternative to using the component
// as a place to put together the output of mapStateToProps and mapDispatchToProps;
// mergeProps provides a place to do this putting-together without cluttering the
// component. For more info/background, see discussion here:
// https://github.com/reactjs/react-redux/issues/237#issuecomment-168816713
const mergeProps = ({ fourfour, ...rest }, { dispatch }, ownProps) => ({
  ...rest,
  ...ownProps,
  setValue: value =>
    dispatch({
      type: 'SET_VALUE',
      path: forgePath(ownProps.field, ownProps.fieldset, fourfour),
      value
    })
});

export default connect(mapStateToProps, null, mergeProps)(Field);
