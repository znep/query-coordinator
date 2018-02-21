import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { localizedConnect, I18nPropType } from 'common/connectUtils';

import has from 'lodash/fp/has';
import isEmpty from 'lodash/fp/isEmpty';

class ErrorList extends Component {
  static propTypes = {
    I18n: I18nPropType.isRequired,
    errors: PropTypes.array
  };

  renderError = (error, key) => {
    const { I18n } = this.props;
    if (has('translationKey', error)) {
      const translationKey = error.translationKey;
      const message = I18n.t(translationKey, error);
      if (translationKey.endsWith('_html')) {
        return <li dangerouslySetInnerHTML={{ __html: message }} key={key} />;
      } else {
        return <li key={key}>{message}</li>;
      }
    } else {
      return <li key={key}>{error}</li>;
    }
  };

  render() {
    const { errors } = this.props;

    if (isEmpty(errors)) {
      return null;
    }

    return (
      <div className="alert error">
        <ul className="alert-list">{errors.map(this.renderError)}</ul>
      </div>
    );
  }
}

export default localizedConnect(ErrorList);
