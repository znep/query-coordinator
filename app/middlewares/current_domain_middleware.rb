class CurrentDomainMiddleware

  def initialize(app)
    @app = app
  end

  def call(env)
    self.class.current_domain = env['SERVER_NAME']
    @app.call(env)
  end

  def self.current_domain=(domain)
    Thread.current[:current_domain] = domain
  end

  def self.current_domain
    Thread.current[:current_domain]
  end

end
