require 'rails_helper'

describe ::Services::Administration::GeoregionEnabler do

  subject { ::Services::Administration::GeoregionEnabler.new }

  let(:curated_region_view) { double(View, :createdAt => 1456530636244) }
  let(:curated_region) { double(CuratedRegion, :id => 5) }

  before(:each) do
    allow(CurrentDomain).to receive(:cname).and_return('localhost')
    allow_any_instance_of(CuratedRegion).to receive(:view).and_return(curated_region_view)
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

    it 'makes the request' do
      expect(subject).to receive(:make_request)
      subject.enable(curated_region)
    end

    it 'makes the request to core' do
      subject.enable(curated_region)
      expect(@request_stub).to have_been_requested
    end
  end

  describe 'disabling' do
    before(:each) do
      @request_stub = stub_request(:put, 'http://localhost:8080/curated_regions/5').
        with(:body => { :enabledFlag => false, :defaultFlag => false }.to_json).
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
