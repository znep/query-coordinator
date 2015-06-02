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
        subject.block_ids = [ FactoryGirl.create(:block).id ]
      end

      it 'returns an empty relation' do
        expect(subject.blocks).to eq([ Block.find(subject.block_ids.first) ])
      end
    end
  end
end
