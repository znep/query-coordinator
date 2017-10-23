import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TextInput from 'components/TextInput/TextInput';
import { getBasename, getExtension } from 'lib/util';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from './URLField.scss';

class URLField extends Component {
  render() {
    const { handleChangeUrl, handleXClick, value, errors } = this.props;

    const inErrorState = errors.includes(value);

    return (
      <div>
        <div className={styles.urlFieldArea}>
          <label>{I18n.show_sources.label_url}</label>
          <TextInput
            value={value.url}
            label={I18n.show_sources.label_url}
            name="url"
            isRequired
            inErrorState={inErrorState}
            handleChange={e =>
              handleChangeUrl({
                url: e.target.value,
                filetype: getExtension(getBasename(e.target.value))
              })} />
          {inErrorState && <div className={styles.error}>{I18n.show_sources.error_url}</div>}
        </div>
        <div className={styles.filetypeFieldArea}>
          <label>{I18n.show_sources.label_file_type}</label>
          <TextInput
            name="filetype"
            value={value.filetype}
            label={I18n.show_sources.label_file_type}
            inErrorState={false}
            handleChange={e =>
              handleChangeUrl({
                ...value,
                filetype: e.target.value
              })} />
        </div>
        <SocrataIcon name="close-2" className={styles.closeButton} onIconClick={handleXClick} />
      </div>
    );
  }
}

URLField.propTypes = {
  value: PropTypes.string,
  errors: PropTypes.arrayOf(PropTypes.string).isRequired,
  handleChangeUrl: PropTypes.func.isRequired,
  handleXClick: PropTypes.func.isRequired
};

export default URLField;
