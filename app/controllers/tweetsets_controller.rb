class TweetsetsController < ApplicationController
  include HoptoadNotifier::Catcher
  skip_before_filter :require_user, :only => [:index]
  
  def index
    tweetset_user = APP_CONFIG['tweetsets_user']
    
    # Fetch tweetsets from Core Server, newest first
    begin
      @recent_sets = View.find_for_user(tweetset_user).select{|v| v.tags && 
        v.tags.any? {|t| t.data == 'tweetset'} &&
        v.flags.any? {|f| f.data == 'schemaPublic'} }.sort{|a, b| b.createdAt <=> a.createdAt}
    rescue
      notify_hoptoad "Error searching for tweetets: No user with id #{tweetset_user} exists."
    end
    
    # Look for sets tagged 'example' to show up on the front page
    example_sets = @recent_sets.select{|v| v.tags.any? {|t| t.data == 'example'}}
    example_view = example_sets.first unless example_sets.blank?
    
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
    if href
      redirect_to(href)
      return
    end
  
    view_name = params[:tweetsetName] || "Socrata #{query} tweetset"
    begin
      resulting_id = CoreServer::Base.connection.create_tweetset(query, view_name)
      @created = true
    rescue
      RAILS_DEFAULT_LOGGER.error "Error creating set!"
    end
    
    render :action => :index
  end
  
  private

    def check_existing_tweetset(search)
      begin
        # Searching for multiple tags does an OR not an AND
        existing_sets = View.find_filtered(:tags => [search]).select do |v|
          v.owner.displayName == APP_CONFIG['tweetsets_user'] && v.tags && v.tags.any? {|t| t.data == 'tweetset'}
        end
      rescue
        return nil
      end
      # TODO: Do we want to do something more complicated than just redir them to the dataset?
      existing_sets.first.href unless existing_sets.blank?
    end

end