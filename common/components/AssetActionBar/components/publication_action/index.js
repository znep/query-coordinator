import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import _ from 'lodash';

import SocrataIcon from 'common/components/SocrataIcon';
import Dropdown from 'common/components/Dropdown';
import Button from 'common/components/Button';
import { defaultHeaders } from 'common/http';
import I18n from 'common/i18n';
import Modal, { ModalHeader, ModalContent, ModalFooter } from 'common/components/Modal';

import { SocrataUid } from '../../lib/socrata_proptypes';
import EditButton from '../edit_button';

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

const confirmation = (message, options = {}) => {
  return new Promise((resolve, reject) => {
    const targetNode = document.querySelector('#asset-action-bar-modal-target');
    const onDismiss = () => {
      _.defer(() => ReactDOM.unmountComponentAtNode(targetNode));
      resolve(false);
    };

    const onAgree = () => {
      _.defer(() => ReactDOM.unmountComponentAtNode(targetNode));
      resolve(true);
    };

    const agreeText = options.agree ||
      I18n.t('shared.components.asset_action_bar.confirmation.agree');
    const cancelText = options.cancel ||
      I18n.t('shared.components.asset_action_bar.confirmation.cancel');

    ReactDOM.render(
      <Modal onDismiss={onDismiss}>
        <ModalHeader showCloseButton={false}>
          {options.header}
        </ModalHeader>
        <ModalContent>
          <p>{message}</p>
        </ModalContent>
        <ModalFooter>
          <button onClick={onDismiss} className="btn btn-default">{cancelText}</button>
          <button onClick={onAgree} className="btn btn-primary">{agreeText}</button>
        </ModalFooter>
      </Modal>,
      targetNode
    );
  });
};

class PublicationAction extends Component {
  static propTypes = {
    allowedTo: PropTypes.object.isRequired,
    currentViewUid: SocrataUid.isRequired,
    publicationState: PropTypes.oneOf(['draft', 'pending', 'published']).isRequired,
    publishedViewUid: SocrataUid
  };

  static i18nScope = 'shared.components.asset_action_bar.publication_action';

  static deleteViewByUid = (uid) => {
    const url = `/api/views/${uid}.json`;
    return fetch(url, _.assign({}, fetchOptions, { method: 'DELETE' }));
  };

  // This function is called twice and isn't memoized.
  // If you add anything remotely complex, you'll want to add memoization, too.
  moreActionsAllowed() {
    const { allowedTo, publicationState, publishedViewUid } = this.props;

    const currentUserRights = _.get(window, 'socrata.currentUser.rights', []);

    return {
      deleteDataset: allowedTo.manage && publicationState === 'published',
      discardDraft: allowedTo.manage && publicationState === 'draft',
      // We're not including Revert for now as per ChristianH.
      revert: false, // publicationState === 'draft' && publishedViewUid,
      view: publishedViewUid,
      changeAudience: allowedTo.manage && publicationState === 'published',

      // yes, this is the only way people can change owners right now
      // we will probably want to make this more robust in the future
      transferOwnership: currentUserRights.includes('chown_datasets'),
      withdrawApprovalRequest: allowedTo.edit && publicationState === 'pending'
    };
  }

  moreActionsExist() {
    return this.props.allowedTo.manage && _.some(this.moreActionsAllowed());
  }

  handleMoreActions = (option) => {
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
              header: I18n.t('delete_dataset', { scope: PublicationAction.i18nScope })
            }).
          then((confirmed) => {
            if (confirmed) {
              deleteViewByUid(currentViewUid).
                then(redirectAfterDeletion);
            }
          });
        break;
      case 'discard-draft':
        confirmation(I18n.t('discard_draft_confirm', { scope: PublicationAction.i18nScope }),
            { agree: I18n.t('discard_draft', { scope: PublicationAction.i18nScope }),
              header: I18n.t('discard_draft', { scope: PublicationAction.i18nScope })
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
        title: I18n.t('discard_draft', { scope: PublicationAction.i18n_scope }),
        value: 'discard-draft'
      });
    }

    if (currentlyAbleTo.deleteDataset) {
      actions.push({
        title: I18n.t('delete_dataset', { scope: PublicationAction.i18n_scope }),
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
    const { currentViewUid, allowedTo, publicationState } = this.props;

    const actionText = I18n.t(`${publicationState}.primary_action_text`, {
      scope: PublicationAction.i18nScope
    });

    if (allowedTo.edit) {
      if (_.includes(['published', 'pending'], publicationState)) {
        return <EditButton currentViewUid={currentViewUid} />;
      } else if (publicationState === 'draft') {
        return (
          <button
            className="btn btn-primary btn-dark"
            onClick={() => window.socrata.showAccessManager('publish')}>
            {actionText}
          </button>
        );
      }
    }

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

export default PublicationAction;
