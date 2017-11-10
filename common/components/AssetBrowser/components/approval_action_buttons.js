import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import _ from 'lodash';

import I18n from 'common/i18n';
import Flannel from 'common/components/Flannel';

import * as assetActions from '../actions/asset_actions';

export class ApprovalActionButtons extends Component {
  constructor(props) {
    super(props);

    this.state = {
      flannelIsOpen: false,
      flannelType: null,
      flannelNote: ''
    };
  }

  getTranslation(key) {
    const scope = 'shared.asset_browser.result_list_table.approval_action_buttons';
    return I18n.t(key, { scope });
  }

  handleApprovalButtonClick(e, flannelType) {
    e.preventDefault();
    // Defer before opening a flannel to fix an issue when another flannel is already open -
    // The onDismiss from first flannel triggers after the new flannel is opened, causing both to close.
    _.defer(() => {
      this.setState({ flannelIsOpen: true, flannelType });
    });
  }

  renderFlannel() {
    const { flannelType, flannelNote } = this.state;
    const { approveResource, name, rejectResource, uid } = this.props;

    const okButtonAction = flannelType === 'approve' ? approveResource : rejectResource;

    const changeNote = (event) => {
      this.setState({ flannelNote: event.target.value });
    };

    const onFlannelDismiss = () => this.setState({ flannelIsOpen: false, flannelType: null });

    const flannelContent = (
      <div className="flannel-content">
        <h4>{this.getTranslation(`flannel.${flannelType}.title`)}</h4>
        <p>{this.getTranslation(`flannel.${flannelType}.description`)}</p>
        <p>{this.getTranslation(`flannel.${flannelType}.note`)}</p>
        <textarea rows="3" value={flannelNote} onChange={changeNote}></textarea>
        <a
          href="#"
          onClick={() => {
            okButtonAction(uid, name, flannelNote);
            onFlannelDismiss();
          }}>
          <button className="btn btn-primary ok-button">{this.getTranslation('flannel.ok')}</button>
        </a>
      </div>
    );

    const flannelClass = `${flannelType}-flannel`;
    const flannelTitle = this.getTranslation(`flannel.${flannelType}.alt`);
    const flannelTarget = flannelType === 'approve' ? this.approveFlannelTarget : this.rejectFlannelTarget;

    return (
      <Flannel
        className={flannelClass}
        onDismiss={onFlannelDismiss}
        title={flannelTitle}
        target={flannelTarget}>
        {flannelContent}
      </Flannel>
    );
  }

  render() {
    const approveButton = (
      <div>
        <a href="#" onClick={(e) => this.handleApprovalButtonClick(e, 'approve')}>
          <button className="btn btn-sm btn-default approveButton">{this.getTranslation('approve')}</button>
        </a>
        <div ref={(flannelTarget) => { this.approveFlannelTarget = flannelTarget; }}></div>
      </div>
    );

    const rejectButton = (
      <div>
        <a href="#" onClick={(e) => this.handleApprovalButtonClick(e, 'reject')}>
          <button className="btn btn-sm btn-default rejectButton">{this.getTranslation('reject')}</button>
        </a>
        <div ref={(flannelTarget) => { this.rejectFlannelTarget = flannelTarget; }}></div>
      </div>
    );

    const flannel = this.state.flannelIsOpen && this.renderFlannel();

    return (
      <div className="approval-action-buttons">
        {approveButton}
        {rejectButton}
        {flannel}
      </div>
    );
  }
}

ApprovalActionButtons.propTypes = {
  approveResource: PropTypes.func.isRequired,
  rejectResource: PropTypes.func.isRequired
};

const mapDispatchToProps = (dispatch) => ({
  approveResource: (resourceId, name, notes) =>
    dispatch(assetActions.approveResource(resourceId, name, notes)),
  rejectResource: (resourceId, name, notes) => dispatch(assetActions.rejectResource(resourceId, name, notes))
});

export default connect(null, mapDispatchToProps)(ApprovalActionButtons);
