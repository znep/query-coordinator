import PropTypes from 'prop-types';
import React from 'react';
import Fieldset from 'components/Fieldset/Fieldset';
import Field from 'containers/DatasetFieldContainer';
import someOtherStyles from 'components/MetadataEditor/MetadataEditor.scss';

const DatasetForm = ({ fieldsets = {}, handleDatasetChange, handleSubmit }) => {
  return (
    <div className={someOtherStyles.container}>
      <form onSubmit={handleSubmit} className={someOtherStyles.datasetFormContainer}>
        {Object.keys(fieldsets).map(fsKey => {
          return (
            <Fieldset title={fieldsets[fsKey].title} subtitle={fieldsets[fsKey].subtitle} key={fsKey}>
              {Object.values(fieldsets[fsKey].fields).map(field => (
                <Field field={field} fieldsetName={fsKey} handleChange={handleDatasetChange} />
              ))}
            </Fieldset>
          );
        })}
        <button>submit</button>
      </form>
    </div>
  );
};

DatasetForm.propTypes = {
  fieldsets: PropTypes.object.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  handleDatasetChange: PropTypes.func.isRequired
};

export default DatasetForm;
