import _ from 'lodash';
import React, { Component, PropTypes } from 'react';
import { ModalHeader, ModalContent, ModalFooter } from 'common/components';
import FormatPreview from './FormatPreview';
import TextColumnFormat from './TextColumnFormat';
import NumberColumnFormat from './NumberColumnFormat';
import DatetimeColumnFormat from './DatetimeColumnFormat';
import styles from './FormatColumn.scss';

const SubI18n = I18n.format_column;

class FormatColumn extends Component {
  constructor() {
    super();
    this.state = {
      format: {}
    };
    _.bindAll(this, ['onUpdateFormat', 'onRemoveFormat']);
  }
  componentWillMount() {
    this.setState({
      format: this.props.column.format || {} // hack until dsmapi fills in true defaults,
    });
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

  render() {
    const { onDismiss, onSave, column } = this.props;
    const { format } = this.state;
    const headerProps = {
      title: SubI18n.title.format({ name: column.display_name }),
      onDismiss
    };

    const formatter = this.getFormatter(column, format);

    return (
      <div className={styles.formatColumn}>
        <ModalHeader {...headerProps} />
        <ModalContent>
          <div className={styles.formatContent}>
            <div className={styles.formatter}>
              {formatter}
            </div>
            <div className={styles.previewer}>
              <FormatPreview {...this.props} format={format} />
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <button
            className="btn btn-default"
            onClick={onDismiss}>
            {I18n.common.cancel}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onSave(format)}>
            {I18n.common.save}
          </button>
        </ModalFooter>
      </div>
    );

  }
}

FormatColumn.propTypes = {
  outputSchema: PropTypes.object.isRequired,
  column: PropTypes.object.isRequired,
  onDismiss: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  entities: PropTypes.object.isRequired,
  inputSchema: PropTypes.object.isRequired
};

export default FormatColumn;