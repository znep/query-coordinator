import _ from 'lodash';
import { UID_REGEX } from 'common/http/constants';

export const checkValidResourceId = (resourceId) => {
  if (!UID_REGEX.test(resourceId)) {
    throw new Error(`${resourceId} is not a valid uid.`);
  }
};

export const checkValidRecordId = (recordId) => {
  if (!_.isNumber(recordId)) {
    throw new Error(`${recordId} is not a valid record id.`);
  }
};
