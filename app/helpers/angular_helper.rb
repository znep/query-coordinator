module AngularHelper

  def angular_app
    params[:app]
  end

  def angular_stylesheet_tag
    rendered_stylesheet_tag("angular-app-#{angular_app}")
  end

  def angular_javascript_tag
    include_javascripts("angular-app-#{angular_app}")
  end

end
