"""
Commande : python manage.py seed_groups

Crée une clinique par type avec tous ses groupes et modules.
Chaque groupe devient un utilisateur de démonstration.

Usage :
    python manage.py seed_groups              # crée tout
    python manage.py seed_groups --flush      # supprime et recrée
    python manage.py seed_groups --type dentaire  # un seul type
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from users.clinic_config import PRESETS
from users.models import Clinic, Permission, User


# Mot de passe par défaut pour tous les comptes de démo
DEFAULT_PASSWORD = "Clinique@2024"


class Command(BaseCommand):
    help = "Initialise les cliniques de démonstration avec tous leurs groupes"

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Supprime les cliniques de démo existantes avant de recréer",
        )
        parser.add_argument(
            "--type",
            dest="clinic_type",
            default=None,
            help="Ne créer que ce type de clinique (ex: dentaire)",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        flush       = options["flush"]
        clinic_type = options["clinic_type"]

        presets = (
            {clinic_type: PRESETS[clinic_type]}
            if clinic_type and clinic_type in PRESETS
            else PRESETS
        )

        if clinic_type and clinic_type not in PRESETS:
            self.stderr.write(self.style.ERROR(
                f"Type inconnu : '{clinic_type}'. Valeurs possibles : {', '.join(PRESETS)}"
            ))
            return

        if flush:
            slugs = [f"demo-{t}" for t in presets]
            deleted, _ = Clinic.objects.filter(slug__in=slugs).delete()
            self.stdout.write(self.style.WARNING(f"  {deleted} clinique(s) supprimée(s)"))

        self.stdout.write(self.style.MIGRATE_HEADING("\n=== Seed des cliniques de démonstration ===\n"))

        for ctype, preset in presets.items():
            self._create_clinic(ctype, preset)

        self.stdout.write(self.style.SUCCESS(
            f"\n✓ Terminé. Mot de passe de tous les comptes : {DEFAULT_PASSWORD}\n"
        ))

    # ── Helpers ───────────────────────────────────────────────────────────

    def _create_clinic(self, ctype: str, preset: dict):
        label   = preset["label"]
        groups  = preset["groups"]
        modules = preset["modules"]
        slug    = f"demo-{ctype}"

        clinic, created = Clinic.objects.get_or_create(
            slug=slug,
            defaults={
                "name": f"[DEMO] {label}",
                "type": ctype,
            },
        )

        status = self.style.SUCCESS("créée") if created else self.style.WARNING("déjà existante")
        self.stdout.write(f"\n  Clinique : {clinic.name}  [{status}]")
        self.stdout.write(f"  Type     : {ctype}")
        self.stdout.write(f"  Slug     : {slug}")
        self.stdout.write(f"  Groupes  : {len(groups)}  |  Modules : {len(modules)}")
        self.stdout.write("")

        all_module_codes = [code for code, _ in modules]

        for group_code, group_label in groups:
            self._create_user(clinic, group_code, group_label, all_module_codes)

        self.stdout.write(self.style.MIGRATE_LABEL(
            f"  → {len(groups)} utilisateur(s) de démo créé(s) pour {label}"
        ))

    def _create_user(self, clinic: Clinic, group_code: str, group_label: str, all_modules: list):
        # Téléphone unique : type + groupe (ex: 00GENERALE01)
        type_prefix  = clinic.type[:3].upper()
        group_suffix = group_code[:4]
        telephone    = f"00{type_prefix}{group_suffix}"[:20]

        # Si le téléphone est déjà pris, on l'incrémente
        base = telephone
        n    = 1
        while User.objects.filter(telephone=telephone).exists():
            telephone = f"{base}{n}"
            n        += 1

        is_admin = group_code in ("ADMIN", "DIRECTION", "SUPERVISEUR")

        permission = Permission.CRUD if is_admin else Permission.CR

        # Les admins ont tous les modules, les autres ont les modules liés à leur groupe
        user_modules = all_modules if is_admin else self._modules_for_group(group_code, all_modules)

        user, created = User.objects.get_or_create(
            clinic=clinic,
            group=group_code,
            defaults={
                "telephone":  telephone,
                "first_name": group_label,
                "last_name":  "DEMO",
                "permission": permission,
                "modules":    user_modules,
                "is_staff":   is_admin,
            },
        )

        if created:
            user.set_password(DEFAULT_PASSWORD)
            user.save()
            flag = self.style.SUCCESS("✓")
        else:
            flag = self.style.WARNING("~")

        self.stdout.write(
            f"    {flag}  {group_label:<30} | tél: {telephone:<20} | perm: {permission}"
        )

    def _modules_for_group(self, group_code: str, all_modules: list) -> list:
        """Retourne les modules pertinents pour un groupe donné."""
        mapping = {
            # Médicaux
            "MEDECIN":           ["patients", "consultations", "dossiers_medicaux",
                                  "ordonnances", "soins", "rendez_vous", "rapports"],
            "DENTISTE":          ["patients", "consultations", "soins_dentaires",
                                  "odontologie", "ordonnances", "radiologie", "rendez_vous"],
            "PEDIATRE":          ["patients", "consultations", "dossiers_medicaux",
                                  "ordonnances", "vaccinations", "croissance", "rendez_vous"],
            "GYNECOLOGUE":       ["patients", "consultations", "dossiers_medicaux",
                                  "ordonnances", "suivi_grossesse", "echographies",
                                  "accouchements", "rendez_vous"],
            "OPHTALMOLOGUE":     ["patients", "consultations", "dossiers_medicaux",
                                  "ordonnances", "bilan_visuel", "chirurgie", "imagerie"],
            "PSYCHIATRE":        ["patients", "consultations", "dossiers_medicaux",
                                  "ordonnances", "suivi_therapie", "hospitalisations"],
            # Soignants
            "INFIRMIER":         ["patients", "soins", "dossiers_medicaux", "ordonnances"],
            "AIDE_SOIGNANT":     ["patients", "soins"],
            "SAGE_FEMME":        ["patients", "soins", "suivi_grossesse",
                                  "accouchements", "neonatologie"],
            "ASSISTANT_DENTAIRE":["patients", "soins_dentaires", "rendez_vous"],
            "HYGIENISTE":        ["patients", "soins_dentaires"],
            "ORTHOPTISTE":       ["patients", "bilan_visuel", "rendez_vous"],
            "ERGOTHERAPEUTE":    ["patients", "soins", "suivi_therapie"],
            "ASSISTANTE_SO":     ["patients", "dossiers_medicaux", "suivi_therapie"],
            "PSYCHOLOGUE":       ["patients", "consultations", "suivi_therapie"],
            "ANESTHESISTE":      ["patients", "consultations", "hospitalisations"],
            # Techniques
            "PHARMACIEN":        ["ordonnances", "pharmacie"],
            "LABORANTIN":        ["patients", "laboratoire"],
            "RADIOLOGUE":        ["patients", "radiologie"],
            "PROTHESISTE":       ["protheses"],
            "OPTICIEN":          ["patients", "optique"],
            "OPTOMETRISTE":      ["patients", "bilan_visuel", "optique"],
            # Administratif
            "SECRETAIRE":        ["patients", "rendez_vous", "dossiers_medicaux"],
            "CAISSIER":          ["patients", "factures"],
            "GUEST":             ["patients"],
        }

        wanted = mapping.get(group_code, ["patients"])
        # Filtre : ne garder que les modules existants dans cette clinique
        return [m for m in wanted if m in all_modules]
