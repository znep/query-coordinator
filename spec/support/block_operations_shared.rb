require 'rails_helper'

shared_examples 'has_block_operations' do

  describe '#retrieve_blocks' do

    context 'with no blocks' do

      before do
        subject.blocks = []
      end

      it 'returns an empty relation' do
        expect(subject.retrieve_blocks).to be_empty
      end
    end

    context 'with blocks' do

      before do
        @block = FactoryGirl.create(:block)
        subject.blocks = [ @block.id ]
      end

      it 'returns an empty relation' do
        expect(subject.retrieve_blocks).to eq([ Block.find(@block.id) ])
      end
    end
  end
end
