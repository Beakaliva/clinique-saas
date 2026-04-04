from rest_framework import serializers

from .models import Soin


class SoinSerializer(serializers.ModelSerializer):
    patient_nom   = serializers.CharField(source='patient.get_full_name', read_only=True)
    infirmier_nom = serializers.CharField(source='infirmier.get_full_name', read_only=True)
    statut_label  = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model  = Soin
        fields = (
            'id', 'patient', 'patient_nom', 'infirmier', 'infirmier_nom',
            'type_soin', 'date', 'description', 'notes', 'statut', 'statut_label',
            'created_at', 'updated_at',
        )
        read_only_fields = ('created_at', 'updated_at')
