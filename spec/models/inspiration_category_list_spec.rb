require 'rails_helper'

RSpec.describe InspirationCategoryList, type: :model do
  let(:inspiration_category_list) { InspirationCategoryList.new() }

  describe '#to_json' do
    let(:to_json) { inspiration_category_list.to_json }

    it 'returns parsable json' do
      expect do
        JSON.parse(to_json)
      end.to_not raise_error
    end

    it 'returns json containing the categorized keys' do
      expect(JSON.parse(to_json)).to have_key('text')
      expect(JSON.parse(to_json)).to have_key('media_and_text')
      expect(JSON.parse(to_json)).to have_key('dividers_and_spacers')
    end

  end

  describe '#blocks' do
    it 'returns an array with the "blockContent" key' do
      expect(inspiration_category_list.blocks[0]).to have_key('blockContent')
    end

  end

end
