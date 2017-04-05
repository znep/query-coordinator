// fyi, there's also public/javascripts/datasetLandingPage/lib/dataTypeMetadata.js

export const soqlProperties = {
  SoQLText: {
    canonicalName: 'text', // The standard SODA2 API name
    cssName: 'text', // The name used in CSS classes
    conversionTarget: true, // Whether a simple to_$canonicalname function exists
    icon: 'text'
  },
  SoQLNumber: {
    canonicalName: 'number',
    cssName: 'number',
    conversionTarget: true,
    icon: 'number'
  },
  SoQLBoolean: {
    canonicalName: 'boolean',
    cssName: 'boolean',
    conversionTarget: true,
    icon: 'boolean'
  },
  SoQLFloatingTimestamp: {
    canonicalName: 'floating_timestamp',
    cssName: 'floatingTimestamp',
    conversionTarget: true,
    icon: 'date'
  },
  SoQLLocation: {
    canonicalName: 'location',
    cssName: 'location',
    conversionTarget: false,
    sodaType: 'location'
  },
  SoQLPoint: {
    canonicalName: 'point',
    cssName: 'point',
    conversionTarget: false,
    icon: 'map'
  }
};

export const soqlTypes = Object.keys(soqlProperties);
