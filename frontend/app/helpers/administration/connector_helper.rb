module Administration
  module ConnectorHelper

    def esri_arcgis?
      params[:type] == 'esri_arcgis' || params[:server_backend] == 'esri_crawler'
    end

    def esri_url_placeholder
      'https://example.com/ArcGIS/rest'
    end

 end
end
