"""
Utilitaires d'envoi d'emails pour ClinicPro.
"""
import datetime
import logging
import threading

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def _send_async(msg: EmailMultiAlternatives):
    """Envoie l'email dans un thread séparé pour ne pas bloquer la réponse."""
    try:
        msg.send(fail_silently=False)
    except Exception as exc:
        logger.error("Erreur envoi email à %s : %s", msg.to, exc)


def send_welcome_email(user, clinic):
    """
    Envoie l'email de bienvenue après l'inscription.
    Appelé depuis RegisterView — s'exécute en arrière-plan.
    """
    if not user.email:
        return  # Pas d'email renseigné, on ne fait rien

    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')

    # Modules lisibles depuis le preset
    from .clinic_config import get_preset
    preset  = get_preset(clinic.type)
    modules = [label for _, label in preset.get('modules', [])]

    context = {
        'prenom':        user.first_name,
        'nom':           user.last_name,
        'telephone':     user.telephone,
        'clinic_name':   clinic.name,
        'clinic_type':   clinic.get_type_display(),
        'dashboard_url': f"{frontend_url}/dashboard",
        'modules':       modules,
        'year':          datetime.date.today().year,
    }

    subject  = f"Bienvenue sur ClinicPro — {clinic.name} est prête !"
    text_body = render_to_string('emails/welcome.txt', context)
    html_body = render_to_string('emails/welcome.html', context)

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    msg.attach_alternative(html_body, 'text/html')

    thread = threading.Thread(target=_send_async, args=(msg,), daemon=True)
    thread.start()
