export const soqlProperties = {
  'SoQLText': { canonicalName: 'text' },
  'SoQLNumber': { canonicalName: 'number' },
  'SoQLBoolean': { canonicalName: 'boolean' },
  'SoQLFixedTimestamp': { canonicalName: 'fixed_timestamp' },
  'SoQLFloatingTimestamp': { canonicalName: 'floating_timestamp' },
  'SoQLLocation': { canonicalName: 'location' },
  'SoQLPoint': { canonicalName: 'point' }
};

export const soqlTypes = Object.keys(soqlProperties);
