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

end
