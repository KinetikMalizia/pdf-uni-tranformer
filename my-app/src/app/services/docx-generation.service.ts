import { Injectable } from '@angular/core';
import { Document, Paragraph, TextRun, Packer } from 'docx';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class DocxGenerationService {

  /**
   * Generate a DOCX file from text content
   * @param text - The text content to include in the document
   * @param filename - The name for the output file (without extension)
   * @returns Promise resolving to the generated Blob
   */
  async generateDocx(text: string, filename: string = 'converted-document'): Promise<Blob> {
    try {
      console.log('DOCX Generation - Input text length:', text.length);
      console.log('DOCX Generation - First 200 chars:', text.substring(0, 200));

      if (!text || text.trim().length === 0) {
        throw new Error('Cannot generate DOCX from empty text');
      }

      // Split text into paragraphs (by double newlines or single newlines)
      const paragraphs = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0) // Remove empty lines
        .map(line => 
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: 24, // 12pt font (size is in half-points)
              })
            ],
            spacing: {
              after: 200, // Spacing after paragraph
            }
          })
        );

      console.log('DOCX Generation - Number of paragraphs:', paragraphs.length);

      // Create the document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      // Generate the DOCX file as a Blob
      const blob = await Packer.toBlob(doc);
      console.log('DOCX Generation - Blob size:', blob.size);
      return blob;
      
    } catch (error) {
      console.error('Error generating DOCX:', error);
      throw new Error(`Failed to generate DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate and immediately download a DOCX file
   * @param text - The text content to include in the document
   * @param filename - The name for the output file (without extension)
   */
  async generateAndDownload(text: string, filename: string = 'converted-document'): Promise<void> {
    try {
      const blob = await this.generateDocx(text, filename);
      
      // Trigger download using file-saver
      saveAs(blob, `${filename}.docx`);
      
    } catch (error) {
      console.error('Error downloading DOCX:', error);
      throw error;
    }
  }
}
