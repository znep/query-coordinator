require 'application_helper'

module Services
  module Administration
    class GeoregionEnabler
      include ApplicationHelper

      def initialize
      end

      def enable(curated_region)
        make_request(curated_region, true)
      end

      def disable(curated_region)
        # Undefault region when disabling the region
        make_request(curated_region, false, :defaultFlag => false)
      end

      def make_request(curated_region, enabled, opts = {})
        request_options = { :enabledFlag => enabled }.merge(opts).to_json

        CoreServer::Base.connection.update_request(
          path(curated_region.id),
          request_options
        )
      end

      def path(id)
        "/#{CuratedRegion.service_name}/#{id}"
      end
    end
  end
end
