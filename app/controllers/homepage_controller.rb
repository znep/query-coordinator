class HomepageController < ApplicationController
  include BrowseController

  def show
    process_browse!
  end
end
