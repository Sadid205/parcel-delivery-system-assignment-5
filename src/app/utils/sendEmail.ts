import nodemailer from "nodemailer";
import path from "path";
import ejs from "ejs";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppErrors";

const transporter = nodemailer.createTransport({
  secure: true,
  auth: {
    user: envVars.SMTP.SMTP_USER,
    pass: envVars.SMTP.SMTP_PASS,
  },
  host: envVars.SMTP.SMTP_HOST,
  port: Number(envVars.SMTP.SMTP_PORT),
});

interface SendEmailOptions {
  to: string;
  subject: string;
  templateName: string;
  templateData?: Record<string, any>;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType: string;
  }[];
}

export const sendEmail = async ({
  to,
  subject,
  templateName,
  templateData,
  attachments,
}: SendEmailOptions) => {
  try {
    const templatePath = path.join(__dirname, `templates/${templateName}.ejs`);
    const html = await ejs.renderFile(templatePath, templateData);
    const info = await transporter.sendMail({
      from: envVars.SMTP.SMTP_FROM,
      to: to,
      subject: subject,
      html: html,
      attachments: attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
    });
    // console.log({
    //   __dirname,
    //   path,
    //   templatePath,
    // });
    console.log(`\u2709\uFE0F Email sent to ${to}: ${info.messageId}`);
  } catch (error: any) {
    console.log("Email sending error", error.message);
    throw new AppError(401, "Email error");
  }
};
