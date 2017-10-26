export default {
  'results' :
  [
    {
      'resource' :
      {
        'description' : 'This data is derived from sensor stations placed on bridges and surface streets within city limits.  Each station has a temperature sensor that measures the temperature of the street surface and a sensor that measures the ambient air temperature at the station each second.  Those values are averaged into temperature readings that are recorded by the station every minute.  The dataset is updated every fifteen minutes with new data.',
        'type' : 'dataset',
        'download_count' : null,
        'parent_fxf' : null,
        'createdAt' : '2014-03-04T15:24:22.000Z',
        'provenance' : 'official',
        'page_views' :
        {
          'page_views_total' : 189175,
          'page_views_total_log' : 17.52936954579258,
          'page_views_last_week' : 22,
          'page_views_last_week_log' : 4.523561956057013,
          'page_views_last_month_log' : 6.066089190457772,
          'page_views_last_month' : 66
        },
        'columns_description' : ['', '', '', '', '', ''],
        'name' : 'Road Weather Information Stations',
        'attribution' : 'Department of Transportation',
        'columns_name' :
        [
          'StationName',
          'RoadSurfaceTemperature',
          'StationLocation',
          'DateTime',
          'RecordId',
          'AirTemperature'
        ],
        'id' : 'egc4-d24i',
        'columns_field_name' :
        [
          'stationname',
          'roadsurfacetemperature',
          'stationlocation',
          'datetime',
          'recordid',
          'airtemperature'
        ],
        'view_count' :
        {
          'page_views_total' : 189175,
          'page_views_total_log' : 17.52936954579258,
          'page_views_last_week' : 22,
          'page_views_last_week_log' : 4.523561956057013,
          'page_views_last_month_log' : 6.066089190457772,
          'page_views_last_month' : 66
        },
        'updatedAt' : '2017-05-16T23:24:39.000Z'
      },
      'classification' :
      {
        'categories' : [],
        'tags' : [],
        'domain_category' : 'Transportation',
        'domain_tags' :
        [
          'transportation',
          'seattle',
          'temperature',
          'street',
          'weather',
          'road'
        ],
        'domain_metadata' :
        [
                { 'value' : 'daily', 'key' : 'Refresh-Frequency_Frequency' },
          {
            'value' : 'Department of Transportation',
            'key' : 'Data-Owner_Owner'
          },
          {
            'value' : 'Transportation',
            'key' : 'Data-Owner_Department'
          }
        ]
      },
      'metadata' :
      {
        'domain' : 'data.seattle.gov',
        'license' : 'Public Domain',
        'is_public' : true,
        'is_published' : true,
        'is_hidden' : false,
        'visible_to_anonymous' : true,
        'grants' : []
      },
      'permalink' : 'https://data.seattle.gov/d/egc4-d24i',
      'link' : 'https://data.seattle.gov/Transportation/Road-Weather-Information-Stations/egc4-d24i',
      'owner': {
        'id': '7kqb-5s8x',
        'display_name': 'Dylan'
      }
    },
    {
      'resource' :
      {
        'nbe_fxf' : null,
        'description' : 'This dataset is all the Police responses to 9-1-1 calls within the city. Police response data shows all officers dispatched. To protect the security of a scene, the safety of officers and the public, and sensitive ongoing investigation, these events are added to the data.seattle.gov only after the incident is considered safe to close out. Data is refreshed on a 4 hour interval.',
        'type' : 'dataset',
        'obe_fxf' : null,
        'download_count' : null,
        'parent_fxf' : null,
        'createdAt' : '2010-10-08T16:53:37.000Z',
        'provenance' : 'official',
        'page_views' :
        {
          'page_views_total' : 115504,
          'page_views_total_log' : 16.817595779057132,
          'page_views_last_week_log' : 8.614709844115207,
          'page_views_last_week' : 391,
          'page_views_last_month_log' : 10.711666973564347,
          'page_views_last_month' : 1676
        },
        'columns_description' :
        [
          '',
          'CAD Event Number',
          '',
          'Event Clearance SubGroup',
          'Event Clearance Description',
          'Sector',
          'Latitude',
          'Longitude',
          'Event Clearance Date',
          'Beat',
          'Census_Tract',
          'General Offense Number',
          'Event Clearance Group',
          'CAD CDW ID',
          'Event Clearance Code',
          'Hundred Block Location',
          '',
          '',
          ''
        ],
        'name' : 'Seattle Police Department 911 Incident Response',
        'attribution' : 'City of Seattle, Department of Information Technology, Seattle Police Department',
        'columns_name' :
        [
          'At Scene Time',
          'CAD Event Number',
          'Initial Type Group',
          'Event Clearance SubGroup',
          'Event Clearance Description',
          'District/Sector',
          'Latitude',
          'Longitude',
          'Event Clearance Date',
          'Zone/Beat',
          'Census Tract',
          'General Offense Number',
          'Event Clearance Group',
          'CAD CDW ID',
          'Event Clearance Code',
          'Hundred Block Location',
          'Initial Type Description',
          'Initial Type Subgroup',
          'Incident Location'
        ],
        'columns_field_name' :
        [
          'at_scene_time',
          'cad_event_number',
          'initial_type_group',
          'event_clearance_subgroup',
          'event_clearance_description',
          'district_sector',
          'latitude',
          'longitude',
          'event_clearance_date',
          'zone_beat',
          'census_tract',
          'general_offense_number',
          'event_clearance_group',
          'cad_cdw_id',
          'event_clearance_code',
          'hundred_block_location',
          'initial_type_description',
          'initial_type_subgroup',
          'incident_location'
        ],
        'id' : '3k2p-39jp',
        'view_count' :
        {
          'page_views_total' : 115504,
          'page_views_total_log' : 16.817595779057132,
          'page_views_last_week_log' : 8.614709844115207,
          'page_views_last_week' : 391,
          'page_views_last_month_log' : 10.711666973564347,
          'page_views_last_month' : 1676
        },
        'updatedAt' : '2017-05-16T23:25:56.000Z'
      },
      'classification' :
      {
        'categories' : ['public safety'],
        'tags' : [],
        'domain_category' : 'Public Safety',
        'domain_tags' :
        [
          'census911incidents',
          'incident response',
          'crime',
          'police',
          '911'
        ],
        'domain_metadata' :
        [
                { 'value' : 'hourly', 'key' : 'Refresh-Frequency_Frequency' },
          {
            'value' : 'Department of Information Technology',
            'key' : 'Data-Owner_Owner'
          }
        ]
      },
      'metadata' :
      {
        'domain' : 'data.seattle.gov',
        'license' : 'Creative Commons 1.0 Universal (Public Domain Dedication)',
        'is_public' : true,
        'is_published' : true,
        'is_hidden' : false,
        'visible_to_anonymous' : true,
        'grants' : []
      },
      'permalink' : 'https://data.seattle.gov/d/3k2p-39jp',
      'link' : 'https://data.seattle.gov/Public-Safety/Seattle-Police-Department-911-Incident-Response/3k2p-39jp',
      'owner': {
        'id': '7kqb-5s8x',
        'display_name': 'Dylan'
      }
    },
    {
      'resource' :
      {
        'name' : 'Sold Fleet Equipment',
        'id' : 'y6ef-jf2w',
        'parent_fxf' : null,
        'description' : 'This dataset includes sales data for fleet equipment that was sold in the current and previous two years. This dataset does not include sales data for Seattle City Light (SCL) fleet equipment.',
        'attribution' : null,
        'type' : 'dataset',
        'updatedAt' : '2017-03-30T15:49:30.000Z',
        'createdAt' : '2014-02-06T16:40:51.000Z',
        'view_count' :
        {
          'page_views_last_week' : 500,
          'page_views_last_month' : 2076,
          'page_views_total' : 88186,
          'page_views_last_week_log' : 8.968666793195208,
          'page_views_last_month_log' : 11.020285500844647,
          'page_views_total_log' : 16.42827837753359
        },
        'page_views' :
        {
          'page_views_last_week' : 500,
          'page_views_last_month' : 2076,
          'page_views_total' : 88186,
          'page_views_last_week_log' : 8.968666793195208,
          'page_views_last_month_log' : 11.020285500844647,
          'page_views_total_log' : 16.42827837753359
        },
        'columns_name' :
        [
          'MAKE',
          'YEAR',
          'MODEL',
          'EQUIP_ID',
          'SALE_DATE',
          'SOLD_BY',
          'SALE_PRICE',
          'DESCRIPTION',
          'DEPT'
        ],
        'columns_field_name' :
        [
          'make',
          'year',
          'model',
          'equip_id',
          'sale_date',
          'sold_by',
          'sale_price',
          'description',
          'dept'
        ],
        'columns_description' : ['', '', '', '', '', '', '', '', ''],
        'download_count' : 1363,
        'provenance' : 'official'
      },
      'classification' :
      {
        'categories' : ['transportation', 'finance'],
        'tags' : [],
        'domain_category' : 'City Business',
        'domain_tags' :
              ['surplus', 'auction', 'trucks', 'cars', 'equipment', 'fleet'],
        'domain_metadata' :
        [
                { 'value' : 'Monthly', 'key' : 'Refresh-Frequency_Frequency' },
          {
            'value' : 'Finance and Administrative Services',
            'key' : 'Data-Owner_Owner'
          }
        ]
      },
      'metadata' :
      {
        'domain' : 'data.seattle.gov',
        'license' : 'Public Domain',
        'is_public' : true,
        'is_published' : true,
        'is_hidden' : false,
        'visible_to_anonymous' : true,
        'grants' : []
      },
      'permalink' : 'https://data.seattle.gov/d/y6ef-jf2w',
      'link' : 'https://data.seattle.gov/City-Business/Sold-Fleet-Equipment/y6ef-jf2w',
      'owner': {
        'id': '7kqb-5s8x',
        'display_name': 'Dylan'
      }
    },
    {
      'resource' :
      {
        'name' : 'Current Fleet Surplus/Auction List',
        'id' : '6gnm-7jex',
        'parent_fxf' : null,
        'description' : 'Most recent list of fleet equipment sent to auction',
        'attribution' : 'Fleet Management Division',
        'type' : 'dataset',
        'updatedAt' : '2017-03-31T18:39:32.000Z',
        'createdAt' : '2014-03-25T17:01:36.000Z',
        'view_count' :
        {
          'page_views_last_week' : 503,
          'page_views_last_month' : 2097,
          'page_views_total' : 80655,
          'page_views_last_week_log' : 8.977279923499918,
          'page_views_last_month_log' : 11.034798962577268,
          'page_views_total_log' : 16.299494239009366
        },
        'page_views' :
        {
          'page_views_last_week' : 503,
          'page_views_last_month' : 2097,
          'page_views_total' : 80655,
          'page_views_last_week_log' : 8.977279923499918,
          'page_views_last_month_log' : 11.034798962577268,
          'page_views_total_log' : 16.299494239009366
        },
        'columns_name' :
        [
          'YEAR',
          'MAKE',
          'MODEL',
          'COLOR',
          'EQUIP_ID',
          'DESCRIPTION',
          'AUCTION HOUSE',
          'COMMENTS'
        ],
        'columns_field_name' :
        [
          'year',
          'make',
          'model',
          'color',
          'equip_id',
          'description',
          'auction_house',
          'comments'
        ],
        'columns_description' : ['', '', '', '', '', '', '', ''],
        'download_count' : 1263,
        'provenance' : 'official'
      },
      'classification' :
      {
        'categories' : ['transportation', 'finance'],
        'tags' : [],
        'domain_category' : 'Finance',
        'domain_tags' : ['auction', 'surplus', 'equipment', 'fleet'],
        'domain_metadata' :
        [
                { 'value' : 'Monthly', 'key' : 'Refresh-Frequency_Frequency' },
          {
            'value' : 'Finance and Administrative Services',
            'key' : 'Data-Owner_Owner'
          }
        ]
      },
      'metadata' :
      {
        'domain' : 'data.seattle.gov',
        'license' : 'Public Domain',
        'is_public' : true,
        'is_published' : true,
        'is_hidden' : false,
        'visible_to_anonymous' : true,
        'grants' : []
      },
      'permalink' : 'https://data.seattle.gov/d/6gnm-7jex',
      'link' : 'https://data.seattle.gov/Finance/Current-Fleet-Surplus-Auction-List/6gnm-7jex',
      'owner': {
        'id': '7kqb-5s8x',
        'display_name': 'Dylan'
      }
    },
    {
      'resource' :
      {
        'nbe_fxf' : null,
        'description' : 'These incidents are based on initial police reports taken by officers when responding to incidents around the city. The information enters our Records Management System (RMS) and is then transmitted out to data.seattle.gov. This information is published within 6 to 12 hours after the report is filed into the system.',
        'type' : 'dataset',
        'obe_fxf' : null,
        'download_count' : null,
        'parent_fxf' : null,
        'createdAt' : '2010-07-28T16:55:15.000Z',
        'provenance' : 'official',
        'page_views' :
        {
          'page_views_total' : 70288,
          'page_views_total_log' : 16.101011309428216,
          'page_views_last_week_log' : 8.169925001442312,
          'page_views_last_week' : 287,
          'page_views_last_month_log' : 10.122827994807668,
          'page_views_last_month' : 1114
        },
        'columns_description' :
        [
          'Zone/Beat',
          'District/Sector',
          'Summary Offense Code',
          'RMS CDW ID',
          'Offense Type',
          'Month crime occurred, specifically added for grouping and external usage',
          'Summarized_Offense_Description',
          'Hundred Block Location\n',
          'Date Reported ',
          'Occurred Date or Date Range Start',
          '',
          'Census Tract 2000',
          'Year crime occurred, specifically added for grouping and external usage',
          'General Offense Number\n',
          'Offense_Code',
          'Latitude',
          'Occurred Date Range End',
          'Longitude',
          'Offense_Code_Extension'
        ],
        'name' : 'Seattle Police Department Police Report Incident',
        'attribution' : 'City of Seattle, Department of Information Technology, Seattle Police Department',
        'columns_name' :
        [
          'Zone/Beat',
          'District/Sector',
          'Summary Offense Code',
          'RMS CDW ID',
          'Offense Type',
          'Month',
          'Summarized Offense Description',
          'Hundred Block Location',
          'Date Reported',
          'Occurred Date or Date Range Start',
          'Location',
          'Census Tract 2000',
          'Year',
          'General Offense Number',
          'Offense Code',
          'Latitude',
          'Occurred Date Range End',
          'Longitude',
          'Offense Code Extension'
        ],
        'columns_field_name' :
        [
          'zone_beat',
          'district_sector',
          'summary_offense_code',
          'rms_cdw_id',
          'offense_type',
          'month',
          'summarized_offense_description',
          'hundred_block_location',
          'date_reported',
          'occurred_date_or_date_range_start',
          'location',
          'census_tract_2000',
          'year',
          'general_offense_number',
          'offense_code',
          'latitude',
          'occurred_date_range_end',
          'longitude',
          'offense_code_extension'
        ],
        'id' : '7ais-f98f',
        'view_count' :
        {
          'page_views_total' : 70288,
          'page_views_total_log' : 16.101011309428216,
          'page_views_last_week_log' : 8.169925001442312,
          'page_views_last_week' : 287,
          'page_views_last_month_log' : 10.122827994807668,
          'page_views_last_month' : 1114
        },
        'updatedAt' : '2017-05-16T23:27:06.000Z'
      },
      'classification' :
      {
        'categories' : ['public safety'],
        'tags' : [],
        'domain_category' : 'Public Safety',
        'domain_tags' :
              ['census911incidents', 'police report', 'police', 'crime'],
        'domain_metadata' :
        [
                { 'value' : 'daily', 'key' : 'Refresh-Frequency_Frequency' },
          {
            'value' : 'Department of Information Technology',
            'key' : 'Data-Owner_Owner'
          }
        ]
      },
      'metadata' :
      {
        'domain' : 'data.seattle.gov',
        'license' : 'Creative Commons 1.0 Universal (Public Domain Dedication)',
        'is_public' : true,
        'is_published' : true,
        'is_hidden' : false,
        'visible_to_anonymous' : true,
        'grants' : [{ 'user_id' : '5cvb-camt', 'type' : 'owner' }]
      },
      'permalink' : 'https://data.seattle.gov/d/7ais-f98f',
      'link' : 'https://data.seattle.gov/Public-Safety/Seattle-Police-Department-Police-Report-Incident/7ais-f98f',
      'owner': {
        'id': '7kqb-5s8x',
        'display_name': 'Dylan'
      }
    },
    {
      'resource' :
      {
        'nbe_fxf' : null,
        'description' : 'Provides Seattle Fire Department 911 dispatches. Updated every 5 minutes.',
        'type' : 'dataset',
        'obe_fxf' : null,
        'download_count' : null,
        'parent_fxf' : null,
        'createdAt' : '2010-01-08T21:48:17.000Z',
        'provenance' : 'official',
        'page_views' :
        {
          'page_views_total' : 55675,
          'page_views_total_log' : 15.764767945128023,
          'page_views_last_week_log' : 5.20945336562895,
          'page_views_last_week' : 36,
          'page_views_last_month_log' : 7.7414669864011465,
          'page_views_last_month' : 213
        },
        'columns_description' :
        [
          'This is the longitude value. Lines of longitude run perpendicular to lines of latitude, and all pass through both poles.',
          'Location of Incident',
          '',
          'The date and time of the call.',
          'This is the latitude value. Lines of latitude are parallel to the equator.',
          '',
          'Response Type'
        ],
        'name' : 'Seattle Real Time Fire 911 Calls',
        'attribution' : 'City of Seattle Fire Department MIS',
        'columns_name' :
        [
          'Longitude',
          'Address',
          'Report Location',
          'Datetime',
          'Latitude',
          'Incident Number',
          'Type'
        ],
        'columns_field_name' :
        [
          'longitude',
          'address',
          'report_location',
          'datetime',
          'latitude',
          'incident_number',
          'type'
        ],
        'id' : 'kzjm-xkqj',
        'view_count' :
        {
          'page_views_total' : 55675,
          'page_views_total_log' : 15.764767945128023,
          'page_views_last_week_log' : 5.20945336562895,
          'page_views_last_week' : 36,
          'page_views_last_month_log' : 7.7414669864011465,
          'page_views_last_month' : 213
        },
        'updatedAt' : '2017-05-16T23:28:12.000Z'
      },
      'classification' :
      {
        'categories' : ['politics', 'public safety'],
        'tags' : [],
        'domain_category' : 'Public Safety',
        'domain_tags' :
              ['sfd mobile', 'dispatch e911', 'fire', '911', 'seattle'],
        'domain_metadata' :
        [
          {
            'value' : '5 minutes',
            'key' : 'Refresh-Frequency_Frequency'
          },
          {
            'value' : 'Seattle Fire Department',
            'key' : 'Data-Owner_Owner'
          }
        ]
      },
      'metadata' :
      {
        'domain' : 'data.seattle.gov',
        'license' : 'Creative Commons 1.0 Universal (Public Domain Dedication)',
        'is_public' : true,
        'is_published' : true,
        'is_hidden' : false,
        'visible_to_anonymous' : true,
        'grants' : [{ 'user_id' : '5rii-9ghs', 'type' : 'owner' }]
      },
      'permalink' : 'https://data.seattle.gov/d/kzjm-xkqj',
      'link' : 'https://data.seattle.gov/Public-Safety/Seattle-Real-Time-Fire-911-Calls/kzjm-xkqj',
      'owner': {
        'id': '7kqb-5s8x',
        'display_name': 'Dylan'
      }
    }
  ],
  'resultSetSize' : 6,
  'timings' : { 'serviceMillis' : 30, 'searchMillis' : [6, 5] }
};
