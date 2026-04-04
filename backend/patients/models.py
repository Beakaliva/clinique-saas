from django.db import models
from django.utils.translation import gettext_lazy as _


class Patient(models.Model):

    SEXE_CHOICES = [
        ('M', _('Masculin')),
        ('F', _('Féminin')),
        ('A', _('Autre')),
    ]

    # ── Clinique (multi-tenant) ────────────────────────────────────────────
    clinic = models.ForeignKey(
        'users.Clinic',
        on_delete=models.CASCADE,
        related_name='patients',
        verbose_name=_('Clinique'),
    )

    # ── Identité ──────────────────────────────────────────────────────────
    first_name     = models.CharField(max_length=100, verbose_name=_('Prénom(s)'))
    last_name      = models.CharField(max_length=100, verbose_name=_('Nom'))
    sexe           = models.CharField(max_length=1, choices=SEXE_CHOICES, default='A', verbose_name=_('Sexe'))
    date_naissance = models.DateField(null=True, blank=True, verbose_name=_('Date de naissance'))

    # ── Contact ───────────────────────────────────────────────────────────
    telephone  = models.CharField(max_length=30, null=True, blank=True, verbose_name=_('Téléphone'))
    adresse    = models.CharField(max_length=200, null=True, blank=True, verbose_name=_('Adresse'))
    profession = models.CharField(max_length=100, null=True, blank=True, verbose_name=_('Profession'))

    # ── Assurance ─────────────────────────────────────────────────────────
    est_assure   = models.BooleanField(default=False, verbose_name=_('Est assuré ?'))
    assurance    = models.CharField(max_length=100, null=True, blank=True, verbose_name=_('Compagnie d\'assurance'))
    code_assurance = models.CharField(max_length=100, null=True, blank=True, verbose_name=_('N° Police'))
    pourcentage  = models.DecimalField(
        max_digits=5, decimal_places=2,
        null=True, blank=True,
        verbose_name=_('Prise en charge (%)'),
        help_text=_('Ex : 80.00 pour 80%'),
    )

    # ── Horodatage ────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Créé le'))
    updated_at = models.DateTimeField(auto_now=True,     verbose_name=_('Mis à jour le'))

    class Meta:
        verbose_name        = _('Patient')
        verbose_name_plural = _('Patients')
        ordering            = ('last_name', 'first_name')

    def __str__(self):
        return f"{self.last_name.upper()} {self.first_name}"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def age(self):
        if not self.date_naissance:
            return None
        from datetime import date
        today = date.today()
        born  = self.date_naissance
        return today.year - born.year - ((today.month, today.day) < (born.month, born.day))
