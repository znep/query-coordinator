require 'rails_helper'

RSpec.describe Block, type: :model do

  let(:subject) { FactoryGirl.build(:block) }

  describe 'immutability' do

    context 'when it has not been saved' do

      it 'can be saved once' do
        expect(subject.save).to eq(true)
      end

      it 'cannot be saved twice' do
        expect(subject.save).to eq(true)
        expect {
          subject.save
        }.to raise_error(ActiveRecord::ReadOnlyRecord)
      end
    end
  end

  describe 'validations' do

    it 'has a valid factory' do
      valid_block = FactoryGirl.build(:block)
      expect(valid_block).to be_valid
    end

    it 'does not allow a null value for :layout' do
      invalid_block = FactoryGirl.build(:block, layout: nil)
      expect(invalid_block).to_not be_valid
      expect(invalid_block.errors[:layout].length).to eq(2)
    end

    Block::VALID_BLOCK_LAYOUTS.each do |layout_name|
      it "allows '#{layout_name}' as valid for :layout" do
        valid_block = FactoryGirl.build(:block, layout: layout_name)
        expect(valid_block).to be_valid
      end
    end

    it 'does not allow an invalid value for :layout' do
      invalid_block = FactoryGirl.build(:block, layout: '0')
      expect(invalid_block).to_not be_valid
      expect(invalid_block.errors[:layout].length).to eq(1)
    end

    it 'does not allow a null value for :components' do
      invalid_block = FactoryGirl.build(:block, components: nil)
      expect(invalid_block).to_not be_valid
      expect(invalid_block.errors[:components].length).to eq(1)
    end

    it 'does not allow a null value for :created_by' do
      invalid_block = FactoryGirl.build(:block, created_by: nil)
      expect(invalid_block).to_not be_valid
      expect(invalid_block.errors[:created_by].length).to eq(1)
    end
  end

  describe '#for_story' do
    let(:story) { FactoryGirl.create(:draft_story) }
    let(:result) { Block.for_story(story) }

    it 'returns ActiveRecord::Relation' do
      expect(result).to be_a(ActiveRecord::Relation)
    end

    context 'when story has no blocks' do
      let(:story) { FactoryGirl.create(:draft_story) }

      it 'has returns 0 items' do
        expect(result.size).to eq(0)
      end
    end

    context 'when story has blocks' do
      let(:story) { FactoryGirl.create(:draft_story_with_blocks) }

      it 'has returns number of blocks in story' do
        expect(result.size).to eq(story.block_ids.size)
      end

      it 'returns blocks for the block_ids in the story' do
        block_ids = story.block_ids.sort
        expect(result.map(&:id).sort).to eq(block_ids)
      end
    end
  end

  describe '#for_story_in_order' do
    let(:story) { FactoryGirl.create(:draft_story_with_blocks) }
    let(:result) { Block.for_story_in_order(story) }

    context 'when story has no blocks' do
      let(:story) { FactoryGirl.create(:draft_story) }

      it 'has returns 0 items' do
        expect(result.size).to eq(0)
      end
    end

    context 'when story has blocks' do
      let(:story) { FactoryGirl.create(:draft_story_with_blocks) }

      it 'returns blocks matching order or block_ids in story' do
        block_ids = story.block_ids
        expect(result.map(&:id)).to eq(block_ids)
      end
    end
  end

  describe '#with_component_type' do
    let(:component_type) { 'blah' }
    let!(:block) { FactoryGirl.create(:block) }
    let!(:block_with_image) { FactoryGirl.create(:block_with_image) }
    let(:result) { Block.with_component_type(component_type) }

    it 'returns ActiveRecord::Relation' do
      expect(result).to be_a(ActiveRecord::Relation)
    end

    context 'for component_type not in any block' do
      let(:component_type) { 'thisisafunkycomponenttype' }

      it 'returns empty results' do
        expect(result.size).to eq(0)
      end
    end

    context 'for component_type in blocks' do
      let(:component_type) { 'image' }

      it 'returns blocks containing image' do
        expect(result.size).to eq(1)
        expect(result.first).to eq(block_with_image)
      end
    end
  end

  describe '#in_story_order' do
    let(:story) { FactoryGirl.create(:draft_story_with_blocks) }
    let(:blocks) { Block.for_story(story) }
    let(:result) { Block.in_story_order(blocks, story) }

    it 'returns blocks in order' do
      expect(result.map(&:id)).to eq(story.block_ids)
    end

    context 'when block order is not necessarily the same' do
      let(:reverse_story) { FactoryGirl.create(:draft_story, block_ids: story.block_ids.reverse) }
      let(:blocks) { Block.for_story(reverse_story) }
      let(:result) { Block.in_story_order(blocks, reverse_story) }

      it 'returns blocks in order' do
        expect(result.map(&:id)).to eq(reverse_story.block_ids)
      end
    end
  end

  # TODO tests for as_json and from_json
end
