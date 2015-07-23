module SampleBlocksHelper

  def generate_sample_blocks
    return [
      {
        'id': 'sampleDefaultBlock1',
        'layout': '12',
        'components': [
          {
            'type' => 'text',
            'value' => I18n.t('sample_story.intro_content')
          }
        ],
        'created_by': 'test@socrata.com'
      },
      {
        "id": "sampleDefaultBlock2",
        "layout": "6-6",
        "components": [
          {
            "type": "text",
            "value": "<div>Test<br></div>"
          },
          {
            "type": "media",
            "value": {
              "type": "embed",
              "value": {
                "provider": "wizard"
              }
            }
          }
        ],
        'created_by': 'test@socrata.com'
      },
      {
        "id": "sampleDefaultBlock3",
        "layout": "12",
        "components": [
          {
            "type": "media",
            "value": {
              "type": "embed",
              "value": {
                "provider": "wizard"
              }
            }
          }
        ],
        'created_by': 'test@socrata.com'
      }
    ]
  end
end
