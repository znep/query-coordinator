class FutureAccount < Model

  def self.create_multiple(addresses, role)
    JSON.parse(CoreServer::Base.connection.post_form(
      '/future_accounts?method=createMultiple', :addresses => addresses, :role => role)
    )
  end

end
