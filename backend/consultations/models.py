from django.db import models
from django.utils.translation import gettext_lazy as _


class Consultation(models.Model):

    class Statut(models.TextChoices):
        EN_COURS = 'en_cours', _('En cours')
        TERMINEE = 'terminee', _('Terminée')
        ANNULEE  = 'annulee',  _('Annulée')

    clinic  = models.ForeignKey('users.Clinic',    on_delete=models.CASCADE,  related_name='consultations', verbose_name=_('Clinique'))
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE,  related_name='consultations', verbose_name=_('Patient'))
    medecin = models.ForeignKey('users.User',       on_delete=models.SET_NULL, null=True, blank=True, related_name='consultations', verbose_name=_('Médecin'))

    date       = models.DateTimeField(verbose_name=_('Date'))
    motif      = models.TextField(verbose_name=_('Motif'))
    diagnostic = models.TextField(blank=True, verbose_name=_('Diagnostic'))
    notes      = models.TextField(blank=True, verbose_name=_('Notes'))
    statut     = models.CharField(max_length=20, choices=Statut.choices, default=Statut.EN_COURS, verbose_name=_('Statut'))

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = _('Consultation')
        verbose_name_plural = _('Consultations')
        ordering            = ('-date',)

    def __str__(self):
        return f"Consultation — {self.patient} — {self.date:%d/%m/%Y}"
