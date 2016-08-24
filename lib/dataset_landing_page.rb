class DatasetLandingPage
  include Rails.application.routes.url_helpers
  include Socrata::UrlHelpers

  # Our different search services accept different sort_by values.
  # Cly: name, date, most_accessed
  # Cetera: relevance, most_accessed, alpha/name, newest/date, oldest, last_modified
  def get_derived_views(uid, cookie_string, request_id, limit = nil, offset = nil, sort_by = 'most_accessed', locale = nil)
    view = View.find(uid)

    return [] if view.nil?

    # TODO use the asset_selector endpoint instead of calling two different services
    if view.is_public?
      options = {
        :cookie_string => cookie_string,
        :request_id => request_id,
        :limit => limit,
        :offset => offset,
        :locale => locale,
        :sortBy => sort_by,
        :boostStories => 1.3,
        :boostDatalenses => 1.15
      }.compact

      derived_views = Cetera::Utils.get_derived_from_views(uid_to_search_cetera(view), options)
    else
      derived_views = view.find_dataset_landing_page_related_content(sort_by) || []
      limit = limit || derived_views.length
      derived_views = derived_views.slice(offset.to_i, limit.to_i) || []
    end

    # We are using threads here because stories need to issue a separate request for its
    # preview image and (until Cetera returns the previewImageId) we also need to issue
    # a request to Core for the previewImageId of non-stories views. To speed things up,
    # we're making these requests with threads and then formatting the view widget. If
    # Cetera is ever able to return the preview image url for either a story or a view,
    # then we can remove these threads.
    preview_image_urls = {}
    preview_image_url_request_threads = derived_views.map do |view|
      Thread.new do
        preview_image_urls[view.id] = view.get_preview_image_url(cookie_string, request_id)
      end
    end
    preview_image_url_request_threads.each(&:join)

    derived_views.map { |view| format_view_widget(view, preview_image_urls[view.id]) }
  end

  def get_featured_content(uid, cookie_string, request_id)
    view = View.find(uid)
    featured_content = view.featured_content

    # We are using threads here because stories need to issue a separate request for its
    # preview image and (until Cetera returns the previewImageId) we also need to issue
    # a request to Core for the previewImageId of non-stories views. To speed things up,
    # we're making these requests with threads and then formatting the view widget. If
    # Cetera is ever able to return the preview image url for either a story or a view,
    # then we can remove these threads.
    preview_image_urls = {}
    preview_image_url_request_threads = featured_content.map do |featured_item|
      Thread.new do
        if featured_item['contentType'] == 'internal'
          featured_view = View.set_up_model(featured_item['featuredView'])
          image_url = featured_view.get_preview_image_url(cookie_string, request_id)

          preview_image_urls[featured_view.id] = image_url
        end
      end
    end
    preview_image_url_request_threads.each(&:join)

    featured_content.map do |featured_item|
      image_url = nil

      if featured_item['contentType'] == 'internal'
        image_url = preview_image_urls[featured_item['featuredView']['id']]
      end

      format_featured_item(featured_item, image_url)
    end
  end

  def add_featured_content(uid, featured_item, cookie_string, request_id)
    path = "/views/#{uid}/featured_content.json"
    view = JSON.parse(CoreServer::Base.connection.create_request(path, featured_item))
    image_url = nil

    if view['contentType'] == 'internal'
      featured_view = View.set_up_model(view['featuredView'])
      image_url = featured_view.get_preview_image_url(cookie_string, request_id)
    end

    format_featured_item(view, image_url)
  end

  def delete_featured_content(uid, item_position)
    path = "/views/#{uid}/featured_content/#{item_position}"
    # Response format: {"contentType"=>"internal", "lensId"=>16, "position"=>2, "title"=>"A Datalens"}
    response = JSON.parse(CoreServer::Base.connection.delete_request(path))
  end

  def get_formatted_view_widget_by_id(uid, cookie_string, request_id)
    view = View.find(uid)
    image_url = view.get_preview_image_url(cookie_string, request_id)
    format_view_widget(view, image_url)
  end

  # Formats either a View object instantiated from View json (from api/views) or
  # a Cetera::Results::ResultRow object instantiated from Cetera json results into a
  # payload that the View Widget component can use.
  #
  # View json example: {
  #   "createdAt": 1446141533,
  #   "rowsUpdatedAt": 1446141473
  # }
  #
  # Cetera json example: {
  #   "resource": {
  #     "updatedAt": "2016-06-30T01:13:00.000Z",
  #     "createdAt": "2014-11-06T11:39:23.000Z"
  #   },
  #   "link": "https://data.cityofnewyork.us/d/axxb-u7uv"
  # }
  def format_view_widget(view, image_url = nil)
    formatted_view = {
      :name => view.name,
      :id => view.id,
      :description => view.description,
      :url => view.try(:link) || seo_friendly_url(view),
      :displayType => view.display.try(:type),
      :createdAt => view.try(:time_created_at) || view.createdAt,
      :updatedAt => view.try(:time_last_updated_at) || view.updatedAt,
      :viewCount => view.viewCount,
      :isPrivate => !view.is_public?,
      :imageUrl => image_url
    }

    if view.story?
      formatted_view[:url] = "https:#{view_url(view)}"
    end

    formatted_view
  end

  def format_featured_item(featured_item, image_url = nil)
    if featured_item['contentType'] == 'internal'
      view = View.set_up_model(featured_item['featuredView'])

      return featured_item.merge(
        :featuredView => format_view_widget(view, image_url)
      )
    end

    featured_item
  end

  # TODO: Remove this OBE/NBE juggling once Cetera returns the same results for both 4x4s
  def uid_to_search_cetera(view)
    if view.newBackend?
      begin
        # Cetera uses the OBE id for indexing. It will not return results for a NBE id if
        # a dataset has an OBE version, so we have to use the OBE id if it exists.
        view.migrations['obeId']
      rescue CoreServer::ConnectionError
        # If a dataset does not have an OBE id, Cetera indexes the NBE id. If the
        # migrations request fails at this point, the uid should be the id of a NBE-only dataset.
        view.id
      end
    else
      view.id
    end
  end
end
