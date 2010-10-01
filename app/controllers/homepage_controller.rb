class HomepageController < ApplicationController
  skip_before_filter :require_user
  include BrowseActions

  def show
    # process featured views only if not already rendered
    unless CurrentDomain.featured_views.nil? ||
        (@featured_cached = read_fragment(app_helper.cache_key(
          'homepage-featured', { 'domain' => CurrentDomain.cname })))

      @view_urls = {}
      View.find_multiple(CurrentDomain.featured_views.map{ |f| f.viewId}).
           each{ |view| @view_urls[view.id] = view.href }
    end

    # process browse only if not already rendered
    unless (@browse_cached = read_fragment(app_helper.cache_key(
        'homepage-browse', { 'domain' => CurrentDomain.cname })))
      # move to /browse on interaction
      @base_url = browse_path

      @no_results_text = 'No Datasets Yet'
      process_browse!
    end
  end

private
  # Need an instance for using cache_key()
  def app_helper
    AppHelper.instance
  end
end

class AppHelper
  include Singleton
  include ApplicationHelper
end
