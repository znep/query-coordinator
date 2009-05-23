module StaticContent
  def self.included(base)
    base.skip_before_filter :require_user
    base.caches_page :index, :show

    base.rescue_from ActionView::MissingTemplate do |exception|
      render_404
    end
    base.extend(ClassMethods)
  end

  module ClassMethods
  end

  def index
  end

  def show
    render :action => params[:page]
  end

end



