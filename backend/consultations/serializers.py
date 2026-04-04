from rest_framework import serializers

from .models import Consultation


class ConsultationSerializer(serializers.ModelSerializer):
    patient_nom = serializers.CharField(source='patient.get_full_name', read_only=True)
    medecin_nom = serializers.CharField(source='medecin.get_full_name', read_only=True)
    statut_label = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model  = Consultation
        fields = (
            'id', 'patient', 'patient_nom', 'medecin', 'medecin_nom',
            'date', 'motif', 'diagnostic', 'notes', 'statut', 'statut_label',
            'created_at', 'updated_at',
        )
        read_only_fields = ('created_at', 'updated_at')
