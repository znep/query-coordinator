# TODO Michael Brown is planning to move this into a gem with DecimaClient
require_relative 'deploy'
require 'httparty'
require 'json'

module Aws
  class DecimaClient
    include HTTParty

    base_uri 'decima.app.marathon.aws-us-west-2-infrastructure.socrata.net'

    def get_deploys(opts = {})
      query_params = {}
      unless opts[:environments].nil?
        query_params[:environment] = opts[:environments].join(',')
      end
      unless opts[:services].nil?
        query_params[:service] = opts[:services].join(',')
      end
      response = self.class.get("/deploy", query: query_params)
      fail("Invalid response, code: #{response.code}\n#{response.body}") unless response.code == 200
      JSON.parse(response.body).map { |d| Deploy.new(d) }
    end
  end
end
