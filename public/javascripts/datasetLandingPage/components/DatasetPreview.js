import _ from 'lodash';
import $ from 'jquery';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import SocrataVisualizations from 'socrata-visualizations';
import { emitMixpanelEvent } from '../actions/mixpanel';

export var DatasetPreview = React.createClass({
  propTypes: {
    onClickGrid: PropTypes.func,
    view: PropTypes.object.isRequired
  },

  getInitialState: function() {
    return {
      isLoading: true
    };
  },

  componentDidMount: function() {
    if (this.shouldRenderTable()) {
      this.initializeTable();
    }
  },

  componentWillUnmount: function() {
    if (this.shouldRenderTable()) {
      this.removeTable();
    }
  },

  getVif: function() {
    var { view } = this.props;

    return {
      configuration: {
        allowObeDataset: true,
        localization: {
          all_rows: I18n.dataset_preview.all_rows,
          previous: I18n.dataset_preview.previous,
          next: I18n.dataset_preview.next,
          no_rows: I18n.dataset_preview.no_rows,
          only_row: I18n.dataset_preview.only_rows,
          many_rows: I18n.dataset_preview.many_rows,
          latitude: I18n.dataset_preview.latitude,
          longitude: I18n.dataset_preview.longitude,
          no_column_description: I18n.dataset_preview.no_column_description,
          unable_to_render: I18n.dataset_preview.unable_to_render
        },
        order: view.sortOrder
      },
      datasetUid: view.id,
      domain: window.serverConfig.domain,
      filters: [],
      format: {
        type: 'visualization_interchange_format',
        version: 1
      },
      title: view.name,
      type: 'table',
      unit: {
        one: view.rowLabel,
        other: view.rowLabelMultiple
      }
    };
  },

  shouldRenderTable: function() {
    var { view } = this.props;

    return view.isTabular &&
      !_.isEmpty(view.columns) &&
      view.rowCount > 0 &&
      serverConfig.featureFlags.defaultToDatasetLandingPage;
  },

  initializeTable: function() {
    var self = this;
    var $table = $(this.table);
    var flyoutRenderer = new SocrataVisualizations.views.FlyoutRenderer();

    // Initialize the table
    $table.socrataTable(this.getVif());

    // Set up the relevant event listeners
    $table.on(
      'SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE',
      function() {
        self.setState({ isLoading: false });
      }
    );
    $table.on('SOCRATA_VISUALIZATION_TABLE_FLYOUT', function(event) {
      if (event.originalEvent.detail) {
        flyoutRenderer.render(event.originalEvent.detail);
      } else {
        flyoutRenderer.clear();
      }
    });
    $(window).resize(this.triggerInvalidateSize);

    // Store the table so we can clean up when unmounting
    this.$table = $table;
  },

  removeTable: function() {
    var { $table } = this;

    // Tell the table to self-destruct
    $table.trigger('SOCRATA_VISUALIZATION_DESTROY');

    // Remove the relevant event listeners
    $table.off('SOCRATA_VISUALIZATION_DATA_LOAD_COMPLETE');
    $table.off('SOCRATA_VISUALIZATION_TABLE_FLYOUT');
    $(window).off('resize', this.triggerInvalidateSize);
  },

  triggerInvalidateSize: function() {
    this.$table.trigger('SOCRATA_VISUALIZATION_INVALIDATE_SIZE');
  },

  renderLoadingSpinner: function() {
    if (this.state.isLoading) {
      return (
        <div className="desktop-spinner">
          <span className="spinner-default spinner-large" />
        </div>
      );
    }
  },

  render: function() {
    var { view, onClickGrid } = this.props;

    if (this.shouldRenderTable()) {
      return (
        <section className="landing-page-section dataset-preview">
          <div className="landing-page-header-wrapper">
            <h2 className="landing-page-section-header">
              {I18n.dataset_preview.title}
            </h2>
            <a
              href={view.gridUrl}
              className="btn btn-primary btn-sm grid"
              onClick={onClickGrid}
              target="_blank">
              {I18n.dataset_preview.grid_view_link}
              <span className="icon-external" />
            </a>
          </div>

          <div id="table-container" ref={(ref) => this.table = ref}>
            {this.renderLoadingSpinner()}
          </div>
        </section>
      );
    } else {
      return null;
    }
  }
});

function mapStateToProps(state) {
  return _.pick(state, 'view');
}

function mapDispatchToProps(dispatch) {
  return {
    onClickGrid: function() {
      var payload = {
        name: 'Navigated to Gridpage'
      };

      dispatch(emitMixpanelEvent(payload));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(DatasetPreview);
