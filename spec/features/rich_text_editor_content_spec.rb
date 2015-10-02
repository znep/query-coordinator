require 'rails_helper'

RSpec.describe 'rich text editor content', type: :feature, js: true do
  let(:uid) { 'h1bl-ocks' }

  before do
    stub_logged_in_user
    stub_core_view(uid)
    visit "/s/magic-thing/#{uid}/edit"
    @blocks = page.all('.user-story .block-edit')
    @rte_toolbar = page.find('#rich-text-editor-toolbar')
    @change_format_select = @rte_toolbar.find('[data-editor-action=change-format]')
  end

  after :each do
    # Force the "are you sure you want to discard your unsaved changes"
    # modal to come up at a deterministic time. We can't do it in `before`,
    # as the modal comes up on page unload time. Thus any unrelated test that
    # happens to run after the last test in this file will fail (Selenium will
    # complain of an unhandled modal).
    unload_page_and_dismiss_confirmation_dialog
  end

  describe 'change block type' do

    before do
      @heading_block = @blocks.first
      @squire_frame = @heading_block.find('iframe')
    end

    it 'removes extra div added by squire' do
      within_frame(@squire_frame) do
        expect(all('h1').length).to eq(1)
        expect(all('div').length).to eq(0)

        find('h1').set('New Title')

        expect(all('div').length).to eq(0)
      end
    end

    # it 'moves up when "move up" button is clicked' do
    #   initial_position = @last_block.native.location.y

    #   # move block up
    #   @last_block.hover
    #   @last_block.find('[data-block-move-action="STORY_MOVE_BLOCK_UP"]').click
    #   after_move_position = @last_block.native.location.y

    #   expect(after_move_position).to be < initial_position
    # end

    # it 'disables "move up" for the first block' do
    #   @first_block.hover
    #   expect(@first_block.find('[data-block-move-action="STORY_MOVE_BLOCK_UP"]')[:disabled]).to eq('true')
    # end

    # it 'moves down when "move down" button is clicked' do
    #   initial_position = @first_block.native.location.y

    #   # move block down
    #   @first_block.hover
    #   @first_block.find('[data-block-move-action="STORY_MOVE_BLOCK_DOWN"]').click
    #   after_move_position = @first_block.native.location.y

    #   expect(after_move_position).to be > initial_position
    # end

    # it 'disables "move down" for the last block' do
    #   @last_block.hover
    #   expect(@last_block.find('[data-block-move-action="STORY_MOVE_BLOCK_DOWN"]')[:disabled]).to eq("true")
    # end
  end
end
