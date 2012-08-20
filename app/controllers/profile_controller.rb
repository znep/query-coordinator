class ProfileController < ApplicationController
  include BrowseActions
  skip_before_filter :require_user, :only => [:show, :show_app_token]

  helper :user

  def index
    redirect_to current_user.href
  end

  def show
    @port = request.port

    ### @createdOnDomain = Domain.findById(@user.data['createdOnDomainId'])

    prepare_profile
    return if @user.nil?
    # See if it matches the authoritative URL; if not, redirect
    if request.path != @user.href
      # Log redirects in development
      if Rails.env != 'production' &&
        request.path =~ /^\w{4}-\w{4}/
        logger.info("Doing a profile redirect from #{request.referrer}")
      end
      redirect_to(@user.href + '?' + request.query_string, :status => 301)
    end
    @app_tokens = @user.app_tokens

    browse_options = {
      browse_in_container: true,
      for_user: @user.id,
      nofederate: true,
      use_federations: false,
      sortBy: 'newest',
      ignore_params: [ :id, :profile_name ],
      view_type: 'table',
      row_count: 3
    }

    if params[:ownership] == 'sharedToMe'
      browse_options[:facets] = []
      browse_options[:sort_opts] = []
      browse_options[:limit] = 10
      browse_options[:page] = params[:page] || 1

      view_results = View.find_shared_to_user(@user.id,
                          {offset: (browse_options[:page].to_i - 1) * browse_options[:limit].to_i,
                            limit: browse_options[:limit]})
      browse_options[:view_results] = view_results['results']
      browse_options[:view_count] = view_results['count']
    else
      if @is_user_current
        browse_options[:publication_stage] = [ 'published', 'unpublished' ]

        vtf = view_types_facet
        vtf[:options].insert(1, {:text => 'Unpublished Datasets', :value => 'unpublished',
                             :class => 'typeUnpublished'})
        browse_options[:facets] = [vtf, categories_facet]
      else
        browse_options[:facets] = [view_types_facet, categories_facet]
      end

      topic_chop = get_facet_cutoff(:topic)
      user_tags = Tag.find({:method => 'ownedTags', :user_uid => @user.id}).data
      top_tags = user_tags.sort {|a,b| b[1] <=> a[1]}.slice(0, topic_chop).map {|t| t[0]}
      if !params[:tags].nil? && !top_tags.include?(params[:tags])
        top_tags.push(params[:tags])
      end
      top_tags = top_tags.sort.map {|t| {:text => t, :value => t}}
      tag_cloud = nil
      if user_tags.length > topic_chop
        tag_cloud = user_tags.sort {|a,b| a[0] <=> b[0]}.
          map {|t| {:text => t[0], :value => t[0], :count => t[1]}}
      end

      browse_options[:facets] << { :title => 'Topics',
        :singular_description => 'topic',
        :param => :tags,
        :options => top_tags,
        :extra_options => tag_cloud,
        :tag_cloud => true
      }
    end

    @processed_browse = process_browse(request, browse_options)
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
    @email_interests = EmailInterest.find_under_user
  end

  # Note: was AccountsController#edit
  def edit_account
    # redirect from generic to fully-qualified url
    expected_path = "#{current_user.href}/account"
    if request.path != expected_path
      return redirect_to(expected_path, :status => 301)
    end

    @user_links = UserLink.find(current_user.id)
    @app_tokens = current_user.app_tokens
    @email_interests = EmailInterest.find_under_user
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

        # In the case that they uncheck all of the interests, this hash is empty
        # We still want to delete everything.
        params[:email_interests] ||= {}
        previous_interests = EmailInterest.find_under_user
        to_delete = previous_interests.select do |interest|
          interest.extraInfo == '*' && !params[:email_interests][interest.eventTag]
        end
        to_create = []
        params[:email_interests].each do |k,v|
          if previous_interests.none? { |i| i.eventTag == k }
            to_create << k
          end
        end
        CoreServer::Base.connection.batch_request do
          to_delete.each { |interest| interest.delete(current_user.id) }
          to_create.each { |interest| EmailInterest.create(current_user.id, interest) }
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
    @email_interests = EmailInterest.find_under_user
  end

  def edit_app_tokens
    # redirect from generic to fully-qualified url
    # (for /profile/app_tokens support from dev.socrata.com)
    expected_path = "#{current_user.href}/app_tokens"
    if request.path != expected_path
      return redirect_to(expected_path, :status => 301)
    end

    @user_links = UserLink.find(current_user.id)
    @app_tokens = current_user.app_tokens
    @email_interests = EmailInterest.find_under_user
    @token = AppToken.new
  end

  def show_app_token
    prepare_profile
    return if @user.nil?
    @token = AppToken.find_by_id(params[:id], params[:token_id])
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
    @email_interests = EmailInterest.find_under_user
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
      unless ['image/png','image/x-png','image/gif','image/jpeg','image/pjpeg']
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

  def prepare_profile
    user_id = params[:id]
    begin
      if (!current_user || user_id != current_user.id)
        @is_user_current = false
        @user = User.find_profile(user_id)
      else
        @is_user_current = true
        @user = current_user
      end
    rescue CoreServer::ResourceNotFound
      flash.now[:error] = 'This user cannot be found, or has been deleted.'
      render 'shared/error', :status => :not_found
      return
    rescue CoreServer::CoreServerError => e
      if e.error_code == 'authentication_required'
        require_user(true)
        return
      elsif e.error_code == 'permission_denied'
        render_forbidden(e.error_message)
        return
      else
        flash.now[:error] = e.error_message
        render 'shared/error', :status => :internal_server_error
        return
      end
    end

    @current_state = {'user' => @user.id, 'domain' => CurrentDomain.cname}

    # Don't make a core server request for friends and followers every time
    unless @friends_rendered = read_fragment(app_helper.cache_key('profile-friends-list', @current_state))
      @followers = @user.followers
      @friends = @user.friends
    end

    @stat_displays = []

    # Also, we can probably make these _views vars local, not @ accessible
    unless (@view_summary_cached = read_fragment(app_helper.cache_key('profile-view-summary', @current_state)))
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
          Clytemnestra.search_views(base_req.merge(s[:params]), true)
        end
      end.each_with_index do |r, i|
        p = JSON.parse(r['response'], {:max_nesting => 25})
        @stat_displays << [stats[i][:name], p['count']]
      end
    end


  end
end

class AppHelper
  include Singleton
  include ApplicationHelper
end
