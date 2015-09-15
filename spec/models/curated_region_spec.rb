require 'rails_helper'

describe CuratedRegion, :type => :model do
  let(:cname) { 'socrata.dev' }
  before(:each) do
    domain = YAML::load(File.open('test/fixtures/domain.yml'))
    CurrentDomain.set_domain(domain)
    allow(CurrentDomain).to receive(:cname).and_return(cname)
  end

  it 'has a service name' do
    expect(CuratedRegion.service_name).to eql('curated_regions')
  end

  describe 'find' do
    it 'finds curated regions (enabledOnly=true by default)' do
      stubbed_request = stub_request(:get, 'http://localhost:8080/curated_regions.json').
        with(:headers => { 'X-Socrata-Host' => cname }).
        to_return(:status => 200, :body => '', :headers => {})

      CuratedRegion.find
      expect(stubbed_request).to have_been_made.once
    end

    it 'finds enabled curated regions' do
      stubbed_request = stub_request(:get, 'http://localhost:8080/curated_regions.json?enabledOnly=true').
        with(:headers => { 'X-Socrata-Host' => cname }).
        to_return(:status => 200, :body => '', :headers => {})

      CuratedRegion.find_enabled
      expect(stubbed_request).to have_been_made.once
    end

    it 'finds default curated regions' do
      stubbed_request = stub_request(:get, 'http://localhost:8080/curated_regions.json?defaultOnly=true').
        with(:headers => { 'X-Socrata-Host' => cname }).
        to_return(:status => 200, :body => '', :headers => {})

      CuratedRegion.find_default
      expect(stubbed_request).to have_been_made.once
    end

  end

  describe 'find_all' do
    it 'finds all curated regions' do
      stubbed_request = stub_request(:get, 'http://localhost:8080/curated_regions.json?defaultOnly=false&enabledOnly=false').
        with(:headers => {'X-Socrata-Host'=>'socrata.dev'}).
        to_return(:status => 200, :body => '', :headers => {})
      CuratedRegion.find_all
      expect(stubbed_request).to have_been_made.once
    end
  end

  describe 'get_all' do
    it 'returns a hash of data' do
      region_1 = build(:curated_region)
      region_2 = build(:curated_region, :enabled)
      region_3 = build(:curated_region, :default)
      expect(CuratedRegion).to receive(:find_all).and_return([
            region_1,
            region_2,
            region_3
          ])
      georegions = CuratedRegion.get_all
      expect(georegions).to match({
            :counts => { :available => 3, :enabled => 1 },
            :custom => a_collection_containing_exactly(region_1, region_2),
            :default => a_collection_containing_exactly(region_3)
          })
    end
  end

  describe 'enable/disable' do

    it 'disables the curated region' do
      stubbed_request = stub_request(:put, 'http://localhost:8080/curated_regions/1.json').
        with(
          :body => {
            :enabledFlag => false
          },
          :headers => {
            'Content-Type' => 'application/json',
            'X-Socrata-Host' => cname,
          }).
        to_return(
          :body => {
            :id => 1,
            :name => 'USA States',
            :defaultFlag => false,
            :enabledFlag => false
          }.to_json.to_s,
          :headers => {
            'Content-Type' => 'application/json'
          },
          :status => 200
        )

      curated_region = CuratedRegion.new(
        'id' => 1,
        'name' => 'USA States',
        'defaultFlag' => false,
        'enabledFlag' => true
      )
      curated_region.disable!
      expect(stubbed_request).to have_been_made.once
      expect(curated_region.enabledFlag).to eql(false)
      expect(curated_region.enabled?).to eql(false)
    end

  end
end
