import _ from 'lodash';
import mixpanelBrowser from 'mixpanel-browser';

const mixpanelConfig = window.mixpanelConfig;

const staticPageData = ({
  'User Id': window.sessionData.userId,
  'User Role Name': window.sessionData.userRoleName,
  'Domain': window.location.hostname,
  'On Page': window.location.pathname,
  'Socrata Employee': window.sessionData.socrataEmployee
});

const userData = _.pick(staticPageData, [
  'User Id',
  'Socrata Employee',
  'User Role Name',
  'Domain'
]);

const additionalPayload = _.pick(staticPageData, [
  'On Page'
]);

/**
 * This is for filtering actions on middleware
 * @type {string}
 */
const TRACK_FIELD = 'analyticsTrackEvent';

/**
 * Creates analytics middleware.
 *
 * This middleware interprets actions which has *analyticsTrackEvent* object defined. This object should have two fields
 * called 'eventName' and 'eventPayload'. Please use `createTrackEventActionData` helper function to create this
 * necessary data.
 *
 * Example action structure:
 * ```js
 * const clickAction = () => ({
 *  type: 'myClickAction',
 *  analyticsTrackEvent: {
 *    eventName: 'click',
 *    eventPayload: {
 *      somePayloadData: 'goesHere'
 *    }
 *  }
 * });
 * ```
 *
 * @returns {Function<Object, Object, Object, Object>} Redux middleware
 */
export const mixpanel = () => next => action => {
  const result = next(action);

  // Check if the action wants to be tracked
  if (_.has(action, TRACK_FIELD)) {
    const { eventName, eventPayload } = action[TRACK_FIELD];
    const finalPayload = _.merge(additionalPayload, eventPayload || {});

    mixpanelBrowser.track(eventName, finalPayload);
  }

  return result;
};

/**
 * Initialize mixpanel, registers and identifies current user;
 */
export const initMixpanel = () => {
  mixpanelBrowser.init(mixpanelConfig.token, mixpanelConfig.options);
  mixpanelBrowser.register(userData);

  const userId = userData['User Id'];
  mixpanelBrowser.identify(userId === 'Not Logged In' ? mixpanelBrowser.get_distinct_id() : userId);
};

/**
 * Creates an action payload for the middleware. Please merge this data with your action's payload. (Hint: if possible
 * please use object spread operator)
 *
 * @param {String} eventName
 * @param {Object} eventPayload
 *
 * @returns {Object}
 */
export const createTrackEventActionData = (eventName, eventPayload) => ({
  [TRACK_FIELD]: {
    eventName,
    eventPayload
  }
});
