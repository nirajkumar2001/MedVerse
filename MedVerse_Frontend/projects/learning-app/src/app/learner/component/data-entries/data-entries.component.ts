import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-data-entries',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-entries.component.html',
  styleUrl: './data-entries.component.css'
})
export class DataEntriesComponent {
  
 @Input() stats: any[] = [];  // ✅ incoming data
  @Input() cases: any;   // optional if you have table data

}
