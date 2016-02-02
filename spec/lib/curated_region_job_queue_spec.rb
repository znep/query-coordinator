require 'rails_helper'
require_relative '../../lib/curated_region_job_queue.rb'

describe CuratedRegionJobQueue do
  let(:crjq) { CuratedRegionJobQueue.new }
  let(:id) { 'peng-uins' }
  let(:job_id) { 'cur4t3d-r3g10n-j0b' }

  let(:host) { 'localhost' }
  let(:port) { 2030 }
  let(:base_url) { "http://#{host}:#{port}" }
  let(:headers) { {:headers => {'X-Socrata-Host' => host}} }

  before(:each) do
    allow(crjq).to receive(:connection_details).and_return({
      :port => port,
      :address => host
    }.with_indifferent_access)
    allow(crjq).to receive(:cname).and_return(host)
  end

  context '#enqueue_job' do
    let(:endpoint) { "#{base_url}/v1/dataset/#{id}/enqueue" }

    it 'returns the jobId on success' do
      stub_request(:post, endpoint).
        with(headers).
        to_return(:status => 200, :body => %{
          {
            "jobId": "#{job_id}"
          }
        }, :headers => {})

      expect(crjq.enqueue_job({}.to_json, id)).to eq({
        'jobId' => job_id
      })
    end

    it 'returns failure message on failure' do
      stub_request(:post, endpoint).
        with(headers).
        to_return(:status => 500, :body => '', :headers => {})

      expect { crjq.enqueue_job({}.to_json, id) }.to raise_exception(CuratedRegionJobQueue::ServerError)
    end
  end

  context '#get_job_status' do
    let(:endpoint) { "#{base_url}/v1/dataset/#{id}/status/#{job_id}" }

    it 'returns the status of a job on success' do
      stub_request(:get, endpoint).
        with(headers).
        to_return(:status => 200, :body => %{
          {
            "type": "adding-region-column",
            "data": {
              "jobId": "#{job_id}",
              "dataset": "#{id}"
            },
            "progress": {
              "english": "processing",
              "status": 1
            }
          }
        }, :headers => {})

      expect(crjq.get_job_status(id, job_id)).to eq({
        'type' => 'adding-region-column',
        'data' => {
          'jobId' => job_id,
          'dataset' => id
        },
        'progress' => {
          'english' => 'processing',
          'status' => 1
        }
      })
    end

    it 'returns failure message on failure' do
      stub_request(:get, endpoint).
        with(headers).
        to_return(:status => 500, :body => '', :headers => {})

      expect { crjq.get_job_status(id, job_id) }.to raise_exception(CuratedRegionJobQueue::ServerError)
    end
  end

  context '#get_queue' do
    let(:endpoint) { "#{base_url}/v1/queue" }
    let(:other_id) { 'gira-ffes' }
    let(:other_job_id) { 'CUR4T3D-R3G10N-J0B' }

    it 'returns the jobs in queue on success' do
      stub_request(:get, endpoint).
        with(headers).
        to_return(:status => 200, :body => %{[
          {
            "common": {
              "internalId": "#{job_id}",
              "externalId": "#{job_id}"
            },
            "dataset": "#{id}",
            "jobParameters": {
              "enabledFlag": true,
              "defaultFlag": true,
              "type": "prepare_curated_region"
            }
          },
          {
            "common": {
              "internalId": "#{other_job_id}",
              "externalId": "#{other_job_id}"
            },
            "dataset": "#{other_id}",
            "jobParameters": {
              "enabledFlag": true,
              "defaultFlag": true,
              "type": "add_region_columns"
            }
          }
        ]}, :headers => {})

      expect(crjq.get_queue).to eq([{
        'common' => {
          'internalId' => job_id,
          'externalId' => job_id
        },
        'dataset' => id,
        'jobParameters' => {
          'enabledFlag' => true,
          'defaultFlag' => true,
          'type' => 'prepare_curated_region'
        }
      }, {
        'common' => {
          'internalId' => other_job_id,
          'externalId' => other_job_id
        },
        'dataset' => other_id,
        'jobParameters' => {
          'enabledFlag' => true,
          'defaultFlag' => true,
          'type' => 'add_region_columns'
        }
      }])
    end

    it 'returns failure message on failure' do
      stub_request(:get, endpoint).
        with(headers).
        to_return(:status => 500, :body => '', :headers => {})

      expect { crjq.get_queue }.to raise_exception(CuratedRegionJobQueue::ServerError)
    end
  end

  context '#get_job_log' do
    let(:endpoint) { "#{base_url}/v1/dataset/#{id}/log/#{job_id}" }

    it 'returns the logs of a job on success' do
      stub_request(:get, endpoint).
        with(headers).
        to_return(:status => 200, :body => %{[
          {
            "type": "adding-region-column",
            "data": {
              "jobId": "#{job_id}",
              "dataset": "#{id}"
            },
            "progress": {
              "english": "processing",
              "status": 1
            }
          },
          {
            "type": "adding-region-column",
            "data": {
              "jobId": "#{job_id}",
              "dataset": "#{id}"
            },
            "progress": {
              "english": "failed",
              "status": -1
            }
          }
        ]}, :headers => {})

      expect(crjq.get_job_log(id, job_id)).to eq([{
        'type' => 'adding-region-column',
        'data' => {
          'jobId' => job_id,
          'dataset' => id
        },
        'progress' => {
          'english' => 'processing',
          'status' => 1
        }
      }, {
        'type' => 'adding-region-column',
        'data' => {
          'jobId' => job_id,
          'dataset' => id
        },
        'progress' => {
          'english' => 'failed',
          'status' => -1
        }
      }])
    end

    it 'returns failure message on failure' do
      stub_request(:get, endpoint).
        with(headers).
        to_return(:status => 500, :body => '', :headers => {})

      expect { crjq.get_job_log(id, job_id) }.to raise_exception(CuratedRegionJobQueue::ServerError)
    end
  end
end
