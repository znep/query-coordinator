class TweetsetsController < ApplicationController
  skip_before_filter :require_user, :only => [:index]
  
  def index
    unless session[:tweetset].nil?
      @message =  "Results for: " + session[:tweetset]
      session[:tweetset] = nil
    end
    
    # HACK: Find a view owned by 'tweetset' user
    user_id = (RAILS_ENV == 'development' ? 'w7mt-88wc' : 't8gi-ckxx')
   
    # Fetch tweetsets from Core Server
    begin
      @recent_sets = View.find_for_user(user_id).select{|v| v.tags && 
        v.tags.any? {|t| t.data == 'tweetset'}}.sort{|a, b| b.createdAt <=> a.createdAt}
    rescue
      @message = "DEBUG: No user with id #{user_id} exists"
    end
    
    example_view = @recent_sets.last unless @recent_sets.nil? || @recent_sets.empty?
    
    @example_set = "/widgets/#{example_view.id}" unless example_view.nil?
    @example_width = 740
    @example_height = 500
    
    # How many 'recent tweetsets' to show
    @recent_limit = 10
  end
  
  def create
    query = params[:query]   
    view_name = "Socrata #{params[:query]} tweetset"
    
    # TODO: Make a core server request to create this set
    session[:tweetset] = query

    respond_to do |format|
      format.html { redirect_to :action => :index }
    end
  end

end