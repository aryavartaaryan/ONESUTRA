'use client';
import { useEffect } from 'react';
import { useDyteClient } from '@dytesdk/react-web-core';
import { DyteMeeting } from '@dytesdk/react-ui-kit';

export default function DyteCall({ authToken, mode = 'audio', onLeave }: { authToken: string, mode?: 'audio' | 'video', onLeave?: () => void }) {
  const [meeting, initMeeting] = useDyteClient();

  useEffect(() => {
    if (authToken) {
      initMeeting({
        authToken,
        defaults: {
          audio: true,
          video: mode === 'video',
        },
      });
    }
  }, [authToken, initMeeting, mode]);

  useEffect(() => {
    if (!meeting || !meeting.self) return;

    // Ensure audio-call starts with camera disabled.
    if (mode === 'audio' && meeting.self.videoEnabled) {
      meeting.self.disableVideo().catch(() => undefined);
    }
  }, [meeting, mode]);

  useEffect(() => {
    if (meeting) {
      const handleLeave = () => {
        if (onLeave) onLeave();
      };
      if (meeting.self) {
        meeting.self.on('roomLeft', handleLeave);
      }
      return () => {
        if (meeting.self) {
          meeting.self.off('roomLeft', handleLeave);
        }
      };
    }
  }, [meeting, onLeave]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000' }}>
      {meeting && (
        <DyteMeeting mode="fill" meeting={meeting} />
      )}
    </div>
  );
}
