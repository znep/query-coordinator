import * as Middlewares from '../../middlewares';

export const createTrackEventActionData = Middlewares.analytics.createTrackEventActionData;

export const EventNames = {
  manageOnGoalPage: 'Clicked Manage on Goal Page',
  quickEditGoal: 'Opened Quick Edit Form',
  bulkEditGoal: 'Opened Bulk Edit Form',
  clickUpdateOnQuickEdit: 'Clicked Update on Quick Edit',
  clickUpdateOnBulkEdit: 'Clicked Update on Bulk Edit'
};

export const EventPayloadKeys = {
  goalId: 'Goal Id'
};
