angular.module('dataCards.services').factory('SchemaDefinitions', function() {
  var UID_REGEXP = /^\w{4}-\w{4}$/;

  function registerWith(schemasService) {
    var datasetMetadataSchemas = schemasService.regarding('dataset_metadata');

    datasetMetadataSchemas.addSchemaWithVersion(
      '0',
      {
        'type': 'object',
        'properties': {
          'id': { 'type': 'string', 'pattern': UID_REGEXP },
          'name': { 'type': 'string', 'minLength': 1 },
          'description': { 'type': 'string', 'minLength': 1 },
          'rowDisplayUnit': { 'type': 'string', 'minLength': 1 },
          'defaultAggregateColumn': { 'type': 'string', 'minLength': 1 },
          'ownerId': { 'type': 'string', 'pattern': UID_REGEXP },
          'updatedAt': { 'type': 'string' }, //TODO ISO8601
          'columns': {
            'type': 'array',
            'items': {
              'type': 'object',
              'properties': {
                'title': {
                  'type': 'string'
                },
                'description': {
                  'type': 'string'
                },
                'name': {
                  'type': 'string',
                  'minLength': 1
                },
                'logicalDatatype': {
                  'type': 'string',
                  'enum': [ 'category', 'amount', 'location', 'time', 'text', 'name', 'identifier', '*' ]
                },
                'physicalDatatype': {
                  'type': 'string',
                  'enum': [ 'number', 'point', 'geo_entity', 'text', 'timestamp', 'row_version', 'row_identifier', 'fixed_timestamp', 'floating_timestamp', 'boolean', 'money', '*' ]
                },
                'importance': { 'type': 'integer' , 'minimum': 1, 'maximum': 4 },
                'columnDisplayUnit': { 'type': 'string' }
              },
              'required': [ 'name', 'logicalDatatype', 'physicalDatatype', 'importance' ]
            }
          },
          'pages': {
            'type': 'object',
            'properties': {
              'publisher': { 'type': 'array', 'items': { 'type': 'string', 'pattern': UID_REGEXP } },
              'user': { 'type': 'array', 'items': { 'type': 'string', 'pattern': UID_REGEXP } }
            }
          }
        },
        'required': [ 'id', 'name', 'rowDisplayUnit', 'defaultAggregateColumn', 'ownerId', 'updatedAt', 'columns' ]
      }
    );

    datasetMetadataSchemas.addSchemaWithVersion(
      '1',
      {
        'type': 'object',
        'properties': {
          'id': { 'type': 'string', 'pattern': UID_REGEXP },
          'name': { 'type': 'string', 'minLength': 1 },
          'description': { 'type': 'string', 'minLength': 1 },
          'rowDisplayUnit': { 'type': 'string', 'minLength': 1 },
          'defaultAggregateColumn': { 'type': 'string', 'minLength': 1 },
          'ownerId': { 'type': 'string', 'pattern': UID_REGEXP },
          'defaultPage': { 'type': 'string', 'pattern': UID_REGEXP },
          'updatedAt': { 'type': 'string' }, //TODO ISO8601
          'columns': {
            'type': 'object',
            'patternProperties': {
              '.*': {
                'type': 'object',
                'properties': {
                  'title': {
                    'type': 'string'
                  },
                  'description': {
                    'type': 'string'
                  },
                  'name': {
                    'type': 'string',
                    'minLength': 1
                  },
                  'fred': {
                    'type': 'string',
                    'enum': [ 'category', 'amount', 'location', 'time', 'text', 'name', 'identifier', '*' ]
                  },
                  'physicalDatatype': {
                    'type': 'string',
                    'enum': [ 'number', 'point', 'geo_entity', 'text', 'timestamp', 'row_version', 'row_identifier', 'fixed_timestamp', 'floating_timestamp', 'boolean', 'money', '*' ]
                  },
                  'cardinality': { 'type': 'integer' },
                  'computationStrategy': {
                    'type': 'object',
                    'properties': {
                      'parameters': {
                        'type': 'object',
                        'properties': {
                          'region': { 'type': 'string', 'minLength': 1},
                          'geometryLabel': { 'type': 'string', 'minLength': 1} //TODO require both of these at once?
                        }
                      }
                    }
                  }
                },
                'required': [ 'name', 'fred', 'physicalDatatype']
              }
            }
          },
          'pages': {
            'type': 'object',
            'properties': {
              'publisher': { 'type': 'array', 'items': { 'type': 'string', 'pattern': UID_REGEXP } },
              'user': { 'type': 'array', 'items': { 'type': 'string', 'pattern': UID_REGEXP } }
            }
          },
          'version': {
            'type': 'string',
            'enum': [ '1' ] //NOTE: This is not currently required. Hopefully this will change as we coordinate teams.
          }
        },
        'required': [ 'id', 'name', 'ownerId', 'updatedAt', 'columns' ]
      }
    );

  }

  return {
    registerWith: registerWith,
    uidRegexp: UID_REGEXP
  };

});
