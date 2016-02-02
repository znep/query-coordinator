require 'rails_helper'
require_relative '../../lib/curated_region_job_queue.rb'

describe CuratedRegionJobQueue do
  let(:crjq) { CuratedRegionJobQueue.new }
  let(:id) { 'peng-uins' }

  before(:each) do
    allow(crjq).to receive(:connection_details).and_return({
      :port => 2030,
      :address => 'localhost'
    }.with_indifferent_access)
    allow(crjq).to receive(:cname).and_return('localhost')
  end

  it 'returns the jobId on success' do
    stub_request(:post, "http://localhost:2030/v1/dataset/peng-uins/enqueue").
      with(:headers => {'X-Socrata-Host'=>'localhost'}).
      to_return(:status => 200, :body => '{"jobId":"12e4"}', :headers => {})

    expect(crjq.enqueue_job({}.to_json, id)).to eq({
      'jobId' => '12e4'
    })
  end

  it 'returns failure message on failure' do
    stub_request(:post, "http://localhost:2030/v1/dataset/peng-uins/enqueue").
      with(:headers => {'X-Socrata-Host'=>'localhost'}).
      to_return(:status => 500, :body => '', :headers => {})

    expect { crjq.enqueue_job({}.to_json, id) }.to raise_exception(CuratedRegionJobQueue::ServerError)
  end
end
