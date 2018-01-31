import _ from 'lodash';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators, compose } from 'redux';
import { connect } from 'react-redux';

import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import I18n from 'common/i18n';

// TODO: EditTabs should *probably* not have been moved to common. Only imports are in opMeasure
import { EditTabs } from 'common/performance_measures/lib/constants';
import withComputedMeasure from 'common/performance_measures/components/withComputedMeasure';
import computedMeasurePropType from 'common/performance_measures/propTypes/computedMeasurePropType';

import { cancelEditModal, acceptEditModalChanges, setActivePanel } from '../../actions/editor';
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

    _.bindAll(this, [
      'onCancel',
      'onComplete',
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

  renderTabList() {
    const { tabs, computedMeasure } = this.props;
    const errors = _.get(computedMeasure, 'errors', {});

    const renderTab = (tab) => {
      const tabAttributes = _.extend(tab, {
        key: tab.id,
        isSelected: tab.id === this.props.activePanel,
        needsAttention: tab.needsAttentionFor && errors[tab.needsAttentionFor],
        onTabNavigation: () => this.props.onTabClick(tab.id)
      });

      return <EditModalTab {...tabAttributes} />;
    };

    return (
      <ul role="tablist" className="nav-tabs measure-edit-modal-tabs">
        {_.map(tabs, renderTab)}
      </ul>
    );
  }

  renderPanels() {
    const renderPanel = (tab) => {
      const panelAttributes = _.extend(tab, {
        key: tab.id,
        isSelected: tab.id === this.props.activePanel
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
    const {
      isEditing,
      measure,
      pristineMeasure,
      coreView,
      pristineCoreView
    } = this.props;

    if (!isEditing) {
      return null;
    }

    const isUnmodified = _.isEqual(measure, pristineMeasure) && _.isEqual(coreView, pristineCoreView);
    const saveBtnClasses = classNames(
      'btn',
      'btn-sm',
      'btn-primary',
      'done',
      { 'btn-disabled': isUnmodified }
    );

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
            <button
              type="button"
              className={saveBtnClasses}
              disabled={isUnmodified}
              onClick={this.onComplete}>
              {I18n.t('open_performance.measure.edit_modal.accept')}
            </button>
          </div>
        </ModalFooter>
      </Modal>
    );
  }
}

EditModal.propTypes = {
  activePanel: PropTypes.string,
  computedMeasure: computedMeasurePropType,
  isEditing: PropTypes.bool,
  measure: PropTypes.object,
  coreView: PropTypes.object,
  pristineCoreView: PropTypes.object,
  pristineMeasure: PropTypes.object,
  tabs: PropTypes.array,
  onCancel: PropTypes.func,
  onComplete: PropTypes.func,
  onTabClick: PropTypes.func
};

EditModal.defaultProps = {
  isEditing: false,
  tabs: [{
    id: EditTabs.GENERAL_INFO,
    title: I18n.t('open_performance.measure.edit_modal.general_info.tab_title'),
    icon: 'info-inverse',
    panelComponent: GeneralPanel
  }, {
    id: EditTabs.METHODS_AND_ANALYSIS,
    title: I18n.t('open_performance.measure.edit_modal.methods_and_analysis.tab_title'),
    icon: 'story',
    panelComponent: MethodsPanel
  }, {
    id: EditTabs.DATA_SOURCE,
    title: I18n.t('open_performance.measure.edit_modal.data_source.tab_title'),
    icon: 'data',
    // TODO: Not a fan of using a string here. How else can we achieve this?
    //       Should we be defining all the error keys in the lib/constants module?
    needsAttentionFor: 'dataSourceNotConfigured',
    panelComponent: DataPanel
  }, {
    id: EditTabs.REPORTING_PERIOD,
    title: I18n.t('open_performance.measure.edit_modal.reporting_period.tab_title'),
    icon: 'date',
    // TODO: Not a fan of using a string here. How else can we achieve this?
    needsAttentionFor: 'noReportingPeriodConfigured',
    panelComponent: ReportingPeriodPanel
  }, {
    id: EditTabs.CALCULATION,
    title: I18n.t('open_performance.measure.edit_modal.calculation.tab_title'),
    icon: 'puzzle',
    panelComponent: CalculationPanel
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
    onComplete: acceptEditModalChanges,
    onTabClick: setActivePanel
  }, dispatch);
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  withComputedMeasure()
)(EditModal);
