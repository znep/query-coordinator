import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { components as SocrataVisualizations } from 'common/visualizations';
import { emitMixpanelEvent } from '../actions/mixpanel';
import { localizeLink } from 'common/locale';

export class DatasetPreview extends Component {
  renderActionButton() {
    const { view, onClickGrid } = this.props;

    let createVisualizationLink = null;

    if (_.isString(view.bootstrapUrl)) {
      createVisualizationLink = (
        <a href={view.bootstrapUrl} className="btn btn-default btn-sm btn-visualize">
          {I18n.dataset_preview.create_visualization_link}
        </a>
      );
    }

    return (
      <div>
        <a
          href={localizeLink(view.gridUrl)}
          className="btn btn-primary btn-sm btn-grid view-data"
          onClick={onClickGrid}>
          {I18n.dataset_preview.grid_view_link}
        </a>
        {createVisualizationLink}
      </div>
    );
  }

  renderTable() {
    const { vif } = this.props;
    // This is a temporary way to pass localization information to frontend-visualizations
    // to localize the Table & Pager until the mono-repo is complete.
    const options = _.has(window, 'serverConfig.locale') ?
      { locale: window.serverConfig.locale } :
      { locale: '' };
    return (
      <div className="table-contents" itemScope itemType="http://schema.org/Dataset">
        <SocrataVisualizations.Visualization vif={vif} options={options} />
      </div>
    );
  }

  render() {
    const { view } = this.props;

    const shouldRenderTable = view.isTabular &&
      !_.isEmpty(view.columns) &&
      view.rowCount > 0;

    if (shouldRenderTable) {
      return (
        <section className="landing-page-section dataset-preview">
          <div className="landing-page-header-wrapper">
            <h2 className="landing-page-section-header">
              {I18n.dataset_preview.title}
            </h2>
            {this.renderActionButton()}
          </div>
          {this.renderTable()}
        </section>
      );
    } else {
      return null;
    }
  }
}

DatasetPreview.propTypes = {
  onClickGrid: PropTypes.func,
  view: PropTypes.object.isRequired,
  vif: PropTypes.object.isRequired
};

function mapStateToProps({ view }) {
  return {
    view,
    vif: {
      format: {
        type: 'visualization_interchange_format',
        version: 2
      },
      configuration: {
        viewSourceDataLink: false
      },
      series: [
        {
          dataSource: {
            datasetUid: view.id,
            dimension: {},
            domain: window.serverConfig.domain,
            type: 'socrata.soql',
            filters: [],

            // In most contexts, visualizations (including the table) will read from the NBE.
            // However, we have a product requirement here to display the OBE data directly
            // (to avoid confusing the user with mismatches in the column count and types
            // introduced by the obe -> nbe migration).
            readFromNbe: false
          },
          type: 'table',
          unit: {
            one: view.rowLabel,
            other: view.rowLabelMultiple
          }
        }
      ]
    }
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onClickGrid() {
      const payload = {
        name: 'Navigated to Gridpage'
      };

      dispatch(emitMixpanelEvent(payload));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DatasetPreview);
