export const soqlProperties = {
  'SoQLText': {
    canonicalName: 'text', // The standard SODA2 API name
    conversionTarget: true // Whether a simple to_$canonicalname function exists
  },
  'SoQLNumber': {
    canonicalName: 'number',
    conversionTarget: true
  },
  'SoQLBoolean': {
    canonicalName: 'boolean',
    conversionTarget: true
  },
  'SoQLFixedTimestamp': {
    canonicalName: 'fixed_timestamp',
    conversionTarget: true
  },
  'SoQLFloatingTimestamp': {
    canonicalName: 'floating_timestamp',
    conversionTarget: true
  },
  'SoQLLocation': {
    canonicalName: 'location',
    conversionTarget: false
  },
  'SoQLPoint': {
    canonicalName: 'point',
    conversionTarget: false
  }
};

export const soqlTypes = Object.keys(soqlProperties);
