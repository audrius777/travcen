import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function sendEmail({ to, subject, text }) {
  const mailOptions = { 
    from: 'TravCen <noreply@travcen.com>', 
    to, 
    subject, 
    text 
  };
  return transporter.sendMail(mailOptions);
}
