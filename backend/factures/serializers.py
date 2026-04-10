from rest_framework import serializers
from .models import Facture, LigneFacture, Paiement


class LigneFactureSerializer(serializers.ModelSerializer):
    montant = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model  = LigneFacture
        fields = ('id', 'description', 'quantite', 'prix_unitaire', 'montant')


class PaiementSerializer(serializers.ModelSerializer):
    payeur_label = serializers.CharField(source='get_payeur_display', read_only=True)
    mode_label   = serializers.CharField(source='get_mode_display',   read_only=True)

    class Meta:
        model  = Paiement
        fields = ('id', 'payeur', 'payeur_label', 'mode', 'mode_label', 'montant', 'date', 'notes')
        read_only_fields = ('date',)


class FactureSerializer(serializers.ModelSerializer):
    patient_nom              = serializers.CharField(source='patient.get_full_name', read_only=True)
    statut_label             = serializers.CharField(source='get_statut_display',         read_only=True)
    mode_paiement_label      = serializers.CharField(source='get_mode_paiement_display',  read_only=True)
    montant_paye             = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    montant_restant          = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    montant_paye_patient     = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    montant_paye_assurance   = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    montant_restant_patient  = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    montant_restant_assurance= serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    lignes                   = LigneFactureSerializer(many=True, read_only=True)
    paiements                = PaiementSerializer(many=True, read_only=True)

    # Infos assurance du patient (lecture seule)
    patient_assurance   = serializers.CharField(source='patient.assurance',      read_only=True)
    patient_code_assurance = serializers.CharField(source='patient.code_assurance', read_only=True)
    patient_pourcentage = serializers.DecimalField(source='patient.pourcentage', max_digits=5, decimal_places=2, read_only=True)
    patient_est_assure  = serializers.BooleanField(source='patient.est_assure',  read_only=True)

    class Meta:
        model  = Facture
        fields = (
            'id', 'numero', 'soin', 'patient', 'patient_nom',
            'patient_est_assure', 'patient_assurance', 'patient_code_assurance', 'patient_pourcentage',
            'caissier', 'date', 'statut', 'statut_label',
            'mode_paiement', 'mode_paiement_label',
            'montant_total', 'montant_paye', 'montant_restant',
            'est_assure', 'part_patient', 'part_assurance',
            'montant_paye_patient', 'montant_paye_assurance',
            'montant_restant_patient', 'montant_restant_assurance',
            'assurance_nom', 'assurance_code', 'taux_assurance',
            'notes', 'lignes', 'paiements',
            'created_at', 'updated_at',
        )
        read_only_fields = ('created_at', 'updated_at', 'numero')
