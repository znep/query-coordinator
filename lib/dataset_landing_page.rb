class DatasetLandingPage
  include Rails.application.routes.url_helpers
  include Socrata::UrlHelpers

  def get_related_views(uid, sort_by)
    # valid sort_by=name, date, most_accessed
    view = View.find(uid)
    return if view.nil?

    related_views = view.find_dataset_landing_page_related_content(sort_by) || []
    related_views.map(&method(:format_view_widget))
  end

  def get_popular_views(uid, limit = nil, offset = 0)
    view = View.find(uid)

    popular_views = view.try(:find_dataset_landing_page_related_content) || []

    limit = limit || popular_views.length

    popular_views = popular_views.slice(offset.to_i, limit.to_i) || []
    popular_views.map(&method(:format_view_widget))
  end

  def get_featured_content(uid)
    view = View.find(uid)

    view.featured_content.map(&method(:format_featured_item))
  end

  def add_featured_content(uid, featured_item)
    path = "/views/#{uid}/featured_content.json"
    response = JSON.parse(CoreServer::Base.connection.create_request(path, featured_item))
    format_featured_item(response)
  end

  def get_formatted_view_widget_by_id(uid)
    format_view_widget(View.find(uid))
  end

  def delete_featured_content(uid, item_position)
    path = "/views/#{uid}/featured_content/#{item_position}"
    # Response format: {"contentType"=>"internal", "lensId"=>16, "position"=>2, "title"=>"A Datalens"}
    response = JSON.parse(CoreServer::Base.connection.delete_request(path))
  end

  def format_view_widget(view)
    formatted_view = {
      :name => view.name,
      :id => view.id,
      :description => view.description,
      :url => seo_friendly_url(view),
      :displayType => view.display.try(:type),
      :createdAt => view.time_created_at,
      :updatedAt => view.time_last_updated_at,
      :viewCount => view.viewCount,
      :isPrivate => !view.is_public?
    }

    if view.story?
      formatted_view[:url] = "https:#{view_url(view)}"
    end

    formatted_view
  end

  def format_featured_item(featured_item)
    if featured_item['contentType'] == 'internal'
      view = View.set_up_model(featured_item['featuredView'])
      return featured_item.merge(:featuredView => format_view_widget(view))
    end

    featured_item
  end
end
