class HomepageController < ApplicationController
  before_filter :check_lockdown, :only => [:show]
  skip_before_filter :require_user
  include BrowseActions

  def check_lockdown
    if CurrentDomain.feature? :staging_lockdown
      if current_user.nil?
        return require_user(true)
      elsif !CurrentDomain.member?(current_user)
        return render_forbidden
      end
    end
  end

  def show
    # process stories only if not already rendered
    unless !CurrentDomain.templates['data_splash'].nil? ||
        (@stories_cached = read_fragment(app_helper.cache_key(
          'homepage-stories', { 'domain' => CurrentDomain.cname })))
      @stories = Story.find.sort
    end

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
      process_browse!(:force_default => true)
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
