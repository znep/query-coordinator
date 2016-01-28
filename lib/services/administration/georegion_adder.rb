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

      def add(view_id, primary_key, geometry_label = nil, name = nil, options = nil, synthetic_id_flag = false, cookies = nil)
        raise '"id" is required' if view_id.nil?
        raise '"primaryKey" is required' if primary_key.nil? && !synthetic_id_flag

        view = View.find(view_id)
        return unless validate_view(view)

        # TODO: Remove curated regions endpoint once we're using synthetic
        # spatial lens shape ids exclusively
        if synthetic_id_flag
          attributes = {
            :type => 'prepare_curated_region',
            :name => name,
            :geometryLabel => geometry_label,
            :defaultFlag => false,
            :enabledFlag => false
          }
          attributes = attributes.merge(options) unless options.nil?

          Rails.logger.info("Creating curated region for #{view_id} via Curated Region Job Queue")
          make_curated_region_job_queue_request(attributes, view_id, cookies)
        else
          attributes = {
            :uid => view_id,
            :name => name || view.name,
            :geometryLabel => geometry_label,
            :featurePk => primary_key
          }
          path = curated_regions_path
          attributes = attributes.merge(options) unless options.nil?

          Rails.logger.info("Creating curated region for #{view_id} via Curated Regions")
          response = make_curated_regions_request(attributes, path)
          CuratedRegion.parse(response)
        end
      end

      def curated_regions_path
        "/#{CuratedRegion.service_name}"
      end

      def make_curated_regions_request(attributes, path)
        CoreServer::Base.connection.create_request(path, attributes.to_json, {})
      end

      def make_curated_region_job_queue_request(attributes, id, cookies)
        curated_region_job_queue.enqueue_job(attributes, id, {:cookies => cookies})
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
