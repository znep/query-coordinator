class TestPagesController < ApplicationController
  include BrowseController

  def index
    @actions = action_methods
  end

  def js_kaboom
  end

  def kaboom
    throw Exception.new
  end

  def browse
    process_browse!

    render :layout => 'dataset_v2'
  end
end
