/**
 * FiveNest Google Calendar Demo Booking Configuration
 * Preferred Days: Weekdays (Monday to Friday)
 * Preferred Hours: 11:00 AM – 1:00 PM IST or 4:00 PM – 6:00 PM IST
 * Organizer / Contact: fivenest.india@gmail.com / +91 88792 28710
 */

export const DEMO_PREFERENCES = {
  organizerEmail: 'fivenest.india@gmail.com',
  phone: '+91 88792 28710',
  preferredDays: 'Monday to Friday (Weekdays)',
  morningSlot: '11:00 AM – 1:00 PM IST',
  eveningSlot: '4:00 PM – 6:00 PM IST',
};

export const GOOGLE_CALENDAR_DEMO_URL = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
  'FiveNest Live Product Demo'
)}&details=${encodeURIComponent(
  'Personalized 1-on-1 walkthrough of FiveNest Sportswear Production Studio & Order Management Platform.\n\n' +
  'Preferred Weekday Demo Timings (Mon - Fri):\n' +
  '• Morning Slot: 11:00 AM – 1:00 PM IST\n' +
  '• Evening Slot: 4:00 PM – 6:00 PM IST\n\n' +
  'Organizer: fivenest.india@gmail.com\n' +
  'WhatsApp: +91 88792 28710\n' +
  'Website: https://www.fivenest.in'
)}&add=fivenest.india@gmail.com&location=${encodeURIComponent('Google Meet')}`;
