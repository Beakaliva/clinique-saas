from django.db import models
from django.utils.translation import gettext_lazy as _


class Hospitalisation(models.Model):

    class Statut(models.TextChoices):
        EN_COURS  = 'en_cours',  _('En cours')
        SORTIE    = 'sortie',    _('Sorti(e)')
        TRANSFERE = 'transfere', _('Transféré(e)')
        ANNULE    = 'annule',    _('Annulé')

    clinic  = models.ForeignKey('users.Clinic',    on_delete=models.CASCADE,  related_name='hospitalisations', verbose_name=_('Clinique'))
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE,  related_name='hospitalisations', verbose_name=_('Patient'))
    medecin = models.ForeignKey('users.User',       on_delete=models.SET_NULL, null=True, blank=True, related_name='hospitalisations', verbose_name=_('Médecin responsable'))

    chambre              = models.CharField(max_length=50, blank=True, verbose_name=_('Chambre / Lit'))
    motif                = models.TextField(verbose_name=_('Motif d\'hospitalisation'))
    date_entree          = models.DateTimeField(verbose_name=_('Date d\'entrée'))
    date_sortie_prevue   = models.DateField(null=True, blank=True, verbose_name=_('Date de sortie prévue'))
    date_sortie_reelle   = models.DateTimeField(null=True, blank=True, verbose_name=_('Date de sortie réelle'))
    statut               = models.CharField(max_length=20, choices=Statut.choices, default=Statut.EN_COURS, verbose_name=_('Statut'))
    notes                = models.TextField(blank=True, verbose_name=_('Notes / Évolution'))

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = _('Hospitalisation')
        verbose_name_plural = _('Hospitalisations')
        ordering            = ('-date_entree',)

    def __str__(self):
        return f"Hospitalisation — {self.patient} — {self.date_entree:%d/%m/%Y}"

    @property
    def duree_jours(self):
        from django.utils import timezone
        fin = self.date_sortie_reelle or timezone.now()
        return (fin - self.date_entree).days
