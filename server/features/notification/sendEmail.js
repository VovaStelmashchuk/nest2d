import logger from '~~/server/utils/logger';
import { connectDB } from '~~/server/db/mongo';

async function sendEmail(to, subject, htmlBody) {
  try {
    const response = await $fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${useRuntimeConfig().resendToken}`,
      },
      body: {
        from: 'nest2d@stelmashchuk.dev',
        to: to,
        subject: subject,
        html: htmlBody,
      },
    });
    logger.info('Email sent successfully!');
    logger.info('Response:', response);
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

    await sendEmail(recipient, emailSubject, emailBody);
    logger.info('Email sending process completed.');
  } catch (err) {
    logger.error('Failed to send email:', err);
  }
}

export async function sendNewSupportMessageEmail(userId) {
  const db = await connectDB();
  const user = await db.collection('users').findOne({ id: userId });
  if (!user) {
    logger.error('User not found');
    throw createError({
      statusCode: 404,
      statusMessage: "User not found",
    });
  }

  try {
    const recipient = user.email;
    const emailSubject = `New support message from Nest2d`;
    const emailBody = `
      <p>Hello,</p>
      <p>You have received a new message from the Nest2d support team.</p>
      <p>Please log in to your account to view the message.</p>
      <p><a href="${useRuntimeConfig().public.baseUrl}">View Message</a></p>
      <p>Best regards, <br> Nest2d</p>
      <p>For unsubscribe, just reply to this email with word "unsubscribe", or notify us through our support chat.</p>
    `;

    await sendEmail(recipient, emailSubject, emailBody);
    logger.info(`Support notification email sent to ${recipient}`);
  } catch (err) {
    logger.error('Failed to send support notification email:', err);
  }
}
