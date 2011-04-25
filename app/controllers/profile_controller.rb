class ProfileController < ApplicationController
  ssl_required :update_account, :edit_app_tokens, :edit_app_token, :delete_app_token
  include BrowseActions
  skip_before_filter :require_user, :only => [:show]

  helper :user

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
    unless @friends_rendered = read_fragment(app_helper.cache_key('profile-friends-list', @current_state))
      @followers = @user.followers
      @friends = @user.friends
    end

    @stat_displays = []

    # Also, we can probably make these _views vars local, not @ accessible
    unless (@view_summary_cached = read_fragment(app_helper.cache_key('profile-view-summary', @current_state))) ||
           (params[:_oldViews] == 'true')
      base_req = {:limit => 1, :for_user => @user.id, :nofederate => true}
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
        p = JSON.parse(r['response'], {:max_nesting => 25})
        @stat_displays << [stats[i][:name], p[0]['count']]
      end
    end

    @app_tokens = @user.app_tokens

    @browse_in_container = true
    @opts = {:for_user => @user.id, :nofederate => true}
    @default_params = {:sortBy => 'newest'}
    @use_federations = false
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

      user_tags = Tag.find({:method => 'ownedTags', :user_uid => @user.id}).data
      top_tags = user_tags.sort {|a,b| b[1] <=> a[1]}.slice(0, 5).map {|t| t[0]}
      if !params[:tags].nil? && !top_tags.include?(params[:tags])
        top_tags.push(params[:tags])
      end
      top_tags = top_tags.sort.map {|t| {:text => t, :value => t}}
      tag_cloud = nil
      if user_tags.length > 5
        tag_cloud = user_tags.sort {|a,b| a[0] <=> b[0]}.
          map {|t| {:text => t[0], :value => t[0], :count => t[1]}}
      end

      @facets << { :title => 'Topics',
        :singular_description => 'topic',
        :param => :tags,
        :options => top_tags,
        :extra_options => tag_cloud
      }

      if !params[:tags].nil? || !params[:category].nil? || !params[:q].nil?
        @default_params.delete(:limitTo)
      end
    end
    params.delete(:id)
    params.delete(:profile_name)
    process_browse!
  end

  def update
    error_msg = nil
    if params[:user]
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

      if (params[:user][:screenName].empty?)
        flash.now[:error] = "Error: 'Display Name' is required"
        @user_links = UserLink.find(current_user.id)
        return (render 'profile/edit')
      end
    end

    accessible_image_change(current_user.profile_image_path(''))

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

    if params[:user]
      begin
        current_user.update_attributes!(params[:user])
      rescue CoreServer::CoreServerError => e
        is_error = true
        error_msg = e.error_message
      end
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
    @app_tokens = current_user.app_tokens
  end

  # Note: was AccountsController#edit
  def edit_account
    @user_links = UserLink.find(current_user.id)
    @app_tokens = current_user.app_tokens
  end

  def update_account
    if params[:user].present? || params[:openid_delete].present?
      error_msg = nil
      begin
        if params[:user][:password_new].present?
          if params[:user][:password_new] != params[:user][:password_confirm]
            error_msg = "New passwords do not match"
          else
            @current_user = current_user.update_password(
              {:newPassword => params[:user][:password_new],
               :password => params[:user][:password_old]})
          end
        end
        if params[:openid_delete].present?
          if current_user.flag?('nopassword') &&
            params[:openid_delete].size >= current_user.openid_identifiers.size
            error_msg = "You cannot remove all your OpenID identifiers before you set a password"
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

        # update other attributes
        updated_attributes = {}
        if params[:user][:email].present?
          if params[:user][:email] != params[:user][:email_confirm]
            error_msg = "New emails do not match"
          else
            updated_attributes.merge!(
                {:email => params[:user][:email],
                  :password => params[:user][:email_password]})
          end
        end
        if params[:user][:email_subscribe].present? && current_user.emailUnsubscribed
          updated_attributes[:emailUnsubscribed] = false
        elsif !params[:user][:email_subscribe].present? && !current_user.emailUnsubscribed
          updated_attributes[:emailUnsubscribed] = true
        end
        current_user.update_attributes!(updated_attributes) unless updated_attributes.empty?
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
    @app_tokens = current_user.app_tokens
  end

  def edit_app_tokens
    # redirect from generic to fully-qualified url
    # (for /profile/app_tokens support from dev.socrata.com)
    expected_path = "#{current_user.href}/app_tokens"
    if request.path != expected_path
      redirect_to(expected_path, :status => 301)
    end

    @user_links = UserLink.find(current_user.id)
    @app_tokens = current_user.app_tokens
    @token = AppToken.new
  end

  def edit_app_token
    token_params = params[:app_token]
    if token_params
      token_params[:public] = (token_params[:public] == 'on')
    end
    if params[:token_id] == 'new'
      begin
        @token = AppToken.create(params[:id], token_params)
        flash.now[:notice] = "Your application has been created"
      rescue CoreServer::CoreServerError => e
        flash.now[:error] = "An error occured creating your application token: #{e.error_message}"
        if @token.nil?
          @token = Hashie::Mash.new(token_params)
        end
      end
    else
      if token_params
        begin
          @token = AppToken.update(params[:id], params[:token_id], token_params)
          accessible_image_change(@token.set_thumbnail_url(current_user.id))
          @token = AppToken.find_by_id(params[:id], params[:token_id])
        rescue CoreServer::CoreServerError => e
          flash.now[:error] = e.error_message
          @token = AppToken.find_by_id(params[:id], params[:token_id])
        end
        flash.now[:notice] = "Your application was successfully saved"
      else
        @token = AppToken.find_by_id(params[:id], params[:token_id])
      end
    end
    @user_links = UserLink.find(current_user.id)
  end

  def delete_app_token
    begin
      AppToken.delete(params[:id], params[:token_id])
    rescue CoreServer::CoreServerError => e
      flash[:error] = "An error occured deleting your application: #{e.error_message}"
      return(redirect_to(:action => :edit_app_tokens))
    end
    flash[:notice] = "Your application has been deleted"
    redirect_to :action => :edit_app_tokens
  end

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

  # Pipe the file upload back to the core server
  def accessible_image_change(post_url)
    if params[:new_image]
      unless ['image/png','image/gif','image/jpeg']
        .include? params[:new_image].content_type
        flash[:error] = "Please select a valid image type (PNG, JPG, or GIF)"
        return
      end
      begin
        resp = CoreServer::Base.connection.multipart_post_file(
          post_url, params[:new_image])
        flash[:notice] = "Your image has been updated"
      rescue => ex
        flash[:error] = "Error uploading new image: #{ex.message}"
      end
    end
  end
end

class AppHelper
  include Singleton
  include ApplicationHelper
end
