class AssetSelectorController < ApplicationController
  include ApplicationHelper
  include BrowseActions

  layout 'styleguide'

  def show
    old_browse_content = process_browse(request)

    @asset_selector_content = {
      :results => old_browse_content[:view_results],
      :view_count => old_browse_content[:view_count],
      :facets => old_browse_content[:facets]
    }
  end
end
