describe Model do

  describe '#==' do

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

    it 'returns true when the underlying data dictionaries are equal' do
      view_a = View.new(data)
      view_b = View.new(data.dup)
      expect(view_a).to eq(view_b)
    end

    it 'returns false when the underlying data dictionaries are not equal' do
      view_a = View.new(data)
      view_c = View.new(data2)
      expect(view_a).to_not eq(view_c)
    end

  end

end