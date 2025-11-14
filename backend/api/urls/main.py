from django.urls import path
from ..views import main
from api.views.main import ping

urlpatterns = [
    path("ping/", main.ping),
]
