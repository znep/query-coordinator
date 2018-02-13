import _ from 'lodash';
import $ from 'jquery';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import I18n from 'common/i18n';

import { EditTabs } from '../../lib/constants';
import validateConfiguration from '../../lib/validateConfiguration';
import { cancelEditModal, acceptEditModalChanges, setActivePanel } from '../../actions/editor';
import EditModalTab from './EditModalTab';
import EditModalPanel from './EditModalPanel';
import GeneralPanel from './GeneralPanel';
import DataPanel from './DataPanel';
import MethodsPanel from './MethodsPanel';
import CalculationPanel from './CalculationPanel';
import ReportingPeriodPanel from './ReportingPeriodPanel';
import ConfigurationNotice from './ConfigurationNotice';

const scope = 'open_performance.measure.edit_modal';

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

  onCancel = () => {
    // TODO: Add confirm dialog on unsaved changes

    // Don't close the whole edit modal when using Escape key to exit
    // ConfigurationNotice flannel. I wasn't able to use ReactDOM.findDOMNode in
    // a way that didn't break tests, but maybe someone can replace this jQuery
    // usage at some point.
    if ($('#configuration-notice-flannel').is(':visible')) {
      // TODO: This actually needs to check the event, but the Modal's onDismiss
      // doesn't actually pass the event through, so this needs some follow-up.
      // (If we don't check the event, then the user can't click Cancel if the
      // ConfigurationNotice is open.)
      return;
    }

    this.props.onCancel();
  }

  onComplete() {
    this.props.onComplete(this.props.measure);
  }

  renderTabList() {
    const { tabs, validation } = this.props;

    const renderTab = (tab) => {
      const tabAttributes = _.extend(tab, {
        key: tab.id,
        isSelected: tab.id === this.props.activePanel,
        needsAttention: _.some(validation[_.camelCase(tab.id)]),
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
      coreView,
      isEditing,
      measure,
      pristineCoreView,
      pristineMeasure
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
        <ModalHeader title={I18n.t('title', { scope })} onDismiss={this.onCancel} />
        <ModalContent className="measure-edit-modal-content">
          {this.renderTabList()}
          {this.renderPanels()}
        </ModalContent>
        <ModalFooter className="measure-edit-modal-footer">
          <ConfigurationNotice />
          <div className="btn-group">
            <button type="button" className="btn btn-sm btn-default cancel" onClick={this.onCancel}>
              {I18n.t('cancel', { scope })}
            </button>
            <button
              type="button"
              className={saveBtnClasses}
              disabled={isUnmodified}
              onClick={this.onComplete}>
              {I18n.t('accept', { scope })}
            </button>
          </div>
        </ModalFooter>
      </Modal>
    );
  }
}

EditModal.propTypes = {
  activePanel: PropTypes.string,
  coreView: PropTypes.object,
  isEditing: PropTypes.bool,
  measure: PropTypes.object,
  pristineCoreView: PropTypes.object,
  pristineMeasure: PropTypes.object,
  tabs: PropTypes.array,
  validation: PropTypes.shape({
    calculation: PropTypes.object.isRequired,
    dataSource: PropTypes.object.isRequired,
    reportingPeriod: PropTypes.object.isRequired
  }).isRequired,
  onCancel: PropTypes.func,
  onComplete: PropTypes.func,
  onTabClick: PropTypes.func
};

EditModal.defaultProps = {
  isEditing: false,
  tabs: [{
    icon: 'info-inverse',
    id: EditTabs.GENERAL_INFO,
    panelComponent: GeneralPanel,
    title: I18n.t('general_info.tab_title', { scope })
  }, {
    icon: 'story',
    id: EditTabs.METHODS_AND_ANALYSIS,
    panelComponent: MethodsPanel,
    title: I18n.t('methods_and_analysis.tab_title', { scope })
  }, {
    icon: 'data',
    id: EditTabs.DATA_SOURCE,
    panelComponent: DataPanel,
    title: I18n.t('data_source.tab_title', { scope })
  }, {
    icon: 'date',
    id: EditTabs.REPORTING_PERIOD,
    panelComponent: ReportingPeriodPanel,
    title: I18n.t('reporting_period.tab_title', { scope })
  }, {
    icon: 'puzzle',
    id: EditTabs.CALCULATION,
    panelComponent: CalculationPanel,
    title: I18n.t('calculation.tab_title', { scope })
  }],
  onCancel: _.noop,
  onComplete: _.noop
};

function mapStateToProps(state) {
  const { dataSourceView, measure } = state.editor;

  const validation = validateConfiguration(_.get(measure, 'metricConfig'), dataSourceView);

  return _.merge({ validation }, state.editor);
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onCancel: cancelEditModal,
    onComplete: acceptEditModalChanges,
    onTabClick: setActivePanel
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EditModal);
