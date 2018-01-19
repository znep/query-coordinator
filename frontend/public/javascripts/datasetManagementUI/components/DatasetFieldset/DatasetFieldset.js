import React from 'react';
import PropTypes from 'prop-types';
import Fieldset from 'datasetManagementUI/components/Fieldset/Fieldset';
import TextInput from 'datasetManagementUI/components/TextInput/TextInput';
import TextArea from 'datasetManagementUI/components/TextArea/TextArea';
import URLField from 'datasetManagementUI/components/URLField/URLField';
import styles from './DatasetFieldset.module.scss';

const DatasetFieldset = ({
  href,
  handleAddURL,
  handleChangeUrl,
  handleChangeHref,
  handleRemoveFirstURL,
  handleRemoveOtherURL,
  handleXClick,
  errors
}) => (
  <Fieldset
    title={href.title}
    closable
    closeCallback={handleXClick}
    containerClass={styles.fieldset}
    legendClass={styles.legend}>
    <div className={styles.fieldWrapper} data-cheetah-hook="dataset-fieldset">
      <div>
        <label>{I18n.show_sources.label_name}</label>
        <TextInput
          field={{
            name: 'title',
            value: href.title,
            label: I18n.show_sources.label_name
          }}
          inErrorState={false}
          handleChange={e => handleChangeHref(href.id, 'title', e.target.value)} />
      </div>
      <div>
        <label>{I18n.show_sources.label_description}</label>
        <TextArea
          field={{
            name: 'description',
            value: href.description,
            label: I18n.show_sources.label_description
          }}
          inErrorState={false}
          handleChange={e => handleChangeHref(href.id, 'description', e.target.value)} />
      </div>
      <div>
        {Object.keys(href.urls).map((key, idx) => {
          return (
            <URLField
              key={key}
              uuid={key}
              hrefId={href.id}
              errors={errors}
              value={href.urls[key]}
              handleXClick={
                idx === 0
                  ? () => handleRemoveFirstURL(href.id, key)
                  : () => handleRemoveOtherURL(href.id, key)
              }
              handleChangeUrl={handleChangeUrl(key)} />
          );
        })}
        <a className={styles.addURLBtn} onClick={handleAddURL}>
          {I18n.show_sources.add_url}
        </a>
      </div>
      <div>
        <label>{I18n.show_sources.label_data_dictionary}</label>
        <TextInput
          field={{
            name: 'dictionary-url',
            value: href.data_dictionary,
            label: I18n.show_sources.label_data_dictionary
          }}
          inErrorState={false}
          handleChange={e => handleChangeHref(href.id, 'data_dictionary', e.target.value)} />
      </div>
    </div>
  </Fieldset>
);

DatasetFieldset.propTypes = {
  href: PropTypes.shape({
    id: PropTypes.number.isRequired,
    data_dictionary: PropTypes.string,
    data_dictionary_type: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    urls: PropTypes.object.isRequired
  }),
  handleAddURL: PropTypes.func.isRequired,
  handleChangeUrl: PropTypes.func.isRequired,
  handleChangeHref: PropTypes.func.isRequired,
  handleRemoveFirstURL: PropTypes.func.isRequired,
  handleRemoveOtherURL: PropTypes.func.isRequired,
  handleXClick: PropTypes.func.isRequired,
  errors: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default DatasetFieldset;
