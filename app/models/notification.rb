class Notification < ActionMailer::Base
  def contact_us(email_params, remote_ip)
    from email_params[:email]
    recipients(Rails.env.production? ? "feedback@socrata.com" : "engineering@socrata.com")
    headers 'Sender' => 'Socrata Contact Form <noreply@socrata.com>', 'X-Contact-IP' => remote_ip

    subject "[Contact Us] #{email_params[:subject]}"
    body :subject => email_params[:subject]
  end
end
