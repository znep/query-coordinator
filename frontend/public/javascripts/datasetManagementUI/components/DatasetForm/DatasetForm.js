import PropTypes from 'prop-types';
import React from 'react';
import Fieldset from 'components/Fieldset/Fieldset';
import Field from 'containers/DatasetFieldContainer';
import WithFlash from 'containers/WithFlashContainer';
import styles from './DatasetForm.scss';

const DatasetForm = ({ fieldsets = {}, handleDatasetChange, handleSubmit }) => {
  return (
    <WithFlash>
      <div className={styles.formContainer}>
        <span className={styles.requiredNote}>{I18n.metadata_manage.required_note}</span>
        <form onSubmit={handleSubmit} className={styles.form} id="datasetFrom">
          {Object.keys(fieldsets).map(fsKey => {
            return (
              <Fieldset title={fieldsets[fsKey].title} subtitle={fieldsets[fsKey].subtitle} key={fsKey}>
                {Object.values(fieldsets[fsKey].fields).map(field => (
                  <Field field={field} fieldsetName={fsKey} handleChange={handleDatasetChange} />
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
  fieldsets: PropTypes.object.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  handleDatasetChange: PropTypes.func.isRequired
};

export default DatasetForm;
