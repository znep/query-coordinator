import _ from 'lodash';
import $ from 'jquery';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import I18n from 'common/i18n';

import { setXAxisScalingMode, resetState } from '../actions';
import {
  getCurrentVif,
  getXAxisScalingMode,
  isTimelineChart,
  isInsertableVisualization,
  hasMadeChangesToVifs,
  isUserCurrentlyActive
} from '../selectors/vifAuthoring';

import CustomizationTabs from './CustomizationTabs';
import CustomizationTabPanes from './CustomizationTabPanes';
import VisualizationPreviewContainer from './VisualizationPreviewContainer';
import TableView from './TableView';
import DataPane from './panes/DataPane';
import PresentationPane from './panes/PresentationPane';
import AxisAndScalePane from './panes/AxisAndScalePane';
import LegendsAndFlyoutsPane from './panes/LegendsAndFlyoutsPane';
import VisualizationTypeSelector from './VisualizationTypeSelector';
import FilterBar from './FilterBar';

export class AuthoringWorkflow extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentTabSelection: 'authoring-data'
    }

    _.bindAll(this, [
      'onComplete',
      'confirmUserCanEscape',
      'onCancel',
      'onBack',
      'onTabNavigation',
      'scalingMode',
      'renderFilterBar',
      'renderBackButton',
      'renderResetButton'
    ]);
  }

  componentDidMount() {
    const modalElement = ReactDOM.findDOMNode(this.modal);
    // Prevents the form from submitting and refreshing the page.
    $(modalElement).on('submit', _.constant(false));
  }

  onComplete() {
    const { vifAuthoring, vif } = this.props;

    this.props.onComplete({
      vif,
      filters: vifAuthoring.authoring.filters
    });
  }

  confirmUserCanEscape() {
    const { vifAuthoring } = this.props;
    const message = I18n.t('shared.visualizations.modal.changes_made_confirmation');
    const changesMade = hasMadeChangesToVifs(vifAuthoring);
    return !changesMade || window.confirm(message);
  }

  onCancel() {
    const { onCancel } = this.props;

    if (this.confirmUserCanEscape()) {
      onCancel();
    }
  }

  onBack() {
    const { onBack } = this.props;

    if (this.confirmUserCanEscape()) {
      onBack();
    }
  }

  onTabNavigation(event) {
    const href = event.target.getAttribute('href');

    if (href) {
      event.preventDefault();
      this.setState({currentTabSelection: href.slice(1)});
    }
  }

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
            {I18n.t('shared.visualizations.panes.axis_and_scale.fields.x_axis_scaling_mode.title')}
          </label>
        </div>
      </form>
    );
  }

  renderFilterBar() {
    return this.props.enableFiltering ? <FilterBar /> : null;
  }

  renderBackButton() {
    const { backButtonText } = this.props;

      return _.isString(backButtonText) ? (
        <button className="authoring-back-button" onClick={this.onBack}>
          <span className="icon-arrow-left" />
          {backButtonText}
        </button>
      ) : null;
  }

  renderResetButton() {
    const { backButtonText, onReset } = this.props;
    const confirmDialog = () => {
      if(confirm(I18n.t('shared.visualizations.common.reset_confirm'))) {
        onReset();
      }
    };

    const className = classNames('authoring-reset-button', { 'with-back-button': _.isString(backButtonText) });

    return (
      <button className={className} onClick={confirmDialog}>
        <span className="icon-undo" />
        {I18n.t('shared.visualizations.common.reset_button_label')}
      </button>
    );
  }

  render() {
    const { metadata, vifAuthoring, backButtonText } = this.props;
    const isNotInsertable = !isInsertableVisualization(vifAuthoring) || isUserCurrentlyActive(vifAuthoring);
    const scalingMode = null; // This feature is hidden for now.
    const modalFooterActionsClassNames = classNames({
      'with-back-button': _.isString(backButtonText)
    });

    return (
      <Modal className="authoring-modal" fullScreen={true} onDismiss={this.onCancel} ref={(ref) => this.modal = ref}>
        <ModalHeader title={I18n.t('shared.visualizations.modal.title')} onDismiss={this.onCancel} />
        <ModalContent className="authoring-modal-content">
          {this.renderFilterBar()}

          <div className="authoring-controls">
            <div className="authoring-editor">
              <CustomizationTabs onTabNavigation={this.onTabNavigation} selection={this.state.currentTabSelection} tabs={this.props.tabs} />
              <CustomizationTabPanes selection={this.state.currentTabSelection} tabs={this.props.tabs} />
            </div>
            <div className="authoring-preview-container">
              <VisualizationTypeSelector/>
              <VisualizationPreviewContainer />
              <TableView />
              {scalingMode}
            </div>
          </div>
        </ModalContent>
        <ModalFooter className="authoring-modal-footer">
          <div className="authoring-footer-buttons">
            {this.renderBackButton()}
            {this.renderResetButton()}
          </div>
          <div className="authoring-actions">
            <button className="btn btn-sm btn-default cancel" onClick={this.onCancel}>{I18n.t('shared.visualizations.modal.close')}</button>
            <button className="btn btn-sm btn-primary done" onClick={this.onComplete} onKeyUp={this.onInsertKeyup} disabled={isNotInsertable}>{I18n.t('shared.visualizations.modal.insert')}</button>
          </div>
        </ModalFooter>
      </Modal>
    );
  }
}

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

AuthoringWorkflow.propTypes = {
  enableFiltering: PropTypes.bool,
  vif: PropTypes.object,
  onComplete: PropTypes.func,
  onBack: PropTypes.func,
  onReset: PropTypes.func,
  onCancel: PropTypes.func,
  tabs: PropTypes.array
};

AuthoringWorkflow.defaultProps = {
  enableFiltering: true,
  onComplete: _.noop,
  onBack: _.noop,
  onReset: _.noop,
  onCancel: _.noop,
  tabs: [
    {
      id: 'authoring-data',
      title: I18n.t('shared.visualizations.panes.data.title'),
      paneComponent: DataPane,
      icon: 'data'
    },
    {
      id: 'authoring-axis-and-scale',
      title: I18n.t('shared.visualizations.panes.axis_and_scale.title'),
      paneComponent: AxisAndScalePane,
      icon: 'axis-scale',
    },
    {
      id: 'authoring-colors-and-style',
      title: I18n.t('shared.visualizations.panes.presentation.title'),
      paneComponent: PresentationPane,
      icon: 'color'
    },
    {
      id: 'authoring-legends-and-flyouts',
      title: I18n.t('shared.visualizations.panes.legends_and_flyouts.title'),
      paneComponent: LegendsAndFlyoutsPane,
      icon: 'flyout-options'
    }
  ]
};

export default connect(mapStateToProps, mapDispatchToProps)(AuthoringWorkflow);
