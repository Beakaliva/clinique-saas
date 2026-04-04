from rest_framework import serializers

from .models import Patient


class PatientSerializer(serializers.ModelSerializer):
    age        = serializers.IntegerField(read_only=True)
    sexe_label = serializers.CharField(source='get_sexe_display', read_only=True)

    class Meta:
        model  = Patient
        fields = (
            'id', 'first_name', 'last_name', 'sexe', 'sexe_label',
            'date_naissance', 'age',
            'telephone', 'adresse', 'profession',
            'est_assure', 'assurance', 'code_assurance', 'pourcentage',
            'created_at', 'updated_at',
        )
        read_only_fields = ('created_at', 'updated_at')

    def validate(self, data):
        if not data.get('est_assure', getattr(self.instance, 'est_assure', False)):
            data['assurance']      = None
            data['code_assurance'] = None
            data['pourcentage']    = None
        return data
