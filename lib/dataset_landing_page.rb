class DatasetLandingPage
  include Rails.application.routes.url_helpers
  include Socrata::UrlHelpers

  def get_popular_views(uid, limit = nil, offset = 0)
    view = View.find(uid)

    popular_views = view.try(:find_dataset_landing_page_related_content) || []

    limit = limit || popular_views.length

    popular_views = popular_views.slice(offset.to_i, limit.to_i) || []
    popular_views.map(&method(:format_popular_view))
  end

  private

  def format_popular_view(popular_view)
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
end
