import jsPDF from 'jspdf';

export const generateUserManual = async (): Promise<Blob> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
    
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    });
    yPosition += 5;
  };

  const addHeading = (text: string, level: number = 1) => {
    yPosition += 10;
    const fontSize = level === 1 ? 24 : level === 2 ? 18 : 14;
    addText(text, fontSize, true);
    yPosition += 5;
  };

  // Cover Page
  pdf.setFontSize(32);
  pdf.setFont('helvetica', 'bold');
  pdf.text('UNI-COM', pageWidth / 2, 50, { align: 'center' });
  
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'normal');
  pdf.text('User Manual', pageWidth / 2, 65, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.text('Universal Communication for All Abilities', pageWidth / 2, 80, { align: 'center' });
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 90, { align: 'center' });

  pdf.addPage();
  yPosition = margin;

  // Content sections
  addHeading('1. Welcome to UNI-COM', 1);
  addText('UNI-COM is a universal communication platform designed to enable seamless conversations between people of all abilities.');
  
  addHeading('2. Getting Started', 1);
  addText('Create an account, choose your ability profile, and start communicating.');
  
  addHeading('3. Features', 1);
  addText('• Auto-translation based on abilities');
  addText('• Voice input and text-to-speech');
  addText('• Braille input for deaf-blind users');
  addText('• Haptic feedback patterns');
  addText('• Guest chat mode');
  addText('• AI demo assistant');

  return pdf.output('blob');
};
