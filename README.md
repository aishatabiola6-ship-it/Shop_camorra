# Preshy Emporium

Discreet adult wellness storefront for Preshy Emporium, Abraka, Delta State.
Contact: egwuenuprecious18@gmail.com

A static website (plain HTML/CSS/JS, no build step). You can host it for free on GitHub Pages, Netlify or Vercel.

## What it does
- **Opening page** with an 18+ age check
- **Shop** with categories and search
- **Product page** shows the description, features, and a step-by-step **How it works** section
- **Cart**: add any number of items, change quantities, remove items; the cart stays saved in the browser
- **Sign in** with Google, Apple or email
  - Google / email: a 6-digit code is sent, then the customer can **create a password**
  - Next time they can **log in with email + password**
- **Checkout** sends the order to the shop's email (the customer's email app opens with the order filled in)

## Editing
- Products, prices and "how it works" steps: `products.js` (add photos with the `image` field, e.g. `images/bullet.jpg`)
- Store name, email, location and email sending: `config.js`

## Sending real verification emails
Until it's set up, the site runs in **demo mode** and shows the code on screen.
1. Create a free account at https://www.emailjs.com and connect a Gmail service.
2. Create a template whose "To" is `{{to_email}}` and whose body includes `{{code}}`.
3. Paste the Public Key, Service ID and Template ID into `config.js`.

## Notes for going fully live
- Accounts are stored in each customer's browser (`localStorage`). To share accounts across devices and connect the real
  Google/Apple sign-in pop-ups, move auth to a backend such as Firebase Authentication. Apple sign-in requires an
  Apple Developer account.
- For card payments, add Paystack or Flutterwave at checkout.
