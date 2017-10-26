import { getCeteraUrl } from 'common/autocomplete/Util';

describe('getCeteraUrl', () => {
  it('properly generates cetera url', () => {
    expect(getCeteraUrl('birds')).to.eq('/cetera/autocomplete?q=birds');
  });

  it('properly generates anonymity', () => {
    expect(getCeteraUrl('birds', true)).to.eq('/cetera/autocomplete?anonymous=true&q=birds');
  });

  it('properly generates nymity', () => {
    expect(getCeteraUrl('cats', false)).to.eq('/cetera/autocomplete?anonymous=false&q=cats');
  });
});
