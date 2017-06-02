export default {
  "resource": {
    "total_rows": 999999,
    "output_schemas": [
      {
        "total_rows": null,
        "output_columns": [
          {
            "transform": {
              "transform_expr": "`StationName`",
              "output_column_id": 448,
              "output_soql_type": "text",
              "id": 0
            },
            "field_name": "StationName",
            "position": 0,
            "id": 448,
            "guessed_subtypes": [],
            "display_name": "StationName"
          },
          {
            "transform": {
              "transform_expr": "`StationLocation`",
              "output_column_id": 449,
              "output_soql_type": "text",
              "id": 1
            },
            "field_name": "StationLocation",
            "position": 1,
            "id": 449,
            "guessed_subtypes": [],
            "display_name": "StationLocation"
          },
          {
            "transform": {
              "transform_expr": "to_floating_timestamp(`DateTime`)",
              "output_column_id": 450,
              "output_soql_type": "calendar_date",
              "id": 226
            },
            "field_name": "DateTime",
            "position": 2,
            "id": 450,
            "guessed_subtypes": [],
            "display_name": "DateTime"
          },
          {
            "transform": {
              "transform_expr": "to_number(`RecordId`)",
              "output_column_id": 451,
              "output_soql_type": "number",
              "id": 227
            },
            "field_name": "RecordId",
            "position": 3,
            "id": 451,
            "guessed_subtypes": [],
            "display_name": "RecordId"
          },
          {
            "transform": {
              "transform_expr": "to_number(`RoadSurfaceTemperature`)",
              "output_column_id": 452,
              "output_soql_type": "number",
              "id": 228
            },
            "field_name": "RoadSurfaceTemperature",
            "position": 4,
            "id": 452,
            "guessed_subtypes": [],
            "display_name": "RoadSurfaceTemperature"
          },
          {
            "transform": {
              "transform_expr": "to_number(`AirTemperature`)",
              "output_column_id": 453,
              "output_soql_type": "number",
              "id": 229
            },
            "field_name": "AirTemperature",
            "position": 5,
            "id": 453,
            "guessed_subtypes": [],
            "display_name": "AirTemperature"
          }
        ],
        "name": null,
        "created_at": "2017-01-20T22:36:58.466342",
        "id": 39
      }
    ],
    "name": null,
    "created_at": "2017-01-20T22:36:58.372298",
    "id": 6,
    "input_columns": [
      {
        "soql_type": "text",
        "schema_id": 38,
        "field_name": "StationName",
        "position": 0,
        "id": 442,
        "guessed_subtypes": [],
        "guessed_soql_type": "text",
        "display_name": "StationName"
      },
      {
        "soql_type": "text",
        "schema_id": 38,
        "field_name": "StationLocation",
        "position": 1,
        "id": 443,
        "guessed_subtypes": [],
        "guessed_soql_type": "text",
        "display_name": "StationLocation"
      },
      {
        "soql_type": "text",
        "schema_id": 38,
        "field_name": "DateTime",
        "position": 2,
        "id": 444,
        "guessed_subtypes": [],
        "guessed_soql_type": "calendar_date",
        "display_name": "DateTime"
      },
      {
        "soql_type": "text",
        "schema_id": 38,
        "field_name": "RecordId",
        "position": 3,
        "id": 445,
        "guessed_subtypes": [],
        "guessed_soql_type": "number",
        "display_name": "RecordId"
      },
      {
        "soql_type": "text",
        "schema_id": 38,
        "field_name": "RoadSurfaceTemperature",
        "position": 4,
        "id": 446,
        "guessed_subtypes": [],
        "guessed_soql_type": "number",
        "display_name": "RoadSurfaceTemperature"
      },
      {
        "soql_type": "text",
        "schema_id": 38,
        "field_name": "AirTemperature",
        "position": 5,
        "id": 447,
        "guessed_subtypes": [],
        "guessed_soql_type": "number",
        "display_name": "AirTemperature"
      }
    ]
  },
  "links": {
    "show": "/api/publishing/v1/revision/s396-jk8m/0/schema/38"
  }
}
