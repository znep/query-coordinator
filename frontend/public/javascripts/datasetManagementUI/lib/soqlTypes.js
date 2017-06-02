// fyi, there's also public/javascripts/datasetLandingPage/lib/dataTypeMetadata.js

function namingTransition(oldStyle) {
  var transitional = {};
  for (var key in oldStyle) {
    var spec = oldStyle[key];
    transitional[key] = { ...spec, newStyle: false };
    transitional[spec.canonicalName] = { ...spec, newStyle: true };
  }
  return transitional;
}

export const soqlProperties = namingTransition({
  SoQLText: {
    canonicalName: 'text', // The standard SODA2 API name
    cssName: 'text', // The name used in CSS classes
    conversionFunction: 'to_text', // Or something falsey if it doesn't exist
    icon: 'text'
  },
  SoQLNumber: {
    canonicalName: 'number',
    cssName: 'number',
    conversionFunction: 'to_number',
    icon: 'number'
  },
  SoQLBoolean: {
    canonicalName: 'checkbox',
    cssName: 'boolean',
    conversionFunction: 'to_boolean',
    icon: 'boolean'
  },
  SoQLFloatingTimestamp: {
    canonicalName: 'calendar_date',
    cssName: 'floatingTimestamp',
    conversionFunction: 'to_floating_timestamp',
    icon: 'date'
  },
  SoQLLocation: {
    canonicalName: 'location',
    cssName: 'location',
    conversionFunction: false,
    sodaType: 'location'
  },
  SoQLPoint: {
    canonicalName: 'point',
    cssName: 'point',
    conversionFunction: false,
    icon: 'map'
  }
});

export const soqlTypes = _.filter(Object.keys(soqlProperties),
                                  (typeName) => soqlProperties[typeName].newStyle);
