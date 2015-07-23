require 'rails_helper'

RSpec.describe InspirationBlockList, type: :model do
  let(:inspiration_block_list) { InspirationBlockList.new() }

  describe '#to_json' do
    let(:to_json) { inspiration_block_list.to_json }

    it 'returns parsable json' do
      expect do
        JSON.parse(to_json)
      end.to_not raise_error
    end

    it 'returns json containing the key "blocks"' do
      expect(JSON.parse(to_json)).to have_key('blocks')
    end

  end

  describe '#blocks' do
    it 'returns an array with the "blockContent" key' do
      expect(inspiration_block_list.blocks[0]).to have_key('blockContent')
    end

  end

end
