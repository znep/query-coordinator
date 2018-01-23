import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import I18n from 'common/i18n';
import { SocrataUid } from '../../lib/socrata_proptypes';
import SocrataIcon from 'common/components/SocrataIcon';
import EditButton from '../edit_button';
import confirmation from '../confirmation_dialog/index';
import Dropdown from 'common/components/Dropdown';
import Button from 'common/components/Button';

import 'whatwg-fetch';
import { defaultHeaders, fetchJson } from 'common/http';

const fetchOptions = {
  credentials: 'same-origin',
  headers: defaultHeaders
};

const deleteViewByUid = (uid) => {
  const url = `/api/views/${uid}.json`;

  return fetch(url, _.assign({}, fetchOptions, { method: 'DELETE' }));
};

const makePrivateByUid = (uid) => {
  const url = `/api/views/${uid}.json?method=setPermission&value=private`;

  return fetch(url, _.assign({}, fetchOptions, { method: 'PUT' }));
};

class PublicationAction extends React.Component {
  constructor(props) {
    super(props);

    this.i18n_scope = 'shared.components.asset_action_bar.publication_action';

    _.bindAll(this, [
      'handleMoreActions'
    ]);
  }

  // This function is called twice and isn't memoized.
  // If you add anything remotely complex, you'll want to add memoization, too.
  moreActionsAllowed() {
    const { allowedTo, publicationState, publishedViewUid } = this.props;

    return {
      deleteDataset: allowedTo.manage && publicationState === 'published',
      discardDraft: allowedTo.manage && publicationState === 'draft',
      // We're not including Revert for now as per ChristianH.
      revert: false, // publicationState === 'draft' && publishedViewUid,
      view: publishedViewUid,
      changeAudience: allowedTo.manage && publicationState === 'published',
      withdrawApprovalRequest: allowedTo.edit && publicationState === 'pending'
    };
  }

  moreActionsExist() {
    return this.props.allowedTo.manage && _.some(this.moreActionsAllowed());
  }

  handleMoreActions(option) {
    const { value } = option;
    const { currentViewUid, publishedViewUid } = this.props;
    const redirectAfterDeletion = () => {
      window.location.assign('/profile'); // Eventually /admin/assets
    };

    switch (value) {
      case 'revert-to-published':
        // TODO someday. Currently postponed.
        console.log('revert-to-published option selected');
        break;
      case 'view-published':
        window.location.assign(`/d/${publishedViewUid}`);
        break;
      case 'change-audience':
        // TODO by someone else. Expecting to call an external function of some kind.
        console.log('change-audience option selected');
        break;
      case 'delete-dataset':
        confirmation(I18n.t('delete_dataset_confirm', { scope: this.i18n_scope }),
            { agree: I18n.t('delete_dataset', { scope: this.i18n_scope }),
              header: I18n.t('delete_dataset', { scope: this.i18n_scope }),
              dismissOnAgree: false
            }).
          then((confirmed) => {
            if (confirmed) {
              deleteViewByUid(currentViewUid).
                then(redirectAfterDeletion);
            }
          });
        break;
      case 'discard-draft':
        confirmation(I18n.t('discard_draft_confirm', { scope: this.i18n_scope }),
            { agree: I18n.t('discard_draft', { scope: this.i18n_scope }),
              header: I18n.t('discard_draft', { scope: this.i18n_scope }),
              dismissOnAgree: false
            }).
          then((confirmed) => {
            if (confirmed) {
              deleteViewByUid(currentViewUid).
                then(redirectAfterDeletion);
            }
          });
        break;
      case 'withdraw-approval-request':
        makePrivateByUid(currentViewUid).
          then(() => { window.location.reload(); });
        break;
    }
  }

  enumerateMoreActions() {
    const currentlyAbleTo = this.moreActionsAllowed();
    let actions = [];

    if (currentlyAbleTo.revert) {
      actions.push({
        title: I18n.t('revert_published', { scope: this.i18n_scope }),
        value: 'revert-to-published'
      });
    }

    if (currentlyAbleTo.view) {
      actions.push({
        title: I18n.t('view_published', { scope: this.i18n_scope }),
        value: 'view-published'
      });
    }

    if (currentlyAbleTo.changeAudience) {
      actions.push({
        title: I18n.t('change_audience', { scope: this.i18n_scope }),
        value: 'change-audience'
      });
    }

    if (currentlyAbleTo.withdrawApprovalRequest) {
      actions.push({
        title: I18n.t('withdraw_approval_request', { scope: this.i18n_scope }),
        value: 'withdraw-approval-request'
      });
    }

    if (currentlyAbleTo.discardDraft) {
      actions.push({
        title: I18n.t('discard_draft', { scope: this.i18n_scope }),
        value: 'discard-draft'
      });
    }

    if (currentlyAbleTo.deleteDataset) {
      actions.push({
        title: I18n.t('delete_dataset', { scope: this.i18n_scope }),
        value: 'delete-dataset'
      });
    }

    return actions;
  }

  renderMoreActionButton() {
    const placeholder = () => {
      return (<Button className="more-actions-button" variant="simple">
        <SocrataIcon name="waiting" />
      </Button>);
    };

    const dropdownOptions = {
      options: this.enumerateMoreActions(),
      placeholder,
      showOptionsBelowHandle: true,
      displayTrueWidthOptions: true,
      onSelection: this.handleMoreActions
    };
    return (
      <Dropdown {...dropdownOptions} />
    );
  }

  renderPrimaryActionButton() {
    const { currentViewUid, allowedTo, publicationState } = this.props;

    if (allowedTo.edit && _.includes(['published', 'pending'], publicationState)) {
      return <EditButton currentViewUid={currentViewUid} />;
    }

    const actionText = I18n.t(`${publicationState}.primary_action_text`, {
      scope: this.i18n_scope
    });

    return (
      <button className="btn btn-primary btn-dark">
        {actionText}
      </button>
    );
  }

  render() {
    return (
      <div className="publication-action">
        {this.renderPrimaryActionButton()}
        {this.moreActionsExist() && this.renderMoreActionButton()}
      </div>
    );
  }
}

PublicationAction.propTypes = {
  allowedTo: PropTypes.object.isRequired,
  currentViewUid: SocrataUid.isRequired,
  publicationState: PropTypes.oneOf(['draft', 'pending', 'published']).isRequired,
  publishedViewUid: SocrataUid
};

export default PublicationAction;
