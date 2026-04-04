from django.db import models
from django.utils.translation import gettext_lazy as _


class RendezVous(models.Model):

    class Statut(models.TextChoices):
        PLANIFIE  = 'planifie',  _('Planifié')
        CONFIRME  = 'confirme',  _('Confirmé')
        EN_SALLE  = 'en_salle',  _('En salle d\'attente')
        EFFECTUE  = 'effectue',  _('Effectué')
        ANNULE    = 'annule',    _('Annulé')
        ABSENT    = 'absent',    _('Patient absent')

    clinic  = models.ForeignKey('users.Clinic',    on_delete=models.CASCADE,  related_name='rendez_vous', verbose_name=_('Clinique'))
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE,  related_name='rendez_vous', verbose_name=_('Patient'))
    medecin = models.ForeignKey('users.User',       on_delete=models.SET_NULL, null=True, blank=True, related_name='rendez_vous', verbose_name=_('Médecin'))

    date_heure      = models.DateTimeField(verbose_name=_('Date et heure'))
    duree_minutes   = models.PositiveIntegerField(default=30, verbose_name=_('Durée (min)'))
    motif           = models.CharField(max_length=255, verbose_name=_('Motif'))
    statut          = models.CharField(max_length=20, choices=Statut.choices, default=Statut.PLANIFIE, verbose_name=_('Statut'))
    notes           = models.TextField(blank=True, verbose_name=_('Notes'))

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = _('Rendez-vous')
        verbose_name_plural = _('Rendez-vous')
        ordering            = ('date_heure',)

    def __str__(self):
        return f"RDV {self.patient} — {self.date_heure:%d/%m/%Y %H:%M}"
