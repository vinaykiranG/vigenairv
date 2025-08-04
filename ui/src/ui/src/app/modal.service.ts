import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { HistoryModalComponent } from './history-modal/history-modal.component';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  constructor(private dialog: MatDialog) {}

  openHistoryModal() {
    return this.dialog.open(HistoryModalComponent, {
      width: '600px',
      maxHeight: '80vh',
      panelClass: 'custom-history-modal',
    });
  }
}
