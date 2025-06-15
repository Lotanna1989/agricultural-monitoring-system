import React, { useEffect } from 'react';

const AlarmAndNotifications = ({ trigger }) => {
  useEffect(() => {
    if (trigger) {
      const audio = new Audio("agrorithm_alarm.mp3"); // Must be in public/
      audio.play();

      // Show desktop/mobile notification
      const message = `🚨 You don enta non-grazing area. Abeg comot sharp sharp!
      Ka shiga wurin da ba a yarda da kiwo ba. Don Allah, ka bar wurin nan yanzu.`;

      if (Notification.permission === 'granted') {
        new Notification('🚨 Non-Grazing Alert', { body: message });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('🚨 Non-Grazing Alert', { body: message });
          }
        });
      }
    }
  }, [trigger]);

  return null;
};

export default AlarmAndNotifications;
