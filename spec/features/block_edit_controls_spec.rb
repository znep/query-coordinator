require 'rails_helper'

RSpec.describe 'block edit controls', type: :feature do

  before do
    allow_any_instance_of(ApplicationController).to receive(:require_logged_in_user).and_return(true)
    visit '/s/magic-thing/hasb-lock/edit'
    @blocks = page.all('.user-story .block-edit')
  end

  describe 'move', js: true do
    before do
      @last_block   = @blocks.last
      @first_block  = @blocks.first
    end

    # TODO These tests don't account for the block scrolling into view after moving.
    it 'moves up when "move up" button is clicked' do
      initial_position = @last_block.native.location.y

      # move block up
      @last_block.hover
      @last_block.find('[data-block-move-action="STORY_MOVE_BLOCK_UP"]').click
      sleep 0.5
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
      sleep 0.3
      after_move_position = @first_block.native.location.y

      expect(after_move_position).to be > initial_position
    end

    it 'disables "move down" for the last block' do
      @last_block.hover
      expect(@last_block.find('[data-block-move-action="STORY_MOVE_BLOCK_DOWN"]')[:disabled]).to eq("true")
    end

  end


  describe 'delete', js: true do

    context 'when the block needs a delete confirmation' do
      before do
        @first_block  = @blocks.first
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
