class DatasetLandingPage
  include Rails.application.routes.url_helpers
  include Socrata::UrlHelpers

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

  private

  def format_view_widget(popular_view)
    {
      :name => popular_view.name,
      :id => popular_view.id,
      :description => popular_view.description,
      :url => seo_friendly_url(popular_view),
      :displayType => popular_view.display.try(:type),
      :updatedAt => popular_view.time_last_updated_at,
      :viewCount => popular_view.viewCount,
      :isPrivate => !popular_view.is_public?
    }
  end

  def format_featured_item(featured_item)
    if featured_item[:contentType] == 'internal'
      featured_item.merge(:featuredView => format_view_widget(featured_item[:featuredView]))
    end

    featured_item
  end
end
