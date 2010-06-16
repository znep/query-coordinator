class TestPagesController < ApplicationController
  def index
    @actions = action_methods
  end

  def js_kaboom
    
  end

  def kaboom
    throw new Exception
  end
end
