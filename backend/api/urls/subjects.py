from django.urls import path
from api.views.subjects import list_subjects

urlpatterns = [
    path("", list_subjects),
]