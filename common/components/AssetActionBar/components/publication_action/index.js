import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import I18n from 'common/i18n';
import moment from 'moment';
import { SocrataUid } from '../../lib/socrata_proptypes';
import SocrataIcon from 'common/components/SocrataIcon';
import 'whatwg-fetch';
import url from 'url';

const findWorkingCopyFor = (uid) => {
  const url = `/api/views/${uid}.json?method=getPublicationGroup&stage=unpublished`;
  const fetchOptions = {
    credentials: 'same-origin',
    headers: {
      'User-Agent': 'SocrataFrontend/1.0 (+https://socrata.com/)'
    }
  };

  return fetch(url, fetchOptions).
    then((response) => {
      return response.json().then((views) => {
        if (views.length === 0) {
          return false;
        } else if (views.length === 1) {
          return views[0];
        } else {
          throw new Error('We should not have received more than one working copy!');
        }
      });
    });
};

const getOperationStatuses = (uid) => {
  const url = `/api/views/${uid}.json?method=operationStatuses`;
  const fetchOptions = {
    credentials: 'same-origin',
    headers: {
      'User-Agent': 'SocrataFrontend/1.0 (+https://socrata.com/)'
    }
  };

  return fetch(url, fetchOptions).
    then((response) => {
      return response.json().then((statuses) => {
        switch (_.get(statuses, 'copying.copyStatus')) {
          case 'finished':
          case 'queued':
          case 'processing':
          case 'failed':
        }
      });
    });
};

class PublicationAction extends React.Component {
  constructor(props) {
    super(props);

    if (this.props.publicationState === 'published') {
      findWorkingCopyFor(this.props.currentViewUid).
        then((workingCopy) => {
          if (workingCopy === false) {
            this.setState({ workingCopy: 'needToCreate' });
         // getOperationStatuses(this.props.currentViewUid).
         //   then(() => {
         //   });
          } else {
            this.workingCopy = workingCopy;
            this.setState({ workingCopy: 'ready' });
          }
        });
    }

    this.i18n_scope = 'shared.components.asset_action_bar.publication_action';
    this.state = {
      moreActionsVisible: false,
      workingCopy: 'needToCreate'
    };

    _.bindAll(this, [
      'createWorkingCopy',
      'showMoreActions', 'closeMoreActions'
    ]);
  }

  showMoreActions() {
    this.setState({ moreActionsVisible: true });
  }

  closeMoreActions() {
    this.setState({ moreActionsVisible: false });
  }

  moreActionsExist() {
    const { publishedViewUid } = this.props;

    // All current possible actions under More Actions depend on the existence of this prop.
    return !!publishedViewUid;
  }

  createWorkingCopy() {
    this.setState({ workingCopy: 'creating' });

    const uid = this.props.currentViewUid;
    const url = `/api/views/${uid}/publication.json?method=copy`;
    const fetchOptions = {
      method: 'POST',
      credentials: 'same-origin',
      headers: { }
    };

    fetch(url, fetchOptions).
      then((response) => {
        return response.json().then((workingCopy) => {
          this.workingCopy = workingCopy;
          this.setState({ workingCopy: 'ready' });
        });
      });
    console.log('started working');
  }

  // Variously copied from util/dataset/dataset.js, base-model.js, and util/util.js
  // See: $.path
  // See: ds.redirectTo
  // See: ds.url = _generateUrl
  // See: _generateBaseUrl
  urlForWorkingCopy() {
    const ds = this.workingCopy;
    let base = '';
    let fullUrl = '';

    // This is probably unnecessary since it's not likely we'll cross into federation
    // territory. But then again, maybe we will.
    if (!_.isEmpty(ds.domainCName)) {
      const loc = document.location;
      const domain = loc.hostname;

      base = `${loc.protocol}//${domain}`;
    }

    const shouldPrefixLocale = new RegExp(`^\/(${I18n.locale})`).
      test(url.parse(window.location.href, true).pathname);
    const rootPath = shouldPrefixLocale ? `/${I18n.locale}` : '';

    if (ds.displayType === 'story') {
      fullUrl = base + rootPath + `/stories/s/${ds.id}`;
    } else {
      fullUrl = base + rootPath + `/d/${ds.id}`;
    }

    // Pure guess: if an initialState exists, this domain probably has DSLPs.
    if (_.get(window, 'initialState') || _.get(window, 'blist.configuration.dataset_landing_page_enabled')) {
      fullUrl = fullUrl + '/data';
    }

    return fullUrl;
  }

  renderMoreActionButton() {
    return (
      <button className="btn more-actions-button" onClick={this.showMoreActions}>
        <SocrataIcon name="waiting" />
      </button>
    );
  }

  renderMoreActions() {
    const { publicationState, publishedViewUid } = this.props;
    let actions = [];

    const canRevert = publicationState === 'draft' && publishedViewUid;
    const canView = publishedViewUid;

    if (canRevert) {
      actions.push(<button className="btn btn-alternate-2" key="revert-action">
        {I18n.t('revert_published', { scope: this.i18n_scope })}
      </button>);
    }

    if (canView) {
      actions.push(<a
        href={`/d/${publishedViewUid}`}
        className="btn btn-alternate-2"
        key="view-action">
        {I18n.t('view_published', { scope: this.i18n_scope })}
      </a>);
    }

    return (
      <div>
        <div onClick={this.closeMoreActions} className="asset-action-bar-overlay" />
        <div className="more-actions">
          {actions}
        </div>
      </div>
    );
  }

  renderEditButton() {
    const { componentOptions, translationKey } = {
      'creating': {
        componentOptions: { className: 'btn btn-primary btn-dark btn-disabled' },
        translationKey: 'published.creating_working_copy'
      },
      'needToCreate': {
        componentOptions: {
          className: 'btn btn-primary btn-dark',
          onClick: this.createWorkingCopy
        },
        translationKey: 'published.primary_action_text'
      },
      'ready': {
        componentOptions: { className: 'btn btn-primary btn-dark' },
        translationKey: 'published.primary_action_text'
      }
    }[this.state.workingCopy];

    const actionText = I18n.t(translationKey, { scope: this.i18n_scope });

    if (this.state.workingCopy === 'ready') {
      return (<a href={this.urlForWorkingCopy()}>
        <button {...componentOptions}>
          {I18n.t(translationKey, { scope: this.i18n_scope })}
        </button>
      </a>);
    } else {
      return (
        <button {...componentOptions}>
          {I18n.t(translationKey, { scope: this.i18n_scope })}
        </button>
      );
    }
  }

  renderPrimaryActionButton() {
    const { publicationState } = this.props;

    if (publicationState === 'published') {
      return this.renderEditButton();
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
        {this.state.moreActionsVisible && this.renderMoreActions()}
      </div>
    );
  }
}

PublicationAction.propTypes = {
  currentViewUid: SocrataUid.isRequired,
  publicationState: PropTypes.oneOf(['draft', 'pending', 'published']).isRequired,
  publishedViewUid: SocrataUid
};

export default PublicationAction;
