require 'rails_helper'

describe ::Services::Administration::GeoregionAdder do
  include TestHelperMethods

  let(:view_id) { 'test-data' }
  let(:feature_pk) { '_feature_id' }
  let(:geometry_label) { 'name' }
  let(:name) { 'US States' }
  let(:subject) { ::Services::Administration::GeoregionAdder.new }
  let(:fixture_data) do
    file = File.open('test/fixtures/sample-data.json')
    JSON::parse(file.read)
  end

  it 'builds the coreserver api path' do
    expect(subject.path).to eq('/curated_regions')
  end

  describe '#add' do
    before(:each) do
      allow(CurrentDomain).to receive(:cname).and_return('localhost')
      stub_request(:get, 'http://localhost:8080/views/test-data.json').
        to_return(:status => 200, :body => fixture_data['get_request'].to_json, :headers => {'ContentType' => 'application/json'})
    end

    it 'fetches the view' do
      expect(View).to receive(:find).with('test-data').and_call_original
      allow(subject).to receive(:make_request).and_return({})
      subject.add(view_id, feature_pk)
    end

    it 'validates the view' do
      expect(subject).to receive(:validate_view).and_return(true)
      allow(subject).to receive(:make_request).and_return({})
      subject.add(view_id, feature_pk)
    end

    it 'returns early if validation fails' do
      allow(subject).to receive(:validate_view).and_return(false)
      expect(subject.add(view_id, feature_pk)).to eq(nil)
    end

    it 'returns the curated region if successful' do
      stub_request(:post, 'http://localhost:8080/curated_regions').
        to_return(:status => 200, :body => {}.to_json, :headers => { 'ContentType' => 'application/json' })
      actual = subject.add(view_id, feature_pk, geometry_label, name)
      expect(actual).to be_an_instance_of(CuratedRegion)
    end

    # TODO: Update this to test using synthetic spatial lens shape ids
    it 'does not return the curated region if synthetic id flag is true' do
      expect(subject.add(view_id, nil, geometry_label, name, nil, true)).to_not be_an_instance_of(CuratedRegion)
    end

  end

  describe '#validate_view' do
    it 'validates a view is present' do
      view_double = double(View)
      expect(view_double).to receive(:columns).and_return(['fake'])
      expect(view_double).to receive(:present?).and_return(true)
      expect(subject.validate_view(view_double)).to eq(true)
    end
  end

end
