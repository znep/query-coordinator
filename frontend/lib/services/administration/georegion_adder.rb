module Services
  module Administration
    class GeoregionAdder
      # {
      #   "uid": "msw3-ds23",
      #   "name": "USA States",
      #   "geometryLabel": "state_full_name",
      #   "featurePk" : "state_id",
      #   "enabledFlag" : true,
      #   "defaultFlag" : false
      # }

      def add(view_id, primary_key, geometry_label = nil, name = nil, options = nil, cookies = nil)
        raise '"id" is required' if view_id.nil?

        view = View.find(view_id)
        return unless validate_view(view)

        attributes = {
          :type => 'prepare_curated_region',
          :name => name,
          :geometryLabel => geometry_label,
          :defaultFlag => false,
          :enabledFlag => false,
          :createClone => true
        }
        attributes = attributes.merge(options) unless options.nil?

        Rails.logger.info("Creating curated region for #{view_id} via Curated Region Job Queue")
        make_curated_region_job_queue_request(attributes, view_id, cookies)
      end

      def make_curated_region_job_queue_request(attributes, id, cookies)
        enqueue_response = curated_region_job_queue.enqueue_job(attributes, id, {:cookies => cookies})
        jobId = enqueue_response['jobId']
        status_response = curated_region_job_queue.get_job_status(id, jobId, {:cookies => cookies})
        status_response['jobId'] = jobId
        status_response
      end

      def curated_region_job_queue
        @curated_region_job_queue ||= CuratedRegionJobQueue.new
      end

      def validate_view(view)
        view.present? && view.columns.present?
      end
    end
  end
end
