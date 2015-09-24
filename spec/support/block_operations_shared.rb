require 'rails_helper'

shared_examples 'has_block_operations' do

  describe '#blocks' do

    context 'with no blocks' do

      before do
        subject.block_ids = []
      end

      it 'returns an empty relation' do
        expect(subject.blocks).to be_empty
      end
    end

    context 'with blocks' do

      before do
        @block_1 = FactoryGirl.create(:block);
        @block_2 = FactoryGirl.create(:block);
        @block_3 = FactoryGirl.create(:block);
        subject.block_ids = [ @block_3.id, @block_1.id, @block_2.id ]
      end

      it 'returns a non-empty relation with the correct ordering' do
        expect(subject.blocks).to eq([ @block_3, @block_1, @block_2 ])
      end
    end
  end


  describe '#blocks_with_component_type' do

    context 'with blocks' do
      before do
        @block_1 = FactoryGirl.create(:block);
        @block_2 = FactoryGirl.create(:block);
        @block_3 = FactoryGirl.create(:block);
        @block_4 = FactoryGirl.create(:block_with_image);
        subject.block_ids = [ @block_3.id, @block_1.id, @block_2.id, @block_4.id ]
      end

      it 'returns all blocks containing html components' do
        expect(subject.blocks_with_component_type('html')).to eq([ @block_3, @block_1, @block_2 ])
      end

      it 'returns all blocks containing image components' do
        expect(subject.blocks_with_component_type('image')).to eq([ @block_4 ])
      end

      it 'returns no components when there are no blocks with the queried component' do
        expect(subject.blocks_with_component_type('spacer')).to be_empty
      end
    end

    context 'without blocks' do
      before do
        subject.block_ids = []
      end

      it 'returns no components when there are no blocks with the queried component' do
        expect(subject.blocks_with_component_type('spacer')).to be_empty
        expect(subject.blocks_with_component_type('html')).to be_empty
        expect(subject.blocks_with_component_type('image')).to be_empty
      end
    end
  end

  describe '#block_images' do
    context 'with blocks that contain images' do
      before do
        @block = FactoryGirl.create(:block_with_image)
        subject.block_ids = [@block.id]
      end
      it 'returns all image URLs found in any block of a story' do
        expect(subject.block_images).to eq(['http://example.com/image.jpg'])
      end
    end

    context 'with blocks that do not contain images' do
      before do
        @block = FactoryGirl.create(:block)
        subject.block_ids = [@block.id]
      end

      it 'returns an empty array when there are no image URLs found' do
        expect(subject.block_images).to be_empty
      end
    end
  end
end
