module Administration
  module ConnectorHelper

    def esri_arcgis?
      params.fetch(:type, 'esri_arcgis') == 'esri_arcgis'
    end

    def catalog_federator?
      params[:type] == 'catalog_federator'
    end

 end
end
