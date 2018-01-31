/* eslint-disable */
export default {
  CHICAGO_CRIMES_DATASET_METADATA: {
    'id' : '6zsd-86xi',
    'name' : 'Crimes - 2001 to present',
    'attribution' : 'Chicago Police Department',
    'attributionLink' : 'https://portal.chicagopolice.org/portal/page/portal/ClearPath',
    'averageRating' : 0,
    'category' : 'Public Safety',
    'createdAt' : 1424378962,
    'description' : "This dataset reflects reported incidents of crime (with the exception of murders where data exists for each victim) that occurred in the City of Chicago from 2001 to present, minus the most recent seven days. Data is extracted from the Chicago Police Department's CLEAR (Citizen Law Enforcement Analysis and Reporting) system. In order to protect the privacy of crime victims, addresses are shown at the block level only and specific locations are not identified. Should you have questions about this dataset, you may contact the Research & Development Division of the Chicago Police Department at 312.745.6071 or RDAnalysis@chicagopolice.org.  Disclaimer: These crimes may be based upon preliminary information supplied to the Police Department by the reporting parties that have not been verified. The preliminary crime classifications may be changed at a later date based upon additional investigation and there is always the possibility of mechanical or human error. Therefore, the Chicago Police Department does not guarantee (either expressed or implied) the accuracy, completeness, timeliness, or correct sequencing of the information and the information should not be used for comparison purposes over time. The Chicago Police Department will not be responsible for any error or omission, or for the use of, or the results obtained from the use of this information. All data visualizations on maps should be considered approximate and attempts to derive specific addresses are strictly prohibited. The Chicago Police Department is not responsible for the content of any off-site pages that are referenced by or that reference this web page other than an official City of Chicago or Chicago Police Department web page. The user specifically acknowledges that the Chicago Police Department is not responsible for any defamatory, offensive, misleading, or illegal conduct of other users, links, or third parties and that the risk of injury from the foregoing rests entirely with the user.  The unauthorized use of the words \"Chicago Police Department,\" \"Chicago Police,\" or any colorable imitation of these words or the unauthorized use of the Chicago Police Department logo is unlawful. This web page does not, in any way, authorize such use. Data are updated daily. The dataset contains more than 65,000 records/rows of data and cannot be viewed in full in Microsoft Excel. Therefore, when downloading the file, select CSV from the Export menu. Open the file in an ASCII text editor, such as Wordpad, to view and search. To access a list of Chicago Police Department - Illinois Uniform Crime Reporting (IUCR) codes, go to http://data.cityofchicago.org/Public-Safety/Chicago-Police-Department-Illinois-Uniform-Crime-R/c7ck-438e",
    'displayType' : 'table',
    'downloadCount' : 2,
    'newBackend' : true,
    'numberOfComments' : 0,
    'oid' : 11242039,
    'publicationAppendEnabled' : false,
    'publicationDate' : 1431544858,
    'publicationGroup' : 2278000,
    'publicationStage' : 'published',
    'rowIdentifierColumnId' : 203618251,
    'rowsUpdatedAt' : 1453297379,
    'rowsUpdatedBy' : 'scy9-9wg4',
    'tableId' : 2826904,
    'totalTimesRated' : 0,
    'viewCount' : 34,
    'viewLastModified' : 1431571524,
    'viewType' : 'tabular',
    'columns' : [{
      'id' : 203618252,
      'name' : 'Case Number',
      'dataTypeName' : 'text',
      'fieldName' : 'case_number',
      'position' : 2,
      'renderTypeName' : 'text',
      'tableColumnId' : 24781985,
      'width' : 134,
      'format' : {
        'aggregate' : 'count',
        'align' : 'left'
      }
    }, {
      'id' : 203618251,
      'name' : 'ID',
      'dataTypeName' : 'number',
      'fieldName' : 'id',
      'position' : 1,
      'renderTypeName' : 'number',
      'tableColumnId' : 24781984,
      'width' : 100,
      'format' : {
        'precisionStyle' : 'standard',
        'align' : 'right',
        'noCommas' : 'true'
      }
    }, {
      'id' : 203618253,
      'name' : 'Date',
      'dataTypeName' : 'calendar_date',
      'fieldName' : 'date',
      'position' : 3,
      'renderTypeName' : 'calendar_date',
      'tableColumnId' : 24781986,
      'width' : 148,
      'format' : {
        'align' : 'left',
        'view' : 'date_time'
      }
    }, {
      'id' : 203618254,
      'name' : 'Block',
      'dataTypeName' : 'text',
      'fieldName' : 'block',
      'position' : 4,
      'renderTypeName' : 'text',
      'tableColumnId' : 24781987,
      'width' : 160,
      'format' : { }
    }, {
      'id' : 203618255,
      'name' : 'IUCR',
      'dataTypeName' : 'text',
      'fieldName' : 'iucr',
      'position' : 5,
      'renderTypeName' : 'text',
      'tableColumnId' : 24781988,
      'width' : 148,
      'format' : { }
    }, {
      'id' : 203618256,
      'name' : 'Primary Type',
      'dataTypeName' : 'text',
      'fieldName' : 'primary_type',
      'position' : 6,
      'renderTypeName' : 'text',
      'tableColumnId' : 24781989,
      'width' : 244,
      'format' : { }
    }, {
      'id' : 203618257,
      'name' : 'Description',
      'dataTypeName' : 'text',
      'fieldName' : 'description',
      'position' : 7,
      'renderTypeName' : 'text',
      'tableColumnId' : 24781990,
      'width' : 232,
      'format' : { }
    }, {
      'id' : 203618258,
      'name' : 'Location Description',
      'dataTypeName' : 'text',
      'fieldName' : 'location_description',
      'position' : 8,
      'renderTypeName' : 'text',
      'tableColumnId' : 24781991,
      'width' : 340,
      'format' : { }
    }, {
      'id' : 203618259,
      'name' : 'Arrest',
      'dataTypeName' : 'checkbox',
      'fieldName' : 'arrest',
      'position' : 9,
      'renderTypeName' : 'checkbox',
      'tableColumnId' : 24781992,
      'width' : 172,
      'format' : { }
    }, {
      'id' : 203618260,
      'name' : 'Domestic',
      'dataTypeName' : 'checkbox',
      'fieldName' : 'domestic',
      'position' : 10,
      'renderTypeName' : 'checkbox',
      'tableColumnId' : 24781993,
      'width' : 196,
      'format' : { }
    }, {
      'id' : 203618261,
      'name' : 'Beat',
      'dataTypeName' : 'text',
      'fieldName' : 'beat',
      'position' : 11,
      'renderTypeName' : 'text',
      'tableColumnId' : 24781994,
      'width' : 148,
      'format' : { }
    }, {
      'id' : 203618262,
      'name' : 'District',
      'dataTypeName' : 'text',
      'description' : 'District',
      'fieldName' : 'district',
      'position' : 12,
      'renderTypeName' : 'text',
      'tableColumnId' : 24781995,
      'width' : 100,
      'format' : { }
    }, {
      'id' : 203618263,
      'name' : 'Ward',
      'dataTypeName' : 'number',
      'fieldName' : 'ward',
      'position' : 13,
      'renderTypeName' : 'number',
      'tableColumnId' : 24781996,
      'width' : 148,
      'format' : { }
    }, {
      'id' : 203618264,
      'name' : 'Community Area',
      'dataTypeName' : 'text',
      'description' : 'Community Area',
      'fieldName' : 'community_area',
      'position' : 14,
      'renderTypeName' : 'text',
      'tableColumnId' : 24781997,
      'width' : 100,
      'format' : { }
    }, {
      'id' : 203618265,
      'name' : 'FBI Code',
      'dataTypeName' : 'text',
      'fieldName' : 'fbi_code',
      'position' : 15,
      'renderTypeName' : 'text',
      'tableColumnId' : 24781998,
      'width' : 196,
      'format' : { }
    }, {
      'id' : 203618266,
      'name' : 'X Coordinate',
      'dataTypeName' : 'number',
      'fieldName' : 'x_coordinate',
      'position' : 16,
      'renderTypeName' : 'number',
      'tableColumnId' : 24781999,
      'width' : 244,
      'format' : {
        'precisionStyle' : 'standard',
        'noCommas' : 'true',
        'align' : 'right'
      }
    }, {
      'id' : 203618267,
      'name' : 'Y Coordinate',
      'dataTypeName' : 'number',
      'fieldName' : 'y_coordinate',
      'position' : 17,
      'renderTypeName' : 'number',
      'tableColumnId' : 24782000,
      'width' : 244,
      'format' : {
        'precisionStyle' : 'standard',
        'noCommas' : 'true',
        'align' : 'right'
      }
    }, {
      'id' : 203618268,
      'name' : 'Year',
      'dataTypeName' : 'number',
      'fieldName' : 'year',
      'position' : 18,
      'renderTypeName' : 'number',
      'tableColumnId' : 24782002,
      'width' : 100,
      'format' : {
        'precisionStyle' : 'standard',
        'align' : 'right',
        'noCommas' : 'true'
      }
    }, {
      'id' : 203618269,
      'name' : 'Updated On',
      'dataTypeName' : 'calendar_date',
      'fieldName' : 'updated_on',
      'position' : 19,
      'renderTypeName' : 'calendar_date',
      'tableColumnId' : 24782003,
      'width' : 100,
      'format' : { }
    }, {
      'id' : 203618270,
      'name' : 'Latitude',
      'dataTypeName' : 'number',
      'fieldName' : 'latitude',
      'position' : 20,
      'renderTypeName' : 'number',
      'tableColumnId' : 24782004,
      'width' : 196,
      'format' : { }
    }, {
      'id' : 203618271,
      'name' : 'Longitude',
      'dataTypeName' : 'number',
      'fieldName' : 'longitude',
      'position' : 21,
      'renderTypeName' : 'number',
      'tableColumnId' : 24782005,
      'width' : 208,
      'format' : { }
    }, {
      'id' : 203618272,
      'name' : 'Location',
      'dataTypeName' : 'point',
      'fieldName' : 'location',
      'position' : 22,
      'renderTypeName' : 'point',
      'tableColumnId' : 24782006,
      'format' : { }
    }, {
      'id' : 203618273,
      'name' : 'Location (city)',
      'dataTypeName' : 'text',
      'fieldName' : 'location_city',
      'position' : 23,
      'renderTypeName' : 'text',
      'tableColumnId' : 27782209,
      'format' : { }
    }, {
      'id' : 203618274,
      'name' : 'Location (address)',
      'dataTypeName' : 'text',
      'fieldName' : 'location_address',
      'position' : 24,
      'renderTypeName' : 'text',
      'tableColumnId' : 27782210,
      'format' : { }
    }, {
      'id' : 203618275,
      'name' : 'Location (zip)',
      'dataTypeName' : 'text',
      'fieldName' : 'location_zip',
      'position' : 25,
      'renderTypeName' : 'text',
      'tableColumnId' : 27782211,
      'format' : { }
    }, {
      'id' : 203618276,
      'name' : 'Location (state)',
      'dataTypeName' : 'text',
      'fieldName' : 'location_state',
      'position' : 26,
      'renderTypeName' : 'text',
      'tableColumnId' : 27782212,
      'format' : { }
    }, {
      'id' : 203618277,
      'name' : 'Historical Wards 2003-2015',
      'dataTypeName' : 'number',
      'fieldName' : ':@computed_region_awaf_s7ux',
      'position' : 27,
      'renderTypeName' : 'number',
      'tableColumnId' : 27782213,
      'format' : { }
    }, {
      'id' : 203618278,
      'name' : 'Zip Codes',
      'dataTypeName' : 'number',
      'fieldName' : ':@computed_region_6mkv_f3dw',
      'position' : 28,
      'renderTypeName' : 'number',
      'tableColumnId' : 27782214,
      'format' : { }
    }, {
      'id' : 203618279,
      'name' : 'Community Areas',
      'dataTypeName' : 'number',
      'fieldName' : ':@computed_region_vrxf_vc4k',
      'position' : 29,
      'renderTypeName' : 'number',
      'tableColumnId' : 27782215,
      'format' : { }
    }, {
      'id' : 203618280,
      'name' : 'Census Tracts',
      'dataTypeName' : 'number',
      'fieldName' : ':@computed_region_bdys_3d7i',
      'position' : 30,
      'renderTypeName' : 'number',
      'tableColumnId' : 27782216,
      'format' : { }
    }, {
      'id' : 203618281,
      'name' : 'Wards',
      'dataTypeName' : 'number',
      'description' : '',
      'fieldName' : ':@computed_region_43wa_7qmu',
      'position' : 32,
      'renderTypeName' : 'number',
      'tableColumnId' : 28240039,
      'format' : { }
    }],
    'grants' : [{
      'inherited' : false,
      'type' : 'viewer',
      'flags' : ['public']
    }],
    'metadata' : {
      'custom_fields' : {
        'Metadata' : {
          'Data Owner' : 'Police',
          'Time Period' : '2001 to present, minus the most recent seven days',
          'Frequency' : 'Data are updated daily.'
        }
      },
      'renderTypeConfig' : {
        'visible' : {
          'table' : true
        }
      },
      'availableDisplayTypes' : ['table', 'fatrow', 'page'],
      'jsonQuery' : {
        'order' : [{
          'ascending' : false,
          'columnFieldName' : 'date'
        }]
      },
      'rdfSubject' : '0',
      'rowIdentifier' : 203618251
    },
    'owner' : {
      'id' : 'scy9-9wg4',
      'displayName' : 'cocadmin',
      'privilegesDisabled' : false,
      'profileImageUrlLarge' : '/api/users/scy9-9wg4/profile_images/LARGE',
      'profileImageUrlMedium' : '/api/users/scy9-9wg4/profile_images/THUMB',
      'profileImageUrlSmall' : '/api/users/scy9-9wg4/profile_images/TINY',
      'roleName' : 'administrator',
      'screenName' : 'cocadmin',
      'rights' : ['create_datasets', 'edit_others_datasets', 'edit_sdp', 'edit_site_theme', 'moderate_comments', 'manage_users', 'chown_datasets', 'edit_nominations', 'approve_nominations', 'feature_items', 'federations', 'manage_stories', 'manage_approval', 'change_configurations', 'view_domain', 'view_others_datasets', 'edit_pages', 'create_pages', 'view_goals', 'view_dashboards', 'edit_goals', 'edit_dashboards', 'create_dashboards', 'manage_provenance']
    },
    'query' : {
      'orderBys' : [{
        'ascending' : false,
        'expression' : {
          'columnId' : 203618253,
          'type' : 'column'
        }
      }]
    },
    'rights' : ['read'],
    'sortBys' : [{
      'id' : 0,
      'viewColumnId' : 203618253
    }],
    'tableAuthor' : {
      'id' : 'scy9-9wg4',
      'displayName' : 'cocadmin',
      'privilegesDisabled' : false,
      'profileImageUrlLarge' : '/api/users/scy9-9wg4/profile_images/LARGE',
      'profileImageUrlMedium' : '/api/users/scy9-9wg4/profile_images/THUMB',
      'profileImageUrlSmall' : '/api/users/scy9-9wg4/profile_images/TINY',
      'roleName' : 'administrator',
      'screenName' : 'cocadmin',
      'rights' : ['create_datasets', 'edit_others_datasets', 'edit_sdp', 'edit_site_theme', 'moderate_comments', 'manage_users', 'chown_datasets', 'edit_nominations', 'approve_nominations', 'feature_items', 'federations', 'manage_stories', 'manage_approval', 'change_configurations', 'view_domain', 'view_others_datasets', 'edit_pages', 'create_pages', 'view_goals', 'view_dashboards', 'edit_goals', 'edit_dashboards', 'create_dashboards', 'manage_provenance']
    },
    'tags' : ['crime', 'police'],
    'flags' : ['default']
  },
  CHICAGO_CRIMES_SAMPLE_ROW_RESPONSE:
    [{ 'arrest':false, 'beat':'0511', 'block':'0000X E 100 PL', 'case_number':'HH291477', 'date':'2002-04-07T14:45:00.000', 'description':'HARASSMENT BY TELEPHONE', 'district':'005', 'domestic':false, 'fbi_code':'26', 'id':'2068284', 'iucr':'2825', 'latitude':'41.711840612', 'location':{ 'type':'Point', 'coordinates':[-87.622652, 41.711841] }, 'location_description':'RESIDENCE', 'longitude':'-87.622651588', 'primary_type':'OTHER OFFENSE', 'updated_on':'2016-01-15T11:08:45.000', 'x_coordinate':'1178292', 'y_coordinate':'1838387', 'year':'2002' }
    , { 'arrest':true, 'beat':'0511', 'block':'0000X E 100 PL', 'case_number':'HH221526', 'date':'2002-03-04T14:10:00.000', 'description':'POSS: CANNABIS 30GMS OR LESS', 'district':'005', 'domestic':false, 'fbi_code':'18', 'id':'2019571', 'iucr':'1811', 'latitude':'41.711860505', 'location':{ 'type':'Point', 'coordinates':[-87.621432, 41.711861] }, 'location_description':'RESIDENCE', 'longitude':'-87.621431758', 'primary_type':'NARCOTICS', 'updated_on':'2016-01-15T11:08:45.000', 'x_coordinate':'1178625', 'y_coordinate':'1838397', 'year':'2002' }
    , { 'arrest':false, 'beat':'0511', 'block':'0000X E 100 PL', 'case_number':'HH189467', 'date':'2002-02-07T18:00:00.000', 'description':'TELEPHONE THREAT', 'district':'005', 'domestic':true, 'fbi_code':'26', 'id':'1989439', 'iucr':'2820', 'latitude':'41.711628886', 'location':{ 'type':'Point', 'coordinates':[-87.622141, 41.711629] }, 'location_description':'RESIDENCE', 'longitude':'-87.622141173', 'primary_type':'OTHER OFFENSE', 'updated_on':'2016-01-15T11:08:45.000', 'x_coordinate':'1178432', 'y_coordinate':'1838311', 'year':'2002' }
    , { 'arrest':false, 'beat':'0511', 'block':'0000X E 100 PL', 'case_number':'HH175062', 'date':'2002-02-08T15:31:21.000', 'description':'AGGRAVATED: HANDGUN', 'district':'005', 'domestic':false, 'fbi_code':'04A', 'id':'1986970', 'iucr':'051A', 'latitude':'41.711628886', 'location':{ 'type':'Point', 'coordinates':[-87.622141, 41.711629] }, 'location_description':'SIDEWALK', 'longitude':'-87.622141173', 'primary_type':'ASSAULT', 'updated_on':'2016-01-15T11:08:45.000', 'x_coordinate':'1178432', 'y_coordinate':'1838311', 'year':'2002' }
    , { 'arrest':false, 'beat':'0511', 'block':'0000X E 100 PL', 'case_number':'HH170203', 'date':'2002-02-06T07:00:00.000', 'description':'TELEPHONE THREAT', 'district':'005', 'domestic':true, 'fbi_code':'26', 'id':'1976769', 'iucr':'2820', 'latitude':'41.711628886', 'location':{ 'type':'Point', 'coordinates':[-87.622141, 41.711629] }, 'location_description':'RESIDENCE', 'longitude':'-87.622141173', 'primary_type':'OTHER OFFENSE', 'updated_on':'2016-01-15T11:08:45.000', 'x_coordinate':'1178432', 'y_coordinate':'1838311', 'year':'2002' }
    , { 'arrest':true, 'beat':'0511', 'block':'0000X E 100 PL', 'case_number':'HH110076', 'date':'2002-01-06T13:53:58.000', 'description':'POSS: CANNABIS 30GMS OR LESS', 'district':'005', 'domestic':false, 'fbi_code':'18', 'id':'1932411', 'iucr':'1811', 'latitude':'41.711646483', 'location':{ 'type':'Point', 'coordinates':[-87.620995, 41.711646] }, 'location_description':'STREET', 'longitude':'-87.620994622', 'primary_type':'NARCOTICS', 'updated_on':'2016-01-15T11:08:45.000', 'x_coordinate':'1178745', 'y_coordinate':'1838320', 'year':'2002' }
    , { 'arrest':true, 'beat':'0511', 'block':'0000X E 100 PL', 'case_number':'HH263437', 'date':'2002-03-25T08:40:35.000', 'description':'AGGRAVATED: HANDGUN', 'district':'005', 'domestic':false, 'fbi_code':'04B', 'id':'2048679', 'iucr':'041A', 'latitude':'41.711646483', 'location':{ 'type':'Point', 'coordinates':[-87.620995, 41.711646] }, 'location_description':'SIDEWALK', 'longitude':'-87.620994622', 'primary_type':'BATTERY', 'updated_on':'2016-01-10T15:52:27.000', 'x_coordinate':'1178745', 'y_coordinate':'1838320', 'year':'2002' }
    , { 'arrest':false, 'beat':'0511', 'block':'0000X E 100 PL', 'case_number':'HH202738', 'date':'2002-02-22T16:30:14.000', 'description':'SIMPLE', 'district':'005', 'domestic':true, 'fbi_code':'08B', 'id':'2000930', 'iucr':'0460', 'latitude':'41.711628886', 'location':{ 'type':'Point', 'coordinates':[-87.622141, 41.711629] }, 'location_description':'RESIDENCE', 'longitude':'-87.622141173', 'primary_type':'BATTERY', 'updated_on':'2016-01-10T15:52:27.000', 'x_coordinate':'1178432', 'y_coordinate':'1838311', 'year':'2002' }
    , { 'arrest':false, 'beat':'0511', 'block':'0000X E 100 PL', 'case_number':'HH195694', 'date':'2002-02-19T08:00:00.000', 'description':'HARASSMENT BY TELEPHONE', 'district':'005', 'domestic':true, 'fbi_code':'26', 'id':'1995807', 'iucr':'2825', 'latitude':'41.711628886', 'location':{ 'type':'Point', 'coordinates':[-87.622141, 41.711629] }, 'location_description':'RESIDENCE', 'longitude':'-87.622141173', 'primary_type':'OTHER OFFENSE', 'updated_on':'2016-01-10T15:52:27.000', 'x_coordinate':'1178432', 'y_coordinate':'1838311', 'year':'2002' }
    , { 'arrest':false, 'beat':'0511', 'block':'0000X E 100 PL', 'case_number':'HH191883', 'date':'2002-02-17T08:00:00.000', 'description':'HARASSMENT BY TELEPHONE', 'district':'005', 'domestic':true, 'fbi_code':'26', 'id':'1991122', 'iucr':'2825', 'latitude':'41.711628886', 'location':{ 'type':'Point', 'coordinates':[-87.622141, 41.711629] }, 'location_description':'RESIDENCE', 'longitude':'-87.622141173', 'primary_type':'OTHER OFFENSE', 'updated_on':'2016-01-10T15:52:27.000', 'x_coordinate':'1178432', 'y_coordinate':'1838311', 'year':'2002' }
    , { 'arrest':false, 'beat':'0511', 'block':'0000X E 100 PL', 'case_number':'HH182980', 'date':'2002-01-05T11:00:00.000', 'description':'HARASSMENT BY TELEPHONE', 'district':'005', 'domestic':false, 'fbi_code':'26', 'id':'1983853', 'iucr':'2825', 'latitude':'41.711628886', 'location':{ 'type':'Point', 'coordinates':[-87.622141, 41.711629] }, 'location_description':'RESIDENCE', 'longitude':'-87.622141173', 'primary_type':'OTHER OFFENSE', 'updated_on':'2016-01-10T15:52:27.000', 'x_coordinate':'1178432', 'y_coordinate':'1838311', 'year':'2002' }
    , { 'arrest':false, 'beat':'0511', 'block':'0000X E 100 PL', 'case_number':'HH182480', 'date':'2002-02-12T12:30:00.000', 'description':'HARASSMENT BY TELEPHONE', 'district':'005', 'domestic':false, 'fbi_code':'26', 'id':'1983742', 'iucr':'2825', 'latitude':'41.711628886', 'location':{ 'type':'Point', 'coordinates':[-87.622141, 41.711629] }, 'location_description':'RESIDENCE', 'longitude':'-87.622141173', 'primary_type':'OTHER OFFENSE', 'updated_on':'2016-01-10T15:52:27.000', 'x_coordinate':'1178432', 'y_coordinate':'1838311', 'year':'2002' }
    , { 'arrest':false, 'beat':'0511', 'block':'0000X E 100 PL', 'case_number':'HH160793', 'date':'2002-01-03T13:00:00.000', 'description':'HARASSMENT BY TELEPHONE', 'district':'005', 'domestic':false, 'fbi_code':'26', 'id':'1967813', 'iucr':'2825', 'latitude':'41.711628886', 'location':{ 'type':'Point', 'coordinates':[-87.622141, 41.711629] }, 'location_description':'RESIDENCE', 'longitude':'-87.622141173', 'primary_type':'OTHER OFFENSE', 'updated_on':'2016-01-10T15:52:27.000', 'x_coordinate':'1178432', 'y_coordinate':'1838311', 'year':'2002' }
    , { 'arrest':true, 'beat':'0511', 'block':'0000X E 100 PL', 'case_number':'HH206049', 'date':'2002-02-24T11:30:00.000', 'description':'POSS: CRACK', 'district':'005', 'domestic':false, 'fbi_code':'18', 'id':'2023981', 'iucr':'2027', 'latitude':'41.711852636', 'location':{ 'type':'Point', 'coordinates':[-87.621934, 41.711853] }, 'location_description':'STREET', 'longitude':'-87.621933607', 'primary_type':'NARCOTICS', 'updated_on':'2015-08-17T15:03:40.000', 'x_coordinate':'1178488', 'y_coordinate':'1838393', 'year':'2002' }
    , { 'arrest':false, 'beat':'0511', 'block':'0000X E 100 PL', 'case_number':'HH168626', 'date':'2001-12-28T17:00:00.000', 'description':'HARASSMENT BY TELEPHONE', 'district':'005', 'domestic':false, 'fbi_code':'26', 'id':'1973714', 'iucr':'2825', 'latitude':'41.711628886', 'location':{ 'type':'Point', 'coordinates':[-87.622141, 41.711629] }, 'location_description':'RESIDENCE', 'longitude':'-87.622141173', 'primary_type':'OTHER OFFENSE', 'updated_on':'2015-08-17T15:03:40.000', 'x_coordinate':'1178432', 'y_coordinate':'1838311', 'year':'2001' }]
};

