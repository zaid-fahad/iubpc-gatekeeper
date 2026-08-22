import jsPDF from 'jspdf';
import QRCode from 'qrcode';

/**
 * Certificate PDF Generator Utility
 */

/**
 * Generate dynamic QR Code DataURL for public verification URL
 */
export const generateVerificationQRCode = async (certNumber) => {
  const verificationUrl = `${window.location.origin}/verify/${certNumber}`;
  try {
    return await QRCode.toDataURL(verificationUrl, {
      width: 250,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Failed to generate verification QR code:', err);
    return null;
  }
};

/**
 * Load Image from URL into HTMLImageElement
 */
const loadImage = (url) => {
  return new Promise((resolve, reject) => {
    if (!url) return reject(new Error('No image URL provided'));
    const img = new Image();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => {
      const imgFallback = new Image();
      imgFallback.onload = () => resolve(imgFallback);
      imgFallback.onerror = (e) => reject(e);
      imgFallback.src = url;
    };
    img.src = url;
  });
};

/**
 * Render single certificate page onto a jsPDF document
 */
export const renderCertificateOnDoc = async (doc, { template, attendee, event, certNumber }) => {
  const width = template?.canvas_width || 1920;
  const height = template?.canvas_height || 1080;

  // 1. Draw Background Image
  if (template?.background_image_url) {
    try {
      const bgImg = await loadImage(template.background_image_url);
      try {
        const formatHint = template.background_image_url.includes('jpg') || template.background_image_url.includes('jpeg') ? 'JPEG' : 'PNG';
        doc.addImage(bgImg, formatHint, 0, 0, width, height);
      } catch (imgFormatErr) {
        try {
          doc.addImage(bgImg, 'PNG', 0, 0, width, height);
        } catch {
          doc.addImage(bgImg, 'JPEG', 0, 0, width, height);
        }
      }
    } catch (err) {
      console.warn('Background image load failed, continuing with plain background:', err);
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, width, height, 'F');
    }
  } else {
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, width, height, 'F');
  }

  // 2. Generate Verification QR Code
  const qrDataUrl = await generateVerificationQRCode(certNumber);

  // 3. Render Elements
  const elements = template?.elements || [];

  for (const el of elements) {
    const posX = (el.x / 100) * width;
    const posY = (el.y / 100) * height;

    if (el.field === 'qr_code') {
      if (qrDataUrl) {
        const qrWidth = (el.width / 100) * width || 160;
        const qrHeight = (el.height / 100) * height || 160;
        doc.addImage(qrDataUrl, 'PNG', posX, posY, qrWidth, qrHeight);
      }
      continue;
    }

    let text = '';
    switch (el.field) {
      case 'participant_name':
        text = attendee?.full_name || 'Participant Name';
        break;
      case 'student_id':
        text = attendee?.student_id || 'Student ID';
        break;
      case 'certificate_number':
        text = certNumber || 'CERT-2026-SAMPLE';
        break;
      case 'issue_date':
        text = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        break;
      case 'event_title':
        text = event?.title || 'Event Name';
        break;
      case 'category':
        text = attendee?.category || 'General Participant';
        break;
      case 'custom_text':
        text = el.customText || '';
        break;
      default:
        text = '';
    }

    if (!text) continue;

    const fontSize = el.fontSize || 36;
    doc.setFontSize(fontSize);

    let fontName = 'helvetica';
    if (el.fontFamily === 'Times') fontName = 'times';
    if (el.fontFamily === 'Courier') fontName = 'courier';
    
    let fontStyle = 'normal';
    if (el.fontWeight === 'bold') fontStyle = 'bold';
    if (el.fontWeight === 'italic') fontStyle = 'italic';
    if (el.fontWeight === 'bold-italic') fontStyle = 'bolditalic';

    try {
      doc.setFont(fontName, fontStyle);
    } catch {
      doc.setFont('helvetica', 'normal');
    }

    const hex = el.color || '#000000';
    const r = parseInt(hex.substring(1, 3), 16) || 0;
    const g = parseInt(hex.substring(3, 5), 16) || 0;
    const b = parseInt(hex.substring(5, 7), 16) || 0;
    doc.setTextColor(r, g, b);

    const alignOption = el.align || 'left';
    const adjustedPosY = posY + (fontSize * 0.18);
    doc.text(text, posX, adjustedPosY, { align: alignOption, baseline: 'top' });
  }
};

/**
 * Render single certificate as a jsPDF Document instance
 */
export const generateCertificatePDF = async ({ template, attendee, event, certNumber }) => {
  const orientation = template?.orientation || 'landscape';
  const width = template?.canvas_width || 1920;
  const height = template?.canvas_height || 1080;

  const doc = new jsPDF({
    orientation: orientation,
    unit: 'px',
    format: [width, height],
    compress: true
  });

  await renderCertificateOnDoc(doc, { template, attendee, event, certNumber });
  return doc;
};

/**
 * Generates a multi-page PDF document containing all attendee certificates
 */
export const generateBatchCertificatesPDF = async ({ template, targetAttendees = [], certRecords = [], eventTitle = 'Event' }) => {
  const orientation = template?.orientation || 'landscape';
  const width = template?.canvas_width || 1920;
  const height = template?.canvas_height || 1080;

  const doc = new jsPDF({
    orientation: orientation,
    unit: 'px',
    format: [width, height],
    compress: true
  });

  for (let i = 0; i < targetAttendees.length; i++) {
    if (i > 0) doc.addPage([width, height], orientation);
    const attendee = targetAttendees[i];
    const cert = certRecords.find(c => c.attendee_id === attendee.id);
    const certNum = cert?.certificate_number || `CERT-2026-${i + 1}`;

    await renderCertificateOnDoc(doc, {
      template,
      attendee,
      event: { title: eventTitle },
      certNumber: certNum
    });
  }

  const filename = `${(eventTitle || 'Event').replace(/[^a-zA-Z0-9]/g, '_')}_Certificates_Batch.pdf`;
  doc.save(filename);
};
