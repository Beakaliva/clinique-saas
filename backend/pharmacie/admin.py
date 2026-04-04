from django.contrib import admin
from .models import Medicament, MouvementStock


class MouvementStockInline(admin.TabularInline):
    model          = MouvementStock
    extra          = 0
    readonly_fields = ('date',)


@admin.register(Medicament)
class MedicamentAdmin(admin.ModelAdmin):
    list_display  = ('nom', 'forme', 'dosage', 'clinic', 'stock_actuel', 'stock_min', 'prix_unitaire')
    list_filter   = ('forme', 'clinic')
    search_fields = ('nom', 'dosage')
    ordering      = ('nom',)
    inlines       = [MouvementStockInline]
