from django.apps import AppConfig


class SoinsConfig(AppConfig):
    name = 'soins'

    def ready(self):
        import soins.signals  # noqa: F401
