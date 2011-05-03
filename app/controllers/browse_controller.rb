class BrowseController < ApplicationController
  skip_before_filter :require_user
  include BrowseActions

  def show
    @suppress_dataset_creation = true
    process_browse!
  end

  def embed
    @browse_in_container = true
    @suppress_dataset_creation = true
    @rel_type = 'external'

    if params[:limit].present?
      @limit = Integer(params[:limit]) rescue nil
    end

    # Passed to _browse partial to remove controls, e.g. search/sort/paginate
    @disable = params[:disable] unless params[:disable].blank?

    # Mimic the 'default' selection for facets
    @default_params = params[:defaults] unless params[:defaults].blank?

    enabled_facets = params[:facets] || {}
    @facets = [
      view_types_facet,
      categories_facet,
      topics_facet
    ].select { |f| enabled_facets[f[:singular_description]].present? }

    process_browse!
    render :layout => 'embedded_browse'
  end
end
