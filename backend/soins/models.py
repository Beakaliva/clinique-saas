from django.db import models
from django.utils.translation import gettext_lazy as _


class Soin(models.Model):

    class Statut(models.TextChoices):
        PLANIFIE  = 'planifie',  _('Planifié')
        EN_COURS  = 'en_cours',  _('En cours')
        EFFECTUE  = 'effectue',  _('Effectué')
        ANNULE    = 'annule',    _('Annulé')

    clinic        = models.ForeignKey('users.Clinic',                  on_delete=models.CASCADE,  related_name='soins',         verbose_name=_('Clinique'))
    patient       = models.ForeignKey('patients.Patient',              on_delete=models.CASCADE,  related_name='soins',         verbose_name=_('Patient'))
    consultation  = models.ForeignKey('consultations.Consultation',    on_delete=models.SET_NULL, null=True, blank=True, related_name='soins', verbose_name=_('Consultation liée'))
    infirmier     = models.ForeignKey('users.User',                    on_delete=models.SET_NULL, null=True, blank=True, related_name='soins', verbose_name=_('Infirmier(ère)'))

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
