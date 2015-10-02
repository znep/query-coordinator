module ViewModels
  module Administration
    class GeoregionCandidate

      def initialize(id)
        view = View.find(id)
        @name = view.name
        @geometryLabelColumns = CuratedRegion.geometry_label_columns(view)
        @primaryKeyColumns = CuratedRegion.primary_key_columns(view)
      end

    end
  end
end
