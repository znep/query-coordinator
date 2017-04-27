require 'rails_helper'

RSpec.describe StoryJsonBlocks, type: :model do

  let(:blocks) { [FactoryGirl.create(:block)] }
  let(:json_blocks) do
    blocks.map { |block| block.as_json.symbolize_keys }
  end
  let(:user) { mock_valid_user }
  let(:options) { {} }

  let(:subject) { StoryJsonBlocks.new(json_blocks, user, options) }

  describe '#initialize' do

    it 'raises when called without arguments' do
      expect {
        StoryJsonBlocks.new
      }.to raise_error(ArgumentError, /expected 2..3/)
    end

    it 'raises when json_blocks is not an array' do
      expect {
        StoryJsonBlocks.new('thing', user)
      }.to raise_error(ArgumentError, /json_blocks attribute is not an array/)
    end

    it 'raises when not all json_blocks are hashes' do
      expect {
        StoryJsonBlocks.new([{}, FactoryGirl.build(:block)], user)
      }.to raise_error(ArgumentError, /json_blocks contains non-hashes/)
    end

    it 'raises when user is nil' do
      expect {
        StoryJsonBlocks.new(json_blocks, nil)
      }.to raise_error(ArgumentError, /user must be present/)
    end

    it 'sets json_blocks attribute' do
      expect(subject.json_blocks).to eq(json_blocks)
    end

    context 'when copy option is true' do
      let(:options) do
        { copy: true }
      end

      it 'calls copy_attachments' do
        expect_any_instance_of(StoryJsonBlocks).to receive(:copy_attachments).and_return(blocks)
        StoryJsonBlocks.new(json_blocks, user, options)
      end
    end

  end

  describe '#copy_attachments' do
    let(:options) do
      { copy: true }
    end

    before do
      backfill_documents_in_blocks(blocks)
    end

    context 'with non-image block' do
      let(:blocks) { [FactoryGirl.build(:block)] }

      it 'leaves components intact' do
        expect(subject.blocks.first.components).to eq(blocks.first.components)
      end
    end

    shared_examples 'creating new document for image components' do |component_type|
      it 'creates a new document' do
        expect { subject }.to change { Document.count }.by(1)
      end

      it 'sets document status as "processed"' do
        image_component = subject.blocks.first.components.find do |component|
          component['type'] == component_type
        end

        expect(
          Document.find(get_document_id(image_component, component_type)
        ).status).to eq('processed')
      end

      it 'updates component' do
        expect(subject.blocks.first.components).to_not eq(blocks.first.components)
      end

      def get_document_id(component, component_type)
        if component_type == 'author'
          component['value']['image']['documentId']
        else
          component['value']['documentId']
        end
      end
    end

    context 'with image block' do
      let(:blocks) { [FactoryGirl.build(:block_with_image)] }
      it_behaves_like 'creating new document for image components', 'image'
    end

    context 'with hero block' do
      let(:blocks) { [FactoryGirl.build(:block_with_hero)] }
      it_behaves_like 'creating new document for image components', 'hero'
    end

    context 'with author block' do
      let(:blocks) { [FactoryGirl.build(:block_with_author)] }
      it_behaves_like 'creating new document for image components', 'author'
    end

    context 'with legacy getty image block' do
      let(:blocks) { [FactoryGirl.build(:block_with_only_getty_image)] }

      it 'does not create a new document' do
        expect { subject }.to_not change { Document.count }
      end

      it 'leaves components intact' do
        expect(subject.blocks.first.components).to eq(blocks.first.components)
      end
    end

    def backfill_documents_in_blocks(blocks)
      blocks.each do |block|
        block.components.each do |component|
          next unless %w( image author hero ).include?(component['type'])
          value = component['type'] == 'author' ?
            component['value']['image'] :
            component['value']

          next if value['documentId'].nil?

          document = FactoryGirl.create(:document)

          value['documentId'] = document.id
          value['url'] = document.canonical_url
        end
      end
    end
  end

  describe '#save' do
    let(:result) { subject.save }

    context 'when all blocks are valid' do
      it 'creates new blocks' do
        expect { result }.to change { Block.count }.by(json_blocks.count)
      end

      it 'returns true' do
        expect(result).to eq(true)
      end
    end

    context 'when one block is invalid' do
      let(:blocks) { [FactoryGirl.build(:block), FactoryGirl.build(:invalid_block)] }

      it 'returns false' do
        expect(result).to eq(false)
      end

      it 'only saves valid block' do
        expect { result }.to change { Block.count }.by(1)
      end
    end

  end

  describe '#save!' do
    let(:blocks) { [FactoryGirl.build(:block), FactoryGirl.build(:block_with_hero), FactoryGirl.build(:block_with_getty_image)] }
    let(:result) { subject.save! }

    it 'saves all blocks' do
      expect { result }.to change { Block.count }.by(blocks.count)
    end

    context 'with invalid blocks' do
      let(:blocks) { [FactoryGirl.build(:block), FactoryGirl.build(:invalid_block)] }

      it 'raises InvalidNewBlocksError' do
        expect { result }.to raise_error(StoryJsonBlocks::InvalidNewBlocksError)
      end

      it 'does not save any blocks' do
        expect {
          begin
            result
          rescue StoryJsonBlocks::InvalidNewBlocksError
          end
        }.to_not change { Block.count }
      end
    end
  end

  describe '#blocks' do
    let(:blocks) { [FactoryGirl.create(:block, created_by: 'rand-user'), FactoryGirl.create(:block_with_image,  created_by: 'exam-ples')] }
    let(:result) { subject.blocks }

    it 'converts all json_blocks to blocks' do
      expect(result.count).to eq(blocks.count)
    end

    it 'sets created_by' do
      all_user_ids_set = result.all? { |block| block.created_by == user['id'] }
      expect(all_user_ids_set).to be_truthy
    end

    it 'removes id' do
      expect(result.map(&:id).compact).to be_empty
    end
  end

  describe '#valid?' do
    let(:result) { subject.valid? }

    context 'when all blocks are valid' do
      let(:blocks) { [FactoryGirl.build(:block), FactoryGirl.build(:block_with_image)] }

      it 'returns true' do
        expect(result).to eq(true)
      end
    end

    context 'when one block is invalid' do
      let(:blocks) { [FactoryGirl.build(:block), FactoryGirl.build(:invalid_block)] }

      it 'returns false' do
        expect(result).to eq(false)
      end
    end

    context 'when all blocks are invalid' do
      let(:blocks) { [FactoryGirl.build(:invalid_block), FactoryGirl.build(:invalid_block)] }

      it 'returns false' do
        expect(result).to eq(false)
      end
    end
  end

  describe '#from_story' do
    let(:story) { FactoryGirl.create(:draft_story_with_blocks) }
    let(:result) { StoryJsonBlocks.from_story(story, user) }

    it 'initializes with the blocks from the story' do
      expect(result.blocks.count).to eq(story.blocks.count)
    end
  end

  describe '#blocks_to_json' do
    let(:new_blocks) { [FactoryGirl.build(:block), FactoryGirl.build(:block_with_image)] }
    let(:result) { StoryJsonBlocks.blocks_to_json(new_blocks) }

    it 'returns array of hashes' do
      expect(result).to be_a(Array)
      expect(result.all? { |block| block.is_a?(Hash)}).to be_truthy
    end

    it 'symbolizes keys' do
      expect(result.first.keys.all? { |key| key.is_a?(Symbol)}).to be_truthy
    end
  end

end
