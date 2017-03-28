// fyi, there's also public/javascripts/datasetLandingPage/lib/dataTypeMetadata.js

export const soqlProperties = {
  SoQLText: {
    canonicalName: 'text', // The standard SODA2 API name
    conversionTarget: true, // Whether a simple to_$canonicalname function exists
    icon: 'text'
  },
  SoQLNumber: {
    canonicalName: 'number',
    conversionTarget: true,
    icon: 'number'
  },
  SoQLBoolean: {
    canonicalName: 'boolean',
    conversionTarget: true,
    icon: 'boolean'
  },
  SoQLFloatingTimestamp: {
    canonicalName: 'floatingTimestamp',
    conversionTarget: true,
    icon: 'date'
  },
  SoQLLocation: {
    canonicalName: 'location',
    conversionTarget: false,
    sodaType: 'location'
  },
  SoQLPoint: {
    canonicalName: 'point',
    conversionTarget: false,
    icon: 'map'
  }
};

export const soqlTypes = Object.keys(soqlProperties);
