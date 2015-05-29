require 'rails_helper'

# user
valid_user = 'test_user@socrata.com'

# four_by_four
valid_four_by_four = 'test-data'
invalid_four_by_four = 'invalid'

# block id
FactoryGirl.build(:block).save!
valid_existing_block_id = Block.last.id

# individual block
valid_new_block = { layout: '12', components: [ { type: 'text', value: 'Hello, world!'} ] }.freeze
valid_existing_block = { id: valid_existing_block_id }.freeze
invalid_new_block = { invalid: true }
invalid_existing_block_1 = { id: 0 }.freeze
invalid_existing_block_2 = { id: -1 }.freeze
invalid_existing_block_3 = { id: 'what' }.freeze

# block id arrays
valid_existing_block_ids = [ valid_existing_block_id ]

# json block arrays
valid_all_new_blocks = [ valid_new_block.dup ]
valid_some_new_blocks = [ valid_new_block.dup, valid_existing_block.dup ]
invalid_new_blocks = [ invalid_new_block.dup ]
invalid_existing_blocks_1 = [ valid_new_block.dup, invalid_existing_block_1.dup ]
invalid_existing_blocks_2 = [ valid_new_block.dup, invalid_existing_block_2.dup ]
invalid_existing_blocks_3 = [ valid_new_block.dup, invalid_existing_block_3.dup ]

# stories
story_with_no_existing_blocks = FactoryGirl.build(
  :draft_story,
  four_by_four: valid_four_by_four,
  blocks: [],
  created_by: valid_user
).save!


