require 'rails_helper'

RSpec.describe 'block edit controls', type: :feature, js: true do

  before do
    stub_logged_in_user
    stub_sufficient_rights
    stub_core_view('hasb-lock')
    visit '/s/magic-thing/hasb-lock/edit'
    @blocks = page.all('.user-story .block-edit')
  end

  after :each do
    # Force the "are you sure you want to discard your unsaved changes"
    # modal to come up at a deterministic time. We can't do it in `before`,
    # as the modal comes up on page unload time. Thus any unrelated test that
    # happens to run after the last test in this file will fail (Selenium will
    # complain of an unhandled modal).
    unload_page_and_dismiss_confirmation_dialog
  end

  describe 'move' do

    before do
      @first_block = @blocks.first
      @last_block = @blocks.last

      # Remove the transform transition so that we do not have to coordinate
      # checking blocks' positions with the transition animation.
      page.evaluate_script("$('.block-edit').css('transition', 'none');")
    end

    context 'hovering over the move up button' do
      it 'displays a flyout on hover' do
        @first_block.hover
        @first_block.find('[data-block-move-action="STORY_MOVE_BLOCK_UP"]').hover
        expect(@first_block).to have_selector('.block-edit-controls-move-up-flyout')
      end
    end

    context 'hovering over the move down button' do
      it 'displays a flyout on hover' do
        @first_block.hover
        @first_block.find('[data-block-move-action="STORY_MOVE_BLOCK_DOWN"]').hover
        expect(@first_block).to have_selector('.block-edit-controls-move-down-flyout')
      end
    end

    # TODO These tests don't account for the block scrolling into view after moving.
    it 'moves up when "move up" button is clicked' do
      initial_position = @last_block.native.location.y

      # move block up
      @last_block.hover
      javascript_click(@last_block.find('[data-block-move-action="STORY_MOVE_BLOCK_UP"]'))
      after_move_position = @last_block.native.location.y

      expect(after_move_position).to be < initial_position
    end

    it 'disables "move up" for the first block' do
      @first_block.hover
      expect(@first_block.find('[data-block-move-action="STORY_MOVE_BLOCK_UP"]')[:disabled]).to eq('true')
    end

    it 'moves down when "move down" button is clicked' do
      initial_position = @first_block.native.location.y

      # move block down
      @first_block.hover
      @first_block.find('[data-block-move-action="STORY_MOVE_BLOCK_DOWN"]').click
      after_move_position = @first_block.native.location.y

      expect(after_move_position).to be > initial_position
    end

    it 'disables "move down" for the last block' do
      @last_block.hover
      expect(@last_block.find('[data-block-move-action="STORY_MOVE_BLOCK_DOWN"]')[:disabled]).to eq("true")
    end
  end

  describe 'toggle presentation view' do
    before do
      @first_block = @blocks.first
    end

    context 'when the block is hovered over' do
      it 'displays a flyout' do
        @first_block.hover
        @first_block.find('[data-block-presentation-action]').hover
        expect(@first_block).to have_selector('.block-edit-controls-presentation-flyout')
      end
    end

    context 'when the block is toggled from visible to hidden' do
      before do
        @first_block.hover
        @first_block.find('[data-block-presentation-action]').click
      end

      it 'adds .active' do
        expect(@first_block).to have_selector('[data-block-presentation-action].active')
      end
    end

    context 'when the block is toggled from hidden to visible' do
      it 'removes .active' do
        @first_block.hover
        @first_block.find('[data-block-presentation-action]').click
        @first_block.hover
        @first_block.find('[data-block-presentation-action]').click
        expect(@first_block).to_not have_selector('[data-block-presentation-action].active')
      end
    end
  end

  describe 'delete' do

    context 'when the block needs a delete confirmation' do
      before do
        @first_block = @blocks.first
        @first_block.hover
      end

      it 'removes a block when delete is clicked' do
        expect {
          @first_block.find('[data-block-delete-action="STORY_DELETE_BLOCK"]').click
          page.accept_alert
        }.to change{
          page.all('.user-story .block-edit').count
        }.by(-1)
      end

      it 'does not delete when the confirmation is cancelled' do
        expect {
          @first_block.find('[data-block-delete-action="STORY_DELETE_BLOCK"]').click
          page.driver.browser.switch_to.alert.dismiss
        }.to_not change{
          page.all('.user-story .block-edit').count
        }
      end
    end
  end
end
