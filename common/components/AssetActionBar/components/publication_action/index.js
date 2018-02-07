import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import _ from 'lodash';

import SocrataIcon from 'common/components/SocrataIcon';
import Dropdown from 'common/components/Dropdown';
import Button from 'common/components/Button';
import { defaultHeaders } from 'common/http';
import I18n from 'common/i18n';

import { SocrataUid } from '../../lib/socrata_proptypes';
import EditButton from '../edit_button';
import confirmation from '../confirmation_dialog/index';
import { serializeToast } from 'common/components/ToastNotification/cross_session_support';

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

class PublicationAction extends Component {
  static propTypes = {
    currentViewName: PropTypes.string,
    currentViewType: PropTypes.string,
    currentViewUid: SocrataUid.isRequired,
    isOwner: PropTypes.bool,
    publicationState: PropTypes.oneOf(['draft', 'pending', 'published']).isRequired,
    publishedViewUid: SocrataUid,
    viewRights: PropTypes.object.isRequired
  };

  static i18nScope = 'shared.components.asset_action_bar.publication_action';

  // This function is called twice and isn't memoized.
  // If you add anything remotely complex, you'll want to add memoization, too.
  moreActionsAllowed() {
    const { isOwner, publicationState, publishedViewUid, viewRights } = this.props;

    const currentUserRights = _.get(window, 'socrata.currentUser.rights', []);

    return {
      deleteDataset: viewRights.delete && publicationState === 'published',
      discardDraft: viewRights.delete && publicationState === 'draft',
      // We're not including Revert for now as per ChristianH.
      revert: false, // publicationState === 'draft' && publishedViewUid,
      view: publishedViewUid,
      changeAudience: isOwner && publicationState === 'published',

      // yes, this is the only way people can change owners right now
      // we will probably want to make this more robust in the future
      transferOwnership: currentUserRights.includes('chown_datasets'),
      withdrawApprovalRequest: viewRights.write && publicationState === 'pending'
    };
  }

  moreActionsExist() {
    return _.some(this.moreActionsAllowed());
  }

  toastLater(toastType, translationKey, translationOptions) {
    serializeToast({
      type: toastType,
      content: I18n.t(translationKey,
        _.assign({ scope: PublicationAction.i18nScope }, translationOptions))
    });
  }

  handleMoreActions = (option) => {
    const { value } = option;
    const { currentViewName, currentViewUid, publishedViewUid } = this.props;
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
        // refresh on save to show the changed audience (it's often displayed elsewhere)
        window.socrata.showAccessManager('change_audience', true);
        break;
      case 'transfer-ownership':
        // refresh on save to show the new owner
        window.socrata.showAccessManager('change_owner', true);
        break;
      case 'delete-dataset':
        confirmation(I18n.t('delete_dataset_confirm', { scope: PublicationAction.i18nScope }),
            { agree: I18n.t('delete_dataset', { scope: PublicationAction.i18nScope }),
              header: I18n.t('delete_dataset', { scope: PublicationAction.i18nScope }),
              dismissOnAgree: false
            }).
          then((confirmed) => {
            if (confirmed) {
              this.toastLater('success', 'delete_success', { name: currentViewName });
              deleteViewByUid(currentViewUid).
                then(redirectAfterDeletion);
            }
          });
        break;
      case 'discard-draft':
        confirmation(I18n.t('discard_draft_confirm', { scope: PublicationAction.i18nScope }),
            { agree: I18n.t('discard_draft', { scope: PublicationAction.i18nScope }),
              header: I18n.t('discard_draft', { scope: PublicationAction.i18nScope }),
              dismissOnAgree: false
            }).
          then((confirmed) => {
            if (confirmed) {
              this.toastLater('success', 'delete_success', { name: currentViewName });
              deleteViewByUid(currentViewUid).
                then(redirectAfterDeletion);
            }
          });
        break;
      case 'withdraw-approval-request':
        this.toastLater('success', 'withdraw_approval_request_success', { name: currentViewName });
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
        title: I18n.t('revert_published', { scope: PublicationAction.i18nScope }),
        value: 'revert-to-published'
      });
    }

    if (currentlyAbleTo.view) {
      actions.push({
        title: I18n.t('view_published', { scope: PublicationAction.i18nScope }),
        value: 'view-published'
      });
    }

    if (currentlyAbleTo.changeAudience) {
      actions.push({
        title: I18n.t('change_audience', { scope: PublicationAction.i18nScope }),
        value: 'change-audience'
      });
    }

    if (currentlyAbleTo.transferOwnership) {
      actions.push({
        title: I18n.t('transfer_ownership', { scope: PublicationAction.i18nScope }),
        value: 'transfer-ownership'
      });
    }

    if (currentlyAbleTo.withdrawApprovalRequest) {
      actions.push({
        title: I18n.t('withdraw_approval_request', { scope: PublicationAction.i18nScope }),
        value: 'withdraw-approval-request'
      });
    }

    if (currentlyAbleTo.discardDraft) {
      actions.push({
        title: I18n.t('discard_draft', { scope: PublicationAction.i18nScope }),
        value: 'discard-draft'
      });
    }

    if (currentlyAbleTo.deleteDataset) {
      actions.push({
        title: I18n.t('delete_dataset', { scope: PublicationAction.i18nScope }),
        value: 'delete-dataset'
      });
    }

    return actions;
  }

  renderMoreActionButton() {
    const placeholder = () => {
      return (
        <Button className="more-actions-button" variant="simple">
          <SocrataIcon name="waiting" />
        </Button>
      );
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
    const { currentViewUid, currentViewType, publicationState, viewRights } = this.props;

    const actionText = I18n.t(`${publicationState}.primary_action_text`, {
      scope: PublicationAction.i18nScope
    });


    if (viewRights.write && _.includes(['published', 'pending'], publicationState)) {
      return (<EditButton
        currentViewUid={currentViewUid}
        currentViewType={currentViewType} />);
    } else if (viewRights.update_view && publicationState === 'draft') {
      return (
        <button
          className="btn btn-primary btn-dark"
          onClick={() => window.socrata.showAccessManager('publish')}>
          {actionText}
        </button>
      );
    }
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

export default PublicationAction;
