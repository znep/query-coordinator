import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TextInput from 'components/TextInput/TextInput';
import { getBasename, getExtension } from 'lib/util';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from './URLField.scss';

class URLField extends Component {
  constructor() {
    super();
    this.state = {
      extension: ''
    };

    this.handleExtensionChange = this.handleExtensionChange.bind(this);
  }

  componentWillMount() {
    // If we have a url saved on the server, then we need to extract the extension
    // on mount IOT populate the file type field below
    this.setState({
      extension: getExtension(getBasename(this.props.value))
    });
  }

  componentWillReceiveProps(nextProps) {
    // If the user changes the value of the url field, update the extension. If
    // we didn't do this, the file type and url fields would get out of sync
    if (nextProps.value !== this.props.value) {
      this.setState({
        extension: getExtension(getBasename(nextProps.value))
      });
    }
  }

  handleExtensionChange(e) {
    // allows the user to override the calculated extension
    this.setState({
      extension: e.target.value
    });
  }

  render() {
    const { handleChangeUrl, handleXClick, value, errors } = this.props;

    const inErrorState = errors.includes(value);

    return (
      <div>
        <div className={styles.urlFieldArea}>
          <label>{I18n.show_sources.label_url}</label>
          <TextInput
            value={value}
            label={I18n.show_sources.label_url}
            name="url"
            isRequired
            inErrorState={inErrorState}
            handleChange={e => handleChangeUrl(e.target.value)} />
          {inErrorState && <div className={styles.error}>{I18n.show_sources.error_url}</div>}
        </div>
        <div className={styles.filetypeFieldArea}>
          <label>{I18n.show_sources.label_file_type}</label>
          <TextInput
            name="filetype"
            value={this.state.extension}
            label={I18n.show_sources.label_file_type}
            inErrorState={false}
            handleChange={this.handleExtensionChange} />
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
