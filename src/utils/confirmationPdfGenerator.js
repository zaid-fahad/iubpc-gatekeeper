import jsPDF from 'jspdf';
import QRCode from 'qrcode';

/**
 * Loads an image URL into a Data URL for jsPDF embedding
 */
const loadImageDataUrl = (url) => {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

/**
 * Draws a clean vector user avatar placeholder directly onto the PDF canvas
 */
const drawAvatarPlaceholder = (doc, x, y, width, height) => {
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, width, height, 2, 2, 'FD');

  const headX = x + width / 2;
  const headY = y + 10.5;
  doc.setFillColor(148, 163, 184); // Slate 400
  doc.circle(headX, headY, 4.8, 'F');

  doc.setFillColor(148, 163, 184);
  doc.roundedRect(x + 3.5, y + 17, width - 7, 10, 3, 3, 'F');
};

/**
 * Renders a single attendee pass page onto the jsPDF document instance
 */
const renderPassPage = async (doc, attendee, eventTitle, logoDataUrl) => {
  // Pure White Base Canvas
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 95, 145, 'F');

  // Top Lanyard Punch Slot Hole Marker
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(41, 2.5, 13, 3.2, 1.5, 1.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(41, 2.5, 13, 3.2, 1.5, 1.5, 'D');

  // Crisp Light Header Bar
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 7, 95, 19, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(0, 26, 95, 26);

  // Embed Logo Image
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', 7, 8, 16, 16);
    } catch (err) {
      console.warn('Logo render error:', err);
    }
  }

  // Header Title Text
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text('OFFICIAL EVENT PASS', 26, 15);

  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Independent University, Bangladesh • Gatekeeper System', 26, 19.5);

  // HIGH VISIBILITY EVENT TITLE BANNER
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 26, 95, 15, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const truncatedTitle = eventTitle.length > 36 ? `${eventTitle.substring(0, 33)}...` : eventTitle;
  doc.text(truncatedTitle.toUpperCase(), 47.5, 34.5, { align: 'center' });

  // Category Pill Subtitle
  doc.setTextColor(199, 210, 254);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  const categoryText = (attendee.category || 'PARTICIPANT / CONTESTANT').toUpperCase();
  doc.text(categoryText, 47.5, 38.5, { align: 'center' });

  // ATTENDEE PHOTO & MAIN DETAILS SECTION
  const photoX = 8;
  const photoY = 44;
  const photoW = 25;
  const photoH = 30;

  let photoRendered = false;
  if (attendee.avatar_url) {
    try {
      const photoDataUrl = await loadImageDataUrl(attendee.avatar_url);
      if (photoDataUrl) {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.4);
        doc.roundedRect(photoX, photoY, photoW, photoH, 2, 2, 'FD');
        doc.addImage(photoDataUrl, 'PNG', photoX + 1, photoY + 1, photoW - 2, photoH - 2);
        photoRendered = true;
      }
    } catch (err) {
      console.warn('Attendee photo load error:', err);
    }
  }

  if (!photoRendered) {
    drawAvatarPlaceholder(doc, photoX, photoY, photoW, photoH);
  }

  // Details Column Next to Photo
  const detailsLeft = 37;

  // Participant Name (Supports 2 Lines)
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.text('PARTICIPANT NAME', detailsLeft, 47);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');

  const fullNameStr = (attendee.full_name || 'Participant Name').toUpperCase();
  if (fullNameStr.length > 26) {
    doc.setFontSize(8.5);
  } else {
    doc.setFontSize(10);
  }

  const splitName = doc.splitTextToSize(fullNameStr, 52);
  const linesToRender = splitName.slice(0, 2);
  let currentY = 52;
  linesToRender.forEach((line, index) => {
    doc.text(line, detailsLeft, currentY + (index * 3.8));
  });

  const offsetY = linesToRender.length > 1 ? 3.5 : 0;

  // Student ID
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.text('STUDENT ID / ROLL NO', detailsLeft, 59.5 + offsetY);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(attendee.student_id || 'N/A', detailsLeft, 64.5 + offsetY);

  // Reference Contact
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.text('REFERENCE / CONTACT', detailsLeft, 70.5 + offsetY);
  doc.setTextColor(5, 150, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const refText = (attendee.reference || attendee.email || attendee.phone || 'VERIFIED');
  const truncatedRef = refText.length > 24 ? `${refText.substring(0, 22)}...` : refText;
  doc.text(truncatedRef, detailsLeft, 75.5 + offsetY);

  // Thin Hairline Rule before QR Code
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(8, 81, 87, 81);

  // QR Code Pass Container
  try {
    const qrData = `${window.location.origin}/verify/${attendee.student_id || attendee.id}`;
    const qrDataUrl = await QRCode.toDataURL(qrData, { width: 250, margin: 1 });
    doc.addImage(qrDataUrl, 'PNG', 28.5, 84, 38, 38);
  } catch (err) {
    console.warn('Failed to render QR Code into PDF:', err);
  }

  // Thin Divider Rule before Footer
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(10, 126, 85, 126);

  // Pass Scan Notice
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('SCAN AT ENTRY KIOSK FOR GATE CHECK-IN', 47.5, 131, { align: 'center' });

  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Official IUBPC Gatekeeper Pass • Valid for Confirmed Registrant', 47.5, 135.5, { align: 'center' });
};

/**
 * Generates a single attendee pass PDF
 */
export const generateConfirmationPDF = async (attendee, eventTitle = 'Official IUBPC Event') => {
  if (!attendee) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [95, 145]
  });

  const logoDataUrl = await loadImageDataUrl('/transparent_logo.webp');
  await renderPassPage(doc, attendee, eventTitle, logoDataUrl);

  const filename = `${(attendee.full_name || 'Attendee').replace(/[^a-zA-Z0-9]/g, '_')}_Event_Pass.pdf`;
  doc.save(filename);
};

/**
 * Generates a batch multi-page PDF containing passes for all selected attendees
 */
export const generateBatchConfirmationPDF = async (attendeesList = [], eventTitle = 'Official IUBPC Event') => {
  if (!attendeesList || attendeesList.length === 0) {
    alert('No attendees selected for pass export.');
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [95, 145]
  });

  const logoDataUrl = await loadImageDataUrl('/transparent_logo.webp');

  for (let i = 0; i < attendeesList.length; i++) {
    if (i > 0) doc.addPage([95, 145], 'portrait');
    await renderPassPage(doc, attendeesList[i], eventTitle, logoDataUrl);
  }

  const filename = `${(eventTitle || 'Event').replace(/[^a-zA-Z0-9]/g, '_')}_Passes_Batch.pdf`;
  doc.save(filename);
};
