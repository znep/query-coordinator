class SearchesController < ApplicationController
  include BrowseController

  def show
    process_browse!

    render :layout => 'dataset_v2'
  end
end
