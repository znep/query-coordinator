module AccountsHelper

  def openid_explained_url(return_to = nil)
    return_to ||= login_url
    "http://openidexplained.com/?OIDCA=#{return_to}&OIDCN=#{CurrentDomain.strings.company}"
  end
end
