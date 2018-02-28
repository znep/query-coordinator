require 'rails_helper'

RSpec.describe 'presentation mode', type: :feature, js: true do
  let(:story_url) { '/s/magic-thing/pres-ents' }
  let(:story) { story_url }
  let(:edit_mode_selector) { '.btn-edit' }
  let(:presentation_mode_selector) { '.btn-presentation-mode:not(.socrata-icon-close-2)' }
  let(:presentation_mode_selector_enabled) { '.btn-presentation-mode.socrata-icon-close-2' }
  let(:presentation_nav) { '.presentation-navigation' }
  let(:presentation_nav_previous) { '.btn-presentation-previous' }
  let(:presentation_nav_next) { '.btn-presentation-next' }
  let(:valid_showing_block_selector) { '.block[data-page-index]:not(.hidden)' }
  let(:blacklisted_hidden_block_selector) { '.block:not([data-page-index]).hidden' }
  let(:domain_rights) { [] }
  let(:user) {
    {
      'id' => 'tugg-xxxx',
      'createdAt' => 1425577015,
      'displayName' => 'testuser',
      'domainRights' => domain_rights
    }
  }
  let(:user_story_authorization) {
    {
      'domainRights' => domain_rights
    }
  }


  shared_examples 'presentation mode' do
    it 'toggles presentation mode' do
      presentation_mode = page.all(presentation_mode_selector).first

      expect_presentation_mode_to_be_off
      expect_presentation_navigation_to_be_off

      presentation_mode.click

      expect_presentation_mode_to_be_on
      expect_presentation_navigation_to_be_on

      presentation_mode.click

      expect_presentation_mode_to_be_off
      expect_presentation_navigation_to_be_off
    end

    it 'opens presentation mode and uses presentation navigation next' do
      presentation_mode = page.all(presentation_mode_selector).first

      presentation_mode.click

      presentation_next = page.all(presentation_nav_next).first

      expect_presentation_mode_to_be_on
      expect_presentation_navigation_to_be_on

      currently_showing_block = page.all(valid_showing_block_selector).first
      estimated_next_showing_block = currently_showing_block['data-page-index'].last.to_i + 1

      presentation_next.click

      currently_showing_block = page.all(valid_showing_block_selector).first['data-page-index'].last.to_i

      expect(currently_showing_block).to equal(estimated_next_showing_block)
    end

    it 'opens presentation mode and uses presentation navigation previous' do
      presentation_mode = page.all(presentation_mode_selector).first
      presentation_prev = page.all(presentation_nav_previous, :visible => false).first
      presentation_next = page.all(presentation_nav_next, :visible => false).first

      presentation_mode.click

      expect_presentation_mode_to_be_on
      expect_presentation_navigation_to_be_on

      presentation_next.click

      currently_showing_block = page.all(valid_showing_block_selector).first
      estimated_next_showing_block = currently_showing_block['data-page-index'].last.to_i - 1

      presentation_prev.click

      currently_showing_block = page.all(valid_showing_block_selector).first['data-page-index'].last.to_i

      expect(currently_showing_block).to equal(estimated_next_showing_block)
    end

    it 'opens presentation mode and excludes blacklisted blocks' do
      presentation_mode = page.all(presentation_mode_selector).first
      presentation_mode.click

      blacklisted_elements = page.all(blacklisted_hidden_block_selector, :visible => false)
      expect(blacklisted_elements).not_to be_empty

      presentation_mode.click

      blacklisted_elements = page.all(blacklisted_hidden_block_selector, :visible => false)
      expect(blacklisted_elements).to be_empty
    end
  end

  def expect_presentation_mode_to_be_off
    expect(page).to have_selector(presentation_mode_selector)
  end

  def expect_presentation_mode_to_be_on
    expect(page).to have_selector(presentation_mode_selector_enabled)
  end

  def expect_presentation_navigation_to_be_off
    expect(page).to have_selector(presentation_nav_previous, visible: false)
    expect(page).to have_selector(presentation_nav_next, visible: false)
  end

  def expect_presentation_navigation_to_be_on
    expect(page).to have_selector(presentation_nav_previous, visible: true)
    expect(page).to have_selector(presentation_nav_next, visible: true)
  end

  before do
    stub_logged_in_user
    stub_sufficient_rights
    stub_core_view('pres-ents')
    stub_current_domain
    stub_approvals_settings

    set_feature_flags('enable_getty_images_gallery' => true, 'use_fontana_approvals' => true)

    allow(CoreServer).to receive(:current_user_story_authorization).and_return(user_story_authorization)

    visit story
  end

  context 'using /' do
    describe 'as a user that can edit' do
      let(:domain_rights) { ['edit_others_stories'] }

      describe 'edit mode button' do
        it 'has an edit mode button' do
          expect(page).to have_selector(edit_mode_selector)
        end

        it 'redirects to /edit when clicked' do
          expect(page).to have_selector(edit_mode_selector)
          page.all(edit_mode_selector).first.click

          expect(page.current_path).to match('/edit')
        end
      end

      it_behaves_like 'presentation mode'
    end

    describe 'as a user that cannot edit' do
      let(:user) { 'viewer' }

      it 'does not have an edit mode button' do
        expect(page).to_not have_selector(edit_mode_selector)
      end

      it_behaves_like 'presentation mode'
    end
  end

  context 'using /preview' do
    let(:story) { "#{story_url}/preview" }

    it 'does not have an edit mode button' do
      expect(page).to_not have_selector(edit_mode_selector)
    end

    it_behaves_like 'presentation mode'
  end

  context 'using ?present=true' do
    let(:story) { "#{story_url}?present=true" }

    it 'immediately starts presentation mode' do
      expect(page).to have_selector('.presentation-mode')
    end
  end
end
