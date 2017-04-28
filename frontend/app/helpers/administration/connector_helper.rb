module Administration
  module ConnectorHelper

    def esri_arcgis?
      params[:type] == 'esri_arcgis' || params[:server_backend] == 'esri_crawler'
    end

 end
end
