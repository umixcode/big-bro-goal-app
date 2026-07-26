import { useQuery } from '@tanstack/react-query';
import { ensureCalendarAuthorized, isDeviceCalendarSupported, listDeviceCalendarEvents } from '../lib/deviceCalendar';

export function useDeviceCalendarEvents(startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: ['deviceCalendarEvents', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const authorized = await ensureCalendarAuthorized();
      if (!authorized) return [];
      return listDeviceCalendarEvents(startDate, endDate);
    },
    enabled: isDeviceCalendarSupported(),
    staleTime: 5 * 60_000,
  });
}
