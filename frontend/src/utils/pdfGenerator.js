import jsPDF from 'jspdf';

export function generatePDF(markdownContent, title = 'Legal Report') {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let y = margin;

    // Colors
    const goldColor = [218, 165, 32];
    const darkBlue = [26, 27, 30];
    const textColor = [50, 50, 50];
    const lightGray = [120, 120, 120];
    const accentBlue = [66, 99, 235];

    // Header background
    doc.setFillColor(...darkBlue);
    doc.rect(0, 0, pageWidth, 45, 'F');

    // Gold accent line
    doc.setDrawColor(...goldColor);
    doc.setLineWidth(0.8);
    doc.line(margin, 45, pageWidth - margin, 45);

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('NyayaVaad', margin, 18);

    doc.setTextColor(...goldColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('AI LEGAL ASSISTANT', margin, 24);

    // Report title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const reportTitle = title.length > 60 ? title.substring(0, 57) + '...' : title;
    doc.text(reportTitle, margin, 34);

    // Date
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const dateStr = new Date().toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    doc.text(`Generated: ${dateStr}`, pageWidth - margin, 34, { align: 'right' });

    y = 55;

    // Parse markdown content
    const lines = markdownContent.split('\n');

    const checkPageBreak = (requiredSpace = 10) => {
        if (y + requiredSpace > pageHeight - margin) {
            doc.addPage();
            y = margin;

            // Light header on subsequent pages
            doc.setFillColor(245, 245, 245);
            doc.rect(0, 0, pageWidth, 12, 'F');
            doc.setTextColor(...lightGray);
            doc.setFontSize(7);
            doc.text('NyayaVaad - AI Legal Assistant | Confidential', margin, 8);
            doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - margin, 8, { align: 'right' });

            // Line
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.3);
            doc.line(margin, 12, pageWidth - margin, 12);

            y = 18;
        }
    };

    lines.forEach((line) => {
        const trimmed = line.trim();

        if (!trimmed) {
            y += 3;
            return;
        }

        // Headers
        if (trimmed.startsWith('# ')) {
            checkPageBreak(15);
            y += 5;
            doc.setTextColor(...accentBlue);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            const headerText = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '');
            doc.text(headerText, margin, y);
            y += 3;
            doc.setDrawColor(...goldColor);
            doc.setLineWidth(0.5);
            doc.line(margin, y, margin + 40, y);
            y += 6;
            return;
        }

        if (trimmed.startsWith('## ')) {
            checkPageBreak(12);
            y += 4;
            doc.setTextColor(...accentBlue);
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            const headerText = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '');
            doc.text(headerText, margin, y);
            y += 2;
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.3);
            doc.line(margin, y, pageWidth - margin, y);
            y += 5;
            return;
        }

        if (trimmed.startsWith('### ')) {
            checkPageBreak(10);
            y += 3;
            doc.setTextColor(...darkBlue);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            const headerText = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '');
            doc.text(headerText, margin, y);
            y += 5;
            return;
        }

        // Bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            checkPageBreak(8);
            doc.setTextColor(...textColor);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');

            const bulletText = trimmed.replace(/^[-*]\s*/, '').replace(/\*\*/g, '');
            const splitText = doc.splitTextToSize(bulletText, contentWidth - 10);

            // Gold bullet
            doc.setFillColor(...goldColor);
            doc.circle(margin + 2, y - 1.2, 1, 'F');

            splitText.forEach((textLine, i) => {
                checkPageBreak(5);
                doc.text(textLine, margin + 7, y);
                y += 4.5;
            });
            y += 1;
            return;
        }

        // Numbered list
        if (/^\d+\./.test(trimmed)) {
            checkPageBreak(8);
            doc.setTextColor(...textColor);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');

            const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
            if (numMatch) {
                const num = numMatch[1];
                const text = numMatch[2].replace(/\*\*/g, '');
                const splitText = doc.splitTextToSize(text, contentWidth - 12);

                doc.setTextColor(...accentBlue);
                doc.setFont('helvetica', 'bold');
                doc.text(`${num}.`, margin, y);

                doc.setTextColor(...textColor);
                doc.setFont('helvetica', 'normal');
                splitText.forEach((textLine) => {
                    checkPageBreak(5);
                    doc.text(textLine, margin + 8, y);
                    y += 4.5;
                });
                y += 1;
            }
            return;
        }

        // Regular text
        checkPageBreak(8);
        doc.setTextColor(...textColor);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        const cleanText = trimmed.replace(/\*\*/g, '').replace(/\*/g, '');
        const splitText = doc.splitTextToSize(cleanText, contentWidth);

        splitText.forEach((textLine) => {
            checkPageBreak(5);
            doc.text(textLine, margin, y);
            y += 4.5;
        });
        y += 1;
    });

    // Footer on last page
    y = pageHeight - 15;
    doc.setDrawColor(...goldColor);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);

    doc.setTextColor(...lightGray);
    doc.setFontSize(7);
    doc.text('DISCLAIMER: This report is AI-generated for informational purposes only. It does not constitute legal advice.', margin, y + 4);
    doc.text('Always consult a qualified legal professional before taking any legal action.', margin, y + 8);
    doc.text(`© ${new Date().getFullYear()} NyayaVaad - AI Legal Assistant`, pageWidth - margin, y + 4, { align: 'right' });

    // Save
    const fileName = `NyayaVaad_Legal_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
}
