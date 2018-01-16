import _ from 'lodash';
import $ from 'jquery';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import I18n from 'common/i18n';

import { resetState } from '../actions';
import {
  getCurrentVif,
  isTimelineChart,
  isInsertableVisualization,
  hasMadeChangesToVifs,
  isUserCurrentlyActive,
  isNewGLMap
} from '../selectors/vifAuthoring';

import CustomizationTabs from './CustomizationTabs';
import CustomizationTabPanes from './CustomizationTabPanes';
import VisualizationPreviewContainer from './VisualizationPreviewContainer';
import TableView from './TableView';
import DataPane from './panes/DataPane';
import PresentationPane from './panes/PresentationPane';
import AxisAndScalePane from './panes/AxisAndScalePane';
import BasemapPane from './panes/BasemapPane';
import LegendsAndFlyoutsPane from './panes/LegendsAndFlyoutsPane';
import VisualizationTypeSelector from './VisualizationTypeSelector';
import FilterBar from './FilterBar';

export class AuthoringWorkflow extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentTabSelection: 'authoring-data'
    };

    _.bindAll(this, [
      'onComplete',
      'confirmUserCanEscape',
      'onCancel',
      'onBack',
      'onTabNavigation',
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

  confirmUserCanEscape() { // eslint-disable-line react/sort-comp
    const { vifAuthoring } = this.props;
    const message = I18n.t('shared.visualizations.modal.changes_made_confirmation');
    const changesMade = hasMadeChangesToVifs(vifAuthoring);
    // eslint-disable-next-line no-alert
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
      this.setState({ currentTabSelection: href.slice(1) });
    }
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
      // eslint-disable-next-line no-alert
      if (confirm(I18n.t('shared.visualizations.common.reset_confirm'))) {
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
    const { metadata, vifAuthoring, backButtonText, tabs } = this.props;
    const isNotInsertable = !isInsertableVisualization(vifAuthoring) || isUserCurrentlyActive(vifAuthoring);
    const modalFooterActionsClassNames = classNames({
      'with-back-button': _.isString(backButtonText)
    });
    const tabToRemove = isNewGLMap(vifAuthoring) ? 'authoring-axis-and-scale' : 'authoring-basemap';
    const tabsToRender = _.reject(tabs, (tab) => { return tab.id === tabToRemove; });

    return (
      <Modal className="authoring-modal" fullScreen onDismiss={this.onCancel} ref={(ref) => this.modal = ref}>
        <ModalHeader title={I18n.t('shared.visualizations.modal.title')} onDismiss={this.onCancel} />
        <ModalContent className="authoring-modal-content">
          {this.renderFilterBar()}

          <div className="authoring-controls">
            <div className="authoring-editor">
              <CustomizationTabs onTabNavigation={this.onTabNavigation} selection={this.state.currentTabSelection} tabs={tabsToRender} />
              <CustomizationTabPanes selection={this.state.currentTabSelection} tabs={tabsToRender} />
            </div>
            <div className="authoring-preview-container">
              <VisualizationTypeSelector />
              <VisualizationPreviewContainer />
              <TableView />
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
      icon: 'axis-scale'
    },
    {
      id: 'authoring-basemap',
      title: I18n.t('shared.visualizations.panes.basemap.title'),
      paneComponent: BasemapPane,
      icon: 'region'
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
