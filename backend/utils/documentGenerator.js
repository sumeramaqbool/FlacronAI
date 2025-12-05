// Document Generation Utility for FlacronAI - CRU Group Template Format
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = require('docx');
const PDFDocument = require('pdfkit');

/**
 * Parse AI-generated content into structured sections
 */
function parseReportSections(aiContent) {
  const sections = {};
  const lines = aiContent.split('\n');
  let currentSection = 'header';
  let currentContent = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Check if this is a section header (all caps or specific keywords)
    if (trimmed && (trimmed === trimmed.toUpperCase() ||
        ['REMARKS', 'RISK', 'ITV', 'OCCURRENCE', 'COVERAGE', 'ASSIGNMENT', 'INSURED', 'LOSS AND ORIGIN', 'DAMAGES', 'EXPERTS', 'OFFICIAL REPORTS', 'SUBROGATION', 'SALVAGE', 'ACTION PLAN', 'RECOMMENDATION', 'DIARY DATE'].some(keyword => trimmed.startsWith(keyword)))) {

      // Save previous section
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n');
      }

      // Start new section
      currentSection = trimmed;
      currentContent = [];
    } else if (trimmed) {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n');
  }

  return sections;
}

/**
 * Create formatted paragraphs from text content
 */
function createFormattedParagraphs(text) {
  const paragraphs = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      paragraphs.push(new Paragraph({ text: "", spacing: { after: 100 } }));
      continue;
    }

    // Check if it's a bold header (ends with :)
    if (trimmed.endsWith(':') && trimmed.length < 50) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: trimmed, bold: true })],
        spacing: { before: 150, after: 100 }
      }));
    } else {
      paragraphs.push(new Paragraph({
        text: trimmed,
        spacing: { after: 100 }
      }));
    }
  }

  return paragraphs;
}

/**
 * Generate DOCX document from report content in CRU Group format
 */
