import _ from 'lodash';
import $ from 'jquery';
import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import { emitMixpanelEvent } from '../actions/mixpanel';
import { isUserRoled } from '../../common/user';

export class DatasetPreview extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true
    };

    _.bindAll(this, 'triggerInvalidateSize');
  }

  componentDidMount() {
    if (this.shouldRenderTable()) {
      this.initializeTable();
    }
  }

  componentWillUnmount() {
    if (this.shouldRenderTable()) {
      this.removeTable();
    }
  }

  getVif() {
    const { view } = this.props;

    return {
      configuration: {
        order: view.sortOrder,
        viewSourceDataLink: false
      },
      datasetUid: view.id,
      domain: window.serverConfig.domain,
      filters: [],
      format: {
        type: 'visualization_interchange_format',
        version: 1
      },
      type: 'table',
      unit: {
        one: view.rowLabel,
        other: view.rowLabelMultiple
      }
    };
  }

  shouldRenderTable() {
    const { view } = this.props;

    return view.isTabular &&
      !_.isEmpty(view.columns) &&
      view.rowCount > 0;
  }

  initializeTable() {
    const $table = $(this.table);

    require.ensure(['socrata-visualizations'], (require) => {
      const SocrataVisualizations = require('socrata-visualizations');
      const flyoutRenderer = new SocrataVisualizations.views.FlyoutRenderer();

      // Initialize the table
      $table.socrataTable(this.getVif());

      // Set up the relevant event listeners
      $table.on('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE', () => {
        this.setState({ isLoading: false });
      });
      $table.on('SOCRATA_VISUALIZATION_TABLE_FLYOUT', (event) => {
        if (event.originalEvent.detail) {
          flyoutRenderer.render(event.originalEvent.detail);
        } else {
          flyoutRenderer.clear();
        }
      });
      $(window).resize(this.triggerInvalidateSize);

      // Store the table so we can clean up when unmounting
      this.$table = $table;
    }, 'socrata-visualizations');
  }

  removeTable() {
    const { $table } = this;

    // Tell the table to self-destruct
    $table.trigger('SOCRATA_VISUALIZATION_DESTROY');

    // Remove the relevant event listeners
    $table.off('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE');
    $table.off('SOCRATA_VISUALIZATION_TABLE_FLYOUT');
    $(window).off('resize', this.triggerInvalidateSize);
  }

  triggerInvalidateSize() {
    this.$table.trigger('SOCRATA_VISUALIZATION_INVALIDATE_SIZE');
  }

  renderLoadingSpinner() {
    if (this.state.isLoading) {
      return (
        <div className="table-spinner">
          <span className="spinner-default spinner-large" />
        </div>
      );
    }
  }

  renderActionButton() {
    const { view, onClickGrid } = this.props;

    const { enableVisualizationCanvas } = serverConfig.featureFlags;
    const canCreateVisualizationCanvas = enableVisualizationCanvas &&
      isUserRoled() &&
      _.isString(view.bootstrapUrl);

    if (canCreateVisualizationCanvas) {
      return (
        <a href={view.bootstrapUrl} className="btn btn-primary btn-sm btn-visualize">
          {I18n.dataset_preview.visualize_link}
        </a>
      );
    } else {
      return (
        <a
          href={view.gridUrl}
          className="btn btn-primary btn-sm btn-grid"
          onClick={onClickGrid}>
          {I18n.dataset_preview.grid_view_link}
          <span className="icon-external" />
        </a>
      );
    }
  }

  render() {
    if (this.shouldRenderTable()) {
      return (
        <section className="landing-page-section dataset-preview">
          <div className="landing-page-header-wrapper">
            <h2 className="landing-page-section-header">
              {I18n.dataset_preview.title}
            </h2>
            {this.renderActionButton()}
          </div>

          <div className="table-contents">
            {this.renderLoadingSpinner()}

            <div id="table-container" ref={(ref) => this.table = ref} />
          </div>
        </section>
      );
    } else {
      return null;
    }
  }
}

DatasetPreview.propTypes = {
  onClickGrid: PropTypes.func,
  view: PropTypes.object.isRequired
};

function mapStateToProps(state) {
  return _.pick(state, 'view');
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
