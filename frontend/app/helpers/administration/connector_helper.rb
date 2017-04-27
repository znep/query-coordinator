module Administration
  module ConnectorHelper

    def esri_arcgis?
      params[:type] == 'esri_arcgis'
    end

 end
end
