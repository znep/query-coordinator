require 'rails_helper'

RSpec.describe 'rich text editor link creation', type: :feature, js: true do
  let(:uid) { 'href-bloc' }

  def open_modal
    page.find('.rich-text-editor-toolbar-btn-link').click
  end

  def close_modal
    click_button('Cancel')
  end

  def save_modal
    click_button('OK')
  end

  before do
    stub_logged_in_user
    stub_sufficient_rights
    stub_core_view(uid)
    stub_current_domain

    set_feature_flags('enable_getty_images_gallery' => true)

    visit "/s/magic-thing/#{uid}/edit?autosave=false"

    @blocks = page.all('.user-story .block-edit')
    @rte_toolbar = page.find('#rich-text-editor-toolbar')
  end

  after :each do
    unload_page_and_dismiss_confirmation_dialog
  end

  it 'loads hidden' do
    expect(page).to have_selector('#link-modal', visible: false)
  end

  describe 'opening and closing the modal' do

    before do
      @heading_block = @blocks.first
      link_toolbar_to_squire_instance(2)
      open_modal
    end

    it 'opens the link modal through the rich text toolbar' do
      expect(page).to have_selector('#link-modal', visible: true)
    end

    it 'closes the link modal with the "Cancel" button' do
      click_button('Cancel')
      expect(page).to have_selector('#link-modal', visible: false)
    end

    it 'closes the link modal with the top-right x' do
      page.find('.modal-close-btn').click
      expect(page).to have_selector('#link-modal', visible: false)
    end
  end

  describe 'when editing a selected block of text' do
    describe 'the text is not already a link' do
      before do
        @squire_frame = page.find('.block-edit:nth-child(2) .component-html iframe')
        @squire_frame.native.send_keys([os_control_key, 'a'])
        link_toolbar_to_squire_instance(2)
        open_modal
      end

      it 'displays the selected text in the text input' do
        expect(page).to have_field('display-text', :with => 'Your Great Story Title')
      end

      it 'displays an empty link input' do
        expect(page).to have_field('link-text', :with => '')
      end

      it 'displays a checked "Open In New Window" checkbox' do
        expect(page).to have_checked_field('open-in-new-window', :visible => false)
      end
    end

    describe 'the text is a link' do
      before do
        @squire_frame = page.find('.block-edit:nth-child(3) .component-html iframe')
        @squire_frame.native.send_keys([true ? :command : :control, 'a'])
        link_toolbar_to_squire_instance(3)
        open_modal
      end

      it 'displays the selected text in the text input' do
        expect(page).to have_field('display-text', :with => 'Hello, Link!')
        close_modal
      end

      it 'displays the selected link input' do
        expect(page).to have_field('link-text', :with => 'https://opendata.socrata.com')
        close_modal
      end

      it 'displays a checked "Open In New Window"' do
        expect(page).to have_checked_field('open-in-new-window', :visible => false)
        close_modal
      end

      describe 'changing the fields from their original values' do
        before do
          fill_in('display-text', :with => 'New Text')
          fill_in('link-text', :with => 'https://newurl.com')
          find('label[for="open-in-new-window"]').click
          find('#link-modal .btn-primary:not(:disabled)')

          save_modal
        end

        it 'replaces the text with new text' do
          within_frame(@squire_frame) do
            expect(page).to have_selector('body a')
            expect(page).to have_text('New Text')
          end
        end

        it 'only contains one anchor tag' do
          within_frame(@squire_frame) do
            expect(page).to have_selector('body a', :count => 1)
          end
        end

        it 'replaces the href with a new href' do
          within_frame(@squire_frame) do
            anchor = page.find('body a')
            expect(anchor['href']).to eq('https://newurl.com/')
          end
        end

        it 'replaces the target with a new target' do
          within_frame(@squire_frame) do
            anchor = page.find('body a')
            expect(anchor['target']).to eq('_self')
          end
        end
      end
    end
  end
end
