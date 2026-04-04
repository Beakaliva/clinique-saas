from rest_framework import serializers

from .models import Hospitalisation


class HospitalisationSerializer(serializers.ModelSerializer):
    patient_nom  = serializers.CharField(source='patient.get_full_name', read_only=True)
    medecin_nom  = serializers.CharField(source='medecin.get_full_name', read_only=True)
    statut_label = serializers.CharField(source='get_statut_display', read_only=True)
    duree_jours  = serializers.IntegerField(read_only=True)

    class Meta:
        model  = Hospitalisation
        fields = (
            'id', 'patient', 'patient_nom', 'medecin', 'medecin_nom',
            'chambre', 'motif',
            'date_entree', 'date_sortie_prevue', 'date_sortie_reelle',
            'statut', 'statut_label', 'duree_jours', 'notes',
            'created_at', 'updated_at',
        )
        read_only_fields = ('created_at', 'updated_at')
