class SearchesController < ApplicationController
  skip_before_filter :require_user
  include BrowseController

  def show
    process_browse!

    render :layout => 'dataset_v2'
  end
end
