import _ from 'lodash';
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

const basicTo = name => ic => {
  if (!ic) {
    return `to_${name}(null)`;
  }
  return `to_${name}(\`${ic.field_name}\`)`;
};

const soqlPropertiesList = [
  {
    canonicalName: 'text', // The standard SODA2 API name
    cssName: 'text', // The name used in CSS classes
    icon: 'text',
    conversions: {
      text: basicTo('text'),
      number: basicTo('number'),
      checkbox: basicTo('boolean'),
      calendar_date: (ic, entities) => {
        // to_floating_timestamp takes a format argument. If the user switches
        // something that was guessed as
        // to_floating_timestamp(`datetime_column`, '{YYYY}-{0M}-{0D}')
        // to a text, and then back again, we need to restore the guessed
        // format as well. This means the date dropdown is not as simple as hardcoding
        // a string, since it needs to look at the previous transforms for this input data,
        // find one that is a transform to date, and use that expression

        const originalTransforms = _.orderBy(
          _.filter(
            entities.transforms,
            (t) => {
              const isDatetimeTransform = t.output_soql_type === 'calendar_date';
              const isSameTransform = (
                t.transform_input_columns.length === 1 &&
                t.transform_input_columns[0].input_column_id === ic.id
              );

              return isDatetimeTransform && isSameTransform;
            }
          ),
          'id'
        );
        if (originalTransforms.length) {
          return originalTransforms[0].transform_expr;
        } else {
          return `to_floating_timestamp(\`${ic.field_name}\`)`;
        }
      }
    }
  },
  {
    canonicalName: 'number',
    cssName: 'number',
    icon: 'number',
    conversions: {
      text: basicTo('text'),
      checkbox: basicTo('boolean'),
      number: basicTo('number')
    }
  },
  {
    canonicalName: 'checkbox',
    cssName: 'boolean',
    icon: 'boolean',
    conversions: {
      text: basicTo('text')
    }
  },
  {
    canonicalName: 'calendar_date',
    cssName: 'floatingTimestamp',
    icon: 'date',
    conversions: {
      text: basicTo('text')
    }
  },
  // geo types
  {
    canonicalName: 'location',
    cssName: 'location',
    sodaType: 'location',
    icon: 'map',
    conversions: {
      text: basicTo('text')
    }
  },
  {
    canonicalName: 'point',
    cssName: 'point',
    icon: 'map',
    conversions: {
      text: basicTo('text'),
      point: basicTo('point')
    }
  },
  {
    canonicalName: 'multipoint',
    cssName: 'multipoint',
    icon: 'map',
    conversions: {
      text: basicTo('text'),
      multipoint: basicTo('multipoint')
    }
  },
  {
    canonicalName: 'line',
    cssName: 'line',
    icon: 'map',
    conversions: {
      text: basicTo('text'),
      line: basicTo('line')
    }
  },
  {
    canonicalName: 'multiline',
    cssName: 'multiline',
    icon: 'map',
    conversions: {
      text: basicTo('text'),
      multiline: basicTo('multiline')
    }
  },
  {
    canonicalName: 'polygon',
    cssName: 'polygon',
    icon: 'map',
    conversions: {
      text: basicTo('text'),
      polygon: basicTo('polygon')
    }
  },
  {
    canonicalName: 'multipolygon',
    cssName: 'multipolygon',
    icon: 'map',
    conversions: {
      text: basicTo('text'),
      multipolygon: basicTo('multipolygon')
    }
  }
];

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
