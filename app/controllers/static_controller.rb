class StaticController < ApplicationController
  include StaticContent

  def contact_us
    if request.post?
      flash[:notice] = "Thank you for your suggestion."
      Notification.deliver_contact_us(params[:contact], request.remote_ip)
    end

    render :action => 'contact-us'
  end

end
