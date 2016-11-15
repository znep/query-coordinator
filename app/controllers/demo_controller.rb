require 'request_store'

class DemoController < ApplicationController
  def index
    render 'fake_content', :layout => 'unified'
  end
end
