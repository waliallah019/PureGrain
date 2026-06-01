// my-leather-platform/lib/utils/messageUtils.ts
export const getMessageSubject = (inquiryType: string): string => {
  switch (inquiryType) {
    case 'quote': return 'Quote Request';
    case 'sample': return 'Sample Request';
    case 'custom': return 'Custom Manufacturing Inquiry';
    case 'partnership': return 'Partnership Proposal';
    case 'general': return 'General Inquiry';
    case 'support': return 'Support Request';
    case 'complaint': return 'Customer Complaint';
    default: return 'New Message';
  }
};