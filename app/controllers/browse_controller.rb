class BrowseController < ApplicationController
  skip_before_filter :require_user
  layout :choose_layout
  include BrowseActions

  def show
    process_browse!
  end

  def embed
    @browse_in_container = true
    @suppress_dataset_creation = true

    if params[:limit].present?
      @limit = Integer(params[:limit]) rescue nil
    end

    # Passed to _browse partial to remove controls, e.g. search/sort/paginate
    @disable = params[:disable]

    # Mimic the 'default' selection for facets
    @default_params = params[:defaults]

    enabled_facets = params[:facets] || {}
    @facets = [
      view_types_facet,
      categories_facet,
      topics_facet
    ].select { |f| enabled_facets[f[:singular_description]].present? }

    process_browse!
  end

private
  def choose_layout
    case action_name
      when 'embed'
        'embedded_browse'
      else 'main'
    end
  end
end