async function generateDOCX(reportData, aiContent) {
  try {
    const currentDate = new Date().toLocaleDateString();

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 720,  // 0.5 inch
              right: 720,
              bottom: 720,
              left: 720
            }
          }
        },
        children: [
          // Date at top
          new Paragraph({
            text: currentDate,
            spacing: { after: 200 }
          }),

          new Paragraph({ text: "", spacing: { after: 200 } }),

          // Company Header
          new Paragraph({
            text: "FlacronAI Insurance Services",
            bold: true,
            spacing: { after: 100 }
          }),
          new Paragraph({
            text: "Professional Property Inspection Reports",
            spacing: { after: 200 }
          }),

          new Paragraph({ text: "", spacing: { after: 300 } }),

          // Claim Information Section
          new Paragraph({
            children: [
              new TextRun({ text: "Client Claim #: ", bold: true }),
              new TextRun(reportData.claimNumber || 'N/A')
            ],
            spacing: { after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "Insured: ", bold: true }),
              new TextRun(reportData.insuredName || 'N/A')
            ],
            spacing: { after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "Loss Location: ", bold: true }),
              new TextRun(reportData.propertyAddress || 'N/A')
            ],
            spacing: { after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "Date of Loss: ", bold: true }),
              new TextRun(reportData.lossDate || 'N/A')
            ],
            spacing: { after: 200 }
          }),

          new Paragraph({ text: "", spacing: { after: 200 } }),

          new Paragraph({
            text: `This will serve as our ${reportData.reportType || 'inspection report'} on the above captioned assignment.`,
            spacing: { after: 400 }
          }),

          // ESTIMATED LOSS Table
          new Paragraph({
            children: [new TextRun({ text: "ESTIMATED LOSS:", bold: true })],
            spacing: { before: 200, after: 200 }
          }),

          new Paragraph({
            text: "The following reserves are suggested for damages observed to date:",
            spacing: { after: 200 }
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Coverage", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Limit", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Prior Reserve", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Change +/-", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Remaining Reserve", bold: true })] })] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Dwelling")] }),
                  new TableCell({ children: [new Paragraph("")] }),
                  new TableCell({ children: [new Paragraph("")] }),
                  new TableCell({ children: [new Paragraph("")] }),
                  new TableCell({ children: [new Paragraph("")] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Other Structures")] }),
                  new TableCell({ children: [new Paragraph("")] }),
                  new TableCell({ children: [new Paragraph("")] }),
                  new TableCell({ children: [new Paragraph("")] }),
                  new TableCell({ children: [new Paragraph("")] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Personal Property")] }),
                  new TableCell({ children: [new Paragraph("")] }),
                  new TableCell({ children: [new Paragraph("")] }),
                  new TableCell({ children: [new Paragraph("")] }),
                  new TableCell({ children: [new Paragraph("")] })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph("")] }),
                  new TableCell({ children: [new Paragraph("")] }),
                  new TableCell({ children: [new Paragraph("")] }),
                  new TableCell({ children: [new Paragraph("")] })
                ]
              })
            ]
          }),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          // AI Generated Content - Format with proper sections
          ...formatAIContent(aiContent),

          // Footer
          new Paragraph({ text: "", spacing: { before: 600 } }),

          new Paragraph({
            text: "Respectfully submitted,",
            spacing: { before: 400, after: 200 }
          }),

          new Paragraph({ text: "", spacing: { after: 200 } }),

          new Paragraph({
            text: "FlacronAI",
            bold: true,
            spacing: { after: 100 }
          }),
          new Paragraph({
            text: "www.flacronai.com",
            spacing: { after: 200 }
          }),

          new Paragraph({ text: "", spacing: { after: 200 } }),

          new Paragraph({
            children: [new TextRun({ text: "Powered by Google Gemini AI", italics: true, size: 18 })],
            alignment: AlignmentType.CENTER
          })
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    return {
      success: true,
      buffer: buffer,
      fileName: `${reportData.claimNumber}_${reportData.reportType}_${Date.now()}.docx`
    };
  } catch (error) {
    console.error('DOCX generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Clean markdown symbols from text - AGGRESSIVE CLEANING
 */
function cleanMarkdown(text) {
  if (!text) return '';

  return text
    // Remove ALL types of bold markers
    .replace(/\*\*(.+?)\*\*/g, '$1')  // **text**
    .replace(/__(.+?)__/g, '$1')       // __text__

    // Remove ALL types of italic markers
    .replace(/\*(.+?)\*/g, '$1')       // *text*
    .replace(/_(.+?)_/g, '$1')         // _text_

    // Remove bullet points with asterisks, dashes, or plus signs
    .replace(/^[\*\-\+]\s+/gm, '')

    // Remove markdown headers (keep the text only)
    .replace(/^#+\s+/gm, '')

    // Remove strikethrough
    .replace(/~~(.+?)~~/g, '$1')

    // Remove inline code markers
    .replace(/`(.+?)`/g, '$1')

    // Remove ALL remaining standalone asterisks
    .replace(/\*/g, '')

    // Remove ALL remaining underscores that are standalone
    .replace(/(?<!\w)_(?!\w)/g, '')

    // Clean up multiple spaces
    .replace(/\s+/g, ' ')

    .trim();
}

/**
 * Check if line starts with preamble text
 */
function isPreambleText(text) {
  const preamblePhrases = [
    'here is',
    'i have generated',
    'i\'ve generated',
    'below is',
    'following is',
    'i have created',
    'i\'ve created',
    'this is the',
    'as requested'
  ];
  const lower = text.toLowerCase();
  return preamblePhrases.some(phrase => lower.startsWith(phrase));
}

/**
 * Parse markdown text into TextRun objects with proper formatting
 */
function parseMarkdownToRuns(text) {
  const runs = [];
  let currentPos = 0;

  // Match bold text: **text** or __text__
  const boldRegex = /(\*\*|__)(.*?)\1/g;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before bold
    if (match.index > currentPos) {
      const plainText = text.substring(currentPos, match.index);
      if (plainText) runs.push(new TextRun({ text: plainText }));
    }

    // Add bold text
    runs.push(new TextRun({ text: match[2], bold: true }));
    currentPos = match.index + match[0].length;
  }

  // Add remaining text
  if (currentPos < text.length) {
    const remainingText = text.substring(currentPos);
    if (remainingText) runs.push(new TextRun({ text: remainingText }));
  }

  // If no markdown found, return plain text
  if (runs.length === 0) {
    runs.push(new TextRun({ text: text }));
  }

  return runs;
}

/**
 * Format AI content with proper section headers and styling for DOCX
 */
function formatAIContent(aiContent) {
  const paragraphs = [];
  const lines = aiContent.split('\n');

  const sectionHeaders = [
    'REMARKS', 'RISK', 'ITV', 'OCCURRENCE', 'COVERAGE', 'DWELLING DAMAGE',
    'OTHER STRUCTURES DAMAGE', 'CONTENTS DAMAGE', 'ALE', 'FMV', 'SUBROGATION',
    'SALVAGE', 'WORK TO BE COMPLETED', 'RECOMMENDATION', 'ASSIGNMENT',
    'INSURED', 'OWNERSHIP', 'LOSS AND ORIGIN', 'DAMAGES', 'DWELLING',
    'ROOF', 'EXTERIOR', 'INTERIOR', 'OTHER STRUCTURES', 'EXPERTS',
    'OFFICIAL REPORTS', 'ACTION PLAN', 'DIARY DATE', 'MORTGAGEE',
    'INSURABLE INTEREST', 'ALE / FMV CLAIM', 'SUBROGATION / SALVAGE',
    'WORK TO BE COMPLETED / RECOMMENDATION', 'OWNERSHIP / INSURABLE INTEREST'
  ];

  let skipPreamble = true; // Skip any preamble text at the start

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines - add a small spacing
    if (!trimmed) {
      paragraphs.push(new Paragraph({ text: "", spacing: { after: 80 } }));
      continue;
    }

    // Skip separator lines
    if (trimmed === '---' || trimmed === '___' || trimmed === '...') {
      paragraphs.push(new Paragraph({ text: "", spacing: { after: 150 } }));
      continue;
    }

    // Skip preamble text (first few lines that might be meta-commentary)
    if (skipPreamble && isPreambleText(trimmed)) {
      continue;
    }

    // Check if it's a bullet point (*, -, or + at start)
    const bulletMatch = trimmed.match(/^[\*\-\+]\s+(.+)$/);
    if (bulletMatch) {
      skipPreamble = false;
      const bulletText = bulletMatch[1];
      paragraphs.push(new Paragraph({
        children: parseMarkdownToRuns(bulletText),
        bullet: { level: 0 },
        spacing: { after: 80, line: 276 }
      }));
      continue;
    }

    // Check if it's a numbered list (1., 2., etc.)
    const numberMatch = trimmed.match(/^([0-9]+)\.\s+(.+)$/);
    if (numberMatch) {
      skipPreamble = false;
      const listText = numberMatch[2];
      paragraphs.push(new Paragraph({
        children: parseMarkdownToRuns(listText),
        numbering: { reference: "default-numbering", level: 0 },
        spacing: { after: 80, line: 276 }
      }));
      continue;
    }

    // Check if it's a major section header (without markdown)
    const cleanedForHeader = trimmed.replace(/\*\*/g, '');
    const isHeader = sectionHeaders.some(header =>
      cleanedForHeader.toUpperCase() === header ||
      cleanedForHeader.toUpperCase().startsWith(header + ':') ||
      cleanedForHeader.toUpperCase() === header + ':'
    );

    // Once we hit actual content, stop skipping
    if (isHeader || cleanedForHeader.match(/^[A-Z][A-Z\s]+:?$/)) {
      skipPreamble = false;
    }

    // Format major section headers
    if (isHeader) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({
          text: cleanedForHeader,
          bold: true,
          size: 22,  // 11pt
          allCaps: false
        })],
        spacing: { before: 240, after: 120 }
      }));
    }
    // Format subsections (ends with :)
    else if (trimmed.endsWith(':') && trimmed.length < 80 && !trimmed.includes('\n')) {
      const cleanedSubsection = trimmed.replace(/\*\*/g, '');
      paragraphs.push(new Paragraph({
        children: [new TextRun({
          text: cleanedSubsection,
          bold: true,
          size: 20  // 10pt
        })],
        spacing: { before: 120, after: 80 }
      }));
    }
    // Regular paragraph with markdown parsing
    else {
      paragraphs.push(new Paragraph({
        children: parseMarkdownToRuns(trimmed),
        spacing: {
          after: 80,
          line: 276  // 1.15 line spacing
        },
        alignment: AlignmentType.LEFT
      }));
    }
  }

  return paragraphs;
}

