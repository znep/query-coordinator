class ConsoleController < ApplicationController

  skip_before_filter :require_user, :index

  def index
    return render_404 unless FeatureFlags.derive.console
  end
end
