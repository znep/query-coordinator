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
end