/**
 * Generate PDF document from report content with professional formatting
 */
function generatePDF(reportData, aiContent) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 72,  // 1 inch margins
        size: 'LETTER'
      });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          success: true,
          buffer: buffer,
          fileName: `${reportData.claimNumber}_${reportData.reportType}_${Date.now()}.pdf`
        });
      });

      // Header
      doc.fontSize(26)
         .fillColor('#FF7C08')
         .font('Helvetica-Bold')
         .text('FLACRONAI', { align: 'center' });

      doc.fontSize(16)
         .fillColor('#000000')
         .font('Helvetica')
         .text('Insurance Inspection Report', { align: 'center' });

      doc.moveDown(1.5);

      // Report Information Box with better formatting
      doc.fontSize(11)
         .fillColor('#0d6efd')
         .font('Helvetica-Bold')
         .text('REPORT INFORMATION', { underline: true });

      doc.moveDown(0.3);

      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica')
         .text(`Claim Number: ${reportData.claimNumber || 'N/A'}`)
         .text(`Insured Name: ${reportData.insuredName || 'N/A'}`)
         .text(`Property Address: ${reportData.propertyAddress || 'N/A'}`)
         .text(`Loss Date: ${reportData.lossDate || 'N/A'}`)
         .text(`Loss Type: ${reportData.lossType || 'N/A'}`)
         .text(`Report Type: ${reportData.reportType || 'N/A'}`)
         .text(`Report Date: ${new Date().toLocaleDateString()}`);

      doc.moveDown(1.5);

      // Content Section with better formatting
      doc.fontSize(11)
         .fillColor('#0d6efd')
         .font('Helvetica-Bold')
         .text('REPORT CONTENT', { underline: true });

      doc.moveDown(0.5);

      // Clean and format the content
      formatPDFContent(doc, aiContent);

      // Footer
      doc.moveDown(2);
      doc.fontSize(8)
         .fillColor('#888888')
         .font('Helvetica-Oblique')
         .text('Generated with FlacronAI - https://flacronai.com', { align: 'center' })
         .text('Powered by Google Gemini AI', { align: 'center' });

      doc.end();
    } catch (error) {
      console.error('PDF generation error:', error);
      reject({
        success: false,
        error: error.message
      });
    }
  });
}

