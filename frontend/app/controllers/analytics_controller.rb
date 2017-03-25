# encoding: utf-8
# frozen_string_literal: true
require 'json'
require 'open-uri'

class AnalyticsController < ApplicationController
  skip_before_filter :require_user
  skip_before_filter :verify_authenticity_token, :only => [:add, :add_all]

  def index
    return render_404 unless CurrentDomain.feature? :public_site_metrics
  end

  def add_all
    begin
      metrics = parse_metrics_from_request(request)
    rescue => e
      return e
    end

    all_valid = true
    messages = metrics.map do |metric|
      valid, message = handle_metric(metric)
      all_valid &&= valid
      message
    end

    return render :json => 'OK'.to_json if all_valid

    render :json => messages.to_json, :status => 207
  end

  def handle_metric(metric)
    valid, error = add_metric(metric['entity'], metric['metric'], metric['increment'])

    log_error(error, metric) unless valid

    message = {
      :status => valid ? '200' : '400',
      :metric => (metric['metric']).to_s,
      :message => valid ? 'OK' : error.to_s
    }

    [valid, message]
  end

  def log_error(error, metric)
    Rails.logger.error "Analytics Controller Metric Error: #{error} - referrer: #{URI(request.referer).path}\n" +
                           "Returning 207 with 400 inside.\n#{metric.to_json}"
  end

  def parse_metrics_from_request(request)
    # EN-6285 - Address Frontend app Airbrake errors
    #
    # This code was already rescuing JSON::ParserError, but the error that was
    # actually being raised was MultiJSON::ParseError. This discrepancy seems
    # to originate from within ActiveSupport, so \_(ツ)_/¯.
    data = begin
      ActiveSupport::JSON.decode(request.body.read)
    rescue MultiJson::ParseError, JSON::ParserError
      nil
    end

    raise render_metric_error('No metrics provided') if data.nil? || !data.key?('metrics')

    data['metrics']
  end

  def add
    valid, error = add_metric(params[:domain_entity], params[:metric], params[:increment])
    return render_metric_error(error) unless valid
    render :json => 'OK'.to_json
  end

  private

  def add_metric(entity, metric, raw_increment)
    # metrics and entities must be simple names, optional hyphens
    if (metric =~ /^[a-z0-9-]+$/).nil? || (entity =~ /^[a-z-]+$/).nil?
      return [false, 'Entity/Metric not properly formed']
    end

    unless ClientAnalyticsHelper.allowed?(entity, metric)
      return [false, "Entity/Metric not allowed: #{entity}/#{metric}"]
    end

    # increment must be a positive integer
    increment = ClientAnalyticsHelper.get_valid_increment(entity, metric, raw_increment)
    return [false, 'Metric Value Invalid'] if increment < 0

    # Currently we replace 'domain' with the domain id, but presumably
    # it will be desirable someday to have domain-centric entities outside
    # the main one, such as we have with "referers-[domainId]" - We should
    # do a search and replace at that point then.
    entity = CurrentDomain.domain.id.to_s if entity == 'domain'

    if entity == 'domain-intern'
      entity = CurrentDomain.domain.id.to_s + '-intern'
    end

    MetricQueue.instance.push_metric(entity, metric, increment)

    [true, nil]
  end

  def render_metric_error(reason)
    Rails.logger.error "Analytics Controller Metric Error: #{reason}. Returning 400."
    render :json => reason.to_json, :status => 400
  end
end

