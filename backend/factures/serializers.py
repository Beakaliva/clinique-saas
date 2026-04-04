from rest_framework import serializers

from .models import Facture, LigneFacture


class LigneFactureSerializer(serializers.ModelSerializer):
    montant = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model  = LigneFacture
        fields = ('id', 'description', 'quantite', 'prix_unitaire', 'montant')


class FactureSerializer(serializers.ModelSerializer):
    patient_nom    = serializers.CharField(source='patient.get_full_name', read_only=True)
    statut_label   = serializers.CharField(source='get_statut_display', read_only=True)
    paiement_label = serializers.CharField(source='get_mode_paiement_display', read_only=True)
    montant_restant = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    lignes         = LigneFactureSerializer(many=True, read_only=True)

    class Meta:
        model  = Facture
        fields = (
            'id', 'numero', 'patient', 'patient_nom', 'caissier',
            'date', 'statut', 'statut_label',
            'mode_paiement', 'paiement_label',
            'montant_total', 'montant_paye', 'montant_restant',
            'notes', 'lignes',
            'created_at', 'updated_at',
        )
        read_only_fields = ('created_at', 'updated_at')
