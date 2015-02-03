## New UX Customization

### Header Logo and Authentication Link Text
Customization of the header URL and authentication links is controlled via a
domain configuration with the key `theme_v3`.  Available properties that can be
customized are:

- `logo_url` : This should be the URL to a logo image.  The height will be
constrained to 50px, while maintaining the visual proportions. Defaults to
'/stylesheets/images/common/socrata_logo.png'
- `sign_in` : Text for sign in link */login*. Defaults to 'Sign In'
- `sign_out` : Text for sign out link */logout*. Defaults to 'Sign Out'
- `sign_up` : Text for sign up link */signup*. Defaults to 'Sign Up'
