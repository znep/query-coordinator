require 'rails_helper'

describe View do

  describe 'pulse view types' do
    let(:fake_views) do
      [
        {
          'id' => 'fake-fak1',
          'name' => 'Fake 1',
          'view_type' => 'pulse'
        },
        {
          'id' => 'fake-fak2',
          'name' => 'Fake 2',
          'view_type' => 'story'
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
      stub_request(:get, 'http://localhost:8080/views.json?ids%5B%5D=fake-fak1&ids%5B%5D=fake-fak2&ids%5B%5D=fake-fak3').
         with(:headers => {'Accept'=>'*/*', 'Accept-Encoding'=>'gzip;q=1.0,deflate;q=0.6,identity;q=0.3',
                          'User-Agent'=>'Ruby', 'X-Socrata-Federation'=>'Honey Badger',
                          'X-Socrata-Host'=>'localhost'}).
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
         with(:headers => {'Accept'=>'*/*', 'Accept-Encoding'=>'gzip;q=1.0,deflate;q=0.6,identity;q=0.3',
                          'User-Agent'=>'Ruby', 'X-Socrata-Federation'=>'Honey Badger',
                          'X-Socrata-Host'=>'localhost'}).
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

end
