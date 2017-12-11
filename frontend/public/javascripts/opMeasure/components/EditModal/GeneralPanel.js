import _ from 'lodash';
import classNames from 'classnames';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import I18n from 'common/i18n';

import { setDescription, setName, setShortName } from '../../actions/editor';
import {
  validateMeasureDescription,
  validateMeasureName,
  validateMeasureShortName
} from '../../actions/validate';

function t(subkey) {
  return I18n.t(`open_performance.measure.edit_modal.general_info.${subkey}`);
}

// Configuration panel for title and description.
export class GeneralPanel extends Component {
  render() {
    const {
      measure: {
        description,
        name,
        shortName
      },
      validationErrors,
      onBlurDescription,
      onBlurName,
      onBlurShortName,
      onChangeDescription,
      onChangeName,
      onChangeShortName
    } = this.props;

    const nameFieldProps = {
      className: classNames('text-input', {
        'text-input-error': validationErrors.measureName
      }),
      id: 'measure-name',
      maxLength: 254,
      minLength: 1,
      placeholder: t('name_placeholder'),
      size: 81, // aligns better with 80-col resizeable textarea
      type: 'text',
      value: name,
      onBlur: onBlurName,
      onChange: onChangeName
    };

    const shortNameFieldProps = {
      className: classNames('text-input', {
        'text-input-error': validationErrors.measureShortName
      }),
      id: 'measure-short-name',
      maxLength: 26,
      placeholder: t('short_name_placeholder'),
      size: 40, // aligns better with 80-col resizeable textarea
      type: 'text',
      value: shortName,
      onBlur: onBlurShortName,
      onChange: onChangeShortName
    };

    const descriptionFieldProps = {
      className: 'text-input text-area',
      cols: 80,
      id: 'measure-description',
      placeholder: t('description_placeholder'),
      rows: 5,
      value: description,
      onBlur: onBlurDescription,
      onChange: onChangeDescription
    };

    return (
      <div>
        <h3>{t('title')}</h3>

        <form onSubmit={(event) => event.preventDefault()}>
          <label htmlFor={nameFieldProps.id}>
            {t('name_label')}
            <span className="required-field-indicator" />
          </label>
          <span className="sublabel">{t('name_sublabel')}</span>
          <input {...nameFieldProps} />

          <label htmlFor={shortNameFieldProps.id}>{t('short_name_label')}</label>
          <span className="sublabel">{t('short_name_sublabel')}</span>
          <input {...shortNameFieldProps} />

          <label htmlFor={descriptionFieldProps.id}>{t('description_label')}</label>
          <textarea {...descriptionFieldProps} />
        </form>

        <p className="edit-metadata-link">
          <a href="./edit_metadata" target="_blank">
            {t('edit_metadata')}
            <span className="socrata-icon-preview" role="presentation" />
          </a>
        </p>
      </div>
    );
  }
}

GeneralPanel.propTypes = {
  measure: PropTypes.shape({
    description: PropTypes.string,
    name: PropTypes.string.isRequired,
    shortName: PropTypes.string
  }),
  validationErrors: PropTypes.object.isRequired,
  onBlurDescription: PropTypes.func.isRequired,
  onBlurName: PropTypes.func.isRequired,
  onBlurShortName: PropTypes.func.isRequired,
  onChangeDescription: PropTypes.func.isRequired,
  onChangeName: PropTypes.func.isRequired,
  onChangeShortName: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const measure = _.pick(state.editor.measure, ['description', 'name', 'shortName']);
  const validationErrors = state.editor.validationErrors;
  return { measure, validationErrors };
}

function mapDispatchToProps(dispatch) {
  const bindEventValue = (func) => (event) => func(event.currentTarget.value);

  return bindActionCreators({
    onBlurName: bindEventValue(validateMeasureName),
    onBlurShortName: bindEventValue(validateMeasureShortName),
    onBlurDescription: bindEventValue(validateMeasureDescription),
    onChangeDescription: bindEventValue(setDescription),
    onChangeName: bindEventValue(setName),
    onChangeShortName: bindEventValue(setShortName)
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(GeneralPanel);
