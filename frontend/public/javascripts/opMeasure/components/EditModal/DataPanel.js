import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import classNames from 'classnames';

import I18n from 'common/i18n';
import { formatNumber } from 'common/js_utils';

import { setDataSource } from '../../actions/editor';

// Configuration panel for connecting a measure to a data source.
export class DataPanel extends Component {
  state = { loaded: false }

  componentDidMount() {
    // onDatasetSelected is the old asset selector's contract. Its argument is
    // a Dataset model from legacy JS, from which we extract the relevant info
    // before passing it on; in other words, this function is a boundary between
    // modern code and legacy code.
    this.iframe.onDatasetSelected = (dataset) => {
      const { uid, onChangeDataSource } = this.props;

      if (dataset.id !== uid) {
        onChangeDataSource(dataset.id);
      }
    };
  }

  componentWillUnmount() {
    delete this.iframe.onDatasetSelected;
  }

  scope = 'open_performance.measure.edit_modal.data_source'

  handleReset = (event) => {
    event.preventDefault();
    this.props.onChangeDataSource('');
  }

  renderResetLink() {
    return (
      <a href="#" onClick={this.handleReset}>{I18n.t('reset', { scope: this.scope })}</a>
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
            {I18n.t('selected_dataset_label', { scope: this.scope })}
          </span>
          <span className="selected-dataset-name selected-dataset-empty">
            {I18n.t('selected_dataset_placeholder', { scope: this.scope })}
          </span>
        </p>
        <p>{I18n.t('message_default', { scope: this.scope })}</p>
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
            {I18n.t('selected_dataset_label', { scope: this.scope })}
          </span>
          <span className="selected-dataset-name">
            {dataSourceName}
          </span>
        </p>
        <p>
          {I18n.t('message_valid', { scope: this.scope, rowCount: formatNumber(rowCount) })}
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
            {I18n.t('selected_dataset_label', { scope: this.scope })}
          </span>
          <span className="selected-dataset-name">
            {dataSourceName}
          </span>
        </p>
        <p>{I18n.t('message_empty', { scope: this.scope })} | {this.renderResetLink()}</p>
      </div>
    );
  }

  // Invalid state: dataset retrieval failed, rowCount === -1
  renderSelectionInvalidState() {
    const { uid } = this.props;
    return (
      <div className="selected-dataset alert error">
        <p>
          <span className="selected-dataset-label">
            {I18n.t('selected_dataset_label', { scope: this.scope })}
          </span>
          <span className="selected-dataset-name">
            {uid}
          </span>
        </p>
        <p>{I18n.t('message_invalid', { scope: this.scope })} | {this.renderResetLink()}</p>
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
          height="580px"
          onLoad={() => this.setState({ loaded: true })}
          ref={(el) => this.iframe = el} />
      </div>
    );
  }

  render() {
    const { rowCount } = this.props;

    return (
      <div>
        <h3>{I18n.t('title', { scope: this.scope })}</h3>
        <form onSubmit={(event) => event.preventDefault()}>
          {
            _.isUndefined(rowCount) &&
            this.renderSelectionDefaultState()
          }
          {
            _.isNull(rowCount) &&
            this.renderSelectionFetchingState()
          }
          {
            rowCount > 0 &&
            this.renderSelectionValidState()
          }
          {
            rowCount === 0 &&
            this.renderSelectionEmptyState()
          }
          {
            rowCount < 0 &&
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
  uid: PropTypes.string,
  onChangeDataSource: PropTypes.func
};

export function mapStateToProps(state) {
  const dataSourceConfig = _.get(state, 'editor.measure.metric.dataSource', {});
  const dataSourceName = _.get(state, 'editor.dataSourceViewMetadata.name', '');
  const rowCount = _.get(state, 'editor.cachedRowCount');

  return {
    ...dataSourceConfig,
    dataSourceName,
    rowCount
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onChangeDataSource: setDataSource
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DataPanel);