/**
 * Render text with markdown bold formatting in PDF
 */
function renderMarkdownTextPDF(doc, text, options = {}) {
  const fontSize = options.fontSize || 10;
  const indent = options.indent || 0;
  const lineGap = options.lineGap || 2;

  doc.fontSize(fontSize).fillColor('#000000');

  // Split text by bold markers
  const parts = [];
  let currentPos = 0;
  const boldRegex = /(\*\*|__)(.*?)\1/g;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before bold
    if (match.index > currentPos) {
      parts.push({ text: text.substring(currentPos, match.index), bold: false });
    }
    // Add bold text
    parts.push({ text: match[2], bold: true });
    currentPos = match.index + match[0].length;
  }

  // Add remaining text
  if (currentPos < text.length) {
    parts.push({ text: text.substring(currentPos), bold: false });
  }

  // If no markdown found, render as plain text
  if (parts.length === 0) {
    doc.font('Helvetica').text(text, { indent, lineGap, align: 'left' });
    return;
  }

  // Render parts with mixed formatting
  const startX = doc.x + indent;
  const startY = doc.y;
  let currentX = startX;
  const maxWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right - indent;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const font = part.bold ? 'Helvetica-Bold' : 'Helvetica';
    doc.font(font);

    // Measure text width
    const textWidth = doc.widthOfString(part.text);

    // Check if we need to wrap to next line
    if (currentX + textWidth > startX + maxWidth && currentX > startX) {
      doc.text('');  // Move to next line
      currentX = startX;
    }

    // Render the text part
    doc.text(part.text, currentX, doc.y, {
      continued: i < parts.length - 1,
      lineBreak: false
    });

    currentX += textWidth;
  }

  // Finish the line
  doc.text('');
}

/**
 * Format PDF content with proper headings, bullets, and formatting
 */
