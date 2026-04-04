from django.db import models
from django.utils.translation import gettext_lazy as _


class Ordonnance(models.Model):

    clinic       = models.ForeignKey('users.Clinic',           on_delete=models.CASCADE,  related_name='ordonnances', verbose_name=_('Clinique'))
    patient      = models.ForeignKey('patients.Patient',        on_delete=models.CASCADE,  related_name='ordonnances', verbose_name=_('Patient'))
    medecin      = models.ForeignKey('users.User',              on_delete=models.SET_NULL, null=True, blank=True, related_name='ordonnances', verbose_name=_('Médecin'))
    consultation = models.ForeignKey('consultations.Consultation', on_delete=models.SET_NULL, null=True, blank=True, related_name='ordonnances', verbose_name=_('Consultation'))

    date  = models.DateField(verbose_name=_('Date'))
    notes = models.TextField(blank=True, verbose_name=_('Instructions / Notes'))

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = _('Ordonnance')
        verbose_name_plural = _('Ordonnances')
        ordering            = ('-date',)

    def __str__(self):
        return f"Ordonnance {self.patient} — {self.date:%d/%m/%Y}"


class LigneOrdonnance(models.Model):

    ordonnance  = models.ForeignKey(Ordonnance, on_delete=models.CASCADE, related_name='lignes', verbose_name=_('Ordonnance'))
    medicament  = models.CharField(max_length=200, verbose_name=_('Médicament'))
    posologie   = models.CharField(max_length=200, verbose_name=_('Posologie'))
    duree       = models.CharField(max_length=100, blank=True, verbose_name=_('Durée'))
    quantite    = models.PositiveIntegerField(default=1, verbose_name=_('Quantité'))
    notes       = models.CharField(max_length=255, blank=True, verbose_name=_('Notes'))

    class Meta:
        verbose_name        = _('Ligne d\'ordonnance')
        verbose_name_plural = _('Lignes d\'ordonnance')

    def __str__(self):
        return f"{self.medicament} — {self.posologie}"
