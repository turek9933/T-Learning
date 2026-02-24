import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendMail = async ({to, subject, html }: {
    to: string,
    subject: string,
    html: string
}) => {
    resend.emails.send({
        from: `T-Learning <${process.env.CORS_ORIGIN}>`,
        to,
        subject,
        html,
    })
};