/*
 * Store settings.
 *
 * Email verification codes:
 *   The site is static (no server), so it cannot send email by itself.
 *   To send real codes, create a free account at https://www.emailjs.com,
 *   add an email service + a template that uses {{to_email}} and {{code}},
 *   then paste the three IDs below. While they are empty the site runs in
 *   DEMO MODE and shows the code on screen instead of emailing it.
 */
window.STORE_CONFIG = {
  name: "Preshy Emporium",
  location: "Abraka, Delta State, Nigeria",
  email: "egwuenuprecious18@gmail.com",
  currency: "₦",

  emailjs: {
    publicKey: "",   // e.g. "AbCdEf123..."
    serviceId: "",   // e.g. "service_xxxxx"
    templateId: ""   // e.g. "template_xxxxx"
  }
};
