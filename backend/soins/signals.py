from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from .models import SoinActe


def _sync(soin):
    """Synchronise la facture liée au soin, en ignorant les erreurs."""
    try:
        from soins.views import sync_facture_from_soin
        sync_facture_from_soin(soin)
    except Exception:
        pass


@receiver(post_save, sender=SoinActe)
def acte_saved(sender, instance, **kwargs):
    _sync(instance.soin)


@receiver(post_delete, sender=SoinActe)
def acte_deleted(sender, instance, **kwargs):
    _sync(instance.soin)
