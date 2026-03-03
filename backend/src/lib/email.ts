import { Resend } from 'resend';
import { env } from '@/config/env';

const resend = new Resend(env.resendApiKey);

export const sendMail = async ({to, subject, html }: {
    to: string,
    subject: string,
    html: string
}) => {
    resend.emails.send({
        from: `T-Learning <${env.corsOrigin}>`,
        to,
        subject,
        html,
    })
};