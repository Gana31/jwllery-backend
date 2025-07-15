import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsDir = path.join(__dirname, 'logs');
const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const errorLog = path.join(logsDir, `${todayStr}-error.log`);
const infoLog = path.join(logsDir, `${todayStr}-info.log`);

const attachments = [];
if (fs.existsSync(errorLog)) {
  attachments.push({ filename: `${todayStr}-error.log`, path: errorLog });
}
if (fs.existsSync(infoLog)) {
  attachments.push({ filename: `${todayStr}-info.log`, path: infoLog });
}

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const mailOptions = {
  from: process.env.EMAIL_USER,
  to: process.env.EMAIL_TO || 'ganeshronghe2@gmail.com',
  subject: `Daily Logs - ${todayStr}`,
  text: 'Attached are the daily error and info logs.',
  attachments,
};

async function sendLogs() {
  try {
    if (mailOptions.attachments.length === 0) {
      console.log('No log files to send.');
      return;
    }
    await transporter.sendMail(mailOptions);
    console.log('Logs sent.');
  } catch (err) {
    console.error('Failed to send logs:', err);
  }
}

(async () => {
  await sendLogs();
})(); 