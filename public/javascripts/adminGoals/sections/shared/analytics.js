import * as Middlewares from '../../middlewares';

export const createTrackEventActionData = Middlewares.analytics.createTrackEventActionData;

export const EventNames = {
  manageOnGoalPage: 'Manage on goal page',
  quickEditGoal: 'Quick edit goal',
  bulkEditGoal: 'Bulk edit goal',
  clickUpdateOnQuickEdit: 'Click Update on Quickedit',
  clickUpdateOnBulkEdit: 'Click Update on Bulkedit'
};

export const EventPayloadKeys = {
  goalId: 'Goal Id'
};
