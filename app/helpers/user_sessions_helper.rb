module UserSessionsHelper
  def link_to_rpx(text)
    link_to text, "#{APP_CONFIG['rpx_signin_url']}?token_url=#{rpx_url}", :class => 'rpxnow', :onclick => 'return false'
  end
end