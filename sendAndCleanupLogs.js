import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'env.example') });

const logsDir = path.join(__dirname, 'logs');
const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const errorLog = path.join(logsDir, `${todayStr}-error.log`);
const infoLog = path.join(logsDir, `${todayStr}-info.log`);

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
  attachments: [
    fs.existsSync(errorLog) ? { filename: `${todayStr}-error.log`, path: errorLog } : null,
    fs.existsSync(infoLog) ? { filename: `${todayStr}-info.log`, path: infoLog } : null,
  ].filter(Boolean),
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

function deleteOldLogs() {
  const files = fs.readdirSync(logsDir);
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() - 2); // 2 days ago
  files.forEach(file => {
    const match = file.match(/^(  {4}-  {2}-  {2})-(error|info)\.log$/);
    if (match) {
      const fileDate = new Date(match[1]);
      if (fileDate < cutoff) {
        fs.unlinkSync(path.join(logsDir, file));
        console.log('Deleted old log:', file);
      }
    }
  });
}

(async () => {
  await sendLogs();
  deleteOldLogs();
})(); 