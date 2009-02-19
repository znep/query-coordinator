# Filters added to this controller apply to all controllers in the application.
# Likewise, all the methods added will be available for all controllers.

class ApplicationController < ActionController::Base
  before_filter :adjust_format, :auth_current_user
  helper :all # include all helpers, all the time
  layout 'main'
  
  require 'pp'

  # See ActionController::RequestForgeryProtection for details
  # Uncomment the :secret if you're not using the cookie session store
  protect_from_forgery # :secret => 'e231a1e478cd7112967644be164e057e'
  
  # See ActionController::Base for details 
  # Uncomment this to filter the contents of submitted sensitive data parameters
  # from your application log (in this case, all fields with names like "password"). 
  # filter_parameter_logging :password
  
  
private

  def adjust_format
    request.format = :data if request.xhr?
  end
  
  def auth_current_user
    @cur_user = User.find(CURRENT_USER_LOGIN)
    User.current_user = @cur_user
  end
end
