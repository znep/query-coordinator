module Services
  module DataLens
    class RegionCoder

      # Used to fetch dataset metadata to see if computed column has been added
      include CommonMetadataMethods
      include ApplicationHelper

      class CuratedRegionNotFound < RuntimeError; end

      # Initiates a region coding job. After converting the shapefile id to a curated region id,
      # enqueues the job using CuratedRegionJobQueue.
      def initiate(dataset_id, shapefile_id, source_column, options = {})

        # Convert the shapefile id into a curated region id
        Rails.logger.info "RegionCoder: looking up curated region for region #{shapefile_id}"

        begin
          curated_region = CuratedRegion.find_by_view_id(shapefile_id)
          raise 'Expected curated region to have an id' unless curated_region.id.present?
        rescue CoreServer::ResourceNotFound => exception
          raise CuratedRegionNotFound.new("Curated region for region #{shapefile_id} does not exist")
        rescue => exception
          raise "Unknown error fetching curated region for region #{shapefile_id}: #{exception.message}"
        end

        # Enqueue the job to add the computed column and return the corresponding job id
        Rails.logger.info "RegionCoder: enqueueing add_region_columns job for dataset #{dataset_id}"

        attributes = {
          :type => 'add_region_columns',
          :columnInfos => [
            {
              :sourceColumn => source_column,
              :curatedRegionId => curated_region.id
            }
          ]
        }

        begin
          response = curated_region_job_queue.enqueue_job(attributes, dataset_id, options)
        rescue => exception
          raise "Unknown error enqueueing add_region_columns job for dataset #{dataset_id}: " +
            exception.message
        end

        response['jobId']
      end

      # Given a dataset id and the job id, uses the CuratedRegionJobQueue endpoint to query the
      # job's status.
      def get_status_for_job(dataset_id, job_id, options)
        begin
          response = curated_region_job_queue.get_job_status(dataset_id, job_id, options)
        rescue => exception
          raise "Unknown error getting status for job #{job_id}: #{exception.message}"
        end

        response
      end

      # Given a dataset id and a region id, tries to obtain information about any pending jobs.
      # Provides less reliable information but can be convenient if no job ID is known. Future
      # intent is to improve the backend API to make this obsolete.
      def get_status_for_region(dataset_id, shapefile_id, options = {})

        # Convert the shapefile id into a curated region id
        Rails.logger.info "RegionCoder: looking up curated region for region #{shapefile_id}"

        begin
          curated_region = CuratedRegion.find_by_view_id(shapefile_id)
          raise 'Expected curated region to have an id' unless curated_region.id.present?
        rescue CoreServer::ResourceNotFound => exception
          raise CuratedRegionNotFound.new(exception.message)
        rescue => exception
          raise "Unknown error fetching curated region for region #{shapefile_id}: #{exception.message}"
        end

        # Fetch a list of all pending region coding jobs and filter to see if a matching one exists.
        Rails.logger.info "Fetching list of curated region jobs matching dataset #{dataset_id} " +
          " and region #{shapefile_id}"

        begin
          params = { :jobType => 'add_region_columns' }
          response = curated_region_job_queue.get_queue(params, options)
          matching_job = response.find { |job|
            job['common'].present? &&
              job['dataset'].present? &&
              job['dataset'] == dataset_id &&
              job['jobParameters'].present? &&
              job['jobParameters']['columnsInfos'].kind_of?(Array) &&
              job['jobParameters']['columnInfos'].length > 0 &&
              job['jobParameters']['columnInfos'].first['curatedRegionId'].present?
              job['jobParameters']['columnInfos'].first['curatedRegionId'] == curated_region.id
          }
        rescue => exception
          raise "Unknown error fetching job queue: #{exception.message}"
        end

        # Great! The job is on the queue. Use the status endpoint for fine-grained information
        # about its progress.
        if matching_job
          job_id = matching_job['common']['externalId']
          return get_status_for_job(dataset_id, job_id, options)
        end

        # If we get here then all we know is the job is not currently in progress. Either it has
        # completed, failed, or wasn't kicked off in the first place. Current approach is to
        # attempt to fetch dataset metadata and see if a relevant computed column exists. If so,
        # then we make the assumption that the job completed successfully some time in the past.
        # If no computed column exists then either the job failed or was never started. Let's
        # hope that the statistically common case is that people poll for a job's status after
        # they enqueue it and assume that the job has failed if it's not in progress and no
        # computed column exists on the dataset.
        Rails.logger.info 'No job found, falling back to using dataset metadata to guess job status'

        begin
          dataset_metadata = fetch_dataset_metadata(dataset_id, options)

          computed_column = dataset_metadata['columns'].select { |key, column|
            column['computationStrategy'].present? &&
              column['computationStrategy']['parameters'].present? &&
              column['computationStrategy']['parameters']['region'] == shapefile_id
          }
        rescue => exception
          raise "Unknown error fetching dataset metadata for dataset #{dataset_id}: #{exception.message}"
        end

        # Conjure up a response that resembles something curated_region_job_queue would return.
        {
          'data' => {},
          'english' => 'No jobs found.',
          'progress' => {
            'english' => computed_column.empty? ? 'unknown' : 'completed',
            'datasetMetadata' => dataset_metadata
          }
        }
      end

      def curated_region_job_queue
        @curated_region_job_queue ||= CuratedRegionJobQueue.new
      end
    end
  end
end
