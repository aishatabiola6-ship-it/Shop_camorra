# Blush emails: setup (about 5 minutes, done once)

This makes Blush send real emails from **aishatabiola6@gmail.com**:

- the 6-digit code when someone creates an account or resets a password
- "Welcome to Blush" after the account is created
- "Welcome back" after each sign-in
- "Order confirmed" after checkout

It works the same way as Preshy Emporium: a small Google Apps Script runs under your Google account and sends the emails with Gmail. Google only lets the account owner switch this on, so these steps have to be done by you, signed in as aishatabiola6@gmail.com.

## Steps

1. Open **script.google.com** (signed in as aishatabiola6@gmail.com) and click **New project**.
2. Delete everything in the editor. Open [`blush-email.gs`](./blush-email.gs), click **Raw**, copy all of it and paste it into the editor.
3. Click the 💾 **Save** icon. Name the project **Blush emails**.
4. In the toolbar's function drop-down choose **setup**, then click **▶ Run**.
   Google asks for permission: **Review permissions → choose aishatabiola6@gmail.com → Advanced → Go to Blush emails (unsafe) → Allow**.
   It says "unsafe" only because you wrote the script yourself and Google hasn't reviewed it.
5. Click **Deploy → New deployment**. Click the ⚙️ next to "Select type" and choose **Web app**.
   - Execute as: **Me (aishatabiola6@gmail.com)**
   - Who has access: **Anyone**
   - Click **Deploy**, then copy the **Web app URL**. It looks like `https://script.google.com/macros/s/AKfy.../exec`.
6. Send that URL to Claude, or paste it into `makeup/index.html` at the top of the script:

   ```js
   const EMAIL = {
     scriptUrl: "https://script.google.com/macros/s/AKfy.../exec",
   };
   ```

The URL isn't a password. The script only sends Blush's own templates, checks codes itself, and limits how many emails each address and the whole day can get (Gmail allows about 100 a day).

## Updating the script later

Paste the new code over the old, save, then **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**. The URL stays the same.
