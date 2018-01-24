require 'rails_helper'

describe ::Services::Administration::GeoregionAdder do
  include TestHelperMethods

  let(:view_id) { 'test-data' }
  let(:feature_pk) { '_feature_id' }
  let(:geometry_label) { 'name' }
  let(:name) { 'US States' }
  let(:subject) { ::Services::Administration::GeoregionAdder.new }
  let(:fixture_data) { json_fixture('sample-data.json') }

  describe '#add' do
    before(:each) do
      allow(CurrentDomain).to receive(:cname).and_return('localhost')
      stub_request(:get, 'http://localhost:8080/views/test-data.json').
        to_return(:status => 200, :body => fixture_data.to_json, :headers => {'ContentType' => 'application/json'})
    end

    it 'fetches the view' do
      expect(View).to receive(:find).with('test-data').and_call_original
      allow(subject).to receive(:make_curated_region_job_queue_request).and_return({})
      subject.add(view_id, feature_pk)
    end

    it 'validates the view' do
      expect(subject).to receive(:validate_view).and_return(true)
      allow(subject).to receive(:make_curated_region_job_queue_request).and_return({})
      subject.add(view_id, feature_pk)
    end

    it 'returns early if validation fails' do
      allow(subject).to receive(:validate_view).and_return(false)
      expect(subject.add(view_id, feature_pk)).to eq(nil)
    end

    it 'returns the CRJQ job if successful' do
      crjq = CuratedRegionJobQueue.new
      allow(subject).to receive(:curated_region_job_queue).and_return(crjq)
      expect(crjq).to receive(:enqueue_job).and_return({'jobId' => '12e4'})
      expect(crjq).to receive(:get_job_status).and_return({'data' => {'jobId' => '12e4'}})

      actual = subject.add(view_id, nil, geometry_label, name, nil, true)
      expect(actual).not_to be_an_instance_of(CuratedRegion)
      expect(actual['data']['jobId']).to eq('12e4')
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
