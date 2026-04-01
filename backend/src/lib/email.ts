import { Resend } from 'resend';
import { env } from '@/config/env';

const resend = new Resend(env.resendApiKey);

export const sendMail = async ({to, subject, html }: {
    to: string,
    subject: string,
    html: string
}) => {
    const { data, error } = await resend.emails.send({
        from: `T-Learning <${env.resendEmailAddress}>`,
        to,
        subject,
        html,
    })

    if (error) {
        console.error('RESEND ERROR:', error);
        throw error;
    }
    console.info('RESEND EMAIL SENT:', data);
};