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

      def add(view_id, feature_pk, geometry_label = nil, name = nil, options = nil)
        raise '"id" is required' if view_id.nil?
        raise '"primaryKey" is required' if feature_pk.nil?

        view = View.find(view_id)
        return unless validate_view(view)

        attributes = {
          :uid => view_id,
          :name => name || view.name,
          :geometryLabel => geometry_label,
          :featurePk => feature_pk
        }
        attributes = attributes.merge(options) unless options.nil?
        response = make_request(attributes)
        CuratedRegion.parse(response)
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
