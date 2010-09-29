class HomepageController < ApplicationController
  include BrowseActions

  def show
    # move to /browse on interaction
    @base_url = browse_path
    # hide some of the chrome on this page
    @facets = {}

    @no_results_text = 'No Datasets Yet'
    process_browse!
  end
end
