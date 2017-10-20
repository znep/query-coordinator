import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { enabledFileExtensions, formatExpanation } from 'lib/fileExtensions';
import TextInput from 'components/TextInput/TextInput';
import SourceMessage from 'components/SourceMessage/SourceMessage';
import ApiCallButton from 'containers/ApiCallButtonContainer';
import { CREATE_SOURCE } from 'reduxStuff/actions/createSource';
import styles from './URLSource.scss';

const SubI18n = I18n.import_from_url;

class URLSource extends Component {
  constructor() {
    super();

    this.state = {
      url: '',
      error: ''
    };

    _.bindAll(this, ['onURLChange', 'onError', 'onStartImport']);
  }

  onURLChange(e) {
    this.setState({
      url: e.target.value
    });
  }

  onError({ reason, message }) {
    let fieldError;

    if (_.isString(reason)) {
      fieldError = reason;
    } else {
      const [urlError] = _.flatMap(reason, value => value);
      fieldError = urlError;
    }

    this.setState({
      error: fieldError || message || SubI18n.unknown_error
    });
  }

  onStartImport(e) {
    e.preventDefault();

    this.setState({
      error: ''
    });

    this.props.createURLSource(this.state.url).catch(this.onError);
  }

  render() {
    const { hrefExists } = this.props;

    if (hrefExists) {
      return <SourceMessage hrefExists={hrefExists} />;
    }

    const sourceType = {
      type: 'url',
      url: this.state.url
    };

    const callParams = {
      source_type: sourceType
    };

    return (
      <section className={styles.container}>
        <div className={styles.imageContainer}>
          <img
            alt="external source"
            className={styles.image}
            src="/images/datasetManagementUI/external-square.svg" />
        </div>
        <div className={styles.textContainer}>
          <div className={styles.content}>
            <h2>{SubI18n.title}</h2>
            <div className={styles.browseMsg}>{SubI18n.url_prompt}</div>
            <form>
              <TextInput
                name="import-url"
                handleChange={this.onURLChange}
                value={this.state.url}
                inErrorState={!!this.state.error} />
              <span className={styles.errorMessage}>{this.state.error}</span>
              <div className={styles.fileTypes}>
                {`${I18n.show_uploads.filetypes} ${enabledFileExtensions.map(formatExpanation).join(', ')}`}
              </div>
              <ApiCallButton
                onClick={this.onStartImport}
                operation={CREATE_SOURCE}
                callParams={callParams}
                className={styles.doImportButton}>
                {this.state.error ? SubI18n.retry : SubI18n.start_import}
              </ApiCallButton>
            </form>
          </div>
        </div>
      </section>
    );
  }
}

URLSource.propTypes = {
  createURLSource: PropTypes.func.isRequired,
  hrefExists: PropTypes.bool.isRequired
};

export default URLSource;
