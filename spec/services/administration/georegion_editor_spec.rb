require 'rails_helper'

describe ::Services::Administration::GeoregionEditor do

  subject { ::Services::Administration::GeoregionEditor.new }
  let(:curated_region) { double(CuratedRegion, :id => 5, :name => 'My Region') }

  before(:each) do
    allow(CurrentDomain).to receive(:cname).and_return('bad.horse')
  end

  it 'provides the appropriate API path' do
    expect(subject.send(:path, 1)).to eq('/curated_regions/1')
  end

  describe '#sanitize_fields' do
    it 'removes extraneous fields' do
       actual = subject.send(:sanitize_fields, curated_region, { 'invalid' => 'not allowed', 'name' => 'allowed' })
       expect(actual).to eq({'name' => 'allowed'})
    end

    it 'removes fields that have not changed' do
      actual = subject.send(:sanitize_fields, curated_region, { 'name' => 'My Region' })
      expect(actual).to eq({})
    end

    it 'strips spaces from strings' do
      actual = subject.send(:sanitize_fields, curated_region, { 'name' => '  changed  ' })
      expect(actual).to eq({ 'name' => 'changed' })
    end
  end

  describe '#validate_fields' do
    it 'does not raise if name is present' do
      expect { subject.send(:validate_fields, { 'name' => 'valid' }) }.
        not_to raise_error
    end

    it 'raises if name is empty' do
      expect { subject.send(:validate_fields, { 'name' => '' }) }.
        to raise_error(::Services::Administration::MissingBoundaryNameError)
    end
  end

  describe '#make_request' do
    it 'makes the correct core server request' do
      request_stub = stub_request(:put, 'http://localhost:8080/curated_regions/5').
        with(:body => { :name => 'New Name' }.to_json)
      subject.send(:make_request, curated_region, { 'name' => 'New Name' })
      expect(request_stub).to have_been_requested
    end
  end

  describe '#edit' do
    before(:each) do
      stub_request(:put, 'http://localhost:8080/curated_regions/5').
        to_return(
          :body => {
            :id => 5,
            :name => 'New Name'
          }.to_json,
          :headers => {
            :content_type => 'application/json'
          })
    end

    it 'sanitizes fields' do
      expect(subject).to receive(:sanitize_fields).and_call_original
      subject.edit(curated_region, { 'name' => 'New Name' })
    end

    it 'validates fields' do
      expect(subject).to receive(:validate_fields).and_call_original
      subject.edit(curated_region, { 'name' => 'New Name' })
    end

    it 'makes a request' do
      expect(subject).to receive(:make_request).and_return(curated_region.to_json)
      subject.edit(curated_region, { 'name' => 'New Name' })
    end

    it 'returns a curated region' do
      actual = subject.edit(curated_region, { 'name' => 'New Name' })
      expect(actual).to be_an_instance_of(CuratedRegion)
    end
  end
end
