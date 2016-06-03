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

  describe '#document_from_component' do
    let(:document) { FactoryGirl.create(:document) }

    context 'when component references an uploaded image' do
      let(:component) do
        {
          'documentId' => document.id,
          'url' => 'http://downloaded-images/1234.png'
        }
      end

      it 'returns the document' do
        expect(document_from_component(component)).to eq(document)
      end
    end

    context 'when document does not exist' do
      let(:component) do
        {
          'documentId' => -1,
          'url' => 'http://downloaded-images/1234.png'
        }
      end

      it 'returns nil' do
        expect(document_from_component(component)).to be_nil
      end
    end

    context 'when component references a getty image' do
      let(:getty_image) { FactoryGirl.create(:getty_image, document: document) }
      let(:component) do
        {
          'documentId' => nil,
          'url' => api_v1_getty_image_url(getty_image.getty_id)
        }
      end

      context 'when getty_image has document' do
        it 'returns the document' do
          expect(document_from_component(component)).to eq(document)
        end
      end

      context 'when getty_image has no document' do
        let(:document) { nil }

        it 'returns nil' do
          expect(document_from_component(component)).to be_nil
        end
      end
    end
  end

  describe '#image_srcset_from_component' do
    let(:document) { FactoryGirl.create(:document) }
    let(:component) do
      {
        'documentId' => 1234,
        'url' => 'http://downloaded-images/1234.png'
      }
    end

    context 'when enable_responsive_images feature flag is disabled' do
      before do
        allow(Rails.application.config).to receive(:enable_responsive_images).and_return(false)
      end

      it 'returns nil' do
        expect(image_srcset_from_component(component)).to be_nil
      end
    end

    context 'when enable_responsive_images feature flag is enabled' do
      before do
        allow(Rails.application.config).to receive(:enable_responsive_images).and_return(true)
        allow(self).to receive(:document_from_component).with(component).and_return(document)
      end

      context 'when document is nil' do
        let(:document) { nil }
        it 'returns nil' do
          expect(image_srcset_from_component(component)).to be_nil
        end
      end

      context 'when document is processed' do
        let(:document) { FactoryGirl.create(:document, status: 1) }

        before do
          Document::THUMBNAIL_SIZES.keys.each do |size|
            allow(document.upload).to receive(:url).with(size).and_return("url-#{size}")
          end
        end

        it 'returns srcset' do
          expect(image_srcset_from_component(component)).to eq('url-small 346w, url-medium 650w, url-large 1300w, url-xlarge 2180w')
        end
      end

      context 'when document is not processed' do
        let(:document) { FactoryGirl.create(:document, status: 0) }
        it 'returns nil' do
          expect(image_srcset_from_component(component)).to be_nil
        end
      end
    end
  end

  describe '#image_sizes_from_number_of_columns' do
    it 'returns a value when columns is 12' do
      expect(image_sizes_from_number_of_columns(12)).to eq('(min-width: 1400px) calc(1.0 * 1090px), (min-width: 1200px) calc(1.0 * 910px), (min-width: 800px) calc(1.0 * 650px), 94vw')
    end

    it 'returns a value when columns is less than 12' do
      expect(image_sizes_from_number_of_columns(6)).to eq('(min-width: 1400px) calc(0.5 * 1090px), (min-width: 1200px) calc(0.5 * 910px), (min-width: 800px) calc(0.5 * 650px), 94vw')
    end
  end
end
