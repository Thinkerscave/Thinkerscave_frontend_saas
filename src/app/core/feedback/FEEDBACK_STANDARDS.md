# UI Feedback Standards (ThinkersCave)

Use this guide when adding success/error messaging. Goal: users always notice
outcomes without scrolling, and field problems are visible next to the field.

## Preferred pattern (modern SaaS)

1. **Field validation** → red text + invalid border **under the control**.
2. **Action result** (save / create / archive / API fail) → **PrimeNG Toast**
   via `UiFeedbackService` (top-right or top-center).
3. Do **not** rely only on a page-top banner for create/save failures when the
   submit button is at the bottom of a long form.

SweetAlert-style modal dialogs are reserved for **destructive confirms**
(archive, suspend, permanent delete). Prefer toast for validation and save results.

## Service

```ts
import { UiFeedbackService } from '../../core/feedback/ui-feedback.service';

readonly feedback = inject(UiFeedbackService);

this.feedback.success('Organization created', `${name} is ready.`);
this.feedback.formError('Domain "google" is already in use.');
this.feedback.error('Create failed', parsed.message);
```

Ensure a global `<p-toast position="top-center"></p-toast>` is mounted once
(in `app.component.html`). Prefer `UiFeedbackService` so messages use the root
`MessageService` and appear even when the user is scrolled to the bottom of a form.

Do **not** add per-page `providers: [MessageService]` — that shadows the root
service and breaks global/interceptor toasts.

## Error parsing

Use `extractApiError()` from `shared/utils/api-error.util.ts` so Hibernate /
stack traces never reach the UI. Map `errors[]` onto form field keys.

## Super Admin (Tenant Management) scope

Apply this pattern on:

- Add / edit Organization (provision)
- Customer create / edit / archive
- Subscription plans & promotions
- Organization / customer workspace actions
- Migration / health action toasts

Inline empty-state errors for **page load** failures are still OK; pair them
with a toast when the failure is from a user click.
