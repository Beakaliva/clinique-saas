from rest_framework import serializers

from .models import Antecedent, DossierMedical


class AntecedentSerializer(serializers.ModelSerializer):
    type_label = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model  = Antecedent
        fields = ('id', 'type', 'type_label', 'description', 'date')


class DossierMedicalSerializer(serializers.ModelSerializer):
    patient_nom          = serializers.CharField(source='patient.get_full_name', read_only=True)
    liste_antecedents    = AntecedentSerializer(many=True, read_only=True)
    groupe_sanguin_label = serializers.CharField(source='get_groupe_sanguin_display', read_only=True)

    class Meta:
        model  = DossierMedical
        fields = (
            'id', 'patient', 'patient_nom',
            'groupe_sanguin', 'groupe_sanguin_label',
            'antecedents', 'allergies', 'traitements_en_cours', 'notes',
            'liste_antecedents',
            'created_at', 'updated_at',
        )
        read_only_fields = ('created_at', 'updated_at')
