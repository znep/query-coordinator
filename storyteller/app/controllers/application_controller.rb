class ApplicationController < ActionController::Base
  include UserAuthorizationHelper
  include FeaturesHelper
  include LocaleHelper

  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  # Expose helper_methods for use in all views
  helper_method :current_user, :current_domain, :current_user_story_authorization, :downtimes

  prepend_before_filter :set_story_uid
  before_filter :handle_authorization

  # If the request is coming from the Internet at large,
  # force SSL. Otherwise, allow plain HTTP (so inter-service
  # connections can still use HTTP).
  def self.force_ssl_for_internet_requests
    force_ssl if: :is_plain_http_from_public_internet?
  end

  # Returns true if the request appears to be a PLAIN HTTP
  # request originating from the public Internet.
  def is_plain_http_from_public_internet?
    request.headers['HTTP_X_FORWARDED_PROTO'] == 'http'
  end

  # Returns the current user, or nil
  #
  # ==== Examples
  #   current_user  # with valid cookies
  #   => {"id"=>"tugg-ikce", "createdAt"=>1425577015, "displayName"=>"cspurgeon", etc }
  #   current_user  # with invalid cookies
  #   => nil
  def current_user_json
    @current_user ||= env[SocrataSession::SOCRATA_SESSION_ENV_KEY].authenticate(env)
  end
  alias :current_user :current_user_json

  # Returns the current domain, or nil
  def current_domain
    @current_domain ||= CoreServer.current_domain
  end

  def current_user_story_authorization
    @current_user_story_authorization ||= CoreServer.current_user_story_authorization
  end

  def disable_site_chrome?
    false
  end

  def setup_site_chrome_prerequisites
    # site_chrome expects current_user and current_domain to be in place
    # to identify proper render states.
    ::RequestStore.store[:current_user] ||= current_user
    ::RequestStore.store[:current_domain] ||= current_domain['cname']

    # site_chrome also expects I18n.locale to be correct, using the path param
    # if provided or else the domain default
    I18n.locale = current_locale
  end

  def downtimes
    @downtimes ||= StorytellerService.downtimes
  end

  def ssl_disabled?
    Rails.env.test?
  end

  def render_story_404
    @status = 404
    @title = I18n.t('error_pages.stories_404.title')
    @description = I18n.t('error_pages.stories_404.description')

    respond_to do |format|
      format.json do
        render status: @status, json: { status: @status.to_s, error: @title }
      end
      format.html do
        render 'errors/show', status: @status, layout: 'error'
      end
      format.any do
        render 'errors/show', status: @status, layout: 'error', formats: [:html], content_type: 'text/html'
      end
    end
  end

  # +before_filter+
  def set_story_uid
    ::RequestStore.store[:story_uid] = params['uid']
  end

  # +before_filter+
  def handle_authorization
    controller = params[:controller]

    case controller
      when 'admin/themes'
        require_sufficient_rights_for_admin_themes
      when 'api/stat/v1/goals/permissions'
        require_sufficient_rights_for_api_stat_goals_permissions
      when 'api/stat/v1/goals/published'
        require_sufficient_rights_for_api_stat_goals_published
      when 'api/stat/v1/goals/drafts'
        require_sufficient_rights_for_api_stat_goals_drafts
      when 'api/stat/v3/goals'
        require_sufficient_rights_for_api_stat_goals
      when 'api/v1/documents'
        require_sufficient_rights_for_api_documents
      when 'api/v1/drafts'
        require_sufficient_rights_for_api_drafts
      when 'api/v1/getty_images'
        require_sufficient_rights_for_api_getty_images
      when 'api/v1/permissions'
        require_sufficient_rights_for_api_permissions
      when 'api/v1/published'
        require_sufficient_rights_for_api_published
      when 'api/v1/uploads'
        require_sufficient_rights_for_api_uploads
      when 'consul_checks'
        require_sufficient_rights_for_consul_checks
      when 'errors'
        true
      when 'license_check'
        require_sufficient_rights_for_license_checks
      when 'post_login'
        require_sufficient_rights_for_post_login
      when 'stat/goals'
        require_sufficient_rights_for_goals
      when 'stories'
        require_sufficient_rights_for_stories
      when 'themes'
        require_sufficient_rights_for_themes
      when 'version'
        require_sufficient_rights_for_version
      when 'health'
        require_sufficient_rights_for_health
      else
        raise_undefined_authorization_handler_error
    end
  end

  private

  def handle_unauthorized_request
    if params[:format] == 'json'
      head :unauthorized
    else
      redirect_to_login_and_return
    end
  end

  def redirect_to_login_and_return
    redirect_to "/login?return_to=#{Rack::Utils.escape(request.fullpath)}"
  end

  def assert_can_edit_story
    render nothing: true, status: 403 unless can_edit_story?
  end

  def assert_can_write_documents
    render nothing: true, status: 403 unless can_write_documents?
  end

  def require_logged_in_user
    # If no current_user:
    # - for JSON requests, respond with 401.
    # - for other requests, redirect to login.
    unless current_user.present?
      handle_unauthorized_request
    end
  end

  def require_super_admin_user
    unless current_user.try(:[], 'flags').try(:include?, 'admin')
      redirect_to_login_and_return
    end
  end

  def login_then_redirect_to_highest_privilege
    if current_user.present?
      if can_edit_story?
        redirect_to :action => :edit
      elsif can_view_unpublished_story?
        redirect_to :action => :preview
      else
        redirect_to :action => :show
      end
    else
      redirect_to_login_and_return
    end
  end

  def raise_undefined_authorization_handler_error
    controller = params[:controller]
    action = params[:action]

    raise StandardError.new(
      "Undefined authorization handler for controller `#{controller}` and action `#{action}`."
    )
  end

  def require_sufficient_rights_for_admin_themes
    action = params[:action]

    case action
      when 'index'
        require_super_admin_user
      when 'new'
        require_super_admin_user
      when 'edit'
        require_super_admin_user
      when 'create'
        require_super_admin_user
      when 'update'
        require_super_admin_user
      when 'destroy'
        require_super_admin_user
      else
        raise_undefined_authorization_handler_error
    end
  end

  def require_sufficient_rights_for_api_documents
    action = params[:action]

    case action
      when 'show'
        require_logged_in_user
      when 'create'
        assert_can_write_documents
      when 'crop'
        assert_can_write_documents
      else
        raise_undefined_authorization_handler_error
    end
  end

  def require_sufficient_rights_for_api_drafts
    action = params[:action]

    if current_user.present?

      case action
        when 'create'
          assert_can_edit_story
        when 'latest'
          return render nothing: true, status: 403 unless can_view_unpublished_story?
        else
          raise_undefined_authorization_handler_error
      end
    else
      handle_unauthorized_request
    end
  end

  def require_sufficient_rights_for_api_getty_images
    action = params[:action]

    if current_user.present?
      case action
        when 'show'
          # Silence is golden.
        when 'search'
          require_logged_in_user
        else
          raise_undefined_authorization_handler_error
      end
    else
      if action != 'show'
        handle_unauthorized_request
      end
    end
  end

  def require_sufficient_rights_for_api_permissions
    action = params[:action]

    case action
      when 'update'
        if current_user.present?
          return render nothing: true, status: 403 unless has_domain_right?('edit_others_stories') || owner?
        else
          handle_unauthorized_request
        end
      else
        raise_undefined_authorization_handler_error
    end
  end

  def require_sufficient_rights_for_api_published
    action = params[:action]

    case action
      when 'latest'
        return render_story_404 if CoreServer.view_inaccessible?(params[:uid])
      when 'create'
        if current_user.present?
          return render nothing: true, status: 403 unless has_domain_right?('edit_others_stories') || owner?
        else
          handle_unauthorized_request
        end
      else
        raise_undefined_authorization_handler_error
    end
  end

  def require_sufficient_rights_for_api_uploads
    action = params[:action]

    case action
      when 'create'
        require_logged_in_user
      else
        raise_undefined_authorization_handler_error
    end
  end

  def require_sufficient_rights_for_api_stat_goals_permissions
    action = params[:action]

    case action
      when 'update'
        render nothing: true, status: 403 unless can_edit_goals?
      else
        raise_undefined_authorization_handler_error
    end
  end

  def require_sufficient_rights_for_api_stat_goals_published
    action = params[:action]
    uid = params[:uid]

    case action
      when 'latest'
        return render nothing: true, status: 403 if goal_unauthorized?(uid)
        return render nothing: true, status: 404 unless can_view_goal?(uid)
      when 'create'
        render nothing: true, status: 403 unless can_edit_goals?
      else
        raise_undefined_authorization_handler_error
    end
  end

  def require_sufficient_rights_for_api_stat_goals_drafts
    action = params[:action]
    uid = params[:uid]

    return render nothing: true, status: 403 if goal_unauthorized?(uid)
    return render nothing: true, status: 404 unless can_view_goal?(uid)

    case action
      when 'latest', 'create'
        render nothing: true, status: 403 unless can_edit_goals?
      else
        raise_undefined_authorization_handler_error
    end
  end

  def require_sufficient_rights_for_api_stat_goals
    render nothing: true, status: 403 unless can_edit_goals?
  end

  def require_sufficient_rights_for_consul_checks
    action = params[:action]

    case action
      when 'active'
        # pass
      else
        raise_undefined_authorization_handler_error
    end
  end

  def require_sufficient_rights_for_post_login
    require_logged_in_user
  end

  def require_sufficient_rights_for_stories
    action = params[:action]
    from_collaboration_email = params[:from_collaboration_email]
    story_uid = params[:uid]

    # This param is set in the link provided to users who receive a collaboration request
    # via email. In this case, we want to redirect them to the most privileged action they
    # have access to.
    if from_collaboration_email
      login_then_redirect_to_highest_privilege
    else

      if current_user.present?

        # always check that the user has access to the 4x4
        return render_story_404 unless CoreServer.view_accessible?(story_uid)

        # If that passes, check additional storyteller-specific
        # permission rules.
        case action
          when 'show'
            #pass
          when 'preview'
            render_story_404 unless can_view_unpublished_story?
          when 'tile'
            # pass
          when 'new'
            render_story_404 unless can_create_story?
          when 'create'
            render_story_404 unless can_create_story?
          when 'about'
            #pass
          when 'copy'
            render text: 'It seems that you don\'t have access to do that. Sorry!', status: 403 unless can_make_copy?
          when 'edit'
            render_story_404 unless can_edit_story?
          when 'stats'
            render_story_404 unless can_see_story_stats?
          else
            raise_undefined_authorization_handler_error
        end
      else
        if action != 'show' && action != 'tile'
          handle_unauthorized_request
        elsif CoreServer.view_inaccessible?(story_uid)
          render_story_404
        end
      end
    end
  end

  def require_sufficient_rights_for_goals
    action = params[:action]
    goal_uid = params[:uid]

    # User always needs permission to view goal.
    # Defer to Procrustes/Odysseus.
    return handle_unauthorized_request if goal_unauthorized?(goal_uid)
    return render_story_404 unless can_view_goal?(goal_uid)

    if current_user.present?
      case action
        when 'show'
          # Above checks sufficient.
        when 'edit', 'preview', 'copy'
          render_story_404 unless can_edit_goals?
        else
          raise_undefined_authorization_handler_error
      end
    else
      # Only anonymous action is 'show'
      handle_unauthorized_request unless action == 'show'
    end
  end

  def require_sufficient_rights_for_themes
    action = params[:action]

    case action
      when 'custom'
        # pass
      else
        raise_undefined_authorization_handler_error
    end
  end

  def require_sufficient_rights_for_version
    action = params[:action]

    case action
      when 'show'
        # pass
      else
        raise_undefined_authorization_handler_error
    end
  end

  def require_sufficient_rights_for_health
    action = params[:action]

    case action
      when 'show'
        # pass
      else
        raise_undefined_authorization_handler_error
    end
  end

  def require_sufficient_rights_for_license_checks
    action = params[:action]

    case action
      when 'user_has_stories_rights?'
        require_logged_in_user # TODO: double-check this
      else
        raise_undefined_authorization_handler_error
    end
  end
end
