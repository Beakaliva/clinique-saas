from rest_framework import serializers

from .models import ExamenRadio


class ExamenRadioSerializer(serializers.ModelSerializer):
    patient_nom    = serializers.CharField(source='patient.get_full_name', read_only=True)
    demandeur_nom  = serializers.CharField(source='demandeur.get_full_name', read_only=True)
    radiologue_nom = serializers.CharField(source='radiologue.get_full_name', read_only=True)
    statut_label   = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model  = ExamenRadio
        fields = (
            'id', 'patient', 'patient_nom', 'demandeur', 'demandeur_nom',
            'radiologue', 'radiologue_nom',
            'type_examen', 'date', 'compte_rendu', 'image',
            'statut', 'statut_label', 'notes',
            'created_at', 'updated_at',
        )
        read_only_fields = ('created_at', 'updated_at')
