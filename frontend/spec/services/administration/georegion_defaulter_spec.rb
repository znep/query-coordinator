require 'rails_helper'

describe ::Services::Administration::GeoregionDefaulter do

  subject { ::Services::Administration::GeoregionDefaulter.new }

  let(:curated_region) { double(CuratedRegion, :id => 5) }

  before(:each) do
    allow(CurrentDomain).to receive(:cname).and_return('localhost')
  end

  describe 'setting default' do
    before(:each) do
      @request_stub = stub_request(:put, 'http://localhost:8080/curated_regions/5').
        with(:body => { :defaultFlag => true }.to_json).
        to_return(:status => 200, :body => '')
    end

    it 'responds to default' do
      expect(subject).to respond_to(:default)
    end

    it 'checks that we do not set a disabled region as default' do
      expect(subject).to receive(:check_enabled)
      allow(subject).to receive(:check_default_limit)
      subject.default(curated_region)
    end

    it 'checks that we are not at the limit' do
      allow(subject).to receive(:check_enabled)
      expect(subject).to receive(:check_default_limit)
      subject.default(curated_region)
    end

    it 'makes the request' do
      allow(subject).to receive(:check_enabled)
      allow(subject).to receive(:check_default_limit)
      expect(subject).to receive(:make_request)
      subject.default(curated_region)
    end

    it 'makes the request to core' do
      allow(subject).to receive(:check_enabled)
      allow(subject).to receive(:check_default_limit)
      subject.default(curated_region)
      expect(@request_stub).to have_been_requested
    end

    it 'raises if we are setting default at the limit' do
      allow(subject).to receive(:check_enabled)
      allow(CuratedRegion).to receive(:find_default).and_return([1, 2, 3, 4, 5])

      expect(subject).to_not receive(:make_request)
      expect { subject.default(curated_region) }.
        to raise_error(::Services::Administration::DefaultGeoregionsLimitMetError)
    end

    it 'raises if we are setting a disabled region as default' do
      allow(curated_region).to receive(:enabled?).and_return(false)

      expect(subject).to_not receive(:make_request)
      expect { subject.default(curated_region) }.
        to raise_error(::Services::Administration::IneligibleDefaultGeoregionError)
    end
  end

  describe 'unsetting default' do
    before(:each) do
      @request_stub = stub_request(:put, 'http://localhost:8080/curated_regions/5').
        with(:body => { :defaultFlag => false }.to_json).
        to_return(:status => 200, :body => '')
    end

    it 'responds to undefault' do
      expect(subject).to respond_to(:undefault)
    end

    it 'makes the request' do
      expect(subject).to receive(:make_request)
      subject.undefault(curated_region)
    end

    it 'makes the request to core' do
      subject.undefault(curated_region)
      expect(@request_stub).to have_been_requested
    end
  end

  it 'gets the path based on an id' do
    expect(subject.path(10)).to eq('/curated_regions/10')
  end
end
