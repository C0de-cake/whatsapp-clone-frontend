import {Component, EventEmitter, Output} from '@angular/core';
import {FaIconComponent} from "@fortawesome/angular-fontawesome";

@Component({
  selector: 'wac-media',
  standalone: true,
  imports: [
    FaIconComponent
  ],
  templateUrl: './media.component.html',
  styleUrl: './media.component.scss'
})
export class MediaComponent {

  @Output() onUpload = new EventEmitter<File>();

  private extractFileFromTarget(target: EventTarget | null): File | null {
   const htmlInputTarget = target as HTMLInputElement;
   if(target === null || htmlInputTarget.files === null) {
     return null;
   }
   return htmlInputTarget.files[0];
  }

  onUploadFile(target: EventTarget | null) {
    const file = this.extractFileFromTarget(target);
    if(file !== null) {
      this.onUpload.emit(file);
    }
  }
}
