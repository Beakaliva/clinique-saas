"""
Configuration des groupes et modules par type de clinique.
Utilisé par le modèle Clinic pour déterminer les choices disponibles.
"""

# ---------------------------------------------------------------------------
# Éléments communs à tous les types
# ---------------------------------------------------------------------------

COMMON_GROUPS = [
    ("ADMIN",       "Administrateur"),
    ("DIRECTION",   "Direction"),
    ("SUPERVISEUR", "Superviseur"),
    ("SECRETAIRE",  "Secrétaire médicale"),
    ("CAISSIER",    "Caissier(ère)"),
    ("GUEST",       "Invité"),
]

COMMON_MODULES = [
    ("patients",    "Patients"),
    ("rendez_vous", "Rendez-vous"),
    ("factures",    "Facturation"),
    ("personnel",   "Personnel"),
    ("rapports",    "Rapports & Statistiques"),
    ("parametres",  "Paramètres système"),
]

# ---------------------------------------------------------------------------
# Presets par type de clinique
# ---------------------------------------------------------------------------

PRESETS = {

    "generale": {
        "label": "Clinique générale / Polyclinique",
        "groups": COMMON_GROUPS + [
            ("MEDECIN",       "Médecin"),
            ("INFIRMIER",     "Infirmier(ère)"),
            ("AIDE_SOIGNANT", "Aide-soignant(e)"),
            ("PHARMACIEN",    "Pharmacien(ne)"),
            ("LABORANTIN",    "Laborantin(e)"),
            ("RADIOLOGUE",    "Radiologue"),
        ],
        "modules": COMMON_MODULES + [
            ("consultations",     "Consultations"),
            ("soins",             "Soins infirmiers"),
            ("dossiers_medicaux", "Dossiers médicaux"),
            ("ordonnances",       "Ordonnances"),
            ("pharmacie",         "Pharmacie"),
            ("laboratoire",       "Laboratoire"),
            ("radiologie",        "Radiologie"),
            ("hospitalisations",  "Hospitalisations"),
        ],
    },

    "dentaire": {
        "label": "Clinique dentaire",
        "groups": COMMON_GROUPS + [
            ("DENTISTE",           "Chirurgien-dentiste"),
            ("ASSISTANT_DENTAIRE", "Assistant(e) dentaire"),
            ("PROTHESISTE",        "Prothésiste dentaire"),
            ("HYGIENISTE",         "Hygiéniste dentaire"),
            ("RADIOLOGUE",         "Technicien(ne) radio"),
        ],
        "modules": COMMON_MODULES + [
            ("consultations",   "Consultations / Bilans"),
            ("soins_dentaires", "Soins dentaires"),
            ("odontologie",     "Suivi dentaire & plan de traitement"),
            ("ordonnances",     "Ordonnances"),
            ("radiologie",      "Radiographie dentaire"),
            ("protheses",       "Prothèses & laboratoire"),
        ],
    },

    "pediatrique": {
        "label": "Clinique pédiatrique",
        "groups": COMMON_GROUPS + [
            ("PEDIATRE",      "Pédiatre"),
            ("INFIRMIER",     "Infirmier(ère)"),
            ("AIDE_SOIGNANT", "Aide-soignant(e)"),
            ("PHARMACIEN",    "Pharmacien(ne)"),
            ("LABORANTIN",    "Laborantin(e)"),
        ],
        "modules": COMMON_MODULES + [
            ("consultations",     "Consultations"),
            ("soins",             "Soins infirmiers"),
            ("dossiers_medicaux", "Dossiers médicaux"),
            ("ordonnances",       "Ordonnances"),
            ("vaccinations",      "Vaccinations"),
            ("croissance",        "Suivi croissance & développement"),
            ("pharmacie",         "Pharmacie"),
            ("laboratoire",       "Laboratoire"),
        ],
    },

    "ophtalmologie": {
        "label": "Clinique ophtalmologique",
        "groups": COMMON_GROUPS + [
            ("OPHTALMOLOGUE", "Ophtalmologue"),
            ("ORTHOPTISTE",   "Orthoptiste"),
            ("OPTOMETRISTE",  "Optométriste"),
            ("INFIRMIER",     "Infirmier(ère)"),
            ("OPTICIEN",      "Opticien(ne)"),
        ],
        "modules": COMMON_MODULES + [
            ("consultations",     "Consultations"),
            ("dossiers_medicaux", "Dossiers médicaux"),
            ("ordonnances",       "Ordonnances"),
            ("bilan_visuel",      "Bilan visuel"),
            ("chirurgie",         "Chirurgie ophtalmologique"),
            ("optique",           "Optique & équipements"),
            ("imagerie",          "Imagerie ophtalmologique"),
        ],
    },

    "maternite": {
        "label": "Maternité",
        "groups": COMMON_GROUPS + [
            ("GYNECOLOGUE",  "Gynécologue-obstétricien"),
            ("SAGE_FEMME",   "Sage-femme"),
            ("PEDIATRE",     "Pédiatre néonatal"),
            ("INFIRMIER",    "Infirmier(ère)"),
            ("ANESTHESISTE", "Anesthésiste"),
            ("LABORANTIN",   "Laborantin(e)"),
            ("RADIOLOGUE",   "Radiologue / Échographiste"),
        ],
        "modules": COMMON_MODULES + [
            ("consultations",     "Consultations prénatales"),
            ("dossiers_medicaux", "Dossiers médicaux"),
            ("soins",             "Soins infirmiers"),
            ("ordonnances",       "Ordonnances"),
            ("accouchements",     "Accouchements & naissances"),
            ("suivi_grossesse",   "Suivi de grossesse"),
            ("echographies",      "Échographies"),
            ("laboratoire",       "Laboratoire"),
            ("neonatologie",      "Néonatologie"),
            ("hospitalisations",  "Hospitalisations"),
        ],
    },

    "psychiatrie": {
        "label": "Clinique psychiatrique",
        "groups": COMMON_GROUPS + [
            ("PSYCHIATRE",     "Psychiatre"),
            ("PSYCHOLOGUE",    "Psychologue"),
            ("INFIRMIER",      "Infirmier(ère) psychiatrique"),
            ("AIDE_SOIGNANT",  "Aide-soignant(e)"),
            ("ASSISTANTE_SO",  "Assistant(e) social(e)"),
            ("ERGOTHERAPEUTE", "Ergothérapeute"),
        ],
        "modules": COMMON_MODULES + [
            ("consultations",     "Consultations"),
            ("dossiers_medicaux", "Dossiers médicaux"),
            ("soins",             "Soins infirmiers"),
            ("ordonnances",       "Ordonnances"),
            ("hospitalisations",  "Hospitalisations"),
            ("suivi_therapie",    "Suivi thérapeutique"),
            ("pharmacie",         "Pharmacie"),
        ],
    },
}

# Choices pour le champ Clinic.type (utilisé dans le formulaire d'inscription)
CLINIC_TYPE_CHOICES = [(key, preset["label"]) for key, preset in PRESETS.items()]


def get_preset(clinic_type: str) -> dict:
    """Retourne le preset pour un type de clinique, avec fallback sur 'generale'."""
    return PRESETS.get(clinic_type, PRESETS["generale"])
