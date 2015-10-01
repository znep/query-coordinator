module Services
  module Administration
    class MissingBoundaryNameError < StandardError
    end

    class MissingGeometryLabelError < StandardError
    end

    class GeoregionEditor
      attr_reader :allowed_fields
      attr_reader :required_fields

      def initialize
        @allowed_fields = %w(geometryLabel name)
        @required_fields = %w(name)
      end
      
      def edit(georegion, fields = {})
        sanitized_fields = sanitize_fields(georegion, fields)
        validate_fields(sanitized_fields)

        response = make_request(georegion, sanitized_fields)
        CuratedRegion.parse(response)
      end

      def make_request(curated_region, fields)
        CoreServer::Base.connection.update_request(
          path(curated_region.id),
          fields.to_json, {})
      end
      
      def path(id)
        "/#{CuratedRegion.service_name}/#{id}"
      end

      def validate_fields(fields)
        # very specific validation, per the current AC
        if fields.keys.include?('name') && fields['name'].empty?
          raise MissingBoundaryNameError.new
        end

        if fields.keys.include?('geometryLabel') && fields['geometryLabel'].empty?
          raise MissingGeometryLabelError.new
        end
      end

      def sanitize_fields(georegion, fields)
        filtered_fields = fields.select do |key, value|
          allowed_fields.include?(key) &&
            georegion.send(key) != value
        end

        Hash[filtered_fields.map { |key, value| [key, strip_string(value)] }]
      end

      private

      def strip_string(value)
        if value.is_a?(String)
          value.strip
        else
          value
        end
      end

    end
  end
end
