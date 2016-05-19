require 'rails_helper'

RSpec.describe StoriesHelper, type: :helper do

  describe '#user_story_json' do
    let(:valid_story) { FactoryGirl.create(:draft_story) }
    let(:mock_core_response) do
      {
        'title' => 'Title',
        'description' => 'Description'
      }
    end

    context 'given a valid story' do
      before do
        # We expect the call to #get_view to be memoized
        expect(CoreServer).to receive(:get_view).once.and_return(mock_core_response)
      end

      it 'adds title, description, and permissions properties' do
        @story = valid_story

        expect(user_story_json).to include('title')
        expect(user_story_json).to include('description')
        expect(user_story_json).to include('permissions')
      end

      context 'that is private' do
        it 'returns permissions with isPublic equal to false' do
          @story = valid_story

          expect(JSON.parse(user_story_json)['permissions']['isPublic']).to be(false)
        end
      end

      context 'that is public' do
        let(:mock_core_response) do
          {
            'title' => 'Title',
            'description' => 'Description',
            'grants' => [
              'inherited' => false,
              'type' => 'viewer',
              'flags' => [ 'public' ]
            ]
          }
        end

        it 'returns permissions with isPublic equal to true' do
          @story = valid_story
          expect(JSON.parse(user_story_json)['permissions']['isPublic']).to be(true)
        end
      end
    end
  end

  describe '#update_classic_visualization' do
    let(:story_with_classic_viz) do
      {
        'blocks' => [
          'components' => [
            {
              'type' => 'socrata.visualization.classic',
              'value' => {
                'originalUid' => 'clas-sicv',
                'visualization' => {
                  'metadata' => { 'renderTypeConfig' => { 'visible' => { 'table' => 'something' } } }
                }
              }
            }
          ]
        ]
      }
    end

    let(:story_without_classic_viz) do
      {
        'blocks' => [
          'components' => [
            {
              'type' => 'html',
              'value' => {
                'originalUid' => 'clas-sicv',
                'visualization' => {
                  'metadata' => { 'renderTypeConfig' => { 'visible' => { 'table' => 'something' } } }
                }
              }
            }
          ]
        ]
      }
    end

    before :each do
      stub_visualization_component_view
    end

    context 'given a story with classic viz components' do
      it 'updates the component visualization' do
        classic_viz_component = update_classic_visualization(story_with_classic_viz)[0]['components'][0]

        expect(classic_viz_component['value']['visualization']).to eq(
          'metadata' => {
            'renderTypeConfig' => {
              'visible' => { 'table' => false }
            }
          }
        )
      end
    end

    context 'given a story without classic viz components' do
      it 'does not update the component' do
        component = update_classic_visualization(story_without_classic_viz)[0]['components'][0]

        expect(component['value']['visualization']).to eq(
          'metadata' => {
            'renderTypeConfig' => {
              'visible' => { 'table' => 'something' }
            }
          }
        )
      end
    end
  end

  describe '#google_font_code_embed' do
    let(:story_json) { JSON.parse(fixture('story_theme.json').read).first }
    let(:id) { story_json['id'] }

    before :each do
      allow(CoreServer).to receive(:get_configuration).with(id).and_return(story_json)
    end

    context 'when story is nil' do
      it 'returns nil' do
        @story = nil

        expect(google_font_code_embed).to be_nil
      end
    end

    context 'given a story with a custom theme' do
      it 'returns the raw google font code' do
        @story = FactoryGirl.create(:draft_story, theme: 'custom-234')

        expect(google_font_code_embed).to eq("<link href='https://fonts.googleapis.com/css?family=Open+Sans' rel='stylesheet' type='text/css'>")
      end
    end

    context 'given a story with a non-custom theme' do
      it 'returns an empty string' do
        @story = FactoryGirl.create(:draft_story)

        expect(google_font_code_embed).to be_blank
      end
    end
  end

  describe '#settings_panel_story_stats_link', verify_stubs: false do
    before :each do
      @story = FactoryGirl.create(:draft_story)
    end

    context 'when a user can see story stats' do
      it 'returns the anchor element for the story stats page with an href' do
        allow(self).to receive(:can_see_story_stats?).and_return(true)

        expect(settings_panel_story_stats_link).to eq('<a href="/d/test-test/stats" class="menu-list-item-header" role="button" target="_blank"></a>')
      end
    end

    context 'when a user cannot see story stats' do
      it 'returns the anchor element for the story stats page without an href' do
        allow(self).to receive(:can_see_story_stats?).and_return(false)

        expect(settings_panel_story_stats_link).to eq('<a class="menu-list-item-header" role="button" target="_blank"></a>')
      end
    end
  end

  describe '#component_json' do
    let(:view) { {} }
    let(:component) {
      {'type' => 'html'}
    }

    context 'when encountering a socrata.visualization.classic' do
      let(:visualization) { 'visualization' }

      let(:view) do
        {'metadata' => {'renderTypeConfig' => {'visible' => {'table' => true}}}}
      end

      let(:component) do
        {'type' => 'socrata.visualization.classic', 'value' => {'visualization' => 'visualization'}}
      end

      before do
        allow(CoreServer).to receive(:get_view).and_return(view)
      end

      it 'returns a modified JSON representation of the component' do
        expect(component_json(component)).to match(/"table":false/)
      end
    end

    it 'returns a JSON representation of the component' do
      expect(component_json(component)).to eq(component.to_json)
    end
  end

  describe '#component_partial_name' do
    it 'returns a mapping for valid component types' do
      valid_component_types = [
        'html',
        'youtube.video',
        'socrata.visualization.columnChart',
        'assetSelector'
      ]

      valid_component_types.each do |component_type|
        expect {
          component_partial_name(component_type)
        }.not_to raise_error
      end
    end

    it 'raises an error for invalid component types' do
      expect {
        component_partial_name('invalid.type')
      }.to raise_error(RuntimeError)
    end
  end

  describe '#type_to_class_name_for_component_type' do
    it 'removes `.`s, underscores, and capital letters' do
      class_name = type_to_class_name_for_component_type("socrata.visualization.columnChart")

      expect(class_name).not_to match(/\./)
      expect(class_name).not_to match(/_/)
      expect(class_name).not_to match(/[A-Z]/)
    end

    it 'turns camel case into dashes' do
      expect(
        type_to_class_name_for_component_type('MySpecialThing')
      ).to eq('component-my-special-thing')
    end

    it 'handles mixed dashes .Capitals and camelCase' do
      expect(
        type_to_class_name_for_component_type('prefix-WOO.MySpecialThing-also-with-dashes')
      ).to eq('component-prefix-woo-my-special-thing-also-with-dashes')
    end
  end

  describe '#component_container_classes' do
    it 'adds a `component-container` class' do
      expect(
        component_container_classes('6')
      ).to include_class('component-container')
    end

    it 'adds a class for col width' do
      expect(
        component_container_classes('6')
      ).to include_class('col6')
    end
  end

  describe '#component_classes' do
    it 'adds a `component` class' do
      expect(
        component_classes('youtube.video')
      ).to include_class('component')
    end

    it 'calls `type_to_class_name_for_component_type`' do
      expect(helper).to receive(:type_to_class_name_for_component_type).with('youtube.video')
      helper.component_classes('youtube.video')
    end

    it 'adds `typeset` to a specific set of blocks' do
      expected_to_have_typeset = %w{html spacer horizontalRule assetSelector image youtube.video embeddedHtml}
      expected_to_have_typeset.each do |component_type|
      expect(
        component_classes(component_type)
      ).to include_class('typeset')
      end
    end

    it 'does not add `typeset` to blocks not specifically typeset' do
      expect(
        component_classes('some.other.block.type')
      ).to_not include_class('typeset')
    end

    it 'adds `component-media` to media blocks only' do
      media_component_types = [
        'youtube.video',
        'socrata.visualizations.columnChart',
        'socrata.visualizations.anyChartType', # should match anything with 'visualizations'
        'image'
      ]
      non_media_component_types = [
        'html',
        'horizontalRule',
        'spacer'
      ]

      media_component_types.each do |component_type|
        expect(
          component_classes(component_type)
        ).to include_class('component-media')
      end

      non_media_component_types.each do |component_type|
        expect(
          component_classes(component_type)
        ).not_to include_class('component-media')
      end
    end
  end

  describe '#embed_code_iframe_sandbox_allowances' do
    it 'returns a space-delimited list of things we allow in embed code iframes' do
      expect(embed_code_iframe_sandbox_allowances).to eq('allow-popups allow-scripts allow-same-origin allow-forms')
    end
  end
end
