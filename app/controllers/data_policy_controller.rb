# TODO: Remove me, I'm a hack!

class DataPolicyController < ApplicationController
  include StaticContent

  def index
    if !CurrentDomain.cname.match /seattle/
      render_404
    end
  end
end
