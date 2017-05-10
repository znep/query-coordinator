require 'rails_helper'

describe Storyteller do
  include TestHelperMethods

  let(:tile_response) do
    {
      'title' => 'Sparkly Penguins in Spats',
      'description' => 'Waltzing in Space',
      'image' => 'https://elephants.com',
      'theme' => 'classic',
      'url' => 'https://wombats.com'
    }
  end

  let(:tile_response_json) { tile_response.to_json }

  before(:each) do
    allow(CurrentDomain).to receive(:cname).and_return('localhost')
  end

  describe 'get_tile' do
    it 'should return the parsed response for successful requests' do
      stub_request(:get, 'https://localhost/stories/s/abcd-1234/tile.json').
        to_return(status: 200, body: tile_response_json)

      expect(Storyteller.get_tile('abcd-1234', 'cookies', 'request_id')).to eq(tile_response)
    end

    it 'should return an empty hash for unsuccessful requests' do
      stub_request(:get, 'https://localhost/stories/s/abcd-1234/tile.json').
        to_return(status: 404)

      expect(Storyteller.get_tile('abcd-1234', 'cookies', 'request_id')).to eq({})
    end
  end

  describe 'get_tile_image' do
    it 'should return the image url if it is present' do
      expect(Storyteller).to receive(:get_tile).and_return(tile_response)
      expect(Storyteller.get_tile_image('abcd-1234', 'cookies', 'request_id')).
        to eq(tile_response['image'])
    end

    it 'should return nil if no url is present' do
      tile_response['image'] = nil
      expect(Storyteller).to receive(:get_tile).and_return(tile_response)
      expect(Storyteller.get_tile_image('abcd-1234', 'cookies', 'request_id')).to be_nil
    end
  end
end
