from django.db import models
from django.utils.translation import gettext_lazy as _


class DossierMedical(models.Model):

    class GroupeSanguin(models.TextChoices):
        A_POS  = 'A+',  'A+'
        A_NEG  = 'A-',  'A-'
        B_POS  = 'B+',  'B+'
        B_NEG  = 'B-',  'B-'
        AB_POS = 'AB+', 'AB+'
        AB_NEG = 'AB-', 'AB-'
        O_POS  = 'O+',  'O+'
        O_NEG  = 'O-',  'O-'
        INCONNU = '',   _('Inconnu')

    clinic  = models.ForeignKey('users.Clinic',    on_delete=models.CASCADE, related_name='dossiers', verbose_name=_('Clinique'))
    patient = models.OneToOneField('patients.Patient', on_delete=models.CASCADE, related_name='dossier', verbose_name=_('Patient'))

    groupe_sanguin = models.CharField(max_length=3, choices=GroupeSanguin.choices, blank=True, verbose_name=_('Groupe sanguin'))
    antecedents    = models.TextField(blank=True, verbose_name=_('Antécédents médicaux'))
    allergies      = models.TextField(blank=True, verbose_name=_('Allergies'))
    traitements_en_cours = models.TextField(blank=True, verbose_name=_('Traitements en cours'))
    notes          = models.TextField(blank=True, verbose_name=_('Notes'))

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = _('Dossier médical')
        verbose_name_plural = _('Dossiers médicaux')

    def __str__(self):
        return f"Dossier — {self.patient}"


class Antecedent(models.Model):

    class Type(models.TextChoices):
        MEDICAL    = 'medical',    _('Médical')
        CHIRURGICAL = 'chirurgical', _('Chirurgical')
        FAMILIAL   = 'familial',   _('Familial')
        AUTRE      = 'autre',      _('Autre')

    dossier     = models.ForeignKey(DossierMedical, on_delete=models.CASCADE, related_name='liste_antecedents', verbose_name=_('Dossier'))
    type        = models.CharField(max_length=20, choices=Type.choices, default=Type.MEDICAL, verbose_name=_('Type'))
    description = models.TextField(verbose_name=_('Description'))
    date        = models.DateField(null=True, blank=True, verbose_name=_('Date'))

    class Meta:
        verbose_name        = _('Antécédent')
        verbose_name_plural = _('Antécédents')
        ordering            = ('-date',)

    def __str__(self):
        return f"{self.get_type_display()} — {self.dossier.patient}"
