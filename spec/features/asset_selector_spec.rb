require 'rails_helper'

RSpec.describe 'asset selector', type: :feature, js: true do
  let(:enable_getty_images_gallery) { false }

  before do
    Rails.application.config.enable_getty_images_gallery = enable_getty_images_gallery

    stub_logged_in_user
    stub_sufficient_rights
    stub_core_view('hero-that')
    stub_current_domain

    visit '/s/magic-thing/hero-that/edit'
  end

  after do
    Rails.application.config.enable_getty_images_gallery = false
  end

  describe 'when editing a hero image' do
    let(:enable_getty_images_gallery) { true }

    before do
      page.find('.hero-add-controls button').click
    end

    describe 'getty image tab' do
      before do
        page.find('[href="#page-getty"]').click
      end

      it 'renders a cancel button' do
        expect(page).to have_selector('[data-action="ASSET_SELECTOR_CLOSE"]')
      end
    end
  end
end
