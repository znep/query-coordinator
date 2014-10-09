module CommonPhidippidesMethods

  def has_rights?
    current_user && (current_user.is_owner?(dataset) || current_user.is_admin?)
  end

  def page_metadata_manager
    @page_metadata_manager ||= PageMetadataManager.new
  end

  def phidippides
    @phidippides ||= Phidippides.new
  end

  def request_id
    request.headers['X-Socrata-RequestId'] || request.headers['action_dispatch.request_id']
  end

  def forwardable_session_cookies
    # select only the cookies that interest us
    valid_cookies = %w(logged_in socrata-csrf-token _socrata_session_id _core_session_id)
    session_cookies = valid_cookies.map do |key|
      value = cookies[key]
      "#{key}=#{value}" unless value.nil?
    end
    session_cookies = session_cookies.compact
    session_cookies.join('; ') if session_cookies.any?
  end

end
