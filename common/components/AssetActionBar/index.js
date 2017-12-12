import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { sift } from 'common/js_utils';

import ManageAccessButton from './components/manage_access';
import PublicationAction from './components/publication_action/index';
import PublicationState from './components/publication_state/index';

class AssetActionBar extends React.Component {
  constructor(props) {
    super(props);

    this.currentView = sift(window,
      'initialState.view.coreView',
      'blist.dataset'
    ) || this.props.currentView; // For tests.
  }

  comprehendPublicationState() {
    const currentView = this.currentView;
    const currentViewUid = currentView.id;
    const publishedViewUid = currentView.publishedViewUid;

    if (currentView.publicationStage === 'unpublished') {
      return { currentViewUid, publicationState: 'draft', publishedViewUid };
    } else if (currentView.publicationStage === 'published') {
      if (_.get(currentView, 'approvals.0.state') === 'pending') {
        return { currentViewUid, publicationState: 'pending', publishedViewUid };
      }
      return { currentViewUid, publicationState: 'published' };
    }
  }

  render() {
    const assetName = _.get(this.currentView, 'name');
    const publicationState = this.comprehendPublicationState();

    return (
      <div className="asset-action-bar">
        <div className="left-side">
          <div className="asset-name">
            {assetName}
          </div>
          <div className="divider" />
          <PublicationState {...publicationState} />
        </div>
        <div className="right-side">
          <PublicationAction {...publicationState} />
          <div className="divider" />
          <ManageAccessButton />
        </div>
      </div>
    );
  }
}

export default AssetActionBar;
