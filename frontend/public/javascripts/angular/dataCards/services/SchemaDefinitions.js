/**
 * This file holds all of our js schema definitions, to keep them organizationally separate from the
 * validation logic, etc. It is not intended to be consumed by anything except for the Schemas
 * service, which basically just uses SchemaDefinitions to inject these definitions into the Schemas
 * service.
 */
module.exports = function() {
  var UID_REGEXP = /^\w{4}-\w{4}$/;

  function registerWith(schemasService) {
    var datasetMetadataSchemas = schemasService.regarding('dataset_metadata');

    datasetMetadataSchemas.addSchemaWithVersion(
      '0',
      {
        type: 'object',
        properties: {
          id: {type: 'string', pattern: UID_REGEXP},
          name: {type: 'string', minLength: 1},
          description: {type: 'string'},
          rowDisplayUnit: {type: 'string', minLength: 1},
          defaultAggregateColumn: {type: 'string', minLength: 1},
          ownerId: {type: 'string', pattern: UID_REGEXP},
          updatedAt: {type: 'string'}, //TODO ISO8601
          columns: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: {
                  type: 'string'
                },
                description: {
                  type: 'string'
                },
                name: {
                  type: 'string',
                  minLength: 1
                },
                logicalDatatype: {
                  type: 'string',
                  'enum': ['category', 'amount', 'location', 'time', 'text', 'name', 'identifier', '*']
                },
                physicalDatatype: {
                  type: 'string',
                  'enum': ['number', 'point', 'geo_entity', 'text', 'timestamp', 'row_version', 'row_identifier', 'fixed_timestamp', 'floating_timestamp', 'boolean', 'money', '*']
                },
                importance: {type: 'integer', minimum: 1, maximum: 4},
                columnDisplayUnit: {type: 'string'}
              },
              required: ['name', 'logicalDatatype', 'physicalDatatype', 'importance']
            }
          },
          pages: {
            type: 'object',
            properties: {
              publisher: {type: 'array', items: {type: 'object'}},
              user: {type: 'array', items: {type: 'object'}}
            }
          }
        },
        required: ['id', 'name', 'rowDisplayUnit', 'defaultAggregateColumn', 'ownerId', 'updatedAt', 'columns']
      }
    );

    datasetMetadataSchemas.addSchemaWithVersion(
      '1',
      {
        type: 'object',
        properties: {
          id: {type: 'string', pattern: UID_REGEXP},
          name: {type: 'string', minLength: 1},
          description: {type: 'string'},
          downloadOverride: {type: 'string'},
          rowDisplayUnit: {type: 'string', minLength: 1},
          defaultAggregateColumn: {type: 'string', minLength: 1},
          ownerId: {type: 'string', pattern: UID_REGEXP},
          defaultPage: {type: 'string', pattern: UID_REGEXP},
          updatedAt: {type: 'string'}, //TODO ISO8601
          columns: {
            type: 'object',
            patternProperties: {
              '^[a-zA-Z0-9_\-][a-zA-Z0-9_\-]*$': {
                type: 'object',
                properties: {
                  title: {
                    type: 'string'
                  },
                  description: {
                    type: 'string'
                  },
                  name: {
                    type: 'string',
                    minLength: 1
                  },
                  physicalDatatype: {
                    type: 'string'
                  },
                  cardinality: {type: 'integer'},
                  defaultCardType: {type: 'string'},
                  availableCardTypes: {type: 'array'}
                },
                required: ['name', 'physicalDatatype', 'defaultCardType', 'availableCardTypes']
              },
              '^:@[a-zA-Z0-9_\-][a-zA-Z0-9_\-]*$': {
                type: 'object',
                properties: {
                  title: {
                    type: 'string'
                  },
                  description: {
                    type: 'string'
                  },
                  name: {
                    type: 'string',
                    minLength: 1
                  },
                  physicalDatatype: {
                    type: 'string',
                    'enum': ['number', 'point', 'geo_entity', 'text', 'timestamp', 'row_version', 'row_identifier', 'fixed_timestamp', 'floating_timestamp', 'boolean', 'money', '*']
                  },
                  cardinality: {type: 'integer'},
                  computationStrategy: {
                    type: 'object',
                    properties: {
                      parameters: {
                        type: 'object',
                        properties: {
                          region: {type: 'string', minLength: 1},
                          geometryLabel: {type: 'string', minLength: 1} //TODO require both of these at once?
                        }
                      }
                    }
                  },
                  defaultCardType: {type: 'string'},
                  availableCardTypes: {type: 'array'}
                },
                required: ['name', 'physicalDatatype', 'computationStrategy', 'defaultCardType', 'availableCardTypes']
              }
            }
          },
          pages: {
            type: 'object',
            properties: {
              publisher: {type: 'array', items: {type: 'object'}},
              user: {type: 'array', items: {type: 'object'}}
            }
          },
          version: {
            type: 'number',
            'enum': [1] //NOTE: This is not currently required. Hopefully this will change as we coordinate teams.
          }
        },
        required: ['id', 'name', 'ownerId', 'updatedAt', 'columns']
      }
    );

    var cardMetadataSchemas = schemasService.regarding('card_metadata');
    cardMetadataSchemas.addSchemaWithVersion(
      '0',
      {
        type: 'object',
        properties: {
          activeFilters: {type: 'array'},
          baseLayerUrl: {},
          cardCustomStyle: {type: 'object'},
          cardSize: {type: 'integer', minimum: 1, maximum: 4},
          cardType: {type: 'string'},
          displayMode: {
            type: 'string',
            'enum': ['figures', 'visualization']
          },
          expanded: {type: 'boolean'},
          expandedCustomStyle: {type: 'object'},
          fieldName: {type: 'string', minLength: 1},
          shapefileFeatureHumanReadablePropertyName: {type: 'string'}
        },
        required: ['fieldName', 'cardSize', 'cardCustomStyle', 'expandedCustomStyle', 'displayMode', 'expanded']
      }
    );

    cardMetadataSchemas.addSchemaWithVersion(
      '1',
      {
        type: 'object',
        properties: {
          activeFilters: {type: 'array'},
          baseLayerUrl: {},
          cardSize: {type: 'integer', minimum: 1, maximum: 3},
          cardType: {type: 'string'},
          expanded: {type: 'boolean'},
          fieldName: {type: 'string', minLength: 1}
        },
        required: ['fieldName', 'cardSize', 'expanded']
      }
    );

    // Added cardOptions and bucketType
    cardMetadataSchemas.addSchemaWithVersion(
      '2',
      _.merge(cardMetadataSchemas.getSchemaDefinition(1), {
        properties: {
          bucketType: {type: 'string'},
          cardOptions: {type: 'object'}
        }
      })
    );

    // Added computedColumn
    cardMetadataSchemas.addSchemaWithVersion(
      '3',
      _.merge(cardMetadataSchemas.getSchemaDefinition(2), {
        properties: {
          computedColumn: {}
        }
      })
    );

    // Added aggregationField and aggregationFunction, both can be null.
    cardMetadataSchemas.addSchemaWithVersion(
      '4',
      _.merge(cardMetadataSchemas.getSchemaDefinition(3), {
        properties: {
          aggregationField: {},
          aggregationFunction: {}
        }
      })
    );

    // Only used by PageDataService to validate that pages have titles on save.
    // We should either expand this to include all page metadata versions or remove this completely.
    schemasService.regarding('page_metadata').addSchemaWithVersion('0', {
      type: 'object',
      properties: {
        name: {type: 'string', minLength: 1, maxLength: 255}
      },
      required: ['name']
    });
  }

  return {
    registerWith: registerWith,
    uidRegexp: UID_REGEXP
  };
};
