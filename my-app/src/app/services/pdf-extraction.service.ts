import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker - critical for PDF.js to work
// PDF.js uses a Web Worker to process PDFs on a separate thread,
// preventing the main UI from freezing during heavy PDF parsing.
// We use the local worker file bundled with pdfjs-dist.
pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/pdfjs/pdf.worker.mjs';

export interface PdfExtractionProgress {
  currentPage: number;
  totalPages: number;
  text: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfExtractionService {
  
  /**
   * Extract all text from a PDF file
   * @param file - The PDF file to extract text from
   * @param onProgress - Callback function to track progress
   * @returns Promise resolving to the extracted text
   */
  async extractText(
    file: File,
    onProgress?: (progress: PdfExtractionProgress) => void
  ): Promise<string> {
    try {
      // Read the file as an ArrayBuffer
      const arrayBuffer = await this.readFileAsArrayBuffer(file);
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      const totalPages = pdf.numPages;
      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        console.log(`Page ${pageNum} - items count:`, textContent.items.length);
        console.log(`Page ${pageNum} - first item:`, textContent.items[0]);
        
        // Concatenate all text items from the page
        const pageText = textContent.items
          .map((item: any) => {
            // PDF.js text items have a 'str' property
            if ('str' in item) {
              return item.str;
            }
            // Fallback: check if item itself is a string
            if (typeof item === 'string') {
              return item;
            }
            console.warn('Unexpected item format:', item);
            return '';
          })
          .join(' ');
        
        console.log(`Page ${pageNum} - extracted text length:`, pageText.length);
        console.log(`Page ${pageNum} - first 100 chars:`, pageText.substring(0, 100));
        
        // Add page separator for readability
        fullText += pageText + '\n\n';
        
        // Report progress if callback provided
        if (onProgress) {
          onProgress({
            currentPage: pageNum,
            totalPages: totalPages,
            text: fullText
          });
        }
      }
      
      // Clean up the text
      return this.cleanText(fullText);
      
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Read a file as ArrayBuffer
   */
  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }
  
  /**
   * Clean up extracted text
   * - Remove excessive whitespace
   * - Preserve paragraph breaks
   * - Normalize line endings
   */
  private cleanText(text: string): string {
    return text
      // Replace multiple spaces with single space
      .replace(/ +/g, ' ')
      // Replace more than 2 newlines with 2 newlines
      .replace(/\n{3,}/g, '\n\n')
      // Trim whitespace from each line
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      // Trim the entire text
      .trim();
  }
}
