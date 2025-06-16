import nodemailer from 'nodemailer';
import logger from '~~/server/utils/logger';
import { connectDB } from '~~/server/db/mongo';

const GMAIL_USER = 'vovochkastelmashchuk@gmail.com';
const APP_PASSWORD = useRuntimeConfig().gmailAppPassword;

if (!GMAIL_USER || !APP_PASSWORD) {
  logger.error("ERROR: Missing EMAIL_USER or APP_PASSWORD in your .env file.");
  logger.error("Please ensure you have configured them correctly.");
  process.exit(1);
}

async function sendEmailWithAppPassword(to, subject, htmlBody) {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: GMAIL_USER,
        pass: APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `Nest2d <${GMAIL_USER}>`,
      to: to,
      subject: subject,
      html: htmlBody,
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info('Email sent successfully!');
    logger.info('Message info: %s', info);
    if (nodemailer.getTestMessageUrl(info)) {
      logger.info('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    return info;

  } catch (error) {
    logger.error('Failed to send email:', error);
    throw error;
  }
}

export async function sendNestFinishEmail(nestingJob) {
  const db = await connectDB();
  const project = await db.collection('projects').findOne({ slug: nestingJob.projectSlug });
  const user = await db.collection('users').findOne({ id: nestingJob.ownerId });
  if (!user || !project) {
    logger.error('User or project not found');
    throw createError({
      statusCode: 404,
      statusMessage: "User or project not found",
    });
  }
  try {
    const recipient = user.email;
    const emailSubject = `Your nesting project ${project.name} is finished`;
    const emailBody = `
      <p>Your nesting project ${project.name} is finished</p>
      <p>You can view the project <a href="${useRuntimeConfig().public.baseUrl}/project/${project.slug}">here</a></p>
    `;

    await sendEmailWithAppPassword(recipient, emailSubject, emailBody);
    logger.info('Email sending process completed.');
  } catch (err) {
    logger.error('Failed to send email:', err);
  }
}
