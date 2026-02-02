import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfExtractionService, PdfExtractionProgress } from '../services/pdf-extraction.service';
import { DocxGenerationService } from '../services/docx-generation.service';

// Maximum file size: 25MB
const MAX_FILE_SIZE = 25 * 1024 * 1024;

@Component({
  selector: 'app-pdf-converter',
  imports: [CommonModule],
  templateUrl: './pdf-converter.component.html',
  styleUrl: './pdf-converter.component.css'
})
export class PdfConverterComponent {
  // Signals for reactive state management
  selectedFile = signal<File | null>(null);
  isProcessing = signal(false);
  progress = signal<PdfExtractionProgress | null>(null);
  errorMessage = signal<string | null>(null);
  extractedText = signal<string>('');
  isComplete = signal(false);

  constructor(
    private pdfService: PdfExtractionService,
    private docxService: DocxGenerationService
  ) {}

  /**
   * Handle file selection from input
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    // Reset state
    this.resetState();

    if (!file) {
      return;
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      this.errorMessage.set('Please select a valid PDF file.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      this.errorMessage.set(`File size exceeds 25MB limit. Selected file: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    this.selectedFile.set(file);
  }

  /**
   * Convert the PDF to DOCX
   */
  async convertPdfToDocx(): Promise<void> {
    const file = this.selectedFile();
    
    if (!file) {
      this.errorMessage.set('No file selected.');
      return;
    }

    try {
      this.isProcessing.set(true);
      this.errorMessage.set(null);

      // Extract text from PDF
      const text = await this.pdfService.extractText(file, (progress) => {
        this.progress.set(progress);
      });

      console.log('Extracted text length:', text.length);
      console.log('First 200 chars:', text.substring(0, 200));

      this.extractedText.set(text);

      if (!text || text.trim().length === 0) {
        throw new Error('No text could be extracted from the PDF. The PDF might be scanned images or protected.');
      }

      // Generate DOCX and trigger download
      const filename = file.name.replace('.pdf', '');
      await this.docxService.
      generateAndDownload(text, filename);

      this.isComplete.set(true);
      this.isProcessing.set(false);

    } catch (error) {
      console.error('Conversion error:', error);
      this.errorMessage.set(error instanceof Error ? error.message : 'An unknown error occurred.');
      this.isProcessing.set(false);
    }
  }

  /**
   * Reset component state
   */
  resetState(): void {
    this.selectedFile.set(null);
    this.isProcessing.set(false);
    this.progress.set(null);
    this.errorMessage.set(null);
    this.extractedText.set('');
    this.isComplete.set(false);
  }

  /**
   * Start a new conversion
   */
  startNew(): void {
    this.resetState();
    // Reset file input
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Get formatted file size
   */
  getFileSize(file: File): string {
    const sizeInMB = file.size / 1024 / 1024;
    return sizeInMB < 1 
      ? `${(file.size / 1024).toFixed(2)} KB`
      : `${sizeInMB.toFixed(2)} MB`;
  }
}
