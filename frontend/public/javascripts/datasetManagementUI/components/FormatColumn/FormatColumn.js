import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ModalHeader, ModalContent, ModalFooter } from 'common/components';
import FormatPreview from './FormatPreview';
import TextColumnFormat from './TextColumnFormat';
import NumberColumnFormat from './NumberColumnFormat';
import DatetimeColumnFormat from './DatetimeColumnFormat';
import styles from './FormatColumn.module.scss';

const SubI18n = I18n.format_column;

class FormatColumn extends Component {
  constructor() {
    super();
    this.state = {
      format: {}
    };
    _.bindAll(this, ['onUpdateFormat', 'onRemoveFormat', 'captureEscKey']);
  }

  componentWillMount() {
    if (!this.props.outputColumn) {
      return;
    }

    this.setState({
      format: this.props.outputColumn.format || {} // hack until dsmapi fills in true defaults,
    });
  }

  componentDidMount() {
    document.addEventListener('keyup', this.captureEscKey, true);
  }

  componentWillUnmount() {
    document.removeEventListener('keyup', this.captureEscKey, true);
  }

  onUpdateFormat(change) {
    this.setState({
      format: {
        ...this.state.format,
        ...change
      }
    });
  }

  onRemoveFormat(key) {
    this.setState({
      format: _.omit(this.state.format, [key])
    });
  }

  getFormatter(column, format) {
    switch (column.transform.output_soql_type) {
      case 'number':
        return (
          <NumberColumnFormat
            format={format}
            onRemoveFormat={this.onRemoveFormat}
            onUpdateFormat={this.onUpdateFormat} />
        );
      case 'calendar_date':
        return (
          <DatetimeColumnFormat
            format={format}
            onUpdateFormat={this.onUpdateFormat}
            onRemoveFormat={this.onRemoveFormat} />
        );
      default:
        // default is to allow anything to formatted
        // with text formatting rules
        return (
          <TextColumnFormat
            format={format}
            onRemoveFormat={this.onRemoveFormat}
            onUpdateFormat={this.onUpdateFormat} />
        );
    }
  }

  captureEscKey(event) {
    const { onDismiss } = this.props;
    const escapeKeyCode = 27;
    if (event.keyCode === escapeKeyCode) {
      // we need to stop the event from propagating so that the parent modal doesn't also close
      event.stopPropagation();
      onDismiss();
    }
  }

  render() {
    const { onDismiss, onSave, outputColumn } = this.props;
    const { format } = this.state;
    const headerProps = {
      title: SubI18n.title.format({ name: outputColumn.display_name }),
      onDismiss
    };

    const formatter = this.getFormatter(outputColumn, format);

    return (
      <div className={styles.formatColumn}>
        <ModalHeader {...headerProps} />
        <ModalContent>
          <div className={styles.formatContent}>
            <div className={styles.formatter}>{formatter}</div>
            <div className={styles.previewer}>
              <FormatPreview {...this.props} format={format} />
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <button className="btn btn-default" onClick={onDismiss}>
            {I18n.common.cancel}
          </button>
          <button className="btn btn-primary" onClick={() => onSave(format)}>
            {I18n.common.save}
          </button>
        </ModalFooter>
      </div>
    );
  }
}

FormatColumn.propTypes = {
  outputSchema: PropTypes.object.isRequired,
  outputColumn: PropTypes.object.isRequired,
  onDismiss: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  entities: PropTypes.object.isRequired,
  inputSchema: PropTypes.object.isRequired
};

export default FormatColumn;
