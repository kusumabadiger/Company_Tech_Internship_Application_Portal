import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { ApplicationRecord } from './types';

/**
 * Generates a clean, professional PDF offer letter for Company Tech.
 * Strictly adheres to PRD Section 12:
 * - Document title: Internship Offer Letter
 * - Signature area labelled exactly: HR Support and Co-Founder
 * - No invented salary, stipend, or false legal commitments
 */
export async function generateOfferLetterPdf(app: ApplicationRecord): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();

  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontHelveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Palette: Professional deep navy, charcoal text, subtle accents
  const navy = rgb(0.08, 0.16, 0.28); // #142947
  const charcoal = rgb(0.18, 0.22, 0.28);
  const muted = rgb(0.45, 0.50, 0.58);
  const borderGrey = rgb(0.85, 0.88, 0.92);
  const accentBlue = rgb(0.12, 0.44, 0.85);

  let cursorY = height - 50;

  // Header Bar / Logo
  page.drawRectangle({
    x: 40,
    y: cursorY - 35,
    width: width - 80,
    height: 40,
    color: rgb(0.96, 0.97, 0.99),
  });

  page.drawText('COMPANY TECH', {
    x: 55,
    y: cursorY - 24,
    size: 16,
    font: fontHelveticaBold,
    color: navy,
  });

  page.drawText('INTERNSHIP PROGRAM', {
    x: width - 210,
    y: cursorY - 22,
    size: 10,
    font: fontHelveticaBold,
    color: accentBlue,
  });

  cursorY -= 70;

  // Document Title
  page.drawText('Internship Offer Letter', {
    x: 50,
    y: cursorY,
    size: 20,
    font: fontHelveticaBold,
    color: navy,
  });

  cursorY -= 25;

  const dateOfIssue = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  page.drawText(`Date of Issue: ${dateOfIssue}`, {
    x: 50,
    y: cursorY,
    size: 10,
    font: fontHelvetica,
    color: muted,
  });

  page.drawText(`Application Reference: ${app.applicationId}`, {
    x: width - 240,
    y: cursorY,
    size: 10,
    font: fontHelvetica,
    color: muted,
  });

  cursorY -= 20;

  // Divider Line
  page.drawLine({
    start: { x: 50, y: cursorY },
    end: { x: width - 50, y: cursorY },
    thickness: 1,
    color: borderGrey,
  });

  cursorY -= 30;

  // Applicant Particulars Box
  page.drawRectangle({
    x: 50,
    y: cursorY - 65,
    width: width - 100,
    height: 75,
    borderColor: borderGrey,
    borderWidth: 1,
    color: rgb(0.98, 0.99, 1.0),
  });

  page.drawText('CANDIDATE INFORMATION', {
    x: 65,
    y: cursorY - 12,
    size: 8,
    font: fontHelveticaBold,
    color: muted,
  });

  page.drawText(`Full Name:`, { x: 65, y: cursorY - 30, size: 10, font: fontHelveticaBold, color: charcoal });
  page.drawText(app.fullName, { x: 140, y: cursorY - 30, size: 10, font: fontHelvetica, color: charcoal });

  page.drawText(`Email Address:`, { x: 65, y: cursorY - 48, size: 10, font: fontHelveticaBold, color: charcoal });
  page.drawText(app.email, { x: 140, y: cursorY - 48, size: 10, font: fontHelvetica, color: charcoal });

  page.drawText(`Institution:`, { x: 320, y: cursorY - 30, size: 10, font: fontHelveticaBold, color: charcoal });
  page.drawText(app.college.length > 30 ? app.college.substring(0, 30) + '...' : app.college, {
    x: 390,
    y: cursorY - 30,
    size: 10,
    font: fontHelvetica,
    color: charcoal,
  });

  page.drawText(`Role:`, { x: 320, y: cursorY - 48, size: 10, font: fontHelveticaBold, color: charcoal });
  page.drawText(app.internshipRole, { x: 390, y: cursorY - 48, size: 10, font: fontHelveticaBold, color: accentBlue });

  cursorY -= 95;

  // Salutation
  page.drawText(`Dear ${app.fullName},`, {
    x: 50,
    y: cursorY,
    size: 11,
    font: fontHelveticaBold,
    color: navy,
  });

  cursorY -= 25;

  // Offer Letter Body Paragraphs
  const paragraphs = [
    `On behalf of Company Tech, we are pleased to offer you an internship position as a ${app.internshipRole}. Your application stood out among candidates for your enthusiasm, academic background, and potential to contribute to our collaborative projects.`,
    `This internship is designed to give you practical exposure to real-world software engineering and product workflows. During your tenure, you will work closely with our engineering team, participate in technical reviews, and gain hands-on experience on impactful initiatives.`,
  ];

  for (const paragraph of paragraphs) {
    const lines = splitTextIntoLines(paragraph, 85);
    for (const line of lines) {
      page.drawText(line, {
        x: 50,
        y: cursorY,
        size: 10,
        font: fontHelvetica,
        color: charcoal,
        lineHeight: 14,
      });
      cursorY -= 16;
    }
    cursorY -= 8;
  }

  // Key Terms Table
  cursorY -= 10;
  page.drawRectangle({
    x: 50,
    y: cursorY - 80,
    width: width - 100,
    height: 80,
    color: rgb(0.97, 0.98, 0.99),
    borderColor: borderGrey,
    borderWidth: 1,
  });

  page.drawText('INTERNSHIP TERMS & SCHEDULE', {
    x: 65,
    y: cursorY - 14,
    size: 9,
    font: fontHelveticaBold,
    color: navy,
  });

  page.drawText('Internship Role:', { x: 65, y: cursorY - 34, size: 9.5, font: fontHelveticaBold, color: charcoal });
  page.drawText(app.internshipRole, { x: 190, y: cursorY - 34, size: 9.5, font: fontHelvetica, color: charcoal });

  page.drawText('Duration:', { x: 65, y: cursorY - 52, size: 9.5, font: fontHelveticaBold, color: charcoal });
  page.drawText(app.internshipDuration || 'To be confirmed', {
    x: 190,
    y: cursorY - 52,
    size: 9.5,
    font: fontHelvetica,
    color: charcoal,
  });

  page.drawText('Joining Date:', { x: 65, y: cursorY - 70, size: 9.5, font: fontHelveticaBold, color: charcoal });
  page.drawText(app.joiningDate || 'To be confirmed', {
    x: 190,
    y: cursorY - 70,
    size: 9.5,
    font: fontHelvetica,
    color: charcoal,
  });

  cursorY -= 105;

  // Closing Paragraph
  const closingText = `Please confirm your acceptance of this offer by responding to your onboarding communication. We look forward to welcoming you to Company Tech and wish you a fruitful and rewarding internship experience.`;
  const closingLines = splitTextIntoLines(closingText, 85);
  for (const line of closingLines) {
    page.drawText(line, {
      x: 50,
      y: cursorY,
      size: 10,
      font: fontHelvetica,
      color: charcoal,
    });
    cursorY -= 16;
  }

  cursorY -= 30;

  // Signature Block
  page.drawText('Sincerely,', {
    x: 50,
    y: cursorY,
    size: 10,
    font: fontHelvetica,
    color: charcoal,
  });

  cursorY -= 35;

  // Stylized digital signature representation
  page.drawText('Company Tech Operations', {
    x: 50,
    y: cursorY,
    size: 12,
    font: fontHelveticaOblique,
    color: accentBlue,
  });

  cursorY -= 14;

  page.drawLine({
    start: { x: 50, y: cursorY },
    end: { x: 220, y: cursorY },
    thickness: 1,
    color: borderGrey,
  });

  cursorY -= 16;

  // Exact required label: HR Support and Co-Founder
  page.drawText('HR Support and Co-Founder', {
    x: 50,
    y: cursorY,
    size: 10,
    font: fontHelveticaBold,
    color: navy,
  });

  cursorY -= 14;

  page.drawText('Company Tech', {
    x: 50,
    y: cursorY,
    size: 9.5,
    font: fontHelvetica,
    color: muted,
  });

  // Footer Disclaimer
  page.drawText('Company Tech is a demonstration organization for this internship management automation prototype.', {
    x: 50,
    y: 35,
    size: 7.5,
    font: fontHelvetica,
    color: muted,
  });

  page.drawText(`Document verification: ${app.applicationId} | Page 1 of 1`, {
    x: width - 260,
    y: 35,
    size: 7.5,
    font: fontHelvetica,
    color: muted,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function splitTextIntoLines(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length > maxCharsPerLine) {
      lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  }

  if (currentLine.trim().length > 0) {
    lines.push(currentLine.trim());
  }

  return lines;
}
