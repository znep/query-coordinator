module CommonSocrataMethods
  def valid_cookies
    %w(logged_in _socrata_session_id _core_session_id socrata-csrf-token)
  end

  def forwardable_session_cookies(local_cookies = cookies)
    # select only the cookies that interest us
    session_cookies = valid_cookies.map do |key|
      value = local_cookies.to_h[key]
      "#{key}=#{value}" unless value.nil?
    end
    session_cookies = session_cookies.compact
    session_cookies.join('; ') if session_cookies.any?
  end
end