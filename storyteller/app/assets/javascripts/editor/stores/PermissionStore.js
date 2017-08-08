import _ from 'lodash';

import Environment from '../../StorytellerEnvironment';
import Store from './Store';

/**
 * Responsible for determining whether an action that depends on the current
 * user's domain role, domain rights, or view-specific role is allowed.
 *
 * All information tracked by this store is known at page load; the current user
 * cannot change their own privileges. This means we also don't register
 * handlers for any actions.
 *
 * Cross-reference: user_authorization_helper.rb
 */
export var permissionStore = new PermissionStore();
export default function PermissionStore() {
  _.extend(this, new Store());

  const state = Environment.CURRENT_USER_STORY_AUTHORIZATION;

  this.canPublishCurrentStory = () => {
    const { domainRights, viewRole } = state;

    const canEditOthersStories = _.includes(domainRights, 'edit_others_stories');
    const isOwner = viewRole === 'owner';
    const isAuthorizedByRight = _.includes(domainRights, 'manage_story_public_version');

    return canEditOthersStories || (isOwner && isAuthorizedByRight);
  };
}
