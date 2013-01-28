class GovstatController < ApplicationController
  before_filter :set_govstat_theme

  def goals
  end
  
protected
  def set_govstat_theme
    @use_govstat_theme = true
  end
end