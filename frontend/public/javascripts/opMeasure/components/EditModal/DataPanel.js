import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import I18n from 'common/i18n';
import { formatNumber } from 'common/js_utils';
import AssetSelector from 'common/components/AssetSelector';

import validateConfiguration from '../../lib/validateConfiguration';
import { changeDataSource, resetDataSource } from '../../actions/editor';

const i18nOptions = { scope: 'open_performance.measure.edit_modal.data_source' };

// Configuration panel for connecting a measure to a data source.
export class DataPanel extends Component {
  state = { loaded: false }

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
          {I18n.t('message_valid', _.merge({ rowCount: formatNumber(rowCount) }, i18nOptions))}
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
    if (errors.badDataSource) {
      errorMsg = I18n.t('message_not_synced_html', i18nOptions);
    } else if (errors.noDateColumn) {
      errorMsg = I18n.t('message_no_date_column', i18nOptions);
    }

    return (
      <div className="selected-dataset alert error">
        <p dangerouslySetInnerHTML={{ __html: errorMsg }} />
      </div>
    );
  }

  renderAssetSelector() {
    const assetSelectorProps = {
      baseFilters: {
        assetTypes: 'datasets',
        published: true
      },
      onAssetSelected: (assetData) => {
        const { measure, onChangeDataSource } = this.props;
        const { dataSourceLensUid } = measure || {};

        if (assetData.id !== dataSourceLensUid) {
          onChangeDataSource(assetData.id);
        }
      },
      resultsPerPage: 6,
      renderInModal: false
    };

    return <AssetSelector {...assetSelectorProps} />;
  }

  render() {
    const { errors, rowCount } = this.props;
    const hasError = _.includes(_.values(errors), true);

    return (
      <div>
        <h3>{I18n.t('title', i18nOptions)}</h3>
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
        {this.renderAssetSelector()}
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
    badDataSource: PropTypes.bool,
    noDateColumn: PropTypes.bool
  })
};

export function mapStateToProps(state) {
  const measure = _.get(state, 'editor.measure', {});
  const dataSourceName = _.get(state, 'editor.dataSourceView.name', '');
  const rowCount = _.get(state, 'editor.cachedRowCount');

  const validation = validateConfiguration(
    _.get(measure, 'metricConfig'),
    _.get(state, 'editor.dataSourceView'),
    _.get(state, 'editor.displayableFilterableColumns')
  );

  const { noDataSource, noDateColumn } = validation.dataSource;
  const badDataSource = noDataSource && !_.isNil(measure.dataSourceLensUid);

  return {
    measure,
    dataSourceName,
    rowCount,
    errors: { noDateColumn, badDataSource }
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onChangeDataSource: changeDataSource,
    onResetDataSource: resetDataSource
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DataPanel);
