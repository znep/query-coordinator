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

    context 'when multiple blocks contain images' do
      before do
        @block = FactoryGirl.create(:block_with_image)
        @block2 = FactoryGirl.create(
          :block_with_image,
          components: [ { type: 'image', value: { url: 'http://example.com/image2.jpg' } } ]
        )
        subject.block_ids = [@block2.id, @block.id]
      end

      it 'returns the first one in block order' do
        expect(subject.block_images).to eq(
          ['http://example.com/image2.jpg', 'http://example.com/image.jpg']
        )
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

    context 'with hero blocks' do
      before do
        @hero_block = FactoryGirl.create(:block_with_hero)
        subject.block_ids = [@hero_block.id]
      end

      it 'returns the first hero block' do
        expect(subject.block_images).to eq(['http://example.com/hero-image.jpg'])
      end
    end

    context 'with a mix of blocks' do
      before do
        @hero_block = FactoryGirl.create(:block_with_hero)
        @image_block = FactoryGirl.create(:block_with_image)
        @html_block = FactoryGirl.create(:block)
        subject.block_ids = [@html_block.id, @image_block.id, @hero_block.id]
      end

      it 'returns the first hero block' do
        expect(subject.block_images).to eq(['http://example.com/image.jpg', 'http://example.com/hero-image.jpg'])
      end
    end

  end

  describe '#has_image_component?' do
    context 'with blocks that contain images' do
      before do
        subject.block_ids = [
          FactoryGirl.create(:block).id,
          FactoryGirl.create(:block_with_image).id
        ]
      end

      it 'returns true' do
        expect(subject.has_image_component?).to eq(true)
      end
    end

    context 'with blocks that contain hero images' do
      before do
        subject.block_ids = [
          FactoryGirl.create(:block).id,
          FactoryGirl.create(:block_with_hero).id
        ]
      end

      it 'returns true' do
        expect(subject.has_image_component?).to eq(true)
      end
    end

    context 'with blocks that contain author images' do
      before do
        subject.block_ids = [
          FactoryGirl.create(:block).id,
          FactoryGirl.create(:block_with_author).id
        ]
      end

      it 'returns true' do
        expect(subject.has_image_component?).to eq(true)
      end
    end

    context 'without blocks that contain images' do
      before do
        subject.block_ids = [
          FactoryGirl.create(:block),
          FactoryGirl.create(:block)
        ]
      end

      it 'returns false' do
        expect(subject.has_image_component?).to eq(false)
      end
    end
  end
end
