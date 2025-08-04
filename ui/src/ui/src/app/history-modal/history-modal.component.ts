import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppSetting } from '../app-settings.interface';
import { AppSettingsService } from '../app-settings.service';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-history-modal',
  templateUrl: './history-modal.component.html',
  styleUrls: ['./history-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
})
export class HistoryModalComponent implements OnInit, OnDestroy {
  historySettings$: Observable<AppSetting[]>;
  private destroy$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<HistoryModalComponent>,
    private appSettingsService: AppSettingsService
  ) {
    this.historySettings$ = this.appSettingsService.historySettings$;
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applySetting(setting: AppSetting): void {
    this.dialogRef.close(setting);
  }

  deleteSetting(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.appSettingsService.deleteSettingFromHistory(id);
  }
}
