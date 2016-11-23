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
          :cards => []
        }
      }
      expect(DisplayFormat.new(data).has_data_lens_metadata?).to be true
    end
  end

  describe 'visualization_canvas_metadata' do
    it 'returns visualizationCanvasMetadata' do
      mock_vifs = ['orange', 'pink']
      data = {
        'visualizationCanvasMetadata' => {
          :vifs => mock_vifs
        }
      }
      metadata = DisplayFormat.new(data).visualization_canvas_metadata

      expect(metadata[:vifs]).to eq(mock_vifs)
    end

    it 'returns default metadata if none defined' do
      metadata = DisplayFormat.new.visualization_canvas_metadata

      expect(metadata[:vifs]).to eq([])
      expect(metadata[:version]).to eq(1)
    end
  end
end
