# Vitrine des Talents

Annuaire web public, **sans compte**, des talents des membres d'une association d'école.
Chaque membre crée sa carte en scannant un QR code et reçoit un **code à 6 chiffres** pour la modifier ou la retirer.

Stack : Next.js 14 (App Router, TypeScript), Tailwind CSS, Supabase (Postgres et Storage), Vercel.

| Page | Rôle |
| --- | --- |
| `/` | Catalogue : recherche, filtres, cartes (carrousel « À la une » et liste compacte sur mobile) |
| `/t/[slug]` | Fiche d'un talent, partage, QR personnel, aperçu Open Graph |
| `/inscription?e=<TOKEN>` | Création de carte en 3 étapes (formulaire, aperçu, code) |
| `/modifier` | Numéro WhatsApp + code, puis modification ou suppression |
| `/qr` | Affiche A4 imprimable avec le QR d'inscription |
| `/admin` | Modération, régénération de code, export CSV, profils de démo |

---

## 1. Créer la base Supabase (10 min)

1. Créer un compte sur <https://supabase.com>, puis **New project** (région la plus proche : *West EU (Paris)* ou *Frankfurt*). Noter le mot de passe de la base.
2. Dans le projet : **SQL Editor > New query**, coller tout le contenu de [`supabase/schema.sql`](supabase/schema.sql), puis **Run**.
   Le script crée :
   - les types `talent_category` et `talent_status`, la table `talents` et son index unique sur `whatsapp` ;
   - la table `attempts` (limite de 5 créations par IP et par heure, blocage de 15 min après 5 codes faux) ;
   - les politiques **RLS** : le public ne lit que les cartes `published`, jamais la colonne `edit_code_hash`, et ne peut rien écrire ;
   - le **bucket public `photos`** (2 Mo max par fichier, WebP, JPEG ou PNG).

   Le script peut être relancé sans risque.
