module DatasetLandingPageHelper
  def view_last_updated
    Time.at(@view.last_activity).strftime('%B %-d, %Y')
  end
end