module ClientAnalyticsHelper
  FUNCTIONAL_BUCKETS = %w(story
                          other).freeze

  DYNAMIC_METRIC_TYPES = %w(js-dom-load-samples js-page-load-samples js-page-load-time js-dom-load-time).freeze

  DYNAMIC_MARK_METRIC_TYPES = %w(js-dom-load-samples js-page-load-samples).freeze

  STATIC_MARK_METRICS = %w(domain/js-page-view
                           domain/js-page-view-story
                           domain/page-views
                           domain-intern/js-page-load-samples
                           domain-intern/js-dom-load-samples).freeze

  STATIC_ALLOWED_METRICS = %w(domain/js-page-view
                              domain/js-page-view-story
                              domain/page-views
                              domain-intern/js-cardsview-api-explorer-time
                              domain-intern/js-cardsview-bar-filter-time
                              domain-intern/js-cardsview-card-data-service-time
                              domain-intern/js-cardsview-clear-filter-time
                              domain-intern/js-cardsview-dataset-data-service-time
                              domain-intern/js-cardsview-page-data-service-time
                              domain-intern/js-cardsview-page-load-time
                              domain-intern/js-cardsview-region-filter-time
                              domain-intern/js-cardsview-spatial-lens-service-time
                              domain-intern/js-cardsview-suggestion-service-time
                              domain-intern/js-cardsview-table-column-sort-time
                              domain-intern/js-cardsview-timeline-filter-time
                              domain-intern/js-page-load-samples
                              domain-intern/js-page-load-time
                              domain-intern/js-response-start-time
                              domain-intern/js-response-read-time
                              domain-intern/js-dom-load-time
                              domain-intern/js-connect-time
                              domain-intern/js-map-one-page-load-time
                              domain-intern/js-map-many-page-load-time
                              domain-intern/js-chart-bar-page-load-time
                              domain-intern/js-chart-column-page-load-time
                              domain-intern/js-chart-stackedbar-page-load-time
                              domain-intern/js-chart-stackedcolumn-page-load-time
                              domain-intern/js-chart-line-page-load-time
                              domain-intern/js-chart-area-page-load-time
                              domain-intern/js-chart-pie-page-load-time
                              domain-intern/js-chart-donut-page-load-time
                              domain-intern/js-chart-timeline-page-load-time
                              domain-intern/js-chart-bubble-page-load-time
                              domain-intern/js-spinner-main-time
                              domain-intern/js-spinner-save-time
                              domain-intern/js-spinner-upload-time
                              domain-intern/js-spinner-thumbnail-time
                              domain-intern/js-spinner-nomination-time
                              domain-intern/js-spinner-routing-time
                              domain-intern/js-spinner-dataslate-configurator-time
                              domain-intern/js-spinner-dataslate-global-time
                              domain-intern/js-spinner-dataslate-component-time
                              domain-intern/js-dataslate-lte-1-contexts-page-load-time
                              domain-intern/js-dataslate-lte-2-contexts-page-load-time
                              domain-intern/js-dataslate-lte-4-contexts-page-load-time
                              domain-intern/js-dataslate-lte-8-contexts-page-load-time
                              domain-intern/js-dataslate-lte-16-contexts-page-load-time
                              domain-intern/js-dataslate-lte-32-contexts-page-load-time
                              domain-intern/js-dataslate-lte-64-contexts-page-load-time
                              domain-intern/js-dataslate-lte-128-contexts-page-load-time).freeze

  def self.generateMarkMetrics
    generatePermutations STATIC_MARK_METRICS, DYNAMIC_MARK_METRIC_TYPES
  end

  def self.generateMetrics
    generatePermutations STATIC_ALLOWED_METRICS, DYNAMIC_METRIC_TYPES
  end

  def self.generatePermutations(static_metrics, base_metrics)
    ret_val = Array.new(static_metrics)
    FUNCTIONAL_BUCKETS.each do |functional_bucket|
      base_metrics.each do |dynamic_metric|
        ret_val.push "domain-intern/#{functional_bucket}-#{dynamic_metric}"
      end
      ret_val.push "domain/js-page-view-#{functional_bucket}"
      ret_val.push "domain/js-page-view-embed-#{functional_bucket}"
    end

    ret_val.freeze
  end

  MARK_METRICS = generateMarkMetrics
  ALLOWED_METRICS = generateMetrics

  def self.get_valid_increment(entity, metric, input)
    increment = input.to_i
    # ten minute upper bound; to exclude things like
    # a user shutting thier laptop during a page load
    return -1 if increment < 0 || increment > 600000
    increment = 1 if mark?(entity, metric)
    increment
  end

  def self.mark?(entity, metric)
    allowed = MARK_METRICS.include?(entity + '/' + metric)
    allowed
  end

  def self.allowed?(entity, metric)
    # Allow statically defined metrics and timezone timing metrics
    # Special handling for browser metrics so we don't have to hard-code a bunch of stuff
    allowed ||= ALLOWED_METRICS.include?(entity + '/' + metric)
    allowed ||= !!(/-tz-[-0-9]+-time/ =~ metric)
    allowed || metric.match(/^browser-[a-z]+(-\d+)?\z/)
  end
end
