class FeaturedContent

  class << self

    include Rails.application.routes.url_helpers
    include Socrata::UrlHelpers

    # See spec/fixtures/vcr_cassettes/clp/featured_content.json
    # 'id' parameter is either a lens 4x4 or a catalog landing page query (really any arbitrary URL path/query)
    # 'parent_type' parameter must be either 'view' or 'catalog_query'
    # Returns a formatted featured item hash
    def fetch(id, parent_type)
      transformation_method = parent_type == 'catalog_query' ? :plain_featured_item : :formatted_featured_item
      begin
        JSON.parse(CoreServer::Base.connection.get_request("/featured_content/#{id}?parentType=#{parent_type}"))
      rescue CoreServer::ResourceNotFound => exception
        []
      end.map(&method(transformation_method))
    end

    def create_or_update(id, parent_type, featured_item)
      formated_featured_item(JSON.parse(
        CoreServer::Base.connection.create_request('/featured_content', featured_item.to_json)
      ))
    end

    # Return payload
    # {
    #   "contentType" => "internal",
    #   "lensId" => 16,
    #   "position" => 2,
    #   "title" => "A Datalens"
    # }
    def destroy(id, parent_type, item_position)
      JSON.parse(CoreServer::Base.connection.delete_request(
        "/featured_content/#{id}?parentType=#{parent_type}&position=#{item_position}"
      ))
    end

    private

    def formated_featured_item(featured_item)
      # This contentType is not to be confused with content-type in the context of HTTP requests.
      if featured_item.fetch('contentType') == 'internal' # Can also be 'external'
        featuredView = format_view_widget(View.setup_model(featured_item['featuredView'] || featured_item['id']))
      end
      featured_item.merge(:featuredView => featuredView).compact
    end

    def plain_featured_item(featured_item)
      featured_item.with_indifferent_access
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

    private

    def formatted_view_url(view)
      if view.story?
        "https:#{view_url(view)}"
      else
        view.link || seo_friendly_url(view)
      end
    end

  end

end
