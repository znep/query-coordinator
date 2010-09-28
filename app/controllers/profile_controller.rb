class ProfileController < ApplicationController
  include BrowseController
# TODO/v4: remove v4_show
  skip_before_filter :require_user, :only => [:show, :v4_show]
  
  helper :user

# TODO/v4: remove me
  layout :choose_v4_layout
  include NewChromeMethodProxy

  def index
    redirect_to current_user.href
  end

  def show
    @port = request.port
    user_id = params[:id]
    if (!current_user || user_id != current_user.id)
      @is_user_current = false
      @user = User.find_profile(user_id)
    else
      @is_user_current = true
      @user = current_user
    end

    ### @createdOnDomain = Domain.findById(@user.data['createdOnDomainId'])

    # See if it matches the authoritative URL; if not, redirect
    if request.path != @user.href
      # Log redirects in development
      if Rails.env != 'production' &&
        request.path =~ /^\w{4}-\w{4}/
        logger.info("Doing a profile redirect from #{request.referrer}")
      end
      redirect_to(@user.href + '?' + request.query_string, :status => 301)
    end

    @current_state = {'user' => @user.id, 'domain' => CurrentDomain.cname}

    # Don't make a core server request for friends and followers every time
    # TODO/v4: Remove the module check, this is just for backwards compat
    unless !CurrentDomain.module_available?(:new_datasets_page) || \
        @friends_rendered = read_fragment( \
          app_helper.cache_key('profile-friends-list', @current_state))
      @followers = @user.followers
      @friends = @user.friends
    end

    # TODO/v4: Remove this stuff
    @body_id = 'profileBody'
    if @is_user_current
      @body_class = 'home'
    else
      @body_class = 'community'
    end

    @stat_displays = []
    # TODO/v4: Remove the module check, this is just for backwards compat
    # Also, we can probably make these _views vars local, not @ accessible
    unless !CurrentDomain.module_available?(:new_datasets_page) || \
        @view_summary_cached = read_fragment( \
          app_helper.cache_key('profile-view-summary', @current_state)) || \
          params[:_oldViews] == 'true'

      base_req = {:limit => 1, :for_user => @user.id}
      stats = [
        {:params => {:datasetView => 'dataset'}, :name => 'Datasets'},
        {:params => {:limitTo => 'tables', :datasetView => 'view'},
          :name => 'Filtered Views'},
        {:params => {:limitTo => 'charts'}, :name => 'Charts'},
        {:params => {:limitTo => 'maps'}, :name => 'Maps'},
        {:params => {:limitTo => 'calendars'}, :name => 'Calendars'},
        {:params => {:limitTo => 'forms'}, :name => 'Forms'}
      ]
      CoreServer::Base.connection.batch_request do
        stats.each do |s|
          SearchResult.search('views', base_req.merge(s[:params]), true)
        end
      end.each_with_index do |r, i|
        p = JSON.parse(r['response'])
        @stat_displays << [stats[i][:name], p[0]['count']]
      end
    end

    unless !CurrentDomain.module_available?(:new_datasets_page)
      @browse_in_container = true
      @opts = {:for_user => @user.id}
      @default_params = {:sortBy => 'newest', :limitTo => 'datasets'}
      # Special param to use the /users/4-4/views.json call instead of the
      # search service.  For users with lots of views, this will be slow, and
      # it doesn't allow sort/filter/search; but it doesn't require
      # the Cassandra search service
      if params[:_oldViews] == 'true'
        @facets = []
        @sort_opts = []
        @view_results = View.find_for_user(@user.id)
        @view_count = @view_results.length
        @limit = @view_count
      elsif params[:ownership] == 'sharedToMe'
        @facets = []
        @sort_opts = []
        @view_results = View.find_shared_to_user(@user.id)
        @view_count = @view_results.length
        @limit = @view_count
      else
        @facets = [view_types_facet, categories_facet]
      end
      process_browse!
    end

    @user_links = UserLink.find(@user.id)
    # TODO/v4: Do we still want this?
    @welcome = params[:welcome] == 'true'
  end

  def update
    error_msg = nil
    if (params[:user][:country] && params[:user][:country].upcase != 'US' ||
       params[:user][:state] == '--')
      params[:user][:state] = nil
    end
    if (params[:user][:country] == '--')
      params[:user][:country] = nil
    end
    # For now, force setting of tags; they get deleted otherwise
    if (params[:user][:tags].nil?)
      params[:user][:tags] = current_user.tag_display_string
    end

    unless params[:links].nil?
      user_links = UserLink.find(current_user.id)

      begin
        user_links.each do |link|
          updated_link = params[:links][link.id.to_s.to_sym]
          next if updated_link.nil?

          if (updated_link[:linkType].blank? || updated_link[:url].blank?)
            UserLink.delete(current_user.id, link.id)
          else
            UserLink.update(current_user.id, link.id, updated_link)
          end

          params[:links].delete(link.id.to_s.to_sym)
        end

        params[:links].each do |id, new_link|
          UserLink.create(current_user.id, new_link) unless (new_link.nil? || \
            new_link[:linkType].blank? || new_link[:url].blank?)
        end
      rescue CoreServer::CoreServerError => e
        is_error = true
        error_msg = "There was a problem updating your links. #{e.error_message}"
      end
    end

    begin
      current_user.update_attributes!(params[:user])
    rescue CoreServer::CoreServerError => e
      is_error = true
      error_msg = e.error_message
    end

    respond_to do |format|
      format.html do
        if is_error
          flash.now[:error] = error_msg
          return (render 'shared/error', :status => :forbidden)
        else
          flash[:notice] = "Your profile has been successfully updated."
          redirect_to(current_user.href)
        end
      end
      format.data { render :json => {:error => error_msg,
        :user => current_user} }
    end
  end

  def edit
    @user_links = UserLink.find(current_user.id)
  end

  # Note: was AccountsController#edit
  def edit_account
    @user_links = UserLink.find(current_user.id)

    # TODO/v4: Remove me when this becomes default
    render :layout => 'dataset_v2'
  end

  def update_account
    if params[:user].present? || params[:openid_delete].present?
      error_msg = nil
      begin
        if params[:openid_delete].present?
          if current_user.flag?('nopassword') &&
            params[:openid_delete].size >= current_user.openid_identifiers
            error_msg = "You cannot remove all your OperID identifiers before you set a password"
          else
            CoreServer::Base.connection.batch_request do
              params[:openid_delete].each do |k, v|
                delete_path = params[:openid_delete_paths][k]
                if delete_path.nil?
                  Rails.logger.warn("Got request to delete OpenID identifier for user #{current_user.id}, identifier: #{k}")
                else
                  CoreServer::Base.connection.delete_request(delete_path)
                end
              end
            end
          end
        end
        if params[:user][:email].present?
          if params[:user][:email] != params[:user][:email_confirm]
            error_msg = "New emails do not match"
          else
            current_user.update_attributes!(
                {:email => params[:user][:email],
                  :password => params[:user][:email_password]})
          end
        if params[:user][:password_new].present?
          if params[:user][:password_new] != params[:user][:password_confirm]
            error_msg = "New passwords do not match"
          else
            current_user.update_password(
                {:newPassword => params[:user][:password_new],
                  :password => params[:user][:password_old]})
          end
        end
      end
      rescue CoreServer::CoreServerError => e
        error_msg = e.error_message
      end
      if !error_msg.nil?
        flash[:error] = error_msg
      else
        flash[:notice] = "Your profile has been successfully updated."
      end
    end
    redirect_to "#{current_user.href}/account"
  end

  def edit_image
    @user_links = UserLink.find(current_user.id)
    #TODO/v4: Remove me when this becomes default
    render :layout => 'dataset_v2'
  end

  # TODO/v4: remove these three _link functions
  def create_link
    @user_link = UserLink.create(params[:id], params[:link])

    respond_to do |format|
      format.html { redirect_to(current_user.href) }
      format.data { render }
    end
  end

  def delete_link
    UserLink.delete(params[:id], params[:link_id])

    respond_to do |format|
      format.html { redirect_to(current_user.href) }
      format.data { render :json => {:link_id => params[:link_id]} }
    end
  end

  def update_link
    @user_link = UserLink.update(params[:id], params[:link_id], params[:link])

    respond_to do |format|
      format.html { redirect_to(current_user.href) }
      format.data { render :action => "create_link" }
    end
  end

  # We still need these for v4 accessible version
  def create_friend
    user_id = params[:id]
    if user_id != current_user.id
      user = { :id => user_id }
      Contact.create(user)
    end

    respond_to do |format|
      format.html { redirect_to(profile_path(user_id)) }
      format.data { render :text => "created" }
    end
  end

  def delete_friend
    user_id = params[:id]
    Contact.delete(user_id)

    respond_to do |format|
      format.html { redirect_to(current_user.href) }
      format.data { render :text => "deleted" }
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
