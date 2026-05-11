export type ContactTopic =
  | 'general' | 'register-weeer' | 'billing' | 'dispute'
  | 'technical' | 'press' | 'partnership' | 'other';

export interface ContactInfo {
  companyName: string;
  address: string;
  phones: string[];
  emails: { label: string; email: string }[];
  businessHours: string;
  lineId: string;
}

export interface ContactFormSubmission {
  topic: ContactTopic;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  message: string;
  submittedAt: string;
}
