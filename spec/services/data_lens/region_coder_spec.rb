require 'rails_helper'

describe Services::DataLens::RegionCoder do
  let(:shapefile_id) { 'abcd-shape' }
  let(:dataset_id) { 'abcd-data' }
  let(:source_column) { 'test_column' }
  let(:cookies) { nil }
  let(:subject) { ::Services::DataLens::RegionCoder.new }
  let(:curated_region_job_queue) { CuratedRegionJobQueue.new }
  let(:test_curated_region) { CuratedRegion.new({ 'id' => 1 }) }

  describe 'initiate' do
    it 'raises a specific error if the curated region is not found' do
      expect(CuratedRegion).to receive(:find_by_view_id).and_raise(CoreServer::ResourceNotFound.new(nil))
      expect { subject.initiate(shapefile_id, dataset_id, source_column, cookies) }.to raise_exception(
        Services::DataLens::RegionCoder::CuratedRegionNotFound
      )
    end

    it 'raises a general error if the curated region region does not have an id' do
      expect(CuratedRegion).to receive(:find_by_view_id).and_return(CuratedRegion.new({ 'name' => 'foo' }))
      expect { subject.initiate(shapefile_id, dataset_id, source_column, cookies) }.to raise_exception(RuntimeError)
    end

    it 'raises an error if the curated API request fails' do
      allow(CuratedRegion).to receive(:find_by_view_id).and_throw
      expect { subject.initiate(shapefile_id, dataset_id, source_column, cookies) }.to raise_error(RuntimeError)
    end

    it 'raises an error if the region job queue request fails' do
      expect(CuratedRegion).to receive(:find_by_view_id).and_return(test_curated_region)
      expect_any_instance_of(CuratedRegionJobQueue).to receive(:enqueue_job).and_throw
      expect { subject.initiate(shapefile_id, dataset_id, source_column, cookies) }.to raise_error(RuntimeError)
    end

    it 'enqueues the job and returns a job id if successful' do
      expect(CuratedRegion).to receive(:find_by_view_id).and_return(test_curated_region)
      expect_any_instance_of(CuratedRegionJobQueue).to receive(:enqueue_job).and_return({
        'jobId' => 'abcd-test-job'
      })
      expect(subject.initiate(shapefile_id, dataset_id, source_column, cookies)).to eq('abcd-test-job')
    end

  end

  describe 'get_status_for_job' do
    it 'calls CuratedRegionJobQueue#get_job_status' do
      expect_any_instance_of(CuratedRegionJobQueue).to receive(:get_job_status).
        with(dataset_id, shapefile_id, { :cookies => 'oatmeal' }).
        and_return(nil)
      subject.get_status_for_job(dataset_id, shapefile_id, { :cookies => 'oatmeal' })
    end
  end

  describe 'get_job_id' do
    it 'returns a job id, given a datasetId and a shapefileId' do
      expect(CuratedRegion).to receive(:find_by_view_id).and_return(test_curated_region)
      expect_any_instance_of(CuratedRegionJobQueue).to receive(:get_queue).
        with({ :jobType => 'add_region_columns' }, { :cookies => 'oatmeal' }).
        and_return(
          [{
            'common' => {
              'username' => 'some_user@socrata.com',
              'requestId' => '4eb68c92555fa96d8d0542f1335e70c0',
              'domain'=> 'some_domain.com',
              'classifier' => 'abcd-else',
              'internalId' => 'db03c916-6f9f-45ea-8065-same_region_different_dataset',
              'externalId' => 'db03c916-6f9f-45ea-8065-same_region_different_dataset'
            },
            'dataset' => 'abcd-else',
            'jobParameters'=> {
              'columnInfos'=>
              [
                {
                  'sourceColumn' => 'location',
                  'curatedRegionId' => 1
                }
              ],
              'type' => 'add_region_columns'
            }
          },
          {
            'common' => {
              'username' => 'some_user@socrata.com',
              'requestId' => '4eb68c92555fa96d8d0542f1335e70c0',
              'domain'=> 'some_domain.com',
              'classifier' => 'abcd-data',
              'internalId' => 'db03c916-6f9f-45ea-8065-same_dataset_different_region',
              'externalId' => 'db03c916-6f9f-45ea-8065-same_dataset_different_region'
            },
            'dataset' => 'abcd-data',
            'jobParameters'=> {
              'columnInfos'=>
              [
                {
                  'sourceColumn' => 'location',
                  'curatedRegionId' => 2
                }
              ],
              'type' => 'add_region_columns'
            }
          },
          {
            'common' => {
              'username' => 'some_user@socrata.com',
              'requestId' => '4eb68c92555fa96d8d0542f1335e70c0',
              'domain'=> 'some_domain.com',
              'classifier' => 'abcd-data',
              'internalId' => 'db03c916-6f9f-45ea-8065-c8a4ba5127be',
              'externalId' => 'db03c916-6f9f-45ea-8065-c8a4ba5127be'
            },
            'dataset' => 'abcd-data',
            'jobParameters'=> {
              'columnInfos'=>
              [
                {
                  'sourceColumn' => 'location',
                  'curatedRegionId' => 1
                }
              ],
              'type' => 'add_region_columns'
            }
          }])
        expect(subject.get_job_id(dataset_id, shapefile_id, { :cookies => 'oatmeal' })).to eq("db03c916-6f9f-45ea-8065-c8a4ba5127be")
    end
  end
end
