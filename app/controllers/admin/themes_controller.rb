class Admin::ThemesController < ApplicationController
  prepend_before_filter :require_super_admin

  layout 'admin'

  def index
    @custom_themes = Theme.all_custom_for_current_domain
  end

  def new
    @theme = Theme.new
  end

  def edit
    @theme = Theme.find(params[:id])
  end

  def create
    @theme = Theme.new(theme_params)
    if @theme.save(CoreServer.headers_from_request(request))
      flash[:success] = "Successfully created theme, #{@theme.title}"
      redirect_to action: 'index'
    else
      flash[:error] = @theme.errors
      render 'new'
    end
  end

  def update
    @theme = Theme.find(params[:id])
    if @theme.update_attributes(theme_params, CoreServer.headers_from_request(request))
      flash[:success] = 'Successfully updated theme config'
    else
      flash[:error] = @theme.errors
    end

    render 'edit'
  end

  def destroy
    Theme.find(params[:id]).destroy(CoreServer.headers_from_request(request))
    redirect_to action: 'index'
  end

  private

  def theme_params
    params.require(:theme).permit(:title, :description, :css_variables => Theme.defaults.keys).tap do |whitelisted|
      whitelisted['domain_cname'] = request.host
    end
  end
end
