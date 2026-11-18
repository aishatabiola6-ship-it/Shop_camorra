/*
 * Store settings.
 *
 * Customer emails (sign-in codes, welcome / new sign-in, order confirmation) are sent by
 * the Netlify automation through the Google Sheet script – see automation/SETUP.md.
 * Until that's set up, sign-in codes are shown on screen (demo mode).
 */
window.STORE_CONFIG = {
  name: "Preshy Emporium",
  location: "Abraka, Delta State, Nigeria",
  email: "egwuenuprecious18@gmail.com",
  currency: "₦",

  // WhatsApp number for customer questions and order messages (international format, digits only)
  whatsapp: "2348133284978",
  tiktok: "https://www.tiktok.com/@delta_intimacyhubng",

  /*
   * Flutterwave payments.
   * Get your PUBLIC key from https://app.flutterwave.com -> Settings -> API Keys.
   * Use the TEST key (FLWPUBK_TEST-...) while testing, then switch to the LIVE key.
   * While empty, checkout runs in DEMO MODE (payment is simulated, no money moves).
   * Never put the SECRET key here.
   */
  flutterwave: {
    publicKey: "FLWPUBK_TEST-898a4a29e06abf6a3167fb6c45eafdb4-X"   // TEST key – replace with the LIVE key when going live
  }
};
