module SampleBlocksHelper

  def generate_sample_blocks
    return [
      {
        'id': 'sampleDefaultBlock',
        'layout': '12',
        'components': [
          {
            'type' => 'text',
            'value' => I18n.t('sample_story.intro_content')
          }
        ],
        'created_by': 'system'
      }
    ]
  end
end
