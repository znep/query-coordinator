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
    if (!this.currentView) {
      throw new Error('The Asset Action Bar does not make much sense without a current view.');
    }

    this.currentUser = _.get(window, 'socrata.currentUser', this.props.currentUser);
    if (!this.currentUser) {
      throw new Error('We should not have gotten here without a currentUser.');
    }

    this.grantedPermissionTo = {
      view: false,
      edit: false,
      manage: false
    };

    if (this.currentUser.id === this.currentView.owner.id) {
      // Owner has all grants.
      this.grantedPermissionTo = _.mapValues(this.grantedPermissionTo, _.constant(true));
    } else {
      // See: https://docs.google.com/spreadsheets/d/1oiN0gz-9TfQ_9WQxRBMVT8JkZOV5iH5X2tXrjkWMzGQ/edit#gid=2111165319
      _.each(_.get(this.currentView, 'grants'), (grant) => {
        if (grant.userId === this.currentUser.id) {
          // Code repetition exists because of linting rules.
          switch (grant.type.toLowerCase()) {
            case 'owner':
              this.grantedPermissionTo.manage = true;
              this.grantedPermissionTo.edit = true;
              this.grantedPermissionTo.view = true;
              break;
            case 'contributor':
              this.grantedPermissionTo.edit = true;
              this.grantedPermissionTo.view = true;
              break;
            case 'viewer':
              this.grantedPermissionTo.view = true;
              break;
            default:
              throw new Error(`found a grant type ${grant.type} that does not make sense`);
          }
        }
      });
    }
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
    const { edit, manage } = this.grantedPermissionTo;

    const rightSideParts = [];

    if (edit || manage) {
      rightSideParts.push(
        <PublicationAction
          key="publication-action"
          {...publicationState}
          allowedTo={this.grantedPermissionTo} />
      );
    }

    if (manage) {
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
