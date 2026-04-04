from django.contrib import admin
from .models import Antecedent, DossierMedical


class AntecedentInline(admin.TabularInline):
    model = Antecedent
    extra = 0


@admin.register(DossierMedical)
class DossierMedicalAdmin(admin.ModelAdmin):
    list_display  = ('patient', 'clinic', 'groupe_sanguin', 'updated_at')
    list_filter   = ('clinic', 'groupe_sanguin')
    search_fields = ('patient__last_name', 'patient__first_name')
    inlines       = [AntecedentInline]
