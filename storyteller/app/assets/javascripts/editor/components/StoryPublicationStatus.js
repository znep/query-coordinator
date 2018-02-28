import $ from 'jquery';
import _ from 'lodash';
import moment from 'moment-timezone';
import React, { Component } from 'react';
import classNames from 'classnames';

import { Button } from 'common/components';
import { assetWillEnterApprovalsQueueWhenMadePublic } from 'common/asset/utils';

import I18n from '../I18n';
import Environment from '../../StorytellerEnvironment';
import { assert } from 'common/js_utils';
import { storyPermissionsManager } from '../StoryPermissionsManager';
import { storyStore } from '../stores/StoryStore';
import { storySaveStatusStore} from '../stores/StorySaveStatusStore';

class StoryPublicationStatus extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      hasError: false,
      isPublicationFlannelVisible: false,
      showApprovalMessage: false
    };

    _.bindAll(this, [
      'togglePublicationFlannel',
      'hidePublicationFlannel',
      'runManager',
      'publicize',
      'privatize',
      'renderErrorMessage',
      'renderLastSavedMessage',
      'renderPublicationMessage',
      'renderPublishButton',
      'renderApprovalMessage',
      'renderPrivateButton',
      'renderPublicationFlannel',
      'renderPublicationFlannelOverlay'
    ]);
  }

  componentDidUpdate() {
    const marginLeft = this.statusElement.clientWidth / 2;
    $(this.flannelElement).css('margin-left', `${marginLeft}px`);
  }

  togglePublicationFlannel() {
    const { isPublicationFlannelVisible } = this.state;

    this.setState({
      isPublicationFlannelVisible: !isPublicationFlannelVisible
    });
  }

  hidePublicationFlannel() {
    this.setState({
      isPublicationFlannelVisible: false
    });
  }

  runManager(action) {
    assert(
      _.includes(['makePublic', 'makePrivate'], action),
      'The manager only offers "makePublic" and "makePrivate"'
    );

    this.setState({ isLoading: true, hasError: false });

    storyPermissionsManager[action]().
      then(() => this.setState({ isLoading: false })).
      catch(() => this.setState({ isLoading: false, hasError: true }));
  }

  publicize() {
    this.runManager('makePublic');
  }

  privatize() {
    this.runManager('makePrivate');
  }

  renderErrorMessage() {
    const message = I18n.t('editor.settings_panel.publishing_section.errors.not_published_not_updated');

    return this.state.hasError ?
      <div className="alert error">{message}</div> :
      null;
  }

  renderLastSavedMessage() {
    const { STORY_UID } = Environment;
    const storyUpdatedAt = storyStore.getStoryUpdatedAt(STORY_UID);
    const humanFriendlyUpdatedAt = moment(storyUpdatedAt).calendar().toString();

    return (
      <h5>
        <strong>{I18n.t('editor.settings_panel.publishing_section.saved')}</strong>
        <span>{humanFriendlyUpdatedAt}</span>
        <button className="btn-close" onClick={this.hidePublicationFlannel}>
          <span className="socrata-icon-close-2" />
        </button>
      </h5>
    );
  }

  renderPublicationMessage() {
    const { STORY_UID } = Environment;
    let message;
    const isPublic = storyStore.isStoryPublic(STORY_UID);
    const isDraftUnpublished = storyStore.isDraftUnpublished(STORY_UID);

    if (isPublic && isDraftUnpublished) {
      message = 'previously_published';
    } else if (isPublic) {
      message = 'has_been_published';
    } else {
      message = 'can_be_shared_publicly';
    }

    if (Environment.IS_GOAL) {
      message += '_goals';
    }

    return (
      <p className="alert">
        {I18n.t(`editor.settings_panel.publishing_section.messages.${message}`)}
      </p>
    );
  }

  renderPublishButton() {
    const { STORY_UID } = Environment;
    const { isLoading } = this.state;
    const isPublic = storyStore.isStoryPublic(STORY_UID);
    const isDraftUnpublished = storyStore.isDraftUnpublished(STORY_UID);

    const buttonText = isPublic ?
      'status.update_public_version' :
      'visibility.make_story_public';

    const buttonProps = {
      busy: isLoading,
      className: classNames('btn btn-block btn-publish'),
      dark: false,
      disabled: !isDraftUnpublished,
      onClick: this.publicize,
      size: 'default',
      variant: isPublic ? 'primary' : 'alternate-2'
    };

    return (
      <Button {...buttonProps}>
        {I18n.t(`editor.settings_panel.publishing_section.${buttonText}`)}
      </Button>
    );
  }

  renderApprovalMessage() {
    const { CORE_VIEW } = Environment;
    const { showApprovalMessage } = this.state;

    assetWillEnterApprovalsQueueWhenMadePublic({ coreView: CORE_VIEW }).then((result) => {
      if (showApprovalMessage !== result) {
        this.setState({ showApprovalMessage: result });
      }
    });

    return showApprovalMessage ? (
      <p className="approval-message">
        {I18n.t('editor.settings_panel.publishing_section.approval_message')}
      </p>
    ) : null;
  }

  renderPrivateButton() {
    const { STORY_UID } = Environment;
    const isPublic =  storyStore.isStoryPublic(STORY_UID);
    const buttonAttributes = {
      className: 'btn btn-transparent',
      onClick: this.privatize
    };

    const button = (
      <div className="flannel-actions">
        <button {...buttonAttributes}>
          {I18n.t('editor.settings_panel.publishing_section.visibility.make_story_private')}
        </button>
      </div>
    );

    return isPublic ?  button : null;
  }

  renderPublicationFlannel() {
    const { isPublicationFlannelVisible } = this.state;
    const flannelAttributes = {
      ref: ref => this.flannelElement = ref,
      className: classNames('flannel flannel-right', {
        'flannel-hidden': !isPublicationFlannelVisible
      })
    };

    return (
      <div {...flannelAttributes}>
        <div className="flannel-content">
          {this.renderLastSavedMessage()}
          {this.renderErrorMessage()}
          {this.renderPublishButton()}
          {this.renderApprovalMessage()}
          {this.renderPublicationMessage()}
        </div>
        {this.renderPrivateButton()}
      </div>
    );
  }

  renderPublicationFlannelOverlay() {
    const { isPublicationFlannelVisible } = this.state;
    const flannelOverlayAttributes = {
      className: classNames('flannel-overlay', {
        'flannel-overlay-hidden': !isPublicationFlannelVisible
      }),
      onClick: this.hidePublicationFlannel
    };

    return <div {...flannelOverlayAttributes} />;
  }

  render() {
    const { STORY_UID } = Environment;
    if (!storyStore.doesStoryExist(STORY_UID)) {
      return null; // Story not loaded yet.
    }

    const isDraftUnpublished = storyStore.isDraftUnpublished(STORY_UID);

    const wrapperAttributes = {
      className: classNames('story-publication-status', {
        'disabled': storySaveStatusStore.autosaveDisabled()
      })
    };

    const buttonAttributes = {
      ref: ref => this.statusElement = ref,
      className: 'btn btn-transparent panel-btn',
      onClick: this.togglePublicationFlannel
    };

    const statusIconAttributes = {
      className: classNames('story-publication-status-icon', {
        'unpublished socrata-icon-warning-alt2': isDraftUnpublished,
        'published socrata-icon-checkmark3': !isDraftUnpublished
      })
    };

    const translationKey = isDraftUnpublished ? 'status.draft' : 'status.published';

    return (
      <div {...wrapperAttributes}>
        <button {...buttonAttributes}>
          {I18n.t(`editor.settings_panel.publishing_section.${translationKey}`)}
          <span {...statusIconAttributes} />
        </button>
        {this.renderPublicationFlannel()}
        {this.renderPublicationFlannelOverlay()}
      </div>
    );
  }
}

export default StoryPublicationStatus;
