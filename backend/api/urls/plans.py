from django.urls import path
from api.views.plans import plans_view

urlpatterns = [
    path("", plans_view),
]