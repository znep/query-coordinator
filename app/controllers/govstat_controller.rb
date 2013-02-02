class GovstatController < ApplicationController
  include BrowseActions
  before_filter :set_govstat_theme

  def goals
  end

  def manage
  end

  def manage_data
    @processed_browse = process_browse(request, {
      nofederate: true,
      sortBy: 'newest',
      for_user: current_user.id,
      publication_stage: ['published', 'unpublished'],
      limit: 10,
      facets: [],
      disable: { pagination: true, sort: true, counter: true, table_header: true },
      grid_items: { largeImage: true, richSection: true },
      footer_config: {},
      browse_in_container: true,
      suppress_dataset_creation: true
    })
  end

  def manage_reports
    @reports = Page.find('$order' => ':updated_at', '$limit' => 10)
  end

  def manage_config
  end

  def manage_template
  end

protected
  def set_govstat_theme
    @use_govstat_theme = true
  end
end
