class HomeController < ApplicationController
  layout 'strict'

  def index
    @bodyClass = 'home'
  end
end
