from django.contrib import admin
from .models import Facture, LigneFacture


class LigneFactureInline(admin.TabularInline):
    model = LigneFacture
    extra = 1


@admin.register(Facture)
class FactureAdmin(admin.ModelAdmin):
    list_display  = ('numero', 'patient', 'clinic', 'date', 'statut', 'montant_total', 'montant_paye')
    list_filter   = ('statut', 'clinic', 'mode_paiement')
    search_fields = ('numero', 'patient__last_name', 'patient__first_name')
    ordering      = ('-date',)
    inlines       = [LigneFactureInline]
