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
        MOBILE    = 'mobile',    _('Mobile Money')
        AUTRE     = 'autre',     _('Autre')

    clinic   = models.ForeignKey('users.Clinic',    on_delete=models.CASCADE,  related_name='factures',  verbose_name=_('Clinique'))
    patient  = models.ForeignKey('patients.Patient', on_delete=models.CASCADE,  related_name='factures',  verbose_name=_('Patient'))
    caissier = models.ForeignKey('users.User',       on_delete=models.SET_NULL, null=True, blank=True, related_name='factures', verbose_name=_('Caissier'))
    soin     = models.OneToOneField('soins.Soin',    on_delete=models.SET_NULL, null=True, blank=True, related_name='facture',  verbose_name=_('Soin lié'))

    numero        = models.CharField(max_length=50, unique=True, verbose_name=_('N° Facture'))
    date          = models.DateField(verbose_name=_('Date'))
    statut        = models.CharField(max_length=20, choices=Statut.choices, default=Statut.BROUILLON, verbose_name=_('Statut'))
    mode_paiement = models.CharField(max_length=20, choices=ModePaiement.choices, blank=True, verbose_name=_('Mode de paiement'))
    montant_total = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name=_('Montant total'))
    notes         = models.TextField(blank=True, verbose_name=_('Notes'))

    # ── Assurance ─────────────────────────────────────────────────────────
    est_assure        = models.BooleanField(default=False, verbose_name=_('Patient assuré'))
    part_assurance    = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name=_('Part assurance'))
    part_patient      = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name=_('Part patient'))
    assurance_nom     = models.CharField(max_length=100, blank=True, verbose_name=_('Compagnie'))
    assurance_code    = models.CharField(max_length=100, blank=True, verbose_name=_('N° Police'))
    taux_assurance    = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name=_('Taux prise en charge (%)'))

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = _('Facture')
        verbose_name_plural = _('Factures')
        ordering            = ('-date',)

    def __str__(self):
        return f"Facture {self.numero} — {self.patient}"

    @property
    def montant_paye(self):
        return sum(p.montant for p in self.paiements.all())

    @property
    def montant_paye_patient(self):
        return sum(p.montant for p in self.paiements.filter(payeur='patient'))

    @property
    def montant_paye_assurance(self):
        return sum(p.montant for p in self.paiements.filter(payeur='assurance'))

    @property
    def montant_restant_patient(self):
        return max(self.part_patient - self.montant_paye_patient, 0)

    @property
    def montant_restant_assurance(self):
        return max(self.part_assurance - self.montant_paye_assurance, 0)

    @property
    def montant_restant(self):
        return max(self.montant_total - self.montant_paye, 0)


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


class Paiement(models.Model):
    """Versement partiel ou total sur une facture."""

    class Payeur(models.TextChoices):
        PATIENT   = 'patient',   _('Patient')
        ASSURANCE = 'assurance', _('Assurance')

    class Mode(models.TextChoices):
        ESPECES   = 'especes',   _('Espèces')
        CARTE     = 'carte',     _('Carte bancaire')
        VIREMENT  = 'virement',  _('Virement')
        MOBILE    = 'mobile',    _('Mobile Money')
        AUTRE     = 'autre',     _('Autre')

    facture  = models.ForeignKey(Facture, on_delete=models.CASCADE, related_name='paiements', verbose_name=_('Facture'))
    caissier = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='paiements_enregistres', verbose_name=_('Caissier'))

    payeur  = models.CharField(max_length=20, choices=Payeur.choices, default=Payeur.PATIENT, verbose_name=_('Payeur'))
    mode    = models.CharField(max_length=20, choices=Mode.choices, default=Mode.ESPECES, verbose_name=_('Mode de paiement'))
    montant = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_('Montant'))
    date    = models.DateTimeField(auto_now_add=True, verbose_name=_('Date'))
    notes   = models.CharField(max_length=255, blank=True, verbose_name=_('Notes'))

    class Meta:
        verbose_name        = _('Paiement')
        verbose_name_plural = _('Paiements')
        ordering            = ('-date',)

    def __str__(self):
        return f"{self.get_payeur_display()} — {self.montant} GNF"
