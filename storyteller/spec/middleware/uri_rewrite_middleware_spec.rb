require 'uri_rewrite_middleware'

RSpec.describe UriRewriteMiddleware do
  let(:app) { double(:app).as_null_object }
  let(:subject) { UriRewriteMiddleware.new(app) }
  let(:env) do
    {
      'HTTP_SOME_OTHER_HEADER' => 'some value',
      'REQUEST_URI' => request_uri,
      'PATH_INFO' => path_info
    }
  end

  shared_examples 'passthrough' do
    it 'passes env through unchanged' do
      original_env = env.dup # original is potentially mutated
      expect(app).to receive(:call).with(original_env)
      subject.call(env)
    end
  end

  shared_examples 'path patcher' do |custom_message = 'be correct'|
    let(:expected_env) {
      env.merge(
        'REQUEST_URI' => expected_request_uri,
        'PATH_INFO' => expected_path_info
      )
    }

    it "patches REQUEST_URI and PATH_INFO to #{custom_message}" do
      expect(app).to receive(:call).with(expected_env)
      subject.call(env)
    end
  end

  context 'uri path beginning with /stories' do
    let(:request_uri) { 'https://example.com/stories/s/four-four' }
    let(:path_info) { '/stories/s/four-four' }

    it_behaves_like 'passthrough'
  end

  context 'uri path including but not beginning with /api/' do
    let(:request_uri) { 'https://example.com/stories/api/v1/stories/four-four/published/latest' }
    let(:path_info) { '/stories/api/v1/stories/four-four/published/latest' }

    it_behaves_like 'passthrough'
  end

  context 'uri path including but not beginning with /stories/' do
    let(:request_uri) { 'https://example.com/admin/stories/' }
    let(:path_info) { '/admin/stories/' }

    it_behaves_like 'passthrough'
  end

  context 'uri path beginning with /stat' do
    let(:request_uri) { 'https://example.com/stat/goals/single/four-four' }
    let(:path_info) { '/stat/goals/single/four-four' }

    let(:expected_request_uri) { 'https://example.com/stories/stat/goals/single/four-four' }
    let(:expected_path_info) { '/stories/stat/goals/single/four-four' }

    it_behaves_like 'path patcher'
  end

  context 'uri path beginning with /api' do
    let(:request_uri) { 'https://example.com/api/stat/v1/goals.json' }
    let(:path_info) { '/api/stat/v1/goals.json' }

    let(:expected_request_uri) { 'https://example.com/stories/api/stat/v1/goals.json' }
    let(:expected_path_info) { '/stories/api/stat/v1/goals.json' }

    it_behaves_like 'path patcher'
  end

  context 'URL with locale prefix' do
    context 'stories' do
      context 'view' do
        # No locale tested above.

        context 'english locale' do
          let(:request_uri) { 'https://example.com/en/stories/s/four-four' }
          let(:path_info) { '/en/stories/s/four-four' }

          let(:expected_request_uri) { 'https://example.com/stories/s/four-four' }
          let(:expected_path_info) { '/stories/s/four-four' }

          it_behaves_like 'path patcher', 'remove /en prefix'
        end

        context 'italian locale' do
          let(:request_uri) { 'https://example.com/it/stories/s/four-four' }
          let(:path_info) { '/it/stories/s/four-four' }

          # Arbitrary locale not implemented today, we just let locale through as-is.
          it_behaves_like 'passthrough'
        end
      end

      context 'api' do
        context 'no locale' do
          let(:request_uri) { 'https://example.com/stories/api/v1/stories/trjd-xtzv/drafts/latest' }
          let(:path_info) { '/stories/api/v1/stories/trjd-xtzv/drafts/latest' }

          it_behaves_like 'passthrough'
        end
      end
    end

    context 'Open Performance' do
      context 'view' do
        context 'no locale' do
          let(:request_uri) { 'https://example.com/stat/goals/single/test-test' }
          let(:path_info) { '/stat/goals/single/test-test' }

          let(:expected_request_uri) { 'https://example.com/stories/stat/goals/single/test-test' }
          let(:expected_path_info) { '/stories/stat/goals/single/test-test' }

          it_behaves_like 'path patcher', 'add /stories prefix only'
        end

        context 'english locale' do
          let(:request_uri) { 'https://example.com/en/stat/goals/single/test-test' }
          let(:path_info) { '/en/stat/goals/single/test-test' }

          let(:expected_request_uri) { 'https://example.com/stories/en/stat/goals/single/test-test' }
          let(:expected_path_info) { '/stories/en/stat/goals/single/test-test' }

          it_behaves_like 'path patcher', 'add locale and stories prefix'
        end

        # We are choosing not to support this case today. Let it 404 in Rails.
        context 'italian locale' do
          let(:request_uri) { 'https://example.com/it/stat/goals/single/test-test' }
          let(:path_info) { '/it/stat/goals/single/test-test' }
        end
      end

      context 'api' do
        # Tested above.
      end
    end
  end
end
