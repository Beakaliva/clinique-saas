from rest_framework import serializers

from .models import ExamenLabo


class ExamenLaboSerializer(serializers.ModelSerializer):
    patient_nom    = serializers.CharField(source='patient.get_full_name', read_only=True)
    demandeur_nom  = serializers.CharField(source='demandeur.get_full_name', read_only=True)
    laborantin_nom = serializers.CharField(source='laborantin.get_full_name', read_only=True)
    statut_label   = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model  = ExamenLabo
        fields = (
            'id', 'patient', 'patient_nom', 'demandeur', 'demandeur_nom',
            'laborantin', 'laborantin_nom',
            'type_examen', 'date_demande', 'date_resultat',
            'resultat', 'valeurs_normales', 'statut', 'statut_label', 'notes',
            'created_at', 'updated_at',
        )
        read_only_fields = ('date_demande', 'created_at', 'updated_at')
