class Demos::DemosController < ApplicationController
  skip_before_filter :require_user
  layout 'styleguide'

  def index
  end
end
