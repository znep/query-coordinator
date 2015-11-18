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

      it 'sets style to :nested' do
        expect(subject[:style]).to eq(:compressed)
      end
    end
  end

  describe '#cache_key_for_custom_themes' do
    let(:themes) { [] }
    let(:cache_key) { helper.cache_key_for_custom_themes(themes) }

    context 'when no themes' do
      let(:themes) { [] }

      it 'is nil' do
        expect(cache_key).to be_nil
      end
    end

    context 'when one theme' do
      let(:themes) { [double('theme', updated_at: 12345, domain_cname: 'thedomain.gov')] }

      it 'is based on updated_at and domain' do
        expect(cache_key).to eq('thedomain.gov/themes/custom-12345')
      end
    end

    context 'when more than one theme' do
      let(:themes) do
        [
          double('theme', updated_at: 54321, domain_cname: 'thedomain.gov'),
          double('theme', updated_at: 12345, domain_cname: 'thedomain.gov')
        ]
      end

      it 'is based on updated_at and domain' do
        expect(cache_key).to eq('thedomain.gov/themes/custom-66666')
      end
    end
  end
end
