# Factory class for creating EventMachine::HttpClient request objects. To use:
#
# EventMachine.run do
#   factory = RequestFactory.new(:timeout => 10)
#   multi = EventMachine.MultiRequest.new
#
#   multi.add(factory.views(...))
#   multi.add(factory.tags(...))
#
#   multi.callback do
#     # Do stuff with multi.responses[:succeeded]
#     EventMachine.stop
#   end
# end
class RequestFactory
  @@views_uri = CORESERVICE_URI.clone
  @@views_uri.path = '/views.json'

  @@tags_uri = CORESERVICE_URI.clone
  @@tags_uri.path = '/tags.json'

  def initialize(options = {})
    @options = options
    @options[:timeout] ||= 10
  end

  def views(query)
    EventMachine::HttpRequest.new(@@views_uri.to_s).get(request_options(query))
  end

  def tags(query)
    EventMachine::HttpRequest.new(@@tags_uri.to_s).get(request_options(query))
  end

  private
  def request_options(query)
    o = {}
    if requestor = User.current_user
      if !requestor.session_token.blank?
        o[:head] ||= {}
        o[:head][:cookie] = "_blist_session_id=#{requestor.session_token.to_s}"
      end
    end
    o[:query] = query unless query.blank?

    @options.merge(o)
  end
end

