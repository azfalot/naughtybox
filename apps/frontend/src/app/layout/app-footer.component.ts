import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="site-footer">
      <div class="footer-grid">
        <div>
          <strong>Naughtybox</strong>
          <p>
            Copyright (c) 2026 Naughtybox. All rights reserved. Branding, interface, software, layout systems and
            platform assets are protected intellectual property.
          </p>
        </div>

        <div class="footer-links footer-links-column">
          <strong>Trust & Safety</strong>
          <a routerLink="/legal/18plus">Safety & consent</a>
          <a routerLink="/legal/terms">Terminos</a>
          <a routerLink="/legal/privacy">Privacidad</a>
          <a routerLink="/legal/cookies">Cookies</a>
        </div>

        <div class="footer-links footer-links-column">
          <strong>Support</strong>
          <a routerLink="/help">Help center</a>
          <a routerLink="/legal/support">Support</a>
          <a routerLink="/legal/security">Security center</a>
          <a routerLink="/legal/billing">Billing & tokens</a>
          <a routerLink="/legal/disable-account">Disable account</a>
        </div>

        <div class="footer-links footer-links-column">
          <strong>Compliance</strong>
          <a routerLink="/legal/18plus">Report abuse</a>
          <a routerLink="/legal/dmca">DMCA / remove content</a>
          <a routerLink="/legal/law-enforcement">Law enforcement</a>
          <a routerLink="/legal/creators">Payouts</a>
        </div>
      </div>
      <p class="muted footer-note">
        Demo environment for product validation. Third-party content is not embedded or redistributed.
      </p>
    </footer>
  `,
})
export class AppFooterComponent {}
