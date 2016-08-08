class Admin::ThemesController < ApplicationController
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
    if @theme.save
      flash[:success] = "Successfully created theme, #{@theme.title}"
      redirect_to action: 'index'
    else
      flash.now[:error] = @theme.errors.full_messages.to_sentence
      render 'new'
    end
  end

  def update
    @theme = Theme.find(params[:id])
    if @theme.update_attributes(theme_params)
      flash[:success] = 'Successfully updated theme config'
      redirect_to action: 'edit'
    else
      flash.now[:error] = @theme.errors.full_messages.to_sentence
      render 'edit'
    end
  end

  def destroy
    theme = Theme.find(params[:id])
    theme.destroy
    flash[:success] = "Successfully deleted theme, #{theme.title}."
    redirect_to action: 'index'
  end

  private

  def theme_params
    params.require(:theme).permit(
      :title,
      :description,
      :google_font_code,
      :css_variables => Theme.allowed_css_variables
    ).tap do |whitelisted|
      whitelisted['domain_cname'] = request.host
    end
  end
end
