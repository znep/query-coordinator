export default {
  "resource": {
    "total_rows": 999999,
    "output_schemas": [
      {
        "total_rows": null,
        "output_columns": [
          {
            "transform_to": {
              "transform_input_columns": [
                {
                  "column_id": 442
                }
              ],
              "transform_expr": "`StationName`",
              "output_column_id": 448,
              "id": 0
            },
            "soql_type": "SoQLText",
            "schema_id": null,
            "schema_column_name": "StationName",
            "schema_column_index": 0,
            "id": 448,
            "guessed_subtypes": [],
            "guessed_soql_type": "nil",
            "field_name": null,
            "display_name": "StationName"
          },
          {
            "transform_to": {
              "transform_input_columns": [
                {
                  "column_id": 443
                }
              ],
              "transform_expr": "`StationLocation`",
              "output_column_id": 449,
              "id": 1
            },
            "soql_type": "SoQLText",
            "schema_id": null,
            "schema_column_name": "StationLocation",
            "schema_column_index": 1,
            "id": 449,
            "guessed_subtypes": [],
            "guessed_soql_type": "nil",
            "field_name": null,
            "display_name": "StationLocation"
          },
          {
            "transform_to": {
              "transform_input_columns": [
                {
                  "column_id": 444
                }
              ],
              "transform_expr": "to_floating_timestamp(`DateTime`)",
              "output_column_id": 450,
              "id": 226
            },
            "soql_type": "SoQLFloatingTimestamp",
            "schema_id": null,
            "schema_column_name": "DateTime",
            "schema_column_index": 2,
            "id": 450,
            "guessed_subtypes": [],
            "guessed_soql_type": "nil",
            "field_name": null,
            "display_name": "DateTime"
          },
          {
            "transform_to": {
              "transform_input_columns": [
                {
                  "column_id": 445
                }
              ],
              "transform_expr": "to_number(`RecordId`)",
              "output_column_id": 451,
              "id": 227
            },
            "soql_type": "SoQLNumber",
            "schema_id": null,
            "schema_column_name": "RecordId",
            "schema_column_index": 3,
            "id": 451,
            "guessed_subtypes": [],
            "guessed_soql_type": "nil",
            "field_name": null,
            "display_name": "RecordId"
          },
          {
            "transform_to": {
              "transform_input_columns": [
                {
                  "column_id": 446
                }
              ],
              "transform_expr": "to_number(`RoadSurfaceTemperature`)",
              "output_column_id": 452,
              "id": 228
            },
            "soql_type": "SoQLNumber",
            "schema_id": null,
            "schema_column_name": "RoadSurfaceTemperature",
            "schema_column_index": 4,
            "id": 452,
            "guessed_subtypes": [],
            "guessed_soql_type": "nil",
            "field_name": null,
            "display_name": "RoadSurfaceTemperature"
          },
          {
            "transform_to": {
              "transform_input_columns": [
                {
                  "column_id": 447
                }
              ],
              "transform_expr": "to_number(`AirTemperature`)",
              "output_column_id": 453,
              "id": 229
            },
            "soql_type": "SoQLNumber",
            "schema_id": null,
            "schema_column_name": "AirTemperature",
            "schema_column_index": 5,
            "id": 453,
            "guessed_subtypes": [],
            "guessed_soql_type": "nil",
            "field_name": null,
            "display_name": "AirTemperature"
          }
        ],
        "name": null,
        "inserted_at": "2017-01-20T22:36:58.466342",
        "id": 39
      }
    ],
    "name": null,
    "inserted_at": "2017-01-20T22:36:58.372298",
    "id": 4, // XXXX
    "columns": [
      {
        "soql_type": "SoQLText",
        "schema_id": 38,
        "schema_column_name": "StationName",
        "schema_column_index": 0,
        "id": 442,
        "guessed_subtypes": [],
        "guessed_soql_type": "SoQLText",
        "field_name": null,
        "display_name": "StationName"
      },
      {
        "soql_type": "SoQLText",
        "schema_id": 38,
        "schema_column_name": "StationLocation",
        "schema_column_index": 1,
        "id": 443,
        "guessed_subtypes": [],
        "guessed_soql_type": "SoQLText",
        "field_name": null,
        "display_name": "StationLocation"
      },
      {
        "soql_type": "SoQLText",
        "schema_id": 38,
        "schema_column_name": "DateTime",
        "schema_column_index": 2,
        "id": 444,
        "guessed_subtypes": [],
        "guessed_soql_type": "SoQLFloatingTimestamp",
        "field_name": null,
        "display_name": "DateTime"
      },
      {
        "soql_type": "SoQLText",
        "schema_id": 38,
        "schema_column_name": "RecordId",
        "schema_column_index": 3,
        "id": 445,
        "guessed_subtypes": [],
        "guessed_soql_type": "SoQLNumber",
        "field_name": null,
        "display_name": "RecordId"
      },
      {
        "soql_type": "SoQLText",
        "schema_id": 38,
        "schema_column_name": "RoadSurfaceTemperature",
        "schema_column_index": 4,
        "id": 446,
        "guessed_subtypes": [],
        "guessed_soql_type": "SoQLNumber",
        "field_name": null,
        "display_name": "RoadSurfaceTemperature"
      },
      {
        "soql_type": "SoQLText",
        "schema_id": 38,
        "schema_column_name": "AirTemperature",
        "schema_column_index": 5,
        "id": 447,
        "guessed_subtypes": [],
        "guessed_soql_type": "SoQLNumber",
        "field_name": null,
        "display_name": "AirTemperature"
      }
    ]
  },
  "links": {
    "show": "/api/update/s396-jk8m/0/schema/38"
  }
}
