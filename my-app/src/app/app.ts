import { Component } from '@angular/core';
import { PdfConverterComponent } from './components/pdf-converter.component';

@Component({
  selector: 'app-root',
  imports: [PdfConverterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
