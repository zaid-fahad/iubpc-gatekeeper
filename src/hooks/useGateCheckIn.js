import { useState } from 'react';
import { updateAttendeeStatus, insertEntryLog } from '../api/attendees';

/**
 * Domain hook for atomic gate check-in status mutation & audit logging.
 */
export function useGateCheckIn(eventId, adminEmail) {
  const [processing, setProcessing] = useState(false);

  const checkInAttendee = async (attendeeId, field = 'checked_in_1', val = true) => {
    setProcessing(true);
    try {
      const { error: err } = await updateAttendeeStatus(attendeeId, field, val);
      if (err) throw err;

      await insertEntryLog({
        attendee_id: attendeeId,
        event_id: eventId,
        action_type: field,
        status: val,
        admin_email: adminEmail || 'system-kiosk'
      });

      return { success: true };
    } catch (error) {
      console.error('Check-in status update failed:', error);
      return { success: false, error };
    } finally {
      setProcessing(false);
    }
  };

  return {
    processing,
    checkInAttendee
  };
}
