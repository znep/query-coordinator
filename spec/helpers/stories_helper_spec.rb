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
    let(:mock_core_response_with_public_grant) do
      {
        'title' => 'Title',
        'description' => 'Description',
        'grants' => [{
          'inherited' => false,
          'type' => 'viewer',
          'flags' => [ 'public' ]
        }]
      }
    end

    describe 'given a valid story' do

      it 'adds title, description, and permissions properties' do
        @story = valid_story

        expect(CoreServer).to receive(:headers_from_request).at_least(:once)
        expect(CoreServer).to receive(:get_view).at_least(:once).and_return(mock_core_response)

        expect(user_story_json).to include('title')
        expect(user_story_json).to include('description')
        expect(user_story_json).to include('permissions')
      end

      describe 'that is private' do

        it 'returns permissions with isPublic equal to false' do
          @story = valid_story

          expect(CoreServer).to receive(:headers_from_request).at_least(:once)
          expect(CoreServer).to receive(:get_view).at_least(:once).and_return(mock_core_response)

          expect(JSON.parse(user_story_json)['permissions']['isPublic']).to be(false)
        end
      end

      describe 'that is public' do

        it 'returns permissions with isPublic equal to true' do
          @story = valid_story

          expect(CoreServer).to receive(:headers_from_request).at_least(:once)
          expect(CoreServer).to receive(:get_view).at_least(:once).and_return(mock_core_response_with_public_grant)

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
      ).to match(/component-container /)
    end

    it 'adds a class for col width' do
      expect(
        component_container_classes('6')
      ).to match(/col6/)
    end
  end

  describe '#component_classes' do
    it 'adds a `component` class' do
      expect(
        component_classes('youtube.video')
      ).to match(/component /)
    end

    it 'calls `type_to_class_name_for_component_type`' do
      expect(helper).to receive(:type_to_class_name_for_component_type).with('youtube.video')
      helper.component_classes('youtube.video')
    end

    it 'adds `typeset` to any block' do
      # This controls whether our typography styles apply
      # right now they should apply to all blocks
      expect(
          component_classes('anyComponentTypeForNow')
        ).to match(/typeset /)
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
        ).to match(/component-media/)
      end

      non_media_component_types.each do |component_type|
        expect(
          component_classes(component_type)
        ).not_to match(/component-media/)
      end
    end

  end

end
