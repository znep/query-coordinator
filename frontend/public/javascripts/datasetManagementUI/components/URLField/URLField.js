import React, { Component } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import TextInput from 'components/TextInput/TextInput';
import { getBasename, getExtension } from 'lib/util';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from './URLField.scss';

class URLField extends Component {
  render() {
    const { handleChangeUrl, handleXClick, value, errors, hrefId, uuid } = this.props;

    const urlErrors = _.chain(errors)
      .filter(err => err.name === 'UrlError')
      .flatMap(err => err.urls)
      .value();

    const dupeErrors = _.chain(errors)
      .filter(err => err.name === 'DuplicateFiletypeError')
      .filter(err => err.hrefId === hrefId)
      .flatMap(err => err.dupes)
      .value();

    const emptyErrors = _.chain(errors)
      .filter(err => err.name === 'EmptyError')
      .filter(err => err.hrefId === hrefId)
      .filter(err => err.id === uuid)
      .value();

    const urlInErrorState = urlErrors.length ? urlErrors.includes(value.url) : false;

    let filetypeInErrorState = false;
    let errorMessage = '';

    if (emptyErrors.length) {
      filetypeInErrorState = true;
      errorMessage = I18n.show_sources.error_no_empties;
    } else if (dupeErrors.length) {
      filetypeInErrorState = dupeErrors.includes(value.filetype);
      errorMessage = I18n.show_sources.error_no_dupes;
    }

    return (
      <div className={styles.urlFieldContainer}>
        <div className={styles.urlFieldArea}>
          <label>{I18n.show_sources.label_url}</label>
          <TextInput
            value={value.url}
            label={I18n.show_sources.label_url}
            name="url"
            isRequired
            inErrorState={urlInErrorState}
            handleChange={e =>
              handleChangeUrl({
                url: e.target.value,
                filetype: getExtension(getBasename(e.target.value))
              })
            } />
          {urlInErrorState && <div className={styles.error}>{I18n.show_sources.error_url}</div>}
        </div>
        <div className={styles.filetypeFieldArea}>
          <label>{I18n.show_sources.label_file_type}</label>
          <TextInput
            name="filetype"
            value={value.filetype}
            label={I18n.show_sources.label_file_type}
            inErrorState={filetypeInErrorState}
            handleChange={e =>
              handleChangeUrl({
                ...value,
                filetype: e.target.value
              })
            } />
          {filetypeInErrorState && <div className={styles.error}>{errorMessage}</div>}
        </div>
        <SocrataIcon name="close-2" className={styles.closeButton} onIconClick={handleXClick} />
      </div>
    );
  }
}

URLField.propTypes = {
  value: PropTypes.shape({
    url: PropTypes.string,
    filetype: PropTypes.string
  }),
  uuid: PropTypes.string.isRequired,
  hrefId: PropTypes.number.isRequired,
  errors: PropTypes.arrayOf(PropTypes.object).isRequired,
  handleChangeUrl: PropTypes.func.isRequired,
  handleXClick: PropTypes.func.isRequired
};

export default URLField;
