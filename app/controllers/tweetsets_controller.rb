class TweetsetsController < ApplicationController
  skip_before_filter :require_user, :only => [:index]
  
  def index
    unless session[:tweetset].nil?
      @message =  "Found a tweetset with that query already: " + session[:tweetset].name
      session[:tweetset] = nil
    end
    
    tweetset_user = APP_CONFIG['tweetsets_user']
    
    # Fetch tweetsets from Core Server, newest first
    begin
      @recent_sets = View.find_for_user(tweetset_user).select{|v| v.tags && 
        v.tags.any? {|t| t.data == 'tweetset'}}.sort{|a, b| b.createdAt <=> a.createdAt}
    rescue
      RAILS_DEFAULT_LOGGER.error "No user with id #{tweetset_user} exists"
    end
    
    # We'll use the oldest one as the example
    example_view = @recent_sets.last unless @recent_sets.blank?
    
    @example_set = "/widgets/#{example_view.id}" unless example_view.nil?
    @example_width = 740
    @example_height = 500
    
    # How many 'recent tweetsets' to show
    @recent_limit = 10
  end
  
  def create
    query = params[:query]   

    # Redirect them to the existing one if somebody's performed the query already
    href = check_existing_tweetset(query)

    unless href
      view_name = params[:tweetsetName] || "Socrata #{query} tweetset"
      begin
        resulting_id = CoreServer::Base.connection.create_tweetset(query, view_name)
      end
    end

    redirect_to href || {:action => :index}
  end
  
  def check_existing_tweetset(search)
    begin
      # TODO: Change this to search by tags, or use new core server search option?
      existing_sets = View.find_for_user(APP_CONFIG['tweetsets_user']).select{|v| v.tags && 
        v.tags.any? {|t| t.data == search}}
    rescue
      return nil
    end
    # TODO: Do we want to do something more complicated than just redir them to the dataset?
    existing_sets[0].href unless existing_sets.nil? || existing_sets.empty?
  end

end