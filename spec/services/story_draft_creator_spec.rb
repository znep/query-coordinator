require 'rails_helper'

RSpec.describe StoryDraftCreator do

  let(:user) { mock_valid_user }
  let(:uid) { 'test-data' }
  let(:digest) { 'digest-for-draft' }

  let(:blocks) { [ valid_new_block.dup ] }

  let(:story_creator) {
    StoryDraftCreator.new(
      user: user,
      uid: uid,
      digest: digest,
      blocks: blocks
    )
  }

  let(:result) { story_creator.create }

  # block id
  def existing_block_id
    @existing_block_id ||= FactoryGirl.create(:block).id.to_s
  end

  # individual blocks
  def valid_new_block
    { id: 'temp1234', layout: '12', components: [ { type: 'text', value: 'Hello, world!'} ] }.freeze
  end

  def valid_existing_block
    { id: existing_block_id.to_s }.freeze
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

  context 'when instantiated with a non-array value for attributes[:blocks]' do
    let(:blocks) { 'this is not an array' }

    it 'raises an exception' do
      expect {
        StoryDraftCreator.new(
          user: user,
          uid: uid,
          digest: digest,
          blocks: blocks
        )
      }.to raise_error(ArgumentError)
    end
  end

  context 'when initialized without a user' do
    let(:user) { nil }

    it 'raises an exception' do
      expect {
        StoryDraftCreator.new(
          user: user,
          uid: uid,
          digest: digest,
          blocks: blocks
        )
      }.to raise_error(ArgumentError)
    end
  end

  context 'when initialized with an invalid user' do
    it 'raises an exception' do
      expect {
        StoryDraftCreator.new(
          user: mock_valid_user.tap{|user| user['id'] = 'not' },
          uid: uid,
          digest: digest,
          blocks: blocks
        )
      }.to raise_error(ArgumentError)
    end
  end

  context 'when initialized without a digest' do
    let(:digest) { nil }

    it 'raises an exception' do
      expect {
        StoryDraftCreator.new(
          user: user,
          uid: uid,
          digest: digest,
          blocks: blocks
        )
      }.to raise_error(ArgumentError)
    end
  end

  context 'when initialized with a blank digest' do
    let(:digest) { '' }

    it 'raises an exception' do
      expect {
        StoryDraftCreator.new(
          user: user,
          uid: uid,
          digest: digest,
          blocks: blocks
        )
      }.to raise_error(ArgumentError)
    end
  end

  context 'when initialized with no uid' do
    let(:uid) { nil }

    it 'raises an exception' do
      expect {
        StoryDraftCreator.new(
          user: user,
          uid: uid,
          digest: digest,
          blocks: blocks
        )
      }.to raise_error(ArgumentError)
    end
  end

  describe '#create' do

    context 'when called with a digest that does not match last known digest' do
      let!(:previous_digest) { FactoryGirl.create(:draft_story, uid: uid).digest }

      let(:story_creator) do
        StoryDraftCreator.new(
          user: user,
          uid: uid,
          digest: previous_digest + 'NOPE',
          blocks: blocks
        )
      end

      it 'raises exception' do
        expect{ story_creator.create }.to raise_error(StoryDraftCreator::DigestMismatchError)
      end

      it 'does not create a draft' do
        expect {
          begin
            story_creator.create
          rescue
          end
        }.to_not change { DraftStory.count }
      end
    end

    context 'when called on an instance created with valid attributes' do
      let(:story_creator) do
        StoryDraftCreator.new(
          user: user,
          uid: uid,
          digest: digest,
          blocks: blocks
        )
      end

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

        it 'updates block_id_mappings' do
          new_story = story_creator.create
          expect(story_creator.block_id_mappings).to eq(
            [{:oldId => "temp1234", :newId => Block.find(story_creator.story.block_ids.first).id}]
          )
        end
      end

      context 'with existing blocks' do
        let(:blocks) { valid_some_existing_blocks }

        let(:previous_draft) do
          FactoryGirl.create(
            :draft_story,
            uid: uid,
            block_ids: [ existing_block_id ],
            created_by: user['id']
          )
        end

        let(:digest) { previous_draft.digest }

        it 'returns a DraftStory object' do
          expect(result).to be_a(DraftStory)
        end

        it 'creates new blocks' do
          expect(Block.find(result.block_ids.first)).to be_a(Block)
        end

        it 'creates a new draft story' do
          expect(DraftStory.find(result.id)).to be_a(DraftStory)
        end

        it 'updates block_id_mappings' do
          new_story = story_creator.create
          expect(story_creator.block_id_mappings).to eq(
            [
              {:oldId => "temp1234", :newId => Block.find(story_creator.story.block_ids.first).id},
              {:oldId => existing_block_id, :newId => existing_block_id}
            ]
          )
        end
      end
    end

    context 'when called on an instance created with an invalid four by four' do

      let(:uid) { 'invalid' }

      context 'with no existing blocks' do

        let(:blocks) { [] }

        it 'raises an exception' do
          expect {
            StoryDraftCreator.new(
              user: user,
              uid: uid,
              digest: digest,
              blocks: blocks
            )
          }.to raise_error(ArgumentError)
        end

        it 'does not create a DraftStory object' do
          expect {
            begin
              StoryDraftCreator.new(
                user: user,
                uid: uid,
                digest: digest,
                blocks: blocks
              )
            rescue => error
            end
          }.to_not change { DraftStory.count }
        end
      end

      context 'with existing blocks' do

        let(:blocks) { valid_some_existing_blocks }

        it 'raises an exception' do
          expect {
            StoryDraftCreator.new(
              user: user,
              uid: uid,
              digest: digest,
              blocks: blocks
            )
          }.to raise_error(ArgumentError)
        end

        it 'does not create a DraftStory object' do
          expect {
            begin
              StoryDraftCreator.new(
                user: user,
                uid: uid,
                digest: digest,
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

        it 'raises an exception' do
          expect {
            StoryDraftCreator.new(
              user: user,
              uid: uid,
              digest: digest,
              blocks: blocks
            )
          }.to raise_error(ArgumentError)
        end

        it 'does not create a DraftStory object' do
          expect {
            begin
              StoryDraftCreator.new(
                user: user,
                uid: uid,
                digest: digest,
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

        context 'with an existing block with an id > the largest block id' do
          let(:new_block) { FactoryGirl.create(:block) }

          let(:previous_draft) do
            FactoryGirl.create(
              :draft_story,
              uid: uid,
              block_ids: [ new_block.id ],
              created_by: user['id']
            )
          end

          let(:digest) { previous_draft.digest }

          let(:blocks) { [ { id: (new_block.id + 1) } ] }

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
