from django.db import models
from django.utils.translation import gettext_lazy as _


class Facture(models.Model):

    class Statut(models.TextChoices):
        BROUILLON = 'brouillon', _('Brouillon')
        EMISE     = 'emise',     _('Émise')
        PAYEE     = 'payee',     _('Payée')
        PARTIELLE = 'partielle', _('Partiellement payée')
        ANNULEE   = 'annulee',   _('Annulée')

    class ModePaiement(models.TextChoices):
        ESPECES   = 'especes',   _('Espèces')
        CARTE     = 'carte',     _('Carte bancaire')
        VIREMENT  = 'virement',  _('Virement')
        ASSURANCE = 'assurance', _('Assurance')
        AUTRE     = 'autre',     _('Autre')

    clinic  = models.ForeignKey('users.Clinic',    on_delete=models.CASCADE,  related_name='factures', verbose_name=_('Clinique'))
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE,  related_name='factures', verbose_name=_('Patient'))
    caissier = models.ForeignKey('users.User',      on_delete=models.SET_NULL, null=True, blank=True, related_name='factures', verbose_name=_('Caissier'))

    numero         = models.CharField(max_length=50, unique=True, verbose_name=_('N° Facture'))
    date           = models.DateField(verbose_name=_('Date'))
    statut         = models.CharField(max_length=20, choices=Statut.choices, default=Statut.BROUILLON, verbose_name=_('Statut'))
    mode_paiement  = models.CharField(max_length=20, choices=ModePaiement.choices, blank=True, verbose_name=_('Mode de paiement'))
    montant_total  = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name=_('Montant total'))
    montant_paye   = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name=_('Montant payé'))
    notes          = models.TextField(blank=True, verbose_name=_('Notes'))

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = _('Facture')
        verbose_name_plural = _('Factures')
        ordering            = ('-date',)

    def __str__(self):
        return f"Facture {self.numero} — {self.patient}"

    @property
    def montant_restant(self):
        return self.montant_total - self.montant_paye


class LigneFacture(models.Model):

    facture       = models.ForeignKey(Facture, on_delete=models.CASCADE, related_name='lignes', verbose_name=_('Facture'))
    description   = models.CharField(max_length=255, verbose_name=_('Description'))
    quantite      = models.PositiveIntegerField(default=1, verbose_name=_('Quantité'))
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_('Prix unitaire'))

    class Meta:
        verbose_name        = _('Ligne de facture')
        verbose_name_plural = _('Lignes de facture')

    def __str__(self):
        return f"{self.description} × {self.quantite}"

    @property
    def montant(self):
        return self.quantite * self.prix_unitaire
