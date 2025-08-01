import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';

export interface SettingsHistory {
  brandName: string;
  logo: string;
  primaryColor: string;
}

@Component({
  selector: 'app-settings-history-dialog',
  templateUrl: './settings-history-dialog.component.html',
  styleUrls: ['./settings-history-dialog.component.css'],
  standalone: true,
  imports: [MatListModule, CommonModule],
})
export class SettingsHistoryDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SettingsHistoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { history: SettingsHistory[] }
  ) {}

  onSelect(setting: SettingsHistory): void {
    this.dialogRef.close(setting);
  }
}
