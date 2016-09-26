require 'rails_helper'

RSpec.describe ApplicationHelper, type: :helper do

  describe '#page_title' do
    let(:view_name) { 'bob' }
    let(:core_attributes) do
      { 'name' => view_name }
    end
    let(:site_chrome_window_title) { 'Fancy' }

    before do
      allow(helper).to receive(:core_attributes).and_return(core_attributes)
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
end
