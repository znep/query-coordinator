import PropTypes from 'prop-types';
import React, { Component } from 'react';
import styles from './ParseOptions.scss';
import Fieldset from 'components/Fieldset/Fieldset';
import GridPreview from './GridPreview';
import ParseOption from './ParseOption';
import _ from 'lodash';

const SubI18n = I18n.parse_options;

function parseOptionAsIntOrEmptyString(value) {
  if (value === '') return { ok: '' };

  const integer = parseInt(value, 10);
  if (_.isNaN(integer)) {
    return { error: { message: SubI18n.must_be_an_int, value } };
  }
  return { ok: integer };
}

class ParseOptions extends Component {
  constructor(props) {
    super(props);

    this.setOption = this.setOption.bind(this);
    this.getOption = this.getOption.bind(this);
    this.setHeaderCount = this.setHeaderCount.bind(this);
    this.setColumnHeader = this.setColumnHeader.bind(this);
  }

  getOption(option) {
    return this.props.form.parseOptions[option];
  }

  setError(name, reason) {
    this.props.setFormState({
      ...this.props.form,
      errors: {
        ...this.props.form.errors,
        [name]: reason
      }
    });
  }

  setOption(option) {
    return ({ target: { value } }) => {
      this._updateParseOptions({ [option]: value });
    };
  }

  setHeaderCount({ target: { value } }) {
    const headerCount = parseOptionAsIntOrEmptyString(value);
    if ('ok' in headerCount) {
      this._ensureColumnHeaderGteHeaderCount(
        headerCount.ok,
        this.props.form.parseOptions.column_header
      );
    } else {
      this.setError('header_count', headerCount.error);
    }
  }

  setColumnHeader({ target: { value } }) {
    const columnHeader = parseOptionAsIntOrEmptyString(value);
    if ('ok' in columnHeader) {
      this._ensureColumnHeaderGteHeaderCount(
        this.props.form.parseOptions.header_count,
        columnHeader.ok
      );
    } else {
      this.setError('column_header', columnHeader.error);
    }
  }

  _updateParseOptions(values) {
    this.props.setFormState({
      ...this.props.form,
      errors: {
        ..._.omit(this.props.form.errors, _.keys(values)) // clear the errors for the keys we're updating
      },
      parseOptions: {
        ...this.props.form.parseOptions,
        ...values // do the update
      }
    });
  }

  _ensureColumnHeaderGteHeaderCount(headerCount, columnHeader) {
    if (_.isNumber(headerCount) && _.isNumber(columnHeader) && headerCount < columnHeader) {
      return this.setError('header_count', {
        message: SubI18n.header_count_gt_error,
        value: headerCount
      });
    }
    this._updateParseOptions({
      column_header: columnHeader,
      header_count: headerCount
    });
  }


  clearError(name) {
    this.props.setFormState({
      ...this.props.form,
      errors: {
        ...this.props.form.errors,
        [name]: false
      }
    });
  }


  render() {
    const { form: { errors } } = this.props;

    return (
      <div className={styles.parseOptions}>
        <div className={styles.optionsPanes}>
          <div className={styles.optionsForm}>
            <form>
              <Fieldset
                title={"File Parsing Options"}
                subtitle={"Manage how your file will be interpreted"}>
                <ParseOption
                  name={'header_count'}
                  error={errors.header_count}
                  placeholder={SubI18n.header_count_must_be_gt_column_header}
                  getOption={this.getOption}
                  setOption={this.setHeaderCount} />
                <ParseOption
                  name={'column_header'}
                  error={errors.column_header}
                  getOption={this.getOption}
                  setOption={this.setColumnHeader} />
                <ParseOption
                  name={'column_separator'}
                  error={errors.column_separator}
                  getOption={this.getOption}
                  setOption={this.setOption('column_separator')} />
                <ParseOption
                  name={'encoding'}
                  error={errors.encoding}
                  placeholder={'Automatic'}
                  getOption={this.getOption}
                  setOption={this.setOption('encoding')} />
                <ParseOption
                  name={'quote_char'}
                  error={errors.quote_char}
                  getOption={this.getOption}
                  setOption={this.setOption('quote_char')} />
              </Fieldset>
            </form>
          </div>
          <div className={styles.optionsPreview}>
            <GridPreview parseOptions={this.props.form.parseOptions} />
          </div>
        </div>
      </div>
    );

  }
}

ParseOptions.propTypes = {
  form: PropTypes.object.isRequired,
  setFormState: PropTypes.func.isRequired
};

export default ParseOptions;
