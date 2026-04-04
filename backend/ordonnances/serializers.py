from rest_framework import serializers

from .models import LigneOrdonnance, Ordonnance


class LigneOrdonnanceSerializer(serializers.ModelSerializer):
    class Meta:
        model  = LigneOrdonnance
        fields = ('id', 'medicament', 'posologie', 'duree', 'quantite', 'notes')


class OrdonnanceSerializer(serializers.ModelSerializer):
    patient_nom = serializers.CharField(source='patient.get_full_name', read_only=True)
    medecin_nom = serializers.CharField(source='medecin.get_full_name', read_only=True)
    lignes      = LigneOrdonnanceSerializer(many=True, read_only=True)

    class Meta:
        model  = Ordonnance
        fields = (
            'id', 'patient', 'patient_nom', 'medecin', 'medecin_nom',
            'consultation', 'date', 'notes', 'lignes',
            'created_at', 'updated_at',
        )
        read_only_fields = ('created_at', 'updated_at')
