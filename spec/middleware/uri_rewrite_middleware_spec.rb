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

  shared_examples 'path patcher' do
    let(:expected_env) {
      env.merge(
        'REQUEST_URI' => expected_request_uri,
        'PATH_INFO' => expected_path_info
      )
    }

    it 'prepends /stories to paths in REQUEST_URI and PATH_INFO' do
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
    let(:path_info) { 'https://example.com/stories/api/v1/stories/four-four/published/latest' }

    it_behaves_like 'passthrough'
  end

  context 'uri path including but not beginning with /stories/' do
    let(:request_uri) { 'https://example.com/admin/stories/' }
    let(:path_info) { 'https://example.com/admin/stories/' }

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
end
