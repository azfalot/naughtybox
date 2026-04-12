import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CreatorRoom } from '@naughtybox/shared-types';

@Component({
  selector: 'app-creator-room-form-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="panel-card" *ngIf="room">
      <h2 class="mini-title">Sala publica</h2>
      <form class="studio-form" (submit)="save.emit($event)">
        <label><span>Titulo</span><input name="title" [value]="room.title" /></label>
        <label>
          <span>Acceso</span>
          <select name="accessMode">
            <option value="public" [selected]="room.accessMode === 'public'">Public show</option>
            <option value="premium_membership_required" [selected]="room.accessMode === 'premium_membership_required'">
              Premium membership
            </option>
            <option value="ticketed_event" [selected]="room.accessMode === 'ticketed_event'">Ticketed event</option>
            <option value="private_exclusive" [selected]="room.accessMode === 'private_exclusive'">
              Private exclusive
            </option>
          </select>
        </label>
        <label>
          <span>Chat</span>
          <select name="chatMode">
            <option value="registered" [selected]="room.chatMode === 'registered'">Registered</option>
            <option value="members" [selected]="room.chatMode === 'members'">Members</option>
            <option value="tippers" [selected]="room.chatMode === 'tippers'">Tippers</option>
            <option value="ticket_holders" [selected]="room.chatMode === 'ticket_holders'">Ticket holders</option>
            <option value="private_only" [selected]="room.chatMode === 'private_only'">Private only</option>
          </select>
        </label>
        <label><span>Tags</span><input name="tags" [value]="room.tags.join(', ')" /></label>
        <label
          ><span>Precio privado</span><input name="privateEntryTokens" type="number" min="1" [value]="room.privateEntryTokens"
        /></label>
        <label
          ><span>Precio mensual</span><input name="memberMonthlyTokens" type="number" min="1" [value]="room.memberMonthlyTokens"
        /></label>
        <label
          ><span>Ticket evento</span><input name="eventTicketPrice" type="number" min="1" [value]="room.eventTicketPrice"
        /></label>
        <label class="checkbox-row"
          ><input name="goalEnabled" type="checkbox" [checked]="room.goalEnabled" /><span>Activar goals por sesion</span></label
        >
        <label class="checkbox-row"
          ><input name="allowMemberEventAccess" type="checkbox" [checked]="room.allowMemberEventAccess" /><span
            >Miembros entran al evento sin ticket extra</span
          ></label
        >
        <label class="checkbox-row"
          ><input name="hiddenWhilePreparing" type="checkbox" [checked]="room.hiddenWhilePreparing" /><span
            >Ocultar sala mientras preparo la emision</span
          ></label
        >
        <label class="studio-span"><span>Descripcion</span><textarea name="description">{{ room.description }}</textarea></label>
        <label class="studio-span"
          ><span>Reglas de la sala</span
          ><textarea name="roomRules" placeholder="Ej. Respeto, no spam, acepta las normas antes de escribir.">{{
            room.roomRules ?? ''
          }}</textarea></label
        >
        <button type="submit">Guardar sala</button>
      </form>
    </section>
  `,
})
export class CreatorRoomFormSectionComponent {
  @Input() room: CreatorRoom | null = null;
  @Output() readonly save = new EventEmitter<Event>();
}