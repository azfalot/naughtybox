import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

type LegalSection = {
  title: string;
  eyebrow: string;
  intro: string;
  items: string[];
};

const CONTENT: Record<string, LegalSection> = {
  terms: {
    eyebrow: 'Legal',
    title: 'Términos básicos de uso',
    intro: 'Naughtybox debe operar con reglas claras para viewers, creadoras y moderación desde el primer día.',
    items: [
      'Acceso reservado a mayores de edad y contenido dirigido exclusivamente a adultos.',
      'Cada usuario responde del contenido que sube, transmite o vende y debe contar con todos los derechos y consentimientos necesarios.',
      'La plataforma necesita normas claras contra contenido no consentido, suplantación, menores, violencia y actividades ilegales.',
      'Las condiciones deben explicar cuándo podemos suspender cuentas, retirar contenido y colaborar con autoridades.',
    ],
  },
  privacy: {
    eyebrow: 'Datos',
    title: 'Privacidad y protección de datos',
    intro: 'Tratamos credenciales, chats, pagos, métricas y datos de creadoras; eso exige una base de privacidad sólida.',
    items: [
      'Debemos informar de forma clara sobre responsable, finalidades, base jurídica, plazos y derechos de las personas usuarias.',
      'Hace falta registro interno de tratamientos, control de accesos, cifrado razonable y minimización de datos.',
      'La verificación de edad e identidad de creadoras exige medidas reforzadas y revisión de riesgos.',
      'Antes de producción conviene realizar una EIPD porque hay tratamiento sensible, monitorización y alto riesgo reputacional.',
    ],
  },
  cookies: {
    eyebrow: 'Cookies',
    title: 'Cookies y tecnologías similares',
    intro: 'Para analítica, personalización y publicidad no basta con avisar: hay que gestionar consentimiento correctamente.',
    items: [
      'Las cookies no necesarias deben esperar a consentimiento válido.',
      'El banner debe permitir aceptar y rechazar en condiciones equivalentes.',
      'Hace falta una política de cookies separada y un panel para revisar preferencias.',
      'Si usamos herramientas de terceros, también hay que documentar transferencias y proveedores.',
    ],
  },
  '18plus': {
    eyebrow: 'Acceso',
    title: 'Acceso 18+ y seguridad',
    intro: 'En una plataforma para adultos la protección de menores no es opcional; debe diseñarse desde el principio.',
    items: [
      'La web necesita puerta 18+ visible y medidas más robustas si abrimos a público general.',
      'Hay que establecer mecanismos para reportar contenido, bloquear cuentas y responder a incidencias.',
      'Las creadoras deben pasar verificación de edad, identidad y consentimiento antes de publicar.',
      'Debemos poder demostrar trazabilidad de moderación, retiros, reclamaciones y consentimientos.',
    ],
  },
  creators: {
    eyebrow: 'Studio',
    title: 'Guía básica para creadoras en España',
    intro: 'Queremos que el Studio aporte valor real: no solo editar perfil, también entender cobros, obligaciones y buenas prácticas.',
    items: [
      'Paneles con métricas útiles: followers, visibilidad, conversión, propinas, tokens y evolución semanal.',
      'Guías claras sobre payouts, comisiones, tiempos de retención y soporte.',
      'Checklist de onboarding: identidad, mayoría de edad, consentimiento, fiscalidad y configuración de sala.',
      'Contenido orientativo para España sobre alta, facturación y declaración de ingresos, siempre recomendando validación profesional.',
    ],
  },
};

@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="page page-wide legal-page">
      <a class="muted back-link" routerLink="/">Volver al lobby</a>

      <section class="panel-card legal-hero">
        <p class="eyebrow">{{ section().eyebrow }}</p>
        <h1 class="lobby-title">{{ section().title }}</h1>
        <p class="muted legal-intro">{{ section().intro }}</p>
      </section>

      <section class="legal-grid">
        <article class="panel-card legal-card" *ngFor="let item of section().items; index as i">
          <span class="legal-step">{{ i + 1 }}</span>
          <p>{{ item }}</p>
        </article>
      </section>
    </main>
  `,
})
export class LegalPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly section = computed(() => {
    const key = this.route.snapshot.paramMap.get('section') ?? 'terms';
    return CONTENT[key] ?? CONTENT['terms'];
  });
}
