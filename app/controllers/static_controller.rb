class StaticController < ApplicationController
  include StaticContent
  
  def sales
    if request.post?
      flash[:notice] = "Thank you for getting in touch with us."
      Notification.deliver_sales_contact(params[:contact], request.remote_ip)
    end
  end
end
