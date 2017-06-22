// fyi, there's also public/javascripts/datasetLandingPage/lib/dataTypeMetadata.js

const soqlPropertiesList = [
  {
    canonicalName: 'text', // The standard SODA2 API name
    cssName: 'text', // The name used in CSS classes
    conversionFunction: 'to_text', // Or something falsey if it doesn't exist
    icon: 'text'
  },
  {
    canonicalName: 'number',
    cssName: 'number',
    conversionFunction: 'to_number',
    icon: 'number'
  },
  {
    canonicalName: 'checkbox',
    cssName: 'boolean',
    conversionFunction: 'to_boolean',
    icon: 'boolean'
  },
  {
    canonicalName: 'calendar_date',
    cssName: 'floatingTimestamp',
    conversionFunction: 'to_floating_timestamp',
    icon: 'date'
  },
  {
    canonicalName: 'location',
    cssName: 'location',
    conversionFunction: false,
    sodaType: 'location'
  },
  {
    canonicalName: 'point',
    cssName: 'point',
    conversionFunction: false,
    icon: 'map'
  }
];

export const soqlProperties =
  soqlPropertiesList.reduce((acc, typespec) => ({
    ...acc,
    [typespec.canonicalName]: typespec
  }), {});

export const soqlTypes = Object.keys(soqlProperties);
