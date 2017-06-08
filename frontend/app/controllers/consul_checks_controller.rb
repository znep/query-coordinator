class ConsulChecksController < ActionController::Base

  # Current definition of liveness, for Consul, is just being able to handle
  # incoming requests.
  #
  # Compare to Storyteller's liveness check, which also needs to verify that the
  # service matches the desired version (for blue/green deploys).
  def active
    render nothing: true, status: :ok
  end

  def disable_site_chrome?
    false
  end

end