RSpec.describe StoryDraftCreator do

  context 'when instantiated with a non-array value for attributes[:blocks]' do

    it 'raises an exception' do
      expect {
        @story_creator = StoryDraftCreator.new(
          valid_user,
          four_by_four: valid_four_by_four,
          blocks: 'this is not an array'
        )
      }.to raise_error
    end
  end

  describe '#create' do

    context 'when called on an instance created with valid attributes' do

      context 'with no four by four' do

        context 'with no existing blocks' do

          before do
            @story_creator = StoryDraftCreator.new(valid_user, blocks: valid_all_new_blocks)
            @story = @story_creator.create
          end

          it 'returns a DraftStory object' do
            expect(@story).to be_a(DraftStory)
          end

          it 'creates new blocks' do
            expect(Block.find(@story.blocks.first)).to be_a(Block)
          end

          it 'creates a new draft story' do
            expect(DraftStory.find(@story.id)).to be_a(DraftStory)
          end
        end

        # In this case we are saying that this is a new story but that it should
        # include existing blocks. This is not a valid state: all blocks associated
        # with a story must have been created as part of that story.
        context 'with existing blocks' do

          before do
            @story_creator = StoryDraftCreator.new(valid_user, blocks: valid_some_new_blocks)
          end

          it 'raises an exception' do
            expect {
              @story = @story_creator.create
            }.to raise_error
          end

          it 'does not create a DraftStory object' do
            expect(@story).to_not be_a(DraftStory)
          end
        end
      end

      context 'with a four by four' do

        context 'with no existing blocks' do

          before do
            # Ensure there is an existing DraftStory with the specified four by four.
            FactoryGirl.build(
              :draft_story,
              four_by_four: valid_four_by_four,
              blocks: [],
              created_by: valid_user
            ).save!

            @story_creator = StoryDraftCreator.new(
              valid_user,
              four_by_four: valid_four_by_four,
              blocks: valid_all_new_blocks
            )
            @story = @story_creator.create
          end

          it 'returns a DraftStory object' do
            expect(@story).to be_a(DraftStory)
          end

          it 'creates new blocks' do
            expect(Block.find(@story.blocks.first)).to be_a(Block)
          end

          it 'creates a new draft story' do
            expect(DraftStory.find(@story.id)).to be_a(DraftStory)
          end
        end

        context 'with existing blocks' do

          before do
            # Ensure there is an existing DraftStory with the specified four by four.
            FactoryGirl.build(
              :draft_story,
              four_by_four: valid_four_by_four,
              blocks: valid_existing_block_ids,
              created_by: valid_user
            ).save!

            @story_creator = StoryDraftCreator.new(
              valid_user,
              four_by_four: valid_four_by_four,
              blocks: valid_some_new_blocks
            )
            @story = @story_creator.create
          end

          it 'returns a DraftStory object' do
            expect(@story).to be_a(DraftStory)
          end

          it 'creates new blocks' do
            expect(Block.find(@story.blocks.first)).to be_a(Block)
          end

          it 'creates a new draft story' do
            expect(DraftStory.find(@story.id)).to be_a(DraftStory)
          end
        end
      end
    end

    context 'when called on an instance created with an invalid four by four' do

      context 'with no existing blocks' do

        before do
          @story_creator = StoryDraftCreator.new(
            valid_user,
            four_by_four: invalid_four_by_four,
            blocks: valid_all_new_blocks
          )
        end

        it 'raises an exception' do
          expect {
            @story = @story_creator.create
          }.to raise_error
        end

        it 'does not create a DraftStory object' do
          expect(@story).to_not be_a(DraftStory)
        end
      end

      context 'with existing blocks' do

        before do
          @story_creator = StoryDraftCreator.new(
            valid_user,
            four_by_four: invalid_four_by_four,
            blocks: valid_some_new_blocks
          )
        end

        it 'raises an exception' do
          expect {
            @story = @story_creator.create
          }.to raise_error
        end

        it 'does not create a DraftStory object' do
          expect(@story).to_not be_a(DraftStory)
        end
      end
    end

    context 'when called on an instance created with invalid blocks' do

      context 'with no existing blocks' do

        before do
          @story_creator = StoryDraftCreator.new(
            valid_user,
            four_by_four: invalid_four_by_four,
            blocks: invalid_new_blocks
          )
        end

        it 'raises an exception' do
          expect {
            @story = @story_creator.create
          }.to raise_error
        end

        it 'does not create a DraftStory object' do
          expect(@story).to_not be_a(DraftStory)
        end
      end

      context 'with existing blocks' do

        it 'raises an exception and does not create a new draft story with an existing block with id < 1' do
          @story_creator = StoryDraftCreator.new(
            valid_user,
            four_by_four: invalid_four_by_four,
            blocks: invalid_existing_blocks_1
          )
          expect {
            @story = @story_creator.create
          }.to raise_error
          expect(@story).to_not be_a(DraftStory)
        end

        it 'raises an exception and does not create a new draft story with an existing block with id < 0' do
          @story_creator = StoryDraftCreator.new(
            valid_user,
            four_by_four: invalid_four_by_four,
            blocks: invalid_existing_blocks_2
          )
          expect {
            @story = @story_creator.create
          }.to raise_error
          expect(@story).to_not be_a(DraftStory)
        end

        it 'raises an exception and does not create a new draft story with an existing block with non-numeric id' do
          @story_creator = StoryDraftCreator.new(
            valid_user,
            four_by_four: invalid_four_by_four,
            blocks: invalid_existing_blocks_3
          )
          expect {
            @story = @story_creator.create
          }.to raise_error
          expect(@story).to_not be_a(DraftStory)
        end

        it 'raises an exception and does not create a new draft story with an existing block id > largest block id' do
          largest_block_id = Block.last.id
          invalid_existing_blocks_n = [ valid_new_block.dup, { id: largest_block_id + 1 } ]

          @story_creator = StoryDraftCreator.new(
            valid_user,
            four_by_four: invalid_four_by_four,
            blocks: invalid_existing_blocks_n
          )
          expect {
            @story = @story_creator.create
          }.to raise_error
          expect(@story).to_not be_a(DraftStory)
        end
      end
    end
  end
end
