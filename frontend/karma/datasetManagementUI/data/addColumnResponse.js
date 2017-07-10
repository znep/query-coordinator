export default {
  "resource": {
    "output_columns": [
      {
        "transform": {
          "transform_input_columns": [
            {
              "input_column_id": 1
            }
          ],
          "transform_expr": "to_text(arrest)",
          "output_soql_type": "text",
          "id": 90112,
          "completed_at": "2017-04-05T16:20:37"
        },
        "position": 0,
        "id": 90539,
        "field_name": "arrest",
        "display_name": "arrest",
        "description": null
      },
      {
        "transform": {
          "transform_input_columns": [
            {
              "input_column_id": 2
            }
          ],
          "transform_expr": "to_text(block)",
          "output_soql_type": "text",
          "id": 90113,
          "completed_at": "2017-04-05T16:28:08"
        },
        "position": 1,
        "id": 90509,
        "field_name": "block",
        "display_name": "block",
        "description": null
      }
    ],
    "created_at": "2017-04-07T19:18:33.262191",
    "input_schema_id": 4,
    "id": 90,
    "error_count": 0,
    "created_by": {
      "user_id": "tugg-ikce",
      "email": "chris.duranti@socrata.com",
      "display_name": "rozap"
    }
  },
  "links": {
    "show": "/api/publishing/v1/source/991/schema/921/output/1311"
  }
}
