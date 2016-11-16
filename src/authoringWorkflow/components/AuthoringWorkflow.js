import _ from 'lodash';
import $ from 'jquery';
import React from 'react';
import classNames from 'classnames';
import { connect } from 'react-redux';

import { translate } from '../../I18n';
import {
  setXAxisScalingMode,
  resetState
} from '../actions';

import {
  getCurrentVif,
  getXAxisScalingMode,
  isTimelineChart,
  isInsertableVisualization,
  hasMadeChangesToVifs
} from '../selectors/vifAuthoring';

import CustomizationTabs from './CustomizationTabs';
import CustomizationTabPanes from './CustomizationTabPanes';
import VisualizationPreview from './VisualizationPreview';
import TableView from './TableView';
import DataPane from './panes/DataPane';
import TitleAndDescriptionPane from './panes/TitleAndDescriptionPane';
import ColorsAndStylePane from './panes/ColorsAndStylePane';
import AxisAndScalePane from './panes/AxisAndScalePane';
import LegendsAndFlyoutsPane from './panes/LegendsAndFlyoutsPane';
import VisualizationTypeSelector from './VisualizationTypeSelector';
import FilterBar from './FilterBar';

export const AuthoringWorkflow = React.createClass({
  propTypes: {
    vif: React.PropTypes.object,
    onComplete: React.PropTypes.func,
    onBack: React.PropTypes.func,
    onReset: React.PropTypes.func,
    onCancel: React.PropTypes.func,
    tabs: React.PropTypes.array
  },

  getInitialState() {
    return {
      currentTabSelection: 'authoring-data'
    };
  },

  getDefaultProps() {
    return {
      onComplete: _.noop,
      onBack: _.noop,
      onReset: _.noop,
      onCancel: _.noop,
      tabs: [
        {
          id: 'authoring-data',
          title: translate('panes.data.title'),
          paneComponent: DataPane,
          icon: 'data'
        },
        {
          id: 'authoring-axis-and-scale',
          title: translate('panes.axis_and_scale.title'),
          paneComponent: AxisAndScalePane,
          icon: 'axis-scale',
        },
        {
          id: 'authoring-title-and-description',
          title: translate('panes.title_and_description.title'),
          paneComponent: TitleAndDescriptionPane,
          icon: 'text'
        },
        {
          id: 'authoring-colors-and-style',
          title: translate('panes.colors_and_style.title'),
          paneComponent: ColorsAndStylePane,
          icon: 'color'
        },
        {
          id: 'authoring-legends-and-flyouts',
          title: translate('panes.legends_and_flyouts.title'),
          paneComponent: LegendsAndFlyoutsPane,
          icon: 'flyout-options'
        }
      ]
    };
  },

  componentDidMount() {
    // Prevents the form from submitting and refreshing the page.
    $(this.modal).on('submit', _.constant(false));
  },

  createRollups(vif) {
    // TODO: Figure out how we can create rollups without direct access to soda
    // fountain.
    const rollupRequests = [ Promise.resolve(true) ];

    return Promise.all(rollupRequests);
  },

  onComplete() {
    const { vifAuthoring, vif } = this.props;

    if (isTimelineChart(vifAuthoring)) {

      this.createRollups(vif).
        then(() => {

            this.props.onComplete({
              vif
            });
          }
        );
        // TODO: Add error handling when we actually make external requests
        // to create rollups.
    } else {

      this.props.onComplete({
        vif
      });
    }
  },

  confirmUserCanEscape() {
    const { vifAuthoring } = this.props;
    const message = translate('modal.changes_made_confirmation');
    const changesMade = hasMadeChangesToVifs(vifAuthoring);
    return !changesMade || window.confirm(message);
  },

  onCancel() {
    const { onCancel } = this.props;

    if (this.confirmUserCanEscape()) {
      onCancel();
    }
  },

  onBack() {
    const { onBack } = this.props;

    if (this.confirmUserCanEscape()) {
      onBack();
    }
  },

  onTabNavigation(event) {
    const href = event.target.getAttribute('href');

    if (href) {
      event.preventDefault();
      this.setState({currentTabSelection: href.slice(1)});
    }
  },

  scalingMode() {
    const checkboxAttributes = {
      type: 'checkbox',
      onChange: this.props.onChangeXAxisScalingMode,
      checked: getXAxisScalingMode(this.props.vifAuthoring) === 'fit',
      id: 'x-axis-scaling-mode'
    };

    return (
      <form className="x-axis-scaling-mode-container">
        <div className="checkbox">
          <input {...checkboxAttributes} />
          <label htmlFor="x-axis-scaling-mode">
            <span className="fake-checkbox">
              <span className="icon-checkmark3"></span>
            </span>
            {translate('panes.axis_and_scale.fields.x_axis_scaling_mode.title')}
          </label>
        </div>
      </form>
    );
  },

  renderBackButton() {
    const { backButtonText } = this.props;

      return _.isString(backButtonText) ? (
        <button className="authoring-back-button" onClick={this.onBack}>
          <span className="icon-arrow-left" />
          {backButtonText}
        </button>
      ) : null;
  },

  renderResetButton() {
    const { backButtonText, onReset } = this.props;
    const confirmDialog = () => {
      if(confirm(translate('common.reset_confirm'))) {
        onReset();
      }
    };

    const className = classNames('authoring-reset-button', { 'with-back-button': _.isString(backButtonText) });

    return (
      <button className={className} onClick={confirmDialog}>
        <span className="icon-undo" />
        {translate('common.reset_button_label')}
      </button>
    );
  },

  render() {
    const { metadata, vifAuthoring, backButtonText } = this.props;
    const isNotInsertable = !isInsertableVisualization(vifAuthoring);
    const scalingMode = null; // This feature is hidden for now.
    const modalFooterActionsClassNames = classNames('modal-footer-actions', {
      'with-back-button': _.isString(backButtonText)
    });

    return (
      <div className="authoring-modal modal modal-full modal-overlay" onKeyUp={this.onKeyUp} ref={(ref) => this.modal = ref}>
        <div className="modal-container">

          <header className="modal-header">
            <h5 className="modal-header-title">{translate('modal.title')}</h5>
            <button className="btn btn-transparent modal-header-dismiss" onClick={this.onCancel}>
              <span className="icon-close-2"></span>
            </button>
          </header>

          <section className="authoring-modal-content modal-content">
            <FilterBar />

            <div className="authoring-controls">
              <div className="authoring-editor">
                <CustomizationTabs onTabNavigation={this.onTabNavigation} selection={this.state.currentTabSelection} tabs={this.props.tabs} />
                <CustomizationTabPanes selection={this.state.currentTabSelection} tabs={this.props.tabs} />
              </div>
              <div className="authoring-preview-container">
                <VisualizationTypeSelector/>
                <VisualizationPreview />
                <TableView />
                {scalingMode}
              </div>
            </div>
          </section>

          <footer className="modal-footer authoring-modal-footer">
            <div className={modalFooterActionsClassNames}>
              <div className="authoring-footer-buttons">
                {this.renderBackButton()}
                {this.renderResetButton()}
              </div>
              <div className="authoring-actions">
                <button className="btn btn-sm btn-default cancel" onClick={this.onCancel}>{translate('modal.close')}</button>
                <button className="btn btn-sm btn-primary done" onClick={this.onComplete} disabled={isNotInsertable}>{translate('modal.insert')}</button>
              </div>
            </div>
          </footer>
        </div>
      </div>
    );
  }
});

function mapStateToProps(state) {
  return {
    vif: getCurrentVif(state.vifAuthoring),
    vifAuthoring: state.vifAuthoring,
    metadata: state.metadata
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onChangeXAxisScalingMode(event) {
      const xAxisScalingMode = event.target.checked;
      dispatch(setXAxisScalingMode(xAxisScalingMode));
    },
    onReset: () => dispatch(resetState())
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AuthoringWorkflow);
