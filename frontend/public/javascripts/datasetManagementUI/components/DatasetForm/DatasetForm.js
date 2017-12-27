import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';
import Fieldset from 'components/Fieldset/Fieldset';
import DatasetField from 'containers/DatasetFieldContainer';
import WithFlash from 'containers/WithFlashContainer';
import styles from './DatasetForm.module.scss';

function getChangeHandler(field, fieldsetName, f) {
  switch (field.elementType) {
    case 'text':
    case 'textarea':
    case 'select':
      return e => f(fieldsetName, field.name, e.target.value);
    case 'attachmentsInput':
    case 'tagsInput':
      return v => f(fieldsetName, field.name, v);
    default:
      return () => {};
  }
}

const DatasetForm = ({ fieldsets = {}, handleDatasetChange, handleDatasetFormSubmit }) => {
  return (
    <WithFlash>
      <div className={styles.formContainer}>
        <span className={styles.requiredNote}>{I18n.metadata_manage.required_note}</span>
        <form onSubmit={handleDatasetFormSubmit} className={styles.form} id="datasetFrom">
          {Object.keys(fieldsets).map(fsKey => {
            return (
              <Fieldset title={fieldsets[fsKey].title} subtitle={fieldsets[fsKey].subtitle} key={fsKey}>
                {_.values(fieldsets[fsKey].fields).map(field => (
                  <DatasetField
                    key={`${fsKey}-${field.name}`}
                    field={field}
                    fieldsetName={fsKey}
                    handleChange={getChangeHandler(field, fsKey, handleDatasetChange)} />
                ))}
              </Fieldset>
            );
          })}
          <input type="submit" id="submit-dataset-form" className={styles.hidden} />
        </form>
      </div>
    </WithFlash>
  );
};

DatasetForm.propTypes = {
  fieldsets: PropTypes.object,
  handleDatasetFormSubmit: PropTypes.func,
  handleDatasetChange: PropTypes.func
};

export default DatasetForm;
