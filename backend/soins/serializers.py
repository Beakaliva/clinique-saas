from rest_framework import serializers

from .models import Soin, SoinActe


class SoinActeSerializer(serializers.ModelSerializer):
    montant = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model  = SoinActe
        fields = ('id', 'acte', 'qte', 'prix', 'montant')


class SoinSerializer(serializers.ModelSerializer):
    patient_nom      = serializers.CharField(source='patient.get_full_name', read_only=True)
    infirmier_nom    = serializers.CharField(source='infirmier.get_full_name', read_only=True)
    statut_label     = serializers.CharField(source='get_statut_display', read_only=True)
    consultation_ref = serializers.SerializerMethodField(read_only=True)
    actes            = SoinActeSerializer(many=True, read_only=True)
    montant_total    = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    def get_consultation_ref(self, obj):
        if obj.consultation_id:
            return {'id': obj.consultation_id, 'motif': obj.consultation.motif}
        return None

    class Meta:
        model  = Soin
        fields = (
            'id', 'patient', 'patient_nom', 'consultation', 'consultation_ref',
            'infirmier', 'infirmier_nom',
            'type_soin', 'date', 'description', 'notes', 'statut', 'statut_label',
            'actes', 'montant_total',
            'created_at', 'updated_at',
        )
        read_only_fields = ('created_at', 'updated_at')
