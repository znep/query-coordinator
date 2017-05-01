module Administration
  module ConnectorHelper

    ESRI_ARCGIS = 'esri_arcgis'
    DATA_JSON = 'data_json'

    def esri_arcgis?
      params[:type] == ESRI_ARCGIS || params[:server_backend] == 'esri_crawler'
    end

    def esri_url_placeholder
      'https://example.com/ArcGIS/rest'
    end

    def data_json_url_placeholder
      'http://example.com/data.json'
    end

    def federation_source
      @server.fetch('federation_source', ESRI_ARCGIS)
    end

    def esri_arcgis_federation_source?
      federation_source == ESRI_ARCGIS
    end

    def data_json_federation_source?
      federation_source == DATA_JSON
    end

    def connector_type_hidden_field_tag
      hidden_field_tag('type', esri_arcgis? ? ESRI_ARCGIS : DATA_JSON)
    end

 end
end
