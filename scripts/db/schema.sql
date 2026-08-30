-- Schéma minimal HRFlow — dérivé des requêtes utilisées par les 4 services.
-- À exécuter une seule fois sur chaque environnement (staging / production).
-- NB : les migrations applicatives (ex: /paie/migrate) supposent que ce schéma
-- de base existe déjà.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'employee',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(255),
  prenom VARCHAR(255),
  salaire_mensuel_brut DECIMAL(10,2) NOT NULL DEFAULT 0,
  jours_conges_acquis INTEGER NOT NULL DEFAULT 25,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conges (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  nombre_jours INTEGER NOT NULL,
  motif TEXT,
  statut VARCHAR(50) NOT NULL DEFAULT 'en_attente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bulletins_paie (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  mois INTEGER NOT NULL,
  annee INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidats (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(255),
  prenom VARCHAR(255),
  email VARCHAR(255),
  poste VARCHAR(255),
  cv_path TEXT,
  statut VARCHAR(50) NOT NULL DEFAULT 'recu',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed minimal pour permettre les smoke tests de staging/production.
INSERT INTO employees (id, nom, prenom, salaire_mensuel_brut, jours_conges_acquis)
VALUES (1, 'Dupont', 'Marie', 3000, 25)
ON CONFLICT (id) DO NOTHING;

-- mot de passe : "Demo1234!" (bcrypt, uniquement pour smoke tests staging)
-- id volontairement non fixé : évite un conflit avec un id déjà pris par un
-- utilisateur préexistant (ex: id=1 réservé à un compte historique).
INSERT INTO users (email, password_hash, role)
VALUES ('smoke-test@hrflow.local', '$2b$10$2o3Y0sexESGGL.a0BLMqoePuFutTvVYwabWQyRbFTJdeDdgY9NmKW', 'admin')
ON CONFLICT (email) DO NOTHING;

SELECT setval('employees_id_seq', (SELECT COALESCE(MAX(id), 1) FROM employees));
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
