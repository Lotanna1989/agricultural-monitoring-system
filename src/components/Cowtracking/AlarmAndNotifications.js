import React, { useEffect, useState, useRef } from 'react';

const AlarmAndNotifications = ({ trigger }) => {
  const [isAlarming, setIsAlarming] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const audioRef = useRef(null);
  const vibrationRef = useRef(null);

  // Load notification history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('notification-history');
    if (savedHistory) {
      try {
        setNotificationHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading notification history:', error);
      }
    }
  }, []);

  // Save notification to history
  const saveNotificationToHistory = (notification) => {
    const updatedHistory = [notification, ...notificationHistory.slice(0, 49)]; // Keep last 50
    setNotificationHistory(updatedHistory);
    localStorage.setItem('notification-history', JSON.stringify(updatedHistory));
  };

  // Handle alarm trigger
  useEffect(() => {
    if (trigger && !isAlarming) {
      setIsAlarming(true);
      startAlarm();
      
      const notification = {
        id: Date.now(),
        timestamp: new Date(),
        type: 'geofence_violation',
        message: 'Alert: Entered restricted grazing area!',
        acknowledged: false,
      };
      
      saveNotificationToHistory(notification);
      showBrowserNotification(notification);
    } else if (!trigger && isAlarming) {
      setIsAlarming(false);
      stopAlarm();
    }
  }, [trigger, isAlarming]);

  // Start alarm (sound + vibration)
  const startAlarm = () => {
    // Play alarm sound
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.loop = true;
      audioRef.current.play().catch(error => {
        console.warn('Audio play failed:', error);
      });
    }

    // Trigger vibration if supported
    if ('vibrate' in navigator) {
      const vibrationPattern = [200, 100, 200, 100, 200]; // Vibration pattern
      vibrationRef.current = setInterval(() => {
        navigator.vibrate(vibrationPattern);
      }, 1000);
    }

    // Flash screen effect
    document.body.style.backgroundColor = '#ffebee';
    setTimeout(() => {
      document.body.style.backgroundColor = '';
    }, 500);
  };

  // Stop alarm
  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.loop = false;
    }

    if (vibrationRef.current) {
      clearInterval(vibrationRef.current);
      navigator.vibrate && navigator.vibrate(0); // Stop vibration
    }
  };

  // Show browser notification (works offline)
  const showBrowserNotification = async (notification) => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    // Request permission if not already granted
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (Notification.permission === 'granted') {
      const notif = new Notification('Livestock Alert', {
        body: notification.message,
        icon: '/favicon.ico', // Assuming you have a favicon
        badge: '/favicon.ico',
        tag: 'geofence-alert',
        requireInteraction: true,
        actions: [
          { action: 'acknowledge', title: 'Acknowledge' },
          { action: 'close', title: 'Close' }
        ]
      });

      notif.onclick = () => {
        acknowledgeNotification(notification.id);
        notif.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => notif.close(), 10000);
    }
  };

  // Acknowledge notification
  const acknowledgeNotification = (notificationId) => {
    const updatedHistory = notificationHistory.map(notif => 
      notif.id === notificationId ? { ...notif, acknowledged: true } : notif
    );
    setNotificationHistory(updatedHistory);
    localStorage.setItem('notification-history', JSON.stringify(updatedHistory));
    
    // Stop alarm if acknowledging current alert
    if (isAlarming) {
      setIsAlarming(false);
      stopAlarm();
    }
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotificationHistory([]);
    localStorage.removeItem('notification-history');
  };

  // Get unacknowledged notifications count
  const unacknowledgedCount = notificationHistory.filter(notif => !notif.acknowledged).length;

  return (
    <div style={{ marginTop: '20px' }}>
      {/* Audio element for alarm sound */}
      <audio 
        ref={audioRef}
        preload="auto"
        style={{ display: 'none' }}
      >
        <source src="/alarm-sound.wav" type="audio/wav" />
        <source src="/alarm-sound.mp3" type="audio/mpeg" />
        {/* Fallback beep sound using Web Audio API if no file available */}
      </audio>

      {/* Active alarm display */}
      {isAlarming && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f44336',
          color: 'white',
          borderRadius: '8px',
          marginBottom: '15px',
          animation: 'pulse 1s infinite',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>🚨 GEOFENCE ALERT 🚨</h3>
          <p style={{ margin: '0 0 10px 0' }}>
            You have entered a restricted grazing area!
          </p>
          <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>
            Please move to an approved grazing zone immediately.
          </p>
          <button
            onClick={() => acknowledgeNotification(Date.now())}
            style={{
              backgroundColor: 'white',
              color: '#f44336',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Acknowledge Alert
          </button>
        </div>
      )}

      {/* Notification status */}
      <div style={{
        padding: '10px',
        backgroundColor: isAlarming ? '#ffebee' : '#f5f5f5',
        borderRadius: '5px',
        marginBottom: '10px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>Alert Status:</strong> {isAlarming ? '🔴 ACTIVE ALERT' : '🟢 Normal'}
            {unacknowledgedCount > 0 && (
              <span style={{ 
                marginLeft: '10px', 
                backgroundColor: '#ff9800', 
                color: 'white', 
                padding: '2px 8px', 
                borderRadius: '12px', 
                fontSize: '12px' 
              }}>
                {unacknowledgedCount} unread
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Notifications: {Notification.permission || 'Not requested'}
          </div>
        </div>
      </div>

      {/* Notification history */}
      {notificationHistory.length > 0 && (
        <div style={{
          marginTop: '15px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #ddd',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h4 style={{ margin: 0 }}>Recent Alerts</h4>
            <button
              onClick={clearAllNotifications}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #dc3545',
                color: '#dc3545',
                padding: '5px 10px',
                borderRadius: '3px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Clear All
            </button>
          </div>
          
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {notificationHistory.slice(0, 10).map((notif) => (
              <div
                key={notif.id}
                style={{
                  padding: '10px',
                  borderBottom: '1px solid #eee',
                  backgroundColor: notif.acknowledged ? '#f8f9fa' : '#fff3cd',
                  opacity: notif.acknowledged ? 0.7 : 1
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: notif.acknowledged ? 'normal' : 'bold' }}>
                      {notif.message}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      {new Date(notif.timestamp).toLocaleString()}
                    </div>
                  </div>
                  {!notif.acknowledged && (
                    <button
                      onClick={() => acknowledgeNotification(notif.id)}
                      style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '3px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        marginLeft: '10px'
                      }}
                    >
                      Ack
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AlarmAndNotifications;