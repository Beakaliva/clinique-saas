from django.contrib import admin
from .models import LigneOrdonnance, Ordonnance


class LigneOrdonnanceInline(admin.TabularInline):
    model = LigneOrdonnance
    extra = 1


@admin.register(Ordonnance)
class OrdonnanceAdmin(admin.ModelAdmin):
    list_display  = ('patient', 'medecin', 'clinic', 'date')
    list_filter   = ('clinic',)
    search_fields = ('patient__last_name', 'patient__first_name')
    ordering      = ('-date',)
    inlines       = [LigneOrdonnanceInline]
