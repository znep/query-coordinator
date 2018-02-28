require 'rails_helper'

RSpec.describe 'view mode', type: :feature, js: true do
  before do
    stub_logged_in_user
    stub_sufficient_rights
    stub_core_view('kchn-sink')
    stub_current_domain
    stub_approvals_settings

    set_feature_flags('enable_getty_images_gallery' => true, 'use_fontana_approvals' => true)
  end

  describe 'when rendering an image block' do
    describe 'without a link' do
      it 'renders only an <img> tag' do
        visit '/s/magic-thing/kchn-sink'
        expect(page).to have_selector('.component-image > img[alt="image without link"]')
      end
    end

    describe 'with a link' do
      it 'renders an <img> tag inside an <a> tag' do
        visit '/s/magic-thing/kchn-sink'
        expect(page).to have_selector('.component-image a[href="http://example.com"] img[alt="image with link"]')
      end
    end

    describe 'with value.openInNewWindow set to false' do
      it 'renders an <a> tag with target="_self"' do
        visit '/s/magic-thing/link-self'
        expect(page).to have_selector('.component-image a[target="_self"]')
      end
    end

    describe 'with value.openInNewWindow set to true' do
      it 'renders an <a> tag with target="_blank"' do
        visit '/s/magic-thing/link-blnk'
        expect(page).to have_selector('.component-image a[target="_blank"]')
      end
    end
  end
end
