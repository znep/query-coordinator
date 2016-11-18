require 'rails_helper'

describe DisplayFormat do
  include TestHelperMethods

  describe '.has_data_lens_metadata?' do
    it 'returns false when data lens metadata is missing' do
      data = {}
      expect(DisplayFormat.new(data).has_data_lens_metadata?).to be false
    end

    it 'returns false when data lens metadata is invalid' do
      data = { 'data_lens_page_metadata' => false }
      expect(DisplayFormat.new(data).has_data_lens_metadata?).to be false
    end

    it 'returns true when data lens metadata is valid' do
      data = {
        'data_lens_page_metadata' => {
          cards: []
        }
      }
      expect(DisplayFormat.new(data).has_data_lens_metadata?).to be true
    end
  end
end
