require 'rails_helper'

RSpec.describe ThemesHelper, type: :helper do
  describe '#sass_engine_options' do
    let(:subject) { helper.sass_engine_options }

    it 'sets syntax to :scss' do
      expect(subject[:syntax]).to eq(:scss)
    end

    it 'sets load_paths' do
      expect(subject[:load_paths].size).to eq(1)
      expect(subject[:load_paths].first).to match(%r{/app/assets/stylesheets/themes})
    end

    context 'when rails env is development' do
      before do
        allow(Rails.env).to receive(:development?).and_return(true)
      end

      it 'sets style to :nested' do
        expect(subject[:style]).to eq(:nested)
      end
    end

    context 'when rails env is production' do
      before do
        allow(Rails.env).to receive(:development?).and_return(false)
      end

      it 'sets style to :compressed' do
        expect(subject[:style]).to eq(:compressed)
      end
    end
  end

  describe '#cache_key_for_custom_themes' do
    let(:themes) { [] }
    let(:env_cache_key) { 'foobar' }
    let(:result) { helper.cache_key_for_custom_themes(themes) }

    before do
      allow(Rails.application.config).to receive(:theme_cache_key_prefix).and_return(env_cache_key)
    end

    context 'when no themes' do
      let(:themes) { [] }

      it 'is nil' do
        expect(result).to be_nil
      end
    end

    context 'when one theme' do
      let(:themes) { [double('theme', updated_at: 12345, domain_cname: 'thedomain.gov')] }

      it 'is based on updated_at, domain, and THEME_CACHE_KEY environment variable' do
        expect(result).to eq("thedomain.gov/themes/custom-#{env_cache_key}-12345")
      end
    end

    context 'when more than one theme' do
      let(:themes) do
        [
          double('theme', updated_at: 54321, domain_cname: 'thedomain.gov'),
          double('theme', updated_at: 12345, domain_cname: 'thedomain.gov')
        ]
      end

      it 'is based on updated_at and domain, and THEME_CACHE_KEY environment variable' do
        expected_cache_key_updated_at_part = 54321 + 12345
        expect(result).to eq("thedomain.gov/themes/custom-#{env_cache_key}-#{expected_cache_key_updated_at_part}")
      end
    end
  end

  describe '#theme_style_property' do
    let(:story_theme_json) { JSON.parse(fixture('story_theme.json').read).first }
    let(:theme) { Theme.from_core_config(story_theme_json).as_json }

    it 'creates the theme property for inline styling' do
      expect(theme_style_property(theme, 'font-size', '$medium')).to eq('font-size: 768px;')
    end
  end

  describe '#section_starts_expanded' do
    let(:story_theme_json) { JSON.parse(fixture(fixture_name).read).first }
    let(:theme) { Theme.from_core_config(story_theme_json) }

    context 'list-custom-bullet' do
      context 'with a custom bullet config' do
        let(:fixture_name) { 'story_theme_with_custom_bullet.json' }
        it 'is true' do
          expect(section_starts_expanded(theme, 'list-custom-bullet')).to eq(true)
        end
      end
      context 'with no custom bullet config' do
        let(:fixture_name) { 'story_theme_minimal.json' }
        it 'is false' do
          expect(section_starts_expanded(theme, 'list-custom-bullet')).to eq(false)
        end
      end
    end

    context 'google-font-code' do
      context 'with a google font code configured' do
        let(:fixture_name) { 'story_theme_with_google_font.json' }
        it 'is true' do
          expect(section_starts_expanded(theme, 'google-font-code')).to be true
        end
      end
      context 'with no google font code configured' do
        let(:fixture_name) { 'story_theme_minimal.json' }
        it 'is false' do
          expect(section_starts_expanded(theme, 'google-font-code')).to be false
        end
      end
    end

    context 'some random unspecified section' do
      let(:fixture_name) { 'story_theme_minimal.json' }
      it 'is false' do
        expect(section_starts_expanded(theme, 'some-random-section')).to be false
      end
    end
  end

  describe '#strip_byte_order_marks!' do
    let(:no_bom) { "nope" }
    let(:bom) { "\xEF\xBB\xBF".force_encoding('utf-8') }

    it 'removes byte order marks if present' do
      strip_byte_order_marks!(no_bom)
      strip_byte_order_marks!(bom)

      expect(no_bom).to eq('nope')
      expect(bom).to eq('')
    end
  end
end
