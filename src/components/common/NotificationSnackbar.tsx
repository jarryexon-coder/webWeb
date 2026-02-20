// src/components/common/NotificationSnackbar.tsx
import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useNotifications } from '../../context/NotificationContext';

const NotificationSnackbar: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <>
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.duration || 5000}
          onClose={() => removeNotification(notification.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => removeNotification(notification.id)}
            severity={notification.type}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

export default NotificationSnackbar;
