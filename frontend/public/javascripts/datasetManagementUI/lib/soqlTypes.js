// fyi, there's also public/javascripts/datasetLandingPage/lib/dataTypeMetadata.js

/*
available transform functions:

text -> number
text -> boolean
text -> fixed_timestamp
text -> floating_timestamp
number -> text
number -> boolean
boolean -> text
boolean -> number
point -> text
multipoint -> text
line -> text
multiline -> text
polygon -> text
multipolygon -> text

why are the canonical names different
than the names in the transform functions
 */

const addIdentityTransforms = typePropertiesList =>
  typePropertiesList.map(typeInfo => ({
    ...typeInfo,
    conversions: {
      ...typeInfo.conversions,
      [typeInfo.canonicalName]: `to_${typeInfo.canonicalName}`
    }
  }));

const soqlPropertiesList = addIdentityTransforms([
  {
    canonicalName: 'text', // The standard SODA2 API name
    cssName: 'text', // The name used in CSS classes
    icon: 'text',
    conversions: {
      number: 'to_number',
      checkbox: 'to_boolean',
      calendar_date: 'to_floating_timestamp'
    }
  },
  {
    canonicalName: 'number',
    cssName: 'number',
    icon: 'number',
    conversions: {
      text: 'to_text',
      checkbox: 'to_boolean'
    }
  },
  {
    canonicalName: 'checkbox',
    cssName: 'boolean',
    icon: 'boolean',
    conversions: {
      text: 'to_text'
    }
  },
  {
    canonicalName: 'calendar_date',
    cssName: 'floatingTimestamp',
    icon: 'date',
    conversions: {
      text: 'to_text'
    }
  },
  // geo types
  {
    canonicalName: 'location',
    cssName: 'location',
    sodaType: 'location',
    icon: 'map',
    conversions: {
      text: 'to_text'
    }
  },
  {
    canonicalName: 'point',
    cssName: 'point',
    icon: 'map',
    conversions: {
      text: 'to_text'
    }
  },
  {
    canonicalName: 'multipoint',
    cssName: 'multipoint',
    icon: 'map',
    conversions: {
      text: 'to_text'
    }
  },
  {
    canonicalName: 'line',
    cssName: 'line',
    icon: 'map',
    conversions: {
      text: 'to_text'
    }
  },
  {
    canonicalName: 'multiline',
    cssName: 'multiline',
    icon: 'map',
    conversions: {
      text: 'to_text'
    }
  },
  {
    canonicalName: 'polygon',
    cssName: 'polygon',
    icon: 'map',
    conversions: {
      text: 'to_text'
    }
  },
  {
    canonicalName: 'multipolygon',
    cssName: 'multipolygon',
    icon: 'map',
    conversions: {
      text: 'to_text'
    }
  }
]);

export const soqlProperties = soqlPropertiesList.reduce(
  (acc, typespec) => ({
    ...acc,
    [typespec.canonicalName]: typespec
  }),
  {}
);

export const soqlTypes = Object.keys(soqlProperties);

export const conversionsToCanonicalName = conversion => {
  switch (conversion) {
    case 'to_number':
      return 'number';
    case 'to_boolean':
      return 'checkbox';
    case 'to_floating_timestamp':
      return 'calendar_date';
    default:
      return 'text';
  }
};
