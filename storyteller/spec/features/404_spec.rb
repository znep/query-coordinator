require 'rails_helper'

RSpec.describe '404', type: :feature do
  let(:missing_story_url) { '/s/gonna-miss-you-when-im-gone/fake-four' }

  describe 'when the user is logged in' do
    before do
      stub_logged_in_user
      visit missing_story_url
    end

    it 'does not render a login notice' do
      expect(page).to_not have_selector('.application-error-login-notice')
    end
  end

  describe 'when the user isn\'t logged in' do
    before do
      visit missing_story_url
    end

    it 'renders a login notice' do
      expect(page).to have_selector('.application-error-login-notice')
    end
  end
end
