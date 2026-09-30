import emailjs from '@emailjs/browser';

interface EmailResult {
  success: boolean;
  message: string;
  response?: unknown;
  error?: unknown;
}

/**
 * Sends an email using EmailJS service.
 * @param templateParams Object containing template variables (e.g., from_name, from_email, reply_to, message)
 */
export const sendEmail = async (templateParams: Record<string, unknown>): Promise<EmailResult> => {
  try {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      throw new Error('EmailJS keys are missing from environment variables.');
    }

    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      publicKey
    );

    return { success: true, message: 'Message sent successfully!', response };
  } catch (error) {
    console.error('EmailJS Error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send message. Please try again.',
      error
    };
  }
};
