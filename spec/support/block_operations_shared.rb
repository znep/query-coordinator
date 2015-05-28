require 'rails_helper'

shared_examples 'has_block_operations' do

  describe '#blocks' do

    context 'no blocks' do

      before do
        subject.blocks = []
      end

      it 'returns an empty relation' do
        expect(subject.blocks).to be_a ActiveRecord::Relation
        expect(subject.blocks).to be_empty
      end
    end

    context 'blocks' do
      it 'returns a relation of blocks if the story has blocks' do

      end
    end
  end

  describe '#blocks=' do

  end
end
