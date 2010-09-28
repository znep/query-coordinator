class BrowseController < ApplicationController
  include BrowseActions

  def show
    process_browse!
  end
end
