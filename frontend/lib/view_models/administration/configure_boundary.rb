module ViewModels
  module Administration
    class ConfigureBoundary

      attr_reader :boundary
      attr_reader :is_name_missing
      attr_reader :site_title

      def initialize(boundary, site_title, is_name_missing)
        @boundary = boundary
        @site_title = site_title
        @is_name_missing = is_name_missing
      end

      def shape_label_options
        @boundary.geometry_label_columns.map do |column|
          [ column.name, column.fieldName ]
        end
      end

      def selected_shape_label
        @boundary.geometryLabel
      end

    end
  end
end
