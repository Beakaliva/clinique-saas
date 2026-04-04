from decimal import Decimal

from django.db import models
from django.utils.translation import gettext_lazy as _


class Soin(models.Model):

    class Statut(models.TextChoices):
        PLANIFIE  = 'planifie',  _('Planifié')
        EN_COURS  = 'en_cours',  _('En cours')
        EFFECTUE  = 'effectue',  _('Effectué')
        ANNULE    = 'annule',    _('Annulé')

    clinic        = models.ForeignKey('users.Clinic',               on_delete=models.CASCADE,  related_name='soins',  verbose_name=_('Clinique'))
    patient       = models.ForeignKey('patients.Patient',           on_delete=models.CASCADE,  related_name='soins',  verbose_name=_('Patient'))
    consultation  = models.ForeignKey('consultations.Consultation', on_delete=models.SET_NULL, null=True, blank=True, related_name='soins', verbose_name=_('Consultation liée'))
    infirmier     = models.ForeignKey('users.User',                 on_delete=models.SET_NULL, null=True, blank=True, related_name='soins', verbose_name=_('Infirmier(ère)'))

    type_soin   = models.CharField(max_length=150, verbose_name=_('Type de soin'))
    date        = models.DateTimeField(verbose_name=_('Date'))
    description = models.TextField(blank=True, verbose_name=_('Description'))
    notes       = models.TextField(blank=True, verbose_name=_('Observations'))
    statut      = models.CharField(max_length=20, choices=Statut.choices, default=Statut.PLANIFIE, verbose_name=_('Statut'))

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = _('Soin')
        verbose_name_plural = _('Soins')
        ordering            = ('-date',)

    def __str__(self):
        return f"{self.type_soin} — {self.patient} — {self.date:%d/%m/%Y}"

    @property
    def montant_total(self) -> Decimal:
        return sum(a.montant for a in self.actes.all())


class SoinActe(models.Model):
    """Ligne d'acte réalisé lors d'un soin (ex : pansement, injection, perfusion...)."""

    soin    = models.ForeignKey(Soin, on_delete=models.CASCADE, related_name='actes', verbose_name=_('Soin'))
    acte    = models.CharField(max_length=200, verbose_name=_('Acte réalisé'))
    qte     = models.PositiveSmallIntegerField(default=1, verbose_name=_('Quantité'))
    prix    = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_('Prix unitaire (GNF)'))

    class Meta:
        verbose_name        = _('Acte de soin')
        verbose_name_plural = _('Actes de soin')

    def __str__(self):
        return f"{self.acte} × {self.qte} — {self.soin}"

    @property
    def montant(self) -> Decimal:
        return self.prix * self.qte
