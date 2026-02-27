import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOTPEmail = async (email: string, otp: string) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"CRM System" <noreply@example.com>',
    to: email,
    subject: 'Your Verification Code',
    text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #4CAF50; text-align: center;">Verification Code</h2>
        <p>Hello,</p>
        <p>Your verification code for the CRM system is:</p>
        <div style="font-size: 24px; font-weight: bold; text-align: center; padding: 10px; background: #f4f4f4; border-radius: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const sendStudentWelcomeEmail = async (
  email: string,
  name: string,
  password: string,
  loginUrl: string
) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"InterEd CRM" <noreply@example.com>',
    to: email,
    subject: 'Welcome to InterEd – Your Student Login Credentials',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #0ea5e9; text-align: center;">Welcome to InterEd, ${name}!</h2>
        <p>Your student account has been created. Use the credentials below to log in:</p>
        <table style="width:100%; background:#f4f4f4; border-radius:8px; padding:16px; margin:20px 0;">
          <tr><td style="padding:6px 0;"><strong>Login Email:</strong></td><td>${email}</td></tr>
          <tr><td style="padding:6px 0;"><strong>Temporary Password:</strong></td><td style="font-size:18px; font-weight:bold; letter-spacing:2px;">${password}</td></tr>
        </table>
        <p style="text-align:center;">
          <a href="${loginUrl}" style="background:#0ea5e9; color:#fff; padding:12px 28px; border-radius:6px; text-decoration:none; font-weight:bold;">Login Now</a>
        </p>
        <p style="color:#888; font-size:12px;">Please change your password after your first login. If you did not expect this email, please contact support.</p>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
};
export const sendCustomEmail = async (email: string, subject: string, body: string) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"InterEd CRM" <noreply@example.com>',
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        ${body.replace(/\n/g, '<br/>')}
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
};
