require 'rails_helper'

RSpec.describe 'view mode', type: :feature, js: true do
  before do
    stub_logged_in_user
    stub_sufficient_rights
    stub_core_view('kchn-sink')
    stub_current_domain

    set_feature_flags(
      'enable_getty_images_gallery' => true,
      'enable_deprecated_user_search_api' => false
    )

    visit '/s/magic-thing/kchn-sink'
  end

  describe 'when rendering an image block' do
    describe 'without a link' do
      it 'renders only an <img> tag' do
        expect(page).to have_selector('.component-image > img[alt="image without link"]')
      end
    end

    describe 'with a link' do
      it 'renders an <img> tag inside an <a> tag' do
        expect(page).to have_selector('.component-image a[href="http://example.com"] img[alt="image with link"]')
      end
    end
  end
end
