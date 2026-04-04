from django.db import models
from django.utils.translation import gettext_lazy as _


class Medicament(models.Model):

    class Forme(models.TextChoices):
        COMPRIMES  = 'comprimes',  _('Comprimés')
        GELULES    = 'gelules',    _('Gélules')
        SIROP      = 'sirop',      _('Sirop')
        INJECTABLE = 'injectable', _('Injectable')
        POMMADE    = 'pommade',    _('Pommade')
        GOUTTES    = 'gouttes',    _('Gouttes')
        AUTRE      = 'autre',      _('Autre')

    clinic        = models.ForeignKey('users.Clinic', on_delete=models.CASCADE, related_name='medicaments', verbose_name=_('Clinique'))
    nom           = models.CharField(max_length=200, verbose_name=_('Nom'))
    forme         = models.CharField(max_length=20, choices=Forme.choices, default=Forme.COMPRIMES, verbose_name=_('Forme'))
    dosage        = models.CharField(max_length=100, blank=True, verbose_name=_('Dosage'))
    unite         = models.CharField(max_length=50, blank=True, verbose_name=_('Unité (boîte, flacon…)'))
    stock_actuel  = models.PositiveIntegerField(default=0, verbose_name=_('Stock actuel'))
    stock_min     = models.PositiveIntegerField(default=5, verbose_name=_('Stock minimum'))
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name=_('Prix unitaire'))

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = _('Médicament')
        verbose_name_plural = _('Médicaments')
        ordering            = ('nom',)

    def __str__(self):
        return f"{self.nom} {self.dosage} ({self.get_forme_display()})"

    @property
    def en_rupture(self):
        return self.stock_actuel <= self.stock_min


class MouvementStock(models.Model):

    class Type(models.TextChoices):
        ENTREE  = 'entree',  _('Entrée')
        SORTIE  = 'sortie',  _('Sortie')
        AJUSTEMENT = 'ajustement', _('Ajustement')

    medicament = models.ForeignKey(Medicament, on_delete=models.CASCADE, related_name='mouvements', verbose_name=_('Médicament'))
    user       = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, verbose_name=_('Utilisateur'))
    type       = models.CharField(max_length=20, choices=Type.choices, verbose_name=_('Type'))
    quantite   = models.IntegerField(verbose_name=_('Quantité'))
    date       = models.DateTimeField(auto_now_add=True, verbose_name=_('Date'))
    notes      = models.CharField(max_length=255, blank=True, verbose_name=_('Notes'))

    class Meta:
        verbose_name        = _('Mouvement de stock')
        verbose_name_plural = _('Mouvements de stock')
        ordering            = ('-date',)

    def __str__(self):
        return f"{self.get_type_display()} {self.quantite} — {self.medicament}"
