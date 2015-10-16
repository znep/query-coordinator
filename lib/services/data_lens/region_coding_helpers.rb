module Services
  module DataLens
    class RegionCodingError < StandardError
    end

    module RegionCodingHelpers

      private

      def has_computed_column?(view, column_name)
        view.columns.any? do |column|
          column.name == column_name
        end
      end

      def has_working_copy?(view)
        view.unpublished_dataset.present?
      end

      def phidippides
        @phidippides ||= Phidippides.new
      end

      def region_column_field_name(id)
        sanitized_id = id.gsub(/-/, '_')
        ":@computed_region_#{sanitized_id}"
      end

    end
  end
end
