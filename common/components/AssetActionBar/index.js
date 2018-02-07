import _ from 'lodash';
import React, { Component } from 'react';
import { sift } from 'common/js_utils';

import ManageAccessButton from './components/manage_access';
import PublicationAction from './components/publication_action/index';
import PublicationState from './components/publication_state/index';

class AssetActionBar extends Component {
  constructor(props) {
    super(props);

    this.currentView = sift(window,
      'initialState.view.coreView', // Primer
      'initialState.view', // DSMUI
      'blist.dataset' // Grid View
    ) || this.props.currentView; // For tests.
    if (!this.currentView) {
      throw new Error('The Asset Action Bar does not make much sense without a current view.');
    }

    this.currentUser = _.get(window, 'socrata.currentUser', this.props.currentUser);
    if (!this.currentUser) {
      throw new Error('We should not have gotten here without a currentUser.');
    }

    this.viewRights = _.fromPairs((this.currentView.rights || []).map((right) => [right, true]));
  }

  comprehendPublicationState() {
    const currentView = this.currentView;
    const publishedViewUid = currentView.publishedViewUid;

    if (currentView.publicationStage === 'unpublished') {
      return { publicationState: 'draft', publishedViewUid };
    } else if (currentView.publicationStage === 'published') {
      if (_.get(currentView, 'approvals.0.state') === 'pending') {
        return { publicationState: 'pending', publishedViewUid };
      }
      return { publicationState: 'published' };
    }
  }

  render() {
    const assetName = _.get(this.currentView, 'name');
    const publicationState = this.comprehendPublicationState();

    const rightSideParts = [];

    // This is essentially trying to ask, "Does the user have a view right other than 'view'?"
    // Feel free to come up with a better way to ask that.
    if (_.size(this.viewRights) > 1) {
      rightSideParts.push(
        <PublicationAction
          key="publication-action"
          {...publicationState}
          currentViewName={assetName}
          currentViewType={this.currentView.viewType}
          currentViewUid={this.currentView.id}
          isOwner={this.currentUser.id === this.currentView.owner.id}
          viewRights={this.viewRights} />
      );
    }

    if (this.viewRights.grant) {
      rightSideParts.push(<div key="divider" className="divider" />);
      rightSideParts.push(<ManageAccessButton key="manage-access" />);
    }

    return (
      <div className="asset-action-bar">
        <div className="left-side">
          <button className="btn btn-transparent asset-name">
            {assetName}
          </button>
          <div className="divider" />
          <PublicationState {...publicationState} />
        </div>
        <div className="right-side">
          {rightSideParts}
        </div>
      </div>
    );
  }
}

export default AssetActionBar;
