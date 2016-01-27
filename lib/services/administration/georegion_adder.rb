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

      def add(view_id, primary_key, geometry_label = nil, name = nil, options = nil, synthetic_id_flag = false)
        raise '"id" is required' if view_id.nil?

        if synthetic_id_flag
          # TODO in EN-1956: Enqueue an async job here instead of calling curated_regions API
          Rails.logger.info("Creating curated region for #{view_id} via Async Region Coder")
        else
          raise '"primaryKey" is required' if primary_key.nil?

          view = View.find(view_id)
          return unless validate_view(view)

          attributes = {
            :uid => view_id,
            :name => name || view.name,
            :geometryLabel => geometry_label,
            :featurePk => primary_key
          }
          attributes = attributes.merge(options) unless options.nil?

          Rails.logger.info("Creating curated region for #{view_id} via Curated Regions")
          response = make_request(attributes)
          CuratedRegion.parse(response)
        end
      end

      def path
        "/#{CuratedRegion.service_name}"
      end

      def make_request(attributes)
        CoreServer::Base.connection.create_request(path, attributes.to_json, {})
      end

      def validate_view(view)
        view.present? && view.columns.present?
      end
    end
  end
end
