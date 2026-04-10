from django.db import models
from django.contrib.auth.models import AbstractBaseUser
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _

from .managers import UserManager
from .clinic_config import CLINIC_TYPE_CHOICES, get_preset


# ---------------------------------------------------------------------------
# Clinique (tenant SaaS)
# ---------------------------------------------------------------------------

class Clinic(models.Model):
    """
    Représente une clinique cliente (tenant).
    Créée lors de l'inscription — chaque utilisateur lui appartient.
    """

    name      = models.CharField(max_length=200, verbose_name=_("Nom de la clinique"))
    type      = models.CharField(
        max_length=50,
        choices=CLINIC_TYPE_CHOICES,
        verbose_name=_("Type de clinique"),
    )
    slug      = models.SlugField(
        max_length=220,
        unique=True,
        verbose_name=_("Identifiant unique"),
        help_text=_("Généré automatiquement depuis le nom."),
    )
    telephone = models.CharField(max_length=30, blank=True, verbose_name=_("Téléphone"))
    adresse   = models.CharField(max_length=255, blank=True, verbose_name=_("Adresse"))
    email     = models.EmailField(blank=True, verbose_name=_("Email"))
    logo      = models.ImageField(upload_to="clinics/logos/", null=True, blank=True, verbose_name=_("Logo"))

    is_active  = models.BooleanField(default=True, verbose_name=_("Active"))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Créée le"))
    updated_at = models.DateTimeField(auto_now=True,     verbose_name=_("Mise à jour le"))

    class Meta:
        verbose_name        = _("Clinique")
        verbose_name_plural = _("Cliniques")
        ordering            = ("name",)

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name)
            slug = base
            n    = 1
            while Clinic.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{n}"
                n   += 1
            self.slug = slug
        super().save(*args, **kwargs)

    # ── Helpers config ────────────────────────────────────────────────────

    @property
    def available_groups(self):
        """Liste des groupes disponibles pour ce type de clinique."""
        return get_preset(self.type)["groups"]

    @property
    def available_modules(self):
        """Liste des modules disponibles pour ce type de clinique."""
        return get_preset(self.type)["modules"]


# ---------------------------------------------------------------------------
# Permission
# ---------------------------------------------------------------------------

class Permission(models.TextChoices):
    CRUD = "CRUD", _("Créer, Lire, Mettre à jour, Supprimer")
    CRU  = "CRU",  _("Créer, Lire, Mettre à jour")
    CR   = "CR",   _("Créer, Lire")
    C    = "C",    _("Créer uniquement")
    R    = "R",    _("Lire uniquement")


# ---------------------------------------------------------------------------
# Utilisateur
# ---------------------------------------------------------------------------

class User(AbstractBaseUser):
    """
    Utilisateur appartenant à une clinique.
    Le téléphone est l'identifiant de connexion, unique globalement.
    """

    # ── Clinique ──────────────────────────────────────────────────────────

    clinic = models.ForeignKey(
        Clinic,
        on_delete=models.CASCADE,
        related_name="users",
        verbose_name=_("Clinique"),
    )

    # ── Identité ──────────────────────────────────────────────────────────

    telephone  = models.CharField(
        max_length=30,
        unique=True,
        verbose_name=_("Téléphone"),
        help_text=_("Utilisé comme identifiant de connexion."),
    )
    first_name = models.CharField(max_length=100, verbose_name=_("Prénom"))
    last_name  = models.CharField(max_length=100, verbose_name=_("Nom"))
    email      = models.EmailField(blank=True, verbose_name=_("Adresse email"))
    avatar     = models.ImageField(
        upload_to="users/avatars/",
        null=True, blank=True,
        verbose_name=_("Avatar"),
    )

    # ── Droits ────────────────────────────────────────────────────────────

    group = models.CharField(
        max_length=50,
        verbose_name=_("Groupe"),
        help_text=_("Dépend du type de clinique."),
    )
    permission = models.CharField(
        max_length=4,
        choices=Permission.choices,
        default=Permission.C,
        verbose_name=_("Permission"),
    )
    modules = models.JSONField(
        default=list,
        blank=True,
        verbose_name=_("Modules accessibles"),
    )

    # ── Flags système ─────────────────────────────────────────────────────

    is_active    = models.BooleanField(default=True,  verbose_name=_("Actif"))
    is_staff     = models.BooleanField(default=False, verbose_name=_("Staff"))
    is_superuser = models.BooleanField(default=False, verbose_name=_("Superutilisateur"))

    # ── Horodatage ────────────────────────────────────────────────────────

    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Créé le"))
    updated_at = models.DateTimeField(auto_now=True,     verbose_name=_("Mis à jour le"))

    USERNAME_FIELD  = "telephone"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = UserManager()

    class Meta:
        verbose_name        = _("Utilisateur")
        verbose_name_plural = _("Utilisateurs")
        ordering            = ("last_name", "first_name")

    def __str__(self):
        return f"{self.last_name.upper()} {self.first_name} — {self.clinic}"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        return self.first_name

    # ── Helpers modules ───────────────────────────────────────────────────

    def has_module_access(self, module: str) -> bool:
        if self.is_superuser:
            return True
        return module in (self.modules or [])

    # ── Helpers permission ────────────────────────────────────────────────

    @property
    def can_create(self):
        return 'C' in (self.permission or '')

    @property
    def can_read(self):
        return 'R' in (self.permission or '')

    @property
    def can_update(self):
        return 'U' in (self.permission or '')

    @property
    def can_delete(self):
        return 'D' in (self.permission or '')

    # ── Compatibilité Django admin ─────────────────────────────────────────

    def has_perm(self, perm, obj=None):
        return self.is_active and (self.is_superuser or self.permission == Permission.CRUD)

    def has_module_perms(self, app_label):
        return self.is_active and (self.is_superuser or self.is_staff)
