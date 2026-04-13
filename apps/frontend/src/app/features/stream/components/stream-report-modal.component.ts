import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppIconComponent } from '../../../ui/icons/app-icon.component';

@Component({
  selector: 'app-stream-report-modal',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  template: `
    <section class="modal-backdrop" *ngIf="open">
      <div class="panel-card access-modal report-modal">
        <div class="profile-section-header">
          <div>
            <p class="eyebrow">Trust & Safety</p>
            <h2 class="mini-title">Reportar sala</h2>
          </div>
          <button
            type="button"
            class="icon-button icon-button-compact modal-close-button"
            (click)="close.emit()"
            aria-label="Cerrar modal"
          >
            <app-icon name="close" [size]="14"></app-icon>
          </button>
        </div>
        <form class="report-form" (submit)="submit.emit($event)">
          <label>
            <span>Motivo</span>
            <select name="reason">
              <option value="creator_misconduct">Creator misconduct</option>
              <option value="harassment">Harassment</option>
              <option value="fraud">Fraud / payment abuse</option>
              <option value="copyright">Copyright / DMCA</option>
              <option value="dangerous_behavior">Dangerous behavior</option>
              <option value="non_consensual_content">Non-consensual content</option>
              <option value="underage_risk">Underage risk</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            <span>Detalle</span>
            <textarea name="details" rows="4" placeholder="Describe lo ocurrido"></textarea>
          </label>
          <div class="studio-actions">
            <button type="button" class="action-button action-button-ghost" (click)="close.emit()">Cancelar</button>
            <button type="submit" class="action-button action-button-warn">Enviar reporte</button>
          </div>
        </form>
      </div>
    </section>
  `,
})
export class StreamReportModalComponent {
  @Input() open = false;
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly submit = new EventEmitter<Event>();
}
