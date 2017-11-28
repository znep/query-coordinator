import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import I18n from 'common/i18n';

import { cancelEditModal, acceptEditModalChanges } from '../../actions/editor';
import EditModalTab from './EditModalTab';
import EditModalPanel from './EditModalPanel';
import GeneralPanel from './GeneralPanel';
import DataPanel from './DataPanel';
import MethodsPanel from './MethodsPanel';
import CalculationPanel from './CalculationPanel';
import ReportingPeriodPanel from './ReportingPeriodPanel';

// Modal for editing several aspects of the measure, grouped into tabs/panels.
export class EditModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedTab: 'general-info'
    };

    _.bindAll(this, [
      'onCancel',
      'onComplete',
      'onTabNavigation',
      'renderTabList',
      'renderPanels'
    ]);
  }

  onCancel() {
    // TODO: Add confirm dialog on unsaved changes
    this.props.onCancel();
  }

  onComplete() {
    // TODO: What else needs to happen here?
    this.props.onComplete(this.props.measure);
  }

  onTabNavigation(tabID) {
    this.setState({
      selectedTab: tabID
    });
  }

  renderTabList() {
    const renderTab = (tab) => {
      const tabAttributes = _.extend(tab, {
        key: tab.id,
        isSelected: tab.id === this.state.selectedTab,
        onTabNavigation: () => this.onTabNavigation(tab.id)
      });

      return <EditModalTab {...tabAttributes} />;
    };

    return (
      <ul role="tablist" className="nav-tabs measure-edit-modal-tabs">
        {_.map(this.props.tabs, renderTab)}
      </ul>
    );
  }

  renderPanels() {
    const renderPanel = (tab) => {
      const panelAttributes = _.extend(tab, {
        key: tab.id,
        isSelected: tab.id === this.state.selectedTab
      });

      return (
        <EditModalPanel {...panelAttributes}>
          <tab.panelComponent />
        </EditModalPanel>
      );
    };

    return (
      <div className="measure-edit-modal-panels">
        {_.map(this.props.tabs, renderPanel)}
      </div>
    );
  }

  render() {
    if (!this.props.isEditing) {
      return null;
    }

    return (
      <Modal className="measure-edit-modal" fullScreen onDismiss={this.onCancel}>
        <ModalHeader title={I18n.t('open_performance.measure.edit_modal.title')} onDismiss={this.onCancel} />
        <ModalContent className="measure-edit-modal-content">
          {this.renderTabList()}
          {this.renderPanels()}
        </ModalContent>
        <ModalFooter className="measure-edit-modal-footer">
          <div className="btn-group">
            <button type="button" className="btn btn-sm btn-default cancel" onClick={this.onCancel}>
              {I18n.t('open_performance.measure.edit_modal.cancel')}
            </button>
            <button type="button" className="btn btn-sm btn-primary done" onClick={this.onComplete}>
              {I18n.t('open_performance.measure.edit_modal.accept')}
            </button>
          </div>
        </ModalFooter>
      </Modal>
    );
  }
}

EditModal.propTypes = {
  isEditing: PropTypes.bool,
  measure: PropTypes.object,
  tabs: PropTypes.array,
  onCancel: PropTypes.func,
  onComplete: PropTypes.func
};

EditModal.defaultProps = {
  isEditing: false,
  tabs: [{
    id: 'general-info',
    title: I18n.t('open_performance.measure.edit_modal.general_info.tab_title'),
    icon: 'info-inverse',
    panelComponent: GeneralPanel
  }, {
    id: 'data-source',
    title: I18n.t('open_performance.measure.edit_modal.data_source.tab_title'),
    icon: 'data',
    panelComponent: DataPanel
  }, {
    id: 'methods-and-analysis',
    title: I18n.t('open_performance.measure.edit_modal.methods_and_analysis.tab_title'),
    icon: 'story',
    panelComponent: MethodsPanel
  }, {
    id: 'calculation',
    title: I18n.t('open_performance.measure.edit_modal.calculation.tab_title'),
    icon: 'puzzle',
    panelComponent: CalculationPanel
  }, {
    id: 'reporting-period',
    title: I18n.t('open_performance.measure.edit_modal.reporting_period.tab_title'),
    icon: 'date',
    panelComponent: ReportingPeriodPanel
  }],
  onCancel: _.noop,
  onComplete: _.noop
};

function mapStateToProps(state) {
  return state.editor;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onCancel: cancelEditModal,
    onComplete: acceptEditModalChanges
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EditModal);
