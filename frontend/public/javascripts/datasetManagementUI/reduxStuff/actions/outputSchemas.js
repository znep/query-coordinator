import { parseDate } from 'datasetManagementUI/lib/parseDate';

export const EDIT_OUTPUT_SCHEMA = 'EDIT_OUTPUT_SCHEMA';
export function editOutputSchema(id, payload) {
  return {
    type: EDIT_OUTPUT_SCHEMA,
    id,
    payload: dateHelper(payload)
  };
}

// DSMAPI returns date strings, but we need dates in the store. This checks if
// the payload contains a date string and converts it to date if it does
function dateHelper(payload) {
  const dateProperties = ['created_at', 'finished_at'];

  const properties = Object.keys(payload);

  return properties.reduce((acc, prop) => {
    if (dateProperties.includes(prop)) {
      return {
        ...acc,
        [prop]: parseDate(payload[prop])
      };
    } else {
      return {
        ...acc,
        [prop]: payload[prop]
      };
    }
  }, {});
}
