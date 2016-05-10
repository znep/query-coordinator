class DatasetLandingPage
  def get_featured_views(uid, limit = nil, offset = 0)
    view = View.find(uid)

    featured_views = view.try(:find_dataset_landing_page_related_content) || []

    limit = limit || featured_views.length

    featured_views = featured_views.slice(offset.to_i, limit.to_i) || []
    featured_views.map(&method(:format_featured_view))
  end

  private

  def format_featured_view(featured_view)
    {
      :name => featured_view.name,
      :id => featured_view.id,
      :description => featured_view.description,
      :url => featured_view.seo_friendly_url,
      :displayType => featured_view.display.try(:type),
      :updatedAt => featured_view.time_last_updated_at,
      :viewCount => featured_view.viewCount,
      :isPrivate => !featured_view.is_public?
    }
  end
end
