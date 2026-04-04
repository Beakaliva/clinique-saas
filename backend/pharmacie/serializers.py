from rest_framework import serializers

from .models import Medicament, MouvementStock


class MedicamentSerializer(serializers.ModelSerializer):
    forme_label = serializers.CharField(source='get_forme_display', read_only=True)
    en_rupture  = serializers.BooleanField(read_only=True)

    class Meta:
        model  = Medicament
        fields = (
            'id', 'nom', 'forme', 'forme_label', 'dosage', 'unite',
            'stock_actuel', 'stock_min', 'prix_unitaire', 'en_rupture',
            'created_at', 'updated_at',
        )
        read_only_fields = ('created_at', 'updated_at')


class MouvementStockSerializer(serializers.ModelSerializer):
    type_label      = serializers.CharField(source='get_type_display', read_only=True)
    medicament_nom  = serializers.CharField(source='medicament.nom', read_only=True)

    class Meta:
        model  = MouvementStock
        fields = ('id', 'medicament', 'medicament_nom', 'type', 'type_label', 'quantite', 'date', 'notes')
        read_only_fields = ('date',)
