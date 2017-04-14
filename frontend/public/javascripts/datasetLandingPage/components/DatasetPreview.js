import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import { components as SocrataVisualizations } from 'socrata-visualizations';
import { emitMixpanelEvent } from '../actions/mixpanel';
import { isUserRoled } from '../../common/user';
import { localizeLink } from '../../common/locale';

export class DatasetPreview extends Component {
  renderActionButton() {
    const { view, onClickGrid } = this.props;

    const { enableVisualizationCanvas } = serverConfig.featureFlags;
    const canCreateVisualizationCanvas = enableVisualizationCanvas &&
      isUserRoled() &&
      _.isString(view.bootstrapUrl);

    if (canCreateVisualizationCanvas) {
      return (
        <a href={localizeLink(view.bootstrapUrl)} className="btn btn-primary btn-sm btn-visualize">
          {I18n.dataset_preview.visualize_link}
        </a>
      );
    } else {
      return (
        <a
          href={localizeLink(view.gridUrl)}
          className="btn btn-primary btn-sm btn-grid"
          onClick={onClickGrid}>
          {I18n.dataset_preview.grid_view_link}
          <span className="icon-external" />
        </a>
      );
    }
  }

  renderTable() {
    const { vif } = this.props;
    // This is a temporary way to pass localization information to frontend-visualizations
    // to localize the Table & Pager until the mono-repo is complete.
    const options = _.has(window, 'serverConfig.locale') ?
      { locale: window.serverConfig.locale } :
      { locale: '' };
    return (
      <div className="table-contents">
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
        order: view.sortOrder,
        viewSourceDataLink: false
      },
      series: [
        {
          dataSource: {
            datasetUid: view.id,
            dimension: {},
            domain: window.serverConfig.domain,
            type: 'socrata.soql',
            filters: []
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
