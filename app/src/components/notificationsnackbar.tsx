import React from 'react';
import { Snackbar } from '@material-ui/core';
import { connect } from 'src/store';

const NotificationSnackbar = props => {
  const message = props.data.session.notification;

  const handleClose = () => {
    props.actions.clearNotification();
  };

  return (
    <Snackbar
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      open={Boolean(message)}
      autoHideDuration={4000}
      onClose={handleClose}
      message={message || ''}
    />
  );
};

const mapStateToProps = state => ({
  data: { session: { notification: state.session.notification } }
});

export default connect(mapStateToProps)(NotificationSnackbar);
