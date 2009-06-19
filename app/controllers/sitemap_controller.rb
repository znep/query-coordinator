class SitemapController < ApplicationController

  skip_before_filter :require_user
  caches_page :index, :users, :datasets

  # Individual map pages must be under 50k entries AND 10 MB Use a lower
  # number of entries per page to make sure we don't exceede the size limit.
  @@page_size = 10000

  # Figure out how many sub-sitemap pages we'll need, so that we can
  # generate a sitemap index file that links to them all.
  def index
    num_users = User.find({:count => true}).count
    num_datasets = View.find_filtered({:count => true}).count
    @user_pages = (Float(num_users)/@@page_size).ceil
    @dataset_pages = (Float(num_datasets)/@@page_size).ceil
    headers["Last-Modified"] = Time.now.to_s
    render :layout => false
  end

  # Get a pages worth of the list of users.  Also define functions to pull
  # out the necessary info for a user.  The url and lastmod time are
  # required, but changefreq and priority can be left undefined if we don't
  # need/want them.
  def users
    @elements = User.find({:sort_by=>"LAST_LOGGED_IN", :isAsc=>false})\
                    .slice(params[:page].to_i * @@page_size, @@page_size)
    @url_accessor = lambda {|user| profile_url(:id => user.id,
                                               :only_path => false)}
    @lastmod_accessor = lambda {|user| Time.at user.lastLogin}
    #@changefreq_accessor = lambda {|user| "weekly"}
    #@priority_accessor = lambda {|user| "0.5"}
    headers["Last-Modified"] = Time.now.to_s
    render :sitemap, :layout => false
  end

  # Get a pages worth of the list of users.  Also define functions to pull
  # out the necessary info for a user.  The url and lastmod time are
  # required, but changefreq and priority can be left undefined if we don't
  # need/want them.
  def datasets
    @elements = View.find_filtered({:sort_by=>"LAST_CHANGED", :isAsc=>false})\
                    .slice(params[:page].to_i * @@page_size, @@page_size)
    # Assembling the URL ourselves this way is sub-optimal, but we need for
    # using View.href to get the (relative, but at least) properly pretty URL.
    @url_accessor = lambda {|dataset| request.protocol + request.host \
                                      + ":" + request.port.to_s + dataset.href}
                                   # View.href(...)
    @lastmod_accessor = lambda {|dataset| Time.at dataset.last_activity}
    #@changefreq_accessor = lambda {|dataset| "daily"}
    #@priority_accessor = lambda {|dataset| "0.8"}
    headers["Last-Modified"] = Time.now.to_s
    render :sitemap, :layout => false
  end
end
