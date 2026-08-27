from django.apps import AppConfig


class AdminPanelConfig(AppConfig):
    """Config for the admin-console API app.

    `label` is not cosmetic. This app's directory is named `admin`, which
    would give it the app label `admin` — the label `django.contrib.admin`
    already holds. Django refuses to start with two apps under one label
    ("Application labels aren't unique"), so the console app is relabelled
    here. Renaming the directory would have been the other option; keeping
    the name the project already chose and relabelling is the smaller change.
    """

    name = 'admin'
    label = 'adminpanel'
    verbose_name = 'Admin console API'