function formatPDFContent(doc, aiContent) {
  // Don't clean markdown - preserve formatting
  const lines = aiContent.split('\n');

  const sectionHeaders = [
    'REMARKS', 'RISK', 'ITV', 'OCCURRENCE', 'COVERAGE', 'DWELLING DAMAGE',
    'OTHER STRUCTURES DAMAGE', 'CONTENTS DAMAGE', 'ALE', 'FMV', 'SUBROGATION',
    'SALVAGE', 'WORK TO BE COMPLETED', 'RECOMMENDATION', 'ASSIGNMENT',
    'INSURED', 'OWNERSHIP', 'LOSS AND ORIGIN', 'DAMAGES', 'DWELLING',
    'ROOF', 'EXTERIOR', 'INTERIOR', 'OTHER STRUCTURES', 'EXPERTS',
    'OFFICIAL REPORTS', 'ACTION PLAN', 'DIARY DATE', 'MORTGAGEE',
    'INSURABLE INTEREST', 'ALE / FMV CLAIM', 'SUBROGATION / SALVAGE',
    'WORK TO BE COMPLETED / RECOMMENDATION'
  ];

  let skipPreamble = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line || line === '---' || line === '___') {
      doc.moveDown(0.3);
      continue;
    }

    // Skip preamble text
    if (isPreambleText(line)) {
      continue;
    }

    // Check if it's a bullet point (*, -, or + at start)
    const bulletMatch = line.match(/^[\*\-\+]\s+(.+)$/);
    if (bulletMatch) {
      skipPreamble = false;
      const bulletText = bulletMatch[1];
      doc.fontSize(10).fillColor('#000000').font('Helvetica');
      doc.text('• ', { continued: false });
      renderMarkdownTextPDF(doc, bulletText, { indent: 15, lineGap: 2 });
      doc.moveDown(0.1);
      continue;
    }

    // Check if it's a numbered list (1., 2., etc.)
    const numberMatch = line.match(/^([0-9]+)\.\s+(.+)$/);
    if (numberMatch) {
      skipPreamble = false;
      const number = numberMatch[1];
      const listText = numberMatch[2];
      doc.fontSize(10).fillColor('#000000').font('Helvetica');
      doc.text(`${number}. `, { continued: false });
      renderMarkdownTextPDF(doc, listText, { indent: 20, lineGap: 2 });
      doc.moveDown(0.1);
      continue;
    }

    // Check if it's a major section header (without markdown)
    const cleanedForHeader = line.replace(/\*\*/g, '');
    const isHeader = sectionHeaders.some(header =>
      cleanedForHeader.toUpperCase() === header ||
      cleanedForHeader.toUpperCase().startsWith(header + ':') ||
      cleanedForHeader.toUpperCase().startsWith(header)
    );

    // Once we hit actual content, stop skipping
    if (isHeader || cleanedForHeader.match(/^[A-Z][A-Z\s]+:?$/)) {
      skipPreamble = false;
    }

    if (isHeader) {
      doc.moveDown(0.5);
      doc.fontSize(11)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(cleanedForHeader);
      doc.moveDown(0.3);
    }
    // Check if it's a subsection (ends with :)
    else if (line.endsWith(':') && line.length < 80) {
      const cleanedSubsection = line.replace(/\*\*/g, '');
      doc.moveDown(0.2);
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(cleanedSubsection);
      doc.moveDown(0.1);
    }
    // Regular paragraph with markdown parsing
    else {
      renderMarkdownTextPDF(doc, line, { lineGap: 2 });
    }
  }
}

/**
 * Generate HTML version of report
 */
function generateHTML(reportData, aiContent) {
  // Clean markdown from AI content
  const cleanedContent = cleanMarkdown(aiContent);

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Insurance Report - ${reportData.claimNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #FF7C08;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #FF7C08;
            font-size: 32px;
            margin-bottom: 10px;
        }
        .header h2 {
            color: #0d6efd;
            font-size: 24px;
        }
        .info-section {
            background: #f8f9fa;
            padding: 20px;
            border-left: 4px solid #0d6efd;
            margin-bottom: 30px;
        }
        .info-section h3 {
            color: #0d6efd;
            margin-bottom: 15px;
        }
        .info-row {
            display: flex;
            margin-bottom: 10px;
        }
        .info-label {
            font-weight: bold;
            min-width: 150px;
            color: #555;
        }
        .info-value {
            color: #333;
        }
        .content-section {
            margin-top: 30px;
        }
        .content-section h3 {
            color: #0d6efd;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .content-text {
            text-align: justify;
            white-space: pre-line;
            line-height: 1.8;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #666;
            font-size: 12px;
            font-style: italic;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
        }
        @media print {
            body {
                background: white;
            }
            .container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>FLACRONAI</h1>
            <h2>Insurance Inspection Report</h2>
        </div>

        <div class="info-section">
            <h3>Report Information</h3>
            <div class="info-row">
                <div class="info-label">Claim Number:</div>
                <div class="info-value">${reportData.claimNumber || 'N/A'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Insured Name:</div>
                <div class="info-value">${reportData.insuredName || 'N/A'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Property Address:</div>
                <div class="info-value">${reportData.propertyAddress || 'N/A'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Loss Date:</div>
                <div class="info-value">${reportData.lossDate || 'N/A'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Loss Type:</div>
                <div class="info-value">${reportData.lossType || 'N/A'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Report Type:</div>
                <div class="info-value">${reportData.reportType || 'N/A'}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Report Date:</div>
                <div class="info-value">${new Date().toLocaleDateString()}</div>
            </div>
        </div>

        <div class="content-section">
            <h3>Report Content</h3>
            <div class="content-text">${cleanedContent}</div>
        </div>

        <div class="footer">
            <p>Generated with FlacronAI - <a href="https://flacronai.com">https://flacronai.com</a></p>
            <p>Powered by Google Gemini AI</p>
        </div>
    </div>
</body>
</html>
  `;

  return {
    success: true,
    html: htmlContent,
    fileName: `${reportData.claimNumber}_${reportData.reportType}_${Date.now()}.html`
  };
}

module.exports = {
  generateDOCX,
  generatePDF,
  generateHTML
};
