from django.db import models
from django.utils.translation import gettext_lazy as _


class ExamenLabo(models.Model):

    class Statut(models.TextChoices):
        EN_ATTENTE = 'en_attente', _('En attente')
        EN_COURS   = 'en_cours',   _('En cours')
        TERMINE    = 'termine',    _('Terminé')
        ANNULE     = 'annule',     _('Annulé')

    clinic     = models.ForeignKey('users.Clinic',    on_delete=models.CASCADE,  related_name='examens_labo', verbose_name=_('Clinique'))
    patient    = models.ForeignKey('patients.Patient', on_delete=models.CASCADE,  related_name='examens_labo', verbose_name=_('Patient'))
    demandeur  = models.ForeignKey('users.User',       on_delete=models.SET_NULL, null=True, blank=True, related_name='examens_labo_demandes', verbose_name=_('Demandeur'))
    laborantin = models.ForeignKey('users.User',       on_delete=models.SET_NULL, null=True, blank=True, related_name='examens_labo_traites',  verbose_name=_('Laborantin'))

    type_examen    = models.CharField(max_length=200, verbose_name=_('Type d\'examen'))
    date_demande   = models.DateTimeField(auto_now_add=True, verbose_name=_('Date de demande'))
    date_resultat  = models.DateTimeField(null=True, blank=True, verbose_name=_('Date du résultat'))
    resultat       = models.TextField(blank=True, verbose_name=_('Résultat'))
    valeurs_normales = models.TextField(blank=True, verbose_name=_('Valeurs normales'))
    statut         = models.CharField(max_length=20, choices=Statut.choices, default=Statut.EN_ATTENTE, verbose_name=_('Statut'))
    notes          = models.TextField(blank=True, verbose_name=_('Notes'))

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = _('Examen de laboratoire')
        verbose_name_plural = _('Examens de laboratoire')
        ordering            = ('-date_demande',)

    def __str__(self):
        return f"{self.type_examen} — {self.patient} — {self.date_demande:%d/%m/%Y}"
