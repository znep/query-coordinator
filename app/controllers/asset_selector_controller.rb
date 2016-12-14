class AssetSelectorController < ApplicationController
  include ApplicationHelper
  include BrowseActions

  layout 'styleguide'

  def show
    browse_content = process_browse(request)
    results = AssetSelectorResource.from_cetera_result(browse_content[:view_results])

    @asset_selector_content = {
      :results => results,
      :view_count => browse_content[:view_count]
    }
  end
end
