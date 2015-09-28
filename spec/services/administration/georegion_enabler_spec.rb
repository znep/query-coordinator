require 'rails_helper'

describe ::Services::Administration::GeoregionEnabler do

  subject { ::Services::Administration::GeoregionEnabler.new }
  let(:curated_region) { double(CuratedRegion, :id => 5) }
  before(:each) do
    allow(CurrentDomain).to receive(:cname).and_return('localhost')
  end

  describe 'enabling' do
    before(:each) do
      @request_stub = stub_request(:put, 'http://localhost:8080/curated_regions/5').
        with(:body => { :enabledFlag => true }.to_json).
        to_return(:status => 200, :body => '')
    end

    it 'responds to enable' do
      expect(subject).to respond_to(:enable)
    end

    it 'checks that we are not at the limit' do
      expect(subject).to receive(:check_enabled_limit)
      subject.enable(curated_region)
    end

    it 'makes the request' do
      allow(subject).to receive(:check_enabled_limit)
      expect(subject).to receive(:make_request)
      subject.enable(curated_region)
    end

    it 'makes the request to core' do
      allow(subject).to receive(:check_enabled_limit)
      subject.enable(curated_region)
      expect(@request_stub).to have_been_requested
    end

    it 'raises if we are enabling at the limit' do
      stub_request(:get, 'http://localhost:8080/curated_regions.json?enabledOnly=true').
        to_return(:status => 200, :body => [
            build(:curated_region, :enabled),
            build(:curated_region, :enabled),
            build(:curated_region, :enabled),
            build(:curated_region, :enabled),
            build(:curated_region, :enabled)
          ].to_json, :headers => {})

      expect(subject).to_not receive(:make_request)
      expect { subject.enable(curated_region) }.
        to raise_error(::Services::Administration::EnabledGeoregionsLimitMetError)
    end
  end

  describe 'disabling' do
    before(:each) do
      @request_stub = stub_request(:put, 'http://localhost:8080/curated_regions/5').
        with(:body => { :enabledFlag => false }.to_json).
        to_return(:status => 200, :body => '')
    end

    it 'responds to disable' do
      expect(subject).to respond_to(:disable)
    end

    it 'makes the request' do
      expect(subject).to receive(:make_request)
      subject.disable(curated_region)
    end

    it 'makes the request to core' do
      subject.disable(curated_region)
      expect(@request_stub).to have_been_requested
    end

  end

  it 'gets the path based on an id' do
    expect(subject.path(10)).to eq('/curated_regions/10')
  end
end