3. Vérifier dans **Storage** que le bucket `photos` existe et qu'il est marqué *Public*. S'il manque (cas rare), le créer à la main : **New bucket**, nom `photos`, cocher *Public bucket*.
4. Récupérer les clés dans **Project Settings > API** (ou **Data API** / **API Keys**) :
   - *Project URL* → `NEXT_PUBLIC_SUPABASE_URL`
   - clé `anon` / *publishable* → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - clé `service_role` / *secret* → `SUPABASE_SERVICE_ROLE_KEY` (**ne jamais la partager** : elle n'est utilisée que côté serveur)

## 2. Variables d'environnement

Copier `.env.example` en `.env.local` pour travailler en local, ou les saisir dans Vercel.

| Variable | Exemple | Rôle |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://abcd.supabase.co` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ…` | Clé publique (RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ…` | Clé serveur pour toutes les écritures |
| `NEXT_PUBLIC_SITE_URL` | `https://vitrine-xxx.vercel.app` | URL publique, utilisée dans les QR codes et les liens WhatsApp |
| `NEXT_PUBLIC_ASSOCIATION_NAME` | `Association des Anciens` | Sous-titre de l'en-tête |
| `NEXT_PUBLIC_SCHOOL_NAME` | `Lycée …` | Sous-titre de l'en-tête |
| `NEXT_PUBLIC_CONTACT` | `+243 81 000 0000` ou `equipe@…` | Contact organisateur (lien WhatsApp ou e-mail généré automatiquement) |
| `INSCRIPTION_TOKEN` | chaîne aléatoire | Jeton du QR d'inscription |
| `ADMIN_PASSWORD` | mot de passe long | Accès à `/admin` |
| `MODERATION` | `off` / `on` | `on` : les nouvelles cartes attendent une validation |
| `SEED_DEMO` | `false` / `true` | `true` : affiche le bouton « Insérer la démo » dans `/admin` |

Générer un jeton : `node -e "console.log(require('crypto').randomBytes(12).toString('base64url'))"`

> **Attention** : changer `INSCRIPTION_TOKEN` ou `NEXT_PUBLIC_SITE_URL` après avoir imprimé l'affiche rend le QR imprimé invalide. Fixer ces deux valeurs **avant** d'imprimer.

## 3. Lancer en local

```bash
npm install
cp .env.example .env.local   # puis remplir les valeurs
npm run dev                  # http://localhost:3000
```

Inscription locale : `http://localhost:3000/inscription?e=<INSCRIPTION_TOKEN>`

## 4. Déployer sur Vercel, pas à pas

1. Pousser ce dépôt sur GitHub (c'est déjà fait si vous lisez ceci sur GitHub).
2. Sur <https://vercel.com>, se connecter avec GitHub, puis **Add New… > Project** et importer le dépôt.
   Framework : *Next.js* (détecté automatiquement). Ne rien changer aux commandes de build.
3. Si le code est sur une autre branche que `main`, choisir cette branche dans **Settings > Git > Production Branch** (ou fusionner la branche dans `main`).
4. Ouvrir **Environment Variables** et saisir toutes les variables de la section 2.
   Pour `NEXT_PUBLIC_SITE_URL`, mettre l'URL que Vercel attribuera (ex. `https://vitrine-des-talents.vercel.app`). On pourra la corriger ensuite.
5. Cliquer sur **Deploy**. Après 1 à 2 minutes, le site est en ligne.
6. Si l'URL finale diffère de `NEXT_PUBLIC_SITE_URL` : corriger la variable dans **Settings > Environment Variables**, puis **Deployments > … > Redeploy** (les variables `NEXT_PUBLIC_*` sont figées au build).
7. Tester : ouvrir `/admin`, se connecter, cliquer sur **Affiche QR**, scanner avec un téléphone, créer une carte.

Adresses à communiquer :
- Site : `https://<votre-projet>.vercel.app`
- Affiche à imprimer : `https://<votre-projet>.vercel.app/qr`
- Administration : `https://<votre-projet>.vercel.app/admin`

## 5. Le matin de l'événement

- [ ] Dans Vercel, passer `SEED_DEMO=false` et redéployer.
- [ ] Dans `/admin`, cliquer sur **Vider la démo** (supprime les 8 profils fictifs).
- [ ] Vérifier `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT`, le nom de l'association et de l'école.
- [ ] Choisir `MODERATION` (`off` : publication immédiate ; `on` : validation dans `/admin`).
- [ ] Ouvrir `/qr`, cliquer **Imprimer l'affiche** (A4, portrait, marges par défaut, « Graphiques d'arrière-plan » cochés pour le logo). Imprimer plusieurs exemplaires.
- [ ] Scanner l'affiche **imprimée** avec un Android et un iPhone, créer une vraie carte, noter le code, la modifier sur `/modifier`, puis la retirer.
- [ ] Garder `/admin` ouvert sur un téléphone de l'équipe pour régénérer les codes perdus.

## 6. Fonctionnement et choix techniques

Décisions prises pour aller vite et rester fiable, sans service payant :

- **Aucune clé secrète côté navigateur.** Toutes les lectures et écritures passent par le serveur Next.js avec la clé `service_role`, en sélectionnant les colonnes explicitement : le hash n'est jamais renvoyé. Les politiques RLS protègent quand même la base si la clé `anon` est utilisée ailleurs.
- **Code à 6 chiffres** : généré avec `crypto.randomInt`, seul son hash bcrypt est stocké. Il est affiché une seule fois. Le bouton « M'envoyer le code sur WhatsApp » ouvre `wa.me/<son numéro>` : la discussion du membre avec lui-même, sans API.
- **Numéros** : normalisés en E.164. `0812345678`, `812345678`, `243812345678` et `+243 812 345 678` donnent tous `+243812345678`. Un numéro étranger saisi avec `+` est accepté.
- **Session de modification** : après le bon code, un cookie httpOnly signé (HMAC) est valable 30 min. Le cookie admin, signé de la même façon, est valable 12 h. Le secret de signature est dérivé de `SUPABASE_SERVICE_ROLE_KEY` et `ADMIN_PASSWORD` : pas de variable supplémentaire. Changer `ADMIN_PASSWORD` déconnecte tout le monde.
- **Limites** stockées dans la table `attempts` (fiable sur Vercel, où la mémoire n'est pas partagée entre requêtes) : 5 créations par IP et par heure, blocage de 15 min après 5 codes faux pour un numéro, 10 essais de mot de passe admin par IP sur 15 min. Les lignes de plus de 24 h sont nettoyées automatiquement. À noter : lors de l'événement, beaucoup de téléphones peuvent partager le même Wi-Fi, donc la même IP. Si cela bloque des inscriptions, augmenter `MAX_CREATIONS_PER_HOUR` dans `src/app/api/talents/route.ts`.
- **Anti-spam** : champ caché « honeypot » (`website`), jeton d'inscription obligatoire.
- **Photos** : compressées dans le navigateur (800 px max, WebP, JPEG sur les anciens iPhone), 5 Mo max avant compression, 2 Mo max côté serveur. Elles sont supprimées du bucket avec la carte.
- **Recherche** : côté client, insensible à la casse et aux accents (nom, spécialité, offre, catégorie, quartier). Le catalogue charge jusqu'à 2000 cartes.
- **Profils de démo** : marqués par la colonne `is_demo` (numéros factices `+24399000000x`, code inconnu). Insertion et suppression depuis `/admin`.
- **« E-mail ou LinkedIn »** : deux champs facultatifs séparés (E-mail, puis LinkedIn ou portfolio), qui correspondent aux colonnes `email` et `link`.
- **QR personnel** : rendu en SVG dans les pages, en PNG téléchargeable via `/api/qr/<slug>?download`.
- **Polices** : Space Grotesk et Inter via `next/font` en `display: optional`. Sur une connexion lente, la police système s'affiche sans décalage plutôt que d'attendre.
- **Export CSV** : séparateur `;` et BOM UTF-8 pour Excel en français. Les formules sont neutralisées. Le hash n'y figure pas.

## 7. Vérifications effectuées

Testé avec un build de production branché sur un Postgres local doté du même schéma et des mêmes règles RLS :

- Création refusée sans jeton valide ; doublon de numéro refusé avec un lien vers `/modifier`.
- Parcours complet dans Chromium à 360 px : photo, aperçu, publication, code affiché, fiche, modification, suppression (photo comprise). Aucune erreur JavaScript, aucun défilement horizontal.
- 5 codes faux, puis blocage ; carte masquée invisible au catalogue et `/t/[slug]` en 404 ; régénération de code ; export CSV sans hash.
- RLS : le rôle public ne voit que les cartes publiées, ne peut pas lire `edit_code_hash` et ne peut rien écrire.
- Lighthouse mobile : accueil Performance 97 / Accessibilité 100 ; fiche 98 / 100 ; inscription 98 / 100 ; modifier 95 / 100.

Non testé ici : le vrai Supabase, le déploiement Vercel et les applications natives WhatsApp et Téléphone sur Android et iPhone (à faire le matin de l'événement, voir la section 5).

## Structure

```
supabase/schema.sql         Tables, types, index, RLS, bucket
src/app/                    Pages et routes API
src/app/api/talents         Création (+ /check : numéro déjà inscrit ?)
src/app/api/edit            Connexion par code, modification, suppression
src/app/api/admin           Connexion, actions, export CSV, démo
src/app/api/qr/[slug]       QR personnel en PNG
src/components/             Interface (catalogue, carte, formulaire, admin)
src/lib/                    Supabase, sécurité, validation, utilitaires
```
