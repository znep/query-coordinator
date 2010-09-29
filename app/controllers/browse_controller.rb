class BrowseController < ApplicationController
  skip_before_filter :require_user
  include BrowseActions

  def show
    process_browse!
  end
end
