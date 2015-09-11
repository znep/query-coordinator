require 'rails_helper'

describe CuratedRegion, :type => :model do

  it 'has a service name' do
    expect(CuratedRegion.service_name).to eql('curated_regions')
  end

  describe 'find' do
    before(:example) do
      @domain = YAML::load(File.open('test/fixtures/domain.yml'))
      CurrentDomain.set_domain(@domain)
      allow(CurrentDomain).to receive(:cname).and_return('socrata.dev')
    end

    it 'finds all curated regions' do
      stub = stub_request(:get, 'http://localhost:8080/curated_regions.json').
        with(:headers => { 'Accept' => '*/*', 'User-Agent' => 'Ruby', 'X-Socrata-Host' => 'socrata.dev' }).
        to_return(:status => 200, :body => '', :headers => {})

      CuratedRegion.find
      expect(stub).to have_been_made.once
    end

    it 'finds enabled curated regions' do
      stub = stub_request(:get, 'http://localhost:8080/curated_regions.json?enabledOnly=true').
        with(:headers => { 'Accept' => '*/*', 'User-Agent' => 'Ruby', 'X-Socrata-Host' => 'socrata.dev' }).
        to_return(:status => 200, :body => '', :headers => {})

      CuratedRegion.find_enabled
      expect(stub).to have_been_made.once
    end

    it 'finds default curated regions' do
      stub = stub_request(:get, 'http://localhost:8080/curated_regions.json?defaultOnly=true').
        with(:headers => { 'Accept' => '*/*', 'User-Agent' => 'Ruby', 'X-Socrata-Host' => 'socrata.dev' }).
        to_return(:status => 200, :body => '', :headers => {})

      CuratedRegion.find_default
      expect(stub).to have_been_made.once
    end

  end

  describe 'enable/disable' do
    before(:example) do
      @domain = YAML::load(File.open('test/fixtures/domain.yml'))
      CurrentDomain.set_domain(@domain)
      allow(CurrentDomain).to receive(:cname).and_return('socrata.dev')
    end

    it 'disables the curated region' do
      stub = stub_request(:put, 'http://localhost:8080/curated_regions/1.json').
        with(
          :body => {
            :enabledFlag => false
          }.to_json.to_s,
          :headers => {
            'Accept' => '*/*',
            'User-Agent' => 'Ruby',
            'X-Socrata-Host' => 'socrata.dev',
          }).
        to_return(
          :status => 200,
          :headers => {})

      curated_region = CuratedRegion.new({ 'id' => 1 })
      curated_region.disable
      expect(stub).to have_been_made.once
      expect(curated_region.enabledFlag).to eql(false)
    end

  end
end
