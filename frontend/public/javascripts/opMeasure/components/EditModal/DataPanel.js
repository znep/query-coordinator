import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';

import I18n from 'common/i18n';
import { formatNumber } from 'common/js_utils';

import { changeDataSource, resetDataSource } from '../../actions/editor';

const i18nOptions = { scope: 'open_performance.measure.edit_modal.data_source' };

// Configuration panel for connecting a measure to a data source.
export class DataPanel extends Component {
  state = { loaded: false }


  componentDidMount() {
    // onDatasetSelected is the old asset selector's contract. Its argument is
    // a Dataset model from legacy JS, from which we extract the relevant info
    // before passing it on; in other words, this function is a boundary between
    // modern code and legacy code.
    this.iframe.onDatasetSelected = (dataset) => {
      const { measure, onChangeDataSource } = this.props;
      const { dataSourceLensUid } = measure || {};

      if (dataset.id !== dataSourceLensUid) {
        onChangeDataSource(dataset.id);
      }
    };
  }

  componentWillUnmount() {
    delete this.iframe.onDatasetSelected;
  }


  handleReset = (event) => {
    event.preventDefault();
    this.props.onResetDataSource();
  }

  renderResetLink() {
    return (
      <a href="#" onClick={this.handleReset}>{I18n.t('reset', i18nOptions)}</a>
    );
  }

  // Default state: no dataset selected, rowCount = undefined
  renderSelectionDefaultState() {
    const { rowCount } = this.props;
    if (!_.isUndefined(rowCount)) {
      return null;
    }

    return (
      <div className="selected-dataset alert">
        <p>
          <span className="selected-dataset-label">
            {I18n.t('selected_dataset_label', i18nOptions)}
          </span>
          <span className="selected-dataset-name selected-dataset-empty">
            {I18n.t('selected_dataset_placeholder', i18nOptions)}
          </span>
        </p>
        <p>{I18n.t('message_default', i18nOptions)}</p>
      </div>
    );
  }

  // Fetching state: dataset selected but not yet retrieved, rowCount = null
  renderSelectionFetchingState() {
    return (
      <div className="selected-dataset alert">
        <span className="spinner-default" />
      </div>
    );
  }

  // Valid state: dataset retrieved, rowCount > 0
  renderSelectionValidState() {
    const { dataSourceName, rowCount } = this.props;

    return (
      <div className="selected-dataset alert success">
        <p>
          <span className="selected-dataset-label">
            {I18n.t('selected_dataset_label', i18nOptions)}
          </span>
          <span className="selected-dataset-name">
            {dataSourceName}
          </span>
        </p>
        <p>
          {I18n.t('message_valid', _.merge(i18nOptions, { rowCount: formatNumber(rowCount) }))}
          {' | '}
          {this.renderResetLink()}
        </p>
      </div>
    );
  }

  // Empty state: dataset retrieved, rowCount === 0
  renderSelectionEmptyState() {
    const { dataSourceName } = this.props;
    return (
      <div className="selected-dataset alert warning">
        <p>
          <span className="selected-dataset-label">
            {I18n.t('selected_dataset_label', i18nOptions)}
          </span>
          <span className="selected-dataset-name">
            {dataSourceName}
          </span>
        </p>
        <p>{I18n.t('message_empty', i18nOptions)} | {this.renderResetLink()}</p>
      </div>
    );
  }

  // Invalid state: dataset retrieval failed, or missing date column
  renderSelectionInvalidState() {
    const { errors } = this.props;

    let errorMsg;
    if (errors.fetchDataSourceViewError) {
      errorMsg = I18n.t('message_invalid', i18nOptions);
    }
    if (errors.setDataSourceMetadataError) {
      errorMsg = I18n.t('message_no_date_column', i18nOptions);
    }

    return (
      <div className="selected-dataset alert error">
        <p>{errorMsg}</p>
      </div>
    );
  }

  renderIframe() {
    const iframePath = '/browse/select_dataset?suppressed_facets[]=type&limitTo=tables';

    const containerClasses = classNames('dataset-picker', {
      loaded: this.state.loaded
    });

    return (
      <div className={containerClasses}>
        <div className="spinner-default spinner-large" />
        <iframe
          src={iframePath}
          width="100%"
          height="600px"
          onLoad={() => this.setState({ loaded: true })}
          ref={(el) => this.iframe = el} />
      </div>
    );
  }

  render() {
    const { errors, rowCount } = this.props;
    const hasError = _.includes(_.values(errors), true);

    return (
      <div>
        <h3>{I18n.t('title', i18nOptions)}</h3>
        <form onSubmit={(event) => event.preventDefault()}>
          {
            (!hasError && _.isUndefined(rowCount)) &&
            this.renderSelectionDefaultState()
          }
          {
            (!hasError && _.isNull(rowCount)) &&
            this.renderSelectionFetchingState()
          }
          {
            (!hasError && rowCount > 0) &&
            this.renderSelectionValidState()
          }
          {
            (!hasError && rowCount === 0) &&
            this.renderSelectionEmptyState()
          }
          {
            (hasError) &&
            this.renderSelectionInvalidState()
          }
          {this.renderIframe()}
        </form>
      </div>
    );
  }
}

DataPanel.propTypes = {
  dataSourceName: PropTypes.string,
  rowCount: PropTypes.number,
  measure: PropTypes.shape({
    dataSourceLensUid: PropTypes.string
  }),
  onChangeDataSource: PropTypes.func,
  onResetDataSource: PropTypes.func,
  errors: PropTypes.shape({
    fetchDataSourceViewError: PropTypes.bool,
    setDataSourceMetadataError: PropTypes.bool
  })
};

export function mapStateToProps(state) {
  const measure = _.get(state, 'editor.measure', {});
  const dataSourceName = _.get(state, 'editor.dataSourceView.name', '');
  const rowCount = _.get(state, 'editor.cachedRowCount');
  const errors = _.get(state, 'editor.errors', {});

  return {
    measure,
    dataSourceName,
    rowCount,
    errors
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onChangeDataSource: changeDataSource,
    onResetDataSource: resetDataSource
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DataPanel);
