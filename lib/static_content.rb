module StaticContent
  def self.included(base)
    base.skip_before_filter :require_user
    base.before_filter :block_marketing
    base.caches_page :index, :show

    base.rescue_from ActionView::MissingTemplate do |exception|
      render_404
    end
    base.extend(ClassMethods)
  end

  # BeforeFilter to prevent access to marketing pages on non-socrata domains
  def block_marketing
    render_404 if !CurrentDomain.feature? :marketing_pages
  end

  module ClassMethods
  end

  def index
    @is_marketing_page = true
  end

  def show
    @is_marketing_page = true
    render :action => params[:page]
  end

end

