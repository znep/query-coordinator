module ActionControllerExtensions
  protected

  def render_403
    render_error(403)
  end

  def render_404
    render_error(404)
  end

  def render_406
    render_error(406)
  end

  def render_500
    render_error(500)
  end

  private

  def render_error(code)
    respond_to do |format|
      format.html do
        layout_to_use = 'main'
        layout_to_use = 'main_nodomain' unless CurrentDomain.set?
        render :template => "errors/error_#{code}", :layout => layout_to_use, :status => code
      end

      format.all { render :nothing => true, :status => code }
    end
    true # so we can do "render_404 and return"
  end
end

