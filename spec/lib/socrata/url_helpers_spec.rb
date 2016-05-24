require 'rails_helper'

RSpec.describe 'Socrata::UrlHelpers' do
  include TestHelperMethods

  # The contract of the Socrata::UrlHelpers module includes calls to super.
  # This is a simple way of testing that those calls are made.
  module SuperModule
    def view_url(not_used)
      'https://url.from.super/foo'
    end
    def short_view_url(not_used)
      'https://short.url.from.super/foo'
    end
    def view_path(not_used)
      '/path/from/super/'
    end
  end
  let(:helpers) { Class.new do
    include SuperModule
    include Socrata::UrlHelpers
  end.new }

  before(:each) do
    CurrentDomain.stubs(:default_locale => 'the_default_locale', :cname => 'example.com')
    I18n.stubs(:locale => :the_default_locale)
  end
  after(:each) do
    CurrentDomain.unstub
    I18n.unstub
  end

  describe '#seo_friendly_url' do
    describe 'default locale' do
      it 'does not include the locale component' do
        expect(helpers.seo_friendly_url(fake: 'view')).to eq('https://example.com/path/from/super/')
      end
    end

    describe 'non-default locale' do
      before(:each) do
        I18n.stubs(:locale => :ca)
      end
      it 'does include the locale component' do
        expect(helpers.seo_friendly_url(fake: 'view')).to eq('https://example.com/ca/path/from/super/')
      end
    end
  end


  describe 'view URL generators' do
    let(:view_name) { 'test view name' }
    let(:is_pulse) { false }
    let(:is_story) { false }
    let(:is_data_lens) { false }
    let(:is_standalone_visualization) { false }
    let(:can_edit_story) { true }
    let(:can_preview_story) { true }
    let(:viewing_others_profile) { false }

    let(:view) do
      double(
        'view',
        id: 'four-four',
        name: view_name,
        can_edit_story?: can_edit_story,
        can_preview_story?: can_preview_story,
        canonical_domain_name: 'example.com',
        story?: is_story,
        pulse?: is_pulse,
        data_lens?: is_data_lens,
        is_api?: false,
        standalone_visualization?: is_standalone_visualization)
    end

    before do
      allow_any_instance_of(UserAuthMethods).to receive(:current_user).and_return(nil)
      init_current_domain
    end

    describe '#view_url' do
      describe 'when encountering a plain dataset' do
        it 'calls super' do
          expect(helpers.view_url(view)).to eq('https://url.from.super/foo')
        end
      end

      describe 'when encountering a data lens' do
        let(:is_data_lens) { true }
        it 'returns the correct URL' do
          expect(helpers.view_url(view)).to eq('//example.com/view/four-four')
        end
      end

      describe 'when encountering a standalone visualization' do
        let(:is_standalone_visualization) { true }
        it 'returns the correct URL' do
          expect(helpers.view_url(view)).to eq('//example.com/view/four-four')
        end
      end

      describe 'when encountering a Pulse view' do
        let(:is_pulse) { true }
        it 'returns a Pulse url' do
          expect(helpers.view_url(view)).to eq('//example.com/pulse/view/four-four')
        end
      end

      describe 'when encountering a story' do
        let(:is_story) { true }
        describe 'the name is blank' do
          let(:view_name) { '' }
          it 'returns a url in plain form' do
            expect(helpers.view_url(view)).to eq('//example.com/stories/s/four-four')
          end
        end
        describe 'the name is set' do
          it 'returns a url including a seo-friendly path' do
            expect(helpers.view_url(view)).to eq('//example.com/stories/s/test-view-name/four-four')
          end
        end
      end
    end

    describe '#short_view_url' do
      describe 'when encountering a plain dataset' do
        it 'calls super' do
          expect(helpers.short_view_url(view)).to eq('https://short.url.from.super/foo')
        end
      end

      describe 'when encountering a data lens' do
        let(:is_data_lens) { true }
        it 'returns the correct URL' do
          expect(helpers.short_view_url(view)).to eq('//example.com/view/four-four')
        end
      end

      describe 'when encountering a standalone visualization' do
        let(:is_standalone_visualization) { true }
        it 'returns the correct URL' do
          expect(helpers.short_view_url(view)).to eq('//example.com/view/four-four')
        end
      end

      describe 'when encountering a Pulse view' do
        let(:is_pulse) { true }
        it 'returns a Pulse url' do
          expect(helpers.short_view_url(view)).to eq('//example.com/pulse/view/four-four')
        end
      end

      describe 'when encountering a story' do
        let(:is_story) { true }
        describe 'the name is blank' do
          let(:view_name) { '' }
          it 'returns a url in plain form' do
            expect(helpers.short_view_url(view)).to eq('//example.com/stories/s/four-four')
          end
        end
        describe 'the name is set' do
          it 'returns a url in plain form' do
            expect(helpers.short_view_url(view)).to eq('//example.com/stories/s/four-four')
          end
        end
      end
    end

    describe '#preview_story_url' do
      it 'raises when encountering a plain dataset' do
        expect { helpers.preview_story_url(view) }.to raise_error('view is not a story')
      end

      describe 'when encountering a data lens' do
        let(:is_data_lens) { true }
        it 'raises' do
          expect { helpers.preview_story_url(view) }.to raise_error('view is not a story')
        end
      end

      describe 'when encountering a standalone visualization' do
        let(:is_standalone_visualization) { true }
        it 'raises' do
          expect { helpers.preview_story_url(view) }.to raise_error('view is not a story')
        end
      end

      describe 'when encountering a Pulse view' do
        let(:is_pulse) { true }
        it 'raises' do
          expect { helpers.preview_story_url(view) }.to raise_error('view is not a story')
        end
      end

      describe 'when encountering a story' do
        let(:is_story) { true }
        describe 'the name is blank' do
          let(:view_name) { '' }
          it 'returns a url in plain form' do
            expect(helpers.preview_story_url(view)).to eq('//example.com/stories/s/four-four/preview')
          end
        end
        describe 'the name is set' do
          it 'returns a url including a seo-friendly path' do
            expect(helpers.preview_story_url(view)).to eq('//example.com/stories/s/test-view-name/four-four/preview')
          end
        end
      end
    end

    describe '#edit_story_url' do
      it 'raises when encountering a plain dataset' do
        expect { helpers.edit_story_url(view) }.to raise_error('view is not a story')
      end

      describe 'when encountering a data lens' do
        let(:is_data_lens) { true }
        it 'raises' do
          expect { helpers.edit_story_url(view) }.to raise_error('view is not a story')
        end
      end

      describe 'when encountering a standalone visualization' do
        let(:is_standalone_visualization) { true }
        it 'raises' do
          expect { helpers.edit_story_url(view) }.to raise_error('view is not a story')
        end
      end

      describe 'when encountering a Pulse view' do
        let(:is_pulse) { true }
        it 'raises' do
          expect { helpers.edit_story_url(view) }.to raise_error('view is not a story')
        end
      end

      describe 'when encountering a story' do
        let(:is_story) { true }
        describe 'the name is blank' do
          let(:view_name) { '' }
          it 'returns a url in plain form' do
            expect(helpers.edit_story_url(view)).to eq('//example.com/stories/s/four-four/edit')
          end
        end
        describe 'the name is set' do
          it 'returns a url including a seo-friendly path' do
            expect(helpers.edit_story_url(view)).to eq('//example.com/stories/s/test-view-name/four-four/edit')
          end
        end
      end
    end
  end
end
