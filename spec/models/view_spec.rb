require 'rails_helper'

describe View do
  include TestHelperMethods

  before(:each) do
    init_current_domain
  end

  describe 'draft display types' do
    let(:fake_views) do
      [
        {
          'id' => 'fake-fak1',
          'name' => 'Fake 1',
          'view_type' => 'tabular',
          'display_type' => 'draft'
        },
        {
          'id' => 'fake-fak2',
          'name' => 'Fake 2',
          'view_type' => 'story'
        },
        {
          'id' => 'fake-fak2',
          'name' => 'Fake 2',
          'view_type' => 'tabular',
          'display_type' => 'table'
        }
      ]
    end

    it 'Should return true when given an asset that is a draft dataset?' do
      expect(View.new(fake_views[0]).draft?)
    end

    it 'Should return false when given a page that is not a draft display type' do
      expect(!View.new(fake_views[1]).draft?)
    end

    it 'Should return false when given a tabular dataset without the draft display type' do
      expect(!View.new(fake_views[2]).draft?)
    end
  end

  describe 'pulse view types' do
    let(:fake_views) do
      [
        {
          'id' => 'fake-fak1',
          'name' => 'Fake 1',
          'displayType' => 'pulse'
        },
        {
          'id' => 'fake-fak2',
          'name' => 'Fake 2',
          'displayType' => 'story'
        }
      ]
    end

    it 'Should return true when given an asset that is a Pulse asset?' do
      expect(View.new(fake_views[0]).pulse?)
    end

    it 'Should return false when given a page that is not a Pulse display type' do
      expect(!View.new(fake_views[1]).pulse?)
    end
  end

  describe '.find_multiple_dedup' do

    let(:fake_views) do
      [
        {
          'id' => 'fake-fak1',
          'name' => 'Fake 1'
        },
        {
          'id' => 'fake-fak2',
          'name' => 'Fake 2'
        },
        {
          'id' => 'fake-fak3',
          'name' => 'Fake 3'
        }
      ]
    end

    it 'returns a hash from ids to values' do
      CurrentDomain.stubs(:cname => 'localhost')

      stub_request(:get, 'http://localhost:8080/views.json?ids%5B%5D=fake-fak1&ids%5B%5D=fake-fak2&ids%5B%5D=fake-fak3').
         with(:headers => request_headers).
         to_return(
           :status => 200,
           :headers => {},
           :body => JSON::dump(fake_views)
         )

      expect(View.find_multiple_dedup(%w(fake-fak1 fake-fak2 fake-fak1 fake-fak3 fake-fak2))).to eq({
        'fake-fak1' => View.new(fake_views[0]),
        'fake-fak2' => View.new(fake_views[1]),
        'fake-fak3' => View.new(fake_views[2])
      })
    end

    it 'puts a nil entry in the result if that id is not included in the API response' do
      stub_request(:get, 'http://localhost:8080/views.json?ids%5B%5D=fake-fak1&ids%5B%5D=fake-fak2&ids%5B%5D=fake-fak3&ids%5B%5D=fake-fak5').
         with(:headers => request_headers).
         to_return(
           :status => 200,
           :headers => {},
           :body => JSON::dump(fake_views)
         )

      expect(View.find_multiple_dedup(%w(fake-fak1 fake-fak2 fake-fak1 fake-fak3 fake-fak2 fake-fak5))).to eq({
        'fake-fak1' => View.new(fake_views[0]),
        'fake-fak2' => View.new(fake_views[1]),
        'fake-fak3' => View.new(fake_views[2]),
        'fake-fak5' => nil
      })
    end

  end

  describe '.featured_content' do
    it 'returns the parsed response from the core endpoint' do
      stub_request(:get, 'http://localhost:8080/views/1234-5679/featured_content.json').
         with(:headers => request_headers).
         to_return(
           :status => 200,
           :headers => {},
           :body => JSON::dump([1, 2, 3])
         )

      view_data = { 'id' => '1234-5679' }
      expect(View.new(view_data).featured_content).to eq([1, 2, 3])
    end
  end

  describe '.get_preview_image_url' do
    it 'returns the url for stories' do
      view = View.new({ 'id' => '1234-5678', 'previewImageId' => 'awesome-image-id' })
      expect(view).to receive(:story?).and_return(true)
      expect(Storyteller).to receive(:get_tile_image).and_return('neat-picture')

      expect(view.get_preview_image_url('cookies', 'request_id')).to eq('neat-picture')
    end

    it 'returns the url when previewImageId is present' do
      view_data = { 'id' => '1234-5678', 'previewImageId' => 'awesome-image-id' }
      expected_url = '/api/views/1234-5678/files/awesome-image-id'

      expect(View.new(view_data).get_preview_image_url('cookies', 'request_id')).to eq(expected_url)
    end

    it 'returns nil if the previewImageId is not present' do
      view_data = { 'id' => '1234-5678' }

      expect(View.new(view_data).get_preview_image_url('cookies', 'request_id')).to be_nil
    end
  end
end
