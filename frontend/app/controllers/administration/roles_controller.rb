class Administration::RolesController < AdministrationController
  include AdminHelper

  before_action :only => [:index] { |_| user_can_see_roles? }

  def index
  end

end
