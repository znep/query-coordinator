class ApplicationController < ActionController::Base
  include UserAuthorizationHelper

  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  # Expose helper_methods for use in all views
  helper_method :current_user, :current_user_story_authorization

  prepend_before_filter :set_story_uid
  before_filter :handle_authorization

  # Returns the current user, or nil
  #
  # ==== Examples
  #   current_user  # with valid cookies
  #   => {"id"=>"tugg-ikce", "createdAt"=>1425577015, "displayName"=>"cspurgeon", etc }
  #   current_user  # with invalid cookies
  #   => nil
  def current_user
    @current_user = env[SocrataSession::SOCRATA_SESSION_ENV_KEY].authenticate(env)
  end

  def current_user_story_authorization
    @current_user_story_authorization = CoreServer.current_user_story_authorization
  end

  def ssl_disabled?
    Rails.env.test?
  end

  def render_404
    respond_to do |format|
      format.html { render 'stories/404', layout: '404', status: 404 }
      format.json { render json: {error: '404 Not Found'}, status: 404 }
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
      when 'admin/site_chromes'
        require_sufficient_rights_for_admin_site_chromes
      when 'admin/themes'
        require_sufficient_rights_for_admin_themes
      when 'api/v1/documents'
        require_sufficient_rights_for_api_documents
      when 'api/v1/drafts'
        require_sufficient_rights_for_api_drafts
      when 'api/v1/permissions'
        require_sufficient_rights_for_api_permissions
      when 'api/v1/published'
        require_sufficient_rights_for_api_published
      when 'api/v1/uploads'
        require_sufficient_rights_for_api_uploads
      when 'consul_checks'
        require_sufficient_rights_for_consul_checks
      when 'post_login'
        require_sufficient_rights_for_post_login
      when 'stories'
        require_sufficient_rights_for_stories
      when 'themes'
        require_sufficient_rights_for_themes
      when 'version'
        require_sufficient_rights_for_version
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

  def require_sufficient_rights_for_admin_site_chromes
    action = params[:action]

    case action
      when 'edit'
        require_super_admin_user
      when 'update'
        require_super_admin_user
      else
        raise_undefined_authorization_handler_error
    end
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
        require_logged_in_user
      else
        raise_undefined_authorization_handler_error
    end
  end

  def require_sufficient_rights_for_api_drafts
    action = params[:action]

    if current_user.present?

      case action
        when 'create'
          return render nothing: true, status: 403 unless can_edit_story?
        when 'latest'
          return render nothing: true, status: 403 unless can_view_unpublished_story?
        else
          raise_undefined_authorization_handler_error
      end
    else
      handle_unauthorized_request
    end
  end

  def require_sufficient_rights_for_api_permissions
    action = params[:action]

    case action
      when 'update'
        if current_user.present?
          return render nothing: true, status: 403 unless admin? || owner?
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
      when 'create'
        if current_user.present?
          return render nothing: true, status: 403 unless admin? || owner?
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
        return render_404 unless CoreServer.view_accessible?(story_uid)

        # If that passes, check additional storyteller-specific
        # permission rules.
        case action
          when 'show'
            #pass
          when 'preview'
            render_404 unless can_view_unpublished_story?
          when 'tile'
            # pass
          when 'new'
            render_404 unless can_create_story?
          when 'create'
            render_404 unless can_create_story?
          when 'about'
            #pass
          when 'copy'
            render text: 'It seems that you don\'t have access to do that. Sorry!', status: 403 unless can_make_copy?
          when 'edit'
            render_404 unless can_edit_story?
          when 'stats'
            render_404 unless can_see_story_stats?
          else
            raise_undefined_authorization_handler_error
        end
      else
        if action != 'show' && action != 'tile'
          handle_unauthorized_request
        end
      end
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
end
