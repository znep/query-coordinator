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
        'created_by': 'system'
      },
      {
        "id": "sampleDefaultBlock2",
        "layout": "12",
        "components": [
          {
            "type": "media",
            "value": {
              "type": "embed",
              "value": {
                "provider": "youtube",
                "id": "YWa-rWSsoZA"
              }
            }
          }
        ]
      }
    ]
  end
end
