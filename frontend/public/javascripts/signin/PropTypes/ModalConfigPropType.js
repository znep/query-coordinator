import PropTypes from 'prop-types';

// A modal that pops up, covering any forms, that must be accepted
export default PropTypes.shape({
  // Modal title (default is "Notice")
  title: PropTypes.string,

  // Text for "Accept" button (default is "Accept")
  acceptButtonText: PropTypes.string,

  // Time, in minutes, until user must accept again when logging in (default is 0)
  expirationMinutes: PropTypes.number,

  // Actual text in modal
  text: PropTypes.string.isRequired,

  // Where to go when modal isn't accepted (default is /)
  cancelRedirectUrl: PropTypes.string,

  // If this is "true" then the cancel button isn't displayed
  hideCancelButton: PropTypes.bool,

  // Text for "Cancel" button (default is "Decline")
  cancelButtonText: PropTypes.string
});
