import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import SocrataIcon from 'common/components/SocrataIcon';
import I18n from 'common/i18n';

import PublicationAction from '../publication_action';

class PublicationState extends React.Component {
  constructor(props) {
    super(props);

    this.state = { actionVisible: false };

    _.bindAll(this, ['showAction', 'closeAction']);
  }

  showAction() {
    this.setState({ actionVisible: true });
  }

  closeAction() {
    this.setState({ actionVisible: false });
  }

  renderAction() {
    return (
      <div>
        <div onClick={this.closeAction} className="asset-action-bar-overlay" />
        <PublicationAction publicationState={this.props.publicationState} />
      </div>
    );
  }

  renderDisplay() {
    const { publicationState } = this.props;
    const scope = 'shared.components.asset_action_bar.publication_state';

    const { socrataIcon, translationKey } = {
      'draft': {
        socrataIcon: 'edit',
        translationKey: 'draft'
      },
      'pending': {
        socrataIcon: 'question', // TODO: Ask Leor for correct icon.
        translationKey: 'pending'
      },
      'published': {
        socrataIcon: 'checkmark3',
        translationKey: 'published'
      }
    }[publicationState];

    return (
      <div className="publication-state-display" onClick={this.showAction}>
        <SocrataIcon name={socrataIcon} className={`publication-state-${publicationState}`} />
        {I18n.t(translationKey, { scope })}
      </div>
    );
  }

  render() {
    return (
      <div className="btn publication-state">
        {this.renderDisplay()}
        <div className="publication-state-arrow" onClick={this.showAction}>
          <SocrataIcon name="arrow-down" />
        </div>
        {this.state.actionVisible && this.renderAction()}
      </div>
    );
  }
}

PublicationState.propTypes = {
  publicationState: PropTypes.oneOf(['draft', 'pending', 'published'])// .isRequired
};

// TODO: There are no defaultProps; there is only testery!
PublicationState.defaultProps = {
  publicationState: 'published'
};

export default PublicationState;
