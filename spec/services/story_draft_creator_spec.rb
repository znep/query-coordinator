require 'rails_helper'

RSpec.describe StoryDraftCreator do

  let(:user) { 'test_user@socrata.com' }
  let(:four_by_four) { 'test-data' }

  # stories
  let(:story_with_no_existing_blocks) {
    FactoryGirl.create(
      :draft_story,
      uid: four_by_four,
      created_by: user
    )
  }

  let(:blocks) { [ valid_new_block.dup ] }

  let(:story_creator) {
    StoryDraftCreator.new(
      user,
      four_by_four: four_by_four,
      blocks: blocks
    )
  }

  let(:result) { story_creator.create }

  # block id
  def existing_block_id
    @existing_block_id ||= FactoryGirl.create(:block).id
  end

  # individual blocks
  def valid_new_block
    { layout: '12', components: [ { type: 'text', value: 'Hello, world!'} ] }.freeze
  end

  def valid_existing_block
    { id: existing_block_id }.freeze
  end

  def invalid_new_block
    { invalid: true }
  end

  def invalid_existing_block_1
    { id: 0 }.freeze
  end

  def invalid_existing_block_2
    { id: -1 }.freeze
  end

  def invalid_existing_block_3
    { id: 'what' }.freeze
  end

  # block arrays
  def valid_no_existing_blocks
    [ valid_new_block.dup ]
  end

  def valid_some_existing_blocks
    [ valid_new_block.dup, valid_existing_block.dup ]
  end

  def invalid_new_blocks
    [ invalid_new_block.dup ]
  end

  def invalid_existing_blocks_1
    [ valid_new_block.dup, invalid_existing_block_1.dup ]
  end

  def invalid_existing_blocks_2
    [ valid_new_block.dup, invalid_existing_block_2.dup ]
  end

  def invalid_existing_blocks_3
    [ valid_new_block.dup, invalid_existing_block_3.dup ]
  end

  def existing_draft_story
    @existing_draft_story ||= begin
      FactoryGirl.create(
        :draft_story,
        uid: four_by_four,
        created_by: user
      )
    end
  end

  context 'when instantiated with a non-array value for attributes[:blocks]' do
    let(:blocks) { 'this is not an array' }

    it 'raises an exception' do
      expect {
        StoryDraftCreator.new(
          user,
          four_by_four: four_by_four,
          blocks: blocks
        )
      }.to raise_error(ArgumentError)
    end
  end

  describe '#create' do

    context 'when called on an instance created with valid attributes' do

      context 'with no uid' do

        let(:story_creator) { StoryDraftCreator.new(user, blocks: blocks) }

        context 'with no existing blocks' do

          let(:blocks) { valid_no_existing_blocks }

          it 'returns a DraftStory object' do
            expect(result).to be_a(DraftStory)
          end

          it 'creates new blocks' do
            expect(Block.find(result.block_ids.first)).to be_a(Block)
          end

          it 'creates a new draft story' do
            expect(DraftStory.find(result.id)).to be_a(DraftStory)
          end
        end

        # In this case we are saying that this is a new story but that it should
        # include existing blocks. This is not a valid state: all blocks associated
        # with a story must have been created as part of that story.
        context 'with existing blocks' do

          let(:blocks) { valid_some_existing_blocks }

          it 'raises an exception and does not create a DraftStory object' do

            expect {
              @invalid_draft_story = story_creator.create
            }.to raise_error(StoryDraftCreator::InvalidBlockIdsError)

            expect(@invalid_draft_story).to_not be_a(DraftStory)

            expect {
              begin
                story_creator.create
              rescue => error
              end
            }.to_not change { DraftStory.count }
          end
        end
      end

      context 'with a uid' do

        let(:story_creator) {
          StoryDraftCreator.new(
            user,
            four_by_four: four_by_four,
            blocks: blocks
          )
        }

        context 'with no existing blocks' do

          let(:blocks) { valid_no_existing_blocks }

          it 'returns a DraftStory object' do
            expect(result).to be_a(DraftStory)
          end

          it 'creates new blocks' do
            expect(Block.find(result.block_ids.first)).to be_a(Block)
          end

          it 'creates a new draft story' do
            expect(DraftStory.find(result.id)).to be_a(DraftStory)
          end
        end

        context 'with existing blocks' do

          let(:blocks) { valid_some_existing_blocks }

          before do
            FactoryGirl.create(
              :draft_story,
              uid: four_by_four,
              block_ids: [ existing_block_id ],
              created_by: user
            )
          end

          it 'returns a DraftStory object' do
            expect(result).to be_a(DraftStory)
          end

          it 'creates new blocks' do
            expect(Block.find(result.block_ids.first)).to be_a(Block)
          end

          it 'creates a new draft story' do
            expect(DraftStory.find(result.id)).to be_a(DraftStory)
          end
        end
      end
    end

    context 'when called on an instance created with an invalid four by four' do

      let(:four_by_four) { 'invalid' }

      context 'with no existing blocks' do

        let(:blocks) { [] }

        it 'raises an exception' do
          expect {
            StoryDraftCreator.new(
              user,
              four_by_four: four_by_four,
              blocks: blocks
            )
          }.to raise_error(ArgumentError)
        end

        it 'does not create a DraftStory object' do
          expect {
            begin
              StoryDraftCreator.new(
                user,
                four_by_four: four_by_four,
                blocks: blocks
              )
            rescue => error
            end
          }.to_not change { DraftStory.count }
        end
      end

      context 'with existing blocks' do

        let(:blocks) { valid_some_existing_blocks }

        it 'raises an exception and does not create a DraftStory object' do
          expect {
            StoryDraftCreator.new(
              user,
              four_by_four: four_by_four,
              blocks: blocks
            )
          }.to raise_error

          expect {
            begin
              StoryDraftCreator.new(
                user,
                four_by_four: four_by_four,
                blocks: blocks
              )
            rescue => error
            end
          }.to_not change { DraftStory.count }
        end
      end
    end

    context 'when called on an instance created with invalid blocks' do

      context 'with no existing blocks' do

        let(:blocks) { invalid_new_blocks }

        it 'raises an exception and does not create a DraftStory object' do
          expect {
            @story = story_creator.create
          }.to raise_error(StoryDraftCreator::InvalidNewBlocksError)

          expect(@story).to be_nil

          expect {
            begin
              story_creator.create
            rescue => error
            end
          }.to_not change { DraftStory.count }
        end
      end

      context 'with an existing block that is not a hash' do

        let(:blocks) { [1] }

        it 'raises an exception and does not create a DraftStory object' do
          expect {
            StoryDraftCreator.new(
              user,
              four_by_four: four_by_four,
              blocks: blocks
            )
          }.to raise_error(ArgumentError)

          expect {
            begin
              StoryDraftCreator.new(
                user,
                four_by_four: four_by_four,
                blocks: blocks
              )
            rescue => error
            end
          }.to_not change { DraftStory.count }
        end
      end

      context 'with existing blocks that are hashes' do

        context 'with an existing block with an id < 1' do

          let(:blocks) { invalid_existing_blocks_1 }

          it 'raises an exception and does not create a DraftStory object' do

            expect {
              @story = story_creator.create
            }.to raise_error(StoryDraftCreator::InvalidBlockIdsError)

            expect(@story).to be_nil

            expect {
              begin
                story_creator.create
              rescue => error
              end
            }.to_not change { DraftStory.count }
          end
        end

        context 'with an existing block with an id < 0' do

          let(:blocks) { invalid_existing_blocks_2 }

          it 'raises an exception and does not create a DraftStory object' do

            expect {
              @story = story_creator.create
            }.to raise_error(StoryDraftCreator::InvalidBlockIdsError)

            expect(@story).to be_nil

            expect {
              begin
                story_creator.create
              rescue => error
              end
            }.to_not change { DraftStory.count }
          end
        end

        context 'with an existing block with a non-numeric id' do

          let(:blocks) { invalid_existing_blocks_3 }

          it 'raises an exception and does not create a DraftStory object' do

            expect {
              @story = story_creator.create
            }.to raise_error(StoryDraftCreator::InvalidBlockIdsError)

            expect(@story).to be_nil

            expect {
              begin
                story_creator.create
              rescue => error
              end
            }.to_not change { DraftStory.count }
          end
        end

        context 'with an existing block with an id > the largest block id' do

          before do
            @new_block = FactoryGirl.create(:block)
            existing_story = FactoryGirl.create(
              :draft_story,
              uid: four_by_four,
              block_ids: [ @new_block.id ]
            )
          end

          let(:blocks) { [ { id: (@new_block.id + 1) } ] }

          it 'raises an exception and does not create a DraftStory object' do

            expect {
              @story = story_creator.create
            }.to raise_error(StoryDraftCreator::InvalidBlockIdsError)

            expect(@story).to be_nil

            expect {
              begin
                story_creator.create
              rescue => error
              end
            }.to_not change { DraftStory.count }
          end
        end
      end
    end
  end
end
