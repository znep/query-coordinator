import _ from 'lodash';
import React, { Component } from 'react';
import I18n from 'common/i18n';
import PropTypes from 'prop-types';
import { SocrataUid } from '../lib/socrata_proptypes';
import 'whatwg-fetch';
import { defaultHeaders, fetchJson } from 'common/http';
import url from 'url';

const fetchOptions = {
  credentials: 'same-origin',
  headers: defaultHeaders
};

const findWorkingCopyFor = (uid) => {
  const url = `/api/views/${uid}.json?method=getPublicationGroup&stage=unpublished`;

  return fetchJson(url, fetchOptions).
    then((views) => {
      const draftForThisAsset = _.find(views, (view) => view.publishedViewUid === uid);
      return draftForThisAsset || false;
    });
};

// I don't really know the wider usage for this, but in this case, we are merely
// determining the current status of the create-a-working-copy operation.
const getOperationStatuses = (uid) => {
  const url = `/api/views/${uid}.json?method=operationStatuses`;

  return fetchJson(url, fetchOptions).
    then((statuses) => _.get(statuses, 'copying.copyStatus'));
};

// Let's talk about working copy creation.
// Case 1: Working copy already exists.
// - Clicking Edit navigates to the working copy.
// Case 2: The dataset is small.
// - We wait for the user to click on Edit.
// - We ask core to create a working copy.
// - In the meantime, we say that the working copy is pending.
// - It returns a views.json object that tells us where the working copy is located.
// - We change the Edit button to navigate to the working copy on click.
// Case 3: The dataset is large.
// - As in case 2, but instead, core returns a 202 saying that the copy is pending.
// - We poll core every 30 seconds and ask about the copy status.
// - Once the copying is finished, we ask core for the working copy location.
// - We change the Edit button to navigate to the working copy on click.
// Case 4: A working copy is pending when we load the page.
// - There is no Edit button. Instead, it immediately states that the copy is pending.
// - Remainder is as in case 3.
class EditButton extends React.Component {
  constructor(props) {
    super(props);

    if (this.props.currentViewType !== 'tabular') {
      this.state = { workingCopy: 'cannotCreate' };
    } else {
      this.fetchWorkingCopy();
      this.state = { workingCopy: 'needToCreate' };
    }
    this.i18n_scope = 'shared.components.asset_action_bar.publication_action';
    this.workingCopyCreatedDuringThisBrowserSession = false;

    _.bindAll(this, [
      'createWorkingCopy'
    ]);
  }

  pollForCopyCompletion() {
    const THIRTY_SECONDS = 30000;

    setTimeout(() => {
      this.checkIfCopyPending();
    }, THIRTY_SECONDS);
  }

  checkIfCopyPending() {
    getOperationStatuses(this.props.currentViewUid).
      then((copyStatus) => {
        switch (copyStatus) {
          case 'queued':
          case 'processing':
            this.setState({ workingCopy: 'creating' });
            this.pollForCopyCompletion();
            break;
          case 'finished':
            if (this.state.workingCopy === 'creating') {
              this.fetchWorkingCopy();
            }
            break;
          case 'failed':
            this.setState({ workingCopy: 'needToCreate' });
            // TODO: Airbrake?
            break;
        }
      });
  }

  fetchWorkingCopy() {
    findWorkingCopyFor(this.props.currentViewUid).
      then((workingCopy) => {
        if (workingCopy === false) {
          this.setState({ workingCopy: 'needToCreate' });
          this.checkIfCopyPending();
        } else if (workingCopy) {
          this.workingCopyCreated(workingCopy);
        }
      });
  }

  createWorkingCopy() {
    this.workingCopyCreatedDuringThisBrowserSession = true;
    this.setState({ workingCopy: 'creating' });

    const uid = this.props.currentViewUid;
    const url = `/api/views/${uid}/publication.json?method=copy`;

    fetch(url, _.assign({}, fetchOptions, { method: 'POST' })).
      then((response) => {
        switch (response.status) {
          case 200:
            return response.json().then((workingCopy) => {
              this.workingCopyCreated(workingCopy);
            });
          case 202:
            this.setState({ workingCopy: 'creating' });
            this.checkIfCopyPending();
            break;
          default:
            response.json().then(
              json => console.error(response.statusText, ':', json.message));
            break;
        }
      });
  }

  workingCopyCreated(workingCopy) {
    this.workingCopy = workingCopy;

    // Parity behavioral decision:
    // If the working copy creation was started during this browser session, then after
    // it is complete, we should redirect the user to the working copy.
    // If the working copy creation was started by a different browser session (it may
    // have been another user, for example), then do not redirect.
    //
    // This matches the behavior found in dataset-show.js.
    if (this.workingCopyCreatedDuringThisBrowserSession) {
      window.location.assign(this.urlForWorkingCopy());
    } else {
      // We only set this if working copy was not created this browser session.
      // That way, the user never sees it switch back to Edit shortly before redirection.
      this.setState({ workingCopy: 'ready' });
    }
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

  render() {
    const { currentViewUid } = this.props;
    const { componentOptions, translationKey } = {
      'cannotCreate': {
        componentOptions: { className: 'btn btn-primary btn-dark' },
        translationKey: 'published.primary_action_text'
      },
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

    const actionText = (() => {
      if (this.state.workingCopy === 'creating') {
        return [
          <span className="spinner-default spinner-btn-primary" />,
          I18n.t(translationKey, { scope: this.i18n_scope })
        ];
      } else {
        return I18n.t(translationKey, { scope: this.i18n_scope });
      }
    })();

    componentOptions.className += ' edit-button';

    if (this.state.workingCopy === 'ready') {
      return (<a href={this.urlForWorkingCopy()}>
        <button {...componentOptions}>
          {actionText}
        </button>
      </a>);
    } else if (this.state.workingCopy === 'cannotCreate') {
      return (<a href={`/d/${currentViewUid}/edit`}>
        <button {...componentOptions}>
          {actionText}
        </button>
      </a>);
    } else {
      return (
        <button {...componentOptions}>
          {actionText}
        </button>
      );
    }
  }
}

EditButton.propTypes = {
  currentViewUid: SocrataUid.isRequired,
  currentViewType: PropTypes.string
};

export default EditButton;
