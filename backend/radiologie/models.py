from django.db import models
from django.utils.translation import gettext_lazy as _


class ExamenRadio(models.Model):

    class Statut(models.TextChoices):
        EN_ATTENTE = 'en_attente', _('En attente')
        REALISE    = 'realise',    _('Réalisé')
        INTERPRETE = 'interprete', _('Interprété')
        ANNULE     = 'annule',     _('Annulé')

    clinic     = models.ForeignKey('users.Clinic',    on_delete=models.CASCADE,  related_name='examens_radio', verbose_name=_('Clinique'))
    patient    = models.ForeignKey('patients.Patient', on_delete=models.CASCADE,  related_name='examens_radio', verbose_name=_('Patient'))
    demandeur  = models.ForeignKey('users.User',       on_delete=models.SET_NULL, null=True, blank=True, related_name='examens_radio_demandes',  verbose_name=_('Demandeur'))
    radiologue = models.ForeignKey('users.User',       on_delete=models.SET_NULL, null=True, blank=True, related_name='examens_radio_interpretes', verbose_name=_('Radiologue'))

    type_examen   = models.CharField(max_length=200, verbose_name=_('Type d\'examen'))
    date          = models.DateTimeField(verbose_name=_('Date'))
    compte_rendu  = models.TextField(blank=True, verbose_name=_('Compte rendu'))
    image         = models.FileField(upload_to='radiologie/', null=True, blank=True, verbose_name=_('Image / Fichier'))
    statut        = models.CharField(max_length=20, choices=Statut.choices, default=Statut.EN_ATTENTE, verbose_name=_('Statut'))
    notes         = models.TextField(blank=True, verbose_name=_('Notes'))

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = _('Examen radiologique')
        verbose_name_plural = _('Examens radiologiques')
        ordering            = ('-date',)

    def __str__(self):
        return f"{self.type_examen} — {self.patient} — {self.date:%d/%m/%Y}"
