class FeaturedContent

  class << self

    include Rails.application.routes.url_helpers
    include Socrata::UrlHelpers
    include Socrata::RequestIdHelper
    include Socrata::CookieHelper

    # TODOS: Deal with Core errors
    #  If the permissions of the view have changed, then we might need an Auth Required (401)
    #  If the view has since been deleted, then we have to deal with Not Found (404)
    #  If something unexpected goes wrong with Core, we have to deal with 500 errors

    # See spec/fixtures/vcr_cassettes/clp/featured_content.json
    # 'id' parameter is either a lens 4x4 or a catalog landing page query (really any arbitrary URL path/query)
    # 'parent_type' parameter must be either 'view' or 'catalog_query'
    # Returns a formatted featured item hash
    def fetch(parent_uid, parent_type)
      transformation_method = parent_type == 'catalog_query' ? :featured_item : :formatted_featured_item
      begin
        JSON.parse(CoreServer::Base.connection.get_request("/featured_content/#{parent_uid}?parentType=#{parent_type}"))
      rescue CoreServer::ResourceNotFound => exception
        []
      end.map(&method(transformation_method))
    end

    def create_or_update(parent_uid, parent_type, item)
      # Don't save items that already have a table id. Featured Content api doesn't actually support "update".
      # Instead it will delete and re-create the item.
      # This addresses a sharp corner whereby the id of the underlying catalog_query record can change when
      # The update contains only a single featured content item, which causes a deletion of that record, which
      # leads to the deletion of the orphaned catalog_query record. Then the featured content item is saved,
      # which leads to the creation of a new catalog_query record, which leads to state getting out of sync
      # between frontend w/r/t the catalog_query record primary key. This is discussed in the following doc:
      # https://docs.google.com/document/d/19EgLcTe-iHMpJ_wLlsl5cxge3xuwkPMriT93C9R-AU0/edit#
      return if item[:resource_id]

      extra_properties = {
        :parentUid => parent_uid,
        :parentType => parent_type
      }

      # Here we strip off the leading MIME type information from the form upload element base64 data
      if item[:previewImageBase64].present?
        imagePayload = item[:previewImageBase64]
        extra_properties[:previewImageBase64] = imagePayload[imagePayload.index(',')+1..-1]
      end

      formatted_featured_item(JSON.parse(
        CoreServer::Base.connection.
          create_request('/featured_content', item.merge(extra_properties.to_h).to_json)
      ))
    end

    # Return payload
    # {
    #   "contentType" => "internal",
    #   "lensId" => 16,
    #   "position" => 2,
    #   "title" => "A Datalens"
    # }
    def destroy(resource_id)
      CoreServer::Base.connection.delete_request("/featured_content/#{resource_id}")
    end

    private

    def formatted_featured_item(item)
      # This contentType is not to be confused with content-type in the context of HTTP requests.
      # contentType can be either 'internal' or 'external'. When it's 'internal' and parentType is
      # 'catalog_query' then the parentUid points to an entry in the catalog_queries table. When the
      # parentType is 'data_lens', then parentUid is the 4x4 of the parent view. Furthermore, the
      # parentType property is only present on 'internal' featured content items, so we check that last.
      if item.fetch('contentType') == 'internal' && item.fetch('parentType') != 'catalog_query'
        featuredView = format_view_widget(View.setup_model(item['featuredView'] || item['id']))
      end
      item.merge(:featuredView => featuredView).compact
    end

    # This method extracts the subset of properties from a featured content item and transforms them for use
    # in the context of a View Card since the view card properties differ from what the API returns.
    def featured_item(item)
      view_card_mapping = item.slice(*%w(contentType description id position url)).with_indifferent_access
      uid = item['featuredLensUid']
      view_card_mapping[:uid] = uid
      view_card_mapping[:name] = item['title']

      if item['previewImageId'].present? || item['previewImage'].present?
        preview_image = item.values_at('previewImageId', 'previewImage').compact.first
        if view_card_mapping[:contentType] == 'internal'
          view_card_mapping[:imageUrl] = "https://#{CurrentDomain.cname}/views/#{uid}/files/#{preview_image}"
        else
          view_card_mapping[:imageUrl] = "https://#{CurrentDomain.cname}/api/file_data/#{preview_image}"
        end
      end

      view_card_mapping
    end

    def format_view_widget(view)
      {
        :name => view.name,
        :id => view.id,
        :description => view.description,
        :url => formatted_view_url(view),
        :displayType => view.display.try(:type),
        :createdAt => view.time_created_at,
        :updatedAt => view.time_last_updated_at,
        :viewCount => view.viewCount,
        :isPrivate => !view.is_public?
      }.with_indifferent_access
    end

    def formatted_view_url(view)
      if view.story?
        "https:#{view_url(view)}"
      else
        view.link || seo_friendly_url(view)
      end
    end

  end

end
