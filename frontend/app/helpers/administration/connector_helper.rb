module Administration
  module ConnectorHelper

    def esri_arcgis?
      params.fetch(:type, 'esri_arcgis') == 'esri_arcgis'
    end

    def data_json?
      params[:type] == 'data_json'
    end

 end
end
