/* eslint react/jsx-indent: 0 */
import _ from 'lodash';
import ApiCallButton from 'containers/ApiCallButtonContainer';
import PropTypes from 'prop-types';
import FlashMessage from 'containers/FlashMessageContainer';
import React, { Component } from 'react';
import { ModalHeader, ModalContent, ModalFooter } from 'common/components';
import styles from './ImportFromURL.scss';
import TextInput from 'components/TextInput/TextInput';
import * as Actions from 'reduxStuff/actions/manageUploads';

const SubI18n = I18n.import_from_url;

class ImportFromURL extends Component {
  constructor() {
    super();

    this.state = {
      url: ''
    };

    _.bindAll(this, ['onURLChanged', 'onError']);
  }

  onURLChanged(e) {
    this.setState({
      url: e.target.value
    });
  }

  onError({ body: { reason, message } }) {
    let fieldError;
    if (_.isString(reason)) {
      fieldError = reason;
    } else {
      const [urlError] = _.flatMap(reason, (value) => value);
      fieldError = urlError;
    }
    this.props.showError(fieldError || message || SubI18n.unknown_error);
  }

  render() {
    const { createURLSource, onDismiss, params } = this.props;

    const headerProps = {
      title: SubI18n.title,
      onDismiss: onDismiss
    };

    const sourceType = {
      type: 'url',
      url: this.state.url
    };

    const callParams = {
      source_type: sourceType
    };

    const doImport = () => (createURLSource(sourceType, params)
      .then(onDismiss)
      .catch(this.onError));

    return (
      <div>
        <ModalHeader {...headerProps} />
        <ModalContent className={styles.modalContent}>
          <FlashMessage />
          <form>
            <label htmlFor="import-url">
              {SubI18n.url_prompt}
            </label>
            <TextInput
              handleChange={this.onURLChanged}
              value={this.state.url}
              inErrorState={false}
              name="import-url" />
          </form>
        </ModalContent>
        <ModalFooter className={styles.modalFooter}>
          <ApiCallButton
            onClick={doImport}
            operation={Actions.CREATE_UPLOAD}
            callParams={callParams}
            className={styles.doImportButton}>
            {SubI18n.start_import}
          </ApiCallButton>
        </ModalFooter>
      </div>
    );
  }
}

ImportFromURL.propTypes = {
  createURLSource: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
  showError: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired
};

export default ImportFromURL;
