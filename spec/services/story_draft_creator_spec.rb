require 'rails_helper'

RSpec.describe StoryDraftCreator do

  let(:user) { mock_valid_user }
  let(:uid) { 'test-data' }
  let(:digest) { 'digest-for-draft' }
  let(:theme) { 'serif' }

  let(:blocks) { [ valid_new_block_1.dup ] }

  let(:story_creator) {
    StoryDraftCreator.new(
      user: user,
      uid: uid,
      digest: digest,
      theme: theme,
      blocks: blocks
    )
  }

  let(:result) { story_creator.create }

  # individual blocks
  def valid_new_block_1
    { layout: '12', components: [ { type: 'html', value: 'Hello, world!'} ] }.freeze
  end

  def valid_new_block_2
    { layout: '12', components: [ { type: 'html', value: 'Hello again, world!'} ] }.freeze
  end

  def invalid_new_block
    { invalid: true }
  end

  # block arrays
  def valid_new_blocks
    [ valid_new_block_1.dup, valid_new_block_2.dup ]
  end

  def invalid_new_blocks
    [ invalid_new_block.dup ]
  end

  context 'when instantiated with a non-array value for attributes[:blocks]' do
    let(:blocks) { 'this is not an array' }

    it 'raises an exception' do
      expect {
        StoryDraftCreator.new(
          user: user,
          uid: uid,
          digest: digest,
          theme: theme,
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
          theme: theme,
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
          theme: theme,
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
          theme: theme,
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
          theme: theme,
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
          theme: theme,
          blocks: blocks
        )
      }.to raise_error(ArgumentError)
    end
  end

  context 'when initialized with no theme' do
    let (:theme) { nil }

    it 'raises an exception' do
      expect {
        StoryDraftCreator.new(
          user: user,
          uid: uid,
          digest: digest,
          theme: theme,
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
          theme: theme,
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
          theme: theme,
          blocks: blocks
        )
      end

      context 'with an empty block list' do
        let(:blocks) { [] }

        it 'returns a DraftStory object' do
          expect(result).to be_a(DraftStory)
        end

        it 'creates no new blocks' do
          expect(result.block_ids).to be_empty
        end

        it 'creates a new draft story' do
          expect(DraftStory.find(result.id)).to be_a(DraftStory)
        end
      end

      # This test and related product behavior exist because
      # Rails will parse the JSON '{ "foo": [] }' to { "foo": nil }.
      context 'with a nil block list' do
        let(:blocks) { nil }

        it 'returns a DraftStory object' do
          expect(result).to be_a(DraftStory)
        end

        it 'creates no new blocks' do
          expect(result.block_ids).to be_empty
        end

        it 'creates a new draft story' do
          expect(DraftStory.find(result.id)).to be_a(DraftStory)
        end
      end


      context 'with a non-empty blocks list' do

        let(:blocks) { valid_new_blocks }

        it 'returns a DraftStory object' do
          expect(result).to be_a(DraftStory)
        end

        it 'creates new blocks' do
          expect(Block.find(result.block_ids.first)).to be_a(Block)
          expect(Block.find(result.block_ids.second)).to be_a(Block)
        end

        it 'creates a new draft story' do
          expect(DraftStory.find(result.id)).to be_a(DraftStory)
        end
      end
    end

    context 'when called on an instance created with an invalid four by four' do

      let(:uid) { 'invalid' }

      context 'with no blocks' do

        let(:blocks) { [] }

        it 'raises an exception' do
          expect {
            StoryDraftCreator.new(
              user: user,
              uid: uid,
              digest: digest,
              theme: theme,
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
                theme: theme,
                blocks: blocks
              )
            rescue => error
            end
          }.to_not change { DraftStory.count }
        end
      end

      context 'with blocks' do

        let(:blocks) { valid_new_blocks }

        it 'raises an exception' do
          expect {
            StoryDraftCreator.new(
              user: user,
              uid: uid,
              digest: digest,
              theme: theme,
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
                theme: theme,
                blocks: blocks
              )
            rescue => error
            end
          }.to_not change { DraftStory.count }
        end
      end
    end

    context 'when called on an instance created with invalid blocks' do

      context 'with no blocks' do

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

      context 'with a block that is not a hash' do

        let(:blocks) { [1] }

        it 'raises an exception' do
          expect {
            StoryDraftCreator.new(
              user: user,
              uid: uid,
              digest: digest,
              theme: theme,
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
                theme: theme,
                blocks: blocks
              )
            rescue => error
            end
          }.to_not change { DraftStory.count }
        end
      end
    end
  end
end
