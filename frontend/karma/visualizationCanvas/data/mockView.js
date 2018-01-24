export default {
  id: 'test-view',
  name: 'Wombats with Parasols',
  description: 'Something about umbrellas',
  category: 'humor',
  columns: [
    {
      fieldName: 'marsupial_birthday',
      name: 'Marsupial Birthday',
      dataTypeName: 'calendar_date'
    },
    {
      fieldName: 'precipitation',
      name: 'Precipitation (cm)',
      dataTypeName: 'number',
      rangeMin: 0,
      rangeMax: 2.3
    },
    {
      fieldName: 'cnidarian_age',
      name: 'age',
      dataTypeName: 'number'
    },
    {
      fieldName: 'cnidarian_cost',
      name: 'cost',
      dataTypeName: 'money'
    },
    {
      fieldName: 'profile_pic',
      name: 'Picture',
      dataTypeName: 'photo'
    },
    {
      fieldName: 'marsupial_name',
      name: 'Name',
      dataTypeName: 'text'
    },
    {
      fieldName: ':internal_column',
      name: 'Computed Column',
      dataTypeName: 'number'
    },
    {
      fieldName: 'marsupial_location',
      name: 'Marsupial Location',
      dataTypeName: 'point'
    },
    {
      fieldName: 'marsupial_location_state',
      name: 'Marsupial Location (State)',
      dataTypeName: 'text'
    },
    {
      fieldName: 'marsupial_location_zip',
      name: 'Marsupial Location (Zip)',
      dataTypeName: 'text'
    },
    {
      fieldName: 'marsupial_location_city',
      name: 'Marsupial Location (City)',
      dataTypeName: 'text'
    },
    {
      fieldName: 'marsupial_location_address',
      name: 'Marsupial Location (Address)',
      dataTypeName: 'text'
    },
    {
      fieldName: 'marsupial_website',
      name: 'Marsupial Website',
      dataTypeName: 'text'
    },
    {
      fieldName: 'marsupial_website_description',
      name: 'Marsupial Website (description)',
      dataTypeName: 'text'
    },
    {
      fieldName: 'marsupial_phone',
      name: 'Marsupial Phone',
      dataTypeName: 'text'
    },
    {
      fieldName: 'marsupial_phone_type',
      name: 'Marsupial Phone (Type)',
      dataTypeName: 'text'
    }
  ],
  exportFormats: ['csv'],
  lastUpdatedAt: '2016-11-15T12:37:28.000-08:00',
  viewCount: 10
};
