require 'rails_helper'

RSpec.describe ApplicationHelper, type: :helper do

  describe '#page_title' do
    let(:view_name) { 'bob' }
    let(:mock_core_response) do
      {
        'uid' => 'four-four',
        'name' => view_name,
        'description' => 'Description'
      }
    end
    let(:site_chrome_window_title) { 'Fancy' }

    before do
      expect(CoreServer).to receive(:get_view).once.and_return(mock_core_response)
      @story_metadata = CoreStoryMetadata.new('fooo-baar')
      allow(helper).to receive(:site_chrome_window_title).and_return(site_chrome_window_title)
    end

    it 'uses view name and site chrome window title' do
      expect(page_title).to eq("#{view_name} | #{site_chrome_window_title}")
    end

    context 'when view_name is nil' do
      let(:view_name) { nil }

      it 'uses a default' do
        expect(page_title).to match(/^Socrata Perspectives |/)
      end
    end

    context 'when view_name is empty string' do
      let(:view_name) { '' }

      it 'uses a default' do
        expect(page_title).to match(/^Socrata Perspectives |/)
      end
    end

    context 'when site chrome window title is nil' do
      let(:site_chrome_window_title) { nil }

      it 'does not include a pipe' do
        expect(page_title).to eq(view_name)
      end
    end

    context 'when site chrome window title is blank' do
      let(:site_chrome_window_title) { '' }

      it 'does not include a pipe' do
        expect(page_title).to eq(view_name)
      end
    end
  end

  describe '#current_editor_translations' do
    around do |example|
      locale = example.metadata[:locale]
      I18n.with_locale(locale) { example.run }
    end

    it 'loads editor translations in English', locale: :en do |example|
      helper.params[:locale] = example.metadata[:locale]
      translations = current_editor_translations

      expect(translations.keys).to eq(%w{editor})
      expect(translations[:editor][:story_save_error_try_again]).to eq('Try again.')
    end

    it 'falls back to English when using non-English languages', locale: :fr do |example|
      helper.params[:locale] = example.metadata[:locale]
      translations = current_editor_translations

      expect(translations.keys).to eq(%w{editor})
      expect(translations[:editor][:story_save_error_try_again]).to eq('Try again.')
    end
  end
end
