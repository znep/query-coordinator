import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import I18n from 'common/i18n';

import styles from '../index.module.scss';

/**
 AdvancedAlert => Alert created by giving the entire soql query (rather than constructing
 the soql query for the alert using form fields). Used for creating/editing a AdvancedAlert.
 @prop rawSoqlQuery - alert query string
 @prop onRawSoqlQueryChange - trigger when alert query change
*/
class AdvancedAlert extends Component {
  translationScope = 'shared.components.create_alert_modal.advance_search';

  render() {
    const { onRawSoqlQueryChange, rawSoqlQuery } = this.props;
    const alertTitle = I18n.t('alert_title', { scope: this.translationScope });
    const description = I18n.t('description', { scope: this.translationScope });

    return (
      <div styleName="advance-alert-section" className="advance-alert">
        <div styleName="advance-alert-content">
          <div styleName="advance-alert-title">{alertTitle}</div>
          <div styleName="advance-alert-description">{description}</div>
        </div>

        <div>
          <label styleName="raw-query-title" htmlFor="alert-raw-query">
            {I18n.t('text_box_description', { scope: this.translationScope })}
          </label>
          <textarea
            id="alert-raw-query"
            value={rawSoqlQuery}
            onChange={onRawSoqlQueryChange} />
        </div>
      </div>
    );
  }
}

AdvancedAlert.defaultProps = {
  rawSoqlQuery: ''
};

AdvancedAlert.propTypes = {
  rawSoqlQuery: PropTypes.string,
  onRawSoqlQueryChange: PropTypes.func.isRequired
};

export default cssModules(AdvancedAlert, styles, { allowMultiple: true });
