# encoding: utf-8
# frozen_string_literal: true
require 'rails_helper'

describe AnalyticsController do
  include TestHelperMethods

  before(:each) do
    init_feature_flag_signaller
    stub_site_chrome
  end

  let(:good_metrics_body) do
    {
      :metrics => [
        {
          :entity => 'domain',
          :metric => 'js-page-view',
          :increment => 1
        },
        {
          :entity => 'domain',
          :metric => 'browser-chrome',
          :increment => 1
        },
        {
          :entity => 'domain-intern',
          :metric => 'browser-chrome',
          :increment => 1
        },
        {
          :entity => 'domain',
          :metric => 'browser-chrome-55',
          :increment => 1
        },
        {
          :entity => 'domain-intern',
          :metric => 'browser-chrome-55',
          :increment => 1
        },
        {
          :entity => 'domain',
          :metric => 'js-page-view-browse',
          :increment => 1
        },
        {
          :entity => 'domain-intern',
          :metric => 'js-page-load-samples',
          :increment => 1
        },
        {
          :entity => 'domain-intern',
          :metric => 'js-page-load-time',
          :increment => 2615
        },
        {
          :entity => 'domain-intern',
          :metric => 'js-page-load-tz-480-time',
          :increment => 2615
        },
        {
          :entity => 'domain-intern',
          :metric => 'js-response-start-time',
          :increment => 1036
        }
      ]
    }
  end

  let(:a_few_bad_metrics_body) do
    {
      :metrics => [
        {
          :entity => 'domain',
          :metric => 'js-page-view',
          :increment => 1
        },
        {
          :entity => 'domain',
          :metric => 'browser-chrome',
          :increment => -1
        },
        {
          :entity => 'domain-intern',
          :metric => 'browser-chrome',
          :increment => 10000000000
        },
        {
          :entity => 'domain',
          :metric => 'browser-chrome-55',
          :increment => 1
        },
        {
          :entity => 'domain-intern',
          :metric => 'browser-chrome-55',
          :increment => 1
        },
        {
          :entity => 'domain',
          :metric => 'js-page-view-browse',
          :increment => 1
        },
        {
          :entity => 'domain-intern',
          :metric => 'js-page-load-samples',
          :increment => 1
        },
        {
          :entity => 'domain-intern',
          :metric => 'js-page-load-time',
          :increment => 2615
        },
        {
          :entity => 'domain-intern',
          :metric => 'js-page-load-tz-480-time',
          :increment => 2615
        },
        {
          :entity => 'domain-intern',
          :metric => 'js-response-start-time',
          :increment => 1036
        }
      ]
    }
  end

  let(:a_few_bad_metrics_response) do
    [
      {
        :status => '200',
        :metric => 'js-page-view',
        :message => 'OK'
      },
      {
        :status => '400',
        :metric => 'browser-chrome',
        :message => 'Metric Value Invalid'
      },
      {
        :status => '400',
        :metric => 'browser-chrome',
        :message => 'Metric Value Invalid'
      },
      {
        :status => '200',
        :metric => 'browser-chrome-55',
        :message => 'OK'
      },
      {
        :status => '200',
        :metric => 'browser-chrome-55',
        :message => 'OK'
      },
      {
        :status => '200',
        :metric => 'js-page-view-browse',
        :message => 'OK'
      },
      {
        :status => '200',
        :metric => 'js-page-load-samples',
        :message => 'OK'
      },
      {
        :status => '200',
        :metric => 'js-page-load-time',
        :message => 'OK'
      },
      {
        :status => '200',
        :metric => 'js-page-load-tz-480-time',
        :message => 'OK'
      },
      {
        :status => '200',
        :metric => 'js-response-start-time',
        :message => 'OK'
      }
    ]
  end

  let(:malformed_metrics_body) do
    {
      :stuff => 'here'
    }
  end

  describe 'add_all', :verify_stubs => false do
    describe 'not logged in' do
      before(:each) do
        allow(subject).to receive(:current_user_session).and_return(nil)
        allow(subject).to receive(:current_user).and_return(nil)
        init_current_domain
      end

      it 'should return a 400 with no data' do
        post :add_all, {}.to_json
        expect(response).to have_http_status(:bad_request)
        expect(response.body).to eq('"No metrics provided"')
      end

      it 'should return a 400 when given malformed data' do
        post :add_all, malformed_metrics_body.to_json
        expect(response).to have_http_status(:bad_request)
        expect(response.body).to eq('"No metrics provided"')
      end

      it 'should return a 200 with all good data' do
        expect(MetricQueue.instance).to receive(:push_metric).with('1', 'js-page-view', 1)
        expect(MetricQueue.instance).to receive(:push_metric).with('1', 'browser-chrome', 1)
        expect(MetricQueue.instance).to receive(:push_metric).with('1-intern', 'browser-chrome', 1)
        expect(MetricQueue.instance).to receive(:push_metric).with('1', 'browser-chrome-55', 1)
        expect(MetricQueue.instance).to receive(:push_metric).with('1-intern', 'browser-chrome-55', 1)
        expect(MetricQueue.instance).to receive(:push_metric).with('1', 'js-page-view-browse', 1)
        expect(MetricQueue.instance).to receive(:push_metric).with('1-intern', 'js-page-load-samples', 1)
        expect(MetricQueue.instance).to receive(:push_metric).with('1-intern', 'js-page-load-time', 2615)
        expect(MetricQueue.instance).to receive(:push_metric).with('1-intern', 'js-page-load-tz-480-time', 2615)
        expect(MetricQueue.instance).to receive(:push_metric).with('1-intern', 'js-response-start-time', 1036)

        post :add_all, good_metrics_body.to_json
        expect(response).to have_http_status(:success)
        expect(response.body).to eq('"OK"')
      end

      it 'should return a 207 with some bad metrics' do
        allow(request).to receive(:referer).twice.and_return('http://pandora.box')

        expect(MetricQueue.instance).to receive(:push_metric).with('1', 'js-page-view', 1)
        expect(MetricQueue.instance).to receive(:push_metric).with('1', 'browser-chrome-55', 1)
        expect(MetricQueue.instance).to receive(:push_metric).with('1-intern', 'browser-chrome-55', 1)
        expect(MetricQueue.instance).to receive(:push_metric).with('1', 'js-page-view-browse', 1)
        expect(MetricQueue.instance).to receive(:push_metric).with('1-intern', 'js-page-load-samples', 1)
        expect(MetricQueue.instance).to receive(:push_metric).with('1-intern', 'js-page-load-time', 2615)
        expect(MetricQueue.instance).to receive(:push_metric).with('1-intern', 'js-page-load-tz-480-time', 2615)
        expect(MetricQueue.instance).to receive(:push_metric).with('1-intern', 'js-response-start-time', 1036)

        post :add_all, a_few_bad_metrics_body.to_json, 'Referer' => 'A Test Referer'
        expect(response).to have_http_status(207)
        expect(response.body).to eq(a_few_bad_metrics_response.to_json)
      end
    end

    describe 'logged in' do
      before(:each) do
        init_current_user(subject)
        init_current_domain
      end

      it 'should return a 400 with no data' do
        post :add_all, :metrics => {}
        expect(response).to have_http_status(:bad_request)
        expect(response.body).to eq('"No metrics provided"')
      end

      it 'should return a 400 when given malformed data' do
        post :add_all, malformed_metrics_body.to_json
        expect(response).to have_http_status(:bad_request)
        expect(response.body).to eq('"No metrics provided"')
      end

      it 'should return a 200 with all good data' do
        post :add_all, good_metrics_body.to_json
        expect(response).to have_http_status(:success)
        expect(response.body).to eq('"OK"')
      end

      it 'should return a 207 with some bad metrics' do
        allow(request).to receive(:referer).twice.and_return('http://pandora.box')
        post :add_all, a_few_bad_metrics_body.to_json, 'Referer' => 'A Test Referer'
        expect(response).to have_http_status(207)
        expect(response.body).to eq(a_few_bad_metrics_response.to_json)
      end
    end
  end
end
