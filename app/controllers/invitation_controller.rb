class InvitationController < ApplicationController
  
  def invite
    render(:layout => "modal_dialog")
  end
  
  def create
    
    message = params[:message]
    recipientArray = params[:recipients]
    
    errors = Array.new
    
    if (recipientArray)
      recipientArray.each do |r|
        recipient = JSON.parse(r)
      
        invite = Hash.new
        invite[:message] = message
        invite[:firstName] = recipient["first"] || ""
        invite[:lastName] = recipient["last"] || ""
        invite[:recipientEmail] = recipient["email"]
      
        begin
          InvitationRecord.create(invite)
        rescue CoreServerError => e
          errors << { :removeId => recipient["id"] }
        end
      end
    end

    render :json => {
      :status => errors.length > 0 ? "failure" : "success",
      :errors => errors
    }
    
  end
  
end