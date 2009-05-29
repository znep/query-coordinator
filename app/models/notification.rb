class Notification < ActionMailer::Base
  def sales_contact(email_params, remote_ip)
    from email_params[:email]
    recipients(Rails.env.production? ? "sales@socrata.com" : "engineering@socrata.com")
    headers 'Sender' => 'Socrata Contact Form <noreply@socrata.com>', 
      'X-Contact-IP' => remote_ip,
      'return-path' => 'engineering@socrata.com'

    subject "[Sales] #{email_params[:subject]}"
    body :description => email_params[:description]
  end
end
