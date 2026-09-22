# Wien Live web app

## Lokalno
npm install
npm run dev

## Javni link
Postavite folder na Vercel ili drugu Next.js hosting platformu. Nakon objave otvorite link u Safari na iPadu, Share > Add to Home Screen.

Resolver automatski učitava službene Wiener Linien CSV datoteke, povezuje stanice s platformama, nalazi RBL_NUMMER kandidate i provjerava ih preko realtime monitora. S7 se prikazuje samo ako isti izvor vrati potvrđene podatke; inače treba dodati ÖBB/VOR adapter.
