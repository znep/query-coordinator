require 'rails_helper'

describe Model do

  let(:data) do
    {
      :foo => 'bar',
      :baz => 2,
      :quux => [6, 7, 8]
    }
  end

  let(:data2) do
    {
      :foo => 'baz',
      :baz => 2,
      :quux => [6, 7, 8]
    }
  end

  describe '#==' do

    it 'returns true when the underlying data dictionaries are equal' do
      view_a = View.new(data)
      view_b = View.new(data.dup)
      expect(view_a).to eq(view_b)
    end

    it 'returns false when the underlying data dictionaries are not equal' do
      view_a = View.new(data)
      view_b = View.new(data2)
      expect(view_a).to_not eq(view_b)
    end
  end

  it 'returns the model with updated attribute(s)' do
    view = View.new(data)
    view.foo = 'foo'
    view.data = {}
    expect(view.foo).to eq('foo')
  end

  describe '#find' do
    it 'does not explode on an invalid response' do
      allow_any_instance_of(CoreServer::Connection).to receive(:get_request).and_return('<html><body><h1>503 Service Unavailable</h1> No server is available to handle this request. </body></html>')
      expect { Model.find('asdf-asdf') }.to_not raise_error
    end
  end

end
